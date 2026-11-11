# PINK — INDEPENDENT VALIDATION STATEMENT
**Lane:** 🩷 PINK, the independent validation lane
**Date:** 2026-11-11
**Branch:** `validation/hr-decision-loop-pink` — **119 commits, UNPUSHED**
**Stand:** PINK's own, `127.0.0.1:3122`, commit `3ec8457d`, BUILD_ID `xCD8LBxdjnP97-2Gjs5yr`

---

## 0. WHAT THIS DOCUMENT IS, AND FOUR THINGS IT IS NOT

This states what this lane has and has not independently validated. It is written because
the architecture lane (GELB) relayed an owner mandate clause naming a fourth completion
condition — *"PINK hat den tatsächlichen Gesamtsystemstand unabhängig validiert."*

**IT IS NOT A SIGN-OFF.** No verdict on the build is given or implied.

**IT IS NOT AN ENDORSEMENT OF ANOTHER LANE'S RULINGS.** §6 lists where my measurements
qualify them.

**IT IS NOT A DEFINITION OF "GESAMTSYSTEMSTAND".** That term appears nowhere in the
record with a definition. GELB asked me to supply one. **I decline.** A validator that
sets the scope of its own completion condition can make any statement come out complete.
So §2 states the population I actually covered and **names the gap to the undefined term
as a hole rather than closing it.** If the owner means something wider, §2 shows exactly
where my coverage stops — which is what they would need in order to say it is not enough.

**AND IT IS NOT READABLE WHERE IT MATTERS.** This branch is unpushed. A validation that
exists only on one disk has the same defect as a figure quoted without its build, and it
would be absurd to apply that standard to others' figures and fail it silently here.
**This is a stated limitation of the deliverable, not a footnote.** The push is the
owner's standing decision and has been open since before this phase.

**PROVENANCE, stated because a validator should not take its requirement from the lane it
is validating:** I have only GELB's relay for the fourth condition's text. I have never
seen the mandate. I raised this with the owner rather than accept a peer's paraphrase as
my requirement. The work in this document stands on its own terms regardless of how that
clause reads.

---

## 1. THE INSTRUMENT BOUND — read this before any figure below

Everything validated independently here came from:

