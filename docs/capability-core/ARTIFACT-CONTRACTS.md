# Capability Core artifact contracts

## Identity table

| Artifact | Prefix | Local identity inputs | Locally excluded inputs | Persistence / construction enforcement |
| --- | --- | --- | --- | --- |
| Evidence claim | `EVD_` | source document, location, exact quote | verification result/status | Embedded in candidate/RUN payload; no independent repository persistence |
| Capability candidate | `CAND_` | RUN ID, canonical name, structural definition, sorted evidence IDs | scope, primary domain, demonstrated capability level, model confidence, evidence mode, verification/status | Embedded in RUN; exact complete candidate payload is protected by RUN immutability |
| Discovery run | `RUN_` | `sourceBundleHash`, `kernelVersion`, prompt checksum, provider, model, schema version | payload, raw output hash, candidates, timestamps | Same ID + divergent payload: `ERR_IMMUTABLE_RUN_CONFLICT` |
| Convergence run | `CONV_` | discovery run ID, discovery raw-output hash, kernel version, prompt checksum, provider, model, schema version, algorithm version | convergence payload/raw output, timestamps | Same ID + divergent payload: `ERR_IMMUTABLE_CONVERGENCE_RUN_CONFLICT` |
| Verification run | `VFY_` | convergence run ID, convergence raw-output hash, source-evidence representation hash, kernel version, prompt checksum, provider, model, schema version, algorithm version, snapshot schema version | VFY payload/raw output, eligibility, timestamps, source bundle hash | Same ID + divergent payload: `ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT` |
| Provisional capability | `PCAP_` | normalized canonical name and scope | definition, evidence, level, relations, provider, timestamps | Embedded in immutable CONV; collision across groups is construction enforcement: `ERR_CAPABILITY_CONVERGENCE_ID_COLLISION` |
| Final capability | `CAP_` | authenticated PCAP 24-hex suffix | definition, evidence, level, relations, provider, timestamps | Embedded in SNAP; duplicate promotion is construction enforcement: `ERR_PHASE4_NONDETERMINISTIC_CAPABILITY_ID` |
| Relation | `REL_` | source capability reference, target capability reference, relation type | status, reason, creator, timestamp | Proposed REL is embedded in CONV; final REL is embedded in SNAP. Duplicate final REL is construction enforcement: `ERR_PHASE4_RELATION_NOT_VERIFIED` |
| Generic snapshot | `SNAP_` | source bundle hash, kernel version, prompt checksum, provider, model, schema version | graph state is not separately listed because generic key predates Phase 4 | Same key + divergent payload: `ERR_IMMUTABLE_SNAPSHOT_CONFLICT` |
| Phase-4 snapshot | `SNAP_` | verification run ID, verification raw-output hash, fixed Phase-4 discriminator | graph content, evidence, relations, source hash, timestamps, provider/model directly | Same key + divergent payload: `ERR_IMMUTABLE_SNAPSHOT_CONFLICT` |

The deterministic IDs documented here—`EVD_`, `CAND_`, `RUN_`, `CONV_`, `VFY_`, `PCAP_`, `REL_`, and `SNAP_`—use the first 24 uppercase hex characters of their SHA-256 key. `CAP_` reuses the authenticated PCAP hash suffix; it does not independently hash a final capability payload.

## Exact formulas

```text
sourceBundleHash = SHA256(JSON.stringify(
  SourceDocument[] sorted by docId code-point order,
  projected to { docId, normalizedTextHash }
))

EVD key = SHA256(JSON.stringify([
  source_document, location, exact_quote
]))

CAND key = SHA256(JSON.stringify([
  runId, canonical_name, structural_definition, sorted evidenceIds
]))

RUN key = SHA256(JSON.stringify([
  sourceBundleHash, kernelVersion, promptChecksum,
  provider, model, schemaVersion
]))

CONV key = SHA256(stableConvergenceJsonStringify([
  discoveryRunId, discoveryRawOutputHash, kernelVersion, promptChecksum,
  provider, model, schemaVersion, algorithmVersion
]))

VFY key = SHA256(stableVerificationJsonStringify([
  convergenceRunId, convergenceRawOutputHash, sourceEvidenceRepresentationHash,
  kernelVersion, promptChecksum, provider, model, schemaVersion,
  algorithmVersion, snapshotSchemaVersion
]))

PCAP key = SHA256(`${NFKC(name).trim().collapseWhitespace().lowercase()}|${scope}`)
CAP ID = "CAP_" + PCAP hash suffix

REL key = SHA256(JSON.stringify([
  sourceCapabilityRef, targetCapabilityRef, relationType
]))

Generic SNAP key = SHA256(JSON.stringify([
  sourceBundleHash,
  kernelVersion,
  prompt.checksum,
  inference.provider,
  inference.model,
  schemaVersion
]))

Phase-4 SNAP key = SHA256(JSON.stringify([
  "CAPABILITY_VERIFIED_SNAPSHOT_V1",
  verificationRunId,
  verificationRawOutputHash
]))
```

