# What is open, and with whom — current as of 2026-11-16 (§131 pass)

**Verdict: NONE.** This lane takes no product decision (A-G36 point 2). This file **supersedes** the version
at `4b83414e` (2026-11-11), which had become partly stale: two of its three items were settled in practice
and the file did not say so. That version is still readable at that commit.

**State it is measured against:** `frontend/mapping-phase-g` @ `a0475f13`. That is also an ancestor of
`origin/integration/pxj-complete-20261116` @ `4f4534c5`, and the component is byte-identical between
`7b4d5852` and `4f4534c5` (sha256 `ef3ce06a27f9f8a1…`).

---

## The three items of 2026-11-11, and where each stands

### 1 · `CROWDING` 0.3 or 0.5: RULED by GELB on 2026-11-16, stays 0.3

GELB's grounds:
- **The defect was a frame error.** PG-5's budget verdicts were derived at 0.5 while the build runs 0.3.
  The constant itself was never shown to be wrong.
- **At 0.3 the L0 budget is live**, not inert: it binds on 8 of 10 layouts.
- **Moving to 0.5 would be a visible product change nobody ordered.**

The figures below remain as the sensitivity analysis.

GELB offered on 2026-11-16 to adjudicate this rather than route it to the owner. The build is
`export const CROWDING = 0.3`. The record bounds PG-16 at 0.5 (A-G156), and GELB's §4 records that PG-5's
budget was ruled from the 0.5 column.

**What moves.** The figures are in `CROWDING-0.3-TO-0.5-WHAT-MOVES.md`, and they are **current**:
`gruen-pg16-crowding.mjs` and `gruen-pg16-crowding-L1.mjs`, re-run at `a0475f13`, reproduce their committed
outputs **byte for byte**. Their inputs are unchanged since those outputs were written (`96eb62f6`):
- the V1.1 golden vectors: 0 commits;
- `CROWDING`, `BODY_BUDGET` and `spaced()`'s clearance line: hash-identical.

In short:
- At 0.5, 9 of the 11 layouts with roles draw fewer bodies, and none draws more.
- L0 drops from 6…7 to 4…7 (median 6). L1 drops from 6…12 to 4…7.
- The largest proportional loss is on the smallest layout: LV02 goes 6 → 3. That loss comes from spacing,
  not from the budget.

**At both viewports, the same, and that is a property of the code, not a coincidence of two readings.**
Bodies are selected by `spaced()` (`PersonJobMappingField.tsx:500`) in **field units**, before any pixel
quantity exists. The 12 px size floor is applied **afterwards**, to the already-selected set (`:761`,
`sizeFloor(b.drawnRadius, k)`). So `CROWDING` changes **which** bodies are drawn identically at 1920×1080 and
1280×800. What differs by viewport is only the drawn size of the bodies that are selected, and `CROWDING`
does not enter that.

**Not measured:** rendered rim-to-rim gaps in pixels at either value. Where the floor inflates a small body,
the gap as drawn can be smaller than `spaced()` guaranteed in field units. Measuring that needs a render at
a declared build.

### 2 · `TEST_DATABASE_ADMIN_URL`: SATISFIED since 2026-11-11

`.env.local` in this worktree names the disposable test server on `127.0.0.1:5433` (file dated 2026-11-11
20:20). `npm run test:isolated` creates, verifies and drops a database through B-ENTRY on every run. Every
suite figure since then was taken this way.

**`~/.config/condyn/test-db-role.env` is NOT the basis:** it names the shared server on `:5432`, and B-ENTRY
refuses it (`ERR_TEST_DATABASE_ISOLATION_SHARED_SERVER`). GELB measured that refusal on 2026-11-16.

**The seven items it was holding, worked down:**

