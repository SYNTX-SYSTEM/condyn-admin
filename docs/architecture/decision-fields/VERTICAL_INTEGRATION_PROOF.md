# Vertical Integration Proof: G2 Generic Decision Core with G3 Career Canonical Producers

Status: DEFINED. Stages P1, P2, P3, P5, P8 IMPLEMENTED AND RUN GREEN on
`integration/g2-producer-adapters` (see section 4). Stages P0, P4, P6, P7 not implemented.

This proof is the acceptance condition for the relation recorded in
[G2_G3_FIELD_RELATION.md](./G2_G3_FIELD_RELATION.md). It is dependency
driven: every unknown dependency extends the proof surface, so each stage
names what it proves and what it does not.

## 0. Environment and preconditions

- Isolated PostgreSQL database per run, created and dropped by the suite,
  following `test/decision-runtime/e2e/local-decision-context-http.e2e.test.ts`.
  Never the shared `condyn` database.
- Schema: G2 `decision_context_revisions` plus the G3 T11 registration order
  (`lib/career/db/t11-persistence-schema.ts`) plus the SIL lineage tables.
  Provisioning order is itself under test (stage P0).
- Provider-free. Capability Core `SNAP_` is seeded as a persisted
  `PHASE4_VERIFIED` fixture (`phase4Snapshot()` from the R5 e2e). No Gemini call.
- Fixtures are built with the pure `create*` functions of both fields and
  persisted through their own repositories; no row is written by raw SQL
  except the seeded snapshot.
- Worktree: `condyn-admin-g2-producers` for P1 to P3 and P5; `condyn-admin-g3-binding`
  for P4 and P6; the full chain P7 runs in whichever worktree merges both.

## 1. Stages

Each stage lists: proof kind, RED condition, GREEN condition, falsifier, non-claim.

### P0 Provisioning order

- Kind: INTEGRATION PROOF.
- RED: fresh database, run startup registration; any `CREATE TABLE` fails on a missing referenced table, or `decision_context_revisions` is absent after startup.
- GREEN: all G2 and G3 tables exist after one startup call; `information_schema.referential_constraints` shows no constraint whose referencing table and referenced table belong to different fields.
- Falsifier: a foreign key from a `career_*` or G3 table to `decision_context_revisions`, or the reverse, fails the stage.
- Non-claim: table existence is not data correctness.

### P1 Resolver local proof, one block per G3 family

Families: RCP, EIS, TSN, RRL, TRQREV, TRPREV, TOREV, ORL, CRRES, AOC, SCD, COVD, COVFCR.

- Kind: LOCAL PROOF, mirroring `test/decision-core/authority/capability-core-adapter.test.ts`.
- GREEN, per family:
  1. accepts a persisted exact artifact and returns `structuredClone` equal to the stored payload;
  2. rejects a missing artifact with `ERR_DECISION_AUTHORITY_STATE_NOT_FOUND`;
  3. rejects a stored payload whose identity no longer recomputes (`ERR_DECISION_AUTHORITY_STATE_INVALID`);
  4. rejects `artifactId` or `locator` mismatch (`ERR_DECISION_AUTHORITY_ARTIFACT_REFERENCE_MISMATCH`);
  5. rejects a reference whose `producerId` or `authorityContractId` is not this resolver's pair (`ERR_DECISION_AUTHORITY_RESOLVER_NOT_FOUND`);
  6. the returned payload is detached: mutating it does not change a second resolution;
  7. the bound read capability stays live for append-only repository growth.
- RED precondition: the resolver module does not exist.
- Falsifier: CRREL offered as an artifact family must be rejected by construction (no resolver), because its identity excludes the evaluation.
- Non-claim: resolution success is not semantic support and not Context content.

### P2 Reader composition and namespace

- Kind: LOCAL PROOF.
- GREEN: `createBoundAuthoritativeStateReader([capability, ...g3Resolvers])` resolves each family; an unknown pair fails; a duplicate pair is rejected at construction; a 24-hex `DAINT_` reference under the G3 action-intent pair fails and a 32-hex `DAINT_` under any G2 pair fails.
- Falsifier: any resolver that accepts an id by prefix alone.
- Non-claim: nothing about payload meaning.

### P3 Root context from G3 state over HTTP

- Kind: INTEGRATION PROOF, extending the R5 e2e (`local-decision-context-http.e2e.test.ts`).
- Seed: SNAP_, TOREV, TRPREV, TRQREV, TRQINV, RRA, RRL, TSN, EIS, RPR, RCP persisted through G3 repositories; one RCP item `PROPOSED`.
- GREEN:
  1. the HR context layer produces a `DecisionContextDraftInput` with `sourceStateReferences` naming SNAP_, RCP, EIS, TSN, RRL, TRPREV and OPTION items whose provenance is `AUTHORITATIVE_STATE` to the RCP with an item-ordinal locator;
  2. `POST /api/decision-contexts` returns 201; the stored payload equals the GET payload equals the POST response;
  3. the stored `DREV_` contains no G3 payload field (marker check: a sentinel string placed only inside the RCP payload is absent from the revision JSON);
  4. the same POST with the RCP row deleted returns 422 `ERR_DECISION_API_REQUEST_REJECTED`;
  5. malformed JSON returns 400; the five public error codes are the only codes observed;
  6. `test/decision-runtime/api/local-api-contract-freeze.test.ts` still passes unchanged.
- Falsifier: a response or stored revision containing `current`, `head`, `latest`, `authority`, `verified`, or any RCP payload field.
- Non-claim: 201 is not a decision, not a recommendation, not currentness.

