import { JobScopeRequiredError } from "../job-scope/errors";
import { assertIssuedJobScope, parseJobScopeSelection, type JobScopeSelection, type ResolvedJobScope } from "../job-scope/scope";

/**
 * SFE invariant (owner GO 2026-10-15, three investigation modes): no analysis without an explicit investigation
 * boundary. A job scope is required only where the chosen mode requires it.
 *
 *   PERSON        the person and her capabilities, independent of any job. Sources: the candidate documents only.
 *   PERSON_X_JOB  the person inside the explicit scope of the selected job (the existing JOB POOL FIRST path).
 *   JOB           the job itself, independent of any person. Read-only, deterministic (job-pools/…/structure);
 *                 never an analysis of documents, so the analyze route refuses it.
 *
 * A request that declares no investigation keeps the earlier contract byte for byte: with a job scope it is
 * PERSON_X_JOB, without one it is refused with the owner's job-scope sentence. PERSON is never inferred from a missing
 * field; it must be declared, and it excludes a job scope.
 */
export const INVESTIGATION_MODES = ["PERSON", "PERSON_X_JOB", "JOB"] as const;
export type InvestigationMode = typeof INVESTIGATION_MODES[number];

export const INVESTIGATION_INVALID_MESSAGE = "Bitte wähle eine eindeutige Untersuchungsgrenze.";
export type InvestigationErrorCode = "ERR_INVESTIGATION_INVALID" | "ERR_INVESTIGATION_MODE_NOT_ANALYZABLE";

export class InvestigationBoundaryError extends Error {
  readonly code: InvestigationErrorCode;
  constructor(code: InvestigationErrorCode, readonly detail = "") {
    super(INVESTIGATION_INVALID_MESSAGE);
    this.code = code;
    // Terminal for the Career worker: a contradictory boundary never becomes valid by retrying.
    this.name = "TERMINAL_ERROR";
  }
}

/** The person-only boundary as issued for one analysis attempt. */
export interface PersonInvestigation { readonly mode: "PERSON"; }

/** An issued analysis boundary: an issued job scope (PERSON_X_JOB) or an issued person investigation (PERSON). */
export type AnalysisBoundary = ResolvedJobScope | PersonInvestigation;

/** What a request or a stored job declares, before issuance. */
export type DeclaredInvestigation = { mode: "PERSON" } | { mode: "PERSON_X_JOB"; selection: JobScopeSelection };

const issuedPersonInvestigations = new WeakSet<object>();

/**
 * Issued only by the boundaries that read a declared PERSON investigation (worker boundary). Like issued job scopes,
 * an object literal or a copy can never stand in for it.
 */
export function issuePersonInvestigation(declared: DeclaredInvestigation): PersonInvestigation {
  if (declared.mode !== "PERSON") throw new InvestigationBoundaryError("ERR_INVESTIGATION_INVALID", "only a declared PERSON investigation is issued here.");
  const issued: PersonInvestigation = Object.freeze({ mode: "PERSON" as const });
  issuedPersonInvestigations.add(issued);
  return issued;
}

export function isIssuedPersonInvestigation(value: unknown): value is PersonInvestigation {
  return !!value && typeof value === "object" && issuedPersonInvestigations.has(value);
}

/** Accepts an issued person investigation or an issued job scope; anything else is refused exactly as before. */
export function assertIssuedAnalysisBoundary(value: unknown): asserts value is AnalysisBoundary {
  if (isIssuedPersonInvestigation(value)) return;
  assertIssuedJobScope(value);
}

export function modeOfBoundary(boundary: AnalysisBoundary): "PERSON" | "PERSON_X_JOB" {
  return isIssuedPersonInvestigation(boundary) ? "PERSON" : "PERSON_X_JOB";
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

/**
 * Reads the declared investigation of an analyze request body or of a stored job's sourceData. Throws
 * JobScopeRequiredError where the job scope is missing or malformed (unchanged), InvestigationBoundaryError where the
 * declaration itself is invalid, contradictory or names a mode that is not a document analysis.
 */
export function parseDeclaredInvestigation(sourceData: unknown): DeclaredInvestigation {
  const data = isRecord(sourceData) ? sourceData : {};
  const declared = data.investigation;
  if (declared === undefined) return { mode: "PERSON_X_JOB", selection: parseJobScopeSelection(data.jobScope) };
  if (!isRecord(declared) || Object.keys(declared).length !== 1 || !INVESTIGATION_MODES.includes(declared.mode as InvestigationMode)) {
    throw new InvestigationBoundaryError("ERR_INVESTIGATION_INVALID", "investigation must be exactly { mode: PERSON | PERSON_X_JOB }.");
  }
  if (declared.mode === "JOB") throw new InvestigationBoundaryError("ERR_INVESTIGATION_MODE_NOT_ANALYZABLE", "JOB is read through the job structure, not analyzed from documents.");
  if (declared.mode === "PERSON") {
    if (data.jobScope !== undefined) throw new InvestigationBoundaryError("ERR_INVESTIGATION_INVALID", "PERSON excludes a job scope.");
    return { mode: "PERSON" };
  }
  return { mode: "PERSON_X_JOB", selection: parseJobScopeSelection(data.jobScope) };
}

export { JobScopeRequiredError };
