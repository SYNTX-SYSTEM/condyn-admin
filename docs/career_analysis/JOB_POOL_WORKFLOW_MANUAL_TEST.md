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
`up --fresh` forces a new database; plain `up` reuses the one in `.hr-loop-local/state.json` when it still verifies. The state file holds the database URL with the runner password (owner-only, 600 in a 700 directory): never print, attach or quote it; evidence names the database only.

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

## 3a. Job Pool Field (POOL focus): the pool as its own field state

Since the "SFE — SEMIONTIC JOB POOL FIELD" reconstruction the Job Pool is not a panel. Wherever §3 says "panel", read:
the Pool Field. Every id of §3 is unchanged; the geometry is new.

| Step | Action | Expected state |
| --- | --- | --- |
| P1 | Click `⬡ JOB POOL` in the field-state strip (top-left: ◈ CAPABILITY · ⬡ JOB POOL · ◉ JOB) | The whole field changes state: the planetarium recedes under a blurred void, the Pool Field fades in, the persisted uploads emerge one by one on a ring around an empty core ("NO UPLOAD AT THE CORE"); the switch glows; the URL gains `focus=POOL`. Left: title, subtitle, the list state with a living dot, ANALYSIS FOR MATCHING, INTAKE (uploader id, file, UPLOAD →). Right: SELECTED UPLOAD (none), ROLE MATCHES (idle) |
| P2 | Choose a JSON file, UPLOAD → | UPLOAD PERSISTED (NEW) with the id and `UPLOADED != SELECTED`; a new node appears on the ring; the core stays empty (nothing is selected for you) |
| P3 | Click an upload node on the ring | It is drawn into the core and lights up (SELECTED, disabled); the ring keeps its other nodes in place; the selected pool's organisations appear as arcs and its roles as small nodes on the inner ring, each with its requirement ticks; the right surface reads the upload (ORG · ROLES · REQ, canonical mapping MAPPED · PROPOSAL_ONLY · authority NONE) and, with an analysis, ROLE MATCHES: the roles on the inner ring now carry light by POOL RESONANCE (unlit = no scored match), the readings list each role with its resonance and counts, relations behind REVEAL RELATIONS |
| P4 | Click a role node on the inner ring | Its organisation arc brightens, the others recede; the right surface shows the POOL ROLE with its requirements (necessity, eligibility, TRQREV id); ALL ROLES returns |
| P5 | Click `ENTER JOB FIELD →` | The field changes state again: the Job Field opens on the same selection (JOB glows in the strip); `⬡ JOB POOL` returns to the Pool Field; `← CAPABILITY FIELD` (or the active switch) returns to the ground state and removes `focus` from the URL |
| P6 | Open `/career/demo?analysisId=ANL_…&jobPoolUploadId=JPOOL_…` without `focus` | The Pool Field opens with that upload at the core (an exact selection is a field state); `focus=JOB` in the URL wins over it |
| P6b | Read the structure | The selected pool's organisations are nebulae around the core with their names curved along their arcs; with a matching read, each nebula's brightness is the delivered organisation resonance. `LAYER C DETAILS` and `MATCHING DETAILS` unfold the technical readings; by default only the mapping state words, the labels, the ranking and the role readings are visible |
| P6c | Look for panels | None. With an empty core the intake is the only lens (the contextual action); once an upload is at the core the intake folds behind `+ INTAKE`, the core reads itself in one lens below it (counts, mapping state words, LAYER C DETAILS, ROLE MATCHES with the labels, the ranking and ENTER JOB FIELD →). Click a lit role on the inner ring: the ring recedes, the core lens dims, and one lens opens at the role with its requirements and its reading (REVEAL RELATIONS); ALL ROLES returns |
| P7 | Select a DRAFT upload (dashed amber node) | It moves to the core; ROLE MATCHES says `POOL IS NOT ACTIVE`; nothing is scored |

Evidence of the automated run: `01-panel-open-two-uploads-none-selected.png` (Pool Field, empty core), `02-upload-persisted-not-selected.png`, `03-selected-upload-ranked-role-matches.png` (selected upload at the core, structure lit by the delivered matching).

## 3b. Job Field (JOB focus): the pool as the central field

