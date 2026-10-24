# CONDYN — capability → job pool discovery: reconstruction, gap, minimal path (2026-10-24)

Owner directive „SYNTX::SFE::OWNER_DIRECTIVE — CAPABILITY_TO_JOBPOOL_DISCOVERY“ (PRIORITY PRODUCT_CORE). GELB delivery §06.1–§06.5.
No integration, no deployment, no new Gemini call, no match score. Evidence classes: CODE_INSPECTION · PERSISTED_REAL_RESULT ·
DETERMINISTIC (computation on persisted data) · STAND_IN. Code state inspected: `41dfa25` (frontend/pxj-ux-closure).

## 1 Actual implementation state (§01, §06.1) — from code, not assumed

| Building block | State | Where |
|---|---|---|
| Capability discovery from a source (PDF; GitHub/website staged as sources) | **exists**, real Gemini; three modes PERSON / PERSON × JOB / JOB; the PERSON discovery is scope-free | analyze pipeline, `capability-core` projection |
| Capability map data (proposals + source-verified evidence) | **exists**: `capabilityProposalProjection` (proposals, `evidence[].exactQuote`, `evidenceState`) in `GET /api/career/analyses/{id}` | `capability-core`, analysis route |
| Job pools, organisations, roles, requirements | **exist**, persisted per upload with canonical mapping (target role profile + target requirement revisions, necessity, matching eligibility); list `GET /api/career/job-pools`, view `GET …/{upload}` | `job-pool/*` |
| Deterministic name coverage proposal → requirement | **exists** as a pure function `findSweepCoverage` (EXACT, ALIAS, COMPOSITE_CONSTITUENT, TOKEN_CONTAINMENT = weak), `scored: false` | `job-pool/presentation-matching.ts` |
| **Pool-wide** comparison over all roles of a pool | **exists**: `GET /api/career/job-pools/{upload}/matches?analysisId=` (`JOB_POOL_PRESENTATION_MATCHING_V1`) — but (a) it carries the legacy `resonanceScore` from the unscoped legacy analysis (owner: forbidden on the first screen), (b) it **refuses PERSON analyses** (`ERR_JOB_POOL_MATCHES_PERSON_ANALYSIS`, owner invariant 2026-10-15), (c) for a PxJ analysis it reuses proposals produced under one role's scope against every role (§2 G-3) | `job-pool/application.ts` |
| Single-role B2 coverage | **exists**, `GET /api/career/analyses/{id}/job-comparison` — only the analysis's own selected role, scope-hash proven | `selected-role-coverage.ts` |
| Semantic capability ↔ requirement relation (SEMANTIC_EQUIVALENT / COVERS / PARTIAL / DISTINCT / UNKNOWN + evidence + scope assessment) | **exists as a producer contract** (G2, provider = model) with persistence, replay and role-relation aggregation; **not reachable** from the product path: its operand admission requires `PHASE4_VERIFIED` + `RELATION_ELIGIBLE` capabilities; the product has 0 capability snapshots | `relation/capability-requirement`, `relation/role-relation` |
| Embedding/semantic search over pool entities | **exists** (`search/engine.ts`, pgvector store, Gemini or deterministic embeddings); not wired to the capability map; similarity is not admissible as proof | `search/*`, `embeddings/*` |
| **Legacy scored comparison inside every analysis read (M-1, found by PINK §3.63)** | **exists and is shown**: `GET /api/career/analyses/{id}` runs `matchCareerAnalysisAgainstPool(analysis, DEMO_COMPANY_POOL)` and `generateCareerRecommendations` for **every** analysis, PERSON included (live for ANL_…_456: `pool_demo_master_v1`, 3 roles with `resonanceScore`, 6 capability gaps, 5 next actions). The PxJ first screen strips it (`withoutLegacyOrbits`); under PERSON the legacy orbits 03–06 render roles, organisations, gaps and next actions from it. A PERSON analysis is thus already compared with (demo) roles, scored and sorted. | analysis route, `matching/engine.ts`, `recommendations/gaps.ts` |
| External backend behind `admin/proxy` (M-2) | INCONCLUSIVE: forwards to `CONDYN_API_URL`; used in the repo only by the admin prompt/analyze panels; what that backend offers cannot be checked from here | `app/api/admin/proxy` |
| UI: capability map → related roles | **absent**; roles appear only in the Job Field after a manual role choice (B2) | — |

