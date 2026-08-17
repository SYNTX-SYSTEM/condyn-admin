export type JobLifecycleState = "IDLE" | "SUBMITTING" | "PENDING" | "RUNNING" | "LOADING_RESULT" | "SUCCEEDED" | "FAILED";

export interface JobState {
  state: JobLifecycleState;
  activeJobId: string | null;
  resultAnalysisId: string | null;
  canonicalAnalysis: any | null;
  errorCode: string | null;
  errorSummary: string | null;
}

export class CareerJobController {
  private state: JobState = {
    state: "IDLE",
    activeJobId: null,
    resultAnalysisId: null,
    canonicalAnalysis: null,
    errorCode: null,
    errorSummary: null,
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

  public async submitAnalysis(payload: any) {
    if (this.state.state === "SUBMITTING" || this.state.state === "PENDING" || this.state.state === "RUNNING") {
      return; // prevent double submit
    }

    this.currentIdempotencyKey = crypto.randomUUID();
    
    this.updateState({
      state: "SUBMITTING",
      activeJobId: null,
      resultAnalysisId: null,
      canonicalAnalysis: null,
      errorCode: null,
      errorSummary: null
    });

    try {
      const res = await this.fetchFn("/api/career/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": this.currentIdempotencyKey
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 202) {
        const data = await res.json();
        this.updateState({
          activeJobId: data.jobId,
          state: "PENDING"
        });
        this.startPolling(data.jobId);
      } else {
        const err = await res.json();
        this.updateState({
          state: "FAILED",
          errorCode: "HTTP_" + res.status,
          errorSummary: err.issues?.[0]?.message || "Submission failed"
        });
      }
    } catch (e: any) {
      this.updateState({
        state: "FAILED",
        errorCode: "NETWORK_ERROR",
        errorSummary: e.message
      });
    }
  }

  public retryActiveJob() {
    if (this.state.activeJobId && this.state.state === "FAILED" && !this.state.errorCode?.startsWith("HTTP_4")) {
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
          this.updateState({ state: data.status });
        } else if (data.status === "SUCCEEDED") {
          this.stopPolling();
          this.updateState({ state: "SUCCEEDED", resultAnalysisId: data.resultAnalysisId });
          this.fetchCanonicalResult(data.resultAnalysisId, jobId);
        } else if (data.status === "FAILED") {
          this.stopPolling();
          this.updateState({
            state: "FAILED",
            errorCode: data.errorCode,
            errorSummary: data.errorSummary
          });
        }
      } else {
        // Stop polling on 4xx/5xx for now, or just retry if 5xx
        if (res.status === 404) {
          this.stopPolling();
          this.updateState({ state: "FAILED", errorCode: "NOT_FOUND", errorSummary: "Job not found" });
        }
      }
    } catch (e) {
      // transient network error, keep polling or stop? 
      // For now, let it retry on the next interval
    }
  }

  private async fetchCanonicalResult(analysisId: string, jobId: string) {
    this.updateState({ state: "LOADING_RESULT" });
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
