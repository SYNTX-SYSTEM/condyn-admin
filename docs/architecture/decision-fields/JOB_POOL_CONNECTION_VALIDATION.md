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

### 3.11 Sweep coverage delta `7134952` (GELB, `integration/job-pool-sweep-coverage` @ `9945565`) merged as `a8ab938`

Contract additions (`lib/career/job-pool/types.ts`): `sweepProposal` on every matched, weak and missing entry (always
present, `null` when uncovered; `scored: false`, `evidenceState: SOURCE_MATCH_VERIFIED`, `authorityState: NONE`),
`sweepOnlyCoverageCount` per role, `capabilitySweep { state: AVAILABLE | NOT_PRODUCED | FAILED, proposalCount,
scored: false }` on the body. The application reads the F11 projection with the same reader as the analyses route; a
reader error marks `FAILED` and never alters the analysis matching.

PINK proofs:

- `sweep-coverage.test.ts` (unit, GELB's matching function with PINK's pool and analysis): every scored and ranked
  field is byte-identical with, without and with a FAILED sweep; a proposal covering the missing requirement
  `req_pink_alpha_3` appears as `sweepProposal` (EXACT, verified quote, unscored) and counts once in
  `sweepOnlyCoverageCount`; a composite proposal covers `req_pink_beta_3` by `COMPOSITE_CONSTITUENT` without
  changing its score; an unrelated proposal appears nowhere.
- `http-canonical-inverse.postgres.test.ts`: a seeded analysis answers `capabilitySweep NOT_PRODUCED / 0 / false`,
  `sweepProposal: null` everywhere, `sweepOnlyCoverageCount: 0`.
- `pdf-path.postgres.test.ts`: the job without proposals answers `NOT_PRODUCED`; a second job of the same PDF whose
  executor claims a proposal lineage without `RUN_` / `CONV_` rows is refused by the foreign keys of
  `career_capability_proposal_projection_references` (no dangling reference can exist; the canonical analysis of that
  attempt is persisted, the reference is not, the job stays RUNNING), and its matching is byte-identical to the first
  job's.

Boundary B-JP-SWEEP-AVAILABLE: PINK has no HTTP-level `AVAILABLE` or `FAILED` case. `AVAILABLE` needs persisted
Discovery/Convergence runs (GELB's live evidence); `FAILED` needs a payload-level lineage violation behind valid foreign
keys. Both are covered by GELB's unit and PostgreSQL suites in PINK's batch.

### 3.12 Final independent validation of the authoritative tip `b4091f5` (owner mandate "SFE — FINAL INDEPENDENT VALIDATION")

Synchronization: GELB named `integration/job-pool-connection` @ `b4091f5` as the final integrated state (GRÜN's sweep
decoder and panel `5839762`, PINK's suites up to `675590b`, GELB's record §11). PINK's head `fac4980` is tree-identical
to `b4091f5` outside PINK's own files (`git diff --stat b4091f5 HEAD` is empty except `test/job-pool-validation/**` and
this record). `tsc --noEmit`: 0.

Reconstruction of GRÜN's delta `5839762`: strict decoder of `sweepProposal`, `sweepOnlyCoverageCount` (must equal the
count of covered missing entries) and `capabilitySweep` (`scored` must be `false`); panel test ids
`job-pool-capability-sweep` (`data-sweep-state`, `data-proposal-count`, `data-scored`),
`job-pool-role-<role>-<matched|weak|missing>-<req>-sweep` (`data-sweep-basis`, `data-proposal-id`, `data-scored`),
`job-pool-role-<role>-sweep-only` (`data-count`).

Full-tree JP-R on the final content (`condyn_test_f250731109ee92a1`, 2026-10-10 21:44–21:53, load 2.6, 0 timeouts):

```
 Test Files  6 failed | 369 passed | 8 skipped (383)
      Tests  29 failed | 2376 passed | 8 skipped (2413)
```

Classification: 4 files / 27 tests F-JP-5 (legacy DDL drift, pre-existing); 2 files / 2 tests PINK-side, caused by
PINK's own edits landing while the batch ran: the seeded browser walk's new selector `[data-testid$="-sweep"]` also
matched the `job-pool-capability-sweep` container (narrowed to role lines), and the new live suite spelled the
shared-database opt-in name while removing it from child environments, which the static access-path guard forbids
(now filtered by prefix). Both re-run green together with the guard
(`condyn_test_383d26b7034e89a5`: access-paths 5/5, browser-walk 1/1, live suite skipped without key). No red is
attributable to the final tip.

Seeded browser walk (JP-B-PINK) extended: `capabilitySweep NOT_PRODUCED / 0 / false` in the DOM equals the body,
no role sweep line rendered, every `sweep-only` count 0.

