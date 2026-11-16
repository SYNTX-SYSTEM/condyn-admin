/**
 * PINK · PHASE-E P-13 FAÇADE · evidence-change-blindness provocation (local only; nothing committed).
 *
 * Independent of GELB's instrument. Serves the SHARED fixtures (B-7) in front of PINK's own prod server at
 * 716a1941. Drives the app's OWN polling path to a previous→next reading pair:
 *
 *   phase A  — auto-match RUNNING (keeps useAutoMatch polling), job-ranking = reading A  (q_covers = COVERS)
 *   phase B  — auto-match COMPLETED (rankingKey advances → job-ranking re-read), reading B (q_covers = EQUIVALENT)
 *   phase A2 — auto-match COMPLETED, job-ranking = reading A2 (byte-identical content to A, new object): the
 *              INVERSE — a re-read in which nothing changes. Must mark nothing even though object identity changed.
 *
 * COVERS and EQUIVALENT both carry SEMANTIC_VALUE 1, so fit/rank/tier/order are unchanged and the strict
 * decoder (lib/career/ui/auto-match.ts) accepts reading B: a PURE evidence change that moves nothing.
 *
 * Control (local only, GET): /__pink/flip?to=B|A2 , /__pink/reset , /__pink/state
 * Read-only toward the app: every non-/api, non-/__pink request is proxied; unscripted /api is 404 + logged.
 */
import { createServer, request as httpRequest, type IncomingMessage, type ServerResponse } from "node:http";
import { connect } from "node:net";
import { appendFileSync } from "node:fs";

import { OUT_DIR } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
import { resolve } from "node:path";
const DEV_PORT = Number(process.env.PINK_DEV_PORT ?? "3121");
const PORT = Number(process.env.PINK_FACADE_PORT ?? "3120");
const w = process.env.PINK_WT ?? (() => { throw new Error("REFUSE: set PINK_WT — the former default was one machine's worktree"); })();
const LOG = process.env.PINK_FACADE_LOG ?? resolve(OUT_DIR, "facade-p13.log");

const { rankingOf, CAPS, standardRoles } = await import(`${w}/test/career/mapping/fixtures.ts`);
const { allStates, keyCases } = await import(`${w}/test/career/mapping-field/support-d.ts`);
const { projectionOf } = await import(`${w}/test/career/mapping-field/support.ts`);
const pxj = await import(`${w}/test/career/pxj-first-screen/fixtures.ts`);
const { autoMatchBody } = await import(`${w}/test/career/auto-capability/fixtures.ts`);

const ANALYSIS = "CAN_00000000000000000000000000000002";
const retarget = <T,>(value: T): T => JSON.parse(JSON.stringify(value).split(pxj.ANALYSIS).join(ANALYSIS)) as T;
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

const result = retarget({ ...pxj.resultBody(), capabilityProposalProjection: projectionOf(CAPS) });
const investigation = retarget(pxj.boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }));

// reading A (COVERS) — the shared ground truth
const readingA = rankingOf([allStates(), keyCases(), ...standardRoles()]) as any;

// reading B — exactly one requirement (q_covers of role_all) COVERS -> EQUIVALENT; value/contribution unchanged
const readingB = clone(readingA);
let target: { pool: string; roleId: string; reqId: string } | null = null;
let flippedOk = false;
for (const rank of readingB.ranks) {
  for (const r of rank.requirements) {
    if (r.source === "SEMANTIC" && r.state === "COVERS") {
      const before = { state: r.state, value: r.value, contribution: r.contribution };
      r.state = "EQUIVALENT"; // SEMANTIC_VALUE EQUIVALENT === COVERS === 1 ⇒ value & contribution unchanged
      flippedOk = r.value === before.value && r.contribution === before.contribution;
      target = { pool: rank.role.jobPoolUploadId, roleId: rank.role.poolRoleId, reqId: r.poolRequirementId };
      break;
    }
  }
  if (target) break;
}
// reading A2 — identical content to A, fresh object (inverse: a re-read that changes nothing)
const readingA2 = clone(readingA);
// reading A3 — ATTACK: q_covers.requirementText changed, but source/state/key UNCHANGED. diffRankings emits no
// REQUIREMENT_STATE_CHANGED / REQUIREMENT_KEY_CHANGED, so E-4b must mark NOTHING. A shallow/identity fix would mark it.
const readingA3 = clone(readingA);
for (const rank of readingA3.ranks) for (const r of rank.requirements) if (r.poolRequirementId === (target?.reqId)) r.requirementText = `${r.requirementText} (reworded, same evidence)`;

