# SYNTX field contract binding (GELB contract verification)

Status: GELB (DLL Architecture), 2026-10-11, owner mandate "SFE — SYNTX SEMIONTIC FIELD RECONSTRUCTION".
Target architecture: [SYNTX_SEMIOTIC_RECONSTRUCTION_SPEC.md](SYNTX_SEMIOTIC_RECONSTRUCTION_SPEC.md) (owner input, verbatim).
Scope: Job Pool Field (`focus=POOL`) and Job Field (`focus=JOB`). Capability Field: unchanged (sealed; B-CAPABILITY-CHROME
remains an owner decision). Inspected against the integration tip `801828c` and the live read routes of the owner
environment (GET only).

This document is the gate for the renderer: **a sign the spec names but this table does not bind to a repository field
is not rendered** (§3). Everything here is read from existing HTTP bodies; nothing is persisted, scored, evaluated or
decided anew. Glossary and rules SG-1 … SG-6 of [JOB_POOL_CONNECTION.md §12](JOB_POOL_CONNECTION.md) continue to hold.

## 1. Read surfaces (the only inputs)

| Surface | Route | Type | Carries |
|---|---|---|---|
| Upload view | `GET /api/career/job-pools/{jobPoolUploadId}` | `JobPoolUploadView` (`lib/career/job-pool/types.ts`) | raw pool (`pool.organizations[]`, `pool.roles[]`, `pool.requirements[]`), `canonicalMapping` (target entities/revisions, `PROPOSAL_ONLY`, authority `NONE`) |
| Upload list | `GET /api/career/job-pools` | `JobPoolUploadSummary[]` | persisted uploads (pool selection) |
| Presentation matching | `GET /api/career/job-pools/{id}/matches?analysisId=` | `JobPoolMatchPresentation` | per role `matched[]`, `weakEvidence[]`, `missing[]`, `resonanceScore`, `sweepProposal` per requirement, `canonical` relation state; `capabilitySweep`; `organizationMatches[]` |
| Analysis | `GET /api/career/analyses/{analysisId}` | analysis read model | `analysis.structured_data.analysis.documents[]` (source title), `.capabilities[]` (legacy analysis capabilities `CAP_*` with evidence location), `capabilityProposalProjection` (F11 sweep proposals `PCAP_*` with `EVD_*` evidence) |

