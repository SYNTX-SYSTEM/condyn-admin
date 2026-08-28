# ADR 027: Action Occurrence Claim

## Status

Implementation sealed.

Implementation: `16e0be4fcc298d6f7523fc4f78bfc908d43daf83`

Tag: `v1.0.0-decision-core-phase8b-action-occurrence-claim`

## Context

Phase 8A2 records a declared human commitment to a complete Action Intent, not that an operation occurred. A real-world occurrence may be reported independently of any prior ConDyn decision, intention, or commitment. The first generic occurrence-facing boundary must preserve that distinction and must not convert a claim into fact.

## Decision

Add the adjacent generic `action-occurrence-claim` module:

```text
HUMAN_INPUT or AUTHORITATIVE_STATE source
+ OPAQUE OPERATION DESCRIPTION
-> ActionOccurrenceClaim
-> STOP
```

It represents only: an explicit represented source claims that a described operation occurred.

## Standalone occurrence-claim boundary

`ActionOccurrenceClaim` has no required `HumanDecisionDeclaration`, `DecisionActionIntent`, `HumanCommitment`, revision, assessment, recommendation, or coherence predecessor. It has no optional predecessor ID. Identical operation text, actor equality, ID similarity, or temporal proximity establishes no relation. Any future relation requires a separately specified relation contract.

## Source semantics

The closed source union is exactly `HUMAN_INPUT | AUTHORITATIVE_STATE`, not the wider Decision Context provenance union. `MODEL_PROPOSAL != ACTION OCCURRENCE SOURCE`; `DETERMINISTIC_DERIVATION != ACTION OCCURRENCE SOURCE`.

## HUMAN_INPUT source

`{ origin: "HUMAN_INPUT", actorId }` records declared human source/reporting provenance only. It does not establish authenticated identity, authorization, signature, permission, performer/executor identity, assignment, responsibility, ownership, accountability, execution proof, or truth.

## AUTHORITATIVE_STATE source and authority limits

`{ origin: "AUTHORITATIVE_STATE", stateReference: { producerId, authorityContractId, artifactId, locator } }` cites only that exact opaque governed-state reference. Phase 8B calls no reader, resolver, authority validator, evaluator, repository, adapter, or payload inspection. `REFERENCE != AUTHORITY TOKEN`; a reference is neither current authority nor occurrence proof.

## No performer semantics

No `performedBy`, performer actor, executor, assignee, owner, responsible, or accountable field exists. `CLAIM SOURCE ROLE != PERFORMER ROLE`; `ROLE NON-EQUIVALENCE != MANDATORY ACTOR-ID INEQUALITY`.

## Opaque operation description

`operationDescription` is trimmed nonempty opaque text. It is not action type, target, command, workflow, performer, expected effect, outcome, status, execution proof, or relation to Action Intent.

## Temporal exclusion

Phase 8B represents no temporal claim. No timestamp, occurrence time, clock, random/time ID, schedule, or temporal ordering exists. `WALL-CLOCK TIME != AUTHORITY`; `TIMESTAMP != OCCURRENCE PROOF`; `TEMPORAL ORDER != CAUSATION`.

## Artifact contract and canonicalization

Schema: `ACTION_OCCURRENCE_CLAIM_V1`.

```ts
type ActionOccurrenceClaimSource =
  | { origin: "HUMAN_INPUT"; actorId: string }
  | { origin: "AUTHORITATIVE_STATE"; stateReference: AuthoritativeStateReference };

interface ActionOccurrenceClaimInput {
  source: ActionOccurrenceClaimSource;
  operationDescription: string;
}

interface ActionOccurrenceClaim {
  artifactKind: "ACTION_OCCURRENCE_CLAIM";
  schemaVersion: "ACTION_OCCURRENCE_CLAIM_V1";
  actionOccurrenceClaimId: string;
  source: ActionOccurrenceClaimSource;
  operationDescription: string;
}
```

Input has exactly two fields; artifact has exactly five. Human actor ID and operation text may trim during construction. The four authoritative reference strings must be non-blank but preserve exact representation. `CREATE MAY CANONICALIZE WHERE EXPLICITLY DEFINED; ASSERT MUST NOT REPAIR.`

