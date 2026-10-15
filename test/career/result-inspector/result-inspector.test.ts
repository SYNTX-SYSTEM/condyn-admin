import { describe, expect, it } from "vitest";
import {
  InMemoryCandidateSourceBundleRepository, InMemoryCapabilityCoreRepository, InMemoryCapabilityProposalProjectionReferenceRepository,
  createCapabilityProposalProjectionReader, runCapabilityDiscovery, sha256Utf8, stableJsonStringify, type CapabilityDiscoveryProvider
} from "../../../lib/career/capability-core";
import { getGeminiCapabilityKernelResponseJsonSchema } from "../../../lib/career/capability-core/discovery/gemini-schema-projector";
import { renderInvestigationScope } from "../../../lib/career/job-scope";
import type { JobRecord } from "../../../lib/career/orchestration/job";
import {
  DEFAULT_EXCHANGE_RETENTION_DAYS, InMemoryProviderExchangeStore, RESULT_INSPECTOR_HEADER, createGeminiResultInspector, exchangeRetentionMs,
  resultInspectorAccess, type GeminiResultInspection
} from "../../../lib/career/result-inspector";
import { TEST_JOB_SCOPE_B, resolveTestJobScope } from "../../support/job-scope";
import { PDF_MARKER, cv, fakeGeminiClient, geminiProvider, geminiText, produceAnalysis, type InspectorWorld } from "./fixture";

/** SFE 2026-10-15 Result Inspector, without network: original Gemini response vs. every later phase. */
const DAY_MS = 24 * 60 * 60 * 1000;
/** Run records without their wall-clock timestamps (identity, payload and hashes stay). */
const timeless = <T extends { createdAt: string; completedAt?: string }>(run: T) => ({ ...run, createdAt: "", completedAt: "" });
function world(options: { archive?: boolean } = {}) {
  const jobs = new Map<string, JobRecord>();
  const clock = { now: Date.parse("2026-10-15T10:00:00.000Z") };
  const exchanges = options.archive === false ? undefined : new InMemoryProviderExchangeStore({ retentionMs: 7 * DAY_MS, now: () => new Date(clock.now) });
  const state: InspectorWorld = {
    capabilityRepository: new InMemoryCapabilityCoreRepository(),
    references: new InMemoryCapabilityProposalProjectionReferenceRepository(),
    sourceBundles: new InMemoryCandidateSourceBundleRepository(),
    saveJob: async job => { jobs.set(job.jobId, structuredClone(job)); },
    ...(exchanges ? { exchanges } : {})
  };
  const inspector = createGeminiResultInspector({
    references: state.references, capabilityRepository: state.capabilityRepository, sourceBundles: state.sourceBundles,
    jobs: { getJob: async jobId => jobs.get(jobId) ?? null },
    projection: createCapabilityProposalProjectionReader({ references: state.references, capabilityRepository: state.capabilityRepository }),
    ...(exchanges ? { exchanges } : {})
  });
  return { state, inspector, clock, exchanges };
}
const scopeA = resolveTestJobScope();
const scopeB = resolveTestJobScope(TEST_JOB_SCOPE_B);

