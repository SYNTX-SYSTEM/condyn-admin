# CONDYN — Complete System Acceptance Test Plan

| Field | Value |
| --- | --- |
| Document | `CONDYN_SYSTEM_ACCEPTANCE_TEST_PLAN_v1.3.md` |
| Version | 1.3.1 (2026-10-11) |
| Authored by | PINK (independent SFE validation field) under the owner mandate "SFE — COMPLETE SYSTEM ACCEPTANCE TEST PLAN" |
| Application version under test | `integration/job-field-governance` @ `6b1a7b4` (authoritative, GELB 2026-10-11) = `01b1d7b` (`ee4c4dc` + GRÜN's lens model `LENS_V1`, `af53a58`/`9b14e83`, `JOB_FIELD_FRONTEND.md` §12, manual J10d and P6c, + the caption authority-label fix `job-field-authority-label` 10.5 px) + plan 1.3.0 taken as `bfe0d27` + the F-LF-1 label correction (`6b1a7b4`: the UNSCORED_COVERAGE pending label reads `UNSCORED SWEEP COVERAGE`, kind definition unchanged). Every scenario binds on this tip. Since the owner's Lens Field handover (2026-10-11) the owner's environment on port 3017 runs `bfe0d27` + `6b1a7b4` on its preserved database; every scenario incl. (LENS_V1) binds there, read-only (A-04). | Every scenario cites this tip; a different tip requires a new plan version or a documented delta (§5.3). | Every scenario cites this tip; a different tip requires a new plan version or a documented delta (§5.3). |
| Executing agent | an independent external testing agent operating through Gemini Antigravity (browser automation, screenshots, video, HTTP, read-only SQL) |
| Scope | the complete CONDYN application: Capability Discovery (F10/F11 Gemini sweep), Gemini processing of PDF/text sources, the legacy canonical analysis, the Job Pool Connection (JSON upload, canonical mapping, presentation matching), the spatial Job Field (JOB focus), PENDING relations, the HR Decision Loop dock, and the semiontic SIL frontend (planetarium, zoom, motion) |
| Out of scope | production deployment (forbidden), the shared `condyn` database (forbidden), role/privilege administration (forbidden), application changes (forbidden) |
| Machine-readable index | `docs/acceptance/condyn-acceptance-scenarios.v1.json` (one row per scenario: id, suite, sequence, risk, evidence) |

Change log: 1.0.0 initial release against `cccd647`; 1.0.1 GELB's code review folded in (start-up log lines, status output, state-file secret rule, HR route status codes, jobs route bodies); 1.0.2 A-07 state-file permission check added; 1.1.0 tip moved to `0353cd9` (GELB's integration of GRÜN's final semiontic Job Field `ce76bc7`): Appendix A regenerated (235 ids), root and dock data-* states in §2.3, E-11 progressive disclosure, J-07/J-09 bound to the motion grammar, J-10 planetarium motion inventory, I-08 OBSERVE items, K geometry facts, L-07 accessibility gap register, O intent table, Appendix C/D extended with GRÜN's boundaries and §8/J8–J11; 1.1.1 GRÜN's information surfaces `a3a4f04` (surface grammar FIELD_EXTENSION_V1, veils, pending ids line, ground line, fonts) folded into §2.3, E-11, I-08, TS-O, Appendix A (236 ids), C and D; 1.1.2 single tip `093b9e6` (GELB's integration of `a3a4f04`), documentation-only; 1.2.0 GRÜN's Pool Field `1e5c2e3`: third field state POOL and the field-state strip (§2.3), TS-D rewritten as the Pool Field (D-01 … D-14), E-01/E-07, H-02/H-04, I-07/I-08, J-07/J-09, TS-O (O-11), Appendix A (247 ids), C (B-POOL-INITIAL-FOCUS), D (§10, P1–P7); 1.2.1 single tip `d17b042` (GELB's integration of `1e5c2e3`), documentation-only; 1.2.2 finding E-07 (exit state lost on reload) fixed by GRÜN in `627ec07`: E-07, H-02, D-10 and B-POOL-INITIAL-FOCUS state the explicit-focus rule; PINK's Job Field proof asserts it; 1.2.3 single tip `142df0f` (GELB's integration of `627ec07`, HR-loop preservation set green), documentation-only; 1.2.4 GRÜN's galaxy grammar `b64e2c9` (pending integration): §2.3 galaxy contract, E-12 galaxy structures, D-15 Pool Field nebulae and folds, fold notes on E-03/E-06/D-06/D-07, J-11 galaxy motion, I-08 (i)(j), O-12, Appendix A (256 ids), D (§11, J10c, P6b); 1.2.5 single tip `ee4c4dc` (GELB's integration of `b64e2c9`; keyboard operability of the folds proven by PINK's browser proofs), documentation-only; 1.3.0 GRÜN's lens model `LENS_V1` on `01b1d7b`: interaction model rewritten (focus levels, contextual lenses, camera, no side surfaces or veils) with the ids unchanged — §2.3, E-03 … E-06, D-01/D-02/D-04/D-05/D-11, J-12, I-08 (k)(l)(m), K, L-07 (authority label observation resolved), Appendix A (262 ids), C (B-LENS-HIT, B-LENS-TRANSFORM, B-CAPABILITY-CHROME), D (§12, J10d, P6c); 1.3.1 single tip `6b1a7b4` (GELB's take of plan 1.3.0 as `bfe0d27` + the owner-approved F-LF-1 label correction: `UNSCORED (SWEEP COVERAGE ONLY)` → `UNSCORED SWEEP COVERAGE`, the kind definition `proposal exists && state ≠ MATCHED` and the dual membership weak+sweep unchanged and now pinned by a unit case), owner environment moved to it (PINK's read-only lens proof 88/90 on `bfe0d27`, pending row confirmed on `6b1a7b4`), finding F-LF-2 noted under D-11 as known open, documentation-only.

---

## 1. How to use this plan

1. Read §2 (what the system is and what it claims), §3 (what you must never do) and §4 (how to stand the system up) completely before touching anything.
2. Execute the sequences of §7 in order. Each sequence names its scenarios from §6. Do not skip S0 and S1.
3. Record evidence exactly as §8 prescribes; a scenario without its required evidence counts as NOT EXECUTED, never as PASS.
4. Classify every deviation with §10 before calling it a defect: the boundary register (Appendix C) lists behaviours that are accepted owner decisions or known legacy exceptions. A deviation that matches a register entry is reported as BOUNDARY-MATCH, not as a defect.
5. Apply the recursion gate of §5 after any application change delivered during the test campaign: re-execute only the targeted set the gate names.
6. Produce the final report with the verdict grammar of §9.

Vocabulary for findings, used throughout: KNOWN (stated by a contract document), OBSERVED (seen by you in this run, with evidence), INFERRED (your interpretation). Never promote INFERRED to OBSERVED.

---

## 2. System reconstruction for the tester

### 2.1 The three layers plus the presentation field

```
PDF / text / GitHub / website ──► POST /api/career/analyze (202, JOB_…) ──► career worker (claims the job)
        │                                                                     │
        │                                   F10 bounded proposal runtime: Discovery (RUN_) → Convergence (CONV_)
        │                                   on the real model; proposals PCAP_ with content-addressed evidence EVD_
        │                                   (F11 projection). Legacy canonical analysis (ANL_…) with capabilities,
        │                                   organizations, roles, strategies extracted by the model.
        ▼                                                                     ▼
GET /api/career/jobs/{jobId}  (PENDING → RUNNING → SUCCEEDED | FAILED, ≤ 3 attempts)
GET /api/career/analyses/{analysisId}  (200 VERIFIED: analysis, capabilityProposalProjection | null, reactFlowGraph)
        │
        ├──► SIL planetarium (/career/demo): orbit 01 sources, 02 capabilities (sweep proposals overlay the legacy
        │    capabilities when a projection exists), 03 inferred organisations, 04 inferred roles, 05 tension (empty
        │    for real analyses), 06 evolution; zoom L0 planetarium → L1 clusters → L2 evidence → L3 source
        │
JSON Job Pool ──► POST /api/career/job-pools (201 new | 200 identical, JPOOL_<sha256 prefix>) ──► layer C:
        one DOCUMENT source revision per upload → organisations → role bindings → role profiles (TRPREV_)
        → requirement revisions (TRQREV_), all PROPOSAL_ONLY, authority NONE; Capability-Requirement Relation
        NOT_EVALUATED (reason VERIFIED_CAPABILITY_SNAPSHOT_ABSENT, owner item HIA-1)
        │
        └──► layer P: GET /api/career/job-pools/{id}/matches?analysisId=ANL_… computed on read, never persisted:
             resonanceScore per pool role from the ANALYSIS capabilities only (EXACT > ALIAS > COMPOSITE_CONSTITUENT
             > TOKEN_CONTAINMENT, weak < 0.7), plus unscored capabilitySweep coverage (AVAILABLE | NOT_PRODUCED |
             FAILED; scored: false). Rendered by the Job Pool panel and, in JOB focus, by the spatial Job Field.
        │
layer D: HR Decision Loop dock (/career/demo?careerDecisionContextRevisionId=DCTXREV_…): reads one exact
        decision context and its persisted post-decision chain; declares a human decision (DCR) through the sealed
        DAR gate. No edge from P or C into D.
```

Laws the interface prints and the tester must see honoured: `PRESENTED != EVALUATED · UPLOADED != SELECTED ·
RANKED != RECOMMENDED · MISSING != GAP DECISION · COVERED != SCORED` (panel); `NEAREST != CHOSEN · PENDING !=
MISSING CAPABILITY · COVERED != SCORED · DISTANCE != TRUTH · POOL ROLE != INFERRED ROLE` (Job Field);
`PERSISTED != TRUE · DECLARED != DONE · RETURN != NEW DECISION · ROOT != HEAD != LATEST` (HR dock).

### 2.2 Glossary (binding; from `JOB_POOL_CONNECTION.md` §12.1)

| Term | Meaning the tester must apply |
| --- | --- |
| analysis capability | an entity of the legacy canonical analysis (`identity.name`, confidence, evidence quotes); the only **scored** source of matching |
| capability sweep proposal | a `PCAP_` proposal of the Gemini Discovery/Convergence run with a source-verified quote and **no confidence**; shown as unscored coverage; never scored (HIA-3) |
| pool role / pool organisation | entities declared in the uploaded JSON; never joined by name with inferred roles/organisations of the analysis (SG-1) |
| resonanceScore | Σ contribution / Σ weight of a pool role, presentation only, authority NONE; `POOL RESONANCE (PRESENTATION)` in the Job Field |
| matched / weak evidence / missing | requirement states of the presentation matching; missing means "no evidence delivered", never "capability absent" (SG-2) |
| PENDING (Job Field) | per pool role: UNPROVEN_CANONICAL (all TRQREV, reason NOT_EVALUATED · VERIFIED_CAPABILITY_SNAPSHOT_ABSENT), UNRESOLVED_EVIDENCE (weak), UNSCORED_COVERAGE (sweep covers a weak or missing requirement), NO_EVIDENCE_DELIVERED (missing without coverage) |
| nearest presented role | the first delivered role with resonance > 0 and ≥ 1 scored match; a presentation, not a role relation (RRL), not a recommendation (RCP), not a decision |
| PRE_CANONICAL_DISCOVERY | orbit label when no canonical SIL region exists; everything shown is model extraction or proposal, authority NONE |
| DCTXREV / DAR / DCR | decision context revision, authority grant, human decision record of the HR loop (layer D) |
| disposable test database | `condyn_test_<16 hex>` on localhost, carrying the marker comment `CONDYN_DISPOSABLE_TEST_DATABASE <name>`; the only databases any test may touch |

### 2.3 Observable state models

Job lifecycle (`/api/career/jobs/{id}`, intake banner): `SUBMITTING → PENDING → RUNNING(currentOperation: SOURCE_PREPARATION, INFERENCE, …) → SUCCEEDED | FAILED`; ≤ 3 attempts; the UI banner `intake-telemetry-banner` shows the step, `intake-success-banner` the success, `intake-error-banner` the failure with `retry-intake-btn`.

Job Pool panel (`job-pool-panel`): list `IDLE/LOADING | AVAILABLE | EMPTY | NOT_PROVISIONED | FAILED`; upload outcome `CREATED | EXISTING | REJECTED(code, issues) | NOT_PROVISIONED | FAILED`; selection `NONE | SELECTED | NOT_LISTED`; matches `IDLE | AVAILABLE | INACTIVE (409) | NOT_FOUND | NOT_PROVISIONED | FAILED`; analysis source `JOB_RESULT | URL | NONE`.

Job Field (`job-field`, attribute `data-field-state`): `NO_POOL | NO_ANALYSIS | LOADING | AVAILABLE | NOT_FOUND | INACTIVE_POOL | NOT_PROVISIONED | FAILED`; role selection `NONE | ROLE | NOT_DELIVERED`.

HR dock (`hr-decision-loop-dock`): `LOADING | AVAILABLE | NOT_FOUND | FAILED`; per family region `AVAILABLE | EMPTY | NOT_PROVISIONED | FAILED`; declaration `DECLARED | REJECTED(code) | FAILED`.

Planetarium root `semantic-career-intelligence-field`: `data-field-focus` `CAPABILITY | JOB | POOL` (1e5c2e3; URL `focus=JOB|POOL`; an exact `jobPoolUploadId` without a `focus` opens POOL, explicit `focus=JOB` wins: B-POOL-INITIAL-FOCUS), `data-zoom-level` `0..4` (0/1/2 reachable; L3/L4 buttons always disabled), `data-focused-stage-id` `"" | 01..06`, `data-sil-mode` `PRE_CANONICAL_DISCOVERY | CANONICAL_TARGET_BOUND_SIL`, `data-hr-decision-loop-context`, `data-job-pool-upload`, `data-camera-scale` (always `1`, dead); per orbit `canonical-sil-region-state-<stage>` `PRE_CANONICAL | AVAILABLE | EMPTY | NOT_PRODUCED | UNKNOWN | FAILED`; `orbital-physics-<stage>[data-attention-state]`; runtime rail `data-runtime-operation` `RECOVERY_CHECK | SOURCE_PREPARATION | INFERENCE | ANALYSIS_VALIDATION | PERSISTENCE` with `data-runtime-operation-active`. Zoom navigation: different orbit → L1; same orbit with item → L1, without → L0; cosmos node → L2; cosmos background/centre → L0; deep-focus nucleus → L1. Default page data is EMPTY until an intake job SUCCEEDED or a `canonicalSilAssociationId` is given.

Field-state strip (1e5c2e3): `field-focus-strip[data-field-focus]` with three constant buttons `field-focus-capability-btn` (◈ CAPABILITY), `job-pool-panel-toggle` (⬡ JOB POOL), `field-focus-job-btn` (◉ JOB), each `data-field-focus-active` and `aria-pressed`; the active one glows (`fieldFocusSwitchBreath` 6 s, reduced-motion guarded); clicking the active state returns to CAPABILITY; in-field exits `job-field-exit-btn` and `job-pool-panel-collapse` read "← CAPABILITY FIELD". Pool Field (1e5c2e3, §10): `job-pool-panel` is the field root (absolute overlay) with all its former data-* attributes plus `data-field-grammar=POOL_FIELD_V1`, `data-surface-grammar`, `data-motion-grammar`, `data-motion-mode`, `data-structure-role`, `data-upload-count`; `job-pool-orbit` (upload ring), `job-pool-core[data-motion=BREATH]`, `job-pool-list[data-pool-count][data-list-state]`, `job-pool-list-state`, `job-pool-item-<id>[data-at-core][data-delivered-index][data-selected][data-pool-status]` (exactly one node `data-at-core=true` after an explicit selection, none before), `job-pool-select-<id>` as the node body (disabled + `aria-pressed` when selected), `job-pool-structure-canvas`, `job-pool-structure-organization-<org>[data-role-count]`, `job-pool-structure-role-<role>[data-requirement-count][data-resonance-score][data-scored-match][data-motion UNLIT|BREATH|STILL][data-selected][data-focused]`, `job-pool-structure-role-detail[data-role-id]` with `job-pool-structure-requirement-<req>[data-necessity][data-eligibility]` and `job-pool-structure-role-back`, `job-pool-role-<id>[data-revealed]` with `job-pool-role-<id>-toggle` (relations folded in the DOM, B-JF-REVEAL rule), `job-pool-enter-job-field` (only when matches AVAILABLE), `job-pool-non-claims` as the ground line. The panel's `data-anchor` is removed. Galaxy grammar (b64e2c9, §11): `data-galaxy-grammar=GALAXY_V1` on `job-field` and `job-pool-panel`; `job-field-nebula-<org>` / `job-pool-nebula-<org>` (`data-aggregate-score` = `organizationMatches[].aggregateScore` verbatim or `""` when not delivered; `data-hue` = identity by delivered position from `[190, 262, 158, 222, 300, 120]`; `data-motion` BREATH only with a delivered aggregate, else STILL; count = pool organisations); `job-field-thread-<role>[data-resonance-score]` exists iff the role has a scored match (resonance > 0 and matched > 0), opacity 0.08 + 0.42 × resonance; `job-field-moon-<req>[data-segment-state][data-motion STEADY|WAVER|CIRCULATE|VOID]`, one per requirement around its role node (count per role = its TRQREV count; the ring arcs on the node are gone, the composition bar keeps `data-segment-state` segments); `job-field-reading`: one sentence from delivered facts on the nearest reading and the role detail. Folds (hidden in the DOM, textContent keeps binding): `job-field-pending-why` → `job-field-pending-reason`; the Job Field legend folds source counts, ranking and prose behind `job-field-legend-toggle` (only the four state words stay visible); Pool Field `job-pool-layer-c-toggle` (`data-revealed` on `job-pool-canonical-mapping`) and `job-pool-matching-details-toggle` → `job-pool-matching-details` (kind/policy line, candidate capabilities, `job-pool-capability-sweep`, the missing boundary, `job-pool-organizations`); `job-pool-label-*`, `job-pool-ranking` and the role readings stay visible; Pool Field organisation names are curved text on their arcs. Lens model (LENS_V1, 01b1d7b, §12): `data-interaction-grammar=LENS_V1` and `data-focus-level` on `job-field` (FIELD | ROLE) and `job-pool-panel` (FIELD | POOL | ROLE). Job Field: the left/right surfaces and veils are gone; one header line `[data-jf-surface=header]`; `job-field-stage` wraps canvas and lenses in one coordinate space. FIELD level: `job-field-nearest` is a caption at the nearest role's body, outward from the core (`data-caption-side`), pointer-transparent except `job-field-open-nearest`, carrying `job-field-authority-label` (the full authority sentence, 10.5 px, never the smallest text); `job-field-legend` is an affordance bottom-left (`job-field-legend-toggle` → `job-field-legend-text`, everything folded incl. the four state words and source counts; textContent keeps binding). ROLE level: `job-field-canvas` `data-camera-scale` 1 → 1.5 (780 ms transform on `[data-jf-camera]`); the selected role's `data-moon-radius` grows (radius+10 → radius+40) and `[data-jf-moon-label]` names appear (count = requirements); `job-field-lens[data-role-id]` holds `job-field-role-detail`; `job-field-nearest` is not mounted while a role is selected; other roles at 0.22 opacity. Pool Field: no veils; `job-pool-upload` (intake) is visible iff no upload is selected or `job-pool-intake-toggle` opened it (`data-intake-visible`); `job-pool-selected` is a fixed lens at the viewport's right edge, vertically centred, containing `job-pool-matches` (labels, ranking, readings hint, matching-details fold, ENTER JOB FIELD); `job-pool-role-list[data-role-count]` is a layer of lenses `job-pool-role-lens-<role>` at the role bodies, hidden unless the structure role is focused; a focused lens holds `job-pool-structure-role-detail` and `job-pool-role-<role>` (so `job-pool-role-<id>-toggle` requires focusing the structure role first); while a body is focused the core lens dims and ignores pointer events and the upload ring recedes.

