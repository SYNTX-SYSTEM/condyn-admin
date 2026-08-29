# ADR 038: Decision Context Observation Context Transition

## Status

Accepted for Phase 8D7 documentation.

## Decision

Phase 8D7 defines `DecisionContextObservationContextTransition` as a narrow deterministic Context-transition boundary. Its canonical meaning is:

> A deterministic Context-transition operation constructs one new DecisionContextDraft from the exact bound base Context plus the exact standalone OBSERVATION item represented by one sealed DecisionContextObservationItemMaterialization.

The topology is deliberately bounded:

```text
DecisionContextObservationItemMaterialization
        |
        v
deterministic Context transition
        |
        v
new DecisionContextDraft
        |
        v
DecisionContextObservationContextTransition
        |
        v
STOP
```

Phase 8D7 establishes one new complete `DecisionContextDraft` whose semantic content is the bound base Context plus exactly one materialized `OBSERVATION` item. This establishes actual Context membership of the returned observation inside that new ContextDraft. It does not establish revision membership.

## Membership requires Context representation

ITEM EXISTENCE != CONTEXT MEMBERSHIP

MATERIALIZATION != CONTEXT MEMBERSHIP

CONTEXT MEMBERSHIP REQUIRES CONTEXT REPRESENTATION

The Phase 8D6 item existed standalone. Phase 8D7 does not create a separate abstract membership declaration detached from Context state. It establishes membership only because one complete new `DecisionContextDraft` contains that item.

The input is exactly one sealed `DecisionContextObservationItemMaterialization`. There is no independent base revision, base Context, item, source-reference inventory, items array, or target ID input. Base Context state is obtained only through retained predecessor lineage:

```text
materialization
-> readiness
-> target revision binding
-> revision.context
```

## Exact Context delta and construction

CONTEXT TRANSITION DELTA = EXACTLY ONE ITEM MEMBERSHIP

The new Context differs semantically from the bound base Context only by membership of exactly one additional item: the complete Phase 8D6 materialized `OBSERVATION`. It retains every base item completely, retains every base `sourceStateReference` completely, contains no unrelated new item, removes no base item, modifies no base item, adds no source reference, and removes no source reference.

Phase 8D7 uses the existing `createDecisionContextDraft`. The Context constructor owns canonical item ordering, item identity reconstruction, and Context identity. For every base item and the materialized item, Phase 8D7 supplies only role, statement, and provenance. Existing base item IDs are not passed as construction authority, and Phase 8D7 implements no second Context or item identity algorithm.

The resulting Context must contain exactly one item whose ID and complete role, statement, and provenance equal the materialized item. Its item-ID set is:

```text
base item-ID set
UNION
materialized item ID
```

Its item count is base count plus one. Semantic comparison is by canonical item identity and complete item state, not source-array position.

## Decision Question and Context identity

The additional item role is `OBSERVATION`, so the unique result `decisionQuestionId` remains exactly the base Context `decisionQuestionId`.

OBSERVATION MEMBERSHIP != DECISION QUESTION REPLACEMENT

The existing Context constructor derives the result `contextId`. Because the represented item set changes, the result Context ID differs from the base Context ID.

BASE CONTEXT != RESULT CONTEXT

CONTEXT ID CHANGE != REVISION CREATION

CONTEXT ID CHANGE != PERSISTENCE

CONTEXT ID CHANGE != HISTORY AUTHORITY

CONTEXT ID CHANGE != CURRENTNESS

This distinct ID establishes only a distinct Context representation under the existing Context contract.

## Source-state references

Phase 8D7 carries the bound base Context `sourceStateReferences` forward exactly and adds no source reference. For `AUTHORITATIVE_STATE` projected provenance, Phase 8D5 readiness had already established exact inventory presence.

CONTEXT TRANSITION != SOURCE REFERENCE ADMISSION

CONTEXT TRANSITION != SOURCE AUTHORITY RESOLUTION

CONTEXT TRANSITION != SOURCE AUTHENTICATION

SOURCE INVENTORY CARRIED FORWARD != EXTERNAL AUTHORITY

Phase 8D7 does not resolve a reference, read external authority, fetch a payload, authenticate source identity, validate freshness, establish truth, establish semantic support, or establish causation.

## Validation boundary

The newly constructed `DecisionContextDraft` has:

```text
validationStatus: NOT_RUN
```

BASE REVISION VALIDATION != NEW CONTEXT VALIDATION

BASE VALIDATION ASSEMBLY != NEW CONTEXT VALIDATION ASSEMBLY

CONTEXT MEMBERSHIP != VALIDATED REVISION STATE

NEW CONTEXT != VALIDATED REVISION

Phase 8D7 does not carry forward `validationInput` or `validationAssembly`, and it does not invoke validation assembly. The semantic Context has changed; validation does not teleport from the predecessor revision.

## No revision transition or persistence

CONTEXT MEMBERSHIP != REVISION MEMBERSHIP

CONTEXT TRANSITION != REVISION TRANSITION

CONTEXT TRANSITION != REVISION CREATION

NEW CONTEXT != NEW REVISION

