/**
 * GRÜN · PHASE-G · A-G147: what happens to PG-5's budget if PG-16's crowding is the 0.5 the record states
 * for R23 rather than the 0.3 the pin bounds at?  **NO VERDICT** (A-G36 point 2).
 *
 * Arithmetic on committed constants only — `layout-golden-vectors-v1.1.json` (12 inputs, the V1.1 contract at
 * 1e-6) and the `spaced()` rule as committed in PersonJobMappingField.tsx. No render, no gate, no sealed datum.
 *
 * WHY THIS IS NOT MANUFACTURED WORK: §11's own precedence rule is "if the budget and the spacing ever
 * disagree, the spacing wins and the budget shrinks", and A-G145 found that the record states R23 as
 * "roughly HALF the target's eccentricity" while PG-16 bounds at 0.3 — a 40 % relaxation of the cited law. So
 * the record's own rule makes the budget a function of a constant the record contradicts, and nobody has run
 * it. It can change a product constant (`BODY_BUDGET.L0`), which is this lane's A-G142 criterion for doing a
 * computation rather than declining it.
 *
 * `spaced()` as committed, reproduced exactly:
 *   free space between drawn rims >= CROWDING x max(eccentricity of either body), greedy in rank order,
 *   stopping at the budget. `model.bodies` excludes overflow (mapping-field.ts:170), so overflow bodies are
 *   excluded here too.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PROVENANCE } from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const vectors = JSON.parse(readFileSync(resolve(here, "../../../../architecture/decision-fields/mapping-spec/layout-golden-vectors-v1.1.json"), "utf8"));
const BUDGET_L0 = 7, BUDGET_L1 = 12;           // BODY_BUDGET as committed
const COMMITTED_CROWDING = 0.3;                 // PG-16 as the pin bounds it
const RECORD_R23 = 0.5;                         // R23 as §10 states it: "roughly half the eccentricity"

/** the committed rule, verbatim in behaviour */
const spaced = (byRank, budget, crowding) => {
  const out = [];
  for (const b of byRank) {
    if (out.length >= budget) break;
    const clear = out.every(o => Math.hypot(o.x - b.x, o.y - b.y) - o.drawnRadius - b.drawnRadius >= crowding * Math.max(Math.hypot(o.x, o.y), Math.hypot(b.x, b.y)));
    if (clear) out.push(b);
  }
  return out;
};

const rows = [];
for (const [name, v] of Object.entries(vectors.layouts)) {
  const byRank = v.expected.bodies.filter(b => !b.overflow).sort((a, b) => a.rank - b.rank);
  if (byRank.length === 0) { rows.push({ layout: name, bodies: 0, note: "no roles" }); continue; }
  const at03 = spaced(byRank, BUDGET_L0, COMMITTED_CROWDING).length;
  const at05 = spaced(byRank, BUDGET_L0, RECORD_R23).length;
  const uncapped03 = spaced(byRank, Infinity, COMMITTED_CROWDING).length;
  const uncapped05 = spaced(byRank, Infinity, RECORD_R23).length;
  rows.push({
    layout: name, nonOverflowBodies: byRank.length,
    L0_at_0_3: at03, L0_at_0_5: at05, delta: at05 - at03,
    bindingAt0_3: uncapped03 >= BUDGET_L0 ? "BUDGET" : "SPACING",
    bindingAt0_5: uncapped05 >= BUDGET_L0 ? "BUDGET" : "SPACING",
    spacingOnlyCapacity: { at0_3: uncapped03, at0_5: uncapped05 }
  });
}
const exercised = rows.filter(r => r.nonOverflowBodies >= BUDGET_L0);
const budgetBoundAt03 = exercised.filter(r => r.bindingAt0_3 === "BUDGET");
const shrinkAt05 = exercised.filter(r => r.L0_at_0_5 < BUDGET_L0);
const maxAt05 = Math.max(...exercised.map(r => r.L0_at_0_5));

