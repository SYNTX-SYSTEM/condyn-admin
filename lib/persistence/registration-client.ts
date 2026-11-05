import postgres from "postgres";

/**
 * Dedicated, short-lived client for the idempotent persistence registration of the HR
 * Decision Loop routes. The registration DDL raises one PostgreSQL NOTICE per existing
 * table ("relation … already exists, skipping"); this client silences notices so the server
 * log carries no DDL noise. The application client is never used for DDL.
 *
 * Every caller but one binds it to a URL that `verifyProvisionableDatabase` positively identified
 * (boundary B-ENTRY). The exception is the decision runtime's single-table registration, which is
 * documented in `lib/decision-runtime/local/decision-context-api.ts`: its gate is blocked by the P8
 * seal on `test/decision-runtime` and is an open owner decision. This sentence names the exception
 * instead of claiming an invariant that does not hold.
 */
export function createRegistrationClient(verifiedUrl: string): postgres.Sql {
  return postgres(verifiedUrl, { max: 1, onnotice: () => undefined });
}
