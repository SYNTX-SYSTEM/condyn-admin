import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { instance } from "./harness";

/**
 * N-1 B-NAV, GELB point (1): Back / Forward remount the field, so the old mount's CareerJobController is released by the unmount —
 * no further polling and no state from an answer still on its way. Fake timers drive the 2 s poll; the fetch is scripted.
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));

import { CareerJobController } from "../../../lib/career/ui/career-job-controller";
import { useCareerAnalysisJob } from "../../../lib/career/ui/useCareerAnalysisJob";

const SCOPE = { jobPoolUploadId: "JPOOL_30F7145E21F34BEF0FCE510DFC75837B", poolRoleId: "role_fullstack" };
const declared = { documents: [{ type: "text", content: "c" }], jobScope: SCOPE };
const flush = async () => { for (let i = 0; i < 10; i += 1) await Promise.resolve(); };

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("N-1 · the old mount's job controller is released", () => {
  it("REPRODUCE: after cleanup a poll answer still on its way changes nothing and notifies nobody; no further GET", async () => {
    let answer: (value: unknown) => void = () => undefined;
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ status: 202, json: async () => ({ jobId: "JOB_1792000000001_1" }) })
      .mockReturnValueOnce(new Promise(resolve => { answer = resolve; }));
    const controller = new CareerJobController(fetcher as unknown as typeof fetch);
    const notified = vi.fn();
    controller.subscribe(notified);
    await controller.submitAnalysis(declared);
    await flush();
    expect(controller.getState().state).toBe("PENDING");
    const seen = notified.mock.calls.length;
    controller.cleanup();
    answer({ status: 200, json: async () => ({ status: "RUNNING", currentOperation: "DISCOVERY", attemptCount: 1 }) });
    await flush();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(controller.getState().state).toBe("PENDING");
    expect(notified.mock.calls.length).toBe(seen);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("guard: the hook's unmount releases its controller (the unmount of a remount): no further GET, still one POST", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ status: 202, json: async () => ({ jobId: "JOB_1792000000002_2" }) })
      .mockResolvedValue({ status: 200, json: async () => ({ status: "RUNNING", currentOperation: "DISCOVERY", attemptCount: 1 }) });
    vi.stubGlobal("window", { fetch: fetcher });
    let job: ReturnType<typeof useCareerAnalysisJob> | null = null;
    const view = instance<Record<string, never>>(() => { job = useCareerAnalysisJob(); return null; });
    view.settle({});
    await job!.submitAnalysis(declared);
    await flush();
    const reads = fetcher.mock.calls.length;
    view.unmount();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetcher.mock.calls.length).toBe(reads);
    expect(fetcher.mock.calls.filter(([, init]) => (init as { method?: string } | undefined)?.method === "POST").length).toBe(1);
  });

  it("inverse: React's development double mount (cleanup, then the effect again) leaves the controller working", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ status: 202, json: async () => ({ jobId: "JOB_1792000000003_3" }) })
      .mockResolvedValue({ status: 200, json: async () => ({ status: "RUNNING", currentOperation: "DISCOVERY", attemptCount: 1 }) });
    const controller = new CareerJobController(fetcher as unknown as typeof fetch);
    controller.cleanup();
    controller.activate();
    await controller.submitAnalysis(declared);
    await flush();
    await vi.advanceTimersByTimeAsync(2_000);
    expect(controller.getState().state).toBe("RUNNING");
    controller.cleanup();
  });
});