type Phase = "A" | "B" | "A2" | "A3";
let phase: Phase = "A";

const A = encodeURIComponent(ANALYSIS);
// Phase A keeps the run MOVING (rolesEvaluated 1→2→3 cycling, fresh lastProgressAt) so useAutoMatch does not back
// off past its 2 s interval — the flip to COMPLETED is then picked up within ~2 s, not after exponential backoff.
let runStep = 0;
function runningBody() {
  runStep += 1;
  const rolesEvaluated = 1 + (runStep % 3); // 2,3,1,2,3,... all ≤ rolesPlanned(4), always changing
  const body = autoMatchBody("RUNNING", { lastProgressAt: new Date(Date.UTC(2026, 9, 22, 8, 0, runStep)).toISOString() }) as any;
  body.autoMatch.budget.rolesEvaluated = rolesEvaluated;
  return body;
}
const autoMatchFor = () => (phase === "A" ? runningBody() : autoMatchBody("COMPLETED"));
const rankingFor = () => (phase === "A" ? readingA : phase === "B" ? readingB : phase === "A3" ? readingA3 : readingA2);
const ROUTES: Record<string, () => unknown> = {
  [`/api/career/analyses`]: () => ({ success: true, analyses: [{ analysisId: ANALYSIS, createdAt: "2026-10-22T08:00:00.000Z", validationState: "VERIFIED" }] }),
  [`/api/career/analyses/${A}`]: () => result,
  [`/api/career/analyses/${A}/investigation`]: () => ({ success: true, investigation }),
  [`/api/career/analyses/${A}/auto-match`]: () => autoMatchFor(),
  [`/api/career/analyses/${A}/job-ranking`]: () => ({ success: true, ranking: rankingFor() }),
  [`/api/career/job-pools`]: () => ({ success: true, jobPools: [] })
};

const log = (line: string) => { try { appendFileSync(LOG, `${new Date().toISOString()} ${line}\n`); } catch { /* convenience */ } };

function control(request: IncomingMessage, response: ServerResponse, path: string, query: string): boolean {
  if (path === "/__pink/flip") { const to = new URLSearchParams(query).get("to") as Phase | null; if (to === "B" || to === "A2" || to === "A3") { phase = to; log(`FLIP -> ${phase}`); } }
  else if (path === "/__pink/reset") { phase = "A"; log("RESET -> A"); }
  else if (path !== "/__pink/state") return false;
  response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
  response.end(JSON.stringify({ phase, target, flippedOk }));
  return true;
}

function fixture(request: IncomingMessage, response: ServerResponse, path: string): boolean {
  const route = ROUTES[path];
  if (route === undefined) {
    if (request.method !== "GET") { log(`REFUSED ${request.method} ${path}`); response.writeHead(405, { "content-type": "application/json", "cache-control": "no-store" }); response.end(JSON.stringify({ success: false, issues: [{ code: "ERR_FACADE_WRITE_REFUSED" }] })); return true; }
    log(`UNSCRIPTED GET ${path}`);
    response.writeHead(404, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({ success: false, issues: [{ code: "ERR_FACADE_UNSCRIPTED", path }] }));
    return true;
  }
  log(`FIXTURE GET ${path} [${phase}]`);
  response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
  response.end(JSON.stringify(route()));
  return true;
}

const server = createServer((request, response) => {
  const url = request.url ?? "/";
  const [path, query = ""] = url.split("?");
  if (path.startsWith("/__pink/")) { if (control(request, response, path, query)) return; }
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
  log(`START pink-p13-façade ${PORT} → app ${DEV_PORT} target=${JSON.stringify(target)} flippedOk=${flippedOk}`);
  console.info(`pink-p13-façade http://127.0.0.1:${PORT}  app ${DEV_PORT}  target ${JSON.stringify(target)}  flippedOk ${flippedOk}  ranks ${readingA.ranks.length}`);
});
