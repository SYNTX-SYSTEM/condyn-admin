import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import type { JobPoolCanonicalMapping } from "../../lib/career/job-pool/types";
import { parseJobPoolUpload } from "../../lib/career/job-pool/upload";
import { resolveJobScopeFromStoredPool, type JobScopeSelection, type ResolvedJobScope, type StoredJobPool } from "../../lib/career/job-scope";

/**
 * Shared job-selection fixtures (SFE invariant JOB POOL FIRST: no valid pool + selected job → no capability
 * analysis). The pool is the DLL engineering test pool.
 */
export const ENGINEERING_POOL_PATH = path.resolve(__dirname, "../../docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json");
export const ENGINEERING_POOL_RAW = readFileSync(ENGINEERING_POOL_PATH, "utf8");
const parsed = parseJobPoolUpload(ENGINEERING_POOL_RAW);

export const TEST_JOB_SCOPE: JobScopeSelection = { jobPoolUploadId: parsed.jobPoolUploadId, poolRoleId: "role_kestrel_frontend_architect" };
export const TEST_JOB_SCOPE_B: JobScopeSelection = { jobPoolUploadId: parsed.jobPoolUploadId, poolRoleId: "role_aurelion_principal_architect" };

/** A canonical mapping with synthetic revision ids, for tests without a database. */
function syntheticMapping(): JobPoolCanonicalMapping {
  const id = (kind: string, value: string) => `${kind}_${createHash("sha256").update(value).digest("hex").slice(0, 24).toUpperCase()}`;
  return {
    mappingState: "MAPPED", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", provider: "CONDYN_JOB_POOL_JSON",
    organizations: parsed.pool.organizations.map(organization => ({ poolOrganizationId: organization.id, name: organization.name, targetOrganizationEntityId: id("TOE", organization.id), targetOrganizationRevisionId: id("TOR", organization.id) })),
    roles: parsed.pool.roles.map(role => ({
      poolRoleId: role.id, title: role.title, poolOrganizationId: role.organization_id,
      targetSourceRevisionId: id("TSR", "pool"), targetRoleEntityId: id("TRE", role.id), targetRoleSourceBindingRevisionId: id("TRSB", role.id),
      targetRoleOrganizationBindingRevisionId: id("TROB", role.id), targetRoleProfileRevisionId: id("TRP", role.id),
      targetRoleReconstructionBatchRunId: id("TRRB", role.id), targetRequirementReconstructionBatchRunId: id("TQRB", role.id),
      requirements: parsed.pool.requirements.filter(requirement => requirement.role_id === role.id).map(requirement => ({
        poolRequirementId: requirement.id, capabilityName: requirement.capability_name,
        targetRequirementEntityId: id("TQE", requirement.id), targetRequirementRevisionId: id("TQR", requirement.id),
        targetRequirementReconstructionResultId: id("TQRR", requirement.id), targetRequirementEntityAdmissionId: id("TQEA", requirement.id),
        matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY" as const, necessityState: "UNKNOWN" as const
      }))
    }))
  };
}

export const TEST_STORED_POOL: StoredJobPool = {
  jobPoolUploadId: parsed.jobPoolUploadId, poolStatus: parsed.pool.pool.status, canonicalSha256: parsed.canonicalSha256,
  pool: parsed.pool, mapping: syntheticMapping()
};

export const resolveTestJobScope = (selection: JobScopeSelection = TEST_JOB_SCOPE): ResolvedJobScope => resolveJobScopeFromStoredPool(TEST_STORED_POOL, selection);

/** Uploads the engineering pool into the verified disposable test database through the production Job Pool application. */
export async function uploadEngineeringJobScope(): Promise<JobScopeSelection> {
  const { db } = await import("../../lib/career/db/client");
  const { createJobPoolApplication } = await import("../../lib/career/job-pool/application");
  const { ensureJobPoolPersistenceRegistration } = await import("../../lib/career/job-pool/local-composition");
  if (await ensureJobPoolPersistenceRegistration() !== "REGISTERED") throw new Error("ERR_TEST_JOB_POOL_PERSISTENCE_NOT_REGISTERED");
  const application = createJobPoolApplication({ database: drizzle(db.$client), analyses: { load: async () => null } });
  const { view } = await application.upload(ENGINEERING_POOL_RAW, "test-job-scope-fixture");
  if (view.jobPoolUploadId !== TEST_JOB_SCOPE.jobPoolUploadId) throw new Error("ERR_TEST_JOB_POOL_ID_DRIFT");
  return TEST_JOB_SCOPE;
}

/** A second, minimal ACTIVE pool owned by the JOB POOL FIRST tests; its single role exists only here. */
export const OTHER_POOL = {
  pool: { id: "pool_job_pool_first_other_v1", name: "JOB POOL FIRST other pool", description: "Second pool for foreign-role checks.", version: 1, status: "ACTIVE", created_at: "2026-10-14T00:00:00.000Z" },
  organizations: [{ id: "org_jpf_other", pool_id: "pool_job_pool_first_other_v1", org_id: "jpf_other", name: "Other Org", country_iso: "DE", region: "Berlin", industry: "Software", scale: "SME", description: "Fictitious organization." }],
  roles: [{ id: "role_jpf_other_only", pool_id: "pool_job_pool_first_other_v1", organization_id: "org_jpf_other", title: "Other Role", seniority: "Senior", domain_focus: "Software", description: "A role that exists only in the other pool." }],
  requirements: [{ id: "req_jpf_other_01", role_id: "role_jpf_other_only", capability_name: "TypeScript", domain: "Software Engineering", weight: 0.5, required_level: "L3 - Proficient" }]
};
