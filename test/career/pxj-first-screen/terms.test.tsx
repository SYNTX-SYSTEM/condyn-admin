import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { matches, summary, view } from "../job-pool/fixtures/match-bodies";
import { UPLOAD } from "./fixtures";

/**
 * UX-07 (owner "RECURSIVE UX/UI & SYSTEM CLOSURE" §03): uploaded, opened and selected were not clearly distinct — on 421e382 a pool
 * in the list was "SELECT / SELECTED" (DE "AUSWÄHLEN / AUSGEWÄHLT"), the same word as the job's, and the shell called the selected
 * job just "JOB". One word, one meaning: UPLOADED (persisted, the list), OPENED (shown in the Job Field: a pool, a role),
 * SELECTED (the one job, at the shell). Under PERSON the shell keeps "JOB" (the job is not used; PERSON markup unchanged).
 */
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null) => scope === null ? { state: "NONE" } : { state: "VALID", scope, roleTitle: "Platform Engineer", organizationId: "ORG_1", organizationName: "Acme", poolName: "Sample Pool" } }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));

import { SyntxField } from "../../../app/components/career/demo/SyntxField";
import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const workflow = { pools: { state: "AVAILABLE", jobPools: [summary] }, upload: { state: "IDLE" }, selectedJobPoolUploadId: summary.jobPoolUploadId, view: { state: "AVAILABLE", jobPoolUploadId: summary.jobPoolUploadId, upload: view }, matches: { state: "AVAILABLE", jobPoolUploadId: summary.jobPoolUploadId, analysisId: "ANL_TEST", matches }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined } as never;
const field = (locale: "en" | "de", role: string | null, jobScope: { jobPoolUploadId: string; poolRoleId: string } | null) => renderToString(
  <SyntxField workflow={workflow} analysisSource={{ kind: "URL", analysisId: "ANL_TEST" }} locale={locale}
    observation={{ kind: role === null ? "FIELD" : "ROLE", organizationId: role === null ? null : "ORG_1", roleId: role, requirementId: null, apertureSignId: null }}
    onObserve={() => undefined} onSelectPool={() => undefined} onExit={() => undefined} onSelectJobScope={() => undefined} jobScope={jobScope}
    investigation={{ mode: "PERSON_X_JOB", analysisId: "ANL_TEST", analysisMode: "PERSON_X_JOB", jobId: null, scopeValid: jobScope !== null }} />
);
const textOf = (html: string, id: string) => {
  const at = html.indexOf(`data-testid="${id}`);
  if (at < 0) return "";
  const start = html.lastIndexOf("<", at), name = /^<(\w+)/.exec(html.slice(start))![1];
  let depth = 0;
  for (const match of html.slice(start).matchAll(new RegExp(`<(/?)${name}\\b[^>]*>`, "g"))) {
    depth += match[1] === "/" ? -1 : match[0].endsWith("/>") ? 0 : 1;
    if (depth === 0) return html.slice(start, start + match.index! + match[0].length).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
  }
  return "";
};
const job = { jobPoolUploadId: summary.jobPoolUploadId, poolRoleId: "ROLE_A" };

describe("UX-07 · uploaded, opened, selected", () => {
  it("REPRODUCE: the pool list is the UPLOADED pools; its item is OPENED, not SELECTED (EN, DE)", () => {
    const en = field("en", null, null), de = field("de", null, null);
    expect(textOf(en, "job-pool-list")).toContain("UPLOADED JOB POOLS");
    expect(textOf(en, `job-pool-select-${summary.jobPoolUploadId}`)).toBe("OPENED");
    expect(textOf(de, "job-pool-list")).toContain("HOCHGELADENE JOB-POOLS");
    expect(textOf(de, `job-pool-select-${summary.jobPoolUploadId}`)).toBe("GEÖFFNET");
    for (const html of [en, de]) expect(textOf(html, "job-pool-list")).not.toMatch(/SELECT|AUSGEWÄHL/);
  });

  it("REPRODUCE: the opened role says whether it is the selected job", () => {
    expect(textOf(field("en", "ROLE_A", null), "syntx-opened-role")).toBe("OPENED ROLE · not the selected job");
    expect(textOf(field("en", "ROLE_A", job), "syntx-opened-role")).toBe("OPENED ROLE · the selected job");
    expect(textOf(field("de", "ROLE_B", job), "syntx-opened-role")).toBe("GEÖFFNETE ROLLE · nicht der gewählte Job");
  });

  it("REPRODUCE: the shell names the job SELECTED JOB in PERSON × JOB and JOB (DE GEWÄHLTER JOB)", () => {
    for (const mode of ["PERSON_X_JOB", "JOB"]) {
      const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} investigationMode={mode} jobScopePoolUploadId={UPLOAD} jobScopeRoleId="ROLE_A" />);
      expect(textOf(html, "job-scope-indicator"), mode).toMatch(/^SELECTED JOB Platform Engineer/);
    }
    const de = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} investigationMode="PERSON_X_JOB" initialLocale="de" jobScopePoolUploadId={UPLOAD} jobScopeRoleId="ROLE_A" />);
    expect(textOf(de, "job-scope-indicator")).toMatch(/^GEWÄHLTER JOB Platform Engineer/);
  });

  it("inverse: under PERSON the shell keeps JOB (the job is not used there)", () => {
    const html = renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} investigationMode="PERSON" jobScopePoolUploadId={UPLOAD} jobScopeRoleId="ROLE_A" />);
    expect(textOf(html, "job-scope-indicator")).toMatch(/^JOB NO JOB SCOPE · PERSON/);
  });
});
