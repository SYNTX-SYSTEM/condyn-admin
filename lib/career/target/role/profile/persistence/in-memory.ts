import type { TargetRoleProfileRevision } from "../types";
import { createBoundTargetRoleProfileRevisionPersister, sameTargetRoleProfileRevisionData } from "./persister";
import type { BoundTargetRoleProfileRevisionPersister, TargetRoleProfileOperandLookup, TargetRoleProfileRevisionRepository } from "./types";
export class InMemoryTargetRoleProfileRevisionRepository implements TargetRoleProfileRevisionRepository {
  readonly #values = new Map<string, TargetRoleProfileRevision>();
  constructor(private readonly operands: TargetRoleProfileOperandLookup) {}
  async getRevisionById(id: string): Promise<TargetRoleProfileRevision | null> { const value = this.#values.get(id); return value === undefined ? null : structuredClone(value); }
  createTargetRoleProfileRevisionPersister(): BoundTargetRoleProfileRevisionPersister { return createBoundTargetRoleProfileRevisionPersister({ getRevisionById: this.getRevisionById.bind(this), getTargetRoleOrganizationBindingRevisionById: this.operands.getTargetRoleOrganizationBindingRevisionById.bind(this.operands), getTargetOrganizationRevisionById: this.operands.getTargetOrganizationRevisionById.bind(this.operands), writeRevision: this.#write.bind(this) }); }
  async #write(value: TargetRoleProfileRevision): Promise<void> { const prior = this.#values.get(value.targetRoleProfileRevisionId); if (prior === undefined) { this.#values.set(value.targetRoleProfileRevisionId, structuredClone(value)); return; } if (!sameTargetRoleProfileRevisionData(prior, value)) throw new Error("ERR_TARGET_ROLE_PROFILE_REVISION_IMMUTABLE_CONFLICT"); }
}
