# ADR 034: Decision Context Observation Target Declaration

## Status

Implementation sealed.

Implementation commit: `3eaf89f1ec40e49dea07796ec82d9329046c9464`

Implementation tag: `v1.0.0-decision-core-phase8d4a-context-observation-target-declaration`

## Context

Phase 8D3 deterministically projects the exact future `OBSERVATION`-item input semantics represented by one sealed admission declaration. It stops before Context-relative item materialization, membership, target Context identification, or revision transition.

Return-path governance also needs a way for a human to declare the base state from which one sealed projected observation is intended to be carried forward. That declaration must remain separate from any later proof that the named revision exists or any operation that could construct, mutate, or advance Context state.

The architectural precedent is narrow: Phase 6A permits a human-owned DREV-shaped revision reference without proving revision existence, while Phase 6B separately establishes exact binding through a reader. Phase 8D4A neither reuses those artifacts nor imports assessment ontology.

## Decision

Phase 8D4A adds only:

```text
SEALED DecisionContextObservationItemProjection
+ DECLARED DREV-shaped revision reference
+ DECLARED HUMAN_INPUT actor
+ OPTIONAL OPAQUE RATIONALE
-> DecisionContextObservationTargetDeclaration
-> STOP
```

It represents a declared human actor explicitly declaring one sealed projection intended to be carried forward from one declared DREV-shaped base-state reference in possible future Context processing.

## Target declaration is separate from binding

`TARGET DECLARATION != TARGET BINDING`.

`TARGET DECLARATION != REVISION EXISTENCE`.

`TARGET DECLARATION != PERSISTENCE AUTHORITY`.

There is no automatic edge from a `DecisionContextObservationItemProjection` to this declaration, no automatic edge from this declaration to revision binding, and no automatic edge from this declaration to materialization. The module has no revision reader, repository, revision assertion, or revision object.

## Shape-only base-state reference

`targetRevisionId` is accepted only when it matches `^DREV_[0-9A-F]{24}$`. This is shape-only and names a declared base state rather than a destination.

`DREV SHAPE != REVISION EXISTENCE`.

`TARGET REVISION ID != SEALED REVISION`.

`TARGET REVISION ID != PERSISTENCE PROOF`.

`TARGET REVISION ID != CURRENT REVISION`.

`TARGET REVISION ID != HEAD REVISION`.

`TARGET REVISION ID != LATEST REVISION`.

`TARGET REVISION != MUTATION DESTINATION`.

`TARGET REVISION ID != FUTURE REVISION ID`.

The declaration does not insert anything into the named revision and does not mutate it.

## Sealed DCOIP predecessor

Construction consumes exactly one complete sealed `DecisionContextObservationItemProjection` and validates it only through `assertDecisionContextObservationItemProjection(...)`. It does not repair or reinterpret the nested admission declaration, observation proposal, outcome attribution proposal, association proposal, Action Occurrence Claim, or State Change Claim. The complete sealed DCOIP remains embedded.

## Human declarer and rationale

`declaredBy` is exactly `{ origin: "HUMAN_INPUT", actorId: string }`. Construction trims nonempty actor ID; stored assertion requires canonical trimmed state. No actor equality or inequality is required or inferred with any earlier actor, admission actor, projected provenance actor, action actor, or revision producer.

`DECLARED BY != ADMITTED BY`.

`DECLARED BY != PROJECTION PROVENANCE`.

`DECLARED BY != AUTHENTICATED IDENTITY`.

`DECLARED BY != EXTERNAL AUTHORIZATION`.

`DECLARED BY != REVISION OWNER`.

`DECLARED BY != REVISION AUTHOR`.

`rationale` is exactly `string | null`. Construction preserves `null`, trims string values, and rejects empty results. Stored assertion accepts only `null` or canonical trimmed nonempty text. It is opaque and identity-bearing.

`RATIONALE != EVIDENCE`.

`RATIONALE != SUPPORT`.

`RATIONALE != TARGET VALIDITY`.

`RATIONALE != REVISION EXISTENCE`.

`RATIONALE != MATERIALIZATION AUTHORITY`.

## Cardinality and identity

One declaration contains exactly one sealed DCOIP, one target revision ID, one declared human actor, and one rationale value. One DCOIP can have zero, one, or multiple independent declarations. There is no uniqueness registry, aggregation, vote, consensus, rank, priority, score, confidence, reject, defer, ignore, block, or abstain state.

`DCOIP EXISTENCE != TARGET DECLARATION EXISTENCE`.

`ONE DCOIP != ONE TARGET DECLARATION`.

`DCOTD_` matches `^DCOTD_[0-9A-F]{24}$`. It is the first 24 uppercase hexadecimal SHA-256 characters over:

```ts
[
  "DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_V1",
  decisionContextObservationItemProjection
    .decisionContextObservationItemProjectionId,
  targetRevisionId,
  ["HUMAN_INPUT", declaredBy.actorId],
  rationale
]
```

Object insertion order is non-semantic. The sealed DCOIP ID, target revision ID, declared actor ID, and rationale including `null` versus string are identity-bearing.

