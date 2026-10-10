# Database Safety Architecture: HR Decision Looper test isolation

Status: IMPLEMENTED AND PROVEN 2026-10-10 for layers 1 to 3 (GELB, `integration/hr-decision-loop`
@ `ed0ad2f`); layer 4 PROVISIONED AND PROVEN (PINK, `validation/hr-decision-loop-pink`) after the
owner authorized the dedicated least-privilege test role (decision relayed by GELB on 2026-10-10;
privilege hardening inside `condyn` itself remains subject to a separate approval after an impact
assessment). Companion records: `DATABASE_SAFETY_AUDIT.md` (access paths,
fail-closed verification, incident evidence), `docs/incidents/2026-10-09-shared-condyn-database.md`.

Hard boundary: the shared `condyn` database is never deleted, reset, overwritten, migrated, seeded,
restored or modified by tests or autonomous agents; tests run only against positively identified
disposable databases and fail closed otherwise.

## 1. Layers

| Layer | Mechanism | Home | Holds against |
| --- | --- | --- | --- |
| 1 Policy | `classifyTestDatabaseUrl`: only `postgres(ql)://` with one explicit loopback (or allowlisted) host, no query, no fragment, exactly one unencoded path segment matching `condyn_test_<16 hex>`; `condyn`, `postgres`, `template*` protected; refusal codes `ERR_TEST_DATABASE_ISOLATION_{MISSING,MALFORMED,AMBIGUOUS,PROTECTED,NOT_DISPOSABLE,NON_LOCAL_HOST}` | `lib/database-isolation/policy.ts` | wrong, missing, aliased, encoded or shared URLs, before any connection |
| 2 Identity | `verifyDisposableTestDatabase`: read-only connection must report exactly the named database and the marker `COMMENT ON DATABASE … IS 'CONDYN_DISPOSABLE_TEST_DATABASE <name>'`; `NOT_MARKED`, `IDENTITY_MISMATCH`; drop refuses anything not positively identified | `lib/database-isolation/verification.ts` | look-alike names, unmarked databases, drops of the wrong target |
| 3 Runtime gate | vitest `globalSetup` verifies before any file; per-file `setupFiles` resets `DATABASE_URL` to the verified URL and deletes the shared-database opt-in; `.env` files cannot supply `DATABASE_URL`; the application client has no fallback (missing → unroutable `.invalid` host; protected name → `.invalid` unless `CONDYN_ALLOW_SHARED_DATABASE=1` outside any vitest marker); `npm test`, `test:isolated` and `test-and-build.sh` run create → vitest → drop through `scripts/test-db/run.ts` with a validated maintenance `TEST_DATABASE_ADMIN_URL`; static regression pins the 22 sealed fallback literals and forbids runner-marker or opt-in mentions under `test/` | `test/support/database-isolation/*`, `scripts/test-db/*`, `lib/career/db/client.ts`, `test/database-isolation/*` | configuration mistakes, forgotten environment, ordinary test code, `.env` leakage |
| 4 Server privilege | a dedicated login role (`condyn_test_runner`: `LOGIN CREATEDB NOSUPERUSER NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS`, no memberships) that owns nothing in `condyn`; it owns the disposable databases it creates | `scripts/test-db/provision-role.ts` (owner step), `test/database-isolation/least-privilege-role.test.ts` (proof, UNVERIFIED under a superuser admin) | everything a bypassed code guard could attempt: PostgreSQL denies the role `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `ALTER`, `DROP` on every existing `condyn` table and `DROP`/`COMMENT` on the database |

## 2. Proven behaviour (reproducible)

- Layers 1 to 3: every refused class aborts a real `vitest run` child process in `globalSetup`
  (`DATABASE_SAFETY_AUDIT.md` section 4); all suites run through the runner with no leftover
  database (section 6 there).
- Layer 4 history: a first, autonomous creation of the role on 2026-10-10 was reverted the same hour
  because creating a cluster principal exceeded the autonomous mandate (GELB raised it). After the
  owner's authorization the role was provisioned again with `scripts/test-db/provision-role.ts`
  (idempotent re-run verified); credentials live in `~/.config/condyn/test-db-role.env` (mode 600,
  outside the repository), admin URL form `postgresql://condyn_test_runner:<password>@localhost:5432/postgres`.
  Read-only catalog facts, identical for the transient and the provisioned role:
  `has_database_privilege(role,'condyn','CONNECT') = true`, `CREATE` on the database `false`,
  `has_schema_privilege(role,'public','CREATE') = false`, no privilege on any of the 76 tables, owner of
  `condyn` is `postgres`; the runner created, marked, used and dropped `condyn_test_aeedb48cd7a3e3e9` as
  that role for `test/database-isolation` plus P7 (61 / 61, no leftover). Under a superuser admin the
  least-privilege test reports `UNVERIFIED` (skipped with reason), never a pass.

