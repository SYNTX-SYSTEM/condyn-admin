import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { PERSON_ANALYSIS, STANDIN_ENGINE, UPLOAD_ALPHA, UPLOAD_ZETA, discoveryBody, discoveryBodyWithPlan } from "./discovery-fixtures";
import { ANALYSIS, boundary, resultBody } from "./fixtures";

/**
 * RD-PANEL (GELB stage 2, additive — recovery §8): role discovery is a panel beside the six-orbit planetarium of a PERSON analysis,
 * opened by the explicit DISCOVER JOBS; the six orbits, their rays and coupling stay. Pools are unticked choices; roles stand in the
 * five status groups in their fixed order, two folded; relations are named lexical; the semantic state is always stated. Markup here
 * (server render); the flows (one push, close, reload) in discovery-panel-flow.test.tsx.
 */
const POOLS = [
  { jobPoolUploadId: UPLOAD_ALPHA, poolId: "pool_a", poolVersion: 1, poolName: "Alpha Pool", poolStatus: "ACTIVE", organizationCount: 2, roleCount: 4, requirementCount: 6, uploadedByActorRef: "a", uploadedAt: "2026-10-24T00:00:00.000Z" },
  { jobPoolUploadId: UPLOAD_ZETA, poolId: "pool_z", poolVersion: 2, poolName: "Zeta Pool", poolStatus: "ACTIVE", organizationCount: 1, roleCount: 2, requirementCount: 2, uploadedByActorRef: "a", uploadedAt: "2026-10-24T00:00:00.000Z" },
  { jobPoolUploadId: "JPOOL_C0000000000000000000000000000003", poolId: "pool_d", poolVersion: 1, poolName: "Draft Pool", poolStatus: "DRAFT", organizationCount: 1, roleCount: 1, requirementCount: 1, uploadedByActorRef: "a", uploadedAt: "2026-10-24T00:00:00.000Z" }
];
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => ({ state: "NONE" }) }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "AVAILABLE", jobPools: POOLS }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
// The PERSON result on view: its boundary resolved PERSON, its persisted result read (as first-screen-ssr's PERSON case).
const control = vi.hoisted(() => ({ boundary: null as unknown, result: null as unknown }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: (id: string | null) => id === null ? { state: "IDLE" } : control.boundary, useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: (id: string | null) => id === null ? { state: "IDLE" } : control.result }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
// The panel module is new: loaded lazily, so a base without it fails test by test, not at the file's import.
type PanelModule = typeof import("../../../app/components/career/demo/RoleDiscoveryPanel");
let rd: PanelModule;
beforeAll(async () => { rd = await import("../../../app/components/career/demo/RoleDiscoveryPanel").catch(() => ({}) as PanelModule); });
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { decodeRoleDiscovery, type RoleDiscoveryState } from "../../../lib/career/ui/role-discovery";
import { decodeAnalysisResult } from "../../../lib/career/view-model/pxj-first-screen";

const personResult = () => {
  const decoded = decodeAnalysisResult(resultBody(), ANALYSIS);
  if (!decoded.ok) throw new Error(decoded.code);
  control.boundary = { state: "RESOLVED", value: boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) };
  control.result = { state: "AVAILABLE", result: decoded.result };
};

const field = (props: Record<string, unknown>) => { personResult(); return renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="CAPABILITY" {...props} />); };
const panel = (discovery: RoleDiscoveryState, extra: Record<string, unknown> = {}) => renderToString(
  <rd.RoleDiscoveryPanel locale="de" pools={{ state: "AVAILABLE", jobPools: POOLS as never }} released={[UPLOAD_ALPHA, UPLOAD_ZETA]} discovery={discovery} onRelease={() => undefined} onClose={() => undefined} {...extra} />
);
const available = (body: { discovery: unknown }): RoleDiscoveryState => ({ state: "AVAILABLE", discovery: decodeRoleDiscovery(body.discovery, PERSON_ANALYSIS, [UPLOAD_ALPHA, UPLOAD_ZETA])! });
const visibleText = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ");
const SIX = ["01", "02", "03", "04", "05", "06"];
const tags = (html: string, testid: string) => html.match(new RegExp(`<[^>]*data-testid="${testid}"[^>]*>`, "g")) ?? [];

