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

### 3.36 Three investigation modes in the frontend: GRÜN `df2e84e` on GELB `ad15d7b` (2026-10-15)

GRÜN asked PINK for an independent validation of `df2e84e` on `frontend/three-modes`. The owner GO „DEMO FRONTEND“ was relayed by
GRÜN and is **not seen first-hand**. The governing rule is the owner's own ruling in §3.35 („Keine Analyse ohne explizit ausgestellte
Untersuchungsgrenze“). Evidence is in `evidence/job-scope-gate-df2e84e/`, with `manifest.sha256`. The new PINK proofs import modules
that exist only on GRÜN's branch, so they are stored as `.txt` there.

**Base.** `f44a4b1` was rebuilt independently as a merge of `aa17a3b` and `ad15d7b`. Its tree is identical
(`37a973a…`) and it has no conflicts. `df2e84e` changes:
- frontend components;
- `lib/career/job-pool/investigation-mode.ts` (new, client side);
- `lib/career/ui/career-job-controller.ts`;
- `lib/career/ui/useRoleInvestigation.ts` (new);
- copy;
- tests under `test/career/three-modes/`, plus one changed expectation in `test/career-frontend-job-lifecycle.test.tsx`.

It does not change any route, worker, executor or `test/job-pool-validation/` file.

**Probe.** `8a503d4` + `df2e84e`, with earlier PINK proofs copied in and GELB's pdf-path diff applied. The probe branch was deleted
and never pushed.

| Proof | Result |
|---|---|
| Gate walk (`job-scope-gate.e2e`, unchanged) | **74/74** |
| `three-modes-boundary` (new): frontend mirror `checkAnalysisPayload` and the body the real `CareerJobController` sends, against GELB's `parseDeclaredInvestigation`, on 6000 seeded payloads | M-1 **0 disagreements** (147 PERSON, 737 PERSON_X_JOB, 2871 INVALID, 660 NOT_ANALYZABLE, 1585 JOB_SCOPE_REQUIRED); M-2 884 sent, every body read by the server with the same mode and selection, no `jobScope` beside PERSON, other keys unchanged; M-3 5116 refused with nothing sent and the state untouched; M-4 mode × validation table; M-5 only the three exact URL values |
| Negative controls (mutations of the mirror, probe only, restored) | PERSON accepting a scope: 311 disagreements; extra declaration keys: 67 disagreements. Both are detected. `withoutDeclaration` still keeps the scope out of a PERSON body |
| `three-modes.e2e` (new), real Next server, disposable DB, no worker, sentinel | plain build **75/76**, inspector build **81/82**. The one deviation is O-MODE-KEYBOARD-FOCUS (below) |
| Server e2e of §3.32–§3.34 (investigation routes, Result Inspector access, exchange access) | 3 files, 6/6 |
| Regression under PINK's net sentinel | 69 files: 61 green + 8 live skipped, 488 tests, **0 network attempts**; scripts 92 runs, 80 exit 3, identical to `ad15d7b` |
| SSR preservation (26 renders) | 26/26 byte-identical to `aa17a3b+ad15d7b` once the additions are removed. The additions are the mode control, `data-investigation-mode`, `data-investigation-body/visible`, `data-gemini-output-visible` and `data-job-scope-used="true"`; nothing else changed |
| `tsc --noEmit` | 0 errors with the pdf-path diff |
| Gemini hosts | 0 in every server life. The only refused outbound attempt is the `next dev` version check at registry.npmjs.org |

**Browser walk, measured** (`T-report-plain.txt`, `T-report-inspector.txt`):

- **T-01 Ground state.**
  - Without a parameter the mode is PERSON_X_JOB and nothing is written to the URL.
  - These values are no choice: `person`, `PERSON␠`, `␠JOB`, `PERSON×JOB`, `PERSON_X_JOB,JOB`, `TEAM`, an empty value and a repeated parameter. Each gives PERSON_X_JOB and AWAITING_JOB.
- **T-02 Gate, mode × job** (NONE / VALID / INVALID). Measured on the root attribute, the Capability button and URL `focus=CAPABILITY`:
  - PERSON: OPEN in all three job states;
  - PERSON × JOB: OPEN only with a VALID job, otherwise AWAITING_JOB;
  - JOB: JOB_MODE in all three, and the Capability field is never reachable.
- **T-03 ANALYZE, five cases:**
  - PERSON, with or without a VALID job: one POST `{documents, investigation:{mode:"PERSON"}}`. The stored job declares PERSON with no `jobScope` key.
  - PERSON × JOB: one POST with exactly the selection, stored as declared.
  - PERSON × JOB without a job, and JOB: nothing is executable, no request is sent, nothing is enqueued. PERSON × JOB shows the owner's sentence verbatim.
- **T-04 Shell control:**
  - A click writes the mode to the URL.
  - The selected job stays in the URL and stays VALID (G-05).
  - In PERSON the indicator shows `data-job-scope-used="false"` and names PERSON.
  - JOB leaves the Capability field. Going back to PERSON × JOB returns to the requested Capability field.
  - Keys ←, End, Home and → choose the expected modes.
- **T-05 Job Field.** The analysis source is NONE in PERSON and JOB, and the statement names the mode. In PERSON × JOB the URL analysis is compared.
- **T-06 B2 and JOB structure:**
  - The toggle exists only at the selected job's role: COVERAGE in PERSON × JOB, STRUCTURE in JOB, none in PERSON.
  - Nothing is read while the body is closed. Opening reads exactly one GET for exactly the selection. Closing removes the body, and reopening reads again.
  - The real structure route answers AVAILABLE with exactly the role's three requirements, bound to the role and unscored.
  - The real B2 for an analysis without proposals is NOT_FOUND and is named as such.
  - Display guard, with routed answers:
    - the exact binding shows 2 rows, `data-relation-state=NOT_EVALUATED`;
    - another role, another analysis, or an altered authority give FAILED, with no row and no quote;
    - SCOPE_MISMATCH, NOT_SCOPED and SCOPE_DRIFT are each named.
- **T-07 GEMINI OUTPUT:**
  - Without `NEXT_PUBLIC_CONDYN_RESULT_INSPECTOR_UI=1` there is no toggle in any mode and no inspector request.
  - With it:
    - the toggle opens IDLE and reads nothing before a token is given; the token field is a password field with autocomplete off;
    - a wrong token and the right token each send exactly one GET, with the token only in the header (server: `ERR_NOT_FOUND`, then `ERR_RESULT_INSPECTION_NOT_FOUND` for the fixture);
    - the token is never in the URL, cookies, localStorage, sessionStorage or the title;
    - closing removes the field, and reopening shows it empty and IDLE;
    - in JOB it shows NO_GEMINI („No Gemini call in this mode.“) with no token field and no request.
  - No token appears in the evidence (scanned).
- **T-08 Layout.** At 1600 and 1280 px, in both fields, the control is inside the viewport and uncovered. It overlaps neither the job indicator nor the field selector. No closure glyph appears in any mode.
- **T-09 Network and errors.** The browser made no request outside the server, and there was no page error.

**Observations:**
- **O-MODE-KEYBOARD-FOCUS (accessibility, not a boundary deviation).**
  - What happens: when a keyboard choice on the mode control moves the shell from the Capability field to the Job Field (End or → to JOB), focus leaves the control and lands on `syntx-field`.
  - Consequence: the next ←/Home is then the Job Field's own navigation, not a mode choice.
  - Unaffected: the gate holds; JOB still leaves the Capability field.
  - Measured: `End:PERSON→JOB focus=syntx-field`, `ArrowRight:PERSON_X_JOB→JOB focus=syntx-field`. Every other step keeps focus on the chosen radio.
  - Mechanism: PINK's search did not find it. The cause is the F-SX-1 effect in `SyntxField.tsx`, whose optional call `focus?.(…)` that search missed. GRÜN identified it; see §3.37.
  - Owner: GRÜN.
- **O-URL-ANALYSIS-UNBOUND (informational).**
  - What happens: an analysis opened from the URL (`analysisId`) has no known investigation mode in the frontend. In PERSON × JOB the Job Field compares it with the pool, as before `df2e84e` (T-05: source URL).
  - B2 is guarded server-side by the binding (NOT_SCOPED / SCOPE_MISMATCH).
  - The earlier pool comparison surface has no such binding check. It is deterministic and makes no Gemini call.
  - For the owner and GELB: should a URL analysis be compared only when its declared boundary is PERSON_X_JOB with the selected job?

**GRÜN's own figures** (new 3 files / 74 tests, regression 58 / 442, gate walk 74/74, workflow e2e 10/10, lab walk 38/38) are
consistent with PINK's. PINK did not re-run GRÜN's lab walk with the real worker: `df2e84e` changes no worker or server path, and the
real-worker paths were proven on `ad15d7b` in §3.34.

**Status.**
- No deviation from the owner's ruling of §3.35 at the frontend:
  - PERSON never carries a job scope;
  - PERSON × JOB only with the VALID selection;
  - JOB never analyses and never calls Gemini.
- One accessibility observation (GRÜN) and one informational question (owner/GELB).
- O-B2-OPEN-READ is unchanged: the B2 body shows CV quotes, the route has no read boundary, and there is no public release.
- Not authorised, and unchanged: merge, integration, deployment, live Gemini.

