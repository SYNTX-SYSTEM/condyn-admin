import { createCareerOutcomeRoleDeclaration } from "../../../../lib/career/relation/outcome-role-declaration";
import { createT12HHistoricalFixture } from "../outcome-role-declaration/t12h-historical-fixture";

/** Builds sealed history through the explicit T12H outcome-role declaration only. */
export function createT12IHistoricalFixture() {
  const t12h = createT12HHistoricalFixture();
  const outcomeRoleDeclaration = createCareerOutcomeRoleDeclaration(
    t12h.associationDeclaration,
    t12h.outcomeRoleDeclarationInput,
  );
  return {
    ...t12h,
    outcomeRoleDeclaration,
    outcomeValenceDeclarationInput: {
      careerOutcomeRoleDeclarationId: outcomeRoleDeclaration.careerOutcomeRoleDeclarationId,
      declaredByActorId: "OUTCOME_VALENCE_DECLARANT_T12I",
      // Declaration chronology only. EAGR applies to the earlier AOC occurrence.
      declaredAt: "2027-02-07T01:00:00.000Z",
      valence: "DESIRABLE" as const,
      valenceEvidenceRefs: ["evidence://outcome-valence/t12i/b", "evidence://outcome-valence/t12i/a"],
      createdAt: "2027-02-07T01:00:01.000Z",
    },
  };
}
