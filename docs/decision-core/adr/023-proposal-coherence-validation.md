# ADR 023: Proposal Coherence Validation

## Status

Implementation sealed.

Implementation: `e1f866d68e33f921b3958c3f7250648091d965a0`

Tag: `v1.0.0-decision-core-phase6e-proposal-coherence`

## Context

Phase 6D represents recommendation proposal state only for selected options that are already represented in at least one Phase 6C assessment relation. That guarantee permits deterministic reconstruction of the represented criterion trace for each recommendation without introducing a new semantic evaluator, generator, model, provider, repository, reader, or authority operation.

The new contract is intentionally separate from earlier similarly named concepts:

```text
validation
= operation-time producer-authority reachability

validation-assembly
= Phase-5 derivational coherence

proposal-coherence
= Phase-6 recommendation-to-assessment trace reconstruction
```

Phase 6E does not reuse or alter either Phase-5 contract. It records structural traceability, not semantic justification or recommendation quality.

## Decision

Phase 6E implements only:

```text
SEALED DecisionRecommendationProposal
+ DETERMINISTIC CONDYN TRACE RECONSTRUCTION
-> DecisionProposalCoherenceValidation
-> STOP
```

### Artifact contract

```ts
interface DecisionRecommendationCoherenceTrace {
  optionItemId: string;
  representedCriterionItemIds: readonly string[];
}

interface DecisionProposalCoherenceValidation {
  artifactKind: "DECISION_PROPOSAL_COHERENCE_VALIDATION";
  schemaVersion: "DECISION_PROPOSAL_COHERENCE_VALIDATION_V1";
  proposalCoherenceValidationId: string;
  recommendationProposal: DecisionRecommendationProposal;
  traces: readonly DecisionRecommendationCoherenceTrace[];
}
```

The trace has exactly two fields and the artifact exactly five. No timestamp, provenance, model/provider metadata, status boolean, `coherent` field, correctness field, or support field is added.

### Trace reconstruction

For each recommendation, Phase 6E derives exactly one trace. Its `optionItemId` equals the recommended option. Its `representedCriterionItemIds` equal all `criterionItemId` values from embedded Phase 6C assessment relations whose `optionItemId` equals that recommendation option. It does not interpret or filter disposition or rationale, require every selected criterion, create a Cartesian matrix, or synthesize missing criteria.

All dispositions are treated identically. `ASSESSMENT DISPOSITION != COHERENCE POLICY`; `MISALIGNED != INCOHERENT RECOMMENDATION`; and `UNDETERMINED != INVALID RECOMMENDATION`. Assessed but unrecommended options create no trace. Zero recommendations create zero traces; multiple recommendations create one trace each.

Phase 6D already guarantees that every recommendation is both human-selected and assessment-represented. A sealed-valid Phase 6D predecessor therefore cannot produce an untraceable recommendation under this definition. Phase 6E introduces no `UNTRACEABLE`, `INCOHERENT`, `UNSUPPORTED`, `INCOMPLETE`, `REJECTED`, or `NOT_READY` state.

### Canonicalization and complete-state identity

Trace inventory is code-point ordered by `optionItemId`; each trace criterion inventory is code-point ordered by `criterionItemId`. Phase 6E derives this canonical form itself.

`proposalCoherenceValidationId` has shape `^DPCV_[0-9A-F]{24}$`: SHA-256 over `JSON.stringify(...)`, first 24 uppercase hexadecimal characters, prefixed `DPCV_`.

```ts
[
  "DECISION_PROPOSAL_COHERENCE_VALIDATION_V1",
  canonicalCompleteDecisionRecommendationProposal,
  canonicalTraces
]
```

Recursive object-own-key canonicalization makes object insertion order non-semantic; arrays inside the sealed predecessor remain in represented order. `TRACE SUMMARY != COMPLETE VALIDATION IDENTITY`: a change to assessment disposition or rationale, recommendation rationale, proposal reference, human assessment frame, or recommendation inventory changes `DPCV_` even where derived traces remain equal.

### Stored assertion

`assertDecisionProposalCoherenceValidation(value)` is self-contained. It may sealed-assert the embedded recommendation proposal but invokes no generator, evaluator, reader, repository, persister, lineage, authority resolver, provider, model, or external dependency. It requires exact five-field representation, exact two-field traces, exact trace/criterion inventories, canonical ordering, and recomputed complete-state identity.

```text
CREATE MAY DERIVE / CANONICALIZE
ASSERT MUST NOT REPAIR
```

The assertion may independently derive expected traces for comparison, but does not mutate, sort, deduplicate, replace, add, remove, or reconstruct into the submitted stored artifact.

## Authority/trust boundary

Phase 6E has no dependency capability and establishes no new authority. It deterministically reconstructs structural traceability inside one sealed recommendation proposal only.

`TRACEABILITY != SEMANTIC CORRECTNESS`, `STRUCTURAL COHERENCE != RECOMMENDATION CORRECTNESS`, `ASSESSMENT REPRESENTATION != SUPPORT FOR RECOMMENDATION`, and `CRITERION TRACE != JUSTIFICATION`.

It does not establish semantic truth, recommendation correctness, option suitability, option optimality, human preference, human acceptance, human decision, decision readiness, Decision Need, current producer authority, current revision, persistence authority, action, outcome, feedback, learning, truth, or authority of reality.

## Errors

- `ERR_DECISION_PROPOSAL_COHERENCE_RECOMMENDATION_PROPOSAL_INVALID`
- `ERR_DECISION_PROPOSAL_COHERENCE_INVALID`
- `ERR_DECISION_PROPOSAL_COHERENCE_ID_MISMATCH`

No additional semantic-state error exists.

## Public surface

Runtime exports are exactly:

- `DECISION_PROPOSAL_COHERENCE_VALIDATION_SCHEMA_VERSION`
- `validateDecisionProposalCoherence`
- `assertDecisionProposalCoherenceValidation`

Public types are exactly:

- `DecisionRecommendationCoherenceTrace`
- `DecisionProposalCoherenceValidation`

## Non-goals

Phase 6E does not validate recommendation quality, semantic support, correctness, safety, goodness, preference, suitability, optimality, completeness, readiness, or a human decision. It has no model, provider, evaluator, generator, human actor, reader, repository, persister, lineage traversal, authority resolver, or decision-maker operation.

## Implementation evidence

- Focused Phase 6E: 1 file / 6 tests passing.
- Decision Core: 18 files / 257 tests passing.
- Capability Core: 31 files / 287 tests passing.
- Scoped TypeScript: PASS.
- `git diff --check`: PASS.
- Sealed predecessor production/test diffs: EMPTY.
- Production disposition inspection: EMPTY.
- Forbidden Phase 6E production semantics audit: EMPTY.

Repository-wide TypeScript is not claimed clean unless independently proven.
