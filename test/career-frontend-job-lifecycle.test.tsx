import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CareerJobController } from "../lib/career/ui/career-job-controller";
import { JOB_SCOPE_INVALID_CODE, JOB_SCOPE_REQUIRED_CODE, JOB_SCOPE_REQUIRED_MESSAGE } from "../lib/career/job-pool/job-scope";

/** SFE job-scope invariant: every submission carries a formally valid job scope (GELB contract). */
const SCOPE = { jobPoolUploadId: "JPOOL_30F7145E21F34BEF0FCE510DFC75837B", poolRoleId: "role_fullstack" };

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
    controller.submitAnalysis({ docs: ["A"], jobScope: SCOPE });
    
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

    await controller.submitAnalysis({ docs: ["A"], jobScope: SCOPE });
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

    await controller.submitAnalysis({ docs: ["A"], jobScope: SCOPE });
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

    await controller.submitAnalysis({ docs: ["A"], jobScope: SCOPE });
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

    await controller.submitAnalysis({ docs: ["A"], jobScope: SCOPE });
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

    await controller.submitAnalysis({ docs: ["A"], jobScope: SCOPE });
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

    await controller.submitAnalysis({ docs: ["A"], jobScope: SCOPE });
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

    controller.submitAnalysis({ docs: ["A"], jobScope: SCOPE });
    controller.submitAnalysis({ docs: ["A"], jobScope: SCOPE });
    controller.submitAnalysis({ docs: ["B"], jobScope: SCOPE });
    
    expect(mockFetch).toHaveBeenCalledTimes(1); // M, N. Exactly one post
  });

  it("O, P. Idempotency key preservation and new generation", async () => {
    mockFetch.mockResolvedValue({ status: 500, json: async () => ({ issues: [{}] }) });
    
    await controller.submitAnalysis({ docs: ["A"], jobScope: SCOPE });
    for (let i = 0; i < 10; i++) await Promise.resolve();
    
    const key1 = mockFetch.mock.calls[0][1].headers["Idempotency-Key"];
    expect(key1).toBeDefined();

    // Submit again on FAILED (which allows new submission, generating new key)
    await controller.submitAnalysis({ docs: ["B"], jobScope: SCOPE });
    for (let i = 0; i < 10; i++) await Promise.resolve();

    const key2 = mockFetch.mock.calls[1][1].headers["Idempotency-Key"];
    expect(key2).not.toBe(key1);
  });

  it("Q. Stale Job A response cannot overwrite Job B", async () => {
    let resolveJobA: any;
    mockFetch.mockReturnValueOnce(new Promise(r => resolveJobA = r)); // POST A
    
    controller.submitAnalysis({ docs: ["A"], jobScope: SCOPE });
    
    // Simulate navigation/restart creating a new controller for B
    const controllerB = new CareerJobController(mockFetch as any);
    
    let resolveJobB: any;
    mockFetch.mockReturnValueOnce(new Promise(r => resolveJobB = r)); // POST B
    
    controllerB.submitAnalysis({ docs: ["B"], jobScope: SCOPE });

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

    await controller.submitAnalysis({ docs: ["A"], jobScope: SCOPE });
    for (let i = 0; i < 10; i++) await Promise.resolve();

    expect(controller.getState().state).toBe("SUCCEEDED");
    expect(controller.getState().resultAnalysisId).toBe("ANL_456");
    expect(controller.getState().canonicalAnalysis).toBeNull(); // Missing but not failed job
  });
});