## 2 Gap: single-role B2 → pool-wide role discovery (§06.2)

- **G-1 Authority / invariant.** The owner invariant of 2026-10-15 says a PERSON analysis is never compared with a job. The directive
  asks exactly for that (PERSON-like, scope-free discovery against all roles). Needs an explicit owner decision that replaces the
  invariant with a bounded contract (D-RD-1).
- **G-2 Relation quality.** Name coverage is only a lexical signal. Measured on the same CV (§5): for the Kestrel role the
  scope-free PERSON proposals give 1 name relation + 3 weak token hits of 9; the PxJ proposals produced *for that role* give 8/9
  EXACT. The difference is naming, not capability: the scoped discovery names proposals after the role's requirements.
  Examples: „Test-Driven Development (TDD)“ has no name relation to „Automated Testing“; „PostgreSQL Database Design and Querying“
  is only a weak token hit for „PostgreSQL“. A pool-wide discovery therefore needs an explicit **relation layer** (type and limit of
  the relation visible, §03), not more string rules.
  PINK §3.63 adds, on the same data: 29 of 39 PARTIAL roles rest only on weak token hits (25 on a single one, mostly „Python“ ←
  „Python ETL Development“, also where the requirement's aliases are PyTorch, FastAPI or R); the composite split treats one
  proposal asymmetrically (TypeScript constituent, Node.js only weak); WEAK understates head-noun hits (Kubernetes ← „Kubernetes
  Deployment“) and overstates single-word overlaps (Linux, ETL alias); misses: SQL ×10, „CI/CD Pipelines“ vs „CI/CD Pipeline
  Engineering“ (plural only), TDD vs Automated Testing. 49/52 quotes name the requirement; 3 rest on words only in the model's
  proposal name. Consequence: lexical hits are candidates for a relation, never a relation themselves.
- **G-3 Scope leakage.** Proposals produced under one role's scope must not be compared with other roles (they are steered by that
  role's requirement names: the PxJ run relates 13 roles, incl. 4 „all requirements“ in other pools — an artefact of scope, not
  evidence). Pool-wide discovery must use the scope-free projection.
- **G-4 Operand authority.** The existing semantic producer only admits Phase-4-verified capabilities. Proposals have authority
  NONE. Either a proposal-level relation contract (authority NONE, PROPOSAL_ONLY, same relation vocabulary) or the Phase-4 chain
  (verification of proposals) is needed (D-RD-2).
- **G-5 Cost.** A semantic relation needs a model call per role (batched requirement × proposal pairs). Pools here: 78 roles, 507
  requirements, 10 proposals → up to ~5 000 pairs. Needs a budget and a candidate pre-selection rule (D-RD-3).
- **G-6 Presentation.** No ranking or score exists or is allowed; an order of roles is itself a claim (D-RD-4). Pool release
  („geöffnete oder ausdrücklich freigegebene Pools“) is a new explicit user choice.
- **G-8 Legacy scoring path (M-1).** The analysis read already carries a scored comparison with a hard-coded demo pool for every
  analysis and PERSON shows it. A discovery contract has to name it: keep, remove or confine (D-RD-5).
- **G-9 Keys.** Role ids **and requirement ids** repeat across uploads (`role_kestrel_fullstack`, `req_kestrel_fullstack_01/02`):
  every discovery item is keyed by (upload, role, requirement).
- **G-7 UI.** The capability map has no role layer; role details (requirement → relation → evidence → source) exist only for the
  one selected role (B2 panel).

