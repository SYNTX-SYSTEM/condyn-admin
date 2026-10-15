import { describe, expect, it } from "vitest";
import {
  CapabilityProviderResponseError, EXCHANGE_ARCHIVE_WAIT_MS, InMemoryCapabilityCoreRepository, buildCapabilityDiscoveryPrompt, computeSourceBundleHash, runCapabilityDiscovery,
  sha256Utf8, stableJsonStringify, type CapabilityCoreRepository, type CapabilityDiscoveryProvider
} from "../../../lib/career/capability-core";
import { renderInvestigationScope, type ResolvedJobScope } from "../../../lib/career/job-scope";
import { createJob, type JobRecord } from "../../../lib/career/orchestration/job";
import {
  InMemoryProviderExchangeStore, createGeminiExchangeInspector, runWithExchangeAttempt, type ProviderExchangeStore
} from "../../../lib/career/result-inspector";
import { TEST_JOB_SCOPE_B, resolveTestJobScope } from "../../support/job-scope";
import { cv, fakeGeminiClient, geminiProvider, geminiText, geminiTextWithBrokenAudit, type FakeGeminiResponse } from "./fixture";

/** Owner GO 2026-10-15 "EXCHANGE ARCHIVE": successful and failed Gemini responses, with run, scope and request identity. */
const kernel = { kernelVersion: "discovery-v1", templateId: "T", versionId: "V", checksum: "C", plainTextContent: "FAKE_DISCOVERY_KERNEL" };
const config = { kernelVersion: "discovery-v1", schemaVersion: "discovery-schema-v1" };
const scopeA = resolveTestJobScope();
const scopeB = resolveTestJobScope(TEST_JOB_SCOPE_B);
const INVALID = "ERR_CAPABILITY_DISCOVERY_STRUCTURED_OUTPUT_INVALID";

function discover(provider: CapabilityDiscoveryProvider, repository: CapabilityCoreRepository, archive: ProviderExchangeStore, scope: ResolvedJobScope = scopeA) {
  return runCapabilityDiscovery([cv], config, { kernelResolver: { resolve: async () => kernel }, provider, repository, investigationScope: renderInvestigationScope(scope), providerExchangeArchive: archive });
}
const inAttempt = <T>(jobId: string, leaseVersion: number, run: () => Promise<T>) => runWithExchangeAttempt({ jobId, leaseVersion }, run);
const expectedRequest = (scope: ResolvedJobScope) => {
  const prompt = buildCapabilityDiscoveryPrompt([cv], kernel, renderInvestigationScope(scope));
  return { requestSha256: sha256Utf8(stableJsonStringify({ systemPrompt: prompt.systemPrompt, userPrompt: prompt.userPrompt })), sourceBundleHash: computeSourceBundleHash([cv]), promptChecksum: "C", provider: "gemini", model: "gemini-fake", schemaVersion: "discovery-schema-v1" };
};
function jobsOf(...jobs: JobRecord[]) { return { getJob: async (jobId: string) => jobs.find(job => job.jobId === jobId) ?? null }; }

