/**
 * A gate used to memoise its own refusal for the lifetime of the process (PINK 1a): one database
 * hiccup left the routes on 503 until the next restart. The gates now memoise ONLY success and
 * translate this error back into their refusal value, so the next request verifies again.
 *
 * It lives in its own module on purpose: the gate tests mock `verification.ts`, and an error class
 * exported from a mocked module is `undefined` inside the gate, which would turn every refusal into
 * a TypeError instead of the refusal value.
 */
export class DatabaseNotProvisionedError extends Error {
  constructor() {
    super("ERR_DATABASE_NOT_PROVISIONED");
    this.name = "DatabaseNotProvisionedError";
  }
}
