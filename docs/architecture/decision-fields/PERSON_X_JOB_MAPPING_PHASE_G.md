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

---

## §14 THREE CORRECTIONS ON `3ec8457d`

### A-G21 · §13's wording was wrong: UNCLEAR → NONE *(GRÜN)*

UNCLEAR's `arcLine` is **`broken`**, not `open`; it has no free ends. The two `open` states are **DIFFERENT**
and **NONE**. So the counterTick distinguishes **"judged different"** from **"no relation found"**, not from
"unclear". The meaning I specified is unchanged — *we looked and they do not meet* against *nothing was found* —
and only my naming of the contrast was wrong. §13 is corrected here: **DIFFERENT's ends splay, NONE's stay
radial.**

### A-G22 · PG-10 re-derived on the carrier, and bounded on both sides

GRÜN is right that the whole 1.05…2.6 r annulus measures **the ramp's dark tail**, not the breath. The carrier
is the **visible glow** (mean luminance ≥ 2 × local ground), and measured there: 35.3 % / 33.0 % swing ≥ 0.004,
Weber p50 **20.6 % / 22.6 %**, max swing 0.0297 ≤ 0.030.

**PG-10 restated:** on the visible glow, **≥ 25 %** of pixels swing ≥ 0.004, **and** the median Weber fraction
lies in **[10 %, 35 %]**, with max swing ≤ 0.030.

GRÜN proposed only a floor on the Weber limb. **A-F1's lesson applies: the corridor is bounded on both sides**,
because R17's ceiling is what keeps this calm and phase F's whole failure was a floor without a ceiling — and
then a ceiling without a nominal. The measured 20.6 % sits in the middle of the corridor, and the max swing at
0.0297 against 0.030 is a **1 % margin** — tight enough that I want it re-measured on any change to the glow,
not assumed to hold.

### A-G23 · PG-22 scales with the drawn radius — option (b)

At 1280 the bodies are 30…47 px while ticks and seats keep **pixel** floors (E-7's ≥ 1.2 px strokes, the 1.6 px
seat pad). Their share of the ramp therefore grows as the body shrinks — **k/r, derivable, not arbitrary**:

| | mean drawn radius | pixel-floored share |
|---|---|---|
| 1920 | 34.9 px | baseline |
| 1280 | 18.8 px | **1.86 ×** |

**Decided: (b).** PG-22's bound scales with the drawn radius — 20 % at the 1920 reference, ≈ 37 % at 1280.
GRÜN's worst measurement there (25.5 % on the 1.1 r annulus) sits inside with margin.

- **(a) — exempting 1280 — is declined.** It is within a hair of "a bound that applies only where it passes",
  the error class named four times this phase. The geometry is the reason the share grows, so **the geometry
  belongs in the bound**, not in an exemption.
- **(c) — a thinner collar on small stages — is declined** for the same reason A2 was: it changes D-Q3's collar
  rule, a semantic, to fix a presence problem.

**And the annulus is 1.1 … 2.6 r**, as GRÜN measured it: a body's own outline band and its seat are **figure on
the rim**, not interruptions of the ramp.

**Stated limitation, deliberately not hidden by the scaling:** presence genuinely degrades on a smaller stage —
30…47 px bodies carry less than 57…88 px ones, and PG-3 is defined at 1920. The bound now says so honestly
instead of exempting the size.

---

## §15 TWO CORRECTIONS TO THIS RECORD ITSELF (post-reboot reconstruction, 2026-11-09)

Found during the owner-mandated full SFE reconstruction after the machine restart, by GRÜN's read of this
document against the shipped artifacts. Neither is a product defect; both are defects **in my own record**, and
an architecture record that misstates the constant it governs is a defect worth its own adjudication.

### A-G24 · The drawn range in §7 and §9 is superseded, not wrong

`§7`'s constant table and `§9`'s A-G14 promise list both state **ρ_drawn ∈ [32.2, 52.6] units**. The shipped
spec states **[34.2, 54.6]**:

> `layout-spec-v1.1.json:24–26` — `"drawn": { "min": 34.2, "max": 54.6, "rule": "… 34.2 … 54.6 field units:
> ≥ 56 … ≤ 92 px diameter at L0, 1920 × 1080, with the frame widened to hold every drawn body whole (PG-14)." }`
> Introduced at `10eb4030`, with `layout-golden-vectors-v1.1.json` regenerated against it.

**Both numbers were correct when written.** §7 (`a401592c`, 10:35) and §9 (`74fd43b8`, 10:51) recorded the range
as it then stood; **§12** (`39d50bae`, 10:59) then ordered the raise — *"PG-3 at 54 px is the PG-14 frame
shrinking the field by ~4 %; raising V1.1's `drawn.min/max` is the right fix and takes new vectors"* — and GRÜN
applied it at `10eb4030` (11:30). So this is a **supersession**, and I am recording it as one rather than
overwriting two dated adjudications. §7 and §9 are to be read with this amendment attached.

**The binding value is the spec's, not this document's.** `test/career/mapping/layout-v1_1.test.ts:63–69` reads
`SPEC_V11.body.drawn.min/max` rather than literals, so the test is spec-relative and correctly did **not** fail
on my stale prose. That is the right dependency direction and stays.

**What is still open and must not be read as closed by this correction:** the raise was made *in order to* clear
PG-3's ≥ 56 px floor, and the spec's rule text asserts it does. **That assertion is unmeasured.** The 54 px
reading predates the raise; no pixel measurement exists on `10eb4030` or `3ec8457d`. PG-3 therefore stays
**OPEN**, not "plausibly closed" — the spec claiming a pixel result is not a pixel result. This is exactly the
error class named four times this phase, and I decline to let my own correction commit it.

### A-G25 · There is no A-G11 — a numbering gap, not a lost adjudication

§8 runs **A-G10 → A-G12**. Reconstructed against the commit sequence: `899ef9b3` ("the field may not state a
fit, and seven mechanism pins") introduced A-G9 and A-G10, and A-G12 arrived in the same section as the pool
shade inversion. No commit in this branch's history adds, removes or renames an A-G11, and no other section,
test or evidence file in either track references one.

**Conclusion: a numbering slip of mine, nothing lost.** The identifier **A-G11 is retired unused** — it is not
to be assigned later, because a reader finding a fresh A-G11 after this record would reasonably take it for a
recovered one. Phase G's adjudications therefore run A-G1 … A-G10, A-G12 … A-G25, with A-G11 void.

### Boundary of this section

Documentation only. No product source, no spec, no test, no fixture and no constant is changed by it; phase G's
boundary (§3) and proof surface (§4) are untouched. It carries no GO and grants none — in particular A-G24 moves
PG-3 from "plausibly closed" to **OPEN**, which is a tightening, and it is **PINK's** to confirm or reject on its
own instrument, not mine to certify.

---

## §16 PINK'S INVERSE RECONSTRUCTION — FOUR OF MY NEW PINS CANNOT BITE

PINK delivered a full inverse reconstruction on 2026-11-09 against `3ec8457d`, without running a render, by
reading phase G's new pins against **its own committed phase-F evidence** (`evidence/mapping-phase-f-contract/`,
`manifest.sha256` 43/43). It is the heaviest finding of the phase and it is directed at me.

**The charge, in PINK's words:** phase G's founding move was *"I bounded the medium from both sides and called it
rigour, while the thing the field is for had no bound at all."* PINK's inverse reading is that I have **repeated
that move in the new channels** — twelve new pins written in 75 minutes, none measured by a second instrument,
and at least four that cannot change their verdict in either direction.

I have re-derived every number below myself from PINK's committed outputs before adjudicating. **I accept the
charge.** The defect count moves from twenty-two to **twenty-seven**.

### A-G26 · PG-10's max-swing limb is withdrawn — the ceiling is below the instrument's floor *(defect 23)*

`outputs/9cc06f84-baseline/noise-floor.json`: under `reducedMotion:reduce`, with the field motionless by every
DOM measure (phase-E P-6 green) and **nothing animating at all**, the image is still not pixel-identical —
`swing_max = 0.031872`, and `floor-regions.json` attributes the whole-square maximum to the **ring stroke edge**,
with mark AA edges at 0.02751. The jitter is sub-pixel antialiasing on the field's own bright thin edges, and
`DISC_GROUND_OPAQUE`'s retirement does not remove it.

**A-G22's third limb set the ceiling at 0.030 and reported 0.0297 against it. Both numbers sit inside a floor of
0.031872.** I wrote, two sections earlier, that the 1 % margin was *"tight enough that I want it re-measured on
any change to the glow."* It was never a margin. **A-F11 — my own corrected rule — forbids exactly this: a bound
the instrument cannot reach is not a bound, and max-against-max has no statistical content when floor ≈ signal.**
I reintroduced a bare maximum four sections after adopting the rule that forbids it.

**Decided: the max-swing limb of PG-10 is withdrawn.** PG-10 keeps its two measurable limbs — on the visible
glow, ≥ 25 % of pixels swing ≥ 0.004, and the median Weber fraction in [10 %, 35 %]. The ceiling that R17's calm
requires is **re-specified as a distribution**: the p999.9 of per-pixel swing on co-registered frames, with the
threshold set from the run's **own** measured static floor and never below it. The co-registration step does not
exist in either lane's instrument; it is a prerequisite, not an assumption.

**GRÜN must not build to the withdrawn limb.** The two surviving limbs stand and still need re-measurement on
`3ec8457d`.

### A-G27 · PG-2 is satisfied by the stage's ground colour alone *(defect 24)*

PG-2: with the semantics suppressed, the disc's median luminance ≤ 0.006. A-G17 then made the disc paint
`STAGE_GROUND_RGB = rgb(3, 5, 8)` at alpha 1. The WCAG relative luminance of that colour is **0.0014543** —
I recomputed it — so the bound is cleared by **4.13 ×** by the constant alone, and PINK's own measured ground
p50 at base was 0.00145, the same number.

**An obligation whose verdict is fixed by a constant in the remedy is not an obligation.** Decided: **PG-2 is
restated as a bound on what the remedy does not control** — the suppressed disc's median must not exceed the
**stage ground measured outside the disc in the same frame**, by more than the run's own static floor. That can
fail: it fails exactly when host light bleeds through, which is the thing PG-2 was invented to catch.

### A-G28 · PG-21 is satisfied by its own remedy *(defect 25)*

Same structure, and worse, because PG-21 is the obligation that would have caught the host ghost. It asks that
with every field element suppressed, the light inside the disc be no greater than the stage's own ground. A-G17
answers it by **painting the stage's own ground over the disc**. After the fix the two sides of the comparison
are the same pixels by construction.

This violates the second limb of my own two-limb checklist — *is the thing it must fail on even in the frame*.
Decided: **PG-21 is restated as a pre-and-post obligation on the same build** — the suppressed disc must match
the stage ground **and** a build with `DISC_OCCLUSION` disabled must fail it. The mutant is the proof; without a
recorded mutant PG-21 returns INCONCLUSIVE, not GREEN.

### A-G29 · PG-13 was already passed by 12–50× on the stage OTTAVIO rejected *(defect 26)*

PG-13 asks each body's peak luminance ÷ its own local surround median ≥ **8**. PINK's Q-F5 at base `9cc06f84`
measured bodies at **97–398**. My own §13 table on `10eb4030` gives rim 0.54–0.61 over ground 0.0015–0.0040,
i.e. **135–400**. **The bound is between twelve and fifty times looser than the rejected stage already was.**

PG-13 was invented to answer PINK's caveat that *"a body could hold 55 % of the light and still lack presence."*
It cannot answer it: it is green-by-coincidence at birth, on the very build whose lack of presence is the reason
this phase exists. Decided: **PG-13's ratio limb is retired as non-discriminating.** What A-G7 actually needs is
the **critical-band** form of R21 — the gradient profile, which is PG-17's monotone-falloff limb — plus an
**absolute** floor on body light, not a ratio against a near-black surround. The replacement is specified with
PG-17 below, and until it exists **A-G7's multi-channel presence obligation is unmet, not met by PG-13.**

### A-G30 · PG-11 is a ratio of two floor values, and I removed the guard myself *(defect 27)*

PG-11 asks relation motion energy ≥ 1.5 × medium motion energy. PINK established the counter-rule in its §7 and
**I adopted it for PF-10**: *"reports INCONCLUSIVE unless the unselected breath amplitude is ≥ 0.0002 in its own
right — a ratio of two floor values is not a measurement."* On a correctly calm field the medium's motion energy
sits near the floor, so 1.5 × is a ratio of two noise values. **I took PINK's finding and dropped PINK's guard.**

Decided: **PG-11 carries the guard explicitly.** It returns INCONCLUSIVE unless the medium's coherent motion
energy is ≥ 0.0002 in its own right. This compounds with A-G13's flagged risk — at divisor 1 the travel's motion
energy halves — so the two must be measured in one pass.

### A-G31 · PG-17's measurement domain contradicts A-G10 pin 7 — pin 7 wins

A-G18 specifies PG-17 on **medium** pixels with signs and seats masked. A-G10 pin 7 moved the glow **out of the
medium** into `mapping-glows`, because a glow is body light. PG-17's subject **is** the glow's ramp. As written,
PG-17 measures a domain that by the same document excludes the thing it measures.

**Decided: pin 7 stands, A-G18's domain is corrected.** PG-17 is measured on the **union of `mapping-glows` and
the medium beneath them**, with signs and seats masked — the ramp is a body's light falling across ground, and
both are the carrier. A-G18's reading that *"the ramp is ground, the ticks are figure"* survives as the
figure/ground distinction; its domain assignment does not.

### A-G32 · A-G20's "PF-8 with the travel hidden" contradicts defect nineteen — withdrawn

Phase F §30, defect nineteen, in my own words: *"Suppression isolates a sign; it does not isolate the medium,
because the medium is partly underneath the signs."* That is why PF-17 and PF-18 were rebuilt **mask-based with
every sign drawn**. A-G20 then reintroduced hide-and-reveal for PF-8 on the argument that the travel is a
separate element. It is — but G-3 puts the arc's **own glow** under the travel, so suppressing the travel reveals
glow, not ground, and a leak under the path is measured against the wrong backdrop.

**Decided: A-G20's hiding instruction is withdrawn.** PF-8 is measured **mask-based**, the travel drawn, its
pixels excluded by its own mask — the method defect nineteen produced, applied to the element A-G20 exempted
from it. The *intent* of A-G20 stands: the travel's designed motion must not be counted as a leak.

### A-G33 · A-G20 certified the glare percept with the statistic R21 excludes

A-G20 closed PG-22 on the grounds that *"the glare percept is intact at 13–48 × glow over ground."* R21, as I
stated it in §10, says the effect *"depends on a critical band of surrounding gradients that is explained by
**neither local contrast nor total luminance energy**, and it is cortical, not retinal."* A glow ÷ ground ratio
**is** local contrast. I certified the critical-band requirement with the statistic my own finding excludes.

**Decided: PG-22's adjudication in A-G20 is reopened on this point only.** Its 20 %/≈37 % occupancy bound
(A-G23) stands as written — occupancy is a geometric claim and the algebra was independently rechecked. What is
withdrawn is the *certification* that the glare percept survives: that requires PG-17's gradient-profile limb,
which has never been measured. **PG-22 occupancy: adjudicated. The glare percept: OPEN.**

### A-G34 · PF-15's inverted form may be unsatisfiable, and PINK has never seen it

A-G5 demands (a) the rings' total ≤ 8 % of the semantic share **and** (b) ≥ 1.6 ring-to-ring separation inside
that budget. PINK proved independently, on two methods, that the four rings do **not** separate ≥ 1.6 at the
lower two steps **even when free to reach any brightness** — all-angles 1.636 / 0.630 / 0.861, ink-only
1.636 / 0.630 / 0.796, the lower two decisively below 1.0. I then removed the licence to reach any brightness.

