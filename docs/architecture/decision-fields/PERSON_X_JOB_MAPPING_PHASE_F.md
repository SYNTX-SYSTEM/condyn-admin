# PERSON × JOB · MAPPING FIELD · PHASE F — THE LIVING ORGANISM

**Mandate (OTTAVIO, 2026-11-06): SFE::PHASE E VISUAL ACCEPTANCE — rejected.** The visual acceptance of phase E took
place. *"Das Ergebnis reicht gestalterisch noch lange nicht. Das Feld wirkt weiterhin zu dunkel, zu statisch und zu
wenig lebendig. Die vorhandene Atmung ist beim Betrachten praktisch nicht wahrnehmbar. Die semantischen Körper und
Kopplungen entfalten noch nicht die gewünschte räumliche Wirkung."* Required: a far deeper symbiotic, semiotic and
neurovisual design; the whole field is to live and breathe as one connected system of spatial, visual, temporal and
semantic relations; it must fascinate, calm, create clarity and act immediately on the viewer. Research and develop
the design and the technology independently; exhaust the solution space. No prescribed single animations, no
prescribed implementation path. **The visual effect is to be checked in the running browser, not in test values.**
**PINK's existing GO is not a design acceptance.** Gemini stays off. Existing semantics and boundaries preserved.
No merge, no deployment.

**Base.** `PHASE_F_BASE = 9cc06f84` — GRÜN's phase-E delivery, carrying PINK's GO (PHASE_E §19). That GO is an
engineering fact and is not withdrawn: it says phase E does what phase E's contract says. OTTAVIO's rejection says
phase E's **contract was the wrong contract**, and that is a GELB defect, not a GRÜN one. **The phase-E GO does not
carry to any phase-F commit**; PINK runs its own pass against the phase-F tip.

**What phase F is not.** It adds no semantics and removes none. The sign table, the ten coupling states, the
evidence bands, the delta kinds and every `data-*` attribute keep their meaning and their values. Phase F changes
only how the existing signs are painted and how the field holds still or moves between them.

---

## §0 THE READINGS THIS PHASE RESTS ON

Measured by GELB on `9cc06f84`, served at the local phase-E façade (variant `default`), Chromium, **1920 × 1080**
— the size OTTAVIO judged it at — with 1280 × 800 as a second size. Relative luminance throughout: the WCAG
linearisation of the rendered sRGB pixel, `0.2126 R + 0.7152 G + 0.0722 B`, range 0…1.

**These are pixel readings.** Every phase-E proof (P-1 … P-13) read the DOM: an attribute, a computed style, a
geometry. Not one read a pixel. The defect OTTAVIO found lives entirely in the rendered image, and the whole
phase-E proof surface was blind to it **by construction**. That is the single lesson of the rejection, and §7
rebuilds the proof surface on pixels because of it.

| # | Reading | How |
|---|---|---|
| **M-F1** | **The stage is 99 % black.** Over the field's own square (924 × 924 px): mean 0.00325, p50 **0.00145**, p90 0.00496, p99 0.01441, max 0.635. Above 0.05: **0.31 %** of pixels. Above 0.2: **0.135 %**. | screenshot of the svg's box, luminance histogram |
| **M-F2** | **The field adds almost nothing to its own disc.** Inside the field ring, p50 **0.00167**; with the field's svg hidden, the bare ground underneath is p50 **0.00145**. Above 0.005: 7.7 % of the disc. | every pixel inside the field ring, drawn and with the drawing suppressed |
| **M-F3** | **The host does *not* bleed through.** With the svg hidden, nothing inside the disc exceeds **0.0089**; the fraction above 0.01 is **0**. | same suppressed render |
| **M-F4** | **The marks are not too dark.** Body peaks 0.307 … 0.547 against a local ground of 0.0014 … 0.0053; capability nodes 0.443 … 0.517. The image is binary — bright points on black, no mid-tone anywhere. | per-element peak (p98 inside) vs median of a 10 px surround |
| **M-F5** | **The whole breath is one hairline at the rim.** Over a full 10 s period: peak per-pixel swing 0.0427, p999 0.0205; 9.7 % of stage pixels swing at all, and **48 % of every moving pixel sits in the outermost tenth of the radius** (39 867 of 82 784). The ±1.5 % scale of a 1.2 px ring at R ≈ 460 px sweeps a ~14 px annulus and nothing else. | per-pixel temporal (max − min) across 24 frames, binned by radius |
| **M-F6** | **Motion at rest is 0.00016.** The stage's mean per-pixel change from one half-second to the next, averaged over 23 steps. | mean abs frame difference |

**Two defects in my own instrument, both found before any number above was used.** (a) A fresh browser profile puts
the guided onboarding overlay over the stage; my first run measured the entire field through its scrim. The probe
now sets `condyn_onboarding_seen` before navigation **and asserts the overlay is absent**. (b) My first M-F2
sampled 265 points I chose on four radii — it reported where I looked, not the disc, and it returned "host bleed
is zero" while the screenshot plainly showed host panels inside the field. It now reads every pixel in the disc.

**One hypothesis of mine the measurement killed.** I read the screenshot and concluded the host's six orbit panels
were bleeding through the 0.92 ground and competing with the field's marks, and I was ready to spend the phase on
`STAGE_GROUND_ALPHA`. M-F3 says they are not: the host's ghost inside the disc is bounded at 0.0089, below the
field's own faintest ring. The panels are visible only because **the field leaves its own disc empty enough for the
host's ghost to be the one thing in it with any structure.** The fix is not to suppress the host. It is for the
field to fill its own disc with light.

---

## §1 FIELD — WHAT THE NERVOUS SYSTEM ACTUALLY DOES

R1 … R12 (PHASE_E §1) stand unchanged. These continue the numbering. Confidence is marked, because two of the
things that sound most rigorous in this area are not.

