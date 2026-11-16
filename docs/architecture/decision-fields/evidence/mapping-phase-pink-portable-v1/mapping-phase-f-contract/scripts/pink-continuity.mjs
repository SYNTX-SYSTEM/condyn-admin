/** PINK · PF-17 (angular) + PF-18 (radial) ground continuity, MASK-BASED per GELB defect #19: keep every sign
 *  DRAWN, exclude sign pixels by mask (a sign's seat IS medium; suppressing a sign makes a hole, leaving it counts
 *  its black seat as a hole — only masking the sign pixels isolates the medium). A hole = a run of MEDIUM pixels
 *  below 0.6x the sliding-local-median ground, shorter than 12px. PF-17 scans >=8 circles (0.2-0.9 R); PF-18 >=8
 *  spokes (0.2-0.9 R). Also reports BRIGHT seams (>1.4x median, <12px) as a symmetric check the fix didn't invert
 *  a dark gash into a light line. Single frozen frame (reduced-motion); continuity is phase-independent. */
import { playwright, sharpModule } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const sharp = await sharpModule();
const BASE="http://127.0.0.1:3120",AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const TAG=process.env.TAG||"?";const VW=+(process.env.VW||1920),VH=+(process.env.VH||1080);
const LUT=new Float64Array(256);for(let i=0;i<256;i++){const c=i/255;LUT[i]=c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const SIGNS=['[data-testid^="mapping-ring"]','[data-mapping-arc]','[data-beam]','[data-mapping-node]','[data-mapping-sector]','[data-mapping-body-shape]'].join(',');
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:1,reducedMotion:"reduce"});const page=await ctx.newPage();
await page.goto(URL,{waitUntil:"networkidle",timeout:60000});await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});await page.waitForTimeout(1500);
while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}
const geo=await page.evaluate(()=>{const svg=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();const ring=document.querySelector('[data-testid="mapping-ring-field"]').getBoundingClientRect();return{clip:{x:Math.round(svg.x),y:Math.round(svg.y),width:Math.round(svg.width),height:Math.round(svg.height)},cx:ring.x+ring.width/2,cy:ring.y+ring.height/2,R:ring.width/2};});
const clip=geo.clip,N=clip.width*clip.height;const cdp=await page.context().newCDPSession(page);
const shot=async()=>{const{data}=await cdp.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1},optimizeForSpeed:true});const s=await sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});const ch=s.info.channels,d=s.data,L=new Float32Array(N);for(let p=0,q=0;p<N;p++,q+=ch)L[p]=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];return L;};
const Lbase=await shot();
// sign mask (exclude): hide signs, diff
await page.addStyleTag({content:`${SIGNS}{visibility:hidden !important}`});await page.waitForTimeout(300);const Lh=await shot();
const sign=new Uint8Array(N);for(let i=0;i<N;i++)if(Lbase[i]-Lh[i]>0.001)sign[i]=1;
await page.evaluate(()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('visibility:hidden'))st.remove();});
await ctx.close();await b.close();
const cx=geo.cx-clip.x,cy=geo.cy-clip.y,R=geo.R,W=clip.width,H=clip.height;
const at=(x,y)=>{const xi=Math.round(x),yi=Math.round(y);if(xi<0||yi<0||xi>=W||yi>=H)return null;const i=yi*W+xi;return{L:Lbase[i],sign:sign[i]};};
// scan a sequence of samples -> find medium runs below 0.6x / above 1.4x sliding local median (<12px)
function scan(samples){ // samples: [{L,sign}] along the path (null-safe)
  const med=samples.map((s,i)=>{const w=[];for(let j=Math.max(0,i-60);j<Math.min(samples.length,i+60);j++){const t=samples[j];if(t&&!t.sign)w.push(t.L);}if(!w.length)return null;w.sort((a,b)=>a-b);return w[w.length>>1];});
  let darkHoles=0,brightSeams=0;let run=0,runKind=0; // kind: -1 dark, +1 bright
  const flush=()=>{if(run>0&&run<12){if(runKind<0)darkHoles++;else brightSeams++;}run=0;runKind=0;};
  for(let i=0;i<samples.length;i++){const s=samples[i],m=med[i];if(!s||s.sign||m===null){flush();continue;}
    if(s.L<0.6*m){if(runKind!==-1)flush();runKind=-1;run++;}
    else if(s.L>1.4*m){if(runKind!==1)flush();runKind=1;run++;}
    else flush();}
  flush();return{darkHoles,brightSeams};}
const radii=[0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9];
let angTotalDark=0,angTotalBright=0;const angDetail=[];
for(const f of radii){const rr=f*R;const n=Math.max(360,Math.round(2*Math.PI*rr));const samples=[];for(let a=0;a<n;a++){const t=a/n*2*Math.PI;samples.push(at(cx+rr*Math.cos(t),cy+rr*Math.sin(t)));}const r=scan(samples);angTotalDark+=r.darkHoles;angTotalBright+=r.brightSeams;angDetail.push(`${f}:${r.darkHoles}d/${r.brightSeams}b`);}
const spokes=12;let radTotalDark=0,radTotalBright=0;const radDetail=[];
for(let sp=0;sp<spokes;sp++){const t=sp/spokes*2*Math.PI;const samples=[];for(let rr=0.2*R;rr<=0.9*R;rr+=1){samples.push(at(cx+rr*Math.cos(t),cy+rr*Math.sin(t)));}const r=scan(samples);radTotalDark+=r.darkHoles;radTotalBright+=r.brightSeams;radDetail.push(`${(t*180/Math.PI).toFixed(0)}:${r.darkHoles}d/${r.brightSeams}b`);}
console.log(JSON.stringify({commit:TAG,viewport:`${VW}x${VH}`,signMaskPx:sign.reduce((a,v)=>a+v,0),
  PF17_angular:{circles:radii.length,darkHoles:angTotalDark,brightSeams:angTotalBright,byRadius:angDetail,pass:angTotalDark===0},
  PF18_radial:{spokes,darkHoles:radTotalDark,brightSeams:radTotalBright,bySpoke:radDetail,pass:radTotalDark===0}},null,1));
