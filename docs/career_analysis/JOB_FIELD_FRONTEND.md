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

## 9. Information surfaces as field extensions (owner mandate "SFE — SEMIONTIC INFORMATION FIELD RECONSTRUCTION", 2026-10-11)

Frontend and interaction only; the pure model, the motion grammar (§8), every semantic distinction, provenance, scoring,
governance and authority boundary, and the DOM contract (§4, §8.3) are unchanged. Surface grammar `FIELD_EXTENSION_V1`
(`data-surface-grammar` on `job-field`).

### 9.1 What changed

| Before (§8) | Now |
| --- | --- |
| Bordered, blurred cards left and right ("surface" style), chips with borders, buttons as boxed controls | No containers. Two edge veils (`data-jf-veil="left|right"`, pointer-events none) deepen the void toward the margins so text reads directly on the field; the planetarium and the outer rim recede under them |
| One mono face at 9–11 px for everything | Two faces, one language: mono (token) for identifiers, numbers, tracked labels and state words; sans (token) for role titles (17 px / 600) and prose (11.5 px / 1.6). Display numbers in mono 30 px / 300 (pool resonance) and 20–22 px / 300 (source counts, pending counts) |
| Legend card: counts in one line, four bordered chips, sentences | Two source readings (number over label), a vertical key of four state words with their motion glyphs, the ranking line, and `LEGEND` as a text affordance that unfolds the prose |
| Nearest card | A reading: section label, title, organisation, a tether line from the field (cyan for a lit subject, red-tinted for an unlit one), the display resonance with its light bar and rank, the authority label, the four pending counts as tokens over a top rule (dashed for unscored coverage), the canonical reason as prose, `OPEN ROLE →` |
| Role detail card: meta line, bar, chips, bordered requirement rows | Organisation label with `ALL ROLES` as text, title, seniority · domain · ids as micro text, tether, resonance reading, composition (3 px bar + state words with counts), relations as a grid per line (glyph · capability name in sans · state word · necessity/weight · `REVEAL EVIDENCE`), evidence indented under a rule in the state colour with quotes in italic sans |
| Laws in the right column | Ground line: centred under the canvas, always visible, 8.5 px tracked, never competing |
| Pending ids folded inside the cell | A single ids line under the four tokens (`job-field-pending-ids`, `data-kind`) when a token is open; the cell keeps `title`, `data-ids` and `aria-expanded` |

Buttons remain `<button>` elements with their test ids; they read as text affordances (tracked uppercase, glow on hover,
visible focus ring) rather than as controls of a panel.

### 9.2 Proofs

| Proof | Content |
| --- | --- |
| P-JF-S (extended) | `data-surface-grammar="FIELD_EXTENSION_V1"`, both veils and both surfaces rendered, no border on the legend or the nearest reading; all earlier assertions unchanged (test ids, folded text in the DOM, governance labels) |
| P-JF-B | my e2e 10/10 and PINK's `job-field.e2e` 2/2 on the rebuilt surfaces without any change to their assertions (every textContent-based check still binds, e.g. `ANALYSIS CAPABILITIES (SCORED SOURCE): n` is kept contiguous in DOM order under a column-reverse layout) |
| P-JF-M, P-JF-U, P-JF-G, PINK static, sealed SIL suites, panel SSR | unchanged |

### 9.3 Run record

| Date | Revision | Run | Result |
| --- | --- | --- | --- |
| 2026-10-11 | working tree on `0353cd9` | `tsc --noEmit` | 0 errors |
| 2026-10-11 | same | job-field SSR/motion/presentation, panel SSR, GELB governance, PINK static, 2 sealed SIL suites | 56 passed |
| 2026-10-11 | same | my e2e (10) and PINK's job-field.e2e (2), each on its own disposable DB, in parallel | 12/12; first frames showed the laws line too faint and the role-detail frame captured mid-reveal (jfRise 320 ms): ground line set to 8.5 px at 55 % ink, 450 ms settle before each evidence frame |
| 2026-10-11 | same | rerun after the two corrections: full `test/career/job-pool` tree with e2e + PINK static + 5 sealed SIL suites + dock SSR; PINK's `job-field.e2e` in parallel on its own DB | 20 files / 131 passed; 2/2; tsc 0 |
| 2026-10-11 | `7006014` | evidence frame 17 reviewed: the ground line was still invisible. Cause: the planetarium root starts below the page header with `height: 100vh`, so its bottom edge is off-screen; `position: fixed` did not help because the overlay's `backdrop-filter` makes it the containing block of fixed descendants. Repair: the line is absolute, lifted by `var(--condyn-page-header-height, 60px) + 22px` (B-JF-GROUND-LINE) | e2e 10/10 + SSR 7/7 rerun; frame 17 shows the laws under the canvas |

Boundary B-JF-FONTS: no web font is loaded by the app shell; the mono and sans tokens resolve to the system faces
(`'JetBrains Mono', monospace` / `system-ui`). Loading a face is an app-shell decision outside this field.

Boundary B-JF-GROUND-LINE: bottom-anchored content inside the planetarium root is off-screen by the page header height,
and fixed positioning is captured by the overlay's backdrop filter. The ground line reads the custom property
`--condyn-page-header-height` (fallback 60 px); if the app shell changes the header height it should set that property.

## 10. Three field states: CAPABILITY · POOL · JOB (owner mandate "SFE — SEMIONTIC JOB POOL FIELD", 2026-10-11)

The Job Pool is no longer a control panel beside the planetarium but the third field state of the same system.
Frontend and interaction only; the routes, the workflow hook, the pure models, every semantic distinction, provenance,
governance and authority boundary and every `job-pool-*` test id and data attribute are unchanged. Field grammar
`POOL_FIELD_V1` on `job-pool-panel` (the panel's root element is now the field), with the surface grammar
`FIELD_EXTENSION_V1` and the motion grammar `SEMIONTIC_V1` of §8/§9.

### 10.1 Field states and transitions

| State | URL | Opened by | What the field is |
| --- | --- | --- | --- |
| CAPABILITY (ground) | no `focus`, or `focus=CAPABILITY` (written on every exit while an exact upload is selected, so a reload keeps the ground state; PINK E-07) | default; `field-focus-capability-btn`; the in-field exits | the capability planetarium, orbits 01–06 |
| POOL | `focus=POOL`; also an exact `jobPoolUploadId` without a `focus` | `job-pool-panel-toggle` (strip) | the Job Pool Field: persisted uploads on a ring, the explicitly selected upload at the core, its organisations and roles around it, intake and the delivered matching as readings |
| JOB | `focus=JOB` | `field-focus-job-btn` (strip); `job-pool-enter-job-field` from the Pool Field | the Job Field of §1–§9 |

The field-state strip (`field-focus-strip`, `data-field-focus`) names the three states constantly (◈ CAPABILITY ·
⬡ JOB POOL · ◉ JOB, `data-field-focus-active`, `aria-pressed`); the active state glows and breathes; clicking it returns
to the ground state. Entering POOL or JOB is the same kind of transition: the planetarium recedes under a blurred
overlay (620 ms), the field's nodes emerge in delivered order. An explicit `focus=JOB` wins over an upload id.

### 10.2 The Pool Field (`lib/career/job-pool/pool-field-presentation.ts`, pure; `JobPoolMatchPanel.tsx`)

| Element | Derivation | Rendered as |
| --- | --- | --- |
| Upload ring | `uploadOrbit`: persisted uploads in delivered order, slots offset by half a slot, radius 345 | HTML nodes (`job-pool-item-<id>`, `data-selected`, `data-pool-status`, `data-at-core`, `data-delivered-index`) positioned by the same geometry as the SVG; each node is its own `job-pool-select-<id>` button (disabled and `aria-pressed` when selected); DRAFT/ARCHIVED dashed amber |
| Selection | the explicitly selected upload has no angle: `x = y = center` | the node is drawn into the core (780 ms, the planetarium's own focus curve). UPLOADED != SELECTED is geometry: the ring never moves a "latest" upload to the core |
| Core | `job-pool-core` (`data-motion="BREATH"`), 7 s breath, dashed halo circulating only when a pool is at the core | empty core: "NO UPLOAD AT THE CORE · select an upload on the ring; it moves to the core" |
| Structure | `derivePoolStructure(view, matching)`: organisations as arcs (radius 245) from the canonical mapping, one slot per role on the inner ring (190), grouped by pool organisation in delivered order, requirement ticks around each role | `job-pool-structure-canvas`, `job-pool-structure-organization-<org>` (`data-role-count`), `job-pool-structure-role-<role>` (`data-requirement-count`, `data-resonance-score`, `data-scored-match`, `data-motion` UNLIT | BREATH | STILL, `data-selected`, `data-focused`) |
| Light | a role carries light only when the delivered matching names it for this exact upload (`matchingDelivered`); same `roleMotion` as the Job Field | unlit nodes show their requirement count; lit nodes show POOL RESONANCE (PRESENTATION) |
| Role reading | click a structure role | `job-pool-structure-role-detail` (`data-role-id`) with `job-pool-structure-requirement-<req>` (`data-necessity`, `data-eligibility`), `job-pool-structure-role-back` |
| Left surface | title, `fieldSubtitle`, list state (`job-pool-list-state`, `data-list-state`), `job-pool-analysis`, intake (`job-pool-upload` with the unchanged inputs, button and result ids; underline inputs, text affordances) | |
| Right surface | `job-pool-selected` (title, id, tether, ORG · ROLES · REQ readings, `job-pool-canonical-mapping`), the structure role reading, `job-pool-matches` with `job-pool-enter-job-field`, labels as state words, ranking, `job-pool-capability-sweep`, `job-pool-role-list` of `job-pool-role-<id>` readings (display resonance, title, counts; relations folded behind `job-pool-role-<id>-toggle`, `data-revealed`, in the DOM throughout incl. `job-pool-trqrev-*`), organisation aggregates | |
| Ground line | `job-pool-non-claims`, lifted by the header height (B-JF-GROUND-LINE) | |
| Exit | `job-pool-panel-collapse` (← CAPABILITY FIELD) in the field; the strip | |

Removed: the panel's `anchor` prop and `data-anchor` (bound only by my own SSR proof, replaced by the strip
assertion); the panel's own fixed toggle (still rendered by the standalone `JobPoolMatchPanel` wrapper when closed,
`showToggle`). Copy: `collapse` now reads "← CAPABILITY FIELD" / "← CAPABILITY-FELD"; additive keys `fieldSubtitle`,
`orbit`, `coreEmpty`, `coreHint`, `structure`, `structureHint`, `structureRole`, `requirements`, `revealRequirements`,
`hideRequirements`, `revealRole`, `hideRole`, `enterJobField`, `intake`, `allRoles` (jobPool) and `capabilityField`
(jobField), en/de. No other copy changed.

### 10.3 Proofs

| Proof | Content |
| --- | --- |
| P-PF-U `pool-field-presentation.test.ts` | ring in delivered order with half-slot offset, only the explicit selection at the core, slots kept, stale selection moves nothing; structure grouped from the canonical mapping, unlit without a matching; light only from a matching of the exact same upload with delivered score and rank; list state; no canonical/decision/verified claim |
| P-JP-S `panel-ssr.test.tsx` (+2) | POOL focus from an upload id: strip states, field/surface/motion grammar, orbit, structure canvas, core, veils, exit; explicit JOB wins; standalone wrapper renders the orbit (empty list) and the matching readings folded with the quotes and TRQREV ids in the DOM |
| P-JF-S | JOB focus: strip with the inactive POOL switch; default focus mounts no field |
| P-JF-B (my e2e, case 5 extended) | toggle = change of field state (`data-field-focus="POOL"`, `focus=POOL`), no node at the core before selection; after selecting: exactly one node at the core, its button disabled, structure roles = pool roles, organisations = pool organisations, the fullstack role lit (`BREATH`, `data-scored-match="true"`), role reading with its requirement count; relations folded → revealed; `job-pool-enter-job-field` → JOB with the same `data-pool-id`, Pool Field unmounted; strip back to POOL, in-field exit → CAPABILITY, `focus` removed. Case 7: an upload id without focus opens POOL; JOB reached through the strip |
| PINK `browser-walk.e2e` 1/1, `job-field.e2e` 2/2, `layer-separation` 4/4, `job-field-static` 3/3 | unchanged assertions on the carried contract |
| sealed SIL suites, dock SSR, governance guard | preservation |

### 10.4 Run record

| Date | Revision | Run | Result |
| --- | --- | --- | --- |
| 2026-10-11 | working tree on `093b9e6` | `tsc --noEmit` | 0 errors |
| 2026-10-11 | same | unit/SSR/governance/PINK static/layer separation/5 sealed SIL suites/dock SSR (16 files) | 102 passed |
| 2026-10-11 | same | my e2e (10) · PINK browser-walk (1) + job-field.e2e (2), three disposable DBs in parallel | 10/10 · 3/3 |
| 2026-10-11 | same | frames reviewed: upload slot 1 sat on the ring label at 12 o'clock → half-slot offset; the strip read "◉ JOB · ← CAPABILITY FIELD" → three constant state names with active glow and a CAPABILITY ground-state switch; frame 01 captured mid-entrance → 900 ms settle; node names clamped to two lines; exit link on its own line | rerun below |
| 2026-10-11 | same | rerun after the corrections (16 files; my e2e; PINK browser-walk + job-field.e2e) | 102 passed · 10/10 · 3/3 |
| 2026-10-11 | same | frames reviewed again: an upload node clipped an organisation label → upload ring 345, nodes 88 px; my e2e rerun for the evidence frames | 10/10 (see commit) |
| 2026-10-11 | `1e5c2e3` + fix | PINK E-07: after an exit the URL kept `jobPoolUploadId` without `focus`, so a reload reopened the Pool Field. Repair: exits write `focus=CAPABILITY` while an upload is selected; page.tsx accepts it; proven by reload in the e2e and by SSR | panel SSR 9/9, job-field SSR 7/7, e2e 10/10, tsc 0 |

