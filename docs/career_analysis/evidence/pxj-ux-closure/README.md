# PxJ · recursive UX/UI & system closure — GRÜN evidence (frontend/pxj-ux-closure)

Owner mandate „SYNTX::SFE::OWNER_GO — RECURSIVE UX/UI & SYSTEM CLOSURE“, GELB assignment on 70d1cb4 (421e382 + B-3), inventory
`docs/career_analysis/CONDYN_UX_SYSTEM_CLOSURE_2026-10-23.md` (8f2efd7), PINK pre-sweep §3.61 (V-01 … V-15), GELB V-16 / V-17.
Frontend only: no backend, API or DB file, no new storage, no Gemini. Final state **4b826cc**.

Evidence class here: **STAND_IN** only — GRÜN's own disposable lab (production build `next start`, the real worker, GRÜN's
deterministic loopback Gemini stand-in, network sentinel). Every screenshot carries „STAND-IN · keine Modellausführung“. GELB
checks the same state on the real persisted result separately.

## 1 Commits (one per DEFECT_ID, each with a regression test that fails on 421e382)

| DEFECT_ID | Commit | What changed |
|---|---|---|
| O-NAV-SUBMIT | 0f8d74e, f4d2688 | A 202 arriving after the remount is handed over (page-session module instance, job id only, taken once) to the field mounted then: replace into the entry on view, GET only, one POST |
| UX-04 = V-04 | 2d97c01 | Closed Capability Field: cause and way as visible text below the capsule, `aria-describedby` on the closed controls |
| UX-05 D-PICK | 08df393 | Existing investigations of the selected role: GET list + GET boundary, newest 25, ≤ 4 parallel, read on opening, exact mode and job, chosen only by OPEN (one push) |
| UX-03 | 6c36644 | NO_ANALYSIS names both ways: (a) an existing investigation (D-PICK, right there), (b) a source and ANALYZE |
| O-PXJ-720 = V-01 … V-03 | 6a12b59, ee9831b, 0fe6081, 4b826cc | Viewport tiers full / fit / stack (dashboard stylesheet): B2, source dock, inspector, shell and Job Field reachable at every viewport |
| V-16 | 2946224 | Zoom telemetry below the shell row (was clipped above the field at every viewport) |
| V-05 / V-06 | fe736ce | INVALID with its reason; RESULT_NOT_FOUND → D-PICK; a followed job's banner closes (one push, no retry, no POST); Job Field NO_ANALYSIS with a selected job |
| V-12 | 7daffdd | Mode group: manual activation (arrow = focus, Enter / Space = choice) |
| UX-02 = V-11 | 688bdd7 | SELECT AS JOB right after the path; pool / organisation say where the job is chosen; legacy box collapsible |
| UX-01 | d24aeb2 | „LEVEL · POOL / ORGANIZATION / ROLE / REQUIREMENT“ in the Job Field panel |
| UX-07 | 44f9eed | uploaded · opened · selected: one word each (EN / DE) |
| UX-06 = V-07 | 2a59d23 | The start leads with the uploaded pools; an empty list points to + INTAKE and opens it |
| F-G1-MD = V-08 | d8d97b8 | .md / .markdown / .txt staged as text, other files refused; no RETRY for ERR_PDF_PARSE_FAILURE |
| V-14 | 0a5da26 | Job Field panel actions ≥ 24 px high (26 px) |
| V-13 | f59bab0 | Visible hover on SELECT AS JOB and the pool list (look only) |
| V-09 | 73e797a | Type floors: 10 px for spaced labels in the field's signs, 10.5–11 px controls and meta, 11 px in the B2 panel and the job indicator |
| V-10 | 5d93985 | Telemetry inactive levels and separators reach AA |

## 2 Verification (measures/)

- `suite-and-build.txt`: tsc 0 errors; `next build --webpack` without `typescript.ignoreBuildErrors` exit 0; focused group 57 files,
  498 passed (4 skipped, pre-existing).
- `counterproof-421e382.txt`: the 15 new test files against 421e382 — 43 of 60 fail, **every REPRODUCE at its own assertion**;
  2 files fail at their import (new modules); the 17 inverse / guard tests pass. The two inverse tests of `recovery-ways.test.tsx`
  depend on 2d97c01 / 6c36644 and are proven against the parent 2946224 (commit fe736ce).
- `STANDIN-ux-walk.json` (+ `STANDIN-ux-requests.json`, every API request by method and path): **19 / 19**, no request other than
  GET outside the two ANALYZE steps (00, B1):
  - 00 an existing PERSON × JOB analysis is made once by ANALYZE;
  - A1 … A5 **without upload and without ANALYZE**: bare start → uploaded pools first → open pool → organisation → role (level
    named, hint, opened role) → SELECT AS JOB after 4 Tab presses → D-PICK reads the list once on opening, offers exactly the
    analysis of this upload and role, chooses nothing by opening, OPEN is one entry (analysisId + focus=CAPABILITY) and shows B2
    AVAILABLE; Back is the role view without analysisId; 0 non-GET;
  - B1 Back right after ANALYZE: (a) POST held 1.5 s by the browser — the job is handed over, named in the entry on view, followed
    by GET, one POST; (b) without latency — named in the entry of ANALYZE; never unnamed;
  - C1 an unknown job from the URL: NOT_FOUND, no RETRY, CLOSE = one push without analysisJobId, Back names it again;
  - D1 `.md` via the file input staged as text, `.docx` refused;
  - E1 gate reason with `aria-describedby`; arrows move the mode focus without URL or history change, Enter chooses;
  - F six viewports (1920×1080, 1600×900, 1440×900, 1280×720, 200 % = 960×540 at dsf 2, 200 % of 1280×720 = 640×360): B2 head,
    binding and counts in view at once (counts at y 479 / 418 / 418 / 418 / 320 / 320), every row reached by the mouse wheel as a
    user scrolls, no horizontal page scroll, ENTER TEXT clicked for real on the no-analysis screen.
