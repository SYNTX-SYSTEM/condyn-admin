# ADR 029: Action State Change Association Proposal

## Status

Implementation sealed.

Implementation: `36de0ebb84cc2181108cb643c96cf05c9bc48509`

Tag: `v1.0.0-decision-core-phase8c2-action-state-change-association`

## Context

Phase 8B records a represented claim that an operation occurred. Phase 8C1 records a represented claim that a state change occurred. Those artifacts remain independent: their coexistence does not itself create a relation, and it does not establish an outcome. An explicit association proposal requires its own contract so neither endpoint is silently changed to contain a predecessor or relation field.

## Decision

Add the `action-state-change-association` module:

```text
SEALED ActionOccurrenceClaim
+ SEALED StateChangeClaim
+ EXPLICIT HUMAN_INPUT | MODEL_PROPOSAL | AUTHORITATIVE_STATE provenance
-> ActionStateChangeAssociationProposal
-> STOP
```

It represents only an explicit association proposal between the two sealed endpoint roles with explicit represented provenance.

## Explicit association-proposal boundary

`ActionStateChangeAssociationProposal` consumes exactly one complete sealed `ActionOccurrenceClaim` and one complete sealed `StateChangeClaim`. It adds no predecessor field to either endpoint. The endpoint roles are distinct and ordered; endpoint actor/source equality or inequality is neither required nor forbidden.

`ACTION OCCURRENCE CLAIM + STATE CHANGE CLAIM != ASSOCIATION`.

The proposal exists only through explicit Phase 8C2 construction. It is not an automatic continuation of the decision/intention path or either claim path.

## Sealed endpoint semantics

Construction validates both endpoints through their existing public assertion contracts and does not repair them. Text equality, actor equality, source equality, ID similarity, temporal proximity, or temporal order does not infer association.

`ACTION OCCURRENCE CLAIM != STATE CHANGE CLAIM`.

`TEXT EQUALITY != ASSOCIATION`.

`ACTOR EQUALITY != ASSOCIATION`.

`SOURCE EQUALITY != ASSOCIATION`.

`TEMPORAL PROXIMITY != ASSOCIATION`.

`TEMPORAL ORDER != ASSOCIATION`.

## No automatic relation inference

Phase 8C2 contains no association detector, similarity operation, relation resolver, relation-kind classifier, or deterministic-derivation provenance. It also contains no Decision, Action Intent, Human Commitment, Outcome, effect, consequence, attribution, causal, score, confidence, status, time, or persistence state.

## Provenance semantics

The closed provenance union is exactly `HUMAN_INPUT | MODEL_PROPOSAL | AUTHORITATIVE_STATE`. It is its own semantic type even where representation resembles another provenance type: `SAME REPRESENTATION != SAME SEMANTIC ROLE`.

`DETERMINISTIC_DERIVATION` is not an association-proposal provenance.

`PROVENANCE != SUPPORT`.

## HUMAN_INPUT provenance

`{ origin: "HUMAN_INPUT", actorId }` records declared human proposal provenance only. Construction may trim a nonempty actor ID; stored assertion requires the already-trimmed representation.

It does not establish authenticated identity, authorization, signature, permission, responsibility, ownership, accountability, performer role, affected-actor role, relation truth, outcome, or causation.

## MODEL_PROPOSAL provenance

`{ origin: "MODEL_PROPOSAL", proposalRef }` records model proposal provenance only. Construction may trim a nonempty proposal reference; stored assertion requires the already-trimmed representation. Phase 8C2 invokes no model or provider.

`MODEL PROPOSAL != PUBLICATION AUTHORITY`.

It does not establish relation truth, semantic support, outcome, effect, attribution, or causation.

## AUTHORITATIVE_STATE provenance and authority limits

`{ origin: "AUTHORITATIVE_STATE", stateReference: { producerId, authorityContractId, artifactId, locator } }` cites only that exact opaque governed-state reference. The four fields must be non-blank strings; construction does not trim or normalize their stored representation.

