/**
 * Job Pool connection: client-safe decoding and presentation helpers for the
 * SIL frontend (docs/architecture/decision-fields/JOB_POOL_CONNECTION.md §2, §5).
 *
 * Everything here is representation of what the Job Pool routes delivered. It
 * re-scores nothing, re-ranks nothing and derives no claim the body does not
 * carry. The three layers of the contract are kept visible: the presentation
 * block of a match body is rendered verbatim as the label (DETERMINISTIC
 * PRESENTATION, NOT A CANONICAL EVALUATION, NOT A DECISION), the canonical
 * state per role is rendered as delivered (TRPREV, TRQREV ids, NOT_EVALUATED
 * reason), and nothing here leads to the HR Decision Looper.
 *
 * PRESENTED != EVALUATED · UPLOADED != SELECTED · RANKED != RECOMMENDED · MISSING != GAP DECISION
 */
import type {
  JobPoolCanonicalMapping,
  JobPoolErrorBody,
  JobPoolMatchPresentation,
  JobPoolRoleMatch,
  JobPoolUploadSummary,
  JobPoolUploadView
} from "./types";

export const JOB_POOL_PRESENTATION_KIND = "DETERMINISTIC_RESONANCE_PRESENTATION";
export const JOB_POOL_PRESENTATION_POLICY_VERSION = "JOB_POOL_PRESENTATION_MATCHING_V1";
export const JOB_POOL_PROVIDER = "CONDYN_JOB_POOL_JSON";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
const isNonEmptyString = (value: unknown): value is string => isString(value) && value.length > 0;
const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString);
const oneOf = <T extends string>(value: unknown, allowed: readonly T[]): value is T => isString(value) && (allowed as readonly string[]).includes(value);

const POOL_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
const NECESSITIES = ["REQUIRED", "PREFERRED", "OPTIONAL", "UNDECLARED"] as const;
const CANONICAL_NECESSITIES = ["REQUIRED", "PREFERRED", "OPTIONAL", "UNKNOWN"] as const;
const MATCH_BASES = ["EXACT", "ALIAS", "COMPOSITE_CONSTITUENT", "TOKEN_CONTAINMENT"] as const;
const ELIGIBILITIES = ["MATCHING_ELIGIBLE_PROPOSAL_ONLY", "MATCHING_INELIGIBLE", "MATCHING_ELIGIBILITY_UNKNOWN"] as const;

export function decodeJobPoolUploadSummary(value: unknown): JobPoolUploadSummary | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.jobPoolUploadId) || !isNonEmptyString(value.poolId) || !isFiniteNumber(value.poolVersion)) return null;
  if (!isString(value.poolName) || !oneOf(value.poolStatus, POOL_STATUSES)) return null;
  if (!isFiniteNumber(value.organizationCount) || !isFiniteNumber(value.roleCount) || !isFiniteNumber(value.requirementCount)) return null;
  if (!isString(value.uploadedByActorRef) || !isString(value.uploadedAt)) return null;
  return {
    jobPoolUploadId: value.jobPoolUploadId,
    poolId: value.poolId,
    poolVersion: value.poolVersion,
    poolName: value.poolName,
    poolStatus: value.poolStatus,
    organizationCount: value.organizationCount,
    roleCount: value.roleCount,
    requirementCount: value.requirementCount,
    uploadedByActorRef: value.uploadedByActorRef,
    uploadedAt: value.uploadedAt
  };
}

