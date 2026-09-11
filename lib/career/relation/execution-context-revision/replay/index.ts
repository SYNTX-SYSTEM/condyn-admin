import {
  assertCareerDecisionActionIntent,
  type CareerDecisionActionIntent,
} from "../../action-intent";
import {
  assertDecisionAuthorityGrantRevision,
  type DecisionAuthorityGrantRevision,
} from "../../decision-authority";
import {
  assertCareerDecisionContextRevision,
  type CareerDecisionContextRevision,
} from "../../decision-context";
import {
  assertHumanDecisionRecord,
  assertHumanDecisionWitnesses,
  type HumanDecisionRecord,
} from "../../decision-record";
import {
  assertCareerExecutionAuthorityGrantRevision,
  type CareerExecutionAuthorityGrantRevision,
} from "../../execution-authority-grant";
import {
  assertCareerHumanCommitment,
  type CareerHumanCommitment,
} from "../../human-commitment";
import {
  assertRecommendationProposal,
  type RecommendationProposal,
} from "../../recommendation-proposal";
import {
  assertCareerExecutionContextRevision,
  deriveCareerExecutionContextRevisionId,
  type CareerExecutionContextRevision,
} from "..";

const fail = (): never => {
  throw new Error("ERR_CAREER_EXECUTION_CONTEXT_REVISION_REPLAY_MISMATCH");
};
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);
const expectedScope: Record<string, string> = {
  RECOMMENDATION_OPERATIONALIZATION: "RECOMMENDATION_OPERATION_EXECUTION",
  FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION: "FURTHER_EVIDENCE_REQUEST_EXECUTION",
  TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION: "TARGET_CLARIFICATION_REQUEST_EXECUTION",
};

export interface CareerExecutionContextRevisionReplayDependencies {
  contexts: { getCareerExecutionContextRevisionById(id: string): Promise<CareerExecutionContextRevision | null> };
  grants: { getCareerExecutionAuthorityGrantRevisionById(id: string): Promise<CareerExecutionAuthorityGrantRevision | null> };
  commitments: { getCareerHumanCommitmentById(id: string): Promise<CareerHumanCommitment | null> };
  intents: { getCareerDecisionActionIntentById(id: string): Promise<CareerDecisionActionIntent | null> };
  records: { getHumanDecisionRecordById(id: string): Promise<HumanDecisionRecord | null> };
  decisionContexts: { getCareerDecisionContextRevisionById(id: string): Promise<CareerDecisionContextRevision | null> };
  authorities: { getDecisionAuthorityGrantRevisionById(id: string): Promise<DecisionAuthorityGrantRevision | null> };
  proposals: { getRecommendationProposalById(id: string): Promise<RecommendationProposal | null> };
}

async function stored(
  id: string,
  dependencies: CareerExecutionContextRevisionReplayDependencies,
): Promise<CareerExecutionContextRevision> {
  try {
    const value = await dependencies.contexts.getCareerExecutionContextRevisionById(id);
    if (!value) throw new Error("ERR_CAREER_EXECUTION_CONTEXT_REVISION_NOT_FOUND");
    assertCareerExecutionContextRevision(value);
    return value;
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_CAREER_EXECUTION_CONTEXT_REVISION_NOT_FOUND") throw error;
    return fail();
  }
}

