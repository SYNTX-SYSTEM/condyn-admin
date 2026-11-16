import { playwright, sharpModule } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const sharp = await sharpModule();
const BASE=process.env.PINK_BASE ?? "http://127.0.0.1:3120",AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:"no-preference"});
const page=await ctx.newPage();
await page.goto(URL,{waitUntil:"networkidle",timeout:60000});
await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000}); await page.waitForTimeout(1500);
while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}
const clip=await page.evaluate(()=>{const r=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
const cdp=await page.context().newCDPSession(page);
async function timeN(label,fn){const ms=[];for(let i=0;i<12;i++){const t=Date.now();await fn();ms.push(Date.now()-t);}ms.sort((a,b)=>a-b);console.log(label,"p50",ms[6],"min",ms[0],"max",ms[11]);}
await timeN("pw.screenshot(clip) only        ",async()=>{await page.screenshot({clip});});
await timeN("pw.screenshot+sharp decode      ",async()=>{await sharp(await page.screenshot({clip})).raw().toBuffer();});
await timeN("CDP captureScreenshot(clip)     ",async()=>{await cdp.send("Page.captureScreenshot",{format:"png",clip:{x:clip.x,y:clip.y,width:clip.width,height:clip.height,scale:1}});});
await ctx.close();await b.close();