## DAOC complete represented-claim identity

`DAOC_` is the first 24 uppercase hexadecimal characters of SHA-256 over:

```ts
[
  "ACTION_OCCURRENCE_CLAIM_V1",
  canonicalSource,
  operationDescription
]
```

`canonicalSource` is `["HUMAN_INPUT", actorId]` or `["AUTHORITATIVE_STATE", [producerId, authorityContractId, artifactId, locator]]`. Object insertion order is non-semantic; every represented reference axis is semantic.

## Stored assertion and boundary-local hostile representation safety

`assertActionOccurrenceClaim(...)` is self-contained and invokes no external dependency. Construction and assertion use boundary-local shallow descriptor capture: top-level owns `source` and `operationDescription`; source owns its direct variant shape; authoritative reference owns its four fields. This prevents outer representation boundaries from stealing nested semantic error ownership. Accessors, symbols, hidden/non-enumerable fields, extras, invalid representations, and applicable self/cycles reject without getter execution. Returned state is detached, not asserted deep-frozen.

## Error ownership

The exact errors are `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_INPUT_INVALID`, `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_SOURCE_INVALID`, `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_REFERENCE_INVALID`, `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_OPERATION_INVALID`, `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_INVALID`, and `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_ID_MISMATCH`.

Constructor errors belong respectively to malformed top-level input, source, authoritative reference, and operation text. Stored hostile, malformed, noncanonical, or body-invalid state is `...INVALID`; only otherwise-valid stale identity is `...ID_MISMATCH`.

## Persistence and authority boundary

`ACTION OCCURRENCE CLAIM ARTIFACT != PERSISTENCE AUTHORITY`. Phase 8B adds no repository, persistence adapter, persister, authority-of-record operation, or current/latest/head selection. A future persisted claim would not imply real-world truth.

## Legacy non-reuse

Phase 8B is constructed independently from first principles. It does not reuse or generalize `lib/career/decisions/action.ts`, `ActionEvent`, `CommitmentRecord`, action type, external reference, occurrence time, random/time identity, action cache, or mandatory Commitment-to-Action topology. `LEGACY CAREER ACTION EVENT != AUTHORITY FOR GENERIC PHASE 8B`.

## Non-goals

Action fact, Action Event, observed/verified action, Action observation, execution proof, performer, temporal state, relation to prior decision state, outcome, feedback, learning, semantic occurrence support, authority of reality, and persistence authority are non-goals.

## Consequences

```text
ACTION OCCURRENCE CLAIM != ACTION OCCURRENCE FACT
ACTION OCCURRENCE CLAIM != OBSERVED REALITY
ACTION OCCURRENCE CLAIM != EXECUTION PROOF
SOURCE PROVENANCE != CURRENT SOURCE AUTHORITY
CURRENT SOURCE AUTHORITY != SEMANTIC OCCURRENCE SUPPORT
SEMANTIC OCCURRENCE SUPPORT != AUTHORITY OF REALITY
CLAIM SOURCE ROLE != PERFORMER ROLE
ROLE NON-EQUIVALENCE != MANDATORY ACTOR-ID INEQUALITY
ACTION INTENT != UNIVERSAL ACTION PREDECESSOR
HUMAN COMMITMENT != UNIVERSAL ACTION PREDECESSOR
ACTION OCCURRENCE CLAIM != OUTCOME
TEMPORAL ORDER != CAUSATION
```

## Evidence

- Focused Phase 8B: 1 file / 7 tests passing.
- Decision Core: 22 files / 288 tests passing.
- Capability Core: 28 files / 272 tests passing.
- Scoped TypeScript, import gate, forbidden semantic gate, and `git diff --check`: PASS.
- Human Decision, Action Intent, Human Commitment, and Legacy Career freeze diffs: EMPTY; `repomix-output.xml`: ABSENT.
- Post-implementation double Deep Sweep found and the consolidated correction fixed nested error-ownership capture; focused identity, error-ownership, hostile-representation, insertion-order, and detachment proofs pass.
