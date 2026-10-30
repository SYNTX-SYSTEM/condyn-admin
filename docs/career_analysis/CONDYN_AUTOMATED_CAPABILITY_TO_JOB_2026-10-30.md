# CONDYN / DLL — automated product path: source → PERSON capabilities → authorized job pools → semantic matching → explainable job ranking → Capability Map

Owner mandate "SFE::AUTOMATED_CAPABILITY_TO_JOB_EXECUTE" (2026-10-30), **only this product path, nothing more**. Base: `main` 9fa2cdc. Branch `backend/auto-capability-path` (GELB backend), `frontend/auto-capability-path` (GRÜN), PINK validates independently and inversely.

## 1 Mandate boundaries (verbatim, binding for every lane)

1. Nichts Bestehendes beschädigen. 2. Testgetrieben, rekursiv und invers integrieren. 3. Alles dokumentieren. 4. **Nur diesen Produktpfad umsetzen. Keine zusätzlichen Features oder Nebenarbeiten.**
Model calls only inside an explicitly started analysis job and a fixed budget; no unreleased paid test runs. After the start of the analysis the processing runs through automatically: no manual repository selection, job selection or additional matching confirmation. Existing architecture and components only; no parallel implementations.

## 2 What exists and is reused (no second implementation)

| Step | Existing component |
|---|---|
| Intake | `SourceDock` → `POST /api/career/analyze` → job → worker (`career-analysis-job-processor`) |
| PERSON capabilities | worker: Discovery + Convergence (Gemini) → projection reference → `createCapabilityProposalProjectionReader` |
| Pools | `career_job_pool_uploads`, `createLocalJobPoolApplication` (`list`, `get`) |
| Lexical relation | `loadRoleDiscoveryOperand` + `buildPoolRoleDiscovery` (POOL_ROLE_DISCOVERY_V1) |
| Semantic relation | `runInvestigation` / `evaluateRole` / relation cache / call ledger / investigation store, `SemanticProvider` seam, `readSemanticConfig` |
| Explanation | cached relation: state, explanation, evidence limitation, cited source quotes |

## 3 New (additive) parts

### 3.1 GitHub account input (GELB)
`https://github.com/<user>` (one path segment) is accepted besides `https://github.com/<owner>/<repo>`. Selection is automatic and deterministic, bounded: the account's public repositories (`GET /users/<user>/repos?type=owner`), not forks, not archived, ordered by `pushed_at` desc then name, at most `GITHUB_ACCOUNT_MAX_REPOS` (default 5, hard cap 10); each is loaded by the existing repository loader. No new host: only `api.github.com` for `github.com`.

### 3.2 Real semantic provider (GELB)
`GeminiSemanticProvider implements SemanticProvider` (`provider: "gemini"`), one call per role, JSON output admitted by the unchanged strict admission (`admitProviderOutput`, claim guard). `readSemanticConfig`: `ROLE_DISCOVERY_SEMANTIC_PROVIDER=gemini` is READY only with `GEMINI_API_KEY` present **and** a plain-digit `ROLE_DISCOVERY_DAY_LIMIT` ≥ 1 (the call budget; fails closed to 0). `evidenceClass` REAL_GEMINI. `stand-in` stays executable and labelled. The route and the runner choose the provider through one factory.

### 3.3 Automatic match run (GELB)
After a PERSON analysis succeeded, the worker runs the **auto-match run** (a hook after `SUCCEEDED`, never failing the analysis job):
1. Operand: pools = all ACTIVE job pools at that moment (snapshot, deterministic order, at most 10) = "authorized job pools" of the mandate; recorded in the run.
2. Lexical discovery (read only) → role order by lexical status (all related, partial, weak, none), then deterministic order.
3. Budget: the first `min(maxRoles, 25, remaining day limit)` roles get a semantic evaluation (one call per role with pending pairs, cached pairs cost nothing), through the existing `runInvestigation` with `clientRequestId = auto:<analysisId>` (idempotent), `confirmedCalls = plan.callsNeeded` supplied by the runner. The remaining roles stay lexical-only and are marked so.
4. **No new table.** The run IS the semantic investigation of the existing engine, marked `auto: true` in its stored request (with `rolesTotal`), idempotent by `clientRequestId = auto:<analysisId>`. The state of the run is derived from it on read. (Decision during implementation: a second table would only have duplicated the investigation, the ledger and the task rows.)
Enabled only when `readSemanticConfig()` is READY (the provider setting is the single gate); otherwise state DISABLED and no call.

