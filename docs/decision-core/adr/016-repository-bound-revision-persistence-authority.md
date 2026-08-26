# ADR 016: Repository-bound immutable persistence establishes authority of record, not truth

## Status

Implemented.

## Context

Phase 5D1 provides a self-contained canonical `DecisionContextRevision`, but a valid DREV artifact alone is not persistence, parent existence, authority of record, or truth. The next boundary must select one complete artifact state for a DREV without turning a repository implementation, a raw writer, or an identity string into a truth claim.

`DREV_` intentionally does not commit every embedded payload field. For example, canonical EBIND rationale may differ while EBIND, `DVASM_`, and `DREV_` identities remain the same. A persistence boundary therefore needs complete-artifact equality in addition to the DREV record key.

## Decision

Phase 5D2A adds the adjacent `lib/decision-core/revision-persistence/` module. `DecisionContextRevisionRepository` defines the supported read/factory capability shape; `INTERFACE CONFORMANCE != PHASE-5D2A GOVERNANCE GUARANTEE`. The shipped `InMemoryDecisionContextRevisionRepository`, together with its bound persister path and internal composition logic, enforces the documented behavior. This is the supported public capability path:

```text
InMemoryDecisionContextRevisionRepository
  -> createDecisionContextRevisionPersister()
  -> BoundDecisionContextRevisionPersister.persist(revision)
```

The authority equation is:

```text
VALID CANONICAL DREV
  + BOUND SHIPPED REPOSITORY/PERSISTER
  + IMMEDIATE PARENT INTEGRITY
  + IMMUTABLE WRITE
  + EXACT POST-WRITE REREAD
  + EXACT COMPLETE-ARTIFACT EQUALITY
  = REPOSITORY-SELECTED AUTHORITY OF RECORD FOR THIS DREV ID DURING THIS OPERATION
```

The in-memory reference implementation owns a runtime-private `#writeRevision(...)`. That method is storage machinery, not public raw write capability and not the authority boundary. The application/API boundary is the bound persister operation; this is not a claim of cryptographic isolation or a hostile same-process sandbox. The internal `createBoundDecisionContextRevisionPersister(...)` composition helper is not exported from the `revision-persistence` public barrel or the Decision Core root barrel; deep-import accessibility is not a supported write capability.

Each `persist(...)` occurrence captures and sealed-asserts one pristine detached expected revision before repository awaits. The writer receives a detached clone. The exact post-write reread is sealed-asserted and compared with the pristine expected complete artifact, so writer mutation cannot change the authority comparison baseline.

Roots (`previousRevisionId === null`) perform no parent lookup. Children require exactly one immediate parent lookup before write; that parent must exist, pass sealed revision assertion, and match the requested ID. No parent-of-parent lookup, graph traversal, semantic-continuity requirement, or head selection occurs.

Forks are valid: more than one child may name a persisted parent. A child may preserve the parent context and assembly identities. `LINEAGE INTEGRITY != BRANCH SELECTION POLICY`, and `NEW REVISION != REQUIRED SEMANTIC CHANGE`.

Exact replay of the same complete revision is idempotent. The same DREV with a divergent complete artifact fails immutable conflict. After every successful private write, the persister rereads the expected DREV and requires exact revision-ID and complete-artifact equality before returning a detached reread artifact.

## Consequences

Successful persistence through the shipped in-memory path establishes only operation-relative repository-selected authority of record for the exact complete artifact. It does not establish truth, semantic correctness, current producer authority, current decision state, head/latest/active selection, causation, Decision Need, recommendation, human decision, action, outcome, or feedback. Revision authority of record is not current authority of referenced producer state: 5D2A reads revision records, but does not re-run producer resolution or inspect producer payloads.

`ERR_DECISION_CONTEXT_REVISION_REPOSITORY_INVALID` owns invalid persister composition. `ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND` and `ERR_DECISION_CONTEXT_REVISION_PARENT_INVALID` own immediate-parent failures. `ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT` owns same-ID divergent complete state. `ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID` is reserved for a write reported successful whose reread cannot establish exact complete equality. Underlying dependency exceptions may propagate.

`InMemoryDecisionContextRevisionRepository` enforces the shipped repository-bound authority semantics, not durable persistence, process-restart survival, transaction isolation, database foreign keys, Postgres race behavior, or cold restart. Phase 5D2B now realizes the durable PostgreSQL implementation of these sealed semantics outside generic Decision Core, including physical self-FK integrity and database-backed survival across repository/client reconstruction. This in-memory implementation remains limited to its repository lifetime. Phase 5D3 now reconstructs one explicit predecessor path read-only through the existing generic read capability.

## Evidence

- `lib/decision-core/revision-persistence/types.ts` defines the public repository and bound-persister interfaces.
- `lib/decision-core/revision-persistence/persister.ts` implements bound dependencies, pristine expected snapshots, parent validation, and exact reread comparison.
- `lib/decision-core/revision-persistence/in-memory.ts` implements the in-memory reference repository and runtime-private immutable writer.
- `test/decision-core/revision-persistence/persister.test.ts` covers roots, parents, forks, no-change children, immutable replay/conflict, writer mutation isolation, exact reread, detached returns, and public/import boundaries.
- Sealed implementation: `6e6062f7da9eaa5e549c7d8169be119d05d95df0`, tag `v1.0.0-decision-core-phase5d2a-persistence-authority`.
