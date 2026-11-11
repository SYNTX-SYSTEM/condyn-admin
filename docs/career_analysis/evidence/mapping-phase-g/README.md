# PERSON × JOB MAPPING · PHASE G · GRÜN'S **DEVELOPMENT** INSTRUMENT

> ## THIS INSTRUMENT RETURNS NO VERDICT
>
> `PERSON_X_JOB_MAPPING_PHASE_G.md` **§17 A-G36 point 2**: GRÜN's instrument produces **development
> readings** only. They may enter an engineering record as GRÜN's own measurement with the script and its raw
> output committed (**A-G35**), and they may **never** constitute a pass, a GO, or grounds for closing a pin.
> Self-certification stays invalid.
>
> **The verdict is PINK's**, in `mapping-phase-g-contract` on `validation/hr-decision-loop-pink`.
> No output in `outputs/` contains the words pass, green or ok. Every bound appears as
> `…_boundForReference`, never as a comparison result.

> ### §110 · AND THE BANNER'S SCOPE IS `outputs/`, WHICH IS NOT WHERE THE VERDICT LEAKED
>
> **Both PF-13 instruments declare `verdict: "NONE — development reading only (A-G36 point 2)"`, and they
> mean it.** The leak is in prose this banner never covered: **commit `b63b6368`'s own subject line reads
> *"PF-13 green on all 15 files"*,** and relay messages from this lane said *"PF-13 is GREEN"* repeatedly.
>
> *** THE INSTRUMENT REFUSED THE VERDICT AND THE SUMMARY ISSUED IT. *** A-G374's second limb, in the text
> that travels furthest: a commit subject outlives a JSON field, is read by people who never open
> `outputs/`, and cannot be corrected in place. GELB withdrew *"PF-13 is closed"* for exactly this reason —
> **PINK caught it because it was the most favourable possible outcome for the build** — and the same
> sentence was in my prose first.
>
> **The correct form, and the only one this lane may state: the PHASE_DIRS population passes — 16 files,
> 197 tests, 0 failed, coverage matching the population in both directions, verdict read from vitest's JSON
> reporter. PF-13 is GUARDED, not CLOSED. Its closure is PINK's to issue.**
>
> Recorded here rather than only in a commit message, because a note written where the defect was *noticed*
> is not written where a reader *arrives* — which is the lesson A-G453 taught in GELB's lane an hour before
> it applied to mine.

> **§110c · the scan done systematically, because finding one hit by grepping for one phrase is not a scan.**
> GELB ran theirs over all 208 of their commit subjects and it returned one. Over this lane's 26: **four
> hits, classified at the precision the evidence supports and no higher.**
>
> | subject | the claim | disposition |
> |---|---|---|
> | `b63b6368` *"PF-13 **green**"* | a pin's satisfaction | **THE DEFECT.** Reserved to PINK by A-G36 point 2 |
> | `fd45f45f` *"A-G43 implemented and **PROVEN**"* | an amendment addressed to THIS lane; *proven* = the mutant binds, verified by reverting the predicate | defensible; the wording is stronger than the claim |
> | `337acf4d` *"PG-15's **absence closed**"* | this lane's own work — an assertion added where none existed | defensible; a hasty reader compresses it to *"PG-15 closed"*, which would be a verdict |
> | `7434aa78` *"a digest I had been carrying **unverified**"* | a confession | clean |
>
> **One real hit in 26.** The comparison that stood here against *"GELB's one in 208"* is **WITHDRAWN — see §110d.**
>
> ### §110d · the comparison above rested on a peer's figure I did not check, and it has been withdrawn
>
> GELB reported *"one hit in 208"*. **Their scan was piped through `head -40`: the denominator was FORTY.**
> Re-run over all 209 subjects it returns **43 hits — 3 pin-verdicts, two of them unqualified**, including
> *"PG-1 PASSES (0.639 / 0.733)"* in capitals with the measured figures. **So the asymmetry reverses: two
> unqualified pin verdicts there against one here, and theirs states PASSES with the numbers.**
>
> *** AND THE PART THAT IS MINE: I HAD BEEN VERIFYING THIS PEER'S CLAIMS ALL DAY AS A MATTER OF COURSE —
> their "phase C" was phase D, their `:365`/`:950` were +20 stale, their "PG-20 is owed" was already done —
> AND I TOOK THIS ONE WITHOUT CHECKING. *** The reason is worth naming, because it is a direction of A-G429
> neither lane had:
>
> > **The figure produced a conclusion AGAINST ME, and a conclusion against yourself feels like rigour, so
> > the number that assigns it gets no audit.** A-G429 says a detector's false positive feels like the
> > instrument working. This is its reflection: *accepting blame feels like discipline*, so a peer's figure is
> > least examined exactly when it is unflattering to the receiver. **I could not have re-run their scan —
> > it is their repository — but I could have recorded the figure as THEIRS-UNVERIFIED instead of building a
> > cross-lane conclusion on it, which is A-G140 in a borrowed number.**
>
> **What stands unchanged:** `b63b6368` is a real defect of this lane's and §110's correction holds; the two
> defensible subjects stay defensible with their wording criticised; the four-hit classification is this
> lane's own work and was taken from nobody. **Only the comparison is withdrawn, and with it the claim about
> which half is heavier.**