**I may have bounded a separation that already fails by constraining the resource it would need.** That is the
"bound the geometry refuses" class, named in A-G1. Decided: **joint satisfiability is a prerequisite, not an
expectation.** PINK measures (a) and (b) together on `3ec8457d` at both sizes and is **authorised to declare them
mutually unsatisfiable**, in which case the ring ladder's step count — not its budget — is what gives way, and
that returns to me as a semantic decision about how many rings the field needs.

### A-G35 · My own harness is not in the repository — and that is a boundary defect, not an oversight

PINK's I-7: `condyn-admin-hr-integration` @ `4c1dbb87` contains **no** `evidence/mapping-phase-*` directory and
no PF/PG script. **Every number in PHASE_F.md and PHASE_G.md that I measured — M-F1…M-F7, M-G1, M-G2, §13's
per-body table — is unreproducible from this repository.** GRÜN's four reds and A-G22/A-G23's numbers are in the
same state (PINK's I-8): they exist only as prose in this document. The 2026-11-07 reboot destroyed GRÜN's
scripts and PINK's scratch paths; PINK's *measurements* survived because PINK commits its instruments.

A proof surface whose two of three lanes cannot re-run their own measurements is not a proof surface. **Decided,
binding on GELB and GRÜN from here: a number may not enter an architecture record unless the script that
produced it and its raw output are committed in the same lane.** Prose citing a measurement is now an
unsupported claim. §0's M-G1 (4.78 %) and §13's table are hereby marked **CORROBORATED BUT UNREPRODUCIBLE** —
PINK's independent base readings agree with M-F1/2/3/6, which is why they are not withdrawn; §13's table has no
such corroboration and is downgraded to **CLAIMED**.

### Retirement by attrition — refused

PINK's count, which I verify against PHASE_F §17: **PF-3 was retired in A-G20 having never been measured**
(its cited 2.5…3.8 reading has no recorded provenance); **PF-5 and PF-7 were retired while RED**; **PF-10 was
retired having never run**. Their replacements are PG-17 (contradictory domain, now fixed by A-G31) and PG-13
(non-discriminating, now retired by A-G29).

**Decided: a proof surface may not shrink by attrition.** PF-3, PF-5, PF-7 and PF-10 are returned to the surface
as **OPEN**, not retired, until their replacements have produced a measurement that can fail. A retirement is
valid only when the replacement has returned a verdict.

### PINK's Q1 — reopened, as PINK asks

Q1 (overlap voids the per-mark firewall) was declared moot in §1 because the layout stays radial. PINK is right
that the *substance* survived the mootness: PG-15 puts rings behind bodies, A-G8 lets shelf rims reach ≈ 546
past a field ring at 500, and PG-17's annulus runs 1.1…2.6 r. **The overlap arrived without the layout solver.**
Decided: PINK's option **(a) — a layout constraint that a sign-bearing mark never overlaps a breathing element —
is the preferred form**, because it is testable at the engine level where V1.1's vectors already live, rather
than at the pixel level where every instrument is already stretched. GRÜN to state its cost; if it is not
affordable, (b) returns to PINK.

### What this section does NOT do

It grants no GO and withdraws none. It is documentation: no product source, spec, test, fixture or constant is
changed. Four pins lose their teeth, one loses a limb, two have their domain corrected, four return from
retirement, and one obligation (A-G7) is declared **unmet** rather than met. **Every restated bound is itself
unmeasured and is PINK's to confirm or refuse on its own instrument.** I have certified nothing here.

---

## §17 GRÜN'S RECONSTRUCTION — WHO OWNS THE PHASE-G INSTRUMENT

GRÜN delivered its read-only reconstruction of `3ec8457d` on 2026-11-09 and refused, correctly, to guess one
decision: *"Decide whether the phase-G instrument is GRÜN's or PINK's … If I build a second instrument we get two
measurement authorities for one phase … I will not guess it."* That is mine to answer, and it is the decision
both other lanes are standing on.

### A-G36 · Two instruments, one verdict — and GELB stops measuring

**The facts the decision rests on, each verified:**
- PINK's evidence tree holds `mapping-phase-{d,e,f}-contract`. **There is no `mapping-phase-g-contract`.** PINK
  has never opened phase G; its last word, `53ff108a`, predates `10eb4030` by eighty minutes.
- Every mapping pixel instrument in existence is PINK's, committed, manifest-verified.
- GRÜN holds none: `PG-10`, `PG-22`, `A-G21`, `A-G22`, `A-G23` appear in **no** source or test file in its tree.
- Mine are gone, and A-G35 has already forbidden me to produce another number this way.

**The temptation is to give the instrument to PINK alone, because PINK owns the verdict.** That is wrong, and
phase F says why. My own §9 count praised phase F for finding defects faster than we created them, and PINK's
inverse reading named the mechanism exactly: *"the surface finds them faster in phase F, where two instruments
measured against each other. Phase G's twelve new pins were written in 75 minutes, none of them measured by a
second instrument."* **One instrument is how phase G got four pins that cannot bite.** The strength was never
PINK's instrument; it was the *disagreement* between two.

**Decided — asymmetric, not symmetric:**

1. **GRÜN builds a development instrument** at `docs/career_analysis/evidence/mapping-phase-g/scripts/`, on
   PINK's committed methods (per-class masks under reduced motion, differential measurement, sign masks,
   deterministic seek, bracketed dof-matched null, joint LSQ, the window rule, the adequacy guard). It exists so
   GRÜN can see whether a change moved the number **before** delivering. Phase F's stage was rejected after
   everything passed; a lane that cannot see its own field is the cause.
2. **GRÜN's instrument returns no verdict, ever.** Its numbers are development readings. They may enter an
   engineering record as GRÜN's own measurement with script and output committed (A-G35), and they may never
   constitute a pass, a GO, or grounds for closing a pin. Self-certification stays invalid.
3. **PINK's contract instrument returns the verdict**, in a new `mapping-phase-g-contract`, re-wired off the
   dead scratchpad and re-probed for the changed taxonomy — `mapping-glows` exists in no PF-8 mask today
   (A-G10 pin 7's silent consequence, which PINK caught and my §3 inventory wrongly called survival: the
   *methods* survived, the *masks* did not).
4. **Divergence between the two is a finding, and must be reported, not reconciled.** The precedent is open and
   unresolved: PF-8's beams, PINK FAIL 0.0022 against 0.00072 passing — a 3× split that is a **mask definition**
   difference, promised a resolution "on the re-delivery" and never given one. Two instruments disagreeing is the
   mechanism working. Silent agreement after a quiet adjustment is the mechanism defeated.
5. **GELB measures nothing from here.** This is the structural half of A-G35. My third instrument is retired,
   not rebuilt. This lane adjudicates on the two lanes' committed numbers and on the record; when I want a
   number I ask for it, with its script. §0's M-G1 and §13's table stand as the last readings I will ever have
   produced, at the grade A-G35 assigned them.

**Two authorities for one phase is exactly what I want.** What there may not be is two *verdicts*.

### A-G37 · GRÜN's answer to its own second question: A-G22 is a first measurement, not a re-measurement

GRÜN asks whether A-G22's obligation to *"re-measure on any change to the glow"* has a baseline. **It does not.**
The 35.3 %/33.0 %, the Weber p50 20.6 %/22.6 % and the max 0.0297 exist only as prose here; GRÜN confirms a grep
across all thirteen worktrees hits this document and nothing else.

**So: there is nothing to re-measure against, and the limb it would have been measured against is withdrawn.**
A-G26 removed the max-swing ceiling because PINK's committed `noise-floor.json` puts the static jitter floor at
0.031872 — above both the bound and the reading. GRÜN is therefore instructed: **do not attempt to reproduce
0.0297.** Measure PG-10's two surviving limbs from scratch, and treat the distributional ceiling A-G26 specifies
as new work with no prior.

### A-G38 · Three corrections from GRÜN, all accepted

**(a) My brief's sign-table vocabulary was wrong.** `sign-table.json`'s `channels.arcLine` is exactly
`solid | dotted | open | broken`. **"nested" and "offset echo" are not line states** — they are PG-20 *mark*
reinforcements (`constituentInsetPx` 4.6 / `constituentShare` 0.4; `aliasOffsetPx` 5.2 / `aliasShift` 0.08).
A-G19's table already had this right; my restatement of it to GRÜN did not. Corrected here.

**(b) A-G21 is satisfied, and the mechanism is better than my wording.** I verified it: the splay keys on
`s.mark === "counterTick"` (`PersonJobMappingField.tsx:348`), not on the line word. Since `counterTick` belongs
to DIFFERENT alone, NONE gets `splay = 0` and keeps its ends radial **by construction**, and UNCLEAR (`broken`)
draws no ends at all, so it is structurally outside the contrast. A-G21's meaning holds without a further
change. Proven in the element tree only — **no pixel proof of the splay exists**, and it is now in PINK's scope.

**(c) PG-14's letter names a function that does not do the work.** The obligation says `l0Margin` is re-derived
from ρ_drawn. In the build `l0Margin` still solves only the sector-label band and knows neither radius; the
body-whole guarantee is delivered by `frameWithBodies()`, which widens the frame to the union of every drawn
body's rim, collar, name and measure, solved twice against the frame it widens. **Same guarantee, different
mechanism.** Decided: **the obligation follows the implementation.** PG-14 is restated against
`frameWithBodies()`. A bound must name the thing it measures — the same rule that retired PF-5/7/10 in A-G20 and
that A-G31 applied to PG-17's domain.

### A-G39 · Two documentation defects, neither cosmetic

**(a) `RING_LUMINANCE`'s derivation comment contradicts its own constant.** `PersonJobMappingField.tsx:96–100`
still records the ladder as *"0.0036 · 0.0069 · 0.0169 · 0.0431 at 0.05 · 0.085 · 0.15 · 0.25 ink"* while the
constant two lines above now reads `shelf: 0.02`. Verified. This is the file's own derivation record for PF-15,
**the obligation that is measured RED at 0.23 against 0.08** — the next lane to re-derive the ladder would read
the pre-inversion numbers as current. GRÜN to correct the comment with the shelf's new rendered luminance when
the measurement produces it, not before: an invented number would be worse than a stale one.

**(b) The specification authority is single-homed on this branch.** GRÜN's §0: `PHASE_{D,E,F,G}.md` exist **only**
in `condyn-admin-hr-integration`; GRÜN's tree carries `PHASE_C` and the `SPEC` only, and no `A-G*` identifier
appears anywhere in it. GRÜN builds against four documents it does not hold, on a branch 60 ahead of
`origin/main` and unmerged. **This is not lane separation working; it is a single point of failure that the
2026-11-07 reboot came close to proving.** It is the owner's call, and I am recording it as an open item rather
than resolving it: no merge and no push are authorised.

### A-G40 · My own relay of the typography worktree was wrong — corrected

I reported the untracked `docs/career_analysis/evidence/ui-typography/scripts/` in `condyn-admin-typography-base`
as *the only copy on disk, worth preserving*. **That is false.** GRÜN byte-compared all eight files against
their tracked counterparts and I reproduced the comparison: **8 of 8 identical**, against 14 tracked scripts plus
`README.md`, `values.md`, 15 `measures/` and 14 `pairs/` committed at `38ebc313`. The worktree holds a **stale
working copy on a detached HEAD**, superseded, with no unique content and nothing at risk.

Recorded because a reconstruction that invents a preservation risk is as defective as one that misses a real
one, and because the correction came from the lane with the artifacts rather than from the lane with the claim.
The genuinely unfinished work outside phase G remains **one** item: `condyn-admin-role-discovery`'s RD-5 T-07
re-set — and GRÜN sharpens it: the delta names base `ccc0cc1` while HEAD is `175c4816`, with no record that the
dump was re-run there, no recorded PASS of `t07-delta.py`, and `O-RD5-VM` still open. Its path is
`docs/career_analysis/evidence/role-discovery/scripts/`, not the repository root's tracked `scripts/`.

### Standing instruction to both lanes

**GRÜN is blocked on nothing and is told so explicitly**, as PINK asked. The four reds are its to pursue:
PG-1 (A-G17's remedy is built, the ghost removed, the share unmeasured), PG-6, PF-15 inverted, PG-3 (the spec
raise is built, the pixel unverified per A-G24). It must **not** build against PG-2, PG-10's withdrawn max limb,
PG-13 or PG-21 — A-G26…A-G29 restated all four, and three of them could not have failed.

**PINK opens `mapping-phase-g-contract`** and holds the verdict. Its answer to the one thing it could not check
is: `/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs` **exists**, and `~/.cache/ms-playwright`
holds `chromium-1243` plus two headless shells — no download is needed. The dependency itself stays a HIGH
integrity risk (I-2): unversioned, outside the repository, inside a boundary PINK may not touch, and one
`node_modules` deletion in an unrelated project away from rendering the whole proof stand unrunnable.
`CONDYN_PLAYWRIGHT_MODULE` is this project's established override and is the right place to fix it.

---

## §18 PINK'S SECOND PASS — THE FOUR REDS ARE ATTACHED TO NO ARTIFACT

PINK audited against `90ac32cb` (it crossed §16/§17 in flight) and independently reached A-G24's drift before
reading §15. It also confirmed the integrity picture more thoroughly than I did: **19 dangling commits exist,
the newest `6330dd01` at 2026-10-31 01:46 — every one predates the 2026-11-06 work and the 2026-11-07 boot.**
Nothing from the interruption sequence is orphaned. I verified the dangling set myself.

It then found something that changes what "open" means for four pins.

### A-G41 · The four §12 reds are void as measurements, not merely unreproducible *(defect 28)*

I verified PINK's claim against the commits:

| commit | time | `DISC_OCCLUSION` | `BODY_BUDGET` |
|---|---|---|---|
| `93c47e03` (`PHASE_G_BASE`) | 10:10 | **absent** | **absent** |
| `10eb4030` | 11:30 | present | present |
| `3ec8457d` | 11:43 | present | present |

`git rev-list --count 93c47e03..10eb4030` = **1**. There is no commit between them.

**§12 is `39d50bae`, 10:59.** So GRÜN's PG-1 0.42, PG-6 0.025, PF-15-inverted 0.23 and PG-3 54 px were measured
on a working tree that **held V1.1's drawn radius and the budget but not A-G17's occlusion, and that tree was
never committed.** It no longer exists; the reboot took it.

**The consequence I must not let stand is my own sentence.** §12 reads: *"PG-1 0.42 — of which ~21 % of the
disc's light is the ghost, so A-G17 alone recovers most of the gap."* That is a **prediction**, and it is
unfalsifiable on the artifact it was made about, because the artifact is gone and the remedy was already built
in the next commit without the gap ever being re-read.

**Decided: PG-1, PG-6, PF-15-inverted and PG-3's §12 readings are VOID as measurements.** They are not open
pending verification — there is nothing to verify. They are re-opened as **unmeasured**, to be measured for the
first time on a commit. A-G35 said such numbers are unreproducible; this is the stronger case, and it sharpens
the rule: **a measurement taken on an uncommitted tree is not a measurement of anything.** A-G35's binding
instruction is amended accordingly — the commit, not just the script and the output.

PINK adds the reason PG-3 cannot be derived at all, only measured, and it is correct: the unit→px factor depends
on the PG-14-widened viewBox, and that frame is itself derived from ρ_drawn. Frame widens → px scale changes →
whether 34.2 units clears 56 px changes. **It is circular.** The spec's rule text asserting *"≥ 56 … ≤ 92 px"*
is an assertion about an output of its own input. A-G24's refusal to treat PG-3 as closed is upheld on this
better ground.

### A-G42 · PF-8 and PG-11 require mutually exclusive renders — A-G13 put them in frequency collision *(defect 29)*

PINK's finding, and it is the best piece of engineering reasoning in this phase: **A-G13 made the travel's period
exactly the breath's.** PINK's PF-8 firewall separates signal from null **by frequency**, with the decoy
harmonics bracketing {0.1, 0.2, 0.3}. If travel and breath share a period, the travel's coherent energy lands on
**the identical harmonics as the breath's**, and the firewall can no longer attribute energy between them.

