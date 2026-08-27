# Decision Core phase status

| Phase | Scope | Status | Sealed implementation |
| --- | --- | --- | --- |
| Phase 4 | Capability publication authority | SEALED | `79ad2d15482dbe5eaf477aef44ec72a62093b2b2` / `v1.0.0-capability-core-phase4-authority` |
| Phase 5A | Authoritative State Consumption Boundary | SEALED | `09c699dc053cd10e67cfa4b25fd713ddb2d375fd` / `v1.0.0-decision-core-phase5a-authority` |
| Phase 5B | Decision Context Artifact Contract | SEALED | `9a4631823a3196dd3e74e9fb86259e1c0e033755` / `v1.0.0-decision-core-phase5b-context` |
| Phase 5C1 | Decision Context Authority Gate | SEALED | `47eaf25647dde9a8fc9c2fd4154f4ce405aea9c4` / `v1.0.0-decision-core-phase5c1-authority-gate` |
| Phase 5C2 | Semantic Evidence Binding | SEALED | `5b29b46a16c440de835b87b2579573f7c3465415` / `v1.0.0-decision-core-phase5c2-semantic-binding` |
| Phase 5C3A | Explicit Structural Expectation Contract | SEALED | `a803f504ae56c4eae8a4fc8d5d020a8eb3db86ce` / `v1.0.0-decision-core-phase5c3a-structural-expectation` |
| Phase 5C3B | Explicit Structural Relation Proposal Contract | SEALED | `0fee42a93eaa65fe75fef0cd744ec2d004e8652f` / `v1.0.0-decision-core-phase5c3b-structural-relations` |
| Phase 5C3C | Structural Gap Reconstruction | SEALED | `b0ead38583e43908c7b234543e61afb611119962` / `v1.0.0-decision-core-phase5c3c-structural-gaps` |
| Phase 5C3D | Structural Consequence Propagation | SEALED | `23a907921712b2375a31ecd10f73b0675b9608dc` / `v1.0.0-decision-core-phase5c3d-structural-consequences` |
| Phase 5C4 | Validation Assembly | SEALED | `0a731079bcad003eeb8d81f0f9f24d0f2a066825` / `v1.0.0-decision-core-phase5c4-validation-assembly` |
| Phase 5D1 | Immutable Decision Context Revision Artifact Contract | SEALED | `ebc53d6bc407e9640c8443e820821ec01192e3c8` / `v1.0.0-decision-core-phase5d1-revision-contract` |
| Phase 5D2A | Repository-Bound Immutable Persistence Authority | SEALED | `6e6062f7da9eaa5e549c7d8169be119d05d95df0` / `v1.0.0-decision-core-phase5d2a-persistence-authority` |
| Phase 5D2B | Durable PostgreSQL Persistence Adapter | SEALED IMPLEMENTATION | `96083e677767e21b36b636258abb20ebf293b0fc` / `v1.0.0-decision-core-phase5d2b-postgres-persistence` |
| Phase 5D3 | Read-Only Revision Lineage Reconstruction | SEALED IMPLEMENTATION | `8a886f8bf39c4bd8fb84dc2e863fd02014d1916e` / `v1.0.0-decision-core-phase5d3-lineage-reconstruction` |
| Phase 6A | Human-Owned Assessment Request Contract | SEALED IMPLEMENTATION | `d315fcee7f3e501284072b85650a8a83c85e3b3b` / `v1.0.0-decision-core-phase6a-assessment-request` |
| Phase 6B | Revision-Bound Assessment Basis | SEALED IMPLEMENTATION | `fa891f7b8280e06ca3a1102b7f1bcf477c4475bd` / `v1.0.0-decision-core-phase6b-assessment-basis` |
| Phase 6C | Semantic Assessment Proposal | SEALED IMPLEMENTATION | `448e6a91ccab913e8697f7220c6756853992309a` / `v1.0.0-decision-core-phase6c-assessment-proposal` |
| Phase 6D | Recommendation Proposal | SEALED IMPLEMENTATION | `a8b04a23f0e86f9a289fc5e5250693fc3123e671` / `v1.0.0-decision-core-phase6d-recommendation-proposal` |

