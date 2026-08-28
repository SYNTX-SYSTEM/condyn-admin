# ADR 031: Decision Context Observation Proposal

## Status

Implementation sealed.

Implementation commit: `60218fe1d4ef3410762e953575319c5a70fcade0`

Implementation tag: `v1.0.0-decision-core-phase8d1-context-observation-proposal`

## Context

Phase 8C3 represents one sealed `OutcomeAttributionProposal` over one sealed association proposal. Its existence does not establish outcome truth, relation truth, causation, semantic support, or authority of reality. It also does not automatically create a return-path candidate for Decision Context consideration.

The architecture needs a bounded representation for an explicit opaque statement based on that sealed predecessor, while preserving the distinction between a candidate and a `DecisionContextItem`, Context admission, or revision state.

## Decision

Phase 8D1 adds only:

```text
SEALED OutcomeAttributionProposal
+ EXPLICIT OPAQUE STATEMENT
+ EXPLICIT DecisionContextObservationProposalProvenance
-> DecisionContextObservationProposal
-> STOP
```

The proposal is an `OBSERVATION`-role candidate for a future Decision Context. It is not returned, admitted, inserted, materialized, or incorporated into a Decision Context by this contract.

## Return-path candidate boundary

`OUTCOME ATTRIBUTION PROPOSAL != DECISION CONTEXT OBSERVATION PROPOSAL`.

`OUTCOME ATTRIBUTION PROPOSAL EXISTENCE != DECISION CONTEXT OBSERVATION PROPOSAL EXISTENCE`.

`DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT ITEM`.

`DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT`.

`DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT REVISION`.

`REENTRY PROPOSAL != ADMISSION`.

`REENTRY PROPOSAL != REVISION`.

`REENTRY PROPOSAL != LOOP CLOSED`.

The sealed predecessor, explicit statement, and explicit provenance are all required. There is no automatic transition from outcome attribution to observation-candidate proposal, and no automatic edge from a candidate to a Decision Context.

## Sealed Outcome Attribution Proposal predecessor

Construction consumes exactly one complete sealed `OutcomeAttributionProposal` and validates it only through `assertOutcomeAttributionProposal(...)`. It does not repair or independently reinterpret the predecessor or reconstruct its nested `ActionStateChangeAssociationProposal`, `ActionOccurrenceClaim`, or `StateChangeClaim` state.

## Explicit opaque statement

`statement` is required opaque text. Construction trims it and requires it nonempty; stored assertion requires the exact already-canonical trimmed representation. The statement is identity-bearing and is not derived from operation descriptions, state-change descriptions, association/attribution provenance, IDs, or similarity.

`OUTCOME ATTRIBUTION PROPOSAL != OBSERVATION STATEMENT`.

## Explicit provenance

The closed `DecisionContextObservationProposalProvenance` union is exactly:

```ts
type DecisionContextObservationProposalProvenance =
  | { origin: "HUMAN_INPUT"; actorId: string }
  | { origin: "MODEL_PROPOSAL"; proposalRef: string }
  | { origin: "AUTHORITATIVE_STATE"; stateReference: AuthoritativeStateReference };
```

`DETERMINISTIC_DERIVATION` is not admitted. This is its own semantic type: `SAME REPRESENTATION != SAME SEMANTIC ROLE`.

Human `actorId` and model `proposalRef` are required nonempty strings. Construction may trim them; stored assertion requires canonical values. They represent provenance only, not authenticated identity, authorization, signature, observation truth, outcome truth, semantic support, responsibility, ownership, or accountability.

`MODEL PROPOSAL != PUBLICATION AUTHORITY`.

`MODEL PROPOSAL != OBSERVATION TRUTH`.

`MODEL PROPOSAL != OUTCOME TRUTH`.

## Authority boundaries

`AUTHORITATIVE_STATE` stores only `{ producerId, authorityContractId, artifactId, locator }`. Each field is non-blank, while the exact opaque strings are preserved without normalization: `VALIDATE NON-BLANKNESS + PRESERVE EXACT REPRESENTATION`.

Phase 8D1 performs no reader, resolver, payload inspection, authority validation, evaluator, repository, context construction, revision creation, or persistence operation.

`REFERENCE != AUTHORITY TOKEN`.

`REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`.

`CURRENT SOURCE AUTHORITY != OBSERVATION TRUTH`.

`PROVENANCE != SUPPORT`.

## No truth, support, or causation

`OBSERVATION ROLE != OBSERVED REALITY`.

`OBSERVATION PROPOSAL != OBSERVATION TRUTH`.

`REENTRY != OUTCOME TRUTH`.

`REENTRY != SEMANTIC SUPPORT`.

The proposal establishes neither observed reality, verified observation, Action fact, State Change fact, Outcome fact, outcome truth, relation truth, effect truth, consequence truth, semantic support, nor causation.

## Artifact contract and canonicalization

