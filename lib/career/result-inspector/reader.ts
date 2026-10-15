import {
  sha256Utf8, stableJsonStringify, type CandidateSourceBundleRepository, type CapabilityCoreRepository, type CapabilityDiscoveryRun,
  type CapabilityDiscoveryRunPayload, type CapabilityProposalProjection, type CapabilityProposalProjectionReferenceRepository,
  type CapabilityProviderResponseRecord
} from "../capability-core";
import type { CapabilityConvergenceRun } from "../capability-core/convergence";
import type { JobRecord } from "../orchestration/job";
import type { ProviderExchangeStore } from "./retention";

/**
 * Gemini Result Inspector (SFE 2026-10-15): the persisted artifacts of exactly one analysis, phase by phase.
 *
 * It only reads. It holds no provider and therefore can never start Gemini or a new analysis. Every section is the
 * persisted artifact itself, never a reconstruction: the original response and the scope text are the exchange kept
 * in the bounded exchange archive (retention.ts), the parser result is the stored kernel output, verification is the
 * stored candidate list, Convergence is the stored Convergence run and the projection is the existing read model.
 * Without a retained exchange (no archive, expired, deleted, or older than retention) the section says NOT_RETAINED
 * and never shows a processed artifact in its place. The lineage is the immutable projection reference
 * (analysis → RUN_/CONV_ pair) and the exchange must carry the same RUN_ id and scope hash; nothing is repaired or
 * searched for another run.
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
    | ({ state: "RETAINED"; textMatchesSha256: boolean; parserResultMatchesText: boolean; retainedAt: string; expiresAt: string } & CapabilityProviderResponseRecord)
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
  exchanges?: Pick<ProviderExchangeStore, "get">;
}

const lineage = (): never => { throw new ResultInspectionError("ERR_RESULT_INSPECTION_LINEAGE_INVALID", 409); };
const str = (value: unknown): string | null => typeof value === "string" ? value : null;

/** Only the two selection keys of the job input; the documents (candidate PDFs) never leave through the inspector. */
function jobScopeSelectionOf(job: JobRecord | null): { jobPoolUploadId: string; poolRoleId: string } | null {
  const scope = (job?.inputRef?.sourceData as { jobScope?: { jobPoolUploadId?: unknown; poolRoleId?: unknown } } | undefined)?.jobScope;
  return typeof scope?.jobPoolUploadId === "string" && typeof scope.poolRoleId === "string"
    ? { jobPoolUploadId: scope.jobPoolUploadId, poolRoleId: scope.poolRoleId }
    : null;
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
      const exchange = dependencies.exchanges ? await dependencies.exchanges.get(discovery.runId) : null;
      if (exchange && (exchange.runId !== discovery.runId || (exchange.investigationScope?.scopeHash ?? null) !== (scope?.scopeHash ?? null))) lineage();
      const response = exchange?.response;

      return {
        inspectionVersion: GEMINI_RESULT_INSPECTION_VERSION,
        analysisId,
        jobId: reference.jobId,
        investigationInput: {
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
          ? { state: "RETAINED", ...response, textMatchesSha256: sha256Utf8(response.text) === response.textSha256, parserResultMatchesText: parsedEquals(response.text, payload.kernelOutput), retainedAt: exchange.retainedAt, expiresAt: exchange.expiresAt }
          : { state: "NOT_RETAINED" },
        parserResult: { kernelOutput: payload.kernelOutput ?? null, rawOutputHash: discovery.rawOutputHash ?? null },
        evidenceVerification: { candidates: payload.candidates },
        convergence: { convergenceRunId: convergence.convergenceRunId, createdAt: convergence.createdAt, payload: convergence.payload },
        projection: await dependencies.projection.read(analysisId).catch(lineage)
      };
    }
  };
}
