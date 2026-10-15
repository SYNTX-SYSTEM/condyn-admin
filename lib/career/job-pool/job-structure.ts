import type { TargetRoleProfileRevision } from "../target/role/profile/types";
import type { NecessityState, RequiredLevelState, TargetRequirementRevision } from "../target/role/requirement/types";
import { JobScopeRequiredError } from "../job-scope/errors";
import type { JobScopeResolver, JobScopeSelection, ResolvedJobScope } from "../job-scope/scope";
import { normalizeCapabilityName } from "./presentation-matching";

/**
 * JOB ONLY (owner GO 2026-10-15, three investigation modes), stage 1: the selected job itself — organization, role,
 * requirements and structural findings — independent of any person. Deterministic: it reads the pool upload and the
 * target revisions persisted when the pool was uploaded (deterministic CONDYN_JOB_POOL_JSON providers) and calls no
 * model. Evidence is only the job's own pool source lines; nothing about a candidate is read. Findings are
 * structural facts of the declared job (absent, unresolved or colliding declarations), never an assessment.
 */
export const JOB_STRUCTURE_VERSION = "JOB_STRUCTURE_V1" as const;

export type JobStructureErrorCode = "ERR_JOB_STRUCTURE_SELECTION_REQUIRED" | "ERR_JOB_STRUCTURE_UNAVAILABLE" | "ERR_JOB_STRUCTURE_LINEAGE_INVALID";
export class JobStructureError extends Error {
  constructor(readonly code: JobStructureErrorCode, readonly status: 400 | 409) { super(code); }
}

export type JobStructureFindingCode =
  | "ROLE_DESCRIPTION_MISSING" | "ROLE_SENIORITY_UNDECLARED" | "ROLE_DOMAIN_FOCUS_UNDECLARED" | "ROLE_RESPONSIBILITY_NOT_DECLARED"
  | "ROLE_WITHOUT_REQUIRED_REQUIREMENT"
  | "REQUIREMENT_NECESSITY_UNDECLARED" | "REQUIREMENT_LEVEL_UNRESOLVED" | "REQUIREMENT_MATCHING_INELIGIBLE" | "REQUIREMENT_MATCHING_ELIGIBILITY_UNKNOWN"
  | "REQUIREMENT_TYPE_UNDECLARED" | "REQUIREMENT_ZERO_WEIGHT" | "REQUIREMENT_DOMAIN_UNDECLARED" | "REQUIREMENT_NAME_COLLISION";

export interface JobStructureFinding {
  code: JobStructureFindingCode;
  subject: { kind: "ROLE" | "REQUIREMENT"; id: string };
  /** The pool field the finding is about. */
  field: string;
  /** Exact pool source lines that show the finding; empty where the finding is an absence. */
  evidence: string[];
  /** Other requirements involved (collisions only). */
  relatedRequirementIds: string[];
}

export interface JobStructure {
  structureVersion: typeof JOB_STRUCTURE_VERSION;
  investigationMode: "JOB";
  binding: { jobPoolUploadId: string; poolRoleId: string; poolId: string; poolVersion: number; poolCanonicalSha256: string; targetRoleProfileRevisionId: string };
  organization: { poolOrganizationId: string; name: string; industry: string; scale: string; region: string; countryIso: string; description: string };
  role: {
    poolRoleId: string; title: string; seniority: string; domainFocus: string; description: string;
    profile: {
      roleDescriptor: string | null; roleSemanticDefinition: string; seniorityInterpretation: string | null; domainContext: string | null;
      responsibilityScope: { state: "DECLARED"; text: string } | { state: "NOT_DECLARED" };
      proposalState: "PROPOSAL_ONLY"; semanticValidationState: "NOT_RUN"; authorityState: "NONE";
    };
  };
  requirements: Array<{
    poolRequirementId: string; capabilityName: string; aliases: string[]; domain: string; requiredLevel: string; weight: number;
    requirementType: string; requirementTypeDeclared: boolean; targetRequirementRevisionId: string;
    necessityState: NecessityState; requiredLevelState: RequiredLevelState; matchingEligibility: TargetRequirementRevision["matchingEligibility"];
    validation: Pick<TargetRequirementRevision, "classificationValidationState" | "semanticInterpretationState" | "requiredLevelValidationState" | "necessityValidationState" | "scopeValidationState">;
    evidence: string[];
  }>;
  findings: JobStructureFinding[];
  authority: { basis: "DECLARED_POOL_FIELDS_AND_CANONICAL_VALIDATION"; interpretation: "NONE"; proposalState: "PROPOSAL_ONLY"; authorityState: "NONE"; scored: false };
  counts: { requirements: number; findings: number };
}

