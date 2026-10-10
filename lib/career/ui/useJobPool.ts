"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  decodeJobPoolErrorBody,
  decodeJobPoolMatchPresentation,
  decodeJobPoolUploadSummary,
  decodeJobPoolUploadView
} from "../job-pool/frontend-presentation";
import type { JobPoolMatchPresentation, JobPoolUploadSummary, JobPoolUploadView } from "../job-pool/types";

/**
 * Client reads and the one client write of the Job Pool connection
 * (docs/architecture/decision-fields/JOB_POOL_CONNECTION.md §5).
 *
 * Every result is a closed discriminated union. A body this frontend cannot
 * decode is FAILED with code null, never a partially rendered success. The
 * 503 of the persistence gate is its own state (NOT_PROVISIONED) so that a
 * non-disposable database is visible as such, not as "no pools yet".
 */
export const JOB_POOL_ROUTE = "/api/career/job-pools";
export const JOB_POOL_ACTOR_HEADER = "x-condyn-principal-actor-id";
export const JOB_POOL_NOT_PROVISIONED_CODE = "ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED";
export const JOB_POOL_INACTIVE_CODE = "ERR_INACTIVE_COMPANY_POOL";

export type JobPoolListState =
  | { state: "IDLE" }
  | { state: "LOADING" }
  | { state: "AVAILABLE"; jobPools: JobPoolUploadSummary[] }
  | { state: "EMPTY" }
  | { state: "NOT_PROVISIONED" }
  | { state: "FAILED"; code: string | null; message: string | null };

export type JobPoolUploadState =
  | { state: "IDLE" }
  | { state: "SUBMITTING" }
  | { state: "CREATED"; upload: JobPoolUploadView }
  | { state: "IDENTICAL_EXISTS"; upload: JobPoolUploadView }
  | { state: "REJECTED"; status: number; code: string; message: string; issues: Array<{ path: string; message: string }> }
  | { state: "NOT_PROVISIONED" }
  | { state: "FAILED"; code: string | null };

export type JobPoolViewState =
  | { state: "IDLE" }
  | { state: "LOADING"; jobPoolUploadId: string }
  | { state: "AVAILABLE"; jobPoolUploadId: string; upload: JobPoolUploadView }
  | { state: "NOT_FOUND"; jobPoolUploadId: string }
  | { state: "NOT_PROVISIONED"; jobPoolUploadId: string }
  | { state: "FAILED"; jobPoolUploadId: string; code: string | null };

export type JobPoolMatchState =
  | { state: "IDLE" }
  | { state: "LOADING"; jobPoolUploadId: string; analysisId: string }
  | { state: "AVAILABLE"; jobPoolUploadId: string; analysisId: string; matches: JobPoolMatchPresentation }
  | { state: "NOT_FOUND"; jobPoolUploadId: string; analysisId: string; code: string | null; message: string | null }
  | { state: "INACTIVE_POOL"; jobPoolUploadId: string; analysisId: string; message: string | null }
  | { state: "NOT_PROVISIONED"; jobPoolUploadId: string; analysisId: string }
  | { state: "FAILED"; jobPoolUploadId: string; analysisId: string; code: string | null };

type Fetcher = typeof fetch;
const defaultFetcher: Fetcher = (input, init) => fetch(input, init);

async function bodyOf(response: Response): Promise<unknown> {
  try { return await response.json(); } catch { return null; }
}

function errorOf(body: unknown): { code: string | null; message: string | null; issues: Array<{ path: string; message: string }> } {
  const error = decodeJobPoolErrorBody(body);
  return error === null ? { code: null, message: null, issues: [] } : { code: error.code, message: error.message, issues: error.issues ?? [] };
}