Lane: 🟢 GRÜN · worktree `condyn-admin-mapping-d` · branch `frontend/mapping-phase-g`.
Authority: `PERSON_X_JOB_MAPPING_PHASE_G.md` §16–§19 (A-G26 … A-G47) on `architecture/mapping-phase-f`.

---

## 1 · Why this exists

A-G36 point 1, in GELB's words: *"Phase F's stage was rejected after everything passed; a lane that cannot see
its own field is the cause."* Phase G's twelve new pins were written against **one** instrument and four of
them could not bite. The strength of phase F was never PINK's instrument — it was the **disagreement between
two**. So the split is **asymmetric**: two instruments, one verdict.

| lane | instrument | output |
|---|---|---|
| 🟢 GRÜN | this directory | development readings — see whether a change moved the number **before** delivering |
| 🩷 PINK | `mapping-phase-g-contract` | **the verdict** |
| 🟡 GELB | retired (A-G36 point 5) | adjudicates on the two lanes' committed numbers |

**Divergence between GRÜN's readings and PINK's is a FINDING to report, not to reconcile** (A-G36 point 4).
The precedent is PF-8's beams — PINK FAIL 0.0022 against GELB's 0.00072 passing, a 3× split that was a mask
definition difference, promised a resolution and never given one. Every script here therefore names its own
**definitional choices** in its output under `definitions`, and carries a `pinkComparison` block where a PINK
reading exists. Silent agreement after a quiet adjustment is the mechanism defeated.

## 2 · Methods inherited from PINK (A-G36 point 1)

