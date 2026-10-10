# Job Pool Workflow — Manual Test (local, disposable database)

Companion to `JOB_POOL_WORKFLOW_FRONTEND.md` and `HR_DECISION_LOOP_MANUAL_TEST.md`. Everything runs on a positively
verified disposable database `condyn_test_<16 hex>`; the shared `condyn` database is refused by name before any
connection. Nothing here deploys anything.

## 1. Prerequisites

- PostgreSQL on localhost with the least-privilege test role file `~/.config/condyn/test-db-role.env`
  (`TEST_DATABASE_ADMIN_URL=postgresql://condyn_test_runner:…@localhost:5432/postgres`).
- A Gemini API key in your shell for the real capability sweep: `export GEMINI_API_KEY=…` (optionally `GEMINI_MODEL`).
  The script never stores the key; it only passes it to the worker child process.
- No other `next dev` running in this worktree (Next allows one per project directory).

## 2. Start

```bash
cd ~/Entwicklung/condyn-admin-job-pool
set -a; . ~/.config/condyn/test-db-role.env; set +a
export GEMINI_API_KEY=…          # only needed for the real sweep
npm run job-pool:local            # = hr-loop:local up --with-worker
```

What happens, in order, and what to expect in the log:

1. `admin role condyn_test_runner (least privilege)` — a superuser admin is refused unless explicitly allowed.
2. `created disposable database condyn_test_…` (or `reusing verified disposable database …` from `.hr-loop-local/state.json`).
3. `registered schema: CAREER_FIELD_SCHEMA -> … -> CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDINGS` and
   `registered job-pool persistence` (or the note that the job-pool routes register lazily when the module is absent).
4. `seeded the sealed-producer world` (the HR Decision Loop contexts; unrelated to pools but part of the same environment).
5. `starting career worker against condyn_test_…` followed by `[worker] Career worker started: hr-loop-local-worker`.
   Without `GEMINI_API_KEY` the script stops with `ERR_HR_LOOP_LOCAL_GEMINI_API_KEY_MISSING` before anything starts.
6. `starting next dev --webpack on 127.0.0.1:3017`.

Without the worker (upload and matching against an already persisted analysis only): `npm run hr-loop:local`.

URL: `http://127.0.0.1:3017/career/demo`

Credential: none. The uploader actor id in the panel is self-declared and not authenticated (B-JP-ACTOR); the default is
`JOB_POOL_UPLOADER_LOCAL`.

## 3. Walkthrough

1. Open `http://127.0.0.1:3017/career/demo`; close the guided onboarding. Expect the planetarium unchanged, no HR dock,
   and a collapsed `⬡ JOB POOL` toggle top-left.
2. Click the toggle. Expect `PERSISTED JOB POOL UPLOADS: NO JOB POOL UPLOAD PERSISTED` on a fresh database,
   `SELECTED UPLOAD: NO UPLOAD SELECTED`, `ANALYSIS FOR MATCHING: NO ANALYSIS …`, `ROLE MATCHES: SELECT AN UPLOAD …`.
   If you see `JOB POOL PERSISTENCE NOT PROVISIONED`, the server is not on a verified disposable database: stop and check the log.
3. Choose `docs/examples/job-pool.sample.json` in the file chooser and click `UPLOAD`. Expect `UPLOAD PERSISTED (NEW)`,
   a `JPOOL_…` id, and the amber note `UPLOADED != SELECTED`. The list now shows the upload; nothing is selected.
4. Click `UPLOAD` again with the same file. Expect `IDENTICAL UPLOAD ALREADY PERSISTED` with the same id.
5. Click `SELECT` on the upload. Expect `SELECTED UPLOAD` with the canonical mapping chips `MAPPED · PROPOSAL_ONLY ·
   authority NONE`, the TOREV/TRPREV/TRQREV counts and the HIA-1 boundary text. The URL now carries `jobPoolUploadId=`.
   Matches stay idle: there is no analysis yet.
6. Run the real sweep: drop a CV PDF (or add a GitHub/website source) into the identity core and start the analysis.
   Watch the worker lines (`[worker] … CLAIMED …`). When the job succeeds the planetarium fills and the panel's
   `ANALYSIS FOR MATCHING` shows the `ANL_…` id with `FROM THIS SESSION'S SUCCEEDED CAPABILITY SWEEP`.
7. Expect `ROLE MATCHES (LAYER P)` to read automatically: the three labels `DETERMINISTIC PRESENTATION · NOT A CANONICAL
   EVALUATION · NOT A DECISION`, the ranking line, and one card per role ranked by `resonanceScore` as delivered. Per role:
   matched requirements with `BASIS EXACT|ALIAS|TOKEN_CONTAINMENT`, the matched capability and its evidence quotes;
   weak-evidence requirements with the delivered reason; missing requirements; the canonical `TRPREV`, `TRQREV` ids and
   `CAPABILITY-REQUIREMENT RELATION: NOT_EVALUATED · VERIFIED_CAPABILITY_SNAPSHOT_ABSENT`.
8. Reload the page. The selection comes back from the URL; the sweep result lives in the session only, so the analysis
   is gone after a reload. To pin it, append `&analysisId=ANL_…` to the URL; the panel then shows
   `FROM THE URL (EXACT ID, ASSUMED PERSISTED)` and reads the matches again.
9. Inverse checks:
   - Upload a copy of the sample with `"status": "DRAFT"`, select it: `POOL IS NOT ACTIVE` (409), no matches.
   - Upload `{"pool": {"id": "X"}}`: `UPLOAD REJECTED · HTTP 422 · ERR_JOB_POOL_SCHEMA_INVALID` with the issues listed.
   - Upload a file that is not JSON: `HTTP 400 · ERR_JOB_POOL_JSON_INVALID`.
   - Open `/career/demo?jobPoolUploadId=JPOOL_STALE`: `SELECTED UPLOAD ID IS NOT AMONG THE PERSISTED UPLOADS`.
10. Preservation: `/career/demo?careerDecisionContextRevisionId=<context A from the banner>` still opens the HR dock on
    the right; the Job Pool panel toggle sits on the left; neither reads the other.

## 4. Stop and clean up

`Ctrl+C` stops the server and the worker; the database is kept for reuse. `npm run hr-loop:local:drop` removes exactly
that database (`dropDisposableTestDatabase`, name pattern and marker verified). Nothing else is touched.

## 5. Notes

- The e2e (`test/career/job-pool/e2e/job-pool-workflow.e2e.test.ts`) seeds one analysis row directly and makes no model
  call. Run it with the manual server stopped:
  `CONDYN_PLAYWRIGHT_MODULE=/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs npm run -s test:isolated -- test/career/job-pool/e2e`.
- `.hr-loop-local/state.json` is gitignored; it names the disposable database and port only.
- Never set `CONDYN_ALLOW_SHARED_DATABASE`; the script strips it from both child processes.
