# Decision Core artifact contracts

## Current public contracts

| Contract | Exact fields / operation | Current semantics |
| --- | --- | --- |
| `AuthoritativeStateReference` | `producerId`, `authorityContractId`, `artifactId`, `locator` | An opaque four-field pointer. Every field is required, non-empty, and captured as an enumerable own data property by the reader. It carries no payload, repository, resolver, or authority token. |
| `AuthoritativeStateResolver<TPayload>` | `producerId`, `authorityContractId`, `resolve(reference): Promise<TPayload>` | Producer-specific resolver contract. The generic reader binds it by the producer/contract pair. |
| `AuthoritativeStateResolution<TPayload>` | `reference`, `payload` | Description of one successful bound-reader operation: a detached reference plus the resolver-returned opaque payload. The generic reader does not clone the payload, and the resolution does not confer authority into another operation. |
| `BoundAuthoritativeStateReader` | `resolve(reference): Promise<AuthoritativeStateResolution>` | Reader constructed from resolver registrations. It accepts only a reference per operation. |
| `DecisionContextItemRole` | `DECISION_QUESTION`, `OBJECTIVE`, `CONSTRAINT`, `OPTION`, `OBSERVATION`, `ASSUMPTION`, `UNCERTAINTY` | Semantic role axis for a structural context item. No role establishes truth, support, adoption, or recommendation. |
| `DecisionContextItemProvenance` | `AUTHORITATIVE_STATE { stateReference }`; `HUMAN_INPUT { actorId }`; `MODEL_PROPOSAL { proposalRef }`; `DETERMINISTIC_DERIVATION { ruleId }` | Independent ownership/origin axis. Whitespace-only `actorId`, `proposalRef`, and `ruleId` values are rejected; otherwise their original string values are preserved and participate in DCI identity unchanged. `AUTHORITATIVE_STATE` requires structural membership in the context source inventory. |
| `DecisionContextItemInput` | `role`, `statement`, `provenance` | Constructor input only. Statement is trimmed at outer whitespace, without lowercasing or semantic rewriting. |
| `DecisionContextItem` | `itemId`, `role`, `statement`, `provenance` | Canonical stored item. The ID is recomputed during structural assertion. |
| `DecisionContextDraftInput` | `sourceStateReferences`, `items` | Constructor input. It does not accept a context ID, status, schema version, question ID, payload, repository, resolver, or resolution. |
| `DecisionContextDraft` | `artifactKind: "DECISION_CONTEXT_DRAFT"`, `schemaVersion: "DECISION_CONTEXT_DRAFT_V1"`, `contextId`, `validationStatus: "NOT_RUN"`, `sourceStateReferences`, `decisionQuestionId`, `items` | Detached canonical pre-validation structural artifact. It is not persisted by current Decision Core code. |
| `BoundDecisionContextAuthorityValidator` | `validate(context): Promise<void>` | Composition-time bound operation that checks current authority reachability for every context source reference. It returns no proof, payload collection, token, or validated context artifact. |
| `EvidenceBindingDisposition` | `SUPPORTED`, `PARTIALLY_SUPPORTED`, `NOT_SUPPORTED`, `CONTRADICTED` | Closed Phase-5C2 semantic evaluator disposition set. It is not authority, verified truth, completeness, recommendation, or a Phase-5C3 finding. |
| `EVIDENCE_BINDING_DISPOSITIONS` | readonly runtime list of the four disposition strings | Runtime representation of the closed disposition set. |
| `SemanticEvidenceBindingEvaluation` | `itemId`, `stateReference`, `disposition`, `rationale` | One evaluator-produced candidate relationship. The binder captures and validates it before constructing a proposal. |
| `SemanticEvidenceEvaluationInput` | `contextId`, `items: readonly DecisionContextItem[]`, `stateReference`, `payload` | Operation-local evaluator input. `items` are detached captured values exposed through a readonly array type, not a claim of deep runtime immutability; reference is detached. `payload` is the Phase-5C2 isolated opaque payload, not a repository/read capability or producer-owned shared memory. |
| `SemanticEvidenceBindingEvaluator` | `evaluate(input): Promise<readonly SemanticEvidenceBindingEvaluation[]>` | Composition-time evaluator dependency. It has no repository, resolver, reader, producer-state write capability, human decision state, or producer authority. It may mutate its operation-local detached payload without mutating the resolver-owned payload. Its output is proposal data only. |
| `SemanticEvidenceBindingProposal` | `bindingId`, `contextId`, `itemId`, `stateReference`, `disposition`, `rationale` | Canonical Phase-5C2 proposal for one item × one state reference. It is not persisted and does not validate the Decision Context. |
| `BoundSemanticEvidenceBinder` | `bind(context): Promise<SemanticEvidenceBindingProposal[]>` | Composition-time bound operation. It re-establishes authority and payload isolation before invoking semantic evaluation. |
| `STRUCTURAL_EXPECTATION_SCHEMA_VERSION` | `"STRUCTURAL_EXPECTATION_V1"` | Fixed schema-version constant for Phase 5C3A expectations. |
| `STRUCTURAL_EXPECTATION_KINDS` / `StructuralExpectationKind` | `EVIDENCE_BINDING`, `CONTEXT_ROLE`, `DEPENDENCY` | Closed Phase-5C3A expectation-kind set. These are explicit comparison-target kinds, not findings. |
| `EvidenceBindingStructuralExpectationInput` | `kind`, `subjectItemId`, `acceptedDispositions`, `provenance` | Constructor input for one item later evidence-binding comparison criterion. |
| `ContextRoleStructuralExpectationInput` | `kind`, `role`, `minimumCount`, `provenance` | Constructor input for a future count comparison against one context role. |
| `DependencyStructuralExpectationInput` | `kind`, `dependentItemId`, `prerequisiteItemId`, `provenance` | Constructor input for a future directed structural dependency comparison. |
| `StructuralExpectationInput` | Discriminated union of the three Phase-5C3A inputs | Callers supply only explicit expectation content; no context ID, artifact ID, payload, reader, resolver, repository, authority token, binding inventory, or finding. |
| `EvidenceBindingStructuralExpectation` | Common expectation fields plus `subjectItemId`, `acceptedDispositions` | Canonical explicit criterion for a future item/binding comparison. It does not inspect or claim any binding. |
| `ContextRoleStructuralExpectation` | Common expectation fields plus `role`, `minimumCount` | Canonical explicit criterion for a future role-count comparison. It does not count current items or claim satisfaction. |
| `DependencyStructuralExpectation` | Common expectation fields plus `dependentItemId`, `prerequisiteItemId` | Canonical explicit criterion for a future directed dependency comparison. It is not a Dependency finding. |
| `StructuralExpectation` | Discriminated union of the three Phase-5C3A artifacts | `artifactKind: "STRUCTURAL_EXPECTATION"`, `schemaVersion: "STRUCTURAL_EXPECTATION_V1"`, `expectationId`, `contextId`, `kind`, `provenance`, and exact variant fields. It is not persisted by current Decision Core code. |
| `createStructuralExpectation(context, input)` | `DecisionContextDraft × StructuralExpectationInput -> StructuralExpectation` | Captures/asserts one context, validates explicit input structurally, derives canonical content/identity, asserts the result, and returns a detached clone. |
| `assertStructuralExpectation(context, expectation)` | `DecisionContextDraft × StructuralExpectation -> void` | Verifies exact stored representation, context binding, membership, canonicality, and deterministic identity without repairing the artifact. |
| `STRUCTURAL_RELATION_PROPOSAL_SCHEMA_VERSION` | `"STRUCTURAL_RELATION_PROPOSAL_V1"` | Fixed schema-version constant for Phase 5C3B relation proposals. |
| `STRUCTURAL_RELATION_PROPOSAL_KINDS` / `StructuralRelationProposalKind` | `CONTRADICTION`, `DEPENDENCY` | Closed Phase-5C3B relation-proposal kind set. These are caller-supplied proposals, not relation truth or findings. |
| `ContradictionStructuralRelationProposalInput` | `kind: "CONTRADICTION"`, `itemIds: readonly [string, string]`, `provenance` | Constructor input for one proposed symmetric item/item incompatibility relation. |
| `DependencyStructuralRelationProposalInput` | `kind: "DEPENDENCY"`, `dependentItemId`, `prerequisiteItemId`, `provenance` | Constructor input for one proposed directional item/item dependency relation. |
| `StructuralRelationProposalInput` | Discriminated union of the two Phase-5C3B inputs | Callers supply one explicit relation proposal; no artifact ID, context ID, payload, reader, resolver, repository, authority token, semantic binding, expectation, or finding. |
| `ContradictionStructuralRelationProposal` | Common relation fields plus canonical `itemIds` | Canonical symmetric proposal only; it is not a formal logical contradiction or Contradiction finding. |
| `DependencyStructuralRelationProposal` | Common relation fields plus `dependentItemId`, `prerequisiteItemId` | Canonical directional proposal only; it is not a Dependency expectation or Dependency finding. |
| `StructuralRelationProposal` | Discriminated union of the two Phase-5C3B artifacts | `artifactKind: "STRUCTURAL_RELATION_PROPOSAL"`, `schemaVersion: "STRUCTURAL_RELATION_PROPOSAL_V1"`, `relationProposalId`, `contextId`, `kind`, `provenance`, and exact variant fields. It is not persisted by current Decision Core code. |
| `createStructuralRelationProposal(context, input)` | `DecisionContextDraft × StructuralRelationProposalInput -> StructuralRelationProposal` | Captures/asserts one context, structurally validates one explicit proposal, derives canonical content/identity, asserts the result, and returns a detached clone. |
| `assertStructuralRelationProposal(context, proposal)` | `DecisionContextDraft × StructuralRelationProposal -> void` | Verifies exact stored representation, context binding, membership, applicable stored canonicality, and deterministic identity without repairing the artifact. |

