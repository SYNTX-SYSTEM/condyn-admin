# ADR 009: Semantic evidence binding is an operation-local evaluator proposal

## Status

Implemented.

## Context

Phase 5C1 establishes only whether every reference in a `DecisionContextDraft` can currently resolve through a bound authority reader. Authority reachability alone does not state how a resolved producer payload semantically relates to an item statement. Likewise, item provenance records where an item came from; it does not establish semantic support.

```text
AUTHORITATIVE STATE != SEMANTIC SUPPORT
PROVENANCE          != SEMANTIC SUPPORT
```

A successful prior 5C1 operation is not a portable authority certificate. A later semantic operation must resolve state again through dependencies bound for that operation.

The generic Phase-5A reader deliberately returns an opaque resolver payload without promising generic payload cloning. Passing that object identity to an evaluator could expose mutable producer-owned state. A different object identity alone is not sufficient isolation when shared memory is involved.

```text
SEMANTIC INSPECTION CAPABILITY != PRODUCER MUTATION CAPABILITY
```

## Decision

Phase 5C2 introduces `SemanticEvidenceBindingProposal`: an explicit relation between one `DecisionContextItem` and one `AuthoritativeStateReference`. Its closed disposition set is:

```text
SUPPORTED
PARTIALLY_SUPPORTED
NOT_SUPPORTED
CONTRADICTED
```

`createBoundSemanticEvidenceBinder(reader, evaluator)` captures both `reader.resolve` and `evaluator.evaluate` with their receivers at construction. `bind(context)` accepts only a `DecisionContextDraft`.

The binder has an explicit two-stage execution order:

```text
STAGE A: COMPLETE OPERATION-TIME AUTHORITY + PAYLOAD ISOLATION
  -> capture/assert the whole context
  -> resolve every canonical reference
  -> require exact returned-reference equality
  -> structuredClone every payload
  -> reject non-detachable/shared-memory payloads

STAGE B: SEMANTIC EVALUATION
  -> invoke the bound evaluator for every prepared state
  -> capture/validate proposals
  -> construct and canonically order bindings
```

Stage B begins only after every Stage-A state has resolved, matched, and been isolated. Phase 5C2 rejects `SharedArrayBuffer`, views backed by one, and nested shared-memory values in arrays, objects, `Map`, or `Set`, using cycle protection. The failure is `ERR_DECISION_EVIDENCE_BINDING_PAYLOAD_NOT_DETACHABLE` and prevents evaluator invocation.

The evaluator receives operation-local `contextId`, detached captured context items exposed through a readonly array type, one detached reference, and the isolated opaque payload. The readonly array type does not claim deep runtime immutability. It receives no repository, resolver, reader, producer-state write capability, human decision state, or producer authority. It may mutate its operation-local detached payload without mutating the resolver-owned payload. Its output remains proposal data.

The binding identity is deterministic:

```ts
EBIND_ + SHA256(JSON.stringify([
  "SEMANTIC_EVIDENCE_BINDING_V1",
  contextId,
  itemId,
  [producerId, authorityContractId, artifactId, locator],
  disposition
])).slice(0, 24).toUpperCase()
```

Rationale is trimmed for returned proposal content but deliberately excluded from identity. It is explanatory wording, not identity-bearing relationship state. Disposition remains identity-bearing.

Zero evaluator proposals are valid. The binder does not synthesize `NOT_SUPPORTED` for unexamined item/reference relationships.

## Consequences

`SemanticEvidenceBindingProposal` is neither producer authority nor verified semantic truth, human adoption, recommendation, decision, completeness proof, validated Decision Context, or persistence record.

`AUTHORITATIVE_STATE` provenance does not imply `SUPPORTED`. `HUMAN_INPUT` may be `SUPPORTED`; `MODEL_PROPOSAL` may be `CONTRADICTED`. Provenance answers where an item came from, while a binding records the evaluator's proposed relationship between one state and one item.

`CONTRADICTED` is not a Phase-5C3 `Contradiction` finding. Phase 5C2 does not derive gaps, structural contradictions, dependencies, consequences, validation assembly, recommendation, human decision, action, outcome, feedback, or context persistence. A future Phase 5C3 may consume this proposal layer, but is not implemented by this ADR.

## Evidence

- `lib/decision-core/evidence-binding/types.ts` defines the public disposition, evaluator, proposal, and bound-binder contracts.
- `lib/decision-core/evidence-binding/binder.ts` implements complete Stage-A authority/payload isolation before Stage-B evaluation, exact reference matching, proposal capture, duplicate rejection, and canonical output.
- `lib/decision-core/evidence-binding/identity.ts` defines the rationale-excluded `EBIND_` identity tuple.
- `test/decision-core/evidence-binding/contract.test.ts` covers provenance/support separation, operation-time re-resolution, bound dependencies, Stage-A-before-Stage-B execution, ordinary payload isolation, non-detachable/shared-memory payload rejection, cyclic safe payloads, exact identity behavior, zero bindings, and public/generic boundaries.
