# PERSON × JOB · MAPPING FIELD · PHASE G — ONE FIELD, LIVING BODIES

**Mandate (OTTAVIO, 2026-11-06): SFE::VISUAL ACCEPTANCE — rejected.** *"Die aktuelle Mapping-Bühne ist
gestalterisch abgelehnt. Das Ergebnis wirkt wie eine große blaue Zielscheibe. Die semantischen Körper,
Kopplungen und räumlichen Beziehungen verlieren ihre Präsenz gegenüber der dominierenden Kreisfläche …
Rekonstruiere die visuelle Architektur grundlegend aus den tatsächlichen Relationen des Systems … Keine
kosmetische Reparatur dieser Kreise."* And then, decisively: *"schau dir mal die anderen an, das ist eine andere
Nummer. **Alles ein Feld**, bewegt sich, atmet und mehr. Der Benutzer muss relaxen. **Volle Semiotik wo es
geht**."*

**Base.** `PHASE_G_BASE = 93c47e03`. Semantics and boundaries preserved, Gemini off, no merge, no deployment.

---

## §0 THE READING THAT NAMES THE DEFECT

**M-G1 · 95 % of the field's light is ground.** Measured on `93c47e03`, 1920 × 1080, by suppression: hiding
**every semantic element at once** — all beams, bodies, capability nodes, requirement ticks and text — removes
only **4.78 %** of the light inside the disc. The remaining 95 % is medium and rings.