`VALIDATE NON-BLANKNESS + PRESERVE EXACT REPRESENTATION`.

Phase 8C2 calls no `BoundAuthoritativeStateReader`, resolver, authority validator, repository, adapter, payload inspection, semantic evaluator, or persistence operation.

`REFERENCE != AUTHORITY TOKEN`.

`REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`.

`CURRENT SOURCE AUTHORITY != ASSOCIATION TRUTH`.

## No relation-kind taxonomy

There is no `kind`, `relationKind`, `CONTRADICTION`, `DEPENDENCY`, or other association taxonomy in Phase 8C2.

## StructuralRelationProposal non-reuse

The sealed Phase 5C3B `StructuralRelationProposal` remains a context-bound `DecisionContextItem × DecisionContextItem` contract with its own relation kinds. Phase 8C2 does not reuse, generalize, replace, or extend it.

`STRUCTURAL RELATION PROPOSAL != ACTION STATE CHANGE ASSOCIATION PROPOSAL`.

## Temporal exclusion

Phase 8C2 represents no temporal relation or association time. No timestamp, creation time, occurrence time, observation time, association time, effective time, range, schedule, clock, or random/time identity exists.

`ASSOCIATION PROPOSAL != TEMPORAL RELATION`.

`TEMPORAL ORDER != ASSOCIATION`.

`TEMPORAL ORDER != CAUSATION`.

## Artifact contract and canonicalization

Schema: `ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_V1`.

```ts
type ActionStateChangeAssociationProvenance =
  | { origin: "HUMAN_INPUT"; actorId: string }
  | { origin: "MODEL_PROPOSAL"; proposalRef: string }
  | { origin: "AUTHORITATIVE_STATE"; stateReference: AuthoritativeStateReference };

interface ActionStateChangeAssociationProposalInput {
  actionOccurrenceClaim: ActionOccurrenceClaim;
  stateChangeClaim: StateChangeClaim;
  provenance: ActionStateChangeAssociationProvenance;
}

interface ActionStateChangeAssociationProposal {
  artifactKind: "ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL";
  schemaVersion: "ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_V1";
  actionStateChangeAssociationProposalId: string;
  actionOccurrenceClaim: ActionOccurrenceClaim;
  stateChangeClaim: StateChangeClaim;
  provenance: ActionStateChangeAssociationProvenance;
}
```

Input has exactly three fields; artifact has exactly six. Construction may canonicalize only human actor ID and model proposal reference. It must not repair either endpoint. Authoritative-reference strings remain exact.

`CREATE MAY CANONICALIZE WHERE EXPLICITLY DEFINED`.

`CREATE MUST NOT REPAIR CLAIMS`.

`ASSERT MUST NOT REPAIR`.

## DASCA identity

`DASCA_` matches `^DASCA_[0-9A-F]{24}$`. It is the first 24 uppercase hexadecimal SHA-256 characters over:

```ts
[
  "ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_V1",
  actionOccurrenceClaim.actionOccurrenceClaimId,
  stateChangeClaim.stateChangeClaimId,
  canonicalProvenance
]
```

Canonical provenance is `['HUMAN_INPUT', actorId]`, `['MODEL_PROPOSAL', proposalRef]`, or `['AUTHORITATIVE_STATE', [producerId, authorityContractId, artifactId, locator]]`. The ordered endpoint roles are not sorted. Object insertion order is non-semantic; endpoint IDs and complete canonical provenance are identity-bearing.

`DASCA IDENTITY != RELATION TRUTH`.

`DASCA IDENTITY != OUTCOME IDENTITY`.

`DASCA IDENTITY != CAUSAL IDENTITY`.

`DASCA IDENTITY != PERSISTENCE AUTHORITY`.

## Stored assertion and boundary-local hostile representation safety

