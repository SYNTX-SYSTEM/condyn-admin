/** PINK · PHASE G · PG-1 on 3ec8457d with the CORRECTED carrier set (F-G1: the glow mask is `.mf-halo`, not
 *  `[data-testid="mapping-glows"]`, which reaches only the field half; plus `.mf-travel` and `.mf-beam-glow`,
 *  which exist in no earlier mask). Semantic light fraction inside the disc BY SUPPRESSION, as PG-1 specifies:
 *      fraction = (sum L_full - sum L_suppressed) / sum L_full   over disc pixels.
 *  Scaffold rings are EXCLUDED from "semantic" per §13 / A-G5 (they are the rejected coordinate target).
 *  Measured under BOTH motion settings, because under reducedMotion:reduce the travel is visibility:hidden
 *  (verified, GLOW-TRAVEL.json) and so contributes ZERO light — a PG-1 read under reduce silently omits a
 *  semantic channel. LIVE is averaged over one full travel/breath period (10s) for a stable total. */
const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const SHARP = process.env.CONDYN_SHARP_MODULE ?? "/home/codi/Entwicklung/condyn-admin-pink-visual-g/node_modules/sharp/lib/index.js";
const { chromium } = await import(PW);
const sharp = (await import(SHARP)).default;
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const LUT = new Float64Array(256);
for (let i=0;i<256;i++){ const c=i/255; LUT[i] = c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); }

const GROUP = {
  bodies:   '[data-mapping-body]',
  glows:    '.mf-halo',                 // F-G1: field AND shelf halos
  arcs:     '[data-mapping-arc]',
  beams:    '[data-beam]',
  beamGlow: '.mf-beam-glow',            // new in phase G
  travel:   '.mf-travel',               // new in phase G
  nodes:    '[data-mapping-node]',
  text:     'text',
  sectors:  '[data-mapping-sector]',
  rings:    '[data-testid^="mapping-ring"]',
};
// §13's grouping, extended with phase G's three new carriers. Sectors and rings reported but NOT in SEM.
const SEM_KEYS = ["bodies","glows","arcs","beams","beamGlow","travel","nodes","text"];
const SEM = SEM_KEYS.map(k=>GROUP[k]).join(",");
const RINGS = GROUP.rings, SECTORS = GROUP.sectors;

async function measure(VW,VH,motion){
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:1,reducedMotion:motion});
  const page = await ctx.newPage();
  await page.goto(URL,{waitUntil:"networkidle",timeout:60000});
  await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});
  await page.waitForTimeout(1800);
  while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});
    await page.keyboard.press("Escape").catch(()=>{}); await page.waitForTimeout(400);}
  const overlay = await page.locator('[data-testid="guided-onboarding-overlay"]').count();
  if (overlay !== 0) { await ctx.close(); await b.close(); throw new Error("ABORT overlay present"); }
  const geo = await page.evaluate(()=>{
    const svg=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();
    const fr=document.querySelector('[data-testid="mapping-ring-field"]').getBoundingClientRect();
    return {clip:{x:Math.round(svg.x),y:Math.round(svg.y),width:Math.round(svg.width),height:Math.round(svg.height)},
            cx:fr.x+fr.width/2, cy:fr.y+fr.height/2, R:fr.width/2};});
  const clip=geo.clip,W=clip.width,H=clip.height,N=W*H;
  const cx=geo.cx-clip.x, cy=geo.cy-clip.y, R=geo.R;
  const disc=new Uint8Array(N); let discN=0;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<=R*R){disc[y*W+x]=1;discN++;}}
  const cdp = await page.context().newCDPSession(page);
  const one = async () => { const {data}=await cdp.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1},optimizeForSpeed:true});
    const s=await sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});
    const ch=s.info.channels,d=s.data; let sum=0;
    for(let i=0;i<N;i++) if(disc[i]){const q=i*ch; sum+=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];}
    return sum; };
  // LIVE: average over one full 10s period so the travel's moving light is represented, not sampled by luck.
  const FR = motion === "reduce" ? 1 : 14;
  const GAP = motion === "reduce" ? 0 : 740;
  const sumOf = async () => { let t=0; for(let i=0;i<FR;i++){ t+=await one(); if(GAP) await page.waitForTimeout(GAP); } return t/FR; };
  const hide = async (sel) => { await page.addStyleTag({content:`${sel}{visibility:hidden !important}`}); await page.waitForTimeout(420); };
  const unhide = async () => { await page.evaluate(()=>{for(const st of document.querySelectorAll('style'))
      if(st.textContent && st.textContent.includes('visibility:hidden')) st.remove();}); await page.waitForTimeout(380); };
  const full = await sumOf();
  const per = {};
  for (const [k,sel] of Object.entries(GROUP)) { await hide(sel); per[k] = +(((full-(await sumOf()))/full)).toFixed(5); await unhide(); }
  await hide(SEM);              const semJoint = +(((full-(await sumOf()))/full)).toFixed(5); await unhide();
  await hide(`${SEM},${RINGS}`); const semPlusRings = +(((full-(await sumOf()))/full)).toFixed(5); await unhide();
  await hide(`${SEM},${RINGS},${SECTORS}`); const allHidden = await sumOf();
  const groundOnly = allHidden; await unhide();
  await ctx.close(); await b.close();
  return { viewport:`${VW}x${VH}`, motion, framesAveraged:FR, discPixels:discN, overlay,
    discMeanLum_full:+(full/discN).toExponential(4),
    discMeanLum_groundOnly:+(groundOnly/discN).toExponential(4),
    perGroupFraction: per,
    PG1_semanticFraction_exclRings: semJoint,
    PG1_fraction_inclRings: semPlusRings,
    bound: ">=0.55",
    PG1_pass_exclRings: semJoint >= 0.55,
    semSumOfParts: +(SEM_KEYS.reduce((a,k)=>a+per[k],0)).toFixed(5),
    ringsAlone: per.rings, sectorsAlone: per.sectors };
}
const out={commit:"3ec8457d",buildId:"xCD8LBxdjnP97-2Gjs5yr",pin:"PG-1",
  maskNote:"glows = .mf-halo (F-G1: field+shelf); travel and beamGlow are phase-G carriers in no earlier mask; rings excluded from semantic per A-G5",
  runs:[]};
for (const [w,h] of [[1920,1080],[1280,800]])
  for (const m of ["reduce","no-preference"]) out.runs.push(await measure(w,h,m));
console.log(JSON.stringify(out,null,1));
