# Job Field — the Job Pool as the central field of the planetarium

Status: implemented on `frontend/job-field` (base `integration/job-pool-connection` @ `04ded74`; GELB's governance
branch `integration/job-field-governance` @ `cf2d084` merged). Owner mandate "SFE — JOB FIELD RECONSTRUCTION"
(2026-10-11). Semantic governance: `docs/architecture/decision-fields/JOB_POOL_CONNECTION.md` §12 (GELB), conditions
G1–G6 and PINK's items F-JF-1…6.

## 1. Reconstruction

| Element | Before | Source |
| --- | --- | --- |
| Planetarium focus | One focus: the capability field (orbits 01–06 from the analysis's own entities) with zoom levels L0–L2 | `SemanticCareerIntelligenceField.tsx` |
| Job Pool surface | The left control panel only (upload, selection, ranked list). Not spatial, not navigable, not the field's focus | `JobPoolMatchPanel.tsx` |
| "Pending" | Not represented. Missing requirements were a list; canonical NOT_EVALUATED a line per role | panel |
| "Nearest" | Not represented; rank 1 as delivered was only a card position | panel |
| Semantic collisions | "role", "organization", "resonance", "capability", "gap", "relation", "evidence" each meant two or three things across orbits, panel and contract | §12 glossary (GELB) |

## 2. Realized relations (presentation only, authority NONE)

```
JobPoolMatchPresentation (delivered)
   │  deriveJobField (pure, no re-scoring)
   ▼
JobField ── roles: polar placement, distance = 1 − resonanceScore, grouped by POOL organization, delivered order
         ── per role: requirement states MATCHED | UNRESOLVED | COVERED_UNSCORED | NO_EVIDENCE_DELIVERED
         ── per role: PENDING = UNPROVEN_CANONICAL · UNRESOLVED_EVIDENCE · UNSCORED_COVERAGE · NO_EVIDENCE_DELIVERED
         ── nearest presented role: first delivered role with resonance > 0 and ≥ 1 scored match, or none
   ▼
JobField.tsx (JOB focus overlay) ◄── focus switch (URL focus=JOB, jobRoleId=…) ── planetarium recedes, stays rendered
         no edge ──╳──► HR Decision Dock
```

Files: `lib/career/job-pool/job-field-presentation.ts` (pure derivation), `app/components/career/demo/JobField.tsx`
(overlay: canvas, legend, role detail, pending field), `JobPoolMatchPanel.tsx` (`JobPoolMatchPanelView` with a lifted
workflow hook so panel and field share one read), `SemanticCareerIntelligenceField.tsx` (focus state, URL params,
mount only), `page.tsx` / `CareerIntelligenceDashboard.tsx` (params `focus`, `jobRoleId`), `sil-language.ts`
(`jobField` copy en/de; orbit 03 subtitle qualified).

## 3. Semantic governance applied

| Condition | Realization |
| --- | --- |
| G1 relation | "NEAREST PRESENTED ROLE" with the label "presentation · authority NONE · not a role relation (RRL) · not a recommendation (RCP) · not a decision". No RRL_/TSN_/EIS_/RCP_ id is rendered; the DOM is asserted free of them |
| G2 resonance | Every number in JOB focus is "POOL RESONANCE (PRESENTATION)". Orbit 03's subtitle now reads "Inferred organisations (analysis) · not pool resonance" (F-JF-6) |
| G3 identity | Roles grouped by `poolOrganizationId` only; the legend states that no pool role or organization is joined with an inferred one |
| G4 distance | Legend: distance = 1 − pool resonance, presentation geometry, not a canonical metric; roles at 0 stay on the outer ring with "NO SCORED MATCH" |
| G5 provenance | Per requirement line: "analysis capability (scored)" with confidence and quotes, or "capability sweep proposal (unscored, source-verified quote)", or "no evidence delivered · absence of evidence is not absence of capability". The words "verified capability" never appear |
| G6 pending | UNPROVEN_CANONICAL cites "NOT_EVALUATED · VERIFIED_CAPABILITY_SNAPSHOT_ABSENT. A canonical evaluation requires an owner decision (HIA-1/2); nothing in this field evaluates, proves or decides it." |
| F-JF-1 | The field legend and the core name both sources: ANALYSIS CAPABILITIES (SCORED SOURCE) n · SWEEP PROPOSALS (UNSCORED) m |
| F-JF-5 | `CareerIntelligenceDashboard` no longer imports the dead LIST-mode components (RoleManifestation, ResonanceOrbits, CapabilityField, …); no list mode is reachable |
| F-JF-4, orbit 02/04 copy | Not changed: the orbit subtitles "Semantic capability core", "Concrete role manifestations" and "Capability-gap projection" (and their German forms) are asserted by sealed SIL language tests (`career-sil-global-language-wiring`, `career-sil-focused-manifestation-bounding`, `career-sil-empty-orbit-visual-attention`, `career-sil-focused-empty-orbit`, `career-sil-language-contract`). Relabeling them is an owner decision over the sealed language contract (B-ORBIT-COPY). The Job Field itself uses none of these terms |

Laws visible in the field: `NEAREST != CHOSEN · PENDING != MISSING CAPABILITY · COVERED != SCORED · DISTANCE != TRUTH · POOL ROLE != INFERRED ROLE`.

## 4. DOM contract (stable, bound by PINK's proofs)

- `semantic-career-intelligence-field`: `data-field-focus="CAPABILITY"|"JOB"`. URL: `focus=JOB`, `jobRoleId=<poolRoleId>`, plus `analysisId` / `jobPoolUploadId`.
- `field-focus-job-btn` (`data-field-focus-active`); `job-field-exit-btn`; `job-field-role-back`; `job-field-open-nearest`.
- `job-pool-panel-toggle` / `job-pool-panel`: `data-anchor="TOP_LEFT"` in the capability focus, `data-anchor="BOTTOM_LEFT"` and collapsed on entering JOB focus (the panel remains the upload/selection control plane).
- `job-field`: `data-field-state` (NO_POOL | NO_ANALYSIS | LOADING | AVAILABLE | NOT_FOUND | INACTIVE_POOL | NOT_PROVISIONED | FAILED), `data-analysis-id`, `data-pool-id`, `data-role-count`, `data-ranking`, `data-nearest-role`, `data-selected-role`, `data-sweep-state`. `data-field-state` is authoritative; `job-field-no-analysis` / `job-field-pool-selection` are its visible renderings.
- `job-field-canvas`, `job-field-core` (`data-candidate-capability-count`, `data-sweep-proposal-count`), `job-field-legend`, `job-field-state`, `job-field-non-claims`.
- `job-field-organization-<poolOrganizationId>` (`data-role-count`).
- `job-field-role-<poolRoleId>`: `data-delivered-rank`, `data-resonance-score` (the body value verbatim), `data-distance` (`1 − score`, clamped to [0, 1], unrounded), `data-scored-match`, `data-nearest`, `data-selected`, `data-matched`, `data-unresolved`, `data-covered-unscored`, `data-no-evidence` (sum = TRQREV count of the role).
- `job-field-nearest` (`data-role-id`) + `job-field-nearest-ray`, or `job-field-no-nearest`.
- `job-field-role-detail` (`data-role-id`); `job-field-requirement-<poolRequirementId>`: `data-state`, `data-provenance` (ANALYSIS_CAPABILITY | SWEEP_PROPOSAL | NONE), `data-basis`, `data-sweep-basis`; `job-field-evidence-quote` (`data-doc-id`).
- `job-field-pending` (`data-role-id`); `job-field-pending-<KIND>` (`data-count`, `data-ids`: TRQREV ids for UNPROVEN_CANONICAL, pool requirement ids otherwise); `job-field-pending-reason`.
- `job-field-select-pool-<jobPoolUploadId>`; `job-field-role-not-delivered` for a stale `jobRoleId`.

## 5. Boundaries

| Id | Boundary |
| --- | --- |
| B-ORBIT-COPY | Orbit 02/04/05 subtitles are sealed by SIL language tests; relabeling (F-JF-1 for orbit 02, F-JF-4 for orbit 05, exact-name note for orbit 04) needs an owner decision. Orbit 03 was free and is qualified. |
| HIA-1/2/3 | No canonical evaluation, no scoring of sweep proposals, no choice of the scored capability set happens in this field. |
| B-JF-SESSION | The analysis of a live sweep lives in the session; a reload keeps `focus`, `jobPoolUploadId` and `jobRoleId` but needs `analysisId` to re-read the field (same as the panel). |
| B-ENTRY, B-JP-ACTOR, B-GEMINI-MODEL, B-PEER-KILL | Unchanged from the Job Pool workflow. |

## 6. Proofs

| Proof | File | Content |
| --- | --- | --- |
| P-JF-U | `test/career/job-pool/job-field-presentation.test.ts` | states and provenance per requirement; four pending kinds never merged; polar placement by delivered resonance, grouped by pool organization, delivered order; zero-resonance roles visible, non-monotone delivery not reordered; nearest presented role rule incl. none; ring segments and arcs; exact role selection; no canonical/decision/verified-capability claim in the derived model |
| P-JF-S | `test/career/job-pool/job-field-ssr.test.tsx` | default focus unchanged with the switch added; JOB focus with NO_POOL / NO_ANALYSIS / LOADING as distinct states; delivered field with roles, nearest, pending kinds, governance labels, no canonical ids, no dock; exact and stale role from the URL; locale and dashboard threading |
| P-JF-G | `test/career/job-pool/semantic-governance.test.ts` (GELB) | import guard over the Job Field files; presentation body free of canonical ids and authority claims |
| P-JF-B | `test/career/job-pool/e2e/job-pool-workflow.e2e.test.ts` | Chromium: switch to JOB, roles = pool roles, resonance/distance equal the delivered body, counts sum to TRQREV, nearest = role_fullstack, governance labels, planetarium receded but preserved, no dock; click role → URL `jobRoleId`, requirement states and provenance, pending kinds with ids; back and exit restore the capability field; reopen from URL, stale role named, pool selection from inside the field |
| P-JF-R | sealed SIL language suites, panel SSR, dock SSR, HR loop suites | preservation |

## 7. Run record

| Date | Revision | Run | Result |
| --- | --- | --- | --- |
| 2026-10-11 | working tree on `cf2d084` | `tsc --noEmit` | 0 errors |
| 2026-10-11 | same | `test/career/job-pool` without e2e + dock SSR (12 files) | 70 tests: 69 passed, 1 failed (my SSR test expected the absence-of-evidence sentence on the overview; the sentence is now part of the legend copy) → rerun green |
| 2026-10-11 | same | orbit relabel attempt (02/04/05) | reverted: sealed SIL language tests assert that copy (B-ORBIT-COPY); orbit 03 kept |
| 2026-10-11 | same | Job Pool e2e with the two Job Field cases, first run | 9/10: the control panel, open because a pool was selected, sat on the same top-left anchor as the Job Field's exit button and intercepted the click (real geometry defect, not a flaky test) |
| 2026-10-11 | same | repair: in JOB focus the panel remounts collapsed and anchored bottom-left (`data-anchor="BOTTOM_LEFT"`, max height 45 vh); SSR asserts it | e2e 10/10: HTTP 5/5, Chromium 5/5 (Job Field overview, role navigation with pending kinds, back/exit, reopen from URL, stale role, pool selection inside the field); evidence 17–19 |
| 2026-10-11 | same | sealed SIL language suites (5 files) + panel SSR + dock SSR + job-field SSR | 54 passed |
| 2026-10-11 | `3b0fc38` | preservation batch: `test/career/job-pool` + `test/career/hr-decision-loop` (without e2e) + 5 sealed SIL language suites + view-model (29 files) | first run 151/152: `hr-decision-loop/local-composition.postgres` "registers the unified persistence order on construction …" failed after 42 ms; alone 2/2, with the Job Pool composition suites 13/13, full batch rerun 152/152. Observed once in that run. GELB reproduced it deterministically (`--sequence.shuffle.files --sequence.seed=3`: `job-pool.postgres` first): the Job Pool route gate runs the same idempotent unified registration on the shared runner database, so my precondition "DCDRB table absent" failed. `a9121b9` relaxed the precondition to "nothing or the complete unified set"; GELB's full tree showed that is not enough either: other suites leave partial table sets (1 of 40) and rows (seeding collided on the action intent table) in the shared runner database. Root repair `8f95afc`: the test provisions, verifies and drops its own fresh disposable database and imports registration, composition and app client dynamically after binding DATABASE_URL to it; the original strict precondition (no table at all) is back. The fix is a dedicated database, not a relaxed precondition. Verified here after the Job Pool suite in shuffled order (seed 3): 13/13 |
| 2026-10-11 | `3b0fc38` | `tsc --noEmit` | 0 errors |

## 8. Semiontic layer (owner mandate "SFE — SEMIONTIC FRONTEND RECONSTRUCTION", 2026-10-11)

Frontend and interaction only. The pure model (`job-field-presentation.ts`), the contract, provenance, scoring
authority, governance and the DOM contract of §4 are unchanged; everything below is additive.

### 8.1 Motion grammar (`lib/career/job-pool/job-field-motion.ts`, pure; `JOB_FIELD_MOTION_GRAMMAR`, version `SEMIONTIC_V1`)

| Effect | Carries | Derivation | Rendered as |
| --- | --- | --- | --- |
| BREATH | POOL RESONANCE (PRESENTATION) of a role with a scored match | glow radius 6 + 20·s, glow opacity 0.22 + 0.58·s, body opacity 0.1 + 0.5·s, period 9 s − 4 s·s, light swing 0.35 + 0.35·s (all monotone in s) | blurred light under the node and the body fill breathe in opacity. Breath is light, never geometry: node bounds stay still (Playwright actionability, PINK's clicks) |
| STILL | no scored match delivered | glow 0, period 0, body opacity 0.07 | unlit node with a thin red-tinted outline on the outer ring, still, visible. PENDING != MISSING CAPABILITY |
| STEADY | MATCHED (scored) | no duration | solid cyan ring segment, steady dot |
| WAVER | UNRESOLVED (weak evidence) | 2.6 s | amber segment and dot waver in opacity: uncertainty as instability, never a verdict |
| CIRCULATE | COVERED_UNSCORED | 7 s, dash 3 3 | dashed cyan segment circulates (dash offset); dashed dot rotates. COVERED != SCORED |
| VOID | NO_EVIDENCE_DELIVERED | no duration, dash 1 3, opacity 0.45 | faint static gap in the ring; hollow dot. Absence of evidence, not of capability |
| FLOW | NEAREST PRESENTED ROLE | 2.4 s, dash 6 7 | the ray from the core flows outward; dashed because it is a direction, not a choice (NEAREST != CHOSEN) |
| ORBIT | one PENDING kind with ids | ring index i: radius +12 + 6i, dash (2 + min(10, n)) 9, period 14 s + 4 s·i, alternating direction | dashed rings orbit the hovered or selected role: grey unproven canonical, amber unresolved, dashed cyan unscored coverage, red no evidence. Kinds without ids draw nothing |
| EMERGE | delivered order | delay 110 ms·(rank − 1), capped 1.8 s, 760 ms | roles appear from the core in delivered order when the field opens; the planetarium recedes behind the blurred overlay (620 ms) |
| core | candidate | 7 s breath, scale 1.035; sweep halo circulates 26 s only when proposalCount > 0 | |

REDUCED mode (`prefers-reduced-motion`, `data-motion-mode="REDUCED"`): every duration is 0, every light value stays
(light is meaning, motion is emphasis). The stylesheet additionally forces `animation: none` under the media query.

### 8.2 Progressive disclosure

- Overview: title, exit, one state line with a living dot (pulses while LOADING), a legend card with the two source
  counts, the four state chips (each with its motion glyph) and the ranking line; the legend text (geometry sentence,
  motion grammar sentence, hover hint) is in the DOM but folded behind `job-field-legend-toggle`.
- Role node: resonance and delivered rank inside, short title below; organisation name and `NO SCORED MATCH` appear on
  hover or selection together with the orbiting pending rings (`data-focused`).
- Nearest card: title, organisation, resonance bar (`job-field-resonance-bar`), the authority label, the four PENDING
  cells (count large, kind small; click a cell for its ids), the canonical reason, `OPEN ROLE`.
- Role detail: header, resonance bar, `REQUIREMENT COMPOSITION` (segmented bar + chips with counts,
  `job-field-composition`), requirement lines with name, state chip, necessity, weight and level; provenance,
  confidence, quotes and weak-evidence reason are in the DOM but folded (`data-revealed`,
  `job-field-requirement-toggle-<req>`, `job-field-reveal-all`, hover reveals transiently); then the PENDING field.
- Organisation arcs brighten for the hovered or selected role's organisation; other organisations recede while a role is open.

### 8.3 Additive DOM contract

- `job-field`: `data-motion-grammar="SEMIONTIC_V1"`, `data-motion-mode` (LIVE | REDUCED), `data-hovered-role`.
- `job-field-role-<id>`: `data-motion` (BREATH | STILL), `data-focused`; inside: `[data-jf-light]` (only when BREATH),
  `[data-segment-state][data-motion]` (STEADY | WAVER | CIRCULATE | VOID), `[data-pending-kind][data-pending-count][data-motion="ORBIT"]` when focused.
- `job-field-nearest-ray`: `data-motion="FLOW"`; `job-field-core`: `data-motion="BREATH"`, `[data-sweep-halo][data-motion="CIRCULATE"]`.
- `job-field-legend`: `data-legend-open`; `job-field-legend-toggle`; `job-field-legend-text` (hidden until open).
- `job-field-resonance-bar` (`data-resonance-score`, `data-motion`); `job-field-composition` with `[data-segment-state][data-motion]`.
- `job-field-requirement-<req>`: `data-motion`, `data-revealed`; `job-field-requirement-toggle-<req>`; `job-field-requirement-evidence-<req>` (hidden until revealed); `job-field-reveal-all` (`data-revealed-all`).
- `job-field-pending-<KIND>`: `data-present`, `aria-expanded`, keyboard operable (Enter/Space lists the ids).
- `field-focus-job-btn` (planetarium): breathing glow while JOB focus is active (`fieldFocusSwitchBreath`, 6 s, reduced-motion guard).
- Copy keys added to `jobField` (en/de): `legendToggle`, `legendHide`, `motion`, `reveal`, `hide`, `revealAll`, `hideAll`, `ids`, `composition`, `hoverHint`. No existing copy changed.

### 8.4 Proofs

| Proof | File | Content |
| --- | --- | --- |
| P-JF-M | `test/career/job-pool/job-field-motion.test.ts` | one meaning per effect, vocabulary free of recommend/chosen/decision/verified/gap/rank; light, breath, body and tempo monotone in delivered resonance and only with a scored match; unlit roles still, visible, never zero; emergence by delivered rank, bounded; one motion per requirement state; one orbit ring per present pending kind; REDUCED zeroes every duration and keeps every light value |
| P-JF-S (extended) | `job-field-ssr.test.tsx` | server-rendered attributes: grammar version and LIVE mode, BREATH/STILL per role, STEADY/CIRCULATE per segment, FLOW on the ray, BREATH on the core, light element present, legend folded with its text in the DOM, resonance bar, pending cells with `data-present`, reduced-motion media rule; role detail lines folded with the evidence in the DOM, reveal-all, composition, selected role focused with its ORBIT rings only for present kinds |
| P-JF-B (extended) | `e2e/job-pool-workflow.e2e.test.ts` | Chromium: computed `animation-name` is `jfBreathLight` on the nearest role's light, no light element on an unlit role (`STILL`), `jfFlow` on the ray, `jfCirculate` on the sweep halo only with proposals, `jfWaver` on unresolved segments; legend text hidden → toggle → visible with the grammar sentence; hover → `data-focused` and exactly one ORBIT ring per pending kind with ids; role detail: evidence hidden → per-line reveal shows the delivered quote → reveal all leaves no folded line; resonance bar equals the delivered score; a page with `reducedMotion: "reduce"` renders `data-motion-mode="REDUCED"`, `animation-name: none` on light and ray, light opacity > 0 |
| P-JF-G, PINK static, sealed SIL suites, panel SSR, dock SSR | unchanged | preservation: the motion module sits under `lib/career/job-pool` and is covered by both import guards |

### 8.5 Run record

| Date | Revision | Run | Result |
| --- | --- | --- | --- |
| 2026-10-11 | working tree on `cccd647` | `tsc --noEmit` | 0 errors |
| 2026-10-11 | same | job-field motion/ssr/presentation, panel SSR, frontend presentation, GELB governance, PINK static | 45 passed |
| 2026-10-11 | same | 11 SIL language/orbit suites (incl. the 5 sealed ones) | 79 passed |
| 2026-10-11 | same | Job Pool e2e (HTTP 5 + Chromium 5) with the semiontic checks, fresh disposable DB | 10/10, 94 s; evidence 17, 18, 19 refreshed, 20 added |
| 2026-10-11 | same, canvas centre shifted 64 px left so the right organisation label clears the nearest card | full tree `test/career/job-pool` (with e2e) + PINK static + 5 sealed SIL suites + dock SSR, fresh disposable DB | 20 files, 131 passed |

Boundaries added: B-JF-MOTION-GEOMETRY (breath is light only; any future geometry animation on a clickable node must
be finite, because Playwright waits for a stable bounding box); B-JF-REVEAL (folded text stays in the DOM so every
textContent-based proof keeps binding; `hidden` + `display: none`, not removal).
