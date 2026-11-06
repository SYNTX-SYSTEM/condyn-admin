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
