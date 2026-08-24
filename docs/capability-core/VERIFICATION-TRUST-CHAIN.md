# Verification trust chain

## Starting point: untrusted integrity input

`VerifiedCapabilitySnapshotPublisher.publish` accepts only:

```ts
CapabilityVerificationIntegrityInput {
  sourceDocuments,
  discoveryRun,
  convergenceRun,
  verificationRun
}
```

Those objects are **supplied** untrusted caller data. Repository access is not part of this input and cannot be selected by it. Repository authority dependencies and the private Phase-4 persistence closure are fixed during repository-controlled publisher creation via `repository.createVerifiedCapabilitySnapshotPublisher()`.

## Deterministic authentication walkthrough

1. **Authenticate sources.** At least one source document is required. Document IDs must be unique; each document title, normalized text, and normalized-text hash must be valid. For each `SourcePage`, `pageNumber` must be an integer and unique **within its SourceDocument**; `text` and `normalizedText` must be strings; and `normalizedText === normalizeSourceText(text)`. The authenticator recomputes `sourceBundleHash` and `sourceEvidenceRepresentationHash`.
2. **Immediately bind recomputed source state.** The supplied `discoveryRun.sourceBundleHash`, `convergenceRun.sourceBundleHash`, and `verificationRun.sourceBundleHash` must each equal the recomputed `sourceBundleHash`; supplied `verificationRun.sourceEvidenceRepresentationHash` must equal the recomputed source-evidence representation hash.
3. **Authenticate Discovery and reconstruct candidates.** The RUN must have the exact completed-artifact shape and scalar fields, parse `CapabilityKernelOutputSchema`, match kernel version, match `SHA256(stableJsonStringify(kernelOutput))`, and recompute to the RUN ID. Coverage is replayed with `assertCapabilityCoverageAudit`. For every validated kernel capability, the authenticator calls `createCapabilityCandidate(runId, input)` and `verifyCandidateEvidence(candidate, sourceDocuments)`. The candidate inventory embedded in the supplied RUN payload must deep-equal the resulting reconstruction, including EVD identifiers, source refs, locations, quotes, verification status, matched document/page, normalized quote, and source spans. It becomes part of authoritative persisted state only after the later persisted-RUN equality check.
4. **Authenticate Convergence.** CONV must have exact completed-artifact shape/scalars, bind the authenticated RUN ID/raw hash/source bundle, recompute to the CONV ID, parse its structured output, and match the convergence raw-output hash. The authenticator reruns convergence validation and canonicalization using `convergenceRun.createdAt`, then requires exact drafts, proposed relations, candidate inventories, and passed reconciliation state.
5. **Check VFY self-integrity.** VFY must have exact artifact and inference shapes, deterministic VFY ID, valid `sourceEvidenceRepresentationHash` and `convergenceRawOutputHash` formats, canonical payload ordering/shape, and matching VFY `rawOutputHash`. These checks establish only the VFY artifact’s own deterministic form.
6. **Bind VFY to authenticated CONV.** Require `VFY.convergenceRunId === authenticated CONV ID` and `VFY.convergenceRawOutputHash === authenticated CONV rawOutputHash`. Source-bundle and source-representation bindings were already checked immediately after source authentication.
7. **Verify exact VFY coverage.** Every reconstructed draft must have exactly one semantic outcome and exactly one level outcome. Every reconstructed proposed relation must have exactly one relation disposition. Unknown, missing, or duplicate coverage fails closed.
8. **Derive publication eligibility.** `publicationEligibility` is present in the supplied VFY payload but is not trusted as authority. `authenticateCapabilityVerificationRun` derives `ELIGIBLE` iff every semantic definition outcome is `PASSED` and no relation disposition is `UNRESOLVED`; the supplied payload value must equal that result. `REJECTED` dispositions and `UNVERIFIED`/`null` level outcomes do not block eligibility. No verification provider/runtime is implemented in the current module.
9. **Reconstruct authenticated verified-evidence inventory.** Traverse canonical drafts in their existing order, then their evidence IDs in order. Include each referenced verified claim once. Same evidence ID with divergent reconstructed content is invalid; unreferenced evidence is excluded.

