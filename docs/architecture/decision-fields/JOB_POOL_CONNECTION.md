# Job Pool Connection (JSON Job Pool → canonical target requirements → presentation matching)

Status: in implementation on `integration/job-pool-connection` (base `integration/hr-decision-loop` @ `5f47aa1`).
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
   DAR, DCTXREV or DCR. Each match states its basis (`EXACT`, `ALIAS`, `TOKEN_CONTAINMENT`) and the analysis
   evidence quotes it rests on.
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

## 4. Canonical mapping rules (layer C)

- **Identity scope.** Every target entity is scoped to one upload: `<KIND>ENT_` + hash(upload id, pool item id).
  Re-uploading byte-identical canonical content yields the same upload id and is idempotent. A new pool version is a
  new upload with new entities; continuity across uploads is not asserted (boundary B-JP-CONTINUITY).
- **Source.** One `TargetSourceRevision` per role (`sourceKind: "JOB_POOL_JSON_ROLE"`,
  `sourceLocator: jobpool://<upload>/roles/<roleId>`). `normalizedContent` is a deterministic, line-based rendering
  of pool, organization, role and the role's requirements; `rawContentHash` is the SHA-256 of the uploaded bytes.
- **Organization.** One `TargetOrganizationRevision` per pool organization, `descriptorKind: "DECLARED_NAME"`.
- **Bindings.** One role-source binding and one role-organization binding per role.
- **Role profile.** `reconstructTargetRoleProfiles` with the deterministic provider `CONDYN_JOB_POOL_JSON`; evidence
  quotes are exact lines of the source.
- **Requirements.** `reconstructTargetRequirementsDurably` with the same provider; admission
  `NEW_ENTITY_ADMITTED`, policy `JOB_POOL_UPLOAD_SCOPED_ENTITY_V1`, actor `JOB_POOL_UPLOADER:<declared actor>`.
  `required_level` maps verbatim to `{ kind: "CAPABILITY_LEVEL", level }` (empty → `UNKNOWN`).

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
- **B-ENTRY** applies: tables are registered only on verified disposable databases.