## 3 Minimal architecture path (§06.3)

1. **POOL_ROLE_DISCOVERY_V1 (read, deterministic, no model).** `GET /api/career/analyses/{id}/role-discovery?jobPoolUploadId=…`
   (one or more explicitly released uploads). Operand: the scope-free projection of a PERSON analysis only (PxJ/JOB refused, G-3).
   Per role: every requirement with relation basis (`NAME_EXACT`, `NAME_ALIAS`, `NAME_COMPOSITE_CONSTITUENT`, `WEAK_TOKEN_CONTAINMENT`,
   `NO_NAME_RELATION`), proposal, evidence (doc id + exact quote), necessity, eligibility; role status `NO_REQUIREMENTS` /
   `NO_RELATION` / `WEAK_ONLY` (only weak token hits, PINK §3.63) / `PARTIAL` / `ALL_REQUIREMENTS_NAME_RELATED`; keys (upload, role, requirement); counts; fixed authority block (`scored: false`, `ranking: false`,
   `semanticRelation: NOT_EVALUATED`, `decision: false`). Reuses `findSweepCoverage` and the pool view; computed on read. This is
   §5's proof as a route. Requires D-RD-1.
2. **Capability map role layer (frontend).** After ANALYZE in PERSON: „DISCOVER JOBS“ with explicit pool release → roles grouped
   by status around the capability core (no score); a role opens its details (requirements, relation basis, evidence, open
   requirements); „gezielt untersuchen“ hands over to the existing PERSON × JOB path (select as job → scoped analysis → B2). Inverse
   path ROLE → REQUIREMENT → PROPOSAL → QUOTE → SOURCE visible.
3. **Relation layer (needs GO and contract).** `PROPOSAL_REQUIREMENT_RELATION_V1`: per released role one batched model evaluation
   of the candidate pairs with the existing relation vocabulary (SEMANTIC_* + EVIDENCE_* + SCOPE_*), authority NONE, persisted with
   raw provider output and replay like G2; candidate pairs pre-selected deterministically (name/token, optionally embeddings as
   retrieval only, never shown). Requires D-RD-2, D-RD-3.
4. **Later:** verified operands (Phase-4) → canonical relations / role relations (existing G2 producers).

Steps 1–2 deliver the product journey with honest lexical relations and visible limits; step 3 delivers the semantic quality the
directive asks for (§03).

## 4 Assignments (§06.4)

- **GELB:** route POOL_ROLE_DISCOVERY_V1 (step 1) after D-RD-1, with contract tests and inverse proof; relation contract draft
  for step 3.
- **GRÜN:** step 2 after D-RD-1 and D-RD-4: journey PDF → ANALYZE → capability map → DISCOVER JOBS (pool release) → role relations →
  role details → evidence → „gezielt untersuchen“; capability map stays the spatial centre; manual role choice stays possible.
- **PINK:** now: independent verification of the isolated proof (§5) — re-run, inverse check, duplicate/empty/multi-pool cases;
  later: the §05 test matrix on the route and the UI.

## 5 Isolated end-to-end proof (§06.5)

Script `evidence/capability-discovery/scripts/discovery-proof.mts.txt`; disposable writable lab copy of the :41862 database
(:41878, production build of 41dfa25, no worker, no Gemini); pools uploaded there only: DLL Engineering (persisted), DLL AI/Data,
DLL Enterprise Scale (docs/examples) and PINK's RF pool (duplicate role id, equal titles, a role without requirements). Source
`cv.synthetic.pdf`; the analysed bytes equal `docs/examples/cv.synthetic.pdf` (sha256 `efaa47ef…7df3`, checked in the job input).

