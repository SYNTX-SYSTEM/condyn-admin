export type JobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
export type JobType = "CAREER_ANALYSIS";

export interface JobInputRef {
  sourceType: "TEXT" | "PDF" | "GITHUB" | "WEBSITE" | "BATCH" | "MULTI";
  sourceData: string | any; // The text content, URL, or base64 PDF bytes depending on sourceType. A durable snapshot.
}

export interface JobRecord {
  jobId: string;
  jobType: JobType;
  status: JobStatus;
  idempotencyKey?: string | null;
  inputRef: JobInputRef;
  
  attemptCount: number;
  
  resultAnalysisId?: string | null;
  errorCode?: string | null;
  errorSummary?: string | null;

  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;

  leaseOwner?: string | null;
  leaseExpiresAt?: string | null;
  leaseVersion: number;
  heartbeatAt?: string | null;
}

export function createJob(
  jobType: JobType,
  inputRef: JobInputRef,
  idempotencyKey?: string
): JobRecord {
  return {
    jobId: `JOB_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    jobType,
    status: "PENDING",
    idempotencyKey: idempotencyKey || null,
    inputRef,
    attemptCount: 0,
    createdAt: new Date().toISOString(),
    leaseVersion: 0
  };
}
