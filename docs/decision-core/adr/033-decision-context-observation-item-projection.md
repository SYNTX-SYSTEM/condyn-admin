# ADR 033: Decision Context Observation Item Projection

## Status

Implementation sealed.

Implementation commit: `0d9fd1076317547181b499f1710056c0a2959e66`

Implementation tag: `v1.0.0-decision-core-phase8d3-context-observation-item-projection`

## Context

Phase 8D2 represents a declared human admission of one sealed `DecisionContextObservationProposal` as eligible for future `OBSERVATION`-role materialization. That declaration neither creates a `DecisionContextItem` nor identifies a target Context, establishes membership, creates a revision, or closes the loop.

The existing Context contract can derive canonical item identity internally, but has no public item constructor or assertion. Item validity is Context-relative: draft construction establishes item validity, membership adds duplicate constraints, authoritative provenance adds source-state inventory membership, and draft construction also requires exactly one `DECISION_QUESTION`. A separate deterministic boundary is therefore required to expose the exact item-input semantics already represented by an admission declaration without performing Context-relative materialization.

`ITEM SEMANTIC PROJECTION != ITEM MATERIALIZATION`.

`ITEM IDENTITY COMPUTABILITY != ITEM EXISTENCE`.

`ITEM EXISTENCE != CONTEXT MEMBERSHIP`.

## Decision

Phase 8D3 adds only:

```text
SEALED DecisionContextObservationAdmissionDeclaration
-> DecisionContextObservationItemProjection
-> STOP
```

It derives one deterministic, detached `DecisionContextObservationItemProjection` from one sealed admission declaration. The complete sealed declaration remains embedded so the admitted return-path lineage is preserved.

There is no automatic edge from a `DecisionContextObservationAdmissionDeclaration` to this projection, and no automatic edge from this projection to a `DecisionContextItem`.

## Projection is separate from materialization

`DECISION CONTEXT OBSERVATION ADMISSION DECLARATION != DECISION CONTEXT OBSERVATION ITEM PROJECTION`.

`ADMISSION != PROJECTION`.

`PROJECTION != DECISION CONTEXT ITEM`.

`PROJECTED ITEM INPUT != DECISION CONTEXT ITEM`.

`PROJECTED ITEM INPUT != ITEM MEMBERSHIP`.

`PROJECTION != MATERIALIZATION`.

`PROJECTION != TARGET CONTEXT`.

`PROJECTION != CONTEXT MUTATION`.

`PROJECTION != DECISION CONTEXT DRAFT`.

`PROJECTION != DECISION CONTEXT REVISION`.

`PROJECTION != REVISION CREATION`.

`PROJECTION != LOOP CLOSED`.

The contract constructs no `DecisionContextItem`, `DecisionContextDraft`, or `DecisionContextRevision`. It performs no item identity construction, Context validation, duplicate check, `DECISION_QUESTION` count check, source-inventory check, membership operation, Context mutation, or revision transition.

## Sealed admission predecessor and exact projection

Construction consumes exactly one complete sealed `DecisionContextObservationAdmissionDeclaration` and validates it only through `assertDecisionContextObservationAdmissionDeclaration(...)`. It does not independently repair or reinterpret its nested `DecisionContextObservationProposal`, `OutcomeAttributionProposal`, `ActionStateChangeAssociationProposal`, `ActionOccurrenceClaim`, or `StateChangeClaim`.

The projection has a fixed item-role semantic:

```text
projectedItemInput.role = OBSERVATION
projectedItemInput.statement = sealed DCOP statement
projectedItemInput.provenance = sealed DCOP provenance
```

The operation is deterministic, but operation determinism does not replace the represented observation provenance.

`PROJECTED ITEM PROVENANCE = DCOP PROVENANCE`.

`ADMISSION AUTHORITY != PROJECTED ITEM PROVENANCE`.

`DETERMINISTIC PROJECTION != DETERMINISTIC_DERIVATION ITEM PROVENANCE`.

`HUMAN_INPUT` remains `HUMAN_INPUT`; `MODEL_PROPOSAL` remains `MODEL_PROPOSAL`; and `AUTHORITATIVE_STATE` remains `AUTHORITATIVE_STATE` with its complete exact `stateReference`. `admittedBy` and rationale are not copied into projected item provenance or statement.

`ADMITTED BY != PROJECTED ITEM PROVENANCE`.

`RATIONALE != PROJECTED ITEM STATEMENT`.

`RATIONALE != PROJECTED ITEM PROVENANCE`.

## Artifact contract

The schema is `DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_V1` and the artifact kind is `DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION`.

```ts
interface DecisionContextObservationItemProjectionInput {
  decisionContextObservationAdmissionDeclaration: DecisionContextObservationAdmissionDeclaration;
}

interface DecisionContextObservationItemProjection {
  artifactKind: "DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION";
  schemaVersion: typeof DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_SCHEMA_VERSION;
  decisionContextObservationItemProjectionId: string;
  decisionContextObservationAdmissionDeclaration: DecisionContextObservationAdmissionDeclaration;
  projectedItemInput: {
    role: "OBSERVATION";
    statement: string;
    provenance: DecisionContextObservationProposalProvenance;
  };
}
```

The input has exactly one field. The artifact has exactly five. `projectedItemInput` has exactly `role`, `statement`, and `provenance`. It has no item ID, Context ID, revision ID, decision-question ID, or source-state-reference inventory.

