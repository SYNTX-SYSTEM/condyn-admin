# Runtime status after GELB background-shell cleanup (2026-10-29)

Owner mandate: reconstruct GELB's three long-running background shells, end orphaned or finished test processes, clean their temporary resources, keep services, port 3017, data and Git unchanged.

| Shell | What it was | Activity | Action |
|---|---|---|---|
| `be1djk9qq` | video-lab launcher, live-Gemini lab :41862 on 49e2bc6 (7 d 21 h), disposable source DB with the one real result copy | idle since 2026-10-22 (last request), budget 8 | Source DB dumped first (custom-format `pg_dump`, 2 analyses, 124 table-data entries, private scratchpad), then SIGTERM to the launcher PID only (cwd and script verified); launcher stopped server and worker and dropped its DB |
| `bnrsmwm9y` | acceptance-lab :41878, production build of c670b74 (superseded by main) | 15 min, no use left | SIGTERM to the launcher PID (verified), launcher dropped its copy DB |
| `bvc7ki2ps` | acceptance-lab :41872, production build of b77c851, owner acceptance copy | idle since 2026-10-23, owner visual acceptance pending | KEPT running (owner service); its worktree `wt6` kept |

Also removed: four clean scratch worktrees whose HEADs are contained in origin (wt7, wt8, wt-int, wt-docs).

Unchanged: :3017 (owner demo, Codex branch 175c481), all Git branches and `main` (ddf356f), all data in the shared condyn database, the 31 other `condyn_test_*` databases (not created by these shells; incl. the two old ones awaiting an owner decision).

Not GELB's shells, observed only, not touched: lab chains of other sessions (three-modes `modes-lab.ts` 8 d, a `tsx` chain 10 d, hr-decision-loop-local on :3017's worktree). Owner to decide.

Recovery of the preserved Gemini result source: restore the dump into a fresh disposable database; no new Gemini call is needed.

## 2 Completion (owner "Laufzeitbereinigung autonom abschliessen", 2026-10-29)

**:41872 acceptance lab (b77c851).** Preserved before stopping: dump of its copy database (2 analyses, identical content to the source dump) plus its `state.json` and `copy-proof.json`, in the private scratchpad `preserved/`. Then SIGTERM to the launcher PID (cwd and script verified); server and worker ended, its copy database was dropped by the launcher, its worktree removed. The acceptance state is re-creatable from the preserved dump with `acceptance-lab.ts` on b77c851 (or on current `main`, which contains it).

**Database inventory** (shared `condyn`, `metaroom`, `hr_timesheet`, `postgres` untouched). Before: 31 `condyn_test_*` databases.
- 3 in use by running processes, kept: the :3017 demo (`…48c146bf`) and the two three-modes labs of other sessions (`…2af0d480`, `…f01a1e6d`).
- 11 dropped: carry the disposable marker, 0 tables, 0 connections, no consumer process, so no data and no owner to harm (incl. one of the two old databases GRÜN listed, `…6f70c128`).
- 3 empty but without the disposable marker: kept (cannot be proven disposable).
- 14 with career data (copies of lab and e2e worlds, 115–124 tables): kept, no unambiguous attribution to this session (none holds the preserved real-Gemini analysis ids); incl. the second old database `…89d0c7bb`. Owner or the owning session decides.
After: 20 databases.

**Foreign long-running processes**, observed, not touched: `hr-decision-loop-local up --with-worker` (:3017, 3 d, owner), two `modes-lab.ts` chains (8 d, other sessions, hold two of the databases above).

