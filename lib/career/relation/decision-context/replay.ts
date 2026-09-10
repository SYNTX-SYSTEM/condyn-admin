import type { DecisionAuthorityGrantRevisionRepository } from "../decision-authority";
import type { RecommendationProposalRepository } from "../recommendation-proposal";
import { createCareerDecisionContextRevision, sameCareerDecisionContext } from "./contract";
import type { CareerDecisionContextRevisionRepository } from "./persistence";
import type { CareerDecisionContextRevision } from "./types";

const fail = (code: string): never => { throw new Error(code); };
export interface CareerDecisionContextReplayDependencies {
  contexts: CareerDecisionContextRevisionRepository;
  authorities: DecisionAuthorityGrantRevisionRepository;
  proposals: RecommendationProposalRepository;
}

async function stored(id: string, dependencies: CareerDecisionContextReplayDependencies): Promise<CareerDecisionContextRevision> {
  try {
    const value = await dependencies.contexts.getCareerDecisionContextRevisionById(id);
    return value ?? fail("ERR_CAREER_DECISION_CONTEXT_NOT_FOUND");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_CAREER_DECISION_CONTEXT_NOT_FOUND") throw error;
    return fail("ERR_CAREER_DECISION_CONTEXT_REPLAY_MISMATCH");
  }
}

async function rebuild(id: string, dependencies: CareerDecisionContextReplayDependencies) {
  const value = await stored(id, dependencies);
  try {
    const [authority, proposal] = await Promise.all([
      dependencies.authorities.getDecisionAuthorityGrantRevisionById(value.decisionAuthorityGrantRevisionId),
      dependencies.proposals.getRecommendationProposalById(value.recommendationProposalId)
    ]);
    const exactAuthority = authority ?? fail("ERR_CAREER_DECISION_CONTEXT_AUTHORITY_GRANT_NOT_FOUND");
    const exactProposal = proposal ?? fail("ERR_CAREER_DECISION_CONTEXT_RECOMMENDATION_PROPOSAL_NOT_FOUND");
    const rebuilt = createCareerDecisionContextRevision(exactAuthority, exactProposal, {
      decisionAuthorityGrantRevisionId: value.decisionAuthorityGrantRevisionId,
      recommendationProposalId: value.recommendationProposalId,
      decisionSubjects: value.decisionSubjects,
      contextEvidenceRefs: value.contextEvidenceRefs,
      createdAt: value.createdAt
    });
    if (!sameCareerDecisionContext(value, rebuilt)) fail("ERR_CAREER_DECISION_CONTEXT_REPLAY_MISMATCH");
    return rebuilt;
  } catch (error) {
    if (error instanceof Error && (error.message === "ERR_CAREER_DECISION_CONTEXT_AUTHORITY_GRANT_NOT_FOUND" || error.message === "ERR_CAREER_DECISION_CONTEXT_RECOMMENDATION_PROPOSAL_NOT_FOUND")) throw error;
    return fail("ERR_CAREER_DECISION_CONTEXT_REPLAY_MISMATCH");
  }
}

export async function byteReplayCareerDecisionContextRevision(id: string, dependencies: CareerDecisionContextReplayDependencies) { return structuredClone(await stored(id, dependencies)); }
export async function semanticReplayCareerDecisionContextRevision(id: string, dependencies: CareerDecisionContextReplayDependencies) { return rebuild(id, dependencies); }
export async function derivationReplayCareerDecisionContextRevision(id: string, dependencies: CareerDecisionContextReplayDependencies) { return rebuild(id, dependencies); }
