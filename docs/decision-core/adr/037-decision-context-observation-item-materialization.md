# ADR 037: Decision Context Observation Item Materialization

## Status

Accepted for Phase 8D6 documentation.

## Decision

Phase 8D6 defines `DecisionContextObservationItemMaterialization` as a narrow deterministic item-materialization boundary. Its canonical meaning is:

> A deterministic materialization operation constructs the exact standalone DecisionContextItem representation already authorized by one sealed DecisionContextObservationMaterializationReadiness, while preserving the complete readiness lineage and creating no Context membership.

The topology is deliberately bounded:

```text
DecisionContextObservationMaterializationReadiness
        |
        v
deterministic item materialization
        |
        v
DecisionContextObservationItemMaterialization
        |
        v
STOP
```

Phase 8D6 establishes one exact standalone `DecisionContextItem` representation. Its values come only from sealed readiness lineage:

```text
readiness
-> target revision binding
-> target declaration
-> item projection
-> projectedItemInput
```

No independent item input, item ID, role, statement, provenance, Context, or revision is accepted.

## Exact item and provenance preservation

The embedded item has exactly four fields:

```text
itemId
role
statement
provenance
```

Its `itemId` equals `readiness.candidateItemId` exactly. Its role remains `OBSERVATION`; its statement remains the exact projected statement; its provenance remains the exact projected provenance.

HUMAN_INPUT remains HUMAN_INPUT

MODEL_PROPOSAL remains MODEL_PROPOSAL

AUTHORITATIVE_STATE remains AUTHORITATIVE_STATE

The deterministic materialization mechanism does not replace statement provenance and does not describe that provenance as `DETERMINISTIC_DERIVATION`. `MODEL_PROPOSAL != FACT`.

MATERIALIZED ITEM ID = READINESS CANDIDATE ITEM ID

This equality is identity continuity only. It introduces no second DCI identity algorithm and establishes neither Context membership, persistence, loop closure, truth, nor authority.

## No Context membership

ITEM EXISTENCE != CONTEXT MEMBERSHIP

READINESS != MATERIALIZATION

MATERIALIZATION != ITEM MEMBERSHIP

MATERIALIZATION != CONTEXT MEMBERSHIP

MATERIALIZATION != CONTEXT MUTATION

MATERIALIZATION != REVISION MUTATION

MATERIALIZATION != REVISION CREATION

MATERIALIZATION != REVISION TRANSITION

MATERIALIZATION != PERSISTENCE

MATERIALIZATION != PERSISTENCE AUTHORITY

MATERIALIZATION != LOOP CLOSED

MATERIALIZED ITEM != CONTEXT MEMBER

ITEM ID != CONTEXT MEMBERSHIP

ITEM ID != PERSISTENCE

ITEM ID != LOOP CLOSURE

Phase 8D6 does not insert the item into `binding.revision.context.items`. It does not call `createDecisionContextDraft`, `assertDecisionContextDraft`, `createDecisionContextRevision`, or any revision persister. It does not modify `sourceStateReferences` or the bound revision, construct a future Context or revision, or persist anything. The item exists only inside the Phase 8D6 materialization artifact at this boundary.

## Exact artifact and identity

`DecisionContextObservationItemMaterialization` has schema `DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_V1`, kind `DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION`, and ID prefix `DCOIM_`. It has exactly five fields:

```text
artifactKind
schemaVersion
decisionContextObservationItemMaterializationId
decisionContextObservationMaterializationReadiness
item
```

There is no Context, `contextId`, membership, future Context, revision, future revision, current/head/latest revision, persistence, authority, truth, status, score, confidence, or timestamp field.

The complete sealed `DecisionContextObservationMaterializationReadiness` is retained, not reduced to DCOMR, DCI, DREV, or candidate IDs. The artifact remains self-contained after creation.

Identity commits to:

```text
[
  "DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_V1",
  canonical complete DecisionContextObservationMaterializationReadiness,
  canonical complete DecisionContextItem
]
```

It uses SHA-256, the first 24 uppercase hexadecimal characters, and `DCOIM_`. Object insertion order is non-semantic. Identity commits to complete represented readiness and item state; it is not truth proof.

## Stored assertion and representation safety

`assertDecisionContextObservationItemMaterialization` is fully self-contained. It performs no reader call, authority resolution, Context construction, revision construction, or persistence operation. It verifies exact five-field artifact representation, complete sealed readiness, exact four-field item representation, candidate-item equality, projected role, statement, and provenance equality, and deterministic complete-state DCOIM identity.

Body invalidity precedes DCOIM ID mismatch. Stored assertion repairs nothing.

Boundary capture is descriptor-safe. Accessors are rejected without getter execution. Hidden, symbol, and extra properties are rejected where applicable. Hostile nested readiness, item, provenance, and state-reference state are rejected. The complete predecessor is retained and the result is detached from caller representation. No deep freeze is claimed.

## Truth and authority boundary

MATERIALIZATION != OBSERVATION TRUTH

MATERIALIZATION != OBSERVED REALITY

MATERIALIZATION != OUTCOME TRUTH

MATERIALIZATION != SEMANTIC SUPPORT

MATERIALIZATION != CAUSATION

MATERIALIZATION != HUMAN DECISION

MATERIALIZED OBSERVATION != TRUE OBSERVATION

AUTHORITATIVE_STATE PROVENANCE != SOURCE TRUTH

SOURCE INVENTORY MEMBERSHIP != EXTERNAL AUTHORITY

MODEL_PROPOSAL PROVENANCE != MODEL FACT

HUMAN_INPUT PROVENANCE != VERIFIED FACT

PERSISTED != TRUE

## Error surface

The exact error surface is:

```text
ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_INPUT_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_READINESS_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_ID_MISMATCH
```

## Current return path

- 8D1: candidate representation.
- 8D2: explicit positive human admission.
- 8D3: deterministic future OBSERVATION-item semantic projection.
- 8D4A: explicit human DREV-shaped base-target declaration.
- 8D4B: reader-backed exact binding to one complete valid base revision.
- 8D5: deterministic structural materialization readiness.
- 8D6: deterministic standalone `DecisionContextItem` materialization.

Item membership in a Context, Context transition, revision creation or transition, persistence of a future revision, and loop closure remain outside the return path. Full Phase 8 remains incomplete.

## Implementation evidence

- Implementation commit: `5a04a1c755e12124f6b7aba11421599b48d89bdf`.
- Implementation tag: `v1.0.0-decision-core-phase8d6-item-materialization`.
- Focused 8D6: 7 / 7 passed.
- Decision Core: 32 files / 362 tests passed.
- Capability + authority-adapter: 32 files / 295 tests passed.
- Phase Gate: MECHANICAL VERIFICATION PASS.
- Implementation seal: MECHANICAL SEALING PASS.

This is scoped implementation evidence only. It does not claim repository-wide semantic correctness, zero defects, or repository-wide TypeScript cleanliness.

DecisionContextObservationItemMaterialization -> STOP
