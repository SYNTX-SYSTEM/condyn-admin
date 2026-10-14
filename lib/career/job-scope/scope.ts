import { createHash } from "node:crypto";
import type { CompanyPoolData, PoolCapabilityRequirement, PoolOrganization, PoolRole } from "../matching/pool";
import type { JobPoolCanonicalMapping, JobPoolCanonicalRoleMapping } from "../job-pool/types";
import { stableJson } from "../job-pool/upload";
import { JobScopeRequiredError } from "./errors";
import {
  normalizeValue, organizationOfRole, renderPoolSourceContent, requirementFieldLine, requirementLine, requirementsOfRole, roleFieldLine, roleLine
} from "../job-pool/source-content";

/**
 * Job selection of one capability analysis (SFE invariant JOB POOL FIRST: no valid pool + selected job → no
 * capability analysis). A selection is valid only when it names a stored, ACTIVE Job Pool upload with a persisted
 * canonical mapping and a role of that pool whose requirements are all mapped. Validation only: the resolved scope
 * is not passed to Gemini or to any prompt.
 */
export interface JobScopeSelection {
  jobPoolUploadId: string;
  poolRoleId: string;
}

/** Missing or malformed selection: ERR_JOB_SCOPE_REQUIRED; unknown or unmapped job: ERR_JOB_SCOPE_INVALID. */
const required = (detail: string) => new JobScopeRequiredError("ERR_JOB_SCOPE_REQUIRED", detail);
const invalid = (detail: string) => new JobScopeRequiredError("ERR_JOB_SCOPE_INVALID", detail);

const JOB_POOL_UPLOAD_ID = /^JPOOL_[0-9A-F]{32}$/;

/** Exact-key validation of the client selection; absent or malformed selections are ERR_JOB_SCOPE_REQUIRED. */
export function parseJobScopeSelection(value: unknown): JobScopeSelection {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw required("A job must be selected (jobScope.jobPoolUploadId, jobScope.poolRoleId).");
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.length !== 2 || keys[0] !== "jobPoolUploadId" || keys[1] !== "poolRoleId") throw required("jobScope must contain exactly jobPoolUploadId and poolRoleId.");
  const { jobPoolUploadId, poolRoleId } = record;
  if (typeof jobPoolUploadId !== "string" || !JOB_POOL_UPLOAD_ID.test(jobPoolUploadId)) throw required("jobScope.jobPoolUploadId must be a JPOOL_ identifier.");
  // Same form as the pool schema (role id = non-empty string); whether the role exists is decided by the stored pool (422).
  if (typeof poolRoleId !== "string" || poolRoleId.length === 0) throw required("jobScope.poolRoleId must be a non-empty pool role id.");
  return { jobPoolUploadId, poolRoleId };
}

export interface ResolvedJobScopeRequirement {
  poolRequirement: PoolCapabilityRequirement;
  /** The persisted canonical mapping entry of this requirement (target requirement revision identity). */
  mapping: JobPoolCanonicalRoleMapping["requirements"][number];
}

export interface ResolvedJobScope {
  selection: JobScopeSelection;
  poolId: string;
  poolVersion: number;
  poolCanonicalSha256: string;
  organization: PoolOrganization;
  role: PoolRole;
  /** The persisted canonical mapping of this role (target role profile and reconstruction identities). */
  roleMapping: Omit<JobPoolCanonicalRoleMapping, "requirements">;
  requirements: ResolvedJobScopeRequirement[];
  /** Exact lines of the rendered pool source (JOB_POOL_SOURCE_RENDERING_V1) that describe this job. */
  scopeLines: string[];
  /** Identity of the scope: hash over selection, pool canonical hash and the exact scope lines. */
  scopeSha256: string;
}

export interface StoredJobPool {
  jobPoolUploadId: string;
  poolStatus: string;
  canonicalSha256: string;
  pool: CompanyPoolData;
  mapping: JobPoolCanonicalMapping;
}

function scopeLinesOf(pool: CompanyPoolData, organization: PoolOrganization, role: PoolRole, requirements: PoolCapabilityRequirement[]): string[] {
  const poolSource = renderPoolSourceContent(pool);
  const lines = [
    ...poolSource.split("\n").filter(line => line.startsWith(`ORGANIZATION ${organization.id}:`) || line.startsWith(`ORGANIZATION ${organization.id} `)),
    roleLine(role),
    roleFieldLine(role, "ORGANIZATION", role.organization_id),
    roleFieldLine(role, "SENIORITY", role.seniority),
    roleFieldLine(role, "DOMAIN FOCUS", role.domain_focus),
    roleFieldLine(role, "DESCRIPTION", role.description)
  ];
  for (const requirement of requirements) {
    lines.push(
      requirementLine(requirement),
      requirementFieldLine(requirement, "DOMAIN", requirement.domain),
      requirementFieldLine(requirement, "REQUIRED LEVEL", requirement.required_level),
      requirementFieldLine(requirement, "NECESSITY", requirement.necessity ?? "UNDECLARED"),
      requirementFieldLine(requirement, "TYPE", requirement.requirement_type ?? "CAPABILITY"),
      requirementFieldLine(requirement, "WEIGHT", String(requirement.weight)),
      requirementFieldLine(requirement, "ALIASES", (requirement.aliases ?? []).map(normalizeValue).join("; ")),
      requirementFieldLine(requirement, "EVIDENCE HINT", requirement.evidence_hint ?? "")
    );
  }
  const sourceLines = new Set(poolSource.split("\n"));
  for (const line of lines) if (!sourceLines.has(line)) throw invalid(`scope line is not part of the pool source: ${line.slice(0, 80)}`);
  return lines;
}

