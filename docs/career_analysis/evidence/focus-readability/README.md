# Focus-dependent readability — evidence

Owner mandates "SYNTX::SFE::FOCUS_DEPENDENT_READABILITY" and "FOCUS_READABILITY_OWNER_DECISION" (2026-10-21) to GRÜN.
- Branch `frontend/focus-readability` from `38ebc31`. That is the baseline the owner selected, after PINK accepted it (§3.52, `a1c4252`).
- Integrated is still only `35f00bc`. This branch stops before integration.
- No live Gemini.

## 1 · Method (OBSERVED)

- **Labs.** GELB's video walk (instrumented copy, `../ui-typography/scripts/instrument-walk.mjs`) runs on a fresh video lab: an empty
  disposable database, the stand-in Gemini, and the real server and worker. It produces the PERSON and the PERSON × JOB analyses. On
  the same lab, `scripts/focus-states.mjs` then measures every relational state.
- **States, addressed by URL** (`jobOrganizationId`, `jobRoleId`, `jobRequirementId`, `analysisId`, `investigationMode`, job scope):
  FIELD, ORGANIZATION, ROLE, REQUIREMENT, PERSON × JOB at the role, PERSON × JOB at the requirement, and EVIDENCE (the aperture
  open).
- **PERSON and CAPABILITY.** The demo page hands the Capability Field empty data. So the probe runs one PERSON analysis in the page,
  as walk step V-02 does. It then measures the Capability Field, the capability cosmos and the capability deep focus with its
  evidence.
- **Recorded per frame:**
  - the text inventory (`../ui-typography/scripts/inventory.mjs`): rendered size (font size × scale), contrast composited over the
    painted ground, effective opacity, clipping and collisions;
  - each entity root's sign state, effective opacity, tabIndex, role and support / evaluation attributes;
  - per text run, its line count and line width against its host.
- **Conditions:** 1920 × 1080, 1440 × 900 and 1280 × 720. Zoom 125 / 200 % as 1536 × 864 and 960 × 540. EN and DE.
- **Geometry** (`scripts/geo-focus.mjs`): the pool name in the core organism, the organization centre disc and the receded sibling
  cards. Each is measured on the engineering pool and on three variants with lengthened names:
  - edge: pool name 36 characters, centre label 35;
  - middle: 48 / 42;
  - long: 77 / 71, plus two requirement names of 63 characters.
- **Orbit at rest** (`scripts/orbit-freeze.mjs`): every role-card rectangle with `prefers-reduced-motion`, which puts the orbit at
  rest. Measured on the scale and dense pools at 1920 and 1280.
- **Reference measures.** The measures of PINK §3.51 / §3.52 and of `../ui-typography/` (video walk, 35 frames per width, 108
  condition frames) re-run against the `38ebc31` takes.

A correction of my own earlier evidence: the sweep's extra frame `x08-de-requirement` showed the ORGANIZATION level, not a
requirement. Its click hit the outer element, not the anchor. The requirement level is measured here for the first time.

## 2 · Reconstructed baseline `38ebc31` (OBSERVED, `measures/matrix-38ebc31.md`)

All values are rendered px, weight and contrast. They hold identically at every width and in both languages, unless a range is given.

| state | focused identity | context |
|---|---|---|
| FIELD | pool name 9.9–11.1 · 700 · 17.5:1 | organization names 12.2–13.6 · 700; organization metadata 10.4–11.5 · 500 |
| ORGANIZATION | centre name 11 · 700 · 17.8:1 (kicker 9) | role titles 11.5 · 600 · 19.3:1; requirement counts 8.4; receded organizations 8.8–9.8 at opacity 0.12 (1.3:1) |
| ROLE | role centre 12 · 700 | requirement labels 10–11.5 · 700; receded roles 11.5 at opacity 0.30 (2.5:1) |
| REQUIREMENT (also PERSON × JOB) | nucleus 14 · 800 · 17.8:1 | siblings 7.3 · 700 at opacity 0.42 (2.8:1); evidence surface 9–10 |
| EVIDENCE | aperture 16 · 800; quote 14.8–15 · 11.9:1 | labels 10 · 700 · 5.9:1 |
| PERSON (Capability Field) | region titles 13 · 700 | region subtitles 10.5 |
| CAPABILITY cosmos | centre "02 CAPABILITY FIELD" 11 · 700 | node names 12 · 700 |
| CAPABILITY deep focus | nucleus 14 · 800 | siblings 7.8 at opacity 0.42 (2.8:1); evidence surface 9–10 |

**Focus map** (`measures/focus-map-38ebc31-en-1920.txt`):
- The sign states are `field`, `organization_selected`, `role_selected` and `receded`, at opacities 1 / 0.42 / 0.30 / 0.12.
- The focused carrier has `tabIndex 0` and `aria-pressed`; receded siblings have `tabIndex −1`.
- Evaluation stays separate: `data-support` and `data-evaluation-state="NOT_EVALUATED"` while a matching is only read.

**Confirmed deficiencies (DERIVED):**
- **I-1 · FIELD.** The focused pool's name is smaller (10.5 px CSS) than the organization names it contains (13 px). It is even
  smaller than its own kicker JOB POOL (11 px).
- **I-2 · ORGANIZATION.** The focused organization's name in the centre (11 px) is smaller than its name in the field (13 px) and
  than the role titles around it (11.5 px).
- **I-3 · CAPABILITY cosmos.** The centre (11 px) is smaller than its nodes (12 px). This is the same pattern; see §5 for why it is
  not changed.
- **R-1 · receded siblings.** In REQUIREMENT and Capability deep focus, the receded siblings are 7.3 / 7.8 px at 2.8:1. They are the
  next navigation targets.

