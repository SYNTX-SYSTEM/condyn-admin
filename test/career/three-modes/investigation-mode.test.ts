import { describe, expect, it } from "vitest";
import { DEFAULT_INVESTIGATION_MODE, INVESTIGATION_INVALID_MESSAGE, checkAnalysisPayload, declareAnalysis, investigationModeFromParam } from "../../../lib/career/job-pool/investigation-mode";
import { INVESTIGATION_INVALID_MESSAGE as BACKEND_MESSAGE, parseDeclaredInvestigation } from "../../../lib/career/investigation/boundary";
import type { JobScopeValidation } from "../../../lib/career/job-pool/job-scope";

/** The frontend mirror of GELB's investigation boundary (owner GO "DEMO FRONTEND", 2026-10-15). */
const SCOPE = { jobPoolUploadId: "JPOOL_6CA8892F9AD0F6AC316F8FC3F6294BB7", poolRoleId: "role_pink_alpha_architect" };
const VALID: JobScopeValidation = { state: "VALID", scope: SCOPE, roleTitle: "Distributed Systems Architect", organizationId: "org_pink_alpha", organizationName: "Alpha", poolName: "PINK" };

describe("investigation mode — frontend boundary", () => {
  it("the sentence is the backend's, verbatim", () => expect(INVESTIGATION_INVALID_MESSAGE).toBe(BACKEND_MESSAGE));

  it("restores only an exact mode from the URL; the ground state is PERSON_X_JOB", () => {
    expect(DEFAULT_INVESTIGATION_MODE).toBe("PERSON_X_JOB");
    for (const mode of ["PERSON", "PERSON_X_JOB", "JOB"]) expect(investigationModeFromParam(mode)).toBe(mode);
    for (const value of [undefined, null, "", "person", " PERSON", "PERSON×JOB", "TEAM"]) expect(investigationModeFromParam(value as string | null | undefined)).toBeNull();
  });

  it("declares PERSON without any job scope, even with a VALID job selected", () => {
    expect(declareAnalysis("PERSON", VALID)).toEqual({ ok: true, mode: "PERSON", declaration: { investigation: { mode: "PERSON" } } });
    expect(declareAnalysis("PERSON", { state: "NONE" })).toEqual({ ok: true, mode: "PERSON", declaration: { investigation: { mode: "PERSON" } } });
  });

  it("declares PERSON_X_JOB only with a VALID scope and exactly its two keys; JOB never", () => {
    expect(declareAnalysis("PERSON_X_JOB", VALID)).toEqual({ ok: true, mode: "PERSON_X_JOB", declaration: { investigation: { mode: "PERSON_X_JOB" }, jobScope: SCOPE } });
    for (const validation of [{ state: "NONE" }, { state: "CHECKING", scope: SCOPE }, { state: "INVALID", scope: SCOPE, reason: "ROLE_NOT_IN_POOL" }] as JobScopeValidation[]) expect(declareAnalysis("PERSON_X_JOB", validation)).toEqual({ ok: false, code: "ERR_JOB_SCOPE_REQUIRED" });
    expect(declareAnalysis("JOB", VALID)).toEqual({ ok: false, code: "ERR_INVESTIGATION_MODE_NOT_ANALYZABLE" });
  });

  it.each([
    ["no declaration, valid scope", { documents: [], jobScope: SCOPE }],
    ["no declaration, no scope", { documents: [] }],
    ["PERSON", { documents: [], investigation: { mode: "PERSON" } }],
    ["PERSON + scope", { documents: [], investigation: { mode: "PERSON" }, jobScope: SCOPE }],
    ["PERSON + jobScope null", { documents: [], investigation: { mode: "PERSON" }, jobScope: null }],
    ["PERSON_X_JOB + scope", { documents: [], investigation: { mode: "PERSON_X_JOB" }, jobScope: SCOPE }],
    ["PERSON_X_JOB without scope", { documents: [], investigation: { mode: "PERSON_X_JOB" } }],
    ["JOB", { documents: [], investigation: { mode: "JOB" } }],
    ["unknown mode", { documents: [], investigation: { mode: "TEAM" } }],
    ["extra key", { documents: [], investigation: { mode: "PERSON", x: 1 } }],
    ["investigation null", { documents: [], investigation: null }],
    ["investigation array", { documents: [], investigation: ["PERSON"] }],
    ["scope with an extra key", { documents: [], jobScope: { ...SCOPE, extra: 1 } }]
  ])("agrees with the server's parseDeclaredInvestigation: %s", (_label, payload) => {
    const local = checkAnalysisPayload(payload);
    let server: { ok: true; mode: string } | { ok: false; code: string };
    try { const declared = parseDeclaredInvestigation(payload); server = { ok: true, mode: declared.mode }; } catch (error) { server = { ok: false, code: (error as { code: string }).code }; }
    expect(local.ok ? { ok: true, mode: local.mode } : { ok: false, code: local.code }).toEqual(server);
  });
});
