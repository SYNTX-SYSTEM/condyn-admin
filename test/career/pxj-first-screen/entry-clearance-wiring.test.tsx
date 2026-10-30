import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * PINK §3.83 F-SEM-5 (mutant E32): the intake panel starts below the entry line only while the dashboard writes --sx-entry-clear
 * on its root (career-demo-layout.ts applyCareerDemoEntryClearance; the CSS rule and the function are covered in
 * field-entry-state.test.tsx). This file proves the dashboard's own wiring with the hook harness: the one root ref is handed a
 * stub element, the observer, the frame and the window are stubs. It proves when the dashboard calls the function (mount, a
 * mutation in the field including a text change, a resize, one frame per burst) and that unmount releases all of it; the
 * measurement itself stays the browser walk's.
 */

const stub = vi.hoisted(() => ({ root: null as unknown }));
vi.mock("react", async (importOriginal) => {
  const mocked = (await import("./harness")).mockReact(await importOriginal<typeof import("react")>());
  // The dashboard has exactly one ref (its root); the harness never mounts the <div>, so the stub stands in for it.
  const useRef = <S,>(initial: S) => { const ref = mocked.useRef(initial); if (stub.root !== null && ref.current === null) ref.current = stub.root as S; return ref; };
  return { ...mocked, useRef, default: { ...(mocked as unknown as { default: object }).default, useRef } };
});

import { instance } from "./harness";
import { CareerIntelligenceDashboard } from "../../../app/components/career/demo/CareerIntelligenceDashboard";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const box = (top: number, bottom: number) => ({ getBoundingClientRect: () => ({ top, bottom, height: bottom - top }) });

function world() {
  const vars = new Map<string, string>();
  const dom = { line: box(128, 214.4) as unknown, job: box(61, 900) as unknown };
  const root = {
    dataset: {} as Record<string, string>,
    style: { setProperty: (k: string, v: string) => void vars.set(k, v), removeProperty: (k: string) => void vars.delete(k) },
    querySelector: (q: string) => (q.includes('data-sx-shell="gate-reason"') ? dom.line : q.includes('data-sx-field="job"') ? dom.job : q === ":scope > div" ? box(0, 61) : null)
  };
  const listeners = new Map<string, Set<() => void>>();
  const on = (type: string) => listeners.get(type) ?? listeners.set(type, new Set()).get(type)!;
  const frames: Array<() => void> = [];
  const observers: Array<{ callback: () => void; target?: unknown; options?: MutationObserverInit; disconnected: boolean }> = [];
  vi.stubGlobal("window", {
    innerWidth: 1920, innerHeight: 1080, scrollY: 0,
    addEventListener: (type: string, listener: () => void) => void on(type).add(listener),
    removeEventListener: (type: string, listener: () => void) => void on(type).delete(listener)
  });
  vi.stubGlobal("requestAnimationFrame", (frame: () => void) => { frames.push(frame); return frames.length; });
  vi.stubGlobal("MutationObserver", class {
    record: (typeof observers)[number];
    constructor(callback: () => void) { this.record = { callback, disconnected: false }; observers.push(this.record); }
    observe(target: unknown, options: MutationObserverInit) { this.record.target = target; this.record.options = options; }
    disconnect() { this.record.disconnected = true; }
  });
  stub.root = root;
  const flush = () => { for (const frame of frames.splice(0)) frame(); };
  const mutate = () => { for (const o of observers) if (!o.disconnected) o.callback(); };
  const resize = () => { for (const listener of [...on("resize")]) listener(); };
  return { vars, dom, root, frames, observers, listeners: on, flush, mutate, resize };
}

const mount = () => { const dashboard = instance<Record<string, unknown>>(CareerIntelligenceDashboard); dashboard.render({ data: EMPTY_CAREER_INTELLIGENCE_DATA }); return dashboard; };

beforeEach(() => { stub.root = null; });
afterEach(() => { vi.unstubAllGlobals(); stub.root = null; });

describe("SEMIOTIC_ENTRY · PINK §3.83 F-SEM-5: the dashboard writes the entry clearance", () => {
  it("REPRODUCE: on mount, on a field mutation (the line's text included) and on a resize, one frame later --sx-entry-clear follows the line", () => {
    const w = world();
    mount();
    expect(w.observers).toHaveLength(1);
    expect(w.observers[0].target).toBe(w.root);
    // The line's text changes with the state and the language without adding nodes: characterData is what sees that.
    expect(w.observers[0].options).toMatchObject({ childList: true, subtree: true, characterData: true });
    expect(w.vars.has("--sx-entry-clear"), "written in a frame, not synchronously").toBe(false);
    w.flush();
    expect(w.vars.get("--sx-entry-clear")).toBe("166px"); // ceil(214.4 − 61 + 12)
    w.dom.line = box(128, 250); // the line wraps to a second row
    w.mutate();
    w.flush();
    expect(w.vars.get("--sx-entry-clear")).toBe("201px");
    w.dom.line = box(128, 232); // a narrower window rewraps it
    w.resize();
    w.flush();
    expect(w.vars.get("--sx-entry-clear")).toBe("183px");
  });

  it("REPRODUCE: a burst of mutations asks for one frame, not one per record", () => {
    const w = world();
    mount();
    w.flush();
    w.mutate(); w.mutate(); w.mutate();
    expect(w.frames).toHaveLength(1);
    w.flush();
    w.mutate();
    expect(w.frames, "the next burst after the frame asks again").toHaveLength(1);
  });

  it("inverse: the line goes (gate open, Capability focus) → the variable goes; after unmount nothing is observed or written", () => {
    const w = world();
    const dashboard = mount();
    w.flush();
    expect(w.vars.get("--sx-entry-clear")).toBe("166px");
    w.dom.line = null;
    w.mutate();
    w.flush();
    expect(w.vars.has("--sx-entry-clear"), "the intake keeps its own 150 px").toBe(false);
    dashboard.unmount();
    expect(w.observers[0].disconnected).toBe(true);
    expect(w.listeners("resize").size, "both resize listeners (fit and clearance) released").toBe(0);
    w.dom.line = box(128, 214.4);
    w.mutate(); w.resize(); w.flush();
    expect(w.vars.has("--sx-entry-clear")).toBe(false);
  });

  it("inverse: without a root (no ref) the dashboard schedules nothing and writes nothing", () => {
    const w = world();
    stub.root = null;
    mount();
    expect(w.observers).toHaveLength(0);
    w.resize();
    expect(w.frames).toHaveLength(0);
    expect(w.vars.size).toBe(0);
  });
});
