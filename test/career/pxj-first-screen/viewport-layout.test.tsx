import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

/**
 * O-PXJ-720 / PINK V-01 … V-03 (owner "RECURSIVE UX/UI & SYSTEM CLOSURE" §05): at 1280×720 the B2 panel lay below the fold, the
 * page scrolled under the fixed shell, the fixed inspector covered the source dock, and at 200 % the shell ran off the viewport.
 * The browser walk proves the layout (screenshots, elementFromPoint, real clicks); this file pins its contract: the dashboard
 * carries the viewport rules (none on 421e382), the tiers per viewport, and the planetarium's fit inside the free area.
 */
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => ({ state: "NONE" }) }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));

import { CareerIntelligenceDashboard } from "../../../app/components/career/demo/CareerIntelligenceDashboard";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

/** The dashboard's own style: its first child, before the header and the field (whose own styles are not viewport rules). */
const styleOf = (html: string) => /<div[^>]*data-testid="career-intelligence-dashboard"[^>]*><style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? "";
const block = (css: string, media: RegExp) => { const at = css.search(media); if (at < 0) return ""; let depth = 0, i = css.indexOf("{", at); const start = i; for (; i < css.length; i += 1) { if (css[i] === "{") depth += 1; if (css[i] === "}") { depth -= 1; if (depth === 0) break; } } return css.slice(start, i + 1); };

describe("O-PXJ-720 · the dashboard carries the viewport rules", () => {
  const css = styleOf(renderToString(<CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} investigationMode="PERSON_X_JOB" />)).replace(/&quot;/g, '"').replace(/&gt;/g, ">");
  const fit = block(css, /@media \(min-width: 1100px\) and \(min-height: 600px\) and \(max-width: 1599px\)/);
  const stack = block(css, /@media \(max-width: 1099px\), \(max-height: 599px\)/);

  it("REPRODUCE: below 1600 × 1000 the B2 panel spans from below the shell to the bottom edge; the page is the viewport", () => {
    expect(fit).toMatch(/\[data-pxj-panel\] \{ top: 71px !important; bottom: 16px !important;[^}]*max-height: none !important/);
    // Its own scroll for the rows: the box spans top … bottom (an absolute box with align-self flex-start would take its content height).
    expect(fit).toMatch(/\[data-pxj-panel\] \{[^}]*align-self: stretch !important; \}/);
    // Since V-18 / V-19 only while the Capability Field is the active field (the Job Field keeps 70d1cb4's size).
    expect(fit).toMatch(/\[data-testid="career-intelligence-dashboard"\]:has\(> \[data-testid="semantic-career-intelligence-field"\]\[data-field-focus="CAPABILITY"\]\) \{ height: 100vh; overflow: hidden;/);
    expect(fit).toMatch(/\[data-testid="semantic-career-intelligence-field"\]\[data-field-focus="CAPABILITY"\] \{ min-height: 0 !important; height: auto !important;/);
  });

  it("REPRODUCE: the Job Field's panel ends above the bottom edge (its own scroll) and the uploaded pools open beside it", () => {
    expect(fit).toContain('[data-sx-field="job"] > [data-sx-orient] { max-height: calc(100vh - 161px); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; }');
    expect(fit).toContain('[data-sx-field="job"] > [data-testid="job-pool-list"] { top: 84px !important; left: calc(40px + min(340px, 28vw)) !important; max-height: calc(100vh - 161px) !important; }');
  });

  it("REPRODUCE: the source dock starts below the shell and ends above the fixed inspector (V-01)", () => {
    expect(fit).toMatch(/div:has\(\[data-testid="source-dock"\]\) \{ top: 71px !important; transform: none !important; max-height: calc\(100vh - 132px - 172px\); overflow-y: auto; \}/);
    // The idle inspector is 122 px high at bottom 24 px: its top is 146 px above the bottom edge, the dock ends 172 px above it.
    expect(172).toBeGreaterThan(24 + 122);
  });

  it("REPRODUCE: at 200 % the shell, the panel, the planetarium, the dock and the inspector stand in one scrolling column (V-02)", () => {
    for (const shell of ["controls", "guide\"] > [data-testid=\"semantic-guide-drawer-toggle", "selector", "job-scope", "investigation", "gate-reason"]) expect(stack, shell).toMatch(new RegExp(`\\[data-sx-shell="${shell.replace(/[[\]()]/g, "\\$&")}"\\] \\{ position: relative !important;`));
    expect(stack).toMatch(/\[data-pxj-panel\] \{ position: relative !important;/);
    expect(stack).toMatch(/\[data-testid="decision-graph-inspector-idle"\], \[data-testid="decision-graph-inspector"\] \{ position: relative !important;/);
    expect(stack).toMatch(/\{ min-height: 100vh; overflow-x: clip; \}/);
  });

  it("inverse: no viewport tier applies at or above 1600 × 1000 (1920 × 1080 changes only by V-16, below)", () => {
    const medias = [...css.matchAll(/@media ([^{]+)\{/g)].map(match => match[1]);
    for (const media of medias) for (const clause of media.split(",")) {
      const holds = (w: number, h: number) => clause.split(" and ").every(term => { const m = /\((min|max)-(width|height): (\d+)px\)/.exec(term); if (!m) return true; const value = m[2] === "width" ? w : h; return m[1] === "min" ? value >= Number(m[3]) : value <= Number(m[3]); });
      expect(holds(1920, 1080), `${clause} at 1920×1080`).toBe(false);
      expect(holds(1600, 1000), `${clause} at 1600×1000`).toBe(false);
    }
  });
});

describe("V-16 · the zoom telemetry stands in view, below the shell row", () => {
  const css = styleOf(renderToString(<CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} investigationMode="PERSON" />)).replace(/&quot;/g, '"').replace(/&gt;/g, ">");
  const telemetry = /\[data-testid="semantic-career-intelligence-field"\] > \[data-testid="semantic-zoom-telemetry"\] \{ ([^}]*)\}/;

  it("REPRODUCE: at every viewport it leaves top −46 px (clipped by the field: invisible, out of reach) for page y 128, uncapped", () => {
    const base = css.slice(0, css.indexOf("@media"));
    expect(telemetry.exec(base)?.[1]).toBe("top: 67px !important; max-width: none !important; ");
  });

  it("REPRODUCE: in the fit tier it stands over the free area and may wrap; at 200 % it is part of the column", () => {
    const fit = block(css, /@media \(min-width: 1100px\) and \(min-height: 600px\) and \(max-width: 1599px\)/);
    expect(telemetry.exec(fit)?.[1]).toMatch(/top: 71px !important; left: var\(--sx-hud-x, 50%\) !important; max-width: var\(--sx-hud-w, 560px\) !important; flex-wrap: wrap;/);
    const stack = block(css, /@media \(max-width: 1099px\), \(max-height: 599px\)/);
    expect(telemetry.exec(stack)?.[1]).toMatch(/^position: relative !important;/);
  });
});

