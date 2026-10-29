import { beforeAll, describe, expect, it } from "vitest";
import { db } from "../../../lib/career/db/client";
import { ensureRelationCacheRegistration } from "../../../lib/career/job-pool/relation-cache-registration";
import { PostgresCallLedger, PostgresInvestigationStore, investigationIdentity } from "../../../lib/career/job-pool/semantic-investigation-store";

/** Investigations, role tasks and the call ledger on PostgreSQL (verified disposable database); no model, no network. */
const stamp = `${Date.now()}`;
const NOW = "2026-10-29T00:00:00.000Z";
const identity = (client: string, roles = [{ jobPoolUploadId: "U1", poolRoleId: "role_a" }, { jobPoolUploadId: "U1", poolRoleId: "role_b" }]) =>
  investigationIdentity({ analysisId: `ANL_${stamp}`, engineVersionHash: "a".repeat(64), uploads: [{ jobPoolUploadId: "U1", canonicalSha256: "b".repeat(64) }], roleKeys: roles, clientRequestId: `${client}-${stamp}` });

describe("semantic investigation store (PostgreSQL)", () => {
  const store = new PostgresInvestigationStore(db.$client);
  beforeAll(async () => { expect(await ensureRelationCacheRegistration()).toBe("REGISTERED"); });

  it("identity: independent of role order and upload order, another client request id is another investigation", () => {
    const a = identity("c1"), b = identity("c1", [{ jobPoolUploadId: "U1", poolRoleId: "role_b" }, { jobPoolUploadId: "U1", poolRoleId: "role_a" }]);
    expect(a).toEqual(b);
    expect(identity("c2").investigationId).not.toBe(a.investigationId);
    expect(a.investigationId).toMatch(/^RINV_[0-9A-F]{32}$/);
  });

  it("open is idempotent: a repeated submit returns the stored investigation, no second row, no second task set", async () => {
    const id = identity("open");
    const input = { ...id, analysisId: `ANL_${stamp}`, engineVersionHash: "a".repeat(64), provider: "stand-in", request: { roles: 2 }, tasks: [{ jobPoolUploadId: "U1", poolRoleId: "role_a", pairs: 4 }, { jobPoolUploadId: "U1", poolRoleId: "role_b", pairs: 6 }], now: NOW };
    expect(await store.open(input)).toEqual({ created: true, investigationId: id.investigationId, status: "PLANNED" });
    expect(await store.open(input)).toEqual({ created: false, investigationId: id.investigationId, status: "PLANNED" });
    expect((await store.tasks(id.investigationId)).map(t => [t.poolRoleId, t.status, t.pairs])).toEqual([["role_a", "PENDING", 4], ["role_b", "PENDING", 6]]);
  });

  it("tasks move forward only; a disallowed or raced transition changes nothing", async () => {
    const id = identity("move");
    await store.open({ ...id, analysisId: `ANL_${stamp}`, engineVersionHash: "a".repeat(64), provider: "stand-in", request: {}, tasks: [{ jobPoolUploadId: "U1", poolRoleId: "role_a", pairs: 1 }], now: NOW });
    const key = { investigationId: id.investigationId, jobPoolUploadId: "U1", poolRoleId: "role_a", now: NOW };
    await store.moveTask({ ...key, from: "PENDING", to: "RUNNING" });
    await expect(store.moveTask({ ...key, from: "PENDING", to: "RUNNING" })).rejects.toThrow(/ERR_INVESTIGATION_TASK_STATE_CONFLICT/);
    await expect(store.moveTask({ ...key, from: "RUNNING", to: "PENDING" as never })).rejects.toThrow(/ERR_INVESTIGATION_TASK_TRANSITION/);
    await store.moveTask({ ...key, from: "RUNNING", to: "FAILED", errorCode: "ERR_SEMANTIC_OUTPUT_REFUSED", refusals: [{ reason: "CLAIM_IN_TEXT" }] });
    await expect(store.moveTask({ ...key, from: "FAILED", to: "SUCCEEDED" })).rejects.toThrow(/ERR_INVESTIGATION_TASK_TRANSITION/);
    expect((await store.tasks(id.investigationId))[0]).toMatchObject({ status: "FAILED", errorCode: "ERR_SEMANTIC_OUTPUT_REFUSED" });
  });

  it("ledger: day limit 0 reserves nothing; the investigation limit and the day limit both bind; release returns a unit", async () => {
    const mk = (over: Partial<ConstructorParameters<typeof PostgresCallLedger>[1]>) => new PostgresCallLedger(db.$client, { investigationId: `RINV_L${stamp}${Math.random()}`, provider: `p${Math.random()}`, day: "2026-10-29", dayLimit: 5, investigationLimit: 2, ...over });
    expect(await mk({ dayLimit: 0 }).reserve()).toBe(false);
    const ledger = mk({});
    expect([await ledger.reserve(), await ledger.reserve(), await ledger.reserve()]).toEqual([true, true, false]);
    await ledger.consume({ requestBytes: 10, responseBytes: 20 });
    await ledger.release();
    expect(await ledger.reserve()).toBe(true);
    expect(await ledger.reserve()).toBe(false);
    // the day scope is shared by investigations of the same provider and day: a second investigation cannot exceed it, and its refused
    // reservation leaves the first one's counters untouched (atomic: no half reservation)
    const provider = `shared${Math.random()}`;
    const a = mk({ provider, dayLimit: 3, investigationLimit: 3, investigationId: `RINV_A${stamp}${Math.random()}` }), b = mk({ provider, dayLimit: 3, investigationLimit: 3, investigationId: `RINV_B${stamp}${Math.random()}` });
    expect([await a.reserve(), await a.reserve(), await b.reserve(), await b.reserve(), await a.reserve()]).toEqual([true, true, true, false, false]);
    const rows = await db.$client<{ scope_key: string; reserved: number }[]>`SELECT scope_key, reserved FROM career_relation_call_ledger WHERE scope_key LIKE ${`DAY:${provider}%`} OR scope_key LIKE ${"INV:RINV_A" + stamp + "%"} OR scope_key LIKE ${"INV:RINV_B" + stamp + "%"} ORDER BY scope_key`;
    expect(Object.fromEntries(rows.map(r => [r.scope_key.startsWith("DAY") ? "day" : r.scope_key.startsWith("INV:RINV_A") ? "a" : "b", r.reserved]))).toEqual({ day: 3, a: 2, b: 1 });
  });

  it("concurrent reservations never exceed the limit", async () => {
    const ledger = new PostgresCallLedger(db.$client, { investigationId: `RINV_C${stamp}`, provider: `race${Math.random()}`, day: "2026-10-29", dayLimit: 3, investigationLimit: 3 });
    const results = await Promise.all(Array.from({ length: 10 }, () => ledger.reserve()));
    expect(results.filter(Boolean)).toHaveLength(3);
  });

  it("the database refuses an impossible ledger row", async () => {
    await expect(db.$client.unsafe(`INSERT INTO career_relation_call_ledger (scope_key, limit_units, reserved) VALUES ('X:bad', 1, 2)`)).rejects.toThrow();
  });

  it("the investigation status moves forward only, in the store and in the database (PINK D-LED-1, O-LED-2)", async () => {
    const id = identity("status");
    await store.open({ ...id, analysisId: `ANL_${stamp}`, engineVersionHash: "a".repeat(64), provider: "stand-in", request: {}, tasks: [], now: NOW });
    await store.setStatus(id.investigationId, "RUNNING", NOW);
    await store.setStatus(id.investigationId, "COMPLETED", NOW);
    await expect(store.setStatus(id.investigationId, "PLANNED", NOW)).rejects.toThrow(/ERR_INVESTIGATION_STATUS_CONFLICT/);
    await expect(store.setStatus(id.investigationId, "RUNNING", NOW)).rejects.toThrow(/ERR_INVESTIGATION_STATUS_CONFLICT/);
    await expect(db.$client.unsafe(`UPDATE career_relation_investigations SET status = 'PLANNED' WHERE investigation_id = $1`, [id.investigationId])).rejects.toThrow(/ERR_INVESTIGATION_STATUS_BACKWARD/);
    await expect(db.$client.unsafe(`DELETE FROM career_relation_investigations WHERE investigation_id = $1`, [id.investigationId])).rejects.toThrow(/ERR_INVESTIGATION_IMMUTABLE/);
    await expect(db.$client.unsafe(`UPDATE career_relation_investigations SET request_json = '{"changed":true}' WHERE investigation_id = $1`, [id.investigationId])).rejects.toThrow(/ERR_INVESTIGATION_IMMUTABLE/);
  });

  it("the database refuses backward task updates, deletes and decreasing ledger counters (O-LED-2)", async () => {
    const id = identity("dbguard");
    await store.open({ ...id, analysisId: `ANL_${stamp}`, engineVersionHash: "a".repeat(64), provider: "stand-in", request: {}, tasks: [{ jobPoolUploadId: "U1", poolRoleId: "role_a", pairs: 1 }], now: NOW });
    await store.moveTask({ investigationId: id.investigationId, jobPoolUploadId: "U1", poolRoleId: "role_a", from: "PENDING", to: "RUNNING", now: NOW });
    await expect(db.$client.unsafe(`UPDATE career_relation_role_tasks SET status = 'PENDING' WHERE investigation_id = $1`, [id.investigationId])).rejects.toThrow(/ERR_INVESTIGATION_STATUS_BACKWARD/);
    await expect(db.$client.unsafe(`DELETE FROM career_relation_role_tasks WHERE investigation_id = $1`, [id.investigationId])).rejects.toThrow(/ERR_INVESTIGATION_IMMUTABLE/);
    const ledger = new PostgresCallLedger(db.$client, { investigationId: id.investigationId, provider: `g${Math.random()}`, day: "2026-10-29", dayLimit: 2, investigationLimit: 2 });
    await ledger.reserve();
    await expect(db.$client.unsafe(`UPDATE career_relation_call_ledger SET reserved = 0 WHERE scope_key = $1`, [`INV:${id.investigationId}`])).rejects.toThrow(/ERR_LEDGER_IMMUTABLE/);
    await expect(db.$client.unsafe(`DELETE FROM career_relation_call_ledger WHERE scope_key = $1`, [`INV:${id.investigationId}`])).rejects.toThrow(/ERR_LEDGER_IMMUTABLE/);
  });

  it("release and consume act only on THIS investigation's own reservation, never on another's day unit (PINK D-LED-2)", async () => {
    const provider = `own${Math.random()}`;
    const mk = (investigationId: string) => new PostgresCallLedger(db.$client, { investigationId, provider, day: "2026-10-29", dayLimit: 5, investigationLimit: 5 });
    const a = mk(`RINV_OA${stamp}${Math.random()}`), b = mk(`RINV_OB${stamp}${Math.random()}`);
    await a.reserve();
    await expect(b.release()).rejects.toThrow(/ERR_LEDGER_NO_RESERVATION/);
    await expect(b.consume({ requestBytes: 1, responseBytes: 1 })).rejects.toThrow(/ERR_LEDGER_NO_RESERVATION/);
    const day = async () => (await db.$client<{ reserved: number; released: number; consumed: number }[]>`SELECT reserved, released, consumed FROM career_relation_call_ledger WHERE scope_key = ${`DAY:${provider}:2026-10-29`}`)[0];
    expect(await day()).toMatchObject({ reserved: 1, released: 0, consumed: 0 });
    await a.consume({ requestBytes: 1, responseBytes: 1 });
    await expect(a.release()).rejects.toThrow(/ERR_LEDGER_NO_RESERVATION/); // the only reservation is consumed
    expect(await day()).toMatchObject({ reserved: 1, released: 0, consumed: 1 });
  });

  it("a lowered day limit takes effect the same day, never below what is outstanding (PINK O-LED-1)", async () => {
    const provider = `low${Math.random()}`;
    const mk = (limit: number, id: string) => new PostgresCallLedger(db.$client, { investigationId: id, provider, day: "2026-10-29", dayLimit: limit, investigationLimit: 9 });
    const first = mk(5, `RINV_LA${stamp}${Math.random()}`);
    expect([await first.reserve(), await first.reserve()]).toEqual([true, true]);
    const lowered = mk(0, `RINV_LB${stamp}${Math.random()}`);
    expect(await lowered.reserve()).toBe(false);
    expect(await lowered.reserve()).toBe(false); // the lowered limit stays in force
    const rows = await db.$client<{ limit_units: number; reserved: number }[]>`SELECT limit_units, reserved FROM career_relation_call_ledger WHERE scope_key = ${`DAY:${provider}:2026-10-29`}`;
    expect(rows[0]).toMatchObject({ limit_units: 2, reserved: 2 });
  });
});
