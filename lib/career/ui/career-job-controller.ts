import type { CareerJobRuntimeOperation } from "../orchestration/job";
import { JOB_SCOPE_REQUIRED_CODE, isJobScopeErrorCode, parseJobScope } from "../job-pool/job-scope";

export type JobLifecycleState = "IDLE" | "SUBMITTING" | "PENDING" | "RUNNING" | "LOADING_RESULT" | "SUCCEEDED" | "FAILED";

export interface JobState {
  state: JobLifecycleState;
  activeJobId: string | null;
  resultAnalysisId: string | null;
  canonicalAnalysis: any | null;
  currentOperation: CareerJobRuntimeOperation | null;
  attemptCount: number | null;
  /** The backend's code (issues[0].code, or the worker's errorCode); `HTTP_<status>` only when the body names none. */
  errorCode: string | null;
  errorSummary: string | null;
  /** HTTP status of a rejected submission or job read; null for worker failures, network errors and the local scope guard. */
  httpStatus: number | null;
}

export class CareerJobController {
  private state: JobState = {
    state: "IDLE",
    activeJobId: null,
    resultAnalysisId: null,
    canonicalAnalysis: null,
    currentOperation: null,
    attemptCount: null,
    errorCode: null,
    errorSummary: null,
    httpStatus: null,
  };
  
  private currentIdempotencyKey: string | null = null;
  private pollIntervalId: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<() => void> = new Set();
  
  private fetchFn: typeof fetch;
  
  constructor(fetchFn?: typeof fetch) {
    this.fetchFn = fetchFn || (typeof window !== 'undefined' ? window.fetch.bind(window) : global.fetch.bind(global));
  }

  public getState() {
    return this.state;
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  private updateState(partial: Partial<JobState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /** Resolves to the refusal code when the payload carries no formally valid `jobScope` (nothing is sent). */
  public async submitAnalysis(payload: any): Promise<typeof JOB_SCOPE_REQUIRED_CODE | void> {
    if (this.state.state === "SUBMITTING" || this.state.state === "PENDING" || this.state.state === "RUNNING") {
      return; // prevent double submit
    }

    // SFE job-scope invariant: no submission (and so no Gemini call) without a formally valid job scope. The refusal
    // leaves the state untouched (a previous result stays readable); the caller shows JOB_SCOPE_REQUIRED_MESSAGE.
    const jobScope = parseJobScope(payload?.jobScope);
    if (jobScope === null) return JOB_SCOPE_REQUIRED_CODE;

    this.currentIdempotencyKey = crypto.randomUUID();
    
    this.updateState({
      state: "SUBMITTING",
      activeJobId: null,
      resultAnalysisId: null,
      canonicalAnalysis: null,
      currentOperation: null,
      attemptCount: null,
      errorCode: null,
      errorSummary: null,
      httpStatus: null
    });

    try {
      const res = await this.fetchFn("/api/career/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": this.currentIdempotencyKey
        },
        body: JSON.stringify({ ...payload, jobScope })
      });

      if (res.status === 202) {
        const data = await res.json();
        this.updateState({
          activeJobId: data.jobId,
          state: "PENDING"
        });
        this.startPolling(data.jobId);
      } else {
        const err = await res.json().catch(() => null);
        const issue = err !== null && typeof err === "object" && Array.isArray(err.issues) ? err.issues[0] : null;
        this.updateState({
          state: "FAILED",
          errorCode: typeof issue?.code === "string" && issue.code.length > 0 ? issue.code : "HTTP_" + res.status,
          errorSummary: typeof issue?.message === "string" && issue.message.length > 0 ? issue.message : "Submission failed",
          httpStatus: res.status
        });
      }
    } catch (e: any) {
      this.updateState({
        state: "FAILED",
        errorCode: "NETWORK_ERROR",
        errorSummary: e.message,
        httpStatus: null
      });
    }
  }

  public retryActiveJob() {
    const httpStatus = this.state.httpStatus;
    const clientRejection = httpStatus !== null && httpStatus >= 400 && httpStatus < 500;
    // A missing or invalid job scope is terminal (no retry, no Gemini call); a new submission needs a valid scope.
    if (this.state.activeJobId && this.state.state === "FAILED" && !clientRejection && !isJobScopeErrorCode(this.state.errorCode)) {
      // Retry polling or result fetch if there was a transport error
      if (this.state.resultAnalysisId) {
        this.fetchCanonicalResult(this.state.resultAnalysisId, this.state.activeJobId);
      } else {
        this.startPolling(this.state.activeJobId);
      }
    }
  }

  private startPolling(jobId: string) {
    this.stopPolling();
    this.pollJob(jobId);
    this.pollIntervalId = setInterval(() => this.pollJob(jobId), 2000);
  }

  private stopPolling() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
  }

  private async pollJob(jobId: string) {
    if (this.state.activeJobId !== jobId) {
      this.stopPolling();
      return; // Stale protection
    }

    try {
      const res = await this.fetchFn(`/api/career/jobs/${jobId}`);
      if (this.state.activeJobId !== jobId) return; // Stale protection check again

      if (res.status === 200) {
        const data = await res.json();
        if (data.status === "PENDING" || data.status === "RUNNING") {
          this.updateState({
            state: data.status,
            currentOperation: data.currentOperation,
            attemptCount: data.attemptCount
          });
        } else if (data.status === "SUCCEEDED") {
          this.stopPolling();
          this.updateState({ state: "SUCCEEDED", resultAnalysisId: data.resultAnalysisId });
          this.fetchCanonicalResult(data.resultAnalysisId, jobId);
        } else if (data.status === "FAILED") {
          this.stopPolling();
          this.updateState({
            state: "FAILED",
            errorCode: data.errorCode,
            errorSummary: data.errorSummary,
            httpStatus: null
          });
        }
      } else {
        // Stop polling on 4xx/5xx for now, or just retry if 5xx
        if (res.status === 404) {
          this.stopPolling();
          this.updateState({ state: "FAILED", errorCode: "NOT_FOUND", errorSummary: "Job not found", httpStatus: 404 });
        }
      }
    } catch (e) {
      // transient network error, keep polling or stop? 
      // For now, let it retry on the next interval
    }
  }

  private async fetchCanonicalResult(analysisId: string, jobId: string) {
    this.updateState({ state: "LOADING_RESULT", currentOperation: null });
    try {
      const res = await this.fetchFn(`/api/career/analyses/${analysisId}`);
      if (this.state.activeJobId !== jobId) return; // Stale protection

      if (res.status === 200) {
        const data = await res.json();
        this.updateState({
          state: "SUCCEEDED",
          canonicalAnalysis: data
        });
      } else {
        // Do not change state to FAILED, preserve SUCCEEDED + lack of canonical Analysis
        // This satisfies: "If Job = SUCCEEDED but canonical Analysis GET temporarily fails: DO NOT change Job meaning to FAILED."
        this.updateState({ state: "SUCCEEDED" });
      }
    } catch (e) {
      // Do not change to FAILED
      this.updateState({ state: "SUCCEEDED" });
    }
  }

  public cleanup() {
    this.stopPolling();
  }
}
