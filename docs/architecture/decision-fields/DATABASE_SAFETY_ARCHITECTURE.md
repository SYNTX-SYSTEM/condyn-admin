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

Execution evidence for this candidate is recorded in section 7 once the merged commit is pushed.