**JP-LIVE (PINK's reproduction of the manual workflow in a real browser, with the real model).**
`test/job-pool-validation/live-browser-workflow.e2e.test.ts`, gated on `GEMINI_API_KEY` in the process environment
(skipped with reason otherwise). The key and `GEMINI_MODEL` were loaded from the operator's main-checkout env file
into the one test command only, forwarded to the `next dev` and `run-career-worker` children, never printed or stored
(B-GEMINI). Disposable database `condyn_test_d0155af7bdb90910` (GRÜN's world fixture, dropped afterwards) plus the
runner's `condyn_test_213e1e83254abeea` (dropped).

| Step | Observed |
| --- | --- |
| PDF `docs/examples/cv.synthetic.pdf` into the source dock, `START INTAKE ANALYSIS` | `intake-success-banner` after 132 s, one attempt, 0 failed worker attempts |
| Job Pool panel | `data-analysis-source = JOB_RESULT`, `ANL_1791662108286_357` |
| PINK pool uploaded via file chooser, selected | `JPOOL_6CA8892F9AD0F6AC316F8FC3F6294BB7` (same id as every earlier PINK upload: canonical bytes) |
| matches body | `capabilitySweep AVAILABLE`, 17 proposals, `scored: false`; legacy analysis 3 capabilities |
| inverse | projection reference row exists for the analysis; the F11 reader returns exactly 17 proposals; every rendered sweep line (3) equals its body entry in basis, proposal id, name and `scored=false`; every `sweep-only` count and every score equals the body; no HR dock element; 0 page errors |
| model | `gemini-3.1-pro-preview` (GELB's manual runs used the same; GRÜN's used `gemini-3.8-flash`) |

Evidence: `evidence/job-pool-validation/pink-02-live-sweep-completed.png`, `pink-03-live-sweep-coverage-in-panel.png`,
`pink-live-run.json` (ids, timings, per-role counts). Observation consistent with GELB's HIA-3 note: the scored legacy
analysis produced 3 capabilities (scores 0.10 / 0 / 0 for PINK's roles) while the unscored sweep produced 17 proposals
covering two of the missing requirements; scores follow the legacy analysis by contract.

**Convergence verdict on `b4091f5`.** Verified: JP-U-PINK, JP-P (strict, incl. frontend), JP-H, JP-C, JP-I, JP-PDF,
sweep invariants, JP-B (GRÜN's e2e 8/8 and PINK's walk), JP-LIVE, full-tree JP-R with every red classified. Documented
legacy exception: F-JP-5. Authority boundaries unchanged: HIA-1, HIA-2, HIA-3 (scoring the sweep), B-JP-CONTINUITY,
B-JP-ACTOR, B-GEMINI (key from the operator's shell), B-JP-SWEEP-AVAILABLE now closed at HTTP level by JP-LIVE for
`AVAILABLE` (`FAILED` remains unit-level only). No open PINK finding against the tip.

### 3.13 Job Field semantic validation (owner mandate "SFE — INDEPENDENT JOB FIELD VALIDATION", 2026-10-11)

Synchronization: GELB's governance base `integration/job-field-governance` @ `990130c` (glossary and rules SG-1..SG-6 in
`JOB_POOL_CONNECTION.md` §12, guard `test/career/job-pool/semantic-governance.test.ts`); GRÜN's Job Field on
`frontend/job-field` (JOB focus, contract of 2026-10-11: `data-field-focus`, `job-field*` test ids, pending kinds
UNPROVEN_CANONICAL / UNRESOLVED_EVIDENCE / UNSCORED_COVERAGE / NO_EVIDENCE_DELIVERED, nearest presented role, distance
= 1 − resonanceScore, "POOL RESONANCE (PRESENTATION)"). Owner environment not touched: 127.0.0.1:3017 and
`condyn_test_e46502b73c9f316f`.

PINK reconstruction of the Job Field at `04ded74` (adapter `lib/career/ui-adapter.ts`, orbit views, derivation
`lib/career/matching/{alignment,derivation}.ts`, F11 overlay `lib/career/capability-proposal-sil-adapter.ts`, panel):

| Relation | Source → surface | PINK finding |
| --- | --- | --- |
| capability | analysis.capabilities → orbit 02; replaced by F11 proposals when a projection exists; panel candidates = analysis.capabilities | F-JF-1: two sources on one screen without a source label (live run: orbit 17 items, panel 3 candidates) |
| job role | analysis.roles with REQUIRES → orbit 04, fit = equal-weight fraction of requirements aligned by exact lowercase name equality | F-JF-2: one name relation, two equality semantics (exact vs NFKC/alias/composite in the panel); F-JF-3: `recommendationId` from `Date.now()`/random inside a proof chain |
| resonance | analysis.organizations → orbit 03, never scored; pool aggregates → panel only | F-JF-6: naming collision, resolved for the Job Field by GELB's G2 qualifier |
| pending | F11 proposed relations validated by the reader, dropped by the SIL adapter; `capabilityGaps` always `[]` → orbit 05 structurally empty | F-JF-4 |
| legacy list views | `RoleManifestation`, `ResonanceOrbits`, `CapabilityField` imported, not rendered; label `fitScore == null` as "UNSUPPORTED", undefined confidence as "0%" | F-JF-5 (latent SG-2 violation) |

Findings sent to GELB (F-JF-2/3 and the list) and GRÜN (F-JF-1/4/5) for root repair on 2026-10-11.

PINK proofs prepared against the contract (skip with reason until GRÜN's push is integrated):
`test/job-pool-validation/job-field-static.test.ts` (SG-1: Job Field files read no LLM-inferred organizations, roles
or entity names; SG-4 imports; SG-5/6 vocabulary), `test/job-pool-validation/job-field.e2e.test.ts` (JOB focus in a
real browser on a disposable database: every role value equals the matches body, count sums equal the TRQREV count,
delivered order, nearest-role rule, distance, pending kinds with counts and ids, requirement states and provenance,
legend and non-claims, no RRL_/TSN_/EIS_/RCP_ in the DOM, stage shells 01–06 kept, HR dock absent; distinct
NO_ANALYSIS / NO_POOL / INACTIVE_POOL states).

#### 3.13.1 GELB's root repair `cf2d084` (integration/job-field-governance) validated, merged as `a5dc75e`

Delta: `lib/career/ui-adapter.ts` wraps `evaluateAlignment` per REQUIRES requirement; when a capability of the same
name exists and the proof chain refuses with `ERR_EPISTEMIC_VIOLATION` (one document proving both sides, the normal
single-CV case) or `ERR_PROOF_CHAIN_BROKEN` (document absent from a source manifest, which the analyses route never
delivers), the relation is stated `UNRESOLVED` with the capability id; every other error still propagates. GELB's
probe of both real PDF analyses in the owner environment found 0 role→REQUIRES relations, so the exact-equality
alignment is dormant and the real defect was a latent whole-field crash on any name coincidence. Proof
`test/career/planetarium-role-alignment.test.ts`.

PINK inverse (same test file against the pre-repair adapter `990130c` checked out temporarily, then restored):

```
pre-repair:  2 failed | 1 passed  (ERR_EPISTEMIC_VIOLATION: Document DOC_001 cannot be used to prove both …;
                                   ERR_PROOF_CHAIN_BROKEN: Document DOC_001 exists but missing from origin source manifest)
repaired:    3 passed
```

Regression on the merged head (`condyn_test_172764f305a11d58`): ui-adapter, recommendation proof chain,
capability-requirement alignment, SIL orbit contract, proposal SIL projection, semantic governance, DB-1 recovery
candidate, PINK layer and sweep suites: 9 files / 37 tests green.

Resolution of PINK's findings (GELB §12.3): F-JF-2 repaired as above (equality semantics left dormant and unchanged,
recorded); F-JF-3 not changed at the source: `REC_<Date.now()>_<random>` is the G1 legacy lifecycle id format under
the legacy freeze, the DB-1 recovery candidate depends on it, and the planetarium exposes neither the id nor the
derivation (proven) → owner boundary **B-JF-REC-ID**, accepted by PINK. F-JF-1, 4, 5, 6 assigned to GRÜN as
presentation items; PINK's Job Field proofs bind their labels when the Job Field lands.

#### 3.13.2 GRÜN's Job Field `frontend/job-field` @ `8e876fd` validated, merged as `22bb539` (with GELB's `cf2d084`)

Contract clarifications bound (GRÜN, 2026-10-11): `data-resonance-score` verbatim body value, `data-distance` =
clamp01(1 − score) unrounded (numeric tolerance), `data-pool-id` = the selected upload id (`JPOOL_…`),
`data-ids` of `UNPROVEN_CANONICAL` = the role's TRQREV ids in delivered order, other kinds = pool requirement ids,
`data-field-state` authoritative. Source wording (F-JF-1) in the legend: "ANALYSIS CAPABILITIES (SCORED SOURCE): n ·
SWEEP PROPOSALS (UNSCORED): m"; authority wording on the nearest presented role; laws on the non-claims line.

PINK-side corrections while binding (no Job Field finding): the SG-1 token `roleMatches` also names the pool body
field (now `activeData.roleMatches`, `demo-data`, `ui-adapter` imports and the entity grammar are the forbidden
tokens); the legend copy lives in `sil-language.ts`, not in the Job Field sources; the authority wording sits on the
nearest element, not the legend.

Reconstruction: `lib/career/job-pool/job-field-presentation.ts` derives everything from `JobPoolMatchPresentation`
only (requirement states MATCHED / UNRESOLVED / COVERED_UNSCORED / NO_EVIDENCE_DELIVERED, four pending kinds never
merged, distance = clamp01(1 − resonanceScore), grouping by `poolOrganizationId` only, nearest = first delivered role
with a scored match); `JobField.tsx` renders it with the contract ids. GRÜN resolved F-JF-1 (legend), F-JF-5 (legacy
list components no longer imported), F-JF-6 (orbit 03 subtitle "Inferred organisations (analysis) · not pool
resonance"); F-JF-4 and the orbit 02/04 relabels are blocked by sealed SIL language tests → owner boundary
**B-ORBIT-COPY** (recorded in `JOB_FIELD_FRONTEND.md` §5).

Runs as the role (load 5–14 from peer batches; no timeout):

```
condyn_test_3f85a9d211cd974d  Job Field + Job Pool + adapter suites: 23 files green (GRÜN e2e 10/10, PINK browser walk,
                              HTTP/canonical/inverse, PDF path, SSR, governance, planetarium alignment, orbit contract);
                              PINK job-field proofs red on three PINK-side assumptions (above)
condyn_test_58133f9f9e6c9583  PINK job-field.e2e 2/2 and job-field-static 3/3 green after the corrections
```

Evidence: `evidence/job-pool-validation/pink-04-job-field-job-focus.png`.

#### 3.13.3 HR composition proof on the shared runner database: `a9121b9` superseded by root repair `8f95afc`

`a9121b9` relaxed the precondition of `test/career/hr-decision-loop/local-composition.postgres.test.ts` to "nothing or
the complete unified set"; GELB's own full tree showed it still red (1 of 40 unified tables pre-created by another
suite; seeding on a table another suite had created). Root repair `8f95afc`: the proof creates, verifies and drops its
**own** disposable database (`createDisposableTestDatabaseNamed` on the runner's verified basis,
`verifyDisposableTestDatabase`, `dropDisposableTestDatabase`), binds `DATABASE_URL` to it in `beforeAll` before the
unified registration, composition and application client are imported (dynamic imports), and restores the runner URL
afterwards. The original strict precondition `expect(before).toEqual([])` is back, a stronger claim than before.
PINK reading: correct root cause (one shared runner database per run); the repair removes the file-order dependence
for this proof without touching any other database; marker verification and drop keep the hard boundary. Combined tip
retargeted to `integration/job-field-governance` @ `d339c8c` (includes GRÜN's docs `5b788fc`), merged as the current
PINK head; tree-identical outside PINK's files.

#### 3.13.4 Full-tree JP-R on the combined tip `d339c8c` (PINK head `ec39b40`), classification and verdict

Run as the role on `condyn_test_1a81c4bc6953fe4f` (dropped), 2026-10-11 04:14–04:33, started at load 2.9, load 5–8
during the run (an operator browser process and a peer batch):

```
 Test Files  13 failed | 368 passed | 9 skipped (390)
      Tests  44 failed | 2388 passed | 9 skipped (2441)
   Duration  1113 s · timeouts: 34 · other non-lifecycle reasons: none
```

| Class | Files | Evidence |
| --- | --- | --- |
| F-JP-5 legacy DDL drift (pre-existing) | 4 lifecycle suites, 27 tests | unchanged cause (§3.5) |
| load timeouts at the 5 s default | 9 files (5 COVFCR suites, decision-core context/contract, structural-consequences/reconstruct, validation/authority, g2-g3-cross-relation) | every red is `Test timed out in 5000ms`; sequential re-run at load 3–5: 2 files green, 7 still timing out; diagnostic run of those 7 with `--testTimeout=60000` (no committed test changed): 7 files / 71 tests green at load 5–6 (`condyn_test_42b042889205e1b2`); none of the suites imports `ui-adapter.ts`, `job-field-presentation.ts`, `sil-language.ts` or `JobField.tsx` (grep over the relation, decision-core, decision-runtime, outcome-valence libs and the suites: no edge) |

No red is attributable to the Job Field round. The idle re-run of the COVFCR and decision-core suites at load 1.9
(§3.8, same files) stands as the reference for their default-timeout behaviour; a truly idle machine was not available
during this round (owner environment and peers active).

**Verdict (owner mandate "SFE — INDEPENDENT JOB FIELD VALIDATION").** Verified on `d339c8c`: semantic reconstruction
of the four relations, findings F-JF-1..6 resolved at their source or recorded as owner boundaries (B-JF-REC-ID,
B-ORBIT-COPY), GELB's root repairs `cf2d084` and `8f95afc` proven by inverse, GRÜN's Job Field proven by SSR, Chromium
e2e and PINK's independent JOB-focus browser proof, static SG guards green, Job Pool and HR loop suites green, full
tree classified. Documented legacy exception: F-JP-5. Authority boundaries unchanged: HIA-1/2/3, B-JP-CONTINUITY,
B-JP-ACTOR, B-GEMINI, B-JF-REC-ID, B-ORBIT-COPY, B-JF-SESSION. The shared `condyn` database and the owner's manual
environment (`127.0.0.1:3017`, `condyn_test_e46502b73c9f316f`) were never touched.

### 3.14 Pool Field round and acceptance plan (2026-10-11)

Owner mandates "SEMIONTIC FRONTEND RECONSTRUCTION", "SEMIONTIC INFORMATION FIELD RECONSTRUCTION", "SEMIONTIC JOB POOL
FIELD" and "POOL FIELD RUNTIME HANDOVER" produced GRÜN's `ce76bc7`, `a3a4f04`, `1e5c2e3` (third field state POOL,
the panel rebuilt as the Pool Field) and GELB's integrations `0353cd9`, `093b9e6`, `d17b042`. PINK validated each
delta on merge with the Job Field browser proof, the browser walk, the static SG guard, layer separation and the
peers' suites (last run on `d17b042` content: 11 files / 55 and 18 files / 102 green). The owner's environment was
moved to `d17b042` by GELB; PINK ran nothing against it.

Finding E-07 (PINK → GRÜN, Case 1): after `job-field-exit-btn` the field was CAPABILITY but the URL kept the upload
id without a focus, so a reload opened the Pool Field (B-POOL-INITIAL-FOCUS). Fixed by GRÜN in `627ec07`: every
exit to the ground state writes `focus=CAPABILITY` when an upload is selected and `page.tsx` accepts it; proven by
GRÜN's e2e (reload after exit) and by PINK's `job-field.e2e.test.ts`, extended with exit → URL `focus=CAPABILITY` →
reload → CAPABILITY with neither field mounted (2/2 green on `627ec07`, `condyn_test_34532128529c278c`).

The acceptance plan deliverable (owner mandate "COMPLETE SYSTEM ACCEPTANCE TEST PLAN") lives in
`docs/acceptance/CONDYN_SYSTEM_ACCEPTANCE_TEST_PLAN_v1.2.md` with its scenario index; versions 1.0.0 (`cccd647`)
→ 1.2.2 (`d17b042` + `627ec07`), taken onto the integration branch by GELB at each single-tip release.

### 3.15 Lens Field handover: read-only proof against the owner environment on `bfe0d27` (2026-10-11)

Owner mandate "Lens Field handover": GELB moved `127.0.0.1:3017` from `ee4c4dc` to `bfe0d27` (= `01b1d7b` + plan
1.3.0; the only tree difference to PINK's `5070425` is this record), database `condyn_test_e46502b73c9f316f` reused
without `--fresh` (GELB's inventory identical before and after: 123 tables, 280 rows, 4 analyses, 1 pool). PINK ran one
independent, GET-only browser proof on the existing analyses `ANL_…612` and `ANL_…831` with
`JPOOL_30F7145E21F34BEF0FCE510DFC75837B`: `test/job-pool-validation/support/lens-readonly-proof.mjs` (Chromium via
`CONDYN_PLAYWRIGHT_MODULE`, 1600×1000; records every non-GET request the page issues and fails on any; no upload, no
analysis, no SQL). Dry-run first on PINK's own disposable environment (`condyn_test_8092dd55da95d96a`, port 3117,
fixture analysis + validation pool), which found two script assumptions (onboarding overlay, moon radius formula) and
the same product observation as below; the disposable database was dropped afterwards.

Result on the owner environment, 2026-10-11T11:21Z: 88/90 checks green, `nonGet = []`, 0 page errors; evidence
`evidence/lens-owner-bfe0d27/` (four frames, `report.json`, `manifest.sha256`; the full set of twelve frames is in
PINK's scratchpad). Green per analysis: `LENS_V1` at FIELD with camera 1, no lens, legend folded, role count and pool
id equal to the GET bodies; caption on the nearest role (612: `role_fullstack`; 831: `job-field-no-nearest`),
`data-caption-side`, pointer-transparent, authority label 10.5 px, caption box not covering its body (B-LENS-HIT);
ROLE by click: camera 1.5, lens with the role detail, caption gone, moon labels = requirements of the canonical mapping
(5 / 4), moons spread by exactly +30 (radius + 10 → radius + 40), no transform residue on the lens (B-LENS-TRANSFORM),
WHY PENDING by Enter inside the lens box, UNPROVEN ids = `canonical.targetRequirementRevisionIds`; legend by Enter;
exit → `focus=CAPABILITY` with the upload kept; Pool Field: POOL for the bare upload id, intake hidden with a core and
shown/hidden by its affordance, core lens `position: fixed` outside the stage, role lenses hidden at POOL, structure
role → ROLE with the role lens visible, structure requirements = canonical mapping, role reading inside the lens,
back → POOL; reduced motion: `REDUCED`, lens animation `none`, camera transition 0 s, ROLE level still reachable.

Finding F-LF-2 (PINK → GRÜN, Case 1, severity low, frontend only): when a structure role is focused in the Pool Field
the core lens `job-pool-selected` becomes inert (`pointer-events: none`, as specified in §12.1) but its computed
opacity stays 1 although the inline style says 0.25. Cause (KNOWN, read in `JobPoolMatchPanel.tsx`): the reveal rule
`[data-jp-reveal] { animation: jpRise .32s ease-out both }` ends on `opacity: 1` with fill-mode `both`, and the
animation fill overrides the inline `opacity` for as long as the element lives, exactly the opacity twin of
B-LENS-TRANSFORM. Scope: the only element that carries a reveal attribute and a state-dependent inline opacity; the
receding organisations, roles and core are SVG groups without the attribute and do dim. Effect: the core lens does
not visually recede behind the focused role lens (frames `612-05-pf-role-lens.png`, `831-05-pf-role-lens.png`); the
interaction holds. Repair belongs to GRÜN (e.g. fill-mode `backwards`, or the dim on a wrapper); the plan's D-11
expectation ("core lens dims and ignores pointer events") stays as written.

GELB's F-LF-1 (`role_fullstack` / …612: `UNSCORED_COVERAGE` counts 3 including Node.js, weak evidence with
contribution 0.336, while the composition line "missing covered by the sweep (unscored)" says 2) read by PINK: the
pending kind is defined as "a sweep proposal exists and the requirement is not MATCHED" (`derivePending`, `3b0fc384`)
and PINK's Job Field proof binds exactly that set (`[...weakEvidence, ...missing]` with a proposal); the composition
line counts the missing subset. Both numbers are true for different sets, and a requirement is in two pending kinds
by design (pending ≠ missing, SG-6). What misleads is the label "UNSCORED (SWEEP COVERAGE ONLY)": Node.js has scored
weak evidence, so the sweep is not its only coverage. PINK's reading: a label defect (drop "ONLY" or say "sweep
proposal unscored"), not a count defect; narrowing the kind to missing-only would be a §4 contract change that
PINK's proof and plan E-06 would follow, owner decision.

Resolution of F-LF-1 (owner-approved as a label correction only, GELB `6b1a7b4` on `bfe0d27`): the labels read
`UNSCORED SWEEP COVERAGE` / `UNBEWERTETE SWEEP-ABDECKUNG`, the kind definition is unchanged and a unit case pins
the weak+sweep dual membership. PINK's targeted read-only check on the owner environment (HMR on `6b1a7b4`,
database identical; `support/pending-label-readonly-check.mjs`, `nonGet = []`): `role_fullstack` / …612 pending
5/1/3/1, `UNSCORED_COVERAGE` ids `req_003 · req_004 · req_005` = the weak-or-missing requirements with a proposal
from the GET body, the new label in the DOM, the old wording absent (`evidence/lens-owner-bfe0d27/owner-6b1a7b4-612-pending-row.png`).
Plan 1.3.1 binds on `6b1a7b4` (E-06 names the label and the dual membership; D-11 carries F-LF-2 as known open).

Resolution of F-LF-2 (owner mandate "F-LF-2 FOCUS RELATION REPAIR", GRÜN `e419d9c`, integrated by GELB as `8356bab`
= `e419d9c` + plan 1.3.1): both reveal rules use `fill-mode: backwards` (boundary B-LENS-FILL, `JOB_FIELD_FRONTEND.md`
§12); the Job Field twin (the canonical reason pinned to 1 instead of 0.85) is repaired by the same change. PINK's
independent verification on `8356bab` (merge `5c15d4d`, tree identical outside PINK's files, `tsc` 0), all on
disposable databases: lens proof 50/50 on a fresh environment with the delta (`condyn_test_6464fc5cc765a4e5`, port
3117, dropped afterwards) — core lens computed opacity 0.25 with `pointer-events: none` at ROLE, 1 / `auto` after
ALL ROLES, `fill-mode: backwards` on both lenses; the revealed canonical reason settles at computed 0.85 = inline
(the entrance sat at animation time 0 for about one second under headless rendering before running, so a single
timed read within that second reads 0 under `both` and `backwards` alike — read the settled state, J-12 says so now);
`support/core-lens-state-readonly.mjs`, `support/pending-reason-state-readonly.mjs`, frames and report in
`evidence/lens-delta-8356bab/`. Suites as the role: job-field-static, layer-separation, panel SSR 9/9, job-field SSR
8/8, job-field-presentation, dock SSR (6 files / 38 green); PINK's Job Field e2e, browser walk and GRÜN's e2e 3 files /
13 green (a first run of the three was red with "Another next dev server is already running": PINK's own 3117 server
held the worktree's Next dev lock — sequencing, not the delta; green once it was stopped). Verdict: green, no finding
against the delta. Plan 1.3.2 binds on `8356bab` (D-11 dim expectation, J-12 fill mode and settled reads, Appendix C
B-LENS-FILL). The owner environment stays on `ef75f1e` until the owner's F-LF-2 handover.

F-LF-2 handover (GELB, 2026-10-11): the owner environment on port 3017 was fast-forwarded via HMR to `d07017a`
(= `8356bab` + plan 1.3.2, docs/acceptance identical to `a7d9211`), same server process and database, inventory
identical. PINK's short read-only check on it (`support/core-lens-state-readonly.mjs`,
`support/pending-reason-state-readonly.mjs`, `support/pending-label-readonly-check.mjs`; GET only, `nonGet = []`):
`role_fullstack` / …612 — core lens 1 / `auto` at POOL and 0.25 / `none` at ROLE with `fill-mode: backwards`;
canonical reason settled at computed 0.85 = inline; pending 5/1/3/1 with the UNSCORED ids equal to the GET body and
the F-LF-1 label present. Identical to GELB's readings. Plan 1.3.3 (header only) states the handed-over environment.

### 3.16 SYNTX semiotic reconstruction: acceptance pre-binding (2026-10-11)

Owner mandate "SFE — SYNTX SEMIONTIC FIELD RECONSTRUCTION" (relayed by GELB; spec recorded verbatim in `f8e7c0b`,
binding table with rulings R1–R14 in `4a4a7fe`). Roles: GRÜN rebuilds the Pool Field / Job Field as the path
FIELD → ORGANIZATION → ROLE → REQUIREMENT → EVIDENCE → RETURN, GELB binds signs to repository fields and tests the pure
view model, PINK does the independent acceptance incl. the running browser walk. PINK's deliverable before any
implementation exists: plan 1.4.0 (`CONDYN_SYSTEM_ACCEPTANCE_TEST_PLAN_v1.4.md`) with suite TS-Q (Q-01 … Q-12) derived
from the spec and the binding table only, the DOM binding requirements BR-1 … BR-5 (observation point and per-sign
`data-sign-*` / `data-proof-*` attributes with the spec's §14.3 enums, aperture and summary anchors, retired ids not
reused) so that the walk binds independently of CSS and copy, risk R9, sequence S8, O-13, boundaries
B-SYNTX-PREBINDING / -UNSUPPORTED / -CLOSURE, the verdict NOT-BOUND. Pre-announced plan change at the delta (R13, R14):
E-04 caption, E-12 threads, K geometry and the matching assertions of `job-field.e2e.test.ts` are retired; the walk
`syntx-walk.e2e.test.ts` (Q-12) is written against GRÜN's published contract. Application code unchanged (`8356bab`);
owner environment stays on `801828c` until Q-12 is green. GRÜN had not started at the time of writing.

### 3.17 SYNTX field: acceptance binding and the running walk on `3d50c0a` (2026-10-11)

GRÜN's delta `434ef49` (frontend/job-field; `SyntxField.tsx`, `syntx-field-view-model.ts`, `analysis-sources.ts`,
DOM contract `JOB_FIELD_FRONTEND.md` §13 = BR-1 … BR-5 with the sign inventory and the retired / kept / new ids)
was integrated by GELB as `3d50c0a` (`integration/job-field-governance`: merge `7272ae9` + the governance suite
`test/career/job-pool/syntx-field-governance.test.ts`, 10 cases over every observation point, binding §5.1,
B-SYNTX-JOIN accepted). `app/` and `lib/` of `3d50c0a` are byte-identical to `434ef49`.

PINK's deliverables on `3d50c0a`:
- Plan 1.5.0 (`docs/acceptance/CONDYN_SYSTEM_ACCEPTANCE_TEST_PLAN_v1.5.md`, index 1.5.0 / tip `3d50c0a`): TS-Q bound
  to §13.3 (Q-00 … Q-12 with ids), §2.1–§2.3 rewritten for the one field, TS-D/E/F/H/I/J/K/L/N/O rebound, 20 scenario
  ids retired under R11/R13/R14 (D-05, D-11 … D-15, E-02, E-04 … E-06, E-11, E-12, J-05, J-06, J-09, J-11, O-03,
  O-04, O-11, O-12; kept with their numbers, never reused), Appendix A regenerated (215 ids; 117 retired, 68 new
  lines), Appendix C (B-SYNTX-PREBINDING resolved; B-SYNTX-JOIN, B-SYNTX-SCORE, B-SYNTX-URL, B-JP-GEMINI-FIXTURE,
  O-SX-1), D (§13), F, G.
- `test/job-pool-validation/syntx-walk.e2e.test.ts` (Q-12): real `next dev --webpack` on a disposable database with
  PINK's pool, a DRAFT copy, a second version through the intake and the seeded analysis; Chromium walks FIELD →
  ORGANIZATION → ROLE → REQUIREMENT → EVIDENCE (matched, weak, missing, pending apertures) → RETURN and binds, at every
  observation point, every `[data-sign-id]` (six §14.3 enums, proof attributes resolving in the three GET bodies, TRQREV
  resolution on the database, pending once per ecology, no closure, no proof id as text), the apertures' texts and
  joins (source title and `location` through the exact joins), reversibility (return affordance, background, Escape,
  path, reload: identical sign dumps), GET-only traffic, the unsupported-list audit, no number before the pending
  aperture, keyboard Enter/Escape, LIVE motion names (`sxEnter`, `sxSuspend`, opacity transitions, camera `.78s`) and
  reduced motion (nothing running, same signs), exit / reload / re-entry, the retired ids, and the carried field
  states (NO_ANALYSIS, NO_POOL + intake + explicit selection, INACTIVE_POOL as containment with UNREAD anchors,
  NOT_FOUND, three stale kinds, JOB/POOL aliases). Evidence `evidence/syntx-walk-3d50c0a/` (Q-00 bodies, screenshots,
  sign dumps, audits, `Q-04-aperture.json`, `Q-05-requests.txt`, `Q-06-computed.txt`, `Q-08-summary.txt`,
  `Q-12-report.json`, `manifest.sha256`).
- `job-field-static.test.ts` extended to the SYNTX files with the B-SYNTX-JOIN allow-list (the sources module reads
  `documents`, `capabilities[].evidence` and the proposal projection only; no `.organizations` / `.roles` /
  `matching` / `recommendations` read, no fuzzy matching); `live-browser-workflow.e2e.test.ts` rebound to the dotted
  traces and the sweep aperture (not executed: no `GEMINI_API_KEY` in PINK's shell); `job-field.e2e.test.ts` and
  `browser-walk.e2e.test.ts` retired with their grammar (their surviving concerns moved into the walk).

Run record (2026-10-11, `3d50c0a`, disposable databases, Chromium via `CONDYN_PLAYWRIGHT_MODULE`): static / unit /
governance batch 9 files / 54 tests green (incl. GELB's 10 governance cases); `tsc --noEmit` 0; the walk: the
reduced-motion test and the field-states test green, the path test green in every assertion except one finding.

Findings and observations:
- **F-SX-1** (PINK → GRÜN, S3, Q-08 / R8 / spec §13.4): keyboard focus leaves the field when the sign holding it
  unmounts on return (focused trace at REQUIREMENT → Escape, Escape → ROLE keeps focus on the trace → Escape →
  ORGANIZATION unmounts the ecology, `document.activeElement` becomes `body` → the next Escape is lost until the field
  is focused again). Expected: on return move focus to the field root (`tabIndex -1`, `rootRef` exists) or to the sign
  of the new observation point. Evidence `Q-08-summary.txt`. The Q-12 gate opens with GRÜN's repair and PINK's re-run.
- **O-SX-1** (observation, S4): with one source document every trace of an ecology converges on the same carrier; a
  receded trace rendered later in DOM order sits on top of the inspectable one near that end and captures the pointer.
  The walk clicks a point the trace owns under `elementFromPoint`. Possible closure: pointer-events none on receded
  traces, or inspectable traces rendered last.
- KNOWN, not findings: `GET /api/career/analyses/{id}` re-stamps the legacy `recommendations.generatedAt` per request
  (binding §1 non-input; the Q-05 byte comparison excludes that field); a click on the strip toggle right after a
  reload is lost before hydration in headless Chromium (the walk retries); the seeded analysis has no sweep
  (B-JP-GEMINI-FIXTURE), so sweep signs are asserted absent and bound by the live suite.

Owner environment `127.0.0.1:3017` untouched (still `d07017a`, bound by plan 1.4.2); it moves only after the Q-12
gate is green and the owner instructs.

### 3.18 F-SX-1 / O-SX-1 repair and the green gate on `8cb4a50` (2026-10-11)

GRÜN's `d5105e6` (renderer-only: a focus-follow effect after every observation or aperture change — focus moves to the
sign of the new observation point, else to the field root, only when the previously focused element left the root;
traces render receded → field → inspectable so the inspectable trace owns the pointer; boundaries B-SYNTX-FOCUS and
B-SYNTX-TRACE-ORDER in `JOB_FIELD_FRONTEND.md` §13.5) was integrated by GELB as `8cb4a50` (= `a78d95b` + `d5105e6`).
PINK on `8cb4a50`: tsc 0; the static / unit / governance batch 9 files / 54 green; the walk 3/3 green — after
Escape ROLE → ORGANIZATION the focused element is `syntx-organization-org_pink_alpha` (`org:org_pink_alpha`), the next
Escape reaches FIELD (`Q-08-summary.txt`, "focus loss: none"). GELB's question on the effect (does it pull focus from
the strip or the intake?) probed in the field-states test (`Q-08-focus-entry.txt`): keyboard entry from the strip
(Enter on `job-pool-panel-toggle`) moves focus into the field root — observed, recorded under B-SYNTX-FOCUS, not a
defect (Tab returns to the strip); typing in the intake keeps focus; a pointer selection focuses the clicked sign
natively; Escape with the intake open closes the intake first (R8). F-SX-1 closed, O-SX-1 closed. Plan 1.5.1 binds
`8cb4a50`; evidence `evidence/syntx-walk-8cb4a50/`. The Q-12 gate is green; the owner environment `127.0.0.1:3017`
(still `d07017a`, untouched) moves on the owner's instruction, followed by PINK's GET-only check there with
`test/job-pool-validation/support/syntx-readonly-walk.mjs` (existing upload and analyses only; signs = bodies at FIELD,
ORGANIZATION, ROLE, REQUIREMENT, the matched / sweep / pending apertures, focus-follow on return, reduced motion, bodies
unchanged; dry-run on PINK's disposable environment `condyn_test_8776be3f32fcc17d`: 68/68 checks, 0 non-GET requests).

### 3.19 Owner environment on `1bd26a7`: PINK's GET-only walk, F-SX-2 sharpened, O-SX-3 ruled (2026-10-11)

GELB executed the owner mandate "SFE — SYNTX FINAL RUNTIME HANDOVER": port 3017 runs `1bd26a7` (= `8cb4a50` + plan
1.5.1 + evidence; `app`, `lib`, `scripts` identical to `8cb4a50`), restarted with `up --with-worker` without `--fresh`
on the preserved database `condyn_test_e46502b73c9f316f` (GELB's inventory identical before and after; rollback point
`801828c`). PINK ran `test/job-pool-validation/support/syntx-readonly-walk.mjs` against it (GET only; upload
`JPOOL_30F7145E21F34BEF0FCE510DFC75837B`, analyses `…_612` and `…_831`): **129/132 checks, 0 non-GET requests, bodies
identical before and after**, evidence `evidence/syntx-readonly-3017-1bd26a7/` (bodies, signs per observation point,
screenshots, `report.json`, `manifest.sha256`). Green: grammar, counts = mapping, retired ids absent, every sign with a
canonical proof that resolves in the bodies, §14.3 enums only, pending at most once and no closure, no proof id as
text, ROLE anchors / traces / source carriers / suspended boundary per body, matched and sweep apertures (quote
verbatim, source RESOLVED `cv.synthetic.pdf` with location, authority NONE, `data-scored=false` on the sweep), the
pending aperture (resonance 0.3636 = body, rank, no recommendation), the Escape chain with focus-follow
(`org:org_nordlicht`, `org:org_rheinwerk`), FIELD restored with an identical sign set, reduced motion, GET-only.

Red, all perceptual, none a data or governance defect:
- **F-SX-2 (S3, GRÜN; GELB's finding, sharpened)**: on `req_001` the stable trace (`supports`, width 3.08) and the
  dotted trace (`covers_unscored`, width 1.4, dash 2 3) to `DOC_001` have identical endpoints; the dotted trace is
  invisible under the stable one and, being rendered later, its 10 px hit line owns every pointer point of the line
  (`elementFromPoint` at 19 fractions: owner `trace:req_001:covers_unscored:DOC_001:0` throughout, the stable trace owns
  none). The matched aperture is therefore unreachable by pointer; Enter on the focused stable trace opens it with the
  contribution, Enter on the dotted one opens the sweep aperture (both verified). R7 pointer inspection is violated for
  this configuration; the keyboard path (R8) is intact. The walk records the pointer owner and inspects by keyboard so the
  aperture assertions still run.
- **O-SX-3 (S4)** — PINK ruling, as asked by GELB: **repair**. `syntx-summary` is the aria-live reading of the
  observation point (R9/BR-4); "2 evidence traces from 1 sources" / "1 requirements" is a defect of that reading, not
  of the view model. Plural-aware template (en/de), view model unchanged, no new ids. The walk asserts number agreement
  at every observation point (regex over "1 sources|traces|requirements|roles|organizations" and the German forms).
- **O-SX-4 (S4)**: at REQUIREMENT (camera 2.4) the inspected trace's source carrier lies at the bottom edge with its
  title cut (1600×1000). The walk asserts the carrier of the inspected trace inside the viewport.
- **O-SX-2 (S4)**: confirmed visually (`612-Q-03-role.png`: the TypeScript trace runs through "Senior Full-Stack
  Engineer"); not asserted by the walk.
- Analysis `…_831` delivers no SUPPORTED or weak requirement and no sweep-covered item on any role (`matched 0 / weak 0`
  on all six roles, `capabilitySweep` AVAILABLE with 6 proposals joined to no requirement): the matched-aperture walk
  is recorded as a data skip, the pending aperture, return, reduced motion and body identity ran green.

Script delta (`d49e86f` → this commit): a per-analysis exception is recorded as a failed check and the walk continues;
`alongTrace` reports the pointer owner; keyboard fallback for the matched and the sweep trace; O-SX-3 and O-SX-4
checks; the missing-SUPPORTED case is a data skip. Plan 1.5.2 (header only; application unchanged at `8cb4a50`) binds
the owner environment `1bd26a7`; the repairs under "SFE — SYNTX FINAL PERCEPTUAL CLOSURE" are validated by PINK on
disposable environments; port 3017 is not modified again without a separate owner authorization.

### 3.20 Perceptual closure `fa14d8e` validated; integration `1ca3ca9` (2026-10-12)

GRÜN's `fa14d8e` (parent `8cb4a50`; `SyntxField.tsx`, `syntx-field-view-model.ts`, `sil-language.ts`, its own tests and
`JOB_FIELD_FRONTEND.md` §13.5 with B-SYNTX-BOW, B-SYNTX-REACH, B-SYNTX-NUMBER): traces become `<path>` elements (hit path
first, visible path second, `data-trace-bow` on the group) with bows that co-terminal traces never share and that bend
around the role disc and the labels; source carriers sit beside the requirements that reach them and the REQUIREMENT
camera shifts so every reached carrier is inside the stage; the summary copy gains `nouns` with one/other forms. Sign
ids, enums, proofs and support categories unchanged; Appendix A regenerated identical (215). GELB integrated it as
`1ca3ca9` (= `b95bed1` + `fa14d8e`; governance 10/10, 15 files / 97 green, tsc 0); `app`, `lib`, `scripts` of `1ca3ca9`
are identical to PINK's merge `1e2986f`.

PINK on `fa14d8e`: tsc 0; static / governance / view-model / SSR batch 4 files / 36 green; the e2e walk 3/3 on a
disposable database `condyn_test_33f1937be22cb6d3` (evidence `evidence/syntx-walk-fa14d8e/`; both walks now query
`path:not([data-sx-hit]), line:not([data-sx-hit])` and map path points through `getPointAtLength` and the screen CTM —
the CSS camera transform is carried by the CTM in headless Chromium: every trace click landed on an owned point; the
literal summary expectations read "contains 1 role" and "1 evidence trace from 1 source"). Read-only walk on GELB's
owner-shaped disposable clone `127.0.0.1:3027` @ `1ca3ca9` (a read-only `pg_dump` clone of the owner database into a
marked disposable database `condyn_test_1817582a536300a1`; the owner database's content hash unchanged, `:3017`
untouched on `1bd26a7`): **132/132 checks, 0 non-GET** (evidence `evidence/syntx-readonly-3027-1ca3ca9/`) — the matched
trace of `req_001` owns a pointer point beside its dotted twin and opens the matched aperture (F-SX-2 closed), the
sweep trace owns its own point, the inspected trace's carrier is inside the viewport (O-SX-4 closed), every summary
agrees in number (O-SX-3 closed), the `_831` role without a supported requirement is a data skip as before. O-SX-2 is
closed on GELB's 36-observation-point check (0 label crossings) and PINK's visual judgement. B-SYNTX-PAIR: the pair's
pointer ownership is provable on owner-shaped data only (no sweep in PINK's or GRÜN's fixtures). Plan 1.6.0 binds
`1ca3ca9`; the owner environment stays on `1bd26a7` under plan 1.5.2 until the owner authorizes the move, after which
PINK repeats the GET-only walk there. PINK's own `3117` dry-run environment of this round never started (role env not
exported in that shell) — no own server, no own database.

### 3.21 Living field under R15: `a856b5a` validated, integration `e6486b1` (2026-10-12)

Owner mandate "SFE — SYNTX LIVING FIELD · VISUAL RECONSTRUCTION" (GRÜN `a856b5a`, parent `1ca3ca9`: planetarium materials,
depth, finite transitions, ambient life behind `SYNTX_AMBIENT_MOTION` / `data-sx-ambient`; §13.2.1). PINK raised the conflict
with spec §1 (lines 99–101) and §6.2 (decorative orbit, ambient swirl, glow without evidence referent) before any rebinding;
GELB escalated with options A (spec stands) / B (supersede with a bound list); the owner ruled B — **R15 "Supersede, bound
motion"** (`747cefa`, `SYNTX_FIELD_CONTRACT_BINDING.md` §4) with the instruction to finish now and for PINK to check only the
affected functions. GELB's integration `e6486b1` = `6d9bf32` + `747cefa` + `a856b5a` (governance 10/10, `app`/`lib`/`scripts`
identical to `a856b5a`; Appendix A regenerated identical, 215).

PINK's checks (affected functions only), merged as `ef8ea69`:
- Q-06 / J-12 rebound to R15 in `syntx-walk.e2e.test.ts`: at FIELD after settle the infinite animations are exactly
  `sxBreathe`, `sxOrbit`, all on signs in state `field`, switch `on`; at ROLE the running names are `sxEnter`, `sxRecenter`,
  `sxSuspend` (no ambient name); sign transitions `opacity` or `opacity, filter` (the depth blur); REDUCED: zero running,
  names `none`, camera 0 s, identical sign set. While the ruling was pending, the same test recorded `FAIL R15-PENDING` on
  the probe merge of `a856b5a` with every contract fact green — red by design, never masked.
- Pointer ownership and apertures with the grown hit areas, keyboard / Escape with focus-follow, containment and
  anchor-distance reads (now from bounding boxes and the screen CTM, since role carriers sit in a group transform):
  e2e walk 3/3 on `e6486b1` (disposable `condyn_test_07de17d3284dc468`, evidence `evidence/syntx-walk-e6486b1/`,
  `SYNTX_WALK_TIP=e6486b1`); the field batch 4 files / 36 green; tsc 0.
- Read-only walk on GELB's owner-shaped disposable clone `127.0.0.1:3027` @ `e6486b1` (`condyn_test_89d52eb3e5694f2d`, a
  fresh read-only clone of the owner database, its content hash unchanged; `:3017` untouched on `1bd26a7`): **136/136,
  0 non-GET** (evidence `evidence/syntx-readonly-3027-e6486b1/`) — R15 at FIELD (`sxBreathe`, `sxOrbit`, switch on,
  nothing outside `field` signs) and at ROLE (`sxSuspend` only) for both analyses, the matched trace of `req_001` and the
  sweep trace own pointer points and open their apertures, containment, Escape chain with focus-follow, reduced motion,
  bodies identical.
- Both walks' settle rule excludes any infinite-iteration animation (`f03362d`), so the ambient life never blocks a read.

Plan 1.7.0 binds `e6486b1` (Appendix C: R15 / B-SYNTX-AMBIENT, B-SYNTX-GLOW, B-SYNTX-DEPTH, B-SYNTX-HIT). The owner
environment stays on `1bd26a7` under plan 1.5.2 until the owner authorizes the move; PINK's GET-only walk follows it.

### 3.22 Visual grammar transfer `9759889` accepted; integration `36058a4` (2026-10-12)

GRÜN's `9759889` (parent `e6486b1`; owner mandates "GREEN · VISUAL FIELD RECONSTRUCTION" / "VISUAL GRAMMAR TRANSFER", a
GRÜN-owned visual iteration — PINK and GELB accept the affected functions only): planetarium nodes (region radius
min(190, 92 + 30·√roles), roles on a lower inner ring), pool core, mint source carriers with `SOURCE_BOX`, draw-on traces
(`sxTraceDraw` ray underlay path after the visible path), HUD aperture with the same ids, CSS-only uppercasing, count
pills and kicker indices (never scores or ids), new finite names `sxTraceDraw` / `sxCoreSettle`, the infinite list unchanged.
View model geometry only; sign ids, enums, proofs, summaries unchanged; Appendix A regenerated identical (215). GELB's
integration `36058a4` = `4bfeb74` + `9759889` (governance 10/10, 15 files / 97 green, tsc 0); `app`/`lib`/`scripts`
identical to PINK's merge `a5b86a3`.

PINK (affected functions): field batch 4 files / 36 green, tsc 0; e2e walk 3/3 on `9759889` (disposable database,
evidence `evidence/syntx-walk-9759889/`; Q-06 admits the two finite names, FIELD ambient still exactly `sxBreathe` +
`sxOrbit` on `field` signs, ROLE `sxEnter` / `sxRecenter` / `sxSuspend`; Q-07 / Q-09: no percent, no resonance before the
pending aperture — the count pills are counts; full names readable from `textContent`); read-only walk on GELB's clone
`127.0.0.1:3027` @ `36058a4` (fresh read-only clone of the owner database, its hash unchanged; `:3017` untouched):
**136/136, 0 non-GET** (evidence `evidence/syntx-readonly-3027-36058a4/`) — R15 at FIELD and ROLE for both analyses,
the matched and the sweep trace own pointer points and open their apertures under the new geometry, the inspected
carrier inside the viewport (`SOURCE_BOX`), containment and anchor categories under the new radii, Escape chain with
focus-follow, reduced motion, bodies identical. Plan 1.8.0 binds `36058a4` (Appendix C: B-SYNTX-VISUAL). The owner
environment stays on `1bd26a7` under plan 1.5.2 until the owner authorizes the move.

### 3.23 Owner environment `:3017` moved to `010f082`; GET-only acceptance 136/136 (2026-10-12)

The owner gave the GO directly in GELB's session (a GO relayed through GRÜN had been received earlier; GELB deliberately
did not take it as the gate the owner set, and `:3017` stayed on `1bd26a7` until the direct confirmation). GELB's handover:
worktree `condyn-admin-job-pool` fast-forwarded `1bd26a7` → `010f082` (= `36058a4` + plan 1.8.0 `013d91d`; `app`, `lib`,
`scripts` identical to the accepted `36058a4`, verified by PINK as tree-identical to `013d91d`), restart `up --with-worker`
without `--fresh`, reusing the preserved database `condyn_test_e46502b73c9f316f`; read-only snapshot before and after
identical ("OWNER DB IDENTICAL": 123 tables / 280 rows, countsHash `3644dcdf00006a7f`, contentHash `a5050f17b5264235`);
worker polling with Gemini; smoke: all four SYNTX levels and the pool/analysis/matches APIs 200, Firefox 157 renders all
four levels with 0 page errors.