| Step | Action | Expected state |
| --- | --- | --- |
| J1 | With a pool selected and an analysis present (after step 9 or with `&analysisId=ANL_…`), click `◉ JOB` top-left | The capability planetarium recedes (dimmed, not interactive, still present); the Job Field opens: `JOB FIELD · THE JOB POOL AS THE CENTRAL FIELD · PRESENTATION · AUTHORITY NONE`, state `PRESENTATION MATCHING READ`; URL gains `focus=JOB`; the Job Pool panel collapses to a bottom-left toggle |
| J2 | Read the canvas | Core `CANDIDATE` with `scored · unscored` counts; roles as nodes around it, grouped under their POOL organisation arcs; distance from the core = 1 − pool resonance (legend); each node shows `POOL RESONANCE` %, delivered rank, a ring of segments (cyan matched, amber unresolved, dashed cyan sweep-covered unscored, red no evidence); roles at 0 % sit on the outer ring with `NO SCORED MATCH`; a dashed ray marks the nearest presented role |
| J3 | Read the right column | `NEAREST PRESENTED ROLE` with the label `presentation · authority NONE · not a role relation (RRL) · not a recommendation (RCP) · not a decision`, its `PENDING TOWARD THIS ROLE` in four kinds (UNPROVEN (CANONICAL) with the TRQREV ids, UNRESOLVED (WEAK EVIDENCE), UNSCORED SWEEP COVERAGE, NO EVIDENCE DELIVERED) and the canonical reason `NOT_EVALUATED · VERIFIED_CAPABILITY_SNAPSHOT_ABSENT` |
| J4 | Click a role node (or `OPEN ROLE`) | Other roles dim; the right column shows the role: delivered rank, pool resonance, four counts, `REQUIREMENT RELATIONS (PRESENTATION)` with one line per requirement: state chip, provenance (`analysis capability (scored)` with confidence and quotes, or `capability sweep proposal (unscored, source-verified quote)`, or `no evidence delivered · absence of evidence is not absence of capability`), then `PENDING TOWARD THIS ROLE`; URL gains `jobRoleId=` |
| J5 | `ALL ROLES`, then `← CAPABILITY FIELD` | Back to the overview, then back to the capability planetarium; `jobRoleId` leaves the URL and `focus` becomes `CAPABILITY` (while an upload is selected the ground state is named, so a reload stays in it); the strip shows ◈ CAPABILITY active |
| J6 | Open `/career/demo?focus=JOB&analysisId=ANL_…&jobPoolUploadId=JPOOL_…&jobRoleId=role_fullstack` | The Job Field opens directly on that role. A stale `jobRoleId` is named (`… POOL OR ANALYSIS NOT FOUND`), never silently dropped |
| J7 | Open `/career/demo?focus=JOB&analysisId=ANL_…` without a pool | State `NO JOB POOL UPLOAD SELECTED` with the persisted uploads to select inside the field; selecting one reads the field and writes `jobPoolUploadId` to the URL |
| J8 | Watch the field for ten seconds without reading anything | The field is alive and every motion means one thing: roles emerge from the core in delivered order; a role with a scored match holds light that breathes (more light and a livelier breath at higher pool resonance); a role without a scored match is unlit and still on the outer ring, visible, not red-alarmed; the ray to the nearest presented role flows outward (dashed: a direction, not a choice); amber ring segments waver (weak evidence); dashed cyan segments circulate (covered by the sweep, unscored); faint red gaps stand still (no evidence delivered); the core breathes slowly and its dashed halo circulates only when sweep proposals exist |
| J9 | Hover a role node | Its organisation and, for an unlit role, `NO SCORED MATCH` appear under it; dashed rings orbit it, one per PENDING kind that has ids (grey unproven canonical, amber unresolved, dashed cyan unscored coverage, red no evidence); the organisation arc brightens. Leaving the node removes them |
| J10 | Click `LEGEND` (left), then open a role and click `REVEAL EVIDENCE` on one line and `REVEAL ALL EVIDENCE` | The legend text (geometry sentence, the motion grammar sentence, the hover hint) unfolds and `HIDE LEGEND` folds it; in the role, each requirement line starts with name, state chip, necessity and weight only; the provenance line, confidence, source quotes and the weak-evidence reason unfold per line or for all lines. Clicking a PENDING cell lists its ids |
| J10b | Look at the margins | There are no panels: the left and right surfaces are text on the field, the void deepens toward the margins; the nearest reading and the role detail begin with a thin tether line from the field (cyan when the role is lit, red-tinted when unlit); the laws run as one quiet line under the canvas; role titles and prose are in a sans face, identifiers, numbers and labels in mono |
| J10c | Read the galaxy | Each organisation is a faint nebula tinting its sector (its colour only tells organisations apart; its brightness is the delivered organisation resonance); a thread runs from the core to every role with scored evidence, brighter with more resonance, and to no unlit role; small moons ring each role, one per requirement: solid cyan matched, amber wavering unresolved, dashed cyan spinning covered-unscored, hollow red no evidence. The right surface opens with one sentence: "<role> at <organisation>: pool resonance x% (presentation). a of n requirements matched with scored evidence, b unresolved, c covered by the sweep without a score, d without delivered evidence." `WHY PENDING` unfolds the canonical reason |
| J10d | Look for panels | There are none. At field level the only text beside the galaxy is one header line, the caption at the nearest role (title, one sentence, resonance, the four pending counts, OPEN ROLE →), the ⓘ LEGEND affordance bottom-left and the laws. Click a role: the camera glides onto it, its requirements spread out as named moons, the rest recedes, and one lens opens beside the role with its reading; hover a moon to light its line; ALL ROLES returns the camera. Click ⓘ LEGEND for the key and every explanation; click it again to fold |
| J11 | Enable "reduce motion" in the OS (or emulate it in DevTools: Rendering → prefers-reduced-motion) and reload | The field names `data-motion-mode="REDUCED"`; nothing moves, no breath, no flow, no orbit; every light value stays (a scored role is still lit by its resonance, an unlit role still unlit); all counts, labels and reveals are unchanged |

Evidence of the automated run: `17-job-field-overview-nearest-presented-role.png`, `18-job-field-role-pending.png` (all evidence revealed), `19-job-field-selected-from-field.png`, `20-job-field-semiontic-legend-hover.png` (legend open, nearest role hovered with its orbiting pending rings).

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