That is "eine große blaue Zielscheibe" as a number. Phase F bounded the medium's brightness from both sides
(F-6's corridor) and **never bounded how much of the field's presence the semantics are entitled to.** There is
no obligation in eighteen that measures it, which is exactly why a stage that passed everything looks like a
target.

**M-G2 · The working language is the inverse of mine.** OTTAVIO pointed at the CAPABILITY FIELD. It is **also
radial** — a luminous core, a ring of named nodes, dashed orbits, travelling satellites. So radiality is not the
defect. The difference is where the light lives:

| | CAPABILITY FIELD (works) | MAPPING, phase F (rejected) |
|---|---|---|
| space | **dark** | lit plate, disc median 0.022 |
| bodies | few, **large, named, glowing**, each with its own rim, title and count | many, **12–22 px, unnamed, dim** |
| relations | dashed orbits with satellites travelling them | 1.2 px hairlines |
| state | **hue** — red for tension, amber, cyan-active | one ink, no hue (self-imposed, E-7/R11) |
| ground | the system's shared dark space | **`DISC_GROUND_OPAQUE`: a plate cut out of the system** |

**I inverted the correct reading of my own research.** R15 says the eye is low-pass at low luminance, so the
field must carry coarse, low-spatial-frequency light. The correct application is to put that coarse light in the
**objects** — big soft glows on bodies. I put it in the **medium**, and the medium became the subject.

---

## §1 THE DECISION THAT SHAPES THE PHASE: THE LAYOUT STAYS V1

GRÜN's technical read answered the question I was about to get wrong. Position does not come from the view
model: it comes from **`MAPPING_LAYOUT_V1`**, a specified engine with constants in `layout-spec.json`, twelve
golden vectors at 1e-6 and an independent reference implementation. Replacing it means a **V2 spec with its own
vectors and reference** — and it would cost four meanings that are defined by position today:

| | what position carries today | what a relational layout would do |
|---|---|---|
| (a) | **fit is radius** (`fitDistance`), and the horizon / best-fit / shelf rings are its scale | fit loses its carrier entirely; rank has a second channel, fit has none |
| (b) | **pool is angle** — sectors are the `OPEN_POOL` hit targets, L1 zooms via `sectorViewBox` | a pool needs a new region form, hit target and frame |
| (c) | **displaced / overflow** mean "the collision search deviated" and "no room in band and sector" | both are statements *about* the polar layout; they would have to be redefined or retired |
| (d) | **the copy** names the horizon, the positions, the approximate distance | the text would become false about the picture |

**Decision: `MAPPING_LAYOUT_V1` stays.** Rebuilding the geometry would destroy semantics in order to fix a
presence problem, and OTTAVIO requires the semantics preserved. His own pointer settles it: the view he calls
"eine andere Nummer" is radial too.

**What is reconstructed is the distribution of presence** — which bodies exist, how large they are, what carries
light, what carries hue, and what the relations look like. That is not cosmetic repair of the circles; it
inverts the field's entire light budget and replaces the bodies with a different kind of object. The circles
recede to being a *scale*, which is all they ever were.

GRÜN's three questions — who carries fit, what a pool is without angle, what LAYOUT means under a solver — are
therefore **withdrawn, not answered.** None of them arises.

---

## §2 THE ARCHITECTURE

### G-1 · The space is dark and the bodies carry the light (inverts F-1)

`DISC_GROUND_OPAQUE`'s lit plate is retired. The mapping field lives in the **same dark space as every other
field** — *"Alles ein Feld"*. The medium keeps a faint depth gradient and the breath, far below the bodies.

| bound | value | today |
|---|---|---|
| **PG-1** share of the field's light contributed by semantic elements | **≥ 55 %** | **4.78 %** |
| **PG-2** disc median luminance with all semantics suppressed | **≤ 0.006** | 0.0219 |

PG-1 is the obligation phase F lacked and the one that would have caught this. It is measured exactly as M-G1
was: suppress, and see what goes dark.

### G-2 · A role is a body with presence, not a bead (inverts F-2's scale)

Each drawn role becomes an object in the system's own language: a dark core, a **luminous rim**, an outer
**glow**, its **name**, and its **measure** (fit, tier). The sign table is unchanged — `data-line` still carries
the coupling class on the rim, the collar still carries the requirements.

| bound | value | today |
|---|---|---|
| **PG-3** drawn body diameter at 1920 × 1080 | **≥ 56 px** | 12–22 px |
| **PG-4** every drawn body is named at L0 | required (`BODY_NAMES_AT_L0 = true`) | false |
| **PG-5** bodies drawn at L0 | **≤ 7**, the rest stated as overflow | 5 of 5 |

PG-5 is the hard one and it is deliberate: presence is a budget. Seven large bodies carry more than twenty small
ones, and the existing CAPABILITY FIELD draws **six**.

### G-3 · Relations are paths with their own life

A coupling is drawn as an arc with a luminance gradient and a **travelling light** along it (the system already
has `OrbitalSatelliteMotion`), not a static hairline. Its stroke word and dash stay exactly as `BEAM_STROKE`
says; the travel is one constant form on every path and encodes nothing.

| bound | value |
|---|---|
| **PG-6** relations' share of the semantic light | **≥ 15 %** |
| **PG-7** travel is one shared period, deterministic, and **stops with the breath** when anything is pending |

### G-4 · Hue returns as a semantic channel (amends E-7 / R11)

E-7's *"one ink, no hue"* was derived from R11 and applied as a ban. It is why the MAPPING field is the only
view in the system speaking a private language, while the others carry red for tension, amber for the semiotic
signature, cyan for active. **"Volle Semiotik wo es geht"** means using the channels the system already has.

E-1 is not violated by hue; it is violated by a channel carrying *two* questions. So hue is assigned **one**
question and luminance keeps its own:

- **luminance** keeps the evidence class (E-1/A-3's bands, unchanged, still absolute and black-seated);
- **hue** carries the **required gap** — a role with an unmet REQUIRED requirement takes the system's tension
  accent; all others stay in the field's ink.

| bound | value |
|---|---|
| **PG-8** hue is used for exactly one question, and that question is not carried by any other channel |
| **PG-9** the evidence bands' luminance separation (PF-2) is unchanged by hue, measured on the luminance plane |

### G-5 · Calm is preserved, and it is now load-bearing

*"Der Benutzer muss relaxen."* Everything phase F established about rhythm stays: 0.1 Hz, 4 : 6, the wave from
the person outward, the stop while pending, `prefers-reduced-motion`, and R17's corridor bounded from **both**
sides. With brighter bodies the ceiling matters more, not less.

**PG-10** — with the light budget inverted, the breath's amplitude is re-derived so the *measured* swing stays
inside F-6's corridor on the **bodies**, which now carry it.

---

## §3 BOUNDARY

Unchanged from phase F §4, with two amendments: `lib/career/**` **still does not change** (the layout stays V1),
and `DISC_GROUND_OPAQUE` is retired rather than kept as a constant. Semantics preserved, Gemini off, existing
fixtures, no merge, no deployment, host untouched.

**What survives phase F untouched** (GRÜN's inventory, accepted): the firewall and its seats, the body volume
machinery, the text and node seats, the beam mask gradient, the entire CSS breath machinery, E-3's query motion,
E-4's transient and remount, A-F15's halo coupling, E-5's tween, E-7's floors, E-8's sizing, and **every
instrument method** — per-class masks, differential measurement, signs-drawn sign masks, deterministic seek,
the bracketed null, the joint LSQ, the window rule, the adequacy guard, PF-17/PF-18.

**What is re-derived**: the ground model and the wave's geometry (both now far dimmer), the four rings and their
seats, the sector shade, and the sampling geometry of PF-15/16/17/18 — their *ideas* transfer, their *radii* do
not.

---

## §4 PROOF

PF-1 … PF-18 carry over, except: **PF-1 is replaced by PG-1/PG-2** (the disc must now be *dark*, and the
semantics must carry the light), and F-6's corridor is measured on the bodies (PG-10).

New: **PG-1** (semantic share of light), **PG-3/4/5** (body presence), **PG-6/7** (relation presence and travel),
**PG-8/9** (hue as exactly one channel, bands unchanged). Each red-first with a recorded mutant, per the rules
A-F11, A-F20, A-F21 and A-F29 established in phase F.

---

## §5 ADJUDICATIONS — THE SIZE OF A BODY

### A-G1 · PG-3 takes option (A): the collision search uses the **drawn** radius *(V1 → V1.1)*

GRÜN measured that PG-3's 56 px collides with V1's collision guarantee wherever a **small pool holds the strong
roles**: its sector is narrow and the golden spread compresses into it — 7 of 20 roles gives 6 overlapping pairs,
3 of 63 gives 3. A realistic shape, not a corner case.

**Decided: option (A).** V1's collision search uses each body's **drawn** radius rather than its mass radius.

- **(B) is the error I have named four times this phase**: a bound the geometry refuses. Shrinking the body to fit
  the old spacing means PG-3 fails in exactly the dense cases where legibility matters most. I will not ship a
  bound that cannot be met.
- **(C) is worse than failing**: a relaxation V1 does not know about makes `displaced` *lie* — a body deviates
  from its fit position and the flag says it did not — and makes the radius false as fit.
- **(D) changes a semantic** (sector width would carry the share of *drawn* roles rather than of all roles).

(A) changes **no definition**: fit is still radius, pool is still angle, `displaced` still means "the search had
to deviate", overflow still means "no room in band and sector". Only the numbers move, and they move because the
bodies are genuinely larger — which is a true statement about the picture. `body.gap` exists in the spec
precisely to say "bodies must not touch"; feeding it the real drawn size is **using the spec as designed**, not
subverting it.

**This is a version bump, not a new engine**: `MAPPING_LAYOUT_V1.1`, same algorithm, same four meanings, one
constant redefined, new golden vectors for the dense cases, the reference implementation adjusted, and B-1's
`MAP-*-ARCH` retargeted. V1 stays as phase B's record.

**Accepted consequence:** more V1-overflow in narrow bands. That is exactly what overflow means, and it is the
honest outcome — if a narrow pool cannot hold its strong roles at legible size, **saying so beats drawing them on
top of each other.**

### A-G2 · Size keeps carrying requirement mass, mapped above the floor

GRÜN is right that mass would otherwise vanish from the picture without anyone deciding it. Today the radius
carries `weightSum` over ρ ∈ [6, 16] units.

**Decided: size stays the carrier**, mapped monotonically **above** the floor — **56 px at ρ_min, 92 px at
ρ_max** at 1920 × 1080, a ratio of 1.64 and comfortably discriminable. Moving mass into the measure text would
lose it at a glance, and size is a strong pre-attentive channel that is otherwise unused.

The channel assignment is then complete and collision-free, which is E-1 satisfied rather than asserted:

| channel | question |
|---|---|
| **radius** | fit |
| **angle** | pool |
| **size** | requirement mass |
| **luminance** | evidence class (E-1/A-3's bands) |
| **hue** | the unmet REQUIRED requirement (G-4) |

**PG-3 amended:** drawn diameter **∈ [56, 92] px** at 1920 × 1080, monotone in `weightSum`.

### A-G3 · The budget statement is its own statement *(B-5)*

GRÜN is right that "not drawn because of the budget" and V1's overflow are two different facts, and one
statement must not carry two meanings — E-1 applied to copy.

**Named:** `data-testid="mapping-beyond-budget"`, `data-count`, its own sentence: *this level draws the strongest
N; the others stand in the list*. V1's `mapping-overflow` keeps its own meaning — *no room in band and sector* —
unchanged in wording and in count.

### A-G4 · The cap per level

**L0 ≤ 7** (the overview: few, large, legible). **L1 ≤ 12** — the stage zooms to the sector there, so the same
screen space holds more bodies at the same drawn size, and the purpose of L1 is to examine one pool. **L2/L3 are
one role** and unaffected. Both caps are stated, not left open; both use the budget statement above.

---

## §6 PINK'S ATTRIBUTION — THE SCAFFOLD OUT-LIGHTS THE CONTENT

PG-1 confirmed independently on `93c47e03`: semantic fraction **2.82 %** excluding the coordinate rings,
**8.09 %** including them, at 1920 × 1080 (6.72 % / 12.88 % at 1280 × 800). My 4.78 % sits inside PINK's
bracket; its per-group sum is 4.55 %. **The founding number holds: 93–97 % of the disc is ground.**

**The attribution is worth more than the headline.** Per group, share of disc light removed at 1920:

| bodies | arcs | beams | nodes | text | **all relations** | **the coordinate rings** |
|---|---|---|---|---|---|---|
| 1.38 % | 0.87 % | 1.26 % | 0.81 % | 0.23 % | **4.55 %** | **5.25 %** |

**The scaffold out-lights every relation combined.** The coordinate frame is literally the brightest
semantic-ish thing in the field. That is "eine große blaue Zielscheibe" at its exact source, and it is sharper
than "95 % is ground": the ground is *supposed* to be dim and large; the rings are supposed to be a **scale**,
and they became the subject.

**PG-1 therefore excludes the rings from "semantic".** True semantic presence is **2.82 %** and the bound fails
by **≈ 20×**, not 11×.

### A-G5 · PF-15 is inverted — I had an obligation certifying the over-presence

PINK's answer to "which obligation is about the instrument rather than the field" is **PF-15**, and it is
correct. PF-15 spends a whole obligation ensuring the four coordinate rings are **mutually legible** — making
the scaffold a well-formed, distinct structure. PG-1 shows those rings out-light every relation. **PF-15
actively certifies the over-presence that got the stage rejected.**

It was my obligation, added in A-F6, and I was pleased with it. An obligation that makes the coordinate frame
legible is optimising the thing that should recede.

**PF-15 inverted, in two limbs:**

| | |
|---|---|
| **(a) subordination** | the four rings' **total** share of disc light ≤ **8 %** of the semantic share |
| **(b) legibility within subordination** | the rings remain mutually distinguishable at ≥ 1.6 **inside** that budget |

E-7's reading — four rings told apart by luminance alone — survives. What is removed is the licence to reach
any brightness in order to achieve it.

### A-G6 · Every channel phase G re-lights needs its own presence bound *(PINK)*

PINK names the class exactly: **the proof surface bounds the medium on both sides** — PF-1 light, PF-5/6 motion,
PF-16 wedge, PF-17/18 continuity — **and had no presence bound on the semantics at all until PG-1.** Phase G
re-lights two further channels, and each needs its counterpart or the defect returns in that channel.

| # | obligation |
|---|---|
| **PG-11** | **Motion presence.** The relations' travelling light must out-salience the breath: the coherent motion energy on relation pixels ≥ **1.5×** that on medium pixels. Without it the medium is again the only living thing — *the phase-F failure reborn in motion*, which is PINK's phrase and the right one. |
| **PG-12** | **Hue containment.** Hue lives on the semantics and never leaks to the ground: on medium pixels, chroma ≤ **2 %** of the chroma on the hue-carrying class. |

### A-G7 · Presence is multi-channel — PG-1 is only its light limb *(PINK)*

PINK's caution on PG-1 itself is the same class one level up again, and it is right: **a body can hold 55 % of
the light and still lack presence** — a large dim blob. PG-1 is the light limb only. The limbs are therefore
named, so no single-channel bound stands in for the whole:

| limb | obligation |
|---|---|
| light | **PG-1** ≥ 55 % semantic share |
| size | **PG-3** 56–92 px, **PG-5** at most 7 bodies |
| motion | **PG-11** relations out-salience the medium |
| hue | **PG-12** contained on the semantics |
| **local contrast** | **PG-13** — each drawn body's peak luminance ÷ its own local surround median ≥ **8**. This is the limb that catches the dim large blob: a body must stand against *its own* surround, not merely contribute light to a global total. |

**Presence is not a number; it is a vector, and every limb is bounded.** That is the lesson of this phase
applied to itself: I bounded the medium from both sides and called it rigour, while the thing the field is
*for* had no bound at all.

---

## §7 A-G8 · (A) DELETES THE SHELF — A1 IS TAKEN INSTEAD

GRÜN measured A-G1 against the twelve golden-vector inputs before building on it. **Under V1.1 not one name-only
role is drawn in any vector**: LV07 goes 59 → 0, LV09 260 → 0, LV11 119 → 0, LV12 200 → 0. **The fixture would
lose three of its five bodies.**

The cause is geometric, not tuning: the shelf band is 430…500 = **70 units wide**, and a drawn body is
**64…105 units in diameter**. V1's band rule with the drawn ρ shrinks the band to 430…447–468, and the radial
steps step straight out of it.

**"Overflow = no room" would then be formally true and substantively false.** It would not say "a narrow pool
cannot hold its strong roles" — the honest outcome I accepted in A-G1 — it would say **"the entire LEXICAL_ONLY
tier has no room"**. That is an evidence tier deleted from the picture by a layout constant, which is exactly
the semantic loss the whole phase exists to avoid. **A-G1's reasoning was right and its consequence was not,
and GRÜN found that by measuring rather than by building.**

### Decided: variant A1 — two radii, each with exactly one role

| radius | role |
|---|---|
| **ρ_mass** = V1's `bodyRadius` (6…16, from `weightSum`) | the **band** rule, unchanged |
| **ρ_drawn** = linear map of ρ_mass onto [32.2, 52.6] units | the **collision** rule and the drawn size (PG-3, monotone in `weightSum`) |

Every definition survives: fit = radius of the **centre**, pool = angle, `displaced` = "the search deviated",
overflow = "no room in band and sector", size = mass. Measured: the shelf keeps 22 of 59 in the real-shape
vector and 23–37 in the pure shelf vectors; the semantic side is identical to or better than V1 (LV04 34
against 28). All of that is far above what L0 ≤ 7 and L1 ≤ 12 can show, so the budget — not the geometry —
decides what is drawn, which is the right place for that decision.

**A2 is declined** for GRÜN's reason: widening the shelf band changes the **scale of fit → radius** on the
shelf, and that is a semantic change to buy a cosmetic one.

### The price, and it is turned into a reading

A shelf body's centre may sit at up to 500 − ρ_mass, so its drawn rim reaches ≈ 546 — **past the field ring at
500**. Shelf bodies straddle the rim.

**Accepted, and not merely tolerated.** A-G5 already demotes the rings to a subordinate scale. A faint field
ring passing **behind** a bright body, occluded by it, is a depth cue (R16's occlusion, the one monocular cue
phase F never used) and it makes the ring's subordination structural rather than a matter of alpha. A body
resting across the field's edge is also a true statement about a name-only role: it sits at the boundary of what
has been checked.

**Two bounds this adds:**

| # | obligation |
|---|---|
| **PG-14** | Every drawn body's **rim** lies inside the viewBox at every level — `l0Margin` is re-derived from ρ_drawn, not from ρ_mass. No body is clipped by the stage frame. |
| **PG-15** | The field ring and the horizon are drawn **behind** every body and are occluded by it; no ring stroke crosses a body's drawn disc. |

`MAPPING_LAYOUT_V1.1` therefore carries **two radii in the spec**, new golden vectors for both, and the
reference implementation computing both. One algorithm, one set of meanings, two numbers where there was one.

---

## §8 G-2's "MEASURE" WAS A CLAIM — AND SEVEN MECHANISM PINS

### A-G9 · The field may not state a fit. Phase C wins *(GRÜN — my error)*

G-2 said a body carries "its measure (fit, tier)". `field-render.test.tsx:125` is **right to be red**: P-07's
product rule says the field states a **ranking, not a suitability** — no percent, no fit, no score, no claim
word. The authority model says the same thing (`ranking: true, decision: false`).

I imported "fit 44 %" from the **right-hand ranking panel**, which is a different surface with different
authority, into the field, which may not claim it. A body reading "#1 · 82 %" would have made the field assert a
judgement the whole system is built to withhold.

**G-2 corrected: the measure is `rank` + `tier`, in words** — *"#1 · checked"*, *"#4 · names only"* (DE
*"geprüft"* / *"nur Namen"*). **Fit stays in its own channel, the radius.** That is sufficient and it is
better: the tier word answers exactly the question radius and dash do not answer directly, and it adds no
figure. This is a **meaning** pin and it stands; nothing about it is restated.

### A-G10 · The seven mechanism pins, adjudicated

All seven are mechanism under §12's amended B-F2, and all seven restatements are adopted as GRÜN proposed them,
with three additions.

| # | pin | restated |
|---|---|---|
| 1 | `field-d:114`, `field-e:380` — no body name at L0 | names at L0 **exactly when `BODY_NAMES_AT_L0`**; at L1+ in-pool always. The test reads the constant, not its old value. |
| 2 | `field-e:365` — the 12 px floor binds | every drawn body ≥ **max(12 px floor, presence(ρ_mass))**, size monotone in mass, `data-size-floor` **only where the floor binds** — plus a test of the floor itself on a stage narrow enough to make it bind. Strictly stronger. |
| 3 | `field-interaction:297` (C13), `:314` (M8) — rank > 7 drawn at L0 | C13 at **L1**, where those roles are drawn. M8 on **every drawn body** (L0 and each pool's L1), **with a precondition that the fixture contains an angular-only displaced body among them.** Meanings unchanged word for word. |
| 4 | `field-render:121` — drawn count = model bodies | drawn = **min(budget, model bodies)**; `mapping-overflow` unchanged in count and wording; `mapping-beyond-budget` its own count and sentence (A-G3). |
| 5 | `neurovisual-e:156` — every LIVE rule is 0.1 Hz / 4 : 6 | every **breath** rule 0.1 Hz / 4 : 6; the **travel** rule keyed on LIVE with its own period; nothing else infinite. `:174` stays green. |
| 6 | `MAP-F-ARCH` §6 and `B-F8` open-ended since `PHASE_F_BASE` | closed at **`PHASE_G_BASE = 93c47e03`** with A-F18's guard, plus **`MAP-G-ARCH`** with `G_ENTRY` and byte-identity guards on the V1 spec and vectors, signs/view/delta/focus, host and fixtures. |
| 7 | `field-f` — halos in `mapping-medium`; PF-16's shade | halos move to **`mapping-glows`** (a glow is *body* light, not medium — G-1). PF-16 re-derived, see A-G12. |

**Addition to 1, and it is not GRÜN's to make:** `BODY_NAMES_AT_L0` is one of the two reversible constants
PHASE_E §5 hands to **OTTAVIO**. PG-4 requires it true. I am taking that decision and **reporting it to him as a
decision taken on his lever**, not flipping it silently. It stays reversible.

**Addition to 5 — the travel must not become a second rhythm.** R4 permits one motion group at a time, and two
free periods would be two rhythms competing.

> **PG-7 amended:** the travel's period is an **exact integer divisor of the breath's period** (travel 5 s =
> breath 10 s ÷ 2), so the two are **phase-locked and never drift**. The field keeps one rhythm with a sub-beat
> instead of acquiring a second one. The travel still stops when the breath stops.

**Addition to 6 — this is the third time an open-ended range has measured a later phase** (phase D's F-PC-1,
phase F's §20, now phase F's own guards measuring phase G). **Standing rule: closing the predecessor's range is
part of opening a phase**, not something discovered when its tests go red.

### A-G12 · Near black you cannot darken — F-4's pool shade inverts

GRÜN measured that the 0.022 shade rounds to **zero 8-bit codes** on the dark ground. The cause is structural,
not a tuning miss: **a shade subtracts light, and near black there is none to subtract.** F-4's "darken every
second wedge" is impossible on a dark ground.

**Decided: the pool territory becomes an additive wash** — one pool's wedge carries a faint *lift* above the
base ground, the next does not, alternating. And because A-F31 established that ratios are meaningless at this
level, **PF-16 is restated in codes, not ratios**:

> **PF-16 (dark ground):** the wedge wash is **≥ 1 and ≤ 3 sRGB codes** above the base ground, strictly below
> every mark, and contained by PG-12 (no hue on the medium). Measured as a trimmed mean per pool.

---

## §9 THE TRAVEL IS THE BREATH — AND THREE MORE GREEN-BY-COINCIDENCE FINDS

### A-G13 · PG-7 final: the travel's period **is** the breath's *(option a)*

GRÜN found the contradiction in its own proposal: 5 s is 0.2 Hz, only **15×** under the 3 Hz threshold, where
the restatement demanded 30×.

**Decided: the travel period equals the breath period — 10 s, divisor 1.** Option (b)'s reasoning is technically
sound (a small travelling point is not a "flash" under WCAG 2.3.1, which is defined over an area), but it buys
a sub-beat we do not want, and the margin was never really about WCAG — it is E-6's **calm** margin.

The real reason is better than either: at divisor 1 the light completes **one circuit per breath**, so the
relation's travel and the medium's breath become **one event rather than two**. The field inhales and the light
moves; it exhales and the light resets. That is *"Alles ein Feld, bewegt sich, atmet"* — one organism with one
gesture, and the relations are what moves inside it. A sub-beat would have made the relations an *accompaniment*
to the breath instead of a part of it.

**Risk recorded rather than assumed:** motion energy scales with frequency, so halving it halves the travel's
contribution to **PG-11** (relations ≥ 1.5× the medium's motion energy). A bright point crossing a dark field
should still dominate a gentle area swing, but that is a **measurement, not a prediction**. If PG-11 fails at
divisor 1, it comes back with the render and we revisit — we do not pre-emptively weaken it.

### A-G14 · V1.1 accepted as built

V1 golden vectors **33/33 green and byte-identical**, V1.1's own suite 7/7 — including determinism under
shuffled input, drawn radius monotone in mass and inside [32.2, 52.6], no two bodies touching **as drawn**, the
band by the **mass** radius, undisplaced bodies at their fit, and **the shelf surviving in every vector**. The
V1 spec and vectors are untouched beside the new ones. That is the bump done honestly.

### A-G15 · A widened proxy is a weakened proxy — name the family, not the alphabet

The import rule admitted only `[a-z-]+.json` as a spec JSON and refused `layout-spec-v1.1.json` for its dot and
digits. GRÜN widened the pattern to `[a-z0-9.-]+.json`.

**That is correct in intent and too loose in form.** The rule means *"only a specification JSON may be
imported"*, and the pattern is a proxy for it; widening the alphabet admits any lowercase JSON at all. The same
error as every withdrawn proxy this phase.

**Required instead:** the pattern names the **family** — `layout-spec(-v[0-9]+(\.[0-9]+)*)?\.json` — which
admits V1 and V1.1 and nothing else. Stricter than before the change, not looser.

### A-G16 · Three more green-by-coincidence, and the count now matters

- **`model.test.ts`** — *"the drawn bodies are exactly the layout's"* was green **by coincidence**: the five
  fixture bodies lie identically under V1 and V1.1, so the test pinned V1 as the model's engine without being
  able to tell. Repointed at V1.1 with the drawn radius asserted. Strictly stronger. Same for model M8.
- **C13** under V1.1 would have seen **nothing**: pool B's 40 roles leave pool A a ~25° sector, `role_y` has no
  room, and that is honest V1.1 overflow. GRÜN changed the input to `crowdedRoles(10)` **and asserts the
  precondition**, so the test fails if its condition ever stops occurring. **Adjusting an input to make a
  test's condition occur is legitimate exactly when the precondition is asserted** — otherwise it is the
  vacuous-precondition defect of A-F16 wearing a new coat.
- GRÜN's first placement of the V1.1 test tripped the rule *"outside `lib/career/mapping` only the field imports
  the engine"*, found and moved by the rule itself.

**Count across phases F and G: twenty-two instrument or proof defects, of which nine could not change their
verdict in either direction.** The surface now finds them faster than we create them, which is the only
measure of the discipline that matters.

---

## §10 FIELD — SIX FINDINGS THAT CHANGE THE ARCHITECTURE (R21 … R26)

R1 … R20 stand. These are new, and two of them explain **physiologically** why the rejected stage felt dead.

### R21 · The glare effect: a luminance ramp makes a surface *emit* *(firm, and the phase's strongest lever)*

A bright region surrounded by a **gradient that darkens with distance** is perceived as **self-luminous** — and
**brighter than its measured luminance**. It works even when the central region is *darker* than a white
surround. The effect depends on a **critical band of surrounding gradients** that is explained by **neither
local contrast nor total luminance energy**, and it is **cortical, not retinal** (no longer-lasting afterimage;
figure-ground reversal switches it off).

→ This is not "add a glow". It is a **specific ramp profile** that converts a bright disc into a *light source*,
and it buys perceived brightness **beyond what the display can emit** — on a dark field, the difference between
a pale dot and a star. Phase F's halo was a soft falloff chosen by eye; it was never aimed at the critical band.

### R22 · Animacy comes from specific motion cues, not from motion *(firm — and it explains the dead breath)*

What makes a moving thing read as **alive**: **self-propulsion** (starting or changing motion with no apparent
external cause — the strongest cue, present in newborns), **starting from rest**, **speed and direction changes
of its own accord**, **upward** motion over downward, and above all **contingency** — motion contingent on
*another object's* position or movement. People judge animacy by **feature matching**, so **one strong cue can
trigger the percept** rather than evidence accumulating.

→ **This is why phase F's breath felt mechanical even where it was visible.** A sinusoidal area pulse has **no
animacy cue at all**: it is not self-propelled, it never starts from rest, it changes nothing of its own accord,
and it is contingent on nothing. It is an oscillation, and the nervous system reads oscillations as machinery.

→ And it tells us where animacy is **earned by the semantics rather than decorated on**: a light that leaves the
person **because a coupling exists** is self-propelled, starts from rest, and is **contingent on another
object** — the strongest cue in the list, arising from the relation itself.

### R23 · Bouma's law: crowding sets the spacing, and it grows with eccentricity *(firm)*

Crowding is the failure to **recognise** an object because of nearby clutter. Critical spacing is roughly
**half the target's eccentricity** (as free space, in Bouma's original form), it is far stronger in the
periphery, and the revised law puts critical spacing **across parts, not objects** — so a body *and its collar
of ticks* crowd each other internally.

→ At 1920 × 1080 the disc's rim sits at roughly **16° eccentricity** at a normal viewing distance. Bouma then
asks for **several degrees of free space** between bodies at the rim. **This derives PG-5's budget instead of
asserting it**: twenty small bodies at the rim are not merely cluttered, they are **unrecognisable** before the
eye moves.

### R24 · Chromostereopsis — reinforcement only, never a carrier *(moderate, with a hard caveat)*

Red appears **nearer** than blue in the same plane, from chromatic aberration. **But**: a substantial minority
see it reversed or not at all, and part of the effect is plain luminance.

→ Usable as a **free reinforcement** — G-4's tension accent is warm and the field's ink is cool, so a role with
an unmet REQUIRED requirement floats slightly forward, which is congruent with urgency. **It may never carry a
question**, because a channel a minority cannot see is not a channel.

### R25 · Troxler fading: the rejected field was being actively erased *(firm — the hardest finding here)*

A **low-contrast** stimulus in the **periphery** **disappears spontaneously** under stable gaze and is **filled
in by its surround**. The effect is **enhanced when the stimulus is small, low-contrast or blurred**, and
**enhanced further from fixation**. Raising target contrast **halves** the disappearance rate.

→ That is a literal description of phase F's stage: **small, dim marks, far from fixation, on a large uniform
surround that fills in**. The marks were not merely hard to see — **the visual system was deleting them**, and
the lit ground was the thing it replaced them with. OTTAVIO's *"verlieren ihre Präsenz"* is this effect by name.

→ **PG-1 is therefore physiological, not aesthetic.** Bright marks on a dark field do not just look better; they
**resist erasure**. And the breath earns a second justification: motion defeats fading.

### R26 · Peirce — the field leans on symbols where icons and indices were available *(the semiotic audit)*

Signs stand for their object by **resemblance (icon)**, **existential connection (index)**, or **convention
(symbol)**. A symbol must be *learned*; an icon and an index are *read*. (No processing-cost literature was
found, so the ranking below is architectural reasoning, not a measured claim.)

**Audit of the field's channels:**

| channel | question | sign type | |
|---|---|---|---|
| radius | fit | **icon** — nearer is better | immediate |
| size | requirement mass | **icon** — bigger is more | immediate |
| the beam reaching a requirement | which capability answers it | **index** — it points at its object | immediate |
| the *open* line (two ends, nothing between) | no relation found | **index** — the gap *is* the absence | immediate |
| luminance band | evidence class | symbol, but **ordinal** — more light is more checked | near-iconic |
| **dash word** (solid / dotted / broken) | coupling class | **symbol** — pure convention, needs the legend | **learned** |
| **mark glyph** (double, counterTick, alias, constituent) | the coupling's state | **symbol** — pure convention | **learned** |
| hue | unmet REQUIRED requirement | symbol, but the **system's own** convention | learned once, shared |

→ *"Volle Semiotik wo es geht"* means: **where a question can ride an icon or an index, it must not ride only a
symbol.** The two rows in bold are the field's learned vocabulary, and they carry the two questions a reader
most needs at a glance. They are not removed — the sign table is semantics and stays — but **each gains an
iconic or indexical reinforcement** so the picture can be read before the legend is.

---

## §11 WHAT R21 … R26 ADD TO THE ARCHITECTURE

| # | obligation |
|---|---|
| **PG-16** | **Spacing by Bouma.** Free space between drawn body rims ≥ **0.3 × the eccentricity** from the field centre, at both sizes. This *derives* PG-5's budget; if the budget and the spacing ever disagree, the spacing wins and the budget shrinks. |
| **PG-17** | **Bodies are glare sources.** Each body's surrounding ramp lies inside the critical band: a monotone falloff over ≥ 1.5 × the body radius, with the core at ≥ **1.45 ×** the local ground, measured on the render. A soft blur that is not a ramp does not satisfy it. |
| **PG-18** | **Motion carries animacy.** At least one of the field's motions is **self-propelled from rest and contingent on another object** — the travelling light departing on a coupling. The breath alone does not satisfy PG-18; an oscillation has no animacy cue. |
| **PG-19** | **Nothing drawn is Troxler-vulnerable.** No semantic mark is simultaneously small, low-contrast and peripheral: every drawn mark is above the local ground by ≥ **0.02** relative luminance, or larger than its own critical spacing. |
| **PG-20** | **Every symbol has an iconic or indexical reinforcement.** The dash word and the mark glyph each gain a second, non-conventional carrier for the same question. No new question is introduced — E-1 is satisfied because the reinforcement answers the *same* question, not another one. |

**Chromostereopsis is recorded and deliberately unbounded**: it reinforces G-4's warm accent and carries
nothing, because a channel a minority cannot see is not a channel.

**Sources.** R21 — [The glare effect and the perception of luminosity](https://www.researchgate.net/publication/12036684_The_Glare_Effect_and_the_Perception_of_Luminosity) · [A critical band of luminance gradients for the perception of self-luminosity](https://www.sciencedirect.com/science/article/abs/pii/S0141938218301835) · [The switching glare illusion](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10262631/) · [Robust brightness enhancement across a luminance range](https://jov.arvojournals.org/article.aspx?articleid=2483002)
R22 — [Perceiving animacy purely from visual motion cues involves intraparietal sulcus](https://www.sciencedirect.com/science/article/abs/pii/S1053811919303441) · [Newborns' sensitivity to speed changes as a building block for animacy perception](https://www.nature.com/articles/s41598-020-79451-3) · [Perceptual cues that trigger perception of animacy at birth: self-propulsion](https://www.researchgate.net/publication/298740191_Perceptual_Cues_that_trigger_Perception_of_Animacy_at_Birth_The_case_of_Self-propulsion) · [Perception of animacy from the motion of a single object](https://www.researchgate.net/publication/12184353_Perception_of_Animacy_from_the_Motion_of_a_Single_Object)
R23 — [The Bouma law of crowding, revised](https://jov.arvojournals.org/article.aspx?articleid=2212997) · [The Bouma law accounts for crowding in 50 observers](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10408772/) · [Seven myths on crowding and peripheral vision](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7238452/)
R24 — [Chromostereopsis: a multicomponent depth effect?](https://www.sciencedirect.com/science/article/abs/pii/014193829390093K) · [Neural correlates of chromostereopsis](https://www.sciencedirect.com/science/article/abs/pii/S0028393209002024)
R25 — [Motion-induced blindness and Troxler fading: common and different mechanisms](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0092894) · [Troxler effect (Illusions Index)](https://www.illusionsindex.org/i/troxler-effect) · [Induced visual fading of complex images](https://jov.arvojournals.org/article.aspx?articleid=2121987)
R26 — [Peirce's theory of signs (Stanford Encyclopedia)](https://plato.stanford.edu/entries/peirce-semiotics/) · [Rethinking the Peircean trichotomy of icon, index, and symbol](https://www.degruyterbrill.com/document/doi/10.1515/sem-2015-0134/html) · [Data by proxy: material traces as autographic visualizations](https://arxiv.org/pdf/1907.05454)

---

## §12 THE GHOST, THE RAMP, AND PG-20's FORM

### A-G17 · The disc occludes the host — opacity is not light *(decision 1)*

GRÜN measured the host's ghost inside the disc at median 0.0015, p99 0.005, max 0.0089 — **21 % of all the
light in the disc at 1920**, and its labels are **readable inside the field**: *IDENTITY CORE*, *TENSION FIELD*,
*RESONANCE ORBITS*.

My M-F3 said the ghost was negligible, and it was — **on a lit plate**. On a dark ground **the same ghost is
the medium's strongest structure.** Nothing about the host changed; the field moved out from under it. That is
the third time this phase a statistic written for one ground has been read on another.

**Decided: (a).** The disc is **opaque in the stage's own ground colour at alpha 1** — `rgb(3, 5, 8)`, which
adds **no light of its own** and only removes what is beneath.

§3 retired `DISC_GROUND_OPAQUE` because it was a **lit plate**. This is a different thing and must be named as
one: **opacity is occlusion, not light.** The constant expresses occlusion only, and its value is the stage's
ground, so the light budget is untouched and the field keeps the dark space it shares with every other view.

*"Alles ein Feld"* is satisfied by sharing the dark space and the visual language — **not** by letting a view
the user has navigated away from bleed through the one they chose. Two fields overlapping is not unity, it is
interference.

**(b) goes to OTTAVIO, not into the code.** `STAGE_GROUND_ALPHA` is his constant (PHASE_E §5); raising it to 1.0
would remove the ghost everywhere rather than only inside the disc. I have already taken one of his two levers
this phase and will not take the second.

**New obligation, the one that would have caught this:**

| # | obligation |
|---|---|
| **PG-21** | **No light in the field belongs to anyone else.** With every field element suppressed, the light remaining inside the disc is ≤ the stage's own ground. Measured exactly as the ghost was found. |

### A-G18 · PG-17 is measured on the medium — the ramp is ground, the ticks are figure *(decision 2)*

GRÜN is right. The glare effect is a property of the **surround gradient**; the collar ticks sitting on it are
**figure, not ground**, and a ramp interrupted by figure is still a ramp. PG-17 is measured on **medium pixels,
with signs and their seats masked**, exactly as PF-17/18 are.

This is A-F13 in the other direction: that rule said PF-8 bounds a sign's own luminance and not its contrast
against the medium; this one says PG-17 bounds the medium's gradient and not the figures standing on it. The
alternative — a bright seat under the collar — would break PF-2's absolute bands, which is not a trade.

**One guard added**, because a ramp cut to pieces stops being read as a ramp even if each surviving pixel is
monotone:

| # | obligation |
|---|---|
| **PG-22** | Seats and signs occupy ≤ **15 %** of the area of a body's ramp annulus. If this binds wrongly in a real render, bring it back with the render. |

### A-G19 · PG-20's form — and a correction to my own audit

**R26's audit was wrong on one row.** I classified the **dash word** as a pure symbol. It is not: *solid /
dotted / open* is **degree of line continuity standing for degree of connection** — a resemblance, therefore an
**icon**, and already as immediate as PG-20 asks for. The one pure symbol is the **mark glyph**.

That halves PG-20 and makes it precise. **The reinforcements, each an icon or index for the same question:**

| state | mark today (symbol) | reinforcement | type |
|---|---|---|---|
| DIFFERENT | `counterTick` — a cross stroke | **the arc is broken at the mark** | **index** — the connection is severed, and the gap *is* the severance |
| NAME_COMPOSITE_CONSTITUENT | `constituent` — a short tick | **a shorter arc nested inside the full one** | **icon** — part-of as literal containment |
| NAME_ALIAS | `alias` — a small circle | **an offset echo of the arc** | **icon** — the same thing twice, under two names |
| EQUIVALENT | `double` — a second line | kept; doubling already resembles sameness | **icon** |

GRÜN's `counterTick` → break is adopted as proposed. Its other candidate — class on the **body glow's ramp
steepness** — is declined for two reasons: the class belongs to a **coupling**, not a body (a body carries
couplings of several classes at once), and **blur is Troxler-vulnerable** (R25), which PG-19 forbids.

**No new question is introduced.** Each reinforcement answers the question its mark already answers, so E-1
holds.

### The four reds GRÜN measured, and what they mean

PG-1 0.42 (needs 0.55) — of which **~21 % of the disc's light is the ghost**, so A-G17 alone recovers most of
the gap. PG-6 0.025 (needs 0.15) and the inverted PF-15 at 0.23 (needs 0.08, dominated by the shelf band's
sheer area) are both real and both in GRÜN's build list. PG-3 at 54 px is the PG-14 frame shrinking the field
by ~4 %; raising V1.1's `drawn.min/max` is the right fix and takes new vectors.

---

## §13 THE TIP `10eb4030`, SEEN — AND MY EYE CORRECTED BY THE INSTRUMENT

The field is dark, five bodies are **named** and carry rank and tier, two glow **amber** for an unmet REQUIRED
requirement, and the relations are visible light. It is in the same language as the CAPABILITY FIELD OTTAVIO
pointed at.

**I nearly sent GRÜN after a defect that is not one.** Looking at the render, the cyan bodies read to me as dark
rings lacking presence beside the amber ones. Measured per body (core at 0.5 r, rim at r, glow at 1.4 r, ground
at 3 r):

| body | rank | core | rim | glow | ground | glow ÷ ground | warm (R−B) |
|---|---|---|---|---|---|---|---|
| role_platform | 1 | 0.0305 | 0.610 | 0.0608 | 0.0040 | 15.1 | **+44** |
| role_all | 2 | 0.0281 | 0.554 | 0.0479 | 0.0037 | 12.9 | **+44** |
| role_keys | 3 | 0.0257 | 0.540 | 0.0659 | 0.0015 | **45.4** | −43 |
| role_platform | 4 | 0.0245 | 0.546 | 0.0692 | 0.0015 | **47.6** | −41 |
| role_empty | 5 | 0.0228 | 0.540 | 0.0593 | 0.0015 | **40.8** | −39 |

**The cyan bodies have the *stronger* glow-to-ground ratio**, by three times. They only sit on a dimmer local
ground, further out. What I read as missing presence was **the hue channel doing exactly its job** — amber is
the only warm thing in a cool field, so it pops, and that is G-4's intent, not a defect in the others.

Recorded because the direction is unusual: all phase I have used the instrument to catch measurements that could
not fail. Here it caught **my eye** making a claim the field does not support.

### A-G20 · The four decisions

**PG-22** — counted **excluding a body's own name and measure**, bound **≤ 20 %** for everything else. GRÜN's
reading is right: a label is the body's own figure, and moving it out of the annulus would tear name from body
(proximity). The render settles the rest — the glare percept is intact at 13–48× glow over ground with the text
in place. Collar ticks are distributed around the annulus and do threaten the ramp read; a label occupies one
contiguous sector and does not.

**PF-3 retired in writing**, replaced by **PG-17 + PG-13**. Its ceiling (halo ≤ 0.25 × core) came from phase F,
where the halo was ambience that must not compete with a bright outline. In phase G the glow **is** the light
and the core is deliberately dark — measured 2.5…3.8 is the design, not a breach.

**PF-8 is measured with the travel hidden** — confirmed. The travel is the sign's **own designed motion**
(G-3); counting it as a leak would measure the design as a defect. Hiding is valid precisely because the travel
is a *separate element*, so suppressing it reveals whatever lies beneath — a real leak under its path is still
caught. **PF-5/7/10 on the medium are retired in favour of PG-10**: the breath has moved from the medium to the
glows, and an obligation must follow the thing it measures.

**PG-20 for DIFFERENT — my error.** I proposed breaking an arc that the sign table never draws: DIFFERENT's
`arcLine` is `open`, two ends and nothing between. There is nothing to break, and drawing a line in order to
break it would contradict the line word.

The counterTick's real question is narrower than I had it: *open* already says "not evidenced" for DIFFERENT
**and** UNCLEAR; the counterTick distinguishes **judged different** from **merely unclear**. So the
reinforcement must carry *that*:

> **DIFFERENT's two end ticks splay outward** — they point apart. UNCLEAR's stay radial. An **icon**: we looked,
> and these two do not meet. The counterTick stays.

CONSTITUENT (nested shorter arc) and ALIAS (offset echo) are accepted as built.