**Phase 5C4 sealed-defect audit.** Phase 5C4 remains SEALED with its original implementation identity above. During Phase 5D2B integration, a narrow RED regression independently proved a serialization-order portability defect in stored validation-assembly equality. Commit `96083e677767e21b36b636258abb20ebf293b0fc` contains the targeted correction: object property insertion order is non-semantic under structural equality, while array order remains significant. No 5C4 artifact shape, identity, ontology, public API, or derivation semantics were redesigned. `SEALED DEFECT CORRECTION != ARCHITECTURAL REDESIGN`; see ADR 017.

Phase 6A records one standalone human-declared normative assessment frame through a DREV-shaped revision reference and DCI-shaped selections. Phase 6B binds one sealed request to one exact reader-returned sealed revision, verifies referenced item membership and declared roles, and returns one detached deterministic `DecisionAssessmentBasis`. Phase 6C consumes one sealed basis through one bound semantic assessment evaluator and admits zero or more selected option/criterion relations into one detached canonical `DecisionAssessmentProposal`. Phase 6D consumes one sealed assessment proposal through one bound generic semantic recommendation capability and admits zero or more selected, assessment-represented option recommendations into one detached canonical `DecisionRecommendationProposal` carrying declared `MODEL_PROPOSAL` provenance.

Semantic assessment proposal and recommendation proposal are implemented. Decision Need, human decision, action, outcome, feedback, and learning remain later conceptual work.

At Phase 6D, the bidirectional human-machine loop remains open. Current code can form a structural context, check operation-time reachability of governed references where explicitly invoked, produce item/reference semantic evaluator proposals, represent explicit structural expectations and item/item relation proposals, derive basis-relative structural gaps and explicit-path structural consequences, assemble revalidated derivational coherence for one context, create a self-contained canonical `DecisionContextRevision`, establish repository-bound immutable authority semantics, durably persist those records in PostgreSQL across repository/client reconstruction, reconstruct one explicit root-to-start predecessor lineage through a bound read capability, record one detached human-declared assessment request, bind that request to one exact sealed revision with item membership/role checks, consume one sealed basis through one bound semantic assessment evaluator, admit zero or more selected option/criterion assessment relations into a canonical `DecisionAssessmentProposal`, and admit zero or more selected, assessment-represented option recommendations into a canonical `DecisionRecommendationProposal`. It does not derive Decision Need, rank, score, prioritize, establish recommendation correctness, record a human decision, record action, observe an outcome, process feedback, learn, select a current/head/latest revision, or complete a bidirectional human-machine loop.

## Phase 6A implementation evidence

- Focused Phase 6A: 13 / 13 passing.
- Decision Core: 211 / 211 passing.
- Capability Core: 272 / 272 passing.
- Scoped TypeScript: PASS.
- `git diff --check`: PASS.
- Sealed Phase-5 predecessor diffs: EMPTY.

Repository-wide TypeScript is not claimed clean: unrelated Career/UI/test type issues remain outside the Phase 6A scope.

## Phase 6B implementation evidence

- Focused Phase 6B: 16 / 16 passing.
- Decision Core: 227 / 227 passing.
- Capability Core: 272 / 272 passing.
- Scoped TypeScript: PASS.
- `git diff --check`: PASS.
- Sealed predecessor diffs: EMPTY.

Repository-wide TypeScript is not claimed clean: unrelated Career/UI/test type issues remain outside the Phase 6B scope.

## Phase 6C implementation evidence

- Focused Phase 6C: 13 / 13 passing.
- Decision Core: 240 / 240 passing.
- Capability Core: 272 / 272 passing.
- Scoped TypeScript: PASS.
- `git diff --check`: PASS.
- Sealed predecessor diffs: EMPTY.

The post-implementation double sweep and consolidated adversarial hardening found no production defect. Additional tests hardened object-order identity, unselected constraints, hostile provenance, stored-target validity, evaluator-output detachment, exact malformed-target error ownership, and stored provenance hostility; no production source change was required during hardening.

Repository-wide TypeScript is not claimed clean: unrelated Career/UI/test type issues remain outside the Phase 6C scope.

## Phase 6D implementation evidence

- Focused Phase 6D: 11 / 11 passing.
- Decision Core: 249 / 249 passing from implementation verification before the test-hardening increase, plus focused hardened Phase 6D: 11 / 11 passing.
- Capability Core: 272 / 272 passing.
- Scoped Phase 6D TypeScript using repository compiler semantics: PASS.
- `git diff --check`: PASS.
- 6A / 6B / 6C predecessor diffs: EMPTY.

Repository-wide TypeScript is not claimed clean: unrelated Career/Demo/legacy test type issues remain outside the Phase 6D scope.
