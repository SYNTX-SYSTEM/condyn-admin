# ADR 030: Outcome Attribution Proposal

## Status

Implementation sealed.

Implementation commit: `19f54a2b64d236f114802aeae6fd5e3542b7eaea`

Implementation tag: `v1.0.0-decision-core-phase8c3-outcome-attribution-proposal`

## Context

Phase 8C2 represents one explicit `ActionStateChangeAssociationProposal` over one sealed `ActionOccurrenceClaim` and one sealed `StateChangeClaim`. Its existence does not establish association truth, attribution, outcome, effect, consequence, or causation. The two sealed claim artifacts remain independent representations, and their coexistence does not automatically create the association proposal.

An explicit represented proposal is separately required when the State Change Claim already represented in a sealed association is to be given an outcome role relative to that association's Action Occurrence Claim. This boundary must not turn either the association or attribution proposal into outcome fact, relation truth, or causal meaning.

## Decision

Phase 8C3 adds only:

```text
SEALED ActionStateChangeAssociationProposal
+ EXPLICIT OutcomeAttributionProvenance
-> OutcomeAttributionProposal
-> STOP
```

`OutcomeAttributionProposal` represents a provenance-attributed proposal that the sealed association's represented State Change Claim has an outcome role relative to its represented Action Occurrence Claim.

## Explicit outcome-attribution-proposal boundary

`ASSOCIATION PROPOSAL EXISTENCE != OUTCOME ATTRIBUTION PROPOSAL EXISTENCE`. A complete sealed association proposal is a required predecessor, but no automatic edge creates outcome-attribution state. Phase 8C3 does not duplicate, repair, reinterpret, or reconstruct the association's embedded claims.

`ASSOCIATION PROPOSAL != OUTCOME ATTRIBUTION PROPOSAL`.

`ASSOCIATION != OUTCOME ATTRIBUTION`.

`ACTION OCCURRENCE CLAIM + STATE CHANGE CLAIM + ASSOCIATION PROPOSAL != OUTCOME ATTRIBUTION PROPOSAL`.

## Provenance semantics

The closed `OutcomeAttributionProvenance` union is exactly:

```ts
type OutcomeAttributionProvenance =
  | { origin: "HUMAN_INPUT"; actorId: string }
  | { origin: "MODEL_PROPOSAL"; proposalRef: string }
  | { origin: "AUTHORITATIVE_STATE"; stateReference: AuthoritativeStateReference };
```

`DETERMINISTIC_DERIVATION` is not admitted. This is its own semantic type: `SAME REPRESENTATION != SAME SEMANTIC ROLE`. The association proposal's provenance and the attribution proposal's provenance may use the same concrete source or different concrete sources; neither equality nor inequality carries additional semantics.

### HUMAN_INPUT provenance

`actorId` is required nonempty text. Construction may trim it; stored assertion requires it already trimmed. It represents declared human proposal provenance only, not authenticated identity, authorization, signature, responsibility, ownership, accountability, performer role, outcome truth, relation truth, or causal authority.

### MODEL_PROPOSAL provenance

`proposalRef` is required nonempty text. Construction may trim it; stored assertion requires it already trimmed. Phase 8C3 invokes no model or provider.

`MODEL PROPOSAL != PUBLICATION AUTHORITY`.

`MODEL PROPOSAL != OUTCOME TRUTH`.

`MODEL PROPOSAL != CAUSAL AUTHORITY`.

### AUTHORITATIVE_STATE provenance and authority limits

The reference is exactly `{ producerId, authorityContractId, artifactId, locator }`. Every field must be a non-blank string, while the exact represented strings remain opaque and unnormalized: `VALIDATE NON-BLANKNESS + PRESERVE EXACT REPRESENTATION`.

Phase 8C3 performs no reader, resolver, authority-validator, repository, adapter, payload-inspection, semantic-evaluator, or persistence operation.

`REFERENCE != AUTHORITY TOKEN`.

`REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`.

`PROVENANCE != SUPPORT`.

`CURRENT SOURCE AUTHORITY != OUTCOME TRUTH`.

## No outcome truth, relation truth, or causation

The proposal is proposal state only.

`OUTCOME ATTRIBUTION PROPOSAL != OUTCOME TRUTH`.

`OUTCOME ATTRIBUTION PROPOSAL != RELATION TRUTH`.

`OUTCOME ATTRIBUTION PROPOSAL != CAUSAL CLAIM`.

`OUTCOME ATTRIBUTION != CAUSATION`.

It does not establish action fact, state-change fact, effect truth, consequence truth, causal support, semantic support, current authority, publication authority, authority of reality, or persistence authority. No automatic attribution detector exists. Association existence, claim text, actor/source equality or inequality, temporal proximity/order, decision state, intent, commitment, similarity, status, confidence, or score do not infer attribution.

There is no outcome-state taxonomy. In particular, Phase 8C3 contains no `OutcomeState`, `SUCCESS`, `FAILURE`, `NO_RESPONSE`, `INTERVIEW_INVITE`, `REJECTED`, or `OFFER` state.

## Temporal exclusion

Phase 8C3 represents no temporal relation or time. It contains no timestamp, creation/occurrence/observation/attribution/effective time, range, or schedule; it uses no clock, random, or UUID identity.

`TEMPORAL ORDER != OUTCOME ATTRIBUTION`.

`TEMPORAL ORDER != CAUSATION`.

## Artifact contract and canonicalization

```ts
interface OutcomeAttributionProposalInput {
  associationProposal: ActionStateChangeAssociationProposal;
  provenance: OutcomeAttributionProvenance;
}

interface OutcomeAttributionProposal {
  artifactKind: "OUTCOME_ATTRIBUTION_PROPOSAL";
  schemaVersion: typeof OUTCOME_ATTRIBUTION_PROPOSAL_SCHEMA_VERSION;
  outcomeAttributionProposalId: string;
  associationProposal: ActionStateChangeAssociationProposal;
  provenance: OutcomeAttributionProvenance;
}
```

The input has exactly two fields; the artifact has exactly five fields. It does not duplicate `actionOccurrenceClaim` or `stateChangeClaim`, which remain inside the sealed association proposal. Construction may canonicalize only human `actorId` and model `proposalRef`. It must not repair the association predecessor. Authoritative reference strings are preserved exactly. `CREATE MAY CANONICALIZE WHERE EXPLICITLY DEFINED`; `CREATE MUST NOT REPAIR PREDECESSOR`; `ASSERT MUST NOT REPAIR`.

## `DOATP_` complete represented-proposal identity

`DOATP_` matches `^DOATP_[0-9A-F]{24}$`. It is the first 24 uppercase hexadecimal SHA-256 characters over:

```ts
[
  "OUTCOME_ATTRIBUTION_PROPOSAL_V1",
  associationProposal.actionStateChangeAssociationProposalId,
  canonicalProvenance
]
```

Canonical provenance is `['HUMAN_INPUT', actorId]`, `['MODEL_PROPOSAL', proposalRef]`, or `['AUTHORITATIVE_STATE', [producerId, authorityContractId, artifactId, locator]]`. Object insertion order is non-semantic. The sealed association identity, complete canonical provenance, and exact authoritative-reference strings participate.

`DOATP IDENTITY != OUTCOME TRUTH`.

`DOATP IDENTITY != RELATION TRUTH`.

`DOATP IDENTITY != CAUSAL IDENTITY`.

`DOATP IDENTITY != PERSISTENCE AUTHORITY`.

## Stored assertion and boundary-local hostile representation safety

Construction and stored assertion use boundary-local shallow descriptor capture. The top-level boundary owns `associationProposal` and `provenance`; the provenance boundary owns its direct variant fields; the authoritative-reference boundary owns its four fields. Nested association validity is delegated only through `assertActionStateChangeAssociationProposal(...)`.

