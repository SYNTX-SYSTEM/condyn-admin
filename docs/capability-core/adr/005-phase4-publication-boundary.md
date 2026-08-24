# ADR 005: Phase-4 publication is repository-bound and privately persisted

## Status

Implemented.

## Decision

This ADR describes the supported Capability Core publication API implemented by the shipped `InMemoryCapabilityCoreRepository` and `PostgresCapabilityCoreRepository`. Within that supported public API, callers receive no direct Phase-4 persistence capability.

This is an application/API capability boundary, not a hostile same-process JavaScript sandbox or cryptographic isolation boundary. Code that deliberately bypasses supported APIs, defeats TypeScript visibility, directly accesses infrastructure, or supplies a different repository implementation is outside this ADR's guarantee.

`CapabilityCoreRepository` is an interface. Interface conformance alone does not prove that an arbitrary external implementation preserves the Phase-4 publication invariant. The guarantee documented here is supplied by the shipped InMemory and Postgres concrete repositories, each of which creates its publisher from its own bound repository state.

### Supported public publisher API

`CapabilityCoreRepository` publicly exposes:

```text
createVerifiedCapabilitySnapshotPublisher()
```

The returned `VerifiedCapabilitySnapshotPublisher` exposes only:

```text
publish(input: CapabilityVerificationIntegrityInput)
```

`CapabilityVerificationIntegrityInput` contains:

- `sourceDocuments`;
- `discoveryRun`;
- `convergenceRun`; and
- `verificationRun`.

It does not contain final capabilities, a final evidence inventory, final relations, publication metadata, a final snapshot, a persistence callback, or a repository dependency. Final graph and publication state are therefore not caller supplied through the supported publisher contract.

### Bound construction and private persistence

The bound publisher follows this path:

```text
raw integrity input
-> authenticatePersistedCapabilityVerificationRun(...)
-> AuthoritativeCapabilityVerificationChain
-> constructPhase4Snapshot(...)
```

`constructPhase4Snapshot` deterministically derives final CAP identities and state, the exact verified EVD inventory, the promoted VERIFIED REL graph, Phase-4 metadata, and Phase-4 SNAP identity from the authoritative chain. Caller-added runtime properties such as `capabilities`, `evidence`, `relations`, or `publication` are not consumed by the publisher; the Phase-4 contract tests inject these fields and verify that the final graph remains internally derived.

Each shipped concrete repository owns `#persistPhase4VerifiedSnapshot(...)`, using JavaScript-private runtime syntax. `createVerifiedCapabilitySnapshotPublisher()` captures a closure that can invoke that private method. The caller receives the publisher object, but not the private persistence callback.

No free exported Phase-4 writer, store, or factory is provided by `capability-core/index.ts`, `verification/index.ts`, or `repository.ts`. The Phase-4 capability boundary is the JavaScript-private `#persistPhase4VerifiedSnapshot` method and the repository-controlled publisher closure, not a TypeScript-private `saveSnapshotImmutable` implementation detail.

### Shared storage versus publication routes

The two snapshot routes are deliberately separate:

```text
Generic route
saveSnapshot(snapshot)
-> assertGenericSnapshotRoute(snapshot)
-> reject publication.mode == PHASE4_VERIFIED
-> shared immutable snapshot persistence
```

```text
Phase-4 route
bound publisher
-> authoritative chain
-> internally constructed Phase-4 snapshot
-> #persistPhase4VerifiedSnapshot(snapshot)
-> assertPhase4SnapshotRoute(snapshot)
-> shared immutable snapshot persistence
```

`assertGenericSnapshotRoute` rejects `PHASE4_VERIFIED` publication and validates snapshot integrity. `assertPhase4SnapshotRoute` requires `PHASE4_VERIFIED` publication and validates snapshot integrity. The latter does not independently authenticate RUN/CONV/VFY authority; persisted authority was established earlier by the bound publisher. The private route is safe within the supported API because the capability to invoke it is retained by the concrete repository/publisher closure.

