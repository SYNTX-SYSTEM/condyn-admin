import { vi } from "vitest";
import type { CareerCanonicalProducerRepositories } from "../../../lib/decision-adapters/career-canonical";
import type { CareerCanonicalLocalFixture } from "./career-canonical-local-fixture";

/** Exact in-memory reads: each stub answers one id with a detached clone and anything else with null. */
export function exactRead<T extends object>(value: T | null, idField: keyof T) {
  return vi.fn(async (id: string): Promise<T | null> => value !== null && (value as Record<string, unknown>)[idField as string] === id ? structuredClone(value) : null);
}

export function exactReadAny<T extends object>(values: readonly T[], idField: keyof T) {
  return vi.fn(async (id: string): Promise<T | null> => {
    const found = values.find((value) => (value as Record<string, unknown>)[idField as string] === id);
    return found === undefined ? null : structuredClone(found);
  });
}

export function stubRepositories(fixture: CareerCanonicalLocalFixture): CareerCanonicalProducerRepositories {
  return {
    recommendationProposals: { getRecommendationProposalById: exactRead(fixture.recommendationProposal, "recommendationProposalId") },
    evolutionInputStates: { getEvolutionInputStateById: exactRead(fixture.evolutionInputState, "evolutionInputStateId") },
    tensionStates: { getTensionStateById: exactRead(fixture.tensionState, "tensionStateId") },
    roleRelations: { getRoleRelationById: exactRead(fixture.roleRelation, "roleRelationId") },
    targetRequirementRevisions: { getRevisionById: exactReadAny([fixture.requirementA, fixture.requirementB], "targetRequirementRevisionId") },
    targetRoleProfileRevisions: { getRevisionById: exactRead(fixture.profile, "targetRoleProfileRevisionId") },
    targetOrganizationRevisions: { getRevisionById: exactRead(fixture.organization, "targetOrganizationRevisionId") },
    organizationRelations: { getOrganizationRelationById: exactRead(fixture.organizationRelation, "organizationRelationId") },
    capabilityRequirementRelations: { getResultById: exactRead(fixture.evaluationResult, "capabilityRequirementRelationEvaluationResultId") },
    actionOccurrences: { getCareerActionOccurrenceById: exactRead(fixture.actionOccurrence, "careerActionOccurrenceId") },
    stateChangeDeclarations: { getCareerStateChangeDeclarationById: exactRead(fixture.stateChangeDeclaration, "careerStateChangeDeclarationId") },
    actionStateChangeAssociationDeclarations: { getCareerActionStateChangeAssociationDeclarationById: exactRead(fixture.associationDeclaration, "careerActionStateChangeAssociationDeclarationId") },
    outcomeRoleDeclarations: { getCareerOutcomeRoleDeclarationById: exactRead(fixture.outcomeRoleDeclaration, "careerOutcomeRoleDeclarationId") },
    outcomeValenceDeclarations: { getCareerOutcomeValenceDeclarationById: exactRead(fixture.outcomeValenceDeclaration, "careerOutcomeValenceDeclarationId") },
    outcomeValenceFeedbackContextRevisions: { getCareerOutcomeValenceFeedbackContextRevisionById: exactRead(fixture.feedbackContextRevision, "careerOutcomeValenceFeedbackContextRevisionId") }
  };
}