## Reference and reader behavior

The reader validates an exact own-property reference shape. It rejects `null`, primitives, arrays, missing fields, whitespace-only fields, extra enumerable/non-enumerable/symbol fields, and accessor properties with `ERR_DECISION_AUTHORITY_REFERENCE_INVALID`. It selects a resolver by the tuple:

```ts
[producerId, authorityContractId]
```

serialized by `JSON.stringify`. The reader captures resolver methods with their receiver at construction. A duplicate or malformed resolver binding fails `ERR_DECISION_AUTHORITY_RESOLVER_CONFLICT`; an unknown binding fails `ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND`.

## Decision Context identity

The context identity implementation uses `createHash("sha256")` over `JSON.stringify(...)`, takes the first 24 hexadecimal characters, uppercases them, and adds the documented prefix.

### Reference key

For canonical ordering and duplicate detection, the reference key is exactly:

```ts
JSON.stringify([
  reference.producerId,
  reference.authorityContractId,
  reference.artifactId,
  reference.locator
])
```

References are sorted by this key using deterministic code-point string comparison.

### `DCI_` item identity

The constructor trims outer whitespace from `statement`, then derives:

```ts
DCI_ + SHA256(JSON.stringify([
  role,
  normalizedStatement,
  canonicalProvenance
])).slice(0, 24).toUpperCase()
```

