/**
 * GRÜN · PHASE-G · §82 — DO THE A-G49 HOOKS AGREE WITH THE ROUTES THAT ALREADY EXISTED?
 * **NO VERDICT** (A-G36 point 2).
 *
 * PINK's acceptance standard, adopted by GELB for the whole hook set and used here as given: **set equality
 * against the two independent routes that already exist** — class membership and `animationName` — read on
 * the rendered page. PINK's reason, which is the whole point: *"the difference between verifying a hook and
 * letting it certify itself."*
 *
 * So this probe never asks "is the attribute there". It asks whether the partition the attribute induces is
 * THE SAME SET as the partition two older, independent routes induce. A hook that agrees with both is
 * verified; a hook that agrees with neither is wrong; a hook that agrees with one is a finding.
 *
 *   route 1 · THE HOOK          [data-mapping-halo][data-shelf="true"|"false"]
 *   route 2 · CLASS MEMBERSHIP  `.mf-halo > circle:not(.mf-wave-halo)` is the shelf set; `.mf-wave-halo`
 *                               the field set. PINK's §15 selector, which predates the hook entirely.
 *   route 3 · animationName     the browser's own resolved animation. A shelf halo is a still ring (A-F8)
 *                               and must carry none; a field halo breathes and must carry one.
 *
 * AND THE CROSS-CHECKS THAT NEED NO GEOMETRY, which is the point of the hook. The halo's `data-rank` /
 * `data-shelf` / `data-required-gaps` are compared as a MULTISET against the body elements' own, so halo and
 * body are matched by identity rather than by PINK's concentricity-under-2-px inference. And the one hue's
 * carrier is checked directly: the halos with `data-required-gaps > 0` must be exactly the halos filled with
 * `url(#mf-halo-gap)`, which PG-12's carrier previously had to infer from proximity.
 *
 * IT DECLARES ITSELF VOID AGAINST A BUILD WITHOUT THE HOOKS. The hooks are in source at 47e34329 and the
 * build the eight sealed readings were taken against PREDATES them and is deliberately preserved unchanged.
 * Pointed at that build, a naive probe would find zero hooked elements and could report "no disagreement".
 * Zero is not agreement, so a run that finds no hooked halo is VOID and says which build it was looking at.
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
  /* reduce:false — route 3 needs the animation running to be a route at all */
  const { page } = await openField(browser, { reduce: false, vw: VW, vh: VH });
  const provenance = await servedProvenance(page, WT);

  const dom = await page.evaluate(() => {
    const arr = s => Array.from(document.querySelectorAll(s));
    const sig = el => `${el.getAttribute("data-rank")}|${el.getAttribute("data-shelf")}|${el.getAttribute("data-required-gaps")}`;
    /* a stable identity for set comparison that does NOT use the hook: index within the SVG's element order */
    const all = arr("svg *");
    const idOf = el => all.indexOf(el);

    const hooked = arr("[data-mapping-halo]");
    const byClassShelf = arr(".mf-halo > circle:not(.mf-wave-halo)");
    const byClassField = arr(".mf-wave-halo");
    const animOf = el => { const a = getComputedStyle(el).animationName; return a === "none" || a === "" ? null : a; };

    return {
      counts: { hooked: hooked.length, byClassShelf: byClassShelf.length, byClassField: byClassField.length },
      hookShelf: hooked.filter(e => e.getAttribute("data-shelf") === "true").map(idOf).sort((a, b) => a - b),
      hookField: hooked.filter(e => e.getAttribute("data-shelf") === "false").map(idOf).sort((a, b) => a - b),
      classShelf: byClassShelf.map(idOf).sort((a, b) => a - b),
      classField: byClassField.map(idOf).sort((a, b) => a - b),
      animNone: hooked.filter(e => animOf(e) === null).map(idOf).sort((a, b) => a - b),
      animSome: hooked.filter(e => animOf(e) !== null).map(idOf).sort((a, b) => a - b),
      animNames: [...new Set(hooked.map(animOf).filter(Boolean))],
      haloSigs: hooked.map(sig).sort(),
      bodySigs: arr("[data-mapping-body]").map(sig).sort(),
      gapByAttr: hooked.filter(e => Number(e.getAttribute("data-required-gaps")) > 0).map(idOf).sort((a, b) => a - b),
      gapByFill: hooked.filter(e => (e.getAttribute("fill") ?? "").includes("mf-halo-gap")).map(idOf).sort((a, b) => a - b),
      haloRadiusMatchesR: hooked.every(e => Math.abs(Number(e.getAttribute("data-halo-radius")) - Number(e.getAttribute("r"))) < 1e-6),
      seats: Object.fromEntries(Object.entries(arr("[data-mapping-seat]").reduce((m, e) => {
        const k = e.getAttribute("data-mapping-seat"); (m[k] ??= []).push(e.tagName.toLowerCase()); return m;
      }, {})).map(([k, v]) => [k, { count: v.length, tags: [...new Set(v)] }])),
      seatGroupFlagged: arr('[data-mapping-seat][data-seat-is-group="true"]').map(e => e.getAttribute("data-mapping-seat"))
    };
  });

  const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
  const hooksPresent = dom.counts.hooked > 0;
  const agree = {
    hookShelf_vs_classShelf: same(dom.hookShelf, dom.classShelf),
    hookField_vs_classField: same(dom.hookField, dom.classField),
    hookShelf_vs_animNone: same(dom.hookShelf, dom.animNone),
    hookField_vs_animSome: same(dom.hookField, dom.animSome),
    haloSigs_vs_bodySigs: same(dom.haloSigs, dom.bodySigs),
    gapAttr_vs_gapFill: same(dom.gapByAttr, dom.gapByFill),
    haloRadiusAttrMatchesRenderedR: dom.haloRadiusMatchesR
  };
  const allAgree = Object.values(agree).every(Boolean);
  const SEVEN = ["shelf-band", "ring-best-fit", "ring-horizon", "ring-field", "ring-person", "node", "open-body-ring"];
  const seatsPresent = SEVEN.filter(n => dom.seats[n]);
  const seatsMissing = SEVEN.filter(n => !dom.seats[n]);

  out = {
    reading: "GRÜN · §82 — A-G49's hooks checked by SET EQUALITY against the two routes that predate them",
    verdict: PROVENANCE.verdict,
    scope: "rendered-page DOM and computed style on a loopback build. No raster, no luminance, no sealed datum touched.",
    standard: "PINK's, adopted by GELB for the whole hook set: set equality against class membership and animationName, on the rendered page. This probe never asks whether an attribute exists; it asks whether the partition it induces is the same SET as two older independent routes induce.",
    provenance, viewport: `${VW}x${VH}`, motion: "LIVE — route 3 needs the animation running to be a route",
    buildCarriesTheHooks: hooksPresent,
    counts: dom.counts,
    routes: {
      route1_hook: { shelf: dom.hookShelf, field: dom.hookField },
      route2_classMembership: { shelf: dom.classShelf, field: dom.classField, selector: ".mf-halo > circle:not(.mf-wave-halo) | .mf-wave-halo — PINK's §15 selector, predating the hook" },
      route3_animationName: { none: dom.animNone, some: dom.animSome, names: dom.animNames }
    },
    agreement: agree,
    crossChecks: {
      haloIdentityMultisetEqualsBodyIdentityMultiset: agree.haloSigs_vs_bodySigs,
      haloSigs: dom.haloSigs, bodySigs: dom.bodySigs,
      note: "rank|shelf|required-gaps as a MULTISET, so halo and body are matched by identity rather than by concentricity under 2 px — which is the inference the hook exists to replace",
      oneHueCarrier: { byAttribute: dom.gapByAttr, byFill: dom.gapByFill, agree: agree.gapAttr_vs_gapFill,
        note: "the halos with data-required-gaps > 0 must be exactly the halos filled url(#mf-halo-gap). PG-12's carrier previously had to infer this from proximity." }
    },
    seats: { expectedSeven: SEVEN, present: seatsPresent, missing: seatsMissing, detail: dom.seats,
             groupFlagged: dom.seatGroupFlagged,
             groupFlagNote: "arc-marks carries data-seat-is-group because selecting it does not select a painted mark — the A-G31 shape stated where it still applies" },
    finding: null
  };
  out.finding = !hooksPresent
    ? `VOID — this build carries NO hooked halo, so there is nothing to verify and zero is not agreement. Served BUILD_ID ${provenance.buildId}. The hooks are in source at 47e34329; the build the eight sealed readings were taken against predates them and is preserved unchanged on purpose. Point GRUEN_BASE at the hooked build's port.`
    : allAgree
      ? `ALL ${Object.keys(agree).length} CHECKS AGREE. The hook's shelf/field partition is set-identical to PINK's class-membership partition AND to the browser's own animationName partition (${dom.counts.byClassShelf} shelf, ${dom.counts.byClassField} field); the halo identity multiset equals the body identity multiset, so halo-to-body matching no longer needs geometric inference; the one hue's carrier read from the attribute equals the carrier read from the fill; and data-halo-radius equals the rendered r. ${seatsMissing.length === 0 ? `All seven named seats are present.` : `Seats MISSING at this level: ${seatsMissing.join(", ")} — expected where a level does not draw them, and listed rather than passed over.`}`
      : `DISAGREEMENT — ${Object.entries(agree).filter(([, v]) => !v).map(([k]) => k).join(", ")}. The hook does not induce the same set as the route(s) named, so it is WRONG and must not be used until it is. That is the standard doing its job rather than confirming mine.`;

  writeFileSync(resolve(here, `../outputs/hooks-verify-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
} finally { await browser.close(); }

console.log(`served BUILD_ID ${out.provenance.buildId} · hooks present: ${out.buildCarriesTheHooks} · ${JSON.stringify(out.counts)}`);
for (const [k, v] of Object.entries(out.agreement)) console.log(`   ${v ? "AGREE " : "DIFFER"}  ${k}`);
console.log(`   seats present: ${out.seats.present.join(", ") || "none"}`);
if (out.seats.missing.length) console.log(`   seats missing: ${out.seats.missing.join(", ")}`);
console.log(`\n${out.finding}`);
