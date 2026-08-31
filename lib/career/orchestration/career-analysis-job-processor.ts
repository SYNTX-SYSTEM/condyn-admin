import type { DocumentInput } from "../adapter";
import type { CareerJobRuntimeOperation, JobRecord } from "./job";

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
 * never replace the canonical Career Analysis job result.
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

    await reportOperation("SOURCE_PREPARATION");
    const { normalizedDocs } = await dependencies.prepareDocuments(
      (job.inputRef.sourceData as { documents: unknown[] }).documents
    );

    await dependencies.capabilityProposalExecutor.execute(normalizedDocs, reportOperation);

    if (existingAnalysis) {
      return { resultAnalysisId };
    }

    const legacyResult = await dependencies.executeLegacyCareerAnalysis(
      normalizedDocs,
      reportOperation,
      resultAnalysisId
    );

    await reportOperation("PERSISTENCE");
    await dependencies.canonicalAnalysisRepository.save(legacyResult.analysis);

    return { resultAnalysisId: legacyResult.resultAnalysisId };
  };
}
