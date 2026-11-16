/**
 * PINK · PF-2 MEASURABILITY PROBE — does the geometry carrier admit a DETERMINISTIC child choice?
 *
 * §23 voided PINK's PF-2 pixel reading on its own two-route disagreement detector: the routes span
 * 0.1002 to 45.6046 across four snapshots, a spread of 455.1x (re-read in
 * outputs/PF2-DIM-INVERSION-VOID-ATTEMPT1.json this session, so the figure is not relayed). §23 named the
 * cause: `[data-mapping-arc]` is a `<g>` that CARRIES the attributes, while the drawn mark is a CHILD of
 * it. Requiring getTotalLength on the attributed element yielded ZERO marks; picking the first measurable
 * child is not reliably the lit mark.
 *
 * *** THIS PROBE DOES NOT MEASURE PF-2 AND REPORTS NO RATIO. *** It answers only the prior question §23
 * left open: is there a rule that selects the lit mark from among a group's children without a
 * `querySelector` guess? Until that rule exists, any PF-2 pixel figure is inadmissible on §23's own
 * grounds, and producing one would be the thing this lane refuses.
 *
 * It is also the fifth independent exercise of pink-tools.mjs, in a NEW instrument rather than a rewritten
 * one — so the resolver is shown to work for instruments written after the repair, not only for the 80.
 */
import { playwright, BASE } from "./pink-tools.mjs";

const chromium = await playwright();
const AN = process.env.PINK_AN ?? "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
await page.waitForTimeout(1200);

const out = await page.evaluate(() => {
  const groups = [...document.querySelectorAll("[data-mapping-arc]")];
  const shape = g => {
    const kids = [...g.querySelectorAll("*")];
    const measurable = kids.filter(k => typeof k.getTotalLength === "function" && (() => { try { return k.getTotalLength() > 0; } catch { return false; } })());
    return {
      step: g.getAttribute("data-evidence-step"),
      declaredLum: g.getAttribute("data-evidence-luminance"),
      attributedElementMeasurable: typeof g.getTotalLength === "function",
      childCount: kids.length,
      measurableChildren: measurable.length,
      // the candidate discriminators a deterministic rule could use
      children: measurable.map(k => ({
        tag: k.tagName,
        len: +k.getTotalLength().toFixed(2),
        stroke: getComputedStyle(k).stroke,
        strokeWidth: getComputedStyle(k).strokeWidth,
        opacity: getComputedStyle(k).opacity,
        hasDataAttrs: [...k.attributes].filter(a => a.name.startsWith("data-")).map(a => a.name),
      })),
    };
  };
  const all = groups.map(shape);
  return {
    groupCount: all.length,
    attributedMeasurable: all.filter(a => a.attributedElementMeasurable).length,
    byMeasurableChildCount: all.reduce((m, a) => (m[a.measurableChildren] = (m[a.measurableChildren] ?? 0) + 1, m), {}),
    // is there a UNIQUE longest child? a unique opaque child? a child bearing its own data-*?
    uniqueLongest: all.filter(a => a.measurableChildren > 0 &&
      a.children.filter(c => c.len === Math.max(...a.children.map(x => x.len))).length === 1).length,
    childrenCarryOwnData: all.filter(a => a.children.some(c => c.hasDataAttrs.length > 0)).length,
    distinctOpacitySets: [...new Set(all.map(a => a.children.map(c => c.opacity).join("|")))].slice(0, 8),
    sample: all.slice(0, 4),
  };
});

await ctx.close(); await browser.close();
console.log(JSON.stringify({ probe: "PF-2 geometry-carrier measurability", url: URL, motion: "reduce", ...out }, null, 1));
