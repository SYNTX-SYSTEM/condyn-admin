# Decision Core phase status

| Phase | Scope | Status | Sealed implementation |
| --- | --- | --- | --- |
| Phase 4 | Capability publication authority | SEALED | `79ad2d15482dbe5eaf477aef44ec72a62093b2b2` / `v1.0.0-capability-core-phase4-authority` |
| Phase 5A | Authoritative State Consumption Boundary | SEALED | `09c699dc053cd10e67cfa4b25fd713ddb2d375fd` / `v1.0.0-decision-core-phase5a-authority` |
| Phase 5B | Decision Context Artifact Contract | SEALED | `9a4631823a3196dd3e74e9fb86259e1c0e033755` / `v1.0.0-decision-core-phase5b-context` |
| Phase 5C1 | Decision Context Authority Gate | SEALED | `47eaf25647dde9a8fc9c2fd4154f4ce405aea9c4` / `v1.0.0-decision-core-phase5c1-authority-gate` |
| Phase 5C2 | Semantic Evidence Binding | SEALED | `5b29b46a16c440de835b87b2579573f7c3465415` / `v1.0.0-decision-core-phase5c2-semantic-binding` |
| Phase 5C3A | Explicit Structural Expectation Contract | SEALED | `a803f504ae56c4eae8a4fc8d5d020a8eb3db86ce` / `v1.0.0-decision-core-phase5c3a-structural-expectation` |

## Planned, not implemented

| Planned phase | Deferred scope |
| --- | --- |
| Phase 5C3B | Structural relation proposals for contradiction and dependency |
| Phase 5C3C | Gap reconstruction against explicit expectations |
| Phase 5C3D | Structural consequence propagation |
| Phase 5C4 | Validation Assembly |
| Phase 5D | Immutable Decision Context Persistence + Revision Lineage |

Recommendation, human decision, action, outcome, feedback, and learning are later conceptual work. They have no implementation status in this checkpoint.

At Phase 5C3A, the bidirectional human-machine loop is not structurally complete. Current code can form a structural context, check operation-time reachability of governed references, produce item/reference semantic evaluator proposals, and represent explicit structural expectations. It does not evaluate expectation satisfaction, derive gaps, structural contradictions, dependency findings, consequences, recommendations, evaluate alternatives, record a human decision, or observe an outcome.
