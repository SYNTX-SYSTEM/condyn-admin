import React from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { INVESTIGATION_ID, PERSON_ANALYSIS, UPLOAD_ALPHA, UPLOAD_ZETA, discoveryBody, discoveryBodyWithPlan, plannedBody, storedInvestigation, STANDIN_ENGINE } from "./discovery-fixtures";
import * as panelModule from "../../../app/components/career/demo/RoleDiscoveryPanel";
import { ROLE_DISCOVERY_COPY } from "../../../app/components/career/demo/role-discovery-copy";
import { decodeRoleDiscovery, type RoleDiscoveryState } from "../../../lib/career/ui/role-discovery";

/**
 * RI-START (GELB c1954ca / 0e03f69; owner D-RD-3 A, D-RD-4): the explicit start of a semantic check of discovered roles — markup,
 * states and the client. Offered only on READY with an executable plan; the user picks the roles (none preselected, at most the
 * limit); the call count stands before the start and is the one confirmed. The answer is shown from the stored investigation and
 * its tasks only: running, completed, partial, budget exhausted, failed, refused — the stand-in named as no model; no relation, no
 * ranking, the status groups unchanged. Flows (one POST per click, none on a load) in discovery-start-flow.test.tsx.
 */
type Client = typeof import("../../../lib/career/ui/semantic-investigation");
let si: Client;
beforeAll(async () => { si = await import("../../../lib/career/ui/semantic-investigation").catch(() => ({}) as Client); });
const POOLS = [UPLOAD_ALPHA, UPLOAD_ZETA];
const PANEL_POOLS = POOLS.map((id, at) => ({ jobPoolUploadId: id, poolId: `p${at}`, poolVersion: 1, poolName: at ? "Zeta Pool" : "Alpha Pool", poolStatus: "ACTIVE", organizationCount: 1, roleCount: 1, requirementCount: 1, uploadedByActorRef: "a", uploadedAt: "2026-10-24T00:00:00.000Z" }));
const available = (body: { discovery: unknown }): RoleDiscoveryState => ({ state: "AVAILABLE", discovery: decodeRoleDiscovery(body.discovery, PERSON_ANALYSIS, POOLS)! });
const panel = (discovery: RoleDiscoveryState, extra: Record<string, unknown> = {}, locale: "de" | "en" = "de") => renderToString(
  <panelModule.RoleDiscoveryPanel locale={locale} pools={{ state: "AVAILABLE", jobPools: PANEL_POOLS as never }} released={POOLS} discovery={discovery} onRelease={() => undefined} onClose={() => undefined} onStart={() => undefined} {...extra} />
);
const visibleText = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ");
const tags = (html: string, testid: string) => html.match(new RegExp(`<[^>]*data-testid="${testid}"[^>]*>`, "g")) ?? [];
const MODEL_NAMES = /gemini|gpt|claude|flash|llama|mistral|openai|anthropic/i;
const roleKeys = (body: { discovery: { roles: Array<{ key: { jobPoolUploadId: string; poolRoleId: string } }> } }) => body.discovery.roles.map(r => `${r.key.jobPoolUploadId}:${r.key.poolRoleId}`);

