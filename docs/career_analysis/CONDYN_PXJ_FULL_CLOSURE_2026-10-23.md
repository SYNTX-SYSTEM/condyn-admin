# CONDYN — PERSON × JOB full closure (2026-10-23)

Owner mandate „SYNTX::SFE::OWNER_GO_FULL_PXJ_CLOSURE“ (MODE STRICT_SFE, baseline 49e2bc6, G1 candidate 88539d3, branch
`frontend/pxj-first-screen-g1`; integration, deployment, production mutation and new Gemini calls forbidden). GELB record:
reconstruction, owner acceptance lab, navigation root causes, orchestration. Evidence: `evidence/pxj-full-closure/`.

Evidence classes are kept apart throughout: **PERSISTED_REAL_RESULT** (the one real Gemini PxJ run of 2026-10-22, read back, no new
call) · **STAND_IN** (GRÜN/PINK loopback stand-in labs) · **CODE_INSPECTION** · **MEASUREMENT** (browser/network observations).

## 1 Real result reconstruction (§02) — PERSISTED_REAL_RESULT

Read from the lab database of :41862 (`condyn_test_f96356700c836e92`, disposable, marked) in a session with
`default_transaction_read_only=on`; nothing written.

| Item | Value |
|---|---|
| Source | `cv.synthetic.pdf` (docId `doc_pdf_1792628828436` at intake, `DOC_001` in the analysis), source bundle `CSB_JOB_1792628993472_10`, bundle hash `5a199801…c637d` (same bundle as the PERSON run) |
| Analysis | `ANL_1792628993472_10` (validation VERIFIED), job `JOB_1792628993472_10` (SUCCEEDED, 1 attempt, 2026-10-22T00:29:53Z → 00:31:24Z) |
| Investigation mode | `PERSON_X_JOB` (job input `investigation.mode`) |
| Job pool | `JPOOL_B94850C439974E27496FE3B1A9A076B5` = `pool_dll_engineering_v1` v1 „DLL Engineering & Architecture Pool“, ACTIVE, 3 organisations / 9 roles / 79 requirements, canonical sha256 `b94850c4…eb58` |
| Organisation | `org_kestrel` — Kestrel Logistics Software GmbH |
| Role | `role_kestrel_fullstack` — Senior Full-Stack Engineer – Shipment Tracking |
| Role revision | `TRPREV_3B6311C862014DC6FC2556169EF78332` |
| Scope binding | investigation scope hash `8016b7c1…70e7`; Discovery `RUN_6BB62BDC23F64FB4EA01E827`, Convergence `CONV_A30D955F50347CB808FBE8FF` (projection reference row of this analysis) |
| Persisted capabilities | 8 capability proposals (projection) — TypeScript, React, Node.js, PostgreSQL, Event-Driven Architecture, Automated Testing, Web Platform Engineering, English; legacy `analysis.capabilities` (5 entries) is not used by B2 |
| B2 coverage | `SELECTED_ROLE_COVERAGE_V1`: 9 requirements, **8 COVERED, 1 NOT_COVERED** (`req_kestrel_fullstack_07` Geospatial Visualisation), `scored=false`, authority NONE, relation NOT_EVALUATED (reason VERIFIED_CAPABILITY_SNAPSHOT_ABSENT) |
| Evidence references | per covered requirement one quote from `DOC_001`, `evidenceState=SOURCE_MATCH_VERIFIED` (8 quotes) |

Inverse proof on the read route (`GET …/job-comparison`, acceptance lab, MEASUREMENT): other Kestrel role → 409
`SCOPE_MISMATCH`; unknown pool → 409 `SCOPE_MISMATCH`; the PERSON analysis `ANL_1792628831636_456` → 409 `NOT_SCOPED`; no
selection → 400 `SELECTION_REQUIRED`; unknown analysis → 404. No relation is substituted, no role taken over, no legacy fallback.
Full body: `evidence/pxj-full-closure/b2-kestrel-ANL_1792628993472_10.json`.

## 2 Owner acceptance lab (§03)

**Way chosen: a disposable copy.** The data is lawful to copy (synthetic CV from `docs/examples`, our own model output, a local
disposable test database; the shared `condyn` database is not involved) and technically exact. Procedure
(`evidence/pxj-full-closure/scripts/acceptance-lab.ts.txt`):

1. The source must be a positively identified disposable database (name pattern + disposable marker, read-only connection).
2. `pg_dump` in a read-only session → restore into a **new** disposable database (`createDisposableTestDatabase`).
3. Row-level comparison before start: count + md5 of the ordered rows for every table — 124 tables, **identical**
   (`copy-proof-41872.json`).
4. The server runs the candidate's code against the copy with **no Gemini key, no worker, the network sentinel and no inspector
   token**: no model can be reached, ANALYZE cannot execute. SIGTERM drops only the copy.

