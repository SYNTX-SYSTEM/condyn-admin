import { createCareerOutcomeValenceDeclaration } from "../../../../lib/career/relation/outcome-valence-declaration";
import { createT12IHistoricalFixture } from "../outcome-valence-declaration/t12i-historical-fixture";

/** Builds sealed history through the explicit T12I valence declaration only. */
export function createT12JHistoricalFixture() {
  const t12i = createT12IHistoricalFixture();
  const outcomeValenceDeclaration = createCareerOutcomeValenceDeclaration(
    t12i.outcomeRoleDeclaration,
    t12i.outcomeValenceDeclarationInput,
  );
  return {
    ...t12i,
    outcomeValenceDeclaration,
    outcomeValenceFeedbackAdmissionDeclarationInput: {
      careerOutcomeValenceDeclarationId:
        outcomeValenceDeclaration.careerOutcomeValenceDeclarationId,
      admittedByActorId: "OUTCOME_VALENCE_ADMITTING_ACTOR_T12J",
      // Admission chronology only. EAGR applies to the earlier AOC occurrence.
      admittedAt: "2027-02-08T01:00:00.000Z",
      admissionEvidenceRefs: [
        "evidence://outcome-valence-feedback-admission/t12j/b",
        "evidence://outcome-valence-feedback-admission/t12j/a",
      ],
      createdAt: "2027-02-08T01:00:01.000Z",
    },
  };
}
