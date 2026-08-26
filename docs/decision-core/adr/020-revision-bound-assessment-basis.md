# ADR 020: Revision-bound assessment basis

## Status

Implemented and sealed.

Implementation: `fa891f7b8280e06ca3a1102b7f1bcf477c4475bd`
`v1.0.0-decision-core-phase6b-assessment-basis`

## Context

Phase 6A records a human-owned assessment request with DREV-shaped and DCI-shaped references only. Those references do not establish revision existence, persistence authority, item membership, or item role. An assessment cannot safely operate from a request alone.

```text
REQUEST != BOUND BASIS
DREV-SHAPED REQUEST REFERENCE != REVISION EXISTENCE
DCI-SHAPED REQUEST REFERENCE != ITEM MEMBERSHIP / ROLE
```

The required adjacent boundary is a read-only binding of one sealed request to one exact sealed `DecisionContextRevision`. The binding must not become current-state selection, lineage traversal, producer-authority revalidation, persistence authority, semantic assessment, recommendation, or human decision.

## Decision

Phase 6B introduces a self-contained, exact five-field artifact:

```ts
interface DecisionAssessmentBasis {
  artifactKind: "DECISION_ASSESSMENT_BASIS";
  schemaVersion: "DECISION_ASSESSMENT_BASIS_V1";
  assessmentBasisId: string;
  assessmentRequest: DecisionAssessmentRequest;
  revision: DecisionContextRevision;
}
```

The public reader has exactly `getRevisionById(revisionId: string): Promise<DecisionContextRevision | null>`. `createBoundDecisionAssessmentBasisBinder(reader)` accepts only that exact own enumerable data-method capability, captures/binds it at construction, and exposes only `bind(assessmentRequest): Promise<DecisionAssessmentBasis>`.

`bind(...)` captures and sealed-asserts the request before the read await, reads exactly the requested revision ID, captures and sealed-asserts the returned revision, and requires exact revision-ID equality. It validates that the question is the revision's canonical `DECISION_QUESTION`, and every selected option, objective, and constraint exists with its respectively declared role. Empty inventories remain valid. The constructed result is reasserted and returned detached.

`assessmentBasisId` is a private deterministic `DABAS_` identity: SHA-256 of the JSON representation of `DECISION_ASSESSMENT_BASIS_V1`, canonical complete request state, and canonical complete revision state; the first 24 hexadecimal characters are uppercased. Object own string keys are recursively code-point ordered, while array order is preserved. Stored assertion is self-contained, repository-free, exact, and non-repairing.

## Consequences

The result is a revision-bound assessment basis, not an assessment, Decision Need, recommendation, or human decision. It neither proves reader persistence nor establishes authority of record, current revision, current producer authority, semantic support, normative importance, truth, readiness, or a closed human-machine loop.

```text
READER RETURN != PERSISTENCE PROOF
SEALED REVISION != CURRENT REVISION / CURRENT PRODUCER AUTHORITY
MEMBERSHIP != SEMANTIC SUPPORT
ROLE != NORMATIVE IMPORTANCE
ASSESSMENT BASIS != ASSESSMENT != DECISION NEED != RECOMMENDATION != HUMAN DECISION
```

`DREV IDENTITY != COMPLETE REVISION PAYLOAD`. A meaningful identity-excluded semantic-binding rationale can differ in otherwise sealed-valid revision state while `revisionId` remains the same. Consequently, `DABAS_` includes the complete bound revision state rather than merely `assessmentRequestId + revisionId`; same DREV plus a different complete revision payload yields a different DABAS. `DABAS IDENTITY != REVISION AUTHORITY != DECISION AUTHORITY != TRUTH`.

The eight owned errors are `ERR_DECISION_ASSESSMENT_BASIS_READER_INVALID`, `ERR_DECISION_ASSESSMENT_BASIS_REQUEST_INVALID`, `ERR_DECISION_ASSESSMENT_BASIS_REVISION_NOT_FOUND`, `ERR_DECISION_ASSESSMENT_BASIS_REVISION_INVALID`, `ERR_DECISION_ASSESSMENT_BASIS_ITEM_NOT_FOUND`, `ERR_DECISION_ASSESSMENT_BASIS_ROLE_MISMATCH`, `ERR_DECISION_ASSESSMENT_BASIS_INVALID`, and `ERR_DECISION_ASSESSMENT_BASIS_ID_MISMATCH`.

## Evidence

- Focused Phase 6B: 16 / 16 passing.
- Decision Core: 227 / 227 passing.
- Capability Core: 272 / 272 passing.
- Scoped TypeScript: PASS.
- `git diff --check`: PASS.
- Sealed predecessor diffs: EMPTY.

Pre-freeze RED hardening proved that the initial Phase 6B implementation accepted a non-enumerable own `getRevisionById` capability. The implementation was corrected before freeze to require an exact own enumerable data-method reader capability. This was resolved before the implementation commit and tag, not a post-seal correction.
