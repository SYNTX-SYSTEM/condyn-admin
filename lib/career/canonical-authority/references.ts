import { assertCareerActionOccurrence, type CareerActionOccurrence } from "../relation/action-occurrence";
import {
  assertCareerActionStateChangeAssociationDeclaration,
  type CareerActionStateChangeAssociationDeclaration,
} from "../relation/action-state-change-association-declaration";
import { assertCareerOutcomeRoleDeclaration, type CareerOutcomeRoleDeclaration } from "../relation/outcome-role-declaration";
import { assertCareerOutcomeValenceDeclaration, type CareerOutcomeValenceDeclaration } from "../relation/outcome-valence-declaration";
import {
  assertCareerOutcomeValenceFeedbackContextRevision,
  type CareerOutcomeValenceFeedbackContextRevision,
} from "../relation/outcome-valence-feedback-context-revision";
import { assertRecommendationProposal, type RecommendationProposal } from "../relation/recommendation-proposal";
import { assertCareerStateChangeDeclaration, type CareerStateChangeDeclaration } from "../relation/state-change-declaration";
import { careerCanonicalReference, type CareerCanonicalAuthorityReference } from "./contracts";

const fail = (code: string): never => { throw new Error(code); };

/**
 * Reference builders for the post-decision declarations consumed by the
 * generic Decision Core as AUTHORITATIVE_STATE claim sources and provenance
 * (relation R5). Each builder re-asserts the artifact's own identity before
 * naming it; it never reads a repository and never certifies truth.
 *
 * DECLARATION REFERENCE != EXECUTION PROOF != OUTCOME TRUTH != CAUSATION.
 */
export function careerActionOccurrenceReference(value: CareerActionOccurrence): CareerCanonicalAuthorityReference {
  try { assertCareerActionOccurrence(value); } catch { return fail("ERR_CAREER_CANONICAL_AUTHORITY_ARTIFACT_INVALID"); }
  return careerCanonicalReference("ACTION_OCCURRENCE", value.careerActionOccurrenceId);
}

export function careerStateChangeDeclarationReference(value: CareerStateChangeDeclaration): CareerCanonicalAuthorityReference {
  try { assertCareerStateChangeDeclaration(value); } catch { return fail("ERR_CAREER_CANONICAL_AUTHORITY_ARTIFACT_INVALID"); }
  return careerCanonicalReference("STATE_CHANGE_DECLARATION", value.careerStateChangeDeclarationId);
}

export function careerActionStateChangeAssociationDeclarationReference(
  value: CareerActionStateChangeAssociationDeclaration,
): CareerCanonicalAuthorityReference {
  try { assertCareerActionStateChangeAssociationDeclaration(value); } catch { return fail("ERR_CAREER_CANONICAL_AUTHORITY_ARTIFACT_INVALID"); }
  return careerCanonicalReference("ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION", value.careerActionStateChangeAssociationDeclarationId);
}

export function careerOutcomeRoleDeclarationReference(value: CareerOutcomeRoleDeclaration): CareerCanonicalAuthorityReference {
  try { assertCareerOutcomeRoleDeclaration(value); } catch { return fail("ERR_CAREER_CANONICAL_AUTHORITY_ARTIFACT_INVALID"); }
  return careerCanonicalReference("OUTCOME_ROLE_DECLARATION", value.careerOutcomeRoleDeclarationId);
}

export function careerOutcomeValenceDeclarationReference(value: CareerOutcomeValenceDeclaration): CareerCanonicalAuthorityReference {
  try { assertCareerOutcomeValenceDeclaration(value); } catch { return fail("ERR_CAREER_CANONICAL_AUTHORITY_ARTIFACT_INVALID"); }
  return careerCanonicalReference("OUTCOME_VALENCE_DECLARATION", value.careerOutcomeValenceDeclarationId);
}

export function careerOutcomeValenceFeedbackContextRevisionReference(
  value: CareerOutcomeValenceFeedbackContextRevision,
): CareerCanonicalAuthorityReference {
  try { assertCareerOutcomeValenceFeedbackContextRevision(value); } catch { return fail("ERR_CAREER_CANONICAL_AUTHORITY_ARTIFACT_INVALID"); }
  return careerCanonicalReference("OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION", value.careerOutcomeValenceFeedbackContextRevisionId);
}

/**
 * The RCP reference names policy-bound proposal authority only (D3). A proposal
 * whose stored authorityState is not RECOMMENDATION_POLICY_BOUND cannot be
 * referenced under this contract id.
 */
export function careerRecommendationProposalReference(value: RecommendationProposal): CareerCanonicalAuthorityReference {
  try { assertRecommendationProposal(value); } catch { return fail("ERR_CAREER_CANONICAL_AUTHORITY_ARTIFACT_INVALID"); }
  if (value.authorityState !== "RECOMMENDATION_POLICY_BOUND") return fail("ERR_CAREER_CANONICAL_AUTHORITY_STATE_MISMATCH");
  return careerCanonicalReference("RECOMMENDATION_PROPOSAL", value.recommendationProposalId);
}
