# ADR 036: Decision Context Observation Materialization Readiness

## Status

Accepted for Phase 8D5 documentation.

## Decision

Phase 8D5 defines `DecisionContextObservationMaterializationReadiness` as positive structural readiness state only. Its canonical meaning is:

> A deterministic structural check establishes that the OBSERVATION item semantics carried by one sealed target-revision binding satisfy the source-reference and candidate-item-absence preconditions required for future materialization relative to that bound base revision.

The topology is deliberately narrow:

```text
DecisionContextObservationTargetRevisionBinding
        |
        v
structural readiness checks
        |
        v
DecisionContextObservationMaterializationReadiness
        |
        v
STOP
```

EXACT REVISION BINDING != MATERIALIZATION READINESS

Phase 8D4B proves reader-backed exact binding to one complete valid base revision. That alone does not prove that the sealed projected `OBSERVATION` semantics can be newly materialized relative to that base revision. Phase 8D5 makes exactly two incremental structural preconditions explicit: required `AUTHORITATIVE_STATE` source-reference inventory membership and candidate-item absence.

## Positive readiness only

`DecisionContextObservationMaterializationReadiness` exists only when every Phase 8D5 structural precondition passes. It contains no `READY` or `NOT_READY` status, score, confidence, ranking, priority, recommendation, threshold, or human approval field. Failure of a precondition produces no readiness artifact.

The complete sealed `DecisionContextObservationTargetRevisionBinding` remains retained. Its revision remains base state:

BOUND REVISION != MUTATION DESTINATION

READINESS != REVISION TRANSITION

READINESS != REVISION CREATION

READINESS != CONTEXT MUTATION

Readiness neither selects nor creates a future revision.

## Projected semantics and candidate identity

Phase 8D5 obtains projected `OBSERVATION` semantics only through sealed predecessor lineage already retained in the binding:

```text
binding
-> target declaration
-> item projection
-> projectedItemInput
```

It accepts no independent role, statement, provenance, or target input. It derives the candidate `DCI_` identity through the existing Decision Context identity semantics for that sealed role, statement, and provenance. `candidateItemId` represents only the identity a future materialized `DecisionContextItem` would have under that existing contract.

CANDIDATE ITEM ID != DECISION CONTEXT ITEM

CANDIDATE ITEM ID != MATERIALIZATION

CANDIDATE ITEM ID != CONTEXT MEMBERSHIP

## Structural readiness preconditions

For `HUMAN_INPUT` and `MODEL_PROPOSAL` provenance, Phase 8D5 introduces no `sourceStateReferences` membership requirement.

For `AUTHORITATIVE_STATE` provenance, the exact projected `stateReference` must already be present in the bound base Context's `sourceStateReferences`. Absence is `ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_SOURCE_REFERENCE_MISSING`. This is an exact structural inventory-membership check only.

SOURCE REFERENCE PRESENT != SOURCE AUTHORITY RESOLVED

SOURCE REFERENCE PRESENT != SOURCE AUTHENTICATED

SOURCE REFERENCE PRESENT != SOURCE CURRENT

SOURCE REFERENCE PRESENT != SOURCE TRUE

SOURCE REFERENCE PRESENT != SEMANTIC SUPPORT

SOURCE REFERENCE PRESENT != CAUSATION

SOURCE STATE INVENTORY MEMBERSHIP != EXTERNAL AUTHORITY

Phase 8D5 does not resolve the reference, fetch source payload, authenticate source identity, verify freshness, verify truth, verify semantic support, or establish causation.

The deterministic `candidateItemId` must not already occur in `binding.revision.context.items`. If it is present, failure is `ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_ITEM_ALREADY_PRESENT`. This means only that Phase 8D5 represents readiness for new materialization; it does not infer history or lineage from pre-existing item membership.

ITEM ALREADY PRESENT != RETURN PATH MATERIALIZED

ITEM ALREADY PRESENT != LOOP CLOSED

ITEM ID ABSENT != SEMANTIC NOVELTY

ITEM ID ABSENT != TRUTH

ITEM ID ABSENT != PRIORITY

## Exact artifact and identity

`DecisionContextObservationMaterializationReadiness` has schema `DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_V1`, kind `DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS`, and ID prefix `DCOMR_`. It has exactly five fields:

