# F10–F12 Runtime, SIL, and Decision-Context Contracts

Status: reconciled at `772f2748ef521f1741cd52437da1660fd99e25be` (2026-09-01).

This is the evidence-backed integration contract for the post-F10 Career worker, F11 proposal projection, F12 spatial SIL runtime, and the separately frozen local Decision Context API v1. It records represented state and non-claims; it does not turn a proposal, UI, test, tag, or HTTP response into authority.

## Evidence map and release lineage

| Contract | Evidence |
| --- | --- |
| F10A/F10B Capability Proposal Runtime | `3917c3e`, tag `v1.0.0-career-capability-proposal-runtime-v1`; `lib/career/capability-core/runtime/proposal-runtime.ts`; `lib/career/orchestration/capability-proposal-executor.ts`; `lib/career/orchestration/career-analysis-job-processor.ts` |
| F11 SIL proposal projection | `612ade0`, tag `v1.0.0-career-capability-proposal-sil-projection-v1`; `lib/career/capability-core/projection/reader.ts`; `lib/career/capability-proposal-sil-adapter.ts` |
| ISO producer hardening | `52e6c1e`; `lib/career/adapter.ts`; `test/career-iso-country-code.test.ts` |
| F12 recursive focus and motion | `5114312`; `lib/career/view-model/orbital-focus-navigation.ts`; `app/components/career/demo/OrbitalSatelliteMotion.tsx` |
| HUD stacking and compositing repairs | `d0a68de`, `d2e6ad8`, `772f274`; `SemanticCareerIntelligenceField.tsx`; `OrbitalResonanceBubble.tsx`; `test/career-hover-hud-compositing.test.tsx` |
| focused empty-projection repair | `5174074`; `SemanticCareerIntelligenceField.tsx`; `SilOrbitEmptyState.tsx`; `test/career-f12-pulse-alignment.test.tsx` |
| Decision API v1 | `ee06ff6`, tag `v1.0.0-decision-runtime-local-api-contract-v1`; `docs/decision-runtime/LOCAL-DECISION-CONTEXT-API.md` |

The tags are historical seals for their stated commits. They do **not** make the current branch `HEAD`, current worktree, proposal, or UI projection verified, current, authoritative, or latest.

## End-to-end representation chain

```text
Raw Sources
  -> Career Analysis source preparation
  -> F10 source bridge -> SourceDocuments
  -> Capability Proposal Runtime: Discovery -> deterministic evidence verification -> Convergence
  -> immutable proposal RUN_/CONV_ reference (when PROPOSALS_CONVERGED)
  -> F11 proposal projection reader -> SIL adapter/view model
  -> SIL frontend representation
  -> future, separately governed Capability authority/publication boundary
  -> frozen Decision Context API v1 consumes explicit AuthoritativeStateReference
```

The arrows are data/representation arrows, not an authority escalation.

- **ANALYSIS != AUTHORITY.** The canonical Career Analysis remains the job result; Capability Proposal artifacts are sidecar state.
- **PROPOSAL != VERIFIED != AUTHORITATIVE != CURRENT != HEAD != LATEST.** A `RUN_` / `CONV_` may be persisted, converged, or displayed without becoming a verified capability, Phase-4 publication, selected current state, or reality.
- **Frontend = Projection.** SIL reads bounded presentation data. It does not infer authority, choose current/head/latest, repair lineage, or convert visual prominence into semantic status.
- The current Career F10/F11 path has no Verification producer/runtime after Convergence and performs no Phase-4 publication. Capability Core may have separately governed verification/publication concepts, but this composition does not invoke them. F11 therefore represents `semanticDefinitionState: "NOT_RUN"` and `authorityState: "NONE"`.

## F10: bounded Career Proposal Runtime

`createCapabilityProposalRuntime` first converts prepared `DocumentInput[]` through the source bridge, invokes Discovery, and then invokes Convergence on the exact Discovery run unless Discovery returns `VERIFIED_SNAPSHOT_REUSED`. Discovery owns evidence filtering and deterministic source-match verification; Convergence owns proposal reconciliation. F10 neither duplicates those checks nor adds a verification/publication stage.

| Runtime result | Meaning | Non-claim |
| --- | --- | --- |
| `PROPOSALS_CONVERGED` | one Discovery `RUN_` and one Convergence `CONV_` completed or were reused; dispositions say which | not verified capability truth or Phase-4 publication |
| `VERIFIED_SNAPSHOT_REUSED` | Discovery selected an already-existing verified snapshot | no fabricated `RUN_`/`CONV_`, no new verification or publication artifact |

