import { and, eq } from "drizzle-orm";
import { sha256Utf8, type CapabilityCoreRepository, type CapabilityProposalProjectionReferenceRepository } from "../capability-core";
import { careerAnalyses, careerAnalysisJobs } from "../db/schema";
import { JobScopeRequiredError } from "../job-scope/errors";
import { renderInvestigationScope } from "../job-scope/investigation-scope";
import type { JobScopeResolver, JobScopeSelection } from "../job-scope/scope";
import type { JobRecord } from "../orchestration/job";
import { InvestigationBoundaryError, parseDeclaredInvestigation } from "./boundary";

/**
 * analysisId → persisted investigation boundary (URL BOUNDARY CLOSURE, owner mandate 2026-10-15). An analysis opened
 * from a URL carries no mode of its own; the frontend must never take it from its current UI state. The boundary is
 * read only from persisted relations: the analysis row, its job (projection reference or SUCCEEDED job result), the
 * job's declaration (the same parseDeclaredInvestigation that admitted it and that the worker re-checks on every
 * claim) and, where a Discovery run is referenced, that run's scope hash. Nothing is inferred: whatever cannot be
 * resolved exactly is UNRESOLVED, and an unresolved analysis shows no job comparison.
 */
export type AnalysisInvestigationUnresolvedReason =
  /** No job records the analysis (stored directly, or historical). */
  | "NOT_RECORDED"
  /** The job predates the job-scope gate: neither a job scope nor an investigation was declared. */
  | "NOT_DECLARED"
  | "DECLARATION_INVALID"
  /** More than one job claims the analysis. */
  | "AMBIGUOUS"
  | "LINEAGE_INVALID"
  /**
   * The declaration and the Discovery run disagree: a PERSON_X_JOB job whose Discovery ran without a scope (e.g. before
   * e643e96), a PERSON job whose run carries one, or a run whose scope hash is not the declared selection's scope.
   */
  | "RUN_CONTRADICTS_DECLARATION"
  /** The declared selection can no longer be resolved from the stored pool, so the run's scope cannot be proven. */
  | "SCOPE_UNAVAILABLE";

export class AnalysisInvestigationError extends Error {
  constructor(
    readonly code: "ERR_ANALYSIS_INVESTIGATION_NOT_FOUND" | "ERR_ANALYSIS_INVESTIGATION_UNRESOLVED",
    readonly status: 404 | 409,
    readonly reason: AnalysisInvestigationUnresolvedReason | null
  ) { super(reason ? `${code}:${reason}` : code); }
}

export interface PersistedAnalysisInvestigation {
  investigationVersion: "ANALYSIS_INVESTIGATION_V1";
  analysisId: string;
  jobId: string;
  mode: "PERSON" | "PERSON_X_JOB";
  /** Exactly the declared selection for PERSON_X_JOB; null for PERSON. */
  jobScopeSelection: JobScopeSelection | null;
  /** JOB_DECLARATION alone where no projection reference exists (a reused verified snapshot writes none). */
  basis: "JOB_DECLARATION_AND_DISCOVERY_RUN" | "JOB_DECLARATION";
  discoveryRunId: string | null;
  investigationScopeHash: string | null;
}

export interface AnalysisInvestigationDependencies {
  analysisExists(analysisId: string): Promise<boolean>;
  succeededJobIdsForAnalysis(analysisId: string): Promise<string[]>;
  references: Pick<CapabilityProposalProjectionReferenceRepository, "getByAnalysisId">;
  runs: Pick<CapabilityCoreRepository, "getRunById" | "getConvergenceRunById">;
  jobs: { getJob(jobId: string): Promise<JobRecord | null> };
  /** Resolves the declared selection from the stored pool; read only when a scoped Discovery run must be proven. */
  scopes: JobScopeResolver;
}

const unresolved = (reason: AnalysisInvestigationUnresolvedReason): never => { throw new AnalysisInvestigationError("ERR_ANALYSIS_INVESTIGATION_UNRESOLVED", 409, reason); };

/** The Career job processor's own rule (career-analysis-job-processor.ts): the analysis id is derived from the job id. */
const analysisIdOfJob = (jobId: string) => jobId.replace("JOB_", "ANL_");

