import { describe, expect, it } from "vitest";
import { InMemoryCandidateSourceBundleRepository, InMemoryCapabilityCoreRepository, InMemoryCapabilityProposalProjectionReferenceRepository } from "../../../lib/career/capability-core";
import { decodeAnalysisInvestigation, legacyJobComparisonPermitted, readAnalysisInvestigation, type AnalysisInvestigationReadState } from "../../../lib/career/investigation/client";
import { AnalysisInvestigationError, readPersistedAnalysisInvestigation, type AnalysisInvestigationDependencies } from "../../../lib/career/investigation/persisted";
import { createJob, type JobRecord } from "../../../lib/career/orchestration/job";
import { TEST_JOB_SCOPE, TEST_JOB_SCOPE_B, resolveTestJobScope } from "../../support/job-scope";
import { fakeGeminiClient, geminiProvider, geminiText, produceAnalysis, type InspectorWorld } from "../result-inspector/fixture";

/** URL BOUNDARY CLOSURE: analysisId → persisted investigation boundary, never the UI state. */
function world() {
  const jobs = new Map<string, JobRecord>();
  const analyses = new Set<string>();
  const scopeReads: string[] = [];
  const inspector: InspectorWorld = {
    capabilityRepository: new InMemoryCapabilityCoreRepository(), references: new InMemoryCapabilityProposalProjectionReferenceRepository(), sourceBundles: new InMemoryCandidateSourceBundleRepository(),
    saveJob: async job => { jobs.set(job.jobId, structuredClone(job)); }, saveAnalysis: async analysisId => { analyses.add(analysisId); }
  };
  const deps: AnalysisInvestigationDependencies = {
    analysisExists: async id => analyses.has(id),
    succeededJobIdsForAnalysis: async id => [...jobs.values()].filter(job => job.status === "SUCCEEDED" && job.resultAnalysisId === id).map(job => job.jobId),
    references: inspector.references, runs: inspector.capabilityRepository, jobs: { getJob: async id => jobs.get(id) ?? null },
    scopes: { resolve: async selection => { scopeReads.push(selection.poolRoleId); return resolveTestJobScope(selection); } }
  };
  /** A job the way the worker leaves it: SUCCEEDED with the processor's analysis id, and no projection reference. */
  const succeededJob = (sourceData: Record<string, unknown>) => {
    const job = { ...createJob("CAREER_ANALYSIS", { sourceType: "BATCH", sourceData: { documents: [], ...sourceData } }), status: "SUCCEEDED" as const };
    const analysisId = job.jobId.replace("JOB_", "ANL_");
    jobs.set(job.jobId, { ...job, resultAnalysisId: analysisId });
    analyses.add(analysisId);
    return analysisId;
  };
  return { jobs, analyses, inspector, deps, succeededJob, scopeReads };
}
const produce = (w: ReturnType<typeof world>, scoped: boolean, suffix: string) =>
  produceAnalysis(w.inspector, geminiProvider(fakeGeminiClient([geminiText(suffix)])), scoped ? resolveTestJobScope() : null, suffix);
const reasonOf = async (promise: Promise<unknown>) => {
  try { await promise; return "RESOLVED"; } catch (error) { if (error instanceof AnalysisInvestigationError) return `${error.status}:${error.reason ?? error.code}`; throw error; }
};

