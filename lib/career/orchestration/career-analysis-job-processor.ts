import type { DocumentInput } from "../adapter";
import type { CareerJobRuntimeOperation, JobRecord } from "./job";
import type { CapabilityProposalProjectionReferenceRepository } from "../capability-core/projection";
import { createCandidateSourceBundle, type CandidateSourceBundleRepository, toCapabilitySourceDocuments } from "../capability-core";

export type ReportCareerJobRuntimeOperation = (
  operation: CareerJobRuntimeOperation
) => Promise<void>;

export interface CareerAnalysisJobProcessorDependencies {
  canonicalAnalysisRepository: {
    load(analysisId: string): Promise<object | null>;
    save(analysis: object): Promise<void>;
  };
  prepareDocuments(documents: unknown[]): Promise<{ normalizedDocs: DocumentInput[] }>;
  capabilityProposalExecutor: {
    execute(
      documents: DocumentInput[],
      reportOperation: ReportCareerJobRuntimeOperation
    ): Promise<unknown>;
  };
  projectionReferenceRepository?: CapabilityProposalProjectionReferenceRepository;
  /** Stage-A source provenance; this publishes no target or verification authority. */
  candidateSourceBundles?: CandidateSourceBundleRepository;
  executeLegacyCareerAnalysis(
    documents: DocumentInput[],
    reportOperation: ReportCareerJobRuntimeOperation,
    explicitAnalysisId: string
  ): Promise<{ resultAnalysisId: string; analysis: object }>;
}

function deterministicAnalysisId(jobId: string): string {
  return jobId.replace("JOB_", "ANL_");
}

/** JSON-stable copy: drops undefined-valued keys exactly as a JSON(B) round trip does. */
export function withoutUndefinedKeys<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Pins the informational load timestamp of every normalized document to one durable instant. */
export function pinDocumentLoadTime<T extends { metadata?: unknown }>(documents: T[], instant: string): T[] {
  let changed = false;
  const pinned = documents.map(document => {
    const metadata = document.metadata as Record<string, unknown> | undefined;
    if (!metadata || typeof metadata !== "object" || !("loadedAt" in metadata) || metadata.loadedAt === instant) return document;
    changed = true;
    return { ...document, metadata: { ...metadata, loadedAt: instant } };
  });
  // Unchanged input keeps its identity, so callers see exactly the prepared inventory.
  return changed ? pinned : documents;
}

/**
 * Coordinates the Career Analysis recovery path with the governed Capability
 * Proposal prerequisite. Capability artifacts are durable sidecar state and
 * never replace the canonical Career Analysis job result. An existing analysis
 * is recovery information only; it is not evidence that the sidecar ran.
 */
export function createCareerAnalysisJobProcessor(
  dependencies: CareerAnalysisJobProcessorDependencies
): (
  job: JobRecord,
  reportOperation: ReportCareerJobRuntimeOperation
) => Promise<{ resultAnalysisId: string }> {
  return async (job, reportOperation) => {
    const resultAnalysisId = deterministicAnalysisId(job.jobId);

    await reportOperation("RECOVERY_CHECK");
    const existingAnalysis = await dependencies.canonicalAnalysisRepository.load(
      resultAnalysisId
    );

    // Prepare exactly one normalized Career inventory. F10A alone converts this
    // inventory to SourceDocuments, and both sidecar and legacy paths reuse it.
    await reportOperation("SOURCE_PREPARATION");
    const prepared = await dependencies.prepareDocuments(
      (job.inputRef.sourceData as { documents: unknown[] }).documents
    );
    // D-JP-2: loaders stamp metadata.loadedAt with the wall clock. Every attempt of one job reloads
    // the same durable input, so the stamp is pinned to the job's admission time; otherwise a retry
    // rebuilds a different CSB_<jobId> bundle and fails with ERR_CANDIDATE_SOURCE_BUNDLE_IMMUTABLE_CONFLICT.
    const normalizedDocs = pinDocumentLoadTime(prepared.normalizedDocs, job.createdAt);
    const sourceBundle = dependencies.candidateSourceBundles
      ? await dependencies.candidateSourceBundles.persistCandidateSourceBundle(createCandidateSourceBundle({
        candidateSourceBundleId: `CSB_${job.jobId}`,
        // D-JP-3: the F10A bridge marks absent pages with an explicit `pages: undefined` key, which JSONB
        // drops; the persisted bundle then never equals its own write. The bundle stores the JSON-stable form.
        documents: withoutUndefinedKeys(toCapabilitySourceDocuments(normalizedDocs)),
        schemaVersion: "CANDIDATE_SOURCE_BUNDLE_V1",
        createdAt: job.createdAt,
      }))
      : null;

    // The sidecar remains a prerequisite even for recovery: returning the
    // existing canonical analysis before this point would mask missing or failed
    // Discovery/Convergence proposal state.
    const proposal = await dependencies.capabilityProposalExecutor.execute(normalizedDocs, reportOperation) as {
      kind?: unknown;
      discoveryRun?: { runId?: unknown; sourceBundleHash?: unknown };
      convergenceRun?: { convergenceRunId?: unknown; completedAt?: unknown };
    };
    const persistProjectionReference = async () => {
      // Snapshot reuse is stronger pre-existing Core state, not a proposal RUN_/
      // CONV_ pair; F11 must not fabricate lineage for that branch.
      if (proposal.kind !== "PROPOSALS_CONVERGED") return;
      if (!dependencies.projectionReferenceRepository) {
        throw new Error("ERR_CAPABILITY_PROPOSAL_PROJECTION_REFERENCE_INVALID");
      }
      const discoveryRun = proposal.discoveryRun;
      const convergenceRun = proposal.convergenceRun;
      if (
        typeof discoveryRun?.runId !== "string" ||
        typeof discoveryRun.sourceBundleHash !== "string" ||
        typeof convergenceRun?.convergenceRunId !== "string" ||
        typeof convergenceRun.completedAt !== "string"
      ) {
        throw new Error("ERR_CAPABILITY_PROPOSAL_PROJECTION_REFERENCE_INVALID");
      }
      if (sourceBundle !== null && sourceBundle.sourceBundleHash !== discoveryRun.sourceBundleHash) {
        throw new Error("ERR_CANDIDATE_SOURCE_BUNDLE_PROPOSAL_LINEAGE_INVALID");
      }
      await dependencies.projectionReferenceRepository.save({
        analysisId: resultAnalysisId,
        jobId: job.jobId,
        discoveryRunId: discoveryRun.runId,
        convergenceRunId: convergenceRun.convergenceRunId,
        ...(sourceBundle === null ? {} : { candidateSourceBundleId: sourceBundle.candidateSourceBundleId }),
        sourceBundleHash: discoveryRun.sourceBundleHash,
        // The Convergence artifact fixes this immutable lineage timestamp.
        // A recovery must never manufacture a fresh reference identity.
        createdAt: convergenceRun.completedAt
      });
    };

    if (existingAnalysis) {
      // Canonical analysis remains the Career job result contract; sidecar RUN_/
      // CONV_ artifacts do not become result fields or authority claims here.
      await persistProjectionReference();
      return { resultAnalysisId };
    }

    const legacyResult = await dependencies.executeLegacyCareerAnalysis(
      normalizedDocs,
      reportOperation,
      resultAnalysisId
    );

    // Only the legacy path persists a canonical Career Analysis. Reuse never
    // rewrites an already durable result.
    await reportOperation("PERSISTENCE");
    await dependencies.canonicalAnalysisRepository.save(legacyResult.analysis);
    await persistProjectionReference();

    return { resultAnalysisId: legacyResult.resultAnalysisId };
  };
}
