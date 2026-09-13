import {
  assertCareerDecisionContextRevision,
  createCareerDecisionContextRevision,
} from "../../../../lib/career/relation/decision-context";
import {
  assertCareerOutcomeValenceFeedbackTargetDeclaration,
  createCareerOutcomeValenceFeedbackTargetDeclaration,
} from "../../../../lib/career/relation/outcome-valence-feedback-target-declaration";
import { createT13AHistoricalFixture } from "../outcome-valence-feedback-target-declaration/t13a-historical-fixture";

/** Builds sealed history through COVFTD plus an independent immutable prospective DCTXREV. */
export function createT13BHistoricalFixture(useHistoricalContextAsTarget = false) {
  const t13a = createT13AHistoricalFixture();
  const targetCareerDecisionContextRevision = useHistoricalContextAsTarget
    ? t13a.context
    : createCareerDecisionContextRevision(t13a.authority, t13a.proposal, {
      decisionAuthorityGrantRevisionId: t13a.authority.decisionAuthorityGrantRevisionId,
      recommendationProposalId: t13a.proposal.recommendationProposalId,
      decisionSubjects: t13a.context.decisionSubjects,
      contextEvidenceRefs: ["evidence://outcome-valence-feedback-target-revision-binding/t13b/base"],
      createdAt: "2027-02-10T01:00:00.000Z",
    });
  const outcomeValenceFeedbackTargetDeclaration = createCareerOutcomeValenceFeedbackTargetDeclaration(
    t13a.outcomeValenceFeedbackAdmissionDeclaration,
    {
      ...t13a.outcomeValenceFeedbackTargetDeclarationInput,
      targetCareerDecisionContextRevisionId:
        targetCareerDecisionContextRevision.careerDecisionContextRevisionId,
    },
  );

  assertCareerDecisionContextRevision(targetCareerDecisionContextRevision);
  assertCareerOutcomeValenceFeedbackTargetDeclaration(outcomeValenceFeedbackTargetDeclaration);

  return {
    ...t13a,
    targetCareerDecisionContextRevision,
    outcomeValenceFeedbackTargetDeclaration,
    bindingInput: { createdAt: "2027-02-10T01:00:01.000Z" },
  };
}
