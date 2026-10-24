# CONDYN — semantic relation engine: contract, bounded execution, persistence (stage 3 specification, 2026-10-24)

Owner „OWNER_DECISION_ROLE_DISCOVERY“ STAGE_3 („GELB specifies the semantic relation engine, bounded execution and persistence
contract“), D-RD-2 = B, D-RD-3 = A (conditional). **Specification only — nothing here is implemented beyond the relation cache
(`ccc0cc1`); no model call; real Gemini needs a separate owner GO; new persistence needs the owner's architecture review.**

## 1 Relation contract — PROPOSAL_REQUIREMENT_RELATION_V1

One relation = one (PERSON capability proposal, role requirement) pair, evaluated by a model, authority NONE.

| Field | Source | Rule |
|---|---|---|
| `capabilityId` | proposal id of the PERSON projection | echoed by the model, must be one of the requested proposals |
| `requirementId` | key (upload, role, requirement) | echoed, must be one of the requested requirements |
| `state` | model | exactly one of **EQUIVALENT · COVERS · PARTIAL · DIFFERENT · UNCLEAR** |
| `sourceEvidence` | **not model-written**: the model cites evidence ids of that proposal; the server resolves them to the stored exact quotes and source document ids | cited ids must belong to the proposal; ≥ 1 for EQUIVALENT/COVERS/PARTIAL; DIFFERENT/UNCLEAR may cite none |
| `requirementText` | the stored requirement (name, aliases, level, type) | never model-written; the engine sees **no role or organisation text** (C-1): a relation depends only on the two operands, which is what the cache key carries |
| `relationExplanation` | model | non-empty; must not claim verified competence, level attainment or suitability (refused by a lexical guard: „verified“, „proven“, „qualified“, „suitable“, „score“, percentages) |
| `evidenceLimitation` | model | non-empty; what the cited evidence does not show |

The stored record is `CachedRelation` (`lib/career/job-pool/relation-cache.ts`, already built): key
`PRREL_ = hash(proposal content, requirement content, engine identity)`, immutable, authority NONE, raw output hash. A
classification never becomes verified competence; nothing feeds Phase-4 or the G2 canonical relations.

## 2 Execution unit and bounds (D-RD-3)

- **Unit:** one model call per role (`ROLE_RELATION_EVALUATION`), containing only that role's **pending** pairs — pairs already in
  the cache for the engine are not sent. A role with no pending pair costs nothing.
- **Call volume before start:** the `semanticPlan` of the discovery (built) — pairs, cached, pending, `callsNeeded`. Measured on the
  real result with 4 pools: 5 070 pairs, 77 calls (no cache yet).
- **Start:** only explicit, by the user, for a chosen set of roles (from the discovery groups); the UI shows the calls before start.
  Never at ANALYZE, never for „all pools“ implicitly.
- **Maximum roles per investigation:** default 10, hard cap 25 (configuration, owner may set lower). A larger selection is refused,
  not truncated.
- **Budget enforcement (server side):** a call ledger; before each call one unit is **reserved** atomically against two limits —
  per investigation (= its role count) and per day (owner-configured, default 0 = nothing runs). Reservation fails → the role is
  `BUDGET_EXHAUSTED`, nothing is sent. A reservation is consumed on a provider response, released on a refusal before sending.
- **Cost transparency:** request/response bytes and the provider's usage metadata (tokens) are recorded per call (metadata only,
  as in the video relay); a price is never estimated by the system.

## 3 States, partial completion, interruption

Investigation: `PLANNED → RUNNING → COMPLETED | PARTIAL | INTERRUPTED | FAILED`. Role task: `PENDING → RUNNING → SUCCEEDED |
FAILED | BUDGET_EXHAUSTED | INTERRUPTED | CANCELLED`, or `CACHED` at planning.

- Roles complete independently; every successful role's relations are written to the cache at once (a later failure never loses
  them). The investigation is `PARTIAL` when at least one role did not succeed.
- **Interruption** (explicit stop, budget exhausted, process loss): running tasks whose lease expired become `INTERRUPTED`; pending
  ones `CANCELLED`. Nothing resumes by itself. A resume is a new explicit investigation whose plan contains only what is still
  pending (the cache makes it exact).
- **No silent retries:** provider-level retries off; every task has exactly one attempt per explicit start; a failed role shows its
  error code; a retry is a new explicit start and is counted against the budget.
- **Output validation:** strict schema; a pair missing in the output, an unknown id, an unknown state, an evidence id not of that
  proposal or a refused phrase → that pair is **not stored** (the role is `FAILED` with the list of refused pairs); nothing is
  repaired or invented.

## 4 Idempotency and replay

- **Investigation idempotency key** = hash(analysis id, released uploads' canonical sha256, sorted role keys, engine identity, client
  request id) — a repeated submit returns the same investigation, no second call.
- **Relation idempotency:** the cache key; insert-once, **first wins** (C-2): a repeat with the same result is a duplicate, a repeat
  with another result (model nondeterminism) is reported as divergent and never stored; the database refuses UPDATE / DELETE /
  TRUNCATE and binds the record to its columns (`2dba126`).
- **Replay:** the raw provider output of every call is stored (text + sha256) with the parser version. Records can be re-derived
  from raw outputs without a model call (as G2 replay does); a replay that would produce a different record is reported, never
  silently stored.

## 5 Evidence classes: stand-in vs real Gemini

- The provider is part of the engine identity: `provider: "stand-in"` and `provider: "gemini"` give different engine hashes, so a
  stand-in record can never answer a real-engine lookup and vice versa.
- Every relation shown carries its engine's evidence class (STAND_IN / REAL_GEMINI); the map never mixes them in one view.
- Real execution requires, like the video lab: an explicit owner-GO flag, the key only in the relay process, a hard call budget,
  metadata-only logging. Development, tests and PINK use the deterministic stand-in.

## 6 Persistence contract (new, for the owner's architecture review)

All tables created only through the guarded registration (verified disposable database, B-ENTRY); no migration of the shared
database is part of this; a production migration is a separate decision.

| Table | Content | Mutability |
|---|---|---|
| `career_proposal_requirement_relations` | relation records (built, `ccc0cc1`) | insert once |
| `career_relation_investigations` | investigation id, idempotency key, analysis id, released uploads (+ canonical sha256), role keys, engine identity, limits, requested by, status, timestamps | status transitions only |
| `career_relation_role_tasks` | task id, investigation id, role key, pair keys, status, lease (owner, expiry, version), attempt (≤ 1), error code, refused pairs, raw output id | status + lease transitions only |
| `career_relation_raw_provider_outputs` | raw output id, task id, request sha256, response text, response sha256, usage metadata, parser version | insert once |
| `career_relation_call_ledger` | per day and per investigation: reserved, consumed, released units | atomic counters |

## 7 What the owner decides before implementation

1. Approve the persistence contract (§6) for isolated implementation.
2. Default and hard cap of roles per investigation (proposal 10 / 25).
3. The daily call budget for the stand-in (unbounded) and for real Gemini (proposal: 0 until a GO names a number).
4. The model for real execution and whether its raw outputs may be retained (retention period).
EOF
echo written