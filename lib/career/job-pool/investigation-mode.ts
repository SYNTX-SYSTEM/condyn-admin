import { JOB_SCOPE_REQUIRED_CODE, parseJobScope, type JobScope, type JobScopeValidation } from "./job-scope";

/**
 * Investigation boundary of the frontend (owner GO "DEMO FRONTEND", 2026-10-15; owner ruling B-INVARIANT-PERSON, PINK §3.35:
 * „Keine Analyse ohne explizit ausgestellte Untersuchungsgrenze“). The contract is GELB's (POST /api/career/analyze,
 * docs/career_analysis/THREE_INVESTIGATION_MODES.md §2): `investigation: { mode }` with exactly one key.
 *
 *   PERSON        the person, independent of any job: `{ investigation: { mode: "PERSON" } }` and never a `jobScope`.
 *   PERSON_X_JOB  the person inside the selected job (JOB POOL FIRST unchanged): `{ investigation: { mode: "PERSON_X_JOB" }, jobScope }`.
 *   JOB           the job itself, independent of any person: read through the job structure, never a document analysis.
 *
 * The mode is a selection, never an inference: PERSON is never derived from a missing job. Without an explicit choice the
 * frontend keeps the earlier ground state PERSON_X_JOB (the job-first path), so every earlier link means what it meant.
 */
export const INVESTIGATION_MODES = ["PERSON", "PERSON_X_JOB", "JOB"] as const;
export type InvestigationMode = typeof INVESTIGATION_MODES[number];
export const DEFAULT_INVESTIGATION_MODE: InvestigationMode = "PERSON_X_JOB";

/** Demo entry: an unscoped landing page starts in PERSON so automatic role discovery is reachable without a job choice. */
export function resolveDemoEntryMode(value: string | null | undefined, hasJobScope: boolean): InvestigationMode {
  return investigationModeFromParam(value) ?? (hasJobScope ? DEFAULT_INVESTIGATION_MODE : "PERSON");
}

export function resolveDemoEntryFocus(value: string | null | undefined, hasJobScope: boolean): "CAPABILITY" | "FIELD" {
  return investigationModeFromParam(value) === null && !hasJobScope ? "CAPABILITY" : "FIELD";
}

/** The backend's binding wording for an invalid or contradictory boundary (GELB lib/career/investigation/boundary.ts), verbatim. */
export const INVESTIGATION_INVALID_MESSAGE = "Bitte wähle eine eindeutige Untersuchungsgrenze.";
export const INVESTIGATION_INVALID_CODE = "ERR_INVESTIGATION_INVALID";
export const INVESTIGATION_MODE_NOT_ANALYZABLE_CODE = "ERR_INVESTIGATION_MODE_NOT_ANALYZABLE";
export type InvestigationRefusalCode = typeof JOB_SCOPE_REQUIRED_CODE | typeof INVESTIGATION_INVALID_CODE | typeof INVESTIGATION_MODE_NOT_ANALYZABLE_CODE;

/** The URL carries the chosen mode exactly; any other value is no choice. */
export const INVESTIGATION_URL_PARAM = "investigationMode";

export function isInvestigationMode(value: unknown): value is InvestigationMode {
  return typeof value === "string" && (INVESTIGATION_MODES as readonly string[]).includes(value);
}

export function investigationModeFromParam(value: string | null | undefined): InvestigationMode | null {
  return isInvestigationMode(value) ? value : null;
}

export function isInvestigationErrorCode(code: string | null | undefined): boolean {
  return code === INVESTIGATION_INVALID_CODE || code === INVESTIGATION_MODE_NOT_ANALYZABLE_CODE;
}

/** What an ANALYZE request declares besides its documents. */
export type AnalysisDeclaration =
  | { investigation: { mode: "PERSON" } }
  | { investigation: { mode: "PERSON_X_JOB" }; jobScope: JobScope };

export type AnalysisDeclarationResult =
  | { ok: true; mode: "PERSON" | "PERSON_X_JOB"; declaration: AnalysisDeclaration }
  | { ok: false; code: InvestigationRefusalCode };

/** The declaration the frontend sends for the chosen mode; PERSON_X_JOB only with a VALID job, JOB never. */
export function declareAnalysis(mode: InvestigationMode, validation: JobScopeValidation): AnalysisDeclarationResult {
  if (mode === "JOB") return { ok: false, code: INVESTIGATION_MODE_NOT_ANALYZABLE_CODE };
  if (mode === "PERSON") return { ok: true, mode, declaration: { investigation: { mode: "PERSON" } } };
  if (validation.state !== "VALID") return { ok: false, code: JOB_SCOPE_REQUIRED_CODE };
  return { ok: true, mode, declaration: { investigation: { mode: "PERSON_X_JOB" }, jobScope: { jobPoolUploadId: validation.scope.jobPoolUploadId, poolRoleId: validation.scope.poolRoleId } } };
}

/**
 * The frontend mirror of the server rule (parseDeclaredInvestigation) for a payload about to be sent: the exact
 * declaration to send, or the code the server would refuse it with. A payload without `investigation` keeps the earlier
 * contract (a formally valid job scope, else ERR_JOB_SCOPE_REQUIRED).
 */
export function checkAnalysisPayload(payload: unknown): AnalysisDeclarationResult {
  const data = payload !== null && typeof payload === "object" && !Array.isArray(payload) ? payload as Record<string, unknown> : {};
  const declared = data.investigation;
  if (declared === undefined) {
    const jobScope = parseJobScope(data.jobScope);
    return jobScope === null ? { ok: false, code: JOB_SCOPE_REQUIRED_CODE } : { ok: true, mode: "PERSON_X_JOB", declaration: { investigation: { mode: "PERSON_X_JOB" }, jobScope } };
  }
  if (declared === null || typeof declared !== "object" || Array.isArray(declared) || Object.keys(declared).length !== 1 || !isInvestigationMode((declared as { mode?: unknown }).mode)) return { ok: false, code: INVESTIGATION_INVALID_CODE };
  const mode = (declared as { mode: InvestigationMode }).mode;
  if (mode === "JOB") return { ok: false, code: INVESTIGATION_MODE_NOT_ANALYZABLE_CODE };
  if (mode === "PERSON") return data.jobScope === undefined ? { ok: true, mode, declaration: { investigation: { mode: "PERSON" } } } : { ok: false, code: INVESTIGATION_INVALID_CODE };
  const jobScope = parseJobScope(data.jobScope);
  return jobScope === null ? { ok: false, code: JOB_SCOPE_REQUIRED_CODE } : { ok: true, mode, declaration: { investigation: { mode: "PERSON_X_JOB" }, jobScope } };
}
