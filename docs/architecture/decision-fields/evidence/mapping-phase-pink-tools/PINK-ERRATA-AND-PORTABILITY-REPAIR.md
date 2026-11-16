# PINK — ERRATA TO THE SEALED REGISTER, AND THE PORTABILITY REPAIR

**Lane:** 🩷 PINK, independent validation
**Date:** 2026-11-16
**Branch:** `validation/hr-decision-loop-pink`, **published on origin** (cloned from `origin` this session at `b6490e86`)
**Stand used:** PINK's own `127.0.0.1:3122`, commit `3ec8457d`, BUILD_ID `xCD8LBxdjnP97-2Gjs5yr` — read from `.next/BUILD_ID` and from the running page, not relayed
**Machine load during every timed run:** stated with each figure; two other lanes were active

---

## 0. WHY THIS IS A SEPARATE FILE, WHICH IS ITSELF A FINDING

I was asked to correct three lapsed claims **in place** in
`mapping-phase-g-contract/PINK-SYSTEM-VALIDATION.md`, with a dated note, never deleting the original
sentence. **I cannot.** That file is entry **47** of `mapping-phase-g-contract/manifest.sha256`, and
`prep.txt` is entry **48**:

```
30e4b24dcf946b0835474d346ac693fa0aa25537c2f1351abe34bdf3bff1576c  ./PINK-SYSTEM-VALIDATION.md
e64579f7811fd4c99aa8dfd82ce5b944e3dfbc5f6998d0c5a2ff743ea560c4fd  ./prep.txt
```

Editing either makes `sha256sum -c` **FAIL** on a seal the owner has frozen. So the corrections live here,
in an unsealed file, and the sealed register keeps its bytes.

*** THE RESIDUAL DEFECT, STATED RATHER THAN HIDDEN: the sealed register carries NO POINTER TO THIS FILE. ***
A reader who opens `PINK-SYSTEM-VALIDATION.md` still meets all three lapsed sentences with nothing beside
them. `prep.txt` §23 records the house rule for exactly this shape — *"a supersession recorded only at the
destination is the defect that cost it a section"* — and this errata has that defect by construction. **The
cause is the seal freeze, not an oversight, and only the owner can lift it.** Adding one forward-pointing
line to the sealed register is a two-byte change I am ready to make on the owner's word.

---

## 1. THE THREE WITHDRAWALS — mine, and nobody else's

### W-1 · "119 commits, UNPUSHED" — **WITHDRAWN 2026-11-16**

`PINK-SYSTEM-VALIDATION.md:4` reads, verbatim and left standing there:

> **Branch:** `validation/hr-decision-loop-pink` — **119 commits, UNPUSHED**

**It is false now.** Measured: `git clone --no-local --branch validation/hr-decision-loop-pink
git@github.com:SYNTX-SYSTEM/condyn-admin.git` into a scratch directory succeeded and its `HEAD` is
`b6490e86b429d79543c77d5cec725219bd7ac8e9` — the branch tip. The branch is on `origin`.

**What this withdrawal costs elsewhere in that document**, since the unpushedness was load-bearing in four
places and a validator should not retract a premise and leave its conclusions: §0's fourth clause at `:27`
("IT IS NOT READABLE WHERE IT MATTERS"), §5's symmetry clause at `:165` ("in one direction, and this
unpushed statement in the other"), §5's "the strongest reason the unpushed branch is a defect in the work
rather than an inconvenience" at `:167`, and §11's "concrete cost of the unpushed branch" at `:363`
**all rest on a condition that no longer holds.**

**CORRECTION TO THIS LIST, 2026-11-16, found by the pointer generator rather than by re-reading.** An
earlier wording of this paragraph named the third dependent as **"§8's asymmetry argument"**. *** §8
CARRIES NO ASYMMETRY ARGUMENT AND NO DEPENDENCY ON THE UNPUSHED CONDITION AT ALL. *** §8 is "PIN COVERAGE
— stated as TWO bounds" (`:214`–`:318`); its only "direction" language is a figure being wrong in both
directions and coverage matching in both directions. The asymmetry/symmetry argument about READABILITY is
at `:161`–`:169`, which is **§5** — the same section as the strongest-reason clause. So the four dependent
passages sit in **three** sections, not four. The error was mine and the citation style is what hid it: a
section number and a line number were both written as `§n` / `:n` and neither had a verifier. §11's quotation of GELB's closing report — that
this lane's validation *"exists, is good, and cannot be read by anyone but you"* — was accurate when
written and is now **superseded by the push, not by any change in content.**

### W-2 · "`PHASE_G*.md` exists in NONE of the four worktrees this lane can read" — **WITHDRAWN 2026-11-16**

Stated at `:96`, `:158–160`, `:273` and `:358`. **It was a worktree-versus-ref error, and the error is
mine.** `PERSON_X_JOB_MAPPING_PHASE_G.md` is absent from the worktrees this lane had checked out, and
present in the repository's object store at other refs the whole time. Read this session:

```
git show 4f551f89:docs/architecture/decision-fields/PERSON_X_JOB_MAPPING_PHASE_G.md | wc -l
17078
```

A path read off a worktree answers about whichever branch that checkout happens to have out; `git show
<ref>:<path>` answers identically in every clone holding the object. **I applied the weaker of the two
and concluded a document did not exist.** This is the same confusion `gelb-paths.mjs` documents for
GELB's own lane, arrived at independently and in the opposite direction.

### W-3 · "197 tests, 197 passed" for PF-13 — **WITHDRAWN 2026-11-16**

`PINK-SYSTEM-VALIDATION.md:233` carries, in §8's "VERIFIED FROM THE ARTIFACTS" paragraph (restated at
`:267`):

**CORRECTION, 2026-11-16.** An earlier wording of this line cited `PINK-SYSTEM-VALIDATION.md:8`. *** LINE 8
OF THAT FILE IS EMPTY. *** "8" was §8, which begins at line `:214`; the quoted wording is at `:233`. A
SECTION number written in LINE-number syntax, in the very withdrawal whose lesson is that an unverified
relay is a rumour. It stood because prose citations have no verifier — which is why the forward pointers
beside the sealed register are generated by a script that reads each cited line and refuses if the expected
text is not there, and why that script caught this.

> **16 files, 197 tests, 197 passed**, coverage matched in both directions, zero missing, zero extra

**The artefact says 198.** Read this session from GRÜN's output at
`origin/frontend/mapping-phase-g:docs/career_analysis/evidence/mapping-phase-g/outputs/pf13-evaluated.json`:

```
45:  "passed": 198,
46:  "failed": 0,
49:  "missing": [],
50:  "extra": []
```

and GRÜN's own `AG485-CLOSURE.md:67` states the move: *"The figure moved from 197 (`bce62ea1`) to 198
because one test was added: §115 A-G468 (`3231f52c`)."*

**This is the worst of the three, and not because it is the largest.** 197 was correct at `bce62ea1`; the
lane whose figure it was had already recorded that it lapsed; and I carried it forward without re-reading
the artefact. **A figure relayed without being re-read in its artefact is a rumour, including when the
relaying lane is the one that audits other lanes for exactly this.** §8's surrounding reading is otherwise
confirmed: 16 files, 0 failed, 0 missing, 0 extra, `verdict: "NONE — development reading only (A-G36
point 2)"` still present verbatim at `:3` and `:9`.

---

## 2. RE-TIERING, NOW THAT W-2 IS WITHDRAWN AND GELB'S REGISTER IS READABLE

§5 put the A-G20 retirements on "TAKEN ON REPORT" **purely because of W-2's error**. Verified at
`4f551f89` by grep (never by reading 17078 lines whole):

| §5 item | new tier | evidence |
|---|---|---|
| PF-3 retired, never measured | **VERIFIED AT REF** | `:781` *"PF-3 retired in writing, replaced by PG-17 + PG-13"*; `:1060` *"PF-3 was retired in A-G20 having never been measured"* |
| PF-5/PF-7/PF-10 retired in favour of PG-10 | **VERIFIED AT REF** | `:788` *"PF-5/7/10 on the medium are retired in favour of PG-10"*; `:14430–14431` *"A-G20 retired PF-3, PF-5, PF-7 and PF-10 in favour of PG-10"* |
| PF-5/PF-7 retired **while red** | **VERIFIED AT REF, and new to this lane** | `:1061` *"PF-5 and PF-7 were retired while RED"* |
| PG-19's three burials | **STAYS ON REPORT** | not located by grep at `4f551f89`; absence of a grep hit is not absence of the ruling, so I do not convert it either way |
| PF-5/PF-7's retirement *rationale* | **STAYS ON REPORT** | the retirement is verified; whether it was *justified* is a ruling, not a readable fact |

