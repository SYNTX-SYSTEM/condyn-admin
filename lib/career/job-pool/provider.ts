import { createHash } from "node:crypto";
import type { CompanyPoolData, PoolCapabilityRequirement, PoolRole } from "../matching/pool";
import type { TargetRoleReconstructionProvider, TargetRoleReconstructionProviderEnvelope } from "../target/role/reconstruction";
import type { TargetRoleReconstructionProducer } from "../target/role/reconstruction/types";
import type { TargetRequirementProvider, TargetRequirementProviderEnvelope } from "../target/role/requirement/producer";
import type { TargetRequirementReconstructionProducer } from "../target/role/requirement/artifact";
import {
  normalizeValue, organizationOfRole, requirementFieldLine, requirementLine, requirementsOfRole,
  roleFieldLine, roleLine, JOB_POOL_SOURCE_NORMALIZATION_VERSION
} from "./source-content";
import { stableJson } from "./upload";

/**
 * Deterministic providers for declared JSON pools. They interpret nothing: every payload field is a declared pool
 * value, every evidence quote is an exact line of the rendered role source. No model is called.
 */
export const JOB_POOL_PROVIDER = "CONDYN_JOB_POOL_JSON";
export const JOB_POOL_REQUIRED_LEVEL_MAPPING_VERSION = "JOB_POOL_REQUIRED_LEVEL_MAPPING_V1";
export const JOB_POOL_PROVIDER_MODEL = "DETERMINISTIC_DECLARED_FIELDS";
export const JOB_POOL_PROVIDER_SPECIFICATION = "CONDYN_JOB_POOL_JSON_PROVIDER_V1: role profile and requirements from declared CompanyPoolData fields; evidence = exact lines of the one pool source";
const specificationChecksum = createHash("sha256").update(JOB_POOL_PROVIDER_SPECIFICATION, "utf8").digest("hex");

export const JOB_POOL_ROLE_PRODUCER: TargetRoleReconstructionProducer = Object.freeze({
  producerVersion: "JOB_POOL_ROLE_PROFILE_PRODUCER_V1",
  promptChecksum: specificationChecksum,
  provider: JOB_POOL_PROVIDER,
  model: JOB_POOL_PROVIDER_MODEL,
  outputSchemaVersion: "JOB_POOL_ROLE_PROFILE_ENVELOPE_V1",
  normalizationVersion: JOB_POOL_SOURCE_NORMALIZATION_VERSION
});

export const JOB_POOL_REQUIREMENT_PRODUCER: TargetRequirementReconstructionProducer = Object.freeze({
  producerVersion: "JOB_POOL_REQUIREMENT_PRODUCER_V1",
  promptChecksum: specificationChecksum,
  provider: JOB_POOL_PROVIDER,
  model: JOB_POOL_PROVIDER_MODEL,
  outputSchemaVersion: "JOB_POOL_REQUIREMENT_ENVELOPE_V1",
  normalizationVersion: JOB_POOL_SOURCE_NORMALIZATION_VERSION,
  evidenceAlgorithmVersion: "EXACT_POOL_SOURCE_LINE_V1",
  requirementOntologyVersion: "TARGET_REQUIREMENT_TYPE_DECLARED_OR_CAPABILITY_V1",
  requiredLevelTaxonomyVersion: JOB_POOL_REQUIRED_LEVEL_MAPPING_VERSION,
  necessityPolicyVersion: "DECLARED_NECESSITY_OR_UNKNOWN_V1",
  matchingEligibilityPolicyVersion: "TARGET_REQUIREMENT_PRODUCER_DEFAULT_V1"
});

const nonEmpty = (value: string | undefined | null): value is string => typeof value === "string" && normalizeValue(value).length > 0;

export function roleProfileEnvelopeFor(role: PoolRole, targetRoleOrganizationBindingRevisionId: string): TargetRoleReconstructionProviderEnvelope {
  const description = nonEmpty(role.description) ? normalizeValue(role.description) : null;
  const evidence: Array<{ profileField: string; exactQuote: string }> = [{ profileField: "roleDescriptor", exactQuote: roleLine(role) }];
  evidence.push({ profileField: "roleSemanticDefinition", exactQuote: description ? roleFieldLine(role, "DESCRIPTION", role.description) : roleLine(role) });
  if (nonEmpty(role.seniority)) evidence.push({ profileField: "seniorityInterpretation", exactQuote: roleFieldLine(role, "SENIORITY", role.seniority) });
  if (nonEmpty(role.domain_focus)) evidence.push({ profileField: "domainContext", exactQuote: roleFieldLine(role, "DOMAIN FOCUS", role.domain_focus) });
  return {
    targetRoleOrganizationBindingRevisionId,
    profile: {
      roleDescriptor: normalizeValue(role.title),
      roleSemanticDefinition: description ?? normalizeValue(role.title),
      responsibilityScope: null,
      seniorityInterpretation: nonEmpty(role.seniority) ? normalizeValue(role.seniority) : null,
      domainContext: nonEmpty(role.domain_focus) ? normalizeValue(role.domain_focus) : null
    },
    evidence
  };
}

type RequiredLevelState =
  | { kind: "UNKNOWN" } | { kind: "NOT_APPLICABLE" }
  | { kind: "CAPABILITY_LEVEL"; level: string } | { kind: "EXPERIENCE_DURATION"; minimumDuration: string }
  | { kind: "LANGUAGE_PROFICIENCY"; proficiency: string } | { kind: "CREDENTIAL_REQUIREMENT"; credential: string };

