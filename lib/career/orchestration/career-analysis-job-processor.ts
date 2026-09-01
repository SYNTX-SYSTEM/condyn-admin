import type { DocumentInput } from "../adapter";
import type { CareerJobRuntimeOperation, JobRecord } from "./job";
import type { CapabilityProposalProjectionReferenceRepository } from "../capability-core/projection";

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
  executeLegacyCareerAnalysis(
    documents: DocumentInput[],
    reportOperation: ReportCareerJobRuntimeOperation,
    explicitAnalysisId: string
  ): Promise<{ resultAnalysisId: string; analysis: object }>;
}

function deterministicAnalysisId(jobId: string): string {
  return jobId.replace("JOB_", "ANL_");
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
    const { normalizedDocs } = await dependencies.prepareDocuments(
      (job.inputRef.sourceData as { documents: unknown[] }).documents
    );

    // The sidecar remains a prerequisite even for recovery: returning the
    // existing canonical analysis before this point would mask missing or failed
    // Discovery/Convergence proposal state.
    const proposal = await dependencies.capabilityProposalExecutor.execute(normalizedDocs, reportOperation) as {
      kind?: unknown;
      discoveryRun?: { runId?: unknown; sourceBundleHash?: unknown };
      convergenceRun?: { convergenceRunId?: unknown; completedAt?: unknown };
    };
    const persistProjectionReference = async () => {
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
      await dependencies.projectionReferenceRepository.save({
        analysisId: resultAnalysisId,
        jobId: job.jobId,
        discoveryRunId: discoveryRun.runId,
        convergenceRunId: convergenceRun.convergenceRunId,
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
