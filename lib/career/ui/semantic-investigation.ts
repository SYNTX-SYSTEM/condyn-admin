"use client";

import { useRef, useState } from "react";

/**
 * The explicit start of a semantic investigation of discovered roles (GELB c1954ca / 0e03f69, owner D-RD-3 A; stand-in only):
 *
 *   POST /api/career/analyses/{analysisId}/role-discovery/investigations
 *        { jobPoolUploadIds, roles: [{ jobPoolUploadId, poolRoleId }], clientRequestId, confirmedCalls }
 *   GET  /api/career/analyses/{analysisId}/role-discovery/investigations/{investigationId}
 *
 * A POST only by the user's click, exactly one per click, carrying exactly the call count the user was shown; never on a load, an
 * open or a reload. The answer is shown from the stored investigation and its role tasks only (the same for POST and GET); the run
 * summary and the relations themselves are not shown. In this build only the labelled stand-in exists: any other provider is not
 * this contract (FAILED, its name never shown).
 */
type Fetcher = (input: string, init: { method: "GET" | "POST"; cache: "no-store"; headers?: Record<string, string>; body?: string; signal?: AbortSignal }) => Promise<{ status: number; json(): Promise<unknown> }>;
const defaultFetcher: Fetcher = (input, init) => fetch(input, init);

export type InvestigationStatus = "PLANNED" | "RUNNING" | "COMPLETED" | "PARTIAL" | "INTERRUPTED" | "FAILED";
export type InvestigationTaskStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "BUDGET_EXHAUSTED" | "INTERRUPTED" | "CANCELLED" | "CACHED";
const STATUSES: readonly InvestigationStatus[] = ["PLANNED", "RUNNING", "COMPLETED", "PARTIAL", "INTERRUPTED", "FAILED"];
const TASK_STATUSES: readonly InvestigationTaskStatus[] = ["PENDING", "RUNNING", "SUCCEEDED", "FAILED", "BUDGET_EXHAUSTED", "INTERRUPTED", "CANCELLED", "CACHED"];
/** The server's own id format; nothing else is an investigation id (never guessed, never derived). */
export const INVESTIGATION_ID = /^RINV_[0-9A-F]{32}$/;
/** The one provider of this build: the labelled stand-in (no model). */
export const STAND_IN_PROVIDER = "stand-in";

export interface InvestigationRoleKey { jobPoolUploadId: string; poolRoleId: string }
export interface InvestigationTask extends InvestigationRoleKey { status: InvestigationTaskStatus; errorCode: string | null; pairs: number; stored: number }
export interface StoredInvestigation {
  investigationId: string; analysisId: string; provider: typeof STAND_IN_PROVIDER; engineVersionHash: string; status: InvestigationStatus;
  createdAt: string; updatedAt: string; tasks: InvestigationTask[];
}
export type InvestigationState =
  | { state: "IDLE" }
  /** The user's own POST is open: the investigation runs (the route answers when it has run). */
  | { state: "STARTING"; roles: InvestigationRoleKey[]; confirmedCalls: number }
  | { state: "LOADING" }
  /** created: true (this POST ran it), false (an identical submit: the stored one, nothing ran), null (read by GET). */
  | { state: "STORED"; created: boolean | null; investigation: StoredInvestigation }
  /** The route refused the start: nothing ran. callsNeeded with ERR_INVESTIGATION_CALLS_NOT_CONFIRMED, max with ..._TOO_MANY_ROLES. */
  | { state: "REFUSED"; code: string; confirmedCalls: number; callsNeeded: number | null; max: number | null }
  | { state: "NOT_FOUND" }
  /** No readable answer. After a POST it is unknown whether anything ran. */
  | { state: "FAILED"; code: string | null };

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const isCount = (value: unknown): value is number => typeof value === "number" && Number.isInteger(value) && value >= 0;
const exactly = (value: Record<string, unknown>, keys: readonly string[]) => Object.keys(value).length === keys.length && keys.every(key => key in value);
const INVESTIGATION_KEYS = ["investigationId", "analysisId", "provider", "engineVersionHash", "status", "createdAt", "updatedAt"] as const;
const TASK_KEYS = ["jobPoolUploadId", "poolRoleId", "status", "errorCode", "pairs", "stored"] as const;

/** The stored investigation of exactly this analysis (and this id, when one is named), with its role tasks — or null. */
export function decodeStoredInvestigation(investigation: unknown, tasks: unknown, analysisId: string, investigationId?: string): StoredInvestigation | null {
  if (!isRecord(investigation) || !exactly(investigation, INVESTIGATION_KEYS)) return null;
  if (!isText(investigation.investigationId) || !INVESTIGATION_ID.test(investigation.investigationId) || (investigationId !== undefined && investigation.investigationId !== investigationId)) return null;
  if (investigation.analysisId !== analysisId || investigation.provider !== STAND_IN_PROVIDER || !isText(investigation.engineVersionHash) || !/^[0-9a-f]{64}$/.test(investigation.engineVersionHash)) return null;
  if (!STATUSES.includes(investigation.status as InvestigationStatus) || !isText(investigation.createdAt) || !isText(investigation.updatedAt)) return null;
  if (!Array.isArray(tasks) || tasks.length === 0) return null;
  const seen = new Set<string>();
  for (const task of tasks) {
    if (!isRecord(task) || !exactly(task, TASK_KEYS) || !isText(task.jobPoolUploadId) || !isText(task.poolRoleId) || !TASK_STATUSES.includes(task.status as InvestigationTaskStatus)) return null;
    if (!(task.errorCode === null || isText(task.errorCode)) || !isCount(task.pairs) || !isCount(task.stored)) return null;
    const key = `${task.jobPoolUploadId}\u0000${task.poolRoleId}`;
    if (seen.has(key)) return null;
    seen.add(key);
  }
  return { ...(investigation as unknown as Omit<StoredInvestigation, "tasks">), tasks: tasks as InvestigationTask[] };
}

