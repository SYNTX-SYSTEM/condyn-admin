import { describe, expect, it } from "vitest";
import { OTHER_ROLE, ROLE, UPLOAD, boundary, selection } from "./fixtures";
import { PICKER_NEWEST, PICKER_PARALLEL, boundaryFits, decodeAnalysisIndex, newestAnalyses, readPickableAnalyses } from "../../../lib/career/ui/analysis-picker";

/**
 * D-PICK (UX-05), the read (GELB contract §4): GET /api/career/analyses, then each candidate's persisted boundary
 * (GET …/investigation); offered only with the interface's mode and — in PERSON × JOB — exactly the selected job; an unreadable
 * boundary is not offered; the newest 25, at most 4 boundary reads at a time; JOB reads nothing. (New module: on 421e382 this file
 * fails at its import; the field's behaviour is proven against 421e382 in analysis-picker.test.tsx.)
 */
type Init = { method: string; cache?: string; signal?: AbortSignal };
const at = (minute: number) => new Date(Date.UTC(2026, 9, 23, 8, minute)).toISOString();
const entry = (analysisId: string, minute: number) => ({ analysisId, createdAt: at(minute), validationState: "VERIFIED", overallConfidence: 0.91 });
const pxj = (analysisId: string, scope = selection) => ({ status: 200, body: { success: true, investigation: boundary({ analysisId, jobScopeSelection: { ...scope } }) } });
const person = (analysisId: string) => ({ status: 200, body: { success: true, investigation: boundary({ analysisId, mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }) } });
const unresolved = { status: 409, body: { success: false, issues: [{ code: "ERR_ANALYSIS_INVESTIGATION_UNRESOLVED", reason: "NOT_DECLARED" }] } };
const notFound = { status: 404, body: { success: false, issues: [{ code: "ERR_ANALYSIS_INVESTIGATION_NOT_FOUND" }] } };

function network(list: unknown, boundaries: Record<string, { status: number; body: unknown }>, listStatus = 200) {
  const calls: Array<{ url: string; method: string }> = [];
  let inFlight = 0, peak = 0;
  const fetcher = async (url: string, init: Init) => {
    calls.push({ url, method: init.method });
    if (url === "/api/career/analyses") return { status: listStatus, json: async () => list };
    const id = decodeURIComponent(url.replace("/api/career/analyses/", "").replace("/investigation", ""));
    inFlight += 1; peak = Math.max(peak, inFlight);
    await new Promise(resolve => setTimeout(resolve, 1));
    inFlight -= 1;
    const route = boundaries[id] ?? notFound;
    return { status: route.status, json: async () => route.body };
  };
  return { calls, fetcher, peak: () => peak };
}
const list = (...entries: unknown[]) => ({ success: true, analyses: entries });

describe("D-PICK · which analyses are offered", () => {
  const routes = {
    ANL_SAME: pxj("ANL_SAME"),
    ANL_OTHER_ROLE: pxj("ANL_OTHER_ROLE", { jobPoolUploadId: UPLOAD, poolRoleId: OTHER_ROLE }),
    ANL_OTHER_UPLOAD: pxj("ANL_OTHER_UPLOAD", { jobPoolUploadId: "JPOOL_00000000000000000000000000000000", poolRoleId: ROLE }),
    ANL_PERSON: person("ANL_PERSON"),
    ANL_UNRESOLVED: unresolved,
    ANL_GARBLED: { status: 200, body: { success: true, investigation: { ...boundary({ analysisId: "ANL_GARBLED" }), mode: "JOB" } } }
  };
  const all = list(entry("ANL_SAME", 6), entry("ANL_OTHER_ROLE", 5), entry("ANL_OTHER_UPLOAD", 4), entry("ANL_PERSON", 3), entry("ANL_UNRESOLVED", 2), entry("ANL_GONE", 1), entry("ANL_GARBLED", 0));

  it("inverse: PERSON × JOB — only exactly the selected job; another role, another upload, PERSON and unreadable boundaries are not offered", async () => {
    const net = network(all, routes);
    const read = await readPickableAnalyses("PERSON_X_JOB", selection, net.fetcher);
    expect(read).toEqual({ state: "AVAILABLE", candidates: [{ analysisId: "ANL_SAME", createdAt: at(6), validationState: "VERIFIED", mode: "PERSON_X_JOB", jobScopeSelection: selection }], considered: 7, listed: 7, unreadable: 3 });
    expect(JSON.stringify(read)).not.toContain("overallConfidence");
  });

  it("inverse: PERSON — only PERSON analyses, never one of PERSON × JOB", async () => {
    const read = await readPickableAnalyses("PERSON", null, network(all, routes).fetcher);
    expect(read.state === "AVAILABLE" && read.candidates.map(candidate => [candidate.analysisId, candidate.mode, candidate.jobScopeSelection])).toEqual([["ANL_PERSON", "PERSON", null]]);
  });

  it("inverse: JOB reads no analysis, and PERSON × JOB without a selected job reads nothing", async () => {
    for (const [mode, scope] of [["JOB", selection], ["PERSON_X_JOB", null]] as const) {
      const net = network(all, routes);
      expect(await readPickableAnalyses(mode, scope, net.fetcher)).toMatchObject({ state: "AVAILABLE", candidates: [] });
      expect(net.calls).toEqual([]);
    }
  });

  it("guard: boundaryFits is exact — both identities, the same mode", () => {
    expect(boundaryFits("PERSON_X_JOB", selection, { mode: "PERSON_X_JOB", jobScopeSelection: { ...selection } })).toBe(true);
    expect(boundaryFits("PERSON_X_JOB", selection, { mode: "PERSON_X_JOB", jobScopeSelection: { ...selection, poolRoleId: `${ROLE} ` } })).toBe(false);
    expect(boundaryFits("PERSON_X_JOB", null, { mode: "PERSON_X_JOB", jobScopeSelection: { ...selection } })).toBe(false);
    expect(boundaryFits("PERSON_X_JOB", selection, { mode: "PERSON", jobScopeSelection: null })).toBe(false);
    expect(boundaryFits("PERSON", null, { mode: "PERSON_X_JOB", jobScopeSelection: { ...selection } })).toBe(false);
    expect(boundaryFits("JOB", selection, { mode: "PERSON_X_JOB", jobScopeSelection: { ...selection } })).toBe(false);
  });
});

