import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { matches, summary, view } from "../job-pool/fixtures/match-bodies";
import { SyntxField } from "../../../app/components/career/demo/SyntxField";

/**
 * V-11-R (PINK §3.62 on 41dfa25): 688bdd7 put the Job Field's panel before the stage. After Enter on a role card the focus stays on
 * that card (it remains as the receding anchor), and Tab runs forward in the document — through the remaining signs, past the
 * stage, through the shell and the header, around to the panel: 14 → 21 presses to SELECT AS JOB (real data 9 → 21). The panel
 * stands after the stage again (as on 70d1cb4); inside it SELECT AS JOB still follows the path and RETURN (UX-02). Bound: the Tab
 * stops from the opened role's anchor to SELECT AS JOB never exceed 70d1cb4's count for the same field (server-rendered).
 */
const workflow = { pools: { state: "AVAILABLE", jobPools: [summary] }, upload: { state: "IDLE" }, selectedJobPoolUploadId: summary.jobPoolUploadId, view: { state: "AVAILABLE", jobPoolUploadId: summary.jobPoolUploadId, upload: view }, matches: { state: "AVAILABLE", jobPoolUploadId: summary.jobPoolUploadId, analysisId: "ANL_TEST", matches }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined } as never;
const role = () => renderToString(
  <SyntxField workflow={workflow} analysisSource={{ kind: "URL", analysisId: "ANL_TEST" }} observation={{ kind: "ROLE", organizationId: "ORG_1", roleId: "ROLE_A", requirementId: null, apertureSignId: null }}
    onObserve={() => undefined} onSelectPool={() => undefined} onExit={() => undefined} onSelectJobScope={() => undefined}
    investigation={{ mode: "PERSON_X_JOB", analysisId: "ANL_TEST", analysisMode: "PERSON_X_JOB", jobId: null, scopeValid: false }} />
);
/** The Tab stops in document order (buttons that are not disabled, and tabindex="0"), each with its test id or marker. */
const stops = (html: string) => [...html.matchAll(/<([a-z]+)\b[^>]*>/g)]
  .filter(match => (match[1] === "button" && !/ disabled=""/.test(match[0]) && !/tabindex="-1"/.test(match[0])) || /tabindex="0"/.test(match[0]) || /data-sx-anchor="/.test(match[0]))
  .map(match => /data-sx-anchor="/.test(match[0]) ? "ANCHOR" : /data-testid="([^"]+)"/.exec(match[0])?.[1] ?? match[1]);
/** 70d1cb4, the same field and fixture: the Tab presses from the role's anchor to SELECT AS JOB (measured with this helper there). */
const BASE_PRESSES = 11;

describe("V-11-R · the Tab path to SELECT AS JOB is no longer than on 70d1cb4", () => {
  it("REPRODUCE: from the opened role's anchor, SELECT AS JOB is reached within 70d1cb4's presses — no shell or header stop in between", () => {
    const order = stops(role());
    const from = order.indexOf("ANCHOR"), to = order.indexOf("syntx-job-scope-select");
    expect(from).toBeGreaterThanOrEqual(0);
    expect(to).toBeGreaterThan(from);
    expect(to - from).toBeLessThanOrEqual(BASE_PRESSES);
    // The panel follows the stage (as on 70d1cb4): no sign after the panel's first stop.
    expect(order.findLastIndex(id => /^syntx-(role|trace|pending|requirement|cosmos|open|source)-/.test(id))).toBeLessThan(order.indexOf("syntx-exit-btn"));
  });

  it("inverse: inside the panel SELECT AS JOB still follows the path and RETURN (UX-02)", () => {
    const order = stops(role());
    const select = order.indexOf("syntx-job-scope-select");
    expect(order.slice(select - 4, select)).toEqual(["syntx-exit-btn", "syntx-path-FIELD", "syntx-path-ORGANIZATION", "syntx-return-btn"]);
  });
});
