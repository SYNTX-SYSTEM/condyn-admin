import type { TargetSourceRevision } from "../types";
import { createBoundTargetSourceRevisionPersister, sameTargetSourceRevisionData } from "./persister";
import type { BoundTargetSourceRevisionPersister, TargetSourceRevisionRepository } from "./types";

/** Reference repository: immutable state is writable only through its bound persister. */
export class InMemoryTargetSourceRevisionRepository implements TargetSourceRevisionRepository {
  readonly #revisions = new Map<string, TargetSourceRevision>();

  async getRevisionById(targetSourceRevisionId: string): Promise<TargetSourceRevision | null> {
    const revision = this.#revisions.get(targetSourceRevisionId);
    return revision === undefined ? null : structuredClone(revision);
  }

  createTargetSourceRevisionPersister(): BoundTargetSourceRevisionPersister {
    return createBoundTargetSourceRevisionPersister({
      getRevisionById: this.getRevisionById.bind(this),
      writeRevision: this.#writeRevision.bind(this)
    });
  }

  async #writeRevision(revision: TargetSourceRevision): Promise<void> {
    const existing = this.#revisions.get(revision.targetSourceRevisionId);
    if (existing === undefined) {
      this.#revisions.set(revision.targetSourceRevisionId, structuredClone(revision));
      return;
    }
    if (!sameTargetSourceRevisionData(existing, revision)) {
      throw new Error("ERR_TARGET_SOURCE_REVISION_IMMUTABLE_CONFLICT");
    }
  }
}
