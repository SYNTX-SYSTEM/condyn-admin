# Decision Looper Architecture

This document describes the architecture of the Decision Looper within the CONDYN ecosystem. The Decision Looper acts as the core intelligence engine linking evidence back to policy promotion.

## Overview

The Decision Looper executes a continuous feedback loop:
1. **Inference & Recommendation**: Given requirements, analyze candidate fits and output structured explanations (Fit & Explainability).
2. **Decision & Action**: Recommendations are converted to decisions, which spawn commitments and actions.
3. **Outcome & Feedback**: Real-world outcomes of actions are captured and evaluated (desirable, undesirable, neutral).
4. **Attribution & Learning**: Feedback is attributed back to the original graph features, proposing adjustments to policy.
5. **Replay & Promotion**: Proposed policies are evaluated against historical traces to ensure improvement before being promoted.

## Core Pipelines

- **Analysis Pipeline (`lib/career/`)**: Drives inference using the SYNTX Semantic Interface Language. Converts physical evidence into the canonical graph, producing Requirements, Roles, and Measurements.
- **Decision Pipeline (`lib/career/decisions/`)**: Manages the temporal realities of actions and feedback. Artifacts traverse a strict, one-way lineage:
  `Recommendation` → `Decision` → `Commitment` → `Action` → `Outcome` → `Feedback` → `Attribution`
- **Learning & Policy Pipeline (`lib/career/decisions/learning.ts`, `policy.ts`)**: Feedback triggers Learning Proposals which test Candidate Policies. Historical traces are replayed to avoid black-box mutation.
- **Execution & Orchestration (`lib/career/orchestration/`)**: (Phase 5) Enforces the "JOB ≠ ANALYSIS ≠ DECISION" invariant, providing operational durability to long-running tasks without conflating task execution state with canonical graph truth. Implements strictly monotonic **Lease Fencing** to ensure that `CLAIM ≠ OWNERSHIP`; stale workers can never mutate truth if their lease has expired and been reclaimed by another process.

## Storage and Persistence

- **Idempotency & Immutability**: All records are treated as append-only. Once an artifact is persisted, any attempt to overwrite it with a divergent payload throws `ERR_IMMUTABLE_RECORD_CONFLICT`.
- **Database (`lib/career/db/`)**: Uses PostgreSQL via Drizzle ORM to maintain strict relational lineage (Foreign Keys) alongside flexible canonical JSONB storage, allowing deterministic payload hashing.
- **Concurrency & External Duplicate Delivery**: The architecture supports multi-process scalability and acknowledges that networks are at-least-once. It maintains integrity not by relying on exactly-once network transport, but by enforcing effectively-once historical truth through PostgreSQL constraint handling.

## Memory & Recovery
- **Process Memory is NOT Durable**: The Decision Looper caches recommendations and active policies in memory for performance, but the system's "memory" is defined strictly by the durable state in PostgreSQL.
- **Lineage Reconstruction (`lib/career/repositories/recovery.ts`)**: The system can objectively reconstruct the complete historical trace of a terminal event (e.g., an Attribution) back to its original Source Evidence across a cold restart, strictly without generating new IDs, modifying history, or triggering new LLM inference calls. Recovery reads history; it does not rewrite it.
