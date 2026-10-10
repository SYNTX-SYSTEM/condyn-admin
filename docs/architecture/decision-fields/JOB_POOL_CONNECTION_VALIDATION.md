# Job Pool Connection — independent validation (PINK)

Field: `SFE FIELD — JOB CONNECTION VALIDATION` (owner mandate 2026-10-10). Implementation owner: GELB
(`integration/job-pool-connection`). Frontend: GRÜN. This record is PINK's independent validation field: it
reconstructs the existing matching architecture, states the contracts the proofs are written against, and
documents every proof run with its evidence. PINK modifies no implementation module of the field.

Hard boundary observed throughout: the shared `condyn` database is never read for writing, never registered,
never seeded. Every database-backed proof runs as `condyn_test_runner` through `npm run test:isolated` on a
freshly created, marker-verified `condyn_test_<16 hex>` database that the runner drops afterwards.

## 1. Reconstruction (read-only, validation tip `24ac9c8` + `origin/integration/job-pool-connection` @ `120e0ce`)

| Element | Observed state | Where |
| --- | --- | --- |
| Pool format | `CompanyPoolData` (pool, organizations, roles, requirements); `weight ∈ [0,1]`; `status` DRAFT/ACTIVE/ARCHIVED; no `aliases`/`necessity`/`requirement_type` yet | `lib/career/matching/pool.ts` |
| Resonance engine | `matchCareerAnalysisAgainstPool`: ACTIVE-only (CP-I1), score = Σ weight·min(1,confidence) / Σ weight, matched/missing/breakdown, roles and organizations sorted descending, organization aggregate = max role score | `lib/career/matching/engine.ts`, `scoring.ts` |
| Step-23 mapping | `mapCapabilitiesToJobs`: alias match, weak evidence below 0.70 contributes weight·confidence·0.5, never called at runtime | `lib/career/matching/job-mapping.ts` |
| Live consumer | `GET /api/career/analyses/{id}` matches every analysis against the constant `DEMO_COMPANY_POOL` and feeds the result into `generateCareerRecommendations` | `app/api/career/analyses/[analysisId]/route.ts:51-52` |
| Canonical analysis | capabilities are Universal Entities: `identity.name`, `confidence`, `evidence[].{doc_id, context_quote}` | `lib/career/schema.ts:65-101`, gold case `test/gold/case_001_minimal_valid` |
| Analysis repository | `getCareerAnalysisRepository()` returns the **in-memory** repository whenever `NODE_ENV === "test"`; Postgres otherwise | `lib/career/repositories/index.ts:26-40` |
| Target chain | TSREV (`sourceKind` must be `"DOCUMENT"`, `contract.ts:70`) → TOREV → TRSB → TROB → TRPREV (`reconstructTargetRoleProfiles`, quotes verified with `normalizedContent.includes`) → TRQREV (`reconstructTargetRequirementsDurably`, same rule, `ERR_TARGET_REQUIREMENT_EVIDENCE_FAILED`) | `lib/career/target/**` |
| Requirement artifacts | batch runs, results, admissions and raw provider output are persisted in Postgres (`PostgresTargetRequirementArtifactRepository`); **role reconstruction** batch runs have only an in-memory repository | `lib/career/target-adapters/role-requirement-artifact-persistence`, `lib/career/target/role/reconstruction/persistence.ts` |
| HR route gate | `ensureHrDecisionLoopPersistenceRegistration`: unified registration only after a positive disposable verdict, once per process, otherwise `NO_DDL_ON_NON_DISPOSABLE_DATABASE` | `lib/career/hr-decision-loop/local-composition.ts:29-43` |
| Contract on the branch tip | `JOB_POOL_CONNECTION.md` §4 still states `sourceKind: "JOB_POOL_JSON_ROLE"` and one source per role; `lib/career/job-pool/types.ts` defines the v1 view types; no routes, no module, no sample file yet | `origin/integration/job-pool-connection` @ `120e0ce` |

Defect confirmed (Case 1): both matchers read `c.name || c.capability_name`; for a canonical analysis this is
`""`, so every requirement is missing and every score is 0 (`engine.ts:71`, `job-mapping.ts:80`). D-JP-1.

### Adopted design (GELB, 2026-10-10, answers to PINK challenges C1..C7)

- C1 `sourceKind: "DOCUMENT"`; pool nature carried by `sourceLocator: jobpool://<JPOOL_…>` and
  `normalizationVersion: JOB_POOL_SOURCE_RENDERING_V1`.
- C2 one `TargetSourceRevision` per upload, every role binds to it; `normalizedContent` is a deterministic
  id-scoped line rendering (NFC, LF, no trailing spaces); `normalizedContentHash` over that text;
  `rawContentHash` = SHA-256 of the stored canonical bytes (key-sorted JSON); the uploaded bytes' hash lives on the
  upload record only; every evidence quote is an exact line of that source.
- C3 `JOB_POOL_REQUIRED_LEVEL_MAPPING_V1`: CAPABILITY/TOOL_TECHNOLOGY/KNOWLEDGE with a level starting `L1..L6` →
  `CAPABILITY_LEVEL "L<n>"` SUPPORTED, else UNKNOWN/UNKNOWN; EXPERIENCE/LANGUAGE/CREDENTIAL verbatim free-text
  variants; every other type UNKNOWN.
- C4 admission `NEW_ENTITY_ADMITTED` only, policy `JOB_POOL_UPLOAD_SCOPED_ENTITY_V1`; upload id from the canonical
  bytes, bytes stored.
- C5 B-ENTRY stated. C6 extraction reads `identity.name`, then `name`, then `capability_name`.
- C7 `necessityValidationState: UNKNOWN` when `necessity` is absent.