`canonicalProvenance` is exactly one of:

```ts
["AUTHORITATIVE_STATE", [producerId, authorityContractId, artifactId, locator]]
["HUMAN_INPUT", actorId]
["MODEL_PROPOSAL", proposalRef]
["DETERMINISTIC_DERIVATION", ruleId]
```

Items are sorted by `itemId` with deterministic code-point comparison. Their identity does not depend on array position.

### `DCTX_` context identity

After references and item identities have been canonicalized, the constructor derives:

```ts
DCTX_ + SHA256(JSON.stringify([
  "DECISION_CONTEXT_DRAFT",
  schemaVersion,
  sourceStateReferences.map(sourceStateReferenceKey),
  decisionQuestionId,
  itemIds
])).slice(0, 24).toUpperCase()
```

`schemaVersion` is `"DECISION_CONTEXT_DRAFT_V1"`. `decisionQuestionId` is the one canonical `DECISION_QUESTION` item ID; `itemIds` are in canonical item order. Thus input ordering differences do not create alternate canonical payloads or IDs.

Identity is local structural identity. It does not itself prove semantic truth, authority, reference reachability, completeness, recommendation quality, or human adoption. The current Decision Core has no context persistence route, so `DCI_` and `DCTX_` do not identify independently persisted Decision Core records.

