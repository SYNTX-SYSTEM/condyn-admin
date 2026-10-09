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
| `read-model.ts` | `HR_DECISION_LOOP_READ_MODEL_V1`: exact DCTXREV, DAR, RCP and fourteen regions, one per post-decision family |
| `server-read-service.ts` | relational index by exact lineage column, exact reread through the sealed repository of each family, region states `AVAILABLE / EMPTY / NOT_PROVISIONED / FAILED` |
| `declaration-application.ts` | captures the five declaration fields, admits the transport identity, runs the sealed T11C producer unchanged |
| `http.ts` | transport only; public codes `ERR_HR_DECISION_LOOP_API_*`; bounded `reason` allowlist of sealed T11C codes for 422 |
| `local-composition.ts` | binds `createProductionHumanDecisionRecordDependencies` and the post-decision Postgres repositories to the one physical client, after `initDbSchema()` |
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

The DCTXREV to DREV binding (R4, decision D4) is not implemented in this field.
The dock says so and reads the DREV by an explicit id. When the binding lands,
the dock consumes its exact read instead of the manual input.

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
  "feedbackAdmissions": "…", "feedbackTargets": "…", "feedbackTargetBindings": "…", "feedbackContextRevisions": "…" } }
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
| B3 | DCTXREV ↔ DREV binding (R4) is not part of this base; the next context is read by an explicit exact DREV id. The binding now exists on `integration/g3-decision-context-binding` as `career_decision_context_decision_revision_bindings` (`DCDRB_` + 32 hex, indexed by `career_decision_context_revision_id`, exact reread via `PostgresCareerDecisionContextDecisionRevisionBindingRepository.getCareerDecisionContextDecisionRevisionBindingById`; payload carries the full DREV; more than one binding per DCTXREV is possible, none is current). Follow-up: add a fifteenth region `decisionRevisionBindings` to the read model with the same index-then-reread pattern and let the dock offer each bound DREV id as an exact lineage entry point. | follow-up on this branch after the integration branch lands |
| B4 | HR context layer (R2) and G3 producer resolvers (R1, R3) are not implemented; the frontend does not create root DREVs. | `integration/g2-producer-adapters` owner |
| B5 | `produceAndPersistCareerDecisionContextRevision` at `435a112` compares `JSON.stringify` key order and fails against a JSONB reread with `ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED`; the fixture persists through the repository instead. Reported; fixed on `integration/g3-decision-context-binding` @ `87d09e1` (compares with `sameCareerDecisionContext`). | fixed upstream, not in this base |
| B6 | Turbopack rejects the `node_modules` symlink of a git worktree; the e2e spawns `next dev --webpack`. The sealed R5 e2e (`test/decision-runtime/e2e`) fails in such a worktree for the same environmental reason and is unchanged. | environment |
| B7 | Playwright is not a dependency of the repository; the browser section runs only with `CONDYN_PLAYWRIGHT_MODULE` and is reported as skipped otherwise. | tooling decision |
| B8 | A context can hold more than one persisted DCR (distinct declarations); the UI lists all and selects none. Whether a second declaration over one DCTXREV is admissible is a G3 semantic question, not decided here. | Case 3 for the G3 owner |

## 7. Non-claims

The dock does not create authority, does not mark a decision as current, does
not close the loop, does not derive outcome truth from a valence, and does not
turn a returned observation into a new decision. A 201 is a persisted
declaration, not an action; an `AVAILABLE` region is a persisted artifact, not a
fact about the world.
