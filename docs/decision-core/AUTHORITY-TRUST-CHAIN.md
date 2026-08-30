# Decision Core authority trust chain

## Scope

### Phase 8D10 operation-relative persistence authority

For a conforming sealed 5D2A persister, 8D10 represents operation-relative repository-selected authority of record for one exact complete child revision. PERSISTER INTERFACE CONFORMANCE != 5D2A GOVERNANCE GUARANTEE. AUTHORITY OF RECORD != AUTHORITY OF REALITY. AUTHORITY OF RECORD != TRUTH. AUTHORITY OF RECORD != SEMANTIC CORRECTNESS. AUTHORITY OF RECORD != VALIDATION COMPLETENESS. AUTHORITY OF RECORD != CURRENT PRODUCER AUTHORITY. AUTHORITY OF RECORD != CURRENT DECISION STATE.

STORED PERSISTENCE ARTIFACT != FRESH REPOSITORY READ. STORED ASSERTION != REPOSITORY REREAD. STORED ASSERTION != CURRENT REPOSITORY PROOF. STORED ARTIFACT EXISTENCE != CURRENT RECORD EXISTENCE PROOF. STORED ARTIFACT EXISTENCE != CURRENT AUTHORITY PROOF. PERSISTED REVISION != CURRENT REVISION. PERSISTED REVISION != HEAD REVISION. PERSISTED REVISION != LATEST REVISION. PERSISTENCE SUCCESS != LOOP CLOSED. PERSISTED != TRUE.

### Phase 8D9 detached child revision creation

Phase 8D9 deterministically constructs one self-contained child `DecisionContextRevision` from the retained 8D8 transitioned Context, explicit validation input, and derivationally coherent assembly. It names the exact retained bound base revision ID as `previousRevisionId`, but does not look up that parent through a repository.

PREVIOUS REVISION ID != PERSISTED PARENT PROOF. PREVIOUS REVISION ID != REPOSITORY PARENT EXISTENCE PROOF. BOUND BASE REVISION != PERSISTED PARENT RECORD. REVISION CREATION != REPOSITORY LINEAGE VALIDATION. PREDECESSOR REFERENCE != BRANCH SELECTION POLICY. LINEAGE INTEGRITY != BRANCH SELECTION POLICY.

The operation creates no persistence or authority state. REVISION CREATION != PERSISTENCE. REVISION EXISTENCE != PERSISTED REVISION. NEW REVISION != PERSISTED REVISION. REVISION CREATION != PERSISTENCE AUTHORITY. REVISION CREATION != AUTHORITY OF RECORD. DREV ID != PERSISTENCE PROOF. DREV ID != AUTHORITY OF RECORD. NEW REVISION != CURRENT REVISION. NEW REVISION != HEAD REVISION. NEW REVISION != LATEST REVISION. NEW REVISION != ACTIVE REVISION. NEW REVISION != SELECTED REVISION.

Revision existence does not establish truth, correctness, completeness, decision readiness, human decision, or causation. The embedded transitioned Context remains `validationStatus: NOT_RUN`: REVISION EXISTENCE != VALIDATED CONTEXT. REVISION CREATION != VALIDATION_STATUS CHANGE. PERSISTED != TRUE. REVISION CREATION != LOOP CLOSED.

### Phase 8D8 explicit new-Context derivational assembly

Phase 8D8 accepts a sealed Context transition and explicit validation input, then reassembles derivational coherence only against exactly `transition.context`. The Context remains `validationStatus: NOT_RUN`. VALIDATION ASSEMBLY EXISTENCE != CONTEXT VALIDATION STATUS. ASSEMBLY SUCCESS != VALIDATION_STATUS CHANGE. ASSEMBLY SUCCESS != VALIDATED CONTEXT.

It does not carry forward base revision validation state. BASE REVISION VALIDATION != NEW CONTEXT VALIDATION. BASE VALIDATION INPUT != AUTOMATIC NEW VALIDATION INPUT. BASE VALIDATION ASSEMBLY != NEW CONTEXT VALIDATION ASSEMBLY. VALIDATION INPUT REUSE != VALIDATION STATE CARRY-FORWARD. OLD DERIVATION != NEW CONTEXT DERIVATION. A caller may explicitly resubmit old input, but it is reconstructed against the new Context and may fail under existing precise derivation rules.

VALIDATION ASSEMBLY != TRUTH. VALIDATION ASSEMBLY != COMPLETENESS. VALIDATION ASSEMBLY != CURRENT AUTHORITY. VALIDATION ASSEMBLY != SEMANTIC VERIFICATION. VALIDATION ASSEMBLY != DECISION READINESS. VALIDATION ASSEMBLY != AUTHORITY VALIDATION. VALIDATION ASSEMBLY != SOURCE AUTHORITY. No authority validator or bound authority reader is invoked. AUTHORITY RESOLUTION SUCCESS != REUSABLE AUTHORITY ARTIFACT. SOURCE REFERENCE MEMBERSHIP != CURRENT AUTHORITY. No source payload, freshness, or external authentication operation occurs.

VALIDATION ASSEMBLY != REVISION. VALIDATION ASSEMBLY != REVISION CREATION. VALIDATION ASSEMBLY != REVISION TRANSITION. VALIDATION ASSEMBLY != PERSISTENCE. VALIDATION ASSEMBLY != PERSISTENCE AUTHORITY. VALIDATION ASSEMBLY != LOOP CLOSED. PERSISTED != TRUE.

### Phase 8D7 Context transition

Phase 8D7 constructs one new detached `DecisionContextDraft` from the complete bound base Context and one complete sealed materialized `OBSERVATION` item. Its one-item delta establishes membership only in that represented new Context. ITEM EXISTENCE != CONTEXT MEMBERSHIP. MATERIALIZATION != CONTEXT MEMBERSHIP. CONTEXT MEMBERSHIP REQUIRES CONTEXT REPRESENTATION. CONTEXT MEMBERSHIP != REVISION MEMBERSHIP.

The carried-forward source inventory is structural state only. CONTEXT TRANSITION != SOURCE REFERENCE ADMISSION. CONTEXT TRANSITION != SOURCE AUTHORITY RESOLUTION. CONTEXT TRANSITION != SOURCE AUTHENTICATION. SOURCE INVENTORY CARRIED FORWARD != EXTERNAL AUTHORITY. Phase 8D7 neither resolves nor authenticates a source, fetches a payload, validates freshness, or establishes truth or support.

The result Context is `validationStatus: NOT_RUN`; base revision validation and validation assembly do not transfer. BASE REVISION VALIDATION != NEW CONTEXT VALIDATION. BASE VALIDATION ASSEMBLY != NEW CONTEXT VALIDATION ASSEMBLY. CONTEXT MEMBERSHIP != VALIDATED REVISION STATE. NEW CONTEXT != VALIDATED REVISION.

No revision is created, selected, made current, or persisted. CONTEXT TRANSITION != REVISION TRANSITION. CONTEXT TRANSITION != REVISION CREATION. CONTEXT TRANSITION != PERSISTENCE. CONTEXT TRANSITION != PERSISTENCE AUTHORITY. NEW CONTEXT != NEW REVISION. NEW CONTEXT != CURRENT CONTEXT. NEW CONTEXT != HEAD CONTEXT. NEW CONTEXT != LATEST CONTEXT. CONTEXT MEMBERSHIP != LOOP CLOSED.

Membership changes no epistemic status: NEW CONTEXT != OBSERVATION TRUTH. NEW CONTEXT != SEMANTIC SUPPORT. NEW CONTEXT != CAUSATION. CONTEXT MEMBERSHIP != HUMAN DECISION. MODEL_PROPOSAL != FACT. AUTHORITATIVE_STATE PROVENANCE != SOURCE TRUTH. HUMAN_INPUT PROVENANCE != VERIFIED FACT. PERSISTED != TRUE.

### Phase 8D6 standalone item materialization

Phase 8D6 derives one exact standalone `DecisionContextItem` representation from one sealed `DecisionContextObservationMaterializationReadiness`. The item carries the readiness candidate ID and exact projected `OBSERVATION` role, statement, and provenance. Materialization mechanism and statement provenance are separate: HUMAN_INPUT remains HUMAN_INPUT; MODEL_PROPOSAL remains MODEL_PROPOSAL; AUTHORITATIVE_STATE remains AUTHORITATIVE_STATE. MODEL_PROPOSAL != FACT.

MATERIALIZATION != OBSERVATION TRUTH. MATERIALIZATION != OBSERVED REALITY. MATERIALIZATION != OUTCOME TRUTH. MATERIALIZATION != SEMANTIC SUPPORT. MATERIALIZATION != CAUSATION. MATERIALIZATION != HUMAN DECISION. MATERIALIZED OBSERVATION != TRUE OBSERVATION. AUTHORITATIVE_STATE PROVENANCE != SOURCE TRUTH. SOURCE INVENTORY MEMBERSHIP != EXTERNAL AUTHORITY. MODEL_PROPOSAL PROVENANCE != MODEL FACT. HUMAN_INPUT PROVENANCE != VERIFIED FACT. PERSISTED != TRUE.

It performs no reader or authority-resolution operation and creates no Context membership, Context mutation, revision, or persistence state. MATERIALIZATION != ITEM MEMBERSHIP. MATERIALIZATION != CONTEXT MEMBERSHIP. MATERIALIZATION != PERSISTENCE AUTHORITY. MATERIALIZATION != LOOP CLOSED.

### Phase 8D5 structural materialization readiness

Phase 8D5 consumes one sealed `DecisionContextObservationTargetRevisionBinding` and establishes only positive structural readiness relative to its bound base revision. EXACT REVISION BINDING != MATERIALIZATION READINESS. For `AUTHORITATIVE_STATE`, the exact projected reference must already appear in the bound base Context's `sourceStateReferences`; `HUMAN_INPUT` and `MODEL_PROPOSAL` have no added inventory requirement. SOURCE REFERENCE PRESENT != SOURCE AUTHORITY RESOLVED. SOURCE REFERENCE PRESENT != SOURCE AUTHENTICATED. SOURCE REFERENCE PRESENT != SOURCE CURRENT. SOURCE REFERENCE PRESENT != SOURCE TRUE. SOURCE REFERENCE PRESENT != SEMANTIC SUPPORT. SOURCE REFERENCE PRESENT != CAUSATION. SOURCE STATE INVENTORY MEMBERSHIP != EXTERNAL AUTHORITY.

Phase 8D5 does not resolve the reference, fetch source payload, authenticate source identity, verify freshness, verify truth, verify semantic support, or establish causation. Its other structural condition is candidate-item absence: an already-present candidate ID is not return-path materialization or loop closure, and an absent ID is not semantic novelty, truth, or priority. READINESS != MATERIALIZATION. READINESS != PERSISTENCE AUTHORITY. READINESS != OBSERVATION TRUTH. READINESS != OUTCOME TRUTH. READINESS != SEMANTIC SUPPORT. READINESS != CAUSATION. READINESS != HUMAN DECISION. PERSISTED != TRUE.

### Phase 8D4B reader-backed exact binding

Phase 8D4B binds one sealed `DecisionContextObservationTargetDeclaration` to one complete valid reader-returned `DecisionContextRevision` only through the explicit bound read. The reader capability is not a repository proof: `READER RETURN != PERSISTENCE PROOF`; `REVISION BINDING != PERSISTENCE AUTHORITY`; `REVISION BINDING != AUTHORITY OF RECORD`; `REVISION BINDING != CURRENT REVISION`; `REVISION BINDING != HEAD REVISION`; `REVISION BINDING != LATEST REVISION`; `REVISION BINDING != ACTIVE REVISION`; `REVISION BINDING != REVISION SELECTION`; `REVISION BINDING != MUTATION DESTINATION`; `REVISION BINDING != FUTURE REVISION`.

The returned revision is base state, not a mutation destination: `TARGET REVISION BOUND != OBSERVATION MATERIALIZED`; `REVISION BINDING != MATERIALIZATION`; `REVISION BINDING != MATERIALIZATION READINESS`; `REVISION BINDING != DECISION CONTEXT ITEM`; `REVISION BINDING != ITEM MEMBERSHIP`; `REVISION BINDING != CONTEXT MEMBERSHIP`; `REVISION BINDING != CONTEXT MUTATION`; `REVISION BINDING != REVISION MUTATION`; `REVISION BINDING != REVISION CREATION`; `REVISION BINDING != REVISION TRANSITION`; `REVISION BINDING != LOOP CLOSED`.

`AUTHORITATIVE REFERENCE CARRIED BY DCOIP != REFERENCE PRESENT IN BOUND REVISION CONTEXT`; `REVISION BINDING != SOURCE STATE REFERENCE ADMISSION`; `REVISION BINDING != SOURCE STATE INVENTORY MEMBERSHIP`; `BOUND REVISION != MATERIALIZATION READINESS`. Phase 8D4B does not resolve the projected `AUTHORITATIVE_STATE` reference against, compare it for membership with, admit it to, or require its presence in the returned revision's `sourceStateReferences`. Generic `DecisionContextRevision` structural validation still validates the returned revision representation. `REVISION BINDING != OBSERVATION TRUTH`; `REVISION BINDING != OBSERVED REALITY`; `REVISION BINDING != OUTCOME TRUTH`; `REVISION BINDING != SEMANTIC SUPPORT`; `REVISION BINDING != CAUSATION`; `REVISION BINDING != HUMAN DECISION`; `PERSISTED != TRUE`.

