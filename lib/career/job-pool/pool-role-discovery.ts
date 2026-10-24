import type { CapabilityProposalProjection } from "../capability-core";
import type { CompanyPoolData, PoolCapabilityRequirement } from "../matching/pool";
import { capabilityTokens, findSweepCoverage, normalizeCapabilityName, type SweepProposal } from "./presentation-matching";
import type { JobPoolCanonicalMapping, JobPoolCanonicalRequirementMapping, JobPoolMatchBasis } from "./types";

/**
 * POOL_ROLE_DISCOVERY_V1 (owner „OWNER_DECISION_ROLE_DISCOVERY“ D-RD-1 = B, D-RD-4 = A, 2026-10-24).
 *
 * The capability proposals of one PERSON analysis — derived from the source alone, never scoped to a job — are related to every
 * role of the job pool uploads the caller released explicitly. Nothing else is compared: no stored pool that was not named, no
 * legacy analysis, no demo pool. The relation is LEXICAL only (the B2 name rules of `findSweepCoverage`); it is not a semantic
 * relation, not a score, not a ranking and not a decision — the authority block says so, and every requirement carries
 * `semantic: NOT_EXECUTED` until a semantic relation engine exists (D-RD-2, separate contract). Computed on read, deterministic.
 */
export const POOL_ROLE_DISCOVERY_VERSION = "POOL_ROLE_DISCOVERY_V1" as const;
/** At most this many pool uploads per request: the release is explicit and bounded. */
export const POOL_ROLE_DISCOVERY_MAX_POOLS = 10;

export const POOL_ROLE_DISCOVERY_AUTHORITY = Object.freeze({
  relationBasis: "LEXICAL_NAME_COVERAGE",
  operand: "PERSON_CAPABILITY_PROPOSAL_PROJECTION",
  semanticRelationState: "NOT_EXECUTED",
  scored: false,
  ranking: false,
  authorityState: "NONE",
  decision: false
} as const);

/** A lexical basis is a candidate for a relation, never a relation: names are compared, not meanings. */
export type LexicalBasis = "NAME_EXACT" | "NAME_ALIAS" | "NAME_COMPOSITE_CONSTITUENT" | "WEAK_TOKEN_CONTAINMENT" | "NONE";
const BASIS: Record<JobPoolMatchBasis, Exclude<LexicalBasis, "NONE">> = {
  EXACT: "NAME_EXACT", ALIAS: "NAME_ALIAS", COMPOSITE_CONSTITUENT: "NAME_COMPOSITE_CONSTITUENT", TOKEN_CONTAINMENT: "WEAK_TOKEN_CONTAINMENT"
};

/** Lexical status of a role (D-RD-4 groups, in this order). Counts are descriptive; nothing is sorted by them. */
export const ROLE_LEXICAL_STATUSES = ["ALL_REQUIREMENTS_NAME_RELATED", "PARTIAL_NAME_RELATED", "WEAK_LEXICAL_ONLY", "NO_LEXICAL_RELATION", "NO_REQUIREMENTS"] as const;
export type RoleLexicalStatus = typeof ROLE_LEXICAL_STATUSES[number];

export interface DiscoveryRequirement {
  /** Requirement ids repeat across uploads: the key is (upload, role, requirement). */
  key: { jobPoolUploadId: string; poolRoleId: string; poolRequirementId: string };
  requirementText: string;
  aliases: string[];
  requiredLevel: string;
  necessity: JobPoolCanonicalRequirementMapping["necessityState"];
  requirementType: string;
  matchingEligibility: JobPoolCanonicalRequirementMapping["matchingEligibility"] | null;
  targetRequirementRevisionId: string | null;
  lexical:
    | { basis: "NONE"; proposalId: null; proposalName: null; matchedConstituent: null; evidence: []; quoteNamesRequirement: null }
    | { basis: Exclude<LexicalBasis, "NONE">; proposalId: string; proposalName: string; matchedConstituent: string | null;
        evidence: Array<{ sourceDocumentId: string; exactQuote: string }>;
        /** EVIDENCE LIMITATION: whether a quote itself names the requirement (or an alias); false means the name relation rests on
         *  the proposal's name only (PINK §3.63). */
        quoteNamesRequirement: boolean };
  semantic: { state: "NOT_EXECUTED" };
}

