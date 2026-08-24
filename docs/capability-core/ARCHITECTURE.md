# Capability Core architecture

## Purpose and scope

Capability Core is domain-neutral with respect to application domains, while its currently implemented artifact ontology is capability/evidence oriented. It is not an HR matching engine, job matcher, role taxonomy, or decision UI. The current implementation creates auditable capability artifacts; a recruiting projection is future work and is not implemented in this module.

The core deliberately separates semantic proposal content from Phase-4 publication authority. Discovery and Convergence providers may originate canonical name, scope, structural definition, primary domain, evidence proposal fields, and convergence relation type/reason; that content can survive the governed pipeline. CONDYN owns parsing, deterministic identities, literal evidence verification, validation, deterministic reconstruction, chain authentication, persisted-authority establishment, final graph representation/construction, and publication. It does not independently regenerate or epistemically prove all semantic proposal content. `publish()` returns a detached clone of the persisted authoritative Phase-4 snapshot to its caller; the returned object is mutable, but mutating it cannot mutate repository state. Any human decision surface is external and not implemented in this module.

## Layers

| Layer | Responsibility | Principal artifacts |
| --- | --- | --- |
| Source | Normalize source text and retain evidence-relevant page representation. | `SourceDocument`, `SourcePage` |
| Evidence | Resolve a literal quoted claim against a unique document/title and optional page. | `EvidenceClaim` |
| Discovery | Accept structured kernel output, reconcile coverage, construct candidates, and reverify evidence. | `CapabilityDiscoveryRun` / `RUN_` |
| Convergence | Group evidence-passed candidates and propose cross-group relations. | `CanonicalCapabilityDraft` / `PCAP_`, `CapabilityConvergenceRun` / `CONV_` |
| Verification | Carry semantic, level, and relation dispositions; reconstruct and authenticate the entire upstream chain. | `CapabilityVerificationRun` / `VFY_` |
| Publication | Derive `CAP_` capabilities, verified evidence, verified relations, and a Phase-4 snapshot. | `VerifiedCapability`, `CapabilityRelation`, `VerifiedCapabilitySnapshot` / `SNAP_` |
| Persistence | Select one immutable artifact for a deterministic identity and return clones. | capability-run/snapshot repository records |
| Decision surface | Outside current Capability Core scope. It may inspect the audited snapshot; it is not implemented here. | none in this module |

## Forward lifecycle

```text
SourceDocument[]
  -> sourceBundleHash / prompt resolution
  -> provider structured proposal
  -> strict parse / version / coverage validation
  -> deterministic CAND_/EVD_ construction
  -> literal evidence verification
  -> completed Discovery RUN_ (kernel output + reconstructed candidates)
  -> immutable RUN persistence
  -> Convergence CONV_ (groups, drafts, proposed relations)
  -> immutable CONV persistence
  -> Verification VFY_ (outcomes and eligibility)
  -> immutable VFY persistence
  -> persisted-chain authentication
  -> deterministic CAP/evidence/REL/SNAP construction
  -> private Phase-4 snapshot persistence
  -> persisted reread + deep equality
  -> returned detached clone of persisted authoritative Phase-4 snapshot to the caller
```

Within the supported Capability Core API of the shipped concrete repositories, the final Phase-4 entry point is a repository-bound publisher:

```ts
const publisher = repository.createVerifiedCapabilitySnapshotPublisher();
const snapshot = await publisher.publish({
  sourceDocuments,
  discoveryRun,
  convergenceRun,
  verificationRun
});
```

`publish` authenticates all supplied artifacts against immutable repository state before it builds any final graph state. It does not accept capabilities, evidence, relations, publication metadata, or a write capability from the caller.

## Backward traceability

A published snapshot carries final capabilities, evidence, relations, validation counts, and Phase-4 publication metadata (`verificationRunId`, `verificationRawOutputHash`). The VFY points to a CONV identity and raw-output hash; CONV points to a RUN identity and discovery raw-output hash; RUN and CONV share the authenticated source-bundle hash. The publisher replays the source-to-candidate and candidate-to-convergence reconstruction before publication.

For a final capability, trace backwards as follows:

```text
CAP_ capability
  -> PCAP_ draft provenance and evidence IDs
  -> candidate IDs and verified evidence claims
  -> SourceDocument doc ID, optional page number, normalized quote, and span
  -> normalized source text/page representation
```