### 3.4 Explainable ranking (GELB) — `ROLE_RANKING_V1`
Pure function over discovery + cached semantic relations; read only, never a model call.
- Requirement value: semantic state EQUIVALENT/COVERS = 1, PARTIAL = 0.5, DIFFERENT/UNCLEAR = 0; roles/requirements without a semantic relation use the lexical basis only: NAME_EXACT/NAME_ALIAS = 0.5 (capped, marked LEXICAL), others 0.
- Requirement weight: necessity REQUIRED 3, PREFERRED 2, OPTIONAL 1, UNKNOWN 1.
- Role fit = Σ(weight × value) / Σ(weight). Tiers: roles with a semantic evaluation first (SEMANTIC), then LEXICAL_ONLY. Order inside a tier: fit desc, required gaps asc, title, role id (deterministic).
- Every rank carries its formula inputs per requirement (state, source, weight, contribution), the model explanation and evidence limitation, and the source quotes. Authority: `ranking: true`, `decision: false`, `authorityState: NONE`; the ranking is derived from unverified model statements and never a hiring decision.

### 3.4a Shared start (GELB)
The explicit start route and the automatic run both call `startSemanticInvestigation` (extracted unchanged from the route; PINK/own tests green): operand, role selection, cache, idempotency before confirmation, plan, open, ledger-reserved run. The run passes `confirmedCalls: "AS_PLANNED"`; the ledger (day limit shared with manual starts, plus the investigation limit) still reserves every call first.

### 3.5 Read APIs (GELB)
- `GET /api/career/analyses/{id}/auto-match` → `{ success, autoMatch: { state: NOT_STARTED | DISABLED | RUNNING | COMPLETED | PARTIAL | FAILED | SKIPPED, reason, evidenceClass, pools, budget: { rolesPlanned, rolesEvaluated, callsLimit }, investigationId, startedAt, finishedAt } }`
- `GET /api/career/analyses/{id}/job-ranking` → `{ success, ranking: ROLE_RANKING_V1 }` (computed on read for the pool snapshot of the run, or all ACTIVE pools if no run exists).
Both: `cache-control: no-store`, never write, never register a table (`to_regclass` checks), never call a model.
Details fixed with GRÜN/PINK: reasons — DISABLED: SEMANTIC_NOT_CONFIGURED | PROVIDER_NOT_AUTHORIZED | DAY_LIMIT_ZERO | NOT_PROVISIONED; SKIPPED: NOT_PERSON | NO_ACTIVE_POOLS | NO_PROPOSALS (an analysis without any capability proposal has nothing to compare; no run, no claim that roles were checked; PINK F-AM-6); PARTIAL: ROLES_BEYOND_BUDGET | ROLE_FAILURES | DAY_BUDGET_EXHAUSTED; FAILED: error code (an exhausted day budget ends as FAILED / ERR_BUDGET_EXHAUSTED). `fit` is null for a role without requirements; per rank `semanticCoverage {evaluated,total}`; `poolsDropped` lists snapshot pools that are no longer ACTIVE; the best relation of all proposals carries a requirement (highest value, then EQUIVALENT > COVERS > PARTIAL, then capability name).

### 3.6 Frontend (GRÜN)
Input accepts a GitHub account URL. After `ANALYZE` of a PERSON analysis the field proceeds without further input: waits for the job, then for the auto-match run (state line in the existing entry/transition language), then shows the ranked jobs with their explanation in the Capability Map / role discovery area. No pool picker, no role picker, no confirmation step on this path. Existing orbits, modes, drop zone, role discovery panel and manual start stay.

## 4 Budget and releases

The code is complete without any paid call: tests run with the labelled stand-in and a loopback Gemini fake. **External releases still required** (owner): the call budget as a number (`ROLE_DISCOVERY_DAY_LIMIT`) and the activation `ROLE_DISCOVERY_SEMANTIC_PROVIDER=gemini` on :3017; until then :3017 runs the stand-in. A real extraction on :3017 happens only when a user starts an ANALYZE (worker with the owner key, unchanged).

## 5 Three-point hardening (owner mandate SFE::THREE-POINT IMPLEMENTATION GO, 2026-10-30)

Cause: the real run (ANL_1793382839627_744, RUNTIME_STATUS §8) checked 4 of 7 roles (2 provider failures after about 71 s, 1 refused output), the number of model calls was not provable, and the interface waited 3 min for an 8 min run. Only these three points; existing components (relation cache, investigation store, call ledger, job lease pattern) are reused.

