import { describe, expect, it, vi } from "vitest";
import {
  InMemoryCapabilityCoreRepository, buildCapabilityDiscoveryPrompt, buildCapabilityDiscoveryRunId, computeSourceBundleHash, createCapabilityProposalRuntime,
  createSourceDocument, runCapabilityConvergence, runCapabilityDiscovery, type CapabilityDiscoveryProvider, type CapabilityDiscoveryProviderRequest
} from "../../../lib/career/capability-core";
import {
  INVESTIGATION_INVALID_MESSAGE, InvestigationBoundaryError, assertIssuedAnalysisBoundary, isIssuedPersonInvestigation, issuePersonInvestigation,
  modeOfBoundary, parseDeclaredInvestigation, requireActiveAnalysisBoundary
} from "../../../lib/career/investigation";
import {
  JOB_SCOPE_REQUIRED_MESSAGE, JobScopeRequiredError, assertIssuedJobScope, requireActiveJobScope, requireValidJobScope, resolveJobScopeFromStoredPool
} from "../../../lib/career/job-scope";
import { createCareerCapabilityProposalExecutor } from "../../../lib/career/orchestration/capability-proposal-executor";
import { createJob } from "../../../lib/career/orchestration/job";
import { executeCareerAnalysisBatchPipeline, executeCareerAnalysisPipeline } from "../../../lib/career/pipeline";
import type { InferenceProvider } from "../../../lib/career/adapter";
import { TEST_JOB_SCOPE, TEST_STORED_POOL, resolveTestJobScope } from "../../support/job-scope";

/** Owner GO 2026-10-15: no analysis without an explicit investigation boundary (PERSON · PERSON_X_JOB · JOB). */
const failure = async (run: () => unknown) => { try { await run(); } catch (error) { return error; } throw new Error("expected a refusal"); };
const expectInvestigationError = (error: unknown, code: string) => {
  expect(error).toBeInstanceOf(InvestigationBoundaryError);
  expect([(error as InvestigationBoundaryError).code, (error as Error).message, (error as Error).name]).toEqual([code, INVESTIGATION_INVALID_MESSAGE, "TERMINAL_ERROR"]);
};
const expectScopeError = (error: unknown, code: string) => {
  expect(error).toBeInstanceOf(JobScopeRequiredError);
  expect([(error as JobScopeRequiredError).code, (error as Error).message]).toEqual([code, JOB_SCOPE_REQUIRED_MESSAGE]);
};
const resolver = { resolve: vi.fn(async (selection: typeof TEST_JOB_SCOPE) => resolveJobScopeFromStoredPool(TEST_STORED_POOL, selection)) };
const job = (sourceData: unknown) => createJob("CAREER_ANALYSIS", { sourceType: "BATCH", sourceData });

describe("investigation boundary — declaration", () => {
  it("keeps the earlier contract without a declaration: with a scope PERSON_X_JOB, without one the job-scope refusal", () => {
    expect(parseDeclaredInvestigation({ jobScope: TEST_JOB_SCOPE })).toEqual({ mode: "PERSON_X_JOB", selection: TEST_JOB_SCOPE });
    for (const sourceData of [{}, { documents: [] }, null, "opaque", undefined, []]) expectScopeError((() => { try { parseDeclaredInvestigation(sourceData); } catch (error) { return error; } })(), "ERR_JOB_SCOPE_REQUIRED");
  });

  it("PERSON is only what is declared, and it excludes a job scope", () => {
    expect(parseDeclaredInvestigation({ investigation: { mode: "PERSON" } })).toEqual({ mode: "PERSON" });
    expect(parseDeclaredInvestigation({ investigation: { mode: "PERSON_X_JOB" }, jobScope: TEST_JOB_SCOPE })).toEqual({ mode: "PERSON_X_JOB", selection: TEST_JOB_SCOPE });
    const refuse = (sourceData: unknown) => { try { parseDeclaredInvestigation(sourceData); } catch (error) { return error; } throw new Error("expected a refusal"); };
    expectInvestigationError(refuse({ investigation: { mode: "PERSON" }, jobScope: TEST_JOB_SCOPE }), "ERR_INVESTIGATION_INVALID");
    expectInvestigationError(refuse({ investigation: { mode: "PERSON" }, jobScope: null }), "ERR_INVESTIGATION_INVALID");
    expectInvestigationError(refuse({ investigation: { mode: "JOB" } }), "ERR_INVESTIGATION_MODE_NOT_ANALYZABLE");
    for (const investigation of [null, "PERSON", [], {}, { mode: "person" }, { mode: "PERSON", extra: true }, { mode: "ALL" }, { kind: "PERSON" }]) {
      expectInvestigationError(refuse({ investigation }), "ERR_INVESTIGATION_INVALID");
    }
    expectScopeError(refuse({ investigation: { mode: "PERSON_X_JOB" } }), "ERR_JOB_SCOPE_REQUIRED");
  });

  it("only an issued PERSON investigation passes; literals, copies and JOB never do", () => {
    const person = issuePersonInvestigation({ mode: "PERSON" });
    expect([isIssuedPersonInvestigation(person), Object.isFrozen(person), modeOfBoundary(person)]).toEqual([true, true, "PERSON"]);
    expect(() => assertIssuedAnalysisBoundary(person)).not.toThrow();
    expect(modeOfBoundary(resolveTestJobScope())).toBe("PERSON_X_JOB");
    for (const forged of [{ mode: "PERSON" }, { ...person }, structuredClone(person), JSON.parse(JSON.stringify(person)), undefined, null]) {
      expectScopeError(failureSync(() => assertIssuedAnalysisBoundary(forged)), "ERR_JOB_SCOPE_REQUIRED");
    }
    expectInvestigationError(failureSync(() => issuePersonInvestigation({ mode: "PERSON_X_JOB", selection: TEST_JOB_SCOPE })), "ERR_INVESTIGATION_INVALID");
  });
});
function failureSync(run: () => unknown) { try { run(); } catch (error) { return error; } throw new Error("expected a refusal"); }