describe("RI-START · the explicit start, its states and its client", () => {
  it("REPRODUCE: READY with an executable plan offers the start — roles to pick (none picked, no 'all'), the count, the button waiting", async () => {
    const body = await plannedBody(0, 3);
    const html = panel(available(body));
    expect(tags(html, "rd-start")).toHaveLength(1);
    expect(tags(html, "rd-start")[0]).toContain('data-picked="0"');
    expect(visibleText(html)).toContain("SEMANTISCHE PRÜFUNG · AUSDRÜCKLICH STARTEN");
    expect(visibleText(html)).toContain("Wähle die Rollen selbst aus, höchstens 3. Nichts ist vorausgewählt; gestartet wird nur mit diesem Knopf.");
    expect(visibleText(html)).toContain("Noch keine Rolle gewählt.");
    expect(tags(html, "rd-start-run")[0]).toMatch(/disabled=""/);
    // A pick for every shown role with pairs (the role without requirements has none); none checked.
    const withPairs = body.discovery.semanticPlan.roles.filter(r => r.pairs > 0).map(r => `${r.jobPoolUploadId}:${r.poolRoleId}`);
    const shownKeys = [...html.matchAll(/data-testid="rd-role" data-role-key="([^"]+)"/g)].map(m => m[1]);
    expect(tags(html, "rd-role-pick").map(t => /data-role-key="([^"]+)"/.exec(t)![1])).toEqual(shownKeys.filter(key => withPairs.includes(key)));
    const picks = html.match(/data-testid="rd-role-pick"[\s\S]*?<input[^>]*>/g)!;
    expect(picks.every(input => !/checked=""/.test(input))).toBe(true);
    expect([...html.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map(m => m[1]).filter(label => /\b(all|alle)\b/i.test(label))).toEqual([]);
    expect(visibleText(panel(available(body), {}, "en"))).toContain("START SEMANTIC CHECK");
  });

  it("REPRODUCE: the client sends exactly the confirmed request and reads only the stored investigation (STAND_IN, this analysis)", async () => {
    const sent: Array<{ url: string; init: { method: string; body?: string; headers?: Record<string, string> } }> = [];
    const answer = (status: number, body: unknown) => async (url: string, init: never) => { sent.push({ url, init }); return { status, json: async () => body }; };
    const stored = storedInvestigation("COMPLETED", [{ jobPoolUploadId: UPLOAD_ALPHA, poolRoleId: "role_fs", status: "SUCCEEDED", pairs: 16, stored: 16 }]);
    const request = { jobPoolUploadIds: POOLS, roles: [{ jobPoolUploadId: UPLOAD_ALPHA, poolRoleId: "role_fs" }], clientRequestId: "crq_1", confirmedCalls: 1 };
    const ran = await si.startInvestigation(PERSON_ANALYSIS, request, answer(201, { success: true, created: true, evidenceClass: "STAND_IN", ...stored, run: { status: "COMPLETED", roles: [] } }) as never);
    expect(sent).toHaveLength(1);
    expect(sent[0].url).toBe(`/api/career/analyses/${PERSON_ANALYSIS}/role-discovery/investigations`);
    expect(sent[0].init.method).toBe("POST");
    expect(JSON.parse(sent[0].init.body!)).toEqual({ jobPoolUploadIds: POOLS, roles: [{ jobPoolUploadId: UPLOAD_ALPHA, poolRoleId: "role_fs" }], clientRequestId: "crq_1", confirmedCalls: 1 });
    expect(ran).toEqual({ state: "STORED", created: true, investigation: { ...stored.investigation, tasks: stored.tasks } });
    expect(await si.startInvestigation(PERSON_ANALYSIS, request, answer(200, { success: true, created: false, evidenceClass: "STAND_IN", ...stored }) as never)).toMatchObject({ state: "STORED", created: false });
    const read = await si.readInvestigation(PERSON_ANALYSIS, INVESTIGATION_ID, answer(200, { success: true, evidenceClass: "STAND_IN", ...stored }) as never);
    expect(sent.at(-1)!.init.method).toBe("GET");
    expect(sent.at(-1)!.url).toBe(`/api/career/analyses/${PERSON_ANALYSIS}/role-discovery/investigations/${INVESTIGATION_ID}`);
    expect(read).toEqual({ state: "STORED", created: null, investigation: { ...stored.investigation, tasks: stored.tasks } });
    // Not this contract: FAILED, never a partial success — and never a provider's name taken over.
    const refusedBodies: Array<[string, number, unknown]> = [
      ["a real provider", 201, { success: true, created: true, evidenceClass: "STAND_IN", ...storedInvestigation("COMPLETED", stored.tasks, { provider: "gemini" }) }],
      ["201 without STAND_IN", 201, { success: true, created: true, ...stored }],
      ["201 not created", 201, { success: true, created: false, evidenceClass: "STAND_IN", ...stored }],
      ["200 created", 200, { success: true, created: true, evidenceClass: "STAND_IN", ...stored }],
      ["200 repeat without evidenceClass (PINK §3.74 O-START-2: required on every success path now)", 200, { success: true, created: false, ...stored }],
      ["another analysis", 201, { success: true, created: true, evidenceClass: "STAND_IN", ...storedInvestigation("COMPLETED", stored.tasks, { analysisId: "ANL_OTHER" }) }],
      ["a guessed id", 201, { success: true, created: true, evidenceClass: "STAND_IN", ...storedInvestigation("COMPLETED", stored.tasks, { investigationId: "RINV_1" }) }],
      ["an unknown status", 201, { success: true, created: true, evidenceClass: "STAND_IN", ...storedInvestigation("DONE", stored.tasks) }],
      ["a score on a task", 201, { success: true, created: true, evidenceClass: "STAND_IN", investigation: stored.investigation, tasks: [{ ...stored.tasks[0], score: 0.9 }] }],
      ["no tasks", 201, { success: true, created: true, evidenceClass: "STAND_IN", investigation: stored.investigation, tasks: [] }],
      ["a task twice", 201, { success: true, created: true, evidenceClass: "STAND_IN", investigation: stored.investigation, tasks: [stored.tasks[0], stored.tasks[0]] }]
    ];
    for (const [name, status, body] of refusedBodies) expect(await si.startInvestigation(PERSON_ANALYSIS, request, answer(status, body) as never), name).toEqual({ state: "FAILED", code: null });
    expect(await si.readInvestigation(PERSON_ANALYSIS, "RINV_FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", answer(200, { success: true, evidenceClass: "STAND_IN", ...stored }) as never)).toEqual({ state: "FAILED", code: null });
    expect(await si.readInvestigation(PERSON_ANALYSIS, INVESTIGATION_ID, answer(200, { success: true, ...stored }) as never), "GET without evidenceClass").toEqual({ state: "FAILED", code: null });
    // Refusals before a run are REFUSED (nothing ran); a failure from inside or no answer is FAILED (unknown).
    const issue = (code: string, extra: Record<string, unknown> = {}) => ({ success: false, issues: [{ code, ...extra }] });
    expect(await si.startInvestigation(PERSON_ANALYSIS, request, answer(409, issue("ERR_INVESTIGATION_CALLS_NOT_CONFIRMED", { callsNeeded: 3 })) as never)).toEqual({ state: "REFUSED", code: "ERR_INVESTIGATION_CALLS_NOT_CONFIRMED", confirmedCalls: 1, callsNeeded: 3, max: null });
    expect(await si.startInvestigation(PERSON_ANALYSIS, request, answer(400, issue("ERR_INVESTIGATION_TOO_MANY_ROLES", { max: 5 })) as never)).toEqual({ state: "REFUSED", code: "ERR_INVESTIGATION_TOO_MANY_ROLES", confirmedCalls: 1, callsNeeded: null, max: 5 });
    expect(await si.startInvestigation(PERSON_ANALYSIS, request, answer(503, issue("ERR_RELATION_CACHE_UNAVAILABLE")) as never)).toMatchObject({ state: "REFUSED", code: "ERR_RELATION_CACHE_UNAVAILABLE" });
    expect(await si.startInvestigation(PERSON_ANALYSIS, request, answer(500, issue("ERR_INVESTIGATION_FAILED")) as never)).toEqual({ state: "FAILED", code: "ERR_INVESTIGATION_FAILED" });
    expect(await si.startInvestigation(PERSON_ANALYSIS, request, (async () => { throw new Error("offline"); }) as never)).toEqual({ state: "FAILED", code: null });
    expect(await si.readInvestigation(PERSON_ANALYSIS, INVESTIGATION_ID, answer(404, issue("ERR_INVESTIGATION_NOT_FOUND")) as never)).toEqual({ state: "NOT_FOUND" });
  });

  it("REPRODUCE: every state is said honestly — running, completed, partial, budget exhausted, failed with code, interrupted, replayed; stand-in, no model", async () => {
    const body = await plannedBody();
    const [fs, data, , ops] = body.discovery.roles.map(r => r.key);
    const view = (investigation: unknown) => { const html = panel(available(body), { investigation }); return { html, text: visibleText(html) }; };
    const running = view({ state: "STARTING", roles: [fs, data], confirmedCalls: 2 });
    expect(tags(running.html, "rd-investigation")[0]).toContain('data-state="STARTING"');
    expect(tags(running.html, "rd-investigation")[0]).toContain('aria-busy="true"');
    expect(running.text).toContain("Semantische Prüfung läuft · 2 Rollen · 2 bestätigte Aufrufe");
    expect(tags(running.html, "rd-start-run")[0]).toMatch(/disabled=""/);
    const done = view({ state: "STORED", created: true, investigation: { ...storedInvestigation("COMPLETED", [{ ...fs, status: "SUCCEEDED", pairs: 16, stored: 16 }, { ...data, status: "CACHED", pairs: 4 }]).investigation, tasks: storedInvestigation("COMPLETED", [{ ...fs, status: "SUCCEEDED", pairs: 16, stored: 16 }, { ...data, status: "CACHED", pairs: 4 }]).tasks } });
    expect(done.text).toContain("Semantische Prüfung: abgeschlossen");
    expect(done.text).toContain("Stand-in, kein Modell");
    expect(done.text).toContain("abgeschlossen · 16 Paare · 16 Relationen gespeichert");
    expect(done.text).toContain("aus dem Relationen-Cache, kein Aufruf · 4 Paare · 0 Relationen gespeichert");
    expect(done.text).toContain("Die Relationen selbst werden hier nicht angezeigt.");
    expect(tags(done.html, "rd-investigation")[0]).toContain(`data-investigation-id="${INVESTIGATION_ID}"`);
    const stored = (status: string, tasks: Parameters<typeof storedInvestigation>[1], created: boolean | null = true) => { const s = storedInvestigation(status, tasks); return { state: "STORED", created, investigation: { ...s.investigation, tasks: s.tasks } }; };
    const budget = view(stored("PARTIAL", [{ ...fs, status: "SUCCEEDED", stored: 16 }, { ...data, status: "BUDGET_EXHAUSTED", errorCode: "ERR_BUDGET_EXHAUSTED" }, { ...ops, status: "CANCELLED" }]));
    expect(budget.text).toContain("Semantische Prüfung: teilweise abgeschlossen");
    expect(budget.text).toContain("Budget erschöpft: Die übrigen Rollen wurden ohne Aufruf abgebrochen.");
    expect(budget.text).toContain("Budget erschöpft · 4 Paare · 0 Relationen gespeichert · Code: ERR_BUDGET_EXHAUSTED");
    expect(budget.text).toContain("abgebrochen, kein Aufruf");
    const failed = view(stored("FAILED", [{ ...fs, status: "FAILED", errorCode: "ERR_RELATION_OUTPUT_INVALID" }]));
    expect(failed.text).toContain("Semantische Prüfung: fehlgeschlagen");
    expect(failed.text).toContain("Code: ERR_RELATION_OUTPUT_INVALID");
    expect(view(stored("INTERRUPTED", [{ ...fs, status: "RUNNING" }])).text).toContain("Semantische Prüfung: unterbrochen");
    expect(view(stored("RUNNING", [{ ...fs, status: "RUNNING" }], null)).text).toContain("Semantische Prüfung: läuft (gespeicherter Stand)");
    expect(view(stored("COMPLETED", [{ ...fs, status: "SUCCEEDED" }], false)).text).toContain("Gleicher Start wie zuvor: gespeicherter Stand, nichts neu ausgeführt.");
    // The tasks stand in the discovery's role order, whatever order the store returns.
    const order = view(stored("COMPLETED", [{ ...ops, status: "SUCCEEDED" }, { ...fs, status: "SUCCEEDED" }]));
    expect([...order.html.matchAll(/data-testid="rd-investigation-task" data-role-key="([^"]+)"/g)].map(m => m[1])).toEqual([fs, ops].map(k => `${k.jobPoolUploadId}:${k.poolRoleId}`));
    // The role rows name their stored task; the open trace too (no longer "not executed" for that role).
    const statusOf = new Map([[fs, "SUCCEEDED"], [data, "BUDGET_EXHAUSTED"], [ops, "CANCELLED"]].map(([k, v]) => [`${(k as typeof fs).jobPoolUploadId}:${(k as typeof fs).poolRoleId}`, v as string]));
    const rowsShown = [...budget.html.matchAll(/data-testid="rd-role" data-role-key="([^"]+)"/g)].map(m => m[1]);
    expect(rowsShown.filter(key => statusOf.has(key)).length).toBeGreaterThan(1);
    expect(tags(budget.html, "rd-role-task").map(t => /data-status="([A-Z_]+)"/.exec(t)![1])).toEqual(rowsShown.filter(key => statusOf.has(key)).map(key => statusOf.get(key)));
    for (const { html } of [running, done, budget, failed]) expect(visibleText(html)).not.toMatch(MODEL_NAMES);
    for (const status of ["COMPLETED", "PARTIAL", "FAILED", "INTERRUPTED"]) expect(view(stored(status, [{ ...fs, status: "SUCCEEDED" }])).text).toContain("Stand-in, kein Modell");
  });

  it("REPRODUCE: a refused start says that nothing started, with its code; a changed call count offers re-reading the plan", async () => {
    const body = await plannedBody();
    const view = (investigation: unknown) => { const html = panel(available(body), { investigation, onReread: () => undefined }); return { html, text: visibleText(html) }; };
    const cases: Array<[unknown, string]> = [
      [{ state: "REFUSED", code: "ERR_SEMANTIC_ENGINE_NOT_CONFIGURED", confirmedCalls: 2, callsNeeded: null, max: null }, "Nicht gestartet: Auf diesem Server ist keine Prüf-Engine konfiguriert."],
      [{ state: "REFUSED", code: "ERR_SEMANTIC_PROVIDER_NOT_AUTHORIZED", confirmedCalls: 2, callsNeeded: null, max: null }, "Nicht gestartet: Der konfigurierte Anbieter ist nicht freigegeben."],
      [{ state: "REFUSED", code: "ERR_INVESTIGATION_CALLS_NOT_CONFIRMED", confirmedCalls: 2, callsNeeded: 3, max: null }, "Nicht gestartet: Der Server nennt jetzt 3 Aufrufe statt der bestätigten 2. Lies den Plan neu und bestätige erneut."],
      [{ state: "REFUSED", code: "ERR_INVESTIGATION_TOO_MANY_ROLES", confirmedCalls: 2, callsNeeded: null, max: 5 }, "Nicht gestartet: höchstens 5 Rollen je Start."],
      [{ state: "REFUSED", code: "ERR_INVESTIGATION_ROLES_INVALID", confirmedCalls: 2, callsNeeded: null, max: null }, "Nicht gestartet: Die Rollenauswahl ist ungültig."],
      [{ state: "REFUSED", code: "ERR_INVESTIGATION_ROLE_NOT_IN_DISCOVERY", confirmedCalls: 2, callsNeeded: null, max: null }, "gehört nicht zur Rollenfindung dieser Freigabe"],
      [{ state: "REFUSED", code: "ERR_RELATION_CACHE_UNAVAILABLE", confirmedCalls: 2, callsNeeded: null, max: null }, "Nicht gestartet: Der Relationen-Cache ist nicht verfügbar."],
      [{ state: "REFUSED", code: "ERR_ROLE_DISCOVERY_POOL_INACTIVE", confirmedCalls: 2, callsNeeded: null, max: null }, "Nicht gestartet."],
      // PINK §3.74 O-START-1: cross-site and the wrong content type are refused the same way as any other pre-run refusal — a
      // generic sentence plus the code, never a specific explanation (nothing about the request's own headers is shown to the user).
      [{ state: "REFUSED", code: "ERR_INVESTIGATION_CROSS_SITE", confirmedCalls: 2, callsNeeded: null, max: null }, "Nicht gestartet."],
      [{ state: "REFUSED", code: "ERR_INVESTIGATION_CONTENT_TYPE", confirmedCalls: 2, callsNeeded: null, max: null }, "Nicht gestartet."],
      [{ state: "FAILED", code: null }, "Keine lesbare Antwort des Servers. Ob etwas gelaufen ist, ist unbekannt."],
      [{ state: "FAILED", code: "ERR_INVESTIGATION_FAILED" }, "Code: ERR_INVESTIGATION_FAILED"]
    ];
    for (const [investigation, sentence] of cases) {
      const { html, text } = view(investigation);
      expect(text, sentence).toContain(sentence);
      const code = (investigation as { code: string | null }).code;
      if (code !== null) expect(text, code).toContain(`Code: ${code}`);
      expect(tags(html, "rd-replan").length, sentence).toBe(code === "ERR_INVESTIGATION_CALLS_NOT_CONFIRMED" ? 1 : 0);
    }
    // The call count of the start is the plan's again after a re-read; the plan as read is named so once a check was started.
    const p = body.discovery.semanticPlan;
    expect(view({ state: "REFUSED", code: "ERR_INVESTIGATION_CALLS_NOT_CONFIRMED", confirmedCalls: 2, callsNeeded: 3, max: null }).text).toContain(`Plan beim Lesen: 0 von ${p.pairs} Paaren im Relationen-Cache · würde ${p.callsNeeded} Aufrufe benötigen`);
  });

  it("guard: D-RD-4 — a stored check changes neither the groups nor the order inside them; no relation and no ranking is shown", async () => {
    const body = await plannedBody();
    const keys = body.discovery.roles.map(r => r.key);
    const before = panel(available(body));
    const s = storedInvestigation("COMPLETED", keys.map(k => ({ ...k, status: "SUCCEEDED", stored: 9 })));
    const after = panel(available(body), { investigation: { state: "STORED", created: true, investigation: { ...s.investigation, tasks: s.tasks } } });
    const groups = (html: string) => [...html.matchAll(/data-testid="rd-group-([A-Z_]+)" data-expanded="(true|false)" data-count="(\d+)"/g)].map(m => m.slice(1).join("/"));
    const rows = (html: string) => [...html.matchAll(/data-testid="rd-role" data-role-key="([^"]+)"/g)].map(m => m[1]);
    expect(groups(after)).toEqual(groups(before));
    expect(rows(after)).toEqual(rows(before));
    expect(visibleText(after)).not.toMatch(/EQUIVALENT|COVERS|PARTIAL\b|DIFFERENT|UNCLEAR|score|%|\bRang\b|ranking/i);
  });

  it("inverse: no start without READY + an executable plan, and none without the field's start — the panel stays as it was", async () => {
    const offs: Array<[string, { discovery: unknown }]> = [
      ["not configured", discoveryBody()],
      ["provider not authorised", { discovery: { ...discoveryBody().discovery, startControl: { engineState: "PROVIDER_NOT_AUTHORIZED", maxRoles: null } } }],
      ["cache unavailable", await discoveryBodyWithPlan(STANDIN_ENGINE, null)]
    ];
    for (const [name, body] of offs) {
      const html = panel(available(body));
      expect(tags(html, "rd-start"), name).toEqual([]);
      expect(tags(html, "rd-role-pick"), name).toEqual([]);
      expect(tags(html, "rd-investigation"), name).toEqual([]);
      expect(html.match(/<input[^>]*type="checkbox"[^>]*>/g), name).toHaveLength(2);
    }
    // READY, but the panel without onStart (as every caller before RI-START): nothing to start, nothing changed.
    const ready = await plannedBody();
    const html = renderToString(<panelModule.RoleDiscoveryPanel locale="de" pools={{ state: "AVAILABLE", jobPools: PANEL_POOLS as never }} released={POOLS} discovery={available(ready)} onRelease={() => undefined} onClose={() => undefined} />);
    expect(tags(html, "rd-start")).toEqual([]);
    expect(tags(html, "rd-role-pick")).toEqual([]);
    expect(roleKeys(ready).length).toBeGreaterThan(0);
    // The owner's semantic line stands unchanged while no check was started.
    const p = ready.discovery.semanticPlan;
    expect(visibleText(html)).toContain(`Semantische Prüfung: nicht ausgeführt · 0 von ${p.pairs} Paaren im Relationen-Cache · würde ${p.callsNeeded} Aufrufe benötigen · keine Untersuchung in dieser Ansicht benannt`);
    expect(ROLE_DISCOVERY_COPY.de.detail.semantic).toBe("Semantische Prüfung dieser Rolle: nicht ausgeführt");
  });
});
