# G3 Decision Context Binding: implementation of relations R4, R5 and R7

Branch: `integration/g3-decision-context-binding`. Base: `435a112` (classified overlay, decision D5).
Governing documents: `docs/architecture/decision-fields/G2_G3_FIELD_RELATION.md` and
`VERTICAL_INTEGRATION_PROOF.md` on `architecture/g2-g3-field-relation`; decisions D1 to D5 of 2026-10-09.

No sealed contract was modified. `lib/decision-core/**`, `lib/decision-runtime/**`,
`lib/career/relation/decision-context/**` and `lib/career/relation/decision-record/**` are byte-identical to the base.

## R4: `CareerDecisionContextDecisionRevisionBinding` (D4)

| Aspect | Value |
| --- | --- |
| Module | `lib/career/relation/decision-context-decision-revision-binding/` (`types.ts`, `contract.ts`, `replay/index.ts`) |
| Schema version | `CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_V1` |
| Identity | `DCDRB_` + first 32 uppercase hex of SHA-256 over `[schemaVersion, canonical(DCTXREV minus createdAt), canonical(DREV witness), canonical(recommendationProposalWitness)]` |
| Bound sides | one `CareerDecisionContextRevision` read by exact id through a Career reader; one generic `DecisionContextRevision` read by exact id through a generic reader |
| Witness rule | exactly one whole-artifact DREV `sourceStateReferences` entry (`locator == artifactId`) with producer `CONDYN_CAREER_CANONICAL_CHAIN` and contract `CAREER_RECOMMENDATION_PROPOSAL_PROPOSAL_ONLY_RECOMMENDATION_POLICY_BOUND_V1` naming the DCTXREV `recommendationProposalId`; further references with that pair are admitted only as item locators `<rcpId>/items/<ordinal>` of the same RCP (R1/R6 grammar). Errors: `..._WITNESS_MISSING`, `..._WITNESS_AMBIGUOUS`, `..._WITNESS_MISMATCH` |
| Generic side validation | shape witness only (exact keys, `DREV_`/`DCTX_`/`DCI_` patterns, exact four-field references). Generic validity is asserted by the reader adapter `lib/decision-adapters/career-decision-context-binding/` using `assertDecisionContextRevision`. SHAPE WITNESS != GENERIC VALIDITY |
| Persistence | `lib/career/relation-adapters/decision-context-decision-revision-binding-persistence/`: table `career_decision_context_decision_revision_bindings`, one restrictive FK to `career_decision_context_revisions`, no FK to `decision_context_revisions`; insert `ON CONFLICT DO NOTHING`, exact reread, `*_IMMUTABLE_CONFLICT` on divergent payload |
| Replay | BYTE, DERIVATION, SEMANTIC (re-read both sides by exact id, re-assert DAR and RCP witnesses) |
| Admission | `lib/career/decision-context-decision-revision-binding-admission/application.ts` `bindAndPersistCareerDecisionContextDecisionRevision(input, deps)` |

Non-claims: `BINDING != CURRENTNESS`, `BINDING != ACCEPTANCE`, `BINDING != DECISION AUTHORITY`,
`BINDING != SEMANTIC SUPPORT`, `RCP WITNESS != OPTION CORRESPONDENCE`, `READER RETURN != PERSISTENCE PROOF`.

Under D1 the binding precedes the DCR: the frontend-visible framing is the DREV, the
authorized human declaration is the DCR over the bound DCTXREV. The binding itself declares nothing.

## R5: declaration references for generic claims (D2, D3)

`lib/career/canonical-authority/` is the single carrier of the vocabulary: producer id
`CONDYN_CAREER_CANONICAL_CHAIN` and fifteen contract ids built from the artifact's own literals
(`PROPOSAL_ONLY_AUTHORITY_NONE`, `PROPOSAL_ONLY_RECOMMENDATION_POLICY_BOUND`, `DECLARATION`,
`IMMUTABLE_RECORD`). The producer declares its authority state; the R1 resolver family imports
these values (agreed with the G2 producer session, Case 2, no meaning change). Builders re-assert
the artifact and return `{ producerId, authorityContractId, artifactId, locator = artifactId }` for
AOC, SCD, ASCAD, CORD, COVD, COVFCR and RCP; artifact ids must be exactly 32 hex characters (R6).
The RCP builder refuses any `authorityState` other than `RECOMMENDATION_POLICY_BOUND`.

Correction 2026-10-09: the first version (`9dcd315`) used producer `CONDYN_CAREER_CANONICAL` and a
second, self-invented contract vocabulary. Integration with R1 proved both unresolvable
(`ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND`) and the witness rule incompatible with the R2 item
locators. The vocabulary was aligned to its authoritative home and the witness rule to the locator
grammar.

