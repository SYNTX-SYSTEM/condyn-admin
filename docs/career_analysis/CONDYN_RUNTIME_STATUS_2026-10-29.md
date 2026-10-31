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

## 6. SEMIOTIC_ENTRY_FIX (2026-10-30)

- GRÜN `frontend/semiotic-entry`: 84e4551 (Einstiegszeile als Feldzustand, 9 Zustände EN/DE, `role="status"`, kühle Töne, keine Sperrsprache), F-SEM-1 Lage (e32764f, rechte Spalte unter dem Modusauswähler), Testlücken F-SEM-2…4 (b29d307), Wortlaut (4c969af), Evidenz 0ab9baf.
- PINK §3.82 (Runde 1): NO-GO wegen F-SEM-1 (PERSON_OPEN-Zeile über KESTREL, Klick fing den Rand ab). §3.83 (Runde 2, 0ab9baf): GO. Gate in 40 Zuständen byte-identisch zu cd1e4de, 0 verdeckte Elemente in 88 Besuchen, Klickbeweis am KESTREL-Rand, 30 von 31 Mutanten rot.
- Ausrollung: `main` cd1e4de → 0ab9baf (Fast-Forward), Worktree `condyn-admin-dll-runtime` per ff nachgezogen, Dev-Server (HMR) ohne Neustart; :3017 antwortet 200, SSR-Einstieg trägt `data-entry-state`, keine CLOSED/GESCHLOSSEN-Wörter. Rollback: `git -C …/condyn-admin-dll-runtime reset --hard cd1e4de`. Keine Gemini-Calls, DB und Worker unverändert.
- Offen: F-SEM-5 (Testlücke: Dashboard schreibt `--sx-entry-clear` nicht mehr), O-SEM-3 (`→ PERSON` übernimmt focus=CAPABILITY), INVALID trägt den Validierungscode (V-05), O-RT-3.

## 7 Automated capability → job path rolled out (2026-10-30)

Mandate SFE::AUTOMATED_CAPABILITY_TO_JOB_EXECUTE. `main` fast-forwarded 9fa2cdc → 0e44cce (backend b972905 + frontend r2 0e44cce); PINK §3.86 GO (ea0d913, evidence/auto-capability-0e44cce/) after §3.85 NO-GO (F-AC-1, F-AC-2, F-AM-6, F-AM-7 fixed). Spec: CONDYN_AUTOMATED_CAPABILITY_TO_JOB_2026-10-30.md.

- **:3017:** worktree condyn-admin-dll-runtime fast-forwarded to 0e44cce, server and worker restarted with `port-3017.sh switch` (the auto-match hook lives in the worker). Provider stays `stand-in`, day limit 1000. GET-only check: `/career/demo` 200, `auto-match` and `job-ranking` answer (404 JSON for unknown analyses; the demo DB holds no analysis). No ANALYZE, no Gemini call. **Rollback:** `git -C /home/codi/Entwicklung/condyn-admin-dll-runtime reset --hard 9fa2cdc` then `scripts/runtime/port-3017.sh switch /home/codi/Entwicklung/condyn-admin-dll-runtime`.
- **Works (stand-in and loopback Gemini fake):** PDF/text/GitHub account (`github.com/<user>`) → PERSON analysis → automatic match run in the worker without further input → ranked jobs with explanation in the Capability Map; states DISABLED / NOT_PROVISIONED / SKIPPED (NOT_PERSON, NO_ACTIVE_POOLS, NO_PROPOSALS) / PARTIAL / FAILED rendered EN/DE.
- **External releases still missing (owner):** a concrete call budget (`ROLE_DISCOVERY_DAY_LIMIT`) and `ROLE_DISCOVERY_SEMANTIC_PROVIDER=gemini` on :3017; optional `GITHUB_TOKEN` (60 requests/h without). No real-GitHub / real-Gemini end-to-end proof exists yet.
- **Owner notes:** D-AC-1 (640×360: Orbit 01 28 px below the first viewport, short scroll needed), O-AC-2 (UI waits max 3 min; real Gemini may take longer → early lexical ranking until reload), O-AC-3 (fit shown as percent may read as a score), O-AM-1 (old duplicate-key race in store.open), O-AM-2 (equal requirement content shares cached results), O-AM-4 (worker stopped mid-run leaves RUNNING), O-A-2 (an account can bring up to 100 documents into one extraction), O-A-3 (GitHub rate limit), 27 red lifecycle tests = DDL drift baseline.

## 8 Real end-to-end execution (2026-10-30, SFE::REAL END-TO-END EXECUTION)

One run on :3017 (main 0e44cce): `docs/examples/cv.synthetic.pdf` (PERSON) → real Gemini (`gemini-3.1-pro-preview`) → the three DLL test pools (all ACTIVE) → automatic semantic match → ranking → Capability Map. For this run only, :3017 was started with provider `gemini`, `ROLE_DISCOVERY_DAY_LIMIT=7`, `ROLE_DISCOVERY_MAX_ROLES=7`; afterwards restored to `stand-in` / 1000. Nothing implemented or repaired; analysis `ANL_1793382839627_744`, job `JOB_1793382839627_744`, run `RINV_C50B1E0CF074564C8BF5BDF69030C6EE`.

