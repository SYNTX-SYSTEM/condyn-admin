import { beforeAll, describe, expect, it } from "vitest";
import { db } from "../../../lib/career/db/client";
import { ensureJobPoolPersistenceRegistration } from "../../../lib/career/job-pool/local-composition";
import { engineVersionHash, proposalContentHash, relationKey, requirementContentHash, type CachedRelation } from "../../../lib/career/job-pool/relation-cache";
import { PostgresRelationCacheRepository, RELATION_CACHE_TABLE } from "../../../lib/career/job-pool/relation-cache-repository";

/** Relation cache on PostgreSQL (verified disposable test database): immutable rows, idempotent insert, conflict refused, DB checks. */
const ENGINE = { contractVersion: "PROPOSAL_REQUIREMENT_RELATION_V1", promptChecksum: `P_${Date.now()}`, provider: "stand-in", model: "stand-in-model" };
const make = (name: string, requirement: string, state: CachedRelation["state"] = "COVERS"): CachedRelation => {
  const p = { name, scope: "ATOMIC" as const, structuralDefinition: "d", evidence: [{ evidenceId: "E", sourceDocumentId: "DOC_001", exactQuote: `${name} quote`, verificationState: "SOURCE_MATCH_VERIFIED" as const }] };
  const r = { capability_name: requirement, aliases: [], required_level: "L3", requirement_type: "CAPABILITY" as const, domain: "", necessity: "REQUIRED" as const };
  const ph = proposalContentHash(p), rh = requirementContentHash(r), eh = engineVersionHash(ENGINE);
  return { relationKey: relationKey(ph, rh, eh), proposalContentHash: ph, requirementContentHash: rh, engineVersionHash: eh, engine: ENGINE, state, capabilityName: name, requirementText: requirement,
    sourceEvidence: [{ sourceDocumentId: "DOC_001", exactQuote: `${name} quote` }], relationExplanation: "explained", evidenceLimitation: "limited", rawOutputSha256: "b".repeat(64), authorityState: "NONE", createdAt: "2026-10-24T00:00:00.000Z" };
};

describe("relation cache repository (PostgreSQL)", () => {
  const repository = new PostgresRelationCacheRepository(db.$client);
  beforeAll(async () => { expect(await ensureJobPoolPersistenceRegistration()).toBe("REGISTERED"); });

  it("the table exists after the guarded registration", async () => {
    const rows = await db.$client<{ n: number }[]>`SELECT count(*)::int AS n FROM information_schema.tables WHERE table_name = ${RELATION_CACHE_TABLE}`;
    expect(rows[0].n).toBe(1);
  });

  it("stores once, reads by key, repeats are no-ops", async () => {
    const a = make("Kubernetes Deployment", "Kubernetes"), b = make("PostgreSQL Database Design", "SQL", "PARTIAL");
    expect(await repository.saveIfAbsent([a, b])).toEqual({ inserted: 2, existing: 0 });
    expect(await repository.saveIfAbsent([a])).toEqual({ inserted: 0, existing: 1 });
    const read = await repository.getByKeys([a.relationKey, b.relationKey, "PRREL_UNKNOWN", a.relationKey]);
    expect(read.map(r => r.relationKey).sort()).toEqual([a.relationKey, b.relationKey].sort());
    expect(read.find(r => r.relationKey === b.relationKey)).toEqual(b);
  });

  it("immutable: another record under an existing key is refused, the stored one stays", async () => {
    const a = make("Linux Administration", "Linux Systems Engineering", "PARTIAL");
    await repository.saveIfAbsent([a]);
    await expect(repository.saveIfAbsent([{ ...a, relationExplanation: "changed" }])).rejects.toThrow(/ERR_RELATION_CACHE_CONFLICT/);
    expect((await repository.getByKeys([a.relationKey]))[0].relationExplanation).toBe("explained");
  });

  it("refuses invalid records before the database, and the database refuses authority and unknown states itself", async () => {
    await expect(repository.saveIfAbsent([{ ...make("X", "Y"), evidenceLimitation: "" }])).rejects.toThrow(/ERR_RELATION_CACHE_RECORD_INVALID/);
    await expect(db.$client.unsafe(`INSERT INTO ${RELATION_CACHE_TABLE} VALUES ('K1','p','r','e','EQUIVALENT','VERIFIED','{}','t')`)).rejects.toThrow();
    await expect(db.$client.unsafe(`INSERT INTO ${RELATION_CACHE_TABLE} VALUES ('K2','p','r','e','SUPPORTS','NONE','{}','t')`)).rejects.toThrow();
  });
});
