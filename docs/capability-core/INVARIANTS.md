# Capability Core invariants

This document records enforcement that exists in the current implementation. “No dedicated code” means the rule is a boundary/property of this module rather than an emitted error condition.

| Rule | Why | Enforcement location | Failure mode / contract |
| --- | --- | --- | --- |
| Provider output is proposal, not direct Phase-4 publication authority. | A provider cannot choose CAP IDs, final relation IDs, snapshot metadata, or a Phase-4 write route. Evidence membership is not provider-authoritative: provider-proposed claim fields are deterministically verified and reconstructed before publication. | Discovery/convergence runtime; repository-bound publisher. | Strict schema/coverage/reconciliation failures; publication builds only from authenticated chain. `phase4-contract.test.ts`. |
| Literal evidence verification is deterministic. | A quote must be located in a unique source/title and, when applicable, the declared page. | `evidence-validator.ts`; replayed in `verification/authenticator.ts`. | Rejected evidence status or `ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID`. `evidence-validator.test.ts`, `integrity-contract.test.ts`. |
| Candidate status reflects evidence outcome. | `EVIDENCE_PASSED` means at least one verified claim; rejected means none. | `verifyCandidateEvidence`; Phase-3 and Phase-4 reconstruction checks. | Discovery/convergence integrity errors. `convergence/hardening.test.ts`. |
| Draft is not a verified Phase-4 publication capability. | Semantic convergence may propose grouping but cannot publish. | `CanonicalCapabilityDraft.semanticDefinitionStatus: "NOT_RUN"`; publisher. | Missing/failed semantic outcome blocks final construction. `phase4-contract.test.ts`. |
| `PCAP_` is not `CAP_`. | PCAP is promoted to CAP only during Phase-4 publication after the complete persisted RUN/CONV/VFY chain has been authenticated. | `identity.ts`, repository publisher. | `ERR_PHASE4_PROVISIONAL_ID_MISMATCH`, `ERR_PHASE4_NONDETERMINISTIC_CAPABILITY_ID`. |
| Final CAP identity derives only from canonical name and scope. | Entity identity is not mutable evidence, definition, level, relation, provider, or time state. | `buildProvisionalCapabilityId`; publisher promotion of the same suffix. | Provisional mismatch/collision fails closed. `phase4-contract.test.ts`. |
| One persisted RUN_, CONV_, VFY_, or SNAP_ identity selects one immutable payload. | Identity reuse must not overwrite audit history. CAP_ and REL_ identities do not have independent repository persistence. | In-memory/Postgres run and snapshot saves. | `ERR_IMMUTABLE_RUN_CONFLICT`, `ERR_IMMUTABLE_CONVERGENCE_RUN_CONFLICT`, `ERR_IMMUTABLE_VERIFICATION_RUN_CONFLICT`, `ERR_IMMUTABLE_SNAPSHOT_CONFLICT`. Repository contract tests. |
| RUN, CONV, and VFY authority requires persisted exact state. | Reconstruction proves consistency; immutable persistence selects the authoritative artifact, including fields omitted from IDs. | `authenticatePersistedCapabilityVerificationRun`. | `ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID`. `integrity-contract.test.ts`. |
| Callers cannot inject final capability publication state. | CAPs are constructed from authenticated drafts plus VFY outcomes. | `constructCapabilities` in `repository.ts`. | Caller-supplied extra fields are ignored because the public publisher input has none. `phase4-contract.test.ts`. |
| Callers cannot inject final evidence membership. | Evidence inventory is reconstructed from verified candidate claims referenced by canonical drafts. | `reconstructVerifiedEvidence`; `constructEvidence`. | `ERR_PHASE4_EVIDENCE_INVENTORY_INVALID` or integrity failure. |
| Callers cannot inject final relations or metadata. | Relations are promoted from proposals/dispositions; metadata is derived from VFY and chain data. | `constructRelations`, `constructPhase4Snapshot`. | `ERR_PHASE4_RELATION_DISPOSITION_MISSING`, `ERR_PHASE4_RELATION_NOT_VERIFIED`, or integrity failure. |
| Phase-3 relation type and VFY disposition are separate state dimensions. | A proposal's semantic type is not its final verification disposition. | Convergence validator/canonicalizer; VFY payload; publisher. | Final construction applies both dimensions. |
| Every proposed relation receives exactly one VFY disposition. | No proposal may silently disappear. | `assertVerificationCoverage`. | `ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID`. |
| Concrete proposal type plus VERIFIED disposition creates a final relation. | PCAP endpoints cannot be the final CAP graph endpoints. | `constructRelations`; `createCapabilityRelation`. | `PARENT_CHILD`, `RELATED_CAPABILITY`, or `DISTINCT_CAPABILITY` plus `VERIFIED` promotes PCAP endpoints to CAP endpoints and creates a new verified `REL_`. |
| A REJECTED VFY disposition remains audit state, not final publication graph state. | Rejection is explicit and must not be promoted. | Publisher relation construction. | Any proposal with `REJECTED` is omitted from the final relation inventory. `phase4-contract.test.ts`. |
| An UNRESOLVED VFY disposition blocks publication. | Uncertainty must not become a verified Phase-4 relation. | Derived VFY eligibility and publisher. | `ERR_PHASE4_PUBLICATION_BLOCKED`. |
| A Phase-3 `UNRESOLVED` relation type is not publishable with a VERIFIED disposition. | A verified disposition cannot convert an unresolved semantic type into a concrete final relation. | `constructRelations`. | `ERR_PHASE4_RELATION_NOT_VERIFIED`. |
| A failed semantic definition blocks whole-snapshot publication. | Current publication is all-or-nothing. | Derived VFY eligibility; publisher semantic check. | A correctly authenticated `FAILED` outcome derives `BLOCKED` and the public publisher fails `ERR_PHASE4_PUBLICATION_BLOCKED`. `ERR_PHASE4_SEMANTIC_DEFINITION_NOT_PASSED` is a final-construction defense-in-depth guard; missing/duplicate coverage normally fails authentication earlier. |
| Unverified level is allowed. | Missing level evidence must not invent a level. | VFY payload canonicalization and final CAP construction. | `UNVERIFIED` iff level is `null`; otherwise `ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID` or `ERR_PHASE4_LEVEL_TRUTH_INVARIANT`. |
| No Phase-4 write before the complete governed validation and persisted-authority chain has succeeded. | A failure in source, RUN, CONV, VFY, eligibility, CAP, evidence, relation, or snapshot validation precedes the private write. | Bound publisher sequence. | Corresponding fail-closed error; no Phase-4 snapshot write. `phase4-contract.test.ts`. |
| Generic snapshot persistence cannot write Phase-4 publication state. | Generic Phase-1/manual semantics remain compatible but cannot bypass Phase 4. | `assertGenericSnapshotRoute`. | `ERR_PHASE4_SNAPSHOT_REQUIRES_DEDICATED_REPOSITORY`. `repository.test.ts`. |
| Raw Phase-4 write authority is runtime-private. | Within the supported Capability Core API of the shipped concrete repositories, only the bound publisher may invoke the concrete repository private method. | `#persistPhase4VerifiedSnapshot` in concrete repositories. | No exported store/factory/writer; architecture assertions in `phase4-contract.test.ts`. |
| Final publisher is the supported public Phase-4 publication path. | Within the supported Capability Core API of the shipped concrete repositories, it authenticates the persisted chain before private persistence and reread. | `createVerifiedCapabilitySnapshotPublisher` repository method. | Public callers obtain only `publish(rawIntegrityInput)`. |
| Zero-result discovery is valid. | “No capabilities” is a meaningful result. | Discovery/convergence runtime and Phase-4 publisher tests. | A one-source zero-capability graph may publish an empty Phase-4 publication snapshot. |
| Zero-source authentication is invalid. | Discovery cannot legitimately create a RUN without source documents. | Discovery runtime and `authenticateSources`. | `ERR_CAPABILITY_DISCOVERY_NO_SOURCES` / `ERR_CAPABILITY_VERIFICATION_RUN_INTEGRITY_INVALID`. |
| Frontend does not own publication authority. | Capability Core contains no UI or frontend persistence/publication path. | Module boundary and public publisher input. | No dedicated error; frontend is outside this module. |

