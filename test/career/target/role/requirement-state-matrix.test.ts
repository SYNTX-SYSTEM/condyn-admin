import { describe, expect, it } from "vitest";
import {
  createTargetRequirementRevision,
  createTargetRoleProfileRevision,
} from "../../../../lib/career/target/role";

const profile = createTargetRoleProfileRevision({
  targetRoleEntityId: "ROLE_MATRIX",
  targetRoleOrganizationBindingRevisionId: "TROBREV_MATRIX",
  previousRevisionId: null,
  profile: {
    roleDescriptor: null,
    roleSemanticDefinition: "Build governed systems",
    responsibilityScope: null,
    seniorityInterpretation: null,
    domainContext: null,
  },
  proposalState: "PROPOSAL_ONLY",
  sourceEvidenceState: "SOURCE_MATCH_VERIFIED",
  semanticValidationState: "NOT_RUN",
  authorityState: "NONE",
  schemaVersion: "TARGET_ROLE_PROFILE_REVISION_V1",
  createdAt: "2026-09-03T00:00:00.000Z",
});

function revisionWith(requirementOverrides: Record<string, unknown> = {}) {
  return createTargetRequirementRevision({
    targetRequirementEntityId: "REQ_MATRIX",
    targetRoleProfileRevisionId: profile.targetRoleProfileRevisionId,
    previousRevisionId: null,
    requirement: {
      normalizedStatement: "Governed systems expertise",
      requirementType: "CAPABILITY",
      capabilityExpression: "Governed systems",
      structuralDefinition: null,
      requiredLevelState: { kind: "NOT_APPLICABLE" },
      necessityState: { kind: "UNKNOWN" },
      scopeContextState: { kind: "NOT_APPLICABLE" },
      ...requirementOverrides,
    },
    evidence: [{ exactQuote: "Governed systems expertise" }],
    sourceEvidenceState: "SOURCE_MATCH_VERIFIED",
    classificationValidationState: "VALIDATED",
    semanticInterpretationState: "VALIDATED",
    requiredLevelValidationState: "SUPPORTED",
    necessityValidationState: "SUPPORTED",
    scopeValidationState: "SUPPORTED",
    matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY",
    proposalState: "PROPOSAL_ONLY",
    authorityState: "NONE",
    schemaVersion: "TARGET_REQUIREMENT_REVISION_V1",
    createdAt: "2026-09-03T00:00:00.000Z",
  });
}

