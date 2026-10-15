import { AsyncLocalStorage } from "node:async_hooks";

/**
 * The job attempt a Gemini exchange belongs to (Result Inspector). The worker composition opens it around each claimed
 * job, so an archived exchange — also a failed one, which never reaches an analysis — stays attributable to exactly
 * that job and lease. Outside a worker attempt (scripts, tests) there is none and the exchange carries attempt null.
 */
export interface ExchangeAttempt { jobId: string; leaseVersion: number | null; }

const activeAttempt = new AsyncLocalStorage<ExchangeAttempt>();

export function runWithExchangeAttempt<T>(attempt: ExchangeAttempt, run: () => Promise<T>): Promise<T> {
  return activeAttempt.run({ jobId: attempt.jobId, leaseVersion: attempt.leaseVersion }, run);
}

export function currentExchangeAttempt(): ExchangeAttempt | null {
  const attempt = activeAttempt.getStore();
  return attempt ? { ...attempt } : null;
}
