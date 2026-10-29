import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { browser, find, instance } from "./harness";
import { PERSON_ANALYSIS, UPLOAD_ALPHA, UPLOAD_ZETA, discoveryBody } from "./discovery-fixtures";

/**
 * RD-DETAIL (GELB stage 2, additive): one role's trace inside the panel — per requirement with a name relation its lexical basis
 * (weak named weak), the capability proposal from exactly lexical.proposalId, the proposal's quotes with their source, the evidence
 * limitation when a quote does not name the requirement; then the open requirements. Opening a trace is a disclosure: no URL, no
 * history. Expectations are read from the fixture's own discovery (GELB's builder), never written out by hand.
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));

import { decodeRoleDiscovery, type RoleDiscoveryState } from "../../../lib/career/ui/role-discovery";
import { ROLE_DISCOVERY_COPY } from "../../../app/components/career/demo/role-discovery-copy";

type PanelModule = typeof import("../../../app/components/career/demo/RoleDiscoveryPanel");
let rd: PanelModule;
beforeAll(async () => { rd = await import("../../../app/components/career/demo/RoleDiscoveryPanel").catch(() => ({}) as PanelModule); });
afterEach(() => { vi.unstubAllGlobals(); });

const POOLS = [UPLOAD_ALPHA, UPLOAD_ZETA];
const discovery = decodeRoleDiscovery(discoveryBody().discovery, PERSON_ANALYSIS, POOLS)!;
const available: RoleDiscoveryState = { state: "AVAILABLE", discovery };
const c = ROLE_DISCOVERY_COPY.de;
const keyOf = (role: (typeof discovery.roles)[number]) => `${role.key.jobPoolUploadId}:${role.key.poolRoleId}`;
const attrs = (html: string, testid: string, name: string) => [...html.matchAll(new RegExp(`data-testid="${testid}"[^>]*?${name}="([^"]*)"`, "g"))].map(m => m[1]);
const visibleText = (html: string) => html.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&quot;/g, "\"").replace(/&#x27;/g, "'").replace(/&amp;/g, "&");

describe("RD-DETAIL · one role's trace", () => {
  it("guard: the fixture carries every case the trace names (exact / composite / weak, a silent quote, an open requirement)", () => {
    const bases = new Set(discovery.roles.flatMap(role => role.requirements.map(r => r.lexical.basis)));
    for (const basis of ["NAME_EXACT", "NAME_COMPOSITE_CONSTITUENT", "NONE"]) expect(bases.has(basis as never), basis).toBe(true);
    expect(discovery.roles.some(role => role.requirements.some(r => r.lexical.basis !== "NONE" && r.lexical.quoteNamesRequirement === false))).toBe(true);
  });

  it("REPRODUCE: each role's trace is exactly its requirements — basis, proposal from lexical.proposalId, quotes with source, limitation, open ones", () => {
    const proposalName = new Map(discovery.proposals.map(p => [p.id, p.name] as const));
    for (const role of discovery.roles.filter(r => r.requirements.length > 0)) {
      const html = renderToString(<rd.RoleDiscoveryTrace c={c} role={role} proposals={discovery.proposals} />);
      const related = role.requirements.filter(r => r.lexical.basis !== "NONE");
      const open = role.requirements.filter(r => r.lexical.basis === "NONE");
      expect(attrs(html, "rd-trace-requirement", "data-requirement-id"), keyOf(role)).toEqual(related.map(r => r.key.poolRequirementId));
      expect(attrs(html, "rd-trace-requirement", "data-basis")).toEqual(related.map(r => r.lexical.basis));
      expect(attrs(html, "rd-trace-requirement", "data-proposal-id")).toEqual(related.map(r => r.lexical.proposalId));
      const text = visibleText(html);
      for (const r of related) {
        if (r.lexical.basis === "NONE") continue;
        expect(text).toContain(`${c.detail.proposal}: ${proposalName.get(r.lexical.proposalId)}`);
        expect(text).toContain(c.detail.basis[r.lexical.basis](r.lexical.matchedConstituent));
        for (const quote of r.lexical.evidence) { expect(text).toContain(`“${quote.exactQuote}”`); expect(text).toContain(`${c.detail.source}: ${quote.sourceDocumentId}`); }
      }
      expect(attrs(html, "rd-trace-quote", "data-source-document-id")).toEqual(related.flatMap(r => r.lexical.basis === "NONE" ? [] : r.lexical.evidence.map(q => q.sourceDocumentId)));
      expect(html.match(/data-testid="rd-trace-quote-silent"/g)?.length ?? 0).toBe(related.filter(r => r.lexical.quoteNamesRequirement === false).length);
      expect(attrs(html, "rd-trace-open-requirement", "data-requirement-id")).toEqual(open.map(r => r.key.poolRequirementId));
      expect(text).toContain(c.detail.openTitle(open.length));
      expect(text).toContain("Semantische Prüfung dieser Rolle: nicht ausgeführt");
      expect(text).not.toMatch(/passt|passend|score|%/i);
    }
    expect(c.detail.basis.WEAK_TOKEN_CONTAINMENT(null)).toBe("Nur Wort-Treffer (schwach) · lexikalisch");
  });

  it("REPRODUCE: opening a trace is a disclosure in the panel — one role at a time, again closes it; no URL write", () => {
    const tab = browser("http://127.0.0.1/career/demo?investigationMode=PERSON");
    vi.stubGlobal("window", tab.window);
    const panel = instance<Record<string, unknown>>(rd.RoleDiscoveryPanel);
    const props = { locale: "de", pools: { state: "EMPTY" }, released: POOLS, discovery: available, onRelease: () => undefined, onClose: () => undefined };
    const results = () => find(panel.settle(props), rd.RoleDiscoveryResults)!;
    expect(results().props.traced).toBeNull();
    const [first, second] = discovery.roles.filter(r => r.requirements.length > 0).map(keyOf);
    (results().props.onTrace as (key: string) => void)(first);
    expect(results().props.traced).toBe(first);
    (results().props.onTrace as (key: string) => void)(second);
    expect(results().props.traced).toBe(second);
    (results().props.onTrace as (key: string) => void)(second);
    expect(results().props.traced).toBeNull();
    expect(tab.writes).toEqual([]);
    // The traced role's row carries the trace, the others do not.
    const html = renderToString(<rd.RoleDiscoveryResults c={c} discovery={available} open={["ALL_REQUIREMENTS_NAME_RELATED", "PARTIAL_NAME_RELATED", "WEAK_LEXICAL_ONLY", "NO_LEXICAL_RELATION", "NO_REQUIREMENTS"]} onToggle={() => undefined} traced={first} onTrace={() => undefined} />);
    expect(html.match(/data-testid="rd-trace"/g)).toHaveLength(1);
    expect(attrs(html, "rd-role", "data-traced").filter(v => v === "true")).toHaveLength(1);
  });

  it("REPRODUCE: every role with requirements offers its trace; a role without requirements offers none", () => {
    const html = renderToString(<rd.RoleDiscoveryResults c={c} discovery={available} open={["ALL_REQUIREMENTS_NAME_RELATED", "PARTIAL_NAME_RELATED", "WEAK_LEXICAL_ONLY", "NO_LEXICAL_RELATION", "NO_REQUIREMENTS"]} onToggle={() => undefined} traced={null} onTrace={() => undefined} />);
    expect(html.match(/data-testid="rd-role-trace"/g)?.length ?? 0).toBe(discovery.roles.filter(r => r.requirements.length > 0).length);
    expect(html.match(/data-testid="rd-role"/g)).toHaveLength(discovery.roles.length);
  });

  it("inverse: the panel without an open trace shows its rows as before — the unfolded groups' roles, no trace", () => {
    const html = renderToString(<rd.RoleDiscoveryPanel locale="de" pools={{ state: "EMPTY" }} released={POOLS} discovery={available} onRelease={() => undefined} onClose={() => undefined} />);
    expect(html).not.toContain('data-testid="rd-trace"');
    expect([...html.matchAll(/data-role-key="([^"]+)"/g)].map(m => m[1])).toEqual(discovery.groups.slice(0, 3).flatMap(g => g.roles.map(k => `${k.jobPoolUploadId}:${k.poolRoleId}`)));
  });
});