## Lineage and identity

The complete sealed admission declaration is retained because distinct admissions can produce equal projected item inputs; for example, differing rationale can leave role, statement, and provenance identical.

`DISTINCT ADMISSION IDENTITY != NECESSARILY DISTINCT PROJECTED ITEM INPUT`.

`DCOIP_` matches `^DCOIP_[0-9A-F]{24}$`. It is the first 24 uppercase hexadecimal SHA-256 characters over:

```ts
[
  "DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_V1",
  decisionContextObservationAdmissionDeclaration
    .decisionContextObservationAdmissionId
]
```

The identity depends only on sealed DCOAD identity because the projected item input is fully deterministic from that sealed state.

`DCOIP IDENTITY != DCI IDENTITY`.

`DCOIP IDENTITY != CONTEXT IDENTITY`.

`DCOIP IDENTITY != REVISION IDENTITY`.

`DCOIP IDENTITY != OBSERVATION TRUTH`.

`DCOIP IDENTITY != PERSISTENCE AUTHORITY`.

## Authority and authoritative-state boundary

Admission authority is represented by the sealed declaration; it does not become observation provenance. If the sealed proposal carries `AUTHORITATIVE_STATE` provenance, its opaque exact reference is carried into `projectedItemInput` without resolution, inspection, validation, or inventory mutation.

`REFERENCE CARRIED BY PROJECTED ITEM INPUT != SOURCE STATE INVENTORY MEMBERSHIP`.

`PROJECTED AUTHORITATIVE ITEM INPUT != SOURCE STATE REFERENCE ADMISSION`.

`REFERENCE PRESENT IN PROJECTED ITEM INPUT != REFERENCE PRESENT IN FUTURE DECISION CONTEXT`.

The boundary calls no reader, resolver, payload access, repository, or Context operation.

## No truth, support, causation, Feedback, or Learning

`PROJECTION != OBSERVATION TRUTH`.

`PROJECTION != OBSERVED REALITY`.

`PROJECTION != OUTCOME TRUTH`.

`PROJECTION != SEMANTIC SUPPORT`.

`PROJECTION != CAUSATION`.

Projection correctness means only deterministic structural consistency with the sealed admitted predecessor. It establishes neither semantic truth nor authority of reality. The contract is not Feedback or Learning and does not reuse Legacy Career ontology.

## Representation safety and error routing

Construction and stored assertion use boundary-local shallow descriptor capture. The input boundary owns `decisionContextObservationAdmissionDeclaration`; the artifact boundary owns its five fields; `projectedItemInput` owns `role`, `statement`, and `provenance`; and provenance owns only its canonical variant fields.

Accessors, symbol keys, hidden/non-enumerable fields, extras, malformed values, and hostile state across the outer projection, projected input/provenance/reference, DCOAD, DCOP, Outcome Attribution Proposal, association proposal, Action Occurrence Claim, or State Change Claim reject without getter execution. Returned state is detached. This is not a deep-freeze claim.

The exact error surface is:

- `ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_INPUT_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_ADMISSION_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_ID_MISMATCH`

Malformed or hostile top-level input is `...INPUT_INVALID`. Invalid, hostile, or stale sealed DCOAD is `...ADMISSION_INVALID`. Stored malformed/hostile state, invalid sealed DCOAD, projected-item-input/provenance hostility, role/statement/provenance drift, extra fields, or noncanonical nested representation is `...INVALID`. Only an otherwise canonical valid complete body with a stale or wrong outer `DCOIP_` is `...ID_MISMATCH`; body invalidity takes precedence.

## Temporal and persistence exclusions

Phase 8D3 represents no time or temporal relation and contains no timestamp, creation/occurrence/observation/effective time, or clock use. It adds no repository, persister, database, save operation, or current/head/latest authority.

`PERSISTED != TRUE`.

## Consequences

Return-path governance now includes deterministic item-semantic projection while remaining before Context-relative materialization. No Context Item, Context membership, Context mutation, revision, or loop closure exists at this boundary.

`DecisionContextObservationItemProjection -> STOP`

## Evidence

- Focused Phase 8D3: 1 file / 7 tests passing.
- Decision Core: 28 files / 330 tests passing.
- Capability regression including authority-adapter coverage: 32 files / 295 tests passing.
- Phase 8D3 production-only scoped TypeScript: PASS.
- Root Decision Core barrel TypeScript: existing errors remain in unchanged predecessor modules; no error originates from `lib/decision-core/context-observation-item-projection/**`.
- `git diff --check`: PASS.
- `repomix-output.xml`: ABSENT.

Two implementation Deep Sweeps found no production defect in the examined Phase 8D3 production scope. One consolidated test-only correction added permanent stored-assertion proof across the hostile outer projection, projected item input, projected provenance, authoritative reference, DCOAD, DCOP, OutcomeAttributionProposal, ActionStateChangeAssociationProposal, ActionOccurrenceClaim, and StateChangeClaim representation boundaries. It also permanently proves body invalidity precedes stale outer-ID classification and that `MODEL_PROPOSAL` provenance remains separate from the `HUMAN_INPUT` admission actor. Production was not changed by that correction.

The implementation is sealed under the tested contract. Repository-wide and root-barrel standalone TypeScript cleanliness are not claimed unless independently proven.
