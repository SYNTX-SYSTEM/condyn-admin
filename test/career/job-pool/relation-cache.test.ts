import { describe, expect, it } from "vitest";
import {
  RELATION_CACHE_VERSION, assertCachedRelation, engineVersionHash, planSemanticInvestigation, proposalContentHash, relationKey, requirementContentHash,
  type CachedRelation, type RelationEngineIdentity
} from "../../../lib/career/job-pool/relation-cache";

/** Content-addressed relation cache: keys, record admission, call-volume plan, incremental reuse (DETERMINISTIC_FIXTURE, no model). */
const ENGINE: RelationEngineIdentity = { contractVersion: "PROPOSAL_REQUIREMENT_RELATION_V1", promptChecksum: "P1", provider: "stand-in", model: "stand-in-model" };
const proposal = (name: string, quotes: string[], definition = "def") => ({ name, scope: "ATOMIC" as const, structuralDefinition: definition, evidence: quotes.map((q, i) => ({ evidenceId: `E${i}`, sourceDocumentId: "DOC_001", exactQuote: q, verificationState: "SOURCE_MATCH_VERIFIED" as const })) });
const requirement = (text: string, extra: Record<string, unknown> = {}) => ({ capability_name: text, aliases: [] as string[], required_level: "L3", requirement_type: "CAPABILITY" as const, domain: "Software", necessity: "REQUIRED" as const, ...extra });
const record = (p: ReturnType<typeof proposal>, r: ReturnType<typeof requirement>, engine = ENGINE): CachedRelation => {
  const ph = proposalContentHash(p), rh = requirementContentHash(r), eh = engineVersionHash(engine);
  return { relationKey: relationKey(ph, rh, eh), proposalContentHash: ph, requirementContentHash: rh, engineVersionHash: eh, engine, state: "PARTIAL", capabilityName: p.name, requirementText: r.capability_name,
    sourceEvidence: [{ sourceDocumentId: "DOC_001", exactQuote: p.evidence[0].exactQuote }], relationExplanation: "TDD practice implies automated tests; breadth not shown.", evidenceLimitation: "One quote; no test framework named.", rawOutputSha256: "a".repeat(64), authorityState: "NONE", createdAt: "2026-10-24T00:00:00.000Z" };
};

describe("relation cache keys", () => {
  it("a proposal's key depends on its content, not on its id, its evidence ids or the order of its quotes", () => {
    const a = proposal("Test-Driven Development (TDD)", ["q1", "q2"]);
    const b = { ...proposal("Test-Driven Development (TDD)", ["q2", "q1"]), id: "PCAP_OTHER" };
    expect(proposalContentHash(a)).toBe(proposalContentHash(b));
    expect(proposalContentHash(proposal("Test-Driven Development (TDD)", ["q1", "q3"]))).not.toBe(proposalContentHash(a));
    expect(proposalContentHash(proposal("Test-Driven Development (TDD)", ["q1", "q2"], "other definition"))).not.toBe(proposalContentHash(a));
  });

  it("a requirement's key depends on its content, not on upload, role or requirement id; alias order does not matter", () => {
    expect(requirementContentHash(requirement("Python", { aliases: ["PyTorch", "FastAPI"] }))).toBe(requirementContentHash(requirement("Python", { aliases: ["FastAPI", "PyTorch"] })));
    expect(requirementContentHash(requirement("Python", { aliases: ["R"] }))).not.toBe(requirementContentHash(requirement("Python", { aliases: ["PyTorch"] })));
    expect(requirementContentHash(requirement("Python", { required_level: "L4" }))).not.toBe(requirementContentHash(requirement("Python")));
  });

  it("another engine (prompt, provider or model) is another key; nothing is invalidated, old records stay addressable", () => {
    const p = proposal("Kubernetes Deployment", ["q"]), r = requirement("Kubernetes");
    const k1 = record(p, r).relationKey, k2 = record(p, r, { ...ENGINE, promptChecksum: "P2" }).relationKey, k3 = record(p, r, { ...ENGINE, model: "m2" }).relationKey;
    expect(new Set([k1, k2, k3]).size).toBe(3);
    expect(k1).toMatch(/^PRREL_[0-9A-F]{40}$/);
  });
});

describe("relation cache record admission (owner D-RD-2 fields)", () => {
  const ok = record(proposal("Test-Driven Development (TDD)", ["Practised TDD on every service."]), requirement("Automated Testing"));
  it("accepts a complete record", () => expect(() => assertCachedRelation(ok)).not.toThrow());
  it.each([
    ["unknown state", { state: "SUPPORTS" }],
    ["missing explanation", { relationExplanation: " " }],
    ["missing evidence limitation", { evidenceLimitation: "" }],
    ["no source evidence", { sourceEvidence: [] }],
    ["authority claimed", { authorityState: "VERIFIED" }],
    ["key not derived from its parts", { relationKey: "PRREL_" + "0".repeat(40) }],
    ["engine hash not of its engine", { engine: { ...ENGINE, model: "other" } }]
  ])("refuses: %s", (_label, patch) => expect(() => assertCachedRelation({ ...ok, ...patch } as CachedRelation)).toThrow(/ERR_RELATION_CACHE_RECORD_INVALID/));
});

