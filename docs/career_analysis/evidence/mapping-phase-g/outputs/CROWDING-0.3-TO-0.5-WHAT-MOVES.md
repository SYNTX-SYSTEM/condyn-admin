# If `CROWDING` moves 0.3 → 0.5: what changes in the field

**Verdict: NONE.** This lane returns no verdict and takes no product decision (A-G36 point 2). This states
what the committed golden vectors say would change, so the decision can be taken on figures rather than on
a bound's number. **The decision is the owner's.**

**Which artifact this is about (A-G233).** The record bounds PG-16 at **0.5** (A-G156); the build is
**`export const CROWDING = 0.3`**. Every row below is the *build* on the left and the *record* on the right.
Nothing has changed in the product: the delta from `3ec8457d` remains one `RING_LUMINANCE.shelf` hunk.

**Source.** `pg16-crowding-at-0.5.json` and `pg16-crowding-L1.json`, arithmetic on the committed golden
vectors and the component's own `spaced()` rule. No render, no server, no credential.

## The headline

> **It removes bodies from the field.** 9 of the 11 layouts that have roles draw fewer bodies at 0.5. None
> draws more.

| | at 0.3 (the build) | at 0.5 (the record) |
|---|---|---|
| L0 bodies drawn, across the 9 layouts that can reach the cap | 6 … 7 | **4 … 7, median 6** |
| L1 bodies drawn, across 9 pools | 6 … 12 | **4 … 7, median 6** |
| L0 budget of 7 binds | **8 of 10** exercising layouts | LV10 alone, tying |
| L1 budget of 12 binds | 2 of 9 pools | 0 of 9 |

**On the effective cap, stated at the width of the evidence (A-G215).** `reading_outcome` in the source file
says *"typically 5 or 6, and 4 on LV03 … reached on exactly ONE layout (LV10)"*. The **typical** value is
5–6; the **range** is **4–7**. A decision about removing bodies should see both tails, so the number to
carry is 4–7 with a median of 6, not 5–6.

## The fact that separates this decision from the budget constants

| layout | bodies | 0.3 → 0.5 | lost | what binds at 0.3 |
|---|---|---|---|---|
| **LV02** three-pools-mixed-tiers | **6** | **6 → 3** | **50 %** | spacing |
| LV03 equal-fit-ties | 12 | 6 → 4 | 33 % | spacing |
| LV04 crowded-60 | 31 | 7 → 5 | 29 % | budget |
| LV05 capacity-exceeded-overflow | 37 | 7 → 5 | 29 % | budget |
| LV07 real-shape-73 | 36 | 7 → 5 | 29 % | budget |
| LV08 / LV09 / LV11 / LV12 | 70 / 37 / 22 / 24 | 7 → 6 | 14 % | budget |

**The largest proportional loss is on the smallest layout, and it never touches the budget.** LV02 carries
six bodies — below the cap of seven — and binds on spacing at both values, so its **6 → 3** is attributable
to `CROWDING` alone. Two consequences:

1. **The loss is not concentrated in crowded fields.** A dense layout loses one body of seven; a six-body
   layout loses half. The crowding rule scales with eccentricity, so a sparse field with distant bodies needs
   more clearance than a tight one near the person.
2. **This decision is separable from `BODY_BUDGET`.** The body removal is driven by the spacing rule, not by
   the caps — so `CROWDING` can be decided without touching the budget constants, and the budget bounds
   (`PG-5.bodiesAtL0` ARGUED, `.bodiesAtL1` UNDERIVED, both live at the built value) can be decided after.

## What this does not say

It does not say which value is right. R23 is cited for 0.5 and the record never states where in that source's
range the figure sits (the registry flags this on `PG-16.crowding`). It does not measure anything — these are
the golden vectors' own geometry, so a rendered field could differ in ways only a pixel reading would show.
And no test has run: the six credential-gated items are untouched by any of it.