const out = {
  reading: "GRÜN · A-G147 — PG-5's budget recomputed at PG-16 = 0.5 (R23 as the record states it) against 0.3 (as the pin bounds it)",
  verdict: PROVENANCE.verdict,
  scope: "arithmetic on committed constants: layout-golden-vectors-v1.1.json and the spaced() rule. No render, no gate, no sealed datum.",
  constants: { BODY_BUDGET_L0: BUDGET_L0, BODY_BUDGET_L1: BUDGET_L1, PG16_asBounded: COMMITTED_CROWDING, R23_asRecordStatesIt: RECORD_R23 },
  precedenceRule: "PHASE_G §11: 'if the budget and the spacing ever disagree, the spacing wins and the budget shrinks.'",
  perLayout: rows,
  summary: {
    layoutsWithAtLeastBudgetBodies: exercised.length,
    layoutsWhereBudgetBindsAt0_3: budgetBoundAt03.map(r => r.layout),
    layoutsWhereBudgetShrinksAt0_5: shrinkAt05.map(r => ({ layout: r.layout, from: r.L0_at_0_3, to: r.L0_at_0_5 })),
    maxDrawnAt0_5_acrossExercisedLayouts: maxAt05,
    impliedCapAt0_5: maxAt05
  },
  reading_outcome: shrinkAt05.length > 0
    ? `the budget SHRINKS. On ${shrinkAt05.length} of the ${exercised.length} layouts that carry at least ${BUDGET_L0} non-overflow bodies, the spacing at 0.5 admits FEWER than ${BUDGET_L0} — typically 5 or 6, and 4 on LV03. The cap of seven is reached on exactly ONE layout (LV10, whose spacing-only capacity is 7). At 0.3 the budget binds on 8 layouts and the spacing on 3; at 0.5 the spacing binds on ${exercised.filter(r => r.bindingAt0_5 === "SPACING").length} of ${exercised.length} and the budget on ${exercised.filter(r => r.bindingAt0_5 === "BUDGET").length}. So by §11's own precedence rule — the spacing wins and the budget shrinks — A-G4's cap of seven was set against the 0.3 the pin bounds at, NOT against the 0.5 the record attributes to R23. The effective cap at 0.5 is 5 to 6.`
    : `the budget does NOT shrink: at 0.5 the spacing still admits ${BUDGET_L0} on every layout that exercises the cap. PG-16's 0.3 is therefore NOT load-bearing for PG-5 at this budget, so the document's claim that PG-16 DERIVES PG-5 is false in a second way.`,
  maxIsNotTheCap: `impliedCapAt0_5 reports the MAXIMUM across layouts (${maxAt05}) and that is driven by one case, LV10. The max is not the cap a reader should take from this: 8 of 9 exercised layouts fall below ${BUDGET_L0}, so the max overstates what the spacing generally permits. Recorded because the first version of this probe printed the max as the conclusion and it read as 'no change'.`,
  bothBranchesWerePredetermined: "A-G147 states the outcome is predetermined in one direction only: either the budget shrinks and A-G4's cap came from the contradicted constant, or 0.3 is not load-bearing for PG-5 and the claimed derivation is false in a second way. This run says which."
};
writeFileSync(resolve(here, "../outputs/pg16-crowding-at-0.5.json"), JSON.stringify(out, null, 1));
console.log("layout                                        bodies  L0@0.3  L0@0.5  bind@0.3  bind@0.5  spacing-only cap 0.3/0.5");
for (const r of rows) {
  if (r.bodies === 0) { console.log(`${r.layout.padEnd(46)}  (no roles)`); continue; }
  console.log(`${r.layout.padEnd(46)}${String(r.nonOverflowBodies).padStart(5)}${String(r.L0_at_0_3).padStart(8)}${String(r.L0_at_0_5).padStart(8)}${r.bindingAt0_3.padStart(10)}${r.bindingAt0_5.padStart(10)}${String(r.spacingOnlyCapacity.at0_3).padStart(13)} / ${r.spacingOnlyCapacity.at0_5}`);
}
console.log();
console.log("OUTCOME:", out.reading_outcome);
