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

## 4 :3017 moved to main (owner SFE::FULL_RUNTIME_INTEGRATION, 2026-10-29)

**Validation before the move.** Isolated production build of main 489b167 on a row-identical copy of the :3017 database (:41890, no Gemini key, no worker; copy proof: 124 tables identical). GRÜN (read-only, GET only, 11 pages x 2 sizes): no regression, no loss versus 175c481; the only visible differences are the intended gate text, the Next dev badge and the new role discovery surface. PINK §3.80 (30eec9f): GO with conditions C1 (demo contexts reachable on the real database), C2 (rollback as tested), C3 (labelled stand-in provider plus explicit day limit, no change to Gemini key or worker). Code delta 9fb785a..489b167 is docs and tests only. C1 met: `GET /api/career/hr-decision-loop/contexts/DCTXREV_25E6B6DA8048EDCA22B1C41380A1B71C` and `…5EFC324ADF56B112661878848951FDD2` return 200 on the old and the new server (an earlier 404 in the validation came from two context ids that GELB had passed truncated).

**Cutover.** `scripts/runtime/port-3017.sh switch /home/codi/Entwicklung/condyn-admin-dll-runtime` (checkout `condyn-admin-dll-runtime`, branch `runtime/dll-main`, commit a373639 = main): SIGTERM to the old script process (clean stop, database kept), start of `npm run job-pool:local` from the new checkout with the previous operator environment, same state file, same database `condyn_test_48c146bf…`, same career worker (GEMINI_MODEL unchanged). Added only: `ROLE_DISCOVERY_SEMANTIC_PROVIDER=stand-in`, `ROLE_DISCOVERY_DAY_LIMIT=1000`. After the move (GET only): /career/demo, HR context pages A and B, the context API for both ids and the job pool list answer 200; worker and server are up; no model call was made by this work.

**Rollback (tested by PINK, §3.80).** Backups (private scratchpad `preserved/3017/`): pg_dump of the database, the old state file, the old commit (175c481) and the diff of the old checkout. The old checkout `condyn-admin-role-discovery` is untouched. One command restores the previous stand on the same database: `scripts/runtime/port-3017.sh switch /home/codi/Entwicklung/condyn-admin-role-discovery`. `switch` also rolls back by itself when the new stand does not become ready.

**Stand after the move.** :3017 = main (a373639, dev server like before, labelled stand-in for the role check, real Gemini only through the unchanged career worker on a user's ANALYZE). The isolated labs :41890/:41891 are stopped. Ten `condyn_test_*` databases remain (see §3). Open owner items are unchanged: SSRF guard and app-wide origin check before any non-local operation, real Gemini for stage 3 (budget, adapter, 202/resume), F-INT-4 test (jsdom), lifecycle DDL drift (27 red tests), legacy label (T-07), decisions on kept databases.

## 5 Browser verification of the integrated DLL on :3017 (owner "DLL vollstaendig lauffaehig und im Browser ueberprueft", 2026-10-30)

:3017 holds no analysis and no pool, and an ANALYZE there would start the real career worker (paid Gemini). Verification therefore ran on two targets, with no new Gemini call and no change to key or worker:
- **Mirror** `:41895`: production build of main 1d1d6e6 on a restore of the preserved real-Gemini world (PERSON analysis `ANL_1792628831636_456`, pool `JPOOL_B94850C4…` with 9 roles, 79 requirements, 10 proposals), labelled stand-in, day limit 1000, no key, no worker. Free interaction.
- **Live :3017** (dev server, main): view only; every non-GET and every external request was aborted in the browser, none occurred.

**GRÜN** (6 viewports 1920x1080 … 640x360@2, 15 steps each): 0 failures, no console or page errors; gate text names both ways; modes JOB / PERSON x JOB / PERSON open and close the gate correctly; keyboard in the mode selector; all six orbits open their HUD and focus (orbit components are code-identical to the reference c670b74); role discovery panel does not cover an orbit; one start = exactly one POST, "Stand-in, no model", then "Relation cache: 100 of 790 pairs · stand-in check: completed", selection reset, `roleInvestigationId` in the URL, reload/back/forward GET only; drop zone stages a file once; DE works; HR contexts A and B render. No product defect, so no fix branch.

**PINK §3.81** (480bd86): PASS on production labs of 1d1d6e6 (seed world with the same data shape as :3017, and the restored real world; no key, no worker) and on live :3017 GET only. 190 of 790 pairs equals 190 relations in the database; GET sweeps write nothing; text hash and testid-set hash are identical between dev server and production build (dev adds only the Next overlay); modes, orbits, language and the HR result agree. Config: :3017 has 0 analyses and 0 pools, so no discovery entry and nothing startable, correct for an empty world; the switch script sets the stand-in and the day limit by default.

**Observations (none blocking).** Legacy label on orbits 03–06 still missing (T-07, owner); 960x540 overlap of 2.9 px; 1920x1080 page scrolls. O-RT-1: Escape closes neither orbit focus, cosmos nor the codex modal (✕ CLOSE or click only). O-RT-2: the dev server compiles HR context A on first view in more than 9 s at 1920. O-RT-3 (owner): :3017 is a dev server and the switch script starts the worker by default; with a Gemini key in the environment, an ANALYZE from the UI calls Gemini, as before the move. A production build and `--no-worker` would be stricter. D-PICK-PERSON: no way in the UI to open an existing PERSON analysis (opened by URL in the mirror). The "SEMANTIC GUIDE" drawer stays English in DE (hard-coded since before c670b74).

Cleanup: mirror and its databases removed, scratch worktree removed. State: :3017 = main on the DLL checkout, ten `condyn_test_*` databases, Git synchronized.