describe("semantic investigation plan (D-RD-3: call volume before execution)", () => {
  const P = [proposal("TypeScript and Node.js Backend Development", ["q1"]), proposal("Test-Driven Development (TDD)", ["q2"])];
  const R = { r1: requirement("TypeScript"), r2: requirement("Automated Testing"), r3: requirement("Kubernetes") };
  const roleOf = (upload: string, roleId: string, reqs: Array<keyof typeof R>) => ({ key: { jobPoolUploadId: upload, poolRoleId: roleId }, requirements: reqs.map(id => ({ key: { jobPoolUploadId: upload, poolRoleId: roleId, poolRequirementId: id } })) });
  const discovery = { roles: [roleOf("U1", "a", ["r1", "r2"]), roleOf("U1", "empty", []), roleOf("U2", "b", ["r1", "r3"])] } as never;
  const byKey = (key: { poolRequirementId: string }) => R[key.poolRequirementId as keyof typeof R] ?? null;
  const memoryReader = (records: CachedRelation[]) => { let reads = 0; return { reads: () => reads, getByKeys: async (keys: string[]) => { reads += 1; return records.filter(r => keys.includes(r.relationKey)); } }; };
  const memoryCache = (records: CachedRelation[]) => { const reader = memoryReader(records); return { state: "AVAILABLE" as const, reader, reads: reader.reads }; };

  it("without an engine: ENGINE_NOT_SPECIFIED, pairs and calls counted, nothing looked up", async () => {
    const cache = memoryCache([]);
    const plan = await planSemanticInvestigation({ discovery, proposals: P, requirementsByKey: byKey, engine: null, cache });
    expect(plan).toMatchObject({ cacheVersion: RELATION_CACHE_VERSION, state: "ENGINE_NOT_SPECIFIED", executable: false, engineVersionHash: null, pairs: 8, cachedPairs: 0, pendingPairs: 8, callsNeeded: 2 });
    expect(cache.reads()).toBe(0);
  });

  it("with an engine and a partly filled cache: cached pairs are not pending; a role whose pairs are all cached needs no call", async () => {
    const cache = memoryCache([record(P[0], R.r1), record(P[1], R.r1), record(P[0], R.r3), record(P[1], R.r3)]);
    const plan = await planSemanticInvestigation({ discovery, proposals: P, requirementsByKey: byKey, engine: ENGINE, cache });
    expect(plan).toMatchObject({ state: "PLANNED", executable: true, cacheIssue: null, pairs: 8, cachedPairs: 6, pendingPairs: 2, callsNeeded: 1 });
    expect(plan.roles.find(r => r.poolRoleId === "b")).toMatchObject({ pairs: 4, cachedPairs: 4, pendingPairs: 0 });
    expect(cache.reads()).toBe(1);
  });

  it("incremental: a second upload repeating a requirement's content reuses its relations under other ids", async () => {
    const cache = memoryCache([record(P[0], R.r1), record(P[1], R.r1)]);
    const second = { roles: [roleOf("U9", "copy", ["r1"])] } as never;
    expect(await planSemanticInvestigation({ discovery: second, proposals: P, requirementsByKey: byKey, engine: ENGINE, cache })).toMatchObject({ pairs: 2, cachedPairs: 2, callsNeeded: 0 });
  });

  it("a second analysis with the same proposals is fully cached; a proposal with other evidence is pending again", async () => {
    const all = (Object.values(R)).flatMap(r => P.map(p => record(p, r)));
    expect(await planSemanticInvestigation({ discovery, proposals: P, requirementsByKey: byKey, engine: ENGINE, cache: memoryCache(all) })).toMatchObject({ pendingPairs: 0, callsNeeded: 0 });
    const changed = [P[0], proposal("Test-Driven Development (TDD)", ["another quote"])];
    expect(await planSemanticInvestigation({ discovery, proposals: changed, requirementsByKey: byKey, engine: ENGINE, cache: memoryCache(all) })).toMatchObject({ pendingPairs: 4, callsNeeded: 2 });
  });

  it("availability: an unreachable or unprovisioned cache fails the semantic plan closed (counts unknown, not executable), never guessed", async () => {
    for (const cache of [null, { state: "UNAVAILABLE" as const, code: "ERR_RELATION_CACHE_GUARANTEES_MISSING" }, { state: "NOT_PROVISIONED" as const }]) {
      const plan = await planSemanticInvestigation({ discovery, proposals: P, requirementsByKey: byKey, engine: ENGINE, cache });
      expect(plan).toMatchObject({ state: "CACHE_UNAVAILABLE", executable: false, pairs: 8, cachedPairs: null, pendingPairs: null, callsNeeded: null });
      expect(plan.roles.every(r => r.cachedPairs === null && r.pendingPairs === null)).toBe(true);
    }
  });

  it("integrity: a corrupt cached row fails the semantic plan closed as CACHE_CORRUPT; a read error as CACHE_UNAVAILABLE", async () => {
    const corrupt = { state: "AVAILABLE" as const, reader: { getByKeys: async () => { throw new Error("ERR_RELATION_CACHE_RECORD_CORRUPT:PRREL_X"); } } };
    expect(await planSemanticInvestigation({ discovery, proposals: P, requirementsByKey: byKey, engine: ENGINE, cache: corrupt })).toMatchObject({ state: "CACHE_CORRUPT", cacheIssue: "ERR_RELATION_CACHE_RECORD_CORRUPT", executable: false, cachedPairs: null });
    const broken = { state: "AVAILABLE" as const, reader: { getByKeys: async () => { throw new Error("connection reset"); } } };
    expect(await planSemanticInvestigation({ discovery, proposals: P, requirementsByKey: byKey, engine: ENGINE, cache: broken })).toMatchObject({ state: "CACHE_UNAVAILABLE", cacheIssue: "ERR_RELATION_CACHE_READ_FAILED", executable: false });
  });

  it("refuses a requirement key it cannot resolve (no silent skip)", async () => {
    await expect(planSemanticInvestigation({ discovery, proposals: P, requirementsByKey: () => null, engine: null, cache: null })).rejects.toThrow("ERR_RELATION_PLAN_REQUIREMENT_UNKNOWN");
  });
});
