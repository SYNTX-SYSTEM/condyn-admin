# ADR 006: Authoritative state is consumed through bound producer contracts

## Status

Implemented.

## Decision

Decision Core consumes producer-governed state through a generic reader whose resolver dependencies are fixed at construction. A caller supplies only an `AuthoritativeStateReference`:

```ts
{
  producerId: string;
  authorityContractId: string;
  artifactId: string;
  locator: string;
}
```

The reference carries identity/locator data only. It cannot carry state payload, repository, resolver, or authority capability. Resolver selection is bound to the exact `producerId + authorityContractId` pair during `createBoundAuthoritativeStateReader(...)` construction.

```text
PAYLOAD ALONE != AUTHORITY
CALLER-HELD SHAPE != AUTHORITY
REFERENCE != AUTHORITY TOKEN
SUCCESSFUL RESOLUTION != PORTABLE AUTHORITY
```

The reader captures a resolver invocation with its receiver when constructed. Replacing `resolver.resolve` later cannot redirect that existing reader. It validates and captures the reference before resolver lookup and passes the resolver a detached reference value. The resulting `AuthoritativeStateResolution` is descriptive of one successful operation; no later public operation accepts it as proof of authority.

Producer-specific authority logic belongs in adapters/resolvers. This keeps generic Decision Core independent of Capability Core, Career, matching, recommendations, and legacy Career decision-loop types.

## Evidence

- `lib/decision-core/authority/types.ts` defines the reference, resolver, resolution, and bound-reader contracts.
- `lib/decision-core/authority/reader.ts` validates exact references, binds resolver methods, enforces the producer/contract map, and returns a detached resolution reference.
- `test/decision-core/authority/contract.test.ts` covers unrelated opaque payloads, strict references, unknown/duplicate bindings, reader mutation resistance, `this` binding, reference TOCTOU capture, generic import boundaries, and absence of legacy promotion.
- `lib/decision-adapters/capability-core.ts` is the current producer-specific integration. It validates a persisted Phase-4 snapshot and returns a detached payload without importing producer ontology into generic Decision Core.

## Consequence

The implemented guarantee is dependency-relative authority consumption: a reader resolves through the dependencies bound into that reader. It does not make arbitrary caller state authoritative, does not make a payload semantically correct, and does not turn a prior successful resolution into a portable capability.
