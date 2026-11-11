# PG-17 · the seal is released, as evidence — GRÜN, §45 A-G166

**Verdict: NONE.** This lane returns no verdict, before or after a seal (A-G36 point 2). What follows is a
measured profile of the glow at `3ec8457d` and a statement of what that measurement does and does not support.

The three files stay **byte-identical** to what was committed under seal — that was the point of sealing them
and it survives the release. Nothing here revises them; `pg17-seal-reanchor.json` is computed *from* them.

| file | viewport | level | carries |
|---|---|---|---|
| `SEALED-pg17-L0-1920x1080.json` | 1920×1080 | L0 | **yes** |
| `SEALED-pg17-L0-1280x800.json` | 1280×800 | L0 | no |
| `SEALED-pg17-L2-1920x1080.json` | 1920×1080 | L2 | no (L2 is the ramp's best case) |

## Why it is released

A-G109/A-G111 sealed these so PINK's independent reading of PG-17 could not be contaminated by GRÜN's.
**PG-17 is withdrawn (§45 A-G165) and PINK will never read it**, so there is nothing left to protect. GELB
ruled the seal's purpose discharged and left the disclosure to this lane (A-G132). Published.

## What the measurement says

On the one case that carries, **every body's glow falls monotonically across the whole of its measurable
annulus.** Four of five never reverse at all; the fifth reverses once, at 2.75 r, by 2.9e-4 — about thirteen
8-bit code steps, so **not** the one-code quantum the reading's own epsilon covers. Its cause is **nicht
ableitbar** from these files: the band lies inside rank 5's own glow (edge 3.0 r) and this reading does not
separate a neighbouring emitter from the subject.

| rank | r_px | anchor | measurable | monotone run | breaks at | anchor set by |
|---|---|---|---|---|---|---|
| 1 | 34.62 | 1.05 r | 1.55 r | **1.55 r** | never | its own seat |
| 2 | 43.88 | 1.05 r | 1.65 r | **1.65 r** | never | its own seat |
| 3 | 33.98 | 1.10 r | 1.70 r | **1.70 r** | never | a further occluder |
| 4 | 31.76 | 1.05 r | 1.85 r | **1.85 r** | never | its own seat |
| 5 | 28.50 | 1.05 r | 1.95 r | 1.65 r | 2.75 r | its own seat |

The extents land at **1.55 … 1.95 r**, inside the **1.536 … 1.950 r** that A-G163 derives as observable. They
were never going to be compared against 1.5 or 1.6 r: those are the pin's figure and the rim's figure, and
neither is the annulus a pixel can see.

## Two defects in the sealed statistic, declared

Both were found by **writing the geometry down** for A-G163, not by measuring anything, and both were
invisible in the published figure because they pushed the same way.

1. **Anchored inside the occluder.** `gruen-pg17.mjs` runs its profile from the rim, `u = 1.0`, and breaks the
   monotone run at the first empty band. The seat occludes to `1 + seatHalfPx / r_px` — 1.018 … 1.092 r at the
   radii here — so the 1.00…1.05 band is seat, dash gap and antialias fringe, never a clean sample.
   **Rank 3's sealed extent of 0 is that break on a leading empty band, not a measured reversal**: its
   populated profile is monotone from 1.10 r down. A statistic reporting "not monotone" for "not measurable"
   is this lane's defect class 4 one level up.
2. **Run past the subject's own edge.** The profile runs to 3.0 r for every body, but a glow ends at
   `haloNear + 0.4t` — **2.6 r at rank 1**, reaching 3.0 r only at the last rank. The outer bands are local
   ground and neighbouring glows, so the sealed extents counted up to 0.4 r of not-the-subject as the
   subject's ramp. Same shape as `.mf-halo` including the still shelf glows: a carrier named in the
   renderer's vocabulary instead of the obligation's.

Net effect on the figures: the sealed strict extents overstate by 0.05 … 0.30 r where they are meaningful and
report 0 twice where the ramp is in fact monotone.

## §47 A-G162 — what the extent limb's live failure does to this release

GELB withdrew A-G162 after PINK broke the **extent** limb at widths ≤ 1260 px. That limb is live and PINK's;
this release covers the **core** limb (struck) and the **monotone** limb (un-failable). Two things it changes
here, both of which were latent in these files:

- **The `r_px ≥ 28` premise is conditional and this lane used it as if it were not.** PG-3 states the floor
  *for L0 1920×1080*; the ramp carries no viewport condition, and `r_device` moves with the window. The
  1280×800 reading above is the counterexample — radii **15.18 … 23.38 px**, every one below 28 — and it was
  published as "does not carry" rather than as "the premise fails here". The script quoted PG-3's condition in
  a comment and then used the number unconditionally, which is A-G163's defect in this lane's own instrument.
- **The break-even is mark-dependent and the pin does not name an interaction state.** `1.6 − seatHalfPx/r = 1.5`
  gives `r_device = 10 · seatHalfPx` — **18.000 px marked, 14.012 px unmarked**. GELB's 18.000 is the marked
  case, correctly the worst, but between those two radii the verdict turns on whether a pointer happens to be
  over the body, and nothing in a headless probe marks anything. That is A-G95's missing-motion-mode hole in
  different clothing: an obligation that names neither the motion state nor the interaction state.

## §49 A-G184/A-G185 — ERRATUM: the rim bands cannot settle the mask convention, and one figure of mine was quoted wrongly

**Correction first.** I offered rank 1's 18 px in the 1.00–1.05 r band as evidence that a dash gap reads as
ground. **It is not.** No body is marked in a probe that never hovers, so the unmarked seat edge sits at
1.0405 r and an *area* occluder already leaves an uncovered sliver of ~75 px there. 18 is **below** that, not
above it. The dash-gap geometry stands as a source fact — the seat ring carries `dashOf(b.line, …)`, and
`dotted` is 1.2k on / 2.6k off, a 32 % duty cycle — but **this reading never evidenced it**, and A-G185
should not rest on that number.

What the rim bands actually show, against what an `r + h` area convention predicts:

| rank | r_px | seat edge | sliver 1.00–1.05 predicts | observed |
|---|---|---|---|---|
| 1 | 34.62 | 1.0405 | ~75.0 px | 18 |
| 2 | 43.88 | 1.0319 | ~227.5 px | 9 |
| 3 | 33.98 | 1.0412 | ~66.5 px | 0 |
| 4 | 31.76 | 1.0441 | ~39.0 px | 2 |
| 5 | 28.50 | 1.0492 | ~4.5 px | **50** |

**Four bodies read far below the prediction and one reads 11× above it.** Neither convention explains the
set: the rim bands are dominated by occluders this profile does not separate — the body's own name and
measure (A-G20), crossing ring seats (A-G97), neighbouring signs — pulling four counts down, and something
body-specific pushing rank 5's up. **So this reading cannot settle the convention question; it reports what
its own mask assumed.**

**One datum in it is clean, though.** At 1280×800 `h/r_px` is 0.060 … 0.092, so the 1.00–1.05 band lies
*wholly* inside the `r + h` annulus for every body and an area convention requires it to be **empty**. Four
bodies read 0. **Rank 5 reads 6** — an excess with no sliver available to explain it, on the same body that
is 11× over at 1920. That points at a body-specific gap, and the live hypothesis is its line style, since
`CLASS_LINE` gives SEMANTIC → `solid`, LEXICAL → `dotted`, NONE → `open`, and only a solid ring occludes its
whole circumference.

**Which refines the question worth asking the lane holding the instrument:** not *"does the band contain
uncovered pixels"* — my table shows that answer is contaminated in both directions — but **"what is
`data-line` on the body whose band is over-populated."** If it is `dotted` or `open`, per-pixel masking is
confirmed and the ramp starts at `r`. If it is `solid`, the excess has another cause and the convention is
still open. One attribute, no new run, and it is not contaminated by the other occluders.

## §50 A-G31 — ERRATUM: three of the five rows are outside PG-17's carrier

A-G31 states PG-17's carrier as the union of `mapping-glows` and the medium beneath it, and `mapping-glows`
carries **`fieldHalos` only**. This instrument's `glowsAll` is `.mf-halo`, which is on the wrapper `<g>` of
**every** halo, shelf and field alike. So the per-body rows above are a **superset** of the pin's subject:

- **ranks 1–2 are field bodies** — under the carrier, and these are the rows that bear on PG-17.
- **ranks 3–5 are shelf bodies** (`shelf: true` in all three files) — **outside the carrier**, and reported
  here as measurements of the ramp as if they were not.

**And the one anomaly this release reported is on a body the pin does not cover.** Rank 5's reversal at
2.75 r, and its over-populated rim band at both viewports, are a shelf body. The same body — `ρ_drawn 34.2`,
the sealed minimum of 15.18 px — turned out to be outside the carrier in two other lanes' arguments in the
same week, each time with correct arithmetic.

> **A body under no obligation accumulates the errors**, because nothing checks a claim made about it. A
> coverage hole is not only a gap in what is verified; it is where wrong figures survive.

Under A-G31 and A-G48 together, PG-17's carrier excludes shelf halos and PG-10's excludes them too, so
**three of the five bodies are under no obligation in this phase.** That is a coverage hole rather than a
defect in either pin, and it only became visible once both carriers were stated precisely.

## §51/§53 — the quantum, and an erratum I had to take back

This section went out twice. The settled position first, then what moved.

**Two conclusions, one support each.** Conflating them produced both of my errors here:

| conclusion | rests on | status |
|---|---|---|
| the flat head is never sampled | the **truncation** alone — the seat term is zero in a dash gap | stands |
| strictness is unmeasurable in the tail | the **pigeonhole**, under A-G81 | stands |

**The pigeonhole stands, and my withdrawal of it was wrong.** In §51 I withdrew it after counting 23 distinct
composited triples along the tail, reasoning that luminance sums three channels whose code crossings do not
coincide. **That count treats α as continuous, and this record fixed the opposite in A-G81: α is quantised to
8 bits *before* compositing.** So there is one α, not three independent channels, and over the tail's
[0, 0.04] it takes `round(0.04 × 255) + 1 = 11` values — of which k = 9 and k = 10 composite to the same
triple:

```
k:   0          1          2          3          4          5          6          7          8      9 (=10)
rgb: 14,14,14   14,15,15   15,15,16   15,16,17   15,17,18   16,18,19   16,18,20   16,19,21   16,20,22   17,21,23
```

**10 distinct colours against at most 12 pixel samples: the repeat is forced.** So a re-formed pin demanding
*measured* strict decrease would be unsatisfiable on compliant content — PG-19's shape, available from
constants before any run.

**The quantum has no single value here, and this is the part that survived both passes.** Three figures for
the quantum at one place, under three namings:

| naming | value |
|---|---|
| one **blue** code | 2.7834e-05 |
| one code, **all three** channels | 3.8600e-04 |
| one **α** code, the model A-G81 actually fixes | **3.4896e-05 … 4.8965e-04** |

**17.6× across the namings**, and the α-code quantum is **irregular by 14.0× between consecutive steps** —
3.4896e-05 from k = 5→6 against 4.8965e-04 from k = 8→9 — because the channels cross their boundaries at
different α. On top of which the blue-only step spans **2.247e-05 at byte 10 to 1.337e-04 at byte 73, 5.95×
across the levels this profile measures.**

> **A resolvability floor must be measured against the run's own null, never computed from a nominal code
> size.** Three independent reasons: 17.6× between namings, 5.95× within one naming across levels, 14.0×
> between consecutive steps. The measured floor is the only figure that cannot be the wrong quantum.

And the generalisation, which my own scope-carrying rule does **not** cover: **a level-counting argument is
void unless it states the quantisation model it counts under.** Nothing here was reused out of scope — a *new*
number was computed outside a model the record had already fixed, and no condition travelled with it because
none was attached to anything.

## A-G174 — the per-body local ground, which this release already carries

A ground *triple* cannot represent it. These files report the local ground per body, as the median of uncovered
carrier pixels in 3.2 … 4.0 r on the halo annulus — the quantity GELB says settles the sweep — and it splits
into **two populations by shelf membership**:

| bodies | local ground | n |
|---|---|---|
| field (ranks 1–2) | 0.0044378 · 0.0045120 | 19 196 · 20 920 |
| shelf (ranks 3–5) | 0.0028105 · 0.0028105 · 0.0028384 | 16 666 · 14 504 · 7 451 |

A factor of **1.58** between them. GELB's sweep spans `rgb(10,10,10)` … `rgb(18,18,18)` = L 0.003035 … 0.006049,
which contains the field population and **excludes the shelf population from below**. So the sweep's agreement
across all seven triples is evidence about field bodies only.

## What this is not

It is not a certification of anything. R21 generated `GLOW_RAMP` and no quantity was ever taken from it, so a
measurement agreeing with the ramp's shape confirms the implementation matches its own design and says nothing
about whether the design is right. **The derived geometry is deliberately not entered in the bound registry** —
the registry records bounds the record states, and a figure of this lane's own written there would launder
itself into an obligation.