Job Field motion (`JOB_FIELD_FRONTEND.md` §8, tip `ce76bc7`): `job-field[data-motion-mode=LIVE|REDUCED]`, `data-motion`/`data-motion-grammar` on animated elements, `data-focused`, `data-revealed`; roles are `BREATH` (scored match: light swings, node still), `STILL` (no light, no animation) or `VOID`; affordances `job-field-legend-toggle` (aria-expanded), `job-field-requirement-toggle-<req>`, `job-field-reveal-all` (aria-pressed), `job-field-resonance-bar`, `job-field-composition`; folded text stays in the DOM, hidden (B-JF-REVEAL). Information surfaces (a3a4f04, §9): `job-field[data-surface-grammar=FIELD_EXTENSION_V1]`, two veils `[data-jf-veil=left|right]` (aria-hidden, pointer-events none), surfaces `[data-jf-surface=left|right]`, `job-field-pending-ids[data-kind]` as the single ids line shown when a pending token is clicked (the cell keeps `data-ids`, `title`, `aria-expanded`), `job-field-non-claims` as a centred ground line under the canvas lifted by the header height (B-JF-GROUND-LINE).

HR dock data states: `hr-decision-loop-dock[data-loop-read-state IDLE|LOADING|AVAILABLE|NOT_FOUND|FAILED][data-declaration-state IDLE|SUBMITTING|DECLARED|REJECTED|FAILED][data-next-context-state …]`, regions `hr-decision-loop-region-<name>[data-region-state]`, bindings `hr-decision-loop-bound-revisions[data-bound-count][data-binding-region-state incl. ABSENT]`, `next-context-entry[data-entry-kind URL|INPUT|BINDING]`, `decision-context-revision-<id>[data-revision-position][data-return-character][data-binding-state]`. Locale: page-wide, default `en`, not in the URL, not persisted; hard-coded strings outside the SIL copy stay English (B-LOCALE).

### 2.4 Surfaces and their stable identifiers

Every interactive element carries a `data-testid`. Appendix A lists all 262 ids of the demo surface with their owning component. Ids that no UI path reaches on `ce76bc7` (GRÜN survey): `subspace-cluster`, `evidence-node`, `decision-graph-inspector` (focused), `decision-state-*`, `evidence-quality-badge`, `traversal-animation`, `identity-core-node`, `orbital-subspace-view`; scenarios never wait for them. The tester binds to ids, never to visual position or copy wording, except where a scenario explicitly tests copy.

---

## 3. Hard boundaries and safety protocol (non-negotiable)

| Rule | Consequence of violation |
| --- | --- |
| Never connect to, read for writing, register, seed, migrate, truncate or drop the shared database `condyn`, nor `postgres`, nor any `template*` database. | Campaign invalid; report immediately. |
| Work only on disposable databases created by the provided scripts (`condyn_test_<16 hex>`, marker-verified). Drop only databases your own run created, with the provided drop command. | Campaign invalid. |
| Never touch the owner's running environment: worktree `/home/codi/Entwicklung/condyn-admin-job-pool`, port `3017`, database `condyn_test_e46502b73c9f316f`. Never run `next dev`, scripts, tests or drops there. | Campaign invalid. |
| Never set `CONDYN_ALLOW_SHARED_DATABASE`, never pass a `DATABASE_URL` naming a protected database, never run `scripts/test-db/provision-role.ts`, never run `scripts/db-hardening/*`, never alter roles or privileges. | Campaign invalid. |
| Never run `npm run worker:career` (reads `.env.local`). Never run plain `npx vitest` (refused by design). | Scenario invalid. |
| Credentials: `GEMINI_API_KEY` comes from the operator's shell only; never print, log, screenshot, store or commit it; redact worker logs before attaching them. The role file `~/.config/condyn/test-db-role.env` (mode 600) is sourced, never copied. The manual environment's state file `.hr-loop-local/state.json` contains the database URL with the role password: never read it out, attach it, upload it or commit it; refer to databases by name only. | Campaign invalid if a secret appears in evidence. |
| Stop only processes of your own PID tree after checking `/proc/<pid>/cwd` is your worktree. Never `pkill`/`pgrep` by pattern. | Peer environments killed; campaign invalid. |
| No production deployment, no `next start` against anything but your disposable database, no application change. | Campaign invalid. |
| Test data is synthetic: `docs/examples/cv.synthetic.pdf`, `docs/examples/job-pool.sample.json`, the fixtures of `test/job-pool-validation/fixtures`. No real person's CV. | Campaign invalid. |

---

## 4. Prerequisites and environment setup

### 4.1 Host facts (KNOWN)

- Node 20, PostgreSQL 14 on `localhost:5432`, least-privilege role `condyn_test_runner` (LOGIN CREATEDB, no superuser) already provisioned; credentials in `~/.config/condyn/test-db-role.env` providing `TEST_DATABASE_ADMIN_URL`.
- Playwright module for browser suites: `CONDYN_PLAYWRIGHT_MODULE=/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs` (Chromium 1243 in `~/.cache/ms-playwright`).
- Gemini: `GEMINI_MODEL=gemini-3.1-pro-preview` or `gemini-3.8-flash` (both answered on 2026-10-10/11). Without `GEMINI_MODEL` the default cascade answers 404 or "not available" (boundary B-GEMINI-MODEL).
- Next.js 16: Turbopack rejects a `node_modules` symlink in a worktree; the scripts and e2e use `--webpack`. One `next dev` per project directory.

### 4.2 Setup procedure (E-01 … E-08)

| Id | Step | Command / action | Verify (expected observable) |
| --- | --- | --- | --- |
| E-01 | Own worktree of the tip | `git -C /home/codi/Entwicklung/condyn-admin worktree add /home/codi/Entwicklung/condyn-admin-acceptance 6b1a7b4` then `cp -al /home/codi/Entwicklung/condyn-admin/node_modules /home/codi/Entwicklung/condyn-admin-acceptance/node_modules` | `git rev-parse HEAD` prints `6b1a7b4…`; `ls node_modules/next/package.json` exists; `node_modules` is a directory, not a symlink |
| E-02 | Role credentials | `set -a; . ~/.config/condyn/test-db-role.env; set +a` in every shell you use | `echo ${TEST_DATABASE_ADMIN_URL%%:*}` prints `postgresql`; never print the full URL |
| E-03 | Type check (sanity) | `npx tsc --noEmit -p tsconfig.json` | exit 0 |
| E-04 | Disposable database + server + worker (live path) | `export GEMINI_API_KEY=<from operator shell>; export GEMINI_MODEL=gemini-3.1-pro-preview; HR_LOOP_LOCAL_PORT=3117 npm run job-pool:local -- --fresh` | log lines in order: `[hr-loop:local] admin role condyn_test_runner (least privilege)`, `created disposable database condyn_test_…`, `registered schema: CAREER_FIELD_SCHEMA -> … -> CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDINGS`, `registered job-pool persistence`, `seeded the sealed-producer world (context A full chain + DCDRB, context B empty)`, `starting career worker against condyn_test_… (GEMINI_MODEL …, fresh PROMPT_ENCRYPTION_KEY, in-memory prompt repository)`, `starting next dev --webpack on 127.0.0.1:3117 against condyn_test_…`, `[worker] Worker started. Polling for jobs...`; then the banner `HR DECISION LOOPER · LOCAL MANUAL TEST ENVIRONMENT` with the Context A/B URLs for the HR dock |
| E-05 | Server without worker (stub/offline path) | `HR_LOOP_LOCAL_PORT=3118 npm run hr-loop:local -- --fresh` (no Gemini key needed) | as E-04 without the worker lines |
| E-06 | Status | `npm run hr-loop:local:status` | prints the banner (database NAME `condyn_test_…`, declarant, URLs, drop hint). SECURITY: the script's state file `.hr-loop-local/state.json` stores the database URL WITH the role password; never `cat`, print, attach, upload or commit it (it is untracked). Evidence carries the database NAME only. |
| E-07 | Automated proof landscape sanity | `npm run test:isolated -- test/job-pool-validation test/career/job-pool test/career/hr-decision-loop/local-composition-gate.test.ts` with `CONDYN_PLAYWRIGHT_MODULE` set | all green (live suite skipped without key); the runner prints `created condyn_test_…` and `dropped condyn_test_…` |
| E-08 | Cleanup at the end | `Ctrl+C` the server/worker started in E-04/E-05 (own PID tree); `npm run hr-loop:local:drop` in your worktree | `dropped condyn_test_…`; `psql "$TEST_DATABASE_ADMIN_URL" -Atc "select datname from pg_database where datname like 'condyn_test_%'"` no longer lists your database; the owner's `condyn_test_e46502b73c9f316f` may still be listed and is not yours |

Time budget: E-01…E-06 about 10 minutes; a real Gemini sweep takes 70–130 s per PDF (KNOWN).

### 4.3 HTTP access

Base URL `http://127.0.0.1:<port>`; JSON bodies; headers of note: `Idempotency-Key` (analyze), `x-condyn-principal-actor-id` (job pools, pattern `[A-Za-z0-9_.:@-]{1,128}`), `x-condyn-principal-issuer` / `x-condyn-principal-*` (HR routes, self-declared). Status table in Appendix B.

### 4.4 Read-only database inspection

Allowed only against your own disposable database, addressed by NAME from the E-06 banner and the role URL from the shell, never by a printed URL: `psql "${TEST_DATABASE_ADMIN_URL%/*}/<databaseName>" -Atc "<SELECT …>"` (the role URL's last path segment is replaced by your database name inside the shell). Allowed statements: `SELECT` on `information_schema`, `pg_database` (name list), and the application tables named in §6 TS-M. No INSERT/UPDATE/DELETE/DDL. Never a URL naming `condyn`.

---

## 5. Proof landscape and the recursion gate (SFE::RECURSION_GATE)

### 5.1 What is already proven by automated suites on `6b1a7b4`

| Area | Suites (run with `npm run test:isolated -- <paths>`) | Proven claims |
| --- | --- | --- |
| Database safety | `test/database-isolation/**` | fail-closed on non-disposable URLs, marker verification, access-path guard, least-privilege role |
| Job Pool backend | `test/career/job-pool/*.test.ts` | upload/mapping/matching contract, gate 503, sweep invariants, semantic governance SG-3/4/5 |
| PINK independent proofs | `test/job-pool-validation/**` | D-JP-1 regression, layer separation, HTTP/canonical/inverse walk on PostgreSQL, PDF → stub sweep → pool → matching, sweep coverage invariants, seeded browser walk, JOB-focus browser proof, live Gemini browser workflow (gated on `GEMINI_API_KEY`), SG-1 static guard |
| Job Field frontend | `test/career/job-pool/job-field-presentation.test.ts`, `job-field-ssr.test.tsx`, `e2e/job-pool-workflow.e2e.test.ts` | derivation, SSR states, Chromium walkthrough incl. Job Field |
| HR Decision Loop | `test/career/hr-decision-loop/**`, `test/decision-integration/**` | routes, dock, DCDRB binding, P7 forward/inverse |
| Capability Core / F10–F12 | `test/career/capability-core/**`, `test/career/sil-projection/**`, `test/career-worker-*.test.ts`, `test/career-sil-*.test.ts*` | proposal lineage, projection reader, SIL orbit contract, focus and motion seals |
| Planetarium adapter | `test/career-ui-adapter.test.ts`, `test/career/planetarium-role-alignment.test.ts`, `test/career-sil-orbit-contract.test.tsx` | projection invariants, F-JF-2 repair |

Known non-green by design (classify, do not report as new): the four G1 lifecycle suites (F-JP-5), `test/career-worker-recovery-pipeline.test.ts`, and 5-second timeouts in COVFCR and decision-core suites under load (green with `--testTimeout=60000`; see Appendix C).

### 5.2 Risk-based verification matrix

| Risk class | Where it lives | Why automated proofs do not suffice | Manual/agent coverage in this plan |
| --- | --- | --- | --- |
| R1 live model behaviour | Gemini sweep and legacy analysis of a real PDF | model variance (1–7 legacy capabilities per run; sweep 9–17) and latency are not unit-testable | TS-C, S2 |
| R2 perceptual meaning | planetarium, Job Field, panel copy, laws | automated suites assert ids and values, not whether meaning is perceivable | TS-O, TS-J, TS-L |
| R3 cross-surface navigation | URL params, focus switch, panel anchors, dock co-existence | partially covered by e2e; sequences across reloads and mixed params are not | TS-H |
| R4 motion and spatial transformation | focus transitions, orbit motion, nearest ray, role dimming, reduced motion | screenshots cannot prove motion; only video can | TS-J (video) |
| R5 responsive behaviour | no explicit breakpoints in the code; layout is fixed-geometry SVG and flex panels | never tested at phone/tablet widths | TS-K |
| R6 failure disclosure | 503/409/404/422/413, worker absent, key absent, model 404, stale ids | each exists as a unit case; the user-visible disclosure chain across surfaces is not proven end to end | TS-N |
| R7 persistence identity | JPOOL ids, canonical bytes, CSB bundles, DCR immutability | proven on seeded data; not yet proven on the live browser path with reloads | TS-M |
| R8 accessibility | keyboard, focus, contrast, announcements | no automated coverage; code shows `aria-hidden` on decoration only, `aria-pressed/current` on a few controls | TS-L |

### 5.3 Recursion gate rules

1. A delta is material when it changes any file under `app/`, `lib/`, `scripts/`, `package.json`, or a contract document cited in §2. Documentation-only deltas are not material.
2. After a material delta, re-execute the targeted automated set for the touched area (table 5.1 row) plus the agent scenarios tagged with that area's risk classes in §6, then S0. Do not re-run the full tree unless the delta touches `lib/career/db`, `lib/persistence`, `lib/database-isolation`, or `scripts/test-db`.
3. A full-tree run (`npm run test:isolated` with no path) is a release-level act: run it once per campaign on an idle machine (load < 3) and classify every red with Appendix C before reporting. Expected baseline on `6b1a7b4`: F-JP-5 reds and load timeouts only.
4. Any new red that is not in Appendix C is a defect candidate for the field named in table 5.1 (GELB for backend/contracts, GRÜN for frontend, owner for boundaries) and triggers one repair → re-proof loop, then the gate again. Three loops without convergence escalate to the owner.
5. Never weaken a test, raise a timeout in a committed file, or edit application code to make a scenario pass. The `--testTimeout=60000` diagnostic is allowed only as a classification tool, never committed.

---

## 6. Test suites and scenarios

Scenario format: **Id · Title** · Objective · Preconditions · Procedure · Expected observable outcome · Evidence (see §8 naming) · Risk tags. Every expected outcome is observable through the DOM (`data-testid`, `data-*`), an HTTP body, a log line or a read-only SQL result.

### TS-A Environment and safety

**A-01 · Worktree and tip** · Objective: the agent tests `6b1a7b4`. · Pre: E-01. · Procedure: `git rev-parse HEAD`; `git status --short`. · Expected: `6b1a7b4…`, clean tree. · Evidence: `A-01-tip.txt`. · Risk: R7.

**A-02 · Database identity fail-closed** · Objective: the application refuses a non-disposable database. · Pre: E-01, E-02. · Procedure: `DATABASE_URL="postgresql://condyn_test_runner:<any-placeholder>@localhost:5432/condyn_other" npx tsx -e 'import("./lib/career/db/client").then(m=>console.log(Object.keys(m)))'` and separately start `HR_LOOP_LOCAL_PORT=3119 npm run hr-loop:local:serve` after editing nothing (it must refuse without a state file). · Expected: the client resolves an unroutable `.invalid` host or the script fails with `ERR_HR_LOOP_LOCAL_STATE_MISSING`; no connection to any protected database. · Evidence: `A-02-fail-closed.txt`. · Risk: R7.

**A-03 · Disposable database marker** · Objective: your database carries the marker. · Pre: E-04/E-05. · Procedure: `psql "${TEST_DATABASE_ADMIN_URL%/*}/<databaseName>" -Atc "select obj_description(oid,'pg_database') from pg_database where datname = current_database()"`. · Expected: `CONDYN_DISPOSABLE_TEST_DATABASE <name>`. · Evidence: `A-03-marker.txt`. · Risk: R7.

**A-04 · Owner environment untouched** · Objective: nothing of yours ran against port 3017 or `condyn_test_e46502b73c9f316f`. · Procedure: before and after the campaign, `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3017/api/career/job-pools` (read only) and list databases. · Expected: the owner's server answers unchanged (or is absent) and its database is neither dropped nor altered by you; your own databases are gone after E-08. · Evidence: `A-04-owner-env-before.txt`, `A-04-owner-env-after.txt`. · Risk: R7.

**A-05 · Secret hygiene** · Objective: no credential in evidence. · Procedure: `grep -rEl "AIza|GEMINI_API_KEY=|postgresql://[^:]+:[^@]+@" <evidence dir>`. · Expected: no match. · Evidence: `A-05-secret-scan.txt`. · Risk: all.

**A-06 · Automated baseline** · Objective: the proof landscape is green before manual work. · Procedure: E-07. · Expected: all green except documented skips. · Evidence: `A-06-baseline.txt` (runner output). · Risk: R7.

**A-07 · State file permissions** · Objective: the manual environment's state file, which carries the role password, is private. · Pre: E-04 or E-05 started in your worktree. · Procedure: `stat -c %a .hr-loop-local .hr-loop-local/state.json` (never read the file's content). · Expected: `700` and `600` on any tip that carries `e762972` (script-only fix on top of `cccd647`); on exactly `cccd647` the values are OBSERVED and reported (KNOWN defect there, fixed in `e762972`), not a new finding. · Evidence: `A-07-perms.txt`. · Risk: R7.

