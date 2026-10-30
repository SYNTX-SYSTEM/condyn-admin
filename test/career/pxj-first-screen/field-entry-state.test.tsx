import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";

/**
 * SFE::SEMIOTIC_ENTRY_FIX (owner, 2026-10-30; GELB state model): the entry line at the shell names the field's state as ONE calm
 * sentence and ONE transition, never a prohibition, in a quiet status channel (role="status", aria-live="polite"), and offers at
 * most one existing action. Four owner states, each with its own line; owner state 2 is split explicitly into 2a (no pool opened)
 * and 2b (a pool opened, no role in it), GELB's state 4 is a role opened in the Job Field (observation point) not yet chosen as the
 * job. The gate (capabilityGateOpen) is unchanged: these tests also hold that it opens and closes exactly as before.
 * Server-rendered; the actions (the existing ones) in field-entry-actions.test.tsx.
 */

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
import { CareerIntelligenceDashboard } from "../../../app/components/career/demo/CareerIntelligenceDashboard";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";
import { SIL_COPY } from "../../../lib/career/view-model/sil-language";
import { fieldEntryState, type FieldEntryInput } from "../../../lib/career/view-model/field-entry-state";
import { UPLOAD_ID } from "../job-pool/fixtures/match-bodies";

const ROLE_A = "ROLE_A";
const tag = (html: string, testId: string): string => { const at = html.indexOf(`data-testid="${testId}"`); return at < 0 ? "" : html.slice(html.lastIndexOf("<", at), html.indexOf(">", at) + 1); };
const textOf = (html: string, testId: string): string => {
  const at = html.indexOf(`data-testid="${testId}"`);
  if (at < 0) return "";
  const open = html.lastIndexOf("<", at), name = /^<([a-z0-9]+)/.exec(html.slice(open))![1];
  return html.slice(html.indexOf(">", at) + 1, html.indexOf(`</${name}>`, at)).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
};
const titleOf = (html: string, id: string) => new RegExp(`data-testid="${id}"[^>]*title="([^"]*)"`).exec(html)?.[1]?.replace(/&#x27;/g, "'") ?? null;
const ssr = (props: Record<string, unknown>) => renderToString(<SemanticCareerIntelligenceField data={EMPTY_CAREER_INTELLIGENCE_DATA} fieldFocus="FIELD" {...props} />);
const pxj = (props: Record<string, unknown> = {}) => ssr({ investigationMode: "PERSON_X_JOB", ...props });
const world = (pools: string, selected: string | null = null) => { control.pools = { state: pools }; control.selected = selected; };
/** The gate as the field computes it (the SSR markup's own attribute). */
const gateOf = (html: string) => /data-capability-gate="([A-Z_]+)"/.exec(tag(html, "semantic-career-intelligence-field"))?.[1];

/** Words of prohibition or alarm the entry must never carry (the old line said "closed", "Select … first", "none is selected"). */
const PROHIBITION = /\b(closed|gated|blocked|locked|denied|first|must|cannot|warning|error)\b|geschlossen|gesperrt|blockiert|zuerst|muss|nicht möglich|fehler|warnung/i;

beforeEach(() => { control.scope = { state: "NONE" }; world("IDLE"); control.viewState = "IDLE"; });

describe("SEMIOTIC_ENTRY · the four states, each its own calm line (EN, DE)", () => {
  const each = (locale: "en" | "de") => SIL_COPY[locale].syntx.entry;

  it("REPRODUCE state 1 — PERSON × JOB, no job pool in the field: its own line and the + INTAKE transition", () => {
    world("EMPTY");
    for (const locale of ["en", "de"] as const) {
      const html = pxj({ initialLocale: locale });
      expect(tag(html, "capability-gate-reason")).toContain('data-entry-state="NO_POOL"');
      expect(textOf(html, "capability-gate-cause")).toBe(each(locale).line.NO_POOL);
      expect(textOf(html, "capability-gate-way")).toBe(each(locale).next.NO_POOL);
    }
    expect(SIL_COPY.en.syntx.entry.line.NO_POOL).toBe("No job pool in the field yet.");
    expect(SIL_COPY.de.syntx.entry.line.NO_POOL).toBe("Im Feld liegt noch kein Job-Pool.");
    expect(SIL_COPY.en.syntx.entry.next.NO_POOL).toBe("→ add one with + INTAKE · PERSON needs no role");
    expect(SIL_COPY.de.syntx.entry.next.NO_POOL).toBe("→ mit + INTAKE einen hinzufügen · PERSON braucht keine Rolle");
  });

  it("REPRODUCE state 2a — pools in the field, none opened; 2b — a pool opened, no role in it: two lines, not one", () => {
    world("AVAILABLE");
    const a = pxj();
    expect(tag(a, "capability-gate-reason")).toContain('data-entry-state="POOL_NOT_OPENED"');
    expect(textOf(a, "capability-gate-cause")).toBe("Job pools are in the field; none is open.");
    expect(textOf(a, "capability-gate-way")).toBe("→ open a pool, then a role · PERSON needs no role");
    world("AVAILABLE", UPLOAD_ID);
    const b = pxj({ jobPoolUploadId: UPLOAD_ID });
    expect(tag(b, "capability-gate-reason")).toContain('data-entry-state="ROLE_NOT_OPENED"');
    expect(textOf(b, "capability-gate-cause")).toBe("The pool is open; no role is open in it yet.");
    expect(textOf(b, "capability-gate-way")).toBe("→ open a role in the pool · PERSON needs no role");
    const bDe = pxj({ jobPoolUploadId: UPLOAD_ID, initialLocale: "de" });
    expect(textOf(bDe, "capability-gate-cause")).toBe("Der Pool ist geöffnet; darin ist noch keine Rolle offen.");
    expect(textOf(bDe, "capability-gate-way")).toBe("→ eine Rolle im Pool öffnen · PERSON braucht keine Rolle");
  });

  it("REPRODUCE state 3 — PERSON in the Job Field: the entry is open and says so, with the Capability Field as the next context", () => {
    world("AVAILABLE");
    for (const locale of ["en", "de"] as const) {
      const html = ssr({ investigationMode: "PERSON", initialLocale: locale });
      expect(gateOf(html)).toBe("OPEN");
      const line = tag(html, "field-entry-state");
      expect(line).toContain('data-entry-state="PERSON_OPEN"');
      expect(line).not.toContain("data-gate");
      expect(textOf(html, "field-entry-cause")).toBe(each(locale).line.PERSON_OPEN);
      expect(textOf(html, "field-entry-way")).toBe(each(locale).next.PERSON_OPEN);
      expect(tag(html, "capability-gate-reason")).toBe("");
    }
    expect(SIL_COPY.en.syntx.entry.line.PERSON_OPEN).toBe("PERSON reads capabilities without a role.");
    expect(SIL_COPY.de.syntx.entry.line.PERSON_OPEN).toBe("PERSON liest Fähigkeiten ohne Rolle.");
  });

  it("REPRODUCE state 4 — a role opened in the Job Field (observation point), not yet the job: its own line, SELECT AS JOB", () => {
    world("AVAILABLE", UPLOAD_ID);
    for (const locale of ["en", "de"] as const) {
      const html = pxj({ jobPoolUploadId: UPLOAD_ID, jobOrganizationId: "ORG_1", jobRoleId: ROLE_A, initialLocale: locale });
      expect(gateOf(html)).toBe("AWAITING_JOB");
      expect(tag(html, "capability-gate-reason")).toContain('data-entry-state="ROLE_NOT_CHOSEN"');
      expect(tag(html, "capability-gate-reason")).toContain('data-gate="NONE"');
      expect(textOf(html, "capability-gate-cause")).toBe(each(locale).line.ROLE_NOT_CHOSEN);
      expect(textOf(html, "capability-gate-way")).toBe(each(locale).next.ROLE_NOT_CHOSEN);
      expect(textOf(html, "field-entry-action")).toBe(each(locale).action.chooseRole);
      expect(titleOf(html, "field-focus-capability-btn")).toBe(`${each(locale).line.ROLE_NOT_CHOSEN} ${each(locale).next.ROLE_NOT_CHOSEN}`);
    }
    expect(SIL_COPY.en.syntx.entry.line.ROLE_NOT_CHOSEN).toBe("A role is open; it is not the job yet.");
    expect(SIL_COPY.de.syntx.entry.line.ROLE_NOT_CHOSEN).toBe("Eine Rolle ist geöffnet; sie ist noch nicht der Job.");
  });

  it("REPRODUCE: a quiet status channel in cool tokens — role=status, aria-live=polite; never an alert, a note or a warning colour", () => {
    world("EMPTY");
    for (const html of [pxj(), ssr({ investigationMode: "PERSON" }), ssr({ investigationMode: "JOB" })]) {
      const line = tag(html, "capability-gate-reason") || tag(html, "field-entry-state");
      expect(line).toContain('role="status"');
      expect(line).toContain('aria-live="polite"');
      expect(line).not.toMatch(/role="(alert|note)"/);
      expect(line).not.toMatch(/rgba\(255, ?(190|206)/);
    }
  });

  it("REPRODUCE: no prohibition anywhere in the entry copy, EN and DE; tooltip = line + transition", () => {
    for (const locale of ["en", "de"] as const) {
      const copy = SIL_COPY[locale].syntx.entry;
      for (const state of Object.keys(copy.line) as Array<keyof typeof copy.line>) {
        expect(copy.line[state], `${locale} ${state}`).not.toMatch(PROHIBITION);
        expect(copy.next[state], `${locale} ${state}`).not.toMatch(PROHIBITION);
        expect(copy.next[state], `${locale} ${state}`).toMatch(/^→ /);
      }
    }
  });

  it("inverse: the gate is unchanged — states 1, 2a, 2b, 4 keep it AWAITING_JOB and the controls disabled; a valid job opens it and the line goes", () => {
    const closed: Array<[string, string | null, Record<string, unknown>]> = [["EMPTY", null, {}], ["AVAILABLE", null, {}], ["AVAILABLE", UPLOAD_ID, { jobPoolUploadId: UPLOAD_ID }], ["AVAILABLE", UPLOAD_ID, { jobPoolUploadId: UPLOAD_ID, jobOrganizationId: "ORG_1", jobRoleId: ROLE_A }]];
    for (const [pools, selected, props] of closed) {
      world(pools, selected);
      const html = pxj(props);
      expect(gateOf(html), pools).toBe("AWAITING_JOB");
      expect(tag(html, "field-focus-capability-btn")).toContain("disabled");
      expect(tag(html, "syntx-exit-btn")).toContain("disabled");
      expect(tag(html, "capability-gate-reason")).toContain('data-gate="NONE"');
    }
    world("AVAILABLE", UPLOAD_ID);
    control.scope = { state: "VALID", scope: { jobPoolUploadId: UPLOAD_ID, poolRoleId: ROLE_A }, roleTitle: "Platform Engineer", organizationId: "ORG_1", organizationName: "Acme", poolName: "Sample Pool" };
    const open = pxj({ jobPoolUploadId: UPLOAD_ID, jobOrganizationId: "ORG_1", jobRoleId: ROLE_A, jobScopePoolUploadId: UPLOAD_ID, jobScopeRoleId: ROLE_A });
    expect(gateOf(open)).toBe("OPEN");
    expect(tag(open, "capability-gate-reason")).toBe("");
    expect(tag(open, "field-entry-state")).toBe("");
    expect(titleOf(open, "field-focus-capability-btn")).toBeNull();
  });

  it("inverse: state 4 needs the role — the pool alone is 2b, a role without an opened pool is 2a; state 3 never in the Capability Field (T-07)", () => {
    world("AVAILABLE", UPLOAD_ID);
    expect(tag(pxj({ jobPoolUploadId: UPLOAD_ID, jobOrganizationId: "ORG_1" }), "capability-gate-reason")).toContain('data-entry-state="ROLE_NOT_OPENED"');
    expect(tag(pxj({ jobPoolUploadId: UPLOAD_ID }), "field-entry-action")).toContain('data-action="person"');
    world("AVAILABLE");
    expect(tag(pxj({ jobRoleId: ROLE_A }), "capability-gate-reason")).toContain('data-entry-state="POOL_NOT_OPENED"');
    world("EMPTY");
    expect(tag(pxj({ jobRoleId: ROLE_A }), "capability-gate-reason")).toContain('data-entry-state="NO_POOL"');
    const inside = ssr({ investigationMode: "PERSON", fieldFocus: "CAPABILITY" });
    expect(tag(inside, "field-entry-state")).toBe("");
    expect(tag(inside, "capability-gate-reason")).toBe("");
  });

  it("inverse: CHECKING / INVALID / JOB keep their meaning in the same grammar; CHECKING and INVALID offer no action", () => {
    world("AVAILABLE", UPLOAD_ID);
    control.scope = { state: "CHECKING", scope: { jobPoolUploadId: UPLOAD_ID, poolRoleId: ROLE_A } };
    const checking = pxj({ jobPoolUploadId: UPLOAD_ID, jobRoleId: ROLE_A, jobScopePoolUploadId: UPLOAD_ID, jobScopeRoleId: ROLE_A });
    expect(tag(checking, "capability-gate-reason")).toContain('data-gate="CHECKING"');
    expect(textOf(checking, "capability-gate-cause")).toBe("The chosen job is being read.");
    expect(tag(checking, "field-entry-action")).toBe("");
    control.scope = { state: "INVALID", scope: { jobPoolUploadId: UPLOAD_ID, poolRoleId: ROLE_A }, reason: "ROLE_NOT_IN_POOL" };
    const invalid = pxj({ jobPoolUploadId: UPLOAD_ID, jobRoleId: ROLE_A, jobScopePoolUploadId: UPLOAD_ID, jobScopeRoleId: ROLE_A });
    expect(tag(invalid, "capability-gate-reason")).toContain('data-gate="INVALID"');
    expect(tag(invalid, "field-entry-action")).toBe("");
    control.scope = { state: "NONE" };
    const job = ssr({ investigationMode: "JOB" });
    expect(tag(job, "capability-gate-reason")).toContain('data-gate="JOB"');
    expect(textOf(job, "capability-gate-cause")).toBe("JOB reads the job alone; the person stays outside.");
  });
});

describe("SEMIOTIC_ENTRY · fieldEntryState (pure)", () => {
  const base: FieldEntryInput = { mode: "PERSON_X_JOB", gateOpen: false, focus: "FIELD", scope: "NONE", pools: "AVAILABLE", poolOpen: false, roleOpen: false };
  it("REPRODUCE: each owner state from the existing inputs", () => {
    expect(fieldEntryState({ ...base, pools: "EMPTY" })).toBe("NO_POOL");
    expect(fieldEntryState(base)).toBe("POOL_NOT_OPENED");
    expect(fieldEntryState({ ...base, poolOpen: true })).toBe("ROLE_NOT_OPENED");
    expect(fieldEntryState({ ...base, mode: "PERSON", gateOpen: true })).toBe("PERSON_OPEN");
    expect(fieldEntryState({ ...base, poolOpen: true, roleOpen: true })).toBe("ROLE_NOT_CHOSEN");
    for (const pools of ["IDLE", "LOADING", "FAILED", "NOT_PROVISIONED"]) expect(fieldEntryState({ ...base, pools }), pools).toBe("POOLS_UNREAD");
  });
  it("inverse: an open gate says nothing; PERSON in the Capability Field says nothing; the job's own states win over the pool states", () => {
    expect(fieldEntryState({ ...base, gateOpen: true, scope: "VALID", poolOpen: true, roleOpen: true })).toBeNull();
    expect(fieldEntryState({ ...base, mode: "PERSON", gateOpen: true, focus: "CAPABILITY" })).toBeNull();
    expect(fieldEntryState({ ...base, scope: "CHECKING", pools: "EMPTY" })).toBe("CHECKING");
    expect(fieldEntryState({ ...base, scope: "INVALID", poolOpen: true, roleOpen: true })).toBe("INVALID");
    expect(fieldEntryState({ ...base, mode: "JOB", gateOpen: false, pools: "EMPTY" })).toBe("JOB");
    expect(fieldEntryState({ ...base, roleOpen: true })).toBe("POOL_NOT_OPENED");
  });
});

describe("SEMIOTIC_ENTRY · the entry line gives the uploaded pools room (FIT tier)", () => {
  /** The dashboard's own viewport style (the same reading as viewport-layout.test.tsx). */
  const css = () => {
    const html = renderToString(<CareerIntelligenceDashboard data={EMPTY_CAREER_INTELLIGENCE_DATA} investigationMode="PERSON" />);
    return (/<div[^>]*data-testid="career-intelligence-dashboard"[^>]*><style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? "").replace(/&quot;/g, '"').replace(/&gt;/g, ">");
  };
  const media = (all: string, head: string) => { const at = all.indexOf(head); if (at < 0) return ""; let depth = 0, i = all.indexOf("{", at); const start = i; for (; i < all.length; i += 1) { if (all[i] === "{") depth += 1; if (all[i] === "}" && --depth === 0) break; } return all.slice(start, i); };
  const FIT = "@media (min-width: 1100px) and (min-height: 600px) and (max-width: 1599px)";
  const STACK = "@media (max-width: 1099px), (max-height: 599px)";
  const RULE = '[data-field-focus="FIELD"]:has([data-sx-field="job"] > [data-testid="job-pool-list"]:not([hidden])) > [data-sx-shell="gate-reason"] { left: calc(56px + min(340px, 28vw) + min(316px, 27vw)) !important; transform: none !important;';

  it("REPRODUCE: in the FIT tier, while the pool list is visible in the Job Field, the line starts right of it (state 3 and 2a at 1280–1600 px)", () => {
    expect(media(css(), FIT)).toContain(RULE);
    // The list's own placement it follows (unchanged): left 40 px + min(340px, 28vw), width min(316px, 27vw).
    expect(media(css(), FIT)).toContain('[data-sx-field="job"] > [data-testid="job-pool-list"] { top: 84px !important; left: calc(40px + min(340px, 28vw)) !important;');
  });

  it("inverse: nowhere else — not in the full tier (the list sits below the panel there), and the stack tier still sets the line into the column", () => {
    const all = css();
    expect(all.split(RULE).length - 1).toBe(1);
    expect(media(all, STACK)).toContain('> [data-sx-shell="gate-reason"] { position: relative !important; left: auto !important; top: auto !important; transform: none !important;');
  });
});
