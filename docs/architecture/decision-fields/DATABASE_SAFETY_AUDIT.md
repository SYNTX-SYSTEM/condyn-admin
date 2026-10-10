# Database Safety Audit: shared `condyn` database and test isolation

Status: GUARD VERIFIED 2026-10-10 (PINK session, independent validation); full-suite run under the runner pending section 6. Read-only evidence; nothing
restored or repaired; no write to the shared database during this audit.

Global hard boundary under audit: the shared `condyn` database must never be deleted, dropped,
truncated, reset, overwritten, migrated, seeded, restored or modified by tests or autonomous agents.

## 1. Access paths (reconstructed from code, configuration and processes)

| Id | Path | Reaches the shared database when |
| --- | --- | --- |
| P1 | `lib/career/db/client.ts:15` `process.env.DATABASE_URL \|\| "postgresql://postgres:postgres@localhost:5432/condyn"`; module-level pool created at import | `DATABASE_URL` unset or empty. Imported by 18 test files, three `app/api/career/*` routes, `lib/decision-runtime/local/*`, `lib/persistence/unified-schema-registration`, `lib/career/hr-decision-loop/local-composition` |
| P2 | 28 test files build their own client from `process.env.DATABASE_URL ?? \|\| <shared default>`; 22 of them create throwaway schemas inside that database, 6 create throwaway databases but derive the admin connection from the same string | `DATABASE_URL` unset or empty: DDL (`CREATE SCHEMA`, `DROP SCHEMA … CASCADE`) in the shared database |
| P3 | `initDbSchema()` / `applyCareerDbSchema()`: 16 test files, `scripts/write-live-lifecycle.ts`, `lib/career/hr-decision-loop/local-composition.ts` (per request), `lib/persistence/unified-schema-registration` | Applies overlay DDL (`ADD COLUMN candidate_source_bundle_id`, `DROP/ADD CONSTRAINT` at `client.ts:186-189`, `CREATE TABLE career_canonical_sil_runtime_associations`, T11, SIL lineage) to the singleton's target; on 3D000 issues `CREATE DATABASE` through `/postgres` or `/template1` derived from the same string |
| P4 | `ensureDecisionRuntimePostgresSchema(db)` in `lib/decision-runtime/local/decision-context-api.ts` | `CREATE TABLE IF NOT EXISTS decision_context_revisions` on every `/api/decision-contexts` request against the singleton |
| P5 | Runners: `npm test` (`vitest`, repo-wide), `test-and-build.sh` (`npx vitest run`), `worker:career` (`tsx --env-file=.env.local`, no `DATABASE_URL` in any `.env.local`), `scripts/write-live-lifecycle.ts`, `scripts/run-career-worker.ts`; `vitest.config.ts` loads `.env*` via `loadEnv`, no `setupFiles`, no `globalSetup` | Any invocation without an explicit isolated `DATABASE_URL` |
| P6 | Destructive setup on the singleton: `test/career-worker-lease-retry` (15 `DELETE FROM` incl. all seven lifecycle tables, policy tables, jobs, analyses), `career-async-job-contract` (seven lifecycle tables), `career-lifecycle-{postgres-persistence,recovery,concurrency-idempotency}`, `career-policy-activation-atomicity`, `career-immutable-analysis-persistence` | Whenever these files are selected by a vitest glob (`test/career` matches them) with P1 unguarded |
| P7 | Processes: root-owned `node /app/node_modules/.bin/next dev` (pid 416931, since 2026-09-24, environment not readable); server settings `log_statement=none`, `log_connections=off`, no `pg_stat_statements` | Unknown target; owner decision |

## 2. Fail-closed probe of P1 (no connection; postgres-js resolved options)