## 3 · Change (PROPOSED → implemented)

| commit | where | before → after | why it is the smallest local delta |
|---|---|---|---|
| `cebc78c` | `SyntxField.tsx`, pool core | pool name 10.5 → 14 px; 12 px from 37 characters; 10.5 px beyond 54 | The name leads its context. The steps keep the core content inside the organism for every length (`measures/geometry-*.json`). |
| `cebc78c` | `SyntxField.tsx`, organization cosmos centre | centre name 11 → 13 px; 12 px for 35–38 characters of its label; 11 px beyond | The name keeps the size it has in the field (13 px). The disc stays 174 × 174 at every length. |
| `cebc78c` | `SyntxField.tsx` | stale comment above the low-window rule removed | PINK O-TY-COMMENT. |
| `26b54be` | `SyntxField.tsx`, requirement siblings; `CapabilityDeepFocusView.tsx`, capability siblings | 9.5 / 10 → 11 px (rendered 7.3 / 7.8 → 8.6) | Owner decision 02. Scale 0.78 and opacity 0.42 (the layout's recede) stay. No card grows, and they stay below the 14 px nucleus. |

**Unchanged:**
- copy and case (the centre's `toUpperCase` and the pool's `text-transform` included), colours, weights;
- every `data-testid`, sign state and tabIndex;
- orbit and layout code (`lib/` untouched), animations, role cards and footers.

**Inverse check:**
- The emphasis follows only the existing observation state: FIELD → pool, ORGANIZATION → organization.
- The size steps depend only on the label's length, never on support, evaluation or score.
- The focused identity stays recognisable without colour: it is the largest text in the centre, at the centre of the composition.

## 4 · Results (OBSERVED)

- **Video walk:** 30/30 at 1920 / 1440 / 1280. Extras without failure. All 10 states in EN and DE at every width and zoom
  (`measures/runs.txt`).
- **Matrix after** (`measures/matrix-after.md`): 56 of 290 cells differ, 234 are identical. Of the 56, 47 are the intended changes:
  - pool name 9.9–11.1 → 13.1–14.6 px;
  - organization centre 11 → 13 px;
  - requirement siblings 7.3 → 8.6 px;
  - capability siblings 7.8 → 8.6 px.

  The other 9 are not changes:
  - 5 are context sizes ±0.1 px, a capture phase of the animated organization bodies;
  - 1 is a weight set seen in one frame;
  - 3 are cells the baseline lacks (Capability deep focus at 1440 EN, whose click had failed there).
- **Focus map:** 66 frames. Sign states, tabIndex, roles and support / evaluation attributes are identical. The only difference is
  one trace pair caught mid-fade (opacity 0.33 / 0.05).
- **Text measures against `38ebc31`** (35 frames per width, `measures/compare-<width>.txt`): no new collision and no changed clip
  count.
- **Conditions** (108 frames: zoom × four fonts × EN / DE × six Job Field states; `measures/conditions-38ebc31-vs-after.txt`):
  - no new collision;
  - four more clipped runs, all role cards (Security & Compliance, SENIOR) at the stage edge. The same cards clip on `38ebc31` (10×)
    and `7a3ca6a` (9×) in other frames.
  - With the orbit at rest, all 53 / 53 / 7 / 9 role-card rectangles are identical to the tenth of a pixel, at 1920 and 1280
    (`measures/orbit-at-rest-*.json`). So the count follows the orbit's phase, not this change.
- **Geometry** (`measures/geometry-*.json`):
  - centre disc 174 × 174 at engineering, edge and middle length, and 174 × 175 at long length, as on `38ebc31`;
  - core content inside the organism for every length;
  - sibling cards never above their 78 px body: 0 overlaps among them and 0 with the nucleus or the evidence surface, at 1920 and
    1280.
- **Tests:** field, shell and mode tests 148/148. `tsc` reports only the `relay-check` error of the base.

## 5 · Remaining limits (DERIVED)

- **I-3 · Capability cosmos centre, not changed.**
  - "02 CAPABILITY FIELD" at 13 px would fill 96 % of the disc's widest chord, and at 12 px it would only equal its nodes.
  - Its focus is carried by the disc, its material and the centre position. Leading by size would need two lines. That is the
    owner's call.
- **Receded organizations and roles** (opacity 0.12 / 0.30, 1.3–2.5:1) stay as they are. Their legibility is bound to the recede
  opacity, and owner decision 02 rules out changing it globally. They remain reachable through the path and RETURN.
- **ROLE centre** 12 px against requirement labels of 11.5 px. This is not an inversion; it is left as it is.
- **Evidence surface** under the nucleus, 9–10 px. It is functional information with room to the side (438 px). Not part of this
  pass.
- **Long names.**
  - Organization names beyond 38 characters keep 11 px.
  - At 71 characters, the text block's corners already pass the disc on `38ebc31`. This is pre-existing and unchanged.
- **Pre-existing, with the owner:** P-TY-START / O-TY-PXJ-SHIFT, O-TY-SCROLLJUMP, F-TY-GUIDE.

## 6 · Files

- `pairs/*.jpg`: before (`38ebc31`) | after, at 1920 and 1280. They cover FIELD, ORGANIZATION (EN / DE), REQUIREMENT, PERSON × JOB
  requirement (DE) and Capability deep focus (DE).
- `measures/`: the matrices, the comparisons, the conditions, geometry, orbit at rest, the focus map and the runs.
- `scripts/`:
  - `focus-states.mjs`, `matrix.py`, `focus-table.py`;
  - `geo-focus.mjs`, `orbit-freeze.mjs`, `crops.mjs`.