describe("D-PICK · a bounded read, GET only", () => {
  it("guard: the newest 25 by creation time; older ones are never read; at most 4 boundary reads at a time", async () => {
    const entries = Array.from({ length: 30 }, (_, index) => entry(`ANL_${String(index).padStart(2, "0")}`, index));
    const routes = Object.fromEntries(entries.map(item => [item.analysisId, pxj(item.analysisId)]));
    const net = network(list(...entries), routes);
    const read = await readPickableAnalyses("PERSON_X_JOB", selection, net.fetcher);
    expect(PICKER_NEWEST).toBe(25);
    expect(PICKER_PARALLEL).toBe(4);
    expect(read).toMatchObject({ state: "AVAILABLE", considered: 25, listed: 30, unreadable: 0 });
    expect(read.state === "AVAILABLE" && read.candidates.map(candidate => candidate.analysisId)).toEqual(entries.slice(5).reverse().map(item => item.analysisId));
    const boundaryReads = net.calls.filter(call => call.url.endsWith("/investigation")).map(call => call.url);
    expect(boundaryReads).toHaveLength(25);
    for (const old of ["ANL_00", "ANL_01", "ANL_02", "ANL_03", "ANL_04"]) expect(boundaryReads).not.toContain(`/api/career/analyses/${old}/investigation`);
    expect(net.peak()).toBe(4);
    expect(net.calls.every(call => call.method === "GET")).toBe(true);
  });

  it("guard: a list that cannot be read or decoded is FAILED — nothing offered, no boundary read", async () => {
    for (const [body, status] of [[{ success: false, issues: [{ code: "ERR_SERVER_FATAL" }] }, 500], [list({ analysisId: "ANL_X" }), 200], [{ success: true }, 200]] as const) {
      const net = network(body, {}, status);
      const read = await readPickableAnalyses("PERSON_X_JOB", selection, net.fetcher);
      expect(read.state).toBe("FAILED");
      expect(net.calls.map(call => call.url)).toEqual(["/api/career/analyses"]);
    }
    expect(decodeAnalysisIndex(list(entry("ANL_A", 1)))).toEqual([{ analysisId: "ANL_A", createdAt: at(1), validationState: "VERIFIED" }]);
    expect(newestAnalyses([{ analysisId: "B", createdAt: at(1), validationState: "VERIFIED" }, { analysisId: "A", createdAt: at(2), validationState: "VERIFIED" }]).map(item => item.analysisId)).toEqual(["A", "B"]);
  });

  it("guard: an empty list is an honest empty answer", async () => {
    expect(await readPickableAnalyses("PERSON_X_JOB", selection, network(list(), {}).fetcher)).toEqual({ state: "AVAILABLE", candidates: [], considered: 0, listed: 0, unreadable: 0 });
  });
});