| `DATABASE_URL` | Resolved target | Verdict |
| --- | --- | --- |
| unset | `localhost:5432/condyn` | VIOLATION: silent fallback to the shared database |
| `""` | `localhost:5432/condyn` | VIOLATION: `\|\|` treats empty as missing |
| `" "` | `TypeError: Invalid URL` at import | fails closed by accident (crash), no guard |
| `postgresql://…@localhost:5432` (no path) | database `postgres` | VIOLATION class: maintenance database |
| `mysql://x` | host `x`, database = OS user | accepted garbage |
| `postgres://…@127.0.0.1/condyn` | `condyn` | alias reaches the shared database |
| `…/CONDYN` | `CONDYN` (distinct, case-sensitive) | harmless |
| `…/condyn_pink_probe` | isolated | expected |

## 3. Evidence for the reported incidents (read-only)

- **DB-1, seven legacy lifecycle rows lost.** `pg_stat_user_tables` (stats reset 2026-10-09 19:19:19): `career_recommendations` inserted 90 / deleted 91, `career_decisions` 90 / 71, `career_commitments` 70 / 56, `career_actions` 60 / 51, `career_outcomes` 50 / 41, `career_feedback` 45 / 41, `career_attributions` 35 / 31, all with 0 live tuples; last autovacuum 2026-10-10 13:01 to 13:05, so dead tuples are gone. Server log (errors as execution proxy, `postgres@condyn`): lifecycle-table activity only at 2026-10-09 21:13 and 21:16 (PINK's first `vitest run test/career`, started 21:11), 21:55, 21:56 and 21:59 (another session's top-level batch), 22:10 (PINK's second run), 2026-10-10 13:00 and 13:04 (PINK's third run). No lifecycle-table activity on `condyn` earlier that day; the classification runs used `condyn_sfe_ovl_legacy`. The earliest destructive run on the shared lifecycle tables recorded in the log is PINK's at 21:13 on 2026-10-09. Which run removed the original rows cannot be proven from the log because `log_statement=none`.
- **DB-2, duplicate `analysis_id` foreign key.** `pg_constraint` on `career_capability_proposal_projection_references` holds `career_capability_proposal_projection_referenc_analysis_id_fkey` (NO ACTION, PostgreSQL's truncation of the original inline constraint) and `career_capability_proposal_projection_references_analysis_id_fk` (CASCADE, the 66-character name at `client.ts:187` truncated to 63). `DROP CONSTRAINT IF EXISTS` with the long name matches only its own truncation, so the original survives. The `job_id` key has one CASCADE constraint.
- **DB-3, overlay DDL on the shared database.** Present on `condyn`: nullable column `candidate_source_bundle_id`, tables `candidate_source_bundles` (oid 81478), `organization_relations` (81497), `career_canonical_sil_runtime_associations` (111674), the full T11 chain (oids 80943 to 81466); 76 tables. Absent: `decision_context_revisions`, the DCDRB table. Any `initDbSchema()` caller on the default URL (P3) writes this DDL.

## 4. Independent validation of the protection

Guard under test: `integration/hr-decision-loop` @ `48d52c2` (policy `lib/database-isolation/policy.ts`,
verification `verification.ts`, vitest `globalSetup` and per-file `setupFiles`, `scripts/test-db/*`,
client without fallback). Verified independently on this branch after merge; every refused case was a real
child `vitest run` process with a payload test file that never executed.

| Case (`DATABASE_URL`) | Expected | Observed |
| --- | --- | --- |
| unset, `""`, `"   "` | MISSING | MISSING, no test body ran |
| `not a url`, `mysql://…` | MALFORMED | MALFORMED |
| no path, trailing slash, `?dbname=condyn`, `#frag`, two path segments, percent-encoded name, `postgresql:///name` | AMBIGUOUS | AMBIGUOUS |
| `condyn`, `127.0.0.1:1/condyn` (closed port), `CONDYN`, `postgres`, `template1` | PROTECTED before any connection | PROTECTED (closed port proves no connection) |
| `condyn_dll_abc`, 15-hex name, uppercase hex | NOT_DISPOSABLE | NOT_DISPOSABLE |
| `db.example.com` | NON_LOCAL_HOST | NON_LOCAL_HOST |
| pattern-valid absent database | connect error | `does not exist` |
| pattern-valid unmarked database; pattern-valid database carrying another name's marker | NOT_MARKED | NOT_MARKED for vitest and for `test:db:drop` (both databases created and removed by the auditor on the maintenance database) |
| `.env.local` / `.env.test.local` naming `condyn`, process env unset | ignored | MISSING |
| `TEST_DATABASE_ADMIN_URL` missing, `/condyn`, `/postgres?x=1`, remote host | refused without connecting | MISSING / NOT_MAINTENANCE / NOT_MAINTENANCE / NON_LOCAL_HOST |
| `test:db:drop` on `condyn`, `postgres`, `condyn_pink_x` | refused by policy | PROTECTED / PROTECTED / NOT_DISPOSABLE |
| application client outside vitest: unset, `""`, whitespace, `PGDATABASE=condyn` with unset URL | unroutable `.invalid` host | `.invalid` host |
| application client with `VITEST=1` and `/condyn` | unroutable | `.invalid` host |
| `npm test`, `test-and-build.sh` | through the runner | `tsx scripts/test-db/run.ts`; create, vitest, drop observed |

**Residual vector F-1 (potential violation, deliberate test code only).** A test file that sets
`process.env.DATABASE_URL` to the shared URL and deletes `process.env.VITEST` before its first import of
`lib/career/db/client` obtains a client resolved to `localhost/condyn` (proved in an isolated run; no query
was issued). The per-file setup resets `DATABASE_URL`, but the client's protected-name refusal keys on a
marker the test process controls. Not reachable by configuration or by any existing test; reachable by an
agent writing such a test. Mitigations are listed in section 5.

**Minor.** `[::1]` passes the policy but postgres-js parses the host as `[` (ENOTFOUND); IPv6 loopback is
unusable, harmless.

## 5. Remaining risks and owner decisions

| Id | Risk or decision | Owner |
| --- | --- | --- |
| R1 | F-1 above: make the client refuse protected names unconditionally unless an explicit production opt-in variable is set by the real server and worker only, and let the static isolation test forbid `delete process.env.VITEST` and assignments to `process.env.DATABASE_URL` under `test/`. | GELB / owner |
| R2 | The guard is code-level. A PostgreSQL role for tests without `CONNECT` on `condyn` (and the application role without `DROP`/`TRUNCATE` on it) would hold even if the code guard is bypassed. Credentials are an owner decision. | owner |
| R3 | `psql`, `pg_dump`, direct scripts and agents are outside the guard. The rule "never `condyn` in any command" remains procedural. | owner |
| R4 | Production and the worker now fail closed when `DATABASE_URL` is unset: `npm run worker:career` with the present `.env.local` (no `DATABASE_URL`) no longer reaches `condyn`. The owner must set the variable explicitly where the shared database is intended. | owner |
| R5 | Root-owned container `next dev` (pid 416931, since 2026-09-24) has an unreadable environment; its database target is unknown. | owner |
| R6 | Server logging: `log_statement=none`, `log_connections=off`, no `pg_stat_statements`; incidents can only be timed by error lines and vacuum statistics. Enabling `log_connections` and `log_statement=ddl` would make the next incident attributable. | owner |
| R7 | DB-2 (duplicate `analysis_id` foreign key) and DB-3 (overlay DDL) remain on `condyn` as found; whether to remove or keep them is a data decision, not made here. | owner |
| R8 | 22 sealed or frozen test files keep a literal shared-database fallback that is unreachable under the guard and pinned by `test/database-isolation/access-paths.test.ts`; removing the literals would alter sealed files. | owner / governance |

## 6. Regression and integration under the runner

PENDING_RUNNER_RESULTS
