# HR Decision Looper: engineering record

Status: describes the implemented and tested state of `frontend/hr-decision-dock-finalization`
(merged on `integration/hr-decision-loop` @ `7d2a2b3`, G2 producer state `1fb55ca`, G3 binding state
incl. `87d09e1`, database isolation guard `48d52c2` and `7d2a2b3`). Local only. Not deployed.
This record points to the documents that own each part; it does not restate sealed contracts.

| Topic | Owning document |
| --- | --- |
| Field relation G2/G3, decisions D1 to D5 | `docs/architecture/decision-fields/G2_G3_FIELD_RELATION.md` |
| Vertical proof definition P0 to P8 | `docs/architecture/decision-fields/VERTICAL_INTEGRATION_PROOF.md` |
| Integration record, first broken relations, P-stage results, boundaries B-8D5, B-T11C, B-ENTRY, B-INGRESS | `docs/architecture/decision-fields/HR_DECISION_LOOP_INTEGRATION.md` |
| Independent validation rounds | `docs/architecture/decision-fields/HR_DECISION_LOOP_VALIDATION.md` |
| Frontend contract: wire shapes, laws, proofs, boundaries B1 to B11, finalization gaps G1 to G9 | `docs/career_analysis/HR_DECISION_LOOP_FRONTEND_INTEGRATION.md` |
| Frozen Decision Context API v1 | `docs/decision-runtime/LOCAL-DECISION-CONTEXT-API.md` |
| Manual test environment and walkthrough | `docs/career_analysis/HR_DECISION_LOOP_MANUAL_TEST.md` |
| Database isolation mandate and incident | `docs/incidents/2026-10-09-shared-condyn-database.md`, `lib/database-isolation/` |

## 1. Architecture (as implemented)

```text
browser  /career/demo?careerDecisionContextRevisionId=DCTXREV_…[&decisionContextRevisionId=DREV_…]
   │  SemanticCareerIntelligenceField (unchanged planetarium) + HrDecisionLoopDock
   │      useHrDecisionLoop: fetch / declare / lineage walk (client-safe decoders only)
   ▼
Next.js routes (transport only)
   GET  /api/career/hr-decision-loop/contexts/{DCTXREV}      → read model V1 (15 regions)
   POST /api/career/hr-decision-loop/decisions                → sealed T11C producer via local self-declared principal
   GET  /api/career/hr-decision-loop/decisions/{DCR}          → exact reread
   GET  /api/decision-contexts/{DREV}                         → frozen API v1 (G2), unchanged
   ▼
lib/career/hr-decision-loop (frontend field)
   local-composition: registration gate (unified R7 order only on a positively disposable database; no DDL otherwise) + createProductionHumanDecisionRecordDependencies + post-decision repositories
   server-read-service: index by exact lineage column → exact reread through each sealed repository
   declaration-application: capture five fields → admitHumanDecisionTransportIdentity → produceAndPersistHumanDecisionRecord
   ▼
sealed G3 (lib/career/relation*, *-admission, relation-adapters)        sealed G2 (lib/decision-core, -adapters, -runtime)
   DAR, DCTXREV, DCR, DAINT … COVFCR, DCDRB                              DREV_, API v1, R1 resolvers, R3 resolver-list root
   ▼
PostgreSQL: one disposable database per run (condyn_test_<16 hex>, marked, verified)
```

No import crosses the fields; `lib/career/hr-decision-loop` imports `lib/career` only (import-boundary test).

## 2. Data flow and state transitions supported by the UI

| Operator action | Transport | Sealed authority | Persisted effect | UI representation |
| --- | --- | --- | --- | --- |
| Open a context | GET contexts/{DCTXREV} | exact reads through sealed repositories | none | context, DAR, RCP subjects, 15 region states, bound DREV entry points |
| Declare a human decision | POST decisions | T11C: DAR declarant, window, class, subject admissibility; immutable identity | one DCR row set (or none) | DECLARED with exact DCR id → DCR family PERSISTED · n; REJECTED with the sealed reason verbatim; 409 for the same identity again |
| Read a DREV by explicit id or via a DCDRB entry point | GET decision-contexts/{DREV} repeated along `previousRevisionId` | frozen API v1 exact read | none | entry source (URL / INPUT / BINDING), ROOT / CHILD, BOUND / NOT BOUND / UNKNOWN, INVENTORY UNCHANGED / EXTENDED / PREDECESSOR NOT READ, terminal incl. absence vs failed read |
| Navigate to a foreign context named by an artifact | link `?careerDecisionContextRevisionId=` | none | none | OPEN EXACT CONTEXT links on feedback targets, binding parents, bound contexts |