Boundary B-POOL-INITIAL-FOCUS: an exact `jobPoolUploadId` without any `focus` opens the Pool Field (an exact selection
is a field state); an explicit `focus` (JOB, POOL or CAPABILITY) always wins. Exits write `focus=CAPABILITY` whenever an
upload is selected, so an explicit exit survives a reload (PINK's E-07 observation, 2026-10-11).

## 11. Galaxy grammar (owner mandate "SFE — GALAXY / NEBULA FIELD RECONSTRUCTION", 2026-10-11)

Frontend and interaction only; models, routes, semantics, provenance, scoring, governance, authority and the DOM
contracts of §4, §8.3, §9, §10 are unchanged. Galaxy grammar `GALAXY_V1` (`data-galaxy-grammar` on `job-field` and
`job-pool-panel`). Every new structure expresses one delivered fact; nothing is decorative.

### 11.1 Structures

| Structure | Delivered fact | Rendered as | Where |
| --- | --- | --- | --- |
| Nebula | one pool organisation (identity) and its delivered organisation aggregate (`organizationMatches[].aggregateScore`, POOL RESONANCE, PRESENTATION) | a blurred annular sector over the organisation's angular range; hue = identity only, by delivered position (`ORGANIZATION_HUES`, 190 · 262 · 158 · 222 · 300 · 120); light = 0.05 + 0.30 × aggregate, breathing at 1.6 × the core period; without a delivered aggregate a faint constant 0.045 (identity, no value) and no breath | `job-field-nebula-<org>` (`data-aggregate-score`, `data-hue`, `data-motion` BREATH | STILL), `job-pool-nebula-<org>` (aggregate only when a matching of the exact upload was delivered) |
| Thread | scored evidence between the candidate and a role (`resonanceScore > 0 && matched.length > 0`) | a line from the core to the role, opacity 0.08 + 0.42 × resonance; no thread without a scored match | `job-field-thread-<role>` (`data-resonance-score`); the nearest ray (FLOW) stays on top |
| Moon | one requirement of a role and its state | one small body per requirement around the node (`requirementMoons`, radius + 10, fixed state order MATCHED · UNRESOLVED · COVERED_UNSCORED · NO_EVIDENCE_DELIVERED, never by weight): solid cyan steady, amber wavering, dashed cyan spinning, hollow red still | `job-field-moon-<req>` (`data-segment-state`, `data-motion`); replaces the ring arcs on the node (the composition bar keeps `data-segment-state` segments) |
| Reading | delivered title, organisation, resonance and the four counts | one plain sentence per surface, from a copy template (`jobField.reading`, en/de) | `job-field-reading` on the nearest reading and the role detail |

Organisation arcs and labels keep their hue; in the Pool Field the organisation name runs along its arc as curved
text (`labelArc`, counter-clockwise on the lower half so it reads upright) so no upload node can cover it.

### 11.2 Less information

| Surface | Visible by default | Folded (in the DOM, one affordance) |
| --- | --- | --- |
| Job Field left | title, exit, subtitle, state line, the four state words | `LEGEND`: source counts, ranking, geometry, motion grammar, galaxy grammar, hover hint |
| Job Field nearest | section label, title, organisation, reading sentence, tether, resonance, rank, authority label, four pending tokens, `OPEN ROLE` | `WHY PENDING` → `job-field-pending-reason` |
| Job Field role detail | title, reading sentence, seniority · domain · ids, resonance, composition, relation lines (name + state word) | per line: necessity, weight, level, provenance, confidence, quotes, weak reason; `WHY PENDING` |
| Pool Field selected upload | title, id, tether, ORG · ROLES · REQ, mapping state words | `LAYER C DETAILS` → provider, TOREV/TRPREV/TRQREV counts, sha256, boundary (`job-pool-layer-c-toggle`, `data-revealed` on `job-pool-canonical-mapping`) |
| Pool Field matching | labels, ranking, `ENTER JOB FIELD →`, role readings (resonance, title, rank · organisation · seniority · domain, counts) | `MATCHING DETAILS` → kind/policy/authority line, candidate capabilities and threshold, sweep block, missing boundary, organisation aggregates (`job-pool-matching-details-toggle`, `job-pool-matching-details`); per role `REVEAL RELATIONS` |

Typography: titles 20 px sans, prose 12.5 px sans, micro and labels 9 px mono, display resonance 34 px (Job Field)
and 30 px (Pool Field), node titles 12 px sans, requirement names 14 px sans.

### 11.3 Proofs

| Proof | Content |
| --- | --- |
| P-JF-U (+1) | organisations carry the delivered aggregate as nebula light (null when not delivered) and an identity hue by position; moons in fixed state order with exact geometry; sector paths |
| P-PF-U (+) | Pool Field organisations carry the aggregate only with a matching of the exact upload; label arcs run counter-clockwise on the lower half |
| P-JF-S (+) | `data-galaxy-grammar`; nebula with aggregate 0.525, hue 190, BREATH; thread only for ROLE_A; moons REQ_1 MATCHED/STEADY, REQ_2 COVERED_UNSCORED/CIRCULATE, REQ_3 UNRESOLVED/WAVER; the reading sentence verbatim; `job-field-pending-why` with the reason folded; galaxy sentence in the legend |
| P-JP-S (+) | `data-galaxy-grammar`, matching details folded with the sweep block, aggregates and labels in the DOM |
| P-JF-B (+) | Chromium: nebula count = pool organisations with their delivered aggregates; thread count = roles with scored evidence; moon count per role = its TRQREV count; reading sentence present; reason hidden → `WHY PENDING` → visible; Pool Field: nebula count, matching details hidden → toggle → visible |
| PINK browser-walk, job-field.e2e, static, layer separation; sealed SIL suites; dock SSR; governance guard | unchanged |

### 11.4 Run record

| Date | Revision | Run | Result |
| --- | --- | --- | --- |
| 2026-10-11 | working tree on `142df0f` | `tsc --noEmit` | 0 errors |
| 2026-10-11 | same | first SSR run | 1 red: my assertion guessed REQ_3 as MATCHED; the fixture delivers it as weak evidence (UNRESOLVED/WAVER); assertion corrected |
| 2026-10-11 | same | frames reviewed: the open legend overflowed the left surface → the surface scrolls; moons 3.2 → 3.8; an upload node could cover an organisation name in the Pool Field → names as curved text on the arc | rerun below |
| 2026-10-11 | same | rerun: unit/SSR/governance/PINK static + layer separation/5 sealed SIL suites/dock SSR (16 files) · my e2e · PINK browser-walk + job-field.e2e, three disposable DBs in parallel | 103 passed · 10/10 · 3/3; tsc 0 |

## 12. Lens model: the galaxy is the interface (owner mandate "SFE — PURE SEMIONTIC INTERFACE RECONSTRUCTION", 2026-10-11)

Frontend and interaction only; every model, route, semantic distinction, provenance, scoring, governance and authority
boundary and every bound id are unchanged. Interaction grammar `LENS_V1` (`data-interaction-grammar`,
`data-focus-level` on `job-field` and `job-pool-panel`). The columns of §9 are gone; information exists only in context.

### 12.1 Focus levels

| Level | Job Field | Pool Field |
| --- | --- | --- |
| FIELD | the galaxy; one caption at the nearest presented role (`job-field-nearest`, pointer-transparent except its button, placed on the free side of the body, `data-caption-side`); a one-line header (title, exit, state); the legend affordance; the ground line | the ring and the empty core; the intake lens (`job-pool-upload`) is the contextual action while nothing is at the core (`data-intake-visible`); header line with list state and analysis; the core lens (`job-pool-selected`) reads the selection state |
| POOL (Pool Field) | — | the selected upload at the core; the core lens reads it (ORG · ROLES · REQ, id, mapping state words, LAYER C fold) and carries `job-pool-matches` (labels, ranking, readings hint, MATCHING DETAILS fold, ENTER JOB FIELD); the intake recedes behind `job-pool-intake-toggle` |
| ROLE | the camera moves onto the role (`data-camera-scale="1.5"`, 780 ms on the planetarium's focus curve, the role at 35 % of the stage); its moons spread to `radius + 40` (`data-moon-radius`) with their capability names (`data-jf-moon-label`); hovering a moon enlarges it and reveals its line; everything else recedes (roles 0.22, nebulae 0.5, threads 0.3, core 0.55); one lens (`job-field-lens`, `data-role-id`) opens beside the role with `job-field-role-detail`; the caption is gone | a structure role is focused: its lens opens at the body (`job-pool-role-lens-<role>`: `job-pool-structure-role-detail` with its requirements and, when a matching was delivered, the role's reading `job-pool-role-<role>` with relations folded); the upload ring recedes (0.18), the core lens dims and ignores pointer events; `job-pool-structure-role-back` returns |

Every reading of every role is in the DOM at all times (`job-pool-role-list` is the layer of lenses, one per
delivered role, hidden unless focused), so every textContent-based proof keeps binding; only the focused one shows.

### 12.2 What is never permanent

Legend (`job-field-legend-toggle` → `job-field-legend-text`, bottom-left), intake (`job-pool-intake-toggle`),
canonical reason (`job-field-pending-why`), evidence (`job-field-requirement-toggle-<req>`, `job-field-reveal-all`),
layer C details, matching details, relations per role. Visible at all times: the field-state strip, one header line, the
caption or the lens of the current focus, the ground line.

### 12.3 Proofs

| Proof | Content |
| --- | --- |
| P-JF-S (+) | FIELD: `LENS_V1`, `data-focus-level="FIELD"`, stage, no veils, no left/right surfaces, header line, caption with side and pointer-events none, camera 1, no lens. ROLE: `data-focus-level="ROLE"`, camera 1.5, lens with the role id, moon radius 68, moon labels, no caption |
| P-JP-S (+) | no veils; `LENS_V1`, FIELD level and intake hidden for a given upload id; intake affordance; role lenses in the DOM hidden; role-list count |
| P-JF-B (+) | Chromium: FIELD level with camera 1, no lens, legend hidden → role click → ROLE level, camera 1.5, lens for the role, caption gone, five moon labels on the fullstack role; Pool Field: intake visible with an empty core → hidden after selection → affordance shows and hides it; structure focus → ROLE level with the role lens visible → back hides it; relations toggled inside the lens; all earlier assertions unchanged |
| PINK browser-walk 1/1, job-field.e2e 2/2, static, layer separation; sealed SIL suites; dock SSR; governance guard | unchanged assertions on the carried contract |

Boundary B-CAPABILITY-CHROME: the CAPABILITY ground state keeps its pre-existing chrome (source dock, decision graph
inspector, telemetry HUD, zoom HUD); it is bound by the sealed SIL suites and the planetarium chrome proofs and was not
reconstructed under this mandate. Bringing it under the lens model is an owner decision over those sealed contracts.
Boundary B-LENS-HIT: a caption is pointer-transparent except its buttons so no body is ever covered for a click; a lens
is interactive and sits on the free side of its body; a viewport-anchored lens must be a child of the overlay root, never
of the transformed stage (a transform makes `position: fixed` relative to it).
Boundary B-LENS-TRANSFORM: entrance animations on positioned lenses animate opacity only; a keyframe that ends on
`transform: none` with a fill mode overrides the inline transform that places the lens.
Boundary B-LENS-FILL (F-LF-2, PINK): a reveal animation releases its element when it ends (`fill-mode: backwards`,
never `both`/`forwards`). A fill mode that holds the final keyframe pins the animated property for the element's
lifetime and overrides every later inline value, so a state-dependent opacity (the core lens receding to 0.25 while a
structure role is focused, the canonical reason at 0.85) read as 1. Animation expresses the entrance only; the
relational state after it is the inline style. The e2e asserts the computed opacity of the core lens at ROLE level
(< 0.5) and after ALL ROLES (1); both SSR suites pin the fill mode.

### 12.4 Run record

| Date | Revision | Run | Result |
| --- | --- | --- | --- |
| 2026-10-11 | working tree on `ee4c4dc` | `tsc --noEmit` | 0 errors |
| 2026-10-11 | same | first run: my e2e 10/10 · PINK browser-walk 1/1 + job-field.e2e 2/2 · unit/SSR batch 100/103 | the 3 reds were my SSR assertions matching the stylesheet text (the ids now appear in selectors); matched the element markup instead → 7/7 |
| 2026-10-11 | same | frames reviewed: the nearest caption sat on its body. Cause: the reveal keyframe ended on `transform: none` with `fill-mode: both`, cancelling the inline transform that places a caption beside its body → reveal animations are opacity-only (B-LENS-TRANSFORM). The role lens covered the spread moon labels → moved to 35 % + 210 px. The Pool Field core lens below the core covered the lower bodies → a tethered reading at the viewport edge, vertically centred | — |
| 2026-10-11 | same | the core lens, declared `position: fixed` inside the transformed stage, was pinned to the stage and intercepted a click on a body (my e2e, 37 retries) → moved to the overlay root (B-LENS-HIT) | my e2e 10/10 + panel SSR 8/8 · PINK browser-walk 1/1 + job-field.e2e 2/2 · 16 files / 103; tsc 0 |
| 2026-10-11 | F-LF-2 (PINK, owner mandate "F-LF-2 FOCUS RELATION REPAIR") | the core lens read opacity 1 while a structure role was focused although the inline style said 0.25: the reveal rule `jpRise … both` held the last keyframe for the element's lifetime (opacity twin of B-LENS-TRANSFORM); the same rule in the Job Field pinned the canonical reason to 1 instead of 0.85 → both reveal rules use `fill-mode: backwards` (B-LENS-FILL); no derivation, data or copy change | e2e 10/10 ×3 (polled core-lens state: 0.25 / pointer-events none / ROLE at focus, 1 / auto / POOL after ALL ROLES) · job-field SSR 8/8 · panel SSR 9/9 · presentation/motion/static/layer-separation green (7 files / 46) · tsc 0 |
| 2026-10-11 | `af53a58` + fix | frame 17: the nearest caption, placed on the inner side of its body, covered the candidate core → the caption sits outward from the core (`data-caption-side` = right for bodies on the right half, left otherwise) | my e2e 10/10 + job-field SSR 7/7 · PINK browser-walk 1/1 + job-field.e2e 2/2; tsc 0 |
| 2026-10-11 | `2ce8266` + fix | GELB governance note: the authority label in the caption was the smallest text (8.5 px) → 10.5 px (`job-field-authority-label`), asserted by SSR | job-field SSR 7/7; tsc 0 |


## 13. SYNTX semiontic field: the field is the language (owner mandate "SFE — SYNTX SEMIONTIC FIELD RECONSTRUCTION", execution authorization 2026-10-11)

Target architecture: `docs/architecture/decision-fields/SYNTX_SEMIOTIC_RECONSTRUCTION_SPEC.md` (owner, verbatim).
Governing contract: `docs/architecture/decision-fields/SYNTX_FIELD_CONTRACT_BINDING.md` (GELB): §2 binding table sign → repository
field → proof reference, §3 unsupported list, rulings R1–R14. A sign the binding does not bind is not rendered.

The former Pool Field (`focus=POOL`) and Job Field (`focus=JOB`) are one field. The spec's §8 (pool topology) is the FIELD and
ORGANIZATION state of that field, its §9 (role-centred constraint ecology) the ROLE and REQUIREMENT state. `focus=FIELD` opens it;
`JOB` and `POOL` are accepted as legacy aliases of `FIELD`; an exact `jobPoolUploadId` without a focus opens it (B-POOL-INITIAL-FOCUS
unchanged); exits write `focus=CAPABILITY` while an upload is selected. The Capability Field is untouched (R10, B-CAPABILITY-CHROME).

### 13.1 Architecture

| Layer | File | Role |
|---|---|---|
| View model (pure, no React) | `lib/career/job-pool/syntx-field-view-model.ts` | `deriveSyntxField(view, matching, analysisSources, observation)` → entities, relations, visual signs (§14.3), transitions, proof references, camera, summary facts. `resolveObservation`, `observeOrganization/Role/Requirement`, `inspectSign`, `returnFrom`, `observationFromParams`, `summarySentence`. Grammar id `SYNTX_FIELD_V1`. |
| Analysis sources (the permitted second read, R12) | `lib/career/job-pool/analysis-sources.ts`, `lib/career/ui/useJobPoolSources.ts` | `GET /api/career/analyses/{id}` decoded to exactly three surfaces: documents (docId → title), capability evidence (CAP_*, docId, quote, location), proposal evidence (PCAP_*, EVD_*, docId, quote). `matching`, `recommendations`, inferred organizations and roles are never decoded (binding §1). |
| Renderer | `app/components/career/demo/SyntxField.tsx` | SVG field under a camera (recenter), HTML apertures, edge affordances; every rendered sign carries the attributes of §13.3. Replaces `JobField.tsx` and `JobPoolMatchPanel.tsx` (deleted). |
| Requirement states / pending kinds | `lib/career/job-pool/job-field-presentation.ts` | kept: `deriveRequirements`, `countRequirements`, `derivePending` (F-LF-1 dimensions), `provenanceOf`; the 1 − resonance geometry, the nearest presented role, moons, nebulae and threads are removed (R13/R14). `pool-field-presentation.ts` and `job-field-motion.ts` are deleted. |
| SIL field | `SemanticCareerIntelligenceField.tsx` | `fieldFocus: "CAPABILITY" \| "FIELD"`; observation point from `jobOrganizationId` / `jobRoleId` / `jobRequirementId` (URL, additive; the aperture is never in the URL); strip of two constant states `◈ CAPABILITY` · `⬡ JOB FIELD` (`field-focus-capability-btn`, `job-pool-panel-toggle`). |

### 13.2 Observation points and geometry

| Level | Trigger | Field reorganisation (camera) | Geometry (R4, R14, §9.2) |
|---|---|---|---|
| FIELD | enter, RETURN | centre, scale 1 | pool = total field (faint boundary); organizations as named regions on one ring, region radius = density (number of roles, never importance); roles as readable carriers inside their region (containment from `organization_id` = canonical binding, never label text); requirement density preview as ticks; **no score, no coupling, no delivered-order position** |
| ORGANIZATION | select region (click / Enter) | recenter on the region, scale ≤ 2.6 | the region unfolds (roles spread), other regions recede (opacity), the pool stays faintly recoverable |
| ROLE | select carrier | recenter on the role, scale 1.8 | the role is the centre of its constraint ecology: anchors at a distance by support category only (`SUPPORTED` 78 < `WEAK` 98 < `SWEEP_ONLY` 118 < `OPEN` 138; `UNREAD` 104 without a matching read); traces from anchor to source carriers (stable / thin / dotted; contribution modulates the weight only within a category); one suspended boundary (dashed circle, radius 158) for the pending canonical evaluation of the whole ecology (R2); source carriers on an outer ring (one per delivered docId); the organization region stays behind as origin context; other roles recede |
| REQUIREMENT | select anchor | recenter between anchor and role, scale 2.4, shifted the least that keeps the anchor with its label and every reached source carrier (title included) inside the view (O-SX-4) | the anchor is selected, its traces are inspectable, every other anchor and trace recedes |
| aperture | inspect a trace, an open boundary or the suspended boundary (click / Enter) | none (the aperture is HTML beside the inspected sign) | one temporary element; closes on Escape, CLOSE or any return |
| RETURN | Escape · `← RETURN` · the path · the background · the aperture CLOSE | restore | aperture → REQUIREMENT → ROLE → ORGANIZATION → FIELD; nothing mutates stored data |

Ecology geometry since the perceptual closure (owner mandate "SFE — SYNTX FINAL PERCEPTUAL CLOSURE", 2026-10-11; all of it in
`syntx-field-view-model.ts`, the renderer draws the same numbers): the ecology is composed as the Capability Field's deep focus is
(nucleus, satellites, evidence beneath): requirement anchors are the satellites of the role core on the arc outside the evidence sector
(`EVIDENCE_SECTOR` = 90° at the bottom, centred straight below; strongest support first, top-centred), each on a faint spoke; source
carriers sit inside the ecology beneath the core (`SOURCE_RING_RADIUS` = 104, inside the suspended boundary at 158), attached to the
core by the mint evidence link, nearest to the sector centre (straight below the nucleus; clearance only breaks ties; carriers ≥ 28° apart).
Visual correction on 7bda76a (owner mandate "GREEN — CONCRETE VISUAL CORRECTION"): the observed role is the ecology's nucleus at
`ECOLOGY_NUCLEUS_RADIUS` = 45 (×1.5), drawn with the Capability Field L2 nucleus materials (depth gradient rgba(7,45,53,.98) →
rgba(2,8,14,1) 76 %, mint highlight at 50 % 30 %, glow .36, cyan 1.5 border); the ecology radii scale with it ×1.3 (support distances
SUPPORTED 101 · WEAK 127 · UNREAD 135 · SWEEP_ONLY 153 · OPEN 179, boundary 205, carrier ring 135, role clearance 62 — categories and
order unchanged; ROLE / REQUIREMENT camera scales 1.8 / 2.4 unchanged, the REQUIREMENT framing also keeps the nucleus in view); the
deep-focus backdrop gradient fills the ecology as one resonance region; satellites fan from the top of the nucleus (strongest support
in the middle slot, the next alternating to either side), so the evidence beneath reaches them as a fan, never as one converging
bundle; the visible traces, spokes and link are screen-constant filaments (`vector-effect: non-scaling-stroke`: 1–1.2 px at rest, 1.5 px
inspectable, halo 6 px at .07), photons and beads are sized in screen pixels; the selected anchor carries the emphasis (glow r + 11 at
.45). Formerly: at the angle within the sector where the
straight traces of the requirements that reach them clear the role carrier and every requirement label best, nearest to the mean
direction of those requirements, with a minimum separation of 28° between carriers (`placeSourceAngles`); every trace is a quadratic
arc as the planetarium's inter-orbital couplings are (`tracePath`: base sweep `TRACE_SWEEP` = 0.14 of the span to the left normal, one
handedness for all traces) with a `bow` (further perpendicular midpoint offset, 0 = the base arc; candidates 0, ±18, ±36, ±54, ±72) chosen as the first bow that clears the role disc
(48, body with its inner title), every requirement label box, every other anchor and every other carrier, never a bow a co-terminal
trace of the same requirement and source already took (`routeTraceBows`, F-SX-2 / O-SX-2); when nothing clears, the clearest unused bow
is taken, so every trace is drawn and distinct. Angle and bow position nothing semantically (R14): distance alone carries the support
category. The requirement label geometry (`requirementLabel`) is shared by the routing and the renderer.