**Ran through:** analysis SUCCEEDED in one attempt (VERIFIED, 35.7 s), 12 PERSON capabilities (all PROPOSED, 1 evidence each: Infrastructure Deployment and Maintenance, React Frontend Development, Technical Team Leadership, English/German Language Proficiency, TypeScript and Node.js Backend Development, CI/CD Pipeline Engineering, Dimensional Data Modeling, TDD, Python ETL Development, Event Stream Processing, Relational Database Design and SQL). The automatic match started without any input and ended **PARTIAL · ROLE_FAILURES**, REAL_GEMINI: 7 roles planned, 4 SUCCEEDED, 3 FAILED (1 × ERR_SEMANTIC_OUTPUT_REFUSED by strict admission; 2 × ERR_SEMANTIC_PROVIDER_FAILED, cause not logged by design). Run time about 8 min.

**Ranking (ROLE_RANKING_V1, ranking only, decision false):** 73 roles, 14 SEMANTIC, 59 LEXICAL_ONLY. Top: 1 Senior Full-Stack Engineer – Shipment Tracking (Kestrel, Engineering pool) fit 0.73, 9/9 requirements semantic, 1 required gap; 2 Data Analyst – Fleet Telematics (Corvane) 0.54; 3 Industrial Data Engineer (Rheinmark) 0.40; 4 AML Data Scientist (Ledgerline) 0.375; 5 Capacity Planning Engineer (Arcvale) 0.375; 6 Analytics Engineer – dbt (Datalume) 0.34. Ranks 3–4 have only 2 of 6 requirements semantic (relations reused by identical requirement content, O-AM-2).

**Capability Map (GRÜN, view only, 5 GETs, no write):** CAPABILITY FIELD shows the 12 capabilities; panel "JOB RANKING · AUTOMATIC" shows "4 of 7 roles checked semantically · call limit 7", the "GEMINI · model statements" label, "Authority: none"; WHY of rank 1 lists per requirement statement, limitation and a verbatim quote (formula and contributions shown).

**Inverse validation (PINK §3.87, 1fd8418): GO for consistency.** UI = API (73/73, order, tier, fit); all quotes verbatim in the PDF (29/29 semantic, 40/40 lexical occurrences); no score/suitability wording; FAILED roles have 0 stored relations and are not counted as evaluated (the OUTPUT_REFUSED role shows 1 of 8 only through cached relations of identical requirement content).

**Call count — what is proven and what is not:** semantic stage: 7 requests reserved in the ledger (DAY:gemini:2026-10-30 reserved 7, consumed 5, released 2; the 2 provider failures probably ran into the 120 s timeout, so their requests may have left). Extraction: Legacy 1 + Discovery 1 + Convergence 1 = at least 3 by code; the number is **not recorded** (no exchange archive on :3017, analysis payload holds no attempt counts). Therefore the lower bound is 10 and "≤ 10" holds only if the legacy stage made exactly one call; the short analysis time (35.7 s, one job attempt) makes cascade or regeneration unlikely but does not prove it.

**Owner notes from the run:** (a) for requirements judged DIFFERENT the panel names a capability that does not fit (e.g. "Geospatial Visualisation" → "CI/CD Pipeline Engineering"; it is the first of the zero-value candidates, shown without a quote) — a display ambiguity; (b) real Gemini needed 1–2 min per role; the UI wait of 3 min (O-AC-2) is shorter than a full run; (c) 2 of 7 role calls ended in provider failure, no automatic repetition happens; (d) the call count of the extraction stage is not observable (see above).

## 9. Three-point hardening rolled out (2026-10-31)

**Scope (owner mandate SFE::THREE-POINT IMPLEMENTATION GO, "NUR DIESE DREI PUNKTE. MEHR NICHT."):** (1) semantic coverage, (2) Gemini call budget, (3) temporal synchronisation. Detail: `CONDYN_AUTOMATED_CAPABILITY_TO_JOB_2026-10-30.md` §5.

**Integration:** backend `88bdc05` + frontend `832d185` merged into `main` (6f482d2, 28dc62a); tsc clean; 66/66 targeted tests green on the merge. Backend and frontend ship together only (PINK D-TP-1: the old client decoder rejects `STALLED`).

**Independent validation: PINK §3.88 GO for points 1, 2 and 3** on the pair (scripted mock SDK, no network, no key, no model). 12/12 frontend mutants red, 10,368 backend views decoded without rejection, F-TP-1/F-TP-2 closed. Open, non-blocking: F-TP-3 (test gaps T-M04/09/10/19/20/21/24; code correct by inspection).

**:3017:** `condyn-admin-dll-runtime` fast-forwarded to 28dc62a, server + worker restarted (stand-in, day limit 1000, no ANALYZE, no Gemini call). GET `/career/demo` 200; the earlier real run ANL_1793382839627_744 still reads PARTIAL · ROLE_FAILURES, not resumable, not continued. Rollback: `git -C /home/codi/Entwicklung/condyn-admin-dll-runtime reset --hard 5521ae7`, then `scripts/runtime/port-3017.sh switch <that dir>`.

**Owner notes:** partial admission (admitted pairs stored, refused pairs never) relaxes the former all-or-nothing admission — my decision; default job call limit 12 when `GEMINI_JOB_CALL_LIMIT` is unset (the real run used 10); the call register is active only on disposable DBs; the extraction-stage call count of the earlier real run stays unprovable; no real-Gemini proof of the new paths (needs a separate release); 45 baseline-red tests unchanged.
