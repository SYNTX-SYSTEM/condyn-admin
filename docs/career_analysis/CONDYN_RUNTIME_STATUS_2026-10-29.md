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
