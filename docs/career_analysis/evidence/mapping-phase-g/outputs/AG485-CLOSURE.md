# A-G485 · phase G closed at PHASE_INT_BASE — the readings, red first

**Verdict: NONE** (A-G36 point 2). These are GRÜN's development readings of GRÜN's own guard change
(`980c77bf`); the adjudication is GELB's.

Every run below was `npm run test:isolated -- <paths>`. That means a disposable database created by
`condyn_test_runner` (least privilege), verified by `global-setup.ts` → `verifyDisposableTestDatabase`
(unchanged, not bypassed), then dropped. The runner's output went to a file with no pipe, and each exit
code is the runner's own.

| # | tree | `PHASE_INT_BASE` | paths | result |
|---|---|---|---|---|
| R | GELB's trial merge `0f94fed3` (= `385214f9` + `7b4d5852`), guard **before** the change | — (open to HEAD) | `architecture.test.ts` | **2 failed / 30 passed**, exit 1: the lib limb and the change-set/merge limb. This is GELB's red, reproduced |
| G1 | `frontend/mapping-phase-g` @ `980c77bf` | `7b4d5852` | PHASE_DIRS | **16 files, 198 / 198**, exit 0 |
| G2 | trial merge + `980c77bf` cherry-picked | `7b4d5852` | PHASE_DIRS | **16 files, 198 / 198**, exit 0 |
| VA | `7b4d5852` + mutant A (a commit touching the component **and** `lib/career/mapping/signs.ts`) + `980c77bf` | mutant A | `architecture.test.ts` | **2 failed / 30 passed**, exit 1. The entry-set limb names `lib/career/mapping/signs.ts` at the mutant commit, and the lib limb sees 3 files where 2 are allowed |
| VB | `7b4d5852` + an evidence-only side branch merged `--no-ff` (mutant B) + `980c77bf` | mutant B | `architecture.test.ts` | **1 failed / 31 passed**, exit 1. Only the merge clause fails, naming the merge commit |

VA and VB are the vacuity check: the closed range still catches a real in-phase violation of each kind.
The mutants and the trial cherry-pick existed only in a throwaway `--shared` clone and were never pushed.
No shared worktree was touched.

**Currency.** `gruen-currency-lapse` now reads README :204, §115's *"16 files, 198 tests, 0 failed;
`architecture.test.ts` 32/32"*, as **LAPSED**, because its referent moved at `980c77bf`. Lapsed means
the warrant is gone, not that the claim is false. At `980c77bf` the figures re-measure the same: G1 gives
198 / 198 over 16 files, and the guard file holds 32 tests (R, VA, VB). The historical section is left
as written.

**PF-13, measure only (owner's ruling, 2026-11-16).** `gruen-pf13-evaluate.mjs` ran at `980c77bf` on the
same harness and the same gate. Its population is derived from `architecture.test.ts` → `PHASE_DIRS`
(`test/career/mapping-field/`, `test/career/mapping-spec/`). It found 16 files and 198 tests: 198
passed, 0 failed. `coverageMatchesPopulation: true`, missing 0, extra 0. The figure moved from 197
(`bce62ea1`) to 198 because one test was added: §115 A-G468 (`3231f52c`). The verdict field stays
**NONE**; closure is an owner item.

**What the change does not cover, stated so the gap is read rather than discovered.** `980c77bf` lies
after the base it declares, because a commit cannot name its own sha. It touches only
`architecture.test.ts` and `phase-base.ts`. It is examined by review, not by the range it closes. B-F6's
host limb and the fixtures/provider limb stay open-ended, as D/E/F left theirs open.
