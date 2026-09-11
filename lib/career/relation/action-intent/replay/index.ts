import {
  assertCareerDecisionActionIntent,
  deriveCareerDecisionActionIntentId,
  type CareerDecisionActionIntent,
} from "..";
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

const fail = (): never => { throw new Error("ERR_CAREER_DECISION_ACTION_INTENT_REPLAY_MISMATCH"); };
const subjectKey = (subject: { recommendationProposalId: string; sourceEvolutionInputItemOrdinal: number }) =>
  `${subject.recommendationProposalId}:${String(subject.sourceEvolutionInputItemOrdinal).padStart(12, "0")}`;
const sameInventory = (left: readonly string[], right: readonly string[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export interface CareerDecisionActionIntentReplayDependencies {
  intents: { getCareerDecisionActionIntentById(id: string): Promise<CareerDecisionActionIntent | null> };
  records: { getHumanDecisionRecordById(id: string): Promise<HumanDecisionRecord | null> };
  contexts: { getCareerDecisionContextRevisionById(id: string): Promise<CareerDecisionContextRevision | null> };
  authorities: { getDecisionAuthorityGrantRevisionById(id: string): Promise<DecisionAuthorityGrantRevision | null> };
  proposals: { getRecommendationProposalById(id: string): Promise<RecommendationProposal | null> };
}

async function stored(id: string, dependencies: CareerDecisionActionIntentReplayDependencies): Promise<CareerDecisionActionIntent> {
  try {
    const value = await dependencies.intents.getCareerDecisionActionIntentById(id);
    if (!value) throw new Error("ERR_CAREER_DECISION_ACTION_INTENT_NOT_FOUND");
    assertCareerDecisionActionIntent(value);
    return value;
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_CAREER_DECISION_ACTION_INTENT_NOT_FOUND") throw error;
    return fail();
  }
}

async function validate(id: string, dependencies: CareerDecisionActionIntentReplayDependencies): Promise<CareerDecisionActionIntent> {
  const value = await stored(id, dependencies);
  try {
    // Semantic replay validates the historical DCR chain; it does not create a new human declaration.
    const record = await dependencies.records.getHumanDecisionRecordById(value.humanDecisionRecordId);
    if (!record) return fail();
    assertHumanDecisionRecord(record);
    const [context, authority, proposal] = await Promise.all([
      dependencies.contexts.getCareerDecisionContextRevisionById(record.careerDecisionContextRevisionId),
      dependencies.authorities.getDecisionAuthorityGrantRevisionById(record.decisionAuthorityGrantRevisionId),
      dependencies.proposals.getRecommendationProposalById(record.recommendationProposalId),
    ]);
    if (!context || !authority || !proposal) return fail();
    assertCareerDecisionContextRevision(context);
    assertDecisionAuthorityGrantRevision(authority);
    assertRecommendationProposal(proposal);
    assertHumanDecisionWitnesses(record, context, authority, proposal);
    if (
      record.humanDecisionRecordId !== value.humanDecisionRecordId ||
      record.careerDecisionContextRevisionId !== value.careerDecisionContextRevisionId ||
      record.decisionAuthorityGrantRevisionId !== value.decisionAuthorityGrantRevisionId ||
      record.recommendationProposalId !== value.recommendationProposalId ||
      record.declarantActorId !== value.declaredByActorId ||
      record.declarationClass !== value.sourceDeclarationClass ||
      !sameInventory(record.decisionSubjects.map(subjectKey), value.decisionSubjects.map(subjectKey)) ||
      value.declaredAt < record.declaredAt
    ) return fail();
    const { careerDecisionActionIntentId, createdAt: _createdAt, ...semantic } = value;
    if (careerDecisionActionIntentId !== deriveCareerDecisionActionIntentId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}

export async function byteReplayCareerDecisionActionIntent(id: string, dependencies: CareerDecisionActionIntentReplayDependencies) {
  return structuredClone(await stored(id, dependencies));
}

export async function semanticReplayCareerDecisionActionIntent(id: string, dependencies: CareerDecisionActionIntentReplayDependencies) {
  return validate(id, dependencies);
}

/** Identity-only replay recomputes persisted DAINT identity and never recreates missing human history. */
export async function derivationReplayCareerDecisionActionIntent(id: string, dependencies: CareerDecisionActionIntentReplayDependencies) {
  const value = await stored(id, dependencies);
  try {
    const { careerDecisionActionIntentId, createdAt: _createdAt, ...semantic } = value;
    if (careerDecisionActionIntentId !== deriveCareerDecisionActionIntentId(semantic)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}