**R13 · Weber's fraction is not 1 % on a dark field — it rises steeply as luminance falls.** *(firm)* The ~1 % JND
is a rule of thumb for an adapted observer at photopic level, and strictly for adjacent regions across a sharp
boundary. Weber's fraction *increases rapidly for reducing brightness levels*, as the eye moves from photopic
toward scotopic. The contrast threshold obeys the Weber relation only at higher mean luminance; below that it
follows a different law.
→ Phase E specified the breath as a **ratio** (opacity 0.96 ± 0.04 of a stroke already at 0.15 alpha) and never as
a rendered luminance difference. On a field whose median pixel is 0.0015, that is below threshold **by
construction**, and no care in the CSS could have rescued it. Phase F states every perceptual bound as a measured
luminance difference in the image.

**R14 · At low contrast, motion thresholds fall with stimulus SIZE: low-contrast motion is spatially integrated.**
*(firm — this is the hinge of the phase)* Large stimuli gave lower motion thresholds than small ones **at every
speed tested**; summation dominates at low contrast, while surround suppression appears only at high contrast.
Channels tuned to low spatial frequencies are found at far greater eccentricities than high-frequency ones.
→ The way to make the breath perceptible is **not** to raise its contrast. It is to raise its **area** and lower
its **spatial frequency**. A thin bright ring at the rim is the worst possible instrument; a wide, soft, dim field
is the best one. And this is the *calm* answer as well as the visible one, because the amplitude goes **down**.
Phase E reached for the one knob that could not work.

**R15 · Contrast sensitivity is band-pass at high luminance and low-pass at low luminance.** *(firm)* At low light
photon noise and early neural noise dominate; low spatial frequencies reach Weber behaviour at far lower luminance
than high ones. On a near-black field the eye is a low-pass device: it keeps coarse structure and loses fine
structure.
→ Phase E drew **only** fine structure — 1.2 px strokes, 1.2 px rings, 3 px nodes. A dark-adapted eye receives
almost nothing from it. The field must carry coarse, low-spatial-frequency luminance structure or it does not
reach the observer at all.

**R16 · Depth reads from contrast, haze and shading.** *(firm)* Atmospheric perspective is produced by **reducing
the contrast** of deeper objects and adding haze; distant things look hazier. Shading gives apparent depth —
without it, even well-drawn objects appear flat. Subtle blur works better than strong blur.
→ Rank is already radius. Re-encoding rank as contrast and haze turns the ranking from a position to be read into
a **depth to be perceived**. Congruent with the existing spatial mapping (R6, Tversky), so it adds no load.

**R17 · Ambient displays live in a corridor, not a direction.** *(firm)* Calm technology engages peripheral
attention only as needed; ambient information should be perceivable at a glance; changes that are "change blind"
sit at the lowest notification level — **and overly pulsing lights are too distracting.**
→ There is a floor *and* a ceiling. Below the floor the field is dead, which is where phase E sits. Above the
ceiling the field nags, which would fail "beruhigend" just as badly. **Phase E bounded the breath from neither
side.** Every phase-F rhythm is bounded from both.

**R18 · 0.1 Hz pacing and the 4 : 6 waveform.** *(firm for the waveform, and deliberately *not* used for the
claim it is usually used for)* Breathing near 0.1 Hz is associated with relaxation and raised HRV; the standard
screen pacer uses a **4 s rise : 6 s fall** ratio, and longer exhalation at this rate is associated with lower
arousal than equal or inhale-weighted ratios. 0.1 Hz pacing is accompanied by stable pupil oscillations and fewer
attention lapses.
→ Keep 0.1 Hz (E-6 was already right) and replace the symmetric sinusoid with the asymmetric **4 s : 6 s** form,
the longer limb falling. **Honest limit, recorded as a boundary:** this literature is about pacing *the observer's
own breathing*, and it carries a counter-finding — untrained people can hyperventilate while following a pacer.
We are not pacing anyone's breathing and must not imply that we are. The warrant taken here is **only the shape of
the waveform**. The field therefore never instructs, prompts or invites the viewer to breathe with it; the rhythm
stays ambient. Phase F takes the form and leaves the claim.

**R19 · 1/f "pink noise is calming" is NOT established, and is not used.** *(negative finding — recorded so it is
not reached for later)* The search returns a large, confident literature on this that is almost entirely
commercial and wellness writing. The one perceptual result found is about autostereogram depth matching, not
calm or preference. No peer-reviewed evidence was found that 1/f visual fluctuation is preferred or calming.
Phase F therefore builds **no** 1/f or noise-driven rhythm. It would have been easy, it sounds rigorous, and the
evidence is not there.

**R20 · Light-on-dark is the right polarity at low contrast.** *(moderate)* At low contrast, observers locate
**light** targets faster and more accurately than dark ones; the advantage reverses only as contrast rises.
→ The field's existing polarity — light marks on a dark ground — is correct and is kept.

---

## §2 RELATION — WHAT CARRIES WHAT

Phase E's channel assignment (E-1 … E-3) stands. These say what the *new* light is allowed to mean, and the
answer is almost always **nothing**: the new light carries presence, space and time, never evidence.

### F-1 The disc carries its own light (R15, R14, M-F2)

The field disc gets a **ground**: a low-spatial-frequency radial luminance field centred on the person, drawn
beneath everything, clipped to the field disc. It is not decoration. It is the medium the marks sit in, and the
carrier of the breath (F-5) and of depth (F-3).

| Bound | Value | Today |
|---|---|---|
| disc median relative luminance, breath at mean phase | **∈ [0.006, 0.020]** | 0.00167 |
| disc fraction above 0.005 | **≥ 0.55** | 0.077 |
| body peak ÷ disc median | **≥ 20** | ~300 |

The ceiling and the last row exist to protect the evidence. Raising the ground must not eat the bands: **E-1/A-3's
evidence-band separation must still hold on rendered pixels after F-1** (PF-2). That is the real risk of this
phase and it is proved, not assumed.

### F-2 A body is a volume, not an outline (R15, R16, M-F4)

