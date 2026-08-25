# Decision Core authority trust chain

## Scope

This walkthrough describes authority, structural checks, semantic evaluator proposal binding, explicit structural comparison targets, explicit structural relation proposals, basis-relative structural gap reconstruction, and explicit-path structural consequence propagation implemented through Phase 5C3D. It does not describe structural contradictions, dependency findings, decision need, relation discovery, recommendation, decision, validation assembly, persistence behavior, or human-machine feedback as current functionality.

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

## Phase 5C3D: basis-relative structural consequence propagation

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

`ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID` classifies stored-representation failures. After safe representation capture, stored variant content is reconstructed through the normal structural-input path, so meaningful invalid variant content may instead preserve `ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID`, `ERR_DECISION_STRUCTURAL_EXPECTATION_ITEM_NOT_FOUND`, `ERR_DECISION_STRUCTURAL_EXPECTATION_REFERENCE_INVALID`, `ERR_DECISION_STRUCTURAL_EXPECTATION_DISPOSITION_INVALID`, or `ERR_DECISION_STRUCTURAL_EXPECTATION_DUPLICATE_DISPOSITION`. Wrong deterministic ID remains `ERR_DECISION_STRUCTURAL_EXPECTATION_ID_MISMATCH`.

The validator does not catch errors from `await boundResolve(...)`. Existing deterministic Phase-5A reader/adapter errors therefore remain observable where they arise; a producer dependency exception also propagates rather than being reclassified as a 5C1 context error.

The Phase-5C2 binder likewise permits Phase-5A reader/resolver/producer errors to propagate from its operation-time authority calls. It reclassifies only its own capture/isolation/proposal-boundary failures into the Phase-5C2 errors above.

## Authority is not semantic support

The implemented chain establishes that configured producer authority can currently resolve each declared context reference, that a bound semantic evaluator can propose an item/reference disposition from an isolated payload, that explicit structural expectations and item/item relation proposals can be represented canonically, that one explicit expectation can be deterministically compared with one explicit represented basis to derive a basis-relative `StructuralGap` or `null`, and that one validated item-anchored gap can be propagated along one explicit ordered represented dependency path into a basis-relative `StructuralConsequence`. It does not establish verified semantic truth, real-world absence, global completeness, relation truth, a structural contradiction, a Dependency finding, real-world consequence, Decision Need, human adoption, or suitability for a recommendation. Those remain later concerns beyond Phase 5C3D.
