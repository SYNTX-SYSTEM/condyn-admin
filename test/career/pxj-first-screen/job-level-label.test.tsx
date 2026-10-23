import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { matches, summary, view } from "../job-pool/fixtures/match-bodies";

/**
 * UX-01 (owner "RECURSIVE UX/UI & SYSTEM CLOSURE" §03; PINK pre-sweep): on 421e382 the Job Field's panel said
 * "JOB FIELD" on every level (the level only implied by the path), SELECT AS JOB appeared only at a role without saying so, and at
 * the role 9–14 Tab presses (every requirement sign, the role card, the path, RETURN, the state, the legacy box) lay before it.
 * Now the panel names the level as text, the pool and organisation levels say where the job is chosen, and at the role the action
 * follows the title and the path — first in the Tab order (the panel precedes the signs), the legacy box below it, collapsible.
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

describe("UX-01 · the level stands in the panel as text", () => {
  it("REPRODUCE: POOL, ORGANIZATION and ROLE are named at their level (EN, DE)", () => {
    expect(textOf(at("FIELD"), "syntx-level")).toBe("LEVEL · POOL");
    expect(textOf(at("ORGANIZATION"), "syntx-level")).toBe("LEVEL · ORGANIZATION");
    expect(textOf(at("ROLE"), "syntx-level")).toBe("LEVEL · ROLE");
    expect(textOf(at("ROLE", "de"), "syntx-level")).toBe("EBENE · ROLLE");
    expect(at("ORGANIZATION")).toContain('data-level="ORGANIZATION"');
  });
});

