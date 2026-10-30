import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Every call of the Gemini API that can generate content passes through ONE seam (owner mandate THREE-POINT, point 2): a call is
 * written down BEFORE it is sent (write-ahead) and counted from the moment it may have left the process. Inside a job context
 * (the worker binds one per job) a call without a register row does not happen; outside of one (tests, scripts, stand-ins) the call
 * is passed through unchanged, so nothing existing changes.
 */
export type ProviderCallStage = "EXTRACTION_LEGACY" | "EXTRACTION_DISCOVERY" | "EXTRACTION_CONVERGENCE" | "SEMANTIC";
export type ProviderErrorClass = "TRANSIENT" | "PERMANENT" | "INCOMPLETE" | "EMPTY" | "UNKNOWN";
export interface ProviderCallMeta { investigationId?: string; jobPoolUploadId?: string; poolRoleId?: string; attempt?: number }
export interface ProviderFailureInfo { errorClass: ProviderErrorClass; errorCode: string; httpStatus: number | null }

export interface ProviderCallRecorder {
  /** Reserves one unit of the job budget and writes the row (RESERVED); throws ProviderCallBlocked when the budget is spent or the row cannot be written. */
  begin(input: { stage: ProviderCallStage } & ProviderCallMeta): Promise<string>;
  markSent(callId: string): Promise<void>;
  complete(callId: string, bytes: { requestBytes: number; responseBytes: number }): Promise<void>;
  failAfterSend(callId: string, info: ProviderFailureInfo & { requestBytes: number }): Promise<void>;
  failBeforeSend(callId: string, code: string): Promise<void>;
}

/** The call was not sent and must not be: budget spent or no register row possible. Never a provider failure; nothing was reserved or it was released. */
export class ProviderCallBlocked extends Error {
  constructor(readonly code: "ERR_PROVIDER_CALL_BUDGET_EXHAUSTED" | "ERR_PROVIDER_CALL_REGISTER_FAILED") { super(code); this.name = "ProviderCallBlocked"; }
}

interface Context { recorder: ProviderCallRecorder; meta: ProviderCallMeta }
const storage = new AsyncLocalStorage<Context>();
export const runWithProviderCallRecorder = <T>(recorder: ProviderCallRecorder, fn: () => T): T => storage.run({ recorder, meta: {} }, fn);
export const withProviderCallMeta = <T>(meta: ProviderCallMeta, fn: () => T): T => { const ctx = storage.getStore(); return ctx ? storage.run({ ...ctx, meta: { ...ctx.meta, ...meta } }, fn) : fn(); };
export const providerCallRecorderActive = (): boolean => storage.getStore() !== undefined;

/** HTTP status of an SDK error, when it carries one. */
export function httpStatusOf(error: unknown): number | null {
  const e = error as { status?: unknown; code?: unknown; response?: { status?: unknown } } | null;
  for (const v of [e?.status, e?.response?.status, e?.code]) if (typeof v === "number" && v >= 100 && v < 600) return v;
  return null;
}

const NETWORK = /fetch failed|ECONNRESET|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket|network|aborted|timeout|timed out|UND_ERR|terminated|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i;
/**
 * Class of a failure of a call that was sent: TRANSIENT may succeed when asked again (request timeout, 429, 5xx, a broken or
 * timed-out connection), PERMANENT will not (other 4xx); anything else stays UNKNOWN and is never retried automatically.
 */
export function classifyProviderError(error: unknown): ProviderFailureInfo {
  const httpStatus = httpStatusOf(error);
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  if (httpStatus !== null) {
    if ([408, 429, 500, 502, 503, 504].includes(httpStatus)) return { errorClass: "TRANSIENT", errorCode: `HTTP_${httpStatus}`, httpStatus };
    if (httpStatus >= 400 && httpStatus < 500) return { errorClass: "PERMANENT", errorCode: `HTTP_${httpStatus}`, httpStatus };
    if (httpStatus >= 500) return { errorClass: "TRANSIENT", errorCode: `HTTP_${httpStatus}`, httpStatus };
  }
  if (NETWORK.test(message)) return { errorClass: "TRANSIENT", errorCode: "NETWORK", httpStatus };
  return { errorClass: "UNKNOWN", errorCode: "UNCLASSIFIED", httpStatus };
}

/**
 * Sends one call through the register. `send` is the generateContent call itself; it is invoked only after the row exists and is
 * marked SENT. A throw of `send` is a call that may have left the process: it stays counted (FAILED_AFTER_SEND) and the original
 * error propagates unchanged. Without a bound recorder `send` runs as it always did.
 */
export async function guardedGenerateContent<T>(stage: ProviderCallStage, send: () => Promise<T>, size: { requestBytes?: number; responseBytes?: (result: T) => number } = {}): Promise<T> {
  const ctx = storage.getStore();
  if (!ctx) return send();
  const { recorder } = ctx;
  let callId: string;
  try { callId = await recorder.begin({ stage, ...ctx.meta }); } catch (error) { throw error instanceof ProviderCallBlocked ? error : new ProviderCallBlocked("ERR_PROVIDER_CALL_REGISTER_FAILED"); }
  try { await recorder.markSent(callId); } catch { await recorder.failBeforeSend(callId, "ERR_PROVIDER_CALL_REGISTER_FAILED").catch(() => undefined); throw new ProviderCallBlocked("ERR_PROVIDER_CALL_REGISTER_FAILED"); }
  let result: T;
  try { result = await send(); } catch (error) {
    await recorder.failAfterSend(callId, { ...classifyProviderError(error), requestBytes: size.requestBytes ?? 0 }).catch(() => undefined);
    throw error;
  }
  await recorder.complete(callId, { requestBytes: size.requestBytes ?? 0, responseBytes: size.responseBytes ? size.responseBytes(result) : 0 }).catch(() => undefined);
  return result;
}
