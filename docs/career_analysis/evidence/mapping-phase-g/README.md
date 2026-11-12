# PERSON × JOB MAPPING · PHASE G · GRÜN'S **DEVELOPMENT** INSTRUMENT

> ## THIS INSTRUMENT RETURNS NO VERDICT
>
> ### §112 · what a clean `run-all.sh` does NOT mean — stated before anyone builds the claim out of my silence
>
> **49 instruments. 18 have a failure path (a `throw` or a non-zero exit). 31 are REPORTERS: for those,
> exit 0 means THE SCRIPT RAN TO COMPLETION and nothing whatever about the product.**
>
> **That is correct design for a reporter** — a frame corpus or a citation resolver has nothing to refuse, and
> giving it a failure path would make it a gate, whose permanent red spends the next reader's attention for
> figures nobody can act on. **The hazard is never the reporter; it is the sentence someone writes about it.**
> GELB found exactly that in their own deliverable: 16 of 25 instruments with no failure path, summarised in
> the mandate's report as {{THEIRS-WAS: 24 of 24 exit 0}} as though that were a verification result.
>
> **This record makes no such claim and the check is shown rather than asserted** — the only `exit 0` figures
> here are `tsc --noEmit`, which is a real compiler verdict, and a note that Turbopack *"exits 0 while
> producing no build"*, which records the hazard rather than relying on it. **But the figure belongs here
> anyway, because silence is where that sentence gets written:** a clean `run-all.sh` means the scripts ran.
> For the 18, it also means their assertions held. For the 31, it means nothing more.
>
> *A-G465 is this lane's rule and it was aimed here second, after its author aimed it at themselves first.*
>
> ### §111 · `{{WAS: … }}` marks a SUPERSEDED quote — strip it before scanning this record
>
> **A correction that quotes what it corrects is indistinguishable, to grep, from the thing it corrects.**
> GELB grepped this record for `whether PG-12 is satisfied is PINK`, got **six hits across three scripts and
> three outputs, and had drafted the conclusion that this lane named four defects and left three live.** All
> six were the quoted earlier form *inside the correction notes themselves*. They caught it by reading the
> matched line instead of counting matches — **one step from publishing a false accusation built on this
> lane's own apology.**
>
> **So every superseded phrase this record quotes is now wrapped in `{{WAS: … }}`.**
>
> *** §111b CORRECTION (GELB's A-G463, and they were right to diverge from my spec): WHETHER TO STRIP IS THE
> SCANNER'S BUSINESS, NOT THE MARKER'S. *** I first wrote this as *"a scan for a defect must first exclude its
> obituary"*, unconditionally. **That is true of one scan kind and false of the other:**
>
> | the question | strip? | because |
> |---|---|---|
> | **LIVENESS** — *does this lane still ASSERT this?* | **yes** | the 6 → 0 below is exactly this scan |
> | **EXISTENCE** — *does the record anywhere ESTABLISH it?* | **NO** | a quoted death sentence still establishes the death |
>
> **GELB's counter-example is decisive and two sections old:** their staleness gate is an EXISTENCE scan, and
> had it stripped, §121's quoted subject *"PF-1 retired, PF-15 malformed"* would have vanished — **and that
> quote is what surfaced the real PF-15 pointer gap.** *A marker that every scan must honour is a marker an
> existence scan cannot use at all.*
>
> ```bash
> # LIVENESS only — strip superseded quotes, THEN look for the live defect
> cat scripts/*.mjs outputs/*.json | sed 's/{{WAS:[^}]*}}//g' | grep "whether PG-12 is satisfied is PINK"
> # EXISTENCE — do NOT strip; the quote is evidence that the thing was established
> ```
>
> **And my risk test was incomplete in the direction A-G429's last form predicts.** I verified the marker
> **discriminates** — 6 unstripped, 0 stripped — which is a correct positive, and *a correct positive feels
> like the instrument working and is the one nobody audits.* **I never asked what stripping COSTS.** GELB did,
> on a marker handed to them, and found the counter-example in their own record.
>
> *A-G450 is GELB's: grep cannot tell a guard from its obituary. A-G408's remedy is the fix — a scan for code
> must first exclude what is not code — and this is the same rule for prose.* **The better a lane documents
> its own fix, the more it looks unfixed to any name-based scan, so the marker is owed by whoever wrote the
> fix, not by whoever scans it.**
>
> *** §113 · A SECOND MARKER, BECAUSE `{{WAS:}}` WOULD CLAIM A RETRACTION THAT IS NOT THIS LANE'S. ***
> GELB's scan of this record for an *"N of N exit 0"* claim returned **one hit — and it was this lane quoting
> THEM**, inside the paragraph written to disclaim exactly that. **One section after they almost accused this
> lane of leaving three defects live on the strength of its own apology: A-G450 twice in two sections, and the
> second obituary was their defect quoted by the lane that avoided it.**
>
> **So two markers, because the two say different things:**
>
> | marker | means | a liveness scan of… |
> |---|---|---|
> | `{{WAS: … }}` | **this lane** asserted it and retracted it | …THIS lane's claims must strip it |
> | `{{THEIRS-WAS: … }}` | **another lane** retracted it; this record only quotes it | …THAT lane's claims must strip it |
>
> **GELB's A-G466 assigns this debt to them** — *the marker is owed by whoever wrote the fix; the quotation by
> whoever wrote the defect.* **Marked here anyway, and the reason is not politeness: the unmarked quote sits in
> THIS file and tripped a scan of THIS record, and it costs one edit.** *Whose convention-debt it is and who
> can discharge it cheaply are different questions, and the second one decides who should.*
>
> *** §114 · THE PUBLISHED TIP CARRIES NONE OF THIS LANE'S EVIDENCE. THAT, NOT A COMMIT COUNT, IS CLAUSE
> FOUR'S ANSWER. ***
>
> **MEASURED, not inferred.** `git ls-remote origin refs/heads/frontend/mapping-phase-g` = **`3ec8457d`**
> (2026-11-06 11:43). Local = **`c7143fcd`**. `merge-base --is-ancestor 3ec8457d c7143fcd` = **yes**, and
> `rev-list --count c7143fcd..3ec8457d` = **0** — a clean fast-forward, **89 ahead, 0 behind.** *The ancestry
> test is the one that matters and is not the one that produces the number: `A..B` counts without requiring
> `A` to be an ancestor, so the figure 89 would read the same for a divergence.*
>
> **`docs/career_analysis/evidence/mapping-phase-g/` DOES NOT EXIST AT `3ec8457d`.** It is created by
> `92d82c62` (2026-11-10 17:57), and **84 of the 89** commits touch it. At the published tip there are **zero
> `gruen-*` instruments and zero `SEALED-*` files.** So the question is not whether the independent
> validation cites one of the 89 — **this lane's entire instrument and evidence surface is inside them.**
>
> | what cites GRÜN | cited items | resolvable at `3ec8457d` |
> |---|---|---|
> | GELB's record (`PERSON_X_JOB_MAPPING_PHASE_F/G.md` and evidence) | 20 distinct `gruen-*.mjs/.mts/.sh` filenames | **0 of 20** |
> | PINK's `PINK-SYSTEM-VALIDATION.md` | `gruen-pf13-evaluate.mjs` (§108, `37271544`), `outputs/pg16-crowding-L1.json`, `field-g-mutant.test.tsx` | **0 of 3** |
> | PINK's constant-provenance table | commits `4b83414e`, `185427d5` (shelf 0.022) | **neither** — both only inside the 89 |
> | PINK's measurements | its own stand, `3ec8457d`, BUILD_ID `xCD8LBxdjnP97-2Gjs5yr`, PINK's instruments on PINK's branch | **all** |
>
> **THE SCOPE, STATED AT THE WIDTH THE EVIDENCE SUPPORTS AND NO WIDER.** PINK's *measurements* do not depend
> on the 89: PINK validated a **published** build with its own instruments, and `PHASE_DIRS` — PF-13's
> population predicate — is present at `3ec8457d:test/career/mapping-field/architecture.test.ts:40`. What
> breaks is **cross-lane re-derivation**: GELB's PG/PF pin arguments rest on instruments a fresh checkout
> cannot open, and PINK's §55 narrowing cites one of them **by name**. *The one PINK citation that fails is
> the one inside the sentence asserting that the two lanes' instruments ARE mutually readable.*
>
> **AND PF-13'S POPULATION IS BUILD-RELATIVE, WHICH §110'S CORRECTED SENTENCE DOES NOT SAY.** 15 test files
> at `3ec8457d`, **16 at `c7143fcd`** — `field-g-mutant.test.tsx` is §104's. *So `b63b6368`'s "all 15 files"
> was not only a verdict this lane may not issue (§110); 15 was also the count of a different build.* A-G430
> and A-G54 on the same figure.
>
> **THE ASYMMETRY, AND IT IS NOT PINK'S TO HAVE CAUGHT.** PINK's document names **its own** unpushed branch as
> *"a defect in the work rather than an inconvenience"* and lists what is unreadable in each direction — and
> **this lane's 89 are not in that list.** The inventory of what a fresh reader cannot reach is therefore
> incomplete, and incomplete **in the direction most favourable to the build**, which is the exact shape PINK
> caught in GELB. *A lane cannot find its own defects with its own rules; it also cannot inventory a gap whose
> other half is in a repository it was reading through the filesystem rather than through git.*
>
> **WHAT THIS IS NOT.** Not a verdict on PINK's validation — that stands, on a published build. Not a request
> to publish: the owner's authorization names PINK's branch, this lane's 89 are not covered by it, and a
> permission does not travel sideways. **It is a statement about what a second, fresh checkout contains**,
> which is measurable, and it is **a blocker for a decision, not a verdict on a pin.**
>
> **§114b · and the guard was used on the wrong artifact, by its author.** `gruen-verify.sh --parse` over a
> `--reporter=json` file returned **exit 3, *"the runner printed no summary — fail closed"*** — correct, and
> correct for a reason that was not the run: it parses the **text** summary. **A fail-closed guard aimed at the
> wrong artifact reports a true *cannot tell*, and a true *cannot tell* reads like a defect in the run.**
> §112's verdict was then read from the JSON directly: **16 files, 197 tests, 197 passed, 0 failed** at
> `c7143fcd`, `architecture.test.ts` **31/31** — including the four-file violation on `1d28320c` that §96's
> evidence limbs closed.
>
> *** §115 · GELB'S PRODUCT STAND IS A DOCS COMMIT, AND 24 OF THE 30 COMMITS THIS RECORD PINS ARE
> LOCAL-ONLY — THE SEALS AMONG THEM. ***
>
> **1 · `4b83414e` IS NOT THIS LANE'S PRODUCT STAND, AND NOT BY A LITTLE.** GELB reports nine instruments
> and 19 `PHASE_G` citations pinning it as the build they read the product at. **`4b83414e` does not touch
> the product file at all** — it is §60, a docs commit; the product state its tree carries is §51's
> (`e9cd21af`). **Six commits have changed the component since, +166/−29 lines:**
>
> | commit | section | what moved | consequence for a measurement pinned at `4b83414e` |
> |---|---|---|---|
> | `b6c4bd84` | §64 | **comments only** — the extent-envelope attribution | none |
> | `28161e77` | §81 | the A-G49 hooks: `data-mapping-seat`, `data-seat-is-group`, halo identity **on the drawn circle, not the `<g>`** | **every selector-based instrument resolves differently** |
> | `fb4632da` | §86 | `frameWithBodies` rewritten (+95/−12), `FRAME_EM_PER_CHAR`, `FRAME_PASS_CAP` | **the viewBox changes → all geometry moves** |
> | `c84ab292` | §87 | `converged: boolean → boolean \| null`, `data-frame-converged="n/a"` | the vacuous true; a reader of that attribute sees a third value |
> | `7b8fc7f5` | §93 | `MOTION.breath` **deleted** (dead — 0 of 47 073 pixels swung in either state) | a constants-reader finds the key **missing** |
> | `fd45f45f` | §104 | A-G43: splay keys on `arc.state === "DIFFERENT"`, was `s.mark === "counterTick"` | **drawn geometry of DIFFERENT arcs changes** |
>
> **The sharpest two are `pg14-frame-corpus` and `pg14-side-allowance`: §86/§87 rewrote `frameWithBodies`,
> which IS PG-14's subject. Those instruments pin the build from BEFORE the ruling they exist to measure.**
> *A SHA whose subject says `docs(...)` looks like a neutral anchor. It names a tree, and a tree is a product
> state — A-G430's build axis hidden behind a commit-type prefix.* Which of the nine are affected is GELB's
> to decide; the diff is theirs to read, and this lane classifies it rather than ruling on it.
>
> **2 · THE SAME SWEEP, TURNED ON THIS RECORD, IS WORSE HERE.** Every hex token in the evidence directory,
> filtered to real commits via `cat-file -e <t>^{commit}`, then `for-each-ref --contains <sha>
> refs/remotes/origin`: **30 distinct commits pinned, 24 unreachable from origin.** Reachable: `10eb4030`,
> `32c63c2b`, `39d50bae`, `3ec8457d`, `93c47e03`, `9cc06f84` — all phase E/F or earlier.
>
> *** AND ALL EIGHT `SEALED-*` ARTIFACTS PIN A LOCAL-ONLY COMMIT. *** `d04d96aa` (pg17 ×3), `5c3ca5d9`
> (pg12 ×2), `8d62028c` (pg11 ×3) — none on origin — plus `buildId HRYkeEpbpndI3UEE7ceeC`, a Next.js
> build id with **no repository referent at all**. **A-G109's sealing discipline exists so that a reading
> belongs to a named build. The names are intact, the digests verify, and from outside this machine not one
> of them resolves.** *A seal proves a reading was not edited. It cannot prove the build it names exists for
> the reader — so REACHABILITY is a seventh frame axis beside build, domain, population, quantifier, phase
> and standing, and the sealing discipline is structurally blind to it, because every check a seal runs is a
> check it can run locally.*
>
> **3 · THE INSTRUMENT BEHIND BOTH ANSWERS READS A CACHE.** `refs/remotes/origin/*` is a local mirror, not
> the remote. Verified against `ls-remote` for all three lane branches on this run — `3ec8457d`, `7576262e`,
> `1f9117db`, all three **SAME** — so the figures stand. *But they stand because of a recent fetch, not
> because of the instrument: a local command answering a question about remote state, which is the family
> `@{u}` belongs to.* PINK's gap measured here: `1f9117db..b6490e86` = **105**, fast-forward, 0 behind —
> GELB's figure confirmed, and **`PINK-SYSTEM-VALIDATION.md` says *"119 commits, UNPUSHED"*,** so the
> document a reader arrives at carries the other number.
>
> **§115b · A-G468 REACHES THIS LANE TOO, AND IN THE GATE RATHER THAN A REPORTER.** The record itself is
> safe — `README.md` is 42 437 bytes, 4 % of 1 MiB, and the two instruments that read it use `readFileSync`,
> *immune by accident and not by design.* **The gate was not.** `architecture.test.ts` captured six
> `git diff -U0` runs on node's inherited 1 MiB default, **no `maxBuffer` declared anywhere in the lane**,
> and the widest — the component against `PHASE_D_BASE` — is **120 028 bytes, 11.4 %**, while the component
> grew **77 529 → 105 716 bytes in phase G alone**. *** AND THE SIGN IS WRONG THE SAME WAY: an overflow
> throws inside a test, and a throw inside a test reads as a FAILED ASSERTION when it means THE INPUT WAS
> NEVER READ. *** A-G374's seventh instance was this confusion in the other direction.
>
> Repaired at the source, not at six call sites: one `gitDiff` helper in `phase-base.ts` with the limit
> **declared and injectable** (`CONDYN_GATE_DIFF_MAXBUFFER`, read per call), `ENOBUFS` translated to
> `ERR_GATE_COULD_NOT_READ: … the gate never saw its input`, and a malformed limit **refused rather than
> defaulted**. The error code is **measured, not guessed** — `execFileSync` with `maxBuffer: 1024` over that
> diff yields `code: "ENOBUFS"`, `status: null`; *a guard written against a guessed code is dead code that
> reads as protection* (A-G465). Proven in **three limbs in one test**: overflow throws, malformed refuses,
> and the same capture **succeeds at the default** — *a guard that can never fire and a guard that always
> fires are one defect seen from two sides* (§94, A-G452).
>
> **`spawnSync` is the nastier form and GELB's case shows why: their `cat` exited `status: 0` while the pipe
> overflowed.** `execFileSync` throws; `spawnSync` hands back a successful child and a truncated buffer. *The
> success code described the subprocess, and the subprocess was not the measurement* — A-G374, now with a
> second subject.
>
> **16 files, 198 tests, 0 failed** at this section; `architecture.test.ts` **32/32**.
>
> *** §116 · PG-14'S PIN WAS ANCHORED TO THE LOOP WHOSE FAILURE CAUSED IT TO BE REPLACED — AND THIS
> LANE'S OWN PG-14 DERIVATION HAD BEEN DEAD FOR NINE SECTIONS, KILLED BY §87. ***
>
> **GELB'S FINDING, VERIFIED HERE INDEPENDENTLY.** `for (let pass = 0; pass < 2; pass += 1)`: **×1** at
> `4b83414e` and at `e9cd21af`, **×0** from `fb4632da` (§86) onward. `FRAME_PASS_CAP` and
> `FRAME_EM_PER_CHAR`: ×0 at `4b83414e`, ×2 and ×3 at the close. Their `gate-sweep-a-g128` reads **`[ok]`
> for “PG-14 ZERO-BY-CONSTRUCTION” at the stale build and `[!!] NOT FOUND` at the current one.
>
> *** AND THERE IS A LAYER UNDER IT THAT NEITHER LANE HAD NAMED. *** The anchor is not merely stale. **§64
> (`b6c4bd84`, 09:00) MEASURED that the fixed two-pass solve does not converge** — containment fails
> observably, **1.59 px on 4 of 11 layouts at a 16-character name at the component's own 420 px minimum**,
> 6.12 px at 24 characters; *“Product Manager” is fifteen characters.* §86 replaced the loop **because of
> that measurement**. `4b83414e` is 02:19 the same morning. **So the pin was anchored seven hours before the
> defect in its anchor was measured, and went on reading `[ok]` against the code shape whose failure is the
> reason the shape no longer exists.** *A pin does not go stale only by losing its referent; it can keep a
> referent that has since been disproved, and that reads greener than a missing one.*
>
> **THE CORRECTION TO THIS LANE'S OWN RANKING, TAKEN.** I named `pg14-frame-corpus` and
> `pg14-side-allowance` as “the two I would look at first.” GELB measured instead of reasoning:
> `side-allowance` is build-**INSENSITIVE**, `frame-corpus` moves by 2 lines, and the verdict flips in
> `gate-sweep-a-g128`, which is not named for PG-14 at all. **I ranked by SUBJECT PROXIMITY — the instrument
> whose name matches what I changed — and the thing that actually asserts the property was somewhere else.**
> *A ranking heuristic presented where a measurement was available.* They also caught their own inflation
> first: 6-of-9 became 3-of-9 once line offsets were normalised away, which is A-G429's third remedy applied
> to one's own alarming number.
>
> **THE RE-ANCHOR, MEASURED AND RUNNABLE WITHOUT A RENDER.** `gruen-pg14-frame-fixed.mjs` over 440 swept
> cases at the close:
>
> | | |
> |---|---|
> | cases within tolerance | 311 of 440; **129 over, 136 at the cap** |
> | *** over while claiming convergence *** | *** 0 *** |
> | §64's envelope, L=16 at 420 px | worst **0.1068 px** — was **1.59 px** |
> | every realistic name length (≤ 32 chars) | worst **0.2557 px**, all under the half-pixel tolerance |
> | the 136 at cap | names of 48/64/96/128 characters — not role names — each emitting `data-frame-converged="false"` |
>
> **So PG-14's claim is no longer ZERO-BY-CONSTRUCTION, and re-pointing the anchor is not enough — the
> WORDING has to change with it.** The construction is now *iterate to a declared cap and disclose*, and the
> property it supports is **NO CASE CLAIMS CONVERGENCE AND FAILS TO CONTAIN.** That is a different shape of
> claim: not a guarantee that the residue is zero, but a guarantee that the product never asserts
> containment it does not have. Stable things to pin instead of a line: the constant `FRAME_PASS_CAP`, the
> exit test `if (half - before < 0.5 * ((2 * half) / drawnPx))`, and that sentence. **Which is PINK's and
> GELB's to rule on; this lane states the code fact and the sweep.**
>
> *** §116b · AND THE INSTRUMENT THAT PROVES ALL OF THAT HAD BEEN DEAD SINCE §87. *** Its third needle was
> the exact string `data-frame-converged={String(frame.converged)}` — and **§87, the very next commit,
> re-spelled that expression to `frame.converged === null ? "n/a" : String(frame.converged)`, for a reason
> this derivation would have welcomed** (the vacuous true). The guard threw, which is right; `run-all.sh`
> turned the throw into **one `!! … FAILED (exit 1)` line among forty**, and §112 is the section that says
> what a clean pass does not mean. **GELB'S A-G468 IN THIS LANE'S OWN SHAPE, AND WORSE-AIMED: an instrument
> is likeliest to die at the commit that REFINES what it measures, because that is the commit that re-spells
> it.** Theirs died to the record's size; mine died to its subject's improvement.
>
> **The output was byte-identical anyway — and that is the part to be uneasy about.** `pg14-frame-fixed.json`
> had not changed, so for nine sections the record carried a correct artifact produced by an instrument that
> could no longer produce it. *Right by the luck of which lines §104 touched, not by design.* **A dead
> instrument whose last artifact still looks current is the one combination no liveness scan and no staleness
> scan catches: the first sees a file, the second sees a matching digest.**
>
> Re-pinned to the **property** rather than the spelling — both attributes, adjacent, any value expression —
> with the **detector limit stated in the file**: it proves emission, **not** unconditionality, since a
> sibling `{cond && <g data-frame-… />}` would satisfy it. The unconditional claim is carried where it can
> be: `gruen-fixture-states.mjs`, which reads the rendered DOM in every fixture state.
>
> *** §116c · THE LIVENESS COUNT FOR THIS LANE, STATED THE WAY GELB STATED THEIRS. *** Ten derivations:
> **nine exit 0, one dead** (now ten). **`gruen-seal-staleness` exits 1, and that is a FINDING, NOT A
> DEATH** — distinguishing those two is the whole of A-G465 and A-G374, and I mis-grouped it myself for one
> minute before reading its output. What it says:
>
> *** 38 STALE UNSEALED READINGS · 8 STALE SEALS · AND `valid` IS NOW 0, WAS 1 AT §87. *** Not one reading in
> this corpus was taken against the current build. **And the audit names the cross-lane consequence itself,
> which is why it exists: `pg11-guard-*.json` is stale, and GELB's INCONCLUSIVE-BY-MEASUREMENT closure of
> PG-11's relation limb rests on its `marginFactor` / `guardClears`.** A closure rather than a green — but a
> live status resting on a stale reading, named here rather than left to be noticed.
>
> **§116d · the regenerations, and one of them is nothing but the debt already on the books.**
> `constant-forks.json`: the corpus genuinely grew (`NO CONSTANT` 17→22, `HALTS` 5→7, a new `REPORTS`
> category for §103 and §94). `seal-staleness.json`: head and counts. **`pg23-alpha-source.json`: line
> numbers and nothing else** — 317→331, 710→832, 711→841, 928→1065, every `reason` string identical but for
> the offset it quotes. *That is the 17 bare-offset citations arriving as diff noise, and it is the same
> noise GELB had to normalise out of a 54-line diff an hour ago to stop their own figure being wrong — the
> cost of the debt, paid by the lane that reads it rather than the lane that wrote it.*
>
> *** §117 · A-G473 TURNED ON THIS RECORD: ONE CLAIM HAS LAPSED, AND IT IS THE SENTENCE §110 WROTE AS THE
> CANONICAL WAY TO STATE SUCH A CLAIM. ***
>
> GELB's **A-G473** — *a currency claim is itself DATED; the repair of a staleness defect is not a closure
> but a DATED one* — found **8 of 8 lapsed** in their record. Asked here with
> `gruen-currency-lapse.mjs`, over this README at `f80425ed`:
>
> | bucket | n | |
> |---|---|---|
> | **LAPSED** | **1** | **`:312`, §110's canonical sentence** |
> | CURRENT | 1 | §116's own reading |
> | SCOPED | 3 | dated measurements — their paragraph names a build, so they cannot lapse |
> | UNDATABLE | 2 | port liveness — no commit referent exists |
>
> *** THE ONE LAPSED CLAIM IS THE ONE THAT SAID *“the correct form, and the only one this lane may state”*,
> AND IT LAPSED TO THIS LANE'S OWN §115 SEVEN MINUTES AFTER §114 RESTATED IT. *** A-G473's prediction with
> nothing left to interpret: **the repair of a currency defect inherits the defect it repaired.** §110 was
> written to fix a verdict leak and it fixed it — then carried `197` as a bare number into a normative
> sentence, which is the one place a stale figure propagates by being COPIED rather than read.
>
> **Fixed structurally rather than by bumping the number: the figures are OUT of the sentence.** It now names
> where a count comes from and requires it to carry a commit; the figure lives in §116 with its build. *A
> canonical sentence must not contain a measurement, because the thing a reader copies is the sentence.*
> **And the zero this produces is a zero by RESTATEMENT, not by re-measurement — which is precisely what
> this instrument can and cannot tell apart, stated here because the instrument cannot state it.**
>
> **TWO DELIBERATE DIFFERENCES FROM GELB'S INSTRUMENT, both of which changed the answer.**
> **ONE · A SINGLE REFERENT IS ITSELF A FRAME ERROR (A-G435).** They date every claim against the last
> commit touching the COMPONENT. A claim about the test population is not invalidated by a comment moving in
> the product, and a pixel reading is not validated by the tests being untouched. Each claim is dated against
> **its own subject**, read from the claim. **TWO · A LIVENESS CLAIM HAS NO COMMIT REFERENT AT ALL.** *“the
> stands return 200”* decays in wall-clock time against running processes; dating it against any tip is a
> category error in whichever direction that tip fell. Reported **UNDATABLE** — a third bucket, not a lenient
> reading of the other two. §111b is the same split one axis over.
>
> **AND A THIRD THAT WAS NOT PLANNED: `SCOPED`.** The first form reported **3 LAPSED**, and two of them read
> *“… at `c7143fcd`”* and *“… 8 stale at `fb4632da`”*. **Those are DATED measurements — A-G54, a figure
> belongs to a build — and a dated measurement cannot lapse, because it never claimed to be current.**
> Counting them lapsed is the **over-report** direction, the alarming one (A-G429), and acting on it would
> have had this lane editing correct sentences. The scope is read from the enclosing **paragraph**, not from
> characters next to the match — GELB's second defect was a discriminator testing for a quote mark
> *adjacent* to the phrase. **Stated limit, chosen on purpose: a paragraph naming a build for some other
> clause scopes this claim too, so the scan UNDER-reports.**
>
> *** §117b · AND THE GUARD THAT WAS SUPPOSED TO PREVENT EXACTLY THIS CHECKED THE WRONG QUANTITY. *** The
> quotation-span blanking replaced every character of a span with a space, **newlines included.** Total
> length was preserved, so the guard passed — and `split("\n")` then returned fewer lines than the source,
> so **every row cited a line it had not matched** (`:130` was reported as a test-count claim; `:130` is a
> sentence about a fail-closed guard). **The guard's own comment read *“line numbers would shift and every
> row would cite the wrong line”* — the right hazard was NAMED and the wrong quantity was CHECKED.** Both
> invariants are asserted now. *This is the §106b shape: a check that fails closed and diagnoses the wrong
> cause is worse than no check, because it spends the reader's attention on the wrong thing.*
>
> **GELB's third defect reproduced here as a near-miss worth recording:** their patch threw on `\u`-escaped
> quotes where the file held literal UTF-8 ones, leaving the file unchanged while the next command reprinted
> the old figures. This README holds **92 `U+0022`, 3 `U+201C`, 3 `U+201D`** — counted before the pattern was
> written, not after it failed. **And the bucket-reachability control is in because they argued for it:** a
> synthetic claim dated after its referent must classify `CURRENT`, so *“1 LAPSED”* is a reading rather than
> a bucket nobody can reach, and the instrument **refuses** if either bucket is unreachable or if the pattern
> set matches nothing.
>
> **ON PG-11, GELB'S CORRECTION IS TAKEN AND IT IS THE BETTER SENTENCE.** I reported it as a gap; their
> record had already closed it at §89 — *“A-G277 returns to CLOSED, resting on current readings”* — and the
> real finding is that **the closure's currency lapsed**, not that the hole was open. *A lapsed closure and
> an unclosed gap look identical from outside and are owed different work.* My instrument's sentence was
> accurate; my framing of it was one category too pessimistic, which is the mirror of §116's ranking error
> and the same root: **a status read from one lane's artifact is not the other lane's status.**
>
> *** §118 · A-G474 FALSIFIED THIS LANE'S OWN SCAN: THE QUOTATION DETECTOR WAS HIDING FOUR CLAIMS, ONE OF
> THEM LAPSED. §117'S ZERO WAS PRODUCED BY THE DETECTOR, NOT BY THE RECORD. ***
>
> GELB's **A-G474**: *when a distinction is carried by the document's own structure, read the structure — a
> test that re-derives it from characters re-derives it wrongly and goes on failing in NEW ways after each
> repair.* They reached it after four forms, each repair narrower than the next failure.
>
> **MEASURED HERE RATHER THAN ACCEPTED,** by running the scan with the two CHARACTER-inferred spans removed
> and only the document-DECLARED markers kept:
>
> | form | matched | LAPSED |
> |---|---|---|
> | §117 as committed (characters + declared) | 6 | **0** |
> | declared markers only | **10** | **2** |
>
> *** THE CHARACTER TEST WAS BLANKING 6 569 CHARACTERS — ABOUT 15 % OF THE RECORD — AND WITH THEM FOUR
> CLAIM LINES. *** One, `:276`, was genuinely LAPSED: §116c's *38 stale unsealed readings · 8 stale seals ·
> `valid` is now 0*, **measured at `f80425ed`**, carried no build where it was written. *(§119: the build is
> named HERE because A-G476 showed that quoting a figure without it dates the figure to the quoting
> commit — so this sentence would have certified as CURRENT the very figure it calls undated.)* **And the direction is the point. GELB's four forms OVER-reported, which
> is the alarming direction and gets audited. Mine UNDER-reported, which is the flattering direction and does
> not.** *A “0 LAPSED” produced by an over-broad quotation detector is the same shape as a green produced by
> an empty population — §94, where a rung rejected a signal that did not exist.*
>
> **Repaired as A-G474 says, not with a better regex: only DECLARED markers remain** (`{{WAS:}}`,
> `{{THEIRS-WAS:}}`). The consequence is accepted rather than engineered around — **a peer's sentence quoted
> without a marker now counts as this lane's own claim**, which over-reports, which is the direction a reader
> audits. The remedy for a false hit is a marker on the quotation, which is a convention this record already
> has.
>
> **TWO FURTHER DEFECTS THE SAME RUN EXPOSED, both in the readings-corpus form.** Its referent was the whole
> `outputs/` directory **including the audits' own output files**, so §117 writing `currency-lapse.json`
> dated §116's staleness claim stale — *the claim dated itself stale, one turn of the same screw A-G473
> names.* The referent now excludes both audits' outputs. And `\b\d+ STALE\b` matched prose about a PEER's
> citations being *“+20 stale”*, so the staleness forms now require a corpus noun. **Both were
> false-positive sources, i.e. the honest direction, and both are fixed anyway — a detector that is wrong in
> the safe direction is still wrong, and §116's own ranking error came from accepting one.**
>
> *** §118b · AND THE THING NEITHER LANE'S INSTRUMENT MEASURES: EVERY CORRECTION TO THESE SCANS HAS MOVED
> ITS COUNT THE SAME WAY. *** GELB's **8 → 2**. This lane's **3 → 1 → 0**. Each step individually correct,
> each defensible on its own evidence, and every one toward **fewer findings**. **A-G462 says a conclusion
> against yourself gets no audit because it feels like rigour; the symmetric case is a REFINEMENT THAT
> ABSOLVES, which feels like precision.** The A-G474 falsification was a one-off and a one-off does not
> survive the next broadening of an exclusion set.
>
> So the cost of excluding anything is now **printed in every run**: `CLAIM LINES HIDDEN BY THE EXCLUSION
> SET`. It reads **1** — §110's own `{{WAS: … }}` figure, which is exactly what a declared retraction should
> hide — down from **4** under the character form. *A zero there would mean the markers do nothing; a number
> that grows without a section explaining it is the flattering direction arriving unannounced.*
>
> *** §118c · AND WRITING THIS SECTION BROKE THE INSTRUMENT IMMEDIATELY, WHICH IS THE SHORTEST VERSION OF
> A-G472 EITHER LANE HAS. *** The paragraph above quotes §116c's staleness figure in order to RULE about it.
> With the character spans gone, that quotation counts as a claim — the accepted consequence — and
> `git log -S` cannot date a line that is not committed yet, so the scan returned **two `UNDATED` debts
> against the section being written at that moment** and exited 1. **An uncommitted line is dated NOW by
> construction and cannot be stale; treating “not yet committed” as “not dated” is §94's shape inverted — a
> debt reported against something no change has had the chance to invalidate.** Classified `UNCOMMITTED`.
>
> **The residual is named and NOT engineered around: this scan cannot tell a claim from a sentence ABOUT a
> claim** (A-G460 — a rule scoped to the artifact does not bind the sentence about the artifact), which is
> GELB's defect-1 family in its **fourth** appearance across the two lanes. The structural remedy is a marker
> on the quotation. **One is not invented here.** `{{WAS:}}` and `{{THEIRS-WAS:}}` both say *retracted*, and
> §116c's figure is not retracted — so a third form would be the right shape, and *a convention earned by one
> instance is a convention invented for none.* It is owed if it recurs, and named so the next reader does not
> have to rediscover why two markers were not three.
>
> **The current reading, with the chain stated rather than the figure alone: 9 matched · 0 LAPSED · 3 CURRENT
> · 2 SCOPED · 2 UNCOMMITTED · 2 UNDATABLE · 1 hidden.** The zero rests on four changes — §117's
> restatement of §110, the referent narrowing, the pattern narrowing, and the UNCOMMITTED classification —
> **and not on a re-measurement of anything.** Four defensible steps, all four toward fewer findings, which
> is §118b's whole point turned on §118 itself. Stated here because the instrument still cannot tell a
> restatement from a re-measurement, and that limit did not move.
>
> *** §119 · A-G476 REPRODUCED HERE: THE SENTENCE CALLING A FIGURE UNDATED CERTIFIED IT AS CURRENT. AND
> THE DETECTOR BUILT TO CATCH IT IS INERT ON THE CASE IT WAS BUILT FOR. ***
>
> GELB's **A-G476**: *a quotation inherits the date of the commit that quotes it, so quoting a stale claim
> LAUNDERS ITS DATE.* Reproduced before it was believed. §118's two lines quote §116c's staleness figure
> **expressly in order to say that figure carried no build** — and once committed they dated to `57b92bf1`
> and read **CURRENT**:
>
> ```
> CURRENT  :374  readings-corpus  written 57b92bf1 2026-11-12T23:53  vs f80425ed 2026-11-12T23:26
> CURRENT  :375  readings-corpus  written 57b92bf1 2026-11-12T23:53  vs f80425ed 2026-11-12T23:26
> ```
>
> *** THE DISCLAIMER CERTIFIED ITS SUBJECT. *** §113's irony was a quotation carrying a peer's DEFECT; this
> is a quotation conferring a STATUS, and the status runs opposite to the sentence's plain meaning.
>
> **THE DETECTOR I BUILT FOR IT, AND WHY IT DOES NOT WORK.** A claim is now dated from the **oldest version
> of this record carrying its FIGURES** rather than from the commit that introduced its line, so a
> restatement inherits the date of the reading it restates. Four controls pass in-process, including the one
> that matters: a signature taken from the oldest blob **must resolve to that blob**, so the mechanism is
> proven able to date BACKWARDS and cannot silently never fire (`A-G476-dates-backwards=true`).
>
> *** AND IT IS INERT ON `:374`. *** The quoting line's numbers are `276, 116, 38, 8` — the quoted figure
> (**38**, **8**) mixed with the citations naming where it came from (**§276**, **§116**). §116c's own line
> carries `38, 8, 0, 1, 87`. **The signatures do not match, and no subset rule separates them: `38` and `8`
> alone collide across the record.** *A quoted figure cannot be told from a citation by its digits, because a
> careful quotation ADDS digits — the better the provenance, the worse the signature.* The mechanism is kept
> because it fires on a verbatim restatement, which is the ordinary case, and it is **reported as not
> solving A-G476** rather than credited with it.
>
> **WHAT DOES WORK IS THE RULE THAT ALREADY EXISTED, AND IT IS A FIX TO THE RECORD, NOT TO THE INSTRUMENT.**
> A-G427: the quotation carries the quoted claim's **own build**. §118's sentence now names `f80425ed` — and
> both rows classify **`SCOPED`** through the discriminator written in §117c, with **no new bucket, no new
> pattern and no third marker.** *A quotation that carries its subject's build is a dated measurement, which
> is what it always was; the laundering was the absence of the build, not the presence of the quotation.*
>
> *** AND THAT SETTLES THE MARKER QUESTION §118c LEFT OPEN, AGAINST MY OWN GUESS. *** I wrote that a third
> `{{…}}` form was *“the right shape… owed if it recurs.”* **It recurred inside one section, and the answer
> was not a marker.** A marker would have excluded the quotation from the scan and left the QUOTED figure
> undated by any instrument in either lane — GELB's point exactly, and the dating side is the worse half,
> because classification is fixable by a convention and dating is not. **The convention that was owed turned
> out to be one this record already had.** *Naming the thing you are owed is not the same as knowing what it
> is, and being wrong about which is cheaper to find out than it looks.*
>
> **§119b · two buckets proved reachable IN-PROCESS, and the reason is GELB's revert rather than their
> finding.** `UNCOMMITTED` reads 0 here, and GELB shipped that same bucket reading 0 for a reason that was
> not the record. They proved theirs with a **corpus mutant** — and its revert **silently did not run**,
> because a `cd ..` landed one directory short, so the mutant sat in their record until an md5 caught it.
> **A mutant programme's revert step needs the same proof as its apply step** — and a control that needs no
> mutation needs no revert. Both are synthetic here: a line that was never written must resolve to no
> commit, and the instrument **refuses** if it resolves to one. So the 0 is a reading of the record, not a
> property of the bucket.
>
> **THE READING: 9 matched · 0 LAPSED · 3 CURRENT · 4 SCOPED · 0 UNCOMMITTED (reachable) · 2 UNDATABLE · 1
> hidden** — and §118b's warning still stands over all of it: **five defensible changes now, all five toward
> fewer findings.** The one lever that moves the other way is in: the signature rule's collisions make a
> claim's effective date too OLD, i.e. it over-reports lapse. *That is the only part of this instrument whose
> errors are not flattering, and it is there on purpose.*
>
> **AND GELB'S CLOSING LINE IS THE ONE THAT ORDERS THE WHOLE PHASE'S CITATION WORK:** A-G427 made a citation
> name its **subject**, A-G430 its **build**, A-G469 made the build **reachable** — *** all three are
> conditions on the NAME, and not one of them asks whether the name REFERS. *** My eight seals and their
> `SCOPED-UNRESOLVABLE` are that gap reached from opposite ends.
>
> *** §120 · I PROBED OUTSIDE MY OWN PATTERN SET AND FOUND SIX DEFECTS IN THIS INSTRUMENT, EVERY ONE IN
> THE FLATTERING DIRECTION. THE WORST: A CLAIM THAT CROSSES A LINE WRAP WAS INVISIBLE TO EVERY FORM SINCE
> §117. ***
>
> I told GELB both hidden-counts are floors and that the unprintable number is **how many claims a pattern
> set never matched at all.** They probed theirs first and it moved `LAPSED` **2 → 6**. This is the same
> probe here, and every candidate was read **for what the sentence DOES** — their sharpening, after *“still
> passes”* turned out to be a hypothetical inside a vacuity argument:
>
> | candidate | what it does | kept? |
> |---|---|---|
> | *“§118b's warning still stands over all of it”* | a claim made **now about now**, about a CLASS of claims | no — GELB's `:16131` class |
> | `GELB withdrew *“PF-13 is closed”*` | a **quotation** of a peer's withdrawn claim | no |
> | *“The splay **now reads** `arc.state === "DIFFERENT"`”* | asserts what the SOURCE currently says | **yes** — new `product-source` form |
> | *“the seals remain exactly **reproducible** against `HRYkeEpbpndI3UEE7ceeC`”* | asserts a corpus is currently reproducible | **yes**, and it is the failing row |
>
> **AND ADDING THEM TOOK SIX ATTEMPTS, EACH EXPOSING A DIFFERENT DEFECT IN THIS FILE:**
>
> | # | the defect | direction |
> |---|---|---|
> | 1 | `NAMES_A_BUILD` accepted a build id as a valid scope **without asking whether it refers** | **lenient** |
> | 2 | the `seal-corpus` referent was the whole `outputs/` directory, not the seals | lenient |
> | 3 | the **reproducibility** form was missing entirely, so `SCOPED-UNRESOLVABLE` read 0 and was **vacuous in data** | lenient |
> | 4 | **a claim is a SENTENCE, not a LINE** — and this record is hard-wrapped | **lenient, and the largest** |
> | 5 | the window-attribution rule was **backwards**: `:743` was credited with `:744`'s claim and read LAPSED at a commit **eleven hours before the claim existed** | alarming |
> | 6 | a **bare** backticked build id was unrecognised, so scope fell back to the paragraph and picked up `fb4632da` from a different clause | lenient |
>
> *** §120a · DEFECT 1 IS THE ONE TO READ TWICE: THIS INSTRUMENT COMMITTED THE EXACT GAP GELB'S CLOSING
> LINE NAMED, INSIDE THE SECTION THAT QUOTED IT. *** §119 ends by recording their sentence — *A-G427 made a
> citation name its subject, A-G430 its build, A-G469 made the build reachable; all three are conditions on
> the NAME and not one asks whether the name REFERS* — and **the scope rule written two sections earlier did
> precisely that.** All three build ids in this record (`HRYkeEpbpndI3UEE7ceeC`, `xCD8LBxdjnP97-2Gjs5yr`,
> `utpaUMQpafZVzAeyYImhv`) resolve to nothing, and a claim dated to one read **SCOPED**, the safe bucket.
> *Quoting a rule is not applying it, and the section that quotes it is the least likely place to look.*
>
> *** §120b · AND DEFECT 4 RE-SCOPES EVERY COUNT §117–§119 REPORTED. *** The seal form was added and the
> bucket STILL read 0, because the claim spans a wrap: *“The seals remain”* ends one line, *“exactly
> reproducible against …”* begins the next. **A per-line scan cannot see it — so from §117 onward every
> form in this instrument was blind to any claim that happened to wrap.** The figures in §117, §118 and §119
> were floors in a stronger sense than their own detector-note admitted: not *“a phrasing outside the set”*
> but **any phrasing the wrap happened to split.** Not retracted — a floor that was lower than stated is
> still a floor — but re-scoped here rather than left to be inferred. Each line is now tested with the next
> line of the same paragraph; **a claim spanning THREE wrapped lines is still invisible**, which keeps every
> count a floor and is stated rather than fixed, because splitting prose that carries `§`, `·`, decimals and
> abbreviations is its own detector with its own defects.
>
> **THE READING, WITH A FAILING STATE ON THE BOARD FOR THE FIRST TIME: 11 matched · 0 LAPSED · 4 CURRENT · 4
> SCOPED · *** 1 SCOPED-UNRESOLVABLE *** · 0 UNCOMMITTED (reachable) · 2 UNDATABLE · 1 hidden**, exit 1.
> `:801` — *the seals remain exactly reproducible against `HRYkeEpbpndI3UEE7ceeC`* — **is scoped to a build
> that resolves to nothing, which is GELB's worse-of-two state, now measured on this side.** The eight seals
> are byte-identical and their digests verify; **what cannot be checked by anyone, by any means, is the build
> they are reproducible against.**
>
> *** §120c · AND THE PATTERN ACROSS THE SIX IS THE FINDING, NOT ANY ONE OF THEM. *** Five of six were
> **lenient** — they made this record look cleaner — and the one that was alarming (defect 5) is the only
> one I would have noticed unprompted, because it printed a `LAPSED` row with an impossible date. **Not one
> of the six was found by this lane's own rules.** Every one surfaced while implementing a rule handed over
> from the other lane, and the probe that started it ran only because GELB ran theirs first on an argument I
> had made to them. *A lane cannot find its own defects with its own rules — six instances inside a single
> file, and the file was the one built to audit this record's honesty.*
>
> *** §120d · AND WRITING §120 TOOK THE BUCKET FROM 1 TO 3, WHICH IS THE RIGHT ANSWER AND THE OPPOSITE OF
> §119'S DEFECT. *** `:509` and `:543` are §120's own sentences quoting the finding — and because §119's
> A-G427 fix requires a quotation to carry its subject's build, **they carry `HRYkeEpbpndI3UEE7ceeC` and
> therefore inherit its unresolvability.** A-G476 was laundering: a quotation acquiring a date it had not
> earned. **This is the same mechanism running the other way — a quotation inheriting a FAILING state it
> truthfully shares.** *Correct citation propagates the defect instead of hiding it, and a bucket that grows
> when the record discusses its own failing state is behaving.*
>
> **The exit code will now stay non-zero, and that is correct rather than tolerable.** No act available to
> this lane can make a Next.js build id resolve — not publication, not re-sealing, not the owner's decision.
> *A permanently red guard is a guard a reader learns to ignore, which is A-G465's hazard from the other
> side; the answer is not to clear it but to never let the COUNT move unremarked.* The count is printed in
> every run and stated here with the section that measured it, which is the only form that does not itself
> lapse (A-G473).

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
> **The correct form, and the only one this lane may state: the PHASE_DIRS population passes — the file and
> test counts READ FROM vitest's JSON reporter AT A NAMED COMMIT, coverage matching the population in both
> directions. PF-13 is GUARDED, not CLOSED. Its closure is PINK's to issue.** §117 took the figures OUT of
> this sentence: it carried {{WAS: 16 files, 197 tests, 0 failed }} as bare numbers, and **a canonical
> sentence that embeds a count lapses every time the count moves** — which it did, seven minutes later, to
> this lane's own §115. The reading itself lives wherever it was taken, with its build: §116 is 16 files /
> 198 tests / 0 failed at `f80425ed`.
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