`assertActionStateChangeAssociationProposal(...)` is self-contained. Construction and assertion use boundary-local shallow descriptor capture: top-level owns both endpoints and provenance; provenance owns its direct variant; authoritative reference owns its four fields. Nested endpoints are validated only by their already-sealed public assertion contracts. Construction clones valid nested claims and returns detached state.

Accessors, symbols, hidden/non-enumerable fields, extras, invalid objects, and hostile nested claims reject without getter execution where applicable. Returned state is detached, not asserted deep-frozen.

## Error ownership

The exact errors are:

- `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INPUT_INVALID`
- `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ACTION_CLAIM_INVALID`
- `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_STATE_CHANGE_CLAIM_INVALID`
- `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_PROVENANCE_INVALID`
- `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_REFERENCE_INVALID`
- `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INVALID`
- `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ID_MISMATCH`

Constructor errors belong to malformed top-level input, Action Occurrence Claim endpoint, State Change Claim endpoint, provenance, and authoritative provenance reference respectively. Stored hostile, malformed, noncanonical, invalid nested-claim, or body-invalid state is `...INVALID`. A stale nested `DAOC_` or `DSCC_` is outer association invalid. Only an otherwise canonical valid body with stale/wrong outer `DASCA_` is `...ID_MISMATCH`.

## Persistence and authority boundary

`ASSOCIATION PROPOSAL != PERSISTENCE AUTHORITY`.

Phase 8C2 adds no repository, adapter, database, persister, revision, current/latest/head selection, or authority-of-record operation.

`PERSISTED != TRUE`.

Persistence remains governed record authority, not association truth.

## Legacy non-reuse

Phase 8C2 is constructed independently from first principles. It does not reuse or generalize `lib/career/decisions/outcome.ts`, `feedback.ts`, `learning.ts`, `OutcomeRecord`, `OutcomeState`, `FeedbackRecord`, `AttributionRecord`, `AttributionType`, or legacy association/causal vocabulary.

## Non-goals

Relation truth, action fact, state-change fact, outcome, effect, consequence, attribution, causation, causal support, semantic support, performer, temporal relation, current authority, publication authority, authority of reality, feedback, learning, persistence authority, and any future relation artifact are non-goals.

## Consequences

```text
ACTION OCCURRENCE CLAIM + STATE CHANGE CLAIM != ASSOCIATION
ASSOCIATION PROPOSAL != RELATION TRUTH
ASSOCIATION PROPOSAL != OUTCOME
ASSOCIATION PROPOSAL != EFFECT
ASSOCIATION PROPOSAL != CONSEQUENCE
ASSOCIATION != ATTRIBUTION
ASSOCIATION != CAUSATION
TEXT EQUALITY != ASSOCIATION
ACTOR EQUALITY != ASSOCIATION
SOURCE EQUALITY != ASSOCIATION
TEMPORAL PROXIMITY != ASSOCIATION
TEMPORAL ORDER != ASSOCIATION
TEMPORAL ORDER != CAUSATION
PROVENANCE != SUPPORT
REFERENCE PRESENT != CURRENT SOURCE AUTHORITY
MODEL PROPOSAL != PUBLICATION AUTHORITY
```

## Evidence

- Focused Phase 8C2: 1 file / 7 tests passing.
- Decision Core: 24 files / 302 tests passing.
- Capability regression including the Decision Core authority adapter: 29 files / 280 tests passing.
- Phase 8C2 production-only scoped TypeScript: PASS.
- `git diff --check`: PASS.
- `repomix-output.xml`: ABSENT.

Two implementation Deep Sweeps found no production defect in the examined Phase 8C2 production scope. One consolidated test-only correction added direct proof for mixed endpoint source origins, stored nested stale DAOC/DSCC error ownership, and authoritative-reference symbol-key and hidden-field rejection; production was not changed by that correction.

The implementation is sealed under the tested contract. Repository-wide and root-barrel standalone TypeScript cleanliness are not claimed unless independently proven.
