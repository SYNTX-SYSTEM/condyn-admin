/* Controlled live-Gemini relay for the END-TO-END VIDEO lab (owner "SFE — GELB | GRÜN-STAPEL INTEGRATION + VIDEO FREEZE", 2026-10-19:
 * "Ein echter Gemini-Test ist als nächster gesonderter Schritt vorgesehen; noch kein unkontrollierter Modellaufruf").
 *
 * Used ONLY when video-lab.ts runs with VIDEO_LAB_GEMINI=live, which itself requires the owner's separate GO. The worker keeps its
 * network sentinel (loopback only) and a dummy key; it reaches Gemini solely through this loopback relay, which runs in the lab
 * process and:
 *   - forwards only POST /v1beta/models/<the one configured model>:generateContent, nothing else (other models of the provider
 *     cascade, countTokens, models.get, embeddings: refused locally with 403, never forwarded, not counted);
 *   - replaces the dummy x-goog-api-key with the real key, which never enters the server's or the worker's environment;
 *   - forwards at most BUDGET calls in the lab's lifetime; every further call is refused locally with 429 (not forwarded);
 *   - records per call kind, model, whether an INVESTIGATION_SCOPE block was present, upstream status, latency and sizes — never the
 *     request or response content and never the key (the content is the run's own record in the disposable database, which the
 *     GEMINI OUTPUT inspector reads and the lab drops on stop). */
import { createServer, type Server } from "node:http";

export interface RelayRecord { at: string; path: string; kind: "DISCOVERY" | "CONVERGENCE" | "LEGACY" | "OTHER"; scopeBlock: boolean; forwarded: boolean; status: number; reason?: string; ms?: number; requestBytes: number; responseBytes?: number; budgetLeft: number }
export interface RelayOptions { apiKey: string; model: string; budget: number; upstream?: string; onRecord: (record: RelayRecord) => void }

const GEMINI = "https://generativelanguage.googleapis.com";
const kindOf = (raw: string): RelayRecord["kind"] => raw.includes("CONDYN CAPABILITY DISCOVERY SOURCE CORPUS") ? "DISCOVERY" : raw.includes("CONDYN CAPABILITY CONVERGENCE INPUT") ? "CONVERGENCE" : raw.includes("PC-CONDYN-CAP-v1.0") ? "LEGACY" : "OTHER";

export function startGeminiRelay(options: RelayOptions): Promise<{ server: Server; port: number; used: () => number }> {
  const upstream = options.upstream ?? GEMINI;
  // A test may point the relay at a loopback fake; anything else than Gemini itself or loopback is refused at start.
  if (upstream !== GEMINI && !/^http:\/\/127\.0\.0\.1:\d+$/.test(upstream)) throw new Error("relay upstream must be Gemini or a loopback test double");
  if (!/^[A-Za-z0-9._-]+$/.test(options.model)) throw new Error("relay model name is not a plain model id");
  if (!Number.isInteger(options.budget) || options.budget < 1 || options.budget > 12) throw new Error("relay budget must be 1..12");
  if (options.apiKey.length < 20) throw new Error("relay key missing");
  const allowed = `/v1beta/models/${options.model}:generateContent`;
  let used = 0;
  const server = createServer(async (request, response) => {
    let raw = ""; for await (const chunk of request) raw += String(chunk);
    const path = (request.url ?? "").split("?")[0];
    const base = { at: new Date().toISOString(), path, kind: kindOf(raw), scopeBlock: raw.includes("<INVESTIGATION_SCOPE>"), requestBytes: Buffer.byteLength(raw) };
    const refuse = (status: number, reason: string) => {
      options.onRecord({ ...base, forwarded: false, status, reason, budgetLeft: options.budget - used });
      response.writeHead(status, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { code: status, message: `video relay: ${reason}`, status: status === 429 ? "RESOURCE_EXHAUSTED" : "PERMISSION_DENIED" } }));
    };
    if (request.method !== "POST" || path !== allowed) return refuse(403, "only generateContent of the configured model is forwarded");
    if (used >= options.budget) return refuse(429, "live call budget of this lab exhausted");
    used += 1;
    const t0 = Date.now();
    try {
      const upstreamResponse = await fetch(`${upstream}${allowed}`, { method: "POST", headers: { "content-type": "application/json", "x-goog-api-key": options.apiKey }, body: raw });
      const text = await upstreamResponse.text();
      options.onRecord({ ...base, forwarded: true, status: upstreamResponse.status, ms: Date.now() - t0, responseBytes: Buffer.byteLength(text), budgetLeft: options.budget - used });
      response.writeHead(upstreamResponse.status, { "content-type": upstreamResponse.headers.get("content-type") ?? "application/json" });
      response.end(text);
    } catch (error) {
      options.onRecord({ ...base, forwarded: true, status: 502, reason: String((error as Error)?.name ?? "fetch failed"), ms: Date.now() - t0, budgetLeft: options.budget - used });
      response.writeHead(502, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { code: 502, message: "video relay: upstream unreachable", status: "UNAVAILABLE" } }));
    }
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve({ server, port: (server.address() as { port: number }).port, used: () => used })));
}
