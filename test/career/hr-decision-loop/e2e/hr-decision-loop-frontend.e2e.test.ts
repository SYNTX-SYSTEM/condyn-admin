/**
 * HR Decision Loop frontend e2e: real `next dev` server, isolated PostgreSQL
 * world, real HTTP, server-rendered SIL page and (when Playwright is
 * resolvable) a real Chromium session driving the dock.
 *
 * Playwright is not a dependency of this repository. Point
 * CONDYN_PLAYWRIGHT_MODULE at a `playwright` package directory (any project
 * with a matching browser install) to run the browser section; otherwise it
 * is reported as skipped, never as passed.
 */
import { createRequire } from "node:module";
import { once } from "node:events";
import { createServer } from "node:net";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { decodeDecisionContextRevisionPresentation, decodeHrDecisionLoopPresentation, decodeHumanDecisionRecordPresentation } from "../../../../lib/career/hr-decision-loop/frontend-presentation";
import { declareHumanDecision, fetchHrDecisionLoop, readDecisionContextLineage } from "../../../../lib/career/ui/useHrDecisionLoop";
import { HR_DECISION_LOOP_REGION_NAMES } from "../../../../lib/career/hr-decision-loop/read-model";
import { createHrLoopPostgresWorld, HR_LOOP_DECIDER, HR_LOOP_G3_PAYLOAD_MARKER, type HrLoopWorld } from "../fixtures/hr-loop-postgres-world";

const PRINCIPAL_HEADERS = { "x-condyn-principal-issuer": "LOCAL_DEVELOPMENT_SELF_DECLARED", "x-condyn-principal-subject": HR_LOOP_DECIDER };
const EVIDENCE_DIR = resolve(process.cwd(), "docs/career_analysis/evidence/hr-decision-loop");

function resolvePlaywright(): string | null {
  const explicit = process.env.CONDYN_PLAYWRIGHT_MODULE;
  if (explicit !== undefined && explicit.length > 0) return explicit;
  try { return createRequire(resolve(process.cwd(), "package.json")).resolve("playwright"); } catch { return null; }
}
const playwrightModule = resolvePlaywright();

let world: HrLoopWorld;
let server: ChildProcess;
let port: number;
let serverOutput = "";
let readiness: { status: number; body: unknown };
const base = () => `http://127.0.0.1:${port}`;
const delay = (ms: number) => new Promise<void>(done => setTimeout(done, ms));

async function availablePort(): Promise<number> {
  const listener = createServer();
  await new Promise<void>((ok, fail) => { listener.once("error", fail); listener.listen(0, "127.0.0.1", () => ok()); });
  const address = listener.address();
  if (address === null || typeof address === "string") throw new Error("no port");
  await new Promise<void>((ok, fail) => listener.close(error => error ? fail(error) : ok()));
  return address.port;
}

async function waitForReadiness(): Promise<{ status: number; body: unknown }> {
  const url = `${base()}/api/career/hr-decision-loop/contexts/DCTXREV_READINESS_ABSENT`;
  for (let attempt = 0; attempt < 160; attempt += 1) {
    try {
      const response = await fetch(url);
      const body = await response.json();
      if (response.status === 404) return { status: response.status, body };
    } catch { /* not ready */ }
    await delay(500);
  }
  throw new Error(`HR Decision Loop server did not become ready. Output:\n${serverOutput}`);
}

