import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CareerJobController } from "../lib/career/ui/career-job-controller";

describe("CONDYN Career Analysis Protocol v5.0 - PHASE 5: TEST005D FRONTEND JOB LIFECYCLE", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let controller: CareerJobController;

  beforeEach(() => {
    vi.useFakeTimers();
    mockFetch = vi.fn();
    controller = new CareerJobController(mockFetch as any);
  });

  afterEach(() => {
    controller.cleanup();
    vi.restoreAllMocks();
  });

  it("A, B, C, D, E. Submits analysis, enters SUBMITTING, stores jobId on 202, enters PENDING, polls", async () => {
    let resolvePost: any;
    const postPromise = new Promise(r => resolvePost = r);
    mockFetch.mockReturnValueOnce(postPromise);

    // A. trigger Analyze
    controller.submitAnalysis({ docs: ["A"] });
    
    // Exactly one POST
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("/api/career/analyze");

    // B. SUBMITTING state
    expect(controller.getState().state).toBe("SUBMITTING");

    // C. 202 response
    resolvePost({
      status: 202,
      json: async () => ({ jobId: "JOB_123" })
    });

    // Wait for microtasks
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    // D. PENDING state
    expect(controller.getState().state).toBe("PENDING");
    expect(controller.getState().activeJobId).toBe("JOB_123");

    // E. Polling begins immediately
    expect(mockFetch).toHaveBeenCalledTimes(2); // The immediate pollJob
    expect(mockFetch.mock.calls[1][0]).toBe("/api/career/jobs/JOB_123");
  });

  it("F. RUNNING state transition", async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 202, json: async () => ({ jobId: "JOB_123" }) })
      .mockResolvedValueOnce({ status: 200, json: async () => ({ status: "RUNNING" }) });

    await controller.submitAnalysis({ docs: ["A"] });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(controller.getState().state).toBe("RUNNING");
  });

  it("Progress telemetry V1: consumes currentOperation and attemptCount from RUNNING polling without synthesis", async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 202, json: async () => ({ jobId: "JOB_123" }) })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ status: "RUNNING", currentOperation: "INFERENCE", attemptCount: 2 })
      });

    await controller.submitAnalysis({ docs: ["A"] });
    for (let i = 0; i < 10; i++) await Promise.resolve();

    expect((controller.getState() as any).currentOperation).toBe("INFERENCE");
    expect((controller.getState() as any).attemptCount).toBe(2);
  });

  it("Progress telemetry V1: preserves null currentOperation from PENDING polling", async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 202, json: async () => ({ jobId: "JOB_123" }) })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ status: "PENDING", currentOperation: null, attemptCount: 0 })
      });

    await controller.submitAnalysis({ docs: ["A"] });
    for (let i = 0; i < 10; i++) await Promise.resolve();

    expect((controller.getState() as any).state).toBe("PENDING");
    expect((controller.getState() as any).currentOperation).toBeNull();
    expect((controller.getState() as any).attemptCount).toBe(0);
  });

  it("Progress telemetry V1 blocker B2: clears the worker operation while loading the canonical result", async () => {
    let resolveCanonicalResult!: (value: unknown) => void;
    const canonicalResult = new Promise((resolve) => {
      resolveCanonicalResult = resolve;
    });

    mockFetch
      .mockResolvedValueOnce({ status: 202, json: async () => ({ jobId: "JOB_123" }) })
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ status: "RUNNING", currentOperation: "PERSISTENCE", attemptCount: 2 })
      })
      .mockResolvedValueOnce({ status: 200, json: async () => ({ status: "SUCCEEDED", resultAnalysisId: "ANL_456" }) })
      .mockReturnValueOnce(canonicalResult);

    await controller.submitAnalysis({ docs: ["A"] });
    for (let i = 0; i < 10; i++) await Promise.resolve();
    expect(controller.getState().state).toBe("RUNNING");
    expect((controller.getState() as any).currentOperation).toBe("PERSISTENCE");

    await vi.advanceTimersByTimeAsync(2000);
    for (let i = 0; i < 10; i++) await Promise.resolve();

    expect(controller.getState().state).toBe("LOADING_RESULT");
    expect((controller.getState() as any).attemptCount).toBe(2);
    expect((controller.getState() as any).currentOperation).toBeNull();

    resolveCanonicalResult({ analysisId: "ANL_456" });
  });

  it("G, H, I. SUCCEEDED stops polling and fetches resultAnalysisId", async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 202, json: async () => ({ jobId: "JOB_123" }) })
      .mockResolvedValueOnce({ status: 200, json: async () => ({ status: "SUCCEEDED", resultAnalysisId: "ANL_456" }) })
      .mockResolvedValueOnce({ status: 200, json: async () => ({ analysisId: "ANL_456", structured_data: { test: true } }) });

    await controller.submitAnalysis({ docs: ["A"] });
    // flush microtasks
    for (let i = 0; i < 10; i++) await Promise.resolve();

    // G. Stops polling, H. fetches resultAnalysisId
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch.mock.calls[2][0]).toBe("/api/career/analyses/ANL_456");

    // I. Canonical Analysis retrieved
    expect(controller.getState().state).toBe("SUCCEEDED");
    expect(controller.getState().canonicalAnalysis).toBeDefined();
    expect(controller.getState().canonicalAnalysis.analysisId).toBe("ANL_456");
  });

  it("K. FAILED stops polling and renders bounded error", async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 202, json: async () => ({ jobId: "JOB_123" }) })
      .mockResolvedValueOnce({ status: 200, json: async () => ({ status: "FAILED", errorCode: "ERR_TIMEOUT", errorSummary: "Timeout" }) });

    await controller.submitAnalysis({ docs: ["A"] });
    for (let i = 0; i < 10; i++) await Promise.resolve();

    expect(controller.getState().state).toBe("FAILED");
    expect(controller.getState().errorCode).toBe("ERR_TIMEOUT");
    expect(controller.getState().errorSummary).toBe("Timeout");
    
    // Verify polling stops (advance timer)
    vi.advanceTimersByTime(5000);
    expect(mockFetch).toHaveBeenCalledTimes(2); // no further polls
  });

  it("M, N. double-click/re-render creates no extra POST", async () => {
    mockFetch.mockReturnValue(new Promise(() => {})); // hanging promise

    controller.submitAnalysis({ docs: ["A"] });
    controller.submitAnalysis({ docs: ["A"] });
    controller.submitAnalysis({ docs: ["B"] });
    
    expect(mockFetch).toHaveBeenCalledTimes(1); // M, N. Exactly one post
  });

  it("O, P. Idempotency key preservation and new generation", async () => {
    mockFetch.mockResolvedValue({ status: 500, json: async () => ({ issues: [{}] }) });
    
    await controller.submitAnalysis({ docs: ["A"] });
    for (let i = 0; i < 10; i++) await Promise.resolve();
    
    const key1 = mockFetch.mock.calls[0][1].headers["Idempotency-Key"];
    expect(key1).toBeDefined();

    // Submit again on FAILED (which allows new submission, generating new key)
    await controller.submitAnalysis({ docs: ["B"] });
    for (let i = 0; i < 10; i++) await Promise.resolve();

    const key2 = mockFetch.mock.calls[1][1].headers["Idempotency-Key"];
    expect(key2).not.toBe(key1);
  });

  it("Q. Stale Job A response cannot overwrite Job B", async () => {
    let resolveJobA: any;
    mockFetch.mockReturnValueOnce(new Promise(r => resolveJobA = r)); // POST A
    
    controller.submitAnalysis({ docs: ["A"] });
    
    // Simulate navigation/restart creating a new controller for B
    const controllerB = new CareerJobController(mockFetch as any);
    
    let resolveJobB: any;
    mockFetch.mockReturnValueOnce(new Promise(r => resolveJobB = r)); // POST B
    
    controllerB.submitAnalysis({ docs: ["B"] });

    resolveJobB({ status: 202, json: async () => ({ jobId: "JOB_B" }) });
    for (let i = 0; i < 10; i++) await Promise.resolve();
    
    // Job B is now PENDING
    expect(controllerB.getState().state).toBe("PENDING");

    // Later Job A resolves
    resolveJobA({ status: 202, json: async () => ({ jobId: "JOB_A" }) });
    for (let i = 0; i < 10; i++) await Promise.resolve();

    // Controller B ignores it entirely
    expect(controllerB.getState().activeJobId).toBe("JOB_B");
  });

  it("S. SUCCEEDED + temporary Analysis GET failure -> remains successful job / retriable result load", async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 202, json: async () => ({ jobId: "JOB_123" }) })
      .mockResolvedValueOnce({ status: 200, json: async () => ({ status: "SUCCEEDED", resultAnalysisId: "ANL_456" }) })
      .mockResolvedValueOnce({ status: 500, json: async () => ({}) }); // Failure on canonical GET

    await controller.submitAnalysis({ docs: ["A"] });
    for (let i = 0; i < 10; i++) await Promise.resolve();

    expect(controller.getState().state).toBe("SUCCEEDED");
    expect(controller.getState().resultAnalysisId).toBe("ANL_456");
    expect(controller.getState().canonicalAnalysis).toBeNull(); // Missing but not failed job
  });
});
