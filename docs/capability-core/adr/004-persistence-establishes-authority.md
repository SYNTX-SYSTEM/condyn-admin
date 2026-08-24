# ADR 004: Persistence establishes authority

## Status

Implemented.

## Decision

Persistence alone does not make an arbitrary artifact authoritative. For the governed Phase-4 publication path, authority requires:

1. deterministic authentication of the supplied Source/RUN/CONV/VFY chain;
2. lookup through the trusted repository dependency; and
3. exact equality between the authenticated RUN, CONV, and VFY artifacts and their persisted repository counterparts.

```text
AUTHENTICATED
+
EXACT PERSISTED EQUALITY
=
AUTHORITATIVE FOR PUBLICATION
```

This is not an assertion that persisted artifacts are intrinsically valid, semantically true, or authoritative without authentication.

### Four distinct states

| State | Meaning | Insufficient because |
| --- | --- | --- |
| Valid / internally consistent | An artifact satisfies its structural and self-integrity checks. | It may not bind to its upstream artifacts or to repository state. |
| Authenticated | Deterministic reconstruction, cross-artifact bindings, evidence re-verification, coverage, and eligibility derivation have succeeded. | The caller-supplied artifacts may still not be the repository-selected immutable states. |
| Persisted | An artifact exists in a repository record under an identity. | A row with an ID does not by itself prove equality with the authenticated artifact or semantic correctness. |
| Authoritative | Authenticated RUN, CONV, and VFY artifacts exactly equal their trusted persisted counterparts. | This selects the artifact state allowed to govern Phase-4 publication; it does not establish epistemic correctness of semantic judgments. |

`AUTHORITY != EPISTEMIC CORRECTNESS`. In particular, persistence does not prove that a semantic VFY judgment is true.

### Runtime authority path

The runtime establishes authority in this order:

```text
CapabilityVerificationIntegrityInput
-> authenticateCapabilityVerificationRun(...)
-> AuthenticatedCapabilityVerificationChain
-> repository.getRunById(authenticated RUN ID)
-> repository.getConvergenceRunById(authenticated CONV ID)
-> require persisted RUN to exist
-> require persisted CONV to exist
-> exact deep equality: persisted RUN == authenticated RUN
-> exact deep equality: persisted CONV == authenticated CONV
-> requireAuthoritativePersistedCapabilityVerificationRun(
     authenticated VFY,
     repository
   )
   -> assert supplied VFY self-integrity/persistability
   -> repository.getVerificationRunById(VFY ID)
   -> require persisted VFY to exist
   -> assert persisted VFY self-integrity/persistability
   -> exact deep equality: persisted VFY == supplied/authenticated VFY
   -> return persisted VFY clone
-> final VFY equality defense in authenticator
-> AuthoritativeCapabilityVerificationChain
-> final Phase-4 construction/publication
```


### Trusted repository dependency

`CapabilityVerificationIntegrityInput` contains only:

- `sourceDocuments`;
- `discoveryRun`;
- `convergenceRun`; and
- `verificationRun`.

It does not contain a repository. The exported `authenticatePersistedCapabilityVerificationRun(input, repository)` accepts a repository dependency explicitly; when invoked independently, its authority result is relative to that supplied dependency. The result is descriptive of persisted authentication, not a caller-portable publication capability. Within the supported Capability Core API of the shipped concrete repositories, the final publisher is created by `repository.createVerifiedCapabilitySnapshotPublisher()` and captures its repository dependency at construction time. Caller-supplied artifacts are integrity input; the bound repository is a trusted application dependency for that publication call. This does not make the repository cryptographically trusted or its contents intrinsically true; it fixes the dependency used to select immutable state.

### Exact equality includes identity-excluded state

Comparing IDs alone is insufficient. RUN, CONV, and VFY identities intentionally exclude portions of their own artifact state, including timestamps and payload/output state as specified by ADR-002. The persisted authority check deep-compares the complete authenticated artifact with the persisted one.

The contract tests cover rejection of:

- Discovery `createdAt` divergence;
- Discovery `completedAt` divergence;
- Convergence `createdAt` divergence;
- Convergence `completedAt` divergence;
- a Convergence-created relation timestamp divergence;
- VFY `createdAt` divergence;
- VFY `completedAt` divergence; and
- VFY payload divergence.

Identity selects the persistence lookup key; exact artifact equality selects the authoritative state.

### Immutability and authority are distinct

Repository save paths enforce:

```text
same identity + exactly equal artifact -> idempotent replay
same identity + divergent artifact    -> immutable conflict
```

Persisted authentication separately enforces:

```text
authenticated artifact
+
exact equality with the already persisted artifact
-> authoritative artifact for publication
```

Immutable-write behavior prevents replacement. Persisted authentication selects which immutable state governs publication.

### Failure semantics

When trusted repository lookup returns a missing RUN, CONV, or VFY, or a record that is not exactly equal to its authenticated counterpart, persisted authority is not established. The public authority path fails with:

```text
ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID
```

Repository operation failures are different. Exceptions thrown by the authority dependency's `getRunById`, `getConvergenceRunById`, or `getVerificationRunById` are not globally caught and normalized by `authenticatePersistedCapabilityVerificationRun`; those dependency exceptions may propagate.

Within the supported Capability Core API of the shipped concrete repositories, Phase-4 publication requires authoritative persisted equality for RUN, CONV, and VFY before final snapshot construction or persistence. A missing authority artifact prevents any Phase-4 snapshot write.

## Evidence

- `verification/authenticator.ts` performs authentication, then persisted RUN/CONV/VFY equality and `AuthoritativeCapabilityVerificationChain` construction.
- `verification/run.ts` provides VFY self-integrity and exact persisted VFY authority.
- `verification/types.ts` distinguishes `AuthenticatedCapabilityVerificationChain`, `AuthoritativeCapabilityVerificationChain`, and the trusted repository dependency.
- `repository.ts` supplies the repository-bound publisher and immutable persistence routes.
- `verification/integrity-contract.test.ts` covers authenticated-versus-authoritative behavior, missing persisted artifacts, and full-artifact divergence rejection.
- `verification/repository-contract.test.ts` covers idempotent VFY replay, divergent same-ID conflicts, and persisted VFY authority.
- `verification/phase4-contract.test.ts` covers the repository-bound publisher, repository-free integrity input, and the requirement for persisted RUN, CONV, and VFY before a snapshot write.

## Consequence

The authority established here is the authoritative artifact state for the governed Phase-4 publication path. It answers which authenticated artifact state is allowed to govern publication; it does not answer whether every semantic judgment inside that artifact is epistemically correct.

The implemented scope checks are:

1. A structurally valid caller-supplied VFY cannot authorize publication without persistence.
2. An authenticated chain cannot authorize publication without persisted RUN/CONV/VFY equality.
3. `CapabilityVerificationIntegrityInput` cannot supply the repository used to establish authority.
4. A matching artifact ID alone does not establish authority.
5. Exact equality includes timestamps and payload state.
6. Two divergent artifacts cannot legitimately be persisted under the same immutable identity.
7. Persistence does not prove semantic correctness.
8. Persisted authority selects the artifact state that governs Phase-4 publication.
9. RUN, CONV, and VFY are all required.
10. A missing persisted artifact fails authority before snapshot publication.
11. Repository I/O exceptions are not guaranteed to become `ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID`; dependency exceptions may propagate.
12. Authenticated is not equivalent to Authoritative.
