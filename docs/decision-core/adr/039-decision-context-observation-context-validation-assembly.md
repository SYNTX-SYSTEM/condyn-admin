# ADR 039: Decision Context Observation Context Validation Assembly

## Status

Accepted for Phase 8D8 documentation.

## Decision

Phase 8D8 defines `DecisionContextObservationContextValidationAssembly` as a narrow deterministic derivational-coherence boundary. Its canonical meaning is:

> A deterministic derivational-coherence operation assembles one explicit DecisionContextValidationAssemblyInput against the exact new DecisionContextDraft represented by one sealed DecisionContextObservationContextTransition, retaining both the explicit input and the resulting assembly without establishing validation completeness, truth, authority, or revision state.

The topology is deliberately bounded:

```text
DecisionContextObservationContextTransition
+
explicit DecisionContextValidationAssemblyInput
        |
        v
assembleDecisionContextValidation
against exactly transition.context
        |
        v
DecisionContextObservationContextValidationAssembly
        |
        v
STOP
```

Phase 8D8 establishes explicit new-Context validation input plus derivationally coherent validation assembly only.

## Terminology and Context-status boundary

Phase 8D8 does not describe, produce, or represent a Context validation success, validation completeness, validation readiness, or truth state. The embedded `DecisionContextDraft` remains:

```text
validationStatus: NOT_RUN
```

before and after Phase 8D8. Phase 8D8 does not mutate that field.

VALIDATION ASSEMBLY EXISTENCE != CONTEXT VALIDATION STATUS

ASSEMBLY SUCCESS != VALIDATION_STATUS CHANGE

ASSEMBLY SUCCESS != VALIDATED CONTEXT

## Why explicit new-Context input is required

Phase 8D7 changed the represented Context semantics by adding an `OBSERVATION` item. The bound base revision's `validationInput` and `validationAssembly` were assembled relative to the base Context; they do not automatically apply to the new Context.

BASE REVISION VALIDATION != NEW CONTEXT VALIDATION

BASE VALIDATION INPUT != AUTOMATIC NEW VALIDATION INPUT

BASE VALIDATION ASSEMBLY != NEW CONTEXT VALIDATION ASSEMBLY

VALIDATION INPUT REUSE != VALIDATION STATE CARRY-FORWARD

OLD DERIVATION != NEW CONTEXT DERIVATION

Phase 8D8 accepts exactly one sealed `DecisionContextObservationContextTransition` and one explicit `DecisionContextValidationAssemblyInput`. The caller supplies input explicitly. It is never implicitly copied through transition, materialization, readiness, binding, revision, and base `validationInput`.

VALIDATION INPUT != VALIDATION COMPLETENESS

VALIDATION INPUT != TRUTH

VALIDATION INPUT != AUTHORITY

VALIDATION INPUT != HUMAN DECISION

VALIDATION INPUT != REVISION

VALIDATION INPUT != PERSISTENCE

The existing Validation Assembly contract may accept empty input. Therefore:

EMPTY VALIDATION INPUT != COMPLETE VALIDATION

NONEMPTY VALIDATION INPUT != COMPLETE VALIDATION

ASSEMBLY SUCCESS != COMPLETE VALIDATION

No omitted expectation, derivation, gap, consequence, evidence binding, or relation is synthesized by Phase 8D8.

## Assembly operation and no validation teleportation

Phase 8D8 uses the existing operation:

```text
assembleDecisionContextValidation(
  transition.context,
  captured explicit validationInput
)
```

The existing contract owns Structural Expectation reconstruction, Structural Gap reconstruction, Structural Consequence reconstruction, validation-assembly identity, and canonicalization. Phase 8D8 duplicates none of these algorithms. Existing precise Validation Assembly and structural-derivation errors may propagate unchanged from creation.

The permanent behavioral proof is intentional: a validation input coherent for the base Context may become incoherent after the `OBSERVATION` membership transition. When that old input is explicitly submitted to Phase 8D8, it is reconstructed against the new Context and may fail through the existing precise derivation contract. Phase 8D8 does not rewrite the old derivation to make it pass.

This demonstrates:

VALIDATION INPUT REUSE != VALIDATION STATE CARRY-FORWARD

OLD DERIVATION != NEW CONTEXT DERIVATION

## Validation-assembly and authority boundaries

VALIDATION ASSEMBLY != TRUTH

VALIDATION ASSEMBLY != COMPLETENESS

VALIDATION ASSEMBLY != CURRENT AUTHORITY

VALIDATION ASSEMBLY != SEMANTIC VERIFICATION

VALIDATION ASSEMBLY != DECISION READINESS

VALIDATION ASSEMBLY != AUTHORITY VALIDATION

VALIDATION ASSEMBLY != SOURCE AUTHORITY

Phase 8D8 does not invoke `createBoundDecisionContextAuthorityValidator` or any `BoundAuthoritativeStateReader`. It creates no reusable authority token, certificate, proof, or durable authority claim.

AUTHORITY RESOLUTION SUCCESS != REUSABLE AUTHORITY ARTIFACT

