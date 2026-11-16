import { playwright, sharpModule } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const sharp = await sharpModule();
const BASE="http://127.0.0.1:3120",AN="CAN_00000000000000000000000000000002";const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const LUT=new Float64Array(256);for(let i=0;i<256;i++){const c=i/255;LUT[i]=c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const groups={bodies:'[data-mapping-body]',arcs:'[data-mapping-arc]',beams:'[data-beam]',nodes:'[data-mapping-node]',text:'[data-mapping-sector]',rings:'[data-testid^="mapping-ring"]'};
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:"reduce"});const page=await ctx.newPage();
await page.goto(URL,{waitUntil:"networkidle",timeout:60000});await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});await page.waitForTimeout(1500);
while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}
const geo=await page.evaluate(()=>{const svg=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();const fr=document.querySelector('[data-testid="mapping-ring-field"]').getBoundingClientRect();return{clip:{x:Math.round(svg.x),y:Math.round(svg.y),width:Math.round(svg.width),height:Math.round(svg.height)},cx:fr.x+fr.width/2,cy:fr.y+fr.height/2,R:fr.width/2};});
const clip=geo.clip,N=clip.width*clip.height,W=clip.width,H=clip.height,cx=geo.cx-clip.x,cy=geo.cy-clip.y,R=geo.R;
const disc=new Uint8Array(N);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<=R*R)disc[y*W+x]=1;}
const cdp=await page.context().newCDPSession(page);
const sum=async()=>{const{data}=await cdp.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1},optimizeForSpeed:true});const s=await sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});const ch=s.info.channels,d=s.data;let t=0;for(let i=0;i<N;i++)if(disc[i]){const q=i*ch;t+=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];}return t;};
const full=await sum();const out={full:+full.toExponential(3)};
for(const[g,sel]of Object.entries(groups)){await page.addStyleTag({content:`${sel}{visibility:hidden !important}`});await page.waitForTimeout(300);const h=await sum();out[g]=+((full-h)/full).toFixed(4);await page.evaluate(()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('visibility:hidden'))st.remove();});await page.waitForTimeout(250);}
await ctx.close();await b.close();console.log(JSON.stringify(out,null,1));
