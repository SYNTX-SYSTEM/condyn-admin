import type { TargetOrganizationRevision } from "../types";
import { createBoundTargetOrganizationRevisionPersister, sameTargetOrganizationRevisionData } from "./persister";
import type { BoundTargetOrganizationRevisionPersister, TargetOrganizationRevisionRepository } from "./types";

/** Reference persistence for immutable revisions; it intentionally has no descriptor lookup or resolution. */
export class InMemoryTargetOrganizationRevisionRepository implements TargetOrganizationRevisionRepository {
  readonly #revisions = new Map<string, TargetOrganizationRevision>();

  async getRevisionById(targetOrganizationRevisionId: string): Promise<TargetOrganizationRevision | null> {
    const revision = this.#revisions.get(targetOrganizationRevisionId);
    return revision === undefined ? null : structuredClone(revision);
  }

  createTargetOrganizationRevisionPersister(): BoundTargetOrganizationRevisionPersister {
    return createBoundTargetOrganizationRevisionPersister({
      getRevisionById: this.getRevisionById.bind(this),
      writeRevision: this.#writeRevision.bind(this)
    });
  }

  async #writeRevision(revision: TargetOrganizationRevision): Promise<void> {
    const existing = this.#revisions.get(revision.targetOrganizationRevisionId);
    if (existing === undefined) {
      this.#revisions.set(revision.targetOrganizationRevisionId, structuredClone(revision));
      return;
    }
    if (!sameTargetOrganizationRevisionData(existing, revision)) {
      throw new Error("ERR_TARGET_ORGANIZATION_REVISION_IMMUTABLE_CONFLICT");
    }
  }
}
