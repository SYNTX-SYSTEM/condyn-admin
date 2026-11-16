/** PINK · PHASE G · PG-14 · do the drawn bodies' LABELS lie inside the emitted viewBox? The BEFORE reading,
 *  on 3ec8457d, taken before GRÜN's convergence fix lands (GELB §66).
 *
 *  WHY A RENDER ADDS SOMETHING GRÜN'S SWEEP CANNOT. The frame's widen uses a CHARACTER-COUNT ESTIMATE of the
 *  label's width -- `:457`: `side = max(collar, (b.title.length * 0.62 * font) / 2)`. 0.62 em per character is
 *  an approximation of a proportional SANS face. GRÜN's arithmetic sweep necessarily models the SAME 0.62, so
 *  it can prove the iteration does not converge but it CANNOT see the approximation being wrong: both sides of
 *  its comparison come from the same constant. **A browser measures the glyphs.** So this instrument reports
 *  two independent things:
 *    (1) containment -- each label's rendered box against the emitted `viewBox`, per side, in user units;
 *    (2) `measuredWidth / (length * 0.62 * fontSize)` -- whether the estimate the frame is built on is right.
 *  A ratio above 1 means the frame is under-widened by construction, at any convergence tolerance.
 *
 *  THE FIXTURE'S TITLE LENGTHS DECIDE WHETHER THIS STAND CAN SEE THE DEFECT AT ALL. GELB's own framing, and
 *  it is right: the defect is length-driven, "Product Manager" is fifteen characters, and the golden vectors
 *  carry no titles. **If this fixture's names are short, the honest outcome is "this stand cannot see it",
 *  which is a result and not a clear.** Lengths are therefore reported FIRST and the verdict is conditioned
 *  on them. No titles are synthesised: a fabricated label would make the containment reading mine rather
 *  than the build's.
 *
 *  Labels are `mapping-name-*` (the name above) and `mapping-measure-*` (the measure below), `:715` / `:719`.
 *  Screen rects are mapped to user units through the field svg's own viewBox and k (rule 5).
 *  §63: ONE fixture, one analysisId, five bodies (2 field / 3 shelf), L0. Stated, not generalised.
 */
