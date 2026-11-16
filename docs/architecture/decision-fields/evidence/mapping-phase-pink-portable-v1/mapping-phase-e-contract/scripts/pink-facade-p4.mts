/**
 * PINK · PHASE-E · P-4 BOTH DIRECTIONS façade (local only). A rising role whose OWN fit changes is EVIDENCE (cut);
 * a byte-identical steady role displaced only by it is LAYOUT (eased, no luminance). Served through the app's own
 * polling path: phase A (RUNNING) reading1 → phase B (COMPLETED) reading2.
 *   reading1: Steady(q_y PARTIAL, fit .5) rank1, Rising(q_x DIFFERENT, fit 0) rank2
 *   reading2: Rising(q_x COVERS, fit 1) rank1, Steady(q_y PARTIAL, fit .5) rank2   → they swap places
 * Rising's own fit changed (ROLE_FIT_CHANGED) ⇒ EVIDENCE/cut/brightness/remount. Steady's fit unchanged, only its
 * place moved ⇒ LAYOUT/ease/no luminance/same element.
 */
import { createServer, request as httpRequest, type IncomingMessage, type ServerResponse } from "node:http";
import { connect } from "node:net";
import { appendFileSync } from "node:fs";
import { OUT_DIR } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
import { resolve } from "node:path";
const DEV_PORT = Number(process.env.PINK_DEV_PORT ?? "3121");
const PORT = Number(process.env.PINK_FACADE_PORT ?? "3120");
const w = process.env.PINK_WT ?? (() => { throw new Error("REFUSE: set PINK_WT — the former default was one machine's worktree"); })();
const LOG = process.env.PINK_FACADE_LOG ?? resolve(OUT_DIR, "facade-p4.log");
const { rankingOf, CAPS, POOL_A, sem } = await import(`${w}/test/career/mapping/fixtures.ts`);
const { projectionOf } = await import(`${w}/test/career/mapping-field/support.ts`);
const pxj = await import(`${w}/test/career/pxj-first-screen/fixtures.ts`);
const { autoMatchBody } = await import(`${w}/test/career/auto-capability/fixtures.ts`);
const ANALYSIS = "CAN_00000000000000000000000000000002";
const retarget = <T,>(v: T): T => JSON.parse(JSON.stringify(v).split(pxj.ANALYSIS).join(ANALYSIS)) as T;
const result = retarget({ ...pxj.resultBody(), capabilityProposalProjection: projectionOf(CAPS) });
const investigation = retarget(pxj.boundary({ mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null }));
const rs = (xState: string) => [
  { pool: POOL_A, roleId: "role_y", title: "Steady", requirements: [sem("q_y", "REQUIRED", "PARTIAL", "PCAP_TS", "TypeScript")] },
  { pool: POOL_A, roleId: "role_x", title: "Rising", requirements: [sem("q_x", "REQUIRED", xState as any, "PCAP_PG", "PostgreSQL")] }
];
const reading1 = rankingOf(rs("DIFFERENT")) as any;
const reading2 = rankingOf(rs("COVERS")) as any;
let phase: "A" | "B" = "A";
let runStep = 0;
function runningBody() { runStep += 1; const b = autoMatchBody("RUNNING", { lastProgressAt: new Date(Date.UTC(2026, 9, 22, 8, 0, runStep)).toISOString() }) as any; b.autoMatch.budget.rolesEvaluated = 1 + (runStep % 3); return b; }
const A = encodeURIComponent(ANALYSIS);
const ROUTES: Record<string, () => unknown> = {
  [`/api/career/analyses`]: () => ({ success: true, analyses: [{ analysisId: ANALYSIS, createdAt: "2026-10-22T08:00:00.000Z", validationState: "VERIFIED" }] }),
  [`/api/career/analyses/${A}`]: () => result,
  [`/api/career/analyses/${A}/investigation`]: () => ({ success: true, investigation }),
  [`/api/career/analyses/${A}/auto-match`]: () => (phase === "A" ? runningBody() : autoMatchBody("COMPLETED")),
  [`/api/career/analyses/${A}/job-ranking`]: () => ({ success: true, ranking: phase === "A" ? reading1 : reading2 }),
  [`/api/career/job-pools`]: () => ({ success: true, jobPools: [] })
};
const log = (l: string) => { try { appendFileSync(LOG, `${new Date().toISOString()} ${l}\n`); } catch {} };
const server = createServer((request, response) => {
  const url = request.url ?? "/"; const [path, query = ""] = url.split("?");
  if (path === "/__pink/flip") { if (new URLSearchParams(query).get("to") === "B") phase = "B"; response.writeHead(200, { "content-type": "application/json" }); response.end(JSON.stringify({ phase })); return; }
  if (path === "/__pink/state") { response.writeHead(200, { "content-type": "application/json" }); response.end(JSON.stringify({ phase })); return; }
  if (path.startsWith("/api/")) { const r = ROUTES[path]; if (!r) { if (request.method !== "GET") { log(`REFUSED ${request.method} ${path}`); response.writeHead(405); response.end("{}"); return; } log(`UNSCRIPTED ${path}`); response.writeHead(404, { "content-type": "application/json" }); response.end(JSON.stringify({ success: false, issues: [{ code: "ERR_FACADE_UNSCRIPTED" }] })); return; } log(`FIXTURE ${path} [${phase}]`); response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" }); response.end(JSON.stringify(r())); return; }
  const upstream = httpRequest({ host: "127.0.0.1", port: DEV_PORT, method: request.method, path: url, headers: request.headers }, answer => { response.writeHead(answer.statusCode ?? 502, answer.headers); answer.pipe(response); });
  upstream.on("error", () => { if (!response.headersSent) response.writeHead(502); response.end("ERR"); }); request.pipe(upstream);
});
server.on("upgrade", (request, socket, head) => { const up = connect(DEV_PORT, "127.0.0.1", () => { up.write(`${request.method} ${request.url} HTTP/1.1\r\n${Object.entries(request.headers).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join("\r\n")}\r\n\r\n`); if (head.length) up.write(head); up.pipe(socket); socket.pipe(up); }); up.on("error", () => socket.destroy()); socket.on("error", () => up.destroy()); });
server.listen(PORT, "127.0.0.1", () => console.info(`pink-p4-façade ${PORT} → ${DEV_PORT}  reading1 ranks ${reading1.ranks.map((r:any)=>r.role.poolRoleId+':'+r.fit)}  reading2 ${reading2.ranks.map((r:any)=>r.role.poolRoleId+':'+r.fit)}`));
