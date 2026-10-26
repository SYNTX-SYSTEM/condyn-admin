# Automatic PERSON role discovery

## Scope

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
separately as automatic job candidates; this is a presentation, not a
semantic evaluation or an HR decision.

## Authority and limits

`POOL_ROLE_DISCOVERY_V1` remains lexical candidate discovery only:
`semanticRelationState=NOT_EXECUTED`, `scored=false`, `ranking=false`, and
`decision=false`. The map therefore never presents a lexical name relation as
a verified semantic fit or hiring decision. Every displayed quote retains its
source document id.

## TDD and verification

- RED/GREEN: the existing discovery-read contract now covers deterministic
  active-pool derivation and strict route decoding.
- Integration: the field invokes the existing Job Pool list and role-discovery
  GET path and renders only the decoded result state.
- TypeScript: `tsc --noEmit` passes.
- Pure role-discovery regression: 14 tests pass (9 pool discovery, 5 client
  read/decoder tests) without a database.
- Runtime boundary: a current PostgreSQL/Gemini end-to-end run still requires
  the repository's disposable local runner and its external runtime services;
  no live success is claimed from these static/pure checks. In this Codex
  namespace the runner fails before database setup with `listen EPERM` from
  the `tsx` IPC pipe; the host test database and Gemini key were not modified
  or exposed.

