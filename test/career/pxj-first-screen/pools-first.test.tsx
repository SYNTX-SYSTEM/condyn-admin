import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { summary } from "../job-pool/fixtures/match-bodies";
import { SyntxField } from "../../../app/components/career/demo/SyntxField";

/**
 * UX-06 / V-07 (owner "RECURSIVE UX/UI & SYSTEM CLOSURE" §03; PINK pre-sweep on 421e382): no re-upload of an existing pool may be
 * needed. The start without an opened pool showed the uploaded pools, but its statement led with the upload ("Upload via INTAKE ·
 * Select via POOLS"), and with none uploaded the list said "NO JOB POOL UPLOAD PERSISTED" without pointing to the hidden form.
 * Now the statement leads with the uploaded pools and names the upload after them; an empty list points to + INTAKE and opens it.
 * (That no upload is needed to reach an existing investigation is proven in the browser walk: list → pool → role → SELECT AS JOB
 * → D-PICK → AVAILABLE, no POST.) Server-rendered SyntxField.
 */
const workflow = (pools: unknown) => ({ pools, upload: { state: "IDLE" }, selectedJobPoolUploadId: null, view: { state: "IDLE" }, matches: { state: "IDLE" }, submitUpload: async () => undefined, select: () => undefined, reloadPools: async () => undefined, reloadMatches: async () => undefined }) as never;
const start = (pools: unknown, locale: "en" | "de" = "en") => renderToString(
  <SyntxField workflow={workflow(pools)} analysisSource={{ kind: "NONE" }} locale={locale} observation={{ kind: "FIELD", organizationId: null, roleId: null, requirementId: null, apertureSignId: null }} onObserve={() => undefined} onSelectPool={() => undefined} onExit={() => undefined} />
);
const textOf = (html: string, id: string) => {
  const at = html.indexOf(`data-testid="${id}"`);
  if (at < 0) return "";
  const begin = html.lastIndexOf("<", at), name = /^<(\w+)/.exec(html.slice(begin))![1];
  let depth = 0;
  for (const match of html.slice(begin).matchAll(new RegExp(`<(/?)${name}\\b[^>]*>`, "g"))) {
    depth += match[1] === "/" ? -1 : match[0].endsWith("/>") ? 0 : 1;
    if (depth === 0) return html.slice(begin, begin + match.index! + match[0].length).replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/\s+/g, " ").trim();
  }
  return "";
};

describe("UX-06 · the uploaded pools first, the upload after them", () => {
  it("REPRODUCE: with uploaded pools the start's statement leads with opening one of them; the upload comes second (EN, DE)", () => {
    const en = textOf(start({ state: "AVAILABLE", jobPools: [summary] }), "syntx-no-pool");
    expect(en).toContain("Open an uploaded pool in POOLS · or upload one via + INTAKE");
    expect(en.indexOf("Open an uploaded pool")).toBeLessThan(en.indexOf("upload one"));
    expect(textOf(start({ state: "AVAILABLE", jobPools: [summary] }, "de"), "syntx-no-pool")).toContain("Einen hochgeladenen Pool in POOLS öffnen · oder einen über + AUFNAHME hochladen");
  });

  it("REPRODUCE (V-07): with none uploaded the list and the statement point to + INTAKE, and the list opens it", () => {
    const html = start({ state: "EMPTY" });
    expect(textOf(html, "job-pool-list-empty")).toContain("NO JOB POOL UPLOADED YET · upload one via + INTAKE");
    expect(textOf(html, "job-pool-list-empty-intake")).toBe("+ INTAKE");
    expect(textOf(html, "syntx-no-pool")).toContain("No pool uploaded yet · upload one via + INTAKE");
  });

  it("inverse: unchanged — without an opened pool the uploaded pools are listed at once, the intake form stays closed", () => {
    const html = start({ state: "AVAILABLE", jobPools: [summary] });
    expect(html).toMatch(/data-testid="job-pool-list"[^>]*data-pools-visible|data-testid="job-pool-list"(?![^>]*hidden="")/);
    expect(html).toContain(`data-testid="job-pool-select-${summary.jobPoolUploadId}"`);
    expect(html).toMatch(/data-testid="job-pool-upload" hidden=""/);
  });
});
