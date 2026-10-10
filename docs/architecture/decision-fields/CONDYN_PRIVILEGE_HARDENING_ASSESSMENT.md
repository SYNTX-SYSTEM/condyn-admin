# Impact assessment: privilege hardening of the shared `condyn` database

Status: ASSESSED, PREPARED, NOT APPLIED. Applying anything in `condyn` requires the owner's
separate explicit approval (owner decision of 2026-10-10).
All evidence below was read with `default_transaction_read_only=on` on 2026-10-10.

## 1. Current state

| Object | State |
| --- | --- |
| `condyn` owner | `postgres` (superuser) |
| `condyn` `datacl` | `NULL` = built-in default: owner all, PUBLIC `CONNECT` and `TEMPORARY`, no PUBLIC `CREATE` |
| Schemas | `public`, `t12a_0599156eb04ed694`, `t12a_d272561dfb63f6f5`, all owned by `postgres`, all `nspacl NULL` = owner only; PUBLIC has neither `USAGE` nor `CREATE` |
| Relations | 202 (76 tables in `public`, 63 in each `t12a_*` schema, plus indexes), all owned by `postgres` |
| Functions, types owned by other roles | 0, 0 |
| Default privileges (`pg_default_acl`) | none |
| Cluster roles | `postgres` (superuser), `authenticator`, `hr_timesheet_user`, `web_anon` (other applications), `condyn_test_runner` (least-privilege test role, provisioned 2026-10-10 under the owner's authorization) |
| Roles seen on `condyn` in the server log (2026-07-31 .. 2026-10-10) | `postgres` (6780 lines), `codi` (2 failed logins); no other role. Caveat: `log_connections=off`, so only errors are logged |

Effective privileges per role on `condyn`:

| Role | CONNECT | TEMP | CREATE (db) | USAGE / CREATE on any schema | Any privilege on any of the 202 relations |
| --- | --- | --- | --- | --- | --- |
| `postgres` | yes | yes | yes | yes / yes | owner |
| `condyn_test_runner` | yes (PUBLIC) | yes (PUBLIC) | no | no / no | 0 |
| `authenticator`, `hr_timesheet_user`, `web_anon` | yes (PUBLIC) | yes (PUBLIC) | no | no / no | 0 |

## 2. Finding: the requested schema-creation restriction is already in effect

PostgreSQL 14 normally gives PUBLIC `CREATE` on `public`. In `condyn` the `public` schema carries
`nspacl NULL`, which for schemas means owner-only, and `has_schema_privilege` confirms that no role
except `postgres` may create in or even use it. `REVOKE CREATE ON SCHEMA public FROM PUBLIC` would
therefore be a no-op and is not prepared.

Consequence for the incident class: a test process authenticated as `condyn_test_runner` that bypasses
every code-level guard (F-1 runtime tampering, F-2 alternate `--config`) can connect to `condyn` but
cannot read, insert, update, delete, truncate, alter, drop or create any persistent object there. It
can only create session-local temporary objects that vanish at disconnect.

## 3. Remaining option H1: remove the PUBLIC defaults on the database

Prepared in `scripts/db-hardening/condyn-public-connect-hardening.PREPARED.sql` (pre-checks, one
transaction, post-checks, documented rollback).

| Aspect | Assessment |
| --- | --- |
| Change | `REVOKE CONNECT, TEMPORARY ON DATABASE condyn FROM PUBLIC; GRANT CONNECT, TEMPORARY ON DATABASE condyn TO postgres;` |
| Data, schema, constraints, indexes | untouched |
| Application (`postgres` role) | unaffected (superuser and explicit grant) |
| `condyn_test_runner` | can no longer connect to `condyn` at all (closes temporary-object creation and catalog reading) |
| `authenticator`, `hr_timesheet_user`, `web_anon` | lose `CONNECT`/`TEMP` on `condyn`. They already cannot use any schema or relation there, so no data access is lost; no use of `condyn` by these roles appears in the logs. Residual risk: a client that only connects (for example a health check) would start failing; not observable with `log_connections=off` |
| Reversibility | full, by the documented rollback |
| Verification after applying | the script's post-checks; then a read-only `has_database_privilege` matrix; then the full test suites through the runner as `condyn_test_runner` |

Recommendation: H1 is optional. The decisive protection (no persistent write path for the test role)
already holds without touching `condyn`. If the owner wants the test role unable to connect at all, H1
is low-risk; consider enabling `log_connections` for a few days first to confirm that no other role
connects to `condyn`.

## 4. Not proposed

- Changing table ownership or grants inside `condyn`: not needed; the test role has no path today.
- `REVOKE CREATE ON SCHEMA public FROM PUBLIC`: no-op (section 2).
- Dropping the two `t12a_*` schemas or the DB-2 key: separate cleanup decisions (incident record, options D and E).
