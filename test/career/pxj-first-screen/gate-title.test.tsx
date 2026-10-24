import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { ROLE, UPLOAD, selection } from "./fixtures";

/**
 * R-05 (PINK §3.62 on 41dfa25): while the selected job is CHECKING or INVALID the closed controls' title tooltip still said
 * "Select a job in the Job Field first …" — contradicting the visible cause. It now carries the visible cause and way; for no job
 * and for JOB the existing sentence (which says the same) stays. Server-rendered.
 */
const control = vi.hoisted(() => ({ scope: { state: "NONE" } as Record<string, unknown> }));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => control.scope }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { SIL_COPY } from "../../../lib/career/view-model/sil-language";

const html = () => renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} investigationMode="PERSON_X_JOB" jobScopePoolUploadId={UPLOAD} jobScopeRoleId={ROLE} />);
const title = (markup: string, id: string) => new RegExp(`data-testid="${id}"[^>]*title="([^"]*)"`).exec(markup)?.[1]?.replace(/&#x27;/g, "'") ?? null;
const gate = SIL_COPY.en.syntx.gate;

beforeEach(() => { control.scope = { state: "NONE" }; });

describe("R-05 · the tooltip says what the visible cause says", () => {
  it("REPRODUCE: CHECKING — the capsule's and the exit's tooltip carry the cause and the way", () => {
    control.scope = { state: "CHECKING", scope: selection };
    const markup = html();
    for (const id of ["field-focus-capability-btn", "syntx-exit-btn"]) expect(title(markup, id), id).toBe(`${gate.reason.CHECKING}. ${gate.way.CHECKING}`);
  });

  it("REPRODUCE: INVALID — with the validation's reason", () => {
    control.scope = { state: "INVALID", scope: selection, reason: "ROLE_NOT_IN_POOL" };
    expect(title(html(), "field-focus-capability-btn")).toBe(`${gate.reason.INVALID} · ROLE_NOT_IN_POOL. ${gate.way.INVALID}`);
  });

  it("inverse: no job — the existing sentence stays (it says the same)", () => {
    expect(title(renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} investigationMode="PERSON_X_JOB" />), "field-focus-capability-btn")).toBe(SIL_COPY.en.syntx.selector.capabilityGated);
  });
});
