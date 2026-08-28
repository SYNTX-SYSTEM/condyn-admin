# ADR 028: State Change Claim

## Status

Implementation sealed.

Implementation: `691449fd8d244290cb96b55a3d26b5bd7a30a90b`

Tag: `v1.0.0-decision-core-phase8c1-state-change-claim`

## Context

Phase 8B records that a represented source claims an operation occurred; it does not record a state change and does not establish action occurrence fact. A described state change may be reported independently of any prior ConDyn decision, intention, commitment, or Action Occurrence Claim. The standalone state-change-claim boundary preserves that distinction and must not convert a claim into fact, effect, outcome, consequence, causal relation, or verified reality.

## Decision

Add the standalone `state-change-claim` module:

```text
HUMAN_INPUT or AUTHORITATIVE_STATE source
+ OPAQUE STATE CHANGE DESCRIPTION
-> StateChangeClaim
-> STOP
```

It represents only: an explicit represented source claims that a described state change occurred.

## Standalone state-change-claim boundary

`StateChangeClaim` has no required `ActionOccurrenceClaim`, `HumanDecisionDeclaration`, `DecisionActionIntent`, `HumanCommitment`, revision, assessment, recommendation, or coherence predecessor. It has no optional predecessor or relation ID. Identical text, actor equality, ID similarity, or temporal proximity establishes no relation. Any future relation requires a separately specified contract.

`ACTION OCCURRENCE CLAIM != STATE CHANGE CLAIM`.

`ACTION OCCURRENCE CLAIM + STATE CHANGE CLAIM != OUTCOME`.

`ENTITY A + ENTITY B != RELATION A-B`.

## Source semantics

The closed source union is exactly `HUMAN_INPUT | AUTHORITATIVE_STATE`. It is its own semantic type even though its current representation resembles the Action Occurrence Claim source type: `SAME REPRESENTATION != SAME SEMANTIC ROLE`.

`MODEL_PROPOSAL != STATE CHANGE CLAIM SOURCE`.

`DETERMINISTIC_DERIVATION != STATE CHANGE CLAIM SOURCE`.

## HUMAN_INPUT source

`{ origin: "HUMAN_INPUT", actorId }` records declared human reporting provenance only. Construction may trim a nonempty actor ID; stored assertion requires the already-trimmed representation.

It does not establish authenticated identity, authorization, signature, permission, affected actor, performer, executor, assignee, responsibility, ownership, accountability, state-change proof, or truth.

`STATE CHANGE CLAIM SOURCE ROLE != AFFECTED ACTOR ROLE`.

`ROLE NON-EQUIVALENCE != MANDATORY ACTOR-ID INEQUALITY`.

No affected-actor field exists.

## AUTHORITATIVE_STATE source and authority limits

`{ origin: "AUTHORITATIVE_STATE", stateReference: { producerId, authorityContractId, artifactId, locator } }` cites only that exact opaque governed-state reference. The four fields must be non-blank strings, but construction does not trim or normalize their stored representation.

`VALIDATE NON-BLANKNESS + PRESERVE EXACT REPRESENTATION`.

Phase 8C1 calls no `BoundAuthoritativeStateReader`, resolver, authority validator, evaluator, repository, adapter, payload read, or payload inspection.

`REFERENCE != AUTHORITY TOKEN`.

`REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`.

`CURRENT SOURCE AUTHORITY != SEMANTIC STATE CHANGE SUPPORT`.

`SEMANTIC STATE CHANGE SUPPORT != STATE CHANGE FACT`.

## No affected-actor semantics

There is no affected actor, performer, executor, assignee, responsible party, owner, or accountable-party field. The source of the claim is not thereby any actor in the described state change.

## Opaque state-change description

`stateChangeDescription` is required trimmed nonempty opaque text. It is not parsed into before/after state, structured delta, metric, unit, direction, magnitude, effect, outcome, consequence, taxonomy, status, causal relation, or proof.

`STATE CHANGE DESCRIPTION != STRUCTURED DELTA`.

`STATE CHANGE DESCRIPTION != EFFECT`.

`STATE CHANGE DESCRIPTION != OUTCOME`.

`STATE CHANGE DESCRIPTION != CAUSAL RELATION`.

## Temporal exclusion

Phase 8C1 represents no temporal claim. No timestamp, created time, change time, occurrence time, observation time, record time, effective time, range, schedule, clock, random/time identity, or temporal ordering field exists.

`CLAIM THAT CHANGE OCCURRED != REPRESENTATION OF WHEN CHANGE OCCURRED`.

`TIMESTAMP != STATE CHANGE PROOF`.

`TEMPORAL ORDER != CAUSATION`.

## Artifact contract and canonicalization

Schema: `STATE_CHANGE_CLAIM_V1`.

```ts
type StateChangeClaimSource =
  | { origin: "HUMAN_INPUT"; actorId: string }
  | { origin: "AUTHORITATIVE_STATE"; stateReference: AuthoritativeStateReference };

interface StateChangeClaimInput {
  source: StateChangeClaimSource;
  stateChangeDescription: string;
}

interface StateChangeClaim {
  artifactKind: "STATE_CHANGE_CLAIM";
  schemaVersion: "STATE_CHANGE_CLAIM_V1";
  stateChangeClaimId: string;
  source: StateChangeClaimSource;
  stateChangeDescription: string;
}
```

