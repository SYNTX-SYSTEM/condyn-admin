"use client";

import { useEffect, useRef, useState } from "react";
import { readAnalysisInvestigation } from "../investigation/client";
import type { InvestigationMode } from "../job-pool/investigation-mode";
import type { JobScope } from "../job-pool/job-scope";

/**
 * D-PICK (UX-05; owner "RECURSIVE UX/UI & SYSTEM CLOSURE" §03, GELB contract §4): an existing analysis chosen in the interface,
 * inside the authorised reads that exist — GET only, no new route, no server-side filter:
 *
 *   GET /api/career/analyses                       analysisId, createdAt, validationState (nothing else is read; no confidence)
 *   GET /api/career/analyses/{id}/investigation    the persisted boundary: mode and jobScopeSelection
 *
 * Offered is only what fits the interface exactly: the persisted mode equals the interface's mode, and in PERSON × JOB the
 * analysis's jobScopeSelection equals the selected job (same upload id, same role id). An analysis whose boundary cannot be read
 * (404, 409 UNRESOLVED, FAILED) is not offered. Bounded: the newest 25 by createdAt, at most 4 boundary reads at a time, read only
 * when the list is opened. JOB reads no analysis. Nothing is chosen here: choosing is the caller's explicit click.
 */
type Fetcher = (input: string, init: { method: "GET"; cache: "no-store"; signal?: AbortSignal }) => Promise<{ status: number; json(): Promise<unknown> }>;
const defaultFetcher: Fetcher = (input, init) => fetch(input, init);

export const PICKER_NEWEST = 25;
export const PICKER_PARALLEL = 4;

export interface AnalysisIndexItem { analysisId: string; createdAt: string; validationState: string }

export interface PickableAnalysis extends AnalysisIndexItem {
  mode: "PERSON" | "PERSON_X_JOB";
  /** From this analysis's own boundary read (not the interface's selection); null under PERSON. */
  jobScopeSelection: JobScope | null;
}

export type AnalysisPickerState =
  | { state: "IDLE" }
  | { state: "LOADING" }
  /** `considered`: the newest ones whose boundary was read; `listed`: all analyses the list delivered; `unreadable`: boundaries not readable. */
  | { state: "AVAILABLE"; candidates: PickableAnalysis[]; considered: number; listed: number; unreadable: number }
  | { state: "FAILED"; code: string | null };

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string => typeof value === "string" && value.length > 0;

/** The list body: every entry must carry an id, a creation time and a validation state, else the list is unreadable (null). */
export function decodeAnalysisIndex(body: unknown): AnalysisIndexItem[] | null {
  if (!isRecord(body) || body.success !== true || !Array.isArray(body.analyses)) return null;
  const items: AnalysisIndexItem[] = [];
  for (const entry of body.analyses) {
    if (!isRecord(entry) || !nonEmpty(entry.analysisId) || !nonEmpty(entry.createdAt) || !nonEmpty(entry.validationState) || Number.isNaN(Date.parse(entry.createdAt))) return null;
    items.push({ analysisId: entry.analysisId, createdAt: entry.createdAt, validationState: entry.validationState });
  }
  return items;
}

/** The newest first (createdAt, then id for a stable order), at most `limit`. */
export function newestAnalyses(items: AnalysisIndexItem[], limit = PICKER_NEWEST): AnalysisIndexItem[] {
  return [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || (a.analysisId < b.analysisId ? 1 : a.analysisId > b.analysisId ? -1 : 0)).slice(0, limit);
}

/** Whether a persisted boundary fits the interface: same mode; in PERSON × JOB exactly the selected job. */
export function boundaryFits(mode: InvestigationMode, selection: JobScope | null, boundary: { mode: "PERSON" | "PERSON_X_JOB"; jobScopeSelection: JobScope | null }): boolean {
  if (boundary.mode !== mode) return false;
  if (mode === "PERSON") return boundary.jobScopeSelection === null;
  return selection !== null && boundary.jobScopeSelection !== null && boundary.jobScopeSelection.jobPoolUploadId === selection.jobPoolUploadId && boundary.jobScopeSelection.poolRoleId === selection.poolRoleId;
}

