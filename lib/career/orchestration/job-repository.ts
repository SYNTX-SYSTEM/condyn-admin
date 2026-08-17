import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq, lt, or, and, sql } from "drizzle-orm";
import { careerAnalysisJobs, careerAnalyses } from "../db/schema";
import { JobRecord, JobStatus } from "./job";

export class JobRepository {
  constructor(private readonly db: PostgresJsDatabase<any>) {}

  async enqueueJob(job: JobRecord): Promise<JobRecord> {
    try {
      await this.db.insert(careerAnalysisJobs).values({
        jobId: job.jobId,
        jobType: job.jobType,
        status: job.status,
        idempotencyKey: job.idempotencyKey || null,
        inputRef: job.inputRef,
        attemptCount: job.attemptCount,
        resultAnalysisId: job.resultAnalysisId || null,
        errorCode: job.errorCode || null,
        errorSummary: job.errorSummary || null,
        createdAt: job.createdAt,
        startedAt: job.startedAt || null,
        completedAt: job.completedAt || null,
        leaseOwner: job.leaseOwner || null,
        leaseExpiresAt: job.leaseExpiresAt || null,
        leaseVersion: job.leaseVersion,
        heartbeatAt: job.heartbeatAt || null
      });
      return job;
    } catch (e: any) {
      const errCause = e.cause || e;
      if (errCause.code === '23505') {
        if (job.idempotencyKey) {
          const existing = await this.getJobByIdempotencyKey(job.idempotencyKey);
          if (existing) {
            const existingInput = existing.inputRef as any;
            const currentInput = job.inputRef as any;
            
            // Deep compare JSON for idempotency payload checking
            if (existingInput.sourceType === currentInput.sourceType && 
                JSON.stringify(existingInput.sourceData) === JSON.stringify(currentInput.sourceData)) {
              return existing; // Idempotent success returns existing job
            }
          }
        }
        throw new Error("ERR_JOB_IDEMPOTENCY_CONFLICT");
      }
      throw e;
    }
  }

  private mapRow(row: any): JobRecord {
    return {
      jobId: row.jobId,
      jobType: row.jobType as any,
      status: row.status as JobStatus,
      idempotencyKey: row.idempotencyKey,
      inputRef: row.inputRef as any,
      attemptCount: row.attemptCount,
      resultAnalysisId: row.resultAnalysisId,
      errorCode: row.errorCode,
      errorSummary: row.errorSummary,
      createdAt: row.createdAt,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      leaseOwner: row.leaseOwner,
      leaseExpiresAt: row.leaseExpiresAt,
      leaseVersion: row.leaseVersion,
      heartbeatAt: row.heartbeatAt
    };
  }

  async getJob(jobId: string): Promise<JobRecord | null> {
    const rows = await this.db.select().from(careerAnalysisJobs).where(eq(careerAnalysisJobs.jobId, jobId));
    if (!rows || rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async getJobByIdempotencyKey(key: string): Promise<JobRecord | null> {
    const rows = await this.db.select().from(careerAnalysisJobs).where(eq(careerAnalysisJobs.idempotencyKey, key));
    if (!rows || rows.length === 0) return null;
    return this.mapRow(rows[0]);
  }

  async claimNextJob(workerId: string, durationMs: number): Promise<JobRecord | null> {
    const nowISO = new Date().toISOString();
    const expiresISO = new Date(Date.now() + durationMs).toISOString();

    const result = await this.db.execute(sql`
      UPDATE career_analysis_jobs
      SET
        status = 'RUNNING',
        lease_owner = ${workerId},
        lease_expires_at = ${expiresISO},
        lease_version = lease_version + 1,
        attempt_count = attempt_count + 1,
        started_at = ${nowISO},
        heartbeat_at = ${nowISO}
      WHERE job_id = (
        SELECT job_id
        FROM career_analysis_jobs
        WHERE status = 'PENDING' OR (status = 'RUNNING' AND lease_expires_at < ${nowISO})
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      RETURNING *;
    `);

    if (!result || result.length === 0) return null;
    // Because result rows use snake_case we must manually map them, or use drizzle syntax.
    // Drizzle doesn't support complex UPDATE ... RETURNING easily with SKIP LOCKED out of the box,
    // so we map the raw snake_case result:
    const row = result[0] as any;
    return {
      jobId: row.job_id,
      jobType: row.job_type as any,
      status: row.status as JobStatus,
      idempotencyKey: row.idempotency_key,
      inputRef: row.input_ref as any,
      attemptCount: row.attempt_count,
      resultAnalysisId: row.result_analysis_id,
      errorCode: row.error_code,
      errorSummary: row.error_summary,
      createdAt: row.created_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      leaseOwner: row.lease_owner,
      leaseExpiresAt: row.lease_expires_at,
      leaseVersion: row.lease_version,
      heartbeatAt: row.heartbeat_at
    };
  }

  async heartbeatJob(jobId: string, workerId: string, leaseVersion: number, durationMs: number): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) throw new Error("ERR_JOB_NOT_FOUND");
    
    if (job.status !== "RUNNING") throw new Error("ERR_JOB_NOT_RUNNING");
    if (job.leaseOwner !== workerId || job.leaseVersion !== leaseVersion) {
      throw new Error("ERR_STALE_JOB_LEASE");
    }

    const nowISO = new Date().toISOString();
    const expiresISO = new Date(Date.now() + durationMs).toISOString();

    const result = await this.db.update(careerAnalysisJobs)
      .set({
        leaseExpiresAt: expiresISO,
        heartbeatAt: nowISO
      })
      .where(and(
        eq(careerAnalysisJobs.jobId, jobId),
        eq(careerAnalysisJobs.leaseVersion, leaseVersion)
      ));

    // If no rows were updated, someone else stole the lease in between
    // (though theoretically impossible if leaseVersion is identical and we checked above).
  }

