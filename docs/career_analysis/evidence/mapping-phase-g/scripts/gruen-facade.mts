/**
 * GRÜN · PHASE-G DEVELOPMENT INSTRUMENT · FIXTURE FAÇADE (GRÜN's own ports, GRÜN's own render).
 *
 * Serves exactly the fixtures `test/career/mapping-field/field-g.test.tsx` already uses — the SHARED ground
 * truth (B-7: existing test data only, no new fixture invented) — in front of a PRODUCTION build of THIS
 * worktree. A production build is required, not `next dev`: the standing finding is that Turbopack dev does
 * not hydrate headless, so visual acceptance and every pixel reading need `next build` + `next start`.
 *
 * Ports are GRÜN's alone and collide with no other lane: façade 3220 → prod 3221. GELB's :3020 and PINK's
 * :3120/:3121 are untouched; :3017 (the DLL owner demo) is not started.
 *
 * Read-only by construction: every non-API request is proxied to the prod server; every /api/* path not in
 * the table below answers 404 and is logged, so a read the stage makes that GRÜN did not script is VISIBLE,
 * never invented. No provider is reachable and Gemini is not configured — no model call can occur.
 */
import { createServer, request as httpRequest, type IncomingMessage, type ServerResponse } from "node:http";
import { connect } from "node:net";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const PROD_PORT = Number(process.env.GRUEN_PROD_PORT ?? "3221");
const PORT = Number(process.env.GRUEN_FACADE_PORT ?? "3220");
const LOG = process.env.GRUEN_FACADE_LOG ?? resolve(here, "../outputs/facade.log");
mkdirSync(dirname(LOG), { recursive: true });

const { rankingOf, CAPS, standardRoles } = await import(`${WT}/test/career/mapping/fixtures.ts`);
const { allStates, keyCases } = await import(`${WT}/test/career/mapping-field/support-d.ts`);
const { projectionOf } = await import(`${WT}/test/career/mapping-field/support.ts`);
const pxj = await import(`${WT}/test/career/pxj-first-screen/fixtures.ts`);
const { autoMatchBody } = await import(`${WT}/test/career/auto-capability/fixtures.ts`);

const ANALYSIS = "CAN_00000000000000000000000000000002";
const retarget = <T,>(value: T): T => JSON.parse(JSON.stringify(value).split(pxj.ANALYSIS).join(ANALYSIS)) as T;

/** The same three role groups field-g.test.tsx renders: every coupling state, the key cases, the standard roles. */
const ranking = rankingOf([allStates(), keyCases(), ...standardRoles()]);
const result = retarget({ ...pxj.resultBody(), capabilityProposalProjection: projectionOf(CAPS) });
const investigation = retarget(pxj.boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }));

const A = encodeURIComponent(ANALYSIS);
const ROUTES: Record<string, () => unknown> = {
  "/api/career/analyses": () => ({ success: true, analyses: [{ analysisId: ANALYSIS, createdAt: "2026-11-09T08:00:00.000Z", validationState: "VERIFIED" }] }),
  [`/api/career/analyses/${A}`]: () => result,
  [`/api/career/analyses/${A}/investigation`]: () => ({ success: true, investigation }),
  [`/api/career/analyses/${A}/auto-match`]: () => autoMatchBody("COMPLETED"),
  [`/api/career/analyses/${A}/job-ranking`]: () => ({ success: true, ranking }),
  "/api/career/job-pools": () => ({ success: true, jobPools: [] })
};

const log = (line: string) => { try { appendFileSync(LOG, `${new Date().toISOString()} ${line}\n`); } catch { /* convenience only */ } };

function fixture(request: IncomingMessage, response: ServerResponse, path: string): void {
  const route = ROUTES[path];
  if (route === undefined) {
    if (request.method !== "GET") {
      log(`REFUSED ${request.method} ${path}`);
      response.writeHead(405, { "content-type": "application/json", "cache-control": "no-store" });
      response.end(JSON.stringify({ success: false, issues: [{ code: "ERR_FACADE_WRITE_REFUSED" }] }));
      return;
    }
    log(`UNSCRIPTED GET ${path}`);
    response.writeHead(404, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({ success: false, issues: [{ code: "ERR_FACADE_UNSCRIPTED", path }] }));
    return;
  }
  log(`FIXTURE GET ${path}`);
  response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
  response.end(JSON.stringify(route()));
}

const server = createServer((request, response) => {
  const url = request.url ?? "/";
  const path = url.split("?")[0];
  if (path.startsWith("/api/")) { fixture(request, response, path); return; }
  const upstream = httpRequest({ host: "127.0.0.1", port: PROD_PORT, method: request.method, path: url, headers: request.headers }, answer => {
    response.writeHead(answer.statusCode ?? 502, answer.headers);
    answer.pipe(response);
  });
  upstream.on("error", error => {
    log(`UPSTREAM ${path} ${error.message}`);
    if (!response.headersSent) response.writeHead(502, { "content-type": "text/plain" });
    response.end("ERR_FACADE_UPSTREAM");
  });
  request.pipe(upstream);
});

server.on("upgrade", (request, socket, head) => {
  const upstream = connect(PROD_PORT, "127.0.0.1", () => {
    upstream.write(`${request.method} ${request.url} HTTP/1.1\r\n${Object.entries(request.headers).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\r\n")}\r\n\r\n`);
    if (head.length > 0) upstream.write(head);
    upstream.pipe(socket); socket.pipe(upstream);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
});

server.listen(PORT, "127.0.0.1", () => {
  log(`START gruen-façade ${PORT} → prod ${PROD_PORT} (analysis ${ANALYSIS}; ${ranking.ranks.length} ranks)`);
  console.info(`gruen-façade http://127.0.0.1:${PORT} → prod ${PROD_PORT} · ranks ${ranking.ranks.length} · caps ${result.capabilityProposalProjection.capabilities.length} · wt ${WT}`);
});
