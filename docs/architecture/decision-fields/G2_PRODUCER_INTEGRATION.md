# G2 Producer Integration: G3 Career Canonical Chain as Authoritative-State Producer

Status: IMPLEMENTED on `integration/g2-producer-adapters`, base `435a112` (classified
overlay, decision D5). Relations R1, R2, R3, R6, R8 of
[G2_G3_FIELD_RELATION.md](./G2_G3_FIELD_RELATION.md) section 5. Proof stages P1, P2,
P3, P5, P8 of [VERTICAL_INTEGRATION_PROOF.md](./VERTICAL_INTEGRATION_PROOF.md) run GREEN
(section 5 below). R4, R5, R7 and stages P0, P4, P6, P7 belong to
`integration/g3-decision-context-binding` and are not claimed here.

Every sealed contract, identity formula, provenance rule and existing behaviour is
preserved: `lib/decision-core` is byte-identical to
`v1.0.0-decision-core-phase8e2-occurrence-return-binding`; the sealed R1/R2 runtime
files, the API v1 transport, its contract document and the preserved test suites are
byte-identical to `435a112`.

## 1. Field as reconstructed before the delta

| State | Finding |
| --- | --- |
| KNOWN | G2 admits producers only through `createBoundAuthoritativeStateReader` resolvers bound to one `(producerId, authorityContractId)` pair (`lib/decision-core/authority/reader.ts`). The only producer was Capability Core Phase 4 (`lib/decision-adapters/capability-core.ts`). |
| KNOWN | The local HTTP application (`lib/decision-runtime/local/decision-context-api.ts`) composed exactly `{ database, capabilityRepository }`; the sealed composition index exports exactly two values and its directory may not import career code (`test/decision-runtime/composition/postgres-capability-core.test.ts`). |
| OBSERVED | G3 families carry their authority state literally: RCP `PROPOSAL_ONLY` + `RECOMMENDATION_POLICY_BOUND`; EIS, TSN, RRL, TRQREV, TRPREV `PROPOSAL_ONLY` + `NONE`; TOREV, ORL, CRRES carry no proposal or authority field; AOC, SCD, ASCAD, CORD, COVD are explicit declarations; COVFCR is an immutable revision. Every G3 identity is `<PREFIX>_` plus 32 upper-case hex; G2 `DAINT_` is 24. |
| OBSERVED | Reading a G3 artifact through its Postgres repository already recomputes identity and lineage; corrupt rows surface as the family's `*_PERSISTENCE_FAILED` / `*_PERSISTENCE_INVALID` / `*_POSTGRES_RECORD_INVALID` code, absent rows as `null` or the family's `*_NOT_FOUND` code. |
| OBSERVED | Baseline on `435a112` in this worktree: `test/decision-core` 38 files / 403 tests, `test/career/capability-core` 37 / 309, `test/decision-runtime` 7 / 29, `test/decision-adapters` 1 / 10. The proof document's 28 / 272 for capability-core describes `ee06ff6`; the overlay base carries more capability suites. |
| OBSERVED | The R5 HTTP e2e could not start Next in this worktree because Turbopack rejects a `node_modules` symlink that points outside the project root. The symlink was replaced by a hard-linked copy of the main worktree's `node_modules` (environment only, nothing in git). R5 is GREEN again. |

## 2. Delta

| Relation | Implementation | Notes |
| --- | --- | --- |
| R1 | `lib/decision-adapters/career-canonical/resolvers.ts`: one resolver per family, fifteen families (RCP, EIS, TSN, RRL, TRQREV, TRPREV, TOREV, ORL, CRRES, AOC, SCD, ASCAD, CORD, COVD, COVFCR), `createCareerCanonicalAuthoritativeStateResolvers(repositories)` for the full list. | Mirrors the capability adapter: pair check, exact id pattern, bound read captured once, family `assert*` recomputes identity, established-state check (D3), detached clone. ASCAD and CORD are added to the thirteen of P1 because section 4 names them eligible provenance and P5 resolves them. |
| R2 | `lib/hr-decision-context/build-draft-input.ts`: `buildHrDecisionContextDraftInput({ question, sourceState })` → `DecisionContextDraftInput`. | Outside both kernels and outside the HTTP transport. OPTION items only from PROPOSED RCP items with `AUTHORITATIVE_STATE` provenance to `<rcpId>/items/<ordinal>`; CONSTRAINT items from TRQREV; the question is `HUMAN_INPUT`. Source references: SNAP_, RCP (artifact and each item), EIS, TSN, RRL, TRPREV, every TRQREV. Fails closed on structural invalidity, lineage mismatch, a non-Phase-4 snapshot, a missing question, or an RCP without a PROPOSED item. |
| R3 | `lib/decision-runtime/composition/postgres-resolver-list.ts` (producer-neutral root bound to an explicit resolver list) and `lib/decision-runtime/local/career-canonical-producers.ts` (G3 repositories constructed locally on the shared connection, resolver list = Capability Core + fifteen G3 resolvers). `local/decision-context-api.ts` now composes through the resolver list. | The sealed composition index is unchanged; the new root is imported by path, not re-exported, because the R2 export surface (exactly two values) is frozen by test. |
| R6 | `lib/decision-adapters/career-canonical/namespace.ts`: exact-length pattern per family, locator grammar, non-resolvable prefix list (CRREL, DAINT, DCR, DCTXREV, DAR, HCOM, EAGR, ECTXREV). | Resolution is by pair plus exact pattern; a shorter, longer, lower-case or padded id is a reference mismatch, never a near-miss. |
| R8 | `test/decision-integration/import-boundary.test.ts`. | `lib/career` imports nothing from decision-core, decision-adapters, decision-runtime or the HR layer; `lib/decision-core` imports no career code; only the career-canonical adapter and the local wiring import G3; the HR layer imports no transport, Next, or database module. The optional shared leaf type was not introduced: G3 keeps its own four-field mirror, verified field-for-field equal. |