Each body is drawn as: a radial-gradient **core** (bright centre, falloff), the **existing outline** unchanged, and
a soft **halo** out to ≈ 2.5× the body radius at very low luminance.

The outline keeps every semantic it has — `data-line` is still the coupling class, the dash is still the sign
table's word. **The core and the halo carry no state whatsoever**: same form for every body, scaled only by F-3's
depth gain and modulated only by F-5's breath. If a reader could infer anything from a body's fill, F-2 is wrong.

| Bound | Value |
|---|---|
| drawn footprint (pixels above local ground + 0.002) ÷ outline footprint | **≥ 6** |
| halo peak ÷ core peak | **≤ 0.25** |

### F-3 Depth is rank, and nothing else (R16, R6)

One gain per body, taken from its radial position: near the person → higher core luminance, tighter falloff,
smaller halo; near the horizon → lower luminance, softer falloff, wider halo. Monotone in rank.

**Adjudication (the conflict this creates, resolved).** A depth gain is multiplicative, so within one body it
preserves ratios — but between two bodies it could push one evidence class across another's band and destroy
E-1/A-3. Therefore: **the depth gain applies to a body's core and halo only. It never touches that body's arcs,
ticks, beams or text.** Depth rides the body; evidence rides the mark. The two never meet.

| Bound | Value |
|---|---|
| gain monotone non-increasing in rank | required |
| gain(rank 1) ÷ gain(last drawn rank) | **∈ [1.5, 3.0]** |
| luminance difference between same-class marks on different bodies | **≤ 2 %** |

### F-4 Pools are regions (Gestalt common region)

The sector wedges get a faint multiplicative modulation of the ground, alternating between two levels so the pools
read as territories rather than as two labels at the rim. Modulation **± 8 %** of the local ground, no hue.

| Bound | Value |
|---|---|
| wedge modulation peak above local ground | **≤ 0.004** |
| and strictly below every mark's luminance | required |

### F-5 Beams become light paths (R16)

A beam gets a luminance gradient along its length — dimmer at the capability end, brighter at the requirement end,
so the line points at where the evidence is — and is drawn **under** the bodies, so a body occludes the beams
behind it (occlusion is a depth cue). Stroke width and dash stay exactly as `BEAM_STROKE` says. The gradient is one
constant form on every beam and multiplies, so `PRIMARY_BEAM_LUMINANCE` vs. selection opacity keeps its ratio.

---

## §3 STATE — TIME, AND WHAT IT IS ALLOWED TO MEAN

### F-6 The breath becomes the organism, and its origin is the person (R14, R13, R18, M-F5)

The breath is no longer a ring that scales. It is a **radial luminance wave in the ground, originating at the
person and travelling outward.**

| Property | Value | Why |
|---|---|---|
| period | **10 000 ms** (0.1 Hz) | E-6, unchanged; 30× under the WCAG 2.3.1 three-flash threshold |
| waveform | **4 000 ms rise : 6 000 ms fall** | R18; replaces phase E's symmetric sinusoid |
| propagation | phase delay ∝ radius; the wave reaches the field edge **1 200 ms** after the centre (12 % of the period, 43°) | enough to read as flow, little enough to stay **one** organism |
| what it modulates | the **ground**, and every body's **halo** | R14: large area, low spatial frequency |
| what it never modulates | any mark, arc, tick, beam, node, text | the semantic firewall, below |

**The semantic firewall.** The breath never touches evidence. Evidence luminance is static. E-1/A-3 therefore
cannot be disturbed by the breath, and no viewer can ever mistake a phase of the breath for a value of the
evidence. This is proved (PF-8), not asserted.

**The amplitude corridor (R17), bounded from both sides for the first time:**

| Bound | Value | Today |
|---|---|---|
| floor — at some moment in the period, the fraction of disc pixels differing from their own period-minimum by ≥ 0.004 | **≥ 0.25** | ~0 |
| ceiling — no pixel's temporal swing over a period | **≤ 0.030** | 0.0427 (at the rim) |
| ceiling — stage mean \|frame − previous\| at 20 fps | **≤ 0.0025** | 0.00016 |

The corridor is a derived hypothesis, not a measured preference: it says a swing of ±0.004 on a ground near 0.010,
spread over a quarter of the disc at very low spatial frequency, is comfortably above threshold (R13, R14) and far
below "pulsing" (R17). **It is falsifiable and the browser is the judge.** GRÜN and PINK may move either edge with
evidence from a real render; neither may move it by preference.

### F-7 Breath and query do not share a channel (adjudication, from E-3 and R4)

E-3 makes the query a shared-phase **translation**; F-6 makes the breath a **luminance** wave. Different channels,
so they can coexist. But R4 — one motion group at a time — still binds: **while a capability is selected, the
breath's amplitude drops to 40 %**, so the query owns the motion. (PF-10.)

### F-8 Pending is still stillness, and now it is loud (E-6, untouched and strengthened)

The breath still means exactly *live and nothing pending*, and still stops while pending, frozen or
resume-pending. Phase F changes nothing in that meaning — and gives it, for free, the phase's best gift: the
silence is now the **whole field** stopping instead of one hairline at the rim. E-6's semantics get stronger at no
cost.

New obligation phase E could not have had: with `data-breath="STILL"`, **every pixel's swing over a full period
≤ 0.002** (PF-9).

### F-9 Reduced motion freezes the organism at one phase

Under `prefers-reduced-motion: reduce` the wave is frozen at phase 0 (the mean), the ground and halos are static,
and the field does not move. **P-6 (b) is restated at pixel level**: sample the rendered image twice at least 2 s
apart with no interaction between the samples — **every pixel identical**, not every element's geometry. This is
strictly stronger than phase E's version, and it is the test that catches a rAF-driven wave that a CSS blanket
cannot stop — which is exactly the mutant PINK proved live in phase E (PHASE_E §19).

---

## §4 BOUNDARY — WHAT PHASE F MAY NOT TOUCH