export interface JobStructureDependencies {
  resolver: JobScopeResolver;
  profiles: { getRevisionById(id: string): Promise<TargetRoleProfileRevision | null> };
  requirements: { getRevisionById(id: string): Promise<TargetRequirementRevision | null> };
}

const nonEmpty = (value: string | undefined | null): value is string => typeof value === "string" && value.trim().length > 0;
const lineage = (): never => { throw new JobStructureError("ERR_JOB_STRUCTURE_LINEAGE_INVALID", 409); };

/** Exactly two non-empty path values; nothing trimmed, nothing defaulted. */
export function parseJobStructureSelection(jobPoolUploadId: unknown, poolRoleId: unknown): JobScopeSelection {
  if (typeof jobPoolUploadId !== "string" || !jobPoolUploadId || typeof poolRoleId !== "string" || !poolRoleId) throw new JobStructureError("ERR_JOB_STRUCTURE_SELECTION_REQUIRED", 400);
  return { jobPoolUploadId, poolRoleId };
}

function findingsOf(scope: ResolvedJobScope, profile: TargetRoleProfileRevision, requirements: JobStructure["requirements"]): JobStructureFinding[] {
  const role = scope.role;
  const findings: JobStructureFinding[] = [];
  const roleFinding = (code: JobStructureFindingCode, field: string) => findings.push({ code, subject: { kind: "ROLE", id: role.id }, field, evidence: [], relatedRequirementIds: [] });
  if (!nonEmpty(role.description)) roleFinding("ROLE_DESCRIPTION_MISSING", "description");
  if (!nonEmpty(role.seniority)) roleFinding("ROLE_SENIORITY_UNDECLARED", "seniority");
  if (!nonEmpty(role.domain_focus)) roleFinding("ROLE_DOMAIN_FOCUS_UNDECLARED", "domain_focus");
  if (profile.profile.responsibilityScope === null) roleFinding("ROLE_RESPONSIBILITY_NOT_DECLARED", "responsibility");
  if (!requirements.some(item => item.necessityState.kind === "REQUIRED")) roleFinding("ROLE_WITHOUT_REQUIRED_REQUIREMENT", "requirements.necessity");

  const names = requirements.map(item => new Set([item.capabilityName, ...item.aliases].map(normalizeCapabilityName).filter(name => name.length > 0)));
  requirements.forEach((item, index) => {
    const add = (code: JobStructureFindingCode, field: string, related: string[] = [], extraEvidence: string[] = []) =>
      findings.push({ code, subject: { kind: "REQUIREMENT", id: item.poolRequirementId }, field, evidence: [...item.evidence, ...extraEvidence], relatedRequirementIds: related });
    if (item.necessityState.kind === "UNKNOWN") add("REQUIREMENT_NECESSITY_UNDECLARED", "necessity");
    if (item.validation.requiredLevelValidationState === "UNKNOWN") add("REQUIREMENT_LEVEL_UNRESOLVED", "required_level");
    if (item.matchingEligibility === "MATCHING_INELIGIBLE") add("REQUIREMENT_MATCHING_INELIGIBLE", "matching_eligibility");
    if (item.matchingEligibility === "MATCHING_ELIGIBILITY_UNKNOWN") add("REQUIREMENT_MATCHING_ELIGIBILITY_UNKNOWN", "matching_eligibility");
    if (!item.requirementTypeDeclared) add("REQUIREMENT_TYPE_UNDECLARED", "requirement_type");
    if (item.weight === 0) add("REQUIREMENT_ZERO_WEIGHT", "weight");
    if (!nonEmpty(item.domain)) add("REQUIREMENT_DOMAIN_UNDECLARED", "domain");
    const colliding = requirements.filter((other, otherIndex) => otherIndex !== index && [...names[index]].some(name => names[otherIndex].has(name)));
    if (colliding.length) add("REQUIREMENT_NAME_COLLISION", "capability_name/aliases", colliding.map(other => other.poolRequirementId), colliding.flatMap(other => other.evidence));
  });
  return findings;
}

