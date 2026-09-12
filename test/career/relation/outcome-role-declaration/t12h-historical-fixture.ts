import { createT12GHistoricalFixture } from "../action-state-change-association-declaration/t12g-historical-fixture";

/** Builds sealed history through the explicit T12G association declaration only. */
export function createT12HHistoricalFixture() {
  const t12g = createT12GHistoricalFixture();
  return {
    ...t12g,
    outcomeRoleDeclarationInput: {
      careerActionStateChangeAssociationDeclarationId:
        t12g.associationDeclaration.careerActionStateChangeAssociationDeclarationId,
      declaredByActorId: "OUTCOME_ROLE_DECLARANT_T12H",
      // Declaration chronology only. EAGR applies to the earlier AOC occurrence.
      declaredAt: "2027-02-06T01:00:00.000Z",
      outcomeRoleEvidenceRefs: ["evidence://outcome-role/t12h/b", "evidence://outcome-role/t12h/a"],
      createdAt: "2027-02-06T01:00:01.000Z",
    },
  };
}
