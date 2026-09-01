import {
  CareerJobWorker,
  createCareerAnalysisJobProcessor,
  createCareerCapabilityProposalExecutor
} from "../lib/career/orchestration/worker";
import { JobRepository } from "../lib/career/orchestration/job-repository";
import { executeCareerAnalysisPipeline } from "../lib/career/pipeline";
import { db } from "../lib/career/db/client";
import {
  DEFAULT_GEMINI_MODEL_CASCADE,
  GeminiProvider
} from "../lib/career/providers/gemini";
import { prepareDocuments } from "../lib/career/orchestration/document-loader";
import { PostgresCareerAnalysisRepository } from "../lib/career/repositories/postgres";
import {
  ActivePromptCapabilityConvergenceResolver,
  ActivePromptCapabilityKernelResolver,
  GeminiCapabilityConvergenceProvider,
  GeminiCapabilityDiscoveryProvider,
  PostgresCapabilityCoreRepository,
  PostgresCapabilityProposalProjectionReferenceRepository,
  bootstrapCapabilityProposalKernels,
  createCapabilityProposalRuntime,
  runCapabilityConvergence,
  runCapabilityDiscovery
} from "../lib/career/capability-core";
import { InMemoryPromptRepository } from "../lib/career/prompts/repository";
import { ActivePromptResolver } from "../lib/career/prompts/resolver";
import type { VerifiedCareerAnalysis } from "../lib/career/types";

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("ERR_PROVIDER_CONFIG: Missing GEMINI_API_KEY environment variable. Worker startup aborted.");
    process.exit(1);
  }

  const jobRepo = new JobRepository(db);
  const provider = new GeminiProvider();
  const canonicalAnalysisRepository = new PostgresCareerAnalysisRepository(db);
  const capabilityRepository = new PostgresCapabilityCoreRepository(db);
  const projectionReferenceRepository = new PostgresCapabilityProposalProjectionReferenceRepository(db);
  const promptRepository = new InMemoryPromptRepository();
  const workerId = process.env.CAREER_WORKER_ID || "worker-node-1";
  // Managed proposal kernels are a startup prerequisite. Their encryption key
  // is validated before a worker exists, so invalid configuration cannot claim
  // a job and then fail after polling begins.
  const capabilityProposalExecutor = await createCareerCapabilityProposalExecutor({
    environment: {
      GEMINI_MODEL: process.env.GEMINI_MODEL,
      PROMPT_ENCRYPTION_KEY: process.env.PROMPT_ENCRYPTION_KEY
    },
    defaultGeminiModel: DEFAULT_GEMINI_MODEL_CASCADE[0],
    promptRepository,
    capabilityRepository,
    bootstrapCapabilityProposalKernels,
    createActivePromptResolver: (repository, encryptionKeyBase64) =>
      new ActivePromptResolver(repository, encryptionKeyBase64),
    createDiscoveryKernelResolver: (
      activePromptResolver,
      promptSlug,
      kernelVersion,
      encryptionKeyBase64
    ) =>
      new ActivePromptCapabilityKernelResolver(
        activePromptResolver,
        promptSlug,
        kernelVersion,
        encryptionKeyBase64
      ),
    createConvergenceKernelResolver: (
      activePromptResolver,
      kernelVersion,
      promptSlug,
      encryptionKeyBase64
    ) =>
      new ActivePromptCapabilityConvergenceResolver(
        activePromptResolver,
        kernelVersion,
        promptSlug,
        encryptionKeyBase64
      ),
    createDiscoveryProvider: (model) =>
      new GeminiCapabilityDiscoveryProvider({ model }),
    createConvergenceProvider: (model) =>
      new GeminiCapabilityConvergenceProvider({ model }),
    runDiscovery: runCapabilityDiscovery,
    runConvergence: runCapabilityConvergence,
    createProposalRuntime: createCapabilityProposalRuntime
  });

  const processJob = createCareerAnalysisJobProcessor({
    canonicalAnalysisRepository: {
      load: (analysisId) => canonicalAnalysisRepository.load(analysisId),
      save: (analysis) =>
        canonicalAnalysisRepository.save(analysis as VerifiedCareerAnalysis)
    },
    prepareDocuments,
    capabilityProposalExecutor,
    projectionReferenceRepository,
    async executeLegacyCareerAnalysis(documents, reportOperation, explicitAnalysisId) {
      const validationResult = await executeCareerAnalysisPipeline(documents, provider, {
        explicitAnalysisId,
        onRuntimeOperation: reportOperation
      });

      if (!validationResult.success || !validationResult.data) {
        throw new Error(
          validationResult.issues.map((issue) => issue.message).join(", ") ||
            "Validation failed"
        );
      }

      const analysis = validationResult.data as unknown as VerifiedCareerAnalysis;
      return {
        resultAnalysisId: analysis.structured_data.analysis.metadata.analysis_id,
        analysis
      };
    }
  });

  const worker = new CareerJobWorker(
    workerId,
    jobRepo,
    processJob,
    2000, // claim interval
    30000 // lease duration
  );

  worker.start();
  console.log(`Career worker PID: ${process.pid}`);
  console.log(`Career worker started: ${workerId}`);
  console.log("Worker started. Polling for jobs...");
}

main().catch((error) => {
  console.error(error);
  // A caught startup rejection would otherwise leave no failing process status.
  // Preserve a non-zero result so startup failure is visible to the supervisor
  // and cannot look like a healthy worker startup.
  process.exitCode = 1;
});