### P4 Decision context binding (R4)

- Kind: LOCAL PROOF plus PERSISTENCE PROOF in G3 style.
- GREEN: the binding artifact is constructed only from one DCTXREV and one `DREV_` returned by the reader; identity recomputes from both bodies minus `createdAt`; persist is idempotent for the same payload; divergent payload raises the family `*_IMMUTABLE_CONFLICT`; the stored row has no foreign key to `decision_context_revisions`; BYTE and SEMANTIC replay pass; the reader returning `null` fails binding with a named error.
- Falsifier: a binding constructed from a caller-supplied `DREV_` object instead of a reader read.
- Non-claim: binding is not currentness, not acceptance, not decision authority.

### P5 Claims from G3 declarations (R5)

- Kind: LOCAL PROOF.
- GREEN: `createActionOccurrenceClaim` with `AUTHORITATIVE_STATE` source naming an AOC and `createStateChangeClaim` naming an SCD preserve the four reference fields exactly, untrimmed, and invoke no resolver (spy on the reader proves zero calls); 8C2, 8C3 and 8D1 accept `AUTHORITATIVE_STATE` provenance naming ASCAD, CORD, COVD; a separate adapter-level reachability probe resolves the same references through P1 resolvers.
- Falsifier: a claim whose construction calls a resolver.
- Non-claim: claim is not fact; reachability is not truth.

### P6 HR decision path in G3 against a bound context

- Kind: INTEGRATION PROOF, in memory then PostgreSQL.
- GREEN: DAR, DCTXREV, binding (P4), DCR for each of the five declaration classes where admissible, DAINT, HCOM, EAGR, ECTXREV, AOC, SCD, ASCAD, CORD, COVD for all four valences; every admission actor check holds; a declarant not named in the DAR fails with `ERR_HUMAN_DECISION_DECLARANT_MISMATCH`; a declaration outside the DAR window fails with `ERR_HUMAN_DECISION_AUTHORITY_NOT_APPLICABLE`.
- Falsifier: a DCR admitted without a DAR, or two DCRs claimed as the decision for one DCTXREV without conflict semantics being named.
- Non-claim: nothing about execution truth or outcome truth.

### P7 Full loop: root DREV to child DREV through G3

- Kind: INTEGRATION PROOF plus INVERSE PROOF.
- Forward GREEN: root `DREV_` (P3) → binding (P4) → G3 chain (P6) → 8B and 8C1 from AOC and SCD (P5) → 8C2 → 8C3 → 8D1 → 8D2 → 8D3 → 8D4A with `targetRevisionId` = root → 8D4B → 8D5 → 8D6 → 8D7 → 8D8 → 8D9 → 8D10 persisted child `DREV_` with `previousRevisionId` = root; `test/decision-core/revision-lineage` reconstruction from child to root succeeds.
- Inverse GREEN: from the child `DREV_` in a fresh process, walk observation provenance to COVD, to AOC, to DCR, to the binding, to the root `DREV_`, by exact ids only; no step orders by timestamp or selects a latest row.
- Property checks: no artifact or response carries `current`, `head`, `latest`, `accepted`, `authority`, `loopClosed`, `success`.
- Falsifier: any step that discovers its predecessor by search rather than exact id.
- Non-claim: structural closure is not execution proof, causation, outcome truth, feedback or learning.

### P8 Preservation and regression

- Kind: PRESERVATION PROOF and REGRESSION PROOF.
- GREEN, each count unchanged and green: `test/decision-core` 38 files / 403 tests; `test/career/capability-core` 28 / 272; `test/decision-runtime` plus `test/decision-adapters` 8 / 39; G3 suites at their base count; `test/decision-core/authority/contract.test.ts` import-boundary cases; `lib/decision-core/**` byte-identical to `v1.0.0-decision-core-phase8e2-occurrence-return-binding` for production files.
- Falsifier: any diff under `lib/decision-core`, any new import of `career` from it, any change to the API v1 wire shape.

## 2. Pass criterion

The vertical proof passes when P0 through P8 are GREEN in one isolated
database in one run, and the inverse walk in P7 succeeds in a second process
against the same database. A GREEN run proves the relations named above and
nothing else.

## 3. Explicitly not proven

Authentication, authorization of HTTP principals, deployment routing
(`deploy/nginx/admin.condyn.eu` sends `/api/` to port 8002), provider
inference, frontend rendering, learning, policy promotion, and the Case 3
decisions D1 to D5 in the relation document. Where D1 or D2 is decided
differently from the recorded recommendation, P6 and P7 are redefined before
implementation.

## 4. Run record

- 2026-10-09, `integration/g2-producer-adapters`: P1 (fifteen families, ASCAD and CORD
  added as eligible provenance), P2, P3, P5 and P8 are real tests in
  `test/decision-integration/g2-g3-vertical-proof.test.ts` and ran GREEN in one isolated
  database per run; P0, P4, P6, P7 remain `it.todo`. Counts, boundaries and the exact
  HTTP statuses observed are recorded in
  [G2_PRODUCER_INTEGRATION.md](./G2_PRODUCER_INTEGRATION.md). Two observations amend the
  expectations above: the base `435a112` carries `test/career/capability-core` 37 files /
  309 tests and `test/decision-runtime` 7 files plus `test/decision-adapters` 1 file / 39
  tests; and the sealed transport answers 500, not 422, when a resolver is absent or a
  stored G3 row no longer recomputes (boundary B1 in the integration document).