PINK (GET-only, nothing started, stopped, uploaded or written against `:3017`): the served FIELD page carries the
`36058a4`-only grammar tokens (`data-sx-ambient`, `sxTraceDraw`, `sxCoreSettle`; absent from `1bd26a7`); read-only walk
`syntx-readonly-walk.mjs` on `BASE=http://127.0.0.1:3017`, upload `JPOOL_30F7145E21F34BEF0FCE510DFC75837B`, analyses
`612` / `831`: **136/136, 0 non-GET** (evidence `evidence/syntx-readonly-3017-010f082/`, 28 files) — the same result as on
GELB's clone `:3027` @ `36058a4` (§3.22): R15 at FIELD (`sxBreathe` + `sxOrbit` on `field` signs only, switch on, mode
LIVE) and at ROLE (only `sxSuspend`) for both analyses, the matched and the sweep trace own pointer points and open their
apertures, the inspected carrier inside the viewport, containment and anchor categories, Escape chain with focus-follow,
reduced motion, bodies identical; the `831` matched-aperture walk is a recorded data skip (no SUPPORTED requirement
delivered for its role). Plan 1.8.1 binds the owner environment `010f082` (header only, application unchanged). Delivery
to the owner is GELB's: running CONDYN on `:3017`, the verified data set, exact Firefox links; the owner's personal visual
acceptance and full product run-through follow.