This walkthrough describes authority, structural checks, semantic evaluator proposal binding, explicit structural comparison targets, explicit structural relation proposals, basis-relative structural gap reconstruction, explicit-path structural consequence propagation, derivational-coherence validation assembly, self-contained revision artifacts, repository-bound immutable persistence authority, its durable PostgreSQL adapter, read-only explicit predecessor-lineage reconstruction, the Phase 6A human-owned assessment-request contract, the Phase 6B revision-bound assessment-basis contract, the Phase 6C semantic assessment-proposal contract, the Phase 6D recommendation-proposal contract, the Phase 6E proposal-coherence validation contract, the Phase 7A human-decision declaration contract, the Phase 8A1 decision-bound action-intent contract, the Phase 8A2 human-commitment contract, the Phase 8B standalone action-occurrence-claim contract, the Phase 8C1 standalone state-change-claim contract, the Phase 8C2 action-state-change-association-proposal contract, the Phase 8C3 outcome-attribution-proposal contract, the Phase 8D1 Decision Context observation-proposal contract, the Phase 8D2 Decision Context observation-admission declaration contract, the Phase 8D3 Decision Context observation-item-projection contract, and the Phase 8D4A Decision Context observation-target declaration contract. Phase 8B records source-attributed represented claim state without establishing action occurrence fact, semantic support, authority of reality, or persistence authority. Phase 8C1 records source-attributed represented claim state without establishing state-change fact, verified change, semantic state-change support, authority of reality, or persistence authority. Phase 8C2 records an explicit provenance-attributed association proposal over two sealed claims without establishing relation truth, semantic support, authority of reality, or persistence authority. Phase 8C3 records an explicit provenance-attributed outcome-attribution proposal over one sealed association proposal without establishing outcome truth, relation truth, causation, semantic support, authority of reality, or persistence authority. Phase 8D1 records an explicit provenance-attributed opaque statement as an `OBSERVATION`-role candidate for a future Decision Context without establishing observation truth, outcome truth, support, admission, revision, authority of reality, or persistence authority. Phase 8D2 records one positive declared human admission of one sealed observation proposal as eligible for future `OBSERVATION`-role materialization without establishing materialization, Context mutation, revision, truth, support, causation, authentication, authorization, authority of reality, or persistence authority. Phase 8D3 deterministically projects one sealed admission declaration into exact future `OBSERVATION`-item input semantics without establishing item existence, Context membership, materialization, Context mutation, revision, truth, support, causation, authority of reality, or persistence authority. Phase 8D4A records one declared human target declaration over one sealed observation item projection and a DREV-shaped base-state reference without establishing revision existence, target binding, current/head/latest state, materialization readiness, Context membership, revision creation, truth, support, causation, authority of reality, or persistence authority.

## Phase 5A: generic producer authority consumption

```text
producer-governed authority source
  -> producer-specific AuthoritativeStateResolver
  -> BoundAuthoritativeStateReader
  -> AuthoritativeStateReference
  -> operation-time resolution
  -> AuthoritativeStateResolution
  -> detached reference + resolver-returned opaque payload
```

`createBoundAuthoritativeStateReader(resolvers)` validates each resolver registration and captures `resolver.resolve.bind(resolver)` once. It maps the exact binding pair:

```text
producerId + authorityContractId
```

to that bound method. Per-call input is only an exact, detached four-field `AuthoritativeStateReference`. The reader chooses the already-bound resolver, awaits it, then returns a new detached reference together with the resolver-returned opaque payload. The generic reader does not clone that payload.

The payload may have any producer-defined shape. The generic reader does not interpret it. A successful `AuthoritativeStateResolution` describes one successful operation; it does not confer authority for any later operation.

## Capability Core producer integration

Capability Core is a producer, not a dependency of generic Decision Core. `createCapabilityCoreAuthoritativeStateResolver(repository)` belongs in `lib/decision-adapters/capability-core.ts` and binds the repository's `getSnapshotByKey` read method once.

The current Capability Core integration is specifically:

```text
persisted Phase-4 VerifiedCapabilitySnapshot
  -> Capability Core AuthoritativeStateResolver
  -> generic Decision Core authority boundary
```

For the adapter's fixed producer/authority values, it performs:

```text
opaque reference locator
  -> repository.getSnapshotByKey(locator)
  -> persisted snapshot exists
  -> assertVerifiedCapabilitySnapshot(snapshot)
  -> snapshot.status == VERIFIED
  -> snapshot.publication.mode == PHASE4_VERIFIED
  -> computeSnapshotKey(snapshot) == reference.locator
  -> snapshot.snapshotId == reference.artifactId
  -> structuredClone(snapshot)
```

This uses existing Capability Core snapshot validation and identity mechanisms. It does not infer authority from an ID prefix, TypeScript type, or publication metadata alone. Its authority is relative to the repository read capability captured when that adapter resolver was created.

## Phase 5B: structural context boundary

`createDecisionContextDraft(...)` produces a detached canonical draft with `validationStatus: "NOT_RUN"`. It captures exact data properties, canonicalizes its references/items, derives IDs, and verifies the result structurally. The draft contains references only; it does not contain resolved payloads, repositories, resolvers, reader instances, authority capabilities, or resolution results.

Structural success means the context shape, identity, ordering, question count, and provenance-reference membership are valid. It does not mean listed references resolve now and does not make item statements semantically supported.

## Phase 5C1: current-authority reachability gate

```text
DecisionContextDraft supplied to validate(...)
  -> complete detached data-property capture
  -> assertDecisionContextDraft(captured context)
  -> captured canonical sourceStateReferences
  -> one bound-reader call per reference, in canonical order
  -> detached returned resolution reference capture
  -> exact equality with requested reference
  -> Promise<void>
```

`createBoundDecisionContextAuthorityValidator(reader)` captures `reader.resolve.bind(reader)` at construction. `validate(context)` first recursively captures the entire caller-supplied context. The capture accepts only data values, dense arrays, and enumerable own data properties; it rejects accessors, symbols, hidden/custom array state, cycles, malformed values, and reflection failures with `ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID`.

The validator then calls the sealed Phase-5B `assertDecisionContextDraft` on the detached capture. Only after that assertion succeeds does it iterate the captured `sourceStateReferences`. Each requested reference is copied again before the bound reader sees it. Because the references are captured before any `await`, caller mutation after validation begins cannot change later resolver calls.

For each reader result, 5C1 captures only `resolution.reference`, requires it to be a valid four-field reference, and compares all four fields with the requested reference. A malformed or different returned reference fails `ERR_DECISION_CONTEXT_AUTHORITY_REFERENCE_MISMATCH`.

## What the gate does not do

```text
NO PAYLOAD SEMANTIC INSPECTION
NO EVIDENCE SUPPORT CLAIM
NO CONTRADICTION CLAIM
NO GAP CLAIM
NO AUTHORITY TOKEN
NO VALIDATED CONTEXT ARTIFACT
NO PERSISTENCE IN 5C1
```

Payload is deliberately ignored after resolution. 5C1 neither hashes, stores, returns, compares, or semantically interprets it. An empty `sourceStateReferences` inventory resolves zero references and succeeds. That success does not mean the context is complete.

## Phase 5C2: semantic evidence binding

`createBoundSemanticEvidenceBinder(reader, evaluator)` captures `reader.resolve.bind(reader)` and `evaluator.evaluate.bind(evaluator)` once at construction. A caller supplies only a `DecisionContextDraft` to `bind(context)`; it cannot supply a historic 5C1 result, resolution, payload, reader, resolver, repository, evaluator, or producer/repository write capability.

The current operation order is deliberately two-stage:

```text
DecisionContextDraft supplied to bind(...)
  -> recursively capture complete caller data through descriptors
  -> assertDecisionContextDraft(captured context)
  -> capture canonical source references and items

STAGE A: COMPLETE OPERATION-TIME AUTHORITY + PAYLOAD ISOLATION
  -> resolve every source reference in canonical order through the bound reader
  -> capture each returned resolution envelope
  -> reject malformed returned authority resolution envelopes/references and require every returned reference exactly equals its request
  -> structuredClone every resolver-returned payload
  -> recursively reject SharedArrayBuffer, SharedArrayBuffer-backed views, and nested shared memory
  -> prepare every isolated state input

STAGE B: SEMANTIC EVALUATION
  -> invoke the bound evaluator once for each prepared state
  -> pass detached context items, detached reference, and isolated opaque payload
  -> capture and validate zero or more evaluator proposals
  -> require known item IDs and the same listed state reference
  -> reject duplicate item/reference targets
  -> construct EBIND identities, sort canonically, return detached proposals
```

Stage B does not start unless all Stage-A references have resolved, matched, and produced safe semantic payloads. Therefore a later resolution or payload-isolation failure invokes the evaluator zero times. This is operation-local preparation only; the binder neither persists it nor returns a reusable authority certificate.

### Payload isolation

Phase 5A remains unchanged: `AuthoritativeStateResolution` carries a detached reference and the resolver-returned opaque payload, but the generic reader does not clone arbitrary payloads. Phase 5C2 establishes a separate operation-local semantic payload boundary before evaluation. It uses `structuredClone`, then recursively inspects the clone with cycle protection.

`structuredClone` alone is not sufficient: `SharedArrayBuffer` can survive cloning while retaining shared mutable memory. Phase 5C2 rejects direct or transitive `SharedArrayBuffer`, typed-array/DataView views backed by it, and such values nested in arrays, ordinary objects, `Map`, or `Set`. A non-detachable or shared-memory payload fails `ERR_DECISION_EVIDENCE_BINDING_PAYLOAD_NOT_DETACHABLE`; the evaluator receives no call. The reason is exact:

```text
SEMANTIC INSPECTION CAPABILITY != PRODUCER MUTATION CAPABILITY
```

The evaluator receives `SemanticEvidenceEvaluationInput` containing `contextId`, detached captured context items exposed through a readonly array type, one detached state reference, and the isolated opaque payload. The readonly array type does not claim deep runtime immutability. The evaluator receives no producer authority, repository, resolver, reader, producer-state write capability, or human decision state. It may mutate its operation-local detached payload without mutating the resolver-owned payload. Evaluator output is semantic proposal data only.

### Binding semantics

Each `SemanticEvidenceBindingProposal` represents one `DecisionContextItem` × one `AuthoritativeStateReference` and has exactly one disposition:

```text
SUPPORTED
PARTIALLY_SUPPORTED
NOT_SUPPORTED
CONTRADICTED
```

The evaluator may return `[]`. The binder does not synthesize `NOT_SUPPORTED`; therefore no binding is not `NOT_SUPPORTED`, and zero bindings establish neither support, completeness, incompleteness, nor a gap.

Provenance and support remain separate axes. `AUTHORITATIVE_STATE` provenance is not automatically `SUPPORTED`; `HUMAN_INPUT` may be `SUPPORTED`; `MODEL_PROPOSAL` may be `CONTRADICTED`. Provenance answers where the item came from. Binding answers how this one state semantically relates to the item according to the evaluator proposal.

`CONTRADICTED` means one authoritative state semantically conflicts with one item statement according to the semantic evaluator. It is not the later Phase-5C3 structural `Contradiction` concept and does not create such an artifact.

### `EBIND_` identity

```ts
EBIND_ + SHA256(JSON.stringify([
  "SEMANTIC_EVIDENCE_BINDING_V1",
  contextId,
  itemId,
  [producerId, authorityContractId, artifactId, locator],
  disposition
])).slice(0, 24).toUpperCase()
```

The SHA-256 is the implementation hash over `JSON.stringify(...)`; the first 24 hex characters are uppercased. Rationale is trimmed for returned canonical proposal content but is excluded from identity. Different rationale wording preserves the same ID for the same relation/disposition; a different disposition changes it. No provider/model/request metadata, timestamp, randomness, or execution order participates.

## Phase 5C3A: explicit structural expectation

Phase 5C3A is not a new authority-resolution stage and does not consume a prior Phase-5C1 success as authority. It consumes a structurally valid `DecisionContextDraft` under the sealed Phase-5B contract and an explicit expectation input. It does not invoke the Phase-5C2 binder.

Its operation is: capture the supplied context, assert it against the sealed Phase-5B contract, capture explicit expectation input, check context item and source-reference membership, form canonical expectation body and provenance, derive deterministic `DEXP_` identity, construct a canonical `StructuralExpectation`, assert it, and return a detached clone.

No reader, resolver, repository, producer state, payload, or semantic evaluator call occurs. `AUTHORITATIVE_STATE` provenance is checked only for structural membership in the captured context source inventory; it establishes neither current authority reachability nor expectation satisfaction.

The three exact expectation kinds are `EVIDENCE_BINDING`, `CONTEXT_ROLE`, and `DEPENDENCY`. An evidence-binding expectation does not inspect binding proposals; a context-role expectation does not count items; and a dependency expectation does not establish a Dependency finding. Each is an explicit future comparison target only.

For `EVIDENCE_BINDING`, construction accepts selected valid dispositions in any order and stores them in sealed order: `SUPPORTED`, `PARTIALLY_SUPPORTED`, `NOT_SUPPORTED`, `CONTRADICTED`.

Assertion is stricter: it captures the submitted artifact representation and requires the stored disposition order already to be canonical. It does not silently sort, repair, or normalize a stored artifact. A reordered stored representation fails `ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID` even when its deterministic ID remains unchanged.

## Phase 5C3B: explicit structural relation proposal

Phase 5C3B is not a new authority-resolution stage. It does not consume a prior Phase-5C1 success, Phase-5C2 binding output, or a `StructuralExpectation`. It consumes a structurally valid `DecisionContextDraft` under the sealed Phase-5B contract and one explicit relation proposal input.

```text
DecisionContextDraft + StructuralRelationProposalInput
  -> defensive context/input capture
  -> sealed context structural assertion
  -> endpoint membership checks
  -> AUTHORITATIVE_STATE provenance-reference membership check, where applicable
  -> CONTRADICTION endpoint canonicalization OR DEPENDENCY direction preservation
  -> deterministic DREL identity
  -> canonical StructuralRelationProposal
```

No reader, resolver, repository, producer state, payload, semantic evaluator, binder, expectation API, detector, analyzer, inference engine, or graph traversal call occurs. `AUTHORITATIVE_STATE` provenance establishes structural membership in the captured context source inventory only; it establishes neither current authority reachability nor relation truth.

The exact relation kinds are `CONTRADICTION` and `DEPENDENCY`, and both are caller-supplied proposal data only. A contradiction proposal is symmetric: constructor input A/B and B/A produces one canonical deterministic endpoint ordering and one `DREL_`. A dependency proposal preserves direction: A -> B and B -> A are separate possible artifacts. Phase 5C3B makes no graph-level cycle judgment. Neither kind establishes a formal logical contradiction, a Phase-5C2 `CONTRADICTED` binding, a Dependency finding, a structural finding, a Gap, a Consequence, a Decision Need, or a recommendation.