```text
artifactKind
schemaVersion
decisionContextObservationMaterializationReadinessId
decisionContextObservationTargetRevisionBinding
candidateItemId
```

There is no `DecisionContextItem`, materialized item, new Context, future Context, future revision, current/head/latest revision, source payload, authority result, truth flag, status, score, confidence, or timestamp field.

Identity commits to:

```text
[
  "DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_V1",
  canonical complete DecisionContextObservationTargetRevisionBinding,
  candidateItemId
]
```

It uses SHA-256, the first 24 uppercase hexadecimal characters, and `DCOMR_`. Object insertion order is non-semantic. The complete represented binding is retained in identity semantics; its identity string alone is not treated as proof of every represented binding field. This is not semantic truth proof.

## Stored assertion and representation safety

`assertDecisionContextObservationMaterializationReadiness` is self-contained. It performs no reader call, authority resolution, Context construction, revision construction, or persistence operation. It revalidates exact representation, the sealed complete binding, `candidateItemId`, applicable `AUTHORITATIVE_STATE` inventory membership, candidate-item absence, and deterministic DCOMR identity.

Stored body invalidity precedes DCOMR ID mismatch. Stored assertion repairs nothing.

Boundary capture is descriptor-safe. Accessors are rejected without getter execution. Hidden, symbol, and extra properties are rejected where applicable. The complete predecessor is retained, the result is detached from caller representation, and stored assertion is reader-free and resolver-free. No deep freeze is claimed.

## No materialization and core boundary

READINESS != MATERIALIZATION

Phase 8D5 does not create a `DecisionContextItem`, append anything to `context.items`, modify `sourceStateReferences`, create a Context, create a revision, or persist anything.

READINESS != MATERIALIZATION AUTHORITY

READINESS != DECISION CONTEXT ITEM

READINESS != ITEM MEMBERSHIP

READINESS != CONTEXT MEMBERSHIP

READINESS != CONTEXT MUTATION

READINESS != REVISION MUTATION

READINESS != REVISION CREATION

READINESS != REVISION TRANSITION

READINESS != PERSISTENCE

READINESS != PERSISTENCE AUTHORITY

READINESS != OBSERVATION TRUTH

READINESS != OBSERVED REALITY

READINESS != OUTCOME TRUTH

READINESS != SEMANTIC SUPPORT

READINESS != CAUSATION

READINESS != HUMAN DECISION

READINESS != LOOP CLOSED

CANDIDATE ITEM ID != DECISION CONTEXT ITEM

SOURCE STATE INVENTORY MEMBERSHIP != EXTERNAL AUTHORITY

PERSISTED != TRUE

## Error surface

The exact error surface is:

```text
ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_INPUT_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_BINDING_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_SOURCE_REFERENCE_MISSING
ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_ITEM_ALREADY_PRESENT
ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_MATERIALIZATION_READINESS_ID_MISMATCH
```

## Current return path

- 8D1: candidate representation.
- 8D2: explicit positive human admission.
- 8D3: deterministic future OBSERVATION-item semantic projection.
- 8D4A: explicit human DREV-shaped base-target declaration.
- 8D4B: reader-backed exact binding to one complete valid base revision.
- 8D5: deterministic structural materialization readiness relative to that bound base revision.

Actual `DecisionContextItem` materialization, Context item membership, Context transition, revision creation or transition, persistence of a future revision, and loop closure remain outside the return path. Full Phase 8 remains incomplete.

## Implementation evidence

- Implementation commit: `bdbd9198fc28d599751faa7274a7375f2d1a0996`.
- Implementation tag: `v1.0.0-decision-core-phase8d5-materialization-readiness`.
- Focused 8D5: 9 / 9 passed.
- Decision Core: 31 files / 355 tests passed.
- Capability + authority-adapter: 32 files / 295 tests passed.
- Phase Gate: MECHANICAL VERIFICATION PASS.
- Implementation seal: MECHANICAL SEALING PASS.

This is scoped implementation evidence only. It does not claim repository-wide semantic correctness, zero defects, or repository-wide TypeScript cleanliness.

DecisionContextObservationMaterializationReadiness -> STOP
