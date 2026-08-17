# Async Job Execution

The Decision Looper is an expensive intelligence engine. To support real-world workflows without blocking HTTP requests or losing work due to server death, Phase 5 introduces the **Durable Async Job Contract**.

## The Invariant

**`JOB ≠ ANALYSIS ≠ DECISION`**

A Job is merely an operational record indicating work was requested. It does not carry the semantic weight of a verified Analysis, nor the historical truth of a Decision.

## Durable Acknowledgement

CONDYN will only acknowledge a request (e.g., returning HTTP 202 Accepted) if and only if:
1. The Job record is durable in PostgreSQL.
2. The entire input required to execute the job (the "Execution Input Snapshot") is fully durable.

If the server dies milliseconds after returning 202, the work will not be lost.

## Operational Queue in PostgreSQL

Jobs are tracked in `career_analysis_jobs` via PostgreSQL:
- **`jobId`**: Unique identifier for the run.
- **`idempotencyKey`**: Enforces exactly-once operational boundaries. Retries of identical requests yield the same job.
- **`inputRef`**: Durable payload snapshots (e.g., base64 PDF bytes, literal text) preventing "dangling" inputs where the input file was held in transient memory.
- **`status`**: PENDING → RUNNING → SUCCEEDED | FAILED.
- **`resultAnalysisId`**: A strict foreign key reference to the canonical `career_analyses` table, enforcing that a job cannot claim success without a validated, durable domain artifact.

## State Transitions

Unlike canonical decisions (which are strictly append-only), Jobs are **operational mutable state**.
Transitions are validated:
- `PENDING` → `RUNNING`
- `RUNNING` → `SUCCEEDED` (only valid if `resultAnalysisId` points to an existing verified Analysis)
- `RUNNING` → `FAILED` (captures error details without polluting the domain graph)

## Worker Claims & Lease Fencing (Phase 5)

To safely distribute jobs across multiple workers without producing duplicate truth, the architecture enforces **Lease Fencing**.

**`CLAIM ≠ OWNERSHIP`**
A worker receives temporary execution authority only. The PostgreSQL job record remains the sole operational authority.

### The Fencing Token (`leaseVersion`)
When a worker claims a job, it receives a monotonic `leaseVersion`. Any state-changing operation (heartbeat, completion, failure) strictly requires this exact version.
If a worker becomes stale (e.g. network partition) and its lease expires, another worker will reclaim the job and increment the `leaseVersion`. When the stale worker awakes and tries to commit its result, PostgreSQL structurally rejects the mutation (`ERR_STALE_JOB_LEASE`).

### Retries & Failure Classification
Jobs have configurable attempt boundaries (e.g., `MAX_JOB_ATTEMPTS`).
- **Retryable Failures** (e.g., network timeout) release the lease, allowing the job to be reclaimed up to the maximum attempt count.
- **Terminal Failures** (e.g., deterministic payload invalidity) or exhausting the attempt limit immediately transitions the job to `FAILED`.

An execution failure simply releases the lock or marks operational failure; it **never** manufactures divergent canonical reality or generates broken graph subsets.
