import { describe, expect, it, vi } from "vitest";
import { instance } from "./harness";
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));
import { PERSON_ANALYSIS, UPLOAD_ALPHA, UPLOAD_ZETA, discoveryBody } from "./discovery-fixtures";
import { activeDiscoveryPoolIds, decodeRoleDiscovery, readRoleDiscovery, roleDiscoveryUrl, useRoleDiscovery } from "../../../lib/career/ui/role-discovery";

/**
 * RD-READ (GELB stage 2): the role-discovery read — GET only, the released pools only, a strict decoder, every refusal its own
 * state (409 not PERSON, 409 projection absent, 409 boundary unresolved, 404 analysis, 404 / 409 pool, 400 pools, 503, FAILED).
 * New module: on ccc0cc1 this file fails at its import.
 */
const POOLS = [UPLOAD_ALPHA, UPLOAD_ZETA];
function net(status: number, body: unknown) {
  const calls: Array<{ url: string; method: string }> = [];
  const fetcher = async (url: string, init: { method: string }) => { calls.push({ url, method: init.method }); return { status, json: async () => body }; };
  return { calls, fetcher };
}
const refusal = (code: string, extra: Record<string, string> = {}) => ({ success: false, issues: [{ code, ...extra }] });

describe("RD-READ · the role-discovery read", () => {
  it("derives a deterministic bounded active-pool release from the existing pool list", () => {
    expect(activeDiscoveryPoolIds([{ jobPoolUploadId: "JPOOL_B", poolStatus: "ACTIVE" }, { jobPoolUploadId: "JPOOL_D", poolStatus: "DRAFT" }, { jobPoolUploadId: "JPOOL_A", poolStatus: "ACTIVE" }])).toEqual(["JPOOL_A", "JPOOL_B"]);
    expect(activeDiscoveryPoolIds([{ jobPoolUploadId: "JPOOL_D", poolStatus: "DRAFT" }])).toBeNull();
  });
  it("guard: GET of exactly the released pools, in order, nothing else in the query", async () => {
    const n = net(200, discoveryBody());
    const read = await readRoleDiscovery(PERSON_ANALYSIS, POOLS, n.fetcher);
    expect(read.state).toBe("AVAILABLE");
    expect(n.calls).toEqual([{ url: `/api/career/analyses/${PERSON_ANALYSIS}/role-discovery?jobPoolUploadId=${UPLOAD_ALPHA}&jobPoolUploadId=${UPLOAD_ZETA}`, method: "GET" }]);
    expect(roleDiscoveryUrl("A B", ["X"])).toBe("/api/career/analyses/A%20B/role-discovery?jobPoolUploadId=X");
  });

  it("guard: every refusal of the route is its own honest state", async () => {
    const cases: Array<[number, unknown, object]> = [
      [409, refusal("ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON"), { state: "NOT_PERSON" }],
      [409, refusal("ERR_ROLE_DISCOVERY_PROJECTION_ABSENT"), { state: "PROJECTION_ABSENT" }],
      [409, refusal("ERR_ROLE_DISCOVERY_BOUNDARY_UNRESOLVED", { reason: "NOT_DECLARED" }), { state: "BOUNDARY_UNRESOLVED", reason: "NOT_DECLARED" }],
      [404, refusal("ERR_ROLE_DISCOVERY_ANALYSIS_NOT_FOUND"), { state: "ANALYSIS_NOT_FOUND" }],
      [404, refusal("ERR_ROLE_DISCOVERY_POOL_NOT_FOUND", { jobPoolUploadId: UPLOAD_ZETA }), { state: "POOL_NOT_FOUND", jobPoolUploadId: UPLOAD_ZETA }],
      [409, refusal("ERR_ROLE_DISCOVERY_POOL_INACTIVE", { jobPoolUploadId: UPLOAD_ALPHA }), { state: "POOL_INACTIVE", jobPoolUploadId: UPLOAD_ALPHA }],
      [400, refusal("ERR_ROLE_DISCOVERY_POOLS_REQUIRED"), { state: "POOLS_REQUIRED" }],
      [400, refusal("ERR_ROLE_DISCOVERY_POOLS_INVALID"), { state: "POOLS_INVALID" }],
      [503, refusal("ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED"), { state: "NOT_PROVISIONED" }],
      [500, refusal("ERR_ROLE_DISCOVERY_FAILED"), { state: "FAILED", code: "ERR_ROLE_DISCOVERY_FAILED" }]
    ];
    for (const [status, body, expected] of cases) expect(await readRoleDiscovery(PERSON_ANALYSIS, POOLS, net(status, body).fetcher), JSON.stringify(body)).toEqual(expected);
  });

  it("guard: the decoder is strict — another analysis, other pools, a changed authority, a score, a semantic claim are FAILED", async () => {
    const base = discoveryBody().discovery;
    expect(decodeRoleDiscovery(base, PERSON_ANALYSIS, POOLS)).not.toBeNull();
    const variants: Array<[string, unknown, string, string[]]> = [
      ["other analysis", base, "ANL_OTHER", POOLS],
      ["other pools", base, PERSON_ANALYSIS, [UPLOAD_ALPHA]],
      ["pool order", base, PERSON_ANALYSIS, [UPLOAD_ZETA, UPLOAD_ALPHA]],
      ["scored", { ...base, authority: { ...base.authority, scored: true } }, PERSON_ANALYSIS, POOLS],
      ["semantic executed", { ...base, roles: base.roles.map((r, i) => i === 0 ? { ...r, semantic: { state: "EXECUTED" } } : r) }, PERSON_ANALYSIS, POOLS],
      ["groups reordered", { ...base, groups: [...base.groups].reverse() }, PERSON_ANALYSIS, POOLS],
      ["unknown proposal", { ...base, proposals: base.proposals.slice(1) }, PERSON_ANALYSIS, POOLS],
      ["no plan", { ...base, semanticPlan: undefined }, PERSON_ANALYSIS, POOLS]
    ];
    for (const [name, body, analysis, pools] of variants) expect(decodeRoleDiscovery(body, analysis, pools), name).toBeNull();
    expect(await readRoleDiscovery(PERSON_ANALYSIS, [UPLOAD_ALPHA], net(200, discoveryBody()).fetcher)).toEqual({ state: "FAILED", code: null });
  });

  it("guard: the hook reads nothing without an analysis and released pools; one read per key; a stale answer is dropped", async () => {
    const flush = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); };
    const n = net(200, discoveryBody());
    let state: ReturnType<typeof useRoleDiscovery> | null = null;
    const view = instance<{ analysisId: string | null; pools: string[] | null }>((p: { analysisId: string | null; pools: string[] | null }) => { state = useRoleDiscovery(p.analysisId, p.pools, n.fetcher); return null; });
    for (const props of [{ analysisId: null, pools: POOLS }, { analysisId: PERSON_ANALYSIS, pools: null }, { analysisId: PERSON_ANALYSIS, pools: [] }]) {
      view.settle(props); await flush(); view.settle(props);
      expect(state!.state).toBe("IDLE");
    }
    expect(n.calls).toEqual([]);
    const props = { analysisId: PERSON_ANALYSIS, pools: POOLS };
    view.settle(props);
    expect(state!.state).toBe("LOADING");
    await flush(); view.settle(props);
    expect(state!.state).toBe("AVAILABLE");
    view.settle({ ...props, pools: [...POOLS] });
    expect(n.calls.length).toBe(1);
    const answers: Array<(v: unknown) => void> = [];
    const slow = async () => new Promise<{ status: number; json: () => Promise<unknown> }>(resolve => { answers.push(resolve as (v: unknown) => void); });
    const other = instance<{ pools: string[] }>((p: { pools: string[] }) => { state = useRoleDiscovery(PERSON_ANALYSIS, p.pools, slow); return null; });
    other.settle({ pools: POOLS });
    other.settle({ pools: [UPLOAD_ALPHA] });
    expect(answers.length).toBe(2);
    answers[0]({ status: 200, json: async () => discoveryBody() });
    await flush(); other.settle({ pools: [UPLOAD_ALPHA] });
    expect(state!.state).toBe("LOADING");
    answers[1]({ status: 200, json: async () => discoveryBody([UPLOAD_ALPHA]) });
    await flush(); other.settle({ pools: [UPLOAD_ALPHA] });
    expect(state!.state).toBe("AVAILABLE");
    view.unmount(); other.unmount();
  });
});
