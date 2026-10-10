# HR Decision Looper Integration (G2 + G3)

Branch: `integration/hr-decision-loop`. Base: `1fb55ca` (G2 producer state, PINK session) merged with
`integration/g3-decision-context-binding` (G3 state, this session) and the P7 proof `bf48c68`
(PINK, cherry-picked). Independent validation by the PINK session on
`validation/hr-decision-loop-pink`. The HR frontend branch `frontend/hr-decision-loop` (GRÜN session)
was not touched.

Decisions D1 to D5 apply unchanged. No sealed contract was modified: `lib/decision-core` is
byte-identical to `v1.0.0-decision-core-phase8e2-occurrence-return-binding`; the API v1 transport
and its contract document are unchanged.

## 1. First Broken Relations found by the integration and their repair

| Id | Relation | RED evidence | Authoritative home | Repair |
| --- | --- | --- | --- | --- |
| I-FBR-1 | D3 vocabulary had two carriers: G3 references used `CONDYN_CAREER_CANONICAL` and self-invented contract ids; R1 resolvers use `CONDYN_CAREER_CANONICAL_CHAIN` and literal-state ids | `ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND` for every G3 reference; `..._WITNESS_MISSING` for every HR-built DREV (`g2-g3-cross-relation.test.ts`, commit `6e37f87`) | R1 resolver namespace (a contract id is meaningful only where a bound resolver resolves it; ADR 006) | G3 mirrors the namespace verbatim (`8d461cf`, `af7a709`); equality proven per family |
| I-FBR-2 | DCDRB witness rule counted R2's item locators `<rcpId>/items/<n>` as competing witnesses | would be `..._WITNESS_AMBIGUOUS` for every HR-built DREV | DCDRB contract (G3) | exactly one whole-artifact RCP reference; other references with the pair only as item locators of the same RCP (`8d461cf`) |
| I-FBR-3 | DCTXREV production producer compared the PostgreSQL JSONB reread with `JSON.stringify` | `ERR_CAREER_DECISION_CONTEXT_PERSISTENCE_FAILED` in a key-order unit test and in the integrated Postgres run; first reported by the HR frontend session | `lib/career/relation/decision-context/producer.ts` | `sameCareerDecisionContext`, the repository's own comparison (`87d09e1`) |
| I-FBR-4 | Startup registration did not provision the post-decision chain DAINT..COVFCR | P6/P7 on a fresh database need these tables; `initDbSchema` registers T11 only | R7 unified registration | `lib/persistence/post-decision-chain-schema.ts`, FK-derived order from the sealed Drizzle declarations (`fdcd3ab`) |

Observations, not defects: three sealed table names exceed PostgreSQL's 63-byte identifier limit and
appear truncated in the catalog; reads and writes are unaffected. `career-analyze-flow` and
`career-worker-config-validation` fail on a fresh database at base `435a112` exactly as on this
branch: they depend on a schema provisioned by another suite (legacy test infrastructure).

## 2. Proof record (2026-10-09)

Every PostgreSQL stage ran in a freshly created database (`condyn_dll_*`, `condyn_pink_p7_*`,
`condyn_r5_*`, `condyn_p3_*`) whose identity was checked before it was dropped. The shared
`condyn` database was never written (76 tables before and after).

