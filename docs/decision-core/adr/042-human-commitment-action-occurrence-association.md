# ADR 042: Human Commitment Action Occurrence Association

## Status

Accepted for Phase 8E1 documentation.

## Decision

`HumanCommitmentActionOccurrenceAssociationProposal` is an explicit, provenance-attributed bridge. Its canonical meaning is:

> An explicit provenance-attributed association proposal represents that one sealed HumanCommitment and one sealed ActionOccurrenceClaim are associated, while preserving both endpoint artifacts as independently valid states and establishing neither execution proof, commitment fulfillment, action fact, relation truth, causation, nor universal predecessor topology.

```text
HumanDecisionDeclaration
-> DecisionActionIntent
-> HumanCommitment
        |
        | explicit association proposal
        v
ActionOccurrenceClaim
-> independent occurrence / return branch
```

Before 8E1 these were deliberately independent branches. The bridge is optional; it does not rewrite ActionOccurrenceClaim as commitment-dependent.

HUMAN COMMITMENT != UNIVERSAL ACTION PREDECESSOR

ACTION OCCURRENCE CLAIM != COMMITMENT-BOUND CLAIM

ASSOCIATION EXISTENCE != OCCURRENCE-CLAIM VALIDITY

HUMAN COMMITMENT + ACTION OCCURRENCE CLAIM != ASSOCIATION

## Explicit, not inferred

No association is inferred from operation-description equality or similarity, actor equality, source equality, temporal proximity or order, shared wording, ID similarity, decision/intent identity, or model output. Differing Action Intent and ActionOccurrenceClaim operation descriptions remain explicitly associable; the permanent tests protect that result.

OPERATION DESCRIPTION EQUALITY != ASSOCIATION

OPERATION DESCRIPTION SIMILARITY != ASSOCIATION

ACTOR EQUALITY != ASSOCIATION

SOURCE EQUALITY != ASSOCIATION

TEMPORAL ORDER != ASSOCIATION

TEMPORAL ORDER != CAUSATION

## Provenance and endpoints

The closed provenance union is HUMAN_INPUT, MODEL_PROPOSAL, and AUTHORITATIVE_STATE. It is Phase-8E1-specific even where represented shapes resemble another artifact’s provenance. SAME REPRESENTATION != SAME SEMANTIC ROLE. DETERMINISTIC_DERIVATION is not admitted.

HUMAN PROPOSAL != RELATION TRUTH

HUMAN PROPOSAL != EXECUTION PROOF

MODEL PROPOSAL != RELATION TRUTH

MODEL PROPOSAL != EXECUTION PROOF

REFERENCE != AUTHORITY TOKEN

REFERENCE PRESENT != CURRENT SOURCE AUTHORITY

PROVENANCE != SUPPORT

AUTHORITATIVE_STATE retains opaque nonblank `producerId`, `authorityContractId`, `artifactId`, and `locator` strings exactly. 8E1 performs no reader call, authority resolution, payload inspection, freshness validation, or repository lookup.

The artifact retains complete sealed HumanCommitment and ActionOccurrenceClaim artifacts, not only IDs. HumanCommitment retains its complete `DecisionActionIntent -> HumanDecisionDeclaration` decision-side lineage; ActionOccurrenceClaim remains independently valid standalone claim state.

## No execution, truth, or causal upgrade

ASSOCIATION PROPOSAL != EXECUTION PROOF

ASSOCIATION PROPOSAL != COMMITMENT FULFILLMENT

ASSOCIATION PROPOSAL != ACTION FACT

ASSOCIATION PROPOSAL != OBSERVED REALITY

ASSOCIATION PROPOSAL != VERIFIED ACTION

ASSOCIATION PROPOSAL != RELATION TRUTH

ASSOCIATION != CAUSATION

ASSOCIATION PROPOSAL != CAUSAL CLAIM

ASSOCIATION PROPOSAL != SUCCESS

ASSOCIATION PROPOSAL != COMPLETION

COMMITTED != EXECUTED

COMMITTED != DONE

ACTION OCCURRENCE CLAIM != ACTION OCCURRENCE FACT

## Artifact and identity

Schema: `HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL_V1`; prefix: `DHCAOA_`. Its exact six fields are:

```text
artifactKind
schemaVersion
humanCommitmentActionOccurrenceAssociationProposalId
humanCommitment
actionOccurrenceClaim
provenance
```

There is no relationKind, executionStatus, fulfilled, completed, success, performedBy, executor, outcome, effect, causation, timestamp, persistence, or loopClosed field.

Identity commits to:

```text
[
  "HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL_V1",
  canonical complete HumanCommitment,
  canonical complete ActionOccurrenceClaim,
  canonical provenance
]
```

It is SHA-256, first 24 uppercase hexadecimal characters, with `DHCAOA_`; recursive object-key order is canonical while existing sealed order-bearing arrays retain their semantics.

DHCAOA IDENTITY != RELATION TRUTH

DHCAOA IDENTITY != EXECUTION PROOF

DHCAOA IDENTITY != CAUSAL IDENTITY

## Stored assertion and representation safety

`assertHumanCommitmentActionOccurrenceAssociationProposal` is self-contained. It verifies exact shape, complete sealed endpoints, exact provenance, and complete-state identity; it repairs nothing. Body invalidity precedes a stale outer DHCAOA ID mismatch.

Descriptor-safe capture rejects accessors without getter execution, symbols, hidden/extra state, hostile endpoint lineage, hostile claim/source/provenance/reference state, cycles, sparse arrays, and custom arrays. The returned artifact is detached; no deep-freeze claim is made.

The assertion performs no reader call, repository operation, authority resolution, model/provider invocation, similarity operation, association inference, lineage reconstruction, return-path traversal, or persistence operation.

## Loop boundary

8E1 introduces the missing explicit bridge between the decision branch and the occurrence branch. It does not consume the persisted 8D10 return path.

BRIDGE ASSOCIATION PROPOSAL != LOOP CLOSED

ASSOCIATION PROPOSAL EXISTENCE != RETURN-PATH MATCH

ACTION OCCURRENCE CLAIM ID EQUALITY != COMPLETE RETURN-PATH MATCH

The remaining architectural question is whether the complete ActionOccurrenceClaim in one bridge is exactly the complete ActionOccurrenceClaim retained in one sealed 8D10 persistence lineage. No future artifact is defined here.

## Error surface

```text
ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_INPUT_INVALID
ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_HUMAN_COMMITMENT_INVALID
ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_ACTION_OCCURRENCE_CLAIM_INVALID
ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROVENANCE_INVALID
ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_REFERENCE_INVALID
ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_INVALID
ERR_DECISION_HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_ID_MISMATCH
```

No additional Phase-8E1-owned errors exist.

## Evidence

- Implementation: `6d61230fdbc3457d5f188f72d6babb6b4b7b8829` / `v1.0.0-decision-core-phase8e1-human-commitment-action-occurrence-association`.
- Focused: 7 / 7; Decision Core: 37 files / 395 tests; capability + authority-adapter: 32 files / 295 tests.
- Phase Gate: MECHANICAL VERIFICATION PASS; implementation seal: MECHANICAL SEALING PASS.

This scoped evidence does not claim repository-wide semantic correctness, zero defects, or repository-wide TypeScript cleanliness.

HumanCommitmentActionOccurrenceAssociationProposal -> STOP
