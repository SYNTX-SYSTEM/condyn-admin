import { describe, expect, it } from "vitest";
import { SEMANTIC_RELATION_STATES } from "../../../lib/career/job-pool/relation-cache";
import { AUTO_MATCH_STATES, RANKING_SEMANTIC_STATES, decodeAutoMatch, decodeRoleRanking, readAutoMatch, readJobRanking, rankingKey, autoMatchUrl, jobRankingUrl, type AutoMatchRunState } from "../../../lib/career/ui/auto-match";
import { ANALYSIS, POOL_A, autoMatch, autoMatchBody, ranking, rankingBody, semantic, lexical } from "./fixtures";

/**
 * AUTO_CAPABILITY (owner 2026-10-30), the two reads of GELB §3.5 as confirmed by GELB: strict decoders (regression per state and
 * an inverse per rule), the readers' status mapping (GET only, no-store), and when the ranking may be read.
 */
type Body = Record<string, unknown>;
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const ranks = (r: Body) => r.ranks as Body[];
const reqs = (r: Body, at: number) => ranks(r)[at].requirements as Body[];

describe("AC-CONTRACT · auto-match run", () => {
  it("REPRODUCE: every one of the seven states decodes in its own shape", () => {
    for (const state of AUTO_MATCH_STATES) expect(decodeAutoMatch(autoMatch(state)), state).toEqual(autoMatch(state));
    for (const reason of ["SEMANTIC_NOT_CONFIGURED", "PROVIDER_NOT_AUTHORIZED", "DAY_LIMIT_ZERO", "NOT_PROVISIONED"]) expect(decodeAutoMatch(autoMatch("DISABLED", { reason }))).not.toBeNull();
    expect(decodeAutoMatch(autoMatch("SKIPPED", { reason: "NOT_PERSON" }))).not.toBeNull();
    expect(decodeAutoMatch(autoMatch("PARTIAL", { reason: "ROLE_FAILURES" }))).not.toBeNull();
    // PINK §3.85 / GELB ab47d51: the day's budget used up during the run; NOT_PROVISIONED as a DISABLED reason (already in the contract).
    expect(decodeAutoMatch(autoMatch("PARTIAL", { reason: "DAY_BUDGET_EXHAUSTED" }))).not.toBeNull();
    expect(decodeAutoMatch(autoMatch("DISABLED", { reason: "NOT_PROVISIONED" }))).not.toBeNull();
    // PINK §3.85 F-AM-6 / GELB b972905: an analysis without capability proposals — SKIPPED, no run.
    expect(decodeAutoMatch(autoMatch("SKIPPED", { reason: "NO_PROPOSALS" }))).not.toBeNull();
    expect(decodeAutoMatch(autoMatch("COMPLETED", { evidenceClass: "REAL_GEMINI" }))).not.toBeNull();
  });

  it("inverse: a reason of another state (or none where one belongs, or one where none may stand) is not the contract", () => {
    const wrong: Array<[AutoMatchRunState, unknown]> = [
      ["DISABLED", "NO_ACTIVE_POOLS"], ["DISABLED", null], ["SKIPPED", "SEMANTIC_NOT_CONFIGURED"], ["PARTIAL", null], ["PARTIAL", "NOT_PERSON"],
      ["FAILED", null], ["FAILED", "SEMANTIC_FAILED"], ["COMPLETED", "ROLES_BEYOND_BUDGET"], ["RUNNING", "ROLE_FAILURES"], ["NOT_STARTED", "NOT_PERSON"],
      ["DISABLED", "DAY_BUDGET_EXHAUSTED"], ["COMPLETED", "DAY_BUDGET_EXHAUSTED"], ["SKIPPED", "DAY_BUDGET_EXHAUSTED"], ["PARTIAL", "NOT_PROVISIONED"], ["SKIPPED", "NOT_PROVISIONED"], ["PARTIAL", "BUDGET_EXHAUSTED"],
      ["DISABLED", "NO_PROPOSALS"], ["PARTIAL", "NO_PROPOSALS"], ["NOT_STARTED", "NO_PROPOSALS"], ["SKIPPED", "NO_PROPOSAL"]
    ];
    for (const [state, reason] of wrong) expect(decodeAutoMatch(autoMatch(state, { reason })), `${state} ${String(reason)}`).toBeNull();
  });

  it("inverse: an evidence class where no evaluation stands, none where a run stands, or an unknown one", () => {
    for (const state of ["NOT_STARTED", "DISABLED", "SKIPPED"] as const) expect(decodeAutoMatch(autoMatch(state, { evidenceClass: "STAND_IN" })), state).toBeNull();
    for (const state of ["RUNNING", "COMPLETED", "PARTIAL", "FAILED"] as const) expect(decodeAutoMatch(autoMatch(state, { evidenceClass: null })), state).toBeNull();
    expect(decodeAutoMatch(autoMatch("COMPLETED", { evidenceClass: "GEMINI" }))).toBeNull();
  });

  it("inverse: budget, pools, investigation and times outside their state", () => {
    expect(decodeAutoMatch(autoMatch("RUNNING", { budget: null }))).toBeNull();
    expect(decodeAutoMatch(autoMatch("COMPLETED", { budget: { rolesPlanned: 2, rolesEvaluated: 3, callsLimit: 25 } }))).toBeNull();
    expect(decodeAutoMatch(autoMatch("COMPLETED", { budget: { rolesPlanned: 2, rolesEvaluated: 2 } }))).toBeNull();
    expect(decodeAutoMatch(autoMatch("NOT_STARTED", { budget: { rolesPlanned: 0, rolesEvaluated: 0, callsLimit: 0 } }))).toBeNull();
    expect(decodeAutoMatch(autoMatch("DISABLED", { pools: [{ jobPoolUploadId: POOL_A, poolName: "Pool Alpha" }] }))).toBeNull();
    expect(decodeAutoMatch(autoMatch("SKIPPED", { pools: [{ jobPoolUploadId: POOL_A, poolName: "Pool Alpha" }] }))).toBeNull();
    expect(decodeAutoMatch(autoMatch("SKIPPED", { reason: "NO_PROPOSALS", evidenceClass: "STAND_IN" })), "no run, no class").toBeNull();
    expect(decodeAutoMatch(autoMatch("COMPLETED", { pools: [{ jobPoolUploadId: POOL_A, poolName: "A" }, { jobPoolUploadId: POOL_A, poolName: "A" }] }))).toBeNull();
    expect(decodeAutoMatch(autoMatch("COMPLETED", { investigationId: "rinv_0123456789abcdef0123456789abcdef" }))).toBeNull();
    expect(decodeAutoMatch(autoMatch("NOT_STARTED", { startedAt: "2026-10-30T10:00:00.000Z" }))).toBeNull();
    expect(decodeAutoMatch(autoMatch("RUNNING", { finishedAt: "2026-10-30T10:00:00.000Z" }))).toBeNull();
    expect(decodeAutoMatch(autoMatch("RUNNING", { startedAt: "soon" }))).toBeNull();
    expect(decodeAutoMatch({ ...autoMatch("COMPLETED"), provider: "gemini" })).toBeNull();
    expect(decodeAutoMatch(autoMatch("COMPLETED", { state: "DONE" }))).toBeNull();
  });
});

