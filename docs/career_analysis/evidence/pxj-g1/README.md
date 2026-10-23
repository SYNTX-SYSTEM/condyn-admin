# G1 · PERSON × JOB on the first screen — evidence

Owner GO "SYNTX::SFE::EXPLICIT_OWNER_GO" (Q1 = GO, 2026-10-22), forwarded by GELB and given to GRÜN directly.
- Specification and assignment: `CONDYN_PXJ_G1_FIRST_SCREEN_SPECIFICATION_2026-10-22.md` and
  `CONDYN_PXJ_G1_GRUEN_ASSIGNMENT_2026-10-22.md` on `docs/pxj-e2e-validation` (`15332a5`). The assignment is authoritative.
- Branch `frontend/pxj-first-screen-g1` from `49e2bc6`. Isolated: no merge, no deployment, no backend change, no new route.
- **No real model execution.** No Gemini call was made. Every browser record below ran against GRÜN's deterministic loopback
  **STAND-IN** (`docs/career_analysis/evidence/job-pool/three-modes/scripts/gemini-standin.ts`) in GRÜN's own lab with a
  disposable database. Lab :41862 and the shared database were not touched. Stage 2 (real Gemini) needs its own owner GO.

## 1 · What was built (assignment §02–§07)

| file | role |
|---|---|
| `lib/career/view-model/pxj-first-screen.ts` (new) | `decodeAnalysisResult` (§03.2), `projectPxjFirstScreen` (§04, closed union), `lineageFailure` (§05 L-1 … L-4), `firstScreenCoverageRequest` (P-01), `demoStateFromResult` (the existing adapters, unchanged), `withoutLegacyOrbits` (Q1). Pure: no fetch, no React. |
| `lib/career/ui/useAnalysisResult.ts` (new) | reload read of `GET /api/career/analyses/{id}` (GET, `no-store`), bound to the `analysisId`: a change discards, aborts, ignores a late answer. |
| `app/components/career/demo/PxjFirstScreen.tsx` (new) | `pxj-first-screen` with `pxj-first-state` in every state; in AVAILABLE `pxj-first-coverage`, `pxj-first-coverage-boundary`, `pxj-first-req-*`, `pxj-first-quote-*`; `pxj-analysis-job-offer` in the Job Field. |
| `SemanticCareerIntelligenceField.tsx` | the chain wired in: session result decoded, reload read, boundary, B2 only on the Capability Field for the analysis's own job; orbits 03–06 not rendered under PERSON × JOB; URL `analysisId` + `investigationMode` written on SUCCEEDED (§03.1). |
| `SyntxField.tsx` | only `syntx-legacy-disclosure` at the role level under PERSON × JOB (§06.2). |
| `orbit-focus-projection.ts` | `presentSourcePlaceholders`: the legacy adapter's `HASH-…` and "Unknown Document" are named as "hash / title not delivered", in every mode (§07). |
| `sil-language.ts` | texts only, EN and DE (`pxjFirst`, `syntx.legacyDisclosure`). |
| `OrbitalResonanceBubble.tsx` | only the optional prop `hideViewMatches` (D-G1-1). |