### TS-B API contracts

Use the live server of E-04 (or E-05 for everything that needs no model). Capture every response body as JSON evidence.

**B-01 · Analyze rejects empty input** · `POST /api/career/analyze` with `{"documents":[]}` → `400`, `success:false`, `status:"FAILED"`, `issues[0].code` = `ERR_NO_DOCUMENTS`. Evidence `B-01.json`. R6.

**B-02 · Analyze rejects empty text / bad URLs** · bodies `{documents:[{type:"text",content:"  "}]}`, `{documents:[{type:"website"}]}`, `{documents:[{type:"github",url:"ftp://x"}]}` → `400` with `ERR_NO_DOCUMENTS`, `ERR_MISSING_SOURCE_URL`, `ERR_INVALID_GITHUB_URL`. Evidence `B-02-*.json`. R6.

**B-03 · Analyze accepts a PDF and returns a job** · body `{documents:[{type:"pdf",title:"cv.synthetic.pdf",content:"<base64 of docs/examples/cv.synthetic.pdf>"}]}` → `202` `{jobId:"JOB_…", status:"PENDING", statusUrl:"/api/career/jobs/JOB_…"}`. Evidence `B-03.json`. R1.

**B-04 · Idempotency key** · repeat B-03 twice with header `Idempotency-Key: at-b04` and the same body → second answer returns the same job (202 or the documented reuse); then the same key with a different body → `409` `ERR_JOB_IDEMPOTENCY_CONFLICT`. Evidence `B-04-*.json`. R6/R7.

**B-05 · Job polling states** · `GET /api/career/jobs/{jobId}` every 5 s until terminal → statuses in order `PENDING → RUNNING (currentOperation set) → SUCCEEDED` with `resultAnalysisId` = `ANL_<numeric suffix of jobId>` (KNOWN deterministic); unknown id → `404`. Evidence `B-05-polls.json`. R1/R6.

**B-06 · Analysis read** · `GET /api/career/analyses/{analysisId}` → `200` `{success:true, status:"VERIFIED", analysisId, metadata, matching, recommendations, capabilityProposalProjection, analysis, reactFlowGraph}`; `capabilityProposalProjection` non-null after a live sweep, `null` for an analysis without a sweep; unknown id → `404` `ERR_ANALYSIS_NOT_FOUND`. Note (Appendix C): `matching`/`recommendations` come from the hardcoded demo pool and are rendered nowhere. Evidence `B-06.json`. R1/R7.

**B-07 · Analyses index** · `GET /api/career/analyses` → `200` list containing your analysisId. Evidence `B-07.json`. R7.

**B-08 · Job pool upload: new, identical, reordered** · `POST /api/career/job-pools` with `docs/examples/job-pool.sample.json` → `201` `JobPoolUploadView` (`jobPoolUploadId` `JPOOL_[0-9A-F]{32}`, counts 3/6/28, `canonicalMapping` with `mappingState MAPPED`, `proposalState PROPOSAL_ONLY`, `authorityState NONE`, `provider CONDYN_JOB_POOL_JSON`); same bytes again → `200` same id; same content with reordered keys → `200` same id. Evidence `B-08-*.json`. R7.

**B-09 · Job pool upload errors** · `{ not json` → `400 ERR_JOB_POOL_JSON_INVALID`; `{"pool":{"id":"X"}}` → `422 ERR_JOB_POOL_SCHEMA_INVALID` with `issues[]`; sample with a role pointing to an unknown organisation → `422 ERR_JOB_POOL_REFERENCE_INVALID`; body > 1 MiB (pad `pool.description`) → `413 ERR_JOB_POOL_TOO_LARGE`; actor header `bad actor!` → `400 ERR_JOB_POOL_ACTOR_INVALID`. Evidence `B-09-*.json`. R6.

**B-10 · List and read** · `GET /api/career/job-pools` → `{jobPools:[summary…]}` ordered by poolId, version, uploadId (never by time), no `canonicalMapping` in summaries; `GET /api/career/job-pools/{id}` → view; unknown → `404 ERR_JOB_POOL_NOT_FOUND`. Evidence `B-10-*.json`. R7.

**B-11 · Matches** · `GET /api/career/job-pools/{id}/matches?analysisId={live analysisId}` → `200` `JobPoolMatchPresentation`: `presentation {kind DETERMINISTIC_RESONANCE_PRESENTATION, policyVersion JOB_POOL_PRESENTATION_MATCHING_V1, authorityState NONE, canonicalEvaluation false, decision false, weakEvidenceThreshold 0.7}`, `roleMatches` sorted by `resonanceScore` desc then `poolRoleId`, every role with `canonical.capabilityRequirementRelationState NOT_EVALUATED` and reason `VERIFIED_CAPABILITY_SNAPSHOT_ABSENT`, `capabilitySweep {state AVAILABLE, proposalCount>0, scored:false}` for the live analysis. Recompute: for each role `resonanceScore` ≈ Σ(contributions)/Σ(weights) to 4 decimals; weak items have `confidence < 0.7` or basis `TOKEN_CONTAINMENT`. Evidence `B-11.json`, `B-11-recompute.txt`. R1/R7.

**B-12 · Matches errors** · missing `analysisId` → `400 ERR_ANALYSIS_ID_REQUIRED`; unknown analysis → `404`; unknown pool → `404`; DRAFT pool (upload a copy with `"status":"DRAFT"`, 201) → `409 ERR_INACTIVE_COMPANY_POOL`. Evidence `B-12-*.json`. R6.

**B-13 · Matches persist nothing** · read `select count(*)` of every public table before and after B-11 (read-only SQL, own DB) → identical counts; no table name matches `/match|presentation|resonance/`. Evidence `B-13-census.txt`. R7.

**B-14 · HR context read** · `GET /api/career/hr-decision-loop/contexts/{DCTXREV from the E-04 banner, Context A}` → `200` read model with the fifteen families `PERSISTED · 1`; Context B → families `EMPTY`; opaque id → `404 ERR_HR_DECISION_LOOP_API_NOT_FOUND`; malformed id → `422 ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED`; the HR routes never answer `503`. Evidence `B-14-*.json`. R6/R7.

**B-15 · HR declaration gate** · `POST /api/career/hr-decision-loop/decisions` (with the `x-condyn-principal-*` headers the dock sends; without them `401 ERR_HR_DECISION_LOOP_API_UNAUTHENTICATED`) with the Context B subject, declarant `INTRUDER` → `422 ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED` with detail `DECLARANT_MISMATCH`; declarant `HR_DECIDER_LOCAL`, class `REQUEST_FURTHER_EVIDENCE` → `422` with detail `SUBJECT_NOT_ADMISSIBLE`; class `REJECT_RECOMMENDATION` → `201` `DCR_…`; identical declaration again → `409 ERR_HR_DECISION_LOOP_API_CONFLICT`. Evidence `B-15-*.json`. R6/R7.

**B-16 · Gate 503 on a non-disposable database** · start the server against an unmarked database name in the pattern (create `condyn_test_<16 hex>` with plain `CREATE DATABASE` through `$TEST_DATABASE_ADMIN_URL`, no marker), `GET /api/career/job-pools` → `503 ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED`; `select count(*) from information_schema.tables where table_schema='public'` → `0`; then `DROP DATABASE` that one (yours, unmarked). Evidence `B-16.json`, `B-16-tables.txt`. R6/R7.

### TS-C Capability Discovery and Gemini processing (live model)

Pre: E-04 with a valid key and model. Each scenario records the worker log (redacted) and the timings.

**C-01 · Text source sweep** · In `/career/demo` (close the onboarding), source dock `+ ADD TEXT`, paste a synthetic three-sentence career text, `START INTAKE ANALYSIS`. · Expected: banner `SUBMITTING → PENDING → RUNNING` with operations, `ANALYSIS COMPLETED SUCCESSFULLY` within 130 s, identity core `1 SOURCES ACTIVE`, orbit 02 count > 0, orbit label `PRE-CANONICAL DISCOVERY`. · Evidence: screenshots at PENDING, RUNNING, SUCCEEDED; `C-01-job.json`; redacted worker log. R1.

**C-02 · PDF source sweep** · `+ UPLOAD PDF` with `docs/examples/cv.synthetic.pdf`, start. · Expected: as C-01; orbit 01 shows `PDF · cv.synthetic.pdf`; `GET /api/career/analyses/{id}` has `capabilityProposalProjection.capabilities.length` ≥ 9 (OBSERVED range 9–17) and `analysis.structured_data.analysis.capabilities.length` ≥ 1 (OBSERVED 1–7; variance is boundary B-GEMINI). · Evidence: `C-02-*.png`, `C-02-analysis.json` (strip nothing; it is synthetic). R1.

**C-03 · Proposal lineage** · From `C-02-analysis.json`: every proposal has `id PCAP_…`, `evidence[].sourceDocumentId` naming the PDF's canonical document, `exactQuote` present verbatim in the PDF text (compare with `pdftotext` or the analysis `documents[].content`). · Expected: every quote found; shared `EVD_` ids across proposals are allowed (content-addressed, D-JP-4). · Evidence: `C-03-quotes.txt`. R1/R7.

**C-04 · Retry resilience** · Observe the worker log for `FAILED … lease=n` lines during C-01/C-02. · Expected: a job may fail an attempt and succeed on a later one (≤ 3); the job row shows only the last summary; the final state is SUCCEEDED. Record attempts. · Evidence: `C-04-attempts.txt`. R1.

**C-05 · Same PDF twice** · Run C-02 again as a new job. · Expected: new `JOB_`/`ANL_` ids; the capability set may differ (B-GEMINI); the sweep count stays within 9–17; the CSB bundle of each job is immutable (TS-M). · Evidence: `C-05-compare.txt`. R1.

**C-06 · Model absent / wrong** · Restart the environment with `GEMINI_MODEL` unset (E-05 plus manual worker is not allowed; instead rerun E-04 without `GEMINI_MODEL`) and submit C-01. · Expected: the job fails after ≤ 3 attempts with a model error, the UI shows `intake-error-banner` with `retry-intake-btn`, nothing crashes; classify as B-GEMINI-MODEL. Restore the model afterwards. · Evidence: `C-06-error.png`, `C-06-job.json`. R6.

**C-07 · Key absent** · `npm run job-pool:local -- --fresh` without `GEMINI_API_KEY`. · Expected: fails closed with `ERR_HR_LOOP_LOCAL_GEMINI_API_KEY_MISSING`, no server, no worker, no database left (verify list). · Evidence: `C-07.txt`. R6.

### TS-D Job Pool workflow (the Pool Field, 1e5c2e3; before that tip the same ids live in a side panel)

Pre: C-02 succeeded in the same browser session (analysis source `JOB_RESULT`) or open `/career/demo?analysisId=ANL_…`. Contract: `JOB_FIELD_FRONTEND.md` §10, manual steps P1–P7. Record video for D-01, D-04, D-12, D-13.

**D-01 · Enter the Pool Field on a fresh database** · click `job-pool-panel-toggle` in `field-focus-strip`. · Expected: `semantic-career-intelligence-field[data-field-focus=POOL]`, URL `focus=POOL`, the planetarium recedes under the blurred overlay, `job-pool-panel[data-field-grammar=POOL_FIELD_V1][data-upload-count=0]`, `job-pool-list-empty` / `job-pool-list-state`, `job-pool-core` empty with the copy "NO UPLOAD AT THE CORE · select an upload on the ring", no node with `data-at-core=true`, on 01b1d7b `job-pool-panel[data-focus-level=FIELD]` and the intake `job-pool-upload` visible as the only lens (`data-intake-visible=true`), `job-pool-analysis` names the analysis and its source, `job-pool-matches-idle`, ground line `job-pool-non-claims` visible. · Evidence: `D-01.webm`, `D-01.png`. R3/R2.

**D-02 · Upload persisted, not selected** · `job-pool-file-input` ← `job-pool.sample.json`, actor `AT_AGENT`, `job-pool-upload-btn`. · Expected: `job-pool-upload-result[data-upload-outcome=CREATED]` with `JPOOL_…` and the copy `UPLOADED != SELECTED`; a new node `job-pool-item-<id>[data-delivered-index]` emerges on `job-pool-orbit`; `data-upload-count=1`; the core stays empty (`data-at-core=true` count 0); matches still IDLE. · Evidence: `D-02.png`. R3/R7.

**D-03 · Identical re-upload** · upload the same file again. · Expected: outcome `EXISTING`, same id, ring unchanged (`data-upload-count` unchanged). · Evidence: `D-03.png`. R7.

