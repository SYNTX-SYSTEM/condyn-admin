# Job Pool Workflow — Manual Test: PDF → Gemini Capability Sweep → JSON Job Pool → Job Matching

Companion to `JOB_POOL_WORKFLOW_FRONTEND.md`. The exact path below was executed in a real Chromium session on
2026-10-10 (run record in the frontend document, evidence `evidence/job-pool/11…15`). Everything runs on a positively
verified disposable database `condyn_test_<16 hex>`; the shared `condyn` database is refused by name before any
connection. Nothing here deploys anything.

## 1. Environment

| Item | Value |
| --- | --- |
| Worktree | `~/Entwicklung/condyn-admin-job-pool` (branch `frontend/job-pool-workflow`, in sync with `integration/job-pool-connection`) |
| Test role file | `~/.config/condyn/test-db-role.env` with `TEST_DATABASE_ADMIN_URL=postgresql://condyn_test_runner:…@localhost:5432/postgres` |
| Gemini key | `GEMINI_API_KEY` in your shell; never stored by the script, only passed to the worker child |
| Gemini model | `GEMINI_MODEL=gemini-3.8-flash`. Required: the worker's default cascade starts with `gemini-2.0-flash` (404 for the operator key on 2026-10-10) and `gemini-2.5-flash` answers "no longer available to new users". List reachable models with `npx tsx scripts/list-models.ts`. The script warns when the variable is unset |
| Sample inputs | `docs/examples/cv.synthetic.pdf` (synthetic two-page CV, 3.6 kB) and `docs/examples/job-pool.sample.json` (3 organisations, 6 roles, 28 requirements) |
| Browser | any; the proof used Chromium 1600×1000 |
| Port | 3017 (`HR_LOOP_LOCAL_PORT` to change); one `next dev` per worktree, so stop any other server in this worktree first |

`npm run job-pool:local` does not read `.env.local` (unlike `npm run worker:career`). Export the variables in the shell.

## 2. Start

```bash
cd ~/Entwicklung/condyn-admin-job-pool
set -a; . ~/.config/condyn/test-db-role.env; set +a
export GEMINI_API_KEY=…
export GEMINI_MODEL=gemini-3.8-flash
npm run job-pool:local            # = scripts/hr-decision-loop-local.ts up --with-worker
```

Expected log, in order:

```
[hr-loop:local] admin role condyn_test_runner (least privilege)
[hr-loop:local] created disposable database condyn_test_…        (or: reusing verified disposable database …)
[hr-loop:local] registered schema: CAREER_FIELD_SCHEMA -> CAREER_POST_DECISION_CHAIN -> DECISION_CORE_REVISIONS -> …
[hr-loop:local] registered job-pool persistence
[hr-loop:local] seeded the sealed-producer world (context A full chain + DCDRB, context B empty)
[hr-loop:local] starting career worker against condyn_test_… (GEMINI_MODEL gemini-3.8-flash, fresh PROMPT_ENCRYPTION_KEY, in-memory prompt repository)
[hr-loop:local] starting next dev --webpack on 127.0.0.1:3017 against condyn_test_…
[worker] Career worker started: hr-loop-local-worker
[worker] Worker started. Polling for jobs...
```

Without `GEMINI_API_KEY` the script stops before anything starts: `ERR_HR_LOOP_LOCAL_GEMINI_API_KEY_MISSING`.
`up --fresh` forces a new database; plain `up` reuses the one in `.hr-loop-local/state.json` when it still verifies.

URL: `http://127.0.0.1:3017/career/demo` — credential: none. The uploader actor id in the panel is self-declared and
not authenticated (B-JP-ACTOR); default `JOB_POOL_UPLOADER_LOCAL`.

## 3. Path, click by click