export async function readPersistedAnalysisInvestigation(deps: AnalysisInvestigationDependencies, analysisId: string): Promise<PersistedAnalysisInvestigation> {
  if (!analysisId || !(await deps.analysisExists(analysisId))) throw new AnalysisInvestigationError("ERR_ANALYSIS_INVESTIGATION_NOT_FOUND", 404, null);
  const [reference, succeeded] = await Promise.all([deps.references.getByAnalysisId(analysisId), deps.succeededJobIdsForAnalysis(analysisId)]);
  const jobIds = [...new Set([...succeeded, ...(reference ? [reference.jobId] : [])])];
  if (jobIds.length === 0) return unresolved("NOT_RECORDED");
  if (jobIds.length > 1) return unresolved("AMBIGUOUS");

  const job = await deps.jobs.getJob(jobIds[0]);
  if (!job || job.jobId !== jobIds[0] || analysisIdOfJob(job.jobId) !== analysisId || (job.resultAnalysisId != null && job.resultAnalysisId !== analysisId)) return unresolved("LINEAGE_INVALID");

  let declared;
  try { declared = parseDeclaredInvestigation(job.inputRef?.sourceData); } catch (error) {
    if (error instanceof JobScopeRequiredError) return unresolved("NOT_DECLARED");
    if (error instanceof InvestigationBoundaryError) return unresolved("DECLARATION_INVALID");
    throw error;
  }
  const jobScopeSelection = declared.mode === "PERSON_X_JOB" ? { jobPoolUploadId: declared.selection.jobPoolUploadId, poolRoleId: declared.selection.poolRoleId } : null;

  if (reference === null) {
    return { investigationVersion: "ANALYSIS_INVESTIGATION_V1", analysisId, jobId: job.jobId, mode: declared.mode, jobScopeSelection, basis: "JOB_DECLARATION", discoveryRunId: null, investigationScopeHash: null };
  }
  // The same lineage B2 proves (analysis-scope.ts): reference → Discovery run → Convergence run → source bundle.
  const [run, convergence] = await Promise.all([deps.runs.getRunById(reference.discoveryRunId), deps.runs.getConvergenceRunById(reference.convergenceRunId)]);
  if (!run || !convergence || reference.analysisId !== analysisId || run.runId !== reference.discoveryRunId
    || convergence.discoveryRunId !== run.runId || run.sourceBundleHash !== reference.sourceBundleHash) return unresolved("LINEAGE_INVALID");
  // A PERSON run never carries a scope; a PERSON_X_JOB run carries exactly one (2e5e852, e643e96).
  if ((declared.mode === "PERSON_X_JOB") !== (run.investigationScope !== undefined)) return unresolved("RUN_CONTRADICTS_DECLARATION");
  if (declared.mode === "PERSON_X_JOB") {
    // The run must have seen exactly the declared job, proven like B2: the declared selection rendered from the stored
    // pool hashes to the run's scope hash (PINK O-URL-SCOPE-IDENTITY, §3.38).
    let scopeText: string;
    try { scopeText = renderInvestigationScope(await deps.scopes.resolve(declared.selection)).text; } catch (error) {
      if (error instanceof JobScopeRequiredError) return unresolved("SCOPE_UNAVAILABLE");
      throw error;
    }
    if (sha256Utf8(scopeText) !== run.investigationScope!.scopeHash) return unresolved("RUN_CONTRADICTS_DECLARATION");
  }
  return {
    investigationVersion: "ANALYSIS_INVESTIGATION_V1", analysisId, jobId: job.jobId, mode: declared.mode, jobScopeSelection,
    basis: "JOB_DECLARATION_AND_DISCOVERY_RUN", discoveryRunId: run.runId, investigationScopeHash: run.investigationScope?.scopeHash ?? null
  };
}

type Database = Pick<typeof import("../db/client").db, "select">;

/** PostgreSQL sources: the analysis row and SUCCEEDED jobs whose result is this analysis. Read only. */
export function createPostgresAnalysisInvestigationSources(db: Database): Pick<AnalysisInvestigationDependencies, "analysisExists" | "succeededJobIdsForAnalysis"> {
  return {
    analysisExists: async analysisId => (await db.select({ analysisId: careerAnalyses.analysisId }).from(careerAnalyses).where(eq(careerAnalyses.analysisId, analysisId)).limit(1)).length === 1,
    succeededJobIdsForAnalysis: async analysisId => (await db.select({ jobId: careerAnalysisJobs.jobId }).from(careerAnalysisJobs)
      .where(and(eq(careerAnalysisJobs.resultAnalysisId, analysisId), eq(careerAnalysisJobs.status, "SUCCEEDED")))).map(row => row.jobId)
  };
}
