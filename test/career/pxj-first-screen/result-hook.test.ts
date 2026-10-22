import { describe, expect, it, vi } from "vitest";
import { ANALYSIS, resultBody } from "./fixtures";

/**
 * T-04 · useAnalysisResult is bound to its analysisId: a change discards the result, aborts the read in flight and ignores a late
 * answer. The repository has no DOM renderer, so `react` is replaced by a minimal hook runtime for one component instance
 * (useState / useRef / useEffect with dependency comparison and cleanup); each render() call is one render of the hook.
 */
const runtime = vi.hoisted(() => ({
  slots: [] as unknown[],
  effects: [] as Array<{ deps: unknown[] | undefined; cleanup?: void | (() => void) }>,
  pending: [] as Array<() => void>,
  cursor: 0,
  effectCursor: 0
}));
vi.mock("react", () => ({
  useState: <T>(initial: T) => {
    const index = runtime.cursor++;
    if (!(index in runtime.slots)) runtime.slots[index] = initial;
    return [runtime.slots[index] as T, (next: T) => { runtime.slots[index] = next; }];
  },
  useRef: <T>(initial: T) => {
    const index = runtime.cursor++;
    if (!(index in runtime.slots)) runtime.slots[index] = { current: initial };
    return runtime.slots[index] as { current: T };
  },
  useEffect: (effect: () => void | (() => void), deps?: unknown[]) => {
    const index = runtime.effectCursor++;
    const previous = runtime.effects[index];
    if (previous && previous.deps && deps && previous.deps.length === deps.length && previous.deps.every((value, at) => Object.is(value, deps[at]))) return;
    runtime.pending.push(() => {
      if (typeof previous?.cleanup === "function") previous.cleanup();
      runtime.effects[index] = { deps, cleanup: effect() };
    });
  }
}));

import { useAnalysisResult } from "../../../lib/career/ui/useAnalysisResult";

type Answer = { status: number; body: unknown };
function controlledFetcher() {
  const requests: Array<{ url: string; signal?: AbortSignal; answer: (value: Answer) => void }> = [];
  const fetcher = (url: string, init: { method: "GET"; cache: "no-store"; signal?: AbortSignal }) => new Promise<{ status: number; json(): Promise<unknown> }>(resolve => {
    requests.push({ url, signal: init.signal, answer: ({ status, body }) => resolve({ status, json: async () => body }) });
  });
  return { requests, fetcher };
}
const flush = () => new Promise(resolve => setTimeout(resolve, 0));
/** One render of the hook, then its effects, as React would commit them. */
function render(analysisId: string | null, fetcher: ReturnType<typeof controlledFetcher>["fetcher"]) {
  runtime.cursor = 0; runtime.effectCursor = 0;
  const value = useAnalysisResult(analysisId, fetcher);
  const effects = runtime.pending.splice(0);
  for (const effect of effects) effect();
  return value;
}

describe("T-04 · useAnalysisResult binding", () => {
  it("a change of analysis aborts the read in flight; its late answer stays invisible; only the current analysis is shown", async () => {
    runtime.slots = []; runtime.effects = []; runtime.pending = [];
    const { requests, fetcher } = controlledFetcher();
    expect(render(ANALYSIS, fetcher)).toEqual({ state: "LOADING" });
    expect(requests.map(request => request.url)).toEqual([`/api/career/analyses/${ANALYSIS}`]);
    // The analysis on view changes before the first answer arrives.
    expect(render("ANL_NEWER", fetcher)).toEqual({ state: "LOADING" });
    expect(requests[0].signal?.aborted).toBe(true);
    // The late answer for the first analysis arrives: discarded.
    requests[0].answer({ status: 200, body: resultBody() });
    await flush();
    expect(render("ANL_NEWER", fetcher)).toEqual({ state: "LOADING" });
    // The newer analysis answers: its own state is shown.
    requests[1].answer({ status: 404, body: { success: false, issues: [{ code: "ERR_ANALYSIS_NOT_FOUND" }] } });
    await flush();
    expect(render("ANL_NEWER", fetcher)).toEqual({ state: "NOT_FOUND" });
    // Back to the first analysis: read again (GET, no-store), never the earlier answer reused.
    expect(render(ANALYSIS, fetcher)).toEqual({ state: "LOADING" });
    expect(requests).toHaveLength(3);
    requests[2].answer({ status: 200, body: resultBody() });
    await flush();
    const shown = render(ANALYSIS, fetcher);
    expect(shown.state).toBe("AVAILABLE");
    expect(shown.state === "AVAILABLE" && shown.result.analysisId).toBe(ANALYSIS);
    // No analysis: nothing read, IDLE; the previous result is not visible.
    expect(render(null, fetcher)).toEqual({ state: "IDLE" });
    expect(requests).toHaveLength(3);
  });

  it("a session result has precedence: with null the hook reads nothing at all", () => {
    runtime.slots = []; runtime.effects = []; runtime.pending = [];
    const { requests, fetcher } = controlledFetcher();
    expect(render(null, fetcher)).toEqual({ state: "IDLE" });
    expect(render(null, fetcher)).toEqual({ state: "IDLE" });
    expect(requests).toHaveLength(0);
  });
});
