# ADR 012: Structural gaps are basis-relative derived artifacts

## Status

Implemented.

## Context

Absence alone cannot establish a structural gap. A missing item, binding, or relation proposal may simply be unrepresented in the current input. Likewise, an explicit `StructuralExpectation` is only a comparison target until it is compared with an explicit represented observation basis.

Phase 5C2 `SemanticEvidenceBindingProposal` values remain semantic proposal data, not verified truth or portable authority. Phase 5C3B `StructuralRelationProposal` values remain relation proposal data, not relation truth. Consuming either must not upgrade its authority or epistemic status.

The architecture therefore requires these boundaries:

```text
ABSENCE                 != GAP
GAP                     != REAL-WORLD ABSENCE
GAP                     != GLOBAL INCOMPLETENESS
GAP                     != DECISION NEED
GAP                     != CONSEQUENCE
GAP                     != RECOMMENDATION
HASH CONSISTENCY        != DERIVATION VALIDITY
```

## Decision

Phase 5C3C introduces `StructuralGap` in the adjacent `lib/decision-core/structural-gaps/` module. It derives one canonical artifact only when one explicit `StructuralExpectation` is unsatisfied within one explicit `StructuralGapObservationBasis`.

`reconstructStructuralGap(context, expectation, basis)` returns `StructuralGap | null`. `null` means only that the supplied expectation produces no gap under the supplied basis. `assertStructuralGap(context, expectation, basis, gap)` is basis-bound: it reconstructs against that exact basis before accepting a stored artifact.

The module consumes EBIND and DREL artifacts structurally without invoking authority resolution, a semantic evaluator, a binder, payload inspection, relation discovery, or graph traversal. The gap body records only relevant represented observations. A gap has no independent free-form provenance; expectation provenance is already represented through `expectationId`.

`DGAP_` is deterministic over schema identity, context ID, expectation ID, kind, and canonical gap body. Stored assertion requires canonical observed-ID arrays and rejects a self-consistent gap when reconstruction under the supplied basis is satisfying.

## Consequences

Decision Core can now derive a deterministic basis-relative structural gap from an explicit expectation and explicit represented basis. It does not thereby establish real-world absence, completeness, semantic truth, relation truth, Decision Need, consequence, recommendation, or human adoption.

Basis relativity permits later revision-lineage work to distinguish the same expectation evaluated against different relevant represented bases, because such bases can produce different `DGAP_` identities. Phase 5D1 now implements the self-contained revision artifact needed for local revalidation; repository persistence authority and read-only revision-lineage reconstruction remain later Phase 5D2/5D3 work.

Phase 5C3D now implements explicit-path basis-relative `StructuralConsequence` propagation from validated item-anchored gaps along explicit ordered dependency paths. Phase 5C4 now implements Validation Assembly for revalidated derivational coherence. Phase 5D1 now implements a self-contained revision artifact, not persistence. Repository-bound persistence, recommendation, human decision, action, outcome, feedback, and learning remain later work.

## Evidence

- `lib/decision-core/structural-gaps/types.ts` defines the public basis and gap variants.
- `lib/decision-core/structural-gaps/identity.ts` defines deterministic `DGAP_` construction.
- `lib/decision-core/structural-gaps/reconstruct.ts` validates represented bases, reconstructs gaps, and performs basis-bound stored assertion.
- `test/decision-core/structural-gaps/reconstruct.test.ts` covers basis relativity, EBIND/DREL validation, canonicality, deterministic identity, and error boundaries.