**Provenance of the real Gemini results (:41862, source database preserved).**
- Run on 2026-10-22 on `49e2bc6` (focus-readability) with the video lab in LIVE mode, model `gemini-3.1-pro-preview`, call budget 8, owner-authorized (live-Gemini GO of 2026-10-22).
- Input: the synthetic CV `cv.synthetic.pdf` ("Alex Example"), one source bundle (`5a199801…`).
- Two analyses on the same bundle: `ANL_1792628831636_456` (mode PERSON, no job scope) and `ANL_1792628993472_10` (mode PERSON_X_JOB, Kestrel full-stack role of `JPOOL_B94850C4…`). Each has a Gemini discovery run (discovery-v1, schema discovery-schema-v1) and a Gemini convergence run (convergence-v1); 4 capability runs, 2 retained provider exchanges, all COMPLETED. At most 4 paid calls.
- The job pool `pool_dll_engineering_v1` (3 organizations, 9 roles, 79 requirements) was uploaded as JSON and reconstructed deterministically (`DETERMINISTIC_DECLARED_FIELDS`, no model); the 79 requirement and 9 role records are not Gemini output.
- Relation to the current architecture: `ANL_1792628831636_456` is exactly the operand `POOL_ROLE_DISCOVERY_V1` requires (PERSON, scope-free discovery run, projection reference present); `ANL_…_10` is a PxJ analysis and is refused as operand (NOT_PERSON), as designed. No semantic-relation (stage 3) result exists in this data: the stage-3 engine ran only with the labelled stand-in; the real capability proposals are the only real-Gemini data and are what the lexical discovery relates to the 79 requirements. A real stage-3 run needs a call budget and a provider adapter (separate owner GO).
- Recovery: restore `condyn_test_f96356700c836e92.dump` into a fresh disposable database; no new Gemini call.

## 3 Synchronized final state (owner FULL_RUNTIME_RECONSTRUCTION, 2026-10-29)

Sessions asked per database and process (GRÜN, PINK; no other peer sessions exist). Attribution from process environments, state files, memory and the evidence documents.

**Processes.** GRÜN released and ended its two 8-day review labs itself (:41809 ui-typography, :41810 focus-readability; inner launcher PIDs, all ten processes of both chains gone, both databases dropped by the launchers). PINK has no process left. Remaining listener: :3017 (owner demo, unchanged).

**Databases: 20 → 10.** Before dropping, 14 databases were dumped (custom format, private scratchpad `preserved/inventory-2026-10-29/`, 21 MB). Dropped (marker present, 0 connections, no consumer, owner session released or nobody references them): `…0809e044`, `…c81fab13`, `…e65c1246` (GRÜN review labs :41803/:41805/:41807), `…89d0c7bb` (GRÜN crashed first start of :41871, the long-open owner item), `…6f0a7069` (fixture rest, PINK released), `…1554ad87`, `…16f9d2f9`, `…b6d8fb98` (empty shells, no analyses, no references). Together with the two lab databases GRÜN removed and the earlier cleanups: 31 → 10.

Kept (reason):
| Database | Content / owner | Reason |
|---|---|---|
| `…e9c3b69d` (was listed as 48c146bf) | runner DB of :3017 | running owner demo |
| `…e46502b7` | early `job-pool:local` world, real analysis `ANL_1791660225500_612` (10 Gemini runs, 2026-10-12) | cited as "preserved database" in JOB_POOL_CONNECTION_VALIDATION.md, the acceptance plan v1.9 and CONDYN_STAND_2026-10-14.md; owner decides |
| `…dcf3ada4` | job-field E2E world :41821, 2 real Gemini analyses (2026-10-13) | cited in JOB_FIELD_E2E_SWEEP_2026-10-13.md; owner word |
| `…a8e5d256` | DLL demo :41831, real Gemini (2026-10-13) | not reproducible without a new Gemini GO; owner word |
| `…3d714d7c` | orphan Antigravity/video lab :41861, 4 Gemini runs (2026-10-19) | unattributed owner line; owner word |
| `…040e600c`, `…fa4b40cd` | 4 and 2 Gemini runs (2026-10-15, 2026-10-20), no session claims them | holds model output, unattributed |
| `…5c805faa`, `…80e1d2be`, `…cd4af6ca` | empty, no disposable marker | the repo guard refuses to drop unmarked databases; nobody knows them |
Dumps exist for every dropped database and for every kept database that holds data (`…e46502b7`, `…dcf3ada4`, `…a8e5d256`, `…3d714d7c`, `…040e600c`, `…fa4b40cd`). Not dumped and not dropped: the running :3017 runner database `…e9c3b69d` and the three unmarked empty databases.

The preserved Gemini results of :41862 (`condyn_test_f96356700c836e92.dump`) and the :41872 acceptance copy remain as described in §2.

Unchanged: :3017, the shared `condyn`, `metaroom`, `hr_timesheet` databases, all Git history; `main` only received documentation.
