import type { TargetSourceRevision } from "../types";

export interface BoundTargetSourceRevisionPersister {
  persist(revision: TargetSourceRevision): Promise<TargetSourceRevision>;
}

export interface TargetSourceRevisionRepository {
  getRevisionById(targetSourceRevisionId: string): Promise<TargetSourceRevision | null>;
  createTargetSourceRevisionPersister(): BoundTargetSourceRevisionPersister;
}
