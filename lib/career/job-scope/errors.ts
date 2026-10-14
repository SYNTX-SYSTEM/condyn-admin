/**
 * SFE invariant JOB POOL FIRST: no valid pool + selected job → no capability analysis.
 * Every refusal carries the owner's message; the code tells a missing selection from an invalid one.
 */
export const JOB_SCOPE_REQUIRED_MESSAGE = "Bitte wählen Sie einen Job aus.";

export type JobScopeErrorCode = "ERR_JOB_SCOPE_REQUIRED" | "ERR_JOB_SCOPE_INVALID";

export class JobScopeRequiredError extends Error {
  readonly code: JobScopeErrorCode;
  constructor(code: JobScopeErrorCode = "ERR_JOB_SCOPE_REQUIRED", readonly detail = "") {
    super(JOB_SCOPE_REQUIRED_MESSAGE);
    this.code = code;
    // The Career worker treats TERMINAL_ERROR as non-retryable: a missing or invalid job never becomes valid by retrying.
    this.name = "TERMINAL_ERROR";
  }
}
