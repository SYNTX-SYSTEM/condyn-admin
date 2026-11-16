/** PINK · PHASE G · the glow carrier's true extent on 3ec8457d: mapping-glows (field) vs .mf-halo (field+shelf),
 *  and which halos carry the breath (mf-wave-halo). Settles the correct PF-8/PG-1/PG-17 glow mask. */
import { playwright, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d", declaredBuildId: "xCD8LBxdjnP97-2Gjs5yr" });
const BASE="http://127.0.0.1:3122",AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:"reduce"});
const page=await ctx.newPage();
await page.goto(URL,{waitUntil:"networkidle",timeout:60000});
await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});
await page.waitForTimeout(1500);
while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){
  await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});
  await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}
const snap=async()=>await page.evaluate(()=>{
  const q=s=>Array.from(document.querySelectorAll(s));
  const inGlows=s=>Array.from(document.querySelectorAll('[data-testid="mapping-glows"] '+s));
  return {
    level:document.querySelector('[data-testid="mapping-field"]')?.getAttribute('data-level'),
    bodies:q('[data-mapping-body]').length,
    shelfBodies:q('[data-mapping-body][data-shelf="true"]').length,
    fieldBodies:q('[data-mapping-body][data-shelf="false"]').length,
    glowsGroupHalos:inGlows('.mf-halo').length,
    allHalos:q('.mf-halo').length,
    waveHalos:q('.mf-wave-halo').length,
    gapHalos:q('.mf-halo circle[fill="url(#mf-halo-gap)"]').length,
    plainHalos:q('.mf-halo circle[fill="url(#mf-halo)"]').length,
  };});
const out={commit: PINK_PROV_3ec8457d.observedCommit,buildId: PINK_PROV_3ec8457d.observedBuildId,L0:await snap()};
const pool=page.locator('[data-mapping-sector]').first();
if(await pool.count()>0){await pool.click({force:true}).catch(()=>{});await page.waitForTimeout(1000);out.L1=await snap();}
const body=page.locator('[data-mapping-body]').first();
if(await body.count()>0){await body.click({force:true}).catch(()=>{});await page.waitForTimeout(1000);out.L2=await snap();}
await ctx.close();await b.close();
console.log(JSON.stringify(out,null,1));