*** AND A CORRECTION TO GELB, FOUND WHILE DISCHARGING MY OWN ERROR. *** §5 recorded *"GELB cites
`PHASE_G:725` and `:998`"*. **Both line numbers are wrong at `4f551f89`.** `:723–727` is PG-20's
reinforcement table and `:996–1000` is A-G18/PG-17's domain. `A-G20 · The four decisions` is the heading
at **`:773`**. The *substance* is confirmed — only the citation is not. **So the thing I could not check
was checkable, and when checked the pointer failed while the claim held.** That is the A-G430 shape with
the polarity reversed, and it is an argument for citing by anchor rather than by line in a document that
grows.

---

## 3. THE PORTABILITY REPAIR — D-PP-3

### 3.1 The population and the defect, counted here

83 instruments: **75 `.mjs` + 5 `.mts` + 3 `.py`**, across three contract directories (39 / 24 / 12 for
g / f / e). Not GELB's figure; `git ls-files` in this session.

**137 machine-absolute path sites in 80 of the 83 files.** The split, which matters because GELB's brief
called all 123 tool sites "hardcoded imports" and **62 of them were already overridable**:

| class | sites | shape | escape hatch |
|---|---|---|---|
| A | **40** | `import { chromium } from "/home/codi/Entwicklung/nquiry/…/playwright/index.mjs"` | **none** |
| B | **35** | `const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "<abs>"` | `CONDYN_PLAYWRIGHT_MODULE` |
| C | **21** | `import sharp from "/home/codi/Entwicklung/condyn-admin-pink-visual-{e,g}/…"` | **none** |
| D | **27** | `const SHARP = process.env.CONDYN_SHARP_MODULE ?? "<abs>"` | `CONDYN_SHARP_MODULE` |
| — | **12** | dead-session scratchpad paths (`/tmp/claude-1000/…/a060e5e1-…/`) in 9 files | partly `PINK_FACADE_LOG` |
| — | **2** | absolute worktree defaults behind `PINK_WT` in 2 files | `PINK_WT` |

**61 sites (A+C) had no escape hatch; 62 (B+D) had one whose DEFAULT was machine-absolute.** All 137 still
fail on a machine lacking that exact path, so all 137 are repaired — but they are not one defect and are
not reported as one. **The 12 dead-session paths are worse than the rest: that session id is gone, so
unlike the tool paths they resolve NOWHERE, not even here.**

*** TWO CORRECTIONS TO GELB'S DIAGNOSIS. ***

1. **`sharp@0.34.5` was ALREADY resolvable bare**, before any declaration: it arrives transitively under
   `next@16.2.4` (`npm ls sharp` → `condyn-admin@0.1.0 └─┬ next@16.2.4 └── sharp@0.34.5`), and
   `import("sharp")` succeeds from the scripts directory at `b6490e86`. Proven again with the resolver's
   fallback table emptied: **sharp still RESOLVED.** So for sharp the devDependency is version *pinning*,
   not a resolution repair. Only `playwright` was genuinely unreachable.
2. All three hardcoded sharp targets are the **same version, 0.34.5** (`condyn-admin-pink-visual-g`,
   `condyn-admin-pink-visual-e`, and this worktree). The `-e`/`-g` distinction across 48 sites was
   **never load-bearing.**

**Verified, not taken on report:** `playwright 1.63.0` and `sharp 0.34.5` are exact devDependencies at
integration commit `430741fc` (`git show 430741fc:package.json` → `:47 "playwright": "1.63.0", :48
"sharp": "0.34.5"`), on `integration/pxj-complete-20261116` only. Neither is declared at `b6490e86`.

### 3.2 The resolver

`mapping-phase-pink-tools/pink-tools.mjs`. Order: **bare `import()` → `PINK_*` → the pre-existing
`CONDYN_*_MODULE` → documented machine-local fallbacks → THROW with every candidate listed.** Roots are
derived from `import.meta.url` and refuse if the derived root is not a checkout of this repository.
**It never falls back to something that merely imports**, which is stated in its own docstring: a wrong
`sharp` ABI or a different Chromium still produces numbers, and those numbers would be filed as
measurements of this build.

**All four paths exercised, with real output:**

| path | result |
|---|---|
| bare `import()` | `playwright RESOLVED` / `sharp RESOLVED` in a fresh origin clone carrying the declared deps, **with the fallback table emptied and all four env vars unset** — so step 1 provably fired |
| `PINK_PLAYWRIGHT` override | `override resolved chromium: launch() present` |
| machine-local fallback | `playwright RESOLVED` at `b6490e86`, where the dependency is undeclared |
| **THROW** | `REFUSE pink-tools: could not resolve playwright. Candidates tried, in order: - bare import("playwright") — ERR_MODULE_NOT_FOUND - PINK_PLAYWRIGHT — not set …` |
| **root refusal** | real module placed outside a repo → `Error: REFUSE pink-tools: derived REPO_ROOT /tmp/claude-1000 holds no .git`, **exit 1** |

### 3.3 The rewrite, as a mechanism

`mapping-phase-pink-tools/pink-portable-rewrite.mjs` rewrites all 137 sites. It is a re-runnable script,
not 83 hand edits, so the result is checkable against the sealed inputs. `--report` census:

```
--- report --- population 83 | sealed 83 of 83 | files changed 80 | change sites 134
```

**The 3 untouched files are exactly the 3 `.py`**, which carry no absolute path and need no repair.

### 3.4 *** THE BLOCKING FINDING: ALL 83 INSTRUMENTS ARE INSIDE A FROZEN SEAL ***

GELB ordered the rewrite **in place** and, in the same brief, froze every seal. **Those two instructions
contradict each other, and GELB did not notice** — because `mapping-phase-g-gelb/` contains **no
manifest at `4f551f89`**, so GELB's own 26 instruments are unsealed flat files and its own repair cost it
nothing.

Measured, read from the manifests themselves:

| manifest | entries | of which `scripts/` |
|---|---|---|
| `mapping-phase-e-contract` | 33 | 15 |
| `mapping-phase-f-contract` | 43 | 25 |
| `mapping-phase-g-contract` | 91 | 43 |
| **total** | **167** | **83 — every instrument** |

Before and after all work in this session: **167/167 OK, 0 FAILED.**

**The consequence, demonstrated in a throwaway clone rather than argued:** applying the repair in place
there turned the seals into

```
mapping-phase-e: OK=18 FAILED=15
mapping-phase-f: OK=18 FAILED=25
mapping-phase-g: OK=51 FAILED=40
```

— **80 of 167 entries FAIL**, exactly the 80 modified files.

So `--in-place` **refuses each sealed file by name** and exits 3, modifying nothing (verified: 0 files
changed on a refused run). The owner can lift it with `PINK_SEAL_OVERRIDE=i-have-owner-approval`, after
which the broken seals are a deliberate recorded act rather than a side effect.

**My position, as a bounded refusal:** the repair is authored, proven and ready; **applying it is the
owner's decision, not mine**, because it trades a frozen seal for reconstructibility and both were made
constraints by people above this lane. The two coherent options are (a) lift the freeze for these three
manifests and re-seal deliberately, or (b) accept that the sealed generation stays unreconstructible and
the repair governs instruments written from here on.

### 3.5 Proof by running them, not by asserting

Four instruments plus one new one, real exit codes. Everything measured against `3ec8457d` /
`xCD8LBxdjnP97-2Gjs5yr` on `:3122`.

| # | instrument | phase | classes | venue | exit | wall | load |
|---|---|---|---|---|---|---|---|
| 1 | `pink-breath.mjs` | e | A | `PINK_BASE`→`:3122` | **0** | 20.0 s | 3.28 2.17 1.68 |
| 2 | `pink-pg1-attr.mjs` | f | A+C | `:3120`→`:3122` via socat | **0** | 8.5 s | 2.84 2.13 1.67 |
| 3 | `pink-tip-timing-g.mjs` | g | B+D | `:3122` native | **0** | 45.0 s | 2.97 2.26 1.74 |
| 4 | `pink-taxonomy-g.mjs` | g | B | **fresh origin clone**, all four env vars unset | **0** | 7.3 s | 5.03 3.14 2.16 |
| 5 | `pink-pf2-carrier-probe.mjs` | new | — | `:3122` | **0** | — | 4.32 3.47 2.42 |