For Phase-4 snapshots, graph content is intentionally absent from the SNAP key. One immutable VFY artifact authorizes one snapshot identity; a divergent graph for that identity is a persistence conflict, not a new snapshot identity. The generic and Phase-4 modes therefore have separate local SNAP key formulas.

### Local identity is not systemic irrelevance

“Excluded from identity” means excluded from that artifact’s **local** identity formula. It does not mean the field cannot affect a downstream identity through an authenticated upstream identifier or raw-output hash. For example, provider/model are not direct Phase-4 SNAP key fields, but they influence `verificationRunId` because they are VFY identity inputs.

## Hash semantics

### `sourceBundleHash`

`computeSourceBundleHash` preserves the Phase-1–3 source-bundle contract. It binds only the sorted `(docId, normalizedTextHash)` inventory. It does **not** bind title, page presence/boundaries/numbers, MIME type, raw-content hash, or metadata.

### `sourceEvidenceRepresentationHash`

Phase 4 adds a separate source representation hash because evidence resolution observes fields not captured by `sourceBundleHash`.

```text
SHA256(stableVerificationJsonStringify(
  documents sorted by docId code-point order, each as {
    docId,
    title,
    normalizedTextHash,
    pagesPresent: pages !== undefined,
    pages: pages sorted by numeric pageNumber as [
      pageNumber,
      SHA256(page.normalizedText)
    ]
  }
))
```

It requires unique document IDs, recomputed document normalized-text hashes, unique page numbers, and `page.normalizedText === normalizeSourceText(page.text)`. It binds title and distinguishes absent pages from an empty page array. It intentionally does **not** bind MIME type, raw-content hash, metadata, or raw page text separately from its validated normalized representation.

### Payload hashes

| Hash | Formula / purpose |
| --- | --- |
| Discovery `rawOutputHash` | `SHA256(stableJsonStringify(kernelOutput))`; binds validated provider kernel output. |
| Convergence `rawOutputHash` | `SHA256(stableConvergenceJsonStringify(validatedConvergenceOutput))`; binds validated grouping/relation proposal output. |
| Verification `rawOutputHash` | `SHA256(stableVerificationJsonStringify(canonicalVerificationPayload))`; binds sorted outcomes/dispositions and eligibility. |

The three stable serializers preserve array order and sort object keys using explicit code-point comparison. VFY payload canonicalization also requires its persisted arrays already be sorted by provisional capability ID or relation ID.

## Principal artifacts

### `SourceDocument`

- **Purpose/creator:** normalized source record, normally created by `createSourceDocument`; optional pages are created with normalized page text.
- **Owner:** source ingestion caller; Phase 4 authenticates the evidence-relevant representation.
- **Identity/bindings:** contributes to source bundle and Phase-4 source evidence representation hashes.
- **Mutability/persistence:** no dedicated Capability Core persistence method in this module; passed as integrity input.
- **Consumers:** evidence resolver, Discovery, Phase-4 authentication.

### `EvidenceClaim` / `EVD_`

- **Purpose/creator:** deterministic claim created from `[source_document, location, exact_quote]` in kernel evidence input.
- **Owner:** CONDYN owns ID and verification result; provider chooses only the proposal fields.
- **Verification:** source document ID is preferred, title fallback must be unique; quote is normalized for matching; declared page is enforced when present.
- **Consumers:** candidate status, draft evidence union/provenance, authenticated final evidence inventory.
- **Failure:** nonmatching/ambiguous source becomes a rejected verification state; final snapshot requires referenced verified evidence.

### `CapabilityCandidate` / `CAND_`

- **Purpose/creator:** deterministic Discovery proposal record from RUN ID, canonical name, structural definition, and sorted EVD fingerprints.
- **Identity:** `SHA256(JSON.stringify([runId, canonical_name, structural_definition, sorted evidenceIds]))`. Scope, primary domain, demonstrated level, model confidence, evidence mode, and verification/status are excluded from this local formula.
- **Owner:** Discovery runtime constructs it and re-verifies every evidence claim.
- **Bindings:** candidate `runId`, semantic proposal fields, evidence claim source identities, and evidence-derived status.
- **Consumers:** Convergence eligibility and Phase-4 exact reconstruction.
- **Status:** `EVIDENCE_PASSED` iff at least one claim is `VERIFIED`; otherwise `EVIDENCE_REJECTED`.
- **Persistence:** not independently persisted; the complete candidate inventory is embedded in immutable RUN payload and must exactly match Phase-4 reconstruction.

### `CapabilityDiscoveryRun` / `RUN_`

- **Purpose/creator:** immutable record of validated kernel output, reconstructed candidates, and passed coverage audit.
- **Owner:** Discovery runtime; repository persists/reuses it append-only.
- **Identity:** RUN formula in the table above.
- **Bindings:** source bundle, resolved prompt checksum, explicit provider/model, schema version, kernel version, and raw kernel-output hash.
- **Downstream:** Convergence and Phase-4 authentication replay kernel parsing, coverage, candidate construction, and evidence verification.
- **Conflict:** `ERR_IMMUTABLE_RUN_CONFLICT`.