Stored artifact assertion follows a fixed order: capture stored artifact, validate common header, validate exact kind-specific stored key set, validate variant content, verify stored contradiction canonicality where applicable, then recompute `DREL_`. It does not repair stored artifacts. A reversed stored contradiction representation fails `ERR_DECISION_STRUCTURAL_RELATION_INVALID`; changing stored dependency direction while retaining the old ID fails `ERR_DECISION_STRUCTURAL_RELATION_ID_MISMATCH`.

## Phase 5C3C: basis-relative structural gap reconstruction

Phase 5C3C is not a new authority-resolution stage. The adjacent `structural-gaps` module consumes a structurally valid `DecisionContextDraft`, one sealed `StructuralExpectation`, and one explicit observation basis. It does not consume a prior authority success as a portable certificate, invoke the Phase-5C2 binder, invoke an evaluator, inspect payloads, discover relations, or traverse a graph.

```text
DecisionContextDraft + StructuralExpectation + explicit observation basis
  -> structural basis validation
  -> expectation-specific comparison
  -> null OR canonical StructuralGap
```

For `CONTEXT_ROLE`, represented observations are the context's own canonical items. For `EVIDENCE_BINDING`, the explicit basis contains structurally validated EBIND proposals. For `DEPENDENCY`, it contains structurally validated DREL proposals. The result is a gap only when that one expectation is unsatisfied within that exact represented basis. It is not a claim of real-world absence, global completeness, semantic truth, relation truth, Decision Need, consequence, recommendation, or human adoption.

For dependency comparison, exact direction satisfies; a reverse dependency remains relevant observation data but does not satisfy, and a contradiction proposal is ignored for dependency satisfaction. For evidence-binding comparison, only the expectation subject's bindings affect the observation body, and at least one accepted disposition satisfies. EBIND target uniqueness is preserved: one item/reference target may occur only once in a supplied basis.

`assertStructuralGap(context, expectation, basis, gap)` is basis-bound. It reconstructs the expected result from the supplied basis before accepting a stored gap. A satisfying reconstruction (`null`) makes any supplied gap invalid, even if its hash is self-consistent. Basis errors propagate as their own errors before stored-gap validation; malformed/noncanonical/body-mismatching stored gaps remain `INVALID` and an otherwise-valid body with only a wrong `DGAP_` remains `ID_MISMATCH`.

## Phase 5C3D: explicit-path basis-relative StructuralConsequence propagation

Phase 5C3D is not a new authority-resolution stage. The adjacent `structural-consequences` module consumes a context, expectation, gap basis, stored gap, and one caller-supplied ordered `DEPENDENCY_PATH`. It operation-locally revalidates the source gap through the sealed 5C3C contract; a `DGAP_` is not portable derivation authority.

```text
DecisionContextDraft + StructuralExpectation + StructuralGapObservationBasis + StructuralGap
+ explicit ordered DEPENDENCY_PATH
  -> context capture
  -> expectation capture and validation
  -> gap-basis capture and sealed gap assertion/reconstruction
  -> item-anchor derivation
  -> linear dependency-path validation
  -> canonical StructuralConsequence
```

Expectation validation occurs before gap-basis inspection, preserving sealed 5C3C error ownership. `EVIDENCE_BINDING` gaps anchor at `subjectItemId`; `DEPENDENCY` gaps anchor at `dependentItemId`; `CONTEXT_ROLE` gaps have no unique item anchor and fail `ERR_DECISION_STRUCTURAL_CONSEQUENCE_SOURCE_NOT_ITEM_ANCHORED`.

The ordered path contains at least one sealed, structurally valid `DEPENDENCY` proposal. Since stored DREL direction is `dependentItemId depends on prerequisiteItemId`, propagation runs prerequisite to dependent. The first prerequisite must be the source item, each prior dependent must be the next prerequisite, and neither relation IDs nor visited items may repeat. A `CONTRADICTION` proposal is valid proposal data but invalid path kind. This validates only the supplied linear path: it does not discover an unordered graph, search reachability, infer relations, rank paths, or claim global acyclicity.

No reader, resolver, repository, authority operation, payload inspection, semantic evaluator, semantic binder, relation detector, relation-truth validator, or graph traversal occurs. A valid DREL path remains represented proposal data, not a true dependency path; the resulting consequence is not a real-world effect, prediction, outcome, Decision Need, or recommendation.

## Phase 5C4: validation assembly of derivational coherence

Phase 5C4 is not a new authority-resolution stage and is not an extension of the Phase-5C1 `validation` authority gate. It consumes a `DecisionContextDraft` directly under the sealed Phase-5B contract, plus explicit Phase-5C3C and Phase-5C3D derivation inputs. It records derivational coherence only:

```text
EXPLICIT DECISION CONTEXT
+ EXPLICIT STRUCTURAL DERIVATION INPUTS
+ OPERATION-LOCAL CONTRACT REVALIDATION
= DECISION CONTEXT VALIDATION ASSEMBLY
```

```text
DecisionContextDraft + explicit expectation/consequence validation inputs
  -> sealed Phase-5B context assertion
  -> one detached snapshot per derivation occurrence
  -> sealed Phase-5C3C gap reconstruction/assertion
  -> sealed Phase-5C3D consequence assertion, where supplied
  -> canonical basis descriptors and source-gap coherence checks
  -> canonical DecisionContextValidationAssembly
```

The same detached expectation, basis, and result representation is used throughout an expectation derivation. The same detached expectation, gap basis, gap, propagation basis, and consequence is used throughout a consequence derivation. Therefore the basis used for predecessor derivation equals the basis committed to the assembly; caller mutation or a non-idempotent proxy cannot substitute a different basis afterward.

Phase 5C4 represents a canonical `NO_GAP` only when sealed gap reconstruction returns `null` and the caller result is also `null`; otherwise a canonical derivation-valid gap becomes `GAP`. `NO_GAP` is not global completeness, truth, current authority, or decision readiness. A consequence is included only when its source GAP result with the same expectation ID, canonical `StructuralValidationBasisDescriptor`, and gap ID is already present in the assembly. This does not make the consequence a real-world effect.

The assembly commits to the complete derivation basis. For EVIDENCE_BINDING and DEPENDENCY, the canonical descriptor inventory contains every supplied observation ID; two such valid bases may produce the same `DGAP_` yet different `DVASM_` identities when they differ in observations irrelevant to the Phase-5C3C gap body. For CONTEXT_ROLE, the descriptor is kind-only and the canonical context observations are already bound by `contextId`. This records the complete represented derivation without asserting global completeness.

No reader, resolver, repository, payload inspection, authority validator, semantic binder, semantic evaluator, or current-authority operation occurs. Phase 5C4 emits no authority certificate and does not mutate `DecisionContextDraft.validationStatus`, which remains `"NOT_RUN"`.

## Phase 5D1: self-contained revision artifact

Phase 5D1 is not a new authority-resolution or repository stage. The adjacent `revisions` module consumes a revision input containing a context, explicit validation input, and an assembly claimed for that input:

```text
DecisionContextRevisionInput
  -> detached operation-local capture
  -> sealed Phase-5B DecisionContextDraft assertion
  -> sealed Phase-5C4 validation-assembly assertion
  -> canonical validation input
  -> canonical assembly reconstruction
  -> deterministic DREV identity
  -> detached DecisionContextRevision
```

The revision embeds all three derivation-state components, allowing later local calls to `assertDecisionContextDraft(context)` and `assertDecisionContextValidationAssembly(context, validationInput, validationAssembly)` without external inputs. It does not make that state persisted, prove durable cold restart, or establish repository authority.

The revision captures each caller-owned component once and continues only with detached data. Its stored assertion compares detached captured stored context/input/assembly representation with reconstructed canonical state; caller-owned nested values are not reread after predecessor validation. This preserves `STATE VALIDATED == STATE STORED / COMPARED`, without claiming that arbitrary proxy non-idempotence is detectable.

`DREV_` binds schema, `previousRevisionId`, `contextId`, and `assemblyId`. `previousRevisionId: null` represents a root; a DREV-shaped previous ID represents only child shape. A syntactically invalid non-null predecessor ID is `ERR_DECISION_CONTEXT_REVISION_PREVIOUS_ID_INVALID` at the constructor boundary, but malformed stored revision representation, including this field, is `ERR_DECISION_CONTEXT_REVISION_INVALID` at stored assertion. Phase 5D1 itself performs no repository call, parent lookup, lineage traversal, head/latest/active selection, branch policy, authority re-resolution, payload inspection, binder, evaluator, or persistence. A standalone revision artifact is not current authority, authority of record, semantic truth, a decision-readiness result, or a recommendation.

## Phase 5D2A: repository-bound immutable persistence authority

Phase 5D2A adds the adjacent `revision-persistence` module. It does not re-run Phase-5A producer-authority resolution, invoke producer resolvers, inspect producer payloads, invoke the semantic binder, or invoke the semantic evaluator. It does read and validate Decision Context revision repository records for immediate-parent integrity and exact post-write authority-of-record reread. `PRODUCER PAYLOAD INSPECTION != REVISION REPOSITORY RECORD INSPECTION`: 5A/5C1/5C2 concern configured producer authority and producer state, whereas 5D2A concerns the repository-selected stored representation of a `DecisionContextRevision`. `REVISION AUTHORITY OF RECORD != CURRENT PRODUCER AUTHORITY`; persisting a revision does not re-establish current authority of any referenced producer state.

```text
InMemoryDecisionContextRevisionRepository
  -> createDecisionContextRevisionPersister()
  -> BoundDecisionContextRevisionPersister.persist(revision)
  -> pristine detached capture and sealed 5D1 assertion
  -> immediate parent read only when previousRevisionId is non-null
  -> runtime-private immutable write using a detached writer copy
  -> exact post-write getRevisionById(expected.revisionId)
  -> sealed reread assertion and complete-artifact equality
  -> detached DecisionContextRevision return
```

`DecisionContextRevisionRepository` defines the supported read/factory capability shape only. `INTERFACE CONFORMANCE != PHASE-5D2A GOVERNANCE GUARANTEE`: an arbitrary conforming implementation is not automatically proven to preserve immediate-parent integrity, immutable replay, private storage, exact reread, complete equality, or pristine expected-state isolation. The shipped `InMemoryDecisionContextRevisionRepository` plus its bound persister path enforces the documented 5D2A semantics.

The shipped in-memory repository's `#writeRevision(...)` is runtime-private storage machinery; it is not a supported raw write API. Storage machinery is not the authority boundary. A successful write alone is not authority of record. `persist(...)` succeeds only after the exact reread equals the pristine validated expected revision.

The operation captures the caller revision once before awaits. The writer receives `structuredClone(expected)`, while the post-write reread is compared with the pristine expected artifact. Thus `STATE VALIDATED == EXPECTED AUTHORITY STATE`, but `WRITER INPUT == DETACHED COPY OF EXPECTED AUTHORITY STATE`; writer mutation cannot alter the comparison baseline.

For a root (`previousRevisionId === null`), no parent lookup occurs. For a child, exactly one immediate parent lookup is required: the returned parent must exist, pass sealed revision assertion, and have the requested ID. This establishes immediate referential integrity only. It does not traverse ancestry, establish causation or semantic continuity, require shared context/assembly IDs, or select a branch/head/latest/active revision. Multiple children of one parent and children with unchanged context/assembly IDs remain valid.

The shipped in-memory repository treats exact complete same-ID replay as idempotent and rejects same-DREV divergent complete payload as `ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT`. Identity-excluded EBIND rationale remains part of complete equality even when EBIND, DVASM, and DREV identities are unchanged. The returned artifact is detached and has operation-relative meaning only: this bound repository selected that exact complete revision as the immutable record for that DREV at successful completion. Revision authority of record is not current producer authority: 5D2A does not re-resolve referenced producer state. Authority of record is also not truth, current decision state, head/latest/active state, or a portable authority token.

## Phase 5D2B: durable PostgreSQL persistence adapter

Phase 5D2B implements the sealed 5D2A authority operation outside the generic kernel:

```text
decision-adapters/revision-persistence
  -> decision-core/revision-persistence
  -> decision-core/revisions
```

`PostgresDecisionContextRevisionRepository` receives a configured `PostgresJsDatabase`; it neither reads `DATABASE_URL` nor creates pools, tables, databases, or migrations. Its supported surface remains `getRevisionById(...)` and `createDecisionContextRevisionPersister()`, with `persist(...)` as the only supported write capability. Its runtime-private writer is storage machinery, not a public raw writer.

```text
PostgreSQL row
  -> detached JSONB payload
  -> sealed assertDecisionContextRevision(payload)
  -> requested/physical/embedded identity equality
  -> detached DecisionContextRevision
```

`READ != RECONSTRUCT != REPAIR`. The adapter does inspect Decision Context revision repository records for immediate-parent and post-write authority work, but it does not re-run producer authority resolution, inspect producer payloads, invoke the binder, or invoke the evaluator. `PRODUCER REPOSITORY STATE != DECISION REVISION REPOSITORY STATE`; revision authority of record does not re-establish current producer authority.

`decision_context_revisions` physically stores `revision_id` as its primary key, nullable non-unique `previous_revision_id` with a non-cascading self foreign key, and non-null JSONB payload. Every accepted row requires `row.revision_id == payload.revisionId` and `row.previous_revision_id == payload.previousRevisionId`. A malformed/noncanonical JSONB artifact or physical/embedded mismatch is `ERR_DECISION_CONTEXT_REVISION_POSTGRES_RECORD_INVALID`; it is durable-record integrity failure, not semantic or producer-authority failure.

The writer uses `INSERT ... ON CONFLICT DO NOTHING ... RETURNING`. Its conflict-race reread determines the winner of the physical `revision_id` race. The inherited sealed 5D2A post-write reread separately determines whether exact complete repository state can complete the authority-of-record operation: `POSTGRES RACE REREAD != 5D2A AUTHORITY REREAD`. Exact replay is idempotent; same DREV with divergent complete state, including identity-excluded EBIND rationale, is `ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT`. JSONB may reorder object keys without changing structural data; array order remains semantic.

5D2B has both application-level immediate-parent validation and physical self-FK integrity. Neither is full lineage validation. Missing parent visibility during one operation remains `ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND`, with no wait, polling, or automatic retry. Forks and no-change children remain valid. The focused tests use isolated schemas and two independent postgres.js clients, proving database-backed survival across repository/client reconstruction rather than OS-process crash, machine restart, backup, replication, or disaster recovery.

