# HR Decision Loop: SIL Frontend Integration

Status: IMPLEMENTED AND PROVEN LOCALLY on branch `frontend/hr-decision-loop`
(worktree `condyn-admin-hr-frontend`, base `435a112`, the D5 integration base).
Not deployed. Not a visual seal beyond the recorded screenshots.

This document is the integration contract between the SIL frontend and the two
decision fields: G2 (generic Decision Core, frozen local API v1) and G3 (Career
canonical chain: DAR, DCTXREV, DCR, DAINT ... COVFCR). It records what the
frontend consumes, what it may declare, what it represents, and what it does
not claim. Decisions D1 to D5 of
`docs/architecture/decision-fields/G2_G3_FIELD_RELATION.md` are binding here.

## 1. Field

```text
/career/demo?careerDecisionContextRevisionId=DCTXREV_…[&decisionContextRevisionId=DREV_…]
  -> CareerIntelligenceDashboard -> SemanticCareerIntelligenceField
       -> (unchanged) planetarium, SourceDock, zoom telemetry, Inspector, HUD, guide, codex, onboarding
       -> HrDecisionLoopDock  (fixed, right, below the Semantic Guide toggle; rendered only for an explicit DCTXREV)
            uses useHrDecisionLoop
              GET  /api/career/hr-decision-loop/contexts/{careerDecisionContextRevisionId}
              POST /api/career/hr-decision-loop/decisions
              GET  /api/career/hr-decision-loop/decisions/{humanDecisionRecordId}
              GET  /api/decision-contexts/{revisionId}          (frozen Decision Context API v1, unchanged)
```

Server side, `lib/career/hr-decision-loop/`:

| Module | Role |
| --- | --- |
| `read-model.ts` | `HR_DECISION_LOOP_READ_MODEL_V1`: exact DCTXREV, DAR, RCP and fifteen regions: one per post-decision family plus `decisionRevisionBindings` (DCDRB, R4) |
| `server-read-service.ts` | relational index by exact lineage column, exact reread through the sealed repository of each family, region states `AVAILABLE / EMPTY / NOT_PROVISIONED / FAILED` |
| `declaration-application.ts` | captures the five declaration fields, admits the transport identity, runs the sealed T11C producer unchanged |
| `http.ts` | transport only; public codes `ERR_HR_DECISION_LOOP_API_*`; bounded `reason` allowlist of sealed T11C codes for 422 |
| `local-composition.ts` | binds `createProductionHumanDecisionRecordDependencies` and the post-decision Postgres repositories to the one physical client, after a gated `registerUnifiedPersistenceSchema` (R7 order; only on a positively disposable database, no DDL otherwise) |
| `frontend-presentation.ts` | client-safe decoders of the three wire shapes and the exact lineage walk |

No file under `lib/decision-core`, `lib/decision-runtime`, `lib/decision-adapters`,
`lib/career/relation*`, `lib/career/*-admission`, `lib/career/db` or
`test/decision-*` is modified (`git diff --stat 435a112` on those paths is empty).

## 2. Relations consumed

| Relation | Carrier | Direction | Exactness |
| --- | --- | --- | --- |
| Decision context | G3 `CareerDecisionContextRevision` (DCTXREV) | read | exact id from the URL; never inferred |
| Authorization to decide | G3 `DecisionAuthorityGrantRevision` (DAR) | read | witness of the DCTXREV, reread by exact id |
| Recommendation | G3 `RecommendationProposal` (RCP) | read | witness of the DCTXREV; subjects shown by ordinal |
| Human decision act | G3 `HumanDecisionRecord` (DCR) only (D1) | declare, read | POST through the sealed DAR gate; GET by exact id |
| Intent, commitment, execution, occurrence, state change, association, outcome role, valence | G3 DAINT, HCOM, EAGR, ECTXREV, AOC, SCD, ASCAD, CORD, COVD | read | indexed by `career_decision_context_revision_id`, reread by exact id |
| Feedback admission, target, binding, revision | G3 COVFAD, COVFTD, COVFTRB, COVFCR | read | COVFTRB indexed by target DCTXREV; COVFCR walked by exact parent ids |
| Reconstructed next Decision Context | G2 `DecisionContextRevision` (DREV) | read | explicit exact id; lineage by `previousRevisionId` only (D2: an OBSERVATION with `AUTHORITATIVE_STATE` provenance to the exact COVD) |

