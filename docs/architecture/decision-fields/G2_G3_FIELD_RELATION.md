# G2 / G3 Field Relation: Generic Decision Core and Career Canonical Chain

Status: TOPOLOGY RESOLVED. CARRIER DECISIONS D1 TO D5 DECIDED BY HUMAN AUTHORITY ON 2026-10-09 (section 7).

Reconstructed 2026-10-09 under System Field Engineering from:
`capability-mapping` @ `ee06ff650080528c341fff024b132192a3850af6` (G2),
`architecture/target-revision-runtime` @ `b001360ec687451fc9a05c7742f48f96056c0a12` (G3),
and the preserved overlay `wip/field-01-overlay-2026-09-22` @ `9802146`.

This document records relations that were located in code and contracts. It
does not create authority, does not amend a sealed contract, and does not
decide the open items in section 7.

## 1. Fields

| Field | Home | Chain | Seal state |
| --- | --- | --- | --- |
| P: Capability Core | `lib/career/capability-core`, `docs/capability-core` | Source, Evidence, Capability; `SNAP_` with `publication.mode = PHASE4_VERIFIED` | Phase 4 SEALED (`79ad2d1`) |
| G2: Generic Decision Core and Runtime | `lib/decision-core`, `lib/decision-adapters`, `lib/decision-runtime`, `docs/decision-core`, `docs/decision-runtime` | `AuthoritativeStateReference`, `DCTX_`, `DREV_`, 6A to 8E2 | Phase 8 STRUCTURALLY CLOSED; API v1 FROZEN |
| G3: Career Canonical Chain | `lib/career/relation/*`, `lib/career/target/*`, `lib/career/*-admission`, `lib/career/sil-projection`, `lib/career/relation-adapters/*` | Target, Requirement, Capability-Requirement, Role, Tension, Evolution, Recommendation; DAR, DCTXREV, DCR, DAINT, HCOM, EAGR, ECTXREV, AOC, SCD, ASCAD, CORD, COVD, COVF*, COVFCR | Not sealed as a whole; FIELD_01/02/03 "Planned" |
| G1: Legacy Career Decision Looper | `lib/career/decisions`, `lib/career/repositories/lifecycle.ts` | Recommendation to Attribution, Learning, Policy | Declared non-authoritative by G2 (`docs/decision-core/ARCHITECTURE.md:622`); DDL drift proven on a fresh database |

## 2. Observed topology

```text
Capability Core SNAP_ (PHASE4_VERIFIED)
   ├──▶ G2  lib/decision-adapters/capability-core.ts      (status VERIFIED, mode PHASE4_VERIFIED, key == locator, id == artifactId)
   └──▶ G3  lib/career/capability-core/relation-operand/operand.ts:59   (CCOP_ requires the same publication state)

G2 and G3 import nothing from each other.
G3 mirrors G2's four-field reference shape without importing it
   (lib/career/relation/state-change-declaration/types.ts, externalStateRef).
Both share one PostgreSQL database through lib/career/db/client.ts; no foreign key crosses the fields.
```

G2 and G3 are siblings under one root producer. Neither is upstream of the other today.

## 3. Relation comparison

| Relation | G2 carrier | G3 carrier | Finding |
| --- | --- | --- | --- |
| Upstream state | none; referenced as opaque `AUTHORITATIVE_STATE` | TRPREV, TRQREV, RRL, TSN, EIS, RCP (`authorityState` NONE or `RECOMMENDATION_POLICY_BOUND`) | Complementary |
| Decision context | `DecisionContextDraft`: question and role-tagged statements with provenance | `CareerDecisionContextRevision`: DAR id, RCP id, subject inventory, copied grant scope; no statements | Different objects under one name |
| Authorization to decide | not modeled, by contract | `DecisionAuthorityGrantRevision` | Complementary |
| Human decision act | 7A: one or more chosen OPTION items, requires 6E chain | DCR: one class over all subjects, requires DAR match and window | Conflicting; neither derivable from the other |
| Recommendation | 6C/6D `MODEL_PROPOSAL` | RCP deterministic policy derivation | Conflicting provenance |
| Intent, commitment | 8A1, 8A2 | DAINT, HCOM; EAGR has FK to HCOM | Parallel; G3 execution is bound to its own HCOM |
| Execution authority and context | not modeled | EAGR, ECTXREV | Complementary |
| Occurrence, state change | 8B, 8C1 with source `HUMAN_INPUT` or `AUTHORITATIVE_STATE`, never resolved | AOC, SCD | Complementary; admitted seam on both sides |
| Association, outcome, valence | 8C2, 8C3 | ASCAD, CORD, COVD | Parallel |
| Return into context | 8D1 to 8D10: observation item into a child `DREV_` | COVFTD to COVFCR over a DCTXREV | Conflicting return homes |
| Loop closure | 8E2 needs 8A2 | FIELD_03 stops at COVFCR | Neither closes the HR loop today |

