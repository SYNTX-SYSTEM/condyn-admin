# ADR 041: Decision Context Observation Revision Persistence

## Status

Accepted for Phase 8D10 documentation.

## Decision

`DecisionContextObservationRevisionPersistence` is a bound return-path persistence representation. Its canonical meaning is:

> A bound return-path persistence operation submits the exact complete child DecisionContextRevision represented by one sealed DecisionContextObservationRevisionCreation to one supplied BoundDecisionContextRevisionPersister, accepts only an exact complete returned revision, and records that successful persistence result without extending the authority semantics of the underlying persister.

```text
DecisionContextObservationRevisionCreation
        |
        v
BoundDecisionContextRevisionPersister.persist(...)
        |
        + immediate-parent integrity
        + immutable write
        + exact post-write reread
        + complete-artifact equality
        |
        v
exact returned DecisionContextRevision
        |
        v
DecisionContextObservationRevisionPersistence
        |
        v
STOP
```

For a supplied persister that fulfills sealed Phase-5D2A, success establishes exactly operation-relative repository-selected authority of record for the exact complete revision during that operation.

PERSISTER INTERFACE CONFORMANCE != 5D2A GOVERNANCE GUARANTEE

PHASE 8D10 WRAPPER != PERSISTER CONFORMANCE CERTIFICATE

PHASE 8D10 ARTIFACT != REUSABLE AUTHORITY CERTIFICATE

## Existing persister and exact revision

8D10 does not add a writer, repository reread, parent lookup, or immutable-conflict algorithm. A conforming Phase-5D2A persistence operation already performs pristine capture, immediate-parent lookup and assertion, immutable write, exact post-write reread, complete-artifact equality, and detached exact reread return.

PERSISTENCE SUCCESS already includes EXACT POST-WRITE REREAD.

The bound dependency exposes only captured `persist`; replacement after binding does not redirect the operation. Input contains only sealed `decisionContextObservationRevisionCreation`. The only submitted revision is exactly its complete child revision. No revision ID, parent ID, Context, validation input, or validation assembly is reconstructed or changed.

PERSISTENCE != REVISION CREATION

PERSISTENCE != CONTEXT TRANSITION

## Parent, replay, and return boundaries

Conforming child persistence requires the exact immediate parent to exist and validate during the operation. Missing and malformed parents propagate the existing precise errors; no 8D10 artifact exists on failure.

PREVIOUS REVISION ID != PERSISTED PARENT PROOF

IMMEDIATE PARENT INTEGRITY != FULL LINEAGE INTEGRITY

IMMEDIATE PARENT INTEGRITY != ANCESTRY RECONSTRUCTION

IMMEDIATE PARENT INTEGRITY != CAUSATION

IMMEDIATE PARENT INTEGRITY != SEMANTIC CONTINUITY

PERSISTED PARENT EXISTENCE != CURRENT REVISION

PERSISTED PARENT EXISTENCE != HEAD REVISION

PERSISTED PARENT EXISTENCE != LATEST REVISION

Exact replay may succeed idempotently. Same DREV with divergent complete artifact fails immutable conflict.

IDEMPOTENT REPLAY != NEW REVISION

IDEMPOTENT REPLAY != NEW AUTHORITY KIND

IMMUTABLE CONFLICT != AUTOMATIC REPLACEMENT

DREV ID != COMPLETE REVISION STATE

The returned revision must be complete-data equal to the Phase 8D9 child revision; DREV equality alone is insufficient.

## Artifact, identity, and stored assertion

Schema is `DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_V1`, kind is `DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE`, and prefix is `DCORP_`. Exact fields are:

```text
artifactKind
schemaVersion
decisionContextObservationRevisionPersistenceId
decisionContextObservationRevisionCreation
persistedRevision
```

The artifact retains complete sealed predecessor and complete exact returned revision. It contains no repository, persister, writer, reader, parent, authority certificate/token, current/head/latest/active/selected state, branch, truth, semantic correctness, validation completeness, timestamp, or persisted-at field.

Identity commits to:

