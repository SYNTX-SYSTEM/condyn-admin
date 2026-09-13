import {
  assertCareerDecisionContextRevision,
  assertCareerDecisionContextWitnesses,
} from "../../decision-context";
import {
  deriveCareerOutcomeValenceFeedbackTargetRevisionBindingId,
  assertCareerOutcomeValenceFeedbackTargetRevisionBinding,
  type CareerOutcomeValenceFeedbackTargetRevisionBinding,
} from "..";
import {
  semanticReplayCareerOutcomeValenceFeedbackTargetDeclaration,
  type CareerOutcomeValenceFeedbackTargetDeclarationReplayDependencies,
} from "../../outcome-valence-feedback-target-declaration/replay";

const notFound = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_NOT_FOUND";
const mismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_REPLAY_MISMATCH";
const fail = (): never => { throw new Error(mismatch); };

export const CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_REPLAY_MODES = [
  "BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY",
] as const;

export interface CareerOutcomeValenceFeedbackTargetRevisionBindingReplayDependencies
extends CareerOutcomeValenceFeedbackTargetDeclarationReplayDependencies {
  bindings: {
    getCareerOutcomeValenceFeedbackTargetRevisionBindingById(id: string): Promise<CareerOutcomeValenceFeedbackTargetRevisionBinding | null>;
  };
}

async function stored(id: string, dependencies: CareerOutcomeValenceFeedbackTargetRevisionBindingReplayDependencies) {
  try {
    const value = await dependencies.bindings.getCareerOutcomeValenceFeedbackTargetRevisionBindingById(id);
    if (!value) throw new Error(notFound);
    assertCareerOutcomeValenceFeedbackTargetRevisionBinding(value);
    if (value.careerOutcomeValenceFeedbackTargetRevisionBindingId !== id) return fail();
    return structuredClone(value);
  } catch (error) {
    if (error instanceof Error && error.message === notFound) throw error;
    return fail();
  }
}

export async function byteReplayCareerOutcomeValenceFeedbackTargetRevisionBinding(id: string, dependencies: CareerOutcomeValenceFeedbackTargetRevisionBindingReplayDependencies) {
  return structuredClone(await stored(id, dependencies));
}

export async function derivationReplayCareerOutcomeValenceFeedbackTargetRevisionBinding(id: string, dependencies: CareerOutcomeValenceFeedbackTargetRevisionBindingReplayDependencies) {
  const value = await stored(id, dependencies);
  try {
    const { careerOutcomeValenceFeedbackTargetRevisionBindingId, createdAt: _createdAt, ...body } = value;
    const { createdAt: _declarationCreatedAt, ...declaration } = body.careerOutcomeValenceFeedbackTargetDeclaration;
    const { createdAt: _revisionCreatedAt, ...target } = body.targetCareerDecisionContextRevision;
    if (careerOutcomeValenceFeedbackTargetRevisionBindingId !== deriveCareerOutcomeValenceFeedbackTargetRevisionBindingId({
      careerOutcomeValenceFeedbackTargetDeclaration: declaration,
      targetCareerDecisionContextRevision: target,
      schemaVersion: body.schemaVersion,
    })) return fail();
    return structuredClone(value);
  } catch { return fail(); }
}

export async function semanticReplayCareerOutcomeValenceFeedbackTargetRevisionBinding(id: string, dependencies: CareerOutcomeValenceFeedbackTargetRevisionBindingReplayDependencies) {
  const value = await stored(id, dependencies);
  try {
    const declaration = await semanticReplayCareerOutcomeValenceFeedbackTargetDeclaration(
      value.careerOutcomeValenceFeedbackTargetDeclaration.careerOutcomeValenceFeedbackTargetDeclarationId,
      dependencies,
    );
    if (JSON.stringify(declaration) !== JSON.stringify(value.careerOutcomeValenceFeedbackTargetDeclaration)) return fail();
    const target = value.targetCareerDecisionContextRevision;
    assertCareerDecisionContextRevision(target);
    const [authority, proposal] = await Promise.all([
      dependencies.authorities.getDecisionAuthorityGrantRevisionById(target.decisionAuthorityGrantRevisionId),
      dependencies.proposals.getRecommendationProposalById(target.recommendationProposalId),
    ]);
    if (!authority || !proposal) return fail();
    assertCareerDecisionContextWitnesses(target, authority, proposal);
    return structuredClone(value);
  } catch { return fail(); }
}
