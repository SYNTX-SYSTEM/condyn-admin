import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { db, initDbSchema } from "../../../lib/career/db/client";
import { careerAnalyses } from "../../../lib/career/db/schema";
import {
  PostgresCandidateSourceBundleRepository, PostgresCapabilityCoreRepository, PostgresCapabilityProposalProjectionReferenceRepository,
  createCapabilityProposalProjectionReader, createSourceDocument, runCapabilityDiscovery
} from "../../../lib/career/capability-core";
import { renderInvestigationScope } from "../../../lib/career/job-scope";
import { JobRepository } from "../../../lib/career/orchestration/job-repository";
import { createJob } from "../../../lib/career/orchestration/job";
import { RESULT_INSPECTOR_HEADER, createGeminiResultInspector, runWithExchangeAttempt } from "../../../lib/career/result-inspector";
import { PostgresProviderExchangeStore, ensureProviderExchangeArchive, providerExchangeArchiveFromEnvironment } from "../../../lib/career/result-inspector/postgres-exchange-store";
import { GET as getAnalysisInspection } from "../../../app/api/career/analyses/[analysisId]/gemini-result/route";
import { GET as getJobExchanges } from "../../../app/api/career/jobs/[jobId]/gemini-exchanges/route";
import { resolveTestJobScope, TEST_JOB_SCOPE_B } from "../../support/job-scope";
import { SOURCE, fakeGeminiClient, geminiProvider, geminiText, produceAnalysis, type InspectorWorld } from "./fixture";

/** Bounded Gemini exchange archive on PostgreSQL (owner GO 2026-10-15 "EXCHANGE ARCHIVE"), without Gemini. */
const TOKEN = "inspector-test-token-0123456789abcdef";
const DAY_MS = 24 * 60 * 60 * 1000;
const headers = (token?: string): Record<string, string> => token === undefined ? {} : { [RESULT_INSPECTOR_HEADER]: token };
const analysisRoute = (analysisId: string, token?: string) =>
  getAnalysisInspection(new Request(`http://local/api/career/analyses/${analysisId}/gemini-result`, { headers: headers(token) }), { params: Promise.resolve({ analysisId }) });
const jobRoute = (jobId: string, token?: string) =>
  getJobExchanges(new Request(`http://local/api/career/jobs/${jobId}/gemini-exchanges`, { headers: headers(token) }), { params: Promise.resolve({ jobId }) });
/** Own source per analysis: this suite shares its database with others and must never reuse their runs. */
const source = (label: string) => createSourceDocument({ docId: "CV", title: "cv.synthetic.pdf", rawContent: `${SOURCE} (${label})` });
const rowCount = async (where: ReturnType<typeof sql>) => Number(((await db.execute(sql`SELECT count(*)::int AS n FROM career_gemini_provider_exchanges WHERE ${where}`)) as unknown as Array<{ n: number }>)[0].n);
const switchOn = () => Object.assign(process.env, { CONDYN_RESULT_INSPECTOR: "1", CONDYN_RESULT_INSPECTOR_TOKEN: TOKEN, CONDYN_GEMINI_EXCHANGE_ARCHIVE: "1" });

