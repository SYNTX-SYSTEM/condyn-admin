import type { DecisionContextRevision } from "../revisions";

export interface BoundDecisionContextRevisionPersister {
  persist(revision: DecisionContextRevision): Promise<DecisionContextRevision>;
}

export interface DecisionContextRevisionRepository {
  getRevisionById(revisionId: string): Promise<DecisionContextRevision | null>;
  createDecisionContextRevisionPersister(): BoundDecisionContextRevisionPersister;
}
