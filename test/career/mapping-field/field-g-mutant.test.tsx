import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";
import { browser, instance } from "../pxj-first-screen/harness";
import { CAPS, available, projectionOf, rankingOf, watchOf } from "./support";
import { allStates } from "./support-d";

/**
 * MAP-G-MUTANT · A-G43's required mutant (PHASE_G, "PG-20's splay is not redundancy — it must key on the
 * state, not the mark").
 *
 * THE DEFECT A-G43 NAMED: the splay keyed on `s.mark === "counterTick"` — the same predicate as the glyph it
 * reinforces. Remove the counterTick and BOTH carriers vanish together, while a test asserting
 * "counterTick => splay" still passes. PG-20 exists to give a second, NON-SYMBOLIC carrier for a question
 * whose symbol might be missed, so a reinforcement that cannot survive its symbol's removal is not redundancy
 * against that symbol — it is a second rendering of it.
 *
 * THE MUTANT A-G43 REQUIRED, verbatim: "the test must assert the splay SURVIVES THE MARK'S REMOVAL — a mutant
 * that deletes the counterTick and expects the splay to remain."
 *
 * HOW THIS AVOIDS NEEDING THE ARC'S CENTRE. With splay = 0 an end line runs from r - tick/2 to r + tick/2
 * along one radius, so its length is exactly `tick`. With a splay the outer point moves off that radius and
 * the segment becomes a longer chord. Both arcs compared here sit on the SAME ring of the SAME role, so they
 * share r and therefore tick — and NONE is the sign table's other open-line state, which A-G43's own text says
 * "keeps its ends radial". So NONE's end length is the radial reference and DIFFERENT's must exceed it. No
 * centre, no transform, no geometry assumption beyond the two arcs sharing a ring, which `allStates` fixes by
 * putting every coupling state on one role.
 *
 * WHY THIS FILE IS THE PROOF AND NOT A RESTATEMENT (A-G35): it FAILS on the mark-keyed form. That was verified
 * by reverting the product change and re-running — the mutation check is in §104's record, not merely claimed
 * here. A mutant test that passes on both forms proves nothing.
 */
vi.mock("react", async (importOriginal) => (await import("../pxj-first-screen/harness")).mockReact(await importOriginal<object>()));
/** The mutation: DIFFERENT loses its glyph. Everything else in the table is untouched. */
vi.mock("../../../docs/architecture/decision-fields/mapping-spec/sign-table.json", async (importOriginal) => {
  const real = ((await importOriginal<{ default: Record<string, unknown> }>()).default) as {
    couplingStates: Record<string, { mark: string }>;
  };
  const mutated = JSON.parse(JSON.stringify(real)) as typeof real;
  mutated.couplingStates.DIFFERENT.mark = "none";
  return { default: mutated };
});
import { PersonJobMappingField, type PersonJobMappingFieldProps } from "../../../app/components/career/demo/PersonJobMappingField";

type Tree = ReactElement<Record<string, unknown>>;
function all(node: unknown, match: (e: Tree) => boolean, out: Tree[] = []): Tree[] {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) { for (const child of node) all(child, match, out); return out; }
  const element = node as Tree;
  if (match(element)) out.push(element);
  all(element.props?.children, match, out);
  return out;
}
const len = (e: Tree) => Math.hypot(Number(e.props.x2) - Number(e.props.x1), Number(e.props.y2) - Number(e.props.y1));
const endsOf = (tree: unknown, state: string) => {
  const groups = all(tree, e => e.props?.["data-mapping-arc"] === true && e.props?.["data-state"] === state);
  return groups.flatMap(g => all(g.props.children, e => e.props?.["data-arc-end"] === true));
};

let tab: ReturnType<typeof browser>;
beforeEach(() => {
  tab = browser("http://127.0.0.1/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=CAN_00000000000000000000000000000002");
  vi.stubGlobal("window", tab.window);
  vi.stubGlobal("fetch", async () => ({ status: 500, json: async () => ({}) }));
});
afterEach(() => { vi.unstubAllGlobals(); });
const props = (): PersonJobMappingFieldProps => ({ locale: "en", projection: projectionOf(CAPS), ranking: available(rankingOf([allStates()])), watch: watchOf("COMPLETED") });

describe("MAP-G-MUTANT · A-G43 / PG-20 — the splay survives the mark's removal", () => {
  it("the mutation took: with DIFFERENT's mark set to none, NO counterTick is drawn anywhere", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    const ticks = all(tree, e => e.props?.["data-arc-mark"] === "counterTick");
    expect(ticks, "the glyph is gone — otherwise this file is not testing a mutant at all").toEqual([]);
    const differentGroups = all(tree, e => e.props?.["data-mapping-arc"] === true && e.props?.["data-state"] === "DIFFERENT");
    expect(differentGroups.length, "a DIFFERENT arc must be drawn, or the assertions below pass over nothing").toBeGreaterThan(0);
    expect(differentGroups[0].props["data-mark"], "the group reports the mutated mark").toBe("none");
    view.unmount();
  });

  it("A-G43: the SPLAY REMAINS without the glyph — DIFFERENT's ends are longer than radial, NONE's are radial", () => {
    const view = instance<PersonJobMappingFieldProps>(PersonJobMappingField);
    const tree = view.settle(props());
    const different = endsOf(tree, "DIFFERENT"), none = endsOf(tree, "NONE");
    expect(different.length, "DIFFERENT draws two open ends").toBe(2);
    expect(none.length, "NONE draws two open ends — the radial reference").toBe(2);
    /* `fixed()` rounds every emitted coordinate, so two genuinely radial ends agree to rounding and not to
       the bit — measured at 3.95e-4 apart on a length near 10. The tolerance here is that rounding floor and
       the splay margin below is three orders above it, so neither assertion rests on the other's slack. */
    const ROUNDING = 0.01;
    const radial = Math.min(...none.map(len));
    expect(radial, "the radial reference has a real length").toBeGreaterThan(1);
    for (const e of none) expect(len(e), `NONE keeps its ends radial (${none.map(len).join(", ")})`).toBeCloseTo(radial, 2);
    for (const e of different) {
      expect(len(e) - radial, `DIFFERENT's end must exceed the radial reference by far more than rounding — radial ${radial}, different ${different.map(len).join(", ")}`).toBeGreaterThan(ROUNDING * 10);
    }
  });
});