### Contract id vocabulary (decision D3)

`CAREER_<FAMILY>_<state literals>_V1`, where the state literals are the artifact's own
`proposalState` and `authorityState` (`NONE` rendered as `AUTHORITY_NONE`), `DECLARATION`
for explicit human declarations, and `IMMUTABLE_RECORD` for families whose contract carries
no proposal or authority field. `PHASE4_VERIFIED` stays reserved for Capability Core.

| Family | Producer id | Authority contract id |
| --- | --- | --- |
| RCP | `CONDYN_CAREER_CANONICAL_CHAIN` | `CAREER_RECOMMENDATION_PROPOSAL_PROPOSAL_ONLY_RECOMMENDATION_POLICY_BOUND_V1` |
| EIS | same | `CAREER_EVOLUTION_INPUT_STATE_PROPOSAL_ONLY_AUTHORITY_NONE_V1` |
| TSN | same | `CAREER_TENSION_STATE_PROPOSAL_ONLY_AUTHORITY_NONE_V1` |
| RRL | same | `CAREER_ROLE_RELATION_PROPOSAL_ONLY_AUTHORITY_NONE_V1` |
| TRQREV | same | `CAREER_TARGET_REQUIREMENT_REVISION_PROPOSAL_ONLY_AUTHORITY_NONE_V1` |
| TRPREV | same | `CAREER_TARGET_ROLE_PROFILE_REVISION_PROPOSAL_ONLY_AUTHORITY_NONE_V1` |
| TOREV | same | `CAREER_TARGET_ORGANIZATION_REVISION_IMMUTABLE_RECORD_V1` |
| ORL | same | `CAREER_ORGANIZATION_RELATION_IMMUTABLE_RECORD_V1` |
| CRRES | same | `CAREER_CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RESULT_IMMUTABLE_RECORD_V1` |
| AOC | same | `CAREER_ACTION_OCCURRENCE_DECLARATION_V1` |
| SCD | same | `CAREER_STATE_CHANGE_DECLARATION_V1` |
| ASCAD | same | `CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_V1` |
| CORD | same | `CAREER_OUTCOME_ROLE_DECLARATION_V1` |
| COVD | same | `CAREER_OUTCOME_VALENCE_DECLARATION_V1` |
| COVFCR | same | `CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_IMMUTABLE_RECORD_V1` |

### Locator grammar

`locator` is the exact artifact id, or `<artifactId>/items/<ordinal>` for one exact item of
an RCP (decimal ordinal, no padding, no sign). The resolved payload is always the whole
artifact; an item ordinal beyond the stored item count is
`ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH`.

### Error mapping inside a resolver

| Condition | Code |
| --- | --- |
| producer or contract id not this resolver's pair | `ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND` |
| artifact id not matching the exact family pattern; locator not in the grammar; ordinal out of range; stored id differs | `ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH` |
| repository answers `null` or throws the family's `*_NOT_FOUND` code | `ERR_DECISION_AUTHORITY_STATE_NOT_FOUND` |
| family `assert*` fails on the stored payload; stored state differs from the contract's literals; repository throws the family's persistence-invalid code | `ERR_DECISION_AUTHORITY_STATE_INVALID` |
| any other repository error | propagated unchanged |

## 3. Laws preserved

