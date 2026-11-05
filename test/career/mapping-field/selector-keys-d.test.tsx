import React from "react";
import { describe, expect, it, vi } from "vitest";
import { MAPPING_FIELD_COPY } from "../../../app/components/career/demo/mapping-field-copy";

/**
 * MAP-D-CONTRACT · C-8 (PERSON_X_JOB_MAPPING_PHASE_D.md §5.1 as corrected 3590dd2f): the strip keeps select-on-arrow. ←/→ move by
 * one position AND select, stepping over a gated option; Home selects CAPABILITY, End the JOB FIELD. A gated target selects nothing.
 */
vi.mock("react", async (importOriginal) => (await import("../pxj-first-screen/harness")).mockReact(await importOriginal<object>()));
import { instance } from "../pxj-first-screen/harness";
import { SyntxFieldSelector, type SyntxFieldFocus, type SyntxMappingGatePresentation } from "../../../app/components/career/demo/SyntxFieldSelector";

type Props = React.ComponentProps<typeof SyntxFieldSelector>;
type Element = React.ReactElement<Record<string, unknown>>;
const gate: SyntxMappingGatePresentation = { state: "NOT_PERSON", label: "JOB ⟶ ◇ MAPPING", reason: MAPPING_FIELD_COPY.en.gate.NOT_PERSON.reason, way: MAPPING_FIELD_COPY.en.gate.NOT_PERSON.way };
function buttons(node: unknown, out: Element[] = []): Element[] {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) { for (const child of node) buttons(child, out); return out; }
  const element = node as Element;
  if (element.type === "button" && typeof element.props["data-testid"] === "string" && /^(field-focus-|job-pool-panel-toggle)/.test(element.props["data-testid"] as string)) out.push(element);
  buttons(element.props?.children, out);
  return out;
}
function keys(focus: SyntxFieldFocus, key: string, extra: Partial<Props> = {}): SyntxFieldFocus[] {
  const selected: SyntxFieldFocus[] = [];
  // The MAPPING line's measurement listens to the viewport (a layout effect; the harness runs it like an effect).
  vi.stubGlobal("window", { addEventListener: () => undefined, removeEventListener: () => undefined });
  const view = instance<Props>(SyntxFieldSelector);
  const tree = view.settle({ focus, groupLabel: "G", capabilityLabel: "C", mappingLabel: "M", jobLabel: "J", onSelect: next => selected.push(next), ...extra });
  const all = buttons(tree);
  expect(all.map(b => b.props["data-testid"])).toEqual(["field-focus-capability-btn", "field-focus-mapping-btn", "job-pool-panel-toggle"]);
  (all[0].props.onKeyDown as (e: unknown) => void)({ key, preventDefault: () => undefined });
  view.unmount();
  vi.unstubAllGlobals();
  return selected;
}

describe("MAP-D-CONTRACT · C-8 — one position and select; a gated option stepped over; Home and End select the ends", () => {
  it("REPRODUCE: → from CAPABILITY selects MAPPING, → from MAPPING selects FIELD, ← steps back; Home → CAPABILITY, End → FIELD", () => {
    expect(keys("CAPABILITY", "ArrowRight")).toEqual(["MAPPING"]);
    expect(keys("MAPPING", "ArrowRight")).toEqual(["FIELD"]);
    expect(keys("FIELD", "ArrowLeft")).toEqual(["MAPPING"]);
    expect(keys("MAPPING", "ArrowLeft")).toEqual(["CAPABILITY"]);
    expect(keys("MAPPING", "Home")).toEqual(["CAPABILITY"]);
    expect(keys("MAPPING", "End")).toEqual(["FIELD"]);
  });
  it("a gated option is stepped over; at an end, or with only gated options beyond, nothing is selected; Home onto a gated CAPABILITY selects nothing", () => {
    expect(keys("CAPABILITY", "ArrowRight", { mappingGate: gate })).toEqual(["FIELD"]);
    expect(keys("FIELD", "ArrowLeft", { mappingGate: gate })).toEqual(["CAPABILITY"]);
    expect(keys("FIELD", "ArrowLeft", { mappingGate: gate, capabilityGated: true })).toEqual([]);
    expect(keys("FIELD", "ArrowRight")).toEqual([]);
    expect(keys("CAPABILITY", "ArrowLeft")).toEqual([]);
    expect(keys("FIELD", "Home", { capabilityGated: true })).toEqual([]);
    expect(keys("CAPABILITY", "Enter")).toEqual([]);
  });
});
