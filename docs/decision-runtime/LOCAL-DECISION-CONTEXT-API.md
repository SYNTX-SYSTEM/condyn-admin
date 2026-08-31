# Local Decision Context API Contract v1.0

Status: FROZEN FOR LOCAL FRONTEND INTEGRATION

Implementation baseline: `d66762fcc08733e7bdf65b0e793512727ee791f4`

R4 API seal: `v1.0.0-decision-runtime-r4-local-http-api`

R5 E2E seal: `v1.0.0-decision-runtime-r5-local-http-e2e`

This is the local development backend contract only. It is not a deployment contract, production security contract, full Decision Loop API, current-state API, or latest/head API.

## Supported Endpoints

The complete v1.0 Decision API surface is exactly:

- `POST /api/decision-contexts`
- `GET /api/decision-contexts/{revisionId}`

No other Decision endpoint is part of v1.0.

## POST /api/decision-contexts

The request body is the JSON representation of sealed `DecisionContextDraftInput`. It has exactly these top-level fields:

```json
{
  "sourceStateReferences": ["<AuthoritativeStateReference>"],
  "items": ["<DecisionContextItemInput>"]
}
```

### AuthoritativeStateReference

Each source-state reference has exactly these string fields:

```json
{
  "producerId": "string",
  "authorityContractId": "string",
  "artifactId": "string",
  "locator": "string"
}
```

The `producerId`, `authorityContractId`, `artifactId`, and `locator` values are submitted as represented values. This API does not define a second authority-reference format.

### DecisionContextItem roles

Each item has `role`, `statement`, and `provenance`. The admitted `role` values are exactly:

- `DECISION_QUESTION`
- `OBJECTIVE`
- `CONSTRAINT`
- `OPTION`
- `OBSERVATION`
- `ASSUMPTION`
- `UNCERTAINTY`

### DecisionContextItem provenance variants

Each item provenance is exactly one of these sealed variants:

```json
{ "origin": "AUTHORITATIVE_STATE", "stateReference": "<AuthoritativeStateReference>" }
{ "origin": "HUMAN_INPUT", "actorId": "string" }
{ "origin": "MODEL_PROPOSAL", "proposalRef": "string" }
{ "origin": "DETERMINISTIC_DERIVATION", "ruleId": "string" }
```

The variant origins are:

- `AUTHORITATIVE_STATE`
- `HUMAN_INPUT`
- `MODEL_PROPOSAL`
- `DETERMINISTIC_DERIVATION`

`AUTHORITATIVE_STATE` retains `stateReference`; `HUMAN_INPUT` retains `actorId`; `MODEL_PROPOSAL` retains `proposalRef`; and `DETERMINISTIC_DERIVATION` retains `ruleId`.

### POST transport semantics

JSON is parsed by the HTTP layer. The parsed value is forwarded without semantic normalization to R3 and the sealed Core as the `DecisionContextDraftInput` candidate. The transport does not trim statements, sort user data itself, construct semantic IDs itself, derive Context content from authority payload, infer Decision Need, infer recommendations, or select current/head/latest state. The sealed Core owns canonical Decision Context construction.

### POST success

Successful creation returns HTTP `201` with exactly this top-level shape:

```json
{
  "success": true,
  "revision": <DecisionContextRevision>
}
```

The top-level keys are exactly `success` and `revision`.

`revision` is the complete sealed `DecisionContextRevision` representation:

```json
{
  "artifactKind": "DECISION_CONTEXT_REVISION",
  "schemaVersion": "DECISION_CONTEXT_REVISION_V1",
  "revisionId": "string",
  "previousRevisionId": null,
  "context": {
    "artifactKind": "DECISION_CONTEXT_DRAFT",
    "schemaVersion": "DECISION_CONTEXT_DRAFT_V1",
    "contextId": "string",
    "validationStatus": "NOT_RUN",
    "sourceStateReferences": ["<AuthoritativeStateReference>"],
    "decisionQuestionId": "string",
    "items": [
      {
        "role": "<DecisionContextItemRole>",
        "statement": "string",
        "provenance": "<DecisionContextItemProvenance>",
        "itemId": "string"
      }
    ]
  },
  "validationInput": {
    "expectationValidations": [],
    "consequenceValidations": []
  },
  "validationAssembly": {
    "artifactKind": "DECISION_CONTEXT_VALIDATION_ASSEMBLY",
    "schemaVersion": "DECISION_CONTEXT_VALIDATION_ASSEMBLY_V1",
    "assemblyId": "string",
    "contextId": "string",
    "expectationResults": [],
    "consequenceIds": []
  }
}
```

