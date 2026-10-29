import React from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { CAREER_DEMO_LAYOUT_CSS } from "../../../app/components/career/demo/career-demo-layout";
import { ROLE_DISCOVERY_COPY } from "../../../app/components/career/demo/role-discovery-copy";

/**
 * RD-LAYOUT (STANDIN walk on the production build, 2026-10-29): the entry below orbit 04 overlapped that orbit's shell at
 * 1600 × 900, 1440 × 900 and 1280 × 720 (and the inspector at 1280 × 720). It now stands in the panel's own slot, right column below
 * the telemetry bar (free at every tier ≥ 1280, measured). In the stack, orbit 01's shell rises 9 px above the zoomed stage (6 px
 * grid gap): entry and panel keep 6 px more air. An empty required level is not shown as "level ". The geometry itself is proven
 * by the walk's rect intersections (docs/career_analysis/evidence/role-discovery); these tests hold the rules that give it.
 */
type PanelModule = typeof import("../../../app/components/career/demo/RoleDiscoveryPanel");
let rd: PanelModule;
beforeAll(async () => { rd = await import("../../../app/components/career/demo/RoleDiscoveryPanel"); });

describe("RD-LAYOUT · the entry's place and the column air", () => {
  it("REPRODUCE: the entry stands in the panel's slot (right column, below the telemetry bar), not at the bottom over orbit 04", () => {
    const html = renderToString(<rd.RoleDiscoveryEntry locale="en" onOpen={() => undefined} />);
    const style = /data-testid="rd-entry"[^>]*style="([^"]*)"/.exec(html)![1];
    expect(style).toContain("right:24px");
    expect(style).toContain("top:180px");
    expect(style).toContain("width:min(400px, 29vw)");
    expect(style).not.toMatch(/bottom:|left:50%/);
  });

  it("REPRODUCE: in the stack the entry and the panel keep air above orbit 01's shell", () => {
    expect(CAREER_DEMO_LAYOUT_CSS).toMatch(/\[data-sx-shell="rd-entry"\] \{[^}]*margin-bottom: 6px;/);
    expect(CAREER_DEMO_LAYOUT_CSS).toMatch(/\[data-rd-panel\] \{ margin-bottom: 6px; \}/);
    // The pool boxes keep their own size beside the pool's name (a global input width had stretched them into a column).
    const pools = { state: "AVAILABLE", jobPools: [{ jobPoolUploadId: "JPOOL_A0000000000000000000000000000001", poolId: "p", poolVersion: 1, poolName: "P", poolStatus: "ACTIVE", organizationCount: 1, roleCount: 1, requirementCount: 1, uploadedByActorRef: "a", uploadedAt: "2026-10-24T00:00:00.000Z" }] };
    const panel = renderToString(<rd.RoleDiscoveryPanel locale="en" pools={pools as never} released={null} discovery={{ state: "IDLE" }} onRelease={() => undefined} onClose={() => undefined} />);
    expect(/<input type="checkbox"[^>]*style="([^"]*)"/.exec(panel)![1]).toMatch(/flex:0 0 auto;width:14px;height:14px/);
  });

  it("REPRODUCE: an empty required level is left out, in English and German", () => {
    expect(ROLE_DISCOVERY_COPY.en.detail.level("UNKNOWN", "")).toBe("UNKNOWN");
    expect(ROLE_DISCOVERY_COPY.de.detail.level("REQUIRED", " ")).toBe("REQUIRED");
  });

  it("inverse: a given level is shown as before; the shared panel rules and the B2 stack rules are unchanged", () => {
    expect(ROLE_DISCOVERY_COPY.en.detail.level("REQUIRED", "L5")).toBe("REQUIRED · level L5");
    expect(ROLE_DISCOVERY_COPY.de.detail.level("REQUIRED", "L5")).toBe("REQUIRED · Stufe L5");
    expect(CAREER_DEMO_LAYOUT_CSS).toContain('[data-pxj-panel] { position: relative !important; top: auto !important; right: auto !important; bottom: auto !important; width: 100% !important; max-height: none !important; overflow: visible !important; }');
    expect(CAREER_DEMO_LAYOUT_CSS).toContain('> div:has(> [data-pxj-panel]) { order: 6; }');
  });
});