## Structural contract and failure semantics

`createDecisionContextDraft(...)` creates `artifactKind`, schema version, item IDs, question ID, context ID, and `NOT_RUN`; callers do not supply those fields. It returns `structuredClone(draft)`.

`assertDecisionContextDraft(...)` checks the exact top-level shape, source-reference and item shapes, canonical order, uniqueness, recomputed IDs, exactly one question, and structural membership of `AUTHORITATIVE_STATE` provenance references. Relevant current errors are:

| Condition | Error |
| --- | --- |
| Invalid draft/top-level shape or status | `ERR_DECISION_CONTEXT_INVALID` |
| Invalid reference | `ERR_DECISION_CONTEXT_REFERENCE_INVALID` |
| Duplicate or noncanonical references | `ERR_DECISION_CONTEXT_DUPLICATE_SOURCE_STATE_REFERENCE`, `ERR_DECISION_CONTEXT_SOURCE_STATE_REFERENCES_NOT_CANONICAL` |
| Invalid/duplicate/noncanonical item | `ERR_DECISION_CONTEXT_ITEM_INVALID`, `ERR_DECISION_CONTEXT_DUPLICATE_ITEM`, `ERR_DECISION_CONTEXT_ITEMS_NOT_CANONICAL` |
| Item ID mismatch | `ERR_DECISION_CONTEXT_ITEM_ID_MISMATCH` |
| Zero/multiple question or question-ID mismatch | `ERR_DECISION_CONTEXT_DECISION_QUESTION_COUNT`, `ERR_DECISION_CONTEXT_DECISION_QUESTION_ID_MISMATCH` |
| Missing listed reference for `AUTHORITATIVE_STATE` provenance | `ERR_DECISION_CONTEXT_AUTHORITATIVE_REFERENCE_MISSING` |
| Context ID mismatch | `ERR_DECISION_CONTEXT_ID_MISMATCH` |

None of these structural outcomes resolve a producer, inspect payload semantics, or establish semantic support.

## Semantic Evidence Binding identity and operation

`createBoundSemanticEvidenceBinder(reader, evaluator)` captures `reader.resolve.bind(reader)` and `evaluator.evaluate.bind(evaluator)` at construction. `bind(context)` accepts only a `DecisionContextDraft`; it accepts no caller-supplied payload, resolution, reader, resolver, repository, or evaluator.

The binder captures and structurally asserts the complete context. In Stage A it resolves every canonical source-state reference, requires every returned authority resolution envelope/reference to be well-formed and to equal the requested reference exactly, and creates a semantic payload copy. The generic Phase-5A reader does **not** clone arbitrary resolver payloads. Phase 5C2 uses `structuredClone` itself, then rejects a clone containing `SharedArrayBuffer`, a view backed by `SharedArrayBuffer`, or nested shared memory in arrays, objects, `Map`, or `Set`; cyclic/repeated graphs are inspected with cycle protection. A payload that cannot be cloned or safely inspected fails `ERR_DECISION_EVIDENCE_BINDING_PAYLOAD_NOT_DETACHABLE` before evaluator invocation.

Only after every Stage-A reference has resolved, matched, and produced an isolated semantic payload does Stage B invoke the bound evaluator once for each prepared state. The evaluator may propose zero or more item/reference relationships. The binder validates exact proposal shape, requires an existing item ID and the same listed state reference, rejects duplicate item/reference targets, then sorts proposals by `bindingId` using deterministic code-point comparison. The returned array is a detached clone. It remains semantic proposal data, not an authority certificate or validated context artifact.