`RUN_` and `CONV_` are proposal-lineage identifiers. An F11 reference selects exactly one persisted Discovery run, Convergence run, common source-bundle hash, and convergence completion time. Invalid/mismatched lineage fails; it is never repaired by selecting a neighbor or fabricating a reference.

### Worker orchestration and exact five operations

`createCareerAnalysisJobProcessor` loads deterministic `ANL_` state, prepares one normalized source inventory, runs the proposal sidecar, and only then either returns the existing canonical analysis or executes/persists the legacy analysis path. Existing canonical analysis never skips the sidecar. Both paths receive the same prepared inventory.

| Operation | Bounded lifecycle meaning |
| --- | --- |
| `RECOVERY_CHECK` | check/load deterministic canonical-analysis result |
| `SOURCE_PREPARATION` | normalize the input inventory once |
| `INFERENCE` | emit only at a wrapped Discovery/Convergence provider call; reuse does not invent it |
| `ANALYSIS_VALIDATION` | admitted job lifecycle operation label |
| `PERSISTENCE` | save a newly created legacy canonical Career Analysis |

The five labels are progress telemetry, not semantic truth, verification, authority, publication, or current/head/latest selection. `test/career-worker-capability-proposal-wiring.test.ts` proves ordering, one-inventory reuse, sidecar failure propagation, no manufactured snapshot lineage, provider-bound inference, and F10B composition.

### ISO country-code producer hardening

`IsoCountryCodeSchema` and the Career adapter accept/produce only canonical ISO-3166-1 alpha-2 values such as `DE`, `US`, and `CH`; names, alpha-3 values, and lowercase variants are rejected. The prompt contract requires a grounded canonical value and omission when none can be grounded. This is producer/schema hardening, not independent verification of real-world country information. See `test/career-iso-country-code.test.ts` and `test/career-prompt-contract.test.ts`.

## F11: exact proposal projection into SIL

`createCapabilityProposalProjectionReader` is an integrity reader, not an authority resolver. It validates an exact stored `RUN_`/`CONV_` pair, source-bundle identity, completed statuses, reconciliation, candidate/evidence correspondence, and proposal relations. Historical analyses without the F11 sidecar return `null`; the reader does not backfill one.

| Field | Exact projection value |
| --- | --- |
| `projectionKind` | `CAPABILITY_PROPOSAL` |
| `projectionState` | `PROPOSED` |
| `evidenceState` | `EVIDENCE_PASSED` |
| `semanticDefinitionState` | `NOT_RUN` |
| `authorityState` | `NONE` |

`EVIDENCE_PASSED` means source-match admission for a represented proposal. It does not establish semantic definition verification, verified capability status, publication, authority, correctness, or current state. The SIL adapter replaces only displayed capabilities and preserves unrelated legacy fields. Proposal capabilities stay out of the legacy evidence graph and are displayed without verified labels, synthetic percentages, or invented deeper-level metadata. `test/career-proposal-sil-projection.test.ts` is the focused proof.

## F12: SIL stages, recursive focus, and motion

| Stage | SIL label | Collection | L0 angle / geometry evidence |
| --- | --- | --- | --- |
| 01 | Identity Core | `sources` | -90 degrees |
| 02 | Capability Field | `capabilities` | -30 degrees |
| 03 | Resonance Orbits | `companyMatches` | +30 degrees; strong positive x |
| 04 | Role Manifestation | `roleMatches` | +90 degrees; x approximately zero |
| 05 | Tension Field | `capabilityGaps` | +150 degrees; strong negative x |
| 06 | Evolution Paths | `nextActions` | +210 degrees |

The recursive, stage-neutral grammar is:

```text
L0 Planetarium -> click stage -> L1 focused stage/cosmos
L1 -> choose real item -> L2 item focus
L2 -> back -> same stage L1
L1 -> exit -> L0
```

Every stage enters L1 first. Zero items remain in L1 with a bounded empty projection; an invalid item cannot enter L2. One item remains one deterministic L1 satellite. Many items use a deterministic bounded no-overlap orbital layout. A stage change clears selected item. `test/career-generalized-orbit-focus.test.tsx` covers transitions and zero/one/many behavior.

