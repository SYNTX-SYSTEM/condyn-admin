import { randomBytes } from "node:crypto";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PostgresCapabilityCoreRepository, deriveCandidateCapabilityOperand } from "../../../../lib/career/capability-core";
import { createPhase4Input } from "./phase4-fixture";

const url = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/condyn";
const schema = `candidate_capability_operand_t6a_${randomBytes(8).toString("hex")}`;
const clients = new Set<Sql>(); let admin: Sql;
const client = async () => { const sql = postgres(url, { max: 1, onnotice: () => undefined }); clients.add(sql); await sql.unsafe(`SET search_path TO "${schema}"`); return { sql, database: drizzle(sql) }; };
const close = async (sql: Sql) => { await sql.end({ timeout: 5 }); clients.delete(sql); };
beforeAll(async () => { admin = postgres(url, { max: 1, onnotice: () => undefined }); await admin.unsafe(`CREATE SCHEMA "${schema}"`); await admin.unsafe(`CREATE TABLE "${schema}"."career_capability_runs" ("run_id" text PRIMARY KEY,"source_bundle_hash" text NOT NULL,"kernel_version" text NOT NULL,"prompt_checksum" text NOT NULL,"provider" text NOT NULL,"model" text NOT NULL,"schema_version" text NOT NULL,"status" text NOT NULL,"raw_output_hash" text,"payload" jsonb NOT NULL,"created_at" text NOT NULL,"completed_at" text)`); await admin.unsafe(`CREATE TABLE "${schema}"."career_capability_snapshots" ("snapshot_id" text PRIMARY KEY,"snapshot_key" text NOT NULL UNIQUE,"source_bundle_hash" text NOT NULL,"kernel_version" text NOT NULL,"prompt_checksum" text NOT NULL,"provider" text NOT NULL,"model" text NOT NULL,"schema_version" text NOT NULL,"status" text NOT NULL,"payload" jsonb NOT NULL,"created_at" text NOT NULL)`); });
afterAll(async () => { await Promise.all([...clients].map((sql) => sql.end({ timeout: 5 }))); if (admin) { await admin.unsafe(`DROP SCHEMA "${schema}" CASCADE`); await admin.end({ timeout: 5 }); } });

describe("T6A Candidate Capability Operand PostgreSQL composition", () => {
  it("publishes Phase-4 state then reconstructs the same exact operand through fresh PostgreSQL repositories", async () => {
    const first = await client(); const input = createPhase4Input("POSTGRES"); const repository = new PostgresCapabilityCoreRepository(first.database as never); await repository.saveRun(input.discoveryRun); await repository.saveConvergenceRun(input.convergenceRun); await repository.saveVerificationRun(input.verificationRun); const snapshot = await repository.createVerifiedCapabilitySnapshotPublisher().publish(input); const capabilityId = snapshot.capabilities[0].capabilityId; const operand = await deriveCandidateCapabilityOperand({ verifiedCapabilitySnapshotId: snapshot.snapshotId, capabilityId }, repository); await close(first.sql);
    const second = await client(); const restarted = new PostgresCapabilityCoreRepository(second.database as never); const replay = await deriveCandidateCapabilityOperand({ verifiedCapabilitySnapshotId: snapshot.snapshotId, capabilityId }, restarted); expect(replay).toEqual(operand); expect(replay.authority).toEqual({ publicationState: "PHASE4_VERIFIED", relationEligibilityState: "RELATION_ELIGIBLE" }); await close(second.sql);
  });
});