`DCOTD IDENTITY != REVISION EXISTENCE`.

`DCOTD IDENTITY != TARGET BINDING`.

`DCOTD IDENTITY != MATERIALIZATION`.

`DCOTD IDENTITY != PERSISTENCE AUTHORITY`.

`DCOTD IDENTITY != OBSERVATION TRUTH`.

## No materialization or Context mutation

`DECLARATION IDENTITY != PERSISTENCE AUTHORITY`.

`TARGET DECLARATION != MATERIALIZATION`.

`TARGET DECLARATION != MATERIALIZATION READINESS`.

`TARGET DECLARATION != DECISION CONTEXT ITEM`.

`TARGET DECLARATION != ITEM MEMBERSHIP`.

`TARGET DECLARATION != CONTEXT MEMBERSHIP`.

`TARGET DECLARATION != CONTEXT MUTATION`.

`TARGET DECLARATION != REVISION MUTATION`.

`TARGET DECLARATION != REVISION CREATION`.

`TARGET DECLARATION != LOOP CLOSED`.

The contract constructs no `DecisionContextDraft`, `DecisionContextItem`, or `DecisionContextRevision`; it performs no Context membership, validation, or revision operation.

## Authoritative-state boundary

The embedded DCOIP may carry projected `AUTHORITATIVE_STATE` provenance. Phase 8D4A does not inspect a target revision, `sourceStateReferences`, the authoritative state reference, a payload, a reader, resolver, repository, or inventory.

`TARGET DECLARATION != SOURCE STATE REFERENCE ADMISSION`.

`TARGET DECLARATION != SOURCE STATE INVENTORY MEMBERSHIP`.

`TARGET REVISION REFERENCE != MATERIALIZATION READINESS`.

`AUTHORITATIVE REFERENCE CARRIED BY DCOIP != REFERENCE PRESENT IN TARGET REVISION CONTEXT`.

## No truth, support, causation, time, or persistence

`TARGET DECLARATION != OBSERVATION TRUTH`.

`TARGET DECLARATION != OBSERVED REALITY`.

`TARGET DECLARATION != OUTCOME TRUTH`.

`TARGET DECLARATION != SEMANTIC SUPPORT`.

`TARGET DECLARATION != CAUSATION`.

The declaration contains no time or temporal relation. It adds no repository, persister, database, current/head/latest authority, or authority-of-record operation.

`PERSISTED != TRUE`.

## Representation safety and error routing

Construction and stored assertion use boundary-local shallow descriptor capture. The input owns its four canonical keys; the artifact owns its seven; `declaredBy` owns only `origin` and `actorId`; and nested DCOIP validity is delegated only through its sealed public assertion.

Extras, hidden/non-enumerable fields, symbol keys, accessors, and hostile embedded DCOIP state reject without getter execution. Stored assertion repairs nothing. Returned state is detached; this is not a deep-freeze claim.

The exact error surface is:

- `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_INPUT_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_PROJECTION_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_REVISION_ID_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_ACTOR_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_RATIONALE_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_ID_MISMATCH`

Malformed/hostile top-level input is `...INPUT_INVALID`; invalid, hostile, or stale DCOIP is `...PROJECTION_INVALID`; invalid target ID is `...REVISION_ID_INVALID`; invalid declarer is `...ACTOR_INVALID`; and invalid rationale is `...RATIONALE_INVALID`. Stored malformed, hostile, noncanonical, nested-invalid, or body-drift state is `...INVALID`. Only an otherwise canonical valid complete body with wrong outer `DCOTD_` is `...ID_MISMATCH`; body invalidity takes precedence.

## Consequences

Return-path governance now includes an explicit human target declaration over a declared base state. Exact revision binding, materialization readiness, Context membership, Context mutation, revision transition, and loop closure remain outside this contract. Legacy Career semantics are not architecture authority.

`DecisionContextObservationTargetDeclaration -> STOP`

## Evidence

- Focused Phase 8D4A: 1 file / 7 tests passing.
- Decision Core: 29 files / 337 tests passing.
- Capability + authority-adapter regression: 32 files / 295 tests passing.
- Phase 8D4A production-only TypeScript: PASS.
- Root TypeScript: existing diagnostics remain in unchanged predecessor modules; no diagnostic originates from `context-observation-target-declaration` production or focused test after the correction.
- `git diff --check`: PASS.
- `repomix-output.xml`: ABSENT.

Two independent implementation Deep Sweeps found no Phase 8D4A production defect. They identified one verification defect: two TS2352 diagnostics in hostile-representation test casts. One consolidated test-only correction changed only those two casts to use an explicit `unknown` boundary before `HostileRecord`; production files were unchanged. Small Verify confirmed the Phase 8D4A diagnostics were gone. A global TS2352 check in the Small Verify harness produced a false negative because unrelated preexisting files still contain TS2352 diagnostics; that harness result is not a Phase 8D4A defect.

The implementation is sealed under the tested contract. Repository-wide TypeScript cleanliness and global zero-defect status are not claimed.