- `STANDIN-ux-keyboard.json` (PINK's held items as regression): 600 Tab presses — no URL or history change, no focus on a hidden
  element; Shift+Tab the exact reverse; Esc chain ROLE → ORGANIZATION → FIELD.
- `STANDIN-layout-4b826cc.json` against `STANDIN-layout-6c36644-before.json` (6c36644 = 421e382's layout): every visible control at
  five points by `elementFromPoint`; off-viewport controls are scrolled into view only through what a user can scroll (overflow
  auto/scroll, the page) and checked again. At 4b826cc the Capability Field, B2 and PERSON have **no covered control at any of the
  six viewports**. Remaining (both already on 421e382, all viewports): the receded anchor of the observed role behind the role core
  (V-17, decoration, observation) and one requirement card at the stage edge at 1280×720 (4 of 5 points).
- `STANDIN-pools-open.txt`: at a role the uploaded pools open beside the panel (1280 / 1440 / 1600) or below it (1920), in view,
  OPEN clicked for real.

## 3 PERSON: visual change without markup change (GELB decision)

T-07 (the PERSON first screen's server markup byte-identical with 49e2bc6) holds. Everything that also shows under PERSON changes
only through the dashboard's stylesheet (`app/components/career/demo/career-demo-layout.ts`, `CAREER_DEMO_LAYOUT_CSS`): size,
position, contrast and spacing — no text, element, order or state.

- every viewport: `[field] > [data-testid="semantic-zoom-telemetry"]` (top 67 px, no width cap; V-16; its buttons 11 px; inactive
  levels and separators AA, V-10); `[data-testid="job-scope-indicator"] [data-testid="job-scope-detail"]` and `… > span:nth-child(2)`
  (11 px, V-09).
- fit tier (≥ 1100 × 600, below 1600 × 1000): `[data-testid="career-intelligence-dashboard"]` (viewport height, column),
  `[field]` (no 960 px minimum), the planetarium `div:has(> svg[data-testid="resonance-energy-paths"])` (scale / translate into the
  free area), the source dock `div:has([data-testid="source-dock"])` (below the shell, above the inspector).
- stack tier (200 %): the shell (`[data-sx-shell="controls" | "guide" | "selector" | "job-scope" | "investigation"]`), the
  telemetry, the planetarium (zoom), the source dock and the inspector (`decision-graph-inspector-idle` / `decision-graph-inspector`)
  in one scrolling column; the header wraps.
- Before / after under PERSON: `shots/STANDIN-layout-6c36644-before-person-*.jpg` and `shots/STANDIN-layout-4b826cc-person-*.jpg`
  (six viewports each), `shots/STANDIN-ux-G-person-*.jpg`; the telemetry at 1920: `shots/STANDIN-V16-telemetry-*-1920.jpg`.
  At 1920 × 1080 the visible PERSON changes are the telemetry now shown below the shell, the job indicator at 11 px and the
  telemetry's contrast.

## 4 Existing test literal adjusted

`test/career/job-pool/syntx-field-ssr.test.tsx` checked the DE locale by the literal „KEIN JOB-POOL GEWÄHLT“; it expects
„KEIN JOB-POOL GEÖFFNET“ (UX-06 / UX-07 wording) — the same check, not loosened (2a59d23).

## 5 Open — for GELB / the owner

- **PERSON-HASH-REBASE** (GELB to the owner): `.markdown` in the file input's `accept` (the picker's filter) and an upload label
  naming md / txt. F-G1-MD is closed functionally: .md and .txt through the dialog, .markdown through „All files“, everything else
  refused, no retry after a parse failure.
- Role cards keep their owner-set sizes (footer 8.5 px, „ROLE CARDS — FOOTER READABILITY“; standing 7.5 px and the domain line in
  the card box the orbit's air is measured on, D-RO-1/2): raising them changes the orbit packing.
- V-10, receded role titles of other organisations (1.02:1): interactive by pointer, not focusable — decorative (aria-hidden) or
  readable (contrast) is a design decision; unchanged.
- D-PICK-PERSON: a place for the picker under PERSON (the PERSON first screen unchanged meanwhile).
- Reload during SUBMITTING: needs a server lookup (owner architecture decision), not implemented.

## 6 Files

`measures/` (above), `shots/` (walk steps, layout per scene and viewport before / after, telemetry crops), `scripts/`
(`pxj-ux-walk.mjs`, `layout-probe.mjs`, `kb-regression.mjs`, `pools-open.mjs`; argv: the lab's state file, the repo root, an
output directory; the lab launcher is GRÜN's scratch copy of the three-modes lab with `next start`).