describe("AC-CONTRACT · ROLE_RANKING_V1", () => {
  it("REPRODUCE: the ranking decodes — two semantic roles, then the name-relation roles, the role without requirements last", () => {
    const decoded = decodeRoleRanking(ranking(), ANALYSIS)!;
    expect(decoded).not.toBeNull();
    expect(decoded.ranks.map(r => [r.rank, r.tier, r.fit])).toEqual([[1, "SEMANTIC", 0.8], [2, "SEMANTIC", 0.125], [3, "LEXICAL_ONLY", 0.25], [4, "LEXICAL_ONLY", null]]);
    // No semantic relation at all (DISABLED): every role lexical only, no evidence class.
    const lexicalOnly = ranking({ evidenceClass: null, ranks: [ranks(ranking())[2], ranks(ranking())[3]].map((r, at) => ({ ...r, rank: at + 1 })), counts: { pools: 2, roles: 4, ranked: 2 } });
    expect(decodeRoleRanking(lexicalOnly, ANALYSIS)).not.toBeNull();
    // No active pool: nothing to rank.
    expect(decodeRoleRanking(ranking({ pools: [], ranks: [], counts: { pools: 0, roles: 0, ranked: 0 }, evidenceClass: null }), ANALYSIS)).not.toBeNull();
    expect(decodeRoleRanking(ranking({ poolsDropped: ["JPOOL_CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC"] }), ANALYSIS)).not.toBeNull();
  });

  it("inverse: authority, version, analysis and evidence class are fixed", () => {
    expect(decodeRoleRanking(ranking({ authority: { ranking: true, decision: true, authorityState: "NONE" } }), ANALYSIS)).toBeNull();
    expect(decodeRoleRanking(ranking({ authority: { ranking: true, decision: false, authorityState: "HIRING" } }), ANALYSIS)).toBeNull();
    expect(decodeRoleRanking(ranking({ authority: { ranking: true, decision: false, authorityState: "NONE", scored: true } }), ANALYSIS)).toBeNull();
    expect(decodeRoleRanking(ranking({ rankingVersion: "ROLE_RANKING_V2" }), ANALYSIS)).toBeNull();
    expect(decodeRoleRanking(ranking(), "CAN_OTHER")).toBeNull();
    expect(decodeRoleRanking(ranking({ evidenceClass: null }), ANALYSIS), "semantic ranks without a class").toBeNull();
    expect(decodeRoleRanking({ ...ranking(), decision: "HIRE" }, ANALYSIS)).toBeNull();
  });

  it("inverse: a formula that weighs or values otherwise than the panel states, or no formula", () => {
    const w = ranking(); (w.formula as Body).necessityWeight = { REQUIRED: 4, PREFERRED: 2, OPTIONAL: 1, UNKNOWN: 1 }; expect(decodeRoleRanking(w, ANALYSIS)).toBeNull();
    const v = ranking(); (v.formula as Body).semanticValue = { EQUIVALENT: 1, COVERS: 0.9, PARTIAL: 0.5, DIFFERENT: 0, UNCLEAR: 0 }; expect(decodeRoleRanking(v, ANALYSIS)).toBeNull();
    const l = ranking(); (l.formula as Body).lexicalValue = { NAME_EXACT: 1, NAME_ALIAS: 0.5, NAME_COMPOSITE_CONSTITUENT: 0, WEAK_TOKEN_CONTAINMENT: 0 }; expect(decodeRoleRanking(l, ANALYSIS)).toBeNull();
    const n = ranking(); delete n.formula; expect(decodeRoleRanking(n, ANALYSIS)).toBeNull();
  });

  it("inverse: order — a gap in the ranks, a semantic rank after a lexical one, a rising fit, a fit-less role before a fitted one", () => {
    const r1 = ranking(); ranks(r1)[1].rank = 3; expect(decodeRoleRanking(r1, ANALYSIS)).toBeNull();
    const r2 = ranking(); r2.ranks = [ranks(r2)[2], ranks(r2)[0], ranks(r2)[1], ranks(r2)[3]].map((r, at) => ({ ...r, rank: at + 1 })); expect(decodeRoleRanking(r2, ANALYSIS)).toBeNull();
    const r3 = ranking(); r3.ranks = [ranks(r3)[1], ranks(r3)[0], ranks(r3)[2], ranks(r3)[3]].map((r, at) => ({ ...r, rank: at + 1 })); expect(decodeRoleRanking(r3, ANALYSIS)).toBeNull();
    const r4 = ranking(); r4.ranks = [ranks(r4)[0], ranks(r4)[1], ranks(r4)[3], ranks(r4)[2]].map((r, at) => ({ ...r, rank: at + 1 })); expect(decodeRoleRanking(r4, ANALYSIS)).toBeNull();
    const r5 = ranking(); r5.ranks = [ranks(r5)[0], ranks(r5)[0]]; (r5.counts as Body).ranked = 2; ranks(r5)[1] = { ...ranks(r5)[1], rank: 2 }; expect(decodeRoleRanking(r5, ANALYSIS), "a role twice").toBeNull();
  });

  it("inverse: the formula — fit not its own Σ, a weight not its necessity, a value not its state, a contribution not weight × value", () => {
    const f = ranking(); ranks(f)[0].fit = 0.9; expect(decodeRoleRanking(f, ANALYSIS)).toBeNull();
    const n = ranking(); ranks(n)[3].fit = 0; expect(decodeRoleRanking(n, ANALYSIS), "fit for a role without requirements").toBeNull();
    const m = ranking(); ranks(m)[2].fit = null; expect(decodeRoleRanking(m, ANALYSIS), "null fit with requirements").toBeNull();
    const w = ranking(); reqs(w, 0)[0].weight = 2; expect(decodeRoleRanking(w, ANALYSIS)).toBeNull();
    const v = ranking(); reqs(v, 0)[1].value = 1; expect(decodeRoleRanking(v, ANALYSIS)).toBeNull();
    const l = ranking(); Object.assign(reqs(l, 2)[0], { value: 1, contribution: 3 }); ranks(l)[2].fit = 0.5; expect(decodeRoleRanking(l, ANALYSIS), "a name relation above 0.5").toBeNull();
    const c = ranking(); reqs(c, 0)[0].contribution = 2; expect(decodeRoleRanking(c, ANALYSIS)).toBeNull();
    const g = ranking(); ranks(g)[1].requiredGaps = 2; expect(decodeRoleRanking(g, ANALYSIS), "more gaps than required requirements").toBeNull();
    const s = ranking(); ranks(s)[0].semanticCoverage = { evaluated: 1, total: 2 }; expect(decodeRoleRanking(s, ANALYSIS)).toBeNull();
    const t = ranking(); ranks(t)[2].tier = "SEMANTIC"; expect(decodeRoleRanking(t, ANALYSIS), "tier without a semantic requirement").toBeNull();
  });

  it("inverse: a semantic relation without its statement, limitation, proposal or quotes; a name relation with a model statement", () => {
    for (const field of ["explanation", "evidenceLimitation", "capabilityName"]) { const r = ranking(); reqs(r, 0)[0][field] = null; expect(decodeRoleRanking(r, ANALYSIS), field).toBeNull(); }
    const q = ranking(); reqs(q, 0)[0].quotes = []; expect(decodeRoleRanking(q, ANALYSIS), "EQUIVALENT without a quote").toBeNull();
    const x = ranking(); reqs(x, 2)[0].explanation = "the model said so"; expect(decodeRoleRanking(x, ANALYSIS)).toBeNull();
    const y = ranking(); reqs(y, 2)[1].capabilityName = "Something"; expect(decodeRoleRanking(y, ANALYSIS), "a proposal without a relation").toBeNull();
    const z = ranking(); reqs(z, 2)[1].source = "LEXICAL"; reqs(z, 2)[1].state = "EQUIVALENT"; expect(decodeRoleRanking(z, ANALYSIS)).toBeNull();
    const p = ranking(); (ranks(p)[0].role as Body).poolName = "Pool Gamma"; expect(decodeRoleRanking(p, ANALYSIS), "a role of a pool not in the ranking").toBeNull();
    // The fixture builders themselves are the shapes GELB confirmed.
    expect(semantic("a", "OPTIONAL", "COVERS").value).toBe(1);
    expect(lexical("b", "UNKNOWN", "WEAK_TOKEN_CONTAINMENT").value).toBe(0);
  });
});

