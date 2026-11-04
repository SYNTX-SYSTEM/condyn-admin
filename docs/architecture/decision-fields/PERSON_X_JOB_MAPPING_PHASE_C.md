# PERSON × JOB mapping field — phase C: the visible field on L0 / L1

Mandate `SFE::PHASE_C` (GELB, released by the owner, 2026-11-04), lane GRÜN. Phase C only: the PERSON × JOB mapping becomes visible as
a field on L0 (all pools around the person) and L1 (one pool). It is built on the released phase-B engine (`lib/career/mapping`: view,
layout, signs, delta, focus) and the phase-A specification (`PERSON_X_JOB_MAPPING_SPEC.md`, `mapping-spec/`); the engine is consumed,
not changed. Base: `origin/main` 5ca0f3f5. Branch: `frontend/mapping-phase-c`. No merge, no rollout, no model call.

State: **LOCAL_GREEN** (tests below). Not REVIEWED_FIELD (PINK validates independently), not PUBLISHED_FIELD, no human visual acceptance yet.

## 1. Field, relation, state, boundary (as found)

| | Found on 5ca0f3f5 |
|---|---|
| Ranking source | `useAutoMatch` / `useJobRanking` (`lib/career/ui/auto-match.ts`, GET only), read in `SemanticCareerIntelligenceField.tsx` for the PERSON result on view (`discoveryAnalysisId`) |
| Ranking surface | `AutoJobRankingPanel` (run state line, evidence class, authority, ranked list), in the role discovery's slot on the Capability Field, PERSON mode only |
| PERSON capabilities | `firstScreen.result.projection` (`CapabilityProposalProjection`), adapted by `capabilitiesOfProjection` (engine) |
| Field selector | `SyntxFieldSelector` — the two-button contract (`field-focus-strip`) is held by PINK's e2e tests |
| B2, first screen, Job Field, orbits, planetarium | untouched by the ranking slot |

## 2. Delta (minimal)

| File | Kind | What |
|---|---|---|
| `lib/career/view-model/mapping-field.ts` | new | Pure field model: `mappingFieldModel` composes view → layout → signs; `fieldFocusReduce` admits only `OPEN_POOL`, `UP`, `RESET`, `MARK_ROLE`, `CLEAR_SELECTION`; `fieldLevel`, `markedBody`, view boxes; `bodyMovements` over the engine's delta |
| `app/components/career/demo/PersonJobMappingField.tsx` | new | SVG field (L0/L1): rings, sectors, person constellation, bodies, run time sign, legend, overflow count, pool chips |
| `app/components/career/demo/mapping-field-copy.ts` | new | EN/DE copy |
| `test/career/mapping-field/*` | new | model, render, interaction, wiring and architecture tests |
| `app/components/career/demo/AutoJobRankingPanel.tsx` | **existing — entry** | optional prop `field?: React.ReactNode`, rendered after the authority line and above the ranked list while a ranking is shown. One line changed (the destructuring), three added. Without `field` the panel renders as before (tested byte-equal) |
| `app/components/career/demo/SemanticCareerIntelligenceField.tsx` | **existing — entry** | one import; the existing `<AutoJobRankingPanel …>` line is extended by `field={<PersonJobMappingField … />}` with the panel's own `jobRanking`, `autoMatch` and the result's projection. One line changed, three added |
| `test/career/mapping/architecture.test.ts` | **existing — test** | the phase-B rule "nothing outside the mapping imports it / the branch only touches lib/career/mapping" is narrowed for phase C: exactly the three phase-C files may import the engine (both import spellings are now caught), and the engine must stay unchanged against main |

## 3. Signs and rules as drawn

* **Angle = pool, distance = rank, size = requirement mass**: positions are the layout module's output 1:1 (tested against `layoutRoles`).
* **L0 shows the class only** (sign table, channel `class`): checked by the model (SEMANTIC tier) — solid line; name relation only — dotted;
  no relation (also a role without requirements) — open line. The line words come from `sign-table.json` through `couplingSign`. One paint for all
  classes: colour carries no state (tested).
* **Run time sign at field level** (`runSign`): only RUNNING breathes, and only while `rolesEvaluated < rolesPlanned`, and only bodies of class
  LEXICAL/NONE; STALLED is frozen with a still sentence (also with `resumePending`); one quiet edge pulse (6 s period) only for PARTIAL/FAILED
  while `resumePending`; under `prefers-reduced-motion` nothing moves and pending is a static dashed outline.
