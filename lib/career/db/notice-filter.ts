/**
 * Notice handling for the application PostgreSQL client.
 *
 * Two notice classes carry no operational information and flood the server log:
 * - 42622 `truncate_identifier`: raised every time a statement names one of the sealed
 *   relations whose names exceed NAMEDATALEN-1 (63 bytes); PostgreSQL resolves the truncated
 *   name deterministically, so reads and writes are unaffected.
 * - 42P07 / 42P06 / 42710 with "skipping": idempotent `CREATE … IF NOT EXISTS` on an existing
 *   relation, schema or object.
 * Every other notice is forwarded unchanged (postgres.js default: console.log).
 */
export type PostgresNotice = { code?: string; message?: string; [key: string]: unknown };

export const SUPPRESSED_TRUNCATION_NOTICE_CODE = "42622";
export const SUPPRESSED_IDEMPOTENT_DDL_NOTICE_CODES = Object.freeze(["42P07", "42P06", "42710"] as const);

export function isSuppressedNotice(notice: PostgresNotice): boolean {
  if (notice.code === SUPPRESSED_TRUNCATION_NOTICE_CODE) return true;
  return (SUPPRESSED_IDEMPOTENT_DDL_NOTICE_CODES as readonly string[]).includes(notice.code ?? "")
    && typeof notice.message === "string"
    && notice.message.endsWith("skipping");
}

export function createNoticeForwarder(forward: (notice: PostgresNotice) => void = console.log): (notice: PostgresNotice) => void {
  return notice => { if (!isSuppressedNotice(notice)) forward(notice); };
}
