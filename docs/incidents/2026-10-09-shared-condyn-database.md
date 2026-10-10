# Incident: test runs modified the shared `condyn` database (2026-10-09 / 2026-10-10)

Status: RECONSTRUCTED (read-only). Nothing restored, recreated or modified in `condyn`.
Protection: fail-closed test isolation on `integration/hr-decision-loop` @ `48d52c2`.

All database reads for this reconstruction ran with `default_transaction_read_only=on`.
Evidence sources: `pg_stat_user_tables`, `pg_stat_database`, catalogs (`pg_constraint`,
`pg_class`, `pg_namespace`, `pg_attribute`), the server log `/var/log/postgresql/postgresql-14-main.log*`
(readable via group `adm`; `log_statement=none`, so only ERROR lines with their statement),
the repository, and the read-only field reconstruction of 2026-10-09 (~19:1x) recorded in the
session transcript.

## 1. Observed state (2026-10-10 ~13:20, read-only)

| Object | 2026-10-09 ~19:1x | 2026-10-10 |
| --- | --- | --- |
| Tables in `public` | 76 | 76 |
| `career_recommendations`, `career_decisions`, `career_commitments`, `career_actions`, `career_outcomes`, `career_feedback`, `career_attributions` | 1 row each | 0 rows each |
| `career_capability_runs` | 2 rows (`RUN_4E856DAF4108C60E2CA3D003`, `CONV_396DCCEFFCCD2E4EBB192129`) | same 2 rows |
| `career_analyses`, `career_analysis_jobs`, `career_capability_snapshots` | 0 rows | 0 rows (no loss) |
| Schemas `t12a_0599156eb04ed694`, `t12a_d272561dfb63f6f5` | present (63 tables each) | present, no writes since the statistics reset |
| `career_capability_proposal_projection_references` foreign keys on `analysis_id` | not recorded | two: `…_referenc_analysis_id_fkey` NO ACTION (oid 44512) and `…_references_analysis_id_fk` CASCADE (oid 312637) |
| `decision_context_revisions`, DCDRB table, post-decision tables | absent | absent |

`pg_stat_database.stats_reset` for `condyn` is 2026-10-09 19:19:19; the server has run since
2026-09-24 01:02 without restart; no repository code calls `pg_stat_reset`. The reset coincides
with the first read-only query of the field reconstruction; its cause is UNKNOWN.

Write counters since that reset (inserts / deletes), all from test runs: `career_analysis_jobs`
349/329, `career_policy_versions` 155/155, `career_analyses` 103/103, `career_policy_promotions`
95/95, `career_recommendations` 90/91, `career_decisions` 90/71, `career_policy_families` 70/70,
`career_commitments` 70/56, `career_actions` 60/51, `career_outcomes` 50/41, `career_feedback`
45/41, `career_attributions` 35/31, `career_capability_proposal_projection_references` 45/9,
`career_learning_proposals` 25/25, `career_capability_runs` 18/18, `candidate_source_bundles` 9/9,
`candidate_source_bundle_document_references` 9/9, `career_canonical_sil_runtime_associations`
4/4. Inserts above deletes with zero live rows are aborted inserts (failed foreign keys).

## 2. Run windows on `condyn` (server log, ERROR lines as execution proxy)

| Window | Processes / errors | Families in error statements | Attribution |
| --- | --- | --- | --- |
| 2026-10-09 19:21:49 to 19:21:50 | 2 / 2 | `decision_context_revisions` in temporary schemas | this session: `test/decision-runtime` + `test/decision-adapters` without `DATABASE_URL` (schema-scoped CREATE/DROP SCHEMA) |
| 20:47:53 to 20:48:28 | 3 / 6 | DREV schemas, `career_capability_proposal_projection_references` in `public` | G2 producer session (PINK) |
| 21:12:37 to 21:21:11 | 40 / 101 | lifecycle tables, projection references, DREV schemas | PINK, first `test/career` batch (started ~21:11); first lifecycle-table error 21:13:34 |
| 21:48:00 to 21:48:40 | 3 / 6 | DCTXREV schemas | UNKNOWN |
| 21:53:40 to 22:00:22 | 42 / 110 | lifecycle tables, jobs, projection references | frontend session (GRÜN), top-level batch from 21:59:17; earlier part UNKNOWN |
| 22:09:04 to 22:11:15 | 33 / 87 | lifecycle tables, jobs, projection references | PINK, second batch |
| 2026-10-10 12:59:35 to 13:04:55 | 36 / 93 | lifecycle tables, jobs, projection references | PINK, third batch |

Successful statements are not logged; runs without errors are invisible here.

## 3. Findings

### DB-1: seven legacy lifecycle rows deleted

- Rows: chain `REC_1790085122039_982` → `DEC_1790085122042_366` → `COM_1790085122046_051` →
  `ACT_1790085122049_327` → `OUT_1790085122051_103` → `FDB_1790085122054_627` →
  `ATTR_1790085122057_501`, timestamps 2026-09-22T13:52:02.039Z .. .057Z.
