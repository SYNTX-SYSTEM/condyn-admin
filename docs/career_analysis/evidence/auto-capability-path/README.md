# Automatic capability-to-job path — frontend evidence (GRÜN)

Owner mandate **SFE::AUTOMATED_CAPABILITY_TO_JOB_EXECUTE** (2026-10-30). GELB built the backend on `backend/auto-capability-path`
(spec `docs/career_analysis/CONDYN_AUTOMATED_CAPABILITY_TO_JOB_2026-10-30.md`). GRÜN built only the frontend of this path, on
`frontend/auto-capability-path`, rebased on GELB's `e5f0908`. No merge, no real Gemini call.

## What the frontend does

| Point | Commit | What |
|---|---|---|
| 2 · source | AC-SOURCE | The GitHub input names an account (`https://github.com/<account>`) besides a repository: label, placeholder and hint in EN and DE; an account is staged titled as an account. The dock does not validate; the server loader decides. |
| §3.5 reads | AC-CONTRACT | Strict decoders and GET readers for `GET …/auto-match` and `GET …/job-ranking` (shapes confirmed by GELB, plus GELB's `formula` field). Bounded wait: one GET at once, then every 2 s while NOT_STARTED/RUNNING, at most 3 min. The ranking is read once the run has settled, or once the wait ends. |
| 3, 4 · display | AC-PANEL | `AutoJobRankingPanel` in the role discovery's slot: the state line in the entry line's language (path · one sentence · one `→` transition, `role="status"` polite, cool colours). Then the ranked jobs: rank, role, organisation, pool, tier, fit, semantic coverage and required gaps. WHY opens each requirement's necessity × weight, source, state, value → contribution, the capability, the model statement, its limitation and the quotes. The evidence class and "Authority: none · a ranking …, not a decision" stand above every ranking shown. |
| 3 · flow | AC-FLOW | For the PERSON result on view the field reads the run, then the ranking, with no input: no pool picker, no role picker, no confirmation, no POST, no URL write. The manual discovery's entry is the panel's last row, unchanged. |
| integration | AC-BACKEND | GELB's pure `buildRoleRanking` (400 seeded discoveries) and `viewOfAutoInvestigation` (144 status × provider × task mixes) decode in the client; each output broken once is refused. |
| guard | AC-BUNDLE | No module reachable from the dashboard by a value import imports `node:*`. This guards the 500 found on `37c51f1`, which GELB fixed at the source in `e5f0908`. |

## Tests and mutants

- `test/career/auto-capability/`, 6 files: a regression test and an inverse test for every run state (NOT_STARTED, DISABLED, RUNNING, COMPLETED, PARTIAL, FAILED, SKIPPED), plus the read states and the display.
- **Mutants:** 20 hand-made mutants of the decoders, the polling, the field wiring, the panel, the copy and the account rule; all 20 are red.
- **Suite:** 125/125 files, 965 passed / 7 skipped. tsc 0. The production build is clean (`next build --webpack`).
- **Named test change:** `discovery-panel-flow` and `discovery-start-flow` record every fetch the field makes. The mandate adds two reads for every PERSON result, on other routes. Those two files therefore hold the two new hooks still (`vi.mock`, IDLE), with their assertions unchanged. The new reads are held by `auto-match-wiring.test.tsx`.

## Browser walk (disposable lab, labelled stand-in only)

`scripts/lab.ts` is the lab:
- `next start` on the production build;
- the real worker, whose Gemini is the loopback stand-in;
- the semantic relations come from the in-process stand-in (`ROLE_DISCOVERY_SEMANTIC_PROVIDER=stand-in`, `ROLE_DISCOVERY_DAY_LIMIT=1000`, `ROLE_DISCOVERY_MAX_ROLES=10`);
- the three `docs/examples/job-pool-tests` pools are uploaded through the real route;
- a network sentinel refuses every non-loopback connection, and its log was never created;
- the database is disposable and dropped on stop.

`scripts/walk.mjs` is the walk.

| Run | Path | Result |
|---|---|---|
| `ac-report.json` · flow | The user picks mode PERSON, opens the Capability Field, enters text and presses ADD, then ANALYZE (6 actions), and gives **no input after ANALYZE**. | The line goes NOT_STARTED (2.0 s) → RUNNING (4.1 s) → PARTIAL · ROLES_BEYOND_BUDGET (6.1 s), and the ranking is AVAILABLE at 6.5 s. The only write is `POST /api/career/analyze`. Evidence class STAND_IN; 73 ranks (22 SEMANTIC, 51 LEXICAL_ONLY); budget 10 of 10 roles checked. |
| `ac-report.json` · views | The result URL on 6 viewports × EN/DE (12 visits). | Line PARTIAL and the ranking in every visit, STAND_IN, 73 ranks, six orbits. The panel overlaps 0 orbit shells and 0 shell elements. WHY opens 9 reasons with their quotes. The manual discovery opens (the automatic panel steps aside) and closes (it returns). 0 writes, 0 page errors, no horizontal scroll. |
| `ac-report.json` · github | The GitHub input, EN and DE. | The placeholder names both shapes; the hint names the automatic choice. |
| `off-report.json` | The lab without a semantic provider. | DISABLED · "no semantic provider configured". A name-relation ranking, evidence NONE, 73 LEXICAL_ONLY. Only `POST /api/career/analyze`. |
| `nopools-report.json` | The lab without pools. | SKIPPED · NO_ACTIVE_POOLS, with the existing GO TO JOB FIELD action. An empty ranking. Only `POST /api/career/analyze`. |

## Not proven here

- **A real GitHub account.** The lab refuses every non-loopback connection, so a real account was not loaded. The account input is covered by the unit tests (GRÜN) and by GELB's loader tests.
- **REAL_GEMINI.** It is shown only as a label, from unit fixtures; there was no paid call.
- **The 3-minute wait.** The wait end for older analyses (NOT_STARTED, waited out) is covered by unit tests only; no older analysis was walked.
