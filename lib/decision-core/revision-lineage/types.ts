import type { DecisionContextRevision } from "../revisions";

/** Detached read model for one complete explicit predecessor chain. */
export interface DecisionContextRevisionLineage {
  startRevisionId: string;
  rootRevisionId: string;
  revisions: readonly DecisionContextRevision[];
}

/** Bound read-only capability for reconstructing one explicit predecessor chain. */
export interface BoundDecisionContextRevisionLineageReconstructor {
  reconstruct(startRevisionId: string): Promise<DecisionContextRevisionLineage>;
}
