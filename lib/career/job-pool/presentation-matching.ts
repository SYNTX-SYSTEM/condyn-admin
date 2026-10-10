import type { CompanyPoolData, PoolCapabilityRequirement } from "../matching/pool";
import { extractAnalysisCapabilities, type AnalysisCapabilityItem } from "../matching/capability-extraction";
import { JobPoolError } from "./errors";
import type {
  JobPoolCanonicalMapping, JobPoolMatchBasis, JobPoolMatchedRequirement, JobPoolMatchPresentation, JobPoolMissingRequirement,
  JobPoolOrganizationMatch, JobPoolRoleMatch, JobPoolWeakRequirement
} from "./types";

/**
 * Presentation matching policy JOB_POOL_PRESENTATION_MATCHING_V1.
 *
 * - CP-I1: only ACTIVE pools are matched.
 * - CP-I2: deterministic arithmetic only, no model and no embeddings; scores normalized to [0, 1].
 * - CP-I3: every role lists matched, weak-evidence and missing requirements explicitly.
 * - CP-I4: score = Σ contribution / Σ weight, so a heavier requirement moves the score more.
 * - Step 23: a match with confidence below the threshold is weak evidence and contributes weight × confidence × 0.5.
 * - Match bases, in priority order: EXACT (normalized name), ALIAS (normalized declared alias), TOKEN_CONTAINMENT
 *   (every token of the requirement name or an alias occurs in the capability name). TOKEN_CONTAINMENT is always
 *   reported as weak evidence because it is not a name identity.
 *
 * The result has authority NONE, is computed on read, is not canonical evaluation and is not a decision.
 */
export const JOB_POOL_PRESENTATION_POLICY_VERSION = "JOB_POOL_PRESENTATION_MATCHING_V1" as const;
export const WEAK_EVIDENCE_THRESHOLD = 0.7;
const STOP_TOKENS = new Set(["and", "or", "of", "for", "the", "a", "an", "in", "with", "to"]);

export const normalizeCapabilityName = (value: string): string =>
  value.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}+#]/gu, "");

