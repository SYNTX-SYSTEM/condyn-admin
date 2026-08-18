import { CareerJobWorker } from "../lib/career/orchestration/worker";
import { JobRepository } from "../lib/career/orchestration/job-repository";
import { executeCareerAnalysisPipeline } from "../lib/career/pipeline";
import { db } from "../lib/career/db/client";
import { GeminiProvider } from "../lib/career/providers/gemini";
import { prepareDocuments } from "../lib/career/orchestration/document-loader";
import { PostgresCareerAnalysisRepository } from "../lib/career/repositories/postgres";

async function main() {
  const jobRepo = new JobRepository(db);
  const provider = new GeminiProvider();
  
  const workerId = process.env.CAREER_WORKER_ID || "worker-node-1";
  
  const worker = new CareerJobWorker(
    workerId,
    jobRepo,
    async (job) => {
      console.log(`[Worker ${workerId}] Executing job ${job.jobId}`);
      
      const canonRepo = new PostgresCareerAnalysisRepository(db);
      const deterministicAnalysisId = job.jobId.replace("JOB_", "ANL_");
      
      const existing = await canonRepo.load(deterministicAnalysisId);
      if (existing) {
        console.log(`[Worker ${workerId}] Canonical analysis ${deterministicAnalysisId} already exists. Skipping pipeline execution.`);
        return { resultAnalysisId: deterministicAnalysisId };
      }

      const { normalizedDocs } = await prepareDocuments(job.inputRef.sourceData.documents);
      const validationResult = await executeCareerAnalysisPipeline(normalizedDocs, provider, { explicitAnalysisId: job.jobId.replace("JOB_", "ANL_") });
      
      if (!validationResult.success) {
        throw new Error(validationResult.errors?.map((e: any) => e.message).join(", ") || "Validation failed");
      }
      
      const verifiedAnalysis = validationResult.data as any;
      const resultAnalysisId = verifiedAnalysis.structured_data.analysis.metadata.analysis_id;
      
      // We must save the canonical analysis to DB so the UI can fetch it
      await canonRepo.save(verifiedAnalysis);
      
      console.log(`[Worker ${workerId}] Job ${job.jobId} succeeded: ${resultAnalysisId}`);
      return { resultAnalysisId };
    },
    2000, // claim interval
    30000 // lease duration
  );
  
  if (!process.env.GEMINI_API_KEY) {
    console.error("ERR_PROVIDER_CONFIG: Missing GEMINI_API_KEY environment variable. Worker startup aborted.");
    process.exit(1);
  }

  worker.start();
  console.log(`Career worker PID: ${process.pid}`);
  console.log(`Career worker started: ${workerId}`);
  console.log("Worker started. Polling for jobs...");
}

main().catch(console.error);