describe("persisted investigation boundary of an analysis", () => {
  it("PERSON and PERSON_X_JOB are read from the job declaration and proven against the Discovery run", async () => {
    const w = world();
    const person = await produce(w, false, "p");
    const scoped = await produce(w, true, "x");
    expect(await readPersistedAnalysisInvestigation(w.deps, person.analysisId)).toEqual({
      investigationVersion: "ANALYSIS_INVESTIGATION_V1", analysisId: person.analysisId, jobId: person.job.jobId, mode: "PERSON", jobScopeSelection: null,
      basis: "JOB_DECLARATION_AND_DISCOVERY_RUN", discoveryRunId: person.run.runId, investigationScopeHash: null
    });
    const read = await readPersistedAnalysisInvestigation(w.deps, scoped.analysisId);
    expect(read).toEqual({
      investigationVersion: "ANALYSIS_INVESTIGATION_V1", analysisId: scoped.analysisId, jobId: scoped.job.jobId, mode: "PERSON_X_JOB", jobScopeSelection: TEST_JOB_SCOPE,
      basis: "JOB_DECLARATION_AND_DISCOVERY_RUN", discoveryRunId: scoped.run.runId, investigationScopeHash: scoped.run.investigationScope!.scopeHash
    });
    expect(decodeAnalysisInvestigation(JSON.parse(JSON.stringify(read)))).toEqual(read);
    // Only the scoped run needed the stored pool.
    expect(w.scopeReads).toEqual([TEST_JOB_SCOPE.poolRoleId]);
  });

  it("a job without projection reference (reused snapshot) resolves from its declaration alone; the earlier contract stays PERSON_X_JOB", async () => {
    const w = world();
    const declared = w.succeededJob({ investigation: { mode: "PERSON_X_JOB" }, jobScope: TEST_JOB_SCOPE_B });
    const earlier = w.succeededJob({ jobScope: TEST_JOB_SCOPE });
    const person = w.succeededJob({ investigation: { mode: "PERSON" } });
    expect(await readPersistedAnalysisInvestigation(w.deps, declared)).toMatchObject({ mode: "PERSON_X_JOB", jobScopeSelection: TEST_JOB_SCOPE_B, basis: "JOB_DECLARATION", discoveryRunId: null, investigationScopeHash: null });
    expect(await readPersistedAnalysisInvestigation(w.deps, earlier)).toMatchObject({ mode: "PERSON_X_JOB", jobScopeSelection: TEST_JOB_SCOPE });
    expect(await readPersistedAnalysisInvestigation(w.deps, person)).toMatchObject({ mode: "PERSON", jobScopeSelection: null, basis: "JOB_DECLARATION" });
  });

  it("refuses to guess: unknown 404; no job, undeclared, invalid, ambiguous, broken lineage, contradicting run 409", async () => {
    const w = world();
    expect(await reasonOf(readPersistedAnalysisInvestigation(w.deps, "ANL_UNKNOWN"))).toBe("404:ERR_ANALYSIS_INVESTIGATION_NOT_FOUND");
    expect(await reasonOf(readPersistedAnalysisInvestigation(w.deps, ""))).toBe("404:ERR_ANALYSIS_INVESTIGATION_NOT_FOUND");
    // Stored directly, without a job (historical analyses, E2E and validation fixtures).
    w.analyses.add("ANL_DIRECT");
    expect(await reasonOf(readPersistedAnalysisInvestigation(w.deps, "ANL_DIRECT"))).toBe("409:NOT_RECORDED");
    // A job from before the job-scope gate declares nothing; PERSON is never inferred from a missing field.
    expect(await reasonOf(readPersistedAnalysisInvestigation(w.deps, w.succeededJob({})))).toBe("409:NOT_DECLARED");
    expect(await reasonOf(readPersistedAnalysisInvestigation(w.deps, w.succeededJob({ investigation: { mode: "PERSON" }, jobScope: TEST_JOB_SCOPE })))).toBe("409:DECLARATION_INVALID");
    expect(await reasonOf(readPersistedAnalysisInvestigation(w.deps, w.succeededJob({ investigation: { mode: "JOB" } })))).toBe("409:DECLARATION_INVALID");
    // A second job claiming the same analysis.
    const twice = w.succeededJob({ jobScope: TEST_JOB_SCOPE });
    w.jobs.set("JOB_OTHER", { ...w.jobs.get(twice.replace("ANL_", "JOB_"))!, jobId: "JOB_OTHER" });
    expect(await reasonOf(readPersistedAnalysisInvestigation(w.deps, twice))).toBe("409:AMBIGUOUS");
    // The job's own result must be this analysis, by the processor's id rule.
    const foreign = w.succeededJob({ jobScope: TEST_JOB_SCOPE });
    const foreignJob = w.jobs.get(foreign.replace("ANL_", "JOB_"))!;
    w.jobs.set(foreignJob.jobId, { ...foreignJob, resultAnalysisId: "ANL_SOMETHING_ELSE" });
    w.jobs.set("JOB_MOVED", { ...foreignJob, jobId: "JOB_MOVED", resultAnalysisId: foreign });
    w.jobs.delete(foreignJob.jobId);
    expect(await reasonOf(readPersistedAnalysisInvestigation(w.deps, foreign))).toBe("409:LINEAGE_INVALID");
  });

  it("a declaration that its Discovery run contradicts is unresolved (a PERSON_X_JOB job whose Discovery ran unscoped, e.g. before e643e96)", async () => {
    const w = world();
    const person = await produce(w, false, "c");
    const job = w.jobs.get(person.job.jobId)!;
    w.jobs.set(job.jobId, { ...job, inputRef: { ...job.inputRef, sourceData: { documents: [], jobScope: TEST_JOB_SCOPE } } });
    expect(await reasonOf(readPersistedAnalysisInvestigation(w.deps, person.analysisId))).toBe("409:RUN_CONTRADICTS_DECLARATION");
    const scoped = await produce(w, true, "d");
    const scopedJob = w.jobs.get(scoped.job.jobId)!;
    w.jobs.set(scopedJob.jobId, { ...scopedJob, inputRef: { ...scopedJob.inputRef, sourceData: { documents: [], investigation: { mode: "PERSON" } } } });
    expect(await reasonOf(readPersistedAnalysisInvestigation(w.deps, scoped.analysisId))).toBe("409:RUN_CONTRADICTS_DECLARATION");
  });

  it("a scoped run must have seen exactly the declared job (PINK O-URL-SCOPE-IDENTITY); an unresolvable selection is SCOPE_UNAVAILABLE", async () => {
    const w = world();
    const scoped = await produce(w, true, "s");
    const job = w.jobs.get(scoped.job.jobId)!;
    // The job declares role B of the same pool, the Discovery run saw role A.
    w.jobs.set(job.jobId, { ...job, inputRef: { ...job.inputRef, sourceData: { documents: [], investigation: { mode: "PERSON_X_JOB" }, jobScope: TEST_JOB_SCOPE_B } } });
    expect(await reasonOf(readPersistedAnalysisInvestigation(w.deps, scoped.analysisId))).toBe("409:RUN_CONTRADICTS_DECLARATION");
    w.jobs.set(job.jobId, { ...job, inputRef: { ...job.inputRef, sourceData: { documents: [], jobScope: { ...TEST_JOB_SCOPE, poolRoleId: "role_removed_from_pool" } } } });
    expect(await reasonOf(readPersistedAnalysisInvestigation(w.deps, scoped.analysisId))).toBe("409:SCOPE_UNAVAILABLE");
    w.jobs.set(job.jobId, job);
    expect(await readPersistedAnalysisInvestigation(w.deps, scoped.analysisId)).toMatchObject({ mode: "PERSON_X_JOB", jobScopeSelection: TEST_JOB_SCOPE });
  });
});