`OrbitalSatelliteMotion` is the shared Cosmos motion primitive: deterministic position from a linear elapsed-time clock, viewport-upright cards, and static elapsed time under reduced motion. It is not a second focused-stage position owner. `test/career-orbital-motion-runtime.test.tsx` proves actual rendered satellites move and zero-item stages do not fabricate one.

### Hover HUD stacking-context repair — closed

The hover HUD was initially trapped below the Identity Core by its parent
orbital stacking context. `d0a68de` raises the whole orbital layer to
`z-index: 60` only while a HUD is visible (otherwise `6`), above the Identity
Core at `10`. `d2e6ad8` makes the HUD observation surface intrinsically opaque
(solid background and own `opacity: 1`). This is the **stacking** contract: HUD
layer elevation and Identity Core paint order are correct.

### Hover HUD compositing-ownership repair — closed

Stacking elevation did not solve a separate compositing defect. Before
`772f274`, `OrbitalResonanceBubble` put `opacity: isDimmed ? 0.52 : 1` on the
`orbital-physics-*` ancestor. In graph-focus mode,
`isStageDimmed = graphFocus ? !isStageRelated : ...`; an unrelated stage could
therefore be simultaneously `isHovered` and `isDimmed`. The HUD and tether are
descendants of that physics wrapper, so the ancestor's `0.52` alpha dimmed the
final HUD even though the HUD itself had a solid background, `opacity: 1`,
`z-index: 50`, and a correctly elevated common orbit layer. A descendant cannot
recover opacity lost by its ancestor.

`772f274` closes this independent compositing regression with the global
invariant `isEffectivelyDimmed = isDimmed && !isHovered`. Unrelated stages may
remain dimmed during graph focus; once a stage is actively hovered, it exits
effective dimming and its bubble interaction surface, tether, and HUD remain
fully composited. Hover interaction overrides stage dimming. The fix changes
only `OrbitalResonanceBubble.tsx`; it does not alter the stacking escalation,
HUD surface design, colours, or stage-specific behavior.

`test/career-hover-hud-compositing.test.tsx` was pre-existing protected open
work, but the read-only diagnostic proved its regression contract valid rather
than stale. It was RED before the repair because the rendered physics wrapper
contained `opacity:0.52`, then GREEN without any test edit after `772f274`.
The validated repair ran the protected HUD regression plus 58 F12/HUD/attention
tests, touched-file TypeScript, full `npm run build`, and `git diff --check`;
the manual visual gate also passed.

## Focused empty projection: failure history and final ownership

### Legitimate empty semantics

An empty stage is rendered only when a successful analysis has an empty corresponding stage collection. It is neither `ERROR`, `BLOCKED`, a generic gap claim, nor proof that a real-world domain contains no entities. Stage 05 specifically means the analysis path supplies no capability-gap projection to SIL; it does **not** mean no capability gaps exist. Empty attention is absent before successful completion, on failure, and for unknown stages. `buildSilOrbitEmptyState`, `resolveSilOrbitAttentionState`, and `resolveFocusedOrbitEmptyState` enforce this boundary; see `test/career-sil-empty-orbit-attention.test.ts`, `test/career-sil-empty-orbit-visual-attention.test.tsx`, and `test/career-sil-focused-empty-orbit.test.ts`.

### Old failure chain and false green

Before `5174074`, the Stage wrapper translated the active L0 position toward the focus centre, while the real `SilOrbitEmptyState` subtree was separately rendered later in `SemanticCareerIntelligenceField` as an absolute sibling with:

```ts
left: `${center + activeOrbitX}px`
top: `${center + activeOrbitY}px`
```

That sibling retained L0 coordinates after the bubble wrapper applied inverse focus translation. Stage 03 and Stage 05 therefore failed in opposite lateral directions; Stage 04's near-zero x made this lateral error appear substantially correct and masked it.

An initial global-shell test was a false green: it proved that all stage bubbles route through `FocusTransitionStageShell`, but not that the **actual rendered empty-state root** was a descendant of the same shell. Routing/property proof cannot establish DOM ancestry or rule out competing positioning. The replacement F12 DOM test locates the actual text (`NO GAP PROJECTION AVAILABLE`) and asserts real containment, asymmetrical 03/04/05 translation, and all-six-stage ownership.

### Final coordinate and visual-layer contract