**Hygiene follow-up to §3.31–§3.36 (GELB's report, 2026-10-15).**
- What was wrong: the evidence files `scripts-results*.json` in seven `job-scope-gate-*` directories, and two `positive-control.mjs.txt`, contained the local absolute worktree path. It sits in Node stack traces of the old root file `debug.js`, which is the known ungated owner item.
- What changed: the path is now written repo-relative.
- Verification: the changed files' lines in each `manifest.sha256` were renewed, and all seven manifests verify.
- Unchanged: no measured value. The earlier commits still contain the path; rewriting history is the owner's decision.

### 3.37 O-MODE-KEYBOARD-FOCUS closed: GRÜN `bd9eb72` (2026-10-15)

GRÜN found the cause, and PINK confirms it from the diff. The F-SX-1 effect in `SyntxField.tsx` pulls the focus to the field root
when the Job Field mounts and the focused element lies outside it. Its call is `(target as HTMLElement).focus?.(…)`, which PINK's
search for `focus(` did not match.

**The fix (`bd9eb72`)** is one new condition in that effect: it leaves alone a focus that lies inside the mode control
(`[data-sx-shell="investigation"]`). Every other F-SX-1 path is unchanged. `00deaf0` only makes GRÜN's evidence scripts
repo-relative; PINK found no `/home` path in GRÜN's three-modes evidence.

PINK re-ran on the probe `b6c6200` + `bd9eb72` (evidence in `evidence/job-scope-gate-bd9eb72/`):
- **Gate walk 74/74.** This includes G-03, where ←/Home on the Job Field must not open the Capability field, so the F-SX-1 keys are unchanged.
- **`three-modes.e2e` (plain build) 76/76.** After every key, including End PERSON→JOB and → PERSON_X_JOB→JOB when the field moves to FIELD, the focus stays on the chosen radio.
- **Regression:** 69 files, 61 green + 8 live skipped, 488 tests, 0 network attempts.
- **Scripts:** identical to `df2e84e`.
- **`tsc`:** 0.
- **Network:** 0 Gemini hosts.

**Status.**
- O-MODE-KEYBOARD-FOCUS is closed.
- O-URL-ANALYSIS-UNBOUND is with the owner, together with GELB's proposal: show the earlier comparison of a URL analysis only after B2 answers 200 and `comparisonBelongsToSelection` holds for the current selection, with no backend change. It is unchanged.
- O-B2-OPEN-READ is unchanged.
- Merge, integration, deployment and live Gemini are still not authorised.

### 3.38 URL boundary: persisted investigation boundary of an analysis — GELB `26df225` / `ef189d3` (2026-10-15)

GELB asked PINK for an independent check of the URL boundary. The owner mandate „SFE — GELB / GRÜN | URL BOUNDARY CLOSURE“ was relayed
by GELB and is **not seen first-hand**. It answers O-URL-ANALYSIS-UNBOUND (§3.36).

**What it is.** The route `GET /api/career/analyses/{id}/investigation` (`ANALYSIS_INVESTIGATION_V1`) resolves an analysis to its
investigation boundary from persisted relations only:
- the analysis row;
- the SUCCEEDED job(s) whose result it is, together with the job of its projection reference (exactly one job is required);
- the processor rule `JOB_`→`ANL_`;
- the job's own declaration, read with `parseDeclaredInvestigation`;
- where a reference exists: the B2 lineage, and the rule „run scoped ⇔ PERSON_X_JOB“.

Everything else is 409 UNRESOLVED with a reason, and an unknown analysis is 404. The client rule
`legacyJobComparisonPermitted` admits the earlier comparison only for a RESOLVED PERSON_X_JOB analysis compared with exactly its
own pool. The matches, analyze and B2 routes are unchanged.

**Probe.** `7ca3cfb` + GRÜN `bd9eb72` + GELB `ef189d3`, merged without conflict. Evidence is in
`evidence/job-scope-gate-bd9eb72-ef189d3/`.

| Proof | Result |
|---|---|
| `url-boundary.postgres` (PINK fixture of §3.34 declares the job's boundary and the Discovery scope independently; 23 analyses) | **6/6** |
| UB-1/UB-2 cases | 5 RESOLVED as specified (PERSON_X_JOB with and without the explicit declaration, PERSON, both from the declaration alone); unknown and blank 404; NOT_RECORDED (no job; only FAILED/RUNNING/PENDING jobs); NOT_DECLARED; DECLARATION_INVALID (PERSON + scope, JOB); AMBIGUOUS (two SUCCEEDED jobs; a second job claiming an analysis); LINEAGE_INVALID (job id against the processor rule, foreign reference, source bundle hash, foreign Convergence run, job result naming another analysis); RUN_CONTRADICTS_DECLARATION (PERSON with a scoped run, PERSON_X_JOB with an unscoped run) |
| UB-1 values | The selection is exactly the declared one. `discoveryRunId` is the reference's. `investigationScopeHash` = sha256 of the rendered scope text (the Discovery runtime's hash) |
| UB-3 | Every answer is no-store. Exact key sets. No document content, legacy payload, capability name or quote in any body |
| UB-4 | Every `career_*` / `capability_*` table is byte-identical before and after all reads |
| UB-5 | `legacyJobComparisonPermitted` over the real answers × {own pool, other pool, other analysis}: true only for RESOLVED PERSON_X_JOB in its own pool. FAILED, NOT_FOUND, UNRESOLVED, pending and null all give false; an answer about another analysis is FAILED; 10 single-field corruptions are refused by the decoder |
| Negative controls (probe only, restored) | client ignoring the pool → UB-5 fails; no run/declaration check → UB-2 fails; no AMBIGUOUS check → UB-2 fails |
| `url-boundary.e2e`, real Next server | Answers at the real path are byte-identical to in-process, all no-store (200/200/409/409/404, `../` 404). POST/PUT/PATCH/DELETE give 405. 0 Gemini attempts (only the `next dev` npm check was refused) |
| Regression under the sentinel | 72 files (64 green + 8 live skipped), 514 tests, **0 network attempts**; scripts identical to `bd9eb72`; `tsc` 0; gate walk 74/74 |

**Observations:**
- **O-URL-SCOPE-IDENTITY (defence in depth).**
  - What happens: RUN_CONTRADICTS_DECLARATION checks that a run scope is *present*, not that it is the declared one. A PERSON_X_JOB job declaring role A whose referenced Discovery ran under role B of the same pool resolves as PERSON_X_JOB with selection A (measured).
  - Reachability: only with inconsistent persisted data. The executor derives the run scope from the declaration, and reuse is keyed by the scope hash.
  - Consequence: the frontend permission is pool-wide, so the earlier comparison would be shown, as it would for role A. B2 detects this case as drift.
  - Possible hardening, GELB's to weigh: compare the run hash with the declared selection rendered from the stored pool, as B2 does.
- **O-URL-REF-STATUS (informational).**
  - What happens: a job found only through the projection reference is not required to be SUCCEEDED. A FAILED job with a reference resolves (measured).
  - Reachability: possible in the real flow. The processor saves the analysis and the reference before the worker sets SUCCEEDED (`worker.ts:74`); a failed status update, such as a lost lease, followed by a terminal failure leaves this state.
  - Assessment: the boundary returned is still the declared one under which the analysis was produced, so this is not a boundary deviation.

**Consequence for PINK fixtures (GELB's note).** `ANL_PINK_JOB_SCOPE_GATE` (gate walk) and `ANL_PINK_THREE_MODES` have no job. They
will be UNRESOLVED (NOT_RECORDED) once GRÜN uses the route, so their earlier comparison will no longer be shown. PINK adapts its
suites when GRÜN's frontend arrives: a SUCCEEDED job with `result_analysis_id` and the declared boundary.

**Status.**
- No deviation for GELB `26df225`/`ef189d3`. O-URL-ANALYSIS-UNBOUND is closed on the backend side; the frontend side follows from GRÜN.
- Open: O-URL-SCOPE-IDENTITY and O-URL-REF-STATUS (informational), and O-B2-OPEN-READ. The new route is open-read like the other career routes, but carries identities only.
- Not authorised: merge, integration, deployment, live Gemini.

### 3.39 URL BOUNDARY CLOSURE in the frontend, and the scope-identity hardening: GRÜN `da59568`/`8718e3a`, GELB `d54c718` (2026-10-15)

GRÜN asked PINK for an independent check of the frontend side of the URL BOUNDARY CLOSURE. GELB asked PINK to include its hardening
of O-URL-SCOPE-IDENTITY (§3.38). The owner mandate was relayed by both and is **not seen first-hand**.

**What changes:**
- **Hardening.** `d54c718` proves a scoped Discovery run like B2: `sha256(render(resolve(declared selection)).text)` must equal the run's scope hash, otherwise RUN_CONTRADICTS_DECLARATION. A selection that can no longer be resolved gives the new reason SCOPE_UNAVAILABLE. Without pool persistence the route answers 503.
- **Frontend.** `da59568` applies one rule to every analysis on view, whether it came from the URL or from a job. In PERSON × JOB the earlier comparison is read and shown only when `legacyJobComparisonPermitted` holds, and `/matches` is never read for another pool. The new attribute `syntx-field[data-analysis-boundary]` takes the values RESOLVING / PERSON / UNRESOLVED / OTHER_POOL / PERSON_X_JOB. For OTHER_POOL there is an explicit „open the analysis's pool“ action.
- **`8718e3a`.** It merges `d54c718`/`4e72260`; its code is identical to PINK's probe. It differs only in docs and two lines of `job-pool-workflow.e2e`: the DRAFT step waits for the field to rest.

**Base.**
- `7507454` was rebuilt independently as `bd9eb72` + `ef189d3`: identical tree, no conflicts.
- Probe: `f993655` + `da59568` + `d54c718`/`4e72260`. Evidence is in `evidence/job-scope-gate-8718e3a/`, which also holds the da59568 reports from before the hardening.

**PINK fixtures.** GRÜN's diff for `job-scope-gate.e2e` is reviewed and **adopted in this commit** (PINK's file). It adds a
SUCCEEDED job `JOB_PINK_JOB_SCOPE_GATE` with `result_analysis_id`, declared PERSON_X_JOB for the validation pool's role. It is created
before every before/after count, so the counts stay relative, and it changes nothing for tips without the route. The
`three-modes.e2e` walk gets the same pattern.

| Proof | Result |
|---|---|
| Gate walk with the adopted fixture | **74/74** on `da59568`, and again on the hardened stack |
| `three-modes.e2e`, extended by **T-10 URL boundary** | **91/91** on `da59568`, and again on the hardened stack. The 15 T-10 checks are listed below |
| `url-boundary.postgres`, extended for `d54c718` | **6/6**. Every unresolved reason is reached, now 7 including SCOPE_UNAVAILABLE (declared role not in the pool, declared pool unknown). The §3.38 role-drift case is now **409 RUN_CONTRADICTS_DECLARATION** |
| Negative control for the hardening | without the hash comparison the role-drift case fails UB-2 (detected) |
| `url-boundary.e2e`, real Next server | 1/1: byte-identical to in-process, no-store, 405 for other methods, 0 Gemini attempts |
| Regression under the sentinel | 72 files (64 green + 8 live skipped), 522 tests, **0 network attempts**; scripts identical to `bd9eb72`; `tsc` 0 |
| GRÜN `job-pool-workflow.e2e` | `da59568` version 9/10: its DRAFT step clicked during the pool-change animation, the step `8718e3a` stabilises. `8718e3a` version: 10/10 twice |

**T-10 URL boundary in the browser.** Each case was measured with every `/matches` and `/sources` request of the page:
- **Compared, exactly with the analysis's own pool:** PERSON_X_JOB, with the explicit declaration and with the earlier jobScope-only declaration.
- **No comparison, no `/matches`, no `/sources`:**
  - a PERSON analysis from the URL (PERSON);
  - an analysis row without a job, and an unknown analysis (UNRESOLVED);
  - the own analysis viewed in another pool (OTHER_POOL). The hint names the own pool, and the URL stays on the viewed pool;
  - the own analysis in PERSON mode and in JOB mode.
- **Explicit click.** It opens the own pool, and only then is the analysis compared.
- **Pending read.** While the boundary read is held, the state is RESOLVING with 0 `/matches` and 0 `/sources`. After release it is PERSON_X_JOB and compared.
- **Failed or forged reads** — a 500, a 200 about another analysis, a 200 with an extra key, a 409 with an unknown reason — all give UNRESOLVED with no `/matches` and no `/sources`.

**Observations:**
- **O-URL-SCOPE-IDENTITY: closed** by `d54c718`, as measured above.
- **O-URL-REF-STATUS** is unchanged. GELB keeps it and documents it in THREE_INVESTIGATION_MODES.md §10.
- **New edge (informational).**
  - What happens: a PERSON_X_JOB analysis resolved from the job declaration alone (no projection reference) whose declaration names a role the pool does not have resolves as PERSON_X_JOB, because the declaration path reads no pool. It is measured as `snapshotMissingRole`.
  - Reachability: not through the analyze route, which refuses such a selection, nor through the worker, which re-resolves on every claim. Only inconsistent persisted data reaches it.
  - Consequence: the frontend permission is pool-wide either way.
- **Hygiene during the run.** GRÜN's `job-pool-workflow.e2e` writes its screenshots into GRÜN's tracked evidence. PINK's probe runs overwrote them locally; they were restored before switching back, and nothing was committed.

**Status.**
- No deviation. O-URL-ANALYSIS-UNBOUND is closed end to end: backend `26df225`/`d54c718`, frontend `da59568`/`8718e3a`.
- O-B2-OPEN-READ is unchanged.
- Merge, integration, deployment and live Gemini are still not authorised.

### 3.40 pdf-path proof with the resolved test job scope, for the integration: PINK `d4f61c1` with GRÜN `8718e3a` (2026-10-15)

**Request.** GELB asked PINK to adopt its two-line diff in `test/job-pool-validation/pdf-path.postgres.test.ts`, so that the integration compiles. GELB stated that the owner gave it an integration GO for `integration/job-field-governance`. PINK knows that GO only from GELB, not first-hand.

**Change** (`d4f61c1`, test file only, no application change):
- import `resolveTestJobScope` from `test/support/job-scope`;
- pass `jobScope: resolveTestJobScope()` to `executeCareerAnalysisPipeline` in the stubbed legacy step.

It closes the `tsc` line (80,79) that every PINK probe had so far patched by `sed`. The helper lives on the peer branch, so the file compiles only against the merged tree. On the PINK branch alone, `tsc` therefore reports two known errors until the integration, both in this file: the missing module `../support/job-scope`, and `jobScope` unknown in `PipelineExecutionOptions`.

**Probe** (PINK branch merged with `8718e3a`, the proof copies of the evidence directories in place, no `sed`):
- The merge combines the change with GRÜN's earlier edit of the same file (the pool upload and `jobScope` in the ANALYZE body), without a conflict.

**Results:**

| Check | Result |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| `pdf-path.postgres` | 2/2 |
| ESLint on the file | the same 10 findings as `8705cc7` (5 `no-explicit-any`, 5 unused); none from the change |
| Regression under the sentinel | 72 files (64 green + 8 live skipped), 522 tests (514 green), **0 network attempts** |
| Scripts | 92 runs, 80 refused with exit 3, identical to `da59568`/`d54c718` |
| Gate walk | 74/74 |

Evidence: `evidence/job-scope-gate-d4f61c1-8718e3a/` (G-report, batch results, scripts results, `tsc`, the adopted diff, manifest).

**Status.**
- No deviation.
- O-B2-OPEN-READ is unchanged.
- PINK validates the integration state only when GELB reports it.
- Main, deployment and live Gemini stay untouched.

### 3.41 Integration `integration/job-field-governance` `0fb7b05`: three investigation modes with the PINK tip (2026-10-15)

**Request.** GELB asked PINK to validate the integration state independently. GELB stated an owner "INTEGRATION GO" for the three-modes state; PINK knows that GO only from GELB.

**Merges.**
- `82d2f47` merges GRÜN `8718e3a` into `311d6ee`. `fd11389` merges PINK `c5b323f`. `0fb7b05` adds GELB's integration document and two proof JSON files only.
- PINK rebuilt both merges independently. The trees are identical (`927ed73…`, `f8ac6fa…`).
- `311d6ee` is already an ancestor of `8718e3a`. The integrated code is therefore exactly the tree PINK probed in §3.40.
- `package.json` and the lockfile are unchanged.

**Results:**

| Check | Result |
| --- | --- |
| Full suite without e2e, base `311d6ee` | 2389 passed, 27 failed, 8 skipped |
| Full suite without e2e, `0fb7b05` | 2617 passed, 38 failed, 8 skipped, **0 network attempts** |
| Comparison | The 27 failures outside outcome-valence are identical to the base, in four lifecycle/policy files. The 11 outcome-valence failures are all "Test timed out in 5000ms" under load; that code is unchanged in the range. The three files alone fail twice by timeout and pass 19/19 with a 30 s timeout. Two base tests are absent because GRÜN renamed them (owner mandates `ca11794`/`c146f05`). |
| PINK batch with the proof copies | 72 files (64 green + 8 live skipped), 522 tests, 0 network attempts; scripts identical to `da59568`/`d54c718` |
| Gate walk | 74/74 |
| `three-modes.e2e` | plain 91/91, inspector 97/97 |
| `url-boundary.e2e` (real server) | 1/1 |
| GRÜN `job-pool-workflow.e2e` | 10/10 |

The only network attempt in the server runs was the Next dev version check to registry.npmjs.org, blocked by the sentinel; there were 0 Gemini attempts.

**`syntx-walk.e2e` 0/3.** The cause is in the walk, not in the application:
- The walk persists `ANL_PINK_SYNTX_WALK` directly, without a job (line 284). Its boundary is therefore UNRESOLVED NOT_RECORDED, so the URL boundary never compares it and the field never becomes AVAILABLE (waits at lines 333, 909, 1042).
- The walk was already 0/3 on `frontend/job-field` since `ca11794` (§3.26).
- Its version-two step compares the analysis in another pool version. The URL boundary forbids that by design (OTHER_POOL).
- Rebinding the walk to the invariants is PINK's task. It is due after the `/matches` delta (§3.42), which additionally needs a persisted job.

**Findings on GELB's integration document:**
- **Leak check.** The document reports no local paths in the merge range. Measured: 30 added lines in 25 files contain a local `/home/<user>/…` path. All are in GRÜN's `docs/career_analysis/evidence/job-pool/` (from `337033e`, `c146f05`, `cb3d33f`, `aa17a3b`, `44cd561`, `415f348`, `bb5e8e3`); none is in PINK files. They are already on pushed branches; cleaning them up or rewriting history is an owner decision.
- **Provenance.** Both `docs/proofs/job-pool-first-boundary/2026-10-15-integration-*.json` files record `gitSha: null`. Their checks pass (8/8 and 45/45), but neither names the commit it ran against.
- **Load timeouts.** GELB's count of 28 failures and PINK's 38 differ only by outcome-valence load timeouts.

Evidence is in `evidence/integration-0fb7b05/`: reports, comparisons, the leak check and the manifest. Screenshots were not committed; the reports carry every check.

**Status.**
- No deviation in the integrated code.
- Open: the `syntx-walk` rebinding (PINK), the local paths in GRÜN's evidence (owner), and O-B2-OPEN-READ (unchanged).
- Deployment, a public release and live Gemini are not authorised. `main`, :3017 and :41831 were not touched.

### 3.42 Separate `/matches` delta: GELB `eacfc97` on `feature/matches-boundary-guard` (2026-10-15)

**Request and rule.** GELB relayed the owner's wording: the legacy pool-wide comparison stays role-unbound for compatibility. Its interface refuses a stored PERSON analysis and an unresolvable boundary on the server.
- In `lib/career/job-pool/application.ts`, the persisted boundary is read after the pool exists and before the analysis is loaded:
  - PERSON → 409 `ERR_JOB_POOL_MATCHES_PERSON_ANALYSIS`;
  - unresolved → 409 `ERR_JOB_POOL_MATCHES_BOUNDARY_UNRESOLVED`, with the reason in `issues[0]`;
  - unknown → 404.
- The production composition (`local-composition.ts`) supplies the boundary.
- PINK knows the owner wording only from GELB.

**PINK proofs:**
- **`matches-boundary.postgres`** (new): the same 26 seeded analyses as `url-boundary.postgres`, each also in the analysis repository, so a refusal can only come from the boundary.
  - **MB-1:** 52/52 case × pool rows answer exactly as the real URL boundary route dictates. Every reason and the PERSON refusal are reached. PERSON_X_JOB (6 cases × 2 pools) is byte-identical to the composition without the boundary, including another role of the same pool.
  - **MB-2, order:** an unknown pool gives 404 first; then the boundary is checked (DRAFT × PERSON → 409 PERSON); then the pool status (DRAFT × PERSON_X_JOB → 409 inactive); a missing or empty analysisId gives 400.
  - **MB-3:** refusals carry identities only.
  - **MB-4:** read only.
  - **MB-5:** pool equality is not checked; PERSON_X_JOB in another ACTIVE pool answers 200. This is measured, not asserted (open owner question).
- **Negative control:** on `0fb7b05` (without the guard), 38 of 52 rows deviate, all answering 200, and MB-2 deviates. Detected.
- **`matches-boundary.e2e`** (new, real Next server): byte-identical to in-process for PERSON_X_JOB, another role, PERSON, NOT_DECLARED, RUN_CONTRADICTS_DECLARATION, NOT_RECORDED and unknown. 0 Gemini attempts.

**Impact on existing callers, measured:**
- Without the PINK diffs, `pdf-path.postgres` fails (409 instead of 200 for the dangling-lineage analysis).
- Without the PINK diffs, `http-canonical-inverse.postgres` fails 2 tests (404 instead of 200 and 409, because the boundary reads PostgreSQL).
- GELB's impact assessment is confirmed.

**Adopted PINK diffs** (test files only):
- **`http-canonical-inverse`:** an analysis row and a SUCCEEDED PERSON_X_JOB job for `ANL_PINK_JOB_POOL_VALIDATION`.
- **`pdf-path`:** the dangling-lineage analysis has no recorded boundary and is now refused with 409 NOT_RECORDED. It is never compared, so no sweep state can be fabricated; the byte equality for this case is replaced by the refusal.

The `pdf-path` change holds only with `eacfc97`. On `0fb7b05` alone, that step answers 200.

**Results on `eacfc97` with the diffs:**

| Check | Result |
| --- | --- |
| PINK batch plus `matches-boundary.postgres` | 73 files (65 green + 8 skipped), 527 tests, 0 network attempts |
| `tsc` | 0 |
| Gate walk | 74/74 |
| `three-modes.e2e` plain | 91/91 |
| `url-boundary.e2e` | 1/1 |
| GRÜN workflow e2e | 10/10 |
| Full suite without e2e | 2705 passed, 27 failed (exactly the base failures, no timeouts), 0 network attempts |

**Correction during the run.** The first version of `matches-boundary.postgres` uploaded PINK's validation pool. In the shared database of the full suite this made `http-canonical-inverse` see 200 instead of 201 and a second ACTIVE upload of its pool id. The proof now uses its own pool id; the three files run together 20/20.

Evidence is in `evidence/matches-boundary-eacfc97/`: answers, real-server routes, reports, both adopted diffs, the negative control, the proof copies and the manifest.

**Status.**
- No deviation. The delta is ready for the integration together with PINK's diffs.
- Open owner question: should the server also refuse PERSON_X_JOB in another pool?
- The read-only support scripts receive 409 on environments with analyses from before the gate. :3017 and :41831 do not run this code.

### 3.43 Second integration step `6da26a7` and the SYNTX walk rebound to the invariants (2026-10-15)

**Integration.** GELB merged `eacfc97` (`20c977b`) and then PINK `122aa6c` (`73a4701`); `6da26a7` adds documents only.
- PINK rebuilt both merges; the trees are identical (`ef13ffd…`, `b4f0093…`). The code is the state PINK validated in §3.42.
- **§3.41 findings closed.** GELB corrected the leak statement (30 lines / 25 files in GRÜN's evidence confirmed; cleanup is the owner's decision). Both proof JSON files now record `gitSha` `73a4701…`, with 8/8 and 45/45 checks passing.

**`syntx-walk.e2e` (Q-12), rebound** (test file only). The rebinding follows rules in force and documented frontend changes, never merely the observed rendering:

| Step | Rule | Change |
| --- | --- | --- |
| Fixture | URL boundary and `/matches` guard | `ANL_PINK_SYNTX_WALK` gets its persisted SUCCEEDED job, declared PERSON_X_JOB for `ROLE_ID` of the validation pool; this is the same fixture as the gate walk |
| Q-01 … Q-11 | Owner GOs of the semiotic transfer and the later passes (`JOB_FIELD_FRONTEND.md` §13.2.3 ff.) | GRÜN's proposal patch `syntx-walk.semiotic-transfer.patch` (P-3) is applied unchanged: roles at FIELD as moons (no button, `tabindex -1`, proofs unchanged); `data-depth` 0–3 with the anchor at 1.12 instead of zoom; clicks by pointer after an `elementFromPoint` ownership check; the focus shell instead of the camera; organization bodies as `div` |
| Q-11 | GRÜN `c146f05` (Job Pool first) | GRÜN's edit, disclosed on 2026-10-14, adopted |
| Q-06 motion | R15b is a **proposal**, not recorded by GELB | The walk binds the closed list of P-2 as of the integration, plus `sxOrientPass` (F-5 of the 2026-10-13 sweep). Any further motion fails. The verdict is **BOUNDARY-MATCH R15b-PENDING**, not PASS |
| Version two and the DRAFT pool | URL boundary (`da59568`) | The analysis is PERSON_X_JOB in the first upload, so in the new version and in the DRAFT upload it is OTHER_POOL: containment without a matching read, NO_ANALYSIS, the hint naming the own pool, no `/matches` request. B-JP-CONTINUITY (new canonical entities per version) is unchanged |
| Keyboard entry | `c146f05` + field selector (P-6) | `focus=CAPABILITY` without a job opens the Job Field. Enter on its active strip button keeps the focus there, which is what B-SYNTX-FOCUS demands |

**Result on `6da26a7`:**
- 3/3, twice, with 0 non-GET requests on the read-only pages.
- Verdicts:
  - every scenario PASS except Q-06 (BOUNDARY-MATCH R15b-PENDING) and Q-04-sweep (BOUNDARY-MATCH B-JP-GEMINI, unchanged);
  - Q-05: the bodies are identical after the walk;
  - Q-07, Q-10: every sign and proof resolve against the bodies.
- **Before** the rebinding the walk was 0/3, on both `0fb7b05` and `6da26a7`. With the fixture alone it was still 0/3, failing at the DOM contract.
- After the last run only one unreachable dead line (`else if (false)`) was removed from the file.

**Observation O-SX-INACTIVE-NAMING** (for GRÜN, informational):
- The field state INACTIVE_POOL ("POOL IS NOT ACTIVE") comes only from a 409 of the matches read.
- Under the URL boundary the matches read happens only in the analysis's own pool, which is ACTIVE. With consistent data, the field therefore never names a DRAFT pool as inactive; it shows OTHER_POOL.
- The server still refuses DRAFT × PERSON_X_JOB (MB-2).

The walk holds only with the integration. On the PINK branch alone it needs the integrated application.

The GET-only support walk `support/syntx-readonly-walk.mjs` (P-4) is not rebound. It needs an owner-shaped environment with persisted jobs, and :3017 / :41831 do not run this code.

Evidence is in `evidence/syntx-walk-6da26a7/`: the Q-12 report, signs, audits, ecology frames, the run log and the manifest; screenshots were not committed.

**Follow-up after GELB's third step `a3c3759`.** GELB merged `916e884`; `syntx-walk.e2e` there is byte-identical to `916e884`.
- `pdf-path.postgres` is taken from the integration byte for byte. That is GRÜN's earlier `841baab` edit (the pool upload and `jobScope` in the ANALYZE body), validated green in every integration run of §3.41–§3.42. PINK branch and integration now agree on that file.
- Still pending: GRÜN's `live-browser-workflow.e2e` edit (`cb3d33f`). As agreed, it is adopted before the next owner-ordered live run, because it cannot be run without live Gemini.

**Status.**
- The SYNTX walk is green on the integration.
- Open for GELB/owner: recording R15b (and R10a–R10d).
- O-B2-OPEN-READ is unchanged.
- The open owner question on `/matches` pool equality is unchanged.

### 3.44 Demo UI fix: GRÜN `frontend/demo-ui-fix` `d9c7fea` + `0b5a8ea`; PINK suite isolation (2026-10-15)

**Request.** GRÜN asked PINK to validate the owner order "SFE — GRÜN | DEMO UI FIX + SEMIONTIC REFINEMENT"; PINK knows the order only from GRÜN.
- **Requirement 1:** GEMINI OUTPUT closes at any time, by HIDE and by Escape, also without an analysis; afterwards the field works, and the pool and the mode are kept.
- **Requirement 2:** the NO ANALYSIS message is larger and legible, with a calm nerve signal: no blinking, no layout movement, stable text, reduced motion respected.

**Scope.**
- `0b5a8ea` adds one guard: the document Escape stays silent while a modal layer is mounted (GELB's review).
- The base is `5434c01`. There is no file overlap with integration `bbd643f`.
- Probe `d2c641b` = `bbd643f` + `0b5a8ea`.

**New PINK proof `demo-ui-fix.e2e`:** real Next server, engineering build, 1600×1000 and 1280×720, disposable database. Result **62/62**, with 0 non-GET requests and 0 Gemini attempts.

- **U-1 GEMINI OUTPUT without an analysis.** It closes by HIDE (which owns the pointer), by Escape on its control, and by Escape on the bare document. The field then observes again (organization); the pool and the mode are unchanged.
- **U-2 at a ROLE with the pools list open.**
  - HIDE owns the pointer; the list opens below the orientation glass (list top 409 px ≥ glass bottom 393 px).
  - SELECT of another pool moves the focus to the field root and keeps `investigationMode`.
  - Escape then closes GEMINI OUTPUT.
- **U-3 Escape scope.**
  - A focus on the strip outside the field keeps its own Escape.
  - The bare document's Escape returns one level.
  - In the Capability Field the Job Field is unmounted, so the URL does not change.
  - With the onboarding overlay open and focus on the bare document, the field stays still (`0b5a8ea`).
- **U-4 NO ANALYSIS.**
  - The state line is the signal (`data-sx-signal="awaiting-analysis"`), and its text is the copy unchanged. The field statement carries the same copy.
  - Type size is 10 / 11.5 px instead of 8.5 px.
  - Motion is only `sxSignalCore` on the indicator and `sxSignalAura` on the aura: opacity and transform only, 4.8 s, opacity never below .38 (no blinking).
  - Over 60 frames in 6 s, the boxes of the chip, the statement and the text are identical, and the text opacity is constant.
  - The field statement has no motion. REDUCED is static; AVAILABLE has no signal.
  - Every infinite motion at NO_ANALYSIS is in the closed R15b list, or is one of the two **proposed** names.
- **Negative controls on `bbd643f`** (without the fix):
  - Escape on the bare document does nothing.
  - At the ROLE the pools list intercepts the click on HIDE GEMINI OUTPUT, and the run stops there.
  - The NO ANALYSIS part shows 7 deviations: no signal, no motion, 8.5 px type.
  - Detected.

**Regression on `d2c641b`:**

| Check | Result |
| --- | --- |
| `tsc` | 0 |
| Gate walk | 74/74 |
| `three-modes.e2e` | plain 91/91 (the first run collected all 91 checks and then hit a harness timeout under parallel load; alone: 1/1), inspector 97/97 |
| `url-boundary.e2e` | 1/1 |
| `syntx-walk.e2e` | 3/3, Q-06 still BOUNDARY-MATCH R15b-PENDING |
| GRÜN workflow e2e | 10/10 |
| Full suite without e2e | the 27 base failures (identical set) plus 4 load timeouts. The same files alone with a 30 s timeout: 32/32; their code is unchanged. 0 network attempts |

**F-PINK-ORDER (PINK's own suite; corrects the attribution in §3.42).**
- `http-canonical-inverse.postgres` assumed it is the first to upload the validation pool into the shared database: 201, and exactly one ACTIVE upload of its pool id.
- `pdf-path` (in the integration) and the job-scope proof copies upload the same pool.
- With the file order pinned: `pdf-path` first gives 10 failures; `http-canonical-inverse` first gives 15/15.
- The §3.42 correction removed only one of these uploaders. The others remain, so the outcome depended on scheduling.
- **Fix (test only):** `http-canonical-inverse` uploads its own pool id (every item re-pointed, item ids unchanged) and its own DRAFT variant. Result: 15/15 in both orders, and 13/13 on the PINK branch alone.

**Observations (informational, for GRÜN):**
- **O-UI-OVERLAY-FOCUS.**
  - With the onboarding overlay open, the focus-follow effect (F-SX-1) already sits on the observed organization beneath the overlay at page load.
  - An Escape meant for the overlay therefore moves the field back one level, while the overlay stays.
  - This existed before the fix; the field's own handler acts, not the new document fallback.
- **O-SX-AMBIENT-LIST.** `SYNTX_AMBIENT_NAMES` is called a closed list but is enforced nowhere. It lacks seven infinite names of the CSS: `sxGiant*` ×4 and `sxPanelCurrent` (already before), plus the new `sxSignalCore` / `sxSignalAura`.

**Status.**
- No deviation in `d9c7fea` / `0b5a8ea`. Both owner requirements are measured and met.
- `sxSignalCore` / `sxSignalAura` are listed as proposed. They become binding with R15b after the owner's visual acceptance.
- Left open by GRÜN, not measured here:
  - the Capability Field inspector card at 1280×720;
  - `syntx-investigation-statement` at +44 px.
- Evidence is in `evidence/demo-ui-fix-0b5a8ea/`.

### 3.45 Role orbit refinement: GRÜN `frontend/role-orbit` `6d386cc` (2026-10-18)

**Request.** GRÜN asked PINK to validate the owner order "SFE — GRÜN | ROLE ORBIT REFINEMENT"; PINK knows the order only from GRÜN. STOP before integration.
- The organization cosmos draws its role orbit closer to the organization: `compactRoleOrbit` scales every orbit and satellite of the shared L1 packing about the centre, target 0.78 per axis, horizontal first.
- A factor pair holds only if, in every phase (5° grid), every card keeps 16 px air beyond the centre body (87 + 5 + 16 = 108 px), neighbours on one orbit 12 px horizontal / 20 px vertical, and neighbouring orbits stay as far apart as in the packing.
- Unchanged: card size, title, order, phases, periods, tethers, ids, navigation, motion, the shared `buildCapabilityCosmosLayout` (Capability Field).
- Additive: `data-orbit-compactness-x` / `-y` on `syntx-cosmos-organization`.

**Scope.**
- One commit on `frontend/demo-ui-fix` `0b5a8ea` (not integrated). Code delta: `lib/career/job-pool/syntx-manifestation-layout.ts`, two lines in `SyntxField.tsx`; `lib/career/view-model/` and the Capability Field views are not in the diff, and `syntxCosmosLayout` has one caller (the organization cosmos).
- Probe `4b5774c` = integration `7c2971c` + `frontend/role-orbit` (merge without conflict).
- Negative control `8af6d7c` = `7c2971c` + `0b5a8ea` (without the delta).

Both new proofs need the delta (`syntxCosmosPacking`, the attributes) and are therefore kept as `.txt` copies in the evidence until the integration, like `demo-ui-fix.e2e`.

**New PINK proof `role-orbit-geometry`** (in-process, public layout functions only; constants restated from the mandate, no helper of the implementation reused). 4488 layouts: 3 title sets (GRÜN's real titles, short titles, one long title) × 11 widths × 8 heights × 17 role counts (1 … 14, 16, 20, 24, 53); 2450 of them drawn in. Every card with its own size, every degree, every pair on an orbit, every orbit pair over 2° × 2°.

| Check | Result |
| --- | --- |
| O-1 identity: cards, titles, sizes, order, phases, orbits, periods, centre, box, static flag; radii = packing × factors; rest points on the drawn orbit | holds for all 4488 |
| O-2 bounds: factors in [0.78, 1]; static grid and "no room" exactly as packed | holds |
| O-3 centre body, every degree | holds; worst −0.95 px below the 16 px (between two 5° checks) |
| O-4 one orbit, every degree, 12 px / 20 px | **deviation:** 209 drawn-in layouts more than 1 px below the mandated air, worst −7.65 px (8 long titles at 1366 × 960: 4.0 px horizontal / 12.3 px vertical gap); always neighbours (step 1); 0 with the real title set; no overlap |
| O-5 across orbits (21 drawn-in layouts with more than one orbit) | holds, 0 violations |
| O-6 target: 1–5 real roles at 1600 × 740, 1280 × 700, 1920 × 820 → 0.78 / 0.78; horizontal first | holds |
| O-7 the shared L1 packing called directly = `syntxCosmosPacking` for fitting items | holds |

**New PINK proof `role-orbit.e2e`** (real Next server, disposable database, no worker, `GEMINI_API_KEY` empty, net sentinel). PINK's own pool `pool_pink_role_orbit_v1` (organizations of 1, 2, 3, 5, 8, 14 roles with real-length titles; 6 and 8 long titles; 12 short titles), 1600 × 1000 and 1280 × 720. Every measurement is taken from the rendered DOM; the packing is restated in-process (the negative control renders exactly this restatement in all 18 cases).

- **O-1 contract.** Attributes present with two decimals; every role card present by `data-testid`, its title as the accessible name, tabbable; drawn ellipses = packing radii × factors.
- **O-2 cards.** Rendered width = packing width; rendered height never below the estimate; **excess up to 11.25 px** (real and short titles). Each card on its drawn ellipse in two LIVE frames 1 s apart and moving; every tether ends at its card's centre.
- **O-3 air** (rendered sizes, rendered disc, every degree). Centre body holds in every drawn-in case. **Deviation, one orbit:** 1600 long ×8 −5.98 px (packed +29.03), 1280 long ×8 −5.92 (packed −3.79; drawn in to 0.99 / 0.99), 1280 short ×12 −9.83 (packed +19.48). No two rendered cards overlap in any degree (smallest gap 8.22 px). Across orbits: no drawn-in case with more than one orbit at these viewports.
- **O-4 navigation.** A role card selects its role (`jobRoleId`), Escape returns to the organization; REDUCED holds still with the same factors. At 1280 the target card was covered for 24 s before it owned its centre point (O-JF-PANEL; measured, not a deviation).
- **O-5 O-JF-PANEL** (degrees in which a card crosses the orientation surface, packed → drawn): 1600 one role 34 → 17, five roles 159 → 65, eight roles 249 → 99; 1280 five roles 222 → 152, eight roles 351 → 291; 14 roles unchanged. Reduced, not removed (as GRÜN states).
- Factors measured as GRÜN reports: 1–5 roles 0.78 / 0.78 at both viewports, 8 roles 0.78 / 0.78 at 1600 and 0.79 / 0.95 at 1280, 14 roles 1.00 / 1.00.
- **Result 162/165**; the three deviations are those of O-3. 0 page errors, 0 non-GET requests, 0 Gemini attempts (one Next version check against the npm registry from `next dev`, as in every e2e).
- **Negative control on `8af6d7c`:** attributes absent and ellipses = packing in all 18 cases (36 deviations): detected. Motion: no CSS animation inside the organization cosmos in either run (only hover transitions).

**Cause of the O-3 deviations (two parts).**
1. **Check grid.** `orbitAir` measures the air between neighbours on one orbit at 72 phases (5°). A card on an orbit of 400–600 px radius moves 35–50 px between two checked phases; the air between neighbours has its minimum between two grid points, so the factor passes at 5° and loses up to 7.65 px at 1°. (Across orbits the check uses 15° × 15°; at 2° × 2° PINK found no violation.)
2. **Card height.** The 20 px vertical air is computed with the packing's estimated card height. Rendered cards are up to 11.25 px taller (the code comment says the 20 px is meant to cover one extra text line). With rendered sizes the vertical gap between neighbours falls to 10.2 px in 1280 short ×12.

GRÜN's unit test reads every 1° but only with the real title set; PINK found no deviation with that set either.

**Pre-existing observation (packing, not this delta), O-RO-PACK-14.** At 1280 × 720 the organization of 14 real-length roles stays as packed (1.00 / 1.00). Its rendered cards overlap by up to 62.7 px on one orbit and come within 3 px of the 16 px air to the centre body; at 1600 × 1000 they come 16.3 px within the 16 px air, so they touch the disc's outer ring. Identical on `8af6d7c`.

**Regression on `4b5774c`:**

| Check | Result |
| --- | --- |
| `tsc` | 0 (including both new proofs) |
| GRÜN unit tests | `syntx-role-orbit` 5/5, `syntx-field-ssr` 10/10 (SSR 0.78 / 0.79, ellipse 385.71 × 146.94) |
| Gate walk | 74/74 |
| `three-modes.e2e` | plain 91/91, inspector 97/97 |
| `url-boundary.e2e` | 1/1 |
| `syntx-walk.e2e` | 3/3, Q-06 still BOUNDARY-MATCH R15b-PENDING; no fixed card position or orbit radius in PINK's suites |
| GRÜN workflow e2e | 10/10 |
| `demo-ui-fix.e2e` | 62/62 (the runner's exit 1 came from the teardown: a superuser backend on the disposable database; PINK dropped it afterwards through `dropDisposableTestDatabase`) |
| Full suite without e2e | the 27 base failures (identical set) plus 4 earlier and 17 new 5 s load timeouts in 10 files (outcome-valence, decision-core, g2-g3, worker-config). 0 network attempts. Alone with 30 s: 9/10 files green (93/95). The 10th, `career-worker-config-validation`, fails alone with "relation career_analysis_jobs does not exist" (it relies on another file's schema), identically on `8af6d7c`; the delta is not in its imports |

GELB's own probe (7c2971c + 6d386cc, recorded in GELB's integration document §5 at `37834e6`) found nothing; GELB's checks do not include the per-degree air between neighbours.

**Status.**
- **Deviation D-RO-1 (for GRÜN):** the mandated air between neighbours on one orbit (12 px / 20 px "in every phase") is not kept between the 5° check phases. The worst case is −7.65 px in the layout, and −9.83 px with rendered card heights. No overlap; with the real title set no case. GRÜN decides the fix, for example a finer or analytic same-orbit check, or rendered heights.
- Everything else in the mandate is measured and met.
- Integration: STOP, as GRÜN requested; not PINK's decision.
- Evidence is in `evidence/role-orbit-4b5774c/` and `evidence/role-orbit-negctl-8af6d7c/`.

### 3.46 Role orbit fix: GRÜN `frontend/role-orbit` `7a51d89` (D-RO-1) (2026-10-18)

**Request.** GRÜN asked PINK to validate the fix of D-RO-1 (§3.45) again; STOP before integration.
- **Cause 1 (check grid):** every check in `orbitAir` now runs every 0.5° (720 phases).
- **Cause 2 (card height):** every air is measured on the estimate plus `ROLE_ORBIT_CARD_HEIGHT_ALLOWANCE` = 12 px (PINK measured at most +11.25 px).
- Nothing else changed in the code: one file, `lib/career/job-pool/syntx-manifestation-layout.ts`, plus GRÜN's tests, documentation and evidence (no local paths in the delta).

**Scope.**
- Probe `c8e99d8` = integration `6f31846` + `frontend/role-orbit` `7a51d89` (merge without conflict).
- Negative control: the same sharpened proofs on `60e6fec` = `6f31846` + `6d386cc`.

**PINK's proofs, sharpened for the re-run** (copies in `evidence/role-orbit-c8e99d8/`).
- `role-orbit-geometry`:
  - Two seeded random title sets of PINK's own (3–110 characters) are added, for 7480 layouts.
  - Phases are read every 0.25°, offset by 0.1°, so never on one of the implementation's grid points. Across orbits the grid is 1° × 1°, offset by 0.3°.
  - Every check runs in two readings: on the packing's estimate, and on the drawn card (estimate + 11.25 px).
  - The tolerance is 0.5 px.
- `role-orbit.e2e`:
  - A third viewport, 1366 × 768.
  - The same 0.25° / 1° × 1° grids, with rendered card sizes and the rendered centre disc.
  - The tolerance is 0.5 px.

**Result on `c8e99d8`.**

| Check | Result |
| --- | --- |
| `role-orbit-geometry` | **10/10**. 3228 layouts drawn in. Estimate: worst air to the centre +4.62 px, between neighbours +3.62 px, least gap 17.76 px. Drawn card: centre +0.38 px, neighbours −0.21 px (within 0.5 px), least gap 14.70 px. Across orbits: 0 violations in the 14 drawn-in layouts with more than one orbit. Target 0.78 / 0.78 for 1–5 real roles kept |
| `role-orbit.e2e` | **243/243** at 1600 × 1000, 1280 × 720, 1366 × 768. 0 page errors, 0 non-GET, 0 Gemini attempts. In the cases drawn in, the closest neighbours keep the air with 0.76 px (12 short at 1366) and 0.85 px (12 short at 1280) to spare; no overlap |
| Negative control `60e6fec` (6d386cc) | `role-orbit-geometry` 5/10. Estimate: 505 of 3697 drawn-in layouts below the air between neighbours, worst −7.75 px. Drawn card: 787 below, worst −15.14 px; centre −6.86 px; 7 violations across orbits. Detected |

Factors measured in the DOM (6d386cc → 7a51d89):

| Organization | 1600 × 1000 | 1280 × 720 |
| --- | --- | --- |
| 1–5 roles | 0.78 / 0.78, unchanged | 0.78 / 0.78, unchanged |
| 8 roles | 0.78 / 0.78, unchanged | 0.79 / 0.95 → 0.84 / 1.00 |
| 8 long titles | 0.78 / 0.94 → 0.84 / 1.00 | 0.99 / 0.99 → 1.00 / 1.00 (now as packed) |
| 12 short titles | 0.78 / 0.78, unchanged | 0.78 / 0.78 → 0.78 / 0.91 |
| 14 roles | unchanged 1.00 / 1.00 | unchanged 1.00 / 1.00 |

At 1366 × 768: 1–5 roles 0.78 / 0.78; 8 roles 0.78 / 0.99; 12 short titles 0.78 / 0.87; 8 long titles 1.00 / 1.00.

Other measurements:
- O-JF-PANEL, measured in quarter degrees: still reduced, e.g. 1600 five roles 640 → 256 of 7200, 1366 five roles 825 → 520.
- In the organizations left as packed (14 roles; 8 long titles at 1280 / 1366), the air is the packing's. That is the pre-existing O-RO-PACK-14; also at 1366 the 14 roles cross the centre ring (−32.7 px) and the neighbouring orbit.
- No CSS animation inside the organization cosmos.

**Regression on `c8e99d8`:**

| Check | Result |
| --- | --- |
| `tsc` | 0 (including both proofs) |
| GRÜN unit tests | `syntx-role-orbit` 6/6, `syntx-field-ssr` 10/10 |
| Gate walk | 74/74 |
| `three-modes.e2e` | plain 91/91, inspector 97/97 |
| `url-boundary.e2e` | 1/1 |
| `syntx-walk.e2e` | 3/3, Q-06 still BOUNDARY-MATCH R15b-PENDING |
| GRÜN workflow e2e | 10/10 |
| `demo-ui-fix.e2e` | 62/62 |
| Full suite without e2e | the 27 base failures (identical set) plus 4 load timeouts in 2 files (alone with 30 s: 16/16). 0 network attempts |

GELB's own re-measurement (random titles, 0.25°; recorded in GELB's integration document §5 at `91d2242`) also finds D-RO-1 fixed.

**Observations (informational, for GRÜN):**
- **O-RO-CROSS-GRID.** The check across orbits still uses 24 × 24 phases, that is a 15° grid (GRÜN's message says "24 × 24"). PINK finds no violation at 1° × 1° with drawn heights in the 14 multi-orbit drawn-in layouts. The residual risk is not measured.
- **O-RO-COST** (GELB, confirmed). The slowest `syntxCosmosLayout` call takes 156.5 ms in Node under parallel load (6d386cc: 69.5 ms; GELB about 85 ms). It runs in a `useMemo` on every change of the field size, so a window resize computes it again.

**Status.**
- D-RO-1 is fixed: both causes measured as removed, in the layout and in the rendered DOM, at three viewports.
- No new deviation.
- Integration: STOP, as GRÜN requested. It needs the owner's word to GELB, and demo-ui-fix `0b5a8ea` beneath it needs one too.
- Evidence is in `evidence/role-orbit-c8e99d8/`.

### 3.47 Role orbit second refinement: GRÜN `frontend/role-orbit` `3be1920` (D-RO-2) and fix `e6493a7` (2026-10-19)

**Request.** The owner did not accept `7a51d89` visually; the orbit was still too large (relayed by GRÜN and GELB, not seen first-hand by PINK). GRÜN asked PINK to validate the second refinement `3be1920`, then its fix `e6493a7`; STOP before integration and the owner's renewed visual acceptance.
- **`3be1920`:**
  - There is no fixed target any more. Of all factor pairs that keep the air rules, the smallest drawn orbit wins: the least kx·ky, at a tie the narrower one, as long as the outer orbit lies (ry ≤ rx).
  - Centre and same-orbit air are solved in closed form, with every card at its own size and every pair on an orbit.
  - Across orbits it checks on a 5° grid where the packing kept the orbits apart in motion, otherwise only at rest.
- **`e6493a7` (fix of PINK's D-RO-2):**
  - Across orbits it also uses a closed form: the outer orbit must enclose the far corner of each inner card's air rectangle in every phase, refined by golden section.
  - The rule holds for every pair of orbits and every pair of card sizes. In motion the cards are never closer than the packing (its own shortfall, exact to 0.01 px, is taken off the rectangle); at rest never closer than the packing, always in addition.
- Code changes only in `lib/career/job-pool/syntx-manifestation-layout.ts`, plus GRÜN's tests, documentation and evidence.

**Scope.**
- Probe `ea125e5` = integration `cdedfef` + `3be1920`.
- Probe `f665b80` = integration `bc24e11` + `e6493a7`. `bc24e11` differs from `cdedfef` only in GELB's integration document; both merges are free of conflicts.
- Negative controls with the final proofs:
  - `3be1920` (`ea125e5`) against the fix;
  - `b46d1ff` = `cdedfef` + `7a51d89` (the 0.78 version the owner did not accept) for minimality.

**PINK's proofs, rewritten for the new rule** (copies in `evidence/role-orbit-f665b80/`).
- `role-orbit-geometry`, 56 checks over the same 7480 layouts:
  - O-2 bounds now: factors in hundredths, in (0, 1], the drawn-in outer orbit lies.
  - O-3 and O-4: centre and every pair on one orbit, read as before.
  - New O-5: across orbits at the rule's card height (estimate + 12), for every pair of orbits and every pair of card sizes, at 0.5° × 0.5°. In motion: keep the air where the packing kept it, never closer than the packing where it did not. At rest: never closer than the packing.
  - New O-6 minimality: a step of 0.01 tighter on either axis must break an air or stand the outer orbit up. A tighter step that holds on PINK's 0.25° reading is read again every 0.01°; across orbits every 0.25°.
  - New O-7: a full search of every horizontal factor on 75 layouts, with a bisection for the least vertical one. No pair that holds and lies may give a smaller kx·ky.
  - New O-8: the same cards give the same orbit area on every box that can carry the least orbit, within the hundredth grid of the factors.
  - New O-11: a sweep of tall boxes, 1280–2560 × 840–1180, 6–53 roles, five title sets (6585 moving multi-orbit layouts), with the across rule at 1° × 1°.
  - O-9 measures cost and distribution. O-10: the Capability Field is untouched.
- `role-orbit.e2e`:
  - A fourth viewport, 1600 × 1200 (level box 1600 × 940), so that a multi-orbit organization is drawn in.
  - The drawn factors must equal `syntxCosmosLayout`'s for the drawn box.
  - The drawn-in outer ellipse must lie.
  - O-COLD (measured): the first direct link with `jobOrganizationId` after a cold `next dev` start.

**Deviation D-RO-2 on `3be1920` (across orbits).**
- GRÜN's statement "no multi-orbit layout is drawn in (0 of 245)" held only up to 820 px box height. From about 840 px, for example a 1600 × 1200 viewport, two-orbit packings are drawn in. GELB withdrew the same statement in `bc24e11`.
- **By `3be1920`'s own rule:**
  - Where its own 5° reading (largest card, +12) said the packing kept the orbits apart, the drawn-in orbits break the 12 / 20 px air between the grid points.
  - That is 4 of the 22 drawn-in multi-orbit layouts in the 7480 grid, and 51 in PINK's tall-box scan.
  - Worst −6.27 px at the rule height, for example 14 real roles at 1600 × 960 (0.88 / 0.92): packed +13.03 px. Drawn card: −5.52 px.
  - No overlap.
  - In the rendered DOM (1600 × 1200, 14 real roles), the air across orbits held by only +0.09 px.
- **Per pair of card sizes** (the rule of the fix):
  - In the 7480 grid: 50 pairs break the air where the packing held, and 71 pairs come closer than the packing.
  - In the tall-box sweep: 878 multi-orbit layouts drawn in; 1206 pairs break the air where the packing held, worst −29.10 px; 1465 pairs come closer than the packing, up to 32.9 px closer (−11.5 → −44.4 px, overlapping in motion).
  - GRÜN found the second class independently; it came from the at-rest-only branch.

**Result on `f665b80` (`e6493a7`).**

| Check | Result |
| --- | --- |
| `role-orbit-geometry` | **56/56**, 3273 layouts drawn in, 8 of them with two orbits. Centre air: estimate +3.98 px, drawn card +0.27 px. Air on one orbit: estimate +5.88 px, drawn card +0.40 px; least gap 16.34 px. Across orbits: least air +0.48 px where the packing held; 0 pairs broken, 0 closer than the packing, 0 at rest. Tall-box sweep: 553 of 6585 drawn in, least air +0.01 px where the packing held; 0 / 0. Minimality: every tighter step breaks; no smaller holding orbit in the 75 searched layouts. Area spread at most +1.98 %, within the grid |
| `role-orbit.e2e` | **395/395** at 1600 × 1000, 1280 × 720, 1366 × 768 and 1600 × 1200. 0 page errors, 0 non-GET, 0 Gemini attempts (one Next version check against the npm registry). Single-orbit factors are identical to `3be1920` at all four viewports (`3be1920` on `ea125e5`: also 395/395). 14 real roles at 1600 × 1200: 0.88 / 0.94 → 0.98 / 0.89, rendered air across orbits +0.09 → +7.36 px |
| Negative control `3be1920` (`ea125e5`) | 54/56: O-5 and O-11 fail (as above). Detected |
| Negative control `7a51d89` (`b46d1ff`) | 16/56: 4822 tighter steps still hold; 56 of the 75 searched layouts have a smaller holding orbit; the across checks fail too. Detected |

Factors measured in the DOM (`e6493a7`; the factor pair, then the outer orbit's radii in px):

| Organization | 1600 × 1000 | 1280 × 720 | 1366 × 768 | 1600 × 1200 |
| --- | --- | --- | --- | --- |
| 1–3 roles | 0.38 / 0.64 (251.8 × 190.7) | 0.49 / 0.70 (246.2 × 194.6) | 0.45 / 0.70 | 0.37 / 0.49 |
| 5 roles | 0.40 / 0.67 | 0.53 / 0.72 | 0.50 / 0.70 | 0.41 / 0.49 |
| 8 roles | 0.61 / 0.74 (395.3 × 220.5) | 0.85 / 0.76 (414.8 × 211.3) | 0.73 / 0.81 | 0.63 / 0.54 |
| 6 / 8 long titles | 0.74 / 0.65, 0.93 / 0.88 | 0.75 / 0.89, as packed | 0.76 / 0.87, as packed | 0.70 / 0.51, 0.91 / 0.67 |
| 12 short titles | 0.54 / 0.93 | 0.71 / 0.98 | 0.65 / 0.99 | 0.55 / 0.69 |
| 14 roles | as packed | as packed | as packed | 0.98 / 0.89 (two orbits) |

- These match GRÜN's measurements: Kestrel 251.8 × 190.7 at 1600 and 246.2 × 194.6 at 1280; 8 roles 395.3 × 220.5 and 414.8 × 211.3.
- O-JF-PANEL, measured in quarter degrees for five roles: 1600: 640 → 0; 1280: 888 → 227; 1366: 825 → 49; 1600 × 1200: 452 → 0, of 7200.

**Regression on `f665b80`:**

| Check | Result |
| --- | --- |
| `tsc` | 0 (including both proofs) |
| GRÜN unit tests | `syntx-role-orbit` 8/8, `syntx-field-ssr` 10/10 |
| Gate walk | 74/74 |
| `three-modes.e2e` | plain 91/91, inspector 97/97 |
| `url-boundary.e2e` | 1/1 |
| `syntx-walk.e2e` | 3/3, Q-06 still BOUNDARY-MATCH R15b-PENDING |
| GRÜN workflow e2e | 10/10 |
| `demo-ui-fix.e2e` | 62/62 |
| Full suite without e2e | the 27 base failures (identical set), plus 1 environment failure in `exchange-archive.postgres` ("must be a superuser to terminate superuser process" while it drops its own disposable database). Run alone: once the same, once 6/6. 0 network attempts |

**Observations (informational):**
- **O-RO-COLD** (GRÜN's observation). The first direct link with `jobOrganizationId` after a cold `next dev` start opened the organization on both tips (`ea125e5`, `f665b80`), and so did the second. Not reproduced; GRÜN considers it closed.
- **O-RO-GRID.** Factors are hundredths of the packing's radii, so the step grows with the box: at 2560 px width, 0.01 of kx is about 11 px. The chosen orbit is the smallest on that grid (O-6, O-7), not the continuous optimum. O-8 bounds the effect.
- **O-RO-COST.** Under parallel load: median 0.50 ms, p99 7.5 ms, slowest 22.7 ms per layout (`3be1920`: 17.5 ms; `7a51d89`: 156.5 ms). This closes PINK's earlier cost observation.
- **O-ENV-DROP.** `dropDisposableTestDatabase` can meet a superuser backend (likely autovacuum) in a just-created database. Two of PINK's own databases were left behind this way and dropped by PINK. It is the same class as the earlier `demo-ui-fix` teardown.

**Status.**
- D-RO-2 (`3be1920`) is fixed in `e6493a7`, in the layout and in the rendered DOM.
- The smallest-orbit rule holds: minimal on the hundredth grid, lying, the same area across boxes.
- Centre, same-orbit air and the Capability Field are unchanged from `3be1920`.
- No new deviation.
- Integration: STOP, as GRÜN requested. It needs the owner's renewed visual acceptance and the owner's word to GELB; demo-ui-fix `0b5a8ea` beneath it needs one too.
- Evidence is in `evidence/role-orbit-f665b80/`.

### 3.48 Role cards: GRÜN `frontend/role-cards` `ae633a1`, `frontend/role-card-footer` `6f9bc2b` and fix `4ecfe67` (D-RC-1, D-RC-2) (2026-10-19)

**Request.**
- GRÜN relayed the owner's order "SFE — GRÜN | ROLE ORBIT CARD REFINEMENT" and asked PINK to validate `ae633a1` on `frontend/role-cards`. Base: `e6493a7`, which GRÜN reports as visually accepted by the owner. PINK did not see that acceptance first-hand.
- GRÜN then relayed "SFE — GRÜN | ROLE CARDS — FOOTER READABILITY" (`6f9bc2b` on `frontend/role-card-footer`, on `ae633a1`).
- After PINK's interim findings, GRÜN committed the fix `4ecfe67` on `6f9bc2b` and named it the tip to validate.
- STOP before integration; the owner's visual acceptance follows.

**What changes (presentation in the organization cosmos only; no backend, no Gemini).**
- **`ae633a1`, the card itself:**
  - Centred, with five lines, each carrying its own attribute:
    - standing (the pool's seniority in its parts, or the class word);
    - title (in the lines the estimate counted);
    - domain (`domain_focus`, one line, drawn-in orbits only);
    - "N REQUIREMENTS";
    - NO MATCHING READ / MATCHING READ with a hollow or filled mark.
  - No "//", score or rank.
  - `roleCardBox`: on a drawn-in orbit the card is drawn exactly in the box every air is measured on (estimate + 12); where the orbit stays as packed, at the estimate.
  - New attributes `data-card-box` and `data-card-title-lines`.
- **`6f9bc2b`:**
  - The footer reads at up to 8.5 px.
  - `monoLineSize` picks the largest quarter-pixel size at which monospaced capitals (0.6 em advance plus letter spacing) fit; both footer lines take the smaller of the two.
- **`4ecfe67`:**
  - The card sets `overflow: visible`; every line limits itself.
  - `RoleCardTitle` keeps the counted lines and, after layout, reads a dense title smaller in half pixels down to 10 px. It ends in "…" only where even 10 px does not fit.
  - Tooltips carry the full title, seniority and domain.
  - The standing's hairlines give way first.
- **The layout library only gains functions** (`roleCardBox`, `roleSeniorityParts`, `ROLE_CARD_FOOTER`, `monoLineSize`). `compactRoleOrbit`, the packing and the estimate are unchanged, so the orbit is the one of `e6493a7`.

**Scope.**
- Probes:
  - `df26269` = integration `b823f68` + `ae633a1`;
  - `5100a1d` = `b823f68` + `6f9bc2b`;
  - `d685003` = `b823f68` + `4ecfe67`.
  - All three merge without conflicts. Like `f665b80` in §3.47, they carry demo-ui-fix `0b5a8ea` and the role-orbit commits beneath them.
- Negative control: `f665b80` (`e6493a7`).

**PINK's proofs** (copies as `.txt` in `evidence/role-cards-d685003/`).
- **`role-cards.e2e`:**
  - Setup: a real `next dev` server on a disposable database, no worker, `GEMINI_API_KEY` empty, PINK's net sentinel in the server, motion reduced.
  - PINK's own pool, 23 organizations: 3, 8, 14 and 32 real-length roles (32 gives the compact packing at 1280 × 720), long, short, ten "stress" titles (upper case, wide letters, a German compound, spaced dashes), and PINK's two seeded random title sets.
  - Each role has its own seniority (with and without parts, empty, " / ", lower case, very long), domain (short, empty, very long) and requirement count (0, 1, 2, 3, 7).
  - 13 runs:
    - English at 1600 × 1000, 1280 × 720, 1366 × 768 and 1600 × 1200;
    - German (switched through the System Codex) at 1600 × 1000 and 1280 × 720;
    - zoom: device scale 1.25 on 1280 × 800 (English and German) and 2 on 1600 × 1000;
    - German at 1280 × 720 with the monospaced lines in DejaVu Sans Mono, FreeMono, Fira Code and IBM Plex Mono.
  - Checks:
    - C-1 box kind, width and height against the in-process estimate (±0.5 px), and the counted title lines;
    - C-2 nothing cut (every line inside the padding box), no title cut that the base size draws in four lines or fewer;
    - C-3 every line and title row centred (±1 px);
    - C-4 texts as the pool states them, in the run's language;
    - C-5 contrast of every line over the card's own glass (text hidden; other cards, the orientation surface, the centre disc and the dev server's indicator left out), WCAG ≥ 4.5 : 1;
    - C-6 the tether lamp on the card's edge where the line from the centre meets it;
    - C-7 the lamp and its conduction stub, drawn against the same frame with every card's overflow let visible;
    - C-8 the footer whole, at one size ≤ 8.5 px, 8.5 px in English;
    - C-9 (`4ecfe67`) titles at 10 … 11.5 px, "…" only at 10 px, and the tooltips.
- **`role-cards-ssr`:**
  - Server-rendered with PINK's own pool body and a presentation matching delivered for two of four roles.
  - Checks: standing (`Senior / L4` → `SENIOR · L4`, `""` and `" / "` → `ROLE`); the title with the dash bound; the domain; `1 REQUIREMENT` / `N REQUIREMENTS`; MATCHING READ with a filled mark exactly for the matched roles; no score, rank or "//".
- `role-orbit-geometry` and `role-orbit.e2e` from §3.47, unchanged.

**Deviation D-RC-1 (the tether lamp and its stub are clipped) — older than `ae633a1`.**
- **On `ae633a1`:** the card's `overflow: hidden` cut off the outer half of the lamp and the whole 16 px stub towards the centre. 308 of 318 cards; crops in `ae633a1-df26269/lamp-*.png`.
- **Correction:** PINK's interim message to GRÜN said the lamp was whole on `e6493a7`. That was wrong.
  - `app/globals.css` gives every `button` `overflow: hidden`, and every role card is a button.
  - PINK's first reading of `e6493a7` opened the overflow only on cards with `data-card-box`, which `e6493a7` does not have.
  - With the corrected reading: `e6493a7` clips 733 of 764.
- **Fixed in `4ecfe67`:** 0 of 764.

**Deviation D-RC-2 (dense titles cut) — new with `ae633a1`.**
- The title was clamped to the lines the estimate counted. Where the estimate counts too few (upper case, dense word sequences), the title ended in "…" although it fits in four lines. `e6493a7` showed it in full (clamp 4, the card grew).
- Example: "QA LEAD – EMEA OPERATIONS MANAGEMENT" at 197 px: counted 2, needs 3, drawn "QA LEAD – / EMEA OPERATIONS…".
- On `df26269`: 4 titles, 18 renderings.
- On `e6493a7`: none.
- None with the real title set.
- **Fixed in `4ecfe67`:**
  - All 52 renderings (9 titles) that need more lines than counted stand whole, at 10.5 or 11 px.
  - "…" appears only on the compact form at 10 px (54 renderings), as before on `e6493a7`, with the full title as tooltip.

**Observation O-RC-ELLIPSIS (`ae633a1`).**
- One-line texts ended in "…" with no way to read them in full:
  - "SENIOR · L4" on 128–129 px cards;
  - "Security & Compliance" on 128 px cards;
  - PINK's very long seniority and domain everywhere.
- **On `4ecfe67`:**
  - "SENIOR · L4" fits.
  - The ellipses left are PINK's extreme strings and "Security & Compliance" at 128 px.
  - Each carries its full text as tooltip (C-9).

**Result on `d685003` (`4ecfe67`).**

| Check | Result |
| --- | --- |
| `role-cards.e2e` | **2697/2697** over the 13 runs (2483 cards); 0 page errors, 0 non-GET, 0 Gemini attempts (one Next version check against the npm registry) |
| Card box (C-1) | exact: orbit cards estimate + 12, packed cards the estimate, compact cards their own form; title lines as counted |
| Nothing cut (C-2, C-7) | least room of a line to the padding box 7.61 px. Lamps clipped 0 of 764. No title cut that fits. Least room to the content box 0.61 px (`org_rc_3`, matching line); the card no longer clips there |
| Centring (C-3) | ±1 px |
| Contrast (C-5) | least over every card: standing 7.75, title 13.96, domain 8.56, requirements 13.4, matching 9.54 : 1 (GRÜN measured 10.2, 17.9, 9.6, 15.3, 10.7 on its lab) |
| Footer (C-8) | English 8.5 px everywhere, compact included. German: 7.75 px (91), 8 px (14), 8.25 px (30), 8.5 px (1010), compact 8.5 px (192). Whole on every card with the app's font, at device scale 1.25 and 2 |
| Titles (C-9) | 11.5 px 2143, 11 px 259, 10.5 px 27, 10 px 54 (compact form). Tooltips for title, seniority and domain present and exact |
| `role-cards-ssr` | 1/1. On `e6493a7` it fails (no line attributes): detected |
| GRÜN unit tests | `syntx-role-orbit` 11/11, `syntx-field-ssr` 11/11 |
| `role-orbit-geometry` | 56/56. Run on `5100a1d`, whose layout library equals `d685003`'s |
| `role-orbit.e2e` | 395/395 on `d685003` (also on `df26269`) |
| Negative control `e6493a7` (`f665b80`) | 969/2186: C-1 (no card box), C-4 (old texts, "//"), C-6 (lamp off the edge: the anchor used the estimate while the card grew), C-7 (733 of 764 clipped). No title cut. Detected |
| `6f9bc2b` (`5100a1d`, before C-9) | 2340/2490: D-RC-1 (C-7 in 92 organization readings), D-RC-2 (52 renderings), footer whole with the app's font; the four C-5 failures were the centre disc and the dev indicator (see below) |

**Regression on `d685003`:**

| Check | Result |
| --- | --- |
| `tsc` | 0 (with all four PINK proofs) |
| Gate walk | 74/74 |
| `three-modes.e2e` | plain 91/91, inspector 97/97 |
| `url-boundary.e2e` | 1/1 |
| `syntx-walk.e2e` | 3/3; Q-04-sweep and Q-06 still BOUNDARY-MATCH (R15b pending) |
| GRÜN workflow e2e | 10/10 |
| `demo-ui-fix.e2e` | 62/62 |
| Full suite without e2e | exactly the 27 base failures (identical set); the O-ENV-DROP failure of §3.47 did not recur; 0 network attempts |

**Observations (informational):**
- **O-RC-MONO.** `--font-mono` is defined nowhere, so the monospaced lines use a locally installed JetBrains Mono, else the system's monospace.
  - `monoLineSize` assumes a 0.6 em advance.
  - Fira Code (0.615 em) cuts "KEIN MATCHING GELESEN" by 2 px on the two 129 px German cards (110 px in 108).
  - DejaVu Sans Mono, FreeMono and IBM Plex Mono hold.
  - GRÜN offers a reserve of 0.62 em as a small follow-up commit (German 128 px: 7.75 → 7.5 px; 133 px: 8.25 → 8 px; English unchanged), if the owner wants it. Setting `--font-mono` would be a global font decision.
- **O-RC-DISC.** In the compact packing (32 roles at 1280 × 720) two cards lie under the centre disc (crops `compact-under-disc-*.png`). This predates `ae633a1`: on `e6493a7` the compact cards drew up to 148.6 px high, now at most 88 px. The packed 14 roles at 1280 × 720 also no longer grow (131.3 → 88 px).
- **O-RC-DEVTOOLS.** In `next dev` the Next indicator (`nextjs-portal`) lies over a corner of the field. It is no part of the field and is hidden for the contrast reading.
- **PINK process.**
  - The first geometry run on this tip went without the proof's `--testTimeout/--hookTimeout`. It produced 43 timeouts, not findings, and was rerun with them.
  - PINK's interim statement about `e6493a7` (D-RC-1) was corrected to GRÜN the same day.

**Status.**
- D-RC-2 (new with `ae633a1`) and the older D-RC-1 are fixed in `4ecfe67`.
- The orbit, its air and motion are unchanged from `e6493a7` (geometry 56/56, `role-orbit.e2e` 395/395).
- No new deviation.
- Integration: STOP, as GRÜN requested. The stack `0b5a8ea` … `e6493a7` → `ae633a1` → `6f9bc2b` → `4ecfe67` needs the owner's visual acceptance and the owner's word to GELB.
- Evidence is in `evidence/role-cards-d685003/`. The earlier readings are in `ae633a1-df26269/` and `6f9bc2b-5100a1d/` (earlier proof versions).

### 3.49 Integration of the GRÜN stack `5293eb1` and the live-Gemini relay of the video lab `e023d55` → `d29cc00` (R-UTF8, R-AUTH) (2026-10-19)

**Request.**
- GELB reported the integration of the GRÜN stack on `integration/job-field-governance`, under an owner GO to GELB of 2026-10-19 that PINK did not see first-hand.
- The merges, in stack order: `7e9f2c8` (demo-ui-fix `0b5a8ea`), `63f4dd8` (role-orbit `e6493a7`), `17181d5` (role-cards `ae633a1`), `5293eb1` (role-card-footer `6f9bc2b` + fix `4ecfe67`). VIDEO FREEZE applies from `5293eb1`.
- GELB asked PINK for three things:
  - tree equality of `5293eb1` with `27f3253` + `4ecfe67`;
  - PINK's role-orbit, role-cards and demo-ui-fix proofs on the integrated tree;
  - a review of the live-Gemini wiring of the video lab in `e023d55` (`video-gemini-relay.ts`, the gate in `video-lab.ts`), without any real Gemini call.
- After PINK's interim findings, GELB fixed the relay in `d29cc00` and added the live-run tools in `fe5cbea`. GELB then asked for this record.

**Tree.** Recomputed by PINK in a scratch worktree (`merge --no-commit` + `write-tree`); see `tree-equality.txt`.
- `27f3253` + `4ecfe67` gives `193ba70`, which is the tree of `5293eb1`.
- Each step is tree-identical to PINK's own merge: `7e9f2c8` (`a5c6fac`), `63f4dd8` (`7dd32da`), `17181d5` (`264969f`). The first parent of `7e9f2c8` is `27f3253`.
- Only files under `docs/` change in `b823f68..27f3253` and in `5293eb1..fe5cbea`. The app code of `5293eb1`, `d29cc00` and `fe5cbea` is therefore the code of probe `d685003` (§3.48).

**Proofs on `5293eb1`.**
- Run detached in PINK's own worktree, on disposable databases, with `GEMINI_API_KEY` unset and PINK's net sentinel in the server.
- The proofs are byte-identical to the evidence of §3.48 (`role-cards-d685003`), §3.47 (`role-orbit-f665b80`) and §3.44 (`demo-ui-fix-0b5a8ea`).

| Check | Result |
| --- | --- |
| `tsc` | 0 (with all PINK proofs) |
| `role-cards.e2e` (footer and fit checks on) | **2697/2697**; the `measured` block equals `d685003`'s exactly |
| `role-cards-ssr` + GRÜN units (`syntx-role-orbit`, `syntx-field-ssr`) | 23/23 |
| `role-orbit-geometry` | 56/56 |
| `role-orbit.e2e` | 395/395 |
| `demo-ui-fix.e2e` | 62/62 |
| Gate walk | 74/74 |
| Page errors / non-GET | 0 / 0. The only outbound attempt was Next's npm version check, refused by the sentinel |

**Review of the live-Gemini wiring.**
- Everything ran offline: against a loopback double, with fake keys and fake env files, and under PINK's net sentinel (0 outbound attempts). There was no Gemini call and no real key.
- **The relay-start gate in `video-lab.ts`** (`lab-gate.txt`): 9 of 9 false starts exit with code 2 before anything is created (no lab directory, no database). The cases:
  - a wrong mode;
  - GO missing, and GO with the wrong value;
  - no env file;
  - a key that is too short;
  - model `../x`;
  - budget 13 and budget 0;
  - `VIDEO_LAB_GEMINI_MODEL` `a/b`.
  - `d29cc00` leaves the gate unchanged.
- **The relay on `e023d55`:** GELB's `relay-check.mts` passes 12/12. Its routing is sound: the key is swapped, other models, `countTokens` and `models.get` get 403, the budget gives 429, and the log holds neither key nor content.
  - `?key=` and `?alt=sse` are dropped.
  - `streamGenerateContent` and `/v1/` get 403.
  - Refusals cost no budget.
- **Finding R-UTF8 (defect, small; `e023d55`).**
  - Cause: the body was assembled with `raw += String(chunk)`, so a multibyte UTF-8 character on a transport-chunk boundary became U+FFFD and was sent to Gemini that way.
  - Damaged bodies over loopback, 10 per size: 9, 19, 40, 64 and 80 KB 0/10; 120 KB 1/10. One body of 456 KB carried 5 × U+FFFD.
  - The walk's own bodies (9–19 KB) were not affected.
  - The stand-in has the same pattern; GELB left it unchanged on purpose so that the verified takes stay valid.
- **Finding R-AUTH (hardening; `e023d55`).**
  - The relay did not check its caller, so any local process on the loopback port could have the real key spent for it while the lab ran (without a key: 200; with a foreign key: 200).
  - The budget of at most 12 limited the damage.
- **Note R-KIND.** The relay records kind and scope block but does not enforce them; LEGACY and OTHER are forwarded. The scope check stays with the app gate alone. GELB records this in the video document §8; no code was changed for it.
- **Fixed in `d29cc00`:**
  - The relay forwards the buffered body byte for byte, and `requestBytes` comes from the buffer.
  - Each lab gets a random worker placeholder; any other caller gets 401, which is not counted and not forwarded.
  - A placeholder that is too short or equal to the key is refused at start.
- **PINK's probe on `d29cc00`: 8/8.**
  - 40 bodies of 120 KB – 1 MB with ü, „“, 能力 and 😀 arrive byte-identical, without U+FFFD.
  - No key, the old dummy, the real key, a truncated and an upper-cased placeholder each get 401; nothing is forwarded and no budget is spent.
  - The key is checked before the method.
  - The placeholder is forwarded with the real key.
  - Start refusals: 3/3.
  - Neither key, placeholder nor content appears in the log.
  - GELB's `relay-check.mts` on `d29cc00`: 16/16.
- **Negative control:** the same probe against the relay of `e023d55` gives 2/8 (24 of 40 bodies damaged, every caller forwarded). Detected.
- **`fe5cbea` (tools only; no finding that holds up the run):**
  - `live-extract.mjs` states the rule "out dir outside the repository" but does not check it. Its `mkdir` mode 0700 applies only to a newly created directory.
  - `live-summarize.mjs` carries `investigation`, `coverageAudit` and `excluded` as raw objects. They hold no secrets but may hold free model text, so GELB checks the summary before committing it.
  - Extract before stopping, because the stop drops the database.
  - GELB adopted all three points (handoff §7).

**Process note.**
- PINK's first probe on `d29cc00` showed 5/8. The cause was PINK's own case "placeholder padded with a blank": HTTP strips leading and trailing blanks from header values, so the case is not a distinct key.
- PINK replaced it with an upper-cased placeholder; the result is 8/8. The relay was not at fault.

**Status.**
- The integrated stack `5293eb1` is validated, with no deviation. The relay fixes R-UTF8 and R-AUTH are validated in `d29cc00`.
- PINK made no Gemini call. The single live end-to-end run is GELB's, under the owner's separate GO. GELB reports that the run is on hold until the owner confirms the GO after the "ANTIGRAVITY VIDEO HANDOFF" order.
- PINK did not check the handoff document `docs/CONDYN_ANTIGRAVITY_VIDEO_HANDOFF_2026-10-19.md`.
- Evidence is in `evidence/integration-5293eb1/`. The proofs are kept as `.txt` there and under §3.44, §3.47 and §3.48. The relay probes are `pink-relay-*.mts.txt`, offline and loopback only.

### 3.50 Antigravity video handoff `60d2a3b` and the one live-Gemini run `104410d` (evidence `de21f2b`) (2026-10-19)

**Request.**
- GELB asked PINK to check `docs/CONDYN_ANTIGRAVITY_VIDEO_HANDOFF_2026-10-19.md` (`60d2a3b`, owner order "SFE — GELB | ANTIGRAVITY VIDEO HANDOFF") independently, without Gemini. The focus points:
  - §4: selectors, wait conditions and the "actual" states;
  - §5/§6: missing or misnamed states and error codes;
  - §7: whether the abort criteria are enough, in particular "never RETRY in live mode";
  - §10: whether anything is shown as passed that did not run.
- GELB then amended the handoff and ran the one live-Gemini run (`de21f2b`), under the owner's "HUMAN AUTHORITY — LIVE GEMINI GO", which PINK did not see first-hand. GELB asked PINK to record the review here and, optionally, to check the committed live evidence against the handoff without Gemini.

**Method.**
- PINK's own fresh stand-in lab from `fe5cbea`: GELB's `video-lab.ts` unchanged, port 41871, disposable databases, PINK's own PID, stopped after each run.
- PINK's own probe (`pink-handoff-probe.mjs.txt`), not GELB's `handoff-probe-walk.mjs`. It uses only the handoff's selectors and wait conditions, tries a pointer click first and records a DOM click only as fallback.
- Two runs. The second fixes artefacts of PINK's own probe: a truncated text, a too-broad role selector and a guessed test id.
- A code cross-check on `fe5cbea` (`code-crosscheck-fe5cbea.txt`; the retry, cascade, lease and error-title paths read by PINK).
- No Gemini call by PINK.

**§4 on the stand-in (run 2): 79 hold, 4 differ, 15 informational.**
- Confirmed:
  - Escape does not close the onboarding and does not leave the Capability deep focus; it does close B2.
  - 12 proposals, all PROPOSED; the TypeScript quote verbatim; G-4 on three nodes; zoom 1 → 0.
  - The inspector: AVAILABLE / RETAINED / `sha256 ✓` / `parser = text ✓` / STOP, `video-standin-001 · video-…`, `data-run-reused=false`, `data-analysis-id` ANL_….
  - UNSCOPED; one REJECTED claim (Quantum Annealing); upload CREATED with its text; 3 organizations; "PERSON · NO JOB COMPARISON".
  - B2 409 `ERR_JOB_COMPARISON_NOT_SCOPED` and `/matches` 409 `ERR_JOB_POOL_MATCHES_PERSON_ANALYSIS`.
  - Gate AWAITING_JOB → OPEN and the indicator text; 6 SUPPORTED / 1 WEAK / 2 OPEN; B2 7/2, scored false, bound to the PERSON × JOB analysis.
  - Scope RETAINED naming `role_kestrel_fullstack`; JOB / JOB_MODE / NONE; 10 requirements and 8 findings; NO_GEMINI.
  - Deep link 35 as 29; 36 NOT_SCOPED with the stated sentence.
  - No page error; no non-GET besides ANALYZE and the pool upload.
- Differences, all minor:
  - Step 26: the dock does not name the role. Its text is only "INVESTIGATION BOUNDARY · PERSON × JOB" and its tooltip is generic.
  - Step 33: "JOB_STRUCTURE_V1" is neither visible nor in the DOM. The heading is "JOB · STRUCTURE".
  - Step 6: the telemetry step "ANALYZING SOURCES..." was never seen (150 ms sampling, both runs).
  - Coordinates: between PINK's two fresh runs, the pool file input and the Kestrel body stood 61 px higher once (y 301 vs 362, 109 vs 170).
  - The visible upload button `add-pdf-source-btn` was not named.
  - All 9 role cards are in the DOM and reported visible.
  - Pointer clicks on the moving nodes (3 of 3) and on the role card did not land within 5 s; only the DOM click did (P-3).
  - READ was not seen to slide in.
- **§5/§6:** several reachable states were missing, and one value was misnamed. The upload's "already there" value is `IDENTICAL_EXISTS`, and rejections and failures appear in their own elements.
  - Important: "PROVIDER TRUNCATION" (503) and "SEMANTIC BOUNDARY VIOLATION" (422) come only from the POST's HTTP status. Worker failures carry none, so a real Gemini failure shows "ANALYSIS FAILED" with `EXECUTION_FAILED` (or the error's own code).
  - G-7's "this job made no Gemini call" holds for Discovery only; the legacy analysis calls Gemini on every new job.
- **§7:** "never RETRY" is right, since RETRY is a new submission. It is not the only path to new Gemini calls:
  - the worker retries non-terminal failures up to 3 attempts before the banner appears;
  - the legacy step has a model cascade and regenerates on MAX_TOKENS;
  - a RUNNING job with an expired lease is claimed again.
  - PINK proposed: the relay budget as the hard limit (read `relay.jsonl`, not the banner), A-9 (operator stops the lab at once on a banner, a timeout or budget 0), and no reload or worker restart in live mode.
- **§9/§10:**
  - Nothing is shown as passed that did not run.
  - The walk does not check G-1, G-3 or G-7, and in a LIVE lab it checks V-03b, V-04c and V-09b only weakly. The dry runs ran as `gemini=LIVE` with stand-in answers and still reported 30/30.
  - The read-out chain row in §9 had no evidence in the repository.
- **Amended in `de21f2b`:** PINK read the handoff diff. Every point above is taken in: §4 steps 5, 6, 22, 26 and 33 plus the coordinates; the §6 states and titles; G-6 NOT_RETAINED; G-7 Discovery only; the §7 re-call paths and A-9; "what the walk does not check"; and the stand-in read-out summary, committed with the correction that it ran on `d29cc00`.
  - GELB's precision is correct: `claimNextJob` also raises `attempt_count` on a re-claim (`job-repository.ts:109`); the cap is checked only in the failure path.

**The live run, checked from the committed evidence only** (`live-check-de21f2b.txt`, `pink-live-check.mjs.txt`).
- Offline, no Gemini. The raw data stays with GELB; only `relay.jsonl` could be matched to the private SHA256SUMS.
- Result: 29/29.

| Check | Result |
| --- | --- |
| Relay | 6 calls, all forwarded 200, one model (`gemini-3.1-pro-preview`), DISCOVERY / CONVERGENCE / LEGACY twice, budget left 2. A scope block only on the PERSON × JOB discovery. Equal to the private file (SHA256SUMS) |
| Secrets | no key, worker placeholder, inspector token or local path in the committed files. Network: only Next's npm version check, refused |
| Walk | LIVE, 1920 × 1080, 30/30, analyses 113.5 s and 104.6 s. ANALYZE bodies PERSON without a job scope, then PERSON × JOB with exactly this pool and role. The same two analyses as the summary |
| G-1 / G-2 / G-3 | both discoveries: real model version, responseId not `video-…`; RETAINED, sha256 and parser = text; STOP |
| G-4 | all 38 evidence quotes (20 PERSON, 18 PERSON × JOB) stand verbatim in `cv.synthetic.pdf` (pdftotext, PINK's own reading) |
| G-5 | every claim VERIFIED, projection = verified candidates (10/10 and 8/8); nothing rejected (O-LIVE-4) |
| G-6 / G-7 | PERSON UNSCOPED; PERSON × JOB RETAINED with the role, text matches its hash; neither run reused |
| G-8 | PERSON B2 409 `ERR_JOB_COMPARISON_NOT_SCOPED`; PERSON × JOB 9 requirements, 8 covered, 1 not (Geospatial Visualisation) |
| Archive | one COMPLETED exchange per job, attempt 1, lease 1, STOP, sha ok: no worker retry |
| Summary | no free text beyond CV quotes, names and hashes |

- **O-LIVE-1 confirmed:**
  - Under the job scope all 8 proposals carry exactly the role's requirement names (PERSON run: 0 of 10), so B2 is EXACT throughout.
  - The validator checks the quote, not the name. Example: "Event-Driven Architecture" (L3) rests on "Wrote Python ETL jobs that load shipment events from Apache Kafka into the data warehouse." and "Thesis: event stream processing for parcel tracking."; "Web Platform Engineering" rests on the CV's summary sentence.
- **O-LIVE-3 confirmed:** both LEGACY requests have the same size (11477 bytes), so there is no scope in the legacy prompt. The legacy capabilities differ: 7 against 3.

**Finding F-LIVE-RAW (for the owner).**
- The readiness document §9 lists `storyboard-live/01…20` under "in the repository, without raw text" (§8: "raw responses are not committed").
- Frame `06-person-gemini-output.jpg` shows the ORIGINAL RESPONSE pane with part of the raw Discovery text, legible at 960 × 540. Frame `07-person-gemini-processing.jpg` shows part of the parser result (canonical names, quotes, `structural_definition` sentences).
- Nothing in them is secret: it is the synthetic CV and the model's words about it. But it is model raw text in the public repository, against the document's own rule.
- Keeping, cropping or replacing the frames is the owner's call.

**Status.**
- Handoff: reviewed; all points amended in `de21f2b`.
- The live evidence agrees with the handoff and with GELB's figures; one finding (F-LIVE-RAW).
- Open, as the handoff states: everything about Antigravity itself (P-1 … P-3, P-5 … P-8) and the behaviour on real model failures.
- PINK made no Gemini call. Evidence is in `evidence/handoff-60d2a3b-live-104410d/`.

### 3.51 UI typography & readability sweep GRÜN `frontend/ui-typography` `7a3ca6a` (base `35f00bc`) (2026-10-20)

**Request.**
- GRÜN asked PINK to check `frontend/ui-typography` at `7a3ca6a` (base `35f00bc`) independently. The work follows the owner order "SFE::UI TYPOGRAPHY & READABILITY SWEEP" (2026-10-20). The owner lifted the VIDEO FREEZE for this isolated work only, and the branch stops before integration. PINK did not see the owner order first-hand.
- GRÜN named six places where the geometry limits the size and asked PINK to check them on purpose:
  1. the selected job's title;
  2. the investigation selector below 1366 px;
  3. the meta dock beside the brand at 1280 px in German;
  4. the Source Dock at 1280 × 720;
  5. the orientation surface below 600 px viewport height;
  6. the inspector hint and the organization-cosmos line.
- GRÜN also named two corrections: the mode statement no longer overlaps the field laws, and the current path step wraps instead of cutting the title.

**Method.**
- **Static.** PINK diffed every changed app and test file with all type values (font-size, letter-spacing, line-height) masked, so that only non-typographic changes remain (`static-contract.txt`). It classified every changed font size against GRÜN's step map, compared the role-card code byte for byte and computed the `textMuted` contrast.
- **Walks.** PINK ran its own instrumented copy of GELB's `video-walk.mjs`: the checks are unchanged, and every shot also writes PINK's own frame measure (`pink-typo-measure.mjs.txt`, independent of GRÜN's `inventory.mjs`).
  - The measure records every visible text run: its type, the per-line rectangles of the text itself, the cut by hidden or clip ancestors (separate from text that only scrolls inside a panel), ellipsis and line clamp.
  - It counts a text collision only where both texts are actually painted. Text hidden under an opaque panel does not count.
  - One fresh stand-in lab per run (GELB's `video-lab.ts`, port 41871, disposable databases, PINK's own PID, stopped after each run). Viewports 1920 × 1080, 1440 × 900, **1366 × 768** (not in GRÜN's set) and 1280 × 720, on both commits.
- **Targeted probe** (`pink-typo-extras.mjs.txt`), identical on both commits:
  - the shell row over 1240–1960 px in 8 px steps plus 1365 / 1366 / 1367, in six states, EN / DE;
  - the selected job's title for all 9 engineering roles and 5 roles of PINK's own long-title pool, at five widths;
  - START ANALYSIS in three dock states at four viewports;
  - the orientation surface at six low viewports;
  - the organization-cosmos kicker in five monospace settings × 2 widths × EN / DE × 3 organizations;
  - the current path step for 14 roles × 3 viewports × EN / DE.
- **Follow-up probes.** `pink-typo-probe2.mjs.txt` sweeps START ANALYSIS against the inspector over viewport heights 660–920 in 4 px steps. `pink-typo-probe3.mjs.txt` checks whether each edge action can be reached at every page-scroll position.
- **Regression.** PINK's own suites on `7a3ca6a`, plus the full suite on both commits.
- No Gemini call by PINK. The lab net logs show only Next dev's npm dist-tags check.

**Confirmed.**
- **Contracts.**
  - Every `data-testid`, every visible copy literal and every `text-transform` is unchanged. No font size decreased.
  - 141 steps follow the map exactly and 64 are smaller, geometry-bound steps; none is larger than the map.
  - At run time: 6890 text runs matched across 77 frames, none smaller than before, and the smallest size is 7.5 px (the role cards' standing line, kept).
  - `textMuted` #63788a → #7a8fa1: 4.45 → 6.09 : 1 on void and 4.22 → 5.78 : 1 on the field ground.
- **Role cards unchanged.**
  - `RoleCardTitle` is byte-identical, and in `OrganizationCosmosLayer` only the cosmos centre changed.
  - Role cards 2697/2697: the report is identical to `d685003` except the five C-5 contrast lines. Those are sampled from the pixels behind the translucent cards; they are still ≥ 4.5 : 1 and at least 7.73.
  - Orbit e2e 395/395 and geometry 56/56.
- **Walks.**
  - 30/30 at all four viewports on the base, and on `7a3ca6a` at 1920, 1440 and 1280.
  - The first 1366 × 768 lab on `7a3ca6a` gave 28/29: V-11 timed out because the server answered the job-structure route with 404 at its first compile. The route has no 404 path, and a second lab gave 200 and 30/30. This is the Next dev environment, not the typography change.
- **Corrections.**
  - The mode statement and the field laws overlapped at **every** measured width on the base (94 of 94, at most 2.4 px), not only in 5 frames at 1920. On `7a3ca6a` there are at least 11.8 px between them everywhere, in both languages.
  - `syntx-path-ROLE`: ellipsis on 36 of 84 role views before, 0 after. The step wraps to two or three lines, stays inside the surface and collides with nothing.
  - No new cut text in any walk frame. 23 runs are no longer cut.
- **The six places.**
  1. **Job title.** It stays 12.5 px, and the title box is equally wide at 1280, 1366 and 1440. The same titles are cut as before, and none newly; at 1440 every engineering role fits. Every role title at 1280 and the 46–48-character titles at 1366 were cut by ellipsis already on the base.
  2. **Investigation selector.** 9.5 px below 1366 and 10 px from 1366. At 1280 it is 216 px wide (base 224); from 1366 it is 240.6 px (+16.5).
  3. **Shell row.** At least 8.0 px air everywhere in 1280–1920, in both fields, in six states, EN / DE. Base minimum: 6.9 px (Capability) and 2.4 px (German Job Field, meta dock against the brand). The Job Field meta dock keeps its width (158 / 200 / 162 px).
  4. **Source Dock.** START ANALYSIS ends at 712.2 px (PERSON) and 720.1 px (PERSON × JOB) at 1280 × 720, against 723.2 px on the base.
  5. **Orientation surface.** The scroll rule applies only at a viewport height of 600 px or less.
  6. **Cosmos line.** The inspector hint stays 12 px. The organization-cosmos kicker (8 → 9 px, tracking 1.6 → 1 px) keeps its advance exactly (121.6 / 128 px EN / DE) and wraps between its two parts in all 60 cases on both commits. On the base, PINK saw no break inside "ORGANISATIONS-KOSMOS" in any of the five font settings, so the base break GRÜN describes was not reproduced.
- **Regression on `7a3ca6a`.**
  - tsc: one error, `relay-check.mts` (13,214), which is the same on `35f00bc` (O-TY-TSC confirmed).
  - SSR and units 54/54, demo-ui-fix 62/62, gate 74/74, three-modes 91/91 + 97/97, url-boundary 1/1, syntx-walk 3/3, workflow e2e 10/10.
  - Full suite (no e2e) on both commits: 37 failures on `7a3ca6a`, all 37 also on `35f00bc`. The base has one more failure, a timeout. There is no new failure, and net is 0.
  - The base failures are the test database's legacy DDL drift (`career_policy_versions.version`, F-JP-5) and 5000 ms timeouts in the lifecycle suites. GRÜN counted 28 in its own environment.

**Findings.**
- **D-TY-1 (new, minor; not on the 1920 × 1080 video path).** At 1280 × 720, in PERSON with a staged PDF, START ANALYSIS rises 8–11 px and its label goes under the Decision Graph Inspector.
  - Painted share of the label: 71 % → 29 %. Clickable rows on the button's centre line: 24 → 16.
  - GELB's walk clicks START with a pointer click. On `7a3ca6a` that first hits the inspector, and Playwright scrolls the page by 301 px before the click lands. The field and the shell then stand shifted in the "analysis done" frame (`start-label-1280x720-base-after.png`).
  - It is a shift inside a band that already exists (P-TY-START): the heights where the label is less than half visible are 660–844 px on the base and 660–836 px after. Heights 712–728 become worse, and 688–704 and 836–848 become better. In PERSON × JOB nothing measurable changes at 720.
- **P-TY-START (existing, both commits; functional; not on the video path).** The dock is placed from the top and the inspector from the bottom.
  - At viewport heights of 748–820 px on the base and 736–816 px on `7a3ca6a` (PERSON), for example 1366 × 768 and 1280 × 800, the inspector covers START ANALYSIS completely: no row of the button can be clicked. Below about 680 px the button lies under the viewport's edge.
  - GELB's walk passes there only because Playwright scrolls the page; on both commits the page then stands 253 px higher at 1366 × 768.
  - GRÜN's O-TY-720 describes this overlap at 720 only.
- **D-TY-2 (new, minor; at about 200 % zoom).** At 960 × 540, the scroll rule `max-height: calc(100vh - 100px)` does not keep the surface inside the viewport, because the surface starts at 145 px. Its bottom reaches 585 px.
  - POOLS · 1, + INTAKE and GEMINI OUTPUT start below the viewport. They are reached after 10–30 px of page scroll; on the base they were visible at once.
  - SELECT AS JOB is visible at once in PINK's state. This differs from GRÜN's description "reachable only after scrolling".
  - At 560–600 px heights everything fits.
- **O-TY-WIDTH (documentation).** README §3 lists the edge actions, the surface title and the investigation selector among the single-line capitals that keep their width. Measured:
  - the edge actions and toggles grow by 4–13 px (← CAPABILITY FIELD 129.8 → 137, ← RETURN 66.8 → 74, SELECT AS JOB 122.6 → 135.2);
  - the investigation selector grows by 16.5 px from 1366;
  - the controls grow 1–3 px in height (membrane 32 → 34, buttons 24 → 26, toggles 22 → 23). GRÜN's message says "geometry unchanged".
  - No new collision results from this. Only the wording is imprecise.
- **O-TY-UNBOUND (documentation).** The empty field's kicker "JOB FIELD // UNBOUND" stays 10 px. It is not listed in README §6.
- **O-TY-SCROLLJUMP (existing).** At 1366 × 768 the document scrolls by up to 253 px on both commits. Since 7a3ca6a it also does so at 1280 × 720. The shell header then leaves the view. Its cause is P-TY-START or D-TY-1, through Playwright's pointer click.
- **Not new, only measured:**
  - A 2.4 px hairline between the faint region-state text (opacity 0.42) and the cosmos centre. The pattern of body text behind the translucent centre exists on both commits.
  - The B2 and Job Structure panels scroll about 11 % longer.
  - At widths below 1280 the shell row overlaps on both commits (after −30.8 px, base −37.6 px in German at 1240).

**Run record.**
- Evidence: `evidence/ui-typography-7a3ca6a/`.
  - `static-contract.txt`, `walks.txt`, `frames-compare.txt`, `extras-compare.txt`, `start-vs-inspector.txt`, `low-viewports.txt`, `suites.txt`, `full-suite.txt`;
  - `reports/` (C, O, U, G and T reports of `7a3ca6a`);
  - `scripts/*.txt` (PINK's proofs, never committed as live tests);
  - `start-label-1280x720-base-after.png`;
  - `manifest.sha256`.
- PINK's worktree returned clean to `validation/hr-decision-loop-pink` after every run.
- Nothing of GRÜN's worktrees or labs (:41807, :41808) was used. :3017, :41805, :41821, :41831, :41851 and :41803 were not touched.
- No owner decision is taken here. Integration remains with the owner's GO, and D-TY-1 and D-TY-2 are GRÜN's to weigh.

### 3.52 Typography follow-up GRÜN `38ebc31` (`frontend/ui-typography-pink-followup` = `7a3ca6a` + 1) to §3.51 (2026-10-21)

**Request.**
- GRÜN corrected D-TY-1 and D-TY-2 from §3.51 in `38ebc31`, on its own branch. `frontend/ui-typography` stays on `7a3ca6a` because the owner is accepting it on :41807.
- GRÜN asked PINK to check `38ebc31` with PINK's own labs and probes.

**What changed (`static-38ebc31.txt`).**
- Two style values changed, and nothing else in app or test code:
  - the Source Dock's section air went from 12 to 17 px;
  - the low-window rule `max-height: calc(100vh − 100px); overflow-y: auto` is replaced by `width: min(340px, 36vw) !important` at `max-height: 600px`. This only acts below 1214 px width, because the surface is otherwise `min(340px, 28vw)`.
- Leftover: the comment above the new rule still describes the removed one ("scrolls instead of … Its outer halo is clipped there").

**Method.**
- Same as §3.51, on fresh stand-in labs from `38ebc31` (port 41871, PINK's own PID, disposable databases, no Gemini):
  - the instrumented walk at 1920, 1440, 1366 and 1280 against the base frames;
  - the targeted probe, probe2 and probe3.
- New `pink-typo-probe4.mjs.txt`, run on all three commits. It covers ten low windows from 768 × 432 to 1536 × 864, including 1213 / 1214 × 600 at the rule's width edge, in four Job Field states, EN / DE. For each it records the surface box, every painted collision with surface text, cut surface text and whether each edge action is reachable without scrolling.

**Result: D-TY-1 and D-TY-2 are fixed, and nothing new of weight appears.**
- **Walks and frames.**
  - Walks 30/30 at all four viewports.
  - Against the base (80 frames): nothing cut newly, 24 runs no longer cut, no size decreased.
  - The painted collisions are the §3.51 set. The one addition is an orbiting capability node under the fixed SEMANTIC GUIDE toggle at 1366 (2.2 × 4.3 px); it depends on the orbit's phase.
- **D-TY-1 fixed.** At 1280 × 720:
  - PERSON: label painted 0.71 (base) → 0.29 (`7a3ca6a`) → **0.86**, with 24 clickable rows.
  - PERSON × JOB: 0.71 → 0.71 → **1.00**.
  - The page no longer jumps after GELB's pointer click at 1280 × 720 (root top 59; base 58, `7a3ca6a` −240).
- **D-TY-2 fixed.** At 960 × 540 the surface is 340 px wide and ends at 534 px (base 517), with no scroll of its own, and every edge action is visible at start. All six probe3 windows show every action at start on `38ebc31`, as on the base.
- **probe4.**
  - No painted collision with surface text on any of the three commits.
  - Edge actions out of view at start: only at 768 × 432 (≈ 250 %), and there on all three commits.
  - Cut surface text: base 54 runs, `7a3ca6a` 37, `38ebc31` 25.
  - Against the base, 5 runs are newly cut. Four are at 768 × 432. The fifth is GEMINI OUTPUT at 960 × 540 in German: it reaches 5.2 px past the viewport's edge, while its centre stays visible and clickable.
- **Regression.**
  - tsc: only the base's `relay-check.mts` error.
  - Role cards 2697/2697 (only the C-5 pixel-contrast lines differ from `d685003`), SSR and units 54/54, geometry 56/56, orbit 395/395, demo-ui-fix 62/62, gate 74/74, three-modes 91/91 + 97/97, url-boundary 1/1, syntx-walk 3/3, workflow 10/10.
  - The full suite was not repeated: the change is two style values, and `7a3ca6a` had no new failure.

**Observations.**
- **O-TY-PXJ-SHIFT (minor).** In PERSON × JOB, START sits 8 px lower than in PERSON: at 688–730 at 1280 × 720 (base 678–723 in both states), so its button reaches 10 px past the viewport's edge. The label (700–718) stays fully visible.
  - Inside the existing band P-TY-START, the heights 700–712 and 844–860 px show less of the label than on the base. At the common heights 720, 768, 800 and 900 the result equals the base or is better.
  - Fully covered: 756–832 px (base 748–820).
- **O-TY-COMMENT.** The stale comment noted above.
- P-TY-START and O-TY-SCROLLJUMP stay with the owner as a layout question, as GRÜN records.

**Run record.**
- Evidence: `evidence/ui-typography-38ebc31/`.
  - `static-38ebc31.txt`, `walks-frames-38ebc31.txt`, `extras-compare-base-vs-38ebc31.txt`, `start-and-low-38ebc31.txt`, `probe4-low-windows.txt`, `suites-38ebc31.txt`;
  - `scripts/*.txt`;
  - `manifest.sha256`.
- PINK's worktree returned clean after every run. GRÜN's labs (:41807, :41809) and :3017 were not touched.
- Integration remains with the owner's GO.

### 3.53 Focus-dependent readability GRÜN `frontend/focus-readability` `9fb1df6` (base `38ebc31`) (2026-10-21)

**Request.**
- The owner mandates are "FOCUS_DEPENDENT_READABILITY" and "FOCUS_READABILITY_OWNER_DECISION". GRÜN relayed them, and PINK did not see them first-hand.
  - Decision 04: the focused pool name and organization name lead their context.
  - Decision 02: the receded siblings become slightly more readable, without changing opacity globally.
- GRÜN asked PINK to check `121dc6d` and then moved the check to `9fb1df6` (fast-forward, + 1 commit). That commit fixes GELB's F-FR-1: the steps now count the label as shown, in upper case, so "ß" counts as "SS".
- GRÜN asked PINK to check three things: the step edges, PINK's role-card and orbit suites, and keyboard and focus transitions. GELB asked for the edges ±1 with "ß", and for pool names of 37–54 characters at 12 px running through `wrapLines(…, 18, 2)`.
- The base is `38ebc31`. GRÜN reports that the owner chose it after §3.52; PINK did not see that first-hand.

**What changed (`static-9fb1df6.txt`).**
- Only font sizes changed, in `SyntxField.tsx` and `CapabilityDeepFocusView.tsx`. With every font-size expression masked, the code is identical to `38ebc31` apart from the three step constants. No test id, copy, colour, weight, sign state or tabIndex changed, and nothing in `lib/` or `test/`.
- The steps count the label as shown (upper case):
  - pool name in the core: up to 36 characters 14 px, 37–54 characters 12 px, from 55 characters 10.5 px (base 10.5);
  - cosmos centre label "NN NAME": up to 34 characters 13 px, 35–38 characters 12 px, from 39 characters 11 px (base 11);
  - receded requirement siblings 9.5 → 11 px and capability deep-focus satellites 10 → 11 px; scale 0.78 and opacity 0.42 are kept.
- The stale comment is removed (O-TY-COMMENT closed).
- No fixture name changes length in upper case, so `121dc6d` and `9fb1df6` render GELB's walk identically.

**Method.**
- **Walks.** PINK's instrumented walk on `121dc6d` at 1920, 1440, 1366 and 1280, plus the §3.51 extras, compared with the `38ebc31` frames of §3.52.
- **Length steps** (`pink-focus-edges.mjs.txt`): new and identical on both commits, one fresh stand-in lab per commit, reduced motion.
  - 20 pool names and 20 organization names: at and around every step edge (pool 36/37 and 54/55, centre 34/35 and 38/39), in four shapes:
    - natural words;
    - adversarial word lengths, where every line holds one word;
    - one long word (18–29 characters);
    - "ß" at all four edges, with the raw length one below the edge in upper case.
  - Measured:
    - per line: the air to the core's body ring (220 px) and inner membrane (184 px), and to the 174 px centre disc;
    - the chip;
    - the role cards;
    - PINK's frame measure.
  - The receded siblings are measured in the REQUIREMENT state, reached through the URL's `jobRequirementId`. That uses the fixture and PINK's long requirement names (up to 77 characters).
  - Viewports 1920 and 1280 (EN / DE) and 960 × 540.
- **Keyboard** (`pink-focus-keys.mjs.txt`).
  - Tab order: 70 stops in FIELD, ORGANIZATION, ROLE and REQUIREMENT at 1920 and 1280, recording each stop's test id, aria label, focus ring, visibility, focus box and observation kind.
  - Keyboard descent: FIELD → organization → role → requirement by Tab + Enter, then Escape × 3.
  - PINK's first keyboard run started with a click on the field's ground. That click returns one level, so the run was discarded on both commits and repeated without a click.
- **Regression.** PINK's suites on `9fb1df6`.
- No Gemini call by PINK. The net logs show only Next dev's npm dist-tags check.

**Confirmed.**
- **Step edges, including "ß" (GELB's F-FR-1 fixed).** Every variant gets the size its upper-case length calls for: pool 36 → 14, 37 → 12, 54 → 12, 55 → 10.5; centre 34 → 13, 35 → 12, 38 → 12, 39 → 11.
  - The four "ß" names whose raw length is one below the edge each get the next step: raw 36 / upper 37 → 12, raw 54 / upper 55 → 10.5, raw 34 / upper 35 → 12, raw 38 / upper 39 → 11.
  - The centre disc stays 174 × 174 in all 100 centre rows per commit, and no centre text is newly cut. The 25-character word at 11 px is cut on both commits. In the 100 core rows no name is cut and no painted collision appears.
- **Pool names of 37–54 characters at 12 px.** The text that `wrapLines(…, 18, 2)` joins wraps to 2–4 lines in the browser. Every name line keeps at least 4.4 px inside the body ring. The worst case is PINK's adversarial 54-character name with four lines: the core's content block grows from 177 to 196 px, and the chip's corners reach 18 px past the body ring (base 10 px).
- **Walks and frames.** 30/30 at all four viewports.
  - Only the intended sizes changed: pool name 10.5 → 14 (2 lines stay 2), centre 11 → 13 (3 lines stay 3), capability satellites 10 → 11 (1 line stays 1).
  - No size decreased and nothing is cut newly. The §3.51 extras (shell row, job title, START, low windows, cosmos kicker, path step) are identical.
  - The painted collisions listed as new or gone belong to three families that occur on all four commits, depending on the orbit phase. On `35f00bc` / `7a3ca6a` / `38ebc31` / `121dc6d` they count:
    - organization body text × the role card's RETURN line: 44 / 41 / 40 / 41;
    - capability cosmos centre: 12 / 22 / 19 / 21;
    - capability nucleus: 7 / 9 / 9 / 9.
- **Siblings with fixture names.** At 11 px no card grows, none overlaps another or the nucleus, and no text leaves its card, at any viewport.
- **Keyboard and focus.** Identical on both commits:
  - 8 × 70 tab stops (order, names, focus ring, in view, kind; focus boxes ±0 px);
  - the descent and the Escape steps, with the same URLs and the same focused element.
- **Regression on `9fb1df6`.**
  - tsc: only the base's `relay-check.mts` error.
  - Role cards 2697/2697, byte-identical to the `38ebc31` report. Orbit 395/395; only the LIVE motion distances differ.
  - SSR and units 54/54, geometry 56/56, demo-ui-fix 62/62, gate 74/74, three-modes 91/91 + 97/97 (with ports masked, identical to `38ebc31`), url-boundary 1/1, syntx-walk 3/3, workflow 10/10.

**Finding.**
- **D-FR-1 (new, minor; not in any fixture, not on the video path).** The steps count the whole label, not its longest word. A word that fitted at the old size no longer fits at the new one.
  - **Centre, 13 px.**
    - "TELECOMMUNICATIONS" (18 characters, label 32) reaches 3.1 px past the disc's rim.
    - "VERSICHERUNGSGRUPPE" (19 characters, label 30) reaches 7.4 px past it, and its first and last letters sit on the rim.
    - On the base both stayed 7.4 and 3.7 px inside.
  - **Pool core, 14 px.** "GESUNDHEITSPLATTFORMEN" (22 characters, pool name 31) leaves the 176 px content width and reaches 3.9–4.3 px past the body ring; on the base it stayed 15–17 px inside.
  - Evidence: `pairs/*.png` (left `38ebc31`, right `9fb1df6`).
  - "STRASSENLOGISTIK" (16 characters) still fits at 13 px, 5.4 px inside. The longest word in any fixture name has 16 characters (Industrieanlagen).
  - German compounds of this length are plausible in uploaded pools. How to bound it is GRÜN's choice; for example, the step could also depend on the longest word.

**Observations.**
- **O-FR-SIB.** "Sibling cards do not grow" holds for the fixture names. A requirement name of 77 characters grows its card from 78 to 90 px at 1920 and 1280. At 960 × 540 three long names grow: 98 → 104, 98 → 118 and 78 → 90; on the base two cards had already grown there. No overlap and nothing cut.
- **Core at 14 px (intended growth, measured).** The fixture's two name lines pass the inner membrane by 8–9 px at their corners (base 6.6–7.3 px inside), and the content block grows by 8–9 px. Natural names keep at least 2.2 px inside the body ring.
- **Measure note.** PINK's measure counts the radial-gradient centre core as translucent. It therefore lists receded organization-body text behind the centre as touching. The centre's core is opaque, so this text is not visible, and the counts are the same on both commits.

**Run record.**
- Evidence: `evidence/focus-readability-9fb1df6/`.
  - `static-9fb1df6.txt`, `walks-frames-121dc6d.txt`, `edges-38ebc31-vs-9fb1df6.txt`, `keys-38ebc31-vs-9fb1df6.txt`, `suites-9fb1df6.txt`;
  - `pairs/*.png`;
  - `scripts/*.txt` (PINK's proofs, never committed as live tests);
  - `manifest.sha256`.
- PINK's worktree returned clean to `validation/hr-decision-loop-pink` after every run.
- GRÜN's review labs :41809 and :41810 were not touched, nor were :3017, :41805, :41821, :41831, :41851 or :41803.
- Integration remains with the owner's GO. D-FR-1 is GRÜN's to weigh.

### 3.54 D-FR-1 fix GRÜN `9ac5702` / `49e2bc6` (`frontend/focus-readability`, base `38ebc31`) to §3.53 (2026-10-22)

**Request.**
- GRÜN fixed D-FR-1 from §3.53 in `9ac5702` and asked PINK to re-check it.
- The tip then moved to `49e2bc6`, which adds one documentation line: GELB's L-FR-1 records the overlong single word as an existing limit. The base stays `38ebc31`.

**What changed (`static-49e2bc6.txt`).**
- `9fb1df6` → `9ac5702` changes only `focusNameSize` and the two step constants in `SyntxField.tsx`. `9ac5702` → `49e2bc6` changes nothing outside `docs/`.
- Each step now also has a limit on the longest word, read from the label in upper case. A word is a run between whitespace, so hyphenated words count whole. The limits:
  - pool: 14 px up to a 19-character word, 12 px up to 22, otherwise 10.5;
  - centre: 13 px up to a 16-character word, 12 px up to 18, otherwise 11.
- The label-length limits 36/54 and 34/38 are unchanged.
- **Fixtures.** `fixture-steps-pink.mjs.txt` takes the step code verbatim from each commit's `SyntxField.tsx` and evaluates it for all 27 fixture pool names and centre labels. `9ac5702` gives the same size as `9fb1df6` for every one; the longest fixture word has 16 characters. GELB's walk therefore renders as in §3.53, and PINK did not repeat the walks.

**Method.**
- PINK's length-step probe from §3.53, extended by word edges and run on one fresh stand-in lab per commit, on `49e2bc6` and `38ebc31`. The extended set has 29 pool and 28 organization variants.
- The word edges sit at and around every word limit:
  - pool words of 19, 20, 22 and 23 characters;
  - centre words of 16, 17, 18 and 19 characters.
- Each is tested as a German compound, as W only (the widest capital), first in the label, and with "ß", which shows one character longer.
- PINK's keyboard probe and suites ran on `49e2bc6`.

**Result: D-FR-1 is fixed, and nothing new appears.**
- **The §3.53 cases.**
  - "TELECOMMUNICATIONS" → 12 px, 2.2 px inside the disc.
  - "VERSICHERUNGSGRUPPE" → 11 px, 3.7 px inside, as on the base.
  - "GESUNDHEITSPLATTFORMEN" → 12 px, 7.1 px inside the body ring, within the content width.
  - "INTERNATIONALIZATION" → 12 px.
  - The 29-character word → 10.5 px.
- **Word edges.** At 1920, 1280 (EN / DE) and 960 the least line air is:
  - pool 19 → 14 px, 6.9 px air;
  - pool 20 and 22 → 12 px, 7.1–13.1 px;
  - pool 23 → 10.5 px;
  - centre 16 → 13 px, 5.4 px;
  - centre 17 and 18 → 12 px, 2.2–6.2 px;
  - centre 19 → 11 px.
  - W-only words measure the same (monospace). A word placed first and the "ß" variants (STRASSENBAUFIRMEN, 17 shown → 12 px) follow the rule.
- **Against the base** (285 name rows):
  - No enlarged name lies closer to the edge than on `38ebc31`, and nothing is newly cut. The smallest air of an enlarged name is 2.2 px (centre, 18-character word at 12 px).
  - Only the 29-character pool word and the 25-character centre word reach past the edge. They keep 10.5 / 11 px, exactly as on `38ebc31`; that is GELB's L-FR-1.
- **Against `9fb1df6`.** Only the five D-FR-1 variants change size. Every other variant and the receded siblings are identical.
- **Keyboard and focus.** Identical to `38ebc31`: 8 × 70 tab stops, and the descent with Escape steps.
- **Regression on `49e2bc6`.**
  - tsc: only the base's `relay-check.mts` error.
  - Role cards 2697/2697, byte-identical to the `38ebc31` report. Orbit 395/395; only the LIVE motion distances differ.
  - SSR and units 54/54, geometry 56/56, demo-ui-fix 62/62, gate 74/74, three-modes 91/91 + 97/97 (with ports masked, identical to `38ebc31`), url-boundary 1/1, syntx-walk 3/3, workflow 10/10.

**Run record.**
- Evidence: `evidence/focus-readability-49e2bc6/`.
  - `static-49e2bc6.txt`, `edges-38ebc31-vs-49e2bc6.txt`, `keys-38ebc31-vs-49e2bc6.txt`, `suites-49e2bc6.txt`;
  - `pairs/*.png` (left `38ebc31`, right `49e2bc6`);
  - `scripts/*.txt`;
  - `manifest.sha256`.
- PINK's worktree returned clean. GRÜN's review labs :41809 and :41810 were not touched.
- Integration remains with the owner's GO.

### 3.55 Live PERSON × JOB run on GELB's lab :41862 (`49e2bc6`), GET only (2026-10-22)

**Request.**
- GELB asked PINK to check the real PERSON × JOB run of the owner order "SYNTX::SFE::PERSON_JOB_END_TO_END_FIELD_VALIDATION" (§09) independently: ten points, each PASS / FAIL / INCONCLUSIVE / NOT IMPLEMENTED. The owner's GO for the live Gemini calls was given to GELB; PINK did not see it first-hand.
- Lab :41862 on `49e2bc6`, disposable database, live Gemini through GELB's relay (6 of 8 calls used). PINK was asked to send GET only.

**Method.**
- PINK read the code of every GET route it used and found no write, no Gemini call and no legacy analysis on them; the only side effect is the idempotent schema registration on a verified disposable database.
- About 22 GETs with curl and 26 from a browser in which every non-GET request was aborted (none was). Inspector routes without a token answer 404, as designed.
- **Inspector access.** PINK did not read the inspector token. Reading GELB's lab state was refused in PINK's session as credential exploration, and PINK did not work around it. After the owner's decision (PINK_EVIDENCE_ACCESS = AUTHORIZED_READ_ONLY_MINIMUM_SCOPE) GELB opened a token-free GET gate on :41864. PINK's first request to it was refused in PINK's session the same way, so 0 requests reached the gate. Lifting that needs the user's own permission rule.
- Hashes recomputed with the pure code of `49e2bc6` in PINK's scratch (no database): `parseJobPoolUpload` for the pool file, `resolveJobScopeFromStoredPool` + `renderInvestigationScope` for the scope hash.
- Quotes checked against the text of `docs/examples/cv.synthetic.pdf` (pdftotext, whitespace normalised).

**Result.**

| # | Point | Verdict |
|---|---|---|
| 1 | Session identity | PASS: job → analysis → discovery run → convergence agree in /jobs, /investigation and the B2 binding |
| 2 | PDF identity | INCONCLUSIVE: content PASS (DOC_001 = cv.synthetic.pdf in both analyses, every quote in the PDF); the bundle hash is visible only through the inspector |
| 3 | Pool identity | PASS: raw sha256 `6475800a…` of the file = lab; canonical `b94850c4…` recomputed → `JPOOL_B948…` |
| 4 | Role identity | PASS: 9 requirements equal to the file; `investigationScopeHash` `8016b7c1…` recomputed from the file and the lab's mapping |
| 5 | Real model execution | INCONCLUSIVE: neither inspector nor relay readable by PINK; GELB's `relay.jsonl` is not an independent source (E-7) |
| 6 | Persisted result | PASS, through the read routes (no direct database read) |
| 7 | Capability → requirement relations | PASS for B2: 8 COVERED / 1 NOT_COVERED recomputed from the pool file, all 9 rows equal to the server, scored false. The canonical relation is NOT IMPLEMENTED (NOT_EVALUATED, VERIFIED_CAPABILITY_SNAPSHOT_ABSENT) and declared as such |
| 8 | Evidence traceability | PASS at quote level: 18 discovery quotes (SOURCE_MATCH_VERIFIED), 16 legacy context quotes and the 11 trace quotes of the role are verbatim in the PDF. Spans and document hashes: INCONCLUSIVE (inspector only) |
| 9 | First screen | PINK saw the role deep link at 1920 × 1080: correct identities, B2 one click away. GELB's correction K-1 later named walk shot 14 (directly after ANALYZE) as the first screen; that screen is G1's subject (§3.56) |
| 10 | No mixing across sessions or roles | PASS: no shared proposal, evidence or candidate id; B2 proposals = the PERSON × JOB projection; the negative GETs refuse (NOT_SCOPED, SCOPE_MISMATCH, SELECTION_REQUIRED, 409 on /matches for PERSON, 404 for unknown ids) |

- **O-PXJ-NAME.** Under the scope all 8 proposals carry exactly the requirement names, so B2's name coverage is nearly circular; the substance is in the quotes (GELB V-7).
- **O-PXJ-PERSONLINK.** A PERSON deep link without `investigationMode` lands in the default PERSON × JOB; the field correctly refuses the analysis (handled by G1 as MODE_MISMATCH).

**Run record.** `evidence/pxj-e2e-49e2bc6-pink/` (`verdicts.txt`, `scripts/*.txt`, `manifest.sha256`): ids, hashes, counts and verdicts only, no quote and no model text (E-6). GELB took the result into §11 of its report (`0df3040`).

### 3.56 G1 · PERSON × JOB first screen GRÜN `frontend/pxj-first-screen-g1` `50776fc` (base `49e2bc6`) (2026-10-22)

**Request.**
- GRÜN delivered G1 and GELB asked PINK to validate it against PA-01 … PA-14 of the assignment `CONDYN_PXJ_G1_GRUEN_ASSIGNMENT_2026-10-22.md` (`15332a5`, specification `9d9f519`).
- Deviations as relayed: D-G1-1 and D-G1-2 (+ addendum) approved by the owner directly to GRÜN, K-G1-1 by GELB, D-G1-3 GRÜN's for review. PINK did not see the owner's words first-hand.

**Method.**
- **Static** (`static-50776fc.txt`): every changed file classified against §08; every hunk of the eight D-G1-2 test files read; the new code read.
- **Stage 1b** (`stage-1b-41862.txt`): the persisted bodies of :41862 (result, /investigation, B2; GET only) through GRÜN's pure `decodeAnalysisResult` / `projectPxjFirstScreen` and the existing boundary and B2 decoders, in PINK's scratch. GRÜN's code did not run against the lab database.
- **Stage 1c** (`walks-STANDIN-50776fc.txt`): PINK's own probe `pink-g1-walk.mjs` (independent of GRÜN's walk) on PINK's own lab (`video-lab.ts`, port 41873, disposable database, loopback **STAND-IN, no model execution**), at 1920 × 1080 and 1280 × 720. 19 steps: PERSON session, PERSON × JOB session, deep link, focus/hover/Tab, reload, German, role switch in the session, explicit role selection, a second PERSON × JOB analysis for another role, the first analysis under that role, PERSON × JOB analysis under PERSON, PERSON deep link in the default mode, the explicit mode switch, unknown id, no selected job, orbit 01 focus, role level. Every API request is logged with the active field at its time.
- **Base comparison** (`role-level-and-person-base-vs-tip.txt`): the same PERSON session, PERSON deep link and Job Field role level on fresh labs of `49e2bc6` and `50776fc`.
- **PINK proof** (`D-G1-P1-no-projection.txt`): a scratch SSR test on `50776fc` with GRÜN's mock harness, run once and removed; and GRÜN's pure functions on the persisted :41862 body.
- **Suite** (`suite-50776fc-vs-49e2bc6.txt`): tsc and the whole isolated suite including e2e on both commits, fresh disposable databases, network sentinel.

**Result.**

| PA | Verdict | Evidence |
|---|---|---|
| PA-01 mapping M-01 … M-14 | PASS | 1b: AVAILABLE, 8/9, pool order, M-05 … M-14 field-equal with the server body, proposals = projection in order, 8/8 quotes byte-equal and verified with DOC_001 / cv.synthetic.pdf. Stand-in: DOM rows, bases, proposal ids, quote hashes and counts equal to the server bodies (7/9 there) |
| PA-02 reconstruction | PASS | session, deep link and reload give the same state, rows, quotes and counts at both widths; T-02 green |
| PA-03 no empty, no invented | PASS, except D-G1-P1 | the PERSON × JOB result is reconstructed after a reload; unknown id → RESULT_NOT_FOUND with no data of any analysis |
| PA-04 only B2 | PASS | 0 `gemini-*` reads; `/matches` read 5 times per width, always with the Job Field active (D-G1-3 holds); B2 read only on the Capability Field and only for the analysis's own job; none in ROLE_MISMATCH or MODE_MISMATCH. L-1 … L-4 tested by GRÜN's T-05 |
| PA-05 no legacy score, orbits 03–06 | **FAIL in one state (D-G1-P1)**, otherwise PASS | under PERSON × JOB only orbits 01/02, no coupling, no VIEW MATCHES, no forbidden word outside the mandated statements (EN/DE); under PERSON the session screen equals `49e2bc6` |
| PA-06 boundaries | PASS | ROLE_MISMATCH without proposals (in session and deep link, orbit 02 "0 items"); MODE_MISMATCH switches nothing (mode unchanged after 3 s, switch only by the explicit button); a second analysis for another role replaces the URL's analysisId, and the first analysis under that role is ROLE_MISMATCH |
| PA-07 provenance | PASS | quotes byte-equal; `HASH-` and "Unknown Document" never rendered; T-06/T-10 green |
| PA-08 every state visible, no source jump | **FAIL in NO_PROJECTION (D-G1-P1)**, otherwise PASS | all other states seen or green in T-03 |
| PA-09 mandatory texts and word bans | PASS | the five P-07 statements beside the coverage in EN and DE; "match" occurs only in the mandated "source-match verified" |
| PA-10 role level unchanged | PASS | 26/26 role-level entries (requirements, traces, open boundaries, source) identical between `49e2bc6` and `50776fc` once the sources read has settled; new only `syntx-legacy-disclosure` with its text |
| PA-11 focus is no selection | PASS | hover, focus and 25 × Tab: URL unchanged, 0 requests |
| PA-12 stand-in marked | PASS | GRÜN's 3 measure files carry `"gemini": "STAND_IN"`, all shots are named `STANDIN-*` and carry the visible mark; no stand-in result is called Gemini or live |
| PA-13 untouched, files | PASS | files within §08 plus D-G1-1, D-G1-2, K-G1-1; no backend file; no path, URL, key, token, :41862 id or quote in the diff (0 of 12 live quotes); PINK touched :41862 with GET only |
| PA-14 T-12 | PASS | tsc only `relay-check.mts(13,214)` on both; suite 27 failed on `50776fc`, 28 on `49e2bc6`, 0 only on `50776fc` (the base's extra one is a postgres adapter test); the 27 are the lifecycle / policy-activation DDL drift (F-JP-5); 71/71 new tests and all eight D-G1-2 files green; no test lost |

- **D-G1-P1 (new, PINK).** In NO_PROJECTION under PERSON × JOB the field still shows the analysis, and `demoStateFromResult` keeps the legacy analysis's capabilities when the projection is `null` (`applyCapabilityProposalProjectionToDemoState(…, null)` returns the legacy state; `withoutLegacyOrbits` empties 03–06 only).
  - Orbit 02 then shows the unscoped legacy capabilities: "2 items" at L0, their names at zoom 1 and "93%" (`evidenceConfidence`) at zoom 2, while the panel says "This analysis has no capability proposals". On the persisted :41862 body with the projection set to `null`, orbit 02 would carry `CAP_001` … `CAP_005` with 0.9 / 0.95.
  - Against P-08 (no `evidenceConfidence`), NO_HIDDEN_SOURCE_SUBSTITUTION and §04 NO_PROJECTION. GRÜN's fixture has `capabilities: []`, so its tests cannot see the path.
  - Reach: only a PERSON × JOB analysis whose persisted result has no proposal projection; not on the live or the stand-in path of today. Under PERSON the behaviour is unchanged from `49e2bc6`.
- **GRÜN's decisions inside the assignment** are compatible with §03/§04: PERSON_RESULT (today's screen, §04 last line); ROLE_MISMATCH also without a job (in practice the gate stays closed and the Job Field offers the analysis's job, as §03.4 asks); MODE_MISMATCH and BOUNDARY_* without proposals (stricter than §04 asks); a foreign result as RESULT_LOADING (late answers invisible).
- **GELB's note.** A PERSON deep link with `investigationMode=PERSON` now restores the PERSON result (orbits 1/12 items instead of 0 on `49e2bc6`, plus the empty-projection halo on 03–06). The PERSON session screen itself is byte-for-byte the base's. Both follow from Q2 and §04.
- **Observations.** At 1280 × 720 the inspector still covers START ANALYSIS (P-TY-START, pre-existing). A PINK probe timing artefact (role level read before the sources read) first looked like a T-11 difference; settled, both commits are identical.

**Run record.**
- Evidence: `evidence/pxj-g1-50776fc/`: `static-50776fc.txt`, `stage-1b-41862.txt`, `walks-STANDIN-50776fc.txt`, `walks-STANDIN-compare-runs.txt`, `role-level-and-person-base-vs-tip.txt`, `D-G1-P1-no-projection.txt`, `suite-50776fc-vs-49e2bc6.txt`, `shots/STANDIN-*.png` with `CAPTIONS.txt` (only screens without quotes, E-6), `scripts/*.txt`, `manifest.sha256`.
- PINK's labs ran on port 41873 under PINK's PIDs and were stopped; the worktree returned clean to `validation/hr-decision-loop-pink`. GRÜN's lab :41871, :41862 (GET only), :41864 (no request reached it), :3017, :41805, :41821, :41831, :41851 and :41803 were otherwise not touched. No Gemini call.
- No integration; D-G1-P1 is GRÜN's to fix or the owner's to accept.

### 3.57 D-G1-P1 fix GRÜN `a9ff0ca` (`frontend/pxj-first-screen-g1`, on `50776fc`) to §3.56 (2026-10-22)

**Request.** GRÜN fixed D-G1-P1 in `a9ff0ca`; GRÜN and GELB asked PINK to re-check PA-05 and PA-08, and T-07 under PERSON.

**What changed (`static-a9ff0ca.txt`).** One line of code: under PERSON × JOB `withoutLegacyOrbits` keeps only capabilities with `projectionState` PROPOSED (the projection overlay sets it, the legacy adapter never does). `projectPxjFirstScreen` is unchanged. Tests: the legacy fixture now has capabilities with confidence; a unit test and SSR checks at L0, zoom 1 and zoom 2 were added.

**Result: D-G1-P1 is fixed, nothing else changed.**
- **PA-05 / PA-08 now PASS.** PINK's own proof test from §3.56, unchanged, on `a9ff0ca`: NO_PROJECTION with legacy capabilities → orbit 02 "0 items", no legacy name at zoom 1 or 2, no "%", the NO_PROJECTION statement shown. On `50776fc` the same test gave "2 items", the names and "93%". GRÜN's pure functions on the persisted :41862 body with the projection removed: orbit 02 0 capabilities (was `CAP_001` … `CAP_005`).
- **AVAILABLE unchanged.** Stage 1b on the :41862 bodies gives output identical to `50776fc` (orbit 02 keeps the 8 PCAP proposals). PINK's stand-in walk on a fresh lab: all 20 steps equal to `50776fc` in state, proposals, rows, orbits, coupling and placeholders; orbit 02 "12 items" in AVAILABLE, "0" in ROLE_MISMATCH; PA-01 field-equal; session = deep link = reload; focus changes nothing; `/matches` never with the Capability Field active; 0 `gemini-*`.
- **T-07 under PERSON.** GRÜN's PERSON markup test (byte-identical with `49e2bc6`) is green; on PINK's labs the PERSON session screen equals `49e2bc6` and the role level is 26/26 identical.
- **Regression.** tsc: only `relay-check.mts(13,214)`. Whole suite: 74/74 G1 tests green; 33 failed = the 27 of `50776fc` plus 6 timeouts (5000 ms) in decision-core and outcome-valence files that import nothing of G1. Rerun alone, five of the six pass; the remaining replay file times out alone on `a9ff0ca`, `50776fc` and `49e2bc6` alike, so it is machine load, not G1.

**Run record.** `evidence/pxj-g1-a9ff0ca/`: `static-a9ff0ca.txt`, `D-G1-P1-fix-proof.txt`, `walk-STANDIN-a9ff0ca.txt`, `role-level-and-person-49e2bc6-vs-a9ff0ca.txt`, `suite-a9ff0ca.txt`, `manifest.sha256` (ids, counts, verdicts; no quotes). PINK's lab on port 41873, stopped; worktree clean; GRÜN's :41871 not touched; no Gemini call. G1 now meets PA-01 … PA-14 on PINK's checks; integration remains with the owner.

### 3.58 Role-field closure: F-RF-1 … F-RF-3 reproduced and the matrix X-01 … X-24 swept on `a9ff0ca` (2026-10-23)

**Request.** GELB relayed the owner order "SYNTX::SFE::RECURSIVE_ROLE_FIELD_CLOSURE" (base `49e2bc6`, G1 candidate `a9ff0ca`; no integration, no deployment, no Gemini). Basis: GELB's state graph `CONDYN_ROLE_FIELD_CLOSURE_2026-10-22.md` (`c02d756`), all CODE_INSPECTION. PINK's lane: reproduce F-RF-1 … F-RF-3 before any fix, sweep X-01 … X-24 in the browser, keep the evidence classes apart.

**Method.**
- PINK's own probe `pink-rf-sweep.mjs` on a fresh lab of `a9ff0ca` (`video-lab.ts`, port 41873, disposable database). Evidence class **STAND_IN** (no model execution) for every browser step; the B2 409 checks of X-24 are GETs against the same lab. :41862 was not used (no PERSISTED_REAL_RESULT in this section).
- Three pools uploaded to PINK's own lab: the DLL pool, a synthetic PINK pool (`pools/PINK_RF_POOL.json`: the DLL role id `role_kestrel_fullstack` again, two roles titled "Platform Engineer" in one organization and a third in another, a role without requirements) and the same pool with status ARCHIVED.
- Each step records URL, mode, field, gate, selected job (state, used, shell text), observed role, first-screen state and statement, Job Field offer, proposals and orbit counts, and the requests. Phases that the stand-in finishes too fast were held by delaying responses in the browser; each such step says so.

**Pool schema (X-07, X-09, X-10).** All three pools were accepted (201). The canonical mapping lists every role, `role_pink_empty` with 0 requirements; the ARCHIVED pool is stored as such. Selecting the empty role gives VALID, an analysis for it gives B2 200 with "0 covered · 0 not covered · 0 requirements".

**Reproduced (`sweep-STANDIN-a9ff0ca.txt`).**
- **F-RF-1 confirmed.** PxJ with a VALID job → ANALYZE → mode PERSON while the job runs (job polls held 4 s). After SUCCEEDED the URL says `investigationMode=PERSON_X_JOB` (the declared mode), the interface stays PERSON and shows MODE_MISMATCH; the reload shows PERSON × JOB with AVAILABLE. Session ≠ reload.
- **F-RF-2 a confirmed.** Page without `analysisId` → A1 AVAILABLE (URL A1) → A2 (a text file named .pdf, so the worker fails with EXECUTION_FAILED). While A2 runs and after it failed, the screen shows NO_ANALYSIS although the URL names A1; the reload shows A1 AVAILABLE.
- **F-RF-2 b confirmed.** Page with `?analysisId=A0` → A1 AVAILABLE (URL A1) → A2 running and failed: the screen shows **A0** (coverage bound to A0), neither the running analysis nor the URL's A1; the reload shows A1.
- **F-RF-3 confirmed.**
  - CHECKING (upload read held 7 s; result and boundary not delayed): from 2.5 s to 9.5 s the Job Field offers "No job is selected: this analysis belongs to the job below … SELECT THIS ROLE" while the shell says CHECKING; at 10 s VALID and coverage.
  - INVALID, permanently: an unknown role id, a job of the ARCHIVED pool and an unknown upload all give the shell "JOB NOT VALID <role id>" and, below it, the offer "No job is selected".

**Matrix.**

| # | Result (STAND_IN) |
|---|---|
| X-01 / X-21 | role opened by click or deep link (`jobRoleId` only): job NONE, gate AWAITING_JOB, "select" not pressed; reload equal — PASS |
| X-02 | select → VALID, URL `jobScope*`, gate OPEN, "select" pressed and disabled; reload equal — PASS |
| X-03 | selecting again: button disabled, 0 requests — PASS |
| X-04 | remove → NONE, URL without `jobScope*`, gate AWAITING_JOB, field FIELD, role stays opened, analyses 5 → 5; reload equal — PASS |
| X-05 / X-06 | other role (same organization / other organization) in the session with A0 on view → ROLE_MISMATCH without proposals; reload equal — PASS |
| X-07 | DLL role selected, PINK pool viewed with the same role id: "select" not pressed there, shell still names the DLL pool; Capability keeps A0 AVAILABLE — PASS |
| X-08 | selecting that role in the PINK pool replaces the job (shell names the PINK pool); A0 → ROLE_MISMATCH; reload equal; B2 for the same role id under the other upload: 409 SCOPE_MISMATCH — PASS |
| X-09 | role without requirements: VALID; analysis → B2 counts 0/0/0, proposals shown, no other number — PASS |
| X-10 | twin A and twin B (same title, same organization): identical shell text "Platform Engineer · Kestrel … · PINK pool"; twin C differs only by its organization — **F-RF-5 confirmed** |
| X-11 | mode PERSON with A0 on view: MODE_MISMATCH, shell "selected job not used"; reload equal — PASS |
| X-12 | mode JOB: gate JOB_MODE, field FIELD, 0 analysis reads after the switch; reload equal — PASS |
| X-13 | = F-RF-1 — FAIL |
| X-14 | = F-RF-2 a/b — FAIL |
| X-15 | another role selected while the analysis runs: ROLE_MISMATCH in the session and after the reload — PASS |
| X-16 | reload equal in every step except X-13 / X-14 — PASS with those exceptions |
| X-17 | = F-RF-3 CHECKING — FAIL |
| X-18 | = F-RF-3 INVALID: shell, gate and the absent proposals are right, the naming is wrong — FAIL (naming) |
| X-19 | unknown id → RESULT_NOT_FOUND; the PERSON analysis under PxJ → MODE_MISMATCH — PASS |
| X-20 | `jobScopePoolUploadId` without role → NONE; malformed upload id → NONE; `investigationMode=FOO` → PERSON × JOB (the URL keeps "FOO") — PASS |
| X-22 | Back leaves the state for the previous document (B-NAV confirmed). Forward restores the URL and mode PERSON, but 3.5 s later the first screen was still RESULT_LOADING with the job CHECKING — INCONCLUSIVE, to be repeated with a longer wait |
| X-23 | PxJ without a job: START disabled, 0 ANALYZE posts — PASS |
| X-24 | B2 for another role of A0's pool and for the same role id in another upload: 409 SCOPE_MISMATCH — PASS |

**Run record.** `evidence/role-field-closure-a9ff0ca/`: `sweep-STANDIN-a9ff0ca.txt`, `pools/*.json` (synthetic), `shots/STANDIN-*.jpg` with `CAPTIONS.txt` (screens without CV quotes only), `scripts/*.txt`, `manifest.sha256`. PINK's lab on port 41873 under PINK's PID, stopped; worktree clean. :41862, :41864 and GRÜN's :41871 not touched. No Gemini call. The fixes of F-RF-1 … F-RF-3 are GRÜN's; PINK re-checks them on GELB's word.

### 3.59 Role-field fixes GRÜN `575e225` / `0dd55e5` / `25e90bf` / `46a95bb` (tip `88539d3`) to §3.58, with G1 re-checked (2026-10-23)

**Request.** GELB asked PINK to re-check GRÜN's fixes of F-RF-1, F-RF-2, F-RF-3 and F-RF-5 (tip `88539d3`, on `a9ff0ca`): the §3.58 sequences unchanged, X-11 … X-18 and X-16, X-22 with a longer wait, and PA-01 … PA-14 again.

**What changed (`static-88539d3.txt`).** `SemanticCareerIntelligenceField.tsx`, `PxjFirstScreen.tsx`, `pxj-first-screen.ts`, `sil-language.ts` (all within §08) and two new test files:
- F-RF-1: after SUCCEEDED the URL gets the interface's mode (`declaredModeRef` removed);
- F-RF-2: the URL's analysis is state, replaced by every SUCCEEDED analysis;
- F-RF-3: the optional input `pendingSelection` gives JOB_CHECKING (no offer) and JOB_INVALID (job and reason; the offer only when the analysis's job is another);
- F-RF-5: the shell detail ends with the role id.

**Result (STAND_IN, `sweep-a9ff0ca-vs-88539d3.txt`): the four findings are fixed, nothing else moved.**
- **F-RF-1 PASS.** The same sequence: the URL keeps PERSON, the session shows MODE_MISMATCH, and so does the reload.
- **F-RF-2 PASS.** a: while A2 runs and after it FAILED the screen shows A1 (the URL's) with its coverage, as the reload does. b: the screen shows A1, no longer A0.
- **F-RF-3 PASS.** CHECKING held 7 s: no offer at any of the 20 samples, then VALID. INVALID, all three causes: the Job Field offer is JOB_INVALID with the reason (ROLE_NOT_IN_POOL, POOL_NOT_ACTIVE, UPLOAD_NOT_FOUND); "No job is selected" is gone.
- **F-RF-5 PASS.** The twins now read "… · PINK role-field closure pool · role_pink_twin_a" and "… · role_pink_twin_b"; under PERSON "selected job not used: <title> · <role id>".
- **Every other step of the sweep is unchanged** against `a9ff0ca`, apart from the role id in the shell: X-01 … X-12, X-15, X-19 … X-21, X-23, X-24. X-16: the reload equals the session in every step now, including X-13 and X-14.
- **Pure functions** (`pure-and-proof-88539d3.txt`): stage 1b on the :41862 bodies identical to `50776fc`; NO_PROJECTION still 0 legacy capabilities; `pendingSelection` gives JOB_CHECKING / JOB_INVALID only without a VALID selection and never overrides one. PINK's NO_PROJECTION proof test is green.

**G1 again (`g1-walk-STANDIN-88539d3.txt`, `role-level-and-person-49e2bc6-vs-88539d3.txt`, `suite-88539d3.txt`).** PINK's G1 walk at 1920 and 1280: all 20 steps equal to `50776fc`; PA-01 field-equal, session = deep link = reload, focus changes nothing, `/matches` never with the Capability Field active, 0 `gemini-*`. PERSON session equal to `49e2bc6`, role level 26/26 identical. tsc: only `relay-check.mts`. Suite: all 86 G1 tests green; 31 failed = the 27 of `50776fc` plus 4 timeouts (5000 ms) in the outcome-valence / decision-core files of §3.57. **PA-01 … PA-14 still hold.**

**X-22 (`x22-back-forward.txt`): INCONCLUSIVE for the goal, but a pre-existing effect found (O-RF-2).**
- Back leaves `/career/demo` for the previous document (B-NAV).
- Forward loads the page again (`pageshow.persisted` false). In 2 of 3 cases it then sent **no API request for 20 s** and stood in the initial states (selected job CHECKING, first screen RESULT_LOADING or none); the reload heals it. The third case loaded normally.
- The same happens on `49e2bc6` (job CHECKING, 0 requests), so it is not G1 and not the fixes. A production build could not be checked: `next build` fails at type check on `app/api/admin/proxy/[...path]/route.ts` (pre-existing).

**Run record.** `evidence/role-field-closure-88539d3/`: `static-88539d3.txt`, `sweep-STANDIN-88539d3.txt`, `sweep-a9ff0ca-vs-88539d3.txt`, `pure-and-proof-88539d3.txt`, `g1-walk-STANDIN-88539d3.txt`, `role-level-and-person-49e2bc6-vs-88539d3.txt`, `suite-88539d3.txt`, `x22-back-forward.txt`, `scripts/*.txt`, `manifest.sha256`. PINK's labs on port 41873, stopped; the production-build attempt wrote only `.next` of PINK's worktree (ignored). :41862, :41871 not touched; no Gemini call.

### 3.60 Full PxJ closure: candidate GRÜN `421e382` (N-1 … N-5 on `88539d3`), on PINK's stand-in lab and GET-only on the owner acceptance lab (2026-10-23)

**Request.** Owner mandate "SYNTX::SFE::OWNER_GO_FULL_PXJ_CLOSURE" §06 / §07.9, relayed by GELB.
- PINK confirms the final candidate independently on its own stand-in lab (movements, error cases, pool switches).
- PINK checks the chain POOL → ORG → ROLE_OPEN → SELECT_AS_JOB → SOURCE_BINDING → analysis → CAPABILITY_FIELD → B2 → evidence → RELOAD → BACK → FORWARD → ROLE / POOL / MODE switch, forwards, backwards and inverse.
- On GELB's owner acceptance lab :41872 (production build of `421e382`, copy of the 41862 DB, no worker, no Gemini, no token) PINK reads with GET only.
- GELB added two cases:
  - (a) in-page Back / Forward while a run is going;
  - (b) a reload during a second run over an analysis on view.

**What changed (`static-421e382.txt`, CODE_INSPECTION).** Fast-forward of `88539d3`, six commits, 35 files. All of them are in `app/`, `lib/career/ui/`, `test/` or `docs/`. There is no API, DB, worker or script file, no new fetch and no non-GET call. The leak scan of the added lines is clean.
- N-1 B-NAV: one URL parser for a reload and for popstate. On popstate the dashboard is remounted. A user decision is a push, a system addendum is a replace, one action is one entry, and an unchanged URL writes nothing.
- N-2 B-RUN: `analysisJobId` is only taken in the server's format and only when it stands once. It is followed by GET only. FAILED and 404 keep the parameter, show a banner and offer no retry.
- N-3 O-RF-1: an unknown, empty or repeated mode is removed by replace.
- N-4 F-RF-4: a comment.
- N-5 B-SRC: a fixed hint while sources are staged.

**Result, STAND_IN, production build (`nav-STANDIN-prod-421e382.txt`): 88 / 90, every check of the candidate passes.** The two failing steps, C15 and C18, are PINK probe errors:
- C15 read the analysis from an element that is not mounted in the Capability Field; the URL and state are right.
- C18 looked for the clear button at field level; it is offered at role level.
- Clearing the job is covered by the acceptance lab (B07 PASS) and by the sweep (X-04).

The production build is the local `next start` with LAB_ONLY_BUILD_FLAG, `Cache-Control: no-store`.
- **Chain, one entry per decision.** Each step adds exactly one history entry: pool, organisation, role, "select as job" and Capability Field; Capability writes focus and observation together. Repeating the selection or choosing the mode already active adds none. Staging a source adds none.
- **Analysis.** During the run `analysisJobId` stands in the URL by replace, without a new entry. One POST is sent. On SUCCEEDED, `analysisId` is set and `analysisJobId` removed; the first screen is AVAILABLE, bound to the analysis, with rows and quotes, and a row takes focus. The reload is field-equal.
- **Switches.** Modes PERSON → JOB → PERSON_X_JOB add one entry each. The role switch gives ROLE_MISMATCH. The pool switch selects the same role id in the other pool and also gives ROLE_MISMATCH. The offer's "select this role" adds one entry and leads to AVAILABLE.
- **History.** 22 × Back and 22 × Forward, all of them PASS: 44 / 44 equal to a fresh load of the same URL in a second tab. The comparison covers URL, mode, field, gate, job and its text, observation, first screen, binding, counts, rows, quote doc ids, sha256 of the first-screen text, offer and error banner. No step sent a POST. The document boundary is included: the last Back loads `/career/analyses` as a document, the first Forward loads `/career/demo` as a document, and that entry is also equal.
- **Inverse.**
  - FOO, empty, repeated and lowercase modes are removed without a new entry; the default is PERSON_X_JOB.
  - A valid PERSON_X_JOB without scope stays "no job".
  - An unknown role, the archived pool and an unknown upload give INVALID; a malformed pool gives no AVAILABLE.
  - The other pool with the same role id gives ROLE_MISMATCH; an unknown analysis gives RESULT_NOT_FOUND.
  - Five malformed `analysisJobId` values and a repeated one are removed, with 0 job reads.
  - An unknown job gives NOT_FOUND with the job id and no retry; the analysis on view stays.
  - A SUCCEEDED job in the URL leads, with 0 POSTs, to its analysis.
- **B-RUN.**
  - A reload during RUNNING: GET only (one job read), 0 non-GET, one POST in all, AVAILABLE afterwards, history unchanged.
  - A reload after FAILED: the banner shows FAILED with the job id and no retry; A0 stays on view and in the URL (F-RF-2).
- **(b) PASS.** A reload during a second run: meanwhile `analysisId=A0`, the binding A0 and AVAILABLE, with `analysisJobId` in the URL. On SUCCEEDED, A2 replaces A0. One POST.
- **(a) PASS.** Back / Forward during a run. The PERSON entry pushed during the run carries the job id. Back and Forward are each equal to a fresh load, with the polls held 4 s in both tabs. After SUCCEEDED, Back to the earlier entry follows the job and shows its analysis, again equal to a fresh load. One POST, 0 non-GET during navigation.
- **N-5.** The EN hint reads exactly "Staged sources live in this page only: reloading, Back or Forward discards them. Nothing is stored." After a reload, Back or Forward there are no staged sources and no hint. The DE copy was checked by code inspection only.
- **X-22 / O-RF-2 in production (`x22-prod-421e382.txt`).** In 3 / 3 cases Forward shows, after 1 s and after 20 s, what the reload shows. `pageshow.persisted` is false and 5 to 6 API reads follow. The O-RF-2 stall stays a next dev effect, as GELB found (`no-cache` under dev, `no-store` under `next start`).

**next dev (`nav-STANDIN-dev-421e382.txt`, `repro-AB-dev-vs-prod.txt`): DEV_ONLY, no finding.** The dev run had 82 / 90:
- three PINK probe errors: C15, C18 and I22, where 2.5 s after the reload dev had not yet drawn the first screen; I22 is PASS in production;
- five NAV ≠ RELOAD entries:
  - (A) Back onto the other-pool entry showed for ≥ 1.2 s the previous entry (AVAILABLE, DLL);
  - (B) entries with organisation or role but no `focus` showed the field level on the fresh load.
- The targeted repro sampled each case at 1, 3, 8 and 15 s:
  - under dev the fresh load reaches the same observation after 3 to 8 s, and in (A) Back reached the right state (ROLE_MISMATCH, RF pool) after 3 s;
  - in the production build both cases are stable and equal to the reload from 1 s on.
- GELB found the same in its own production lab (:41876, writable copy).
- These are load and compile delays of next dev, not defects of the candidate.

**Owner acceptance lab :41872, PERSISTED_REAL_RESULT, GET only (`accept-41872-*.txt`, `lineage-41872-api.txt`).**
- **API lineage.**
  - The B2 binding is ANL_1792628993472_10 / JOB_1792628993472_10, JPOOL_B94850C4… / role_kestrel_fullstack, scope hash `8016b7c1…`, RUN_6BB62BDC…, CONV_A30D955F… and TRPREV_3B6311C8…. The pool sha256 matches the upload id.
  - B2 is SELECTED_ROLE_COVERAGE_V1 with 9 requirements: 8 COVERED, 1 NOT_COVERED (req_07), 8 proposals. Every proposal is EXACT and SOURCE_MATCH_VERIFIED; scored = false, authority NONE, relation NOT_EVALUATED (VERIFIED_CAPABILITY_SNAPSHOT_ABSENT).
  - `/investigation` gives PERSON_X_JOB with the same run and hash.
  - The job is SUCCEEDED → the same analysis. The other analysis is PERSON.
  - The source bundle CSB_JOB_1792628993472_10 has no GET route; for PINK it is **INCONCLUSIVE**, stated by GELB from a read-only DB transaction.
- **Browser, 1920 × 1080: 58 / 58 PASS. 1280 × 720: 57 / 58.**
  - Each run had 522 requests, all GET. 0 requests were blocked (the probe aborts every non-GET), with 0 page errors and 0 inspector reads.
  - Steps covered:
    - the owner deep link and its reload (AVAILABLE, 9 rows, 8 COVERED, req_07 NOT_COVERED, 8 verified quotes, no percentage or score outside the quotes);
    - 3 × Back / Forward over the document boundary, hydrated and equal to the deep link;
    - mode, role, offer and clear-job decisions, one entry each;
    - 11 × Back and 11 × Forward, each equal to a fresh load;
    - the inverse cases (modes, no scope, unknown role or upload, PERSON analysis → MODE_MISMATCH, unknown analysis → RESULT_NOT_FOUND);
    - the job cases (SUCCEEDED job → the same ANL by replace, unknown → NOT_FOUND without retry, malformed or repeated → removed with 0 job reads).
- **O-PXJ-720, confirmed independently, owner decision.** At 1280 × 720 the B2 panel stands at 885,485 – 1256,925, 53 % visible without scrolling. Its scrollHeight is 2059 at clientHeight 438, the page's 1021. GELB reports the same layout since G1.

**Regression (`regression-88539d3-vs-421e382.txt`, STAND_IN, dev).**
- **Role-field sweep:** no failed step. Only the intended changes appear: `analysisJobId` during the run; after the reload of a FAILED A2 the FAILED banner while A1 stays; FOO removed (X-20c); X-22 now in-app, Forward correct after 574 ms.
- **G1 walk, PA-01 … PA-14, at 1920 and 1280:** 20 / 20 steps, field-equal to `88539d3` apart from the staged-sources hint.

**Suite (`suite-421e382.txt`).**
- tsc as on `88539d3`: `relay-check`. The second message is from generated `.next/types` left in PINK's worktree (proxy route B-3).
- Whole isolated suite: 2786 passed, 38 failed (31 on `88539d3`).
  - The 9 new failures are 5000 ms timeouts (5016 – 5620 ms) in outcome-valence files the candidate does not touch.
  - Rerun alone: 30 / 33 pass, the remaining 3 also time out at 5000 ms.
- `test/career/pxj-first-screen`: 13 files, 127 / 127.

**Observation for the owner, not a failure: O-NAV-SUBMIT (I24).**
- Back within ≈ 0.3 s of ANALYZE, while the POST is still on its way, leaves a server job that no history entry names.
- The released controller drops the 202. The job runs to SUCCEEDED and its analysis is persisted (listed in `/api/career/analyses`), but no entry of the session shows it. Back and Forward are each equal to a fresh load.
- A reload during SUBMITTING has the same outcome class: no `analysisJobId` has been written yet.

**Verdict.**
- **PASS on PINK's stand-in lab (production build).** Chain, NAV ≡ RELOAD including document boundaries, B-RUN with (a) and (b), O-RF-1 and B-SRC all pass.
- **PASS on the acceptance lab (GET only, real persisted data)**, except E01 at 1280 × 720 (O-PXJ-720, owner).
- **INCONCLUSIVE:** CSB via GET, and the DE hint in the browser.
- **Owner:** O-PXJ-720, O-NAV-SUBMIT, B-3 (proxy-route type error), integration.

**Run record.** `evidence/pxj-full-closure-421e382/`:
- README.txt, static-421e382.txt, suite-421e382.txt;
- nav-STANDIN-dev-421e382.txt, nav-STANDIN-prod-421e382.txt, repro-AB-dev-vs-prod.txt, x22-prod-421e382.txt, regression-88539d3-vs-421e382.txt;
- accept-41872-PERSISTED_REAL_RESULT-1920.txt and -1280.txt, lineage-41872-api.txt;
- LAB_ONLY_BUILD_FLAG.txt (next.config.ts sha256 committed = restored `bf55df41…`, lab only `78a45603…`, diff);
- scripts/ and manifest.sha256.

No quote text and no screenshot is committed; first-screen text appears only as sha256/16. PINK's labs on :41873 are stopped by `stop-lab.sh` (its stop drops the lab's disposable DBs; no state file is left, no listener on :41873 / :41874). :41872 was only read.

### 3.61 UX pre-sweep on `421e382` for the owner mandate "RECURSIVE UX/UI & SYSTEM CLOSURE" — findings only (2026-10-23)

**Request.** GELB asked for an independent pre-sweep, findings only and no fixes; the list goes to GRÜN as the P3 fine list. It covers:
- the keyboard journey;
- focus and hover;
- viewports 1920×1080, 1600×900, 1440×900, 1280×720 and 200 % zoom (overlap, clipping, real clickability);
- readability (type size, contrast, long names, colour-only meaning);
- loading, empty and error states and their next step.

**Labs.** PERSISTED_REAL_RESULT on GELB's :41872, GET only: every non-GET is aborted in the browser; 0 were blocked and there were 0 page errors. STAND_IN on PINK's own production build of `421e382` with LAB_ONLY_BUILD_FLAG; there ANALYZE, the empty start, `.md` staging and a synthetic long-names pool were added. Screenshots mask every quote.

**Findings (`findings.txt`).** Fifteen findings, V-01 … V-15, each with viewport, step, measured value, screenshot and evidence class. The ones that block an action or a reading:
- **V-01.** The fixed Decision Graph Inspector covers "+ ENTER TEXT / MARKDOWN" at 1280×720: 0/5 points are clickable, even after scrolling. At 200 % of 1920 it covers "+ UPLOAD PDF" (1/5).
- **V-02.** At 200 % of 1280×720 the JOB mode is clipped at x 733 > 640 and cannot be reached by pointer. The shell title runs under its buttons, and the job indicator shows only "J".
- **V-03.** O-PXJ-720 extends to 1440×900: 94 % of the panel is visible, but the first row lies below the fold. At 200 % zoom the visible share drops to 13 % and 0 %.
- **V-04 / V-05.** The reason for the closed Capability gate is only a title on a disabled button, which keyboard and screen-reader users cannot reach. During CHECKING it names the wrong reason.
- **V-06.** NO_ANALYSIS, RESULT_NOT_FOUND and the job NOT_FOUND banner offer no next step.

Type sizes go down to 7.5 px (V-09). Contrast is computable only partly (V-10); most field text sits on gradients. Also found: Tab order at role level (V-11), the mode radio group reachable only with Arrow keys (V-12), missing hover feedback (V-13), a 23 px target (V-14), and truncation without the full text (V-15).

**Held.**
- No focus trap; the focus indicator is present on every focused element.
- 600 Tab presses per lab without a URL or history change (FOCUS ≠ SELECTION); hover never changed URL or history (HOVER ≠ AUTHORITY).
- Esc returns level by level and closes the pool list.
- The journey can be done by keyboard, from POOL to ANALYZE and RETURN.
- Every B2 row carries a COVERED / NOT COVERED text chip.
- No horizontal page scroll at any viewport.

**Run record.** `evidence/ux-presweep-421e382/`: findings.txt, keyboard.txt, viewports.txt, readability.txt, states-hover-names.txt, shots/ (20 JPEGs, quotes masked), scripts/ and manifest.sha256.

### 3.62 §10 validation of GRÜN's final candidate `41dfa25` (code `4b826cc`) for "RECURSIVE UX/UI & SYSTEM CLOSURE" (2026-10-24)

**Request.** GELB asked for an independent §10 check of `41dfa25` on `frontend/pxj-ux-closure` (22 commits on `70d1cb4` = `421e382` + B-3), with a verdict per item and the evidence classes kept apart. It covers:
- V-01 … V-15 from §3.61;
- K-UX-2 (PERSON changes visually, not in markup);
- O-NAV-SUBMIT on PINK's stand-in lab;
- D-PICK;
- V-12;
- the held items and the keyboard journey.

**Labs.** PERSISTED_REAL_RESULT on GELB's :41872 (production build of `41dfa25`, DB copy), GET only: every non-GET is aborted in the browser, 0 were blocked and there were 0 page errors. STAND_IN on 14 fresh PINK production builds of `41dfa25` and `70d1cb4`, without LAB_ONLY_BUILD_FLAG: `next.config.ts` was unchanged and the logs show no type-check skip. Static checks ran on `git archive` trees in PINK's scratch.

**Static: PASS.**
- Frontend only: no backend, API, DB, config or package file.
- tsc reports 0 errors; GRÜN's focused group passes 57 files, 498 passed, 4 skipped.
- Counter-proof on `421e382`: 43 of 60 fail and 17 pass, as GRÜN reports. GELB's 16 files / 45 / 18 was not reproduced.
- One existing literal changed (K-UX-3).

**Verdicts (`verdicts.txt`).**

PASS:
- **V-01.** ENTER TEXT is 5/5 clickable at 1280×720; both source actions are 5/5 after scrolling at every viewport.
- **V-02.** JOB mode is in view at 640×360.
- **V-03.** Wheel-scrolling in 60 px steps brings all 9/9 B2 rows fully into view and hits them at every viewport. With 240 px steps at 640×360 the result is 8/9, a step artefact that confirms GELB's note.
- **V-04.** The gate cause and the way out are visible text, linked by `aria-describedby`.
- **V-06.** Each state names its next step; the job NOT_FOUND banner closes with one push and no POST, and Back names the job again.
- **V-07**, **V-12** (arrow keys move focus only; Enter or Space choose), **V-13**, **V-14** and **V-16**.
- **V-05**, with one rest R-05: the `title` tooltip still says "Select a job … first" during CHECKING and INVALID.

PARTIAL:
- **V-09.** Role cards stay at 7.5 / 8.5 px (owner sizes); 9.5 px labels remain in the field and in the mode group at 200 %.
- **V-10.** Receded role titles are still 1.02:1 (owner item).

UNCHANGED: **V-15**, which the candidate did not address.

FAIL:
- **V-08 (D-S10-1).** The candidate is meant to drop RETRY for a broken PDF, but RETRY still appears. The running worker reports the failure as `EXECUTION_FAILED`, with `ERR_PDF_PARSE_FAILURE` only in the summary. `d8d97b8` checks `code === "ERR_PDF_PARSE_FAILURE"`, which is never true with the real worker. `.md` / `.txt` staging and the refusal of `.docx` work.
- **V-11.** The keyboard path got longer. The same probe on base and candidate needs 14 → 21 Tab presses from Enter on the role to SELECT AS JOB, and 4 → 11 when the role view loads. The shell and header now come before the Job Field panel in Tab order. Inside the panel, UX-02 holds.
- **K-UX-2.** The T-07 part passes: the Capability Field under PERSON is identical apart from a new `data-sx-layout` attribute on the dashboard wrapper. But the Job Field shown under `investigationMode=PERSON` changes text (UX-07 wording), elements (LEVEL, job hint, OPENED ROLE) and order. GRÜN's README §3 claim does not hold there. Whether the Job Field belongs to the PERSON perimeter is for GELB or the owner to decide.

**O-NAV-SUBMIT (STAND_IN).**
- **In-page: PASS.** Back 0.03–0.15 s after ANALYZE, with the POST held 1.5 s or not, and Back followed by Forward, all give 1 POST and 1 analysis. The analysis is named by replace in the entry on view, and B2 is AVAILABLE there.
- **Observation.** When that entry has another boundary, the job is named there: a PERSON entry then shows MODE_MISMATCH, and an entry for another job shows ROLE_MISMATCH.
- **FAIL across the document boundary (S6).** Example: the owner's deep link is the first entry, and the user presses Back 0.06 s after ANALYZE. The analysis is made, and no history entry names it. This is the same class as a reload during SUBMITTING, which is an open owner decision.

**D-PICK: PASS, stand-in and real.**
- Only the exact mode, upload and role are offered. The RF upload with the same role id and the same pool with another role never cross.
- PERSON and JOB show no picker and make 0 boundary reads.
- Nothing is read before the picker opens, and opening chooses nothing.
- OPEN is one push (`analysisId`, `focus=CAPABILITY`) to B2 AVAILABLE, and Back removes it.
- On :41872 only `ANL_1792628993472_10` is offered, never the PERSON analysis.

**Regression: PASS.**
- nav 88/90, the same two probe errors as `421e382`.
- rf 54/54.
- g1 states are identical; X-22 is identical.
- 600 Tab presses per lab without a URL or history change, trap or hidden focus.
- Hover never acts as authority; Esc steps back one level at a time.

**New findings.**
- **V-18.** From 1280×720 down, every role card switches to the packed form, and its domain line leaves the DOM. Base `70d1cb4` still showed it at 1280×720.
- **V-19 (FAIL, real and stand-in).** At 1280×720 the organisation level puts the "Senior Full-Stack Engineer" card under the Job Field panel. The mouse hits it 0/5 in 6 samples, in PXJ and PERSON; base `70d1cb4` hits it 5/5. The owner's ORG → ROLE_OPEN step cannot be done by mouse at that size; the keyboard still works.
- **Observation.** In the job NOT_FOUND state at 1920 the RUNTIME TELEMETRY box sits over the lower B2 rows. Not compared with base.

**Run record.** `evidence/ux-closure-41dfa25/`: verdicts.txt, static-MEASUREMENT.txt, real-41872-PERSISTED_REAL_RESULT.txt, standin-STAND_IN.txt, person-dom-K-UX-2-STAND_IN.txt, regression-STAND_IN.txt, shots/ (15 JPEGs; REAL ones have quotes masked or none on view, STANDIN ones are labelled), scripts/ and manifest.sha256.

### 3.63 Review of GELB's isolated proof "CAPABILITY_TO_JOBPOOL_DISCOVERY" (`bf80a7d`) (2026-10-24)

**Request.** Owner directive PRIORITY PRODUCT_CORE. GELB asked for an independent check of the proof in §5 and the code reconstruction in §1 of `CONDYN_CAPABILITY_TO_JOBPOOL_DISCOVERY_2026-10-24.md`, with five points:
1. re-run;
2. inverse check down to the quote;
3. honesty of the relation kinds;
4. the §05 cases;
5. the code reconstruction.

**Method.** GET only on GELB's disposable lab :41878; PINK uploaded nothing and made no Gemini call. Evidence classes are DETERMINISTIC (computation on PERSISTED_REAL_RESULT), live GET and CODE_INSPECTION. Quotes are never written to the evidence, only their sha256 prefix.

**Verdicts (`evidence/discovery-bf80a7d/verdicts.txt`).**
- **1 PASS.** Both runs reproduce exactly; the whole JSON equals GELB's evidence.
  - PERSON: 78 roles, 507 requirements; PARTIAL 39, NO_RELATION 38, NO_REQUIREMENTS 1; inverse 52/52.
  - PxJ: NO_RELATION 64, PARTIAL 9, ALL 4, NO_REQUIREMENTS 1; inverse 27/27.
- **2 PASS.** The inverse check is PINK's own code, independent of `findSweepCoverage` and GELB's script.
  - Every proposal exists, every quote belongs to its proposal, and every quote is verbatim in the pdftotext text.
  - In 49/52 the quote names the requirement. The rest: "Backend Development" ×2, where "backend" appears only in the proposal name, and the "domain" part of "Dimensional and Domain Data Modeling".
- **3 FAIL (labels).** The relation and status labels can mislead:
  - 29 of the 39 PARTIAL roles rest on weak token hits only, 25 on a single one (mostly "Python" ← "Python ETL Development", including requirements aliased PyTorch / FastAPI / R).
  - In the same proposal "TypeScript and Node.js Backend Development", TypeScript is NAME_COMPOSITE_CONSTITUENT but Node.js only WEAK.
  - WEAK understates head-term hits (Kubernetes, PostgreSQL, React) and overstates one-word overlaps ("Linux Systems Engineering" ← "Linux Administration", the alias "ETL").
  - Lexical misses confirm G-2: SQL ×10, "CI/CD Pipelines" missed only because of the plural against "CI/CD Pipeline Engineering", TDD against Automated Testing / Test Automation, and leadership and architecture variants.
- **4 PASS.**
  - The role without requirements is NO_REQUIREMENTS, and duplicate role ids and titles are kept apart by (upload, role) across 4 pools.
  - Requirement ids also repeat across uploads (`req_kestrel_fullstack_01/02`), so a route must key requirements by upload + role + requirement.
  - "Python" carries 7 different alias sets and collapses onto one proposal.
- **5 FAIL (gap).** The blocks listed in §1 hold: matches refuses PERSON (live 409) and carries `resonanceScore`, the relation producer needs PHASE4_VERIFIED and has no app caller, and the embedding search exists but has no importer. Two gaps:
  - **M-1, missed.** `GET /api/career/analyses/{id}` runs the legacy scored engine `matchCareerAnalysisAgainstPool(analysis, DEMO_COMPANY_POOL)` plus recommendations for every analysis, PERSON included. Live for ANL_…_456: pool `pool_demo_master_v1`, 3 roles with `resonanceScore`, 6 gaps, 5 actions. A PERSON analysis is therefore already compared with roles, scored and ordered; D-RD-1 must name this path.
  - **M-2, INCONCLUSIVE.** The admin proxy forwards to an external backend that cannot be inspected from this repository.

**Run record.** `evidence/discovery-bf80a7d/`: verdicts.txt, 1-rerun.txt, 2-inverse.txt, 3-relations.txt, 4-cases.txt, 5-code.txt, 5-live.txt, scripts/ and manifest.sha256.

### 3.64 Round 2: GRÜN `b77c851` (code `9a8a28e`) re-checked against §3.62 (2026-10-24)

**Request.** GELB asked for a targeted re-check of round 2, 9 commits on `41dfa25`. It covers:
- the §3.62 FAILs: V-08, V-11, V-18, V-19 (card hits plus mouse-wheel reach);
- R-05 and V-15;
- V-20 at 1920 in the job NOT_FOUND state;
- K-UX-2: the PERSON first screen;
- regression of the held items, D-PICK and navigation;
- GRÜN's claim about 200 %.

Back across the document boundary during SUBMITTING (S6) stays an open owner class and is not counted as FAIL.

**Labs.**
- PERSISTED_REAL_RESULT on :41872, a production build of `b77c851`, GET only; 0 non-GET blocked in every probe.
- STAND_IN on 9 PINK production builds without the flag, `b77c851` and `70d1cb4`.
- No Gemini call.

**Verdicts (`evidence/ux-closure-r2-b77c851/verdicts.txt`): every item PASS.**
- **Static.** tsc reports 0 errors; the focused group passes 63 files, 514 tests, 4 skipped. The counter-proof of the 6 new files on `41dfa25` gives 10 FAIL, all REPRODUCE, and 6 PASS. Note: `job-levels.test.tsx` drops 5 expectations and adds 1. That is consistent with restoring `70d1cb4`'s order, but not a 1:1 replacement.
- **V-08.** With the real worker the result stays `EXECUTION_FAILED`; there is no RETRY, the format way is shown, and there is 1 POST.
- **V-11.** The same probe gives 14 Tab presses from Enter on the role and 4 on loading the role view, equal to `70d1cb4` (`41dfa25` had 21 / 11). The real lab gives 14 / 4.
- **V-18.** Every role card keeps its domain line at all 6 viewports.
- **V-19.** At 1280×720 the owner's card is hit 5/5, as on `70d1cb4` (`41dfa25` had 0/5). Frontend Architect 2/5 is the same as on `70d1cb4`.
- **GRÜN's 200 % claim, confirmed.** Scrolling with the mouse wheel, `70d1cb4` reaches only 3/5 on the Full-Stack card at 640×360; `b77c851` reaches 5/5 on every card, stand-in and real.
- **V-20.** In the job NOT_FOUND state the HUD and B2 overlap 0 px² at all four desktop viewports, and all 9 rows are hit.
- **R-05.** The tooltip equals the visible cause and the way out.
- **V-15.** Every visibly cut long name carries its full text. Retraction: the earlier item "syntx-summary cut without title" in §3.61 / §3.62 was a PINK probe false positive. That element is the visually hidden aria-live summary.
- **K-UX-2.** The PERSON first screen is identical to `70d1cb4` apart from `data-sx-layout`, and T-07 is green. The Job Field shows the declared UX changes in every mode, and GRÜN's README §3 now lists both.
- **D-PICK** and **O-NAV-SUBMIT in page** behave as in §3.62.
- **Regression.** nav 88/90 with the same two probe errors as before. 600 Tab presses without a violation; hover is look-only; the Esc chain holds; no target is under 24 px; reach holds at all six viewports.

**Still open.** S6 is an owner decision. At 640×360 the binding section and status line lie below the fold on load (GELB's 113/114).

**Run record.** `evidence/ux-closure-r2-b77c851/`: verdicts.txt, static-MEASUREMENT.txt, real-41872-PERSISTED_REAL_RESULT.txt, standin-STAND_IN.txt, person-dom-K-UX-2-STAND_IN.txt, shots/ (4), scripts/ and manifest.sha256.

### 3.65 Stage 1 POOL_ROLE_DISCOVERY_V1 and the relation cache (`ccc0cc1`) checked independently (2026-10-24)

**Request.** GELB asked for an independent check of `backend/pool-role-discovery` (`96651af` route, `ccc0cc1` cache; base `b77c851`, not integrated) against the owner decision "OWNER_DECISION_ROLE_DISCOVERY", in six points:
1. contract;
2. the §3.63 findings;
3. inverse trace through the route;
4. read only;
5. cache;
6. regression.

The owner's own text is not in the repository; PINK checked against its rendering in §8/§9 of the discovery doc (`ea3c845`) and GELB's request.

**Method.** GET only on :41878, a production build of `ccc0cc1` on a disposable copy; PINK uploaded nothing. The cache probe ran as a scratch-only test on a fresh disposable database. No Gemini call.

**Verdicts (`evidence/role-discovery-ccc0cc1/verdicts.txt`).**
- **1 Contract: PASS.**
  - Only the named uploads are compared: single, several and permuted requests give identical results. "ALL" gives 404; a missing parameter, duplicates, an empty or whitespace value and 11 uploads each give 400.
  - The PERSON operand is unchanged against the analysis projection. PxJ is refused with 409.
  - The authority block says no score, no ranking and no decision. Everything semantic is NOT_EXECUTED, and the plan says ENGINE_NOT_SPECIFIED.
- **2 §3.63 findings: PASS.**
  - My old PARTIAL 39 splits into PARTIAL_NAME_RELATED 10 and WEAK_LEXICAL_ONLY 29.
  - The key (upload, role, requirement) is unique, and all 507 rows equal §3.63.
  - `quoteNamesRequirement` is false exactly for the three rows. The TypeScript / Node.js asymmetry remains, because the lexical rule is unchanged.
- **3 Inverse via the route: PASS.** 52/52 down to the quote in the PDF text.
- **4 Read only: PASS.** The route has no write path, the counts are unchanged, there is no model client, and refusals carry no partial result. On a process's first GET the guarded registration may create the schema on the disposable database (existing pattern).
- **5 Cache.**
  - Keys **PASS**: independent of ids and order; content changes give new keys, and case and spaces count exactly.
  - Plan **PASS**: 5 070 pairs, 77 calls, 470 distinct requirement contents, 4 700 distinct keys, recomputed with PINK's own hash code.
  - DDL **PASS**: created only behind the disposable-database gate.
  - DB checks **PASS**: the database refuses an unknown state, a NULL state and any authority other than NONE.
  - Immutability **FAIL (D-RC-1)**: it holds in code only.
    - UPDATE and DELETE succeed on the database.
    - `record_json` is not tied to the checked columns: columns COVERS / NONE with JSON EQUIVALENT / VERIFIED are accepted.
    - `getByKeys` returns the JSON unvalidated.
  - Conditions for stage 3:
    - **C-1.** The key has no role context, so the engine must not see role context either, or the key must include it.
    - **C-2.** Re-storing an evaluated pair with another `createdAt` or raw output aborts with a conflict, so concurrent evaluations of one pair fail.
- **6 Regression: PASS.**
  - In `app/api` only the new route is added. `matches` for the PxJ analysis is identical to §3.63, and PERSON is still refused.
  - B2 answers 200 for PxJ and 409 for PERSON.
  - tsc reports 0 errors; GRÜN's focused list passes 67 files, 547 tests, 4 skipped. PINK counts 20 cache tests (16 + 4), where GELB names 17.

**Run record.** `evidence/role-discovery-ccc0cc1/`: verdicts.txt, route-PERSISTED_REAL_RESULT.txt, cache-MEASUREMENT.txt, static-MEASUREMENT.txt, scripts/ and manifest.sha256.

### 3.66 Relation-cache fix `2dba126` (D-RC-1, C-2) re-checked (2026-10-24)

**Request.** GELB asked for a targeted re-check of `2dba126` on `backend/pool-role-discovery`:
- a trigger against UPDATE, DELETE and TRUNCATE;
- CHECKs that bind `record_json` to the columns and fix the key and hash formats;
- a reader that admits every row again;
- first-wins writes (C-2).

C-1 is decided as a specification in §10 of the discovery doc (`e2c7191`): the engine sees no role or organisation text.

**Method.** Measurement on fresh verified disposable databases, with scratch-only probes. The probes ran on a fresh DB and on a table created first by `ccc0cc1`'s DDL. No Gemini call.

**Verdicts (`evidence/role-discovery-2dba126/verdicts.txt`).**
- **D-RC-1 on a fresh database: PASS.**
  - UPDATE, DELETE and TRUNCATE are refused with ERR_RELATION_CACHE_IMMUTABLE.
  - The database refuses JSON that differs from the columns, a bad key format and a bad hash format.
  - Rows the database admits but that do not hold, such as an empty explanation or a key not derived from its parts, are refused by the reader with ERR_RELATION_CACHE_RECORD_CORRUPT.
- **C-2: PASS.** The same result with another `createdAt` or raw output hash counts as a duplicate. Another result is reported as `divergent`, is not stored and raises no exception; the first record stays.
- **Tests: PASS.**
  - The subset passes 60 files, 479 tests, 4 skipped; `relation-cache.postgres` passes 7/7.
  - On `ccc0cc1` the same test file gives 6 FAIL and 1 PASS, as GELB reports; tsc reports 0 errors.
- **O-RC-3 (open).** A table that `ccc0cc1` already created gets only the new triggers, not the CHECKs, yet the registration reports REGISTERED. On such a table the database accepts JSON claiming VERIFIED and a malformed key. The reader still refuses those rows, but the database guarantee holds only on databases created from `2dba126` on.
- **O-RC-4 (observation).** One corrupt row fails the whole read for all requested keys.
- **O-RC-5 (recorded).** The table owner can still disable the trigger or drop the table.

**Run record.** `evidence/role-discovery-2dba126/`: verdicts.txt, cache-recheck-MEASUREMENT.txt, scripts/ and manifest.sha256.

### 3.67 Relation-cache convergence `600c7c1` (O-RC-3) re-checked (2026-10-24)

**Request.** GELB asked for a targeted re-check of `600c7c1` on `backend/pool-role-discovery`. The commit does three things:
- it names every constraint (`prr_*`) and adds any that are missing by ALTER;
- it verifies at registration, through `pg_constraint` and `pg_trigger`, that every guarantee exists;
- it fails the registration when an existing row violates a constraint.

O-RC-4 (fail-closed) and O-RC-5 (owner ≠ app role) are decided in §10 of the discovery doc (`427cac7`).

**Method.** One fresh disposable database per table history: fresh, created by `ccc0cc1`'s DDL, created by `ccc0cc1`'s DDL plus a row whose JSON claims VERIFIED, and created by `2dba126`'s DDL. Each runs `600c7c1`'s registration. The probes are scratch only, and there is no Gemini call.

**Verdicts (`evidence/role-discovery-600c7c1/verdicts.txt`).**
- **Convergence: PASS.**
  - The `ccc0cc1` and `2dba126` tables end with all 7 `prr_*` constraints and both triggers, exactly like a fresh table.
  - Every invalid insert and every UPDATE, DELETE and TRUNCATE is refused; a valid row is accepted.
- **Dirty table: PASS.** The registration throws, also on a second call, and the job pool application is refused, so nothing is reported as registered.
- **Tests: PASS.** The subset passes 60 files, 480 tests, 4 skipped; `relation-cache.postgres` passes 8/8. On `2dba126` exactly the O-RC-3 test fails; tsc reports 0 errors.
- **O-RC-6 (observation).** After a failed convergence the table stays half converged: 6 of 7 constraints, no trigger. The whole job pool persistence stays unavailable until the row is removed by hand. That is fail-closed, but it is worth a runbook line.
- **Note.** Old tables keep their auto-named checks next to the `prr_*` ones. The overlap is harmless.

**Run record.** `evidence/role-discovery-600c7c1/`: verdicts.txt, cache-converge-MEASUREMENT.txt, scripts/ and manifest.sha256.

### 3.68 Atomic relation-cache convergence `88ac5ed` (O-RC-6) and runbook re-checked (2026-10-29)

**Request.** GELB asked for a targeted re-check of `88ac5ed`, in which convergence and verification run in one transaction, and of the runbook in §10 of the discovery doc (`27a4e87`).

**Method.** Fresh disposable databases, one per case: a dirty `ccc0cc1` table, then fresh, `ccc0cc1`-clean and `2dba126`-clean tables. The route handlers were called in-process, as GELB's own `role-discovery.postgres` test does. The probes are scratch only, and there is no Gemini call.

**Verdicts (`evidence/role-discovery-88ac5ed/verdicts.txt`).**
- **O-RC-6: PASS.** A failed registration leaves exactly the previous state: 2 old checks, no `prr_*` constraint, no trigger, and the row is kept.
- **Repair path: PASS.**
  - The runbook's query finds the row, and DELETE succeeds.
  - The next registration in the same process reports REGISTERED with 7 `prr_*` constraints and 2 triggers, and the pool list answers 200 again. A restart is not needed.
- **Convergence regression: PASS.** Fresh, `ccc0cc1`-clean and `2dba126`-clean tables behave as in §3.67.
- **Tests: PASS.** The subset passes 60 files, 480 tests, 4 skipped; `relation-cache.postgres` passes 8/8. On `600c7c1` exactly the new test fails; tsc reports 0 errors.
- **Runbook effect: FAIL (R-RB-1).** The runbook says every job pool route answers 503 `ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED`. While the registration fails, PINK measured:
  - `GET /api/career/job-pools`: 500 `ERR_JOB_POOL_INTERNAL`, with the raw database message in the body.
  - Role discovery: 500 `ERR_ROLE_DISCOVERY_FAILED`.

  The registration throws instead of returning a non-REGISTERED verdict, so nothing maps it to 503. Either the code maps it to 503, or the runbook must say 500.

**Run record.** `evidence/role-discovery-88ac5ed/`: verdicts.txt, cache-atomic-MEASUREMENT.txt, scripts/ and manifest.sha256.

### 3.69 Recovery branch `recovery/role-discovery` (`08ae201`) validated independently (2026-10-29)

**Request.** Owner mandate "DLL FULL SYSTEM RECOVERY". GELB asked for an independent check of `08ae201`: base `175c481`, six Codex commits reverted, GELB's `backend/pool-role-discovery` merged up to `94e6028`, and four test files reset to `9112682`. No Codex claim was to be taken over unseen. Points:
1. the reverts;
2. the six-orbit PERSON contract and PxJ unchanged against `b77c851`;
3. the four reset test files;
4. no Gemini path on a GET;
5. GELB's classification of the Codex work in §2 (a–d) of `CONDYN_DLL_SYSTEM_RECOVERY_2026-10-28.md` (`ece6ace`).

**Method.** PINK used four kinds of evidence, kept apart:
- code inspection;
- the real result on :41878, GET only;
- stand-in production labs on `08ae201` and `b77c851`, with the stand-in model's call log counted;
- scratch probes on disposable databases.

Read-only metadata of the `_sfe` sandboxes, the main checkout and :3017 complete the picture. Process environments and `codex-home` were not read. No Gemini call.

**Verdicts (`evidence/recovery-08ae201/verdicts.txt`).**
1. **Reverts: PASS.**
   - Two reverts are pure; four leave out only hunks `175c481` had already removed, plus the Codex docs, which keep a SUPERSEDED banner.
   - The named files are byte-identical with `ccc0cc1` and `9112682` at `46e4a0b`. No Codex trace remains on `08ae201`, and every changed file traces to `94e6028`, `175c481` or a documented GELB edit.
   - **O-REC-1 (observation).** The RD-URL state in the field is unused (dead until stage 2).
2. **Six orbits / PxJ: PASS.**
   - PERSON shows shells 01–06, rays, the coupling and VIEW MATCHES on 03; a real click on 04 opens its cosmos.
   - PxJ shows only 01–02 and B2 AVAILABLE.
   - Stand-in `08ae201` equals `b77c851` in every scene at 1920 and 1280, and the PERSON DOM matches in 16 of 16 scenes.
   - g1 is unchanged, nav is 88/90, and s10 matches §3.64.
3. **Four reset test files: FAIL (narrow).** The 9 RD-5 inverses are rightly gone, and RD-5's component tests have field-level equivalents. The exception is "each Stage 03–06 component labels its empty projection in English and German". Its 4 checks pass on `08ae201`, yet no test covers the German empty projection of 03–06 any more. `career-demo-ui` and `first-screen-ssr` in their `175c481` versions hold every pre-RD-5 assertion.
4. **No Gemini on a GET: PASS.**
   - Providers are instantiated only in the worker and scripts.
   - A stand-in sweep over 15 read routes leaves the model calls at 6 → 6, twice.
   - The cache decoupling GELB asked for holds: the pool list returns 200 and the plan reports CACHE_UNAVAILABLE / not executable; repair works without restart.
   - The three suite files pass on `08ae201` with real `node_modules` (3/3, 71/71). The focused list passes 70 files, 566 tests, and tsc reports 0.
5. **Doc §2: PASS with two corrections and one INCONCLUSIVE.**
   - Confirmed:
     - (a) the `gruen` sandbox: 50 commits on stale `ee06ff6`, unpushed;
     - (c) the local-only branch, including the silent all-ACTIVE pool set, Gemini plus cache write plus ranking inside the GET, and the `?discovery=PERSON` bypass;
     - (d) :3017 runs from that branch at `175c481` with 0 analyses and 0 pools.
   - **Correction (a).** The sandbox role discovery builds on embeddings / semantic search ranked by `similarityScore`, not on the demo-pool engine.
   - **Correction (b).** The four untracked files in the main checkout are empty and date from 2026-08-31, so they predate Codex.
   - **INCONCLUSIVE.** :3017's Gemini key, model and database name, because PINK reads no process environment.

**Addendum (`164bade`).** Point 3 is now **PASS**. GELB restored the it.each block for the German and English empty-projection labels of components 03–06 verbatim from `175c481` into the six-orbit f12 file, with no RD-5 inverse back. The file passes 14/14, the four cases among them (`addendum-164bade.txt`). For :3017, GELB states that a model key is set. PINK did not read the environment, so in PINK's classes this stays INCONCLUSIVE; the risk is the owner's to weigh.

**Run record.** `evidence/recovery-08ae201/`: verdicts.txt, 1-reverts-CODE_INSPECTION.txt, 2-orbits-PERSISTED_REAL_RESULT-and-STAND_IN.txt, 3-test-coverage-MEASUREMENT.txt, 4-gemini-get-and-decoupling.txt, 5-doc-section2-CODE.txt, shots/ (2, real, no quotes on view), scripts/ and manifest.sha256.

### 3.70 Stage-3 semantic relation engine core `123604f` checked (2026-10-29)

**Request.** GELB asked for an independent, inverse check of `lib/career/job-pool/semantic-relation-engine.ts`, with the stand-in only and no Gemini, in four points:
1. C-1 on the real request;
2. strict admission, actively hunting bypasses of the claim guard;
3. exactly one attempt;
4. the stand-in's identity.

**Method.** A scratch probe ran with no database and no model. Its operands were the real PERSON proposals (read by GET from :41878) and the real requirements of 5 pool files, 86 roles and 586 requirements.

**Verdicts (`evidence/semantic-engine-123604f/verdicts.txt`).**
- **1 C-1: PASS.** The request carries only the proposals and the requirements under opaque ids `R1…`: no role, organisation or pool text, no requirement id, no domain, no necessity.
- **2 Admission.**
  - Structure **PASS**: every malformed, foreign, missing, duplicate or extra item fails the whole role, and stored quotes come only from the server.
  - Claim guard **FAIL (D-ENG-1)**: the English, word-bounded regex lets through full-width "％", percent in words, "87 Prozent", "0.87", "9/10", "8 out of 10", inflections (scored, ranks, recommends, hired, qualifies, qualification, verification), "competent", "good fit", every German claim tested, spaced letters and a Cyrillic "о".
  - Observations: O-ENG-1, a DIFFERENT or UNCLEAR pair without citation stores the proposal's first quote; O-ENG-2, the explanation has no length bound.
- **3 One attempt: PASS.**
  - Reservation, release and consumption behave as specified for a provider error, a refused output, an empty set and no budget.
  - O-ENG-3: if consumption or the writer throws, there is no defined outcome.
- **4 Stand-in: FAIL (D-ENG-2).** The stand-in labels its text but has no identity of its own. Run under the engine identity `gemini / gemini-3.1-pro-preview`, it stores records under the real engine's keys. That contradicts §5 of the spec; the provider must declare its identity, and a mismatch must be refused.

**Run record.** `evidence/semantic-engine-123604f/`: verdicts.txt, engine-probe-DETERMINISTIC.txt, scripts/ and manifest.sha256.

### 3.71 Role layer, engine hardening and investigation store on `c670b74` (2026-10-29)

**Request.** GELB asked for validation of `c670b74` on `recovery/role-discovery`. It combines GRÜN's role layer `fccaafa`, GELB's engine hardening `c3a6a22` from §3.70, and the investigation store with call ledger `d90b22d`. Points:
1. the role layer with real data and stand-in;
2. six orbits and T-07 against `b77c851`;
3. PxJ and the handover;
4. the §3.70 findings;
5. store and ledger.

**Method.** Four kinds of evidence, kept apart:
- real data on :41878, a production build of `c670b74` on a fresh 41862 copy with 4 pools, browser GET only;
- PINK stand-in production labs on `c670b74` and `b77c851`;
- scratch probes on disposable databases;
- code inspection.

No Gemini call.

**Verdicts (`evidence/role-layer-c670b74/verdicts.txt`).**
- **Static: PASS.** tsc reports 0 errors; GRÜN's list passes 78 files, 659 tests, 4 skipped; T-07 is green.
- **1 Role layer: PASS** with real data and stand-in, at 1920 and 1280.
  - The entry sits in the panel slot. Opening the panel changes neither URL nor history; nothing is preselected and there is no "all".
  - A release is one push and one read of exactly the named pools. Reload, Back and Forward give the same view.
  - The semantic line always reads "not executed". The CACHE_* forms show no numbers, and malformed plans are rejected by the decoder.
  - No fit, suitability or semantic-positive wording. The trace from requirement to basis, proposal, quote and source equals the API.
- **2 Six orbits / T-07: PASS.** The orbit scenes are identical to `b77c851`, also with the panel opened from the URL. With the panel open, VIEW MATCHES on hover over 03 and the click on 04 behave as before. The PERSON DOM matches in 16 of 16 scenes; g1, nav and s10 are unchanged.
- **3 PxJ / handover: PASS.** Under PxJ there is no entry or panel, even with a release in the URL; B2 stays AVAILABLE. "Gezielt untersuchen" is one push to PERSON × JOB with the role, no analysisId, no release and NO_ANALYSIS; no POST.
- **4 §3.70: PASS.** D-ENG-1, D-ENG-2 and O-ENG-1 to O-ENG-3 are closed.
  - **New D-ENG-3: FAIL.** The new guard over-blocks. It refuses 29 of 586 real requirement names on their own, across 26 roles; examples are certifications, qualifications, "Data Provenance", HL7, Neo4j, ISO and IEC numbers, and "Architecture Communication" through a cross-word stem. It also refuses neutral words such as "one", "improve", "approved" and "Frankfurt". One refusal fails the whole role.
- **5 Store / ledger.**
  - **PASS:** idempotency, also under 8 concurrent opens; forward-only tasks, also under a race; atomic reservation against both limits; 20 parallel reservations against a limit of 3 give exactly 3; a real provider with a day limit of 0 runs nothing.
  - **D-LED-1: FAIL.** The investigation status can go backward.
  - **D-LED-2: FAIL.** A release by an investigation without a reservation frees another investigation's day unit.
  - **O-LED-1 (observation).** A day limit lowered later the same day does not apply.
  - **O-LED-2 (observation).** Tasks and ledger rows can be updated backward or deleted on the database.

**Run record.** `evidence/role-layer-c670b74/`: verdicts.txt, measurements.txt, shots/ (2, real, no quote on view), scripts/ and manifest.sha256.

### 3.72 Claim guard, ledger direction and database guards on `6c65d0c` (2026-10-29)

**Request.** GELB asked for a re-check of `6c65d0c` on `recovery/role-discovery`, one commit on `c670b74` that fixes §3.71: a word-based, operand-aware claim guard (D-ENG-3), forward-only investigation status (D-LED-1), consume and release only on the own reservation (D-LED-2), the latest day limit (O-LED-1) and database guard triggers that the registration verifies (O-LED-2). GELB also asked whether any place in the UI would show these texts differently.

**Method.** Scratch probes on disposable databases via `test:isolated` (engine, store / ledger, guard registration, guard vs. rendering) and code inspection. No lab: the commit changes three files in `lib/career/job-pool` and two test files, nothing under app, components or the UI library. No Gemini call.

**Verdicts (`evidence/ledger-guard-6c65d0c/verdicts.txt`).**
- **Static: PASS.** tsc reports 0 errors. The job-pool group passes 26 files, 258 tests, 4 skipped (equal to GELB's figures); the §3.71 focused group passes 78 files, 675 tests. Counter-proof: the two changed test files fail 16 cases on `c670b74`.
- **D-ENG-3: PASS.** 0 of 586 real requirement names are refused and no role is affected. All 31 claims of §3.70 are still refused and all 23 neutral texts are admitted. Structural admission, C-1, the one-attempt outcomes and the identity guard are unchanged.
- **D-ENG-4 (new): FAIL, narrow.** The guard and the rendering diverge, so an admitted text can still show a claim:
  - operands are removed as raw substrings, so with the real alias "Go" the text "A good fit." is admitted;
  - invisible format and mark characters (U+034F, U+2061–U+2064, U+180E, variation selectors, tag characters) and bidi overrides with reversed text are neither stripped nor refused;
  - percent and ratio look-alikes (٪, ‰, ⁄, ∕) pass;
  - for a later Markdown or HTML rendering, also markup and entities.
  Cache rows are immutable, so an admitted text can never be corrected. Suggested: whole-word operand removal, refusing such characters, wider percent and ratio classes, and plain-text rendering in a later UI.
- **O-ENG-4 (observation).** Evaluative wording outside the lists is admitted ("Excellent fit", "Top candidate", "Rated 4.5 stars", "passendes Profil", "Die Person ist kompetent", 16 of 21). The extent of a list guard is an owner question.
- **UI (GELB's question): PASS, code inspection.** No UI file reads the explanation, the limitation, the relation states or the engine and store; both are imported only inside `lib/career/job-pool`. No surface shows these texts today, so none shows them differently. The difference that will matter when one does is D-ENG-4: the guard judges the text without its operands and invisible characters, while the browser shows it with them.
- **D-LED-1: PASS.** In the store and on the database (trigger), a backward step, an identity change and a delete are refused.
- **D-LED-2: PASS.** A foreign release or consume raises ERR_LEDGER_NO_RESERVATION; both rows stay unchanged.
- **O-LED-1: PASS.** A day limit lowered to 0 refuses the reservation and is committed although refused, never below what is outstanding.
- **O-LED-3 (new observation).** "Latest" means the latest call: a caller with the old configuration raises the day limit back to 5.
- **O-LED-2: PASS.** The triggers are present on all three tables. Delete, backward status and decreasing counters are refused, `session_replication_role` is denied, and a dropped trigger is re-created by the next registration.
- **O-LED-4 (new observation).** The registration does not notice a disabled trigger. A table owner can disable the trigger; the registration still reports REGISTERED, and a counter decrease and a delete then succeed. This also holds for the relation-cache triggers, since `600c7c1`.

**Run record.** `evidence/ledger-guard-6c65d0c/`: verdicts.txt, measurements.txt, scripts/ (four probes as .txt) and manifest.sha256.

### 3.73 Guard sees the rendered text, guard triggers cannot stay disabled, on `6823e93` (2026-10-29)

**Request.** GELB asked for a targeted re-check of `6823e93` on `recovery/role-discovery`. This one commit on `6c65d0c` fixes the two §3.72 items:
- **D-ENG-4.** Operands are removed only as whole words. Invisible, opaque and bidi characters, look-alikes for percent and ratio signs, and markup are refused outright rather than cleaned.
- **O-LED-4.** The registration re-enables every guard trigger and requires `tgenabled <> 'D'`.

**Method.** Scratch probes on disposable databases via `test:isolated`: guard against rendering, over-blocking on real data, the engine probe of §3.72 run again, and guard registration. No lab: the commit touches only two job-pool modules and their tests. No Gemini call.

**Verdicts (`evidence/guard-render-6823e93/verdicts.txt`).**
- **Static: PASS.** tsc 0. The job-pool group passes 26 files with 282 tests passed and 4 skipped, equal to GELB. The focused group passes 78 files with 699 tests passed. Counter-proof: the two changed test files fail 17 cases on `6c65d0c`.
- **D-ENG-4: PASS.**
  - "A good fit." with the operand Go is refused, and "Gopher and Go" is admitted.
  - The operand attack drops from 1 of 209 to 0.
  - Every invisible, bidi, look-alike and markup case is refused.
  - Umlauts in both NFC and NFD, typographic punctuation, C++ / C#, Node.js and R&D stay usable.
  - Over-blocking is 0: no real requirement name is refused, also inside a German sentence. The rest of the engine probe is identical to 6c65d0c.
- **O-LED-4: PASS.**
  - Disabled, replica-only and always triggers on all four tables are enabled again after the registration.
  - Afterwards a counter decrease, a delete and a truncate are refused.
  - Boundary: the registration runs once per process. Disabling a trigger takes the table owner.
- **O-ENG-5 (observation).** Ordinary letters that read as a claim still pass: small capitals, script g, Armenian o, dotless i, regional indicators, "GoodFit", and spaced or dotted letters. They fall under GELB's structural condition.
- **O-ENG-6 (observation).** Fail-closed has a cost. "->", "<=", a footnote "*" and a CV quote containing a percent each fail the whole role after its call. The prompt should name these characters.
- **Recorded conditions (GELB, for owner and GRÜN).**
  - One configuration source per provider for the day limit (O-LED-3), as a condition on the start route.
  - Model texts shown only as plain text marked "Modellaussage, ungeprüft, keine Bewertung", never in ranking or sorting (O-ENG-4 / O-ENG-5).
  - PINK checks both when they arrive.

**Run record.** `evidence/guard-render-6823e93/`: verdicts.txt, measurements.txt, scripts/ (three probes as .txt), manifest.sha256.

### 3.74 Explicit start route of the semantic investigation on `c1954ca` (2026-10-29)

**Request.** GELB asked for an independent, inverse check of the explicit start route on `recovery/role-discovery`: feature `3231136` plus the test correction `c1954ca`, stand-in only, no Gemini. The route is `POST …/role-discovery/investigations`; `GET …/investigations/{id}` reads. Operand loading is now shared between the read route and the start route. There is a single configuration source, `semantic-config.ts`, and a runner that works role by role. Seven points to check, plus the correction of the red group test.

**Method.**
- A route probe on a disposable database via `test:isolated`. It calls the handlers directly and counts stand-in calls on the provider.
- A PINK stand-in production lab on `c1954ca` with the provider configured. Counts come from the lab's own database, plus the Gemini stand-in log.
- Code inspection.

**Verdicts (`evidence/start-route-c1954ca/verdicts.txt`).**
- **Static: PASS.** tsc 0. The job-pool group passes 27 files with 287 tests, twice. The red run of `3231136` is not reproduced; the correction is sound, because test files run one after another.
- **1 Reads: PASS.** No route read and no page view writes an investigation, task, ledger entry or relation. Page views at both widths, before and after a run, leave the Gemini stand-in log at 6 → 6. No UI code calls the POST route.
- **2 Refusals: PASS.** 33 cases, with no call and no write. They cover configuration, body, roles, pools, PxJ, analysis, call confirmation, request id and the cap of 25. An inactive pool cannot be created by upload, so that path was not exercised.
- **3 Idempotency / race: PASS.** The same request returns the stored investigation even when the confirmed calls changed or the roles are reordered. Eight parallel identical starts create one investigation with 2 calls.
- **4 One attempt / budget: PASS.**
  - Day limit 0: BUDGET_EXHAUSTED, then CANCELLED, with 0 calls and nothing stored.
  - Limit exhausted mid-run: SUCCEEDED, BUDGET_EXHAUSTED, CANCELLED.
  - A failing role keeps the earlier role's relations and releases its own unit.
- **5 Cache reuse: PASS.** A new request id with 0 confirmed calls gives all CACHED and no call; the stale confirmation is refused.
- **6 Evidence class: PASS.** The created response says STAND_IN, and every stored investigation and relation names the stand-in. A real provider is not configurable.
  - **O-START-2:** the replay and the investigation GET carry no evidenceClass.
- **7 No model texts: PASS.** No response carries explanation, limitation, raw text or refusals.
- **Observations.**
  - **O-START-1:** a cross-site text/plain POST starts an investigation. There is no origin or content-type check, the same as for every POST route of the app. Precondition before any real provider.
  - **O-START-3:** a missing or invalid day limit falls back to 1000.
  - **O-START-4:** two different requests for the same pending roles at the same time both pay.
  - **O-START-5:** after a run the panel still reads "not executed".
  - **O-START-6:** the run happens inside the request, and a process end mid-run leaves the investigation RUNNING.

**Run record.** `evidence/start-route-c1954ca/`: verdicts.txt, measurements.txt, scripts/ (route probe and lab probe as .txt), manifest.sha256. No screenshots (the trace shows CV quotes).

### 3.75 Start route fixes on `097e376` (2026-10-29)

**Request.** GELB asked for a short re-check of `097e376` (with `0e03f69`) on `recovery/role-discovery`. It fixes three §3.74 observations on the start route and adds `discovery.startControl`. Stand-in only.

**Method.** The route probe of §3.74, adapted, on a disposable database via `test:isolated`, plus 15 new header cases and a day-limit parser table. No Gemini call.

**Verdicts (`evidence/start-route-097e376/verdicts.txt`).**
- **Static: PASS.** tsc 0; the job-pool group passes 27 files with 288 tests (equal to GELB). The changed tests fail 3 cases on `c1954ca`.
- **O-START-1: PASS.**
  - Content types text/plain, none, form and multipart give 415.
  - `sec-fetch-site: cross-site` gives 403, also with text/plain.
  - No call, nothing written. The scope is this route only.
  - **O-START-1b (observation):** prefix and exact-value checks let through "application/json-seq", a capitalised "CROSS-SITE" and a foreign Origin without `sec-fetch-site`. Browsers cannot exploit this, because a cross-origin JSON POST needs a CORS preflight the app does not grant. The app-wide Origin check remains an owner precondition.
- **O-START-2: PASS.** `evidenceClass` is STAND_IN in the 201, in every replay and in the investigation GET.
- **O-START-3: PASS.** Only 1–6 decimal digits count. Missing, empty and malformed values, 1e9 and 1000000 give 0 and nothing runs. 999999 caps at 100000. Stand-in users must now set the limit explicitly.
- **startControl: PASS.** It reports `engineState` and `maxRoles` correctly for none, gemini and stand-in, and the read writes nothing.
- **Regression: PASS.** Idempotency first, the 8-way race, budget cases, failing-role handling, cache reuse and the absence of model texts are unchanged. O-START-4, -5 and -6 remain open as GELB stated.

**Run record.** `evidence/start-route-097e376/`.

### 3.76 Role investigation UI on `frontend/role-investigation-ui` `9c40928` (2026-10-29)

**Request.** GELB asked for an independent check of `9c40928` (worktree `condyn-admin-role-investigation`, base `edae658`), which holds the explicit start of a semantic check in the role-discovery panel. Stand-in only, nothing on :3017, no merge. The branch contains RI-CONTROL, RI-START and RI-URL, plus the `50dac39` fix for a dashboard that dropped the URL parameter. Five points to check.

**Method.**
- PINK stand-in production labs on `9c40928`: one with the stand-in configured, one with no provider, one with "gemini", one for a stale confirmation and one with day limit 1. Every `/api` request was recorded, together with the database counts and the Gemini stand-in log.
- Unit groups on disposable databases, and code inspection.
- Rewritten responses are labelled as such in the evidence.

**Verdicts (`evidence/role-investigation-ui-9c40928/verdicts.txt`).**
- **Static: PASS.** tsc 0. The first-screen group passes 46 files with 276 tests, the job-pool group 27 files with 288, and the focused group (T-07 and F12 among them) 78 files with 699. The diff touches no API or job-pool file. The only POST to `/investigations` is in `semantic-investigation.ts`, called from one click handler.
- **1 No POST: PASS.** Load, open, release, reload, Back, Forward, every URL-contract load, close and hand-over send 0 POST. One click is exactly one POST, also for two clicks in the same task. The Gemini stand-in log stays at 6.
- **2 confirmedCalls: PASS.** The body carries the displayed number. Nothing is preselected and the cap is the `maxRoles` of the start control. The three "start not available" reasons read apart, and cache failure shows no pick boxes. A real stale case is refused with "the server now names 0 calls instead of the 2 you confirmed"; RE-READ PLAN is one GET, and the second explicit start stores all CACHED.
- **3 URL contract: PASS.**
  - Invalid, duplicate or malformed ids are removed without GET or POST.
  - One valid id is read once by GET. Reload and Forward are identical, and Back returns to the state before the release.
  - An unknown id gives NOT_FOUND.
  - PxJ, no pools and no analysis read nothing.
  - Close and "Gezielt untersuchen" remove the id.
  - The hand-over chain is proven by the reload result itself.
  - A changed release and an analysis change could not be exercised in the lab (one pool); they are covered by `discovery-ri-url.test.tsx` and are INCONCLUSIVE in the browser.
- **4 Honesty: FAIL, narrow.**
  - **F-RI-1:** after a run the plan line reads "not executed · 0 of 948 pairs in the relation cache · would need 9 calls · stand-in check: completed", with "partly completed" for budget cases. "Not executed" and "completed" contradict each other, and the numbers are those from before the run. A reload shows fresh numbers, but the sentence is the same. Suggested: drop "not executed" when a stored investigation is known, and re-read the plan after a completed POST.
  - Everything else holds. The stand-in reads "Stand-in, no model", and no provider name appears in any state. A foreign provider, a missing or UNKNOWN evidenceClass, extra fields, another analysis' id, no tasks and a 500 on POST all give FAILED. No relation state, explanation, percent, rank or recommendation appears, and the D-RD-4 groups are unchanged.
- **Budget (real): PASS.** Day limit 1 gives SUCCEEDED, BUDGET_EXHAUSTED, CANCELLED with "partly completed" and the budget sentence, 1 call. A second start with the day spent makes no call.
- **5 Regression: PASS.** The six-orbit scene probe is identical to `c670b74`. The panel walk, hand-over and trace are unchanged. All six viewports show no overflow and complete states.
- **Observations.**
  - **O-RI-1:** plan numbers stay stale in-session (same cause as F-RI-1).
  - **O-RI-2:** an id without pools, analysis or in PxJ stays in the URL and is ignored.
  - **O-RI-3:** a fresh release says "not started" although earlier investigations of these pools filled the cache.
  - **O-RI-4:** after a run the picks stay ticked and START stays enabled.

**Run record.** `evidence/role-investigation-ui-9c40928/`: verdicts.txt, measurements.txt, scripts/ (probe and runners as .txt), shots/ (5, no CV quote on view), manifest.sha256.

### 3.77 Role investigation UI fix on `9bb6bed` (2026-10-29)

**Request.** GELB asked for a recheck, stand-in only, of GRÜN's fix `9bb6bed` on `frontend/role-investigation-ui`. It addresses F-RI-1 and O-RI-1, O-RI-3 and O-RI-4 of §3.76. The plan is now re-read once per changed stored id, which adds one automatic GET.

**Method.** The §3.76 probes, extended with settled counts (discovery GETs after start, reload, Back and Forward, and 8 s later) and a comparison of the displayed numbers with the database. Labs: stand-in, no provider, gemini, stale and day limit 1. Unit groups and code diff included.

**Verdicts (`evidence/role-investigation-ui-9bb6bed/verdicts.txt`).**
- **Static: PASS.** tsc 0; the first-screen group passes 47 files with 279 tests, job-pool 288 and the focused group 699. The diff touches no API or job-pool file.
- **F-RI-1 / O-RI-1: PASS.** The line reads "Relation cache: N of M pairs · stand-in check: {status}" with no "not executed". The numbers equal the database after a full run (192), after a partial run (120) and after reload. The plan is re-read exactly once per changed id: 1 GET after a start and 2 on mount. The count is unchanged 8 s later, so there is no loop.
- **No extra POST: PASS.** One click is one POST. Reload, Back, Forward, the URL cases, close and hand-over send 0 POST, and the Gemini stand-in log stays at 6.
- **O-RI-4: PASS.** After a stored run the ticks are cleared and START is disabled.
- **O-RI-3: PASS.** The wording is "no investigation named in this view".
- **Unchanged: PASS.** The start-unavailable reasons, stale refusal, URL contract, FAILED cases, D-RD-4 groups and budget run behave as in §3.76.
- **Regression: PASS.** Six-orbit scenes identical to `c670b74`, panel walk unchanged, six viewports complete. O-RI-2 remains an observation.

**Run record.** `evidence/role-investigation-ui-9bb6bed/`.

### 3.78 Integrated state `integration/dll-full` `cdf0c1e` (2026-10-29)

**Request.** GELB, after the owner GO "DLL FULL INTEGRATION", asked for an independent, inverse validation of the integrated state: `29ae2d7` first, then `cdf0c1e` (plus `frontend/dll-entry-gaps`). Stand-in only; `main` stays at `b712152`. Five points, plus whether GELB's red files are base redness.

**Method.**
- Full suite, tsc and production build in a detached worktree with a real `node_modules`, on a disposable database.
- Scratch trees for the same files on `27f3253`, `edae658` and `29ae2d7`.
- Stand-in production labs without a flag: product path, sources, the dll-entry-gaps probe and the integrity probes of earlier rounds.
- 25 one-line mutations, one per seam, against the relevant tests.

**Verdicts (`evidence/integration-cdf0c1e/verdicts.txt`).**
- **1 Suite: PASS.**
  - tsc 0, build exit 0.
  - 473 files with 458 green, 3113 tests green, 27 red.
  - The red ones are only the four lifecycle files. The decision-integration and e2e files are green with a real `node_modules`; they fail only in scratch trees with a symlinked one (Turbopack panic).
- **Base redness: confirmed.**
  - The same 27 tests in the same four files are red on `27f3253`, `edae658`, `29ae2d7` and `cdf0c1e`.
  - `main` `b712152` has no tests at all; they arrived with `1c64dc1` on 2026-08-17.
  - The cause is `lib/career/db/client.ts` creating `career_policy_versions` with `timestamp` where the Drizzle schema and repositories use `version`, `parent_version`, `created_at` and `created_by` (F-JP-5, §3.5). The integration did not cause it.
- **2 Product path: PASS.** Upload, PERSON, release, lexical discovery, explicit stand-in start, cache reuse, reload, Back and Forward all behave as in §3.77, with the displayed numbers equal to the database. The website source works end to end. The GitHub success path is INCONCLUSIVE in the network-less lab. No source is shown in the discovery panel, and there is no LinkedIn input.
- **3 Integrity: PASS.** Six orbits are identical to `c670b74`, and the integrity probes match earlier rounds (nav 88/90 and s10 17/20 with S6, both as before).
- **4 Inverse: 20 of 25 mutations caught.**
  - **F-INT-1:** the day-limit fails-closed test is vacuous (it reads `run.calls`, which does not exist), so a fail-open limit survives.
  - **F-INT-2:** a lowercase `roleInvestigationId` accepted by the parser survives.
  - **F-INT-3:** picks not cleared after a stored run survive.
  - **F-INT-4:** a drop forwarded twice survives.
  - One further survivor is an equivalent mutant.
  - The browser probes pin the behaviour behind F-INT-3 and F-INT-4.
- **5 Viewports: PASS.** Six viewports in the production build without a flag.
- **dll-entry-gaps: PASS.** The gate text names both ways in EN and DE, GO TO JOB FIELD works, and a drop reaches the real intake with the same validation as the file button, once per drop.
- **Observations.**
  - **O-INT-1 (security):** the analyze route and the website loader fetch loopback and link-local addresses (SSRF). That is acceptable only while the app stays local and unauthenticated.
  - **O-INT-2:** an unknown document type is accepted.
  - **O-INT-3:** one database-isolation test is flaky under load.

**Run record.** `evidence/integration-cdf0c1e/`.

### 3.79 Closing check of `main` `9fb785a` (2026-10-29)

**Request.** GELB fast-forwarded `main` to `9fb785a` (= `integration/dll-full`: `cdf0c1e`, GRÜN's test-gap fixes `804834c`, GELB's F-INT-1 `ec06d8a` and docs §11) under the owner mandate. GELB asked for a final check: the delta, the four surviving mutants of §3.78, and a smoke on `main`. Stand-in only.

**Verdicts (`evidence/main-9fb785a/verdicts.txt`).**
- **1 Delta: PASS.** Only `test/` (4 files) and `docs/` (1 file) changed, and the fast-forward is confirmed.
- **2 Mutants: partly fixed.**
  - F-INT-1 and F-INT-3 are now caught.
  - **F-INT-2 is still open.** The new case lower-cases the whole id including the `RINV_` prefix, so it cannot tell a widened hex class apart. A value of `RINV_` plus lower-case hex would.
  - **F-INT-4 is still open.** The new tests pin the drop zone and SourceDock, but not the Field wiring between them. A Field-level test is missing.
  - Both are test gaps only; the behaviour on `main` is correct (§3.78 browser probes).
- **3 Smoke: PASS.** tsc 0, the changed tests green, the production build succeeds, and the product path is identical to `cdf0c1e` with the numbers equal to the database. Six orbits are unchanged.
- **Result.** No production finding on `main` and nothing to revert. The open items are F-INT-2 and F-INT-4 (tests) and the owner items of §3.78.

**Run record.** `evidence/main-9fb785a/`.

### 3.80 Runtime candidate `main` `489b167` for :3017 (2026-10-29) — GO with conditions

**Request.** Under the owner mandate SFE FULL_RUNTIME_INTEGRATION, GELB asked for an independent, inverse validation of `main` `489b167` as the replacement of :3017, which runs the old code `175c481`. Stand-in only, no Gemini, nothing on :3017; GELB's :41890 was used read-only. Points:
- the product path on the real world;
- HR decision-loop pages, GET without writes, lazy relation-cache registration, no Gemini without a worker;
- one mutation per seam, and a rollback test.

**Method.**
- GELB's dump of :41862 restored into a fresh marked disposable database; the source dump was unchanged.
- Production builds without a flag, `next start` with PINK's net sentinel, no worker, no key.
- The runner's own seeded HR world as a positive control on both versions.
- Exact row counts and tuple statistics around every GET sweep.
- The 25 seam mutations of §3.78.

**Verdict: GO, with three conditions.** Details in `evidence/runtime-candidate-489b167/verdicts.txt`.
- **Product path: PASS on the real world.** 790 pairs. The displayed "190 of 790" equals the 190 relations in the database. One POST per start, none on reload, Back or Forward. Six viewports, six orbits.
- **HR pages: PASS (code).** The seeded contexts A and B render identically on `489b167` and `175c481`.
  - On GELB's :41890 copy the context API answers 404 NOT_FOUND for the same ids. The copy lacks those contexts; this is not a code fault.
- **GET without writes: PASS.** No row or tuple change and no outbound connection.
- **Lazy registration: PASS.** The four tables are created on the first discovery GET with 0 rows and the guards enabled.
- **No Gemini: PASS.** An analyze job stays PENDING with no outbound attempt.
- **Inverse: 23 of 25 mutations caught.** F-INT-2 is now caught. F-INT-4 remains a test gap, and M17 is an equivalent mutant.
- **Rollback: PASS.** `175c481` runs on the database the candidate used, and the candidate runs again afterwards.
- **Conditions.**
  - **C1:** smoke the HR context API on the new server against the real database before switching.
  - **C2:** the rollback procedure as tested.
  - **C3:** set the stand-in and an explicit day limit; no Gemini change without a separate GO.

**Run record.** `evidence/runtime-candidate-489b167/`.

**Addendum (C1 corrected).** GELB's first context ids were truncated to 30 characters; that caused the 404 in 2a, not missing data. With the full ids (`DCTXREV_25E6B6DA8048EDCA22B1C41380A1B71C`, `DCTXREV_5EFC324ADF56B112661878848951FDD2`), :41890 renders both contexts with their chains and no page error, and the context API answers 200. GELB reports 200 on :3017 itself with the old code. 2a is PASS for code and data, and C1 is met. C2 and C3 stand, and GO is unchanged (`evidence/runtime-candidate-489b167/addendum-c1.txt`).

### 3.81 :3017 after the cutover to `main` `1d1d6e6` (2026-10-30) — PASS

**Request.** After the cutover, GELB asked for an independent, inverse check of the live :3017, which runs a dev server on `main` `1d1d6e6`: the `489b167` code plus the switch script and docs. Two parts:
- the full product path, six orbits with their interactions, the three modes, Reload/Back/Forward, both languages and six viewports;
- live :3017 with GET only, including the HR contexts, a dev-versus-production comparison, the configuration, and no writes.

**Method.**
- PINK's own production labs of `1d1d6e6`: the runner's seeded world (the data shape of :3017) and the restored real :41862 world, both with the stand-in and day limit 1000, without key or worker.
- On :3017, a browser that aborts every non-GET request; none occurred.

**Verdict: PASS** (`evidence/runtime-3017-1d1d6e6/verdicts.txt`). The GO of §3.80 is confirmed in operation.
- **Product path on the real world.** One POST per start; "190 of 790" equals the database; "Stand-in, no model". Reload, Back and Forward send 0 POST. Six viewports.
- **Modes.** Three modes from every view, retraced exactly by Back ×3 and Forward ×3; the DE/EN switch works.
- **Orbits.** 01 and 03–06 open their cosmos, 02 focuses the Capability Field.
- **GET without writes.** The GET sweep wrote nothing.
- **Live :3017 equals the production build.** On the same data shape, text and testid sets are identical by hash; only the dev overlay adds six elements. HR contexts A and B render.
- **Empty world on :3017.** :3017 holds no analysis and no pool, so no start is offered, which is correct. The stand-in label was verified in the lab.
- **Observations.**
  - **O-RT-1:** Escape closes neither the orbit focus nor the codex modal.
  - **O-RT-2:** dev-server compile latency on the HR chain.
  - **O-RT-3:** :3017 runs as a dev server with the worker; an analysis submitted through the UI would call Gemini if a key is set. This is unchanged by the cutover and an owner item.

**Run record.** `evidence/runtime-3017-1d1d6e6/`.

### 3.82 Semiotic entry line, GRÜN `84e4551` (2026-10-30) — NO-GO for :3017 (one new finding)

**Request.** SEMIOTIC_ENTRY_FIX: GRÜN replaced the closed-gate note at the Capability Field entry ("CAPABILITY FIELD CLOSED … Way: …", amber, `role="note"`) with a calm field-state line in cool tokens (`role="status"`, `aria-live="polite"`), derived by `field-entry-state.ts`. The gate and the mode logic stay unchanged. GELB asked for GO/NO-GO for the rollout on :3017 and named the checks: S7 gate identity against `cd1e4de`, no regression, and that the line covers nothing new.

**Method.**
- **Gate probe v2.** Own empty stand-in production lab, run on the candidate and on `cd1e4de` with the same recipe: 40 states × EN/DE × 1920/1280. It covers no pool, pool, pool open, role open, job selected, invalid job, pools unread, job being checked, PERSON (both focuses) and JOB, and records attributes, click, Tab/Enter, entry action, colours, words and overlaps.
- **Hit test and click proof.** A hit test on the restored real world and a click proof in the stand-in lab.
- **Mutants.** 28 one-line mutants against GRÜN's suites.
- **Suites.** tsc and the full isolated suite on both trees.
- **Regression.** On the restored real world in a production build: modes in 6 viewports, orbits, role discovery, rd-ui and the drop zone, compared with §3.81 (`cd1e4de` has the same app code as `1d1d6e6`).

**Verdict: NO-GO** (`evidence/semiotic-entry-84e4551/verdicts.txt`).
- **Passing.**
  - **S1.** 9 distinct states in each language.
  - **S2.** 0 lock words.
  - **S3.** 0 warm tones.
  - **S4.** status/polite only.
  - **S5.** Natural EN/DE, with wording observations.
  - **S7.** 0 gate differences in 40 states at both viewports.
  - **S8.** Identical except the new line itself.
  - **Overlaps.** PxJ/JOB overlaps are reduced or removed, which confirms GRÜN.
- **F-SEM-1 (new, blocking).** PERSON with an opened pool in the Job Field now shows the PERSON_OPEN line over the KESTREL organization node, including its name. Its action "◈ CAPABILITY FIELD" takes clicks on the node's top edge, so a click there enters the Capability Field instead of opening the organization. Reproduced at 1920/1600/1440/1280; the baseline had no line in this state.
- **Test gaps, no production finding.** F-SEM-2 (requirement as opened role), F-SEM-3 (amber path label) and F-SEM-4 (dangling aria-describedby).
- **Observations.**
  - **O-SEM-1.** States 1/2a/2b/unread differ by text only.
  - **O-SEM-2.** The "trägt / holds" and "bleibt außen" wordings.
  - **O-SEM-3.** The PERSON action keeps focus=CAPABILITY from the URL.
  - **O-SEM-4.** The §3.78 gaps needles are obsolete.
- **Re-check after the fix.** About 40 minutes: gate probe, hit test, click proof and the alive mutants.

**Run record.** `evidence/semiotic-entry-84e4551/` (verdicts, measurements, scripts, line shots of the empty lab and the F-SEM-1 shot).

### 3.83 Semiotic entry line, round 2, GRÜN `0ab9baf` (2026-10-30) — GO for :3017

**Request.** GRÜN fixed the §3.82 findings:
- F-SEM-1: the line now sits in the Job Field's right column, under the mode selector, and the intake panel opens 12 px below it.
- F-SEM-2…4: test gaps closed.
- O-SEM-2: wording changed.

GELB asked for the gate probe again, a hit test and click proof in all states and both languages, the three mutants, S8, and a new check that the right column covers nothing new. It asked for GO/NO-GO.

**Method.**
- **Gate probe v2.** Same probe as §3.82 against `cd1e4de`.
- **New geometry probe.** A generic scan of every visible element with a testid, text or interactivity under the line. It runs in 8 viewports, EN and DE, with and without the intake panel open, and includes the KESTREL rim click proof.
- **Hit test.** On the restored real world.
- **Mutants.** 32 mutants: E29–E33 are new for the right column, and E28 is obsolete.
- **Tests and regression.** tsc and test/career, then the S8 regression against §3.81.

**Verdict: GO** (`evidence/semiotic-entry-0ab9baf/verdicts.txt`).
- **F-SEM-1 closed.** The line covers 0 elements in 88 visits × 4 captures. The intake panel always sits 12 px below the line. Every KESTREL rim click opens the organization, and the real-world hit test finds 0 nodes under the line.
- **Other checks.** S7 shows 0 gate differences in 40 states at 1920/1280. S1–S5 pass, including the new wording. S8 is identical to §3.81 except for the line itself.
- **Mutants.** 30 of 31 applicable mutants are red, so F-SEM-2…4 are closed.
- **Remaining test gap (F-SEM-5, E32).** If the dashboard stopped writing the entry clearance, the suites would not notice. The browser measures the 12 px, so the shipped code is correct.
- **Owner items, unchanged.** O-SEM-3, the INVALID code, and O-RT-3 (:3017 runs as a dev server with the worker).

**Run record.** `evidence/semiotic-entry-0ab9baf/`.

### 3.84 Automated capability-to-job path, block A: GitHub account input, GELB `30f42b0` (2026-10-30) — PASS with two open findings

**Request.** Owner mandate SFE::AUTOMATED_CAPABILITY_TO_JOB_EXECUTE ("NUR DAS. MEHR NICHT."), spec `b3ebb6d`. GELB delivers the backend block by block; block A is the GitHub account input: `github.com/<user>` selects the account's own public, active repositories automatically (newest push first, default 5, hard cap 10) and loads them with the existing repository loader. GELB's decisions Q1–Q5 on the spec are the oracle (`evidence/auto-capability-30f42b0/scripts/grid.md.txt`).

**Method.** Deterministic only: a fake fetcher, no network, no model, a disposable `condyn_test_*` database per run.
- **Probe `pink-acp-a`.** URL matrix (37 URLs), request set, selection with 200 seeded permutations, bounds (15 cases), failure cases (10), determinism.
- **Repo-path non-regression.** Nine repository URLs through `prepareDocuments` (the worker entry) on base `9fa2cdc` and on the candidate.
- **Suites and tsc.** GELB's suites on both trees.
- **Mutants.** 20 mutants of the new rules, judged against the base-red set.

**Verdict: PASS with F-ACC-1 and F-ACC-2 open** (`evidence/auto-capability-30f42b0/verdicts.txt`).
- **A1–A7 pass.** Only `api.github.com`, one listing call, forks, archived, private and disabled repositories excluded, the order is stable, the bounds follow Q4, and failures are not hidden.
- **Repo path.** 5 of 9 URLs identical to base. Four are refused earlier now (O-A-1, fail closed).
- **tsc and suites.** tsc 0. The same 4 tests fail on base and candidate (3 in career-analyze-flow, CATEGORY C in career-analyze-multisource).
- **F-ACC-1.** The analyze route still accepts only `github.com`, so `www.github.com/<user>` (an account per Q4) gets HTTP 400 end to end.
- **F-ACC-2.** 6 of 20 mutants stay green in GELB's suites: hard cap, default, env handling (3), swallowed repository failures, and the worker entry `document-loader`. The account path's entry into the worker is not covered by any test.
- **Observations.** O-A-2: up to 100 documents per ANALYZE in the one extraction call, bounded by count, not bytes. O-A-3: without `GITHUB_TOKEN`, the GitHub rate limit allows about 3 account analyses per hour.

**Run record.** `evidence/auto-capability-30f42b0/`.

### 3.85 Automated capability-to-job path, whole path: backend `af24134` → `571c201`, frontend `576a704` (2026-10-30) — NO-GO on the current pair

**Request.** GELB asked for the independent and inverse validation of the whole path (blocks B–G) and a GO/NO-GO for merge and :3017. The path covers the gate and provider, the automatic run after a PERSON analysis, `ROLE_RANKING_V1`, the two read APIs, the worker hook, and GRÜN's frontend: the GitHub account input, the automatic ranking panel, and O-AC-1. The mandate is unchanged ("NUR DAS. MEHR NICHT."). GELB fixed PINK's interim findings during the check in `ab47d51`/`571c201`, and PINK re-checked those fixes.

**Method.**
- **Evidence classes.** DETERMINISTIC vitest probes on their own `condyn_test_*` databases, with the stand-in or a mocked `@google/genai` and the network refused; STAND_IN browser walks in GRÜN's lab (production build, real worker, loopback Gemini fake, network sentinel); CODE_INSPECTION.
- **Probes.** Gate matrix, provider seam, whole-database fingerprint around the reads, concurrency, snapshot and poolsDropped, budget, Gemini path, worker hook, NOT_PROVISIONED, and an independent ranking oracle.
- **Browser.** S7 gate in 40 states, the §3.83 geometry, and S8 on the restored real world. Walks: PDF and text, EN/DE, semantic on and off, in 6 viewports.
- **Mutants and suites.** 46 + 55 backend mutants and 19 frontend mutants. tsc and the test/career regression against base `9fa2cdc`.

**Verdict: NO-GO on the current pair** (`evidence/auto-capability-576a704/verdicts.txt`). Backend blocks B–E pass after GELB's fixes. Two blocking findings remain:
- **F-AC-1.** In the stack tier (960×540@2, 640×360@2) the ranking is an uncollapsed 73-rank list of 8.8–10.8k px above the six orbits. S8 no longer reaches orbit 01 at 640×360.
- **F-AC-2.** Backend `571c201` reports `PARTIAL · DAY_BUDGET_EXHAUSTED`, but the frontend `576a704` decoder refuses that reason, so such a run reads as READ_FAILED.

Open but not blocking:
- **F-AM-6.** An analysis without capability proposals still reads "10 of 10 roles checked semantically" (CACHED tasks with 0 pairs).
- **F-AM-7.** Test gaps: E-M01, N-M04 and N-M05 in the backend, F-M17 in the frontend.

**What passes.**
- **Product path.** After ANALYZE the path runs through with 0 inputs, 0 writes, and no picker or confirmation. With text input the UI shows 22 SEMANTIC ranks out of 73, labelled STAND-IN, and they equal the API ranking.
- **Reads and ranking.** The reads write nothing and register nothing. The ranking equals PINK's oracle. The claim guard is unchanged.
- **Fixes.** F-RK-1 and F-AM-1…5 are closed. On block A, F-ACC-1/2 are closed (§3.84; 20/20 mutants red).
- **O-AC-1.** The stand-in texts are byte-identical.
- **Owner notes.** O-AC-2 (the 3-minute wait against real Gemini latency), O-AC-3 (fit shown as a percentage), O-AM-4 (shutdown during a run), and the budget and operations notes O-A-2/3.

**Run record.** `evidence/auto-capability-576a704/`.

### 3.86 Automated capability-to-job path, re-check of §3.85 on frontend `0e44cce` (backend `b972905`, 2026-10-30) — GO

**Request.** GELB asked PINK to re-check only the conditions named in §3.85 (mandate "NUR DAS. MEHR NICHT.") on the integrated pair: frontend `frontend/auto-capability-path-r2` `0e44cce` on backend `b972905`, and to give GO/NO-GO.

**Method.**
- **Browser.** A stack-tier walk and a stack dig in GRÜN's stand-in lab, and S8 on the restored real world (including 960×540@2 and 640×360@2).
- **Decoder.** The backend's own view objects for `PARTIAL · DAY_BUDGET_EXHAUSTED` and `SKIPPED · NO_PROPOSALS`, run through the client decoder and the server-rendered panel in EN and DE.
- **Inverse.** 9 targeted mutants, plus PINK's backend probes, tsc and the test/career regression against base `9fa2cdc`.

**Verdict: GO for merge and :3017** (`evidence/auto-capability-0e44cce/verdicts.txt`). On :3017 the stand-in stays the provider until the owner releases a budget.
- **F-AC-1 closed.** In the stack tier the ranking panel now keeps at most half the viewport (270 / 180 px, was 8758 / 10827 px). Orbit 01 sits at document y 475 / 388 and opens.
  - At 960×540, S8 reaches orbit 01 without scrolling, as on the baseline.
  - **D-AC-1 (accepted deviation).** At 640×360 orbit 01 starts 28 px below the first viewport, so it needs one short scroll. On the baseline, orbits 02–06 already needed scrolling there.
- **F-AC-2 closed.** `DAY_BUDGET_EXHAUSTED` decodes and has its own line in EN and DE.
- **F-AM-6 closed.** An analysis without capability proposals reads as `SKIPPED · NO_PROPOSALS`: no run, no claim that roles were checked.
- **F-AM-7 closed.** All 9 mutants are red.
- **Rest of the path.** Unchanged: 0 inputs and 0 writes after ANALYZE, 22 SEMANTIC ranks out of 73, UI = API, EN/DE.
- **tsc and regression.** tsc 0. The regression differs from base only in the base-red outcome-valence domain.

**Owner notes** carried over from §3.85: O-AC-2, O-AC-3, O-AM-4, O-A-2/3, and D-AC-1 above.

**Run record.** `evidence/auto-capability-0e44cce/`.

### 3.87 Real end-to-end run on :3017, analysis `ANL_1793382839627_744` (2026-10-30) — result consistent; call count not provable read-only

**Request.** Owner mandate SFE::REAL END-TO-END EXECUTION ("Ein Durchlauf, maximal 10 echte Gemini-Aufrufe … NUR DIESEN DURCHLAUF. MEHR NICHT."). GELB ran the one real run. PINK's only task was to check it inversely, GET and read only, with no ANALYZE and no Gemini call. The four points to check:
1. UI ranking = API ranking.
2. Every cited quote stands verbatim in the PDF, with no claim beyond the authority.
3. The failed roles are not counted as evaluated.
4. The number of calls (≤ 10 including extraction) is plausibly shown.

**Verdict** (`evidence/real-e2e-ANL_1793382839627_744/verdicts.txt`, counts only, no model text or CV quote per E-6):
- **Point 1, PASS.** 73 UI ranks equal the 73 API ranks in order, tier and fit. The page visit made no request other than GET.
- **Point 2, PASS.** Quotes: semantic 29 of 29 and lexical 40 of 40 occurrences stand verbatim in the PDF. The explanations contain 0 score or hiring words, and the authority is ranking only with no decision.
- **Point 3, PASS.** The run counts 4 of 7 roles as evaluated.
  - The two provider failures are LEXICAL_ONLY.
  - The role whose output was refused carries one relation from the identical requirement content of a succeeded role (cache by content). That is not its own evaluation.
- **Point 4, open.** The semantic part made up to 7 requests. Extraction makes at least 3 calls (legacy pipeline ≥ 1, discovery 1, convergence 1).
  - If the two failed requests went out (8-minute run, consistent with 120 s timeouts), the lower bound is exactly 10 calls, with no margin.
  - The read APIs do not show the extraction call count. GELB's exchange archive or worker log must name it.

### 3.88 Three-point hardening, pair backend `88bdc05` + frontend `832d185` (2026-10-31) — GO on all three points

**Request.** Owner mandate SFE::THREE-POINT IMPLEMENTATION GO ("NUR DIESE DREI PUNKTE. MEHR NICHT."). GELB asked for an independent and inverse check with GO/NO-GO per point.
- **Point 1, semantic coverage.** Error classes with one TRANSIENT retry, partial admission, and a continuation that asks only for what is missing.
- **Point 2, write-ahead call register.** A job budget over extraction and matching.
- **Point 3, synchronisation.** Lease, heartbeat, take-over and STALLED in the backend; the interface reads without a fixed 3-minute cap.

**Method.**
- **Probes and evidence.** DETERMINISTIC probes with a scripted mocked SDK on PostgreSQL (no network, no key of the owner): 16 error classes, the explicit path, a 4-role continuation case, the register, its trigger and stale settling, the job budget, a lost worker with a zombie and racing sweeps, and the GET fingerprint.
- **Pair contract.** 10 368 generated backend views run through the client decoder.
- **Inverse.** 29 + 1 backend mutants and 12 frontend mutants, plus tsc and regression against base `5521ae7`.

**Verdict: GO for points 1, 2 and 3** (`evidence/three-point-88bdc05-832d185/verdicts.txt`).
- **F-TP-1 closed.** On `a1687aa` the continuation also asked roles that must never be asked again: the permanent failure, the all-refused role and the refused pair. Since `133ff76` it asks only the TRANSIENT role.
- **F-TP-2 closed.** A malformed or 0 job limit now means 0 calls.
- **F-TP-3, open, not blocking.** Test gaps in GELB's suites: the explicit retry, the resumable marker, the revision limit, the worker binding of the register and of the sweeper, and the two lease conditions.
- **D-TP-1.** Backend and frontend must ship together, because the backend alone breaks main's client contract.
- **Owner note.** The default job limit is 12 calls.

### 3.89 Budget boundary hardlock, GELB `67abdfe` (2026-10-31) — NO-GO: two paths send without a register row

**Request.** Owner mandate SFE::BUDGET BOUNDARY HARDLOCK ("Ohne persistente Aufrufregistrierung darf kein Gemini-Aufruf stattfinden. Unabhängig von der verwendeten Datenbank."). The only question: can any Gemini API request leave without a persistent register row, on any database?

**Method.**
- **Code inspection.** Every tracked file that imports the SDK or names its host.
- **Deterministic probe.** The real `@google/genai` SDK with global fetch replaced by a recorder that counts the register rows at the moment of each request. The probe ran on a database whose disposable marker was removed.

**Verdict: NO-GO** (`evidence/budget-boundary-67abdfe/verdicts.txt`).
- **What holds.**
  - Without a recorder no production provider sends anything.
  - On the unmarked database the register is provisioned, and every request had its row first.
  - Existing rows survive, and the stage list is widened in place.
  - When the register cannot be provisioned, nothing is sent.
- **F-BB-1.** Four tracked scripts at the repository root (`bisection.ts`, `schema-bisection.ts`, `schema-bisection-mjs.ts`, `test-schema.ts`) call `ai.models.generateContent` directly, outside the seam. The architecture test scans only `lib/`, `scripts/` and `app/`.
- **F-BB-2.** In `scripts/list-models.ts` the pager sends its further pages without rows: 3 requests, 1 row.

### 3.90 Budget boundary, re-check of §3.89 on GELB `fcf1084` (2026-10-31) — GO

**Request.** Re-check only F-BB-1, F-BB-2 and the question whether a Gemini request leaves without a register row.

**Method.**
- **The five scripts.** They ran as real processes in a scratch copy without any env file, with a dummy key and a preloaded fetch stub that answers locally. Afterwards the logged requests were compared with the register rows of each script's job.
- **§3.89 probe.** Re-run on `fcf1084`.

**Verdict: GO** (`evidence/budget-boundary-fcf1084/verdicts.txt`).
- **Requests equal rows** for every script, with 0 requests without a row:
  - `test-schema.ts`: 2.
  - `bisection.ts`: 1.
  - `schema-bisection.ts` and `schema-bisection-mjs.ts`: 11 each.
  - `scripts/list-models.ts`: 3 pager pages.
- **§3.89 probe.** 4 of 4 green.
- **Observation.** The architecture test does not see an async iteration over a pager or SDK services other than `models`. No tracked file uses either today.

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
