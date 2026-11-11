# Three decisions waiting on the owner

**Verdict: NONE** on all three. This lane takes no product decision (A-G36 point 2). Written per A-G248 so
each can be read without a lane present. **They are independent** — any one can be answered alone, and
answering none is itself a decision this file tries to make legible rather than to press.

Nothing in the product has changed while they have been open: the delta from `3ec8457d` is **one**
`RING_LUMINANCE.shelf` hunk (0.02 → 0.022, A-G62), decided by GELB. Everything else in 34 commits is
instrument, evidence and comments.

---

## 1 · `CROWDING`: stays at 0.3, or moves to 0.5?

**What it is.** The record bounds PG-16 at **0.5** (A-G156); the build is `export const CROWDING = 0.3`.
Both values have been live in different documents since §11, so **the record currently describes an artifact
that does not exist.**

**What moves if it goes to 0.5.** `CROWDING-0.3-TO-0.5-WHAT-MOVES.md` has the rows. In short: **it removes
bodies from the field** on 9 of the 11 layouts that have roles, none gains, and the largest proportional loss
is on the *smallest* layout — LV02 goes **6 → 3**, half its bodies, and never touches `BODY_BUDGET` at all.

**Needs:** nothing. No credential, no server, no tooling. **A judgement.**

**If unanswered:** the divergence stays, and every statement about either constant has to say which artifact
it means. That is survivable — it is written into the registry entries — but it has already caused two
withdrawn adjudications in other lanes.

---

## 2 · `TEST_DATABASE_ADMIN_URL`: supplied, or the seven items cancelled?

**What it is.** `test/support/database-isolation/global-setup.ts` refuses every vitest run unless
`DATABASE_URL` names a verified disposable test database; the sanctioned path, `npm run test:isolated`, needs
`TEST_DATABASE_ADMIN_URL`, and this worktree has no `.env`. **The gate is fail-closed and is not a lane's to
bypass** — five of the seven items held behind it open no database at all, and that does not matter.

**What it unblocks, in this order:**

| | item | why it is gated |
|---|---|---|
| 1 | A-G43 · the splay re-keying + its mutant test | a product change needs its suite |
| 2 | A-G49 · `data-*` hooks for the glows, the seven unaddressable seats, A-G199's shelf halo | changes rendered DOM |
| 3 | A-G48 · an L2 fixture with a field body, so PG-10 has a breathing carrier | new fixture |
| 4 | A-G51 · an L1 fixture that marks a body | new fixture |
| 5 | the PG-20 mutant's execution | converts implemented-and-held into implemented-and-proven |
| 6 | option (3), only if PINK's verdict calls for it | touches two test files |
| 7 | A-G206's span declarations in front of items 3 and 4 | part of those fixtures |

**Needs:** one connection string, e.g. in `.env.local` as
`TEST_DATABASE_ADMIN_URL=postgresql://user:pass@localhost:5432/postgres`.

**If unanswered:** these seven stay blocked indefinitely. **That is a legitimate outcome** — but it should be
chosen rather than inherited, because the queue has been carried as "pending" for long enough that it reads
as work in progress. **Cancelling it is a one-word answer and this lane will stop surfacing it.**

---

## 3 · Starting a local build and server: permitted, or not?

**What it is.** PG-23's second limb needs `getComputedStyle` on a rendered page across the breath cycle. That
needs `npm run build`, `next start` on `127.0.0.1:3221`, and the fixture façade on `3220` — all loopback-only,
no provider reachable, Gemini untouched. **This is the only item a different permission unblocks, and it is
separable from the credential entirely.**

**What is already done without it.** The pin's *source* limb is delivered and passing
(`pg23-alpha-source.json`): no rule that animates opacity can reach a shelf halo, established from the
component's own stylesheet with the rules found rather than listed. **That covers every state at once**; the
remaining limb only confirms a browser agrees.

**Needs:** one word on starting a build and a local server.

**If unanswered:** PG-23 stands on one limb of two, which is a stated gap rather than a hole — and the
instrument has no computed-style reader, so nothing else in the queue wants this permission.

---

## What this file does not do

It does not recommend a value for `CROWDING` — that is product taste and R23's own range is unrecorded in the
document (the registry flags it on `PG-16.crowding`). It recommends nothing on items 2 and 3 beyond **giving
an answer either way**, because an unanswered queue costs more than a cancelled one: a cancelled item stops
being carried, and an unanswered item is re-surfaced in every report by every lane.
