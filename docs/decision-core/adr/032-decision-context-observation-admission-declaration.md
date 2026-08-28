# ADR 032: Decision Context Observation Admission Declaration

## Status

Implementation sealed.

Implementation commit: `764bc86f2b3e024c4a37c371880319058bf4f382`

Implementation tag: `v1.0.0-decision-core-phase8d2-context-observation-admission`

## Context

Phase 8D1 represents one sealed `DecisionContextObservationProposal` as an `OBSERVATION`-role candidate for a future Decision Context. Its existence does not admit that candidate, materialize a `DecisionContextItem`, mutate a Context, create a revision, or close the loop.

The architecture requires a separate, explicit human normative boundary before any future materialization can be considered. That boundary must preserve the complete sealed candidate and must not promote human declaration into authentication, external authorization, semantic support, truth, causation, or Context authority.

## Decision

Phase 8D2 adds only:

```text
SEALED DecisionContextObservationProposal
+ DECLARED HUMAN_INPUT actor
+ OPTIONAL OPAQUE RATIONALE
-> DecisionContextObservationAdmissionDeclaration
-> STOP
```

It represents a declared human actor explicitly declaring the sealed proposal admitted as eligible for future `OBSERVATION`-role materialization in a Decision Context. It is positive admission declaration state only.

## Explicit human normative admission boundary

`DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT OBSERVATION ADMISSION DECLARATION`.

`PROPOSAL EXISTENCE != ADMISSION DECLARATION EXISTENCE`.

`ADMISSION DECLARATION != DECISION CONTEXT ITEM`.

`ADMISSION DECLARATION != DECISION CONTEXT`.

`ADMISSION DECLARATION != DECISION CONTEXT REVISION`.

`ADMISSION DECLARATION != MATERIALIZATION`.

`ADMISSION DECLARATION != CONTEXT MUTATION`.

`ADMISSION DECLARATION != REVISION CREATION`.

`ADMISSION DECLARATION != LOOP CLOSED`.

There is no automatic edge from a `DecisionContextObservationProposal` to this declaration and no automatic edge from this declaration to a `DecisionContextItem`.

## Positive admission only

One declaration contains exactly one sealed DCOP and one declared human actor. One sealed DCOP may have zero, one, or multiple independent declarations. The contract represents no rejection, defer, ignore, abstain, block, aggregation, vote, consensus, ranking, priority, score, confidence, or decision status.

`NO ADMISSION DECLARATION != REJECTION`.

`NO ADMISSION DECLARATION != DEFER`.

`NO ADMISSION DECLARATION != IGNORE`.

`NO ADMISSION DECLARATION != ABSTAIN`.

`NO ADMISSION DECLARATION != BLOCK`.

## Sealed DCOP predecessor

Construction consumes exactly one complete sealed `DecisionContextObservationProposal` and validates it only through `assertDecisionContextObservationProposal(...)`. It does not repair, reconstruct, or reinterpret the nested `OutcomeAttributionProposal`, `ActionStateChangeAssociationProposal`, `ActionOccurrenceClaim`, or `StateChangeClaim`.

## Declared human actor and rationale

`admittedBy` is exactly `{ origin: "HUMAN_INPUT", actorId: string }`. Construction trims actor ID and requires it nonempty; stored assertion requires the exact canonical trimmed form. No equality or inequality is required with any actor or provenance represented within the sealed DCOP.

`ADMITTED BY != PROPOSAL PROVENANCE`.

`PROPOSAL PROVENANCE != ADMISSION AUTHORITY`.

`HUMAN ADMISSION DECLARATION != AUTHENTICATED IDENTITY`.

`HUMAN ADMISSION DECLARATION != EXTERNAL AUTHORIZATION`.

`rationale` is exactly `string | null`. Construction preserves `null`, trims strings, and rejects empty results; stored assertion accepts only `null` or canonical trimmed nonempty text. It is opaque and identity-bearing.

`RATIONALE != EVIDENCE`.

`RATIONALE != SUPPORT`.

`RATIONALE != OBSERVATION TRUTH`.

`RATIONALE != OUTCOME TRUTH`.

## No target Context or source inventory mutation

The declaration has no `contextId`, `revisionId`, `previousRevisionId`, `itemId`, `decisionQuestionId`, or `sourceStateReferences` field. It identifies no target Decision Context and does not mutate one.

`ADMISSION AUTHORITY != MATERIALIZATION TARGET`.

`AUTHORITATIVE DCOP ADMISSION != SOURCE STATE REFERENCE ADMISSION`.

`REFERENCE PRESENT IN DCOP != REFERENCE PRESENT IN FUTURE DECISION CONTEXT`.

`ADMISSION DECLARATION != SOURCE STATE INVENTORY MUTATION`.

## Artifact contract and canonicalization