#### 13.2.1 The living field (owner mandate "SFE — SYNTX LIVING FIELD · VISUAL RECONSTRUCTION", 2026-10-12)

The Job Field adopts the Capability Field's (planetarium) visual grammar, reconstructed from `SemanticCareerIntelligenceField.tsx`,
`SILTokens.ts`, `IdentityCoreDropZone.tsx`, `OrbitalResonanceBubble.tsx`, `SilOrbitEmptyState.tsx` and `CapabilityDeepFocusView.tsx`
(read only; those files stay byte-identical, B-CAPABILITY-CHROME / B-ORBIT-COPY untouched). Everything lives in `SyntxField.tsx`;
the view model, sign ids, enums, proofs, summaries and the DOM contract are unchanged; attributes are additive only.

Materials (static, each with a sign referent): the pool carries the atmosphere (`#sxField` radial, cyan .16 → 0), the three orbit
paths (.35R / .68R / R at `rgba(56,229,255,.12)`, the middle one dashed `4 4`), the containment ring (R−40, dash `12 18`), the six
ambient dots (.82R) and four dust points (.5R) of the planetarium, and one containment spoke per region (`3 3`, .22, mid bead) —
the relation `contains` drawn from the pool centre to each region. A region is a membrane: soft glow underlay (`#sxGlow` feGaussianBlur,
cyan .09, selected .16), radial fill (`#sxMembrane`), a dashed outer ring (r+8, `3 3`), the body stroke, the name in mono and a
density line (`N ROLES`). A role carrier is a core: glow underlay (.12, lit .26), dashed halo (r+9), the body filled with `#sxCore`,
the density ticks, a density line (`N REQUIREMENTS`) under the title, and the title inside the body in the ecology. Source carriers
and the observed anchor carry a glow underlay; traces carry a wide low-opacity underlay that appears only while `inspectable`.
Glow referents (the only elements with glow): `data-sign-manifestation="region"`, `data-sign-manifestation="carrier"` (roles and source
carriers; stronger for `role_selected`, source glow with `field` / `inspectable`), `data-sign-state="requirement_selected"`,
`data-sign-state="inspectable"` (trace underlay), plus the existing focus-visible drop shadow. The stage sits on the deep-focus
vignette (`rgba(14,66,73,.2)` top light over `rgba(2,12,20,.45)`).

Depth: once a role is observed, regions still in state `field` and receded carriers (both without visible labels) carry
`data-sx-depth="far"` → `filter: blur(1.4px)` with a .62 s transition; no visible text is ever blurred or scaled at rest.