| | item | status | evidence |
|---|---|---|---|
| 1 | A-G43 · splay re-keying + mutant test | **DONE** | §104 `fd45f45f`: the splay reads `arc.state === "DIFFERENT"`; `field-g-mutant.test.tsx` binds |
| 2 | A-G49 · `data-*` hooks | **DONE** | `28161e77` (§81), in the branch since then; the component carries `data-mapping-halo`, `data-mapping-seat`, `data-required-gaps` |
| 3 | A-G48 · an L2 fixture with a field body | **WITHDRAWN 2026-11-16 (§131). Nothing is owed and nothing may be added** | see §131 below |
| 4 | A-G51 · an L1 fixture that marks a body | **WITHDRAWN 2026-11-16 (§131), same grounds** | see §131 below |
| 5 | the PG-20 mutant's execution | **DONE** | the same `field-g-mutant.test.tsx` as item 1, executed in every PHASE_DIRS run (198/198 at `980c77bf`) |
| 6 | option (3), only if PINK's verdict calls for it | **DORMANT** | no PINK verdict has called for it; the costing exists (`option3-*.json`, `276ef95d`) |
| 7 | A-G206's span declarations for items 3 and 4 | **DISCHARGED 2026-11-16 (§131)** | `fixture-states-*.json` `A_G206_spanDeclaration`; corrected by measurement in `vector-expressibility.json` |

**Why 3, 4 and 7 are not simply "next".** A new fixture collides with MAP-G-ARCH's fixtures limb, *"existing
fixtures only; no provider and no API in anything phase G added"*. That limb was deliberately left
**open-ended** under A-G485, as an ongoing invariant (GELB accepted it on that ground on 2026-11-16). So these
three need **a ruling, not a credential**: whether they are still wanted after integration, and if so, under
which boundary (a MAP-INT-ARCH or an explicit crossing). **GELB first; the owner if GELB routes it.**

### §130 · the boundary question, WORKED BY MEASUREMENT RATHER THAN BY READING — and one sentence of mine above was wrong

~~And any new fixture would now be committed **after** `PHASE_INT_BASE`, which is outside every phase range
(A-G487: closing phase G ended its guard).~~ **WITHDRAWN IN PLACE 2026-11-16. That sentence is false, and it
is false in the direction that would have let a fixture through.** It conflates two limbs with different
ranges. The change-set limb uses `changedInG` = `changedInRange(phaseGBase(), phaseIntBase(), …)`, which is
**closed** and indeed cannot see a post-base commit. The *fixtures* limb uses `changedSinceG`, which is
**open-ended** — `git diff <base> -- <paths>` against the **working tree** plus
`git ls-files --others` — so it sees a new fixture **immediately, before any commit at all**. The commit
range is irrelevant to it.

**MEASURED, not reasoned.** Build `9b57319d`, clean tree, disposable database on `127.0.0.1:5433` via
`npm run -s test:isolated`, `architecture.test.ts` run alone, two peer lanes active:

| experiment | what was added | result |
|---|---|---|
| baseline | nothing | **32/32 passed**, exit 0 |
| 1 | an A-G48-shaped fixture appended to `test/career/mapping-field/support.ts`, **uncommitted** | **3 limbs FAIL** |
| 2 | an A-G51-shaped fixture in a **new** file `test/career/mapping-field/support-g.ts`, uncommitted | **32/32 passed** |

**The answer is (b), and the collision is wider than this file claimed.** A fixture added where this lane's
fixtures actually live trips **three** assertions, not one — all with `expected [ Array(1) ] to deeply equal []`:

- `MAP-E-ARCH · B-7: existing test data only — no fixture or support module added or changed`
- `MAP-F-ARCH · B-F7: existing fixtures only; no provider and no API in anything phase F added`
- `MAP-G-ARCH · existing fixtures only; no provider and no API in anything phase G added` (`architecture.test.ts:406`)

The tripping assertion is the **first** limb of each, the path-set comparison at `:407`
(`changedSinceG("test/career/mapping/fixtures.ts", "test/career/mapping-field/support.ts",
"test/career/mapping-field/support-d.ts", ":(glob)test/**/fixtures/**")`). The *second* limb — the
provider/API scan over added lines — is not implicated: a fixture adds no provider and no API. **The authority
needed is therefore an amendment to the path set of all three limbs, or an explicit crossing that exempts the
named file; and E's and F's limbs are not phase G's to amend.** That is a wider authority than this file
previously described, and it is GELB's to route, not this lane's to take.

**GELB has already ruled, and the ruling stands unaffected by the above:** *deferred until PINK's verdict is
in*, so the shared ground truth does not move during an in-flight validation (see the table below). The
measurement does not reopen that; it corrects **why**, and it means the fixtures could not have been added
quietly even if nobody had ruled.