### `EBIND_` binding identity

The implementation uses `createHash("sha256")` over `JSON.stringify(...)`, takes the first 24 hexadecimal characters, uppercases them, and prefixes `EBIND_`:

```ts
EBIND_ + SHA256(JSON.stringify([
  "SEMANTIC_EVIDENCE_BINDING_V1",
  contextId,
  itemId,
  [producerId, authorityContractId, artifactId, locator],
  disposition
])).slice(0, 24).toUpperCase()
```

`rationale` is trimmed for stored canonical proposal content but is not identity-bearing. Differently worded rationales for the same context, item, state reference, and disposition retain the same `EBIND_`; a different disposition changes it. Provider/model identity, request IDs, timestamps, randomness, and execution order do not participate.

An `EBIND_` identity is local deterministic proposal identity. It does not prove semantic truth, producer authority, completeness, human adoption, recommendation quality, or a structural contradiction.

### Binding failures

| Condition | Error / behavior |
| --- | --- |
| Invalid, hostile, or tampered supplied context | `ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID` |
| Invalid bound reader/evaluator dependency | `ERR_DECISION_EVIDENCE_BINDING_READER_INVALID`, `ERR_DECISION_EVIDENCE_BINDING_EVALUATOR_INVALID` |
| Malformed returned authority resolution envelope/reference, or returned reference differs from request | `ERR_DECISION_EVIDENCE_BINDING_AUTHORITY_REFERENCE_MISMATCH` |
| Payload cannot be detached or contains shared memory | `ERR_DECISION_EVIDENCE_BINDING_PAYLOAD_NOT_DETACHABLE` |
| Invalid evaluator output shape, disposition, or rationale | `ERR_DECISION_EVIDENCE_BINDING_EVALUATION_INVALID` |
| Unknown item | `ERR_DECISION_EVIDENCE_BINDING_ITEM_NOT_FOUND` |
| Malformed, foreign, or mismatched evaluator state reference | `ERR_DECISION_EVIDENCE_BINDING_STATE_REFERENCE_INVALID` |
| More than one proposal for an item/reference target | `ERR_DECISION_EVIDENCE_BINDING_DUPLICATE` |

Phase-5A resolver and producer errors from operation-time resolution are not reclassified by the binder and may propagate.

`AUTHORITATIVE_STATE` provenance does not imply `SUPPORTED`; provenance records origin, whereas a binding records the evaluator's proposed semantic relationship. `HUMAN_INPUT` may be `SUPPORTED`, and `MODEL_PROPOSAL` may be `CONTRADICTED`. No binding is not `NOT_SUPPORTED`: zero proposals are valid and establish neither support, completeness, incompleteness, nor a gap. `CONTRADICTED` is one evaluator-proposed item/state relationship, not the later Phase-5C3 `Contradiction` concept.

## Explicit Structural Expectation contract

Phase 5C3A adds a structural comparison target, not a structural finding. A `StructuralExpectation` is bound to a structurally valid `DecisionContextDraft` under the sealed Phase-5B contract by `contextId`; it embeds neither that draft nor a state payload, binding proposal inventory, reader, resolver, repository, authority token, validated context, or finding. It makes later comparison criteria explicit without performing that comparison.

### Exact kinds and variant semantics

`EVIDENCE_BINDING` has the exact common fields plus `subjectItemId` and `acceptedDispositions`. `subjectItemId` must identify an item in the supplied context. Its non-empty accepted-disposition set contains only sealed Phase-5C2 disposition values and is an explicit future comparison criterion; Phase 5C3A does not inspect `SemanticEvidenceBindingProposal[]`, determine that any binding exists, or determine satisfaction.

