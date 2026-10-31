import { resumeAutoMatches, runAutoMatch, type AutoMatchOutcome } from "./auto-match";

/**
 * The hook the career worker runs after an analysis job succeeded (owner mandate AUTOMATED_CAPABILITY_TO_JOB_EXECUTE). It logs the
 * outcome by code only. Without a READY semantic configuration and a call budget the run does nothing.
 */
export function createAutoMatchHook(workerId: string, run: (analysisId: string, runnerId?: string) => Promise<AutoMatchOutcome> = (analysisId, runnerId) => runAutoMatch(analysisId, undefined, runnerId), log: (line: string) => void = console.log) {
  return async (_job: unknown, resultAnalysisId: string): Promise<void> => {
    const outcome = await run(resultAnalysisId, workerId);
    log(`[Worker ${workerId}] AUTO_MATCH ${resultAnalysisId} ${outcome.outcome}${outcome.reason ? ` ${outcome.reason}` : ""}`);
  };
}

/**
 * The periodic sweep of the worker (point 3): takes up runs whose lease ran out and continues runs that stopped early. The first sweep
 * follows shortly after the start (a restarted worker finds what its predecessor left). Errors are logged by code only; the loop never stops.
 */
export function startAutoMatchSweeper(workerId: string, options: { intervalMs?: number; firstMs?: number; sweep?: typeof resumeAutoMatches; log?: (line: string) => void } = {}): () => void {
  const sweep = options.sweep ?? resumeAutoMatches;
  const log = options.log ?? console.log;
  let busy = false;
  const tick = () => {
    if (busy) return;
    busy = true;
    sweep(undefined, workerId).then(r => { if (r.interrupted > 0 || r.continued > 0 || r.settled > 0) log(`[Worker ${workerId}] AUTO_MATCH_SWEEP interrupted=${r.interrupted} continued=${r.continued} settled=${r.settled}`); })
      .catch(error => log(`[Worker ${workerId}] AUTO_MATCH_SWEEP failed ${error instanceof Error ? error.message.split(":")[0].slice(0, 80) : "unknown"}`))
      .finally(() => { busy = false; });
  };
  const first = setTimeout(tick, options.firstMs ?? 5_000);
  const every = setInterval(tick, options.intervalMs ?? 30_000);
  first.unref?.(); every.unref?.();
  return () => { clearTimeout(first); clearInterval(every); };
}