export const capabilityTokens = (value: string): string[] =>
  value.normalize("NFKC").toLowerCase().split(/[^\p{L}\p{N}+#]+/u).filter(token => token.length > 0 && !STOP_TOKENS.has(token));

const round4 = (value: number) => Number(value.toFixed(4));
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

interface CandidateMatch { basis: JobPoolMatchBasis; capability: AnalysisCapabilityItem }
const BASIS_RANK: Record<JobPoolMatchBasis, number> = { EXACT: 0, ALIAS: 1, TOKEN_CONTAINMENT: 2 };

export function findCandidateMatch(requirement: PoolCapabilityRequirement, capabilities: AnalysisCapabilityItem[]): CandidateMatch | null {
  const requirementName = normalizeCapabilityName(requirement.capability_name);
  const aliases = (requirement.aliases ?? []).map(normalizeCapabilityName).filter(alias => alias.length > 0);
  const tokenSets = [requirement.capability_name, ...(requirement.aliases ?? [])].map(capabilityTokens).filter(tokens => tokens.length > 0);
  const found: CandidateMatch[] = [];
  for (const capability of capabilities) {
    const name = normalizeCapabilityName(capability.name);
    if (name.length === 0) continue;
    if (name === requirementName) { found.push({ basis: "EXACT", capability }); continue; }
    if (aliases.includes(name)) { found.push({ basis: "ALIAS", capability }); continue; }
    const tokens = new Set(capabilityTokens(capability.name));
    if (tokenSets.some(set => set.every(token => tokens.has(token)))) found.push({ basis: "TOKEN_CONTAINMENT", capability });
  }
  found.sort((a, b) =>
    BASIS_RANK[a.basis] - BASIS_RANK[b.basis] ||
    b.capability.confidence - a.capability.confidence ||
    a.capability.entityId.localeCompare(b.capability.entityId));
  return found[0] ?? null;
}

const necessityOf = (requirement: PoolCapabilityRequirement) => requirement.necessity ?? "UNDECLARED";

export function matchAnalysisAgainstJobPool(input: {
  analysis: unknown;
  analysisId: string;
  jobPoolUploadId: string;
  pool: CompanyPoolData;
  canonicalMapping: JobPoolCanonicalMapping;
}): JobPoolMatchPresentation {
  const { pool } = input;
  if (pool.pool.status !== "ACTIVE") {
    throw new JobPoolError("ERR_INACTIVE_COMPANY_POOL", 409, `The pool status is ${pool.pool.status}; matching requires ACTIVE (CP-I1).`);
  }
  const capabilities = extractAnalysisCapabilities(input.analysis);
  const canonicalByRole = new Map(input.canonicalMapping.roles.map(role => [role.poolRoleId, role]));

  const roleMatches: JobPoolRoleMatch[] = pool.roles.map(role => {
    const organization = pool.organizations.find(item => item.id === role.organization_id);
    const matched: JobPoolMatchedRequirement[] = [];
    const weakEvidence: JobPoolWeakRequirement[] = [];
    const missing: JobPoolMissingRequirement[] = [];
    let totalWeight = 0;
    let earned = 0;
    for (const requirement of pool.requirements.filter(item => item.role_id === role.id)) {
      totalWeight += requirement.weight;
      const match = findCandidateMatch(requirement, capabilities);
      if (match === null) {
        missing.push({
          poolRequirementId: requirement.id, capabilityName: requirement.capability_name, requiredLevel: requirement.required_level,
          weight: requirement.weight, necessity: necessityOf(requirement), evidenceHint: requirement.evidence_hint ?? null
        });
        continue;
      }
      const confidence = clamp01(match.capability.confidence);
      const weak = match.basis === "TOKEN_CONTAINMENT" || confidence < WEAK_EVIDENCE_THRESHOLD;
      const contribution = round4(weak ? requirement.weight * confidence * 0.5 : requirement.weight * confidence);
      earned += contribution;
      const base: JobPoolMatchedRequirement = {
        poolRequirementId: requirement.id, capabilityName: requirement.capability_name, requiredLevel: requirement.required_level,
        weight: requirement.weight, necessity: necessityOf(requirement), matchBasis: match.basis,
        matchedCapabilityName: match.capability.name, matchedCapabilityEntityId: match.capability.entityId,
        confidence, contribution, evidence: match.capability.evidence.slice(0, 3)
      };
      if (!weak) { matched.push(base); continue; }
      const reasons: string[] = [];
      if (match.basis === "TOKEN_CONTAINMENT") reasons.push(`matched by token containment ("${match.capability.name}"), not by name or declared alias`);
      if (confidence < WEAK_EVIDENCE_THRESHOLD) reasons.push(`analysis confidence ${confidence.toFixed(2)} is below ${WEAK_EVIDENCE_THRESHOLD.toFixed(2)}`);
      weakEvidence.push({ ...base, reason: reasons.join("; ") });
    }
    const canonical = canonicalByRole.get(role.id);
    if (!canonical) throw new Error("ERR_JOB_POOL_CANONICAL_MAPPING_ROLE_MISSING");
    return {
      poolRoleId: role.id,
      title: role.title,
      seniority: role.seniority,
      domainFocus: role.domain_focus,
      poolOrganizationId: role.organization_id,
      organizationName: organization?.name ?? role.organization_id,
      resonanceScore: totalWeight > 0 ? clamp01(round4(earned / totalWeight)) : 0,
      matched,
      weakEvidence,
      missing,
      canonical: {
        targetRoleProfileRevisionId: canonical.targetRoleProfileRevisionId,
        targetRequirementRevisionIds: canonical.requirements.map(item => item.targetRequirementRevisionId),
        capabilityRequirementRelationState: "NOT_EVALUATED",
        reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT"
      }
    };
  });
  roleMatches.sort((a, b) => b.resonanceScore - a.resonanceScore || a.poolRoleId.localeCompare(b.poolRoleId));

  const organizationMatches: JobPoolOrganizationMatch[] = pool.organizations.map(organization => {
    const roles = roleMatches.filter(role => role.poolOrganizationId === organization.id);
    return {
      poolOrganizationId: organization.id,
      name: organization.name,
      industry: organization.industry,
      aggregateScore: roles.length > 0 ? roles[0].resonanceScore : 0,
      roleCount: roles.length,
      topRoleTitle: roles[0]?.title ?? null
    };
  });
  organizationMatches.sort((a, b) => b.aggregateScore - a.aggregateScore || a.poolOrganizationId.localeCompare(b.poolOrganizationId));

  return {
    presentation: {
      kind: "DETERMINISTIC_RESONANCE_PRESENTATION",
      policyVersion: JOB_POOL_PRESENTATION_POLICY_VERSION,
      authorityState: "NONE",
      canonicalEvaluation: false,
      decision: false,
      weakEvidenceThreshold: WEAK_EVIDENCE_THRESHOLD
    },
    analysisId: input.analysisId,
    jobPoolUploadId: input.jobPoolUploadId,
    poolId: pool.pool.id,
    poolVersion: pool.pool.version,
    candidateCapabilityCount: capabilities.length,
    roleMatches,
    organizationMatches
  };
}
