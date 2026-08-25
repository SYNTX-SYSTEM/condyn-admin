import type { DecisionContextRevision } from "../revisions";
import { createBoundDecisionContextRevisionPersister, sameDecisionContextRevisionData } from "./persister";
import type { BoundDecisionContextRevisionPersister, DecisionContextRevisionRepository } from "./types";

/** In-memory reference implementation of repository-bound immutable revision persistence semantics. */
export class InMemoryDecisionContextRevisionRepository implements DecisionContextRevisionRepository {
  private readonly revisions = new Map<string, DecisionContextRevision>();

  async getRevisionById(revisionId: string): Promise<DecisionContextRevision | null> {
    const revision = this.revisions.get(revisionId);
    return revision === undefined ? null : structuredClone(revision);
  }

  createDecisionContextRevisionPersister(): BoundDecisionContextRevisionPersister {
    return createBoundDecisionContextRevisionPersister({
      getRevisionById: this.getRevisionById.bind(this),
      writeRevision: this.#writeRevision.bind(this)
    });
  }

  /** Runtime-private immutable write mechanism; callers receive only a bound persister. */
  async #writeRevision(revision: DecisionContextRevision): Promise<void> {
    const current = this.revisions.get(revision.revisionId);
    if (current === undefined) {
      this.revisions.set(revision.revisionId, structuredClone(revision));
      return;
    }
    if (!sameDecisionContextRevisionData(current, revision)) throw new Error("ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT");
  }
}
