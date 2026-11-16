import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { SyntxFieldSelector, type SyntxCapabilityGatePresentation, type SyntxFieldFocus, type SyntxMappingGatePresentation } from "../../../app/components/career/demo/SyntxFieldSelector";
import { applyCareerDemoEntryClearance } from "../../../app/components/career/demo/career-demo-layout";
import { careerDemoPropsFromSearchParams } from "../../../lib/career/ui/career-demo-url";
import { MAPPING_FIELD_COPY } from "../../../app/components/career/demo/mapping-field-copy";

/**
 * MAP-D-CONTRACT · the re-stated field-selector contract C-1 … C-11 (PERSON_X_JOB_MAPPING_PHASE_D.md §5.1, held by PINK), the URL
 * (C-9) and the entry clearance over both gate lines (D-Q13 (b)). The strip holds three options, CAPABILITY · MAPPING · FIELD; a
 * gated option cannot be selected and states its reason and its way; the MAPPING line is its own element after the capability line.
 */
const capabilityGate: SyntxCapabilityGatePresentation = { state: "JOB", entry: "JOB_MODE" as SyntxCapabilityGatePresentation["entry"], label: "JOB · ◈ CAPABILITY FIELD", reason: "JOB reads the job alone.", way: "→ PERSON brings the person in", action: null };
const mappingGate = (state: SyntxMappingGatePresentation["state"] = "NOT_PERSON"): SyntxMappingGatePresentation =>
  ({ state, label: "JOB ⟶ ◇ MAPPING", reason: MAPPING_FIELD_COPY.en.gate[state].reason, way: MAPPING_FIELD_COPY.en.gate[state].way });
const render = (focus: SyntxFieldFocus, extra: Partial<React.ComponentProps<typeof SyntxFieldSelector>> = {}) => renderToString(
  <SyntxFieldSelector focus={focus} groupLabel="SYNTX FIELD" capabilityLabel="◈ CAPABILITY FIELD" mappingLabel={MAPPING_FIELD_COPY.en.selector} jobLabel="⬡ JOB FIELD" onSelect={() => undefined}
    jobScope={{ state: "NONE", label: "JOB", title: "No job chosen", detail: null, hint: "choose a job" }} {...extra} />);
const tag = (html: string, testId: string) => new RegExp(`<[a-z]+[^>]*data-testid="${testId}"[^>]*>`).exec(html)?.[0] ?? "";
const strip = (html: string) => { const at = html.search(/<div[^>]*data-testid="field-focus-strip"/); return html.slice(at, html.indexOf("</button></div>", at) + "</button></div>".length).replace(/<style>[\s\S]*?<\/style>/g, ""); };
const ids = (html: string) => [...strip(html).matchAll(/<button[^>]*data-testid="([^"]+)"/g)].map(m => m[1]);

describe("MAP-D-CONTRACT · C-1 … C-7, C-11 — the strip", () => {
  it("REPRODUCE C-1 … C-6: one strip, data-field-focus ∈ CAPABILITY | MAPPING | FIELD, exactly three buttons in order, the two existing ids unmoved", () => {
    for (const focus of ["CAPABILITY", "MAPPING", "FIELD"] as const) {
      const html = render(focus);
      expect(html.match(/<[a-z]+[^>]*data-testid="field-focus-strip"/g), "C-1").toHaveLength(1);
      expect(tag(html, "field-focus-strip"), "C-2").toContain(`data-field-focus="${focus}"`);
      expect(strip(html).match(/<button/g), "C-3").toHaveLength(3);
      expect(ids(html), "C-4 / C-5").toEqual(["field-focus-capability-btn", "field-focus-mapping-btn", "job-pool-panel-toggle"]);
      for (const id of ids(html)) {
        const button = tag(html, id);
        const active = (id === "field-focus-capability-btn" && focus === "CAPABILITY") || (id === "field-focus-mapping-btn" && focus === "MAPPING") || (id === "job-pool-panel-toggle" && focus === "FIELD");
        expect(button, `C-6 ${focus} ${id}`).toContain(`data-field-focus-active="${active}"`);
        expect(button, `C-6 ${focus} ${id}`).toContain(`aria-pressed="${active}"`);
      }
    }
    expect(render("FIELD")).toContain(MAPPING_FIELD_COPY.en.selector);
  });

  it("C-7: the job-scope indicator stays a shell element outside the strip", () => {
    const html = render("MAPPING");
    expect(html).toContain('data-testid="job-scope-indicator"');
    expect(strip(html)).not.toContain("job-scope-indicator");
  });

  it("REPRODUCE C-10 / C-11: a gated MAPPING option cannot be selected and states its reason and its way — its own line, its own marker, after the capability line", () => {
    for (const state of ["NOT_PERSON", "NO_ANALYSIS", "NO_RANKING", "NO_POOL"] as const) {
      const html = render("FIELD", { mappingGate: mappingGate(state), capabilityGated: true, capabilityGate });
      const button = tag(html, "field-focus-mapping-btn");
      expect(button, state).toContain("disabled");
      expect(button, state).toContain('aria-disabled="true"');
      expect(button, state).toContain('aria-describedby="mapping-gate-reason"');
      expect(button, state).toContain(`data-field-gate="${state}"`);
      expect(button, state).toContain(`title="${MAPPING_FIELD_COPY.en.gate[state].reason} ${MAPPING_FIELD_COPY.en.gate[state].way}"`);
      const line = tag(html, "mapping-gate-reason");
      expect(line, state).toContain('id="mapping-gate-reason"');
      expect(line, state).toContain(`data-gate="${state}"`);
      expect(line, state).toContain('role="status"');
      expect(line, state).toContain('data-sx-shell="mapping-gate"');
      expect(line, "never the capability line's marker (the entry clearance finds THE line by it)").not.toContain('data-sx-shell="gate-reason"');
      expect(html).toContain(MAPPING_FIELD_COPY.en.gate[state].reason);
      expect(html).toContain(MAPPING_FIELD_COPY.en.gate[state].way);
      expect(html.indexOf('data-testid="capability-gate-reason"'), "DOM order: the capability line first").toBeLessThan(html.indexOf('data-testid="mapping-gate-reason"'));
      expect(html.match(/<[a-z]+[^>]*data-sx-shell="gate-reason"/g), "one capability line").toHaveLength(1);
    }
  });

  it("inverse: an open MAPPING option has no line, no description, nothing disabled; the capability line is unchanged by MAPPING", () => {
    const open = render("CAPABILITY");
    expect(open).not.toContain("mapping-gate-reason");
    const button = tag(open, "field-focus-mapping-btn");
    expect(button).not.toContain("disabled");
    expect(button).toContain('data-field-gate="OPEN"');
    const without = render("FIELD", { capabilityGated: true, capabilityGate }), withMapping = render("FIELD", { capabilityGated: true, capabilityGate, mappingGate: mappingGate() });
    expect(tag(withMapping, "capability-gate-reason")).toBe(tag(without, "capability-gate-reason"));
  });
});