Integrated on `integration/hr-decision-loop` (2026-10-10): the DCTXREV to DREV binding
(R4, decision D4) is the fifteenth region `decisionRevisionBindings`, indexed by
`career_decision_context_revision_id` and reread exactly through
`PostgresCareerDecisionContextDecisionRevisionBindingRepository`. The dock lists every
bound DREV id as an exact entry point into the frozen G2 GET; it never selects one, never
reads the DREV from the binding payload, and labels a binding as a persisted structural
witness only (not current, not accepted, not a governed 8D return). The manual exact-id
input remains.

## 3. Wire contract

### GET `/api/career/hr-decision-loop/contexts/{careerDecisionContextRevisionId}`

```json
{ "success": true, "hrDecisionLoop": { "schemaVersion": "HR_DECISION_LOOP_READ_MODEL_V1",
  "careerDecisionContextRevision": "<CareerDecisionContextRevision>",
  "decisionAuthorityGrantRevision": "<DecisionAuthorityGrantRevision>",
  "recommendationProposal": "<RecommendationProposal>",
  "decisions": { "state": "AVAILABLE|EMPTY|NOT_PROVISIONED|FAILED", "artifactIds": ["…"], "artifacts": ["…"], "failureCode?": "…" },
  "actionIntents": "…", "commitments": "…", "executionAuthorityGrants": "…", "executionContexts": "…",
  "actionOccurrences": "…", "stateChanges": "…", "associations": "…", "outcomeRoles": "…", "outcomeValences": "…",
  "feedbackAdmissions": "…", "feedbackTargets": "…", "feedbackTargetBindings": "…", "feedbackContextRevisions": "…",
  "decisionRevisionBindings": "…" } }
```

Artifacts are the sealed artifacts verbatim. `artifactIds` are sorted by id,
never by time. 404 `ERR_HR_DECISION_LOOP_API_NOT_FOUND` for an absent exact id;
422 `ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED` with `reason` for an invalid id
or a missing witness; 500 `ERR_HR_DECISION_LOOP_API_INTERNAL` otherwise.

### POST `/api/career/hr-decision-loop/decisions`

Headers: `x-condyn-principal-issuer: LOCAL_DEVELOPMENT_SELF_DECLARED`,
`x-condyn-principal-subject: <declarantActorId>`.

```json
{ "careerDecisionContextRevisionId": "DCTXREV_…", "declarantActorId": "…",
  "declarationClass": "ACCEPT_RECOMMENDATION|REJECT_RECOMMENDATION|DEFER_DECISION|REQUEST_FURTHER_EVIDENCE|REQUEST_TARGET_CLARIFICATION",
  "declaredAt": "<ISO>", "declarationEvidenceRefs": ["…"] }
```

Exactly these five keys. `createdAt` is set by the server clock and is outside
the record identity. Responses: 201 `{ "success": true, "humanDecisionRecord" }`;
400 invalid JSON; 401 no admitted principal; 403 principal is not the declarant;
404 exact context or witness absent; 409 immutable conflict (same identity,
different `createdAt`); 422 rejected with `reason` from the allowlist
`ERR_HUMAN_DECISION_DECLARANT_MISMATCH`, `…_CLASS_NOT_PERMITTED`,
`…_SUBJECT_KIND_NOT_PERMITTED`, `…_SUBJECT_NOT_ADMISSIBLE`,
`…_AUTHORITY_NOT_APPLICABLE`, `…_CONTEXT_INVALID`, `…_AUTHORITY_GRANT_INVALID`,
`…_RECOMMENDATION_PROPOSAL_INVALID`, `ERR_HUMAN_DECISION_INVALID`,
`ERR_HR_DECISION_LOOP_DECLARATION_INVALID`; 500 otherwise.