Transitions (finite, fill-mode backwards, bound to the sign): `sxUnfold` — anchors with `data-sign-transition="unfold"` grow out of
the role centre (`transform-box: view-box`, `transform-origin: var(--sx-origin)` = the observed role, scale .3 → 1 + opacity, .78 s,
the planetarium's focus easing `cubic-bezier(.16,1,.3,1)`); `sxTraceRise` — traces, source carriers and open boundaries with
`trace_rise` rise from the same origin (.78 s, .12 s later); `sxSuspendEnter` — the pending boundary enters once (`boundary_suspend`,
scale .94 → 1), then only the existing `sxSuspend` dash drift; `sxRecenter` — one pulse ring (scale 1 → 1.45, opacity .7 → 0, .9 s,
fill-mode forwards) on the sign that enters `organization_selected` / `role_selected` / `requirement_selected`; `recede` and `restore`
stay the opacity transition (.45 s). Roles move with the region's unfolding (`transform: translate` with the .78 s focus easing; the
body is drawn at the group's local origin). The camera is unchanged (1 / ≤ 2.6 / 1.8 / 2.4, .78 s). Hover brightens the halo / outer
ring of a selectable sign. Hit areas cover the rings (region hit circle r+9, carrier hit rect r+11, anchor hit rect r+10), so a click at
the edge of a sign's box still selects it.

Ambient life (the one separable switch `SYNTX_AMBIENT_MOTION`, root attribute `data-sx-ambient`): LIVE mode, FIELD and
ORGANIZATION levels only, signs in state `field` only, uniform per kind, phase by containment only (`--sx-phase` = organization
index × −1.05 s for roles; regions answer the core 1.2 s later, 0.35 s apart): `sxOrbit` — inside the pool sign only (FIELD level):
the containment ring (120 s), the core's plasma rings (120 s / 90 s reverse), the inner and middle orbit paths and a third core ring
(`--sx-period` 150–260 s), the two resonance rings around each region (64–118 s, counter-turning) and the ambient motes drifting in
small circles about an offset origin (`data-sx-drift`, 26–59 s); `sxBreathe` — region membranes (both membrane circles), region glow,
region signature ring (12.4 s dash flow), role halos and role glow breathe in opacity (.5 → 1 → .5, ease-in-out) with a dash drift
(−30 per cycle); inside the pool sign the core glow breathes (`data-sx-core-breath`), the containment spokes carry a dash stream from
the core toward each region (`data-sx-stream`, dash `2 13`) and the boundary ring's dashes flow (`data-sx-flow`); never a transform on a
clickable sign, so every sign's bounding box is static (the pool sign takes no pointer). Closed list of infinite animations in LIVE: `sxOrbit`, `sxBreathe`, `sxSuspend`
(`SYNTX_AMBIENT_NAMES`). At ROLE and REQUIREMENT nothing infinite runs except `sxSuspend`. Nothing derives from a score (M1). REDUCED:
unchanged — every animation and transition zeroed, identical sign set. This block implements option B of GELB's escalation; under
option A (spec §1 / §6.2 stand) the switch is set to `false` and the field lives through transitions and static depth alone.

#### 13.2.2 Visual grammar transfer (owner mandates "SFE — GREEN · VISUAL FIELD RECONSTRUCTION" and "VISUAL GRAMMAR TRANSFER", 2026-10-12)

Iterated in a visual lab (disposable world + Next dev on a free port in the GRÜN worktree, Chromium 1600×1000, the Capability Field
captured in the same environment as the reference) until the Job Field reads as the same planetarium. The inspectable sequence lives in
`docs/career_analysis/evidence/job-pool/living-field/` (00 reference, 01a before, 01 FIELD, 02a/02 ORGANIZATION transition and rest,
03a/03 ROLE unfolding and rest, 04 REQUIREMENT, 05 EVIDENCE, 06 RETURN).

What transferred, in the Capability Field's own grammar: (1) regions are planetarium nodes — glass body (`rgba(10,14,20,.35)`, rim
`rgba(56,229,255,.4)` 1.3 px, lit `#38e5ff` 1.6 px), inner ring, dashed outer ring, signature ring at .78 r, and inside the node the
identity block (kicker `01`, `⬡ NAME` mono 12.2 / 700 / tracked, subtitle `industry · region` mono 8 muted) above the roles and the
density pill (`N ROLES`) below; the region radius is `min(190, 92 + 30·√roles)` and the roles sit on an inner ring in the lower part of
the region (centre +.14 r, ring .44 r, .52 r unfolded) so the block reads above them; (2) role carriers are cores with a signature
(inner dashed ring .55 r + centre point), the title below the body in mono 9.6 / 700 uppercase with its `N REQUIREMENTS` line; in the
ecology the title sits inside the core in mono uppercase and two plasma rings (dash `24 12 8 16` / `16 8 4 12`) settle into place once
(`sxCoreSettle`, finite, bound to `role_selected`); (3) the pool has a core at the field centre — glow, `#sxCore` body, two dashed
plasma rings (`sxOrbit` 120 s and 90 s reverse, FIELD only, pool sign in state `field`, R15), the pool name and `N ORGANIZATIONS` —
from which the containment spokes radiate; (4) evidence is manifested with the Capability Field's own mechanisms, transferred from its code (owner mandates "SFE — GREEN ·
EXISTING SEMIOTIC SYSTEM RECONSTRUCTION" and "SEMIONTIC FIELD RECONSTRUCTION", 2026-10-12). Composition (populated reference,
`CapabilityDeepFocusView` with real capabilities, a source and evidence): the focused entity is the nucleus at the centre, the other
entities are its satellites around it on faint dashed spokes (`3 10`, .12), and the evidence is a surface directly beneath the nucleus
attached by the mint link (`3 6`, 1.4, .42) — the existing application never places a source as a distant node tied to entities by
lines; it attaches evidence to the focused entity. The ecology follows that: role core = nucleus; requirement anchors = satellites on
spokes (`data-sx-ecology-composition`, no signs), still at their support distances; source carriers inside the ecology beneath the
core on the mint link; the traces are the short energy rays from that evidence body to the anchors it supports. Deep-focus transformation (owner mandate
"SFE — GREEN · FINAL DEEP-FOCUS DELTA"): the Capability Field's `FocusTransitionStageShell` logic applies to the whole ecology — what
recedes falls back with `blur(3px) grayscale(86%)` (far regions and carriers) and nodes to scale .72, the focused entity rises to 1.12
(the observed role at ROLE, the observed anchor at REQUIREMENT), all over .78 s `cubic-bezier(.16,1,.3,1)`; anchors enter as deep-focus
satellites (`capabilityDeepFocusSatellite`: scale .62 → 1, .72 s). The carrier moves on the cosmos's own orbital mechanism
(`OrbitalSatelliteMotion`: `useOrbitalMotionElapsedMs` shared linear rAF clock, `getOrbitalSatellitePosition` on an ellipse 14 × 9 whose
orbit passes through the routed place at t = 0, one turn per 60 s, phased by index, upright, `data-orbital-motion-*` attributes as in
the cosmos); its mint link, its traces (path `d`, hit path, photons' paths, midpoint bead) are recomputed from the same position every
render, so the relations follow the carrier geometrically, exactly as the cosmos tethers follow their satellites. LIVE only; reduced
motion holds the routed place (the hook does not start). A source carrier is a planetarium node (`OrbitalResonanceBubble`): body with the
sources glyph ◈ in the evidence colour mint `#7effcc`, the outer semiotic ring (1 px dashed `3 3` at .22, solid cyan when highlighted =
inspectable), the bubble float (`orbitFloatPhase2` → `sxFloat`: ±3 px, 25 s ease-in-out, phased −4 s per carrier), its evidence items as
moons (`moonOrbit` → `sxMoonOrbit`: rotate · translateX · counter-rotate, 160 s linear, delays −160/n · i; one moon per trace, max 12),
and — highlighted — the atmosphere glow (`atmosphereGlow` → `sxAtmosphere`, 3 s) with two ring pulses (`ringPulse` → `sxRingPulse`,
scale 1 → 1.35, opacity .75 → 0, 2.4 s ease-out, the second 1.2 s behind); it enters as a deep-focus nucleus settles
(`capabilityDeepFocusSettle` → `sxSettle`: opacity 0 → 1, scale .78 → 1, .78 s cubic-bezier(.16,1,.3,1), staggered .3 s per carrier).
A trace is an energy ray of the planetarium (`SemanticCareerIntelligenceField` resonance-energy-paths): at rest the deep-focus
evidence link (mint `rgba(126,255,204,.42)`, 1.4, dash `3 6`; weak support .26, unscored coverage dotted `1 5`), inspectable the active
ray (solid 2.5 `#38e5ff`, transition .35 s), with the planetarium's photon stream — SMIL `<animateMotion>` along the ray's path, one
photon carrier → anchor (r 1.8 cyan .65; active r 3 white) and one back (r 1.8 `#8eefff` .6; active r 3 cyan .95), paced by the stage
table 3.6–5.1 s / 4.4–6.0 s (active 1.6 s / 2.1 s), rendered in LIVE only — and the ray's midpoint bead (r 2 `.6`; active r 4 cyan);
the ray still draws on once when it rises (`sxTraceDraw`, finite, `trace_rise`) and the relation fades in behind it; the inspectable
glow stays. Nothing else: no gradient bodies, auras, blooms, pulses, orbit trails or frame loops; SMIL photons are not Web Animations
(`getAnimations` does not list them), exactly as in the planetarium; (5) requirement
labels are mono 7.8 / 700 (`REQUIREMENT_LABEL.charWidth` 4.9, routing and renderer alike); (6) the aperture carries the hover-HUD
surface of the planetarium (starfield gradient, 1.5 px cyan border, layered shadow); (7) `SOURCE_BOX` grew to the carrier's real reach
(above 14, below 68) so the REQUIREMENT camera keeps the carrier with its kicker and title in view (O-SX-4 holds).
Reference values come from the sealed files (`SemanticCareerIntelligenceField.tsx`, `OrbitalResonanceBubble.tsx`,
`IdentityCoreDropZone.tsx`, `CapabilityDeepFocusView.tsx`), read only.

Manifestations are shape-encoded, never colour-only (§13.4 keyboard/accessibility): supported = filled anchor, stable trace; weak =
thin-stroked anchor, thin trace; sweep-only = dotted anchor, dotted trace; open = arc whose gap faces outward from the role, no
trace; pending = dashed circle around the ecology; unread = plain thin ring. No red family anywhere (R3). Motion: recenter (camera
transform .78 s), recede/trace rise (opacity .45 s), aperture open (opacity rise, fill-mode backwards, B-LENS-FILL), boundary suspend
(slow dash drift, never a pulse). `prefers-reduced-motion` zeroes every animation and transition; no meaning depends on motion.

#### 13.2.3 Semiotic transfer — one manifestation grammar for both fields (owner mandate "GRÜN — SYNTX SEMIOTIC TRANSFER", GO 2026-10-12, variant A)

The Job Field no longer re-draws the Capability Field's grammar inside one zooming SVG. Both fields now render from one set of
domain-neutral SYNTX manifestation components, extracted from the Capability Field without changing its rendering
(`app/components/career/demo/manifestation/`):

| Component | Extracted from | What it is |
|---|---|---|
| `SyntxResonanceBody` | `OrbitalResonanceBubble` | the 168 px floating body, atmosphere and ring pulses, attention shell, semiotic ring, signature slot, moons (`renderMoon`), tether + HUD slot |
| `SyntxHudSurface` | `OrbitalResonanceBubble` (`getTooltipStyle`) | the opaque hologram HUD surface and its placement table |
| `SyntxCoreOrganism` | `IdentityCoreDropZone` | the breathing core with plasma rings, flare, waves, outer rings, particles; emblem slot |
| `SyntxPlanetariumBackdrop`, `SyntxEnergyRay` | `SemanticCareerIntelligenceField` | field glow, concentric orbits, 120 s ring, ambient nodes, dust; energy ray with SMIL photon streams and bead |
| `FocusTransitionStageShell`, `SYNTX_FOCUS` | `SemanticCareerIntelligenceField` (re-exported there) | the focus transformation: anchor to the centre at 1.12 / .42, everything else recedes blur(3px) grayscale(86%) .72 / .12 |
| `SyntxCosmosShell` (+ node and centre materials) | `CapabilityCosmosView`, `OrbitalCosmosView` | L1 cosmos: backdrop, stars, dashed orbit ellipses, per-frame tethers, satellites on the shared rAF clock |
| `SyntxDeepFocusShell` (+ nucleus, satellite, evidence-surface materials, evidence link) | `CapabilityDeepFocusView`, `OrbitalDeepFocusView` | L2 deep focus: backdrop, spokes, the slots for nucleus, receded siblings and evidence surface |

The Capability components are now thin callers of these components. Proof of "unchanged": 374 server renders of every touched
Capability component (all six stages × seven variants × seven angles, both cores, both cosmos and deep-focus views at three clock
times, the focus shell in five states, the whole field in four job states with and without data), captured before the
extraction and compared byte for byte after every step: 374 / 374 identical (sha256 `7d0e5c91…bdc18b2` before and after). The
sealed SIL language suites and every Capability test pass unchanged. The optional switches added for the Job Field (`keyframes`,
`pulseKeyframes`) default to the Capability Field's behaviour.

**Levels.** JOB POOL = L0 planetarium: the pool is the core, organizations are resonance bodies on the orbit (several orbits and a
common smaller scale when the pool is large: count and order only), each role is a moon of its organization (`data-manifestation-form="moon"`,
interaction `none`, `tabindex -1` — organizations first). ORGANIZATION = the body moves to the centre (focus transformation), the
planetarium recedes, the roles orbit as cosmos satellites (the shared L1 packing; compact cards, then a compact uniform packing for
very large organizations — never fewer satellites). ROLE = the organization cosmos recedes; the role is the centre of its own cosmos:
requirements on circular orbits by support category (R14: distance is the category, equal within it), source documents on theirs
(the stage-01 source-satellite grammar), evidence traces between them (quadratic, recomputed every frame from both positions), the
suspended boundary around; the whole constellation turns once per 160 s. REQUIREMENT = L2 deep focus: the requirement as nucleus,
its siblings receded, the evidence surface beneath with one row per evidence relation grouped by document; every relation is its own
curve from the nucleus to its row. EVIDENCE = the aperture as the hologram HUD on its tether (a reading surface: it holds still).

**Semantics carried over unchanged.** View model signs, proofs, observation, summaries (GELB governance 10/10 unchanged); support
category = orbit and glyph; scored and unscored relations keep their stroke in every state (inspectable brightens, never solidifies),
their own rows and their own apertures even on one document; sweep coverage is never scored; one suspended boundary, no closure;
missing support neutral; score only in the pending aperture; no red attention ring (no HR state has the meaning
EMPTY_PROJECTION_ATTENTION). Proposals for GELB/PINK (R10a, R15b, walk rebinding): `docs/career_analysis/proposals/SYNTX_SEMIOTIC_TRANSFER_PROPOSALS.md`.

#### 13.2.4 Semiotic finishing pass (owner "SFE — GREEN · SEMIOTIC FINISHING PASS", GO 2026-10-13; visual refinement only)

No architecture, layout, component, function, data, matching, score, relation, governance, id, state, navigation, keyboard or
click change. The shared manifestation components gained optional tone props only (`SyntxPlanetariumBackdrop.tone`,
`SyntxCosmosShell.orbitStroke` / `stars`, `SyntxDeepFocusShell.spokeStroke`); their defaults are the Capability Field's literals, so
the Capability rendering stays byte-identical (374 / 374 renders, sha256 `7d0e5c91…bdc18b2` unchanged).

- **Job Field resonance tone.** The same SYNTX family in the field's own register: the atmosphere (field root, cosmos and deep-focus
  backdrops, star field, planetarium glow) and the resting structure (orbit paths, resonance ring, tethers, resting rays and beads,
  containment, deep-focus spokes) lean from the Capability cyan (189°) towards azure (`rgba(92, 200, 255, a)`, 201°). Unchanged in
  meaning and colour: active resonance and focus (cyan), evidence and sources (mint), the authority boundary and weak reasons
  (amber), missing support and pending (neutral), the support glyphs, trace strokes and photons.
