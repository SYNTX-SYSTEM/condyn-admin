# PERSON × JOB · MAPPING FIELD · PHASE E — THE QUIET PLANETARIUM

**Mandate (OTTAVIO, 2026-11-06): SFE::AUTONOMOUS NEUROVISUAL FIELD ENGINEERING.** Develop the whole PERSON × JOB
MAPPING FIELD neurovisually and semantically as far as possible; research independently how the nervous system
processes visual space, relation, light, movement, rhythm, pulsation, order and change over time; derive the
architecture from that and implement it fully; work autonomously with GRÜN and PINK until independent acceptance.
Preserve semantic integrity, the existing fields and their boundaries. Gemini stays off. Existing test data only.
No merge to main, no production deployment.

**Base.** `PHASE_E_BASE = 86e36924` — GRÜN's phase-D delivery, carrying PINK's GO. Phase E supersedes nothing in
phase D's semantics; it changes how the same semantics reach the eye. **The phase-D GO does not carry over to any
phase-E commit** (PHASE_D §11.6): PINK runs its own pass against the phase-E tip.

---

## §0 THE READINGS THIS PHASE RESTS ON

Measured by GELB on `86e36924`, served locally at the phase-D visual-acceptance façade, in Chromium at four window
sizes. Not inferred, not remembered.

| # | Reading | How |
|---|---|---|
| **M-1** | At **L0 the field draws zero beams**. 5 bodies, 2 sectors, 3 capability nodes, 19 collar ticks, 4 rings. | `document.querySelectorAll` counts on the live page |
| **M-2** | The stage **overflows the window at every size**: stage bottom 945 vs. viewport 912; 973/940; 1033/1000; 1303/1300. The lowest body (`role_empty`) sits in the overflow; the page scrolls. | `getBoundingClientRect` on `mapping-field-svg` and every `[data-mapping-body]` |
| **M-3** | Capability nodes are **11 × 11 px**, the smallest body **8 × 8 px**, and **no `text` node exists inside any body or capability node at L0**. | same, plus `querySelectorAll("[data-mapping-body] text")` → 0 |
| **M-4** | The ten coupling states are separated by a **conjunction** of three channels — `data-line` × `data-mark` × `data-beam` — never by one channel alone. | the ten `[data-mapping-arc]` attribute triples at L2 |
| **M-5** | The stage is sized `min(calc(100vh - 170px), calc(100vw - 760px), 1100px)` at `top: 142px` inside a section that is **not** at viewport top. | `PersonJobMappingField.tsx:371` |

M-5 is the cause of M-2: `100vh` measures the window, the stage sits in a box inset below it, and the difference —
~33 px at every size — is exactly the overflow. The section is `position: absolute; inset: 0`, so its own box is
the correct reference.

---

## §1 FIELD — WHAT THE NERVOUS SYSTEM ACTUALLY DOES

Twelve findings, each with the design consequence it forces. Sources at §10.

| # | Finding | Consequence for this field |
|---|---|---|
| **R1** | Single visual features (hue, size, orientation, curvature, intensity, flicker, motion direction) are found pre-attentively; a target defined by a **conjunction** of features is not. | **M-4 is the defect.** Every distinction that must be immediate rides **one** channel. |
| **R2** | **Connectedness overrules the other grouping principles**: a drawn line groups more strongly than proximity, size or colour. | **M-1 is the defect.** The strongest instrument we own is unused at the level where the whole field is on view. |
| **R3** | Ware & Bobrow (ToAP 2004): setting a selected node **and its subgraph into oscillation** beat static highlighting for visual queries in all three experiments, faster and with fewer errors. The 2005 follow-up on medium graphs found motion ≈ static. | Motion is the **query** instrument, bound to the user's own pointer. Its static fallback is not a degraded second class — it is measured as comparable. |
| **R4** | Grouping by common fate works through the selection of **one** direction of motion; the visual system constructs about **one group at a time**. | **Exactly one phase group may move at once.** Two simultaneous oscillating groups are noise, not information. |
| **R5** | Abrupt onsets / luminance transients capture attention **involuntarily and briefly**. Sufficiently **gradual** change does not capture, and is missed — gradual changes are detected ~3× less often than disrupted ones. | The A3 sentence "movement means evidence" becomes physiological: **evidence arrives as a transient, layout arrives as a gradient.** The two sit on opposite sides of the capture boundary. |
| **R6** | Tversky et al. (2002): animation rarely helps comprehension; it must satisfy **congruence** (form matches content) and **apprehension** (slow and simple enough to be perceived). | No decorative motion anywhere. Motion only where it *is* the content: relation membership, change over time. |
| **R7** | Heer & Robertson (2007): animated transitions improve graphical perception; **staged** transitions were preferred over plain, plain over static; "as long as needed, no longer". | Level transitions are staged: geometry first, evidence second. Never both at once. |
| **R8** | Calm technology (Weiser & Brown): calm technology engages **centre and periphery** and moves between them; peripheral information informs without demanding focus. | The state of the **whole** belongs in the periphery (the outer ring). The examined thing belongs in the centre. |
| **R9** | WCAG 2.3.1: nothing flashes more than three times per second; WCAG 2.3.3 / `prefers-reduced-motion`: interaction motion must be switchable off. | Every rhythm here stays **≥ 30× below** the flash threshold, and every motion has a reduced-motion form. |
| **R10** | ≈ 6 breaths/min (0.1 Hz) is the resonance rate associated with calm — but a visual pacer does **not** make people breathe at it (Steffen et al. 2021). | 0.1 Hz is adopted as **the field's own rhythm**, declared as such. No biofeedback claim is made anywhere in the interface. |
| **R11** | On dark grounds the blue primary drives the short-wave cones, which contribute little to edge formation; blue-on-black is barely legible at any size (NASA). Thin strokes on dark bloom. | **Structure must carry luminance contrast, not hue.** Our palette is cyan on near-black with 0.8 px strokes and ring alphas 0.05–0.38 — the structure is currently carried by the weakest available channel. |
| **R12** | Change blindness in information visualisation (Nowell et al. 2001): users fail to recognise even major changes between views. | A delta is **stated**, never left to be noticed. |