| Run | Operand | Pools / roles / requirements | Role status | Inverse check (requirement → proposal → quote → source text) |
|---|---|---|---|---|
| PERSON `ANL_1792628831636_456` (real Gemini 2026-10-22, scope-free) | 10 proposals | 4 / 78 / 507 | PARTIAL 39 (of which 29 weak-only, PINK) · NO_RELATION 38 · NO_REQUIREMENTS 1 | 52/52 relations: proposal found, quote in projection, quote in the PDF text |
| PxJ `ANL_1792628993472_10` (scoped to role_kestrel_fullstack) — **negative control (G-3)** | 8 proposals | 4 / 78 / 507 | NO_RELATION 64 · PARTIAL 9 · ALL 4 · NO_REQUIREMENTS 1 | 27/27 |

Matrix coverage (§05): one source vs one role, vs all roles of a pool, vs several pools; role without requirements; partial
coverage; roles without relation; duplicate titles („Platform Engineer“ ×3, the Kestrel title ×2) and a duplicate role id across
pools (`role_kestrel_fullstack` ×2) kept apart by (upload, role id); ambiguous requirement names shown as weak token hits. Not
yet covered: source switch, pool switch, reload (route/UI), GitHub sources.

## 6 Owner decisions (STOP)

- **D-RD-1** Replace the invariant „PERSON is never compared with a job“ by POOL_ROLE_DISCOVERY_V1: a scope-free PERSON projection
  may be related to explicitly released pools, read only, no score, no ranking, no decision.
- **D-RD-2** Relation layer: proposal-level relation contract (authority NONE) vs Phase-4 verification first.
- **D-RD-3** Gemini budget and pre-selection rule for relation evaluation (no call before GO).
- **D-RD-5** The legacy demo-pool scoring inside every analysis read (M-1, G-8): keep, remove, or confine to a labelled legacy view.
- **D-RD-4** Order of roles in the map: grouped by status only (recommended), or by counts (a ranking claim).

## 7 PINK verification §3.63 (55893d9)

Reproduction PASS (both runs byte-identical JSON) · inverse check PASS with own code (52/52, 27/27; 49/52 quotes name the
requirement) · relation labels **FAIL** (PARTIAL misleading, asymmetric composite split, WEAK both under- and overstating — folded
into G-2 and the WEAK_ONLY status) · §05 cases PASS (plus requirement-id repetition, G-9) · code reconstruction **FAIL (gap)**:
M-1 legacy demo-pool scoring in every analysis read — confirmed by GELB in code and live, added to §1/§2 (G-8) and D-RD-5; M-2
external proxy INCONCLUSIVE.

## 8 Decision brief D-RD-1 … D-RD-5 (owner „OWNER_DIRECTION_ROLE_DISCOVERY“)

UX/UI closure accepted as validated candidate `b77c851` (not integrated); it stays untouched. Facts below are from §1–§7.

### D-RD-1 — May a scope-free PERSON projection be related to job pools?
*Today:* owner invariant 2026-10-15, enforced in code (`ERR_JOB_POOL_MATCHES_PERSON_ANALYSIS`): a PERSON analysis is never compared
with a job; B2 exists only for the one role a PxJ analysis was run for. G1: the PERSON first screen stays unchanged (T-07).
- **A** keep the invariant — discovery only through a manual role choice + scoped analysis. Contradicts the objective.
- **B (recommended)** POOL_ROLE_DISCOVERY_V1: the projection of a PERSON analysis may be related, **read only**, to the roles of
  **explicitly released** pool uploads (a list the user chooses; never „all“ implicitly, never a latest pool); PxJ and JOB analyses
  refused as operand (G-3); fixed authority block (`scored: false`, `ranking: false`, `decision: false`); keys (upload, role,
  requirement). Consequences: one new GET route (no model, no storage); the PERSON Capability Map gains a role layer, so the G1 rule
  „PERSON first screen unchanged“ and its hash T-07 must be re-set together with this decision.
- **C** pool-scoped re-discovery: a new model run with the whole pool as scope so proposal names align with all requirements.
  One call per pool, large prompts, and it reproduces the naming artefact of G-3 for every role at once. Not recommended.