The R3 root use case constructs this revision with `previousRevisionId: null` and the shown empty validation input. The complete response does not contain `status`, `verified`, `current`, `head`, `latest`, `active`, `authoritative`, `complete`, `decisionReady`, or `loopClosed` convenience fields.

## GET /api/decision-contexts/{revisionId}

The supplied `revisionId` is an exact retrieval key for one persisted `DecisionContextRevision`. It is passed to the bound reader unchanged. The API does not perform current selection, head selection, latest selection, fallback, lineage walking, or descendant search.

### GET success

When that exact key has a stored revision, the API returns HTTP `200` with the same complete `DecisionContextRevision` representation as POST success:

```json
{
  "success": true,
  "revision": <DecisionContextRevision>
}
```

## Public Error Envelope

Every public API error has exactly this shape:

```json
{
  "success": false,
  "error": {
    "code": "<public code>",
    "message": "<public message>"
  }
}
```

| HTTP status | Public code | Public message | Meaning |
| --- | --- | --- | --- |
| 400 | `ERR_DECISION_API_INVALID_JSON` | `Request body must be valid JSON.` | Transport JSON parsing failed. |
| 422 | `ERR_DECISION_API_REQUEST_REJECTED` | `Decision Context request was rejected.` | The submitted request failed an admitted Context/authority gate. |
| 409 | `ERR_DECISION_API_CONFLICT` | `Decision Context revision conflicts with an existing immutable record.` | The operation encountered the sealed immutable revision conflict mapping. |
| 404 | `ERR_DECISION_API_NOT_FOUND` | `Decision Context revision was not found.` | Exact retrieval by the supplied revisionId returned no persisted revision. |
| 500 | `ERR_DECISION_API_INTERNAL` | `Decision Context service failed.` | An internal, runtime, or infrastructure failure is not exposed publicly. |

## Error Boundaries

Internal Decision Core error codes are not frontend contract. Runtime error codes are not frontend contract. Adapter error codes are not frontend contract. Database error messages are not frontend contract. Frontend code branches only on the five public `ERR_DECISION_API_*` codes above.

## Semantic Non-Claims

201 CREATED != CURRENT REVISION

200 GET != CURRENT REVISION

PERSISTED != TRUE

PERSISTED != SEMANTIC CORRECTNESS

HTTP SUCCESS != AUTHORITY OF REALITY

404 != GAP

404 != DECISION NEED

ROOT REVISION != HEAD REVISION

ROOT REVISION != LATEST REVISION

ROOT REVISION != ACTIVE REVISION

AUTHORITY RESOLUTION SUCCESS != CONTEXT CONTENT AUTHORITY

AUTHORITY PAYLOAD != DECISION CONTEXT CONTENT

HTTP RESPONSE != DECISION

HTTP RESPONSE != RECOMMENDATION

## R5 Verified Vertical Path

R5 proved the following local path through a real network and isolated PostgreSQL database:

HTTP POST
-> Next route
-> R4 HTTP transport
-> R4 local composition
-> R3 root Context use case
-> R1 runtime
-> Capability authority lookup
-> sealed Decision Core
-> PostgreSQL DREV persistence
-> HTTP GET

Its strongest equality proof was:

POST revision
==
PostgreSQL stored payload
==
GET revision

R5 also proved: authority rejection -> 422; malformed JSON -> 400; an authority payload-only marker did not enter the Decision revision; and legacy Career Decision lifecycle tables were not provisioned.

## Frontend Integration Rules

Frontend v1.0 may rely on the two route paths, the documented request shape, 201 POST success, 200 GET success, the exact success envelope, the exact five public error codes, the documented public error messages, `revisionId` as the exact retrieval identifier, and complete returned `DecisionContextRevision` data.

Frontend v1.0 must not rely on internal Core/runtime/database error codes, Career lifecycle tables, implicit current/head/latest state, authority payload content, undocumented response properties, or full-loop operations not exposed by this API.

## Out of Scope

- authentication
- authorization
- deployment
- production hardening
- rate limiting
- observability
- full Decision Loop API
- Decision Need API
- Recommendation API
- Human Decision API
- Action/Outcome API
- Observation return-path API
- current/head/latest revision selection
- frontend implementation itself

## Contract Evolution Rule

Any future incompatible change to route, HTTP method, request field contract, success envelope, public error code, public error message, status-code mapping, or DecisionContextRevision wire representation requires an explicit API contract version change or a separately governed compatibility decision. Do not silently mutate v1.0.
