-- =====================================================================================
-- PREPARED, NOT APPLIED. Requires the owner's separate explicit approval after the
-- impact assessment in docs/architecture/decision-fields/CONDYN_PRIVILEGE_HARDENING_ASSESSMENT.md.
-- Modifies only the privilege configuration (datacl) of the shared database condyn.
-- No table, row, schema, constraint or index is touched.
-- Run as the database owner/superuser:  psql -v ON_ERROR_STOP=1 -h localhost -U postgres -d postgres -f <this file>
-- =====================================================================================
\set ON_ERROR_STOP on

-- Pre-checks (abort if the assessed state has changed).
DO $$
BEGIN
  IF (SELECT datacl FROM pg_database WHERE datname = 'condyn') IS NOT NULL THEN
    RAISE EXCEPTION 'condyn datacl is no longer the default (NULL); re-run the impact assessment';
  END IF;
  IF (SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = 'condyn') <> 'postgres' THEN
    RAISE EXCEPTION 'condyn owner changed; re-run the impact assessment';
  END IF;
END $$;

BEGIN;
-- Remove the implicit PUBLIC defaults on the shared database.
REVOKE CONNECT, TEMPORARY ON DATABASE condyn FROM PUBLIC;
-- Keep the owner explicitly able to connect (superusers bypass privileges anyway).
GRANT CONNECT, TEMPORARY ON DATABASE condyn TO postgres;
-- Post-checks inside the transaction.
DO $$
BEGIN
  IF has_database_privilege('condyn_test_runner', 'condyn', 'CONNECT') THEN
    RAISE EXCEPTION 'post-check failed: condyn_test_runner can still connect to condyn';
  END IF;
  IF NOT has_database_privilege('postgres', 'condyn', 'CONNECT') THEN
    RAISE EXCEPTION 'post-check failed: postgres lost CONNECT on condyn';
  END IF;
END $$;
COMMIT;

-- Rollback (restores the exact previous state: datacl back to NULL = built-in default):
--   BEGIN; GRANT CONNECT, TEMPORARY ON DATABASE condyn TO PUBLIC; REVOKE CONNECT, TEMPORARY ON DATABASE condyn FROM postgres; COMMIT;
--   then verify: SELECT datacl FROM pg_database WHERE datname = 'condyn';
--   (the ACL then reads {=Tc/postgres,postgres=CTc/postgres}; functionally identical to NULL for every role)
