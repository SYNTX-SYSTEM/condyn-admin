/** PINK · PHASE G · §47 — DO THE RECORD'S PIXEL FIGURES TRANSFER ACROSS RASTER BACKENDS?
 *  GELB (§110) raised the bound I named and reached further with it than I had: every pixel figure in this
 *  record — the seam, the masks, the plateau map, the alpha sweep, GRÜN's ladders — was taken under ONE
 *  raster backend. The default Playwright chromium here reports
 *      ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)
 *  i.e. SOFTWARE raster, and "a software raster is not the thing a human eye will meet". Nothing either
 *  lane had run said the figures transfer. This does.
 *
 *  THIS MACHINE HAS A GPU — /dev/dri/card0 exists and intel/nvidia/radeon/virtio Vulkan ICDs are installed
 *  — so a hardware path is at least reachable to attempt, which makes the question measurable rather than
 *  merely nameable.
 *
 *  AND THE TEST IS ON THE BYTES, NOT ON THE RENDERER STRING. WebGL's reported renderer describes WebGL;
 *  SVG and CSS painting go through Skia, which may raster on CPU or GPU independently of it. So each
 *  configuration renders the SAME swatch — the SVG circle stroke that §41 established is the band's own
 *  construct — and the composited bytes are compared. A-G432: the renderer string could only have come out
 *  one way per flag set; the bytes could come out differently.
 *
 *  A SECOND HAZARD TESTED IN THE SAME RUN, because it would invalidate every figure equally and neither
 *  lane has checked it: COLOUR MANAGEMENT. If chromium applies a display colour profile, the composited
 *  byte is not the byte the CSS asked for. `--force-color-profile=srgb` against the default is the test.
 */
const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const SHARP = process.env.CONDYN_SHARP_MODULE ?? "/home/codi/Entwicklung/condyn-admin-pink-visual-g/node_modules/sharp/lib/index.js";
const { chromium } = await import(PW);
const sharp = (await import(SHARP)).default;

const INK = [205, 240, 255];
const ALPHAS = [0.01, 0.018, 0.02, 0.022, 0.026, 0.03, 0.04, 0.045, 0.05, 0.085, 0.15];
const ROW = 40;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
 html,body{margin:0;padding:0;background:#000}.r{height:${ROW}px;position:relative}
 svg{position:absolute;left:0;top:0}
</style></head><body>
${ALPHAS.map(a => `<div class="r"><svg width="120" height="${ROW}">
 <rect width="120" height="${ROW}" fill="rgb(0,0,0)"/>
 <circle cx="60" cy="${ROW/2}" r="14" fill="none" stroke="rgba(${INK[0]},${INK[1]},${INK[2]},${a})" stroke-width="28"/>
</svg></div>`).join("")}
</body></html>`;

const CONFIGS = [
  { name: "default (as every figure in the record was taken)", args: [] },
  { name: "--disable-gpu (forced CPU path)",                   args: ["--disable-gpu"] },
  { name: "--force-color-profile=srgb",                        args: ["--force-color-profile=srgb"] },
  { name: "--force-color-profile=display-p3-D65",              args: ["--force-color-profile=display-p3-D65"] },
  { name: "gpu attempt: angle/vulkan + ignore-blocklist",
    args: ["--use-gl=angle","--use-angle=vulkan","--enable-gpu","--ignore-gpu-blocklist","--enable-features=Vulkan"] },
  { name: "gpu attempt: egl",                                   args: ["--use-gl=egl","--enable-gpu","--ignore-gpu-blocklist"] },
];

async function run(cfg) {
  let b;
  try { b = await chromium.launch({ args: cfg.args }); }
  catch (e) { return { config: cfg.name, args: cfg.args.join(" "), launchFailed: String(e).slice(0, 160) }; }
  try {
    const ctx = await b.newContext({ viewport: { width: 140, height: ROW * ALPHAS.length + 10 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.waitForTimeout(500);
    const gl = await page.evaluate(() => {
      const c = document.createElement("canvas"); const g = c.getContext("webgl");
      if (!g) return "no webgl";
      const d = g.getExtension("WEBGL_debug_renderer_info");
      return d ? String(g.getParameter(d.UNMASKED_RENDERER_WEBGL)) : "no debug ext";
    });
    const cdp = await page.context().newCDPSession(page);
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true });
    const s = await sharp(Buffer.from(data, "base64")).raw().toBuffer({ resolveWithObject: true });
    const ch = s.info.channels, d = s.data, W = s.info.width;
    const triples = ALPHAS.map((a, i) => {
      const p = (((i * ROW + ROW / 2) | 0) * W + 60) * ch;
      return `${d[p]},${d[p + 1]},${d[p + 2]}`;
    });
    await ctx.close();
    return { config: cfg.name, args: cfg.args.join(" "), webglRenderer: gl, triples };
  } catch (e) {
    return { config: cfg.name, args: cfg.args.join(" "), error: String(e).slice(0, 160) };
  } finally { await b.close().catch(() => {}); }
}

const out = { pin: "A-G442 / raster-backend transferability (PINK §47)", ink: INK.join(","), alphas: ALPHAS, results: [] };
for (const c of CONFIGS) out.results.push(await run(c));
const ref = out.results.find(r => r.triples);
out.comparison = out.results.filter(r => r.triples).map(r => ({
  config: r.config,
  identicalToDefault: r.triples.join("|") === ref.triples.join("|"),
  firstDiff: r.triples.map((t, i) => t === ref.triples[i] ? null : `alpha ${ALPHAS[i]}: ${ref.triples[i]} -> ${t}`).filter(Boolean)
}));
console.log(JSON.stringify(out, null, 1));
