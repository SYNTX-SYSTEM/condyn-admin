import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { INVESTIGATION_ID, PERSON_ANALYSIS, UPLOAD_ALPHA, UPLOAD_ZETA, plannedBody, storedInvestigation } from "../pxj-first-screen/discovery-fixtures";
import { RoleDiscoveryPanel, RoleInvestigationState } from "../../../app/components/career/demo/RoleDiscoveryPanel";
import { ROLE_DISCOVERY_COPY } from "../../../app/components/career/demo/role-discovery-copy";
import { decodeRoleDiscovery } from "../../../lib/career/ui/role-discovery";
import { INVESTIGATION_PROVIDERS, decodeStoredInvestigation, investigationEvidenceClass, readInvestigation, startInvestigation, type InvestigationState } from "../../../lib/career/ui/semantic-investigation";

/**
 * AUTO_CAPABILITY O-AC-1 (GELB 2026-10-30): the manual START of the role discovery takes the second provider the backend admits —
 * provider "gemini" with evidence class REAL_GEMINI — exactly as the backend names them (semantic-config.ts evidenceClassOfProvider:
 * stand-in → STAND_IN, gemini → REAL_GEMINI, anything else UNKNOWN). Class and provider must match; an unknown provider or class stays
 * FAILED. The display names the class: Gemini as model statements, never as the stand-in; the stand-in exactly as before.
 */
const POOLS = [UPLOAD_ALPHA, UPLOAD_ZETA];
const REQUEST = { jobPoolUploadIds: POOLS, roles: [{ jobPoolUploadId: UPLOAD_ALPHA, poolRoleId: "role_fs" }], clientRequestId: "crq_1", confirmedCalls: 1 };
const stored = (provider: string, status = "COMPLETED") => storedInvestigation(status, [{ jobPoolUploadId: UPLOAD_ALPHA, poolRoleId: "role_fs", status: "SUCCEEDED", pairs: 16, stored: 16 }], { provider });
const answer = (status: number, body: unknown) => async () => ({ status, json: async () => body });
const post = (provider: string, evidenceClass: unknown, status = 201, extra: Record<string, unknown> = {}) =>
  startInvestigation(PERSON_ANALYSIS, REQUEST, answer(status, { success: true, created: status === 201, evidenceClass, ...stored(provider), ...extra }) as never);
const get = (provider: string, evidenceClass: unknown) => readInvestigation(PERSON_ANALYSIS, INVESTIGATION_ID, answer(200, { success: true, evidenceClass, ...stored(provider) }) as never);
const text = (html: string) => html.replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/g, " ").replace(/\s+/g, " ");

describe("O-AC-1 · the manual START reads Gemini as Gemini", () => {
  it("REPRODUCE: provider gemini with REAL_GEMINI is a stored investigation — on the run (201), the repeat (200) and the read (GET)", async () => {
    for (const result of [await post("gemini", "REAL_GEMINI"), await post("gemini", "REAL_GEMINI", 200), await get("gemini", "REAL_GEMINI")]) {
      expect(result.state).toBe("STORED");
      const investigation = (result as Extract<InvestigationState, { state: "STORED" }>).investigation;
      expect(investigation.provider).toBe("gemini");
      expect(investigationEvidenceClass(investigation)).toBe("REAL_GEMINI");
    }
    expect(INVESTIGATION_PROVIDERS).toEqual({ "stand-in": "STAND_IN", gemini: "REAL_GEMINI" });
  });

  it("REPRODUCE: the stand-in stays exactly as it was (STAND_IN)", async () => {
    for (const result of [await post("stand-in", "STAND_IN"), await post("stand-in", "STAND_IN", 200), await get("stand-in", "STAND_IN")]) {
      expect(result.state).toBe("STORED");
      expect(investigationEvidenceClass((result as Extract<InvestigationState, { state: "STORED" }>).investigation)).toBe("STAND_IN");
    }
  });

  it("inverse: class and provider must match — Gemini under STAND_IN, the stand-in under REAL_GEMINI, either without a class — FAILED", async () => {
    const pairs: Array<[string, unknown]> = [["gemini", "STAND_IN"], ["stand-in", "REAL_GEMINI"], ["gemini", undefined], ["stand-in", undefined], ["gemini", null], ["gemini", "UNKNOWN"]];
    for (const [provider, evidenceClass] of pairs) {
      expect(await post(provider, evidenceClass), `POST ${provider} ${String(evidenceClass)}`).toEqual({ state: "FAILED", code: null });
      expect(await post(provider, evidenceClass, 200), `200 ${provider} ${String(evidenceClass)}`).toEqual({ state: "FAILED", code: null });
      expect(await get(provider, evidenceClass), `GET ${provider} ${String(evidenceClass)}`).toEqual({ state: "FAILED", code: null });
    }
  });

  it("inverse: an unknown provider (with any class, UNKNOWN included) stays FAILED; no prototype key passes as a provider", async () => {
    for (const provider of ["openai", "GEMINI", "Gemini", "gemini-2", "STANDIN", "", "toString", "__proto__", "constructor"]) {
      for (const evidenceClass of ["UNKNOWN", "REAL_GEMINI", "STAND_IN"]) {
        expect(await post(provider, evidenceClass), `${provider} ${evidenceClass}`).toEqual({ state: "FAILED", code: null });
        expect(await get(provider, evidenceClass), `${provider} ${evidenceClass}`).toEqual({ state: "FAILED", code: null });
      }
      const s = stored(provider);
      expect(decodeStoredInvestigation(s.investigation, s.tasks, PERSON_ANALYSIS), provider).toBeNull();
    }
  });
});

