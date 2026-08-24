# ADR 011: Explicit relation proposals precede relation findings

## Status

Implemented.

## Context

Two `DecisionContextItem` artifacts do not automatically establish an item/item relation. Their roles, statements, provenance, semantic difference, semantic similarity, authoritative-state origin, Phase-5C2 `CONTRADICTED` binding, or Phase-5C3A structural expectation do not by themselves establish relation truth or a finding.

The architecture therefore preserves these boundaries:

```text
RELATION PROPOSAL            != RELATION TRUTH
RELATION PROPOSAL            != FINDING
CONTRADICTION PROPOSAL       != FORMAL LOGICAL CONTRADICTION
CONTRADICTION PROPOSAL       != CONTRADICTED SEMANTIC EVIDENCE BINDING
DEPENDENCY PROPOSAL          != DEPENDENCY EXPECTATION
DEPENDENCY PROPOSAL          != DEPENDENCY FINDING
RELATION ONTOLOGY            != RELATION DISCOVERY
```

Without an explicit artifact, later work has no relation proposal to consume. Conversely, an explicit proposal cannot make the relation true, validated, or decision-relevant.

## Decision

Phase 5C3B introduces `StructuralRelationProposal` as one caller-supplied, context-bound item/item proposal. It has exactly two kinds:

- `CONTRADICTION`: a symmetric proposal over two distinct context item IDs.
- `DEPENDENCY`: a directional proposal with `dependentItemId` and `prerequisiteItemId`.

For contradiction, construction canonicalizes endpoint order deterministically; A/B and B/A input produce the same canonical artifact and `DREL_` identity. Stored-artifact assertion is stricter: it requires the submitted endpoint order already to be canonical and does not repair it.

For dependency, direction is identity-bearing. A -> B and B -> A are separate representable proposals. Self relations are invalid; this contract makes no graph-level cycle judgment.

The exact DREL tuple is:

```ts
DREL_ + SHA256(JSON.stringify([
  "STRUCTURAL_RELATION_PROPOSAL_V1",
  contextId,
  kind,
  canonicalRelationBody,
  canonicalProvenance
])).slice(0, 24).toUpperCase()
```

Provenance reuses the sealed `DecisionContextItemProvenance` union as an identity-bearing origin axis. `AUTHORITATIVE_STATE` provenance requires only structural membership of its reference in the context inventory. Phase 5C3B performs no authority resolution, payload inspection, semantic evaluation, relation detection, relation validation, expectation consumption, or semantic-binding consumption.

Construction may canonicalize valid caller input. Stored assertion follows this order: capture, header validation, exact kind-specific stored-key validation, variant validation, contradiction stored-canonicality verification where applicable, and DREL recomputation. It never silently repairs stored artifacts.

## Consequences

Decision Core can now represent explicit item/item relation proposals canonically while keeping relation ontology separate from relation discovery, truth, and findings. Future logic may consume these proposals, but Phase 5C3B itself does not validate them into findings.

Phase 5C3A expectations remain distinct from relation proposals and findings. Gap reconstruction and structural consequence propagation remain later high-level work. No Gap, Contradiction finding, Dependency finding, Consequence, Decision Need, priority, recommendation, human decision, action, outcome, feedback, persistence, or revision lineage is introduced here.

## Evidence

- `lib/decision-core/structural-findings/relation-types.ts` defines the closed kinds and public input/artifact unions.
- `lib/decision-core/structural-findings/relation-identity.ts` defines canonical provenance and deterministic `DREL_` construction.
- `lib/decision-core/structural-findings/relation.ts` captures/asserts context and proposal values, checks membership, canonicalizes contradiction input, preserves dependency direction, validates stored representation order, and returns detached artifacts.
- `test/decision-core/structural-findings/relation.test.ts` covers symmetry, directionality, self relations, membership, provenance, identity, defensive capture, stored-artifact assertion, generic imports, and public-surface boundaries.