Identity collision: `DAINT_` is used by both fields, 24 hex characters in G2
(`lib/decision-core/action-intent/contract.ts:14`), 32 in G3
(`lib/career/relation/action-intent/contract.ts:21`).

## 4. Resolved relation

G3 is a legitimate state producer for G2 at exactly two seams. G3 is not a
producer for the human decision act or for the return revision.

### Seam A: pre-decision state into G2 contexts

Admitted by G2 Phase 5A (`lib/decision-core/authority/reader.ts`): any
resolver bound to one `producerId + authorityContractId` pair, resolving an
exact `artifactId` and `locator` to a persisted artifact whose identity is
recomputed by the producer's own assertion, returned as a detached clone.

Eligible G3 families: RCP, EIS, TSN, RRL, TRQREV, TRPREV, TOREV, ORL, CRRES.
Not eligible: CRREL (identity excludes the evaluation,
`lib/career/relation/capability-requirement/contract.ts:22`); use CRRES.

### Seam B: post-decision declarations into G2 claims

Admitted by G2 Phases 8B and 8C1: `AUTHORITATIVE_STATE` sources are stored
references and are never resolved at claim time. Eligible G3 families: AOC,
SCD, and as provenance for 8C2, 8C3 and 8D1: ASCAD, CORD, COVD, COVFCR.

### Seam C: G2 context into G3 decision context (inverse direction)

G3's own binding pattern (COVFTRB: exact reader-backed binding to one
revision) admits a new binding artifact from one DCTXREV to one exact `DREV_`
read through G2's `getRevisionById`. This is additive and mutates no sealed
contract. It is a new sealed relation and therefore a governance act.

### Laws that remain in force

```text
PERSISTED != TRUE
AUTHORITY PAYLOAD != DECISION CONTEXT CONTENT
REFERENCE PRESENT != REFERENCE RESOLVABLE
PROPOSAL != VERIFIED != AUTHORITATIVE != CURRENT != HEAD != LATEST
ENTITY != REVISION ; CONTENT != TRANSITION ; TRANSITION != REVISION ; REVISION != PERSISTENCE
FEEDBACK != LEARNING ; RETURN != NEW DECISION
ONE CARRIER PER RELATION
NO IMPORT ACROSS FIELDS ; NO FOREIGN KEY ACROSS FIELDS ; NO PREFIX-ONLY IDENTITY
```

## 5. Required integration relations

| Id | Relation | Where | Authority case |
| --- | --- | --- | --- |
| R1 | G3 resolver family, one resolver per eligible artifact family, each with truthful `authorityContractId` | new module beside `lib/decision-adapters/capability-core.ts` | 1, naming is 3 |
| R2 | HR context application layer building `DecisionContextDraftInput` from an RCP (OPTION items from PROPOSED items with `AUTHORITATIVE_STATE` provenance; question from `HUMAN_INPUT`; constraints from TRQREV) | outside both kernels and outside the HTTP transport | 1 |
| R3 | Composition root bound to a resolver list; G3 repositories constructed locally | `lib/decision-runtime/composition`, `lib/decision-runtime/local` | 1 |
| R4 | DCTXREV to `DREV_` binding artifact (COVFTRB pattern) with persistence and replay | new G3 relation | 3 |
| R5 | 8B/8C1 claims and 8C2/8C3/8D1 provenance referencing AOC, SCD, ASCAD, CORD, COVD | reference discipline; no G2 code change | 1 |
| R6 | Namespace rule: resolve by binding pair plus exact-length regex, never by prefix | all resolvers | 1 |
| R7 | One startup registration order covering `decision_context_revisions` and the T11 tables; still no cross-field FK | `lib/career/db/client.ts` | 1 |
| R8 | Import boundary preserved both ways; optional shared dependency-free leaf type for the four-field reference | `test/decision-core/authority/contract.test.ts:258` stays green | 2 |

## 6. Delta and preservation

MUST BECOME TRUE
- A G2 root `DREV_` can be created whose source references and OPTION provenance resolve through G3 resolvers to persisted RCP, EIS, TSN, RRL, TRPREV.
- A G3 decision context can be bound to that exact `DREV_`.
- G2 claims can reference AOC and SCD; a child `DREV_` can be produced from G3-sourced claims.

MUST REMAIN TRUE
- Every law in section 4. Capability Core Phase 4 remains the only root producer.
- `test/decision-core` 403, `test/career/capability-core` 272, `test/decision-runtime` and `test/decision-adapters` 39, API v1 contract freeze, and the G3 suites stay green and unchanged.