### 3.24 Evidence ecology `9f225f2` under R15a accepted; integration `9e86d44` (2026-10-12)

Owner mandate "CONDYN / SYNTX — FINAL INTEGRATION & PRODUCT TEST" (relayed by GELB; SFE::RECURSION_GATE, affected functions
only). GRÜN's `9f225f2` (lab lineage `424c3f7` … `7bda76a`, owner visual corrections; design freeze) composes the evidence
ecology as the Capability Field's deep focus: role nucleus ×1.5, anchors as satellites fanned from the top, source carriers
on ring 135 inside the pending boundary 205 in the evidence sector 180° ± 45°, SUPPORT_DISTANCE ×1.3 (categories and order
unchanged), traces always quadratic arcs (hit path, visible path, ray, glow, bead, two SMIL photons); the carrier orbits on
the shared rAF clock (ellipse 14 × 9, 60 s, `data-orbital-motion-*` on `data-sx-carrier-body`; every trace recomputed from
the moving body); `sxMoonOrbit` on carriers, `sxAtmosphere` / `sxRingPulse` on the inspectable carrier, finite `sxSettle`.
GELB's integration `0c2c68a` = `010f082` + `9f225f2`; `9e86d44` adds binding §4 R15a (owner decision "Alles zulassen":
the R15 sentence "at ROLE / REQUIREMENT only `sxSuspend`" replaced by that list; moons / atmosphere / pulses gated by
`data-sx-ambient=on`, orbit and photons by LIVE; FIELD / ORGANIZATION unchanged; REDUCED total). Application delta: two
files (`SyntxField.tsx`, `syntx-field-view-model.ts`); sign ids, enums, proofs, summaries unchanged (Appendix A 215
identical). PINK's merge `c653f02`: `app` / `lib` / `scripts` identical to `9e86d44`.

Rebinding (walk code only): both walks read an ecology frame — infinite animations by name with their host
(`carrier:<state>` or the sign manifestation), carrier bodies (`driver`, x, y), per trace quadratic / carrier end on the body
(< 0.05 units) / photon count — in two frames 1.5 s apart, and probe pointer ownership of every trace in both frames; the
e2e ROLE allow-list admits `sxSettle`, `sxMoonOrbit`, `sxAtmosphere`, `sxRingPulse`; attribution at the matched aperture;
Tab sweep, Enter, Escape at ROLE; REDUCED adds photons = 0 and static carriers. Before the rebind the unchanged walk on the
clone read 135/136 — the single red was the superseded "nothing infinite but `sxSuspend`" (`sxMoonOrbit` beside it), every
other check held. Three walk-code defects fixed on the first rebound run (a Tab sweep that stopped on a count match while
the observed role sits in the order; Enter on a trace moves the observation to REQUIREMENT as the pointer does, so the
"stays ROLE" expectation was wrong; a role without traces needs data skips) — none a field defect.