## Phase 5D3: read-only revision lineage reconstruction

Phase 5D3 adds the adjacent generic `revision-lineage` module. It binds only an exact `getRevisionById(revisionId)` capability; an extra own write/persistence capability or accessor-backed reader method is rejected as `ERR_DECISION_CONTEXT_REVISION_LINEAGE_READER_INVALID`. It binds neither persister nor writer, PostgreSQL client, database, producer resolver, authority validator, semantic binder, or evaluator: `5D3 HAS READ CAPABILITY; 5D3 HAS ZERO WRITE CAPABILITY`.

`reconstruct(startRevisionId)` validates a DREV-shaped start ID before any read. It then reads exactly the requested ID, captures and sealed-validates the returned revision, requires `returned.revisionId === requestedRevisionId`, and follows only explicit `previousRevisionId` until a sealed-valid revision has `previousRevisionId === null`. It returns a detached `DecisionContextRevisionLineage` with exactly `startRevisionId`, `rootRevisionId`, and root-to-start `revisions`.

The order is explicit predecessor order, not chronological or temporal order. A missing first read is `ERR_DECISION_CONTEXT_REVISION_LINEAGE_START_NOT_FOUND`; a missing named predecessor is `ERR_DECISION_CONTEXT_REVISION_LINEAGE_PREDECESSOR_NOT_FOUND`, never a root and never a partial result. A malformed/noncanonical/wrong-ID returned revision is `ERR_DECISION_CONTEXT_REVISION_LINEAGE_REVISION_INVALID`; 5D3 reads stored revisions and does not reconstruct or repair them. Reader and adapter errors remain observable unchanged.

The operation-local visited-ID set checks and adds each requested ID before its reader call; a repeated request fails `ERR_DECISION_CONTEXT_REVISION_LINEAGE_CYCLE`. This is defensive repeated-request-ID protection for a generic reader topology, not causation, semantic-cycle detection, graph search, branch enumeration, or descendant discovery. The reader method is captured once at construction, and each reconstruction has independent traversal state and detached returned state.

`SEALED-VALID READER RESULT != PERSISTENCE PROOF`, `5D3 READ CAPABILITY != 5D2A PERSISTENCE-AUTHORITY GUARANTEE`, and generic `getRevisionById(...)` conformance does not establish repository-selected authority of record. A successful reconstruction establishes only an exact requested-ID chain of sealed-valid revisions whose explicit predecessor references reach `null` through that bound reader. When the reader is a shipped in-memory or PostgreSQL repository read capability, repository and persistence semantics remain owned by the corresponding 5D2A/5D2B boundary; 5D3 itself does not establish durable persistence, current producer authority, or truth.

## Phase 6A: human-owned assessment request

Phase 6A has no authority operation. `createDecisionAssessmentRequest(...)` captures one declared human-owned normative frame and creates a deterministic `DAREQ_` artifact. It reads no revision, repository, persistence authority, lineage, producer, resolver, evaluator, or model. Its `revisionId` is only DREV-shaped; its question and selection IDs are only DCI-shaped.

```text
DREV-SHAPED REFERENCE != REVISION EXISTENCE != PERSISTED AUTHORITY
DCI-SHAPED REFERENCE  != ITEM EXISTENCE != ITEM MEMBERSHIP != ITEM ROLE VALIDATION
HUMAN_INPUT           != AUTHENTICATED IDENTITY != AUTHORIZATION != SIGNATURE
HUMAN ASSESSMENT REQUEST != ASSESSMENT != RECOMMENDATION != HUMAN DECISION
```

`requestedBy: { origin: "HUMAN_INPUT", actorId }` is a declared ownership axis, not evidence truth. Selections say only that the human declared item references as part of this request; they are not a claim of importance, truth, completeness, viability, enforceability, or readiness. An empty selection inventory is valid. The contract prevents duplicate request-level categorization but does not validate any referenced context role.

## Phase 6B: revision-bound assessment basis

Phase 6B extends the chain without creating a new authority-of-record operation:

```text
HUMAN-OWNED ASSESSMENT REQUEST
+ EXACT REVISION READ
+ SEALED REVISION
+ ITEM MEMBERSHIP / ROLE BINDING
= REVISION-BOUND ASSESSMENT BASIS
```

`createBoundDecisionAssessmentBasisBinder(reader)` accepts only one exact own enumerable data-method reader capability, `getRevisionById(revisionId)`. It captures and binds that method at construction; later replacement cannot redirect an existing binder. The binder first defensively captures and sealed-asserts the complete request, then reads exactly `request.revisionId`. A `null` read is `ERR_DECISION_ASSESSMENT_BASIS_REVISION_NOT_FOUND`. It captures and sealed-asserts the returned revision, requires exact revision-ID equality, and validates that the request question/selection IDs belong to `revision.context.items` with their declared roles. Empty selections are valid.

`READER RETURN != PERSISTENCE PROOF`, `SEALED REVISION != CURRENT REVISION != CURRENT PRODUCER AUTHORITY`, and `REVISION-BOUND ASSESSMENT BASIS != AUTHORITY OF RECORD`. Membership is not semantic support; a matching role is not normative importance or truth. The result is a detached deterministic `DABAS_` artifact; it is not assessment, Decision Need, recommendation, or human decision. It does not select current/head/latest state, traverse lineage, revalidate producer authority, write persistence, or call an evaluator/model/provider. If a reader is backed by a sealed repository, repository authority semantics remain owned by that repository contract.

## Phase 6C: semantic assessment proposal

Phase 6C adds this bounded chain:

```text
SEALED DecisionAssessmentBasis
+ BOUND DecisionAssessmentEvaluator
+ DECLARED MODEL_PROPOSAL PROVENANCE
= CANONICAL DecisionAssessmentProposal
```

The evaluator composition is exact: one own enumerable data-method `evaluate`, captured and bound at proposer construction. The proposer captures and sealed-asserts the complete basis before evaluator await, captures declared `MODEL_PROPOSAL` provenance before the call, supplies the evaluator a detached complete basis, defensively captures returned relations, admits only human-selected option and objective/constraint targets, rejects duplicate target pairs, canonicalizes relation order, derives complete-state `DASPR_`, self-asserts, and returns detached state.

`REVISION MEMBERSHIP != HUMAN NORMATIVE SELECTION`. The evaluator may inspect the complete detached basis; the contract governs admitted output rather than asserting control over internal semantic reasoning. `MODEL_PROPOSAL != HUMAN PREFERENCE != AUTHENTICATED MODEL != PROVIDER AUTHORITY != TRUTH`. Zero or partial relations are valid; `NO ASSESSMENT != UNDETERMINED`. This creates neither authority of record nor producer-authority resolution, and is neither recommendation, Decision Need declaration, nor human decision.

## Phase 6D: recommendation proposal

Phase 6D extends the chain without creating a human decision or authority-of-record operation:

```text
HUMAN-OWNED ASSESSMENT REQUEST
-> REVISION-BOUND ASSESSMENT BASIS
-> SEMANTIC ASSESSMENT PROPOSAL
-> RECOMMENDATION PROPOSAL
-> STOP
```

It captures one exact own enumerable `recommend` generator method at construction. It then captures and sealed-asserts the assessment proposal, captures declared `MODEL_PROPOSAL` provenance, supplies a detached predecessor to the generic bound semantic recommendation capability, defensively captures output, admits only option targets both selected by the human frame and represented in assessment relations, rejects duplicates, canonicalizes order, derives complete-state `DRECP_`, self-asserts, and returns detached state.

`GENERATOR CAPABILITY != MODEL IDENTITY`, `PROPOSAL PROVENANCE != GENERATOR IDENTITY`, and `MODEL_PROPOSAL != AUTHENTICATED MODEL != PROVIDER AUTHORITY != HUMAN PREFERENCE != TRUTH`. `SELECTED OPTION != ASSESSED OPTION != RECOMMENDED OPTION`; disposition does not select policy. The operation establishes neither semantic truth, recommendation correctness, human adoption/decision, option optimality, current producer authority/current revision, persistence authority for recommendation, action, outcome, or feedback.

## Phase 6E: proposal coherence validation

Phase 6E extends the represented artifact chain without adding a dependency capability or authority operation:

```text
HUMAN-OWNED ASSESSMENT REQUEST
-> REVISION-BOUND ASSESSMENT BASIS
-> SEMANTIC ASSESSMENT PROPOSAL
-> RECOMMENDATION PROPOSAL
-> PROPOSAL COHERENCE VALIDATION
-> STOP
```

It captures and sealed-asserts one complete recommendation proposal, reconstructs exactly the criterion IDs represented by embedded assessment relations for each recommended option, canonicalizes trace and criterion order, derives complete-state `DPCV_`, self-asserts, and returns detached state. It has no model, provider, evaluator, generator, human actor, reader, repository, persister, lineage, authority resolver, or decision-maker dependency.

Phase 6D has already established that every recommendation option is human-selected and assessment-represented, so a sealed-valid predecessor yields one deterministic trace per recommendation. The trace is not semantic justification or support: `TRACEABILITY != SEMANTIC CORRECTNESS`, `STRUCTURAL COHERENCE != RECOMMENDATION CORRECTNESS`, `ASSESSMENT REPRESENTATION != SUPPORT FOR RECOMMENDATION`, `CRITERION TRACE != JUSTIFICATION`, and `ASSESSMENT DISPOSITION != COHERENCE POLICY`. It establishes neither truth, recommendation correctness, suitability, optimality, human acceptance/decision, Decision Need, current producer authority/current revision, persistence authority, action, outcome, feedback, or learning.

## Phase 7A: human decision declaration

Phase 7A adds the first explicit human normative state transition:

```text
HUMAN-OWNED ASSESSMENT REQUEST
-> REVISION-BOUND ASSESSMENT BASIS
-> SEMANTIC ASSESSMENT PROPOSAL
-> RECOMMENDATION PROPOSAL
-> PROPOSAL COHERENCE VALIDATION
-> HUMAN DECISION DECLARATION
-> STOP
```

A declaration captures one sealed complete DPCV, declared `HUMAN_INPUT` actor, one or more explicit option choices, and optional human rationale. `THE MODEL MAY NARROW ITS OWN PROPOSAL SPACE; IT MUST NOT NARROW THE HUMAN DECISION SPACE.` Each choice is admitted through the complete embedded revision context only: it must be DCI-shaped, present in `context.items`, and role `OPTION`. It is not required to be 6A-selected, 6C-assessed, 6D-recommended, or 6E-traced. `HUMAN ASSESSMENT SELECTION != HUMAN DECISION ADMISSIBILITY`, `ASSESSMENT != HUMAN DECISION ADMISSIBILITY`, `RECOMMENDATION != HUMAN DECISION ADMISSIBILITY`, and `COHERENCE TRACE != HUMAN DECISION ADMISSIBILITY`.

This is neither model proposal nor recommendation correctness, truth, authenticated identity, authorization, current producer authority, current revision selection, persistence authority, action, outcome, feedback, or learning. `HUMAN_INPUT != AUTHENTICATED HUMAN IDENTITY != AUTHORIZATION`, `DECISION ACTOR != ASSESSMENT REQUESTER`, and `HUMAN RATIONALE != PROOF != SEMANTIC TRUTH`. It records positive selection only: multiple distinct options are allowed without ranking; an empty inventory is invalid input but does not mean defer, abstain, reject-all, or no decision.

## Phase 8A1: decision-bound action intent

Phase 8A1 extends the implemented chain without introducing a dependency capability or authority operation:

```text
HUMAN-OWNED ASSESSMENT REQUEST
-> REVISION-BOUND ASSESSMENT BASIS
-> SEMANTIC ASSESSMENT PROPOSAL
-> RECOMMENDATION PROPOSAL
-> PROPOSAL COHERENCE VALIDATION
-> HUMAN DECISION DECLARATION
-> DECISION-BOUND ACTION INTENT
-> STOP
```

It consumes one complete sealed `HumanDecisionDeclaration`, declared `HUMAN_INPUT` intent actor, a nonempty explicit subset of `chosenOptionItemIds`, opaque operation description, and optional rationale. It sealed-asserts the predecessor; it does not revisit revision context, assessment selections/relations, recommendations, traces, authority resolution, lineage, or persistence. `ACTION INTENT SCOPE ⊆ HUMAN DECISION CHOICE SET`: the model still cannot narrow human decision admissibility before decision, but an action intent cannot operationalize an option the human did not choose after decision. An actual revision option omitted from the declaration's choice set is therefore not admissible.

The declarer is declared input only and may differ from the decision actor. The Action Intent declarer, decision actor, future commitment actor, and future Action actor are independent semantic role positions; no actor-ID equality or inequality is required or inferred. `HUMAN_INPUT != AUTHENTICATED IDENTITY != AUTHORIZATION != SIGNATURE != PERMISSION != TRUTH`. The opaque operation description is not an executable command, target, assignee, workflow, schedule, authorization, execution proof, or expected outcome.

Phase 8A1 establishes neither commitment, action, execution, observed action, truth, recommendation correctness, current producer authority, persistence authority, outcome, feedback, nor learning. `HUMAN DECISION != ACTION INTENT`, `ACTION INTENT != HUMAN COMMITMENT != ACTION != EXECUTION != OUTCOME`, and `INTENDED ACTION != OBSERVED ACTION`.

## Phase 8A2: human commitment

Phase 8A2 extends the implemented chain without introducing a dependency capability or authority operation:

```text
HUMAN-OWNED ASSESSMENT REQUEST
-> REVISION-BOUND ASSESSMENT BASIS
-> SEMANTIC ASSESSMENT PROPOSAL
-> RECOMMENDATION PROPOSAL
-> PROPOSAL COHERENCE VALIDATION
-> HUMAN DECISION DECLARATION
-> DECISION-BOUND ACTION INTENT
-> HUMAN COMMITMENT
-> STOP
```

It consumes one complete sealed `DecisionActionIntent`, declared `HUMAN_INPUT` commitment actor, and optional rationale. It sealed-asserts the Action Intent and does not inspect the Human Decision Declaration, option inventories, revision, context, assessment, recommendation, coherence, producer authority, persistence, or lineage directly. `COMMITMENT TARGET = COMPLETE SEALED ACTION INTENT`; option scope and operation description remain owned by the embedded predecessor. No partial-commitment scope exists.