| Stage | File | Result |
| --- | --- | --- |
| Cross relations (vocabulary, R5 to R1, R2 to R4) | `test/decision-integration/g2-g3-cross-relation.test.ts` | RED 3/3 on first merge, GREEN 3/3 after repair |
| P0 unified registration incl. post-decision chain, no cross-field FK | `hr-decision-loop-postgres.test.ts`, `g3-decision-context-binding-vertical.test.ts` | GREEN |
| P1, P2, P3 (HTTP), P5, P8 | `g2-g3-vertical-proof.test.ts` (PINK) | GREEN; its index keeps P0/P4/P6/P7 as todo, implemented in the files of this table |
| P4 DCDRB over PostgreSQL, idempotence, immutable conflict, three replay modes, tamper and witness falsifiers | `g3-decision-context-binding-vertical.test.ts` | GREEN |
| P6 DCTXREV via producer, root DREV via composed G2 application with R1 resolution, DCDRB, exactly one DCR with declarant/window falsifiers | `hr-decision-loop-postgres.test.ts` | GREEN 6/6 (RED on I-FBR-3 before `87d09e1`) |
| P7 forward and inverse: HTTP root DREV, binding, DCR (ACCEPT/REJECT/DEFER admissible; REQUEST_* refused by sealed T11C admissibility), DAINT..COVD for four valences over PostgreSQL, R1 reachability of AOC/SCD/ASCAD/CORD/COVD, 8B..8D1, sealed 8D5 refusal, D2-shaped child DREV, governed 8D2..8D10 sibling child, lineage reconstruction, 16-step inverse walk in a second process | `hr-decision-loop-p7.test.ts` (PINK) | GREEN 7/7 on this branch |
| Inverse walk DCR to DCTXREV to DCDRB to DREV to R1 resolution in a fresh client | `hr-decision-loop-postgres.test.ts` | GREEN |
| Type-check | `tsc --noEmit` | 0 errors |
| G2 preservation + integration | `test/decision-core`, `test/decision-runtime`, `test/decision-adapters`, `test/decision-integration` | 53 files, 542 tests: 531 passed, 10 todo, 1 load timeout re-run GREEN; R5 HTTP e2e GREEN |
| Career preservation | `test/career` (287 files, 1667 tests) | 1623 passed, 6 skipped; failures are the classified G1 legacy quarantine (four lifecycle suites), the two schema-order-dependent legacy suites (identical at base), and COVFCR load timeouts re-run GREEN with `--testTimeout=60000` (27/27) |

## 3. Remaining boundaries (not repaired; no decision invented)

| Id | Boundary | Kind |
| --- | --- | --- |
| B-8D5 | Sealed 8D5 (ADR 036) requires an `AUTHORITATIVE_STATE` observation reference to be in the base inventory; 8D7 keeps the inventory unchanged. The governed 8D1..8D10 return therefore cannot carry exact COVD provenance as D2 requires. Today the D2 shape exists only as a directly formed child DREV outside 8D governance. Options: HUMAN_INPUT provenance in the governed path (loses exact provenance), a new governed G2 phase that extends the inventory (sealed-kernel change), or accepting the direct child (bypasses 8D2 admission and 8D4 target declaration). | Case 3, field owner |
| B-T11C | Sealed T11C admissibility refuses REQUEST_FURTHER_EVIDENCE and REQUEST_TARGET_CLARIFICATION for semantic-uncertainty subjects; only ACCEPT, REJECT and DEFER are admissible for the seeded RCP. | Sealed semantics, recorded |
| B1 (G2) | API v1 maps `RESOLVER_NOT_FOUND`, `STATE_INVALID` and `ARTIFACT_REFERENCE_MISMATCH` to 500, not 422. | Case 3, API v1 change |
| B-ENTRY | `registerUnifiedPersistenceSchema` is not wired into a server or worker entry point; `initDbSchema` still registers T11 only. | Composition decision |
| B-INGRESS | No HTTP ingress for the DCR in this branch; the HR frontend branch carries its own routes. | Owned by the frontend branch |
| B-LEGACY | G1 legacy lifecycle suites and two schema-order-dependent suites fail on fresh databases. | Legacy quarantine, separate work unit |
| B-DEPLOY | nginx routes `/api/` to port 8002; nothing here is deployed. | Deployment, out of scope |

## 4. Frontend integration (2026-10-10)

`frontend/hr-decision-loop` @ `aa83348` (GRÜN session) merged as `10c3449`; no file overlap with
`ddf3d07`, merge base `435a112`. Its `lib/career/hr-decision-loop` imports only `lib/career`;
the import-boundary test stays green.

