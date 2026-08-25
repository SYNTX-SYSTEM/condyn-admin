# Decision Core architecture

## Scope through Phase 5D2A

Decision Core is a generic, producer-neutral module for consuming governed producer state and forming a deterministic structural `DecisionContextDraft`. It is separate from Capability Core. Capability Core publishes capability/evidence-oriented Phase-4 snapshots; Decision Core does not require that ontology and can consume any producer that implements a compatible authority resolver.

The implemented architecture through Phase 5D2A establishes a generic, producer-neutral foundation for constructing structurally defined decision contexts that can reference governed producer state, separately producing explicit semantic evaluator proposals about item/reference relationships, canonically representing explicit structural comparison targets and caller-supplied item/item relation proposals, deriving deterministic structural gaps and explicit-path basis-relative `StructuralConsequence` artifacts, assembling revalidated derivational coherence, creating self-contained canonical revision artifacts, and persisting them through repository-bound immutable authority semantics. It does not implement recommendation, assessment, scoring, ranking, human decision, action, outcome, feedback, structural contradictions, dependency findings, decision need, relation discovery, durable PostgreSQL persistence, full revision-lineage reconstruction, head selection, or a closed human-machine loop.

## Implemented layers

| Layer | Implemented responsibility | Principal contract |
| --- | --- | --- |
| Producer authority | A producer supplies an `AuthoritativeStateResolver` behind a producer-specific contract. | producer adapter/resolver |
| Generic authority consumption (5A) | Bind resolvers once and resolve only opaque state references. | `BoundAuthoritativeStateReader` |
| Context structure (5B) | Canonically construct and structurally assert a pre-validation decision environment. | `DecisionContextDraft` |
| Context authority gate (5C1) | Re-resolve every context source reference at operation time through a bound reader. | `BoundDecisionContextAuthorityValidator` |
| Semantic evidence binding (5C2) | Re-resolve and isolate every source payload, then produce canonical item/reference semantic proposals. | `BoundSemanticEvidenceBinder` |
| Explicit structural expectation (5C3A) | Canonically represent an explicit structural comparison target associated with one structurally valid context under the sealed Phase-5B contract. | `StructuralExpectation` |
| Explicit structural relation proposal (5C3B) | Canonically represent one caller-supplied structural item/item relation proposal associated with one structurally valid context. | `StructuralRelationProposal` |
| Structural gap reconstruction (5C3C) | Deterministically compare one explicit expectation with one explicit represented observation basis. | `StructuralGap` or `null` |
| Structural consequence propagation (5C3D) | Derive one explicit-path basis-relative consequence from one validated item-anchored gap and one caller-supplied ordered dependency path. | `StructuralConsequence` |
| Validation assembly (5C4) | Canonically assemble revalidated explicit structural derivations for one context. | `DecisionContextValidationAssembly` |
| Immutable revision artifact (5D1) | Canonically capture one self-contained context plus its revalidatable derivation state; it is not persisted authority. | `DecisionContextRevision` |
| Repository-bound immutable persistence authority (5D2A) | The shipped in-memory repository/persister path persists one valid complete revision with immediate-parent integrity, immutable replay/conflict handling, and exact post-write reread. | `DecisionContextRevisionRepository` capability shape; `InMemoryDecisionContextRevisionRepository` enforcement |

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

DecisionContextDraft input
  -> complete structural capture and assertion
  -> Stage A: resolve every canonical reference, verify every returned reference, detach every payload, reject shared memory
  -> Stage B: bound semantic evaluation for each prepared state
  -> canonical SemanticEvidenceBindingProposal[]

DecisionContextDraft input + explicit StructuralExpectationInput
  -> defensive structural capture and assertion against the sealed Phase-5B contract
  -> context item/reference membership checks
  -> canonical expectation body and provenance
  -> deterministic DEXP identity
  -> canonical StructuralExpectation

DecisionContextDraft input + explicit StructuralRelationProposalInput
  -> defensive context/input capture and context structural assertion
  -> item membership and AUTHORITATIVE_STATE provenance-reference membership checks
  -> CONTRADICTION endpoint canonicalization or DEPENDENCY direction preservation
  -> deterministic DREL identity
  -> canonical StructuralRelationProposal

