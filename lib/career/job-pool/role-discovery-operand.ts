import { drizzle } from "drizzle-orm/postgres-js";
import { db } from "../db/client";
import { PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository, createCapabilityProposalProjectionReader } from "../capability-core";
import type { CapabilityProposalProjection } from "../capability-core";
import { AnalysisInvestigationError, createPostgresAnalysisInvestigationSources, readPersistedAnalysisInvestigation, type PersistedAnalysisInvestigation } from "../investigation/persisted";
import { createJobScopeResolver } from "../job-scope/scope";
import type { CompanyPoolData } from "../matching/pool";
import { JobRepository } from "../orchestration/job-repository";
import { JobPoolError } from "./errors";
import { createLocalJobPoolApplication } from "./local-composition";
import { POOL_ROLE_DISCOVERY_MAX_POOLS, buildPoolRoleDiscovery, type DiscoveryPoolInput, type PoolRoleDiscovery } from "./pool-role-discovery";
import { PostgresJobPoolRepository } from "./repository";

/**
 * The operand of a role discovery — one rule for the read route and the explicit start route (no second implementation): the pools
 * named by the caller (explicit, ≤ 10, no duplicates, ACTIVE), a PERSON analysis whose Discovery run the persisted boundary proves
 * scope-free, and its proposal projection. Read only.
 */
export type OperandIssue = { code: string; status: number; extra?: Record<string, string> };
export type RoleDiscoveryOperand = { ok: true; investigation: PersistedAnalysisInvestigation & { discoveryRunId: string }; projection: CapabilityProposalProjection; pools: DiscoveryPoolInput[]; discovery: PoolRoleDiscovery } | { ok: false; issue: OperandIssue };

export function validateRequestedPools(requested: string[]): OperandIssue | null {
  if (requested.length === 0) return { code: "ERR_ROLE_DISCOVERY_POOLS_REQUIRED", status: 400 };
  if (requested.some(id => typeof id !== "string" || id.trim() === "" || id !== id.trim()) || new Set(requested).size !== requested.length || requested.length > POOL_ROLE_DISCOVERY_MAX_POOLS) return { code: "ERR_ROLE_DISCOVERY_POOLS_INVALID", status: 400 };
  return null;
}

export async function loadRoleDiscoveryOperand(analysisId: string, requested: string[]): Promise<RoleDiscoveryOperand> {
  const invalid = validateRequestedPools(requested);
  if (invalid) return { ok: false, issue: invalid };
  const application = await createLocalJobPoolApplication();
  const references = new PostgresCapabilityProposalProjectionReferenceRepository(db);
  const capabilityRepository = new PostgresCapabilityCoreRepository(db);
  let investigation: PersistedAnalysisInvestigation;
  try {
    investigation = await readPersistedAnalysisInvestigation({
      ...createPostgresAnalysisInvestigationSources(db), references, runs: capabilityRepository, jobs: new JobRepository(db),
      scopes: createJobScopeResolver(new PostgresJobPoolRepository(drizzle(db.$client)))
    }, analysisId);
  } catch (error) {
    if (!(error instanceof AnalysisInvestigationError)) throw error;
    if (error.status === 404) return { ok: false, issue: { code: "ERR_ROLE_DISCOVERY_ANALYSIS_NOT_FOUND", status: 404 } };
    return { ok: false, issue: { code: "ERR_ROLE_DISCOVERY_BOUNDARY_UNRESOLVED", status: 409, extra: error.reason ? { reason: error.reason } : {} } };
  }
  if (investigation.mode !== "PERSON") return { ok: false, issue: { code: "ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON", status: 409 } };
  if (investigation.basis !== "JOB_DECLARATION_AND_DISCOVERY_RUN" || investigation.discoveryRunId === null || investigation.investigationScopeHash !== null) return { ok: false, issue: { code: "ERR_ROLE_DISCOVERY_PROJECTION_ABSENT", status: 409 } };
  const projection = await createCapabilityProposalProjectionReader({ references, capabilityRepository }).read(analysisId).catch(() => null);
  if (projection === null) return { ok: false, issue: { code: "ERR_ROLE_DISCOVERY_PROJECTION_ABSENT", status: 409 } };
  const pools: DiscoveryPoolInput[] = [];
  for (const jobPoolUploadId of requested) {
    let view;
    try { view = await application.get(jobPoolUploadId); } catch (error) {
      if (error instanceof JobPoolError && error.status === 404) return { ok: false, issue: { code: "ERR_ROLE_DISCOVERY_POOL_NOT_FOUND", status: 404, extra: { jobPoolUploadId } } };
      throw error;
    }
    if (view.poolStatus !== "ACTIVE") return { ok: false, issue: { code: "ERR_ROLE_DISCOVERY_POOL_INACTIVE", status: 409, extra: { jobPoolUploadId } } };
    pools.push({ jobPoolUploadId: view.jobPoolUploadId, poolId: view.poolId, poolVersion: view.poolVersion, poolName: view.poolName, poolStatus: view.poolStatus, canonicalSha256: view.canonicalSha256, pool: view.pool as CompanyPoolData, canonicalMapping: view.canonicalMapping });
  }
  const discovery = buildPoolRoleDiscovery({ analysis: { analysisId, jobId: investigation.jobId, discoveryRunId: investigation.discoveryRunId }, projection, pools });
  return { ok: true, investigation: { ...investigation, discoveryRunId: investigation.discoveryRunId }, projection, pools, discovery };
}
