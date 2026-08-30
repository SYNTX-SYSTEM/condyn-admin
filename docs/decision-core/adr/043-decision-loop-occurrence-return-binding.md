# ADR 043: Decision Loop Occurrence Return Binding

## Status

Accepted. Phase 8E2 is the final structural Phase-8 operation for the current architecture.

## Context

The architecture has two independently sealed paths.

```text
DECISION-SIDE BRIDGE
HumanDecisionDeclaration
-> DecisionActionIntent
-> HumanCommitment
-> HumanCommitmentActionOccurrenceAssociationProposal
-> complete ActionOccurrenceClaim

GOVERNED PERSISTED RETURN PATH
ActionOccurrenceClaim
-> ActionStateChangeAssociationProposal
-> OutcomeAttributionProposal
-> DecisionContextObservationProposal
-> DecisionContextObservationAdmissionDeclaration
-> DecisionContextObservationItemProjection
-> DecisionContextObservationTargetDeclaration
-> DecisionContextObservationTargetRevisionBinding
-> DecisionContextObservationMaterializationReadiness
-> DecisionContextObservationItemMaterialization
-> DecisionContextObservationContextTransition
-> DecisionContextObservationContextValidationAssembly
-> DecisionContextObservationRevisionCreation
-> DecisionContextObservationRevisionPersistence
```

ADR 042 introduced the optional explicit bridge between `HumanCommitment` and an independently valid `ActionOccurrenceClaim`. It deliberately did not inspect the persisted return path. A bridge proposal therefore could not establish that it represented the same complete ActionOccurrenceClaim as a particular sealed persisted return path.

## Decision

Introduce `DecisionLoopOccurrenceReturnBinding`.

- Schema: `DECISION_LOOP_OCCURRENCE_RETURN_BINDING_V1`
- Artifact kind: `DECISION_LOOP_OCCURRENCE_RETURN_BINDING`
- ID prefix: `DLORB_`

Its canonical meaning is:

> A deterministic cross-lineage binding establishes that the complete ActionOccurrenceClaim represented by one sealed HumanCommitmentActionOccurrenceAssociationProposal is exactly equal to the complete ActionOccurrenceClaim retained in one sealed DecisionContextObservationRevisionPersistence return-path lineage, thereby establishing represented structural continuity between the decision-side bridge and the governed persisted return path without establishing execution truth, relation truth, causation, fresh repository authority, or current-state selection.

The artifact contains exactly five fields:

1. `artifactKind`
2. `schemaVersion`
3. `decisionLoopOccurrenceReturnBindingId`
4. `humanCommitmentActionOccurrenceAssociationProposal`
5. `decisionContextObservationRevisionPersistence`

It retains both complete sealed lineages. It has no duplicate `ActionOccurrenceClaim` field and no `loopClosed`, closure-status, success, execution-status, fulfillment, causation, feedback, learning, truth, authority certificate, current/head/latest, or timestamp field. The valid binding artifact itself represents structural closure; no separate closure boolean or certificate exists.

The bridge claim is exactly the retained bridge's `actionOccurrenceClaim`. The return claim is exactly the retained persisted lineage's nested `ActionOccurrenceClaim`:

```text
DecisionContextObservationRevisionPersistence
-> DecisionContextObservationRevisionCreation
-> DecisionContextObservationContextValidationAssembly
-> DecisionContextObservationContextTransition
-> DecisionContextObservationItemMaterialization
-> DecisionContextObservationMaterializationReadiness
-> DecisionContextObservationTargetRevisionBinding
-> DecisionContextObservationTargetDeclaration
-> DecisionContextObservationItemProjection
-> DecisionContextObservationAdmissionDeclaration
-> DecisionContextObservationProposal
-> OutcomeAttributionProposal
-> ActionStateChangeAssociationProposal
-> ActionOccurrenceClaim
```

No independent ActionOccurrenceClaim, claim ID, HumanCommitment, revision, repository, reader, persister, authority, current/head/latest selection, or shortcut reference is accepted.

The two retained claims must be completely represented equal, including `artifactKind`, `schemaVersion`, `actionOccurrenceClaimId`, `source`, and `operationDescription`. Object property insertion order is non-semantic; sealed order-bearing arrays preserve their existing semantics. No operation-description similarity, operation-description equality as independent authority, actor equality, source equality as independent authority, temporal matching, ID search, repository search, shared observation text, model inference, or provider evaluation is used.

ACTION OCCURRENCE CLAIM ID EQUALITY != COMPLETE RETURN-PATH MATCH

VALID BRIDGE
+
VALID RETURN PATH
!=
STRUCTURAL LOOP CLOSURE

unless the complete ActionOccurrenceClaims match.

When the claims differ, creation fails with `ERR_DECISION_LOOP_OCCURRENCE_RETURN_BINDING_OCCURRENCE_MISMATCH` and no binding artifact is created.

`DLORB_` identity is SHA-256, first 24 uppercase hexadecimal characters, with deterministic recursive object-key ordering over:

```text
[
  "DECISION_LOOP_OCCURRENCE_RETURN_BINDING_V1",
  canonical complete HumanCommitmentActionOccurrenceAssociationProposal,
  canonical complete DecisionContextObservationRevisionPersistence
]
```

DLORB IDENTITY != EXECUTION PROOF