The commitment actor is declared input only and may differ from both decision actor and Action Intent declarer. These are independent semantic role positions; no actor-ID equality or inequality is required or inferred. One artifact has one actor; one Action Intent may have zero, one, or multiple independent commitments without lookup, aggregation, or global uniqueness. `DECLARED COMMITMENT != LEGAL RESPONSIBILITY != ORGANIZATIONAL ACCOUNTABILITY != OWNERSHIP`; it is neither assignment nor authorization. The commitment-actor role does not establish an assignee or executor role; a future workflow may represent the same or a different concrete actor. `COMMITMENT != AUTHORIZATION != PERMISSION != EXECUTION AUTHORITY != ORGANIZATIONAL AUTHORITY`.

Phase 8A2 establishes a declared human commitment relation only. It does not establish authenticated identity, execution, observed action, completion, truth, current producer authority, repository/persistence authority, outcome, feedback, or learning. `HUMAN COMMITMENT != ACTION`; `COMMITTED != EXECUTED != DONE != COMPLETED != ACTION OCCURRED != OUTCOME ACHIEVED`. Commitment is not a universal predecessor for the standalone Phase 8B occurrence-claim or Phase 8C1 state-change-claim branch.

## Phase 8B: action occurrence claim

Phase 8B is a separate branch, not `HumanCommitment -> ActionOccurrenceClaim`:

```text
DECISION / INTENTION PATH
HumanDecisionDeclaration -> DecisionActionIntent -> HumanCommitment -> STOP

OCCURRENCE-CLAIM PATH
HUMAN_INPUT -----------\
                         -> ActionOccurrenceClaim -> STOP
AUTHORITATIVE_STATE ---/
```

The branch records only an explicit represented source claim that a described opaque operation occurred. `ACTION OCCURRENCE CLAIM != ACTION OCCURRENCE FACT`; `ACTION OCCURRENCE CLAIM != OBSERVED REALITY`; `ACTION OCCURRENCE CLAIM != EXECUTION PROOF`; `ACTION OCCURRENCE CLAIM != OUTCOME`. No decision, intent, commitment, revision, assessment, recommendation, or coherence predecessor is required or embedded.

The closed source union is exactly `HUMAN_INPUT | AUTHORITATIVE_STATE`. A human source is reporting provenance only: `HUMAN REPORT != AUTHENTICATED IDENTITY != EXECUTION PROOF`; claim-source role is not performer role, but role non-equivalence requires no concrete actor-ID equality or inequality. An authoritative-state source stores an exact opaque reference only. No `BoundAuthoritativeStateReader`, resolver, authority validator, evaluator, repository, adapter, payload read, or payload inspection is called.

The epistemic levels remain distinct:

```text
SOURCE PROVENANCE != CURRENT SOURCE AUTHORITY
CURRENT SOURCE AUTHORITY != SEMANTIC OCCURRENCE SUPPORT
SEMANTIC OCCURRENCE SUPPORT != AUTHORITY OF REALITY
```

`REFERENCE != AUTHORITY TOKEN`; `REFERENCE PRESENT != REFERENCE CURRENTLY RESOLVABLE`; `REFERENCE CURRENTLY RESOLVABLE != PAYLOAD SUPPORTS CLAIM`; `PAYLOAD SUPPORTS CLAIM != ACTION OCCURRED IN REALITY`. Reference fields are non-blank but preserved exactly; they are not normalized. The operation text is opaque. Phase 8B represents no temporal claim: `TIMESTAMP != OCCURRENCE PROOF`; `TEMPORAL ORDER != CAUSATION`.

## Phase 8C1: state change claim

Phase 8C1 is a separate branch, not `ActionOccurrenceClaim -> StateChangeClaim` or a continuation of the decision/intention path:

```text
DECISION / INTENTION PATH
HumanDecisionDeclaration -> DecisionActionIntent -> HumanCommitment -> STOP

ACTION OCCURRENCE CLAIM PATH
HUMAN_INPUT -----------\
                         -> ActionOccurrenceClaim -> STOP
AUTHORITATIVE_STATE ---/

STATE CHANGE CLAIM PATH
HUMAN_INPUT -----------\
                         -> StateChangeClaim -> STOP
AUTHORITATIVE_STATE ---/

NO AUTOMATIC EDGE BETWEEN THESE PATHS
```

The branch records only an explicit represented source claim that a described opaque state change occurred. `STATE CHANGE CLAIM != STATE CHANGE FACT`; `STATE CHANGE CLAIM != OBSERVED REALITY`; `STATE CHANGE CLAIM != VERIFIED CHANGE`; `STATE CHANGE CLAIM != EFFECT`; `STATE CHANGE CLAIM != OUTCOME`; `STATE CHANGE CLAIM != CONSEQUENCE`; `STATE CHANGE CLAIM != CAUSAL CLAIM`. No action occurrence, decision, intent, commitment, revision, assessment, recommendation, or coherence predecessor is required or embedded. `ACTION OCCURRENCE CLAIM != STATE CHANGE CLAIM`; `ACTION OCCURRENCE CLAIM + STATE CHANGE CLAIM != OUTCOME`. `TEXT EQUALITY != RELATION`; `ACTOR EQUALITY != RELATION`; `TEMPORAL PROXIMITY != RELATION`; `TEMPORAL ORDER != CAUSATION`.

The closed source union is exactly `HUMAN_INPUT | AUTHORITATIVE_STATE` and is its own semantic type: `SAME REPRESENTATION != SAME SEMANTIC ROLE`. A human source is reporting provenance only, not authenticated identity, authorization, signature, permission, affected actor, performer, executor, assignee, responsibility, ownership, accountability, state-change proof, or truth. `STATE CHANGE CLAIM SOURCE ROLE != AFFECTED ACTOR ROLE`; role non-equivalence requires no concrete actor-ID equality or inequality. An authoritative-state source stores an exact opaque reference only. No `BoundAuthoritativeStateReader`, resolver, authority validator, evaluator, repository, adapter, payload read, or payload inspection is called.

The epistemic levels remain distinct:

```text
SOURCE PROVENANCE != CURRENT SOURCE AUTHORITY
CURRENT SOURCE AUTHORITY != SEMANTIC STATE CHANGE SUPPORT
SEMANTIC STATE CHANGE SUPPORT != AUTHORITY OF REALITY
```

`REFERENCE != AUTHORITY TOKEN`; `REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`; `CURRENT SOURCE AUTHORITY != SEMANTIC STATE CHANGE SUPPORT`; `SEMANTIC STATE CHANGE SUPPORT != STATE CHANGE FACT`. Reference fields are non-blank but preserved exactly; they are not normalized. `stateChangeDescription` is opaque rather than a before/after state, structured delta, effect, outcome, consequence, or causal relation. Phase 8C1 represents no temporal claim: `CLAIM THAT CHANGE OCCURRED != REPRESENTATION OF WHEN CHANGE OCCURRED`; `TIMESTAMP != STATE CHANGE PROOF`; `TEMPORAL ORDER != CAUSATION`.

## Phase 8C2: action-state-change association proposal

Phase 8C2 is an explicit construction downstream of two already sealed, independently created claims. It is not an automatic edge between their claim paths:

```text
ACTION OCCURRENCE CLAIM PATH
HUMAN_INPUT -----------\
                         -> ActionOccurrenceClaim
AUTHORITATIVE_STATE ---/

STATE CHANGE CLAIM PATH
HUMAN_INPUT -----------\
                         -> StateChangeClaim
AUTHORITATIVE_STATE ---/

EXPLICIT ASSOCIATION PROPOSAL PATH
ActionOccurrenceClaim ----------------\
                                        \
StateChangeClaim ------------------------> ActionStateChangeAssociationProposal -> STOP
                                        /
explicit provenance ------------------/

NO AUTOMATIC EDGE BETWEEN THE CLAIM PATHS
```

The two sealed endpoints alone do not establish association. `ACTION OCCURRENCE CLAIM + STATE CHANGE CLAIM != ASSOCIATION`; `TEXT EQUALITY != ASSOCIATION`; `ACTOR EQUALITY != ASSOCIATION`; `SOURCE EQUALITY != ASSOCIATION`; `TEMPORAL PROXIMITY != ASSOCIATION`; `TEMPORAL ORDER != ASSOCIATION`; `TEMPORAL ORDER != CAUSATION`. Explicit construction can represent a proposal only: `ASSOCIATION PROPOSAL != RELATION TRUTH`; `ASSOCIATION PROPOSAL != OUTCOME`; `ASSOCIATION PROPOSAL != EFFECT`; `ASSOCIATION PROPOSAL != CONSEQUENCE`; `ASSOCIATION != ATTRIBUTION`; `ASSOCIATION != CAUSATION`.

The closed provenance union is exactly `HUMAN_INPUT | MODEL_PROPOSAL | AUTHORITATIVE_STATE`. It neither reuses the two claim-source types nor the context-bound `StructuralRelationProposal` relation mechanism: `SAME REPRESENTATION != SAME SEMANTIC ROLE`; `STRUCTURAL RELATION PROPOSAL != ACTION STATE CHANGE ASSOCIATION PROPOSAL`. No relation kind, detector, evaluator, reader, resolver, payload inspection, repository read, persistence operation, or model/provider invocation exists.

For `AUTHORITATIVE_STATE`, Phase 8C2 stores an exact opaque reference only. No reader is called, no resolution occurs, and no payload is inspected. `REFERENCE != AUTHORITY TOKEN`; `REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`; `PROVENANCE != SUPPORT`; `CURRENT SOURCE AUTHORITY != ASSOCIATION TRUTH`. For `MODEL_PROPOSAL`, the represented proposal reference is not publication authority: `MODEL PROPOSAL != PUBLICATION AUTHORITY`. The association proposal therefore establishes neither semantic support nor authority of reality.

## Phase 8C3: outcome-attribution proposal

Phase 8C3 is an explicit construction downstream of one sealed association proposal. It is not an automatic association-to-attribution transition:

```text
EXPLICIT ASSOCIATION PROPOSAL PATH
ActionOccurrenceClaim ----------------\
                                        \
StateChangeClaim ------------------------> ActionStateChangeAssociationProposal
                                        /
explicit association provenance --------/

EXPLICIT OUTCOME ATTRIBUTION PROPOSAL PATH
sealed ActionStateChangeAssociationProposal ---\
                                                 > OutcomeAttributionProposal -> STOP
explicit outcome-attribution provenance -------/

NO AUTOMATIC EDGE FROM ASSOCIATION PROPOSAL
TO OUTCOME ATTRIBUTION PROPOSAL
```

`ASSOCIATION PROPOSAL EXISTENCE != OUTCOME ATTRIBUTION PROPOSAL EXISTENCE`. The sealed association is validated as a predecessor through its public assertion contract; it is not repaired, and neither embedded claim is independently reinterpreted. Explicit new provenance is required to represent only a proposal that the association's State Change Claim has an outcome role relative to its Action Occurrence Claim. `ASSOCIATION PROPOSAL != OUTCOME ATTRIBUTION PROPOSAL`; `ASSOCIATION != OUTCOME ATTRIBUTION`; `ACTION OCCURRENCE CLAIM + STATE CHANGE CLAIM + ASSOCIATION PROPOSAL != OUTCOME ATTRIBUTION PROPOSAL`; `OUTCOME ATTRIBUTION PROPOSAL != OUTCOME TRUTH`; `OUTCOME ATTRIBUTION PROPOSAL != RELATION TRUTH`; `OUTCOME ATTRIBUTION PROPOSAL != CAUSAL CLAIM`; `OUTCOME ATTRIBUTION != CAUSATION`; `TEMPORAL ORDER != OUTCOME ATTRIBUTION`; `TEMPORAL ORDER != CAUSATION`.

The closed provenance union is exactly `HUMAN_INPUT | MODEL_PROPOSAL | AUTHORITATIVE_STATE` and is its own semantic type. The association and attribution provenance may use the same concrete source or different concrete sources without further implication. For `AUTHORITATIVE_STATE`, Phase 8C3 stores only the exact opaque reference: no reader, resolver, authority validator, repository, adapter, payload inspection, evaluator, or persistence operation occurs. `REFERENCE != AUTHORITY TOKEN`; `REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`; `PROVENANCE != SUPPORT`; `CURRENT SOURCE AUTHORITY != OUTCOME TRUTH`. For `MODEL_PROPOSAL`, the represented proposal reference is not publication authority, outcome truth, or causal authority: `MODEL PROPOSAL != PUBLICATION AUTHORITY`; `MODEL PROPOSAL != OUTCOME TRUTH`; `MODEL PROPOSAL != CAUSAL AUTHORITY`. The artifact establishes represented proposal provenance only; it establishes neither authority of reality nor outcome truth.

## Phase 8D1: Decision Context observation proposal

Phase 8D1 is an adjacent explicit return-path candidate boundary. It does not create an automatic transition from its sealed Outcome Attribution Proposal predecessor:

```text
EXPLICIT OUTCOME ATTRIBUTION PROPOSAL PATH
sealed ActionStateChangeAssociationProposal ---\
                                                 > OutcomeAttributionProposal
explicit outcome-attribution provenance -------/

EXPLICIT DECISION CONTEXT OBSERVATION PROPOSAL PATH
sealed OutcomeAttributionProposal --------\
                                           \
explicit opaque statement -----------------> DecisionContextObservationProposal -> STOP
                                           /
explicit provenance ----------------------/

NO AUTOMATIC EDGE FROM OUTCOME ATTRIBUTION PROPOSAL
TO DECISION CONTEXT OBSERVATION PROPOSAL

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION PROPOSAL
TO DECISION CONTEXT
```

The sealed `OutcomeAttributionProposal` is validated only through its public assertion contract. Its existence alone creates no `DecisionContextObservationProposal`; an explicit statement and new represented provenance are separately required. The result is proposal provenance only: `OUTCOME ATTRIBUTION PROPOSAL != DECISION CONTEXT OBSERVATION PROPOSAL`; `OUTCOME ATTRIBUTION PROPOSAL EXISTENCE != DECISION CONTEXT OBSERVATION PROPOSAL EXISTENCE`; `DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT ITEM`; `DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT`; `DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT REVISION`; `OBSERVATION ROLE != OBSERVED REALITY`; `OBSERVATION PROPOSAL != OBSERVATION TRUTH`; `REENTRY PROPOSAL != ADMISSION`; `REENTRY PROPOSAL != REVISION`; `REENTRY PROPOSAL != LOOP CLOSED`.

