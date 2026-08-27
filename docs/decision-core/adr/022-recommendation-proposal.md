# ADR 022: Recommendation proposal

## Status

Implemented and sealed.

Implementation: `a8b04a23f0e86f9a289fc5e5250693fc3123e671`

Tag: `v1.0.0-decision-core-phase6d-recommendation-proposal`

## Context

Phase 6A records a human-owned normative assessment frame. Phase 6B binds that frame to one exact sealed revision and verifies the declared item membership and roles. Phase 6C records zero or more semantic assessment relations inside the human-selected frame. An assessment relation remains distinct from a recommendation: it does not rank options, choose a winner, establish a preference, or make a human decision.

Phase 6D therefore adds a separate recommendation-proposal representation. A valid revision-member option is not sufficient: the option must be both selected in the human-owned frame and represented by at least one Phase 6C assessment relation. This preserves the explicit chain:

```text
HUMAN-OWNED ASSESSMENT REQUEST
-> REVISION-BOUND ASSESSMENT BASIS
-> SEMANTIC ASSESSMENT PROPOSAL
-> RECOMMENDATION PROPOSAL
-> STOP
```

`REVISION MEMBERSHIP != HUMAN NORMATIVE SELECTION`, `HUMAN NORMATIVE SELECTION != ASSESSMENT REPRESENTATION`, and `ASSESSMENT REPRESENTATION != RECOMMENDATION`.

## Decision

### Artifact

Phase 6D introduces the exact six-field `DecisionRecommendationProposal` artifact:

```ts
interface DecisionRecommendationProposal {
  artifactKind: "DECISION_RECOMMENDATION_PROPOSAL";
  schemaVersion: "DECISION_RECOMMENDATION_PROPOSAL_V1";
  recommendationProposalId: string;
  assessmentProposal: DecisionAssessmentProposal;
  proposedBy: DecisionRecommendationProposalProvenance;
  recommendations: readonly DecisionRecommendation[];
}
```

Each `DecisionRecommendation` has exactly `optionItemId` and `rationale`. The rationale is trimmed, nonempty, and identity-bearing.

### Generator capability and declared provenance

Provenance is exactly `{ origin: "MODEL_PROPOSAL", proposalRef }`; its trimmed `proposalRef` is declared proposal provenance, not generator identity, model authentication, provider authentication, authority, truth, or human preference.

`createBoundDecisionRecommendationProposer(generator)` accepts one exact own enumerable data-method capability, `recommend`, and binds it at construction. Extra properties, symbols, accessors, non-enumerable/missing/non-function methods, arrays, primitives, and `null` reject. Later method replacement cannot redirect the bound proposer, and the generator receiver is preserved. `GENERATOR CAPABILITY != MODEL IDENTITY` and `PROPOSAL PROVENANCE != GENERATOR IDENTITY`.

The proposer captures and sealed-asserts the complete assessment proposal, captures declared `MODEL_PROPOSAL` provenance, invokes the bound capability once with detached predecessor state, defensively captures output, validates targets, rejects duplicate option targets, canonically orders recommendations by option ID, derives `DRECP_`, self-asserts, returns detached state, and stops.

### Target admission and disposition independence

A returned recommendation `optionItemId` must be DCI-shaped and must refer to an option already established by the sealed predecessor chain: it must occur in the embedded human-selected `selectedOptionItemIds` inventory and as an `optionItemId` in at least one embedded Phase 6C assessment relation. Phase 6D does not independently derive or revalidate the OPTION role. `PHASE 6D DCI SHAPE VALIDATION != OPTION ROLE DERIVATION`, `PHASE 6D TARGET ADMISSION != ROLE REVALIDATION`, and `OPTION ROLE IN 6D = INHERITED SEALED PREDECESSOR GUARANTEE`. The contract does not inspect disposition to set a policy: `ALIGNED`, `PARTIALLY_ALIGNED`, `MISALIGNED`, and `UNDETERMINED` are each structurally admissible when both target conditions hold. `DISPOSITION != RECOMMENDATION POLICY`.

### Zero, partial, and multiple semantics

Zero, partial, and multiple recommendations are valid. No relationship is synthesized for an absent recommendation and multiple recommendations are not ranked. `NO RECOMMENDATION != REJECTION`, `MULTIPLE RECOMMENDATIONS != RANKING`, and `RECOMMENDED != BEST != OPTIMAL`.

