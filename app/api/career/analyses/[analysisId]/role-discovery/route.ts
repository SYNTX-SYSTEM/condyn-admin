import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/postgres-js";
import { db } from "../../../../../../lib/career/db/client";
import {
  PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository, createCapabilityProposalProjectionReader
} from "../../../../../../lib/career/capability-core";
import { AnalysisInvestigationError, createPostgresAnalysisInvestigationSources, readPersistedAnalysisInvestigation } from "../../../../../../lib/career/investigation/persisted";
import { JobPoolError } from "../../../../../../lib/career/job-pool/errors";
import { createLocalJobPoolApplication } from "../../../../../../lib/career/job-pool/local-composition";
import { POOL_ROLE_DISCOVERY_MAX_POOLS, buildPoolRoleDiscovery, type DiscoveryPoolInput } from "../../../../../../lib/career/job-pool/pool-role-discovery";
import { PostgresJobPoolRepository } from "../../../../../../lib/career/job-pool/repository";
import { engineVersionHash, evaluateSemanticRelations, planSemanticInvestigation, rankSemanticRoles, proposalContentHash, requirementContentHash, relationKey, type RelationEngineIdentity } from "../../../../../../lib/career/job-pool/relation-cache";
import { PostgresRelationCacheRepository } from "../../../../../../lib/career/job-pool/relation-cache-repository";
import { GeminiSemanticRelationProvider } from "../../../../../../lib/career/job-pool/semantic-gemini-provider";
import { createJobScopeResolver } from "../../../../../../lib/career/job-scope/scope";
import type { CompanyPoolData } from "../../../../../../lib/career/matching/pool";
import { JobRepository } from "../../../../../../lib/career/orchestration/job-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "cache-control": "no-store" };
/** Semantic execution uses the existing Gemini runtime when configured; explicit role-discovery overrides remain supported. */
const semanticProvider = process.env.ROLE_DISCOVERY_SEMANTIC_PROVIDER ?? (process.env.GEMINI_API_KEY ? "gemini" : null);
const semanticModel = process.env.ROLE_DISCOVERY_SEMANTIC_MODEL ?? process.env.GEMINI_MODEL ?? null;
const SEMANTIC_RELATION_ENGINE: RelationEngineIdentity | null = semanticProvider && semanticModel
  ? { contractVersion: "PROPOSAL_REQUIREMENT_RELATION_V1", provider: semanticProvider, model: semanticModel, promptChecksum: process.env.ROLE_DISCOVERY_SEMANTIC_PROMPT_SHA256 ?? "ROLE_DISCOVERY_SEMANTIC_PROMPT_V1" }
  : null;
const issue = (code: string, status: number, extra: Record<string, string> = {}) => NextResponse.json({ success: false, issues: [{ code, ...extra }] }, { status, headers: NO_STORE });

/**
 * POOL_ROLE_DISCOVERY_V1 (owner D-RD-1 = B, 2026-10-24): the PERSON capability proposals of one analysis related, LEXICALLY, to every
 * role of the job pool uploads named in `?jobPoolUploadId=` (one or more, explicit, at most 10, no duplicates). Never a stored pool
 * that was not named. The operand must be a PERSON analysis whose Discovery run is proven scope-free (the persisted investigation
 * boundary), so the proposals are the source's own, not rewritten for a job; PERSON × JOB analyses are refused (their proposals
 * were named for one role). Read only: no model, no write, no score, no ranking, no decision.
 */
