import { beforeAll, describe, expect, it } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { createJobPoolApplication } from "../../../lib/career/job-pool/application";
import { JobStructureError, parseJobStructureSelection } from "../../../lib/career/job-pool/job-structure";
import { renderPoolSourceContent } from "../../../lib/career/job-pool/source-content";
import { GET } from "../../../app/api/career/job-pools/[jobPoolUploadId]/roles/[poolRoleId]/structure/route";
import { ENGINEERING_POOL_RAW, TEST_JOB_SCOPE, uploadEngineeringJobScope } from "../../support/job-scope";

/** JOB ONLY (JOB_STRUCTURE_V1) on PostgreSQL: the job itself, deterministic, no person, no Gemini. */
const get = (jobPoolUploadId: string, poolRoleId: string) =>
  GET(new Request(`http://local/api/career/job-pools/${jobPoolUploadId}/roles/${poolRoleId}/structure`), { params: Promise.resolve({ jobPoolUploadId, poolRoleId }) });

describe("JOB ONLY job structure route (PostgreSQL, no Gemini)", () => {
  let defective: { jobPoolUploadId: string; poolRoleId: string; source: string };
  let draftUploadId = "";

  // Three pool uploads through the real application: over 10 s under machine load (GRÜN measured 11.7 s at load ~6).
  beforeAll(async () => {
    await initDbSchema();
    await uploadEngineeringJobScope();
    const application = createJobPoolApplication({ database: drizzle(db.$client), analyses: { load: async () => null } });
    // A pool of its own with declared defects in one role: no necessity, unknown level, zero weight, empty domain,
    // an alias that collides with another requirement, no seniority.
    const pool = JSON.parse(ENGINEERING_POOL_RAW);
    pool.pool.version += 100;
    const roleId = TEST_JOB_SCOPE.poolRoleId;
    pool.roles.find((role: { id: string }) => role.id === roleId).seniority = "";
    const requirements = pool.requirements.filter((item: { role_id: string }) => item.role_id === roleId);
    delete requirements[0].necessity;
    requirements[1].required_level = "UNMAPPABLE_LEVEL_X";
    requirements[2].weight = 0;
    requirements[3].domain = "";
    requirements[4].aliases = [...(requirements[4].aliases ?? []), requirements[5].capability_name];
    const upload = await application.upload(JSON.stringify(pool), "job-structure-test");
    defective = { jobPoolUploadId: upload.view.jobPoolUploadId, poolRoleId: roleId, source: renderPoolSourceContent(pool) };
    const draft = JSON.parse(ENGINEERING_POOL_RAW);
    draft.pool.version += 101;
    draft.pool.status = "DRAFT";
    draftUploadId = (await application.upload(JSON.stringify(draft), "job-structure-test")).view.jobPoolUploadId;
  }, 60_000);

  it("200 no-store: organization, role, the role's requirements with canonical validation, evidence from the pool source only", async () => {
    const response = await get(TEST_JOB_SCOPE.jobPoolUploadId, TEST_JOB_SCOPE.poolRoleId);
    expect([response.status, response.headers.get("cache-control")]).toEqual([200, "no-store"]);
    const raw = await response.text();
    const { structure } = JSON.parse(raw);
    expect([structure.structureVersion, structure.investigationMode]).toEqual(["JOB_STRUCTURE_V1", "JOB"]);
    expect(structure.binding).toMatchObject(TEST_JOB_SCOPE);
    expect(structure.requirements.map((item: { poolRequirementId: string }) => item.poolRequirementId)).toEqual(Array.from({ length: 10 }, (_, index) => `req_kestrel_frontend_architect_${String(index + 1).padStart(2, "0")}`));
    const source = renderPoolSourceContent(JSON.parse(ENGINEERING_POOL_RAW));
    for (const item of structure.requirements) for (const quote of item.evidence) expect(source).toContain(quote);
    expect(structure.role.profile).toMatchObject({ responsibilityScope: { state: "NOT_DECLARED" }, proposalState: "PROPOSAL_ONLY", authorityState: "NONE", semanticValidationState: "NOT_RUN" });
    expect(structure.authority).toEqual({ basis: "DECLARED_POOL_FIELDS_AND_CANONICAL_VALIDATION", interpretation: "NONE", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", scored: false });
    expect(structure.findings.map((item: { code: string }) => item.code)).toContain("ROLE_RESPONSIBILITY_NOT_DECLARED");
    // No person: no analysis, candidate, capability proposal or match field anywhere.
    expect(raw).not.toMatch(/analysisId|candidate|PCAP_|resonance|"matched"|coverage/i);
  });

  it("reports the declared defects as structural findings with their pool source lines", async () => {
    const { structure } = await (await get(defective.jobPoolUploadId, defective.poolRoleId)).json();
    const codes = structure.findings.map((item: { code: string; subject: { id: string } }) => `${item.code}@${item.subject.id}`);
    const id = (n: number) => `req_kestrel_frontend_architect_${String(n).padStart(2, "0")}`;
    expect(codes).toEqual(expect.arrayContaining([
      `ROLE_SENIORITY_UNDECLARED@${defective.poolRoleId}`, `ROLE_RESPONSIBILITY_NOT_DECLARED@${defective.poolRoleId}`,
      `REQUIREMENT_NECESSITY_UNDECLARED@${id(1)}`, `REQUIREMENT_LEVEL_UNRESOLVED@${id(2)}`, `REQUIREMENT_ZERO_WEIGHT@${id(3)}`,
      `REQUIREMENT_DOMAIN_UNDECLARED@${id(4)}`, `REQUIREMENT_NAME_COLLISION@${id(5)}`, `REQUIREMENT_NAME_COLLISION@${id(6)}`
    ]));
    const collision = structure.findings.find((item: { code: string; subject: { id: string } }) => item.code === "REQUIREMENT_NAME_COLLISION" && item.subject.id === id(5));
    expect(collision.relatedRequirementIds).toEqual([id(6)]);
    for (const finding of structure.findings) for (const quote of finding.evidence) expect(defective.source).toContain(quote);
    expect(structure.counts.findings).toBe(structure.findings.length);
  });

  it("refuses: unknown pool, foreign role, inactive pool 409; nothing is computed for another job", async () => {
    for (const [upload, role] of [["JPOOL_UNKNOWN", TEST_JOB_SCOPE.poolRoleId], [TEST_JOB_SCOPE.jobPoolUploadId, "role_not_in_pool"], [draftUploadId, TEST_JOB_SCOPE.poolRoleId]]) {
      const response = await get(upload, role);
      expect([response.status, await response.json()]).toEqual([409, { success: false, issues: [{ code: "ERR_JOB_STRUCTURE_UNAVAILABLE" }] }]);
    }
    expect(() => parseJobStructureSelection("", "x")).toThrow(JobStructureError);
  });
});