DecisionContextDraft + StructuralExpectation + explicit StructuralGapObservationBasis
  -> defensive context, expectation, and basis validation
  -> expectation-specific structural comparison
  -> null OR canonical StructuralGap

DecisionContextDraft + StructuralExpectation + StructuralGapObservationBasis + StructuralGap
+ explicit StructuralConsequencePropagationBasis
  -> operation-local source-gap revalidation
  -> explicit ordered DEPENDENCY-path validation
  -> canonical StructuralConsequence

DecisionContextDraft + explicit expectation/consequence derivation inputs
  -> operation-local predecessor contract revalidation
  -> canonical expectation results and consequence IDs
  -> DecisionContextValidationAssembly

DecisionContextRevisionInput
  -> one detached operation-local snapshot
  -> sealed DecisionContextDraft and validation-assembly revalidation
  -> canonical validation input and reconstructed canonical assembly
  -> deterministic DREV identity
  -> self-contained DecisionContextRevision

InMemoryDecisionContextRevisionRepository
  -> createDecisionContextRevisionPersister()
  -> bound persist(DecisionContextRevision)
  -> detached capture and sealed 5D1 assertion
  -> immediate parent lookup for a child only
  -> runtime-private immutable write using a detached writer copy
  -> exact post-write repository reread and sealed revision assertion
  -> complete-artifact equality with the pristine expected revision
  -> detached repository-selected DecisionContextRevision
