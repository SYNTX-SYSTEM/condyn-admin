import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { PERSON_ANALYSIS, STANDIN_ENGINE, UPLOAD_ALPHA, UPLOAD_ZETA, discoveryBody, discoveryBodyWithPlan } from "./discovery-fixtures";
import { RoleDiscoveryPanel } from "../../../app/components/career/demo/RoleDiscoveryPanel";
import { decodeRoleDiscovery, readRoleDiscovery, type RoleDiscoveryState } from "../../../lib/career/ui/role-discovery";

/**
 * RI-CONTROL (GELB 0e03f69, role investigation UI): beside the unchanged semantic plan the read reports its start control —
 * engineState NOT_CONFIGURED | PROVIDER_NOT_AUTHORIZED | READY and, on READY only, the role limit of one start. The decoder takes it
 * exactly (no provider name, the limit 1 … 25, consistent with the plan); the panel says apart why a start is not offered.
 */
const POOLS = [UPLOAD_ALPHA, UPLOAD_ZETA];
const PANEL_POOLS = [{ jobPoolUploadId: UPLOAD_ALPHA, poolId: "pool_a", poolVersion: 1, poolName: "Alpha Pool", poolStatus: "ACTIVE", organizationCount: 2, roleCount: 4, requirementCount: 6, uploadedByActorRef: "a", uploadedAt: "2026-10-24T00:00:00.000Z" }];
const emptyCache = { state: "AVAILABLE", reader: { getByKeys: async () => [] } } as const;
const corruptCache = { state: "AVAILABLE", reader: { getByKeys: async () => { throw new Error("ERR_RELATION_CACHE_RECORD_CORRUPT: X"); } } } as const;
const decode = (discovery: unknown) => decodeRoleDiscovery(discovery, PERSON_ANALYSIS, POOLS);
const available = (discovery: unknown): RoleDiscoveryState => ({ state: "AVAILABLE", discovery: decode(discovery)! });
const panel = (discovery: RoleDiscoveryState, locale: "de" | "en" = "de") => renderToString(<RoleDiscoveryPanel locale={locale} pools={{ state: "AVAILABLE", jobPools: PANEL_POOLS as never }} released={POOLS} discovery={discovery} onRelease={() => undefined} onClose={() => undefined} />);
const visibleText = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ");
const tag = (html: string, testid: string) => html.match(new RegExp(`<[^>]*data-testid="${testid}"[^>]*>`))?.[0] ?? null;

