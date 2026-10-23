import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { ANALYSIS, ROLE, UPLOAD, boundary, selection } from "./fixtures";

/**
 * UX-03 (owner "RECURSIVE UX/UI & SYSTEM CLOSURE" §03; GELB inventory): after a valid role selection NO_ANALYSIS stayed without a
 * next step — on 421e382 it named ANALYZE only, and the Job Field told the user to "open the page with an exact analysisId". Now
 * NO_ANALYSIS names both ways: (a) an existing investigation of this role (D-PICK, right there) and (b) a source and ANALYZE.
 * Server-rendered; the read hooks are steered.
 */
const control = vi.hoisted(() => ({ scope: { state: "NONE" } as Record<string, unknown>, boundary: { state: "IDLE" } as Record<string, unknown> }));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => control.scope }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: (id: string | null) => id === null ? { state: "IDLE" } : control.boundary, useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: () => ({ state: "LOADING" }) }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { SIL_COPY } from "../../../lib/career/view-model/sil-language";

const VALID = { state: "VALID", scope: selection, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" };
const field = (props: Record<string, unknown> = {}) => renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} investigationMode="PERSON_X_JOB" jobScopePoolUploadId={UPLOAD} jobScopeRoleId={ROLE} fieldFocus="CAPABILITY" {...props} />);
const textOf = (html: string, testId: string): string => {
  const at = html.indexOf(`data-testid="${testId}"`);
  if (at < 0) return "";
  const open = html.lastIndexOf("<", at), name = /^<([a-z0-9]+)/.exec(html.slice(open))![1];
  let depth = 0, cursor = open;
  const tagRe = new RegExp(`<(/?)${name}\\b[^>]*>`, "g");
  tagRe.lastIndex = open;
  for (let match = tagRe.exec(html); match; match = tagRe.exec(html)) { depth += match[1] ? -1 : 1; cursor = match.index; if (depth === 0) break; }
  return html.slice(open, cursor).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
};

beforeEach(() => { control.scope = VALID; control.boundary = { state: "IDLE" }; });

describe("UX-03 · NO_ANALYSIS names its next steps", () => {
  it("REPRODUCE: the first screen names (a) an existing investigation of this role, with its control, and (b) a source and ANALYZE (EN, DE)", () => {
    const en = field();
    expect(textOf(en, "pxj-first-state")).toContain(SIL_COPY.en.pxjFirst.states.NO_ANALYSIS);
    expect(textOf(en, "pxj-first-way-existing")).toContain("(a) Choose an existing investigation of this role:");
    expect(en.slice(en.indexOf('data-testid="pxj-first-way-existing"'), en.indexOf('data-testid="pxj-first-way-analyze"'))).toContain('data-testid="analysis-picker-toggle"');
    expect(textOf(en, "pxj-first-way-analyze")).toBe("(b) Add a source under INGEST KNOWLEDGE (left) and run ANALYZE.");
    const de = field({ initialLocale: "de" });
    expect(textOf(de, "pxj-first-way-existing")).toContain("(a) Eine vorhandene Untersuchung dieser Rolle wählen:");
    expect(textOf(de, "pxj-first-way-analyze")).toBe("(b) Unter WISSEN EINSPEISEN (links) eine Quelle hinzufügen und ANALYZE ausführen.");
  });

  it("REPRODUCE: no NO_ANALYSIS statement asks for a deep link; the Job Field's names both ways (its chip renders this copy: three-modes-ssr)", () => {
    for (const locale of ["en", "de"] as const) {
      const copy = SIL_COPY[locale];
      const all = [copy.jobPool.analysisNone, copy.pxjFirst.states.NO_ANALYSIS, copy.syntx.coverage.states.NO_ANALYSIS].join(" ");
      expect(all, locale).not.toMatch(/analysisId/);
      expect(copy.jobPool.analysisNone, locale).toMatch(locale === "en" ? /existing investigation.*ANALYZE/ : /vorhandene Untersuchung.*ANALYZE/);
      expect(copy.syntx.coverage.states.NO_ANALYSIS, locale).toMatch(locale === "en" ? /existing investigation.*ANALYZE/ : /vorhandene Untersuchung.*ANALYZE/);
    }
  });

  it("inverse: with an analysis on view (any other state) no ways and no picker; PERSON's first screen stays absent", () => {
    control.boundary = { state: "RESOLVED", value: boundary() };
    const viewed = field({ analysisId: ANALYSIS });
    expect(viewed).toContain('data-testid="pxj-first-state"');
    expect(viewed).not.toContain('data-testid="pxj-first-ways"');
    expect(viewed).not.toContain('data-testid="analysis-picker"');
    const person = field({ investigationMode: "PERSON" });
    expect(person).not.toContain('data-testid="pxj-first-screen"');
    expect(person).not.toContain('data-testid="analysis-picker"');
  });
});
