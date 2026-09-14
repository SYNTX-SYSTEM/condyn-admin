import {
  createCareerDecisionContextRevision,
} from "../../../../lib/career/relation/decision-context";
import {
  createCareerOutcomeValenceFeedbackAdmissionDeclaration,
} from "../../../../lib/career/relation/outcome-valence-feedback-admission-declaration";
import {
  createCareerOutcomeValenceDeclaration,
  type CareerOutcomeValence,
} from "../../../../lib/career/relation/outcome-valence-declaration";
import {
  createCareerOutcomeValenceFeedbackTargetDeclaration,
} from "../../../../lib/career/relation/outcome-valence-feedback-target-declaration";
import {
  createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder,
} from "../../../../lib/career/relation/outcome-valence-feedback-target-revision-binding";
import { createT13AHistoricalFixture } from "../outcome-valence-feedback-target-declaration/t13a-historical-fixture";

function exactReader(value: unknown) {
  return {
    async getCareerDecisionContextRevisionById() {
      return structuredClone(value);
    },
  };
}

/** Builds one exact sealed COVFTRB history for a requested valid subjective valence. */
export async function createT13CHistoricalFixture(
  valence: CareerOutcomeValence = "DESIRABLE",
) {
  const t13a = createT13AHistoricalFixture();
  const targetCareerDecisionContextRevision = createCareerDecisionContextRevision(
    t13a.authority,
    t13a.proposal,
    {
      decisionAuthorityGrantRevisionId: t13a.authority.decisionAuthorityGrantRevisionId,
      recommendationProposalId: t13a.proposal.recommendationProposalId,
      decisionSubjects: t13a.context.decisionSubjects,
      contextEvidenceRefs: ["evidence://outcome-valence-feedback-return-representation/t13c/base"],
      createdAt: "2027-02-11T01:00:00.000Z",
    },
  );
  const outcomeValenceDeclaration = createCareerOutcomeValenceDeclaration(
    t13a.outcomeRoleDeclaration,
    { ...t13a.outcomeValenceDeclarationInput, valence },
  );
  const outcomeValenceFeedbackAdmissionDeclaration =
    createCareerOutcomeValenceFeedbackAdmissionDeclaration(
      outcomeValenceDeclaration,
      {
        ...t13a.outcomeValenceFeedbackAdmissionDeclarationInput,
        careerOutcomeValenceDeclarationId:
          outcomeValenceDeclaration.careerOutcomeValenceDeclarationId,
      },
    );
  const outcomeValenceFeedbackTargetDeclaration =
    createCareerOutcomeValenceFeedbackTargetDeclaration(
      outcomeValenceFeedbackAdmissionDeclaration,
      {
        ...t13a.outcomeValenceFeedbackTargetDeclarationInput,
        careerOutcomeValenceFeedbackAdmissionDeclarationId:
          outcomeValenceFeedbackAdmissionDeclaration
            .careerOutcomeValenceFeedbackAdmissionDeclarationId,
        targetCareerDecisionContextRevisionId:
          targetCareerDecisionContextRevision.careerDecisionContextRevisionId,
      },
    );
  const careerOutcomeValenceFeedbackTargetRevisionBinding =
    await createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(
      exactReader(targetCareerDecisionContextRevision),
    ).bind(outcomeValenceFeedbackTargetDeclaration, {
      createdAt: "2027-02-11T01:00:01.000Z",
    });

  return {
    ...t13a,
    outcomeValenceDeclaration,
    outcomeValenceFeedbackAdmissionDeclaration,
    outcomeValenceFeedbackTargetDeclaration,
    targetCareerDecisionContextRevision,
    careerOutcomeValenceFeedbackTargetRevisionBinding,
    representationInput: { createdAt: "2027-02-11T01:00:02.000Z" },
  };
}
