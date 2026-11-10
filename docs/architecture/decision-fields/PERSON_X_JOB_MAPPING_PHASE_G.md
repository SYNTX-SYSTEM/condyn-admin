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