function decodeCanonicalMapping(value: unknown): JobPoolCanonicalMapping | null {
  if (!isRecord(value)) return null;
  if (value.mappingState !== "MAPPED" || value.proposalState !== "PROPOSAL_ONLY" || value.authorityState !== "NONE" || value.provider !== JOB_POOL_PROVIDER) return null;
  if (!Array.isArray(value.organizations) || !Array.isArray(value.roles)) return null;
  const organizations: JobPoolCanonicalMapping["organizations"] = [];
  for (const organization of value.organizations) {
    if (!isRecord(organization) || !isNonEmptyString(organization.poolOrganizationId) || !isString(organization.name) || !isNonEmptyString(organization.targetOrganizationEntityId) || !isNonEmptyString(organization.targetOrganizationRevisionId)) return null;
    organizations.push({ poolOrganizationId: organization.poolOrganizationId, name: organization.name, targetOrganizationEntityId: organization.targetOrganizationEntityId, targetOrganizationRevisionId: organization.targetOrganizationRevisionId });
  }
  const roles: JobPoolCanonicalMapping["roles"] = [];
  for (const role of value.roles) {
    if (!isRecord(role)) return null;
    const ids = ["poolRoleId", "poolOrganizationId", "targetSourceRevisionId", "targetRoleEntityId", "targetRoleSourceBindingRevisionId", "targetRoleOrganizationBindingRevisionId", "targetRoleProfileRevisionId", "targetRoleReconstructionBatchRunId", "targetRequirementReconstructionBatchRunId"] as const;
    if (!ids.every(key => isNonEmptyString(role[key])) || !isString(role.title) || !Array.isArray(role.requirements)) return null;
    const requirements: JobPoolCanonicalMapping["roles"][number]["requirements"] = [];
    for (const requirement of role.requirements) {
      if (!isRecord(requirement) || !isNonEmptyString(requirement.poolRequirementId) || !isString(requirement.capabilityName) || !isNonEmptyString(requirement.targetRequirementEntityId) || !isNonEmptyString(requirement.targetRequirementRevisionId)) return null;
      if (!isNonEmptyString(requirement.targetRequirementReconstructionResultId) || !isNonEmptyString(requirement.targetRequirementEntityAdmissionId)) return null;
      if (!oneOf(requirement.matchingEligibility, ELIGIBILITIES) || !oneOf(requirement.necessityState, CANONICAL_NECESSITIES)) return null;
      requirements.push({ poolRequirementId: requirement.poolRequirementId, capabilityName: requirement.capabilityName, targetRequirementEntityId: requirement.targetRequirementEntityId, targetRequirementRevisionId: requirement.targetRequirementRevisionId, targetRequirementReconstructionResultId: requirement.targetRequirementReconstructionResultId, targetRequirementEntityAdmissionId: requirement.targetRequirementEntityAdmissionId, matchingEligibility: requirement.matchingEligibility, necessityState: requirement.necessityState });
    }
    roles.push({
      poolRoleId: role.poolRoleId as string,
      title: role.title,
      poolOrganizationId: role.poolOrganizationId as string,
      targetSourceRevisionId: role.targetSourceRevisionId as string,
      targetRoleEntityId: role.targetRoleEntityId as string,
      targetRoleSourceBindingRevisionId: role.targetRoleSourceBindingRevisionId as string,
      targetRoleOrganizationBindingRevisionId: role.targetRoleOrganizationBindingRevisionId as string,
      targetRoleProfileRevisionId: role.targetRoleProfileRevisionId as string,
      targetRoleReconstructionBatchRunId: role.targetRoleReconstructionBatchRunId as string,
      targetRequirementReconstructionBatchRunId: role.targetRequirementReconstructionBatchRunId as string,
      requirements
    });
  }
  return { mappingState: "MAPPED", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", provider: JOB_POOL_PROVIDER, organizations, roles };
}

export function decodeJobPoolUploadView(value: unknown): JobPoolUploadView | null {
  const summary = decodeJobPoolUploadSummary(value);
  if (summary === null || !isRecord(value)) return null;
  if (!isNonEmptyString(value.canonicalSha256) || !isNonEmptyString(value.rawSha256) || !("pool" in value)) return null;
  const canonicalMapping = decodeCanonicalMapping(value.canonicalMapping);
  if (canonicalMapping === null) return null;
  return { ...summary, canonicalSha256: value.canonicalSha256, rawSha256: value.rawSha256, pool: value.pool, canonicalMapping };
}

function decodeEvidence(value: unknown): JobPoolRoleMatch["matched"][number]["evidence"] | null {
  if (!Array.isArray(value)) return null;
  const quotes: JobPoolRoleMatch["matched"][number]["evidence"] = [];
  for (const quote of value) {
    if (!isRecord(quote) || !isString(quote.docId) || !isString(quote.quote)) return null;
    quotes.push({ docId: quote.docId, quote: quote.quote });
  }
  return quotes;
}

function decodeMatched(value: unknown): JobPoolRoleMatch["matched"][number] | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.poolRequirementId) || !isString(value.capabilityName) || !isString(value.requiredLevel) || !isFiniteNumber(value.weight)) return null;
  if (!oneOf(value.necessity, NECESSITIES) || !oneOf(value.matchBasis, MATCH_BASES)) return null;
  if (!isString(value.matchedCapabilityName) || !isString(value.matchedCapabilityEntityId) || !isFiniteNumber(value.confidence) || !isFiniteNumber(value.contribution)) return null;
  // matchedConstituent is always present: a string for COMPOSITE_CONSTITUENT, null for every other basis.
  if (!(value.matchedConstituent === null || isString(value.matchedConstituent))) return null;
  if ((value.matchBasis === "COMPOSITE_CONSTITUENT") !== (typeof value.matchedConstituent === "string")) return null;
  const evidence = decodeEvidence(value.evidence);
  if (evidence === null) return null;
  return {
    poolRequirementId: value.poolRequirementId,
    capabilityName: value.capabilityName,
    requiredLevel: value.requiredLevel,
    weight: value.weight,
    necessity: value.necessity,
    matchBasis: value.matchBasis,
    matchedCapabilityName: value.matchedCapabilityName,
    matchedCapabilityEntityId: value.matchedCapabilityEntityId,
    matchedConstituent: value.matchedConstituent,
    confidence: value.confidence,
    contribution: value.contribution,
    evidence
  };
}