Transitions the UI cannot cause (seeded only, boundary B-INGRESS): DAINT, HCOM, EAGR, ECTXREV, AOC,
SCD, ASCAD, CORD, COVD, COVFAD, COVFTD, COVFTRB, COVFCR, DCDRB, root or child DREV creation.

## 3. Provenance the operator can reconstruct

Every id shown in the dock is an exact key of a GET endpoint. Inverse walk by exact ids, proven in
`read-service.postgres.test.ts`: COVFCR → return item → COVFTRB → COVFTD → COVD → AOC → DCR →
DCTXREV → DAR and RCP; context → DCDRB → root DREV; child DREV → root DREV by `previousRevisionId`.
The child's OBSERVATION item names the exact COVD (`CONDYN_CAREER_CANONICAL_CHAIN` /
`CAREER_OUTCOME_VALENCE_DECLARATION_V1`); the dock shows it as INVENTORY EXTENDED, i.e. formed outside
the governed 8D return (B-8D5), never as a governed return.

## 4. Traceability

| Requirement | Implementation | Test | Observed effect |
| --- | --- | --- | --- |
| Consume exact persisted DCTXREV with witnesses | `server-read-service.ts`, `frontend-presentation.ts` | `read-service.test.ts`, `read-service.postgres.test.ts` #1, e2e HTTP #1 | 200 envelope, 15 regions AVAILABLE for context A |
| Human decision only through the G3 DCR gate (D1) | `declaration-application.ts`, `http.ts`, routes | `declaration-application.test.ts`, `http.test.ts`, `routes.test.ts`, postgres #2, e2e HTTP #2, browser #2 | 201 with DCR id; 401/403/404/409/422 mapped; sealed reasons verbatim |
| Represent action, outcome, feedback states as persisted / none / not provisioned / failed | read model regions, `RegionRail` | `read-service.test.ts` (NOT_PROVISIONED, FAILED), postgres #1/#2, browser #1 | labels per family, amber for NOT_PROVISIONED |
| Bound vs unbound DREV (R4, DCDRB) | region `decisionRevisionBindings`, `decisionRevisionBindingIdsFor`, dock cards | `decision-revision-binding-region.test.ts`, `frontend-presentation.test.ts` #7, postgres #4, browser #1 | bound root labelled with DCDRB id; child NOT BOUND; NOT_PROVISIONED and FAILED state the binding state as unknown |
| Reconstructed vs assumed next context | entry source in `useHrDecisionLoop`, section title and hint | `client-reads.test.ts` #3, browser #1 and #2 | ENTRY line; URL parameter follows the read |
| Direct child DREV vs governed return (B-8D5) | `describeDecisionContextLineage` | `frontend-presentation.test.ts` #6, browser #1 | INVENTORY EXTENDED (amber) vs UNCHANGED (non-claim) |
| Absence vs failure on reads | `readDecisionContextRevisionExact`, walk terminal `PREDECESSOR_READ_FAILED` | `client-reads.test.ts` #2/#3, `frontend-presentation.test.ts` #5, browser #2 | NOT FOUND for 404 only; FAILED with public code otherwise |
| Preserve the SIL field | additive props, conditional mount | `dock-ssr.test.tsx`, SIL locale wiring, `career-demo-e2e.test.tsx`, e2e SSR #4, browser #3 | no dock without the parameter; six stage shells and chrome unchanged |
| Database isolation for every run | `scripts/hr-decision-loop-local.ts` uses only `createDisposableTestDatabase` / `verifyDisposableTestDatabase` / `dropDisposableTestDatabase`; vitest global setup | `test/database-isolation/*` (GELB), script fail-closed runs recorded in section 6 | protected and unmarked names refused before any connection |

## 5. Runtime setup

See `HR_DECISION_LOOP_MANUAL_TEST.md`. Summary: `set -a; . ~/.config/condyn/test-db-role.env; set +a; npm run hr-loop:local`
checks that the admin role is the least-privilege test role (superuser refused without
`TEST_DATABASE_ALLOW_SUPERUSER=1`), creates and verifies a disposable database, runs `registerUnifiedPersistenceSchema`, seeds the world,
verifies again and starts `next dev --webpack` on `http://127.0.0.1:3017`. `npm run hr-loop:local:drop`
removes exactly that database. The HR Decision Loop composition root runs
`registerUnifiedPersistenceSchema` on first request only when the bound DATABASE_URL is a
positively verified disposable database (name pattern and marker); on any other database the
HR routes issue no DDL at all and absent families read as NOT_PROVISIONED. A server started on
a verified empty disposable database is therefore operational without the script; the script
still registers first so the seed can run before the server.