Lab :41862 stays untouched (PIDs unchanged). GRÜN's stand-in lab :41871 stays the STAND_IN reference. The real result is served on
its own port (:41872) so REAL and STAND_IN never share a screen or a database. *Deviation from „LAB_TARGET = 41871“ recorded here:*
41871 is GRÜN's running stand-in lab; replacing its data would mix the evidence classes.

## 3 First screen with the real result (§04) — on 88539d3

Walk `scripts/real-walk.mjs.txt` (MEASUREMENT on PERSISTED_REAL_RESULT, every API request recorded, any non-GET is a failure):

| Step | Result |
|---|---|
| R01 owner deep link | AVAILABLE · binding analysis `ANL_1792628993472_10` / pool / `role_kestrel_fullstack` · 9 rows, 8 covered, 1 not covered · 8 quotes, all verified · `scored=false` · no `%`, no score · boundary text „Name coverage … not scored · relation NOT_EVALUATED · not a competence verification · not a hiring decision“ · no legacy orbits 03–06, no VIEW MATCHES |
| R02 evidence inspection | focus on all 8 proposals: URL unchanged, 0 requests |
| R03 reload | identical to R01 |
| R04 UI path (analysis id only → pool → Kestrel → role → select as job → Capability Field) | AVAILABLE, identical to R01; reload identical |
| R05 role switch → reload → „select this role“ | ROLE_MISMATCH (no proposals, no coverage) → same after reload → AVAILABLE |
| R06 mode PERSON → reload → back | MODE_MISMATCH → same → AVAILABLE |
| R07 foreign pool / PERSON analysis under PxJ / unknown analysis | JOB_INVALID (capability gate closed, job offer states UPLOAD_NOT_FOUND, no coverage) · MODE_MISMATCH · RESULT_NOT_FOUND |
| Requests | GET only; no analyze, no Gemini route; 0 page errors |

Run 1 failed R05–R07a by walk-script errors (role click during the focus transition; JOB_INVALID expected in the wrong place); both
corrected, run 2 green. Both runs are kept (`walk-88539d3/`). The production measurement lab :41873 was stopped after the measurement (copy dropped).

**Why the owner saw „NO ANALYSIS“:** on the stand-in lab the role was selected without an analysis of that job; the first screen
is bound to an analysis id and never borrows one (no automatic role takeover, no latest-analysis inference). The real analysis is
reached by its id (deep link) or by running ANALYZE. A picker for existing analyses of the selected job does not exist — that is
new functionality (owner decision D-PICK, §6).

## 4 Navigation and recovery (§05) — root causes

| Item | Root cause | Classification | Closure |
|---|---|---|---|
| **O-RF-2 / X-22** | MEASUREMENT: `next dev` serves the page with `Cache-Control: no-cache, must-revalidate`. Chrome reuses the cached document on Back/Forward without revalidation (`Document 200 DISK`); that document never hydrates (no React fiber on the root, 0 API requests after 20 s, 3/3). The local production build sends `private, no-cache, no-store` → fresh document (`Document 200 NET`) → 3/3 AVAILABLE, identical to reload. | dev-server artefact, **not an app defect** | No app change. Owner acceptance runs on a production build. Cross-document Back/Forward is evidence only from a production build. |
| B-3 (prerequisite) | `next build` fails at type check: `app/api/admin/proxy/[...path]/route.ts` exports a non-route function (`handleProxy`). | pre-existing, backend file, outside §05 | Measurement/acceptance worktrees only: `typescript.ignoreBuildErrors` (never committed). Fix = owner decision. |
| **B-NAV** | Every URL write is `history.replaceState`; there is no popstate handler → Back leaves the page. | frontend semantics | GRÜN N-1: pushState for user decisions, replace for system writes, invariant NAV ≡ RELOAD. |
| **B-RUN** | The running job id lives only in memory; on reload the result is persisted but nothing points to it. `GET /api/career/jobs/{id}` is read-only (CODE_INSPECTION). | frontend | GRÜN N-2: `analysisJobId` in the URL, resume = GET polling only, no POST. |
| **O-RF-1** | `investigationModeFromParam` maps an unknown value to the default; the URL keeps it. | frontend | GRÜN N-3: remove an unknown value by replace. |
| **F-RF-4** | Comment in `app/career/demo/page.tsx` says analysisId „loads nothing into the planetarium“ — wrong since G1. | docs in code | GRÜN N-4. |
| **B-SRC** | Staged sources are browser memory only (files). Surviving a reload needs storing the CV either in browser storage or on the server. | **architecture/privacy decision** | GRÜN N-5: honest boundary hint only; persistence = owner decision D-SRC. |

## 5 Process

GRÜN implements N-1…N-5 isolated on `frontend/pxj-first-screen-g1` (regression test failing on 88539d3 first, inverse test,
stand-in walk incl. production Back/Forward). GELB checks, rebuilds the acceptance lab on the final SHA as a production build with
the copied real data, walks it at 1920×1080 and 1280×720, then PINK validates independently. Results follow in §7.

