# Job Pool Connection (JSON Job Pool → canonical target requirements → presentation matching)

Status: implemented, under validation on `integration/job-pool-connection` (base `integration/hr-decision-loop` @ `5f47aa1`).
Owner session: GELB (architecture, backend). Frontend: GRÜN. Independent validation: PINK.

## 1. Reconstructed relation (documentation and contracts)

| Element | Documented intent | Runtime before this field |
| --- | --- | --- |
| Pool format | `CompanyPoolData` with `pool`, `organizations`, `roles`, `requirements` (`docs/career_analysis/CONDYN_COMPANY_POOL_SPEC_v1.0.md:11`, `:28`; schema `lib/career/matching/pool.ts:66`) | Only the TypeScript constant `DEMO_COMPANY_POOL`; no upload, no persistence |
| Pool matching | Deterministic resonance without LLM or embeddings, normalized to [0,1], explicit matched/missing/breakdown, monotone in weight (CP-I1..CP-I4, `CONDYN_COMPANY_POOL_SPEC_v1.0.md:17-20`) | `matchCareerAnalysisAgainstPool` runs in `GET /api/career/analyses/[id]`, result unused by any UI |
| Job mapping | Matched / weak evidence / missing, alias and domain matching (Step 23, `CONDYN_PLATFORM_ROADMAP_v1.0.md:57`, `CONDYN_SYSTEM_ARCHITECTURE_SUMMARY_v1.0.md:89`) | `mapCapabilitiesToJobs` implemented and tested, never called |
| Canonical target side | Target Source → Organization → Role Source Binding → Role Organization Binding → Role Profile → Requirement revisions (`lib/career/target/**`, T11 persistence) | No runtime producer; only test fixtures create revisions |
| Canonical relation | Capability-Requirement Relation over a `PHASE4_VERIFIED` candidate operand and a requirement revision; dimensional, no score (`lib/career/relation/capability-requirement/types.ts`) | No provider implementation; no runtime Phase-4 snapshot |
| Governed decision | DAR → DCTXREV → DCR in the HR Decision Looper (`HR_DECISION_LOOP_INTEGRATION.md`) | Operational on a seeded world; no ingress from matching |

Defect found (Case 1, derivable): `matchCareerAnalysisAgainstPool` and `mapCapabilitiesToJobs` read `capability.name`,
but a `CanonicalCareerAnalysis` capability carries its name at `identity.name` (`lib/career/schema.ts:65-101`).
Against every real analysis every requirement is reported missing and every score is 0.

## 2. Three separated layers

The owner mandate fixes the distinction between canonical relational evaluation, user-facing presentation and
governed human decisions. This field realizes it as three layers with one-way data flow and no authority transfer.

1. **Canonical relational layer (C).** An uploaded pool is mapped onto the existing canonical target revisions through
   the existing governed producers. Role profiles go through `reconstructTargetRoleProfiles`, requirements through
   `reconstructTargetRequirementsDurably`, both with a deterministic JSON provider (no model). Every revision stays
   `PROPOSAL_ONLY` / `authorityState: NONE`, every evidence quote is verified against the exact source revision.
   The Capability-Requirement Relation is **not evaluated**: its candidate operand requires a `PHASE4_VERIFIED`
   snapshot, which no runtime produces (Human-in-Authority item HIA-1). The state is reported explicitly as
   `NOT_EVALUATED` with reason `VERIFIED_CAPABILITY_SNAPSHOT_ABSENT`.
2. **Presentation layer (P).** Deterministic resonance matching between the analysis capabilities of one explicit
   analysis and one explicit uploaded pool, following CP-I1..CP-I4 and the Step-23 weak-evidence rule. It carries
   `authorityState: NONE`, is computed on read, is never persisted as canonical state and is never an input to RCP,
   DAR, DCTXREV or DCR. Each match states its basis (`EXACT`, `ALIAS`, `COMPOSITE_CONSTITUENT`, `TOKEN_CONTAINMENT`) and the analysis
   evidence quotes it rests on.
   Since the convergence round, each requirement entry also carries the coverage by the **Gemini Capability Sweep**
   proposals of the same analysis job (`sweepProposal`, section 11). Proposals carry source-verified quotes but no
   confidence; the coverage is therefore shown and never scored.
