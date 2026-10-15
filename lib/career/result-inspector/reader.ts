import {
  sha256Utf8, stableJsonStringify, type CandidateSourceBundleRepository, type CapabilityCoreRepository, type CapabilityDiscoveryRun,
  type CapabilityDiscoveryRunPayload, type CapabilityProposalProjection, type CapabilityProposalProjectionReferenceRepository,
  type CapabilityProviderResponseRecord
} from "../capability-core";
import type { CapabilityConvergenceRun } from "../capability-core/convergence";
import type { JobRecord } from "../orchestration/job";
import type { ExchangeAttempt } from "./attempt";
import type { ProviderExchangeStore, RetainedProviderExchange } from "./retention";

/**
 * Gemini Result Inspector (SFE 2026-10-15): the persisted artifacts of exactly one analysis, phase by phase.
 *
 * It only reads. It holds no provider and therefore can never start Gemini or a new analysis. Every section is the
 * persisted artifact itself, never a reconstruction: the original response and the scope text are the exchange kept
 * in the bounded exchange archive (retention.ts), the parser result is the stored kernel output, verification is the
 * stored candidate list, Convergence is the stored Convergence run and the projection is the existing read model.
 * Without a retained exchange (no archive, expired, deleted, or older than retention) the section says NOT_RETAINED
 * and never shows a processed artifact in its place. The lineage is the immutable projection reference
 * (analysis → RUN_/CONV_ pair); the exchange shown is the single COMPLETED exchange of that RUN_ id and must carry the
 * run's scope hash and request identity (sources, kernel checksum, provider, model, schema); nothing is repaired or
 * searched for another run. Failed exchanges never reach an analysis; createGeminiExchangeInspector shows them per job.
 */
export const GEMINI_RESULT_INSPECTION_VERSION = "GEMINI_RESULT_INSPECTION_V1" as const;

export class ResultInspectionError extends Error {
  constructor(readonly code: "ERR_RESULT_INSPECTION_NOT_FOUND" | "ERR_RESULT_INSPECTION_LINEAGE_INVALID", readonly status: 404 | 409) {
    super(code);
  }
}

export interface GeminiResultInspection {
  inspectionVersion: typeof GEMINI_RESULT_INSPECTION_VERSION;
  analysisId: string;
  jobId: string;
  investigationInput: {
    /** The investigation boundary the job declared (three modes); UNDECLARED for jobs that name neither. */
    investigationMode: "PERSON" | "PERSON_X_JOB" | "UNDECLARED";
    jobScopeSelection: { jobPoolUploadId: string; poolRoleId: string } | null;
    investigationScope: { state: "RETAINED"; scopeHash: string; text: string; textMatchesScopeHash: boolean; expiresAt: string } | { state: "NOT_RETAINED"; scopeHash: string } | { state: "UNSCOPED" };
    discoveryRunId: string;
    discoveryRunCreatedAt: string;
    jobCreatedAt: string | null;
    sourceBundleHash: string;
    kernel: { kernelVersion: string; templateId: string | null; versionId: string | null; checksum: string };
    inference: { provider: string; model: string };
    schemaVersion: string;
    sourceDocuments: Array<{ docId: string; title: string; mimeType: string | null; rawContentHash: string; normalizedTextHash: string }> | null;
  };
  originalGeminiResponse:
    | ({ state: "RETAINED"; exchangeId: string; attempt: ExchangeAttempt | null; request: RetainedProviderExchange["request"]; textMatchesSha256: boolean; parserResultMatchesText: boolean; retainedAt: string; expiresAt: string } & CapabilityProviderResponseRecord)
    | { state: "NOT_RETAINED" };
  parserResult: { kernelOutput: unknown; rawOutputHash: string | null };
  evidenceVerification: { candidates: unknown[] };
  convergence: { convergenceRunId: string; createdAt: string; payload: CapabilityConvergenceRun["payload"] };
  projection: CapabilityProposalProjection | null;
}

export interface GeminiResultInspectorDependencies {
  references: Pick<CapabilityProposalProjectionReferenceRepository, "getByAnalysisId">;
  capabilityRepository: Pick<CapabilityCoreRepository, "getRunById" | "getConvergenceRunById">;
  sourceBundles: Pick<CandidateSourceBundleRepository, "getCandidateSourceBundleById">;
  jobs: { getJob(jobId: string): Promise<JobRecord | null> };
  projection: { read(analysisId: string): Promise<CapabilityProposalProjection | null> };
  /** The bounded exchange archive; absent means no exchange is retained anywhere (every response NOT_RETAINED). */
  exchanges?: Pick<ProviderExchangeStore, "completedForRun">;
}

