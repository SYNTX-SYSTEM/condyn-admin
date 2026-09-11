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
  assertRecommendationProposal,
  type RecommendationProposal,
} from "../../recommendation-proposal";
import {
  assertCareerHumanCommitment,
  deriveCareerHumanCommitmentId,
  type CareerHumanCommitment,
} from "..";

const fail = (): never => { throw new Error("ERR_CAREER_HUMAN_COMMITMENT_REPLAY_MISMATCH"); };
const subjectKey = (subject: {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}) => `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerHumanCommitmentReplayDependencies {
  commitments: {
    getCareerHumanCommitmentById(id: string): Promise<CareerHumanCommitment | null>;
  };
  intents: {
    getCareerDecisionActionIntentById(id: string): Promise<CareerDecisionActionIntent | null>;
  };
  records: {
    getHumanDecisionRecordById(id: string): Promise<HumanDecisionRecord | null>;
  };
  contexts: {
    getCareerDecisionContextRevisionById(id: string): Promise<CareerDecisionContextRevision | null>;
  };
  authorities: {
    getDecisionAuthorityGrantRevisionById(id: string): Promise<DecisionAuthorityGrantRevision | null>;
  };
  proposals: {
    getRecommendationProposalById(id: string): Promise<RecommendationProposal | null>;
  };
}

async function stored(
  id: string,
  dependencies: CareerHumanCommitmentReplayDependencies,
): Promise<CareerHumanCommitment> {
  try {
    const value = await dependencies.commitments.getCareerHumanCommitmentById(id);
    if (!value) throw new Error("ERR_CAREER_HUMAN_COMMITMENT_NOT_FOUND");
    assertCareerHumanCommitment(value);
    return value;
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_CAREER_HUMAN_COMMITMENT_NOT_FOUND") throw error;
    return fail();
  }
}

async function validate(
  id: string,
  dependencies: CareerHumanCommitmentReplayDependencies,
): Promise<CareerHumanCommitment> {
  const value = await stored(id, dependencies);
  try {
    const intent = await dependencies.intents.getCareerDecisionActionIntentById(
      value.careerDecisionActionIntentId,
    );
    if (!intent) return fail();
    assertCareerDecisionActionIntent(intent);

    const record = await dependencies.records.getHumanDecisionRecordById(
      intent.humanDecisionRecordId,
    );
    if (!record) return fail();
    assertHumanDecisionRecord(record);

    const [context, authority, proposal] = await Promise.all([
      dependencies.contexts.getCareerDecisionContextRevisionById(
        record.careerDecisionContextRevisionId,
      ),
      dependencies.authorities.getDecisionAuthorityGrantRevisionById(
        record.decisionAuthorityGrantRevisionId,
      ),
      dependencies.proposals.getRecommendationProposalById(
        record.recommendationProposalId,
      ),
    ]);
    if (!context || !authority || !proposal) return fail();
    assertCareerDecisionContextRevision(context);
    assertDecisionAuthorityGrantRevision(authority);
    assertRecommendationProposal(proposal);
    assertHumanDecisionWitnesses(record, context, authority, proposal);

    if (
      value.careerDecisionActionIntentId !== intent.careerDecisionActionIntentId ||
      value.humanDecisionRecordId !== intent.humanDecisionRecordId ||
      value.careerDecisionContextRevisionId !== intent.careerDecisionContextRevisionId ||
      value.decisionAuthorityGrantRevisionId !== intent.decisionAuthorityGrantRevisionId ||
      value.recommendationProposalId !== intent.recommendationProposalId ||
      value.committedByActorId !== intent.declaredByActorId ||
      value.sourceDeclarationClass !== intent.sourceDeclarationClass ||
      value.sourceActionIntentClass !== intent.actionIntentClass ||
      value.operationDescription !== intent.operationDescription ||
      !sameInventory(value.decisionSubjects.map(subjectKey), intent.decisionSubjects.map(subjectKey)) ||
      // DAR applicability belongs to DCR declaration, not this later human commitment.
      value.committedAt < intent.declaredAt
    ) return fail();

    const { careerHumanCommitmentId, createdAt: _createdAt, ...semantic } = value;
    if (careerHumanCommitmentId !== deriveCareerHumanCommitmentId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}

/** BYTE replay reads persisted human history only; it never reconstructs HCOM. */
export async function byteReplayCareerHumanCommitment(
  id: string,
  dependencies: CareerHumanCommitmentReplayDependencies,
) {
  return structuredClone(await stored(id, dependencies));
}

/** Semantic replay checks immutable historical lineage and never creates human history. */
export async function semanticReplayCareerHumanCommitment(
  id: string,
  dependencies: CareerHumanCommitmentReplayDependencies,
) {
  return validate(id, dependencies);
}

/** Identity-only replay verifies persisted HCOM fields; a missing HCOM remains missing. */
export async function derivationReplayCareerHumanCommitment(
  id: string,
  dependencies: CareerHumanCommitmentReplayDependencies,
) {
  const value = await stored(id, dependencies);
  try {
    const { careerHumanCommitmentId, createdAt: _createdAt, ...semantic } = value;
    if (careerHumanCommitmentId !== deriveCareerHumanCommitmentId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}
