# ADR 026: Human Commitment

## Status

Implementation sealed.

Implementation: `452473b1e0b2fbc7bab5841c33e30ecac04aca89`

Tag: `v1.0.0-decision-core-phase8a2-human-commitment`

## Context

Phase 8A1 records one intended operation against a nonempty subset of a sealed human decision's chosen options. It does not record that any human has declared commitment to that intended operation. Action Intent, however, already owns the human decision, operationalized option scope, opaque operation description, intent declarer, and intent rationale.

The next state must add only the missing declared commitment relation. It must not turn commitment into responsibility, ownership, accountability, assignment, authorization, execution, completion, outcome, feedback, learning, or persistence authority.

## Decision

Add `human-commitment` as an adjacent generic Decision Core module. It consumes:

```text
SEALED DecisionActionIntent
+ DECLARED HUMAN_INPUT commitment actor
+ OPTIONAL HUMAN rationale
-> HumanCommitment
-> STOP
```

The new represented relation is: a declared human actor commits to one complete represented Action Intent.

## Predecessor boundary and scope

`HumanCommitment` sealed-asserts the complete `DecisionActionIntent`; it does not consume only `actionIntentId` and does not independently inspect the Human Decision Declaration, chosen or operationalized option IDs, revision, context, assessment, recommendation, coherence, producer authority, persistence, or lineage.

Action Intent owns operationalization scope. Human Commitment has no option-ID or operation-description duplicate and no partial-commitment field. `COMMITMENT != REINTERPRETATION OF ACTION INTENT SCOPE`: it neither expands nor shrinks scope. A narrower commitment requires a narrower Action Intent first.

## Actor semantics and multiple commitments

`committedBy` is `{ origin: "HUMAN_INPUT", actorId }`, with a trimmed nonempty actor ID. This is declared human input only: it is not authenticated identity, authorization, signature, permission, organizational role, legal accountability, assignment, or executor identity. The commitment actor may differ from the decision actor and Action Intent declarer. These are independent semantic role positions; no actor-ID equality or inequality is required or inferred.

One commitment artifact contains one actor. Joint commitment, quorum, voting, co-signature, delegation, and aggregation are not introduced. One Action Intent may have zero, one, or multiple independent commitments; no repository-global uniqueness, lookup, or aggregation exists. `ONE ACTION INTENT != ONE HUMAN COMMITMENT` and `ACTION INTENT EXISTENCE != COMMITMENT EXISTENCE`.

## Declared commitment boundary

The artifact records declared commitment only:

```text
DECLARED COMMITMENT != LEGAL RESPONSIBILITY
DECLARED COMMITMENT != ORGANIZATIONAL ACCOUNTABILITY
DECLARED COMMITMENT != OWNERSHIP
COMMITMENT != AUTHORIZATION != PERMISSION != EXECUTION AUTHORITY
COMMITMENT ACTOR ROLE != ASSIGNEE ROLE != EXECUTOR ROLE
ROLE NON-EQUIVALENCE != MANDATORY ACTOR-ID INEQUALITY
HUMAN COMMITMENT != ACTION
COMMITTED != EXECUTED != DONE != COMPLETED != ACTION OCCURRED != OUTCOME ACHIEVED
```

Future Action observation remains separate and may need to represent emergency, external-system, spontaneous-human, or imported historical action without prior ConDyn commitment. Commitment is not a universal Action-observation prerequisite.

## Rationale and temporal exclusions

Rationale is `null` or trimmed nonempty human text. It records only the declared actor's represented reason for committing: `COMMITMENT RATIONALE != AUTHORIZATION != EXECUTION PROOF != LEGAL SIGNATURE != ACTION PLAN != OUTCOME EXPECTATION != TRUTH`.

No timestamp, `createdAt`, `committedAt`, due date, schedule, `Date.now()`, `Math.random()`, or UUID exists. Commitment is deterministic represented state: `WALL-CLOCK TIME != AUTHORITY`, `TIMESTAMP != COMMITMENT`, and `DUE DATE != COMMITMENT`.

## Artifact contract and canonicalization

Schema: `HUMAN_COMMITMENT_V1`.

```ts
interface HumanCommitmentActor {
  origin: "HUMAN_INPUT";
  actorId: string;
}

interface HumanCommitmentInput {
  committedBy: HumanCommitmentActor;
  rationale: string | null;
}

interface HumanCommitment {
  artifactKind: "HUMAN_COMMITMENT";
  schemaVersion: "HUMAN_COMMITMENT_V1";
  humanCommitmentId: string;
  actionIntent: DecisionActionIntent;
  committedBy: HumanCommitmentActor;
  rationale: string | null;
}
```

