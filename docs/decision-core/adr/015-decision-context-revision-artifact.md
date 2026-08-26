# ADR 015: Decision Context revisions are self-contained artifacts, not persistence authority

## Status

Implemented.

## Context

`DecisionContextValidationAssembly` records canonical derivational coherence, but `DVASM_` alone does not contain the validation input needed to reconstruct that coherence. A later persistence boundary also needs a canonical artifact that can be validated without external caller-supplied derivation inputs.

That need must not turn a revision identity into repository authority, a semantic truth claim, parent existence, lineage traversal, or head selection. In particular:

```text
VALIDATED DERIVATION != PERSISTED AUTHORITY
REVISION ARTIFACT    != TRUTH
DCTX_                != DVASM_
DVASM_               != DREV_
DCTX_                != DREV_
```

## Decision

Phase 5D1 introduces the adjacent `lib/decision-core/revisions/` module and the detached canonical `DecisionContextRevision` artifact. It embeds exactly `previousRevisionId`, `context`, `validationInput`, and `validationAssembly`, together with the artifact header and computed `revisionId`. It exposes `createDecisionContextRevision(input)` and `assertDecisionContextRevision(revision)`; it exposes no repository API.

The revision is self-contained enough to invoke sealed `assertDecisionContextDraft(context)` and `assertDecisionContextValidationAssembly(context, validationInput, validationAssembly)` without external derivation artifacts. This is local revalidation state, not durable persistence or a proof of cold restart.

The identity is:

```ts
DREV_ + SHA256(JSON.stringify([
  "DECISION_CONTEXT_REVISION_V1",
  previousRevisionId,
  context.contextId,
  validationAssembly.assemblyId
])).slice(0, 24).toUpperCase()
```

`previousRevisionId: null` represents a root revision. A non-null value must have DREV representation shape, but 5D1 does not look up that parent, establish causation or semantic continuity, traverse a lineage, or choose a head.

The DREV tuple deliberately does not hash every embedded field. Therefore DREV identity is not the complete revision payload: a structurally valid EBIND rationale difference can retain EBIND identity, `DVASM_`, and `DREV_` while leaving distinct represented revision payload. Phase 5D1 permits this representation; it does not select one artifact state for a DREV identity.

Construction and stored assertion safely capture one detached operation-local snapshot. Validation input is canonicalized before embedding in the canonical revision artifact: expectation validations, EBIND binding inventories, dependency relation inventories, and consequence validations use their documented canonical sorts, while explicit `DEPENDENCY_PATH` relation order is preserved. The canonical assembly is reconstructed from the canonical input. Stored assertion compares detached captured stored revision representation with that reconstruction and never rereads caller-owned nested context, validation input, or validation assembly after capture.

## Consequences

Decision Core can now create and revalidate a canonical self-contained revision artifact without a repository. It does not thereby establish persistence, authority of record, current authority, truth, a parent record, head/latest/active/superseded state, recommendation, Decision Need, human decision, action, outcome, or feedback.

Phase 5D2A now partially realizes the planned repository-bound immutable persistence boundary: the shipped in-memory bound path may select one exact complete revision artifact as its immutable record state for a DREV through immediate-parent integrity, immutable write, and exact post-write reread. This does not change the Phase 5D1 decision itself or make a standalone revision authoritative. Phase 5D2B now implements the durable PostgreSQL adapter, while Phase 5D3 remains planned for read-only revision-lineage reconstruction. Database-backed survival across repository/client reconstruction is now implemented; a repository-selected immutable record state is not a truth claim.

## Evidence

- `lib/decision-core/revisions/types.ts` defines the public input and revision artifact.
- `lib/decision-core/revisions/identity.ts` defines deterministic `DREV_` construction.
- `lib/decision-core/revisions/contract.ts` captures and canonicalizes revision state, revalidates embedded derivation coherence, and asserts stored canonicality.
- `test/decision-core/revisions/contract.test.ts` covers root/child representation, identity, canonical ordering, path-order preservation, identity-excluded payload, detached snapshots, stored assertion, and genericity boundaries.
- The sealed implementation passed 7 focused Phase-5D1 tests, 177 Decision Core tests, 272 Capability Core tests, scoped TypeScript validation, clean predecessor diff, and clean diff checks. This does not claim repository-wide TypeScript is clean where unrelated Career errors remain.
