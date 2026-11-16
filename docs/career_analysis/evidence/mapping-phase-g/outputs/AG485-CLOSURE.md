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

## Test provenance: where each reading ran, and the one deviation from a real checkout

| reading | where | `node_modules` |
|---|---|---|
| G1 and PF-13 | `condyn-admin-mapping-d` itself, at `980c77bf` | **the worktree's own real directory** |
| R, G2, VA, VB | throwaway `git clone --shared` in GRÜN's session scratchpad | **a SYMLINK** to a `cp -a` copy of mapping-d's `node_modules` (that copy lived in a git-archive build export, also in the scratchpad) |

**The deviation, and why it matters in general.** Turbopack refuses a symlinked `node_modules`:
`TurbopackInternalError: Symlink [project]/node_modules is invalid, it points out of the filesystem root`.
So **any test that boots a Next server fails in such a tree for a reason that is not the code.** PINK had
already documented this on `origin/validation/hr-decision-loop-pink`, checked by GRÜN at that ref:
- `evidence/integration-main-5ca0f3f/verdicts.txt:34` (O-PB-4) and `measurements.txt:133`, with the
  exact error string;
- `evidence/mapping-phase-e-contract/prep.txt:21`;
- `evidence/mapping-phase-g-contract/prep.txt:19`, where `node_modules` was copied with `cp -a`,
  deliberately not hardlinked or symlinked.

All three paths are under `docs/architecture/decision-fields/`. GELB hit it in its own probe worktree on 2026-11-16 (§11.17), where three
files failed that pass on a real copy. **GRÜN did not know this when building the clone, and did not
read PINK's note first.**

**Why these four readings are unaffected, by inspection rather than by assumption.** No file in the
population (`test/career/mapping-field/`, `test/career/mapping-spec/`) contains `next start`, `next dev`,
`spawn(`, `createServer`, a Next server import or `playwright`. Checked by grep at `980c77bf`: 0 hits. So
no reading here can have depended on a Next server booting. The results are also directionally
consistent with that:
- G2 passed **all** 198, so the symlink cannot have hidden a failure.
- VA and VB failed **exactly** the assertions their mutants targeted, naming the mutant paths and shas,
  not a Turbopack error.

**The limit, stated.** This covers the mapping population only. A reading over the full suite, or over
anything that starts Next, would **not** be valid in that clone. None was taken there: the full-suite
figure in GRÜN's recovery report (27 failed / 3642 passed at `7b4d5852`) ran in mapping-d with real
`node_modules`.

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