describe("MAP-D-CONTRACT · C-9 — the URL", () => {
  it("REPRODUCE: focus=MAPPING opens the mapping field; FIELD, JOB and POOL stay aliases of FIELD; CAPABILITY stays; anything else is no focus", () => {
    const focus = (value: string | string[] | undefined) => careerDemoPropsFromSearchParams({ focus: value }).fieldFocus;
    expect([focus("MAPPING"), focus("FIELD"), focus("JOB"), focus("POOL"), focus("CAPABILITY")]).toEqual(["MAPPING", "FIELD", "FIELD", "FIELD", "CAPABILITY"]);
    expect([focus("mapping"), focus("MAP"), focus(["MAPPING", "MAPPING"]), focus(undefined)]).toEqual([undefined, undefined, undefined, undefined]);
  });
});

describe("MAP-D-CONTRACT · D-Q13 (b) — the entry clearance over both lines; every pre-existing state identical in effect", () => {
  const root = (lines: Record<string, number | null>, jobTop = 61) => {
    const props: Record<string, string> = {}; const removed: string[] = [];
    const element = (bottom: number) => ({ getBoundingClientRect: () => ({ bottom, top: jobTop }) });
    const node = {
      querySelector: (selector: string) => {
        if (selector === '[data-sx-field="job"]') return lines.job === null ? null : element(0);
        const marker = /data-sx-shell="([a-z-]+)"/.exec(selector)?.[1];
        return marker !== undefined && typeof lines[marker] === "number" ? element(lines[marker] as number) : null;
      },
      style: { setProperty: (name: string, value: string) => { props[name] = value; }, removeProperty: (name: string) => { removed.push(name); } }
    };
    vi.stubGlobal("window", { scrollY: 0 });
    applyCareerDemoEntryClearance(node as unknown as HTMLElement);
    vi.unstubAllGlobals();
    return { value: props["--sx-entry-clear"] ?? null, removed };
  };
  it("the old states first: the capability line alone gives today's value; no line removes the variable; no Job Field removes it", () => {
    expect(root({ "gate-reason": 190.4, job: 0 })).toEqual({ value: `${Math.ceil(190.4 - 61 + 12)}px`, removed: [] });
    expect(root({ job: 0 })).toEqual({ value: null, removed: ["--sx-entry-clear"] });
    expect(root({ "gate-reason": 190, job: null })).toEqual({ value: null, removed: ["--sx-entry-clear"] });
  });
  it("then the new ones: the MAPPING line alone, or both — the intake panel starts below the lower edge of the two", () => {
    expect(root({ "mapping-gate": 170.2, job: 0 })).toEqual({ value: `${Math.ceil(170.2 - 61 + 12)}px`, removed: [] });
    expect(root({ "gate-reason": 190, "mapping-gate": 252.6, job: 0 })).toEqual({ value: `${Math.ceil(252.6 - 61 + 12)}px`, removed: [] });
    expect(root({ "gate-reason": 300, "mapping-gate": 252.6, job: 0 })).toEqual({ value: `${Math.ceil(300 - 61 + 12)}px`, removed: [] });
  });
});