- **Organization resonance body.** A lit sphere over the planetarium body (upper light, lower shade, azure rim at rest, the cyan
  resonance when highlighted), a rim-light crescent, an atmosphere halo beyond the rim that breathes slowly (`atmosphereGlow`
  11 s, phased per body) and an inner light that rises over .9 s when the body resonates (hover, focus anchor). Geometry, moons,
  HUD and the planetarium's highlighted atmosphere unchanged.
- **Source document carrier.** The glyph ◈ is drawn as a vector (document diamond with its core) in the carrier body, the card,
  the evidence-surface group header and the aperture's source line; the carrier body carries a mint membrane; the card is a
  document membrane — mint hairline, lit upper edge, the document's spine — with the title in the sans reading face (12 px) over a
  mint kicker and a ruled evidence count. Width, position, texts and the dashed body of a sweep-only source unchanged.
- **Evidence aperture.** More depth (layered shadow, inner vignette, a second glass 5 px inside the frame, lit upper edge), the
  glow breathes slower and two-toned (`sxApertureBreathe` 9 s, opacity only; the surface and its text hold still), hairline rules
  between head and body, the quote's reading space recessed, metric chips with tabular figures and higher contrast, the boundary zone
  set off by an inner shade. Hierarchy unchanged: REQUIREMENT → RELATION → SOURCE → EVIDENCE → METRICS → AUTHORITY BOUNDARY. REDUCED: no
  animation, no transition (unchanged root rule).

**Observation O-JF-LABEL (documented only, not changed):** in the organization cosmos a role card on the lower part of the orbit
ellipse can sit close to the level's lower inset (at 1600 × 1000 the "Senior Full-Stack Engineer" card ends ≈ 40 px above the footer
statement). Evidence: `evidence/job-pool/semiotic-transfer/finishing/organization-cosmos-role-labels-observation.jpg`. A correction
would touch `syntxCosmosLayout` (layout), which this pass excludes.

#### 13.2.5 Final visual finishing pass (owner "FINAL VISUAL FINISHING PASS — JOB FIELD", GO 2026-10-13; visual refinement only)

On d16db44, inside the same boundary as §13.2.4 (no architecture, layout, component, function, data, logic, id, state, navigation,
keyboard, click, governance or proof change). No shared component touched in this pass; Capability renders 374 / 374 byte-identical.

- **Organization resonance body.** A still light membrane — a fine ring just inside the rim, lit from the upper left and falling off
  around the body (conic light, masked to 1.6 px) — and a wide, very faint corona beyond the breathing halo; a deeper sphere (second,
  lower azure light); the planetarium signature calmed to .5 at rest (.82 resonating) so that name, sector / region and the
  ORGANIZATION line read cleanly; a dark reading halo under the identity text, sector / region at higher contrast, the role-count
  pill framed in azure at rest.
- **Source document carrier.** A document sheet, not a card: a folded corner with a lit fold edge, a faintly ruled ground, a second
  glass inside the edge, the mint spine and lit upper edge; its glow follows the sheet's own outline (drop-shadow over the clipped
  sheet). The vector glyph leads the SOURCE // DOCUMENT kicker (one line); the title in the sans reading face at 12.5 px; a mint
  membrane ring around the carrier body. Width, position, texts and the dashed body of a sweep-only source unchanged.
- **Evidence aperture.** The field inside the lens (the cosmos star ground, still, .22), a larger head name, the quote's quotation
  marks in the relation's colour (text content unchanged), a hairline between the evidence and its reference / metrics, and a
  governance boundary zone with an amber light edge over its dashed border, a warm corner light and lifted chips. Hierarchy unchanged;
  no text movement; the only motion is the existing still-surface glow breath; REDUCED unchanged (no animation, no transition).
- **Job Field colour identity.** Resting cosmos cards (organization-cosmos roles, role-cosmos requirements) and deep-focus satellites
  take the azure register (`JOB_NODE_MATERIAL`, `JOB_SATELLITE_MATERIAL`); the focused centres (cosmos centre, nucleus) keep the cyan of
  active resonance. Kicker colours that carry meaning (cyan / neutral for OPEN), mint evidence, amber authority unchanged.

**O-JF-LABEL extended (documented only, not changed):** besides the organization-cosmos role card near the lower inset (§13.2.4),
the role-count pill inside an organization body sits close to the body's lower rim, closest where the name or the sector / region
wraps to two lines (e.g. "Rheinwerk Systems AG", "Industrial Edge & Automation · Cologne"). Evidence:
`evidence/job-pool/semiotic-transfer/final-pass/role-label-observation.jpg`. A correction would change the body's internal layout,
which this pass excludes.

#### 13.2.6 Field selector and final readability (owner "SFE — GREEN · FIELD SELECTOR & FINAL READABILITY", GO 2026-10-13)

On f96217f. No matching, data, evidence, governance or field-architecture change; the Capability Field's manifestation unchanged.

- **SYNTX field selector (application shell).** `SyntxFieldSelector.tsx` replaces the two small buttons top-left: one membrane
  centred in the upper application area (fixed, top 70 px) with two equal options, CAPABILITY FIELD (`syntx.selector.capability`)
  and JOB FIELD (`syntx.toggle`), each lit in its own field's tone (Capability cyan, Job Field azure) with a resonance lamp; a fine
  link between them. Exactly one field is active; selecting the active one changes nothing (the old strip toggled back to
  CAPABILITY). Keyboard: Tab, Enter / Space, ← / → and Home / End switch fields. Entering the Job Field by keyboard moves focus into
  the field (F-SX-1, unchanged); Tab reaches the selector again from inside the field. Each field change is crossed by one calm veil
  (`syntxFieldVeil` .42 s, void → clear, pointer-transparent; none on first paint); REDUCED: no veil animation, no selector transition.
  Contract kept: `field-focus-strip` (`data-field-focus`) holds exactly the two buttons `field-focus-capability-btn` and
  `job-pool-panel-toggle` with `data-field-focus-active` and `aria-pressed`; the field's own `syntx-exit-btn` stays.
- **Exclusive fields.** With JOB FIELD selected, every direct child of the Capability shell that is not marked `data-sx-shell`
  (selector, top controls, guide drawer, HR dock, veil), not the Job Field root (`data-sx-field="job"`) and not the codex /
  onboarding overlays is `visibility: hidden` — kept mounted, so no Capability state (staged sources, analysis job, zoom) is lost;
  hidden elements leave the tab order and the pointer. With CAPABILITY selected the Job Field is not mounted. Analysis id, pool
  upload id and deep links (`focus=FIELD&jobOrganizationId=…&jobRoleId=…&jobRequirementId=…`) are honoured unchanged; the existing
  rule that a return to CAPABILITY resets the Job Field observation to FIELD (B-POOL-INITIAL-FOCUS) stays.
- **Organization body typography.** The signature geometry clears the reading area (radial mask: kept at the rim, gone where the
  text sits); soft reading plates behind name, sector / region and the ORGANIZATION line; sector / region 10 px at higher contrast,
  ORGANIZATION as a spaced 7.5 px label, the role-count pill 9.5 px with tracking; the hovered body's interior is opaque (the
  active energy ray no longer shows through it) and its HUD tether leaves at the rim towards the HUD (`SyntxResonanceBody`
  `hud.tetherFrom`, optional; Capability default unchanged). Body size and field geometry unchanged.
- **Organization cosmos role labels (O-JF-LABEL, resolved).** The orbit is the same `syntxCosmosLayout`, fitted to the level box
  less `ROLE_CARD_CLEARANCE` (30 px) above and below (centre and orbit form unchanged); role titles show up to four lines; the
  count line is set at 7.5 px so it wraps less. Measured over the whole orbit (ellipse extreme ± the tallest card): 2 roles and
  14 roles, at 1600 × 1000 and 1280 × 720, every card stays ≥ 46 px above the footer statement and inside the level box
  (before: ≈ 18 px at 1600 × 1000).

Proof: `evidence/job-pool/semiotic-transfer/field-selector/` (`selector-proof.json`: 25 checks, all passing; sheets for both active states,
before / after of the selector, the body typography and the role labels). Capability renders: 366 / 374 byte-identical; the 8
renders of the Capability shell differ only by the selector and the shell markers (identical after removing them).

**Observation O-JF-PANEL (documented only):** at 1280 px width the organization cosmos' orbit is wide enough that rotating role
cards pass over the field's left info panel (pool / organization line, key hints) for part of their turn; at 1600 px they do not.
Not changed in this pass (the orbit's width is the layout's).

#### 13.2.7 Decision Loop Labs brand core (owner "ONE FIELD GRAMMAR. NEW BRAND CORE.", GO 2026-10-13)

On a047f53. Visual only: no function, data, matching, governance, state, id, navigation, click or keyboard change; no new motion.
Reference: the owner's Decision Loop Labs logo (spelling of the brand name taken from it: "DECISION LOOP LABS" / Decision Loop Labs).