The input has exactly two fields and the artifact exactly six. Construction trims actor/rationale state where valid; stored assertion requires already-canonical representation. Returned state is detached, not asserted deep-frozen.

## Complete-state identity

`DHCOM_` is the first 24 uppercase hexadecimal characters of SHA-256 over:

```ts
[
  "HUMAN_COMMITMENT_V1",
  canonicalCompleteDecisionActionIntent,
  ["HUMAN_INPUT", trimmedCommittedByActorId],
  canonicalRationale
]
```

The complete Action Intent participates, not only `actionIntentId`. Recursive canonicalization makes predecessor object insertion order non-semantic; sealed predecessor arrays retain their represented semantics. Predecessor state, actor, and rationale change `DHCOM_`; the same normalized complete state is deterministic.

`DHCOM IDENTITY != AUTHENTICATED IDENTITY != AUTHORIZATION != ASSIGNMENT != EXECUTION != ACTION OCCURRENCE != COMPLETION != OUTCOME != TRUTH != PERSISTENCE AUTHORITY`.

## Stored assertion and hostile representation safety

`assertHumanCommitment(...)` is self-contained and may call only `assertDecisionActionIntent(...)`. It requires exact six-field state, valid headers and `DHCOM_` shape, sealed complete Action Intent, exact canonical actor/rationale state, and recomputed complete-state identity. `CREATE MAY CANONICALIZE; ASSERT MUST NOT REPAIR.`

Descriptor-based capture rejects accessors, symbols, hidden fields, cycles, nested hostile predecessor accessors, nested sparse arrays, and nested custom array state without executing getters.

## Persistence and authority boundary

`HUMAN COMMITMENT ARTIFACT != PERSISTENCE AUTHORITY`; Phase 8A2 adds no repository, persistence adapter, or authority-of-record operation. A future persisted commitment would remain distinct from semantic truth: `PERSISTED COMMITMENT != TRUE COMMITMENT`.

## Legacy non-reuse and non-goals

The generic Human Commitment contract is constructed independently from first principles. Legacy Career commitment and action artifacts remain domain-specific and are not authority for the Phase 8A2 ontology. The module does not reuse or generalize `lib/career/decisions/action.ts`, `CommitmentRecord`, `decisionId`, `actionType`, `targetRef`, time/random identity, `deepFreeze`, or action caches.

Explicit non-goals are responsibility, ownership, accountability, assignment, authorization, action, execution, completion, outcome, feedback, learning, persistence authority, temporal workflow, and Action observation.

## Errors and public surface

The exact owned errors are:

- `ERR_DECISION_HUMAN_COMMITMENT_INPUT_INVALID`
- `ERR_DECISION_HUMAN_COMMITMENT_ACTION_INTENT_INVALID`
- `ERR_DECISION_HUMAN_COMMITMENT_ACTOR_INVALID`
- `ERR_DECISION_HUMAN_COMMITMENT_RATIONALE_INVALID`
- `ERR_DECISION_HUMAN_COMMITMENT_INVALID`
- `ERR_DECISION_HUMAN_COMMITMENT_ID_MISMATCH`

The runtime surface is exactly `HUMAN_COMMITMENT_SCHEMA_VERSION`, `createHumanCommitment`, and `assertHumanCommitment`. Public types are exactly `HumanCommitmentActor`, `HumanCommitmentInput`, and `HumanCommitment`.

## Consequences

The implemented chain is:

```text
Human-Owned Assessment Request
-> Revision-Bound Assessment Basis
-> Semantic Assessment Proposal
-> Recommendation Proposal
-> Proposal Coherence Validation
-> Human Decision Declaration
-> Decision-Bound Action Intent
-> Human Commitment
-> STOP
```

Phase 8B, Action / Action Observation, remains future work only.

## Evidence

- Focused Phase 8A2: 1 file / 7 tests passing.
- Decision Core: 21 files / 281 tests passing.
- Capability Core: 28 files / 272 tests passing.
- Scoped TypeScript: PASS.
- `git diff --check`: PASS.
- Phase 8A1, Phase 7A, and Phase 6 predecessor diffs: EMPTY.
- Import and forbidden-semantic audits: PASS.
- Hostile representation coverage includes local/stored accessors, nested predecessor accessor, symbol, hidden, cycle, nested sparse array, and nested custom-array state; getters execute zero where applicable.
- Complete predecessor identity has both behavioral and structural hash-payload source proofs.
