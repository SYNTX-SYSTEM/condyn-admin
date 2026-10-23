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
- **G-7 UI.** The capability map has no role layer; role details (requirement → relation → evidence → source) exist only for the
  one selected role (B2 panel).

## 3 Minimal architecture path (§06.3)

1. **POOL_ROLE_DISCOVERY_V1 (read, deterministic, no model).** `GET /api/career/analyses/{id}/role-discovery?jobPoolUploadId=…`
   (one or more explicitly released uploads). Operand: the scope-free projection of a PERSON analysis only (PxJ/JOB refused, G-3).
   Per role: every requirement with relation basis (`NAME_EXACT`, `NAME_ALIAS`, `NAME_COMPOSITE_CONSTITUENT`, `WEAK_TOKEN_CONTAINMENT`,
   `NO_NAME_RELATION`), proposal, evidence (doc id + exact quote), necessity, eligibility; role status `NO_REQUIREMENTS` /
   `NO_RELATION` / `PARTIAL` / `ALL_REQUIREMENTS_NAME_RELATED`; counts; fixed authority block (`scored: false`, `ranking: false`,
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
| PERSON `ANL_1792628831636_456` (real Gemini 2026-10-22, scope-free) | 10 proposals | 4 / 78 / 507 | PARTIAL 39 · NO_RELATION 38 · NO_REQUIREMENTS 1 | 52/52 relations: proposal found, quote in projection, quote in the PDF text |
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
- **D-RD-4** Order of roles in the map: grouped by status only (recommended), or by counts (a ranking claim).
