/**
 * Browser-safe client of GET /api/career/analyses/{analysisId}/investigation (URL BOUNDARY CLOSURE, GRÜN integrates it
 * on its own mandate). Type-only imports, no storage, GET only, no retry. The decoder is strict: anything that is not
 * exactly an ANALYSIS_INVESTIGATION_V1 record is FAILED, and FAILED, UNRESOLVED, NOT_FOUND and a pending read all mean
 * the same for the job comparison: none is shown.
 */
import type { AnalysisInvestigationUnresolvedReason, PersistedAnalysisInvestigation } from "./persisted";

export type AnalysisInvestigationReadState =
  | { state: "RESOLVED"; value: PersistedAnalysisInvestigation }
  | { state: "UNRESOLVED"; reason: AnalysisInvestigationUnresolvedReason | null }
  | { state: "NOT_FOUND" }
  | { state: "FAILED" };

type Fetch = (input: string, init: { method: "GET"; cache: "no-store"; signal?: AbortSignal }) => Promise<{ status: number; json(): Promise<unknown> }>;

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const KEYS = ["analysisId", "basis", "discoveryRunId", "investigationScopeHash", "investigationVersion", "jobId", "jobScopeSelection", "mode"];
const REASONS: readonly string[] = ["NOT_RECORDED", "NOT_DECLARED", "DECLARATION_INVALID", "AMBIGUOUS", "LINEAGE_INVALID", "RUN_CONTRADICTS_DECLARATION"];

export function decodeAnalysisInvestigation(value: unknown): PersistedAnalysisInvestigation | null {
  if (!isRecord(value) || Object.keys(value).sort().join() !== KEYS.join() || value.investigationVersion !== "ANALYSIS_INVESTIGATION_V1") return null;
  if (!nonEmpty(value.analysisId) || !nonEmpty(value.jobId)) return null;
  const selection = value.jobScopeSelection;
  if (value.mode === "PERSON") { if (selection !== null || value.investigationScopeHash !== null) return null; }
  else if (value.mode === "PERSON_X_JOB") {
    if (!isRecord(selection) || Object.keys(selection).sort().join() !== "jobPoolUploadId,poolRoleId" || !nonEmpty(selection.jobPoolUploadId) || !nonEmpty(selection.poolRoleId)) return null;
  } else return null;
  if (value.basis === "JOB_DECLARATION") { if (value.discoveryRunId !== null || value.investigationScopeHash !== null) return null; }
  else if (value.basis === "JOB_DECLARATION_AND_DISCOVERY_RUN") {
    if (!nonEmpty(value.discoveryRunId) || (value.mode === "PERSON_X_JOB") !== nonEmpty(value.investigationScopeHash)) return null;
  } else return null;
  return value as unknown as PersistedAnalysisInvestigation;
}

export async function readAnalysisInvestigation(fetchImpl: Fetch, analysisId: string, signal?: AbortSignal): Promise<AnalysisInvestigationReadState> {
  let response, body: unknown;
  try {
    response = await fetchImpl(`/api/career/analyses/${encodeURIComponent(analysisId)}/investigation`, { method: "GET", cache: "no-store", signal });
    body = await response.json();
  } catch { return { state: "FAILED" }; }
  const issue = isRecord(body) && Array.isArray(body.issues) && isRecord(body.issues[0]) ? body.issues[0] : null;
  if (response.status === 404 && issue?.code === "ERR_ANALYSIS_INVESTIGATION_NOT_FOUND") return { state: "NOT_FOUND" };
  if (response.status === 409 && issue?.code === "ERR_ANALYSIS_INVESTIGATION_UNRESOLVED") {
    return { state: "UNRESOLVED", reason: REASONS.includes(issue.reason as string) ? issue.reason as AnalysisInvestigationUnresolvedReason : null };
  }
  if (response.status !== 200 || !isRecord(body) || body.success !== true) return { state: "FAILED" };
  const decoded = decodeAnalysisInvestigation(body.investigation);
  // The answer must be about the analysis that was asked for.
  return decoded === null || decoded.analysisId !== analysisId ? { state: "FAILED" } : { state: "RESOLVED", value: decoded };
}

/**
 * The legacy job comparison may be shown for an analysis only when its persisted boundary is PERSON_X_JOB and the
 * pool it is compared against is exactly the pool the analysis was investigated in. The legacy comparison is
 * pool-wide (B2 left it unchanged), so its operand is the pool: another pool or pool version would compare an analysis
 * across job scopes. The role-exact view is B2 (comparisonBelongsToSelection). PERSON, another pool, an unresolved,
 * failed or still pending read: no comparison.
 */
export function legacyJobComparisonPermitted(read: AnalysisInvestigationReadState | null | undefined, comparison: { analysisId: string; jobPoolUploadId: string } | null): boolean {
  if (!read || read.state !== "RESOLVED" || !comparison) return false;
  const { value } = read;
  return value.mode === "PERSON_X_JOB" && value.analysisId === comparison.analysisId && value.jobScopeSelection !== null
    && value.jobScopeSelection.jobPoolUploadId === comparison.jobPoolUploadId;
}
