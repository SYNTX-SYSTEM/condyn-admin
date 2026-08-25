# ADR 010: Structural expectations precede structural findings

## Status

Implemented.

## Context

A missing item, role, semantic binding, disposition, or apparent relation does not by itself establish a Gap. It has no defined comparison target until an expectation makes the intended structure explicit.

The implemented invariant is `ABSENCE != GAP`.

Decision Context roles do not implicitly create expectations: an `OBJECTIVE` or `CONSTRAINT` is not automatically an expectation, and `UNCERTAINTY` is not a Gap. Likewise, zero semantic bindings do not establish a Gap or `NOT_SUPPORTED`.

A dependency expectation also must remain distinct from a Dependency finding. The expectation can name a future structural comparison without proving a dependency relation. Provenance remains an origin axis: a human expectation is not evidence truth; a model-proposed expectation is not a human requirement; and `AUTHORITATIVE_STATE` provenance does not establish satisfaction or semantic truth.

## Decision

Phase 5C3A introduces the explicit `StructuralExpectation` artifact as a comparison target bound by `contextId` to one structurally valid `DecisionContextDraft` under the sealed Phase-5B contract. It has exactly three kinds: `EVIDENCE_BINDING`, `CONTEXT_ROLE`, and `DEPENDENCY`.

An evidence-binding expectation names an existing item and a non-empty selected set of accepted Phase-5C2 dispositions. A context-role expectation names one sealed role and a positive safe-integer minimum count. A dependency expectation names distinct existing dependent and prerequisite items; its direction is identity-bearing.

All variants reuse the sealed `DecisionContextItemProvenance` union unchanged. An authoritative-state provenance reference must be structurally present in the context source inventory, but Phase 5C3A performs no authority resolution, payload inspection, semantic evaluation, binding execution, satisfaction evaluation, or finding construction.

The artifact uses deterministic `DEXP_` identity. Its SHA-256 JSON tuple contains the version marker `STRUCTURAL_EXPECTATION_V1`, `contextId`, `kind`, canonical variant body, and canonical provenance. It excludes timestamps, randomness, execution order, rationale, and provider/model metadata outside explicit provenance.

Construction accepts valid evidence-binding selected-disposition input in any order and stores the selected values in sealed disposition order. Assertion is deliberately different: construction may canonicalize input, while assertion must verify that a submitted stored artifact is already canonical.

A stored artifact is never silently repaired, normalized, or reordered by `assertStructuralExpectation(...)`. A reordered stored accepted-disposition representation fails `ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID`, even if its deterministic ID still names the canonical equivalent.

## Consequences

Phase 5C3A itself does not compare observed structure against an explicit expectation or derive a Gap. Phase 5C3C now implements basis-relative Structural Gap reconstruction by comparing an explicit `StructuralExpectation` with an explicit represented observation basis.

Phase 5C3B now implements explicit structural relation proposals for contradiction and dependency. Expectation remains distinct from both a relation proposal and a finding. Phase 5C3C now implements basis-relative Structural Gap reconstruction, and Phase 5C3D now implements basis-relative structural consequence propagation from validated item-anchored gaps along explicit ordered dependency paths. No recommendation, Decision Need, priority, score, confidence, ranking, human decision, action, outcome, feedback, persistence, or revision lineage is introduced.

Model-proposed expectations remain proposal state rather than human requirements. A structural expectation may exist without being relevant to a human decision. The artifact is not an authoritative fact, satisfaction result, finding, or persistence record.

## Evidence

- `lib/decision-core/structural-findings/types.ts` defines the closed public kinds, inputs, and artifact unions.
- `lib/decision-core/structural-findings/identity.ts` defines canonical provenance and deterministic `DEXP_` identity construction.
- `lib/decision-core/structural-findings/expectation.ts` captures/asserts context and expectation values, validates structural membership, canonicalizes constructor input, verifies stored canonicality, and returns detached artifacts.
- `test/decision-core/structural-findings/expectation.test.ts` covers variants, identity, ordering, duplicates, membership, provenance, hostile values, detached constructor output, stored-artifact canonicality, and public/generic boundaries.
