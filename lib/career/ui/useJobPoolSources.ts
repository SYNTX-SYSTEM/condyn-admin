"use client";

import { useEffect, useRef, useState } from "react";
import { readAnalysisSources, type AnalysisSourcesState } from "../job-pool/analysis-sources";

/**
 * The second read the SYNTX binding permits (R12): the analysis sources (documents, evidence locations, proposal
 * evidence ids) for the exact analysis the matching was read for. Nothing else of that body is decoded.
 */
export function useAnalysisSources(analysisId: string | null, fetcher?: typeof fetch): AnalysisSourcesState {
  const [state, setState] = useState<AnalysisSourcesState>({ state: "IDLE" });
  const generation = useRef(0);
  useEffect(() => {
    if (analysisId === null) { setState({ state: "IDLE" }); return; }
    const current = generation.current + 1;
    generation.current = current;
    setState({ state: "LOADING", analysisId });
    void readAnalysisSources(analysisId, fetcher)
      .catch((): AnalysisSourcesState => ({ state: "FAILED", analysisId }))
      .then(next => { if (generation.current === current) setState(next); });
  }, [analysisId, fetcher]);
  return state;
}
