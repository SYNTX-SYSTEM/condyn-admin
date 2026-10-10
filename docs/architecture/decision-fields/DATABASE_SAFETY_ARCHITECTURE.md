# Database Safety Architecture: HR Decision Looper test isolation

Status: IMPLEMENTED AND PROVEN 2026-10-10 for layers 1 to 3 (GELB, `integration/hr-decision-loop`
@ `ed0ad2f`); layer 4 TOOLED, PROVEN TRANSIENTLY, AWAITING OWNER PROVISIONING (PINK,
`validation/hr-decision-loop-pink`). Companion records: `DATABASE_SAFETY_AUDIT.md` (access paths,
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
- Layer 4, transient proof on 2026-10-10 (PINK): the role was created on the shared cluster, examined
  read-only and dropped again the same hour, because creating a cluster principal exceeds the
  autonomous mandate (GELB raised it; the cluster is back to its previous principal set:
  `authenticator`, `hr_timesheet_user`, `postgres`, `web_anon`). While it existed:
  `has_database_privilege(role,'condyn','CONNECT') = true`, `CREATE` on the database `false`,
  `has_schema_privilege(role,'public','CREATE') = false`, no privilege on any of the 76 tables, owner of
  `condyn` is `postgres`; the runner created, marked, used and dropped `condyn_test_aeedb48cd7a3e3e9` as
  that role for `test/database-isolation` plus P7 (61 / 61, no leftover). Under a superuser admin the
  least-privilege test reports `UNVERIFIED` (skipped with reason), never a pass.

## 3. Residual limits and what closes them

| Limit | Layer that closes it | State |
| --- | --- | --- |
| In-process tampering with runtime-assembled environment names (probe D) | 4 | awaiting owner provisioning |
| `vitest --config` override that drops the gate for the 22 pinned sealed fallback readers | 4 | awaiting owner provisioning |
| New objects in `condyn.public` by a non-owner role (PostgreSQL 14 default `CREATE` for `PUBLIC`; observed `false` for the transient role, to be re-checked after provisioning) | owner: `REVOKE CREATE ON SCHEMA public FROM PUBLIC` inside `condyn` | owner checklist |
| Direct `psql`, `pg_dump`, scripts and agents outside the runner | procedural rule plus layer 4 | procedural |
| Attribution of a future incident (`log_statement=none`, `log_connections=off`) | owner: `log_connections=on`, `log_statement=ddl` | owner checklist |

## 4. Owner checklist (in order)

1. Provision the role once: `TEST_DATABASE_PROVISIONER_URL=postgresql://postgres:<pw>@localhost:5432/postgres TEST_DATABASE_ROLE_PASSWORD=<24+ chars> npx tsx scripts/test-db/provision-role.ts` (idempotent; prints the `TEST_DATABASE_ADMIN_URL` to use). Keep the password outside the repository.
2. Switch every runner invocation to that `TEST_DATABASE_ADMIN_URL`; `test/database-isolation/least-privilege-role.test.ts` then proves layer 4 on every run.
3. Then make the superuser admin refusal the default in `scripts/test-db/admin-url.ts` (`TEST_DATABASE_ALLOW_SUPERUSER=1` to override), agreed with GELB as a few-line change once step 1 is done.
4. Inside `condyn`: `REVOKE CREATE ON SCHEMA public FROM PUBLIC`.
5. Server: `log_connections=on`, `log_statement=ddl`.

## 5. How to run tests now

```
TEST_DATABASE_ADMIN_URL=postgresql://<admin>:<pw>@localhost:5432/postgres npm run -s test:isolated -- <vitest args>
```

Creates a marked `condyn_test_<16 hex>` database, runs vitest against it, drops it. A plain `npx vitest run`
without a verified `DATABASE_URL` aborts before any test. Never pass a URL naming `condyn`.
