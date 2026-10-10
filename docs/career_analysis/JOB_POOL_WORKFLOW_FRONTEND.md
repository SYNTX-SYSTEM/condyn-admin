# Job Pool Workflow — SIL Frontend Field

Status: implemented on `frontend/job-pool-workflow` (base `integration/job-pool-connection` @ `120e0ce`, GELB's routes merged at `b782793`).
Field owner: GRÜN (frontend). Backend and contract: GELB (`docs/architecture/decision-fields/JOB_POOL_CONNECTION.md`).
Independent validation: PINK.

Owner mandate (2026-10-10, "SFE FIELD — JOB CONNECTION FRONTEND"): complete the user-facing workflow so a user can
upload a Job Pool as JSON, run the existing PDF/GitHub-to-Gemini capability sweep, and inspect the resulting
capability-to-job relations and recommendations; reuse existing UI and contracts; coordinate the API boundary with
GELB; never touch the shared `condyn` database; no production deployment.

## 1. Reconstruction (FIELD → RELATION → STATE)

| Element | Before this field | Source |
| --- | --- | --- |
| Source upload and capability sweep | `IdentityCoreDropZone` stages PDF/text/GitHub/website documents; `CareerJobController` POSTs `/api/career/analyze`, polls `/api/career/jobs/{id}`, then loads `/api/career/analyses/{id}`; the worker (`scripts/run-career-worker.ts`) runs Gemini and persists one VERIFIED `CanonicalCareerAnalysis` | `lib/career/ui/career-job-controller.ts`, `lib/career/orchestration/*` |
| Planetarium orbits 01–06 | Built by `adaptCanonicalToDemoState` from the analysis's own extracted `organizations`, `roles`, `strategies` entities. They are model extractions from the CV, not pool matches | `lib/career/ui-adapter.ts` |
| Legacy pool matching | `GET /api/career/analyses/{id}` computes `matchCareerAnalysisAgainstPool(analysis, DEMO_COMPANY_POOL)` and `generateCareerRecommendations`; no UI reads either; the matcher reads `capability.name` while canonical capabilities carry `identity.name` (GELB, Case 1 defect) | `app/api/career/analyses/[analysisId]/route.ts`, `lib/career/matching/engine.ts` |
| `RoleMatchPanel.tsx` | Exists, never imported; takes `DemoRoleMatch` (fitScore, string arrays), which cannot carry `matchBasis`, evidence quotes or canonical ids | `app/components/career/demo/RoleMatchPanel.tsx` |
| HR Decision Dock | Operational on an exact DCTXREV; mounted only with `careerDecisionContextRevisionId` | `HR_DECISION_LOOP_FRONTEND_INTEGRATION.md` |
| Job Pool upload, selection, matching | Absent | — |

Conclusion: the missing delta is a frontend panel over GELB's four routes. The planetarium, the sweep flow and the dock
are reused unchanged; `RoleMatchPanel` is left untouched because adapting it would require inventing a mapping.

## 2. Realized relations

```
[file chooser] ──bytes unchanged──► POST /api/career/job-pools ──► JobPoolUploadView (201 new | 200 identical)
                                            │ lists itself, never selects itself
GET /api/career/job-pools ──► explicit click ──► jobPoolUploadId (URL param, replaceState)
                                            │
GET /api/career/job-pools/{id} ───────────► selected upload + canonical mapping (layer C) as delivered
                                            │
analysis id  ◄── succeeded sweep (CareerJobController.resultAnalysisId)  OR  URL param analysisId
                                            │
GET /api/career/job-pools/{id}/matches?analysisId=ANL_… ──► JobPoolMatchPresentation (layer P) as delivered
                                            │
                                   JobPoolMatchPanel (left, collapsed by default)        no edge ──╳──► HR dock (layer D)
```

Files of this field:

| File | Role |
| --- | --- |
| `lib/career/job-pool/frontend-presentation.ts` | Client-safe strict decoders of the §5 bodies; label derivation from literal fields; ranking descriptor (delivered order, monotone or not); selection and analysis-source descriptors |
| `lib/career/ui/useJobPool.ts` | `listJobPools`, `uploadJobPool`, `readJobPoolUpload`, `fetchJobPoolMatches` over closed unions; `useJobPoolWorkflow` hook |
| `app/components/career/demo/JobPoolMatchPanel.tsx` | The panel: upload, list, explicit selection, selected upload with canonical mapping, analysis source, ranked role matches, organization aggregates, non-claims |
| `app/career/demo/page.tsx`, `CareerIntelligenceDashboard.tsx`, `SemanticCareerIntelligenceField.tsx` | Additive props `analysisId`, `jobPoolUploadId`; root attribute `data-job-pool-upload`; panel mounted after the dock |
| `lib/career/view-model/sil-language.ts` | `jobPool` copy block (en, de) |
| `scripts/hr-decision-loop-local.ts`, `package.json` | `up --with-worker` / `npm run job-pool:local`: job-pool registration, career worker on the verified disposable URL |
| `test/career/job-pool/**` | Unit, SSR, HTTP and Chromium proofs |

## 3. State model shown to the user

Every state below is a distinct DOM state (`data-*` attribute plus visible copy); none is collapsed into another.

| Dimension | States |
| --- | --- |
| Upload list | `IDLE/LOADING`, `AVAILABLE`, `EMPTY` (no upload persisted), `NOT_PROVISIONED` (503 gate: no verified disposable database), `FAILED` (code) |
| Upload | `SUBMITTING`, `CREATED` (201), `IDENTICAL_EXISTS` (200), `REJECTED` (400/413/422 with code and `issues` verbatim), `NOT_PROVISIONED`, `FAILED` |
| Selection | `NONE`, `LISTED` (exact id among the persisted uploads), `NOT_LISTED` (stale URL id, named, never dropped) |
| Selected upload read | `LOADING`, `AVAILABLE` (with canonical mapping `MAPPED · PROPOSAL_ONLY · authority NONE`), `NOT_FOUND`, `NOT_PROVISIONED`, `FAILED` |
| Analysis source | `NONE`, `JOB_RESULT` (this session's succeeded sweep), `URL` (exact id, assumed persisted) |
| Matches | `IDLE`, `LOADING`, `AVAILABLE`, `NOT_FOUND` (pool or analysis), `INACTIVE_POOL` (409), `NOT_PROVISIONED`, `FAILED` |
| Ranking | `MONOTONE_BY_RESONANCE`, `DELIVERED_ORDER_NOT_MONOTONE` (shown unchanged, flagged), `EMPTY` |
| Per role | rank, `resonanceScore`, matched / weak-evidence / missing requirements with `matchBasis`, evidence quotes (`docId`, verbatim quote) or `NO EVIDENCE QUOTE DELIVERED`, canonical `TRPREV`, `TRQREV` ids, `NOT_EVALUATED · VERIFIED_CAPABILITY_SNAPSHOT_ABSENT` |
| Layer labels | `DETERMINISTIC PRESENTATION`, `NOT A CANONICAL EVALUATION`, `NOT A DECISION`, each derived from one literal field of the delivered presentation block |

Laws kept visible: `PRESENTED != EVALUATED · UPLOADED != SELECTED · RANKED != RECOMMENDED · MISSING != GAP DECISION`.

## 4. Non-claims and authority

- The frontend re-scores nothing, re-ranks nothing, parses no pool and repairs no pool. A body whose presentation block
  claims a canonical evaluation or a decision is undecodable (`FAILED`), not rendered with softened labels.
- The analysis id is never inferred: it is this session's succeeded sweep or an explicit URL id. There is no analysis list
  and no "latest analysis". The URL id feeds only the panel; the planetarium keeps its job-driven state.
- The selected upload is never inferred: there is no "latest pool". An upload lists itself and must be clicked.
- No path leads from the panel to the HR Decision Dock. The dock still mounts only for an exact DCTXREV.
- Uploader identity is self-declared (`x-condyn-principal-actor-id`), not authenticated (B-JP-ACTOR).

## 5. Boundaries

| Id | Boundary |
| --- | --- |
| B-JP-REC | "Recommendations" (owner mandate) have no object in the v1 contract. The panel presents the delivered missing and weak-evidence requirements per role and labels them as presentation gaps, not recommendations. The legacy `generateCareerRecommendations` runs against the TypeScript `DEMO_COMPANY_POOL` inside the analysis GET, is read by no UI, and is not connected to uploaded pools. Flagged to GELB; a recommendation layer over uploaded pools is a contract decision, not a frontend one. |
| B-JP-LEGACY-MATCH | The legacy matcher's `capability.name` defect (GELB, Case 1) lives in `lib/career/matching`, GELB's field. Untouched here. |
| B-JP-CONTINUITY | A new pool version is a new upload with new canonical entities; the panel shows them as separate uploads. |
| HIA-1 | Canonical Capability-Requirement evaluation needs a `PHASE4_VERIFIED` snapshot; the panel shows `NOT_EVALUATED` with the delivered reason and never suggests otherwise. |
| B-ENTRY | The routes answer 503 without a verified disposable database; the panel shows `NOT_PROVISIONED`. No DDL from the frontend. |
| B-GEMINI | The real sweep needs `GEMINI_API_KEY` in the operator's shell; the manual environment fails closed without it and never stores it. The e2e seeds one analysis row directly and makes no model call. |
| B-GEMINI-MODEL | `DEFAULT_GEMINI_MODEL_CASCADE[0]` (`gemini-2.0-flash`) answered 404 for the operator key on 2026-10-10 and `gemini-2.5-flash` "no longer available to new users"; the worker's discovery provider masks the cause as `ERR_CAPABILITY_DISCOVERY_PROVIDER_FAILURE`. `GEMINI_MODEL=gemini-3.8-flash` verified. The cascade is GELB's provider field; reported as an environment boundary to the owner. |
| B-JP-CANDIDATES | The matcher reads the analysis's canonical `capabilities` (legacy pipeline output). For the real CV sweep that is 2 capabilities (TypeScript, Node.js), while the F11 proposal projection of the same analysis carries 7 richer capabilities (e.g. "Relational Database Schema Design", "Automated Software Testing Implementation") that the matching never sees. `candidateCapabilityCount` makes this visible in the panel. Which capability set matching should read is a contract decision (GELB/owner), not a frontend one. |
| B-PEER-KILL | Several sessions run `next dev` and career workers on one machine. A pattern kill from outside (`pkill -f`) terminated this environment mid-sweep (exit 143) on 2026-10-10. Operators stop by PID. |
| B-WORKTREE | Turbopack rejects the shared `node_modules` symlink of worktrees; the manual environment and the e2e spawn `next dev --webpack`. One `next dev` per project directory: stop the manual server before running the e2e in the same worktree. |

## 6. Proofs

| Proof | File | Content |
| --- | --- | --- |
| P-U1 | `test/career/job-pool/frontend-presentation.test.ts` | Exact decode of the §5 bodies; refusal of every softened or foreign claim; labels from literal fields; delivered-order ranking; counts; explicit selection and analysis source |
| P-U2 | `test/career/job-pool/client-reads.test.ts` | Each route over a scripted fetch: all documented status codes, header and body passthrough, undecodable bodies as FAILED, pair mismatch refused |
| P-S | `test/career/job-pool/panel-ssr.test.tsx` | Server render: collapsed toggle by default, panel for an explicit id, coexistence with the dock, locale, dashboard threading; field chrome and stage shells preserved |
| P-H | `test/career/job-pool/e2e/job-pool-workflow.e2e.test.ts` (HTTP section) | Real server on a disposable database: EMPTY → 201 → 200 identical → list; 400/422 JSON, schema, reference; matches for the exact pair with EXACT basis and the verbatim evidence quote, every absent requirement reported, canonical NOT_EVALUATED per role, counts coherent with TRQREV ids, one TSREV per upload; 404 pool/analysis; DRAFT copy → 409 |
| P-B | same file (Chromium section) | Upload through the real file chooser, list without selection, explicit select, URL param, labels, rank 1 role, evidence quote, canonical state, TRQREV count; reopen from URL; DRAFT pool shown inactive; stale selection named; planetarium and no-dock preserved; screenshots in `docs/career_analysis/evidence/job-pool/` |
| P-R | HR loop suites (`test/career/hr-decision-loop/*` non-Postgres set), `npm run -s test:isolated -- test/career/job-pool test/career/hr-decision-loop` | Preservation of the dock field |
| P-M | `JOB_POOL_WORKFLOW_MANUAL_TEST.md` | Manual: real Gemini sweep, JSON upload, matching in the browser |

Run record: see §7.

## 7. Run record

| Date | Revision | Run | Result |
| --- | --- | --- | --- |
| 2026-10-10 | `99530f2` | `npm run -s test:isolated -- test/career/job-pool` (3 files) | 16 passed |
| 2026-10-10 | `99530f2` | HR loop non-Postgres suites (8 files) | 28 passed |
| 2026-10-10 | `99530f2` | `HR_LOOP_LOCAL_PORT=3019 tsx scripts/hr-decision-loop-local.ts up` smoke | fresh disposable DB, unified registration, panel server-rendered for `?analysisId&jobPoolUploadId`, 0 NOTICE lines; `serve --with-worker` without `GEMINI_API_KEY` exits 1 with `ERR_HR_LOOP_LOCAL_GEMINI_API_KEY_MISSING` |

| 2026-10-10 | `3d16882`+ (merge of `b782793`) | `npm run -s test:isolated -- test/career/job-pool` with `CONDYN_PLAYWRIGHT_MODULE` (9 files incl. GELB's JP-U/JP-C/JP-H suites) | 51 tests: 50 passed, 1 failed in my browser test's id extraction (regex swallowed the adjacent pool name); fixed by reading `data-upload-id` |
| 2026-10-10 | after fix | `test/career/job-pool/e2e` + `panel-ssr` | 13 passed: HTTP 5/5, Chromium 3/3 (screenshots 01–05 in `evidence/job-pool/`), SSR 5/5 |
| 2026-10-10 | after fix | `test/career/hr-decision-loop` without e2e (12 files, incl. both Postgres suites) | 43 passed (preservation of the dock field) |
| 2026-10-10 | after fix | `tsc --noEmit` | 0 errors |

| 2026-10-10 | `c5b8b1f`…`7345ab6` (merges of `3c67bf1`, `ea8db60`, `b6986ff`) | P-M on `condyn_test_7051858fa3a39cb5`, least-privilege role, real key, `GEMINI_MODEL=gemini-3.8-flash` | Attempt 1 (before `3c67bf1`): job FAILED `ERR_CANDIDATE_SOURCE_BUNDLE_IMMUTABLE_CONFLICT` (D-JP-2/3, fixed by GELB). Attempt 2 (default model): `ERR_CAPABILITY_DISCOVERY_PROVIDER_FAILURE`, raw cause 404 on `gemini-2.0-flash`; `gemini-2.5-flash` "no longer available to new users" (B-GEMINI-MODEL). Attempt 3 (`gemini-3.8-flash`): HTTP sweep SUCCEEDED in ~56 s → `ANL_1791657048184_448`; matches 200: role_fullstack 0.461 (TypeScript EXACT, Node.js EXACT; React, PostgreSQL, Automated Testing missing), role_frontend_lead 0.217, four roles 0; `candidateCapabilityCount` 2 vs 7 projection capabilities (B-JP-CANDIDATES); analysis GET 500 `ERR_CAPABILITY_PROPOSAL_PROJECTION_LINEAGE_INVALID` (D-JP-4/5, fixed by GELB in `ea8db60`, re-read 200). Browser evidence 06/07. Attempt 4 (browser-driven, after `ea8db60`): environment terminated from outside mid-sweep (exit 143, B-PEER-KILL). Attempt 5 (browser-driven, after `b6986ff`): text source → `START INTAKE ANALYSIS` → success banner after 70 s → planetarium populated (identity 1, capabilities 7, organisations 2, roles 2) → panel `data-analysis-source=JOB_RESULT` for `ANL_1791657789692_675`, matches AVAILABLE: role_fullstack 0.835 rank 1 (TypeScript EXACT, React ALIAS via React.js, Node.js EXACT, PostgreSQL EXACT; Automated Testing missing), role_frontend_lead 0.461, role_data 0.276 (SQL ALIAS via PostgreSQL), three roles 0; `candidateCapabilityCount` 4; six stage shells, no dock, 0 page errors. Evidence 08/09/10. |

| 2026-10-10 | `7345ab6`+ (incl. `b6986ff`) | `npm run -s test:isolated -- test/career/job-pool test/career/hr-decision-loop` without the HR e2e, with `CONDYN_PLAYWRIGHT_MODULE` | 21 files, 96 tests passed (Job Pool e2e 8/8 incl. Chromium 3/3; GELB's JP suites; HR loop 12 files incl. both Postgres suites); `tsc --noEmit` 0 errors |

Additional backend codes observed in the merged routes and how the panel shows them: `400 ERR_JOB_POOL_ACTOR_INVALID`
(upload REJECTED with code), `400 ERR_ANALYSIS_ID_REQUIRED` (matches FAILED with code; the panel never sends an empty id),
`404 ERR_ANALYSIS_NOT_FOUND` (matches NOT_FOUND with code and message).