3. **Governed decision layer (D).** The HR Decision Looper is unchanged. No path leads from (P) or (C) to a DCR.

```
JSON upload ──► validation (CompanyPoolDataSchema) ──► job pool upload record (JPOOL_)
                                   │
                                   ├──► (C) TSREV/TOREV/TRSB/TROB per role ──► role profile (TRPREV) ──► requirements (TRQREV)
                                   │          CRR: NOT_EVALUATED (needs PHASE4_VERIFIED snapshot, HIA-1)
                                   │
analysis (ANL_) ───────────────────┴──► (P) presentation matching (computed on read, authority NONE)
                                                 │
                                                 └──► browser: role match panel   (no edge to D)
```

## 3. JSON Job Pool format

The upload format is `CompanyPoolData` (`lib/career/matching/pool.ts`), unchanged in its required fields. Three
optional, additive requirement fields are admitted; existing pools stay valid:

| Field | Type | Meaning |
| --- | --- | --- |
| `requirements[].aliases` | `string[]` | Alternative capability names for presentation matching (Step 23) |
| `requirements[].necessity` | `"REQUIRED" \| "PREFERRED" \| "OPTIONAL"` | Declared necessity; mapped to the canonical `necessityState`. Absent → `UNKNOWN` |
| `requirements[].requirement_type` | canonical `TargetRequirementType` | Absent → `CAPABILITY` |

Weights stay presentation-only. They are never mapped to canonical necessity.
A sample file is `docs/examples/job-pool.sample.json`.

The analysis side of layer P is read through `getCareerAnalysisRepository()`, the same path as
`GET /api/career/analyses/[id]` (in-memory under `NODE_ENV=test`, PostgreSQL otherwise).

## 4. Canonical mapping rules (layer C)

Adopted after PINK's review C1–C7 (2026-10-10).

- **Canonical bytes.** The validated pool is serialized as key-sorted JSON without whitespace (`stableJson`).
  `canonicalSha256` = SHA-256 of these bytes; the upload id is `JPOOL_` + its first 32 hex digits (upper case).
  Byte-different but equivalent uploads (whitespace, key order) are the same upload. The canonical bytes are stored
  (`career_job_pool_uploads.canonical_json`); `rawSha256` is the SHA-256 of the exact bytes of the first upload only.
- **Identity scope.** Every target entity is scoped to one upload: `<KIND>ENT_` + hash(upload id, declared pool item
  id). Admission is `NEW_ENTITY_ADMITTED` only (policy `JOB_POOL_UPLOAD_SCOPED_ENTITY_V1`), never `CONTINUATION_*`;
  a new pool version is a new upload with new entities (boundary B-JP-CONTINUITY).
- **Source (C1, C2).** ONE `TargetSourceRevision` per upload: `sourceKind: "DOCUMENT"` (the only kind the sealed
  source contract admits), `sourceLocator: jobpool://<JPOOL id>`, `normalizationVersion: JOB_POOL_SOURCE_RENDERING_V1`,
  `rawContentHash` = `canonicalSha256`, `normalizedContent` = deterministic rendering of the whole pool (id-scoped
  lines, NFC, whitespace collapsed per value, LF, no trailing spaces), `normalizedContentHash` over exactly that text.
  Every role binds to this one source. Every evidence quote is one complete id-scoped line of it.
- **Organization.** One `TargetOrganizationRevision` per pool organization, `descriptorKind: "DECLARED_NAME"`.
- **Bindings.** One role-source binding and one role-organization binding per role.
- **Role profile.** `reconstructTargetRoleProfiles` with the deterministic provider `CONDYN_JOB_POOL_JSON`. Its batch
  runs and results are persisted by `PostgresTargetRoleReconstructionArtifactRepository`
  (`target_role_reconstruction_batch_runs`, `target_role_reconstruction_results`; new adapter with the semantics of the
  in-memory reference, raw provider bytes bound to their hash).
