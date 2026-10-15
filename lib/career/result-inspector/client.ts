/**
 * Browser-safe client of the Result Inspector routes for the GEMINI OUTPUT panel (GRÜN integrates it on its own
 * mandate). No Node imports, no storage: the operator's token is passed per call and held by the caller in memory
 * only; nothing is written to localStorage, IndexedDB, cookies or URLs. Reading never starts an analysis: GET only, no
 * retry. Responses are decoded strictly; anything that does not carry the expected version and states is FAILED, so a
 * processed artifact can never be shown in place of a missing original response.
 */
import type { GeminiExchangeInspection, GeminiResultInspection } from "./reader";

export const RESULT_INSPECTOR_TOKEN_HEADER = "x-condyn-result-inspector-token";

export type InspectorReadState<T> =
  | { state: "AVAILABLE"; value: T }
  /** Switched off, not configured or wrong token — the route answers like an unknown route. */
  | { state: "CLOSED" }
  | { state: "NOT_FOUND" }
  | { state: "LINEAGE_INVALID" }
  | { state: "FAILED" };

type Fetch = (input: string, init: { method: "GET"; headers: Record<string, string>; cache: "no-store"; signal?: AbortSignal }) => Promise<{ status: number; json(): Promise<unknown> }>;

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

export function decodeGeminiResultInspection(value: unknown): GeminiResultInspection | null {
  if (!isRecord(value) || value.inspectionVersion !== "GEMINI_RESULT_INSPECTION_V1" || typeof value.analysisId !== "string" || typeof value.jobId !== "string") return null;
  const input = value.investigationInput, original = value.originalGeminiResponse;
  if (!isRecord(input) || !["PERSON", "PERSON_X_JOB", "UNDECLARED"].includes(input.investigationMode as string) || typeof input.discoveryRunId !== "string") return null;
  if (!isRecord(input.investigationScope) || !["RETAINED", "NOT_RETAINED", "UNSCOPED"].includes(input.investigationScope.state as string)) return null;
  if (!isRecord(original)) return null;
  if (original.state === "NOT_RETAINED") { if (Object.keys(original).length !== 1) return null; }
  else if (original.state !== "RETAINED" || typeof original.text !== "string" || typeof original.exchangeId !== "string" || typeof original.expiresAt !== "string") return null;
  if (!isRecord(value.parserResult) || !isRecord(value.evidenceVerification) || !Array.isArray(value.evidenceVerification.candidates) || !isRecord(value.convergence)) return null;
  return value as unknown as GeminiResultInspection;
}

export function decodeGeminiExchangeInspection(value: unknown): GeminiExchangeInspection | null {
  if (!isRecord(value) || value.inspectionVersion !== "GEMINI_EXCHANGE_INSPECTION_V1" || typeof value.jobId !== "string" || !Array.isArray(value.exchanges)) return null;
  for (const exchange of value.exchanges) {
    if (!isRecord(exchange) || !["COMPLETED", "FAILED"].includes(exchange.outcome as string) || typeof exchange.exchangeId !== "string" || typeof exchange.runId !== "string") return null;
    if ((exchange.outcome === "COMPLETED") !== (exchange.errorCode === null)) return null;
    if (!isRecord(exchange.response) || !(typeof exchange.response.text === "string" || exchange.response.text === null)) return null;
    if (!isRecord(exchange.attempt) || exchange.attempt.jobId !== value.jobId) return null;
  }
  return value as unknown as GeminiExchangeInspection;
}

async function read<T>(fetchImpl: Fetch, url: string, token: string, decode: (body: unknown) => T | null, signal?: AbortSignal): Promise<InspectorReadState<T>> {
  let response;
  try { response = await fetchImpl(url, { method: "GET", headers: { [RESULT_INSPECTOR_TOKEN_HEADER]: token }, cache: "no-store", signal }); } catch { return { state: "FAILED" }; }
  let body: unknown;
  try { body = await response.json(); } catch { return { state: response.status === 404 ? "CLOSED" : "FAILED" }; }
  const code = isRecord(body) && Array.isArray(body.issues) && isRecord(body.issues[0]) ? body.issues[0].code : null;
  if (response.status === 404) return { state: code === "ERR_NOT_FOUND" ? "CLOSED" : "NOT_FOUND" };
  if (response.status === 409) return { state: "LINEAGE_INVALID" };
  if (response.status !== 200 || !isRecord(body) || body.success !== true) return { state: "FAILED" };
  const decoded = decode(body.inspection);
  return decoded === null ? { state: "FAILED" } : { state: "AVAILABLE", value: decoded };
}

/** Phases of one analysis (original response, parser, verification, Convergence, projection). */
export function readGeminiResultInspection(fetchImpl: Fetch, analysisId: string, token: string, signal?: AbortSignal) {
  return read(fetchImpl, `/api/career/analyses/${encodeURIComponent(analysisId)}/gemini-result`, token, decodeGeminiResultInspection, signal);
}

/** Every archived exchange of one job, also failed ones. */
export function readGeminiExchangeInspection(fetchImpl: Fetch, jobId: string, token: string, signal?: AbortSignal) {
  return read(fetchImpl, `/api/career/jobs/${encodeURIComponent(jobId)}/gemini-exchanges`, token, decodeGeminiExchangeInspection, signal);
}

/**
 * B2 display guard: a selected-role comparison may be shown only while its binding equals the current selection
 * and analysis. Any difference means the data belongs to another scope and must be discarded.
 */
export function comparisonBelongsToSelection(comparison: { binding?: { analysisId?: unknown; jobPoolUploadId?: unknown; poolRoleId?: unknown }; authority?: { scored?: unknown; capabilityRequirementRelationState?: unknown } } | null | undefined, current: { analysisId: string; jobPoolUploadId: string; poolRoleId: string }): boolean {
  return !!comparison && comparison.authority?.scored === false && comparison.authority?.capabilityRequirementRelationState === "NOT_EVALUATED"
    && comparison.binding?.analysisId === current.analysisId && comparison.binding?.jobPoolUploadId === current.jobPoolUploadId && comparison.binding?.poolRoleId === current.poolRoleId;
}