describe("AC-CONTRACT · the readers (GET only)", () => {
  const fetcher = (status: number, body: unknown, calls: Array<[string, unknown]> = []) => async (url: string, init: unknown) => { calls.push([url, init]); return { status, json: async () => body }; };

  it("REPRODUCE: GET with no-store on the two routes; AVAILABLE only for exactly the contract", async () => {
    const calls: Array<[string, unknown]> = [];
    expect(await readAutoMatch(ANALYSIS, fetcher(200, autoMatchBody("RUNNING"), calls))).toEqual({ state: "AVAILABLE", autoMatch: autoMatch("RUNNING") });
    expect(await readJobRanking(ANALYSIS, fetcher(200, rankingBody(), calls))).toMatchObject({ state: "AVAILABLE" });
    expect(calls).toEqual([[autoMatchUrl(ANALYSIS), { method: "GET", cache: "no-store", signal: undefined }], [jobRankingUrl(ANALYSIS), { method: "GET", cache: "no-store", signal: undefined }]]);
    expect(autoMatchUrl("a/b")).toBe("/api/career/analyses/a%2Fb/auto-match");
  });

  it("inverse: a 200 that is not the contract, a refusal, a network failure", async () => {
    expect(await readAutoMatch(ANALYSIS, fetcher(200, { success: true, autoMatch: autoMatch("RUNNING", { budget: null }) }))).toEqual({ state: "FAILED", code: null });
    expect(await readAutoMatch(ANALYSIS, fetcher(200, { success: false, autoMatch: autoMatch("RUNNING") }))).toEqual({ state: "FAILED", code: null });
    expect(await readAutoMatch(ANALYSIS, fetcher(404, { issues: [{ code: "ERR_ROLE_DISCOVERY_ANALYSIS_NOT_FOUND" }] }))).toEqual({ state: "ANALYSIS_NOT_FOUND" });
    expect(await readAutoMatch(ANALYSIS, fetcher(500, { issues: [{ code: "ERR_X" }] }))).toEqual({ state: "FAILED", code: "ERR_X" });
    expect(await readAutoMatch(ANALYSIS, async () => { throw new Error("offline"); })).toEqual({ state: "FAILED", code: null });
    expect(await readJobRanking(ANALYSIS, fetcher(200, { success: true, ranking: { ...ranking(), analysisId: "CAN_OTHER" } }))).toEqual({ state: "FAILED", code: null });
    expect(await readJobRanking(ANALYSIS, fetcher(409, { issues: [{ code: "ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON" }] }))).toEqual({ state: "NOT_PERSON" });
    expect(await readJobRanking(ANALYSIS, fetcher(409, { issues: [{ code: "ERR_ROLE_DISCOVERY_PROJECTION_ABSENT" }] }))).toEqual({ state: "PROJECTION_ABSENT" });
    expect(await readJobRanking(ANALYSIS, fetcher(409, { issues: [{ code: "ERR_ROLE_DISCOVERY_BOUNDARY_UNRESOLVED", reason: "R" }] }))).toEqual({ state: "BOUNDARY_UNRESOLVED", reason: "R" });
    expect(await readJobRanking(ANALYSIS, fetcher(404, { issues: [{ code: "ERR_ROLE_DISCOVERY_ANALYSIS_NOT_FOUND" }] }))).toEqual({ state: "ANALYSIS_NOT_FOUND" });
    expect(await readJobRanking(ANALYSIS, fetcher(503, { issues: [{ code: "ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED" }] }))).toEqual({ state: "NOT_PROVISIONED" });
    expect(await readJobRanking(ANALYSIS, fetcher(500, "not json"))).toEqual({ state: "FAILED", code: null });
  });
});

