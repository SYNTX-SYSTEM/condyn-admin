import type { JobRecord } from "../orchestration/job";
import type { ReportCareerJobRuntimeOperation } from "../orchestration/career-analysis-job-processor";
import { runWithJobScope } from "./context";
import { parseJobScopeSelection, type JobScopeResolver, type ResolvedJobScope } from "./scope";

type ProcessCareerJob = (job: JobRecord, reportOperation: ReportCareerJobRuntimeOperation) => Promise<{ resultAnalysisId: string }>;
type ProcessScopedCareerJob = (job: JobRecord, reportOperation: ReportCareerJobRuntimeOperation, jobScope: ResolvedJobScope) => Promise<{ resultAnalysisId: string }>;

/**
 * Worker boundary of the invariant JOB POOL FIRST. Every claimed job is validated against the stored Job Pool
 * before the processor runs: source preparation, the capability sweep and every Gemini call happen only for a job
 * whose durable input names a valid pool and a role of that pool. Otherwise the job fails terminally
 * (ERR_JOB_SCOPE_REQUIRED / ERR_JOB_SCOPE_INVALID) without any work. The processor receives the scope issued for
 * this attempt and hands it to capabilityProposalExecutor.execute (investigation space of Capability Discovery).
 *
 * The validation runs on every claim, so a retried or recovered job is validated again against the pool as it is
 * stored at that moment; nothing from an earlier attempt is trusted. The validated scope stays open for the whole
 * attempt (requireActiveJobScope).
 */
export function requireValidJobScope(resolver: JobScopeResolver, processJob: ProcessScopedCareerJob): ProcessCareerJob {
  return async (job, reportOperation) => {
    const sourceData = job.inputRef?.sourceData as { jobScope?: unknown } | null | undefined;
    const selection = parseJobScopeSelection(sourceData && typeof sourceData === "object" ? sourceData.jobScope : undefined);
    const scope = await resolver.resolve(selection);
    return runWithJobScope(scope, () => processJob(job, reportOperation, scope));
  };
}
