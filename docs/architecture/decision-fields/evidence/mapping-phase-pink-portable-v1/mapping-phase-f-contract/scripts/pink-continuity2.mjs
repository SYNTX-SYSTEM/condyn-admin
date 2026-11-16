/** PINK · PF-17/PF-18 v2 — mask-based, AND exclude the intended ENGRAVED rings (A-F12: rings are dark grooves in
 *  the medium, below 0.6x median, so a radial scan crossing them reads them as holes). Fetch all ring radii;
 *  classify each hole as AT-RING (within +-0.025 R of a ring radius = intended engraved ring) vs OFF-RING (a real
 *  medium hole = the defect PF-18 exists for). Also record hole r/R. Signs excluded by mask (defect #19). */
import { playwright, sharpModule } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const sharp = await sharpModule();
const BASE="http://127.0.0.1:3120",AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const TAG=process.env.TAG||"?",VW=+(process.env.VW||1920),VH=+(process.env.VH||1080);
const LUT=new Float64Array(256);for(let i=0;i<256;i++){const c=i/255;LUT[i]=c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const SIGNS=['[data-testid^="mapping-ring"]','[data-mapping-arc]','[data-beam]','[data-mapping-node]','[data-mapping-sector]','[data-mapping-body-shape]'].join(',');
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:1,reducedMotion:"reduce"});const page=await ctx.newPage();
await page.goto(URL,{waitUntil:"networkidle",timeout:60000});await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});await page.waitForTimeout(1500);
while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}
const geo=await page.evaluate(()=>{const svg=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();const fr=document.querySelector('[data-testid="mapping-ring-field"]').getBoundingClientRect();const R=fr.width/2;const cx=fr.x+fr.width/2,cy=fr.y+fr.height/2;
  const ringR=[...document.querySelectorAll('[data-testid^="mapping-ring"]')].map(e=>{const r=e.getBoundingClientRect();return +( (r.width/2)/R ).toFixed(3);});
  return{clip:{x:Math.round(svg.x),y:Math.round(svg.y),width:Math.round(svg.width),height:Math.round(svg.height)},cx,cy,R,ringR:[...new Set(ringR)].sort((a,b)=>a-b)};});
const clip=geo.clip,N=clip.width*clip.height;const cdp=await page.context().newCDPSession(page);
const shot=async()=>{const{data}=await cdp.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1},optimizeForSpeed:true});const s=await sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});const ch=s.info.channels,d=s.data,L=new Float32Array(N);for(let p=0,q=0;p<N;p++,q+=ch)L[p]=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];return L;};
const Lbase=await shot();await page.addStyleTag({content:`${SIGNS}{visibility:hidden !important}`});await page.waitForTimeout(300);const Lh=await shot();
const sign=new Uint8Array(N);for(let i=0;i<N;i++)if(Lbase[i]-Lh[i]>0.001)sign[i]=1;
await ctx.close();await b.close();
const cx=geo.cx-clip.x,cy=geo.cy-clip.y,R=geo.R,W=clip.width,H=clip.height,rings=geo.ringR;
const atRing=rr=>rings.some(rg=>Math.abs(rr-rg)<=0.025);
const at=(x,y)=>{const xi=Math.round(x),yi=Math.round(y);if(xi<0||yi<0||xi>=W||yi>=H)return null;const i=yi*W+xi;return{L:Lbase[i],sign:sign[i]};};
function scanHoles(samples,rrOf){ // returns list of {startRR, len} for sub-12px dark medium runs
  const med=samples.map((s,i)=>{const w=[];for(let j=Math.max(0,i-60);j<Math.min(samples.length,i+60);j++){const t=samples[j];if(t&&!t.sign)w.push(t.L);}if(!w.length)return null;w.sort((a,b)=>a-b);return w[w.length>>1];});
  const holes=[];let run=0,startI=0;const flush=i=>{if(run>0&&run<12)holes.push({rr:rrOf((startI+i-1)/2),len:run});run=0;};
  for(let i=0;i<samples.length;i++){const s=samples[i],m=med[i];if(!s||s.sign||m===null){flush(i);continue;}if(s.L<0.6*m){if(run===0)startI=i;run++;}else flush(i);}flush(samples.length);return holes;}
// PF-17 angular: circles at radii avoiding rings
const radii=[0.25,0.35,0.45,0.55,0.65,0.72,0.82,0.86].filter(f=>!atRing(f));
let angOff=0,angAt=0;const angHoles=[];
for(const f of radii){const rr=f*R;const n=Math.max(360,Math.round(2*Math.PI*rr));const samples=[];for(let a=0;a<n;a++){const t=a/n*2*Math.PI;samples.push(at(cx+rr*Math.cos(t),cy+rr*Math.sin(t)));}
  const hs=scanHoles(samples,()=>f);for(const h of hs){if(atRing(f))angAt++;else{angOff++;angHoles.push(`r${f}`);}}}
// PF-18 radial: spokes 0.2->0.9 R, classify each hole by its radius
const spokes=16;let radOff=0,radAt=0;const radOffList=[];
for(let sp=0;sp<spokes;sp++){const t=sp/spokes*2*Math.PI;const samples=[];const rrs=[];for(let rr=0.2*R;rr<=0.9*R;rr+=1){samples.push(at(cx+rr*Math.cos(t),cy+rr*Math.sin(t)));rrs.push(rr/R);}
  const hs=scanHoles(samples,idx=>rrs[Math.max(0,Math.min(rrs.length-1,Math.round(idx)))]);
  for(const h of hs){if(atRing(h.rr))radAt++;else{radOff++;radOffList.push(`${(t*180/Math.PI).toFixed(0)}deg@${h.rr.toFixed(2)}R`);}}}
console.log(JSON.stringify({commit:TAG,viewport:`${VW}x${VH}`,ringRadii:rings,
  PF17_angular:{circles:radii.length,offRingHoles:angOff,atRingHoles:angAt,where:angHoles,PASS:angOff===0},
  PF18_radial:{spokes,offRingHoles:radOff,atRingHoles:radAt,offWhere:radOffList.slice(0,20),PASS:radOff===0}},null,1));
