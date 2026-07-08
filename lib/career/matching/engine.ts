import { VerifiedCareerAnalysis } from "../types";
import {
  CompanyPoolData,
  CompanyPoolDataSchema,
  PoolSearchQuery
} from "./pool";
import {
  computeRoleResonanceScore,
  ExtractedCapabilityItem,
  MatchedCapabilityDetail,
  MissingCapabilityDetail,
  ScoreBreakdownItem
} from "./scoring";

export interface RoleMatchResultItem {
  roleId: string;
  title: string;
  seniority: string;
  organizationId: string;
  organizationName: string;
  resonanceScore: number;
  matchedCapabilities: MatchedCapabilityDetail[];
  missingCapabilities: MissingCapabilityDetail[];
  scoreBreakdown: ScoreBreakdownItem[];
}

export interface OrganizationMatchResultItem {
  organizationId: string;
  name: string;
  industry: string;
  aggregateScore: number;
  roleMatchCount: number;
  topRoleTitle?: string;
}

export interface CareerMatchResult {
  analysis_id: string;
  pool_id: string;
  pool_version: number;
  role_matches: RoleMatchResultItem[];
  organization_matches: OrganizationMatchResultItem[];
  search_queries: PoolSearchQuery[];
}

/**
 * Executes deterministic resonance matching between a canonical career analysis
 * and a controlled company pool.
 * SOVEREIGNTY GUARANTEES:
 * 1. Rejects pools whose status is not ACTIVE (ERR_INACTIVE_COMPANY_POOL).
 * 2. Emits fully explainable matched/missing capabilities per role.
 * 3. Sorts roles and organizations strictly by deterministic score descending.
 */
export function matchCareerAnalysisAgainstPool(
  analysis: VerifiedCareerAnalysis,
  rawPoolData: CompanyPoolData
): CareerMatchResult {
  const poolData = CompanyPoolDataSchema.parse(rawPoolData);

  if (poolData.pool.status !== "ACTIVE") {
    throw new Error(
      `ERR_INACTIVE_COMPANY_POOL: Cannot match against inactive company pool (Status: ${poolData.pool.status}). Runtime matching strictly requires ACTIVE pools.`
    );
  }

  const analysisId =
    analysis?.structured_data?.analysis?.metadata?.analysis_id || "unknown_analysis";

  // Extract capability tokens from canonical analysis
  const rawCapabilities = analysis?.structured_data?.analysis?.capabilities || [];
  const extractedCapabilities: ExtractedCapabilityItem[] = rawCapabilities.map((c: any) => ({
    name: c.name || c.capability_name || "",
    domain: c.domain || "",
    confidence: typeof c.confidence === "number" ? c.confidence : 0.85
  }));

  const roleMatches: RoleMatchResultItem[] = [];

  for (const role of poolData.roles) {
    const org = poolData.organizations.find((o) => o.id === role.organization_id);
    const roleReqs = poolData.requirements.filter((r) => r.role_id === role.id);

    const scoreResult = computeRoleResonanceScore(extractedCapabilities, roleReqs);

    roleMatches.push({
      roleId: role.id,
      title: role.title,
      seniority: role.seniority,
      organizationId: role.organization_id,
      organizationName: org ? org.name : "Unknown Organization",
      resonanceScore: scoreResult.score,
      matchedCapabilities: scoreResult.matchedCapabilities,
      missingCapabilities: scoreResult.missingCapabilities,
      scoreBreakdown: scoreResult.scoreBreakdown
    });
  }

  // Sort roles descending by resonance score
  roleMatches.sort((a, b) => b.resonanceScore - a.resonanceScore);

  // Aggregate by organization
  const orgMatches: OrganizationMatchResultItem[] = [];
  for (const org of poolData.organizations) {
    const orgRoles = roleMatches.filter((r) => r.organizationId === org.id);
    const roleMatchCount = orgRoles.length;
    let aggregateScore = 0.0;
    let topRoleTitle: string | undefined;

    if (roleMatchCount > 0) {
      // Aggregate score is the maximum resonance score among its roles
      aggregateScore = Math.max(...orgRoles.map((r) => r.resonanceScore));
      topRoleTitle = orgRoles[0].title;
    }

    orgMatches.push({
      organizationId: org.id,
      name: org.name,
      industry: org.industry,
      aggregateScore,
      roleMatchCount,
      topRoleTitle
    });
  }

  orgMatches.sort((a, b) => b.aggregateScore - a.aggregateScore);

  return {
    analysis_id: analysisId,
    pool_id: poolData.pool.id,
    pool_version: poolData.pool.version,
    role_matches: roleMatches,
    organization_matches: orgMatches,
    search_queries: poolData.search_queries || []
  };
}