From `evidence/mapping-phase-f-contract/scripts` (PINK's, committed, manifest 43/43):

- per-class masks built **under `reducedMotion:reduce`**, so the breath never enters a mask;
- **differential** measurement (a class's mask is the pixels its own light reaches, threshold 0.001);
- **mask-based** suppression rather than hide-and-reveal (defect nineteen: suppression does not isolate the
  medium, because the medium is partly underneath);
- the **bracketed, dof-matched null** — harmonics {0.1, 0.2, 0.3}, raw null freqs {0.05, 0.15, 0.25, 0.35},
  each harmonic's null the RMS of its two ±0.05 brackets, so the null is spectrally **centred** on the signal
  and carries the **same** degrees of freedom (§27 / A-F17, after GELB and PINK found a shared false-red);
- one **joint LSQ** of DC + 7 frequencies over a long, naturally jittered window — never a short uniform DFT,
  which aliases on this machine's ~0.6–1.3 s screenshot cadence and inflates the null to ≈ the signal;
- the **window rule** ≥ 2/(0.7 · Δf) ≈ 57 s with Δf = 0.05 Hz (PINK's refinement of A-F21: the 70 % self-check
  is itself resolution-limited);
- the **adequacy guard** — the highest fitted frequency must stay below 0.9 × Nyquist, or the run says it is
  inadequate instead of returning a number (this guard caught a false red in phase F);
- the **overlay / scrim abort**: the element under the field centre must belong to the svg, or the run aborts;
- `deviceScaleFactor: 1` so one screenshot pixel is one CSS pixel;
- **decode deferred** — the capture loop only captures; sharp decoding happens afterwards, or the cadence
  degrades and under-samples.

### What is new here, and why

| addition | reason |
|---|---|
| `glows` as a first-class mask class | **A-G36 point 3**: A-G10 pin 7 moved the glow **out of the medium** into `mapping-glows`. No PF-8 mask has ever held it — the *methods* survived phase F, the *masks* did not. |
| two render modes, `travel-masked` / `travel-drawn` | **A-G42**: A-G13 made the travel's period exactly the breath's, so the travel's coherent energy lands on the **same harmonics** the firewall uses. PF-8 and PG-11 therefore need mutually exclusive renders, and neither may reuse the other's frames. Supported from the start rather than retrofitted. |
| the **engraved minimum** statistic | **A-G45**: per angle the radial peak, then the **minimum over 720 angles**. A max over a ring band measures a **body crossing it** — PINK's shelf once read 0.58 that way. |
| per-body **local** ground | the §13 lesson: a statistic written for one ground reads differently on another. The glow carrier is defined against each body's own surround, not a disc-wide median. |
| **emitting / occluding** class declaration | **A-G55**: a semantic element that *removes* light cannot be scored by a light-removal difference. Each class is declared, occluders are excluded with the exclusion recorded per run, and the measured sign is checked against the declaration — a mismatch is emitted as a finding. |
| the carrier is the **breathing** glow | the shelf is a still ring (A-F8), so a shelf glow cannot swing by design. Mixing it into PG-10's carrier counts a pixel that cannot swing in the denominator of "fraction of pixels that swing". |
| provenance block in every output | **A-G47 point 3**: PINK must *check* the input, not trust it. |

## 3 · What is measured, and what is deliberately not

Measured (the list GELB left to GRÜN in §17's standing instruction, as amended by §18):

| reading | script | note |
|---|---|---|
| the run's **own static floor** | `gruen-floor.mjs` | A-F11 — every run carries its own floor, because a bound below the floor is not a bound |
| **PG-1** semantic share of the field's light, with per-class attribution | `gruen-light.mjs` | rings excluded from "semantic": PINK's finding is that the scaffold out-lit the subject |
| **PG-6** relations' share of the **semantic** light | `gruen-light.mjs` | denominator is the semantic light, not the field's |
| **PF-15 inverted**, limbs (a) budget and (b) ladder, **jointly** | `gruen-rings.mjs` | A-G34 joint satisfiability · A-G45 engraved minimum |
| **PG-3** rendered drawn-body diameter | `gruen-bodies.mjs` | measured two ways (model × scale, and the shape's own rect) because they can disagree — that gap *is* the frame widening |
| **PG-10** limbs 1 and 2 on the visible glow | `gruen-glow.mjs` | `travel-masked` mode |

**Not measured, and why — each on instruction:**

- **PG-2** — restated by A-G27; its old form was cleared 4.13× by `rgb(3,5,8)`'s own luminance (0.0014543).
  GELB's standing instruction: do not build against it.
- **PG-10's max-swing limb** — **withdrawn** by A-G26. PINK's committed `noise-floor.json` records
  `swing_max = 0.031872` under `reducedMotion:reduce` with nothing animating, above both the 0.030 ceiling and
  the 0.0297 reading. By A-F11 it was never a bound. **A-G37: do not attempt to reproduce 0.0297.**
- **PG-13** — ratio limb **retired** by A-G29 as non-discriminating (green-by-coincidence at 12–50× on the very
  stage OTTAVIO rejected). A-G7's multi-channel presence obligation is **unmet**, not met.
- **PG-21** — restated by A-G28/A-G46 as pre-and-post with a **required mutant** plus an absolute limb at
  PINK's Q-F6 anchor (8.92e-3). The mutant is the proof, and a mutant build is a product change, not a reading.
- **A-G26's replacement ceiling** — needs p999.9 on **co-registered** frames. Co-registration exists in
  neither lane's instrument and A-G26 calls it *"a prerequisite, not an assumption"*. `gruen-glow.mjs` emits
  `swing_p9999_uncoregistered` as **material only** and says so in the same object.
- **PG-11** — needs the `travel-drawn` mode in a separate pass with an explicit attribution rule, and returns
  INCONCLUSIVE unless the medium's coherent energy is ≥ 0.0002 in its own right (A-G30's guard). The mode is
  built; the pass is not run here.
- **PG-22 occupancy** — A-G44 restated the bound **per body, share ∝ 1/r_drawn** against each body's own drawn
  radius, 20 % anchored at 1920; the fixture-mean 1.86× form is withdrawn. Not in this round's scope.

## 4 · The baselines are void — these are first measurements

**A-G41 (defect 28).** `DISC_OCCLUSION` and `BODY_BUDGET` are **absent at `93c47e03`** and present at
`10eb4030`, with exactly one commit between them, while §12 — the four reds — is `39d50bae` at 10:59 and
`10eb4030` is 11:30. So **PG-1 0.42, PG-6 0.025, PF-15-inv 0.23 and PG-3 54 px were measured on an uncommitted
working tree that no longer exists.** Not merely unreproducible: **void**.

Consequence for this instrument, stated in every affected output under `priorBaseline`:

- there is nothing to tune *toward*, because the starting value is unknown;
- **A-G45** additionally forbids treating the shelf band's area as the proven cause of PF-15's red until the
  statistic is corrected to `min()`;
- A-G39(a)'s stale `RING_LUMINANCE` comment is corrected **only** once `gruen-rings.mjs` has produced the
  shelf's real rendered luminance — GELB's instruction is explicit that an invented number would be worse than
  a stale one.

## 5 · Running it

```bash
cd /home/codi/Entwicklung/condyn-admin-mapping-d
npm run build                                                   # PRODUCTION build — see §6
npx next start --port 3221 &                                    # GRÜN's prod port
node_modules/.bin/tsx docs/career_analysis/evidence/mapping-phase-g/scripts/gruen-facade.mts &   # façade 3220 → 3221
bash docs/career_analysis/evidence/mapping-phase-g/scripts/run-all.sh 1920x1080 1280x800
```

Ports are GRÜN's alone: **façade 3220 → prod 3221**. GELB's `:3020` and PINK's `:3120/:3121` are untouched, and
`:3017` (the DLL owner demo) is **not** started — §18 records that `condyn-admin-dll-runtime` @ `32c63c2b` would
serve code twelve commits behind `main`, so restarting it is not a no-op.

Playwright is **not** a dependency of this repository (the established project rule): it is reached through
`CONDYN_PLAYWRIGHT_MODULE`, defaulting to `/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs`.
That dependency is a recorded **HIGH integrity risk (I-2)** — unversioned, outside the repository, one
`node_modules` deletion in an unrelated project away from rendering the proof stand unrunnable. `sharp` is a
real dependency of this worktree and is resolved from its own `node_modules`.

### Why a production build, not `next dev`

Standing finding, re-confirmed: **Turbopack dev does not hydrate headless.** Every pixel reading needs
`next build` + `next start`. A-G47 point 1 lifted the no-build constraint for exactly this: GRÜN builds its own
tip in its own worktree, PINK's `93c47e03` build (`BUILD_ID YUIyV6i0VG5cALibnbi58`) stays untouched.

## 6 · Provenance PINK should check rather than trust (A-G47 point 3)

Every output carries a `provenance` block: worktree, `HEAD`, branch, tree-clean, the served `.next/BUILD_ID`,
and the timestamp.

**Two deviations from A-G47 point 3, named here rather than hidden.** That clause asks PINK to assert
`rev-parse HEAD == 3ec8457d` with a clean tree. Neither half survives contact, for reasons that are
themselves instructions:

1. **A-G35 obliges this lane to commit its instrument**, so HEAD necessarily moves past `3ec8457d`; leaving
   the instrument uncommitted to keep HEAD still would violate A-G35 instead.
2. **A-G43 obliges this lane to re-key PG-20's splay onto the relation state**, which is a change to product
   source. The tip is therefore `3ec8457d` **plus that correction**, and pretending otherwise would hide a
   product change from the lane that has to measure it.

So the measured tip is **not** `3ec8457d`, and the honest provenance is the exact distance from it. What PINK
should check, in place of the literal clause:

```
git -C condyn-admin-mapping-d rev-parse HEAD            # the tip named in the run record
git -C condyn-admin-mapping-d status --porcelain         # empty
cat condyn-admin-mapping-d/.next/BUILD_ID                # equals the run record's buildId
git -C condyn-admin-mapping-d diff --stat 3ec8457d HEAD -- app lib test docs/architecture \
      package.json package-lock.json next.config.ts      # EXACTLY the A-G62 hunk — see below
```

### What the delta actually is — §62 correction

**This section described a product state that does not exist, and it was the one section written to be
independently checked.** It claimed the delta was "two files and nothing else": an A-G43 splay re-keying plus
a new `test/career/mapping-field/field-g-mutant.test.tsx`. Neither is in the tree. PINK running the command
above as it was written would have found a mismatch and been right to.

**§104 CORRECTION, AND THIS TABLE HAD GONE STALE TWICE OVER.** It read "one file, one behavioural hunk, and
eleven added attributes" — true when §62 wrote it and false from §86 onward, because §86 rewrote the frame
solver. §104 then added a second product predicate and a new test file. This is the section written to be
INDEPENDENTLY CHECKED by PINK, and it is the second time it has described a product state that does not exist,
so the figures below are now produced by `git diff --stat 3ec8457d HEAD` rather than carried in prose:

| | |
|---|---|
| **files** (outside this evidence directory) | **FOUR.** `PersonJobMappingField.tsx` · `test/career/mapping-field/architecture.test.ts` · `test/career/mapping-field/field-g-mutant.test.tsx` (new) · `test/career/mapping-field/neurovisual-e.test.ts` |
| **behavioural changes in the component** | **FOUR.** §86's `frameWithBodies` rewrite with `FRAME_EM_PER_CHAR` / `FRAME_PASS_CAP` · `RING_LUMINANCE.shelf` **0.02 → 0.022** (§23 **A-G62**) · §104's splay re-keying (**A-G43**) · §93's deletion of the dead `MOTION.breath` (**A-G406**, zero render-path readers, proven by `tsc`) |
| **§81 A-G49's hooks** | **eleven added `data-*` attributes.** `data-mapping-halo` / `data-rank` / `data-shelf` / `data-required-gaps` / `data-halo-radius` on the halo's drawn **circle** (not its group), and `data-mapping-seat` naming the seven previously unaddressable seats plus the two body seats and the arc-marks group. |
| everything else in the diff | comment-only — the `GLOW_RAMP` and `G-2` rewrites of §45/§47/§51, and §62/§81's corrections |
| **A-G43's splay re-keying** | **APPLIED AND PROVEN (§104).** The splay now reads `arc.state === "DIFFERENT"`. It was held out of the tree for the whole phase because a re-keying is unverifiable from a rendered page — React keys are reconciliation inputs and never reach the DOM — so it was gated on vitest, and vitest was gated on B-ENTRY. **B-ENTRY was restored in this lane in §93**, which is the only reason this row changed. |
| **the A-G43 mutant test** | **EXISTS AND BINDS.** `test/career/mapping-field/field-g-mutant.test.tsx` mocks the sign table with DIFFERENT's mark set to `"none"` and asserts the splay remains. **It FAILS on the mark-keyed form** — verified by reverting the predicate and re-running, not asserted: DIFFERENT's end lengths read 9.994517 / 9.994913 against a radial reference of 9.994517, so the splay was exactly zero. A mutant that passes on both forms proves nothing. |

**The hooks are additive and that is proved, not asserted.** Strip every `data-*` attribute and every comment
from the base and from the working tree and the only remaining difference is the single `RING_LUMINANCE` hunk;
`tsc --noEmit` exits 0. The exemption is *conditional* and the condition is checked — this component already
styles `[data-lit="false"]`, `[data-in-pool="true"]` and `[data-mapping-body]`, so "an added attribute cannot
move a pixel" is false in general. Zero of the file's 24 CSS attribute-selector rules match any of the four
newly-added names, and `scripts/gruen-seal-staleness.mjs` re-checks that on every pass rather than trusting it.

**The hooks are NOT on the build currently serving**, which predates them. PINK's independent verification of
them needs a rebuild; that is the owner's call and has not been taken.

`lib/`, `docs/architecture/`, the dependency set and the Next config are byte-identical to `3ec8457d`.
A-G43 remains an obligation on this lane, not a completed one; it is item 1 of GELB's §62 implementation list.

**On the readings' build state.** The claim that every reading "was taken on a build compiled from the
committed tip, so the served artifact, the commit and the readings are one state" is now too strong: the
eight sealed readings were taken 22–24 commits back, because A-G109 keeps the sealed probes out of a routine
pass so a pass cannot overwrite a seal. That protection also removed the only thing that would have noticed a
seal going stale, so `scripts/gruen-seal-staleness.mjs` now audits every seal against HEAD on every pass —
exactly, by comparing the twelve named product constants at the seal's own commit and at HEAD, and by
comparing the product file with every comment stripped. At HEAD `4b83414e` all eight seals are **VALID**: the
product file moved only in comments since each was taken. The audit carries a self-test that makes it fire on
A-G62's known `RING_LUMINANCE` move, so it cannot quietly degrade into always-VALID.

The earlier shakedown pass — which proved the instrument runs end to end against a build of the pure
`3ec8457d` product — is **not** committed, precisely because the worktree was not clean while it ran and a
reading whose provenance is ambiguous is worth less than no reading.

PINK's `93c47e03` build (`BUILD_ID YUIyV6i0VG5cALibnbi58`) is untouched (A-G47 point 2). If PINK wants a
build of the pure `3ec8457d` product rather than of this tip, this lane can produce one on request; it has not
done so unasked, because that would put a third production build on the machine.

## 6b · TWO STANDS · §82, the additive build

The A-G49 hooks needed a build; the eight sealed readings needed their build kept. Both, rather than either:
the hooked build is a **second worktree on its own loopback ports**, and nothing belonging to the first was
written to. Verified afterwards, not assumed — the preserved `BUILD_ID` file was not even re-dated.

| | **preserved stand** | **hooked stand** |
|---|---|---|
| worktree | `condyn-admin-mapping-d` | `condyn-admin-mapping-d-hooks` (detached at the same commit) |
| `BUILD_ID` | `HRYkeEpbpndI3UEE7ceeC` — never rebuilt | **`TKZRoMo0_1Ro-svJrokkW`** at `fb4632da` (was `UTiHc2G2tn-Nh1fyJ6vFH` at `47e34329`) |
| carries A-G49's hooks | **no** — predates them | **yes** — 4 `data-mapping-halo`, 30 `data-mapping-seat`, 3 each of `data-halo-radius` / `data-seat-is-group` in the compiled bundle |
| prod server | `127.0.0.1:3221` | `127.0.0.1:3231` |
| fixture façade | `127.0.0.1:3220` | `127.0.0.1:3230` |
| façade log | `outputs/facade.log` | the hooked worktree's `outputs/facade-hooks.log` |
| what it is for | the eight `SEALED-*` readings and every figure quoted from them | the CURRENT source: PINK's independent verification, and any reading that needs the hooks or the §86 frame |

**The current stand is rebuilt as source moves; the preserved stand never is.** That asymmetry is the whole
arrangement: a sealed figure belongs to a build (A-G54), so the build it belongs to is kept, and the stand
that tracks HEAD is allowed to move. Each rebuild re-runs `gruen-hooks-verify` and `gruen-fixture-states`
against the new `BUILD_ID`, so no committed reading cites a build that is no longer on disk.

> **§86 CONSEQUENCE, AND IT IS THE LARGEST ONE SO FAR: the eight sealed readings are now STALE against HEAD.**
> `gruen-seal-staleness.mjs` reports 8 stale at `fb4632da`, and it is right — PG-14's new solve changes the
> emitted `viewBox`, so it changes `k`, so it changes every rendered size on the page. The seals remain
> exactly reproducible against `HRYkeEpbpndI3UEE7ceeC`, which is why that build is preserved; they no longer
> describe current source. **Any figure quoted from them must now name the build.** Re-sealing is a
> deliberate act on a deliberate build and has not been done.

### §96 · the seals' BYTE integrity, with the formulation that checks it

Staleness and integrity are different questions and only the first had a mechanism. `gruen-seal-staleness.mjs`
answers "do these readings still describe current source"; nothing recorded "are these the same bytes". The
authoritative check is git, and it is cheap:

```bash
git log --oneline <last-known-good>..HEAD -- outputs/SEALED-\*.json   # must print nothing
git diff --stat HEAD -- outputs/SEALED-\*.json                        # must print nothing
```

**WHY THIS IS WRITTEN DOWN AT ALL.** This lane carried an aggregate digest for the eight seals
(`420bd3a826cdbbbc0c692c1dc15c5c03`) across sessions as if it were verified. At §96 it reproduced under NONE of
four formulations — concatenated contents, `md5sum` lines, sorted hashes, git blob ids — and the string appears
nowhere in `outputs/`, `scripts/` or this file. It was a number without its derivation, carried forward as
though checked: A-G140's defect class, committed by the instrument's own author against the instrument's own
record. The figure is **WITHDRAWN**. The seals are intact, and that is established by git above rather than by
the withdrawn digest.

So the digest is recorded here per file, which needs no formulation to be checkable:

| seal | md5 |
|---|---|
| `SEALED-pg11-ratio-L0-1280x800.json` | `636d2256b6ac65440218efc752872ffb` |
| `SEALED-pg11-ratio-L0-1920x1080.json` | `2b12adc5ede285ae76bb04d59e0b20f5` |
| `SEALED-pg11-ratio-L2-1920x1080.json` | `ea4b34f601d263c501bcb909822960c6` |
| `SEALED-pg12-ratio-1280x800.json` | `32536398ebbf0920250e3c977c25ea4d` |
| `SEALED-pg12-ratio-1920x1080.json` | `0f04567d30a0359567fadfa3f438854e` |
| `SEALED-pg17-L0-1280x800.json` | `224398e0600441c712bc0ea659b65c75` |
| `SEALED-pg17-L0-1920x1080.json` | `a0f091a6157fa1411db5182152e30bc4` |
| `SEALED-pg17-L2-1920x1080.json` | `d906c06269149382a73185722c42c783` |

Aggregate, **with its formulation named** so it can be reproduced rather than trusted —
`md5sum outputs/SEALED-*.json | awk '{print $1}' | sort | md5sum`:

```
7fbc281dd2e89ceb10009bb6f27604d8
```


**All four ports are bound to `127.0.0.1` and nothing else.** `next start` binds `0.0.0.0` by default and the
first attempt did; it was found, released and rebound, and the LAN address now refuses. GELB's `:3020`,
PINK's `:3120`/`:3121`/`:3123` and the DLL demo's `:3017` are untouched.

```bash
# read the hooked stand from the ORIGINAL evidence directory, so all output stays in one place
GRUEN_BASE=http://127.0.0.1:3230 GRUEN_WT=/home/codi/Entwicklung/condyn-admin-mapping-d-hooks   node docs/career_analysis/evidence/mapping-phase-g/scripts/gruen-hooks-verify.mjs
```

`GRUEN_WT` is new in §82 and names the worktree whose `BUILD_ID` and git state the provenance block records.
It defaults to this worktree, so **every existing reading is unaffected**.

**Why a second worktree rather than `distDir`.** Next 16 has no `--distDir` flag, so building elsewhere means
editing `next.config.ts` — a tracked file the provenance check asserts is byte-identical to `3ec8457d`. A
worktree changes nothing in the repository. One wrinkle, recorded because it cost a build: Turbopack rejects a
**symlinked** `node_modules` (*"points out of the filesystem root"*) and **exits 0 while producing no build**,
so the first attempt looked successful and had written nothing. `node_modules` is a real copy. An exit code is
not an artifact.

## 6a · Readings this instrument has SUPERSEDED, and why

A-G35 makes a committed number a standing claim, so the ones this lane has withdrawn are named here
rather than left to be inferred from a newer file. All four were reported to GELB on 2026-11-09 and
**none of them should be read as current.**

| reading | reported | why it is superseded |
|---|---|---|
| **PG-1** semantic share | 0.517 (1920) / 0.584 (1280) | computed with `[data-mapping-body-content]` in the set — **A-G55**. That group is MIXED (`:689`): it wraps the firewall's opaque **black seat** — the field's one occluder, measured at **−0.515** of its light — together with the core, body shape, collar and text, which is why its own share read **−0.084 at 1920 and +0.119 at 1280**. The sign flipped with which pixels the core happened to cover, so the class could be declared neither emitting nor occluding. |
| **PG-6** relation share | 0.163 / 0.194 | the relation class was `[data-beam]`, which **is not a beam count**: every *arc* carries the sign table's `beam` word as an attribute (`arcSign` emits `data-beam={s.beam}`). Measured live — L0 22 `[data-beam]` of which **3** are drawn beams, L1 19 of which **0** are. The share carried the arcs' light. |
| **PF-15 limb (a)** | 0.141 / 0.115 | same denominator defect as PG-1: the semantic light included `bodyContent`. |
| **PG-10** limbs 1 and 2 | 0.296 / 0.272 and 0.143 / 0.140 | the carrier was every glow (`.mf-halo`). At L0 **three of five glows belong to shelf bodies** and are still by design (A-F8), so both limbs were diluted downward. The carrier is now `.mf-wave-halo`. |

**Unaffected, and therefore still current:** PG-3's rendered diameters (57.0–87.77 px at 1920,
30.37–46.76 px at 1280, model path and rendered-shape path agreeing to the hundredth), the PF-15
ladder on the engraved minimum, the shelf's engraved minimum against the stage ground, and the
in-disc static floor of 0.000. None of those touch the corrected selectors.

**How the defects were found.** Not by re-reading the source — by probing the live DOM to answer
A-G51's invitation to contest it. The same probe that showed L1 draws zero beams (so its travel of 0
is correct, not a build gap) showed that `[data-beam]` counts arcs, and the same glow count that
reproduced A-G49's 2-of-5 showed that three of the five glows cannot breathe. One probe, three
corrections, two of them against this lane's own published numbers.

**One more correction, and it is this instrument's declaration rather than its arithmetic.** `bodyCore`
was first declared OCCLUDING on G-1's own words — *"a dark core, a luminous rim"*. It is not
light-removing: `mf-core` is `rgb(205, 240, 255)` at alpha 0.16 → 0.067 (`:857`), i.e. dark *relative
to the rim* and additive over the black seat under it. The declaration/measurement check flagged it on
its first run (+0.0429 at 1920, +0.0280 at 1280 against a declared OCCLUDING) and it is now declared
emitting. That is the argument for A-G55 asking for a **declaration** and not a sign test alone: a bare
sign test would have silently absorbed the error, and a bare declaration would have carried it.

**A-G49, recorded against this instrument.** The glow hook is `.mf-halo` — a **className**, the exact
channel A-G49 deprecates — and it is nonetheless the only complete hook today, because
`[data-testid="mapping-glows"]` holds `fieldHalos` only (`:923`) while `shelfHalos` render in an
anonymous `<g>` (`:884`). Measured live: `.mf-halo` 5, inside the container 2, outside it 3. This
lane's readings escaped the gap only by using the fragile channel. The `data-*` hooks A-G49 requires
are a product change and are held with A-G43 until the suite can run.

## 7 · Boundary

Read-only against the product: nothing in `app/`, `lib/`, `test/` or `docs/architecture/` is touched by this
directory. No merge, no push, no deployment. Gemini is off and unreachable — the façade answers 404 to every
`/api` path it does not script and logs it, so an unscripted read is visible rather than invented. No model
call can occur. Existing fixtures only (B-7): the façade serves exactly what
`test/career/mapping-field/field-g.test.tsx` already uses.