## 6. Test execution and results (2026-10-10, this branch, after merging the guard `7d2a2b3`)

How to run: `set -a; . ~/.config/condyn/test-db-role.env; set +a; npm run -s test:isolated -- <files>`
(least-privilege role `condyn_test_runner`; a superuser admin is refused without `TEST_DATABASE_ALLOW_SUPERUSER=1`).
The runner creates one marked disposable database, the vitest global setup verifies it before
any file runs, and the runner drops it afterwards. The e2e creates a second disposable
database of its own inside that run and drops it. Browser steps need
`CONDYN_PLAYWRIGHT_MODULE=<path to a playwright package>` (Playwright is not a repository
dependency); without it the browser section is reported as skipped.

| Run | Files | Database(s) | Result |
| --- | --- | --- | --- |
| Unit, SSR, HTTP transport, routes, declaration gate, read service, DCDRB region, client reads, SIL locale, demo e2e, import boundary | `test/career/hr-decision-loop/*` except e2e, `test/career-sil-*`, `test/career-demo-e2e.test.tsx`, `test/decision-integration/import-boundary.test.ts` | `condyn_test_e96e121defbfa641` (created, verified, dropped) | 13 files, 71 passed; `read-service.postgres.test.ts` 4/4 incl. inverse walks and DCDRB → root DREV with R1 resolution |
| HTTP + Chromium e2e (real `next dev --webpack`, production composition roots) | `test/career/hr-decision-loop/e2e/hr-decision-loop-frontend.e2e.test.ts` | `condyn_test_1ad7ff09be6c40e9` plus the suite's own world database (both dropped) | 7/7 in 92 s: envelopes and 201/400/401/403/404/409/422; frozen G2 GET and lineage walk; SSR with and without dock; browser: 15 persisted families, entry kind URL then BINDING, child INVENTORY_EXTENDED and NOT BOUND, root BOUND with the DCDRB id, URL parameter follows the read, absence vs failure, declaration rejected then persisted with exact reread, field without dock unchanged, no page errors |
| Manual environment, live | `npm run hr-loop:local` → `condyn_test_18eec094f8cc9d79` | created, verified twice, seeded, served on 3017, dropped | HTTP: context A 200 with 15 × AVAILABLE/1, DCR 200, root and child DREV 200 (child.previousRevisionId = root), absent DREV 404, dock rendered only with the parameter; POST on B: intruder 422 `ERR_HUMAN_DECISION_DECLARANT_MISMATCH`, decider 201, repeat 409. Chromium: 15 regions, child INVENTORY_EXTENDED, declaration ACCEPT_RECOMMENDATION persisted and listed, no page errors. Screenshots `06-manual-environment-context-a.png`, `07-manual-environment-context-b-declared.png` |
| Script fail-closed paths | `scripts/hr-decision-loop-local.ts` | none opened | missing admin URL → `ERR_TEST_DATABASE_ADMIN_URL_MISSING`; admin URL naming `condyn` → `ERR_TEST_DATABASE_ADMIN_URL_NOT_MAINTENANCE`; drop of `condyn` → `ERR_TEST_DATABASE_ISOLATION_PROTECTED`; drop of an unmarked, non-existent disposable name → refused |
| Composition root gate | `local-composition-gate.test.ts` (doubles, no connection), `local-composition.postgres.test.ts` | runner database | disposable identity → unified registration once per process, every family provisioned, seeded world served with 15 × AVAILABLE through the production root; non-disposable identity → no DDL |
| Final run as the least-privilege role `condyn_test_runner` (tip merged: `e43f11e`) | all of the above plus `test/database-isolation/least-privilege-role.test.ts` | `condyn_test_2b08dec7b4f06b6a` (created, verified, dropped) | 18 files, 90 passed; Chromium e2e 7/7 (103 s) |
| Script as the role | `npm run hr-loop:local:seed`, `:drop` | `condyn_test_1bb89b29238875ea` | admin role reported as least privilege; created, registered, seeded, dropped. Superuser admin without `TEST_DATABASE_ALLOW_SUPERUSER=1` → `ERR_TEST_DATABASE_ADMIN_SUPERUSER` before any database is created |
| Convergence run as the role (section 6.1) | all HR-loop files incl. `registration-client.test.ts`, SIL locale, demo e2e, import boundary, access paths, least-privilege role | `condyn_test_c0cbbad0eabe0af6` (created, verified, dropped) | 19 files, 91 passed; Chromium e2e 7/7 (58 s) |
| Type-check | `npx tsc --noEmit -p tsconfig.json`; the script separately | | 0 errors |

