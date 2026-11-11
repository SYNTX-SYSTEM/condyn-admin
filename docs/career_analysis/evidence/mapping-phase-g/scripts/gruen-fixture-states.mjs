/**
 * GRÜN · PHASE-G · §84 — A-G48's L2 AND A-G51's L1, WITH A-G206's SPAN DECLARATION IN FRONT.
 * **NO VERDICT** (A-G36 point 2).
 *
 * B-7 IS INTACT AND THAT IS THE FIRST FINDING. A-G48 and A-G51 were carried as "fixtures" owed, and B-7
 * forbids inventing fixture data — "existing test data only". Both are reconcilable because NEITHER IS DATA:
 * `fieldLevel()` derives the level from the FOCUS MACHINE, not from a dataset, and `markedBody()` reads
 * `state.selection`. So L1, L2 and a marked body are STATES OF THE SERVED FIXTURE, reached by driving the
 * product's own interactions:
 *
 *   L1          click `[data-testid="mapping-pool-<poolId>"]`      -> act({type:"OPEN_POOL"})
 *   L2          click `[data-testid="mapping-body-<key>"]`         -> openFromBody()
 *   marked      HOVER or FOCUS a body (:744), and only while `selected === null`; it clears on blur
 *
 * The mark being transient is the part that had to be read from the source rather than assumed: it is
 * dispatched on `onMouseEnter`/`onFocus` and cleared on `onMouseLeave`/`onBlur`, so a probe that clicks and
 * then looks has already lost it. This one holds focus and reads in the same breath.
 *
 * NOTHING IS ASSUMED TO HAVE WORKED. Every state is confirmed from the product's own disclosure —
 * `data-level`, `data-pool`, `data-role` on `[data-testid="mapping-field"]` (:792) and `data-marked` on the
 * body — before anything is measured in it. A state the probe failed to reach is reported as NOT REACHED and
 * carries no readings, rather than silently measuring L0 four times.
 *
 * AND IT CARRIES THE TWO TARGETS GELB NAMED FOR A-G51, so the fixture decides something instead of existing:
 *   · `mapping-collar-more` — PINK cannot reach it (it renders at L1 and PINK's stand is L0), and §69 puts
 *     its character budget at 0.850 … 1.338 characters: left-anchored at the collar's right edge, so it
 *     needs its FULL width beyond that edge. Measured here as a rendered box against the room it has.
 *   · PF-4 limb 3's 0.18 path — §70 scoped the limb to "same focus state" and recorded 455.6 % at L1 for a
 *     body outside the focused pool as a DERIVATION from two source lines wanting a reading. `:695` is
 *     `const opacity = inPoolNow ? 1 : 0.18`. This is that reading.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, openField, servedProvenance, PROVENANCE } from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);

const browser = await chromium.launch();
let out;
try {
  const { page } = await openField(browser, { reduce: true, vw: VW, vh: VH });
  const provenance = await servedProvenance(page, WT);
  const field = '[data-testid="mapping-field"]';
  const stateOf = () => page.evaluate(sel => {
    const f = document.querySelector(sel);
    if (f === null) return null;
    const bodies = Array.from(document.querySelectorAll("[data-mapping-body]")).map(b => ({
      rank: Number(b.getAttribute("data-rank")), shelf: b.getAttribute("data-shelf") === "true",
      marked: b.getAttribute("data-marked") === "true", inPool: b.getAttribute("data-in-pool") === "true",
      lit: b.getAttribute("data-lit") === "true", named: b.getAttribute("data-named") === "true",
      opacity: Number(getComputedStyle(b).opacity), testid: b.getAttribute("data-testid")
    }));
    return { level: f.getAttribute("data-level"), pool: f.getAttribute("data-pool"), role: f.getAttribute("data-role"),
             bodies, markedCount: bodies.filter(b => b.marked).length };
  }, field);

  /**
   * RESET VIA THE PRODUCT'S OWN AFFORDANCE, and the reason is a defect this probe caught in itself.
   *
   * The first version pressed Escape twice. The field's Escape handler is `onKeyDown` on the <section>
   * (:798), so it only fires for events INSIDE the field — with focus on <body> the key never reaches it,
   * and the reset silently did nothing. The consequence was precise rather than vague: the L2 attempt began
   * at L1 with the OTHER pool still open, so the field body was not `inPool`, and `openFromBody`'s
   * `else if (level === "L1" && inPool(...))` correctly did nothing. The probe reported MISSED with
   * level=L1, which is the state verification doing its job — a probe that had trusted its own clicks would
   * have measured L1 and labelled it L2.
   *
   * `[data-testid="mapping-up"]` dispatches {type:"UP"} and is the product's own way out of a level, so the
   * reset now climbs with it and CONFIRMS L0 rather than assuming it.
   */
  /**
   * STATES ARE REACHED BY DISPATCHING THE PRODUCT'S OWN HANDLER, declared rather than implied.
   *
   * `page.click()` does hit-testing and, on this UI, SILENTLY LEFT THE STATE UNCHANGED WITHOUT ERRORING: with
   * a body marked, a coordinate click on `[data-testid="mapping-pool-…"]` reported success and the level
   * stayed L0, while `el.click()` on the same selector reached L1 immediately. Third green signal today that
   * meant nothing, after Turbopack exiting 0 with no build and `next start` reporting 200 on a LAN-exposed
   * port.
   *
   * WHAT THIS DOES AND DOES NOT CLAIM. `domClick` invokes the element's own click handler, so it establishes
   * that the STATE is reachable and that the handler is wired. It does NOT establish that a real pointer
   * reaches the control — Playwright's hit-testing is stricter than a browser's, and I have NOT determined
   * whether anything actually obstructs that chip while a body is marked. That is recorded as an open
   * observation below, not quietly converted into a pass.
   */
  const domClick = async sel => {
    const n = await page.$(sel);
    if (n === null) throw new Error(`no element for ${sel}`);
    /* `.click()` is an HTMLElement method. A body is an SVG <g>, which has no `.click`, so the first version
       of this helper threw `el.click is not a function` on exactly the state it was written to reach. React
       listens for BUBBLED clicks at the root, so a dispatched bubbling MouseEvent reaches the same onClick. */
    await n.evaluate(el => {
      if (typeof el.click === "function") el.click();
      else el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    });
  };

  const reset = async () => {
    for (let i = 0; i < 5; i += 1) {
      const st = await stateOf();
      if (st?.level === "L0") break;
      const up = await page.$('[data-testid="mapping-up"]');
      if (up === null) break;
      await up.evaluate(el => el.click());
      await page.waitForTimeout(140);
    }
    /* drop any transient mark by moving focus and the pointer off every body */
    await page.mouse.move(2, 2);
    await page.evaluate(() => (document.activeElement instanceof HTMLElement ? document.activeElement.blur() : undefined));
    await page.waitForTimeout(120);
    const st = await stateOf();
    if (st?.level !== "L0") throw new Error(`reset failed: still at ${st?.level} (pool ${st?.pool}) — every state below would start from the wrong place`);
  };
  const states = [];
  const record = async (name, want, drive, extra = async () => ({})) => {
    await reset();
    let driveError = null;
    try { await drive(); } catch (e) { driveError = String(e).split("\n")[0]; }
    await page.waitForTimeout(220);
    const st = await stateOf();
    const reached = driveError === null && st !== null && Object.entries(want).every(([k, v]) => (typeof v === "function" ? v(st[k]) : st[k] === v));
    states.push({ name, want: Object.fromEntries(Object.entries(want).map(([k, v]) => [k, typeof v === "function" ? "<predicate>" : v])),
      reached, driveError, level: st?.level ?? null, pool: st?.pool ?? null, role: st?.role ?? null,
      bodies: st?.bodies.length ?? 0, markedCount: st?.markedCount ?? 0,
      readings: reached ? await extra(st) : { skipped: "state NOT REACHED — nothing is measured in a state the probe did not reach" } });
  };

  /* the pools and a field (non-shelf) body, discovered rather than hard-coded */
  const pools = await page.evaluate(() => Array.from(document.querySelectorAll('[data-testid^="mapping-pool-"]')).map(b => b.getAttribute("data-pool")));
  const fieldBody = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("[data-mapping-body]")).find(e => e.getAttribute("data-shelf") === "false");
    return b ? b.getAttribute("data-testid") : null;
  });

  await record("L0 · resting", { level: "L0", markedCount: 0 }, async () => {});

  await record("L0 · a body MARKED by focus", { level: "L0", markedCount: n => n === 1 },
    async () => { if (!fieldBody) throw new Error("no field body to focus"); await page.focus(`[data-testid="${fieldBody}"]`); },
    async st => ({ markedBody: st.bodies.find(b => b.marked) ?? null,
                   note: "MARK_ROLE is dispatched on onFocus/onMouseEnter and cleared on blur, so this reading is taken while focus is held" }));

  await record("L1 · a pool open (A-G51)", { level: "L1", pool: p => typeof p === "string" && p.length > 0 },
    async () => { if (pools.length === 0) throw new Error("no pool chips"); await domClick(`[data-testid="mapping-pool-${pools[0]}"]`); },
    async st => {
      /* PF-4 limb 3's 0.18 path, read rather than derived */
      const inPool = st.bodies.filter(b => b.inPool), outPool = st.bodies.filter(b => !b.inPool);
      const op = xs => xs.length ? { min: Math.min(...xs.map(b => b.opacity)), max: Math.max(...xs.map(b => b.opacity)) } : null;
      const collar = await page.evaluate(() => Array.from(document.querySelectorAll('[data-testid^="mapping-collar-more-"]')).map(t => {
        const r = t.getBoundingClientRect(), body = t.closest("[data-mapping-body]");
        return { testid: t.getAttribute("data-testid"), text: t.textContent, chars: (t.textContent ?? "").length,
                 widthPx: +r.width.toFixed(3), heightPx: +r.height.toFixed(3),
                 bodyDrawnRadius: body ? Number(body.getAttribute("data-drawn-radius")) : null,
                 collarHidden: body ? Number(body.getAttribute("data-collar-hidden")) : null };
      }));
      return {
        PF4_limb3_0_18_path: { inPoolBodies: inPool.length, outOfPoolBodies: outPool.length,
          inPoolOpacity: op(inPool), outOfPoolOpacity: op(outPool),
          ratio: op(inPool) && op(outPool) && op(outPool).max > 0 ? +(op(inPool).min / op(outPool).max).toFixed(4) : null,
          sourceLine: ":695 const opacity = inPoolNow ? 1 : 0.18",
          note: "§70 scoped limb 3 to ONE focus state. This reading is what the 455.6 % derivation was waiting for: it is a reading of the FOCUS path, and §70's scoping is what keeps the limb from firing on it." },
        collarMore: { found: collar.length, elements: collar,
          budgetFrom_A_G296: "0.850 … 1.338 characters over PG-3's radius range, because the label is LEFT-ANCHORED at the collar's right edge and needs its full width beyond it",
          note: collar.length === 0 ? "none rendered in this state — :784 renders the span only when `floored > 0`, and §67 records that a disclosure conditional on being non-zero cannot be told from a removed one" : "measured as a rendered box" }
      };
    });

  /**
   * TWO CLICKS, and that is the product's rule rather than a workaround. `openFromBody` (:682) is a two-step
   * zoom: from L0 it opens the body's POOL, and only from L1, with the body in the open pool, does it open
   * the ROLE. A single click therefore lands at L1 — which is exactly what the first run of this probe
   * reported as MISSED, with level=L1. The probe was wrong and the product was not; recorded because anyone
   * reproducing A-G48's L2 state needs to know it is two interactions deep, and because a probe that had
   * assumed its click worked would have measured L1 and labelled it L2.
   */
  await record("L2 · a FIELD body open (A-G48)", { level: "L2", role: r => typeof r === "string" && r.length > 0 },
    async () => {
      if (!fieldBody) throw new Error("no field body to open");
      await domClick(`[data-testid="${fieldBody}"]`);            // L0 -> L1, opening this body's own pool
      await page.waitForTimeout(180);
      await domClick(`[data-testid="${fieldBody}"]`);            // L1 -> L2, opening the role
    },
    async st => ({ openRole: st.role, bodiesDrawn: st.bodies.length,
                   reachedBy: "two clicks on the same body — L0 opens its pool, L1 opens the role (:682)",
                   note: "A-G48 asked for an L2 fixture WITH A FIELD BODY so PG-10 finally has a breathing carrier; the body opened here is non-shelf by construction (data-shelf=false), which is the condition A-G48 names" }));

  const reached = states.filter(s => s.reached), missed = states.filter(s => !s.reached);
  out = {
    reading: "GRÜN · §84 — A-G48's L2 and A-G51's L1 as navigated STATES of the served fixture, with A-G206's span declaration",
    verdict: PROVENANCE.verdict,
    scope: "rendered-page interaction and computed style on a loopback build. No raster, no luminance, no sealed datum, NO NEW FIXTURE DATA.",
    provenance, viewport: `${VW}x${VH}`, motion: "reducedMotion:reduce — these are structural states, not breath readings",

    A_G206_spanDeclaration: {
      one_whatThisSpans: `Four focus states of ONE served fixture (${provenance.buildId}): L0 resting, L0 with a body marked by focus, L1 with a pool open, L2 with a FIELD body open. Within each, every drawn body's rank, shelf, in-pool, lit, named, marked and computed opacity, plus the two targets A-G51 was given.`,
      two_whatThisDoesNotSpan: "It spans ONE POPULATION — the five bodies of the shared ranking, 2 field and 3 shelf. It is NOT LV01-LV12: the twelve layout inputs exist as existing test data in test/support/mapping/vectors.ts (so B-7 permits them), but the façade serves one job-ranking payload and reaching the other eleven populations needs the façade to serve a chosen vector, which is a façade change and is NOT in this reading. It also does not span L3, a requirement open, or any raster quantity.",
      three_whatWouldWidenIt: "A façade route that serves `layoutInputs()[name]` as the job-ranking for a requested vector name. That is a transformation of existing test data rather than new data, so B-7 permits it; it is the next step and it is not pretended to be done here."
    },

    openObservation_coordinateClick: {
      what: "page.click() on the pool chip, with a body marked, reported success and left data-level at L0; el.click() on the same selector reached L1. Reproduced in isolation.",
      whatIsNotKnown: "whether a REAL pointer is obstructed. Playwright's hit-testing refuses a click whose target is not the topmost element at the point, and it is stricter than a browser; it may also have clicked a stale position. This probe does not resolve it and does not claim a product defect.",
      howToSettle: "read `document.elementFromPoint` at the chip's centre while a body is marked, and compare with the chip itself — a one-line check on a rendered page, and the right shape because it asks what is ON TOP rather than what a click does.",
      whyItIsRecorded: "a click that succeeds and changes nothing is the same family as Turbopack exiting 0 with no build and `next start` reporting 200 on a LAN-exposed port — three today. The generalisable part is that a tool's success code describes the tool, not the artifact."
    },
    statesAttempted: states.length, statesReached: reached.length,
    statesNotReached: missed.map(s => ({ name: s.name, driveError: s.driveError, levelSeen: s.level })),
    states,
    discovery: { poolChips: pools, fieldBodyUsed: fieldBody },
    finding: null
  };
  out.finding = missed.length > 0
    ? `${reached.length} of ${states.length} states reached. NOT REACHED: ${missed.map(s => s.name).join(", ")} — each carries no readings, because measuring L0 and calling it L1 is the defect this phase has found five times. ${missed.map(s => s.driveError).filter(Boolean).join(" · ")}`
    : `All ${states.length} states reached and confirmed from the product's own disclosure (data-level / data-pool / data-role / data-marked) before anything was measured in them. A-G48's L2 with a field body and A-G51's L1 are therefore STATES, not data — which is why B-7 was never actually in conflict with them, and the span declaration says exactly what is still owed: LV01-LV12 needs a façade route serving layoutInputs(), a transformation of existing test data rather than an invention.`;

  writeFileSync(resolve(here, `../outputs/fixture-states-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
} finally { await browser.close(); }

console.log(`served BUILD_ID ${out.provenance.buildId} · ${out.statesReached}/${out.statesAttempted} states reached\n`);
for (const s of out.states) {
  console.log(`${s.reached ? "REACHED " : "MISSED  "} ${s.name.padEnd(34)} level=${String(s.level).padEnd(3)} pool=${String(s.pool ?? "-").slice(0, 14).padEnd(14)} role=${String(s.role ?? "-").slice(0, 16).padEnd(16)} bodies=${s.bodies} marked=${s.markedCount}`);
  if (s.driveError) console.log(`         drive error: ${s.driveError}`);
}
const l1 = out.states.find(s => s.name.startsWith("L1"));
if (l1?.readings?.PF4_limb3_0_18_path) console.log(`\nPF-4 limb 3 · in-pool opacity ${JSON.stringify(l1.readings.PF4_limb3_0_18_path.inPoolOpacity)} vs out-of-pool ${JSON.stringify(l1.readings.PF4_limb3_0_18_path.outOfPoolOpacity)} · ratio ${l1.readings.PF4_limb3_0_18_path.ratio}`);
if (l1?.readings?.collarMore) console.log(`collar-more elements found: ${l1.readings.collarMore.found}${l1.readings.collarMore.found ? " -> " + JSON.stringify(l1.readings.collarMore.elements) : ` (${l1.readings.collarMore.note})`}`);
console.log(`\n${out.finding}`);