* **Movement on new evidence only**: a body moves (≤ 0.8 s, trail fading in 0.9 s) only when the delta names its own `ROLE_TIER_CHANGED` or
  `ROLE_FIT_CHANGED`; a re-read without change moves nothing.
* **Overflow**: bodies without room are counted, not drawn: "+n not drawn · in the list".
* **Authority and evidence class** stand with the field (B-6). No new figure (no percent, no fit number in the field); no claim words.
* **Focus = a look, never a choice** (B-3): L0 → L1 by pool chip, sector or a body on L0; ↑ / Escape back. Hover/focus marks a role (a
  highlight). There is no "select this job" (B-4 stays the Job Field's) and no job-scope prop.

## 4. Tests

See §6 (numbers of this run). Phase C suites: `test/career/mapping-field` (new), `test/career/mapping`, `test/career/mapping-spec`,
`test/career/auto-capability`. Architecture (`mapping-field/architecture.test.ts`): engine and spec byte-identical to main; orbits,
planetarium (`manifestation/`, `SyntxField`), field selector, B2 (`PxjFirstScreen`, `pxj-first-screen.ts`, `useRoleInvestigation`),
`lib/career/ui`, `lib/career/job-pool`, `lib/career/capability-core` and `app/api` unchanged; only the listed files changed; exactly one
removed line per product entry point; the new modules contain no fetch, POST, URL/history write, storage, job scope or model call.

## 5. Open assumptions (for GELB / PINK / owner)

1. **Placement.** B-1 names a MAPPING focus as a third field; spec §6 puts the change of the field selector's two-button contract into the
   navigation phase. Phase C therefore shows the field inside the automatic ranking's panel (PERSON mode, Capability Field) and leaves the
   selector unchanged. A full-stage MAPPING field is for the navigation phase.
2. **Size.** The panel is `min(400px, 29vw)` wide; L0 with many roles is a glance, L1 is the readable level. Human visual acceptance open.
3. **Time rule vs. pure layout.** The layout is a function of the whole ranking: a new or moved role can displace a body whose own evidence did not
   change. Such a body takes its new place without animation or trail (it does not "move" in the sign's sense). Whether that satisfies
   `timeMovement.rule` is for GELB/owner to confirm.
4. **Class of a role at L0.** SEMANTIC tier → SEMANTIC; LEXICAL_ONLY with a lexical requirement → LEXICAL; otherwise (only NONE, or no
   requirements) → NONE. The sign table defines lines per coupling state; the class line is the line of the class's full-strength state.
5. **Not in phase C:** L2/L3 (requirement ring, beams, coupling marks, evidence), capability selection / reverse view, the per-role pending mark,
   the PERSON × JOB degenerate field with the B2 portal.

## 6. Run

Isolated runner (`npm run test:isolated`, disposable database, least-privilege role `condyn_test_runner`), 2026-11-04, worktree
`condyn-admin-mapping-b`.

| Run | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint` on the new files and the panel | 0 problems |
| Phase C suites (`test/career/mapping-field`, `mapping`, `mapping-spec`, `auto-capability`) | 21 files, **187 / 187 passed**; new in `mapping-field`: 40 tests in 5 files (model 17, render 10, interaction 4, wiring 2, architecture 7) |
| Full suite | 516 files: 498 passed, 7 failed, 11 skipped · 3519 tests: **3460 passed, 27 failed, 32 skipped** |

The 27 failed tests are exactly the four known legacy suites (`career-lifecycle-concurrency-idempotency` 6, `-postgres-persistence` 6,
`-recovery` 5, `career-policy-activation-atomicity` 10; DDL drift F-JP-5) — no new failing test. The three further failed files fail in
`beforeAll` with all their tests skipped (12): `decision-integration/g2-g3-vertical-proof`, `decision-integration/hr-decision-loop-p7`,
`decision-runtime/e2e/local-decision-context-http`. Their Next server panics before any route compiles: `TurbopackInternalError: Symlink
[project]/node_modules is invalid, it points out of the filesystem root` — this worktree's `node_modules` is a symlink to
`../condyn-admin/node_modules`. Environment, independent of the phase C delta; not changed here (to be run where `node_modules` is inside the
project root, e.g. by PINK).
