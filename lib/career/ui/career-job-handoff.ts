/**
 * O-NAV-SUBMIT (owner "RECURSIVE UX/UI & SYSTEM CLOSURE", GELB contract §4): no analysis submitted in this session may become
 * unnamed. Back / Forward remount the field (N-1), and the old mount's job controller is released; when its POST is still on its
 * way, the 202 reaches a controller nobody listens to. That controller hands the job id over here, and the field mounted now takes
 * it over: written by replace into the entry on view (analysisJobId) and followed by GET only — no second POST, no second job.
 *
 * It carries the job id only — no analysisId, no scope — of the one submission whose 202 arrived after the release, and `take`
 * removes it: a later mount never takes it again (GELB's conditions for 0f8d74e). One handover per page session: this module's instance, which outlives every remount (CareerDemoHistory) and ends with the
 * document. In memory only, nothing is stored. A reload during SUBMITTING is not covered: the job id exists only in the 202, so
 * finding it again needs a server lookup (owner decision).
 */
export interface CareerJobHandoff {
  /** A released controller's 202: the job it names waits here until a mounted field takes it over. */
  handOver(jobId: string): void;
  /** The oldest job waiting, removed from the handover; null when none waits. */
  take(): string | null;
  subscribe(listener: () => void): () => void;
  /** Changes with every handover (the store snapshot). */
  version(): number;
}

export function createCareerJobHandoff(): CareerJobHandoff {
  const waiting: string[] = [];
  const listeners = new Set<() => void>();
  let version = 0;
  return {
    handOver(jobId) { waiting.push(jobId); version += 1; for (const listener of [...listeners]) listener(); },
    take: () => waiting.shift() ?? null,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    version: () => version
  };
}

/** The page session's handover (the analysis field is this controller's only user). */
export const careerJobHandoff: CareerJobHandoff = createCareerJobHandoff();
