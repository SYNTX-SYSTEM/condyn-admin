import { useSyncExternalStore, useMemo, useEffect, useRef } from 'react';
import { CareerJobController } from './career-job-controller';
import { careerJobHandoff } from './career-job-handoff';

export function useCareerAnalysisJob() {
  // O-NAV-SUBMIT: a 202 arriving after this mount's unmount is handed over to the field mounted then.
  const controller = useMemo(() => new CareerJobController(undefined, { onReleasedJob: jobId => careerJobHandoff.handOver(jobId) }), []);
  
  useEffect(() => {
    controller.activate();
    return () => controller.cleanup();
  }, [controller]);

  const state = useSyncExternalStore(
    (l) => controller.subscribe(l),
    () => controller.getState(),
    () => controller.getState()
  );

  return {
    state,
    submitAnalysis: (payload: any) => controller.submitAnalysis(payload),
    resumeJob: (jobId: string) => controller.resumeJob(jobId)
  };
}
