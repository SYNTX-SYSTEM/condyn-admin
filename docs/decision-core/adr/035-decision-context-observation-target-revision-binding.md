# ADR 035: Decision Context Observation Target Revision Binding

## Status

Accepted for Phase 8D4B documentation.

## Decision

Phase 8D4B defines `DecisionContextObservationTargetRevisionBinding` as one narrow reader-backed exact revision binding. Its canonical meaning is:

> A bound revision-read capability returns one exact sealed `DecisionContextRevision` whose `revisionId` equals the `targetRevisionId` declared by one sealed `DecisionContextObservationTargetDeclaration`.

The topology is explicit and stops at the binding:

```text
DecisionContextObservationTargetDeclaration
+
bound revision-read capability
        |
        v
exact sealed DecisionContextRevision
        |
        v
DecisionContextObservationTargetRevisionBinding
        |
        v
STOP
```

There is no automatic edge from declaration to binding. Binding occurs only through an explicit bound reader operation.

## Reader operation

The narrow capability is:

```ts
interface DecisionContextObservationTargetRevisionReader {
  getRevisionById(
    revisionId: string
  ): Promise<DecisionContextRevision | null>;
}
```

The bound operation is:

```ts
interface BoundDecisionContextObservationTargetRevisionBinder {
  bind(
    declaration: DecisionContextObservationTargetDeclaration
  ): Promise<DecisionContextObservationTargetRevisionBinding>;
}
```

The implementation validates and captures the complete sealed declaration before the read, captures `targetRevisionId` before the await boundary, and performs exactly one `getRevisionById(targetRevisionId)`. `null` is `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_REVISION_NOT_FOUND`. The complete returned revision is captured and asserted; an unequal `revisionId` or malformed returned state is `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_REVISION_INVALID`. Underlying reader rejection propagates unchanged.

The reader method is captured at binder construction. Phase 6B is only a narrow architectural precedent for reader-backed exact-reference binding; Phase 8D4B does not reuse assessment ontology. It does not traverse `previousRevisionId`, reconstruct lineage, invoke a persister, create a Context draft, or create a revision.

## Exact artifact and identity

`DecisionContextObservationTargetRevisionBinding` has schema `DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_V1`, kind `DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING`, and ID prefix `DCOTRB_`. It has exactly five fields:

```text
artifactKind
schemaVersion
decisionContextObservationTargetRevisionBindingId
decisionContextObservationTargetDeclaration
revision
```

No context membership, materialized item, future revision, current/head field, repository authority, persistence flag, timestamp, or source-state admission field exists.

Identity commits to:

```text
[
  schema,
  canonical complete DecisionContextObservationTargetDeclaration,
  canonical complete DecisionContextRevision
]
```

It uses SHA-256, the first 24 uppercase hexadecimal characters, and `DCOTRB_`. Object insertion order is non-semantic. `COMPLETE REVISION STATE != DREV STRING ALONE`. A revision ID string alone is not treated as proof that every represented revision field is identical, so binding identity commits to the complete captured representation. This is not truth proof.

The binding retains complete detached declaration and complete detached revision state. It is self-contained after creation. Stored assertion performs no read, repairs nothing, and treats malformed body invalidity before binding-ID mismatch.

## Authority boundary

READER RETURN != PERSISTENCE PROOF

REVISION BINDING != PERSISTENCE AUTHORITY

REVISION BINDING != AUTHORITY OF RECORD

REVISION BINDING != CURRENT REVISION

REVISION BINDING != HEAD REVISION

REVISION BINDING != LATEST REVISION

REVISION BINDING != ACTIVE REVISION

REVISION BINDING != REVISION SELECTION

REVISION BINDING != MUTATION DESTINATION

REVISION BINDING != FUTURE REVISION

The reader establishes reader-backed exact state binding only. It does not prove repository persistence or currentness.

## Return-path boundary

TARGET REVISION BOUND != OBSERVATION MATERIALIZED

REVISION BINDING != MATERIALIZATION

REVISION BINDING != MATERIALIZATION READINESS

REVISION BINDING != DECISION CONTEXT ITEM

REVISION BINDING != ITEM MEMBERSHIP

REVISION BINDING != CONTEXT MEMBERSHIP

REVISION BINDING != CONTEXT MUTATION

REVISION BINDING != REVISION MUTATION

REVISION BINDING != REVISION CREATION

REVISION BINDING != REVISION TRANSITION

REVISION BINDING != LOOP CLOSED

The bound revision remains base state. It is not a mutation destination.

## Source-state reference boundary

AUTHORITATIVE REFERENCE CARRIED BY DCOIP
!= REFERENCE PRESENT IN BOUND REVISION CONTEXT

REVISION BINDING
!= SOURCE STATE REFERENCE ADMISSION

REVISION BINDING
!= SOURCE STATE INVENTORY MEMBERSHIP

BOUND REVISION
!= MATERIALIZATION READINESS

`AUTHORITATIVE_STATE` provenance carried by the projected observation does not require the corresponding reference to appear in the bound revision's `sourceStateReferences`. Phase 8D4B does not inspect that inventory for the projected reference or require that reference's presence. Generic `DecisionContextRevision` structural validation still validates the returned revision representation. The binding does not imply readiness for later materialization.

## Truth and support boundary

REVISION BINDING != OBSERVATION TRUTH

REVISION BINDING != OBSERVED REALITY

REVISION BINDING != OUTCOME TRUTH

REVISION BINDING != SEMANTIC SUPPORT

REVISION BINDING != CAUSATION

REVISION BINDING != HUMAN DECISION

PERSISTED != TRUE

## Representation safety and error surface

Boundary capture is descriptor-safe. Accessors are rejected without getter execution. Symbols, hidden properties, and extra properties are rejected where applicable. The declaration is detached before await; the returned revision is detached; returned binding data is detached. No deep freeze is claimed.

The exact error surface is:

```text
ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_READER_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_DECLARATION_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_REVISION_NOT_FOUND
ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_REVISION_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_TARGET_REVISION_BINDING_ID_MISMATCH
```

## Implementation evidence

- Implementation commit: `6a2a92f62e39ff853b9c6925a76ee35c917e92c0`.
- Implementation tag: `v1.0.0-decision-core-phase8d4b-target-revision-binding`.
- Focused 8D4B: 9 / 9 passed.
- Decision Core: 30 files / 346 tests passed.
- Capability + authority-adapter: 32 files / 295 tests passed.
- Phase Gate: MECHANICAL VERIFICATION PASS.
- Implementation seal: MECHANICAL SEALING PASS.

This is scoped implementation evidence only. It does not claim repository-wide semantic correctness, zero defects, or repository-wide TypeScript cleanliness.

DecisionContextObservationTargetRevisionBinding -> STOP