## 6 Owner decisions (open)

- **D-SRC** — B-SRC persistence: (a) keep the hint only (recommended for now); (b) staged files in browser storage (IndexedDB) —
  personal documents at rest in the browser; (c) server-side draft sources — new backend semantics and retention rules.
- **D-PICK** — UI way to an existing analysis of the selected job (list of analyses whose persisted scope equals the selected job,
  GET only). New functionality; today the way is the analysis id (deep link) or ANALYZE.
- **B-3** — fix of the proxy route type error so a production build works without the measurement override.
- **Integration GO** — none given; nothing integrated.
- Stop of lab :41862.
- **O-PXJ-720** — first-screen layout at 1280×720 (B2 below the fold, shell overlaps while scrolled): accept or assign a GRÜN layout fix.

## 7 Candidate 421e382 — GELB check and owner acceptance lab

GRÜN delivered N-1…N-5 as `421e382` on `frontend/pxj-first-screen-g1` (fast-forward of 88539d3): dea34eb N-1 B-NAV · ee91062 N-2
B-RUN · e6d9ba2 N-3 O-RF-1 · 1dcc273 N-4 F-RF-4 · 2f96e63 N-5 B-SRC · 421e382 evidence + JOB_FIELD_FRONTEND.md §13.2.39.

**GELB check (CODE_INSPECTION + test runs):** files only `app/components/career/demo/*`, `lib/career/ui/*`, `app/career/demo/page.tsx`,
tests under `test/career/pxj-first-screen/`, G1 evidence and §13.2.39 — no backend, API or DB file. New copy table
`navigation-copy.ts` beside the components (sil-language.ts was outside the file list; accepted). tsc: only the known relay-check
error. Focused group (`npm run test:isolated`, 23 files): **291/291**. Counter-proof by GELB: the 7 new test files on 88539d3 →
**32 FAIL / 9 PASS** (the 9 are inverse and guard tests), identical to GRÜN's record. Leak scan clean. Review notes: one user action
= one entry (first write push, the rest of the same task replace); system writes are replace; the remount releases the old job
controller (no polling, late answers ignored); `resumeJob` polls `GET /api/career/jobs/{id}` only; a URL job has no retry button.

**Owner acceptance lab** `http://127.0.0.1:41872/career/demo` — local production build (`next start`) of 421e382 with the
LAB_ONLY_BUILD_FLAG (`typescript.ignoreBuildErrors` in `next.config.ts`, not committed; diff and sha256 before/after in
`acceptance-421e382/`); database `condyn_test_e58e405b7791d0e8` = new disposable copy of `condyn_test_f96356700c836e92`, 124 tables
row-identical (`acceptance-421e382/copy-proof.json`); no worker, no Gemini key, network sentinel, no token.

**Walk on PERSISTED_REAL_RESULT** (`acceptance-421e382/real-walk-{1920x1080,1280x720}.json`, 37 shots): **28/28 steps ok in both
viewports**, all requests GET (206 per run), 0 page errors (console 404s only where an unknown id is the test).

| Step | 1920×1080 | 1280×720 |
|---|---|---|
| R01–R03 deep link, evidence focus, reload | AVAILABLE 9/8/1, 8 verified quotes, identical | same |
| R04 UI path pool → Kestrel → role → select as job → Capability Field (+ reload) | AVAILABLE, identical to deep link | same |
| R05 role switch / reload / back · R06 mode PERSON / reload / back | ROLE_MISMATCH · MODE_MISMATCH → AVAILABLE | same |
| R07 foreign pool · PERSON analysis under PxJ · unknown analysis | JOB_INVALID (offer, no coverage) · MODE_MISMATCH · RESULT_NOT_FOUND | same |
| R08 Back/Forward across documents (3 settle times) | 3/3 hydrated, AVAILABLE | same |
| R09 in-app history: 7 decisions → 7 entries; 6× Back + 6× Forward vs fresh load of each URL in a second tab | 12/12 equal (NAV ≡ RELOAD) | 12/12 |
| R10 `investigationMode=FOO` | removed, history length unchanged, AVAILABLE | same |
| R11 `analysisJobId=JOB_1792628993472_10` · unknown job · bad format | one GET on the job → analysisId set, parameter removed, AVAILABLE · NOT_FOUND banner with job id, no retry · removed | same |

**O-PXJ-720 (not PASS, owner decision):** at 1280×720 the B2 panel sits at 885,485–1256,925, i.e. below the fold; the coverage is
reachable only by scrolling the page (301 px) and then the panel (scrollHeight 2059 / clientHeight 438), and while the page is
scrolled the fixed shell overlaps the field (`REAL-R01b-scrolled-1280x720.jpg`). Present since G1 (GRÜN's STANDIN-layout.json
shows the same box). At 1920×1080 the panel is fully in view.

PINK validation: pending (§8).
