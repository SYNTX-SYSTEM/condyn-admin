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
| **M-3** | **At 1829 × 912**: capability nodes 11 × 11 px, smallest body 8 × 8 px. The absolute figures are **window-dependent** — PINK read 12.67 / 9.5 px at 1600 × 1000, because node and body px scale with the stage factor `k`. What holds at every size: sub-legible, and **no `text` node inside any body or capability node at L0**. E-7 is therefore measured against its **fixed** bounds (12 px floor, no text < 11 px) at the worst size, never against these two numbers. | same, plus `querySelectorAll("[data-mapping-body] text")` → 0; window-dependence from PINK's independent render |
| **M-4** | The ten coupling states are separated by a **conjunction** of three channels — `data-line` × `data-mark` × `data-beam` — never by one channel alone. | the ten `[data-mapping-arc]` attribute triples at L2 |
| **M-4a** | On the one channel R1 demands, the classes are **not separated at all**: measured arc luminance SEMANTIC **0.704**, LEXICAL **0.700**, NONE 0.400 — a ratio of **1.01** between the two that matter most. | `getComputedStyle(arc).opacity` on the ten arcs of the all-states role |
| **M-5** | The stage is sized `min(calc(100vh - 170px), calc(100vw - 760px), 1100px)` at `top: 142px` inside a section that is **not** at viewport top. | `PersonJobMappingField.tsx:371` |

**The mechanism, as PINK derived it independently and completely.** A 61 px top-controls bar sits above the
`top: 142px` box, so the stage renders at y = 203. Therefore

    overflow = 61 + 142 + (100vh − 170) − 100vh = +33   whenever the 100vh term dominates
    overflow = 61 + 142 + 1100 − 100vh        = +3     at 2560 × 1300, where the 1100 cap dominates

which is exactly the 33 / 33 / 33 / 3 measured at the four sizes. There are **three independent sources**, and E-8
must name all three: the 61 px offset, the `100vh`-versus-own-box mismatch, and — at 1280 × 800, where the stage
*does* fit (723 < 800) and the page still scrolls to 1021 — flowed content below the absolutely positioned stage.
The third belongs to the host (E-8a) and is out of phase E's reach; PINK measures and reports it regardless.

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
| **Is it evidenced?** | **luminance** — three disjoint **bands**: `CHECKED` [0.93, 1.00], `NAME_ONLY` [0.45, 0.58], `NONE` [0.22, 0.28]. Adjacent bands are ≥ 1.6× apart at their closest points (0.93/0.58 = 1.60; 0.45/0.28 = 1.61). | **new**; today this rides on the line × mark × beam conjunction (M-4) and is separated by 1 % (M-4a) |

**Bands, not steps (ruling A-3).** The sign table carries a per-state luminance column (1.00 … 0.25) that *crosses*
the classes — UNCLEAR (SEMANTIC) sits at 0.55, NAME_EXACT (LEXICAL) at 0.70 — which is precisely why the class is
not readable today. The column is **not discarded**: the state's table value maps monotonically to a position
**inside its class band**. The class stays recoverable from luminance alone; the state gradation survives inside
the band; the table stays byte-identical and `data-luminance` keeps carrying the table's own value.

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
| **EVIDENCE** change | luminance **transient**: rise 180 ms, decay 600 ms, peak ×1.8, on the changed element only. Any position change it causes is **cut, never eased**. It captures — that is its purpose. | `data-change="EVIDENCE"` |
| **LAYOUT** change | position **gradient**: 900 ms, slow-in/slow-out, **no luminance change at all**. It does not capture — that is its purpose. | `data-change="LAYOUT"` |

**Why "no position change" was wrong (ruling A-2).** A body's radial distance *is* its fit (B-1), so a body whose
own evidence changed has a new pinned position by construction; the bound as first written was unsatisfiable.
What the A3 promise actually protects is narrower and survives intact: a body moved by **somebody else's** change —
the collision search displacing it — must never be mistakable for new evidence about itself. Hence: own evidence ⇒
cut plus transient (it captures, correctly); displaced by others ⇒ eased, no luminance (it does not capture,
correctly). The two remain on opposite sides of the capture boundary (R5).
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
bottom gutter is stated explicitly. **Bound: at 1280 × 800, 1600 × 1000, 1829 × 912 and 2560 × 1300 the outermost
drawn element lies inside the stage box, and the stage box lies inside the section's box.** PINK re-measures it.