- **Requirements.** `reconstructTargetRequirementsDurably` with the same provider and the existing
  `PostgresTargetRequirementArtifactRepository`. The mapping records, per requirement, the revision, reconstruction
  result and admission ids, so byte and semantic replay and the inverse walk use exact ids.
- **Level mapping table `JOB_POOL_REQUIRED_LEVEL_MAPPING_V1` (C3).** CAPABILITY, TOOL_TECHNOLOGY, KNOWLEDGE: a
  declared level starting with L1..L6 maps to `CAPABILITY_LEVEL "L<n>"` (`SUPPORTED`), anything else to `UNKNOWN`
  (`requiredLevelValidationState: UNKNOWN`). EXPERIENCE, LANGUAGE, CREDENTIAL: the declared text becomes the canonical
  free-text variant. Every other type or an empty level: `UNKNOWN`. The raw text stays in the source and in layer P.
- **Necessity (C7).** Declared necessity maps to `necessityState` with `SUPPORTED`; absent necessity maps to
  `UNKNOWN` in both state and validation. Weights are never mapped.
- **Scope.** A declared requirement domain maps to `SCOPED` with only `domainScope` set; an empty domain to
  `NOT_APPLICABLE`.

## 5. HTTP contract (v1)

All routes run only on a positively verified disposable database (same gate as the HR routes), otherwise
`503 ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED`. Error bodies: `{ error: { code, message, issues? } }`.

| Method and path | Result |
| --- | --- |
| `POST /api/career/job-pools` (body: pool JSON, ≤ 1 MiB; optional header `x-condyn-principal-actor-id`) | `201` new upload, `200` identical upload exists; body `JobPoolUploadView` |
| `GET /api/career/job-pools` | `200 { jobPools: JobPoolUploadSummary[] }` (no selection, no "latest") |
| `GET /api/career/job-pools/{jobPoolUploadId}` | `200 JobPoolUploadView`, `404` |
| `GET /api/career/job-pools/{jobPoolUploadId}/matches?analysisId=ANL_…` | `200 JobPoolMatchPresentation`, `404` pool or analysis, `409 ERR_INACTIVE_COMPANY_POOL` |

Errors on upload: `400 ERR_JOB_POOL_JSON_INVALID`, `413 ERR_JOB_POOL_TOO_LARGE`,
`422 ERR_JOB_POOL_SCHEMA_INVALID` (with issues), `422 ERR_JOB_POOL_REFERENCE_INVALID` (role → unknown organization,
requirement → unknown role, duplicate ids).

Response types are exported from `lib/career/job-pool/types.ts`.

## 6. Proof plan

| Proof | Content |
| --- | --- |
| JP-U | Unit: schema extension, normalization, provider determinism, presentation matching (CP-I1..I4, weak evidence, alias, token containment), identity.name extraction |
| JP-C | PostgreSQL: upload → canonical revisions, replay of every revision from persisted sources, idempotent re-upload, immutable conflict |
| JP-I | Inverse: from each `TRQREV` back to the exact pool requirement and upload bytes; from each presentation match back to the analysis evidence quote |
| JP-H | HTTP: all status codes of section 5 on a disposable database; no DDL on a non-disposable database |
| JP-R | Regression and preservation: G2, integration, isolation, capability core, HR loop suites; legacy matching tests |
| JP-B | Browser: upload sample pool, select analysis, ranked roles with matched/weak/missing and evidence, layer labels |
| JP-M | Manual: CV upload with real Gemini analysis, JSON pool upload, matching in the browser |

## 7. Boundaries and Human-in-Authority items

