import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { ANALYSIS, ROLE, UPLOAD, resultBody } from "./fixtures";
import { browser, instance } from "./harness";

/**
 * N-1 B-NAV, GELB point (2): the remount after Back / Forward reads exactly what a reload of the same URL reads — the same GETs,
 * no write request, no analysis submission (so no Gemini path). The field runs with its real read hooks here; the fetch is a spy
 * that answers the analysis result and 404 for everything else (the requests a state leads to are the same on both paths).
 */
vi.mock("react", async (importOriginal) => (await import("./harness")).mockReact(await importOriginal<object>()));

import CareerIntelligenceDemoPage from "../../../app/career/demo/page";
import { SemanticCareerIntelligenceField } from "../../../app/components/career/demo/SemanticCareerIntelligenceField";
import { EMPTY_CAREER_INTELLIGENCE_DATA } from "../../../app/career/demo/demo-data";

const BASE = "http://127.0.0.1/career/demo";
const flush = async () => { for (let i = 0; i < 20; i += 1) await Promise.resolve(); };

function spy() {
  const requests: string[] = [];
  const fetcher = vi.fn(async (input: string, init?: { method?: string }) => {
    requests.push(`${init?.method ?? "GET"} ${input}`);
    if (input === `/api/career/analyses/${ANALYSIS}`) return { ok: true, status: 200, json: async () => resultBody() };
    return { ok: false, status: 404, json: async () => ({ success: false, issues: [{ code: "ERR_NOT_FOUND", message: "not found" }] }) };
  });
  return { requests, fetcher };
}

async function readsOf(mount: () => Promise<{ props: Record<string, unknown> }>, net: ReturnType<typeof spy>) {
  const { props } = await mount();
  const view = instance<Record<string, unknown>>(SemanticCareerIntelligenceField);
  for (let i = 0; i < 6; i += 1) { view.render(props); await flush(); }
  view.unmount();
  return [...net.requests].sort();
}

afterEach(() => { vi.unstubAllGlobals(); });

describe("N-1 · the remount reads what a reload reads (GET only)", () => {
  const query = `focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${UPLOAD}&jobScopeRoleId=${ROLE}&analysisId=${ANALYSIS}`;

  it("guard: same GETs on both paths, no write request, no /api/career/analyze", async () => {
    const reloadNet = spy();
    const tab = browser(`${BASE}?${query}`);
    vi.stubGlobal("window", { ...tab.window, fetch: reloadNet.fetcher });
    vi.stubGlobal("fetch", reloadNet.fetcher);
    vi.stubGlobal("localStorage", { getItem: () => "1", setItem: () => undefined });
    const reload = await readsOf(async () => {
      const page = await CareerIntelligenceDemoPage({ searchParams: Promise.resolve(Object.fromEntries(new URL(tab.url).searchParams)) }) as ReactElement<Record<string, unknown>>;
      return { props: { data: EMPTY_CAREER_INTELLIGENCE_DATA, ...(page.props.initial as object) } };
    }, reloadNet);

    const navNet = spy();
    const back = browser(`${BASE}?${query}`);
    vi.stubGlobal("window", { ...back.window, fetch: navNet.fetcher });
    vi.stubGlobal("fetch", navNet.fetcher);
    const nav = await readsOf(async () => {
      const page = await CareerIntelligenceDemoPage({ searchParams: Promise.resolve({}) }) as ReactElement<Record<string, unknown>>;
      const history = instance<Record<string, unknown>>(page.type);
      history.settle(page.props);
      back.window.history.pushState(null, "", `${BASE}?focus=FIELD`);
      back.back();
      const restored = history.settle(page.props);
      return { props: { ...restored.props, data: EMPTY_CAREER_INTELLIGENCE_DATA } };
    }, navNet);

    expect(reload.length).toBeGreaterThan(0);
    expect(reload).toContain(`GET /api/career/analyses/${ANALYSIS}`);
    expect(nav).toEqual(reload);
    expect(nav.every(request => request.startsWith("GET "))).toBe(true);
    expect(nav.some(request => request.includes("/api/career/analyze"))).toBe(false);
  });
});