- **B-F1 · No semantic change.** The sign table, `CLASS_LINE`, `LINE_DASH`, `BEAM_STROKE`, the ten coupling
  states, the evidence bands, the delta kinds, and every `data-*` attribute: unchanged in meaning and in value.
- **B-F2 · Every phase-D and phase-E test passes unchanged.** If a phase-E test goes red, phase F is wrong — not
  the test. Any exception is adjudicated in writing in this document before it is taken.
- **B-F3 · The phase-E contracts hold on pixels.** E-1/A-3's bands, E-7's floors (strokes ≥ 1.2 px, text ≥ 11 px,
  bodies ≥ 12 px), E-6's meaning, E-5's staging, E-4/E-4b's transient.
- **B-F4 · Nothing phase F adds is interactive.** Every added element is `pointer-events: none` and out of the
  accessibility tree. No new focusable element, no new hit target, no change to the tab order.
- **B-F5 · No per-frame script write to SVG geometry** outside the existing E-5 stage tween at
  `PersonJobMappingField.tsx:338`. The wave is composited (CSS animation on a small number of layers, staggered by
  `animation-delay`), never a per-frame attribute write. This keeps the frame cost flat and keeps
  `prefers-reduced-motion` working natively.
- **B-F6 · The host is not touched.** Phase F works inside the stage section only. `STAGE_GROUND_ALPHA` is **not**
  the lever (M-F3) and is not moved by this phase.