### 5.1 Point 2 first: the write-ahead call register
- **One seam** (`lib/career/provider-calls/guard.ts`): every `generateContent` that can generate (legacy analysis incl. regenerations/continuations/model cascade, Discovery, Convergence, semantic role call) goes through `guardedGenerateContent(stage, send)`. Inside a bound job context (the worker binds one per job; `startSemanticInvestigation` binds one for the Gemini provider when none exists) the call is written down BEFORE it is sent; without a context it runs unchanged (tests, scripts, stand-ins). No row, no call.
- **Table `career_provider_calls`** (additive, registered with the investigation tables, disposable databases only; trigger `rel_call_guard`: no delete, forward only): `RESERVED → SENT (committed before the request) → COMPLETED | FAILED_AFTER_SEND | UNKNOWN`; `RESERVED → FAILED_BEFORE_SEND` is the only way a unit comes back. A call counts from the moment it may have left the process: a request that threw stays counted, a `SENT` row without an end (crashed worker) is settled as `UNKNOWN` (counted) after 15 min; a `RESERVED` row that never got `SENT` comes back.
- **Job budget**: scope `JOB:<jobId>` in the existing `career_relation_call_ledger`, `GEMINI_JOB_CALL_LIMIT` (plain digits ≥ 1, else default 12), shared by extraction and matching; reservation and row in one transaction; the limit never falls below what is outstanding. A spent budget is `ProviderCallBlocked` (never mapped to a provider failure; the legacy cascade stops, the job's attempts stay inside the same budget).
- **Where no register can be provisioned** (not a verified disposable database) the job runs as before, unrecorded; a provisioned register that fails to open refuses every call.
- The semantic role ledger (`DAY:` and `INV:` scopes) now also keeps a failed request spent (`consume`, not `release`); it releases only for failures before anything was sent (key missing, register refused). The SDK does not retry by itself (no `retryOptions` set).
- Read model: `autoMatch.budget.callsUsed` (calls that may have left) and `callsJobLimit`.

### 5.2 Point 1: classified failures, one more attempt, partial admission, continuation
- Provider failures carry a class (`TRANSIENT`: 408/429/5xx/broken or timed-out connection; `PERMANENT`: other 4xx; `UNKNOWN`/`INCOMPLETE`/`EMPTY`). Task codes: `ERR_SEMANTIC_PROVIDER_TRANSIENT` for TRANSIENT, otherwise the old codes. Only TRANSIENT is asked again, once (`ROLE_MAX_ATTEMPTS` 2), each attempt with its own reservation and register row; the confirmed (explicit) path keeps exactly one call per role.
- **Partial admission** (decision during implementation): when some pairs of an output are refused, the admitted pairs are stored (each one passed every check alone), the refused pairs never are and are named in the task's refusals; the task is `SUCCEEDED` with `ERR_SEMANTIC_OUTPUT_PARTIAL`; the run reads `PARTIAL · PAIRS_REFUSED`. An output where every pair is refused still stores nothing and fails the role. (Real run: 84 of 96 pairs had been thrown away because 12 pairs of one requirement hit the claim guard.)
- **Continuation = a successor run** `auto:<analysisId>:r<n>` (n ≤ 2) over the same pools and roles; everything a predecessor stored comes from the relation cache, so only what is missing is asked, against the same job budget. Due after 60 s for runs that stopped early for a TRANSIENT failure or lost work (never for refusals, permanent failures or a spent budget), announced as `resumePending` for 10 min. Only runs marked `resumable` are ever continued (older runs are left alone). Task state machine and its trigger stay untouched.

### 5.3 Point 3: lease, heartbeat, take-over, state
- `career_relation_investigations` gets `lease_owner`, `lease_expires_at`, `heartbeat_at` (lease 90 s, heartbeat 20 s, renewed before every attempt). The sweep every worker runs (first after 5 s, then every 30 s) settles stale register rows, takes over runs whose lease ran out (one conditional update wins; the lost worker's open tasks become `INTERRUPTED`/`CANCELLED`, forward only) and starts the continuation.
- Read: `RUNNING` while the lease lives, `STALLED · WORKER_LOST` once it ran out (derived, nothing written; a run without a lease counts after 5 min of silence), also for an `INTERRUPTED` run that will be continued. New view fields: `revision`, `lastProgressAt`, `leaseExpiresAt`, `resumePending`, `budget.callsUsed`, `budget.callsJobLimit`; new reasons `PAIRS_REFUSED`, `WORKER_LOST`.
- Interface (GRÜN): no fixed 3 min cap for a run in progress (kept only for `NOT_STARTED`), `STALLED` and `resumePending` keep the slow read going, the ranking is re-read whenever `rolesEvaluated`, `revision` or the state changes.