## 3. Residual limits and what closes them

| Limit | Layer that closes it | State |
| --- | --- | --- |
| In-process tampering with runtime-assembled environment names (probe D) | 4 | closed for existing `condyn` objects once the runner uses the role (PostgreSQL denies the role every privilege on them) |
| `vitest --config` override that drops the gate for the 22 pinned sealed fallback readers | 4 | closed for existing `condyn` objects once the runner uses the role |
| New objects in `condyn.public` by a non-owner role | none needed: `condyn.public` has `nspacl` NULL, which for schemas is the owner-only default (the PostgreSQL 14 `PUBLIC CREATE` grant exists only where the ACL is explicit, as in `template1`); `has_schema_privilege` is `false` for every non-owner role (corrected by GELB's `CONDYN_PRIVILEGE_HARDENING_ASSESSMENT.md`). The remaining `PUBLIC` defaults are `CONNECT` and `TEMP` on the database; option H1 (`REVOKE CONNECT, TEMPORARY ON DATABASE condyn FROM PUBLIC`) is prepared, not applied, pending separate approval | assessed, not applied |
| Runtime schema registration in an application composition (proposed on `frontend/hr-decision-dock-finalization`: `registerUnifiedPersistenceSchema` inside the HR local composition) would migrate `condyn` when the app runs against it with the opt-in | gate the registration on a verified disposable database or make it an owner-run migration; not merged into the integration tip (`ed0ad2f`) | flagged by GELB, open |
| Direct `psql`, `pg_dump`, scripts and agents outside the runner | procedural rule plus layer 4 | procedural |
| Attribution of a future incident (`log_statement=none`, `log_connections=off`) | owner: `log_connections=on`, `log_statement=ddl` | owner checklist |

## 4. Owner checklist (in order)

1. DONE 2026-10-10 (authorized): `TEST_DATABASE_PROVISIONER_URL=postgresql://postgres:<pw>@localhost:5432/postgres TEST_DATABASE_ROLE_PASSWORD=<24+ chars> npx tsx scripts/test-db/provision-role.ts` (idempotent; prints the `TEST_DATABASE_ADMIN_URL`). Password kept outside the repository.
2. Switch every runner invocation to that `TEST_DATABASE_ADMIN_URL` (`set -a; . ~/.config/condyn/test-db-role.env; set +a`); `test/database-isolation/least-privilege-role.test.ts` then proves layer 4 on every run.
3. DONE by GELB on `integration/hr-decision-loop`: `run.ts` and `create.ts` call `assertLeastPrivilegeAdmin` and refuse a superuser admin unless `TEST_DATABASE_ALLOW_SUPERUSER` is exactly `1` (verified on the maintenance connection).
4. Inside `condyn`, only after the separate approval: option H1 of `CONDYN_PRIVILEGE_HARDENING_ASSESSMENT.md` (`REVOKE CONNECT, TEMPORARY ON DATABASE condyn FROM PUBLIC`, with explicit grants for the application roles). `REVOKE CREATE ON SCHEMA public` is a no-op in `condyn` and is dropped from this list.
5. Server: `log_connections=on`, `log_statement=ddl`.

## 5. How to run tests now

```
TEST_DATABASE_ADMIN_URL=postgresql://<admin>:<pw>@localhost:5432/postgres npm run -s test:isolated -- <vitest args>
```

Creates a marked `condyn_test_<16 hex>` database, runs vitest against it, drops it. A plain `npx vitest run`
without a verified `DATABASE_URL` aborts before any test. Never pass a URL naming `condyn`.

## 6. Top-down reconstruction of the integration tip candidate (read-only, 2026-10-10)

Candidate: `frontend/hr-decision-dock-finalization` @ `37eea05` (GRÜN), which already contains
`integration/hr-decision-loop` up to `e43f11e` (GELB: least privilege by default, hardening assessment)
and PINK's layer-4 files as `5c52dea`. No file overlap with `ed0ad2f`. GELB merges it into the
integration branch; PINK validates the pushed result independently.

| Relation | Finding (by reading the code, before execution) |
| --- | --- |
| Runtime schema registration | `lib/career/hr-decision-loop/local-composition.ts`: `ensureHrDecisionLoopPersistenceRegistration()` runs `registerUnifiedPersistenceSchema` only after `verifyDisposableTestDatabase(DATABASE_URL)` succeeds; any refusal or connection error yields `NO_DDL_ON_NON_DISPOSABLE_DATABASE`, cached once per process. On `condyn` (PROTECTED by name) no DDL can run; absent tables surface as `NOT_PROVISIONED`. Consequence for production: schema provisioning on the shared database becomes an explicit owner-run migration, never a request side effect. Gate test: `test/career/hr-decision-loop/local-composition-gate.test.ts` |
| Manual environment | `scripts/hr-decision-loop-local.ts` (`up`, `seed`, `serve`, `status`, `drop`): admin URL validated, `assertLeastPrivilegeAdmin` enforced, database created with `createDisposableTestDatabase`, verified before seeding and again before `next dev --webpack` starts, exposed to the server only as the verified URL, removed only with `dropDisposableTestDatabase`; `CONDYN_ALLOW_SHARED_DATABASE` never set; state under `.hr-loop-local/` (git-ignored) |
| Runner least privilege | `scripts/test-db/admin-privilege.ts`: superuser admin refused unless `TEST_DATABASE_ALLOW_SUPERUSER` is exactly `1`, checked read-only on the maintenance connection; used by `run.ts`, `create.ts` and the manual environment |
| Prepared hardening H1 | `scripts/db-hardening/condyn-public-connect-hardening.PREPARED.sql`: pre-checks (datacl NULL, owner `postgres`), `REVOKE CONNECT, TEMPORARY ON DATABASE condyn FROM PUBLIC`, explicit grant to `postgres`, in-transaction post-checks, rollback recipe. Impact on `authenticator`, `hr_timesheet_user`, `web_anon`: they lose `CONNECT` and `TEMP` on `condyn` but already hold no privilege on any schema or relation there (assessment table); current `pg_stat_activity` shows no connection of those roles to `condyn`. NOT APPLIED; owner approval pending |

Execution evidence for the merged result is in section 7.

## 7. Execution evidence on the integration tip `6f400ea` (merge `63e7d9f` of `37eea05`), 2026-10-10

All runs as `condyn_test_runner` through `npm run -s test:isolated` (superuser admin refused by default,
verified: `ERR_TEST_DATABASE_ADMIN_SUPERUSER`), each in a marked `condyn_test_<16 hex>` database created
and dropped by the runner; the validation tree is `validation/hr-decision-loop-pink` @ `18cca4d` (the tip
plus this record); `tsc --noEmit` 0 errors.

| Proof | Result |
| --- | --- |
| Light checks: registration gate (`local-composition-gate`, `local-composition.postgres`), `test/database-isolation` with the least-privilege proof executed, P7 forward and inverse | 11 files, 69 / 69 |
| G2 + integration + isolation + capability-core + HR loop (batch, one other session's run concurrent, load 3.4 to 3.8) | 111 files, 949 passed, 7 skipped, 3 failed: the three TypeScript-program tests at 6.1 to 7.4 s (load), and the HR loop e2e file failed in its setup hook so its seven tests were reported skipped (hook error not captured in the filtered batch output) |
| Idle re-run of the three TypeScript-program files and the three COVFCR suites | 5 files, 63 / 63 (3.0 to 3.6 s per program test) |
| Idle re-run of the HR loop e2e with Chromium (`CONDYN_PLAYWRIGHT_MODULE` set) | 7 / 7: fifteen families incl. the DCDRB binding region, sealed-gate declaration and rejection, next-context lineage through the frozen G2 GET, dock only for an explicit DCTXREV, bound root as exact entry point in the browser |
| `test/career` (batch, concurrent other run) | 299 files, 1677 passed, 6 skipped, 33 failed: 27 are the four G1 legacy suites on a fresh database (quarantine, identical to `435a112`), 6 are COVFCR 5 s timeouts, all green in the idle re-run above |
| Manual environment smoke as the role (`hr-loop:local:seed`, `:serve` on port 3041, HTTP, stop, `:drop`) | 15 regions `AVAILABLE`, binding region `AVAILABLE`, decision record 200, declaration without principal 401, wrong principal 403, inadmissible class 422, `DEFER_DECISION` 201 then 409, demo page with dock 200, plain field without dock; database created, verified and dropped by the script; no state left |
| Leftover databases after all PINK runs | none owned by PINK runs; databases of other sessions' concurrent runs untouched |

Agreement of state and documentation: GELB's section 8 of `HR_DECISION_LOOP_INTEGRATION.md` reports the
same gate behaviour, the same role-based results and the same manual walkthrough; the only differences
are the batch-time load timeouts recorded here with their idle re-runs.

## 8. Delta `6f400ea..1572dcf` validated (2026-10-10)

| Change | Reading | Evidence |
| --- | --- | --- |
| `dc975cb` registration DDL on a dedicated client | `ensureHrDecisionLoopPersistenceRegistration` keeps the gate (positive disposable identity first); the DDL now runs on `createRegistrationClient(verified.url)` (one connection, notices silenced) bound to the verified URL and ended in `finally`; the application singleton is never used for DDL. `hr-loop:local up` re-verifies the state-file database (name pattern plus marker) before reuse and deletes a stale state file; `--fresh` creates a new one | gate test and registration-client test green; manual `seed` then `up`: "reusing verified disposable database", 15 regions AVAILABLE, 0 notices in the server output, `drop` removed it, no leftover |
| `1572dcf` notice filter on the application client | `createNoticeForwarder` suppresses only `42622 truncate_identifier` and `42P07`/`42P06`/`42710` notices ending in "skipping"; everything else is forwarded unchanged; no statement, option or connection target changed | `test/career/db/notice-filter.test.ts` green; `tsc` 0 |
| Observation (not a defect) | the `42622` truncation notice was the only visible runtime symptom of the DB-2 class (constraint names longer than 63 bytes). With it suppressed on the application client, that class is silent at runtime; the static pins on the sealed table names and the DB-2 record are now the only detection | recorded for the owner |

Role-based run on the merged tip (`validation/hr-decision-loop-pink` @ `2b2e8b1`, content identical to
`1572dcf`): `test/career/db`, `test/career/hr-decision-loop` (incl. the Chromium e2e), `test/database-isolation`
(least-privilege proof executed), `test/decision-integration` (P7 forward and inverse): 31 files, 212 / 212;
no leftover database.
