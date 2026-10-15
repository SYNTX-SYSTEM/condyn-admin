import type { JobRecord } from "../orchestration/job";
import type { ReportCareerJobRuntimeOperation } from "../orchestration/career-analysis-job-processor";
import { issuePersonInvestigation, parseDeclaredInvestigation, type AnalysisBoundary } from "../investigation/boundary";
import { runWithPersonInvestigation } from "../investigation/context";
import { runWithJobScope } from "./context";
import type { JobScopeResolver } from "./scope";

type ProcessCareerJob = (job: JobRecord, reportOperation: ReportCareerJobRuntimeOperation) => Promise<{ resultAnalysisId: string }>;
type ProcessScopedCareerJob = (job: JobRecord, reportOperation: ReportCareerJobRuntimeOperation, boundary: AnalysisBoundary) => Promise<{ resultAnalysisId: string }>;

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
 *
 * Three investigation modes (owner GO 2026-10-15): a job that explicitly declares investigation { mode: "PERSON" }
 * runs without a job scope inside an issued person investigation (requireActiveAnalysisBoundary); a job without a
 * declaration, or with PERSON_X_JOB, is validated exactly as before. A contradictory or unknown declaration fails
 * terminally (ERR_INVESTIGATION_INVALID / ERR_INVESTIGATION_MODE_NOT_ANALYZABLE) before any work.
 */
export function requireValidJobScope(resolver: JobScopeResolver, processJob: ProcessScopedCareerJob): ProcessCareerJob {
  return async (job, reportOperation) => {
    const declared = parseDeclaredInvestigation(job.inputRef?.sourceData);
    if (declared.mode === "PERSON") {
      const person = issuePersonInvestigation(declared);
      return runWithPersonInvestigation(person, () => processJob(job, reportOperation, person));
    }
    const scope = await resolver.resolve(declared.selection);
    return runWithJobScope(scope, () => processJob(job, reportOperation, scope));
  };
}
