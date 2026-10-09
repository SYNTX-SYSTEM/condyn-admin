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