- **B-F7 · No new network call, no storage, no Gemini, existing fixtures only.**
- **B-F8 · No merge to main, no deployment.** Local branches only.
- **B-F9 · WCAG.** 2.3.1 three-flash: trivially met at 0.1 Hz. 2.3.3 / `prefers-reduced-motion`: binding (F-9).
- **B-F10 · The field never prompts the viewer to breathe with it** (R18's honest limit). No copy, no cue, no
  instruction anywhere ties the rhythm to the viewer's own breathing.

---

## §5 AUTHORITY — WHO DECIDES WHAT

| Who | Decides |
|---|---|
| **OTTAVIO** | whether the field is beautiful, alive and calm. The only acceptance that counts. Every numeric corridor in this document is a means to that end and is subordinate to his eye. |
| **GELB** | the architecture, the channel assignment, the boundaries, the proof obligations, and the adjudication of any conflict between them. |
| **GRÜN** | the implementation and its technology, within §4. The *how* is explicitly GRÜN's: the mandate forbids a prescribed implementation path, and §2/§3 state effects and bounds, not code. |
| **PINK** | independent and inverse verification on its own render with its own instrument. A GELB or GRÜN measurement is never PINK's evidence. |

**No lane's report is another lane's measurement.** Phase E produced three broken instruments — two PINK found in
itself, one of mine GRÜN found, one of mine PINK found. Phase F assumes the same rate.

---

## §6 DELTA — THE CHANGE SET

| # | Change | Touches |
|---|---|---|
| 1 | the ground: concentric low-frequency luminance layers under everything, clipped to the disc | new `<g>` at the bottom of the svg |
| 2 | body core + halo gradients | `<defs>`, body `<g>` |
| 3 | depth gain by rank on core and halo only | body `<g>` |
| 4 | sector wedge ground modulation | sector `<path>` |
| 5 | beam gradient and z-order under bodies | beam `<g>` |
| 6 | the breath: wave keyframes, 4:6, staggered delay per layer; amplitude drop under selection; stop while pending; freeze under reduce | `MAPPING_FIELD_CSS`, `MOTION` |
| 7 | the pixel proof harness | test/instrument only |

Nothing in `lib/career/**` changes. The view model, the delta, the focus reducer and the sign table are untouched.

---

## §7 PROOF — THE OBLIGATIONS

**All of these read rendered pixels.** At 1920 × 1080 and 1280 × 800, variant `default` unless stated. Each must
be **red-first**: a mutant that removes the mechanism must turn the proof red, and the mutant is recorded.

| # | Obligation |
|---|---|
| **PF-1** | The disc carries light: median ∈ [0.006, 0.020]; fraction above 0.005 ≥ 0.55. |
| **PF-2** | **The evidence survives the light.** The E-1/A-3 band separation holds at the pixel level — adjacent bands' ratio **≥ 1.6 at their closest points** (floor of the upper band vs. ceiling of the lower, PHASE_E §12). Measured on rendered pixels, not computed styles. |
| **PF-3** | Bodies are volumes: footprint ≥ 6 × outline footprint; halo peak ≤ 0.25 × core peak. |
| **PF-4** | Depth is monotone in rank, ratio rank 1 : last ∈ [1.5, 3.0]; **and** same-class marks on different bodies differ by ≤ 2 % — i.e. depth did not touch evidence. |
| **PF-5** | Breath floor: ≥ 25 % of disc pixels swing ≥ 0.004 over one period. |
| **PF-6** | Breath ceiling: no pixel swings > 0.030; stage mean \|Δframe\| ≤ 0.0025 at 20 fps. |
| **PF-7** | It is a wave, not a blink: the phase of the swing is monotone in radius, total spread 1 200 ms ± 300. |
| **PF-8** | **The firewall.** Over a full period, every arc, tick, beam, node and text pixel swings ≤ 0.002. |
| **PF-9** | Pending is still: with `data-breath="STILL"`, every pixel's swing over a full period ≤ 0.002. |
| **PF-10** | Query owns the motion: with a capability selected, the measured breath amplitude is ≤ 45 % of its unselected value. |
| **PF-11** | **Reduced motion, at pixel level.** Two renders ≥ 2 s apart with no interaction: every pixel identical. Plus phase E's half (a): no element carries a non-zero computed animation or transition duration. |
| **PF-12** | Nothing phase F adds is interactive: no new element in the a11y tree, none focusable, none hit-testable; tab order unchanged. |
| **PF-13** | Every phase-D and phase-E test passes unchanged. |
| **PF-14** | No per-frame script write to SVG geometry outside the E-5 stage tween. |

**PF-2, PF-8 and PF-13 are the ones that can kill the phase.** They are the price of touching light in a field
whose whole semantics are carried by light. If any of them cannot be held, the corresponding F-rule is withdrawn,
not weakened quietly.

---

## §8 RECONSTRUCTION

From M-F1 … M-F6 and R13 … R20, phase F is forced, and in a direction opposite to the obvious one:

1. The marks are **not** too dark (M-F4). The *field* is: 99 % of the disc is bare ground (M-F2).
2. On a near-black field the eye is low-pass (R15), and phase E drew only fine structure. So the field must gain
   **coarse** light, not brighter marks.
3. The breath is invisible because it is small, thin, fast-decaying in space and at the rim (M-F5), and because it
   was specified as a ratio rather than a rendered difference (R13).
4. Low-contrast motion is spatially integrated (R14). So the breath becomes **larger and softer**, and its
   amplitude goes **down** — which is also what "beruhigend" requires (R17).
5. Rank is already radius, so depth is free (R16) and congruent (R6).
6. Everything new carries no semantics, because the semantics are already assigned (B-F1) — and the breath is
   firewalled off the evidence (PF-8) so that light can be added without the signs moving.

**If this is wrong, it is wrong here:** the corridor in F-6. The floor and ceiling are derived from threshold
literature, not from this field, this screen or this observer. They are the first thing to re-measure against
OTTAVIO's eye, and the first thing I expect to move.

---

## §9 HAND-OVER

**GRÜN** builds §2/§3 within §4, choosing its own technology. **PINK** verifies §7 independently and inversely on
its own render with its own instrument, red-first. **GELB** holds this document and adjudicates. The cycle repeats
until PINK's GO on a phase-F tip — and then, and only then, OTTAVIO's eye, which is the acceptance that counts.

---

## §10 SOURCES

R13 — [Weber's fraction and display luminance (USPTO 6271825)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/6271825) · [Changes in contrast thresholds with mean luminance](https://www.ugr.es/~colorimg/pdfs/color_2004_178.pdf) · [Smooth gradients and the Weber–Fechner fraction](https://www.strollswithmydog.com/smooth-gradients-weber-fechner-ratio/)
R14 — [Spatial and temporal limits of motion perception across variations in speed, eccentricity, and low vision (JoV)](https://jov.arvojournals.org/article.aspx?articleid=2122525) · [A behavioral receptive field for ocular following: spatial summation and its spatial frequency tuning (eNeuro)](https://www.eneuro.org/content/9/4/ENEURO.0374-21.2022) · [Spatial summation properties of the human ocular following response (PMC3430370)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3430370/) · [Peripheral vision and pattern recognition: a review (JoV)](https://jov.arvojournals.org/article.aspx?articleid=2191825)
R15 — [Image luminance changes contrast sensitivity in visual cortex (Cell Reports)](https://www.cell.com/cell-reports/fulltext/S2211-1247(21)00005-X) · [Internal noise sources limiting contrast sensitivity (PMC5803200)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5803200/) · [Luminance contrast detection is optimized for the large-scale luminance texture of the surround (Color Res. Appl.)](https://onlinelibrary.wiley.com/doi/full/10.1002/col.22723)
R16 — [Monocular depth cues (Hanover ISLE)](https://isle.hanover.edu/Ch07DepthSize/Ch07MonocDepth.html) · [Visual depth cues](https://piterpasma.nl/articles/depth-cues) · [Causes of discomfort in stereoscopic content: a review](https://arxiv.org/pdf/1703.04574)
R17 — [A taxonomy of ambient information systems: four patterns of design (Stasko et al.)](https://faculty.cc.gatech.edu/~stasko/papers/avi06.pdf) · [Effects of ambient lighting displays on peripheral activity awareness](https://www.researchgate.net/publication/316903921_Effects_of_Ambient_Lighting_Displays_on_Peripheral_Activity_Awareness) · [Designing and evaluating glanceable peripheral displays](https://www.researchgate.net/publication/221441473_Designing_and_Evaluating_Glanceable_Peripheral_Displays) · [What is calm computing? (IxDF)](https://ixdf.org/literature/topics/calm-computing)
R18 — [Resonance frequency versus fixed 0.1 Hz breathing in HRV biofeedback (Sci. Rep.)](https://www.nature.com/articles/s41598-026-53333-6) · [Training of paced breathing at 0.1 Hz improves CO2 homeostasis and relaxation (PLoS ONE)](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0218550) · [Pulmonary afferent activity during slow deep breathing (PMC6753868)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6753868/) · [Paced breathing, pupil diameter oscillations and attention lapses (Psychophysiology 2025)](https://onlinelibrary.wiley.com/doi/10.1111/psyp.70003)
R19 *(negative)* — [Pink noise (Wikipedia)](https://en.wikipedia.org/wiki/Pink_noise) · [Depth perception in autostereograms: 1/f noise is best](https://arxiv.org/pdf/1506.05036)
R20 — [Evaluating quality metrics through the lenses of psychophysical measurements of low-level vision](https://arxiv.org/pdf/2503.16264) · [Luminance contrast detection and surround texture (Color Res. Appl.)](https://onlinelibrary.wiley.com/doi/full/10.1002/col.22723)

---

## §11 ADJUDICATIONS — THE FIRST CYCLE

Six of these come from measurement rather than argument, and three of them are defects in §2/§3 as first
written. The tables in §2, §3 and §7 are amended by what follows; where they disagree, this section wins.

### A-F1 · The corridor's nominal was 4× too strong. Its ceiling was right. *(GELB, measured)*

§8 named F-6's corridor as the thing most likely to be wrong. It was. Measured on a bench reproducing the
phase-F geometry at 924 × 924 (seven staggered ground layers, 4 : 6 waveform, 10 s, 1 200 ms spread), at three
amplitudes and frozen:

| case | disc median | frac swinging ≥ 0.004 | swing p50 | swing max | mean \|ΔL\| per 500 ms |
|---|---|---|---|---|---|
| A — quarter | 0.0259 | **0.636** | 0.0048 | 0.0254 | 0.00144 |
| B — §3 nominal | 0.0252 | 0.998 | 0.0189 | **0.0938** | **0.0051** |
| C — double | 0.0238 | 0.999 | 0.0328 | 0.1499 | 0.0079 |
| D — frozen | 0.0299 | **0** | **0** | **0** | **0** |

**A is the nominal.** B modulates a median disc pixel by ±38 % of the ground and would read as throbbing, not
breathing — it breaches the ceiling by 3× and R17's "overly pulsing is too distracting" with it. A modulates by
±9 % and still clears the floor by 2.5×. This is R14 arriving in practice: once the area is large and the
spatial frequency low, **the floor is nearly free and the whole design problem moves to the ceiling.** The
corridor is therefore not symmetric, and the ceiling is the binding edge.

**Amended:** F-6's floor stands (≥ 25 % of disc pixels swinging ≥ 0.004). The ceiling stands (no pixel > 0.030).
The nominal is case A. D confirms the freeze is total, which is PF-9 and PF-11's mechanism working.

### A-F2 · The rate bound is per time interval, not per frame *(GRÜN, measured — accepted)*

GRÜN measured this machine's headless renderer at **p50 100 ms per frame** (SwiftShader, no GPU; a blank page in
the same browser runs at 16.7 ms, so it is the host's 17 backdrop-filters and 800 px core that cost it, not the
field — main thread 6 % busy, raster 390 ms/s). A per-frame bound therefore passes or fails by machine, which
makes it not a bound at all.

**Amended — PF-6 second row:** *mean |ΔL| over the disc between two renders **500 ms apart** ≤ 0.0025.* Case A
measures 0.00144, case B 0.0051, so it still separates them, and it now means the same thing everywhere.

### A-F3 · Mechanism: SVG user space, gradients, no filters *(GRÜN — accepted)*

Accepted as specified by GRÜN, for the reasons GRÜN measured:
- an HTML layer under the SVG composites well (+3 layers, does not disturb the E-5 tween: 5–6 distinct viewBoxes
  over 416–483 ms) but **does not follow the viewBox**, so at L1/L2 the ground would stay at L0 scale;
- `feGaussianBlur` halos on five bodies take idle p50 from 100 → 150 ms, p95 300 ms — **disqualifying**;
- therefore: ground, wedges and halos as **SVG elements in user space with `radialGradient` fills, no filter**.
  They follow every viewBox for free and need no per-frame script, so **B-F5 holds**.

GRÜN's further finding is recorded because it constrains where the ground may live: the reduced-motion blanket at
`:144` covers **only descendants of the section** — a layer outside it kept animating under `reduce`, a layer
inside stopped. **The ground must live inside the section.**

### A-F4 · The disc ground is opaque, PF-11 is scoped to the disc, and the host's violation is OTTAVIO's *(GRÜN — accepted, with a reservation)*

GRÜN measured that **PF-11 is red at base, and not because of the field**: under `prefers-reduced-motion: reduce`
the field has 0 running animations while **the host keeps 23** (`gradientBreath` on BODY, `plasma*`, `orbitFloat*`,
`moonOrbit`…). Across 2 s, 101 868 of 670 489 disc pixels change, max Δ 0.032, and `elementFromPoint` puts field
elements on top — so it is host motion shining through the 8 % of `STAGE_GROUND_ALPHA`. My M-F3 bound on the
host's **static** ghost (0.0089) was right; its **temporal** ghost is not zero, and I did not measure that.

**Decided:** the F-1 ground is **opaque inside the disc** and supplies all of its own luminance, behind its own
reversible constant (`DISC_GROUND_OPAQUE`). `STAGE_GROUND_ALPHA` is **not** touched and keeps governing everything
outside the disc. The decisive reason is not accessibility but **measurement integrity**: with an opaque ground,
every phase-F bound measures the field, instead of measuring the field plus whatever the host happens to be doing.

**Amended — PF-11 scope:** PF-11 applies to **the field disc**. Outside the disc is host, and B-F6 forbids phase F
from touching it; a bound we are not permitted to satisfy is not a bound.

**Reservation, and it goes to OTTAVIO, not into the code.** `STAGE_GROUND_ALPHA` is one of the two reversible
constants §5 of PHASE_E hands to OTTAVIO — *how much of the host's six orbits shows through the stage*. Making the
disc opaque overlaps that choice without replacing it. It is therefore a **new decision of his**, reported as such
at acceptance, not folded in silently.

**Finding for OTTAVIO, outside this phase's boundary:** the host application does not honour
`prefers-reduced-motion` — 23 animations keep running under `reduce`. That is a WCAG 2.3.3 defect in the host.
Phase F may not fix it (B-F6) and does not. It is reported.

### A-F5 · The firewall was red by construction — a defect in F-1 *(GRÜN, found in my spec)*

GRÜN: the marks carry their luminance **as opacity** (E-1: `opacity = luminanceOf(sign)`). That is precisely what
lets the ground through — a NONE arc at 0.25 transmits **75 %** of the breathing ground behind it. **F-1 as
written made PF-8 red by construction**, in the same way phase E's P-6 was green by construction. Same class of
defect, found this time by the other lane, before it was built.

**Accepted mechanism:** a **static backing** under every mark (arc, tick, beam, node, collar; text via
`paint-order` stroke), same geometry, no `data-*`, no `testid`, so each mark pixel is `backing·(1−α) + colour·α`
— independent of ground, wave, depth and host. The opacity attributes and `data-evidence-luminance` stay
unchanged, and **A-3's bands become absolute instead of ground-dependent**, which is what they always should have
been.

**One refinement I add:** the backing is the ground's **resting composite at its own location** (ground + wedge +
halo at mean phase), not a flat dark. At mean phase it is then invisible, and the only artefact is that *marks do
not breathe while the field around them does* — which is exactly F-6's intent, now visible rather than merely
true.

**Amended — PF-8 tolerance:** measured as **p99 of mark pixels ≤ 0.002 and max ≤ 0.006**. GRÜN is right that the
antialiasing fringe stays a partial mix; a percentile admits the fringe without admitting a leak.

### A-F6 · E-7's four rings do not survive a lit ground — a second defect in F-1 *(GELB)*

E-7 tells the four rings apart **by luminance alone**, at ink alphas 0.05 / 0.085 / 0.15 / 0.25, each step ≥ 1.6×.
Those values were chosen against a black ground. Against a disc median near 0.026 the shelf band and the best-fit
ring are at or below the ground and simply disappear — visible in the bench render, where the best-fit ring is
already marginal. F-1 would have silently deleted two of E-7's four structural rings.

**Decided:** the rings keep their identity as strokes and take the same backing as the marks (A-F5), and their
luminance steps are **re-derived against the phase-F ground** so the contract holds where it matters. This turns
E-7 from a contract on ink alphas into a contract on rendered pixels, which is strictly stronger. Values are
GRÜN's to choose; the bound is what binds.

**New obligation — PF-15:** the four rings are separated by **≥ 1.6× in measured pixel luminance at their closest
points**, against the phase-F ground, at both viewport sizes.

### A-F7 · Two proxies withdrawn in favour of the direct measurement *(GELB)*

F-1's third row — *body peak ÷ disc median ≥ 20* — was a proxy for "the ground has not eaten the evidence". The
bench puts case A at 19.3 and it is plainly fine, because the thing that actually matters is PF-2 (the bands) and
now PF-15 (the rings), both of which measure it directly. A proxy that disagrees with the direct measurement is
noise. **Withdrawn.**

F-1's disc-median ceiling of 0.020 is raised to **0.030**: the bench's 0.0259 is the level that reads as a
luminous volume, and the ceiling's real job is done by PF-2 and PF-15.

**Amended F-1:** disc median ∈ **[0.006, 0.030]**; disc fraction above 0.005 ≥ 0.55; third row withdrawn.

---

## §12 B-F2 MEETS F-6 — THE RULE WAS TOO BLUNT

GRÜN brought this instead of building around it, and named the three evasions it refused: a second stylesheet the
test does not read, WAAPI/SMIL instead of CSS, and an iteration count of `1e9` in place of `infinite`. All three
would have produced a green suite over a field that no longer does what the suite says. Refusing them is correct,
and bringing the conflict here is the procedure B-F2 itself prescribes.

**The conflict.** `test/career/mapping-field/neurovisual-e.test.ts` pins phase E's *mechanism*, not its meaning:

- `:156` — the `[data-breath="LIVE"]` rule set must be **exactly** the one ring selector; the keyframes must contain
  `scale(1 ± ≤ 0.015)` with amplitude > 0; the opacity must equal `mean + 0.04·sin(2π t)` at every keyframe — a
  **symmetric sine**.
- `:174` — the set of all infinite rules must be **exactly** `{QUERY, ring-field[data-breath="LIVE"]}`.

F-6 requires precisely what these forbid: not a ring, not a scale, a 4 : 6 waveform, several layers, infinite.

**The defect is mine.** B-F2 says *"every phase-D and phase-E test passes unchanged; if one goes red, phase F is
wrong, not the test."* That is right for a test that encodes **meaning** and wrong for a test that encodes
**mechanism** — and here the pinned mechanism is the exact thing M-F5 measured as the defect OTTAVIO rejected: a
±1.5 % scale of one hairline at the rim, 48 % of all moving pixels in the outermost tenth of the radius, peak
swing 0.0427 — itself already over PF-6's ceiling. B-F2 as written would have made phase F preserve the
imperceptible breath in order to keep its own proof green. That is phase E's failure mode exactly, one level up.

**B-F2 is amended.** A phase-D or phase-E test may be restated **only** where it pins a mechanism this phase
replaces, and only in writing, here, before the change. Where it pins meaning it stands. **A test kept green by
pretending is worse than a test retired in writing.** Everything else in B-F2 holds unchanged.

### The restatements, adopted as GRÜN proposed them

- **`:156`** → every `[data-breath="LIVE"]` rule selects **inside the field**; period exactly 0.1 Hz; ≥ 30× under
  the 3 Hz flash threshold; waveform **4 s rise : 6 s fall**; amplitude within F-6's corridor; and `STILL` ⇒ no
  breath rule applies at all.
- **`:174`** → nothing animates infinitely except rules keyed on `[data-breath="LIVE"]` and the user's own QUERY.
  This is R17's calm guard and it keeps its full force; only the count of permitted layers changes.
- **The ring's scale breath is retired** (F-6, and PF-6's ceiling independently). `mapping-ring-field` **keeps
  `data-breath` LIVE/STILL as E-6's state carrier**, so `field-render :84/:99/:102` and `field-e :302–312` stay
  unchanged and green and PINK's instruments still bind. GRÜN's judgement here is the right one: the carrier is the
  meaning, the scale was only the mechanism.

**One addition of mine.** The breath must be expressible as **CSS animation rules** that the reduced-motion
blanket can stop. GRÜN's own note is the reason: WAAPI and SMIL are *not* stopped by `reduce`. Binding the breath
to CSS makes PF-11's mechanism structural instead of incidental, and closes the evasion permanently rather than by
good conduct.

### A-F8 · The signs are still; the field breathes *(GELB — the principle §3 was missing)*

The conflict exposed something F-6 never stated cleanly. F-6 listed what the breath may not modulate — marks,
arcs, ticks, beams, nodes, text — and **omitted the four rings**, which is why the ring could be both structure and
the sole breathing thing at the same time. The rule that resolves it, and that should have been in §3 from the
start:

> **Everything that means something is still. Only the medium breathes.**

The breath lives in the **ground** and the **halos** — the medium — and nowhere else. Every sign *and every
structure* — marks, arcs, ticks, beams, nodes, text, and the four rings — is static and backed. A halo is medium,
not sign, because F-2 already forbids it to carry any state.

**Amended — PF-8:** every drawn **sign and structure** pixel swings ≤ 0.002 (p99; max ≤ 0.006 for the
antialiasing fringe). The four rings are now inside this bound, where they belong.

### A-F9 · My A-F5 refinement is withdrawn; GRÜN's flat black is better *(GELB)*

A-F5 refined the firewall backing to "the ground's resting composite at its own location". GRÜN's implementation
uses `rgba(0, 0, 0, 1)` — forced for the rings by `field-d :152` (mapping-ring paints only INK/CYAN/BLACK), and
better on its own merits, which I missed:

- the backing is the **same geometry** as the mark, never dilated, so neither version produces a visible fringe —
  my stated worry was unfounded;
- compositing on black makes each mark's rendered luminance **exactly what phase E measured**, so PF-2 inherits
  the measured edge ratios 1.814 / 1.940 directly instead of shifting them to new values that would then have to
  be re-derived.

Checked against the faintest case: the shelf ring at 0.05 ink composites to ≈ 0.04 against a ground of 0.026 —
still the brighter of the two, and the 1.6× margin PF-15 demands. **A-F5's refinement is withdrawn.** My third
correction this phase.

GRÜN's four compatibility pins are accepted as measured: the beam stroke attribute stays and the F-5 gradient goes
in as a mask (`field-e :100`); beam backings take `max(beam, 1.2 px)` for the stroke floor (`field-e :326`); depth
never sits on the body `<g>`, only on core and halo (`field-interaction :71`).

---

## §13 THE HARNESS AT BASE — RED WHERE IT MUST BE, AND A SEVENTH READING

GELB's §7 harness, run against `9cc06f84` before GRÜN's tip exists. An instrument that cannot show the baseline
red is not an instrument, so this run is validation, not acceptance.

| # | At base | Bound | |
|---|---|---|---|
| PF-1 | disc median **0.00181**, frac above 0.005 **0.150** | ≥ 0.006 / ≥ 0.55 | **red** |
| PF-5 | frac swinging ≥ 0.004: **0.0895** | ≥ 0.25 | **red** |
| PF-6 | swing max **0.0421**; mean \|ΔL\|/500 ms 0.0001 | ≤ 0.030 / ≤ 0.0025 | **red on the ceiling** |
| PF-7 | band amplitudes ≈ 0, lag spread **8 657 ms**, not monotone | spread 1 200 ± 300 ms | **red** |
| PF-8 | sign/structure pixels p99 **0.0187**, max **0.0421** | p99 ≤ 0.002 | **red** |
| PF-11 | **33 595** of 598 681 disc pixels change over 2.4 s under `reduce`, max Δ **0.0339**; **0** elements carry a duration | 0 changed | **red** |
| PF-15 | ring edge ratios **1.316 · 0.895 · 0.573** | each ≥ 1.6 | **red** |

Three of these are worth more than their red.

**PF-6 is red at base on the ceiling alone.** The rim ring's 0.0421 swing exceeds PF-6's ceiling without phase F
touching anything — independent confirmation of §12's claim that the ring's scale breath had to be retired on its
own merits, not only because F-6 replaces it.

**PF-8 is red at base because the one breathing thing *is* a structure.** The base violates A-F8 — *the signs are
still, only the medium breathes* — before phase F exists. The principle was not invented to permit the wave; the
base was already on the wrong side of it.

**PF-11 independently reproduces GRÜN's host finding** from a different instrument, a different threshold and a
different sampling: 33 595 of 598 681 disc pixels moving under `reduce` with **zero** field elements carrying a
duration (GRÜN measured 101 868 of 670 489, max Δ 0.032; I measure max Δ 0.0339). Two instruments, same
phenomenon, same magnitude. The host is moving underneath a field that is correctly frozen.

### M-F7 · E-7's four rings are **already** indistinguishable on pixels *(GELB — a seventh base reading)*

A-F6 predicted that a lit ground would delete two of E-7's four rings. The measurement says something worse and
more useful: **the separation does not hold at base either.**

| ring | ink alpha | p10 | p50 | p90 |
|---|---|---|---|---|
| horizon | 0.25 | 0.02014 | 0.03639 | 0.04742 |
| field | 0.15 | 0.00580 | 0.01117 | 0.01531 |
| shelf | 0.05 | 0.00496 | 0.00496 | 0.00648 |
| best-fit | 0.085 | 0.00169 | 0.00254 | 0.00866 |

Edge ratios at the closest points: **1.316 · 0.895 · 0.573** — none reaches 1.6 and **two are inverted**. Note the
order: the best-fit ring, at a *higher* ink alpha than the shelf, renders *dimmer* than it.

The cause is that E-7 specified luminance as **ink alpha** and never measured the image. Rendered luminance is
dominated by stroke width and dash, not by alpha: the shelf is a ~100 px band at 0.05 that renders as a solid
0.005 region, while the best-fit ring is a *dashed 1.2 px hairline* at 0.085 whose pixels are mostly antialiasing
fringe. A thick faint band and a thin brighter dashed line land on top of each other.

**Consequence for the phase:** PF-15 is not a new burden phase F creates. It is an existing defect phase F
surfaces, and the ring luminances must be **derived from measured pixels** rather than adjusted from the current
alphas — there is no correct baseline to preserve.

**Instrument defect, my third this phase.** PF-15 first read each ring at `boundingClientRect.width / 2`. A
circle's bounding box **includes its stroke**, and the shelf ring is a band ~100 px wide, so that sampled its
outer edge rather than the band. The radius now comes from the SVG geometry through `getScreenCTM()` and the
sampling window follows each element's own stroke width. The uncorrected run reported 1.212 · 1.267 · 0.573; the
corrected one 1.316 · 0.895 · 0.573. Both are red, but the uncorrected one was red for partly the wrong reason,
and I would have sent GRÜN a wrong ring to chase.