`CONTEXT_ROLE` has the exact common fields plus `role` and `minimumCount`. `role` is one sealed `DecisionContextItemRole`; `minimumCount` is a positive safe integer. The artifact says that a later comparison may require at least that count. Phase 5C3A does not count current context items, so an expectation is neither role satisfaction nor a Gap.

`DEPENDENCY` has the exact common fields plus `dependentItemId` and `prerequisiteItemId`. Both IDs must identify distinct items in the supplied context. Its direction is identity-bearing: A depends on B is different from B depends on A. It is an expectation only; Phase 5C3A does not test whether a dependency exists and does not create a Dependency finding.

All variants carry the sealed `DecisionContextItemProvenance` union unchanged. `AUTHORITATIVE_STATE` provenance requires its exact four-field reference to be structurally present in `DecisionContextDraft.sourceStateReferences`; this is membership only. It does not resolve authority, inspect a payload, establish semantic truth, or satisfy an expectation. `HUMAN_INPUT` expectation provenance is not evidence truth, and `MODEL_PROPOSAL` expectation provenance remains proposal state rather than becoming a human requirement.

### `DEXP_` expectation identity

The implementation serializes this exact five-element tuple with `JSON.stringify(...)`, hashes it with SHA-256, takes the first 24 hexadecimal characters, uppercases them, and prefixes that suffix with `DEXP_`:

The exact formula is `DEXP_ + SHA256(JSON.stringify(["STRUCTURAL_EXPECTATION_V1", contextId, kind, canonicalVariantBody, canonicalProvenance])).slice(0, 24).toUpperCase()`.

1. `"STRUCTURAL_EXPECTATION_V1"`
2. `contextId`
3. `kind`
4. `canonicalVariantBody`
5. `canonicalProvenance`

The canonical variant body is `[subjectItemId, canonicalAcceptedDispositions]` for `EVIDENCE_BINDING`, `[role, minimumCount]` for `CONTEXT_ROLE`, and `[dependentItemId, prerequisiteItemId]` for `DEPENDENCY`.

`canonicalProvenance` is exactly `["AUTHORITATIVE_STATE", [producerId, authorityContractId, artifactId, locator]]`, `["HUMAN_INPUT", actorId]`, `["MODEL_PROPOSAL", proposalRef]`, or `["DETERMINISTIC_DERIVATION", ruleId]`.

The identity excludes timestamps, randomness, execution order, rationale, and provider/model metadata beyond explicit provenance. It is local deterministic expectation identity; it does not prove fact, authority, current reachability, semantic support, satisfaction, a finding, a Gap, decision need, priority, recommendation, or human adoption.

### Canonical input and canonical stored artifacts

The `EVIDENCE_BINDING` constructor accepts a valid selected disposition set in any order, rejects duplicates, and stores selected values in the sealed Phase-5C2 disposition order.

That exact stored order is `SUPPORTED`, then `PARTIALLY_SUPPORTED`, then `NOT_SUPPORTED`, then `CONTRADICTED`. Thus a selected set containing NOT_SUPPORTED and SUPPORTED is stored with SUPPORTED first and NOT_SUPPORTED second.

Construction may canonicalize valid input. Assertion must verify that the submitted stored artifact is already canonical: canonical equivalence is not canonical stored-artifact representation.

`assertStructuralExpectation(...)` captures the submitted artifact without mutating it, validates its dispositions, derives expected canonical order, and requires its stored order to already equal that order.

A reordered stored `acceptedDispositions` array with an unchanged ID is a malformed/non-canonical representation and fails `ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID`; assertion neither repairs nor reorders it.

### Structural expectation failures and defensive capture

Construction and assertion use defensive descriptor-based capture. Applicable malformed or hostile values such as missing or extra keys, symbol keys, accessors, sparse arrays, custom array state, invalid descriptors, reflection failures, and cycles where finite contract data is required are rejected. The constructor returns a detached clone: changing caller-owned nested input afterwards does not mutate the returned artifact. Assertion independently rejects hostile stored representations; no deep-freeze or runtime immutability claim is made.

