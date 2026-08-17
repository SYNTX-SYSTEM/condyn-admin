# Immutable Lifecycle Persistence

The Decision Looper mandates an **Append-Only Immutable Persistence Layer**. Because decisions represent historical truth in time, they can never be modified. 

## The Fundamental Law
Historical artifacts are created once and never updated. 

## Mechanism
- **Payload Hashing (SHA-256)**: Every time a lifecycle entity (Decision, Outcome, etc.) is saved, its payload is deterministically serialized and hashed.
- **Idempotency**: Saving the exact same object with the exact same ID is a safe no-op.
- **Hard Conflicts**: Attempting to save a modified payload to an existing ID results in an `ERR_IMMUTABLE_RECORD_CONFLICT`. No `ON CONFLICT DO UPDATE` operations are permitted in the Decision Looper lifecycle tables.

## Concurrency & Idempotency Boundary (DUPLICATE DELIVERY ≠ DUPLICATE REALITY)
The persistence layer catches physical unique constraint violations (`23505`) to handle simultaneous duplicate insertions. 
- **Effectively-Once Historical Truth**: We do not assume exactly-once network transport. At-least-once delivery combined with deterministic deduplication ensures only one historical fact is recorded.
- **Strict Race Guarantees**: A concurrent insertion with an identical payload seamlessly resolves idempotently, while an insertion with a conflicting payload deterministically fails without overwriting the previous winner.

## Lineage & Integrity
PostgreSQL Foreign Keys strictly enforce artifact lineage:
- A `Commitment` cannot exist without a valid `Decision`.
- An `Outcome` cannot exist without an `Action`.
- A `Feedback` cannot exist without an `Outcome`.

This guarantees that a loaded artifact trace is unbroken and verifiable.

## Operational Queue Persistence (Phase 5)
In contrast to immutable historical artifacts, operational queues (`career_analysis_jobs`) represent **mutable operational state**.
- Jobs may transition states (e.g. `PENDING` → `RUNNING`).
- Inputs must be snapshot and fully durable upon creation (`inputRef`) so that workers can survive a cold restart.
- Job success transitions must enforce a strict constraint connecting the mutable operational record to a validated, immutable canonical graph entity (e.g. `resultAnalysisId` must exist in `career_analyses`).
