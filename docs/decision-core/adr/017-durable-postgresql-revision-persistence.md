# ADR 017: PostgreSQL durably implements sealed revision authority semantics

## Status

Implemented.

Implementation: `96083e677767e21b36b636258abb20ebf293b0fc` / `v1.0.0-decision-core-phase5d2b-postgres-persistence`.

## Context

Phase 5D1 defines a self-contained canonical `DecisionContextRevision`; Phase 5D2A defines repository-bound immutable authority-of-record semantics and supplies an in-memory reference implementation. An in-memory implementation cannot establish database-backed survival beyond one repository/client instance. A durable adapter must implement the sealed 5D2A operation without moving PostgreSQL, Drizzle, Career DB, or application bootstrap concerns into generic Decision Core.

During 5D2B integration, PostgreSQL JSONB key normalization exposed a sealed 5C4 stored-assembly portability defect: serialization-order-sensitive equality rejected structurally identical object state. A narrow non-PostgreSQL RED regression isolated the defect before correction. The targeted correction changed only equality to recursive structural data equality: primitive values remain exact, arrays remain order-sensitive, and object key order is ignored while key set and values remain exact. No 5C4 artifact shape, identity, ontology, public API, or derivation behavior was redesigned.

## Decision

The PostgreSQL adapter lives outside the kernel:

```text
lib/decision-adapters/revision-persistence
  -> lib/decision-core/revision-persistence
  -> lib/decision-core/revisions
```

`PostgresDecisionContextRevisionRepository` receives a configured `PostgresJsDatabase`. It exposes only `getRevisionById(...)` and `createDecisionContextRevisionPersister()`; the supported write path remains `repository -> createDecisionContextRevisionPersister() -> persist(revision)`. Its `#writeRevision(...)` and `decisionContextRevisions` Drizzle descriptor are implementation details. The adapter neither reads `DATABASE_URL` nor creates pools, databases, tables, or migrations.

The physical table is `decision_context_revisions` with `revision_id TEXT PRIMARY KEY`, nullable non-unique `previous_revision_id TEXT` self-referencing `revision_id` with non-cascading deletion, and `payload JSONB NOT NULL`. No payload hash, timestamp, revision number, branch, head/latest/current/active/superseded field exists.

Every accepted row must satisfy physical/embedded consistency:

```text
requested revision ID == row.revision_id, where supplied
row.revision_id == payload.revisionId
row.previous_revision_id == payload.previousRevisionId
```

Reads capture and sealed-assert the exact persisted JSONB artifact before checking those identities and returning a detached copy. `READ != RECONSTRUCT != REPAIR`; malformed, noncanonical, or inconsistent rows fail `ERR_DECISION_CONTEXT_REVISION_POSTGRES_RECORD_INVALID`.

The runtime-private writer uses `INSERT ... ON CONFLICT DO NOTHING ... RETURNING`. A conflicting key triggers a durable race reread: exact complete artifact is idempotent replay; divergent complete state is `ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT`. This is not a payload-hash rule: `DREV_` is lookup identity while complete artifact equality, including identity-excluded EBIND rationale, chooses immutable state.

The adapter reuses sealed 5D2A persister composition. Its conflict-race reread answers which state won the physical uniqueness race; the inherited final 5D2A reread separately answers whether exact complete repository state permits the authority-of-record operation to return. `POSTGRES RACE REREAD != 5D2A AUTHORITY REREAD`.

For children, sealed application-level immediate-parent validation and the physical self foreign key are both required. Neither traverses ancestry or proves full lineage. Forks and no-change children remain valid; no branch-selection policy is introduced.

## Consequences

The supported PostgreSQL path implements the sealed equation:

```text
VALID CANONICAL DREV
  + BOUND REPOSITORY/PERSISTER
  + IMMEDIATE PARENT INTEGRITY
  + IMMUTABLE WRITE
  + EXACT POST-WRITE REREAD
  + EXACT COMPLETE-ARTIFACT EQUALITY
  = REPOSITORY-SELECTED AUTHORITY OF RECORD FOR THIS DREV ID DURING THIS OPERATION
```

PostgreSQL adds physical referential integrity, database-race-safe immutable insert, and database-backed survival across repository/client reconstruction. It does not establish truth, semantic correctness, current producer authority, current decision state, head/latest/active selection, causation, full lineage reconstruction, Decision Need, recommendation, human decision, action, outcome, or feedback.

`ERR_DECISION_CONTEXT_REVISION_POSTGRES_RECORD_INVALID` owns an existing physical row whose durable representation cannot be accepted. Arbitrary connectivity, driver, or database failures are not normalized to that error. A parent absent during one operation is `ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND`; there is no wait, polling, automatic retry, or eventual-consistency interpretation.

The focused integration suite uses isolated schemas and derives test DDL from the actual internal Drizzle descriptor. Two independent postgres.js clients prove database uniqueness rather than JavaScript-instance serialization. The test boundary is database-backed survival across repository/client reconstruction; it does not claim literal OS-process crash recovery, machine restart, backups, replication, disaster recovery, or infinite permanence.

Phase 5D3 now reconstructs one explicit predecessor path read-only through the existing generic `getRevisionById(...)` capability; it does not add a PostgreSQL-specific lineage query or alter this durable adapter.

## Evidence

- `lib/decision-adapters/revision-persistence/postgres-schema.ts`
- `lib/decision-adapters/revision-persistence/postgres.ts`
- `lib/decision-adapters/revision-persistence/index.ts`
- `lib/decision-core/validation-assembly/reconstruct.ts`
- `test/decision-adapters/revision-persistence/postgres.test.ts`
- `test/decision-core/validation-assembly/assembly.test.ts`