const lineage = (): never => { throw new ResultInspectionError("ERR_RESULT_INSPECTION_LINEAGE_INVALID", 409); };
const str = (value: unknown): string | null => typeof value === "string" ? value : null;

function investigationModeOf(job: JobRecord | null): "PERSON" | "PERSON_X_JOB" | "UNDECLARED" {
  const data = job?.inputRef?.sourceData as { investigation?: { mode?: unknown }; jobScope?: unknown } | undefined;
  if (data?.investigation?.mode === "PERSON") return "PERSON";
  if (data?.investigation?.mode === "PERSON_X_JOB" || (data?.investigation === undefined && data?.jobScope !== undefined)) return "PERSON_X_JOB";
  return "UNDECLARED";
}

/** Only the two selection keys of the job input; the documents (candidate PDFs) never leave through the inspector. */
function jobScopeSelectionOf(job: JobRecord | null): { jobPoolUploadId: string; poolRoleId: string } | null {
  const scope = (job?.inputRef?.sourceData as { jobScope?: { jobPoolUploadId?: unknown; poolRoleId?: unknown } } | undefined)?.jobScope;
  return typeof scope?.jobPoolUploadId === "string" && typeof scope.poolRoleId === "string"
    ? { jobPoolUploadId: scope.jobPoolUploadId, poolRoleId: scope.poolRoleId }
    : null;
}

/** The exchange the run was persisted from: same RUN_ id, outcome, scope hash and request identity as the run itself. */
function exchangeBelongsToRun(exchange: RetainedProviderExchange, run: CapabilityDiscoveryRun): boolean {
  return exchange.runId === run.runId && exchange.outcome === "COMPLETED"
    && (exchange.investigationScope?.scopeHash ?? null) === (run.investigationScope?.scopeHash ?? null)
    && exchange.request.sourceBundleHash === run.sourceBundleHash && exchange.request.promptChecksum === run.prompt.checksum
    && exchange.request.provider === run.inference.provider && exchange.request.model === run.inference.model && exchange.request.schemaVersion === run.schemaVersion;
}

function parsedEquals(text: string, kernelOutput: unknown): boolean {
  try { return stableJsonStringify(JSON.parse(text)) === stableJsonStringify(kernelOutput); } catch { return false; }
}