For a final relation, trace backwards through the VFY relation disposition to its Phase-3 proposed `REL_`; the final relation is deliberately re-identified after PCAP-to-CAP endpoint promotion.

## Trust boundaries

1. **Provider boundary.** Discovery and convergence provider responses are strict structured proposals. They are parsed, version-checked, reconciled, and cannot directly establish Phase-4 publication authority.
2. **Evidence boundary.** Literal evidence is recomputed with `verifyCandidateEvidence`; persisted candidate verification fields must exactly equal that reconstruction during Phase-4 authentication.
3. **Artifact boundary.** A shape-valid artifact is only *authenticated* after deterministic reconstruction succeeds. It is only *authoritative* when that authenticated state exactly deep-equals the immutable persisted RUN, CONV, and VFY records.
4. **Publication boundary.** The caller provides only raw integrity artifacts. Within the supported API of the shipped concrete repositories, the repository-bound publisher owns final CAP/evidence/relation/snapshot derivation.
5. **Write boundary.** Generic `saveSnapshot` rejects `PHASE4_VERIFIED`. The shipped concrete repositories retain a JavaScript-private Phase-4 persistence method captured only by the bound publisher; no public store or writer is exported by the supported Capability Core modules.

## Provider and prompt boundary

Discovery and convergence each have a provider interface and a dedicated Gemini implementation. The Gemini implementations require an explicit non-empty model, make one `generateContent` call per `execute`, request `application/json`, parse JSON, and parse the corresponding strict Zod schema. A present completion reason must be `STOP`; malformed/truncated/invalid structured output fails closed. There is no provider fallback, alternate-model cascade, retry, continuation, tool use, grounding, or web access in these implementations.

Both Gemini response schemas are derived from their Zod output schemas with a 2019-09 projection. The projection unwraps a root `$ref` when needed, uses `$defs`, and removes Gemini-incompatible `$schema`, `minLength`, `pattern`, and `default` keywords without removing required fields, enums, numeric bounds, object/array structure, or `additionalProperties` semantics.

The active-prompt resolvers return plaintext only to prompt construction. Persisted RUN/CONV metadata records prompt template/version identifiers and checksum, not plaintext kernel content. The executable prompt tests also assert that test secret markers do not survive in persisted/reused artifacts.

## Proposal and Phase-4 publication state

`CapabilityCandidate` and `CanonicalCapabilityDraft` are not `VerifiedCapability`. Candidate evidence is literal-source verified, but a canonical draft remains a Phase-3 semantic convergence result with `semanticDefinitionStatus: "NOT_RUN"`. Final CAP construction requires a persisted VFY with complete outcomes and `publicationEligibility: "ELIGIBLE"`.

The current code does **not** implement a verification provider, semantic-definition judge, L1–L6 rubric, or human override workflow. It authenticates the immutable VFY artifact and enforces its deterministic structural, coverage, and publication rules. Consequently, it documents the VFY as the current audit input to publication, not as evidence that a semantic judging runtime exists.

## Reachable states

Structural validity and legitimate runtime reachability are distinct:

| State | Structural status | Reachability/status |
| --- | --- | --- |
| `SourceDocument[]` is empty | A hash can be computed for an empty array. | Invalid for Discovery and Phase-4 authentication: `ERR_CAPABILITY_DISCOVERY_NO_SOURCES` / `ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID`. |
| One or more valid sources and zero discovered capabilities | Valid. | Valid zero graph: empty candidates, groups, drafts, relations, and evidence can produce an `ELIGIBLE` VFY and an empty persisted Phase-4 publication snapshot. |
| Evidence-rejected candidate | Valid Discovery result. | Excluded from convergence eligibility; retained in the RUN and counts. |
| Completed VFY with `BLOCKED` eligibility | Valid immutable audit artifact. | Cannot publish a Phase-4 snapshot. |
| `UNRESOLVED` relation | Valid convergence/VFY audit state. | Blocks Phase-4 publication; never enters the final Phase-4 relation graph. |

## Generic core and recruiting

Current identities and artifacts are capability/evidence oriented: they do not contain job, role, organization, vacancy, applicant, match-score, or hiring-decision fields. A recruiting projection is future, non-implemented work and is not part of the current core publication model. No recruiting projection or human decision UI is implemented or documented as existing behavior.
