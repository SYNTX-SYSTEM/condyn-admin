/** PINK · PHASE G · SAMPLING-ADEQUACY GUARD on the phase-G tip (A-F20 carried to the frequency axis, A-G20).
 *  A temporal verdict is inadmissible unless the capture cadence resolves the highest fitted frequency:
 *  maxFreq (0.35 Hz, the top bracketed decoy) must sit below 0.9 x Nyquist, Nyquist = 1/(2*cadence).
 *  => cadence must be < 0.9/(2*0.35) = 1.2857 s. At ef466ca8 the lit animated ground cost ~1.25 s/shot at L0
 *  and ~1.40 s at L2, and the L2 run was INCONCLUSIVE until CDP optimizeForSpeed was added. Re-measure here:
 *  phase G adds glows, travel and beam-glows, so the cost is NOT inherited from phase F.
 *  Paths overridable (GELB I-2: the playwright module is unversioned and outside the repo). */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d", declaredBuildId: "xCD8LBxdjnP97-2Gjs5yr" });
const chromium = await playwright();
const sharp = await sharpModule();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const MAXFREQ = 0.35, N = 10;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1920,height:1080}, deviceScaleFactor:1, reducedMotion:"no-preference" });
const page = await ctx.newPage();
await page.goto(URL,{waitUntil:"networkidle",timeout:60000});
await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});
await page.waitForTimeout(1800);
while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){
  await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});
  await page.keyboard.press("Escape").catch(()=>{}); await page.waitForTimeout(400);}
const cdp = await page.context().newCDPSession(page);
const clipOf = async () => await page.evaluate(()=>{const r=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();
  return {x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
const stat = ms => { const s=[...ms].sort((a,b)=>a-b); return {p50:s[Math.floor(s.length/2)],min:s[0],max:s[s.length-1]}; };
const adequacy = c => { const ny = 1/(2*(c/1000)); return { cadenceMs:c, nyquistHz:+ny.toFixed(4), maxFreqHz:MAXFREQ,
  limitHz:+(0.9*ny).toFixed(4), adequate: MAXFREQ < 0.9*ny }; };
async function profile(label){
  const clip = await clipOf();
  const shotOnly=[], shotFast=[], withDecode=[];
  for(let i=0;i<N;i++){ let t=Date.now(); await cdp.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1}}); shotOnly.push(Date.now()-t); }
  for(let i=0;i<N;i++){ let t=Date.now(); await cdp.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1},optimizeForSpeed:true}); shotFast.push(Date.now()-t); }
  for(let i=0;i<N;i++){ let t=Date.now(); const {data}=await cdp.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1},optimizeForSpeed:true});
    await sharp(Buffer.from(data,"base64")).raw().toBuffer(); withDecode.push(Date.now()-t); }
  const so=stat(shotOnly), sf=stat(shotFast), wd=stat(withDecode);
  return { level:label, clip, shotOnly:so, shotFast:sf, shotFastPlusInlineDecode:wd,
    adequacy_deferredDecode_fast: adequacy(sf.p50),
    adequacy_inlineDecode_fast:   adequacy(wd.p50),
    adequacy_deferredDecode_slow: adequacy(so.p50) };
}
const out={commit: PINK_PROV_3ec8457d.observedCommit,buildId: PINK_PROV_3ec8457d.observedBuildId,viewport:"1920x1080",frames:N,levels:[]};
out.levels.push(await profile("L0"));
const pool=page.locator('[data-mapping-sector]').first();
if(await pool.count()>0){await pool.click({force:true}).catch(()=>{});await page.waitForTimeout(1200);out.levels.push(await profile("L1"));}
const body=page.locator('[data-mapping-body]').first();
if(await body.count()>0){await body.click({force:true}).catch(()=>{});await page.waitForTimeout(1200);out.levels.push(await profile("L2"));}
await ctx.close();await b.close();
console.log(JSON.stringify(out,null,1));
