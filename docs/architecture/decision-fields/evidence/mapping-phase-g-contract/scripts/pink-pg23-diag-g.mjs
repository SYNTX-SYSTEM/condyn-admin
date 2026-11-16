const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const SHARP = process.env.CONDYN_SHARP_MODULE ?? "/home/codi/Entwicklung/condyn-admin-pink-visual-g/node_modules/sharp/lib/index.js";
const { chromium } = await import(PW); const sharp = (await import(SHARP)).default;
const URL = "http://127.0.0.1:3122/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=CAN_00000000000000000000000000000002";
const LUT = new Float64Array(256);
for (let i=0;i<256;i++){const c=i/255;LUT[i]=c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const EPS=1e-4, SHELF='.mf-halo circle:not(.mf-wave-halo)';
const FOREIGN='.mf-travel, .mf-beam-glow, [data-beam], text, [data-mapping-arc], [data-mapping-node], [data-mapping-trail], [data-testid^="mapping-measure-"]';
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:"reduce"});
const p=await ctx.newPage();
await p.goto(URL,{waitUntil:"networkidle",timeout:60000});
await p.waitForSelector('[data-testid="mapping-field"]',{timeout:30000}); await p.waitForTimeout(2000);
while(await p.locator('[data-testid="guided-onboarding-overlay"]').count()>0){
  await p.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});
  await p.keyboard.press("Escape").catch(()=>{}); await p.waitForTimeout(400);}
// every element with a RUNNING animation while LIVE, with its own identity
await p.emulateMedia({reducedMotion:"no-preference"}); await p.waitForTimeout(1000);
const animated = await p.evaluate(()=>{
  const out={};
  for(const e of document.querySelectorAll('[data-testid="mapping-field-svg"] *')){
    const s=getComputedStyle(e);
    if(s.animationName==='none'||s.animationDuration==='0s') continue;
    const key=`${e.tagName}.${e.getAttribute('class')||'(noclass)'}|anim=${s.animationName}`;
    out[key]=(out[key]||0)+1;
  }
  return out;});
await p.emulateMedia({reducedMotion:"reduce"}); await p.waitForTimeout(900);
const cdp=await p.context().newCDPSession(p);
const clip=await p.evaluate(()=>{const s=document.querySelector('[data-testid="mapping-field-svg"]');const r=s.getBoundingClientRect();
  return{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
const W=clip.width,H=clip.height,N=W*H;
const grab=async()=>{const {data}=await cdp.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1},optimizeForSpeed:true});
  const s=await sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});
  const ch=s.info.channels,d=s.data,L=new Float32Array(N);
  for(let i=0;i<N;i++){const q=i*ch;L[i]=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];}return L;};
const base=await grab();
const hide=async sel=>{const h=await p.addStyleTag({content:`${sel} { visibility: hidden !important; }`});
  await p.waitForTimeout(500);const L=await grab();await h.evaluate(e=>e.remove());await p.waitForTimeout(400);return L;};
const noShelf=await hide(SHELF), noForeign=await hide(FOREIGN), noField=await hide('.mf-wave-halo');
const seats=await p.evaluate(()=>{const s=document.querySelector('[data-testid="mapping-field-svg"]');
  const sr=s.getBoundingClientRect(),ox=Math.round(sr.x),oy=Math.round(sr.y);
  return [...document.querySelectorAll('[data-mapping-body]')].map(el=>{const sh=el.querySelector('[data-mapping-body-shape]'),r=sh.getBoundingClientRect();
    const m=el.getAttribute("data-marked")==="true",rB=(r.width-(m?2:1.2*1.002))/2;
    return{cx:r.x+r.width/2-ox,cy:r.y+r.height/2-oy,seatEdgeR:rB+(m?1.8:(1.2*1.002+1.6)/2)};});});
const shelfM=new Uint8Array(N); let nS=0;
for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;
  if(Math.abs(base[i]-noForeign[i])>EPS) continue;
  if(seats.some(s=>Math.hypot(x-s.cx,y-s.cy)<=s.seatEdgeR)) continue;
  if(Math.abs(base[i]-noField[i])>EPS) continue;
  if(Math.abs(base[i]-noShelf[i])>EPS){shelfM[i]=1;nS++;}}
// which candidate's footprint explains the shelf mask's moving pixels?
const CAND=['.mf-wave-ground','.mf-wave','.mf-halo','.mf-core','[data-mapping-sector]','[data-mapping-body-shape]','.mf-seat','[data-testid^="mapping-ring"]'];
const overlap={};
for(const sel of CAND){ const L=await hide(sel); let n=0;
  for(let i=0;i<N;i++) if(shelfM[i] && Math.abs(base[i]-L[i])>EPS) n++;
  overlap[sel]={shelfMaskPxAffected:n, shareOfShelfMask:+(n/nS).toFixed(5)};}
// and the live swing of shelf-mask pixels, split by whether .mf-wave-ground covers them
const noGround=await hide('.mf-wave-ground');
const groundCov=new Uint8Array(N);
for(let i=0;i<N;i++) if(shelfM[i]&&Math.abs(base[i]-noGround[i])>EPS) groundCov[i]=1;
await p.emulateMedia({reducedMotion:"no-preference"}); await p.waitForTimeout(1200);
const mn=new Float32Array(N).fill(Infinity),mx=new Float32Array(N).fill(-Infinity);
const t0=Date.now(); while(Date.now()-t0<13000){const L=await grab();
  for(let i=0;i<N;i++){if(L[i]<mn[i])mn[i]=L[i];if(L[i]>mx[i])mx[i]=L[i];}}
const withG=[],withoutG=[];
for(let i=0;i<N;i++) if(shelfM[i]) (groundCov[i]?withG:withoutG).push(mx[i]-mn[i]);
const st=a=>{if(!a.length)return{n:0};const s=Float64Array.from(a).sort();
  const q=f=>s[Math.min(s.length-1,Math.max(0,Math.ceil(f*s.length)-1))];
  return{n:s.length,median:+q(0.5).toFixed(7),p99:+q(0.99).toFixed(7),p999:+q(0.999).toFixed(7),max:+s[s.length-1].toFixed(7)};};
await ctx.close();await b.close();
console.log(JSON.stringify({animatedElementsLive:animated, shelfMaskPx:nS, footprintOverlap:overlap,
  shelfLive_coveredByGroundWave:st(withG), shelfLive_notCoveredByGroundWave:st(withoutG)},null,1));