### `CanonicalCapabilityDraft` / `PCAP_`

- **Purpose/creator:** Phase-3 canonical convergence draft for one validated group.
- **Owner:** canonicalizer deterministically derives PCAP, verified-evidence union, candidate provenance, document provenance, and `NOT_RUN` semantic status.
- **Identity:** normalized canonical name + scope only; a PCAP mismatch is rejected before final promotion.
- **Downstream:** VFY outcome coverage and final CAP construction.
- **Mutable/immutable:** embedded in immutable CONV payload; not a final verified capability.

### `CapabilityConvergenceRun` / `CONV_`

- **Purpose/creator:** immutable semantic convergence artifact containing validated output, drafts, proposed relations, and candidate inventories.
- **Owner:** Convergence runtime plus deterministic validator/canonicalizer; repository persists/reuses it append-only.
- **Identity:** CONV formula in the table above.
- **Bindings:** authenticated RUN ID/raw hash and source-bundle hash; validated output raw hash; prompt/provider/model/schema/algorithm metadata.
- **Downstream:** Phase-4 reconstructs the exact canonical drafts, relations, eligible/excluded inventories, and reconciliation result.
- **Conflict:** `ERR_IMMUTABLE_CONVERGENCE_RUN_CONFLICT`.

### `CapabilityVerificationRun` / `VFY_`

- **Purpose/creator:** immutable audit artifact for semantic definition outcomes, level outcomes, relation dispositions, and publication eligibility. A creation/provider runtime is not implemented in the current module.
- **Owner:** repository validates VFY self-integrity before save; Phase-4 authentication binds it to reconstructed source/RUN/CONV state.
- **Identity:** VFY formula in the table above; excludes raw output, outcomes, eligibility, source bundle, and timestamps.
- **Payload hash:** canonical outcome/disposition arrays plus `publicationEligibility`.
- **Downstream:** final publisher requires exact persisted authority, complete coverage, and derived eligibility.
- **Conflict:** `ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT`.

### `VerifiedCapability` / `CAP_`

- **Purpose/creator:** final Phase-4 capability built only inside the repository-bound publisher.
- **Owner:** CONDYN publisher; callers cannot supply it as publication input.
- **Identity:** authenticated PCAP suffix promoted to CAP namespace.
- **Bindings:** exact draft canonical fields/evidence/provenance; one passed semantic outcome; one exact level outcome; final relation IDs added from promoted relations.
- **Downstream:** final verified snapshot and the snapshot caller. Any human decision surface is external and unimplemented.

### `CapabilityRelation` / `REL_`

- **Purpose/creator:** deterministic directed relation between capability references.
- **Owner:** Phase 3 proposes PCAP-endpoint relations; Phase 4 derives final CAP-endpoint relations for verified dispositions.
- **Identity:** endpoint references plus relation type only.
- **Bindings:** final promotion requires both VFY disposition `VERIFIED` and proposal relation type `PARENT_CHILD`, `RELATED_CAPABILITY`, or `DISTINCT_CAPABILITY`. The final relation uses proposal reason/creator, `status: VERIFIED`, and VFY `completedAt` (not proposal time). A Phase-3 `UNRESOLVED` type with `VERIFIED` disposition fails `ERR_PHASE4_RELATION_NOT_VERIFIED`; `REJECTED` and `UNRESOLVED` disposition behavior is defined in `INVARIANTS.md`.
- **Downstream:** snapshot relation index on both endpoints.

### `VerifiedCapabilitySnapshot` / `SNAP_`

- **Purpose/creator:** generic snapshot artifact with `DRAFT`, `VERIFIED`, or `SUPERSEDED` state. The generic constructor remains compatible with manual/Phase-1 snapshots; the Phase-4 publisher builds the separately authoritative persisted `PHASE4_VERIFIED` snapshot state.
- **Owner:** Phase-4 repository-bound publisher owns final construction and private write; generic repository route rejects Phase-4 mode.
- **Identity:** Phase-4 SNAP formula above when publication metadata exists.
- **Bindings:** source bundle from authenticated sources; kernel/prompt/provider/model from VFY; snapshot schema version from `VFY.snapshotSchemaVersion`; counts from reconstructed Discovery; timestamp from `VFY.completedAt`.
- **Persistence:** Within the supported API of the shipped concrete repositories, Phase 4 uses private write, then `getSnapshotByKey`, deep equality check, and returns a detached mutable `structuredClone` of the persisted Phase-4 publication artifact. Mutating that returned object cannot mutate repository state.
- **Conflict:** `ERR_IMMUTABLE_SNAPSHOT_CONFLICT`; reread failure is `ERR_PHASE4_SNAPSHOT_PERSISTENCE_INVALID`.
