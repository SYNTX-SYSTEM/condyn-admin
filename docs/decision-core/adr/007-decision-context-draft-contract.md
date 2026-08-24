# ADR 007: Decision Context Draft is a deterministic structural contract

## Status

Implemented.

## Decision

`DecisionContextDraft` is intentionally a structural, pre-validation artifact. It contains canonical source-state references and canonical items, exactly one `DECISION_QUESTION`, derived IDs, and `validationStatus: "NOT_RUN"`.

Item role and provenance remain independent axes. The implemented provenance variants are:

```text
AUTHORITATIVE_STATE
HUMAN_INPUT
MODEL_PROPOSAL
DETERMINISTIC_DERIVATION
```

For example, an `OBJECTIVE` may be human input or a model proposal; neither role promotes one origin into the other. An `OBSERVATION` may name a listed authoritative reference or may be human input. The draft records provenance; it does not infer truth, evidence support, adoption, or semantic validity from it.

The constructor derives `DCI_` item IDs and a `DCTX_` context ID from canonical content and returns canonical ordering. It rejects duplicates rather than silently deduplicating. A context may have zero options, objectives, and constraints; completeness/gap analysis is not implemented.

The artifact deliberately contains no `Gap`, `Contradiction`, `Dependency`, `Consequence`, recommendation, score, ranking, human-decision, action, outcome, or feedback contract.

## Evidence

- `lib/decision-core/context/types.ts` defines the exact public draft, item, role, and provenance contracts.
- `lib/decision-core/context/identity.ts` defines DCI/DCTX SHA-256 identity inputs and deterministic ordering keys.
- `lib/decision-core/context/contract.ts` performs descriptor-based capture, canonicalization, structural assertion, question-count enforcement, provenance-reference membership, and ID recomputation.
- `test/decision-core/context/contract.test.ts` covers ordering invariance, identity changes, provenance independence, duplicate/missing-reference rejection, hostile input capture, detached output, forbidden semantics, generic examples, and compiler-resolved future-export gates.

## Consequence

The draft is portable structural data, not authority, a semantic conclusion, or a recommendation. Application-domain neutral means its contract avoids domain-specific fields such as recruiting terms; it does not assert that the implementation is ontology-free or already a universal decision system. Recruiting is not implemented on top of this contract.