async function stopServer(): Promise<void> {
  if (server === undefined || server.exitCode !== null || server.signalCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([once(server, "exit"), delay(10_000)]);
  if (server.exitCode === null && server.signalCode === null) { server.kill("SIGKILL"); await once(server, "exit"); }
}

const serverFetch: typeof fetch = (input, init) => fetch(typeof input === "string" && input.startsWith("/") ? `${base()}${input}` : input, init);

beforeAll(async () => {
  world = await createHrLoopPostgresWorld();
  port = await availablePort();
  // Turbopack rejects a node_modules symlink that points outside the project root (worktrees share one install); webpack does not.
  server = spawn(process.execPath, [resolve(process.cwd(), "node_modules/next/dist/bin/next"), "dev", "--webpack", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: world.databaseUrl, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const append = (chunk: Buffer) => { serverOutput = `${serverOutput}${chunk.toString("utf8")}`.slice(-16_000); };
  server.stdout?.on("data", append);
  server.stderr?.on("data", append);
  readiness = await waitForReadiness();
}, 300_000);

afterAll(async () => {
  await stopServer();
  if (world) await world.destroy();
}, 60_000);

describe("HR Decision Loop over HTTP against the production composition roots", () => {
  it("answers the exact-id read with the documented envelope and all fifteen families (fourteen G3 families plus the DCDRB binding) persisted for context A", async () => {
    expect(readiness).toEqual({ status: 404, body: { success: false, error: { code: "ERR_HR_DECISION_LOOP_API_NOT_FOUND", message: "The exact decision context was not found." } } });
    const response = await fetch(`${base()}/api/career/hr-decision-loop/contexts/${world.contextA}`);
    expect(response.status).toBe(200);
    const body = await response.json() as { success: boolean; hrDecisionLoop: Record<string, unknown> };
    expect(Object.keys(body)).toEqual(["success", "hrDecisionLoop"]);
    expect(body.hrDecisionLoop.schemaVersion).toBe("HR_DECISION_LOOP_READ_MODEL_V1");
    const presentation = decodeHrDecisionLoopPresentation(body.hrDecisionLoop);
    expect(presentation).not.toBeNull();
    expect(presentation!.careerDecisionContextRevisionId).toBe(world.contextA);
    expect(presentation!.authorizedActorId).toBe(HR_LOOP_DECIDER);
    expect(presentation!.regions.map(region => [region.name, region.state, region.count])).toEqual(HR_DECISION_LOOP_REGION_NAMES.map(name => [name, "AVAILABLE", 1]));
    expect(presentation!.regions.find(region => region.name === "outcomeValences")!.rows[0].facts).toContainEqual({ label: "valence", value: "DESIRABLE" });
    expect(presentation!.regions.find(region => region.name === "feedbackContextRevisions")!.rows[0].facts).toContainEqual({ label: "parentRevisionId", value: world.contextA });
    const viaClient = await fetchHrDecisionLoop(world.contextA, serverFetch);
    expect(viaClient.state).toBe("AVAILABLE");
  }, 60_000);

  it("admits one human decision for context B through the sealed gate, rereads it exactly, and refuses what the gate refuses", async () => {
    const before = await fetchHrDecisionLoop(world.contextB, serverFetch);
    expect(before.state === "AVAILABLE" && before.presentation.regions.every(region => region.state === "EMPTY")).toBe(true);
    const declaredAt = "2026-10-09T19:30:00.000Z";
    const draft = { declarantActorId: HR_LOOP_DECIDER, declarationClass: "DEFER_DECISION", declaredAt, declarationEvidenceRefs: ["evidence://frontend/http-e2e"] };
    const declared = await declareHumanDecision(world.contextB, draft, serverFetch);
    expect(declared.state).toBe("DECLARED");
    const recordId = declared.state === "DECLARED" ? declared.record.humanDecisionRecordId : "";
    expect(recordId).toMatch(/^DCR_[0-9A-F]{32}$/);
    const reread = await fetch(`${base()}/api/career/hr-decision-loop/decisions/${recordId}`);
    expect(reread.status).toBe(200);
    const rereadBody = await reread.json() as { success: boolean; humanDecisionRecord: unknown };
    expect(Object.keys(rereadBody)).toEqual(["success", "humanDecisionRecord"]);
    expect(decodeHumanDecisionRecordPresentation(rereadBody.humanDecisionRecord)).toEqual({ humanDecisionRecordId: recordId, careerDecisionContextRevisionId: world.contextB, declarationClass: "DEFER_DECISION", declarantActorId: HR_LOOP_DECIDER, declaredAt, declarationEvidenceRefs: ["evidence://frontend/http-e2e"] });
    const after = await fetchHrDecisionLoop(world.contextB, serverFetch);
    expect(after.state === "AVAILABLE" && after.presentation.regions.find(region => region.name === "decisions")!.artifactIds).toEqual([recordId]);

    await delay(5);
    const again = await declareHumanDecision(world.contextB, draft, serverFetch);
    expect(again).toEqual({ state: "REJECTED", code: "ERR_HR_DECISION_LOOP_API_CONFLICT", reason: null });

    const post = (body: unknown, headers: Record<string, string> = PRINCIPAL_HEADERS) => fetch(`${base()}/api/career/hr-decision-loop/decisions`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: typeof body === "string" ? body : JSON.stringify(body) });
    const payload = { careerDecisionContextRevisionId: world.contextB, ...draft };
    expect((await post("{")).status).toBe(400);
    expect((await post(payload, {})).status).toBe(401);
    expect((await post(payload, { ...PRINCIPAL_HEADERS, "x-condyn-principal-subject": "SOMEONE_ELSE" })).status).toBe(403);
    const intruder = await post({ ...payload, declarantActorId: "INTRUDER" }, { ...PRINCIPAL_HEADERS, "x-condyn-principal-subject": "INTRUDER" });
    expect(intruder.status).toBe(422);
    expect((await intruder.json()).error).toEqual({ code: "ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED", message: "The human decision declaration was rejected.", reason: "ERR_HUMAN_DECISION_DECLARANT_MISMATCH" });
    const inadmissible = await post({ ...payload, declarationClass: "REQUEST_FURTHER_EVIDENCE" });
    expect(inadmissible.status).toBe(422);
    expect((await inadmissible.json()).error.reason).toBe("ERR_HUMAN_DECISION_SUBJECT_NOT_ADMISSIBLE");
    const absent = await post({ ...payload, careerDecisionContextRevisionId: "DCTXREV_" + "0".repeat(32) });
    expect(absent.status).toBe(404);
  }, 60_000);

  it("reads the reconstructed next Decision Context through the frozen G2 API and walks its lineage to the root by exact ids", async () => {
    const child = await fetch(`${base()}/api/decision-contexts/${world.g2.childRevisionId}`);
    expect(child.status).toBe(200);
    const childBody = await child.json() as { success: boolean; revision: unknown };
    expect(Object.keys(childBody)).toEqual(["success", "revision"]);
    const decoded = decodeDecisionContextRevisionPresentation(childBody.revision);
    expect(decoded!.previousRevisionId).toBe(world.g2.rootRevisionId);
    expect(decoded!.items.find(item => item.role === "OBSERVATION")!.provenanceDetail).toBe(`CAREER_OUTCOME_VALENCE_DECLARATION_V1 · ${world.chain.careerOutcomeValenceDeclarationId}`);
    expect(JSON.stringify(childBody)).not.toContain(HR_LOOP_G3_PAYLOAD_MARKER);
    const lineage = await readDecisionContextLineage(world.g2.childRevisionId, { kind: "INPUT" }, serverFetch);
    expect(lineage.state).toBe("AVAILABLE");
    if (lineage.state === "AVAILABLE") {
      expect(lineage.lineage.terminal).toBe("ROOT_REACHED");
      expect(lineage.lineage.revisions.map(revision => revision.revisionId)).toEqual([world.g2.childRevisionId, world.g2.rootRevisionId]);
      expect(lineage.lineage.revisions[1].sourceStateReferences[0].artifactId).toBe(world.snapshotId);
    }
    expect((await fetch(`${base()}/api/decision-contexts/${world.contextA}`)).status).toBe(404);
    expect(await readDecisionContextLineage("DREV_ABSENT", { kind: "INPUT" }, serverFetch)).toEqual({ state: "NOT_FOUND", revisionId: "DREV_ABSENT", entry: { kind: "INPUT" } });
  }, 60_000);

  it("server-renders the dock only for an explicit DCTXREV and keeps the SIL field otherwise untouched", async () => {
    const withLoop = await (await fetch(`${base()}/career/demo?careerDecisionContextRevisionId=${world.contextA}&decisionContextRevisionId=${world.g2.childRevisionId}`)).text();
    expect(withLoop).toContain('data-testid="hr-decision-loop-dock"');
    expect(withLoop).toContain(`data-hr-decision-loop-context="${world.contextA}"`);
    expect(withLoop).toContain('data-sil-mode="PRE_CANONICAL_DISCOVERY"');
    for (const stage of ["01", "02", "03", "04", "05", "06"]) expect(withLoop).toContain(`data-testid="focus-transition-stage-shell-${stage}"`);
    const plain = await (await fetch(`${base()}/career/demo`)).text();
    expect(plain).not.toContain("hr-decision-loop-dock");
    expect(plain).toContain('data-testid="semantic-career-intelligence-field"');
    expect(plain).toContain('data-sil-mode="PRE_CANONICAL_DISCOVERY"');
  }, 120_000);
});

describe.skipIf(playwrightModule === null)("HR Decision Loop in a real browser", () => {
  type Browser = { newPage(options: { viewport: { width: number; height: number } }): Promise<Page>; close(): Promise<void> };
  type Locator = { waitFor(options?: { timeout?: number; state?: string }): Promise<void>; count(): Promise<number>; textContent(): Promise<string | null>; getAttribute(name: string): Promise<string | null>; click(): Promise<void>; fill(value: string): Promise<void>; isDisabled(): Promise<boolean>; inputValue(): Promise<string>; first(): Locator };
  type Page = { goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<unknown>; url(): string; locator(selector: string): Locator; getByTestId(id: string): Locator; screenshot(options: { path: string; fullPage?: boolean }): Promise<unknown>; on(event: string, handler: (payload: unknown) => void): void; close(): Promise<void> };
  let browser: Browser;
  let pageErrors: string[] = [];

  async function openPage(path: string): Promise<Page> {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on("pageerror", error => pageErrors.push(String(error)));
    await page.goto(`${base()}${path}`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    // First visit: the existing guided onboarding opens over the field (preserved behavior); a human closes it first.
    await page.getByTestId("guided-onboarding-overlay").waitFor({ timeout: 120_000 });
    await page.getByTestId("onboarding-close-btn").click();
    await page.getByTestId("guided-onboarding-overlay").waitFor({ state: "detached", timeout: 30_000 });
    return page;
  }

  beforeAll(async () => {
    const playwright = await import(playwrightModule as string) as { chromium: { launch(options: { headless: boolean }): Promise<Browser> } };
    browser = await playwright.chromium.launch({ headless: true });
    mkdirSync(EVIDENCE_DIR, { recursive: true });
  }, 120_000);

  afterAll(async () => { if (browser) await browser.close(); }, 30_000);

  it("renders context A with all fifteen persisted states, the reconstructed next context lineage, and the DCDRB-bound root as an exact entry point, without touching the planetarium", async () => {
    pageErrors = [];
    const page = await openPage(`/career/demo?careerDecisionContextRevisionId=${world.contextA}&decisionContextRevisionId=${world.g2.childRevisionId}`);
    const dock = page.locator('[data-testid="hr-decision-loop-dock"][data-loop-read-state="AVAILABLE"]');
    await dock.waitFor({ timeout: 120_000 });
    expect(await page.locator('[data-testid^="hr-decision-loop-region-"][data-region-state="AVAILABLE"]').count()).toBe(15);
    expect(await page.getByTestId(`hr-decision-loop-artifact-${world.g2.decisionRevisionBindingId}`).count()).toBe(1);
    expect(await page.getByTestId("hr-decision-loop-bound-revisions").getAttribute("data-bound-count")).toBe("1");
    expect(await page.getByTestId(`hr-decision-loop-artifact-${world.chain.careerOutcomeValenceFeedbackContextRevisionId}`).count()).toBe(1);
    expect(await page.getByTestId(`hr-decision-loop-artifact-${world.chain.humanDecisionRecordId}`).count()).toBe(1);
    await page.locator('[data-testid="next-context-lineage"][data-lineage-terminal="ROOT_REACHED"]').waitFor({ timeout: 60_000 });
    expect(await page.getByTestId(`decision-context-revision-${world.g2.childRevisionId}`).count()).toBe(1);
    expect(await page.getByTestId(`decision-context-revision-${world.g2.rootRevisionId}`).count()).toBe(1);
    // Entry from the URL is an explicit assumption; the directly formed child extends the root inventory and is unbound; the root is bound through the DCDRB.
    expect(await page.getByTestId("next-context-entry").getAttribute("data-entry-kind")).toBe("URL");
    const childCard = page.getByTestId(`decision-context-revision-${world.g2.childRevisionId}`);
    expect(await childCard.getAttribute("data-revision-position")).toBe("CHILD");
    expect(await childCard.getAttribute("data-return-character")).toBe("INVENTORY_EXTENDED");
    expect(await childCard.getAttribute("data-binding-state")).toBe("UNBOUND");
    expect(await childCard.textContent()).toContain("formed outside the governed 8D return");
    const rootCard = page.getByTestId(`decision-context-revision-${world.g2.rootRevisionId}`);
    expect(await rootCard.getAttribute("data-revision-position")).toBe("ROOT");
    expect(await rootCard.getAttribute("data-binding-state")).toBe("BOUND");
    expect(await rootCard.textContent()).toContain(world.g2.decisionRevisionBindingId);
    expect(await page.getByTestId("hr-decision-loop-bound-revisions").getAttribute("data-binding-region-state")).toBe("AVAILABLE");
    expect(await page.getByTestId("hr-decision-loop-non-claims").textContent()).toContain("PERSISTED != TRUE");
    for (const stage of ["01", "02", "03", "04", "05", "06"]) expect(await page.getByTestId(`focus-transition-stage-shell-${stage}`).count()).toBe(1);
    expect(await page.getByTestId("semantic-zoom-telemetry").count()).toBe(1);
    expect(await page.getByTestId("decision-graph-inspector-idle").count()).toBe(1);
    expect(await page.getByTestId("semantic-career-intelligence-field").getAttribute("data-sil-mode")).toBe("PRE_CANONICAL_DISCOVERY");
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "01-context-a-persisted-chain-and-next-context.png") });
    // The bound DREV is an exact entry point only: clicking it reads that revision through the frozen G2 GET.
    await page.getByTestId(`bound-decision-context-revision-${world.g2.rootRevisionId}`).click();
    await page.locator(`[data-testid="next-context-lineage"][data-lineage-terminal="ROOT_REACHED"] [data-testid="decision-context-revision-${world.g2.rootRevisionId}"]`).waitFor({ timeout: 60_000 });
    expect(await page.getByTestId(`decision-context-revision-${world.g2.childRevisionId}`).count()).toBe(0);
    expect(await page.getByTestId("next-context-revision-input").inputValue()).toBe(world.g2.rootRevisionId);
    expect(await page.getByTestId("next-context-entry").getAttribute("data-entry-kind")).toBe("BINDING");
    expect(await page.getByTestId("next-context-entry").textContent()).toContain(world.g2.decisionRevisionBindingId);
    expect(new URL(page.url()).searchParams.get("decisionContextRevisionId")).toBe(world.g2.rootRevisionId);
    expect(new URL(page.url()).searchParams.get("careerDecisionContextRevisionId")).toBe(world.contextA);
    expect(await page.getByTestId("hr-decision-loop-next-context").textContent()).toContain("not a governed 8D return");
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "05-context-a-bound-root-revision-read-by-exact-id.png") });
    await page.getByTestId("hr-decision-loop-dock-collapse").click();
    await page.getByTestId("hr-decision-loop-dock-toggle").waitFor({ timeout: 10_000 });
    await page.getByTestId("hr-decision-loop-dock-toggle").click();
    await page.locator('[data-testid="hr-decision-loop-dock"]').waitFor({ timeout: 10_000 });
    expect(pageErrors).toEqual([]);
    await page.close();
  }, 240_000);

  it("lets the human declare on context B through the dock, shows the persisted DCR, and renders a sealed rejection verbatim", async () => {
    pageErrors = [];
    const page = await openPage(`/career/demo?careerDecisionContextRevisionId=${world.contextB}`);
    await page.locator('[data-testid="hr-decision-loop-dock"][data-loop-read-state="AVAILABLE"]').waitFor({ timeout: 120_000 });
    expect(await page.getByTestId("hr-decision-declare-btn").isDisabled()).toBe(true);
    expect(await page.getByTestId("hr-decision-loop-bound-revisions").getAttribute("data-bound-count")).toBe("0");
    expect(await page.getByTestId("hr-decision-loop-bound-revisions").getAttribute("data-binding-region-state")).toBe("EMPTY");
    expect(await page.getByTestId("hr-decision-loop-bound-revisions-none").count()).toBe(1);
    // An explicit id that no persisted revision carries is absence, not failure, and the entry stays an assumption.
    await page.getByTestId("next-context-revision-input").fill("DREV_000000000000000000000000");
    await page.getByTestId("next-context-load-btn").click();
    await page.getByTestId("next-context-not-found").waitFor({ timeout: 60_000 });
    expect(await page.getByTestId("next-context-entry").getAttribute("data-entry-kind")).toBe("INPUT");
    await page.getByTestId("hr-decision-declarant-input").fill("INTRUDER");
    await page.getByTestId("hr-decision-class-REJECT_RECOMMENDATION").click();
    await page.getByTestId("hr-decision-evidence-input").fill("evidence://frontend/browser-e2e");
    await page.getByTestId("hr-decision-declare-btn").click();
    await page.getByTestId("hr-decision-rejected").waitFor({ timeout: 60_000 });
    expect(await page.getByTestId("hr-decision-rejected").textContent()).toContain("ERR_HUMAN_DECISION_DECLARANT_MISMATCH");
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "02-context-b-declaration-rejected-by-dar-gate.png") });

    await page.getByTestId("hr-decision-declarant-input").fill(HR_LOOP_DECIDER);
    await page.getByTestId("hr-decision-declare-btn").click();
    await page.getByTestId("hr-decision-declared").waitFor({ timeout: 60_000 });
    const declaredText = await page.getByTestId("hr-decision-declared").textContent();
    const recordId = /DCR_[0-9A-F]{32}/.exec(declaredText ?? "")?.[0] ?? "";
    expect(recordId).toMatch(/^DCR_/);
    await page.locator('[data-testid="hr-decision-loop-region-decisions"][data-region-state="AVAILABLE"]').waitFor({ timeout: 60_000 });
    expect(await page.getByTestId(`hr-decision-loop-artifact-${recordId}`).count()).toBe(1);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "03-context-b-human-decision-persisted.png") });

    // Inverse from the rendered id: the exact record the browser shows is the exact record the server rereads.
    const reread = await fetch(`${base()}/api/career/hr-decision-loop/decisions/${recordId}`);
    expect(reread.status).toBe(200);
    const record = decodeHumanDecisionRecordPresentation(((await reread.json()) as { humanDecisionRecord: unknown }).humanDecisionRecord);
    expect(record).toMatchObject({ humanDecisionRecordId: recordId, careerDecisionContextRevisionId: world.contextB, declarationClass: "REJECT_RECOMMENDATION", declarantActorId: HR_LOOP_DECIDER, declarationEvidenceRefs: ["evidence://frontend/browser-e2e"] });
    expect(pageErrors).toEqual([]);
    await page.close();
  }, 240_000);

  it("leaves the SIL field without any dock when no exact DCTXREV is selected", async () => {
    pageErrors = [];
    const page = await openPage("/career/demo");
    await page.getByTestId("semantic-career-intelligence-field").waitFor({ timeout: 120_000 });
    expect(await page.locator('[data-testid^="hr-decision-loop"]').count()).toBe(0);
    for (const stage of ["01", "02", "03", "04", "05", "06"]) expect(await page.getByTestId(`focus-transition-stage-shell-${stage}`).count()).toBe(1);
    expect(await page.getByTestId("semantic-guide-drawer-toggle").count()).toBe(1);
    await page.screenshot({ path: resolve(EVIDENCE_DIR, "04-field-without-decision-loop-unchanged.png") });
    expect(pageErrors).toEqual([]);
    await page.close();
  }, 240_000);
});
