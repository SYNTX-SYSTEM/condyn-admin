/** PINK · attack GELB's A-F6 claim: E-7's four rings do NOT separate >=1.6x on pixels. Independent method:
 *  per-angle STROKE PEAK (max luminance across the stroke width at each of 720 angles, robust to centerline),
 *  then TWO readings: (1) GELB-style percentile over ALL angles incl. dash gaps; (2) INK-ONLY (lit angles,
 *  peak>ground) to separate "the ink is dimmer" from "the dash lowers the percentile". Geometry via getScreenCTM. */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const sharp = await sharpModule();
const PINK_PROV_9cc06f84 = await provenance({ declaredCommit: "9cc06f84" });
const BASE = "http://127.0.0.1:3120", AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const LUT = new Float64Array(256); for (let i=0;i<256;i++){const c=i/255;LUT[i]=c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
await page.waitForTimeout(1500);
while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) { await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{}); await page.keyboard.press("Escape").catch(()=>{}); await page.waitForTimeout(400); }
const g = await page.evaluate(() => {
  const svg = document.querySelector('[data-testid="mapping-field-svg"]');
  const bb = svg.getBoundingClientRect();
  const get = id => { const e = document.querySelector(`[data-testid="${id}"]`); const ctm = e.getScreenCTM();
    const cx=parseFloat(e.getAttribute("cx")||"0"), cy=parseFloat(e.getAttribute("cy")||"0"), r=parseFloat(e.getAttribute("r")||"0");
    const sc=Math.hypot(ctm.a,ctm.b); const sx=ctm.a*cx+ctm.c*cy+ctm.e, sy=ctm.b*cx+ctm.d*cy+ctm.f;
    const cs=getComputedStyle(e); return { cx:sx, cy:sy, r:r*sc, sw:parseFloat(cs.strokeWidth)*sc, dash:cs.strokeDasharray, alpha:cs.stroke }; };
  return { clip: { x: Math.round(bb.x), y: Math.round(bb.y), w: Math.round(bb.width), h: Math.round(bb.height) },
    rings: { horizon: get("mapping-ring-horizon"), field: get("mapping-ring-field"), shelf: get("mapping-ring-shelf"), best: get("mapping-ring-best") } };
});
const clip = { x:g.clip.x, y:g.clip.y, width:g.clip.w, height:g.clip.h };
const s = await sharp(await page.screenshot({ clip })).raw().toBuffer({ resolveWithObject: true });
const W = s.info.width, H = s.info.height, ch = s.info.channels, data = s.data;
const Lat = (x,y) => { const xi=Math.round(x)-clip.x, yi=Math.round(y)-clip.y; if(xi<0||yi<0||xi>=W||yi>=H) return 0; const q=(yi*W+xi)*ch; return 0.2126*LUT[data[q]]+0.7152*LUT[data[q+1]]+0.0722*LUT[data[q+2]]; };
await ctx.close(); await b.close();
const GROUND = 0.0015, LIT = 0.004; // ground p50 ~0.00145; "lit" = clearly above ground
function measure(ring) {
  const half = Math.max(3, ring.sw/2 + 1); const step = ring.sw > 10 ? 1 : 0.4; const peaks = [];
  for (let a=0;a<720;a++){ const t=a/720*2*Math.PI, ca=Math.cos(t), sa=Math.sin(t); let pk=0;
    for (let rr=ring.r-half; rr<=ring.r+half; rr+=step){ const v=Lat(ring.cx+rr*ca, ring.cy+rr*sa); if(v>pk)pk=v; }
    peaks.push(pk); }
  peaks.sort((x,y)=>x-y); const P=f=>peaks[Math.min(peaks.length-1,Math.floor(f*(peaks.length-1)))];
  const lit = peaks.filter(v=>v>LIT); lit.sort((x,y)=>x-y); const LP=f=>lit.length?lit[Math.min(lit.length-1,Math.floor(f*(lit.length-1)))]:0;
  return { r:+ring.r.toFixed(0), sw:+ring.sw.toFixed(1), dash:ring.dash, allP10:+P(.1).toExponential(3), allP50:+P(.5).toExponential(3), allP90:+P(.9).toExponential(3), max:+P(1).toExponential(3),
    litFrac:+(lit.length/720).toFixed(3), litP10:+LP(.1).toExponential(3), litP50:+LP(.5).toExponential(3), litP90:+LP(.9).toExponential(3) };
}
const R = { horizon: measure(g.rings.horizon), field: measure(g.rings.field), shelf: measure(g.rings.shelf), best: measure(g.rings.best) };
// GELB-style: order by allP50 desc, ratio = p10(brighter)/p90(dimmer) at closest points
const byAll = Object.entries(R).sort((a,b)=>b[1].allP50-a[1].allP50);
const ratiosAll = []; for(let i=0;i+1<byAll.length;i++) ratiosAll.push({pair:`${byAll[i][0]}/${byAll[i+1][0]}`, ratio:+(byAll[i][1].allP10/byAll[i+1][1].allP90).toFixed(3)});
// INK-only: order by litP50 desc, ratio = litP10(brighter)/litP90(dimmer)
const byLit = Object.entries(R).sort((a,b)=>b[1].litP50-a[1].litP50);
const ratiosLit = []; for(let i=0;i+1<byLit.length;i++) ratiosLit.push({pair:`${byLit[i][0]}/${byLit[i+1][0]}`, ratio:+(byLit[i][1].litP10/byLit[i+1][1].litP90).toFixed(3)});
console.log(JSON.stringify({ commit: PINK_PROV_9cc06f84.observedCommit, method:"720 angles, per-angle stroke peak across width; getScreenCTM geometry",
  rings:R, orderByAllP50:byAll.map(e=>e[0]), closestPointRatios_allAngles:ratiosAll,
  orderByLitP50:byLit.map(e=>e[0]), closestPointRatios_inkOnly:ratiosLit,
  verdict_allAngles_hold_1p6: ratiosAll.every(r=>r.ratio>=1.6), verdict_inkOnly_hold_1p6: ratiosLit.every(r=>r.ratio>=1.6) }, null, 1));