## 2. Proof catalogue (PINK, `test/job-pool-validation/`)

| Proof | File | Depends on GELB's commit | Content |
| --- | --- | --- | --- |
| JP-R baseline | legacy suites | no | Step 16 / Step 23 suites on the pre-change tree |
| JP-U-PINK-1 (D-JP-1) | `legacy-matchers-identity-name.test.ts` | yes (C6) | both matchers over a VERIFIED Gemini-shaped analysis; flat fixture shapes keep their scores; live analyses route reports matched demo requirements |
| JP-P-PINK-1 (layer separation) | `layer-separation.test.ts` | partly | static import analysis: no edge C/P → D, no edge HR loop / legacy matchers → job-pool, HR routes untouched |
| JP-H / JP-C / JP-I | `http-canonical-inverse.postgres.test.ts` | yes | status codes of §5, idempotent and key-order-independent upload, one DOCUMENT source per upload with hash and rendering invariants, full chain walk through the existing repositories, C3/C7 tables per requirement, batch run persisted, byte replay, stored bytes reproduce the upload id, presentation matching (CP-I1..I4, Step-23 weak rule, basis, verbatim analysis evidence, NOT_EVALUATED canonical state), zero row delta on read, no presentation table, 404/409, unmarked database in the name pattern gets 503 and zero tables |

Fixtures: `fixtures/pool.ts` (ACTIVE pool with 2 organizations, 3 roles incl. one without requirements,
5 requirements covering EXACT, ALIAS, weak evidence, missing, absent necessity, `L5 expert`, `advanced`, empty
level, TOOL_TECHNOLOGY `L4`, LANGUAGE `C1`; negative variants), `fixtures/analysis.ts` (gold case re-shaped to
four capabilities at `identity.name` with verbatim evidence quotes, stamped VERIFIED by `validateCareerAnalysis`).

PINK assumptions the proofs encode (to be confirmed or corrected by the implementation):

- A1 canonical bytes = key-sorted JSON without whitespace (`canonicalJson` in `fixtures/pool.ts`);
  `canonicalSha256` is its SHA-256 and equals `TSREV.rawContentHash`.
- A2 `rawSha256` of the first upload is the SHA-256 of the exact bytes sent.
- A3 the matches route resolves the analysis through `getCareerAnalysisRepository()` (in-memory under vitest).
- A4 evidence quotes of a match are `{ docId, quote }` with the verbatim `context_quote` of the analysis capability.
- A5 a DRAFT pool may be uploaded; matching it answers `409 ERR_INACTIVE_COMPANY_POOL`.
- A6 a schema-valid body above 1 MiB answers `413` before schema validation.

## 3. Evidence

### 3.1 Baseline on the validation tip `24ac9c8` (before GELB's backend commit), 2026-10-10 20:03

```
[test-db] admin role condyn_test_runner (least privilege)
[test-db] created condyn_test_e1a07d697a897d64
 ✓ test/career-company-pool.test.ts (7 tests) 12ms
 ✓ test/career-job-mapping-engine.test.ts (6 tests) 12ms
 Test Files  2 passed (2) · Tests  13 passed (13)
[test-db] dropped condyn_test_e1a07d697a897d64
```

### 3.2 PINK suites on the validation tip (before GELB's backend commit), 2026-10-10 20:10

Expected and observed: D-JP-1 red (the defect), flat-shape preservation green, layer separation green with the
C/P checks skipped (module absent), HTTP/canonical/inverse suite skipped (routes absent).

```
 × D-JP-1 … matchCareerAnalysisAgainstPool matches a canonical analysis whose names live at identity.name   (expected [] to deeply equal [ …(2) ])
 × D-JP-1 … mapCapabilitiesToJobs matches identity.name capabilities …                                      (expected [] to deeply equal [ 'Kubernetes Orchestration' ])
 ✓ D-JP-1 … the flat name / capability_name shapes … keep their scores
 × D-JP-1 … GET /api/career/analyses/{id} reports the matched demo requirement instead of all-missing       (role.matchedCapabilities empty)
 ✓ test/job-pool-validation/layer-separation.test.ts (4 tests | 2 skipped)
 ↓ test/job-pool-validation/http-canonical-inverse.postgres.test.ts (routes absent)
```

Side observation while building the route proof: the legacy analyses route reads
`career_capability_proposal_projection_references` from Postgres on every call; on an empty disposable database it
answers 500 until `initDbSchema()` has run. The proof registers the legacy career schema on the verified disposable
database first. This is pre-existing behaviour, not a Job Pool regression.

## 4. Boundaries and findings for coordination

- F-JP-1 (to GELB): `JOB_POOL_CONNECTION.md` §4 on the branch tip contradicts C1/C2 (per-role `JOB_POOL_JSON_ROLE`
  source). The document must follow the adopted design before integration.
- F-JP-2 (to GELB): role reconstruction batch runs have no Postgres persistence; the view field
  `targetRoleReconstructionBatchRunId` cannot be verified from persisted state. Either persist it (new table under
  B-ENTRY) or mark it as transport-only in the view.
- F-JP-3 (to GELB): under `NODE_ENV=test` the analysis repository is in-memory. The matches route must resolve the
  analysis via `getCareerAnalysisRepository()`; a direct Postgres read would make the HTTP proofs and the HR-loop
  style in-process route tests impossible.
- B-JP-TOKEN: `TOKEN_CONTAINMENT` is listed as a match basis but undefined in the contract; PINK's fixture does not
  exercise it and the proofs only assert that no other basis appears.
- HIA-1 / HIA-2, B-JP-CONTINUITY, B-JP-ACTOR, B-ENTRY: unchanged owner items (see `JOB_POOL_CONNECTION.md` §7).
