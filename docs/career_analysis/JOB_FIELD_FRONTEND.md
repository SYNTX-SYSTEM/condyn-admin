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
| 2026-10-11 | `3b0fc38` | preservation batch: `test/career/job-pool` + `test/career/hr-decision-loop` (without e2e) + 5 sealed SIL language suites + view-model (29 files) | first run 151/152: `hr-decision-loop/local-composition.postgres` "registers the unified persistence order on construction …" failed after 42 ms; alone 2/2, with the Job Pool composition suites 13/13, full batch rerun 152/152. Observed once, not reproduced; recorded, not explained away (candidate: ordering of two registration gates on one fresh database within one process) |
| 2026-10-11 | `3b0fc38` | `tsc --noEmit` | 0 errors |
