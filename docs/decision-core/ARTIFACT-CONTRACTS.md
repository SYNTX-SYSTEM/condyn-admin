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
