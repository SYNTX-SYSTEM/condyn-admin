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
4. Persisted state (`career_auto_match_runs`, registered like the relation cache: only on a verified disposable database, `CREATE TABLE IF NOT EXISTS`).
Enabled only when `readSemanticConfig()` is READY (the provider setting is the single gate); otherwise state DISABLED and no call.

### 3.4 Explainable ranking (GELB) — `ROLE_RANKING_V1`
Pure function over discovery + cached semantic relations; read only, never a model call.
- Requirement value: semantic state EQUIVALENT/COVERS = 1, PARTIAL = 0.5, DIFFERENT/UNCLEAR = 0; roles/requirements without a semantic relation use the lexical basis only: NAME_EXACT/NAME_ALIAS = 0.5 (capped, marked LEXICAL), others 0.
- Requirement weight: necessity REQUIRED 3, PREFERRED 2, OPTIONAL 1, UNKNOWN 1.
- Role fit = Σ(weight × value) / Σ(weight). Tiers: roles with a semantic evaluation first (SEMANTIC), then LEXICAL_ONLY. Order inside a tier: fit desc, required gaps asc, title, role id (deterministic).
- Every rank carries its formula inputs per requirement (state, source, weight, contribution), the model explanation and evidence limitation, and the source quotes. Authority: `ranking: true`, `decision: false`, `authorityState: NONE`; the ranking is derived from unverified model statements and never a hiring decision.

### 3.5 Read APIs (GELB)
- `GET /api/career/analyses/{id}/auto-match` → `{ success, autoMatch: { state: NOT_STARTED | DISABLED | RUNNING | COMPLETED | PARTIAL | FAILED | SKIPPED, reason, evidenceClass, pools, budget: { rolesPlanned, rolesEvaluated, callsLimit }, investigationId, startedAt, finishedAt } }`
- `GET /api/career/analyses/{id}/job-ranking` → `{ success, ranking: ROLE_RANKING_V1 }` (computed on read for the pool snapshot of the run, or all ACTIVE pools if no run exists).
Both: `cache-control: no-store`, never write, never call a model.

### 3.6 Frontend (GRÜN)
Input accepts a GitHub account URL. After `ANALYZE` of a PERSON analysis the field proceeds without further input: waits for the job, then for the auto-match run (state line in the existing entry/transition language), then shows the ranked jobs with their explanation in the Capability Map / role discovery area. No pool picker, no role picker, no confirmation step on this path. Existing orbits, modes, drop zone, role discovery panel and manual start stay.

## 4 Budget and releases

The code is complete without any paid call: tests run with the labelled stand-in and a loopback Gemini fake. **External releases still required** (owner): the call budget as a number (`ROLE_DISCOVERY_DAY_LIMIT`) and the activation `ROLE_DISCOVERY_SEMANTIC_PROVIDER=gemini` on :3017; until then :3017 runs the stand-in. A real extraction on :3017 happens only when a user starts an ANALYZE (worker with the owner key, unchanged).
