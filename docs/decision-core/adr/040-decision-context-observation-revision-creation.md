# ADR 040: Decision Context Observation Revision Creation

## Status

Accepted for Phase 8D9 documentation.

## Decision

Phase 8D9 defines `DecisionContextObservationRevisionCreation` as a narrow deterministic revision-construction boundary. Its canonical meaning is:

> A deterministic revision-construction operation creates one new self-contained DecisionContextRevision from the exact transitioned Context, explicit validation input, and derivationally coherent validation assembly represented by one sealed DecisionContextObservationContextValidationAssembly, while naming the exact bound base revision as previousRevisionId and establishing no persistence or repository authority.

The topology is deliberately bounded:

```text
DecisionContextObservationContextValidationAssembly
        |
        v
createDecisionContextRevision
        |
        v
new DecisionContextRevision
        |
        v
DecisionContextObservationRevisionCreation
        |
        v
STOP
```

Phase 8D9 establishes one complete self-contained `DecisionContextRevision` artifact and one explicit predecessor reference to the exact retained bound base revision only.

## Exact construction and predecessor reference

Phase 8D9 accepts exactly one sealed `DecisionContextObservationContextValidationAssembly`. It accepts no independent `previousRevisionId`, Context, validation input, validation assembly, revision ID, base revision, repository, or persister input.

The exact base revision is obtained only through the complete retained predecessor lineage:

```text
Phase 8D8 artifact
-> Context transition
-> item materialization
-> materialization readiness
-> target revision binding
-> revision
```

No additional revision read occurs, and no revision lineage is traversed. The revision-construction call is exactly:

```text
createDecisionContextRevision({
  previousRevisionId: bound base revision.revisionId,
  context: Phase 8D8 transitioned Context,
  validationInput: Phase 8D8 explicit validation input,
  validationAssembly: Phase 8D8 deterministic validation assembly
})
```

The existing revision constructor owns canonical revision representation, validation-input canonicalization, validation reconstruction, DREV identity, and revision representation validation. Phase 8D9 does not implement a separate revision identity algorithm.

The child `previousRevisionId` equals exactly the retained bound base revision ID. It is a represented predecessor reference, not a repository operation or policy declaration.

PREVIOUS REVISION ID != PERSISTED PARENT PROOF

PREVIOUS REVISION ID != REPOSITORY PARENT EXISTENCE PROOF

PREVIOUS REVISION ID != CURRENT REVISION

PREVIOUS REVISION ID != HEAD REVISION

PREVIOUS REVISION ID != LATEST REVISION

PREVIOUS REVISION ID != ACTIVE REVISION

PREVIOUS REVISION ID != BRANCH SELECTION

PREVIOUS REVISION ID != CAUSATION

PREVIOUS REVISION ID != OVERWRITE

The exact base revision remains represented in retained lineage. That does not prove that the same parent presently exists in a repository.

## Context and validation continuity

The new revision represents exactly the Phase 8D7 transitioned Context retained by Phase 8D8 under the existing revision canonicalization contract. No item, source-state reference, Decision Question, or Context semantics are changed in Phase 8D9.

REVISION CREATION != CONTEXT MUTATION

The exact Phase 8D8 explicit validation input and validation assembly are passed to the existing revision constructor. Source array insertion order is not itself a Phase 8D9 assertion when the sealed revision contract canonically represents those values. The complete resulting revision must instead equal the deterministic output of the existing revision constructor for the exact represented Phase 8D8 state.

The embedded `DecisionContextDraft` remains:

```text
validationStatus: NOT_RUN
```

Creating a revision does not change that Context field. It must not be described as a validated Context, validation-complete Context, validation-passed Context, or decision-ready Context.

REVISION EXISTENCE != VALIDATED CONTEXT

REVISION CREATION != VALIDATION_STATUS CHANGE

VALIDATION ASSEMBLY EXISTENCE != CONTEXT VALIDATION STATUS

ASSEMBLY SUCCESS != VALIDATED CONTEXT

## Revision and complete-state identity

The new `revisionId` comes only from `createDecisionContextRevision`. The existing revision identity contract commits to `previousRevisionId`, `contextId`, and `validationAssembly.assemblyId` under `DECISION_CONTEXT_REVISION_V1`; Phase 8D9 does not duplicate that algorithm.

DREV ID != COMPLETE REVISION STATE

REVISION IDENTITY != COMPLETE ARTIFACT EQUALITY

A valid DREV string alone is not proof of every embedded revision field. The Phase 8D9 wrapper therefore retains the complete new revision and commits to complete represented state in its own identity.

For this return-path transition, the new revision ID differs from the bound base revision ID because the Context identity changed in Phase 8D7. That inequality establishes only distinct Context representation under the existing revision identity contract. It does not establish persistence, currentness, branch selection, or causation. It must not be generalized into a rule that every new `DecisionContextRevision` in the system requires semantic change.

## Exact artifact and DCORC identity

`DecisionContextObservationRevisionCreation` has schema `DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_V1`, kind `DECISION_CONTEXT_OBSERVATION_REVISION_CREATION`, and ID prefix `DCORC_`. It has exactly five fields:

```text
artifactKind
schemaVersion
decisionContextObservationRevisionCreationId
decisionContextObservationContextValidationAssembly
revision
```

The embedded `revision` is one complete `DecisionContextRevision`. No repository, persister, persisted state, authority-of-record, current/head/latest/active state, branch, selected state, truth, validated Context, validation-complete state, or timestamp field exists.

The artifact retains completely both the sealed Phase 8D8 predecessor and the complete new revision. It does not retain only DCOCVA, Context, assembly, base DREV, revision, or previous-revision ID strings.

DCORC identity commits to:

```text
[
  "DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_V1",
  canonical complete DecisionContextObservationContextValidationAssembly,
  canonical complete DecisionContextRevision
]
```

It uses SHA-256, the first 24 uppercase hexadecimal characters, and `DCORC_`. Object insertion order does not affect identity. This complete-state commitment is intentional because:

DREV ID != COMPLETE REVISION STATE

Identity is not truth, authority, completeness, persistence, or parent-existence proof.

## Stored assertion and representation safety

`assertDecisionContextObservationRevisionCreation` is self-contained. It performs no reader call, parent lookup, repository read, repository write, persistence operation, authority resolution, or lineage traversal.

It descriptor-safely captures and asserts the complete Phase 8D8 predecessor, captures and asserts the stored `DecisionContextRevision`, derives the exact bound base revision through retained predecessor lineage, and reconstructs the expected child through the existing `createDecisionContextRevision` contract. It then requires complete represented equality between stored and expected child revision and verifies complete-state DCORC identity.

It does not merely trust `revisionId` or `previousRevisionId`. It rejects complete revision divergence in `revisionId`, `previousRevisionId`, Context, validation input, validation assembly, artifact kind, or schema version, including a represented payload divergence that a DREV string alone may not distinguish.

Body invalidity precedes outer DCORC ID mismatch. Stored assertion repairs nothing.

Boundary capture is descriptor-safe. The complete Phase 8D8 predecessor is captured before revision construction. Accessors are rejected without getter execution. Symbols, hidden fields, and extra fields are rejected where applicable. Hostile nested predecessor, Context, validation input, validation assembly, stored revision, and nested revision state are rejected. The result is detached from caller state. No deep freeze is claimed.

## No persistence, parent lookup, or branch authority

Phase 8D9 invokes no revision repository or persister. It performs no repository parent lookup and does not invoke revision-lineage reconstruction.

REVISION CREATION != PERSISTENCE

REVISION EXISTENCE != PERSISTED REVISION

NEW REVISION != PERSISTED REVISION

REVISION CREATION != PERSISTENCE AUTHORITY

REVISION CREATION != AUTHORITY OF RECORD

DREV ID != PERSISTENCE PROOF

DREV ID != AUTHORITY OF RECORD

BOUND BASE REVISION != PERSISTED PARENT RECORD

PREVIOUS REVISION ID != PERSISTED PARENT PROOF

REVISION CREATION != REPOSITORY LINEAGE VALIDATION

PREDECESSOR REFERENCE != BRANCH SELECTION POLICY

LINEAGE INTEGRITY != BRANCH SELECTION POLICY

NEW REVISION != CURRENT REVISION

NEW REVISION != HEAD REVISION

NEW REVISION != LATEST REVISION

NEW REVISION != ACTIVE REVISION

NEW REVISION != SELECTED REVISION

NEW REVISION != REQUIRED SEMANTIC CHANGE

LINEAGE != CAUSATION

The return path contains a semantic Context change, but Phase 8D9 does not generalize that fact into a global semantic-change rule for revisions.

## Immutability, truth, and loop boundaries

The base revision is retained and unchanged. The new revision is a distinct artifact.

NEW REVISION != MUTATION

REVISION CREATION != BASE REVISION OVERWRITE

BASE REVISION != MUTATION DESTINATION

Revision creation does not upgrade the epistemic status of the represented OBSERVATION.

REVISION EXISTENCE != TRUTH

REVISION EXISTENCE != SEMANTIC CORRECTNESS

REVISION EXISTENCE != VALIDATION COMPLETENESS

REVISION EXISTENCE != DECISION READINESS

REVISION EXISTENCE != HUMAN DECISION

REVISION EXISTENCE != CAUSATION

PERSISTED != TRUE

Phase 8D9 is a major return-path milestone because the returned OBSERVATION is now represented inside one complete new child `DecisionContextRevision` artifact. It has not been persisted, no repository-backed record authority has been established, and no persisted child revision identity has been bound back through a repository boundary.

REVISION CREATION != LOOP CLOSED

## Error surface

The exact Phase 8D9-owned error surface is:

```text
ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_INPUT_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_VALIDATION_ASSEMBLY_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_REVISION_CREATION_ID_MISMATCH
```

Existing precise revision or validation errors may propagate from creation only for impossible predecessor-contract violations. No additional Phase 8D9-owned errors exist.

## Current return path

- 8D1: candidate representation.
- 8D2: explicit positive human admission.
- 8D3: deterministic OBSERVATION item-semantic projection.
- 8D4A: explicit human DREV-shaped base target declaration.
- 8D4B: exact reader-backed base revision binding.
- 8D5: structural materialization readiness.
- 8D6: standalone `DecisionContextItem` materialization.
- 8D7: deterministic Context transition with actual Context membership.
- 8D8: explicit new-Context validation input plus derivational-coherence assembly.
- 8D9: deterministic creation of one complete new child `DecisionContextRevision` referencing the exact bound base revision.

New revision persistence, repository-backed record authority for the new revision, repository-level confirmation of the persisted child artifact, and loop closure remain outside the return path. Full Phase 8 remains incomplete.

## Implementation evidence

- Implementation commit: `065b8850acc0f0e2d1225c2d637703cb5c196750`.
- Implementation tag: `v1.0.0-decision-core-phase8d9-revision-creation`.
- Focused 8D9: 6 / 6 passed.
- Decision Core: 35 files / 379 tests passed.
- Capability + authority-adapter: 32 files / 295 tests passed.
- Phase Gate: MECHANICAL VERIFICATION PASS.
- Implementation seal: MECHANICAL SEALING PASS.

This is scoped implementation evidence only. It does not claim repository-wide semantic correctness, zero defects, or repository-wide TypeScript cleanliness.

DecisionContextObservationRevisionCreation -> STOP