export async function listJobPools(fetcher: Fetcher = defaultFetcher): Promise<JobPoolListState> {
  let response: Response;
  try { response = await fetcher(JOB_POOL_ROUTE); } catch { return { state: "FAILED", code: null, message: null }; }
  const body = await bodyOf(response);
  if (response.status === 200) {
    const list = body !== null && typeof body === "object" && Array.isArray((body as { jobPools?: unknown }).jobPools) ? (body as { jobPools: unknown[] }).jobPools : null;
    if (list === null) return { state: "FAILED", code: null, message: null };
    const jobPools: JobPoolUploadSummary[] = [];
    for (const item of list) { const decoded = decodeJobPoolUploadSummary(item); if (decoded === null) return { state: "FAILED", code: null, message: null }; jobPools.push(decoded); }
    return jobPools.length === 0 ? { state: "EMPTY" } : { state: "AVAILABLE", jobPools };
  }
  const error = errorOf(body);
  if (response.status === 503 && error.code === JOB_POOL_NOT_PROVISIONED_CODE) return { state: "NOT_PROVISIONED" };
  return { state: "FAILED", code: error.code, message: error.message };
}

/** The file's bytes are sent as they were read; the frontend parses nothing and never "repairs" a pool. */
export async function uploadJobPool(poolJsonText: string, actorId: string, fetcher: Fetcher = defaultFetcher): Promise<JobPoolUploadState> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (actorId.trim().length > 0) headers[JOB_POOL_ACTOR_HEADER] = actorId.trim();
  let response: Response;
  try { response = await fetcher(JOB_POOL_ROUTE, { method: "POST", headers, body: poolJsonText }); } catch { return { state: "FAILED", code: null }; }
  const body = await bodyOf(response);
  if (response.status === 201 || response.status === 200) {
    const upload = decodeJobPoolUploadView(body);
    if (upload === null) return { state: "FAILED", code: null };
    return response.status === 201 ? { state: "CREATED", upload } : { state: "IDENTICAL_EXISTS", upload };
  }
  const error = errorOf(body);
  if (response.status === 503 && error.code === JOB_POOL_NOT_PROVISIONED_CODE) return { state: "NOT_PROVISIONED" };
  if ((response.status === 400 || response.status === 413 || response.status === 422) && error.code !== null) {
    return { state: "REJECTED", status: response.status, code: error.code, message: error.message ?? "", issues: error.issues };
  }
  return { state: "FAILED", code: error.code };
}

export async function readJobPoolUpload(jobPoolUploadId: string, fetcher: Fetcher = defaultFetcher): Promise<JobPoolViewState> {
  let response: Response;
  try { response = await fetcher(`${JOB_POOL_ROUTE}/${encodeURIComponent(jobPoolUploadId)}`); } catch { return { state: "FAILED", jobPoolUploadId, code: null }; }
  const body = await bodyOf(response);
  if (response.status === 200) {
    const upload = decodeJobPoolUploadView(body);
    return upload === null ? { state: "FAILED", jobPoolUploadId, code: null } : { state: "AVAILABLE", jobPoolUploadId, upload };
  }
  const error = errorOf(body);
  if (response.status === 404) return { state: "NOT_FOUND", jobPoolUploadId };
  if (response.status === 503 && error.code === JOB_POOL_NOT_PROVISIONED_CODE) return { state: "NOT_PROVISIONED", jobPoolUploadId };
  return { state: "FAILED", jobPoolUploadId, code: error.code };
}

export async function fetchJobPoolMatches(jobPoolUploadId: string, analysisId: string, fetcher: Fetcher = defaultFetcher): Promise<JobPoolMatchState> {
  const url = `${JOB_POOL_ROUTE}/${encodeURIComponent(jobPoolUploadId)}/matches?analysisId=${encodeURIComponent(analysisId)}`;
  let response: Response;
  try { response = await fetcher(url); } catch { return { state: "FAILED", jobPoolUploadId, analysisId, code: null }; }
  const body = await bodyOf(response);
  if (response.status === 200) {
    const matches = decodeJobPoolMatchPresentation(body);
    if (matches === null || matches.jobPoolUploadId !== jobPoolUploadId || matches.analysisId !== analysisId) return { state: "FAILED", jobPoolUploadId, analysisId, code: null };
    return { state: "AVAILABLE", jobPoolUploadId, analysisId, matches };
  }
  const error = errorOf(body);
  if (response.status === 404) return { state: "NOT_FOUND", jobPoolUploadId, analysisId, code: error.code, message: error.message };
  if (response.status === 409 && error.code === JOB_POOL_INACTIVE_CODE) return { state: "INACTIVE_POOL", jobPoolUploadId, analysisId, message: error.message };
  if (response.status === 503 && error.code === JOB_POOL_NOT_PROVISIONED_CODE) return { state: "NOT_PROVISIONED", jobPoolUploadId, analysisId };
  return { state: "FAILED", jobPoolUploadId, analysisId, code: error.code };
}