describe("SFE job-scope invariant — the controller sends nothing without a valid jobScope and keeps the backend's code", () => {
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

  it.each([
    ["missing", { documents: [{ type: "text", content: "x" }] }],
    ["null", { documents: [], jobScope: null }],
    ["lower-case upload id", { documents: [], jobScope: { jobPoolUploadId: "jpool_30f7145e21f34bef0fce510dfc75837b", poolRoleId: "r" } }],
    ["empty role", { documents: [], jobScope: { jobPoolUploadId: SCOPE.jobPoolUploadId, poolRoleId: "" } }],
    ["extra key", { documents: [], jobScope: { ...SCOPE, organizationId: "org" } }],
    ["the analysis job id instead", { documents: [], jobId: "JOB_123" }]
  ])("refuses a payload whose jobScope is %s: no request, state untouched", async (_label, payload) => {
    const before = controller.getState();
    const result = await controller.submitAnalysis(payload);
    expect(result).toBe(JOB_SCOPE_REQUIRED_CODE);
    expect(mockFetch).not.toHaveBeenCalled();
    expect(controller.getState()).toBe(before);
  });

  it("sends a padded role id exactly as stored, untrimmed (owner G-10, variant A)", async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    const padded = { jobPoolUploadId: SCOPE.jobPoolUploadId, poolRoleId: " role pink padded " };
    controller.submitAnalysis({ documents: [{ type: "text", content: "x" }], jobScope: padded });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).jobScope).toEqual(padded);
  });

  it("sends exactly the two jobScope keys next to the documents", async () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    controller.submitAnalysis({ documents: [{ type: "text", content: "x" }], jobScope: { poolRoleId: SCOPE.poolRoleId, jobPoolUploadId: SCOPE.jobPoolUploadId } });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({ documents: [{ type: "text", content: "x" }], jobScope: SCOPE });
    expect(Object.keys(body.jobScope).sort()).toEqual(["jobPoolUploadId", "poolRoleId"]);
  });

  it.each([
    [400, JOB_SCOPE_REQUIRED_CODE],
    [422, JOB_SCOPE_INVALID_CODE]
  ])("keeps the backend code of a %i rejection (finding 1: no HTTP_<status> in its place) and the status apart", async (status, code) => {
    mockFetch.mockResolvedValueOnce({ status, json: async () => ({ success: false, status: "FAILED", issues: [{ code, message: JOB_SCOPE_REQUIRED_MESSAGE }] }) });
    await controller.submitAnalysis({ documents: [], jobScope: SCOPE });
    for (let i = 0; i < 10; i++) await Promise.resolve();
    expect(controller.getState().state).toBe("FAILED");
    expect(controller.getState().errorCode).toBe(code);
    expect(controller.getState().errorSummary).toBe(JOB_SCOPE_REQUIRED_MESSAGE);
    expect(controller.getState().httpStatus).toBe(status);
  });

  it("falls back to HTTP_<status> only when the body names no code", async () => {
    mockFetch.mockResolvedValueOnce({ status: 500, json: async () => { throw new Error("not json"); } });
    await controller.submitAnalysis({ documents: [], jobScope: SCOPE });
    for (let i = 0; i < 10; i++) await Promise.resolve();
    expect(controller.getState().errorCode).toBe("HTTP_500");
    expect(controller.getState().errorSummary).toBe("Submission failed");
    expect(controller.getState().httpStatus).toBe(500);
  });

  it("a worker FAILED for the job scope is terminal: code and owner sentence kept, no HTTP status, no retry", async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 202, json: async () => ({ jobId: "JOB_123" }) })
      .mockResolvedValueOnce({ status: 200, json: async () => ({ status: "FAILED", errorCode: JOB_SCOPE_INVALID_CODE, errorSummary: JOB_SCOPE_REQUIRED_MESSAGE }) });
    await controller.submitAnalysis({ documents: [], jobScope: SCOPE });
    for (let i = 0; i < 10; i++) await Promise.resolve();
    expect(controller.getState()).toMatchObject({ state: "FAILED", errorCode: JOB_SCOPE_INVALID_CODE, errorSummary: JOB_SCOPE_REQUIRED_MESSAGE, httpStatus: null });
    controller.retryActiveJob();
    await vi.advanceTimersByTimeAsync(5000);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("retry still resumes polling after a non-scope worker failure (unchanged behaviour)", async () => {
    mockFetch
      .mockResolvedValueOnce({ status: 202, json: async () => ({ jobId: "JOB_123" }) })
      .mockResolvedValueOnce({ status: 200, json: async () => ({ status: "FAILED", errorCode: "ERR_TIMEOUT", errorSummary: "Timeout" }) })
      .mockReturnValue(new Promise(() => {}));
    await controller.submitAnalysis({ documents: [], jobScope: SCOPE });
    for (let i = 0; i < 10; i++) await Promise.resolve();
    controller.retryActiveJob();
    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch.mock.calls[2][0]).toBe("/api/career/jobs/JOB_123");
  });
});
