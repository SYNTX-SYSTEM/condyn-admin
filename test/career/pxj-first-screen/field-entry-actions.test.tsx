import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { browser, find, instance, urlProps } from "./harness";

/**
 * SFE::SEMIOTIC_ENTRY_FIX (owner, 2026-10-30; GELB state model): the entry line at the shell names the field's state as ONE calm
 * sentence and ONE transition, never a prohibition, in a quiet status channel (role="status", aria-live="polite"), and offers at
 * most one existing action. Four owner states, each with its own line; owner state 2 is split explicitly into 2a (no pool opened)
 * and 2b (a pool opened, no role in it), GELB's state 4 is a role opened in the Job Field (observation point) not yet chosen as the
 * job. The gate (capabilityGateOpen) is unchanged: these tests also hold that it opens and closes exactly as before.
 * The actions: the harness (./harness.ts), URL writes recorded; the markup in field-entry-state.test.tsx.
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));

const control = vi.hoisted(() => ({ scope: { state: "NONE" } as Record<string, unknown>, pools: { state: "IDLE" } as Record<string, unknown>, selected: null as string | null, viewState: "IDLE" }));
vi.mock("../../../lib/career/ui/useCareerAnalysisJob", () => ({ useCareerAnalysisJob: () => ({ state: { state: "IDLE", activeJobId: null, resultAnalysisId: null, canonicalAnalysis: null, currentOperation: null, attemptCount: null, errorCode: null, errorSummary: null, httpStatus: null }, submitAnalysis: async () => undefined, resumeJob: () => undefined }) }));
vi.mock("../../../lib/career/ui/useJobScope", () => ({ useJobScopeValidation: () => control.scope }));
vi.mock("../../../lib/career/ui/useJobPoolSources", () => ({ useAnalysisSources: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useRoleInvestigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useRoleInvestigation")>()), useAnalysisBoundary: () => ({ state: "IDLE" }), useSelectedRoleCoverage: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useAnalysisResult", async (importOriginal) => ({ ...(await importOriginal<typeof import("../../../lib/career/ui/useAnalysisResult")>()), useAnalysisResult: () => ({ state: "IDLE" }) }));
vi.mock("../../../lib/career/ui/useJobPool", async (importOriginal) => {
  const { summary, view } = await import("../job-pool/fixtures/match-bodies");
  return {
    ...(await importOriginal<typeof import("../../../lib/career/ui/useJobPool")>()),
    useJobPoolWorkflow: () => ({
      pools: control.pools.state === "AVAILABLE" ? { state: "AVAILABLE", jobPools: [summary] } : control.pools,
      upload: { state: "IDLE" }, selectedJobPoolUploadId: control.selected,
      view: control.selected !== null && control.viewState === "AVAILABLE" ? { state: "AVAILABLE", jobPoolUploadId: control.selected, upload: view } : { state: "IDLE" },
      matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined
    })
  };
});

import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { SyntxFieldSelector, type SyntxCapabilityGatePresentation } from "../../../app/components/career/demo/SyntxFieldSelector";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { UPLOAD as UPLOAD_ID } from "./fixtures";

const ROLE_A = "ROLE_A";
const world = (pools: string, selected: string | null = null) => { control.pools = { state: pools }; control.selected = selected; };


beforeEach(() => { control.scope = { state: "NONE" }; world("IDLE"); control.viewState = "IDLE"; });

describe("SEMIOTIC_ENTRY · the actions are the existing ones", () => {
  let tab: ReturnType<typeof browser>;
  function load(query: string) {
    tab = browser(`http://127.0.0.1/career/demo?${query}`);
    vi.stubGlobal("window", tab.window);
    vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
    const props = { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...urlProps(tab.url) };
    const field = instance<typeof props>(SemanticCareerIntelligenceField);
    return () => field.settle(props) as ReactElement<Record<string, unknown>>;
  }
  const gate = (tree: unknown) => find(tree, SyntxFieldSelector)?.props.capabilityGate as SyntxCapabilityGatePresentation | null;

  it("REPRODUCE state 4: SELECT AS JOB selects the observed role as the job — the same URL write as the Job Field's own button", () => {
    world("AVAILABLE", UPLOAD_ID); control.viewState = "AVAILABLE";
    const draw = load(`focus=FIELD&investigationMode=PERSON_X_JOB&jobPoolUploadId=${UPLOAD_ID}&jobOrganizationId=ORG_1&jobRoleId=${ROLE_A}`);
    const entry = gate(draw());
    expect(entry?.entry).toBe("ROLE_NOT_CHOSEN");
    expect(entry?.action?.id).toBe("choose-role");
    entry!.action!.onActivate();
    expect(tab.writes.at(-1)?.how).toBe("push");
    expect(tab.param("jobScopePoolUploadId")).toBe(UPLOAD_ID);
    expect(tab.param("jobScopeRoleId")).toBe(ROLE_A);
  });

  it("REPRODUCE states 1/2: → PERSON chooses the mode PERSON (one push); state 3: the Capability Field is entered", () => {
    world("EMPTY");
    let draw = load("focus=FIELD&investigationMode=PERSON_X_JOB");
    const none = gate(draw());
    expect(none?.action?.id).toBe("person");
    none!.action!.onActivate();
    expect(tab.param("investigationMode")).toBe("PERSON");
    const person = gate(draw());
    expect(person?.entry).toBe("PERSON_OPEN");
    expect(person?.state).toBeNull();
    expect(person?.action?.id).toBe("capability");
    person!.action!.onActivate();
    expect(tab.param("focus")).toBe("CAPABILITY");
    expect(gate(draw())).toBeNull();
  });

  it("inverse: in the closed states no action enters the Capability Field (the gate stays the gate)", () => {
    world("AVAILABLE", UPLOAD_ID); control.viewState = "AVAILABLE";
    const draw = load(`focus=FIELD&investigationMode=PERSON_X_JOB&jobPoolUploadId=${UPLOAD_ID}`);
    const entry = gate(draw());
    expect(entry?.entry).toBe("ROLE_NOT_OPENED");
    expect(entry?.action?.id).not.toBe("capability");
  });
});

