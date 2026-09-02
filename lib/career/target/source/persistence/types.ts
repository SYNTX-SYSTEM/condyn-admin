import type { TargetSourceRevision } from "../types";

/** The only write capability exposed to callers; repository implementations retain raw writes. */
export interface BoundTargetSourceRevisionPersister {
  persist(revision: TargetSourceRevision): Promise<TargetSourceRevision>;
}

/** Exact revision lookup and a repository-bound persister; no mutable selection surface exists. */
export interface TargetSourceRevisionRepository {
  getRevisionById(targetSourceRevisionId: string): Promise<TargetSourceRevision | null>;
  createTargetSourceRevisionPersister(): BoundTargetSourceRevisionPersister;
}