`FocusTransitionStageShell` is instantiated once per stage. Its outer shell owns L0 `x/y` placement and `translate(-x, -y)` focus movement; its inner visual shell owns only scale. Children own no active-orbit translation:

```text
FocusTransitionStageShell          position owner: L0 x/y + L1 translation
  -> EmptyVisualUnderlay           local 50%/50%, z-index 0
       -> SilOrbitEmptyState        membrane, ellipse, rings, glow, tether
  -> FocusedStageBubble             local body, z-index 1
       -> bubble/nucleus, attention halo/shell, pulse
  -> EmptyCopyForeground            local, z-index 3, pointer-events none
       -> SilOrbitEmptyStateCopy    label, title, reason, structural-absence line
```

This is global for stages 01–06. Pulse/halo may animate local scale about centre but cannot own orbit-to-focus translation. `focus-transition-stage-shell-*`, `focused-stage-bubble-*`, `empty-visual-underlay-*`, `empty-copy-foreground-*`, and `focus-transition-pulse-*` are explicit DOM anchors.

The foreground copy is locally anchored with `left: 50%`, `translateX(-50%)`, and a top derived from the focused bubble outer radius (`(168 + 16*2 + 1.5*2)/2`) plus a stable `24px` gap, then `translateY(-100%)`. It appears above the bubble without viewport coordinates or `activeOrbitX`/`activeOrbitY`.

`NO ACTUAL ITEMS PROJECTED` belongs to ordinary zero-item `OrbitalCosmosView`. During a focused empty projection, `SemanticCareerIntelligenceField` suppresses that Cosmos view through `!hasFocusedEmptyProjection`; it does not edit or redefine the Cosmos copy. The foreground block is consequently the only coherent focused-empty copy, with no duplicate/stale line beneath the nucleus.

`test/career-f12-pulse-alignment.test.tsx` validates actual server-rendered DOM for all six stages, the asymmetric 03/04/05 cases, layer order `0 < 1 < 3`, local copy placement, shared shell containment, and suppression of `NO ACTUAL ITEMS PROJECTED`.

### Visual seal limitation

DOM assertions, TypeScript, and builds establish structural/compilation evidence. They do not establish pixel compositing, timing, or screenshot appearance in a real browser. **NO SCREENSHOT = NO VISUAL FRONTEND SEAL.** The F12 structure is tested, but a manual screenshot gate remains a separate proof.

## Frozen Decision Context API v1 boundary

`docs/decision-runtime/LOCAL-DECISION-CONTEXT-API.md` freezes exactly `POST /api/decision-contexts` and `GET /api/decision-contexts/{revisionId}` for local frontend integration. The API consumes complete explicit `DecisionContextDraftInput` and explicit `AuthoritativeStateReference`; GET is exact-key retrieval. It has no implicit current/head/latest/active selection, fallback, lineage search, or authority-payload-to-context conversion. Clients rely only on documented wire shapes, envelopes, status mappings, and five public `ERR_DECISION_API_*` codes.

This is a Representation-Safety boundary: a persisted revision is not truth; a root revision is not head/latest/active; HTTP success is not authority of reality; and authority-resolution success does not make Decision Context content authoritative. The API is not a full Decision Loop, Decision Need, recommendation, action/outcome, deployment, or production-security contract. Incompatible wire changes require explicit versioning or a governed compatibility decision.

## Current worktree boundary: Source Satellite is OPEN / UNSEALED

At this audit baseline, these pre-existing Source Satellite changes are open and unsealed, outside F10/F11/F12 certification and outside this documentation change:

- `app/components/career/demo/OrbitalCosmosView.tsx` (modified)
- `lib/career/view-model/orbit-focus-projection.ts` (modified)
- `lib/career/view-model/source-satellite-presentation.ts` (untracked)
- `test/career-source-satellite-presentation.test.ts` (untracked)

`test/career-hover-hud-compositing.test.tsx` is also pre-existing untracked work and remains protected byte-for-byte in this sweep. Its HUD regression contract is validated: the production compositing bug is closed by `772f274`, but the test itself remains open worktree material rather than a shipped Source Satellite artifact.

## Maintenance rule

When extending this chain, update code, focused test, and this document together. A producer must declare its exact artifact/authority boundary; a projection must preserve state rather than upgrade it; and a spatial UI change must prove actual rendered DOM ancestry in addition to helper/route tests. Do not use tags, green tests, or visual language as a substitute for the authority contract they do not establish.