describe("Gemini exchange archive (PostgreSQL, no Gemini)", () => {
  const jobs = new JobRepository(db);
  const created: string[] = [];
  const clock = { now: Date.now() };
  const exchanges = new PostgresProviderExchangeStore({ retentionMs: 7 * DAY_MS, now: () => new Date(clock.now) });
  const world: InspectorWorld = {
    capabilityRepository: new PostgresCapabilityCoreRepository(db),
    references: new PostgresCapabilityProposalProjectionReferenceRepository(db),
    sourceBundles: new PostgresCandidateSourceBundleRepository(db),
    saveJob: async job => { await jobs.enqueueJob(job); created.push(job.jobId); },
    saveAnalysis: async (analysisId, createdAt) => { await db.insert(careerAnalyses).values({ analysisId, createdAt, validationState: "VERIFIED", payload: {} }); },
    exchanges
  };
  const inspector = createGeminiResultInspector({
    references: world.references, capabilityRepository: world.capabilityRepository, sourceBundles: world.sourceBundles, jobs,
    projection: createCapabilityProposalProjectionReader({ references: world.references, capabilityRepository: world.capabilityRepository }),
    exchanges
  });

  beforeAll(async () => {
    await initDbSchema();
    expect(await ensureProviderExchangeArchive()).toBe("REGISTERED");
  });
  // The fixture jobs are PENDING rows of the shared test queue: remove exactly them so no later suite claims one.
  afterAll(async () => {
    for (const jobId of created) {
      await db.execute(sql`DELETE FROM career_analysis_jobs WHERE job_id = ${jobId}`);
      await db.execute(sql`DELETE FROM career_analyses WHERE analysis_id = ${jobId.replace("JOB_", "ANL_")}`);
    }
  });
  afterEach(() => { for (const key of ["CONDYN_RESULT_INSPECTOR", "CONDYN_RESULT_INSPECTOR_TOKEN", "CONDYN_GEMINI_EXCHANGE_ARCHIVE"]) delete process.env[key]; });

  it("creates no table outside a verified disposable database and stays off without the flag", async () => {
    const protectedUrl = ["postgres", "//archive-test:none@127.0.0.1:1/condyn"].join(":");
    expect(await ensureProviderExchangeArchive(protectedUrl)).toBe("NO_DDL_ON_NON_DISPOSABLE_DATABASE");
    expect(await providerExchangeArchiveFromEnvironment({ CONDYN_GEMINI_EXCHANGE_ARCHIVE: "1", DATABASE_URL: protectedUrl })).toBeNull();
    expect(await providerExchangeArchiveFromEnvironment({ DATABASE_URL: process.env.DATABASE_URL })).toBeNull();
  });

  it("keeps the received text byte for byte in its own table, never in the run, and serves it only through the closed routes", async () => {
    // Unicode, CRLF, tabs and a trailing newline: nothing may be normalized.
    const text = geminiText(`pg-ü-✓-${Date.now()}`).replace("\n", "\r\n\t");
    const client = fakeGeminiClient([text]);
    const produced = await produceAnalysis(world, geminiProvider(client), resolveTestJobScope(), "pg", source(`pg-${Date.now()}`));
    const [stored] = await exchanges.completedForRun(produced.run.runId);
    expect(stored.response.text).toBe(text);
    const runRow = await db.execute(sql`SELECT payload::text AS payload FROM career_capability_runs WHERE run_id = ${produced.run.runId}`) as unknown as Array<{ payload: string }>;
    expect(runRow[0].payload).not.toContain("resp-1");
    // Closed by default: flag and archive alone do not open the routes.
    process.env.CONDYN_GEMINI_EXCHANGE_ARCHIVE = "1";
    for (const response of [await analysisRoute(produced.analysisId, TOKEN), await jobRoute(produced.job.jobId, TOKEN)]) expect(response.status).toBe(404);
    switchOn();
    for (const response of [await analysisRoute(produced.analysisId), await analysisRoute(produced.analysisId, `${TOKEN}x`), await jobRoute(produced.job.jobId), await jobRoute(produced.job.jobId, "wrong")]) expect(response.status).toBe(404);
    const response = await analysisRoute(produced.analysisId, TOKEN);
    expect([response.status, response.headers.get("cache-control")]).toEqual([200, "no-store"]);
    const { inspection } = await response.json();
    expect(inspection.originalGeminiResponse).toMatchObject({ state: "RETAINED", text, textMatchesSha256: true, parserResultMatchesText: true, responseId: "resp-1", exchangeId: stored.exchangeId });
    expect(inspection.investigationInput.investigationScope).toMatchObject({ state: "RETAINED", textMatchesScopeHash: true });
    expect(client.requests).toHaveLength(1);
  });

  it("stores failed responses per job attempt; exactly one COMPLETED exchange per run; the job route lists both", async () => {
    const job = { jobId: `JOB_${Date.now()}_archive` };
    const sourceDocument = source(`fail-${Date.now()}`);
    const scope = resolveTestJobScope(TEST_JOB_SCOPE_B);
    const client = fakeGeminiClient([{ text: "{\"truncated\": ", finishReason: "MAX_TOKENS" }, geminiText("after-retry")]);
    const discover = (leaseVersion: number) => runWithExchangeAttempt({ jobId: job.jobId, leaseVersion }, () => runCapabilityDiscovery([sourceDocument], { kernelVersion: "discovery-v1", schemaVersion: "discovery-schema-v1" }, { kernelResolver: { resolve: async () => ({ kernelVersion: "discovery-v1", templateId: "T", versionId: "V", checksum: "C", plainTextContent: "FAKE_DISCOVERY_KERNEL" }) }, provider: geminiProvider(client), repository: world.capabilityRepository, investigationScope: renderInvestigationScope(scope), providerExchangeArchive: exchanges }));
    await expect(discover(1)).rejects.toThrow("ERR_CAPABILITY_DISCOVERY_STRUCTURED_OUTPUT_INVALID");
    const result = await discover(2);
    if (result.kind !== "DISCOVERY_COMPLETED") throw new Error(result.kind);
    expect(await rowCount(sql`run_id = ${result.run.runId}`)).toBe(2);
    expect((await exchanges.completedForRun(result.run.runId)).map(item => item.attempt)).toEqual([{ jobId: job.jobId, leaseVersion: 2 }]);
    // The partial unique index refuses a second COMPLETED row for the same run; the first one stays.
    const [completed] = await exchanges.completedForRun(result.run.runId);
    await exchanges.retain({ ...completed, response: { ...completed.response, text: "forged" } });
    expect((await exchanges.completedForRun(result.run.runId)).map(item => item.response.text)).toEqual([geminiText("after-retry")]);
    // The job route needs a stored job.
    await jobs.enqueueJob({ ...createJob("CAREER_ANALYSIS", { sourceType: "BATCH", sourceData: { jobScope: scope.selection } }), jobId: job.jobId });
    created.push(job.jobId);
    switchOn();
    const body = await (await jobRoute(job.jobId, TOKEN)).json();
    expect(body.archive).toBe("AVAILABLE");
    expect(body.inspection.exchanges.map((item: { outcome: string; errorCode: string | null; response: { text: string; finishReason: string } }) => [item.outcome, item.errorCode, item.response.text, item.response.finishReason]).sort()).toEqual([
      ["COMPLETED", null, geminiText("after-retry"), "STOP"],
      ["FAILED", "ERR_CAPABILITY_DISCOVERY_STRUCTURED_OUTPUT_INVALID", "{\"truncated\": ", "MAX_TOKENS"]
    ]);
    expect((await jobRoute("JOB_unknown", TOKEN)).status).toBe(404);
  });

  it("expires after the window and deletes the rows; deletion by id is immediate; the processed phases stay", async () => {
    const produced = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText(`exp-${Date.now()}`)])), resolveTestJobScope(TEST_JOB_SCOPE_B), "exp", source(`exp-${Date.now()}`));
    // The window is stored with the row: retained_at + 7 days (configurable up to 30).
    const window = await db.execute(sql`SELECT extract(epoch FROM expires_at - retained_at)::int AS seconds FROM career_gemini_provider_exchanges WHERE run_id = ${produced.run.runId}`) as unknown as Array<{ seconds: number }>;
    expect(window.map(row => row.seconds)).toEqual([7 * 24 * 60 * 60]);
    const saved = clock.now;
    clock.now += 7 * DAY_MS - 1000;
    expect((await inspector.read(produced.analysisId)).originalGeminiResponse.state).toBe("RETAINED");
    clock.now = saved + 7 * DAY_MS;
    const expired = await inspector.read(produced.analysisId);
    expect([expired.originalGeminiResponse, expired.investigationInput.investigationScope.state]).toEqual([{ state: "NOT_RETAINED" }, "NOT_RETAINED"]);
    expect(expired.parserResult.kernelOutput).not.toBeNull();
    expect(await rowCount(sql`run_id = ${produced.run.runId}`)).toBe(0);
    clock.now = saved;
    const other = await produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText(`del-${Date.now()}`)])), null, "del", source(`del-${Date.now()}`));
    const [retained] = await exchanges.completedForRun(other.run.runId);
    expect(await exchanges.delete(retained.exchangeId)).toBe(true);
    expect(await rowCount(sql`exchange_id = ${retained.exchangeId}`)).toBe(0);
    expect((await inspector.read(other.analysisId)).originalGeminiResponse).toEqual({ state: "NOT_RETAINED" });
  });
});
