import type {
  AuthoritativeStateReference,
  AuthoritativeStateResolution,
  BoundAuthoritativeStateReader,
  BoundDecisionContextRevisionPersister,
  DecisionContextRevision
} from "../decision-core";

export interface DecisionApplicationRuntimeDependencies {
  authoritativeStateReader: BoundAuthoritativeStateReader;
  getRevisionById: (revisionId: string) => Promise<DecisionContextRevision | null>;
  revisionPersister: BoundDecisionContextRevisionPersister;
}

export interface DecisionApplicationRuntime {
  resolveAuthoritativeState(reference: AuthoritativeStateReference): Promise<AuthoritativeStateResolution>;
  readDecisionContextRevision(revisionId: string): Promise<DecisionContextRevision | null>;
  persistDecisionContextRevision(revision: DecisionContextRevision): Promise<DecisionContextRevision>;
}
