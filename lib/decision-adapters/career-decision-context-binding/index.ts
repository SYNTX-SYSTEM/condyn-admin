import { assertDecisionContextRevision, type DecisionContextRevision } from "../../decision-core/revisions";
import type { DecisionContextRevisionRepository } from "../../decision-core/revision-persistence";

const referenceInvalid = "ERR_DECISION_ADAPTER_REVISION_READ_REFERENCE_INVALID";
const recordInvalid = "ERR_DECISION_ADAPTER_REVISION_READ_RECORD_INVALID";
const revisionIdPattern = /^DREV_[0-9A-F]{24}$/;

/** Exact-id read capability handed to a Career-side binder. Generic validity is asserted here, in the adapter zone. */
export interface GenericDecisionContextRevisionReadCapability {
  getDecisionContextRevisionById(revisionId: string): Promise<DecisionContextRevision | null>;
}

/**
 * Bridges the generic revision repository to the Career binding relation
 * without either kernel importing the other. The repository read method is
 * captured once; the capability resolves exact ids only.
 *
 * READ CAPABILITY != CURRENT SELECTION. READER RETURN != PERSISTENCE PROOF.
 */
export function createGenericDecisionContextRevisionReader(
  repository: Pick<DecisionContextRevisionRepository, "getRevisionById">,
): GenericDecisionContextRevisionReadCapability {
  const getRevisionById = repository.getRevisionById.bind(repository);
  return {
    async getDecisionContextRevisionById(revisionId: string): Promise<DecisionContextRevision | null> {
      if (typeof revisionId !== "string" || !revisionIdPattern.test(revisionId)) throw new Error(referenceInvalid);
      const revision = await getRevisionById(revisionId);
      if (revision === null) return null;
      try {
        assertDecisionContextRevision(revision);
      } catch {
        throw new Error(recordInvalid);
      }
      if (revision.revisionId !== revisionId) throw new Error(recordInvalid);
      return structuredClone(revision);
    },
  };
}