- **Brand mark (`DecisionLoopLabsMark.tsx`).** The DLL sign of the logo (the loop and the two L, each a segmented double light
  track) traced once into one vector path and rendered as field light: a soft glow copy, the crisp sign with a cool vertical light
  gradient (white → the logo's teal), a faint scan-line layer clipped to the sign (holographic, static) and a two-step teal
  drop-shadow. No raster image, no sticker: the sign is drawn in the field's own light. `aria-hidden`, purely visual.
- **Core integration.** The pool core's emblem (the 92 px black disc with ⬡) is now the brand lens
  (`DecisionLoopLabsCoreEmblem`, 100 px): dark glass with the teal light membrane, a fine registration ring with four precision
  ticks (the logo's instrument frame) and the mark at its centre. The shared core organism (breath, plasma rings, flare, waves,
  rings) is unchanged and carries the lens; under it a static teal brand membrane gathers the light. JOB POOL, the pool name and
  the organization count stay as they were.
- **Brand surface (header).** In the Job Field context the application header reads **DECISION LOOP LABS / SYNTX — SEMANTIC CAREER
  INTELLIGENCE FIELD** with the vector mark (header height unchanged, 61 px). The header follows the active field live
  (`SemanticCareerIntelligenceField.onFieldFocusChange`, optional; the dashboard holds the active field). The Capability context
  keeps its header byte- and pixel-identical (CONDYN / SYNTX …). Not renamed: data (the sample pool's name "CONDYN Sample Tech
  Job Pool" is uploaded data), ids, providers, the codex and onboarding texts (shared content of both fields).
- **Background.** A fine technical grid (56 px, teal 3 %) that clears around the core and fades to the edges, four registration
  brackets framing every level (teal 30 %), and a slight teal calibration of the atmosphere, the planetarium glow and the cosmos /
  deep-focus centres. All static, pointer-transparent and behind or beside every sign; semantic colours (cyan active, mint
  evidence, amber authority, neutral missing) unchanged.

Proof: `evidence/job-pool/semiotic-transfer/brand-core/` (`brand-proof.json`: 20 checks in LIVE and REDUCED — header names the brand
in the Job Field and returns to the unchanged CONDYN header in the Capability context on a live switch, header height, emblem in
the core, no animation and no pointer on the brand layers, ids kept in the URL, no page errors). Capability renders unchanged
against a047f53 (366 / 374 byte-identical, 374 / 374 after removing the selector and shell markers).

**Open owner decision O-DLL-SCOPE:** the mandate scoped the brand to the Job Field context, so the header switches with the field.
If Decision Loop Labs is to be the brand of the whole application (Capability context, codex, onboarding), that is one further
shell change (the Capability header renders would change; R10b).

#### 13.2.8 The four panels (owner "FOUR PANELS. CLEARER SIGNAL.", GO 2026-10-13)

On 00299f5. Visual only: texts, ids, data attributes, states, navigation, keyboard and click logic unchanged (proved by a text and
contract read of all four panels before and after: identical).

- **Panel material (pools, intake, boundary).** The three Job Field panels no longer use the Capability HUD surface (its drifting star
  dots and colour blots ran through the text); they share a Job Field resonance surface: deep glass with a top light, a fine azure
  edge, four registration ticks, a breathing aura (`atmosphereGlow`, 12 s) and a light current travelling the upper edge
  (`sxPanelCurrent`, 11 s), both LIVE only. Each panel holds one node on the side facing the field, with a hairline into the field
  and a breathing lamp (`atmosphereGlow`, 7 s). Kickers carry a diamond marker and a rule; more inner space (18 / 20 px) and air.
- **Pools (left).** Each upload is a row card: name 13 px, meta line in quieter mono; the selected pool with a cyan wash, a lit
  left edge and a lit SELECTED chip with a lamp; SELECT as an outlined chip; hover and keyboard focus visible on the row.
- **Field selector (top centre).** A brighter membrane with an outer resonance ring and a lower counter-light, 11 px labels, a
  clearer inactive / active contrast (active: deeper tint, stronger glow, a light line under the label), and the link between the
  options lit towards the active field. Static; logic unchanged.
- **Intake (top right).** Labels as quiet field labels, the actor id as a recessed input well with a focus glow, the file input in
  a dashed drop well with a styled file button, the file state with a lamp (neutral / mint when a file is chosen), UPLOAD as an
  action chip (enabled / disabled visible).
- **Boundary (bottom right).** Four sections separated by hairlines: (1) the presentation labels as amber chips with the ranking
  line, (2) the canonical mapping states as chips (green / amber) above their statement, (3) the sweep state line (UNSCORED as a
  chip) above its statement, (4) the read's parameters above the gaps statement. Statements in 12 px sans with a coloured rule
  (amber for authority, azure for sweep, neutral for gaps); an amber light on the upper edge. Width 372 px (was 340); its height
  yields to the intake when both are open (no overlap) and reads without scrolling alone at 1600 × 1000.
- **Reduced motion.** The field's REDUCED rule now also stops pseudo-element animations.

Proof: `evidence/job-pool/semiotic-transfer/panels/` (`panel-proof.json`: 24 checks at 1600 × 1000 and 1280 × 720, LIVE and REDUCED —
panel motion names, nothing in REDUCED, no overlap, boundary without scrolling, decorative nodes, keyboard selection;
`panel-text-identity.json`: text and contract identical for all four panels). New motion name `sxPanelCurrent` (outside every sign;
panels are closed in PINK's ambient read): proposed for R15b as a panel motion.

#### 13.2.9 Visual polish pass (owner "FEINSTUFE / VISUAL POLISH PASS", GO 2026-10-13)

On d79d4f8. Visual only, in four steps; texts, ids, data attributes, states, orbit geometry, navigation, keyboard and click logic
unchanged (text and contract of selector, organization bodies, cosmos centre and role cards identical before / after; the only new
nodes are decorative, `aria-hidden`, without text).

1. **Field selector.** Both options the same width (214 px: balance between the fields); a calmer membrane with a finer light seam
   and a deeper aura; the link between the options is now a small double loop — the two fields joined — whose half towards the
   active field is lit; a field change sends one light through the capsule towards the field now active (`syntxFieldSweepLeft /
   Right`, finite .9 s, never on first paint, none in REDUCED). Logic, exclusivity and states unchanged.
2. **Role cards (organization cosmos).** Their own Job Field material: deeper glass, top light edge, two registration ticks, a layered
   static field glow; the level line with a lamp at 8.5 px, the title in the sans at 11.5 px / 600, the metric line under a hairline
   at 7.5 px. The card height stays within the clearance contract: tallest card 98 px (was 94), every card ≥ 41 px above the footer
   statement over the whole orbit at 1600 × 1000 and 1280 × 720 (2 and 14 roles).
3. **Centre / organization body.** The organization cosmos' centre has an opaque deep core: the receded organization body behind it
   no longer shows through the name (the ghost text is gone); name, a short light rule and the cosmos line as three layers, an inner
   ring and a finer membrane. The planetarium organization bodies: slightly more line and letter air for name, context line and the
   ORGANIZATION label, a calmer role-count pill (size and geometry unchanged).
4. **Whole field.** A quiet edge vignette in the atmosphere for depth (no brightening); the panels' nodes and the role cards share the
   panel material's light language.

Proof: `evidence/job-pool/semiotic-transfer/polish/` (before / after sheets for selector, role cards, centre and body, overview and the
large pool; `polish-text-identity.json`; `selector-proof.json` 25 / 25; `brand-proof.json` 20 / 20; `panel-proof.json` 24 / 24;
`selector-sweep-check.json`; PINK walk report).

#### 13.2.10 Local pass: pools panel and role cards (owner "Small field. Local recursion.", GO 2026-10-13)

On b156364. Local field: the pools panel (`job-pool-list`) and the role-card satellites of the organization cosmos; nothing else
touched. Visual only; texts, ids, data attributes, states, interaction and orbit geometry unchanged.

- **Pools.** One conduction line (the panel's spine) carries every upload as a node; the selected upload is the lit, breathing node
  (`atmosphereGlow`, LIVE only) and the one lit row; other rows are unframed and react on hover. Each row on a grid: name, action
  chip (one aligned column, 84 px), the meta line across the full width on one line.
- **Role cards.** A precise 14 px radius and an inner hairline; the level line staggered (ROLE in cyan, the seniority softer), the
  requirement count weighted in the metric line; a field anchor — a lamp with a short conduction stub on the card edge where the
  tether from the centre arrives (recomputed with the orbit, placed in percent so it is always on the edge); a calm light reaction
  on hover. Card height unchanged (tallest 88 / 98 px).

Proof (local only): `evidence/job-pool/semiotic-transfer/local-pools-roles/` — text and contract of both zones identical to b156364;
11 local checks (pointer ownership at every card centre, anchor on the edge and decorative, meta on one line, pools motion names,
nothing in REDUCED); the directly touched existing proofs: role-card clearance 4 / 4, panel proof 24 / 24 (keyboard selection),
Job Pool SSR 13 files / 89. No full sweep (owner rule for this pass).

### 13.3 DOM contract (PINK BR-1 … BR-5; GELB conditions a/b)

**BR-1 field root** `data-testid="syntx-field"`: `data-field-grammar="SYNTX_FIELD_V1"`, `data-observation-kind` FIELD|ORGANIZATION|ROLE|REQUIREMENT
(EVIDENCE is a REQUIREMENT or ROLE observation with `data-aperture-open="true"`), `data-observation-id` (upload id at FIELD, else the
organization / role / requirement id), `data-aperture-open`, `data-motion-mode` LIVE|REDUCED. Also: `data-field-state`
NO_POOL|NO_ANALYSIS|LOADING|AVAILABLE|NOT_FOUND|INACTIVE_POOL|NOT_PROVISIONED|FAILED, `data-matching-delivered`, `data-sources-state`,
`data-sign-count`, `data-organization-count`, `data-role-count`, `data-requirement-count`, `data-pools-visible`, `data-intake-visible`,
`data-boundary-visible`, and the workflow attributes of the former panel (`data-pools-state`, `data-upload-state`, `data-selection-kind`,
`data-selected-pool`, `data-view-state`, `data-matches-state`, `data-analysis-id`, `data-analysis-source`, `data-pool-id`).

**BR-2 one element per visual sign**, with `data-sign-id` (stable, derived from the proof tuple) and the §14.3 enums verbatim:
`data-sign-source`, `data-sign-relation`, `data-sign-state`, `data-sign-manifestation`, `data-sign-interaction`, `data-sign-transition`.
Proof attributes present iff binding §2 names them for the sign: `data-proof-upload-id`, `data-proof-organization-id`, `data-proof-role-id`,
`data-proof-requirement-id`, `data-proof-target-id` (canonical target: organization entity, role↔organization binding revision, TRPREV),
`data-proof-trqrev-id` (one TRQREV on an anchor; every TRQREV of the ecology, space-separated, on the suspended boundary),
`data-proof-analysis-id`, `data-proof-capability-id` (CAP_* scored/weak, PCAP_* sweep), `data-proof-doc-id`, `data-proof-evidence-id`
(EVD_* only when the exact join into the proposal projection resolves). Proof values are attributes only; no id is default-state text.

| Sign | Element (test id) | source | relation | manifestation | interaction / transition |
|---|---|---|---|---|---|
| pool | `syntx-pool` | canonical_entity | contains | region | none / unfold (FIELD), return / restore |
| organization | `syntx-organization-<orgId>` (`data-role-count`) | canonical_entity | contains | region | select / recenter · receded: recede · selected: return / unfold |
| role | `syntx-role-<roleId>` (`data-requirement-count`, `data-matching-read`) | canonical_entity | contains | carrier | select / recenter · selected: return / unfold |
| requirement anchor | inner `g` of `syntx-requirement-<reqId>` (`data-support`, `data-evaluation-state="NOT_EVALUATED"` while a matching is read, `data-trace-count`) | canonical_entity | requires | anchor | select / unfold · selected: return / recenter |
| scored trace | `syntx-trace-trace:<reqId>:supports:<docId>:<n>` | evidence | supports | trace_stable | inspect / trace_rise |
| weak trace | `syntx-trace-trace:<reqId>:weakly_supports:<docId>:<n>` | evidence | weakly_supports | trace_thin | inspect / trace_rise |
| sweep trace | `syntx-trace-trace:<reqId>:covers_unscored:<docId>:<n>` | gemini_sweep | covers_unscored | trace_dotted | inspect / trace_rise |
| open boundary | `syntx-open-<reqId>` | matching_contribution | missing_support | open_boundary | inspect / trace_rise |
| suspended boundary (once per ecology) | `syntx-pending-<roleId>` | evaluation_state | pending_evaluation | suspended_boundary | inspect / boundary_suspend |
| source carrier | `syntx-source-<docId>` (`data-source-title-state` RESOLVED|UNRESOLVED|NOT_READ, `data-trace-count`) | evidence or gemini_sweep | strongest delivered relation of its traces | carrier | none / trace_rise |
| aperture | `syntx-aperture` (`data-aperture-for=<sign id>`, `data-aperture-kind` trace|open|pending) | inherits | inherits | temporary_aperture | return / restore |

States: the observed entity is `*_selected`; the traces of the observed requirement are `inspectable`; everything outside the focused
neighbourhood is `receded`; the rest is `field`. Only one sign carries `pending_evaluation` per ecology (R2); no closure manifestation
exists (R1).

**BR-3 aperture**: `syntx-aperture-quote` carries the quote verbatim; `syntx-aperture-source` carries the source title only when docId
joins `documents[].entity_id` of the same analysis (`data-source-title-state="RESOLVED"`), otherwise `UNRESOLVED` (or `NOT_READ` before
the analysis sources arrive) and no title; `syntx-aperture-contribution` (scored/weak only), `syntx-aperture-sweep-status` (`data-scored="false"`),
`syntx-aperture-open-text`, `syntx-aperture-pending-text` (+ `syntx-aperture-resonance`: the score, numeric, only here), `syntx-aperture-authority`,
`syntx-aperture-close`. The §12 inspected texts are the SIL `syntx.texts` copy (R5 wording for the sweep).

**BR-4 summary**: `syntx-summary` (`data-summary-for=<observation id>`, `aria-live="polite"`, visually hidden) = `summarySentence(field.summary)`
from the same view model; en/de.

**BR-5 retired ids** (removed, never reused; PINK plan change under R11): `job-field`, `job-field-*` (canvas, stage, core, nearest,
nearest-ray, no-nearest, thread-*, nebula-*, organization-*, role-*, moon-*, lens, role-detail, role-back, reading, resonance-bar,
composition, requirement-*, requirement-toggle-*, requirement-evidence-*, reveal-all, pending, pending-*, pending-why, pending-reason,
pending-ids, legend, legend-text, legend-toggle, exit-btn, state, non-claims, pool-selection, select-pool-*, no-analysis, role-not-delivered,
authority-label, open-nearest, evidence-quote), `job-pool-panel`, `job-pool-orbit`, `job-pool-structure-*`, `job-pool-core`, `job-pool-nebula-*`,
`job-pool-role-list`, `job-pool-role-lens-*`, `job-pool-role-<id>` (+ `-toggle`, `-matched-*`, `-weak-*`, `-missing-*`, `-sweep`, `-sweep-only`,
`-canonical`), `job-pool-trqrev-*`, `job-pool-matched-constituent`, `job-pool-evidence-quote`, `job-pool-selected`, `job-pool-selection-none`,
`job-pool-view-*`, `job-pool-matches-*` (idle/not-found/inactive/failed/not-provisioned), `job-pool-matching-details(-toggle)`,
`job-pool-organizations`, `job-pool-organization-*`, `job-pool-layer-c-toggle`, `job-pool-enter-job-field`, `job-pool-panel-collapse`,
`job-pool-list-state`, `job-pool-analysis(-none)`, `job-pool-list-*` at-core/delivered geometry attributes (`data-at-core`), `field-focus-job-btn`,
`data-field-focus="JOB"|"POOL"`, `data-field-grammar="POOL_FIELD_V1"`, `data-interaction-grammar`, `data-focus-level`, `data-galaxy-grammar`,
`data-motion-grammar`, `data-structure-role`, `data-upload-count`, `data-intake-visible` semantics of the panel.
**Kept (operational, same meaning)**: `job-pool-panel-toggle` (strip), `job-pool-list` (`data-pool-count`, `data-list-state`), `job-pool-item-<id>`
(`data-selected`, `data-pool-status`, `data-delivered-index`), `job-pool-select-<id>`, `job-pool-list-loading/empty/not-provisioned/failed`,
`job-pool-selection-not-listed`, `job-pool-intake-toggle`, `job-pool-upload`, `job-pool-actor-input`, `job-pool-file-input`, `job-pool-file-name`,
`job-pool-upload-btn`, `job-pool-upload-result` (`data-upload-outcome`, `data-upload-id`), `job-pool-upload-rejected`, `job-pool-upload-issue`,
`job-pool-upload-not-provisioned`, `job-pool-upload-failed`, `job-pool-matches` (now the folded BOUNDARY aperture: `data-matches-state`,
`data-ranking`), `job-pool-presentation-labels`, `job-pool-label-*`, `job-pool-ranking`, `job-pool-canonical-mapping` (state attributes),
`job-pool-capability-sweep`, `job-pool-non-claims`, `field-focus-strip`, `field-focus-capability-btn`, `data-field-focus="CAPABILITY"|"FIELD"`.
**New (Appendix A)**: `syntx-field`, `syntx-summary`, `syntx-stage`, `syntx-canvas` (`data-camera-scale`), `syntx-pool`, `syntx-organization-*`,
`syntx-role-*`, `syntx-ecology` (`data-role-id`), `syntx-pending-*`, `syntx-source-*`, `syntx-trace-*`, `syntx-requirement-*`, `syntx-open-*`,
`syntx-aperture` (+ `-quote`, `-source`, `-contribution`, `-sweep-status`, `-open-text`, `-pending-text`, `-resonance`, `-authority`, `-close`),
`syntx-stale` (`data-stale-kind`, `data-stale-id`), `syntx-no-pool`, `syntx-no-analysis`, `syntx-exit-btn`, `syntx-path`, `syntx-path-<LEVEL>`
(`data-current`), `syntx-return-btn`, `syntx-state` (`data-state`), `syntx-pools-toggle`, `syntx-boundary-toggle`.
**Added by the semiotic transfer (2026-10-12)**: `syntx-canvas` `data-depth` (0 planetarium … 3 deep focus; `data-camera-scale` is now
the planetarium focus anchor's scale, 1 or 1.12), `syntx-orbits`, `syntx-pool-core`, `syntx-ray-<org>`, `syntx-body-<org>`,
`syntx-body-surface-<org>`, `syntx-hud-<org>`, `syntx-tether-<org>`, `focus-transition-stage-shell-syntx-<org>` (+ `focus-stage-visual-…`,
`focused-stage-bubble-…`, `focus-transition-pulse-…`), `syntx-cosmos-organization`, `syntx-cosmos-centre`, `syntx-deep-focus`,
`syntx-evidence-surface`, `data-manifestation-form` (`moon` / `satellite` / `centre`), `data-sx-level`, `data-sx-evidence-row`,
`data-trace-kind`, `data-rotation`, `data-card-mode`. Retired: `data-sx-camera`.

### 13.4 Accessibility and keyboard (spec §13.4, R8, R9)

Every carrier, anchor, trace and boundary is a focusable `role="button"` (`tabIndex` 0 while not receded) with an `aria-label` from the
same view model; Enter / Space selects or inspects; Escape returns one level (closing an edge aperture or the inspection aperture first);
the observation path (`syntx-path-*`) and `← RETURN` are buttons. The summary (`syntx-summary`) is the screen-reader reading of the
observation point. Readable labels wrap at word boundaries (`wrapLines`), never truncated as the primary display (§9.3).

### 13.5 Boundaries

- B-SYNTX-UNSUPPORTED: nothing from binding §3 is rendered: no closure, no verified seal, no HR recommendation, no confidence or
  thickness for sweep coverage, no synthesised evidence id, no source URI, no role-to-role or requirement-to-requirement relation.
- B-SYNTX-JOIN: source title, evidence location and EVD_* come only from exact joins inside the same analysis; a miss omits the field
  (`UNRESOLVED`), the title is never guessed. `analysis-sources.ts` reads `documents[].identity.name` of the analysis documents (source
  carriers) and nothing of the inferred organizations or roles; PINK's SG-1 string heuristic in `job-field-static.test.ts` scans only
  `JobField|job-field` named files and therefore not this module: declared openly, to be re-bound by PINK.
- B-SYNTX-SCORE: `resonanceScore` appears only inside the pending-boundary aperture (`syntx-aperture-resonance`), never in FIELD,
  ORGANIZATION or ROLE signs; `organizationMatches[].aggregateScore` is not rendered at all (no organization aperture carries a number yet).
- B-SYNTX-URL: the observation point is in the URL (`jobOrganizationId`, `jobRoleId`, `jobRequirementId`); the aperture never is.
- B-SYNTX-FOCUS (F-SX-1, PINK): a return or an aperture close may unmount the focused sign; the field then moves focus to the sign of
  the new observation point (`data-sign-id` of the selected region / carrier / anchor), else to the field root, so Escape works at every
  level (R8) and the keyboard never falls out of the field. Pinned in the e2e keyboard walk (REQUIREMENT → ROLE → ORGANIZATION → FIELD).
- B-SYNTX-TRACE-ORDER (O-SX-1, PINK): traces render receded first, field next, inspectable last, so where every trace converges on one
  source carrier the inspectable trace owns the pointer.
- B-SYNTX-BOW (F-SX-2 / O-SX-2, GELB on the owner data): a trace is a `<path>` (hit path with `data-sx-hit` first, visible path second,
  `data-trace-bow` on the group); co-terminal traces never share a bow, so each remains visible and owns pointer points on its own
  path (R7 pointer inspection); no trace crosses the role carrier's title or a requirement label when a bow can avoid it. The bow is
  geometry on the trace object, never part of the sign or its proof; sign ids, enums, proofs and support categories are unchanged.
- B-SYNTX-REACH (O-SX-4, GELB): at REQUIREMENT the camera keeps scale 2.4 and shifts so every source carrier the observed requirement
  reaches lies inside the stage with its title; source carriers are placed beside the requirements that reach them.
- B-SYNTX-NUMBER (O-SX-3, PINK ruling: repair): the summary agrees in number in both locales (`nouns` block of the summary copy:
  organization/s, role/s, requirement/s, evidence trace/s, source/s; de Organisation/en, Rolle/n, Anforderung/en, Evidenzspur/en,
  Quelle/n); the reading is the screen-reader contract surface (R9 / BR-4).
- B-SYNTX-MOTION (living field, 2026-10-12; GELB M1–M10): every animation sits on a `[data-sign-id]` element and is explained by its
  `data-sign-transition` or `data-sign-state`; infinite animations are the closed list `sxOrbit`, `sxBreathe`, `sxSuspend`, run in
  LIVE only, `sxOrbit` / `sxBreathe` only at FIELD / ORGANIZATION on signs in state `field`, uniform per kind, phase by containment;
  no motion parameter derives from a score; no closure-looking settle, no pulse on pending, no red family, no transform on labels at
  rest; `data-sx-depth="far"` only on regions in state `field` and receded carriers while a role is observed (labels hidden there).
  Ruling pending: GELB escalated whether spec §1 / §6.2 stand (A) or the mandate supersedes them with this list (B, → R15);
  `SYNTX_AMBIENT_MOTION` is the one-line switch between the two.
- Not provable in this worktree's browser world: a stable + dotted co-terminal pair (the seeded e2e analysis carries one quote per
  requirement and no sweep; GELB's fixture evidence is pinned by `presentation-matching.test.ts`). The pair is proven in the view-model
  suite with the owner-shaped overlap (two stable quotes + one sweep quote on one document) and by GELB's walk on the owner data.
- B-LENS-FILL, B-LENS-TRANSFORM, B-LENS-HIT, B-JF-GROUND-LINE, B-JF-FONTS continue to hold for the apertures and edge lenses.

### 13.6 Proofs

| Suite | Scope |
|---|---|
| `test/career/job-pool/syntx-field-view-model.test.ts` (14; perceptual closure: distinct bows/paths/midpoints for co-terminal traces, clearance of the role disc and every label for every trace, carriers on the ring, REQUIREMENT camera reach, number agreement en/de) | containment geometry, relation-state geometry, sign enums and proofs, exact joins / omit on miss, overlap (F-LF-1), open boundary, pending once, no closure, stale ids, reversible transitions, summary sentences, analysis-sources decoder |
| `test/career/job-pool/syntx-field-ssr.test.tsx` (7) | BR-1 root, BR-2 sign and proof attributes per state (FIELD, ROLE, REQUIREMENT), BR-4 summary, BR-5 retired ids absent, proof ids never as text, no score in FIELD/ROLE text, stale ids, locale, dashboard threading, legacy focus aliases |
| `test/career/job-pool/e2e/job-pool-workflow.e2e.test.ts` (10; living field: settle ignores infinite animations, carrier containment and anchor distances read through the group transform; perceptual closure at ROLE and REQUIREMENT: every trace a path with the hit path first, distinct paths, pointer-owned points on each trace's own path, no trace through the role title, carriers inside the stage, summary number agreement) | HTTP contract unchanged (5); browser: entry, edge intake upload, explicit selection, FIELD → ORGANIZATION → ROLE → REQUIREMENT → EVIDENCE → RETURN with URL state, keyboard (Enter, Escape), stored matching unchanged by the walk, exit + reload; DRAFT pool as containment without a matching; URL entry at a requirement, weak / open / pending apertures, legacy `focus=JOB`, stale role, reduced motion, pool selection from the field; stale selection. Evidence 21–26 in `docs/career_analysis/evidence/job-pool/` |
| `test/career/job-pool/job-field-presentation.test.ts` (4), `semantic-governance.test.ts` (4, file set extended to `Syntx*`), PINK `job-field-static` (3), `layer-separation` (4), the sealed SIL language suites | unchanged semantics |

### 13.7 Run record

| Date | Revision | Run | Result |
|---|---|---|---|
| 2026-10-11 | SYNTX reconstruction (this delta on 41abe12) | view model, SSR, presentation, governance (file set extended to `Syntx*`), PINK static + layer separation, sealed SIL suites, client reads: 24 files / 153 tests on a disposable database; e2e 10/10 in two consecutive runs on the final build (evidence 21–26 regenerated); tsc 0. Browser lessons: thin SVG signs need transparent hit areas (`data-sx-hit`); a ring or region is clicked on its stroke/body, a trace by absolute coordinates (Playwright's position reference for SVG groups is not their client rect); wrapped `tspan`s concatenate in `textContent`; the legacy analysis route needs a `presentation` block, so the e2e fixture carries the adapter's empty one plus one source document for the title join | green |
| 2026-10-11 | F-SX-1 / O-SX-1 (PINK, on 3d50c0a) | keyboard focus left the field when a return or an aperture close unmounted the focused sign (Escape then did nothing) → focus follows the observation point (B-SYNTX-FOCUS); a receded trace could capture the pointer over the inspectable one where traces converge → inspectable traces render last (B-SYNTX-TRACE-ORDER). e2e keyboard walk extended (REQUIREMENT aperture → ROLE → ORGANIZATION → FIELD with focus inside at every step) and trace order asserted | e2e 10/10 ×2 · SSR 7/7 · view model 13/13 · GELB governance 10/10 · static 3/3 · semantic governance 4/4 · tsc 0 |
| 2026-10-11 | Perceptual closure F-SX-2 / O-SX-2 / O-SX-3 / O-SX-4 (GELB on the owner data at :3017 = 8cb4a50; PINK ruling on O-SX-3) | co-terminal traces were drawn on identical endpoints (the dotted sweep trace invisible under the stable one and, DOM-later, owning every pointer point: the matched aperture could not be opened by pointer) → traces are paths with distinct bows (B-SYNTX-BOW); traces crossed the role title → traces bend around the role disc and the labels, carriers are placed beside the requirements that reach them; the carrier was cropped at REQUIREMENT → the camera keeps scale 2.4 and shifts to reach (B-SYNTX-REACH); "1 sources" → number agreement (B-SYNTX-NUMBER) | view model 14/14 · SSR 7/7 · GELB governance 10/10 · semantic governance 4/4 · presentation 9/9 + 4/4 · e2e 10/10 · tsc 0 |
| 2026-10-12 | Living field (owner mandate "SFE — SYNTX LIVING FIELD · VISUAL RECONSTRUCTION", on 1ca3ca9) | planetarium grammar reconstructed from the sealed Capability Field files (read only) and applied in `SyntxField.tsx`: atmosphere, orbit paths, containment ring and spokes, membranes, cores, glow referents, depth blur, unfold / rise / recenter / suspend-enter transitions, role positions moving with the region, ambient breathing + ring orbit behind one switch (B-SYNTX-MOTION); hit areas cover the rings | view model 14/14 · SSR 7/7 · GELB governance 10/10 · semantic governance 4/4 · presentation 9/9 + 4/4 · PINK static 3/3 + layer · client reads · e2e 10/10 · tsc 0 · sealed files byte-identical |
| 2026-10-12 | Visual grammar transfer (owner mandates "GREEN · VISUAL FIELD RECONSTRUCTION", "VISUAL GRAMMAR TRANSFER", on e6486b1) | three lab rounds against the Capability Field reference: regions as planetarium nodes with identity block and density pill, roles on a lower inner ring with node typography and core signatures, pool core with plasma rings at the centre, mint evidence carriers with draw-on rays, HUD aperture surface, carrier reach box; sequence recorded under evidence/job-pool/living-field | view model 14/14 · SSR 7/7 · GELB governance 10/10 · semantic governance 4/4 · presentation 9/9 + 4/4 · PINK static 3/3 + layer · client reads · e2e 10/10 · tsc 0 · sealed files byte-identical |
| 2026-10-12 | Semiontic motion & trace reconstruction (owner mandate "SFE — GREEN · SEMIONTIC MOTION & TRACE RECONSTRUCTION", on 36058a4; GREEN only, isolated lab) | DELTA 01: ambient life substantially increased inside the accepted names — pool core glow breathing, dash streams along the containment spokes, counter-turning resonance rings around each region, drifting motes, turning orbit paths, membrane / glow / signature breathing with regions answering the core 1.2 s later (measured in the lab: core region brightness 80 → 95, membrane 23 → 31 per 6.2 s cycle, phase-coupled); DELTA 02: traces are cubic arcs with one handedness and a mint → cyan gradient, aura, carrier bloom, bead chains for unscored coverage and one finite light running each risen trace; geometry (`tracePoint` / `tracePath` / `traceRayPath`) stays the routing's truth, bows unchanged. Evidence: `evidence/job-pool/living-field/motion/` (video, breathing and emergence frame sheets, stills) | view model 14/14 · SSR 7/7 · PINK walk 3/3 (Q-06 names ⊆ allowed, FIELD infinite names {sxBreathe, sxOrbit}, all inside signs in state field) · e2e 10/10 · tsc 0 · sealed files byte-identical |
| 2026-10-12 | Evidence orbit / semiotic trace reconstruction (owner mandate "GRÜN — NUR DELTA EVIDENCE ORBIT / SEMIOTIC TRACE RECONSTRUCTION", on 424c3f7; GREEN only, isolated lab) | the source carrier no longer stands still beside the relation: it spirals in along the role's evidence ring and settles (orbit trail drawn beneath it), the traces grow out of the settled carrier, one light runs each trace and the anchor couples with one ring; then the relation rests (finite sequence ≈ 5 s, staggered per carrier; `sxTraceRise` retired, `sxCarrierOrbit` / `sxCouple` added, both finite). Carriers take no pointer, so the transform is Playwright-stable; trace paths, ids, proofs, pointer ownership, keyboard and reduced motion unchanged. Evidence refreshed under evidence/job-pool/living-field/motion | view model 14/14 · SSR 7/7 · governance 10/10 · PINK walk 3/3 · e2e 10/10 · tsc 0 · sealed files byte-identical |
| 2026-10-12 | Evidence orbit must live on (owner ruling "GRÜN — OWNER RULING · EVIDENCE ORBIT MUSS WEITER", on 3ba7db8; GREEN only, isolated lab) | after the arrival the carrier no longer stands still: it circles its routed place on a 10-unit loop every 26 s, upright, in the field's own mote-drift grammar (`sxOrbit`, phase per carrier), and the traces are redrawn to its body every frame, so the relation visibly organizes itself out of the motion; REQUIREMENT camera reach widened by the loop. Known gate consequence for the owner's decision: PINK Q-06 asserts no `sxOrbit` at ROLE (R15 FIELD only) → extension of R15 needed once approved | view model 14/14 · SSR 7/7 · governance 10/10 · e2e 10/10 · PINK walk: Q-01…Q-05/Q-07…Q-11 and carried states green, Q-06 red on the `sxOrbit`-at-ROLE assertion (expected, see left) · tsc 0 · sealed files byte-identical |
| 2026-10-12 | Existing semiotic system reconstruction (owner mandate "SFE — GREEN · EXISTING SEMIOTIC SYSTEM RECONSTRUCTION", on 71d2b1f; GREEN only, isolated lab) | Phase 01: code-grounded inventory of the Capability Field's visual grammar (energy rays with SMIL photon streams and midpoint beads, inter-orbital coupling Q-paths, OrbitalResonanceBubble anatomy with float / moons / ring pulses / atmosphere glow, deep-focus settle and the mint evidence link, satellites on a shared rAF clock, core plasma). Phase 02: transfer — the invented layers (gradient bodies, auras, blooms, pulse lights, coupling rings, spiral arrival, orbit trails, drift loops, per-frame trace following) are removed; carriers are planetarium nodes (float, moons, semiotic ring, settle), traces are energy rays (mint evidence link at rest, active ray when inspectable, photons by the stage table, bead); geometry back to quadratic coupling arcs with bows. Side-by-side capture of both fields under motion recorded (capability-vs-jobfield.webm). Gate consequence unchanged: PINK Q-06 asserts no infinite name at ROLE beyond sxSuspend (R15) and is red on `sxFloat` / `sxMoonOrbit`; SMIL photons are outside `getAnimations`, as in the planetarium itself | view model 14/14 · SSR 7/7 · governance 10/10 + 4/4 · e2e 10/10 · PINK walk: all scenarios green except the Q-06 ROLE-name assertion (expected, see left) · tsc 0 · sealed files byte-identical |
| 2026-10-12 | Semiontic field reconstruction — composition (owner mandate "SFE — GREEN · SEMIONTIC FIELD RECONSTRUCTION", on 0327d8d; GREEN only, isolated lab) | Phase 01 with a populated reference: the lab now runs the application's own intake (text source → `/api/career/analyze` → job → worker with PINK's deterministic MockInferenceProvider answering the gold case extended to five capabilities) so the Capability Field fills in-session (L0 counts 1/5/1/1/0/1, HUD with DOC pill and top items, L1 cosmos with five orbiting cluster cards on tethers, L2 deep focus: nucleus, four satellites on spokes, the EVIDENCE surface beneath the nucleus on the mint link) and the Job Field of the same session reads the same analysis. Identified: the existing application never places a source as a distant node tied to entities by lines; evidence is attached beneath the focused entity. Phase 02: the ecology takes that composition — anchors as satellites of the role core on faint spokes (arc outside a 90° evidence sector at the bottom), source carriers inside the ecology beneath the core (ring 104, inside the boundary 158) on the mint link, traces as short energy rays from the evidence body to its anchors. Evidence: `capability-vs-jobfield.webm` (comparable complexity, one session), `populated-session.webm`, `reference-*.png` | view model 14/14 · SSR 7/7 · governance 10/10 + 4/4 · e2e 10/10 · PINK walk: all scenarios green except the Q-06 ROLE-name assertion (`sxFloat` / `sxMoonOrbit`, R15; expected) · tsc 0 · sealed files byte-identical |
| 2026-10-12 | Final deep-focus delta (owner mandate "SFE — GREEN · FINAL DEEP-FOCUS DELTA", on dac4bf0; GREEN only, isolated lab, same populated reference session) | the Capability Field's deep-focus transformation is reused for the whole ecology (recede blur(3px) grayscale(86%) / scale .72, focus 1.12, .78 s; anchors settle as deep-focus satellites .62 → 1, .72 s); the carrier float is replaced by the cosmos's `OrbitalSatelliteMotion` (shared rAF clock, ellipse 14 × 9, 60 s per turn) and its link and traces are recomputed from that position every frame (probe over 6 s: carrier x/y and trace end coincide to 0.1 field units in every sample). Side-by-side 16 s from one populated session: `capability-vs-jobfield.webm` | view model 14/14 · SSR 7/7 · governance 10/10 + 4/4 · e2e 10/10 · PINK walk: all scenarios green except the Q-06 ROLE-name assertion (`sxMoonOrbit`, R15; expected) · tsc 0 · sealed files byte-identical |
| 2026-10-12 | Concrete visual correction (owner mandate "GREEN — CONCRETE VISUAL CORRECTION", on 7bda76a; GREEN only, same populated reference session) | nucleus ×1.5 with the L2 nucleus materials and one resonance region; ecology radii ×1.3 (categories, order, camera scales unchanged; nucleus kept in the REQUIREMENT framing); evidence straight beneath the nucleus and satellites fanned from the top (the regression the e2e caught on the first attempt — a short trace buried in a converging bundle, 0 owned pointer points — is gone: 7 / 11 / 14 / 14); traces as screen-constant filaments with a faint halo, photons and beads in screen pixels, emphasis on the selected anchor. View-model expectation "a single trace stays straight" replaced by the clearance it stands for. Comparison: `capability-vs-jobfield.webm` (21 s, L2 deep focus left, Job Field REQUIREMENT → EVIDENCE right, one session) | view model 14/14 · SSR 7/7 · governance 10/10 + 4/4 · e2e 10/10 · PINK walk: all scenarios green except the Q-06 ROLE-name assertion (`sxMoonOrbit`, R15; expected) · tsc 0 · sealed files byte-identical |
| 2026-10-12 | Semiotic transfer (owner "GRÜN — SYNTX SEMIOTIC TRANSFER", GO for variant A; on 5898def = 9e86d44 + plan 1.9.0; GREEN only, isolated lab) | §13.2.3: seven domain-neutral manifestation components extracted from the Capability Field (374/374 renders byte-identical); the Job Field rebuilt on them as planetarium → organization cosmos → role cosmos → requirement deep focus → evidence HUD; organizations first (roles as moons); scored/unscored separated per row and curve; scale check with 16 organizations / 53 roles / 191 requirements. Findings fixed on the way: keyframe text inside the stage (now at the field root), zero-size sign wrappers (now real extents), colliding test-id prefixes (renamed), floating aperture (now still), global button ripple (suppressed in the field) | tsc 0; unit/SSR/governance/sealed SIL/Capability batch 40 files / 230; workflow e2e 10/10; PINK walk unchanged 0/3 (expected: Q-01 role buttons, Q-06 camera, focus tag); PINK walk with the proposed rebinding 3/3 |
| 2026-10-12 | Evidence aperture refinement (owner "Die Evidenz-Apertur … veredeln"; visual / semiotic only, on ca11794; GREEN only, isolated lab) | the inspection aperture as a calm hologram surface: rounded HUD with a fine mint / cyan frame and atmospheric interior, a glow layer that breathes (`sxApertureBreathe` 7 s, opacity only — the surface holds still), and semantic layers: head (requirement or role), relation line (stroke sample + relation · scored / unscored), source line (glyph, title, location chip), the quote as its own reading space, micro-metric chips (contribution, confidence, weight; resonance and rank in the pending aperture), explanation, and a separated boundary zone with the authority statement as chips (text unchanged). Ids, states, texts, data, keyboard and click logic unchanged. Before / after: `evidence/job-pool/semiotic-transfer/aperture/` | job-pool batch 18 files / 114; workflow e2e 10/10; PINK walk with the proposed rebinding 3/3 |
| 2026-10-13 | Semiotic finishing pass (owner "SFE — GREEN · SEMIOTIC FINISHING PASS", on 00e9103; visual only, GREEN only, isolated lab) | §13.2.4: Job Field resonance tone (azure atmosphere and resting structure; semantic colours unchanged), organization bodies as lit resonance spheres with a slow atmosphere halo and a calm light reaction, the source carrier as a document membrane with a vector glyph, the aperture with more depth and a slower two-tone glow; O-JF-LABEL documented. Shared components: optional tone props only (Capability renders 374 / 374 byte-identical). Before / after: `evidence/job-pool/semiotic-transfer/finishing/` | tsc 0; Capability renders 374 / 374 byte-identical; unit / SSR / governance / sealed SIL / Capability batch 32 files / 192; workflow e2e 10/10; PINK walk with the proposed rebinding 3/3 (Q-01 … Q-11, Q-06 and carried states PASS; report under finishing/pink-walk-proposal) |
| 2026-10-13 | Final visual finishing pass (owner "FINAL VISUAL FINISHING PASS — JOB FIELD", on d16db44; visual only, GREEN only, isolated lab) | §13.2.5: organization bodies with a still light membrane, corona, calmed signature and reading halos; the source carrier as a document sheet (folded corner, ruled ground, outline glow); the aperture with field ground, quotation marks in the relation colour, layer hairline and a lifted governance zone; resting cards and satellites in the azure register; O-JF-LABEL extended. Before / after: `evidence/job-pool/semiotic-transfer/final-pass/` | tsc 0; Capability renders 374 / 374 byte-identical (sha256 unchanged); unit / SSR / governance / sealed SIL / Capability batch 32 files / 192; workflow e2e 10/10; PINK walk with the proposed rebinding 3/3 (report under final-pass/pink-walk-proposal) |
| 2026-10-13 | Field selector & final readability (owner "SFE — GREEN · FIELD SELECTOR & FINAL READABILITY", on f96217f; GREEN only, isolated lab) | §13.2.6: SYNTX field selector in the application shell (two equal fields, exactly one active, exclusive visibility, calm veil, keyboard ←/→), organization body typography (signature clears the reading area, reading plates, opaque hovered interior, rim tether), organization cosmos role-label clearance (O-JF-LABEL resolved); O-JF-PANEL documented. Evidence: `evidence/job-pool/semiotic-transfer/field-selector/` | tsc 0; Capability renders 366 / 374 byte-identical, the 8 shell renders identical after removing the selector and shell markers; unit / SSR / governance / sealed SIL / Capability batch 32 files / 192; workflow e2e 10/10; PINK walk with the proposed rebinding 3/3; selector proof 25 / 25 (exclusivity, ids, deep link, keyboard, reduced motion, role-card clearance at 1600 × 1000 and 1280 × 720) |
| 2026-10-13 | Decision Loop Labs brand core (owner "ONE FIELD GRAMMAR. NEW BRAND CORE.", on a047f53; visual only, GREEN only, isolated lab) | §13.2.7: the DLL mark as field light in the pool core's lens, the Job Field header as Decision Loop Labs (Capability header unchanged), a static brand grid and registration frame, slight teal calibration; O-DLL-SCOPE open. Evidence: `evidence/job-pool/semiotic-transfer/brand-core/` | tsc 0; Capability renders 366 / 374 byte-identical, 374 / 374 after removing the selector and shell markers (unchanged against a047f53); unit / SSR / governance / sealed SIL / Capability batch 32 files / 193 (one new SSR test for the brand surface); workflow e2e 10/10; PINK walk with the proposed rebinding 3/3 (report under brand-core/pink-walk-proposal; the walk caught a first header test id under the retired `job-field…` prefix, renamed to `shell-brand-dll`); brand proof 20 / 20; selector proof 25 / 25 |
| 2026-10-13 | Four panels (owner "FOUR PANELS. CLEARER SIGNAL.", on 00299f5; visual only, GREEN only, isolated lab) | §13.2.8: Job Field panel material for pools, intake and boundary (glass, edge current, breathing aura, field node), boundary in four sections with chips and ruled statements, pools as row cards with a lit selection, intake wells and action chip, selector membrane and contrast. Evidence: `evidence/job-pool/semiotic-transfer/panels/` | tsc 0; Capability renders 366 / 374 byte-identical, 374 / 374 shell-normalized; batch 32 files / 193; panel text and contract identical before / after; panel proof 24 / 24; workflow e2e and PINK walk run on the following polish pass (same tree plus the polish) |
| 2026-10-13 | Visual polish pass (owner "FEINSTUFE / VISUAL POLISH PASS", on d79d4f8; visual only, GREEN only, isolated lab) | §13.2.9: selector balance, loop link and field-change light; role cards as semantic carriers; opaque cosmos centre (ghost text gone) and body micro-typography; edge vignette. Evidence: `evidence/job-pool/semiotic-transfer/polish/` | tsc 0; Capability renders 366 / 374 byte-identical, 374 / 374 shell-normalized; batch 32 files / 193; workflow e2e 10/10; PINK walk with the proposed rebinding 3/3 (covers d79d4f8 too; teardown could not terminate a transient superuser backend, the run's own disposable DB was then dropped with the verifying helper); selector proof 25 / 25; brand proof 20 / 20; panel proof 24 / 24; text and contract identity |
| 2026-10-13 | Local pass: pools panel and role cards (owner "Small field. Local recursion.", on b156364; visual only, isolated lab) | §13.2.10: pools spine with nodes, grid rows, aligned action chips; role cards with staggered level line, weighted count, edge field anchor. Evidence: `evidence/job-pool/semiotic-transfer/local-pools-roles/` | tsc 0; local proof 11 / 11; text and contract identity of both zones; role-card clearance 4 / 4; panel proof 24 / 24; Job Pool SSR 13 / 89 (no full sweep by owner rule) |