**Essential to start:** yes — it gates every step.

### D-RD-2 — What produces the relation between a proposal and a requirement?
- **A** lexical only (name coverage with the corrected labels, incl. `WEAK_ONLY`): no model, fully explainable, low recall
  (Kestrel: 1 + 3 weak of 9 from the PERSON projection; TDD ↔ Automated Testing, SQL ↔ PostgreSQL missed).
- **B (recommended as step 3)** PROPOSAL_REQUIREMENT_RELATION_V1: a model evaluates candidate (proposal, requirement) pairs with the
  existing G2 vocabulary (SEMANTIC_EQUIVALENT / COVERS / PARTIAL / DISTINCT / UNKNOWN, EVIDENCE_*, SCOPE_*), must cite the
  proposal's evidence ids and the requirement text, authority NONE; persisted with raw provider output and replay like G2.
  Consequences: new contract and **new persistence** (the G2 tables admit only Phase-4-verified operands), model cost (D-RD-3).
- **C** Phase-4 verification first, then the existing G2 relation and role-relation producers: canonical authority, but the
  Phase-4 chain is not built in the product path — largest effort.
- **D** embedding similarity as relation — excluded (no similarity score as proof); admissible only as candidate retrieval.
**Essential to start:** no for steps 1–2 (they run on A); yes before step 3.

### D-RD-3 — Model budget and pair pre-selection for step 3
Measured scale: 4 pools, 78 roles, 507 requirements, 10 proposals → up to ~5 070 pairs.
- **A (recommended)** one batched call per released role (all its requirements × the proposals), started **explicitly** by the
  user with the number of calls shown first, hard cap per analysis; development and PINK on the stand-in, real Gemini only with a
  separate GO.
- **B** only roles with a lexical candidate — cheaper (here 39 of 78) but blind exactly where G-2 shows the gap.
- **C** one call per pool — fewest calls, weakest traceability per role.
- **D** on demand per opened role — cheapest, but no pool-wide discovery.
**Essential to start:** only for step 3.

### D-RD-4 — How roles are ordered in the Capability Map
- **A (recommended)** grouped by relation status — all requirements related · partial · weak only · no relation · no
  requirements — stable order inside a group (pool → organisation → role title); counts shown as facts („3 of 9 requirements
  name-related“), never used to sort; groups without relation stay listed (collapsed), nothing hidden.
- **B** sorted by the number of related required requirements — an implicit ranking claim.
- **C** a score — excluded (NO_UNVERIFIED_MATCH_SCORES).
**Essential to start:** yes for the frontend (step 2).

### D-RD-5 — The legacy demo-pool comparison inside every analysis read (M-1)
`GET /api/career/analyses/{id}` compares every analysis, PERSON included, with a hard-coded demo pool (`resonanceScore`) and derives
gaps and next actions; the PERSON legacy orbits 03–06 show it. With discovery the PERSON map would show two role sources, one scored
on demo roles, one unscored on released pools.
- **A** keep — contradictory sources and an unverified score next to the discovery. Not recommended.
- **B (recommended)** under PERSON the discovery layer replaces the legacy role/organisation/gap/next-action orbits in the map; the
  legacy computation stays in the API for now, read nowhere in the PERSON map; removal from the API later as cleanup.
  Consequence: PERSON first-screen change — handled in the same T-07 re-set as D-RD-1 B.
- **C** remove it from the API and every view now — cleanest, but touches the analysis route and legacy tests beyond the core.
**Essential to start:** yes for step 2 (the role layer needs its place); not for step 1.

### Minimum to begin an isolated implementation
- **Step 1 (GELB, POOL_ROLE_DISCOVERY_V1 read route):** D-RD-1.
- **Step 2 (GRÜN, Capability Map role layer + role details + hand-over to the scoped investigation):** D-RD-1, D-RD-4, D-RD-5
  (incl. the T-07 re-set).
