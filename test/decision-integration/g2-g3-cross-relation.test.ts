import { describe, expect, it } from "vitest";
import {
  CAREER_CANONICAL_AUTHORITY_CONTRACTS,
  CAREER_CANONICAL_PRODUCER_ID as G3_PRODUCER_ID,
  careerActionOccurrenceReference,
  careerActionStateChangeAssociationDeclarationReference,
  careerOutcomeRoleDeclarationReference,
  careerOutcomeValenceDeclarationReference,
  careerOutcomeValenceFeedbackContextRevisionReference,
  careerRecommendationProposalReference,
  careerStateChangeDeclarationReference,
  type CareerCanonicalAuthorityFamily,
} from "../../lib/career/canonical-authority";
import { createDecisionAuthorityGrantRevision } from "../../lib/career/relation/decision-authority";
import { createCareerDecisionContextRevision } from "../../lib/career/relation/decision-context";
import { createBoundCareerDecisionContextDecisionRevisionBinder } from "../../lib/career/relation/decision-context-decision-revision-binding";
import {
  CAREER_CANONICAL_FAMILIES,
  CAREER_CANONICAL_PRODUCER_ID as G2_PRODUCER_ID,
  createCareerCanonicalAuthoritativeStateResolvers,
  type CareerCanonicalFamily,
} from "../../lib/decision-adapters/career-canonical";
import { createBoundAuthoritativeStateReader } from "../../lib/decision-core/authority";
import { createDecisionContextDraft } from "../../lib/decision-core/context";
import { createDecisionContextRevision } from "../../lib/decision-core/revisions";
import { assembleDecisionContextValidation } from "../../lib/decision-core/validation-assembly";
import { buildHrDecisionContextDraftInput } from "../../lib/hr-decision-context";
import { createCareerCanonicalLocalFixture } from "./fixtures/career-canonical-local-fixture";
import { stubRepositories } from "./fixtures/stub-repositories";

/**
 * Cross-relation proof between independently verified G2 (R1, R2, R3) and G3 (R4, R5) states.
 * Each relation was GREEN in isolation; these assertions close the relations that only exist
 * when both states are integrated.
 */
const g3ToG2Family: Record<CareerCanonicalAuthorityFamily, CareerCanonicalFamily> = {
  RECOMMENDATION_PROPOSAL: "RCP",
  EVOLUTION_INPUT_STATE: "EIS",
  TENSION_STATE: "TSN",
  ROLE_RELATION: "RRL",
  TARGET_REQUIREMENT_REVISION: "TRQREV",
  TARGET_ROLE_PROFILE_REVISION: "TRPREV",
  TARGET_ORGANIZATION_REVISION: "TOREV",
  ORGANIZATION_RELATION: "ORL",
  CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RESULT: "CRRES",
  ACTION_OCCURRENCE: "AOC",
  STATE_CHANGE_DECLARATION: "SCD",
  ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION: "ASCAD",
  OUTCOME_ROLE_DECLARATION: "CORD",
  OUTCOME_VALENCE_DECLARATION: "COVD",
  OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION: "COVFCR",
};

function hrRootRevision(fixture: Awaited<ReturnType<typeof createCareerCanonicalLocalFixture>>) {
  const input = buildHrDecisionContextDraftInput({
    question: { statement: "Which recommendation subjects are operationalized?", actorId: "DECIDER_CROSS" },
    sourceState: {
      verifiedCapabilitySnapshot: fixture.snapshot,
      recommendationProposal: fixture.recommendationProposal,
      evolutionInputState: fixture.evolutionInputState,
      tensionState: fixture.tensionState,
      roleRelation: fixture.roleRelation,
      targetRoleProfileRevision: fixture.profile,
      targetRequirementRevisions: [fixture.requirementA, fixture.requirementB],
    },
  });
  const draft = createDecisionContextDraft(input);
  const validationInput = { expectationValidations: [], consequenceValidations: [] };
  return createDecisionContextRevision({ previousRevisionId: null, context: draft, validationInput, validationAssembly: assembleDecisionContextValidation(draft, validationInput) });
}

