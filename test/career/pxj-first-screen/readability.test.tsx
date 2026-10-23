import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { matches, summary, view } from "../job-pool/fixtures/match-bodies";
import { ANALYSIS, boundary, coverage, resultBody, selection } from "./fixtures";

/**
 * P3 of owner "RECURSIVE UX/UI & SYSTEM CLOSURE" (§04 readability; PINK pre-sweep on 421e382, readability.txt):
 *  V-09 type: Job Field labels at 8.5–9.5 px (organisation, role core, path RETURN, pool OPEN), the B2 panel down to 9.5 px, the
 *       job indicator at 10 px. Floors chosen here: 10 px for uppercase spaced labels in the field's signs, 10.5–11 px for panel
 *       controls and meta, 11 px in the B2 panel. Role cards keep their owner-set sizes (footer 8.5 px, ROLE_CARD_FOOTER; standing
 *       and domain inside the card box the orbit geometry is measured on, D-RO-1/2) — named in the report, not changed.
 *  V-10 contrast: the telemetry's inactive levels (2.44:1) and separators (2.09:1).
 *  V-13 hover: SELECT AS JOB and the pool list showed none.  V-14 target: POOLS toggle 23 px high.
 *  O-PXJ-720 rest (GELB, 640×360): B2's counts below the first screen in the stack tier.
 * Shared shell elements change through the dashboard stylesheet only (GELB: visual only; PERSON markup unchanged, T-07).
 */
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null) => scope === null ? { state: "NONE" } : { state: "VALID", scope, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" } }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: (id: string | null) => id === null ? { state: "IDLE" } : { state: "RESOLVED", value: boundary() }, useSelectedRoleCoverage: (id: string | null) => id === null ? { state: "IDLE" } : { state: "AVAILABLE", coverage: coverage() } }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>();
  const { decodeAnalysisResult } = await import("../../../lib/career/view-model/pxj-first-screen");
  return { ...original, useAnalysisResult: (id: string | null) => { if (id === null) return { state: "IDLE" }; const decoded = decodeAnalysisResult(resultBody(), id); return decoded.ok ? { state: "AVAILABLE", result: decoded.result } : { state: "FAILED", code: decoded.code }; } };
});

import { SyntxField } from "../../../app/components/career/demo/SyntxField";
import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { CareerIntelligenceDashboard } from "../../../app/components/career/demo/CareerIntelligenceDashboard";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const workflow = { pools: { state: "AVAILABLE", jobPools: [summary] }, upload: { state: "IDLE" }, selectedJobPoolUploadId: summary.jobPoolUploadId, view: { state: "AVAILABLE", jobPoolUploadId: summary.jobPoolUploadId, upload: view }, matches: { state: "AVAILABLE", jobPoolUploadId: summary.jobPoolUploadId, analysisId: "ANL_TEST", matches }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined } as never;
const jobField = (kind: "FIELD" | "ORGANIZATION" | "ROLE") => renderToString(
  <SyntxField workflow={workflow} analysisSource={{ kind: "URL", analysisId: "ANL_TEST" }} observation={{ kind, organizationId: kind === "FIELD" ? null : "ORG_1", roleId: kind === "ROLE" ? "ROLE_A" : null, requirementId: null, apertureSignId: null }}
    onObserve={() => undefined} onSelectPool={() => undefined} onExit={() => undefined} onSelectJobScope={() => undefined} investigation={{ mode: "PERSON_X_JOB", analysisId: "ANL_TEST", analysisMode: "PERSON_X_JOB", jobId: null, scopeValid: false }} />
);
/** Every font-size below `floor` outside the role cards (their own owner-set sizes), as "<size>" strings. */
const smallOutsideCards = (html: string, floor: number) => {
  const rest = [...html.matchAll(/<button[^>]*data-sx-role-card[\s\S]*?<\/button>/g)].reduce((text, match) => text.replace(match[0], ""), html);
  return [...rest.replace(/<style>[\s\S]*?<\/style>/g, "").matchAll(/font-size:([\d.]+)px/g)].map(match => Number(match[1])).filter(size => size < floor);
};
const dashboardCss = () => /<div[^>]*data-testid="career-intelligence-dashboard"[^>]*><style>([\s\S]*?)<\/style>/.exec(renderToString(<CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} investigationMode="PERSON" />))?.[1].replace(/&quot;/g, '"').replace(/&gt;/g, ">") ?? "";

