import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Read boundary of the Gemini Result Inspector. The Career API has no authorization layer of its own, so the
 * inspector carries its own, closed by default: it answers only when CONDYN_RESULT_INSPECTOR=1 AND the request
 * presents CONDYN_RESULT_INSPECTOR_TOKEN (at least 32 characters) in the x-condyn-result-inspector-token header.
 * Every other case — switched off, misconfigured, missing or wrong token — gets the same 404 ERR_NOT_FOUND without
 * any data. It is distinguishable from a route Next.js does not know (HTML 404, PINK O-INSPECTOR-404-SHAPE) but tells
 * nothing about analyses or configuration. Switching it off needs no code change and leaves the pipeline untouched.
 */
export const RESULT_INSPECTOR_FLAG = "CONDYN_RESULT_INSPECTOR";
export const RESULT_INSPECTOR_TOKEN = "CONDYN_RESULT_INSPECTOR_TOKEN";
export const RESULT_INSPECTOR_HEADER = "x-condyn-result-inspector-token";
const MIN_TOKEN_LENGTH = 32;

export type ResultInspectorAccess = "ALLOWED" | "DISABLED" | "DENIED";

const digest = (value: string) => createHash("sha256").update(value, "utf8").digest();

export function resultInspectorAccess(request: Request, environment: Record<string, string | undefined> = process.env): ResultInspectorAccess {
  const token = environment[RESULT_INSPECTOR_TOKEN] ?? "";
  if (environment[RESULT_INSPECTOR_FLAG] !== "1" || token.length < MIN_TOKEN_LENGTH) return "DISABLED";
  const presented = request.headers.get(RESULT_INSPECTOR_HEADER) ?? "";
  return timingSafeEqual(digest(presented), digest(token)) ? "ALLOWED" : "DENIED";
}