**Not an input (must not be bound):** `analysis.matching.role_matches` / `organization_matches` (the legacy built-in
role catalogue, not the uploaded pool) and `analysis.recommendations` (`capabilityGaps`, `nextActions`, "Acquire
capability …"). Binding either would put a recommendation layer or a foreign role set into the field (spec §12.5, §16.3).

## 2. Binding table: spec sign → repository field → proof reference

### 2.1 Carriers and containment (spec §4.1, §4.2, §4.3)

| Spec sign | Repository field | Proof reference (must be carried by the sign) |
|---|---|---|
| Pool (Field) | `JobPoolUploadView.{poolId, poolVersion, poolName, poolStatus}` | `jobPoolUploadId` (`JPOOL_*`) |
| Organization carrier / region | `pool.organizations[].{id, name, industry, region, country_iso, scale, description}` | `poolOrganizationId` + `canonicalMapping.organizations[].targetOrganizationEntityId` |
| Pool ⊃ organization | membership of the organization in the uploaded pool | `jobPoolUploadId` + `poolOrganizationId` |
| Role carrier | `pool.roles[].{id, title, seniority, domain_focus, description}` | `poolRoleId` + `canonicalMapping.roles[].targetRoleEntityId` |
| Organization ⊃ role | `pool.roles[].organization_id` (reference-checked at upload) | `canonicalMapping.roles[].targetRoleOrganizationBindingRevisionId` |
| Requirement anchor | `pool.requirements[].{id, capability_name, required_level, weight, necessity, domain, evidence_hint}` | `poolRequirementId` + `targetRequirementRevisionId` (`TRQREV_*`) |
| Role ⊃ requirement | `pool.requirements[].role_id` | `canonicalMapping.roles[].requirements[].targetRequirementRevisionId` |
| Organization density | count of `pool.roles` with that `organization_id` (= `organizationMatches[].roleCount`) | derived count; never a score |

Grouping, nesting and parent position derive only from `organization_id` / `role_id` (equal to the canonical binding
revisions), never from label text (spec §4.1 "Unsupported if"). Every pool role and requirement is a carrier, also at
zero resonance or with no support.

### 2.2 Requirement → support relations (spec §3.1, §4.4, §9.2)

Per role match, a requirement is in exactly one of `matched[]`, `weakEvidence[]`, `missing[]`; independently it may
carry a `sweepProposal`. The spec's overlap rule (§3.2) is the repository's: the pending kinds are dimensions, not a
partition (F-LF-1).

| Spec relation / manifestation | Repository condition | Proof reference | Coupling (trace weight) |
|---|---|---|---|
| `supports` · `trace_stable` | requirement in `matched[]` | `analysisId` + `matchedCapabilityEntityId` (`CAP_*`) + `evidence[].{docId, quote}`; `matchBasis`, `matchedConstituent` | `contribution` as delivered (never recomputed), relative to the role's delivered contributions |
| `weakly_supports` · `trace_thin` | requirement in `weakEvidence[]` (as delivered: confidence below `presentation.weakEvidenceThreshold` or basis `TOKEN_CONTAINMENT`, which is always weak) | as above + `reason` | `contribution` as delivered (it does enter `resonanceScore`, e.g. Node.js 0.336 in `role_fullstack`; thin, never closing) |
| `covers_unscored` · `trace_dotted` | `sweepProposal !== null` on any requirement (`matched[]`, `weakEvidence[]` or `missing[]`; e.g. TypeScript in `role_fullstack` is matched and sweep-covered). The pending kind UNSCORED_COVERAGE keeps counting only the non-matched ones (F-LF-1) | `sweepProposal.capabilityProposalId` (`PCAP_*`) + `sweepProposal.evidence[].{docId, quote}`; `evidenceState: SOURCE_MATCH_VERIFIED` | none (`scored: false`); no thickness, no confidence |
| `missing_support` · `open_boundary` | requirement in `missing[]` with `sweepProposal === null` | `poolRequirementId` + `evidenceHint` | none |
| `pending_evaluation` · `suspended_boundary` | `role.canonical.capabilityRequirementRelationState === "NOT_EVALUATED"` | `targetRoleProfileRevisionId` + `targetRequirementRevisionIds[]`; `reason: VERIFIED_CAPABILITY_SNAPSHOT_ABSENT` | — |

A matched requirement that also has a sweep proposal keeps both traces (stable + dotted); a weak one with a proposal
keeps thin + dotted. No single badge or colour collapses them (spec §3.2).

### 2.3 Evidence aperture (spec §4.4, §5 STATE D)

| Aperture content | Repository field | Join (same source only) |
|---|---|---|
| Evidence snippet | `evidence[].quote` (scored/weak) · `sweepProposal.evidence[].quote` (sweep) | — |
| Source title | `analysis.documents[].identity.name` (e.g. `cv.synthetic.pdf`) | `docId` = `documents[].entity_id` of the **same** analysis |
| Provenance (location) | `analysis.capabilities[].evidence[].location` | `matchedCapabilityEntityId` = `capabilities[].entity_id` **and** `quote` = `context_quote`, same analysis; omit when the join is not exact |
| Sweep evidence id | `capabilityProposalProjection.capabilities[].evidence[].evidenceId` (`EVD_*`) | `capabilityProposalId` = projection `capabilities[].id` **and** `quote` = `exactQuote`, same analysis |
| Capability reference | `matchedCapabilityName` (+ `matchedConstituent`) · `sweepProposal.name` | — |
| Matching contribution (scored/weak only) | `contribution`, `confidence`, `weight`, `matchBasis` | — |
| Sweep status | "unscored", `matchBasis`, `evidenceState` | — |
| Authority boundary statement | `presentation.{authorityState, canonicalEvaluation, decision}`, `role.canonical.{capabilityRequirementRelationState, reason}` | — |

The joins are exact-match lookups inside one analysis; they are not identity joins across sources (SG-1). A failed
join omits the field; it never falls back to fuzzy matching.

### 2.4 Score (spec §7.1)

| Value | Field | Permitted placement |
|---|---|---|
| Role resonance | `resonanceScore` (presentation, `JOB_POOL_PRESENTATION_MATCHING_V1`) | role aperture or secondary compression after the requirement ecology is visible; never the role's main label, never the first impression |
| Organization aggregate | `organizationMatches[].aggregateScore` | organization aperture only |
| Rank | delivered order of `roleMatches` | may order nothing spatially before a role is visible as a carrier; never shown as "recommended" |

## 3. Unsupported list (render nothing; the renderer's aperture states are gated by this list)

| Spec item | Why unsupported in the repository | Consequence |
|---|---|---|
| Closure / "stable closed boundary" (§2.1, §11.1) | no requirement relation is canonically evaluated: every role carries `NOT_EVALUATED` / `VERIFIED_CAPABILITY_SNAPSHOT_ABSENT` (HIA-1/HIA-2 open) | no closure geometry anywhere (ruling R1) |
| Per-quote evidence id for scored/weak traces | the matches body carries `{docId, quote}` only | proof = `analysisId` + `CAP_*` + `docId` + quote; never a synthesised id |
| Source URI | documents carry `entity_id` and `identity.name`, no URI | show title, not a link |
| Matching contribution id | no such id exists | proof = (`jobPoolUploadId`, `poolRoleId`, `poolRequirementId`, `analysisId`) |
| Confidence for sweep coverage | `sweepProposal` has none (`scored: false`) | no number, no thickness |
| Verified capability / checkmark / seal | `authorityState: NONE`; projection `authorityState` not verified | never |
| HR recommendation, "fit", endorsement | `decision: false`; HR decisions live in the HR loop only (no edge, SG-4) | never; also do not bind `analysis.recommendations` |
| Disqualification / failure / incompetence | no such state exists | missing support is neutral (ruling R3) |
| Temporal drift, market saturation, contradiction | not carried | never |
| Role-to-role semantic proximity (§5 STATE B "compare role proximity") | no role-similarity relation exists | proximity only as delivered resonance, labelled presentation; otherwise unsupported |
| Requirement-to-requirement relations | none in the pool contract | requirements relate only to their role |
| Evidence-source carriers beyond the analysis documents | only `DOC_*` of the analysis | one source carrier per delivered `docId` |

## 4. Governance rulings on tensions inside the spec

- **R1 Closure is prohibited in the current system state.** §2.1 restricts closure to canonical evaluation; §11.1 also
  lists a "stable closed boundary" for scored support. Since every relation is `NOT_EVALUATED`, scored support renders as
  a stable *trace* (coupling), and the requirement boundary stays *suspended*. A closed boundary appears only when
  `capabilityRequirementRelationState` carries an evaluated value, which the system does not produce today.
- **R2 Pending is the ground state, rendered once.** `NOT_EVALUATED` applies to all requirements of all roles; it is a
  property of the role ecology (one suspended boundary per role/requirement set), not a per-requirement differentiator
  and not an animated alarm. Motion for it, if any, is the spec's "boundary suspend", never pulsing (§6.2).
- **R3 Missing support is neutral.** `NO_EVIDENCE_DELIVERED` currently uses the red family
  (`JobField.tsx` `STATE_COLOR` / `PENDING_COLOR`). Red/failure colouring is withdrawn: an open boundary without negative
  mark, inspected text "No delivered support is available for this requirement in the current analysis." Absence is
  computed from `missing[]` with `sweepProposal === null`, never visually inferred.
- **R4 Score is secondary, also spatially.** In FIELD and ORGANIZATION states roles are placed by containment
  (organization ⊃ role), not by resonance distance; organization regions encode membership/density, not
  `aggregateScore` (no score-lit nebula, spec §2.1/§8.2). Resonance may appear as the coupling of the candidate↔role
  relation once a role is focused, and numerically only in an aperture. Inside a role, requirement placement may follow
  support state (§9.2) — that is relation state, not score.
- **R5 Sweep wording.** The spec's §12.3 text says "Gemini Discovery … has not entered canonical matching evaluation";
  in the repository the coverage is also *not scored in the presentation matching*. Inspected text: "A capability sweep
  proposal covers this requirement with a source-verified quote; it is not scored and not canonically evaluated."
  `SOURCE_MATCH_VERIFIED` means the quote was found in the source, not that the capability is verified.
- **R6 Weak evidence scores.** Weak support contributes to `resonanceScore`; its inspected text is the spec's §12.2
  sentence plus the delivered `reason`. It never closes.
- **R7 Overlap is visible.** A requirement shows every relation it has (§2.2); counts per kind remain dimension counts
  (F-LF-1).
- **R8 Escape returns.** §13.4 requires Escape as return; the current LENS_V1 has none (back buttons only). Adding it is
  in scope; existing back buttons stay (additive, PINK's and GRÜN's suites keep running).
- **R9 Accessibility summaries derive from the same view model** as the visual signs (one source of truth); no summary
  text may state a relation the view model does not carry.
- **R10 Capability Field.** Out of scope: no chrome, orbit copy or sealed contract changes; entry/exit transitions to
  and from `focus=CAPABILITY` keep their current contract.
- **R11 Grammar versioning.** The new interaction grammar gets its own id; LENS_V1 / POOL_FIELD_V1 / GALAXY_V1 /
  SEMIONTIC_V1 attributes and test ids stay additive or are retired only with a recorded plan change by PINK.
- **R12 No new data path.** The view model reads only §1 surfaces. A second read (`/api/career/analyses/{id}`) for source
  title/provenance is permitted; no new route, table, write or persisted presentation state.

## 5. Governance tests (GELB, bound to GRÜN's pure view model)

Module: `lib/career/job-pool/syntx-field-view-model.ts` (pure, no React; name agreed with GRÜN). GELB adds
`test/career/job-pool/syntx-field-governance.test.ts` covering the semantic subset of spec §15.3:
every visual sign carries a proof reference resolvable to §2; missing support never carries a failure manifestation;
sweep coverage never carries a scored manifestation or coupling; `NOT_EVALUATED` prevents closure; no score in FIELD
state carriers; org ⊃ role and role ⊃ requirement equal the canonical bindings; overlap is preserved; no field from the
§3 list or from `analysis.recommendations` / `analysis.matching` appears. Interaction tests (recenter, recede, return,
reduced motion) are GRÜN's; the running walk FIELD → ORGANIZATION → ROLE → REQUIREMENT → EVIDENCE → RETURN is PINK's
independent acceptance.