async function validate(
  id: string,
  dependencies: CareerExecutionContextRevisionReplayDependencies,
): Promise<CareerExecutionContextRevision> {
  const value = await stored(id, dependencies);
  try {
    const grant = await dependencies.grants.getCareerExecutionAuthorityGrantRevisionById(
      value.careerExecutionAuthorityGrantRevisionId,
    );
    if (!grant) return fail();
    assertCareerExecutionAuthorityGrantRevision(grant);
    const commitment = await dependencies.commitments.getCareerHumanCommitmentById(
      grant.careerHumanCommitmentId,
    );
    if (!commitment) return fail();
    assertCareerHumanCommitment(commitment);
    const intent = await dependencies.intents.getCareerDecisionActionIntentById(
      commitment.careerDecisionActionIntentId,
    );
    if (!intent) return fail();
    assertCareerDecisionActionIntent(intent);
    const record = await dependencies.records.getHumanDecisionRecordById(intent.humanDecisionRecordId);
    if (!record) return fail();
    assertHumanDecisionRecord(record);
    const [decisionContext, authority, proposal] = await Promise.all([
      dependencies.decisionContexts.getCareerDecisionContextRevisionById(record.careerDecisionContextRevisionId),
      dependencies.authorities.getDecisionAuthorityGrantRevisionById(record.decisionAuthorityGrantRevisionId),
      dependencies.proposals.getRecommendationProposalById(record.recommendationProposalId),
    ]);
    if (!decisionContext || !authority || !proposal) return fail();
    assertCareerDecisionContextRevision(decisionContext);
    assertDecisionAuthorityGrantRevision(authority);
    assertRecommendationProposal(proposal);
    assertHumanDecisionWitnesses(record, decisionContext, authority, proposal);
    if (
      commitment.careerDecisionActionIntentId !== intent.careerDecisionActionIntentId ||
      commitment.humanDecisionRecordId !== intent.humanDecisionRecordId ||
      commitment.careerDecisionContextRevisionId !== intent.careerDecisionContextRevisionId ||
      commitment.decisionAuthorityGrantRevisionId !== intent.decisionAuthorityGrantRevisionId ||
      commitment.recommendationProposalId !== intent.recommendationProposalId ||
      commitment.committedByActorId !== intent.declaredByActorId ||
      commitment.sourceDeclarationClass !== intent.sourceDeclarationClass ||
      commitment.sourceActionIntentClass !== intent.actionIntentClass ||
      commitment.operationDescription !== intent.operationDescription ||
      !sameInventory(commitment.decisionSubjects.map(subjectKey), intent.decisionSubjects.map(subjectKey)) ||
      commitment.committedAt < intent.declaredAt ||
      grant.careerHumanCommitmentId !== commitment.careerHumanCommitmentId ||
      grant.humanDecisionRecordId !== commitment.humanDecisionRecordId ||
      grant.careerDecisionActionIntentId !== commitment.careerDecisionActionIntentId ||
      grant.careerDecisionContextRevisionId !== commitment.careerDecisionContextRevisionId ||
      grant.decisionAuthorityGrantRevisionId !== commitment.decisionAuthorityGrantRevisionId ||
      grant.recommendationProposalId !== commitment.recommendationProposalId ||
      grant.sourceDeclarationClass !== commitment.sourceDeclarationClass ||
      grant.sourceActionIntentClass !== commitment.sourceActionIntentClass ||
      grant.operationDescription !== commitment.operationDescription ||
      !sameInventory(grant.decisionSubjects.map(subjectKey), commitment.decisionSubjects.map(subjectKey)) ||
      grant.executionAuthorityScope !== expectedScope[commitment.sourceActionIntentClass] ||
      grant.declaredAt < commitment.committedAt ||
      grant.effectiveFrom < grant.declaredAt ||
      (grant.effectiveUntil !== null && grant.effectiveUntil <= grant.effectiveFrom) ||
      value.careerExecutionAuthorityGrantRevisionId !== grant.careerExecutionAuthorityGrantRevisionId ||
      value.careerHumanCommitmentId !== grant.careerHumanCommitmentId ||
      value.careerDecisionActionIntentId !== grant.careerDecisionActionIntentId ||
      value.humanDecisionRecordId !== grant.humanDecisionRecordId ||
      value.careerDecisionContextRevisionId !== grant.careerDecisionContextRevisionId ||
      value.decisionAuthorityGrantRevisionId !== grant.decisionAuthorityGrantRevisionId ||
      value.recommendationProposalId !== grant.recommendationProposalId ||
      value.sourceDeclarationClass !== grant.sourceDeclarationClass ||
      value.sourceActionIntentClass !== grant.sourceActionIntentClass ||
      value.operationDescription !== grant.operationDescription ||
      value.executionAuthorityScope !== grant.executionAuthorityScope ||
      !sameInventory(value.decisionSubjects.map(subjectKey), grant.decisionSubjects.map(subjectKey)) ||
      value.declaredByActorId !== grant.authorizedExecutionActorId ||
      !grant.permittedTargetKinds.includes(value.executionTarget.targetKind) ||
      !grant.permittedChannelKinds.includes(value.executionChannel.channelKind) ||
      value.declaredAt < grant.declaredAt ||
      value.declaredAt < grant.effectiveFrom ||
      (grant.effectiveUntil !== null && value.declaredAt >= grant.effectiveUntil)
    ) return fail();
    const { careerExecutionContextRevisionId, createdAt: _createdAt, ...semantic } = value;
    if (careerExecutionContextRevisionId !== deriveCareerExecutionContextRevisionId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}

/** BYTE replay reads persisted ECTXREV history only; it never reads EAGR or regenerates context. */
export async function byteReplayCareerExecutionContextRevision(
  id: string,
  dependencies: CareerExecutionContextRevisionReplayDependencies,
) {
  return structuredClone(await stored(id, dependencies));
}

/** Semantic replay validates the exact ECTXREV historical chain without resolving target/channel refs. */
export async function semanticReplayCareerExecutionContextRevision(
  id: string,
  dependencies: CareerExecutionContextRevisionReplayDependencies,
) {
  return validate(id, dependencies);
}

/** Identity-only replay validates persisted ECTXREV identity and never reconstructs missing context. */
export async function derivationReplayCareerExecutionContextRevision(
  id: string,
  dependencies: CareerExecutionContextRevisionReplayDependencies,
) {
  const value = await stored(id, dependencies);
  try {
    const { careerExecutionContextRevisionId, createdAt: _createdAt, ...semantic } = value;
    if (careerExecutionContextRevisionId !== deriveCareerExecutionContextRevisionId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}
