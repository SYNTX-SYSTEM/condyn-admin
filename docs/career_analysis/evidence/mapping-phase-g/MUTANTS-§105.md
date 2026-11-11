# §105 · The mutant executions — GRÜN

**NO VERDICT** (A-G36 point 2). Each mutation was applied to the working tree, run, and reverted; `git status
--porcelain` was verified clean after every one. GELB specified the four below in §108 and ruled option (3) off
this queue (it is a product decision with a measured cost, not a test to execute).

**The template, adopted from A-G43's:** apply · prove it fails · revert · prove it passes. A mutant that passes
on both forms proves nothing.

| mutant | mutation | expected | result |
|---|---|---|---|
| **A-G43** sensitivity | implementation: `arc.state === "DIFFERENT"` → `s.mark === "counterTick"` | assertion goes **RED** | **KILLED** |
| **PG-20** robustness | sign table: `couplingStates.DIFFERENT.mark` → `"none"` | assertion stays **GREEN** | **KILLED** (survives on new, fails on old) |
| **PG-5** | `if (out.length >= budget) break;` removed from `spaced()`; `BODY_BUDGET` untouched | drawn ≤ budget goes **RED** | **KILLED** |
| **PG-15** | the field ring moved to the last SVG child, so it draws **in front of** every body | occlusion assertion goes **RED** | *** SURVIVED *** |
| **PG-16** | the *filter* in `spaced()` loosened to `0.2 ×` eccentricity; exported `CROWDING` left at `0.3` | the ≥ 0.3 assertion goes **RED** | **KILLED** |

## A-G43 / PG-20 — one file, two mutations of different kinds

`test/career/mapping-field/field-g-mutant.test.tsx`. The sign-table mock is permanent in every run (that is
PG-20's mutation); the implementation revert is separate (that is A-G43's). The 2×2 has three distinct outcome
patterns and each assertion fails in exactly one cell:

| | real table | mutated table |
|---|---|---|
| **state-keyed** | `noCounterTick` FAIL, `splay` pass | `noCounterTick` pass, `splay` pass ← **PG-20 robustness** |
| **mark-keyed** | `noCounterTick` FAIL, `splay` pass | `noCounterTick` pass, `splay` **FAIL** ← **A-G43 sensitivity** |

The fourth cell is determined and duplicates the first's pattern, because `noCounterTick` depends only on the
table and `splay remains` separates the implementations **only when the table is mutated**. Row 1 is what proves
the mock is not inert: without it, `splay remains` passes under *both* implementations. Measured figures on the
mark-keyed form: DIFFERENT's end lengths `9.994517` / `9.994913` against a radial reference of `9.994517` — a
splay of exactly zero.

## PG-5 — killed, and the population that licenses it is not the candidate count

`expected 9 to be less than or equal to 7`. The fixture is `crowdedRoles(30, POOL_A) + standardRoles()`, and the
test already carries its own population guard: *"precondition: more bodies have room than L0 draws"*.

> **But the number that licenses this mutant is 9, not 30.** With the budget's `break` removed, the CROWDING
> filter still limits placement — to **9** bodies, against a budget of **7**. So the effective population for
> testing a bound of 7 is the count the *other* filter admits, not the count the fixture offers. Had crowding
> admitted ≤ 7, the mutation would have produced a **false green with an apparently healthy fixture**. That is a
> sharper form of GELB's trap than "the fixture has too few candidates", and the margin here is 2.

## PG-15 — *** THE MUTANT SURVIVED, AND THAT IS THE FINDING ***

The field ring was moved to the last SVG child, so it draws **in front of every body** — the exact condition
PG-15 forbids. **All 16 files and 196 tests passed.**

Checked before and after by two routes. Statically: every assertion mentioning a ring across the whole
population covers the ring itself, its own seat (`field-f.test.tsx:116`, the F-6 firewall), its `data-breath`
attribute, or arcs inside the role's requirement ring — a different element from the four field rings. **None
compares a ring's position to a body's.** Empirically: the mutation above.

> **So PG-15's ordering is unguarded in the structural test layer.** It is guarded only by the browser
> instrument's pixel occlusion, which needs a build and is this lane's reading rather than a test. GELB asked
> that a structural assertion be reported rather than quietly converted; **the honest answer is stronger — there
> is no assertion to convert.**

## PG-16 — killed, and A-G267's structure is confirmed rather than removed

`Role 002/Role 006: expected false to be true`. The filter admitted a pair the pin forbids once the two
expressions were made to differ.

**A-G267 stands exactly as written.** In the unmutated product the pin's predicate and `spaced()`'s filter are
one expression over the same operands, so the test measures the filter and `CROWDING`'s value is unfalsifiable
*at 0.3, at 0.5, or at any value* — mutating the constant moves both sides. This mutant shows the assertion is
**live** when the two differ; it does not show the constant is falsifiable, and it cannot.

**One figure I cannot give:** GELB asked for the admitted-pair count. The assertion is inside a nested loop that
throws on the first failure, so the observable count is **≥ 1**, not *N*. Reported as the bound it is rather
than the number it is not.

## Owed

These five were applied and reverted **by hand**, with `git status` checked after each. A harness that does
apply · run · revert for all five and asserts the tree is clean would make them reproducible rather than
reported — and it is exactly the kind of verification code §100 found to be the least examined in either lane,
so it needs the tree-clean assertion in a `finally`, not in a comment.