| Condition | Error |
| --- | --- |
| Malformed or tampered supplied `DecisionContextDraft` | `ERR_DECISION_STRUCTURAL_EXPECTATION_CONTEXT_INVALID` |
| General malformed constructor input, invalid kind or role, invalid count, self-dependency, or malformed non-authoritative provenance | `ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID` |
| Referenced item absent from the context | `ERR_DECISION_STRUCTURAL_EXPECTATION_ITEM_NOT_FOUND` |
| Malformed or structurally unlisted `AUTHORITATIVE_STATE` provenance reference | `ERR_DECISION_STRUCTURAL_EXPECTATION_REFERENCE_INVALID` |
| Empty or unknown accepted disposition | `ERR_DECISION_STRUCTURAL_EXPECTATION_DISPOSITION_INVALID` |
| Duplicate accepted disposition | `ERR_DECISION_STRUCTURAL_EXPECTATION_DUPLICATE_DISPOSITION` |
| Stored artifact with otherwise valid canonical structural content but wrong deterministic ID | `ERR_DECISION_STRUCTURAL_EXPECTATION_ID_MISMATCH` |
| Hostile/accessor/symbol representation, unexpected or missing top-level artifact fields, invalid artifact kind/schema version/context ID/kind/expectation-ID shape, unexpected stored keys, or non-canonical stored disposition order | `ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID` |

The `INVALID` code is a stored-representation error, not a blanket mapping for every invalid field in a stored artifact. After safe representation capture, assertion reconstructs variant input through the existing structural input path. Meaningful invalid variant content can still produce `INPUT_INVALID`, `ITEM_NOT_FOUND`, `REFERENCE_INVALID`, `DISPOSITION_INVALID`, or `DUPLICATE_DISPOSITION` in the structural-expectation error namespace. A wrong deterministic ID remains `ERR_DECISION_STRUCTURAL_EXPECTATION_ID_MISMATCH`.

The full specific codes are `ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID`, `ERR_DECISION_STRUCTURAL_EXPECTATION_ITEM_NOT_FOUND`, `ERR_DECISION_STRUCTURAL_EXPECTATION_REFERENCE_INVALID`, `ERR_DECISION_STRUCTURAL_EXPECTATION_DISPOSITION_INVALID`, and `ERR_DECISION_STRUCTURAL_EXPECTATION_DUPLICATE_DISPOSITION`.

Phase 5C3A performs no authority resolution, payload inspection, semantic evaluation, semantic binding execution, satisfaction evaluation, or finding derivation.

## Explicit Structural Relation Proposal contract

Phase 5C3B adds `StructuralRelationProposal`: one caller-supplied `DecisionContextItem` × `DecisionContextItem` relation proposal bound to one structurally valid `DecisionContextDraft` by `contextId`. It embeds neither the context nor item objects, a payload, `SemanticEvidenceBindingProposal`, `StructuralExpectation`, reader, resolver, repository, authority token, validated context, or finding. It represents relation proposal content only: relation proposal is not relation truth or a finding.

The schema version is exactly `"STRUCTURAL_RELATION_PROPOSAL_V1"`; the closed kind set is exactly `CONTRADICTION` and `DEPENDENCY`. There is no batch, persistence, detector, evaluator, analyzer, inference, graph-traversal, or relation-validation operation.

### Exact kinds and variant semantics

`CONTRADICTION` has the common fields plus `itemIds: [string, string]`. Both IDs must identify distinct items in the supplied context. It is a proposed symmetric structural incompatibility relation, not a formal logical contradiction and not a Phase-5C2 `CONTRADICTED` semantic binding. Construction accepts either endpoint order and stores the two IDs in deterministic code-point string order.

`DEPENDENCY` has the common fields plus `dependentItemId` and `prerequisiteItemId`. Both IDs must identify distinct items in the supplied context. Direction is preserved and identity-bearing: A depends on B differs from B depends on A. Separate A -> B and B -> A proposals are structurally representable; Phase 5C3B makes no graph-level cycle judgment or interpretation.

