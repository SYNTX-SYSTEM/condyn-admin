# Field 01 Overlay Classification

Status: CLASSIFIED 2026-10-09 against `wip/field-01-overlay-2026-09-22` @ `9802146`
(base `architecture/target-revision-runtime` @ `b001360`).

This classification applies the five FIELD_01 categories to every component
of the preserved overlay: canonical continuation, compatibility layer,
superseded local experiment, test infrastructure, semantic conflict. It is
required by decision D5 of
`docs/architecture/decision-fields/G2_G3_FIELD_RELATION.md` (branch
`architecture/g2-g3-field-relation`) before the overlay may serve as the
integration base.

## 1. Inventory of the overlay (b001360..9802146)

144 files: 41 added, 98 modified, 5 renamed into the archive, 0 deleted.

| Group | Files | Nature (verified by diff) |
| --- | --- | --- |
| Relation contracts, relation adapters, target adapters | 39 modified in `lib/career/relation`, `lib/career/relation-adapters`, `lib/career/target-adapters` (+332 / -183) | TypeScript strictness refactors: `Array.isArray(value) ? value : fail()`, `return fail(...)` in non-void paths, one-line producers reformatted into readable statements. No change to any `createHash` input, `SCHEMA_VERSION` constant, ID prefix, slice length, or canonical key order. |
| Persistence registration | `lib/career/db/client.ts`, `lib/career/db/schema.ts` | `ON DELETE CASCADE` on the two FKs of `career_capability_proposal_projection_references`; new nullable column `candidate_source_bundle_id` there; new table `career_canonical_sil_runtime_associations` (no FKs); startup `ALTER TABLE ... IF NOT EXISTS` statements. |
| Canonical SIL Stage-B runtime (Field 02) | added: `lib/career/runtime/canonical-sil-execution/*` (5), `lib/career/sil-projection/frontend-presentation.ts`, `app/api/career/canonical-sil/execute/route.ts`, `app/api/career/canonical-sil/[associationId]/route.ts`; modified: `SemanticCareerIntelligenceField.tsx`, `OrbitalResonanceBubble.tsx`, `CareerIntelligenceDashboard.tsx`, `app/career/demo/page.tsx` | New product path: exact-id Stage-B execution (ORL, TSN, EIS) and exact association read; frontend fetches `/api/career/canonical-sil/{associationId}` and decodes a pure presentation; legacy `adaptCanonicalToDemoState` retained as fallback. |
| Worker provenance | `lib/career/orchestration/career-analysis-job-processor.ts`, `lib/career/capability-core/projection/reference-repository.ts`, `scripts/run-career-worker.ts` | Records `candidateSourceBundleId` on the projection reference so a later Stage-B run can retrieve the exact bundle. |
| Admission wiring | two `*-admission/application.ts` (+9 / -9 each), `lib/career/runtime/organization-relation-evolution-coordinator/index.ts`, `lib/career/recommendations/gaps.ts` | Type-level adjustments; no new relation. |
| Tests | 45 modified under `test/` and `test/career`; 7 added (`canonical-sil-api-contract`, `runtime/canonical-sil-execution/*`, `sil-projection/frontend-presentation`, `outcome-valence-feedback-context-revision-lifecycle/field-integration`) | Fixture typing and the new Field 02 / T49 proofs. |
| Sealed G2 test surface | `test/decision-core/state-change-claim/contract.test.ts` | Replaces an unsafe cast with a discriminant check. Type-only; fixes the single `tsc` error G2 had at `ee06ff6`. |
| Archive | 20 added under `docs/archive/architecture-overlays/precanonical-decision-execution/`, 5 renamed into it | Disposition README dated 2026-09-22 plus archived overlay sources and five archived tests (`.archive` suffix or outside the test glob). |
| Registry and seals | `docs/architecture/system-fields/README.md`, `FIELD_01`, `FIELD_02`, `FIELD_03`, `docs/seals/T13A_PERSISTENCE_REPLAY_RED_SEAL.md`, `T10_POSTGRES_HOST_SEAL.txt` | Field registry, a RED seal, a host-gated test output. |

Not preserved: seven zero-byte shell-redirect artifacts at the repository root.

## 2. Classification

