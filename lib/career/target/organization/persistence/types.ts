import type { TargetOrganizationRevision } from "../types";

/** Callers receive this bound write capability; repository implementations retain raw writes. */
export interface BoundTargetOrganizationRevisionPersister {
  persist(revision: TargetOrganizationRevision): Promise<TargetOrganizationRevision>;
}

/** Exact lookup only; this boundary intentionally provides no mutable current-revision selection. */
export interface TargetOrganizationRevisionRepository {
  getRevisionById(targetOrganizationRevisionId: string): Promise<TargetOrganizationRevision | null>;
  createTargetOrganizationRevisionPersister(): BoundTargetOrganizationRevisionPersister;
}
