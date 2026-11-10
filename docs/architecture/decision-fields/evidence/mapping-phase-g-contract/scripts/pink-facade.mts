/**
 * PINK · PHASE-E PREP · INDEPENDENT VISUAL FAÇADE (local only; nothing committed).
 *
 * Mirrors the fixture wiring that test/career/mapping-field/field-d.test.tsx uses — the SHARED ground truth
 * (B-7: existing test data only). The render and every measurement are PINK's own; this process only serves
 * the same fixtures in front of a `next dev` detached at 86e36924 in PINK's OWN worktree. It is NOT attached
 * to GELB's port; PINK runs its own dev server and its own façade on its own ports.
 *
 * Read-only: every non-API request is proxied; every /api/* path not in the table is 404 + logged, so a read
 * the stage makes that we did not script is visible, never invented. No provider is reachable.
 */
import { createServer, request as httpRequest, type IncomingMessage, type ServerResponse } from "node:http";
import { connect } from "node:net";
import { appendFileSync } from "node:fs";

const DEV_PORT = Number(process.env.PINK_DEV_PORT ?? "3121");
const PORT = Number(process.env.PINK_FACADE_PORT ?? "3120");
const w = process.env.PINK_WT ?? "/tmp/claude-1000/-home-codi-Entwicklung/a060e5e1-d3f6-49b1-ab41-8710c6e835d7/scratchpad/wt-e-86e36924";
const LOG = process.env.PINK_FACADE_LOG ?? "/tmp/claude-1000/-home-codi-Entwicklung/a060e5e1-d3f6-49b1-ab41-8710c6e835d7/scratchpad/phase-e/facade.log";

const { rankingOf, CAPS, standardRoles } = await import(`${w}/test/career/mapping/fixtures.ts`);
const { allStates, keyCases } = await import(`${w}/test/career/mapping-field/support-d.ts`);
const { projectionOf } = await import(`${w}/test/career/mapping-field/support.ts`);
const pxj = await import(`${w}/test/career/pxj-first-screen/fixtures.ts`);
const { autoMatchBody } = await import(`${w}/test/career/auto-capability/fixtures.ts`);

const ANALYSIS = "CAN_00000000000000000000000000000002";
const retarget = <T,>(value: T): T => JSON.parse(JSON.stringify(value).split(pxj.ANALYSIS).join(ANALYSIS)) as T;

const result = retarget({ ...pxj.resultBody(), capabilityProposalProjection: projectionOf(CAPS) });
const investigation = retarget(pxj.boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }));
const ranking = rankingOf([allStates(), keyCases(), ...standardRoles()]);

const A = encodeURIComponent(ANALYSIS);
const ROUTES: Record<string, () => unknown> = {
  [`/api/career/analyses`]: () => ({ success: true, analyses: [{ analysisId: ANALYSIS, createdAt: "2026-10-22T08:00:00.000Z", validationState: "VERIFIED" }] }),
  [`/api/career/analyses/${A}`]: () => result,
  [`/api/career/analyses/${A}/investigation`]: () => ({ success: true, investigation }),
  [`/api/career/analyses/${A}/auto-match`]: () => autoMatchBody("COMPLETED"),
  [`/api/career/analyses/${A}/job-ranking`]: () => ({ success: true, ranking }),
  [`/api/career/job-pools`]: () => ({ success: true, jobPools: [] })
};

const log = (line: string) => { try { appendFileSync(LOG, `${new Date().toISOString()} ${line}\n`); } catch { /* convenience */ } };

function fixture(request: IncomingMessage, response: ServerResponse, path: string): boolean {
  const route = ROUTES[path];
  if (route === undefined) {
    if (request.method !== "GET") { log(`REFUSED ${request.method} ${path}`); response.writeHead(405, { "content-type": "application/json", "cache-control": "no-store" }); response.end(JSON.stringify({ success: false, issues: [{ code: "ERR_FACADE_WRITE_REFUSED" }] })); return true; }
    log(`UNSCRIPTED GET ${path}`);
    response.writeHead(404, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({ success: false, issues: [{ code: "ERR_FACADE_UNSCRIPTED", path }] }));
    return true;
  }
  log(`FIXTURE GET ${path}`);
  response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
  response.end(JSON.stringify(route()));
  return true;
}

const server = createServer((request, response) => {
  const url = request.url ?? "/";
  const path = url.split("?")[0];
  if (path.startsWith("/api/")) { fixture(request, response, path); return; }
  const upstream = httpRequest({ host: "127.0.0.1", port: DEV_PORT, method: request.method, path: url, headers: request.headers }, answer => {
    response.writeHead(answer.statusCode ?? 502, answer.headers);
    answer.pipe(response);
  });
  upstream.on("error", error => { log(`UPSTREAM ${path} ${error.message}`); if (!response.headersSent) response.writeHead(502, { "content-type": "text/plain" }); response.end("ERR_FACADE_UPSTREAM"); });
  request.pipe(upstream);
});

server.on("upgrade", (request, socket, head) => {
  const upstream = connect(DEV_PORT, "127.0.0.1", () => {
    upstream.write(`${request.method} ${request.url} HTTP/1.1\r\n${Object.entries(request.headers).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\r\n")}\r\n\r\n`);
    if (head.length > 0) upstream.write(head);
    upstream.pipe(socket); socket.pipe(upstream);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
});

server.listen(PORT, "127.0.0.1", () => {
  log(`START pink-façade ${PORT} → dev ${DEV_PORT} (analysis ${ANALYSIS}; ${ranking.ranks.length} ranks, evidenceClass ${String(ranking.evidenceClass)})`);
  console.info(`pink-façade http://127.0.0.1:${PORT}  dev ${DEV_PORT}  ranks ${ranking.ranks.length}  evidenceClass ${String(ranking.evidenceClass)}  caps ${result.capabilityProposalProjection.capabilities.length}`);
});