function decodeRoleMatch(value: unknown): JobPoolRoleMatch | null {
  if (!isRecord(value)) return null;
  if (!isNonEmptyString(value.poolRoleId) || !isString(value.title) || !isString(value.seniority) || !isString(value.domainFocus)) return null;
  if (!isNonEmptyString(value.poolOrganizationId) || !isString(value.organizationName) || !isFiniteNumber(value.resonanceScore)) return null;
  if (!Array.isArray(value.matched) || !Array.isArray(value.weakEvidence) || !Array.isArray(value.missing) || !isRecord(value.canonical)) return null;
  const matched: JobPoolRoleMatch["matched"] = [];
  for (const item of value.matched) { const decoded = decodeMatched(item); if (decoded === null) return null; matched.push(decoded); }
  const weakEvidence: JobPoolRoleMatch["weakEvidence"] = [];
  for (const item of value.weakEvidence) {
    const decoded = decodeMatched(item);
    if (decoded === null || !isRecord(item) || !isString(item.reason)) return null;
    weakEvidence.push({ ...decoded, reason: item.reason });
  }
  const missing: JobPoolRoleMatch["missing"] = [];
  for (const item of value.missing) {
    if (!isRecord(item) || !isNonEmptyString(item.poolRequirementId) || !isString(item.capabilityName) || !isString(item.requiredLevel) || !isFiniteNumber(item.weight) || !oneOf(item.necessity, NECESSITIES)) return null;
    if (!(item.evidenceHint === null || isString(item.evidenceHint))) return null;
    missing.push({ poolRequirementId: item.poolRequirementId, capabilityName: item.capabilityName, requiredLevel: item.requiredLevel, weight: item.weight, necessity: item.necessity, evidenceHint: item.evidenceHint });
  }
  const canonical = value.canonical;
  if (!isNonEmptyString(canonical.targetRoleProfileRevisionId) || !isStringArray(canonical.targetRequirementRevisionIds)) return null;
  if (canonical.capabilityRequirementRelationState !== "NOT_EVALUATED" || canonical.reason !== "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT") return null;
  return {
    poolRoleId: value.poolRoleId,
    title: value.title,
    seniority: value.seniority,
    domainFocus: value.domainFocus,
    poolOrganizationId: value.poolOrganizationId,
    organizationName: value.organizationName,
    resonanceScore: value.resonanceScore,
    matched,
    weakEvidence,
    missing,
    canonical: {
      targetRoleProfileRevisionId: canonical.targetRoleProfileRevisionId,
      targetRequirementRevisionIds: canonical.targetRequirementRevisionIds,
      capabilityRequirementRelationState: "NOT_EVALUATED",
      reason: "VERIFIED_CAPABILITY_SNAPSHOT_ABSENT"
    }
  };
}