**AND IT NAMES A GAP NOBODY LISTED — F-G5, outcome (c) holding at the same time as (b).** Experiment 2 passed
**32/32**: the three limbs guard a **path list**, not the category *"a fixture"*. A fixture placed in a new
file beside the existing ones — `support-g.ts`, or any name not matching those three literals or
`test/**/fixtures/**` — is **invisible to every one of them**, uncommitted or committed. So the boundary that
blocks A-G48/A-G51 blocks the honest placement and not the evasive one, and it reads as a clean pass. This is
reported, not exploited: the fixtures are **not** being added by that route. Closing it means widening the
limbs to the directory (`:(glob)test/career/mapping-field/support*.ts`, or the category as `§95` does for the
evidence directory) and that is the owning lane's amendment to make, not this lane's.

**NO VERDICT** (A-G36 point 2): the figures above are development readings from this lane's own gate run.
PINK holds the verdict, and nothing here closes a pin.

### §131 · A-G48, A-G51 AND A-G206 WORKED TO A VERDICT — AND THE ANSWER IS THAT TWO OF THE THREE WERE NEVER FIXTURES

**§130 established that a fixture here trips THREE limbs and that E's and F's are not phase G's to amend, and
then stopped at the boundary question. That was the wrong question to stop on.** Re-read from the record
rather than from the carried summary, what each one ASSERTS is this:

| | what it actually asserts | verdict |
|---|---|---|
| **A-G48** | PG-10's carrier is `.mf-wave-halo` + a negative limb on the resting shelf glows; **and** *"the fixture must place a field body at L2 so the level is measurable"* | the carrier decision was taken and has paid out (§29: PG-10's limbs roughly doubled, as predicted). The FIXTURE half is **WITHDRAWN** |
| **A-G51** | *"PG-18 has no satisfier at L1 and that is a build gap"* — **already withdrawn by GELB at A-G90** on a contaminated count (nineteen "beams" were nineteen arcs, one `[data-beam]` selector matching both). Residue: an L1 that marks a body | **WITHDRAWN**, and it has been since §29. It was carried as open after its own withdrawal |
| **A-G206** | *"a fixture declares the spec's range, its own realised range, and the gap, before it is used"* | **DISCHARGED** |

**THE GROUND FOR WITHDRAWING THE TWO FIXTURE HALVES IS A-G373, AND IT IS GELB'S OWN RULING.** `fieldLevel()`
derives the level from the focus machine and `markedBody()` reads `state.selection`, so **L1, L2 and a marked
body are STATES of the already-served fixture.** Both were navigated at both viewports and are recorded with
`reached: true`, each confirmed from the product's own disclosure *before* anything was read in it:

```
fixture-states-1920x1080.json  "L1 · a pool open (A-G51)"       reached: true
                               "L2 · a FIELD body open (A-G48)"  reached: true, role …:role_platform, data-shelf=false
fixture-states-1280x800.json   both, likewise
```

**So there is nothing to add to `test/career/mapping-field/support.ts`, and therefore no limb to amend for
these items.** The three-limb collision §130 measured is real and is NOT a blocker on A-G48/A-G51: it was a
blocker on a fixture neither of them needs. The items leave this list.

**A-G206 is discharged rather than owed, and the reason is the stronger half.** The declaration was made
(`A_G206_spanDeclaration`: four focus states of ONE population, five bodies, 2 field / 3 shelf; *does not
span* LV01–LV12, L3 or any raster quantity; *what widens it* a façade route serving `layoutInputs()`), and
then its **negative half was TRIED rather than asserted** — which is A-G380, this lane's own rule. Trying it
refuted it: `decodeRequirement` enforces `weight === NECESSITY_WEIGHT[necessity]` and `value === VALUE[state]`,
so **9 of 12 are servable and 61 of 1412 roles cannot be expressed at all — a contract limit.** The façade was
reverted. A declaration that was made, used, and corrected by measurement is a discharged obligation.

**WHAT IS STILL OWED IS NOT A FIXTURE, AND IT IS TWO MEASUREMENTS.** A-G48 says PG-10 at L2 reads NOT RUN
*"until the fixture places a field body"*, and the state now exists — but **no pixel reading has been taken in
it.** Measured, by looking rather than assuming: `outputs/` holds `glow-{1920x1080,1280x800}.json` (L0),
`pg11-guard-L0-*` and `pg11-guard-L2-*`, and **no `glow` reading at L2 and no `pg11-guard-L1-*` whatsoever**.
`gruen-pg11.mjs`'s own header still says *"L1 NOT RUN until A-G51's fixture marks a body"* — a condition that
is now satisfied and that nothing has acted on. **Boundary: both need Playwright on a production build, and
rebuilding `.next` in this worktree is forbidden** (it destroys the `BUILD_ID` every phase-G figure is framed
on). The cost is one build in a disposable worktree plus two probes at two viewports; it is not a decision.

