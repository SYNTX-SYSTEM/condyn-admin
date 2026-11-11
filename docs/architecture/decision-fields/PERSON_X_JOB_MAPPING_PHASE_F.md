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

> ### ⚠ FORWARD POINTER — THESE ARE THE ORIGINALS. NONE OF THEM IS THE CURRENT CONTRACT.
> *Added 2026-11-11 by GELB, per PHASE_G A-G320. The pointer sits here, at the originals' own location,
> because a lane that lands on this table by search has no way to learn from the table that it is stale.
> Each item cites its **amendment ID first** and its line number second: the ID is stable, the number is
> correct as of 2026-11-11 and is invalidated by any insertion above it. Writing this note invalidated
> every number in its own draft twice over — which is the argument for leading with the ID.*
>
> - **The current statement of every PF pin is assembled, not quoted.** §17 restates them, and §§19–30
>   amend §17 further. §17's own "this table is the CURRENT contract" is **current as of §17** — see the
>   dated note at its head. Reading either table alone has produced a wrong bound at least three times
>   this phase (A-G315 was mine, PF-6's row and PF-8's scope were the others).
> - **PF-1** is replaced for phase G by **PG-1/PG-2** (PHASE_G §4) and is not measured in this form at all.
> - *** AND **PF-3, PF-5, PF-7 and PF-10** ARE ALL RETIRED BY **A-G20** (PHASE_G §21), IN FAVOUR OF **PG-10**
>   — *"the breath has moved from the medium to the glows, and an obligation must follow the thing it
>   measures."* PHASE_G §28 records their states at retirement: **PF-3 never measured** (its cited 2.5…3.8
>   reading has no recorded provenance), **PF-5 and PF-7 retired WHILE RED**, **PF-10 retired having never
>   run.** ***
>   **This pointer omitted all four until §116, and the omission cost two lanes a round:** PINK measured
>   PF-5 and PF-7 as live pins and this lane specified a replacement guard for PF-10 in §114. **The note
>   built to stop a lane reading a stale pin listed one replacement and missed four retirements.**
> - **PF-15 IS MALFORMED AS A CONJUNCTION, NOT MERELY UNSATISFIABLE** (**§98**, `PHASE_G:12669`) — two legs:
>   *no shelf alpha can satisfy both separations*. **A malformed pin needs no guard and admits no satisfier**, so
>   it is not a gap. **But its unsatisfiability was derived OVER THE REALS**, and `PHASE_G:12434` re-opens that:
>   the feasible set maps onto roughly **21 attainable levels** (A-G428's alpha plateaus), and *three limbs
>   disjoint over the reals may or may not be disjoint over 21 points*. **Owed, and it can go either way.**
>   *Added §121 after A-G453's gate refused on it — the gate caught this lane's own omission a second time.*
> - **PF-4 IS LIVE.** It is flagged by A-G453's check only because §70 cited *"PF-4's text at `:322`, the
>   superseded §7 original"* — **a sentence about a stale CITATION of PF-4, not about PF-4's retirement**
>   (`PHASE_G:8349`). Its current form is §17's (`:981`), and it is **checked individually against §§19–30**.
>   *One line, per the rule that a flagged false positive is answered in the pointer rather than argued with.*
> - **PF-3** — the halo limb is measured as an **EXCESS against a render without it**, never as a raw
>   window (**A-F19**, §20 `:1095`). A raw ratio of declared alphas is a cruder form of the same confound.
> - **PF-6 row 1 / PG-10 limb 3** are **one bound on one quantity, stated as a DISTRIBUTION** on 2 px-blurred
>   frames. **A-F11 corrected (§17 `:955`) forbids the maximum form**; §13's earlier blurred-maximum wording
>   (`:735`, `:750`) is superseded for this statistic, and only for this one.
> - **PF-8 is the heaviest.** The one-line firewall below was replaced entirely by the two-tier restatement (§16 `:901`) and is now
>   **three tiers, per class, per level**, carrying **nineteen amendments in two files** — fourteen here and
>   **five in PHASE_G** (`PHASE_G:949`, `PHASE_G:1207`, `PHASE_G:1999`, `PHASE_G:8238`, `PHASE_G:8726`). Two of the nineteen are
>   **admissibility clauses** (**A-F26**, §27 `:1396`, `:1400`) that decide whether a tier is evaluated at all, and they
>   are the ones most often missed. The assembled form and its gate: PHASE_G §80 and
>   `evidence/mapping-phase-g-gelb/gelb-gate-pf8-tiers.mjs`.
> - **PF-8's tier B bound is `p99 ≤ 0.002` ABSOLUTE** (**A-F29**, §29 `:1554`), not the
>   floor-relative form stated when the tiers were introduced — that form survives **only** as the
>   admissibility check (floor ≤ 0.0004). The earlier form yields a bound four times stricter than the
>   physics it stood in for, and one no instrument can ever satisfy A-G139 against.
> - **PF-11** has **two texts** (A-G320, `PHASE_G:8388`): a lane reading the first measures a different pin.
> - **PF-13 also has two texts, and the exception clause is coherent only against the FIRST** (**A-G426**,
>   PHASE_G §95). **PF-13's row in §7's obligation table** reads *"Every phase-D and phase-E test passes
>   **unchanged**."* **Its restatement in §17's table** drops *unchanged* and adds *"except the three
>   restated in writing"*. **And B-F2, in §4's boundary list, carries the same word**: *"Every phase-D and
>   phase-E test passes unchanged. If a phase-E test goes red, phase F is wrong"* — so *unchanged* is the
>   load-bearing word in two independent statements of the obligation (GRÜN found the third).
>   *Cited by section and pin id, not by line number: the first form of this very note cited two line
>   numbers that its own insertion had invalidated by twenty lines, four lines below the rule forbidding
>   exactly that — see A-G427.*
>   **The exception is to UNCHANGED, not to PASSES** — the three were rewritten for phase F, so the
>   *unchanged* claim cannot cover them, and **all three must still pass.** Read as an allowance for three
>   reds, PF-13 would be satisfiable with three failing tests. GRÜN measured all three passing on
>   `architecture/mapping-phase-g`, so the distinction changes nothing on this build and everything on one
>   where any of them fails.
> - **PF-13's POPULATION is read, not assumed:** `PHASE_DIRS = ["test/career/mapping-field/",
>   "test/career/mapping-spec/"]` — **two directories, 15 files**. Neither lane had run the second until
>   2026-11-11, and this lane called PF-13 green from a figure covering 13 of the 15 files. **A pin whose
>   population is a directory list is quoted by reading the list, never by naming the directory one
>   remembers.** And the suite at large is NOT PF-13's population: 27 career-lifecycle postgres failures
>   sat outside it entirely while appearing to bear on it.
> - **PF-13's exception list should name TEST TITLES, not line numbers** (A-G426). The three cited lines had
>   +7/+3/+4 lines of headroom inside their `it()` at `3ec8457d` and **+4/+0/+1** after a later three-line
>   shift — `:156` now lands exactly on its `it()`. **One edit above them and the pin names the previous
>   test, with nothing to signal it.** A line number into a file still being edited is a property of a
>   build in the most literal sense, and the only citation form that can come to mean something else with
>   no edit to the citation itself.
> - **PF-16** was widened by **A-F31** (§30 `:1599`) and then **restated in CODES** for phase G by **A-G12**, because A-F31
>   found ratios meaningless at this level.
> - **Mode discipline:** several pins below name no motion mode and are **not evaluable under
>   `prefers-reduced-motion: reduce`** — PF-8 among them, which returns green there with every guard
>   satisfied (PHASE_G §80). A reading taken in the wrong mode is not a weak reading; it is a different pin.

| # | Obligation |
|---|---|
| **PF-1** | The disc carries light: median ∈ [0.006, 0.020]; fraction above 0.005 ≥ 0.55. |
| | ⚠ **RETIRED for phase G** *(§114)* — replaced by **PG-1/PG-2** and *not measured in this form at all*. A lane reading this row alone measures a pin phase G does not carry. |
| **PF-2** | **The evidence survives the light.** The E-1/A-3 band separation holds at the pixel level — adjacent bands' ratio **≥ 1.6 at their closest points** (floor of the upper band vs. ceiling of the lower, PHASE_E §12). Measured on rendered pixels, not computed styles. |
| **PF-3** | Bodies are volumes: footprint ≥ 6 × outline footprint; halo peak ≤ 0.25 × core peak. |
| | ⚠ **RETIRED by **A-G20** in favour of PG-10 — **never measured**; its cited 2.5…3.8 reading has no recorded provenance.** *(§116)* |
| **PF-4** | Depth is monotone in rank, ratio rank 1 : last ∈ [1.5, 3.0]; **and** same-class marks on different bodies differ by ≤ 2 % — i.e. depth did not touch evidence. |
| **PF-5** | Breath floor: ≥ 25 % of disc pixels swing ≥ 0.004 over one period. |
| | ⚠ **RETIRED by **A-G20** in favour of PG-10 — **retired WHILE RED**. Its historical green of **0.647** was measured over the GLOW while this row says **disc pixels**; over the disc the share is **0.0492**, and the attainable ceiling over the disc is **6.65 %** (the glow's own fraction) against a bound of 25 %. **The denominators differ by 15×.**** *(§116)* |
| **PF-6** | Breath ceiling: no pixel swings > 0.030; stage mean \|Δframe\| ≤ 0.0025 at 20 fps. |
| **PF-7** | It is a wave, not a blink: the phase of the swing is monotone in radius, total spread 1 200 ms ± 300. |
| | ⚠ **RETIRED by **A-G20** in favour of PG-10 — **retired WHILE RED**. And it states no DIRECTION for *monotone in radius*; PINK's §53 shows a per-pixel phase fit cannot recover the per-layer lag at all, because `:876` draws all seven ground layers at the SAME radius.** *(§116)* |
| **PF-8** | **The firewall.** Over a full period, every arc, tick, beam, node and text pixel swings ≤ 0.002. |
| **PF-9** | Pending is still: with `data-breath="STILL"`, every pixel's swing over a full period ≤ 0.002. |
| **PF-10** | Query owns the motion: with a capability selected, the measured breath amplitude is ≤ 45 % of its unselected value. |
| | ⚠ **RETIRED by **A-G20** in favour of PG-10 — **retired having never run**. §114 specified a replacement guard for it; that ruling was made on a retired pin and is withdrawn (§116).** *(§116)* |
| **PF-11** | **Reduced motion, at pixel level.** Two renders ≥ 2 s apart with no interaction: every pixel identical. Plus phase E's half (a): no element carries a non-zero computed animation or transition duration. |
| **PF-12** | Nothing phase F adds is interactive: no new element in the a11y tree, none focusable, none hit-testable; tab order unchanged. |
| **PF-13** | Every phase-D and phase-E test passes unchanged. |
| | ⚠ **EXCEPTION LIST WRONG AS WRITTEN — §116, A-G454.** The restated set is `:136`, `:173`, `:205` by title; PF-13 cites `:140`, `:174`, `:156`. **`:156` is NOT a restated test** (*"REPRODUCE: geometry 420 ms…"*) and **`:205` is not exempted.** Verified at `26fec3c5`/`10eb4030`: **not drift.** Vacuous while all pass; **its two errors have opposite signs (A-G455).** The exempted set must be **derived from the titles**. |
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

---

## §14 PINK'S BASELINE, AND THE NOISE FLOOR THAT MAKES THREE PROOFS RED BY CONSTRUCTION

PINK delivered its Q-F1…Q-F6 baseline on `9cc06f84` from its own instrument and its own render — a production
build on its own ports, 5 server-side fixture GETs per load, 0 unscripted — and **committed it (`5a3a7847`)
before reading §0**, so the independence is provable in git rather than asserted. The §0 cross-check is in
`7d33129f`; evidence under `docs/architecture/decision-fields/evidence/mapping-phase-f-contract/`.

**Agreement.** M-F1 ≡ Q-F1, M-F2 ≡ Q-F4/Q-F6, M-F3 ≡ Q-F6 (0.0089 from both), M-F6 ≡ Q-F3 (0.00016 vs 0.000152),
at both viewport sizes. Two divergences, both explained and neither an instrument fault: M-F4's body peaks
(0.307–0.547 vs 0.48–0.635) is p98-inside against max; M-F5's peak swing (0.0427 vs 0.0339) is the per-pixel
maximum — which is exactly the statistic the next paragraph disqualifies. PINK also reproduced my onboarding
warning: the overlay was present on a fresh profile.

### A-F10 · Three of my proofs are red by construction, and the cause is the instrument *(PINK — accepted)*

Under `reduce`, with **zero** field animations running, the rendered image is still not frame-identical. PINK
bucketed the residual by source:

| source | max swing | share |
|---|---|---|
| mark edges (bodies, arcs, nodes) | **0.0275** | 7.7 % of mark px > 0.002; 2.27 % > 0.006 |
| ring stroke edge | **0.032** | the whole-square maximum sits here |
| quiet mid-disc (host through the ground) | 0.0059 | low-amplitude, removed by `DISC_GROUND_OPAQUE` |

The mid-disc component independently corroborates A-F4 with a third instrument. **The high maxima do not: they
are antialiasing jitter on the field's own bright edges, and an opaque ground does not remove them.** This is
software raster (SwiftShader, dsf = 1) and is build-independent.

Consequence, and it is serious:

- **PF-8** (p99 of mark pixels ≤ 0.002, max ≤ 0.006): **both limbs already red at base from AA alone**, with the
  firewall working and nothing breathing at all.
- **PF-11** ("every pixel identical", even disc-scoped): **unachievable**, because the field's own edges jitter by
  0.027–0.032 with nothing moving.
- **PF-6**'s ceiling ("no pixel > 0.030"): borderline — the ring edge reaches 0.032.

**This is phase E's failure mode inverted.** P-6 was *green* by construction and so carried no information. These
three are *red* by construction and carry exactly as little. A proof whose verdict does not depend on the build is
not a proof, in either direction. That I wrote three of them while explicitly hunting for the first kind is the
thing worth recording.

PF-5 and PF-6's **floor** are unaffected: PINK measured that a 2 px blur keeps the breath (52 292 px > 0.002) and
collapses the jitter (2 225) — a **23 : 1** separation. Area statistics are robust; per-pixel extremes are not.

### A-F11 · Every temporal bound carries its own measured noise floor *(GELB — the rule this forces)*

The fix is not to loosen three numbers. It is that **a temporal bound stated without the instrument's noise floor
is not a bound**, and phase F had six of them. The rule, binding on all three lanes:

> Every temporal obligation is measured on **2 px-blurred frames**, and every run measures its own **jitter
> floor** in the same pass: the same statistic computed on two screenshots taken back to back, as fast as the
> renderer allows, where nothing can have changed. A bound is only admissible if the measured signal separates
> from that floor by **≥ 5×**. A run whose floor comes within 5× of its bound reports **inconclusive**, not green
> and not red.

The back-to-back pair is the key: it is a reference in which we *know* nothing moved, taken on the same build,
the same page and the same renderer, so no assumption about the machine enters the proof.

The blur is not a concession. **R15 says the eye is low-pass at these luminances**, so a one-pixel antialiasing
extreme is not a percept at all; measuring at the spatial scale the visual system integrates over is the more
correct measurement, and it happens also to be the robust one.

**Amended:**
- **PF-6** — ceiling on 2 px-blurred frames: no blurred disc pixel swings > 0.030; mean |ΔL| per 500 ms ≤ 0.0025.
- **PF-8** — the firewall is measured as the **coherent amplitude at 0.1 Hz** over sign and structure pixels,
  fitted by least squares against one period (the same fit PF-7 already uses), on 2 px-blurred frames: ≤ 0.002.
  Antialiasing jitter is incoherent and contributes almost nothing to a fitted amplitude; a real leak from the
  breath is coherent at exactly that frequency by definition. This discriminates leak from raster directly
  rather than tolerating the raster.
- **PF-11** — on 2 px-blurred frames, no disc pixel differs by more than **2× the measured jitter floor** between
  two samples ≥ 2 s apart, and the count exceeding it is 0; plus phase E's half (a), no element with a non-zero
  computed animation or transition duration. Deliberately broadband, not frequency-fitted: PF-11 must catch
  *any* motion, including a rAF tween at no particular frequency — which is the mutant PINK proved live in phase E.

### M-F5 corrected

M-F5 reported the rim ring's breath as a 0.0427 per-pixel swing. PINK's finding says part of that is raster
jitter on the ring's own edge, not breath; PINK's own figure is 0.0339 and is subject to the same caveat. **The
conclusion is unchanged and if anything strengthened** — the breath's *coherent* component is smaller than either
raw number suggested, so phase E's ring was even less visible than §0 claimed.

---

## §15 THE RINGS, THE HALO, AND A GAMMA ERROR OF MINE

### A-F12 · A-F9's arithmetic was wrong by 11.5× *(GRÜN, found in my adjudication)*

A-F9 claimed the shelf ring at 0.05 ink composites to "≈ 0.04 against a ground of 0.026 — still the brighter of
the two". It does not. Verified:

| ink alpha | 0.05 | 0.085 | 0.15 | 0.25 |
|---|---|---|---|---|
| rendered relative luminance on black | **0.00358** | **0.00694** | **0.01691** | **0.04309** |

My shortcut multiplied alpha by INK's *linear* luminance (0.05 × 0.826 = 0.041). **Alpha compositing happens in
gamma-encoded sRGB**: the blend comes first, the linearisation after. The two differ by 11.5× at this alpha.

The part worth recording is not the gamma slip. It is that **M-F7 had already measured the shelf at p50 0.00496**
— within a factor of 1.4 of the correct value and an order of magnitude from my derived one — and I published
both numbers in the same document two sections apart without ever putting them side by side. The measurement was
right and the derivation was wrong, and I had both in hand.

**Consequence.** With a lit ground near 0.026, the shelf band (0.0036) and the best-fit ring (0.0069) are
**darker** than the medium they sit in: engraved lines, not lit ones. That polarity inversion is forced — keeping
them brighter than the ground would require the ground to fall below 0.0069 across the whole outer field, which
would undo F-1. Accepted.

The luminance ladder survives it intact and monotone: shelf 0.0036 < best-fit 0.0069 < field 0.0169 < **ground
0.026** < horizon 0.0431. Only the ground now sits inside the ladder, so two rings read as grooves and two as
ridges. R20 supports it — a dark line at 0.0036 on a ground of 0.026 is a Weber contrast of −0.86, and dark
targets gain visibility as contrast rises.

**PF-15 gains a second limb:** each ring must separate from **its own local ground** by ≥ 1.6× in one direction
or the other. The first limb (ring against adjacent ring) cannot catch a ring that lands exactly on the ground's
level and disappears into it; this one can.

### A-F13 · A still sign in a breathing medium — PF-8 bounds luminance, not contrast *(GELB, an ambiguity closed before it is exploited)*

A-F12 surfaces a question that applies to **every** mark, not only the rings: a mark is black-seated and static,
but the ground around it breathes, so the mark's *contrast against its surround* varies by roughly ±19 % at the
nominal amplitude. Does a still sign in a breathing medium violate A-F8?

**No, and this is intended.** PF-8 bounds **a sign's own rendered luminance**, not its contrast against the
medium. A luminous medium brightening and dimming around still objects in it is exactly what F-6 means — it is
how a real nebula behaves around real stars. The invariant that carries meaning is the mark's **absolute**
luminance, which is what E-1/A-3's bands are measured on and what A-F5's black seating makes ground-independent.
What is forbidden is the sign's own luminance moving. Stated here so it is a decision rather than a loophole
someone finds later.

### A-F14 · GRÜN's ring derivation — accepted *(GRÜN)*

GRÜN's own computation on black seats at full pixel coverage reproduces the table above (0.0036 / 0.0069 /
0.0169 / 0.0431 → steps **1.92 / 2.45 / 2.55**), and draws the right conclusion: **the alphas were never the
problem.** They clear 1.6× comfortably. What destroyed the separation in M-F7 is width and dash, exactly as
measured. So the alphas stay, and `:83`'s alpha ladder stays green and unchanged — no restatement needed.

Adopted: the best-fit ring loses its dash and becomes a solid 2.4 px line; horizon and field ring 2.0 px; the
shelf band unchanged; all four black-seated and static. E-7 assigns the rings **no** meaning through dash — they
are told apart "by luminance alone, one ink, no hue" — so removing the dash costs no semantics. GRÜN to confirm
no test pins that dash.

### A-F15 · `:140` restated — the halo glides with its body *(GRÜN — accepted, with a fourth check)*

`neurovisual-e.test.ts:140` pins the set of rules carrying `transition: transform` to **exactly**
`[data-mapping-body][data-change="LAYOUT"]`. Phase F must add one: the halo is medium, F-5 puts beams under
bodies, and a halo above a beam would breathe over beam pixels and fail PF-8 — so the halo cannot be a child of
the body `<g>` and needs its own transform. Without its own rule, a LAYOUT body glides for 900 ms while its glow
stays behind. A body sliding out of its own light would be visibly wrong.

This is a **mechanism** pin under §12's amended B-F2. Its *meaning* — E-4/A-2's distinction, own evidence cuts and
displacement glides — is preserved exactly, and extended to say the medium follows its body rather than tearing
off it.

**Restated `:140`:** a position transition applies only to LAYOUT bodies and to the medium of exactly those
bodies; never to EVIDENCE, never to a sign. Checked as:
1. the rule set is **closed**: exactly `{ [data-mapping-body][data-change="LAYOUT"], .mf-halo.mf-layout }`;
2. the component invariant: a halo carries `mf-layout` **iff** its body carries `data-change="LAYOUT"`;
3. the EVIDENCE halo cuts — remounted on the same `seq` key as its body;
4. **(added by GELB)** **no element in the sign/structure set carries a transform transition at all.** (1) closes
   the set by name; (4) closes it by category, so a future sign cannot acquire one through a selector nobody
   thought to enumerate.

GRÜN's choice to carry the halo's state in a **class** rather than a `data-*` attribute is right and is kept: a
`data-change` on the halo would inflate PINK's mark counts in P-13. PINK: the halo's LAYOUT state is in
`classList`, not in `data-*`, deliberately.

### A-F16 · A phase-E proof was partly vacuous *(GRÜN, found in its own lane by `tsc`)*

`field-e.test.tsx:260` — P-13's precondition — read `r.poolRoleId`, which does not exist on `RankedRole`
(`r.role.poolRoleId` does). At runtime it compared `[undefined, rank, tier, fit]`, so **the order and identity of
the roles went unchecked**. GRÜN is fixing it in its own commit, strictly stronger, and reports plainly that its
earlier "tsc clean at `9cc06f84`" was wrong.

That is the **fifth** broken instrument of this effort and the second that was green by construction. It touches
phase E's GO: P-13's precondition was weaker than §19 recorded. **PINK is asked to state whether its own
independent P-13 reproduction used the same accessor.** If PINK's instrument read `r.role.poolRoleId`, P-13's
conclusion stands on PINK's measurement and only the in-repo precondition was weak; if it inherited the same
mistake, P-13 is unproven and returns to the open list.

---

## §16 A-F11 CORRECTED — I BUILT THE OPPOSITE FAILURE WITHIN THE HOUR

§14 adopted PINK's finding and wrote A-F11 to stop proofs being red by construction. I then implemented A-F11 in
my own harness exactly as written, ran it at base, and **PF-11 came back GREEN** — on a build where three
instruments agree the host is moving under the field. It passed by 1 %: max delta 0.00842 against a limit of
0.00852. **PF-8 went green too** (coherent p99 0.00161 ≤ 0.002) on a base whose ring demonstrably breathes.

One section after writing that a proof whose verdict does not depend on the build carries no information, I
shipped two of them in the other direction. Recorded in full, because the rule that follows is worth more than
the embarrassment.

**Two causes, both in A-F11 as written, neither in PINK's finding:**

1. **The 2 px blur destroys exactly what PF-8 exists to catch.** Blurring suppresses the amplitude of a *thin
   structure moving geometrically* — which is what a breath leak onto a mark looks like. PINK's 23 : 1 result was
   for an *area* statistic on the broad ground; I over-applied it to a per-pixel edge statistic. **PF-8 is measured
   unblurred.** The coherent fit alone does the rejection, and it does it without destroying the signal.
2. **A max-against-max bound is a coin flip when the floor is the same order as the signal.** Comparing one
   extreme to twice another extreme has no statistical content.

### A-F11 (corrected)

> Every temporal obligation measures its own floor in the same run — back-to-back frames for broadband bounds, a
> fit at a **decoy frequency** incommensurate with the breath for coherent ones. Thresholds compare
> **distributions, not maxima**. Blurring is used for **area** statistics and never for a statistic whose signal
> is a moving edge. And the admissibility rule is **asymmetric**: a **GREEN** needs the floor well under the
> bound, because a high floor can hide a leak; a **RED** needs the signal clearly above the floor, because a
> fluctuating floor can invent one.

**PF-11, restated.** At four thresholds (0.001 / 0.002 / 0.004 / 0.008) on blurred frames, the count of disc
pixels changing between two samples ≥ 2 s apart must be **≤ 1.5× the back-to-back count** at every threshold. Real
motion moves many pixels; raster jitter moves the same few. At base this reads **6.43 / 4.48 / 13.7 / ∞** — red at
every threshold, decisively, where the max-based form passed by 1 %.

**PF-8, restated in two tiers**, because one statistic cannot do both jobs:

| tier | what it catches | statistic | bound | floor at base |
|---|---|---|---|---|
| **A** systematic | the ground's breath modulating marks | coherent amplitude at 0.1 Hz of the **mean over all sign pixels** | ≤ 0.0005 absolute | **0.00001** |
| **B** localised | a leak on a few pixels, or a sign moving geometrically | per-pixel **p99** of the coherent amplitude, unblurred | ≤ **2× the run's own decoy floor** | 0.00231 |

Tier A pools 178 k pixels before the fit, so its floor is 50× under its bound — the sensitive limb, and the one a
green verdict rests on. **Tier A reads green at base**, correctly: the phase-E ring *moves* rather than brightens,
and a geometric movement roughly conserves total light. Tier B catches precisely that (p99 0.00484 against a floor
of 0.00231) and is **red at base**. Neither tier alone is the firewall; both are.

Tier B's bound is stated **against the run's own floor** rather than as an absolute, because 26 frames cannot
resolve 0.002 (the floor sits at 0.0023) and a bound the instrument cannot reach is not a bound — the same error
in a third disguise.

**Standing consequence.** Five of the six instrument defects this phase were mine, and four of the six were a
proof that could not change its verdict. That is now the first thing every obligation is checked for, before it
is checked against the build.

---

## §17 THE OBLIGATIONS AS THEY NOW STAND

§7 has been amended by §11, §14, §15 and §16. This table is the **current** contract; where it differs from §7,
this wins. It exists because four amendment sections are how a lane ends up building against a stale bound — a
failure I have now caused twice in one phase.

> ### ⚠ "CURRENT" HERE MEANS **CURRENT AS OF §17**. IT IS NOT CURRENT NOW.
> *Added 2026-11-11 by GELB, per PHASE_G A-G316 — a record's claim to currency carries a date, and the date
> is its own section number.* §§19–30 amend this table further, and PHASE_G amends it again. **PHASE_G
> A-G315 is the defect this note prevents:** I read the sentence above as timeless, re-derived PF-3's halo
> limb from declared alphas, and contradicted a fix (**A-F19**, `:1095`) that I had already accepted —
> because the word "current" carried no date. The forward pointer at §7 lists the known supersessions.

| # | Obligation (current) | Amended by |
|---|---|---|
| **PF-1** | disc median ∈ **[0.006, 0.030]**, frac above 0.005 ≥ 0.55. Spatial, read **unblurred**. The third row (peak ÷ median ≥ 20) is **withdrawn**. | A-F7 |
| **PF-2** | E-1/A-3's band separation ≥ **1.6** at the bands' closest points, on rendered pixels. Marks are black-seated, so the values are **absolute** and should reproduce phase E's 1.814 / 1.940. | A-F5, A-F9 |
| **PF-3** | body footprint ≥ 6× outline footprint; halo peak ≤ 0.25× core peak. | — |
| **PF-4** | depth monotone in rank, ratio first : last ∈ [1.5, 3.0]; same-class marks on different bodies differ ≤ 2 %. | — |
| **PF-5** | ≥ **25 %** of disc pixels swing ≥ 0.004 over one period, blurred (area statistic). Nominal target: swing p50 ≈ **0.005** on a disc median ≈ 0.026 — build toward the nominal, not the floor. | A-F1 |
| **PF-6** | blurred: no disc pixel swings > **0.030**; mean \|ΔL\| per **500 ms** ≤ 0.0025. | A-F2, A-F10 |
| **PF-7** | the swing's phase is monotone in radius; total spread **1 200 ± 300 ms**. | — |
| **PF-8** | **Tier A** — coherent amplitude at 0.1 Hz of the **mean over all sign/structure pixels** ≤ **0.0005** absolute, unblurred. **Tier B** — per-pixel **p99** of the coherent amplitude ≤ **2× the run's own decoy-frequency floor**, unblurred. Both must pass. Covers marks, arcs, ticks, beams, nodes, text **and the four rings**. | A-F8, A-F10, A-F11 |
| **PF-9** | with `data-breath="STILL"`: every pixel's swing over a full period within the run's floor. | — |
| **PF-10** | with a capability selected, breath amplitude ≤ **45 %** of its unselected value. | — |
| **PF-11** | blurred, disc-scoped: at thresholds 0.001 / 0.002 / 0.004 / 0.008, the count changing between samples ≥ 2 s apart ≤ **1.5×** the back-to-back count **at every threshold**; plus no element with a non-zero computed animation or transition duration. | A-F4, A-F10, A-F11 |
| **PF-12** | nothing phase F adds is interactive: not in the a11y tree, not focusable, not hit-testable; tab order unchanged. | — |
| **PF-13** | every phase-D and phase-E test passes, except the three restated in writing: `neurovisual-e :156`, `:174`, `:140`. | §12, A-F15 |
| | ✅ **AMENDED, §117 — PF-13's CURRENT STATEMENT, and it replaces both forms above.** *Every test in the `PHASE_DIRS` population **passes**. The three restated **for phase F** are exempt from passing **UNCHANGED**, not from **PASSING**.* The exempted set is **DERIVED, never enumerated**: *a test whose title declares a restatement naming **phase F***. On `3ec8457d` that is exactly three, all in `neurovisual-e.test.ts` — `"inverse (position half restated, phase F §12/A-F15)…"`, `"REPRODUCE (restated, phase F §12 and phase G §8)…"`, `"no other ambient motion (restated, phase F §12)…"`. **Guarded by `gruen-pf13-evaluate.mjs`: 16 files, 197 tests, 197 passed, both A-G452 mutants killed.** | §117 |
| | ⚠ **CORRECTED, §116 (A-G454).** *"the three restated in writing"* is a **predicate**; these are **three offsets**, and they disagreed with it immediately. **`:156` names a non-restated test; the restated `:205` is omitted.** Also: **the population is `PHASE_DIRS`, 15 or 16 files (unreconciled), not "the suite"** (A-G95), and **PF-13 has a population enumerator but NO EVALUATOR** — the run half does not exist. | §116 |
| **PF-14** | no per-frame script write to SVG geometry outside the E-5 stage tween; the breath is **CSS animation rules** the reduced-motion blanket can stop (never WAAPI or SMIL). | §12 |
| **PF-15** | the four rings separated by ≥ **1.6×** in measured pixel luminance at their closest points, **and** each ring separated from **its own local ground** by ≥ 1.6× in either direction. Both viewport sizes. The horizon/field step is **marginal and instrument-sensitive** (GELB 1.316, PINK 1.636) and needs margin, not a pass. | A-F6, A-F12, A-F14 |
| | ⚠ **MALFORMED AS A CONJUNCTION** *(§98, §114)* — **not merely unsatisfiable.** No shelf alpha repairs it (the gap between limb (a) and A-G66 is **7 alpha-bytes = 6.37 plateau widths**, and discretisation can only move a disjointness verdict when the gap is under one step), **and where limb (a) clears, limb (b) has no quantity to be true or false about** — the band renders as `rgb(0,0,0)` or a single-code grey at the quantisation floor. *"Unsatisfiable" invites a search for a clever alpha; "malformed" says stop looking.* |

**The admissibility rule applies to all of them (A-F11 corrected):** every temporal obligation measures its own
floor in the same run; distributions are compared, not maxima; blur is for area statistics only, never for a
signal that is a moving edge; a **GREEN** requires the floor well under the bound, a **RED** requires the signal
clearly above it, and anything between is **INCONCLUSIVE**.

### Red-first at base, as measured by GELB's harness on `9cc06f84`

PF-1 red (0.00181 / 0.150) · PF-5 red (0.0134) · PF-6 red on the ceiling · PF-7 red (no wave; spread 8 657 ms,
not monotone) · PF-8 red via tier B (p99 0.00484 vs floor 0.00231; **tier A green, correctly** — a moving ring
conserves total light) · PF-11 red at every threshold (6.43 / 4.48 / 13.7 / ∞) · PF-15 red (1.316 / 0.895 /
0.573, two inverted).

**Open and unmeasured until the tip exists:** PF-2, PF-3, PF-4 (need GRÜN's element names), PF-9 (needs the
façade's `running` variant), PF-10 (needs a selection), PF-12, PF-13, PF-14.

---

## §18 HELD FOR THE NEXT CYCLE — NOT IN THIS TIP

The mandate asks for a field that *umhaut beim ersten Blick*. §2/§3 make it a luminous, breathing, layered
space, which is the structural precondition. These three would go further, and are **deliberately not** in the
first tip: GRÜN is nearly finished, and adding scope now would destabilise a build whose bounds have already
moved twice. They are recorded so they survive, and they are decided **after** the first phase-F render is
measured and looked at.

- **F-10 · The person becomes the light source in fact, not only in geometry.** F-6 already makes the breath
  originate at the person. Taking the next step — the ground's luminance maximum sitting *on* the person rather
  than merely near it, and the constellation nodes as the brightest bodies in the field — is semantically exact
  (the person is the origin of every relation here) and is the single strongest candidate for the first-glance
  effect. Cost: a change to the ground's radial profile and the node radii. Risk: the constellation competing
  with the evidence marks, which PF-2 would catch.
- **F-11 · The medium recedes while a query runs.** F-7 already drops the breath to 40 % on selection so the
  query owns the motion. Dimming the *ground* in the same gesture would make a query read as "the field holds its
  breath and the answer stands out of it". A-6 already establishes context dimming as legitimate (other pools at
  0.18), so this is an extension of an accepted mechanism, not a new channel — but it must be argued against
  E-1 explicitly before it is built, not after.
- **F-12 · Occlusion as rank.** F-5 puts beams under bodies. Letting nearer bodies occlude farther ones would add
  the one depth cue R16 names that phase F does not yet use. Cheap in SVG (paint order by rank), and it makes the
  ranking a depth percept rather than a radius to read.

None of these touches semantics. All three are reversible. **The decision gate is OTTAVIO's eye on the first
phase-F render**, not this document.

---

## §19 A-F17 · TWO LEAK CLASSES THAT ESCAPE BOTH FIREWALL TIERS *(PINK — adopted)*

I invited a leak class that escapes both tiers of PF-8 as the finding of the phase. PINK brought two, as
reasoning rather than assertion, and both are right.

**(a) The low-count leak.** A halo or gradient edge grazing **under 1 %** of sign pixels, coherent at the breath
frequency. Tier A is blind: the pooled mean over 178 k pixels barely moves. **Tier B is blind by definition**: a
p99 is the 99th percentile, so fewer than 1 % of pixels can leak arbitrarily hard and stay underneath it.

**(b) The harmonic leak.** A-F1's waveform is **4 s : 6 s — deliberately not sinusoidal**, so its energy sits at
0.1 Hz *and its harmonics*. Both tiers fit the fundamental alone, so a leak whose dominant component is the
second harmonic under-reads in both. The asymmetric waveform I chose for R18's sake is exactly what opens this.

### Adopted

**Tier C — population, not percentile.** PF-11's ladder logic applied to the lock-in: the **count** of sign
pixels whose coherent amplitude exceeds each of 0.001 / 0.002 / 0.004 / 0.008 must be ≤ **1.5×** the count at the
decoy frequencies. A population comparison has no percentile for a small leak to hide under.

**Harmonics in both the signal and the null.** The firewall amplitude is the root-sum-square over the breath's
first three harmonics (`T`, `T/2`, `T/3`); the null is the RSS over three frequencies incommensurate with all of
them (`T/2.7`, `T/4.3`, `T/5.9`), so the null carries the **same degrees of freedom** as the signal and the floor
stays comparable. Measured cost: tier A's floor rose from 0.00001 to 0.00007 — still 7× under its bound.

### Measured at base, and tier C is the sharpest instrument of the three

| tier | at `9cc06f84` | verdict |
|---|---|---|
| A — pooled RSS | 0.00014 against a bound of 0.0005 (floor 0.00007) | **green, correctly** — a moving ring conserves pooled light |
| B — per-pixel p99 | 0.00629 against a floor of 0.00287 | **red**, by 2.2× |
| C — population ladder | signal 24 210 / 18 218 / 10 584 / 163 vs null 22 586 / 8 703 / 323 / 4 → ratios **1.07 / 2.09 / 32.77 / ∞** | **red**, by 32.8× at 0.004 |

Tier C separates by more than an order of magnitude where tier B separates by 2.2×. **PINK's addition is the
strongest limb of the firewall**, and it was derived from the structure of the statistic rather than from a
render.

**PF-8 is now three tiers, all of which must pass.** §17's row is amended accordingly.

### A seventh instrument defect, mine

PF-10 read `data-capability` in the same tick as it dispatched the click, before React had re-rendered. It
returned `""` — an unselected field reported as a selected one, and a meaningless ratio with it. The probe now
reads the attribute after the re-render and **throws** if nothing is selected, rather than measuring an
unselected field and calling it PF-10.

---

## §20 B-8 · AN OPEN-ENDED RANGE MEASURES LATER PHASES *(GRÜN — accepted, with one guard added)*

`architecture.test.ts:255` (MAP-E-ARCH / B-8) asserts that every phase-E change set touches only `E_ENTRY`, built
over `${PHASE_E_BASE}..HEAD` **plus the working tree**. Every phase-F commit falls inside that range and is
counted as a phase-E change set, so phase F's one legitimately new file — `field-f.test.tsx` — turns it red.

GRÜN again brought it rather than taking either evasion (appending the phase-F proofs to `field-e.test.tsx`,
which would leave B-8 saying nothing about phases; or extending `E_ENTRY` retroactively, which would make it
say something false).

**This is the defect PINK already found in phase D** (F-PC-1 / O-RC-1): an open-ended range measures later
phases. It is a *mechanism* pin under §12's amended B-F2, and closing the range makes the test say what it always
meant, over exactly the commits that are phase E.

### Accepted as proposed

- **B-8** evaluates phase-E change sets in **`${PHASE_E_BASE}..${PHASE_F_BASE}`** (`9cc06f84`), no working tree.
  Meaning unchanged — *phase E touched only its entry set* — and in fact sharper, because the open-ended form
  conflated two phases.
- **New MAP-F-ARCH** against `PHASE_F_BASE`, same pattern, with `F_ENTRY` = `PersonJobMappingField.tsx`,
  `neurovisual-e.test.ts`, `field-e.test.tsx`, `field-f.test.tsx`, `architecture.test.ts`, `phase-base.ts`.
- **Byte-identity guards**, which are stronger than an entry list and are what actually protect the boundary:
  `lib/career/**` byte-identical since `9cc06f84` (§6), golden vectors byte-identical, the protected host paths
  unchanged (B-F6), the copy unchanged, no merge after the base, no provider string in the added lines (B-F7).
- `PHASE_F_BASE` into `phase-base.ts` beside `PHASE_E_BASE`, resolved on demand, failing loudly in a shallow clone.

The literal file list is kept over phase D's directory bounding: `PHASE_DIRS` is what let phase E's new test files
through unnoticed in the first place, and a list plus byte-identity is strictly tighter.

### A-F18 · A range test must prove its range is not empty *(GELB — the guard)*

Closing a range creates a new way to be green by construction, and it is the eighth instance of that class this
phase. If `PHASE_E_BASE..PHASE_F_BASE` were ever empty or inverted — a rebase, a mistyped constant, a shallow
clone resolving to the same commit — **B-8 would pass over nothing at all** and report it as compliance.

**Binding on both range tests:** each must assert that its range contains **at least one commit**, and that its
endpoints are in the expected ancestry (`PHASE_E_BASE` an ancestor of `PHASE_F_BASE`, `PHASE_F_BASE` an ancestor
of `HEAD`). A range test that cannot fail because it examined nothing is the same defect as a proof that cannot
fail because it measured the wrong thing.

### A-F19 · PF-3's halo is measured differentially *(GRÜN — accepted)*

GRÜN measured that `halo peak ÷ core peak` taken from a **raw** window is confounded at the shelf edge: rank 4
sits exactly at r = 430, so its halo window reads 0.028 — which is the **lit ground inside the shelf**, not the
halo — and returns 0.31 against a 0.25 ceiling. Red for entirely the wrong reason.

Measured **differentially** (a render with the halo minus a render without it), the halo excess is 0.0035–0.0076
and the ratio 0.039–0.083 across all five bodies — comfortably inside the ceiling.

**PF-3 is amended: the halo is measured as an excess against a render without it, never as a raw window.** This
is the same class as my own M-F4 defect — a window that reports what is in it rather than what put it there — and
the same fix as PF-8's sign mask, which already isolates by suppression rather than by location. Suppression is
becoming this phase's general answer to "which pixels are whose".

---

## §21 A-F20 · THE INSTRUMENT RUNS OUT OF RESOLUTION ON THE FREQUENCY AXIS *(PINK — adopted, and it applied to me too)*

PINK built the three-tier firewall independently and **confirmed all three verdicts at base** — tier A green
(0.000155 against 0.0005), tier B red (2.79×), tier C red (27× at 0.004), and tier C the sharpest limb on its
instrument as on mine. Two independent builds, same verdicts, same ordering.

The valuable half is what PINK found in its own hands first. Its first build used a **uniform DFT** over 14 frames
at 849 ms and **falsely near-passed**: tier B 1.04×, tier C mid-rung 1.39×. A sampling-induced green by
construction — produced one message after we agreed the rule that exists to stop it.

**Cause.** This machine renders a screenshot in 600–1100 ms (SwiftShader software raster of the host's 17
backdrop-filters and 800 px core — A-F2's cost). A uniform DFT at that cadence **aliases the decoy frequencies**,
inflating the null until floor ≈ signal and the separation collapses. PINK's tell was the tier A floor: 1e-4 under
the bad estimator, 1.6e-5 under the good one. A tenfold floor drop is the signature of a decoy that finally
resolved.

**A-F11 carried onto the frequency axis.** *A bound the instrument cannot reach is not a bound* — and on this
host the frequency axis is exactly where the instrument runs out of resolution.

### Adopted, and my harness was wrong in the same way

**The lock-in is one SIMULTANEOUS least-squares fit of DC plus every frequency of interest, over a long,
naturally jittered window** — never a short uniform DFT, and never one frequency at a time. Jittered sampling
with a joint LSQ has no uniform-Nyquist bound and the aliasing does not form. **Every run reports its own window
and its own decoy floor**, and a floor that has not resolved invalidates the run.

My harness was not using a DFT — it fit against recorded timestamps — but it was wrong twice over:

1. it fitted **each frequency separately**, letting them leak into one another;
2. its decoys sat at 0.27 / 0.43 / **0.59 Hz**, and **0.59 Hz is above the Nyquist of a ~1 s cadence**.

The decoys are now placed at **0.15 / 0.25 / 0.35 Hz** — exactly between the harmonics (0.1 / 0.2 / 0.3), so
maximally separated from them, and all below the cadence's Nyquist. The window is **48 frames over 47 s — 4.7
periods** — and the fit is joint across all thirteen parameters, with the normal matrix built and inverted once
for every pixel.

| | separate fits, decoys to 0.59 Hz | joint fit, decoys 0.15/0.25/0.35 Hz |
|---|---|---|
| tier A floor | 0.00007 | **0.00001** |
| tier B signal ÷ floor | 2.2× | **3.45×** |
| tier C ratios | 1.07 / 2.09 / 32.77 / ∞ | **2.27 / 21.11 / 236.45 / ∞** |

The tier A floor fell by exactly the sevenfold PINK's tell predicts, and **landed on PINK's independently measured
1.6e-5**. Two instruments, corrected separately, converging on the same floor. Every limb got sharper; tier C now
separates by 236× where it managed 32.8×.

**PINK's note for the tip is accepted in advance:** at base a sign mask taken as *stage minus svg-hidden* is clean
because there is no lit ground, but on GRÜN's build it would sweep the breathing ground into the sign set and
count the medium's own breath as a firewall leak. On the tip the mask must be **per-element sign-hide**. My
harness already hides by element selector; PINK is switching to the same.

**Eighth and ninth instrument defects**, both mine, both in the estimator rather than the capture.

---

## §22 THE HARNESS IS COMPLETE AND HONEST AT BASE

All fourteen measurable obligations now run. At `9cc06f84`, with the corrected estimator (§21) and the full
48-frame / 4.7-period window:

| # | at base | verdict |
|---|---|---|
| PF-1 | disc median 0.00181, frac above 0.005 = 0.150 | red |
| PF-3 | **0 halo elements present** | red — phase-F body volume not built at this tip |
| PF-5 | 0.0134 swinging ≥ 0.004 | red |
| PF-6 | swing max 0.0421 | red on the ceiling |
| PF-7 | amplitudes ≈ 0, lag spread 8 657 ms, not monotone | red |
| PF-8 | A green (0.00014 / floor 0.00001) · B red (3.45×) · C red (**236×** at 0.004) | red |
| PF-9 | `data-breath="LIVE"` | **NOT RUN** — needs `FACADE_VARIANT=running` |
| PF-10 | unselected amplitude 0.00002 | **INCONCLUSIVE** — see below |
| PF-11 | ratios 6.65 / 21.09 / ∞ / ∞ | red |
| PF-15 | 1.316 / 0.895 / 0.573 | red |

**PF-9 reports NOT RUN rather than passing.** An obligation that cannot be reached in the variant under test says
so. The `running` variant will be served for the tip measurement.

**PF-10 reports INCONCLUSIVE, and this is the tenth application of A-F11.** The probe correctly selects
`PCAP_K8` now (its earlier `""` was defect seven), and the ratio comes out at 0.47 — apparently just outside the
0.45 bound. But the two amplitudes it divides are **0.00002 and 0.00001**, both at the noise floor. At base there
is no field-wide breath to halve, so **a ratio of two floor values is not a measurement**. PF-10 now requires the
unselected amplitude to be ≥ 0.0002 in its own right before the ratio means anything, and says INCONCLUSIVE
otherwise rather than reporting a number that looks like a near-miss.

That is the same error in its tenth disguise, and the first time this phase it was caught by the rule rather than
by a lane. The discipline is working: the instrument now refuses to produce a verdict it has not earned.

**Standing count: ten instrument defects, nine mine.** Seven of the ten were a measurement whose verdict could
not depend on the build — green by construction, red by construction, a range that examined nothing, or a ratio
of two noise values. **That class is now the first thing checked on every obligation, before it is checked
against the build**, and §17's table is read with that check applied.

---

## §23 A-F21 · THE WINDOW'S MINIMUM IS FREQUENCY RESOLUTION, NOT PERIOD COUNT *(PINK's finding, derived)*

PINK adopted A-F20 and reproduced the convergence: its tier A floor landed at 1.8e-5 against my 1e-5, from two
instruments corrected out of two *different* starting errors — mine a per-frequency fit with a decoy above its
own Nyquist, PINK's a uniform-DFT alias. Tier C sharpened on its instrument the same way as on mine (27× → 53×
→ 117× as the decoys moved and the window lengthened, against my 33× → 236×).

PINK then found that **the floor is window-length dependent and keeps dropping until it settles** — tier A 3.6e-5
at 26 s, 1.8e-5 at 47 s — and proposed stating a minimum of ~4.7 periods so neither of us runs a short window on
the tip and reads a floor that is still falling.

**The finding is right; its reason is better than "where it looked flat", and the reason gives a rule that
generalises.** Sample count alone predicts the floor falls by √(47/26) = **1.34×**. PINK measured **2.00×**. The
excess is not sampling — it is **frequency resolution**:

| window | resolution 1/T | decoy↔harmonic separation (0.05 Hz) |
|---|---|---|
| 20 s | 0.0500 Hz | **1.00 cells** |
| 26 s | 0.0385 Hz | **1.30 cells** |
| **40 s** | 0.0250 Hz | **2.00 cells** |
| 47 s | 0.0213 Hz | 2.35 cells |

At 26 s the decoys sit 1.3 resolution cells from the harmonics, so the signal **leaks into the null** and inflates
it. The floor was not noisy, it was *biased*. PINK's 47 s is where it looked settled because that is where the
leakage stops, not because 4.7 is a special number.

### The rule

> **The window must be at least `2/Δf`**, where Δf is the smallest spacing between any signal frequency and any
> null frequency. With harmonics at 0.1 / 0.2 / 0.3 Hz and decoys at 0.15 / 0.25 / 0.35 Hz, Δf = 0.05 Hz and the
> minimum is **40 s**. Additionally, every run **self-checks that its floor has settled** by re-fitting the first
> 70 % of its own window: a floor still falling means the run has not earned a verdict and reports
> **INCONCLUSIVE**.

This generalises — if the frequencies ever move, the minimum moves with them and nobody has to remember 4.7.

**Measured on my harness at base:** window 49.5 s / 5.0 periods, resolution 0.0202 Hz, decoy separation **2.48
cells**, `longEnough` true, floor-settled ratio **1.47** (bound 1.6). The 70 % sub-window sits at 1.73 cells —
just under the two-cell threshold — which is exactly why its floor reads higher, and why the check reads 1.47
rather than the 1.2 that sampling alone would give. The self-check is measuring the thing it was built to
measure.

Both harnesses now carry: joint LSQ, decoys at 0.15 / 0.25 / 0.35 Hz, ≥ 40 s window with a settling self-check,
per-element sign-hide, differential PF-3, and A-F11's own-floor check on every temporal obligation.

---

## §24 A-F22 · THE FIREWALL MUST BE MEASURED PER CLASS — GRÜN'S MUTANT SURVIVED BOTH TIERS

GRÜN ran browser mutants against its own build. Six turned their obligation red as intended. **One survived:
`F8` — the arc seat removed — passed tier A (2e-6) and tier B (0).**

**Why.** The sign mask is a pool of wildly unequal populations. The shelf band alone is about half of ~173 k
sign pixels; the rings ~10 k; **arcs and ticks at L0 are 807 pixels.** A leak confined to the ticks therefore
carries **0.47 %** of tier A's mean — and tier B's p99 over 173 k pixels is the 1 730th-highest value, so **807
leaking pixels fit entirely underneath the tail.** The statistic cannot see a leak smaller than its own
percentile. This is PINK's low-count class (§19 a) in its worst form, because the pool is dominated by a
population nobody is asking about.

**Adopted: tiers A, B and C are measured PER CLASS** — arcs/ticks, beams, nodes, text, rings, outlines — each
against its own bound and its own null. §17's PF-8 row is amended.

GRÜN also withdrew its own earlier "PF-8 exactly 0", correctly identifying it as the same dilution artefact in
its instrument. Measured per class, its tip at a 0.5 px seat pad showed a **real leak**: ticks tier A 0.00065
(over the 0.0005 bound), text p99 0.0025, outlines p99 0.0020.

**The cause is antialiasing coverage, not logic.** A seat only 0.5 px wider than a 1.3 px tick does not fully
cover that tick's edge pixels at an oblique angle, so the medium shows through by (1 − coverage). The firewall
leaked through geometry.

### My own eleventh defect, found by GRÜN's pixel count

My first per-class run returned ~20 000 pixels for *every* class — 25× GRÜN's 807 for arcs, and nodes, text and
outlines all landing implausibly within 400 pixels of one another. Cause: each class mask was diffed against
`frames[0]`, captured **~60 s earlier**, so the breath's own movement across that interval landed in every mask.
Masks are now built on a page under `prefers-reduced-motion`, where nothing moves at all and element positions
are identical, and the live clip is asserted to match. Corrected counts: arcs 5 802, beams 7 019, nodes 5 537,
text 6 400, outlines 8 004, **rings 164 896** — which confirms GRÜN's point directly: the rings class alone is
92 % of the pool.

**Per class at base, the instrument now localises the leak instead of merely reporting one:**

| class | px | tier A | tier C ratios | |
|---|---|---|---|---|
| rings | 164 896 | 0.00020 | 3.17 / **236.26** / ∞ / ∞ | **red** |
| outlines | 8 004 | 0.00003 | 0.69 / 1.36 / 3.43 | red |
| beams | 7 019 | 0.00003 | 0.74 / 1.23 / 1.54 | red (marginal) |
| arcs | 5 802 | 0.00007 | 0.69 / 0.92 / 1.50 | green |
| nodes | 5 537 | 0.00012 | 0.99 / 0.82 / 1.40 | green |
| text | 6 400 | 0.00008 | 0.48 / 0.59 / 0.71 | green |

At base the one breathing thing is the field **ring**, and the ring class is red by 236× while the rest are near
clean. The pooled form said only "red"; the per-class form says *where*.

## §25 A-F23 · THE SELF-CHECK WAS CONFOUNDED BY ITS OWN SUB-WINDOW *(PINK — adopted)*

PINK measured the tier A floor against window length directly, from one 62 s capture with nested offline fits:

| window | cells | floor |
|---|---|---|
| 20 s | 1.00 | 3.28e-5 |
| 26 s | 1.30 | 3.12e-5 |
| 33 s | 1.65 | 3.03e-5 |
| **40 s** | **2.00** | **2.64e-5** |
| 47 s | 2.35 | 2.76e-5 |
| 54 s | 2.70 | 2.53e-5 |
| 62 s | 3.10 | 2.65e-5 |

**The floor falls until two cells and then flattens** — A-F21's `2/Δf` measured directly rather than derived.
4.7 periods was never special.

And PINK found the flaw in my self-check: **re-fitting the first 70 % makes a shorter window**, so when the full
window sits near `2/Δf` the sub-window falls *below* it and reads a high floor from **its own resolution**, not
from a still-falling floor. At my 49.5 s window the sub-window was 34.6 s = 1.73 cells, and PINK's curve puts a
33 s window ~1.16× above the plateau on resolution alone — most of my observed 1.47. **My self-check passed
partly for the wrong reason.**

**A-F21 amended:** the full window must be long enough that the **sub-window** also clears two cells —
`2/(0.7·Δf)` ≈ **57 s** for these frequencies — rather than a flat ratio bound. Re-measured on my harness at a
65.6 s window: sub-window **2.29 cells**, floor-settled ratio **0.99** against the previous 1.47. PINK's
diagnosis confirmed exactly.

PINK's absolute plateau (~2.6e-5) against my converged 1e-5 is a mask-inclusiveness difference (its
stage-minus-svg 200 k against my 178 k); per-element sign-hide on the tip should close it. **The reproducible
result is the shape — it settles at two cells — not the absolute number.**

---

## §26 A-F24 · THICKER TICKS vs A-6's EMPHASIS CHANNEL — AND A COVERAGE GAP IN MY OWN PROOF

I suggested thicker collar ticks to buy the same firewall tightness for half the dark rim (§24). That collides
with **A-6**, where emphasis rides the stroke width: `width = (open || marked || emphasis ? 2 : 1.3) * k`
(`PersonJobMappingField.tsx:181`). A 2.0 px base tick is exactly the emphasised width.

**Verified in the source, and GRÜN's resolution is correct.** The L0/L1 collar ticks are drawn at `:462` with
**neither `interactive` nor `emphasis`** — they are always `1.3 * k` and can never be emphasised. The L2/L3 ring
arcs are drawn at `:669` **with both**. So thickening *only the non-interactive collar ticks* cannot disturb the
emphasis channel, because emphasis does not exist where they are drawn.

**D-Q3 checked, not assumed.** "The collar at L0/L1 and the ring at L2 are one output drawn at two radii; going
deeper magnifies and never changes what a mark means." A width difference between the two does not breach it:
D-Q3 binds **meaning**, and width carries only emphasis, which is absent at L0/L1. Nothing a reader can decode
changes. Adjudicated rather than left implicit.

### The gap this exposes, which is mine

**The L2 ring arcs cannot be thickened** — 2.0 px is taken by emphasis — so at L2 the firewall must be carried by
the seat pad alone, and the dark rim will appear there regardless of what happens at L0. Which means:

> **PF-8 must be measured at L2, not only at L0.** My harness measures the default view, which is L0. GRÜN's
> per-class leak was found on ticks at L0 — the arcs that are *interactive and emphasisable* live one level down
> and were never in anyone's mask.

A firewall certified at one level is not a firewall. §17's PF-8 row is amended: **every level that draws evidence
— L0, L2 — is measured, per class, separately.** L1 and L3 follow if they draw marks the other two do not.

This is the twelfth defect of the phase and the eighth of the "a measurement that cannot fail" family, in a new
disguise: not a statistic that could not see the leak, but a *view* in which the leaking element was not on
screen.

---

## §27 A-F25 · THE NULL WAS SPECTRALLY ASYMMETRIC — A SYSTEMATIC FALSE-RED *(PINK — adopted and confirmed)*

PINK built the per-class firewall independently and matched me on rings, outlines and arcs. It diverged on
nodes and text — mild tier C red (~2–2.5×) where I read clean — chased it, and found the cause in **my** frequency
choice.

**The decoys 0.15 / 0.25 / 0.35 Hz each sit +0.05 Hz ABOVE a harmonic 0.1 / 0.2 / 0.3.** The null therefore
samples a systematically *higher* part of the spectrum than the signal. Raster and compositor noise is not
guaranteed white, and if its spectrum falls with frequency, **the signal band carries more noise power than the
null band and signal/null exceeds 1 with no leak present.** A systematic false-red built into the instrument's
design, affecting both harnesses — PINK was right that I might look clean only because my element-coverage mask
excludes the fringe carrying it.

**Adopted: the null brackets each harmonic instead of sitting above it.** Decoys at **0.05 / 0.15 / 0.25 /
0.35 Hz**, and for each harmonic `f_k` the null component is the **RMS of its two brackets** at `f_k ± 0.05`. The
null is then spectrally *centred* on the signal and keeps the same three degrees of freedom, so A-F17's variance
matching survives.

**Measured, and the spurious reds disappear:**

| class (L0) | px | tier A / its floor | tier C | |
|---|---|---|---|---|
| rings | 165 204 | 0.00020 / 0.00001 | — / — / **125.54** / ∞ | **red** |
| arcs | 3 443 | 0.00017 / 0.00010 | — | green |
| beams | 6 207 | 0.00011 / 0.00008 | — | green |
| nodes | 5 618 | 0.00007 / **0.00020** | — | green |
| text | 5 326 | 0.00013 / 0.00027 | — | green |
| outlines | 4 255 | 0.00006 / 0.00016 | — | green |

At L0 only the rings class is red, which is correct — the ring is the one thing that breathes at base. **At L2
every class is green**, also correct: nothing there moves at all yet. The previous run's `nodes` reading of ∞ was
the asymmetry, not a leak.

### Two further guards, from the same exchange

**PINK (erosion):** eroding each mask 1 px to an interior collapses the thin classes — arcs 9 462 → 1 143 px,
nodes → 1 789 — and the null counts go to nothing, blowing ratios to ∞. **Thin marks are almost entirely
antialiasing fringe**, which confirms GRÜN's coverage diagnosis from a third direction. The firewall mask must be
the **full seat footprint**, so the fringe is unavoidably inside it, and **tier C needs a minimum class
population** — below 1 000 px it is not evaluated.

**GELB (low rungs):** tier C's rungs at 0.001 and 0.002 sit *inside* the per-pixel noise, where signal and null
are two different random draws and their ratio floats freely. They produced red on text and nodes at base L2
where no ground exists to leak. **A rung below 2× the measured per-pixel floor is not evaluated** — A-F11 applied
to the ladder itself.

**Defects thirteen and fourteen, both mine**: a ladder whose low rungs could not discriminate, and a null that
could not be symmetric. Fourteen total this phase, thirteen mine. Nine of the fourteen were a measurement that
could not do its job — and this pair adds a direction nobody had watched: not *failing to fail*, but **failing
when nothing is wrong.**

### A-F25 confirmed independently

PINK took the dof-matched bracketed form and re-ran base L0 on its own instrument (112 frames / 58.5 s):
rings tier A **0.000195 / floor 1.96e-5** against my 0.00020 / 1e-5; rings red (B 4.01×, C 5.67 / 37.75 / 74.91 /
∞) and **every other class green**.

The confirming detail is not the agreement but the **signature**: PINK's quiet classes moved from ~2–2.5× to
**below 1.0**. A non-leaking class should sit *at or under* its null once the null is spectrally centred, and that
is what both instruments now show. The mild red PINK first reported was the shared asymmetric null — present in
both harnesses because both took my frequencies — diagnosed on PINK's instrument and removed on both.

**Second false-red direction closed on both lanes.** The instruments are aligned on every method: joint LSQ;
bracketed dof-matched null; ≥ 57 s window with the resolution-valid self-check; per-class masks built under
reduced motion; per level L0 + L2; minimum 1 000 px per class; live-rung guard; differential PF-3; PF-9 NOT-RUN;
PF-10 amplitude guard; and the two-limb checklist — *can this measurement fail*, and *is the thing it must fail
on even in the frame*.

**PF-9's path validated by GELB before the tip**, so it is not discovered at the moment of measurement: the
façade's `running` variant serves `RUNNING`, and the stage answers `data-breath="STILL"`, `pendingBreath=true`,
ring `STILL`, pending outline displayed. The façade was restored to `default` immediately afterwards.

---

## §28 THE TIP, SEEN — TWO DEFECTS THE WHOLE PROOF SURFACE WAS BLIND TO

Tip `ef466ca8`, served on GELB's own render (3020/3021), 1920 × 1080. GRÜN reports 232/232 mapping suites, 18/18
unit mutants red, every PF obligation green on its instrument. **I looked at it, and the loudest thing in the
field is a defect.**

The disc now genuinely carries light — the host is gone inside it, there is depth, the bodies are luminous beads
with halos. That part works. But four **black radial gashes** run from the person circle to the disc edge, and
they are more visible than any evidence mark on the stage.

**M-F8 · measured across the gashes** (horizontal cuts, relative luminance):

| cut | ground left | seam | ground right |
|---|---|---|---|
| y = 300 | 0.0206 | **0.0063 → 0.0033** | 0.0293 |
| y = 300 (second) | 0.0293 | **0.0150 → 0.0054** | 0.0283 |
| y = 840 | 0.0145 | **0.0022** (and a 0.0431 spike) | 0.0158 |
| y = 840 (second) | 0.0189 | **0.0020 → 0.0043** | 0.0271 |

`elementsFromPoint` returns **no element** on the gashes — only the svg. They are not something drawn. They are
places where the ground is **absent** and the opaque black stage shows through.

### A-F26 · The wedge step is 30 %, not 8 % — the gamma error again, in the other lane

F-4 bounds the pool wedge at **± 8 %** of the local ground and at **≤ 0.004** above it. GRÜN implemented it as a
black alpha of 0.148, reasoning `1 − 0.852 = 0.148` → 8 % about the mean. Measured:

> sRGB factor 0.852 → luminance ratio **0.699**, a drop of **30.1 %**. The measured ground pair 0.0206 / 0.0293
> gives **0.703**. Exact agreement. The step is **0.0087** against a bound of 0.004 — over by 2.2×.

**An sRGB alpha is not a luminance ratio**, because the blend happens in gamma space. This is precisely the error
I made in A-F9 and that GRÜN corrected in me — now made by GRÜN, in the same phase, in the other direction. The
lesson is evidently not transferable by being written down once: **any rule stated as a percentage must say
whether the percentage is of sRGB or of luminance.** F-4 did not, and that omission is mine.

### A-F27 · The sector seam encodes nothing and is louder than the evidence

At every sector boundary the ground drops to **0.002 – 0.006** against a local ground of 0.015 – 0.029 — a 5–10×
dark line, 2–4 px wide, running the full radius. It is in no specification, carries no meaning, and is the
highest-contrast feature in the entire field. A reader's eye goes to it first, and it says nothing.

Against the phase's own principle it is the worst possible mark: E-1 gives every question one channel, and this
is a maximum-contrast line assigned to **no question at all**.

### A-F28 · The real defect is mine: F-4 has no proof obligation

Why did a surface of fifteen obligations, two independent instruments and eighteen unit mutants not catch the
loudest feature on the stage? Because **I never wrote a proof for F-4.**

Every other F-rule has one — F-1 → PF-1, F-2 → PF-3, F-3 → PF-4, F-6 → PF-5/6/7, the firewall → PF-8, and so on.
F-4 (pools are regions) states a bound and **no obligation was ever attached to it.** GRÜN's instrument reported
green honestly: nothing it was asked to measure was wrong. The gap was in what it was asked.

Nor does any obligation measure the ground's **spatial continuity**. PF-1 bounds the disc's median and the
fraction above a threshold — both of which a field with black gashes through it passes comfortably, because four
thin lines move neither statistic.

**Two obligations added:**

| # | Obligation |
|---|---|
| **PF-16** | The pool wedge step, measured in **relative luminance**: adjacent wedges differ by ≤ 0.004 and by a ratio within [0.92, 1.09]. Stated in luminance explicitly, never as an sRGB alpha. |
| **PF-17** | **Ground continuity.** Along any circle inside the disc, no run of pixels falls below **0.6×** the local median ground for fewer than 12 px — i.e. no thin dark seam. Sampled at ≥ 8 radii, both viewport sizes. A mark may be dark; the *medium* may not have holes in it. |

**This is what the mandate meant.** *"Prüfe die tatsächliche visuelle Wirkung im laufenden Browser, nicht nur
technische Eigenschaften oder Testwerte."* 232 green tests, 18 red mutants and fifteen green obligations did not
see the first thing a human eye lands on. The tip goes back.

---

## §29 GELB'S MEASUREMENT OF `ef466ca8` — WHAT IS THE BUILD, AND WHAT IS MY INSTRUMENT

64 frames over 101 s (10.1 periods, cadence 1603 ms — the phase-F stage is ~1.5× heavier to render than base),
decoy separation 5.05 cells, sub-window 3.53 cells, floor settled.

### Confirmed green, independently, and close to GRÜN's numbers

| # | GELB | GRÜN | |
|---|---|---|---|
| **PF-1** | median **0.02186**, frac above 0.005 **0.736** | 0.0226 / 73.5 % | green |
| **PF-5** | **0.647** swinging ≥ 0.004 | 62.7 % | green |
| **PF-6** | max **0.01124**, mean/500 ms **0.00040** | 0.0108 / 0.00044 | green |
| **PF-10** | **0.39** (0.00214 → 0.00084, both far above the noise guard) | 0.388 | green |
| **PF-11** | **ratios 1 / 1 / 1 / 1**, no element with a duration | 0 pixels | green |

**PF-11 is the one to notice.** At base it read 6.65 / 21.09 / ∞ / ∞ — the host moving under the field through
the 8 % ground. On the tip it is exactly 1 at every threshold. **`DISC_GROUND_OPAQUE` does what A-F4 claimed it
would**, measured on a different instrument from the one that proposed it.

### Three reds that are my instrument, not the build

**PF-3 — my footprint denominator is the body's whole disc.** `outlineFootprint` counts every pixel above 0.004
inside the body radius. With a lit ground at 0.0219 *every* such pixel qualifies, so the denominator is the disc
area rather than the outline, and the ratio collapses to **1.08 by construction**. The halo limb is fine
(halo/core **0.015** ≤ 0.25). GRÜN's differential method is right and mine is not; the outline must be isolated by
suppression, like everything else in this phase.

**PF-7 — I measured phase where there is no wave.** My bands span 0…1 of the **field ring**, but the ground ends
at `shelfNear`. Band 0 is the person's disc, which A-F8 makes *static*; bands 8–9 are the shelf, which is a ring.
Neither carries a wave, so their phase is noise, and the "not monotone" verdict comes entirely from them.
**Bands 1→6 read −2736 → −1945 ms: monotone, span 791 ms** — which *confirms* GRÜN's wave rather than refuting
it. My verdict was wrong while my data was right.

**PF-15 — my sampler takes the maximum, and the rings are now dark.** A-F12 made the faint rings *engraved*:
shelf 0.0036, field 0.0058, best-fit 0.0123 against a ground median of **0.0219**. A dark ring is a **minimum**,
so `max()` within the band reads the surrounding ground and not the ring. My p50s invert GRÜN's ordering for
exactly this reason. The sampler must take the extremum **away from** the local ground, or measure the ring
differentially.

**Defects fifteen, sixteen and seventeen, all mine** — and all three are the same shape: **a statistic written
for a black field, run on a lit one.** Phase F changed the ground out from under my own instrument and I did not
revisit the statistics that assumed the old one.

### A-F29 · A self-calibrating bound tightens as the instrument improves

PF-8's tier B is `p99 ≤ 2× the run's own decoy floor`. I chose that in §16 because 26 frames could not resolve
A-F5's physical 0.002. With 64 frames over 101 s the floor is now **0.00027**, so the bound has silently become
**0.00054** — four times *stricter* than the physical limit it was standing in for.

That is wrong in a way worth naming: **the antialiasing fringe is physical, not instrumental.** A bound tied to
the instrument's floor will eventually reject any real system as the instrument gets better. GRÜN predicted the
fringe would land at p99 ≈ 0.002 (max 0.0045); I measure arcs at **0.0033**.

**Tier B amended: `p99 ≤ 0.002` absolute** — A-F5's original physical bound — **with the run required to resolve
it** (floor ≤ 0.0004, which this run meets at 0.00027). The floor-relative form stays only as the *admissibility*
check, never as the bound itself.

Under the corrected bound, at L0: beams 0.00072, outlines 0.00132, nodes 0.00167, text 0.00177 all pass; **arcs
at 0.0033 do not.** That is the one firewall question that survives my own errors, and it is the one GRÜN
flagged in advance as the AA fringe of the thinnest ticks.

---

## §30 RE-DELIVERY `93c47e03` — THE GASHES ARE GONE, AND FOUR MORE ADJUDICATIONS

**The gashes are fixed, confirmed on my own render.** The same cuts that read 0.0033 and 0.0054 at `ef466ca8`
now read **0.0381 and 0.0448** — the sector edges are faint *light* lines where they were black holes. Looking at
it, the disc now reads as one coherent luminous dome. GRÜN's diagnosis was right and better than mine: they were
not a rendering seam but the **seats under the sector edges**, black, 2.8 px, the full radius, invisible to
`elementsFromPoint` because seats are `pointer-events: none`. A structure that lies *in* the medium now rests on
the medium.

GRÜN also found the matching defect in its own PF-17: its first run was green at the old tip because it selected
the sector seats *by colour*, so the black ones were classified as "sign" and masked away. Same family as mine.

### A-F30 · The firewall cannot be enforced on a sub-pixel stroke — tier B is NOT RUN there

GRÜN measured the cost of closing the arc-tick leak: pad 1.6 → p99 0.00247; pad 2.4 → p99 0.00179. **+0.8 px of
rim per side buys −27 %.** Reaching my jittered 0.0033 would need ≈ −40 %, i.e. a pad ≥ 3 px — 1.5 px of black
around a 1.3 px dotted tick. The collar would become a black wreath.

The right answer is not to move the bound to fit, nor to build the wreath. It is geometric: **a 1.3 px stroke has
no fully-covered pixels.** Its rendered luminance is necessarily a blend with whatever lies behind it, and no
seat can change that. PINK confirmed it directly with an under-mark test: the ground's breath measured *beneath*
the tick's own footprint is 1.6e-3 — the medium is simply visible through a stroke thinner than a pixel.

> **Tier B and tier C are NOT RUN for a class whose strokes are ≤ 1.5 px.** Tier A alone carries the firewall
> there, and it binds: a *systematic* leak still moves the class mean, and arcs measure 2.9e-4 (PINK) / 3.0e-4
> (GELB) against a bound of 0.0005.

This is A-F11's rule, not an exception to it: an obligation that the geometry forbids from discriminating reports
NOT RUN rather than a verdict. The perceptual consequence is nil — a sub-1 % modulation on the fringe of a sliver
cannot shift an evidence band, which is what PF-8 exists to protect (A-F13).

**PINK's L2 result settles the other half:** at L2 every class passes, including the interactive, emphasisable
arcs of §26 that no one had ever measured. The ring arcs there are long, so proportionally little fringe. **The
thin-tick fringe is the firewall's one real limit, and it exists only at L0.**

### A-F31 · PF-16 widened to [0.88, 1.12], measured as a trimmed mean

GRÜN re-derived the wedge in luminance (0.022, ratio ≈ 0.95–0.96) and measured **1.056–1.087** at both sizes,
step ≤ 0.0026 — inside my [0.92, 1.09] but riding its edge at r = 350 (1.085–1.087, 0.3 % clear).

Its warning is correct and physical: **near black, one 8-bit code is ~5 % of luminance**, so a 2–3 % sRGB shade
rounds to one or two whole codes. [0.92, 1.09] sits at the display's own quantization limit, and a bound the
*rendering* can barely resolve is the same error as a bound the *instrument* cannot reach.

**PF-16 is widened to [0.88, 1.12]**, measured as a **trimmed mean per pool** (a median also sees the
quantization). The perceptual requirement — visible as territory, below every mark — is satisfied at 12 %, and
was plainly violated at the 30 % the gamma error produced. The shade stays at 0.022.

### A-F32 · PF-18 — continuity along radii, PINK's dual *(adopted)*

I asked PINK for a spatial property with no obligation. Its answer: **PF-17 scans along circles, so it catches
*radial* gashes — its dual, continuity along *radii*, is untested and would catch *annular* holes.** The ground is
seven stacked concentric layers (F-1), so a compositing gap between two layers is **ring-shaped**: it runs *along*
a circular scan and is invisible to it, and *across* a radial scan.

**PF-18 added: along ≥ 8 spokes from 0.2 R to 0.9 R, no run of pixels falls below 0.6× the local median medium.**
PF-17 and PF-18 together are the first obligations in this phase about *where* rather than *how much* or *when*.

### Defect nineteen, mine: a continuity scan that manufactures its own holes

My first PF-17/PF-18 hid every sign to isolate the medium. **In phase F a sign's seat is made of medium**
(A-F5, and now the sector edges), so hiding a sign *removes medium* and creates a hole where it stood. That run
reported 3 holes per spoke at r/R = 0.316 / 0.793 / 0.857, identical at every angle — which looks exactly like
PINK's predicted layer gaps and is in fact my own suppression.

With signs **visible** the scan is wrong the other way: it counts the signs themselves as holes (6 at 0.55 R,
7 at 0.85 R, ratio ≈ 0.045 — the accepted black seats around beams and ticks).

**Neither form is correct. The scan must keep every sign drawn and *exclude sign pixels by mask*** — a
differential render, as everywhere else in this phase. Suppression isolates a sign; it does not isolate the
medium, because the medium is partly underneath the signs.

One genuine item survives both errors and I am taking it to OTTAVIO rather than to GRÜN: **the person's boundary
circle reads as a hard dark ring** at r/R ≈ 0.316, ratio 0.012 with signs visible. It is the most salient
structure in the field after the disc edge. That is a design question, not a defect.
