# ADR 021: Semantic assessment proposal

## Status

Implemented and sealed.

Implementation: `448e6a91ccab913e8697f7220c6756853992309a`
`v1.0.0-decision-core-phase6c-assessment-proposal`

## Context

Phase 6B establishes one exact revision-bound assessment basis, but it creates no semantic assessment. A semantic evaluator must not invent the normative axes that it later assesses. The human-selected Phase 6A inventories therefore remain the target-admission boundary.

```text
ASSESSMENT BASIS != ASSESSMENT PROPOSAL
REVISION MEMBERSHIP != HUMAN NORMATIVE SELECTION
```

The adjacent operation must permit bounded model semantic assessment proposal state without becoming ranking, recommendation, Decision Need declaration, human decision, persistence authority, or producer-authority resolution.

## Decision

Phase 6C adds:

```ts
interface DecisionAssessmentProposal {
  artifactKind: "DECISION_ASSESSMENT_PROPOSAL";
  schemaVersion: "DECISION_ASSESSMENT_PROPOSAL_V1";
  assessmentProposalId: string;
  assessmentBasis: DecisionAssessmentBasis;
  proposedBy: DecisionAssessmentProposalProvenance;
  assessments: readonly DecisionAssessmentEvaluation[];
}
```

`createBoundDecisionAssessmentProposer(...)` accepts only one exact own enumerable data-method evaluator capability, `evaluate`, and binds it at construction. The evaluator receives `{ assessmentBasis }`, a detached complete basis. It may return zero or more exact four-field relations: `optionItemId`, `criterionItemId`, one of `ALIGNED`, `PARTIALLY_ALIGNED`, `MISALIGNED`, or `UNDETERMINED`, and a trimmed nonempty rationale.

Only selected options and selected objectives/constraints from the embedded request are admitted. Target pairs are unique and canonicalized by the JSON tuple of option and criterion IDs. Zero and partial relation inventories are valid; no missing relation is synthesized as `UNDETERMINED`.

`DASPR_` is a private complete-state SHA-256 identity over schema version, recursively canonical complete basis, declared `MODEL_PROPOSAL` provenance, and canonical complete assessments. Rationale is identity-bearing. Stored assertion is self-contained, exact, non-repairing, and has the boundary `unknown -> asserts value is DecisionAssessmentProposal`.

The owned errors are `ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATOR_INVALID`, `ERR_DECISION_ASSESSMENT_PROPOSAL_BASIS_INVALID`, `ERR_DECISION_ASSESSMENT_PROPOSAL_PROVENANCE_INVALID`, `ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATION_INVALID`, `ERR_DECISION_ASSESSMENT_PROPOSAL_OPTION_NOT_SELECTED`, `ERR_DECISION_ASSESSMENT_PROPOSAL_CRITERION_NOT_SELECTED`, `ERR_DECISION_ASSESSMENT_PROPOSAL_DUPLICATE`, `ERR_DECISION_ASSESSMENT_PROPOSAL_INVALID`, and `ERR_DECISION_ASSESSMENT_PROPOSAL_ID_MISMATCH`.

## Consequences

Phase 6C permits model semantic assessment proposal state, not a decision operation:

```text
ASSESSMENT != RANKING
ASSESSMENT != RECOMMENDATION
ASSESSMENT != DECISION NEED
ASSESSMENT != HUMAN DECISION
MODEL_PROPOSAL != HUMAN PREFERENCE
MODEL_PROPOSAL != TRUTH
NO ASSESSMENT != UNDETERMINED
```

The artifact neither authenticates a model/provider nor proves semantic correctness, completeness, readiness, authority of record, human preference, or recommendation authority. It does not persist proposals, traverse lineage, select current state, or close the human-machine loop.

Phase 5C2 `EBIND_` rationale is stored but identity-excluded because EBIND identifies an item/state relation-disposition independently of wording. Phase 6C `DASPR_` rationale is identity-bearing because DASPR identifies the complete represented assessment proposal state. The identity rules are deliberately distinct.

## Evidence

- Focused Phase 6C: 13 / 13 passing.
- Decision Core: 240 / 240 passing.
- Capability Core: 272 / 272 passing.
- Scoped TypeScript: PASS.
- `git diff --check`: PASS.
- Sealed predecessor diffs: EMPTY.

The post-implementation double sweep found no production defect. One consolidated adversarial hardening pass added proof coverage without requiring a production change.