SOURCE REFERENCE MEMBERSHIP != CURRENT AUTHORITY

No source payload is fetched, source freshness is not established, and no external authority is authenticated.

## Exact artifact and identity

`DecisionContextObservationContextValidationAssembly` has schema `DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_V1`, kind `DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY`, and ID prefix `DCOCVA_`. It has exactly six fields:

```text
artifactKind
schemaVersion
decisionContextObservationContextValidationAssemblyId
decisionContextObservationContextTransition
validationInput
validationAssembly
```

No `validatedContext`, `validationComplete`, `validationPassed`, `isValid`, revision, `revisionId`, `previousRevisionId`, future revision, persistence, authority proof, truth, confidence, score, or timestamp field exists.

The artifact retains completely the sealed Phase 8D7 transition, the explicit validation input, and the resulting validation assembly. It does not retain only a DCOCT ID, Context ID, expectation IDs, or assembly ID.

Identity commits to:

```text
[
  "DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_V1",
  canonical complete DecisionContextObservationContextTransition,
  canonical complete DecisionContextValidationAssemblyInput,
  canonical complete DecisionContextValidationAssembly
]
```

It uses SHA-256, the first 24 uppercase hexadecimal characters, and `DCOCVA_`. Object insertion order does not affect identity. DCOCT, Context, and assembly ID strings alone do not prove all represented state. Identity is not truth, authority, completeness, or persistence proof.

## Stored assertion and representation safety

`assertDecisionContextObservationContextValidationAssembly` is self-contained. It performs no reader call, authority resolution, repository read, Context construction, revision construction, or persistence operation.

It safely captures the complete transition, stored validation input, and stored validation assembly, then reasserts coherence through:

```text
assertDecisionContextValidationAssembly(
  transition.context,
  stored validationInput,
  stored validationAssembly
)
```

It does not merely trust `assemblyId`. Body invalidity precedes outer DCOCVA ID mismatch. Stored assertion repairs nothing.

Boundary capture is descriptor-safe. Transition and validation input are captured before assembly. Accessors are rejected without getter execution. Symbols, hidden properties, and extra properties are rejected where applicable. Hostile nested derivation state is rejected. Results are detached from caller state, complete predecessor/input/assembly state is retained, and no deep freeze is claimed.

## No revision or persistence

VALIDATION ASSEMBLY != REVISION

VALIDATION ASSEMBLY != REVISION CREATION

VALIDATION ASSEMBLY != REVISION TRANSITION

NEW CONTEXT VALIDATION ASSEMBLY != NEW REVISION

Phase 8D8 creates no DREV, `revisionId`, `previousRevisionId`, or revision lineage. It does not invoke `createDecisionContextRevision`.

VALIDATION ASSEMBLY != PERSISTENCE

VALIDATION ASSEMBLY != PERSISTENCE AUTHORITY

Phase 8D8 performs no repository write and no revision persistence.

PERSISTED != TRUE

## Loop boundary

VALIDATION ASSEMBLY != LOOP CLOSED

Phase 8D8 advances the return path because explicit structural derivations are reconstructed against the changed Context. A new `DecisionContextRevision`, revision transition, new revision persistence, and new persisted authority of record remain absent. The assembly itself establishes neither completeness nor truth, so the loop remains open.

## Error surface

The exact Phase 8D8-owned error surface is:

```text
ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_INPUT_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_TRANSITION_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_VALIDATION_ASSEMBLY_ID_MISMATCH
```

Existing precise Validation Assembly and structural-derivation errors may propagate from creation. No additional Phase 8D8-owned errors exist.

## Current return path

- 8D1: candidate representation.
- 8D2: explicit positive human admission.
- 8D3: deterministic OBSERVATION item-semantic projection.
- 8D4A: explicit human DREV-shaped base-target declaration.
- 8D4B: exact reader-backed base revision binding.
- 8D5: structural materialization readiness.
- 8D6: standalone `DecisionContextItem` materialization.
- 8D7: deterministic Context transition with actual Context membership.
- 8D8: explicit new-Context validation input plus deterministic derivational-coherence assembly against exactly that new Context.

New `DecisionContextRevision` creation, revision transition, revision persistence, persisted authority of the future revision, and loop closure remain outside the return path. Full Phase 8 remains incomplete.

## Implementation evidence

- Implementation commit: `99481c8c12e4e89dd75b20f67440ce71171fbd0f`.
- Implementation tag: `v1.0.0-decision-core-phase8d8-context-validation-assembly`.
- Focused 8D8: 6 / 6 passed.
- Decision Core: 34 files / 373 tests passed.
- Capability + authority-adapter: 32 files / 295 tests passed.
- Phase Gate: MECHANICAL VERIFICATION PASS.
- Implementation seal: MECHANICAL SEALING PASS.

This is scoped implementation evidence only. It does not claim repository-wide semantic correctness, zero defects, or repository-wide TypeScript cleanliness.

DecisionContextObservationContextValidationAssembly -> STOP
