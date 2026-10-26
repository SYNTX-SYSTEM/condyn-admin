# Automatic PERSON role discovery

## Scope

An unscoped `/career/demo` entry now opens directly in `PERSON` mode with the
Capability Field active. `PERSON_X_JOB` remains the default only when a job
scope is already present or the URL explicitly requests it. This removes the
manual pool/job prerequisite from the automatic discovery path while
preserving explicit job-scoped investigations.

The existing Job Pool list is the sole source of candidate pools. When the
Career Intelligence Field is in `PERSON` mode and a persisted analysis is on
view, all `ACTIVE` uploads are selected deterministically (lexicographic upload
id order, bounded by the existing ten-pool contract). An explicitly released
`discoveryPoolUploadId` URL set remains authoritative.

The existing read-only role-discovery route is then called for those uploads.
Its output is rendered as the Capability Map, including role status,
requirement relation state, and source quotes. No second pool registry,
selection record, or write path is introduced.

The same active uploads are read through the existing deterministic
`/matches` presentation endpoint. Its ranked resonance candidates are shown
separately as automatic job candidates. When Gemini is configured, the
existing immutable relation cache also evaluates pending proposal/requirement
pairs and the map shows a separate semantic, proposal-only ranking.

## Authority and limits

Lexical discovery remains `POOL_ROLE_DISCOVERY_V1`; semantic evaluation is a
separate cache-backed layer. Both layers retain `authorityState=NONE` and
`decision=false`: the map never presents a relation as a hiring decision.
Every displayed quote retains its source document id.

## TDD and verification

- RED/GREEN: the existing discovery-read contract now covers deterministic
  active-pool derivation and strict route decoding.
- Integration: the field invokes the existing Job Pool list and role-discovery
  GET path and renders only the decoded result state.
- TypeScript: `tsc --noEmit` passes.
- Pure role-discovery regression: 38 tests pass (pool discovery, strict client
  decoding, cache validation, deterministic semantic ranking and PERSON
  discovery matching) without a database.
- Runtime boundary: a current PostgreSQL/Gemini end-to-end run still requires
  the repository's disposable local runner and its external runtime services;
  no live success is claimed from these static/pure checks. In this Codex
  namespace the runner fails before database setup with `listen EPERM` from
  the `tsx` IPC pipe; the host test database and Gemini key were not modified
  or exposed.

