# HR Decision Looper: independent validation of the combined G2/G3 integration

Status: VALIDATED 2026-10-09 by the PINK session (owner of `integration/g2-producer-adapters`)
on the throwaway branch `validation/hr-decision-loop-pink`, finally at the content of
`integration/hr-decision-loop` @ `d882899` (GELB's combined branch: `integration/g2-producer-adapters`
@ `1fb55ca`, `integration/g3-decision-context-binding` up to `67cf5dc`, R7 post-decision registration,
cross-relation test, P7 cherry-picked as `d360271`) plus this document.
Authoritative contracts: `G2_G3_FIELD_RELATION.md` (decisions D1 to D5) and
`VERTICAL_INTEGRATION_PROOF.md`. Nothing sealed was modified; no shared production data was touched;
every PostgreSQL proof ran in a database `condyn_pink_*` created and dropped by the suite with
identity and basis-preservation checks.

## 1. First Broken Relations reconstructed at the seam

| Id | Relation | Observed on `1fb55ca + 9dcd315` | Authoritative home | Repair |
| --- | --- | --- | --- | --- |
| FBR-1 | D3 authority vocabulary had two carriers: G3 `lib/career/canonical-authority` (producer `CONDYN_CAREER_CANONICAL`, ids such as `..._PROPOSAL_ONLY_V1`, `..._DECLARED_NAME_V1`, `..._HISTORICAL_V1`) and the G2 adapter namespace (producer `CONDYN_CAREER_CANONICAL_CHAIN`, `..._PROPOSAL_ONLY_AUTHORITY_NONE_V1`, `..._IMMUTABLE_RECORD_V1`). A G3-built reference did not resolve through `POST /api/decision-contexts`; an HR-layer DREV was not bindable. Both suites stayed green because neither crossed the seam. | The resolver namespace (`lib/decision-adapters/career-canonical/namespace.ts`): a contract id means something only where a bound resolver resolves it (ADR 006, capability-adapter precedent). | G3 mirrors the namespace verbatim (`af7a709`); equality proven in `test/decision-integration/g2-g3-cross-relation.test.ts`. No G2 file changed. |
| FBR-2 | DCDRB witness rule counted RCP-pair references and refused an HR-layer DREV as `WITNESS_AMBIGUOUS`, because R2 emits one whole-artifact RCP reference plus one `<rcpId>/items/<n>` reference per PROPOSED item (required by proof P3.1 and the sealed kernel rule that item provenance must appear in the inventory). | R4 contract (`lib/career/relation/decision-context-decision-revision-binding/contract.ts`). | Witness = exactly one whole-artifact RCP reference; other references of the pair must be item locators of the same RCP, else `WITNESS_MISMATCH` (`af7a709`). |
| FBR-3 | `produceAndPersistCareerDecisionContextRevision` compared a JSON string of the JSONB reread and failed on Postgres. | G3 producer. | `sameCareerDecisionContext` comparison (`87d09e1`). |
| FBR-4 | Startup registration (T11) ended at `human_decision_records`; DAINT to COVFCR tables were not registered, so P0's "all G2 and G3 tables exist after one startup call" did not hold. | R7 (`lib/persistence`). | `post-decision-chain-schema.ts` in FK order (`6e21b9e`). The validation fixture `postgres-post-decision-schema.ts` provisions the same tables with `IF NOT EXISTS` and is a no-op under R7. |

## 2. Proofs executed on the combined tree

