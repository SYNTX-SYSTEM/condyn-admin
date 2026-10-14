import { AsyncLocalStorage } from "node:async_hooks";
import { JobScopeRequiredError } from "./errors";
import { assertIssuedJobScope, type ResolvedJobScope } from "./scope";

/**
 * The job scope of the claimed job the Career worker is processing. The worker boundary opens it after validating
 * the job; the worker composition reads it before the capability sweep and the analysis call. Outside an open scope
 * nothing in the Career-Analysis pipeline may run.
 */
const activeScope = new AsyncLocalStorage<ResolvedJobScope>();

export function runWithJobScope<T>(scope: ResolvedJobScope, run: () => Promise<T>): Promise<T> {
  assertIssuedJobScope(scope);
  return activeScope.run(scope, run);
}

/** The validated scope of the current job, or ERR_JOB_SCOPE_REQUIRED when no validated job is being processed. */
export function requireActiveJobScope(): ResolvedJobScope {
  const scope = activeScope.getStore();
  if (scope === undefined) throw new JobScopeRequiredError("ERR_JOB_SCOPE_REQUIRED", "no validated job scope is active for this Career-Analysis step.");
  assertIssuedJobScope(scope);
  return scope;
}