A-G20 "solved" this by hiding the travel — which is why PF-8 passed. But **PG-11 must compare relation motion
energy against medium motion energy with the travel visible, at exactly the frequencies the breath occupies.**
The two obligations therefore demand mutually exclusive render configurations, and no attribution rule exists.

**Decided: the collision is real and A-G13 is not reopened for it.** The travel/breath phase lock is a semantic
decision (G-3: the travel *is* the breath) and I will not trade a meaning for an instrument's convenience.
Instead:
1. **PF-8 is measured with the travel masked** (A-G32's mask-based form, not hidden), so the breath's harmonics
   are attributed to the medium alone.
2. **PG-11 is measured with the travel drawn, on relation pixels only**, against the medium's energy at the
   same harmonics — and it reports the **attribution rule** it used, explicitly, in its record.
3. **The two runs are separate passes over the same build**, and neither may reuse the other's frames.
4. If the harmonics cannot be separated even per-mask, **PG-11 returns INCONCLUSIVE** rather than a ratio. That
   is A-G30's guard doing its work, and it is the honest outcome.

### A-G43 · PG-20's splay is not redundancy — it must key on the state, not the mark *(defect 30)*

I wrote in A-G38(b) that A-G21's meaning holds without further change. **PINK shows that is wrong, and the
argument is unanswerable.** The splay keys on `s.mark === "counterTick"` — *the same predicate as the glyph it
reinforces*. Remove the counterTick and **both carriers vanish together**, while a test asserting
"counterTick ⟹ splay" still passes.

**PG-20 exists to give a second, non-symbolic carrier for a question whose symbol might be missed.** A
reinforcement that cannot survive its symbol's removal is not redundancy against that symbol — it is a second
rendering of it. The whole point of R26's semiotic audit is defeated by the predicate.

**Decided: the splay keys on the state.** DIFFERENT splays because it *is* DIFFERENT, not because it carries a
counterTick. GRÜN to re-key it on the relation state, and the test must assert the splay **survives the mark's
removal** — a mutant that deletes the counterTick and expects the splay to remain. A-G38(b) is corrected.

PINK's second limb stands too: **the splay's magnitude in rendered pixels is unmeasured at either size.**
Lateral end displacement ≈ 0.6 × tick, tick = max(2.4 k, 0.18 r). At 1280, where A-G23 already concedes presence
degrades and pixel floors dominate, this is the prime suspect for a sub-perceptual reinforcement. It goes on
PINK's list (its V6) and it is a **blocking** limb of PG-20, not a nicety.

### A-G44 · A-G23's scaling inherits a fixture — restated per body *(defect 31)*

The 1.86 × came from mean drawn radius 34.9 px → 18.8 px. PINK is right that **the mean over drawn bodies
depends on the fixture's `weightSum` distribution**, while ρ_drawn spans 34.2…54.6 units: a different pool
composition moves the mean and therefore moves a factor I called *"derivable, not arbitrary."* It also notes
1.86 ≠ the viewport ratio 1.5, which should have told me the factor was not geometric.

**Decided: PG-22's bound is stated per body, share ∝ 1/r_drawn**, evaluated against each body's own drawn
radius, with the 20 % anchored at the 1920 reference body. The fixture-mean form in A-G23 is withdrawn. The
annulus stays 1.1 … 2.6 r and the exclusion of a body's own name and measure stands.

### A-G45 · PF-15's red is instrument-suspect — re-measure with min(), not max()

PINK's phase-F §3 finding: its shelf max read 0.58, **and that was a body** crossing the 61 px annulus. If the
inverted PF-15 is computed with a max or an area statistic over that band, **its 0.23 is plausibly partly
instrument**, exactly as PINK's first shelf reading was — and the remedy is the **engraved-minima statistic I
myself adopted at §29: `min()` in the ring band, not `max()`.**

**Decided: PF-15-inverted's red is not accepted as a product fact until re-measured with `min()`.** Combined
with A-G41, this means GRÜN must not yet treat the shelf band's geometry as the proven cause. A-G34's joint
satisfiability question is asked **after** the statistic is corrected, not before.

### A-G46 · PG-21 gains an absolute limb

PINK: *"the light remaining inside the disc is ≤ the stage's own ground"* passes trivially if the stage ground is
itself lit. Its phase-F Q-F6 gives the anchor — suppressed-disc max **8.92e-3**, 0 px above 0.02, on the
**translucent** ground; an occluding plate in `rgb(3,5,8)` should beat that outright. Accepted: PG-21 carries an
absolute limb at Q-F6's value as well as A-G28's pre-and-post mutant.

### B3 — I cannot commit my mask, and that resolves the divergence the other way

PINK asks for my element-coverage mask definition, because it cannot match a mask that exists only as prose.
**It is gone with the scratch, and A-G35 forbids me to produce another.** The PF-8 beams divergence — PINK FAIL
0.0022 against my 0.00072 passing, 3 × — therefore does **not** resolve by PINK matching me.

**Decided: PINK's mask becomes canonical and is committed in `mapping-phase-g-contract`. My 0.00072 beams
reading is retired as unreproducible, and the PASS it carried is withdrawn.** Where two instruments disagreed
and only one can still be run, the runnable one is the instrument. PINK's earlier concession to match my mask is
released — it was offered to a mask that no longer exists.

PINK also notes **PF-18's three off-ring holes at 0.86 R were never explained.** Recorded as OPEN; the ring
exclusion lesson stands separately.

### B1 — escalated to the owner, not decided here

PINK's one blocking write: moving `condyn-admin-pink-visual-e` from `93c47e03` to `3ec8457d` and running
`next build`, because **no production build exists for either phase-G tip** — `condyn-admin-visual-d/.next` and
`condyn-admin-mapping-d/.next` hold dev artifacts only, no `BUILD_ID`, and Turbopack dev does not hydrate
headless. The only prod build on the machine is PINK's at `93c47e03` (`BUILD_ID YUIyV6i0VG5cALibnbi58`).

**I decline to authorise it, and the reason is the owner's own instruction.** The mandate says *preserve all
existing independent proof states*. That prod build **is** an existing independent proof state — the one
artifact PINK's entire phase-F surface was measured on. Checking it out to `3ec8457d` destroys it to create its
successor. PINK states lockfiles are identical and `next build` is cheap, so the loss is recoverable, but
"recoverable" is not "preserved" and the trade is not mine to make.

**Put to the owner as the phase's single blocking decision.** Until it returns, PINK holds at document-level
findings and GRÜN builds its development instrument — neither lane is idle.

### Two dirt sites I missed, now recorded

PINK found what my own integrity pass did not: besides `condyn-admin/{RUNNING, currentOperation, exact,
rejected}`, the worktree `condyn-admin-sil-integration` carries seven untracked zero-byte files named `=`, `DAR`,
`DCR`, `DCTXREV`, `RCP`, `repository`, `returned`. Both sets read as shell-redirect debris, neither is touched,
and their owners confirm before anyone sweeps. They matter only because they break any "working tree clean"
assertion, which several of these proofs make.

And one correction to my own §4 reading of the runtime: `runtime/dll-main` is 0 ahead but **12 behind**
`origin/main`. The DLL line is indeed all in `main`; it does **not** follow that restarting `:3017` is a no-op —
`condyn-admin-dll-runtime` @ `32c63c2b` would serve code twelve commits behind `main`.

---

## §19 B1 RESOLVED WITHOUT THE TRADE — THE BUILDER AND THE MEASURER NEED NOT BE THE SAME LANE

PINK put B1 as a binary: either it keeps its `93c47e03` production build, or it checks out `3ec8457d` and
rebuilds, destroying the only prod build on the machine. I escalated that trade in §18. **It is not a binary,
and I withdraw the escalation.**

### A-G47 · GRÜN builds its own tip; PINK measures the served port

PINK does not need to **own** the build. It needs to own the **measurement**. Its entire phase-E/F surface
already works this way — every instrument attaches to a served port through the fixture façade and reads pixels;
none of them builds anything.

**Decided:**
1. **GRÜN produces the production build of its own tip, in its own worktree** — `next build` in
   `condyn-admin-mapping-d` @ `3ec8457d`, served on its own port. Building one's own delivery is GRÜN's work by
   definition, and it is inside phase G's boundary: no merge, no push, no deployment, Gemini off, nothing
   outside the worktree touched. I am lifting the no-build constraint I placed on GRÜN for the reconstruction
   pass; it was a reconstruction constraint, not a phase boundary.
2. **PINK's `93c47e03` build is preserved untouched** (`BUILD_ID YUIyV6i0VG5cALibnbi58`), and with it the
   artifact its whole phase-F surface was measured on. The owner's instruction to preserve existing independent
   proof states is honoured, not traded.
3. **PINK verifies the provenance of what it measures rather than trusting it**: `git -C <worktree> rev-parse
   HEAD` equals `3ec8457d`, the tree is clean, and the served build's `BUILD_ID` is recorded in its run
   record. A build is a deterministic function of a commit; what independence requires is that PINK **check**
   the input, not that it perform the compilation.
4. **Independence is unharmed because the measurement is unchanged.** PINK's masks, statistics, nulls, guards
   and verdict remain entirely its own. If PINK judges at any point that a GRÜN-produced build cannot be
   trusted for a specific pin, it says so and *then* the trade in B1 comes back to the owner with a reason.

**Why this is the right shape and not merely the cheap one.** A-G36 separated the two instruments by
*authority*, not by plumbing: GRÜN sees its own field, PINK returns the verdict. Making PINK compile the thing
it measures adds nothing to that separation — it only makes the verdict lane carry the build lane's work, and in
this instance it would have cost the one reference artifact the phase still has.

**Both lanes are unblocked by this, and B1 is off the owner's desk.** What remains with him is unchanged:
the single-disk exposure of 64 unpushed commits (A-G39(b)), the `:3017` restart against code twelve commits
behind `main` (§18), and `condyn-admin-role-discovery`'s RD-5 re-set, which has been waiting on a commit so
PINK can check the delta my own earlier authorisation required.

---

## §20 PINK'S PHASE-G CONTRACT IS OPEN — AND MY `mapping-glows` INSTRUCTION REACHED 2 OF 5 GLOWS

PINK opened `mapping-phase-g-contract` on `3ec8457d` (`dfb71480`, `86aabeeb`) with scripts, outputs and manifest,
on its own production stand. I verified the state: `condyn-admin-pink-visual-g` @ `3ec8457d`, detached, clean,
`BUILD_ID xCD8LBxdjnP97-2Gjs5yr`; and **`condyn-admin-pink-visual-e` still @ `93c47e03`, clean, `BUILD_ID
YUIyV6i0VG5cALibnbi58` unchanged.** The reference artifact is intact.

### A-G53 · A-G47 is superseded — the owner's route is better than mine

I resolved B1 by having GRÜN build and PINK verify provenance. **The owner authorised a new worktree instead,
and that is the better answer.** A-G47 bought preservation at the cost of putting the build in the lane that
does not hold the verdict; PINK now owns both its build and its provenance, and nothing was traded. `rev-parse
HEAD` = `3ec8457d`, tree clean, lockfile md5 identical to `pink-visual-e`.

**A-G47 is not withdrawn, it is demoted to a fallback.** GRÜN still builds and serves its own tip — two
independent builds of one commit agreeing is evidence, and PINK says it will take it. What changes is that
PINK is no longer *dependent* on it.

Recorded because it is a reusable boundary mechanic: PINK reports `node_modules` must be **copied**, not linked.
A symlink out of the project root is rejected outright (`TurbopackInternalError: Symlink [project]/node_modules
is invalid, it points out of the filesystem root`) and a hardlink would let a build write back into
`pink-visual-e`'s tree — **both cheap options threaten the state the owner told us to preserve.**

### A-G48 · PG-10's carrier is `.mf-wave-halo` — the field glows, and only those *(the decision PINK asked for)*

Verified in the source: `PersonJobMappingField.tsx:670` — `className={b.shelf ? undefined : "mf-wave
mf-wave-halo"}`, and the group comment at `:922` states it outright: *"on the shelf they rest (A-F8)."* PINK
measures `.mf-wave-halo` at **2 of 5** glows at L0 and L1, **0 of 1** at L2.

A-G22 restated PG-10 *"on the visible glow"* and never said which. Taken literally, three of five glows **cannot
swing by construction**, so the ≥ 25 % limb is diluted by area the design deliberately froze — a false-RED of
precisely the class A-F25 and A-G26 have already closed twice.

**Decided: PG-10's carrier is `.mf-wave-halo`.** The rule is the one that settled PG-17's domain in A-G31 and
retired PF-5/7/10 in A-G20: **an obligation follows the thing it measures.** The breath lives on the field
glows; the shelf's stillness is a *meaning* (A-F8), not an omission, and a bound that penalises a meaning is a
broken bound.

**But scoping PG-10 away from the shelf opens a hole, and it closes here in the same breath.** If PG-10 only
looks at breathing glows, nothing checks that the resting ones actually rest. **PG-10 therefore carries a
negative limb: the shelf glows' swing must lie within the run's own measured static floor.** That is the
two-limb checklist applied to my own scoping — the statistic can fail, and the thing it must fail on (a shelf
glow that breathes) is in the frame.

**On L2: NOT RUN is correct, and the fixture is the defect, not the pin.** PINK is right that with a shelf body
alone at L2 there is no breathing glow and A-F11 gives NOT RUN rather than a failure. I decline to weaken the
pin for it. **The fixture must place a field body at L2** so the level is measurable; that is a fixture
obligation on GRÜN, and until it is met PG-10 at L2 reads NOT RUN and the phase may not be closed on it.

### A-G49 · The pattern is the finding — a semantic carrier may not live only in `className` *(defect 32)*

My instruction to re-probe *"including `mapping-glows`"* was wrong, and PINK's correction is exact. Verified:
`:667` splits `(b.shelf ? shelfHalos : fieldHalos)`; only `fieldHalos` goes inside `<g
data-testid="mapping-glows">` (`:923`), while `shelfHalos` renders at `:884` inside an **anonymous `<g
aria-hidden pointerEvents="none">` with no testid, no `data-*` and no class of its own.** A mask built as I
specified misses **3 of 5 glows at L0 and L1 and all of them at L2** — silently, which is the signature we keep
chasing. The only selector reaching every glow is the className `.mf-halo`.

**PINK's wider claim is accepted as the real finding: this is A-F15 recurred.** In phase F the halo *layout*
marker lived in `classList` (`mf-layout`) and was adjudicated once. The glow *carrier* has now done the same.
**This drawing puts semantic carriers in `className` while every instrument looks in `data-*`.** PG-1, PG-13,
PG-17 and PF-8's glow coverage all depend on it.

**Decided, and it is a standing rule, not a one-off fix:** `className` is a **styling** channel. A carrier that
an obligation measures must be addressable by a stable `data-*` hook, and `data-testid` on a container is not
enough when the container holds a subset. GRÜN to give the glows an addressable identity that distinguishes
shelf from field, and the breath carrier likewise. Until it exists, PINK addresses via `.mf-halo` /
`.mf-wave-halo` and **records in each run that it is reaching semantics through a styling channel** — so the
reading carries its own caveat rather than inheriting a silent one.

**And PINK caught its own instrument before measuring, which is why this is a note and not a retraction.** Its
committed `pink-pg1.mjs` SEM selector carries **no glow term at all** — correct at `93c47e03` where no glow
existed, and on this tip it would have under-counted semantic light by the entire glow channel, the channel my
own `:920` comment calls *"part of each body's light (PG-1)."* **PINK's 2.82 % stands as a reading of
`93c47e03` and is not transferable to any phase-G tip.**

### A-G50 · A-G4's justification is falsified — L1 is not the densest level *(defect 33)*

I ordered L1 measured *"because A-G4 just made L1 the densest level."* PINK measured it. **L1 is denser than L0
on no mask:** beams 19 vs 22, text 11 vs 15, arcs 19 = 19, glows 5 = 5, travel 0 vs 3.

A-G4 raised L1's cap to 12 on *"the stage zooms to the sector there, so the same screen space holds more bodies
at the same drawn size"* — a geometric intuition, flagged as unmeasured, now contradicted at this fixture.
**Decided: the cap of 12 stands as a cap; its justification is withdrawn.** A cap is a ceiling and a ceiling
need not be reached. What is retired is the claim that L1 *is* denser, and with it my instruction's reason.
**L1 remains worth measuring — for A-G51, not for density.**

### A-G51 · PG-18 has no satisfier at L1, and that is a build gap *(defect 34)*

PINK: `mf-travel` and `mf-beam-glow` are **0 at L1**, under `reduce` **and** `no-preference`, so it is not a
probe artifact. Beams exist at L1 (19 of them) — their travelling light does not.

PG-11 therefore returns INCONCLUSIVE at L1 by A-G30's guard, and **PG-18 has no satisfier at L1 whatsoever**,
having been written to require *"the travelling light departing on a coupling"* and to state explicitly that the
breath alone does not satisfy it.

**Decided: it is a build gap, not a property of L1.** G-3 makes the travelling light part of what a relation
*is* — *"relations are paths with their own life."* A level that draws nineteen relations without their life
contradicts G-3 on its own terms, and no adjudication in this phase ever decided to quiet L1. **GRÜN makes the
travel present wherever a beam is drawn**, which gives PG-11 and PG-18 their carrier at L1 as a consequence
rather than as a patch. If GRÜN has a reason L1 was quieted deliberately, it contests this with the reason and
I will take it — but silence is not that reason.

PINK's timing cross-check supports the reading from an independent direction: **L1 is the cheapest level**,
which is exactly what a level with no travel and no beam-glows should cost. The DOM count and the stopwatch say
the same thing without either consulting the other.

### A-G52 · A-G17 made the instrument better conditioned — recorded because it runs the wrong way

PINK re-measured the adequacy guard instead of inheriting phase F's cost:

| | L0 | L1 | L2 | at `ef466ca8` |
|---|---|---|---|---|
| shot only | 474 ms | 281 ms | 338 ms | ~1250 / ~1400 ms |
| `optimizeForSpeed` | 347 ms | 184 ms | 283 ms | 910 ms |
| fast + inline decode | 228 ms | 185 ms | 210 ms | unaffordable |

maxFreq 0.35 Hz clears 0.9 × Nyquist **in every configuration at every level**, including plain screenshots
with the decode inline. Phase F's two forced workarounds are no longer required by the frequency axis, and a
≥ 57 s PF-8 window now yields ~164 frames instead of ~46 on the same 13 parameters.

PINK attributes it to **A-G17**: phase F composited a lit translucent plate over the host's backdrop-filters;
phase G occludes in the stage's own ground colour, and occlusion is cheap. **A decision taken for presence has
made the instrument better conditioned** — the opposite of the usual trade, which is why it is recorded rather
than merely enjoyed.

**The guard is not relaxed, and PINK said so before I could.** A profile with nothing contending licenses
nothing; every temporal run still measures and reports its own achieved cadence and still fires the check per
run. A profile is an expectation; the guard is the proof.

---

## §21 GRÜN'S INSTRUMENT IS COMMITTED — AND IT FINDS THAT A-G26 RESTS ON A GROUND THAT NO LONGER EXISTS

GRÜN committed its development instrument at `92d82c62` (`docs/career_analysis/evidence/mapping-phase-g/`:
a 436-line shared library, a façade and five probes), rebound `:3221` to loopback, and reports provenance in the
form A-G47 point 3 requires: **product delta against `3ec8457d` is empty** — `HEAD` differs only by the
instrument commit, which touches nothing outside the evidence directory. A-G36 point 2 is enforced in the
artifacts rather than the prose: no probe can emit a pass, every bound is a `…_boundForReference` field, and
every output carries `verdict: "NONE — development reading only"` plus its own `definitions` and
`pinkComparison` blocks.

Its instrument also caught a defect in its own provenance field on the first run — it compared `3ec8457d` to
`HEAD`, which is trivially empty while `HEAD` *is* `3ec8457d` however dirty the tree. **A check whose verdict
was fixed by its own construction: the A-G27/A-G28 class, found by the lane that built it, before it was used.**
That is the discipline working.

### A-G54 · A-G26's withdrawal is SUSPENDED, not reversed — a floor inherits the ground it was measured on *(defect 35)*

GRÜN's finding, and it lands on me: **the in-disc static floor on this build is exactly 0.000** — every pixel
inside the disc, under `reducedMotion:reduce`, over 86 frames at 1920 and 170 at 1280. The only non-zero floor
sits on mark boxes extending *outside* the disc (0.0061 / 0.0081), which is host motion behind the stage. The
pipeline is live — the same code reads carrier swing p50 0.00133 against medium 0.00030 on the breathing pass,
resolving three orders down. **The cause is A-G17's own remedy:** `DISC_OCCLUSION` paints `rgb(3,5,8)` at
alpha 1, so no translucent ground remains for the host's sub-pixel antialiasing to come through.

**A-G26 withdrew PG-10's max-swing ceiling because PINK's floor of 0.031872 exceeded the 0.030 bound. That
floor was measured at `9cc06f84`, on the translucent ground, which no longer exists.** My withdrawal is
therefore a statistic read on a ground it was not written for — **the third instance of that error class in
this phase**, after A-G41's void reds and A-G45's PF-15 statistic, and I named the class myself.

**Decided: A-G26's withdrawal is suspended, and the limb is held — neither withdrawn nor reinstated.** I will
not reinstate an obligation on a development reading; A-G36 point 2 forbids it and GRÜN explicitly did not ask
me to. **PINK measures its own in-disc static floor on the phase-G build, and that decides it.** If PINK's
phase-G floor sits well under 0.030 by its own asymmetric-admissibility rule, the max-swing limb returns as
written; if not, A-G26's withdrawal becomes final and the distributional ceiling stands in its place.

**And the general rule, stated so it stops recurring: a floor is a property of a build, not of a lane.** Every
floor, null and jitter baseline inherits the ground it was measured on, and carries forward only to builds whose
ground is unchanged. A-G17 changed the ground. **Every phase-F floor is therefore suspect on every phase-G tip
until re-measured**, not only this one — PINK to state which of its committed baselines survive the change and
which do not, as a prerequisite rather than as a finding.

### A-G55 · PG-1 cannot score an occluding semantic by light-removal *(defect 36)*

GRÜN's per-class attribution at 1920 gives `bodyContent` = **−0.084**: suppressing it *increases* the disc's
light. That is not an artifact — it is G-1 working as designed. **The body core is deliberately dark** (dark
core, luminous rim), so as an occluder it *subtracts* light, and a share computed as (full − suppressed) / full
books it as negative contribution. At 1280 the same class reads **+0.119**, because the geometry changes which
pixels the core covers.

**A sign flip between stage sizes proves the measure is not merely awkward in that class — it is unstable.**

**Decided: PG-1's ≥ 55 % is defined over the field's *emitting* classes**, and an occluding semantic is not
scored by a light-removal difference. The dark core's contribution to presence is real and is **PG-13's and
PG-17's business** — the core-to-rim ramp, the thing R21's critical band is actually about — not PG-1's. PG-1's
per-group attribution must therefore declare each class as emitting or occluding and exclude the occluding ones
from both numerator and denominator, with the exclusion recorded per run.

I decline to specify the occluders' own treatment here. GRÜN was right not to invent one; neither will I, on a
channel whose instrument does not yet exist. It is PG-17's monotone-falloff limb that has to carry it, and that
limb has still never been measured by anyone.

### A-G56 · A-G45 is vindicated — and the shelf ring is absent at its darkest angle *(defect 37)*

On the engraved-minimum statistic I adopted in A-G45, GRÜN's development reading has the ladder **passing every
step at both sizes**: 1920 → 4.636 / 1.758 / 1.615; 1280 → 2.689 / 3.031 / 1.775. PINK's closest-point method
on the phase-F ground gave 1.636 / 0.630 / 0.861, the lower two decisively below 1.0. **The statistic was
carrying the failure, exactly as A-G45 suspected.** A-G34's mutual-satisfiability question is therefore
re-framed: limb (b) is no longer obviously the limb that gives way, and PINK asks it *after* its own
engraved-minimum run, not before.

Limb (a) reads 0.141 / 0.115 against ≤ 0.08 — over, but nowhere near §12's void 0.23, and the shelf is **not**
the dominant term (`ringShelf` 0.037, `ringHorizon` 0.026 at 1920). **My §12 attribution to "the shelf band's
sheer area" is withdrawn as another void-ground reading.**

**But GRÜN found something sharper, and I have recomputed it.** The shelf's engraved minimum is **0.0014531 at
both sizes**; `rgb(3,5,8)`'s own WCAG luminance is **0.00145432**. The difference is **1.22e-6 — 1.7 % of one
8-bit code at that level**, by A-F31's own near-black resolution. **At its darkest angle the shelf ring is the
bare stage ground.** It is not subordinate there; it is **not there**.

**Decided, and this is mine because it is a semantic question, not an instrument one: A-G5's subordination may
not become erasure.** A ring whose purpose is to be a *scale* — the horizon, best-fit and shelf radii are what
make `fitDistance` legible (§1(a)) — cannot be absent at some angles and still be a scale. **PF-15 gains a
floor limb: the shelf's engraved minimum must exceed the stage ground by at least the run's own static floor.**
If `RING_LUMINANCE.shelf = 0.02` cannot clear that, then A-G5 over-corrected and the shelf's alpha comes back
up until it can — which is a presence decision about the shelf itself, and it is **not** the ladder question
limb (b) asks. GRÜN flagged it rather than concluding it, which was right.

### A-G57 · The proof of A-G43 is blocked by a fail-closed mandate — owner item

GRÜN made A-G43's change (the splay now keys on `arc.state === "DIFFERENT"`) and wrote the mutant I required as
`test/career/mapping-field/field-g-mutant.test.tsx` — mocking the sign table with DIFFERENT's mark set to
`"none"`, asserting no `counterTick` is drawn, and asserting the splay **remains**. It then **could not run it**:
every vitest run in this repository is gated fail-closed by `test/support/database-isolation/global-setup.ts`
(the 2026-10-10 isolation mandate), which refuses to start unless `DATABASE_URL` names a positively identified
disposable test database, and this worktree has no `.env`.

**GRÜN held the change out of the tree rather than committing it unproven, and refused to step around the
gate.** Both are correct and I endorse both: these are pure render tests that open no database, but a
fail-closed safety mandate is not a lane's to bypass, and A-G35 forbids an unproven product change entering the
record. **The consequence is good for the phase** — PINK's stand is the pure `3ec8457d` product rather than one
carrying an untested re-keying.

**It is an owner item: the test-database admin URL.** Until it arrives, A-G43 is implemented-and-held, not
implemented-and-unproven, and PG-20's state-keying stays open.

### GRÜN's development readings, recorded as such

No verdict, PINK's to confirm or refuse, at `BUILD_ID ymq-3TimwOQHr0BIsToOx`:

| pin | 1920 | 1280 | reference |
|---|---|---|---|
| PG-1 excl. rings | 0.517 | 0.584 | ≥ 0.55 — **straddling** |
| PG-6 | 0.163 | 0.194 | ≥ 0.15 |
| PF-15 (a) | 0.141 | 0.115 | ≤ 0.08 |
| PG-3 | 57.0 – 87.77 px | 30.37 – 46.76 px | 56 – 92 px at 1920 |
| PG-10 limb 1 | 0.296 | 0.272 | ≥ 0.25 |
| PG-10 limb 2 (Weber median) | 0.143 | 0.140 | [0.10, 0.35] |

178 and 501 frames over 57.7 s and 57.8 s; adequacy guard and window rule satisfied. **PG-3's model path and
rendered-shape path agree to the hundredth**, so there is no frame-widening divergence — and the 1280 range
independently corroborates A-G23's "30…47 px" from a different direction, which is the first time two lanes
have arrived at one of this phase's numbers separately.

Two cautions attach to the table. **PG-1's 0.517/0.584 is computed with the `bodyContent` class still in it**,
so A-G55 moves it before it means anything. And Weber here is defined per mean and says so; **PINK may define
it otherwise, and that is a finding to report, not something to reconcile** (A-G36 point 4). The straddle at
PG-1 is the phase's founding obligation sitting on the fence, and it will be decided by PINK on a corrected
denominator, not by either lane's present reading.

---

## §22 PG-1 PASSES — THE FOUNDING OBLIGATION IS GREEN, MEASURED BY THE VERDICT LANE

PINK committed `7e31cf26` on `3ec8457d`, on its own build, with scripts, outputs and manifest. **This is the
first verdict on a phase-G artifact, and the phase's founding obligation is met.**

### A-G58 · PG-1 is GREEN at both sizes and both motion settings

| | 1920 reduce | 1920 LIVE | 1280 reduce | 1280 LIVE |
|---|---|---|---|---|
| **PG-1 excl. rings** | 0.62610 | **0.63857** | 0.72348 | **0.73335** |
| incl. rings | 0.69772 | 0.71180 | 0.79327 | 0.80556 |

Against ≥ 0.55. Carrier set corrected per F-G1 (glows via `.mf-halo`, plus `.mf-travel` and `.mf-beam-glow`),
rings excluded per A-G5, by suppression, first measurement per A-G41 with no baseline sought.

**The inversion is complete, as a measured fact.** At phase F the coordinate rings alone (5.25 %) out-lit every
relation combined (4.55 %). Here the rings are 0.083 against a semantic 0.639 — **the relations out-light the
scaffold by about 7.7 ×.** §0 named the defect as a number: *"95 % of the field's light is ground … that is
'eine große blaue Zielscheibe' as a number."* It is no longer the case, and it is no longer an impression either
way.

**The largest single term is the glows, at 0.222** — which is precisely why F-G1 mattered. My
`mapping-glows` instruction would have captured only the field half of the biggest term in the obligation.

**PG-1 passes with A-G55's defect uncorrected**, the occluding body group included at its negative value
(−0.085/−0.098 at 1920). PINK reported the uncorrected arithmetic deliberately as the conservative direction:
**correcting it can only raise the figure.** A-G55 stands as a method fix, not as a condition on this verdict.

A-G55 is also now **independently reproduced on a different mask** — GRÜN found the sign flip on `bodyContent`,
PINK on `[data-mapping-body]`, the whole body group: −0.085 / −0.098 at 1920 against **+0.119 / +0.103 at
1280**. Two lanes, two masks, same instability.

### A-G59 · A-G26's limb returns as written — PINK withdrew its own charge

PINK measured the in-disc static floor on `3ec8457d`, 24 frames, `reduce`, with **0 animated elements asserted**
so it is a floor and not suppressed signal:

| | 1920 | 1280 | phase F, same basis |
|---|---|---|---|
| **disc (r ≤ 1.0) max** | **0.000000** | **0.000000** | — |
| quiet mid disc .3–.6 | 0.000000 | 0.000000 | 0.005917 |
| whole region max | 0.005939 | 0.006077 | **0.031872** |
| mean \|step\| | 3.34e-07 | 3.63e-06 | 3.62e-05 |

**Exactly zero inside the disc at both sizes**, every non-zero swing at r/R > 0.98. GRÜN's reading is confirmed
on an independent instrument and an independent build. PINK's own words: *"my charge against PG-10's ceiling
was true at `9cc06f84` and is false at `3ec8457d`."*

**Decided: A-G26's suspension is lifted and PG-10's max-swing limb returns as written (≤ 0.030).** The
distributional ceiling specified in A-G26 is retired as unnecessary — the simpler bound is admissible on this
ground, and A-F11 is satisfied with a floor five orders under the bound. A-G54's general rule is confirmed by
both lanes and stands: **a floor is a property of a build, not of a lane.**

**PINK's additive caveat is binding, not a hedge.** PG-10's carrier is `.mf-wave-halo`, and A-G8 accepted that a
shelf body's drawn rim reaches ≈ 546 past the field ring at 500 — so glow pixels at r/R > 0.98 sit on a ≈ 0.006
floor rather than 0. Still 5 × under the ceiling, so the limb holds, but **the per-run floor must be measured on
the carrier mask, not on the disc**, or the limb inherits a floor it was never measured against. A-F20's
per-run rule already requires it; this is the specific way it bites and it goes in every PG-10 record.

### A-G60 · Per-group attributions are never summands — binding on every record

PINK: the attribution is **non-additive in both directions.** At 1920 the sum of parts is 0.539 against a joint
0.639 (the occluder cancels emitters when hidden alone); at 1280 the sum is 0.929 against a joint 0.733
(overlapping carriers double-count).

**Decided: a per-group attribution is an attribution and never a summand. No record may add them, and every
record that prints them states this.** The overlap is not a flaw to be removed — PG-17's glow annulus runs
1.1…2.6 r and PG-15 puts rings behind bodies, so carriers overlap by design, which is PINK's Q1 surviving in
yet another form. An instrument that reported additive shares on this field would be reporting a fiction.

### A-G61 · The LIVE figure is primary — a resting field is a different claim

Travel reads 0.00000 under `reduce` (it is `visibility: hidden` there) against +0.013/+0.015 LIVE. Small, and it
moves no verdict here. But **a `reduce`-read PG-1 omits a semantic channel by construction.**

**Decided: the LIVE figure, period-averaged across the full 10 s, is the normative PG-1.** A `reduce` reading is
a statement about the *resting* field's light and must say so in the record. The field's light includes its
motion — G-3 makes the travelling light part of what a relation is, and an obligation about how much light the
semantics carry cannot exclude a semantic channel for the convenience of a stable frame. PINK's declaration is
adopted as written.

### A-G62 · The shelf floor limb fails on arithmetic — A-G5 over-corrected *(defect 38)*

A-G56 gave PF-15 a floor limb: the shelf's engraved minimum must exceed the stage ground by at least the run's
own static floor. **With the in-disc floor now measured at 0, that floor is 0, and the limb reduces to "must
exceed the ground at all."** PINK's reading is that this is no longer a noise question but a **quantization**
one. I computed it out:

| | |
|---|---|
| plate `rgb(3,5,8)` | L = 0.001454319 |
| shelf engraved minimum | L = 0.001453100 |
| difference | **1.219e-06** |
| smallest single 8-bit code step from the plate | **2.191e-05** (blue channel) |
| difference as a fraction of one code | **0.0556** |

**At its darkest angle the shelf ring is byte-identical to the plate it sits on.** Not subordinate, not dim —
the same byte. The limb therefore **fails on arithmetic, before any measurement**, and that is a stronger
finding than a failed measurement would have been.

**Decided: A-G5 over-corrected, and `RING_LUMINANCE.shelf = 0.02` is insufficient at the dark angle.** The
shelf's engraved minimum must differ from the stage ground by **at least one 8-bit code** — it must be a
different byte — which on this plate is ≥ 2.191e-05 above it. That is derivable rather than chosen, and it is
A-F31's own near-black discipline applied to the ring the scaffold most needed subordinating.

This does not restore the shelf to phase F's 0.05. **The requirement is a floor, not a return**: the shelf stays
the dimmest rung, it stays a step below best-fit, and it stays inside PF-15(a)'s 8 % budget — it simply has to
*exist* at every angle. GRÜN raises the alpha to the smallest value that clears one code at the darkest angle
and reports the value; PINK then re-asks A-G34 with a shelf that is actually present, since limb (b)'s ladder
has been measuring a rung that vanishes.

### PINK's baseline survival table — adopted as authoritative

My A-G54 prerequisite, answered. Recorded here because it governs every phase-G run:

| baseline | verdict |
|---|---|
| `noise-floor.json` 0.031872 | **does not survive** in-disc; retained only as a statement about the translucent ground and the host region |
| `floor-regions.json` mark_AAedge 0.02751 | **does not survive** — mark edges inside the disc now read 0 |
| `floor-regions.json` quietMidDisc 0.005917 | **does not survive** — now 0.000000; this was the host-through-translucent-ground term, and **A-F4 predicted its removal** |
| `floor-regions.json` outsideDisc_host 0.009368 | **survives in kind** (0.0059/0.0049) but is outside the field's scope per A-F4 |
| `PF8-PERCLASS2.json` bracketed-null amplitudes | **do not survive** — both ground and taxonomy changed; re-measure per class |
| A-F21's window result | **the rule survives, the numbers do not** — "the floor falls until ~2 resolution cells then flattens" is a property of the estimator and the frequency spacing, hence build-independent; the absolute values are ground-dependent and retired |
| A-F20 adequacy rule | **survives**, re-measured and far easier here |
| A-F30 (tier B/C NOT RUN ≤ 1.5 px) | **survives as geometry**; phase-G stroke widths to be re-checked before applying |
| A-F6 / PF-15 1.636 / 0.630 / 0.861 | **do not survive** — wrong statistic *and* wrong ground. **Superseded, not merely stale.** |

The distinction in A-F21's row is the one worth keeping: **a rule about an estimator is build-independent; a
number about a ground is not.** That is the sharpest form of A-G54 and it should be how every future baseline is
filed.

---

## §23 BOTH LANES CAME BACK AT THE SHELF — AND THE ONE WHO WAS WRONG IS ME

GRÜN asked me to hold A-G62 and retracted its shelf number as an instrument artifact. PINK, independently and
within minutes, went and **measured** the shelf rather than accept the credit I had given it, and committed
`4abed8ae`. The two accounts of the same ring contradict each other. **The source decides, and I read it.**

`PersonJobMappingField.tsx:882` draws an **opaque black seat** — `SEAT = "rgba(0, 0, 0, 1)"` — at the *same
radius and the same `strokeWidth`* as the shelf ring, and `:883` strokes `rgba(205, 240, 255, 0.02)` over it.
**The shelf band does not sit on the plate. Its own seat occludes the plate beneath it.**

| premise | composite | L |
|---|---|---|
| GRÜN: ink over the **plate** | rgb(7,10,13) | 2.9131184e-03 |
| **PINK: ink over the black seat** | **rgb(4,5,5)** | **1.4531051e-03** |
| GRÜN's *measured* engraved minimum | | 1.4531000e-03 |
| the plate rgb(3,5,8) | | 1.4543192e-03 |

**PINK's account matches GRÜN's own measurement to 5.08e-09.** GRÜN's premise is off by a factor of two.

### A-G63 · A-G62's mechanism is wrong twice; its conclusion stands

**So GRÜN's retraction rests on a false premise and is itself withdrawn.** Its instrument was reading the
band's own value correctly — ink over its own black seat. What was wrong was the interpretation, not the
sampler, on this point. And GRÜN's direct differential probe (718 of 720 angles contribute light) is *also*
true: the ring does add light over the seat beneath it. **The two lanes answered different questions** — "does
the ring add light to its own seat" (yes) and "can the band be separated from the adjacent plate on the
luminance plane" (no). Only the second is what the floor limb asks.

**My A-G62 wording was wrong on both halves**, as PINK says: the ring does not sit on the plate, and
rgb(4,5,5) against rgb(3,5,8) are **different byte triples** (R +1, B −3). "Byte-identical to the plate it sits
on" is false. The real mechanism is a **coincidence of the compositing chain**: the seat zeroes the plate under
the band, and 2 % ink adds back a luminance landing 1.214e-06 from where the plate was — **0.055 of the
smallest available code step (2.1915e-5, a blue +1)**.

**The operational conclusion survives intact**, because PF-15 is measured on the luminance plane per
A-F26/A-F31 and never in sRGB alpha: no luminance instrument can separate the band from the plate at that
angle. **A-G5 did over-correct; the floor limb is right; only the reason in the record needed replacing.**

**The alpha, verified on my own arithmetic over black:** `RING_LUMINANCE.shelf = 0.022` → rgb(5,5,6),
L = 1.5395496e-03, **+8.52e-05 over the plate ≈ 3.9 code steps.** 0.0205, 0.021 and 0.0215 all still round to
rgb(4,5,5) and clear nothing — quantization makes the step discrete, so 0.022 is the smallest value that works
at all, not merely the smallest on a grid. PINK derived it; I confirm it. **GRÜN takes 0.022 rather than
searching.** A +10 % nudge: the shelf stays the dimmest rung, a step below best-fit at 0.085, well inside
PF-15(a)'s budget.

### A-G64 · I credited the verdict lane with a reading it had not taken *(defect 39 — and it is mine alone)*

PINK's §4 reply reasoned **arithmetically** on GRÜN's numbers and said so explicitly — *"if that holds on my
render."* My reply to it said *"your shelf quantization reading is confirmed"*, and A-G62 then decided a
**semantic product change** on a number carrying PINK's name with no measurement behind it. PINK refused the
credit and went and measured instead: *"never certify what I did not measure, including when the certification
is offered to me."*

That is the correct refusal and it is the most important thing in this section. **An adjudication that
launders an arithmetic inference into a verdict-lane measurement defeats the entire separation A-G36 exists to
enforce** — and I did it in the same breath as praising the two-lane discipline.

**Decided, binding on this lane: a GELB adjudication may not attribute a reading to a lane unless that lane has
stated it measured it, on which build, with which instrument.** Where I am reasoning from another lane's
arithmetic, the record says *inference*, and an inference may not carry a product change. A-G35 required a
number to have a script and a commit; this requires it to have an **author**.

### A-G65 · min() is contaminated exactly as max() was — "A-G45 vindicated" is withdrawn *(defect 40)*

PINK measured the band over 720 angles at both sizes: **the engraved minimum reaches pure black, rgb(0,0,0), at
the darkest angle and at over 1 % of all angles** (p01 = 0; p50 = 8.4605e-4 at 1920). That is not the band's
value — it is the **opaque black seat of a mark crossing the band**: shelf bodies' seats, sector edges, beams,
all `SEAT`.

In phase F, max-across-the-band was contaminated by crossing **bodies** (PINK's shelf max 0.58 *was* a body),
and §29 adopted `min()` to fix it. **`min()` is contaminated by crossing seats. The replacement inherited the
defect of the statistic it replaced**, in the mirror.

**Decided: PF-15's statistic is neither min nor max.** It takes defect nineteen's remedy, which I established
for PF-17/PF-18 in phase F and never carried to the ring ladder: **keep every sign drawn, exclude sign and seat
pixels by mask, and take a robust central statistic over the band pixels no mark covers.** Suppression removes
medium; bare extremes read the marks.

**Consequently A-G56's "A-G45 is vindicated" is WITHDRAWN as unsupported.** Neither PINK's 0.630 / 0.861 nor
GRÜN's 1.758 / 1.615 was measuring the ring. GRÜN reached the same conclusion from the other side and asks that
every figure its `gruen-rings.mjs` produced be suspect, including limb (a)'s 0.1396 / 0.1113 — **granted, and
`min()`'s contamination is the independent reason it is granted.** The real comparison between the two lanes'
ladders has never been made.

**And GRÜN's request is adopted as a rule: an extremum over a band is a one-pixel statistic, and both lanes
have now been misled by one.** Every ring reading publishes the **per-angle distribution**, not only the
extremum. GRÜN notes it would have stopped before reporting had it seen `p05 = p25 = min`, which is not what a
single contaminated angle looks like. That is the diagnostic, and it is cheap.

### A-G66 · PF-15's local-ground limb is ill-posed for the shelf *(defect 41)*

PINK: the shelf band's two neighbours are **not the same ground** — 2.7460e-3 just inside (the lit `mf-ground`
gradient, which runs out to `shelfNear`) against 1.4324e-3 just outside. **A factor of 1.92 between the band's
own two sides, larger than PF-15's own 1.6 × threshold.**

So *"each ring separated from its own local ground by ≥ 1.6 × in either direction"* cannot return a verdict on
the shelf: which side counts as "its own local ground" decides it, and the sides differ by more than the bound.
**Decided: the limb declares its side.** For the shelf the **outer** side is the ground — the field's dark space
is what the scaffold must not out-light (G-1, and PG-1's whole framing), while the inner side is the lit medium
the ring is drawn *against* as a boundary. PINK measures both and reports both; only the outer one carries the
verdict, and the inner is recorded as the boundary contrast it actually is.

### A-G67 · `bodyCore` is EMITTING — my own prose misled the declaration

GRÜN declared `bodyCore` OCCLUDING on the strength of my §2 wording, *"a dark core, a luminous rim."* Its
instrument's declaration check flagged it **EMITTING** (+0.0429 at 1920, +0.0280 at 1280): `mf-core` is
`rgb(205, 240, 255)` at alpha 0.16 → 0.067 (`:857`) — dark *relative to the rim* and **additive over the black
seat**. The field's **one** occluder is `.mf-seat`, at **−0.515** of the field's light.

**G-2's prose is corrected: the core is dim, not dark, and it emits.** "Dark" was a comparison with the rim
that I wrote as if it were a statement about the pixel.

**And this vindicates A-G55's design precisely.** GRÜN: *"a sign test alone would have absorbed my error
silently, a declaration alone would have carried it."* A-G55 required each class to be **declared** emitting or
occluding *and* the arithmetic to be checked against the declaration. **The disagreement between the two is the
detector** — neither half finds this alone. That is the general form worth keeping, beyond this pin.

### A-G68 · PG-6 is RED, and A-G48's dilution argument is confirmed by measurement

GRÜN's corrected readings, after the A-G49/A-G51/A-G55 fixes superseded its earlier headline numbers:

| pin | 1920 | 1280 | reference | |
|---|---|---|---|---|
| PG-6 relation share | **0.02169** | **0.02236** | ≥ 0.15 | **RED** (was 0.163 / 0.194) |
| PG-10 limb 1 | 0.52038 | 0.48999 | ≥ 0.25 | passes (was 0.296 / 0.272) |
| PG-10 limb 2, median Weber | 0.28644 | 0.27846 | [0.10, 0.35] | passes (was 0.143 / 0.140) |
| PG-1 excl. rings, **resting** | 0.52215 | 0.60352 | ≥ 0.55 | resting reading only, per A-G61 |

**PG-6 fell 7.5 × once `[data-beam]` stopped matching arcs, and lands at 0.0217 — against §12's void 0.025.**
Neither is a verdict, and the near-agreement is worth naming anyway: the void reading may have been closer to
right than the corrected one that replaced it, which is an argument for A-G41's rule rather than against it.
**PG-6 is the phase's live red**, and it is the one GELB named in §12 as *"real and in GRÜN's build list."*
It still is, on a better instrument.

**PG-10's limbs roughly doubled once the still shelf glows left the carrier** — exactly what A-G48's dilution
argument predicted, now measured rather than argued. A-G48 is confirmed from the direction that could have
falsified it.

GRÜN's PG-1 of 0.522 against PINK's 0.639 is fully explained and no longer a divergence: GRÜN measured
**resting** under `reduce`, where `.mf-travel` is `visibility: hidden`, and its carrier set lacked `.mf-travel`
and `.mf-beam-glow`. A-G61 governs — the LIVE figure is normative and PINK's is the verdict.

### Where this leaves the shelf

Three things must happen in order, and none of them is a measurement of the ladder: GRÜN sets
`RING_LUMINANCE.shelf = 0.022` and reports it · the mask-based statistic of A-G65 is built · *then* the
engraved ladder runs and A-G34 is re-asked. **PINK is right to hold its run**, and said so before I could:
the rung is luminance-invisible at some angles and the statistic is contaminated at others, so the ladder would
measure neither the design nor the build. Meanwhile PINK takes the four items that need no build — §3.106's
D-5 host-file pin, MAP-G-ARCH, A-G14's missing second instrument, the A-G16 second pass — which I have named
four times and which are overdue.

---

## §24 D-5 AND MAP-G-ARCH ARE HELD — AND A RESTATED BOUNDARY INHERITS ITS OPEN OBJECTIONS

PINK closed two of the four overdue items (`f7727fa3`), computed at the artifact rather than by running GRÜN's
test. **Both are HELD.** I verified all three of its findings against `test/career/mapping-field/architecture.ts`
myself before adjudicating.

### A-G69 · D-5 is HELD, bounded to phase G

The §3.106 deferral — *"D-5's exact host-file pin lands at delivery for PINK to hold then"* — is spent. Across
`93c47e03..3ec8457d` the diff is **empty** for `SemanticCareerIntelligenceField.tsx`,
`CareerIntelligenceDashboard.tsx`, `SyntxFieldSelector.tsx`, `career-demo-layout.ts`, `career-demo-url.ts`,
`app/api`, `lib/career/job-pool` and `lib/career/job-scope`, and `--diff-filter=D` is empty — **no deletions
anywhere in the range.**

**PINK's boundary on its own certification is adopted verbatim: this pins the host across phase G only.** The
host did change earlier in the mapping line and that is phase D/E/F's business, held there. **A pin that names
its own range is worth more than one that reads as general**, and PINK declining to certify retroactively is
the behaviour I want, not a limitation to work around.

### A-G70 · MAP-G-ARCH is HELD — and the whitelist is tight, which deserves recording

Held on every substantive limb: V1 stays phase B's record byte for byte (`layout-spec.json`,
`layout-golden-vectors.json`, `real-shape-73.json`, `sign-table.json`, `PERSON_X_JOB_MAPPING_SPEC.md` all
unchanged — and PINK had already confirmed `sign-table.json` separately while verifying A-G21, where **no commit
on the GRÜN branch touches it at all**); in `lib/career` only `layout.ts` and the view model move; no merge
commits; no script motion, re-read from the component diff and independently corroborated from the
computed-animation side by F-G4.

**And the finding PINK says deserves saying rather than only auditing, which I verified: `G_ENTRY` has 20
entries, the real `93c47e03..3ec8457d` change set has 20 files, and the two sets are identical. No breach and
no slack.** A whitelist with no unused entries was written *from* the delivery rather than padded against it.
That is the right way round, PINK says it is not what it expected to find, and it is the one place in this phase
where the construction was tighter than the audit assumed.

### A-G71 · Three findings at the boundary itself — and the meta-finding is the one that matters *(defects 42, 43, 44)*

**(1) The boundary is defined only inside the file it governs, and that file is in its own whitelist.**
Verified: `G_ENTRY` is declared at `architecture.test.ts:363`, and `"test/career/mapping-field/architecture.test.ts"`
is itself one of its 20 entries. A-G10 pin 6 names `G_ENTRY` in this record and **never enumerates it.** So the
extent of the phase-G boundary exists in exactly one place, that place may change itself, and **a commit can
widen the boundary and satisfy it in the same breath, with no trace in the architecture record.**

PINK is right that this is not a bad-faith hypothetical: **it is the mechanism of A-G24.** The drawn range
drifted because the document and the artifact disagreed and only the artifact bound. Same shape, different
constant.

**Remedied here, on my side, by enumerating it** — and the test stays spec-relative, because A-G24 was right
about that dependency direction:

> **`G_ENTRY`, 20 entries, as of `3ec8457d`.** Product (4): `PersonJobMappingField.tsx` · `mapping-field-copy.ts` ·
> `lib/career/view-model/mapping-field.ts` · `lib/career/mapping/layout.ts`. Spec (2):
> `mapping-spec/layout-spec-v1.1.json` · `mapping-spec/layout-golden-vectors-v1.1.json`. Support (2):
> `test/support/mapping/layout-reference.ts` · `test/support/mapping/vectors.ts`. Proofs (12):
> `mapping/layout-v1_1.test.ts` · `mapping/architecture.test.ts` · `mapping-field/architecture.test.ts` ·
> `mapping-field/phase-base.ts` · `mapping-field/field-g.test.tsx` · `field-d` · `field-e` · `field-f` ·
> `field-interaction` · `field-render` · `model.test.ts` · `neurovisual-e.test.ts`.
>
> **Any widening of this set is a documented change to this section first.** A commit that adds an entry without
> amending §24 breaches MAP-G-ARCH whatever the test says.

**(2) The provider/API scan exempts two of the files phase G added.** Verified at `:400`:
`G_ENTRY.filter(f => !f.endsWith("architecture.test.ts") && !f.endsWith(".json"))`, while the test's own sentence
is *"no provider and no API in anything phase G added"* — and `layout-spec-v1.1.json` and
`layout-golden-vectors-v1.1.json` are two of the six non-test files phase G added. They hold numbers, so the
risk is low, **which is exactly why the exemption costs nothing to remove.** As written it is a bound not
applied where it is least likely to fire — the error class named four times this phase and now a fifth.
**Decided: drop the `.json` exemption.**

**(3) Nothing asserts the phase-G proof files still exist.** Verified: the change-set limb is
`expect(set.files.filter(p => !G_ENTRY.includes(p))).toEqual([])` — it checks only that changed files lie
*within* `G_ENTRY`, permitting any change to them including deletion, and the sole non-emptiness guards
(`expect(added.length).toBeGreaterThan(0)`) cover the view model and the component. **Deleting
`field-g.test.tsx` would satisfy MAP-G-ARCH** — and it is the only carrier of the structural assertions for
PG-3, PG-4, PG-5, PG-7, PG-8, PG-20 and PG-21.

**A boundary that permits removal of the proofs it bounds is bounding the wrong thing.** Decided: assert
existence and non-emptiness of the phase-G proof files, per pin where a pin has a single carrier. This also
closes a gap in the SFE core's own prohibition — *"never delete, weaken, quarantine or rewrite tests to obtain
a pass"* was a rule with no mechanism on this surface.

### The meta-finding, and the rule it earns

**PINK: all three are the class it raised against MAP-D-ARCH in phase D. *"The structure was inherited rather
than re-derived, so the objections came with it."*** And at §3.106 PINK had already **refused** GELB's
equivalent "logic carried over unchanged" claim on four counts, after which it was restated rather than closed.

**Decided, and binding beyond this phase: a restated boundary inherits its open objections. Restating is not
closing.** When MAP-*-ARCH is carried to a new phase, every objection outstanding against the previous one is
outstanding against the new one until it is answered on the new one's own terms — and the architecture record
names them rather than inheriting them silently. This is the structural sibling of A-G54 (*a floor is a property
of a build*) and A-G41 (*a measurement on an uncommitted tree is not a measurement*): **a certificate carries
its conditions, or it is not a certificate.**

**No GO is implied by either hold.** MAP-G-ARCH is a boundary, not an obligation, and holding it says nothing
about any PG pin — PINK said so first and it is correct.

### The remaining ledger

**PINK:** A-G14's missing second instrument and the A-G16 second pass on the counting argument — both need no
build and are next. The engraved ladder, A-G34 and PF-8 per class all wait on GRÜN's new `RING_LUMINANCE.shelf`,
and PINK is right that PF-8 waits too: **a shelf alpha change invalidates the per-class nulls**, so running it
first would only buy a re-run. That is A-G54's rule applied before the fact rather than after, which is the
first time in this phase it has been used that way.

**GRÜN:** `shelf = 0.022` and report it · the A-G65 mask-based statistic · the three MAP-G-ARCH remedies above ·
the two fixture obligations · PG-22 per body ∝ 1/r_drawn · PG-20's splay magnitude · **PG-6, the phase's live
red at 0.0217 against ≥ 0.15.**

**Owner:** the test-database admin URL, which holds A-G43; and PINK's branch, still unpushed.

---

## §25 A-G14's SECOND INSTRUMENT EXISTS — AND A-G14 ITSELF IS VOID

PINK built the independent instrument A-G14 always lacked (`d4f1e750`): a Python re-derivation written from
`layout-spec-v1.1.json` **only**, never importing, reading or executing `layout.ts` or `layout-reference.ts`.

**A-G14's substance is confirmed on the committed artifact.** 1412 bodies across all twelve vectors: mass radius
re-derived **1412/1412** exact at 1e-6, drawn radius **1412/1412** exact, and ten invariants passing on all
twelve — the spec range, monotonicity in mass, no two drawn bodies touching, the band stated by the mass radius,
undisplaced bodies at their fit, the shelf surviving, angles inside their own sectors, six-dp rounding.

**And PINK declared the limit of its own coverage before I could ask**: the search is iterative and
order-dependent, so it did **not** re-derive positions — it checked them against the spec's stated invariants,
*"which is the part a second instrument can actually falsify."* Recorded as the standard: **a second instrument
states what it does not cover, so that "independently confirmed" cannot borrow authority it has not earned.**

### A-G72 · A-G14 as written is VOID — it accepted a tree that did not exist *(defect 45)*

PINK found the range falsified and asked that the sentence be **struck rather than annotated**, because
*"a reader checking A-G14 against the vectors finds 120 counterexamples, not an outdated number."* In
**LV11-shelf-wide-bodies-cannot-leave-the-field, 120 of 120 bodies lie outside [32.2, 52.6]** — every one — and
all 120 lie inside the spec's [34.2, 54.6]. LV11's roles all carry maximum mass, so ρ_mass = 16 and
ρ_drawn = 54.6, over 52.6 by exactly 2.0. The falsification is total, in precisely the vector built to stress
drawn size.

**I grant the remedy, on stronger ground than PINK gave, and the ground is the timestamp.** I checked it:

| | |
|---|---|
| **A-G14 written** (`74fd43b8`, §9) | **2026-11-06 10:51:32** |
| **V1.1 spec committed** (`10eb4030`) | **2026-11-06 11:30:31** |

**A-G14 says "accepted as built" thirty-nine minutes before the build was committed.** It accepted GRÜN's report
of a working tree, and §12 (10:59) then ordered the raise that landed in that commit at 11:30. So A-G14's range
was correct *for the tree it accepted* — and **that tree was never committed and no longer exists.**

**This is A-G41's class applied to an acceptance rather than to a measurement, and it is the third instance.**
A-G41 ruled that a measurement taken on an uncommitted tree is not a measurement of anything. **An acceptance
granted on an uncommitted tree is not an acceptance of anything** — and it is worse than a void measurement,
because a measurement makes a claim while an acceptance confers a status.

**Decided: A-G14 as written is void and its promise list is struck, not annotated.** A-G24 was right to treat
§7's and §9's *constant tables* as superseded rather than overwrite dated adjudications — those were correct
when written and describe a state that existed. **A-G14 is different in kind: it is a status conferred on a
tree, and the tree is gone.** Annotating it would leave a reader an acceptance to rely on.

**What replaces it is PINK's `d4f1e750` confirmation**, on the committed artifact, by an instrument that shares
no code with the thing it checks. That is what A-G14 should have been. **PINK's standing objection — that
A-G14 was the only acceptance in phase G with no second instrument — is hereby closed by PINK itself**, which
is the correct way for it to close.

**And A-G35 gains its third limb.** A number needs a script, an output and a commit (A-G35, A-G41). **An
acceptance needs a commit hash for the thing accepted, named in the acceptance.** "As built" without a hash is
not a statement about anything.

### A-G73 · The golden vectors cannot witness their own no-touch invariant *(defect 46)*

PINK's tightest pairs, slack = centre distance − (ρ_drawn(a) + ρ_drawn(b) + gap):

| | pair | slack |
|---|---|---|
| **LV10** | role-008 / role-022 | **−3.108e-07** |
| LV08 | role-039 / role-081 | +4.773e-03 |
| LV09 | role-019 / role-023 | +3.302e-02 |

LV10's two bodies both sit at `drawnRadius` exactly **34.2** (= `drawn.min`), so the requirement is exactly
70.4 and the recorded centres are 70.399999689235 apart. **From the record the pair reads as a 3.1e-7
violation.**

**It is not a product defect** — 3e-7 field units is ~2.6e-7 px, and it is exact tangency plus rounding. It is a
**proof-surface** defect, and a clean one: the vector file states its own tolerance as *"Compare within 1e-6"*,
its coordinates are rounded to 6 dp so a distance recomputed from them carries up to ~1.4e-6 of error, and
**the margin under test is 3.1e-7 — smaller than both.** From the record alone that pair can be shown neither
to satisfy nor to violate the bound. The invariant can only be checked inside the implementation's own float
arithmetic — **by the very thing an independent instrument exists to check.**

**PINK's generalisation is the finding and I adopt it: this is A-F11 applied to the recorded artifact rather
than to a pixel instrument.** We have been applying *a bound the instrument cannot reach is not a bound* to
pixels, frequencies and floors, and never to the records themselves. **A record is an instrument.** Its
precision, its rounding and its stated tolerance are instrument properties, and a bound whose margin is finer
than its record's precision is unwitnessable at the record.

**Decided, choosing the first of PINK's three remedies: tangency-critical pairs are recorded at full double
precision.** The declared-epsilon option weakens the bound, and the in-implementation option removes
independent checkability — which is the one property A-G36 exists to protect. **Recording full precision keeps
the invariant witnessable by an instrument that shares no code with the implementation**, at the cost of a
little ugliness in one file. GRÜN emits full precision for any pair whose slack is under 1e-5, and the vector
note states that it does.

### PINK's self-correction, recorded

Mid-audit PINK believed the V1.1 vector file held only 8 layouts against its note's "twelve layout inputs" —
which would have meant the vectors exposing A-G8's problem were missing from the V1.1 record. **It had truncated
a key listing to the first 8.** All twelve are present and the note is accurate.

Recorded at PINK's own request, because *"I nearly sent you a finding that did not exist."* It is the second
time in two sections that a lane has caught its own error before it reached me (GRÜN's provenance field, §21),
and in both cases the catch came from the lane checking its own instrument rather than from the audit.

### The A-G16 ledger, and five new candidates

The last of the four overdue items is the A-G16 second pass. PINK will enumerate against both documents and the
evidence rather than take my count — *"your count is a claim about the proof surface"* — which is right, and is
the same instinct that produced A-G64.

**PINK notes §24's three findings and §25's two are five more candidates for that ledger, and that whether they
are "could not change their verdict" is exactly the classification it intends to test.** I will not pre-classify
them. My count in §9 was twenty-two with nine unable to change their verdict; the running count in this record
is now **forty-six**, and more than half of the additions since §16 are mine. **Whether that count means the
surface is finding defects faster than we create them, or that I have been creating them faster than one lane
could find them, is the question A-G16's second pass exists to answer — and I should not be the one who
answers it.**

---

## §26 A-G16's COUNT IS WITHDRAWN — AND THE MEASURE THAT REPLACES IT CAN FAIL

PINK closed the last of its four overdue items (`2a29aac2`) by enumerating defects **23…46** — the window the
claim is actually tested on — into a committed ledger with its script. **I read the ledger rather than the
summary**, and tested its one falsifiable offer against it.

### A-G74 · The count cannot fail, so by this surface's own rule it is not a measure *(defect 47)*

**Charge (1), accepted in full.** The count tallies defects *found*. Created-but-unfound defects are absent from
it by construction, so it compares a measured quantity against an unmeasurable one, and **there is no
observation that could make it report the adverse direction** — the residue never appears in its own tally.
A-F18 required a range test to prove its range non-empty; A-F11 required a bound its instrument could reach;
A-G26 withdrew a ceiling sitting under its own floor; A-G27 and A-G28 struck pins satisfied by their own
remedies. **A-G16's count is a bound with no reachable failing state, and it is mine.**

**Charge (2), accepted in full, and the mechanism is demonstrated by my own composition.** The count is
monotone increasing in the defect rate it exists to police: every defect created and then found adds one, so a
lane that creates many and finds them all scores *higher* than a lane that creates few. The ledger:
**owner — GELB 16, GRÜN 7, PINK 1.** My "more than half" in §25 was an understatement; it is **two thirds**, and
22 → 46 went substantially on my artifacts. A metric that rises when its subject worsens is reporting activity.

**Charge (3) — I tested it instead of accepting or disputing it, and it stands.** PINK offered a falsifiable
condition: charge (3) falls if four of the seventeen non-neutral rows can be moved. I went through them.
**I can move one, honestly, and it is not enough.**

> **Row 36 (A-G55, PG-1 cannot score an occluding semantic) should be neutral, on PINK's own measurement.**
> PINK recorded that PG-1 passes at 0.639/0.733 **with the occluder included at its negative value**, and that
> correcting it *"can only raise the figure."* A defect that cannot change its pin's verdict in either
> direction is neutral by A-G16's own criterion. That is one row, from 29.2 % to 33.3 %.

Rows 23, 27, 31, 37, 41 and 44 I examined and leave where PINK put them: each alters what a pin *bounds*, and a
future verdict with it. **So verdict-neutral falls from 40.9 % to at best 33.3 % — the harmless proportion
dropped by about a sixth rather than a quarter, and it still dropped.** The newer defects are more
consequential, not less. Five had already conferred something when found, **two of them a status** — A-G64's
credited reading and A-G72's void acceptance, which is my own distinction and the worse kind.

**Decided: A-G16's sentence is struck, as A-G14's promise list was struck.** *"Twenty-two instrument or proof
defects, of which nine could not change their verdict in either direction. The surface now finds them faster
than we create them"* is withdrawn — not annotated, because like A-G14 it reads as a status a reader could rely
on. **And I do not get to move row 36 on my own authority: PINK confirms or refuses it** (A-G64 — I may not
reclassify my own ledger, least of all in the direction that flatters my own count).

### A-G75 · The replacement measure, adopted as PINK specified it

PINK's constructive half is stronger than what I claimed, and it is adopted verbatim because **it can be
wrong**:

| measure | now | fails if |
|---|---|---|
| **cross-caught** — found by a lane that did not create it | **19 / 24 = 79 %** | self-catching comes to dominate |
| **found before conferring** a verdict or a status | **19 / 24 = 79 %** | defects are typically caught only after they have conferred something |

Both are computable from the ledger, both have a reachable adverse state, and neither counts the unfindable.
**That is the defensible form of what A-G16 was reaching for.** Only five of twenty-four were caught by the lane
that made them: **the two-instrument discipline is doing nearly all the work, and doing it early.**

### A-G76 · The concentration charge is mis-located — and the correction strengthens PINK's point

PINK's answer to my §25 question is that the risk is *concentration, not ratio*: 16 of 24 surfaced by one lane
during a period when GELB was still measuring, so *"the surface that produced these numbers had more finding
capacity than the surface that now exists."*

**I checked the six rows where GELB is the finder, and the charge does not hold as stated.** None of the six was
found by a pixel instrument:

| row | how it was actually found |
|---|---|
| 24 · A-G27 | computing the WCAG luminance of the constant `rgb(3,5,8)` |
| 25 · A-G28 | reading the remedy against the obligation it answers |
| 26 · A-G29 | reading **PINK's committed Q-F5 data** against my own bound |
| 27 · A-G30 | reading **PINK's own PF-10 guard** and finding I had dropped it |
| 35 · A-G54 | reading **GRÜN's measurement** against PINK's floor |
| 38 · A-G62 | computing 8-bit code steps from a constant |

**All six are reading and arithmetic. Four of the six were found on another lane's numbers.** A-G36 retired
GELB's *pixel instrument*; it did not retire GELB's reading, and A-G35 never forbade it — A-G35 forbade GELB
putting **unreproducible numbers** into the record, which is a different thing.

**So the finding capacity that produced these numbers has not been removed, and PINK's deeper point survives in
a better form than it was made.** Four of my six finds were only possible **because the other lanes commit their
numbers.** What preserves cross-catching is not any lane owning a pixel instrument — it is **every lane
committing its numbers, scripts and outputs so another lane can read them.** That is A-G35 doing work nobody
designed it for: it was written to stop unreproducible prose, and its actual effect is to make cross-catching
possible at all.

**The thing that would collapse this surface is therefore not A-G36. It is any lane keeping its numbers to
itself** — which is precisely the state all three lanes were in on 2026-11-06, and precisely what the reboot
exposed. I am not reversing A-G36 and PINK did not ask me to; I am recording that the ledger locates the load
on A-G35 rather than on instrument ownership.

### PINK's two entries against itself

**Row 35 is PINK's own and it did not catch it** — A-G54, a floor inheriting the ground it was measured on, is
owned by PINK's instrument and was found by me on GRÜN's measurement. PINK filed it in the same column as
everyone else's and said n = 1 is no basis for a rate. **A lane that files its own defect in its own ledger
without special pleading is the reason the ledger can be trusted at all.**

**And the neutral column is PINK's judgement, declared as such**, with the seven rows it judged neutral listed
by number *"so you can contest them rather than inherit them"* — which is the same instinct that produced
A-G64, applied by PINK to itself before I could apply it to PINK.

### What this leaves

The count is gone; two falsifiable measures replace it; the load is on A-G35, not on who owns an instrument.
**And the honest summary of this phase is no longer a reassurance.** Two thirds of forty-seven defects are
mine, the harmless fraction fell, and two of them had conferred a status before they were caught. What the
ledger does support — and it is worth more than the sentence it replaces — is that **four fifths of them were
caught by a lane that did not make them, and four fifths were caught before they had conferred anything.**

That is not the surface being good. It is the separation working, and it working is the only reason the first
statement is sayable at all.

---

## §27 A-G16's CRITERION IS UNDEFINED — A FACTOR OF NINE BETWEEN TWO READINGS OF MY OWN WORDS

PINK refused row 36 and, in answering it, **withdrew its own charge (3)** (`94f3dab3`). The refusal is correct
and the withdrawal is correct, and together they find a third defect in A-G16 that is deeper than the two
already recorded.

### A-G77 · "could not change their verdict in either direction" admits two readings and declares neither *(defect 48)*

| reading | neutral |
|---|---|
| **(a) retrospective** — the verdict *actually returned* was unaffected | **18 / 24 = 75.0 %** |
| **(b) structural** — the defect is *incapable* of affecting any verdict the pin could ever return | **2 / 24 = 8.3 %** |
| PINK's §8 figure | 7 / 24 = 29.2 % |
| A-G16's own reference | 9 / 22 = 40.9 % |

**A factor of nine on an unstated reading of my own sentence.** A-G16 declared neither, so its nine-of-twenty-two
was not a quantity either — and **PINK's 29.2 % was an undeclared mixture**, (b) applied to rows 36, 43 and 46
and (a) to rows 24, 25, 26 and 42. PINK says so itself and withdraws accordingly: *"I handed it to you as a
falsifiable number and it was not one."*

**So charge (3) is withdrawn, and I accept the withdrawal without treating it as rehabilitation.** *"The
harmless fraction fell from 40.9 % to 29.2 %"* compared my undeclared mixture against a different undeclared
mixture; neither endpoint is a quantity, so the trend between them is not a finding. **A-G16's sentence is
struck on charges (1) and (2) alone, which are structural, never touched the neutral column, and are
sufficient.** The outcome is unchanged; part of the route to it was wrong, and that part was PINK's, declared by
PINK.

**What replaces charge (3) is sharper than charge (3) was: A-G16's sentence rested on *two* unmeasurable
quantities, not one** — the created-but-unfound residue *and* the neutral fraction. I built a reassurance on a
count that cannot fail, and graded it with a criterion that does not resolve.

**And PINK's note on why (a) runs high is the part to keep.** Most phase-G pins have no verdict on any committed
artifact yet, so under (a) they are **vacuously** neutral: *"(a) measures how little has been verdicted, not how
harmless the defects are."* A 75 % that comes from the phase being unfinished is not good news, and it is
exactly the shape of thing A-G16 was built to sound like.

**Decided: the criterion is withdrawn with the count, and a rule takes its place. A classification criterion
declares its reading.** A criterion that admits two readings with a factor of nine between them is not a
criterion, and no proportion computed under it may enter a record. This is A-F18's discipline — prove the range
non-empty before testing in it — applied to a *classification* rather than to a range.

### A-G78 · Row 36 is refused, and "latent, not inert" is the right distinction

My argument was **sound under (a)** — PG-1 passed at 0.639/0.733 with the occluder booked negative and
correcting it can only raise the figure, so the defect did not affect the verdict returned. PINK grants that and
criticises its own §3 wording for inviting it: *"not load-bearing for **this** verdict"* is not *"incapable of
changing its verdict in either direction"*.

Under **(b)** row 36 is not neutral, and the reason is the measurement: **the occluder's share sign-flips
between stage sizes** — −0.098 at 1920, +0.103 at 1280. **On a build where PG-1 sits near 0.55 the verdict would
turn on the occluder convention alone.** The defect is **latent, not inert.**

**Refused, and I adopt the distinction generally.** A defect that happens not to have mattered is not a defect
that cannot matter, and only the second is neutral under any reading worth having. PINK refused *the number and
not the argument*, which is the right granularity: reclassifying one row inside an undefined criterion changes
nothing anyone can rely on.

### A-G79 · The rule did the work, not my judgement — and that is the finding

PINK recorded something in my favour and I am recording it differently, because its version credits me with a
choice I did not make.

PINK: *"Your own argument, applied consistently, is reading (a) — under which 18 of 24 are neutral, 75 %, far
above A-G16's 40.9 %. The trend would have reversed, and the sentence you had just struck would have been
supported rather than refuted. So you held the argument that would have rescued your own claim, applied it to a
single row, and handed the classification to the lane most likely to refuse it."*

**The arithmetic is right and the attribution is too generous.** I did not weigh the general form of my argument
and decline it. **I applied A-G64 mechanically** — *GELB may not reclassify its own ledger, least of all in the
direction that flatters its own count* — offered the single row it permitted, and sent it to the lane that
holds the classification. The restraint was the rule's, not mine.

**That is the better finding, and it is the general case worth having: a rule that protects the record from its
author without requiring the author's virtue is the only kind worth writing.** A-G64 was written three sections
ago about a reading I had credited to the wrong lane. Applied here, without deliberation, it stopped me from
generalising my way back to a conclusion I had just struck — and it did so while I believed I was conceding,
not defending.

**I would not have caught it.** PINK found the general form of my own argument faster than I did, and would have
had to refuse it on the ledger rather than on the rule if A-G64 had not already removed the move from me.

### Net position on A-G16, and what the surface now claims

| | |
|---|---|
| charge (1) — the count cannot fail, no reachable adverse state | **stands** (structural) |
| charge (2) — monotone in the defect rate it polices | **stands** (structural; owner GELB 16 / 24 confirms it) |
| charge (3) — the harmless fraction fell | **withdrawn by PINK**; the criterion cannot bear it |
| **A-G77** — the criterion itself is undefined, factor of nine | **new, and the deepest of the three** |
| A-G75 replacement — cross-caught 19/24, before-conferring 19/24 | **stands**; both falsifiable, neither uses the neutral column |

**A-G16's sentence is struck. Nothing has replaced its reassurance, and nothing should.** What the surface
claims now is two falsifiable fractions and no grade: four fifths of the defects in this window were caught by
a lane that did not create them, and four fifths were caught before they had conferred a verdict or a status.
**Those can be wrong, which is the whole of their value.**

### A-G80 · PINK's closing reframes the push, and it is right

PINK accepts A-G76 and then turns it: *"My nine contract commits, and every instrument that survived the
reboot, exist on one disk and are unpushed. By your own A-G35 reasoning that is not a storage question, it is a
cross-catching question."*

**That is correct and it supersedes how I have been putting it to the owner.** A-G76 established that four of my
six finds were possible only because the other lanes commit their numbers, and that **what preserves
cross-catching is not instrument ownership but readable, committed numbers.** PINK's lane is the only one whose
instruments survived 2026-11-07. If its outputs exist in one place, then the **79 % that is now the surface's
only claim is itself single-pointed** — and the measure would not merely be lost in an incident, it would have
been unsupportable all along.

**Recorded as the architecture's own argument rather than as a request: the owner's open question about PINK's
branch is not about backup.** It is about whether this surface's one remaining claim has more than one copy of
its evidence.

---

## §28 THE SHELF LANDED — AND MY DERIVATION METHOD WAS WRONG IN A WAY THAT HAPPENED NOT TO MATTER

GRÜN set `RING_LUMINANCE.shelf = 0.022` (`185427d5`, `BUILD_ID HRYkeEpbpndI3UEE7ceeC`), implemented A-G65, and
reports a divergence from my derivation rather than reconciling it (A-G36 point 4). It also withdrew its own
hold: it had reached the seat-compositing account independently (`0698bf83`) before §23 arrived.

### A-G81 · The mechanism is 8-bit alpha quantization — and it is computable, not merely sweepable

GRÜN measured 1.7566e-03, **+13.8 code steps, 1.208 ×** the plate. I derived rgb(5,5,6), 1.5395e-03, +3.9
steps. GRÜN's live sweep clears at **0.0216**, where my method says 0.0215 renders rgb(4,5,5) and clears
nothing. It concluded *"the browser is not rounding per channel the way the derivation assumes, so a future
'smallest alpha' question should be swept, not computed."*

**I found the mechanism, and it is sharper than "sweep instead".** The **alpha is quantized to 8 bits before
compositing**:

| α | α byte | effective α | composite | L | vs plate |
|---|---|---|---|---|---|
| 0.0215 | 5 | 0.0196078 | rgb(4,5,5) | 1.4531051e-03 | 0.9992 × — clears nothing |
| **0.0216** | **6** | **0.0235294** | **rgb(5,6,6)** | **1.7566321e-03** | **1.2079 ×** |
| 0.022 | 6 | 0.0235294 | rgb(5,6,6) | 1.7566321e-03 | 1.2079 × |

**GRÜN measured 1.7566000e-03 at 1.208 ×. The hypothesis gives 1.7566321e-03 at 1.2079 × — five significant
figures — and it reproduces the 0.0216 sweep threshold exactly.** My §23 method treated α as a float and
rounded per channel; the browser rounds α first.

**Two corollaries, and the second is the one worth keeping.**

1. **The rule is: quantize α, then compute, then sweep to confirm.** Not "sweep instead of computing" — a swept
   threshold with no mechanism cannot be checked, and GRÜN's sweep and my corrected arithmetic now agree, which
   is worth more than either alone.
2. **The alpha constant has a granularity of 1/255 ≈ 0.0039, so `0.022` and `0.025` render *identically*** —
   both are byte 6. My "smallest value on a 0.0005 grid" and PINK's derivation of it were **arithmetic on a
   grid finer than the quantum**. The value survives by luck. **A constant stated to four decimal places where
   the medium resolves ~0.0039 carries three significant figures of fiction**, and this applies to the whole
   ladder: between 0 and 0.25 there are about 64 distinguishable alphas, not 2500.

### A-G82 · GRÜN is right that byte-existence is not legibility — and the consequence routes to the ring count

GRÜN's question, raised rather than acted on: *"'One code above the stage ground' is satisfied at 1.208 × the
ground. That is byte-wise existence, not legibility: a 21 % luminance lift on a near-black field will not make
the shelf read as a scale, which is the purpose you gave the limb."*

**Accepted. I conflated two things in A-G56/A-G62.** I argued that *a ring which is a scale cannot vanish* — a
legibility claim — and then bounded it with *one 8-bit code* — an existence claim. Byte-existence is the
necessary condition, not the sufficient one, and I wrote the necessary one as if it closed the question.

**But the remedy is not a brighter shelf, and GRÜN's own measurement is why.** A-G62's floor made limb (a)
**worse** — 0.140/0.111 at α 0.02 → 0.14809/0.11678 at α 0.022, against ≤ 0.08. **The shelf costs about 0.009
of the budget to buy a ring that merely exists.** A perceptual floor costs more. So the two limbs genuinely
oppose, and A-G34's joint question has arrived concretely rather than hypothetically.

**Decided, and the authority is mine because ring count is a meaning (§1(a): the horizon, best-fit and shelf
radii are what make `fitDistance` legible):**
- **A-G62's criterion is corrected to legibility.** The floor is a stated contrast against the ring's declared
  local ground (A-G66: the outer side), not a code count. Byte-existence is retained as a *precondition* — it
  is cheap and it catches the A-G62 case — but it is no longer the bound.
- **The consequence routes to the rung count, not the alpha.** If legibility and PF-15(a)'s 8 % cannot both
  hold with four rungs, **the fourth rung goes** and the scale is carried by three. A scale with an illegible
  rung is not a finer scale; it is a coarser scale with a decoration.
- **PINK's verdict on limb (a) decides it, not GRÜN's development reading**, and the legibility figure is
  PINK's to set from its own instrument. I am not fixing a contrast number on a development reading — that is
  exactly A-G64.

### A-G83 · A bad statistic can hide an instrument defect, not only mismeasure the thing *(defect 49)*

A-G65's masked statistic found two defects in GRÜN's own instrument on first run. The first is the general one:

GRÜN had padded each thin ring by ±1.5 px. **A median over a padded band measures the surround** — a 5 px band
holding a 2 px stroke medians onto plate. The first masked run therefore **inverted the ladder**: best → field
**0.492** at 1920, the field ring at α 0.15 reading *dimmer* than best-fit at 0.085. The shelf was immune
because its stroke *is* its band, 70 units. **An extremum did not care about the padding.**

**So the statistic I retired in §29, and retired again in A-G65, had been *hiding* a defect in the sampler —
not merely mismeasuring the ring.** That is the mirror of A-G65 and a new general form: **a statistic
insensitive to an instrument's defect conceals it, and replacing the statistic is what surfaces it.** Both of
this phase's ring statistics were wrong, and the second one's first act was to expose a third error the first
had masked for the whole of phase F.

Fixed correctly, and the fix is the right kind: GRÜN now reads each band from **the renderer's own `r` and
`stroke-width`**, so the band is definitionally the stroke the browser paints, and the instrument's local
copies of `RING_WIDTH_PX` and the alphas are gone — **one of which still said `shelf: 0.02` while the build
served 0.022, and would have mislabelled this very record.**

### A-G84 · Seven seat elements are unaddressable — A-G49 has a second, independent reason

GRÜN: `.mf-seat` is not the whole firewall. **Seven seat elements carry no class and no `data-*` at all** —
the four ring seats (`:898`, `:926`, `:928`, `:930`), the person's seat (`:944`), the capability-node seats
(`:960`) and the L2 ring seat (`:1022`). Its occluder mask counted none of them, so **A-G55's bookkeeping was
never closed in any reading GRÜN has sent me.** The stopgap — matching the paint, `[stroke="rgba(0, 0, 0, 1)"]`
— is coupled to a constant's formatting and breaks the day `SEAT` is reformatted.

**A-G49 is confirmed from a second, independent direction and is no longer about the glows.** The rule stands as
written: a carrier an obligation measures needs a stable `data-*` hook. **And a consequence I must state: every
per-class attribution GRÜN sent before `642b0c26` is suspect on its occluder column** — not its emitting
classes, which were addressable. That includes the `bodyContent` sign flip of §21, whose *direction* PINK
reproduced independently on `[data-mapping-body]`, so A-G55 itself is unaffected.

### A-G85 · PF-15 has a direction — and GRÜN refused the vindication it could have claimed

On the corrected statistic, both sizes: **shelf → best 3.835 · best → field 1.964 / 2.071 · field → horizon
2.570 / 2.364.** Every step ≥ 1.6. **Limb (b) passes. Limb (a) fails at 0.14809 / 0.11678 against ≤ 0.08.**

**The ladder is satisfiable; the budget is not.** That is A-G34 answered in one direction and sharpened in the
other.

**And GRÜN's own note is the standard I want on the record:** *"The corrected ladder happens to agree with my
earlier conclusion — that limb (b) passes — but not with my numbers, and it agrees for a different reason. That
is coincidence, not vindication, and it should not be recorded as my having been right."*

**A conclusion that survives the correction of the measurement that produced it has not been confirmed; it has
been re-reached.** Noted as general. It is the same discipline as A-G41's void reds and A-G72's void acceptance,
applied by a lane to its own correct answer — which is harder than applying it to a wrong one.

### A-G86 · The PG-1 inversion — I will not supply a mechanism, I will specify the discriminator

GRÜN reports an anomaly it explicitly refuses to rationalise, and it is right to: **PG-1 rose when the shelf
alpha rose** (0.52215 → 0.54139 at 1920; 0.60352 → 0.61571 at 1280), with the shelf hunk as the only product
change, while **every individual emitting class's share fell** as expected. Parts and joint moved in **opposite
directions** under one perturbation. Not the seat-mask gap — PG-1 is bit-identical across that correction.

**That is a measured instance of A-G60 and a sharper one than the additivity gap: it says the interaction term
is itself alpha-dependent.**

**I am not proposing a mechanism.** GELB inventing one here would be the §12 error — a prediction about an
artifact, offered in place of a measurement. **What architecture can contribute is the experiment that
distinguishes the candidates, and A-G55 already requires it:**

> **Measure PG-1 with the occluding classes excluded from both numerator and denominator.** If the inversion
> disappears, the interaction is occluder-mediated — brighter ring light beneath bodies that occlude it changes
> what suppression reveals, and the joint and the parts diverge through the occluders. **If it persists, it is
> not**, and PG-1's definition needs the joint-to-parts relationship stated rather than only the
> non-additivity warning.

Cheap, already owed, and it can come out either way. GRÜN's instinct to watch for the same inversion when PINK
next moves a scaffold alpha is the right second observation and should be taken alongside it.

### GRÜN's own lesson, which is better than the one I gave it

I had written that sending an incomplete correction fast beat sending a complete one late. GRÜN took it and
narrowed it: *"The hold was right because a product change was pending on my number. The reason it was needed
is that I had sent you a conclusion built on an unexamined assumption about what the ring was composited over,
and I did it twice in one message — once in the finding, once in the retraction. **Fast correction is a
mitigation, not the fix; measuring the backdrop before claiming what sits on it is the fix.**"*

**Adopted over mine.** A lane that declines the comfortable lesson in favour of the one that costs it something
is the same move PINK made in refusing the credit in A-G64, and both are worth more than the corrections they
accompany.

---

## §29 PG-6 CLEARS — AND A-G51 IS WITHDRAWN, BECAUSE I DECIDED IT ON A CONTAMINATED COUNT

GRÜN (`02a1b585`) reports PG-6 clearing, A-G86 answered on its first limb, and a LIVE PG-1 within 1.2 % of
PINK's. One of its remarks contradicted PINK's L1 measurement, so I read the source. **It settles against one of
my own rulings.**

### A-G87 · PG-6 clears at 0.17977 / 0.19452 — and the pattern behind three false reds is now nameable

**PG-6: 0.17977 / 0.19452 against ≥ 0.15.** Its earlier 0.02075 / 0.02181 was a relation channel measured in a
mode where its **principal carrier is invisible** — `.mf-travel` is `visibility: hidden` unless
`data-breath="LIVE"` — and with **two of its three carriers omitted**, `RELATION_CLASSES` holding only the beam.
G-3 makes all three relation light, and PG-6 asks for relation light.

**So PG-6 was never a factor of seven short, the levers do not need to move, and §28's statement that it was
"the phase's live red" is withdrawn.** GRÜN was *"a message away from moving `TRAVEL.glowPx` / `glowGain` /
`glowMax` to close a gap that was mine"* — and I had endorsed that plan twice.

**GRÜN's diagnosis of its own pattern is the finding, and I adopt it as a rule.** Three times this phase a red
of GRÜN's was the instrument, *"and each time, a selector or a mode was chosen from the source's **vocabulary**
(`data-beam`, `.mf-halo`, `reduce`) rather than from what the obligation is **about**."*

> **An obligation names its carriers by what it is about; the instrument derives its selectors from that
> naming, not from the source's convenient handles.** `data-beam` was a handle, `reduce` was a convenience, and
> `.mf-halo` was a class that happened to exist. Every one of them produced a red that cost a tuning plan.

This is the same defect A-G49 bounds from the other side: the source's handles are not an obligation's
vocabulary, and the fix is that **the obligation publishes its carrier list and the instrument implements it** —
not that the instrument goes looking for something matching.

### A-G88 · A-G86 is answered on its first limb — the inversion does not reproduce *(and the residual is an instrument question, not a product one)*

GRÜN ran my discriminator in **both** motion modes, perturbing the shelf between byte 5 and byte 6 by live style
override on one build:

| | standard | occluder-excluded |
|---|---|---|
| LIVE 1920 / 1280 | −0.00451 / −0.00337 | −0.00325 / −0.00278 |
| REDUCE 1920 / 1280 | −0.00411 / −0.00326 | −0.00312 / −0.00264 |

**All eight deltas negative — the expected direction. The inversion does not reproduce in either mode or either
definition.** So it is **not occluder-mediated**, and **PG-1's definition needs nothing added**: A-G60's
non-additivity warning is the whole of what is required. The second limb of A-G86 does not fire.

**And GRÜN wrote a second probe because the first would have answered in the wrong mode.** It had a
non-reproduction in hand, LIVE — A-G61's normative mode but *not* the mode the anomaly was observed in — and
*"a non-reproduction in the wrong mode answers nothing. The mode was the backdrop."* **That is its own §28
lesson applied to its own result within one message**, and it is the strongest use of a rule by its author in
this phase.

**The residual, and I decline both of GRÜN's framings.** The +0.019 between the two build-based runs is not the
alpha — measured effect −0.003 to −0.004, a factor of five and opposite in sign. GRÜN recorded it as *"not the
alpha"* and stopped, reasoning that chasing it means measuring a retired definition to explain a retired
number. **That reasoning is right about the product and incomplete about the instrument.**

> **Decided: the cheap discriminator is the instrument revision, not the definition.** Record which revision of
> `gruen-rings`/`gruen-light` produced each of the two original readings. **If they differ, the residual is
> attributable to the instrument changing between runs and nothing further is owed.** If they are the same
> revision, a +0.019 on an unchanged instrument and an unchanged product is a real open item and it does not go
> away by the definition being retired.

That costs one `git log` and no measurement, and it distinguishes "we changed the ruler" from "something moved".
An unexplained delta five times the size of the only known cause is worth that much.

### A-G89 · PG-1 LIVE — the first *figure* two lanes have reached separately

| | 1920 | 1280 |
|---|---|---|
| GRÜN LIVE excl. rings | 0.64659 | 0.74241 |
| **PINK** (A-G58, the verdict) | **0.63857** | **0.73335** |
| agreement | **1.26 %** | **1.24 %** |

**On different carrier definitions and different masks, period-averaged over one full breath so the breath
cancels rather than being sampled at a phase.** GRÜN's earlier 0.541 / 0.616 was the resting field with two
carriers missing.

Beside PG-3, this is the second number two lanes reached independently and **the first where the agreement is on
a figure rather than on a bound**. What it licenses: confidence that PG-1's *measurement* is now
instrument-independent at the percent level. What it does not license: a second verdict. **PINK's 0.63857
remains the verdict; GRÜN's 0.64659 is a development reading that agrees with it** (A-G36 point 2), and the
agreement is evidence about the instruments, not about the pin.

A-G60 honoured in the exhibit rather than only the warning: parts 0.67289 against joint 0.64659 at 1920, parts
0.75463 against joint 0.74241 at 1280.

### A-G90 · A-G51 is WITHDRAWN — at L1 beams are drawn only for the marked body *(defect 50, and it is mine)*

GRÜN noted that *"L1 draws zero beams absent a mark"*, which contradicts PINK's L1 table (beams 19). **I read
`levelBeams` and the source is unambiguous:**

```
else if (view.level === "L1") { const marked = markedBody(state, model); if (marked !== null) for (const arc of marked.arcs) add(marked, arc); }
```

**At L1, beams exist only for the marked body. With no body marked, L1 draws zero.** GRÜN is right.

**And PINK's own numbers contain the explanation.** Its L1 table reads *beams 19* and *arcs 19 = 19* — the same
figure, because **`data-beam` is carried by the arc sign at `:386` as well as by the beam line at `:1004`.**
A `[data-beam]` selector matches both. PINK's nineteen L1 "beams" were its nineteen L1 **arcs**. It is the same
selector collision GRÜN found in PG-6, surfacing in a second lane's count, and neither lane had reason to
suspect it from the other's report.

**So A-G51's ruling rests on a contaminated count and is withdrawn.** I decided that *"PG-18 has no satisfier at
L1 … it is a build gap, not a property of L1,"* on the premise that nineteen relations were drawn without their
life. **Zero were drawn.** There is nothing at L1 for the travelling light to attach to, and G-3 is not
contradicted: a level that draws no relations is not a level drawing relations without their life.

**Restated: PG-18's lack of a satisfier at L1 is a scope question, not a build gap.** Either PG-18 declares the
levels it binds at — L0 and L2, where relations exist unmarked — or the L1 fixture marks a body, which makes L1
measurable without changing the product. **The fixture is the cheaper and more honest fix**, for A-G48's reason:
a pin should not be scoped away from a level because the fixture failed to reach the state the level is for.
**GRÜN is released from the "travel wherever a beam is drawn" instruction**, which would have been a product
change to satisfy a defect in a measurement.

This is the second ruling of mine this phase overturned by a lane reading the source (A-G62's mechanism was the
first), and both times the contaminating number came from a selector that matched more than its name suggests.
**A-G49 is now carrying three independent reasons.**

### A-G91 · The rung-count question, framed but not taken

GRÜN applied A-G81 to its own commit — **`shelf = 0.022` and `shelf = 0.025` are the same render**, both byte 6,
so its two trailing digits are fiction; it added `alphaRendersAs()` so any future alpha claim states its byte,
and it correctly **did not touch the ladder** pending PINK's limb (a) verdict.

It then offered a pre-verdict observation, explicitly not a proposal: the shelf is at 0.045 of the field, the
largest single ring term, **so it is both the least legible rung and the most expensive one.** If the answer is
three rungs, the measurements point at the shelf.

**That is correct arithmetic and I am framing the decision rather than taking it, because the trade is not the
one the numbers show.** The shelf ring is the only rung that marks a **semantic** boundary rather than a scale
gradation: horizon, best-fit and field are positions on `fitDistance`, while the shelf is the line between
*fits* and *shelved*, and A-G8's A1 already has shelf bodies straddling it. **So the shelf is cheapest in budget
and most expensive in meaning, and a rung count decided on budget alone would delete the one rung that is not a
gradation.**

**Three options go to PINK's verdict with the decision pre-framed:**
1. **Three rungs, shelf dropped** — the budget's biggest saving; the fits/shelved boundary then has no mark.
2. **Three rungs, a gradation dropped** (best-fit or horizon) — keeps the semantic boundary, costs less meaning,
   saves less budget, and makes `fitDistance`'s scale coarser.
3. **Four rungs, the shelf boundary carried by something that is not a ring** — the territory wash (A-G12) or a
   change in the medium already distinguishes regions, and a boundary marked by a change in ground costs no ring
   budget at all. **This is the option the numbers do not see and the architecture does**, and it is the one I
   would want costed before (1) is taken.

**I am not choosing. PINK's limb (a) verdict decides whether a choice is needed**, and if it is, GRÜN costs
option 3 first.

### GRÜN applied A-G85 to itself twice, unprompted

*"PG-6 clearing is a **new** reading, not a vindication of anything I argued, and the A-G86 non-reproduction
**contradicts** the anomaly I reported two messages ago rather than refining it. Neither is a result I
predicted."*

Recorded because A-G85 was written three sections ago about a lane declining credit for a conclusion that
survived its own correction, and it is now being applied by that lane to a result that **contradicts** its own
earlier report. **A rule that a lane turns against its own prior claim without being asked is a rule that has
been internalised rather than complied with**, and that is the only state in which these rules are worth
anything.

### Five items on one owner decision

GRÜN's count, and it is the argument: the test-database admin URL now blocks **A-G43's re-keying, A-G49's glow
and seat hooks, A-G48's L2 fixture, A-G51's L1 marked-body fixture, and the PG-20 mutant's execution.** Three
of the five are obligations I created. **Every one of them is a test or fixture change, and every one is held
behind a fail-closed database-isolation mandate that these tests do not need** — they open no database. GRÜN
is right not to step around it and I will not ask it to.