export async function readJobStructure(deps: JobStructureDependencies, selection: JobScopeSelection): Promise<JobStructure> {
  let scope: ResolvedJobScope;
  try { scope = await deps.resolver.resolve(selection); } catch (error) {
    if (error instanceof JobScopeRequiredError) throw new JobStructureError(error.code === "ERR_JOB_SCOPE_REQUIRED" ? "ERR_JOB_STRUCTURE_SELECTION_REQUIRED" : "ERR_JOB_STRUCTURE_UNAVAILABLE", error.code === "ERR_JOB_SCOPE_REQUIRED" ? 400 : 409);
    throw error;
  }
  const profile = await deps.profiles.getRevisionById(scope.roleMapping.targetRoleProfileRevisionId);
  if (!profile || profile.targetRoleProfileRevisionId !== scope.roleMapping.targetRoleProfileRevisionId) return lineage();
  const requirements: JobStructure["requirements"] = await Promise.all(scope.requirements.map(async ({ poolRequirement, mapping }) => {
    const revision = await deps.requirements.getRevisionById(mapping.targetRequirementRevisionId);
    if (!revision || revision.targetRequirementRevisionId !== mapping.targetRequirementRevisionId || revision.targetRoleProfileRevisionId !== profile.targetRoleProfileRevisionId) return lineage();
    return {
      poolRequirementId: poolRequirement.id, capabilityName: poolRequirement.capability_name, aliases: [...(poolRequirement.aliases ?? [])],
      domain: poolRequirement.domain, requiredLevel: poolRequirement.required_level, weight: poolRequirement.weight,
      requirementType: revision.requirement.requirementType, requirementTypeDeclared: poolRequirement.requirement_type !== undefined,
      targetRequirementRevisionId: revision.targetRequirementRevisionId,
      necessityState: revision.requirement.necessityState, requiredLevelState: revision.requirement.requiredLevelState, matchingEligibility: revision.matchingEligibility,
      validation: {
        classificationValidationState: revision.classificationValidationState, semanticInterpretationState: revision.semanticInterpretationState,
        requiredLevelValidationState: revision.requiredLevelValidationState, necessityValidationState: revision.necessityValidationState, scopeValidationState: revision.scopeValidationState
      },
      evidence: revision.evidence.map(item => item.exactQuote)
    };
  }));
  const findings = findingsOf(scope, profile, requirements);
  return {
    structureVersion: JOB_STRUCTURE_VERSION,
    investigationMode: "JOB",
    binding: { jobPoolUploadId: scope.selection.jobPoolUploadId, poolRoleId: scope.selection.poolRoleId, poolId: scope.poolId, poolVersion: scope.poolVersion, poolCanonicalSha256: scope.poolCanonicalSha256, targetRoleProfileRevisionId: profile.targetRoleProfileRevisionId },
    organization: { poolOrganizationId: scope.organization.id, name: scope.organization.name, industry: scope.organization.industry, scale: scope.organization.scale, region: scope.organization.region, countryIso: scope.organization.country_iso, description: scope.organization.description },
    role: {
      poolRoleId: scope.role.id, title: scope.role.title, seniority: scope.role.seniority, domainFocus: scope.role.domain_focus, description: scope.role.description,
      profile: {
        roleDescriptor: profile.profile.roleDescriptor, roleSemanticDefinition: profile.profile.roleSemanticDefinition,
        seniorityInterpretation: profile.profile.seniorityInterpretation, domainContext: profile.profile.domainContext,
        responsibilityScope: profile.profile.responsibilityScope === null ? { state: "NOT_DECLARED" } : { state: "DECLARED", text: profile.profile.responsibilityScope },
        proposalState: profile.proposalState, semanticValidationState: profile.semanticValidationState, authorityState: profile.authorityState
      }
    },
    requirements,
    findings,
    authority: { basis: "DECLARED_POOL_FIELDS_AND_CANONICAL_VALIDATION", interpretation: "NONE", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", scored: false },
    counts: { requirements: requirements.length, findings: findings.length }
  };
}