### GET `/api/career/hr-decision-loop/decisions/{humanDecisionRecordId}`

200 `{ "success": true, "humanDecisionRecord" }` or 404. No selection among records.

## 4. Laws kept

```text
PERSISTED != TRUE ; DECLARED != DONE ; RETURN != NEW DECISION ; ROOT != HEAD != LATEST
ONE CARRIER PER RELATION: the DCR is the only human decision carrier (D1)
NO IMPORT ACROSS FIELDS: the frontend imports no lib/decision-core type into G3 code and vice versa
NO PREFIX-ONLY IDENTITY: every read is by exact id; every index is by exact lineage column
NO CURRENT / LATEST / HEAD: no region, envelope or UI label selects one artifact over another
```

The read model carries no `current`, `head`, `latest`, `active`, `accepted`,
`authority`, `verified`, `loopClosed`, `success` or `status` key. The UI shows
every persisted DCR of a context as a list; where two exist, both are shown and
neither is "the" decision.

## 5. Proof

Run on 2026-10-09 against isolated PostgreSQL databases `condyn_hrloop_*`
(created and dropped per run; the shared `condyn` database is never used).

| Kind | File | Result |
| --- | --- | --- |
| LOCAL: decoders, lineage walk | `test/career/hr-decision-loop/frontend-presentation.test.ts` | 5/5 |
| LOCAL: read service regions, COVFCR parent walk | `test/career/hr-decision-loop/read-service.test.ts` | 4/4 |
| LOCAL: declaration gate (identity, DAR window, class, conflict) | `test/career/hr-decision-loop/declaration-application.test.ts` | 5/5 |
| LOCAL: HTTP transport mapping | `test/career/hr-decision-loop/http.test.ts` | 3/3 |
| LOCAL: routes are transport only | `test/career/hr-decision-loop/routes.test.ts` | 4/4 |
| PRESERVATION (SSR): dock only for an explicit DCTXREV, full chrome and six stage shells present, locale follows SIL | `test/career/hr-decision-loop/dock-ssr.test.tsx` | 4/4 |
| INTEGRATION (PostgreSQL): all fourteen families AVAILABLE for context A, EMPTY for context B, DCR persisted for B through the sealed gate, rejections, 409 | `test/career/hr-decision-loop/read-service.postgres.test.ts` | 3/3 |
| INVERSE (PostgreSQL): COVFCR → binding → COVD → AOC → DCR → DCTXREV → DAR, RCP; child DREV → root DREV by exact ids; G3 marker absent from G2 payloads | same file | 3/3 |
| INTEGRATION (real `next dev`, production composition roots): envelopes, 201/400/401/403/404/409/422, frozen G2 GET and lineage walk, SSR with and without the dock | `test/career/hr-decision-loop/e2e/hr-decision-loop-frontend.e2e.test.ts` | 4/4 |
| BROWSER (Chromium via Playwright): context A with fourteen persisted states and the DREV lineage to root, declaration rejected then persisted on context B, exact reread of the rendered DCR id, field without dock unchanged, no page errors | same file, `CONDYN_PLAYWRIGHT_MODULE=<playwright package>` | 3/3 |

Screenshots: `docs/career_analysis/evidence/hr-decision-loop/01…04.png`.

### Preservation and regression (same day, this worktree)