**Closed states:** `NO_ANALYSIS`, `RESULT_LOADING`, `RESULT_NOT_FOUND`, `RESULT_FAILED`, `BOUNDARY_RESOLVING`,
`BOUNDARY_UNRESOLVED`, `BOUNDARY_NOT_FOUND`, `BOUNDARY_FAILED`, `MODE_MISMATCH`, `ROLE_MISMATCH`, `NO_PROJECTION`, nine
`COVERAGE_*`, `LINEAGE_MISMATCH`, `AVAILABLE`, and `PERSON_RESULT` (a PERSON analysis under PERSON: today's screen, see §4).

## 2 · Tests (OBSERVED, `npm run test:isolated`)

| test | file | result |
|---|---|---|
| T-01 decoder: the contract body accepted; each of 13 rejections alone, with its code | `test/career/pxj-first-screen/projection.test.ts` | green |
| T-02 one way: the same body from the session and from a reload read → deep-equal view model and first screen | same | green |
| T-03 every §04 state from fetcher stubs over the real read functions, SSR with testid and statement, EN and DE; spy: GET `no-store` only, no `/matches`, no `gemini-*` | `first-screen-ssr.test.tsx` | green |
| T-04 bindings: ROLE_MISMATCH (other job, no job) without proposals or coverage and without a B2 read; MODE_MISMATCH switches nothing; late result invisible; hook: abort, late answer dropped, re-read | `projection.test.ts`, `result-hook.test.ts` | green |
| T-05 L-1 … L-4 each violated alone → LINEAGE_MISMATCH naming it | `projection.test.ts` | green |
| T-06 quote join: byte-identical verified; one byte, whitespace, double space, Unicode form (NFC/NFD) not; unknown proposal id "proposal not in this projection"; unresolved source | `projection.test.ts` | green |
| T-07 PERSON × JOB: no shell, ray, coupling, inspector node or text of 03–06, `hideViewMatches` passed; PERSON: six orbits; the PERSON markup **byte-identical with `49e2bc6`** in seven variants (SHA-256) | `first-screen-ssr.test.tsx`, `person-markup.test.tsx` | green |
| T-08 no forbidden word outside quotes and the mandated statements, EN and DE; numbers on the first screen only B2's counts | `first-screen-ssr.test.tsx` | green |
| T-09 URL: SUCCEEDED writes `analysisId` + `investigationMode`; focus and hover change nothing | browser walk 1c (steps 01, 02) | green |
| T-10 neither `HASH-` nor "Unknown Document" rendered, PERSON × JOB and PERSON, L0 and orbit 01 focus | `first-screen-ssr.test.tsx` | green |
| T-11 role level: every testid and `data-*` of `syntx-requirement-*`, `syntx-trace-*`, `syntx-open-*`, `syntx-source-*` equal to `49e2bc6` (fixture rendered on `49e2bc6`); new only `syntx-legacy-disclosure` with its text | `first-screen-ssr.test.tsx` | green |
| D-G1-1 the open HUD renders VIEW MATCHES without the prop exactly as before, not at all with it | `first-screen-ssr.test.tsx` | green |
| T-12 `tsc`: only the base's `relay-check.mts(13,214)`. The whole isolated suite in a clean checkout: the same 27 failures as `49e2bc6` (7 files: lifecycle, policy activation, decision integration / runtime e2e), nothing else (`measures/suite.txt`). | | green against the base |

The new tests are 71/71. With the six adapted files and the field's SSR group: 253/253 (`measures/suite.txt`).

## 3 · Walk 1c (OBSERVED, STAND-IN, `measures/STANDIN-walk-*.json`, `shots/STANDIN-*.jpg`)

GRÜN's lab: the real server and the real worker, Gemini = the loopback STAND-IN, a disposable database, PINK's validation pool.
The source is the synthetic gold case `test/gold/case_001_minimal_valid/input/doc1.md`, entered as text. Every record carries
`"gemini": "STAND_IN"`; every shot carries "STAND-IN · keine Modellausführung".

| step | expected | 1920 | 1280 |
|---|---|---|---|
| 01 ANALYZE under PERSON × JOB with the selected job | first screen with coverage | AVAILABLE | AVAILABLE |
| 02 hover and focus on a proposal and a requirement | URL unchanged | unchanged | unchanged |
| 03 another role selected in the Job Field, back to Capability (in session) | ROLE_MISMATCH | ROLE_MISMATCH | ROLE_MISMATCH |
| 04 "SELECT THIS ROLE" | AVAILABLE | AVAILABLE | AVAILABLE |
| 05 reload | the same as 01 | AVAILABLE, equal | AVAILABLE, equal |
| 05b DE | the same in German | AVAILABLE | AVAILABLE |
| 06 reload with another selected job | ROLE_MISMATCH | ROLE_MISMATCH | ROLE_MISMATCH |
| 07 the PERSON × JOB analysis under PERSON | MODE_MISMATCH | MODE_MISMATCH | MODE_MISMATCH |
| 08 ANALYZE under PERSON | today's screen | six orbits | six orbits |
| 09 PERSON deep link without `investigationMode` | MODE_MISMATCH | MODE_MISMATCH | MODE_MISMATCH |
| 10 unknown `analysisId` | RESULT_NOT_FOUND | RESULT_NOT_FOUND | RESULT_NOT_FOUND |
| 11 Job Field, no job selected | the analysis's job offered | offered | offered |

Network (both widths): the only non-GET requests are the two ANALYZE posts; no `gemini-result` or `gemini-exchanges`; B2 only for the
analysis's own job. `/matches` is read only while the Job Field is the active field (D-G1-3).

**Layout** (`measures/STANDIN-layout.json`, `shots/STANDIN-layout-available-*.jpg`): at 1920 × 1080, 1600 × 900, 1440 × 900 and
1280 × 720 the panel covers neither orbit 01, orbit 02, the core nor the shell controls. Below 1600 px it starts under orbit 02.

## 4 · Deviations and decisions (with wording)

- **D-G1-1** (owner, directly to GRÜN): "Ja, nur diese Prop". `OrbitalResonanceBubble.tsx` is outside §08; it gains only the optional
  `hideViewMatches`. Without it the markup is unchanged.
- **D-G1-2** (owner, directly to GRÜN): "Ja, minimal anpassen". Q1 hides 03–06 in the default mode. Six existing GRÜN tests render
  their six-orbit field explicitly under PERSON (`career-demo-ui`, `career-f12-pulse-alignment`, `career-sil-empty-orbit-visual-attention`,
  `career-sil-global-language-wiring`, `hr-decision-loop/dock-ssr`); `job-pool/syntx-field-ssr` expects 01/02 and no 03–06 in the
  default mode (one presence loop became a presence and an absence loop). No assertion removed.
  - Addendum (owner, directly to GRÜN): "Ja, genauso anpassen". The whole suite found two more with the same cause:
    `career-demo-e2e` step 5 renders under PERSON; `hr-decision-loop/e2e/hr-decision-loop-frontend.e2e` loads `/career/demo` with
    `investigationMode=PERSON` in its SSR fetch and two pages (`40cd810`).
- **K-G1-1** (GELB): evidence and this report under `docs/` are not a file-list deviation.
- **D-G1-3** (GRÜN, for review): the Job Field's legacy comparison (`/matches`) was read at the field level also while the Capability
  Field was active. It is now read only while the Job Field is the active field (A-02, PA-04). The Job Field reads it when it
  becomes active; during the gate's CHECKING moment after a job change the Job Field is briefly active, and one read happens there.
- **Decisions inside the assignment:**
  - `PERSON_RESULT` names a PERSON analysis under PERSON (today's screen, no panel).
  - `ROLE_MISMATCH` also covers "no job selected" (`selection: null`, its own sentence).
  - MODE_MISMATCH and BOUNDARY_* show no proposals of the analysis.
  - Both ways pass the adapters no staged documents: the route delivers no source manifest, so titles and document ids come
    from the persisted documents (§07). For this route the session's output is the same as before.
  - A result about another analysis than the one on view is treated as not yet arrived (RESULT_LOADING), never shown.

- **PINK D-G1-P1 (fixed after §3.56):** in NO_PROJECTION under PERSON × JOB the legacy adapter's capabilities stood in orbit 02
  (count, names, `evidenceConfidence` as a percentage). `withoutLegacyOrbits` now keeps only the projection's proposals, so without a
  projection orbit 02 is empty. A test with legacy capabilities in the analysis checks L0, zoom 1 and zoom 2 under PERSON × JOB
  and the unchanged PERSON field. It fails on `50776fc` and passes with the fix: G1 tests 74/74, with the adapted files and the
  field's SSR group 263/263. The legacy fixture of the earlier tests had no capabilities, so it could not see this path.

- **Owner "RECURSIVE_ROLE_FIELD_CLOSURE"** (GELB `CONDYN_ROLE_FIELD_CLOSURE_2026-10-22.md` §5, `c02d756`). All three candidates
  reproduced on `a9ff0ca`. Each fix is its own commit.
  - **F-RF-1** (`575e225`): after SUCCEEDED the URL now carries the interface's mode, not the mode the run was declared with.
    Before, a mode chosen during the run was overwritten, so the session showed MODE_MISMATCH and a reload AVAILABLE. Nothing
    switches by itself.
  - **F-RF-2** (`0dd55e5`): the analysis on view follows the URL's current analysis, kept as state, not the mount's. During a new
    run or after it FAILED, the session, the URL and a reload show the last SUCCEEDED analysis.
  - **F-RF-3** (`25e90bf`): a selected job that is CHECKING gives `JOB_CHECKING` (no offer). An INVALID one gives `JOB_INVALID`,
    which names the job and the validation's reason and is never "no job selected". ROLE_MISMATCH is unchanged for a real other job
    or no job.
  - **F-RF-5** (`46a95bb`, confirmed by PINK §3.58): two roles with the same title in one organization had identical shell texts.
    The detail of a VALID job now ends with the role id, also under PERSON ("kept"). Selection by id, texts and testids are
    unchanged. Test: `shell-role-identity.test.tsx`; REPRODUCE fails before the fix.
  - **Tests:** `test/career/pxj-first-screen/role-field-closure.test.tsx`. Against the code of `a9ff0ca` the 6 finding tests fail
    and the 4 inverse tests pass; on the tip all pass.
  - **Harness, and what it proves:** the harness calls the field component itself over several renders. `react`'s hooks are a
    minimal runtime, `history.replaceState` is a stub, the read hooks are steered, and a reload is a fresh mount with the URL's
    parameters. This proves the field's own state logic across renders. It does not prove React's real scheduling, the children's
    rendering or a browser reload; those are for PINK's browser check.

- **Owner "OWNER_GO_FULL_PXJ_CLOSURE" §05, navigation and recovery** (GELB assignment N-1 … N-5 on `88539d3`). One commit per
  finding; each REPRODUCE test fails on `88539d3` (`nav-counterproof-88539d3.txt`: 32 of 41 new tests fail there, all 20
  REPRODUCE among them, each at its own assertion; the 9 passing are inverse and guard tests).
  - **N-1 B-NAV** (`dea34eb`): every decision the user takes that the URL carries is one history entry (push). That covers mode,
    field, pool, observation, a job chosen, removed or opened, and the offer's role. Several parameters of one action share their
    entry, and an unchanged URL writes nothing. The system's addenda replace the entry on view.
    `CareerDemoHistory` listens to popstate and remounts the dashboard from the entry's URL through the parser `page.tsx` uses
    (`careerDemoPropsFromSearchParams`), so NAV ≡ RELOAD. A repeated parameter is ambiguous and read as absent on both paths.
    What the URL does not carry is reset as on a reload: language, orbit and zoom, staged sources. The released
    `CareerJobController` neither polls nor takes a late answer.
  - **N-2 B-RUN** (`ee91062`): on the 202 the job id is replaced into the URL (`analysisJobId`). A mount with it follows the job by
    GET only (`resumeJob`). SUCCEEDED writes `analysisId` and removes `analysisJobId` in one replace. FAILED and 404 ("analysis job
    not found", its own state) show the job id and keep the parameter. There is no retry button and no POST. A value outside
    `JOB_<ms>_<n>`, or a repeated one, is removed.
  - **N-3 O-RF-1** (`e6d9ba2`): an `investigationMode` that is no mode (unknown, empty or repeated) is removed on mount by a
    replace. The result is the same default as without it.
  - **N-4 F-RF-4** (`1dcc273`): the `analysisId` comment says that G1 loads the analysis for the first screen. The comment moved
    from `page.tsx` to `lib/career/ui/career-demo-url.ts` with N-1, and the field's prop comment had the same error.
  - **N-5 B-SRC** (`2f96e63`): with STAGED SOURCES the dock says, fixed in EN and DE, that staged sources live in this page only and
    that nothing is stored. Nothing is persisted, also not in browser storage.
  - **Copy:** `app/components/career/demo/navigation-copy.ts`, beside the components. The assignment's file boundary leaves
    `sil-language.ts` unchanged.
  - **Tests** (`test/career/pxj-first-screen/`):
    - `navigation`, `nav-reads`, `job-release` (N-1);
    - `run-recovery` (N-2);
    - `mode-normalization` (N-3);
    - `analysis-id-comment` (N-4);
    - `staged-sources-hint` (N-5);
    - the shared hook runtime `harness.ts`, the same model as `role-field-closure` with unmount and `useSyncExternalStore`.
  - **GELB's three points:**
    - (1) the old controller is released, and the new one follows the job only by `analysisJobId`, with one GET poll, one POST in
      all and one job (`job-release`, `run-recovery`);
    - (2) the remount reads the same GETs as a reload, with no write and no `/api/career/analyze` (`nav-reads`);
    - (3) one parser, compared for the same URL on both paths (`navigation`).
  - **Walk on the production server** (`next build` + `next start`, stand-in lab :41871, `scripts/pxj-nav-walk.mjs`,
    `measures/STANDIN-nav-walk-1920.json`, `shots/STANDIN-nav-*`): 33/33 steps pass.
    - Eight decisions push eight entries. Each of the 8 Back and 8 Forward steps equals a fresh load of its URL in a second tab
      (first-screen state, text, rows, quotes, offer, field, mode).
    - Back leaves the demo for the document before it, and Forward loads the demo document again (AVAILABLE, equal to reload).
    - The navigation steps send only GETs, with no analyze and no inspector read.
    - A second run, reloaded while it ran, is followed by its job id. Meanwhile the first analysis stays on view; afterwards the
      second one shows. There are 2 POSTs in all, one per run.
    - An unknown job id gives NOT_FOUND, a malformed one is removed, an unknown mode is removed, and the hint stands with staged
      sources and is gone after a reload.
    - `ignoreBuildErrors` was set for the build in the measuring worktree only and never committed (route type error, owner
      decision B-3).

## 5 · Findings outside G1 (not changed)

- **F-G1-MD:** a `.md` or `.txt` file through the Source Dock's file input is sent as `type: "pdf"`; the worker answers
  `ERR_PDF_PARSE_FAILURE` and retries. Pre-existing (`SourceDock.tsx`). The walk enters the text instead.
- **Base suite:** the whole isolated suite on `49e2bc6` already fails 27 tests in 7 files (lifecycle, policy activation, decision
  integration / runtime e2e); see `measures/suite.txt`.
- At 1280 × 720 the field is taller than the viewport (min-height 960, pre-existing); the panel scrolls inside.

## 6 · Files

- `shots/`: `STANDIN-<step>-<width>.jpg` (walk), `STANDIN-layout-available-<viewport>.jpg`.
- `measures/`: `STANDIN-walk-1920.json`, `STANDIN-walk-1280.json`, `STANDIN-layout.json`, `suite.txt`, `STANDIN-nav-walk-1920.json`
  (N-1 … N-5, production server).
- `nav-counterproof-88539d3.txt`: the new tests of N-1 … N-5 run against `88539d3`.
- `scripts/`: `pxj-walk.mjs`, `pxj-layout.mjs`, `pxj-nav-walk.mjs` (argv: lab state file, repo root / analysis id, out dir; Playwright from
  `CONDYN_PLAYWRIGHT_MODULE`), `role-level-base.test.tsx.txt` and `person-markup-base.test.tsx.txt` (run once on `49e2bc6` to produce the T-11 and T-07 fixtures; never part of the suite).
