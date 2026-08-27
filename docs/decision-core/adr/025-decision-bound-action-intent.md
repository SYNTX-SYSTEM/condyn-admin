# ADR 025: Decision-Bound Action Intent

## Status

Implementation sealed.

Implementation: `8ebf90683ce0ac5ce8ce9c3f1d03b976145aedaa`

Tag: `v1.0.0-decision-core-phase8a1-action-intent`

## Context

Phase 7A records an explicit human normative selection of one or more actual revision options. That declaration has no operation description, commitment actor, action actor, target, schedule, execution state, external effect, outcome, or feedback state. A chosen option is not itself an executable action.

The next generic state must preserve both human autonomy and post-decision governance:

```text
MODEL PROPOSAL SPACE != HUMAN DECISION SPACE
ACTION INTENT SCOPE ⊆ HUMAN DECISION CHOICE SET
```

Before the human declaration, the model-proposal path cannot define the human decision space. After the declaration, an operationalization cannot expand beyond the options the human chose. This does not make recommendation or assessment a gate for intended operation.

## Decision

Add `action-intent` as an adjacent generic Decision Core module. It consumes:

```text
SEALED HumanDecisionDeclaration
+ DECLARED HUMAN_INPUT intent declarer
+ NONEMPTY EXPLICIT SUBSET OF HUMAN-CHOSEN OPTION IDS
+ EXPLICIT OPERATION DESCRIPTION
+ OPTIONAL HUMAN RATIONALE
-> DecisionActionIntent
-> STOP
```

The exact artifact is:

```ts
interface DecisionActionIntent {
  artifactKind: "DECISION_ACTION_INTENT";
  schemaVersion: "DECISION_ACTION_INTENT_V1";
  actionIntentId: string;
  humanDecisionDeclaration: HumanDecisionDeclaration;
  declaredBy: ActionIntentActor;
  operationalizedOptionItemIds: readonly string[];
  operationDescription: string;
  rationale: string | null;
}
```

`ActionIntentActor` is `{ origin: "HUMAN_INPUT", actorId }`. It is declared human input, not authenticated identity, authorization, signature, permission, or truth. `ACTION INTENT DECLARER != DECISION ACTOR != FUTURE COMMITMENT ACTOR != FUTURE ACTION ACTOR`.

Every operationalized ID must be DCI-shaped, unique, and present in `humanDecisionDeclaration.chosenOptionItemIds`; construction canonicalizes order. An actual revision option that is absent from that human choice set is invalid. The contract sealed-asserts the complete HumanDecisionDeclaration and does not independently inspect lower-phase assessment, recommendation, trace, revision, authority, lineage, or persistence state.

`operationDescription` is trimmed, nonempty opaque human/domain text. It is not parsed into an action type, target, assignee, executor, command, workflow, schedule, or expected effect. Rationale is `null` or trimmed nonempty text.

`DAINT_` is SHA-256, first 24 uppercase hexadecimal characters, over:

```ts
[
  "DECISION_ACTION_INTENT_V1",
  canonicalCompleteHumanDecisionDeclaration,
  ["HUMAN_INPUT", trimmedDeclaredByActorId],
  canonicalOperationalizedOptionItemIds,
  canonicalOperationDescription,
  canonicalRationale
]
```

The complete predecessor participates; identity is not human decision ID plus local fields. Object insertion order is non-semantic through recursive canonicalization, while sealed predecessor arrays retain their represented semantics. Local option input order is canonical.

`assertDecisionActionIntent(...)` is self-contained and may call only `assertHumanDecisionDeclaration(...)`. It requires the exact eight-field artifact, canonical actor/text/option state, and complete-state identity. `CREATE MAY CANONICALIZE; ASSERT MUST NOT REPAIR.` It rejects hostile nested predecessor representation without getter execution.

The runtime surface is exactly `DECISION_ACTION_INTENT_SCHEMA_VERSION`, `createDecisionActionIntent`, and `assertDecisionActionIntent`; the public types are exactly `ActionIntentActor`, `DecisionActionIntentInput`, and `DecisionActionIntent`.

## Consequences

Phase 8A1 introduces intended operation state, not commitment or occurrence:

```text
HUMAN DECISION != ACTION INTENT
ACTION INTENT != HUMAN COMMITMENT
ACTION INTENT != ACTION != EXECUTION != OUTCOME
OPTION != ACTION
CHOSEN OPTION != ACTION INTENT
RATIONALE != ACTION INTENT
INTENDED ACTION != OBSERVED ACTION
```

One decision can have zero, one, or multiple independently declared intents. No global repository constraint or overlapping-subset prohibition exists. `DECISION EXISTENCE != ACTION INTENT EXISTENCE`.

The artifact establishes no commitment, action, execution proof, observed action, completion, outcome, feedback, learning, authorization, authenticated identity, persistence authority, current producer authority, truth, or recommendation correctness. There are no timestamps, UUIDs, randomness, action targets, assignees, schedules, status fields, or universal action language.

The generic contract is constructed independently from first principles. It does not reuse `lib/career/decisions/action.ts`, `CommitmentRecord`, `ActionEvent`, stringly action targets/types, time/random identity, or action caches. Legacy Career artifacts remain domain-specific and are not authority for this ontology.

The exact error surface is:

- `ERR_DECISION_ACTION_INTENT_INPUT_INVALID`
- `ERR_DECISION_ACTION_INTENT_HUMAN_DECISION_INVALID`
- `ERR_DECISION_ACTION_INTENT_ACTOR_INVALID`
- `ERR_DECISION_ACTION_INTENT_OPTION_ID_INVALID`
- `ERR_DECISION_ACTION_INTENT_OPTION_NOT_CHOSEN`
- `ERR_DECISION_ACTION_INTENT_DUPLICATE_OPTION`
- `ERR_DECISION_ACTION_INTENT_OPERATION_INVALID`
- `ERR_DECISION_ACTION_INTENT_RATIONALE_INVALID`
- `ERR_DECISION_ACTION_INTENT_INVALID`
- `ERR_DECISION_ACTION_INTENT_ID_MISMATCH`

## Evidence

- Focused Phase 8A1: 1 file / 9 tests passing.
- Decision Core: 20 files / 272 tests passing.
- Capability Core: 28 files / 272 tests passing.
- Scoped TypeScript: PASS.
- `git diff --check`: PASS.
- Phase 7A predecessor diffs: EMPTY.
- Phase 6 predecessor diffs: EMPTY.
- Lower-phase admission bypass audit: EMPTY.
- Forbidden Phase 8A1 production semantic audit: EMPTY.
- Import gate: only `node:crypto`, `../human-decision`, and local files.
- Descriptor hardening covers accessor, symbol, hidden, sparse, custom-array, cyclic, and nested hostile predecessor representations; nested getters are not executed.
- Complete predecessor identity source gate: proven.