- **HIA-1:** canonical Capability-Requirement evaluation needs a `PHASE4_VERIFIED` capability snapshot. Who may verify
  a capability and assign L1–L6 is undecided (`docs/capability-core/ARCHITECTURE.md:94`).
- **HIA-2:** whether a model may act as the Capability-Requirement provider (semantic, evidence, scope judgements).
- **B-JP-CONTINUITY:** no entity continuity across pool uploads.
- **B-JP-ACTOR:** the uploader is self-declared, not authenticated (same class as HR boundary B2).
- **B-ENTRY (C5):** tables are registered only on verified disposable databases. Without an owner-approved migration
  the job pool routes have no production path; on any other database they answer 503 and issue no DDL.

## 8. Defects found and repaired in this field (2026-10-10)

Each defect was found on a disposable database (runner or manual environment, role `condyn_test_runner`), proven
red, repaired and covered by a regression test. D-JP-2 to D-JP-5 sit in the existing Gemini pipeline and are visible
only with real PostgreSQL and real model output; the earlier wiring tests use doubles.

| Id | Defect | Symptom | Repair | Proof |
| --- | --- | --- | --- | --- |
| D-JP-1 | Legacy matchers read `capability.name`; analyses carry `identity.name` | every real analysis scores 0 against every pool | shared `extractAnalysisCapabilities` (both shapes) | `test/career/matching-identity-name.test.ts` |
| D-JP-2 | Loaders stamp a wall-clock `metadata.loadedAt` | a retried job rebuilds a different `CSB_<jobId>` → permanent `ERR_CANDIDATE_SOURCE_BUNDLE_IMMUTABLE_CONFLICT` | processor pins `loadedAt` to `job.createdAt` | `test/career-worker-retry-source-bundle.test.ts` |
| D-JP-3 | F10A bridge sets an explicit `pages: undefined` key, which JSONB drops | every real job: attempt 1 `…PERSISTENCE_INVALID`, retries `…IMMUTABLE_CONFLICT` | processor persists the bundle in its JSON-stable form; bridge and its contract unchanged | same file, JSONB-like strict store |
| D-JP-4 | Projection reader resolves each content-addressed evidence id to one candidate | `GET /api/career/analyses/[id]` 500 when two proposals cite one sentence | reader keeps the set of holders; divergent claims under one id still fail | `test/career/capability-core/projection/shared-evidence.test.ts` |
| D-JP-5 | Provenance check demands unique per-quote documents | same 500 when a proposal has two quotes from one document | compare distinct documents | same file |

The worker now logs every failed attempt (`[Worker …] FAILED …`), because the job row keeps only the last summary.

## 9. Live evidence (manual environment, real Gemini, disposable database)

Run on `condyn_test_a1b4da2c0dfb9bbf` with the operator's `GEMINI_API_KEY` and `GEMINI_MODEL` from
`/home/codi/Entwicklung/condyn-admin/.env.local`, a fresh `PROMPT_ENCRYPTION_KEY`, worker and server bound only to
the verified URL. Input: a synthetic CV text (no personal data).

| Step | Result |
| --- | --- |
| `POST /api/career/job-pools` (sample) / repeated | 201 / 200, `JPOOL_30F7145E21F34BEF0FCE510DFC75837B`, 6 roles, 28 TRQREV |
| `POST /api/career/analyze` before D-JP-2/3 | job FAILED after 3 attempts, `ERR_CANDIDATE_SOURCE_BUNDLE_IMMUTABLE_CONFLICT` |
| same after the repairs | job SUCCEEDED in one attempt (89 s), `ANL_1791656796738_760` |
| `GET /api/career/analyses/[id]` before D-JP-4/5 / after | 500 / 200 |
| `GET …/matches` before COMPOSITE_CONSTITUENT | full-stack 0.5167, most requirements weak (composite names) |
| `GET …/matches` after | full-stack 0.8152 (TypeScript, React, Node.js, PostgreSQL matched; Automated Testing missing), data 0.6387, frontend lead 0.4486, platform 0.3375, ML 0.2700, architect 0 |
| server log | 0 PostgreSQL notice objects |

