# ADR 018: Read-only revision lineage reconstruction follows one explicit predecessor path

## Status

Implemented.

Implementation: `8a886f8bf39c4bd8fb84dc2e863fd02014d1916e` / `v1.0.0-decision-core-phase5d3-lineage-reconstruction`.

## Context

Phase 5D1 created self-contained canonical `DecisionContextRevision` artifacts. Phase 5D2A created repository-bound immutable persistence authority semantics, and Phase 5D2B supplied a durable PostgreSQL adapter for those sealed semantics. None supplied generic read-only reconstruction of the complete reader-relative explicit predecessor chain from one requested revision.

That missing capability must not become head selection, branch discovery, a new persisted artifact, or a truth claim. In particular:

```text
LINEAGE RECONSTRUCTION != HEAD SELECTION
LINEAGE RECONSTRUCTION != BRANCH SELECTION
LINEAGE RECONSTRUCTION != DESCENDANT DISCOVERY
PREVIOUS REVISION ID  != CAUSATION
PREVIOUS REVISION ID  != SEMANTIC CONTINUITY
PREVIOUS REVISION ID  != WALL-CLOCK TIME
READABLE LINEAGE      != TRUE HISTORY
READABLE LINEAGE      != CURRENT PRODUCER AUTHORITY
READABLE LINEAGE      != DECISION NEED
READABLE LINEAGE      != RECOMMENDATION
ROOT                  != GLOBALLY FIRST STATE
ROOT                  != UNIQUE ROOT
ROOT                  != OLDEST REVISION
ROOT                  != CURRENT STATE
MISSING PREDECESSOR   != ROOT
PARTIAL CHAIN         != VALID LINEAGE
```

## Decision

Phase 5D3 adds the adjacent generic `lib/decision-core/revision-lineage/` module. Its plain detached read model is:

```ts
interface DecisionContextRevisionLineage {
  startRevisionId: string;
  rootRevisionId: string;
  revisions: readonly DecisionContextRevision[];
}
```

The public bound capability is `createBoundDecisionContextRevisionLineageReconstructor(...).reconstruct(startRevisionId)`. Composition captures only an exact own function-valued data-property `getRevisionById` method. It binds no writer, persister, database, PostgreSQL client, producer resolver, authority validator, binder, or evaluator. Extra own capabilities and accessor-backed reader dependencies reject rather than being invoked.

Phase 5D1 remains the sealed source of `DecisionContextRevision` and deterministic `DREV_`: its identity commits to `previousRevisionId`, `context.contextId`, and `validationAssembly.assemblyId`. Phase 5D3 does not alter that identity or concatenate arbitrary IDs; each consumed node independently passes sealed revision assertion before its explicit predecessor is followed.

Reconstruction validates a DREV-shaped start ID before reading. For every requested ID it captures the returned representation, invokes sealed `assertDecisionContextRevision(...)`, requires exact returned/requested revision-ID equality, then follows only explicit `previousRevisionId`. It succeeds only when the chain reaches a sealed-valid revision with `previousRevisionId: null`, returning detached revisions in `ROOT -> ... -> START` predecessor order. `rootRevisionId` means only the sealed-valid revision where this supplied start's explicit predecessor path terminates because `previousRevisionId === null`; it is not a globally first, unique, oldest, earliest, current, active, or preferred revision.

The operation is complete-or-error. Complete means all explicit `previousRevisionId` links from the supplied start have been returned through the bound reader until a sealed-valid explicit-null predecessor is reached; it does not mean complete global history, all branches, all descendants, unique repository history, or global completeness. A missing initial record is `ERR_DECISION_CONTEXT_REVISION_LINEAGE_START_NOT_FOUND`; a missing named predecessor is `ERR_DECISION_CONTEXT_REVISION_LINEAGE_PREDECESSOR_NOT_FOUND`. A malformed, noncanonical, malformed-predecessor, or wrong-ID returned revision is `ERR_DECISION_CONTEXT_REVISION_LINEAGE_REVISION_INVALID`. Reader and adapter errors propagate unchanged. No stored revision is reconstructed or repaired during lineage read.

The reconstructor retains an operation-local visited requested-ID set. Each ID is checked and added before its reader call; a repeated ID fails `ERR_DECISION_CONTEXT_REVISION_LINEAGE_CYCLE`. This is defensive repeated-request-ID protection for a generic reader boundary, not graph analysis, causal-cycle detection, or semantic-cycle detection. A normal closed cycle of independently sealed-valid revisions is not a straightforward fixture because DREV identity includes `previousRevisionId`; tests therefore prove guard placement rather than bypassing sealed revision validation to manufacture a false runtime cycle.

## Consequences

Decision Core can reconstruct one explicit sealed-valid predecessor path supplied through the bound reader from a caller-supplied revision ID without choosing which revision matters. Starting from a middle revision returns only its root-to-start path; siblings and descendants are neither read nor observable. Forks and no-change children remain valid. When bound to a shipped repository read capability, the returned revisions may be repository records under that repository's own contract; 5D3 itself does not confer persistence authority or durable persistence.

The result has no `DLINE_`, `artifactKind`, schema version, lineage ID, timestamp, depth, revision number, head/latest/current/active/superseded state, branch metadata, authority field, semantic-change field, causation field, Decision Need, recommendation, human decision, action, outcome, feedback, or learning state. It is not a persistence authority record, authority certificate, current-state artifact, branch artifact, or truth artifact.

The generic module depends only on generic Decision Core revision and read contracts. It imports no Career, Recruiting, Capability Core, matching, recommendation, legacy decision-loop, PostgreSQL, Drizzle, decision-adapter, or frontend code. The PostgreSQL adapter remains unchanged; the same reconstructor can operate through the existing generic read capability of either in-memory or PostgreSQL repositories.

## Evidence

- `lib/decision-core/revision-lineage/types.ts`
- `lib/decision-core/revision-lineage/reconstruct.ts`
- `lib/decision-core/revision-lineage/index.ts`
- `lib/decision-core/index.ts`
- `test/decision-core/revision-lineage/reconstruct.test.ts`
- Focused Phase 5D3: 10/10.
- Decision Core: 198/198.
- Capability Core: 272/272.
- Scoped TypeScript validation and `git diff --check`: pass.