/** Runs `work` over `items` with at most `parallel` at a time, results in the items' order. */
async function bounded<T, R>(items: T[], parallel: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const lane = async () => { while (next < items.length) { const at = next++; results[at] = await work(items[at]); } };
  await Promise.all(Array.from({ length: Math.min(parallel, items.length) }, lane));
  return results;
}

export async function readPickableAnalyses(mode: InvestigationMode, selection: JobScope | null, fetcher: Fetcher = defaultFetcher, signal?: AbortSignal): Promise<AnalysisPickerState> {
  if (mode === "JOB" || (mode === "PERSON_X_JOB" && selection === null)) return { state: "AVAILABLE", candidates: [], considered: 0, listed: 0, unreadable: 0 };
  let body: unknown, status: number;
  try {
    const response = await fetcher("/api/career/analyses", { method: "GET", cache: "no-store", signal });
    status = response.status;
    body = await response.json();
  } catch { return { state: "FAILED", code: null }; }
  const items = status === 200 ? decodeAnalysisIndex(body) : null;
  if (items === null) {
    const issue = isRecord(body) && Array.isArray(body.issues) && isRecord(body.issues[0]) && nonEmpty(body.issues[0].code) ? body.issues[0].code : null;
    return { state: "FAILED", code: issue ?? `HTTP_${status}` };
  }
  const newest = newestAnalyses(items);
  const reads = await bounded(newest, PICKER_PARALLEL, item => signal?.aborted ? Promise.resolve(null) : readAnalysisInvestigation(fetcher, item.analysisId, signal));
  if (signal?.aborted) return { state: "LOADING" };
  const candidates: PickableAnalysis[] = [];
  let unreadable = 0;
  newest.forEach((item, at) => {
    const read = reads[at];
    if (read === null || read.state !== "RESOLVED") { unreadable += 1; return; }
    if (!boundaryFits(mode, selection, read.value)) return;
    candidates.push({ ...item, mode: read.value.mode, jobScopeSelection: read.value.jobScopeSelection === null ? null : { jobPoolUploadId: read.value.jobScopeSelection.jobPoolUploadId, poolRoleId: read.value.jobScopeSelection.poolRoleId } });
  });
  return { state: "AVAILABLE", candidates, considered: newest.length, listed: items.length, unreadable };
}

/**
 * The picker's read: nothing until `open`; one read per (mode, selected job); closing or a change discards it, aborts the read in
 * flight and drops a late answer. Shown only for the key it was read for.
 */
export function useAnalysisPicker(open: boolean, mode: InvestigationMode, selection: JobScope | null, fetcher?: Fetcher): AnalysisPickerState {
  const key = !open || mode === "JOB" || (mode === "PERSON_X_JOB" && selection === null) ? null : JSON.stringify([mode, selection?.jobPoolUploadId ?? null, selection?.poolRoleId ?? null]);
  const [entry, setEntry] = useState<{ key: string | null; value: AnalysisPickerState }>({ key: null, value: { state: "IDLE" } });
  const generation = useRef(0);
  useEffect(() => {
    const current = generation.current + 1;
    generation.current = current;
    if (key === null) { setEntry({ key: null, value: { state: "IDLE" } }); return; }
    const controller = new AbortController();
    setEntry({ key, value: { state: "LOADING" } });
    void readPickableAnalyses(mode, selection, fetcher, controller.signal)
      .catch((): AnalysisPickerState => ({ state: "FAILED", code: null }))
      .then(value => { if (generation.current === current && !controller.signal.aborted) setEntry({ key, value }); });
    return () => controller.abort();
  }, [key]);
  return entry.key === key ? entry.value : key === null ? { state: "IDLE" } : { state: "LOADING" };
}
