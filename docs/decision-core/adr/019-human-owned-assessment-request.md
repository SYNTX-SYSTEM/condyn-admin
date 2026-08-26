# ADR 019: Human-owned assessment request contract

## Status

Implemented and sealed.

Implementation: `d315fcee7f3e501284072b85650a8a83c85e3b3b` / `v1.0.0-decision-core-phase6a-assessment-request`.

## Context

Phase 5 reconstructs, persists, and can read one explicit decision-state lineage. That state is not itself the human normative frame used to ask for later assessment. The architecture must preserve the ownership separation:

```text
EVIDENCE-BACKED STATE
!= HUMAN-OWNED NORMATIVE FRAME
!= MODEL ASSESSMENT PROPOSAL
!= MODEL RECOMMENDATION PROPOSAL
!= HUMAN DECISION

GAP != DECISION NEED
STRUCTURAL CONSEQUENCE != DECISION NEED
VALIDATION ASSEMBLY != DECISION NEED
REVISION != DECISION NEED
READABLE LINEAGE != DECISION NEED
HUMAN ASSESSMENT REQUEST != DECISION NEED
```

The human must be able to declare the question and item references intended for a later assessment without a machine-generated Decision Need, revision lookup, role lookup, or a decision operation. The request must remain generic Decision Core state rather than acquire Career, Recruiting, Capability Core, matching, persistence, PostgreSQL, frontend, adapter, evaluator, or legacy-loop dependency.

## Decision

Phase 6A adds the adjacent generic `lib/decision-core/assessment-request/` contract with one stored artifact:

```ts
{
  artifactKind: "DECISION_ASSESSMENT_REQUEST",
  schemaVersion: "DECISION_ASSESSMENT_REQUEST_V1",
  assessmentRequestId: string,
  revisionId: string,
  requestedBy: { origin: "HUMAN_INPUT", actorId: string },
  decisionQuestionItemId: string,
  selectedOptionItemIds: readonly string[],
  selectedObjectiveItemIds: readonly string[],
  selectedConstraintItemIds: readonly string[]
}
```

No extra stored fields are accepted. The public runtime surface is exactly:

```text
DECISION_ASSESSMENT_REQUEST_SCHEMA_VERSION
createDecisionAssessmentRequest
assertDecisionAssessmentRequest
```

The public types are `DecisionAssessmentRequestActor`, `DecisionAssessmentRequestInput`, and `DecisionAssessmentRequest`. There is no public identity builder.

`assessmentRequestId` is `DAREQ_` plus the first 24 uppercase SHA-256 hex characters of `JSON.stringify(...)` over exactly:

```ts
[
  "DECISION_ASSESSMENT_REQUEST_V1",
  revisionId,
  ["HUMAN_INPUT", trimmedActorId],
  decisionQuestionItemId,
  canonicalSelectedOptionItemIds,
  canonicalSelectedObjectiveItemIds,
  canonicalSelectedConstraintItemIds
]
```

There is no timestamp, randomness, UUID, provider/model metadata, or execution-order input. `DAREQ IDENTITY != DECISION AUTHORITY`, `DAREQ IDENTITY != REVISION AUTHORITY`, and `DAREQ IDENTITY != HUMAN DECISION`.

The `requestedBy` axis declares human normative ownership only. `actorId` must be nonempty after trimming and is stored trimmed. It does not authenticate or authorize an actor, verify a signature, prove evidence truth, or record a human decision:

```text
HUMAN_INPUT != AUTHENTICATED HUMAN IDENTITY
HUMAN_INPUT != AUTHORIZATION
HUMAN_INPUT != SIGNATURE
HUMAN_INPUT != EVIDENCE TRUTH
HUMAN_INPUT != HUMAN DECISION
```

`revisionId` is validated only as `^DREV_[0-9A-F]{24}$`. The operation performs no repository read, revision assertion, persistence check, lineage reconstruction, current/head/latest/active selection, or producer-authority resolution. A DREV-shaped reference is not proof of revision existence or persisted authority.

All declared item references are validated only as `^DCI_[0-9A-F]{24}$`. The operation does not prove item existence, membership in the named revision, or role. It therefore does not prove that the declared question is an actual `DECISION_QUESTION`, nor that category selections are actual `OPTION`, `OBJECTIVE`, or `CONSTRAINT` items.

Selections mean only that the human declared each item reference as part of this request. They are not claims of objective importance, objective or constraint truth, constraint enforceability, option viability, completeness, global relevance, or decision readiness. All three arrays may be empty.

Construction trims the actor, code-point-sorts each selection inventory, and detaches returned requester and selection state. It never silently deduplicates. Duplicates within a category, overlap across categories, and question reuse in any selection are invalid request-level declared-category consistency; that is not actual context-role validation.

Stored assertion does not repair artifacts:

```text
CREATE MAY CANONICALIZE
ASSERT MUST NOT REPAIR
```

It rejects malformed, accessor-backed, symbol-keyed, non-enumerable, extra/missing, untrimmed, malformed-ID, noncanonical-order, duplicate, overlap, and question-reuse representation. An otherwise exact canonical body with the wrong ID fails `ERR_DECISION_ASSESSMENT_REQUEST_ID_MISMATCH`.

The complete error surface is:

```text
ERR_DECISION_ASSESSMENT_REQUEST_INPUT_INVALID
ERR_DECISION_ASSESSMENT_REQUEST_REVISION_ID_INVALID
ERR_DECISION_ASSESSMENT_REQUEST_ACTOR_INVALID
ERR_DECISION_ASSESSMENT_REQUEST_ITEM_ID_INVALID
ERR_DECISION_ASSESSMENT_REQUEST_DUPLICATE_SELECTION
ERR_DECISION_ASSESSMENT_REQUEST_INVALID
ERR_DECISION_ASSESSMENT_REQUEST_ID_MISMATCH
```

There are no item-not-found, role-mismatch, revision-not-found, repository, assessment, recommendation, or Decision Need errors.

## Consequences

Phase 6A creates a standalone declaration that can later be bound by later work, but it does not invoke Phase 5D3 or infer current state from lineage. `READABLE LINEAGE != ASSESSMENT REQUEST`, and `ASSESSMENT REQUEST != CURRENT REVISION`.

Phase 6A does not implement Decision Need; assessment basis, assessment result, semantic assessment, model evaluator, recommendation, priority, weight, score, ranking, confidence, probability, severity, winner, human decision, action, outcome, feedback, learning, current/head/latest, revision resolution, repository persistence, or new persistence authority. The bidirectional human-machine loop remains open.

## Evidence

- Focused Phase 6A: 13 / 13 passing.
- Decision Core: 211 / 211 passing.
- Capability Core: 272 / 272 passing.
- Scoped TypeScript: PASS.
- `git diff --check`: PASS.
- Sealed Phase-5 predecessor diffs: EMPTY.

Repository-wide TypeScript is not claimed clean; unrelated Career/UI/test issues remain outside this scope.
