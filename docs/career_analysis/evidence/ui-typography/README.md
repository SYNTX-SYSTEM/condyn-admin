# UI typography & readability sweep — evidence

Owner mandate "SFE::UI TYPOGRAPHY & READABILITY SWEEP" (2026-10-20) to GRÜN. Branch `frontend/ui-typography` from the integration
tip `35f00bc`. The VIDEO FREEZE is superseded for this isolated work only, so this branch stops before integration and waits for the
owner's GO. No backend changes and no live Gemini. GELB's video contracts hold: every `data-testid`, every visible copy and every
`text-transform` is unchanged. The text measures were taken at 1920 × 1080 (video), 1440 × 900 and 1280 × 720, in English and German,
at 100 / 125 / 200 % zoom and in four monospace fonts (JetBrains Mono, Fira Code, DejaVu Sans Mono and IBM Plex Mono).

## 1 · Method

The baseline and the after state were measured with the same instrument, each on its own checkout and lab:
- baseline: detached worktree on `35f00bc`, lab :41808;
- after: `frontend/ui-typography`, lab :41807.

Each lab is GELB's empty video lab (`../video-readiness/scripts/video-lab.ts`): a disposable database, the real server and worker, the
loopback Gemini stand-in and the network sentinel. Both labs ran in parallel.

| script | what it measures |
|---|---|
| `scripts/inventory.mjs` | Every visible text run of a frame: rendered size (font size × the transform scale it is drawn at), weight, contrast of its colour composited over its painted background, and whether it is clipped (its line boxes against every clipping ancestor, or an ellipsis). Collisions are line boxes of two unrelated runs that intersect where both are actually seen (no painted surface lies above either; `elementsFromPoint`). |
| `scripts/instrument-walk.mjs` | Writes a copy of GELB's END-TO-END VIDEO WALK (`video-walk.mjs`, unchanged) whose every screenshot also writes the inventory of that frame. The walk's checks are untouched; the copy is the 30/30 proof. |
| `scripts/extras-walk.mjs` | The surfaces the walk does not show: onboarding, system codex in English and German, semantic guide, the German Job Field (pool, Kestrel, role, requirement, Capability Field), and the scale and dense pools (14 roles, long titles, dense and narrow cards) in German and English. The locale lives in the page's state, so it is chosen again after every navigation. |
| `scripts/take.sh` | One take: fresh lab → instrumented walk → extras → lab stopped. |
| `scripts/compare.py` | Baseline vs after per text carrier (`data-testid` key): size range, weakest contrast, clipped runs, and every collision. |
| `scripts/condition-probe.mjs`, `scripts/conditions-compare.py` | Zoom as the CSS viewport it leaves on a 1920 × 1080 screen (125 % → 1536 × 864, 200 % → 960 × 540) × the four monospace fonts × EN / DE, on the densest Job Field states. |
| `scripts/shell-probe.mjs` | The shell row (job scope, field selector, investigation selector, meta dock / semantic guide, brand) at 1280 · 1366 · 1440 · 1600 · 1920, both fields, EN / DE: the least horizontal air between two controls on a shared row. |
| `scripts/values-from-diff.py` | `values.md`: every changed value (size, tracking, spacing, colour, offset) from the diff against `35f00bc`. |
| `scripts/pairs.py` | The before / after images in `pairs/`. |

Runs only count when their opacity is at least 0.5 and they are at least 3 px. Receded depth layers (organizations behind a focused
one, the dimmed dock in deep focus) are context and are excluded.

## 2 · Inventory and confirmed problems (baseline, 1920 × 1080)

The inventory read 92 text carriers over 35 frames.

- **The type was small almost everywhere.** Informational text sat at 7–9.5 px:
  - edge actions and panel toggles at 8.5;
  - the investigation selector at 8.5;
  - keyboard hints at 7 / 7.5;
  - the field laws at 8.5;
  - the mode statement at 9;
  - panel kickers, meta lines and chips at 8.5–9.5;
  - requirement card labels at 7.5;
  - the job scope detail at 8.5.
- **Collision.** The mode statement (`syntx-investigation-statement`, 2 lines) lay over the second line of the field laws
  (`job-pool-non-claims`). This happened in 5 of the walk's frames: pool field, Kestrel, role in PERSON, and job structure and no-Gemini
  in JOB.
