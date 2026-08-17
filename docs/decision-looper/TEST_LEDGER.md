# CONDYN Career Analysis Protocol v4.0

## PHASE 4: DECISION LIFECYCLE PERSISTENCE

### 004A Persistence Semantic Integrity
✅ CLOSED - Implemented declarative persistence bounds using Drizzle ORM to ensure exact storage mappings without implicit coercions.

### 004B Immutable Lifecycle Persistence
✅ CLOSED - Implemented `idempotentSave` with `payload_hash` uniqueness constraints and immutable JSONB semantics in `LifecycleRepository`.

### 004C Restart & Lineage Reconstruction
✅ CLOSED - Implemented `LifecycleRecoveryService` to reconstruct entire DAGs from DB history via hash-validated references, with zero fallback to inference/LLM.

### 004D Atomic Policy Activation
✅ CLOSED - Decoupled `PolicyVersion` from activation state. Implemented `PolicyFamilyHead` and `PolicyPromotionRecord` in PostgreSQL with Compare-And-Swap (CAS) locking in `LifecycleRepository.promotePolicy()`. Verified transaction atomicity and idempotent retries via `test/career-policy-activation-atomicity.test.ts`.

### 004E Global Idempotency & Concurrency Boundary
✅ CLOSED - Implemented physical PostgreSQL `23505` constraint catching in `LifecycleRepository.idempotentSave()`. Proved that concurrent identical payloads seamlessly deduplicate, while concurrent conflicting payloads strictly return `ERR_IMMUTABLE_RECORD_CONFLICT`. Enforced "DUPLICATE DELIVERY ≠ DUPLICATE REALITY".

---
**PHASE 4 PERSISTENCE & RECOVERY → COMPLETE / ARCHITECTURE FREEZE**

---

## PHASE 5: ASYNC EXECUTION & ORCHESTRATION

### 005A Durable Async Job Contract
✅ CLOSED - Implemented `career_analysis_jobs` in PostgreSQL acting as the operational queue. Verified durable inputs and constrained transitions (e.g. `SUCCEEDED` requires a verified canonical `Analysis` via `resultAnalysisId`). Enforced the "JOB ≠ ANALYSIS ≠ DECISION" invariant.

### 005B Worker Claim / Lease / Retry Boundary
✅ CLOSED - Implemented concurrent lease fencing using monotonic `leaseVersion` tokens and PostgreSQL `FOR UPDATE SKIP LOCKED`. Verified stale workers cannot mutate canonical truth, leases can expire and be reclaimed cleanly, and retries are bounded via explicitly configured attempt caps.

### 005C Async API Orchestration & HTTP Decoupling
✅ CLOSED - Refactored `POST /api/career/analyze` to return `202 Accepted` immediately. Implemented decoupled `GET /api/career/jobs/:jobId` polling endpoint. Rewrote 16 legacy regression tests by bifurcating into pipeline-domain tests (Category A) and E2E orchestration tests (Category C), maintaining 100% test coverage without degrading legacy HTTP bounds. Idempotency guarantees validated.

**TEST RUN**: 482 passed | 8 skipped (490 tests across 102 suites)
**BUILD**: npm run build → PASS
