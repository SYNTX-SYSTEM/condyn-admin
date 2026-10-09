import type { DecisionAuthorityGrantRevision } from "../../decision-authority";
import {
  assertCareerDecisionContextRevision,
  assertCareerDecisionContextWitnesses,
  type CareerDecisionContextRevision,
} from "../../decision-context";
import type { RecommendationProposal } from "../../recommendation-proposal";
import {
  assertCareerDecisionContextDecisionRevisionBinding,
  deriveCareerDecisionContextDecisionRevisionBindingId,
  stableCareerDecisionContextDecisionRevisionBinding,
} from "../contract";
import type { CareerDecisionContextDecisionRevisionBinding } from "../types";

const notFound = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_NOT_FOUND";
const mismatch = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_REPLAY_MISMATCH";
const fail = (): never => { throw new Error(mismatch); };

export const CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_REPLAY_MODES = [
  "BYTE_REPLAY", "SEMANTIC_REPLAY", "DERIVATION_REPLAY",
] as const;

export interface CareerDecisionContextDecisionRevisionBindingReplayDependencies {
  bindings: {
    getCareerDecisionContextDecisionRevisionBindingById(id: string): Promise<CareerDecisionContextDecisionRevisionBinding | null>;
  };
  decisionContexts: {
    getCareerDecisionContextRevisionById(id: string): Promise<CareerDecisionContextRevision | null>;
  };
  decisionRevisions: {
    getDecisionContextRevisionById(id: string): Promise<unknown>;
  };
  authorities: {
    getDecisionAuthorityGrantRevisionById(id: string): Promise<DecisionAuthorityGrantRevision | null>;
  };
  proposals: {
    getRecommendationProposalById(id: string): Promise<RecommendationProposal | null>;
  };
}

async function stored(id: string, dependencies: CareerDecisionContextDecisionRevisionBindingReplayDependencies) {
  try {
    const value = await dependencies.bindings.getCareerDecisionContextDecisionRevisionBindingById(id);
    if (!value) throw new Error(notFound);
    assertCareerDecisionContextDecisionRevisionBinding(value);
    if (value.careerDecisionContextDecisionRevisionBindingId !== id) return fail();
    return structuredClone(value);
  } catch (error) {
    if (error instanceof Error && error.message === notFound) throw error;
    return fail();
  }
}

/** Stored bytes re-asserted only. STORED != CURRENT. */
export async function byteReplayCareerDecisionContextDecisionRevisionBinding(
  id: string,
  dependencies: CareerDecisionContextDecisionRevisionBindingReplayDependencies,
) {
  return structuredClone(await stored(id, dependencies));
}

/** Identity recomputed from the stored bodies alone; no parent read. */
export async function derivationReplayCareerDecisionContextDecisionRevisionBinding(
  id: string,
  dependencies: CareerDecisionContextDecisionRevisionBindingReplayDependencies,
) {
  const value = await stored(id, dependencies);
  try {
    const { createdAt: _contextCreatedAt, ...contextBody } = value.careerDecisionContextRevision;
    if (value.careerDecisionContextDecisionRevisionBindingId !== deriveCareerDecisionContextDecisionRevisionBindingId({
      careerDecisionContextRevision: contextBody,
      decisionContextRevision: value.decisionContextRevision,
      recommendationProposalWitness: value.recommendationProposalWitness,
      schemaVersion: value.schemaVersion,
    })) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}

/**
 * Both bound sides are re-read by exact id and must equal the stored witnesses
 * exactly; the Career context witnesses (DAR, RCP) are re-asserted. Equality
 * of a re-read is not currentness, acceptance, or a sole-child claim.
 */
export async function semanticReplayCareerDecisionContextDecisionRevisionBinding(
  id: string,
  dependencies: CareerDecisionContextDecisionRevisionBindingReplayDependencies,
) {
  const value = await stored(id, dependencies);
  try {
    const context = await dependencies.decisionContexts.getCareerDecisionContextRevisionById(
      value.careerDecisionContextRevision.careerDecisionContextRevisionId,
    );
    if (!context) return fail();
    assertCareerDecisionContextRevision(context);
    if (stableCareerDecisionContextDecisionRevisionBinding(context) !== stableCareerDecisionContextDecisionRevisionBinding(value.careerDecisionContextRevision)) return fail();
    const [authority, proposal] = await Promise.all([
      dependencies.authorities.getDecisionAuthorityGrantRevisionById(context.decisionAuthorityGrantRevisionId),
      dependencies.proposals.getRecommendationProposalById(context.recommendationProposalId),
    ]);
    if (!authority || !proposal) return fail();
    assertCareerDecisionContextWitnesses(context, authority, proposal);
    const revision = await dependencies.decisionRevisions.getDecisionContextRevisionById(value.decisionContextRevision.revisionId);
    if (revision === null || revision === undefined) return fail();
    if (stableCareerDecisionContextDecisionRevisionBinding(revision) !== stableCareerDecisionContextDecisionRevisionBinding(value.decisionContextRevision)) return fail();
    return structuredClone(value);
  } catch {
    return fail();
  }
}
