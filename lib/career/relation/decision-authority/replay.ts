import { assertDecisionAuthorityGrantRevision, deriveDecisionAuthorityGrantRevisionId, sameDecisionAuthorityGrant } from "./contract";
import type { DecisionAuthorityGrantRevision } from "./types";
import type { DecisionAuthorityGrantRevisionRepository } from "./persistence";

const fail = (code: string): never => { throw new Error(code); };

async function stored(id: string, repository: DecisionAuthorityGrantRevisionRepository): Promise<DecisionAuthorityGrantRevision> {
  try {
    const value = await repository.getDecisionAuthorityGrantRevisionById(id);
    if (!value) fail("ERR_DECISION_AUTHORITY_GRANT_NOT_FOUND");
    assertDecisionAuthorityGrantRevision(value);
    return value;
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_AUTHORITY_GRANT_NOT_FOUND") throw error;
    return fail("ERR_DECISION_AUTHORITY_GRANT_REPLAY_MISMATCH");
  }
}

/** BYTE replay reads only the exact immutable declaration. */
export async function byteReplayDecisionAuthorityGrantRevision(id: string, repository: DecisionAuthorityGrantRevisionRepository) {
  return structuredClone(await stored(id, repository));
}

/** Semantic replay validates the exact historical declaration; it never resolves current authority. */
export async function semanticReplayDecisionAuthorityGrantRevision(id: string, repository: DecisionAuthorityGrantRevisionRepository) {
  return structuredClone(await stored(id, repository));
}

/** Derivation replay recomputes identity from the stored declaration only. */
export async function derivationReplayDecisionAuthorityGrantRevision(id: string, repository: DecisionAuthorityGrantRevisionRepository) {
  const value = await stored(id, repository);
  const { decisionAuthorityGrantRevisionId: _id, createdAt: _createdAt, ...semantic } = value;
  const rebuilt = { decisionAuthorityGrantRevisionId: deriveDecisionAuthorityGrantRevisionId(semantic), ...semantic, createdAt: value.createdAt };
  if (!sameDecisionAuthorityGrant(value, rebuilt)) fail("ERR_DECISION_AUTHORITY_GRANT_REPLAY_MISMATCH");
  return structuredClone(rebuilt);
}