```text
[
  "DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_V1",
  canonical complete DecisionContextObservationRevisionCreation,
  canonical complete persisted DecisionContextRevision
]
```

It uses SHA-256, first 24 uppercase hex, and `DCORP_`; insertion order is non-semantic. It includes no repository identity, persister identity, time, or database metadata. DCORP is not a fresh repository query.

`assertDecisionContextObservationRevisionPersistence` is self-contained. It asserts complete predecessor and result, requires complete-data equality, checks DCORP identity, repairs nothing, and performs no persist, repository read/write, parent lookup, lineage traversal, authority resolution, or current/head/latest selection.

STORED PERSISTENCE ARTIFACT != FRESH REPOSITORY READ

STORED ASSERTION != REPOSITORY REREAD

STORED ASSERTION != CURRENT REPOSITORY PROOF

STORED ARTIFACT EXISTENCE != CURRENT RECORD EXISTENCE PROOF

STORED ARTIFACT EXISTENCE != CURRENT AUTHORITY PROOF

## Authority, durability, truth, and loop limits

AUTHORITY OF RECORD != AUTHORITY OF REALITY

AUTHORITY OF RECORD != TRUTH

AUTHORITY OF RECORD != SEMANTIC CORRECTNESS

AUTHORITY OF RECORD != VALIDATION COMPLETENESS

AUTHORITY OF RECORD != CURRENT PRODUCER AUTHORITY

AUTHORITY OF RECORD != CURRENT DECISION STATE

PERSISTED REVISION != CURRENT REVISION

PERSISTED REVISION != HEAD REVISION

PERSISTED REVISION != LATEST REVISION

PERSISTED REVISION != ACTIVE REVISION

PERSISTED REVISION != SELECTED REVISION

PERSISTENCE AUTHORITY != BRANCH SELECTION POLICY

PERSISTED != TRUE

PERSISTED REVISION != SEMANTICALLY CORRECT REVISION

PERSISTED REVISION != VALIDATION COMPLETENESS

PERSISTED REVISION != DECISION READINESS

PERSISTED REVISION != HUMAN DECISION

PERSISTED REVISION != CAUSATION

MODEL_PROPOSAL != FACT

AUTHORITATIVE_STATE PROVENANCE != SOURCE TRUTH

PERSISTENCE AUTHORITY != INFINITE DURABILITY

IN-MEMORY RECORD != PROCESS-RESTART SURVIVAL

DATABASE-BACKED SURVIVAL != INFINITE PERMANENCE

The permanent tests cover real missing and malformed parent behavior, same-DREV divergent repository-state immutable conflict, idempotent replay, exact reread, divergent returned state, in-flight caller mutation isolation, and stored assertion with zero live repository operations. A synthetic structural persister test is not repository-authority proof.

PERSISTENCE SUCCESS != LOOP CLOSED

AUTHORITY OF RECORD != LOOP-CLOSURE DECLARATION

The formal loop-closure condition remains outside Phase 8D10.

## Error surface

```text
ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_PERSISTER_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_INPUT_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_REVISION_CREATION_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_RESULT_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_INVALID
ERR_DECISION_CONTEXT_OBSERVATION_REVISION_PERSISTENCE_ID_MISMATCH
```

Existing precise persistence/repository errors propagate unchanged. No additional Phase 8D10-owned errors exist.

## Evidence

- Implementation commit: `7940f0a54fc5698a7a9c2a6f71646b6addb0d465`.
- Tag: `v1.0.0-decision-core-phase8d10-revision-persistence`.
- Focused: 9 / 9; Decision Core: 36 files / 388 tests; capability + authority-adapter: 32 files / 295 tests.
- Phase Gate: MECHANICAL VERIFICATION PASS; implementation seal: MECHANICAL SEALING PASS.
- Semantic review required one permanent-test hardening cycle; production remained byte-identical.

This is scoped evidence, not repository-wide semantic correctness, zero defects, or repository-wide TypeScript cleanliness.

DecisionContextObservationRevisionPersistence -> STOP
