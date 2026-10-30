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
  PostgresCandidateSourceBundleRepository,
  PostgresCapabilityProposalProjectionReferenceRepository,
  bootstrapCapabilityProposalKernels,
  createCapabilityProposalRuntime,
  runCapabilityConvergence,
  runCapabilityDiscovery
} from "../lib/career/capability-core";
import { InMemoryPromptRepository } from "../lib/career/prompts/repository";
import { ActivePromptResolver } from "../lib/career/prompts/resolver";
import type { VerifiedCareerAnalysis } from "../lib/career/types";
import { requireValidJobScope } from "../lib/career/job-scope";
import { isIssuedPersonInvestigation, requireActiveAnalysisBoundary } from "../lib/career/investigation";
import { createLocalJobScopeResolver } from "../lib/career/job-scope/local-resolver";
import { providerExchangeArchiveFromEnvironment } from "../lib/career/result-inspector/postgres-exchange-store";
import { runWithExchangeAttempt } from "../lib/career/result-inspector/attempt";
import { createAutoMatchHook } from "../lib/career/job-pool/auto-match-hook";

/** The legacy pipeline names the same issued boundary as the capability sweep. */
const pipelineBoundary = (boundary: ReturnType<typeof requireActiveAnalysisBoundary>) =>
  isIssuedPersonInvestigation(boundary) ? { investigation: boundary } : { jobScope: boundary };

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("ERR_PROVIDER_CONFIG: Missing GEMINI_API_KEY environment variable. Worker startup aborted.");
    process.exit(1);
  }

  const jobRepo = new JobRepository(db);
  const provider = new GeminiProvider();
  const canonicalAnalysisRepository = new PostgresCareerAnalysisRepository(db);
  const capabilityRepository = new PostgresCapabilityCoreRepository(db);
  const candidateSourceBundles = new PostgresCandidateSourceBundleRepository(db);
  // The worker owns durable sidecar provenance, but the Career job result
  // remains the canonical analysis id rather than a proposal artifact id.
  const projectionReferenceRepository = new PostgresCapabilityProposalProjectionReferenceRepository(db);
  const promptRepository = new InMemoryPromptRepository();
  const workerId = process.env.CAREER_WORKER_ID || "worker-node-1";
  // Managed proposal kernels are a startup prerequisite. Their encryption key
  // is validated before a worker exists, so invalid configuration cannot claim
  // a job and then fail after polling begins.
  // Result Inspector: bounded archive of the received Discovery exchange (opt-in, disposable databases only).
  const providerExchangeArchive = await providerExchangeArchiveFromEnvironment();
  const capabilityProposalExecutor = await createCareerCapabilityProposalExecutor({
    environment: {
      GEMINI_MODEL: process.env.GEMINI_MODEL,
      PROMPT_ENCRYPTION_KEY: process.env.PROMPT_ENCRYPTION_KEY
    },
    defaultGeminiModel: DEFAULT_GEMINI_MODEL_CASCADE[0],
    promptRepository,
    capabilityRepository,
    ...(providerExchangeArchive ? { providerExchangeArchive } : {}),
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
    // No analysis without an explicit investigation boundary: the capability sweep reaches Gemini only inside the
    // issued boundary of the claimed job (its validated job scope, or an issued PERSON investigation).
    createDiscoveryProvider: (model) => {
      const provider = new GeminiCapabilityDiscoveryProvider({ model });
      return { providerName: provider.providerName, model: provider.model, execute: (request) => { requireActiveAnalysisBoundary(); return provider.execute(request); } };
    },
    createConvergenceProvider: (model) => {
      const provider = new GeminiCapabilityConvergenceProvider({ model });
      return { providerName: provider.providerName, model: provider.model, execute: (request) => { requireActiveAnalysisBoundary(); return provider.execute(request); } };
    },
    runDiscovery: runCapabilityDiscovery,
    runConvergence: runCapabilityConvergence,
    createProposalRuntime: createCapabilityProposalRuntime
  });

  // SFE: every claimed job is validated before any work — its declared investigation boundary, and for PERSON_X_JOB
  // its job scope against the stored Job Pool (JOB POOL FIRST).
  const processJob = requireValidJobScope(createLocalJobScopeResolver(), createCareerAnalysisJobProcessor({
    canonicalAnalysisRepository: {
      load: (analysisId) => canonicalAnalysisRepository.load(analysisId),
      save: (analysis) =>
        canonicalAnalysisRepository.save(analysis as VerifiedCareerAnalysis)
    },
    prepareDocuments,
    capabilityProposalExecutor,
    candidateSourceBundles,
    projectionReferenceRepository,
    async executeLegacyCareerAnalysis(documents, reportOperation, explicitAnalysisId) {
      const validationResult = await executeCareerAnalysisPipeline(documents, provider, {
        ...pipelineBoundary(requireActiveAnalysisBoundary()),
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
  }));

  // Result Inspector: with the archive on, every exchange of an attempt is attributed to that job and lease.
  const processAttempt: typeof processJob = providerExchangeArchive
    ? (job, reportOperation) => runWithExchangeAttempt({ jobId: job.jobId, leaseVersion: job.leaseVersion ?? null }, () => processJob(job, reportOperation))
    : processJob;
  const worker = new CareerJobWorker(
    workerId,
    jobRepo,
    processAttempt,
    2000, // claim interval
    30000, // lease duration
    // The automatic match of the product path: after a succeeded analysis the capabilities are related to the ACTIVE job pools. Without a
    // READY semantic configuration and a call budget it does nothing; it never changes the job result and never throws into the loop.
    createAutoMatchHook(workerId)
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
