# ADR 014: Validation Assembly records derivational coherence, not truth

## Status

Implemented.

## Context

The sealed Phase-5C1 `validation` module is an operation-time authority gate. It establishes only whether configured authority can resolve the declared context references during that operation. It is not a general home for later structural derivation artifacts.

Phases 5C3C and 5C3D separately reconstruct basis-relative gaps and explicit-path consequences. A caller can supply those derivations again, but an ID alone is not a portable certificate: `DGAP_`, `DCONS_`, and a self-consistent future assembly hash do not establish that the artifacts are valid for the current inputs.

The architecture therefore requires a separate artifact that records the coherent, operation-locally revalidated derivational state without changing the sealed `DecisionContextDraft` or claiming authority, truth, completeness, semantic verification, or decision readiness.

## Decision

Phase 5C4 introduces the adjacent `lib/decision-core/validation-assembly/` module and the separate canonical, detached `DecisionContextValidationAssembly` artifact. It does not widen Phase-5C1 validation and does not create a `ValidatedDecisionContext`; `DecisionContextDraft.validationStatus` remains exactly `"NOT_RUN"`.

The assembly has exactly `artifactKind`, `schemaVersion`, `assemblyId`, `contextId`, `expectationResults`, and `consequenceIds`. It records both possible Phase-5C3C reconstruction states: `GAP` for an exact derivation-valid supplied gap, and `NO_GAP` only where sealed reconstruction and caller result are both `null`. `NO_GAP` is not satisfaction of the world, global completeness, truth, authority, or decision readiness.

The assembly commits to the complete derivation basis rather than only `gapId`. For EVIDENCE_BINDING and DEPENDENCY, the canonical descriptor carries the complete supplied observation-ID inventory. The same `DGAP_` may legitimately arise from different such bases when an added observation is irrelevant to the Phase-5C3C gap body; those remain different assembly derivations and produce different `DVASM_` values. For CONTEXT_ROLE, the descriptor is kind-only and its canonical context observations are already committed through `contextId`.

Consequences are revalidated through the sealed Phase-5C3D contract and may enter the assembly only when their source GAP result with the same expectation ID, canonical `StructuralValidationBasisDescriptor`, and gap ID is already represented. A GAP may have zero or multiple explicit consequences. EBIND has no standalone top-level assembly inventory or assertion surface; it participates only through sealed Phase-5C3C observation-basis validation.

For each caller-supplied derivation occurrence, Phase 5C4 captures one detached operation-local snapshot and reuses it for predecessor validation, reconstruction, descriptor construction, source-coherence checks, and `DVASM_` identity. This prevents mutation or non-idempotent representation reads from making the basis used for derivation differ from the basis committed into the assembly.

Phase 5C4 consumes `DecisionContextDraft` directly under the sealed Phase-5B contract. Its errors, including canonicality and ID errors, remain Phase-5B errors rather than being relabeled as StructuralGap-context errors. No authority resolution, reader, resolver, repository, payload inspection, authority validator, semantic binder, or evaluator is invoked.

An empty input is valid. It creates an empty canonical assembly for the context; it is not proof that nothing is missing or that the context is complete.

## Consequences

Decision Core can now deterministically assemble revalidated structural derivations for one explicit context. `DVASM_` is deterministic derivation identity, not a truth or authority certificate.

The assembly remains distinct from Decision Need, priority, score, confidence, severity, recommendation, human decision, action, outcome, feedback, persistence, and revision lineage. Phase 5D is the next boundary for immutable Decision Context persistence and revision lineage; it is not implemented by this ADR.

## Evidence

- `lib/decision-core/validation-assembly/types.ts` defines the assembly inputs, descriptors, results, and artifact.
- `lib/decision-core/validation-assembly/identity.ts` defines deterministic `DVASM_` construction.
- `lib/decision-core/validation-assembly/reconstruct.ts` captures detached snapshots, revalidates predecessors, and asserts stored assemblies.
- `test/decision-core/validation-assembly/assembly.test.ts` covers canonical ordering, result/source coherence, full-basis identity, detachment, error ownership, and public-boundary gates.