BOUND REVISION != MUTATION DESTINATION

BASE REVISION != FUTURE REVISION

The transition creates no `DecisionContextRevision`, no `revisionId`, no `previousRevisionId`, no validation input, no validation assembly, and no current/head/latest revision state. It does not traverse revision lineage or select a revision.

CONTEXT TRANSITION != PERSISTENCE

CONTEXT TRANSITION != PERSISTENCE AUTHORITY

Phase 8D7 invokes no revision persister or repository writer. The new ContextDraft is not persisted merely because it exists.

PERSISTED != TRUE

## Exact artifact and identity

`DecisionContextObservationContextTransition` has schema `DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_V1`, kind `DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION`, and ID prefix `DCOCT_`. It has exactly five fields:

```text
artifactKind
schemaVersion
decisionContextObservationContextTransitionId
decisionContextObservationItemMaterialization
context
```

The embedded `context` is one complete new `DecisionContextDraft`. No revision, future revision, `revisionId`, `previousRevisionId`, validation input, validation assembly, repository, persistence, current/head/latest state, authority, truth, or timestamp field exists.

The complete sealed `DecisionContextObservationItemMaterialization` is retained, not reduced to DCOIM, DCOMR, DCOTRB, DREV, or DCI IDs. The complete prior return-path lineage remains represented and the transition is self-contained after creation.

Identity commits to:

```text
[
  "DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_V1",
  canonical complete DecisionContextObservationItemMaterialization,
  canonical complete DecisionContextDraft
]
```

It uses SHA-256, the first 24 uppercase hexadecimal characters, and `DCOCT_`. Object insertion order does not affect identity. The DCOIM string alone is not proof that all represented predecessor state is identical. This identity commitment is neither truth proof nor persistence proof.

## Stored assertion and representation safety

`assertDecisionContextObservationContextTransition` is self-contained. It performs no reader call, repository read, authority resolution, revision construction, validation assembly, or persistence operation.

It verifies exact five-field representation, complete sealed materialization, complete valid `DecisionContextDraft`, exact source-reference carry-forward, exact complete base-item preservation, exactly one additional item equal to the complete materialized item, unchanged `decisionQuestionId`, distinct result/base `contextId`, `NOT_RUN` validation status through normal Context assertion, and deterministic complete-state DCOCT identity.

It verifies the complete delta rather than merely finding the materialized item somewhere in the result Context. Body invalidity precedes outer DCOCT ID mismatch. Stored assertion repairs nothing.

Boundary capture is descriptor-safe. Accessors are rejected without getter execution. Hidden, symbol, and extra properties are rejected where applicable. Hostile nested materialization, Context, items, provenance, and source-reference representations are rejected. Complete predecessor state is retained and results are detached from caller representation. No deep freeze is claimed.

## Truth, support, and loop boundary

NEW CONTEXT != OBSERVATION TRUTH

NEW CONTEXT != SEMANTIC SUPPORT

NEW CONTEXT != CAUSATION

CONTEXT MEMBERSHIP != HUMAN DECISION

Membership does not upgrade the epistemic status of the materialized observation.

MODEL_PROPOSAL != FACT

AUTHORITATIVE_STATE PROVENANCE != SOURCE TRUTH

HUMAN_INPUT PROVENANCE != VERIFIED FACT

Phase 8D7 is a major return-path milestone because the observation is now represented as a member of one new ContextDraft. It still does not close the loop:

CONTEXT MEMBERSHIP != LOOP CLOSED

The new Context has not been validated for a new revision, no new `DecisionContextRevision` exists, no new revision has been persisted, and no new persisted record authority has been established. The return path advances while the loop remains open.

## Error surface

The exact error surface is:

```text
ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_INPUT_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_MATERIALIZATION_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_ID_MISMATCH
```

## Current return path

- 8D1: candidate representation.
- 8D2: explicit positive human admission.
- 8D3: deterministic OBSERVATION item-semantic projection.
- 8D4A: explicit human DREV-shaped base target declaration.
- 8D4B: exact reader-backed base revision binding.
- 8D5: structural materialization readiness.
- 8D6: standalone `DecisionContextItem` materialization.
- 8D7: deterministic Context transition establishing actual Context membership in one new `DecisionContextDraft`.

Validation of the new Context, new `DecisionContextRevision` creation, revision transition, persistence of the new revision, persisted authority of the new revision, and loop closure remain outside the return path. Full Phase 8 remains incomplete.

## Implementation evidence

- Implementation commit: `305374e20695a1e4794902e603cd6e74ca82203e`.
- Implementation tag: `v1.0.0-decision-core-phase8d7-context-transition`.
- Focused 8D7: 5 / 5 passed.
- Decision Core: 33 files / 367 tests passed.
- Capability + authority-adapter: 32 files / 295 tests passed.
- Phase Gate: MECHANICAL VERIFICATION PASS.
- Implementation seal: MECHANICAL SEALING PASS.

This is scoped implementation evidence only. It does not claim repository-wide semantic correctness, zero defects, or repository-wide TypeScript cleanliness.

DecisionContextObservationContextTransition -> STOP