Environment boundary B-JP-MODEL: the default cascade `DEFAULT_GEMINI_MODEL_CASCADE` starts with models that the
API no longer serves to this key (GRÜN's probe: `gemini-2.0-flash` 404, `gemini-2.5-flash` unavailable to new users).
The operator must set `GEMINI_MODEL`; the env file names `gemini-3.1-pro-preview`, GRÜN's run used
`gemini-3.8-flash`. Changing the default cascade is left to the owner.

Presentation boundary B-JP-PROPOSALS: matching reads the legacy analysis capabilities (the documented input of the
pool spec). The capability proposals of the same job are finer (e.g. "Test-Driven Development (TDD)",
"Kubernetes Deployment") but carry no confidence; using them as a candidate surface needs a decision on how
proposals without confidence enter the CP-I score.

## 10. Integration of the frontend and final proofs (2026-10-10)

`frontend/job-pool-workflow` @ `aa1532d` (GRÜN) fast-forwarded: `JobPoolMatchPanel` on `/career/demo` (explicit
analysis from the succeeded job or `?analysisId=`, explicit pool selection persisted as `?jobPoolUploadId=`, strict
decoders, the three layer labels, canonical state per role), `npm run job-pool:local` (manual environment with the
career worker bound only to the verified disposable URL), Chromium e2e and the manual test guide
`docs/career_analysis/JOB_POOL_WORKFLOW_MANUAL_TEST.md`. The shared-evidence regression test lives in
`test/career/capability-proposal-projection/` because `test/career/capability-core` is sealed and pinned by P8.

Proofs on `a62b6f9` as `condyn_test_runner` (databases created, verified and dropped by the runner or the script;
the shared `condyn` database untouched):

| Proof | Result |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| `next build` | passes; `/api/career/job-pools`, `/{id}`, `/{id}/matches` dynamic |
| G2, runtime, adapters, integration, isolation, capability core, career runtime, HR loop, job pool (incl. Chromium e2e), legacy Step 16/23, worker suites, analyses routes | 138 files, 1089 tests green (P8 after moving the shared-evidence test) |
| Manual walkthrough `npm run job-pool:local --fresh` with real Gemini | upload 201; analyze 202 → SUCCEEDED in one attempt (107 s); analyses 200; matches 200, full-stack 0.6189 first; `/career/demo?analysisId=…&jobPoolUploadId=…` 200; 0 notices; 0 failed attempts |
| GRÜN's browser walkthrough with real Gemini (`aa1532d`) | field populated, panel matches AVAILABLE, full-stack 0.835 first, 0 page errors (evidence 08–10) |

Known pre-existing reds outside this field: the four G1 lifecycle suites (F-JP-5, `career_policy_versions` DDL drift)
and `test/career-worker-recovery-pipeline.test.ts` (assumes pre-existing tables).

## 11. Convergence round: PDF path and Gemini Capability Sweep coverage (2026-10-10)

### 11.1 Field reconstruction, top-down

| Link | Implementation | Proof |
| --- | --- | --- |
| PDF intake | SourceDock file input → `POST /api/career/analyze` `{type:"pdf", content:<base64>}` → 202 job | GRÜN browser run (evidence 11–15); PINK `pdf-path.postgres.test.ts` |
| Extraction | worker `prepareDocuments` → batch loader → `pdf-parse` (`lib/career/loaders/pdf.ts`) | `docs/examples/cv.synthetic.pdf` → 1647 chars; PINK test with two PDFs |
| Source bundle | `CSB_<jobId>` with `loadedAt` pinned (D-JP-2) and JSON-stable documents (D-JP-3) | PINK: retry rebuilds a deep-equal bundle on real JSONB |
| Gemini Capability Sweep | Discovery + Convergence kernels → `RUN_`/`CONV_` → F11 projection (`PCAP_`, verified quotes) | live: 14 proposals for the synthetic CV; reader fixed (D-JP-4/5) |
| Gemini analysis | legacy pipeline → `career_analyses` (capabilities with confidence and evidence) | live: one attempt, 90 s, 7 capabilities |
| JSON Job Pool | upload → canonical bytes → target revisions (layer C) | JP-C/JP-I suites (GELB, PINK) |
| Job matching | layer P on analysis capabilities, plus unscored sweep coverage | live and unit/PostgreSQL proofs below |
| Decision | HR Decision Looper unchanged; no edge from C or P | PINK layer-separation proof |

### 11.2 Gemini Capability Sweep coverage

Live PDF run (`ANL_1791660183739_840`, sample pool): the analysis capabilities match 11 of 28 requirements, the sweep
proposals 17. Seven requirements are covered only by the sweep (Automated Testing ← "Test-Driven Development (TDD)",
Accessibility ← "Web Accessibility Implementation", Kubernetes ← "Kubernetes Deployment", CI/CD ← "CI/CD Pipeline
Engineering", Linux ← "Linux Administration" (ALIAS), Data Modeling ← "Dimensional Data Modeling", German ← "German
Language Proficiency").

Contract additions (all always present): `sweepProposal: JobPoolSweepProposalCoverage | null` on every matched, weak
and missing entry (`capabilityProposalId`, `name`, `matchBasis`, `matchedConstituent`, verified `evidence`,
`evidenceState: SOURCE_MATCH_VERIFIED`, `authorityState: NONE`, `scored: false`); `sweepOnlyCoverageCount` per role;
`capabilitySweep: { state: AVAILABLE | NOT_PRODUCED | FAILED, proposalCount, scored: false }` per response. The reader
is the F11 projection reader of `GET /api/career/analyses/[id]`; a lineage failure marks only the sweep `FAILED`.

Invariants proven: scores are identical with and without the sweep (unit test, PostgreSQL test, live run with
byte-identical `[roleId, score]` lists before and after); `FAILED` and `NOT_PRODUCED` leave the analysis matching
unchanged.

Owner decision HIA-3 (unchanged, now evidenced): whether sweep proposals may contribute to the score. They have no
confidence, so scoring them requires a rule that the documents do not contain.

### 11.3 Matcher rule kept

B-COMPOSITE-SPLIT (GRÜN): "TypeScript & Node.js Platform Engineering" splits into "TypeScript" and "Node.js Platform
Engineering"; the second part only token-contains "Node.js" and stays weak evidence. Counting token containment inside a
constituent as a full match would bypass the weak-evidence rule; the sweep coverage now shows the remaining gap.

### 11.4 Final integrated state and proofs

Integrated: GRÜN `5839762` (strict decoder and panel for the sweep coverage: `job-pool-capability-sweep`, per-requirement
sweep lines, per-role sweep-only count, COVERED != SCORED), PINK's suites up to `675590b`
(`test/job-pool-validation/**`: D-JP-1, layer separation, HTTP/canonical/inverse, browser walk, PDF path, sweep
coverage) and this document. Proofs as `condyn_test_runner` on disposable databases; `condyn` untouched.

| Proof | Result |
| --- | --- |
| `tsc --noEmit` | 0 errors |
| `next build` | passes; three job-pool routes dynamic |
| G2, runtime, adapters, integration, isolation, capability core, proposal projection, career runtime, HR loop, job pool (incl. Chromium e2e), PINK validation suites (incl. browser walk, PDF path, sweep coverage), legacy Step 16/23, worker, PDF loader and batch ingestion suites | 146 files, 1132 tests, all green |
| Sealed inventories (P8) | `test/decision-core`, `test/career/capability-core`, `test/decision-runtime`, `test/decision-adapters` diff-free against `435a112` |
| Final real walkthrough (`npm run job-pool:local`, PDF `docs/examples/cv.synthetic.pdf`, model from the operator env file) | pool 201; analyze 202 → SUCCEEDED in one attempt (123 s), `ANL_1791661195700_440`; analyses 200; matches 200 with `capabilitySweep` AVAILABLE · 14 proposals; `/career/demo?analysisId=…&jobPoolUploadId=…` 200; 0 notices; 0 failed attempts |

Model variance observed across four real runs of the same synthetic CV: the legacy analysis named 7, 5, 4 and 1
capabilities (the last run: only "TypeScript"), while the capability sweep of the same jobs proposed 9 to 14
source-verified capabilities each time. Scores therefore follow the legacy analysis and vary strongly; the sweep
coverage is stable but unscored. Whether the sweep may be scored is owner decision HIA-3.

Open boundaries (unchanged, owner): HIA-1 Phase-4 capability verification authority; HIA-2 model as CRR provider;
HIA-3 scoring of sweep proposals; B-JP-MODEL default Gemini cascade; B-ENTRY production provisioning; F-JP-5 G1 schema
drift; B-ANALYZE-PAGE legacy `/career/analyze` page; B-JP-CONTINUITY; B-JP-ACTOR.

## 12. Semantic governance of the Job Field (2026-10-11)

Owner mandate "SFE — JOB FIELD SEMANTIC GOVERNANCE": the capability, job-role, resonance and pending relations keep
one meaning per layer (reconstructed by GELB and, independently, by GRÜN for the Job Field). The same word on one screen never transfers authority, provenance or score between layers.

### 12.1 Glossary per layer

| Term | Canonical layer (C) | Presentation layer (P, job pool) | SIL planetarium (analysis view) | Decision layer (D) |
| --- | --- | --- | --- | --- |
| capability | `VerifiedCapability` in a `PHASE4_VERIFIED` snapshot; **none is produced at runtime** (HIA-1) | analysis capability (`identity.name`, confidence, evidence; scored) and capability sweep proposal (`PCAP_`, source-verified quote, no confidence; **unscored**) | capability orbit: analysis capabilities plus the F11 proposal overlay (authority NONE) | RCP item subjects (fixtures only) |
| job role | `TargetRoleProfileRevision` (`TRPREV_`, PROPOSAL_ONLY, authority NONE) mapped from a pool role | pool role (`poolRoleId`) with its `resonanceScore` | Role Manifestation: LLM-inferred career roles of the analysis, or canonical `RoleRelation` via the canonical SIL association | none |
| resonance | forbidden term inside canonical relations (role relation, tension, evolution contracts); in the canonical SIL read model only the region name for `OrganizationRelation` | `resonanceScore` = Σ contribution / Σ weight (CP-I, deterministic, authority NONE) | Resonance Orbits: LLM-generated organizations with `resonance_score` | none |
| relation | `CapabilityRequirementRelation`, aggregates, `RoleRelation`, tension, evolution input, recommendation proposal: produced only by governed producers; **the job pool produces none** | none; a match is not a relation | proposed relations between capability proposals (`PROPOSED`) | DCDRB and the post-decision chain |
| organization | `TargetOrganizationRevision` (`DECLARED_NAME`, upload-scoped entity) | pool organization (`poolOrganizationId`) | Resonance Orbits: LLM-inferred organizations of the analysis | none |
| gap | forbidden term inside canonical relations | not used; the presentation names missing requirements and pending kinds | Tension Field `capabilityGaps` (legacy projection, empty for real analyses) | none |
| evidence | requirement evidence = exact lines of the pool source (`SOURCE_MATCH_VERIFIED`) | analysis evidence quotes behind a scored match; source-verified sweep quotes behind unscored coverage; provenance printed per requirement | evidence inspector of the analysis | DAR/DCR evidence references |
| pending | `capabilityRequirementRelationState: NOT_EVALUATED`, reason `VERIFIED_CAPABILITY_SNAPSHOT_ABSENT` | per pool role four kinds: UNPROVEN_CANONICAL, UNRESOLVED_EVIDENCE (weak, reason stated), UNSCORED_COVERAGE, NO_EVIDENCE_DELIVERED | `PRE_CANONICAL_DISCOVERY`, `NOT_PRODUCED`, `EMPTY` region states | none |

### 12.2 Rules

- **SG-1 No identity inference across sources.** Pool organizations and roles are never joined with LLM-inferred
  organizations or roles by equal or similar names (`TargetOrganizationRevision`: "equal descriptors never resolve
  entity identity").
- **SG-2 Absent evidence is not absent capability.** A missing requirement means "no evidence delivered by the analysis";
  sweep coverage and missing evidence stay distinguishable.
- **SG-3 Presentation vocabulary stays out of canonical payloads.** No key of a proposed role profile or requirement
  contains resonance, score, weight, fit, match, gap, rank or recommend; weights are never mapped.
- **SG-4 The Job Field produces and references no canonical relation or decision.** Its files import no relation
  producer, relation persistence, decision field or HR loop module; its bodies carry no CRR/RRA/RRL/TSN/EIS/RPR/RCP or
  decision ids and no authority other than NONE.
- **SG-5 Scores are presentation.** `resonanceScore` and any geometry derived from it (e.g. distance) carry authority
  NONE and are labelled as presentation; sweep coverage is never scored (HIA-3).
- **SG-6 Pending is not a promise.** A NOT_EVALUATED canonical relation cites its reason and does not imply that a
  later step will prove the match; canonical evaluation needs HIA-1/HIA-2.

Proof: `test/career/job-pool/semantic-governance.test.ts` (SG-3, SG-4, SG-5; its file set includes GRÜN's Job Field
files by path pattern), `test/job-pool-validation/layer-separation.test.ts` (PINK), and the presentation suites
(SG-2, SG-6 states). SG-1 and the labels of SG-5/SG-6 are frontend rules reviewed with GRÜN (conditions G1–G6).

### 12.3 PINK's semantic findings F-JF-1 … F-JF-6 and their resolution

| Finding | Field | Resolution |
| --- | --- | --- |
| F-JF-1 two capability sources on one screen without a source label (orbit 02 shows sweep proposals, the panel counts analysis capabilities) | GRÜN | label each surface with its source (SG rule G5); which source is scored stays HIA-3 |
| F-JF-2 the planetarium's role alignment uses exact lowercase name equality, presentation matching a normalized equality | GELB | equality left unchanged: real analyses carry no role→requirement relations, so the path is dormant, and widening it would only trigger the proof-chain guards more often. The actual source defect was a latent crash: any name coincidence failed the whole projection with `ERR_EPISTEMIC_VIOLATION` (same CV document) or `ERR_PROOF_CHAIN_BROKEN` (no source manifest from the analyses route). `lib/career/ui-adapter.ts` now states such a relation UNRESOLVED (never absent, never satisfied). Proof: `test/career/planetarium-role-alignment.test.ts` (red before, green after). Labels for the two equalities: GRÜN |
| F-JF-3 `buildRoleRecommendation` builds `REC_<Date.now()>_<random>` on every render | GELB | not changed at the source: the id format is the G1 legacy lifecycle format, the DB-1 recovery candidate reproduces the deleted rows through exactly this derivation, and the legacy career freeze applies. The planetarium uses only `fitScore` and `recommendationState`; the test proves that the projection exposes no `REC_` id. Owner boundary B-JF-REC-ID |
| F-JF-4 proposed capability relations are not projected; orbit 05 `capabilityGaps` is always empty | GRÜN | presentation: state "NOT PROJECTED" on orbit 05 or project delivered facts with provenance (SG-2, SG-6) |
| F-JF-5 dead list components label a missing fitScore "UNSUPPORTED" and undefined confidence "0%" | GRÜN | remove or relabel before any list mode becomes reachable (SG-2) |
| F-JF-6 orbit 03 "resonance" for unscored CV organizations | GRÜN | Job Field qualifies "POOL RESONANCE (PRESENTATION)" (G2); orbit 03 subtitle is presentation copy |