/**
 * Level mapping table (JOB_POOL_REQUIRED_LEVEL_MAPPING_V1):
 * - CAPABILITY, TOOL_TECHNOLOGY, KNOWLEDGE: a declared level that starts with L1..L6 maps to CAPABILITY_LEVEL "L<n>";
 *   any other text maps to UNKNOWN (requiredLevelValidationState UNKNOWN). The raw text stays in the source and in
 *   the presentation layer.
 * - EXPERIENCE, LANGUAGE, CREDENTIAL: the declared text is the canonical free-text variant (minimumDuration,
 *   proficiency, credential).
 * - every other type, or an empty level: UNKNOWN.
 */
const CAPABILITY_LEVEL_PATTERN = /^L([1-6])(?![0-9])/i;

export function requiredLevelStateFor(requirement: PoolCapabilityRequirement): RequiredLevelState {
  if (!nonEmpty(requirement.required_level)) return { kind: "UNKNOWN" };
  const level = normalizeValue(requirement.required_level);
  switch (requirement.requirement_type ?? "CAPABILITY") {
    case "CAPABILITY": case "TOOL_TECHNOLOGY": case "KNOWLEDGE": {
      const match = CAPABILITY_LEVEL_PATTERN.exec(level);
      return match ? { kind: "CAPABILITY_LEVEL", level: `L${match[1]}` } : { kind: "UNKNOWN" };
    }
    case "EXPERIENCE": return { kind: "EXPERIENCE_DURATION", minimumDuration: level };
    case "LANGUAGE": return { kind: "LANGUAGE_PROFICIENCY", proficiency: level };
    case "CREDENTIAL": return { kind: "CREDENTIAL_REQUIREMENT", credential: level };
    default: return { kind: "UNKNOWN" };
  }
}

export function requirementProposalFor(requirement: PoolCapabilityRequirement) {
  const level = requiredLevelStateFor(requirement);
  const evidence = [{ exactQuote: requirementLine(requirement) }];
  if (level.kind !== "UNKNOWN") evidence.push({ exactQuote: requirementFieldLine(requirement, "REQUIRED LEVEL", requirement.required_level) });
  if (requirement.necessity) evidence.push({ exactQuote: requirementFieldLine(requirement, "NECESSITY", requirement.necessity) });
  if (nonEmpty(requirement.domain)) evidence.push({ exactQuote: requirementFieldLine(requirement, "DOMAIN", requirement.domain) });
  return {
    requirement: {
      normalizedStatement: normalizeValue(requirement.capability_name),
      requirementType: requirement.requirement_type ?? "CAPABILITY",
      capabilityExpression: normalizeValue(requirement.capability_name),
      structuralDefinition: null,
      requiredLevelState: level,
      necessityState: requirement.necessity ? { kind: requirement.necessity } : { kind: "UNKNOWN" },
      scopeContextState: nonEmpty(requirement.domain)
        ? { kind: "SCOPED", organizationScope: null, roleScope: null, responsibilityScope: null, domainScope: normalizeValue(requirement.domain), jurisdictionScope: null, temporalAvailabilityScope: null }
        : { kind: "NOT_APPLICABLE" }
    },
    evidence,
    validation: {
      classificationValidationState: "VALIDATED" as const,
      semanticInterpretationState: "VALIDATED" as const,
      requiredLevelValidationState: level.kind === "UNKNOWN" ? ("UNKNOWN" as const) : ("SUPPORTED" as const),
      necessityValidationState: requirement.necessity ? ("SUPPORTED" as const) : ("UNKNOWN" as const),
      scopeValidationState: nonEmpty(requirement.domain) ? ("SUPPORTED" as const) : ("NOT_APPLICABLE" as const)
    }
  };
}

/** Role profile provider for exactly the bound roles of one upload. */
export function createJobPoolRoleProfileProvider(pool: CompanyPoolData, roleByBindingRevisionId: ReadonlyMap<string, PoolRole>): TargetRoleReconstructionProvider {
  return {
    async execute(request) {
      const envelopes = request.roles.map(item => {
        const role = roleByBindingRevisionId.get(item.targetRoleOrganizationBindingRevisionId);
        if (!role) throw new Error("ERR_JOB_POOL_PROVIDER_ROLE_UNBOUND");
        organizationOfRole(pool, role);
        return roleProfileEnvelopeFor(role, item.targetRoleOrganizationBindingRevisionId);
      });
      return { rawOutput: stableJson({ provider: JOB_POOL_PROVIDER, envelopes }), envelopes };
    }
  };
}

/** Requirement provider for exactly the role profiles of one upload. */
export function createJobPoolRequirementProvider(pool: CompanyPoolData, roleByProfileRevisionId: ReadonlyMap<string, PoolRole>): TargetRequirementProvider {
  return {
    async execute(request) {
      const envelopes: TargetRequirementProviderEnvelope[] = request.profiles.map(item => {
        const role = roleByProfileRevisionId.get(item.targetRoleProfileRevisionId);
        if (!role) throw new Error("ERR_JOB_POOL_PROVIDER_PROFILE_UNBOUND");
        const requirements = requirementsOfRole(pool, role).map(requirementProposalFor);
        return requirements.length === 0
          ? { targetRoleProfileRevisionId: item.targetRoleProfileRevisionId, requirements: [], emptyState: "NO_REQUIREMENTS_EXTRACTED" as const }
          : { targetRoleProfileRevisionId: item.targetRoleProfileRevisionId, requirements };
      });
      return { rawOutput: stableJson({ provider: JOB_POOL_PROVIDER, envelopes }), envelopes };
    }
  };
}
