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

## 3 PERSON (corrected in round 2, GELB K-UX-2)

The first version of this section said that under PERSON no text, element, order or state changes. That holds for the **PERSON
first screen** (the Capability Field under PERSON) only — not for the Job Field shown under investigationMode=PERSON (PINK §3.62
K-UX-2). Two lists:

**PERSON first screen — visual only, plus the attribute `data-sx-layout`.** T-07 (its server markup byte-identical with 49e2bc6)
holds. Everything that shows there changes only through the dashboard's stylesheet (`app/components/career/demo/career-demo-layout.ts`,
`CAREER_DEMO_LAYOUT_CSS`) — size, position, contrast, spacing — and the dashboard wrapper carries `data-sx-layout` (the tier):
- every viewport: `[field] > [data-testid="semantic-zoom-telemetry"]` (top 67 px, no width cap; V-16; its buttons 11 px; inactive
  levels and separators AA, V-10); `[data-testid="job-scope-indicator"] [data-testid="job-scope-detail"]` and `… > span:nth-child(2)`
  (11 px, V-09).
- fit tier (≥ 1100 × 600, below 1600 × 1000), **only while the Capability Field is active** (round 2, V-18 / V-19):
  `[data-testid="career-intelligence-dashboard"]` (viewport height, column), `[field][data-field-focus="CAPABILITY"]` (no 960 px
  minimum), the planetarium `div:has(> svg[data-testid="resonance-energy-paths"])` (scale / translate into the free area), the
  source dock `div:has([data-testid="source-dock"])` (below the shell, above the inspector).
- stack tier (200 %): the shell (`[data-sx-shell="controls" | "guide" | "selector" | "job-scope" | "investigation"]`), the
  telemetry, the planetarium (zoom), the source dock, the inspector (`decision-graph-inspector-idle` / `decision-graph-inspector`)
  and the runtime telemetry box in one scrolling column; the header wraps.
- Before / after under PERSON: `shots/STANDIN-layout-6c36644-before-person-*.jpg` and `shots/STANDIN-layout-4b826cc-person-*.jpg`,
  `shots/STANDIN-ux-G-person-*.jpg`; the telemetry at 1920: `shots/STANDIN-V16-telemetry-*-1920.jpg`.

**Job Field (every mode, PERSON included) — the assigned UX changes.** UX-01 (level line), UX-02 (job action after the path, hint
at pool / organisation, collapsible legacy box), UX-06 (pools first, empty list → + INTAKE), UX-07 (UPLOADED / OPEN · OPENED /
SELECTED wording), UX-03 (NO ANALYSIS names both ways), V-09 / V-13 / V-14 / V-15 (type, hover, targets, full names), and the
fit-tier panel scroll with the pools beside it (4b826cc). Round 2: the panel stands after the stage again (V-11-R) and the Job
Field keeps 70d1cb4's size (V-18 / V-19) — role cards with their domain line in every mode.

## 3a Round 2 — PINK §3.62 on 41dfa25 (final state 9a8a28e)

| DEFECT_ID | Commit | What changed |
|---|---|---|
| V-11-R | 984b0ed | The Job Field panel stands after the stage again (688bdd7 had put it first: after Enter on a role card Tab ran through shell and header, 14 → 21). UX-02's order inside the panel stays |
| V-18, V-19 | d91ecb0, 99d4d44 | The fit tier makes the page the viewport only while the Capability Field is active; the Job Field keeps 70d1cb4's size (role orbits laid out on it: domain line kept, cards beside the panel clickable); stack stage 960 px; the panel is shorter at the organisation level (shorter NO ANALYSIS, both ways still named) |
| V-20 | 71a04b0, 9a8a28e | While the runtime telemetry box is shown B2 ends above it (its height measured; full and fit tier; at 200 % the box stands in the column). The overlap existed on 70d1cb4 too |
| V-08-R | e3f7acf | A broken PDF from the running worker (EXECUTION_FAILED, ERR_PDF_PARSE_FAILURE in the summary) offers no RETRY — exact token match |
| R-05 | 394e5dc | While a job is CHECKING or INVALID the closed controls' tooltip says the visible cause and way |
| V-15 | b4b6ed9 | Every cut name in the Job Field carries its full text (title) |

Verification (`round2/measures/`, STAND_IN, GRÜN's labs: candidate :41871 on 9a8a28e, base :41879 on 70d1cb4, both production
builds; PINK's own probes `pink-v11-order`, `pink-cardhit`, `pink-cardbox` from 831ef92 run unchanged, GET only, 0 blocked):
- `suite-and-build.txt`: tsc 0; build without the flag exit 0; focused group 63 files, 514 passed (4 skipped).
- `counterproof-41dfa25.txt`: the 6 new files against 41dfa25 — 10 REPRODUCE fail at their assertions, 6 inverse pass.
- `STANDIN-v11-tab-path.txt`: Enter on the role → SELECT AS JOB **14** and role view on load **4** at 1920 / 1600 / 1440 / 1280 —
  identical to 70d1cb4 (41dfa25: 21 / 11 per PINK).
- `STANDIN-cardbox-*.txt`: every role card in orbit form with its domain line at all six viewports, organisation and role level,
  PXJ and PERSON (18 / 18), as on 70d1cb4.
- `STANDIN-cardhit-*.txt`: PINK's probe (no scroll for orbiting cards: Playwright's scrollIntoViewIfNeeded waits for a still
  element) — 1440 / 1600 / 1920 every card 5/5; 1280 × 720 Full-Stack 5/5 (41dfa25: 0/5), Frontend Architect 2/5 exactly as on
  70d1cb4 (its lower half below the fold). `STANDIN-card-wheel-*.txt`: the cards reached as a user does — page scrolled by the
  mouse wheel, then 5 points × 6 samples: **every card 5/5 at 1600, 1440, 1280 and both 200 % viewports, PXJ and PERSON**
  (70d1cb4: one card 2–3/5 at 200 %).
- `STANDIN-telemetry-box-*.txt`: overlap of the box and B2 — 70d1cb4 32 868 / 32 868 / 36 520 / 36 520 px² (1920 / 1600 / 1440 /
  1280), 9a8a28e 0 everywhere.
- `STANDIN-ux-walk.json`: 21 / 21 (the round-1 steps plus R2-V08: a broken PDF through the real worker → EXECUTION_FAILED, no
  RETRY, the way shown; R2-R05: the invalid job's tooltip equals the visible cause and way); no non-GET outside ANALYZE.
  `STANDIN-ux-keyboard.json`: 600 Tabs without URL / history change, Shift+Tab reverse, Esc chain held.
  `STANDIN-layout-9a8a28e.json`: Capability Field, B2 and PERSON without a covered control at all six viewports (the two remaining
  items as in §2, both on 421e382).
- Not implemented (GELB, owner): Back across the document boundary during SUBMITTING (PINK S6) — same class as a reload during
  SUBMITTING.

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

`measures/` (above), `shots/` (walk steps, layout per scene and viewport before / after, telemetry crops), `round2/` (§3a:
measures, shots, `card-wheel.mjs`, `telemetry-box.mjs`), `scripts/`
(`pxj-ux-walk.mjs`, `layout-probe.mjs`, `kb-regression.mjs`, `pools-open.mjs`; argv: the lab's state file, the repo root, an
output directory; the lab launcher is GRÜN's scratch copy of the three-modes lab with `next start`).