- **Step 3 (semantic relations):** D-RD-2, D-RD-3 and a Gemini GO.

## 9 Owner decision executed — stage 1 and the persistent cache (branch `backend/pool-role-discovery`)

Owner „OWNER_DECISION_ROLE_DISCOVERY“: D-RD-1 = B, D-RD-2 = B (architecture), D-RD-3 = A (conditional), D-RD-4 = A, D-RD-5 = B.
Owner directive „persistentes Caching … von Jobpools, Capabilities und ihren Relationen“ (GELB decides the technique).
Branch `backend/pool-role-discovery` on b77c851 (UX candidate preserved, not integrated).

**Stage 1 — `96651af` POOL_ROLE_DISCOVERY_V1.** `GET /api/career/analyses/{id}/role-discovery?jobPoolUploadId=…` (1–10 explicit
uploads, no duplicates, never an unnamed pool). Operand only a PERSON analysis whose Discovery run the persisted boundary proves
scope-free (`RUN_CONTRADICTS_DECLARATION` otherwise); PxJ refused (`ERR_ROLE_DISCOVERY_OPERAND_NOT_PERSON`); proposals pass through
unchanged. Per role and requirement (key: upload, role, requirement): lexical basis (`NAME_EXACT` / `NAME_ALIAS` /
`NAME_COMPOSITE_CONSTITUENT` / `WEAK_TOKEN_CONTAINMENT` / `NONE`), proposal, quotes, `quoteNamesRequirement` (evidence limitation),
`semantic: NOT_EXECUTED`; role status groups in fixed order (ALL / PARTIAL / WEAK_LEXICAL_ONLY / NO_LEXICAL_RELATION /
NO_REQUIREMENTS), deterministic pool → organisation → role order; fixed authority (`relationBasis: LEXICAL_NAME_COVERAGE`,
`scored/ranking/decision: false`); read only, no-store.

**Cache architecture — `ccc0cc1`** (decisions from measurement):

| Layer | Existing mechanism (code) | Decision |
|---|---|---|
| Job pools | upload id = canonical sha256 (`jobPoolUploadIdFor`); equivalent re-upload → 200, same id, no row (test `job-pool.postgres` „idempotent“; lab: re-uploads 200, uploads 4 / mappings 4) | reuse as is |
| Capabilities | Discovery / Convergence run id = hash(source bundle, kernel, prompt checksum, provider, model, schema, scope) → `DISCOVERY_RUN_REUSED` / `CONVERGENCE_RUN_REUSED`, no model call (tests `capability-core/discovery/runtime`, `proposal-runtime`) | reuse as is |
| Lexical relations | computed on read; lab: 33–72 ms for 4 pools / 78 roles / 507 requirements / 10 proposals incl. every read and the plan | **no cache** (no gain, invalidation risk) |
| Semantic relations (stage 3) | none | **new: content-addressed store** `career_proposal_requirement_relations`, key `PRREL_` = hash(proposal content, requirement content, engine identity); immutable rows (conflict refused); no invalidation — new content or engine = new key; incremental across uploads (same requirement content under other ids hits) and analyses (same proposals hit); every owner field mandatory (state EQUIVALENT/COVERS/PARTIAL/DIFFERENT/UNCLEAR, source evidence, requirement text, explanation, evidence limitation, raw output hash), authority NONE enforced in code and by DB CHECK; DDL registered with the job pool persistence, i.e. only on a verified disposable database (B-ENTRY) |
| Call volume (D-RD-3 precondition) | none | `semanticPlan` in every discovery: `ENGINE_NOT_SPECIFIED`, pairs, cached, pending, `callsNeeded` (one per role with a pending pair). Lab (4 pools): **5 070 pairs, 77 calls**; distinct requirement contents 470 of 507 (distinct keys 4 700) |