```ts
interface DecisionContextObservationAdmissionDeclarationInput {
  decisionContextObservationProposal: DecisionContextObservationProposal;
  admittedBy: DecisionContextObservationAdmissionActor;
  rationale: string | null;
}

interface DecisionContextObservationAdmissionDeclaration {
  artifactKind: "DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION";
  schemaVersion: typeof DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION_SCHEMA_VERSION;
  decisionContextObservationAdmissionId: string;
  decisionContextObservationProposal: DecisionContextObservationProposal;
  admittedBy: DecisionContextObservationAdmissionActor;
  rationale: string | null;
}
```

The input has exactly three fields and the artifact exactly six. `CREATE MAY CANONICALIZE WHERE EXPLICITLY DEFINED`. `ASSERT MUST NOT REPAIR`.

## `DCOAD_` identity and identity compression boundary

`DCOAD_` matches `^DCOAD_[0-9A-F]{24}$`. It is the first 24 uppercase hexadecimal SHA-256 characters over:

```ts
[
  "DECISION_CONTEXT_OBSERVATION_ADMISSION_DECLARATION_V1",
  decisionContextObservationProposal.decisionContextObservationProposalId,
  ["HUMAN_INPUT", admittedBy.actorId],
  rationale
]
```

Object insertion order is non-semantic. The sealed DCOP ID, declared actor ID, and rationale including `null` versus string are identity-bearing.

`DCOP IDENTITY != DECISION CONTEXT ITEM IDENTITY`.

`DISTINCT DCOP IDENTITY != NECESSARILY DISTINCT FUTURE DCI IDENTITY`.

`DCOAD IDENTITY != CONTEXT ITEM IDENTITY`.

`DCOAD IDENTITY != CONTEXT IDENTITY`.

`DCOAD IDENTITY != REVISION IDENTITY`.

`DCOAD IDENTITY != OBSERVATION TRUTH`.

`DCOAD IDENTITY != OUTCOME TRUTH`.

`DCOAD IDENTITY != PERSISTENCE AUTHORITY`.

Phase 8D2 preserves the complete sealed DCOP and its identity. It does not materialize or define a future item mapping.

## No truth, support, causation, Feedback, or Learning

`ADMISSION != OBSERVATION TRUTH`.

`ADMISSION != OBSERVED REALITY`.

`ADMISSION != OUTCOME TRUTH`.

`ADMISSION != SEMANTIC SUPPORT`.

`ADMISSION != CAUSATION`.

The contract is not Feedback or Learning and does not reuse legacy Career outcome, feedback, or learning semantics.

## Representation safety and error ownership

Construction and stored assertion use boundary-local shallow descriptor capture. The top-level boundary owns `decisionContextObservationProposal`, `admittedBy`, and `rationale`; the actor boundary owns `origin` and `actorId`. Nested validity is delegated only through `assertDecisionContextObservationProposal(...)`.

Accessors, symbol keys, hidden/non-enumerable fields, extras, and hostile nested Outcome Attribution, association, Action Occurrence Claim, or State Change Claim state reject without getter execution. Returned state is detached. This is not a deep-freeze claim.

The exact error surface is:

- `ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_INPUT_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_PROPOSAL_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_ACTOR_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_RATIONALE_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_ID_MISMATCH`

Malformed/hostile top-level input is `...INPUT_INVALID`; invalid, hostile, or stale sealed DCOP is `...PROPOSAL_INVALID`; invalid actor is `...ACTOR_INVALID`; invalid rationale is `...RATIONALE_INVALID`. Stored hostile, malformed, noncanonical, invalid actor/rationale, invalid sealed DCOP, or invalid nested predecessor state is `ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_INVALID`. Only an otherwise canonical valid complete body with stale/wrong outer `DCOAD_` is `ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_ID_MISMATCH`.

## Temporal and persistence exclusions

Phase 8D2 represents no time or temporal relation. It contains no timestamp, creation/occurrence/observation/effective time, range, or schedule.

It adds no repository, persister, database, persistence operation, or current/head/latest authority.

`PERSISTED != TRUE`.

## Consequences

Return-path governance now includes explicit human admission declaration, but no Context Item materialization, Context mutation, revision creation, or loop closure. The bidirectional human-machine loop remains open.

`DecisionContextObservationAdmissionDeclaration -> STOP`

## Evidence

- Focused Phase 8D2: 1 file / 7 tests passing.
- Decision Core: 27 files / 323 tests passing.
- Capability regression including the Decision Core authority adapter: 29 files / 280 tests passing.
- Phase 8D2 production-only scoped TypeScript: PASS.
- `git diff --check`: PASS.
- `repomix-output.xml`: ABSENT.

Two implementation Deep Sweeps found no production defect in the examined Phase 8D2 production scope. One consolidated test-only correction added permanent stored-assertion proof for hostile outer artifact, `admittedBy`, sealed `DecisionContextObservationProposal`, `OutcomeAttributionProposal`, `ActionStateChangeAssociationProposal`, `ActionOccurrenceClaim`, and `StateChangeClaim` representation cases. Production was not changed by that correction.

The implementation is sealed under the tested contract. Repository-wide and root-barrel standalone TypeScript cleanliness are not claimed unless independently proven.
