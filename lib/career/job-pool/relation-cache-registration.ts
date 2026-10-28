import { verifyDisposableTestDatabase } from "../../database-isolation/verification";
import { createRegistrationClient } from "../../persistence/registration-client";
import { db } from "../db/client";
import type { RelationCacheReader } from "./relation-cache";
import { PostgresRelationCacheRepository, registerRelationCacheSchema } from "./relation-cache-repository";

/**
 * Availability boundary of the relation cache (owner directive 2026-10-24, „Verfügbarkeitsfolgen von Cache-Fehlern“). The cache has
 * its own guarded registration, separate from the job pool persistence: a cache that cannot be registered or holds a corrupt row
 * affects only the semantic layer — job pool routes, B2 and the lexical discovery keep working. Same gate as the job pool
 * (B-ENTRY): DDL only on a positively verified disposable database, on a dedicated single-connection client. Registration runs
 * lazily, on first use; after a failure the memo resets, so the next use registers again — a repaired table is picked up without a
 * restart (safe recovery, runbook §10).
 */
export type RelationCacheAccess =
  | { state: "AVAILABLE"; reader: RelationCacheReader & Pick<PostgresRelationCacheRepository, "saveIfAbsent"> }
  | { state: "NOT_PROVISIONED" }
  | { state: "UNAVAILABLE"; code: string };

let registration: Promise<"REGISTERED" | "NOT_PROVISIONED"> | undefined;

export function ensureRelationCacheRegistration(): Promise<"REGISTERED" | "NOT_PROVISIONED"> {
  registration ??= (async () => {
    const verified = await verifyDisposableTestDatabase(process.env.DATABASE_URL).then(result => result, () => null);
    if (verified === null) return "NOT_PROVISIONED" as const;
    const client = createRegistrationClient(verified.url);
    try { await registerRelationCacheSchema(client); } finally { await client.end({ timeout: 5 }); }
    return "REGISTERED" as const;
  })().catch(error => { registration = undefined; throw error; });
  return registration;
}

export async function openRelationCache(): Promise<RelationCacheAccess> {
  try {
    const state = await ensureRelationCacheRegistration();
    return state === "REGISTERED" ? { state: "AVAILABLE", reader: new PostgresRelationCacheRepository(db.$client) } : { state: "NOT_PROVISIONED" };
  } catch (error) {
    const code = error instanceof Error && /^ERR_[A-Z_]+/.test(error.message) ? error.message.split(":")[0] : "ERR_RELATION_CACHE_REGISTRATION_FAILED";
    return { state: "UNAVAILABLE", code };
  }
}