const investigationsUrl = (analysisId: string) => `/api/career/analyses/${encodeURIComponent(analysisId)}/role-discovery/investigations`;
export const investigationUrl = (analysisId: string, investigationId: string) => `${investigationsUrl(analysisId)}/${encodeURIComponent(investigationId)}`;

const firstIssue = (body: unknown) => isRecord(body) && Array.isArray(body.issues) && isRecord(body.issues[0]) ? body.issues[0] : null;

export interface InvestigationRequest { jobPoolUploadIds: readonly string[]; roles: readonly InvestigationRoleKey[]; clientRequestId: string; confirmedCalls: number }

/** ONE POST: the start the user confirmed. 201 ran it (evidence STAND_IN), 200 is the stored one of an identical submit. */
export async function startInvestigation(analysisId: string, request: InvestigationRequest, fetcher: Fetcher = defaultFetcher): Promise<InvestigationState> {
  let response, body: unknown = null;
  const payload = { jobPoolUploadIds: [...request.jobPoolUploadIds], roles: request.roles.map(r => ({ jobPoolUploadId: r.jobPoolUploadId, poolRoleId: r.poolRoleId })), clientRequestId: request.clientRequestId, confirmedCalls: request.confirmedCalls };
  try { response = await fetcher(investigationsUrl(analysisId), { method: "POST", cache: "no-store", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); } catch { return { state: "FAILED", code: null }; }
  try { body = await response.json(); } catch { /* an undecodable body is FAILED below */ }
  if ((response.status === 201 || response.status === 200) && isRecord(body) && body.success === true) {
    const ran = response.status === 201;
    if (body.created !== ran || (ran ? body.evidenceClass !== "STAND_IN" : "evidenceClass" in body && body.evidenceClass !== "STAND_IN")) return { state: "FAILED", code: null };
    const investigation = decodeStoredInvestigation(body.investigation, body.tasks, analysisId);
    return investigation === null ? { state: "FAILED", code: null } : { state: "STORED", created: ran, investigation };
  }
  const issue = firstIssue(body);
  const code = isText(issue?.code) ? issue.code : null;
  // A refusal is an answer given before anything ran: a 4xx, or the cache refusal the route checks before it opens the investigation.
  // Every other 5xx may come from inside a run: FAILED, whether anything ran is unknown.
  const refused = response.status >= 400 && response.status < 500 || response.status === 503 && code === "ERR_RELATION_CACHE_UNAVAILABLE";
  if (code === null || !refused) return { state: "FAILED", code };
  return { state: "REFUSED", code, confirmedCalls: request.confirmedCalls, callsNeeded: isCount(issue?.callsNeeded) ? issue.callsNeeded : null, max: isCount(issue?.max) ? issue.max : null };
}

/** GET only: the stored state of one named investigation of this analysis. */
export async function readInvestigation(analysisId: string, investigationId: string, fetcher: Fetcher = defaultFetcher, signal?: AbortSignal): Promise<InvestigationState> {
  let response, body: unknown = null;
  try { response = await fetcher(investigationUrl(analysisId, investigationId), { method: "GET", cache: "no-store", signal }); } catch { return { state: "FAILED", code: null }; }
  try { body = await response.json(); } catch { /* FAILED below */ }
  if (response.status === 200) {
    const investigation = isRecord(body) && body.success === true ? decodeStoredInvestigation(body.investigation, body.tasks, analysisId, investigationId) : null;
    return investigation === null ? { state: "FAILED", code: null } : { state: "STORED", created: null, investigation };
  }
  const issue = firstIssue(body);
  if (response.status === 404 && issue?.code === "ERR_INVESTIGATION_NOT_FOUND") return { state: "NOT_FOUND" };
  return { state: "FAILED", code: isText(issue?.code) ? issue.code : null };
}

const newClientRequestId = () => typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID() : `crq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;

/**
 * The investigation of the analysis on view and its released pools. `start` sends one POST per call while none is open (a second
 * click during the run sends nothing); a new analysis or release drops a late answer. Nothing is started by this hook itself.
 */
export function useSemanticInvestigation(analysisId: string | null, pools: readonly string[] | null, fetcher?: Fetcher) {
  const key = analysisId === null || pools === null || pools.length === 0 ? null : JSON.stringify([analysisId, ...pools]);
  const [entry, setEntry] = useState<{ key: string | null; value: InvestigationState }>({ key: null, value: { state: "IDLE" } });
  const open = useRef(false);
  const current = useRef(key);
  current.current = key;
  const start = async (roles: readonly InvestigationRoleKey[], confirmedCalls: number): Promise<InvestigationState | null> => {
    if (key === null || open.current || roles.length === 0) return null;
    open.current = true;
    const startedFor = key;
    setEntry({ key: startedFor, value: { state: "STARTING", roles: [...roles], confirmedCalls } });
    const value = await startInvestigation(analysisId!, { jobPoolUploadIds: pools!, roles, clientRequestId: newClientRequestId(), confirmedCalls }, fetcher)
      .catch((): InvestigationState => ({ state: "FAILED", code: null }));
    open.current = false;
    if (current.current === startedFor) setEntry({ key: startedFor, value });
    return value;
  };
  return { state: entry.key === key && key !== null ? entry.value : { state: "IDLE" } as InvestigationState, start };
}
