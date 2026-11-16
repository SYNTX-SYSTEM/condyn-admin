# What is open, and with whom — current as of 2026-11-16

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
| 3 | A-G48 · an L2 fixture with a field body | **OPEN, now blocked by a boundary, not a credential** | see below |
| 4 | A-G51 · an L1 fixture that marks a body | **OPEN, same block** | see below |
| 5 | the PG-20 mutant's execution | **DONE** | the same `field-g-mutant.test.tsx` as item 1, executed in every PHASE_DIRS run (198/198 at `980c77bf`) |
| 6 | option (3), only if PINK's verdict calls for it | **DORMANT** | no PINK verdict has called for it; the costing exists (`option3-*.json`, `276ef95d`) |
| 7 | A-G206's span declarations for items 3 and 4 | **OPEN, follows 3 and 4** | — |

**Why 3, 4 and 7 are not simply "next".** A new fixture collides with MAP-G-ARCH's fixtures limb, *"existing
fixtures only; no provider and no API in anything phase G added"*. That limb was deliberately left
**open-ended** under A-G485, as an ongoing invariant (GELB accepted it on that ground on 2026-11-16). And any
new fixture would now be committed **after** `PHASE_INT_BASE`, which is outside every phase range (A-G487:
closing phase G ended its guard). So these three need **a ruling, not a credential**: whether they are still
wanted after integration, and if so, under which boundary (a MAP-INT-ARCH or an explicit crossing). **GELB
first; the owner if GELB routes it.**

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
| A-G48 / A-G51 / A-G206 fixtures | GELB | **RULED 2026-11-16: DEFERRED until PINK's verdict is in**, so the shared ground truth does not move during an in-flight validation. If still wanted afterwards, they go under MAP-INT-ARCH, plus an `AUTHORISED_CROSSINGS` entry for any that touches product code |
| A-G487 · MAP-INT-ARCH or not | **owner** | scope decision: needed only if work continues on the integration tip |
| PF-13 closure | **owner** (ruled measure-only 2026-11-16) | measured at `980c77bf`: 16 files, 198/198, coverage matches both ways; verdict field NONE |
| PG-14 | **PINK**, or the owner | RESTATED/UNVERIFIED; not this lane's |
| the 8 seals' build referent | this lane | **delivered and accepted by GELB (A-G489)**, see README §96c; the seals stay stale against HEAD |
| PG-11's relation limb | GELB's sentence, this lane's readings | **dated** (README §96c); GELB re-dated §89 on 2026-11-16 |