describe("V-09 · type sizes", () => {
  it("REPRODUCE: the Job Field has no text under 10 px outside the role cards (pool, organisation and role level)", () => {
    for (const kind of ["FIELD", "ORGANIZATION", "ROLE"] as const) expect(smallOutsideCards(jobField(kind), 10), kind).toEqual([]);
  });

  it("REPRODUCE: the B2 panel has no text under 10.5 px", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="CAPABILITY" investigationMode="PERSON_X_JOB" jobScopePoolUploadId={selection.jobPoolUploadId} jobScopeRoleId={selection.poolRoleId} analysisId={ANALYSIS} />);
    const start = html.indexOf('data-testid="pxj-first-screen"');
    expect(start).toBeGreaterThan(0);
    const panel = html.slice(start, html.indexOf("</aside>", start));
    expect(panel).toContain('data-testid="pxj-first-counts"');
    expect([...panel.matchAll(/font-size:([\d.]+)px/g)].map(match => Number(match[1])).filter(size => size < 10.5)).toEqual([]);
  });

  it("REPRODUCE: the shared job indicator reads at 11 px (stylesheet; its markup unchanged)", () => {
    const css = dashboardCss();
    expect(css).toContain('[data-testid="job-scope-indicator"] [data-testid="job-scope-detail"] { font-size: 11px !important; }');
    expect(css).toContain('[data-testid="job-scope-indicator"] > span:nth-child(2) { font-size: 11px !important; }');
  });
});

describe("V-09 · inverse", () => {
  it("inverse: the role cards keep their owner-set sizes — footer at most 8.5 px, standing 7.5 px (orbit geometry unchanged)", () => {
    const html = jobField("ORGANIZATION");
    const card = /<button[^>]*data-sx-role-card[\s\S]*?<\/button>/.exec(html)?.[0] ?? "";
    expect(card).toMatch(/data-sx-role-standing="true" style="[^"]*font-size:7.5px/);
    expect(Math.max(...[...card.matchAll(/font-size:([\d.]+)px[^"]*white-space:nowrap/g)].map(match => Number(match[1])))).toBeLessThanOrEqual(8.5);
  });
});

describe("V-10 · the telemetry's inactive levels and separators reach AA", () => {
  it("REPRODUCE: inactive levels and separators get an AA colour (stylesheet; markup unchanged)", () => {
    const css = dashboardCss();
    expect(css).toMatch(/\[data-testid="semantic-zoom-telemetry"\] button:disabled \{ color: rgba\(156, 186, 204, 0\.95\) !important; \}/);
    expect(css).toMatch(/\[data-testid="semantic-zoom-telemetry"\] > span \{ color: rgba\(130, 200, 224, 0\.85\) !important; \}/);
  });
});

describe("V-13 · hover in the Job Field", () => {
  it("REPRODUCE (V-13): SELECT AS JOB, the pool item and its OPEN show a hover (look only)", () => {
    const html = jobField("ROLE");
    expect(html).toMatch(/\[data-job-scope-selected="false"\]:not\(:disabled\):hover \{/);
    expect(html).toMatch(/\[data-testid\^=job-pool-item-\]:hover \{/);
    expect(html).toMatch(/\[data-testid\^=job-pool-select-\]:not\(:disabled\) \{ cursor: pointer; \}/);
  });

});

describe("V-14 · target size in the Job Field", () => {
  it("REPRODUCE (V-14): the panel's actions (POOLS, + INTAKE, …) are at least 24 px high", () => {
    const tag = /<button[^>]*data-testid="syntx-pools-toggle"[^>]*>/.exec(jobField("FIELD"))?.[0] ?? "";
    expect(tag).toMatch(/min-height:26px/);
  });
});

