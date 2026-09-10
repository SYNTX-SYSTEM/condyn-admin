import { describe, expect, it } from "vitest";
import {
  createDecisionAuthorityGrantRevision,
  InMemoryDecisionAuthorityGrantRevisionRepository
} from "../../../../lib/career/relation/decision-authority";
import {
  assertCareerDecisionContextRevision,
  byteReplayCareerDecisionContextRevision,
  createCareerDecisionContextRevision,
  derivationReplayCareerDecisionContextRevision,
  InMemoryCareerDecisionContextRevisionRepository,
  produceAndPersistCareerDecisionContextRevision,
  semanticReplayCareerDecisionContextRevision
} from "../../../../lib/career/relation/decision-context";
import { deriveEvolutionInputStateId } from "../../../../lib/career/relation/evolution-input";
import {
  deriveRecommendationPolicyRevisionId,
  deriveRecommendationProposal,
  InMemoryRecommendationProposalRepository
} from "../../../../lib/career/relation/recommendation-proposal";

const stamp = "2027-02-01T00:00:00.000Z";
const authority = createDecisionAuthorityGrantRevision({
  grantorActorId: "GRANTOR", authorizedActorId: "DECIDER", authorityScope: "CAREER_RECOMMENDATION_DECISION",
  permittedDecisionClasses: ["ACCEPT_RECOMMENDATION", "REQUEST_FURTHER_EVIDENCE"], permittedSubjectKinds: ["RCP_ITEM"], authorityEvidenceRefs: ["evidence://grant"],
  declaredAt: stamp, effectiveFrom: stamp, effectiveUntil: null, createdAt: stamp
});
const policySemantic = {
  provenance: { origin: "EXPLICIT_POLICY_DECLARATION" as const, actorId: "POLICY_ACTOR", authorityEvidenceRef: "evidence://policy" },
  rules: [
    { evolutionInputClass: "INCREASE_DEMONSTRATED_LEVEL_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "DEMONSTRATED_LEVEL_RECOMMENDATION" as const },
    { evolutionInputClass: "RESOLVE_SEMANTIC_UNCERTAINTY_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "SEMANTIC_UNCERTAINTY_RESOLUTION_RECOMMENDATION" as const },
    { evolutionInputClass: "RESOLVE_TARGET_UNCERTAINTY_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "TARGET_UNCERTAINTY_RESOLUTION_RECOMMENDATION" as const }
    ,{ evolutionInputClass: "STRENGTHEN_EVIDENCE_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "EVIDENCE_STRENGTHENING_RECOMMENDATION" as const }
  ], recommendationPolicyImplementationVersion: "recommendation-v1", schemaVersion: "RECOMMENDATION_POLICY_REVISION_V1" as const
};
const policy = { recommendationPolicyRevisionId: deriveRecommendationPolicyRevisionId(policySemantic), ...policySemantic, createdAt: stamp };
const evolutionSemantic = {
  tensionStateId: "TSN_CONTEXT", roleRelationId: "RRL_CONTEXT", verifiedCapabilitySnapshotId: "SNAP_CONTEXT", targetRoleProfileRevisionId: "TRP_CONTEXT", targetRoleRequirementInventoryId: "TRQINV_CONTEXT",
  items: [
    { evolutionInputClass: "INCREASE_DEMONSTRATED_LEVEL_INPUT" as const, derivationDisposition: "DERIVABLE" as const, tensionClassificationFamily: "STRUCTURAL_DIFFERENCE" as const, tensionClassificationCode: "LEVEL_BELOW_RELATION", subjectKind: "REQUIREMENT" as const, dimension: "LEVEL" as const, targetRequirementEntityId: null, targetRequirementRevisionIds: [], requirementRelationAggregateId: null, candidateCapabilityOperandId: null, capabilityRequirementRelationId: null, capabilityRequirementRelationEvaluationResultId: null, necessityStates: [] },
    { evolutionInputClass: null, derivationDisposition: "NOT_DERIVABLE" as const, tensionClassificationFamily: "STRUCTURAL_DIFFERENCE" as const, tensionClassificationCode: "SEMANTIC_PARTIAL_RELATION", subjectKind: "REQUIREMENT" as const, dimension: "SEMANTIC" as const, targetRequirementEntityId: null, targetRequirementRevisionIds: [], requirementRelationAggregateId: null, candidateCapabilityOperandId: null, capabilityRequirementRelationId: null, capabilityRequirementRelationEvaluationResultId: null, necessityStates: [] }
  ], derivationPolicyLineage: { evolutionInputDerivationPolicyVersion: "evolution-v1" }, proposalState: "PROPOSAL_ONLY" as const, authorityState: "NONE" as const, schemaVersion: "EVOLUTION_INPUT_STATE_V1" as const
};
const evolution = { evolutionInputStateId: deriveEvolutionInputStateId(evolutionSemantic), ...evolutionSemantic, createdAt: stamp };
const proposal = deriveRecommendationProposal(evolution, policy, { version: "recommendation-v1" }, stamp);
const input = (override: Record<string, unknown> = {}) => ({
  decisionAuthorityGrantRevisionId: authority.decisionAuthorityGrantRevisionId,
  recommendationProposalId: proposal.recommendationProposalId,
  decisionSubjects: [{ recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: 0 }],
  contextEvidenceRefs: ["evidence://context/b", "evidence://context/a"],
  createdAt: stamp,
  ...override
});

describe("T11B CareerDecisionContextRevision", () => {
  it("creates an exact DAR/RCP-bound structural context without selecting a recommendation", async () => {
    const authorities = new InMemoryDecisionAuthorityGrantRevisionRepository();
    const proposals = new InMemoryRecommendationProposalRepository();
    const contexts = new InMemoryCareerDecisionContextRevisionRepository();
    await authorities.persistDecisionAuthorityGrantRevision(authority);
    await proposals.persistRecommendationProposal(proposal);
    const value = await produceAndPersistCareerDecisionContextRevision(input(), { authorities, proposals, contexts });
    assertCareerDecisionContextRevision(value);
    expect(value).toMatchObject({
      careerDecisionContextRevisionId: expect.stringMatching(/^DCTXREV_[0-9A-F]{32}$/),
      authorityScope: "CAREER_RECOMMENDATION_DECISION",
      permittedDecisionClasses: authority.permittedDecisionClasses,
      permittedSubjectKinds: ["RCP_ITEM"],
      contextEvidenceRefs: ["evidence://context/a", "evidence://context/b"]
    });
    expect(value).not.toHaveProperty("decision");
    expect(value).not.toHaveProperty("selectedRecommendationItemOrdinal");
    expect(value).not.toHaveProperty("commitment");
    expect(value).not.toHaveProperty("execution");
  });

  it("supports explicit multiple subjects including a non-proposed RCP item without filtering or deciding", () => {
    const value = createCareerDecisionContextRevision(authority, proposal, input({
      decisionSubjects: [
        { recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: 1 },
        { recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: 0 }
      ]
    }));
    expect(value.decisionSubjects.map(subject => subject.sourceEvolutionInputItemOrdinal)).toEqual([0, 1]);
    expect(proposal.items.find(item => item.sourceEvolutionInputItemOrdinal === 1)?.recommendationDisposition).toBe("NOT_RECOMMENDABLE");
  });

  it("fails closed for missing operands, foreign/nonexistent/duplicate subjects, and incompatible DAR", async () => {
    const authorities = new InMemoryDecisionAuthorityGrantRevisionRepository();
    const proposals = new InMemoryRecommendationProposalRepository();
    const contexts = new InMemoryCareerDecisionContextRevisionRepository();
    await authorities.persistDecisionAuthorityGrantRevision(authority);
    await proposals.persistRecommendationProposal(proposal);
    await expect(produceAndPersistCareerDecisionContextRevision(input({ decisionAuthorityGrantRevisionId: "DAR_00000000000000000000000000000000" }), { authorities, proposals, contexts })).rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_AUTHORITY_GRANT_NOT_FOUND");
    await expect(produceAndPersistCareerDecisionContextRevision(input({ recommendationProposalId: "RCP_00000000000000000000000000000000" }), { authorities, proposals, contexts })).rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_RECOMMENDATION_PROPOSAL_NOT_FOUND");
    expect(() => createCareerDecisionContextRevision(authority, proposal, input({ decisionSubjects: [] }))).toThrow("ERR_CAREER_DECISION_CONTEXT_SUBJECT_INVALID");
    expect(() => createCareerDecisionContextRevision(authority, proposal, input({ decisionSubjects: [{ recommendationProposalId: "RCP_00000000000000000000000000000000", sourceEvolutionInputItemOrdinal: 0 }] }))).toThrow("ERR_CAREER_DECISION_CONTEXT_SUBJECT_INVALID");
    expect(() => createCareerDecisionContextRevision(authority, proposal, input({ decisionSubjects: [{ recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: 42 }] }))).toThrow("ERR_CAREER_DECISION_CONTEXT_SUBJECT_INVALID");
    expect(() => createCareerDecisionContextRevision(authority, proposal, input({ decisionSubjects: [{ recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: 0 }, { recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: 0 }] }))).toThrow("ERR_CAREER_DECISION_CONTEXT_SUBJECT_INVALID");
  });

  it("binds canonical subjects/evidence and DAR witness inventories into identity while excluding createdAt", () => {
    const original = createCareerDecisionContextRevision(authority, proposal, input());
    expect(createCareerDecisionContextRevision(authority, proposal, input({ createdAt: "2028-02-01T00:00:00.000Z" })).careerDecisionContextRevisionId).toBe(original.careerDecisionContextRevisionId);
    expect(createCareerDecisionContextRevision(authority, proposal, input({ contextEvidenceRefs: ["evidence://context/a", "evidence://context/b"] })).careerDecisionContextRevisionId).toBe(original.careerDecisionContextRevisionId);
    expect(createCareerDecisionContextRevision(authority, proposal, input({ decisionSubjects: [{ recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: 1 }] })).careerDecisionContextRevisionId).not.toBe(original.careerDecisionContextRevisionId);
    expect(() => assertCareerDecisionContextRevision({ ...original, authorityScope: "OTHER" })).toThrow("ERR_CAREER_DECISION_CONTEXT_INVALID");
    expect(() => assertCareerDecisionContextRevision({ ...original, contextEvidenceRefs: ["evidence://context/b", "evidence://context/a"] })).toThrow("ERR_CAREER_DECISION_CONTEXT_INVALID");
  });

  it("persists immutably with detached reads and reconstructs only exact historical witnesses", async () => {
    const authorities = new InMemoryDecisionAuthorityGrantRevisionRepository();
    const proposals = new InMemoryRecommendationProposalRepository();
    const contexts = new InMemoryCareerDecisionContextRevisionRepository();
    await authorities.persistDecisionAuthorityGrantRevision(authority);
    await proposals.persistRecommendationProposal(proposal);
    const value = await produceAndPersistCareerDecisionContextRevision(input(), { authorities, proposals, contexts });
    await expect(contexts.persistCareerDecisionContextRevision(value)).resolves.toEqual(value);
    await expect(contexts.persistCareerDecisionContextRevision({ ...value, createdAt: "2028-02-01T00:00:00.000Z" })).rejects.toThrow("ERR_CAREER_DECISION_CONTEXT_IMMUTABLE_CONFLICT");
    const read = (await contexts.getCareerDecisionContextRevisionById(value.careerDecisionContextRevisionId))!;
    (read.contextEvidenceRefs as string[]).push("evidence://mutated");
    await expect(contexts.getCareerDecisionContextRevisionById(value.careerDecisionContextRevisionId)).resolves.toEqual(value);
    const dependencies = { contexts, authorities, proposals };
    await expect(byteReplayCareerDecisionContextRevision(value.careerDecisionContextRevisionId, dependencies)).resolves.toEqual(value);
    await expect(semanticReplayCareerDecisionContextRevision(value.careerDecisionContextRevisionId, dependencies)).resolves.toEqual(value);
    await expect(derivationReplayCareerDecisionContextRevision(value.careerDecisionContextRevisionId, dependencies)).resolves.toEqual(value);
  });
});
