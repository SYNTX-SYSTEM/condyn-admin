# GELB · INTEGRATION TRIAL 2026-11-16 — what integrating the mapping actually costs

**Branch `integration/mapping-trial-20261116`, local only, NEVER PUSHED, NOT an integration.**
Base `architecture/mapping-phase-f` @ `385214f9` (= `origin/main` + GELB's lane), merged
`frontend/mapping-phase-g` @ `7b4d5852` (GRÜN's tip, 100 commits unpushed).

Purpose: measure the integration gap named in `SFE-ABSCHLUSSBERICHT-GELB.md` §11.10 instead of
estimating it. Run in its own worktree so neither peer's checkout moved.

## What merged

| | |
|---|---|
| files merged clean | **166** |
| product files (`lib/` `app/`) | **9 files, +1809 / −257** — the field +1275, the view model +371, the copy +191, the selector +123 |
| conflicts | *** EXACTLY ONE *** |

**The one conflict is `test/career/mapping-field/architecture.test.ts` — the guard whose job is to
decide what may change.** Both lanes had rewritten it independently: GELB inline with a prose
re-statement of the B-ENTRY exception (§91 A-G411), GRÜN as closed per-phase commit ranges.

**Resolved in GRÜN's favour, and on a principle rather than on recency:** GRÜN's form closes each
phase's range at the next phase's base, so later commits fall outside by construction. That is
exactly what GELB's own docstring demanded — *"NOT BY WIDENING THE FILENAME SET"* — achieved
structurally instead of in prose.

## What the merged tree then measured

```
test/career/mapping-field + test/career/mapping-spec, disposable DB, true exit code 1
  Test Files  1 failed | 15 passed (16)
       Tests  2 failed | 196 passed (198)
```

**196 of 198 pass. Both failures are MAP-G-ARCH, and both have ONE cause.**

1. `every phase-G change set touches only the phase-G entry set …; no merge commit after the base`
   — carries the literal assertion
   `expect(git("log","--merges","--format=%H",`${phaseGBase()}..HEAD`)).toEqual([])`.
2. `the layout bump is a bump, and nothing else in lib moves` — the open-ended `phaseGBase()..HEAD`
   range now contains the other lane's commits, so legitimately-changed files read as violations.

> *** THE PHASE-G ARCHITECTURE BOUNDARY, AS WRITTEN, FORBIDS ITS OWN INTEGRATION. *** It is not a
> defect in GRÜN's work — the guard is doing precisely its job. It was written for a single-lane
> phase, and the phase now has to be merged. **A boundary that cannot be crossed by the merge it
> exists to protect is a boundary that has outlived its range, not one that has been violated.**

## The adjudication this calls for (GELB's, A-G485)

Phase D, E and F each had this open-endedness and GRÜN's §8 (6) closed each at the next phase's
base. **Phase G has no successor base — so the integration base becomes it.** The rule:

- close phase G's range at a declared `PHASE_INT_BASE`, exactly as D/E/F were closed;
- restate the merge clause as *no merge commit inside phase G's own CLOSED range*, so the
  integration merge sits outside it legitimately rather than by exemption;
- **no filename whitelist**, for the reason GELB's own A-G411 docstring gives.

**Implementation is GRÜN's**, in GRÜN's file: this lane adjudicates the pin, it does not rewrite
the peer's instrument — the MAP-C-ARCH precedent (§2 AUTHORITY, `AUTHORISED_CROSSINGS`).

## Boundaries kept

No merge to `main`, nothing pushed, `test/job-pool-validation/*` and PINK's worktree untouched,
B-ENTRY unchanged and unbypassed (database created, verified, dropped), Gemini off.

> ⚠ **CORRECTED 2026-11-16, AND THE FIRST FORM OF THIS LINE WAS FALSE.** It read: *"The trial
> worktree used a symlinked `node_modules`; that affects nothing asserted here."* **It affects nothing
> in the mapping-population and G1 readings above — neither boots Next — and it breaks every suite that
> does.** Measured: the full suite on the trial tree reported **4 failed files** where only **1** was
> real. The other three (`g2-g3-vertical-proof`, `hr-decision-loop-p7`,
> `local-decision-context-http.e2e`) each died on
> `TurbopackInternalError: Symlink [project]/node_modules is invalid, it points out of the filesystem
> root`, and 12 of their tests were skipped rather than run. Replaced with a hard-link copy
> (`cp -al`, a real directory): *** 3 files passed, 71 of 71 tests, exit 0. ***
>
> *** SO I WROTE A BLANKET "AFFECTS NOTHING" ABOUT MY OWN HARNESS AND IT LATER MISLED ME INTO READING
> THREE OF MY OWN ARTEFACTS AS INTEGRATION FAILURES. *** A-G483's lesson in its third costume today:
> an assurance about the measuring apparatus is itself a claim, and it needs the same scope statement
> as any figure. **The correct form names the population it holds over — here: every reading that does
> not boot Next.**
