import type { DocumentInput } from "../adapter";
import type { CapabilityCoreRepository } from "../capability-core";
import type {
  CapabilityConvergenceKernelResolver,
  CapabilityConvergenceProvider,
  CapabilityConvergenceRuntimeResult
} from "../capability-core/convergence";
import type {
  CapabilityDiscoveryConfiguration,
  CapabilityKernelResolver,
  CapabilityDiscoveryProvider,
  CapabilityDiscoveryRuntimeResult
} from "../capability-core/discovery";
import type {
  CapabilityProposalRuntime,
  CapabilityProposalRuntimeResult,
  CapabilityProposalKernelResolver
} from "../capability-core/runtime";
import type { PromptRepository } from "../prompts/repository";
import type { ActivePromptResolver } from "../prompts/resolver";
import type { ReportCareerJobRuntimeOperation } from "./career-analysis-job-processor";

const discoveryConfiguration = {
  kernelVersion: "discovery-v1",
  schemaVersion: "discovery-schema-v1"
} as const satisfies CapabilityDiscoveryConfiguration;

const convergenceConfiguration = {
  kernelVersion: "convergence-v1",
  schemaVersion: "convergence-schema-v1",
  algorithmVersion: "algorithm-v1"
} as const;

export interface CareerCapabilityProposalExecutorDependencies {
  environment: { GEMINI_MODEL?: string; PROMPT_ENCRYPTION_KEY?: string };
  defaultGeminiModel: string;
  promptRepository: PromptRepository;
  capabilityRepository: CapabilityCoreRepository;
  bootstrapCapabilityProposalKernels(input: {
    promptRepository: PromptRepository;
    encryptionKeyBase64: string;
  }): Promise<void>;
  createActivePromptResolver(
    promptRepository: PromptRepository,
    encryptionKeyBase64: string
  ): ActivePromptResolver;
  createDiscoveryKernelResolver(
    activePromptResolver: ActivePromptResolver,
    promptSlug: string,
    kernelVersion: string,
    encryptionKeyBase64: string
  ): CapabilityKernelResolver;
  createConvergenceKernelResolver(
    activePromptResolver: ActivePromptResolver,
    kernelVersion: string,
    promptSlug: string,
    encryptionKeyBase64: string
  ): CapabilityConvergenceKernelResolver;
  createDiscoveryProvider(model: string): CapabilityDiscoveryProvider;
  createConvergenceProvider(model: string): CapabilityConvergenceProvider;
  runDiscovery: (
    documents: import("../capability-core").SourceDocument[],
    configuration: CapabilityDiscoveryConfiguration,
    dependencies: {
      repository: CapabilityCoreRepository;
      provider: CapabilityDiscoveryProvider;
      kernelResolver: CapabilityKernelResolver;
    }
  ) => Promise<CapabilityDiscoveryRuntimeResult>;
  runConvergence: (
    discoveryRun: import("../capability-core").CapabilityDiscoveryRun,
    configuration: typeof convergenceConfiguration,
    dependencies: {
      repository: CapabilityCoreRepository;
      provider: CapabilityConvergenceProvider;
      kernelResolver: CapabilityConvergenceKernelResolver;
    }
  ) => Promise<CapabilityConvergenceRuntimeResult>;
  createProposalRuntime(dependencies: {
    repository: CapabilityCoreRepository;
    discovery: {
      kernelResolver: CapabilityProposalKernelResolver;
      run(
        documents: import("../capability-core").SourceDocument[],
        dependencies: {
          repository: CapabilityCoreRepository;
          kernelResolver: CapabilityProposalKernelResolver;
        }
      ): Promise<CapabilityDiscoveryRuntimeResult>;
    };
    convergence: {
      kernelResolver: CapabilityProposalKernelResolver;
      run(
        discoveryRun: object,
        dependencies: {
          repository: CapabilityCoreRepository;
          kernelResolver: CapabilityProposalKernelResolver;
        }
      ): Promise<CapabilityConvergenceRuntimeResult>;
    };
  }): CapabilityProposalRuntime;
}

