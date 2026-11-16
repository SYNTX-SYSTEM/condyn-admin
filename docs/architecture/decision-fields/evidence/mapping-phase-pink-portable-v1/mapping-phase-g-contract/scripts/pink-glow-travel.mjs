/** PINK · PHASE G · verify three taxonomy anomalies on 3ec8457d:
 *  (1) glows has 4 children but 5 bodies — which body lacks one?
 *  (2) glows has 0 children at L2 — does the single L2 body carry a glow at all?
 *  (3) mf-travel = 0 at L1 — real, or an artifact of reducedMotion:reduce? Probe BOTH motion settings. */
import { playwright, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d", declaredBuildId: "xCD8LBxdjnP97-2Gjs5yr" });
const BASE="http://127.0.0.1:3122",AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
async function run(motion){
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:motion});
  const page=await ctx.newPage();
  await page.goto(URL,{waitUntil:"networkidle",timeout:60000});
  await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});
  await page.waitForTimeout(1500);
  while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});
    await page.keyboard.press("Escape").catch(()=>{}); await page.waitForTimeout(400);}
  const snap=async()=>await page.evaluate(()=>{
    const q=s=>Array.from(document.querySelectorAll(s));
    const g=document.querySelector('[data-testid="mapping-glows"]');
    return {
      level:document.querySelector('[data-testid="mapping-field"]')?.getAttribute('data-level'),
      bodies:q('[data-mapping-body]').map(e=>e.getAttribute('data-testid')),
      glowChildren:g?Array.from(g.children).map(c=>({tag:c.tagName,fill:c.getAttribute('fill'),r:c.getAttribute('r'),
        cls:c.getAttribute('class'),tid:c.getAttribute('data-testid'),
        cx:c.getAttribute('cx'),cy:c.getAttribute('cy')})):null,
      travel:q('.mf-travel').map(e=>({tag:e.tagName,vis:getComputedStyle(e).visibility,disp:getComputedStyle(e).display,
        anim:getComputedStyle(e).animationName,dur:getComputedStyle(e).animationDuration})),
      beamGlow:q('.mf-beam-glow').length,
      beams:q('[data-beam]').length,
    };});
  const out={motion,L0:await snap()};
  const pool=page.locator('[data-mapping-sector]').first();
  if(await pool.count()>0){await pool.click({force:true}).catch(()=>{});await page.waitForTimeout(1000);out.L1=await snap();}
  const body=page.locator('[data-mapping-body]').first();
  if(await body.count()>0){await body.click({force:true}).catch(()=>{});await page.waitForTimeout(1000);out.L2=await snap();}
  await ctx.close();await b.close();return out;
}
const res={commit: PINK_PROV_3ec8457d.observedCommit,buildId: PINK_PROV_3ec8457d.observedBuildId,runs:[await run("reduce"),await run("no-preference")]};
console.log(JSON.stringify(res,null,1));
