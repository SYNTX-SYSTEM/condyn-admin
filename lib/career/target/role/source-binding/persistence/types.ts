import type { TargetSourceRevision } from "../../../source/types";
import type { TargetRoleSourceBindingRevision } from "../types";

export interface BoundTargetRoleSourceBindingRevisionPersister {
  persist(revision: TargetRoleSourceBindingRevision): Promise<TargetRoleSourceBindingRevision>;
}

/** Exact binding lookup only; no current/latest/head selection or mutable branch authority exists. */
export interface TargetRoleSourceBindingRevisionRepository {
  getRevisionById(targetRoleSourceBindingRevisionId: string): Promise<TargetRoleSourceBindingRevision | null>;
  createTargetRoleSourceBindingRevisionPersister(): BoundTargetRoleSourceBindingRevisionPersister;
}

/** Explicit composition dependency: Binding persistence validates Source state but never owns Source truth. */
export interface TargetRoleSourceBindingSourceRevisionLookup {
  getTargetSourceRevisionById(targetSourceRevisionId: string): Promise<TargetSourceRevision | null>;
}