```ts
interface DecisionContextObservationProposalInput {
  outcomeAttributionProposal: OutcomeAttributionProposal;
  statement: string;
  provenance: DecisionContextObservationProposalProvenance;
}

interface DecisionContextObservationProposal {
  artifactKind: "DECISION_CONTEXT_OBSERVATION_PROPOSAL";
  schemaVersion: typeof DECISION_CONTEXT_OBSERVATION_PROPOSAL_SCHEMA_VERSION;
  decisionContextObservationProposalId: string;
  outcomeAttributionProposal: OutcomeAttributionProposal;
  statement: string;
  provenance: DecisionContextObservationProposalProvenance;
}
```

The input has exactly three fields and the artifact exactly six. There is no `role`, `itemId`, `contextId`, `revisionId`, `previousRevisionId`, feedback, evaluation, support, status, confidence, score, priority, truth, time, repository, or persistence field. The target role is semantically fixed as `OBSERVATION`, but no `DecisionContextItem` exists.

`CREATE MAY CANONICALIZE WHERE EXPLICITLY DEFINED`.

`ASSERT MUST NOT REPAIR`.

## `DCOP_` identity

`DCOP_` matches `^DCOP_[0-9A-F]{24}$`. It is the first 24 uppercase hexadecimal SHA-256 characters over:

```ts
[
  "DECISION_CONTEXT_OBSERVATION_PROPOSAL_V1",
  outcomeAttributionProposal.outcomeAttributionProposalId,
  statement,
  canonicalProvenance
]
```

Canonical provenance is `['HUMAN_INPUT', actorId]`, `['MODEL_PROPOSAL', proposalRef]`, or `['AUTHORITATIVE_STATE', [producerId, authorityContractId, artifactId, locator]]`. Object insertion order is non-semantic. The predecessor ID, statement, complete provenance, and exact authoritative reference strings participate.

`DCOP IDENTITY != OBSERVATION TRUTH`.

`DCOP IDENTITY != CONTEXT ADMISSION`.

`DCOP IDENTITY != REVISION IDENTITY`.

`DCOP IDENTITY != OUTCOME TRUTH`.

`DCOP IDENTITY != PERSISTENCE AUTHORITY`.

## Representation safety and stored assertion

Construction and stored assertion use boundary-local shallow descriptor capture. The top-level boundary owns `outcomeAttributionProposal`, `statement`, and `provenance`; provenance owns only direct variant fields; the authoritative-reference boundary owns its four fields. Nested predecessor validity is delegated only through `assertOutcomeAttributionProposal(...)`.

Hostile accessors, symbol keys, hidden/non-enumerable fields, extra fields, hostile nested association state, hostile nested Action Occurrence Claim, and hostile nested State Change Claim state reject without getter execution. Returned state is detached. This is not a deep-freeze claim.

## Error ownership

The exact error surface is:

- `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INPUT_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_OUTCOME_ATTRIBUTION_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_STATEMENT_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_PROVENANCE_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_REFERENCE_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INVALID`
- `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_ID_MISMATCH`

Malformed top-level input is `...INPUT_INVALID`. Invalid, hostile, or stale sealed predecessor input is `...OUTCOME_ATTRIBUTION_INVALID`. Invalid statement is `...STATEMENT_INVALID`; malformed or unsupported provenance is `...PROVENANCE_INVALID`; malformed authoritative reference is `...REFERENCE_INVALID`.

For stored assertion, hostile, malformed, noncanonical, invalid nested Outcome Attribution Proposal, invalid nested Action State Change Association Proposal, invalid nested Action Occurrence Claim, invalid nested State Change Claim, invalid statement, invalid provenance, invalid reference, and body-invalid state are `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INVALID`. Only an otherwise canonical valid body with stale or wrong outer `DCOP_` is `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_ID_MISMATCH`.

## Temporal, persistence, and Legacy exclusions

Phase 8D1 represents no time or temporal relation. It contains no timestamp, creation/occurrence/observation/effective time, range, or schedule.

It adds no repository, persister, database, persistence operation, or current/head/latest state.

`DCOP IDENTITY != PERSISTENCE AUTHORITY`.

`PERSISTED != TRUE`.

Phase 8D1 is not Feedback or Learning and does not reuse legacy Career outcome, feedback, or learning semantics. It does not introduce feedback/evaluation states, attribution records, or learning state.

## Consequences

Return-path representation has begun, but candidate admission/materialization into a future Decision Context and any resulting revision transition are not implemented by Phase 8D1. The bidirectional human-machine loop remains open.

`DecisionContextObservationProposal -> STOP`

## Evidence

- Focused Phase 8D1: 1 file / 7 tests passing.
- Decision Core: 26 files / 316 tests passing.
- Capability regression including the Decision Core authority adapter: 29 files / 280 tests passing.
- Phase 8D1 production-only scoped TypeScript: PASS.
- `git diff --check`: PASS.
- `repomix-output.xml`: ABSENT.

Two implementation Deep Sweeps found no production defect in the examined Phase 8D1 production scope. One consolidated test-only correction added permanent proof for the hostile sealed OutcomeAttributionProposal representation matrix, hostile embedded ActionStateChangeAssociationProposal, ActionOccurrenceClaim and StateChangeClaim handling, and stored outer-error ownership. Production was not changed by that correction.

The implementation is sealed under the tested contract. Repository-wide and root-barrel standalone TypeScript cleanliness are not claimed unless independently proven.