DLORB IDENTITY != RELATION TRUTH

DLORB IDENTITY != CAUSAL PROOF

DLORB IDENTITY != FRESH REPOSITORY PROOF

The stored assertion is self-contained. It asserts both complete parents, extracts and compares their complete embedded claims, verifies DLORB identity, and repairs nothing. It performs no repository read or write, persist operation, parent lookup, authority resolution, current/head/latest selection, model invocation, provider invocation, or external lineage reconstruction. Stored body invalidity, including complete cross-lineage mismatch, precedes outer DLORB identity mismatch.

## Structural Phase-8 closure

One valid `DecisionLoopOccurrenceReturnBinding` establishes REPRESENTED STRUCTURAL LOOP CLOSURE for exactly its two sealed lineages. It means one complete represented decision-side lineage and one complete represented persisted return-path lineage are structurally joined through the same complete ActionOccurrenceClaim.

STRUCTURAL LOOP CLOSURE != EXECUTION PROOF

STRUCTURAL LOOP CLOSURE != ACTION FACT

STRUCTURAL LOOP CLOSURE != COMMITMENT FULFILLMENT

STRUCTURAL LOOP CLOSURE != RELATION TRUTH

STRUCTURAL LOOP CLOSURE != CAUSATION

STRUCTURAL LOOP CLOSURE != OUTCOME TRUTH

STRUCTURAL LOOP CLOSURE != OBSERVATION TRUTH

STRUCTURAL LOOP CLOSURE != SEMANTIC CORRECTNESS

STRUCTURAL LOOP CLOSURE != DECISION SUCCESS

STRUCTURAL LOOP CLOSURE != FEEDBACK

STRUCTURAL LOOP CLOSURE != LEARNING

STRUCTURAL LOOP CLOSURE != CURRENT REPOSITORY PROOF

STRUCTURAL LOOP CLOSURE != CURRENT RECORD EXISTENCE PROOF

STRUCTURAL LOOP CLOSURE != CURRENT AUTHORITY PROOF

STRUCTURAL LOOP CLOSURE != CURRENT REVISION

STRUCTURAL LOOP CLOSURE != HEAD REVISION

STRUCTURAL LOOP CLOSURE != LATEST REVISION

STRUCTURAL CONTINUITY != CAUSAL CONTINUITY

LINEAGE != CAUSATION

The 8D10 predecessor retains its existing persistence semantics. Phase 8E2 introduces no new persistence authority.

LOOP BINDING != PERSISTENCE AUTHORITY

LOOP BINDING != AUTHORITY OF RECORD CREATION

LOOP BINDING != AUTHORITY OF REALITY

LOOP BINDING != CURRENT SOURCE AUTHORITY

LOOP BINDING != PUBLICATION AUTHORITY

PERSISTER INTERFACE CONFORMANCE != 5D2A GOVERNANCE GUARANTEE

8E2 STRUCTURAL BINDING != PERSISTER CONFORMANCE CERTIFICATE

STORED LOOP BINDING != FRESH REPOSITORY READ

STORED ASSERTION != CURRENT REPOSITORY PROOF

PERSISTED != TRUE

AUTHORITY OF RECORD != AUTHORITY OF REALITY

No separate Phase-8 loop-closure certificate is required. No Phase 8E3 is required for structural closure in the current architecture. `DecisionLoopOccurrenceReturnBinding` is the final structural Phase-8 operation.

## Permanent proof hardening

Semantic review found permanent-test proof gaps only. It found no production defect, and reviewed production remained byte-identical during the hardening cycle.

The permanent tests now prove that:

1. the end-to-end positive structural-closure path traverses the sealed governed revision-persistence machinery rather than a synthetic persistence test double;
2. two valid complete return paths using the same complete ActionOccurrenceClaim but differing in legitimate represented return-path state produce different DLORB identities; and
3. a valid 8E1 predecessor plus a valid 8D10 predecessor with different complete ActionOccurrenceClaims is stored-body invalid before a stale outer DLORB identity can be classified.

These tests do not make 8E2 a persister conformance certificate or a new persistence authority operation.

## Consequences

Phase 8 is STRUCTURALLY CLOSED for the current architecture once this implementation and documentation are sealed. The backend can represent one complete governed structural path from explicit human decision state through Action Intent, Human Commitment, explicit commitment/occurrence association, the exact same represented ActionOccurrenceClaim, state-change/outcome proposal lineage, observation return, Context membership, child revision creation, and governed persistence.

This closure does not claim repository-wide semantic correctness, zero defects, repository-wide TypeScript cleanliness, real-world execution, causal closure, outcome truth, Feedback, Learning, fresh repository liveness, authority of reality, or current-state selection.

## Implementation evidence

- Implementation: `221f2ee610552565c17e1c16b27b3d6103b8a404`
- Tag: `v1.0.0-decision-core-phase8e2-occurrence-return-binding`
- Focused 8E2: 8 / 8 passed.
- Decision Core: 38 files / 403 tests passed.
- Capability + authority-adapter: 32 files / 295 tests passed.
- Phase Gate: MECHANICAL VERIFICATION PASS.
- Implementation seal: MECHANICAL SEALING PASS.

DecisionLoopOccurrenceReturnBinding -> STRUCTURAL PHASE 8 CLOSURE
