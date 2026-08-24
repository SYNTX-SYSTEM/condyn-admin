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
