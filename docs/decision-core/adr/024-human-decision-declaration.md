# ADR 024: Human Decision Declaration

## Status

Implementation sealed.

Implementation: `e6e2f21c5b9c82d41153d12b721b16baab5f5998`

Tag: `v1.0.0-decision-core-phase7a-human-decision`

## Context

Phase 6A records a human-owned normative assessment frame, Phase 6B binds it to one exact sealed revision, Phase 6C admits model semantic assessment relations within the selected frame, Phase 6D admits recommendation proposal state within the selected and assessed option inventory, and Phase 6E reconstructs deterministic recommendation-to-assessment traceability. None makes a human decision.

The model-proposal path must not become the admissible human decision space. In particular, `assessmentRequest.selectedOptionItemIds` means only that a human included references in an assessment request; it is not a complete human-decidable option universe. An option's absence from assessments, recommendations, or traces is likewise not a human-choice prohibition.

Therefore:

```text
THE MODEL MAY NARROW ITS OWN PROPOSAL SPACE.
IT MUST NOT NARROW THE HUMAN DECISION SPACE.

HUMAN ASSESSMENT SELECTION != HUMAN DECISION ADMISSIBILITY
ASSESSMENT != HUMAN DECISION ADMISSIBILITY
RECOMMENDATION != HUMAN DECISION ADMISSIBILITY
COHERENCE TRACE != HUMAN DECISION ADMISSIBILITY
```

The existing Career decision surface is domain-specific and has its own ontology. It cannot be generalized as the generic Decision Core human-decision contract.

## Decision

Add `human-decision` as an adjacent generic Decision Core module. It consumes:

```text
SEALED DecisionProposalCoherenceValidation
+ DECLARED HUMAN_INPUT actor
+ ONE OR MORE explicit option choices
+ OPTIONAL human rationale
-> HumanDecisionDeclaration
-> STOP
```

The public artifact is exactly:

```ts
interface HumanDecisionDeclaration {
  artifactKind: "HUMAN_DECISION_DECLARATION";
  schemaVersion: "HUMAN_DECISION_DECLARATION_V1";
  humanDecisionId: string;
  proposalCoherenceValidation: DecisionProposalCoherenceValidation;
  decidedBy: HumanDecisionActor;
  chosenOptionItemIds: readonly string[];
  rationale: string | null;
}
```

`HumanDecisionActor` is `{ origin: "HUMAN_INPUT", actorId }`; it is declared ownership only, not authenticated identity, authorization, signature, permission, or truth. `DECISION ACTOR != ASSESSMENT REQUESTER`.

Each choice must be DCI-shaped, present in the complete sealed revision embedded through `DPCV -> recommendation proposal -> assessment proposal -> assessment basis -> revision -> context.items`, and role `OPTION`. Phase 7A does not require it to be selected in 6A, assessed in 6C, recommended in 6D, or traced in 6E. One or more distinct choices are required; multiple choices are allowed and canonicalized by item-ID order. This is positive selection only: empty input does not represent defer, abstain, reject-all, or no decision.

Rationale is `null` or a trimmed nonempty string. It is human-declared text only: `HUMAN RATIONALE != PROOF != SEMANTIC TRUTH`.

`DHDEC_` is SHA-256, first 24 uppercase hexadecimal characters, over:

```ts
[
  "HUMAN_DECISION_DECLARATION_V1",
  canonicalCompleteDecisionProposalCoherenceValidation,
  ["HUMAN_INPUT", trimmedActorId],
  canonicalChosenOptionItemIds,
  canonicalRationale
]
```

The complete embedded DPCV participates; identity is not merely validation ID plus choices. Object insertion order is non-semantic through recursive canonicalization, predecessor arrays retain their sealed semantics, and caller choice order is independently canonical. `DHDEC IDENTITY != AUTHENTICATED HUMAN IDENTITY != AUTHORIZATION != TRUTH != RECOMMENDATION CORRECTNESS != OPTION OPTIMALITY != ACTION != PERSISTENCE AUTHORITY`.

`createHumanDecisionDeclaration(...)` and `assertHumanDecisionDeclaration(...)` use defensive descriptor-based capture. The stored assertion is self-contained, may assert the embedded DPCV, and performs no model, provider, evaluator, generator, reader, repository, persister, lineage, authority, authentication, or external call. `CREATE MAY CANONICALIZE; ASSERT MUST NOT REPAIR.`

The runtime surface is exactly `HUMAN_DECISION_DECLARATION_SCHEMA_VERSION`, `createHumanDecisionDeclaration`, and `assertHumanDecisionDeclaration`. The types are exactly `HumanDecisionActor`, `HumanDecisionDeclarationInput`, and `HumanDecisionDeclaration`.

## Consequences

Phase 7A is the first explicit human normative decision state in the generic core. It remains only a declaration of positive option selection; it does not establish:

- model proposal or recommendation correctness;
- truth, proof, semantic support, option optimality, or human preference proof;
- authenticated identity or authorization;
- current producer authority, current revision, or persistence authority;
- action, outcome, feedback, learning, or closure of the human-machine loop.

`HUMAN DECISION != MODEL RECOMMENDATION`, `HUMAN CHOICE != RECOMMENDED OPTION`, `HUMAN CHOICE != ASSESSED OPTION`, `MULTIPLE CHOSEN OPTIONS != RANKING`, and `HUMAN DECISION != ACTION != OUTCOME != FEEDBACK`.

The generic contract is constructed independently from first principles. It does not reuse `lib/career/decisions/*`, including ACCEPT/REJECT/DEFER variants, proof-chain objects, subject/recommendation identifiers, timestamps, random IDs, or Career policy.

The exact error surface is:

- `ERR_DECISION_HUMAN_DECISION_INPUT_INVALID`
- `ERR_DECISION_HUMAN_DECISION_PROPOSAL_COHERENCE_INVALID`
- `ERR_DECISION_HUMAN_DECISION_ACTOR_INVALID`
- `ERR_DECISION_HUMAN_DECISION_OPTION_ID_INVALID`
- `ERR_DECISION_HUMAN_DECISION_OPTION_NOT_FOUND`
- `ERR_DECISION_HUMAN_DECISION_OPTION_ROLE_MISMATCH`
- `ERR_DECISION_HUMAN_DECISION_DUPLICATE_OPTION`
- `ERR_DECISION_HUMAN_DECISION_RATIONALE_INVALID`
- `ERR_DECISION_HUMAN_DECISION_INVALID`
- `ERR_DECISION_HUMAN_DECISION_ID_MISMATCH`

## Evidence

- Focused Phase 7A: 1 file / 8 tests passing.
- Decision Core: 19 files / 264 tests passing.
- Capability Core: 31 files / 287 tests passing.
- Scoped TypeScript: PASS.
- `git diff --check`: PASS.
- Phase 6 predecessor production/test diffs: EMPTY.
- Human autonomy admission gate audit: EMPTY.
- Forbidden Phase 7A production semantic audit: EMPTY.
- Import gate: only `node:crypto`, `../proposal-coherence`, and local files.
- Descriptor hardening covers accessors, symbols, hidden fields, sparse arrays, custom array state, and cycles; accessor getters are not executed.
- Exact public type surface: proven.