Not cached and identified: the LEGACY Gemini call of every analysis (the live relay log of :41862 shows DISCOVERY, CONVERGENCE,
LEGACY per analysis; the second LEGACY request was byte-identical in size, 11 477 bytes, same source). Role discovery does not
use it; reusing it would change the analysis pipeline → separate owner decision (C-LEGACY).

**Tests:** discovery 13/13, relation cache 20/20 (corrected count, PINK §3.65) (keys, admission, plan, incremental reuse, Postgres immutability, DB checks);
focused group 73 files 585 passed, 4 skipped; tsc 0. The existing registration gate test stays unchanged (the cache DDL lives in
`registerJobPoolPersistenceSchema`). No model call anywhere (DETERMINISTIC_FIXTURE / PERSISTED_REAL_RESULT).

## 10 PINK §3.65, corrections and decisions (2026-10-24)

- **PINK §3.65 (`02b6eee`) on ccc0cc1:** contract PASS, §3.63 findings PASS, inverse trace via the route 52/52 PASS, read-only PASS,
  keys / plan / DDL gate / DB checks PASS; **immutability FAIL (D-RC-1)** — UPDATE/DELETE passed on the database, the JSON record was
  not bound to the checked columns, the reader served rows unchecked. **Fixed in `2dba126`:** trigger refuses UPDATE / DELETE /
  TRUNCATE; CHECK binds record_json to key, state, authority, hashes, createdAt; key and hash formats fixed; the reader re-admits
  every row and refuses a corrupt one. Test on ccc0cc1: 6 fail / 1 pass; on 2dba126 7/7; job-pool + pxj-first-screen + three-modes
  60 files 479 passed, 4 skipped; tsc 0.
- **C-2 (PINK) → defined: first wins.** A second evaluation of the same pair is a duplicate (same result apart from createdAt and raw
  output hash) or divergent (reported, never stored); the first record stays. Spec §4 updated.
- **C-1 (PINK) → decided: the engine sees no role or organisation text.** The requirement key carries only the requirement's own
  content; the role-level call is batching for economy, not context. Spec §1 updated.
- **Correction of M-1 / G-8 (GRÜN, from code):** the PERSON orbits 03–06 do **not** read the demo-pool matching of the analysis
  route. They come from the legacy analysis result itself (`ui-adapter.ts`): 03 ← `analysis.organizations`, 04 ← `analysis.roles`
  with a legacy fitScore (`evaluateAlignment`), 05 ← always empty, 06 ← `analysis.strategies`. The demo-pool matching is reached only
  through VIEW MATCHES. D-RD-5 still applies to exactly these orbits (legacy role/organisation presentation with a legacy score);
  my earlier statement „shown in the PERSON orbits“ was wrong in its provenance.
- **K-RD-1 (GELB, under D-RD-5):** removing 03–06 under PERSON breaks, besides T-07, 15 tests in 6 files that were set to PERSON in G1
  to keep checking those orbits. Decision: (1) where a test asserted 03–06 present under PERSON it becomes the inverse (absent, as
  under PxJ), every other assertion verbatim; (2) the orbit components 03–06 are tested directly (focus shell, empty projection,
  labels EN/DE). No test deleted, no assertion loosened; own commit with a before/after table per test; PINK checks coverage.
- **PINK §3.66 (`82dd938`) on 2dba126:** D-RC-1 and C-2 PASS on a fresh database. **O-RC-3** (tables created by the ccc0cc1 DDL got
  only the triggers, not the CHECKs, yet registration said REGISTERED) **fixed in the next commit on the branch**: named constraints
  are added by ALTER when missing; registration verifies every constraint and trigger and fails otherwise; a violating existing row
  fails the ALTER. **O-RC-4 decided: fail closed** — one corrupt row makes the whole read (plan / route) fail rather than serve a
  partial or tampered cache; it signals an integrity breach, not a normal state. **O-RC-5 noted:** the table owner (app role) can
  still disable triggers or drop the table; real protection against that is a role separation (owner role ≠ app role), part of any
  production migration decision.
