import { describe, expect, it } from "vitest";
import { carriedAfter, carriedOf, isRetryableTask, AUTO_MATCH_LEGACY_STALL_MS, AUTO_MATCH_MAX_REVISIONS, AUTO_MATCH_RESUME_WINDOW_MS, hasRetryableTasks, viewOfAutoInvestigation } from "../../../lib/career/job-pool/auto-match";
import { PARTIAL_ADMISSION_CODE } from "../../../lib/career/job-pool/semantic-investigation-run";
import type { InvestigationStatus, TaskStatus } from "../../../lib/career/job-pool/semantic-investigation-store";

/** What a person sees of a run (point 3), pure: DETERMINISTIC_FIXTURE. The state is derived from the stored run, the lease and the clock — nothing is written. */
const T0 = "2099-05-05T10:00:00.000Z";
const at = (ms: number) => new Date(Date.parse(T0) + ms).toISOString();
const task = (status: TaskStatus, errorCode: string | null = null) => ({ status, errorCode });
const view = (status: InvestigationStatus, tasks: ReturnType<typeof task>[], options: { request?: Record<string, unknown>; lease?: string | null; updatedAt?: string; now?: string; usage?: { used: number; limit: number | null } | null; progress?: string | null } = {}) =>
  viewOfAutoInvestigation({
    investigation: { investigationId: "RINV_1", provider: "gemini", status, createdAt: T0, updatedAt: options.updatedAt ?? at(1000), request: { uploads: ["U1"], roles: tasks.map((_, i) => ({ i })), rolesTotal: tasks.length, callsNeeded: tasks.length, auto: true, resumable: true, revision: 0, ...(options.request ?? {}) }, leaseExpiresAt: options.lease === undefined ? at(90_000) : options.lease },
    tasks, poolNames: new Map([["U1", "Pool"]]), now: options.now ?? at(2000), lastProgressAt: options.progress ?? null, usage: options.usage ?? null
  });

describe("a run in progress is RUNNING while its lease lives and STALLED (WORKER_LOST) when it ran out — never a wall-clock verdict", () => {
  it("lease alive: RUNNING, however long the run has been going", () => {
    for (const status of ["PLANNED", "RUNNING"] as const) {
      expect(view(status, [task("SUCCEEDED"), task("RUNNING")], { now: at(60_000), lease: at(90_000) })).toMatchObject({ state: "RUNNING", reason: null, finishedAt: null });
    }
    expect(view("RUNNING", [task("RUNNING")], { now: at(8 * 60_000), lease: at(8 * 60_000 + 20_000), updatedAt: at(1000) })).toMatchObject({ state: "RUNNING" }); // eight minutes in, still alive
  });
  it("lease out: STALLED, no finish time, the lease is reported", () => {
    const v = view("RUNNING", [task("SUCCEEDED"), task("RUNNING")], { now: at(120_000), lease: at(90_000) });
    expect(v).toMatchObject({ state: "STALLED", reason: "WORKER_LOST", finishedAt: null, leaseExpiresAt: at(90_000), revision: 0 });
  });
  it("a run from before leases existed counts as lost only after a long silence", () => {
    expect(view("RUNNING", [task("RUNNING")], { lease: null, updatedAt: at(1000), now: at(AUTO_MATCH_LEGACY_STALL_MS - 5000) }).state).toBe("RUNNING");
    expect(view("RUNNING", [task("RUNNING")], { lease: null, updatedAt: at(1000), now: at(AUTO_MATCH_LEGACY_STALL_MS + 5000) }).state).toBe("STALLED");
  });
  it("an INTERRUPTED run that will be continued still reads as STALLED; one that cannot be (not resumable, last revision, window over) reads as the failure it is", () => {
    expect(view("INTERRUPTED", [task("INTERRUPTED", "ERR_WORKER_LOST")], { now: at(5000) })).toMatchObject({ state: "STALLED", reason: "WORKER_LOST", finishedAt: null }); // a stalled run is not finished, whichever way it is derived
    expect(view("INTERRUPTED", [task("INTERRUPTED")], { request: { resumable: false } })).toMatchObject({ state: "FAILED", reason: "ERR_INVESTIGATION_INTERRUPTED" });
    expect(view("INTERRUPTED", [task("INTERRUPTED")], { request: { revision: AUTO_MATCH_MAX_REVISIONS } })).toMatchObject({ state: "FAILED" });
    expect(view("INTERRUPTED", [task("INTERRUPTED")], { now: at(AUTO_MATCH_RESUME_WINDOW_MS + 5000) })).toMatchObject({ state: "FAILED" });
  });
});

describe("a run that stopped early announces its continuation only while one is due", () => {
  const transient = [task("SUCCEEDED"), task("FAILED", "ERR_SEMANTIC_PROVIDER_TRANSIENT")];
  it("partial with a TRANSIENT failure: PARTIAL / ROLE_FAILURES and resumePending", () => {
    expect(view("PARTIAL", transient)).toMatchObject({ state: "PARTIAL", reason: "ROLE_FAILURES", resumePending: true });
  });
  it("nothing to continue for a refusal, a permanent failure or a spent budget; nothing at the last revision, for a run not marked resumable, or after the window", () => {
    expect(view("PARTIAL", [task("SUCCEEDED"), task("FAILED", "ERR_SEMANTIC_OUTPUT_REFUSED")]).resumePending).toBe(false);
    expect(view("PARTIAL", [task("SUCCEEDED"), task("FAILED", "ERR_SEMANTIC_PROVIDER_FAILED")]).resumePending).toBe(false);
    expect(view("PARTIAL", [...transient, task("BUDGET_EXHAUSTED", "ERR_BUDGET_EXHAUSTED")]).resumePending).toBe(false);
    expect(view("PARTIAL", transient, { request: { revision: AUTO_MATCH_MAX_REVISIONS } }).resumePending).toBe(false);
    expect(view("PARTIAL", transient, { request: { resumable: false } }).resumePending).toBe(false);
    expect(view("PARTIAL", transient, { now: at(AUTO_MATCH_RESUME_WINDOW_MS + 5000) }).resumePending).toBe(false);
    expect(view("COMPLETED", [task("SUCCEEDED")]).resumePending).toBe(false);
  });
  it("hasRetryableTasks: TRANSIENT failures and what a lost worker left open — but never when the budget ran out", () => {
    expect(hasRetryableTasks(transient)).toBe(true);
    expect(hasRetryableTasks([task("INTERRUPTED")])).toBe(true);
    expect(hasRetryableTasks([task("CANCELLED")])).toBe(true);
    expect(hasRetryableTasks([task("CANCELLED"), task("BUDGET_EXHAUSTED")])).toBe(false);
    expect(hasRetryableTasks([task("SUCCEEDED"), task("CACHED")])).toBe(false);
  });
});