**E-8a — the bound I had to narrow, and why.** My first wording also demanded "and the page does not scroll". It is
unmeetable inside phase E, and I measured why before GRÜN reached it: at 1280 × 800 the host
`semantic-career-intelligence-field` is **960 px tall** and `career-intelligence-dashboard` **1021 px**, in an
800 px window; at 2560 × 1300 the dashboard is 1361 px. The mapping section is `inset: 0` of that host, so it
inherits the host's height whatever the stage does. **The page scroll is the host's, not the stage's**, and the host
is B-2 territory. Phase E therefore owns the stage box only. The host overflow is recorded here as a measured,
unresolved property of the host and belongs to OTTAVIO's decision, not to this phase's silence.

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
| **P-2** | Every arc's evidence class is recoverable from **luminance alone, within the focused group**: the three bands are disjoint, ordered, and ≥ 1.6× apart at their closest points (kills M-4, M-4a). A context group dimmed by a common gain keeps its internal ratios by construction, so the proof is stated per group, never across groups. |
| **P-3** | Selecting a capability sets exactly its coupled bodies in motion, **all at one phase**, and exactly one group exists at a time (R4). |
| **P-4** | An EVIDENCE change produces a luminance transient and **no** position change; a LAYOUT change produces a position transition and **no** luminance change. Both directions asserted (R5, A3). |
| **P-5** | The breath is 0.1 Hz ± 0, amplitude ≤ 1.5 %, and **stops** while pending; 0.1 Hz ≤ 3 Hz / 30 (R9). |
| **P-6** | Under `prefers-reduced-motion: reduce` **no** element carries a non-zero animation or transition duration — breath, query motion and staging all collapse (WCAG 2.3.3). **P-6 needs a positive control**: measured on `86e36924` it passes vacuously, because nothing animates there at all. It only proves something once E-3/E-5/E-6 exist, and it must be shown red by a mutant that omits the reduced-motion branch. |
| **P-7** | At 1280 × 800, 1600 × 1000, 1829 × 912 and 2560 × 1300 the outermost drawn element is inside the stage box and the stage box is inside the section's box (kills M-2, within the limit stated in E-8a). |
| **P-8** | No text below 11 px; every structure stroke ≥ 1.2 px; every **beam** ≥ 1.0 px (E-7, ruling A-7). Measured at **1280 × 800**, where GRÜN's baseline is worst: min stroke 0.49 px, min SVG text 5.96 px. |
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

---

## §11 ADJUDICATIONS — THE EIGHT CONFLICTS GRÜN MEASURED

GRÜN took its own red baseline on `86e36924` (ports 3030/3031, its own instrument) and found eight places where
this document contradicts itself or the code. Every ruling below is GELB's. Where GRÜN measured better than I did,
that is said plainly.

| # | Conflict | Ruling |
|---|---|---|
| **A-1** | **E-8 would have made it worse.** The svg already sits inside the section at all four sizes; sizing against 100 % of the section would push its bottom from 945 to ~993, because the section is 960 px tall at 1829 × 912. | **GRÜN is right and my M-5 diagnosis was wrong in direction.** The section is *taller* than the window, not offset below it. Ruling: size by container units against the section **and** clamp, in a layout effect, to `min(section bottom, innerHeight) − gutter`. Bounds on the clamp: it is stage-owned, the host is untouched, it must converge in one pass (no measure → resize → measure loop), and it carries `data-stage-clamp` with the px it applied so PINK can measure the decision and not only the result. |
| **A-2** | **"EVIDENCE: no position change" is unsatisfiable**, because distance *is* fit. | Accepted; wording replaced in §3. Own evidence ⇒ **cut** plus transient. Displaced by others ⇒ eased, no luminance. The protected promise was always the second one. |
| **A-3** | **The sign table's per-state luminance crosses the classes** (UNCLEAR 0.55 < NAME_EXACT 0.70). | GRÜN proposed dropping the per-state luminance from the drawing. **Overruled, in GRÜN's favour but further:** map the table value monotonically **inside** the class band. Class recoverable from luminance alone, state gradation kept, table byte-identical. Bands in §2. |
| **A-4** | **The phase-lock pulse** (3.2 s, luminance 0.55 ↔ 1.0, always on) breaks E-1, R4 and R6 at once. | Removing the animation: **accepted**. But the attribute alone is not a drawing. The phase-lock must keep a **static form that does not use luminance** — a mark — or, if the table defines none, its absence is stated in the provenance line. A sign that is carried only by a data attribute is not carried. |
| **A-5** | **The pending breath** (4.8 s while RUNNING) is motion while pending. Removal accepted. GRÜN asked to keep the **resume pulse** (6 s) because E-6 does not name it. | **Overruled: the resume pulse becomes static too.** E-6's signal is "while something is pending, the field is still". One exception destroys it — if the ring stops and a pulse starts, stillness no longer means pending. The resumePending *state* keeps its sign as a static outline, distinct from the pending outline. No semantics are lost; only the form changes, which B-5 permits and E-6 requires. |
| **A-6** | **Static dims multiply luminance** and mix the classes across groups. | **Accepted, with the reason GRÜN did not give:** a multiplicative gain **preserves ratios**, so a dimmed context group keeps its internal ladder exactly. The contract is therefore *per group*, and P-2 is restated that way. Bound: the focused group is never dimmed, and a context group is distinguishable from the focused one. Query highlight is motion (E-3); the static luminance highlight exists **only** under reduced motion. |
| **A-7** | **Beams are 0.7 / 0.8 px**, below E-7's 1.2 px floor; GRÜN argues they are sign, not structure. | **Partly overruled.** E-2 has just made beams the L0 grouping instrument, so they must be legible (R11). But the table's *relative* weights are sign and stay: scale all beam widths by a **common factor** — ratios preserved, as in A-6 — so the thinnest beam reaches **≥ 1.0 px**. The floor is 1.0 px rather than 1.2 px because a long collinear line is detected more easily than a short mark of the same width; every other stroke keeps 1.2 px. `k` from the measured on-screen width: **accepted**. |
| **A-8** | **"Strongest coupling"** needed a definition. | Accepted: highest requirement value among the beam-bearing couplings, ties broken by ring order, then by `poolRequirementId` — a **total** order, so GRÜN's and PINK's renders pick the same beam. |

