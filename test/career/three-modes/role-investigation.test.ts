import { describe, expect, it } from "vitest";
import { decodeJobStructure, decodeSelectedRoleCoverage, readJobStructure, readSelectedRoleCoverage } from "../../../lib/career/ui/useRoleInvestigation";
import { ANALYSIS, ROLE, UPLOAD, answering, coverage, structure } from "./fixtures";

const SELECTION = { jobPoolUploadId: UPLOAD, poolRoleId: ROLE };

describe("B2 · SELECTED_ROLE_COVERAGE_V1 (strict decoder and read)", () => {
  it("decodes the contract", () => expect(decodeSelectedRoleCoverage(coverage())).not.toBeNull());

  it.each([
    ["another version", (c: any) => { c.comparisonVersion = "V2"; }],
    ["a score", (c: any) => { c.authority.scored = true; }],
    ["an evaluated relation", (c: any) => { c.authority.capabilityRequirementRelationState = "EVALUATED"; }],
    ["an extra authority key", (c: any) => { c.authority.rank = 1; }],
    ["a covered requirement without its proposal", (c: any) => { c.requirements[0].coverage.proposal = null; }],
    ["a not-covered requirement with a proposal", (c: any) => { c.requirements[2].coverage.proposal = c.requirements[0].coverage.proposal; }],
    ["a scored proposal", (c: any) => { c.requirements[0].coverage.proposal.scored = true; }],
    ["an unknown match basis", (c: any) => { c.requirements[0].coverage.proposal.matchBasis = "SEMANTIC"; }],
    ["counts that do not add up", (c: any) => { c.counts.covered = 3; }],
    ["a proposal count that is not the list", (c: any) => { c.counts.proposals = 2; }],
    ["a role that is not the binding's", (c: any) => { c.role.poolRoleId = "role_other"; }]
  ])("refuses %s", (_label, mutate) => { const value = coverage(); mutate(value); expect(decodeSelectedRoleCoverage(value)).toBeNull(); });

  it("asks exactly the selection (untrimmed, encoded), GET no-store, and shows only a binding equal to it", async () => {
    const padded = { jobPoolUploadId: UPLOAD, poolRoleId: " role padded " };
    const { calls, fetcher } = answering(200, { success: true, comparison: coverage() });
    expect((await readSelectedRoleCoverage(ANALYSIS, padded, fetcher)).state).toBe("FAILED");
    expect(calls[0].url).toBe(`/api/career/analyses/${ANALYSIS}/job-comparison?jobPoolUploadId=${UPLOAD}&poolRoleId=%20role%20padded%20`);
    expect(calls[0].init).toMatchObject({ method: "GET", cache: "no-store" });
    expect((await readSelectedRoleCoverage(ANALYSIS, SELECTION, answering(200, { success: true, comparison: coverage() }).fetcher)).state).toBe("AVAILABLE");
    expect((await readSelectedRoleCoverage("ANL_OTHER", SELECTION, answering(200, { success: true, comparison: coverage() }).fetcher)).state).toBe("FAILED");
  });

  it.each([
    [409, "ERR_JOB_COMPARISON_NOT_SCOPED", "NOT_SCOPED"],
    [409, "ERR_JOB_COMPARISON_SCOPE_MISMATCH", "SCOPE_MISMATCH"],
    [409, "ERR_JOB_COMPARISON_SCOPE_DRIFT", "SCOPE_DRIFT"],
    [409, "ERR_JOB_COMPARISON_SCOPE_UNAVAILABLE", "SCOPE_UNAVAILABLE"],
    [409, "ERR_JOB_COMPARISON_LINEAGE_INVALID", "LINEAGE_INVALID"],
    [404, "ERR_JOB_COMPARISON_ANALYSIS_NOT_FOUND", "NOT_FOUND"],
    [503, "ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED", "NOT_PROVISIONED"],
    [400, "ERR_JOB_COMPARISON_SELECTION_REQUIRED", "FAILED"],
    [500, "ERR_JOB_COMPARISON_FAILED", "FAILED"],
    [409, "ERR_SOMETHING_ELSE", "FAILED"]
  ])("maps %i %s to %s", async (status, code, state) => {
    expect((await readSelectedRoleCoverage(ANALYSIS, SELECTION, answering(status, { success: false, issues: [{ code }] }).fetcher)).state).toBe(state);
  });

  it("a network failure or an undecodable body is FAILED", async () => {
    expect((await readSelectedRoleCoverage(ANALYSIS, SELECTION, async () => { throw new Error("offline"); })).state).toBe("FAILED");
    expect((await readSelectedRoleCoverage(ANALYSIS, SELECTION, async () => ({ status: 200, json: async () => { throw new Error("html"); } }))).state).toBe("FAILED");
  });
});

describe("JOB · JOB_STRUCTURE_V1 (strict decoder and read)", () => {
  it("decodes the contract", () => expect(decodeJobStructure(structure())).not.toBeNull());

  it.each([
    ["another mode", (s: any) => { s.investigationMode = "PERSON"; }],
    ["a score", (s: any) => { s.authority.scored = true; }],
    ["an interpretation", (s: any) => { s.authority.interpretation = "GEMINI"; }],
    ["an unknown finding", (s: any) => { s.findings[0].code = "ROLE_IS_BAD"; }],
    ["a declared responsibility without its text", (s: any) => { s.role.profile.responsibilityScope = { state: "DECLARED" }; }],
    ["counts that do not match", (s: any) => { s.counts.findings = 5; }],
    ["an unknown necessity kind", (s: any) => { s.requirements[0].necessityState = { kind: "MANDATORY" }; }]
  ])("refuses %s", (_label, mutate) => { const value = structure(); mutate(value); expect(decodeJobStructure(value)).toBeNull(); });

  it("reads exactly the selected job, GET no-store; another binding is FAILED", async () => {
    const { calls, fetcher } = answering(200, { success: true, structure: structure() });
    expect((await readJobStructure(SELECTION, fetcher)).state).toBe("AVAILABLE");
    expect(calls[0].url).toBe(`/api/career/job-pools/${UPLOAD}/roles/${ROLE}/structure`);
    expect(calls[0].init).toMatchObject({ method: "GET", cache: "no-store" });
    expect((await readJobStructure({ jobPoolUploadId: UPLOAD, poolRoleId: "role_other" }, answering(200, { success: true, structure: structure() }).fetcher)).state).toBe("FAILED");
  });

  it.each([
    [409, "ERR_JOB_STRUCTURE_UNAVAILABLE", "UNAVAILABLE"],
    [409, "ERR_JOB_STRUCTURE_LINEAGE_INVALID", "LINEAGE_INVALID"],
    [503, "ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED", "NOT_PROVISIONED"],
    [500, "ERR_JOB_STRUCTURE_FAILED", "FAILED"]
  ])("maps %i %s to %s", async (status, code, state) => {
    expect((await readJobStructure(SELECTION, answering(status, { success: false, issues: [{ code }] }).fetcher)).state).toBe(state);
  });
});