- **one stand** (`:3122`, one build at a time),
- **one browser** (Playwright's bundled Chromium, one version),
- **one default raster backend** — SwiftShader **software** raster, confirmed by CDP
  `SystemInfo.getInfo` (`rasterization: disabled_software`),
- **one verified backend contrast** — hardware raster on NVIDIA 940MX + Intel
  (`rasterization: enabled`, `gpu_compositing: enabled`),
- **two viewports** — 1920×1080 and 1280×800, at `deviceScaleFactor: 1` only,
- **an sRGB capture path with gamut clipping** (§49).

**No amount of pin coverage widens this bound.** One machine and two devices is not
"renderers in general", and this document does not claim it. **Untested and not asserted:**
another GPU vendor, another Chromium version, another OS compositor, any
`deviceScaleFactor` other than 1, and whether any delivery surface is wide-gamut.

---

## 2. THE POPULATION ACTUALLY COVERED, AND THE GAP TO THE UNDEFINED TERM

**BUILDS this lane measured on, with the shelf alpha each carries** (it moved three times
and the figures are not interchangeable — §36, §38):

| build | shelf alpha | what was measured there |
|---|---|---|
| `9cc06f84` | 0.05 | PF-8 per-class, pf8-lockin series |
| `ef466ca8` | 0.05 | PF8-TIP L0 / L2 |
| `3ec8457d` | **0.02** | all phase-G work, §10 and §27–§52 |

GELB's build is `4b83414e` (shelf 0.022) and GRÜN's `4b83414e`/`185427d5`. **Any
comparison across these crosses a constant change, and the alpha ratio is not the
luminance ratio** — α ×1.100 is luminance ×1.20888 (measured, §37/§38).

**INSTRUMENTS:** 74 scripts across 39 contract directories in this lane.

**THE GAP, NAMED:** this lane measured the **mapping decision field's pixel surface** and
the **test-database isolation boundary** (§32). It did not measure, and makes no statement
about: the HR decision loop's business logic, the career policy/promotion data model, the
API surface, deployment, performance, accessibility beyond luminance, or any lane's own
test suite. **Whether "Gesamtsystemstand" includes those is not mine to decide, and if it
does, this document covers a fraction of it and says so.**

---

## 3. INDEPENDENTLY VALIDATED — my stand, my instruments, my builds

**GUARDED BY A DEDICATED INSTRUMENT** (bound quoted from the pin, verdict in the output;
verified by opening each file, §51–§52): **PF-2, PF-6, PF-11, PG-17.**
**PARTIAL AND SAYING SO:** **PF-4** — limb 3 only, 0.32 path measured, 0.18 path out of
reach at L0.
**PF-3 LEFT THIS ROW IN §54.** Its instrument carries a bound and a verdict, but GELB
reports A-G20 retired PF-3 **having never been measured** — so an instrument that guards a
retired pin is not coverage of anything live. **That retirement is taken on report (§5):
`PHASE_G*.md` exists in none of the four worktrees this lane can read.**

**PG-1** (semantic light fraction ≥ 0.55 by suppression): **PASSES**, 0.6261 / 0.63857 at
1920 and 0.72348 / 0.73335 at 1280, both motion settings, disc-scoped.

**A-F8 CONFIRMED AT THE PIXEL** (§35): the shelf side's temporal range is **exactly zero**
at every offset in both viewports. **Qualified by GELB's correct downgrade:** the opaque
seat makes this unfalsifiable at that boundary, so it is evidence A-F8 is *structural*
there, not evidence it is *satisfied*.

**THE SEAM EXISTS AND IS RESOLVED** (§35, §42, §43): at ≥95% of sampled angles the ground
side exceeds the bare band's modal level (1.453105e-3), on in-region off-edge offsets,
both viewports — 9 of 9 cells at 1920, 7 of 9 at 1280, the two exceptions being samples
independently disqualified. **Its extent is NOT characterisable by this instrument.**

**THE RENDERER'S ALPHA QUANTISATION** (§38): α → `round(α·255)/255`, then the channel.
Swept **16/16**, and **8/8** at the points where it discriminates from naive rounding,
which scores **0/8**. Yields the plateau map: declared alphas collapse onto ~21 attainable
levels between 0.010 and 0.090, so **a constant change inside a plateau is a no-op in the
render.**

**THE MEASUREMENT CHAIN'S COLOUR SPACE** (§49): `Page.captureScreenshot` delivers sRGB
with gamut clipping, so the WCAG transfer function is applied in the right space. **This
had been an unexamined assumption under four phases of pixel work** — the knee at byte
10.0164, the per-pixel quantum, every share and swing. It is a **chain-level** assumption:
it holds for every figure or for none. **It holds.**

**THE TEST-DATABASE RESTORATION** (§32): role attributes read from `pg_roles` rather than
from the provisioning script's own assertions; B-ENTRY verified unbypassed from
`git status` and the running suite's environment, with all three documented escape hatches
unused.

---

## 4. RECEIVED AND CHECKED — another lane's claim, verified here

- **GELB's alpha-quantisation model** — swept against the renderer (§38). Its figure for
  the band at α 0.02 (L = 0.001453100) is confirmed at the byte; **its "six significant
  figures" is one bit deep** (§40), since both sides compute L from the same triple.
- **GELB's seat-edge mechanism** for the seam — confirmed by measurement, not reading:
  INK at 0.02 over the opaque seat predicts rgb(4,5,5) and over the stage plate
  rgb(7,10,13); **measured rgb(4,5,5)** at 77.6% / 76.8% modal (§40).
- **GELB's PF-11 claim about my own lane** — verified by opening the instrument (§52).
- **GELB's `cN==0` tier-C branch** — read from the committed source and shown to fire:
  shelfBand L0 is red at all four rungs while tier A is 1240× under bound and tier B p99
  is exactly zero (§46).
- **GELB's commit-ordering correction** — verified by `git merge-base --is-ancestor`, not
  by listing; my "oscillated" was withdrawn (§37).
- **GRÜN's threshold-crossing cause** — adopted; it supplies the mechanism for §33's one
  anomalous 66-pixel cell.

---

## 5. TAKEN ON REPORT — not verified here, and so marked

- **GELB's suite result** (3546 passed / 0 failed on `architecture/mapping-phase-f`). Its
  branch, its venue; GELB itself ruled it is not the system verdict. **Not inherited.**
- **GRÜN's mask-stability figures and its no-hide control.**
- **GELB's A-G62 derivation** and its vitest venue scan's internals.
- **The five mutants and PF-13** — GRÜN's, not run here.
- **Everything in the owner's mandate**, including the clause that asks for this document.
- *** THE A-G20 RETIREMENTS — PF-5, PF-7, PF-10 retired in favour of PG-10, and PF-3
  retired unmeasured. *** GELB cites `PHASE_G:725` and `:998`. **`PHASE_G*.md` and
  `PHASE_F*.md` exist in NONE of the four worktrees this lane can read**, so this is
  accepted on a peer's word and its line numbers are not verified (A-G430).
  **THE SYMMETRY, NARROWED IN §55 BECAUSE §54 OVERSTATED IT:** the two lanes'
  **instruments and outputs ARE mutually readable** — this lane read GRÜN's
  `gruen-pf13-evaluate.mjs` and GELB's `gelb-pointer-vacuity.mjs` with their outputs.
  **What is unreadable is narrower: the pin-DEFINING documents** (`PHASE_G*.md`,
  `PHASE_F*.md`) **in one direction, and this unpushed statement in the other.** So pin
  *definitions* and *retirements* are taken-on-report here, while peer *measurements* can be
  and were checked. **Still the strongest reason the unpushed branch is a defect in the work
  rather than an inconvenience — and §54's wider claim is corrected rather than left
  standing, since overstating one's own blindness is the same failure as understating it.**

---

## 6. WHERE MY MEASUREMENTS QUALIFY ANOTHER LANE'S RULING

1. **A-G412's ground.** GELB ruled the eight selected cells retired because the threshold
   carries no information. Measured: the band dominates the *light* and contributes *none*
   of the signal, so a correctly weighted statistic goes wrong harder. **Its remedy was
   right and its stated reason was the weaker of the two available** (§46).
2. **A-G382's licence.** GELB's proposed soundness condition is **met at 18 of 18 cells
   including both failures** — it would license exactly the two comparisons already found
   broken. The discriminating quantity is **purity**, not location strength (§44).
3. **A-G81's status.** GELB upgraded it to "a property of the sRGB compositing pipeline …
   across two colour profiles". **My colour-profile limb is zero-bit** — the flag changed
   nothing observable — so that upgrade is unsupported (§48).
4. **A-G450 applied to its own five.** GELB ruled that a name scan is wrong in both
   directions and then settled the five by that scan. **The five is "not NAMED by any
   guard", an upper bound on unguardedness** (§52).
5. **PF-8 tier C** is discontinuous at zero decoy: `cN=1,cS=1` passes at ratio 1.00 while
   `cN=0,cS=1` is red, and the signal count does not enter that branch at all (§46).

---

## 7. WHICH PIXEL FIGURES MAY BE RELIED ON — the regime split

**A figure's transferability is a property of its REGIME, not of its pin** (§47).

**TRANSFERS** (full-coverage / modal / interior — byte-identical across the one verified
backend contrast, eleven alphas): the plateau map and the quantisation model; the band's
level and the seat-vs-plate discrimination; the shelfBand tier A/B figures; §33's
swing-ratio confirmation on the halo interior.

**DOES NOT TRANSFER** (partial coverage / antialiased — up to **0.007302** per-pixel
luminance difference): the seam's edge readings; thin-stroke shortfall figures; **any p99
over a 2px stroke**, which includes the `ringStrokes` tier B; and by inspection any
thin-stroke ladder in any lane.

**BREADTH OF THAT EVIDENCE, CORRECTED** (§48): **one verified contrast, not six
configurations.** Five of my six configs report identical GPU feature status; only the
hardware-raster one differs. Colour management is **untested, and not testable by
screenshot here** (§49).

---

## 8. PIN COVERAGE — stated as TWO bounds, because one number is wrong in both directions

**UPPER BOUND ON COVERAGE** (§51): a venue count counts the places a guard *could* be.
Of thirteen candidates, opening each gave **4 guarded, 1 partial, 1 CONTESTED** (PF-10 —
a guard this lane stated and GELB dropped under A-G30), **1 ESTABLISHED UNSATISFIABLE**
(PG-18, F-G3: no satisfier at L1), **1 DECLARED NOT RUN** with its blocker (PF-9),
**2 incidental mentions only** (PF-5, PF-7), **3 named nowhere** (PF-13, PG-12, PG-19).
**`grep -l` cannot tell a guard from its obituary.**

**UPPER BOUND ON UNGUARDEDNESS** (§52, corrected in §53, §54 and §55): **GELB reports the
list is NIL.** PF-5 and PF-7 **retired**, PG-12 **unsatisfiable by any build**, PG-19
**killed before formation** (buried three times in GELB's own record), PF-13 **evaluated by
GRÜN**. **This is the most favourable possible outcome for the build, so §55 audited it
rather than accepting it** — by GELB's own A-G438, the favourable direction is the one that
gets no audit.

**VERIFIED FROM THE ARTIFACTS** (the evidence directories are readable from this lane, even
though the obligation records are not): GELB's `gelb-pointer-vacuity.out.txt` reads both
pointers complete and the instrument now **refuses rather than reports**; and every PF-13
figure is present and correct in GRÜN's `pf13-evaluated.json` — **16 files, 197 tests, 197
passed, coverage matched in both directions, zero missing, zero extra**, population derived
from `PHASE_DIRS` rather than listed.

*** BUT PF-13 IS NOT "CLOSED", ON ITS OWN INSTRUMENT'S WORD. *** Two qualifications in that
same artifact did not survive the relay:
- its `verdict` field reads, verbatim, **`"NONE — development reading only (A-G36 point
  2)"`** — GRÜN's instrument **declares that it returns no verdict**, and it was relayed as
  *"PF-13 IS CLOSED, BY GRÜN"*;
- and its `aG426` field states the evaluator *"reports the contradiction with GELB §116's
  wording rather than choosing quietly"* — **the exception is to UNCHANGED, not to PASSES.**
  GRÜN built the disagreement into its output deliberately; the relay carried the number and
  left the disagreement behind.

**Neither is a criticism of GRÜN**, which recorded both honestly where a reader of the
artifact would find them. GELB has since withdrawn "closed" and carried GRÜN's verdict
string verbatim into its report.

*** AND IT HANDED PF-13's CLOSURE TO THIS LANE, WHICH DECLINES TO ISSUE IT (§56). *** Three
grounds, none of them caution: **this lane did not run it** — verifying a figure in another
lane's output is not measuring a pin, which is the line §55 drew against GELB and it applies
here identically; **the instrument declares `verdict: NONE` under A-G36 point 2**, GELB's own
rule against reinstating an obligation on a development reading, and **an obligation cannot
be discharged on one either** — a lane accepting closure here would do with a green what
A-G36 forbids with a red; and **it is outside this venue**, PF-13 being a meta-pin over the
vitest population, needing the test harness and a disposable database, while this lane
measures pixels on a façade.

**WHAT WOULD DISCHARGE IT, so the declination is not a dead end:** GRÜN re-issues its
evaluation **with a verdict** — the figures are already there and only the verdict field is
missing — or a lane that holds the venue runs it and states one. **Neither is work this lane
can do; neither is blocked on anything but the decision to issue.**

**PF-13's FINAL STATE FROM THIS LANE:** population **derived** rather than listed; suite
**197/197** with coverage matched both ways and zero missing or extra; **no verdict by its
own instrument**; a recorded contradiction with its first relayed wording; **and no lane has
issued its closure, this one included.** A well-evidenced pin without a verdict — **neither
"unguarded" nor "closed"**, which is a real state and the honest one.

**PG-19's three burials and PF-5/PF-7's retirement remain taken on report** — they live in
`PHASE_G*.md`, which this lane cannot read. That is not the same
as unguarded: a guard that does not name its pin is invisible to a name scan, and GELB's
own PG-16 is guarded, unnamed, and found only by a mutant. **PG-12 left this list when
GELB re-read its own §36** — "PG-12 IS UNSATISFIABLE BY ANY BUILD", the hue's own chroma
being half the bound — so it joins PF-15 and PG-18 as established unsatisfiable, needing
no guard.

**THE MUTANT TECHNIQUE IS CONFIRMED IN THIS LANE AND NEEDS NO BUILD** (§53).
`pink-p4-mutants.mjs` and `pink-static-mutants.mjs` prove P-2, P-4, P-5, P-6 and P-11
red-first by faithful runtime injection, with one mutant honestly recorded as surviving;
and §53 re-ran the technique on phase G with every injection verified by read-back.
**MUT-PF5-DEPTH0 IS KILLED** — the share falls 0.0492 → 0.0103 and the median swing
3.0053e-4 → **exactly 0** — so a PF-5 guard demonstrably fires.

**BUT TWO OF THE FOUR DID NOT DISCHARGE, AND NEITHER FAILURE IS THE BUILD'S:**

- **PF-5 was RETIRED, and the mutants found something better than the pin.** GELB confirms
  both of PF-5's texts say "disc pixels" verbatim, so the relay was accurate and my error
  was measuring a retired pin, not trusting a denominator. **And on this lane's own
  figures the bound exceeded its attainable ceiling:** the glow mask is 36268 px =
  **6.650 %** of the 545417-px disc; 26822 disc pixels clear the 0.004 swing = **4.92 %**
  of the disc and **73.96 %** of the glow, the same order as PF-5's historical green of
  0.647; and the bound was **25 % of DISC pixels — 3.76× that ceiling.** The median disc
  swing is **one quantum** against a **13.3-quantum** threshold, so the ground cannot
  reach it and the glow is the only population that plausibly can: **even if every glow
  pixel swung, the disc share would be 6.65 %.** *** So PF-5 was unsatisfiable as written
  — the PG-12 shape — and went green for four phases because the instrument used a
  denominator the pin did not name. *** Established on 3ec8457d at 1920; **not proven for
  all builds and not claimed.**
- **PF-7 was also RETIRED — and its hazard is a live structural fact.** It is **NOT
  MEASURABLE by a per-pixel phase fit**, for a reason in the source: `:876`
  draws all seven ground layers at the **same radius**, so the radial structure is in the
  gradients while the 1.2 s stagger is per-layer. Every pixel superposes all seven, and
  one fit returns one blended phase — baseline spread 45 ms against a 1200 ms bound, and
  **zeroing the lag raised it to 88 ms.** It needs per-layer isolation, which is a
  different instrument. **GELB checked whether the hazard reaches PG-10, PF-7's
  replacement, and answered that it does not: PG-10 measures the glows, each body's halo
  is a spatially separate element with its own delay, so there is no superposition at a
  pixel.** The hazard is specific to the ground's co-radial layers.

**PF-13** has no evaluator at all (its population was read by hand) and is a meta-pin no
render mutant reaches; **PG-19** is disjunctive and needs a per-mark limb breakdown before
a mutant means anything. Both remain open.

---

## 9. WHAT THIS LANE COULD NOT VALIDATE, WITH THE REASON IN EACH CASE

| item | reason |
|---|---|
| `rings` tier B, old red (4.01 / 10.62) | taken at shelf α 0.05, not convertible; re-taken at 3ec8457d and the **strokes' half is not backend-independent** (§47), so **unresolved on an instrument that cannot resolve it** |
| PF-8's three tiers, full form | behind GRÜN's fixtures; the travel class is owed as a **build** via §33's isolation, not as a disclosure |
| The seam's spatial extent | **not characterisable** by this instrument: no location statistic inside (165–219 distinct triples, modal share ≤0.201), lattice-valued step, and the nearest-boundary offset is an edge read (§42) |
| PF-5, PF-7, PF-13, PG-12, PG-19 | not named by any guard; two testable here, three lack statements (§52) |
| PF-10 | its guard was stated here and dropped by GELB; GELB has since re-stated it as a resolution condition — **not measured by this lane** |
| The docker bridge path (`172.17.0.2`) | needs `sudo iptables -S DOCKER`; **a privilege neither lane holds.** Published port proven loopback-only on two instruments (§32) |
| Wide-gamut appearance | the capture is sRGB by construction (§49) — **not testable by screenshot here** |
| Everything outside the mapping pixel surface and the DB boundary | see §2's named gap |

---

## 10. WITHDRAWALS BY THIS LANE DURING THIS PHASE

Recorded because a validation lane's retraction list is part of its evidence, not an
embarrassment beside it: §27's and §10's limb-1 figures (whole-clip floor was an
extreme-value statistic); the blur-sign claim; §18's population thresholds; §30's
"convergence" (a crossing, not a convergence); §35's seam profile and the step-vs-ramp
inference it carried; §36's "oscillated" and its 2.316× ratio; §36's claim that a
production build was needed; §46's new `ringStrokes` red; §47's "six configurations" and
its colour-management limb; and §53's three instrument defects — a span declared at two
periods that ran at 3.17–3.53, an amplitude floor set at `median × 0.5` that admitted half
the pixels by construction, and a no-signal mutant that still reported 431972 pixels
"carrying signal".

**Each was found by one of the three lanes auditing another's divisor, dividend, support,
estimator or scope.** Two figures in this exchange moved *upward* and **both needed an
audit neither author gave** — the mechanism, not the count, is the finding.

---

---

## 11. HOW THIS CONDITION STANDS, REPORTED BY THE OTHER LANE

GELB's consolidated closing report is committed and pushed at `9b07d616`. This lane cannot
verify its contents — `PHASE_G*.md` remains unreadable here.

*** IT DOES NOT REPORT CONDITION 4 AS SATISFIED. *** Its terms: this lane's validation
**"exists, is good, and cannot be read by anyone but you."**

**That is the concrete cost of the unpushed branch, and it is stated by the lane writing the
closing report rather than by the lane that wants the push.** The decision is the owner's and
this lane has not asked for it again. It is recorded here because a reader of this document
should know that the document's own existence does not discharge the condition it was written
for — **and that the reason is readability, not content.**

---

*PINK. Validation only — never implementation, never integration. No merge, no push, no
production deployment. Gemini disabled throughout.*

*Thirty-odd sections of this phase ended in a withdrawal, a declination, or a figure handed
back smaller than it arrived. That is what the lane is for.*