export async function GET(request: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;
  const requested = new URL(request.url).searchParams.getAll("jobPoolUploadId");
  if (requested.length === 0) return issue("ERR_ROLE_DISCOVERY_POOLS_REQUIRED", 400);
  if (requested.some(id => id.trim() === "" || id !== id.trim()) || new Set(requested).size !== requested.length || requested.length > POOL_ROLE_DISCOVERY_MAX_POOLS) {
    return issue("ERR_ROLE_DISCOVERY_POOLS_INVALID", 400);
  }
  try {
    const application = await createLocalJobPoolApplication();
    const references = new PostgresCapabilityProposalProjectionReferenceRepository(db);
    const capabilityRepository = new PostgresCapabilityCoreRepository(db);
    let investigation;
    try {
      investigation = await readPersistedAnalysisInvestigation({
        ...createPostgresAnalysisInvestigationSources(db), references, runs: capabilityRepository, jobs: new JobRepository(db),
        scopes: createJobScopeResolver(new PostgresJobPoolRepository(drizzle(db.$client)))
      }, analysisId);
    } catch (error) {
      if (!(error instanceof AnalysisInvestigationError)) throw error;
      if (error.status === 404) return issue("ERR_ROLE_DISCOVERY_ANALYSIS_NOT_FOUND", 404);
      return issue("ERR_ROLE_DISCOVERY_BOUNDARY_UNRESOLVED", 409, error.reason ? { reason: error.reason } : {});
    }
    if (investigation.mode !== "PERSON") return issue("ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON", 409);
    if (investigation.basis !== "JOB_DECLARATION_AND_DISCOVERY_RUN" || investigation.discoveryRunId === null || investigation.investigationScopeHash !== null) {
      return issue("ERR_ROLE_DISCOVERY_PROJECTION_ABSENT", 409);
    }
    const projection = await createCapabilityProposalProjectionReader({ references, capabilityRepository }).read(analysisId).catch(() => null);
    if (projection === null) return issue("ERR_ROLE_DISCOVERY_PROJECTION_ABSENT", 409);

    const pools: DiscoveryPoolInput[] = [];
    for (const jobPoolUploadId of requested) {
      let view;
      try { view = await application.get(jobPoolUploadId); } catch (error) {
        if (error instanceof JobPoolError && error.status === 404) return issue("ERR_ROLE_DISCOVERY_POOL_NOT_FOUND", 404, { jobPoolUploadId });
        throw error;
      }
      if (view.poolStatus !== "ACTIVE") return issue("ERR_ROLE_DISCOVERY_POOL_INACTIVE", 409, { jobPoolUploadId });
      pools.push({ jobPoolUploadId: view.jobPoolUploadId, poolId: view.poolId, poolVersion: view.poolVersion, poolName: view.poolName, poolStatus: view.poolStatus, canonicalSha256: view.canonicalSha256, pool: view.pool as CompanyPoolData, canonicalMapping: view.canonicalMapping });
    }
    const discovery = buildPoolRoleDiscovery({ analysis: { analysisId, jobId: investigation.jobId, discoveryRunId: investigation.discoveryRunId }, projection, pools });
    // The call volume a semantic investigation of these roles would need, minus what the relation cache already holds.
    const requirements = new Map(pools.flatMap(p => p.pool.requirements.map(r => [`${p.jobPoolUploadId}\u0000${r.role_id}\u0000${r.id}`, r] as const)));
    const semanticPlan = await planSemanticInvestigation({
      discovery, proposals: projection.capabilities,
      requirementsByKey: key => requirements.get(`${key.jobPoolUploadId}\u0000${key.poolRoleId}\u0000${key.poolRequirementId}`) ?? null,
      engine: SEMANTIC_RELATION_ENGINE, cache: SEMANTIC_RELATION_ENGINE ? new PostgresRelationCacheRepository(db.$client) : null
    });
    let semanticRanking = undefined;
    if (SEMANTIC_RELATION_ENGINE) {
      const engineHash = engineVersionHash(SEMANTIC_RELATION_ENGINE);
      const cache = new PostgresRelationCacheRepository(db.$client);
      const keys = discovery.roles.flatMap(role => role.requirements.flatMap(requirement => projection.capabilities.map(proposal => {
        const requirementContent = requirements.get(`${requirement.key.jobPoolUploadId}\u0000${requirement.key.poolRoleId}\u0000${requirement.key.poolRequirementId}`);
        if (!requirementContent) return null;
        return `${proposalContentHash(proposal)}:${requirementContentHash(requirementContent)}:${engineHash}`;
      }).filter((key): key is string => key !== null)));
      let relations = keys.length ? await cache.getByKeys(keys.map(key => {
        const [proposalHash, requirementHash, hash] = key.split(":");
        return relationKey(proposalHash, requirementHash, hash);
      })) : [];
      const relationKeys = new Set(relations.map(relation => relation.relationKey));
      const provider = new GeminiSemanticRelationProvider({ model: SEMANTIC_RELATION_ENGINE.model });
      for (const role of discovery.roles) {
        const pending = role.requirements.map(requirement => requirements.get(`${requirement.key.jobPoolUploadId}\u0000${requirement.key.poolRoleId}\u0000${requirement.key.poolRequirementId}`)).filter((requirement): requirement is NonNullable<typeof requirement> => requirement !== undefined).filter(requirement => projection.capabilities.some(proposal => !relationKeys.has(relationKey(proposalContentHash(proposal), requirementContentHash(requirement), engineHash))));
        if (pending.length === 0) continue;
        const created = await evaluateSemanticRelations({ engine: SEMANTIC_RELATION_ENGINE, proposals: projection.capabilities, requirements: pending, provider, writer: cache });
        relations = [...relations, ...created];
        created.forEach(relation => relationKeys.add(relation.relationKey));
      }
      semanticRanking = rankSemanticRoles({ discovery, proposals: projection.capabilities, requirementsByKey: key => requirements.get(`${key.jobPoolUploadId}\u0000${key.poolRoleId}\u0000${key.poolRequirementId}`) ?? null, relations, engineVersionHash: engineHash });
    }
    return NextResponse.json({ success: true, discovery: { ...discovery, semanticPlan, ...(semanticRanking ? { semanticRanking } : {}) } }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof JobPoolError && error.status === 503) return issue(error.code, 503);
    console.error("[role-discovery] failed", error instanceof Error ? error.name : "unknown");
    return issue("ERR_ROLE_DISCOVERY_FAILED", 500);
  }
}