**The sentence of phase E:** *what is true must arrive on one channel; what changes must arrive on the side of the
capture boundary that matches its kind; everything else must be quiet.*

---

## §2 RELATION — THE CHANNEL ASSIGNMENT

### E-1 One channel per question (R1)

| Question | Channel | Status |
|---|---|---|
| How well does it fit? | **radial distance** | unchanged, golden-vector-pinned |
| How much is required? | **size** | unchanged, golden-vector-pinned |
| Which pool? | **angle / sector** | unchanged, golden-vector-pinned |
| **Is it evidenced?** | **luminance** — a three-step ladder, steps ≥ 1.6× apart: `CHECKED` bright, `NAME_ONLY` middle, `NONE` outline | **new**; today this rides on the line × mark × beam conjunction (M-4) |

Line style, mark and beam **stay exactly as they are**. They stop being the *only* carrier and become the second,
closer reading at L2/L3. Nothing in `MAPPING_SIGNS_V1` changes; the sign table keeps its ten rows and its honesty
rules. E-1 adds a luminance assignment **derived from the class already in the sign**, so no new semantics enter.

### E-2 Relation ink at L0 (R2)

At L0 the field draws **one beam per body**: the body's own strongest coupling, at low luminance (0.22), carrying
`data-beam-rank="PRIMARY"`. Everything beyond the strongest stays on selection. This buys connectedness — the
strongest grouping cue we have — at a bounded cost of five lines in the fixture reading, never more than one per
drawn body.

*Bound:* a body whose strongest coupling has no start point in the person draws **no** beam (the phase-D honesty
rule on undrawn beams is unchanged, and its counter keeps counting).

### E-3 Motion as the query instrument (R3, R4)

Selecting a capability sets **its coupled bodies** into a shared-phase oscillation: period **1.4 s**, amplitude
**1.5 px**, sinusoidal, identical phase for every member (common fate), reverting exactly to the pinned position.

*Bounds:* exactly **one** group at a time (R4); the oscillation exists only while the selection exists; it carries
`data-motion="QUERY"` so it is never confusable with the two other motion kinds; under `prefers-reduced-motion` it
is replaced by the static luminance highlight, which R3's follow-up measured as comparable.

---

## §3 STATE — TIME, AND WHAT IT IS ALLOWED TO MEAN

### E-4 The capture boundary carries the A3 distinction (R5)

| Kind | Form | Witness |
|---|---|---|
| **EVIDENCE** change | luminance **transient**: rise 180 ms, decay 600 ms, peak ×1.8, on the changed element only. It captures — that is its purpose. | `data-change="EVIDENCE"` |
| **LAYOUT** change | position **gradient**: 900 ms, slow-in/slow-out, **no luminance change at all**. It does not capture — that is its purpose. | `data-change="LAYOUT"` |
| **QUERY** motion | §E-3 oscillation, user-driven, reverting | `data-motion="QUERY"` |

Phase D's three-valued `EVIDENCE | LAYOUT | NONE` stays the model. Phase E gives each value a form that the visual
system treats differently *in kind*, not merely a different label.

### E-5 Staged recursion (R7)

L0 → L1 → L2 → L3 and back: **stage 1** re-frames the geometry (420 ms), **stage 2** brings the new level's
evidence (starting at 420 ms). Never simultaneous. Under reduced motion both stages collapse to an immediate cut.

