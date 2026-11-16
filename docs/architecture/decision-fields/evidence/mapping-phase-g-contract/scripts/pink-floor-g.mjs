/** PINK · PHASE G · THE STATIC FLOOR ON 3ec8457d (A-G54's prerequisite). My 0.031872 was measured at 9cc06f84
 *  on the TRANSLUCENT ground; A-G17 made the disc opaque, so the floor is a property of the build and must be
 *  re-measured. Measured BOTH ways so the comparison with noise-floor.json is apples-to-apples:
 *    - WHOLE REGION (924x924 svg square) — the basis of the phase-F 0.031872, whose max was the ring stroke
 *      edge at r/R~1.0, i.e. ON the disc boundary, so a strict disc mask may exclude the very pixel that set it.
 *    - DISC-SCOPED (r <= R), the basis GRÜN reports as 0.000.
 *  Under reducedMotion:reduce with the field motionless. Buckets the disc by radius as floor-regions.json did. */
const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const SHARP = process.env.CONDYN_SHARP_MODULE ?? "/home/codi/Entwicklung/condyn-admin-pink-visual-g/node_modules/sharp/lib/index.js";
const { chromium } = await import(PW);
const sharp = (await import(SHARP)).default;
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const LUT=new Float64Array(256);
for(let i=0;i<256;i++){const c=i/255;LUT[i]=c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const FRAMES=+(process.env.PINK_FRAMES||24);
async function run(VW,VH){
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:1,reducedMotion:"reduce"});
  const page=await ctx.newPage();
  await page.goto(URL,{waitUntil:"networkidle",timeout:60000});
  await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});
  await page.waitForTimeout(2000);
  while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});
    await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}
  // assert the field really is motionless under reduce, else the "floor" is signal (A-F11)
  const anims=await page.evaluate(()=>{let n=0;for(const e of document.querySelectorAll('[data-testid="mapping-field-svg"] *')){
    const s=getComputedStyle(e); if(s.animationName!=='none'&&s.animationDuration!=='0s') n++;} return n;});
  const geo=await page.evaluate(()=>{
    const svg=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();
    const fr=document.querySelector('[data-testid="mapping-ring-field"]').getBoundingClientRect();
    return {clip:{x:Math.round(svg.x),y:Math.round(svg.y),width:Math.round(svg.width),height:Math.round(svg.height)},
            cx:fr.x+fr.width/2,cy:fr.y+fr.height/2,R:fr.width/2};});
  const clip=geo.clip,W=clip.width,H=clip.height,N=W*H;
  const cx=geo.cx-clip.x,cy=geo.cy-clip.y,R=geo.R;
  const cdp=await page.context().newCDPSession(page);
  const grab=async()=>{const {data}=await cdp.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1},optimizeForSpeed:true});
    const s=await sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});
    const ch=s.info.channels,d=s.data,L=new Float32Array(N);
    for(let i=0;i<N;i++){const q=i*ch;L[i]=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];}
    return L;};
  const mn=new Float32Array(N).fill(Infinity),mx=new Float32Array(N).fill(-Infinity);
  let prev=null,stepSum=0,stepCount=0;
  for(let f=0;f<FRAMES;f++){
    const L=await grab();
    for(let i=0;i<N;i++){if(L[i]<mn[i])mn[i]=L[i];if(L[i]>mx[i])mx[i]=L[i];}
    if(prev){let s=0;for(let i=0;i<N;i++)s+=Math.abs(L[i]-prev[i]);stepSum+=s/N;stepCount++;}
    prev=L;
  }
  const bucket=(pred)=>{let n=0,max=0,g002=0,g004=0,g006=0,g030=0;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;const r=Math.hypot(x-cx,y-cy)/R;
      if(!pred(r))continue;const sw=mx[i]-mn[i];n++;if(sw>max)max=sw;
      if(sw>0.002)g002++;if(sw>0.004)g004++;if(sw>0.006)g006++;if(sw>0.030)g030++;}
    return {n,max:+max.toFixed(6),gt002:g002,gt004:g004,gt006:g006,gt030:g030,
            fracGt002:n?+(g002/n).toFixed(6):0,fracGt004:n?+(g004/n).toFixed(6):0};};
  const out={viewport:`${VW}x${VH}`,frames:FRAMES,region:`${W}x${H}`,animatedElementsUnderReduce:anims,
    wholeRegion:bucket(()=>true), disc:bucket(r=>r<=1.0),
    discStrictInner:bucket(r=>r<=0.98), discEdgeAnnulus:bucket(r=>r>0.98&&r<=1.04),
    quietMidDisc:bucket(r=>r>=0.30&&r<=0.60), outsideDisc:bucket(r=>r>1.04),
    meanAbsStep:+(stepSum/Math.max(1,stepCount)).toExponential(4)};
  await ctx.close();await b.close();return out;
}
const res={commit:"3ec8457d",buildId:"xCD8LBxdjnP97-2Gjs5yr",probe:"static floor under reduce (A-G54 prerequisite)",
  phaseF_reference:{commit:"9cc06f84",wholeRegion_swing_max:0.031872,note:"translucent ground; max was the ring stroke edge at r/R~1.0"},
  runs:[await run(1920,1080),await run(1280,800)]};
console.log(JSON.stringify(res,null,1));