The shared `saveSnapshotImmutable` implementation is storage machinery, not the publication authority boundary. A caller-built `PHASE4_VERIFIED` snapshot supplied through public `saveSnapshot()` fails with:

```text
ERR_PHASE4_SNAPSHOT_REQUIRES_DEDICATED_REPOSITORY
```

The public generic route cannot serve as an alternate Phase-4 write route.

### Immutable persistence and post-write reread

The shared persistence layer computes the snapshot key and enforces:

```text
same snapshot key + exactly equal artifact -> idempotent replay
same snapshot key + divergent artifact    -> ERR_IMMUTABLE_SNAPSHOT_CONFLICT
```

This storage rule is separate from publication authorization.

After `#persistPhase4VerifiedSnapshot(expected)` returns successfully, the publisher recomputes and reads `computeSnapshotKey(expected)`, requires the persisted snapshot to exist and deeply equal `expected`, then returns `structuredClone(persisted)`. Therefore:

```text
AUTHORITATIVE CONSTRUCTION
+
PRIVATE IMMUTABLE PERSISTENCE
+
EXACT REREAD
=
RETURNABLE PHASE-4 SNAPSHOT
```

A successful persistence call does not alone produce a successful publication return.

Failure classes remain distinct:

- If the private persistence call throws, its original persistence/dependency exception propagates; the successful-persist-reread condition was not reached.
- If the private persistence call returns successfully, but the subsequent reread is missing or is not exactly equal to expected, the publisher throws `ERR_PHASE4_SNAPSHOT_PERSISTENCE_INVALID`.
- If an identical snapshot key already identifies divergent persisted payload, immutable storage may throw `ERR_IMMUTABLE_SNAPSHOT_CONFLICT`.

The publisher returns `structuredClone(persisted)`, not the expected pre-persistence object or a live repository reference. Mutating the returned object cannot mutate persisted snapshot state through that reference.

## Evidence

- `repository.ts` contains the private `createBoundVerifiedCapabilitySnapshotPublisher` helper, `#persistPhase4VerifiedSnapshot` in both concrete repositories, generic `saveSnapshot` rejection, shared immutable snapshot persistence, and the post-write reread/deep-equality/clone sequence.
- `capability-core/index.ts` exports the concrete repository classes and interface but no raw Phase-4 writer, store, or factory.
- `verification/index.ts` exports verification types, schema, run, and authenticator surfaces but no free publisher factory.
- `verification/types.ts` defines a publisher that accepts only `CapabilityVerificationIntegrityInput`.
- `verification/phase4-contract.test.ts` covers the absence of a public Phase-4 writer/store/factory, the repository-bound publisher, ignored caller-built graph/publication fields, persisted upstream authority, generic Phase-4 save rejection, successful persistence/reread/replay, detached returned snapshots, successful private persistence followed by missing reread, and propagation of a private persistence exception.

## Consequence

Within the supported public API:

1. Public `saveSnapshot` cannot persist `PHASE4_VERIFIED`.
2. Publisher callers cannot submit a final snapshot or final CAP/EVD/REL/publication state through typed input.
3. Final state is built from `AuthoritativeCapabilityVerificationChain`.
4. `#persistPhase4VerifiedSnapshot` is JavaScript-private.
5. `saveSnapshotImmutable` is not itself the publication capability boundary.
6. No raw Phase-4 writer, store, or factory is exported from the supplied Capability Core modules.
7. A successful persistence call does not immediately return the snapshot; a successful exact reread is required.
8. The returned artifact is detached from repository state.
9. `ERR_PHASE4_SNAPSHOT_PERSISTENCE_INVALID` does not mean every persistence exception; the original private-persistence exception may propagate.
10. This ADR does not guarantee hostile same-process isolation against reflection or direct infrastructure access, and it does not automatically extend to arbitrary third-party repository implementations.
