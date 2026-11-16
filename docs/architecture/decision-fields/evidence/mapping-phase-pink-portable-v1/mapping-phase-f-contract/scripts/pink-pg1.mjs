/** PINK · PG-1: semantic light fraction inside the disc, by SUPPRESSION. fraction = (sum L_full - sum L_hidden)/
 *  sum L_full over disc pixels. Report several semantic groupings to match GELB's 4.78%: SEM=bodies+arcs+beams+
 *  nodes+text (excl scaffold rings); ALL=SEM+rings. Also mean luminances. Reduced-motion for a stable frame. */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const sharp = await sharpModule();
const PINK_PROV_93c47e03 = await provenance({ declaredCommit: "93c47e03" });
const BASE=process.env.PINK_BASE ?? "http://127.0.0.1:3120",AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const VW=+(process.env.VW||1920),VH=+(process.env.VH||1080);
const LUT=new Float64Array(256);for(let i=0;i<256;i++){const c=i/255;LUT[i]=c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const SEM='[data-mapping-body],[data-mapping-arc],[data-beam],[data-mapping-node],[data-mapping-sector]';
const RINGS='[data-testid^="mapping-ring"]';
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:1,reducedMotion:"reduce"});const page=await ctx.newPage();
await page.goto(URL,{waitUntil:"networkidle",timeout:60000});await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});await page.waitForTimeout(1500);
while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}
const geo=await page.evaluate(()=>{const svg=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();const fr=document.querySelector('[data-testid="mapping-ring-field"]').getBoundingClientRect();return{clip:{x:Math.round(svg.x),y:Math.round(svg.y),width:Math.round(svg.width),height:Math.round(svg.height)},cx:fr.x+fr.width/2,cy:fr.y+fr.height/2,R:fr.width/2};});
const clip=geo.clip,N=clip.width*clip.height,W=clip.width,H=clip.height;const cx=geo.cx-clip.x,cy=geo.cy-clip.y,R=geo.R;
const disc=new Uint8Array(N);let discN=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<=R*R){disc[y*W+x]=1;discN++;}}
const cdp=await page.context().newCDPSession(page);
const discSum=async()=>{const{data}=await cdp.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1},optimizeForSpeed:true});const s=await sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});const ch=s.info.channels,d=s.data;let sum=0;for(let i=0;i<N;i++)if(disc[i]){const q=i*ch;sum+=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];}return sum;};
const full=await discSum();
await page.addStyleTag({content:`${SEM}{visibility:hidden !important}`});await page.waitForTimeout(350);const hidSem=await discSum();
await page.evaluate(()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('visibility:hidden'))st.remove();});await page.waitForTimeout(300);
await page.addStyleTag({content:`${SEM},${RINGS}{visibility:hidden !important}`});await page.waitForTimeout(350);const hidAll=await discSum();
await ctx.close();await b.close();
const fracSem=(full-hidSem)/full, fracAll=(full-hidAll)/full;
console.log(JSON.stringify({commit: PINK_PROV_93c47e03.observedCommit,viewport:`${VW}x${VH}`,discPixels:discN,
  discMeanLum_full:+(full/discN).toExponential(4),discMeanLum_groundOnly:+(hidAll/discN).toExponential(4),
  PG1_semanticFraction_exclRings:+fracSem.toFixed(4),PG1_fraction_inclRings:+fracAll.toFixed(4),
  bound:">=0.55",PG1_pass_exclRings:fracSem>=0.55,PG1_pass_inclRings:fracAll>=0.55},null,1));