describe("O-AC-1 · the display names the class", () => {
  const storedState = (provider: string): InvestigationState => ({ state: "STORED", created: true, investigation: decodeStoredInvestigation(stored(provider).investigation, stored(provider).tasks, PERSON_ANALYSIS)! });

  it("REPRODUCE: a Gemini run is shown as Gemini model statements (unverified, no authority) — never as the stand-in; EN and DE", async () => {
    const body = await plannedBody(0, 3);
    const roles = decodeRoleDiscovery(body.discovery, PERSON_ANALYSIS, POOLS)!;
    for (const locale of ["en", "de"] as const) {
      const c = ROLE_DISCOVERY_COPY[locale];
      const html = renderToString(<RoleInvestigationState c={c} investigation={storedState("gemini")} roles={roles.roles} plan={roles.semanticPlan} />);
      expect(html).toMatch(/data-testid="rd-investigation-engine" data-evidence-class="REAL_GEMINI"/);
      expect(text(html)).toContain(c.run.engine.REAL_GEMINI);
      expect(text(html)).not.toMatch(/stand-in/i);
      const panel = renderToString(<RoleDiscoveryPanel locale={locale} pools={{ state: "IDLE" }} released={POOLS} discovery={{ state: "AVAILABLE", discovery: roles }} onRelease={() => undefined} onClose={() => undefined} investigation={storedState("gemini")} />);
      expect(text(panel)).toContain(`${c.semantic.check.REAL_GEMINI}: ${c.run.status.COMPLETED}`);
      expect(panel).toMatch(/data-testid="rd-role-task" data-evidence-class="REAL_GEMINI"/);
      expect(text(panel)).toContain(c.run.roleTask(c.run.task.SUCCEEDED, c.run.roleTaskEngine.REAL_GEMINI));
      expect(text(panel)).not.toMatch(/stand-in/i);
    }
    expect(ROLE_DISCOVERY_COPY.en.run.engine.REAL_GEMINI).toBe("Gemini, model statements · unverified, no authority");
    expect(ROLE_DISCOVERY_COPY.de.run.engine.REAL_GEMINI).toBe("Gemini, Modellaussagen · ungeprüft, keine Autorität");
  });

  it("inverse: a stand-in run reads exactly as before — no model named anywhere", async () => {
    const body = await plannedBody(0, 3);
    const roles = decodeRoleDiscovery(body.discovery, PERSON_ANALYSIS, POOLS)!;
    const en = renderToString(<RoleDiscoveryPanel locale="en" pools={{ state: "IDLE" }} released={POOLS} discovery={{ state: "AVAILABLE", discovery: roles }} onRelease={() => undefined} onClose={() => undefined} investigation={storedState("stand-in")} />);
    expect(en).toMatch(/data-testid="rd-investigation-engine" data-evidence-class="STAND_IN"/);
    expect(text(en)).toContain("Stand-in, no model");
    expect(text(en)).toContain("stand-in check: completed");
    expect(text(en)).toContain("Semantic check of this role: completed · stand-in, no model");
    expect(text(en)).not.toMatch(/gemini|model statements/i);
    const de = renderToString(<RoleDiscoveryPanel locale="de" pools={{ state: "IDLE" }} released={POOLS} discovery={{ state: "AVAILABLE", discovery: roles }} onRelease={() => undefined} onClose={() => undefined} investigation={storedState("stand-in")} />);
    expect(text(de)).toContain("Stand-in, kein Modell");
    expect(text(de)).toContain("Stand-in-Prüfung: abgeschlossen");
    expect(text(de)).toContain("Semantische Prüfung dieser Rolle: abgeschlossen · Stand-in, kein Modell");
    expect(text(de)).not.toMatch(/gemini/i);
  });
});