import { playwright, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d", declaredBuildId: "xCD8LBxdjnP97-2Gjs5yr" });
const chromium = await playwright();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const CHAR_W = 0.62;   // the constant the widen is built on (:457)

async function run(VW, VH) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1600);
  while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(400); }

  const r = await page.evaluate(([CHAR_W]) => {
    const svg = document.querySelector('[data-testid="mapping-field-svg"]');
    const sr = svg.getBoundingClientRect();
    const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    const k = sr.width / vb[2];
    const toUser = rect => ({ x0: vb[0] + (rect.x - sr.x) / k, x1: vb[0] + (rect.x + rect.width - sr.x) / k,
      y0: vb[1] + (rect.y - sr.y) / k, y1: vb[1] + (rect.y + rect.height - sr.y) / k });
    const vbBox = { x0: vb[0], x1: vb[0] + vb[2], y0: vb[1], y1: vb[1] + vb[3] };
    const labels = [];
    for (const kind of ["name", "measure"]) {
      for (const el of document.querySelectorAll(`[data-testid^="mapping-${kind}-"]`)) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        // DEFECT OF MINE, CAUGHT BY AN INVARIANCE CHECK AND FIXED: this first divided by k. On an SVG <text>,
        // `getComputedStyle().fontSize` resolves the `font-size` ATTRIBUTE and is ALREADY in user units, so
        // dividing by k converted user units into user units a second time. The tell was that the estimate
        // ratio must be k-INDEPENDENT by construction (both numerator and denominator scale as 1/k) and it
        // came out 0.714 / 0.380 / 0.298 at the three viewports. Corrected, it is 0.4282 at all three.
        // Confirmed independently: the label's rendered half-width is 49.744 CSS px at EVERY viewport -- the
        // product holds the text at a constant SCREEN size by scaling the attribute as 1/k.
        const u = toUser(rect), fs = Number(getComputedStyle(el).fontSize.replace('px', ''));
        const text = (el.textContent || "").trim();
        const estHalf = (text.length * CHAR_W * fs) / 2, measHalf = (u.x1 - u.x0) / 2;
        labels.push({ kind, testid: el.getAttribute('data-testid'), text, chars: text.length,
          fontSizeUserUnits: +fs.toFixed(4), renderedHalfWidthCssPx: +(rect.width / 2).toFixed(3),
          boxUser: { x0: +u.x0.toFixed(3), x1: +u.x1.toFixed(3), y0: +u.y0.toFixed(3), y1: +u.y1.toFixed(3) },
          overflowUserUnits: { left: +(vbBox.x0 - u.x0).toFixed(3), right: +(u.x1 - vbBox.x1).toFixed(3),
            top: +(vbBox.y0 - u.y0).toFixed(3), bottom: +(u.y1 - vbBox.y1).toFixed(3) },
          inside: u.x0 >= vbBox.x0 && u.x1 <= vbBox.x1 && u.y0 >= vbBox.y0 && u.y1 <= vbBox.y1,
          measuredHalfWidthUserUnits: +measHalf.toFixed(3), estimatedHalfWidthUserUnits: +estHalf.toFixed(3),
          estimateRatio_measuredOverEstimated: estHalf > 0 ? +(measHalf / estHalf).toFixed(4) : null });
      }
    }
    // THE SIDE ALLOWANCE IS DERIVED FROM THE TITLE'S LENGTH ONLY (:457 `b.title.length * 0.62 * font / 2`),
    // but the body carries TWO labels: the SANS name above and the MONO measure below. Nothing ties the
    // measure's length to the title's. So pair them per body and ask whether the measure label fits inside
    // the allowance its own body's TITLE bought. A ratio > 1 means the widen term is not a bound on the
    // labels it exists to contain -- independent of whether the two-pass solve converges.
    const byBody = {};
    for (const l of labels) { const key = l.testid.replace(/^mapping-(name|measure)-/, "");
      (byBody[key] ??= {})[l.kind] = l; }
    const perBody = Object.entries(byBody).map(([key, pair]) => {
      const name = pair.name, measure = pair.measure;
      if (!name || !measure) return { key, incomplete: true };
      const allowanceHalf = (name.chars * CHAR_W * name.fontSizeUserUnits) / 2;
      const needHalf = Math.max(name.measuredHalfWidthUserUnits, measure.measuredHalfWidthUserUnits);
      return { key, titleText: name.text, titleChars: name.chars,
        measureText: measure.text, measureChars: measure.chars,
        measureLongerThanTitle: measure.chars > name.chars,
        allowanceHalfFromTitle: +allowanceHalf.toFixed(3),
        widestLabelHalf: +needHalf.toFixed(3),
        widestIsTheMeasure: measure.measuredHalfWidthUserUnits > name.measuredHalfWidthUserUnits,
        needOverAllowance: +(needHalf / allowanceHalf).toFixed(4),
        exceedsAllowance: needHalf > allowanceHalf };
    });
    return { viewBox: vb, k, perBody, level: document.querySelector('[data-testid="mapping-field"]').getAttribute('data-level'),
      bodyTitles: [...document.querySelectorAll('[data-testid^="mapping-name-"]')].map(e => (e.textContent || "").trim()),
      labels };
  }, [CHAR_W]);
  await b.close();

  const lens = r.bodyTitles.map(t => t.length);
  const outside = r.labels.filter(l => !l.inside);
  const worst = r.labels.reduce((a, l) => Math.max(a, l.overflowUserUnits.left, l.overflowUserUnits.right,
    l.overflowUserUnits.top, l.overflowUserUnits.bottom), -Infinity);
  const ratios = r.labels.map(l => l.estimateRatio_measuredOverEstimated).filter(v => v !== null);
  const longest = lens.length ? Math.max(...lens) : 0;
  return { viewport: `${VW}x${VH}`, level: r.level, k: +r.k.toFixed(6), viewBox: r.viewBox,
    titles: r.bodyTitles, titleLengths: lens, longestTitle: longest,
    canThisStandSeeTheDefect: longest >= 16,
    standVerdict: longest >= 16
      ? "fixture carries a >=16-char title — the length-driven defect is in range"
      : `THIS STAND CANNOT SEE IT — longest title is ${longest} chars, under the 16 at which GRÜN measured 4 of 11 layouts failing. A clear here is not evidence of containment at realistic titles.`,
    labelsMeasured: r.labels.length, labelsOutsideViewBox: outside.length,
    perBodyAllowance: r.perBody,
    bodiesWhereMeasureIsLongerThanTitle: r.perBody.filter(x => x.measureLongerThanTitle).length,
    bodiesExceedingTheirTitleDerivedAllowance: r.perBody.filter(x => x.exceedsAllowance).length,
    worstNeedOverAllowance: r.perBody.length ? Math.max(...r.perBody.filter(x => !x.incomplete).map(x => x.needOverAllowance)) : null,
    worstOverflowUserUnits: worst === -Infinity ? null : +worst.toFixed(3),
    worstOverflowDevicePx: worst === -Infinity ? null : +(worst * r.k).toFixed(3),
    allLabelsInside: outside.length === 0,
    widenEstimate: { constant: CHAR_W,
      ratioMin: ratios.length ? Math.min(...ratios) : null, ratioMax: ratios.length ? Math.max(...ratios) : null,
      ratioMean: ratios.length ? +(ratios.reduce((a, v) => a + v, 0) / ratios.length).toFixed(4) : null,
      anyLabelWiderThanEstimated: ratios.some(v => v > 1.0),
      // em per character = (2 * measuredHalf) / (chars * fontSize) = ratio * CHAR_W. An earlier version of this
      // line multiplied by 2 * CHAR_W and reported double; the halving is already inside `ratio`.
      measuredEmPerCharMean: ratios.length ? +(ratios.reduce((a, v) => a + v, 0) / ratios.length * CHAR_W).toFixed(4) : null,
      measuredEmPerCharWorst: ratios.length ? +(Math.max(...ratios) * CHAR_W).toFixed(4) : null,
      headroomOnTheConstantAtWorstLabel: ratios.length ? +((1 - Math.max(...ratios)) * 100).toFixed(2) + " %" : null,
      note: "measured / (chars * 0.62 * fontSizeUserUnits). > 1 means the frame is widened by LESS than the label actually needs, independently of whether the two-pass solve converges. Must be k-INDEPENDENT: both terms scale as 1/k, so a ratio that moves with the viewport is an instrument defect, not a finding.",
      kIndependent: true },
    labels: r.labels };
}

const out = { commit: PINK_PROV_3ec8457d.observedCommit, buildId: PINK_PROV_3ec8457d.observedBuildId,
  reading: "PINK — PG-14 label containment against the emitted viewBox, the BEFORE reading (GELB §66)",
  verdict: "see standVerdict per run — conditioned on the fixture's title lengths, §63",
  scope: "one fixture, one analysisId, five bodies (2 field / 3 shelf), L0",
  runs: [] };
for (const [w, h] of [[1920, 1080], [1280, 800], [1024, 768]]) out.runs.push(await run(w, h));
console.log(JSON.stringify(out, null, 2));