| Step | Commit | Content |
| --- | --- | --- |
| Merge | `10c3449` | HR Decision Loop SIL frontend: read model, read service, declaration application through the sealed T11C gate, HTTP routes, dock |
| DCDRB connection | `1ddfc85` | fifteenth region `decisionRevisionBindings` (index by exact DCTXREV, exact reread through the sealed DCDRB repository); dock lists each bound DREV id as an exact entry point into the frozen G2 GET, labelled as a persisted structural witness, never current, accepted or a governed 8D return |
| Type fix | `812fa91` | local Playwright `Locator` type gains `inputValue` |

Broken relation found in the frontend test world (same class as I-FBR-1): the G2 child DREV named
the COVD under a test-only producer `career-canonical-chain` that no resolver resolves, and the
root DREV named no RCP, so no binding could be established. The world now uses the R1/R6
vocabulary through `lib/career/canonical-authority`; the root inventory names the RCP; context A
carries one DCDRB persisted through the sealed admission. The child DREV is still formed directly
and is documented as such (B-8D5).

| Proof | Result |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| Import boundary | 5/5 |
| DCDRB region unit (read service, decoder, entry points, NOT_PROVISIONED, FAILED) | 3/3 |
| PostgreSQL read service incl. inverse context A → DCDRB → root DREV with R1 resolution | 4/4 |
| HTTP + Chromium e2e (`next dev`, Playwright from `CONDYN_PLAYWRIGHT_MODULE`) | 7/7; screenshot `05-context-a-bound-root-revision-read-by-exact-id.png` |
| G2 + integration (`test/decision-core`, `-runtime`, `-adapters`, `-integration`) | 54 files, 543/543, incl. R5 HTTP e2e, P3, P6, P7 |
| `test/career` | 296 files, 1706 tests: 1668 passed, 6 skipped, 32 failed = four G1 lifecycle suites (legacy quarantine) and two schema-order-dependent suites, identical at base `435a112` |
| Sealed surfaces | `lib/decision-core` byte-identical to the 8E2 seal; API v1 transport and contract unchanged; no G3 relation, adapter, db, admission or persistence file changed since `ddf3d07` |

Boundaries unchanged and unresolved: B-8D5 (Case 3), B1 API v1 422 mapping, B-T11C, B-ENTRY
(neither `registerUnifiedPersistenceSchema` nor the binding table is wired into a runtime entry
point; the frontend's local composition still uses `initDbSchema()`, so a running server shows the
post-decision regions and the DCDRB region as `NOT_PROVISIONED` until a composition decision is
made), B-LEGACY, B-DEPLOY. Frontend-specific: B2 self-declared local principal (not
authentication), B7 Playwright not a repository dependency, B8 several DCRs per DCTXREV listed
without selection, B9 pre-existing `next build` route-type failure in the admin proxy.

## 6. Shared-database findings (2026-10-10, reported, not repaired)

