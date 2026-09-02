import type { TargetOrganizationRevision } from "../types";

export interface BoundTargetOrganizationRevisionPersister {
  persist(revision: TargetOrganizationRevision): Promise<TargetOrganizationRevision>;
}

export interface TargetOrganizationRevisionRepository {
  getRevisionById(targetOrganizationRevisionId: string): Promise<TargetOrganizationRevision | null>;
  createTargetOrganizationRevisionPersister(): BoundTargetOrganizationRevisionPersister;
}
