import { describe, expect, it, vi } from "vitest";
import type { DocumentInput } from "../lib/career/adapter";
import { createSourceDocument, type SourceDocument } from "../lib/career/capability-core";
import {
  assertCareerJobRuntimeOperation,
  createJob,
  type CareerJobRuntimeOperation
} from "../lib/career/orchestration/job";
import * as workerModule from "../lib/career/orchestration/worker";

type RuntimeOperation = CareerJobRuntimeOperation;
type ReportOperation = (operation: RuntimeOperation) => Promise<void>;
type WorkerJob = {
  jobId: string;
  inputRef: { sourceData: { documents: unknown[] } };
};
type ProposalState =
  | {
      kind: "PROPOSALS_CONVERGED";
      discoveryDisposition: "EXECUTED" | "REUSED";
      convergenceDisposition: "EXECUTED" | "REUSED";
    }
  | { kind: "VERIFIED_SNAPSHOT_REUSED"; discoveryDisposition: "VERIFIED_SNAPSHOT_REUSED" };

type CareerAnalysisJobProcessorFactory = (dependencies: {
  canonicalAnalysisRepository: {
    load(analysisId: string): Promise<{ analysisId: string } | null>;
    save(analysis: object): Promise<void>;
  };
  prepareDocuments(documents: unknown[]): Promise<{ normalizedDocs: DocumentInput[] }>;
  capabilityProposalExecutor: {
    execute(documents: DocumentInput[], reportOperation: ReportOperation): Promise<ProposalState>;
  };
  executeLegacyCareerAnalysis(
    documents: DocumentInput[],
    reportOperation: ReportOperation,
    explicitAnalysisId: string
  ): Promise<{ resultAnalysisId: string; analysis: object }>;
}) => (job: WorkerJob, reportOperation: ReportOperation) => Promise<{ resultAnalysisId: string }>;

type CapabilityProvider = { execute(request: unknown): Promise<unknown> };
type CapabilityProposalExecutor = {
  execute(documents: DocumentInput[], reportOperation: ReportOperation): Promise<ProposalState>;
};
type CapabilityProposalExecutorFactory = (dependencies: {
  environment: { GEMINI_MODEL?: string; PROMPT_ENCRYPTION_KEY?: string };
  defaultGeminiModel: string;
  promptRepository: object;
  capabilityRepository: object;
  bootstrapCapabilityProposalKernels(input: {
    promptRepository: object;
    encryptionKeyBase64: string;
  }): Promise<void>;
  createActivePromptResolver(promptRepository: object, encryptionKeyBase64: string): object;
  createDiscoveryKernelResolver(
    activePromptResolver: object,
    promptSlug: string,
    kernelVersion: string,
    encryptionKeyBase64: string
  ): object;
  createConvergenceKernelResolver(
    activePromptResolver: object,
    kernelVersion: string,
    promptSlug: string,
    encryptionKeyBase64: string
  ): object;
  createDiscoveryProvider(model: string): CapabilityProvider;
  createConvergenceProvider(model: string): CapabilityProvider;
  runDiscovery(
    documents: SourceDocument[],
    configuration: { kernelVersion: string; schemaVersion: string },
    dependencies: { repository: object; provider: CapabilityProvider; kernelResolver: object }
  ): Promise<{ kind: "DISCOVERY_COMPLETED" | "DISCOVERY_RUN_REUSED"; run: object } | { kind: "VERIFIED_SNAPSHOT_REUSED"; snapshot: object }>;
  runConvergence(
    discoveryRun: object,
    configuration: { kernelVersion: string; schemaVersion: string; algorithmVersion: string },
    dependencies: { repository: object; provider: CapabilityProvider; kernelResolver: object }
  ): Promise<{ kind: "CONVERGENCE_COMPLETED" | "CONVERGENCE_RUN_REUSED"; run: object }>;
  createProposalRuntime(dependencies: {
    repository: object;
    discovery: { kernelResolver: object; run(documents: SourceDocument[]): Promise<unknown> };
    convergence: { kernelResolver: object; run(discoveryRun: object): Promise<unknown> };
  }): { execute(documents: DocumentInput[]): Promise<ProposalState> };
}) => Promise<CapabilityProposalExecutor>;

