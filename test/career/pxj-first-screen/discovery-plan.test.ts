import { describe, expect, it } from "vitest";
import { PERSON_ANALYSIS, STANDIN_ENGINE, UPLOAD_ALPHA, UPLOAD_ZETA, discoveryBody, discoveryBodyWithPlan } from "./discovery-fixtures";
import { decodeRoleDiscovery, readRoleDiscovery } from "../../../lib/career/ui/role-discovery";

/**
 * RD-PLAN (GELB 2026-10-29, recovery §3: cache registration with fail-closed plan states, 94e6028): the semantic plan of the role
 * discovery comes in four forms (SemanticInvestigationPlan). Under CACHE_UNAVAILABLE / CACHE_CORRUPT the cached / pending / call
 * numbers are null (unknown, never guessed) — the discovery is still read and the failure is shown, not turned into FAILED. Every
 * other form is refused. The plans here come from GELB's own producer (planSemanticInvestigation), as the route builds them.
 */
const POOLS = [UPLOAD_ALPHA, UPLOAD_ZETA];
const read = (body: unknown) => readRoleDiscovery(PERSON_ANALYSIS, POOLS, async () => ({ status: 200, json: async () => body }));
const corruptReader = { getByKeys: async () => { throw new Error("ERR_RELATION_CACHE_RECORD_CORRUPT: PRREL_X"); } };
const failingReader = { getByKeys: async () => { throw new Error("connection reset"); } };

describe("RD-PLAN · the semantic plan's four forms", () => {
  it("REPRODUCE: a cache that is unavailable or corrupt leaves the discovery readable, the plan's unknown numbers null", async () => {
    const cases = [
      [null, "CACHE_UNAVAILABLE", "ERR_RELATION_CACHE_NOT_OPENED"],
      [{ state: "NOT_PROVISIONED" }, "CACHE_UNAVAILABLE", "ERR_RELATION_CACHE_NOT_PROVISIONED"],
      [{ state: "UNAVAILABLE", code: "ERR_RELATION_CACHE_REGISTRATION_FAILED" }, "CACHE_UNAVAILABLE", "ERR_RELATION_CACHE_REGISTRATION_FAILED"],
      [{ state: "AVAILABLE", reader: failingReader }, "CACHE_UNAVAILABLE", "ERR_RELATION_CACHE_READ_FAILED"],
      [{ state: "AVAILABLE", reader: corruptReader }, "CACHE_CORRUPT", "ERR_RELATION_CACHE_RECORD_CORRUPT"]
    ] as const;
    for (const [cache, state, issue] of cases) {
      const result = await read(await discoveryBodyWithPlan(STANDIN_ENGINE, cache as never));
      expect(result.state, state).toBe("AVAILABLE");
      if (result.state !== "AVAILABLE") continue;
      const plan = result.discovery.semanticPlan;
      expect([plan.state, plan.cacheIssue, plan.executable, plan.cachedPairs, plan.pendingPairs, plan.callsNeeded]).toEqual([state, issue, false, null, null, null]);
      expect(plan.pairs).toBeGreaterThan(0);
      expect(plan.roles.every(role => role.cachedPairs === null && role.pendingPairs === null)).toBe(true);
    }
  });

  it("REPRODUCE: a plan carrying anything outside the contract (a ranking, a guessed number under a cache failure) is FAILED", async () => {
    const unavailable = (await discoveryBodyWithPlan(STANDIN_ENGINE, null)).discovery;
    const planned = (await discoveryBodyWithPlan(STANDIN_ENGINE, { state: "AVAILABLE", reader: { getByKeys: async () => [] } })).discovery;
    const base = discoveryBody().discovery;
    const variants: Array<[string, unknown]> = [
      ["ranking", { ...base, semanticPlan: { ...base.semanticPlan, semanticRanking: [] } }],
      ["guessed numbers under CACHE_UNAVAILABLE", { ...unavailable, semanticPlan: { ...unavailable.semanticPlan, cachedPairs: 0, pendingPairs: unavailable.semanticPlan.pairs, callsNeeded: 3 } }],
      ["guessed role numbers under CACHE_UNAVAILABLE", { ...unavailable, semanticPlan: { ...unavailable.semanticPlan, roles: unavailable.semanticPlan.roles.map(r => ({ ...r, cachedPairs: 0, pendingPairs: r.pairs })) } }],
      ["failure without its issue", { ...unavailable, semanticPlan: { ...unavailable.semanticPlan, cacheIssue: null } }],
      ["failure marked executable", { ...unavailable, semanticPlan: { ...unavailable.semanticPlan, executable: true } }],
      ["PLANNED not executable", { ...planned, semanticPlan: { ...planned.semanticPlan, executable: false } }],
      ["PLANNED numbers not adding up", { ...planned, semanticPlan: { ...planned.semanticPlan, cachedPairs: 1 } }],
      ["no engine but something cached", { ...base, semanticPlan: { ...base.semanticPlan, cachedPairs: 2, pendingPairs: base.semanticPlan.pairs - 2 } }],
      ["no engine but an engine hash", { ...base, semanticPlan: { ...base.semanticPlan, engineVersionHash: "sha256:x" } }],
      ["another state", { ...base, semanticPlan: { ...base.semanticPlan, state: "EXECUTED" } }],
      ["another cache version", { ...base, semanticPlan: { ...base.semanticPlan, cacheVersion: "V0" } }],
      ["roles out of order", { ...base, semanticPlan: { ...base.semanticPlan, roles: [...base.semanticPlan.roles].reverse() } }],
      ["a role missing", { ...base, semanticPlan: { ...base.semanticPlan, roles: base.semanticPlan.roles.slice(1) } }],
      ["pairs not the roles' sum", { ...base, semanticPlan: { ...base.semanticPlan, pairs: base.semanticPlan.pairs + 1, pendingPairs: base.semanticPlan.pairs + 1 } }]
    ];
    for (const [name, body] of variants) expect(decodeRoleDiscovery(body, PERSON_ANALYSIS, POOLS), name).toBeNull();
  });

  it("inverse: ENGINE_NOT_SPECIFIED (today's route) and PLANNED are read as before; the written-out fixture is the producer's plan", async () => {
    expect(discoveryBody().discovery.semanticPlan).toEqual((await discoveryBodyWithPlan(null, null)).discovery.semanticPlan);
    const none = await read(discoveryBody());
    expect(none.state === "AVAILABLE" && [none.discovery.semanticPlan.state, none.discovery.semanticPlan.executable]).toEqual(["ENGINE_NOT_SPECIFIED", false]);
    const planned = await read(await discoveryBodyWithPlan(STANDIN_ENGINE, { state: "AVAILABLE", reader: { getByKeys: async () => [] } }));
    expect(planned.state === "AVAILABLE" && planned.discovery.semanticPlan.state).toBe("PLANNED");
    if (planned.state === "AVAILABLE") expect(planned.discovery.semanticPlan.pendingPairs).toBe(planned.discovery.semanticPlan.pairs);
  });
});