function careerContextOver(fixture: Awaited<ReturnType<typeof createCareerCanonicalLocalFixture>>) {
  const stamp = "2026-10-09T00:00:00.000Z";
  const authority = createDecisionAuthorityGrantRevision({
    grantorActorId: "GRANTOR_CROSS", authorizedActorId: "DECIDER_CROSS", authorityScope: "CAREER_RECOMMENDATION_DECISION",
    permittedDecisionClasses: ["ACCEPT_RECOMMENDATION", "DEFER_DECISION", "REJECT_RECOMMENDATION", "REQUEST_FURTHER_EVIDENCE", "REQUEST_TARGET_CLARIFICATION"],
    permittedSubjectKinds: ["RCP_ITEM"], authorityEvidenceRefs: ["evidence://grant/cross"],
    declaredAt: stamp, effectiveFrom: stamp, effectiveUntil: null, createdAt: stamp,
  });
  const proposal = fixture.recommendationProposal;
  const subjects = proposal.items
    .filter(item => item.recommendationDisposition === "PROPOSED")
    .map(item => ({ recommendationProposalId: proposal.recommendationProposalId, sourceEvolutionInputItemOrdinal: item.sourceEvolutionInputItemOrdinal }));
  const context = createCareerDecisionContextRevision(authority, proposal, {
    decisionAuthorityGrantRevisionId: authority.decisionAuthorityGrantRevisionId,
    recommendationProposalId: proposal.recommendationProposalId,
    decisionSubjects: subjects,
    contextEvidenceRefs: ["evidence://context/cross"],
    createdAt: stamp,
  });
  return { authority, context };
}

describe("G2/G3 cross-relation integration (one D3 vocabulary, R2 to R4, R5 to R1)", () => {
  it("the G3 reference vocabulary equals the G2 resolver vocabulary for every family (D3, R6)", () => {
    expect(G3_PRODUCER_ID).toBe(G2_PRODUCER_ID);
    for (const [g3Family, g2Family] of Object.entries(g3ToG2Family) as Array<[CareerCanonicalAuthorityFamily, CareerCanonicalFamily]>) {
      expect({ family: g3Family, id: CAREER_CANONICAL_AUTHORITY_CONTRACTS[g3Family] })
        .toEqual({ family: g3Family, id: CAREER_CANONICAL_FAMILIES[g2Family].authorityContractId });
    }
    expect(Object.keys(CAREER_CANONICAL_AUTHORITY_CONTRACTS)).toHaveLength(Object.keys(CAREER_CANONICAL_FAMILIES).length);
  });

  it("every G3 R5 reference resolves through the bound G2 R1 resolver list", async () => {
    const fixture = await createCareerCanonicalLocalFixture("CROSS");
    const reader = createBoundAuthoritativeStateReader(createCareerCanonicalAuthoritativeStateResolvers(stubRepositories(fixture)));
    const references = [
      careerRecommendationProposalReference(fixture.recommendationProposal),
      careerActionOccurrenceReference(fixture.actionOccurrence),
      careerStateChangeDeclarationReference(fixture.stateChangeDeclaration),
      careerActionStateChangeAssociationDeclarationReference(fixture.associationDeclaration),
      careerOutcomeRoleDeclarationReference(fixture.outcomeRoleDeclaration),
      careerOutcomeValenceDeclarationReference(fixture.outcomeValenceDeclaration),
      careerOutcomeValenceFeedbackContextRevisionReference(fixture.feedbackContextRevision),
    ];
    for (const reference of references) {
      const resolution = await reader.resolve(reference);
      expect(resolution.reference).toEqual(reference);
    }
  });

  it("a root DREV built by the G2 HR layer (R2) is bindable to a DCTXREV over the same RCP (R4)", async () => {
    const fixture = await createCareerCanonicalLocalFixture("CROSS");
    const revision = hrRootRevision(fixture);
    const { context } = careerContextOver(fixture);
    const binder = createBoundCareerDecisionContextDecisionRevisionBinder(
      { async getCareerDecisionContextRevisionById(id) { return id === context.careerDecisionContextRevisionId ? structuredClone(context) : null; } },
      { async getDecisionContextRevisionById(id) { return id === revision.revisionId ? structuredClone(revision) : null; } },
    );
    const binding = await binder.bind({ careerDecisionContextRevisionId: context.careerDecisionContextRevisionId, decisionContextRevisionId: revision.revisionId, createdAt: "2026-10-09T00:00:01.000Z" });
    expect(binding.recommendationProposalWitness.artifactId).toBe(fixture.recommendationProposal.recommendationProposalId);
    expect(binding.recommendationProposalWitness.locator).toBe(fixture.recommendationProposal.recommendationProposalId);
    expect(binding.recommendationProposalWitness).toEqual(careerRecommendationProposalReference(fixture.recommendationProposal));
  });
});