function getProcessorFactory(): CareerAnalysisJobProcessorFactory {
  const factory = (
    workerModule as unknown as {
      createCareerAnalysisJobProcessor?: CareerAnalysisJobProcessorFactory;
    }
  ).createCareerAnalysisJobProcessor;

  expect(factory).toBeTypeOf("function");
  if (typeof factory !== "function") {
    throw new Error("F10B career job processor factory is not available.");
  }
  return factory;
}

function getCapabilityProposalExecutorFactory(): CapabilityProposalExecutorFactory {
  const factory = (
    workerModule as unknown as {
      createCareerCapabilityProposalExecutor?: CapabilityProposalExecutorFactory;
    }
  ).createCareerCapabilityProposalExecutor;

  expect(factory).toBeTypeOf("function");
  if (typeof factory !== "function") {
    throw new Error("F10B capability proposal executor factory is not available.");
  }
  return factory;
}

const normalizedDocs: DocumentInput[] = [
  { docId: "DOC_001", title: "Prepared source", content: "Literal source content." }
];
const sourceDocumentsFromF10A: SourceDocument[] = [
  createSourceDocument({
    docId: "DOC_001",
    title: "Prepared source",
    rawContent: "Literal source content."
  })
];
const job: WorkerJob = {
  jobId: "JOB_F10B_WIRING",
  inputRef: { sourceData: { documents: [{ type: "text", content: "Literal source content." }] } }
};

function proposalState(discoveryDisposition: "EXECUTED" | "REUSED" = "EXECUTED"): ProposalState {
  return {
    kind: "PROPOSALS_CONVERGED",
    discoveryDisposition,
    convergenceDisposition: discoveryDisposition === "REUSED" ? "REUSED" : "EXECUTED"
  };
}

function processorFixture(options: {
  existing?: { analysisId: string } | null;
  proposal?: ProposalState;
  proposalError?: Error;
}) {
  const events: string[] = [];
  const load = vi.fn(async () => {
    events.push("canonical-load");
    return options.existing ?? null;
  });
  const save = vi.fn(async () => {
    events.push("canonical-save");
  });
  const prepareDocuments = vi.fn(async () => {
    events.push("prepare-documents");
    return { normalizedDocs };
  });
  const execute = vi.fn(async (documents: DocumentInput[]) => {
    events.push("capability-proposal");
    expect(documents).toBe(normalizedDocs);
    if (options.proposalError) throw options.proposalError;
    return options.proposal ?? proposalState();
  });
  const executeLegacyCareerAnalysis = vi.fn(async (documents: DocumentInput[]) => {
    events.push("legacy-analysis");
    expect(documents).toBe(normalizedDocs);
    return { resultAnalysisId: "ANL_F10B_WIRING", analysis: { canonical: true } };
  });
  const reportOperation: ReportOperation = vi.fn(async (operation) => {
    events.push(`operation:${operation}`);
  });

  return {
    events,
    load,
    save,
    prepareDocuments,
    execute,
    executeLegacyCareerAnalysis,
    reportOperation,
    processor: getProcessorFactory()({
      canonicalAnalysisRepository: { load, save },
      prepareDocuments,
      capabilityProposalExecutor: { execute },
      executeLegacyCareerAnalysis
    })
  };
}

