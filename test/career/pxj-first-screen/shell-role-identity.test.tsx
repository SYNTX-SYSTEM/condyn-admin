import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

/**
 * GELB F-RF-5 (owner "RECURSIVE_ROLE_FIELD_CLOSURE", confirmed by PINK §3.58): two roles with the same title in the same organization
 * of one pool (the pool schema admits it) gave identical shell texts. The shell names the role id with a VALID job, also under PERSON
 * where the selected job is kept unused; the selection itself stays by id. Server-rendered: proves the shell's text and what the
 * scope validation is asked for, not a browser selection.
 */
const control = vi.hoisted(() => ({ asked: [] as unknown[], roleTitle: "Platform Engineer" }));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({
  useJobScopeValidation: (scope: { jobPoolUploadId: string; poolRoleId: string } | null) => {
    control.asked.push(scope);
    return scope === null ? { state: "NONE" } : { state: "VALID", scope, roleTitle: control.roleTitle, organizationId: "ORG_1", organizationName: "Acme", poolName: "Sample Pool" };
  }
}));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const POOL = "JPOOL_B94850C439974E27496FE3B1A9A076B5";
const chip = (html: string) => { const start = html.indexOf('data-testid="job-scope-indicator"'); return html.slice(html.lastIndexOf("<button", start), html.indexOf("</button>", start)); };
const shell = (role: string, mode = "PERSON_X_JOB") => chip(renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} jobScopePoolUploadId={POOL} jobScopeRoleId={role} investigationMode={mode} />));
const text = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

beforeEach(() => { control.asked = []; control.roleTitle = "Platform Engineer"; });

describe("F-RF-5 · two roles with the same title are told apart at the shell", () => {
  it("REPRODUCE: PERSON × JOB and PERSON (kept) name the role id, so the two shell texts differ", () => {
    for (const mode of ["PERSON_X_JOB", "PERSON"]) {
      const a = shell("role_platform_a", mode), b = shell("role_platform_b", mode);
      expect(text(a), mode).not.toBe(text(b));
      expect(a).toContain("role_platform_a");
      expect(b).toContain("role_platform_b");
    }
  });

  it("inverse: the selection stays by id; title, organization, pool, state and testids stay as they were", () => {
    const html = shell("role_platform_a");
    expect(control.asked).toContainEqual({ jobPoolUploadId: POOL, poolRoleId: "role_platform_a" });
    expect(html).toContain('data-job-scope-state="VALID"');
    expect(html).toContain("Platform Engineer");
    expect(html).toContain("Acme · Sample Pool");
    expect(html).toContain('data-testid="job-scope-detail"');
    expect(text(shell("role_platform_a", "PERSON"))).toContain("NO JOB SCOPE · PERSON");
    // Different titles stay different as before; the id is one more part of the detail, never a replacement of the title.
    control.roleTitle = "Data Engineer";
    expect(text(shell("role_platform_b"))).toContain("Data Engineer");
  });
});