Results on the owner's five checks (affected functions only): field batch 4 files / 36 green, tsc 0; e2e walk 3/3 on
`9e86d44` (disposable database, evidence `evidence/syntx-walk-9e86d44/`; Q-06 LIVE at ROLE `sxEnter`, `sxRecenter`,
`sxSuspend`, `sxMoonOrbit`; frame A → B: carrier DOC_001 499.035,382.934 → 497.873,384.419, both traces coupled, 2 photons
each, owned in both frames; Q-04 attribution: inspectable carrier = DOC_001 = the aperture trace's document, atmosphere and
both ring pulses on that carrier only; REDUCED: 0 running, 0 photons, carriers static); read-only walk on GELB's clone
`127.0.0.1:3027` @ `9e86d44` (database `condyn_test_cb8e292df603ddc3`, GELB's product flow writing a fifth analysis
concurrently): **149/149, 0 non-GET** (evidence `evidence/syntx-readonly-3027-9e86d44/`) — (1) R15a at ROLE and at
REQUIREMENT with the aperture open (`sxSuspend`, `sxMoonOrbit`; plus `sxAtmosphere`, `sxRingPulse` on the inspectable carrier
only), (2) 612: six traces own a pointer point in both frames while the carrier moved (554.851,348.225 → 552.396,347.963),
(3) attribution DOC_001 ↔ `trace:req_001:supports:DOC_001:0`, aperture source "cv.synthetic.pdf" by join, (4) Tab reaches 7/7
targets in 8 Tabs, Enter opens the focused trace's aperture (observation → REQUIREMENT), Escape closes it and the chain
returns to ROLE, then the full Escape chain with focus-follow to FIELD, (5) GET only, bodies identical before and after;
831 has no traces for its role — the trace-based steps are recorded data skips. Plan 1.9.0 binds `9e86d44` (Appendix C: R15a
/ B-SYNTX-ECOLOGY; Q-06 / J-12 rebound). GELB moves `:3017` to `9e86d44` on this green (owner-authorized in the mandate);
PINK's GET-only walk there follows.

### 3.25 Owner environment `:3017` moved to `5898def`; GET-only acceptance 149/149 (2026-10-12)

On PINK's green for plan 1.9.0, GELB moved `:3017` under the owner's authorization in the mandate "CONDYN / SYNTX — FINAL
INTEGRATION & PRODUCT TEST": worktree `condyn-admin-job-pool` fast-forwarded `010f082` → `5898def` (= `9e86d44` + plan 1.9.0
`507136c`; `app`, `lib`, `scripts` identical to `9e86d44`, tree identical to PINK's `507136c`, both verified by PINK),
restart `up --with-worker` without `--fresh`, reusing the preserved database `condyn_test_e46502b73c9f316f`; read-only
snapshot before and after identical ("OWNER DB IDENTICAL": 123 tables / 280 rows, countsHash `3644dcdf00006a7f`,
contentHash `a5050f17b5264235`); worker polling with Gemini; routes warmed with GETs only (a non-existent job id → 404,
`/api/career/analyze` → 405), because on the clone the first compile of the jobs route in `next dev` had reloaded the page
once mid-analysis; GELB's clone `:3027` stopped and `condyn_test_cb8e292df603ddc3` dropped.

PINK (GET-only, nothing started, stopped, uploaded or written against `:3017`): the served FIELD page carries the R15a
tokens (`sxSettle`, `sxMoonOrbit`, `sxAtmosphere`, `sxRingPulse`; absent from `010f082`); read-only walk on
`BASE=http://127.0.0.1:3017`, analyses `612` / `831`: **149/149, 0 non-GET** (evidence
`evidence/syntx-readonly-3017-5898def/`) — the same result as on the clone (§3.24): R15a at ROLE and at REQUIREMENT with the
aperture open, the carrier moved between the frames (551.021,347.686 → 548.052,346.703) and all six traces of 612 own a
pointer point in both frames, attribution DOC_001 ↔ `trace:req_001:supports:DOC_001:0` with the source title by join, Tab
7/7 in 8 Tabs, Enter / Escape chain with focus-follow, REDUCED total, bodies identical; 831 without traces is the recorded
data skip. Plan 1.9.1 binds the owner environment `5898def` (header only, application unchanged).

### 3.26 Job-scope invariant: independent verification of GRÜN `cb3d33f`; GELB's backend gate not yet committed (2026-10-14)

Owner mandate "SFE — INDEPENDENT VERIFICATION" of the SFE invariant "no Gemini call without a valid, selected job
scope" with the expected behaviour: application open → Job Pool screen; no valid pool → Capability OFF; pool without
job → OFF; valid pool + valid job → ON; selection removed or invalid → OFF; direct analysis call without a valid
selection → backend REJECT; existing functions and the semiontic GUI design preserved. PINK implements nothing.

State of the parties at the time of the run: GRÜN `frontend/job-field` @ `cb3d33f` (confirmed by GRÜN as the final
invariant tip; a separate commit "JOB POOL FIRST / CAPABILITY GATE" with a changed start focus is announced). GELB:
backend gate not committed; contract announced (POST /api/career/analyze requires `jobScope { jobPoolUploadId,
poolRoleId }`; 400 `ERR_JOB_SCOPE_REQUIRED` / 422 `ERR_JOB_SCOPE_INVALID`, the owner's sentence, nothing enqueued; the
worker re-checks before any processing and ends an unscoped job terminally). `cb3d33f` changes no backend file.

