# ADR 008: Decision Context authority is rechecked at operation time

## Status

Implemented.

## Decision

An authority-dependent Decision Context operation must re-resolve every `AuthoritativeStateReference` through a reader bound at validator construction:

```ts
const validator = createBoundDecisionContextAuthorityValidator(reader);
await validator.validate(context); // Promise<void>
```

The validator captures the reader resolve method with its receiver once. For each call it captures the complete context into detached data, applies `assertDecisionContextDraft`, and resolves the captured canonical source references in order. It requires each returned resolution reference to equal the requested producer ID, authority-contract ID, artifact ID, and locator exactly.

Successful validation returns `Promise<void>`. It intentionally creates no certificate, authority token, reusable resolution bundle, validated context artifact, or persistence record. Any later operation requiring authority must resolve again through its own bound dependency.

```text
AUTHORITY REACHABILITY != SEMANTIC EVIDENCE BINDING
```

Payloads are ignored. The gate does not claim item support, evidence binding, contradiction, gap, dependency, consequence, completeness, recommendation, or human adoption. An empty source-reference inventory succeeds because no reference needs resolution; that says nothing about context completeness.

## Evidence

- `lib/decision-core/validation/authority.ts` captures the context, invokes the Phase-5B assertion, binds reader resolution, compares returned references, and returns void.
- `test/decision-core/validation/authority.test.ts` covers empty and multiple inventories, canonical exact-once order, detached references, reader method mutation/receiver binding, caller mutation after validation starts, hostile context rejection, malformed contexts before calls, returned-reference mismatch, payload opacity, unrelated payload shapes, void return, public export exclusion, and generic import isolation.

## Consequence

Phase 5C1 establishes current reachability through the configured authority boundary, not semantic support. Semantic evidence binding, gaps, contradictions, dependencies, consequences, validation assembly, immutable context persistence, revision lineage, recommendations, human decisions, actions, outcomes, and feedback are not introduced by Phase 5C1 and remain outside this ADR.
