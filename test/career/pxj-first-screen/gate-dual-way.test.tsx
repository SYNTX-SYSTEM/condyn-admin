import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { ROLE, UPLOAD, selection } from "./fixtures";

/**
 * GELB decision on GRÜN's DLL-full path review (2026-10-29), point 1: the closed Capability Field's text, shown while
 * PERSON × JOB has no job yet, used to name only one way in — "Select a job in the Job Field first" — even though PERSON
 * (no job at all) already opens the same gate. Both the hover tooltip (`selector.capabilityGated`) and the always-visible
 * banner's "way" line (`gate.way.NONE`) carried the one-way framing; both are fixed here, neither claims sole authority
 * over how to proceed (named as what each mode needs, not as an instruction to follow one path).
 */
const control = vi.hoisted(() => ({ scope: { state: "NONE" } as Record<string, unknown> }));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => control.scope }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { SIL_COPY } from "../../../lib/career/view-model/sil-language";

const title = (markup: string, id: string) => new RegExp(`data-testid="${id}"[^>]*title="([^"]*)"`).exec(markup)?.[1]?.replace(/&#x27;/g, "'") ?? null;
const textOf = (html: string, testId: string): string => {
  const at = html.indexOf(`data-testid="${testId}"`);
  if (at < 0) return "";
  const open = html.lastIndexOf("<", at), name = /^<([a-z0-9]+)/.exec(html.slice(open))![1];
  return html.slice(html.indexOf(">", at) + 1, html.indexOf(`</${name}>`, at)).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
};
const field = (locale: "en" | "de" = "en") => renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} investigationMode="PERSON_X_JOB" initialLocale={locale} />);

beforeEach(() => { control.scope = { state: "NONE" }; });

describe("Gate text (DLL-full review point 1) · both ways named, no job prescribed as the only one", () => {
  it("REPRODUCE: PERSON × JOB without a job — the tooltip and the banner's way name PERSON (no job) and PERSON × JOB (needs a job), neither alone", () => {
    for (const locale of ["en", "de"] as const) {
      const html = field(locale);
      const tooltip = title(html, "field-focus-capability-btn")!;
      const way = textOf(html, "capability-gate-way");
      // SFE::SEMIOTIC_ENTRY_FIX: the line names PERSON × JOB's reading, the transition names PERSON's (no role needed).
      const needle = locale === "en" ? ["PERSON", "no role", "PERSON × JOB"] : ["PERSON", "keine Rolle", "PERSON × JOB"];
      const line = `${textOf(html, "capability-gate-cause")} ${way}`;
      for (const part of needle) { expect(tooltip, `${locale} tooltip: ${part}`).toContain(part); expect(line, `${locale} line: ${part}`).toContain(part); }
      // Named as what each mode needs, not as the single instruction to follow (the sentence states both, it does not say
      // "you must" or name only one of the two as the way forward).
      expect(tooltip.toLowerCase()).not.toMatch(locale === "en" ? /^select a job/ : /^zuerst.*job/);
      expect(way.toLowerCase()).not.toMatch(locale === "en" ? /^way: open a role/ : /^weg: im job-feld/);
    }
  });

  it("inverse: CHECKING / INVALID / JOB keep their own specific wording — only the no-job (NONE) case changed", () => {
    control.scope = { state: "CHECKING", scope: selection };
    const checking = field();
    expect(textOf(checking, "capability-gate-way")).toBe(SIL_COPY.en.syntx.entry.next.CHECKING);
    control.scope = { state: "INVALID", scope: selection, reason: "ROLE_NOT_IN_POOL" };
    const invalid = field();
    expect(textOf(invalid, "capability-gate-way")).toBe(SIL_COPY.en.syntx.entry.next.INVALID);
    const job = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} investigationMode="JOB" jobScopePoolUploadId={UPLOAD} jobScopeRoleId={ROLE} />);
    expect(textOf(job, "capability-gate-way")).toBe(SIL_COPY.en.syntx.entry.next.JOB);
    expect(SIL_COPY.en.syntx.entry.next.CHECKING).not.toContain("PERSON needs no role");
    expect(SIL_COPY.en.syntx.entry.next.INVALID).not.toContain("PERSON needs no role");
  });
});
