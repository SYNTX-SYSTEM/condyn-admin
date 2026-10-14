import type { JobRecord } from "../orchestration/job";
import type { ReportCareerJobRuntimeOperation } from "../orchestration/career-analysis-job-processor";
import { parseJobScopeSelection, type JobScopeResolver } from "./scope";

type ProcessCareerJob = (job: JobRecord, reportOperation: ReportCareerJobRuntimeOperation) => Promise<{ resultAnalysisId: string }>;

/**
 * Worker boundary of the invariant JOB POOL FIRST. Every claimed job is validated against the stored Job Pool
 * before the processor runs: source preparation, the capability sweep and every Gemini call happen only for a job
 * whose durable input names a valid pool and a role of that pool. Otherwise the job fails terminally
 * (ERR_JOB_SCOPE_REQUIRED / ERR_JOB_SCOPE_INVALID) without any work. The processor itself is unchanged.
 */
export function requireValidJobScope(resolver: JobScopeResolver, processJob: ProcessCareerJob): ProcessCareerJob {
  return async (job, reportOperation) => {
    const sourceData = job.inputRef?.sourceData as { jobScope?: unknown } | null | undefined;
    const selection = parseJobScopeSelection(sourceData && typeof sourceData === "object" ? sourceData.jobScope : undefined);
    await resolver.resolve(selection);
    return processJob(job, reportOperation);
  };
}