  async updateJobState(
    jobId: string,
    workerId: string,
    leaseVersion: number,
    fromStatus: JobStatus,
    toStatus: JobStatus,
    updates: Partial<JobRecord>
  ): Promise<void> {
    if (fromStatus === "SUCCEEDED" && toStatus === "RUNNING") {
      throw new Error("ERR_INVALID_JOB_TRANSITION: Cannot transition from SUCCEEDED to RUNNING");
    }

    if (toStatus === "SUCCEEDED" && !updates.resultAnalysisId) {
      throw new Error("ERR_INVALID_JOB_TRANSITION: Cannot mark SUCCEEDED without resultAnalysisId");
    }

    await this.db.transaction(async (tx) => {
      // 1. Enforce lease fencing token
      const current = await tx.select().from(careerAnalysisJobs).where(eq(careerAnalysisJobs.jobId, jobId));
      if (!current || current.length === 0) throw new Error("ERR_JOB_NOT_FOUND");
      
      const row = current[0];
      if (row.leaseVersion !== leaseVersion || row.leaseOwner !== workerId) {
        throw new Error("ERR_STALE_JOB_LEASE");
      }

      // 2. Verify canonical analysis existence if transitioning to SUCCEEDED
      if (toStatus === "SUCCEEDED" && updates.resultAnalysisId) {
        const check = await tx.select().from(careerAnalyses).where(eq(careerAnalyses.analysisId, updates.resultAnalysisId));
        if (!check || check.length === 0) {
          throw new Error("ERR_INVALID_JOB_TRANSITION: Result Analysis does not exist in canonical storage");
        }
      }

      // 3. Perform state transition
      await tx.update(careerAnalysisJobs)
        .set({
          status: toStatus,
          resultAnalysisId: updates.resultAnalysisId || null,
          errorCode: updates.errorCode || null,
          errorSummary: updates.errorSummary || null,
          startedAt: updates.startedAt || row.startedAt,
          completedAt: updates.completedAt || row.completedAt
        })
        .where(and(
          eq(careerAnalysisJobs.jobId, jobId),
          eq(careerAnalysisJobs.leaseVersion, leaseVersion)
        ));
    });
  }

  async failJob(
    jobId: string, 
    workerId: string, 
    leaseVersion: number, 
    isTerminal: boolean, 
    errorCode: string, 
    errorSummary: string,
    maxAttempts: number = 3
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      const current = await tx.select().from(careerAnalysisJobs).where(eq(careerAnalysisJobs.jobId, jobId));
      if (!current || current.length === 0) throw new Error("ERR_JOB_NOT_FOUND");
      
      const row = current[0];
      if (row.leaseVersion !== leaseVersion || row.leaseOwner !== workerId) {
        throw new Error("ERR_STALE_JOB_LEASE");
      }

      if (isTerminal || row.attemptCount >= maxAttempts) {
        // Mark failed permanently
        await tx.update(careerAnalysisJobs)
          .set({
            status: "FAILED",
            errorCode,
            errorSummary,
            completedAt: new Date().toISOString()
          })
          .where(and(
            eq(careerAnalysisJobs.jobId, jobId),
            eq(careerAnalysisJobs.leaseVersion, leaseVersion)
          ));
      } else {
        // Release lease for retry by setting lease_expires_at to past/null or just status to PENDING
        // Actually PENDING makes it instantly eligible
        await tx.update(careerAnalysisJobs)
          .set({
            status: "PENDING",
            errorCode,
            errorSummary,
            leaseOwner: null,
            leaseExpiresAt: null
          })
          .where(and(
            eq(careerAnalysisJobs.jobId, jobId),
            eq(careerAnalysisJobs.leaseVersion, leaseVersion)
          ));
      }
    });
  }
}