**D-04 · Explicit selection: node to the core, structure, matching** · click `job-pool-select-<id>` (the node body). · Expected: the node travels into the core (780 ms) and is the only `job-pool-item-*[data-at-core=true]`, its button disabled with `aria-pressed=true`; the other ring nodes keep their slots; URL gains `jobPoolUploadId`; `job-pool-selected` (on 01b1d7b a fixed lens at the viewport's right edge containing `job-pool-matches`; the intake folds behind `job-pool-intake-toggle`; `data-focus-level=POOL`) with `job-pool-canonical-mapping[data-mapping-state=MAPPED][data-proposal-state=PROPOSAL_ONLY][data-authority-state=NONE]` reading `3 TOREV · 6 TRPREV · 28 TRQREV`; `job-pool-structure-canvas` shows one `job-pool-structure-organization-<org>[data-role-count]` per pool organisation and one `job-pool-structure-role-<role>[data-requirement-count]` per pool role grouped by organisation in delivered order; `job-pool-matches[data-matches-state=AVAILABLE]` with the labels `job-pool-label-DETERMINISTIC_PRESENTATION / NOT_A_CANONICAL_EVALUATION / NOT_A_DECISION`, `job-pool-ranking[data-ranking=MONOTONE_BY_RESONANCE]`, six `job-pool-role-*` cards in body order, and `job-pool-enter-job-field` present. · Evidence: `D-04.webm`, `D-04.png`, `D-04-matches.json`. R3/R7/R4.

**D-05 · Readings equal the body** · for the rank-1 role compare DOM and body: `data-rank`, `data-resonance-score`, matched entries `job-pool-role-<r>-matched-<req>[data-match-basis]`, weak entries, missing entries, evidence quotes, `job-pool-role-<r>-canonical[data-relation-state=NOT_EVALUATED]`, `job-pool-trqrev-*` count = TRQREV of that role; relations of a card are folded (`job-pool-role-<r>[data-revealed]`, `job-pool-role-<r>-toggle`): the text is in the DOM before the toggle (B-JF-REVEAL) and visible after it; on 01b1d7b the card lives in the role's lens `job-pool-role-lens-<r>`, so focus the structure role `job-pool-structure-role-<r>` first. Structure light: `job-pool-structure-role-<r>[data-resonance-score][data-scored-match][data-motion]` equals the body (BREATH only with a scored match, STILL otherwise, UNLIT when no matching is delivered for this upload). · Expected: all equal. · Evidence: `D-05-diff.txt`. R7.

**D-06 · Sweep coverage shown unscored** · (on b64e2c9 inside `job-pool-matching-details`, opened by `job-pool-matching-details-toggle`; the DOM carries it before) `job-pool-capability-sweep[data-sweep-state=AVAILABLE][data-scored=false]` with `data-proposal-count` = body; covered requirement lines `…-sweep[data-scored=false]`; role `…-sweep-only[data-count]` = body `sweepOnlyCoverageCount`; `resonanceScore` unchanged versus B-11. · Evidence: `D-06.png`. R2/R7.

**D-07 · Organisation aggregates and the ground line** · `job-pool-organizations` (on b64e2c9 inside the matching-details fold) ordered by max role score; `job-pool-non-claims` carries the five laws as the ground line under the canvas, visible at 1600×1000 and 1440×900. · Evidence: `D-07.png`. R2.

**D-08 · DRAFT pool** · upload a DRAFT copy (dashed amber node), select it. · Expected: it moves to the core; `job-pool-matches-inactive` (409) with copy `POOL IS NOT ACTIVE`; structure roles all UNLIT; the ACTIVE upload stays on the ring. · Evidence: `D-08.png`. R6.

**D-09 · Rejected uploads** · upload `{"pool":{"id":"X"}}` and a non-JSON file. · Expected: `job-pool-upload-rejected` with `HTTP 422 · ERR_JOB_POOL_SCHEMA_INVALID` and listed `job-pool-upload-issue`s; then `HTTP 400 · ERR_JOB_POOL_JSON_INVALID`; the ring is unchanged. · Evidence: `D-09-*.png`. R6.

**D-10 · Reload semantics (B-JF-SESSION, B-POOL-INITIAL-FOCUS)** · reload with `?jobPoolUploadId=…` only, then with `&analysisId=…`. · Expected: both open the Pool Field (`data-field-focus=POOL`) with that upload at the core; first: `job-pool-analysis-none`, matches IDLE; second: `job-pool-analysis` shows `FROM THE URL (EXACT ID, ASSUMED PERSISTED)` and matches read again; `focus=JOB` in the URL wins over the upload id. · Evidence: `D-10-*.png`. R3.

**D-11 · Structure role reading (1e5c2e3; lens on 01b1d7b)** · click `job-pool-structure-role-<role>`. · Expected: its organisation arc brightens, others recede; on 01b1d7b `job-pool-panel[data-focus-level=ROLE]`, the lens `job-pool-role-lens-<role>` appears at the body while the core lens dims and ignores pointer events and the ring recedes; `job-pool-structure-role-detail[data-role-id]` lists one `job-pool-structure-requirement-<req>[data-necessity][data-eligibility]` per requirement with its TRQREV id, equal to the canonical mapping of the view; `job-pool-structure-role-back` returns to the overview. Known open on 6b1a7b4 (F-LF-2, PINK → GRÜN, low): the core lens is inert but its computed opacity stays 1 because the reveal animation's fill-mode overrides the inline dim; report OBSERVED, not a new finding, until GRÜN's fix is integrated. · Evidence: `D-11.png`, `D-11-diff.txt`. R7/R2.

**D-12 · Enter the Job Field from the Pool Field (1e5c2e3)** · click `job-pool-enter-job-field`. · Expected: `data-field-focus=JOB` with the same selection, `field-focus-job-btn[data-field-focus-active=true]` glows; `job-pool-panel-toggle` returns to the Pool Field; `job-pool-panel-collapse` ("← CAPABILITY FIELD") or the active strip button returns to the ground state. · Evidence: `D-12.webm`. R3/R4.

**D-13 · Pool Field motion (1e5c2e3)** · video of D-01 … D-04. · Expected: `jpEnter` 620 ms; `jpEmerge` 760 ms + 90 ms × index on upload nodes; selection travel 780 ms (left/top transition, `cubic-bezier(.16,1,.3,1)`); core `jpBreathScale`/`jpBreathLight` 7 s; halo `jpCirculate` 26 s only with a pool at the core; structure roles `jpBreathLight` by resonance; under `prefers-reduced-motion` `job-pool-panel[data-motion-mode=REDUCED]` and no animation. Nothing moves to the core by itself. · Evidence: `D-13.webm`, `D-13-computed.txt`. R4.

**D-15 · Pool Field nebulae and folds (b64e2c9)** · after D-04: `job-pool-nebula-<org>` per pool organisation with `data-aggregate-score` verbatim when a matching is delivered (`""` otherwise), `data-hue`, `data-motion` BREATH/STILL; organisation names rendered as curved text on their arcs (textPath); `job-pool-layer-c-toggle` reveals `job-pool-canonical-mapping[data-revealed=true]`; `job-pool-matching-details-toggle` reveals `job-pool-matching-details` with the kind/policy line, candidate capabilities, the sweep block, the missing boundary and `job-pool-organizations`; `job-pool-label-*`, `job-pool-ranking` and the role readings are visible without any toggle. · Evidence: `D-15-*.png`. R2/R7.

**D-14 · Pool Field meaning (1e5c2e3)** · one reviewer pass before reading any text: ring = persisted, core = selected, arcs and inner ring = the pool's own structure (layer C, authority NONE), light on the inner ring = delivered pool resonance, unlit = no scored match, the strip = three states of one system. Score per O-rubric. · Evidence: `D-14-score.json`. R2.

### TS-E Spatial Job Field (JOB focus)

Pre: D-04 state (pool selected, analysis present). The DOM contract is `JOB_FIELD_FRONTEND.md` §4 plus the additive §8.3, §9, §10, §11 and §12 (stable on `01b1d7b`). Record video for E-01, E-04, E-05, E-07 (see §8).

**E-01 · Enter JOB focus** · click `field-focus-job-btn`. · Expected: `semantic-career-intelligence-field[data-field-focus=JOB]`, `field-focus-job-btn[data-field-focus-active=true]`, the capability planetarium recedes (dimmed, still present: all six `focus-transition-stage-shell-*` rendered), `job-field[data-field-state=AVAILABLE]` with `data-analysis-id`, `data-pool-id` = the upload id, `data-role-count=6`, `data-sweep-state`, `field-focus-job-btn[data-field-focus-active=true][aria-pressed=true]` in the strip (1e5c2e3; before that tip the panel sits at `data-anchor=BOTTOM_LEFT`); no `hr-decision-loop-*` element. · Evidence: `E-01.png`, `E-01.webm` (the transition). R3/R4.

**E-02 · Canvas reads as a field, numbers equal the body** · fetch the matches body; for every role `job-field-role-<id>`: `data-delivered-rank` = position in `roleMatches`, `data-resonance-score` = body verbatim, `data-distance` ≈ 1 − score (±0.001), `data-scored-match`, `data-matched`/`data-unresolved`/`data-covered-unscored`/`data-no-evidence` summing to the role's TRQREV count; `job-field-core[data-candidate-capability-count][data-sweep-proposal-count]` = body; `job-field-organization-<org>[data-role-count]` = aggregates; roles at score 0 remain visible on the outer ring. · Evidence: `E-02.png`, `E-02-diff.txt`. R7/R2.

**E-03 · Legend, laws, source naming** · `job-field-legend` contains `POOL RESONANCE (PRESENTATION)`, `not a canonical metric`, `ANALYSIS CAPABILITIES (SCORED SOURCE): n · SWEEP PROPOSALS (UNSCORED): m`, and the statement that no pool role/organisation is joined with an inferred one (on 01b1d7b everything incl. the four state words is folded behind `job-field-legend-toggle` into `job-field-legend-text`: present in the DOM, visible after the toggle); `job-field-non-claims` carries the five laws; the whole `job-field` innerHTML contains no `RRL_`, `TSN_`, `EIS_`, `RCP_` token. · Evidence: `E-03.png`, `E-03-dom.txt`. R2.

**E-04 · Nearest presented role** · `job-field[data-nearest-role]` = first body role with score > 0 and ≥ 1 matched; `job-field-nearest[data-role-id]` and `job-field-nearest-ray` present; on 01b1d7b the nearest reading is a caption at the role's body outward from the core (`data-caption-side`), pointer-transparent except `job-field-open-nearest`, and `job-field-authority-label` reads `presentation · authority NONE · not a role relation (RRL) · not a recommendation (RCP) · not a decision` at 10.5 px; `job-field-open-nearest` opens that role. If no role qualifies: `job-field-no-nearest` with `NO SCORED MATCH DELIVERED`. · Evidence: `E-04.png`, `E-04.webm` (ray and hover). R2/R4.

**E-05 · Role selection and disclosure** · click `job-field-role-<rank-1 id>`. · Expected: other roles dim (0.22 opacity on 01b1d7b), `job-field[data-selected-role][data-focus-level=ROLE]`, URL gains `jobRoleId`, on 01b1d7b the camera scales to 1.5 over 780 ms, the role's moons spread to radius+40 with `[data-jf-moon-label]` names (count = requirements) and `job-field-nearest` is unmounted, `job-field-lens[data-role-id]` holds `job-field-role-detail[data-role-id]` with rank, resonance, four counts, `REQUIREMENT RELATIONS (PRESENTATION)`: one `job-field-requirement-<req>` per requirement with `data-state` ∈ {MATCHED, UNRESOLVED, COVERED_UNSCORED, NO_EVIDENCE_DELIVERED}, `data-provenance` ∈ {ANALYSIS_CAPABILITY, SWEEP_PROPOSAL, NONE}, `data-basis`, `job-field-evidence-quote[data-doc-id]` quotes verbatim from the analysis; `job-field-role-back` returns to the overview (camera 1, caption mounted again). · Evidence: `E-05.png`, `E-05.webm`. R3/R4/R2.

**E-06 · PENDING block** · for the selected role `job-field-pending[data-role-id]` with `job-field-pending-UNPROVEN_CANONICAL[data-count = TRQREV count][data-ids = TRQREV ids in delivered order]`, `…-UNRESOLVED_EVIDENCE[data-ids = weak pool requirement ids]`, `…-UNSCORED_COVERAGE[data-ids = weak or missing pool requirement ids that carry a sweep proposal]` labelled `UNSCORED SWEEP COVERAGE` (6b1a7b4, F-LF-1: a weak requirement with a proposal is in UNRESOLVED_EVIDENCE and UNSCORED_COVERAGE at once, by definition; the composition line's `covered by the sweep (unscored)` counts the missing subset only), `…-NO_EVIDENCE_DELIVERED`; `job-field-pending-reason` contains `NOT_EVALUATED · VERIFIED_CAPABILITY_SNAPSHOT_ABSENT` and the HIA-1/2 sentence (on b64e2c9 folded behind `job-field-pending-why`). · Evidence: `E-06.png`, `E-06-ids.txt`. R2/R7.

**E-07 · Exit and return (rule since 627ec07)** · `job-field-exit-btn`. · Expected: `data-field-focus=CAPABILITY`, the strip shows CAPABILITY active, the planetarium is interactive again; the URL reads `focus=CAPABILITY` with `jobPoolUploadId` kept and `jobRoleId` removed; a reload of that URL stays in CAPABILITY with neither `job-field` nor `job-pool-panel` mounted. The same holds after `job-pool-panel-collapse` and after clicking the active strip switch. (History: on `d17b042` the exit left an upload id without a focus, so a reload opened the Pool Field; PINK finding, fixed by GRÜN in `627ec07`, proven by `test/job-pool-validation/job-field.e2e.test.ts` and GRÜN's e2e.) · Evidence: `E-07.webm`, `E-07-reload.png`. R3/R4.

**E-08 · Deep links** · open `/career/demo?focus=JOB&analysisId=…&jobPoolUploadId=…&jobRoleId=role_fullstack` → field opens on that role; `…&jobRoleId=role_stale` → `job-field-role-not-delivered` naming the id, never silently dropped. · Evidence: `E-08-*.png`. R3/R6.

**E-09 · Field states** · `?focus=JOB&jobPoolUploadId=…` → `data-field-state=NO_ANALYSIS` + `job-field-no-analysis`; `?focus=JOB&analysisId=…` → `NO_POOL` + `job-field-pool-selection` with `job-field-select-pool-<id>` (selecting writes the URL and reads the field); DRAFT pool → `INACTIVE_POOL`; `jobPoolUploadId=JPOOL_STALE` → `NOT_FOUND`. · Evidence: `E-09-*.png`. R6/R3.

**E-11 · Progressive disclosure (ce76bc7)** · `job-field-legend-toggle` (aria-expanded) reveals the legend text (geometry sentence, motion grammar sentence, hover hint) with `jfRise` 320 ms; in a role detail `job-field-requirement-toggle-<req>` reveals that line's evidence, `job-field-reveal-all` (aria-pressed) reveals every line; folded text is present in the DOM and hidden (B-JF-REVEAL), so E-03/E-05 text assertions hold before and after; `job-field-resonance-bar` and `job-field-composition` are visible before any reveal. On `a3a4f04`: `data-surface-grammar=FIELD_EXTENSION_V1`, both veils and both surfaces rendered, no bordered panel anywhere in JOB focus, clicking a pending token shows exactly one `job-field-pending-ids[data-kind]` line with the ids of that kind, the ground line `job-field-non-claims` is visible under the canvas at 1600×1000 and 1440×900 (not clipped by the overflow-hidden root). · Evidence: `E-11.webm`, `E-11-*.png`. R2/R4.

**E-12 · Galaxy structures (b64e2c9)** · with the matches body: `job-field-nebula-<org>` count = pool organisations, `data-aggregate-score` = `organizationMatches[].aggregateScore` verbatim (`""` when not delivered), `data-hue` by delivered position from `[190,262,158,222,300,120]`, `data-motion` BREATH only with a delivered aggregate else STILL; `job-field-thread-<role>` exists exactly for roles with resonance > 0 and ≥ 1 matched, `data-resonance-score` verbatim, computed opacity ≈ 0.08 + 0.42 × resonance; `job-field-moon-<req>` count per role = its TRQREV count with `data-segment-state` equal to the requirement state and `data-motion` STEADY (matched) | WAVER (unresolved) | CIRCULATE (covered unscored) | VOID (no evidence); `job-field-reading` on the nearest reading and the role detail is one sentence of the form "<title> at <org>: pool resonance x% (presentation). a of n requirements matched with scored evidence, b unresolved, c covered by the sweep without a score, d without delivered evidence." with a+b+c+d = n and the numbers equal to the body. · Evidence: `E-12.png`, `E-12-diff.txt`. R2/R7.

**E-10 · Sweep NOT_PRODUCED and AVAILABLE** · with a seeded/URL analysis without sweep: `data-sweep-state=NOT_PRODUCED`, no `…-sweep` lines, `…-sweep-only[data-count=0]`; with the live analysis: `AVAILABLE`, covered lines present, scores unchanged versus the panel. · Evidence: `E-10-*.png`. R2/R7.

### TS-F PENDING relations (semantic integrity)

**F-01 · Pending is not missing capability** · in E-06, for a `NO_EVIDENCE_DELIVERED` requirement the copy says "no evidence delivered · absence of evidence is not absence of capability"; nowhere does the UI print "verified capability", "missing capability" or "gap decision" for pool requirements. Search the `job-field` and `job-pool-panel` innerHTML. · Evidence: `F-01-dom.txt`. R2.

**F-02 · Four kinds never merged** · counts of the four pending kinds are reported separately and add up as E-02; UNSCORED_COVERAGE never reduces UNRESOLVED or NO_EVIDENCE counts. · Evidence: `F-02-counts.txt`. R7.

**F-03 · Canonical state cites its reason everywhere** · panel `job-pool-role-<r>-canonical[data-relation-state=NOT_EVALUATED][data-relation-reason=VERIFIED_CAPABILITY_SNAPSHOT_ABSENT]`, field `job-field-pending-reason`, body `canonical.reason`. All three agree. · Evidence: `F-03.txt`. R7.

**F-04 · Unscored stays unscored** · B-11 versus a matches call on an analysis without sweep for the same pool: identical `resonanceScore` per role; `capabilitySweep.scored === false` always; no `sweepProposal` carries a confidence. · Evidence: `F-04-compare.txt`. R7.

**F-05 · Planetarium pending labels** · orbits 02–06 show `PRE-CANONICAL DISCOVERY` (`canonical-sil-region-state-<stage>`) for a live analysis; orbit 05 `0 items` (legacy projection empty, boundary B-ORBIT-COPY / F-JF-4); proposals in orbit 02 clusters read `PROPOSED` with `EVIDENCE PASSED // SEMANTIC DEFINITION NOT RUN` at zoom L1. · Evidence: `F-05-*.png`. R2.

### TS-G HR Decision Loop dock

Pre: the two context URLs printed by E-04/E-05 at start (Context A persisted chain; Context B empty families).

**G-01 · Context A read** · open the Context A URL, close onboarding. · Expected: `hr-decision-loop-dock` on the right, planetarium unchanged, `hr-decision-loop-context` with DCTXREV/DAR/RCP ids and two subjects (`hr-decision-loop-subject-*`), `hr-decision-loop-chain` fifteen families `PERSISTED · 1`, `hr-decision-loop-bound-revisions` with the DCDRB binding, laws in `hr-decision-loop-non-claims`. · Evidence: `G-01.png`. R3/R7.

**G-02 · DREV walk** · `next-context-load-btn` on the preloaded child → labels `ENTRY: EXPLICIT ID FROM URL (ASSUMED, NOT BOUND)`, child `NOT BOUND TO THIS CONTEXT · INVENTORY EXTENDED BEYOND PREDECESSOR`, root `BOUND TO THIS CONTEXT · DCDRB_…`, `next-context-terminal` `ROOT REACHED`; clicking the bound DREV button → `ENTRY: DCDRB BINDING OF THIS CONTEXT` and the URL carries `decisionContextRevisionId=<root>`; typing `DREV_000000000000000000000000` → `next-context-not-found` (absence, not failure). · Evidence: `G-02-*.png`. R3/R7.

**G-03 · Context B empty families** · open the Context B URL. · Expected: every family `NONE PERSISTED`, `hr-decision-loop-bound-revisions-none` (persisted as empty, not unprovisioned). · Evidence: `G-03.png`. R7.

**G-04 · Declaration gate** · declarant `INTRUDER`, class REJECT_RECOMMENDATION, one evidence line → `hr-decision-rejected` with `ERR_HUMAN_DECISION_DECLARANT_MISMATCH`; declarant `HR_DECIDER_LOCAL`, class REQUEST_FURTHER_EVIDENCE → `ERR_HUMAN_DECISION_SUBJECT_NOT_ADMISSIBLE`; class REJECT_RECOMMENDATION → `hr-decision-declared` with `DCR_…` and the DCR family `PERSISTED · 1`; declare again unchanged → `IMMUTABLE RECORD WITH THIS IDENTITY ALREADY EXISTS` (409). · Evidence: `G-04-*.png`. R6/R7.

**G-05 · Co-existence with the Job Pool panel** · on Context A with `&jobPoolUploadId=…`: the dock stays right, the panel left; opening the panel never changes the dock, declaring never changes the panel; no element reads the other (`PERSISTED != TRUE` and `PRESENTED != EVALUATED` both visible). · Evidence: `G-05.png`. R3/R2.

**G-06 · Field without the dock** · `/career/demo` without `careerDecisionContextRevisionId` → no `hr-decision-loop-*` element, no loop attribute on the field. · Evidence: `G-06.png`. R3.

**G-07 · Inverse by hand** · open the "API: seeded human decision record" and "context A read-model" URLs from the start banner; every id shown in the dock is an exact key in those bodies. · Evidence: `G-07-ids.txt`. R7.

**G-08 · Dock on a NOT_PROVISIONED family** · (only if reachable without DDL) open the dock on the E-05 server before any job pool route ran; families whose tables the unified registration created are `AVAILABLE/EMPTY`; record what the dock says for any `NOT_PROVISIONED` family and compare with `HR_DECISION_LOOP_FRONTEND_INTEGRATION.md` §8 (G1 wording). · Evidence: `G-08.png`. R6.

### TS-H Navigation and URL state

**H-01 · First visit** · fresh browser profile, `/career/demo`. · Expected: `guided-onboarding-overlay` appears after the first content render; `onboarding-step-card`, prev/next/finish buttons, `open-codex-from-onboarding`; closing sets `localStorage.condyn_onboarding_seen`; a reload does not reopen it; a cleared storage reopens it. · Evidence: `H-01-*.png`. R3.

**H-02 · URL as the only selection carrier** · after D-04, copy the URL into a new tab: the Pool Field opens with the selection at the core (1e5c2e3, B-POOL-INITIAL-FOCUS) and matches read (with `analysisId`); without `analysisId` the analysis does not return (B-JF-SESSION). No "latest pool" or "latest analysis" is ever chosen and no node moves to the core without an explicit selection or an exact id. An explicit `focus` (CAPABILITY, POOL or JOB) always wins over the upload id (627ec07). · Evidence: `H-02-*.png`. R3.

**H-03 · Browser back/forward** · enter JOB focus, select a role, exit; press Back twice and Forward twice. · Expected: focus and selection follow the URL at every step without a stuck state or a dock appearing. · Evidence: `H-03.webm`. R3.

**H-04 · Mixed parameters** · `?careerDecisionContextRevisionId=…&jobPoolUploadId=…&analysisId=…&focus=JOB` → dock right, Job Field centre (explicit JOB wins); the same without `focus` → dock right, Pool Field centre; each surface reads only its own ids. · Evidence: `H-04.png`. R3.

**H-05 · Stale ids are named** · `jobPoolUploadId=JPOOL_STALE` → `job-pool-selection-not-listed`; `careerDecisionContextRevisionId=DCTXREV_STALE` → `hr-decision-loop-not-found`; `analysisId=ANL_STALE` → panel `job-pool-matches-not-found` on selection; `jobRoleId` stale → E-08. Never a blank screen. · Evidence: `H-05-*.png`. R6.

**H-06 · Legacy pages** · `/career/analyses` lists your analysis; `/career/analyses/<id>` renders the canonical analysis and a ReactFlow graph; `/career/analyze` shows its documented error (boundary B-ANALYZE-PAGE, not on the path); `/`, `/topology`, `/career-test` render without a server error (smoke only). · Evidence: `H-06-*.png`. R3.

**H-07 · Direct API links from the start banner** · each printed URL answers 200 with JSON. · Evidence: `H-07.txt`. R7.

### TS-I Interaction surfaces

**I-01 · Onboarding steps** · step through all steps with `onboarding-next-btn`/`onboarding-prev-btn`; `onboarding-finish-btn` closes; `open-codex-from-onboarding` opens the codex. · Expected: step counter `STEP i OF n` correct, no step skipped, Escape or close works. · Evidence: `I-01.webm`. R2/R3.

**I-02 · System Codex and language** · `open-system-codex-btn` → `system-codex-modal` with chapters `codex-chapter-*` (8 chapters), `bilingual-switcher` with `switch-lang-de`/`switch-lang-en`; switching changes the codex AND the field copy (orbit subtitles, panel copy, Job Field copy) consistently; `system-codex-close` and backdrop close it. · Expected: no mixed-language surface after a switch; the five laws exist in both languages. · Evidence: `I-02-de.png`, `I-02-en.png`. R2.

**I-03 · Semantic guide drawer** · `semantic-guide-drawer-toggle` opens `semantic-guide-drawer`; content matches the current focus (capability vs JOB). · Evidence: `I-03-*.png`. R2.

**I-04 · Source dock** · `add-text-source-btn`, `add-github-source-btn`, `add-website-source-btn`, `add-pdf-source-btn`; `submit-source-btn` validates empty inputs; staged list shows kind chips `PDF/GIT/WEB/TXT`; `start-intake-analysis-btn` disabled until one source is staged. · Evidence: `I-04-*.png`. R3/R6.

**I-05 · Orbit HUD and zoom** · hover an orbit → `hud-actions` with `OPEN EVIDENCE`, `INSPECT SOURCES`, `VIEW MATCHES`; `OPEN EVIDENCE` on orbit 02 → `zoom-level-1-clusters` (`subspace-cluster` items with `CONFIDENCE n%` or `PROPOSED`), a cluster → `zoom-level-2-evidence` with `evidence-node`s and `evidence-quality-badge`, then `zoom-l3-source`; `semantic-zoom-telemetry` reflects the level; Escape/back returns level by level. For orbits 03/04 the focus projection lists organisations/roles with their rationale. · Evidence: `I-05.webm`, `I-05-l1.png`, `I-05-l2.png`. R2/R4.

**I-06 · Decision graph inspector** · with an analysis loaded, open `decision-graph-inspector`; nodes show `decision-state-supported` / `decision-state-blocked`; idle state `decision-graph-inspector-idle` without an analysis. · Evidence: `I-06-*.png`. R2.

**I-08 · OBSERVE items from the code survey (ce76bc7)** · Each is a code fact whose rendered effect was not verified on screen; record the observed state with a screenshot: (a) `semantic-zoom-telemetry` is absolutely positioned at top −46 px inside an overflow-hidden root: is it visible at all? (b) the opened `semantic-guide-drawer`: right side or normal flow top-left? (c) in JOB and POOL focus `decision-graph-inspector-idle` (fixed bottom-left) versus the ground line and the strip: overlap? (d) `hud-action-inspect-sources` is always disabled; L3/L4 zoom buttons always disabled; (e) the identity-core drop zone shows `⚡ DROP SOURCE NOW` while dragging but drop is non-functional; (f) `InferenceTelemetryHUD` (fixed bottom-right) overlaps `semantic-focus-panel`. Classify (d)–(f) under B-PLANETARIUM-MOTION / existing-field boundaries unless they block a journey. On `a3a4f04` also: (g) legibility of the 8.5 px tracked mono labels at 1440 px width; (h) whether the right veil dims the right-most organisation label too much; on b64e2c9: (i) on b64e2c9 the opened legend scrolled inside the left surface at 1000 px height (superseded by the lens model); (j) nebula tint perceptibility on low-contrast displays (hue only tells organisations apart, brightness is the delivered resonance); on 01b1d7b: (k) the outward caption may overlap an organisation label on the rim; (l) at 1280 px width the core lens of the Pool Field may touch the upload ring; (m) the role lens scrolls at 84 % stage height. · Evidence: `I-08-*.png`. R3/R2.

**I-07 · Field-state strip (1e5c2e3)** · `field-focus-strip[data-field-focus]` with `field-focus-capability-btn`, `job-pool-panel-toggle`, `field-focus-job-btn`, labels constantly ◈ CAPABILITY · ⬡ JOB POOL · ◉ JOB. · Expected: exactly one button `data-field-focus-active=true` / `aria-pressed=true` at any time; it glows (`fieldFocusSwitchBreath` 6 s, none under reduced motion); clicking the active button returns to CAPABILITY; `job-pool-panel-collapse` and `job-field-exit-btn` read "← CAPABILITY FIELD" and return to CAPABILITY; no field's exit is ever covered by another field. · Evidence: `I-07-*.png`, `I-07.webm`. R3.

### TS-J Visual coherence and motion (video required)

Record each scenario as a video (§8.3) at 1600×1000 and attach one still per named moment. Motion in SIL is semantic, never decorative (SIL v1.0 §7): resonance pulsing on high-fit nodes, activation transfer along connections on focus, tension axes toward missing items. Judge against those three principles.

**J-01 · Idle planetarium** · 10 s video of `/career/demo` with a live analysis loaded, no interaction. · Expected: `rotating-background-rings`, `plasma-core-rings`, `semantic-dust-particles`, `photon-stream-*` move continuously and smoothly (no stutter > 100 ms visible), orbit counts stable, no layout shift, no console error. · Evidence: `J-01.webm`, console log. R4.

**J-02 · Focus transition into an orbit** · click orbit 02 from L0 to L1. · Expected: `focus-transition-pulse-02` fires, `focus-transition-stage-shell-*` of other orbits recede, the focused `focused-stage-bubble-02` settles with the documented easing (`cubic-bezier(0.16,1,0.3,1)`, ≈0.6–0.8 s), content appears after the settle, not before. · Evidence: `J-02.webm`, stills at 0 ms / 400 ms / 1000 ms. R4.

**J-03 · Deep focus (L2) and satellites** · select a cluster → `orbital-deep-focus-view-02` / `capability-deep-focus-view` with nucleus and satellites (`orbital-focus-nucleus-*`, `orbital-focus-satellite-*`, `orbital-tether-*`). · Expected: satellites settle without overlap, tethers connect nucleus to satellites, `inter-orbital-coupling`/`energy-ray-*` visible when applicable. · Evidence: `J-03.webm`, `J-03.png`. R4.

**J-04 · Empty orbit semantics** · hover orbit 05 (0 items) → `sil-orbit-empty-state-05` with `empty-projection-breathing-halo`/`-shell` and `sil-orbit-empty-copy-05`. · Expected: breathing motion, copy says what is absent and why (legacy projection), no fake content, no error. · Evidence: `J-04.webm`. R4/R2.

**J-05 · Job Field entry and nearest ray** · E-01 and E-04 as video. · Expected: planetarium recedes (dim, blur) within ≈0.7 s; roles appear placed by distance; `job-field-nearest-ray` connects core and nearest role; no element overlaps the legend or the panel. · Evidence: `J-05.webm`. R4.

**J-06 · Role selection dimming** · E-05 as video. · Expected: non-selected roles dim, the selected role stays at full opacity, the detail column slides/fades in, `job-field-role-back` restores all within ≈0.5 s. · Evidence: `J-06.webm`. R4.

**J-07 · Reduced motion** · set `prefers-reduced-motion: reduce` (Playwright `reducedMotion: 'reduce'`, or DevTools Rendering), reload, repeat J-01, J-02, J-05, J-06. · Expected, Job Field and Pool Field: `job-field[data-motion-mode=REDUCED]` and `job-pool-panel[data-motion-mode=REDUCED]` (1e5c2e3), every computed `animation-name` is `none`, light values stay (light opacity > 0 on scored roles), the JOB switch glow is off, all content reachable. Expected, planetarium: guarded surfaces stop (`CapabilityCosmosView`, `CapabilityDeepFocusView`, `SilOrbitEmptyState`, `OrbitalResonanceBubble` empty-projection breathing, `OrbitalCosmosView`, satellites static at phase 0); KNOWN unguarded and therefore still moving (boundary B-PLANETARIUM-MOTION, report as OBSERVED, not as a regression): SMIL photon streams, background ring rotation, identity-core plasma/breathe/wave/particles, runtime-operation pulse, intake banner glow. · Evidence: `J-07-*.webm`, a per-surface table. R4/R8.

**J-08 · Visual coherence audit** · one full-page screenshot per surface state: capability focus idle, L1, L2, JOB focus overview, role detail, panel open, dock open, codex, DE and EN. · Expected: consistent SIL tokens (void field background `#03060a…#080c12`, cyan active accents, mono typography), no clipped text at 1600×1000, no overlapping controls, consistent chip grammar (`MAPPED · PROPOSAL_ONLY · authority NONE`). · Evidence: `J-08-*.png`. R2.

**J-09 · Job Field motion grammar (ce76bc7, `JOB_FIELD_FRONTEND.md` §8.1, manual J8–J11)** · Record 15 s after entering JOB focus, then hover and select a role. · Expected (name · duration · meaning): `jfEnter` 620 ms, overlay fades in over the blurred planetarium; `jfEmerge` 760 ms + 110 ms × (rank − 1), roles appear from the core in delivered order; `jfBreathLight` period 9 s − 4 s × resonance on `[data-jf-light]` of BREATH roles only, the light swings while the node does not move; STILL roles (no scored match) have no light element and no animation (not a verdict); `jfWaver` 2.6 s on UNRESOLVED segments and dots; `jfCirculate` 7 s on COVERED_UNSCORED segments and 26 s on the sweep halo only when `proposalCount > 0`; VOID nothing; `jfFlow` 2.4 s on `job-field-nearest-ray`, dashes travel core → role (flowing but dashed = not chosen); `jfOrbit` 14 s + 4 s × i, alternating direction, on `[data-motion=ORBIT]` rings while a role is hovered or selected, exactly one ring per pending kind that has ids (grey unproven canonical, amber unresolved, cyan covered-unscored, faint no-evidence); core `jfBreathScale` 7 s (scale 1.035); `jfPulse` 1.4 s on the state dot while LOADING; `jfRise` 320 ms on every revealed block; `fieldFocusSwitchBreath` 6 s on `field-focus-job-btn` while JOB. Geometry of clickable nodes never animates continuously (B-JF-MOTION-GEOMETRY). Pool Field names (1e5c2e3): `jpEnter`, `jpEmerge`, selection travel, `jpBreathScale`, `jpBreathLight`, `jpCirculate` (D-13). Verify computed `animation-name` on one element of each kind and that every value of E-02 is unchanged during motion. · Evidence: `J-09-grammar.webm`, `J-09-hover.webm`, `J-09-computed.txt`. R4/R2.

**J-11 · Galaxy motion (b64e2c9)** · `jfNebula` / `jpNebula` breath at 1.6 × the core period (11.2 s) only on lit nebulae; `jfSpin` 7 s on COVERED_UNSCORED moons; STILL nebulae and non-covered moons do not animate; all `none` under reduced motion. · Evidence: `J-11.webm`, `J-11-computed.txt`. R4.

**J-12 · Lens motion (01b1d7b)** · lens entrances `jfRise`/`jpRise` are opacity-only 320 ms (no transform in entrance keyframes, B-LENS-TRANSFORM); camera scale 1 → 1.5 over 780 ms on `[data-jf-camera]`; moon spread `cx`/`cy` 780 ms; all `none` under reduced motion. · Evidence: `J-12.webm`, `J-12-computed.txt`. R4.

**J-10 · Planetarium motion inventory (pre-existing, record as-is)** · 20 s video idle, 10 s hovering orbit 02, 10 s at L1, 10 s at L2. · Expected names and periods (OBSERVE, classify under B-PLANETARIUM-MOTION when different): `rotateClockwise` 120 s background rings / 160 s L1 carrier, `rotateCounterClockwise` 160 s, SMIL photons 3.6–6.0 s per ray (1.6/2.1 s when focused), `focusTransitionPulse` 1.6 s while hovered/active, stage shell transforms 780 ms (anchor scale 1.12; others scale .72, opacity .12, blur + grayscale), bubble `orbitFloatPhase2` 25 s staggered, `ringPulse` 2.4 s when highlighted, `hologramFloat` 6 s on the hover HUD, `moonOrbit` 160 s, empty-projection breathing 2.8 s, identity core `coreBreathe` 14 s / `waveExpand` 6 s / `corePulseCommunicate` 1.8 s while focused / plasma rotations 20 s and 14 s / `plasmaFlarePulse` 11 s, `careerRuntimeOperationPulse` 1 s on the active operation, `atmosphereGlow` 1.5 s on the intake banner, deep-focus settle 780 ms and satellites 720 ms, ghost keyframes 2.35–3.1 s. KNOWN defects to classify, not to fix: keyframe name collisions `ringPulse` (globals vs bubble) and `rotateCounterClockwise` (root vs cosmos view); HUD and inspector wrappers receive `filter: blur` during orbit focus and become the containing block of their fixed children (OBSERVE a jump). · Evidence: `J-10-*.webm`. R4.

### TS-K Responsive behaviour

No width breakpoints exist anywhere (components or `globals.css`) and no viewport JavaScript (KNOWN, GRÜN survey). Fixed geometry: root `minHeight 960px / height 100vh / overflow hidden`; planetarium 800×800 centred, orbit radius 330; source dock 340 px at left 40; HUD max 560; error banner max 600. Fluid: onboarding card 92vw; codex 95vw × 88vh; HR dock `maxHeight calc(100vh − 332px)`; Job Field canvas `min(88vh, 50vw, 760px)` centred 64 px left of the viewport centre, left column `min(300px, 26vw)`, right column `min(440px, 34vw)`; cosmos/deep-focus views use a ResizeObserver with a 320×300 minimum. Design target is desktop ≥ 1440 px wide (on 01b1d7b the Pool Field's core lens is viewport-anchored and may touch the ring at 1280 px, see I-08 (l)); at tablet width the Job Field columns narrow and planetarium chrome overlaps; at phone width the field is not designed to operate. Minimum operability to assert: no page error, every `data-field-state` reachable, every toggle clickable. Report OBSERVED behaviour; findings are for GRÜN with severity by §10.

**K-01 · Desktop 1600×1000 and 1366×768** · all surfaces of J-08. · Expected: no horizontal page scroll at 1366, panel and dock not overlapping the field core, Job Field canvas fully visible. · Evidence: `K-01-*.png`. R5.

**K-02 · Tablet 1024×768 and 820×1180** · same surfaces. · Expected: the field scales or scrolls without clipping the onboarding, codex and panel controls; every `data-testid` control remains clickable (verify by clicking panel toggle, JOB button, exit button). · Evidence: `K-02-*.png`. R5.

**K-03 · Phone 390×844** · same surfaces. · Expected: the page remains operable in principle (controls reachable by scrolling), text legible ≥ 11 px, no control hidden behind another; document any surface that becomes unusable as OBSERVED with a screenshot (frontend finding for GRÜN, severity by §10). · Evidence: `K-03-*.png`. R5.

**K-04 · Zoom 200 % and window resize mid-transition** · browser zoom 200 % on desktop; resize while a focus transition runs. · Expected: no frozen transition, no lost selection, no console error. · Evidence: `K-04.webm`. R5/R4.

### TS-L Cognitive accessibility

**L-01 · Keyboard reachability** · from a fresh load, Tab through: onboarding close, codex button, panel toggle, source dock buttons, JOB button, Job Field roles, exit. · Expected: a visible focus indication on every stop; Enter/Space activates; Escape closes modal/overlay; record any control reachable only by mouse (OBSERVED, for GRÜN). · Evidence: `L-01.webm`, `L-01-order.txt`. R8.

**L-02 · Screen-reader semantics** · inspect the accessibility tree (Chromium DevTools) of the panel, Job Field and dock. · Expected: decorative layers `aria-hidden`; controls have names; `aria-pressed` on the JOB button, `aria-current` on the selected pool; state copy (`job-field-state`, banners) exposed as text; record missing roles/names. · Evidence: `L-02-tree.txt`. R8.

**L-03 · Contrast** · sample muted copy (legend, non-claims, pending reasons) against the background with a contrast tool. · Expected: ≥ 4.5:1 for body text, ≥ 3:1 for large chips; record each failing pair with its colours. · Evidence: `L-03-contrast.txt`. R8/R2.

**L-04 · Meaning without reading the docs** · a reader who has only seen the onboarding must be able to answer, from the UI alone: what the Job Field number means, why a role is "nearest", what "pending" means, what the system does NOT claim. Write the four answers as the UI states them and mark each as perceivable (text visible at the moment of need) or hidden (needs codex/docs). · Evidence: `L-04-answers.txt`. R2.

**L-05 · Error disclosure legibility** · for each failure state of TS-N: is the cause named, is the next action offered (retry, select, append analysisId), is the wording free of internal codes without explanation? Internal codes are acceptable only when paired with a plain sentence. · Evidence: `L-05-table.txt`. R2/R6.

**L-07 · Accessibility gap register (pre-existing, report not score)** · Verify and record the state of each KNOWN gap on `ce76bc7`; a gap that is present is OBSERVED and matches boundary B-A11Y-GAPS, a gap that is closed is noted: orbit spheres `orbital-physics-*` click-only with mouse-only hover HUD (no keyboard path L0→L1); subspace clusters and inspector rows click-only; drop zone drag-only; onboarding and codex without dialog role, focus trap, focus return or Escape; glyph-only ✕ buttons without `aria-label`; source dock inputs placeholder-only; global `input:focus { outline: none }`; no `aria-live` on banners or the runtime rail; language buttons without pressed state; Job Field role nodes click/hover only (keyboard paths: URL `jobRoleId`, `job-field-open-nearest`); muted metadata `#63788a` on `#030508` below 4.5:1 at 8–9 px by design of the identity (primary `#e6f1f8` and cyan `#38e5ff` pass). Resolved observation (GELB → GRÜN, 01b1d7b): the authority sentence in the Job Field caption was 8.5 px; it is now 10.5 px under `job-field-authority-label` and is never the smallest text in the Job Field. What exists and must keep working: the fold buttons `job-field-pending-why`, `job-field-legend-toggle`, `job-field-requirement-toggle-<req>`, `job-pool-layer-c-toggle`, `job-pool-matching-details-toggle` and `job-pool-role-<id>-toggle` are real buttons with `aria-expanded`, operable by Enter and Space from keyboard focus (proven on `ee4c4dc` by PINK's browser proofs), zoom HUD `aria-current`/`aria-disabled`, `aria-hidden` on decoration, HR class buttons `aria-pressed`, cosmos/deep-focus nodes as real buttons, Job Field toggles as buttons with `aria-expanded`/`aria-pressed`, pending cells `role=button` with Enter/Space, logo `alt`. · Evidence: `L-07-register.txt`. R8.

**L-06 · Language consistency** · after I-02, scan all visible text for mixed language; count mismatches per surface. · Evidence: `L-06.txt`. R2.

### TS-M Persistence and data integrity (read-only SQL on your own database)

**M-01 · Analysis persisted once** · `select analysis_id, validation_state from career_analyses where analysis_id='<ANL>'` → one row `VERIFIED`; the jobs row `select status, attempt_count from career_analysis_jobs where job_id='<JOB>'` → `SUCCEEDED`. · Evidence: `M-01.txt`. R7.

**M-02 · Candidate source bundle immutable** · `select candidate_source_bundle_id, source_bundle_hash from candidate_source_bundles where candidate_source_bundle_id='CSB_<JOB>'`; after a retry (C-04) the row is unchanged. · Evidence: `M-02.txt`. R7.

**M-03 · Projection reference lineage** · `select discovery_run_id, convergence_run_id, candidate_source_bundle_id from career_capability_proposal_projection_references where analysis_id='<ANL>'` → one row whose run ids exist in `career_capability_runs`; the foreign keys forbid dangling references (KNOWN). · Evidence: `M-03.txt`. R7.

**M-04 · Job pool upload and canonical chain** · `career_job_pool_uploads` has one row per JPOOL id with `canonical_sha256` = sha256 of key-sorted JSON (recompute from the view's `pool`); `career_job_pool_canonical_mappings` one row; target revision tables contain the ids listed in the view (`target_source_revisions`, organisation/role/profile/requirement revision tables: use the ids from `B-08.json` with `select count(*) … where … in (…)`). · Evidence: `M-04.txt`. R7.

**M-05 · Nothing written by reads** · B-13 census before/after `GET` of matches, uploads list, analyses, HR context: unchanged. · Evidence: `M-05.txt`. R7.

**M-06 · HR decision immutability** · after G-04 the DCR row exists once; the repeated declaration added no row. · Evidence: `M-06.txt`. R7.

### TS-N Failure and exception conditions

Each scenario must end with the system still usable (no blank page, no stuck spinner) and the cause named.

| Id | Condition | Procedure | Expected observable |
| --- | --- | --- | --- |
| N-01 | Worker absent | E-05 server (no worker), submit C-01 | job stays `PENDING`; banner `QUEUED`; no false success; after restart with worker it proceeds |
| N-02 | Model error | C-06 | `intake-error-banner` + `retry-intake-btn`; job `FAILED` after ≤ 3 attempts; boundary B-GEMINI-MODEL |
| N-03 | Key absent | C-07 | fail-closed start, nothing left behind |
| N-04 | Non-disposable database | B-16 | job pool: `503 ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED`, panel `job-pool-list-not-provisioned`, Job Field `NOT_PROVISIONED`; HR routes: `200` read model with regions `NOT_PROVISIONED` and the dock's `hr-decision-loop-bound-revisions-not-provisioned`; zero DDL in both |
| N-05 | Inactive pool | D-08 / E-09 | `409`, `job-pool-matches-inactive`, `INACTIVE_POOL` |
| N-06 | Invalid upload | D-09, B-09 | rejection with code and issues; list unchanged |
| N-07 | Stale ids | H-05, E-08 | named absence on every surface |
| N-08 | Oversized upload | B-09 413 | `job-pool-upload-rejected` with `HTTP 413` when done through the panel with a 1.1 MiB file |
| N-09 | Network loss mid-poll | throttle to offline for 20 s during RUNNING, restore | polling resumes, final state reached, no duplicate job |
| N-10 | Server restart with persisted state | stop and `npm run hr-loop:local:serve` (same database), reload with full URL | selection, analysis (by id) and dock context return from persistence; sweep coverage `AVAILABLE` again |
| N-11 | Database dropped under a running page | after E-08, reload the old URL against a new server | panel/field report `NOT_FOUND`/`NOT_PROVISIONED`, never stale data |
| N-12 | Declaration conflicts | G-04 | gate codes verbatim, 409 on identity reuse |

Evidence: one screenshot or body per row, `N-xx.*`. R6.

### TS-O Semiontic quality review (perceptual usability)

Technical correctness is settled by TS-B…TS-N. This suite judges whether meaning becomes perceivable, scored against the stated semiontic intent per surface (GRÜN, 2026-10-11): identity core "my sources are the centre; everything orbits them"; orbits 01–06 "six distinct kinds of projection; a focused orbit comes forward, the rest recede"; empty orbit ghost "nothing was projected here and the place is kept, not hidden"; intake banners/HUD "working / finished / failed, and which step"; zoom HUD "how deep I am"; source dock "what I gave the system"; codex/onboarding/guide "explanation on demand, never in the way"; JOB switch "a second focus exists; its glow means you are in it"; Job Field overlay "the pool is now the field; the planetarium is behind me"; core "the candidate with a scored and an unscored source count"; role node "light = resonance, distance = 1 − resonance, unlit and still = no scored match delivered (not a verdict), segments = composition of requirements by state"; ray "the nearest presented role is in this direction, flowing but dashed = not chosen"; orbiting rings on hover "what remains pending toward this role, in distinct kinds"; nearest card "the nearest role, how pending it still is, and that nothing here decides"; role detail "resonance bar and composition first, facts on demand; waver = uncertain, circulating dashes = covered but unscored, faint gap = nothing delivered"; legend "folded; the field should be readable without it"; non-claims "the laws, always visible, small". Visual grammar of the information surfaces (a3a4f04): no bordered panels in JOB focus; mono face = identifiers, numbers, tracked labels and state words; sans face = role titles and prose; a thin tether line from the field opens the nearest reading and the role detail (cyan when lit, red-tinted when unlit); the display resonance number anchors the right surface; faces are the system monospace and system-ui, no web font (B-JF-FONTS). A score of 3 is earned only when the intent is perceived from form, position and motion before reading. Score each item 0–3: 0 not perceivable (needs the docs), 1 perceivable after reading the codex, 2 perceivable from on-screen copy at the moment of need, 3 perceivable from form, position and motion before reading. Two reviewers (or two independent passes) score; disagreement > 1 is discussed and recorded.

| Id | Question the UI must answer by itself | Surfaces | Evidence |
| --- | --- | --- | --- |
| O-01 | What is the centre and what orbits it? (identity core ↔ six orbits, semantic radii) | planetarium L0 | `O-01.png` + score sheet |
| O-02 | Which capabilities are extracted facts and which are proposals? (PROPOSED, EVIDENCE PASSED, confidence vs none) | orbit 02 L1/L2 | `O-02.png` |
| O-03 | What does the Job Field distance mean, and that it is presentation, not truth? | Job Field legend/geometry | `O-03.png` |
| O-04 | Why is this role "nearest", and that nearest ≠ chosen? | nearest ray + label | `O-04.png` |
| O-05 | What is pending, in four kinds, and that pending ≠ missing capability? | pending block | `O-05.png` |
| O-06 | Which evidence backs a match, and where it comes from (analysis vs sweep)? | requirement lines, quotes, provenance chips | `O-06.png` |
| O-07 | What the system refuses to claim (laws) and why there is no decision here | non-claims lines, HR dock laws | `O-07.png` |
| O-08 | Where am I and how do I get back? (focus, zoom level, URL state) | JOB button, exit, zoom telemetry | `O-08.webm` |
| O-09 | Is motion telling me something? (pulse = resonance, ray = activation, breathing = emptiness) | J-01…J-06 videos | score sheet |
| O-10 | Does the language switch keep the meaning (DE/EN parity of laws and chips)? | I-02 | score sheet |
| O-11 | In the Pool Field: ring = persisted, core = selected, nothing moves to the core by itself; arcs and inner ring = the pool's own structure; light = delivered resonance; the strip = three states of one system (1e5c2e3) | D-01 … D-04, D-13 | `O-11.png` + score sheet |
| O-12 | Galaxy (b64e2c9): nebula = where an organisation is and how much delivered resonance it holds; thread = scored evidence between the candidate and this role; moons = what this role asks for and in which state; the reading sentence = the whole reading in one breath | E-12, D-15 | `O-12.png` + score sheet |

Acceptance for TS-O: mean score ≥ 2.0 and no item at 0. Items at 1 are findings for GRÜN with the reviewer's wording proposal; items at 0 are blocking semiontic defects.

### TS-P Platform and legacy smoke

**P-01 · Build** · `npx next build` in your worktree (no deploy). · Expected: success, the three job-pool routes and HR routes listed. · Evidence: `P-01.txt`. R7.

**P-02 · Lint and types** · `npm run lint`, `npx tsc --noEmit`. · Expected: no errors (warnings recorded). · Evidence: `P-02.txt`.

**P-03 · Legacy routes** · `GET /api/topology/<any>` and `/api/pdf` with an empty body → documented 4xx/5xx, no crash of the server. · Evidence: `P-03.txt`. R6.

---

## 7. Execution sequences

| Seq | Name | Scenarios (in order) | Entry condition | Exit condition | Budget |
| --- | --- | --- | --- | --- | --- |
| S0 | Safety and smoke | A-01 … A-07, P-02 | E-01…E-03 done | all PASS; the baseline is green | 30 min |
| S1 | Stub path, no model | E-05 server (no worker, no key): B-01, B-02, B-08 … B-10, B-12, B-13, B-14, B-15, D-01 … D-03, E-09 (NO_ANALYSIS and NO_POOL states only), G-01 … G-07, H-01, H-05, H-06, I-01 … I-04, I-07, B-16, N-04 … N-08. Scenarios that need an analysis (D-04 onward, B-11, E-01 …) wait for S2; no analysis is seeded by hand into a server database | S0 PASS | every listed scenario executed with evidence | 2 h |
| S2 | Live model path | E-04 server: B-03 … B-07, C-01 … C-05, D-01 … D-12, D-14, D-15, B-11, E-01 … E-10, F-01 … F-05, M-01 … M-06, I-05, I-06 | S1 PASS, key and model available | live sweep succeeded at least once; all evidence | 3 h |
| S3 | Spatial and motion | J-01 … J-12, E-11, E-12, D-13, H-03, H-04, O-08, O-09 | S2 analysis loaded | videos recorded and reviewed | 1.5 h |
| S4 | Exceptions | C-06, C-07, N-01 … N-03, N-09 … N-12, G-08 | S2 done (restart environments as needed) | every failure state named and recovered | 1.5 h |
| S5 | Responsive and accessibility | K-01 … K-04, L-01 … L-07, I-08 | S2 analysis loaded | findings recorded per surface | 1.5 h |
| S6 | Semiontic review | O-01 … O-12, I-02 | S2, S3 done | score sheets from two passes | 1 h |
| S7 | Persistence, restart, cleanup | N-10, N-11, A-04 (after), A-05, E-08 | all above | no database of yours left; secret scan clean | 30 min |

Recursion: after any material delta during the campaign apply §5.3; re-run S0 and the targeted scenarios; record the delta hash in the report.

---

## 8. Evidence requirements

### 8.1 Naming and layout

```
acceptance-evidence/<campaign-id>/
  manifest.json                 # one entry per file: scenario, step, sha256, captured_at, tip, port, database
  A-01-tip.txt … P-03.txt       # text/JSON evidence as named in §6
  <id>-<seq>-<slug>.png         # screenshots, 1600×1000 unless the scenario sets a viewport
  <id>.webm                     # videos (Playwright recordVideo or a screen recorder), ≤ 60 s each
  logs/server-<port>.log, logs/worker-<port>.log   # redacted (see 8.4)
  sql/<id>.txt                  # read-only query text + result
  scores/O-xx-<reviewer>.json   # semiontic score sheets
```

`<campaign-id>` = `AT-<yyyymmdd>-<tip7>` (for this plan `AT-20261011-01b1d7b`). Every screenshot name is prefixed by the scenario id. Evidence is stored outside the repository and referenced from the report; the repository receives nothing from a campaign.

### 8.2 Screenshots

Full viewport; the URL bar or a `location.href` capture must accompany each screenshot (as a sidecar `.url.txt` or burned into the manifest). Capture the DOM state of the asserted element with `getAttribute` dumps where a scenario names `data-*` attributes (text file next to the image).

### 8.3 Video

Required for E-01, E-04, E-05, E-07, H-03, I-01, I-05, J-01 … J-07, K-04, L-01, O-08. Playwright: `browser.newContext({ recordVideo: { dir, size: { width: 1600, height: 1000 } }, reducedMotion })`; otherwise a screen recorder at ≥ 30 fps. Name the moments of interest in the manifest with timestamps (e.g. `J-02: pulse 0.0s, settle 0.8s, content 1.1s`).

### 8.4 Logs, bodies, SQL

HTTP bodies are saved verbatim as JSON. Worker/server logs are saved after redaction: remove any line containing `AIza`, `GEMINI_API_KEY`, `postgresql://` with credentials, `PROMPT_ENCRYPTION_KEY`. SQL evidence contains the statement and its result; never the connection string. Never attach: `.hr-loop-local/` (state file with credentials), `~/.config/condyn/`, `.env*` files, shell history.

### 8.5 Manifest and integrity

`manifest.json` lists every file with sha256; the final report cites files by name. A scenario whose evidence is missing from the manifest is NOT EXECUTED.

---

## 9. Acceptance criteria and verdict grammar

Per scenario: PASS (expected outcome observed, evidence complete) · FAIL (deviation not matching Appendix C) · BOUNDARY-MATCH (deviation equals a register entry; cite its id) · NOT EXECUTED (precondition unmet or evidence missing) · BLOCKED (environment prevents execution; name the blocker).

Per suite gate:

| Suite | Gate |
| --- | --- |
| TS-A | all PASS (any FAIL invalidates the campaign) |
| TS-B, TS-D, TS-E, TS-F, TS-G, TS-M | all PASS or BOUNDARY-MATCH |
| TS-C | C-01, C-02, C-03 PASS; C-04/C-05 recorded; C-06/C-07 PASS as fail-closed |
| TS-H, TS-I, TS-N | all PASS or BOUNDARY-MATCH; any blank page or stuck state is FAIL |
| TS-J | J-01 … J-06, J-09 PASS; J-07 PASS with the Job Field in REDUCED mode and the KNOWN unguarded planetarium surfaces recorded; J-10 recorded and classified |
| TS-K | K-01 PASS; K-02/K-03 recorded, usability losses are findings with severity |
| TS-L | L-01 … L-06 recorded; a control unreachable by keyboard is a finding of severity S2 |
| TS-O | mean ≥ 2.0, no 0 |
| TS-P | P-01, P-02 PASS |

Campaign verdict: **ACCEPT** (all gates met, findings only S3/S4) · **ACCEPT WITH BOUNDARIES** (gates met, S2 findings assigned and acknowledged by their field) · **REJECT** (any gate failed, or an S1 finding). Severity: S1 wrong meaning or data loss or a safety rule touched; S2 a user journey blocked or a law violated in the UI; S3 degraded usability or perceivability; S4 cosmetic.

---

## 10. Defect reporting conventions (SFE)

One report per distinct cause, in this shape:

```
ID: AT-<campaign>-<nnn>
Title: <one sentence, observable>
Scenario: <id> · Sequence: <S#> · Tip: 01b1d7b (+ delta hash if any)
Classification: Case 1 (derivable from code/contract) | Case 2 (owner decision needed) | Case 3 (unknown cause)
Responsible field: GELB (backend, contracts, worker, database) | GRÜN (frontend, copy, motion, a11y) | owner (boundaries, HIA)
Severity: S1 | S2 | S3 | S4
Boundary check: none matched | matches <Appendix C id> (then this is BOUNDARY-MATCH, not a defect)
Preconditions: <environment, port, database name, URL>
Steps: <numbered, exact clicks/requests>
Expected (KNOWN): <from the contract, with document and section>
Observed: <with evidence file names>
Inferred: <optional, clearly separated>
Non-claims: what this report does not assert
Attachments: <manifest names>
```

Rules: never bundle two causes; never report a BOUNDARY-MATCH as a defect; quote error codes verbatim; a finding about wording carries a proposed wording; semiontic findings cite the O-item and both reviewers' scores; secrets never appear. Route reports to the responsible field for root repair; after a repair the recursion gate of §5.3 names the re-test.

---

## Appendix A. Stable test ids of the demo surface (262 on `01b1d7b`)

Generated from `app/components/career/demo/*.tsx` and `app/career/demo/*.tsx`. `${…}` marks a parameter. Owning component in parentheses.

- `add-github-source-btn` (SourceDock)
- `add-pdf-source-btn` (SourceDock)
- `add-text-source-btn` (SourceDock)
- `add-website-source-btn` (SourceDock)
- `ambient-energy-nodes` (SemanticCareerIntelligenceField)
- `bilingual-switcher` (SystemCodexModal)
- `bound-decision-context-revision-${revisionId}` (HrDecisionLoopDock)
- `canonical-sil-region-state-${stageId}` (OrbitalResonanceBubble)
- `capability-cosmos-center` (CapabilityCosmosView)
- `capability-cosmos-node-${node.id}` (CapabilityCosmosView)
- `capability-cosmos-view` (CapabilityCosmosView)
- `capability-deep-focus-view` (CapabilityDeepFocusView)
- `capability-field` (CapabilityField)
- `capability-focus-evidence-${evidence.id}` (CapabilityDeepFocusView)
- `capability-focus-evidence-surface` (CapabilityDeepFocusView)
- `capability-focus-nucleus-${selected.id}` (CapabilityDeepFocusView)
- `capability-focus-satellite-${satellite.id}` (CapabilityDeepFocusView)
- `career-intelligence-dashboard` (CareerIntelligenceDashboard)
- `career-runtime-operation-rail` (InferenceTelemetryHUD)
- `codex-chapter-${ch.id}` (SystemCodexModal)
- `codex-chapter-content` (SystemCodexModal)
- `decision-context-item-${item.itemId}` (HrDecisionLoopDock)
- `decision-context-revision-${revision.revisionId}` (HrDecisionLoopDock)
- `decision-context-revision-character-${revision.revisionId}` (HrDecisionLoopDock)
- `decision-graph-inspector` (DecisionGraphInspector)
- `decision-graph-inspector-idle` (DecisionGraphInspector)
- `decision-state-blocked` (DecisionGraphInspector)
- `decision-state-container` (DecisionGraphInspector)
- `decision-state-supported` (DecisionGraphInspector)
- `empty-copy-foreground-${stageId}` (SemanticCareerIntelligenceField)
- `empty-projection-breathing-halo` (OrbitalResonanceBubble)
- `empty-projection-breathing-shell` (OrbitalResonanceBubble)
- `empty-visual-underlay-${stageId}` (SemanticCareerIntelligenceField)
- `energy-ray-${st.stageId}` (SemanticCareerIntelligenceField)
- `evidence-node` (OrbitalSubspaceView)
- `evidence-node` (SemanticCareerIntelligenceField)
- `evidence-quality-badge` (DecisionGraphInspector)
- `evolution-layer` (EvolutionLayer)
- `field-focus-strip` (SemanticCareerIntelligenceField)
- `focused-stage-bubble-${stageId}` (SemanticCareerIntelligenceField)
- `focus-stage-visual-${stageId}` (SemanticCareerIntelligenceField)
- `focus-transition-pulse-${stageId}` (SemanticCareerIntelligenceField)
- `focus-transition-stage-shell-${stageId}` (SemanticCareerIntelligenceField)
- `guided-onboarding-overlay` (GuidedOnboardingOverlay)
- `how-this-works-btn` (SemanticCareerIntelligenceField)
- `hr-decision-class-${value}` (HrDecisionLoopDock)
- `hr-decision-declarant-input` (HrDecisionLoopDock)
- `hr-decision-declare-btn` (HrDecisionLoopDock)
- `hr-decision-declared` (HrDecisionLoopDock)
- `hr-decision-evidence-input` (HrDecisionLoopDock)
- `hr-decision-failed` (HrDecisionLoopDock)
- `hr-decision-loop-artifact-${row.id}` (HrDecisionLoopDock)
- `hr-decision-loop-bound-revisions-failed` (HrDecisionLoopDock)
- `hr-decision-loop-bound-revisions` (HrDecisionLoopDock)
- `hr-decision-loop-bound-revisions-none` (HrDecisionLoopDock)
- `hr-decision-loop-bound-revisions-not-provisioned` (HrDecisionLoopDock)
- `hr-decision-loop-chain` (HrDecisionLoopDock)
- `hr-decision-loop-context` (HrDecisionLoopDock)
- `hr-decision-loop-context-link-${link.careerDecisionContextRevisionId}` (HrDecisionLoopDock)
- `hr-decision-loop-declaration` (HrDecisionLoopDock)
- `hr-decision-loop-dock-collapse` (HrDecisionLoopDock)
- `hr-decision-loop-dock` (HrDecisionLoopDock)
- `hr-decision-loop-dock-toggle` (HrDecisionLoopDock)
- `hr-decision-loop-failed` (HrDecisionLoopDock)
- `hr-decision-loop-loading` (HrDecisionLoopDock)
- `hr-decision-loop-next-context` (HrDecisionLoopDock)
- `hr-decision-loop-non-claims` (HrDecisionLoopDock)
- `hr-decision-loop-not-found` (HrDecisionLoopDock)
- `hr-decision-loop-region-${region.name}` (HrDecisionLoopDock)
- `hr-decision-loop-subject-${subject.sourceEvolutionInputItemOrdinal}` (HrDecisionLoopDock)
- `hr-decision-rejected` (HrDecisionLoopDock)
- `hud-action-${act.id}` (OrbitalResonanceBubble)
- `hud-actions` (OrbitalResonanceBubble)
- `identity-core-dropzone` (IdentityCoreDropZone)
- `identity-core-node` (IdentityCoreNode)
- `identity-core-wrapper` (SemanticCareerIntelligenceField)
- `inference-telemetry-hud` (InferenceTelemetryHUD)
- `intake-error-banner` (SemanticCareerIntelligenceField)
- `intake-success-banner` (SemanticCareerIntelligenceField)
- `intake-telemetry-banner` (SemanticCareerIntelligenceField)
- `inter-orbital-coupling` (SemanticCareerIntelligenceField)
- `job-field-authority-label` (JobField)
- `job-field-canvas` (JobField)
- `job-field-composition` (JobField)
- `job-field-core` (JobField)
- `job-field-evidence-quote` (JobField)
- `job-field-exit-btn` (JobField)
- `job-field` (JobField)
- `job-field-legend` (JobField)
- `job-field-legend-text` (JobField)
- `job-field-legend-toggle` (JobField)
- `job-field-lens` (JobField)
- `job-field-moon-${moon.poolRequirementId}` (JobField)
- `job-field-nearest` (JobField)
- `job-field-nearest-ray` (JobField)
- `job-field-nebula-${organization.poolOrganizationId}` (JobField)
- `job-field-no-analysis` (JobField)
- `job-field-non-claims` (JobField)
- `job-field-no-nearest` (JobField)
- `job-field-open-nearest` (JobField)
- `job-field-organization-${organization.poolOrganizationId}` (JobField)
- `job-field-pending-${item.kind}` (JobField)
- `job-field-pending-ids` (JobField)
- `job-field-pending` (JobField)
- `job-field-pending-reason` (JobField)
- `job-field-pending-why` (JobField)
- `job-field-pool-selection` (JobField)
- `job-field-reading` (JobField)
- `job-field-requirement-${requirement.poolRequirementId}` (JobField)
- `job-field-requirement-evidence-${requirement.poolRequirementId}` (JobField)
- `job-field-requirement-toggle-${requirement.poolRequirementId}` (JobField)
- `job-field-resonance-bar` (JobField)
- `job-field-reveal-all` (JobField)
- `job-field-role-${role.poolRoleId}` (JobField)
- `job-field-role-back` (JobField)
- `job-field-role-detail` (JobField)
- `job-field-role-not-delivered` (JobField)
- `job-field-select-pool-${pool.jobPoolUploadId}` (JobField)
- `job-field-stage` (JobField)
- `job-field-state` (JobField)
- `job-field-thread-${role.poolRoleId}` (JobField)
- `job-pool-actor-input` (JobPoolMatchPanel)
- `job-pool-analysis` (JobPoolMatchPanel)
- `job-pool-analysis-none` (JobPoolMatchPanel)
- `job-pool-canonical-mapping` (JobPoolMatchPanel)
- `job-pool-capability-sweep` (JobPoolMatchPanel)
- `job-pool-core` (JobPoolMatchPanel)
- `job-pool-enter-job-field` (JobPoolMatchPanel)
- `job-pool-evidence-quote` (JobPoolMatchPanel)
- `job-pool-file-input` (JobPoolMatchPanel)
- `job-pool-file-name` (JobPoolMatchPanel)
- `job-pool-intake-toggle` (JobPoolMatchPanel)
- `job-pool-item-${node.jobPoolUploadId}` (JobPoolMatchPanel)
- `job-pool-label-${item}` (JobPoolMatchPanel)
- `job-pool-layer-c-toggle` (JobPoolMatchPanel)
- `job-pool-list-empty` (JobPoolMatchPanel)
- `job-pool-list-failed` (JobPoolMatchPanel)
- `job-pool-list` (JobPoolMatchPanel)
- `job-pool-list-loading` (JobPoolMatchPanel)
- `job-pool-list-not-provisioned` (JobPoolMatchPanel)
- `job-pool-list-state` (JobPoolMatchPanel)
- `job-pool-matched-constituent` (JobPoolMatchPanel)
- `job-pool-matches-failed` (JobPoolMatchPanel)
- `job-pool-matches-idle` (JobPoolMatchPanel)
- `job-pool-matches-inactive` (JobPoolMatchPanel)
- `job-pool-matches` (JobPoolMatchPanel)
- `job-pool-matches-not-found` (JobPoolMatchPanel)
- `job-pool-matches-not-provisioned` (JobPoolMatchPanel)
- `job-pool-matching-details` (JobPoolMatchPanel)
- `job-pool-matching-details-toggle` (JobPoolMatchPanel)
- `job-pool-nebula-${organization.poolOrganizationId}` (JobPoolMatchPanel)
- `job-pool-non-claims` (JobPoolMatchPanel)
- `job-pool-orbit` (JobPoolMatchPanel)
- `job-pool-organization-${organization.poolOrganizationId}` (JobPoolMatchPanel)
- `job-pool-organizations` (JobPoolMatchPanel)
- `job-pool-panel-collapse` (JobPoolMatchPanel)
- `job-pool-panel` (JobPoolMatchPanel)
- `job-pool-panel-toggle` (JobPoolMatchPanel)
- `job-pool-presentation-labels` (JobPoolMatchPanel)
- `job-pool-ranking` (JobPoolMatchPanel)
- `job-pool-role-${roleId}-${kind}-${item.poolRequirementId}` (JobPoolMatchPanel)
- `job-pool-role-${roleId}-missing-${item.poolRequirementId}` (JobPoolMatchPanel)
- `job-pool-role-${role.poolRoleId}-canonical` (JobPoolMatchPanel)
- `job-pool-role-${role.poolRoleId}` (JobPoolMatchPanel)
- `job-pool-role-${role.poolRoleId}-sweep-only` (JobPoolMatchPanel)
- `job-pool-role-${role.poolRoleId}-toggle` (JobPoolMatchPanel)
- `job-pool-role-lens-${role.poolRoleId}` (JobPoolMatchPanel)
- `job-pool-role-lens-${structureRole.poolRoleId}` (JobPoolMatchPanel)
- `job-pool-role-list` (JobPoolMatchPanel)
- `job-pool-select-${node.jobPoolUploadId}` (JobPoolMatchPanel)
- `job-pool-selected` (JobPoolMatchPanel)
- `job-pool-selection-none` (JobPoolMatchPanel)
- `job-pool-selection-not-listed` (JobPoolMatchPanel)
- `job-pool-structure-canvas` (JobPoolMatchPanel)
- `job-pool-structure-organization-${organization.poolOrganizationId}` (JobPoolMatchPanel)
- `job-pool-structure-requirement-${requirement.poolRequirementId}` (JobPoolMatchPanel)
- `job-pool-structure-role-${role.poolRoleId}` (JobPoolMatchPanel)
- `job-pool-structure-role-back` (JobPoolMatchPanel)
- `job-pool-structure-role-detail` (JobPoolMatchPanel)
- `job-pool-trqrev-${id}` (JobPoolMatchPanel)
- `job-pool-upload-btn` (JobPoolMatchPanel)
- `job-pool-upload-failed` (JobPoolMatchPanel)
- `job-pool-upload-issue` (JobPoolMatchPanel)
- `job-pool-upload` (JobPoolMatchPanel)
- `job-pool-upload-not-provisioned` (JobPoolMatchPanel)
- `job-pool-upload-rejected` (JobPoolMatchPanel)
- `job-pool-upload-result` (JobPoolMatchPanel)
- `job-pool-view-failed` (JobPoolMatchPanel)
- `job-pool-view-not-found` (JobPoolMatchPanel)
- `model-attempt-${idx}` (InferenceTelemetryHUD)
- `next-context-entry` (HrDecisionLoopDock)
- `next-context-failed` (HrDecisionLoopDock)
- `next-context-lineage` (HrDecisionLoopDock)
- `next-context-load-btn` (HrDecisionLoopDock)
- `next-context-not-found` (HrDecisionLoopDock)
- `next-context-revision-input` (HrDecisionLoopDock)
- `next-context-terminal` (HrDecisionLoopDock)
- `onboarding-close-btn` (GuidedOnboardingOverlay)
- `onboarding-finish-btn` (GuidedOnboardingOverlay)
- `onboarding-next-btn` (GuidedOnboardingOverlay)
- `onboarding-prev-btn` (GuidedOnboardingOverlay)
- `onboarding-step-card` (GuidedOnboardingOverlay)
- `open-codex-from-onboarding` (GuidedOnboardingOverlay)
- `open-system-codex-btn` (SemanticCareerIntelligenceField)
- `orbital-bubble-body-${stageId}` (OrbitalResonanceBubble)
- `orbital-cosmos-center-${stageId}` (OrbitalCosmosView)
- `orbital-cosmos-empty-${stageId}` (OrbitalCosmosView)
- `orbital-cosmos-node-${node.id}` (OrbitalCosmosView)
- `orbital-cosmos-view-${stageId}` (OrbitalCosmosView)
- `orbital-deep-focus-view-${stageId}` (OrbitalDeepFocusView)
- `orbital-focus-nucleus-${selected.id}` (OrbitalDeepFocusView)
- `orbital-focus-satellite-${satellite.id}` (OrbitalDeepFocusView)
- `orbital-focus-secondary-${selected.id}` (OrbitalDeepFocusView)
- `orbital-physics-${stageId}` (OrbitalResonanceBubble)
- `orbital-preview-${stageId}` (OrbitalResonanceBubble)
- `orbital-subspace-view` (OrbitalSubspaceView)
- `orbital-tether-${stageId}` (OrbitalResonanceBubble)
- `photon-stream-core-to-orbit` (SemanticCareerIntelligenceField)
- `photon-stream-orbit-to-core` (SemanticCareerIntelligenceField)
- `plasma-core-rings` (IdentityCoreDropZone)
- `plasma-flare` (IdentityCoreDropZone)
- `resonance-energy-paths` (SemanticCareerIntelligenceField)
- `resonance-orbits` (ResonanceOrbits)
- `retry-intake-btn` (SemanticCareerIntelligenceField)
- `role-manifestation` (RoleManifestation)
- `rotating-background-rings` (SemanticCareerIntelligenceField)
- `semantic-career-intelligence-field` (SemanticCareerIntelligenceField)
- `semantic-dust-particles` (SemanticCareerIntelligenceField)
- `semantic-focus-empty-projection` (SemanticCareerIntelligenceField)
- `semantic-focus-panel` (SemanticCareerIntelligenceField)
- `semantic-guide-drawer` (SemanticGuideDrawer)
- `semantic-guide-drawer-toggle` (SemanticGuideDrawer)
- `semantic-zoom-telemetry` (SemanticCareerIntelligenceField)
- `semiotic-signature-01` (OrbitalResonanceBubble)
- `semiotic-signature-02` (OrbitalResonanceBubble)
- `semiotic-signature-03` (OrbitalResonanceBubble)
- `semiotic-signature-04` (OrbitalResonanceBubble)
- `semiotic-signature-05` (OrbitalResonanceBubble)
- `semiotic-signature-06` (OrbitalResonanceBubble)
- `sil-ghost-manifestation-${stageId}` (SilOrbitEmptyState)
- `sil-ghost-membrane-${stageId}` (SilOrbitEmptyState)
- `sil-ghost-stage-glyph-${stageId}` (SilOrbitEmptyState)
- `sil-ghost-tether-${stageId}` (SilOrbitEmptyState)
- `sil-orbit-empty-copy-${stageId}` (SilOrbitEmptyState)
- `sil-orbit-empty-state-${stageId}` (SilOrbitEmptyState)
- `source-dock-file-input` (SourceDock)
- `source-dock` (SourceDock)
- `source-satellite-kind-${node.id}` (OrbitalCosmosView)
- `source-text-input` (SourceDock)
- `source-url-input` (SourceDock)
- `start-intake-analysis-btn` (SourceDock)
- `submit-source-btn` (SourceDock)
- `subspace-cluster` (OrbitalSubspaceView)
- `subspace-cluster` (SemanticCareerIntelligenceField)
- `switch-lang-de` (SystemCodexModal)
- `switch-lang-en` (SystemCodexModal)
- `system-codex-close` (SystemCodexModal)
- `system-codex-modal-backdrop` (SystemCodexModal)
- `system-codex-modal` (SystemCodexModal)
- `tension-layer` (TensionLayer)
- `traversal-animation` (DecisionGraphInspector)
- `zoom-l3-source` (OrbitalSubspaceView)
- `zoom-level-1-clusters` (OrbitalSubspaceView)
- `zoom-level-2-evidence` (OrbitalSubspaceView)

## Appendix B. HTTP status reference (KNOWN on `01b1d7b`)

| Route | Success | Errors |
| --- | --- | --- |
| `POST /api/career/analyze` | `202 {jobId, status:"PENDING", statusUrl}` | `400` `ERR_NO_DOCUMENTS` / `ERR_MISSING_SOURCE_URL` / `ERR_INVALID_WEBSITE_URL` / `ERR_INVALID_GITHUB_URL`; `409 ERR_JOB_IDEMPOTENCY_CONFLICT`; `500 ERR_SERVER_FATAL` |
| `GET /api/career/jobs/{jobId}` | `200 {status PENDING|RUNNING|SUCCEEDED|FAILED, currentOperation, attemptCount, resultAnalysisId, errorSummary}` | `400 {error:"Missing jobId"}`; `404` not-found body; `500 ERR_SERVER_FATAL` |
| `GET /api/career/analyses` | `200` index | `500` |
| `GET /api/career/analyses/{id}` | `200 {success, status:"VERIFIED", analysisId, metadata, matching*, recommendations*, capabilityProposalProjection|null, analysis, reactFlowGraph}` (*legacy demo pool, rendered nowhere) | `400 ERR_MISSING_ID`; `404 ERR_ANALYSIS_NOT_FOUND`; `500 ERR_SERVER_FATAL` |
| `POST /api/career/job-pools` | `201` new / `200` identical `JobPoolUploadView` | `400 ERR_JOB_POOL_JSON_INVALID`, `400 ERR_JOB_POOL_ACTOR_INVALID`, `413 ERR_JOB_POOL_TOO_LARGE`, `422 ERR_JOB_POOL_SCHEMA_INVALID` (issues), `422 ERR_JOB_POOL_REFERENCE_INVALID`, `503 ERR_JOB_POOL_PERSISTENCE_NOT_PROVISIONED`, `500 ERR_JOB_POOL_INTERNAL` |
| `GET /api/career/job-pools` | `200 {jobPools: summary[]}` ordered by poolId, version, uploadId | `503` |
| `GET /api/career/job-pools/{id}` | `200 JobPoolUploadView` | `404 ERR_JOB_POOL_NOT_FOUND`; `503` |
| `GET /api/career/job-pools/{id}/matches?analysisId=` | `200 JobPoolMatchPresentation` | `400 ERR_ANALYSIS_ID_REQUIRED`; `404 ERR_JOB_POOL_NOT_FOUND` / `ERR_ANALYSIS_NOT_FOUND`; `409 ERR_INACTIVE_COMPANY_POOL`; `503` |
| `GET /api/career/hr-decision-loop/contexts/{DCTXREV}` | `200` read model (families, bindings); without a disposable database the routes issue no DDL and missing tables read as region state `NOT_PROVISIONED` inside a `200` read model (never `503`) | `404 ERR_HR_DECISION_LOOP_API_NOT_FOUND`; `422 ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED`; `500 ERR_HR_DECISION_LOOP_API_INTERNAL` |
| `POST /api/career/hr-decision-loop/decisions` | `201 DCR_…` | `400 ERR_HR_DECISION_LOOP_API_INVALID_JSON`; `401 ERR_HR_DECISION_LOOP_API_UNAUTHENTICATED` (no principal headers); `403 ERR_HR_DECISION_LOOP_API_PRINCIPAL_MISMATCH`; `404 ERR_HR_DECISION_LOOP_API_NOT_FOUND`; `409 ERR_HR_DECISION_LOOP_API_CONFLICT` (immutable identity); `422 ERR_HR_DECISION_LOOP_API_REQUEST_REJECTED` carrying the gate code as detail (`DECLARANT_MISMATCH`, `SUBJECT_NOT_ADMISSIBLE`, …); `500 ERR_HR_DECISION_LOOP_API_INTERNAL` |
| `GET /api/career/hr-decision-loop/decisions/{DCR}` | `200` | `404 ERR_HR_DECISION_LOOP_API_NOT_FOUND`; `500` |
| `POST /api/career/canonical-sil/execute`, `GET …/{associationId}` | `201` / `200` | `404 ERR_CANONICAL_SIL_RUNTIME_ASSOCIATION_NOT_FOUND` (frozen runtime; smoke only) |
| `POST /api/decision-contexts`, `GET /api/decision-contexts/{revisionId}` | frozen API v1 (`docs/decision-runtime/LOCAL-DECISION-CONTEXT-API.md`) | boundary B1 (500 vs 422) |

## Appendix C. Boundary register (accepted; a matching deviation is BOUNDARY-MATCH, not a defect)

| Id | Statement | Source |
| --- | --- | --- |
| HIA-1 | No `PHASE4_VERIFIED` capability snapshot is produced at runtime; the Capability-Requirement Relation stays `NOT_EVALUATED` with reason `VERIFIED_CAPABILITY_SNAPSHOT_ABSENT` | `JOB_POOL_CONNECTION.md` §7 |
| HIA-2 | Whether a model may act as the Capability-Requirement provider is undecided | §7 |
| HIA-3 | Sweep proposals are never scored; coverage is unscored | §11/§12 |
| B-JP-CONTINUITY | A new pool version is a new upload with new canonical entities | §7 |
| B-JP-ACTOR | Uploader is self-declared (`x-condyn-principal-actor-id`), not authenticated | §7 |
| B-GEMINI / B-JP-MODEL / B-GEMINI-MODEL | Key from the operator's shell only; the default model cascade answers 404; legacy analysis names 1–7 capabilities per run of the same CV while the sweep is stable at 9–17 | `JOB_POOL_WORKFLOW_FRONTEND.md` §5, GELB 2026-10-11 |
| B-ENTRY | Job pool and HR routes answer `503` on a non-disposable database; no production path | §7 |
| B-ANALYZE-PAGE | `/career/analyze` always shows an error; it is not on the tested path (use `/career/demo`) | GELB 2026-10-11 |
| B-ORBIT-COPY | Orbit 02/04/05 subtitles are sealed by SIL language tests; relabelling needs an owner decision; orbit 05 is empty for real analyses | `JOB_FIELD_FRONTEND.md` §5 |
| B-JF-REC-ID | The legacy recommendation id `REC_<time>_<random>` is a G1 lifecycle format under the freeze; the planetarium exposes neither | `JOB_POOL_CONNECTION.md` §12.3 |
| B-COMPOSITE-SPLIT | A token-contained constituent stays weak evidence | GELB 2026-10-11 |
| B-JF-SESSION | A live sweep's analysis lives in the session; reloads need `analysisId` in the URL | `JOB_FIELD_FRONTEND.md` §5 |
| B-INGRESS | Post-decision chain families are seeded only; no HTTP ingress | `HR_DECISION_LOOP_MANUAL_TEST.md` §3 |
| B6 (8D5 vs D2) | Child DREV provenance conflict between the sealed 8D5 chain and D2 | `HR_DECISION_LOOP_VALIDATION.md` |
| B1 | Frozen decision-context API v1 answers 500 where 422 would be expected | `LOCAL-DECISION-CONTEXT-API.md` |
| F-JP-5 | Four G1 lifecycle suites are red on any fresh database (legacy DDL drift `career_policy_versions`) | `JOB_POOL_CONNECTION_VALIDATION.md` §3.5 |
| worker-recovery | `test/career-worker-recovery-pipeline.test.ts` assumes tables; red on fresh databases | GELB 2026-10-11 |
| load timeouts | COVFCR and decision-core suites time out at 5 s under load ≥ 3; green with `--testTimeout=60000` | §3.13.4 |
| DB-1/DB-2/DB-3, H1 | Findings in the shared `condyn` database and the prepared hardening SQL are owner items; never touched by tests | `DATABASE_SAFETY_AUDIT.md`, `docs/incidents/2026-10-09-shared-condyn-database.md` |
| legacy matching fields | `matching`/`recommendations` in `GET /api/career/analyses/{id}` use the hardcoded demo pool and are rendered nowhere | GELB 2026-10-11 |
| B-WORKTREE | Turbopack rejects a `node_modules` symlink; use a hardlink copy and `--webpack` | `JOB_POOL_WORKFLOW_FRONTEND.md` §5 |
| B-PEER-KILL | Several sessions run servers and workers on one machine; stop only your own PID tree | §5 |
| B-JF-MOTION-GEOMETRY | Breath is light only; geometry animation on clickable nodes is finite | `JOB_FIELD_FRONTEND.md` §8 |
| B-JF-REVEAL | Folded text stays in the DOM, hidden; text proofs keep binding | §8.2 |
| B-PLANETARIUM-MOTION | Pre-existing unguarded animations, keyframe name collisions, unreachable L1/L2 branches, dead `data-camera-scale`, non-functional drop zone: observed and reported, not reconstructed | GRÜN 2026-10-11 |
| B-LOCALE | Locale is page-wide, not URL-driven, not persisted; hard-coded English strings outside the SIL copy (zoom HUD, guide label, orbit state copy, cosmos node text) | GRÜN 2026-10-11 |
| B-A11Y-GAPS | The accessibility gaps listed in L-07 are pre-existing; reported, not scored as regressions | GRÜN 2026-10-11 |
| B-JP-REC, B-JP-CANDIDATES | "Recommendations" have no object in v1; the scored candidate set is the legacy analysis's capabilities (1–7 per run) | `JOB_POOL_WORKFLOW_FRONTEND.md` §5 |
| B-STATE-FILE | `.hr-loop-local/state.json` holds credentials; 600/700 since `e762972`; never attached | GELB 2026-10-11 |
| B-JF-GROUND-LINE | Bottom-anchored content inside the planetarium root sits below the page header by the header height; the ground line is lifted accordingly | `JOB_FIELD_FRONTEND.md` §9 |
| B-JF-FONTS | No web font is loaded; mono and sans resolve to the system monospace and `system-ui` | §9 |
| B-LENS-HIT | Captions are pointer-transparent; viewport-anchored lenses are children of the overlay root (01b1d7b) | `JOB_FIELD_FRONTEND.md` §12 |
| B-LENS-TRANSFORM | Entrance keyframes carry no transform; lens entrances are opacity-only | §12 |
| B-CAPABILITY-CHROME | The CAPABILITY ground-state chrome is unchanged and sealed; changes need an owner decision | §12 |
| B-POOL-INITIAL-FOCUS | An exact `jobPoolUploadId` without any `focus` opens the Pool Field; an explicit `focus` (JOB, POOL or CAPABILITY) always wins; every exit to the ground state writes `focus=CAPABILITY` when an upload is selected, so an exit survives a reload (1e5c2e3, rule completed in 627ec07) | `JOB_FIELD_FRONTEND.md` §10.1 |

## Appendix D. Contract documents to read (authoritative list, GELB 2026-10-11)

- `docs/architecture/decision-fields/JOB_POOL_CONNECTION.md` §2, §3, §4, §5, §8, §11, §12 (glossary, SG-1..6, F-JF table, §12.4)
- `docs/career_analysis/JOB_POOL_WORKFLOW_FRONTEND.md`, `JOB_POOL_WORKFLOW_MANUAL_TEST.md` (§3 path, §3b Job Field)
- `docs/career_analysis/JOB_FIELD_FRONTEND.md` §4 DOM contract, §5 boundaries, §8 semiontic layer (motion grammar, progressive disclosure, additive DOM contract), §9 information surfaces as field extensions (a3a4f04), §10 three field states and the Pool Field (1e5c2e3), §11 galaxy grammar (b64e2c9), §12 lens model (01b1d7b); `JOB_POOL_WORKFLOW_MANUAL_TEST.md` steps J8–J11, J10c, J10d, P1–P7, P6b, P6c
- `docs/architecture/decision-fields/JOB_POOL_CONNECTION_VALIDATION.md` (PINK proofs and findings)
- `docs/career_analysis/F10_F11_F12_RUNTIME_SIL_DECISION_CONTRACTS.md`; `docs/capability-core/ARCHITECTURE.md`, `ARTIFACT-CONTRACTS.md`, `INVARIANTS.md`
- `docs/architecture/decision-fields/HR_DECISION_LOOP_INTEGRATION.md`; `docs/career_analysis/HR_DECISION_LOOP_MANUAL_TEST.md`, `HR_DECISION_LOOP_FRONTEND_INTEGRATION.md`; `docs/decision-runtime/LOCAL-DECISION-CONTEXT-API.md`
- `docs/architecture/decision-fields/DATABASE_SAFETY_ARCHITECTURE.md`, `DATABASE_SAFETY_AUDIT.md`; `docs/incidents/2026-10-09-shared-condyn-database.md`
- `docs/SYNTX_SEMANTIC_INTERFACE_LANGUAGE_v1.0.md` (semiontic intent: §4 space, §7 motion, §8 interaction)
- Code for the analyze/jobs/analyses routes: `app/api/career/analyze/route.ts`, `app/api/career/jobs/[jobId]/route.ts`, `app/api/career/analyses/[analysisId]/route.ts`

## Appendix E. Test data (synthetic only)

| File | Facts |
| --- | --- |
| `docs/examples/cv.synthetic.pdf` | two pages, "Alex Example — Curriculum Vitae", synthetic profile; expected sweep 9–17 proposals |
| `docs/examples/job-pool.sample.json` | `pool_condyn_sample_tech_v1` "CONDYN Sample Tech Job Pool" ACTIVE; 3 organisations, 6 roles (`role_fullstack`, `role_frontend_lead`, `role_platform`, `role_architect`, `role_ml`, `role_data`), 28 requirements; upload id observed `JPOOL_30F7145E21F34BEF0FCE510DFC75837B` |
| `test/job-pool-validation/fixtures/pool.ts` (`validationPool`) | PINK pool: 2 organisations, 3 roles incl. one without requirements, 6 requirements covering EXACT/ALIAS/weak/composite/missing; upload id observed `JPOOL_6CA8892F9AD0F6AC316F8FC3F6294BB7` |
| DRAFT variant | copy of either pool with `"status": "DRAFT"` (same `pool.id`) → upload 201, matches 409 |
| invalid variants | `{ not json`, `{"pool":{"id":"X"}}`, role → unknown organisation, 1.1 MiB description |

## Appendix F. Playwright skeleton for the agent (reference, not part of the repository's suites)

```ts
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, recordVideo: { dir: "acceptance-evidence/AT-…/video", size: { width: 1600, height: 1000 } }, reducedMotion: "no-preference" });
const page = await context.newPage();
page.on("pageerror", e => errors.push(String(e)));
await page.goto(`http://127.0.0.1:${port}/career/demo`, { waitUntil: "domcontentloaded" });
await page.getByTestId("guided-onboarding-overlay").waitFor();            // opens after first content render
await page.getByTestId("onboarding-close-btn").click();
await page.getByTestId("add-pdf-source-btn").click();
await page.getByTestId("source-dock-file-input").setInputFiles("docs/examples/cv.synthetic.pdf");
await page.getByTestId("start-intake-analysis-btn").click();
await page.getByTestId("intake-success-banner").waitFor({ timeout: 480_000 });
await page.getByTestId("job-pool-panel-toggle").click();
await page.getByTestId("job-pool-file-input").setInputFiles("docs/examples/job-pool.sample.json");
await page.getByTestId("job-pool-upload-btn").click();
const id = await page.locator('[data-testid="job-pool-upload-result"][data-upload-outcome="CREATED"]').getAttribute("data-upload-id");
await page.getByTestId(`job-pool-select-${id}`).click();
await page.locator('[data-testid="job-pool-matches"][data-matches-state="AVAILABLE"]').waitFor();
await page.getByTestId("field-focus-job-btn").click();
await page.locator('[data-testid="job-field"][data-field-state="AVAILABLE"]').waitFor();
await page.screenshot({ path: "acceptance-evidence/AT-…/E-01.png" });
```

The repository's own reference implementations of these walks: `test/career/job-pool/e2e/job-pool-workflow.e2e.test.ts` (GRÜN), `test/job-pool-validation/browser-walk.e2e.test.ts`, `job-field.e2e.test.ts`, `live-browser-workflow.e2e.test.ts` (PINK).

## Appendix G. Plan maintenance

- A new application tip requires: diff of `app/`, `lib/`, `scripts/`, contracts against the tip named in the header; update §2, Appendix A (regenerate), Appendix B/C; bump the version; record the delta in the change log.
- 1.1.0 bound `0353cd9`; 1.1.2 binds `093b9e6`; 1.2.0 added GRÜN's Pool Field `1e5c2e3`; 1.2.1 binds GELB's integration tip `d17b042`; 1.2.2 added GRÜN's `627ec07`; 1.2.3 binds GELB's integration tip `142df0f`; 1.2.4 added GRÜN's galaxy grammar `b64e2c9`; 1.2.5 bound `ee4c4dc`; 1.3.0 binds `01b1d7b` (lens model).
- Owner decisions on HIA-1/2/3 or B-ORBIT-COPY change expected outcomes in TS-E, TS-F, TS-O and must be reflected before execution.
