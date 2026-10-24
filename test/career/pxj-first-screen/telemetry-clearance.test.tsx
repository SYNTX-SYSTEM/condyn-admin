import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

/**
 * V-20 (PINK §3.62; measured the same on 70d1cb4): the fixed runtime telemetry box (lower right) lay over B2's lower rows while a
 * run was shown (e.g. a followed job not found) — §05: no overlay by panels. While the box is shown, B2 ends above it: the box's
 * height is written on the dashboard (--sx-hud-h, coalesced per frame) and the panel's bottom clears it; at 200 % the box stands in
 * the column. Without the box nothing changes (the rules hang on :has(the box)).
 */
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => ({ state: "NONE" }) }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
import { CareerIntelligenceDashboard } from "../../../app/components/career/demo/CareerIntelligenceDashboard";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const css = () => (/<div[^>]*data-testid="career-intelligence-dashboard"[^>]*><style>([\s\S]*?)<\/style>/.exec(renderToString(<CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} />))?.[1] ?? "").replace(/&quot;/g, '"').replace(/&gt;/g, ">");

describe("V-20 · B2 ends above the runtime telemetry box", () => {
  it("REPRODUCE: full and fit tier — while the box is shown, the panel's bottom clears its measured height", () => {
    const text = css();
    expect(text).toContain('@media (min-width: 1600px) and (min-height: 1000px) {\n  [data-testid="career-intelligence-dashboard"] [data-testid="semantic-career-intelligence-field"]:has([data-testid="inference-telemetry-hud"]) [data-pxj-panel] { bottom: calc(97px + var(--sx-hud-h, 110px)) !important; max-height: calc(100% - 132px - 97px - var(--sx-hud-h, 110px)) !important; }');
    expect(text).toContain(':has([data-testid="inference-telemetry-hud"]) [data-pxj-panel] { bottom: calc(36px + var(--sx-hud-h, 110px)) !important; }');
    expect(text.match(/var\(--sx-hud-h/g)).toHaveLength(3);
  });

  it("REPRODUCE: at 200 % the box stands in the column (not fixed over it)", () => {
    expect(css()).toContain('[data-testid="inference-telemetry-hud"] { position: relative !important; right: auto !important; bottom: auto !important;');
  });

  it("inverse: every clearance hangs on the box being shown", () => {
    const rules = [...css().matchAll(/\n[^\n{}]*\{[^{}\n]*var\(--sx-hud-h[^}]*\}/g)].map(match => match[0]);
    expect(rules.every(rule => rule.includes("[data-pxj-panel]"))).toBe(true);
    for (const rule of rules) expect(rule).toContain(':has([data-testid="inference-telemetry-hud"])');
  });
});