export function createGeminiResultInspector(dependencies: GeminiResultInspectorDependencies): { read(analysisId: string): Promise<GeminiResultInspection> } {
  return {
    async read(analysisId) {
      const reference = await dependencies.references.getByAnalysisId(analysisId);
      if (reference === null) throw new ResultInspectionError("ERR_RESULT_INSPECTION_NOT_FOUND", 404);
      if (reference.analysisId !== analysisId) lineage();
      const discovery: CapabilityDiscoveryRun | null = await dependencies.capabilityRepository.getRunById(reference.discoveryRunId);
      const convergence = await dependencies.capabilityRepository.getConvergenceRunById(reference.convergenceRunId);
      if (!discovery || !convergence) return lineage();
      if (discovery.runId !== reference.discoveryRunId || convergence.convergenceRunId !== reference.convergenceRunId ||
        convergence.discoveryRunId !== discovery.runId || discovery.sourceBundleHash !== reference.sourceBundleHash) lineage();
      const payload = discovery.payload as Partial<CapabilityDiscoveryRunPayload> | null;
      if (!payload || typeof payload !== "object" || !Array.isArray(payload.candidates)) return lineage();

      const job = await dependencies.jobs.getJob(reference.jobId);
      const bundle = reference.candidateSourceBundleId ? await dependencies.sourceBundles.getCandidateSourceBundleById(reference.candidateSourceBundleId) : null;
      if (bundle && bundle.sourceBundleHash !== discovery.sourceBundleHash) lineage();
      const scope = discovery.investigationScope;
      const completed = dependencies.exchanges ? await dependencies.exchanges.completedForRun(discovery.runId) : [];
      if (completed.length > 1) lineage();
      const exchange = completed[0] ?? null;
      if (exchange && !exchangeBelongsToRun(exchange, discovery)) lineage();
      const response = exchange?.response;

      return {
        inspectionVersion: GEMINI_RESULT_INSPECTION_VERSION,
        analysisId,
        jobId: reference.jobId,
        investigationInput: {
          investigationMode: investigationModeOf(job),
          jobScopeSelection: jobScopeSelectionOf(job),
          investigationScope: !scope
            ? { state: "UNSCOPED" }
            : exchange?.investigationScope
              ? { state: "RETAINED", scopeHash: scope.scopeHash, text: exchange.investigationScope.text, textMatchesScopeHash: sha256Utf8(exchange.investigationScope.text) === scope.scopeHash, expiresAt: exchange.expiresAt }
              : { state: "NOT_RETAINED", scopeHash: scope.scopeHash },
          discoveryRunId: discovery.runId,
          discoveryRunCreatedAt: discovery.createdAt,
          jobCreatedAt: job?.createdAt ?? null,
          sourceBundleHash: discovery.sourceBundleHash,
          kernel: { kernelVersion: discovery.kernelVersion, templateId: str(discovery.prompt.templateId), versionId: str(discovery.prompt.versionId), checksum: discovery.prompt.checksum },
          inference: { provider: discovery.inference.provider, model: discovery.inference.model },
          schemaVersion: discovery.schemaVersion,
          sourceDocuments: bundle
            ? bundle.documents.map(document => ({ docId: document.docId, title: document.title, mimeType: document.mimeType ?? null, rawContentHash: document.rawContentHash, normalizedTextHash: document.normalizedTextHash }))
            : null
        },
        originalGeminiResponse: exchange && response && typeof response.text === "string"
          ? { state: "RETAINED", exchangeId: exchange.exchangeId, attempt: exchange.attempt, request: exchange.request, ...response, textMatchesSha256: sha256Utf8(response.text) === response.textSha256, parserResultMatchesText: parsedEquals(response.text, payload.kernelOutput), retainedAt: exchange.retainedAt, expiresAt: exchange.expiresAt }
          : { state: "NOT_RETAINED" },
        parserResult: { kernelOutput: payload.kernelOutput ?? null, rawOutputHash: discovery.rawOutputHash ?? null },
        evidenceVerification: { candidates: payload.candidates },
        convergence: { convergenceRunId: convergence.convergenceRunId, createdAt: convergence.createdAt, payload: convergence.payload },
        projection: await dependencies.projection.read(analysisId).catch(lineage)
      };
    }
  };
}

/**
 * Every archived Discovery exchange of one job, successful and failed, in the order received (Result Inspector).
 * Attribution is the job attempt recorded when the exchange was retained; nothing is inferred from timing or content.
 * A failed exchange is the refused response itself with its stable error code; it never becomes an analysis artifact.
 */
export const GEMINI_EXCHANGE_INSPECTION_VERSION = "GEMINI_EXCHANGE_INSPECTION_V1" as const;

export interface GeminiExchangeInspection {
  inspectionVersion: typeof GEMINI_EXCHANGE_INSPECTION_VERSION;
  jobId: string;
  exchanges: Array<RetainedProviderExchange & { textMatchesSha256: boolean | null; scopeTextMatchesScopeHash: boolean | null }>;
}

export function createGeminiExchangeInspector(dependencies: { jobs: { getJob(jobId: string): Promise<JobRecord | null> }; exchanges?: Pick<ProviderExchangeStore, "forJob"> }): { read(jobId: string): Promise<GeminiExchangeInspection> } {
  return {
    async read(jobId) {
      if (await dependencies.jobs.getJob(jobId) === null) throw new ResultInspectionError("ERR_RESULT_INSPECTION_NOT_FOUND", 404);
      const exchanges = dependencies.exchanges ? await dependencies.exchanges.forJob(jobId) : [];
      if (exchanges.some(exchange => exchange.attempt?.jobId !== jobId)) lineage();
      return {
        inspectionVersion: GEMINI_EXCHANGE_INSPECTION_VERSION,
        jobId,
        exchanges: exchanges.map(exchange => ({
          ...exchange,
          textMatchesSha256: exchange.response.text === null ? null : sha256Utf8(exchange.response.text) === exchange.response.textSha256,
          scopeTextMatchesScopeHash: exchange.investigationScope === null ? null : sha256Utf8(exchange.investigationScope.text) === exchange.investigationScope.scopeHash
        }))
      };
    }
  };
}
