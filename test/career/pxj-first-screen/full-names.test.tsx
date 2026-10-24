import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { matches, summary, view } from "../job-pool/fixtures/match-bodies";
import { SyntxField } from "../../../app/components/career/demo/SyntxField";

/**
 * V-15 (PINK pre-sweep and §3.62): long names cut in the Job Field without their full text — a clamped or ellipsised name must
 * carry it (title or aria-label) on the element itself. Exempt: the role card's footer lines (fixed short copy, not names).
 * syntx-summary is the screen reader's live region (visually hidden by design, read in full): not a cut text. Server-rendered at
 * the pool, organisation, role and requirement level.
 */
const workflow = { pools: { state: "AVAILABLE", jobPools: [summary] }, upload: { state: "IDLE" }, selectedJobPoolUploadId: summary.jobPoolUploadId, view: { state: "AVAILABLE", jobPoolUploadId: summary.jobPoolUploadId, upload: view }, matches: { state: "AVAILABLE", jobPoolUploadId: summary.jobPoolUploadId, analysisId: "ANL_TEST", matches }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined } as never;
const at = (kind: "FIELD" | "ORGANIZATION" | "ROLE" | "REQUIREMENT") => renderToString(
  <SyntxField workflow={workflow} analysisSource={{ kind: "URL", analysisId: "ANL_TEST" }} observation={{ kind, organizationId: kind === "FIELD" ? null : "ORG_1", roleId: kind === "ROLE" || kind === "REQUIREMENT" ? "ROLE_A" : null, requirementId: kind === "REQUIREMENT" ? "REQ_1" : null, apertureSignId: null }}
    onObserve={() => undefined} onSelectPool={() => undefined} onExit={() => undefined} investigation={{ mode: "PERSON_X_JOB", analysisId: "ANL_TEST", analysisMode: "PERSON_X_JOB", jobId: null, scopeValid: false }} />
);
/** Elements that cut their text (ellipsis or a line clamp) without carrying it in title / aria-label. */
const cutWithoutFullText = (html: string) => [...html.matchAll(/<([a-z]+)\b[^>]*style="[^"]*(?:text-overflow:ellipsis|-webkit-line-clamp)[^"]*"[^>]*>/g)]
  .map(match => match[0]).filter(tag => !/ (title|aria-label)="/.test(tag) && !/data-sx-role-(requirements|matching)/.test(tag));

describe("V-15 · a cut name carries its full text", () => {
  it("REPRODUCE: no element in the Job Field cuts a name without title or aria-label (pool, organisation, role, requirement level)", () => {
    for (const kind of ["FIELD", "ORGANIZATION", "ROLE", "REQUIREMENT"] as const) expect(cutWithoutFullText(at(kind)), kind).toEqual([]);
  });

  it("inverse: the role card title and the path keep their own full text (unchanged)", () => {
    const html = at("ORGANIZATION");
    expect(html).toMatch(/data-sx-role-title="true" title="Platform Engineer"/);
    expect(html).toMatch(/data-testid="syntx-path-ORGANIZATION"[^>]*title="Acme"/);
  });
});
