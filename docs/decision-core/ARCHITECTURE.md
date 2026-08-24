# Decision Core architecture

## Scope through Phase 5C1

Decision Core is a generic, producer-neutral module for consuming governed producer state and forming a deterministic structural `DecisionContextDraft`. It is separate from Capability Core. Capability Core publishes capability/evidence-oriented Phase-4 snapshots; Decision Core does not require that ontology and can consume any producer that implements a compatible authority resolver.

The implemented architecture through Phase 5C1 establishes a generic, producer-neutral foundation for constructing structurally defined decision contexts that can reference governed producer state. It does not implement recommendation, assessment, scoring, ranking, human decision, action, outcome, feedback, semantic evidence binding, or a closed human-machine loop.

## Implemented layers

| Layer | Implemented responsibility | Principal contract |
| --- | --- | --- |
| Producer authority | A producer supplies an `AuthoritativeStateResolver` behind a producer-specific contract. | producer adapter/resolver |
| Generic authority consumption (5A) | Bind resolvers once and resolve only opaque state references. | `BoundAuthoritativeStateReader` |
| Context structure (5B) | Canonically construct and structurally assert a pre-validation decision environment. | `DecisionContextDraft` |
| Context authority gate (5C1) | Re-resolve every context source reference at operation time through a bound reader. | `BoundDecisionContextAuthorityValidator` |

The current Capability Core adapter in `lib/decision-adapters/capability-core.ts` is one producer-specific integration. It is not part of the generic Decision Core kernel.

## Forward lifecycle

```text
Capability Core Phase-4 publisher
  -> persisted PHASE4_VERIFIED capability snapshot
  -> Capability Core authority adapter
  -> AuthoritativeStateResolver
  -> BoundAuthoritativeStateReader
  -> AuthoritativeStateResolution (detached reference + resolver-returned opaque payload)

DecisionContextDraft input
  -> deterministic structural capture and assertion
  -> canonical sourceStateReferences
  -> BoundDecisionContextAuthorityValidator
  -> operation-time bound-reader resolution for every reference
  -> exact returned-reference equality
  -> Promise<void>
```

The Capability adapter captures only `getSnapshotByKey` from the supplied repository. For its fixed producer/contract pair it reads by the opaque locator, validates the existing `VerifiedCapabilitySnapshot`, requires `status: "VERIFIED"` and `publication.mode: "PHASE4_VERIFIED"`, recomputes the snapshot key, checks the locator and `snapshotId`, and returns a detached clone. That producer-specific behavior is outside the generic reader.

## State, authority, and semantics

The following distinctions are implemented architectural boundaries:

```text
STATE CONTENT                 != STATE AUTHORITY
REFERENCE                     != AUTHORITY TOKEN
SUCCESSFUL RESOLUTION         != PORTABLE AUTHORITY
AUTHORITATIVE STATE           != SEMANTIC SUPPORT
DECISION CONTEXT              != RECOMMENDATION
RECOMMENDATION                != HUMAN DECISION
HUMAN INPUT                   != EVIDENCE TRUTH
MODEL PROPOSAL                != HUMAN ADOPTION
PERSISTENCE AUTHORITY         != SEMANTIC CORRECTNESS
```

An `AuthoritativeStateReference` names a producer-governed artifact, but carries no payload, repository, resolver, or authority capability. A successful reader resolution describes one operation through one bound dependency; it does not confer portable authority for a later operation. A later authority-dependent operation must resolve again through its own bound reader.

`DecisionContextDraft` is a structural decision environment. It records items, semantic roles, provenance, and source-state references. It does not infer that an item statement is supported, true, contradicted, satisfied, complete, adopted, or recommended.

Phase 5C1 asks only whether each reference carried by the structurally accepted context resolves now through the bound reader. It deliberately does not inspect resolution payload semantics. In particular, a successful Phase-5C1 call proves neither semantic support nor evidence binding for a `DecisionContextItem` statement.

## Trust boundaries

1. **Producer adapter boundary.** Producer-specific persistence and artifact validation stay in adapters/resolvers. The generic kernel has no Capability Core import.
2. **Reader composition boundary.** Resolver registrations are supplied when `createBoundAuthoritativeStateReader(...)` constructs a reader. Resolver identity is the exact pair `producerId + authorityContractId`; duplicate bindings fail.
3. **Reference boundary.** Reader input is an exact four-field data-object capture. It rejects malformed, accessor-backed, extra-key, symbol-keyed, or hostile reference objects before resolver selection.
4. **Context boundary.** `DecisionContextDraft` construction and assertion are structural only. Source references are canonical, unique, and detached; an `AUTHORITATIVE_STATE` item provenance must name one of them.
5. **5C1 operation boundary.** The validator captures the complete supplied context through own data descriptors before asserting it, then resolves detached captured references in canonical order. Mutation of the caller-owned context after validation has begun cannot redirect later calls.

## Reachable structural states

| State | Current status |
| --- | --- |
| One `DECISION_QUESTION`, no source references, options, objectives, or constraints | Structurally valid `DecisionContextDraft`; 5C1 resolves zero references and succeeds. This does not establish completeness. |
| `AUTHORITATIVE_STATE` provenance whose reference is absent from `sourceStateReferences` | Structurally invalid. |
| A structurally valid context whose reference no longer resolves | Structurally valid, but the 5C1 operation fails through the bound reader. |
| A successfully resolved reference with unrelated payload content | Valid 5C1 operation input/result; payload remains semantically uninterpreted. |

## Generic core and producer adapters

The generic `lib/decision-core/**` production files are guarded against imports from Career, Capability Core, matching, recommendations, and legacy Career decision-loop code. The Capability adapter may import Capability Core because it is a producer-specific integration outside that generic kernel.

Decision Core is application-domain neutral, not ontology-free in a metaphysical sense: the current ontology is intentionally about opaque producer state, structural context items, roles, provenance, and operation-time authority reachability. Recruiting is not implemented on top of this module.