Accessors, symbol keys, hidden/non-enumerable fields, extras, invalid objects, hostile association state, and hostile nested claim state reject without getter execution where applicable. Construction clones valid association state and the returned proposal is detached. This is not a deep-freeze claim.

`assertOutcomeAttributionProposal(...)` is self-contained, exact, canonical, and non-repairing.

## Error ownership

The exact error surface is:

- `ERR_DECISION_OUTCOME_ATTRIBUTION_INPUT_INVALID`
- `ERR_DECISION_OUTCOME_ATTRIBUTION_ASSOCIATION_PROPOSAL_INVALID`
- `ERR_DECISION_OUTCOME_ATTRIBUTION_PROVENANCE_INVALID`
- `ERR_DECISION_OUTCOME_ATTRIBUTION_REFERENCE_INVALID`
- `ERR_DECISION_OUTCOME_ATTRIBUTION_INVALID`
- `ERR_DECISION_OUTCOME_ATTRIBUTION_ID_MISMATCH`

Malformed top-level input is `...INPUT_INVALID`. Invalid, hostile, or stale sealed association input is `...ASSOCIATION_PROPOSAL_INVALID`. Malformed or unsupported provenance is `...PROVENANCE_INVALID`; malformed authoritative reference is `...REFERENCE_INVALID`.

For stored assertion, hostile, malformed, noncanonical, invalid nested association, invalid nested Action Occurrence Claim, invalid nested State Change Claim, and body-invalid state are `ERR_DECISION_OUTCOME_ATTRIBUTION_INVALID`. Only an otherwise canonical valid body with stale or wrong outer `DOATP_` is `ERR_DECISION_OUTCOME_ATTRIBUTION_ID_MISMATCH`.

## Persistence and authority boundary

Phase 8C3 adds no repository, adapter, database, persister, revision, current/head/latest selection, or authority-of-record operation.

`OUTCOME ATTRIBUTION PROPOSAL != PERSISTENCE AUTHORITY`.

`PERSISTED != TRUE`.

Persistence, if separately introduced, would be governed record authority only and would not establish outcome truth.

## Legacy non-reuse

Phase 8C3 is independently reconstructed. It does not reuse or generalize legacy Career `outcome.ts`, `feedback.ts`, `learning.ts`, `OutcomeRecord`, `OutcomeState`, `FeedbackRecord`, `AttributionRecord`, `AttributionType`, `ASSOCIATED_WITH`, `SUPPORTS`, `CONTRADICTS`, or `CAUSAL_CLAIM`. Legacy Career semantics are not architecture authority for Phase 8C3.

## Non-goals

Phase 8C3 introduces no outcome fact, relation truth, effect truth, consequence truth, causation, causal support, semantic support, temporal relation, outcome-state taxonomy, model invocation, authority resolution, publication authority, persistence authority, feedback, learning, or future relation/artifact contract.

## Consequences

The implemented architecture can represent a bounded, explicit outcome-attribution proposal without upgrading any claim, association, provenance, reference, or deterministic identity into real-world truth or causation.

`OutcomeAttributionProposal -> STOP`

## Evidence

- Focused Phase 8C3: 1 file / 7 tests passing.
- Decision Core: 25 files / 309 tests passing.
- Capability regression including the Decision Core authority adapter: 29 files / 280 tests passing.
- Phase 8C3 production-only scoped TypeScript: PASS.
- `git diff --check`: PASS.
- `repomix-output.xml`: ABSENT.

Two implementation Deep Sweeps found no production defect in the examined Phase 8C3 production scope. One consolidated test-only correction added permanent direct proof for the hostile sealed-association representation matrix, hostile nested `ActionOccurrenceClaim` and `StateChangeClaim` handling, and stored outer-error ownership. Production was not changed by that correction.

The implementation is sealed under the tested contract. Repository-wide and root-barrel standalone TypeScript cleanliness are not claimed unless independently proven.