describe("browser client and the legacy comparison guard", () => {
  const value = { investigationVersion: "ANALYSIS_INVESTIGATION_V1", analysisId: "ANL_1", jobId: "JOB_1", mode: "PERSON_X_JOB", jobScopeSelection: { ...TEST_JOB_SCOPE }, basis: "JOB_DECLARATION_AND_DISCOVERY_RUN", discoveryRunId: "RUN_1", investigationScopeHash: "h" } as const;
  const respond = (status: number, body: unknown) => async () => ({ status, json: async () => body });

  it("decodes strictly: exact keys, mode-consistent selection, basis-consistent run identities", () => {
    expect(decodeAnalysisInvestigation(value)).not.toBeNull();
    expect(decodeAnalysisInvestigation({ ...value, mode: "JOB" })).toBeNull();
    expect(decodeAnalysisInvestigation({ ...value, mode: "PERSON" })).toBeNull();
    expect(decodeAnalysisInvestigation({ ...value, mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null })).not.toBeNull();
    expect(decodeAnalysisInvestigation({ ...value, jobScopeSelection: null })).toBeNull();
    expect(decodeAnalysisInvestigation({ ...value, jobScopeSelection: { ...TEST_JOB_SCOPE, extra: 1 } })).toBeNull();
    expect(decodeAnalysisInvestigation({ ...value, investigationScopeHash: null })).toBeNull();
    expect(decodeAnalysisInvestigation({ ...value, basis: "JOB_DECLARATION" })).toBeNull();
    expect(decodeAnalysisInvestigation({ ...value, basis: "JOB_DECLARATION", discoveryRunId: null, investigationScopeHash: null })).not.toBeNull();
    expect(decodeAnalysisInvestigation({ ...value, inferred: true })).toBeNull();
  });

  it("reads with GET and no-store, maps 404/409/failures, and refuses an answer about another analysis", async () => {
    const calls: unknown[] = [];
    const recording = async (url: string, init: unknown) => { calls.push({ url, init }); return { status: 200, json: async () => ({ success: true, investigation: value }) }; };
    expect(await readAnalysisInvestigation(recording, "ANL_1")).toEqual({ state: "RESOLVED", value });
    expect(calls[0]).toEqual({ url: "/api/career/analyses/ANL_1/investigation", init: { method: "GET", cache: "no-store", signal: undefined } });
    expect(await readAnalysisInvestigation(respond(200, { success: true, investigation: value }), "ANL_2")).toEqual({ state: "FAILED" });
    expect(await readAnalysisInvestigation(respond(404, { success: false, issues: [{ code: "ERR_ANALYSIS_INVESTIGATION_NOT_FOUND" }] }), "A")).toEqual({ state: "NOT_FOUND" });
    expect(await readAnalysisInvestigation(respond(409, { success: false, issues: [{ code: "ERR_ANALYSIS_INVESTIGATION_UNRESOLVED", reason: "NOT_RECORDED" }] }), "A")).toEqual({ state: "UNRESOLVED", reason: "NOT_RECORDED" });
    expect(await readAnalysisInvestigation(respond(409, { success: false, issues: [{ code: "ERR_ANALYSIS_INVESTIGATION_UNRESOLVED", reason: "MADE_UP" }] }), "A")).toEqual({ state: "UNRESOLVED", reason: null });
    expect(await readAnalysisInvestigation(respond(409, { success: false, issues: [{ code: "ERR_ANALYSIS_INVESTIGATION_UNRESOLVED", reason: "SCOPE_UNAVAILABLE" }] }), "A")).toEqual({ state: "UNRESOLVED", reason: "SCOPE_UNAVAILABLE" });
    expect(await readAnalysisInvestigation(respond(503, { success: false, issues: [{ code: "ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED" }] }), "A")).toEqual({ state: "FAILED" });
    expect(await readAnalysisInvestigation(respond(404, { success: false, issues: [{ code: "ERR_NOT_FOUND" }] }), "A")).toEqual({ state: "FAILED" });
    expect(await readAnalysisInvestigation(async () => { throw new Error("offline"); }, "A")).toEqual({ state: "FAILED" });
  });

  it("permits the pool-wide legacy comparison only for PERSON_X_JOB against exactly the analysis's own pool", () => {
    const resolved: AnalysisInvestigationReadState = { state: "RESOLVED", value: decodeAnalysisInvestigation(value)! };
    const current = { analysisId: "ANL_1", jobPoolUploadId: TEST_JOB_SCOPE.jobPoolUploadId };
    expect(legacyJobComparisonPermitted(resolved, current)).toBe(true);
    expect(legacyJobComparisonPermitted(resolved, { ...current, jobPoolUploadId: "JPOOL_OTHER" })).toBe(false);
    expect(legacyJobComparisonPermitted(resolved, { ...current, analysisId: "ANL_2" })).toBe(false);
    expect(legacyJobComparisonPermitted(resolved, null)).toBe(false);
    expect(legacyJobComparisonPermitted({ state: "RESOLVED", value: decodeAnalysisInvestigation({ ...value, mode: "PERSON", jobScopeSelection: null, investigationScopeHash: null })! }, current)).toBe(false);
    for (const read of [null, { state: "UNRESOLVED", reason: "NOT_RECORDED" }, { state: "NOT_FOUND" }, { state: "FAILED" }] as const) expect(legacyJobComparisonPermitted(read, current)).toBe(false);
  });

  it("is browser-safe: type-only imports, no Node module, no storage, GET only", async () => {
    const { readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const source = readFileSync(path.resolve(__dirname, "../../../lib/career/investigation/client.ts"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(source.match(/^import (?!type ).*$/gm)).toBeNull();
    expect(source).not.toMatch(/node:|localStorage|sessionStorage|indexedDB|document\.cookie|method: "POST"/);
  });
});