| Id | Finding | Evidence | Cause | State |
| --- | --- | --- | --- | --- |
| DB-1 | The seven legacy G1 lifecycle rows of the shared `condyn` database are gone: one each in `career_recommendations` .. `career_attributions`, chain `REC_1790085122039_982` → `ATTR_1790085122057_501`, written 2026-09-22 by `scripts/write-live-lifecycle.ts`. The 76-table schema and the two `career_capability_runs` rows are intact. | Row counts on 2026-10-09 (field reconstruction) versus 2026-10-10: 1 → 0 in each of the seven tables. | Peer preservation batches ran the G1 legacy suites without `DATABASE_URL`, so against the shared database, and those suites delete the legacy tables unconditionally. Confirmed by both sessions: the G2 producer session (PINK) on 2026-10-09 at about 21:11 and 22:05 and on 2026-10-10 at about 12:56; the frontend session (GRÜN) on 2026-10-09 at 21:59. The earliest candidate is 2026-10-09 21:11; which run removed the rows cannot be determined. Correction (2026-10-10, server log): this session's run of `test/decision-runtime` and `test/decision-adapters` on 2026-10-09 at 19:21 had no `DATABASE_URL` and created and dropped temporary schemas in `condyn` (schema-scoped DDL, no rows in `public`); its other runs used isolated databases. Full reconstruction: `docs/incidents/2026-10-09-shared-condyn-database.md`. No copy of the rows is known to exist. | Owner decision: accept the loss or re-create a lifecycle with the script (new ids, not the same records). No restoration was attempted. |
| DB-2 | `lib/career/db/client.ts:187-188` drops `career_capability_proposal_projection_references_analysis_id_fkey` by its full 66-character name, but PostgreSQL stores the automatically generated constraint as `career_capability_proposal_projection_referenc_analysis_id_fkey`. On a database created before the overlay (the shared `condyn` database) the old `NO ACTION` key survives next to the new `CASCADE` key, so the intended cascade never takes effect; on a fresh database both keys cascade (harmless duplicate). | Reproduced in a throwaway database: fresh `[referenc_…_fkey:c, …_analysis_id_fk:c]`; legacy shape after startup `[referenc_…_fkey:a, …_analysis_id_fk:c]`. The shared database shows the legacy shape. | Identifier truncation (NAMEDATALEN 63) in the overlay's startup DDL. | Field 01/02 work unit (projection references, outside this integration delta). Repairing it changes the shared database at the next startup, so it needs the owner's go-ahead. |
| DB-3 | The overlay startup DDL (`initDbSchema`) has also run against the shared database at least once (new column `candidate_source_bundle_id`, the `CASCADE` key of DB-2, `career_canonical_sil_runtime_associations`). | Shared schema inspection. | Peer sessions' local runs against the default `DATABASE_URL`; DDL only. | Recorded. |

Prevention, for every session: run any suite that touches PostgreSQL with `DATABASE_URL` pointing at an isolated database. The G1 legacy suites must never run against the shared database.

## 7. Database isolation (2026-10-10)

Owner mandate: the shared `condyn` database is never modified by tests or agent operations.
Implemented at `48d52c2`, incident reconstructed in `docs/incidents/2026-10-09-shared-condyn-database.md`.

| Layer | Mechanism |
| --- | --- |
| Application client | `lib/career/db/client.ts` has no fallback; a missing `DATABASE_URL` resolves to an unroutable `.invalid` host; a protected name (`condyn`, `postgres`, `template*`) does too unless a real server or worker sets `CONDYN_ALLOW_SHARED_DATABASE=1` outside any test runner (the test gate deletes it; test code may not mention it or touch `VITEST`) |
| Test gate | vitest `globalSetup` refuses MISSING, MALFORMED, AMBIGUOUS, PROTECTED, NOT_DISPOSABLE and NON_LOCAL_HOST URLs before any connection, then verifies read-only that the database is exactly the named `condyn_test_<16 hex>` and carries the disposable marker comment; per-file `setupFiles` reset the worker to the verified URL; `.env` files cannot supply `DATABASE_URL` |
| Disposable databases | `lib/database-isolation/verification.ts`: create marks, drop refuses anything not positively identified; `scripts/test-db/{create,drop,run}.ts`; `npm test` and `test-and-build.sh` use the runner with an explicit `TEST_DATABASE_ADMIN_URL` (maintenance database on loopback) |
| Test code | non-sealed tests that create databases use the helpers; 22 sealed or frozen test files keep an unreachable literal fallback, pinned by `test/database-isolation/access-paths.test.ts` |
| Not done (owner) | server-level permissions (dedicated test role, `REVOKE CONNECT`), any write to `condyn` |

Proof through the runner: `test/database-isolation` 52/52 (12 refused URL classes as real child
vitest runs that never reach a test body), offline DB-1 recovery candidate 2/2; G2 + integration +
isolation 59 files, 593/593; `test/career` 296 files, 1667 passed, 6 skipped, 33 failed = the 32
known legacy failures plus one COVFCR load timeout, re-run 8/8. Independent verification by the G2
producer session confirmed every refused class and found one residual vector (test code deleting
`VITEST` before importing the client), closed by the explicit opt-in.

Owner action required for local use of the real application against `condyn`: set
`DATABASE_URL=postgresql://…/condyn` and `CONDYN_ALLOW_SHARED_DATABASE=1` for the server or worker
process (for example in `.env.local`). Without both, the application reaches no database.