### E-6 The breath (R8, R9, R10)

One ambient rhythm for the whole field, on the **outermost ring only**: period **10 s (0.1 Hz)**, radius amplitude
≤ **1.5 %**, opacity ±**0.04**. It carries exactly one meaning: *the field is live and nothing is pending.*

**When something is pending, the breath stops.** Stillness is the signal — never more motion. This inverts the
usual spinner and costs the user nothing.

0.1 Hz is **30× below** the 3 Hz flash threshold (R9), and the opacity swing is an order of magnitude under the
general flash threshold. Under `prefers-reduced-motion` the ring is static at its mean radius.

### E-7 Luminance-first on dark (R11)

- structure strokes: **≥ 1.2 px** at every zoom (today 0.8 × k)
- the four rings separate by **luminance step ≥ 1.6×**, not by hue
- **no text below 11 px**, and no pure-blue text anywhere
- a body drawn at the **minimum legible diameter floor (12 px)** carries `data-size-floor="true"` — the size
  channel stays honest by stating where it has stopped being proportional
- capability nodes carry their **name at every level** (there are at most thirteen drawn); body names appear at
  L1+ and on mark/selection at L0

### E-8 The full stage (A2, M-2, M-5)

The stage is sized against **its own box**, not the window: the `100vh` term becomes `100%` of the section, and the
bottom gutter is stated explicitly. **Bound: the outermost drawn element lies inside the stage box at every window
size ≥ 1280 × 800, and the page does not scroll.** This is a measurement, not an opinion — PINK re-measures it.

### E-9 A delta is stated (R12)

Every change between two readings is named in the provenance line *and* marked on the changed element. Nothing
relies on the user noticing a difference.

---

## §4 BOUNDARY — WHAT PHASE E MAY NOT TOUCH

| # | Boundary |
|---|---|
| **B-1** | `lib/career/mapping/{layout,signs,view,delta,focus}.ts` and `docs/.../mapping-spec/*` stay **byte-identical**. The twelve golden vectors keep passing unchanged. Positions, sizes, angles, sector assignment and the sign table are not phase-E business. |
| **B-2** | The six capability orbits, the JOB FIELD, the explicit job scope and the Capability Field stay unchanged. |
| **B-3** | The phase-D field-selector contract C-1 … C-11 stays in force, including the three buttons, the ids, the order and the MAPPING gate with its four reasons. |
| **B-4** | **Model purity:** the view model computes from the ranking and the projection only. No new read, no write, no storage, no navigation out of the field. |
| **B-5** | **No invented semantics.** Phase E adds no coupling, no state, no evidence class. Luminance in E-1 is *derived from* the class the sign already carries. |
| **B-6** | `GEMINI_JOB_CALL_LIMIT = 0`. No provider call, in any form, at any point. |
| **B-7** | Existing test data only: the phase-B/D fixtures and the golden vectors. |
| **B-8** | No merge to `main`, no production deployment, no database, no new port or service. |

---

## §5 AUTHORITY — WHO DECIDES WHAT

- **OTTAVIO** decides the visual acceptance, and alone. Two questions are his and are *not* pre-empted here: whether
  body names belong at L0 (E-7 proposes capability names always, body names on demand), and whether the host's six
  orbits should stay visible through the stage or be damped further. Phase E implements the proposal and keeps both
  reversible by one constant.
- **GELB** owns this document and the contract.
- **GRÜN** owns the implementation.
- **PINK** owns the independent inverse check and the GO. **PINK's GO is pinned to the commit it measured.**

---

## §6 DELTA — THE CHANGE SET

Entry set (everything phase E may touch):

| File | What changes |
|---|---|
| `app/components/career/demo/PersonJobMappingField.tsx` | the stage box (E-8), the luminance ladder (E-1, E-7), the L0 primary beams (E-2), the three motion kinds and their witnesses (E-3, E-4), the staging (E-5), the breath (E-6), labels and the size floor (E-7) |
| `app/components/career/demo/mapping-field-copy.ts` | the new statements only (breath/pending wording, the size-floor note, the delta sentence) — EN and DE |
| `lib/career/view-model/mapping-field.ts` | **additive only**: `luminanceOf(class)`, `primaryBeamOf(body)`, `sizeFloor` witness, `motionKind`. No existing field changes meaning. |
| `test/career/mapping-field/field-e.test.tsx` | new |
| `test/career/mapping-field/neurovisual-e.test.ts` | new — the numeric bounds of §2/§3 as assertions |
| `test/career/mapping-field/architecture.test.ts` | MAP-E-ARCH: B-1 … B-8 given teeth |

Protected (a change here turns MAP-E-ARCH red): everything under `lib/career/mapping/`, `docs/.../mapping-spec/`,
the six-orbit components, `SyntxFieldSelector.tsx`, the JOB FIELD and job-scope paths, every API route, every
`lib/career/job-pool/` module.