### Canonical `DRECP_` identity

`recommendationProposalId` has shape `^DRECP_[0-9A-F]{24}$`. It is the uppercase first 24 hexadecimal characters of SHA-256 over:

```ts
[
  "DECISION_RECOMMENDATION_PROPOSAL_V1",
  canonicalCompleteDecisionAssessmentProposal,
  ["MODEL_PROPOSAL", proposedBy.proposalRef],
  canonicalRecommendations,
]
```

The private canonicalizer recursively orders object own string keys by deterministic code-point order, preserves array order, and preserves primitive values. Recommendation input order is non-semantic because Phase 6D canonicalizes recommendations before identity. The complete embedded assessment proposal, `proposalRef`, recommended option, rationale, and recommendation set are identity-bearing. `DRECP IDENTITY != TRUTH != RECOMMENDATION CORRECTNESS != OPTION OPTIMALITY != HUMAN DECISION`.

### Stored assertion

`assertDecisionRecommendationProposal(value)` is self-contained. It may sealed-assert the embedded assessment proposal but invokes no generator, evaluator, reader, repository, persister, lineage API, authority resolver, provider, or model. It requires exact canonical representation and performs no repair: construction may trim/order valid input; assertion never trims, sorts, deduplicates, replaces targets, or synthesizes state. An otherwise exact valid body with a wrong deterministic ID fails `ERR_DECISION_RECOMMENDATION_PROPOSAL_ID_MISMATCH`; hostile, malformed, noncanonical, embedded-invalid, target-invalid, or duplicate state fails `ERR_DECISION_RECOMMENDATION_PROPOSAL_INVALID`.

The owned Phase 6D errors are:

- `ERR_DECISION_RECOMMENDATION_PROPOSAL_GENERATOR_INVALID`
- `ERR_DECISION_RECOMMENDATION_PROPOSAL_ASSESSMENT_PROPOSAL_INVALID`
- `ERR_DECISION_RECOMMENDATION_PROPOSAL_PROVENANCE_INVALID`
- `ERR_DECISION_RECOMMENDATION_PROPOSAL_RECOMMENDATION_INVALID`
- `ERR_DECISION_RECOMMENDATION_PROPOSAL_OPTION_NOT_SELECTED`
- `ERR_DECISION_RECOMMENDATION_PROPOSAL_OPTION_NOT_ASSESSED`
- `ERR_DECISION_RECOMMENDATION_PROPOSAL_DUPLICATE`
- `ERR_DECISION_RECOMMENDATION_PROPOSAL_INVALID`
- `ERR_DECISION_RECOMMENDATION_PROPOSAL_ID_MISMATCH`

## Consequences

### Authority exclusions

Phase 6D permits canonical recommendation proposal state, but not recommendation authority or policy. It does not establish semantic truth, recommendation correctness, human preference, human adoption, human decision, option optimality, provider/model identity, provider authority, decision authority, current revision, current producer authority, persistence authority, action, outcome, feedback, or learning.

`ASSESSMENT PROPOSAL != RECOMMENDATION PROPOSAL`, `ASSESSMENT RELATION != RECOMMENDATION`, `RECOMMENDATION PROPOSAL != DECISION NEED`, `RECOMMENDATION PROPOSAL != HUMAN DECISION`, `RECOMMENDATION PROPOSAL != ACTION`, `RECOMMENDATION PROPOSAL != OUTCOME`, and `RECOMMENDATION PROPOSAL != TRUTH`.

### Explicit non-goals

No score, weight, confidence, probability, priority, rank, winner, best-option, utility, optimization, or persistence contract is introduced. The human-machine loop remains open.

## Evidence

- Focused Phase 6D: 11 / 11 passing.
- Decision Core: 249 / 249 passing from implementation verification before the test-hardening increase, plus focused hardened Phase 6D: 11 / 11 passing.
- Capability Core: 272 / 272 passing.
- Scoped Phase 6D TypeScript using repository compiler semantics: PASS.
- `git diff --check`: PASS.
- 6A / 6B / 6C predecessor diffs: EMPTY.

Repository-wide TypeScript is not claimed clean: unrelated Career/Demo/legacy test type issues remain outside the Phase 6D scope.