describe("AC-CONTRACT · when the ranking is read", () => {
  const watch = (state: AutoMatchRunState, waitedOut = false) => ({ read: { state: "AVAILABLE" as const, autoMatch: decodeAutoMatch(autoMatch(state))! }, waitedOut });
  it("REPRODUCE: every settled state names a key (its state and finish time); the end of the wait names one too", () => {
    for (const state of ["DISABLED", "COMPLETED", "PARTIAL", "FAILED", "SKIPPED"] as const) expect(rankingKey(watch(state)), state).toBe(`${state}:${autoMatch(state).finishedAt}`);
    expect(rankingKey(watch("NOT_STARTED", true))).toBe("WAITED_OUT:NOT_STARTED");
    expect(rankingKey(watch("RUNNING", true))).toBe("WAITED_OUT:RUNNING");
  });
  it("inverse: an open run, a read in flight or a failed read names none — nothing is read then", () => {
    expect(rankingKey(watch("NOT_STARTED"))).toBeNull();
    expect(rankingKey(watch("RUNNING"))).toBeNull();
    expect(rankingKey({ read: { state: "LOADING" }, waitedOut: false })).toBeNull();
    expect(rankingKey({ read: { state: "FAILED", code: null }, waitedOut: false })).toBeNull();
    expect(rankingKey({ read: { state: "ANALYSIS_NOT_FOUND" }, waitedOut: false })).toBeNull();
  });
});

// Decoders never hand back a different object than they were given (the panel shows the server's own values).
it("AC-CONTRACT: decoded values are the given ones", () => {
  const body = clone(ranking());
  expect(decodeRoleRanking(body, ANALYSIS)).toBe(body);
});

it("AC-CONTRACT: the client's relation states are the relation cache's, in its order (the client never imports that server module)", () => {
  expect(RANKING_SEMANTIC_STATES).toEqual([...SEMANTIC_RELATION_STATES]);
});