export interface UseJobPoolWorkflowOptions {
  /** Exact analysis the matches are read for; null means no match read at all. */
  analysisId: string | null;
  /** Exact upload selected by the product workflow (URL); never inferred. */
  initialJobPoolUploadId?: string | null;
  fetcher?: Fetcher;
}

export function useJobPoolWorkflow({ analysisId, initialJobPoolUploadId = null, fetcher = defaultFetcher }: UseJobPoolWorkflowOptions) {
  const [pools, setPools] = useState<JobPoolListState>({ state: "IDLE" });
  const [upload, setUpload] = useState<JobPoolUploadState>({ state: "IDLE" });
  const [selectedJobPoolUploadId, setSelectedJobPoolUploadId] = useState<string | null>(initialJobPoolUploadId && initialJobPoolUploadId.length > 0 ? initialJobPoolUploadId : null);
  const [view, setView] = useState<JobPoolViewState>({ state: "IDLE" });
  const [matches, setMatches] = useState<JobPoolMatchState>({ state: "IDLE" });
  const listGeneration = useRef(0);
  const viewGeneration = useRef(0);
  const matchGeneration = useRef(0);

  const reloadPools = useCallback(async () => {
    const current = listGeneration.current + 1;
    listGeneration.current = current;
    setPools({ state: "LOADING" });
    let next: JobPoolListState;
    try { next = await listJobPools(fetcher); } catch { next = { state: "FAILED", code: null, message: null }; }
    if (listGeneration.current === current) setPools(next);
  }, [fetcher]);

  useEffect(() => { void reloadPools(); }, [reloadPools]);

  useEffect(() => {
    if (selectedJobPoolUploadId === null) { setView({ state: "IDLE" }); return; }
    const current = viewGeneration.current + 1;
    viewGeneration.current = current;
    setView({ state: "LOADING", jobPoolUploadId: selectedJobPoolUploadId });
    void readJobPoolUpload(selectedJobPoolUploadId, fetcher)
      .catch((): JobPoolViewState => ({ state: "FAILED", jobPoolUploadId: selectedJobPoolUploadId, code: null }))
      .then(next => { if (viewGeneration.current === current) setView(next); });
  }, [selectedJobPoolUploadId, fetcher]);

  const reloadMatches = useCallback(async () => {
    if (selectedJobPoolUploadId === null || analysisId === null) { setMatches({ state: "IDLE" }); return; }
    const current = matchGeneration.current + 1;
    matchGeneration.current = current;
    setMatches({ state: "LOADING", jobPoolUploadId: selectedJobPoolUploadId, analysisId });
    let next: JobPoolMatchState;
    try { next = await fetchJobPoolMatches(selectedJobPoolUploadId, analysisId, fetcher); } catch { next = { state: "FAILED", jobPoolUploadId: selectedJobPoolUploadId, analysisId, code: null }; }
    if (matchGeneration.current === current) setMatches(next);
  }, [selectedJobPoolUploadId, analysisId, fetcher]);

  useEffect(() => { void reloadMatches(); }, [reloadMatches]);

  const submitUpload = useCallback(async (poolJsonText: string, actorId: string) => {
    setUpload({ state: "SUBMITTING" });
    let next: JobPoolUploadState;
    try { next = await uploadJobPool(poolJsonText, actorId, fetcher); } catch { next = { state: "FAILED", code: null }; }
    setUpload(next);
    // An upload lists itself; it never selects itself (UPLOADED != SELECTED).
    if (next.state === "CREATED" || next.state === "IDENTICAL_EXISTS") await reloadPools();
  }, [fetcher, reloadPools]);

  const select = useCallback((jobPoolUploadId: string | null) => { setSelectedJobPoolUploadId(jobPoolUploadId); }, []);

  return { pools, upload, selectedJobPoolUploadId, view, matches, submitUpload, select, reloadPools, reloadMatches };
}
