import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  InMemoryCandidateSourceBundleRepository, InMemoryCapabilityCoreRepository, InMemoryCapabilityProposalProjectionReferenceRepository, createCapabilityProposalProjectionReader
} from "../../../lib/career/capability-core";
import {
  RESULT_INSPECTOR_TOKEN_HEADER, comparisonBelongsToSelection, decodeGeminiExchangeInspection, decodeGeminiResultInspection, readGeminiExchangeInspection, readGeminiResultInspection
} from "../../../lib/career/result-inspector/client";
import { InMemoryProviderExchangeStore, createGeminiExchangeInspector, createGeminiResultInspector, runWithExchangeAttempt } from "../../../lib/career/result-inspector";
import type { JobRecord } from "../../../lib/career/orchestration/job";
import { resolveTestJobScope, TEST_JOB_SCOPE } from "../../support/job-scope";
import { fakeGeminiClient, geminiProvider, geminiText, produceAnalysis, type InspectorWorld } from "./fixture";

/** The GEMINI OUTPUT panel client (prepared for GRÜN): strict decoding, token per call, no storage, GET only. */
async function realInspections() {
  const jobs = new Map<string, JobRecord>();
  const exchanges = new InMemoryProviderExchangeStore();
  const world: InspectorWorld = { capabilityRepository: new InMemoryCapabilityCoreRepository(), references: new InMemoryCapabilityProposalProjectionReferenceRepository(), sourceBundles: new InMemoryCandidateSourceBundleRepository(), saveJob: async job => { jobs.set(job.jobId, structuredClone(job)); }, exchanges };
  const produced = await runWithExchangeAttempt({ jobId: "JOB_client", leaseVersion: 1 }, () => produceAnalysis(world, geminiProvider(fakeGeminiClient([geminiText("client")])), resolveTestJobScope(), "client"));
  const getJob = async (jobId: string) => jobs.get(jobId) ?? (jobId === "JOB_client" ? { jobId } as JobRecord : null);
  const analysis = await createGeminiResultInspector({ references: world.references, capabilityRepository: world.capabilityRepository, sourceBundles: world.sourceBundles, jobs: { getJob }, projection: createCapabilityProposalProjectionReader({ references: world.references, capabilityRepository: world.capabilityRepository }), exchanges }).read(produced.analysisId);
  const job = await createGeminiExchangeInspector({ jobs: { getJob }, exchanges }).read("JOB_client");
  return { analysis, job, produced };
}

describe("GEMINI OUTPUT client", () => {
  it("decodes the real inspector outputs and refuses altered ones", async () => {
    const { analysis, job } = await realInspections();
    expect(decodeGeminiResultInspection(JSON.parse(JSON.stringify(analysis)))).not.toBeNull();
    expect(decodeGeminiExchangeInspection(JSON.parse(JSON.stringify(job)))).not.toBeNull();
    expect(decodeGeminiResultInspection({ ...analysis, inspectionVersion: "V2" })).toBeNull();
    // A processed artifact in place of the original response is never accepted.
    expect(decodeGeminiResultInspection({ ...analysis, originalGeminiResponse: { state: "RETAINED", kernelOutput: analysis.parserResult.kernelOutput } })).toBeNull();
    expect(decodeGeminiResultInspection({ ...analysis, originalGeminiResponse: { state: "NOT_RETAINED", text: "x" } })).toBeNull();
    expect(decodeGeminiExchangeInspection({ ...job, exchanges: [{ ...job.exchanges[0], outcome: "COMPLETED", errorCode: "ERR_X" }] })).toBeNull();
    expect(decodeGeminiExchangeInspection({ ...job, exchanges: [{ ...job.exchanges[0], attempt: { jobId: "JOB_other", leaseVersion: 1 } }] })).toBeNull();
  });

  it("sends the token per call with GET and no-store; maps closed, not found, lineage and failures", async () => {
    const { analysis } = await realInspections();
    const calls: Array<{ url: string; init: unknown }> = [];
    const respond = (status: number, body: unknown) => async (url: string, init: unknown) => { calls.push({ url, init }); return { status, json: async () => body }; };
    expect(await readGeminiResultInspection(respond(200, { success: true, inspection: analysis }), "ANL_1/x", "tok")).toMatchObject({ state: "AVAILABLE" });
    expect(calls[0]).toEqual({ url: "/api/career/analyses/ANL_1%2Fx/gemini-result", init: { method: "GET", headers: { [RESULT_INSPECTOR_TOKEN_HEADER]: "tok" }, cache: "no-store", signal: undefined } });
    expect(await readGeminiResultInspection(respond(404, { success: false, issues: [{ code: "ERR_NOT_FOUND" }] }), "A", "t")).toEqual({ state: "CLOSED" });
    expect(await readGeminiResultInspection(respond(404, { success: false, issues: [{ code: "ERR_RESULT_INSPECTION_NOT_FOUND" }] }), "A", "t")).toEqual({ state: "NOT_FOUND" });
    expect(await readGeminiResultInspection(respond(409, { success: false, issues: [{ code: "ERR_RESULT_INSPECTION_LINEAGE_INVALID" }] }), "A", "t")).toEqual({ state: "LINEAGE_INVALID" });
    expect(await readGeminiResultInspection(respond(200, { success: true, inspection: { inspectionVersion: "X" } }), "A", "t")).toEqual({ state: "FAILED" });
    expect(await readGeminiExchangeInspection(async () => { throw new Error("offline"); }, "JOB", "t")).toEqual({ state: "FAILED" });
  });

  it("guards B2 data: shown only while the binding equals the current analysis and selection", () => {
    const comparison = { binding: { analysisId: "ANL_1", ...TEST_JOB_SCOPE }, authority: { scored: false, capabilityRequirementRelationState: "NOT_EVALUATED" } };
    expect(comparisonBelongsToSelection(comparison, { analysisId: "ANL_1", ...TEST_JOB_SCOPE })).toBe(true);
    expect(comparisonBelongsToSelection(comparison, { analysisId: "ANL_1", ...TEST_JOB_SCOPE, poolRoleId: "other" })).toBe(false);
    expect(comparisonBelongsToSelection(comparison, { analysisId: "ANL_2", ...TEST_JOB_SCOPE })).toBe(false);
    expect(comparisonBelongsToSelection({ ...comparison, authority: { scored: true, capabilityRequirementRelationState: "NOT_EVALUATED" } }, { analysisId: "ANL_1", ...TEST_JOB_SCOPE })).toBe(false);
    expect(comparisonBelongsToSelection(null, { analysisId: "ANL_1", ...TEST_JOB_SCOPE })).toBe(false);
  });

  it("is browser-safe and stores nothing: type-only imports, no Node module, no storage API", () => {
    const source = readFileSync(path.resolve(__dirname, "../../../lib/career/result-inspector/client.ts"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(source.match(/^import (?!type ).*$/gm)).toBeNull();
    expect(source).not.toMatch(/node:|localStorage|sessionStorage|indexedDB|document\.cookie|method: "POST"/);
  });
});