| Proof | File | Result |
| --- | --- | --- |
| P7 forward | `test/decision-integration/hr-decision-loop-p7.test.ts` | GREEN. Root DREV over the real local HTTP path from persisted G3 state (R1, R2, R3); DCTXREV persisted through its repository and bound to that exact DREV through the reader-backed binder (R4); DCR for the admissible classes ACCEPT, REJECT, DEFER over semantic-uncertainty subjects, `REQUEST_*` refused by the sealed T11C admissibility, declarant and window falsifiers; DAINT, HCOM, EAGR, ECTXREV, AOC, SCD (with `externalStateRef` naming the TSN), ASCAD, CORD and four COVD valences persisted over PostgreSQL (P6); AOC, SCD, ASCAD, CORD, COVD resolved through R1 against the live repositories (R5 reachability); 8B/8C1 claims and 8C2/8C3/8D1 provenance; governed 8D2 to 8D10 into a sibling child for an inventory-named provenance; D2 child DREV with exact COVD provenance, `previousRevisionId` = root, lineage reconstruction child to root. |
| P7 inverse | same file, `fixtures/p7-inverse-walk.ts` | GREEN in a second process (`tsx`): child DREV → root → COVD → CORD → ASCAD → SCD → AOC → ECTXREV → EAGR → HCOM → DAINT → DCR → DCTXREV → binding (addressed by the exact pair, exactly-one check) → RCP (resolved through R1) → DAR; sixteen ids equal to the forward record; no step orders by time or selects a latest row. |
| Property | both | No artifact carries a key named `current`, `head`, `latest`, `accepted`, `authority`, `verified`, `loopClosed` or `success`; the G3 payload sentinel never reaches a revision. |
| Combined integration directory | `test/decision-integration` (both owners' suites, cross-relation, Postgres loop, P7) | 8 files, 97 tests passed, 10 todo (the P0/P4/P6/P7 placeholders of the index file `g2-g3-vertical-proof.test.ts`, now proven in `g3-decision-context-binding-vertical.test.ts`, `hr-decision-loop-postgres.test.ts` and `hr-decision-loop-p7.test.ts`; replacing the placeholders by references is a change to the index on the combined branch). Three Next dev servers and five isolated databases were created and dropped in one run; the shared `condyn` database existed before and after each cleanup. |
| Preservation | `test/decision-core`, `test/decision-runtime`, `test/decision-adapters`, `test/career/capability-core`, `test/career` | G2 batch (`test/decision-core`, `test/decision-runtime`, `test/decision-adapters`, `test/career/capability-core`): 83 files / 751 tests, 749 passed in the concurrent batch, 2 load timeouts (`structural-consequences/reconstruct.test.ts`, `validation/authority.test.ts`, both build a TypeScript program over the tree); re-run idle: 24/24 passed at 3.8 s and 2.9 s on the combined tree and 3.6 s and 3.0 s on `1fb55ca`, so the combination adds no cost. G3 batch (`vitest run test/career`): 287 files, 1667 tests, 1648 passed, 6 skipped, 13 failed in four COVFCR suites in the concurrent batch; re-run idle: 4 files / 25 tests passed. The five legacy G1 suites passed against the pre-shaped `condyn` basis as before; their quarantine classification is unchanged. |
| Type-check | `npx tsc --noEmit -p tsconfig.json` on the merged tree | 0 errors. |

## 3. Unresolved boundaries (Case 3, field owner)

| Id | Boundary |
| --- | --- |
| B6 | Sealed 8D5 (`createDecisionContextObservationMaterializationReadiness`) refuses an OBSERVATION whose `AUTHORITATIVE_STATE` reference is absent from the root inventory (`..._SOURCE_REFERENCE_MISSING`). A COVD does not exist when the root is created, so the governed 8D1 to 8D10 path cannot carry the D2 return "provenance `AUTHORITATIVE_STATE` to the exact COVD". The combined looper closes through the D2 child DREV built directly over the extended inventory; the governed path is proven only for provenance the root already names. Resolving this means either amending D2's wording or a new sealed G2 phase; neither session did it. |
| B1 | Unchanged from `G2_PRODUCER_INTEGRATION.md`: the frozen API v1 transport answers 500, not 422, for an absent resolver or a non-recomputing G3 row. |
| B7 | T11C admissibility makes `REQUEST_FURTHER_EVIDENCE` and `REQUEST_TARGET_CLARIFICATION` inadmissible over semantic-uncertainty subjects; a proof of all five classes needs subjects with evidence and target codes (not in this fixture). Recorded, not a defect. |
| B8 | Three sealed post-decision table names exceed 63 bytes and are truncated by PostgreSQL in `information_schema` (reported by GELB); queries are unaffected. |

## 4. Not claimed

Authentication, deployment, HTTP ingress for DCR (FBR-2 of the frontend field), learning, policy
promotion, semantic support, currentness, outcome truth or causation. A GREEN loop is structural
closure by exact ids, nothing more.

## 5. Round 2: frontend integration validated at `bd37a39` (2026-10-10)

Validated content: `integration/hr-decision-loop` @ `bd37a39` (merge of `frontend/hr-decision-loop`
@ `aa83348`, DCDRB region `1ddfc85`, type fix `812fa91`; `0b4f518` is documentation only).
No file under `lib/decision-*`, `lib/career/relation*`, `lib/career/db`, `lib/career/*-admission`,
`lib/career/canonical-authority` or `lib/persistence` changed since `ddf3d07`; the new region and
dock entry points add no selection vocabulary (no current, head, latest, order-by-time).

| Proof | Result (idle machine, load 2.1) |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| `test/decision-integration` | 8 files, 101 passed (index references replace the former todo entries); P3 and P7 in fresh `condyn_p3_*` / `condyn_pink_p7_*` databases, basis preserved |
| `test/career/hr-decision-loop` incl. e2e with Chromium (`CONDYN_PLAYWRIGHT_MODULE` set, browser section not skipped) | 9 files, 39 passed: exact-id read with all fifteen families, declaration through the sealed gate with verbatim rejection, next-context lineage through the frozen G2 GET, dock server-rendered only for an explicit DCTXREV, DCDRB-bound root read by exact id in the browser; five evidence screenshots regenerated byte-different and reverted here |
| G2 batch (`test/decision-core`, `-runtime`, `-adapters`, `test/career/capability-core`) | 83 files, 751 passed |
| `vitest run test/career` | 296 files, 1700 passed, 6 skipped, 0 failed; the G1 lifecycle and schema-order suites pass in this environment against the pre-shaped `condyn` basis and fail on a fresh database (GELB's run), which is the recorded legacy quarantine, not a regression |

Boundaries unchanged: B6/B-8D5 (Case 3), B1, B7/B-T11C, B8, plus B-ENTRY as recorded by GELB:
neither `registerUnifiedPersistenceSchema` nor the binding table is wired into a runtime entry
point and the frontend's local composition still calls `initDbSchema()`, so a running server reports
the post-decision regions and the DCDRB region as `NOT_PROVISIONED` until a composition decision is
made. Frontend-specific boundaries B2, B7, B8, B9 are in `HR_DECISION_LOOP_FRONTEND_INTEGRATION.md`.

## 6. Round 3: database safety delta validated at `0422cdc` (2026-10-10)

See `DATABASE_SAFETY_AUDIT.md` for the full access-path inventory, fail-closed verification, incident
evidence and residual risks. Summary: every refused `DATABASE_URL` class aborts a real vitest process in
`globalSetup` before any test body; the application client resolves missing, empty and protected targets to
an unroutable host unless an explicit production opt-in is set outside vitest; `npm test` and the build
script run through the disposable-database runner; the full G2, integration, isolation and G3 suites ran
through that runner with no leftover database (906 / 906 and 1662 passed with the classified legacy
quarantine and load-only timeouts). Residual limits, closable only by an owner decision on a dedicated
PostgreSQL test role: deliberate in-process tampering with runtime-assembled variable names, and a
`vitest --config` override that drops the gate for the 22 pinned sealed or frozen files.

## 7. Round 4: recursive integration validated at `6f400ea` (2026-10-10)

Integration tip after the merge of GRÜN's dock finalization: gated runtime registration (DDL only on a
positively verified disposable database, otherwise none), manual environment on the least-privilege role,
superuser admin refused by default. Full execution evidence, including the idle re-runs of the
load-sensitive files and the independent manual smoke, is section 7 of `DATABASE_SAFETY_ARCHITECTURE.md`.
Open owner items are unchanged: H1 privilege hardening inside `condyn` (prepared, not applied), server
logging, DB-2 and DB-3 cleanup, B-8D5, B1, B-T11C.