| Step | Action | Expected state |
| --- | --- | --- |
| 1 | Open `http://127.0.0.1:3017/career/demo` | Guided onboarding overlay opens over the field (first visit) |
| 2 | Click `✕` (onboarding close) | Planetarium with six orbits, all `PRE_CANONICAL_DISCOVERY · 0 items`; source dock on the left bottom; `⬡ JOB POOL` toggle top-left; no HR dock |
| 3 | In the source dock click `+ UPLOAD PDF` and choose `docs/examples/cv.synthetic.pdf` | The PDF appears in the staged list as `PDF · cv.synthetic.pdf`; `START INTAKE ANALYSIS` becomes enabled. Evidence `11-pdf-staged-in-source-dock.png` |
| 4 | Click `START INTAKE ANALYSIS` | Intake telemetry banner: `SUBMITTING` → `PENDING` → `RUNNING` with the current operation (`SOURCE_PREPARATION`, `INFERENCE`, …). Worker log: `[worker] [Worker hr-loop-local-worker] CLAIMED JOB_… lease=1`. Server log: `POST /api/career/analyze 202` |
| 5 | Wait (the proof took 72 s) | `ANALYSIS COMPLETED SUCCESSFULLY` banner; the identity core shows `1 SOURCES ACTIVE`; orbits fill (proof: identity 1, capability field 9, resonance orbits 2, role manifestation 2). Evidence `12-pdf-sweep-field.png`. If an error banner appears instead, read the worker log line `[Worker …] FAILED JOB_… <code>: <summary>` |
| 6 | Click `⬡ JOB POOL` | Panel opens: `PERSISTED JOB POOL UPLOADS: NO JOB POOL UPLOAD PERSISTED` (fresh database), `SELECTED UPLOAD: NO UPLOAD SELECTED …`, `ANALYSIS FOR MATCHING: ANL_… FROM THIS SESSION'S SUCCEEDED CAPABILITY SWEEP`, `ROLE MATCHES: SELECT AN UPLOAD …`. `JOB POOL PERSISTENCE NOT PROVISIONED` here means the server is not on a verified disposable database: stop and check the log |
| 7 | `CHOOSE JSON FILE` → `docs/examples/job-pool.sample.json`, click `UPLOAD` | `UPLOAD PERSISTED (NEW)`, id `JPOOL_30F7145E21F34BEF0FCE510DFC75837B`, `CONDYN Sample Tech Job Pool v1 · ACTIVE`, amber `UPLOADED != SELECTED`. The list shows the upload with a `SELECT` button; matches stay idle. Evidence `13-pool-uploaded-not-selected.png` |
| 8 | Click `UPLOAD` again with the same file (optional) | `IDENTICAL UPLOAD ALREADY PERSISTED`, same id, list unchanged |
| 9 | Click `SELECT` on the upload | `SELECTED UPLOAD` with chips `MAPPED · PROPOSAL_ONLY · authority NONE`, `3 TOREV · 6 TRPREV · 28 TRQREV`, the HIA-1 boundary text; URL gains `?jobPoolUploadId=JPOOL_30F…`; `ROLE MATCHES (LAYER P)` reads automatically |
| 10 | Inspect `ROLE MATCHES (LAYER P)` | Labels `DETERMINISTIC PRESENTATION · NOT A CANONICAL EVALUATION · NOT A DECISION`; `CANDIDATE CAPABILITIES n · WEAK-EVIDENCE THRESHOLD 0.7`; `RANKED BY resonanceScore AS DELIVERED`; six role cards. Proof result for the synthetic CV: `#1 Senior Full-Stack Engineer 36.4%` with TypeScript `COMPOSITE_CONSTITUENT` via `TypeScript & Node.js Platform Engineering` · constituent `TypeScript`, Node.js under weak evidence as `TOKEN_CONTAINMENT`, missing React / PostgreSQL / Automated Testing; then Data Engineer 30.3%, Machine Learning Engineer 28.2%, Frontend Lead 21.9%, Architect and Platform 0%. Each card ends with `CANONICAL STATE (LAYER C)`: `TRPREV`, the `TRQREV` ids and `CAPABILITY-REQUIREMENT RELATION: NOT_EVALUATED · VERIFIED_CAPABILITY_SNAPSHOT_ABSENT`. Evidence `14-…png`, `15-…png` |
| 10a | Read `CAPABILITY SWEEP COVERAGE (UNSCORED)` under the ranking line | `SWEEP PROPOSALS READ · PROPOSALS n · UNSCORED` for a sweep of this session (proof: 9). Inside the cards, covered requirements carry a cyan line `COVERED BY THE CAPABILITY SWEEP: <proposal name> (<basis>) · PCAP_… · UNSCORED` with the verified quote, and each card states `MISSING REQUIREMENTS COVERED BY THE SWEEP (UNSCORED): n`. Proof: Platform Engineer stays at 0.0 % while Kubernetes, Docker, CI/CD and Linux are shown as covered; Full-Stack keeps 36.4 % with PostgreSQL and Automated Testing covered. Scores never change through coverage. Evidence `16-…png`. `NO SWEEP PROPOSALS RECORDED` appears for analyses seeded without a sweep; `SWEEP PROJECTION COULD NOT BE READ` marks a lineage failure of the sweep only |
| 11 | Scroll the panel to the end | `ORGANIZATION AGGREGATES (PRESENTATION)` and the non-claims line `PRESENTED != EVALUATED · UPLOADED != SELECTED · RANKED != RECOMMENDED · MISSING != GAP DECISION` |
| 12 | Reload the page | Selection returns from the URL; the analysis does not (it lives in the session). Append `&analysisId=ANL_…` (the id from step 6) to pin it: the panel shows `FROM THE URL (EXACT ID, ASSUMED PERSISTED)` and reads the matches again |

Exact scores vary between sweeps because the model names capabilities differently each run (text source runs gave the
full-stack role 46–84 %, the PDF run 36 %); the structure above is stable.

## 4. Inverse checks (optional, each a distinct visible state)

- Upload a copy of the sample with `"status": "DRAFT"` and select it: `POOL IS NOT ACTIVE: no matching for DRAFT or ARCHIVED pools` (HTTP 409).
- Upload `{"pool": {"id": "X"}}`: `UPLOAD REJECTED · HTTP 422 · ERR_JOB_POOL_SCHEMA_INVALID` with the issues listed.
- Upload a non-JSON file: `UPLOAD REJECTED · HTTP 400 · ERR_JOB_POOL_JSON_INVALID`.
- Open `/career/demo?jobPoolUploadId=JPOOL_STALE`: `SELECTED UPLOAD ID IS NOT AMONG THE PERSISTED UPLOADS`.
- Open `/career/demo?careerDecisionContextRevisionId=<context A id from the start banner>`: the HR dock opens on the right, the Job Pool toggle stays on the left, neither reads the other.

## 5. Stop and clean up

`Ctrl+C` stops the server and the worker; the database is kept for reuse. `npm run hr-loop:local:drop` removes exactly
that database (`dropDisposableTestDatabase`, name pattern and marker verified). Nothing else is touched.

Several sessions run `next dev` and career workers on this machine. Never `pkill -f "next dev"` or
`pkill -f run-career-worker`; stop by PID and check `/proc/<pid>/cwd` is this worktree.

## 6. Automated counterpart

`test/career/job-pool/e2e/job-pool-workflow.e2e.test.ts` covers the panel path with a directly seeded analysis (no
model call); run it with the manual server stopped:
`CONDYN_PLAYWRIGHT_MODULE=/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs npm run -s test:isolated -- test/career/job-pool/e2e`.
The PDF → Gemini leg is manual by design (real model call, operator key).
