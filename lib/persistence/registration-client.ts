import postgres from "postgres";

/**
 * Dedicated, short-lived client for the idempotent persistence registration of the HR
 * Decision Loop routes. The registration DDL raises one PostgreSQL NOTICE per existing
 * table ("relation … already exists, skipping"); this client silences notices so the server
 * log carries no DDL noise. It is bound only to a URL that `verifyDisposableTestDatabase`
 * has positively identified; the application client is never used for DDL.
 */
export function createRegistrationClient(verifiedUrl: string): postgres.Sql {
  return postgres(verifiedUrl, { max: 1, onnotice: () => undefined });
}
