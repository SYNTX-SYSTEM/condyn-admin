import { playwright, sharpModule } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const sharp = await sharpModule();
const BASE="http://127.0.0.1:3120",AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:"no-preference"});const page=await ctx.newPage();
await page.goto(URL,{waitUntil:"networkidle",timeout:60000});await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});await page.waitForTimeout(1800);
while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}
const clip=await page.evaluate(()=>{const r=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
const cdp=await page.context().newCDPSession(page);
async function timeN(label,fn){const ms=[];for(let i=0;i<10;i++){const t=Date.now();await fn();ms.push(Date.now()-t);}ms.sort((a,b)=>a-b);console.log(label,"p50",ms[5],"min",ms[0],"max",ms[9]);}
await timeN("CDP screenshot only            ",async()=>{await cdp.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1}});});
await timeN("CDP + sharp decode            ",async()=>{await sharp(Buffer.from((await cdp.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1}})).data,"base64")).raw().toBuffer();});
// smaller viewport test: does shrinking the host reduce render cost?
await ctx.close();
const ctx2=await b.newContext({viewport:{width:1000,height:1000},deviceScaleFactor:1,reducedMotion:"no-preference"});const p2=await ctx2.newPage();
await p2.goto(URL,{waitUntil:"networkidle",timeout:60000});await p2.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});await p2.waitForTimeout(1800);
while(await p2.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await p2.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await p2.keyboard.press("Escape").catch(()=>{});await p2.waitForTimeout(400);}
const clip2=await p2.evaluate(()=>{const r=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
const cdp2=await p2.context().newCDPSession(p2);
console.log("1000x1000 svg clip",JSON.stringify(clip2));
await (async()=>{const ms=[];for(let i=0;i<10;i++){const t=Date.now();await cdp2.send("Page.captureScreenshot",{format:"png",clip:{...clip2,scale:1}});ms.push(Date.now()-t);}ms.sort((a,b)=>a-b);console.log("CDP screenshot @1000x1000     p50",ms[5],"min",ms[0],"max",ms[9]);})();
await ctx2.close();await b.close();
