import { createCareerOutcomeValenceFeedbackAdmissionDeclaration } from "../../../../lib/career/relation/outcome-valence-feedback-admission-declaration";
import { createT12JHistoricalFixture } from "../outcome-valence-feedback-admission-declaration/t12j-historical-fixture";

/** Builds sealed history through the explicit T12J admission declaration only. */
export function createT13AHistoricalFixture() {
  const t12j = createT12JHistoricalFixture();
  const outcomeValenceFeedbackAdmissionDeclaration =
    createCareerOutcomeValenceFeedbackAdmissionDeclaration(
      t12j.outcomeValenceDeclaration,
      t12j.outcomeValenceFeedbackAdmissionDeclarationInput,
    );

  return {
    ...t12j,
    outcomeValenceFeedbackAdmissionDeclaration,
    outcomeValenceFeedbackTargetDeclarationInput: {
      careerOutcomeValenceFeedbackAdmissionDeclarationId:
        outcomeValenceFeedbackAdmissionDeclaration
          .careerOutcomeValenceFeedbackAdmissionDeclarationId,
      targetCareerDecisionContextRevisionId:
        "DCTXREV_0123456789ABCDEF0123456789ABCDEF",
      declaredByActorId: "OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARING_ACTOR_T13A",
      // Target declaration chronology only. EAGR applies to the earlier AOC occurrence.
      declaredAt: "2027-02-09T01:00:00.000Z",
      targetSelectionEvidenceRefs: [
        "evidence://outcome-valence-feedback-target/t13a/b",
        "evidence://outcome-valence-feedback-target/t13a/a",
      ],
      createdAt: "2027-02-09T01:00:01.000Z",
    },
  };
}
