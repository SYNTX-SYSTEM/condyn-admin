import { playwright } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const BASE="http://127.0.0.1:3120",AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1});const page=await ctx.newPage();
await page.goto(URL,{waitUntil:"networkidle",timeout:60000});await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});await page.waitForTimeout(1500);
while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}
const counts=await page.evaluate(()=>{const sel={
  rings:'[data-testid^="mapping-ring"]', arcs:'[data-mapping-arc]', beams:'[data-beam]', nodes:'[data-mapping-node]',
  sectors:'[data-mapping-sector]', bodies:'[data-mapping-body]', bodyShape:'[data-mapping-body-shape]', ticks:'[data-mapping-tick]',
  text:'text', marked:'[data-mark]', outline_cand:'[data-mapping-body] [data-mapping-body-shape], [data-outline]'};
  const out={};for(const[k,s]of Object.entries(sel)){try{out[k]=document.querySelectorAll(s).length;}catch{out[k]='err';}}return out;});
await ctx.close();await b.close();console.log(JSON.stringify(counts,null,1));