**Two readings of GRÜN's that correct mine and are adopted into §0:** the elements outside the stage box are the
**sector names** (2 at every size), not bodies — so P-7 is about the field's own labels, and my harness, which
counted only bodies, nodes and the field ring, was measuring the wrong set and has been widened. And at
**1280 × 800** the baseline is far worse than at the size I measured: min stroke 0.49 px, min SVG text 5.96 px.
P-8 is therefore measured at 1280 × 800.

**Standing instruction to GRÜN, unchanged:** where a bound and a measurement disagree, the measurement wins and I
rewrite the bound. A-1, A-2 and A-3 are exactly that, and finding them before delivery is the point of the lane.

---

## §12 PINK'S INDEPENDENT RE-DERIVATION, AND THE HOLE IT FOUND IN P-6

PINK re-derived §0 on `86e36924` in its own worktree, on a **production build** (`next build` + `next start`)
rather than a dev server, and reproduced the geometry to the pixel. **M-1, M-2, M-4 and M-5 confirmed
independently.** Three notes, each ruled here.

**N-1 — M-3 is window-dependent (accepted).** PINK read 12.67 px nodes and 9.5 px bodies at 1600 × 1000 against my
11 px and 8 px at 1829 × 912; both are right, because the drawn size scales with the stage factor `k` and PINK's
window gives the larger stage. §0 now carries the window with the numbers, and E-7 is measured against its fixed
bounds at the worst size — never against those two figures.

**N-2 — the mechanism (accepted, and it corrects my correction).** PINK's arithmetic is now §0. It also settles
A-1 more precisely than A-1 did: my M-5 was **incomplete, not wrong in direction**. There really is a 61 px bar
above the `top: 142px` box — my original reading — *and* the section is 960 px tall at a 912 px window — GRÜN's
reading. Both are true and E-8 must defeat both, plus the third source PINK isolated at 1280 × 800. A-1's sentence
"wrong in direction" overstated it and is corrected here rather than quietly edited there.

**N-3 — P-6 could never have gone red, and my strengthening of it.** PINK found the cause: a pre-existing blanket
guard at `PersonJobMappingField.tsx:85` —

    @media (prefers-reduced-motion: reduce) {
      [data-testid="mapping-field"], [data-testid="mapping-field"] * { animation: none !important; transition: none !important; }
    }

— already neutralises every CSS animation and transition in the field, which is why my harness measured 0 offenders
over 142 elements. **P-6 as I wrote it is therefore not merely vacuous today; it would stay vacuous after delivery.**

Worse, and this is the part neither lane had reached: that guard is **CSS-only**. It cannot stop a
`requestAnimationFrame` loop or any JS that writes transforms, attributes or opacity directly. If E-3's query
oscillation or E-6's breath is implemented in JS, every computed `animation-duration` stays `0s` **while the field
keeps moving**, and P-6 passes while failing. P-6 is therefore restated:

> **P-6 (restated).** Under `prefers-reduced-motion: reduce`, (a) no element in the field carries a non-zero
> computed animation or transition duration, **and (b) the field does not move**: sample every drawn element's
> geometry and opacity twice, at least 2 s apart, with no interaction between the samples — every value identical.
> (b) is the binding half; (a) alone cannot fail while a JS loop runs.

**Red-first for P-6** is consequently a **guard mutant**: narrow or remove the blanket at `:85` and the new motions
must turn P-6 red. PINK mutates the guard independently to confirm the test bites. If GRÜN implements any motion in
JS, (b) must be shown red by *disabling the JS reduced-motion branch* as well — two mutants, not one.

**Environment note, recorded so the lanes' numbers reconcile:** PINK measures on a production build because
headless Turbopack `next dev` would not hydrate the field in its setup. The production build reproduces the dev
geometry to the pixel, so the build mode does not move what P-7 measures. Zero external requests on every run
(B-4/B-6 baseline clean on PINK's instrument as well as mine).

---

## §13 GRÜN'S FIRST GREEN — ONE READING ADOPTED, TWO BOUNDS ADDED, ONE QUESTION OPENED

**M-4b, adopted into §0 from GRÜN's red baseline.** GRÜN measured the closest class ratios at base as **0.786 and
0.625** — below 1, meaning the ladder is not merely flat (M-4a, 1.01) but **inverted** where the sign table's
per-state luminance crosses the classes: UNCLEAR (SEMANTIC) 0.55 against NAME_EXACT (LEXICAL) 0.70 gives 0.786, and
0.25 against 0.40 gives 0.625. The strongest statement of the defect E-1 exists for: today a *checked* coupling can
be drawn **dimmer** than a *name-only* one. A-3's bands are what fix it.

**E-8b — the clamp must be scroll- and resize-invariant.** GRÜN's clamp reads the section's **document** top. The
host scrolls (E-8a), so document top and viewport offset diverge the moment the page is scrolled — a reload with a
restored scroll position would compute the clamp from a relationship that no longer holds. Bounds:

1. the clamp is computed from **viewport-relative** geometry (`getBoundingClientRect`), not document coordinates;
2. it is **recomputed on resize**, and converges in one pass at the new size;
3. it is **invariant under scrolling**: scrolling the host and returning must not change the clamp.

PINK tests (3) by scrolling the host, then resizing, then measuring P-7 — a path neither GRÜN's harness nor mine
currently walks.

**The four proofs not yet reported.** GRÜN's green list covers P-1, P-2, P-3, P-5, P-7, P-8 and E-5. **P-4**
(evidence transient versus layout gradient — the heart of A3), **P-9** (golden vectors byte-identical — B-1),
**P-11** (the three mutants) and **P-12** (the sign table unchanged — B-5) are unreported and are not optional.
P-9 and P-12 are the two that guarantee phase E changed only how the field is seen, never what it says.

**An open question for OTTAVIO, surfaced by the fix.** GRÜN's clamps are 569 / 769 / 681 / 1069 px against the
unclamped 520 / 830 / 742 / 1100. At three of the four sizes **the stage is now smaller than before**: the fit was
bought with stage area, because the binding constraint is height and 203 px of it (61 px host bar + the field's own
`top: 142px`) sit above the stage. If the field's own 142 px is not load-bearing against the focus strip, lowering
it would give every window roughly that much more stage — the A2 goal — without touching the host. **GELB does not
decide this**: it trades readable size against the risk of colliding with the strip, and the collision is a visual
judgement. Recorded for the acceptance.

---

## §14 THE INSTRUMENTS, VALIDATED AGAINST THEMSELVES

**P-6 is red-first, proven.** PINK narrowed the `:85` blanket to a nonexistent attribute, rebuilt and re-measured:
(a) 8 offenders, (b) 5 moved — `mapping-tick-*` opacity 0.719 → 0.582 over 2.2 s. Guard reverted, tree clean. The
test bites exactly when the guard goes, which is what §12 demanded.

**PINK reported two defects in its own harness, and that is the behaviour this lane depends on.** A blind inverse
instrument is worse than none, because it converts an unknown into a false assurance.

1. **Its P-6(b) sampler was blind.** Phase-D CSS motion animates `<g data-testid="mapping-tick-*">` **groups**, and
   a group's opacity does not appear on its children's computed opacity. PINK's first sampler queried shape tags
   plus `g[body|node]` only, and reported *movedCount 0 with motion on*. Carried into the delivery pass, a
   JS-moving field would have passed P-6(b) — the exact failure N-3 exists to catch. Fixed to sample every SVG
   descendant and read each element's own computed opacity.
2. **A unit confusion in P-8.** PINK first read min stroke 0.983 and min text 12.01 in **SVG user units** against
   GRÜN's and my 0.487 / 5.96 in **rendered px**. The ratio is the viewBox→viewport scale, ×0.496 at 1280 × 800,
   and the instruments agree once converted.

**Binding convention, from that second defect:** every length in E-7 and P-8 — the 1.2 px stroke floor, the 1.0 px
beam floor, the 12 px body floor, the 11 px text floor — is **rendered CSS pixels at the measured window size**,
never SVG user units. A bound in user units would scale with the stage and could not express legibility at all.

**GELB's own control, run because PINK's finding applies to every instrument including mine.** My P-6(b) sampler
queries `[data-testid="mapping-field"] *`, so it reaches the groups — but it had never been *shown* to detect
anything. With motion on: **135 elements, 5 animating, movedCount 5** — the same five tick groups PINK names, same
direction. Under `reduce`: 5 → 0 animating, movedCount 0. The sampler is now validated rather than assumed.

**P-7's corrected set, confirmed by two instruments.** The elements outside the stage box are the **sector names**,
and they overrun **left and right** at all four sizes (PINK at 1829 × 912: name-A left 523.1 against stage left
543.5; name-B right 1311.1 against stage right 1285.5), where the SVG's `overflow: hidden` clips them. So this is
not only a containment failure but a **legibility** failure: the pool names are cut today. E-8 must **contain** the
field's own labels, not clip them. `stage-inside-section` already held at base, and the section top measures 61 at
every size — the 61 px offset of §0, re-confirmed independently a third time.

---

## §15 E-8c — THE 142 px IS NOT LOAD-BEARING, AND THE STAGE GETS THE SPACE BACK

§13 left open whether the field's own `top: 142px` is forced by the focus strip, and said GELB would not decide a
visual collision. Measured, it is not a judgement: **there is no collision to risk.**

| window | focus strip | stage box top | first **drawn** pixel | empty band between strip and drawing |
|---|---|---|---|---|
| 1280 × 800 | ends at y = **120** | 203 | 215 | **95 px** |
| 1829 × 912 | ends at y = **120** | 203 | 220 | **100 px** |
| 2560 × 1300 | ends at y = **120** | 203 | 228 | **108 px** |

The strip's bottom edge is **120 at every size** — it does not move. The stage box begins 83 px below it, and the
first drawn pixel a further 12–25 px below that, because the field is a circle inscribed in a square and its top
corners are empty. So between the strip and anything visible there are **95 to 108 px of nothing**.

**E-8c.** The stage's own top offset becomes a named constant, bound to **≥ 8 px below the focus strip's measured
bottom** rather than a hardcoded 142. The left neighbour is checked too: the reading panel ends at x ≈ 335 against
a stage left edge of 380 at the narrowest window, so the panel is not in the way either.

**What it is worth, measured per window — and it is not uniform:**

- **1829 × 912** height binds (budget 742, clamped 681). Moving the top to ~128 gives ~756 → **about +75 px**, which
  more than returns what A-1's clamp cost.
- **2560 × 1300** the **1100 px cap** binds, so the gain is only ~31 px. The cap, not the gutter, is the limit at
  large windows, and raising it is a separate decision nobody has asked for.
- **1280 × 800** the **width** budget binds (`100vw − 760` = 520 = the current stage). Height is already slack, so
  E-8c gains **nothing** there. The narrowest window needs width, not height.

**Still OTTAVIO's, and still one constant.** The measurement removes the collision risk, not the taste: a stage
that begins 8 px under the strip may read as crowded even though nothing overlaps. E-8c is implemented and
reversible by that one constant, and the acceptance decides whether the regained space is worth the tighter top.

---

## §16 GELB'S MEASUREMENT OF THE TIP — ELEVEN OF ELEVEN, ONE DEFECT IN MY OWN SPEC

GRÜN delivered **`716a1941`** (parent `86e36924`, 10 files, +1177/−135, clean tree, local only). The entry set
holds: only `PersonJobMappingField.tsx`, `mapping-field-copy.ts`, `lib/career/view-model/mapping-field.ts` and
tests. Selector, host, layout and URL files untouched.

**My instrument, on my own worktree at the tip: 11 of 11.** P-1 three PRIMARY beams for five bodies · P-2 bands
SEMANTIC 1.000, LEXICAL 0.528, NONE 0.232, closest ratios **1.89 and 2.28** · P-3 two members, one phase (`0s`),
period 1.4 s · P-5 `mappingFieldRingBreath` 10 s · P-6 both halves · P-7 **0 elements outside the stage box at all
four sizes**, stage 520/840/756/1100 against the phase-D 520/830/742/1100 — containment was **not** bought with
area · P-8 at 1280 × 800 stroke 1.2, beams 1.57, text 11.02, four bodies at the floor · P-10 five GET reads, zero
external.

**One disagreement, and my instrument was the wrong one.** I measured min stroke 0.48 px against GRÜN's 1.202. The
two elements were `<path stroke="none">`: my filter tested the *attribute* for null, so it counted strokes that
paint nothing. Corrected — a stroke that paints nothing is not a stroke — and my figure is now 1.2 px, GRÜN's.

**Two browser gaps GRÜN declared, which my façade could close and its could not:**

- **The breath while pending.** Serving `autoMatchBody("RUNNING")`: `data-pending-breath="true"`, the ring carries
  `data-breath="STILL"`, `animation-name: none`, and **0 of 158 elements moved over 2.6 s**. E-6's inversion holds
  end to end, not only in unit tests. (Six elements reported a non-zero `animation-duration` — one-shot staged
  reveals, iteration 1, already finished. A finite animation keeps reporting its duration after it ends, so §12's
  half (a) over-reports; only half (b), *nothing moves*, is sound. Recorded as a refinement of §12.)
- **A crowded constellation** and **P-4 end to end** — the second found a defect.

### The defect: an evidence change arrives silently

I served a second reading in which exactly one requirement of the all-states role goes **COVERS → EQUIVALENT**.
Both carry value 1, so fit (0.35), rank (2), tier and the whole rank order are **identical**: a pure evidence
change that moves nothing. Sampled in the browser every **120 ms**, 127 samples, through the app's own polling
path:

| | measured |
|---|---|
| the arc's `data-state` | COVERS → EQUIVALENT at sample 96 (+12.06 s) — **the change arrives** |
| elements ever marked `data-change="EVIDENCE"` | **0**, peak across all 127 samples |
| the changed arc's `filter` / `animation-name` | `none` / `none`, at every sample |
| body positions (group transform) | **0 of 5 changed** |

**An evidence change reached the screen with no transient, no mark and no statement.** This is precisely the
change-blindness case R12 names and E-9 was written to forbid.

**It is my hole, not GRÜN's.** `data-change` is set on `[data-mapping-body]` alone, and `bodyMovements` raises
EVIDENCE only from `ROLE_TIER_CHANGED` / `ROLE_FIT_CHANGED` — that is, only when the body **moves**. E-4's table
binds EVIDENCE and LAYOUT as kinds of *movement*, inherited from phase D's A3, and I never bound the case
*evidence changed, nothing moved*. GRÜN implemented E-4 as written. P-4 passes at unit and CSS level for exactly
the cases the spec names.

**The fix crosses no boundary.** The phase-B delta already emits `REQUIREMENT_STATE_CHANGED` and
`REQUIREMENT_KEY_CHANGED` (`lib/career/mapping/delta.ts`, B-1, byte-identical since phase B), and
`lib/career/view-model/mapping-field.ts:365` **already calls `diffRankings`** — it consumes the role-level kinds
and discards the requirement-level ones. The information is computed and thrown away.

> **E-4b.** A requirement whose own evidence changed carries `data-change="EVIDENCE"` and the same luminance
> transient as a body, **whether or not anything moved**. It is raised from the existing
> `REQUIREMENT_STATE_CHANGED` / `REQUIREMENT_KEY_CHANGED`; no new delta, no new semantics, `lib/career/mapping/`
> still byte-identical. E-9's statement names it in the provenance line.
>
> **P-13.** A reading in which exactly one requirement's state changes and no fit, rank, tier or order changes
> must mark that arc EVIDENCE, give it the transient, and move nothing. **Red-first**: on `716a1941` it is red —
> measured above, peak marks 0. **Inverse**: a reading in which nothing changes must mark nothing.

Still open and declared: the **LAYOUT** direction is browser-unproven (unit and CSS only), because a displacement
caused by *another* role is hard to provoke through a fixture pair without changing the displaced role too.
Stated, not hidden.
