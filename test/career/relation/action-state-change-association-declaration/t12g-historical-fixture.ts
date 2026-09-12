import { createCareerActionStateChangeAssociationDeclaration } from "../../../../lib/career/relation/action-state-change-association-declaration";
import { createT12FHistoricalFixture, exactRepository } from "../state-change-declaration/t12f-historical-fixture";

/** Builds canonical history through an explicit, non-causal T12G association declaration. */
export function createT12GHistoricalFixture() {
  const t12f = createT12FHistoricalFixture();
  const associationDeclaration = createCareerActionStateChangeAssociationDeclaration(t12f.stateChangeDeclaration, {
    careerStateChangeDeclarationId: t12f.stateChangeDeclaration.careerStateChangeDeclarationId,
    declaredByActorId: "ASSOCIATION_DECLARANT_T12G",
    // This is declaration chronology only. EAGR applies to the earlier AOC occurrence.
    declaredAt: "2027-02-05T01:00:00.000Z",
    associationEvidenceRefs: ["evidence://association/t12g/b", "evidence://association/t12g/a"],
    createdAt: "2027-02-05T01:00:01.000Z",
  });
  return { ...t12f, associationDeclaration };
}

export { exactRepository };
