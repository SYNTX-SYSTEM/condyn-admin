# Precanonical Decision / Execution Overlay

## Disposition

Archived from the executable repository graph by the Field 01 architectural
authority decision on 2026-09-22. This is preserved historical source, not a
compatibility layer and not a production authority model.

## Original executable paths

* `lib/career/relation-adapters/decision-authority-persistence/postgres.ts`
* `lib/career/relation-adapters/decision-authority-persistence/postgres-schema.ts`
* `lib/career/relation-adapters/execution-authority-persistence/`
* `lib/career/relation-adapters/execution-context-persistence/`
* `lib/career/relation/execution-authority/`
* `lib/career/relation/execution-context/`
* their execution-authority, execution-context, T5–T11, and role-relation
  composition tests.

## Reason for supersession

The overlay models `DecisionAuthorityRevision`, `DecisionContextRevision`,
`DecisionRecord`, and generic `ExecutionAuthorityRevision`. Those artifacts
are semantically incompatible with the canonical lineage:

`DecisionAuthorityGrantRevision → CareerDecisionContextRevision →
HumanDecisionRecord → CareerDecisionActionIntent → CareerHumanCommitment →
CareerExecutionAuthorityGrantRevision → CareerExecutionContextRevision`.

In particular, generic actor/evidence execution authority cannot be translated
to the canonical commitment-derived grant merely by renaming types. The
canonical artifacts carry exact historical parent lineage, distinct scope
semantics, and explicit non-collapse laws. This archive must not be imported by
production code, canonical tests, startup registration, or the TypeScript
program.

## Consumer classification

The archived test families are superseded-overlay evidence. The former tracked
RoleRelation, TensionState, EvolutionInput, and RecommendationProposal concrete
composition wrappers directly exercised the obsolete trilogy and are archived
rather than migrated, because they did not assert the canonical
Grant/Context/HumanDecision lineage. Canonical consumers must use the existing
Career contracts and their dedicated persistence/replay tests.