At this point the result is an `AuthenticatedCapabilityVerificationChain`: internally consistent, reconstructed, and cloned—but not authoritative for publication and not a Phase-4 publication artifact.

## Authenticated is not authoritative

**Authentication** is deterministic reconstruction and internal consistency of supplied artifacts. It does not select the one immutable artifact state for IDs that intentionally omit timestamps or other payload fields.

**Authority** requires that authenticated RUN, CONV, and VFY each exactly deep-equal their immutable repository records.

`authenticatePersistedCapabilityVerificationRun` therefore reads all three repository artifacts:

```text
persisted RUN  == authenticated RUN
persisted CONV == authenticated CONV
persisted VFY  == authenticated VFY
```

All comparisons use deep structural equality. Missing or deep-inequal records fail with `ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID`. The returned `AuthoritativeCapabilityVerificationChain` carries cloned persisted RUN, CONV, and VFY artifacts. Its TypeScript interface is descriptive only; it is not a branded security token or a write capability. Repository I/O exceptions thrown by authority dependency methods are not normalized by `authenticatePersistedCapabilityVerificationRun`.

`authenticatePersistedCapabilityVerificationRun(input, repository)` is exported and receives its repository authority dependency explicitly. When called independently, its returned chain is authoritative relative to that supplied dependency, not an absolute or caller-portable authority token. This does not create a Phase-4 publication bypass: within the supported Capability Core API of the shipped concrete repositories, `repository.createVerifiedCapabilitySnapshotPublisher()` fixes the repository dependency during publisher construction. `publish()` accepts only `CapabilityVerificationIntegrityInput`, never a repository, an `AuthoritativeCapabilityVerificationChain`, final graph state, or a persistence callback.

## Supported publication from internally established authority

Only after persisted authority succeeds internally does the bound publisher:

1. Require `publicationEligibility === "ELIGIBLE"`.
2. Recompute every PCAP from draft canonical name/scope and promote its suffix to `CAP_`.
3. Copy canonical name, scope, definition, domain, evidence IDs, and provenance only from authenticated drafts.
4. Require exactly one authoritative semantic outcome for each draft; its status must be `PASSED`, then emit `semanticDefinitionStatus: "PASSED"`.
5. Require exactly one authoritative level outcome for each draft; after enforcing the structural level invariant, derive the final level status/value from that outcome.
6. Use only the authenticated verified-evidence inventory, in canonical first-occurrence order.
7. Treat Phase-3 proposal `relationType` and VFY disposition as separate dimensions. `REJECTED` disposition omits any proposal from the final graph. `UNRESOLVED` disposition has already derived `BLOCKED` eligibility. `VERIFIED` disposition promotes a proposal only when its type is `PARENT_CHILD`, `RELATED_CAPABILITY`, or `DISTINCT_CAPABILITY`; a proposal type of `UNRESOLVED` with `VERIFIED` disposition may remain `ELIGIBLE` but final construction fails `ERR_PHASE4_RELATION_NOT_VERIFIED`. Final relation `createdAt` is `verificationRun.completedAt`.
8. Derive snapshot metadata from the chain/VFY, attach Phase-4 publication metadata, and rebuild the special Phase-4 SNAP ID.
9. Run `assertVerifiedCapabilitySnapshot`.
10. Invoke the concrete repository’s JavaScript-private Phase-4 persistence method through the bound closure.
11. After that private persistence call returns successfully, reread by computed snapshot key, require deep equality, and return a `structuredClone` of the persisted snapshot.

No Phase-4 write occurs before persisted authority, eligibility, CAP construction, evidence construction, relation construction, and snapshot validation succeed. A blocked VFY, failed authentication, missing evidence, invalid relation, or invalid snapshot produces no partial publication. `ERR_PHASE4_SNAPSHOT_PERSISTENCE_INVALID` is different: the private Phase-4 persistence call has returned successfully, and the subsequent reread is missing or divergent. If the private persistence call itself throws, this reread error is not generated.

## Authority topology

```text
caller: raw Source/RUN/CONV/VFY input
  -> repository-bound publisher
  -> deterministic reconstruction
  -> persisted RUN/CONV/VFY exact-equality authority
  -> final CAP/evidence/REL/SNAP derivation
  -> repository-private Phase-4 write closure
  -> immutable persistence and reread
  -> detached mutable `structuredClone` of persisted `VerifiedCapabilitySnapshot`
```