The closed provenance union is exactly `HUMAN_INPUT | MODEL_PROPOSAL | AUTHORITATIVE_STATE` and has its own semantic role. For `AUTHORITATIVE_STATE`, Phase 8D1 stores only an exact opaque reference: no reader, resolver, payload inspection, authority validator, evaluator, repository, context constructor, revision operation, or persistence operation occurs. `REFERENCE != AUTHORITY TOKEN`; `REFERENCE PRESENT != CURRENT SOURCE AUTHORITY`; `CURRENT SOURCE AUTHORITY != OBSERVATION TRUTH`; `PROVENANCE != SUPPORT`. For `MODEL_PROPOSAL`, represented proposal provenance is not publication authority, observation truth, or outcome truth: `MODEL PROPOSAL != PUBLICATION AUTHORITY`; `MODEL PROPOSAL != OBSERVATION TRUTH`; `MODEL PROPOSAL != OUTCOME TRUTH`. It establishes neither current source authority, observation truth, outcome truth, semantic support, Decision Context admission, nor authority of reality.

## Phase 8D2: Decision Context observation admission declaration

Phase 8D2 is an adjacent explicit human normative boundary. It does not create an automatic transition from its sealed observation-proposal predecessor:

```text
SEALED DecisionContextObservationProposal
+ DECLARED HUMAN_INPUT actor
+ OPTIONAL OPAQUE RATIONALE
-> DecisionContextObservationAdmissionDeclaration -> STOP

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION PROPOSAL
TO DECISION CONTEXT OBSERVATION ADMISSION DECLARATION

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION ADMISSION DECLARATION
TO DECISION CONTEXT ITEM
```

The sealed `DecisionContextObservationProposal` is validated only through its public assertion contract. Its existence alone creates no admission declaration. The explicit declared human actor and optional opaque rationale are separately required. This positive declaration records eligibility for future `OBSERVATION`-role materialization only: `DECISION CONTEXT OBSERVATION PROPOSAL != DECISION CONTEXT OBSERVATION ADMISSION DECLARATION`; `PROPOSAL EXISTENCE != ADMISSION DECLARATION EXISTENCE`; `ADMISSION DECLARATION != DECISION CONTEXT ITEM`; `ADMISSION DECLARATION != DECISION CONTEXT`; `ADMISSION DECLARATION != DECISION CONTEXT REVISION`; `ADMISSION DECLARATION != MATERIALIZATION`; `ADMISSION DECLARATION != CONTEXT MUTATION`; `ADMISSION DECLARATION != REVISION CREATION`; `ADMISSION DECLARATION != LOOP CLOSED`.

The admission actor is represented only as `HUMAN_INPUT`. It is an explicit declared admission boundary, not authentication or external authorization: `ADMITTED BY != PROPOSAL PROVENANCE`; `PROPOSAL PROVENANCE != ADMISSION AUTHORITY`; `MODEL PROPOSAL != AUTOMATIC CONTEXT ADMISSION`; `HUMAN ADMISSION DECLARATION != AUTHENTICATED IDENTITY`; `HUMAN ADMISSION DECLARATION != EXTERNAL AUTHORIZATION`. A sealed DCOP may carry `MODEL_PROPOSAL` provenance, but that provenance does not create admission; the separate declared human actor is required. Rationale is opaque and not support: `RATIONALE != SUPPORT`. Neither equality nor inequality with concrete predecessor actors/provenance is required or inferred.

Phase 8D2 neither inspects nor resolves a sealed DCOP's possible `AUTHORITATIVE_STATE` provenance; it does not create or mutate a Decision Context source inventory. `AUTHORITATIVE DCOP ADMISSION != SOURCE STATE REFERENCE ADMISSION`; `REFERENCE PRESENT IN DCOP != REFERENCE PRESENT IN FUTURE DECISION CONTEXT`; `ADMISSION DECLARATION != SOURCE STATE INVENTORY MUTATION`. It has no reader, resolver, payload inspection, authority validation, evaluator, repository, Context constructor, revision operation, or persistence operation. The declaration establishes neither observation truth, observed reality, outcome truth, semantic support, authority of reality, Context materialization, revision authority, nor persistence authority.

## Phase 8D3: Decision Context observation item projection

Phase 8D3 is a deterministic transformation boundary, not automatic materialization:

```text
SEALED DecisionContextObservationAdmissionDeclaration
-> DecisionContextObservationItemProjection -> STOP

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION ADMISSION DECLARATION
TO DECISION CONTEXT OBSERVATION ITEM PROJECTION

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION ITEM PROJECTION
TO DECISION CONTEXT ITEM
```

The sealed admission is validated only through its public assertion contract. Projection derives exactly `OBSERVATION`, the sealed DCOP statement, and the sealed DCOP provenance. The human admission declaration authorizes represented admission only; it does not replace projected provenance: `PROJECTED ITEM PROVENANCE = DCOP PROVENANCE`; `ADMISSION AUTHORITY != PROJECTED ITEM PROVENANCE`; `ADMITTED BY != PROJECTED ITEM PROVENANCE`; `DETERMINISTIC PROJECTION != DETERMINISTIC_DERIVATION ITEM PROVENANCE`. A represented `MODEL_PROPOSAL` remains model proposal provenance, and a represented `AUTHORITATIVE_STATE` remains exact authoritative-state provenance.

For `AUTHORITATIVE_STATE`, Phase 8D3 carries the reference only. It does not resolve it, inspect payload, establish current authority, or mutate an inventory. `REFERENCE CARRIED BY PROJECTED ITEM INPUT != SOURCE STATE INVENTORY MEMBERSHIP`; `PROJECTED AUTHORITATIVE ITEM INPUT != SOURCE STATE REFERENCE ADMISSION`; `REFERENCE PRESENT IN PROJECTED ITEM INPUT != REFERENCE PRESENT IN FUTURE DECISION CONTEXT`. It performs no reader, resolver, evaluator, repository, Context construction, revision, or persistence operation.

The projection establishes no truth, support, causation, Context membership, revision authority, or persistence authority: `PROJECTION != OBSERVATION TRUTH`; `PROJECTION != OBSERVED REALITY`; `PROJECTION != OUTCOME TRUTH`; `PROJECTION != SEMANTIC SUPPORT`; `PROJECTION != CAUSATION`; `PROJECTION != DECISION CONTEXT ITEM`; `PROJECTED ITEM INPUT != ITEM MEMBERSHIP`; `PROJECTION != MATERIALIZATION`; `PROJECTION != CONTEXT MUTATION`; `PROJECTION != REVISION CREATION`; `PROJECTION != LOOP CLOSED`.

## Phase 8D4A: Decision Context observation target declaration

Phase 8D4A adds a human declaration boundary, not a reader or target-binding operation:

```text
SEALED DecisionContextObservationItemProjection
+ DECLARED DREV-shaped revision reference
+ DECLARED HUMAN_INPUT actor
+ OPTIONAL OPAQUE RATIONALE
-> DecisionContextObservationTargetDeclaration -> STOP

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION ITEM PROJECTION
TO DECISION CONTEXT OBSERVATION TARGET DECLARATION

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION TARGET DECLARATION
TO REVISION BINDING

NO AUTOMATIC EDGE FROM DECISION CONTEXT OBSERVATION TARGET DECLARATION
TO MATERIALIZATION
```

The DCOIP is validated only through its sealed public assertion. The declared target reference is only a shape-valid `DREV_` base-state reference: `TARGET DECLARATION != TARGET BINDING`; `TARGET DECLARATION != REVISION EXISTENCE`; `TARGET DECLARATION != PERSISTENCE AUTHORITY`; `DREV SHAPE != REVISION EXISTENCE`; `TARGET REVISION ID != SEALED REVISION`; `TARGET REVISION ID != PERSISTENCE PROOF`; `TARGET REVISION ID != CURRENT REVISION`; `TARGET REVISION ID != HEAD REVISION`; `TARGET REVISION ID != LATEST REVISION`; `TARGET REVISION != MUTATION DESTINATION`; `TARGET REVISION ID != FUTURE REVISION ID`. No reader, repository, revision object, persistence proof, or current/head/latest resolution exists.

`DECLARATION IDENTITY != PERSISTENCE AUTHORITY`.

The human declarer represents explicit declaration only, not authentication, authorization, ownership, authorship, or predecessor provenance: `DECLARED BY != ADMITTED BY`; `DECLARED BY != PROJECTION PROVENANCE`; `DECLARED BY != AUTHENTICATED IDENTITY`; `DECLARED BY != EXTERNAL AUTHORIZATION`; `DECLARED BY != REVISION OWNER`; `DECLARED BY != REVISION AUTHOR`. Rationale remains opaque: `RATIONALE != EVIDENCE`; `RATIONALE != SUPPORT`; `RATIONALE != TARGET VALIDITY`; `RATIONALE != REVISION EXISTENCE`; `RATIONALE != MATERIALIZATION AUTHORITY`.

An authoritative reference carried by the DCOIP remains representation only. Phase 8D4A neither inspects a target revision nor admits the reference to an inventory: `TARGET DECLARATION != SOURCE STATE REFERENCE ADMISSION`; `TARGET DECLARATION != SOURCE STATE INVENTORY MEMBERSHIP`; `TARGET REVISION REFERENCE != MATERIALIZATION READINESS`; `AUTHORITATIVE REFERENCE CARRIED BY DCOIP != REFERENCE PRESENT IN TARGET REVISION CONTEXT`. Target declaration establishes neither materialization, Context membership, truth, support, causation, revision authority, or persistence authority.

## Failure model

