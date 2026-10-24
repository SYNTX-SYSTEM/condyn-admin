import { beforeAll, describe, expect, it } from "vitest";
import { db } from "../../../lib/career/db/client";
import { ensureJobPoolPersistenceRegistration } from "../../../lib/career/job-pool/local-composition";
import { canonicalJson, engineVersionHash, proposalContentHash, relationKey, requirementContentHash, type CachedRelation } from "../../../lib/career/job-pool/relation-cache";
import { PostgresRelationCacheRepository, RELATION_CACHE_CONSTRAINTS, RELATION_CACHE_TABLE, registerRelationCacheSchema } from "../../../lib/career/job-pool/relation-cache-repository";

/** Relation cache on PostgreSQL (verified disposable test database): first-wins insert, database-enforced immutability (PINK D-RC-1, C-2). */
const ENGINE = { contractVersion: "PROPOSAL_REQUIREMENT_RELATION_V1", promptChecksum: `P_${Date.now()}`, provider: "stand-in", model: "stand-in-model" };
const make = (name: string, requirement: string, state: CachedRelation["state"] = "COVERS"): CachedRelation => {
  const p = { name, scope: "ATOMIC" as const, structuralDefinition: "d", evidence: [{ evidenceId: "E", sourceDocumentId: "DOC_001", exactQuote: `${name} quote`, verificationState: "SOURCE_MATCH_VERIFIED" as const }] };
  const r = { capability_name: requirement, aliases: [], required_level: "L3", requirement_type: "CAPABILITY" as const, domain: "", necessity: "REQUIRED" as const };
  const ph = proposalContentHash(p), rh = requirementContentHash(r), eh = engineVersionHash(ENGINE);
  return { relationKey: relationKey(ph, rh, eh), proposalContentHash: ph, requirementContentHash: rh, engineVersionHash: eh, engine: ENGINE, state, capabilityName: name, requirementText: requirement,
    sourceEvidence: [{ sourceDocumentId: "DOC_001", exactQuote: `${name} quote` }], relationExplanation: "explained", evidenceLimitation: "limited", rawOutputSha256: "b".repeat(64), authorityState: "NONE", createdAt: "2026-10-24T00:00:00.000Z" };
};
/** A direct insert that bypasses the repository (to prove what the database itself refuses or lets through). */
const rawInsert = (r: CachedRelation, overrides: Partial<Record<"relation_key" | "relation_state" | "authority_state" | "record_json", string>> = {}) => db.$client.unsafe(
  `INSERT INTO ${RELATION_CACHE_TABLE} (relation_key, proposal_content_hash, requirement_content_hash, engine_version_hash, relation_state, authority_state, record_json, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
  [overrides.relation_key ?? r.relationKey, r.proposalContentHash, r.requirementContentHash, r.engineVersionHash, overrides.relation_state ?? r.state, overrides.authority_state ?? r.authorityState, overrides.record_json ?? canonicalJson(r), r.createdAt]
);

describe("relation cache repository (PostgreSQL)", () => {
  const repository = new PostgresRelationCacheRepository(db.$client);
  beforeAll(async () => { expect(await ensureJobPoolPersistenceRegistration()).toBe("REGISTERED"); });

  it("the table and its immutability triggers exist after the guarded registration", async () => {
    const tables = await db.$client<{ n: number }[]>`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_name = ${RELATION_CACHE_TABLE}`;
    const triggers = await db.$client<{ tgname: string }[]>`SELECT tgname FROM pg_trigger WHERE tgrelid = ${RELATION_CACHE_TABLE}::regclass AND NOT tgisinternal ORDER BY tgname`;
    expect(tables[0].n).toBe(1);
    expect(triggers.map(t => t.tgname)).toEqual([`${RELATION_CACHE_TABLE}_no_truncate`, `${RELATION_CACHE_TABLE}_no_update_delete`]);
  });

  it("stores once, reads by key, an identical repeat is a duplicate", async () => {
    const a = make("Kubernetes Deployment", "Kubernetes"), b = make("PostgreSQL Database Design", "SQL", "PARTIAL");
    expect(await repository.saveIfAbsent([a, b])).toEqual({ inserted: 2, duplicates: 0, divergent: [] });
    expect(await repository.saveIfAbsent([a])).toEqual({ inserted: 0, duplicates: 1, divergent: [] });
    const read = await repository.getByKeys([a.relationKey, b.relationKey, "PRREL_UNKNOWN", a.relationKey]);
    expect(read.map(r => r.relationKey).sort()).toEqual([a.relationKey, b.relationKey].sort());
    expect(read.find(r => r.relationKey === b.relationKey)).toEqual(b);
  });

  it("first wins (C-2): another run of the same pair is a duplicate when its result is the same, divergent when not; the first record stays", async () => {
    const a = make("Linux Administration", "Linux Systems Engineering", "PARTIAL");
    await repository.saveIfAbsent([a]);
    const rerun = { ...a, createdAt: "2026-10-25T00:00:00.000Z", rawOutputSha256: "c".repeat(64) };
    expect(await repository.saveIfAbsent([rerun])).toEqual({ inserted: 0, duplicates: 1, divergent: [] });
    expect(await repository.saveIfAbsent([{ ...rerun, state: "COVERS", relationExplanation: "changed" }])).toEqual({ inserted: 0, duplicates: 0, divergent: [a.relationKey] });
    expect((await repository.getByKeys([a.relationKey]))[0]).toEqual(a);
  });

  it("the database refuses UPDATE, DELETE and TRUNCATE (D-RC-1)", async () => {
    const a = make("Python ETL Development", "Python", "PARTIAL");
    await repository.saveIfAbsent([a]);
    await expect(db.$client.unsafe(`UPDATE ${RELATION_CACHE_TABLE} SET relation_state = 'EQUIVALENT' WHERE relation_key = $1`, [a.relationKey])).rejects.toThrow(/ERR_RELATION_CACHE_IMMUTABLE/);
    await expect(db.$client.unsafe(`DELETE FROM ${RELATION_CACHE_TABLE} WHERE relation_key = $1`, [a.relationKey])).rejects.toThrow(/ERR_RELATION_CACHE_IMMUTABLE/);
    await expect(db.$client.unsafe(`TRUNCATE ${RELATION_CACHE_TABLE}`)).rejects.toThrow(/ERR_RELATION_CACHE_IMMUTABLE/);
    expect((await repository.getByKeys([a.relationKey]))[0]).toEqual(a);
  });

  it("the database binds the JSON record to its columns and fixes the key format (D-RC-1)", async () => {
    const r = make("React Frontend Development", "React");
    await expect(rawInsert(r, { relation_state: "EQUIVALENT" })).rejects.toThrow(/record_binds_columns/);
    await expect(rawInsert(r, { record_json: canonicalJson({ ...r, authorityState: "VERIFIED" }) })).rejects.toThrow(/record_binds_columns/);
    await expect(rawInsert(r, { relation_key: "PRREL_lowercase", record_json: canonicalJson({ ...r, relationKey: "PRREL_lowercase" }) })).rejects.toThrow();
    await expect(rawInsert(r, { authority_state: "VERIFIED", record_json: canonicalJson({ ...r, authorityState: "VERIFIED" }) })).rejects.toThrow();
    await expect(rawInsert(r, { relation_state: "SUPPORTS", record_json: canonicalJson({ ...r, state: "SUPPORTS" }) })).rejects.toThrow();
  });

  it("the reader refuses a stored record that does not hold, instead of serving it (D-RC-1)", async () => {
    const r = make("Engineering Leadership", "Architecture Review");
    // Columns and bound fields are consistent, but an owner-mandated field is empty: the database cannot see that, the reader does.
    await rawInsert(r, { record_json: canonicalJson({ ...r, evidenceLimitation: "" }) });
    await expect(repository.getByKeys([r.relationKey])).rejects.toThrow(`ERR_RELATION_CACHE_RECORD_CORRUPT:${r.relationKey}`);
  });

  it("O-RC-3: a table created by the earlier DDL (ccc0cc1) gets every constraint and trigger on registration; a violating row fails it", async () => {
    // Own schema on a reserved connection, so the shared table of the other test files is never touched.
    const CCC0CC1_TABLE = `CREATE TABLE ${RELATION_CACHE_TABLE} (relation_key text PRIMARY KEY, proposal_content_hash text NOT NULL, requirement_content_hash text NOT NULL,
      engine_version_hash text NOT NULL, relation_state text NOT NULL CHECK (relation_state IN ('EQUIVALENT', 'COVERS', 'PARTIAL', 'DIFFERENT', 'UNCLEAR')),
      authority_state text NOT NULL CHECK (authority_state = 'NONE'), record_json text NOT NULL, created_at text NOT NULL)`;
    const conn = await db.$client.reserve();
    const schemas = [`orc3_clean_${Date.now()}`, `orc3_dirty_${Date.now()}`];
    try {
      await conn.unsafe(`CREATE SCHEMA ${schemas[0]}; SET search_path TO ${schemas[0]}`);
      await conn.unsafe(CCC0CC1_TABLE);
      await registerRelationCacheSchema(conn as never);
      const names = (await conn.unsafe<{ conname: string }[]>(`SELECT conname FROM pg_constraint WHERE conrelid = '${RELATION_CACHE_TABLE}'::regclass`)).map(c => c.conname);
      for (const [name] of RELATION_CACHE_CONSTRAINTS) expect(names, name).toContain(name);
      await expect(conn.unsafe(`INSERT INTO ${RELATION_CACHE_TABLE} VALUES ('not-a-key','p','r','e','COVERS','NONE','{}','t')`)).rejects.toThrow();
      await expect(conn.unsafe(`TRUNCATE ${RELATION_CACHE_TABLE}`)).rejects.toThrow(/ERR_RELATION_CACHE_IMMUTABLE/);

      await conn.unsafe(`CREATE SCHEMA ${schemas[1]}; SET search_path TO ${schemas[1]}`);
      await conn.unsafe(CCC0CC1_TABLE);
      const r = make("Dirty Row", "Requirement");
      await conn.unsafe(`INSERT INTO ${RELATION_CACHE_TABLE} VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [r.relationKey, r.proposalContentHash, r.requirementContentHash, r.engineVersionHash, r.state, r.authorityState, canonicalJson({ ...r, authorityState: "VERIFIED" }), r.createdAt]);
      await expect(registerRelationCacheSchema(conn as never)).rejects.toThrow();
    } finally {
      await conn.unsafe(`SET search_path TO public; DROP SCHEMA IF EXISTS ${schemas[0]} CASCADE; DROP SCHEMA IF EXISTS ${schemas[1]} CASCADE`);
      conn.release();
    }
  });

  it("refuses invalid records before the database", async () => {
    await expect(repository.saveIfAbsent([{ ...make("X", "Y"), evidenceLimitation: "" }])).rejects.toThrow(/ERR_RELATION_CACHE_RECORD_INVALID/);
  });
});