Within the supported Capability Core API of the shipped concrete repositories, ordinary callers may obtain the publisher, but cannot obtain a raw writer, privileged store, write symbol, authority token, or caller-built final publication input. `saveSnapshot` remains the generic route and rejects `PHASE4_VERIFIED` snapshots.

## Failure model

The table classifies Phase-4-specific trust-chain/publication errors. Generic snapshot-validation errors emitted by `assertVerifiedCapabilitySnapshot` are not exhaustively enumerated here.

| Reachability class | Error | Current meaning |
| --- | --- | --- |
| Public authentication / authority | `ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID` | Source/RUN/CONV/VFY structural, hash, reconstruction, coverage, or binding failure; also missing or deep-inequal persisted authority artifacts. Repository I/O exceptions are not normalized to this error. |
| Upstream immutable persistence | `ERR_IMMUTABLE_RUN_CONFLICT` | Same RUN identity with divergent payload during RUN save; it does not arise merely from publisher repository reads. |
| Upstream immutable persistence | `ERR_IMMUTABLE_CONVERGENCE_RUN_CONFLICT` | Same CONV identity with divergent payload during CONV save; it does not arise merely from publisher repository reads. |
| Upstream immutable persistence | `ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT` | Same VFY identity with divergent payload during VFY save; it does not arise merely from publisher repository reads. |
| Public publication | `ERR_PHASE4_PUBLICATION_BLOCKED` | Authoritative VFY `publicationEligibility` is `BLOCKED`. A correctly authenticated `UNRESOLVED` disposition has already produced this state. |
| Final-construction defense in depth | `ERR_PHASE4_SEMANTIC_DEFINITION_NOT_PASSED` | Guards both a semantic outcome that is not `PASSED` and failure to find exactly one semantic outcome. `FAILED` normally produces `BLOCKED` eligibility earlier; missing/duplicate coverage normally fails authentication earlier. |
| Final-construction defense in depth | `ERR_PHASE4_LEVEL_TRUTH_INVARIANT` | Guards both failure to find exactly one level outcome and a level status/value structural-invariant violation. Missing/duplicate coverage normally fails authentication earlier; invalid status/value normally fails VFY self-integrity earlier. |
| Final-construction defense in depth | `ERR_PHASE4_PROVISIONAL_ID_MISMATCH` | Draft PCAP does not recompute from canonical name/scope; authenticated convergence reconstruction normally prevents it. |
| Final-construction defense in depth | `ERR_PHASE4_NONDETERMINISTIC_CAPABILITY_ID` | Final CAP promotion produces duplicate final capability identity; authenticated canonical drafts normally prevent it. |
| Final-construction defense in depth | `ERR_PHASE4_EVIDENCE_INVENTORY_INVALID` | Authenticated evidence inventory is missing, duplicate, extra, or non-verified; prior reconstruction normally prevents it. |
| Final-construction defense in depth | `ERR_PHASE4_RELATION_DISPOSITION_MISSING` | Relation disposition coverage or promoted endpoint lookup is invalid; prior coverage/reconstruction normally prevents it. |
| Public publication plus defense in depth | `ERR_PHASE4_RELATION_NOT_VERIFIED` | Reachable for Phase-3 `relationType: UNRESOLVED` plus VFY `VERIFIED` disposition; also guards invalid proposal types and duplicate final relation IDs. |
| Snapshot persistence / reread | `ERR_PHASE4_SNAPSHOT_PERSISTENCE_INVALID` | The private persistence call returned successfully, then snapshot reread was missing or not deeply equal to the expected snapshot. |
| Snapshot immutable persistence | `ERR_IMMUTABLE_SNAPSHOT_CONFLICT` | Same snapshot key with divergent persisted payload. |
| Generic/private route guard | `ERR_PHASE4_SNAPSHOT_REQUIRES_DEDICATED_REPOSITORY` | Generic `saveSnapshot` rejects `PHASE4_VERIFIED`; the private route defensively rejects non-Phase-4 mode. |