Preservation: sealed surfaces unchanged on this branch (`lib/decision-*`, `lib/career/relation*`,
`lib/career/*-admission`, `lib/career/db`, `lib/persistence`, `lib/database-isolation` carry only
GELB's merged commits); the SIL root chrome, six stage shells and locale wiring are asserted by
`dock-ssr.test.tsx`, the SIL locale suites and the e2e. The full `test/career` batch was not
re-run in this round (it was run by GELB and PINK on the integration tip under the guard; see
`HR_DECISION_LOOP_VALIDATION.md`); this branch adds no file outside `lib/career/hr-decision-loop`,
`lib/career/ui`, `lib/career/view-model/sil-language.ts`, the dock, the script and tests.

Operational note: Next.js 16 allows one `next dev` per project directory. Stop the manual
server before running the e2e in the same worktree (the e2e spawns its own server), or run the
e2e from another worktree.

### 6.1 Convergence round (2026-10-10, after the merge `63e7d9f`)

Top-down reconstruction on `integration/hr-decision-loop` @ `6f400ea` found two remaining
relations in this field that affected the manual operator; both are repaired and proven.

| Id | Broken relation | Evidence (RED) | Repair | Evidence (GREEN) |
| --- | --- | --- | --- | --- |
| C1 | The gated persistence registration ran the idempotent DDL through the application client, which has no notice handler; the first HR request flooded the server log with PostgreSQL NOTICE objects. | live environment, first `GET …/contexts/{A}`: 396 notice lines ("relation … already exists, skipping") | `registration-client.ts`: a dedicated single-connection client bound to the verified URL with notices silenced; the application client is never used for DDL (`local-composition.ts`) | same request on the repaired build: 0 notice lines, 0 error lines; `registration-client.test.ts` 1/1, `local-composition-gate.test.ts` 2/2 (verified URL → one client, one registration, client ended; non-disposable → no client, no DDL), `local-composition.postgres.test.ts` 2/2 |
| C2 | Every `npm run hr-loop:local` created a new disposable database even when the previous one still existed, so databases accumulated and the operator's seeded ids changed on every restart. | state file plus a second `up` → second database | `up` verifies the database of the state file with `verifyDisposableTestDatabase` and reuses it; a stale or missing state falls back to create; `up --fresh` forces a new database | live: "reusing verified disposable database condyn_test_73582a5bf02ddfa7", same ids, 200 on context A |

## 7. Known limitations and unresolved boundaries

| Id | Boundary | Owner |
| --- | --- | --- |
| B-8D5 | Governed 8D return cannot carry exact COVD provenance; the D2-shaped child exists only when formed directly. The dock reports the persisted difference and claims no governance. | Case 3, field owner |
| B-ENTRY | For the HR Decision Loop routes: `createLocalHrDecisionLoopHttpApplication` runs `registerUnifiedPersistenceSchema` only on a positively disposable database (proofs `local-composition.postgres.test.ts`, `local-composition-gate.test.ts`); on any other database, including the shared one, the HR routes issue no DDL and absent families read as NOT_PROVISIONED. Registration for a non-disposable database remains the owner's composition decision. The canonical SIL routes and the career worker still use `initDbSchema()`; the G2 route registers `decision_context_revisions` itself. | owner decision for non-disposable databases |
| B-INGRESS | No HTTP ingress for DAINT … COVFCR, DCDRB, root or child DREV creation; the dock represents these, seeded only. | separate work unit |
| B2 | Local self-declared principal; not authentication. | identity provider decision |
| B8 / B10 / B-T11C | Several DCRs per context are listed, none selected; admissibility is the sealed gate's verdict rendered verbatim. | G3 semantics |
| B7 | Playwright is not a repository dependency. | tooling decision |
| B9 | `next build` fails route type-checking on the pre-existing admin proxy route. | outside this field |
| DB-1 | The seven legacy lifecycle rows of the shared database are gone; recorded in `docs/incidents/2026-10-09-shared-condyn-database.md`; no restoration attempted. | owner |