| Scope | Result |
| --- | --- |
| `npx tsc --noEmit -p tsconfig.json` | 0 errors (base `435a112`: 0) |
| G2: `test/decision-core`, `test/decision-runtime`, `test/decision-adapters` | 46 files, 442 tests: 441 passed, 1 skipped; the sealed R5 HTTP e2e fails only at server spawn in this worktree (Turbopack symlink, B6), file unchanged |
| G3 and frontend: `vitest run test/career` (sealed suites plus the new ones) | 292 files, 1688 tests: 1671 passed, 9 skipped, 8 timed out at 5000 ms in the three deep COVFCR suites while a peer integration run held the load average at 6; rerun with `--testTimeout=30000`: 19/19 passed (content green, load timeouts only) |
| Top-level legacy and SIL suites: `test/*.test.ts(x)` | 129 files, 665 tests: 657 passed, 8 skipped (live-provider guards), 0 failed |
| Sealed surfaces | `git diff --stat 435a112` is empty for `lib/decision-*`, `lib/career/relation*`, `lib/career/*-admission`, `lib/career/db`, `lib/career/capability-core`, `lib/career/target*`, `test/decision-*` |
| Modified existing files | `app/career/demo/page.tsx`, `CareerIntelligenceDashboard.tsx`, `SemanticCareerIntelligenceField.tsx` (additive props, one data attribute, one conditional mount), `lib/career/view-model/sil-language.ts` (new `decisionLoop` copy in both locales) |

The isolated world (`test/career/hr-decision-loop/fixtures/hr-loop-postgres-world.ts`)
builds TSREV, TOREV, TRSB, TROB, TRPREV, TRQREV, PHASE4_VERIFIED snapshot,
TRQINV, RRA, RRL, TSN, EIS, RPR, RCP, DAR, DCTXREV A and B, then the complete
chain DCR → DAINT → HCOM → EAGR → ECTXREV → AOC → SCD → ASCAD → CORD → COVD →
COVFAD → COVFTD → COVFTRB → COVFRR → COVFRI → COVFCC → COVFCT → COVFCR on A,
and a G2 root plus child DREV. Every artifact is constructed by the sealed
`create*`/`produce*` function of its family and persisted through its own
repository; raw SQL is used only for database creation and table provisioning.

## 6. Boundaries

| Id | Boundary | State |
| --- | --- | --- |
| B1 | `initDbSchema()` does not provision the post-decision tables (DAINT … COVFCR); the read service represents them as `NOT_PROVISIONED`. The proofs provision them test-side from the drizzle declarations. On `integration/hr-decision-loop` a `lib/persistence/registerUnifiedPersistenceSchema(sql)` exists (T11 + post-decision chain + `decision_context_revisions` + bindings) but is not wired into an entry point; wiring it is a composition decision. | Field 01 / R7 owner; not changed here |
| B2 | Transport identity is a LOCAL_DEVELOPMENT self-declared principal (two headers). It is not authentication; the DAR gate still rejects any declarant the grant does not name. | explicit; replace the resolver pair when an identity provider exists |
| B3 | Resolved on `integration/hr-decision-loop`: the DCDRB binding is the region `decisionRevisionBindings` and a dock entry point (see section 2). Like the other post-decision tables, `career_decision_context_decision_revision_bindings` is not created by `initDbSchema()`; in a runtime without it the region is `NOT_PROVISIONED` and the dock offers no entry point. | resolved; provisioning is B1 |
| B4 | Resolved on `integration/hr-decision-loop`: the HR context layer (R2, `lib/hr-decision-context`) and the G3 producer resolvers (R1, R3) are implemented there. The frontend still does not create root DREVs; it reads them by exact id. | resolved; no frontend change |
| B5 | `produceAndPersistCareerDecisionContextRevision` at `435a112` compares `JSON.stringify` key order and fails against a JSONB reread with `ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED`; the fixture persists through the repository instead. Reported; fixed on `integration/g3-decision-context-binding` @ `87d09e1` (compares with `sameCareerDecisionContext`). | fixed upstream, not in this base |
| B6 | Turbopack rejects the `node_modules` symlink of a git worktree; the e2e spawns `next dev --webpack`. The sealed R5 e2e (`test/decision-runtime/e2e`) fails in such a worktree for the same environmental reason and is unchanged. | environment |
| B7 | Playwright is not a dependency of the repository; the browser section runs only with `CONDYN_PLAYWRIGHT_MODULE` and is reported as skipped otherwise. | tooling decision |
| B9 | `next build --webpack` compiles the branch successfully (40 s) but fails Next.js route type checking on the pre-existing `app/api/admin/proxy/[...path]/route.ts` (`handleProxy` is not a valid Route export). The file is byte-identical to `435a112`; not repaired here. | pre-existing; outside this field |
| B10 | Sealed T11C admits REQUEST_FURTHER_EVIDENCE only for EVIDENCE_* subjects and REQUEST_TARGET_CLARIFICATION only for target-uncertainty subjects; for semantic-uncertainty RCP subjects only ACCEPT, REJECT and DEFER pass. The dock offers every class the DAR permits and renders the sealed `ERR_HUMAN_DECISION_SUBJECT_NOT_ADMISSIBLE` verbatim; it does not pre-filter classes by subject, because admissibility is the gate's verdict, not a frontend derivation. | by design; confirmed with the integration branch owner |
| B11 | The governed 8D return (sealed 8D5) cannot carry exact COVD provenance; a child DREV whose OBSERVATION names a COVD exists only when formed directly, as the proof fixture does. The dock therefore labels a DREV as a persisted revision with its lineage and provenance verbatim and never as a governed return or loop closure. | confirmed with the integration branch owner; see `docs/architecture/decision-fields/HR_DECISION_LOOP_INTEGRATION.md` on `integration/hr-decision-loop` @ `d882899` |
| B8 | A context can hold more than one persisted DCR (distinct declarations); the UI lists all and selects none. Whether a second declaration over one DCTXREV is admissible is a G3 semantic question, not decided here. | Case 3 for the G3 owner |

