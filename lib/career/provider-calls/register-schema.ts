import type { Sql } from "postgres";
import { createRegistrationClient } from "../../persistence/registration-client";
import { CALL_LEDGER_DDL, CALL_LEDGER_GUARD_DDL, PROVIDER_CALL_DDL, PROVIDER_CALL_GUARD_DDL, PROVIDER_CALL_TABLE } from "./register";

/**
 * Registration of the call register on ANY database (owner BUDGET BOUNDARY: no model call without persistent registration,
 * independent of the database). Purely additive and idempotent — CREATE ... IF NOT EXISTS, the stage list widened in place — so
 * existing data is never touched; one transaction under an advisory lock (two processes starting together cannot collide); the
 * guarantees (both tables, both triggers enabled) are verified before the register counts as available. Lazy, on first use; a
 * failure resets the memo so the next use tries again.
 */
const LOCK_KEY = 7_340_212;
const REQUIRED_TRIGGERS: ReadonlyArray<readonly [trigger: string, table: string]> = [["rel_ledger_guard", "career_relation_call_ledger"], ["rel_call_guard", PROVIDER_CALL_TABLE]];

export async function registerProviderCallRegisterSchema(sql: Sql): Promise<void> {
  await sql.begin(async tx => {
    await tx`SELECT pg_advisory_xact_lock(${LOCK_KEY})`;
    for (const statement of [...CALL_LEDGER_DDL, ...PROVIDER_CALL_DDL, ...CALL_LEDGER_GUARD_DDL, ...PROVIDER_CALL_GUARD_DDL]) await tx.unsafe(statement);
    // A trigger that exists but is DISABLED does not protect: registration enables it again.
    for (const [trigger, table] of REQUIRED_TRIGGERS) await tx.unsafe(`ALTER TABLE ${table} ENABLE TRIGGER ${trigger}`);
    const present = await tx<{ tgname: string }[]>`SELECT tgname FROM pg_trigger WHERE tgname IN ('rel_ledger_guard', 'rel_call_guard') AND NOT tgisinternal AND tgenabled <> 'D'`;
    const missing = REQUIRED_TRIGGERS.map(([trigger]) => trigger).filter(name => !present.some(p => p.tgname === name));
    if (missing.length) throw new Error(`ERR_PROVIDER_CALL_REGISTER_GUARANTEES_MISSING:${missing.join(",")}`);
  });
}

const registrations = new Map<string, Promise<void>>();

/** Resolves when the register is provisioned on the database of the URL (default DATABASE_URL); rejects when it cannot be (the caller then refuses every call). */
export function ensureProviderCallRegister(url: string | undefined = process.env.DATABASE_URL): Promise<void> {
  if (!url) return Promise.reject(new Error("ERR_PROVIDER_CALL_REGISTER_NO_DATABASE"));
  let registration = registrations.get(url);
  if (!registration) {
    registration = (async () => {
      const client = createRegistrationClient(url);
      try { await registerProviderCallRegisterSchema(client); } finally { await client.end({ timeout: 5 }); }
    })();
    registrations.set(url, registration);
    registration.catch(() => registrations.delete(url));
  }
  return registration;
}
