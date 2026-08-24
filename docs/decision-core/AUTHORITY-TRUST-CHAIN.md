# Decision Core authority trust chain

## Scope

This walkthrough describes authority and structural checks implemented through Phase 5C1. It does not describe semantic evidence binding, support, contradiction, gap, dependency, consequence, recommendation, decision, or persistence behavior as current functionality.

## Phase 5A: generic producer authority consumption

```text
producer-governed authority source
  -> producer-specific AuthoritativeStateResolver
  -> BoundAuthoritativeStateReader
  -> AuthoritativeStateReference
  -> operation-time resolution
  -> AuthoritativeStateResolution
  -> detached reference + resolver-returned opaque payload
```

`createBoundAuthoritativeStateReader(resolvers)` validates each resolver registration and captures `resolver.resolve.bind(resolver)` once. It maps the exact binding pair:

```text
producerId + authorityContractId
```

to that bound method. Per-call input is only an exact, detached four-field `AuthoritativeStateReference`. The reader chooses the already-bound resolver, awaits it, then returns a new detached reference together with the resolver-returned opaque payload. The generic reader does not clone that payload.

The payload may have any producer-defined shape. The generic reader does not interpret it. A successful `AuthoritativeStateResolution` describes one successful operation; it does not confer authority for any later operation.

## Capability Core producer integration

Capability Core is a producer, not a dependency of generic Decision Core. `createCapabilityCoreAuthoritativeStateResolver(repository)` belongs in `lib/decision-adapters/capability-core.ts` and binds the repository's `getSnapshotByKey` read method once.

The current Capability Core integration is specifically:

```text
persisted Phase-4 VerifiedCapabilitySnapshot
  -> Capability Core AuthoritativeStateResolver
  -> generic Decision Core authority boundary
```

For the adapter's fixed producer/authority values, it performs:

```text
opaque reference locator
  -> repository.getSnapshotByKey(locator)
  -> persisted snapshot exists
  -> assertVerifiedCapabilitySnapshot(snapshot)
  -> snapshot.status == VERIFIED
  -> snapshot.publication.mode == PHASE4_VERIFIED
  -> computeSnapshotKey(snapshot) == reference.locator
  -> snapshot.snapshotId == reference.artifactId
  -> structuredClone(snapshot)
```

This uses existing Capability Core snapshot validation and identity mechanisms. It does not infer authority from an ID prefix, TypeScript type, or publication metadata alone. Its authority is relative to the repository read capability captured when that adapter resolver was created.

## Phase 5B: structural context boundary

`createDecisionContextDraft(...)` produces a detached canonical draft with `validationStatus: "NOT_RUN"`. It captures exact data properties, canonicalizes its references/items, derives IDs, and verifies the result structurally. The draft contains references only; it does not contain resolved payloads, repositories, resolvers, reader instances, authority capabilities, or resolution results.

Structural success means the context shape, identity, ordering, question count, and provenance-reference membership are valid. It does not mean listed references resolve now and does not make item statements semantically supported.

## Phase 5C1: current-authority reachability gate

```text
DecisionContextDraft supplied to validate(...)
  -> complete detached data-property capture
  -> assertDecisionContextDraft(captured context)
  -> captured canonical sourceStateReferences
  -> one bound-reader call per reference, in canonical order
  -> detached returned resolution reference capture
  -> exact equality with requested reference
  -> Promise<void>
```

`createBoundDecisionContextAuthorityValidator(reader)` captures `reader.resolve.bind(reader)` at construction. `validate(context)` first recursively captures the entire caller-supplied context. The capture accepts only data values, dense arrays, and enumerable own data properties; it rejects accessors, symbols, hidden/custom array state, cycles, malformed values, and reflection failures with `ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID`.

The validator then calls the sealed Phase-5B `assertDecisionContextDraft` on the detached capture. Only after that assertion succeeds does it iterate the captured `sourceStateReferences`. Each requested reference is copied again before the bound reader sees it. Because the references are captured before any `await`, caller mutation after validation begins cannot change later resolver calls.

For each reader result, 5C1 captures only `resolution.reference`, requires it to be a valid four-field reference, and compares all four fields with the requested reference. A malformed or different returned reference fails `ERR_DECISION_CONTEXT_AUTHORITY_REFERENCE_MISMATCH`.

## What the gate does not do

```text
NO PAYLOAD SEMANTIC INSPECTION
NO EVIDENCE SUPPORT CLAIM
NO CONTRADICTION CLAIM
NO GAP CLAIM
NO AUTHORITY TOKEN
NO VALIDATED CONTEXT ARTIFACT
NO PERSISTENCE IN 5C1
```

Payload is deliberately ignored after resolution. 5C1 neither hashes, stores, returns, compares, or semantically interprets it. An empty `sourceStateReferences` inventory resolves zero references and succeeds. That success does not mean the context is complete.

## Failure model

| Boundary | Current error/behavior |
| --- | --- |
| Malformed caller reference at reader boundary | `ERR_DECISION_AUTHORITY_REFERENCE_INVALID` |
| Unknown/duplicate reader resolver binding | `ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND`, `ERR_DECISION_AUTHORITY_RESOLVER_CONFLICT` |
| Capability adapter missing/invalid/mismatched snapshot | `ERR_DECISION_AUTHORITY_STATE_NOT_FOUND`, `ERR_DECISION_AUTHORITY_STATE_INVALID`, `ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH` |
| Invalid validator reader dependency | `ERR_DECISION_CONTEXT_AUTHORITY_READER_INVALID` |
| Invalid/hostile/tampered context entering 5C1 | `ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID` |
| Returned reader reference differs from requested reference | `ERR_DECISION_CONTEXT_AUTHORITY_REFERENCE_MISMATCH` |

The validator does not catch errors from `await boundResolve(...)`. Existing deterministic Phase-5A reader/adapter errors therefore remain observable where they arise; a producer dependency exception also propagates rather than being reclassified as a 5C1 context error.

## Authority is not semantic support

The implemented chain establishes that configured producer authority can currently resolve each declared context reference. It does not establish that any `DecisionContextItem.statement` is true, supported by the payload, contradicted, complete, human-adopted, or suitable for a recommendation. Those are later concerns and are not implemented through Phase 5C1.
