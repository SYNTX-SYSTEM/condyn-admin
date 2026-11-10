/** PINK · PHASE G · THE SHELF RING'S ENGRAVED MINIMUM vs ITS ACTUAL SURROUND on 3ec8457d (A-G56/A-G62).
 *  GELB attributed the vanishing to "byte-identical to the plate it sits on". The source says otherwise:
 *  PersonJobMappingField.tsx:882 draws an OPAQUE BLACK seat (SEAT = rgba(0,0,0,1)) across the FULL band width
 *  BEFORE :883 strokes the shelf in rgba(INK, 0.02). So the band does not sit on the plate — the plate is
 *  occluded under it. Measured here rather than reasoned: per angle take the MINIMUM across the band width
 *  (the engraved statistic, A-F29/§29 — max reads crossing bodies, which is PINK's own phase-F contamination
 *  finding), then report the darkest angle; and sample the plate in annuli just INSIDE and just OUTSIDE the
 *  band as the real local surround. */
const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const SHARP = process.env.CONDYN_SHARP_MODULE ?? "/home/codi/Entwicklung/condyn-admin-pink-visual-g/node_modules/sharp/lib/index.js";
const { chromium } = await import(PW);
const sharp = (await import(SHARP)).default;
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const LUT=new Float64Array(256);
for(let i=0;i<256;i++){const c=i/255;LUT[i]=c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const ANGLES=720;
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
  // geometry from the shelf circle itself via getScreenCTM (circles carry no cx/cy — positioned by transform;
  // parseFloat(null) would silently read 0, the bug PINK hit and fixed in phase F).
  const geo=await page.evaluate(()=>{
    const svg=document.querySelector('[data-testid="mapping-field-svg"]');
    const box=svg.getBoundingClientRect();
    const sh=document.querySelector('[data-testid="mapping-ring-shelf"]');
    const m=sh.getScreenCTM();
    const r=parseFloat(sh.getAttribute('r'));
    const sw=parseFloat(sh.getAttribute('stroke-width'));
    const scale=Math.hypot(m.a,m.b);
    const p=new DOMPoint(0,0).matrixTransform(m);
    return {clip:{x:Math.round(box.x),y:Math.round(box.y),width:Math.round(box.width),height:Math.round(box.height)},
            cxAbs:p.x, cyAbs:p.y, rUser:r, swUser:sw, scale,
            alphaAttr: sh.getAttribute('data-ring-luminance'), strokeAttr: sh.getAttribute('stroke')};});
  const clip=geo.clip,W=clip.width,H=clip.height,N=W*H;
  const cx=geo.cxAbs-clip.x, cy=geo.cyAbs-clip.y;
  const rPx=geo.rUser*geo.scale, swPx=geo.swUser*geo.scale;
  const cdp=await page.context().newCDPSession(page);
  const {data}=await cdp.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1},optimizeForSpeed:true});
  const s=await sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});
  const ch=s.info.channels,d=s.data;
  const at=(x,y)=>{const xi=Math.round(x),yi=Math.round(y);
    if(xi<0||yi<0||xi>=W||yi>=H)return null;const q=(yi*W+xi)*ch;
    return {L:0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]],rgb:[d[q],d[q+1],d[q+2]]};};
  // band: r +- sw/2, sampled across its width, inset 1.5px each side to avoid the band's own AA edge
  const inner=rPx-swPx/2+1.5, outer=rPx+swPx/2-1.5;
  const STEPS=Math.max(8,Math.floor(outer-inner));
  const perAngleMin=[], perAngleMinRGB=[];
  for(let a=0;a<ANGLES;a++){
    const th=(a/ANGLES)*2*Math.PI; let mn=Infinity,mnRGB=null;
    for(let i=0;i<=STEPS;i++){
      const rr=inner+(outer-inner)*(i/STEPS);
      const p=at(cx+rr*Math.cos(th), cy+rr*Math.sin(th));
      if(p&&p.L<mn){mn=p.L;mnRGB=p.rgb;}
    }
    if(mn<Infinity){perAngleMin.push(mn);perAngleMinRGB.push(mnRGB);}
  }
  const sorted=[...perAngleMin].sort((x,y)=>x-y);
  const pct=q=>sorted[Math.min(sorted.length-1,Math.floor(q*sorted.length))];
  const darkestIdx=perAngleMin.indexOf(sorted[0]);
  // the REAL local surround: annuli just inside and just outside the band (the plate), min per angle
  const ring=(r0,r1)=>{const v=[];for(let a=0;a<ANGLES;a++){const th=(a/ANGLES)*2*Math.PI;
      let mn=Infinity,rgb=null;for(let i=0;i<=6;i++){const rr=r0+(r1-r0)*(i/6);
        const p=at(cx+rr*Math.cos(th),cy+rr*Math.sin(th));if(p&&p.L<mn){mn=p.L;rgb=p.rgb;}}
      if(mn<Infinity)v.push({L:mn,rgb});}
    const ss=[...v].map(o=>o.L).sort((x,y)=>x-y);
    return {n:v.length,min:ss[0],p50:ss[Math.floor(ss.length/2)],modeRGB:v[Math.floor(v.length/2)].rgb};};
  const justInside = ring(rPx-swPx/2-9, rPx-swPx/2-3);
  const justOutside= ring(rPx+swPx/2+3, rPx+swPx/2+9);
  await ctx.close();await b.close();
  return {viewport:`${VW}x${VH}`, rUser:geo.rUser, swUser:geo.swUser, scale:+geo.scale.toFixed(5),
    bandPx:{rPx:+rPx.toFixed(2), widthPx:+swPx.toFixed(2), sampledSteps:STEPS},
    declaredAlpha:geo.alphaAttr, stroke:geo.strokeAttr, angles:perAngleMin.length,
    engravedMin_darkestAngle:+sorted[0].toExponential(6),
    engravedMin_rgb_atDarkest:perAngleMinRGB[darkestIdx],
    engravedMin_p01:+pct(0.01).toExponential(6), engravedMin_p50:+pct(0.50).toExponential(6),
    engravedMin_p99:+pct(0.99).toExponential(6), engravedMin_max:+sorted[sorted.length-1].toExponential(6),
    plate_justInside:{min:+justInside.min.toExponential(6),p50:+justInside.p50.toExponential(6),rgb:justInside.modeRGB},
    plate_justOutside:{min:+justOutside.min.toExponential(6),p50:+justOutside.p50.toExponential(6),rgb:justOutside.modeRGB}};
}
const out={commit:"3ec8457d",buildId:"xCD8LBxdjnP97-2Gjs5yr",pin:"PF-15 shelf limb (A-G56/A-G62)",
  sourceNote:"PersonJobMappingField.tsx:882 draws SEAT=rgba(0,0,0,1) across the FULL band width before :883 strokes rgba(205,240,255,0.02). The band composites over BLACK, not over the plate.",
  runs:[await run(1920,1080),await run(1280,800)]};
console.log(JSON.stringify(out,null,1));