describe("Gemini exchange archive — failed responses", () => {
  it.each<[string, FakeGeminiResponse, string | null, string]>([
    ["text that is not JSON", { text: "{\"capabilities\": [ truncated" }, "{\"capabilities\": [ truncated", "STOP"],
    ["JSON outside the output schema", { text: "{\"unexpected\":true}\n" }, "{\"unexpected\":true}\n", "STOP"],
    ["a response cut off by MAX_TOKENS", { text: geminiText("cut").slice(0, 40), finishReason: "MAX_TOKENS" }, geminiText("cut").slice(0, 40), "MAX_TOKENS"],
    ["a response without text", { text: undefined, finishReason: "SAFETY" }, null, "SAFETY"]
  ])("keeps %s exactly as received, with its identity; the error and the absence of a run are unchanged", async (_label, response, text, finishReason) => {
    const repository = new InMemoryCapabilityCoreRepository();
    const archive = new InMemoryProviderExchangeStore();
    await expect(inAttempt("JOB_failed", 1, () => discover(geminiProvider(fakeGeminiClient([response])), repository, archive))).rejects.toThrow(INVALID);
    const [exchange, ...rest] = await archive.forJob("JOB_failed");
    expect(rest).toEqual([]);
    const scopeText = renderInvestigationScope(scopeA).text;
    expect(exchange).toMatchObject({ outcome: "FAILED", errorCode: INVALID, attempt: { jobId: "JOB_failed", leaseVersion: 1 }, request: expectedRequest(scopeA), investigationScope: { scopeHash: sha256Utf8(scopeText), text: scopeText }, response: { text, textSha256: text === null ? null : sha256Utf8(text), finishReason, responseId: "resp-1" } });
    // The RUN_ identity it was attempted under, but no run exists and no COMPLETED exchange is visible for it.
    expect(await repository.getRunById(exchange.runId)).toBeNull();
    expect(await archive.completedForRun(exchange.runId)).toEqual([]);
  });

  it("keeps a response refused after the provider (coverage audit) with the runtime's error code", async () => {
    const repository = new InMemoryCapabilityCoreRepository();
    const archive = new InMemoryProviderExchangeStore();
    const text = geminiTextWithBrokenAudit("audit");
    const error = await inAttempt("JOB_audit", 1, () => discover(geminiProvider(fakeGeminiClient([text])), repository, archive)).catch(caught => caught as Error);
    expect(error).toBeInstanceOf(Error);
    const code = (error as Error).message.split(":")[0];
    expect(code).toMatch(/^ERR_/);
    const [exchange] = await archive.forJob("JOB_audit");
    expect(exchange).toMatchObject({ outcome: "FAILED", errorCode: code, response: { text } });
    expect(await repository.getRunById(exchange.runId)).toBeNull();
  });

  it("a retry that succeeds gives the single COMPLETED exchange of the run; the failed attempt stays apart", async () => {
    const repository = new InMemoryCapabilityCoreRepository();
    const archive = new InMemoryProviderExchangeStore();
    const client = fakeGeminiClient([{ text: "not json" }, geminiText("retry")]);
    await expect(inAttempt("JOB_retry", 1, () => discover(geminiProvider(client), repository, archive))).rejects.toThrow(INVALID);
    const result = await inAttempt("JOB_retry", 2, () => discover(geminiProvider(client), repository, archive));
    if (result.kind !== "DISCOVERY_COMPLETED") throw new Error(result.kind);
    const completed = await archive.completedForRun(result.run.runId);
    expect(completed.map(item => [item.outcome, item.attempt?.leaseVersion, item.response.text])).toEqual([["COMPLETED", 2, geminiText("retry")]]);
    const all = await archive.forJob("JOB_retry");
    expect(all.map(item => [item.outcome, item.attempt?.leaseVersion, item.runId])).toEqual([["FAILED", 1, result.run.runId], ["COMPLETED", 2, result.run.runId]]);
    // A reused run calls no provider and writes no exchange.
    expect((await inAttempt("JOB_other", 1, () => discover(geminiProvider(client), repository, archive))).kind).toBe("DISCOVERY_RUN_REUSED");
    expect([client.requests.length, (await archive.forJob("JOB_other")).length]).toEqual([2, 0]);
  });

  it("a response whose run cannot be persisted is FAILED, never COMPLETED", async () => {
    const base = new InMemoryCapabilityCoreRepository();
    const conflicting = Object.assign(Object.create(Object.getPrototypeOf(base)), base, { saveRun: async (run: { runId: string }) => { throw new Error(`ERR_IMMUTABLE_RUN_CONFLICT: ${run.runId}`); } }) as CapabilityCoreRepository;
    const archive = new InMemoryProviderExchangeStore();
    await expect(inAttempt("JOB_conflict", 1, () => discover(geminiProvider(fakeGeminiClient([geminiText("conflict")])), conflicting, archive))).rejects.toThrow("ERR_IMMUTABLE_RUN_CONFLICT");
    const [exchange] = await archive.forJob("JOB_conflict");
    expect([exchange.outcome, exchange.errorCode]).toEqual(["FAILED", "ERR_IMMUTABLE_RUN_CONFLICT"]);
    expect(await archive.completedForRun(exchange.runId)).toEqual([]);
  });

  it("records nothing when no response was received; free error text never becomes an error code", async () => {
    const archive = new InMemoryProviderExchangeStore();
    const offline: CapabilityDiscoveryProvider = { providerName: "gemini", model: "gemini-fake", execute: async () => { throw new Error("ERR_CAPABILITY_DISCOVERY_PROVIDER_FAILURE"); } };
    await expect(inAttempt("JOB_offline", 1, () => discover(offline, new InMemoryCapabilityCoreRepository(), archive))).rejects.toThrow("ERR_CAPABILITY_DISCOVERY_PROVIDER_FAILURE");
    expect(await archive.forJob("JOB_offline")).toEqual([]);
    const response = { text: "x", textSha256: sha256Utf8("x"), finishReason: "STOP", modelVersion: null, responseId: null, usageMetadata: null, receivedAt: "2026-10-15T10:00:00.000Z" };
    const chatty: CapabilityDiscoveryProvider = { providerName: "gemini", model: "gemini-fake", execute: async () => { throw new CapabilityProviderResponseError("Candidate Jane Doe wrote: led the migration", response); } };
    await expect(inAttempt("JOB_chatty", 1, () => discover(chatty, new InMemoryCapabilityCoreRepository(), archive))).rejects.toThrow("Candidate Jane Doe");
    expect((await archive.forJob("JOB_chatty"))[0].errorCode).toBe("ERR_UNCLASSIFIED");
  });

  it("the job view shows only that job's exchanges; unknown job 404; no archive means an empty list", async () => {
    const repository = new InMemoryCapabilityCoreRepository();
    const archive = new InMemoryProviderExchangeStore();
    const jobA = createJob("CAREER_ANALYSIS", { sourceType: "BATCH", sourceData: { jobScope: scopeA.selection } });
    const jobB = createJob("CAREER_ANALYSIS", { sourceType: "BATCH", sourceData: { jobScope: scopeB.selection } });
    await expect(inAttempt(jobA.jobId, 1, () => discover(geminiProvider(fakeGeminiClient([{ text: "nope" }])), repository, archive, scopeA))).rejects.toThrow(INVALID);
    await inAttempt(jobB.jobId, 1, () => discover(geminiProvider(fakeGeminiClient([geminiText("B")])), repository, archive, scopeB));
    const inspector = createGeminiExchangeInspector({ jobs: jobsOf(jobA, jobB), exchanges: archive });
    const a = await inspector.read(jobA.jobId);
    const b = await inspector.read(jobB.jobId);
    expect(a.exchanges.map(item => [item.outcome, item.response.text, item.textMatchesSha256, item.scopeTextMatchesScopeHash])).toEqual([["FAILED", "nope", true, true]]);
    expect(b.exchanges.map(item => item.outcome)).toEqual(["COMPLETED"]);
    expect(a.exchanges[0].investigationScope?.scopeHash).not.toBe(b.exchanges[0].investigationScope?.scopeHash);
    await expect(inspector.read("JOB_unknown")).rejects.toMatchObject({ code: "ERR_RESULT_INSPECTION_NOT_FOUND", status: 404 });
    expect((await createGeminiExchangeInspector({ jobs: jobsOf(jobA) }).read(jobA.jobId)).exchanges).toEqual([]);
  });

  it("waits at most EXCHANGE_ARCHIVE_WAIT_MS for a slow archive; the analysis result is unchanged (PINK O-ARCHIVE-AWAIT)", async () => {
    let stored = 0;
    const slow = { retain: () => new Promise<void>(resolve => setTimeout(() => { stored++; resolve(); }, 3000)) } as unknown as ProviderExchangeStore;
    const hanging = { retain: () => new Promise<void>(() => undefined) } as unknown as ProviderExchangeStore;
    for (const archive of [slow, hanging]) {
      const started = Date.now();
      const result = await discover(geminiProvider(fakeGeminiClient([geminiText("slow")])), new InMemoryCapabilityCoreRepository(), archive);
      const elapsed = Date.now() - started;
      expect(result.kind).toBe("DISCOVERY_COMPLETED");
      expect(elapsed).toBeGreaterThanOrEqual(EXCHANGE_ARCHIVE_WAIT_MS - 50);
      expect(elapsed).toBeLessThan(EXCHANGE_ARCHIVE_WAIT_MS + 1000);
    }
    expect(stored).toBe(0);
  }, 10_000);
});
