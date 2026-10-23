import type { ReactElement } from "react";

/**
 * A minimal hook runtime for calling one component function at a time (the repo has no DOM renderer), shared by the navigation
 * tests (N-1 … N-3); the same model as role-field-closure.test.tsx: useState with lazy initialisers, useRef, useMemo / useCallback
 * with dependency comparison, useEffect committed after each render in declaration order (cleanup before a re-run), and
 * useSyncExternalStore read synchronously (subscribed once, unsubscribed on unmount). Each `instance()` keeps its own slots, so a
 * remount is a fresh instance. It proves a component's own state logic across renders and what it hands its children; it does not
 * prove React's scheduling, key semantics or the children's rendering.
 *
 * Use: `vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal()))`.
 */
type Effect = { deps: unknown[] | undefined; cleanup?: void | (() => void) };
interface Instance { slots: unknown[]; effects: Effect[]; pending: Array<() => void>; cursor: number; effectCursor: number; unsubscribe: Array<() => void> }

const blank = (): Instance => ({ slots: [], effects: [], pending: [], cursor: 0, effectCursor: 0, unsubscribe: [] });
let current: Instance = blank();

const same = (a: unknown[] | undefined, b: unknown[] | undefined) => !!a && !!b && a.length === b.length && a.every((value, at) => Object.is(value, b[at]));

export function mockReact<T extends object>(original: T): T {
  const useState = <S,>(initial: S | (() => S)) => {
    const self = current, index = self.cursor++;
    if (!(index in self.slots)) self.slots[index] = typeof initial === "function" ? (initial as () => S)() : initial;
    return [self.slots[index] as S, (next: S | ((previous: S) => S)) => { self.slots[index] = typeof next === "function" ? (next as (previous: S) => S)(self.slots[index] as S) : next; }] as const;
  };
  const useRef = <S,>(initial: S) => { const index = current.cursor++; if (!(index in current.slots)) current.slots[index] = { current: initial }; return current.slots[index] as { current: S }; };
  const useMemo = <S,>(factory: () => S, deps?: unknown[]) => {
    const index = current.cursor++;
    const previous = current.slots[index] as { deps?: unknown[]; value: S } | undefined;
    if (previous && same(previous.deps, deps)) return previous.value;
    const value = factory(); current.slots[index] = { deps, value }; return value;
  };
  const useCallback = <S,>(callback: S, deps?: unknown[]) => useMemo(() => callback, deps);
  const useEffect = (effect: () => void | (() => void), deps?: unknown[]) => {
    const self = current, index = self.effectCursor++;
    const previous = self.effects[index];
    if (previous && same(previous.deps, deps)) return;
    self.pending.push(() => { if (typeof previous?.cleanup === "function") previous.cleanup(); self.effects[index] = { deps, cleanup: effect() }; });
  };
  const useSyncExternalStore = <S,>(subscribe: (listener: () => void) => () => void, getSnapshot: () => S) => {
    const self = current, index = self.cursor++;
    if (!(index in self.slots)) { self.slots[index] = true; self.unsubscribe.push(subscribe(() => undefined)); }
    return getSnapshot();
  };
  const hooks = { useState, useRef, useMemo, useCallback, useEffect, useLayoutEffect: useEffect, useSyncExternalStore };
  return { ...original, ...hooks, default: { ...(original as unknown as { default: object }).default, ...hooks } } as T;
}

export interface ComponentInstance<P> {
  /** One render with these props, then the effects it scheduled (in declaration order). */
  render(props: P): ReactElement<Record<string, unknown>>;
  /** Renders until the tree is stable (effects may set state). */
  settle(props: P): ReactElement<Record<string, unknown>>;
  /** The unmount: every effect's cleanup and every store subscription released. */
  unmount(): void;
}

export function instance<P>(component: unknown): ComponentInstance<P> {
  const self = blank();
  const render = (props: P) => {
    const previous = current;
    current = self; self.cursor = 0; self.effectCursor = 0;
    try {
      const tree = (component as (p: P) => ReactElement<Record<string, unknown>>)(props);
      for (const effect of self.pending.splice(0)) effect();
      return tree;
    } finally { current = previous; }
  };
  return {
    render,
    settle: (props: P) => { let tree = render(props); for (let i = 0; i < 6; i += 1) tree = render(props); return tree; },
    unmount: () => {
      for (const effect of self.effects) if (typeof effect?.cleanup === "function") effect.cleanup();
      for (const release of self.unsubscribe.splice(0)) release();
      self.effects = [];
    }
  };
}

export function find(node: unknown, type: unknown): ReactElement<Record<string, unknown>> | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const child of node) { const hit = find(child, type); if (hit) return hit; } return null; }
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.type === type) return element;
  return find((element.props as { children?: unknown } | undefined)?.children, type);
}

/**
 * The URL's field props read here, independent of the code under test (so a test fails on a base without the shared parser for
 * the behaviour it names, not for a missing module): a parameter counts only when it stands exactly once.
 */
export function urlProps(url: string): Record<string, string | undefined> {
  const params = new URL(url).searchParams;
  const one = (name: string) => params.getAll(name).length === 1 ? params.get(name)! : undefined;
  const focus = one("focus");
  return {
    analysisId: one("analysisId"), jobPoolUploadId: one("jobPoolUploadId"),
    fieldFocus: focus === "FIELD" || focus === "JOB" || focus === "POOL" ? "FIELD" : focus === "CAPABILITY" ? "CAPABILITY" : undefined,
    jobOrganizationId: one("jobOrganizationId"), jobRoleId: one("jobRoleId"), jobRequirementId: one("jobRequirementId"),
    jobScopePoolUploadId: one("jobScopePoolUploadId"), jobScopeRoleId: one("jobScopeRoleId"),
    investigationMode: one("investigationMode"), analysisJobId: one("analysisJobId")
  };
}

/** A browser window with a history that records every write (push / replace) and can go Back / Forward (firing popstate). */
export function browser(start: string) {
  const entries = [start];
  let at = 0;
  const writes: Array<{ how: "push" | "replace"; url: string }> = [];
  const listeners = new Set<() => void>();
  const location = { get href() { return entries[at]; }, get search() { return new URL(entries[at]).search; } };
  const history = {
    state: null,
    pushState: (_state: unknown, _title: string, next: string) => { entries.splice(at + 1); entries.push(next); at += 1; writes.push({ how: "push", url: next }); },
    replaceState: (_state: unknown, _title: string, next: string) => { entries[at] = next; writes.push({ how: "replace", url: next }); }
  };
  const window = {
    location, history,
    addEventListener: (type: string, listener: () => void) => { if (type === "popstate") listeners.add(listener); },
    removeEventListener: (type: string, listener: () => void) => { if (type === "popstate") listeners.delete(listener); }
  };
  const go = (delta: number) => { at += delta; if (at < 0 || at >= entries.length) throw new Error("left the document"); for (const listener of [...listeners]) listener(); };
  return {
    window, writes, entries, listeners,
    get url() { return entries[at]; },
    param: (name: string) => new URL(entries[at]).searchParams.get(name),
    back: () => go(-1),
    forward: () => go(1),
    /** Ends the current task: the writes of the next action open their own entry. */
    nextTask: () => Promise.resolve()
  };
}