/**
 * Scopes issued by resolveJobScopeFromStoredPool. Pipeline entries accept only these (assertIssuedJobScope), so an
 * object literal, a copy or a test double cannot stand in for a validated job: there is no flag or shortcut that
 * skips the validation, for tests, retries or scripts alike.
 */
const issuedScopes = new WeakSet<object>();

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const item of Object.values(value as Record<string, unknown>)) deepFreeze(item);
  }
  return value;
};

/** Refuses (ERR_JOB_SCOPE_REQUIRED) anything that is not a scope issued by the validation of a stored pool. */
export function assertIssuedJobScope(value: unknown): asserts value is ResolvedJobScope {
  if (!value || typeof value !== "object" || !issuedScopes.has(value)) {
    throw required("A capability analysis runs only with a validated job scope (valid pool + selected job).");
  }
}

/** Pure resolution from one stored pool upload and its persisted canonical mapping. */
export function resolveJobScopeFromStoredPool(stored: StoredJobPool, requested: JobScopeSelection): ResolvedJobScope {
  const selection = parseJobScopeSelection(requested);
  if (stored.jobPoolUploadId !== selection.jobPoolUploadId) throw invalid("stored pool does not match the selection.");
  if (stored.poolStatus !== "ACTIVE") throw invalid(`job pool ${selection.jobPoolUploadId} is ${stored.poolStatus}, not ACTIVE.`);
  const role = stored.pool.roles.find(item => item.id === selection.poolRoleId);
  if (!role) throw invalid(`role ${selection.poolRoleId} is not part of ${selection.jobPoolUploadId}.`);
  const mapped = stored.mapping.roles.find(item => item.poolRoleId === role.id);
  if (!mapped) throw invalid(`role ${role.id} has no canonical mapping.`);
  const organization = organizationOfRole(stored.pool, role);
  const poolRequirements = requirementsOfRole(stored.pool, role);
  const requirements = poolRequirements.map(poolRequirement => {
    const mapping = mapped.requirements.find(item => item.poolRequirementId === poolRequirement.id);
    if (!mapping) throw invalid(`requirement ${poolRequirement.id} has no canonical mapping.`);
    return { poolRequirement, mapping };
  });
  const { requirements: _mappedRequirements, ...roleMapping } = mapped;
  const scopeLines = scopeLinesOf(stored.pool, organization, role, poolRequirements);
  // A structured copy, frozen, so the issued scope cannot change after validation or alias the stored pool.
  const scope: ResolvedJobScope = deepFreeze(structuredClone({
    selection,
    poolId: stored.pool.pool.id,
    poolVersion: stored.pool.pool.version,
    poolCanonicalSha256: stored.canonicalSha256,
    organization,
    role,
    roleMapping,
    requirements,
    scopeLines,
    scopeSha256: createHash("sha256").update(stableJson({ selection, poolCanonicalSha256: stored.canonicalSha256, scopeLines }), "utf8").digest("hex")
  }));
  issuedScopes.add(scope);
  return scope;
}

export interface JobScopeResolver {
  resolve(selection: JobScopeSelection): Promise<ResolvedJobScope>;
}

/** Resolver over a stored-pool reader (the Postgres Job Pool repository in production). */
export function createJobScopeResolver(reader: {
  getUpload(jobPoolUploadId: string): Promise<{ jobPoolUploadId: string; poolStatus: string; canonicalSha256: string; canonicalJson: string } | null>;
  getMapping(jobPoolUploadId: string): Promise<JobPoolCanonicalMapping | null>;
}): JobScopeResolver {
  return {
    async resolve(selection) {
      const upload = await reader.getUpload(selection.jobPoolUploadId);
      if (upload === null) throw invalid(`unknown job pool upload ${selection.jobPoolUploadId}.`);
      const mapping = await reader.getMapping(selection.jobPoolUploadId);
      if (mapping === null) throw invalid(`job pool upload ${selection.jobPoolUploadId} has no canonical mapping.`);
      return resolveJobScopeFromStoredPool({
        jobPoolUploadId: upload.jobPoolUploadId, poolStatus: upload.poolStatus, canonicalSha256: upload.canonicalSha256,
        pool: JSON.parse(upload.canonicalJson) as CompanyPoolData, mapping
      }, selection);
    }
  };
}