export interface CareerCapabilityProposalExecutor {
  execute(
    documents: DocumentInput[],
    reportOperation: ReportCareerJobRuntimeOperation
  ): Promise<CapabilityProposalRuntimeResult>;
}

function selectedCapabilityModel(
  environment: CareerCapabilityProposalExecutorDependencies["environment"],
  defaultGeminiModel: string
): string {
  return environment.GEMINI_MODEL?.trim()
    ? environment.GEMINI_MODEL
    : defaultGeminiModel;
}

function telemetryDiscoveryProvider(
  provider: CapabilityDiscoveryProvider,
  reportOperation: ReportCareerJobRuntimeOperation
): CapabilityDiscoveryProvider {
  return {
    providerName: provider.providerName,
    model: provider.model,
    async execute(request) {
      await reportOperation("INFERENCE");
      return provider.execute(request);
    }
  };
}

function telemetryConvergenceProvider(
  provider: CapabilityConvergenceProvider,
  reportOperation: ReportCareerJobRuntimeOperation
): CapabilityConvergenceProvider {
  return {
    providerName: provider.providerName,
    model: provider.model,
    async execute(request) {
      await reportOperation("INFERENCE");
      return provider.execute(request);
    }
  };
}

/**
 * Concrete F10B composition around the sealed F10A runtime. Provider telemetry
 * is emitted only from wrapped execute calls, so reuse paths do not invent
 * inference activity.
 */
export async function createCareerCapabilityProposalExecutor(
  dependencies: CareerCapabilityProposalExecutorDependencies
): Promise<CareerCapabilityProposalExecutor> {
  const encryptionKeyBase64 = dependencies.environment.PROMPT_ENCRYPTION_KEY ?? "";
  await dependencies.bootstrapCapabilityProposalKernels({
    promptRepository: dependencies.promptRepository,
    encryptionKeyBase64
  });

  const model = selectedCapabilityModel(dependencies.environment, dependencies.defaultGeminiModel);
  const activePromptResolver = dependencies.createActivePromptResolver(
    dependencies.promptRepository,
    encryptionKeyBase64
  );
  const discoveryKernelResolver = dependencies.createDiscoveryKernelResolver(
    activePromptResolver,
    "capability-discovery-v1",
    discoveryConfiguration.kernelVersion,
    encryptionKeyBase64
  );
  const convergenceKernelResolver = dependencies.createConvergenceKernelResolver(
    activePromptResolver,
    convergenceConfiguration.kernelVersion,
    "capability-convergence-v1",
    encryptionKeyBase64
  );
  const discoveryProvider = dependencies.createDiscoveryProvider(model);
  const convergenceProvider = dependencies.createConvergenceProvider(model);

  return {
    async execute(documents, reportOperation) {
      const runtime = dependencies.createProposalRuntime({
        repository: dependencies.capabilityRepository,
        discovery: {
          kernelResolver: discoveryKernelResolver,
          run: (sourceDocuments, runtimeDependencies = {
            repository: dependencies.capabilityRepository,
            kernelResolver: discoveryKernelResolver
          }) =>
            dependencies.runDiscovery(sourceDocuments, discoveryConfiguration, {
              repository: runtimeDependencies.repository,
              kernelResolver: runtimeDependencies.kernelResolver,
              provider: telemetryDiscoveryProvider(discoveryProvider, reportOperation)
            })
        },
        convergence: {
          kernelResolver: convergenceKernelResolver,
          run: (discoveryRun, runtimeDependencies = {
            repository: dependencies.capabilityRepository,
            kernelResolver: convergenceKernelResolver
          }) =>
            dependencies.runConvergence(
              discoveryRun as import("../capability-core").CapabilityDiscoveryRun,
              convergenceConfiguration,
              {
                repository: runtimeDependencies.repository,
                kernelResolver: runtimeDependencies.kernelResolver as CapabilityConvergenceKernelResolver,
                provider: telemetryConvergenceProvider(convergenceProvider, reportOperation)
              }
            )
        }
      });

      return runtime.execute(documents);
    }
  };
}
