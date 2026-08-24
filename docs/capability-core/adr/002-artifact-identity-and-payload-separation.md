# ADR 002: Artifact identity, payload, and immutability are separate

## Status

Implemented.

## Decision

Each identity is derived from an explicitly defined identity tuple. Fields outside that tuple do not change that artifact's identity. Identity inclusion and exclusion are artifact-specific; an identity-excluded field is a non-identity payload field, not a freely mutable field after persistence.

### Identity matrix

| Artifact | Prefix | Exact local identity tuple | Important local exclusions |
| --- | --- | --- | --- |
| Evidence claim | `EVD_` | `[source_document, location, exact_quote]` | Verification result and matching metadata. |
| Capability candidate | `CAND_` | `[runId, canonical_name, structural_definition, sorted evidenceIds]` | Capability scope, primary domain, demonstrated level, model confidence, evidence mode, verification, and status. |
| Discovery run | `RUN_` | `[sourceBundleHash, kernelVersion, promptChecksum, provider, model, schemaVersion]` | Discovery raw output hash, payload, and timestamps. |
| Convergence run | `CONV_` | `[discoveryRunId, discoveryRawOutputHash, kernelVersion, promptChecksum, provider, model, schemaVersion, algorithmVersion]` | Its own raw output hash, payload, and timestamps. |
| Verification run | `VFY_` | `[convergenceRunId, convergenceRawOutputHash, sourceEvidenceRepresentationHash, kernelVersion, promptChecksum, provider, model, schemaVersion, algorithmVersion, snapshotSchemaVersion]` | Its own raw output hash, source bundle hash, payload/outcomes, and timestamps. |
| Provisional capability | `PCAP_` | Normalized canonical name plus scope. Name normalization is `NFKC` -> trim -> collapse whitespace -> lowercase. | Definition, evidence, provenance, levels, relations, provider, and timestamps. |
| Final capability | `CAP_` | No independent final-payload hash. Phase 4 recomputes the draft `PCAP_` from canonical name and scope, requires it to match, then promotes `PCAP_<suffix>` to `CAP_<suffix>`. | All final-payload fields; `CAP_` does not independently rehash them. |
| Relation | `REL_` | `[sourceCapabilityRef, targetCapabilityRef, relationType]` | Status, reason, `createdBy`, and `createdAt`. |
| Generic snapshot | `SNAP_` | `[sourceBundleHash, kernelVersion, prompt.checksum, inference.provider, inference.model, schemaVersion]` | Graph content and fields outside the generic snapshot key. |
| Phase-4 verified snapshot | `SNAP_` | `["CAPABILITY_VERIFIED_SNAPSHOT_V1", verificationRunId, verificationRawOutputHash]` | Graph content and timestamps do not independently define the Phase-4 snapshot identity. |

The generic snapshot key is:

```text
SHA256(JSON.stringify([
  sourceBundleHash,
  kernelVersion,
  prompt.checksum,
  inference.provider,
  inference.model,
  schemaVersion
]))
```

The Phase-4 verified snapshot key is:

```text
SHA256(JSON.stringify([
  "CAPABILITY_VERIFIED_SNAPSHOT_V1",
  verificationRunId,
  verificationRawOutputHash
]))
```

`SNAP_` therefore has two implemented identity modes. A Phase-4 graph is identified by the immutable verification artifact and the exact verification payload hash that authorized publication, rather than by independently hashing the graph or its timestamps.

“Excluded from identity” means excluded from that artifact's local identity formula. It does not mean the field is systemically irrelevant: for example, provider and model are not direct Phase-4 `SNAP_` key fields, but they influence `verificationRunId` because they are VFY identity inputs.

### Downstream output-commitment chain

The run identities deliberately commit downstream to the preceding artifact's exact structured output without putting that artifact's own output hash into its identity:

- `RUN_` excludes the Discovery raw output hash, while `CONV_` includes the Discovery raw output hash.
- `CONV_` excludes its own raw output hash, while `VFY_` includes the Convergence raw output hash.
- `VFY_` excludes its own raw output hash, while the Phase-4 `SNAP_` key includes both `verificationRunId` and the VFY raw output hash.

This is a chained output-commitment pattern. It must not be reduced to a claim that output hashes are simply excluded.

### Embedded identities and persisted immutable artifacts

The independently persisted immutable top-level artifacts are `RUN_`, `CONV_`, `VFY_`, and `SNAP_`. On their persistence routes:

- the same persistence identity/key and an exactly equal artifact is an idempotent replay;
- the same persistence identity/key and a divergent artifact is an immutable conflict.

`EVD_`, `CAND_`, `PCAP_`, `CAP_`, and `REL_` are embedded identities, not independently persisted repository records with their own persistence conflict routes. Evidence and candidates are contained by runs; provisional capabilities and proposed relations are contained by convergence artifacts; final capabilities and relations are contained by snapshots. Their collisions and duplicates are construction or integrity failures, protected by deterministic reconstruction, collision/duplicate checks, snapshot validation, and immutability of the containing persisted artifact. Final persisted divergence is enforced through `SNAP_` immutability.

### Identity is not authority

Identity alone does not select an authoritative payload state or establish semantic correctness. For `RUN_`, `CONV_`, and `VFY_`:

1. deterministic reconstruction and authentication establish internal consistency;
2. immutable repository persistence selects one stored artifact state for an identity;
3. exact equality with that persisted artifact during persisted authentication establishes the authoritative state used for Phase-4 publication.

Persistence does not prove that a semantic judgment is epistemically correct. It makes one internally valid, immutable artifact state authoritative for the governed publication path.

`VFY_` demonstrates why this distinction is necessary. Its identity intentionally excludes `createdAt`, `completedAt`, `sourceBundleHash`, and its payload/raw-output hash, so syntactically different verification-run artifact states can target the same VFY identity tuple. Self-integrity still binds a payload to its raw output hash; immutable persistence rejects a divergent artifact for the same ID; and persisted authentication requires exact equality with the stored artifact. Thus, same ID does not imply same payload, but the same persisted identity cannot legitimately carry multiple divergent authoritative states.

## Evidence

- `schema.ts` defines `EVD_`, `CAND_`, and `REL_` identities.
- `identity.ts` defines provisional capability structural identity and `PCAP_` construction.
- `discovery/run.ts` defines `RUN_` identity.
- `convergence/run.ts` defines `CONV_` identity.
- `verification/run.ts` defines `VFY_` identity.
- `snapshot.ts` defines generic and Phase-4 `SNAP_` identity modes.
- `repository.ts` implements persisted immutable conflict behavior and `finalCapabilityId`, which promotes the verified draft `PCAP_` suffix to `CAP_`.
- Repository contract tests exercise idempotent replays, divergent immutable conflicts, and persisted-artifact authority.

## Consequence

The identity matrix is local to each artifact. A non-identity field may still be committed by a downstream raw-output hash or identifier, and once it is contained in an immutable persisted artifact it is not freely replaceable.

The following scope checks follow from the implementation:

1. Two VFY payload/timestamp states can target the same VFY ID because those fields are not all VFY identity inputs.
2. Both cannot become the authoritative persisted artifact state for that ID.
3. A Convergence raw output hash is not part of its own `CONV_` ID, but it is bound by VFY identity.
4. A VFY raw output hash is not part of its own `VFY_` ID, but it is bound by the Phase-4 `SNAP_` identity.
5. `PCAP_`, `CAP_`, `REL_`, `CAND_`, and `EVD_` are not independently persisted repository rows.
6. `CAP_` has no separate payload-derived identity algorithm; it promotes the recomputed `PCAP_` suffix.
7. Generic and Phase-4 `SNAP_` identities are different formulas.
8. An identity-excluded field is not freely mutable after persistence.
