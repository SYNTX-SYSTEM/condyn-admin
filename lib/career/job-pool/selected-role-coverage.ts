import type { CapabilityProposalProjection } from "../capability-core";
import type { AnalysisScopeBinding } from "../job-scope/analysis-scope";
import type { ResolvedJobScope } from "../job-scope/scope";
import { findSweepCoverage, type SweepProposal } from "./presentation-matching";
import type { JobPoolCanonicalRequirementMapping, JobPoolSweepProposalCoverage } from "./types";

/**
 * B2 (owner decision 2026-10-15): deterministic, unconfirmed name coverage for exactly the selected role. The operand
 * is the analysis's Capability Proposal projection (Convergence level, source-verified evidence); the legacy analysis,
 * other roles of the pool and the demo pool never enter. Coverage uses the existing deterministic match bases (EXACT,
 * ALIAS, COMPOSITE_CONSTITUENT, TOKEN_CONTAINMENT — the last one is a weak heuristic). Nothing is scored and no
 * canonical Capability-Requirement Relation is evaluated: the authority block is fixed.
 */
export const SELECTED_ROLE_COVERAGE_VERSION = "SELECTED_ROLE_COVERAGE_V1" as const;

export const SELECTED_ROLE_COVERAGE_AUTHORITY = Object.freeze({
  comparisonBasis: "CAPABILITY_PROPOSAL_NAME_COVERAGE",
  operand: "CAPABILITY_PROPOSAL_PROJECTION",
  scored: false,
  authorityState: "NONE",
  capabilityRequirementRelationState: "NOT_EVALUATED",
  reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT"
} as const);

export interface SelectedRoleRequirementCoverage {
  poolRequirementId: string;
  capabilityName: string;
  aliases: string[];
  domain: string;
  requiredLevel: string;
  weight: number;
  necessityState: JobPoolCanonicalRequirementMapping["necessityState"];
  requirementType: string;
  matchingEligibility: JobPoolCanonicalRequirementMapping["matchingEligibility"];
  targetRequirementRevisionId: string;
  coverage: { state: "COVERED"; proposal: JobPoolSweepProposalCoverage } | { state: "NOT_COVERED"; proposal: null };
}

export interface SelectedRoleCoverage {
  comparisonVersion: typeof SELECTED_ROLE_COVERAGE_VERSION;
  binding: AnalysisScopeBinding;
  role: { poolRoleId: string; title: string; poolOrganizationId: string; organizationName: string };
  authority: typeof SELECTED_ROLE_COVERAGE_AUTHORITY;
  requirements: SelectedRoleRequirementCoverage[];
  proposals: Array<{ id: string; name: string; scope: "ATOMIC" | "COMPOSITE"; coversPoolRequirementIds: string[] }>;
  counts: { requirements: number; covered: number; notCovered: number; proposals: number };
}

export function buildSelectedRoleCoverage(binding: AnalysisScopeBinding, scope: ResolvedJobScope, projection: CapabilityProposalProjection): SelectedRoleCoverage {
  const proposals: SweepProposal[] = projection.capabilities.map(item => ({ id: item.id, name: item.name, evidence: item.evidence.map(evidence => ({ sourceDocumentId: evidence.sourceDocumentId, exactQuote: evidence.exactQuote })) }));
  const requirements = scope.requirements.map(({ poolRequirement, mapping }): SelectedRoleRequirementCoverage => {
    const proposal = proposals.length ? findSweepCoverage(poolRequirement, proposals) : null;
    return {
      poolRequirementId: poolRequirement.id, capabilityName: poolRequirement.capability_name, aliases: [...(poolRequirement.aliases ?? [])],
      domain: poolRequirement.domain, requiredLevel: poolRequirement.required_level, weight: poolRequirement.weight,
      necessityState: mapping.necessityState, requirementType: poolRequirement.requirement_type ?? "CAPABILITY",
      matchingEligibility: mapping.matchingEligibility, targetRequirementRevisionId: mapping.targetRequirementRevisionId,
      coverage: proposal ? { state: "COVERED", proposal } : { state: "NOT_COVERED", proposal: null }
    };
  });
  const covered = requirements.filter(item => item.coverage.state === "COVERED");
  return {
    comparisonVersion: SELECTED_ROLE_COVERAGE_VERSION,
    binding: { ...binding },
    role: { poolRoleId: scope.role.id, title: scope.role.title, poolOrganizationId: scope.organization.id, organizationName: scope.organization.name },
    authority: SELECTED_ROLE_COVERAGE_AUTHORITY,
    requirements,
    proposals: projection.capabilities.map(item => ({ id: item.id, name: item.name, scope: item.scope, coversPoolRequirementIds: covered.filter(requirement => requirement.coverage.proposal?.capabilityProposalId === item.id).map(requirement => requirement.poolRequirementId) })),
    counts: { requirements: requirements.length, covered: covered.length, notCovered: requirements.length - covered.length, proposals: projection.capabilities.length }
  };
}