Proven use: 8B `ActionOccurrenceClaim` and 8C1 `StateChangeClaim` with `AUTHORITATIVE_STATE` sources
naming AOC and SCD; 8C2, 8C3 and 8D1 provenance naming ASCAD, CORD, COVD; a child DREV whose
OBSERVATION item carries exact COVD provenance while the root DREV stays unchanged (D2).

## R7: unified startup registration

`lib/persistence/unified-schema-registration.ts` is the only module that knows both schemas.
`registerUnifiedPersistenceSchema(sql)` runs, in order: the complete Career DDL
(`applyCareerDbSchema`, extracted from `lib/career/db/client.ts` without behavior change, including
T11 and SIL lineage), then `decision_context_revisions`, then the binding table.
`assertNoCrossFieldForeignKeys(sql)` fails on any foreign key whose two sides belong to different fields.
Request handling never calls it. Wiring it into a process entry point is a composition decision outside this relation.

## Evidence

All runs on 2026-10-09 in freshly created PostgreSQL databases whose identity
was checked with `current_database()` before they were dropped. The shared
`condyn` database was not touched (76 tables before and after).

| Proof | Scope | Result |
| --- | --- | --- |
| Type-check | `tsc --noEmit` on the whole worktree | 0 errors |
| R4 contract | `test/career/relation/decision-context-decision-revision-binding/binding.test.ts` | 6/6: exact binding, identity recomputation, createdAt-independent identity, detached values, named reader errors, witness missing/ambiguous/mismatch/foreign producer, tamper detection, BYTE/DERIVATION/SEMANTIC replay in memory |
| R4/R7 schema freeze | `test/career/relation-adapters/decision-context-decision-revision-binding-persistence/schema-freeze.test.ts` | 3/3: table and columns frozen, one restrictive Career FK, no FK to `decision_context_revisions`, exact-id repository surface |
| D3/R5 vocabulary | `test/career/canonical-authority/references.test.ts` | 4/4: fifteen frozen contract ids, no VERIFIED/CURRENT/HEAD/LATEST/ACCEPTED/TRUE, exact locators, declaration re-assertion, RCP refuses authority upgrade |
| Vertical integration | `test/decision-integration/g3-decision-context-binding-vertical.test.ts` in its own database | 10/10. P0: unified registration in a fresh database, idempotent, no cross-field FK, falsifier table detected. P4: admission persists and rereads one exact DCDRB over real PostgreSQL, same payload idempotent, divergent payload `IMMUTABLE_CONFLICT`, one row, BYTE/DERIVATION/SEMANTIC replay against live repositories, tampered row rejected as corruption, foreign-witness DREV refused, selecting reader refused, inverse walk from a fresh client by exact ids to DREV, DCTXREV, DAR, RCP and DCR. P5: 8B/8C1/8C2/8C3/8D1 built from AOC/SCD/ASCAD/CORD/COVD references with no resolver in the generic constructors; child DREV persisted with exact COVD provenance while the root DREV rereads unchanged |
| G2 preservation | `test/decision-core`, `test/decision-runtime`, `test/decision-adapters`, `test/decision-integration` | 47 files, 452 tests: 451 passed, 1 skipped. R5 HTTP e2e first failed because Turbopack rejected a `node_modules` symlink pointing outside the worktree (environment setup); after replacing it with a hardlink copy, R5 GREEN |
| Career preservation | `vitest run test/career` | 287 files, 1666 tests: 1631 passed, 6 skipped, 29 failed. 27 failures are the four legacy G1 lifecycle suites classified as LEGACY QUARANTINE (pre-existing DDL drift). 2 are 5000 ms load timeouts in the COVFCR replay suite; re-run idle 5/5 passed |

Production code outside the new modules changed in exactly one place:
`lib/career/db/client.ts` extracts `applyCareerDbSchema(sql)` from `initDbSchema()`
with identical DDL and order.

## Remaining boundaries

- R1 resolvers (worktree `condyn-admin-g2-producers`) are required before a DREV with an RCP source reference can be created through `POST /api/decision-contexts`; in this proof the root DREV is persisted in-process through the sealed 5D2B adapter.
- Reachability probing of AOC/SCD references (P5 third clause) depends on R1.
- The full 8D1 to 8D10 return traversal into a child DREV is not exercised here; the proof constructs the child revision directly with exact COVD provenance (D2) and leaves the governed 8D path to the full P7 run.
- The DCR over a bound DCTXREV (P6) reuses the sealed T11C producer; no HTTP ingress exists (FBR-2 unchanged).
- Startup wiring of `registerUnifiedPersistenceSchema` into the worker or server entry point is not part of this relation.
- `DAINT_` prefix collision between fields remains; resolvers must bind by producer and contract pair with exact-length patterns.
