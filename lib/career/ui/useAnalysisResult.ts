"use client";

import { useEffect, useRef, useState } from "react";
import { decodeAnalysisResult, type AnalysisResultState } from "../view-model/pxj-first-screen";

/**
 * Reload reconstruction of the first screen (owner G1 Q2, 2026-10-22): the persisted result of exactly one analysis, read with
 * GET /api/career/analyses/{analysisId} (no-store) and decoded by the same decoder the session uses. GET only, no retry, nothing
 * started. Bound to its analysisId: a change discards the result, aborts the read in flight and ignores a late answer.
 */
type Fetcher = (input: string, init: { method: "GET"; cache: "no-store"; signal?: AbortSignal }) => Promise<{ status: number; json(): Promise<unknown> }>;
const defaultFetcher: Fetcher = (input, init) => fetch(input, init);

const issueCode = (body: unknown): string | null => {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const issues = (body as { issues?: unknown }).issues;
  const first = Array.isArray(issues) ? issues[0] : null;
  return first && typeof first === "object" && typeof (first as { code?: unknown }).code === "string" ? (first as { code: string }).code : null;
};

export async function readAnalysisResult(analysisId: string, fetcher: Fetcher = defaultFetcher, signal?: AbortSignal): Promise<AnalysisResultState> {
  let response;
  try { response = await fetcher(`/api/career/analyses/${encodeURIComponent(analysisId)}`, { method: "GET", cache: "no-store", signal }); } catch { return { state: "FAILED", code: null }; }
  let body: unknown = null;
  try { body = await response.json(); } catch { /* an undecodable body is FAILED below */ }
  const code = issueCode(body);
  if (response.status === 404 && code === "ERR_ANALYSIS_NOT_FOUND") return { state: "NOT_FOUND" };
  if (response.status !== 200) return { state: "FAILED", code: code ?? `HTTP_${response.status}` };
  const decoded = decodeAnalysisResult(body, analysisId);
  return decoded.ok ? { state: "AVAILABLE", result: decoded.result } : { state: "FAILED", code: decoded.code };
}

/** The persisted result of the analysis on view; null reads nothing (the session's own result has precedence, M-01). */
export function useAnalysisResult(analysisId: string | null, fetcher: Fetcher = defaultFetcher): AnalysisResultState {
  const [entry, setEntry] = useState<{ key: string | null; value: AnalysisResultState }>({ key: null, value: { state: "IDLE" } });
  const generation = useRef(0);
  const reader = useRef(fetcher);
  reader.current = fetcher;
  useEffect(() => {
    const current = generation.current + 1;
    generation.current = current;
    if (analysisId === null) { setEntry({ key: null, value: { state: "IDLE" } }); return; }
    const controller = new AbortController();
    setEntry({ key: analysisId, value: { state: "LOADING" } });
    void readAnalysisResult(analysisId, reader.current, controller.signal)
      .catch((): AnalysisResultState => ({ state: "FAILED", code: null }))
      .then(value => { if (generation.current === current && !controller.signal.aborted) setEntry({ key: analysisId, value }); });
    return () => controller.abort();
  }, [analysisId]);
  // Shown only for the analysis it was read for: during a change the previous result is never visible.
  return entry.key === analysisId ? entry.value : analysisId === null ? { state: "IDLE" } : { state: "LOADING" };
}
