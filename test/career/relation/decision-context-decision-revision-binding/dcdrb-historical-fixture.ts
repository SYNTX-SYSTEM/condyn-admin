import { careerRecommendationProposalReference } from "../../../../lib/career/canonical-authority";
import type { CareerDecisionContextRevision } from "../../../../lib/career/relation/decision-context";
import type { RecommendationProposal } from "../../../../lib/career/relation/recommendation-proposal";
import { createDecisionContextDraft, type DecisionContextItemInput } from "../../../../lib/decision-core/context";
import { createDecisionContextRevision, type DecisionContextRevision } from "../../../../lib/decision-core/revisions";
import { assembleDecisionContextValidation, type DecisionContextValidationAssemblyInput } from "../../../../lib/decision-core/validation-assembly";
import { createT12AHistoricalFixture } from "../action-intent/t12a-historical-fixture";

export const dcdrbStamp = "2027-02-01T02:00:00.000Z";

export interface GenericRevisionOptions {
  sourceStateReferences?: ReadonlyArray<{ producerId: string; authorityContractId: string; artifactId: string; locator: string }>;
  extraItems?: readonly DecisionContextItemInput[];
  previousRevisionId?: string | null;
}

/** Builds a generic Decision Core root revision whose OPTION items carry exact RCP provenance. Test fixture only. */
export function createGenericRevisionForProposal(
  proposal: RecommendationProposal,
  context: CareerDecisionContextRevision,
  options: GenericRevisionOptions = {},
): DecisionContextRevision {
  const witness = careerRecommendationProposalReference(proposal);
  const sourceStateReferences = options.sourceStateReferences ?? [witness];
  const items: DecisionContextItemInput[] = [
    { role: "DECISION_QUESTION", statement: "Which exact recommendation subjects are operationalized?", provenance: { origin: "HUMAN_INPUT", actorId: "DECIDER_T12A" } },
    ...context.decisionSubjects.map(subject => ({
      role: "OPTION" as const,
      statement: `Recommendation proposal item ${subject.sourceEvolutionInputItemOrdinal}`,
      provenance: (() => {
        const inventoryReference = sourceStateReferences.find(reference => reference.artifactId === witness.artifactId);
        return inventoryReference
          ? { origin: "AUTHORITATIVE_STATE" as const, stateReference: { ...inventoryReference } }
          : { origin: "HUMAN_INPUT" as const, actorId: "DECIDER_T12A" };
      })(),
    })),
    ...(options.extraItems ?? []),
  ];
  const draft = createDecisionContextDraft({ sourceStateReferences: sourceStateReferences.map(reference => ({ ...reference })), items });
  const validationInput: DecisionContextValidationAssemblyInput = { expectationValidations: [], consequenceValidations: [] };
  const validationAssembly = assembleDecisionContextValidation(draft, validationInput);
  return createDecisionContextRevision({ previousRevisionId: options.previousRevisionId ?? null, context: draft, validationInput, validationAssembly });
}

export function createDcdrbHistoricalFixture() {
  const t12a = createT12AHistoricalFixture();
  const revision = createGenericRevisionForProposal(t12a.proposal, t12a.context);
  const witness = careerRecommendationProposalReference(t12a.proposal);
  const contexts = {
    async getCareerDecisionContextRevisionById(id: string) {
      return id === t12a.context.careerDecisionContextRevisionId ? structuredClone(t12a.context) : null;
    },
  };
  const revisions = {
    async getDecisionContextRevisionById(id: string) {
      return id === revision.revisionId ? structuredClone(revision) : null;
    },
  };
  return {
    ...t12a,
    revision,
    witness,
    contexts,
    revisions,
    bindingInput: {
      careerDecisionContextRevisionId: t12a.context.careerDecisionContextRevisionId,
      decisionContextRevisionId: revision.revisionId,
      createdAt: dcdrbStamp,
    },
  };
}