describe("F10B Career worker Capability Proposal wiring", () => {
  it("does not let an existing canonical analysis skip the Capability Proposal sidecar", async () => {
    const fixture = processorFixture({ existing: { analysisId: "ANL_F10B_WIRING" } });

    await expect(fixture.processor(job, fixture.reportOperation)).resolves.toEqual({
      resultAnalysisId: "ANL_F10B_WIRING"
    });

    expect(fixture.events).toEqual([
      "operation:RECOVERY_CHECK",
      "canonical-load",
      "operation:SOURCE_PREPARATION",
      "prepare-documents",
      "capability-proposal"
    ]);
    expect(fixture.executeLegacyCareerAnalysis).not.toHaveBeenCalled();
    expect(fixture.save).not.toHaveBeenCalled();
  });

  it("orders a new job as recovery, source preparation, proposal sidecar, legacy analysis, then persistence", async () => {
    const fixture = processorFixture({});

    await fixture.processor(job, fixture.reportOperation);

    expect(fixture.events).toEqual([
      "operation:RECOVERY_CHECK",
      "canonical-load",
      "operation:SOURCE_PREPARATION",
      "prepare-documents",
      "capability-proposal",
      "legacy-analysis",
      "operation:PERSISTENCE",
      "canonical-save"
    ]);
  });

  it("prepares one normalized source inventory and passes that exact inventory to both sidecar and legacy analysis", async () => {
    const fixture = processorFixture({});

    await fixture.processor(job, fixture.reportOperation);

    expect(fixture.prepareDocuments).toHaveBeenCalledTimes(1);
    expect(fixture.execute.mock.calls[0][0]).toBe(normalizedDocs);
    expect(fixture.executeLegacyCareerAnalysis.mock.calls[0][0]).toBe(normalizedDocs);
  });

  it("propagates a failed sidecar prerequisite even when canonical analysis already exists", async () => {
    const failure = new Error("F10B_CAPABILITY_PROPOSAL_FAILED");
    const fixture = processorFixture({
      existing: { analysisId: "ANL_F10B_WIRING" },
      proposalError: failure
    });

    await expect(fixture.processor(job, fixture.reportOperation)).rejects.toBe(failure);
    expect(fixture.executeLegacyCareerAnalysis).not.toHaveBeenCalled();
    expect(fixture.save).not.toHaveBeenCalled();
  });

  it("runs legacy analysis and persistence when proposal artifacts are reused but canonical analysis is missing", async () => {
    const fixture = processorFixture({ proposal: proposalState("REUSED") });

    await expect(fixture.processor(job, fixture.reportOperation)).resolves.toEqual({
      resultAnalysisId: "ANL_F10B_WIRING"
    });
    expect(fixture.execute).toHaveBeenCalledTimes(1);
    expect(fixture.executeLegacyCareerAnalysis).toHaveBeenCalledTimes(1);
    expect(fixture.save).toHaveBeenCalledTimes(1);
  });

  it("accepts verified snapshot reuse without manufacturing verification/publication artifacts", async () => {
    const fixture = processorFixture({
      existing: { analysisId: "ANL_F10B_WIRING" },
      proposal: { kind: "VERIFIED_SNAPSHOT_REUSED", discoveryDisposition: "VERIFIED_SNAPSHOT_REUSED" }
    });

    const result = await fixture.processor(job, fixture.reportOperation);

    expect(result).toEqual({ resultAnalysisId: "ANL_F10B_WIRING" });
    expect(fixture.execute).toHaveBeenCalledTimes(1);
    expect(fixture.executeLegacyCareerAnalysis).not.toHaveBeenCalled();
    expect(fixture.save).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toMatch(/VFY_|CAP_|PHASE4_VERIFIED/);
  });

  it("owns dedicated kernel configuration, model selection, encryption failure, and provider-level INFERENCE telemetry", async () => {
    const events: RuntimeOperation[] = [];
    const promptRepository = {};
    const capabilityRepository = {};
    const discoveryProvider: CapabilityProvider = { execute: vi.fn(async () => ({ output: "discovery" })) };
    const convergenceProvider: CapabilityProvider = { execute: vi.fn(async () => ({ output: "convergence" })) };
    const bootstrapCapabilityProposalKernels = vi.fn(async () => undefined);
    const createDiscoveryProvider = vi.fn(() => discoveryProvider);
    const createConvergenceProvider = vi.fn(() => convergenceProvider);
    const createActivePromptResolver = vi.fn(() => ({}));
    const createDiscoveryKernelResolver = vi.fn(() => ({}));
    const createConvergenceKernelResolver = vi.fn(() => ({}));
    const runDiscovery = vi.fn(async (
      documents: SourceDocument[],
      configuration: { kernelVersion: string; schemaVersion: string },
      dependencies: { repository: object; provider: CapabilityProvider; kernelResolver: object }
    ) => {
      expect(documents).toBe(sourceDocumentsFromF10A);
      expect(configuration).toEqual({ kernelVersion: "discovery-v1", schemaVersion: "discovery-schema-v1" });
      expect(dependencies.repository).toBe(capabilityRepository);
      await dependencies.provider.execute({});
      return { kind: "DISCOVERY_COMPLETED" as const, run: { runId: "RUN_F10B" } };
    });
    const runConvergence = vi.fn(async (
      discoveryRun: object,
      configuration: { kernelVersion: string; schemaVersion: string; algorithmVersion: string },
      dependencies: { repository: object; provider: CapabilityProvider; kernelResolver: object }
    ) => {
      expect(discoveryRun).toEqual({ runId: "RUN_F10B" });
      expect(configuration).toEqual({
        kernelVersion: "convergence-v1",
        schemaVersion: "convergence-schema-v1",
        algorithmVersion: "algorithm-v1"
      });
      expect(dependencies.repository).toBe(capabilityRepository);
      await dependencies.provider.execute({});
      return { kind: "CONVERGENCE_COMPLETED" as const, run: { convergenceRunId: "CONV_F10B" } };
    });
    const createProposalRuntime = vi.fn((dependencies: {
      discovery: { run(documents: SourceDocument[]): Promise<unknown> };
      convergence: { run(discoveryRun: object): Promise<unknown> };
    }) => ({
      execute: async (documents: DocumentInput[]) => {
        expect(documents).toBe(normalizedDocs);
        const discovery = await dependencies.discovery.run(sourceDocumentsFromF10A) as { run: object };
        await dependencies.convergence.run(discovery.run);
        return proposalState();
      }
    }));

    const executor = await getCapabilityProposalExecutorFactory()({
      environment: {
        GEMINI_MODEL: "gemini-f10b-explicit",
        PROMPT_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString("base64")
      },
      defaultGeminiModel: "gemini-fallback-first",
      promptRepository,
      capabilityRepository,
      bootstrapCapabilityProposalKernels,
      createActivePromptResolver,
      createDiscoveryKernelResolver,
      createConvergenceKernelResolver,
      createDiscoveryProvider,
      createConvergenceProvider,
      runDiscovery,
      runConvergence,
      createProposalRuntime
    });

    await executor.execute(normalizedDocs, async (operation) => {
      events.push(operation);
    });

    expect(bootstrapCapabilityProposalKernels).toHaveBeenCalledWith({
      promptRepository,
      encryptionKeyBase64: Buffer.alloc(32, 1).toString("base64")
    });
    expect(createDiscoveryProvider).toHaveBeenCalledWith("gemini-f10b-explicit");
    expect(createConvergenceProvider).toHaveBeenCalledWith("gemini-f10b-explicit");
    expect(createDiscoveryKernelResolver).toHaveBeenCalledWith(
      expect.any(Object),
      "capability-discovery-v1",
      "discovery-v1",
      Buffer.alloc(32, 1).toString("base64")
    );
    expect(createConvergenceKernelResolver).toHaveBeenCalledWith(
      expect.any(Object),
      "convergence-v1",
      "capability-convergence-v1",
      Buffer.alloc(32, 1).toString("base64")
    );
    expect(discoveryProvider.execute).toHaveBeenCalledTimes(1);
    expect(convergenceProvider.execute).toHaveBeenCalledTimes(1);
    expect(events).toEqual(["INFERENCE", "INFERENCE"]);
  });

  it("uses the first default model when GEMINI_MODEL is absent, rejects missing encryption before providers, and emits no inference for reuse", async () => {
    const createDiscoveryProvider = vi.fn(() => ({ execute: vi.fn() }));
    const createConvergenceProvider = vi.fn(() => ({ execute: vi.fn() }));
    const bootstrapCapabilityProposalKernels = vi.fn(async () => {
      throw new Error("ERR_MISSING_ENCRYPTION_KEY");
    });

    await expect(getCapabilityProposalExecutorFactory()({
      environment: {},
      defaultGeminiModel: "gemini-fallback-first",
      promptRepository: {},
      capabilityRepository: {},
      bootstrapCapabilityProposalKernels,
      createActivePromptResolver: vi.fn(() => ({})),
      createDiscoveryKernelResolver: vi.fn(() => ({})),
      createConvergenceKernelResolver: vi.fn(() => ({})),
      createDiscoveryProvider,
      createConvergenceProvider,
      runDiscovery: vi.fn(),
      runConvergence: vi.fn(),
      createProposalRuntime: vi.fn()
    })).rejects.toThrow("ERR_MISSING_ENCRYPTION_KEY");

    expect(createDiscoveryProvider).not.toHaveBeenCalled();
    expect(createConvergenceProvider).not.toHaveBeenCalled();
  });

  it("uses the first fallback model and emits no INFERENCE for reused proposal artifacts", async () => {
    const events: RuntimeOperation[] = [];
    const discoveryProvider: CapabilityProvider = { execute: vi.fn() };
    const convergenceProvider: CapabilityProvider = { execute: vi.fn() };
    const createDiscoveryProvider = vi.fn(() => discoveryProvider);
    const createConvergenceProvider = vi.fn(() => convergenceProvider);
    const runDiscovery = vi.fn(async () => ({
      kind: "DISCOVERY_RUN_REUSED" as const,
      run: { runId: "RUN_REUSED" }
    }));
    const runConvergence = vi.fn(async () => ({
      kind: "CONVERGENCE_RUN_REUSED" as const,
      run: { convergenceRunId: "CONV_REUSED" }
    }));
    const createProposalRuntime = vi.fn((dependencies: {
      discovery: { run(documents: SourceDocument[]): Promise<unknown> };
      convergence: { run(discoveryRun: object): Promise<unknown> };
    }) => ({
      execute: async (documents: DocumentInput[]) => {
        expect(documents).toBe(normalizedDocs);
        const discovery = await dependencies.discovery.run(sourceDocumentsFromF10A) as { run: object };
        await dependencies.convergence.run(discovery.run);
        return proposalState("REUSED");
      }
    }));

    const executor = await getCapabilityProposalExecutorFactory()({
      environment: { PROMPT_ENCRYPTION_KEY: Buffer.alloc(32, 2).toString("base64") },
      defaultGeminiModel: "gemini-fallback-first",
      promptRepository: {},
      capabilityRepository: {},
      bootstrapCapabilityProposalKernels: vi.fn(async () => undefined),
      createActivePromptResolver: vi.fn(() => ({})),
      createDiscoveryKernelResolver: vi.fn(() => ({})),
      createConvergenceKernelResolver: vi.fn(() => ({})),
      createDiscoveryProvider,
      createConvergenceProvider,
      runDiscovery,
      runConvergence,
      createProposalRuntime
    });

    await executor.execute(normalizedDocs, async (operation) => {
      events.push(operation);
    });

    expect(createDiscoveryProvider).toHaveBeenCalledWith("gemini-fallback-first");
    expect(createConvergenceProvider).toHaveBeenCalledWith("gemini-fallback-first");
    expect(discoveryProvider.execute).not.toHaveBeenCalled();
    expect(convergenceProvider.execute).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it("treats verified snapshot reuse as zero new Capability inference", async () => {
    const events: RuntimeOperation[] = [];
    const discoveryProvider: CapabilityProvider = { execute: vi.fn() };
    const convergenceProvider: CapabilityProvider = { execute: vi.fn() };
    const snapshotReuse: ProposalState = {
      kind: "VERIFIED_SNAPSHOT_REUSED",
      discoveryDisposition: "VERIFIED_SNAPSHOT_REUSED"
    };
    const runDiscovery = vi.fn(async (documents: SourceDocument[]) => {
      expect(documents).toBe(sourceDocumentsFromF10A);
      return {
        kind: "VERIFIED_SNAPSHOT_REUSED" as const,
        snapshot: { snapshotId: "existing-phase-4-snapshot" }
      };
    });
    const runConvergence = vi.fn();
    const createProposalRuntime = vi.fn((dependencies: {
      discovery: { run(documents: SourceDocument[]): Promise<unknown> };
      convergence: { run(discoveryRun: object): Promise<unknown> };
    }) => ({
      execute: async (documents: DocumentInput[]) => {
        expect(documents).toBe(normalizedDocs);
        await dependencies.discovery.run(sourceDocumentsFromF10A);
        return snapshotReuse;
      }
    }));

    const executor = await getCapabilityProposalExecutorFactory()({
      environment: { PROMPT_ENCRYPTION_KEY: Buffer.alloc(32, 3).toString("base64") },
      defaultGeminiModel: "gemini-fallback-first",
      promptRepository: {},
      capabilityRepository: {},
      bootstrapCapabilityProposalKernels: vi.fn(async () => undefined),
      createActivePromptResolver: vi.fn(() => ({})),
      createDiscoveryKernelResolver: vi.fn(() => ({})),
      createConvergenceKernelResolver: vi.fn(() => ({})),
      createDiscoveryProvider: vi.fn(() => discoveryProvider),
      createConvergenceProvider: vi.fn(() => convergenceProvider),
      runDiscovery,
      runConvergence,
      createProposalRuntime
    });

    const result = await executor.execute(normalizedDocs, async (operation) => {
      events.push(operation);
    });

    expect(result).toMatchObject({ kind: "VERIFIED_SNAPSHOT_REUSED" });
    expect(discoveryProvider.execute).not.toHaveBeenCalled();
    expect(runConvergence).not.toHaveBeenCalled();
    expect(convergenceProvider.execute).not.toHaveBeenCalled();
    expect(events).toEqual([]);
    expect(JSON.stringify(result)).not.toMatch(/VFY_|CAP_|PHASE4_VERIFIED/);
  });

  it.each(["", "   "])("uses the default model when GEMINI_MODEL is blank (%j)", async (model) => {
    const createDiscoveryProvider = vi.fn(() => ({ execute: vi.fn() }));
    const createConvergenceProvider = vi.fn(() => ({ execute: vi.fn() }));

    await getCapabilityProposalExecutorFactory()({
      environment: {
        GEMINI_MODEL: model,
        PROMPT_ENCRYPTION_KEY: Buffer.alloc(32, 4).toString("base64")
      },
      defaultGeminiModel: "gemini-fallback-first",
      promptRepository: {},
      capabilityRepository: {},
      bootstrapCapabilityProposalKernels: vi.fn(async () => undefined),
      createActivePromptResolver: vi.fn(() => ({})),
      createDiscoveryKernelResolver: vi.fn(() => ({})),
      createConvergenceKernelResolver: vi.fn(() => ({})),
      createDiscoveryProvider,
      createConvergenceProvider,
      runDiscovery: vi.fn(),
      runConvergence: vi.fn(),
      createProposalRuntime: vi.fn(() => ({ execute: vi.fn() }))
    });

    expect(createDiscoveryProvider).toHaveBeenCalledWith("gemini-fallback-first");
    expect(createConvergenceProvider).toHaveBeenCalledWith("gemini-fallback-first");
  });

  it("keeps the public Career job contract independent from proposal artifacts and the runtime operation vocabulary unchanged", () => {
    const created = createJob("CAREER_ANALYSIS", {
      sourceType: "TEXT",
      sourceData: { documents: [] }
    });

    expect(created.currentOperation).toBeNull();
    expect(created).not.toHaveProperty("discoveryRun");
    expect(created).not.toHaveProperty("convergenceRun");
    expect(created).not.toHaveProperty("capabilityRun");
    for (const operation of [
      "RECOVERY_CHECK",
      "SOURCE_PREPARATION",
      "INFERENCE",
      "ANALYSIS_VALIDATION",
      "PERSISTENCE"
    ]) {
      expect(() => assertCareerJobRuntimeOperation(operation)).not.toThrow();
    }
    expect(() => assertCareerJobRuntimeOperation("CAPABILITY_DISCOVERY")).toThrow(
      "ERR_INVALID_JOB_RUNTIME_OPERATION"
    );
  });
});