## Relation type and disposition semantics

Phase-3 proposal relation types and Phase-4 VFY dispositions are independent fields:

| State dimension | Values |
| --- | --- |
| Phase-3 proposal `relationType` | `PARENT_CHILD`, `RELATED_CAPABILITY`, `DISTINCT_CAPABILITY`, `UNRESOLVED` |
| Phase-4 VFY disposition | `VERIFIED`, `REJECTED`, `UNRESOLVED` |

| VFY disposition | Publication effect |
| --- | --- |
| `VERIFIED` with `PARENT_CHILD`, `RELATED_CAPABILITY`, or `DISTINCT_CAPABILITY` proposal type | Promote the corresponding Phase-3 `PROPOSED` relation from PCAP endpoints to CAP endpoints; create a new deterministic `REL_` with `status: "VERIFIED"`. |
| `VERIFIED` with `UNRESOLVED` proposal type | Do not publish; final construction fails `ERR_PHASE4_RELATION_NOT_VERIFIED`. |
| `REJECTED` | Preserve the disposition in the VFY audit payload; omit any proposal type from the final graph. |
| `UNRESOLVED` | Preserve the disposition in the VFY audit payload; derive `BLOCKED` eligibility and reject publication for any proposal type. |

## Level semantics

The only current L1–L6 structural rule is:

```text
levelVerificationStatus === "VERIFIED"   iff demonstratedCapabilityLevel is L1..L6
levelVerificationStatus === "UNVERIFIED" iff demonstratedCapabilityLevel is null
```

The implementation contains no semantic interpretation, rubric, or inference algorithm for L1–L6.
