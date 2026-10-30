import { beforeEach, describe, expect, it, vi } from "vitest";

/** The automatic match without a database: the NOT_PROVISIONED branches, the reads that must register nothing, and the proposal-less analysis. */
const h = vi.hoisted(() => ({
  statements: [] as string[], tablesExist: false, disposable: true, registrations: 0,
  capabilities: [{}] as unknown[], pools: [] as unknown[], startResult: null as unknown, startCalls: 0
}));

vi.mock("../../../lib/career/db/client", () => ({
  db: { execute: async (q: { queryChunks?: Array<{ value?: unknown }> }) => { h.statements.push(JSON.stringify(q)); return [{ e: h.tablesExist }]; }, $client: {} }
}));
vi.mock("../../../lib/database-isolation/verification", () => ({
  verifyDisposableTestDatabase: async () => { if (!h.disposable) throw new Error("not disposable"); return { url: "x" }; }
}));
vi.mock("../../../lib/career/job-pool/local-composition", () => ({
  createLocalJobPoolApplication: async () => ({ list: async () => h.pools }),
  ensureJobPoolPersistenceRegistration: async () => { h.registrations += 1; return "REGISTERED"; }
}));
vi.mock("../../../lib/career/job-pool/relation-cache-registration", () => ({
  ensureRelationCacheRegistration: async () => { h.registrations += 1; return "REGISTERED"; },
  openRelationCache: async () => { h.registrations += 1; return { state: "NOT_PROVISIONED" }; }
}));
vi.mock("../../../lib/career/job-pool/role-discovery-operand", async () => {
  const base = () => ({ ok: true, investigation: { jobId: "JOB_x", discoveryRunId: "RUN_x" }, projection: { capabilities: h.capabilities } });
  return {
    loadPersonOperandBase: async () => base(),
    loadRoleDiscoveryOperand: async () => ({ ...base(), pools: [], discovery: { pools: [], roles: [{ key: { jobPoolUploadId: "P1", poolRoleId: "R1" }, status: "NONE", counts: { requirements: 1 }, requirements: [] }] } })
  };
});
vi.mock("../../../lib/career/job-pool/semantic-investigation-start", () => ({
  startSemanticInvestigation: async () => { h.startCalls += 1; return h.startResult; }
}));

import { readAutoMatch, runAutoMatch, buildAnalysisRanking } from "../../../lib/career/job-pool/auto-match";

const pool = { jobPoolUploadId: "P1", poolName: "Pool", poolStatus: "ACTIVE" };
const ready = () => { process.env.ROLE_DISCOVERY_SEMANTIC_PROVIDER = "stand-in"; process.env.ROLE_DISCOVERY_DAY_LIMIT = "1000"; };

beforeEach(() => {
  Object.assign(h, { statements: [], tablesExist: false, disposable: true, registrations: 0, capabilities: [{}], pools: [pool], startResult: null, startCalls: 0 });
  ready();
});

describe("automatic match without a database", () => {
  it("a database that is not provisioned for the investigation ends as DISABLED / NOT_PROVISIONED, any other issue as FAILED with its code", async () => {
    h.startResult = { kind: "ISSUE", code: "ERR_RELATION_CACHE_UNAVAILABLE", status: 503, extra: { cache: "NOT_PROVISIONED" } };
    expect(await runAutoMatch("ANL_x")).toEqual({ outcome: "DISABLED", reason: "NOT_PROVISIONED" });
    h.startResult = { kind: "ISSUE", code: "ERR_RELATION_CACHE_UNAVAILABLE", status: 503, extra: { cache: "CORRUPT" } };
    expect(await runAutoMatch("ANL_x")).toEqual({ outcome: "FAILED", reason: "ERR_RELATION_CACHE_UNAVAILABLE" });
    h.startResult = { kind: "ISSUE", code: "ERR_BUDGET_EXHAUSTED", status: 409 };
    expect(await runAutoMatch("ANL_x")).toEqual({ outcome: "FAILED", reason: "ERR_BUDGET_EXHAUSTED" });
    h.startResult = { kind: "CREATED", investigationId: "INV_1" };
    expect(await runAutoMatch("ANL_x")).toEqual({ outcome: "STARTED", reason: null, investigationId: "INV_1" });
  });

  it("the read says NOT_PROVISIONED on a database without the tables that is not a verified disposable one — and NOT_STARTED when it is", async () => {
    h.disposable = false;
    const refused = await readAutoMatch("ANL_x");
    expect(refused).toMatchObject({ ok: true, value: { state: "DISABLED", reason: "NOT_PROVISIONED" } });
    h.disposable = true;
    const open = await readAutoMatch("ANL_x");
    expect(open).toMatchObject({ ok: true, value: { state: "NOT_STARTED", reason: null } });
  });

  it("the reads register nothing and issue no statement but the existence check", async () => {
    await readAutoMatch("ANL_x");
    h.capabilities = [];
    await buildAnalysisRanking("ANL_x");
    expect(h.registrations).toBe(0);
    expect(h.statements.length).toBeGreaterThan(0);
    for (const s of h.statements) { expect(s).toContain("to_regclass"); expect(s).not.toMatch(/CREATE|INSERT|UPDATE|DELETE|ALTER/i); }
    expect(h.startCalls).toBe(0);
  });

  it("an analysis without any capability proposal has nothing to compare: SKIPPED / NO_PROPOSALS, no run, no claim that roles were checked", async () => {
    h.capabilities = [];
    expect(await runAutoMatch("ANL_x")).toEqual({ outcome: "SKIPPED", reason: "NO_PROPOSALS" });
    expect(h.startCalls).toBe(0);
    expect(await readAutoMatch("ANL_x")).toMatchObject({ ok: true, value: { state: "SKIPPED", reason: "NO_PROPOSALS" } });
    h.capabilities = [{}];
    h.startResult = { kind: "CREATED", investigationId: "INV_2" };
    expect((await runAutoMatch("ANL_x")).outcome).toBe("STARTED");
    expect(h.startCalls).toBe(1);
  });
});