describe("Target Requirement T5 typed state matrix", () => {
  it("preserves every frozen required-level variant", () => {
    const states = [
      { kind: "NOT_APPLICABLE" },
      { kind: "UNKNOWN" },
      { kind: "UNSUPPORTED_INFERENCE" },
      { kind: "CAPABILITY_LEVEL", level: "  advanced  " },
      { kind: "EXPERIENCE_DURATION", minimumDuration: "  5 years  " },
      { kind: "LANGUAGE_PROFICIENCY", proficiency: "  C1  " },
      { kind: "CREDENTIAL_REQUIREMENT", credential: "  CISSP  " },
    ];

    const actual = states.map((requiredLevelState) =>
      revisionWith({ requiredLevelState }).requirement.requiredLevelState
    );

    expect(actual).toEqual([
      { kind: "NOT_APPLICABLE" },
      { kind: "UNKNOWN" },
      { kind: "UNSUPPORTED_INFERENCE" },
      { kind: "CAPABILITY_LEVEL", level: "advanced" },
      { kind: "EXPERIENCE_DURATION", minimumDuration: "5 years" },
      { kind: "LANGUAGE_PROFICIENCY", proficiency: "C1" },
      { kind: "CREDENTIAL_REQUIREMENT", credential: "CISSP" },
    ]);
  });

  it("rejects malformed required-level variants instead of flattening them", () => {
    const malformed = [
      { kind: "CAPABILITY_LEVEL" },
      { kind: "EXPERIENCE_DURATION", minimumDuration: "" },
      { kind: "LANGUAGE_PROFICIENCY", proficiency: "C1", level: "extra" },
      { kind: "CREDENTIAL_REQUIREMENT", credential: null },
      { kind: "SENIORITY_LEVEL", level: "senior" },
      { kind: "UNKNOWN", level: "forbidden" },
    ];

    malformed.forEach((requiredLevelState, index) => {
      expect(
        () => revisionWith({ requiredLevelState }),
        `malformed required-level case ${index}: ${JSON.stringify(requiredLevelState)}`
      ).toThrow("ERR_TARGET_REQUIREMENT_REVISION_INVALID");
    });
  });

  it("preserves every frozen necessity variant and conditional statement", () => {
    const states = [
      { kind: "REQUIRED" },
      { kind: "PREFERRED" },
      { kind: "OPTIONAL" },
      { kind: "CONDITIONAL", conditionStatement: "  when operating in Germany  " },
      { kind: "UNKNOWN" },
    ];

    const actual = states.map((necessityState) =>
      revisionWith({ necessityState }).requirement.necessityState
    );

    expect(actual).toEqual([
      { kind: "REQUIRED" },
      { kind: "PREFERRED" },
      { kind: "OPTIONAL" },
      { kind: "CONDITIONAL", conditionStatement: "when operating in Germany" },
      { kind: "UNKNOWN" },
    ]);
  });

  it("rejects malformed necessity without inferring REQUIRED", () => {
    const malformed = [
      { kind: "CONDITIONAL" },
      { kind: "CONDITIONAL", conditionStatement: "" },
      { kind: "CONDITIONAL", conditionStatement: "if needed", required: true },
      { kind: "MANDATORY" },
      { kind: "UNKNOWN", conditionStatement: "hidden inference" },
    ];

    for (const necessityState of malformed) {
      expect(() => revisionWith({ necessityState }))
        .toThrow("ERR_TARGET_REQUIREMENT_REVISION_INVALID");
    }
  });

  it("preserves NOT_APPLICABLE, UNKNOWN, and the complete SCOPED state", () => {
    expect(
      revisionWith({ scopeContextState: { kind: "NOT_APPLICABLE" } })
        .requirement.scopeContextState
    ).toEqual({ kind: "NOT_APPLICABLE" });

    expect(
      revisionWith({ scopeContextState: { kind: "UNKNOWN" } })
        .requirement.scopeContextState
    ).toEqual({ kind: "UNKNOWN" });

    const scoped = revisionWith({
      scopeContextState: {
        kind: "SCOPED",
        organizationScope: "  ACME context  ",
        roleScope: "  platform role  ",
        responsibilityScope: null,
        domainScope: "  energy  ",
        jurisdictionScope: "  Germany  ",
        temporalAvailabilityScope: null,
      },
    }).requirement.scopeContextState;

    expect(scoped).toEqual({
      kind: "SCOPED",
      organizationScope: "ACME context",
      roleScope: "platform role",
      responsibilityScope: null,
      domainScope: "energy",
      jurisdictionScope: "Germany",
      temporalAvailabilityScope: null,
    });
  });

  it("rejects incomplete, extra-key, and malformed scope states", () => {
    const malformed = [
      {
        kind: "SCOPED",
        organizationScope: null,
        roleScope: null,
        responsibilityScope: null,
        domainScope: null,
        jurisdictionScope: null,
      },
      {
        kind: "SCOPED",
        organizationScope: null,
        roleScope: null,
        responsibilityScope: null,
        domainScope: null,
        jurisdictionScope: null,
        temporalAvailabilityScope: null,
        organizationId: "ORG_FORBIDDEN",
      },
      {
        kind: "SCOPED",
        organizationScope: 42,
        roleScope: null,
        responsibilityScope: null,
        domainScope: null,
        jurisdictionScope: null,
        temporalAvailabilityScope: null,
      },
      { kind: "UNKNOWN", roleScope: "hidden" },
    ];

    for (const scopeContextState of malformed) {
      expect(() => revisionWith({ scopeContextState }))
        .toThrow("ERR_TARGET_REQUIREMENT_REVISION_INVALID");
    }
  });
});