| Component | Category | Reasoning | Boundary |
| --- | --- | --- | --- |
| Relation, relation-adapter and target-adapter refactors (39 files) | CANONICAL CONTINUATION | Identity formulas, schema versions and canonical orders unchanged; `tsc` moves from 253 errors to 0; the G3 suites pass unchanged (section 3). This is the FIELD_01 "typecheck closure" delivered. | none |
| `ON DELETE CASCADE` on projection references | CANONICAL CONTINUATION, flagged | The reference is technical provenance owned by analysis and job; cascade is cleanup integrity, not selection. It is the only destructive FK behavior in the field. | Must stay confined to `career_capability_proposal_projection_references`; never applied to any revision or declaration table. |
| `candidate_source_bundle_id` column and worker provenance | CANONICAL CONTINUATION | Carries the exact retrieval identity Field 02 requires; nullable; no selection semantics. | none |
| `career_canonical_sil_runtime_associations` | CANONICAL CONTINUATION, provisional | Immutable association of six exact identities with hash identity `CSILRA_`; created before T11 with no FKs. | FK-less by design; its lineage checks live in code (`server-read-service.ts`). Field 02 must decide whether FKs to the six tables are wanted. |
| Canonical SIL Stage-B routes and runtime | CANONICAL CONTINUATION, unsealed | Implements the FIELD_02 egress path with exact-id reads, no latest/current selection, env-bound policy versions. Tests exist and pass (section 3). No visual seal. | Policy versions come from two environment variables; absent variables fail with a 500. Not a frontend seal: "NO SCREENSHOT = NO VISUAL FRONTEND SEAL". |
| `frontend-presentation.ts` and component changes | CANONICAL CONTINUATION, with COMPATIBILITY LAYER retained | Pure presentation decode; `adaptCanonicalToDemoState` stays as the legacy fallback until the canonical path is proven end to end. | The fallback is the compatibility layer; its removal is a Field 02 work unit. |
| T49 lifecycle integration test | TEST INFRASTRUCTURE | In-memory proof of the full T12 to T13H chain to COVFCR for all four valences. It is Field 03 evidence, not production. | In-memory only; the PostgreSQL variant is a Field 03 proof obligation. |
| `test/decision-core/state-change-claim/contract.test.ts` | TEST INFRASTRUCTURE in a SEALED SURFACE | Type-only fix. The phase gate manifest lists `test/decision-core` under `noDiffPaths`; the 8E2 seal covers this file. | Requires G2 governance acknowledgement before merge toward `capability-mapping`; functionally harmless. |
| Archived precanonical Decision/Execution overlay (20 + 5 files) | SUPERSEDED LOCAL EXPERIMENT | Disposition README of 2026-09-22 states incompatibility with the canonical lineage DAR → DCTXREV → DCR → DAINT → HCOM → EAGR → ECTXREV. Archived sources are outside the TypeScript program and the test glob. | Must never be imported; archive-only. |
| Archived `career-trust-audit.test.tsx` | LEGACY QUARANTINE | Phase 6 G1 regression suite over legacy fixtures; it carried 11 `tsc` errors at `ee06ff6`. Archiving removes it from the program without weakening strictness elsewhere. | G1 is non-authoritative (G2 ARCHITECTURE.md:622); its remaining suites are a separate quarantine decision. |
| System-field registry FIELD_01 to FIELD_03 | CANONICAL CONTINUATION (governance documents) | Define the fields this classification serves. | none |
| T13A RED seal, T10 host seal output | TEST INFRASTRUCTURE (historical evidence) | T13A is a RED seal at `b5ecb8a`; T10 records a failing concrete-composition test later archived. | Historical; not current proof. |
| Semantic conflicts | NONE FOUND | No component of the overlay reinterprets the Decision/Execution chain, manufactures currentness, or hides WIP from TypeScript by exclusion. | |

## 3. Preservation and type-check proof

All runs on 2026-10-09 against `9802146`, each in a freshly created
PostgreSQL database that was dropped afterwards (`condyn_sfe_ovl_g2`,
`condyn_sfe_ovl_g3`, `condyn_sfe_ovl_legacy`). The shared `condyn` database
was not touched. Live provider tests stayed skipped by their own guards.

| Proof | Scope | Result |
| --- | --- | --- |
| Type-check | `npx tsc --noEmit -p tsconfig.json` on the overlay tree | 0 errors (base `b001360`: 253 errors; `capability-mapping` @ `ee06ff6`: 79 errors) |
| G2 preservation | `test/decision-core`, `test/decision-runtime`, `test/decision-adapters` | 46 files, 442 tests: 441 passed in the parallel batch, 1 timed out at 5000 ms under load (`structural-consequences/reconstruct.test.ts`); re-run on an idle machine: 8/8 passed on the overlay and 8/8 on `ee06ff6`. R5 HTTP e2e GREEN in its own isolated database. |
| G3 and capability preservation | `vitest run test/career` (matches `test/career/**` and the top-level `test/career-*` files): 284 files, 1653 tests | 271 files passed, 6 skipped, 7 failed. Of the 7: 2 are G3 suites that timed out at 5000 ms under load (`outcome-valence-feedback-context-revision-persistence`, `...-revision-replay`), re-run idle: 13/13 passed. The other 5 are legacy, see next row. No G3 contract, adapter, target, SIL or runtime suite failed on content. |
| Legacy regression classification | top-level `test/*.test.ts(x)`: 129 files, 665 tests | 116 passed, 8 skipped (live guards), 5 failed with 29 tests: `career-lifecycle-postgres-persistence`, `career-lifecycle-recovery`, `career-lifecycle-concurrency-idempotency`, `career-policy-activation-atomicity` fail on a fresh database with `42703 column "version" of relation "career_policy_versions" does not exist` and `23502` NOT NULL `actor` on `career_commitments`: the G1 DDL in `lib/career/db/client.ts` has drifted from `lib/career/db/schema.ts` since `1c64dc1`; `career-worker-config-validation` fails because it deletes from `career_analysis_jobs` without provisioning the schema first (ordering dependency on another suite). Both root causes pre-date the overlay and are identical on `b001360`. |

Residual classification per FIELD_01: the five failing legacy suites are a
LEGACY QUARANTINE boundary (G1 is non-authoritative; its repair or
retirement is a separate work unit). The two load timeouts are TEST
INFRASTRUCTURE (5000 ms default timeout on deep fixture chains), not
defects. No locally owned type, build or test defect remains unexplained.
`next build` was not run.

## 4. Decision

The overlay `wip/field-01-overlay-2026-09-22` is CLASSIFIED. Every component
is a canonical continuation, a retained compatibility layer, test
infrastructure, an archived superseded experiment, or legacy quarantine. No
semantic conflict was found. Two items carry governance flags: the type-only
change to the sealed `test/decision-core/state-change-claim/contract.test.ts`
and the `ON DELETE CASCADE` on projection references.

Per decision D5 this commit, with this classification added on top, is the
integration base for `integration/g2-producer-adapters` and
`integration/g3-decision-context-binding`. Field 02 and Field 03 remain
"Planned"; their readiness condition (coherent type, persistence and startup
foundation) is met for everything the overlay owns, and bounded by the
legacy quarantine above.