describe("Gemini Result Inspector", () => {
  it("the Gemini provider keeps the received text unchanged next to the parsed output; request and output schema unchanged", async () => {
    const text = geminiText("A");
    const client = fakeGeminiClient([text]);
    const result = await geminiProvider(client).execute({ systemPrompt: "S", userPrompt: "U" });
    expect(result.providerResponse).toEqual({ text, textSha256: sha256Utf8(text), finishReason: "STOP", modelVersion: "gemini-fake-001", responseId: "resp-1", usageMetadata: { promptTokenCount: 11, candidatesTokenCount: 22 }, receivedAt: "2026-10-15T10:00:00.000Z" });
    expect(result.kernelOutput).toEqual(JSON.parse(text));
    expect(text).not.toBe(JSON.stringify(result.kernelOutput));
    expect(client.requests).toEqual([{ model: "gemini-fake", contents: "S\n\nU", config: { responseMimeType: "application/json", temperature: 0.1, maxOutputTokens: 32768, responseJsonSchema: getGeminiCapabilityKernelResponseJsonSchema() } }]);
  });

  it("separates scope, original response, parser result, verification, Convergence and projection of one analysis", async () => {
    const { state, inspector } = world();
    const text = geminiText("A");
    const client = fakeGeminiClient([text]);
    const produced = await produceAnalysis(state, geminiProvider(client), scopeA, "A");
    const inspection: GeminiResultInspection = await inspector.read(produced.analysisId);

    expect(inspection.investigationInput.jobScopeSelection).toEqual(scopeA.selection);
    expect(inspection.investigationInput.investigationScope).toEqual({ state: "RETAINED", scopeHash: sha256Utf8(renderInvestigationScope(scopeA).text), text: renderInvestigationScope(scopeA).text, textMatchesScopeHash: true, expiresAt: "2026-10-22T10:00:00.000Z" });
    expect(inspection.investigationInput.discoveryRunId).toBe(produced.run.runId);
    expect(inspection.investigationInput.kernel).toEqual({ kernelVersion: "discovery-v1", templateId: "T", versionId: "V", checksum: "C" });
    expect(inspection.investigationInput.sourceDocuments?.map(item => item.docId)).toEqual(["CV"]);

    // Original response: the received text itself, bound to this run; not the stored parse result.
    expect(inspection.originalGeminiResponse).toMatchObject({ state: "RETAINED", text, responseId: "resp-1", textMatchesSha256: true, parserResultMatchesText: true, retainedAt: "2026-10-15T10:00:00.000Z", expiresAt: "2026-10-22T10:00:00.000Z", attempt: null });
    expect(inspection.originalGeminiResponse).toMatchObject({ request: { sourceBundleHash: produced.run.sourceBundleHash, promptChecksum: "C", provider: "gemini", model: "gemini-fake", schemaVersion: "discovery-schema-v1" } });
    // Original and processed result stay apart: the immutable run holds neither the received text nor the scope text.
    expect(Object.keys(produced.run.payload as object).sort()).toEqual(["candidates", "coverageValidation", "kernelOutput"]);
    expect(produced.run.investigationScope).toEqual({ scopeHash: sha256Utf8(renderInvestigationScope(scopeA).text) });
    expect(JSON.stringify(await state.capabilityRepository.getRunById(produced.run.runId))).not.toContain("resp-1");
    expect(text).not.toBe(stableJsonStringify(inspection.parserResult.kernelOutput));
    expect(inspection.parserResult.kernelOutput).toEqual(JSON.parse(text));

    // Verification is its own phase: the invented quote is rejected, the CV quote verified.
    const statuses = (inspection.evidenceVerification.candidates as Array<{ evidenceClaims: Array<{ verification: { status: string } }> }>).map(candidate => candidate.evidenceClaims[0].verification.status);
    expect(statuses).toEqual(["VERIFIED", "REJECTED_QUOTE_NOT_FOUND"]);
    expect(inspection.convergence.convergenceRunId).toBe(produced.convergenceRun.convergenceRunId);
    expect(inspection.projection?.capabilities.length).toBeGreaterThan(0);

    // The candidate documents of the job never leave through the inspector.
    expect(JSON.stringify(inspection)).not.toContain(PDF_MARKER);
    // Reading never calls Gemini again.
    await inspector.read(produced.analysisId);
    expect(client.requests).toHaveLength(1);
  });

  it("never mixes runs: two job scopes give two runs, each analysis shows its own response", async () => {
    const { state, inspector } = world();
    const [textA, textB] = [geminiText("A"), geminiText("B")];
    const provider = geminiProvider(fakeGeminiClient([textA, textB]));
    const a = await produceAnalysis(state, provider, scopeA, "A");
    const b = await produceAnalysis(state, provider, scopeB, "B");
    expect(a.run.runId).not.toBe(b.run.runId);
    const [inspectionA, inspectionB] = [await inspector.read(a.analysisId), await inspector.read(b.analysisId)];
    expect(inspectionA.originalGeminiResponse).toMatchObject({ text: textA, responseId: "resp-1" });
    expect(inspectionB.originalGeminiResponse).toMatchObject({ text: textB, responseId: "resp-2" });
    expect(inspectionA.investigationInput.jobScopeSelection).toEqual(scopeA.selection);
    expect(inspectionB.investigationInput.jobScopeSelection).toEqual(scopeB.selection);
  });

  it("says NOT_RETAINED for a run without a kept response and never offers the parse result instead", async () => {
    const { state, inspector } = world();
    const parsedOnly: CapabilityDiscoveryProvider = { providerName: "fake", model: "m", execute: async () => ({ kernelOutput: JSON.parse(geminiText("A")) }) };
    const produced = await produceAnalysis(state, parsedOnly, scopeA, "A");
    const inspection = await inspector.read(produced.analysisId);
    expect(inspection.originalGeminiResponse).toEqual({ state: "NOT_RETAINED" });
    expect(inspection.investigationInput.investigationScope).toEqual({ state: "NOT_RETAINED", scopeHash: produced.run.investigationScope!.scopeHash });
    expect(inspection.parserResult.kernelOutput).toEqual(JSON.parse(geminiText("A")));
  });

  it("without an exchange archive (current production wiring) nothing is retained and the analysis is unchanged", async () => {
    const withArchive = world();
    const without = world({ archive: false });
    const a = await produceAnalysis(withArchive.state, geminiProvider(fakeGeminiClient([geminiText("A")])), scopeA, "A");
    const b = await produceAnalysis(without.state, geminiProvider(fakeGeminiClient([geminiText("A")])), scopeA, "A");
    expect(timeless(b.run)).toEqual(timeless(a.run));
    expect(timeless(b.convergenceRun)).toEqual(timeless(a.convergenceRun));
    expect((await without.inspector.read(b.analysisId)).originalGeminiResponse).toEqual({ state: "NOT_RETAINED" });
  });

  it("retention: nothing is returned after expiry, expired exchanges are deleted, an erasure deletes at once", async () => {
    const { state, inspector, clock, exchanges } = world();
    const a = await produceAnalysis(state, geminiProvider(fakeGeminiClient([geminiText("A")])), scopeA, "A");
    clock.now += 7 * DAY_MS - 1;
    expect((await inspector.read(a.analysisId)).originalGeminiResponse.state).toBe("RETAINED");
    clock.now += 1;
    const expired = await inspector.read(a.analysisId);
    expect([expired.originalGeminiResponse, expired.investigationInput.investigationScope.state]).toEqual([{ state: "NOT_RETAINED" }, "NOT_RETAINED"]);
    expect(await exchanges!.completedForRun(a.run.runId)).toEqual([]);
    // The processed phases are untouched by expiry.
    expect(expired.parserResult.kernelOutput).toEqual(JSON.parse(geminiText("A")));
    const b = await produceAnalysis(state, geminiProvider(fakeGeminiClient([geminiText("B")])), scopeB, "B");
    const [retainedB] = await exchanges!.completedForRun(b.run.runId);
    expect(await exchanges!.delete(retainedB.exchangeId)).toBe(true);
    expect(await exchanges!.delete(retainedB.exchangeId)).toBe(false);
    expect((await inspector.read(b.analysisId)).originalGeminiResponse).toEqual({ state: "NOT_RETAINED" });
    expect(exchangeRetentionMs({})).toBe(DEFAULT_EXCHANGE_RETENTION_DAYS * DAY_MS);
    expect(exchangeRetentionMs({ CONDYN_GEMINI_EXCHANGE_RETENTION_DAYS: "30" })).toBe(30 * DAY_MS);
    for (const invalid of ["31", "0", "-1", "1.5", "abc", "", "3650"]) expect(exchangeRetentionMs({ CONDYN_GEMINI_EXCHANGE_RETENTION_DAYS: invalid })).toBe(7 * DAY_MS);
  });

  it("a failing archive never fails or changes the analysis", async () => {
    const reference = world();
    const failing = world({ archive: false });
    failing.state.exchanges = { retain: async () => { throw new Error("archive down"); } } as never;
    const a = await produceAnalysis(reference.state, geminiProvider(fakeGeminiClient([geminiText("A")])), scopeA, "A");
    const b = await produceAnalysis(failing.state, geminiProvider(fakeGeminiClient([geminiText("A")])), scopeA, "A");
    expect(timeless(b.run)).toEqual(timeless(a.run));
    expect((await failing.inspector.read(b.analysisId)).originalGeminiResponse).toEqual({ state: "NOT_RETAINED" });
  });

  it("a reused run shows the exchange of that run; an exchange bound to another scope is refused", async () => {
    const { state, inspector, exchanges } = world();
    const client = fakeGeminiClient([geminiText("A")]);
    const first = await produceAnalysis(state, geminiProvider(client), scopeA, "A");
    // Same sources, same scope: Discovery is reused, Gemini is not called, no second exchange is written.
    const discovery = await runCapabilityDiscovery([cv], { kernelVersion: "discovery-v1", schemaVersion: "discovery-schema-v1" }, { kernelResolver: { resolve: async () => ({ kernelVersion: "discovery-v1", templateId: "T", versionId: "V", checksum: "C", plainTextContent: "FAKE_DISCOVERY_KERNEL" }) }, provider: geminiProvider(client), repository: state.capabilityRepository, investigationScope: renderInvestigationScope(scopeA), providerExchangeArchive: exchanges });
    expect([discovery.kind, client.requests.length]).toEqual(["DISCOVERY_RUN_REUSED", 1]);
    expect((await inspector.read(first.analysisId)).originalGeminiResponse).toMatchObject({ state: "RETAINED", responseId: "resp-1" });
    // An exchange under this RUN_ id with another scope hash or another request identity is a lineage error, never shown.
    const [original] = await exchanges!.completedForRun(first.run.runId);
    for (const forged of [{ ...original, investigationScope: { scopeHash: sha256Utf8("other"), text: "other" } }, { ...original, request: { ...original.request, model: "other-model" } }, { ...original, request: { ...original.request, promptChecksum: "other" } }]) {
      for (const item of await exchanges!.completedForRun(first.run.runId)) await exchanges!.delete(item.exchangeId);
      await exchanges!.retain(forged);
      await expect(inspector.read(first.analysisId)).rejects.toMatchObject({ code: "ERR_RESULT_INSPECTION_LINEAGE_INVALID", status: 409 });
    }
  });

  it("follows only the stored lineage: unknown analysis 404, broken reference 409", async () => {
    const { state, inspector } = world();
    const provider = geminiProvider(fakeGeminiClient([geminiText("A"), geminiText("B")]));
    const a = await produceAnalysis(state, provider, scopeA, "A");
    const b = await produceAnalysis(state, provider, scopeB, "B");
    await expect(inspector.read("ANL_unknown")).rejects.toMatchObject({ code: "ERR_RESULT_INSPECTION_NOT_FOUND", status: 404 });
    // A reference that pairs A's Discovery with B's Convergence is refused, never repaired.
    await state.references.save({ analysisId: "ANL_crossed", jobId: "JOB_crossed", discoveryRunId: a.run.runId, convergenceRunId: b.convergenceRun.convergenceRunId, sourceBundleHash: a.run.sourceBundleHash, createdAt: b.convergenceRun.completedAt });
    await expect(inspector.read("ANL_crossed")).rejects.toMatchObject({ code: "ERR_RESULT_INSPECTION_LINEAGE_INVALID", status: 409 });
  });

  it("read boundary: closed unless switched on with a configured token presented in the header", () => {
    const token = "t".repeat(40);
    const request = (header?: string) => new Request("http://local/x", { headers: header === undefined ? {} : { [RESULT_INSPECTOR_HEADER]: header } });
    expect(resultInspectorAccess(request(token), {})).toBe("DISABLED");
    expect(resultInspectorAccess(request(token), { CONDYN_RESULT_INSPECTOR: "1" })).toBe("DISABLED");
    expect(resultInspectorAccess(request("short"), { CONDYN_RESULT_INSPECTOR: "1", CONDYN_RESULT_INSPECTOR_TOKEN: "short" })).toBe("DISABLED");
    expect(resultInspectorAccess(request(token), { CONDYN_RESULT_INSPECTOR: "0", CONDYN_RESULT_INSPECTOR_TOKEN: token })).toBe("DISABLED");
    expect(resultInspectorAccess(request(), { CONDYN_RESULT_INSPECTOR: "1", CONDYN_RESULT_INSPECTOR_TOKEN: token })).toBe("DENIED");
    expect(resultInspectorAccess(request(`${token}x`), { CONDYN_RESULT_INSPECTOR: "1", CONDYN_RESULT_INSPECTOR_TOKEN: token })).toBe("DENIED");
    expect(resultInspectorAccess(request(token), { CONDYN_RESULT_INSPECTOR: "1", CONDYN_RESULT_INSPECTOR_TOKEN: token })).toBe("ALLOWED");
  });
});