describe("investigation boundary — worker", () => {
  it("PERSON runs inside an issued person investigation without any job scope and without the pool resolver", async () => {
    resolver.resolve.mockClear();
    const seen: unknown[] = [];
    const processJob = vi.fn(async (_job: unknown, _report: unknown, boundary: unknown) => {
      seen.push(boundary, requireActiveAnalysisBoundary(), await failure(() => requireActiveJobScope()));
      return { resultAnalysisId: "ANL_PERSON" };
    });
    await expect(requireValidJobScope(resolver, processJob)(job({ documents: [{ type: "text", content: "x" }], investigation: { mode: "PERSON" } }), async () => undefined)).resolves.toEqual({ resultAnalysisId: "ANL_PERSON" });
    const [boundary, active, scopeRefusal] = seen;
    expect([isIssuedPersonInvestigation(boundary), active === boundary]).toEqual([true, true]);
    expectScopeError(scopeRefusal, "ERR_JOB_SCOPE_REQUIRED");
    expect(resolver.resolve).not.toHaveBeenCalled();
  });

  it("PERSON_X_JOB and undeclared jobs are validated exactly as before; contradictions fail terminally before any work", async () => {
    const processJob = vi.fn(async () => ({ resultAnalysisId: "ANL" }));
    const guarded = requireValidJobScope(resolver, processJob);
    await guarded(job({ investigation: { mode: "PERSON_X_JOB" }, jobScope: TEST_JOB_SCOPE }), async () => undefined);
    await guarded(job({ jobScope: TEST_JOB_SCOPE }), async () => undefined);
    for (const call of processJob.mock.calls as unknown as Array<[unknown, unknown, unknown]>) expect(() => assertIssuedJobScope(call[2])).not.toThrow();
    processJob.mockClear();
    expectInvestigationError(await failure(() => guarded(job({ investigation: { mode: "PERSON" }, jobScope: TEST_JOB_SCOPE }), async () => undefined)), "ERR_INVESTIGATION_INVALID");
    expectInvestigationError(await failure(() => guarded(job({ investigation: { mode: "JOB" } }), async () => undefined)), "ERR_INVESTIGATION_MODE_NOT_ANALYZABLE");
    expectScopeError(await failure(() => guarded(job({ documents: [] }), async () => undefined)), "ERR_JOB_SCOPE_REQUIRED");
    expect(processJob).not.toHaveBeenCalled();
  });

  it("outside a claimed job there is no boundary at all", async () => {
    expectScopeError(await failure(() => requireActiveAnalysisBoundary()), "ERR_JOB_SCOPE_REQUIRED");
  });
});

