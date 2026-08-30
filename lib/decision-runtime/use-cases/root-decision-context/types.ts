import type { DecisionApplicationRuntime } from "../../types";

export interface CreatePersistRootDecisionContextRevisionUseCaseDependencies {
  runtime: DecisionApplicationRuntime;
}

export interface CreatePersistRootDecisionContextRevisionUseCase {
  execute(input: import("../../../decision-core").DecisionContextDraftInput): Promise<import("../../../decision-core").DecisionContextRevision>;
}
