import { sha256Utf8, type CapabilityCoreRepository, type CapabilityProposalProjectionReferenceRepository } from "../capability-core";
import { InvestigationBoundaryError, parseDeclaredInvestigation } from "../investigation/boundary";
import type { JobRecord } from "../orchestration/job";
import { JobScopeRequiredError } from "./errors";
import { renderInvestigationScope } from "./investigation-scope";
import type { JobScopeResolver, JobScopeSelection, ResolvedJobScope } from "./scope";

/**
 * The job scope of one stored analysis, proven against its Discovery run (B2, owner decision 2026-10-15). There is no
 * fallback anywhere: the analysis must be a PERSON_X_JOB analysis, the requested selection must be exactly the one the
 * analysis was produced under, and the scope resolved today must render to exactly the scope hash of its Discovery
 * run. Otherwise the comparison is refused; it is never computed against another job, another pool or no job.
 */
export type JobComparisonErrorCode =
  | "ERR_JOB_COMPARISON_SELECTION_REQUIRED" | "ERR_JOB_COMPARISON_ANALYSIS_NOT_FOUND" | "ERR_JOB_COMPARISON_NOT_SCOPED"
  | "ERR_JOB_COMPARISON_SCOPE_MISMATCH" | "ERR_JOB_COMPARISON_SCOPE_DRIFT" | "ERR_JOB_COMPARISON_SCOPE_UNAVAILABLE"
  | "ERR_JOB_COMPARISON_LINEAGE_INVALID";

export class JobComparisonError extends Error {
  constructor(readonly code: JobComparisonErrorCode, readonly status: 400 | 404 | 409) { super(code); }
}

/** Every identity the comparison is bound to; each one is checked, none is inferred. */
export interface AnalysisScopeBinding {
  analysisId: string;
  jobId: string;
  jobPoolUploadId: string;
  poolRoleId: string;
  investigationScopeHash: string;
  discoveryRunId: string;
  convergenceRunId: string;
  poolCanonicalSha256: string;
  poolVersion: number;
  targetRoleProfileRevisionId: string;
}

export interface AnalysisScopeDependencies {
  references: Pick<CapabilityProposalProjectionReferenceRepository, "getByAnalysisId">;
  runs: Pick<CapabilityCoreRepository, "getRunById" | "getConvergenceRunById">;
  jobs: { getJob(jobId: string): Promise<JobRecord | null> };
  resolver: JobScopeResolver;
}

const refuse = (code: JobComparisonErrorCode, status: 400 | 404 | 409 = 409): never => { throw new JobComparisonError(code, status); };
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.length > 0;

/** Exactly two non-empty query values; nothing trimmed, nothing defaulted. */
export function parseRequestedSelection(jobPoolUploadId: unknown, poolRoleId: unknown): JobScopeSelection {
  if (!nonEmpty(jobPoolUploadId) || !nonEmpty(poolRoleId)) return refuse("ERR_JOB_COMPARISON_SELECTION_REQUIRED", 400);
  return { jobPoolUploadId, poolRoleId };
}

export async function resolveAnalysisJobScope(deps: AnalysisScopeDependencies, analysisId: string, requested: JobScopeSelection): Promise<{ binding: AnalysisScopeBinding; scope: ResolvedJobScope }> {
  const reference = await deps.references.getByAnalysisId(analysisId);
  if (reference === null) return refuse("ERR_JOB_COMPARISON_ANALYSIS_NOT_FOUND", 404);
  const [job, run, convergence] = await Promise.all([deps.jobs.getJob(reference.jobId), deps.runs.getRunById(reference.discoveryRunId), deps.runs.getConvergenceRunById(reference.convergenceRunId)]);
  if (!job || !run || !convergence || reference.analysisId !== analysisId || run.runId !== reference.discoveryRunId
    || convergence.discoveryRunId !== run.runId || run.sourceBundleHash !== reference.sourceBundleHash) return refuse("ERR_JOB_COMPARISON_LINEAGE_INVALID");

  let declared;
  try { declared = parseDeclaredInvestigation(job.inputRef?.sourceData); } catch (error) {
    if (error instanceof JobScopeRequiredError || error instanceof InvestigationBoundaryError) return refuse("ERR_JOB_COMPARISON_NOT_SCOPED");
    throw error;
  }
  if (declared.mode !== "PERSON_X_JOB" || run.investigationScope === undefined) return refuse("ERR_JOB_COMPARISON_NOT_SCOPED");
  if (declared.selection.jobPoolUploadId !== requested.jobPoolUploadId || declared.selection.poolRoleId !== requested.poolRoleId) return refuse("ERR_JOB_COMPARISON_SCOPE_MISMATCH");

  let scope: ResolvedJobScope;
  try { scope = await deps.resolver.resolve(declared.selection); } catch (error) {
    if (error instanceof JobScopeRequiredError) return refuse("ERR_JOB_COMPARISON_SCOPE_UNAVAILABLE");
    throw error;
  }
  if (sha256Utf8(renderInvestigationScope(scope).text) !== run.investigationScope.scopeHash) return refuse("ERR_JOB_COMPARISON_SCOPE_DRIFT");

  return {
    scope,
    binding: {
      analysisId, jobId: job.jobId, jobPoolUploadId: scope.selection.jobPoolUploadId, poolRoleId: scope.selection.poolRoleId,
      investigationScopeHash: run.investigationScope.scopeHash, discoveryRunId: run.runId, convergenceRunId: convergence.convergenceRunId,
      poolCanonicalSha256: scope.poolCanonicalSha256, poolVersion: scope.poolVersion, targetRoleProfileRevisionId: scope.roleMapping.targetRoleProfileRevisionId
    }
  };
}
