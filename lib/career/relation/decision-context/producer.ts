import type { DecisionAuthorityGrantRevisionRepository } from "../decision-authority";
import type { RecommendationProposalRepository } from "../recommendation-proposal";
import { createCareerDecisionContextRevision } from "./contract";
import type { CareerDecisionContextRevisionRepository } from "./persistence";
import type { CareerDecisionContextRevisionInput } from "./types";

const fail = (code: string): never => { throw new Error(code); };

export interface CareerDecisionContextProducerDependencies {
  authorities: DecisionAuthorityGrantRevisionRepository;
  proposals: RecommendationProposalRepository;
  contexts: CareerDecisionContextRevisionRepository;
}

/** Production accepts exact IDs only, then persists and rereads one historical structural context. */
export async function produceAndPersistCareerDecisionContextRevision(input: CareerDecisionContextRevisionInput, dependencies: CareerDecisionContextProducerDependencies) {
  let authority;
  try { authority = await dependencies.authorities.getDecisionAuthorityGrantRevisionById(input.decisionAuthorityGrantRevisionId); } catch { fail("ERR_CAREER_DECISION_CONTEXT_AUTHORITY_GRANT_INVALID"); }
  const exactAuthority = authority ?? fail("ERR_CAREER_DECISION_CONTEXT_AUTHORITY_GRANT_NOT_FOUND");
  let proposal;
  try { proposal = await dependencies.proposals.getRecommendationProposalById(input.recommendationProposalId); } catch { fail("ERR_CAREER_DECISION_CONTEXT_RECOMMENDATION_PROPOSAL_INVALID"); }
  const exactProposal = proposal ?? fail("ERR_CAREER_DECISION_CONTEXT_RECOMMENDATION_PROPOSAL_NOT_FOUND");
  const value = createCareerDecisionContextRevision(exactAuthority, exactProposal, input);
  try {
    const persisted = await dependencies.contexts.persistCareerDecisionContextRevision(value);
    if (JSON.stringify(persisted) !== JSON.stringify(value)) fail("ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED");
    return persisted;
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_CAREER_DECISION_CONTEXT_IMMUTABLE_CONFLICT") throw error;
    return fail("ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED");
  }
}