describe("RI-CONTROL · the start control beside the plan", () => {
  it("REPRODUCE: a start control outside the contract (absent, a provider name, a limit out of range, inconsistent with the plan) is FAILED", async () => {
    const none = discoveryBody().discovery;
    const planned = (await discoveryBodyWithPlan(STANDIN_ENGINE, emptyCache)).discovery;
    const variants: Array<[string, unknown]> = [
      ["absent", { ...none, startControl: undefined }],
      ["READY without an engine in the plan", { ...none, startControl: { engineState: "READY", maxRoles: 10 } }],
      ["NOT_CONFIGURED with a planned engine", { ...planned, startControl: { engineState: "NOT_CONFIGURED", maxRoles: null } }],
      ["PROVIDER_NOT_AUTHORIZED with a planned engine", { ...planned, startControl: { engineState: "PROVIDER_NOT_AUTHORIZED", maxRoles: null } }],
      ["READY limit 0", { ...planned, startControl: { engineState: "READY", maxRoles: 0 } }],
      ["READY limit above the hard cap", { ...planned, startControl: { engineState: "READY", maxRoles: 26 } }],
      ["READY limit null", { ...planned, startControl: { engineState: "READY", maxRoles: null } }],
      ["READY limit fractional", { ...planned, startControl: { engineState: "READY", maxRoles: 2.5 } }],
      ["a limit without READY", { ...none, startControl: { engineState: "NOT_CONFIGURED", maxRoles: 10 } }],
      ["a provider name", { ...none, startControl: { engineState: "PROVIDER_NOT_AUTHORIZED", maxRoles: null, provider: "gemini" } }],
      ["an unknown state", { ...none, startControl: { engineState: "DISABLED", maxRoles: null } }],
      ["no limit key", { ...none, startControl: { engineState: "NOT_CONFIGURED" } }]
    ];
    for (const [name, discovery] of variants) {
      expect(decode(discovery), name).toBeNull();
      expect((await readRoleDiscovery(PERSON_ANALYSIS, POOLS, async () => ({ status: 200, json: async () => ({ success: true, discovery }) }))).state, name).toBe("FAILED");
    }
  });

  it("REPRODUCE: the panel says apart why no start is offered — not configured, provider not authorised, cache unreadable", async () => {
    const notConfigured = panel(available(discoveryBody().discovery));
    expect(tag(notConfigured, "rd-start-unavailable")).toContain('data-engine-state="NOT_CONFIGURED"');
    expect(visibleText(notConfigured)).toContain("Start nicht verfügbar: Auf diesem Server ist keine Prüf-Engine konfiguriert.");
    const notAuthorized = panel(available({ ...discoveryBody().discovery, startControl: { engineState: "PROVIDER_NOT_AUTHORIZED", maxRoles: null } }));
    expect(tag(notAuthorized, "rd-start-unavailable")).toContain('data-engine-state="PROVIDER_NOT_AUTHORIZED"');
    expect(visibleText(notAuthorized)).toContain("Start nicht verfügbar: Der konfigurierte Anbieter ist nicht freigegeben.");
    expect(visibleText(notAuthorized)).not.toContain("keine Prüf-Engine konfiguriert");
    for (const cache of [corruptCache, null]) {
      const html = panel(available((await discoveryBodyWithPlan(STANDIN_ENGINE, cache as never)).discovery));
      expect(tag(html, "rd-start-unavailable")).toContain('data-engine-state="READY"');
      expect(visibleText(html)).toContain("Start nicht verfügbar, solange der Relationen-Cache nicht gelesen werden kann.");
    }
    expect(visibleText(panel(available({ ...discoveryBody().discovery, startControl: { engineState: "PROVIDER_NOT_AUTHORIZED", maxRoles: null } }), "en"))).toContain("Start not available: the configured provider is not authorised.");
  });

  it("inverse: READY with an executable plan states no refusal; the owner's semantic line, header and groups stay as they were", async () => {
    const planned = (await discoveryBodyWithPlan(STANDIN_ENGINE, emptyCache, POOLS, 4)).discovery;
    const decoded = decode(planned);
    expect(decoded?.startControl).toEqual({ engineState: "READY", maxRoles: 4 });
    const html = panel(available(planned));
    expect(tag(html, "rd-start-unavailable")).toBeNull();
    const p = planned.semanticPlan;
    expect(visibleText(html)).toContain(`Semantische Prüfung: nicht ausgeführt · 0 von ${p.pairs} Paaren im Relationen-Cache · würde ${p.callsNeeded} Aufrufe benötigen · nicht gestartet`);
    const none = discoveryBody();
    const plain = panel(available(none.discovery));
    expect(visibleText(plain)).toContain(`Semantische Prüfung: nicht ausgeführt · würde ${none.discovery.semanticPlan.callsNeeded} Aufrufe für ${none.discovery.semanticPlan.pairs} Paare benötigen · nicht gestartet`);
    expect(visibleText(plain)).toContain("Namensbezug · lexikalisch · nicht semantisch · nicht bewertet · keine Rangfolge");
    expect([...plain.matchAll(/data-testid="rd-group-([A-Z_]+)"/g)].map(m => m[1])).toEqual(["ALL_REQUIREMENTS_NAME_RELATED", "PARTIAL_NAME_RELATED", "WEAK_LEXICAL_ONLY", "NO_LEXICAL_RELATION", "NO_REQUIREMENTS"]);
    expect((await readRoleDiscovery(PERSON_ANALYSIS, POOLS, async () => ({ status: 200, json: async () => none }))).state).toBe("AVAILABLE");
  });
});
