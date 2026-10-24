import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

/**
 * V-18 / V-19 (PINK §3.62 on 41dfa25): the fit tier made the whole field viewport-high — also the Job Field, whose role orbits are
 * laid out on the stage's size: at 1280 × 720 every role card was packed without its domain line (V-18, semantic loss, §01) and at
 * the organisation level a card lay under the panel (V-19: 0/5 mouse hits; 70d1cb4 5/5). Now only the Capability Field becomes the
 * viewport; the Job Field keeps 70d1cb4's size (≥ 960 px, the page scrolls), its panel keeps its own scroll; in the stack tier its
 * stage keeps 960 px. Browser proof: PINK's cardhit / cardbox probes in the round-2 evidence.
 */
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => ({ state: "NONE" }) }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
import { CareerIntelligenceDashboard } from "../../../app/components/career/demo/CareerIntelligenceDashboard";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const css = () => (/<div[^>]*data-testid="career-intelligence-dashboard"[^>]*><style>([\s\S]*?)<\/style>/.exec(renderToString(<CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} />))?.[1] ?? "").replace(/&quot;/g, '"').replace(/&gt;/g, ">");
const block = (text: string, media: RegExp) => { const at = text.search(media); if (at < 0) return ""; let depth = 0, i = text.indexOf("{", at); const start = i; for (; i < text.length; i += 1) { if (text[i] === "{") depth += 1; if (text[i] === "}") { depth -= 1; if (depth === 0) break; } } return text.slice(start, i + 1); };
const FIT = /@media \(min-width: 1100px\) and \(min-height: 600px\) and \(max-width: 1599px\)/;
const STACK = /@media \(max-width: 1099px\), \(max-height: 599px\)/;

describe("V-18 / V-19 · the Job Field keeps its size", () => {
  it("REPRODUCE: in the fit tier the page becomes the viewport only while the Capability Field is active — no unscoped height rule", () => {
    const fit = block(css(), FIT);
    expect(fit).not.toMatch(/\n\s*\[data-testid="career-intelligence-dashboard"\] \{ height: 100vh;/);
    expect(fit).not.toMatch(/\[data-testid="semantic-career-intelligence-field"\] \{ min-height: 0 !important;/);
    expect(fit).toMatch(/\[data-testid="semantic-career-intelligence-field"\]\[data-field-focus="CAPABILITY"\] \{ min-height: 0 !important;/);
  });

  it("REPRODUCE: in the stack tier the Job Field's stage keeps 960 px (its orbits are laid out on the stage's size)", () => {
    expect(block(css(), STACK)).toMatch(/\[data-sx-field="job"\] > \[data-testid="syntx-stage"\] \{ position: relative !important; inset: auto !important; height: 960px;/);
  });

  it("inverse: the Capability Field's fit (B2 from below the shell to the bottom edge, its own row scroll) is unchanged", () => {
    expect(block(css(), FIT)).toMatch(/\[data-pxj-panel\] \{ top: 71px !important; bottom: 16px !important;[^}]*align-self: stretch !important; \}/);
  });
});
