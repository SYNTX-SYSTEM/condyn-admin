import { describe, expect, it } from "vitest";
import {
  CAREER_CANONICAL_AUTHORITY_CONTRACTS,
  CAREER_CANONICAL_PRODUCER_ID,
  careerActionOccurrenceReference,
  careerActionStateChangeAssociationDeclarationReference,
  careerCanonicalReference,
  careerOutcomeRoleDeclarationReference,
  careerOutcomeValenceDeclarationReference,
  careerRecommendationProposalReference,
  careerStateChangeDeclarationReference,
  isCareerCanonicalReference,
} from "../../../lib/career/canonical-authority";
import { createT12JHistoricalFixture } from "../relation/outcome-valence-feedback-admission-declaration/t12j-historical-fixture";

describe("Career canonical authority vocabulary (D3) and reference builders (R5)", () => {
  it("freezes the producer id and every contract id with its literal authority state", () => {
    expect(CAREER_CANONICAL_PRODUCER_ID).toBe("CONDYN_CAREER_CANONICAL_CHAIN");
    expect(CAREER_CANONICAL_AUTHORITY_CONTRACTS).toEqual({
      RECOMMENDATION_PROPOSAL: "CAREER_RECOMMENDATION_PROPOSAL_PROPOSAL_ONLY_RECOMMENDATION_POLICY_BOUND_V1",
      EVOLUTION_INPUT_STATE: "CAREER_EVOLUTION_INPUT_STATE_PROPOSAL_ONLY_AUTHORITY_NONE_V1",
      TENSION_STATE: "CAREER_TENSION_STATE_PROPOSAL_ONLY_AUTHORITY_NONE_V1",
      ROLE_RELATION: "CAREER_ROLE_RELATION_PROPOSAL_ONLY_AUTHORITY_NONE_V1",
      TARGET_REQUIREMENT_REVISION: "CAREER_TARGET_REQUIREMENT_REVISION_PROPOSAL_ONLY_AUTHORITY_NONE_V1",
      TARGET_ROLE_PROFILE_REVISION: "CAREER_TARGET_ROLE_PROFILE_REVISION_PROPOSAL_ONLY_AUTHORITY_NONE_V1",
      TARGET_ORGANIZATION_REVISION: "CAREER_TARGET_ORGANIZATION_REVISION_IMMUTABLE_RECORD_V1",
      ORGANIZATION_RELATION: "CAREER_ORGANIZATION_RELATION_IMMUTABLE_RECORD_V1",
      CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RESULT: "CAREER_CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RESULT_IMMUTABLE_RECORD_V1",
      ACTION_OCCURRENCE: "CAREER_ACTION_OCCURRENCE_DECLARATION_V1",
      STATE_CHANGE_DECLARATION: "CAREER_STATE_CHANGE_DECLARATION_V1",
      ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION: "CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_V1",
      OUTCOME_ROLE_DECLARATION: "CAREER_OUTCOME_ROLE_DECLARATION_V1",
      OUTCOME_VALENCE_DECLARATION: "CAREER_OUTCOME_VALENCE_DECLARATION_V1",
      OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION: "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_IMMUTABLE_RECORD_V1",
    });
    for (const id of Object.values(CAREER_CANONICAL_AUTHORITY_CONTRACTS)) {
      expect(id).not.toMatch(/VERIFIED|CURRENT|HEAD|LATEST|ACCEPTED|TRUE/);
      expect(id).toMatch(/_(PROPOSAL_ONLY_AUTHORITY_NONE|PROPOSAL_ONLY_RECOMMENDATION_POLICY_BOUND|DECLARATION|IMMUTABLE_RECORD)_V1$/);
    }
  });

  it("builds exact references whose locator is the exact artifact id and rejects invalid ids or families", () => {
    const reference = careerCanonicalReference("ACTION_OCCURRENCE", `AOC_${"A".repeat(32)}`);
    expect(reference).toEqual({
      producerId: "CONDYN_CAREER_CANONICAL_CHAIN",
      authorityContractId: "CAREER_ACTION_OCCURRENCE_DECLARATION_V1",
      artifactId: `AOC_${"A".repeat(32)}`,
      locator: `AOC_${"A".repeat(32)}`,
    });
    expect(isCareerCanonicalReference(reference)).toBe(true);
    expect(isCareerCanonicalReference({ ...reference, producerId: "CONDYN_CAPABILITY_CORE" })).toBe(false);
    expect(isCareerCanonicalReference({ ...reference, authorityContractId: "CAPABILITY_PHASE4_VERIFIED_V1" })).toBe(false);
    expect(() => careerCanonicalReference("ACTION_OCCURRENCE", "aoc_lower")).toThrow("ERR_CAREER_CANONICAL_AUTHORITY_ARTIFACT_ID_INVALID");
    expect(() => careerCanonicalReference("ACTION_OCCURRENCE", `AOC_${"A".repeat(24)}`)).toThrow("ERR_CAREER_CANONICAL_AUTHORITY_ARTIFACT_ID_INVALID");
    expect(() => careerCanonicalReference("NOT_A_FAMILY" as never, `AOC_${"A".repeat(32)}`)).toThrow("ERR_CAREER_CANONICAL_AUTHORITY_FAMILY_INVALID");
  });

  it("names sealed post-decision declarations only after re-asserting their identity", () => {
    const t12j = createT12JHistoricalFixture();
    expect(careerActionOccurrenceReference(t12j.occurrence).artifactId).toBe(t12j.occurrence.careerActionOccurrenceId);
    expect(careerStateChangeDeclarationReference(t12j.stateChangeDeclaration).artifactId).toBe(t12j.stateChangeDeclaration.careerStateChangeDeclarationId);
    expect(careerActionStateChangeAssociationDeclarationReference(t12j.associationDeclaration).artifactId).toBe(t12j.associationDeclaration.careerActionStateChangeAssociationDeclarationId);
    expect(careerOutcomeRoleDeclarationReference(t12j.outcomeRoleDeclaration).artifactId).toBe(t12j.outcomeRoleDeclaration.careerOutcomeRoleDeclarationId);
    expect(careerOutcomeValenceDeclarationReference(t12j.outcomeValenceDeclaration).artifactId).toBe(t12j.outcomeValenceDeclaration.careerOutcomeValenceDeclarationId);
    expect(careerOutcomeValenceDeclarationReference(t12j.outcomeValenceDeclaration).authorityContractId).toBe("CAREER_OUTCOME_VALENCE_DECLARATION_V1");
    const tampered = { ...structuredClone(t12j.occurrence), performedByActorId: "SOMEONE_ELSE" };
    expect(() => careerActionOccurrenceReference(tampered)).toThrow("ERR_CAREER_CANONICAL_AUTHORITY_ARTIFACT_INVALID");
  });

  it("names a recommendation proposal under policy-bound authority only and never upgrades it (D3)", () => {
    const t12j = createT12JHistoricalFixture();
    const reference = careerRecommendationProposalReference(t12j.proposal);
    expect(reference.authorityContractId).toBe("CAREER_RECOMMENDATION_PROPOSAL_PROPOSAL_ONLY_RECOMMENDATION_POLICY_BOUND_V1");
    expect(reference.artifactId).toBe(t12j.proposal.recommendationProposalId);
    expect(t12j.proposal.authorityState).toBe("RECOMMENDATION_POLICY_BOUND");
    const upgraded = { ...structuredClone(t12j.proposal), authorityState: "VERIFIED" as never };
    expect(() => careerRecommendationProposalReference(upgraded)).toThrow(/ERR_CAREER_CANONICAL_AUTHORITY_(ARTIFACT_INVALID|STATE_MISMATCH)/);
  });
});
