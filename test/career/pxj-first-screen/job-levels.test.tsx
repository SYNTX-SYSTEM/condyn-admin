import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { matches, summary, view } from "../job-pool/fixtures/match-bodies";

/**
 * UX-01 / UX-02 / V-11 (owner "RECURSIVE UX/UI & SYSTEM CLOSURE" §03; PINK pre-sweep): on 421e382 the Job Field's panel said
 * "JOB FIELD" on every level (the level only implied by the path), SELECT AS JOB appeared only at a role without saying so, and at
 * the role 9–14 Tab presses (every requirement sign, the role card, the path, RETURN, the state, the legacy box) lay before it.
 * Now the panel names the level as text, the pool and organisation levels say where the job is chosen, and at the role the action
 * follows the title, the path and RETURN — the panel's first stops after the stage (V-11-R: as on 70d1cb4), the legacy box below
 * it, collapsible.
 * The selection contract is unchanged. Server-rendered SyntxField.
 */
import { SyntxField } from "../../../app/components/career/demo/SyntxField";

const workflow = { pools: { state: "AVAILABLE", jobPools: [summary] }, upload: { state: "IDLE" }, selectedJobPoolUploadId: summary.jobPoolUploadId, view: { state: "AVAILABLE", jobPoolUploadId: summary.jobPoolUploadId, upload: view }, matches: { state: "AVAILABLE", jobPoolUploadId: summary.jobPoolUploadId, analysisId: "ANL_TEST", matches }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined } as never;
const at = (kind: "FIELD" | "ORGANIZATION" | "ROLE", locale: "en" | "de" = "en") => renderToString(
  <SyntxField workflow={workflow} analysisSource={{ kind: "URL", analysisId: "ANL_TEST" }} locale={locale}
    observation={{ kind, organizationId: kind === "FIELD" ? null : "ORG_1", roleId: kind === "ROLE" ? "ROLE_A" : null, requirementId: null, apertureSignId: null }}
    onObserve={() => undefined} onSelectPool={() => undefined} onExit={() => undefined} onSelectJobScope={() => undefined}
    investigation={{ mode: "PERSON_X_JOB", analysisId: "ANL_TEST", analysisMode: "PERSON_X_JOB", jobId: null, scopeValid: false }} />
);
const textOf = (html: string, id: string) => {
  const start = html.lastIndexOf("<", html.indexOf(`data-testid="${id}"`));
  if (html.indexOf(`data-testid="${id}"`) < 0) return "";
  const name = /^<(\w+)/.exec(html.slice(start))![1];
  let depth = 0;
  for (const match of html.slice(start).matchAll(new RegExp(`<(/?)${name}\\b[^>]*>`, "g"))) {
    depth += match[1] === "/" ? -1 : match[0].endsWith("/>") ? 0 : 1;
    if (depth === 0) return html.slice(start, start + match.index! + match[0].length).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
  }
  return "";
};
const position = (html: string, id: string) => html.indexOf(`data-testid="${id}`);
/** The order a keyboard meets the focusable controls in (document order of buttons and tabindex=0 elements). */
const tabOrder = (html: string) => [...html.matchAll(/<([a-z]+)\b[^>]*>/g)].filter(match => /data-testid="/.test(match[0]) && (match[1] === "button" || /tabindex="0"/.test(match[0])) && !/ disabled=""/.test(match[0])).map(match => /data-testid="([^"]+)"/.exec(match[0])![1]);

describe("UX-02 · where the job is chosen", () => {
  it("REPRODUCE: at the pool and the organisation level the panel says to open a role (EN, DE); no action there", () => {
    for (const kind of ["FIELD", "ORGANIZATION"] as const) {
      expect(textOf(at(kind), "syntx-job-scope-hint"), kind).toBe("Open a role to select it as the job.");
      expect(at(kind), kind).not.toContain('data-testid="syntx-job-scope-select"');
    }
    expect(textOf(at("FIELD", "de"), "syntx-job-scope-hint")).toBe("Öffne eine Rolle, um sie als Job zu wählen.");
  });

  it("REPRODUCE (V-11): at the role SELECT AS JOB follows the path and RETURN — before the state and the legacy box", () => {
    const html = at("ROLE");
    const select = position(html, "syntx-job-scope-select");
    expect(select).toBeGreaterThan(position(html, "syntx-path"));
    expect(select).toBeLessThan(position(html, "syntx-state"));
    expect(select).toBeLessThan(position(html, "syntx-legacy-disclosure"));
    // The keyboard inside the panel: exit, the path's steps, RETURN, then the action. (Where the panel stands in the document —
    // after the stage, as on 70d1cb4 — and the bound on the whole path: tab-path.test.tsx, V-11-R.)
    const order = tabOrder(html);
    const at0 = order.indexOf("syntx-exit-btn");
    expect(order.slice(at0, order.indexOf("syntx-job-scope-select"))).toEqual(["syntx-exit-btn", "syntx-path-FIELD", "syntx-path-ORGANIZATION", "syntx-return-btn"]);
  });

  it("REPRODUCE: the legacy box below the action has a collapse control; open by default with its source and limits", () => {
    const html = at("ROLE");
    expect(html).toMatch(/data-testid="syntx-legacy-toggle"[^>]*aria-expanded="true"|aria-expanded="true"[^>]*data-testid="syntx-legacy-toggle"/);
    expect(textOf(html, "syntx-legacy-disclosure")).toContain("HIDE");
  });

  it("inverse: the selection contract is unchanged — the one action at the role, its test id, pressed state and label", () => {
    const html = at("ROLE");
    expect(html.match(/data-testid="syntx-job-scope-select"/g)).toHaveLength(1);
    expect(html).toMatch(/data-testid="syntx-job-scope-select"[^>]*data-job-scope-selected="false"[^>]*aria-pressed="false"/);
    expect(textOf(html, "syntx-job-scope-select")).toBe("◎ SELECT AS JOB");
    expect(at("ROLE")).not.toContain('data-testid="syntx-job-scope-hint"');
  });
});
