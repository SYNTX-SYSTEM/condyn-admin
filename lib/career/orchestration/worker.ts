import { JobRepository } from "./job-repository";

export class CareerJobWorker {
  private isRunning: boolean = false;
  private currentTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly workerId: string,
    private readonly jobRepo: JobRepository,
    // Dependency inject the actual pipeline here later
    private readonly processJob: (job: any) => Promise<{ resultAnalysisId: string }>,
    private readonly pollIntervalMs: number = 2000,
    private readonly leaseDurationMs: number = 30000
  ) {}

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.loop();
  }

  stop() {
    this.isRunning = false;
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
    }
  }

  private async loop() {
    if (!this.isRunning) return;

    try {
      const job = await this.jobRepo.claimNextJob(this.workerId, this.leaseDurationMs);
      
      if (job) {
        console.log(`[Worker ${this.workerId}] CLAIMED ${job.jobId} lease=${job.leaseVersion}`);
        // We have a job! Start a heartbeat interval
        const heartbeatInterval = setInterval(() => {
          this.jobRepo.heartbeatJob(job.jobId, this.workerId, job.leaseVersion, this.leaseDurationMs)
            .catch(err => {
              // If heartbeat fails (e.g. lost lease), we should ideally cancel execution
              console.error(`[Worker ${this.workerId}] Heartbeat failed for ${job.jobId}:`, err);
            });
        }, this.leaseDurationMs / 2);

        try {
          // Execute the actual pipeline
          const { resultAnalysisId } = await this.processJob(job);
          
          // Complete the job with the verified canonical analysis
          await this.jobRepo.updateJobState(job.jobId, this.workerId, job.leaseVersion, "RUNNING", "SUCCEEDED", { resultAnalysisId });
        } catch (error: any) {
          // Determine if error is terminal. For now, assume retryable for general errors.
          const isTerminal = error?.name === "TERMINAL_ERROR";
          const errorCode = error?.code || "EXECUTION_FAILED";
          const errorSummary = error?.message || "Unknown error";
          
          await this.jobRepo.failJob(job.jobId, this.workerId, job.leaseVersion, isTerminal, errorCode, errorSummary);
        } finally {
          clearInterval(heartbeatInterval);
        }
      }
    } catch (err) {
      console.error(`[Worker ${this.workerId}] Error in worker loop:`, err);
    }

    if (this.isRunning) {
      this.currentTimeout = setTimeout(() => this.loop(), this.pollIntervalMs);
    }
  }
}
