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
  
  const worker = new CareerJobWorker(
    "worker-node-1",
    jobRepo,
    async (job) => {
      console.log(`[Worker] Executing job ${job.jobId}`);
      
      const { normalizedDocs } = await prepareDocuments(job.inputRef.sourceData.documents);
      const validationResult = await executeCareerAnalysisPipeline(normalizedDocs, provider, { explicitAnalysisId: job.jobId.replace("JOB_", "ANL_") });
      
      if (!validationResult.success) {
        throw new Error(validationResult.errors?.map((e: any) => e.message).join(", ") || "Validation failed");
      }
      
      const verifiedAnalysis = validationResult.data as any;
      const resultAnalysisId = verifiedAnalysis.structured_data.analysis.metadata.analysis_id;
      
      // We must save the canonical analysis to DB so the UI can fetch it
      const canonRepo = new PostgresCareerAnalysisRepository(db);
      await canonRepo.save(verifiedAnalysis);
      
      console.log(`[Worker] Job ${job.jobId} succeeded: ${resultAnalysisId}`);
      return { resultAnalysisId };
    },
    2000, // claim interval
    30000 // lease duration
  );
  
  worker.start();
  console.log("Worker started. Polling for jobs...");
}

main().catch(console.error);
