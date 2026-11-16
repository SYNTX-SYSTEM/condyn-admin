import { playwright } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const BASE="http://127.0.0.1:3120",AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:"no-preference"});const page=await ctx.newPage();
await page.goto(URL,{waitUntil:"networkidle",timeout:60000});await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});await page.waitForTimeout(1800);
while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}
const snap=async(tag)=>{const d=await page.evaluate(()=>{const f=document.querySelector('[data-testid="mapping-field"]');const anyAttr=n=>document.querySelector(`[${n}]`)?.getAttribute(n);
  let waves=0;const waveEls=[];for(const e of document.querySelectorAll('[data-testid="mapping-field"] *')){const cs=getComputedStyle(e);if(cs.animationName&&cs.animationName!=="none"&&parseFloat(cs.animationDuration)>0){waves++;if(waveEls.length<6)waveEls.push(`${e.getAttribute('data-testid')||e.tagName}.${(e.getAttribute('class')||'').split(' ')[0]}:${cs.animationName}`);}}
  const cnt=s=>document.querySelectorAll(s).length;
  return{level:f?.getAttribute('data-level')||anyAttr('data-level'),breath:f?.getAttribute('data-breath')||anyAttr('data-breath'),
    classes:{rings:cnt('[data-testid^="mapping-ring"]'),arcs:cnt('[data-mapping-arc]'),beams:cnt('[data-beam]'),nodes:cnt('[data-mapping-node]'),text:cnt('[data-mapping-sector]'),outlines:cnt('[data-mapping-body-shape]'),bodies:cnt('[data-mapping-body]'),seats:cnt('.mf-seat'),medium:cnt('[data-testid="mapping-medium"]')},
    waves,waveEls};});console.log(tag,JSON.stringify(d));};
await snap("L0 ");
await page.locator('[data-mapping-body]').first().click().catch(()=>{});await page.waitForTimeout(1000);await snap("L1 ");
await page.locator('[data-mapping-body]').first().click().catch(()=>{});await page.waitForTimeout(1000);await snap("L2 ");
await ctx.close();await b.close();