**AND ONE THING §130's TABLE DID BLOCK HONESTLY IS NOW CLOSED (F-G5, F-G9).** The three fixtures limbs guarded
three literal paths while their sentences name a category, so the honest placement failed and the evasive one
passed 32/32. Phase G's limb now guards the category with the category itself checked three ways; E's and F's
are not widened, and the reason is measured rather than jurisdictional — widening them reddens on
`test/support/mapping/vectors.ts`, which phase G's entry set authorises and phase E and phase F never ruled on.
See `test/career/mapping-field/architecture.test.ts` §131 and README §131.

### 3 · a local build and server: PERMITTED IN PRACTICE since 2026-11-10

- The preserved stand (`:3220` → `:3221`, BUILD_ID `HRYkeEpbpndI3UEE7ceeC`) and the hooked stand (`:3230` →
  `:3231`, `utpaUMQpafZVzAeyYImhv`) have both been running since 2026-11-10/11, loopback-only.
- PG-23's second limb, which was the reason this item existed, was delivered: `pg23-computed-*.json`.

Nothing remains to decide here.

---

## What genuinely remains open, by owner

| item | with | state |
|---|---|---|
| `CROWDING` 0.3 / 0.5 | GELB | **RULED 2026-11-16: stays 0.3.** The 0.5 column remains a recorded sensitivity analysis, never again the basis of a verdict. One limb stays open: rendered px rim gaps, which belong to the pixel trace |
| A-G48 / A-G51 / A-G206 fixtures | **CLOSED** | **§131, 2026-11-16: all three leave this list.** A-G48 and A-G51 are WITHDRAWN as fixture obligations — the states were never data (A-G373) and both were navigated at both viewports; there is nothing to add to `support.ts`, so no boundary needs amending for them. A-G206 is DISCHARGED: the declaration was made and then corrected by trying its negative half (A-G380). What remains is not a fixture but **two measurements**, bounded below |
| PG-10 at L2 with a field body · PG-11/PG-18 at L1 with a marked body | this lane, on a build | **OPEN with a measured boundary (§131).** Both STATES are reached and recorded (`fixture-states-{1920x1080,1280x800}.json`, `reached: true`, confirmed from `data-level`/`data-role`/`data-marked` before anything was read in them). Neither PIXEL reading has been taken in them: there is no `glow-*` reading at L2 and no `pg11-guard-L1-*` at all. Both need Playwright on a production build, and **this worktree's `.next` is sealed** — rebuilding it destroys the `BUILD_ID` every phase-G figure is framed on. Cost: one build in a disposable worktree, two probes, two viewports |
| A-G487 · MAP-INT-ARCH or not | **owner** | scope decision: needed only if work continues on the integration tip |
| PF-13 closure | **owner** (ruled measure-only 2026-11-16) | measured at `980c77bf`: 16 files, 198/198, coverage matches both ways; verdict field NONE |
| PG-14 | **CLOSED on this lane's half (§131); the glyph-metric half stays PINK's** | The restated content (A-G271: the CONVERGENCE of the solve, not the containment) is now ASSERTED, in three states, from the product's own unconditional disclosure — `field-g.test.tsx` §131, four mutants killed. The 440-case arithmetic sweep is CURRENT at this build and now carries one: `pg14-frame-fixed.json` `frame`. Residue, bounded: (i) real glyph advance — this route models it as `chars x em` and says so, PINK's browser route sees it; (ii) the left-anchored `n more` label's asymmetric reservation has **no carrier on any reachable population** — asserted zero at L0/L1/L2 with the reason in the quantity the emit condition actually tests; (iii) 136 of 440 cases exceed the half-pixel tolerance, all at names of 48-128 characters and all at the pass cap, where the product emits `data-frame-converged="false"` |
| the 8 seals' build referent | this lane | **delivered and accepted by GELB (A-G489)**, see README §96c; the seals stay stale against HEAD |
| PG-11's relation limb | GELB's sentence, this lane's readings | **dated** (README §96c); GELB re-dated §89 on 2026-11-16 |
