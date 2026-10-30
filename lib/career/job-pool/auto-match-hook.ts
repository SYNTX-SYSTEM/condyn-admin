import { runAutoMatch, type AutoMatchOutcome } from "./auto-match";

/**
 * The hook the career worker runs after an analysis job succeeded (owner mandate AUTOMATED_CAPABILITY_TO_JOB_EXECUTE). It logs the
 * outcome by code only. Without a READY semantic configuration and a call budget the run does nothing.
 */
export function createAutoMatchHook(workerId: string, run: (analysisId: string) => Promise<AutoMatchOutcome> = runAutoMatch, log: (line: string) => void = console.log) {
  return async (_job: unknown, resultAnalysisId: string): Promise<void> => {
    const outcome = await run(resultAnalysisId);
    log(`[Worker ${workerId}] AUTO_MATCH ${resultAnalysisId} ${outcome.outcome}${outcome.reason ? ` ${outcome.reason}` : ""}`);
  };
}
