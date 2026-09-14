import {
  createCareerDecisionContextRevision,
} from "../../../../lib/career/relation/decision-context";
import {
  createCareerOutcomeValenceFeedbackReturnRepresentation,
} from "../../../../lib/career/relation/outcome-valence-feedback-return-representation";
import {
  createCareerOutcomeValenceFeedbackTargetDeclaration,
} from "../../../../lib/career/relation/outcome-valence-feedback-target-declaration";
import {
  createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder,
} from "../../../../lib/career/relation/outcome-valence-feedback-target-revision-binding";
import { createT13CHistoricalFixture } from "../outcome-valence-feedback-return-representation/t13c-historical-fixture";

function exactReader(value: unknown) {
  return {
    async getCareerDecisionContextRevisionById() {
      return structuredClone(value);
    },
  };
}

/** Builds sealed history through COVFRR; alternate target provenance preserves feedback content. */
export async function createT13DHistoricalFixture(
  valence: "DESIRABLE" | "UNDESIRABLE" | "NEUTRAL" | "UNRESOLVED" = "DESIRABLE",
  alternateTargetProvenance = false,
) {
  const t13c = await createT13CHistoricalFixture(valence);
  if (!alternateTargetProvenance) {
    const careerOutcomeValenceFeedbackReturnRepresentation =
      createCareerOutcomeValenceFeedbackReturnRepresentation(
        t13c.careerOutcomeValenceFeedbackTargetRevisionBinding,
        t13c.representationInput,
      );
    return {
      ...t13c,
      careerOutcomeValenceFeedbackReturnRepresentation,
      itemInput: { createdAt: "2027-02-12T01:00:00.000Z" },
    };
  }

  const targetCareerDecisionContextRevision = createCareerDecisionContextRevision(
    t13c.authority,
    t13c.proposal,
    {
      decisionAuthorityGrantRevisionId: t13c.authority.decisionAuthorityGrantRevisionId,
      recommendationProposalId: t13c.proposal.recommendationProposalId,
      decisionSubjects: t13c.context.decisionSubjects,
      contextEvidenceRefs: ["evidence://outcome-valence-feedback-return-item/t13d/alternate-target"],
      createdAt: "2027-02-12T00:00:00.000Z",
    },
  );
  const outcomeValenceFeedbackTargetDeclaration =
    createCareerOutcomeValenceFeedbackTargetDeclaration(
      t13c.outcomeValenceFeedbackAdmissionDeclaration,
      {
        ...t13c.outcomeValenceFeedbackTargetDeclarationInput,
        targetCareerDecisionContextRevisionId:
          targetCareerDecisionContextRevision.careerDecisionContextRevisionId,
      },
    );
  const careerOutcomeValenceFeedbackTargetRevisionBinding =
    await createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(
      exactReader(targetCareerDecisionContextRevision),
    ).bind(outcomeValenceFeedbackTargetDeclaration, {
      createdAt: "2027-02-12T00:00:01.000Z",
    });
  const careerOutcomeValenceFeedbackReturnRepresentation =
    createCareerOutcomeValenceFeedbackReturnRepresentation(
      careerOutcomeValenceFeedbackTargetRevisionBinding,
      { createdAt: "2027-02-12T00:00:02.000Z" },
    );
  return {
    ...t13c,
    targetCareerDecisionContextRevision,
    outcomeValenceFeedbackTargetDeclaration,
    careerOutcomeValenceFeedbackTargetRevisionBinding,
    careerOutcomeValenceFeedbackReturnRepresentation,
    itemInput: { createdAt: "2027-02-12T01:00:00.000Z" },
  };
}