/**
 * The presentation block must carry the exact non-claims of the contract; a
 * body that claims anything else (a canonical evaluation, a decision, another
 * kind) is undecodable for this frontend rather than rendered with softened labels.
 */
export function decodeJobPoolMatchPresentation(value: unknown): JobPoolMatchPresentation | null {
  if (!isRecord(value) || !isRecord(value.presentation)) return null;
  const block = value.presentation;
  if (block.kind !== JOB_POOL_PRESENTATION_KIND || block.policyVersion !== JOB_POOL_PRESENTATION_POLICY_VERSION) return null;
  if (block.authorityState !== "NONE" || block.canonicalEvaluation !== false || block.decision !== false || !isFiniteNumber(block.weakEvidenceThreshold)) return null;
  if (!isNonEmptyString(value.analysisId) || !isNonEmptyString(value.jobPoolUploadId) || !isNonEmptyString(value.poolId) || !isFiniteNumber(value.poolVersion) || !isFiniteNumber(value.candidateCapabilityCount)) return null;
  if (!Array.isArray(value.roleMatches) || !Array.isArray(value.organizationMatches)) return null;
  const roleMatches: JobPoolRoleMatch[] = [];
  for (const role of value.roleMatches) { const decoded = decodeRoleMatch(role); if (decoded === null) return null; roleMatches.push(decoded); }
  const organizationMatches: JobPoolMatchPresentation["organizationMatches"] = [];
  for (const organization of value.organizationMatches) {
    if (!isRecord(organization) || !isNonEmptyString(organization.poolOrganizationId) || !isString(organization.name) || !isString(organization.industry) || !isFiniteNumber(organization.aggregateScore) || !isFiniteNumber(organization.roleCount)) return null;
    if (!(organization.topRoleTitle === null || isString(organization.topRoleTitle))) return null;
    organizationMatches.push({ poolOrganizationId: organization.poolOrganizationId, name: organization.name, industry: organization.industry, aggregateScore: organization.aggregateScore, roleCount: organization.roleCount, topRoleTitle: organization.topRoleTitle });
  }
  return {
    presentation: { kind: JOB_POOL_PRESENTATION_KIND, policyVersion: JOB_POOL_PRESENTATION_POLICY_VERSION, authorityState: "NONE", canonicalEvaluation: false, decision: false, weakEvidenceThreshold: block.weakEvidenceThreshold },
    analysisId: value.analysisId,
    jobPoolUploadId: value.jobPoolUploadId,
    poolId: value.poolId,
    poolVersion: value.poolVersion,
    candidateCapabilityCount: value.candidateCapabilityCount,
    roleMatches,
    organizationMatches
  };
}

export function decodeJobPoolErrorBody(value: unknown): JobPoolErrorBody["error"] | null {
  if (!isRecord(value) || !isRecord(value.error) || !isNonEmptyString(value.error.code) || !isString(value.error.message)) return null;
  const issues: Array<{ path: string; message: string }> = [];
  if (value.error.issues !== undefined) {
    if (!Array.isArray(value.error.issues)) return null;
    for (const issue of value.error.issues) {
      if (!isRecord(issue) || !isString(issue.path) || !isString(issue.message)) return null;
      issues.push({ path: issue.path, message: issue.message });
    }
  }
  return value.error.issues === undefined ? { code: value.error.code, message: value.error.message } : { code: value.error.code, message: value.error.message, issues };
}