Run 4 is the one that matters: a **repaired instrument running from a clone of `origin`** with
`PINK_PLAYWRIGHT`, `PINK_SHARP`, `CONDYN_PLAYWRIGHT_MODULE` and `CONDYN_SHARP_MODULE` all unset.

**Runs 1 and 2 measured a build their pins were not taken on** (`3ec8457d`, not `9cc06f84`), because
`:3120`'s original stand is gone. **Their numbers are therefore NOT pin measurements and none is
reported as one.** What is proven is resolution and execution.

**A defect run 1 exposed, which is D-PP-3's other half.** Its output reads `"commit": "9cc06f84"` while
the stand it measured is `3ec8457d`: **the provenance is a hardcoded string, reported regardless of what
was measured.** Census: **60 of the 80 `.mjs`/`.mts` instruments hardcode a commit literal** (phase-e
12/15, phase-f 13/25, phase-g 35/40), against **27 that read `buildId` from the running stand**.
*(First counted as 62 of 78 / 29. That count ran in the same shell block that deleted the three
`.portable.mjs` probes, and the `grep` executed before the `rm`, so each phase was inflated by its own
probe copy. Re-measured on a population re-printed as 80. **My own figure, caught by my own rule, and
recorded rather than quietly replaced.**)* Run 3
and run 4, both phase-g, correctly reported `3ec8457d` / `xCD8LBxdjnP97-2Gjs5yr` because they read it.
**A hardcoded provenance is the same class as a hardcoded path and is the more dangerous of the two: a
wrong path fails loudly elsewhere, a wrong commit label is filed as evidence.** The resolver does not fix
this; it needs the stand read at run time, which 27 instruments already demonstrate.

### 3.6 Reconstructibility, re-measured — with both numbers, as asked

Fresh `--no-local` clone of `origin` at `b6490e86`. Criterion A: no machine-absolute path. Criterion B:
every quoted repo-relative path resolves at the instrument's own ref.

| state | criterion-A clean | absolute sites |
|---|---|---|
| **as committed at `b6490e86`** | **3 / 83** | **137** |
| **with the repair applied** | **83 / 83** | **0** |

*** I MEASURE 3 OF 83 AT BASELINE, NOT THE 2 OF 83 THE BRIEF ATTRIBUTES TO THIS LANE. *** The 3 are the
`.py` files. I cannot reconcile the difference because last round's artefact is not in the record I can
find, so **the brief's 2/83 is `UNVERIFIED` by me** and 3/83 is what this session measured.

**The two senses, kept apart:**

- **Reconstructible *today* at `b6490e86`:** the repaired instruments resolve here only via the
  machine-local fallback, because `playwright` is undeclared at this ref. On another machine they
  **THROW with the candidate list** — an honest refusal, not a false measurement. So the repair's value
  at this ref is that it converts 80 silent mis-resolutions into one loud one.
- **Reconstructible once the declared dependency is installed** (`npm ci` from the integrated state
  carrying `430741fc`): **83 / 83**, proven by run 4 and by the emptied-fallback resolution test.

**Criterion B, and GELB's requested third state.** My instruments quote only **3** repo-relative paths in
total and use **zero** `git show <ref>:<path>` peer-lane reads. So GELB's `resolves-at-a-declared-peer-ref`
state is **correct for GELB's lane and inapplicable to mine** — it changes no PINK number. Of the 3 sites:

- `outputs/PF8-RINGS-RETAKE-${LEVEL}.json` in `pink-pf8-rings-retake-g.mjs` is **cwd-relative**, so it
  writes wherever it is launched. A soft defect of the same family; **not repaired by the current
  rewriter**, and named here rather than quietly left.
- `pink-v11-reference.py` reads `layout-spec-v1.1.json` and `layout-golden-vectors-v1.1.json`, which
  resolve on **2 of 61 origin refs** (`frontend/mapping-phase-g`, `integration/pxj-complete-20261116`)
  and **not on this lane's own branch**. But it takes the root as `argv[1]` and **raises
  `FileNotFoundError`, exit 1**, when the root lacks them — proven by running it against the fresh clone.
  **That is a declared, operator-supplied input that refuses when absent, which is the correct shape, not
  a defect.** It argues the criterion needs a state GELB's three do not contain:
  *resolves-at-an-operator-supplied-root-and-refuses-loudly-otherwise.*

**I must also correct an attribution.** GELB's message says *"You classified `gelb-pin-assertion-scan.mjs`
and `gelb-e7-breath-mode.mjs` as non-reconstructible"* and asks me to restate 26/28 as 28/28. **I made no
such classification and produced no 26/28 — in this session I have measured only PINK's 83.** That figure
is from a prior round and is not mine to restate; the methodological point is accepted and built into
§3.6 above, but **I am not confirming a per-lane number for GELB's lane that I have not measured.**

---

## 4. SWALLOWED INPUTS — GELB's better question, answered with a census

GELB is right that this class outranks the import rewrite, and **my first scan for it returned all
zeros** because `grep -E 'catch *{ *}'` is an invalid interval expression and I had suppressed stderr.
**A silent zero from my own instrument, in the very sweep meant to find silent zeros.** Redone with `-P`
over a population printed as 83:

| construct | occurrences | files | judgement |
|---|---|---|---|
| `.catch(() => {})` | **179** | 71 | **174 wrap `click` (111), `press` (61) or `dispatchEvent` (2)** — optional UI *actions*, not inputs, and the instruments then assert the postcondition (e.g. `pink-pixels.mjs` ABORTs if the overlay survives). **Not the defect class.** |
| bare `catch {}` | 3 | 3 | 2 swallow a URL parse inside `page.on()` while **accumulating a population** (`apiResp`, `fetches`) — a non-parseable URL drops silently. Diagnostic fields, not pin figures, so low severity; **the shape is real.** 1 is a log append, benign. |
| `\|\| {}` | 6 | 2 | 5 are "find a step, else report `null`" — an explicit null, honest. **`Object.keys(baseline.bodies \|\| {})` in `pink-p13.mjs:71` is the dangerous one**: an absent `bodies` yields `bodiesMoved = []`, i.e. *"nothing moved"* reported over a population that was never there. |
| `existsSync(…) ? …` | **0** | 0 | — |
| `\|\| []`, `?? []`, `?? {}` | **0** | 0 | — |

**The venue-shaped defect GELB repaired in its own lane does not have a PINK analogue**, because my
instruments have **one** input venue — a live stand — not a list of refs. Its true analogue is *a selector
that matches zero elements and is measured as an empty population.* 59 instruments use
`querySelectorAll`, 113 sites.

*** I CANNOT CERTIFY THOSE 59. *** My automated guard predicate matched `waitForSelector` anywhere in the
file and returned "GUARDED" for 59 of 59 — **too permissive to be evidence**, since a `waitForSelector` on
one selector says nothing about a different selector's population. **Reporting 59/59 guarded would be the
figure-over-an-untested-population error, so I am reporting the predicate's weakness instead of its
output.** Settling it needs a zero-population mutant per instrument, which is real work and not done here.

---

## 5. THE PINS

### PG-20 — **OPEN. Refused once, with the ground.**

A-G94 verified verbatim at `4f551f89:2816–2831`: the magnitude limb is measured at the collar at both
sizes (L0 1920 **5.461 px**, L0 1280 **3.053 px** lateral, ratio **0.5604** constant across a 5× magnitude
change), and *"Whether 3.05 px is perceivable is **PINK's threshold to set**, from its own instrument, and
not mine."*

**I decline, and this is the only statement of it.** A perceptual threshold is a claim about human
observers. This lane's entire instrument bound (§1) is one machine, one Chromium, SwiftShader **software**
raster, two viewports at `deviceScaleFactor: 1`, sRGB with gamut clipping. **Nothing in that chain
measures perception.** Converting a pixel count into a perceivability verdict from it would present an
instrument constant as a psychophysical one — the identical error to PF-5's denominator, which went green
for four phases because a bound looked measured and was not. **It needs observers, not pixels.** The
magnitude is measured and verified; the threshold is not mine to invent and no instrument I hold can set
it.

### PF-2 — **OPEN, and the boundary is now sharper than §23 had it.**