```

The Capability adapter captures only `getSnapshotByKey` from the supplied repository. For its fixed producer/contract pair it reads by the opaque locator, validates the existing `VerifiedCapabilitySnapshot`, requires `status: "VERIFIED"` and `publication.mode: "PHASE4_VERIFIED"`, recomputes the snapshot key, checks the locator and `snapshotId`, and returns a detached clone. That producer-specific behavior is outside the generic reader.

## State, authority, and semantics

The following distinctions are implemented architectural boundaries:

```text
STATE CONTENT                 != STATE AUTHORITY
REFERENCE                     != AUTHORITY TOKEN
SUCCESSFUL RESOLUTION         != PORTABLE AUTHORITY
AUTHORITATIVE STATE           != SEMANTIC SUPPORT
PROVENANCE                    != SEMANTIC SUPPORT
SEMANTIC EVALUATION           != VERIFIED TRUTH
SUPPORTED                     != COMPLETENESS
NOT EXAMINED                  != NOT_SUPPORTED
CONTRADICTED BINDING          != STRUCTURAL CONTRADICTION
SEMANTIC INSPECTION CAPABILITY != PRODUCER MUTATION CAPABILITY
DECISION CONTEXT              != RECOMMENDATION
DECISION CONTEXT              != SEMANTIC BINDING PROPOSAL
RECOMMENDATION                != HUMAN DECISION
HUMAN INPUT                   != EVIDENCE TRUTH
MODEL PROPOSAL                != HUMAN ADOPTION
AUTHORITY OF RECORD           != TRUTH
AUTHORITY OF RECORD           != SEMANTIC CORRECTNESS
AUTHORITY OF RECORD           != CURRENT PRODUCER AUTHORITY
AUTHORITY OF RECORD           != CURRENT DECISION STATE
AUTHORITY OF RECORD           != HEAD
AUTHORITY OF RECORD           != LATEST
AUTHORITY OF RECORD           != ACTIVE
PERSISTED                     != TRUE
PERSISTED                     != CURRENT
OBSERVED STRUCTURE            != EXPECTED STRUCTURE
EXPECTATION                   != FACT
EXPECTATION                   != OBSERVATION
EXPECTATION                   != SATISFACTION
EXPECTATION                   != FINDING
EXPECTATION                   != GAP
EXPECTATION                   != DECISION NEED
EXPECTATION                   != PRIORITY
EXPECTATION                   != RECOMMENDATION
DEPENDENCY EXPECTATION        != DEPENDENCY FINDING
EXPECTATION                   != RELATION PROPOSAL
RELATION PROPOSAL             != RELATION TRUTH
RELATION PROPOSAL             != FINDING
CONTRADICTION PROPOSAL        != FORMAL LOGICAL CONTRADICTION
CONTRADICTION PROPOSAL        != CONTRADICTED SEMANTIC EVIDENCE BINDING
DEPENDENCY PROPOSAL           != DEPENDENCY EXPECTATION
DEPENDENCY PROPOSAL           != DEPENDENCY FINDING
RELATION PROPOSAL             != GAP
RELATION PROPOSAL             != CONSEQUENCE
RELATION PROPOSAL             != DECISION NEED
RELATION PROPOSAL             != PRIORITY
RELATION PROPOSAL             != RECOMMENDATION
RELATION ONTOLOGY             != RELATION DISCOVERY
EXPECTATION / RELATION PROPOSAL != DERIVED GAP
ABSENCE                       != GAP
NO RELATION PROPOSAL          != GAP
GAP                           != REAL-WORLD ABSENCE
GAP                           != GLOBAL INCOMPLETENESS
GAP                           != SEMANTIC TRUTH
GAP                           != DECISION NEED
GAP                           != PRIORITY
GAP                           != CONSEQUENCE
GAP                           != RECOMMENDATION
GAP                           != HUMAN DECISION
DEPENDENCY PROPOSAL           != CONSEQUENCE
VALID DREL PATH               != TRUE DEPENDENCY PATH
STRUCTURAL CONSEQUENCE        != REAL-WORLD EFFECT
STRUCTURAL CONSEQUENCE        != PREDICTION
STRUCTURAL CONSEQUENCE        != OUTCOME
STRUCTURAL CONSEQUENCE        != DECISION NEED
STRUCTURAL CONSEQUENCE        != PRIORITY
STRUCTURAL CONSEQUENCE        != SEVERITY
STRUCTURAL CONSEQUENCE        != RECOMMENDATION
ASSEMBLY                      != TRUTH
ASSEMBLY                      != COMPLETENESS
ASSEMBLY                      != CURRENT AUTHORITY
ASSEMBLY                      != AUTHORITY CERTIFICATE
ASSEMBLY                      != SEMANTIC VERIFICATION
ASSEMBLY                      != DECISION READINESS
ASSEMBLY                      != DECISION NEED
ASSEMBLY                      != PRIORITY
ASSEMBLY                      != SCORE
ASSEMBLY                      != RECOMMENDATION
ASSEMBLY                      != HUMAN DECISION
VALIDATED DERIVATION           != PERSISTED AUTHORITY
REVISION ARTIFACT              != TRUTH
REVISION                       != PERSISTENCE
REVISION                       != PERSISTED AUTHORITY
REVISION                       != CURRENT AUTHORITY
REVISION                       != HEAD
REVISION                       != LATEST
REVISION                       != ACTIVE
REVISION                       != SUPERSEDED
REVISION                       != DECISION READINESS
REVISION                       != DECISION NEED
REVISION                       != RECOMMENDATION
REVISION                       != HUMAN DECISION
PREVIOUS REVISION ID           != PROOF PARENT EXISTS
PREVIOUS REVISION ID           != CAUSATION
PREVIOUS REVISION ID           != SEMANTIC CONTINUITY
PREVIOUS REVISION ID           != HEAD SELECTION
LINEAGE                        != CAUSATION
NO_GAP                        != GLOBAL COMPLETENESS
NO_GAP                        != TRUTH
NO_GAP                        != CURRENT AUTHORITY
NO_GAP                        != DECISION READINESS
NO_GAP                        != DECISION NEED
HASH CONSISTENCY              != DERIVATION VALIDITY
BAD BASIS                     != BAD STORED GAP
BAD EBIND                     != BAD STORED GAP
BAD DREL                      != BAD STORED GAP
NO BINDING                    != GAP
NO BINDING                    != NOT_SUPPORTED
OBJECTIVE                     != AUTOMATIC EXPECTATION
CONSTRAINT                    != AUTOMATIC EXPECTATION
UNCERTAINTY                   != GAP
HUMAN_INPUT EXPECTATION       != EVIDENCE TRUTH
MODEL_PROPOSAL EXPECTATION    != HUMAN REQUIREMENT
```

An `AuthoritativeStateReference` names a producer-governed artifact, but carries no payload, repository, resolver, or authority capability. A successful reader resolution describes one operation through one bound dependency; it does not confer portable authority for a later operation. A later authority-dependent operation must resolve again through its own bound reader.

`DecisionContextDraft` is a structural decision environment. It records items, semantic roles, provenance, and source-state references. It does not infer that an item statement is supported, true, contradicted, satisfied, complete, adopted, or recommended.

Phase 5C1 asks only whether each reference carried by the structurally accepted context resolves now through the bound reader. It deliberately does not inspect resolution payload semantics. In particular, a successful Phase-5C1 call proves neither semantic support nor evidence binding for a `DecisionContextItem` statement.

Phase 5C2 adds `SemanticEvidenceBindingProposal`: one `DecisionContextItem` × one `AuthoritativeStateReference`, with exactly `SUPPORTED`, `PARTIALLY_SUPPORTED`, `NOT_SUPPORTED`, or `CONTRADICTED`. It is semantic evaluator proposal data, not producer authority, verified semantic truth, human adoption, recommendation, decision, completeness proof, validated context, or Phase-5C3 structural finding. `CONTRADICTED` means one state semantically conflicts with one item according to the evaluator; it is not a `Contradiction` artifact.

Phase 5C3A adds `StructuralExpectation`, an explicit comparison target bound by `contextId` to one structurally valid `DecisionContextDraft` under the sealed Phase-5B contract. It can express an `EVIDENCE_BINDING`, `CONTEXT_ROLE`, or `DEPENDENCY` expectation and performs only the structural membership checks required by that contract; it does not evaluate expectation satisfaction against observed role counts, binding inventories, dependency findings, or other relation state. In particular, it does not inspect bindings, count roles, resolve authority, evaluate semantic payloads, establish satisfaction, or produce a Gap, Dependency finding, Contradiction finding, Consequence, Decision Need, or recommendation. `AUTHORITATIVE_STATE` expectation provenance proves only structural presence of its reference in that context's source inventory; it does not prove current authority, semantic truth, or expectation satisfaction.

Phase 5C3B adds `StructuralRelationProposal`, a caller-supplied proposal for one `DecisionContextItem` × one other `DecisionContextItem` relation. Its exact kinds are `CONTRADICTION` and `DEPENDENCY`. A contradiction proposal is symmetric and stores its distinct item IDs in deterministic canonical order; a dependency proposal is directional and preserves `dependentItemId` and `prerequisiteItemId`. Neither kind establishes relation truth, a formal logical contradiction, a Dependency finding, a structural finding, a Gap, a Consequence, a Decision Need, or a recommendation. This slice does not discover, infer, evaluate, or validate relations, and it does not consume semantic binding proposals or structural expectations. `AUTHORITATIVE_STATE` relation provenance proves only structural presence of its reference in that context source inventory; it does not prove current authority or relation truth.

Phase 5C3C adds `StructuralGap` in the adjacent `lib/decision-core/structural-gaps/` module, not in `structural-findings`. A structural gap is one explicit `StructuralExpectation` that is unsatisfied within one explicitly supplied represented observation basis. It is basis-relative: it does not claim real-world absence, global incompleteness, semantic truth, decision need, priority, consequence, recommendation, or human decision. The existing `structural-findings` module continues to own `StructuralExpectation` and `StructuralRelationProposal`; expectation or relation proposal is not itself a derived Gap.

Phase 5C3D adds `StructuralConsequence` in the adjacent `lib/decision-core/structural-consequences/` module, not in `structural-findings` or `structural-gaps`. It represents only that one validated item-anchored structural gap is structurally upstream of another context item along one explicit ordered represented dependency path. It does not establish dependency-path truth, a real-world effect, prediction, outcome, another gap, severity, priority, decision need, or recommendation.

Phase 5C4 adds `DecisionContextValidationAssembly` in the adjacent `lib/decision-core/validation-assembly/` module. It is not an extension of the sealed Phase-5C1 `validation` authority gate: `5C1 AUTHORITY VALIDATION != 5C4 VALIDATION ASSEMBLY`. Phase 5C4 validates derivational coherence, not reality. It leaves `DecisionContextDraft.validationStatus` exactly `"NOT_RUN"`, creates no validated Decision Context, and emits no authority certificate.

Phase 5D1 adds `DecisionContextRevision` in the adjacent `lib/decision-core/revisions/` module. It captures a detached `DecisionContextDraft`, its explicit `DecisionContextValidationAssemblyInput`, and the matching `DecisionContextValidationAssembly` in one self-contained canonical artifact. It revalidates that state locally and leaves the embedded draft's `validationStatus` exactly `"NOT_RUN"`. A DREV artifact alone is neither persistence, current authority, authority of record, a parent-existence proof, head/latest/active selection, semantic truth, nor a decision artifact.

Phase 5D2A adds the adjacent `lib/decision-core/revision-persistence/` module. `DecisionContextRevisionRepository` defines the supported read/factory capability shape, not a universal governance guarantee. The shipped `InMemoryDecisionContextRevisionRepository` write path is `repository -> createDecisionContextRevisionPersister() -> persist(revision)` and exposes no runtime-callable raw writer. A successful operation through that shipped path means that this bound repository selected this exact complete `DecisionContextRevision` as the immutable record for that DREV identity during that operation. This authority of record is not truth, semantic correctness, current producer authority, current decision state, head/latest/active selection, or a recommendation. It validates only the immediate parent for a child and performs no lineage traversal.

## Trust boundaries

1. **Producer adapter boundary.** Producer-specific persistence and artifact validation stay in adapters/resolvers. The generic kernel has no Capability Core import.
2. **Reader composition boundary.** Resolver registrations are supplied when `createBoundAuthoritativeStateReader(...)` constructs a reader. Resolver identity is the exact pair `producerId + authorityContractId`; duplicate bindings fail.
3. **Reference boundary.** Reader input is an exact four-field data-object capture. It rejects malformed, accessor-backed, extra-key, symbol-keyed, or hostile reference objects before resolver selection.
4. **Context boundary.** `DecisionContextDraft` construction and assertion are structural only. Source references are canonical, unique, and detached; an `AUTHORITATIVE_STATE` item provenance must name one of them.
5. **5C1 operation boundary.** The validator captures the complete supplied context through own data descriptors before asserting it, then resolves detached captured references in canonical order. Mutation of the caller-owned context after validation has begun cannot redirect later calls.
6. **5C2 operation boundary.** The binder performs no semantic evaluation until Stage A has resolved every canonical source reference, verified each returned reference, and prepared an isolated payload for each. It captures both reader and evaluator methods with their receivers at construction; later replacement cannot redirect the binder.
7. **Semantic payload boundary.** The Phase-5A reader returns an opaque resolver payload without generically cloning it. Phase 5C2 uses `structuredClone` for its own operation-local evaluator payload and then rejects direct or transitive shared memory, including `SharedArrayBuffer` and views backed by it. This prevents semantic inspection from granting producer-memory mutation capability.
8. **5C3A structural expectation boundary.** Construction and assertion defensively capture the entire context and expectation representation. They perform only structural context membership and deterministic identity work; they do not call a reader, resolver, repository, semantic evaluator, or Phase-5C2 binder.
9. **5C3B structural relation proposal boundary.** Construction and assertion defensively capture the entire context and relation representation. They require context item membership and, for `AUTHORITATIVE_STATE` provenance, source-reference membership only. They do not call a reader, resolver, repository, semantic evaluator, Phase-5C2 binder, or Phase-5C3A expectation API.
10. **5C3C structural gap boundary.** Reconstruction consumes a structurally valid context, expectation, and explicit basis. It validates represented EBIND/DREL proposal artifacts but invokes no reader, resolver, repository, binder, evaluator, detector, or graph traversal. `assertStructuralGap` reconstructs against the exact basis before it accepts a stored gap, so a self-consistent hash cannot make a gap valid under a satisfying basis.
11. **5C3D structural consequence boundary.** Reconstruction revalidates the source gap against the captured context, expectation, and gap basis before validating one caller-supplied ordered dependency path. It performs no graph discovery, authority resolution, semantic evaluation, or relation-truth validation; a valid DREL path remains represented proposal data.
12. **5C4 validation-assembly boundary.** Assembly operation-locally captures one detached snapshot for each derivation occurrence, then revalidates sealed predecessor contracts. The basis used for derivation is the basis committed into the assembly. It calls no authority operation, reader, resolver, repository, payload, binder, or evaluator.
13. **5D1 revision-artifact boundary.** Revision construction and assertion capture one detached operation-local revision state, revalidate its embedded Phase-5B context and Phase-5C4 derivation assembly, and compare detached stored state with reconstructed canonical state. They do not reread caller-owned nested state after capture, call a repository, resolve a parent, re-resolve authority, or select a head.
14. **5D2A bound-persistence boundary.** The shipped in-memory persister captures its repository dependencies at construction and captures one pristine detached expected revision before repository awaits. The runtime-private writer receives a detached copy, then a post-write reread is captured, sealed-asserted, and compared for exact complete-artifact equality with the pristine expected revision. Storage machinery is not a supported raw write capability, and a successful private write alone is not authority of record. Interface conformance alone does not prove a third-party repository implementation preserves this boundary.

## Reachable structural states

| State | Current status |
| --- | --- |
| One `DECISION_QUESTION`, no source references, options, objectives, or constraints | Structurally valid `DecisionContextDraft`; 5C1 resolves zero references and succeeds. This does not establish completeness. |
| `AUTHORITATIVE_STATE` provenance whose reference is absent from `sourceStateReferences` | Structurally invalid. |
| A structurally valid context whose reference no longer resolves | Structurally valid, but the 5C1 operation fails through the bound reader. |
| A successfully resolved reference with unrelated payload content | Valid 5C1 operation input/result; payload remains semantically uninterpreted. |
| A structurally valid context whose evaluator proposes no bindings | Valid 5C2 result. It does not mean `NOT_SUPPORTED`, completeness, incompleteness, support, or a gap. |
| `AUTHORITATIVE_STATE` provenance item with no evaluator proposal | Valid 5C2 result; provenance does not imply `SUPPORTED`. |
| Context has no `OPTION` items and no `CONTEXT_ROLE` expectation | Phase 5C3A derives and represents no Gap. |
| Context has no `OPTION` items and an explicit `CONTEXT_ROLE` expectation with `minimumCount: 1` | A valid expectation exists; 5C3A still produces no Gap or satisfaction result. |
| Objective has zero binding proposals and no `EVIDENCE_BINDING` expectation | Phase 5C3A derives and represents no Gap. |
| Explicit `EVIDENCE_BINDING` expectation exists for an objective | A valid comparison target exists; satisfaction remains unevaluated. |
| Explicit `DEPENDENCY` expectation says A depends on B | A valid expectation exists; no Dependency finding is established. |
| Explicit `CONTRADICTION` proposal between A and B | A valid canonical relation proposal exists; no structural Contradiction finding is established. |
| Explicit `DEPENDENCY` proposal A -> B | A valid directional relation proposal exists; no Dependency finding is established. |
| Both `DEPENDENCY` proposals A -> B and B -> A | Separate artifacts are representable; 5C3B makes no graph-level cycle judgment. |
| No relation proposal | No conclusion that no relation exists. |
| Explicit `CONTEXT_ROLE` expectation below its minimum | A basis-relative `CONTEXT_ROLE` gap is derived from the context's represented items. |
| Explicit `CONTEXT_ROLE` expectation at or above its minimum | `null`; this one expectation derives no gap under this basis, not a global-completeness claim. |
| Explicit `EVIDENCE_BINDING` expectation with zero supplied bindings | A basis-relative gap is derived because that explicit expectation is evaluated against that explicit basis. |
| Explicit `EVIDENCE_BINDING` expectation with an accepted represented binding | `null` for that expectation and basis. |
| Explicit dependency expectation plus an explicit supplied `DEPENDENCY` basis with no exact satisfying directional proposal | A basis-relative `DEPENDENCY` gap is derived from that supplied basis. |
| Explicit dependency expectation plus an explicit supplied `DEPENDENCY` basis containing an exact directional proposal | `null` for that expectation and basis. |
| Explicit dependency expectation plus an explicit supplied `DEPENDENCY` basis containing only the reverse proposal | A basis-relative gap is derived; the reverse proposal ID is retained as relevant observation data but does not satisfy the direction. |
| No explicit expectation | No structural-gap reconstruction occurs; absence alone derives no Gap. |
| Valid item-anchored `EVIDENCE_BINDING` gap plus one explicit dependency proposal whose prerequisite is its subject item | A canonical one-hop basis-relative `StructuralConsequence` is derived. |
| Valid item-anchored gap plus an explicit ordered multi-hop dependency path | A canonical consequence is derived; `affectedItemId` is the final path dependent item. |
| Valid `CONTEXT_ROLE` gap | It has no unique missing item anchor and cannot propagate: `ERR_DECISION_STRUCTURAL_CONSEQUENCE_SOURCE_NOT_ITEM_ANCHORED`. |
| Explicit path contains a `CONTRADICTION`, has broken continuity, repeats an ID/item, or begins away from the source item | Path validation fails; 5C3D does not discover or repair an alternative path. |
| Phase 5C3D is not invoked | No `StructuralConsequence` is derived; no graph-reachability conclusion follows. |
| Phase 5C3D is invoked with an explicit `DEPENDENCY_PATH` whose `relationProposals` array is empty | `ERR_DECISION_STRUCTURAL_CONSEQUENCE_PATH_INVALID`. |
| Empty `expectationValidations` and `consequenceValidations` | A valid empty canonical validation assembly; it is not a completeness proof. |
| Canonical C3C result is `null` and caller supplies `null` | One `NO_GAP` assembly result: no gap under this represented basis, not truth or global satisfaction. |
| Canonical C3C result is a gap and caller supplies its derivation-valid gap | One `GAP` assembly result with canonical `gapId`. |
| One EVIDENCE_BINDING or DEPENDENCY gap ID with two supplied bases differing only in irrelevant observations | The gap ID may remain the same, but the canonical descriptor inventories and `DVASM_` identities differ. For CONTEXT_ROLE, canonical context observations are already committed through `contextId` and the descriptor remains kind-only. |
| Valid consequence without matching assembled GAP source result | `ERR_DECISION_VALIDATION_ASSEMBLY_CONSEQUENCE_SOURCE_MISSING`. |
| Root revision with `previousRevisionId: null` and a valid empty assembly | A valid self-contained canonical `DecisionContextRevision`; it is not persisted or a completeness proof. |
| Child-shaped revision with a syntactically valid `previousRevisionId` | Structurally valid without a parent lookup; 5D1 does not establish that the parent exists. |
| Same context, previous revision ID, and assembly with different identity-excluded EBIND rationale payload | The complete revision payloads may differ while `DREV_` remains the same; 5D1 does not select one state for that identity. |
| Stored revision with noncanonical validation-input ordering | `ERR_DECISION_CONTEXT_REVISION_INVALID`; assertion does not repair the stored body. |
| Root revision persisted through the shipped in-memory bound path | No parent lookup occurs. A successful exact post-write reread establishes repository-selected authority of record for that DREV during that operation; it is not truth, current state, or head selection. |
| Child revision whose requested immediate parent is missing | `ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND`; the child is not written. |
| Child revision whose immediate parent is malformed, invalid, or identity-mismatched | `ERR_DECISION_CONTEXT_REVISION_PARENT_INVALID`; no parent-of-parent lookup occurs and the child is not written. |
| Two children naming one persisted parent | Both children are representable and may persist. Immediate referential integrity does not select a branch, head, latest, or active revision. |
| Child preserves its parent's `contextId` and `assemblyId` | Valid: a new DREV can arise from `previousRevisionId` without a required semantic change. |
| Same DREV and exact complete artifact replayed | Idempotent replay. |
| Same DREV with divergent complete identity-excluded payload | `ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT`; DREV alone is not the complete payload. |
| Private write succeeds but the reread is missing, invalid, wrong-ID, or complete-payload divergent | `ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID`. |

## Generic core and producer adapters

The generic `lib/decision-core/**` production files are guarded against imports from Career, Capability Core, matching, recommendations, and legacy Career decision-loop code. The Capability adapter may import Capability Core because it is a producer-specific integration outside that generic kernel.

Decision Core is application-domain neutral, not ontology-free in a metaphysical sense: the current ontology is intentionally about opaque producer state, structural context items, roles, provenance, operation-time authority reachability, semantic proposals, explicit structural expectations, explicit structural relation proposals, basis-relative structural gaps and explicit-path consequences, derivational-coherence assemblies, self-contained revision artifacts, and repository-bound immutable authority-of-record operations. These are distinct operations and artifacts, not one automatic pipeline. Recruiting is not implemented on top of this module.