/** The three visible layer labels, each derived from one literal field of the delivered presentation block. */
export type JobPoolPresentationLabel = "DETERMINISTIC_PRESENTATION" | "NOT_A_CANONICAL_EVALUATION" | "NOT_A_DECISION";

export function presentationLabels(presentation: JobPoolMatchPresentation["presentation"]): readonly JobPoolPresentationLabel[] {
  const labels: JobPoolPresentationLabel[] = [];
  if (presentation.kind === JOB_POOL_PRESENTATION_KIND) labels.push("DETERMINISTIC_PRESENTATION");
  if (presentation.canonicalEvaluation === false) labels.push("NOT_A_CANONICAL_EVALUATION");
  if (presentation.decision === false) labels.push("NOT_A_DECISION");
  return labels;
}

/**
 * Role matches are rendered in the delivered order; the frontend never sorts.
 * The ranking descriptor records whether that order is non-increasing by
 * resonanceScore so that a non-monotone delivery is visible, not hidden.
 */
export type JobPoolRankingCharacter = "MONOTONE_BY_RESONANCE" | "DELIVERED_ORDER_NOT_MONOTONE" | "EMPTY";

export function describeRanking(roleMatches: readonly JobPoolRoleMatch[]): JobPoolRankingCharacter {
  if (roleMatches.length === 0) return "EMPTY";
  for (let index = 1; index < roleMatches.length; index += 1) {
    if (roleMatches[index].resonanceScore > roleMatches[index - 1].resonanceScore) return "DELIVERED_ORDER_NOT_MONOTONE";
  }
  return "MONOTONE_BY_RESONANCE";
}

export interface JobPoolRoleRequirementCounts {
  matched: number;
  weakEvidence: number;
  missing: number;
  total: number;
  /** TRQREV ids delivered in the canonical state; compared against the three presentation sets. */
  canonicalRequirementRevisions: number;
}

export function requirementCounts(role: JobPoolRoleMatch): JobPoolRoleRequirementCounts {
  const matched = role.matched.length;
  const weakEvidence = role.weakEvidence.length;
  const missing = role.missing.length;
  return { matched, weakEvidence, missing, total: matched + weakEvidence + missing, canonicalRequirementRevisions: role.canonical.targetRequirementRevisionIds.length };
}

/** Exact selection: the id must be one of the listed uploads; a stale URL id that is not listed is reported, not silently dropped. */
export type JobPoolSelectionState =
  | { kind: "NONE" }
  | { kind: "LISTED"; jobPoolUploadId: string; summary: JobPoolUploadSummary }
  | { kind: "NOT_LISTED"; jobPoolUploadId: string };

export function describeSelection(jobPoolUploadId: string | null, jobPools: readonly JobPoolUploadSummary[]): JobPoolSelectionState {
  if (jobPoolUploadId === null || jobPoolUploadId.length === 0) return { kind: "NONE" };
  const summary = jobPools.find(pool => pool.jobPoolUploadId === jobPoolUploadId);
  return summary === undefined ? { kind: "NOT_LISTED", jobPoolUploadId } : { kind: "LISTED", jobPoolUploadId, summary };
}

/** Which exact analysis feeds the match read, and where its id came from. Never a "latest analysis". */
export type JobPoolAnalysisSource =
  | { kind: "NONE" }
  | { kind: "JOB_RESULT"; analysisId: string }
  | { kind: "URL"; analysisId: string };

export function describeAnalysisSource(jobResultAnalysisId: string | null | undefined, urlAnalysisId: string | null | undefined): JobPoolAnalysisSource {
  if (typeof jobResultAnalysisId === "string" && jobResultAnalysisId.length > 0) return { kind: "JOB_RESULT", analysisId: jobResultAnalysisId };
  if (typeof urlAnalysisId === "string" && urlAnalysisId.length > 0) return { kind: "URL", analysisId: urlAnalysisId };
  return { kind: "NONE" };
}