- **Ellipsis.** The current step of the observation path cut the role title (`syntx-path-ROLE`, 7 frames; at 200 % zoom the pool name too).
- **Contrast.**
  - The muted token `textMuted` (#63788a) is used for region states, captions, staged-source labels and the inspector hint. It measured
    4.2–4.4 : 1.
  - The unselected investigation modes measured 5.7 : 1, the unselected field 5.1 : 1, the job scope detail 7.5 : 1 and the field
    laws 5.6 : 1.
- **Tight shell geometry.**
  - At 1280 px the investigation selector stands 6.9 px from the Capability Field's SEMANTIC GUIDE.
  - In German at 1280 px the meta dock stands 2.4 px from the brand line.
  - At 1280 × 720 the Source Dock's START ANALYSIS ends exactly at the viewport's lower edge.

**Pre-existing findings, not typography; reported, not changed:**
- **F-TY-GUIDE (functional).** In the Job Field, SEMANTIC GUIDE opens its drawer in flow at the top left, *under* the Job Field's
  surfaces. It is invisible there, and its toggle is gone until reload. The video path does not use it.
- **O-TY-CODEX.** The codex language buttons follow the global `button { transition: all .3s }`. Under the animated field the highlight
  lags behind the chosen language by up to a few seconds; the content switches at once.
- **O-TY-720.** At 1280 × 720 the lower organizations of the pool field are cut by the viewport, and the Decision Graph Inspector lies
  over the lower Source Dock. The field geometry is not part of this sweep.
- **O-TY-TSC.** `tsc` reports one error in `video-readiness/scripts/relay-check.mts` on `35f00bc` itself; nothing new.

## 3 · Typographic hierarchy (reconstructed, then applied)

| level | what | before | after |
|---|---|---|---|
| L1 | Primary states, field selector, panel and surface headings (mono caps, tracked) | 9.5–11 | 11–12 (headings of fixed bodies unchanged) |
| L2 | Entity names: role / organization / pool / requirement / capability names, selected job | 10.5–12.5 (cards), 11.5 (path) | 11.5–13.5, path 13 |
| L3 | Functional text: statements, explanations, actions, toggles, quotes | 8–12.5 | 10–13.5 (sans sentences 12.5–14) |
| L4 | Metadata, chips, keys, auxiliary labels | 7–9.5 | 8.5–11 |

**Interface text.** Every font size steps along one map:

| before | 7 | 7.5 | 8 | 8.5 | 9 | 9.5 | 10 | 10.5 | 11 | 11.5 | 12 | 12.5 | 13 | ≥ 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| after | 8.5 | 9 | 9.5 | 10 | 10.5 | 11 | 11.5 | 12 | 12 | 12.5 | 13 | 13.5 | 14 | kept |

The small sizes rise most (+1.5 px) and the readable ones least (+0.5–1 px), so the hierarchy closes from below and stays ordered.

**Single-line tracked capitals** whose width is fixed keep their width: the size rises and the letter spacing gives the advance back
(advance = 0.6 em + tracking). This covers:
- the meta dock (10 → 11 px, tracking 1.4 → 0.6);
- the field selector (11 → 12, 2.2 → 1.6);
- the investigation selector (8.5 → 10, 1 → 0.6);
- the job scope label;
- the edge actions;
- the surface title.

**Bodies with a fixed form** take smaller, geometry-checked steps: organization bodies, pool core, cosmos and role centres, requirement
cards, the Capability regions, satellites and evidence rows.

## 4 · What changed (values in `values.md`)

**Shell**
- Field selector: 11 → 12 px; the unselected field's contrast 5.1 → 7.5 : 1.
- Investigation selector:
  - 8.5 → 10 px, membrane 32 → 34 px high;
  - below 1366 px wide 9.5 px and tighter, so it is no wider than before beside the Capability Field's SEMANTIC GUIDE;
  - unselected modes 5.7 → 9.1 : 1.
- Job scope indicator:
  - label 9.5 → 10.5, state title 10 → 11, detail 8.5 → 10 px (contrast 7.5 → 9.7 : 1);
  - the selected job's title stays 12.5 px, because the row's width is bound and at 13.5 px it would be cut at 1440.
- Meta dock in the Job Field: 10 → 11 px at the same width.
- Capability-field header buttons: 11 → 12 px.
- The SEMANTIC GUIDE toggle stays 11 px.

**Job Field**
- Orientation surface:
  - title 10.5 → 12;
  - path 10 / 11.5 → 11.5 / 13, and the current step now wraps instead of cutting the title (all steps carry their name as a tooltip);
  - edge actions and toggles 8–9 → 9.5–10.5;
  - state chip 8.5 → 10;
  - NO ANALYSIS voices 10 / 11.5 → 11.5 / 12.5;
  - keys 7.5 / 7 → 9 / 8.5.
- Below 600 px viewport height (≈ 200 % zoom on 1080p) the orientation surface scrolls instead of pushing its actions out of view.
- Field edge:
  - mode statement 9 → 10.5 px, lifted from +44 to +62 px above the field laws — the collision is gone;
  - field laws 8.5 → 9.5 px, contrast 5.6 → 8.7 : 1.
- Panels (pools, intake, boundary, B2, structure, GEMINI OUTPUT):
  - kickers and meta lines 9.5 → 11;
  - chips 8.5 → 10;
  - view tabs 8.5 → 10;
  - statements 12–12.5 → 13–13.5;
  - quotes 11.5 → 12.5;
  - raw response 10.5 → 12;
  - layer ordinals 8 → 9.
- Field bodies:
  - organization subtitle 10 → 11, kind 7.5 → 8.5, role count 9.5 → 10.5 (name 13 kept);
  - pool core 10 / 9.5 → 11 / 10.5;
  - organization-cosmos centre kicker 8 → 9, at the same advance, so German does not hyphen-break in wider fonts;
  - role centre 8 / 11 / 7.5 → 9 / 12 / 8.5;
  - requirement cards: label 7.5 → 8.5, name 10.5 / 9.5 → 11.5 / 10;
  - glyph labels 8 → 9;
  - requirement and evidence level 7.5–9 → 8.5–10.
- **Role cards in the orbit: unchanged.** They keep the validated baseline (§13.2.33–35: standing 7.5, title 11.5 fitted ≥ 10,
  footer 8.5 / DE ≥ 7.75). Their code and box are identical.

**Capability Field**
- Region bodies: subtitle 10 → 10.5, state 9 → 9.5, items 10 → 10.5 (ordinal 11 and title 13 kept; the circle binds).
- Identity core 10 → 10.5.
- Zoom telemetry 9 → 10.5.
- Intake banner 10–11 → 11.5–12.
- Source Dock 10–13 → 11.5–14. Its section air goes 18 → 12 and its button padding −1 to −2 px, so it keeps its height (START at
  1280 × 720 as before).
- Cosmos and deep-focus cards 8 → 9, 10 / 11 → 11 / 12.
- Inspector hint stays 12; inspector detail 12 → 13.

**Overlays**
- Onboarding 11 / 13 → 12 / 14.
- System codex: 10 → 11, 11 → 12, 12 → 13.
- Semantic guide: 10–12 → 11.5–13.

**Token:** `textMuted` #63788a → #7a8fa1 (4.4 → 6.0 : 1 on the field ground). It is still the quietest ink; nothing that was muted
became bright.

## 5 · Results

**Video walk.** The instrumented copy of GELB's walk ran against GRÜN's labs:

| run | 1920 × 1080 | 1440 × 900 | 1280 × 720 |
|---|---|---|---|
| baseline | 30/30 | 30/30 | 30/30 |
| after | 30/30 | 30/30 | 30/30 |

**Text measures (walk + extras, 35 frames each).**
- No new collision. The 5 baseline collisions at 1920 (mode statement × field laws) are gone.
- No new clipped run. `syntx-path-ROLE` 7 → 0 clipped frames.
- Below 8.5 px only these remain: the role cards' standing and German footer (retained) and the key caps (8.5 px at the 0.98 scale of
  their row).
