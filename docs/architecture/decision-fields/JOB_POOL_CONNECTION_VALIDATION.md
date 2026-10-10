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

- A1 canonical bytes = key-sorted JSON without whitespace of the **schema-normalized** pool (`CompanyPoolDataSchema`
  applies `search_queries: []`); `canonicalSha256` is its SHA-256 and equals `TSREV.rawContentHash`. (Amended after
  `b782793`: PINK's first version hashed the raw upload object; the stored `pool` is the normalized one.)
- A2 `rawSha256` of the first upload is the SHA-256 of the exact bytes sent.
- A3 the matches route resolves the analysis through `getCareerAnalysisRepository()` (in-memory under vitest).
- A4 evidence quotes of a match are `{ docId, quote }` with the verbatim `context_quote` of the analysis capability.
- A5 a DRAFT pool is uploaded with `201`; matching it answers `409 ERR_INACTIVE_COMPANY_POOL`.
- A6 a schema-valid body above 1 MiB answers `413` before schema validation; a missing `analysisId` answers
  `400 ERR_ANALYSIS_ID_REQUIRED`.
- A7 scores and contributions are rounded to 4 decimals (GELB precision); the proofs compare to 3 decimals.

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

### 3.3 Delta `b782793` (GELB backend) merged as `9a4271c`, reconstruction

Top-down read of the delta (32 files, +2247/-24): routes `app/api/career/job-pools/{route,[id]/route,[id]/matches/route}`
delegate to `lib/career/job-pool/http.ts` → `local-composition.ts` (gate identical in form to the HR gate: positive
disposable verdict, unified registration plus `registerJobPoolPersistenceSchema` on the silenced registration client,
otherwise `503 ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED`) → `application.ts` (upload / list / get / matches; analysis
resolved via `getCareerAnalysisRepository()`, F-JP-3 adopted) → `upload.ts` (1 MiB limit, JSON, Zod, reference
integrity, `stableJson`, `JPOOL_<sha256[0:32]>`), `source-content.ts` (one DOCUMENT rendering, id-scoped lines),
`provider.ts` (deterministic role and requirement providers, level table `JOB_POOL_REQUIRED_LEVEL_MAPPING_V1`),
`canonical-mapping.ts` (TSREV → TOREV → TRSB → TROB → `reconstructTargetRoleProfiles` →
`reconstructTargetRequirementsDurably`, upload-scoped entity ids, `NEW_ENTITY_ADMITTED`, pool requirement bound by the
exact `REQUIREMENT <id>: <name>` line), `presentation-matching.ts` (EXACT / ALIAS / TOKEN_CONTAINMENT, weak rule,
4-decimal rounding, tie-break by id, canonical `NOT_EVALUATED`), `persistence-schema.ts` (eight tables incl. the new
`target_role_reconstruction_batch_runs` / `_results`, F-JP-2 adopted), `lib/career/matching/capability-extraction.ts`
(D-JP-1 fix: `identity.name` → `name` → `capability_name`, used by both legacy matchers), `pool.ts` additive fields.
`JOB_POOL_CONNECTION.md` §4 rewritten to the adopted design (F-JP-1 adopted). `tsc --noEmit`: 0 errors.

### 3.4 PINK suites on the merged tip `9a4271c`, 2026-10-10 20:17–20:24

First run: 59 of 63 green; the four reds were PINK-side (A1 raw-vs-normalized bytes, DRAFT fixture with
mismatching `pool_id` correctly refused 422, `recommendations` shape over-specified, list count including the DRAFT
upload) and one proof refinement (F-JP-4 exception). After repair:

```
[test-db] created condyn_test_82db9a6cba8b574b
 Test Files  3 passed (3) · Tests  21 passed (21)
[test-db] dropped condyn_test_82db9a6cba8b574b
```

Together with GELB's own suites in the same run (`test/career/job-pool/*`, `matching-identity-name`, Step 16/23):
`job-pool.postgres` 6/6, `local-composition-gate` 2/2, `provider` 5/5, `presentation-matching` 9/9, `upload` 5/5,
`matching-identity-name` 2/2, `career-company-pool` 7/7, `career-job-mapping-engine` 6/6.

Notable timings: the unmarked-database child-process proof 3.2 s (tsx start-up), the first upload 2.0 s (gate
registration of the unified schema plus the eight job pool tables).

### 3.5 Full-tree JP-R on `9a4271c` (b782793), 2026-10-10 20:19–20:31, load 5–7

`npm run test:isolated` over the whole tree as the role on `condyn_test_9c97abff315d982b` (dropped afterwards):

```
 Test Files  8 failed | 358 passed | 8 skipped (374)
      Tests  35 failed | 2326 passed | 11 skipped (2372)
   Duration  753 s
```

Idle, sequential re-run (`--no-file-parallelism`, load 2.4) of the eight red files on `condyn_test_8d8564f58a9fe18f`:

| File | Full batch | Idle sequential | Classification |
| --- | --- | --- | --- |
| `test/career/relation-adapters/…/career-outcome-valence-feedback-context-revision-postgres.test.ts` | 4 of 8 timed out | 8/8 (19.0 s) | load (known COVFCR sensitivity) |
| `test/career/relation/…/career-outcome-valence-feedback-context-revision-replay.test.ts` | 2 of 5 timed out | 5/5 (15.4 s) | load |
| `test/career/outcome-valence-feedback-context-revision-lifecycle/field-integration.test.ts` | 1 of 2 timed out | 2/2 (7.2 s) | load |
| `test/decision-core/structural-consequences/reconstruct.test.ts` | 1 of 8 timed out | 8/8 (3.6 s) | load (known) |
| `test/career-lifecycle-concurrency-idempotency.test.ts` | 6 of 6 | red | F-JP-5 |
| `test/career-lifecycle-postgres-persistence.test.ts` | 6 of 14 | 6 of 14 red | F-JP-5 |
| `test/career-lifecycle-recovery.test.ts` | 5 of 6 | 5 of 6 red | F-JP-5 |
| `test/career-policy-activation-atomicity.test.ts` | 10 of 10 | 10 of 10 red | F-JP-5 |

Root cause of the lifecycle reds (Case 1, derivable): `PostgresError 42703: column "version" of relation
"career_policy_versions" does not exist`. The legacy DDL `lib/career/db/client.ts:128` (blame `1c64dc1a`,
2026-08-17) creates `career_policy_versions(id, timestamp, payload_hash, payload)`, while `lib/career/db/schema.ts:111`
and the lifecycle repositories expect `(id, version, parent_version, created_at, created_by, payload_hash, payload)`.
On every fresh database the legacy DDL wins; the shared `condyn` evidently carries the drizzle shape, which is why
these suites were green there (and why they were the suites that deleted shared rows in incident DB-1). The job pool
delta touches neither file (`git diff 24ac9c8 HEAD -- lib/career/db` is empty). Recorded as F-JP-5.

### 3.6 Delta `478bdbe` (GELB: D-JP-2..5 repairs, F-JP-4 relocation, COMPOSITE_CONSTITUENT) merged as `6ba6a80`

Reconstruction of the delta (13 files): `lib/persistence/registration-client.ts` now owns the silenced registration
client, the HR path re-exports it (F-JP-4 closed); `presentation-matching.ts` adds the basis `COMPOSITE_CONSTITUENT`
(priority EXACT > ALIAS > COMPOSITE_CONSTITUENT > TOKEN_CONTAINMENT; conjunction split on ` and `, ` und `, ` & `,
` + `, `,`, `;`, never on `/`; full match under the 0.7 rule; new always-present `matchedConstituent`);
`career-analysis-job-processor.ts` pins `metadata.loadedAt` to `job.createdAt` (D-JP-2) and persists the candidate
source bundle JSON-stable (D-JP-3); `capability-core/projection/reader.ts` accepts shared content-addressed evidence
ids and repeated documents in provenance (D-JP-4/5). `tsc --noEmit`: 0 errors.

PINK extension: pool requirement `req_pink_beta_3` ("Node.js", no level, no necessity) and analysis capability
`CAP_PINK_COMPOSITE` ("TypeScript and Node.js", 0.8). Expected and proven: basis `COMPOSITE_CONSTITUENT`,
`matchedConstituent: "Node.js"`, full contribution 0.24, role score (0.81 + 0.24) / 1.4; `matchedConstituent` is
`null` on every other basis; C3/C7 states UNKNOWN/UNKNOWN for the new requirement. Layer-separation proof strict again.

Run on `6ba6a80` as the role (`condyn_test_023479d7fcc2dd68`), 2026-10-10 20:45:

```
 Test Files  13 passed (13) · Tests  69 passed (69)
```
(PINK: 3 files / 22 tests; GELB job pool: 5 files / 27; matching-identity-name 2; Step 16/23: 13;
worker-retry-source-bundle and shared-evidence: 5.)

### 3.7 Full-tree JP-R on `6ba6a80` (478bdbe), 2026-10-10 20:40–20:51, load 4–5 (GELB's manual environment with worker running)

```
 Test Files  7 failed | 361 passed | 8 skipped (376)
      Tests  30 failed | 2337 passed | 11 skipped (2378)
   Duration  650 s
```

| File | Full batch | Idle re-run | Classification |
| --- | --- | --- | --- |
| four G1 lifecycle suites | 27 red | not re-run | F-JP-5 (pre-existing, owner item) |
| `decision-core/structural-consequences/reconstruct.test.ts` | 1 timeout | 8/8 (3.6 s) | load (known) |
| COVFCR persistence `…-postgres.test.ts` | 1 timeout | 3 timeouts at load 4.2; idle re-run pending (see §3.8) | load |
| `decision-integration/g2-g3-vertical-proof.test.ts` | 1 red | 63/63 after P8 inventory update | admitted additive delta |

P8 inventory delta (PINK's own proof): `ea8db60` added `test/career/capability-core/projection/shared-evidence.test.ts`
(D-JP-4/5 regression). The P8 preservation check counted 37 capability-core files and required the directory to be
diff-free against `435a112`. The proof now carries the single admitted additive suite explicitly (`37 + 1`, file must
exist, excluded from the diff-free check); every other file of the sealed inventories remains byte-identical to
`435a112`. No sealed suite was changed.

### 3.8 COVFCR idle re-run on `6ba6a80`, 2026-10-10 20:58, load 1.9

```
[test-db] created condyn_test_e0e75499bf0505fb
 ✓ …/career-outcome-valence-feedback-context-revision-postgres.test.ts (8 tests) 20548ms
 ✓ …/career-outcome-valence-feedback-context-revision-replay.test.ts (5 tests) 17178ms
 ✓ …/outcome-valence-feedback-context-revision-lifecycle/field-integration.test.ts (2 tests) 8370ms
 Test Files  3 passed (3) · Tests  15 passed (15)
```

Convergence state on `6ba6a80`: every red of the full-tree batch is either F-JP-5 (pre-existing, owner item) or a
load timeout that passes idle. No red is attributable to the Job Pool delta. Open for the final round: JP-B
(browser) and the combined tip with GRÜN's `frontend/job-pool-workflow`; JP-M remains GELB's live evidence.

### 3.9 Combined tip `a62b6f9` (GRÜN `frontend/job-pool-workflow` + GELB) merged as `6a1c375`: final JP-R and JP-B

Reconstruction of GRÜN's delta: `lib/career/job-pool/frontend-presentation.ts` (strict decoders of the §5 bodies, label
derivation from literal fields, ranking descriptor), `lib/career/ui/useJobPool.ts` (four routes, closed unions),
`app/components/career/demo/JobPoolMatchPanel.tsx` (upload, explicit selection, canonical mapping, ranked matches with
basis, constituent, evidence, `NOT_EVALUATED`, non-claims; `data-*` state attributes), additive props on the demo
page, `npm run job-pool:local` (registration plus career worker on the verified disposable URL), Chromium e2e and
proof world. GELB's `a62b6f9` moved `shared-evidence.test.ts` out of the sealed capability-core directory, so the P8
inventory is strict again (37 files, diff-free against `435a112`): PINK dropped the `37 + 1` admission.
`tsc --noEmit`: 0 errors. PINK's layer-separation proof now also covers the panel and the client hook (no decision edge).

Job Pool batch on `6a1c375` as the role (`condyn_test_85af51ad98dabddd`), 2026-10-10 21:02:

```
 Test Files  18 passed (18) · Tests  154 passed | 3 skipped (157)
```
(PINK 3 files / 22; GELB and GRÜN job pool suites incl. `panel-ssr`, `client-reads`, `frontend-presentation`,
`e2e` HTTP section; `g2-g3-vertical-proof` 63/63 strict P8; Step 16/23; worker and shared-evidence suites.)

JP-B (GRÜN's Chromium e2e, run by PINK as the role with `CONDYN_PLAYWRIGHT_MODULE`, `condyn_test_95dfe5d4e1d9cf48`):

```
 ✓ test/career/job-pool/e2e/job-pool-workflow.e2e.test.ts (8 tests) 33750ms
```

JP-B-PINK (independent browser walk, `test/job-pool-validation/browser-walk.e2e.test.ts`,
`condyn_test_95e372e18ab9a34c`, 21:14): real `next dev --webpack` and Chromium on a disposable database; PINK's
pool uploaded through the file chooser with actor `PINK_BROWSER_WALK`, selected explicitly; every rendered rank,
resonance score, matched count, match basis, composite constituent (`Node.js`), evidence quote, `NOT_EVALUATED`
state and TRPREV/TRQREV id equals the matches body of the same server, and every rendered TRQREV id resolves through
`PostgresTargetRequirementRevisionRepository` on that database; no HR dock element present; zero page errors.
Evidence: `evidence/job-pool-validation/pink-01-browser-walk-ranked-matches.png`.

```
 ✓ test/job-pool-validation/browser-walk.e2e.test.ts (1 test) 19291ms
```

Final full-tree JP-R on `6a1c375` as the role (`condyn_test_b0bc8bc9a08d1cc8`), 21:05–21:14, load 2–4.5:

```
 Test Files  4 failed | 368 passed | 8 skipped (380)
      Tests  27 failed | 2368 passed | 8 skipped (2403)
   Duration  557 s · timeouts: 0
```

The four red files are exactly the F-JP-5 lifecycle suites (27 tests, pre-existing legacy DDL drift). No other red.

Convergence: on the combined tip every proof of the plan that PINK owns is green (JP-U-PINK, JP-P, JP-H, JP-C, JP-I,
JP-R, JP-B, JP-B-PINK); JP-M is GELB's live evidence (`JOB_POOL_CONNECTION.md` §9, GRÜN's run record §7). PINK has no
open finding against the Job Pool delta. Open owner items: F-JP-5, HIA-1, HIA-2, B-JP-CONTINUITY, B-JP-ACTOR,
B-JP-GEMINI (PINK has no live model evidence of its own).

### 3.10 JP-PDF: the manual path automated without Gemini (`test/job-pool-validation/pdf-path.postgres.test.ts`)

Requested by GELB under the owner mandate "INTEGRATED FIELD CONVERGENCE" (2026-10-10): the PDF path had only been
proven with text sources. PINK's proof drives, on the disposable database as the role:

1. `POST /api/career/analyze` with `{ type: "pdf", content: <base64> }` → `202` and a `JOB_` id;
2. `JobRepository.claimNextJob` on PostgreSQL;
3. the production processor (`createCareerAnalysisJobProcessor`) with the production `prepareDocuments`
   (batch loader → `pdf-parse`), the real `PostgresCandidateSourceBundleRepository` (JSONB) and the real projection
   reference repository; the legacy pipeline runs with the deterministic `MockInferenceProvider`; only the capability
   proposal executor is a stub whose first call fails transiently;
4. attempt 1: the bundle `CSB_<jobId>` is persisted with one `PDF` document, `loadedAt` pinned to the job's
   `createdAt` (D-JP-2) and the extracted text present; attempt 2 rebuilds a deep-equal bundle (D-JP-3) and succeeds;
5. `GET /api/career/jobs/{id}` → `SUCCEEDED`; `GET /api/career/analyses/{id}` → `200 VERIFIED` with capabilities at
   `identity.name`;
6. PINK's pool uploaded through the job pool route and matched against that analysis → `200`,
   `candidateCapabilityCount` equal to the analysis capabilities, every role `NOT_EVALUATED`.

Two PDFs: a hand-written single-page PDF generated in the test (no committed binary needed) and GELB's synthetic
two-page CV `docs/examples/cv.synthetic.pdf` (`cf112ec`; extracted text begins "Alex Example — Curriculum Vitae").

Run on `1ed5bf1`+`cf112ec` merged (`condyn_test_d9c58882fa6d604e`), 2026-10-10 21:37:

```
 ✓ test/job-pool-validation/pdf-path.postgres.test.ts (2 tests) 2195ms
```

Boundary: the proposal executor (Discovery/Convergence model calls) is stubbed; the live Gemini evidence for the PDF
path is GELB's (JP-M). The legacy `MockInferenceProvider` output is deterministic and not a model result.

## 4. Boundaries and findings for coordination

- F-JP-1 (closed in `b782793`): `JOB_POOL_CONNECTION.md` §4 followed the per-role `JOB_POOL_JSON_ROLE` design;
  rewritten to C1/C2.
- F-JP-2 (closed in `b782793`): role reconstruction batch runs now persist in
  `lib/career/target-adapters/role-reconstruction-artifact-persistence` (immutable, raw output bound to its hash).
- F-JP-3 (closed in `b782793`): the matches route resolves the analysis via `getCareerAnalysisRepository()`.
- F-JP-4 (closed in `3a74ad0`): the registration client moved to `lib/persistence/registration-client.ts`; the
  layer-separation proof tolerates no exception.
- F-JP-5 (open, owner item, pre-existing): legacy DDL drift on `career_policy_versions` (§3.5). Every G1 lifecycle
  suite is red on any fresh database; the shared database carries the newer shape. Repair belongs to the G1 schema
  owner (align `applyCareerDbSchema` with `lib/career/db/schema.ts`, or register the drizzle shape). Same class:
  `test/career-worker-recovery-pipeline.test.ts` deletes from `career_analysis_jobs` before the table exists (GELB).
- B-JP-GEMINI (PINK): the proofs do not reproduce the live Gemini worker path. D-JP-2..5 are covered by GELB's
  regression suites (in PINK's batch, green) and by GELB's live run (JP-M); PINK has no independent live evidence.
- B-JP-TOKEN: `TOKEN_CONTAINMENT` is defined in `presentation-matching.ts` (every token of the requirement name or an
  alias occurs in the capability name; always weak evidence) and covered by GELB's unit suite; PINK's HTTP fixture
  exercises EXACT, ALIAS, COMPOSITE_CONSTITUENT, weak evidence and missing, and asserts that no other basis appears.
- HIA-1 / HIA-2, B-JP-CONTINUITY, B-JP-ACTOR, B-ENTRY: unchanged owner items (see `JOB_POOL_CONNECTION.md` §7).