Input has exactly two fields; artifact has exactly five. No predecessor, before/after state, delta, metric, affected actor, performer, status, rationale, evidence, temporal, outcome, causal, relation, or persistence field exists. Human actor ID and description may trim during construction; authoritative reference strings remain exact.

`CREATE MAY CANONICALIZE WHERE EXPLICITLY DEFINED; ASSERT MUST NOT REPAIR.`

## DSCC complete represented-claim identity

`DSCC_` matches `^DSCC_[0-9A-F]{24}$`. It is the first 24 uppercase hexadecimal characters of SHA-256 over:

```ts
[
  "STATE_CHANGE_CLAIM_V1",
  canonicalSource,
  stateChangeDescription
]
```

`canonicalSource` is `["HUMAN_INPUT", actorId]` or `["AUTHORITATIVE_STATE", [producerId, authorityContractId, artifactId, locator]]`. Object insertion order is non-semantic; every exact reference axis and description is identity-bearing.

`DSCC IDENTITY != REAL-WORLD STATE CHANGE IDENTITY`.

`DSCC IDENTITY != OUTCOME IDENTITY`.

`DSCC IDENTITY != CAUSAL IDENTITY`.

`DSCC IDENTITY != TRUTH`.

`DSCC IDENTITY != CURRENT SOURCE AUTHORITY`.

`DSCC IDENTITY != PERSISTENCE AUTHORITY`.

## Stored assertion and boundary-local hostile representation safety

`assertStateChangeClaim(...)` is self-contained and calls no external dependency. Construction and assertion use boundary-local shallow descriptor capture: top-level owns `source` and `stateChangeDescription`; source owns its direct variant shape; authoritative reference owns its four fields. This preserves nested semantic error ownership.

Accessors, symbols, hidden/non-enumerable fields, extras, invalid objects, and applicable self/cycles reject without getter execution. Returned state is detached, not asserted deep-frozen.

## Error ownership

The exact errors are:

- `ERR_DECISION_STATE_CHANGE_CLAIM_INPUT_INVALID`
- `ERR_DECISION_STATE_CHANGE_CLAIM_SOURCE_INVALID`
- `ERR_DECISION_STATE_CHANGE_CLAIM_REFERENCE_INVALID`
- `ERR_DECISION_STATE_CHANGE_CLAIM_DESCRIPTION_INVALID`
- `ERR_DECISION_STATE_CHANGE_CLAIM_INVALID`
- `ERR_DECISION_STATE_CHANGE_CLAIM_ID_MISMATCH`

Constructor errors belong respectively to malformed top-level input, source, authoritative reference, and description. Stored hostile, malformed, noncanonical, or body-invalid state is `...INVALID`; only otherwise-valid stale identity is `...ID_MISMATCH`.

## Persistence and authority boundary

`STATE CHANGE CLAIM ARTIFACT != PERSISTENCE AUTHORITY`.

Phase 8C1 adds no repository, persistence adapter, persister, authority-of-record operation, or current/latest/head selection.

`PERSISTED != TRUE`.

Persistence is governed record authority, not state-change fact.

## Legacy non-reuse

Phase 8C1 is constructed independently from first principles. It does not reuse or generalize `lib/career/decisions/outcome.ts`, `OutcomeRecord`, `OutcomeState`, action ID, actor, occurrence time, evidence, SUCCESS/FAILURE domain states, date/random identity, temporal Action-to-Outcome invariants, or legacy feedback attribution.

`LEGACY OUTCOME RECORD != STATE CHANGE CLAIM`.

## Non-goals

State-change fact, observed reality, verified change, affected actor, performer, execution, effect, outcome, consequence, causal claim, structured delta, temporal state, relation to Action Occurrence Claim or prior decision state, semantic state-change support, authority of reality, feedback, learning, and persistence authority are non-goals.

## Consequences

```text
STATE CHANGE CLAIM != STATE CHANGE FACT
STATE CHANGE CLAIM != OBSERVED REALITY
STATE CHANGE CLAIM != VERIFIED CHANGE
STATE CHANGE CLAIM != EFFECT
STATE CHANGE CLAIM != OUTCOME
STATE CHANGE CLAIM != CONSEQUENCE
STATE CHANGE CLAIM != CAUSAL CLAIM
SOURCE PROVENANCE != CURRENT SOURCE AUTHORITY
CURRENT SOURCE AUTHORITY != SEMANTIC STATE CHANGE SUPPORT
SEMANTIC STATE CHANGE SUPPORT != AUTHORITY OF REALITY
ACTION OCCURRENCE CLAIM != STATE CHANGE CLAIM
ACTION OCCURRENCE CLAIM + STATE CHANGE CLAIM != OUTCOME
TEXT EQUALITY != RELATION
ACTOR EQUALITY != RELATION
TEMPORAL PROXIMITY != RELATION
TEMPORAL ORDER != CAUSATION
```

## Evidence

- Focused Phase 8C1: 1 file / 7 tests passing.
- Decision Core: 23 files / 295 tests passing.
- Capability regression including the Decision Core authority adapter: 29 files / 280 tests passing.
- Scoped TypeScript and `git diff --check`: PASS.
- `repomix-output.xml`: ABSENT.