Method (PINK's own code; probe branch `validation/job-scope-probe` = this branch + `cb3d33f`, never pushed, deleted):
new walk `test/job-pool-validation/job-scope-gate.e2e.test.ts` (`JOB_SCOPE_TIP=<hash>`): real `next dev --webpack` on a
disposable database, PINK's pool fixtures (ACTIVE + DRAFT), **no worker** (an accepted request is only enqueued, no
Gemini call possible, `GEMINI_API_KEY` empty in the server env); 48 checks recorded in one run, failing once at the
end. "Capability ON/OFF" is read on both surfaces the mandate can mean: the ANALYZE trigger (the invariant's gate) and
the Capability field itself (`field-focus-capability-btn`). Two walk-timing defects of PINK's first runs were fixed
(indicator read before React's re-render; first-compile latency of the analyze route) — not field defects.

Results on `cb3d33f` (evidence `evidence/job-scope-gate-cb3d33f/`): **31/48**, 17 deviations in four groups:
1. G-01: the application opens on the Capability field, not on the Job Pool screen (shell focus CAPABILITY).
2. G-02 / G-03 / G-05: the Capability field stays reachable without a valid job in all 9 OFF cases (no pool, unknown
   pool, pool without job, scope removed, role not in pool, DRAFT pool, unknown pool, malformed scope). The ANALYZE
   gate holds in every one of them: trigger disabled, `data-job-scope-blocked="true"`, the owner's sentence verbatim,
   0 requests on a forced DOM click.
3. G-05: no UI control removes a selected job (removal only by leaving the URL parameters).
4. G-06: a direct `POST /api/career/analyze` without a valid scope is accepted — 7/7 cases answer 202 and enqueue a
   job (no scope, null, malformed, extra key, unknown pool, DRAFT pool, role not in pool). Expected 400 / 422, nothing
   enqueued. Owner of the fix: GELB (announced, not committed).
Held on `cb3d33f`: explicit selection at ROLE (`syntx-job-scope-select`), indicator VALID with role, organization and
pool, exact scope in the URL; ANALYZE then enabled and sends exactly one request with exactly `{ jobPoolUploadId,
poolRoleId }` (202, one job enqueued); the indicator shows NONE / INVALID / VALID visibly and uncovered at FIELD,
ORGANIZATION, ROLE, REQUIREMENT and in the Capability field (1600 px) and in the Job Field at 1280 × 720; no closure
glyph in the field after the selection (G-09); no page error.

Inverse sweep (Gemini call sites back to a gate, `cb3d33f`): the served application reaches Gemini only through the
worker (`GeminiProvider`, `GeminiCapabilityDiscoveryProvider`, `GeminiCapabilityConvergenceProvider`, constructed in
`scripts/run-career-worker.ts`); none of them, the job processor, the worker or the analyze route reads a scope — the
invariant rests on the frontend alone until GELB's gate exists. Embeddings (`lib/career/search`) are wired to no route;
the developer scripts `probe-gemini`, `test-live-*`, `test-pipeline-live`, `test-multi-source-live` call Gemini
directly without a scope (owner decision whether "keine Ausnahmen" covers them).

Regression and preservation: tsc 0; GRÜN's job-scope tests plus the field batch 7 files / 82 green (PINK's run).
Server renders of 26 cases (Capability field L0 and stages in both locales, Job Field with pool at FIELD,
ORGANIZATION, ROLE, REQUIREMENT, NO_POOL, SourceDock) in the parent `799f523` and in `cb3d33f` with the same PINK
probe: 1 identical, every other difference is the indicator, the select action or the ANALYZE gate — **0 unclassified
differences** (`render-identity-799f523-vs-cb3d33f.txt`). The SYNTX walk (plan 1.9.1) reads 0/3 on `cb3d33f`
(evidence `evidence/syntx-walk-cb3d33f/`: role carrier without `role="button"`, camera transition absent, the
organization sign an HTML `div` instead of the SVG `g`); these assertions were changed by GRÜN's `ca11794` (2026-10-12,
"semiotic transfer, variant A", owner GO; GRÜN recorded "PINK walk unchanged 0/3 … rebinding proposed, no integration
before the owner's visual approval"), not by `cb3d33f` (diff and render identity). The accepted plan-1.9.1 contract is
therefore not preserved on `frontend/job-field` since `ca11794`; that is a pending owner/PINK rebinding, independent
of the invariant.

Open: GELB's backend and worker gate (G-06 and the worker check), GRÜN's "JOB POOL FIRST / CAPABILITY GATE" commit
(groups 1 and 2), the removal path (group 3). The same walk reruns unchanged on each new tip.

### 3.27 Job-scope invariant: GRÜN `c146f05` (Job Pool first / Capability gate) verified (2026-10-14)

GRÜN's `c146f05` (parent `cb3d33f`, owner "JOB POOL FIRST / CAPABILITY GATE"): the application opens in the Job Field;
the active field is CAPABILITY only when CAPABILITY is requested and the job scope is VALID, on every way in (selector,
←/Home, `syntx-exit-btn`, `focus=CAPABILITY` in the URL); root `data-capability-gate="OPEN|AWAITING_JOB"`,
`data-field-gate` plus `disabled` / `aria-disabled` on the two buttons; the request is kept and honoured once the scope
turns VALID. Backend unchanged (GELB's gate still not committed).

PINK (probe branch = this branch + `c146f05`, deleted, never pushed): the job-scope gate walk extended by three checks
(URL `focus=CAPABILITY` without a job stays on the Job Field; ←/Home and `syntx-exit-btn` do not open it; with a VALID
scope the URL request opens the Capability field) — **43/51** (evidence `evidence/job-scope-gate-c146f05/`). Closed
against §3.26: G-01 (opens on the Job Pool screen) and all 9 Capability-OFF cases plus the three other ways (gate
`AWAITING_JOB`, exit disabled, focus stays FIELD); ON with a valid job, the scoped request (exactly `{ jobPoolUploadId,
poolRoleId }`, 202), the indicator at every depth and in the Capability field, 1280 × 720, no closure glyph, no page
error. Remaining deviations: (a) G-05, no UI control removes a selected job — not part of any owner mandate (GRÜN), open
owner decision; with the gate, a removal would close Capability again; (b) G-06, the backend accepts all 7 direct calls
without a valid scope (202, enqueued) — GELB's gate, not committed.

Regression: tsc 0; 8 files / 87 green (GRÜN's job-scope, demo-UI and lifecycle tests, the field batch). Preservation:
SSR probe `cb3d33f` → `c146f05` over the same 26 cases — every difference is the gate (`render-identity-cb3d33f-vs-c146f05.txt`,
token-level resolution included); the Capability field with a VALID scope is proven in the browser walk. SYNTX walk:
still 0/3 from `ca11794` (GRÜN reports the same on `cb3d33f` and `c146f05`).

Boundary B-PINK-WALK-OWNERSHIP: `c146f05` edits PINK's `test/job-pool-validation/syntx-walk.e2e.test.ts` (Q-11 selects a
job and waits for the open gate before the exit). The edit adds steps and weakens no assertion, but the walk is PINK's
proof instrument; PINK takes such adaptations only through its own commit when the walk is rebound (with the pending
`ca11794` rebinding), and asks GRÜN to propose, not edit, PINK's walks.

### 3.28 Job-scope invariant: GELB's backend gate `841baab` → `2e61a2b` with GRÜN `c146f05` verified together (2026-10-14)

GELB `feature/job-pool-first-boundary` (base `311d6ee`, not integrated): `841baab` adds the route gate (analyze route,
after the document checks and before `createJob`: missing or malformed `jobScope` → 400 `ERR_JOB_SCOPE_REQUIRED`;
unknown, non-ACTIVE or unmapped pool, role outside the pool, a role requirement without mapping, or no job pool
persistence → 422 `ERR_JOB_SCOPE_INVALID`; message "Bitte wählen Sie einen Job aus."; nothing enqueued) and the worker
gate (`scripts/run-career-worker.ts` wraps the unchanged processor in `requireValidJobScope(createLocalJobScopeResolver(), …)`;
`JobScopeRequiredError` is a `TERMINAL_ERROR`), plus an idempotency fix (deep compare instead of JSONB-reordered string
compare). `2e61a2b` relaxes the formal role-id rule to "non-empty string" (the pool schema's rule) after GRÜN reported
the mismatch; existence is decided by the stored pool.

PINK (probe branch = this branch + `c146f05` + `841baab` [+ `2e61a2b`], deleted, never pushed; frontend files identical to
`c146f05`, backend files identical to the GELB tip):
- Worker proof (PINK's own, `evidence/job-scope-gate-c146f05-2e61a2b/job-scope-worker-gate.postgres.test.ts.txt`, kept as
  evidence until GELB's module is integrated into this branch): 8 jobs written straight into `career_analysis_jobs`, past
  the route; the real `CareerJobWorker` on the disposable database with a spy for the whole processor. 7 jobs without a
  valid scope (none, null, malformed, extra key, unknown pool, DRAFT pool, role not in pool) end FAILED after one attempt
  with the expected code and the owner's sentence, no progress reported, the spy never reached; the valid job reaches
  it. A static check binds the production script: the processor handed to `CareerJobWorker` is the gated one, the only
  one built there. Green on `841baab` and on `2e61a2b`.
- Inverse sweep on `2e61a2b`: every worker process starts from `scripts/run-career-worker.ts` (`worker:career`,
  `hr-loop:local --with-worker`, GELB's proof script) and is gated; only the developer scripts `test-live-*`,
  `test-pipeline-live`, `test-multi-source-live` run the pipeline directly without a scope (open owner decision).
- Gate walk, extended by G-10 (frontend VALID ⇔ backend 202 on the same stored role; a pool with a role id containing
  inner spaces and one padded with spaces, both admitted by the pool schema): `c146f05` + `841baab` **50/52** (G-06 7/7
  REJECT as contracted; G-10 diverged: inner-space role VALID in the frontend, 400 in the backend — GRÜN's report, fixed
  in `2e61a2b`); `c146f05` + `2e61a2b` **51/53** (evidence `evidence/job-scope-gate-c146f05-2e61a2b/`).
- Regression on `c146f05` + `2e61a2b`: tsc 0; 14 files / 121 green (GELB's job-scope suites, PINK's worker proof, the
  PDF path, analyze-flow and async orchestration, GRÜN's job-scope / demo-UI / lifecycle tests, the field batch).

Remaining deviations on `c146f05` + `2e61a2b`:
1. G-05: no UI control removes a selected job — not part of any owner mandate; open owner decision.
2. G-10: a role id padded with spaces ("  role pink padded  ", admitted by the pool schema): the frontend refuses it
   (`parseJobScope` requires a trimmed id → indicator NONE, the role cannot be selected), the backend accepts it (202).
   Safe direction for the invariant (no request without a scope), but a stored, ACTIVE, mapped role is unselectable,
   and silently so: the action "◎ SELECT AS JOB" does nothing, because `selectJobScope` returns without feedback when
   `jobScopeFromParams` cannot parse the id (GRÜN's precision, confirmed in the `c146f05` code; not walked). One rule is
   needed on both sides: GRÜN to accept the schema's id as stored ("variant A", proposed by GRÜN), or the pool upload
   (GELB) to refuse or normalize padded ids. Both parties have put the choice to the owner and change nothing without
   the owner's release. GELB acknowledged the edit of PINK's `pdf-path.postgres.test.ts` as a boundary violation.

Boundary B-PINK-WALK-OWNERSHIP (second instance): `841baab` edits PINK's `test/job-pool-validation/pdf-path.postgres.test.ts`
(uploads a pool and sends `jobScope` so the PDF path passes the new gate; no assertion weakened). Taken by PINK only in
its own commit when GELB's gate is integrated into this branch.

### 3.29 Job-scope invariant: GRÜN `5d6786b` + GELB `027abf3` (owner decision G-10 variant A, G-05, every execution path) verified together (2026-10-14)

Owner decision as relayed by GRÜN and GELB (not seen by PINK first-hand): G-10 variant A (the role id is taken exactly as
stored; only "" is refused), G-05 (an explicit removal of the selected job), and the invariant on every execution path.
GRÜN `frontend/job-field` `5d6786b` (on `c146f05`): `parseJobScope` accepts any non-empty role id verbatim; "× JOB ENTFERNEN"
(`syntx-job-scope-clear`) beside "✓ GEWÄHLTER JOB" at the selected role, reached from both fields through the shell
indicator; the legacy page `/career/analyze` reads `jobScopePoolUploadId` / `jobScopeRoleId`, validates them, shows
`analyze-job-scope` and sends `jobScope` only when VALID. GELB `feature/job-pool-first-boundary` `027abf3` (on `2e61a2b`,
no `app/` change): `executeCareerAnalysisPipeline` / `…BatchPipeline` require a scope issued by
`resolveJobScopeFromStoredPool` (WeakSet, deeply frozen); the worker opens the validated scope per claim
(`AsyncLocalStorage`), the discovery / convergence providers and the legacy analysis ask for it; 20 developer scripts
require `CONDYN_JOB_POOL_UPLOAD_ID` + `CONDYN_POOL_ROLE_ID`, validated read-only against a verified disposable database,
otherwise exit 3 with the owner's sentence. GELB's later tip `1b4f237` adds only proof JSONs and doc §11.6; every file outside
`docs/` is identical to `027abf3` (checked by PINK), so the results below hold for `1b4f237`.

PINK (probe branch = this branch + `5d6786b` + `2e61a2b`, then + `027abf3`; deleted, never pushed; evidence
`evidence/job-scope-gate-5d6786b-027abf3/`):
- Gate walk extended (PINK's file; GRÜN's locating step for G-05 sent as a diff and adopted here): G-05 now exercises the
  removal — with an analysis in flight and with a staged source and none in flight (indicator NONE, scope parameters gone,
  analysis kept, focus FIELD, `data-capability-gate=AWAITING_JOB`, every way into Capability closed, ANALYZE disabled with
  the owner's sentence verbatim, source still staged, no request, removal kept over a reload); G-10 now selects the inner-
  space and the padded role id by the explicit action, checks the exact URL, the reload and the exact request (202);
  new G-11 walks the legacy page (no scope / role not in pool / DRAFT pool → disabled, sentence, no request on a forced
  click; valid scope → exactly that scope sent, 202, enqueued once). **`5d6786b` + `027abf3`: 74/74.** A first run on
  `5d6786b` + `2e61a2b` gave 67/72; the 5 deviations were PINK walk defects (the legacy page renders NONE before its
  effect reads the URL; the in-flight analysis hides the dock's sentence by design), corrected before the final run.
- Pipeline proof (PINK, `job-scope-pipeline-gate.test.ts.txt`, 19): no options, no `jobScope`, null, the bare selection,
  an object literal with the issued fields, a spread copy, `structuredClone`, a JSON copy → `ERR_JOB_SCOPE_REQUIRED` in
  the single and the batch pipeline with the spy provider never asked; the issued scope reaches it once; the issued scope
  is deeply frozen; a padded variant of a stored id is never issued (no normalisation on the backend either).
- Worker proof (PINK, extended, 3): the 8 jobs past the route as in §3.28; inside the gate the active scope is the job's
  own selection, outside a claimed job `requireActiveJobScope` refuses with the owner's sentence; a job whose pool is
  archived during attempt 1 is claimed again and ends attempt 2 terminally with `ERR_JOB_SCOPE_INVALID` before the
  processor (re-validation on every claim). The static binding now also requires both Gemini providers of the worker to
  ask for the active scope before `execute`, and the legacy analysis to pass `jobScope: requireActiveJobScope()`.
- Script proof (PINK, `job-scope-scripts.postgres.test.ts.txt`, PINK's own network sentinel `pink-net-sentinel.cjs.txt`,
  positive control: the Gemini SDK call is recorded and refused): 23 scripts found by PINK's own sweep (GELB's 20 plus
  `debug.js`, `debug2.js`, `test-full.mjs`), each as its own process, worktree without `.env.local`, dummy key; cases no
  selection, unknown pool, DRAFT pool, role not in pool → 92 runs, **0 network attempts**; all 20 gated scripts exit 3
  with "ERR_JOB_SCOPE_*: Bitte wählen Sie einen Job aus.". No valid selection was given to any script (no Gemini).
- Preservation: SSR render probe (26 cases) of the probe tree byte-identical to `c146f05` (`027abf3` touches no `app/`).
- Regression under the sentinel: tsc 0 (with GELB's diff to `pdf-path.postgres.test.ts` applied on the probe only; with it
  the PDF path is green 2/2 — without it, it fails exactly at the pipeline gate, as GELB reports);
  38 files: 30 green / 202 tests, 8 live files skipped (no key); 0 network attempts.

Observations for the owner (no deviation from the mandate):
1. O-G05-INFLIGHT: removing the job does not cancel an analysis already submitted under it; that job keeps its stored
   scope, and the worker re-validates it at claim. While it runs, the dock shows the running state instead of the sentence
   (ANALYZE stays disabled).
2. O-SCRIPTS-UNGATED: `debug.js`, `debug2.js` (pipeline with a mock provider; neither loads — `esbuild-register` is not
   installed; the pipeline gate would refuse them anyway) and `test-full.mjs` (constructs an SDK client, sends nothing)
   carry no script gate; none can reach Gemini today. `debug2.js` writes `output2.txt` into the working directory.
3. Embeddings (`lib/career/embeddings/gemini.ts`) are still imported by no route, script or worker.
4. :3017 (`5898def`) and the demo on :41831 (`337033e`) run without this gate (GELB's note); unchanged without the owner.

Boundary B-PINK-WALK-OWNERSHIP: GELB's diff to `pdf-path.postgres.test.ts` (`jobScope: resolveTestJobScope()`) and the
§3.28 edit are taken by PINK when GELB's gate is integrated into this branch; until then the three new proofs stay evidence.
The SYNTX walk on `frontend/job-field` remains 0/3 from `ca11794` (rebinding pending, owner), not from this work.

### 3.30 Job-scope invariant: GELB `e643e96` (job scope in Capability Discovery, new sentence) with GRÜN `5d6786b` verified together (2026-10-15)

Owner GO 2026-10-15 as relayed by GELB (not seen by PINK first-hand). GELB `feature/job-pool-first-boundary` `e643e96` (on
`38d6eec` = `027abf3` + docs): the worker boundary hands its issued scope to the processor, which forwards it to
`capabilityProposalExecutor.execute(docs, report, jobScope)`; the executor refuses anything but an issued scope
(`assertIssuedJobScope`), renders it (`renderInvestigationScope`) and passes it to Discovery, where it extends only the
system prompt (`INVESTIGATION_SCOPE_CONTRACT` + `<INVESTIGATION_SCOPE>`). The Discovery RUN_ identity includes the scope
hash only when a scope is set; Convergence re-derives it from the persisted run; a scoped Discovery never short-circuits on a
scope-free verified snapshot. No DDL, provider, kernel or output-schema change. New sentence: „Bitte wähle einen Job aus einem
Pool aus.“ (`JOB_SCOPE_REQUIRED_MESSAGE`).

PINK (probe branch = this branch + `5d6786b` + `e643e96`, deleted, never pushed; evidence `evidence/job-scope-gate-5d6786b-e643e96/`):
- Discovery proof (PINK, `job-scope-discovery.test.ts.txt`, 7, spy providers): every fragment of the rendered scope (each line
  and each line's content) is absent from the source corpus, which is byte-identical to the unscoped one, and from every
  Convergence request and the legacy analysis prompt (scope A and B give byte-identical legacy requests); the full scope is in
  the system prompt after the contract. Every scope fragment quoted under five document ids (`CV`, `INVESTIGATION_SCOPE`,
  `SCOPE`, the upload id, the pool id) is rejected; a sentence that is also in the source verifies (the source alone decides).
  Other role, other pool upload → other RUN_ and CONV_; the same scope re-issued → `DISCOVERY_RUN_REUSED`, provider asked once
  per distinct scope. A blank scope is refused before the provider; the executor refuses a JSON copy, a frozen spread, the bare
  selection, `{ selection }` and the rendered text with the owner's sentence before the provider.
- Cross-version identity (PINK probe run unchanged in `027abf3` and `e643e96`, temporary worktrees, removed): the unscoped
  Discovery prompt, RUN_ id, the whole Discovery run, the provider request and the CONV_ id are byte-identical (4771 bytes,
  `RUN_4EFD7F363E2757D06C015691`, `CONV_8228CC7136F4C56966EAEA6F`).
- Worker proof (extended): the processor receives, as third argument, the issued scope of exactly its job.
- Script proof re-run with the new sentence: 92 runs, 0 network attempts, all 80 runs of the 20 gated scripts exit 3 with it.
- Gate walk (sentence constant moved to the owner's new sentence for backend and interface — GELB's diff, taken in PINK's own
  edit): **`5d6786b` + `e643e96`: 70/74.** The backend (G-06) carries the new sentence on all 7 refusals. The 4 deviations are one:
  GRÜN's interface still shows „Bitte wählen Sie einen Job aus.“ (G-05 staged removal, G-11 NONE / INVALID / DRAFT); GRÜN has not
  moved `lib/career/job-pool/job-scope.ts` yet. Gating itself holds in all four (disabled, no request).
- Regression under the sentinel (46 files, incl. GELB's discovery suite, the wiring, retry-bundle, projection and stage-A suites and
  the seals): 36 green + 8 live skipped; the seals `g2-g3-vertical-proof` (P8) and `hr-decision-loop-p7` failed only on the Next dev
  lock while PINK's walk ran in the same worktree and are green alone (63 + 7). tsc 0. 0 network attempts.

Observation O-SNAPSHOT-SCOPE (no runtime path today): the Phase-4 snapshot key (`computeSnapshotKey`) carries no scope identity.
The bound publisher exists but nothing in `lib/`, `app/` or `scripts/` calls `publish`; should Phase-4 publication of scoped runs
be wired later, two scopes over the same sources would share one snapshot key. Recorded for GELB / the owner.

Open: GRÜN to move the interface sentence (then the walk is re-run); GELB's `pdf-path` diff still waits for integration.

### 3.31 Job-scope invariant: GRÜN `aa17a3b` (interface sentence moved) with GELB `e643e96` verified together (2026-10-15)

Owner GO 2026-10-15 as relayed by GELB and GRÜN (not seen by PINK first-hand). GRÜN `frontend/job-field` `aa17a3b` (on
`5d6786b`): outside docs and GRÜN's own tests, the only change is `JOB_SCOPE_REQUIRED_MESSAGE` in
`lib/career/job-pool/job-scope.ts`, now „Bitte wähle einen Job aus einem Pool aus.“, identical to GELB's
`lib/career/job-scope/errors.ts`. Codes, behaviour and DOM unchanged.

PINK (probe branch = this branch + `aa17a3b` + `e643e96`, deleted, never pushed; evidence `evidence/job-scope-gate-aa17a3b-e643e96/`;
the proofs are the unchanged `.txt` files of §3.30, copied in on the probe only, with GELB's `pdf-path` diff on the probe only):
- Gate walk (`JOB_SCOPE_TIP=aa17a3b-e643e96`, one sentence constant for backend and interface): **74/74, no deviation.** The four
  §3.30 deviations (G-05 staged removal, G-11 NONE / INVALID / DRAFT) now show the owner's sentence verbatim; the backend (G-06)
  carries it on all 7 refusals; gating unchanged (disabled, no request, 202 only with a valid scope).
- Inverse sweep: the earlier sentence „Bitte wählen Sie einen Job aus.“ occurs nowhere in `lib/`, `app/` or `scripts/`; the new
  sentence is defined exactly twice (interface `lib/career/job-pool/job-scope.ts`, backend `lib/career/job-scope/errors.ts`) and
  pinned in GELB's two proofs; every display (ANALYZE and RETRY block, `/career/analyze`, the analyze route) reads a constant.
- Preservation: SSR render probe (26 cases) byte-identical to `5d6786b` (`render-identity-5d6786b-vs-aa17a3b-e643e96.txt`; the
  sentence is rendered only client-side, once a source is staged).
- Regression under PINK's net sentinel, `GEMINI_API_KEY` unset (46 files, incl. PINK's discovery, pipeline, worker and script proofs,
  GELB's scope suites and the seals P8 / P7, no own dev server running): 38 green + 8 live skipped, 308 tests; 0 network attempts
  (positive control caught). Script proof: 92 runs, 80/80 runs of the 20 gated scripts exit 3 with the sentence, result list identical
  to §3.30. tsc 0.

Open (unchanged, owner items): removal does not cancel an analysis in flight; `debug.js` / `debug2.js` / `test-full.mjs` ungated
(non-functional); :3017 and :41831 run without the gate; O-SNAPSHOT-SCOPE; ca11794 SYNTX rebinding. GELB's `pdf-path` diff and
the `.txt` proofs become real test files when GELB's gate is integrated into this branch.

### 3.32 Closed relations: GELB `933ea4c` (scope identity in the confirmed capability state), `9e54662` (Gemini Result Inspector), `258fde2` (docs) with GRÜN `aa17a3b` (2026-10-15)

Owner order „PINK: Alle geschlossenen Relationen unabhängig validieren“ and the owner GO for both relations, as relayed by GELB
(not seen by PINK first-hand). GELB `feature/job-pool-first-boundary`: `933ea4c` appends `investigationScope.scopeHash` to
`computeSnapshotKey` (generic and `PHASE4_VERIFIED`) for snapshots of a scoped chain, adds the optional
`VerifiedCapabilitySnapshot.investigationScope`, lets the Phase-4 publisher copy it from the authenticated Discovery run, and lets the
verification authenticator accept a scoped run (exactly `{ scopeHash }`, RUN_ re-derived with the scope; before, every scoped chain
failed Phase-4 integrity). `9e54662`: the Gemini Discovery provider returns the received text with its envelope; Discovery hands the
exchange to an optional `providerExchangeArchive` after `saveRun`; bounded retention (`retention.ts`); reader
`GEMINI_RESULT_INSPECTION_V1`; route `GET /api/career/analyses/[analysisId]/gemini-result`, 404 unless `CONDYN_RESULT_INSPECTOR=1`,
a token ≥ 32 characters and the same token in `x-condyn-result-inspector-token`. No archive is wired (its table awaits owner approval).
`258fde2`: docs only (access proof, lifecycle).

PINK (probe branch = this branch + `aa17a3b` + `258fde2`, deleted, never pushed; evidence `evidence/job-scope-gate-aa17a3b-258fde2/`;
PINK's new proofs kept as `.txt` because they import GELB modules):
- Scope in the confirmed state (PINK `job-scope-snapshot.test.ts.txt`, 6; Discovery and Convergence are the real runtimes with issued
  scopes, only the Verification run is assembled since lib/ has no producer for it): A, B and unscoped over identical sources publish
  three Phase-4 states with three keys, each carrying its own scope; re-publishing A is idempotent and leaves B untouched. Eight
  tamperings of the run's scope binding (stripped, swapped to B, upper-case, truncated, extra key, added to an unscoped run, null, bare
  string) are refused with `ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID`; changing or removing a published snapshot's scope breaks
  its identity. Reuse matrix: only unscoped state → unscoped Discovery is reused (positive control `VERIFIED_SNAPSHOT_REUSED/0`); A,
  A+B → unscoped, unscoped → A, A → A and A → B all ask the provider; a Phase-4 state of A is reached neither by B nor by an unscoped
  Discovery.
- Negative control: the same proof run unchanged on `e643e96` fails 4 of 6 (scoped Phase-4 integrity; two scopes collide with
  `ERR_IMMUTABLE_SNAPSHOT_CONFLICT`), so it detects the closed defect. The tampering case passes there too (every scoped chain was
  refused); on `258fde2` it discriminates because the untampered chains publish.
- Cross-version (PINK probe run unchanged in `e643e96` and `258fde2`, temporary worktrees, removed): unscoped generic and Phase-4 keys,
  the unscoped generic snapshot, the whole unscoped chain incl. its Phase-4 snapshot, the scoped Discovery run and both Gemini provider
  requests are byte-identical; the only difference is the scoped Phase-4 outcome (`e643e96`: integrity error; `258fde2`: published with
  `investigationScope`). The §3.30 unscoped identity probe is byte-identical as well.
- Inspector, unit (PINK `result-inspector-boundary.test.ts.txt`, 10, real Gemini provider behind a fake client): the received text is
  marked with JSON unicode escapes, which survive only in the raw text. Of 210 flag/token/header combinations exactly the two with flag
  `1`, token ≥ 32 and the exact token are ALLOWED. Discovery saves the run first, then hands over the exchange (raw text verbatim, scope
  text and hash; `null` scope when unscoped); the persisted run has exactly the e643e96 keys and holds neither the raw marker nor any
  scope fragment. A throwing or rejecting archive leaves the run byte-identical to one without archive. Through the real executor (with
  the telemetry wrapper) the archive receives the text; without the dependency nothing is retained. NOT_RETAINED: response
  `{ state: "NOT_RETAINED" }`, scope only its hash, no scope fragment although the scope is resolvable from the job, no document body.
  RETAINED shows exactly text and scope; after deletion, and at `expiresAt` to the millisecond, the same read says NOT_RETAINED. First
  write wins. 409 for a foreign RUN_ id, a foreign scope, no scope on a scoped run and a scope on an unscoped run; 404 for an unknown
  analysis. Retention: only whole days 1…30 are taken (15 inputs).
- Inspector on PostgreSQL (PINK `result-inspector.postgres.test.ts.txt`, 3, route called as Next calls it): ten closed cases give one
  byte-identical 404 (status, `no-store`, body); open: 200, NOT_RETAINED, a second read is byte-identical, 0 provider requests. A scan of
  every row of every table finds neither the raw marker nor a scope value (positive control: the parsed marker is found).
- Inspector on a real Next server (PINK `result-inspector-access.e2e.test.ts.txt`, 2, `inspector-access.json`; two server lives, PINK's
  sentinel in the server process): switched off → 404 with and without the token; switched on → the same 404 without a header, with a
  wrong, prefix or upper-case token and with the token in the query; with the token 200 `no-store`, NOT_RETAINED, the run's RUN_ id,
  no raw text, scope text or document body, identical on a second read; unknown analysis 404 `ERR_RESULT_INSPECTION_NOT_FOUND`; POST 405.
  Server network: 0 Gemini attempts; two refused `registry.npmjs.org` version checks by `next dev` itself.
- Regression on the probe: gate walk 74/74 (`aa17a3b-258fde2`); 53 files under the sentinel (§3.31 batch + GELB's snapshot-scope and
  result-inspector suites + PINK's three proofs, seals P8/P7 included): 45 green + 8 live skipped, 345 tests, 0 network attempts; script
  proof 92 runs, 80/80 exit 3 with the sentence, identical to §3.31; SSR 26 cases byte-identical to `5d6786b`; tsc 0.

Observation O-INSPECTOR-404-SHAPE (low; no data exposed): every closed case answers the route's JSON 404 (`ERR_NOT_FOUND`), while a
missing route answers Next's HTML 404. Contrary to `access.ts` and `GEMINI_RESULT_INSPECTOR.md` §3 („als gäbe es die Route nicht“), the
closed inspector is distinguishable from a route that does not exist. The cases among themselves are indistinguishable.

Observation O-ARCHIVE-AWAIT (no runtime path today): Discovery awaits `providerExchangeArchive.retain`; a throwing archive is contained,
a slow one delays the analysis by its duration (measured: 400 ms archive → ≥ 380 ms later completion). Relevant once an archive is wired.

Closed: O-SNAPSHOT-SCOPE (§3.30). Not part of this acceptance: GELB's archive diff (table `career_gemini_provider_exchanges`), not read
or run by PINK. Open owner items unchanged (§3.31).

### 3.33 Gemini exchange archive: GELB `dfb4b63` with GRÜN `aa17a3b` (2026-10-15)

Owner GO 2026-10-15 „EXCHANGE ARCHIVE“ (table and migration only in the isolated engineering/test context) and the owner order
„PINK validiert unabhängig Speicherung, Fehlerpfade, Isolation, Zugriff und Löschung“, as relayed by GELB (not seen by PINK
first-hand). GELB `feature/job-pool-first-boundary` `dfb4b63` (fast-forward on `258fde2`):
- Provider: a refused response travels in `CapabilityProviderResponseError` with the text as received; codes unchanged.
- Discovery: archives every received response (RUN_, request identity, scope text/hash). The outcome is COMPLETED only after
  `saveRun`, otherwise FAILED with the leading `ERR_` code or `ERR_UNCLASSIFIED`. It waits at most `EXCHANGE_ARCHIVE_WAIT_MS` = 1 s.
- Worker: `runWithExchangeAttempt({ jobId, leaseVersion })` per claimed job when the archive is on.
- Table `career_gemini_provider_exchanges`: opt-in `CONDYN_GEMINI_EXCHANGE_ARCHIVE=1`, DDL only after
  `verifyDisposableTestDatabase`. A partial unique index allows one COMPLETED per RUN_. `expires_at` per row; expired rows are
  DELETEd on every write and read; `delete(exchangeId)`.
- Inspector: the analysis view shows only the matching COMPLETED exchange (else 409). The new job view
  `GET /api/career/jobs/[jobId]/gemini-exchanges` lists all exchanges of the job, behind the same read boundary.

PINK (probe branch = this branch + `aa17a3b` + `dfb4b63`, deleted, never pushed; evidence `evidence/job-scope-gate-aa17a3b-dfb4b63/`;
PINK's proofs kept as `.txt`). No live Gemini: in-process runs use the real Gemini provider behind a fake client; the real worker
run uses PINK's own HTTP stand-in on 127.0.0.1 via `GOOGLE_GEMINI_BASE_URL` with a dummy key, under PINK's net sentinel (every
non-loopback connection refused; 0 recorded).

**Capture and failure paths** (`exchange-archive-capture.test.ts.txt`, 5; every case run with and without the archive: thrown
error and persisted run identical):
- Refusal matrix of 12. Archived once each, with the text exactly as received (CRLF, tabs, emoji, combining, U+2028):
  - valid → COMPLETED;
  - MAX_TOKENS with valid text, SAFETY without text (text `null`), empty text, non-string text, invalid JSON, extra schema
    key → FAILED `ERR_CAPABILITY_DISCOVERY_STRUCTURED_OUTPUT_INVALID`;
  - kernel version mismatch and coverage mismatch → FAILED with their runtime codes;
  - circular `usageMetadata` → COMPLETED;
  - throwing text accessor or rejecting client (nothing received) → no exchange.
- Persistence failure after a valid response: `ERR_PINK_SAVE_REFUSED: …` → FAILED `ERR_PINK_SAVE_REFUSED`; free text and a
  lower-case code → `ERR_UNCLASSIFIED`; the error is rethrown unchanged.
- Retry FAILED (lease 1) → COMPLETED (lease 2) on the same RUN_: the job view lists both in order, and the analysis view shows the
  COMPLETED text. 409 for each of the five request-identity fields, two COMPLETED exchanges, a foreign RUN_, another scope, a
  FAILED outcome and a removed scope; NOT_RETAINED when nothing COMPLETED exists.
- Isolation: concurrent attempts of two jobs keep their attribution; an exchange outside an attempt belongs to no job; an unknown
  job is 404; a store handing a foreign attempt to a job view is 409.
- Bounded wait: a hanging archive costs 950–2000 ms on success and on failure; a 1.6 s write lands afterwards.

**PostgreSQL** (`exchange-archive.postgres.test.ts.txt`, 6):
- DDL gate by policy: `condyn`, `CONDYN`, `postgres`, `template0`, `template1`, two malformed `condyn_test_` names, `my_database`, a
  remote host and an empty URL → `NO_DDL_ON_NON_DISPOSABLE_DATABASE` with 0 connections to PINK's counting listener (positive
  control: a disposable-pattern name connects once).
- Real databases: an existing database whose disposable marker PINK removed gets no table; a marked one only with the flag
  exactly `1` (`true` → no archive).
- Byte fidelity: CRLF/tabs/astral/combining/RTL, a 200 kB text, a BOM-first text (FAILED) and a cut MAX_TOKENS text (FAILED) come
  back exactly, with a matching `textSha256`.
- Partial unique index: a raw second COMPLETED insert fails with 23505 and a COMPLETED row with an error code with 23514; a
  second COMPLETED retain is ignored (the first text stays); FAILED rows are kept per lease.
- Retention: retained 1 ms before `expires_at`, gone at `expires_at` with the row actually DELETEd; `delete(exchangeId)`
  removes exactly one row (second call false). Window from the environment: 30 → 30 days, 31 → 7, 1 → 1.
- The received text appears in no table except the archive.

**Both routes on a real Next server** (`exchange-archive-access.e2e.test.ts.txt`, 3 server lives, `exchange-access.json`):
- Inspector off: both routes give the same JSON 404 with and without the token.
- Inspector on, archive off: closed cases give the same 404 on both routes. Open: NOT_RETAINED, and the job view shows
  `NOT_AVAILABLE` with an empty list.
- Inspector and archive on:
  - The analysis view shows the exact COMPLETED text (lease 2, `parserResultMatchesText`).
  - The job view lists FAILED (lease 1, exact refused text), then COMPLETED. It contains neither the other job's exchange nor a
    document body, and a second read is identical.
  - Unknown job → 404 `ERR_RESULT_INSPECTION_NOT_FOUND`; POST is not served.
- 0 Gemini attempts; the only outbound attempts are `next dev`'s own version checks, refused.

**Real worker run** (`exchange-archive-worker.e2e.test.ts.txt`, `exchange-worker.json`, `exchange-worker-archive-off.json`;
`scripts/run-career-worker.ts` as its own process, four jobs):
- Job A: FAILED, lease 1, `MAX_TOKENS`, exact text; then COMPLETED, lease 2, exact text. Lease 3 reuses the run: no exchange.
- Job B: COMPLETED, lease 1.
- Job C: the stand-in answered HTTP 500 three times; no response was received, so no exchange.
- Job D (role not in the pool): `ERR_JOB_SCOPE_INVALID` after one attempt; the stand-in never saw it.
- No exchange without its job. The same world with the archive off gives the same job outcomes and the same stand-in traffic,
  with 0 rows. This closes the gap GELB named (attribution so far only in unit and PostgreSQL tests).

**Unchanged:**
- Cross-version `258fde2` ↔ `dfb4b63` (§3.32 probes unchanged, temporary worktree, removed): scoped and unscoped runs, snapshot
  keys, snapshots, the full unscoped chain and the Gemini requests are byte-identical, as is the unscoped identity probe.
- Gate walk 74/74.
- Regression under the sentinel: 56 files (the §3.32 batch, GELB's `exchange-archive.postgres` and `exchange-failures`, PINK's
  new proofs; seals P8/P7), 48 green + 8 live skipped, 360 tests, 0 network attempts.
- The §3.32 real-server inspector proof is green on `dfb4b63`.
- Scripts: 92 runs, 80/80 exit 3 with the sentence.
- SSR: 26 cases byte-identical to `5d6786b`. tsc 0.

**Corrections to PINK's own earlier proofs** (no change to their earlier results):
- The §3.29 worker-gate composition check expected `new CareerJobWorker(workerId, jobRepo, processJob`. It now also admits
  `processAttempt` and asserts that it is the gated `processJob`, wrapped only in `runWithExchangeAttempt`. The real worker run
  confirms the gate dynamically (job D).
- The §3.32 database scan searched every table for scope values. It flags the Job Pool's own tables (the pool upload and the
  role profiles derived from it hold those descriptions by design) whenever another suite uploads the engineering pool into the
  same database, so it depended on test order. Corrected:
  - the raw marker must appear in no table except the archive;
  - scope values must appear in none of the seven Discovery, analysis and inspector tables.
- The §3.32 unit proof `result-inspector-boundary` uses the 9e54662 store API (`get(runId)`, `delete(runId)`, records without
  outcome and request), which `dfb4b63` replaced. On `dfb4b63` 3 of its 10 cases fail for that reason; it is retired, and its
  properties are re-proven on the new API above.

**Observation O-EXCHANGE-NUL (low):** the analysis outcome is unchanged in both cases below.
- A received text containing U+0000 leaves no row. PostgreSQL TEXT holds no NUL; the INSERT fails inside the observation-only
  retain and is swallowed. Such a response is missing from the job view without a trace, contrary to „jede empfangene Antwort“.
- A lone surrogate is stored as U+FFFD, and `textSha256` (computed over the UTF-8 encoding, which already replaces it) still
  matches.

Closed:
- O-ARCHIVE-AWAIT: bounded at 1 s, measured.
- O-INSPECTOR-404-SHAPE: `access.ts` and the contract now say that the 404 is distinguishable but carries no data; the form is
  unchanged.

Harness note (no finding): a listener that closes every connection at once made postgres-js reconnect about 41,000 times in
60 s. PINK's listener now holds connections silently, so `connect_timeout` applies.

### 3.34 Three investigation modes, B2 job comparison, JOB structure, lossless archive: GELB `e98a40c..ad15d7b` with GRÜN `aa17a3b` (2026-10-15)

**Invariant boundary B-INVARIANT-PERSON (owner decision needed).** The owner told PINK directly on 2026-10-14: „Kein Gemini-Call
ohne gültigen Job-Scope. Keine Ausnahmen.“ GELB relays an owner GO of 2026-10-15 that replaces it with „Keine Analyse ohne explizite
Untersuchungsgrenze. Ein Job-Scope ist nur erforderlich, wenn der gewählte Modus ihn verlangt.“ PINK has not seen that GO first-hand.
The PERSON mode below sends Discovery, Convergence and the legacy analysis to Gemini without any job scope. That is a deviation under
the 2026-10-14 invariant and conforms under the relayed one. PINK validates against both and leaves the decision to the owner.

GELB `feature/job-pool-first-boundary`, fast-forward on `dfb4b63`:
- `e98a40c`: archive texts are stored as their JSON string literal (`JSON_STRING_V1`), the envelope as JSON text; unmarked rows are
  read as plain text. Answers PINK's O-EXCHANGE-NUL.
- `2e5e852`: the optional `investigation { mode }` (PERSON · PERSON_X_JOB · JOB):
  - PERSON is issued only by the worker boundary (WeakSet, frozen) and makes Discovery run unscoped.
  - The provider guards require `requireActiveAnalysisBoundary()`.
  - The legacy pipeline takes `{ jobScope }` or `{ investigation }`, never both.
  - New sentence: „Bitte wähle eine eindeutige Untersuchungsgrenze.“
- `ea01bfc`: B2 `GET /api/career/analyses/{id}/job-comparison` (`SELECTED_ROLE_COVERAGE_V1`).
- `0b23045`: JOB `GET /api/career/job-pools/{upload}/roles/{role}/structure` (`JOB_STRUCTURE_V1`).
- `6a30220`: browser client and docs. `ad15d7b`: GELB's proofs.

PINK (probe branch = this branch + `aa17a3b` + `ad15d7b`, deleted, never pushed; evidence `evidence/job-scope-gate-aa17a3b-ad15d7b/`;
proofs kept as `.txt`; no live Gemini, the real worker runs against PINK's loopback stand-in as in §3.33):

**Declaration matrix** (`investigation-modes.test.ts.txt`, 4; 22 bodies):
- Only an explicit `{ mode: "PERSON" }` without any `jobScope` key is PERSON. `jobScope: null` next to PERSON is a contradiction.
- Undeclared bodies keep the earlier contract exactly. `PERSON_X_JOB` without a scope → `ERR_JOB_SCOPE_REQUIRED`.
- JOB → `ERR_INVESTIGATION_MODE_NOT_ANALYZABLE`.
- Lower case, a trailing blank, an extra key, `{}`, `null`, a string, an array, a mode array and a `__proto__` key are all
  `ERR_INVESTIGATION_INVALID`. Every refusal is `TERMINAL_ERROR`.

**Forged PERSON boundaries** (same file):
- A literal, a frozen literal, a JSON copy, a `structuredClone`, a spread, a derived object, `undefined` and `null` are refused by
  the executor with the job-scope sentence, before the provider.
- The legacy pipeline refuses a literal, a copy, both boundaries at once, none, and a job-scope literal before the provider. The
  issued PERSON boundary does reach it (positive control).
- `runWithPersonInvestigation` refuses a literal.

**Worker boundary** (same file): PERSON opens only the person boundary, and inside it `requireActiveJobScope()` still refuses, so
job-scope consumers stay closed. Undeclared and explicit PERSON_X_JOB open the job scope. Outside any attempt nothing is active.

**Cross-version through the real executor** (`mode-identity-probe.test.ts.txt`, unchanged in temporary worktrees of `027abf3`,
`dfb4b63` and `ad15d7b`, removed):
- PERSON at `ad15d7b`: the Discovery request and the persisted run are byte-identical to the scoped run at `027abf3`, where the scope
  was validated but not yet sent (`RUN_9CE64AAF8CAA85A7790523A7`); no `<INVESTIGATION_SCOPE>`.
- PERSON_X_JOB at `ad15d7b`: request and run byte-identical to `dfb4b63` (`RUN_E416BB5E5C90EFC1609BEE19`).
- The §3.30 unscoped identity probe and the §3.32 snapshot probe are byte-identical as well.

**Analyze route on PostgreSQL** (`investigation-routes.postgres.test.ts.txt`, 4; 11 bodies):
- 202 for undeclared+scope, PERSON and explicit PERSON_X_JOB+scope. The stored job input carries exactly the declaration: PERSON
  without `jobScope`.
- Refusals enqueue nothing: 400 `ERR_INVESTIGATION_INVALID` (PERSON+scope, PERSON+wrong role, unknown mode), 400
  `ERR_INVESTIGATION_MODE_NOT_ANALYZABLE` (JOB), 400 `ERR_JOB_SCOPE_REQUIRED`, 422 `ERR_JOB_SCOPE_INVALID`.
- A PERSON contradiction is refused before any pool lookup.

**Worker on PostgreSQL** (same file, real `CareerJobWorker` with the gated spy processor; 9 jobs inserted past the route):
- PERSON, undeclared and explicit PERSON_X_JOB reach the processor with the right boundary.
- PERSON+scope, JOB, undeclared without scope, PERSON_X_JOB without scope, lower case and a wrong role end after one attempt,
  before the processor.

**B2** (same file, three seeded analyses):
- The own selection → 200. Requirements are exactly the 10 of the selected role, and no id of another role appears anywhere.
- Authority block as specified (`scored: false`, `NOT_EVALUATED`). Proposals come only from the projection.
- Neither the legacy analysis payload's marker nor the document body appears. A second read is byte-identical.
- 409 `SCOPE_MISMATCH` for another role, another upload and the padded role id; 400 `SELECTION_REQUIRED`.
- 409 `NOT_SCOPED` for a PERSON analysis.
- 409 `SCOPE_DRIFT` when the job declares A but its Discovery ran under B's scope; 404 for an unknown analysis.

**JOB structure** (same file):
- Byte-identical on a second read. Every evidence line is a whole line of the pool's canonical source document
  (`renderPoolSourceContent`, JOB_POOL_SOURCE_RENDERING_V1) and belongs to the selected role.
- None of the person analysed for this job appears: document body, CV text, legacy content, proposal name, analysis, job, RUN_,
  CONV_ and CSB_ identities.
- 409 for an unknown role, an unknown upload and a DRAFT pool; 400 for an empty selection.
- Findings consistent with the pool data: non-CAPABILITY types ineligible; „Demonstrated with senior engineers“ unresolved; the role
  declares no responsibility.

**Lossless archive** (`exchange-archive.postgres.test.ts.txt`, expectations moved to `e98a40c`):
- Seven texts come back exactly through the store, each with a matching `textSha256` and the exact scope text: CRLF/unicode, 200 kB,
  BOM-first, MAX_TOKENS, U+0000, a lone surrogate, and a bare U+0000.
- The column holds `JSON.stringify(text)` and no raw NUL. A plain pre-`e98a40c` row stays readable.
- The received layout appears in no table but the archive. **O-EXCHANGE-NUL closed.**

**Client** (`inspector-client.test.ts.txt`, 2):
- 12 response cases map to the right states; the strict decoders refuse a NOT_RETAINED with an extra key, a RETAINED without text,
  an unknown mode and a wrong version.
- The token travels only in the header (GET, `no-store`, path-encoded id).
- The job view refuses foreign attempts and a COMPLETED with an error code. The B2 guard holds only for the exact analysis, upload
  and role while unscored.

**Real worker** (`exchange-archive-worker.e2e.test.ts.txt`, archive on and off; Discovery recognised by its response schema):
- P (PERSON): one Discovery request without the scope block, archived COMPLETED at lease 1 with `investigationScope` null.
- Q (PERSON + scope) and J (JOB): end after one attempt; the stand-in never saw them.
- A–D unchanged from §3.33. Archive off: identical traffic and outcomes, 0 rows. 0 outbound attempts.

**Real Next server** (`investigation-routes.e2e.test.ts.txt`): analyze (5 declarations), B2 (own selection, other role, PERSON) and
JOB structure (deterministic, unknown role) answer at their real paths as on PostgreSQL. The §3.32 and §3.33 server proofs are green
on `ad15d7b`. Gemini attempts 0; only `next dev` version checks, refused.

**Regression:**
- Gate walk 74/74.
- 65 files under the sentinel: the §3.33 batch, GELB's six new suites and PINK's three new proofs. 57 green + 8 live skipped,
  400 tests, 0 network attempts.
- Scripts: 92 runs, 80/80 exit 3 with the job-scope sentence, identical to §3.31 — scripts stay bound to a job.
- SSR 26 cases identical to `5d6786b`. tsc 0.

Correction to PINK's own proof: the §3.29 worker-gate static check expected `requireActiveJobScope()` in the provider guards. It now
accepts the guard the source uses, and for `requireActiveAnalysisBoundary()` asserts the legacy call `...pipelineBoundary(…)`. It thus
records the PERSON relaxation; it still recognises the `dfb4b63` form.

Observation O-B2-OPEN-READ (low, existing class): B2 and the JOB structure have no read boundary of their own, unlike the inspector.
B2 returns verbatim, source-verified CV quotes as coverage evidence. This is the same exposure as the existing open Career routes
(`/api/career/analyses/*`, `/matches`); per GELB's reconstruction `/api/career/*` is not reachable through the domain.

### 3.35 Human authority: owner confirms B-INVARIANT-PERSON; validation of `e98a40c..ad15d7b` closed (2026-10-15)

The owner answered PINK directly („SFE — PINK | OWNER AUTHORITY CONFIRMATION“, 2026-10-15). Verbatim core:

> Ich bestätige ausdrücklich **B-INVARIANT-PERSON**.
> Die Owner-Entscheidung vom 15.10.2026 ersetzt die frühere Job-Scope-Pflicht:
> **Keine Analyse ohne explizit ausgestellte Untersuchungsgrenze.**
> - PERSON: unabhängig vom Job-Scope.
> - PERSON × JOB: zwingend mit gültigem, ausgewähltem Job-Scope.
> - JOB: unabhängig von Personendaten.
>
> Damit ist die scopefreie Gemini-Analyse ausschließlich im ausdrücklich gewählten PERSON-Modus autorisiert.
> Die unabhängige technische Validierung wird angenommen. […] `O-B2-OPEN-READ` bleibt als Sicherheitsbeobachtung erhalten; keine
> öffentliche Freigabe.

Consequences for this record:
- **Invariant.** The governing invariant is now „Keine Analyse ohne explizit ausgestellte Untersuchungsgrenze“. It replaces the
  2026-10-14 invariant „Kein Gemini-Call ohne gültigen Job-Scope. Keine Ausnahmen.“
  - From §3.26 to §3.33 a scope-free Gemini call was a deviation. Those sections stay valid as written for their tips.
  - From `2e5e852` on, a scope-free call is authorised only for an explicitly declared and issued PERSON boundary.
  - PERSON_X_JOB keeps the full JOB POOL FIRST gate.
  - JOB reads no person data.
- **B-INVARIANT-PERSON: closed by owner decision.** The §3.34 measurements now count as conformance proof:
  - PERSON is exactly the explicit declaration and is issued only by the worker boundary;
  - stand-ins are refused before any provider;
  - PERSON + job scope and JOB are refused before Gemini;
  - PERSON_X_JOB is byte-identical to `dfb4b63`.
- **Validation of `e98a40c..ad15d7b`** (with GRÜN `aa17a3b`) is accepted by the owner and closed for this PINK field. Its open items
  are only the ones the owner keeps: O-B2-OPEN-READ, plus the owner items listed in §3.31.
- **O-B2-OPEN-READ stays open as a security observation.** B2 and the JOB structure have no read boundary of their own, and B2 returns
  verbatim CV quotes. There is no public release; nothing here authorises exposing these routes.
- **Not authorised** by this decision, and unchanged: merge, integration, deployment, live Gemini.

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