### Integration run on `integration/hr-decision-loop` (2026-10-10)

The test world now names the RCP and the COVD with the R1/R6 vocabulary
(`CONDYN_CAREER_CANONICAL_CHAIN`, via `lib/career/canonical-authority`) instead of the
former test-only producer `career-canonical-chain`, which no resolver could resolve. The
root DREV's inventory names the RCP, and context A carries one DCDRB to that root,
persisted through the sealed admission.

| Kind | File | Result |
| --- | --- | --- |
| LOCAL: DCDRB region, decoder, bound entry points, NOT_PROVISIONED and FAILED without entry point | `test/career/hr-decision-loop/decision-revision-binding-region.test.ts` | 3/3 |
| INTEGRATION + INVERSE (PostgreSQL): fifteen regions AVAILABLE for A, EMPTY for B; context A → DCDRB → exact root DREV; the root's Career reference resolves through the R1 resolvers | `test/career/hr-decision-loop/read-service.postgres.test.ts` | 4/4 |
| HTTP + BROWSER (`next dev`, Chromium): fifteen regions, bound root clicked and read through the frozen G2 GET with `ROOT_REACHED`, context B shows no binding | `test/career/hr-decision-loop/e2e/hr-decision-loop-frontend.e2e.test.ts` | 7/7 (screenshot `05-context-a-bound-root-revision-read-by-exact-id.png`) |

## 8. Dock finalization round (2026-10-10, branch `frontend/hr-decision-dock-finalization`, base `628dc70`)

Reconstruction of the integrated dock against the integrated contracts (DCDRB binding
`CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_V1`, frozen API v1, sealed T11C, sealed
8D5/8D7, boundary B-8D5). Every repair below is inside the frontend field: no sealed contract,
governance decision, database schema or route wire shape changed.