- Origin: residue of test `N. save complete lifecycle` in
  `test/career-lifecycle-postgres-persistence.test.ts` run against `condyn` on 2026-09-22 13:52
  (fixtures `ROL_TEST`, `SUBJ_1`, `actor1`/`actor2`, "Looks good", `SEND_EMAIL`, `REPLIED`,
  `UNDESIRABLE`, `ASSOCIATED_WITH`; the suite deletes in `beforeEach` and never after). They were
  test artifacts, not live data.
- Cause of deletion: the G1 legacy suites (`career-lifecycle-*`, `career-policy-activation-atomicity`,
  `career-worker-*`, `career-async-job-contract`) delete these tables unconditionally through the
  module-level client, whose `DATABASE_URL` default was the shared database. They ran against
  `condyn` in the windows of section 2; the earliest is 2026-10-09 21:12 (PINK); which run removed
  the rows cannot be determined.
- Dead-tuple recovery: autovacuum ran on all seven tables afterwards (last 2026-10-10 13:01 to
  13:12); in-place recovery is not realistic and would require an extension install (a modification).
- No dump, backup or copy exists (confirmed by both peer sessions; no `*.sql`/`*.dump` found).
- Hash-verified reconstruction: all seven payloads are rebuilt offline and match their recorded
  SHA-256 `payload_hash` (`test/database-isolation/incident-db1-recovery-candidate.test.ts`).

### DB-2: duplicate foreign key on `analysis_id`

`lib/career/db/client.ts` drops `career_capability_proposal_projection_references_analysis_id_fkey`
by its full 66-character name; PostgreSQL stored the original inline key as
`career_capability_proposal_projection_referenc_analysis_id_fkey`. On a database created before the
overlay (as `condyn`) the original NO ACTION key survives next to the new CASCADE key, so the
intended cascade never takes effect. Reproduced in a disposable database. The CASCADE key
(oid 312637) is far younger than the table (oid 44503); it was added by an overlay `initDbSchema()`
run against `condyn` (exact time UNKNOWN; candidate runs include the frontend session's ~21:31 fixture
run and every test that calls `initDbSchema()` on the default URL).

### DB-3: overlay DDL applied to `condyn`

Present in `condyn`: column `candidate_source_bundle_id`, tables `candidate_source_bundles`,
`organization_relations`, `career_canonical_sil_runtime_associations` (oid 111674), the T11 chain,
the CASCADE key of DB-2. Writers: any `initDbSchema()` caller on the former default URL (16 test
files, `scripts/write-live-lifecycle.ts`, the HR loop local composition). Two `t12a_*` schemas with
63 tables each are leftovers of interrupted T12A fixture runs (fixture creates a schema in the
`DATABASE_URL` database); no writes since 2026-10-09 19:19.

## 4. Recovery options (owner decision; none executed)

| Option | Effect | Evidence quality | Notes |
| --- | --- | --- | --- |
| A. Accept the loss | `condyn` stays as is | n/a | the rows were test residue |
| B. Re-insert the seven rows from the hash-verified candidate | exact ids, payloads and hashes restored | every payload matches its recorded SHA-256; column values from the 2026-10-09 read | requires explicit authorization for a write to `condyn`; FK order REC → ATTR |
| C. Run `scripts/write-live-lifecycle.ts` | a new chain with new ids | n/a | not the same records |
| D. DB-2: drop the surviving NO ACTION key on `condyn` and fix the DDL name | cascade becomes effective | reproduced | DDL change on `condyn`; owner authorization |
| E. DB-3 / leftovers: drop the two `t12a_*` schemas; keep or remove overlay objects | cleanup | catalog | DDL on `condyn`; owner authorization |
| F. Database-level protection | tests cannot write `condyn` even when misconfigured | n/a | dedicated test role with CREATEDB and no rights on `condyn`, `REVOKE CONNECT ON DATABASE condyn FROM PUBLIC` (keep the app role), or a separate cluster for tests; permission changes need owner authorization |

## 5. Protection now in place (`48d52c2`)

See `docs/architecture/decision-fields/HR_DECISION_LOOP_INTEGRATION.md` section 7 and
`test/database-isolation/*`. The guard is code-level; option F would add a server-level barrier.

### Known limits of the code-level guard (independent verification, G2 producer session)

- In-process tampering that assembles the opt-in variable name at runtime and deletes the test-runner
  markers before importing the client can still reach `condyn`; the static test catches literal
  forms only.
- F-2: `vitest --config <other config>` skips the gate. The application client still refuses
  protected names, the non-sealed helpers classify the URL themselves, and the P7 second process
  verifies its target positively; the 22 sealed or frozen test files that read `DATABASE_URL`
  directly would follow a `condyn` URL in such a run.
- Both are closed only at the server level (option F).

## 6. Unresolved evidence

- Exact run that deleted the DB-1 rows (several candidates, no statement log).
- Origin of the 21:48 window and of the part of 21:53 to 21:59 before the frontend batch.
- Exact time of the DB-2/DB-3 overlay DDL on `condyn`.
- Cause of `stats_reset` at 19:19:19.
- The root-owned `next dev` process (pid 416931, since 2026-09-24, container `/app`) has an
  unreadable environment; whether it uses `condyn` is UNKNOWN.