export interface DiscoveryRole {
  key: { jobPoolUploadId: string; poolRoleId: string };
  title: string;
  poolOrganizationId: string;
  organizationName: string;
  status: RoleLexicalStatus;
  semantic: { state: "NOT_EXECUTED" };
  counts: { requirements: number; nameRelated: number; weakLexicalOnly: number; withoutLexicalRelation: number; required: number; requiredWithoutLexicalRelation: number };
  requirements: DiscoveryRequirement[];
}

export interface DiscoveryPoolInput {
  jobPoolUploadId: string;
  poolId: string;
  poolVersion: number;
  poolName: string;
  poolStatus: string;
  canonicalSha256: string;
  pool: CompanyPoolData;
  canonicalMapping: JobPoolCanonicalMapping;
}

export interface PoolRoleDiscovery {
  discoveryVersion: typeof POOL_ROLE_DISCOVERY_VERSION;
  authority: typeof POOL_ROLE_DISCOVERY_AUTHORITY;
  analysis: { analysisId: string; jobId: string; mode: "PERSON"; discoveryRunId: string };
  /** The released uploads, exactly as named by the caller (deduplicated input is refused before this point). */
  pools: Array<{ jobPoolUploadId: string; poolId: string; poolVersion: number; poolName: string; canonicalSha256: string; roleCount: number }>;
  /** The operand, unchanged: every proposal with its own source-verified evidence (inverse trace: requirement → proposal → quote → source). */
  proposals: Array<{ id: string; name: string; scope: "ATOMIC" | "COMPOSITE"; evidence: Array<{ evidenceId: string; sourceDocumentId: string; exactQuote: string }> }>;
  /** Deterministic order: pool name, upload id, organisation name, organisation id, role title, role id. */
  roles: DiscoveryRole[];
  /** D-RD-4: role keys grouped by lexical status in the fixed status order; empty groups are listed too. */
  groups: Array<{ status: RoleLexicalStatus; roles: Array<{ jobPoolUploadId: string; poolRoleId: string }> }>;
  counts: { pools: number; roles: number; requirements: number; proposals: number };
}

const byText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Whether a quote names the requirement: its normalised name or an alias inside the normalised quote, or all its name tokens. */
export function quoteNamesRequirement(quote: string, requirement: Pick<PoolCapabilityRequirement, "capability_name" | "aliases">): boolean {
  const normalized = normalizeCapabilityName(quote);
  const tokens = new Set(capabilityTokens(quote));
  return [requirement.capability_name, ...(requirement.aliases ?? [])].some(name => {
    const n = normalizeCapabilityName(name);
    const t = capabilityTokens(name);
    return (n.length > 0 && normalized.includes(n)) || (t.length > 0 && t.every(token => tokens.has(token)));
  });
}