describe("refused pairs and the budget are visible", () => {
  it("a completed run with refused pairs is PARTIAL / PAIRS_REFUSED, not COMPLETED; beyond-budget keeps its own reason", () => {
    expect(view("COMPLETED", [task("SUCCEEDED", PARTIAL_ADMISSION_CODE), task("SUCCEEDED")])).toMatchObject({ state: "PARTIAL", reason: "PAIRS_REFUSED", resumePending: false });
    expect(view("COMPLETED", [task("SUCCEEDED")], { request: { rolesTotal: 5 } })).toMatchObject({ state: "PARTIAL", reason: "ROLES_BEYOND_BUDGET" });
    expect(view("PARTIAL", [task("SUCCEEDED", PARTIAL_ADMISSION_CODE), task("CANCELLED")])).toMatchObject({ reason: "PAIRS_REFUSED" });
  });
  it("the calls the register holds, the job limit, the revision and the last progress are reported (null when there is no register)", () => {
    expect(view("RUNNING", [task("RUNNING")], { usage: { used: 4, limit: 12 }, progress: at(1500), request: { revision: 1 } })).toMatchObject({ revision: 1, lastProgressAt: at(1500), budget: { callsUsed: 4, callsJobLimit: 12 } });
    expect(view("RUNNING", [task("RUNNING")]).budget).toMatchObject({ callsUsed: null, callsJobLimit: null });
    expect(view("RUNNING", [task("RUNNING")]).lastProgressAt).toBe(at(1000)); // without a task movement: the run's own update time
  });
  it("a malformed revision counts as 0", () => {
    for (const revision of [-1, 1.5, "1", null]) expect(view("RUNNING", [task("RUNNING")], { request: { revision } }).revision).toBe(0);
  });
});

describe("a continuation carries what its predecessors settled for good", () => {
  it("carriedAfter: evaluated roles, refused / permanently failed roles and the refused-pair flag are carried; retryable roles are not; earlier carries accumulate", () => {
    const tasks = [task("SUCCEEDED"), task("CACHED"), task("SUCCEEDED", PARTIAL_ADMISSION_CODE), task("FAILED", "ERR_SEMANTIC_OUTPUT_REFUSED"), task("FAILED", "ERR_SEMANTIC_PROVIDER_FAILED"), task("FAILED", "ERR_SEMANTIC_PROVIDER_TRANSIENT"), task("INTERRUPTED"), task("CANCELLED")];
    expect(tasks.filter(isRetryableTask)).toHaveLength(3);
    expect(carriedAfter({}, tasks)).toEqual({ planned: 5, evaluated: 3, failed: 2, pairsRefused: true });
    expect(carriedAfter({ carried: { planned: 2, evaluated: 1, failed: 1, pairsRefused: false } }, [task("SUCCEEDED")])).toEqual({ planned: 3, evaluated: 2, failed: 1, pairsRefused: false });
    expect(carriedOf({ carried: { planned: -1, evaluated: 1.5, failed: "x", pairsRefused: "yes" } })).toEqual({ planned: 0, evaluated: 0, failed: 0, pairsRefused: false });
  });
  it("the view of a continuation adds the carried roles back: the whole run stays visible, a carried failure keeps the run PARTIAL even when the continuation completed", () => {
    const carried = { planned: 3, evaluated: 1, failed: 2, pairsRefused: false };
    const v = view("COMPLETED", [task("SUCCEEDED")], { request: { revision: 1, carried, rolesTotal: 4 } });
    expect(v).toMatchObject({ state: "PARTIAL", reason: "ROLE_FAILURES", revision: 1, resumePending: false });
    expect(v.budget).toMatchObject({ rolesPlanned: 4, rolesEvaluated: 2 });
    const clean = view("COMPLETED", [task("SUCCEEDED")], { request: { revision: 1, carried: { planned: 1, evaluated: 1, failed: 0, pairsRefused: false }, rolesTotal: 2 } });
    expect(clean).toMatchObject({ state: "COMPLETED", reason: null }); expect(clean.budget).toMatchObject({ rolesPlanned: 2, rolesEvaluated: 2 });
    expect(view("COMPLETED", [task("SUCCEEDED")], { request: { carried: { planned: 1, evaluated: 1, failed: 0, pairsRefused: true }, rolesTotal: 2 } })).toMatchObject({ state: "PARTIAL", reason: "PAIRS_REFUSED" });
  });
  it("failures outrank an unfinished role count when both are true", () => {
    expect(view("COMPLETED", [task("FAILED", "E")], { request: { rolesTotal: 9 } })).toMatchObject({ state: "PARTIAL", reason: "ROLE_FAILURES" });
  });
});