`PERSISTED != TRUE`, `AUTHORITY PAYLOAD != DECISION CONTEXT CONTENT` (the HR layer renders
only closed enumeration literals of a referenced item, never caller-chosen identifiers or
lineage ids; the P3 sentinel placed in G3 payloads never reaches a revision),
`REFERENCE PRESENT != REFERENCE RESOLVABLE` (P5: a claim over an absent AOC is
constructible; its resolution fails), `ONE CARRIER PER RELATION`, `NO IMPORT ACROSS FIELDS`,
`NO FOREIGN KEY ACROSS FIELDS`, `NO PREFIX-ONLY IDENTITY`. D1 is untouched: no G2 human
decision artifact is produced anywhere in this delta. D2 and D4 are not exercised here.

## 4. Boundaries found during implementation

| Id | Boundary | Handling |
| --- | --- | --- |
| B1 | The sealed API v1 transport maps only `ERR_DECISION_AUTHORITY_STATE_NOT_FOUND` and `ERR_DECISION_CONTEXT_*` to 422; `RESOLVER_NOT_FOUND`, `STATE_INVALID` and `ARTIFACT_REFERENCE_MISMATCH` become 500 `ERR_DECISION_API_INTERNAL`. The relation document's falsifier "removing a resolver turns the same POST from 201 into 422" therefore holds at the runtime level (`ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND`, proven in `resolver-list-composition.test.ts`) and would need a transport change to hold at HTTP level. A mutated RCP row answers 500 over HTTP (proven in P3). | Case 3 for the field owner: changing the mapping alters the frozen API v1 wire behaviour; not done. |
| B2 | P1 lists thirteen families, P5 resolves ASCAD and CORD through "P1 resolvers". | Fifteen resolvers; ASCAD and CORD are eligible provenance per relation section 4. Case 2, recorded here. |
| B3 | `node_modules` symlink rejected by Turbopack in worktrees. | Replaced by a hard-linked copy in this worktree; the other worktrees still carry the symlink. |
| B4 | The P3 sentinel must live in G3 payloads only. The capability snapshot id derives from the verification run, so source documents and target requirement entity ids carry the sentinel; it occurs in SNAP_, TRQREV, TRQINV, RRL, TSN, EIS and RCP payloads and in no Decision revision. | Recorded; the non-claim remains: absence of the sentinel is not absence of all derived content (OPTION statements render `recommendationKind` and `evolutionInputClass` literals). |
| B5 | P3 counts and names: capability-core 37 / 309, runtime 7 files + adapters 1 file / 39 tests on this base. | P8 asserts the counts observed on `435a112`. |

## 5. Proof run record (2026-10-09)

Executed in `condyn-admin-g2-producers`, each Postgres stage in its own freshly created
database or schema that was dropped afterwards; the shared `condyn` database was never
connected to for writes and its existence is asserted before and after the P3 cleanup.

| Suite | Result |
| --- | --- |
| `test/decision-integration/g2-g3-vertical-proof.test.ts` | P1 47 passed, P2 3 passed, P3 4 passed (HTTP 201 / stored == GET, sentinel absent, tampered row 500, deleted RCP 422, malformed JSON 400), P5 3 passed, P8 2 passed; P0, P4, P6, P7 10 todo. |
| `test/decision-integration/hr-decision-context.test.ts` | 4 passed. |
| `test/decision-integration/resolver-list-composition.test.ts` | 3 passed. |
| `test/decision-integration/import-boundary.test.ts` | 5 passed. |
| `test/decision-core`, `test/decision-runtime`, `test/decision-adapters`, `test/career/capability-core` | 83 files / 751 tests, all passed: `test/decision-core` 38 / 403, `test/career/capability-core` 37 / 309, `test/decision-runtime` 7 / 29 (R5 HTTP e2e included), `test/decision-adapters` 1 / 10. |
| `test/career` (G3 and SIL suites, legacy quarantine as classified) | 284 files: 278 passed, 6 skipped (live-provider guards); 1653 tests: 1647 passed, 6 skipped, 0 failed. The five legacy G1 suites that failed on a fresh database during the classification run passed here against the pre-shaped shared `condyn` database; their quarantine classification is unchanged. |
| `npx tsc --noEmit -p tsconfig.json` | 0 errors. |
| `git diff --stat v1.0.0-decision-core-phase8e2-occurrence-return-binding -- lib/decision-core` | empty. |

## 6. Not claimed

Authentication, deployment routing, provider inference, frontend rendering, learning, the
DCTXREV to `DREV_` binding (R4), claim reference discipline beyond the local P5 proof (R5),
startup registration order (R7), P6 and P7. A GREEN resolver result is detached state, not
Context content, not currentness, not recommendation authority.
