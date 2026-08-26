# ADR 013: Structural consequences are basis-relative explicit-path derivations

## Status

Implemented.

## Context

A `StructuralGap` alone cannot establish a consequence. It records one explicit expectation unsatisfied within one represented basis; it does not identify a real-world effect or an affected item. Likewise, a `StructuralRelationProposal` is caller-supplied proposal data, not relation truth. An unordered inventory of such proposals must not silently become graph discovery, reachability, ranking, or prediction.

The architecture therefore requires one validated item-anchored gap and one explicit ordered represented dependency path before it can derive one structural consequence:

```text
VALIDATED ITEM-ANCHORED STRUCTURAL GAP
+ ONE EXPLICIT ORDERED REPRESENTED DEPENDENCY PATH
= ONE BASIS-RELATIVE STRUCTURAL CONSEQUENCE
```

`EVIDENCE_BINDING` and `DEPENDENCY` gaps have an item anchor. A `CONTEXT_ROLE` gap does not: it represents an unmet count without a uniquely identified missing item. Inventing an anchor would add facts that the represented structure does not contain.

## Decision

Phase 5C3D introduces the adjacent `lib/decision-core/structural-consequences/` module. It exposes `StructuralConsequencePropagationBasis`, `StructuralConsequence`, `reconstructStructuralConsequence(...)`, and `assertStructuralConsequence(...)`; it does not widen the sealed `structural-findings` or `structural-gaps` barrels.

The source gap is operation-locally revalidated with the sealed Phase-5C3C contract against the supplied context, expectation, and gap basis. The order is context capture, expectation capture and validation, gap-basis capture, sealed gap assertion, canonical gap reconstruction, then source-anchor derivation. This preserves the sealed source-gap error boundary: safe capture and hash consistency do not establish derivation validity.

The caller supplies exactly one ordered `DEPENDENCY_PATH`. Every relation passes the sealed Phase-5C3B assertion and must be kind `DEPENDENCY`. Stored DREL direction is `dependentItemId depends on prerequisiteItemId`; propagation therefore follows prerequisite to dependent. The supplied path must be non-empty, begin at the source item, be continuous, and contain neither a repeated relation ID nor a repeated visited item. These are local path constraints only, not global graph analysis or a global acyclicity claim. A `CONTEXT_ROLE` source rejects with `ERR_DECISION_STRUCTURAL_CONSEQUENCE_SOURCE_NOT_ITEM_ANCHORED`.

The deterministic identity is:

```ts
DCONS_ + SHA256(JSON.stringify([
  "STRUCTURAL_CONSEQUENCE_V1",
  contextId,
  sourceGapId,
  dependencyPathRelationProposalIds
])).slice(0, 24).toUpperCase()
```

The path ID array is ordered. `sourceItemId` and the final-path `affectedItemId` are derived fields, not independent identity axes. A consequence has no independent provenance.

Stored assertion reconstructs the expected consequence from the exact supplied source-gap and path inputs before accepting a stored artifact. A self-consistent `DCONS_` for another path is invalid; only an otherwise exact artifact with a wrong ID is an ID mismatch.

## Consequences

Decision Core can now deterministically represent that one validated item-anchored structural gap is upstream of another context item along one explicit represented path. This is basis-relative in both the revalidated source gap and the ordered path IDs.

It does not establish dependency truth, a real-world effect, prediction, outcome, another gap, severity, probability, confidence, priority, Decision Need, recommendation, human decision, action, feedback, persistence, or revision lineage. It performs no authority resolution, payload inspection, semantic evaluation, relation discovery, reachability search, shortest-path computation, path ranking, or graph traversal.

Phase 5C4 now implements Validation Assembly for revalidated derivational coherence. Phase 5D1 now implements a self-contained canonical Decision Context revision artifact, 5D2A now implements repository-bound immutable persistence authority, and 5D2B now implements its durable PostgreSQL adapter. Phase 5D3 remains planned for read-only revision-lineage reconstruction.

## Evidence

- `lib/decision-core/structural-consequences/types.ts` defines the public propagation basis and consequence artifact.
- `lib/decision-core/structural-consequences/identity.ts` defines deterministic `DCONS_` construction.
- `lib/decision-core/structural-consequences/reconstruct.ts` revalidates source gaps, validates explicit paths, derives consequences, and asserts stored artifacts.
- `test/decision-core/structural-consequences/reconstruct.test.ts` covers anchors, path topology, deterministic identity, stored derivation validity, error boundaries, detachment, and export/genericity gates.