All variants reuse the sealed `DecisionContextItemProvenance` union unchanged. Its origin is identity-bearing but never proves relation truth. `AUTHORITATIVE_STATE` provenance requires only that its exact four-field reference is structurally present in `DecisionContextDraft.sourceStateReferences`; this does not resolve current authority, inspect payloads, execute semantic evaluation, or validate the relation.

### `DREL_` relation-proposal identity

The implementation serializes this exact five-element tuple with `JSON.stringify(...)`, hashes it with SHA-256, takes the first 24 hexadecimal characters, uppercases them, and prefixes that suffix with `DREL_`:

```ts
DREL_ + SHA256(JSON.stringify([
  "STRUCTURAL_RELATION_PROPOSAL_V1",
  contextId,
  kind,
  canonicalRelationBody,
  canonicalProvenance
])).slice(0, 24).toUpperCase()
```

`canonicalProvenance` is exactly one of:

```ts
["AUTHORITATIVE_STATE", [producerId, authorityContractId, artifactId, locator]]
["HUMAN_INPUT", actorId]
["MODEL_PROPOSAL", proposalRef]
["DETERMINISTIC_DERIVATION", ruleId]
```

For `CONTRADICTION`, `canonicalRelationBody` is `[canonicalFirstItemId, canonicalSecondItemId]` in deterministic code-point order. For `DEPENDENCY`, it is `[dependentItemId, prerequisiteItemId]`; direction is not sorted or normalized away.

`DREL_` is local deterministic proposal identity only. It does not establish relation truth, authority, semantic correctness, finding status, decision relevance, priority, recommendation, or human adoption. Timestamp, randomness, execution order, rationale, confidence, score, and provider/model metadata beyond explicit provenance are excluded.

### Constructor canonicalization, stored canonicality, and failures

Construction may canonicalize valid `CONTRADICTION` input. Thus A/B and B/A constructor input produce one canonical proposal and the same `DREL_`. Assertion is stricter: it must verify a submitted stored artifact is already canonical. It never silently repairs or reorders stored endpoints. A stored contradiction with reversed endpoints is an invalid representation even when its retained ID names the canonical equivalent.

Assertion order is exact: capture stored artifact, validate common header, validate the exact kind-specific stored key set, validate variant content, verify stored contradiction canonicality where applicable, then recompute `DREL_` identity. A dependency direction change is not canonicalized; retaining the old ID then fails identity verification.

The constructor and assertion defensively capture data through descriptors. They reject hostile or malformed values such as accessors, symbol keys, missing or unexpected keys, sparse/custom arrays, invalid descriptors, and reflection failures. The constructor returns a detached artifact; this is not a deep-freeze guarantee.

| Condition | Error |
| --- | --- |
| Malformed or tampered supplied `DecisionContextDraft` | `ERR_DECISION_STRUCTURAL_RELATION_CONTEXT_INVALID` |
| General malformed constructor input, invalid kind, self relation, or malformed non-authoritative provenance | `ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID` |
| Relation endpoint absent from the context | `ERR_DECISION_STRUCTURAL_RELATION_ITEM_NOT_FOUND` |
| Malformed or structurally unlisted `AUTHORITATIVE_STATE` provenance reference | `ERR_DECISION_STRUCTURAL_RELATION_REFERENCE_INVALID` |
| Otherwise valid canonical stored proposal with wrong deterministic DREL | `ERR_DECISION_STRUCTURAL_RELATION_ID_MISMATCH` |
| Hostile/malformed stored representation, invalid header, missing/unexpected top-level stored fields, or noncanonical stored contradiction endpoint order | `ERR_DECISION_STRUCTURAL_RELATION_INVALID` |

`INVALID` is a stored-representation error, not a blanket mapping for all stored content. After an exact stored representation shape has been captured, meaningful variant-content errors may preserve `ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID`, `ERR_DECISION_STRUCTURAL_RELATION_ITEM_NOT_FOUND`, or `ERR_DECISION_STRUCTURAL_RELATION_REFERENCE_INVALID`.