| Boundary | Current error/behavior |
| --- | --- |
| Malformed caller reference at reader boundary | `ERR_DECISION_AUTHORITY_REFERENCE_INVALID` |
| Unknown/duplicate reader resolver binding | `ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND`, `ERR_DECISION_AUTHORITY_RESOLVER_CONFLICT` |
| Capability adapter missing/invalid/mismatched snapshot | `ERR_DECISION_AUTHORITY_STATE_NOT_FOUND`, `ERR_DECISION_AUTHORITY_STATE_INVALID`, `ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH` |
| Invalid validator reader dependency | `ERR_DECISION_CONTEXT_AUTHORITY_READER_INVALID` |
| Invalid/hostile/tampered context entering 5C1 | `ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID` |
| Returned reader reference differs from requested reference | `ERR_DECISION_CONTEXT_AUTHORITY_REFERENCE_MISMATCH` |
| Invalid/hostile/tampered context entering 5C2 | `ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID` |
| Invalid bound 5C2 reader/evaluator | `ERR_DECISION_EVIDENCE_BINDING_READER_INVALID`, `ERR_DECISION_EVIDENCE_BINDING_EVALUATOR_INVALID` |
| Malformed 5C2 returned authority resolution envelope/reference, or returned reference differs from request | `ERR_DECISION_EVIDENCE_BINDING_AUTHORITY_REFERENCE_MISMATCH` |
| 5C2 payload cannot isolate or contains shared memory | `ERR_DECISION_EVIDENCE_BINDING_PAYLOAD_NOT_DETACHABLE` |
| Invalid evaluator output shape, disposition, or rationale | `ERR_DECISION_EVIDENCE_BINDING_EVALUATION_INVALID` |
| Unknown item; malformed, foreign, or mismatched evaluator state reference; duplicate target | `ERR_DECISION_EVIDENCE_BINDING_ITEM_NOT_FOUND`, `ERR_DECISION_EVIDENCE_BINDING_STATE_REFERENCE_INVALID`, `ERR_DECISION_EVIDENCE_BINDING_DUPLICATE` |
| Malformed/tampered context entering 5C3A | `ERR_DECISION_STRUCTURAL_EXPECTATION_CONTEXT_INVALID` |
| General malformed 5C3A input, invalid kind/role/count, self-dependency, or malformed non-authoritative provenance | `ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID` |
| Missing item; malformed/unlisted authoritative-state provenance reference | `ERR_DECISION_STRUCTURAL_EXPECTATION_ITEM_NOT_FOUND`, `ERR_DECISION_STRUCTURAL_EXPECTATION_REFERENCE_INVALID` |
| Empty/unknown or duplicate accepted disposition | `ERR_DECISION_STRUCTURAL_EXPECTATION_DISPOSITION_INVALID`, `ERR_DECISION_STRUCTURAL_EXPECTATION_DUPLICATE_DISPOSITION` |
| Wrong deterministic expectation ID | `ERR_DECISION_STRUCTURAL_EXPECTATION_ID_MISMATCH` |
| Hostile/accessor/symbol representation, unexpected or missing top-level artifact fields, invalid artifact kind/schema version/context ID/kind/expectation-ID shape, unexpected stored keys, or non-canonical stored disposition order | `ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID` |
| Malformed/tampered context entering 5C3B | `ERR_DECISION_STRUCTURAL_RELATION_CONTEXT_INVALID` |
| General malformed 5C3B constructor input, invalid kind, self relation, or malformed non-authoritative provenance | `ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID` |
| Relation endpoint absent from the context | `ERR_DECISION_STRUCTURAL_RELATION_ITEM_NOT_FOUND` |
| Malformed/unlisted authoritative-state relation provenance reference | `ERR_DECISION_STRUCTURAL_RELATION_REFERENCE_INVALID` |
| Wrong deterministic relation-proposal ID on otherwise valid canonical stored proposal | `ERR_DECISION_STRUCTURAL_RELATION_ID_MISMATCH` |
| Hostile/malformed stored relation representation, invalid header, missing/unexpected top-level fields, or noncanonical stored contradiction endpoint order | `ERR_DECISION_STRUCTURAL_RELATION_INVALID` |
| Malformed/tampered context entering 5C3C | `ERR_DECISION_STRUCTURAL_GAP_CONTEXT_INVALID` |
| Expectation invalid for the supplied context | `ERR_DECISION_STRUCTURAL_GAP_EXPECTATION_INVALID` |
| Malformed/mismatched basis wrapper or container, or duplicate basis observation | `ERR_DECISION_STRUCTURAL_GAP_BASIS_INVALID` |
| Malformed or foreign EBIND proposal | `ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID` |
| DREL proposal failing sealed 5C3B assertion | `ERR_DECISION_STRUCTURAL_GAP_RELATION_INVALID` |
| Otherwise valid canonical stored gap body with wrong `DGAP_` | `ERR_DECISION_STRUCTURAL_GAP_ID_MISMATCH` |
| Hostile, malformed, noncanonical, or body-mismatching stored gap; supplied gap under a satisfying basis | `ERR_DECISION_STRUCTURAL_GAP_INVALID` |
| Malformed 5C3D propagation-basis wrapper/container | `ERR_DECISION_STRUCTURAL_CONSEQUENCE_BASIS_INVALID` |
| Hostile, malformed, or sealed-assertion-invalid propagation DREL | `ERR_DECISION_STRUCTURAL_CONSEQUENCE_RELATION_INVALID` |
| Empty or topologically invalid explicit dependency path | `ERR_DECISION_STRUCTURAL_CONSEQUENCE_PATH_INVALID` |
| Valid CONTEXT_ROLE source gap | `ERR_DECISION_STRUCTURAL_CONSEQUENCE_SOURCE_NOT_ITEM_ANCHORED` |
| Otherwise exact stored consequence with wrong `DCONS_` | `ERR_DECISION_STRUCTURAL_CONSEQUENCE_ID_MISMATCH` |
| Hostile, malformed, noncanonical, or body-mismatching stored consequence | `ERR_DECISION_STRUCTURAL_CONSEQUENCE_INVALID` |
| Malformed Phase-5C4 input wrapper/container | `ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID` |
| Duplicate expectation or consequence identity in one assembly | `ERR_DECISION_VALIDATION_ASSEMBLY_DUPLICATE_EXPECTATION`, `ERR_DECISION_VALIDATION_ASSEMBLY_DUPLICATE_CONSEQUENCE` |
| Caller-supplied expectation result differs from sealed Phase-5C3C reconstruction | `ERR_DECISION_VALIDATION_ASSEMBLY_RESULT_MISMATCH` |
| Valid consequence has no matching assembled GAP source derivation | `ERR_DECISION_VALIDATION_ASSEMBLY_CONSEQUENCE_SOURCE_MISSING` |
| Hostile, malformed, or body-mismatching stored assembly | `ERR_DECISION_VALIDATION_ASSEMBLY_INVALID` |
| Otherwise exact stored assembly with wrong `DVASM_` | `ERR_DECISION_VALIDATION_ASSEMBLY_ID_MISMATCH` |
| Malformed Phase-5D1 revision constructor wrapper/input | `ERR_DECISION_CONTEXT_REVISION_INPUT_INVALID` |
| Syntactically invalid non-null previous-revision ID in otherwise captured constructor input | `ERR_DECISION_CONTEXT_REVISION_PREVIOUS_ID_INVALID` |
| Hostile, malformed, noncanonical, or body-mismatching stored revision, including malformed stored previous-revision ID | `ERR_DECISION_CONTEXT_REVISION_INVALID` |
| Otherwise exact stored revision with wrong `DREV_` | `ERR_DECISION_CONTEXT_REVISION_ID_MISMATCH` |
| Invalid repository/persister composition dependency | `ERR_DECISION_CONTEXT_REVISION_REPOSITORY_INVALID` |
| Non-null requested immediate parent absent | `ERR_DECISION_CONTEXT_REVISION_PARENT_NOT_FOUND` |
| Returned immediate parent malformed, invalid, noncanonical, or ID-mismatched | `ERR_DECISION_CONTEXT_REVISION_PARENT_INVALID` |
| Same revision ID already maps to divergent complete artifact | `ERR_DECISION_CONTEXT_REVISION_IMMUTABLE_CONFLICT` |
| Write succeeded but reread is missing, invalid, wrong-ID, or complete-payload divergent | `ERR_DECISION_CONTEXT_REVISION_PERSISTENCE_INVALID` |
| Existing PostgreSQL row malformed, noncanonical, or physically/embedded identity-inconsistent | `ERR_DECISION_CONTEXT_REVISION_POSTGRES_RECORD_INVALID` |
| Invalid lineage reader composition | `ERR_DECISION_CONTEXT_REVISION_LINEAGE_READER_INVALID` |
| Malformed start revision ID before read | `ERR_DECISION_CONTEXT_REVISION_LINEAGE_START_ID_INVALID` |
| Initial requested revision absent | `ERR_DECISION_CONTEXT_REVISION_LINEAGE_START_NOT_FOUND` |
| Named predecessor absent | `ERR_DECISION_CONTEXT_REVISION_LINEAGE_PREDECESSOR_NOT_FOUND` |
| Returned revision malformed, noncanonical, or wrong for its requested ID | `ERR_DECISION_CONTEXT_REVISION_LINEAGE_REVISION_INVALID` |
| Repeated requested revision ID | `ERR_DECISION_CONTEXT_REVISION_LINEAGE_CYCLE` |
| Malformed Phase 6A constructor representation | `ERR_DECISION_ASSESSMENT_REQUEST_INPUT_INVALID` |
| Malformed DREV-shaped request reference | `ERR_DECISION_ASSESSMENT_REQUEST_REVISION_ID_INVALID` |
| Invalid declared requester | `ERR_DECISION_ASSESSMENT_REQUEST_ACTOR_INVALID` |
| Malformed DCI-shaped request reference | `ERR_DECISION_ASSESSMENT_REQUEST_ITEM_ID_INVALID` |
| Duplicate or overlapping declared selection | `ERR_DECISION_ASSESSMENT_REQUEST_DUPLICATE_SELECTION` |
| Malformed/noncanonical stored Phase 6A request | `ERR_DECISION_ASSESSMENT_REQUEST_INVALID` |
| Otherwise exact canonical request with wrong `DAREQ_` | `ERR_DECISION_ASSESSMENT_REQUEST_ID_MISMATCH` |
| Invalid Phase 6B reader composition | `ERR_DECISION_ASSESSMENT_BASIS_READER_INVALID` |
| Invalid/hostile Phase 6A request entering the Phase 6B binder | `ERR_DECISION_ASSESSMENT_BASIS_REQUEST_INVALID` |
| Exact requested revision absent | `ERR_DECISION_ASSESSMENT_BASIS_REVISION_NOT_FOUND` |
| Returned revision malformed, noncanonical, or wrong for requested ID | `ERR_DECISION_ASSESSMENT_BASIS_REVISION_INVALID` |
| Declared question/selection item absent from bound revision | `ERR_DECISION_ASSESSMENT_BASIS_ITEM_NOT_FOUND` |
| Bound item does not have the declared request role | `ERR_DECISION_ASSESSMENT_BASIS_ROLE_MISMATCH` |
| Hostile, malformed, noncanonical, embedded-contract-invalid, revision-binding-invalid, or membership/role-invalid stored basis | `ERR_DECISION_ASSESSMENT_BASIS_INVALID` |
| Otherwise exact valid stored basis with wrong `DABAS_` | `ERR_DECISION_ASSESSMENT_BASIS_ID_MISMATCH` |
| Invalid Phase 6C evaluator composition | `ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATOR_INVALID` |
| Invalid/hostile basis entering Phase 6C proposer | `ERR_DECISION_ASSESSMENT_PROPOSAL_BASIS_INVALID` |
| Invalid/hostile Phase 6C proposal provenance | `ERR_DECISION_ASSESSMENT_PROPOSAL_PROVENANCE_INVALID` |
| Malformed evaluator output, disposition, target shape, or rationale | `ERR_DECISION_ASSESSMENT_PROPOSAL_EVALUATION_INVALID` |
| Valid-shaped option target not selected by the embedded request | `ERR_DECISION_ASSESSMENT_PROPOSAL_OPTION_NOT_SELECTED` |
| Valid-shaped objective/constraint target not selected by the embedded request | `ERR_DECISION_ASSESSMENT_PROPOSAL_CRITERION_NOT_SELECTED` |
| Duplicate option/criterion target pair | `ERR_DECISION_ASSESSMENT_PROPOSAL_DUPLICATE` |
| Hostile, malformed, noncanonical, embedded-invalid, target-invalid, or duplicate stored proposal | `ERR_DECISION_ASSESSMENT_PROPOSAL_INVALID` |
| Otherwise exact valid stored proposal with wrong `DASPR_` | `ERR_DECISION_ASSESSMENT_PROPOSAL_ID_MISMATCH` |
| Invalid Phase 6D generator composition | `ERR_DECISION_RECOMMENDATION_PROPOSAL_GENERATOR_INVALID` |
| Invalid/hostile assessment proposal entering Phase 6D proposer | `ERR_DECISION_RECOMMENDATION_PROPOSAL_ASSESSMENT_PROPOSAL_INVALID` |
| Invalid/hostile Phase 6D provenance | `ERR_DECISION_RECOMMENDATION_PROPOSAL_PROVENANCE_INVALID` |
| Malformed generator output recommendation representation or rationale | `ERR_DECISION_RECOMMENDATION_PROPOSAL_RECOMMENDATION_INVALID` |
| Valid-shaped recommendation option not human-selected | `ERR_DECISION_RECOMMENDATION_PROPOSAL_OPTION_NOT_SELECTED` |
| Selected recommendation option absent from all embedded assessment relations | `ERR_DECISION_RECOMMENDATION_PROPOSAL_OPTION_NOT_ASSESSED` |
| Duplicate recommendation option target | `ERR_DECISION_RECOMMENDATION_PROPOSAL_DUPLICATE` |
| Hostile, malformed, noncanonical, embedded-invalid, target-invalid, or duplicate stored recommendation proposal | `ERR_DECISION_RECOMMENDATION_PROPOSAL_INVALID` |
| Otherwise exact valid stored recommendation proposal with wrong `DRECP_` | `ERR_DECISION_RECOMMENDATION_PROPOSAL_ID_MISMATCH` |
| Invalid/hostile recommendation proposal entering Phase 6E validation | `ERR_DECISION_PROPOSAL_COHERENCE_RECOMMENDATION_PROPOSAL_INVALID` |
| Hostile, malformed, noncanonical, predecessor-invalid, or trace-mismatching stored coherence validation | `ERR_DECISION_PROPOSAL_COHERENCE_INVALID` |
| Otherwise exact valid stored coherence validation with wrong `DPCV_` | `ERR_DECISION_PROPOSAL_COHERENCE_ID_MISMATCH` |
| Malformed/hostile Phase 7A input representation, including empty choice inventory | `ERR_DECISION_HUMAN_DECISION_INPUT_INVALID` |
| Invalid/hostile DPCV entering Phase 7A construction | `ERR_DECISION_HUMAN_DECISION_PROPOSAL_COHERENCE_INVALID` |
| Invalid declared decision actor | `ERR_DECISION_HUMAN_DECISION_ACTOR_INVALID` |
| Malformed chosen DCI; absent chosen item; non-OPTION chosen item; duplicate chosen item | `ERR_DECISION_HUMAN_DECISION_OPTION_ID_INVALID`, `ERR_DECISION_HUMAN_DECISION_OPTION_NOT_FOUND`, `ERR_DECISION_HUMAN_DECISION_OPTION_ROLE_MISMATCH`, `ERR_DECISION_HUMAN_DECISION_DUPLICATE_OPTION` |
| Invalid human rationale | `ERR_DECISION_HUMAN_DECISION_RATIONALE_INVALID` |
| Hostile, malformed, noncanonical, predecessor-invalid, or body-invalid stored declaration | `ERR_DECISION_HUMAN_DECISION_INVALID` |
| Otherwise exact valid stored declaration with wrong `DHDEC_` | `ERR_DECISION_HUMAN_DECISION_ID_MISMATCH` |
| Malformed/hostile Phase 8A1 input representation, including empty option scope | `ERR_DECISION_ACTION_INTENT_INPUT_INVALID` |
| Invalid/hostile HumanDecisionDeclaration entering Phase 8A1 construction | `ERR_DECISION_ACTION_INTENT_HUMAN_DECISION_INVALID` |
| Invalid declared intent actor | `ERR_DECISION_ACTION_INTENT_ACTOR_INVALID` |
| Malformed operationalized DCI; unchosen option; duplicate operationalized option | `ERR_DECISION_ACTION_INTENT_OPTION_ID_INVALID`, `ERR_DECISION_ACTION_INTENT_OPTION_NOT_CHOSEN`, `ERR_DECISION_ACTION_INTENT_DUPLICATE_OPTION` |
| Invalid operation description or rationale | `ERR_DECISION_ACTION_INTENT_OPERATION_INVALID`, `ERR_DECISION_ACTION_INTENT_RATIONALE_INVALID` |
| Hostile, malformed, noncanonical, predecessor-invalid, or body-invalid stored action intent | `ERR_DECISION_ACTION_INTENT_INVALID` |
| Otherwise exact valid stored action intent with wrong `DAINT_` | `ERR_DECISION_ACTION_INTENT_ID_MISMATCH` |
| Malformed/hostile Phase 8A2 input representation | `ERR_DECISION_HUMAN_COMMITMENT_INPUT_INVALID` |
| Invalid/hostile DecisionActionIntent entering Phase 8A2 construction | `ERR_DECISION_HUMAN_COMMITMENT_ACTION_INTENT_INVALID` |
| Invalid declared commitment actor | `ERR_DECISION_HUMAN_COMMITMENT_ACTOR_INVALID` |
| Invalid commitment rationale | `ERR_DECISION_HUMAN_COMMITMENT_RATIONALE_INVALID` |
| Hostile, malformed, noncanonical, predecessor-invalid, or body-invalid stored commitment | `ERR_DECISION_HUMAN_COMMITMENT_INVALID` |
| Otherwise exact valid stored commitment with wrong `DHCOM_` | `ERR_DECISION_HUMAN_COMMITMENT_ID_MISMATCH` |
| Malformed top-level Phase 8B constructor input | `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_INPUT_INVALID` |
| Unsupported/malformed Phase 8B source | `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_SOURCE_INVALID` |
| Malformed Phase 8B authoritative-state reference | `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_REFERENCE_INVALID` |
| Invalid Phase 8B operation description | `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_OPERATION_INVALID` |
| Hostile, malformed, noncanonical, or body-invalid stored occurrence claim | `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_INVALID` |
| Otherwise exact valid stored occurrence claim with wrong `DAOC_` | `ERR_DECISION_ACTION_OCCURRENCE_CLAIM_ID_MISMATCH` |
| Malformed top-level Phase 8C1 constructor input | `ERR_DECISION_STATE_CHANGE_CLAIM_INPUT_INVALID` |
| Unsupported/malformed Phase 8C1 source | `ERR_DECISION_STATE_CHANGE_CLAIM_SOURCE_INVALID` |
| Malformed Phase 8C1 authoritative-state reference | `ERR_DECISION_STATE_CHANGE_CLAIM_REFERENCE_INVALID` |
| Invalid Phase 8C1 state-change description | `ERR_DECISION_STATE_CHANGE_CLAIM_DESCRIPTION_INVALID` |
| Hostile, malformed, noncanonical, or body-invalid stored state-change claim | `ERR_DECISION_STATE_CHANGE_CLAIM_INVALID` |
| Otherwise exact valid stored state-change claim with wrong `DSCC_` | `ERR_DECISION_STATE_CHANGE_CLAIM_ID_MISMATCH` |
| Malformed top-level Phase 8C2 constructor input | `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INPUT_INVALID` |
| Invalid/hostile Phase 8C2 Action Occurrence Claim endpoint | `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ACTION_CLAIM_INVALID` |
| Invalid/hostile Phase 8C2 State Change Claim endpoint | `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_STATE_CHANGE_CLAIM_INVALID` |
| Unsupported/malformed Phase 8C2 provenance | `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_PROVENANCE_INVALID` |
| Malformed Phase 8C2 authoritative provenance reference | `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_REFERENCE_INVALID` |
| Malformed top-level Phase 8C3 constructor input | `ERR_DECISION_OUTCOME_ATTRIBUTION_INPUT_INVALID` |
| Invalid, hostile, or stale sealed Phase 8C2 association entering Phase 8C3 construction | `ERR_DECISION_OUTCOME_ATTRIBUTION_ASSOCIATION_PROPOSAL_INVALID` |
| Unsupported/malformed Phase 8C3 provenance | `ERR_DECISION_OUTCOME_ATTRIBUTION_PROVENANCE_INVALID` |
| Malformed Phase 8C3 authoritative provenance reference | `ERR_DECISION_OUTCOME_ATTRIBUTION_REFERENCE_INVALID` |
| Hostile, malformed, noncanonical, or nested-predecessor-invalid stored Phase 8C3 attribution proposal | `ERR_DECISION_OUTCOME_ATTRIBUTION_INVALID` |
| Otherwise exact valid stored Phase 8C3 attribution proposal with wrong `DOATP_` | `ERR_DECISION_OUTCOME_ATTRIBUTION_ID_MISMATCH` |
| Malformed top-level Phase 8D1 constructor input | `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INPUT_INVALID` |
| Invalid, hostile, or stale sealed Phase 8C3 attribution entering Phase 8D1 construction | `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_OUTCOME_ATTRIBUTION_INVALID` |
| Invalid Phase 8D1 statement | `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_STATEMENT_INVALID` |
| Unsupported/malformed Phase 8D1 provenance | `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_PROVENANCE_INVALID` |
| Malformed Phase 8D1 authoritative provenance reference | `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_REFERENCE_INVALID` |
| Hostile, malformed, noncanonical, or nested-predecessor-invalid stored Phase 8D1 observation proposal | `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_INVALID` |
| Otherwise exact valid stored Phase 8D1 observation proposal with wrong `DCOP_` | `ERR_DECISION_CONTEXT_OBSERVATION_PROPOSAL_ID_MISMATCH` |
| Malformed Phase 8D2 constructor input | `ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_INPUT_INVALID` |
| Invalid, hostile, or stale sealed DCOP entering Phase 8D2 construction | `ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_PROPOSAL_INVALID` |
| Invalid Phase 8D2 admission actor or rationale | `ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_ACTOR_INVALID`, `ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_RATIONALE_INVALID` |
| Hostile, malformed, noncanonical, or nested-predecessor-invalid stored Phase 8D2 admission declaration | `ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_INVALID` |
| Otherwise exact valid stored Phase 8D2 admission declaration with wrong `DCOAD_` | `ERR_DECISION_CONTEXT_OBSERVATION_ADMISSION_ID_MISMATCH` |
| Malformed or hostile Phase 8D3 constructor input | `ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_INPUT_INVALID` |
| Invalid, hostile, or stale sealed DCOAD entering Phase 8D3 construction | `ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_ADMISSION_INVALID` |
| Hostile, malformed, noncanonical, drifted, or nested-predecessor-invalid stored Phase 8D3 projection | `ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_INVALID` |
| Otherwise exact valid stored Phase 8D3 projection with wrong `DCOIP_` | `ERR_DECISION_CONTEXT_OBSERVATION_ITEM_PROJECTION_ID_MISMATCH` |
| Malformed or hostile Phase 8D4A constructor input | `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_INPUT_INVALID` |
| Invalid, hostile, or stale sealed DCOIP entering Phase 8D4A construction | `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_PROJECTION_INVALID` |
| Invalid Phase 8D4A target reference, declarer, or rationale | `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_REVISION_ID_INVALID`, `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_ACTOR_INVALID`, `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_RATIONALE_INVALID` |
| Hostile, malformed, noncanonical, drifted, or nested-predecessor-invalid stored Phase 8D4A declaration | `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_INVALID` |
| Otherwise exact valid stored Phase 8D4A declaration with wrong `DCOTD_` | `ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_ID_MISMATCH` |
| Hostile, malformed, noncanonical, nested-claim-invalid, or body-invalid stored association proposal | `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_INVALID` |
| Otherwise exact valid stored association proposal with wrong outer `DASCA_` | `ERR_DECISION_ACTION_STATE_CHANGE_ASSOCIATION_ID_MISMATCH` |

`ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID` classifies stored-representation failures. After safe representation capture, stored variant content is reconstructed through the normal structural-input path, so meaningful invalid variant content may instead preserve `ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID`, `ERR_DECISION_STRUCTURAL_EXPECTATION_ITEM_NOT_FOUND`, `ERR_DECISION_STRUCTURAL_EXPECTATION_REFERENCE_INVALID`, `ERR_DECISION_STRUCTURAL_EXPECTATION_DISPOSITION_INVALID`, or `ERR_DECISION_STRUCTURAL_EXPECTATION_DUPLICATE_DISPOSITION`. Wrong deterministic ID remains `ERR_DECISION_STRUCTURAL_EXPECTATION_ID_MISMATCH`.

The validator does not catch errors from `await boundResolve(...)`. Existing deterministic Phase-5A reader/adapter errors therefore remain observable where they arise; a producer dependency exception also propagates rather than being reclassified as a 5C1 context error.

The Phase-5C2 binder likewise permits Phase-5A reader/resolver/producer errors to propagate from its operation-time authority calls. It reclassifies only its own capture/isolation/proposal-boundary failures into the Phase-5C2 errors above.

Phase 5D3 likewise does not catch reader, repository, or adapter exceptions that it does not own; they propagate unchanged. Its six lineage errors classify only its composition, input, successful-null-read, successfully returned-revision, and repeated-request-ID boundaries. Phase 6B likewise permits underlying reader dependency exceptions to propagate; its eight errors classify its own composition, request, returned-revision, membership/role, and stored-basis boundaries. Phase 6C likewise permits underlying evaluator dependency exceptions to propagate; its nine errors classify its own composition, basis, provenance, output, selected-target, duplicate, and stored-proposal boundaries. Phase 6D likewise permits underlying generator dependency exceptions to propagate; its nine errors classify its own composition, assessment-proposal, provenance, output, selected/assessed target, duplicate, and stored-proposal boundaries. Phase 6E has no operation-time dependency: its three errors classify its sealed-predecessor capture and stored trace-validation boundaries. Phase 7A likewise has no external dependency: its ten errors classify input, sealed-DPCV, actor, actual revision-option admission, rationale, and stored-declaration boundaries. Phase 8A1 likewise has no external dependency: its ten errors classify input, sealed HumanDecisionDeclaration, actor, option admission, operation/rationale, and stored Action Intent boundaries. Phase 8A2 likewise has no external dependency: its six errors classify input, sealed Action Intent, actor, rationale, and stored-commitment boundaries. Phase 8B likewise has no external dependency: its six errors classify top-level input, source, authoritative reference, operation, and stored-claim boundaries. Phase 8C1 likewise has no external dependency: its six errors classify top-level input, source, authoritative reference, state-change description, and stored-claim boundaries. Phase 8C2 likewise has no external dependency: its seven errors classify top-level input, each sealed endpoint, provenance, authoritative provenance reference, and stored association-proposal boundaries. Phase 8C3 likewise has no external dependency: its six errors classify top-level input, sealed association proposal, provenance, authoritative provenance reference, and stored outcome-attribution-proposal boundaries. Phase 8D1 likewise has no external dependency: its seven errors classify top-level input, sealed outcome-attribution proposal, statement, provenance, authoritative provenance reference, and stored observation-proposal boundaries. Phase 8D2 likewise has no external dependency: its six errors classify top-level input, sealed observation proposal, declared human actor, rationale, and stored admission-declaration boundaries. Phase 8D3 likewise has no external dependency: its four errors classify top-level input, sealed admission declaration, and stored projection boundaries; stored body invalidity precedes stale outer-identity classification.

## Authority is not semantic support

Phase 8D3 adds a deterministic transformation boundary: a sealed admission declaration is projected into the exact `OBSERVATION` item-input semantics it already represents. Admission authority does not become projected item provenance, deterministic transformation does not become `DETERMINISTIC_DERIVATION` provenance, and an `AUTHORITATIVE_STATE` reference is carried without becoming source-inventory membership or current authority. The projection establishes no truth, support, causation, Context membership, revision authority, or persistence authority.

The implemented decision/intention path establishes that configured producer authority can currently resolve each declared context reference where that gate is explicitly invoked, that a bound semantic evaluator can propose an item/reference disposition from an isolated payload, that explicit structural expectations and item/item relation proposals can be represented canonically, that one explicit expectation can be deterministically compared with one explicit represented basis to derive a basis-relative `StructuralGap` or `null`, that one validated item-anchored gap can be propagated along one explicit ordered represented dependency path into an explicit-path basis-relative `StructuralConsequence`, that those explicit derivations can be revalidated and assembled canonically for one context, that this derivation state can be captured in a self-contained `DecisionContextRevision`, that sealed 5D2A repository authority semantics can be durably implemented in PostgreSQL across repository/client reconstruction, that one explicit predecessor path can be reconstructed read-only through a bound reader, that a human may declare a detached normative assessment frame, that this request can be bound to one exact sealed revision with declared item membership/role checks, that one bound semantic assessment evaluator can produce canonical assessment proposal state carrying declared `MODEL_PROPOSAL` provenance within that selected frame, that one bound generic semantic recommendation capability can produce canonical recommendation proposal state only for selected and assessment-represented options, that deterministic Phase 6E reconstruction can materialize the represented assessment-criterion trace for each recommendation, that a human may declare one or more actual revision options independently of that model-proposal path, that a declared human intent actor may record an opaque intended operation only for a nonempty subset of options already chosen in that declaration, and that a declared human commitment actor may record commitment to that complete represented Action Intent. Human Commitment establishes no semantic truth, recommendation correctness, authenticated identity, authorization, assignment, execution, producer authority, revision currentness, repository/persistence authority, authority of reality, persistence proof, or justification. Separately, an explicit `HUMAN_INPUT` or `AUTHORITATIVE_STATE` source may produce one standalone `ActionOccurrenceClaim`. That claim does not establish that the described operation occurred in reality, execution, observed or verified action, semantic occurrence support, current source authority, authority of reality, persistence authority, outcome, feedback, or learning. Separately, an explicit `HUMAN_INPUT` or `AUTHORITATIVE_STATE` source may produce one standalone `StateChangeClaim`. That claim does not establish that the described state change occurred in reality, verified change, effect, outcome, consequence, causal claim, semantic state-change support, current source authority, authority of reality, persistence authority, feedback, or learning. Separately, one complete sealed `ActionOccurrenceClaim`, one complete sealed `StateChangeClaim`, and explicit `HUMAN_INPUT`, `MODEL_PROPOSAL`, or `AUTHORITATIVE_STATE` provenance may produce one `ActionStateChangeAssociationProposal`. That proposal does not establish relation truth, outcome, effect, consequence, attribution, causation, semantic support, current source authority, publication authority, authority of reality, or persistence authority. Separately, one complete sealed `ActionStateChangeAssociationProposal` and explicit `HUMAN_INPUT`, `MODEL_PROPOSAL`, or `AUTHORITATIVE_STATE` provenance may produce one `OutcomeAttributionProposal`. That proposal does not establish outcome truth, relation truth, causal claim, causation, semantic support, current source authority, publication authority, authority of reality, or persistence authority. Separately, one complete sealed `OutcomeAttributionProposal`, one explicit opaque statement, and explicit `HUMAN_INPUT`, `MODEL_PROPOSAL`, or `AUTHORITATIVE_STATE` provenance may produce one `DecisionContextObservationProposal` as an `OBSERVATION`-role candidate for a future Decision Context. That proposal does not establish observation truth, outcome truth, semantic support, Decision Context admission, a Context Item, revision, current source authority, authority of reality, or persistence authority. Separately, one complete sealed `DecisionContextObservationProposal`, one declared `HUMAN_INPUT` actor, and optional opaque rationale may produce one positive `DecisionContextObservationAdmissionDeclaration` that records eligibility for future `OBSERVATION`-role materialization. That declaration does not establish Context Item materialization, Context mutation, revision creation, loop closure, observation truth, observed reality, outcome truth, semantic support, causation, authenticated identity, external authorization, current authority, authority of reality, or persistence authority. The architecture does not establish verified semantic truth, real-world absence, global completeness, current producer authority, current decision state, branch/descendant discovery, head/latest/active selection, relation truth, a structural contradiction, a Dependency finding, real-world consequence, Decision Need, human adoption, option optimality, suitability for a recommendation, action, execution, outcome, feedback, or learning.