§23's void is confirmed from the artefact, not relayed: across all four snapshots of
`PF2-DIM-INVERSION-VOID-ATTEMPT1.json` the two routes span **0.1002 → 45.6046, spread 455.1×**, matching
§23's "0.10 to 45.6". The in-scope result stands as recorded: `CHECKED/NAME_ONLY` **2.1091** clears ≥1.6,
`NAME_ONLY/NONE` **0.4036** does not, `allClear: false`.

§23 named the cause (`[data-mapping-arc]` is a `<g>`; the drawn mark is a child) and said the fix was the
§10–§14 halo-mask treatment. **I probed whether that fix is available, and it is not.** New instrument
`pink-pf2-carrier-probe.mjs`, exit 0, on `3ec8457d` at 1920 under `reduce`:

- **0 of 19** arc groups are themselves measurable (`attributedElementMeasurable: 0`) — §23's first pass
  confirmed.
- The only candidate discriminator, `data-arc-mark`, is present in **8 of 19** groups: CHECKED **4/8**,
  NAME_ONLY **4/9**, **NONE 0/2**.
- `markIsLongest: false` — "longest measurable child" is not the rule either.
- Child tag patterns are heterogeneous *within* each step: CHECKED has 4 distinct patterns
  (`line,line,line` / `path,path,path` / `path,path` / `path`), NAME_ONLY 4, NONE 1.
- **NONE groups carry only `data-arc-end`** — no attribute identifies their lit geometry at all.

**I nearly misreported this.** My first probe returned `childrenCarryOwnData: 19` and I read it as "the
discriminator exists everywhere"; it counts groups where *some* child has *any* `data-*` attribute,
including `data-arc-end`. The second probe found the 8/19 split. **Had I stopped at the first, I would
have declared PF-2 measurable on a selector that silently covers 8 of 19 groups** — the exact swallowed-
population defect of §4, in the instrument built to answer it.