---

## §7 PROOF — THE OBLIGATIONS

Each must be **red before** it is green; a test that was never red proves nothing.

| # | Proof |
|---|---|
| **P-1** | At L0 the number of drawn beams equals the number of bodies with a drawable strongest coupling — and is **> 0** for the standard reading (kills M-1). |
| **P-2** | Every arc's evidence class is recoverable from **luminance alone**: the three luminance values are distinct, ordered, and ≥ 1.6× apart (kills M-4). |
| **P-3** | Selecting a capability sets exactly its coupled bodies in motion, **all at one phase**, and exactly one group exists at a time (R4). |
| **P-4** | An EVIDENCE change produces a luminance transient and **no** position change; a LAYOUT change produces a position transition and **no** luminance change. Both directions asserted (R5, A3). |
| **P-5** | The breath is 0.1 Hz ± 0, amplitude ≤ 1.5 %, and **stops** while pending; 0.1 Hz ≤ 3 Hz / 30 (R9). |
| **P-6** | Under `prefers-reduced-motion: reduce` **no** element carries a non-zero animation or transition duration — breath, query motion and staging all collapse (WCAG 2.3.3). |
| **P-7** | At 1280 × 800, 1600 × 1000, 1829 × 912 and 2560 × 1300 the outermost drawn element is inside the stage box and `scrollHeight ≤ innerHeight` (kills M-2). |
| **P-8** | No text below 11 px; every structure stroke ≥ 1.2 px (E-7). |
| **P-9** | **Golden vectors byte-identical**; `lib/career/mapping/` and the spec unchanged (B-1). |
| **P-10** | Model purity: fixture render performs 0 fetches, 0 storage reads, 0 navigations (B-4). |
| **P-11** | **INVERSE:** a mutant that puts the evidence luminance back onto one shared value turns P-2 red; a mutant that gives a LAYOUT change a luminance transient turns P-4 red; a mutant that raises the breath to 3.1 Hz turns P-5 red. |
| **P-12** | The ten coupling states and their signs are **unchanged** against the phase-D expectation — the sign table keeps producing exactly what it produced (B-5). |

---

## §8 RECONSTRUCTION

`PHASE_E_BASE = 86e36924`. Every phase-E commit lives on `frontend/mapping-phase-e`; this document on
`architecture/mapping-phase-e`. Reverting the frontend branch to `86e36924` restores phase D exactly, with its GO
intact, because B-1 keeps the engine untouched. The visual-acceptance façade (local, outside the repository)
reproduces the stage from the existing fixtures without a database and without a provider.

---

## §9 HAND-OVER

- **GRÜN** implements §2, §3 and §6 against the bounds as written, red-first per §7, and reports each numeric bound
  it had to move with the measurement that forced it.
- **PINK** checks inversely and independently: its own worktree, its own render, the mutants of P-11, and the four
  window sizes of P-7 measured by itself. PINK's prior phase-D artefacts stay valid for B-1/B-3.
- **GELB** holds this contract and decides every conflict between a bound and a measurement.

---

## §10 SOURCES

- Ware, C. & Bobrow, R. — *Motion to Support Rapid Interactive Queries on Node-Link Diagrams*, ACM ToAP 1(1), 2004;
  follow-up *Supporting visual queries on medium-sized node-link diagrams*, Information Visualization, 2005.
- Ware, C. — *Information Visualization: Perception for Design* (pre-attentive features, connectedness).
- Tversky, B., Morrison, J. B. & Bétrancourt, M. — *Animation: can it facilitate?*, IJHCS 57(4), 2002.
- Heer, J. & Robertson, G. — *Animated Transitions in Statistical Data Graphics*, InfoVis 2007.
- Simons, D. et al. — gradual change detection, *Perception*, 2000; Nowell, Hetzler & Tanasse — *Change blindness in
  information visualization: a case study*, InfoVis 2001.
- Yantis & Jonides and the onset-capture literature; Du et al., 2013 (rapid involuntary capture by luminance
  transient vs. sluggish voluntary prioritisation).
- Kingstone & Bischof, 1999 (phase/counterphase grouping); Levinthal & Franconeri (one motion group at a time).
- Weiser, M. & Brown, J. S. — *Designing Calm Technology*.
- W3C — WCAG 2.2 *Understanding 2.3.1 Three Flashes or Below Threshold*, *2.3.3 Animation from Interactions*;
  `prefers-reduced-motion`.
- NASA Color Usage — blue on dark; Green, M. — chromatic aberration and thin strokes.
- Lehrer/Vaschillo resonance-frequency line, with Steffen et al. 2021 as the counter-finding on pacers.
