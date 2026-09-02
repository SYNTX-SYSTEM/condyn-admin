import type { TargetRoleSourceBindingRevision } from "../types";
import {
  createBoundTargetRoleSourceBindingRevisionPersister,
  sameTargetRoleSourceBindingRevisionData
} from "./persister";
import type {
  BoundTargetRoleSourceBindingRevisionPersister,
  TargetRoleSourceBindingRevisionRepository,
  TargetRoleSourceBindingSourceRevisionLookup
} from "./types";

/** Reference storage with injected Source lookup; this repository never becomes a Source registry. */
export class InMemoryTargetRoleSourceBindingRevisionRepository implements TargetRoleSourceBindingRevisionRepository {
  readonly #revisions = new Map<string, TargetRoleSourceBindingRevision>();

  constructor(private readonly sourceLookup: TargetRoleSourceBindingSourceRevisionLookup) {}

  async getRevisionById(
    targetRoleSourceBindingRevisionId: string
  ): Promise<TargetRoleSourceBindingRevision | null> {
    const revision = this.#revisions.get(targetRoleSourceBindingRevisionId);
    return revision === undefined ? null : structuredClone(revision);
  }

  createTargetRoleSourceBindingRevisionPersister(): BoundTargetRoleSourceBindingRevisionPersister {
    return createBoundTargetRoleSourceBindingRevisionPersister({
      getRevisionById: this.getRevisionById.bind(this),
      getTargetSourceRevisionById: this.sourceLookup.getTargetSourceRevisionById.bind(this.sourceLookup),
      writeRevision: this.#writeRevision.bind(this)
    });
  }

  async #writeRevision(revision: TargetRoleSourceBindingRevision): Promise<void> {
    const existing = this.#revisions.get(revision.targetRoleSourceBindingRevisionId);
    if (existing === undefined) {
      this.#revisions.set(revision.targetRoleSourceBindingRevisionId, structuredClone(revision));
      return;
    }
    if (!sameTargetRoleSourceBindingRevisionData(existing, revision)) {
      throw new Error("ERR_TARGET_ROLE_SOURCE_BINDING_REVISION_IMMUTABLE_CONFLICT");
    }
  }
}