MUST REMAIN IMPOSSIBLE
- Two human decision carriers for one act; a derived human declaration.
- A G3 artifact with `authorityState NONE` resolvable under a contract id naming verified authority.
- A `lib/decision-core` import of career code; a foreign key across fields; prefix-only resolution.

FALSIFIERS
- POST with a reference to an absent RCP returns 422.
- Mutating a persisted G3 row makes its resolver throw on identity recomputation.
- A 24-hex `DAINT_` offered to a G3 resolver and a 32-hex `DAINT_` offered to G2 both fail.
- Removing a resolver turns the same POST from 201 into 422.

## 7. Decisions (Case 3, decided by Human Authority, 2026-10-09)

The following determinations were issued verbatim by the field owner and are
binding for every integration relation in section 5.

| Id | Decision (binding) | Consequence for the field |
| --- | --- | --- |
| D1 | G3 `HumanDecisionRecord` (DCR) is the only HR decision carrier. | G2 7A, 8A1, 8A2 and 8E2 are not used for HR. G2 8B, 8C1, 8C2, 8C3 and 8D remain in use as standalone branches. HR loop closure is proven by `DREV_` lineage (P7), not by 8E2. Any HR decision ingress admits a DCR through the DAR gate; no second declaration artifact may exist for the same act. |
| D2 | G3 COVFCR and G2 child `DREV_` coexist with explicitly separated semantics and exact provenance. | Child `DREV_`: the observation returned into the decision context, provenance `AUTHORITATIVE_STATE` to the exact COVD or COVFCR. COVFCR: valence feedback history over the DCTXREV. Neither selects, supersedes or summarizes the other. Each cross-reference names the exact artifact id and contract id. |
| D3 | `authorityContractId` reflects the actually established authority state; no implicit upgrade. | Contract ids encode the G3 `authorityState` literally (for example `..._PROPOSAL_ONLY_V1`, `..._RECOMMENDATION_POLICY_BOUND_V1`, `..._DECLARATION_V1`). A resolver must reject an artifact whose stored state differs from the state its contract id names. `PHASE4_VERIFIED` remains reserved for Capability Core. |
| D4 | Additive, immutable DCTXREV to `DREV_` binding with exact identity and replay, without changes to sealed contracts. | New G3 relation following the COVFTRB pattern: reader-backed exact read of the `DREV_`, identity recomputed over both bodies minus `createdAt`, idempotent persist, immutable conflict, BYTE and SEMANTIC replay, no foreign key across fields. DCTXREV, DCR and all G2 contracts stay byte-identical. |
| D5 | The classified SIL overlay is the integration base, only after preservation and type-check proof. | The overlay `wip/field-01-overlay-2026-09-22` is classified per FIELD_01 categories, its preservation suites and `tsc` are proven in an isolated database, and only then are `integration/g2-producer-adapters` and `integration/g3-decision-context-binding` re-pointed onto the classified commit. Until that proof exists they stay on `b001360`. |

Evidence recorded for D5 before the decision: clean `b001360` reports 253
`tsc` errors (87 in `lib/career/relation`, 26 in `lib/career/relation-adapters`,
51 in `test/career/relation`); the overlay reports 0.

## 8. Worktrees prepared 2026-10-09

| Path | Branch | Base | Purpose |
| --- | --- | --- | --- |
| `condyn-admin` | `capability-mapping` | | G2 reference state; untouched |
| `condyn-admin-sil-integration` | `wip/field-01-overlay-2026-09-22` | b001360 | preserved overlay for FIELD_01 classification; pushed |
| `condyn-admin-field-relation` | `architecture/g2-g3-field-relation` | b001360 | this document and the proof definition |
| `condyn-admin-g2-producers` | `integration/g2-producer-adapters` | b001360 | R1, R2, R3, R6, R8 |
| `condyn-admin-g3-binding` | `integration/g3-decision-context-binding` | b001360 | R4, R5, R7 |
| `condyn-admin-phase-gate` | `tooling/decision-core-phase-gate` | 3eaf89f | sealing tooling, 25 commits behind |

`node_modules` in the three new worktrees is a symlink to the main worktree.

The two integration worktrees are intentionally empty of commits. Their base is
provisional pending D5; see the type-check evidence recorded there.

## 9. Proof

The complete vertical integration proof is defined in
[VERTICAL_INTEGRATION_PROOF.md](./VERTICAL_INTEGRATION_PROOF.md) and indexed
by `test/decision-integration/g2-g3-vertical-proof.test.ts` (todo entries only).
