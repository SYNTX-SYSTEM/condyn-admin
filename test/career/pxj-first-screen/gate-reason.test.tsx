import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { ROLE, UPLOAD, selection } from "./fixtures";

/**
 * UX-04 (owner "RECURSIVE UX/UI & SYSTEM CLOSURE" §03; GELB inventory): the Capability Field "is not reachable before an analysis"
 * — but the gate is the selected job, not an analysis, and on 421e382 the closed control said neither why nor how (a tooltip on a
 * disabled button only). Now the shell names the cause and the way as text, in the gate's own semantics: PERSON × JOB needs a valid
 * role selected as the job; JOB has no person field; PERSON is open. The gate contract itself is unchanged. Server-rendered.
 */
const control = vi.hoisted(() => ({ scope: { state: "NONE" } as Record<string, unknown> }));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => control.scope }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()), useJobPoolWorkflow: () => ({ pools: { state: "IDLE" }, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: () => ({ state: "IDLE" }), useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: () => ({ state: "IDLE" }) }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const VALID = { state: "VALID", scope: selection, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha Industrial Systems", poolName: "PINK pool" };
const field = (props: Record<string, unknown> = {}) => renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="CAPABILITY" {...props} />);
const tag = (html: string, testId: string): string => { const at = html.indexOf(`data-testid="${testId}"`); return at < 0 ? "" : html.slice(html.lastIndexOf("<", at), html.indexOf(">", at) + 1); };
/** The visible text of the element with this test id (its first closing tag of the same name ends it). */
const textOf = (html: string, testId: string): string => {
  const at = html.indexOf(`data-testid="${testId}"`);
  if (at < 0) return "";
  const open = html.lastIndexOf("<", at), name = /^<([a-z0-9]+)/.exec(html.slice(open))![1];
  return html.slice(html.indexOf(">", at) + 1, html.indexOf(`</${name}>`, at)).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
};
const scopeOf = (state: string) => state === "VALID" ? VALID : state === "NONE" ? { state } : state === "INVALID" ? { state, scope: selection, reason: "ROLE_NOT_IN_POOL" } : { state, scope: selection };

beforeEach(() => { control.scope = { state: "NONE" }; });

describe("UX-04 · the closed Capability Field says why and how it opens", () => {
  it("REPRODUCE: PERSON × JOB without a job — the cause and the way stand as text at the shell; the control points to them (EN, DE)", () => {
    const en = field({ investigationMode: "PERSON_X_JOB" });
    expect(tag(en, "capability-gate-reason")).toContain('data-gate="NONE"');
    // SFE::SEMIOTIC_ENTRY_FIX: the pool list not read yet (IDLE here) — a calm orientation, no prohibition.
    expect(textOf(en, "capability-gate-cause")).toBe("PERSON × JOB reads the person against one chosen role.");
    expect(textOf(en, "capability-gate-way")).toBe("→ choose a role in the Job Field · PERSON needs no role");
    expect(tag(en, "field-focus-capability-btn")).toContain('aria-describedby="capability-gate-reason"');
    expect(tag(en, "syntx-exit-btn")).toContain('aria-describedby="capability-gate-reason"');
    const de = field({ investigationMode: "PERSON_X_JOB", initialLocale: "de" });
    expect(textOf(de, "capability-gate-cause")).toBe("PERSON × JOB liest die Person an einer gewählten Rolle.");
    expect(textOf(de, "capability-gate-way")).toBe("→ im Job-Feld eine Rolle wählen · PERSON braucht keine Rolle");
  });

  it("REPRODUCE: a job still checked and an invalid job are named as such; JOB says it has no person field", () => {
    control.scope = scopeOf("CHECKING");
    expect(tag(field({ investigationMode: "PERSON_X_JOB", jobScopePoolUploadId: UPLOAD, jobScopeRoleId: ROLE }), "capability-gate-reason")).toContain('data-gate="CHECKING"');
    control.scope = scopeOf("INVALID");
    const invalid = field({ investigationMode: "PERSON_X_JOB", jobScopePoolUploadId: UPLOAD, jobScopeRoleId: ROLE });
    expect(textOf(invalid, "capability-gate-cause")).toBe("The chosen job is not readable in this field · ROLE_NOT_IN_POOL.");
    control.scope = VALID;
    const job = field({ investigationMode: "JOB", jobScopePoolUploadId: UPLOAD, jobScopeRoleId: ROLE });
    expect(tag(job, "capability-gate-reason")).toContain('data-gate="JOB"');
    expect(textOf(job, "capability-gate-cause")).toBe("JOB reads the job alone; the person stays outside.");
    expect(textOf(job, "capability-gate-way")).toBe("→ PERSON or PERSON × JOB brings the person in");
  });

  it("inverse: the gate is unchanged — closed it stays closed (disabled, the Job Field active); no cause names an analysis", () => {
    for (const state of ["NONE", "CHECKING", "INVALID"]) {
      control.scope = scopeOf(state);
      const html = field({ investigationMode: "PERSON_X_JOB", jobScopePoolUploadId: state === "NONE" ? undefined : UPLOAD, jobScopeRoleId: state === "NONE" ? undefined : ROLE });
      expect(tag(html, "field-focus-capability-btn"), state).toContain("disabled");
      expect(tag(html, "field-focus-capability-btn"), state).toContain('data-field-gate="AWAITING_JOB"');
      expect(tag(html, "syntx-field"), state).not.toBe("");
      expect(`${textOf(html, "capability-gate-cause")} ${textOf(html, "capability-gate-way")}`.toLowerCase(), state).not.toMatch(/analys/);
    }
  });

  it("inverse: open — PERSON always, PERSON × JOB with a valid job — no reason is shown and nothing points to one", () => {
    control.scope = VALID;
    for (const mode of ["PERSON", "PERSON_X_JOB"]) {
      const html = field({ investigationMode: mode, jobScopePoolUploadId: UPLOAD, jobScopeRoleId: ROLE });
      expect(tag(html, "capability-gate-reason"), mode).toBe("");
      expect(tag(html, "field-focus-capability-btn"), mode).not.toContain("aria-describedby");
    }
    control.scope = { state: "NONE" };
    expect(tag(field({ investigationMode: "PERSON" }), "capability-gate-reason")).toBe("");
  });
});