export function buildPoolRoleDiscovery(input: {
  analysis: { analysisId: string; jobId: string; discoveryRunId: string };
  projection: Pick<CapabilityProposalProjection, "capabilities">;
  pools: DiscoveryPoolInput[];
}): PoolRoleDiscovery {
  const proposals: SweepProposal[] = input.projection.capabilities.map(item => ({ id: item.id, name: item.name, evidence: item.evidence.map(e => ({ sourceDocumentId: e.sourceDocumentId, exactQuote: e.exactQuote })) }));
  const roles: DiscoveryRole[] = [];
  const pools = [...input.pools].sort((a, b) => byText(a.poolName, b.poolName) || byText(a.jobPoolUploadId, b.jobPoolUploadId));
  for (const upload of pools) {
    const mappingByRequirement = new Map<string, JobPoolCanonicalRequirementMapping>();
    for (const role of upload.canonicalMapping.roles) for (const requirement of role.requirements) mappingByRequirement.set(`${role.poolRoleId}\u0000${requirement.poolRequirementId}`, requirement);
    const organizations = new Map(upload.pool.organizations.map(o => [o.id, o]));
    const poolRoles = [...upload.pool.roles].sort((a, b) => {
      const oa = organizations.get(a.organization_id)?.name ?? a.organization_id, ob = organizations.get(b.organization_id)?.name ?? b.organization_id;
      return byText(oa, ob) || byText(a.organization_id, b.organization_id) || byText(a.title, b.title) || byText(a.id, b.id);
    });
    for (const role of poolRoles) {
      const requirements = upload.pool.requirements.filter(r => r.role_id === role.id).map((requirement): DiscoveryRequirement => {
        const mapping = mappingByRequirement.get(`${role.id}\u0000${requirement.id}`) ?? null;
        const coverage = proposals.length ? findSweepCoverage(requirement, proposals) : null;
        const evidence = coverage ? coverage.evidence.map(e => ({ sourceDocumentId: e.docId, exactQuote: e.quote })) : [];
        return {
          key: { jobPoolUploadId: upload.jobPoolUploadId, poolRoleId: role.id, poolRequirementId: requirement.id },
          requirementText: requirement.capability_name, aliases: [...(requirement.aliases ?? [])], requiredLevel: requirement.required_level,
          necessity: mapping?.necessityState ?? (requirement.necessity ?? "UNKNOWN"), requirementType: requirement.requirement_type ?? "CAPABILITY",
          matchingEligibility: mapping?.matchingEligibility ?? null, targetRequirementRevisionId: mapping?.targetRequirementRevisionId ?? null,
          lexical: coverage === null
            ? { basis: "NONE", proposalId: null, proposalName: null, matchedConstituent: null, evidence: [], quoteNamesRequirement: null }
            : { basis: BASIS[coverage.matchBasis], proposalId: coverage.capabilityProposalId, proposalName: coverage.name, matchedConstituent: coverage.matchedConstituent,
                evidence, quoteNamesRequirement: evidence.some(e => quoteNamesRequirement(e.exactQuote, requirement)) },
          semantic: { state: "NOT_EXECUTED" }
        };
      });
      const nameRelated = requirements.filter(r => r.lexical.basis !== "NONE" && r.lexical.basis !== "WEAK_TOKEN_CONTAINMENT").length;
      const weak = requirements.filter(r => r.lexical.basis === "WEAK_TOKEN_CONTAINMENT").length;
      const required = requirements.filter(r => r.necessity === "REQUIRED");
      const status: RoleLexicalStatus = requirements.length === 0 ? "NO_REQUIREMENTS"
        : nameRelated === requirements.length ? "ALL_REQUIREMENTS_NAME_RELATED"
        : nameRelated > 0 ? "PARTIAL_NAME_RELATED"
        : weak > 0 ? "WEAK_LEXICAL_ONLY" : "NO_LEXICAL_RELATION";
      roles.push({
        key: { jobPoolUploadId: upload.jobPoolUploadId, poolRoleId: role.id }, title: role.title, poolOrganizationId: role.organization_id,
        organizationName: organizations.get(role.organization_id)?.name ?? role.organization_id, status, semantic: { state: "NOT_EXECUTED" },
        counts: { requirements: requirements.length, nameRelated, weakLexicalOnly: weak, withoutLexicalRelation: requirements.length - nameRelated - weak, required: required.length, requiredWithoutLexicalRelation: required.filter(r => r.lexical.basis === "NONE").length },
        requirements
      });
    }
  }
  return {
    discoveryVersion: POOL_ROLE_DISCOVERY_VERSION,
    authority: POOL_ROLE_DISCOVERY_AUTHORITY,
    analysis: { analysisId: input.analysis.analysisId, jobId: input.analysis.jobId, mode: "PERSON", discoveryRunId: input.analysis.discoveryRunId },
    pools: pools.map(p => ({ jobPoolUploadId: p.jobPoolUploadId, poolId: p.poolId, poolVersion: p.poolVersion, poolName: p.poolName, canonicalSha256: p.canonicalSha256, roleCount: p.pool.roles.length })),
    proposals: input.projection.capabilities.map(item => ({ id: item.id, name: item.name, scope: item.scope, evidence: item.evidence.map(e => ({ evidenceId: e.evidenceId, sourceDocumentId: e.sourceDocumentId, exactQuote: e.exactQuote })) })),
    roles,
    groups: ROLE_LEXICAL_STATUSES.map(status => ({ status, roles: roles.filter(r => r.status === status).map(r => ({ ...r.key })) })),
    counts: { pools: pools.length, roles: roles.length, requirements: roles.reduce((n, r) => n + r.counts.requirements, 0), proposals: proposals.length }
  };
}