describe("RD-PANEL · role discovery beside the six orbits", () => {
  it("REPRODUCE: a PERSON analysis on view offers DISCOVER JOBS; the panel is not open; all six orbits, rays and coupling stand", () => {
    const html = field({ investigationMode: "PERSON", analysisId: ANALYSIS });
    expect(html).toContain('data-testid="rd-entry"');
    expect(html).toContain('data-testid="rd-open"');
    expect(html).not.toContain('data-testid="role-discovery-panel"');
    for (const stage of SIX) expect(html).toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
    for (const stage of ["03", "04", "05", "06"]) expect(html).toContain(`data-testid="energy-ray-${stage}"`);
    expect(html).toContain('data-testid="inter-orbital-coupling"');
  });

  it("REPRODUCE: released pools in the URL open the panel (reading); the uploads are the choices, only the released ones ticked", () => {
    const html = field({ investigationMode: "PERSON", analysisId: ANALYSIS, discoveryPoolUploadIds: [UPLOAD_ZETA] });
    expect(tags(html, "role-discovery-panel")[0]).toContain('data-state="LOADING"');
    expect(html).not.toContain('data-testid="rd-entry"');
    for (const stage of SIX) expect(html).toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
    const checkbox = (id: string) => html.match(new RegExp(`data-testid="rd-pool-${id}"[\\s\\S]*?<input[^>]*>`))![0];
    expect(checkbox(UPLOAD_ZETA)).toMatch(/checked=""/);
    expect(checkbox(UPLOAD_ALPHA)).not.toMatch(/checked=""/);
    expect(checkbox("JPOOL_C0000000000000000000000000000003")).toMatch(/disabled=""/);
    // The uploads are the only choices: one checkbox each, no "all" control.
    expect(html.match(/<input[^>]*type="checkbox"[^>]*>/g)).toHaveLength(3);
    expect([...html.matchAll(/<button[^>]*>([^<]*)<\/button>/g)].map(m => m[1]).filter(label => /\b(all|alle)\b/i.test(label))).toEqual([]);
  });

  it("guard: without released pools nothing is preselected and DISCOVER JOBS waits for a choice", () => {
    const html = panel({ state: "IDLE" }, { released: null });
    expect(html.match(/<input[^>]*type="checkbox"[^>]*>/g)!.every(input => !/checked=""/.test(input))).toBe(true);
    expect(tags(html, "rd-discover")[0]).toMatch(/disabled=""/);
    expect(tags(html, "rd-state")[0]).toContain('data-state="IDLE"');
    expect(visibleText(html)).toContain("Kein Pool freigegeben.");
  });

  it("guard: the header and the semantic state in the owner's words; the five groups in their fixed order, two folded but present", () => {
    const body = discoveryBody();
    const html = panel(available(body));
    expect(visibleText(html)).toContain("Namensbezug · lexikalisch · nicht semantisch · nicht bewertet · keine Rangfolge");
    const plan = body.discovery.semanticPlan;
    expect(plan.state).toBe("ENGINE_NOT_SPECIFIED");
    expect(visibleText(html)).toContain(`Semantische Prüfung: nicht ausgeführt · würde ${plan.callsNeeded} Aufrufe für ${plan.pairs} Paare benötigen · nicht gestartet`);
    const order = [...html.matchAll(/data-testid="rd-group-([A-Z_]+)" data-expanded="(true|false)" data-count="(\d+)"/g)].map(m => [m[1], m[2], Number(m[3])]);
    expect(order.map(([status, expanded]) => [status, expanded])).toEqual([["ALL_REQUIREMENTS_NAME_RELATED", "true"], ["PARTIAL_NAME_RELATED", "true"], ["WEAK_LEXICAL_ONLY", "true"], ["NO_LEXICAL_RELATION", "false"], ["NO_REQUIREMENTS", "false"]]);
    expect(order.map(([, , count]) => count)).toEqual(body.discovery.groups.map(group => group.roles.length));
    // Inside a group the roles stand in the discovery's own deterministic order — nothing is sorted by a count.
    const shown = [...html.matchAll(/data-role-key="([^"]+)"/g)].map(m => m[1]);
    expect(shown).toEqual(body.discovery.groups.slice(0, 3).flatMap(group => group.roles.map(key => `${key.jobPoolUploadId}:${key.poolRoleId}`)));
    expect(html).toContain("Nur Wort-Treffer (schwach)");
    const text = visibleText(html).replace("nicht semantisch", "").replace("Semantische Prüfung: nicht ausgeführt", "");
    expect(text).not.toMatch(/passt|passend|semantisch|score|%|\bRang\b/i);
  });

  it("guard: under a cache failure the semantic state names it and the call count stays unknown; PLANNED states the cache", async () => {
    const corrupt = await discoveryBodyWithPlan(STANDIN_ENGINE, { state: "AVAILABLE", reader: { getByKeys: async () => { throw new Error("ERR_RELATION_CACHE_RECORD_CORRUPT: X"); } } });
    expect(visibleText(panel(available(corrupt)))).toContain("Semantische Prüfung: nicht ausgeführt · Relationen-Cache beschädigt (ERR_RELATION_CACHE_RECORD_CORRUPT) · Aufrufzahl unbekannt · nicht gestartet");
    const unavailable = await discoveryBodyWithPlan(STANDIN_ENGINE, null);
    expect(visibleText(panel(available(unavailable)))).toContain("Semantische Prüfung: nicht ausgeführt · Relationen-Cache nicht verfügbar (ERR_RELATION_CACHE_NOT_OPENED) · Aufrufzahl unbekannt · nicht gestartet");
    const planned = await discoveryBodyWithPlan(STANDIN_ENGINE, { state: "AVAILABLE", reader: { getByKeys: async () => [] } });
    const p = planned.discovery.semanticPlan;
    expect(visibleText(panel(available(planned)))).toContain(`Semantische Prüfung: nicht ausgeführt · 0 von ${p.pairs} Paaren im Relationen-Cache · würde ${p.callsNeeded} Aufrufe benötigen · nicht gestartet`);
    const en = renderToString(<rd.RoleDiscoveryPanel locale="en" pools={{ state: "EMPTY" }} released={null} discovery={available(discoveryBody())} onRelease={() => undefined} onClose={() => undefined} />);
    expect(visibleText(en)).toContain("Name relation · lexical · not semantic · not scored · no ranking");
    expect(visibleText(en)).toContain("Semantic check: not executed · would need");
  });

  it("guard: every refusal of the read is its own honest sentence", () => {
    const cases: Array<[RoleDiscoveryState, string]> = [
      [{ state: "NOT_PERSON" }, "keine PERSON-Analyse"],
      [{ state: "PROJECTION_ABSENT" }, "keine Projektion von Fähigkeitsvorschlägen"],
      [{ state: "BOUNDARY_UNRESOLVED", reason: "NOT_DECLARED" } as RoleDiscoveryState, "nicht aufgelöst (NOT_DECLARED)"],
      [{ state: "ANALYSIS_NOT_FOUND" }, "keine Analyse mit dieser ID"],
      [{ state: "POOL_NOT_FOUND", jobPoolUploadId: UPLOAD_ZETA } as RoleDiscoveryState, `Pool ${UPLOAD_ZETA} existiert nicht`],
      [{ state: "POOL_INACTIVE", jobPoolUploadId: UPLOAD_ALPHA } as RoleDiscoveryState, `Pool ${UPLOAD_ALPHA} ist nicht ACTIVE`],
      [{ state: "NOT_PROVISIONED" }, "nicht eingerichtet"],
      [{ state: "FAILED", code: "ERR_X" } as RoleDiscoveryState, "Code: ERR_X"]
    ];
    for (const [state, sentence] of cases) {
      const html = panel(state);
      expect(tags(html, "rd-state")[0]).toContain(`data-state="${state.state}"`);
      expect(visibleText(html)).toContain(sentence);
      expect(html).not.toContain('data-testid="rd-group-');
    }
  });

  it("inverse: no entry and no panel without a PERSON analysis on view, under PERSON × JOB or JOB", () => {
    for (const props of [{ investigationMode: "PERSON" }, { investigationMode: "PERSON", discoveryPoolUploadIds: [UPLOAD_ALPHA] }, { investigationMode: "PERSON_X_JOB", analysisId: ANALYSIS, discoveryPoolUploadIds: [UPLOAD_ALPHA] }, { investigationMode: "JOB", analysisId: ANALYSIS }]) {
      const html = field(props);
      expect(html, JSON.stringify(props)).not.toContain('data-testid="rd-entry"');
      expect(html, JSON.stringify(props)).not.toContain('data-testid="role-discovery-panel"');
    }
    // While the PERSON result is still being read (or missing), the first screen speaks: no discovery beside it.
    personResult();
    control.result = { state: "LOADING" };
    const loading = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="CAPABILITY" investigationMode="PERSON" analysisId={ANALYSIS} discoveryPoolUploadIds={[UPLOAD_ALPHA]} />);
    expect(loading).not.toContain('data-testid="role-discovery-panel"');
    expect(loading).not.toContain('data-testid="rd-entry"');
    // A focused orbit owns the stage: the entry steps back.
    expect(field({ investigationMode: "PERSON", analysisId: ANALYSIS, initialFocus: { stageId: "04", zoomLevel: 1 } })).not.toContain('data-testid="rd-entry"');
  });
});
