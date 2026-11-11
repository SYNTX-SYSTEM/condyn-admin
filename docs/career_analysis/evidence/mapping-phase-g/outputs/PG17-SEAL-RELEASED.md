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

## What this is not

It is not a certification of anything. R21 generated `GLOW_RAMP` and no quantity was ever taken from it, so a
measurement agreeing with the ramp's shape confirms the implementation matches its own design and says nothing
about whether the design is right. **The derived geometry is deliberately not entered in the bound registry** —
the registry records bounds the record states, and a figure of this lane's own written there would launder
itself into an obligation.