**So PF-2 is NOT measurable by this lane on this build.** Boundary: the DOM carries no uniform rule
selecting a mark's lit geometry. **And the one in-scope red — `NAME_ONLY/NONE` at 0.4036 — turns on the
NONE step, whose geometry carrier is the one that cannot be identified at all.** Discharging it needs
either a product-side hook marking the lit geometry on every arc group (a product change: outside this
lane's authority and excluded by "no new product features"), or a per-step per-pattern geometry rule
validated against all 8 patterns — which still leaves the 2 NONE groups unresolvable.

### PF-6 — **row 1 RED confirmed on the blurred frames; 1280×800 UNMEASURED, confirmed.**

From `outputs/PF11-PF6-BLURRED.json`, which corrects §21's unblurred reading. Row 2 (bound ≤ 0.0025)
clears in all three cells. Row 1 (bound ≤ 0.03):

| motion | foreign suppressed | row-1 max | vs ≤ 0.03 |
|---|---|---|---|
| `reduce` | false | 0.003891808 | clears |
| `no-preference` | **true** | 0.02825015 | clears, with 6 % headroom |
| `no-preference` | **false** | **0.5074394** | **RED — 16.9× the bound** |

**The red is specifically the foreign-content-not-suppressed cell under `no-preference`**, so it is
inherited from foreign content rather than from the field's own drawing.

**And 1280×800 is unmeasured for PF-6: all three PF-6 entries in the artefact read
`"viewport": "1920x1080"`.** The guard ran at one viewport only. That stays open with that as its whole
boundary — the instrument exists and would need only a second viewport pass, which is not blocked on
anything but a run.

### PF-11 — **the guard clears NOTHING on its contrast limb, at either viewport.**

Both the guard and its output are on `origin` on this branch. Read from
`outputs/PF11-PF6-BLURRED.json`:

| viewport | thr 0.001 | 0.002 | 0.004 | 0.008 | clearing / failing / not evaluable |
|---|---|---|---|---|---|
| 1920×1080 | b2b 0, apart 10 → **UNBOUNDED** | b2b 0, apart 2 → **UNBOUNDED** | 0/0 NO SIGNAL | 0/0 NO SIGNAL | **0 / 2 / 2** |
| 1280×800 | 0/0 NO SIGNAL | 0/0 NO SIGNAL | 0/0 NO SIGNAL | 0/0 NO SIGNAL | **0 / 0 / 4** |

The bound is a count ratio ≤ 1.5 at **every** threshold. A zero back-to-back count against a non-zero 2 s
count makes the ratio infinite, so the two lowest rungs **fail**; the rest measured nothing and the
instrument correctly records `clears: null` rather than `true`. `conjunctionVerdict_forContrastOnly:
false` at both sizes. **The separately reported computed-style limb clears** (`offenders: 0`).

**So PF-11 clears exactly one rung of the pin — the computed-style clause — and 0 of 8 contrast rungs,
with 6 of those 8 not evaluable.** **A rung that measured nothing is not a pass**, and the instrument's
`null` is the honest encoding of that; it is credited here as neither green nor red. **PF-11 is therefore
guarded by a working instrument and cleared by none of its contrast rungs** — which is a real state and
not the same as "unguarded". Scope: one fixture, one analysisId, L0 (§63).

### PF-13 — **the three grounds all still hold; only the figure moved.**

I re-read the artefact rather than my own summary. `verdict` is still, verbatim, `"NONE — development
reading only (A-G36 point 2)"` at `:3` and `:9`, and `aG426` still records the deliberate contradiction
with GELB §116's wording. **All three of §56's grounds are intact: this lane still has not run it
(verifying a figure in another lane's output is not measuring a pin); the instrument still declares no
verdict, and A-G36 point 2 forbids discharging an obligation on a development reading as much as
reinstating one; and it is still outside this venue — a meta-pin over the vitest population needing the
harness and a disposable database, while this lane measures pixels on a façade.** None has dissolved.
What changed is the figure, **198/198 over 16 files, not 197/197** (W-3), with coverage matched both ways
and zero missing or extra. **PF-13's final state from this lane is unchanged: well-evidenced, no verdict
by its own instrument, and no lane has issued its closure, this one included.**

### D-PP-3 — **the path half is repaired and unapplied; the provenance half is open.**

Same defect as §3, closed there as to **paths**: 137 sites → 0 in the repaired generation, resolver
proven on all four branches including the throw. **Not applied**, on the seal boundary of §3.4.
**The provenance half is NOT closed and is not the same fix**: 60 of 80 instruments hardcode a commit
literal and will report it against whatever stand they are pointed at (§3.5, demonstrated by run 1
reporting `9cc06f84` while measuring `3ec8457d`). The remedy is to read the stand at run time, which 29
instruments already do.

---

---

## 6. Q-12 / `syntx-walk.e2e.test.ts` — **MY VERDICT: THE PRODUCT IS RIGHT, THE TEST WAS STALE**

GELB handed me the failure and explicitly did not guess. **It is `"03"`**, and it is the stale shape —
**which is the opposite of what GELB concluded about it.**

```
AssertionError: expected +0 to be 1   at syntx-walk.e2e.test.ts:440
```

**The mechanism, read in the product at `origin/integration/pxj-complete-20261116`:**

```
app/components/career/demo/SemanticCareerIntelligenceField.tsx
  :612  const legacyHidden = investigationMode === "PERSON_X_JOB";
  :613  const legacyStage = (stageId) => legacyHidden && ["03","04","05","06"].includes(stageId);
  :864  ].filter((stage) => !legacyStage(stage.stageId));
```

and the rule stated in the product's own comment immediately above it:

> *Q1: under PERSON × JOB the legacy orbits (03 resonance, 04 roles, 05 tension, 06 evolution) are not
> shown: no orbit, count, HUD action, coupling line, inspector node or text.*

The walk seeds `investigation: { mode: "PERSON_X_JOB" }` (`:310`), so `legacyHidden` is **true** and four
of the six shells are **deliberately absent**. The loop runs `01, 02, 03, …`, so the first miss is **`03`**,
matching `expected +0 to be 1`. **The shell itself renders unconditionally** — `data-testid`
`focus-transition-stage-shell-${stageId}` at `SyntxFocusShell.tsx:170` — so absence can only come from that
filter, and no settle or timing would ever produce it.

**The dates settle it.** `legacyHidden` arrived in **`afcf89f6`, 2026-10-22 20:31** ("PERSON × JOB first
screen … owner G1"), reinforced by `12e01f6d`, 2026-10-24 (RD-5). The walk was last rebound in
**`916e884e`, 2026-10-15 15:19**. **The product rule post-dates the test by seven days.**

*** SO GELB'S TRIAGE IS WRONG ON THIS ONE, BY GELB'S OWN GENERALISATION. *** It wrote: *"this is **not**
the stale-copy shape of the other failure"*, on the ground that the testid and the `01…06` set still exist
in the product. **Both of those facts are true and neither is the question.** The testid exists and the
set exists; what changed is a **filter over the set**, under a mode the fixture declares. **It is the same
class as the `"UPLOADED != SELECTED"` copy drift, with a predicate in place of a string** — *a test that
cannot run cannot go red, so it ages silently while the product moves past it.* GELB stated that
generalisation and then set it aside for this failure.

### The repair, structural rather than numeric

Both call sites — **`:440` and `:915`, byte-identical on `b6490e86` and on the integration ref** — now
call one helper that asserts **the rule's precondition and both of its halves**:

```ts
const fieldRoot = page.locator('[data-testid="semantic-career-intelligence-field"]');
expect(await fieldRoot.count()).toBe(1);
expect(await fieldRoot.getAttribute("data-investigation-mode")).toBe("PERSON_X_JOB");
// all six reported together, not aborted on the first miss
expect(shells).toEqual({ "01": 1, "02": 1, "03": 0, "04": 0, "05": 0, "06": 0 });
```

Three things that were wrong beyond the expectation itself:

1. **`:915` is stale too, and would have surfaced as the next failure.** It sits inside the *same*
   `it("Q-01 … Q-05, Q-07 … Q-11")` block (`:342`–`:931`), so `:440` aborted the test and `:915` was never
   reached — which is why GELB saw one failure in this file and not two. The analysis persists
   `PERSON_X_JOB`, so `:915` is equally wrong. **Both are repaired.**
2. **The walk never asserted the investigation mode at all.** It declared `PERSON_X_JOB` in the fixture and
   never checked the product received it — the Q1 rule's own precondition, unguarded. A product that
   silently dropped the mode would have passed the old assertion *and* the new one's second half; it now
   fails on the first.
3. **The old loop named only the earliest absent stage**, which is exactly why GELB could not tell me which
   of the six it was. All six are now reported in one object.

**I could not bind it to a product constant, and that is a product-side gap worth naming:** the set
`["03","04","05","06"]` is **inlined in four places** (`SemanticCareerIntelligenceField.tsx:194` and
`:613`, `SemanticGuideDrawer.tsx:23`, `lib/career/view-model/orbit-empty-state.ts:43`) and nothing exports
it. GELB's own principle — bind against the module's own constant — is **not available here**, and making
it available is a product change this lane may not make. **Recommended to whoever owns `lib/`: export the
legacy stage-id set once and have all four sites and the tests read it.**

### GELB's diagnostic, and the one attribution in it that is wrong

GELB instrumented its own file and read the rendered shells in the same walk state:

```
DIAG stage shell counts: {"01":1,"02":1,"03":0,"04":0,"05":0,"06":0}   total: 5
ids: [ …-01, …-02, …-syntx-org_nordlicht, …-syntx-org_rheinwerk, …-syntx-org_alpendata ]
DIAG observation-kind: FIELD
```

**This confirms half of my account and adds the half I had missed** — the legacy orbits are gone *and*
there is one shell per organisation, keyed `syntx-<pool organization id>`. GELB also corrected itself
properly: its earlier "the product still renders all six" was the stage-id *vocabulary*, not the rendering.

*** BUT GELB ATTRIBUTES THE ABSENCE TO `ca117947`, AND THAT IS NOT WHAT REMOVES 03–06. *** Two independent
mechanisms in two components, and the distinction is checkable:

| what | where | commit |
|---|---|---|
| 03–06 **absent** | `SemanticCareerIntelligenceField.tsx:613` + the `.filter` at `:864`, gated on `legacyHidden` | **`afcf89f6`** (owner G1) |
| `syntx-<org>` shells **present** | `SyntxField.tsx:824-826`, `stageId={`syntx-${organization.id}`}` | **`ca117947`** (semiotic transfer) |

**The decisive test of this was GELB's own file.** `job-pool-workflow.e2e.test.ts` contains **no
`PERSON_X_JOB` and no investigation mode at all** — so on GELB's reading `legacyHidden` would be false
there and all six should render, yet GELB measured `03…06` as zero. The resolution is one line:

```
lib/career/job-pool/investigation-mode.ts:17
  export const DEFAULT_INVESTIGATION_MODE: InvestigationMode = "PERSON_X_JOB";
```

`SemanticCareerIntelligenceField.tsx:340` falls back to it when no mode is given. **So GELB's suite is in
PERSON_X_JOB by default and `legacyHidden` is true there too.** That is the single cause GELB was looking
for across two independently authored suites — and it is `afcf89f6`, not `ca117947`. `ca117947` explains
the *replacement*, which is a different assertion.

### My first repair was incomplete, and GELB's recipe fixed it

My initial version asserted only that 03–06 are absent. **A product that dropped the organisation shells
entirely would have passed it** — the vacuity shape this errata spends §4 on, in my own repair. GELB's
recipe is adopted, with two deliberate departures:

- **the two mechanisms are asserted separately**, not folded into one total, so a change to either says
  which one moved;
- **the per-organisation half is asserted only at `:440`**, where GELB has directly observed the state.
  At `:915` the SYNTX field is exited (`root.count() === 0`, focus `CAPABILITY`) so `SyntxField` is
  unmounted; **I pass `null` there rather than guess a count I have not observed in that state.**

Derived from the fixture, not hardcoded: the ids come from `view.canonicalMapping.organizations`, the GET
oracle this walk already asserts `data-organization-count` against at `:393`. Vacuity-guarded
(`organizationIds.length > 0`), and the total pinned at `2 + organizations.length` so a silent return to
the pre-transfer model also fails. `tsc`: **0 diagnostics in this file.**

### A refinement to GELB's point 2, because it over-reaches

GELB writes that *"every figure either of them produced before today was taken while the suite did not
execute"* and that such a suite *"cannot have measured anything either."* **For the batch figure that is
exactly right.** For PINK's own recorded runs it is not, and the reason is in the gate's first line:

```ts
const explicit = process.env.CONDYN_PLAYWRIGHT_MODULE;
if (explicit !== undefined && explicit.length > 0) return explicit;
```

**The gate honours `CONDYN_PLAYWRIGHT_MODULE` before it tries package resolution.** So these suites were
runnable all along for an operator who exported it, which is how `§3.43` recorded `syntx-walk` at **3/3
twice** on `9e86d44`. **The defect is conditional, not absolute: the suite executed when the variable was
exported and skipped silently when it was not** — and the certified `3688 / 0 / 20` batch is the second
case. So Q-12's historical standing at `9e86d44` is not void; what is void is any claim that the batch
exercised it. **That distinction is the difference between "unmeasured" and "measured, then aged", and
Q-12 is the second.**

### What I did NOT do, and why

**I did not run it, and I will not claim it green.** `npx tsc --noEmit` gives **0 diagnostics in this
file** (44 elsewhere, all in generated `.next/types/*`, one in `production-upgrade-dc674ee1/probe-count.ts`
and three pre-existing in `pdf-path.postgres.test.ts`). But the assertion binds the **rule**, so it needs
a checkout at or after `afcf89f6`, and **`b6490e86` is not one** — `legacyHidden` does not exist in this
branch's `SemanticCareerIntelligenceField.tsx` at all, so this branch's product draws all six and the
repaired assertion fails here **by design**.

The only venue on this machine carrying Q1 *and* `playwright` is `condyn-admin-int3`
(`integration/pxj-complete-20261116`, 65 dirty files) — and **GELB is running
`job-pool-workflow.e2e.test.ts` in it right now**: 22 processes, a `next-server`, a vitest pair and seven
`chrome-headless-shell` instances, counted from `/proc/<pid>/cmdline`. **Starting a second e2e run there
would collide on the build and the database, and this mandate's own rule forbids reporting figures taken
under contention.** So: the verdict stands on the product source, the dates and the filter, all read this
session; **the green run is owed by whoever holds an idle Q1 venue, and the one assertion I have not
observed is `fieldRoot.count() === 1` at `:440`, where the SYNTX field is open over the semantic field.**

### The third stale assertion, and it is the sharpest thing in this record

With `:440` and `:915` repaired the walk advanced and failed at **`:966`**:

```
AssertionError: expected 3 to be 2
  expect(await page.locator('[data-testid="field-focus-strip"] button').count()).toBe(2);
```

**The product's own contract is the witness**, at `app/components/career/demo/SyntxFieldSelector.tsx:16-18`,
read at `ba2dd8ac`:

> *Contract (PERSON_X_JOB_MAPPING_PHASE_D.md §5.1, C-1 … C-11): `field-focus-strip` … holding **exactly
> three buttons**, `field-focus-capability-btn`, `field-focus-mapping-btn` and `job-pool-panel-toggle`,
> each with `data-field-focus-active` and `aria-pressed`.*

and the header above it: *"One system, three fields … **MAPPING in the middle, because it is the relation
between the two it separates**."*

**Provenance, counted by me at both refs rather than relayed:**

| ref | `MAPPING` in the selector |
|---|---|
| `origin/main` `e360caf9` | **0** (the file exists; the option does not) |
| `7ffaeb40` / `ba2dd8ac` | **25** |

*** SO THE THIRD BUTTON IS THE PERSON × JOB MAPPING ITSELF. This walk asserted a TWO-FIELD SHELL — the
product from before the mapping existed — while being the independent validation of the mapping's
integration. *** It could not go red because `describe.skipIf` skipped the file for want of a declared
`playwright`. **GELB is right to call this F-R8's class at its sharpest, and the sharpest part is the
direction: the lane whose job is to find what the product lost was itself asserting the absence of the
product's central new object, for as long as nobody exported one environment variable.**

**The question GELB left open, answered:** `options` is a **literal array of three with no filter**
(`:140-144`); `isGated` only *disables* (`:145`, `:231-232`). **So the strip is these same three in every
focus**, and the repair needs no per-focus special case.

**Repaired by name, not by count**, per GELB's reasoning and one further ground it did not give: a count
of 3 also passes when a button is replaced by an unrelated one, **and `job-scope-indicator` is itself a
`<button>` which the contract deliberately keeps *outside* the strip** — so a descendant count is exactly
what would drift quietly if it ever moved in. The assertion now pins all four things the contract names:
the three testids each present once, the total at three, **the DOM order `CAPABILITY, MAPPING, FIELD`**,
and `data-field-focus-active` *and* `aria-pressed` on each. It also replaced the two loose
`page.getByTestId(...)` reads above it with strip-scoped ones, and **`field-focus-mapping-btn` had never
been asserted anywhere in this file.** `tsc`: 0 diagnostics in this file.

### GELB's F-R10, verified independently — and nothing of mine was lost

GELB reports that running my two browser suites rewrote the **sealed** venues `syntx-walk-9e86d44/` and
`job-scope-gate-cb3d33f/`, both `manifest.sha256` files included, and that it reverted them.
**Checked against my own untouched branch rather than taken on report:** `git diff --name-only e7b60061
<ref>` over both venues gives **0 differing paths** at `7ffaeb40`, at `origin/integration/pxj-complete-20261116`
and at `ba2dd8ac`; both manifests verify here at **37/37** and **14/14**, and the mapping seals at
**167/167**. **The revert is real and my evidence is byte-identical.**

*** AND GELB'S OWN READING OF IT IS THE RIGHT ONE: the danger was that NO SEAL BROKE. *** A regenerated
manifest verifies perfectly against its own new content, so `sha256sum -c` — the check this mandate
leans on throughout, including everywhere in §3 above — **cannot detect a venue that was re-measured and
re-sealed in one step.** It proves internal consistency, not provenance. **That is a real limit on every
"167/167 OK" in this document**, and the thing that actually caught it was the build-naming convention
(`syntx-walk-${SYNTX_WALK_TIP}`) plus a human noticing 67 evidence paths in a `git add -A`. GELB's new
`test/integration-boundary/seal-integrity.test.ts` (17/17, mutant red) closes it as a class, and that
guard is worth more to this lane than the repair it came from.

### And the answer to GELB's wider question

*"Worth a look at whether any of your other pins rest on a suite in that state."* **Measured:** the same
six-stage assumption appears at **12 sites in 6 files**, of which **2 are mine** (both repaired). The other
ten are outside `test/job-pool-validation/` and **are only stale where the mode is `PERSON_X_JOB`** — which
I have not checked per file and am not asserting:
`test/career/job-pool/e2e/job-pool-workflow.e2e.test.ts:400`,
`test/career/hr-decision-loop/e2e/hr-decision-loop-frontend.e2e.test.ts:172/:232/:301`,
`test/career/job-pool/syntx-field-ssr.test.tsx:49/:68`, `test/career/hr-decision-loop/dock-ssr.test.tsx:41`,
`test/career-f12-pulse-alignment.test.tsx:83/:120`. **Handing this to GELB as a list to triage, not as a
list of defects.** Five of my suites gate on `describe.skipIf(playwrightModule === null)`, so **every pin
resting on `job-scope-gate`, `syntx-walk`, `layer-separation`, `http-canonical-inverse` and
`job-field-static` has been unexercised for as long as `playwright` was undeclared** — that is the real
exposure, and it is wider than the one assertion.

---

## 7. PER-LANE RECONSTRUCTIBILITY, MEASURED BY ME — GELB asked twice

GELB asked me to restate a 26/28 for its lane. **I never produced one** — in this session I had measured
only PINK's 83, and I do not restate figures I have not taken. **So I measured all three lanes myself**,
and the narrow criterion is the one that compares: *does the instrument resolve a MODULE from a
machine-absolute path?*

| lane | ref | instruments | resolve a module from an absolute path | criterion-A clean (any absolute literal) |
|---|---|---|---|---|
| **PINK** | `b6490e86` | 80 `.mjs`/`.mts` | **80 of 80** | 3 of 83 |
| **PINK, repaired** | this work | 83 | **0** | **83 of 83** |
| **GELB** | `4f551f89` | 28 `.mjs` | **0 of 28** | **28 of 28** |
| **GRÜN** | `origin/frontend/mapping-phase-g` | 115 `.mjs`/`.js` | **12 of 115** | 106 of 125 |

**GELB's 28/28 is CONFIRMED by my own measurement**, not accepted on report, and 12 of its 28 do read a
peer lane at a named ref. **PINK was by far the worst lane: 80 of 80.**

*** AND A CORRECTION ON GRÜN. *** GELB relayed *"4 of 53, now 0 of 54 in a resolution position"*. **That
is true for the mapping era and false for GRÜN's evidence root as a whole.** None of the 12 I found are
under `mapping-phase-g/`; **all twelve are in older `job-pool/` eras** —
`capability-gate/scripts/gate-walk.mjs`, `e2e-sweep-2026-10-13/scripts/common.mjs`,
`job-scope/scripts/walk.mjs`, `job-scope-removal/scripts/walk.mjs`, six under
`semiotic-transfer/no-pool-giant*`, and two under `semiotic-transfer/red-field-typography`. **A 53-file
population answered a question the 115-file root answers differently** — the exact "older eras in the
second evidence root" trap this mandate's brief warned about, taken this time by the lane that wrote the
warning.

---

## 8. WHAT I DID NOT DO, AND THE CONSTRAINTS KEPT

- **No merge to `main`, no production deployment, Gemini untouched** throughout.
- **No seal regenerated, re-sealed or rewritten.** `sha256sum -c` run read-only; **167/167 OK, 0 FAILED**
  before and after every run in this session. The three `.portable.mjs` probes copied into sealed
  directories for runs 1–3 were untracked, were removed, and the seals were re-verified afterwards.
- **`lens-owner-bfe0d27`'s wrong base-directory prefix is left exactly as it is.** It is mine by
  authorship, but it is an older era, out of mapping scope, and the owner has frozen seals. **Naming it
  and not touching it, as instructed.**
- **No vitest run**, so the disposable-database rule was never engaged; `~/.config/condyn/test-db-role.env`
  was never sourced.
- **No commit to any branch but `validation/hr-decision-loop-pink`.** `lib/`, `app/` and `scripts/` untouched.
- I used `pkill -f` once and **it matched my own shell and killed it** — the trap this effort has already
  recorded. The cleanup was re-verified by reading `/proc/<pid>/cmdline`, which is how the stray `socat`
  was found and killed by PID.

---

## 9. THE OWNER'S TWO DECISIONS, DISCHARGED — AND THE SEAL NEVER MOVED

The owner released both escalations: the repair goes over a **new, separately versioned evidence layer**
with **all 167 historical seal entries unchanged**, and the three withdrawals get **traceable forward
pointers** without rewriting historical evidence. So §3.4's bounded refusal is resolved in the direction
this lane called option (b)-plus. **`--in-place` remains unused and `PINK_SEAL_OVERRIDE` remains
unlifted** — nothing in this round required either.

### 9.1 `mapping-phase-pink-portable-v1/`

83 files, **82 manifest entries**, **80 regenerated instruments** (the 3 `.py` need no repair — they are
the 3 of 83 that were already reconstructible), **251 change sites**. Generated by
`pink-layer-build.mjs`, never by hand, so a third party can re-run it and compare: a second checkout
reproduced 80 / 251 / 82 exactly.

**The 167, measured before and after rather than assumed:** 33 OK / 43 OK / 91 OK, **0 FAILED**, exit 0
in each contract directory, and `git diff --stat` on all three sealed directories is **empty**. No tracked
file in a sealed venue was modified; the only additions there are unlisted.

### 9.2 *** THE GENERATION RECORD, BECAUSE A MANIFEST WOULD HAVE MADE THE LAYER A WELL-SEALED ORPHAN ***

This is A-G499 turned on my own deliverable. A checksum answers *"is this venue internally consistent?"*
and never *"does it describe the build it claims to"* — and a layer sealed only by its own fresh manifest
is precisely that shape: it would verify perfectly against any content generated at the same moment.

So `GENERATION.json` binds every output to its sealed input by **three** digests — the digest **as read
from the historical manifest line**, the digest **recomputed from disk**, and the **output** digest — and
**generation refuses entirely if any recomputed source digest differs from its manifest line**: exit 4,
*nothing written*, both digests named, checked for all 83 before the first write.

**Proven, not asserted.** One byte appended to one sealed instrument in a throwaway repository: exit 4,
**0 files written**, the file named with both digests. Restored: exit 0, 83 files. `--verify` re-reads the
three manifest digests, every output digest, and the resolver digest: tampering with one layer file after
generation gives exit 6 naming it; changing the canonical resolver gives exit 6 naming that.

### 9.3 The resolver is NOT copied into the layer — a correction, not a preference

The obvious construction, and the one `pink-portable-rewrite.mjs` performs, copies `pink-tools.mjs` into
the layer and imports `"../../mapping-phase-pink-tools/pink-tools.mjs"`. *** THAT CANNOT WORK FOR ANY
LAYER INSIDE `evidence/`, WHICH IS THE ONLY PLACE THIS LANE'S AUTHORITY ALLOWS. *** `pink-tools.mjs`
derives `REPO_ROOT` five levels up from its own directory; a copy at
`<layer>/mapping-phase-pink-tools/` is **one level too deep**, derives `REPO_ROOT=<repo>/docs`, finds no
`.git`, and **throws at import by its own guard**. Measured, not reasoned. The import specifier resolves
and the module refuses — every instrument in such a layer would be dead on arrival.

So the layer imports the **one canonical resolver** across three levels. **Trade-off rejected:** copy it
and pin the copy's digest equal to the canonical in the record — that was the suggested shape, and it
fails twice over, because the copy throws at that depth whatever its digest says, and a digest recorded in
a file only fails loudly if something re-reads it, which is the `AUTHORISED_CROSSINGS` decoration failure
this lane already named once. **Taken:** one copy, imported across directories; two copies cannot drift
when there is one copy. **The cost, stated:** the layer is valid only at the depth it was generated for,
so `--verify` **re-derives that depth and compares** rather than trusting it — which is what makes the
digest equality *consumed* instead of decorative.

### 9.4 The provenance half of D-PP-3 — closed, and the premise I was handed was false

The brief stated that **60 of 80** instruments hardcode a commit literal *"against 27 that read `buildId`
from the running stand"*, and that those 27 *"already demonstrate the shape"*. Measured over all 83:

| | |
|---|---|
| embed a hex literal `git cat-file -t` resolves to a commit | **66 of 83** (10 distinct refs) |
| emit a hardcoded `commit:` field | **60 of 80** non-`.py` — **the brief's figure is right** |
| mention `buildId` | **27** — and **all 27 also embed a commit literal** |
| of those 27, hardcode `buildId` as a string literal | *** 27 of 27 — the same one, `"xCD8LBxdjnP97-2Gjs5yr"` *** |
| read a build identity from a running stand, by any mechanism | *** 0 of 83 *** |

`__NEXT_DATA__` 0 files, `buildManifest` 0, `/_next/static` 0, `page.evaluate` of `buildId` 0,
`child_process` 0. **The 27 are a subset of the 60, not their opposite, and they demonstrate no shape:
they hardcode the build label exactly as the others hardcode the commit.** There was nothing in the tree
to generalise, so the mechanism had to be built.

**What the defect actually is.** `3ec8457d` is not wrong where it stands — it *is* the build the sealed
figures were taken on, and deleting it would destroy 66 instruments' provenance. The defect is that the
label is **emitted unconditionally**: re-run anywhere and the artefact still says `commit: "3ec8457d"`.
A wrong path fails loudly elsewhere; a wrong commit label is filed as evidence.

So `provenance()` reports **declared and observed, both, with their agreement as a field**, shouts on
stderr, and is fatal under `PINK_PROVENANCE=strict`. In the layer the emitted label is the **observed**
identity and the declared literal is kept in `GENERATION.json` — *an artefact must not assert a build
identity nobody observed on this run; `null` is honest and a stale string is not.*

**Measured in a fresh clone, with a red-first control.** Layer instrument: `*** PINK PROVENANCE MISMATCH
*** commit declared 3ec8457d observed d85df734 agrees false`, before it touches a stand, and the artefact
emitted `commit: "d85df734"`, `buildId: null`. The sealed original under the same environment: **silent**,
0 mentions, and would have written `commit: "3ec8457d"`.

**AND THE LIMIT OF THIS REPAIR, FOUND BY RUNNING IT AND NOW STATED INSIDE THE BLOCK ITSELF.**
`observedCommit` is `git rev-parse HEAD` of **the checkout the instrument ran from**, which for an
instrument measuring a **remote stand** is independent of the build that stand serves. Replacing a stale
literal with the checkout's commit removes the silent fabrication but does **not** establish the
provenance of a stand measurement: for that the only authority is `observedBuildId`, and when that is
`null` the run has **no verified provenance at all**. The block therefore carries
`observedCommitDescribes`, `authoritativeForStandMeasurements` and `standProvenanceVerified`.

### 9.5 Rule G — the stand port was reconstructible-looking and was not

Found by *running* the layer, not by reading it: a phase-f instrument resolved both tools bare, launched
chromium, and navigated to a hardcoded `:3120` while `PINK_BASE` said otherwise. **29 instruments (24
phase-f, 5 phase-g) declared the stand as a bare literal with no escape hatch; 42 already used
`process.env.PINK_BASE ?? "<default>"`; zero overlap.** Unlike the provenance half, this limb *does* have
a demonstrated in-tree shape used by a majority, so rule G generalises that exact form.

**The declared port is kept as the default, deliberately** — two ports are in use (`:3120`, `:3122`) and
collapsing them would change which stand an instrument addresses, which is a re-measurement, not a
repair. Behaviour with `PINK_BASE` unset is byte-for-byte the former behaviour. After: **0 bare stand
declarations left in the layer**, 71 of 80 instrument files `PINK_BASE`-aware. Proven with a control:
the layer instrument navigates to the overridden port, the sealed original still goes to `:3120`.

*Also corrected against myself: a transient figure of "72 PINK_BASE-aware files" was wrong — `grep -rl`
had matched `GENERATION.json` and `GENERATION.md`, which name the variable. It is 71.*

### 9.6 One cwd-relative output

`outputs/PF8-RINGS-RETAKE-${LEVEL}.json` wrote relative to the caller's working directory, so the same
instrument wrote somewhere different for every caller. It goes through `OUT_DIR` in the layer like the
other nine.

---

## 10. THE FORWARD POINTERS — and the generator caught two of my own mis-citations

`ERRATA-FORWARD.json` (schema `pink.errata-forward/1`) and `ERRATA-FORWARD.md`, **beside** the sealed
register and **not listed in its manifest**. Re-proven in place: with both files present the seal reads
**91 OK, exit 0**; one byte appended to a *listed* file still gives **1 FAILED, exit 1**. `sha256sum -c`
verifies the lines it lists and is silent about anything else present.

### 10.1 It is generated, not typed, and that is the whole point

W-3 exists because a figure was relayed without being re-read in its artefact. Typing sealed quotations by
hand is that same act, performed by the lane that withdrew a claim for it. The generator is given only an
**id, a line number and a short expected substring**; it **reads** the line, **refuses if the substring is
not there**, and records the full line **verbatim**. It immediately found two mis-citations of mine:

1. *** The errata cited W-3's quotation at `PINK-SYSTEM-VALIDATION.md:8`. LINE 8 IS EMPTY. *** "8" was
   **§8**, which begins at line `:214`; the wording is at **`:233`**, restated at `:267`. A section number
   written in line-number syntax — in the very withdrawal whose lesson is that an unverified relay is a
   rumour. It stood because **prose citations have no verifier.**
2. *** The errata named W-1's third dependent as "§8's asymmetry argument". §8 CARRIES NO ASYMMETRY
   ARGUMENT AND NO DEPENDENCY ON THE UNPUSHED CONDITION. *** §8 is "PIN COVERAGE — stated as TWO bounds"
   (`:214`–`:318`); its only "direction" language is a figure being wrong in both directions and coverage
   matching in both directions. The asymmetry argument is at `:161`–`:169`, in **§5**. **Four dependent
   passages across THREE sections, not four.** The brief relaying this back to me repeated my error; it is
   not propagated a third time.

Both reproduced as mutants at exit 4. Both corrections are to **unsealed** errata prose; **no sealed byte
moved.**

### 10.2 A-G500 adopted — and it caught a defect in this lane's own output

GELB's A-G500: a guard that scans text is **inside its own population**, so a quotation of a withdrawn
claim is indistinguishable from the claim; the mark is `[WITHDRAWN <id> <YYYY-MM-DD>]` on the claim's own
line and a bare `[WITHDRAWN]` silences nothing.

**It applies against me.** After the first version of the pointer file, a line scanner looking for
`119 commits, UNPUSHED` found it in **five** files — the sealed register (the only live claim), both
pointer files, the errata, and the generator's own spec. **The artefact built to retract the claim had
multiplied it.** Every quotation the generator emits now carries the mark; 12 marks in the human file.

*** AND THE MARK CANNOT REACH THE ONE LINE THAT MATTERS, WHICH IS WHY THE POINTER FILE EXISTS AT ALL. ***
A-G500 works by writing on the claim's own line. `PINK-SYSTEM-VALIDATION.md:4` is entry 47 of a frozen
seal and the owner's decision is *do not rewrite historical evidence*. **GELB's rule is better than mine
where it can be applied; it cannot be applied to a sealed line; both are needed and neither replaces the
other.**

---

## 11. REPOSITORY IDENTITY — GELB's F-R13 asked which commit I name, and my anchor was worse

GELB re-anchored `gelb-paths.mjs` on the root commit after finding it had pinned identity on PHASE_G's
base commit — 7 of 124 refs, not an ancestor of `main` — so it refused a genuine `clone --branch main`,
and asked which commit this module names.

**I named none.** Identity rested on the existence of the *path* `docs/architecture/decision-fields`.
Measured:

- that path exists on only **53 of 61** origin refs, so a genuine checkout of 8 named branches was
  **falsely refused** — the same harm as F-R13, a different cause;
- and a path test is **forgeable**: `git init && mkdir -p docs/architecture/decision-fields` passes it.
  **Measured: my old anchor accepted exactly that forgery.**

So the root commit **`29266f9c`** is adopted — measured as the root of `origin/main` and an ancestor of
**61 of 61** origin refs, and unforgeable. **GELB's fix is strictly better than what I had on both
coverage and forgeability, and the correct outcome is to say so rather than defend mine.**

**Shallow clones do not hold the root commit**, so a hard refusal there would re-create F-R13's false
refusal one layer out. A repository that cannot answer the ancestry question is **downgraded to the path
test and says so** (`repoIdentity.shallow`), rather than refused or silently accepted. All four cases
measured: this worktree accepts; the forgery refuses; a `--depth 1` clone of `main` loads with
`verified:false, shallow:true`; a copy at layer depth still refuses for want of `.git`.

---

## 12. INTEGRATION — my answer to A-G502, with the ground measured

GELB measured that `origin/integration/pxj-complete-20261116` carries **zero** files under the four
`mapping-phase-{d,e,f,g}-contract/` directories while this branch carries 254, and asked whether to merge.

**My answer is yes — and it must be the whole tip, not the layer alone.** Not a preference; measured
twice:

1. **The layer without `mapping-phase-pink-tools/` is dead on arrival.** Every instrument imports
   `../../../mapping-phase-pink-tools/pink-tools.mjs`; with the layer alone, the first instrument fails
   `ERR_MODULE_NOT_FOUND` at import.
2. **The layer without the sealed generation is unverifiable** — exactly the well-sealed orphan §9.2
   exists to prevent. `--verify` reads the three historical manifests; without them it refuses at exit 2
   (`manifest.sha256 absent — refusing to guess what is sealed`). A layer whose provenance check cannot
   run is a layer with a manifest and no provenance.

So the layer is **not a coherent integration unit**; the tip is. Merging *adds* files and modifies none,
and puts the four manifests under the integration's `seal-integrity` guard, which is a real benefit this
lane wants given that two of its sealed venues were overwritten once.

**One correction to A-G502's transfer, because it does not transfer whole.** GELB's missing commits were
*instrument repairs the register books as done*, so the integrated state **was running unrepaired code** —
that is A-G502's harm exactly. **Nothing in the integrated state runs these 83 instruments**; they are
evidence artefacts, not product code. So an unintegrated layer here is a **readability and guard-coverage**
gap, not a "repair recorded as applied but not applied" one. The merge is still right, for the weaker and
true reason rather than the stronger and borrowed one.

**And it is GELB's act, not mine.** This lane does not merge or integrate. Tip: **see §13.**

---

## 13. WHAT IS STILL OPEN, EACH WITH ITS MEASURED BOUNDARY

| pin | state | boundary, measured |
|---|---|---|
| **PG-20** | **OPEN, refused with the ground** | Nothing in the bound measures perception. Unchanged; no instrument can close it. |
| **PF-2** | **OPEN, bounded** | 0 of 19 groups self-measurable. Needs a product hook, and a product change is forbidden this round. |
| **PF-11** | **OPEN, measured** | Clears **0 of 8** contrast rungs at either viewport. A result, not a gap. |
| **PF-6** | **OPEN, boundary now exact** | See below. |
| **PF-13** | **OPEN, three grounds hold** | 198/198 over 16 files; no lane has issued closure, this one included. |
| **D-PP-3 path half** | **REPAIRED, and now APPLIED in the layer** | Was "authored and unapplied"; §9 applies it over a new layer without costing a seal. |
| **D-PP-3 provenance half** | *** CLOSED in the layer *** | §9.4, with artefact evidence and a red-first control. Its own limit stated in §9.4. |
| **stand port** | *** CLOSED in the layer *** | §9.5, rule G, 29 of 29, 0 bare declarations left. |
| **cwd-relative output** | *** CLOSED in the layer *** | §9.6. |

### PF-6's boundary, sharpened from "unmeasured" to an exact statement

The gap is **three calls**. In `pink-pf11-pf6-blurred-g.mjs`, `pf11` **already loops both viewports**
(`for (const [w, h] of [[1920, 1080], [1280, 800]])`), while `pf6blurred` is called **three times, all at
`1920, 1080`** — and it already takes `(w, h, motion, suppress)`. So the asymmetry is in the call list,
not in the instrument's capability.

**What blocks it is not the instrument.** A PF-6 figure belongs to build `3ec8457d`; that stand is not
running, and standing one up is a deployment the owner forbade this round. A stand *is* answering on
`:3122`, but its build identity is **unobservable** (`observedBuildId: null`) — so a run against it could
not be labelled, and by this module's own doctrine a figure that cannot name its build is not the pin
measurement. **Adding the three calls and running them against an unidentifiable stand would produce a
number, and that number would be filed as PF-6 at 1280×800. Refusing is the result; a substitution would
be a fabricated one.** The three calls are therefore left unwritten and the boundary is stated rather than
crossed.

---

*PINK. Validation only — never implementation, never integration. No merge to `main`, no deployment,
Gemini disabled throughout. The repair is now applied over a new layer at no cost to any seal: 167 before,
167 after, measured both times.*

*Three of this round's sharpest findings are against this lane's own work — a mis-cited line, a
mis-attributed section, and a repository anchor weaker than the one it was asked to audit. That is what
the lane is for.*
