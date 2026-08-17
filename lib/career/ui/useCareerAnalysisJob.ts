import { useSyncExternalStore, useMemo, useEffect, useRef } from 'react';
import { CareerJobController } from './career-job-controller';

export function useCareerAnalysisJob() {
  const controller = useMemo(() => new CareerJobController(), []);
  
  useEffect(() => {
    return () => controller.cleanup();
  }, [controller]);

  const state = useSyncExternalStore(
    (l) => controller.subscribe(l),
    () => controller.getState(),
    () => controller.getState()
  );

  return {
    state,
    submitAnalysis: (payload: any) => controller.submitAnalysis(payload)
  };
}