describe("investigation boundary — Discovery and the legacy pipeline", () => {
  const SOURCE = "Led the migration of the dispatch platform to event-driven services.";
  const discoveryKernel = { kernelVersion: "discovery-v1", templateId: "T", versionId: "V", checksum: "C", plainTextContent: "FAKE_DISCOVERY_KERNEL" };
  const convergenceKernel = { kernelVersion: "convergence-v1", templateId: "T", versionId: "V", checksum: "CC", plainTextContent: "FAKE_CONVERGENCE_KERNEL" };
  const executorWith = async (provider: CapabilityDiscoveryProvider, capabilityRepository = new InMemoryCapabilityCoreRepository()) => createCareerCapabilityProposalExecutor({
    environment: { GEMINI_MODEL: "m", PROMPT_ENCRYPTION_KEY: "unused" }, defaultGeminiModel: "m",
    promptRepository: {} as never, capabilityRepository,
    bootstrapCapabilityProposalKernels: async () => undefined,
    createActivePromptResolver: () => ({}) as never,
    createDiscoveryKernelResolver: () => ({ resolve: async () => discoveryKernel }),
    createConvergenceKernelResolver: () => ({ resolve: async () => convergenceKernel }),
    createDiscoveryProvider: () => provider,
    createConvergenceProvider: () => ({ providerName: "fake", model: "m", execute: async () => { throw new Error("STOP_AFTER_DISCOVERY"); } }),
    runDiscovery: runCapabilityDiscovery, runConvergence: runCapabilityConvergence, createProposalRuntime: createCapabilityProposalRuntime
  });

  it("PERSON: the Discovery request and RUN_ identity are exactly the unscoped ones; no scope reaches Gemini", async () => {
    const requests: CapabilityDiscoveryProviderRequest[] = [];
    const audit = { source_documents_examined: 1, capability_count: 0, atomic_capability_count: 0, composite_capability_count: 0, attribution_pass_completed: true, target_state_ownership_pass_completed: true, atomic_extraction_pass_completed: true, method_capability_pass_completed: true, composite_reconstruction_pass_completed: true, global_convergence_pass_completed: true, inventory_reconciliation_pass_completed: true, final_reconciliation_produced_new_capabilities: false, unresolved_target_operations: 0, segments_classified_as_external_source_content: 0, segments_classified_as_target_subject_operation: 0, segments_classified_as_target_subject_designed_target_state: 0, segments_classified_as_target_organization_capability: 0, segments_excluded_due_to_attribution_ambiguity: 0 };
    const provider: CapabilityDiscoveryProvider = { providerName: "fake", model: "m", execute: async (request) => { requests.push(request); return { kernelOutput: { kernel_version: "discovery-v1", capabilities: [], coverage_audit: audit } }; } };
    const repository = new InMemoryCapabilityCoreRepository();
    const executor = await executorWith(provider, repository);
    const documents = [{ docId: "CV", title: "cv.synthetic.pdf", content: SOURCE }];
    for (const forged of [{ mode: "PERSON" }, undefined]) await expect(executor.execute(documents, async () => undefined, forged as never)).rejects.toThrow(JOB_SCOPE_REQUIRED_MESSAGE);
    expect(requests).toHaveLength(0);
    await executor.execute(documents, async () => undefined, issuePersonInvestigation({ mode: "PERSON" })).catch(() => undefined);
    const cv = createSourceDocument({ docId: "CV", title: "cv.synthetic.pdf", rawContent: SOURCE });
    expect(requests).toEqual([buildCapabilityDiscoveryPrompt([cv], discoveryKernel)]);
    expect(requests[0].systemPrompt).not.toContain("INVESTIGATION_SCOPE");
    // The PERSON run is the unscoped run: the pre-scope RUN_ identity, no scope field on the record.
    const run = await repository.getRunById(buildCapabilityDiscoveryRunId({ sourceBundleHash: computeSourceBundleHash([cv]), kernelVersion: "discovery-v1", promptChecksum: "C", provider: "fake", model: "m", schemaVersion: "discovery-schema-v1" }));
    expect(run?.status).toBe("COMPLETED");
    expect("investigationScope" in (run as object)).toBe(false);
  });

  it("PERSON_X_JOB through the executor is unchanged: the scope is in the system prompt", async () => {
    const requests: CapabilityDiscoveryProviderRequest[] = [];
    const executor = await executorWith({ providerName: "fake", model: "m", execute: async (request) => { requests.push(request); throw new Error("STOP_AT_PROVIDER"); } });
    await expect(executor.execute([{ docId: "CV", title: "cv.synthetic.pdf", content: SOURCE }], async () => undefined, resolveTestJobScope())).rejects.toThrow("STOP_AT_PROVIDER");
    expect(requests[0].systemPrompt).toContain("<INVESTIGATION_SCOPE>");
  });

  it("the legacy pipeline runs with an issued PERSON investigation, refuses forged ones and two boundaries at once", async () => {
    const documents = [{ docId: "DOC_001", title: "CV", content: SOURCE }];
    const spy = () => { const execute = vi.fn(async () => "{}"); return { provider: { execute } as unknown as InferenceProvider, execute }; };
    const person = issuePersonInvestigation({ mode: "PERSON" });
    const ok = spy();
    await executeCareerAnalysisPipeline(documents, ok.provider, { investigation: person }).catch(() => undefined);
    expect(ok.execute).toHaveBeenCalledTimes(1);
    for (const options of [{ investigation: { mode: "PERSON" } }, { investigation: { ...person } }]) {
      const refused = spy();
      expectScopeError(await failure(() => executeCareerAnalysisPipeline(documents, refused.provider, options as never)), "ERR_JOB_SCOPE_REQUIRED");
      expectScopeError(await failure(() => executeCareerAnalysisBatchPipeline([{ type: "text", content: "x" }] as never, refused.provider, undefined, options as never)), "ERR_JOB_SCOPE_REQUIRED");
      expect(refused.execute).not.toHaveBeenCalled();
    }
    const both = spy();
    expectInvestigationError(await failure(() => executeCareerAnalysisPipeline(documents, both.provider, { investigation: person, jobScope: resolveTestJobScope() } as never)), "ERR_INVESTIGATION_INVALID");
    expect(both.execute).not.toHaveBeenCalled();
  });
});
