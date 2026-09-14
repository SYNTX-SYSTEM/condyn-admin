import {
  createCareerOutcomeValenceFeedbackReturnItem,
} from "../../../../lib/career/relation/outcome-valence-feedback-return-item";
import {
  createCareerOutcomeValenceFeedbackReturnRepresentation,
} from "../../../../lib/career/relation/outcome-valence-feedback-return-representation";
import {
  createCareerOutcomeValenceFeedbackTargetDeclaration,
} from "../../../../lib/career/relation/outcome-valence-feedback-target-declaration";
import {
  createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder,
} from "../../../../lib/career/relation/outcome-valence-feedback-target-revision-binding";
import { createT13DHistoricalFixture } from "../outcome-valence-feedback-return-item/t13d-historical-fixture";

function exactReader(value: unknown) {
  return {
    async getCareerDecisionContextRevisionById() {
      return structuredClone(value);
    },
  };
}

/** Builds sealed predecessors through one or two exact COVFRI values for one captured base. */
export async function createT13EHistoricalFixture(
  valence: "DESIRABLE" | "UNDESIRABLE" | "NEUTRAL" | "UNRESOLVED" = "DESIRABLE",
) {
  const first = await createT13DHistoricalFixture(valence);
  const baseCareerDecisionContextRevision = structuredClone(first.targetCareerDecisionContextRevision);
  const firstFeedbackReturnItem = createCareerOutcomeValenceFeedbackReturnItem(
    first.careerOutcomeValenceFeedbackReturnRepresentation,
    first.itemInput,
  );

  const alternateTargetDeclaration = createCareerOutcomeValenceFeedbackTargetDeclaration(
    first.outcomeValenceFeedbackAdmissionDeclaration,
    {
      ...first.outcomeValenceFeedbackTargetDeclarationInput,
      careerOutcomeValenceFeedbackAdmissionDeclarationId:
        first.outcomeValenceFeedbackAdmissionDeclaration.careerOutcomeValenceFeedbackAdmissionDeclarationId,
      targetCareerDecisionContextRevisionId:
        baseCareerDecisionContextRevision.careerDecisionContextRevisionId,
      targetSelectionEvidenceRefs: [
        "evidence://outcome-valence-feedback-context-content/t13e/alternate-provenance",
      ],
    },
  );
  const alternateBinding = await createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(
    exactReader(baseCareerDecisionContextRevision),
  ).bind(alternateTargetDeclaration, { createdAt: "2027-02-13T00:00:01.000Z" });
  const alternateRepresentation = createCareerOutcomeValenceFeedbackReturnRepresentation(
    alternateBinding,
    { createdAt: "2027-02-13T00:00:02.000Z" },
  );
  const secondFeedbackReturnItem = createCareerOutcomeValenceFeedbackReturnItem(
    alternateRepresentation,
    { createdAt: "2027-02-13T00:00:03.000Z" },
  );

  return {
    ...first,
    baseCareerDecisionContextRevision,
    firstFeedbackReturnItem,
    secondFeedbackReturnItem,
    contentInput: { createdAt: "2027-02-13T01:00:00.000Z" },
  };
}
