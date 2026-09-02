import type { TargetRoleOrganizationBindingRevision } from "../types";
import { createBoundTargetRoleOrganizationBindingRevisionPersister, sameTargetRoleOrganizationBindingRevisionData } from "./persister";
import type { BoundTargetRoleOrganizationBindingRevisionPersister, TargetRoleOrganizationBindingOperandLookup, TargetRoleOrganizationBindingRevisionRepository } from "./types";
export class InMemoryTargetRoleOrganizationBindingRevisionRepository implements TargetRoleOrganizationBindingRevisionRepository {
  readonly #values = new Map<string, TargetRoleOrganizationBindingRevision>();
  constructor(private readonly operands: TargetRoleOrganizationBindingOperandLookup) {}
  async getRevisionById(id: string): Promise<TargetRoleOrganizationBindingRevision | null> { const value = this.#values.get(id); return value === undefined ? null : structuredClone(value); }
  createTargetRoleOrganizationBindingRevisionPersister(): BoundTargetRoleOrganizationBindingRevisionPersister { return createBoundTargetRoleOrganizationBindingRevisionPersister({ getRevisionById: this.getRevisionById.bind(this), getTargetRoleSourceBindingRevisionById: this.operands.getTargetRoleSourceBindingRevisionById.bind(this.operands), getTargetOrganizationRevisionById: this.operands.getTargetOrganizationRevisionById.bind(this.operands), writeRevision: this.#write.bind(this) }); }
  async #write(value: TargetRoleOrganizationBindingRevision): Promise<void> { const existing = this.#values.get(value.targetRoleOrganizationBindingRevisionId); if (existing === undefined) { this.#values.set(value.targetRoleOrganizationBindingRevisionId, structuredClone(value)); return; } if (!sameTargetRoleOrganizationBindingRevisionData(existing, value)) throw new Error("ERR_TARGET_ROLE_ORGANIZATION_BINDING_REVISION_IMMUTABLE_CONFLICT"); }
}