- The few role-card runs counted as clipped at 1280 are cards that the orbiting motion carries across the stage edge. Their number
  depends on the phase at capture time, and the card code is identical.

**Conditions** (108 frames: 3 zooms × 4 fonts × EN / DE × 6 states).
- No new collision.
- 26 clipped runs fewer:
  - the role and pool path at 100 / 125 / 200 %;
  - one dense-card domain.
- One new clipped run: SELECT AS JOB at 200 %. There the orientation surface scrolls, and the action is reached by scrolling.

**Shell row.** At least 8 px air everywhere, in both fields, EN / DE, 1280–1920. Before, the minimum was 6.9 px (1280, Capability)
and 2.4 px (1280 DE, Job Field).

**Tests.**
- tsc: no new error.
- Unit and SSR tests of the field, shell and modes: 148/148. `three-modes-ssr` now expects the NO ANALYSIS body at 12.5 px.
- Full suite and workflow e2e: see §13.2.36 of `docs/career_analysis/JOB_FIELD_FRONTEND.md`.

## 6 · Intentionally retained small text

| where | size | why |
|---|---|---|
| Role cards in the orbit (standing, footer DE) | 7.5 / ≥ 7.75 | Validated baseline (§13.2.33–35). The card box sets the orbit's air, and the full statements are in the tooltip and on the role. |
| Requirement card kind label, organization kind, cosmos / role-centre kickers | 8.5–9 | Inside fixed bodies. The same word is repeated by the body's position and by the level heading. |
| Key caps of the orientation surface | 8.5 | Glyphs in a cap. The action words beside them are 9 px. |
| Disabled zoom levels L1–L4 (Capability telemetry) | 10.5, contrast 2.4 | Disabled controls. They are dim on purpose and carry no state. |
| Field laws | 9.5 | The field's standing legend, two lines of at most 960 px. Raising it further would cost a third line at the field's edge. |

## 7 · Files

- `pairs/*.jpg`: before | after of the significant changes at 1920 (shell row, orientation surface, field laws and mode statement,
  role level, B2, job structure, GEMINI OUTPUT, Capability Field, Kestrel in German, codex in German) and the shell and Source Dock at
  1280.
- `measures/`:
  - the comparisons `compare-<width>.txt`;
  - `conditions-compare.txt`;
  - `shell-base.txt` and `shell-after.txt`.
- `values.md`: every changed value.