| Id | Gap found | Repair |
| --- | --- | --- |
| G1 | With the DCDRB family `NOT_PROVISIONED` or `FAILED` the dock said "NO PERSISTED BINDING FOR THIS CONTEXT", which is only true for `EMPTY`. In a runtime without the unified registration (B-ENTRY) every context would read as unbound. | Bound list carries `data-binding-region-state`; `NOT_PROVISIONED` and `FAILED` render their own amber/red lines ("BOUND STATE UNKNOWN"); "none" appears only for `EMPTY`. |
| G2 | A DREV read by explicit id and a DREV reached through a binding looked the same (bound vs unbound, assumed vs persisted). | The hook records the entry source (`URL`, `INPUT`, `BINDING` with the exact DCDRB id); the section shows "ENTRY: EXPLICIT ID FROM URL/INPUT (ASSUMED, NOT BOUND)" or "DCDRB BINDING OF THIS CONTEXT · DCDRB_…"; every revision card states BOUND TO THIS CONTEXT (with binding ids), NOT BOUND TO THIS CONTEXT, or BOUND STATE UNKNOWN when the binding family is not readable. |
| G3 | A directly formed child DREV (D2 shape) and a governed 8D return were indistinguishable in the lineage. | `describeDecisionContextLineage` compares each revision with its persisted predecessor: sealed 8D7 keeps the inventory unchanged, so INVENTORY EXTENDED proves formation outside the governed return (amber, names the added references and items); INVENTORY UNCHANGED is stated as compatible with a governed return, governance explicitly not established by the read; PREDECESSOR NOT READ when the walk stopped. ROOT and CHILD are labelled. |
| G4 | A failed predecessor read (500, network) was reported as PREDECESSOR NOT FOUND. | The exact reader returns REVISION, ABSENT or FAILED; the walk terminal `PREDECESSOR_READ_FAILED` carries the public code; absence stays 404 only. |
| G5 | The section title "RECONSTRUCTED NEXT DECISION CONTEXT" asserted a relation the read does not establish for an explicit id. | Title "GENERIC DECISION CONTEXT REVISION (DREV) · EXACT READ"; the hint names what is reconstructed (lineage by `previousRevisionId`) and what is assumed (an explicit id). |
| G6 | A 422 on the context read hid the public `reason`. | `fetchHrDecisionLoop` returns the reason; the context section prints code and reason. |
| G7 | Before the first fetch (server render, IDLE) the context section showed nothing. | IDLE renders the loading line (`hr-decision-loop-loading`). |
| G8 | No inverse navigation: artifacts naming another exact DCTXREV (feedback target, binding parent, bound context) were dead text. | Rows carry typed `contextLinks`; the rail renders "OPEN EXACT CONTEXT" links to `?careerDecisionContextRevisionId=…` for foreign contexts only (same-context ids are not links). `boundDecisionContextRevisionId` is a typed row field (review note 1 of the integration round). |
| G9 | Reading a DREV from the dock left the URL stale. | `openRevision` updates `decisionContextRevisionId` via `history.replaceState`; the DCTXREV parameter is never rewritten. |

Unchanged on purpose: admissibility is not pre-computed in the UI (B10); the sealed verdict is
rendered verbatim. Several DCRs stay listed without selection (B8). The non-claims footer and
the amber binding boundary line remain.

Proof (DB-free, run by explicit file list, `DATABASE_URL` never defaulted to the shared database):
`frontend-presentation.test.ts` 7/7 (lineage read protocol, descriptor, typed links and bound ids),
new `client-reads.test.ts` 4/4 (scripted fetch: reasons, exact read, mid-walk failure, entry source,
declaration mapping), `dock-ssr.test.tsx` 4/4, `decision-revision-binding-region.test.ts` 3/3,
`read-service.test.ts`, `http.test.ts`, `routes.test.ts`, `declaration-application.test.ts`,
SIL locale wiring and language contract, `career-demo-e2e.test.tsx`: 62/62; `tsc` 0 errors.
The isolated-world HTTP/browser e2e carries the new assertions (entry kinds, revision position,
return character, bound state, URL parameter, absence vs failure): 7/7 on 2026-10-10 under the
database isolation guard (`npm run test:isolated`, disposable `condyn_test_1ad7ff09be6c40e9`
created and dropped by the runner). Manual environment and complete run record:
`HR_DECISION_LOOP_ENGINEERING.md`, `HR_DECISION_LOOP_MANUAL_TEST.md`.

## 7. Non-claims

The dock does not create authority, does not mark a decision as current, does
not close the loop, does not derive outcome truth from a valence, and does not
turn a returned observation into a new decision. A 201 is a persisted
declaration, not an action; an `AVAILABLE` region is a persisted artifact, not a
fact about the world.
