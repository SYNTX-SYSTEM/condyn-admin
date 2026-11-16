/** PINK · PF-8 per-class firewall on the TIP ef466ca8, Tier A/B/C, per LEVEL (env LEVEL=L0|L2). Bracketed
 *  dof-matched null (0.05/0.15/0.25/0.35, RMS-of-two per harmonic). Masks per sign-class, built UNDER
 *  reduced-motion (the lit ground breathes now, so whole-svg-hide is invalid; hide only the class). GUARDS:
 *  (1) abort unless data-breath=LIVE AND wave animations are running (GRÜN's dead-field green); (2) Tier C not
 *  evaluated <1000px/class; (3) no rung below 2x the per-pixel floor. L2 via clicking a body twice.
 *
 *  PINK PHASE G §46 — THE RINGS RE-TAKE. Copied from the committed phase-F instrument and changed in
 *  THREE PLACES ONLY, so the figures stay comparable: A-G54 says do not move the build and the
 *  instrument together, and the build is already moving (ef466ca8 shelf 0.05 -> 3ec8457d shelf 0.02).
 *    (a) BASE -> :3122, PINK's own stand at 3ec8457d;
 *    (b) the `rings` CLASS IS SPLIT. A-G424: a mask's name is not its population — `rings` was one class
 *        over a 58px BAND (26.04% of the disc, "most of the rings' light" per the component itself) and
 *        three 2px STROKES. §41 adds that those are two measurement REGIMES, and tier B is a p99, which
 *        reads the regime the swatch limb does not license. So: shelfBand and ringStrokes, separately.
 *    (c) output path and commit label.
 *  NOTHING ELSE IS TOUCHED — not the tier math, not the bracketed null, not the guards. Every figure is
 *  reported beside its build AND its shelf alpha, per this lane's own standing requirement. */
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
import sharp from "/home/codi/Entwicklung/condyn-admin-pink-visual-g/node_modules/sharp/lib/index.js";
import { writeFileSync } from "node:fs";
const BASE=process.env.PINK_BASE||"http://127.0.0.1:3122",AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const LEVEL=process.env.LEVEL||"L0";
const LUT=new Float64Array(256);for(let i=0;i<256;i++){const c=i/255;LUT[i]=c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const HARM=[0.1,0.2,0.3],NULLF=[0.05,0.15,0.25,0.35],FREQ=[...HARM,...NULLF];
const brackets=[[0.05,0.15],[0.15,0.25],[0.25,0.35]];const ai=f=>FREQ.indexOf(f);
const CLASSES={shelfBand:'[data-testid="mapping-ring-shelf"]',ringStrokes:'[data-testid="mapping-ring-best"],[data-testid="mapping-ring-horizon"],[data-testid="mapping-ring-field"]',arcs:'[data-mapping-arc]',beams:'[data-beam]',nodes:'[data-mapping-node]',text:'[data-mapping-sector]',outlines:'[data-mapping-body-shape]'};
function invert(Araw){const n=Araw.length;const A=Araw.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>i===j?1:0)]);for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];const d=A[c][c];for(let j=0;j<2*n;j++)A[c][j]/=d;for(let r=0;r<n;r++){if(r===c)continue;const f=A[r][c];for(let j=0;j<2*n;j++)A[r][j]-=f*A[c][j];}}return A.map(r=>r.slice(n));}
async function open(b,reduce){const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:reduce?"reduce":"no-preference"});const page=await ctx.newPage();
  await page.goto(URL,{waitUntil:"networkidle",timeout:60000});await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});await page.waitForTimeout(1500);
  while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}return{ctx,page};}
async function toLevel(page){if(LEVEL==="L0")return;
  // click a body (pool) -> L1, then a body (role) -> L2
  const b1=page.locator('[data-mapping-body]').first();await b1.click().catch(()=>{});await page.waitForTimeout(900);
  const b2=page.locator('[data-mapping-body]').first();await b2.click().catch(()=>{});await page.waitForTimeout(900);}
async function levelInfo(page){return page.evaluate(()=>{const s=document.querySelector('[data-stage]')||document.querySelector('[data-testid="mapping-field"]');const f=document.querySelector('[data-testid="mapping-field"]');
  return{level:f?.getAttribute('data-level')||document.querySelector('[data-level]')?.getAttribute('data-level'),breath:f?.getAttribute('data-breath')||document.querySelector('[data-breath]')?.getAttribute('data-breath'),arcs:document.querySelectorAll('[data-mapping-arc]').length};});}
async function waveAnimating(page){return page.evaluate(()=>{let on=0;for(const e of document.querySelectorAll('[data-testid="mapping-field"] *')){const cs=getComputedStyle(e);if(cs.animationName&&cs.animationName!=="none"&&parseFloat(cs.animationDuration)>0)on++;}return on;});}
const b=await chromium.launch();
// 1) masks under reduced-motion at LEVEL
const R=await open(b,true);await toLevel(R.page);await R.page.waitForTimeout(600);
const clipR=await R.page.evaluate(()=>{const r=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
const N=clipR.width*clipR.height;const cdpR=await R.page.context().newCDPSession(R.page);
const shotR=async()=>{const{data}=await cdpR.send("Page.captureScreenshot",{format:"png",clip:{...clipR,scale:1},optimizeForSpeed:true});const s=await sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});const ch=s.info.channels,d=s.data,L=new Float32Array(N);for(let p=0,q=0;p<N;p++,q+=ch)L[p]=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];return L;};
const Lbase=await shotR();const masks={};
for(const[cls,sel]of Object.entries(CLASSES)){const n0=await R.page.locator(sel).count();await R.page.addStyleTag({content:`${sel}{visibility:hidden !important}`});await R.page.waitForTimeout(300);
  const Lh=await shotR();const ix=[];for(let i=0;i<N;i++)if(Lbase[i]-Lh[i]>0.001)ix.push(i);masks[cls]={ix,els:n0};
  await R.page.evaluate((s)=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes(s)&&st.textContent.includes('visibility:hidden'))st.remove();},sel);await R.page.waitForTimeout(250);}
await R.ctx.close();
const unionSet=new Set();for(const{ix}of Object.values(masks))for(const i of ix)unionSet.add(i);const union=[...unionSet];const U=union.length;const posOf=new Map(union.map((v,k)=>[v,k]));
// 2) LIVE capture at LEVEL, with the dead-field guard
const L=await open(b,false);await toLevel(L.page);await L.page.waitForTimeout(600);
const info=await levelInfo(L.page);const waves=await waveAnimating(L.page);
const clipL=await L.page.evaluate(()=>{const r=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
const clipMatch=clipL.x===clipR.x&&clipL.y===clipR.y&&clipL.width===clipR.width&&clipL.height===clipR.height;
if(info.breath!=="LIVE"||waves===0){console.log(JSON.stringify({ABORT:"dead-field guard: not LIVE or no wave animations",level:LEVEL,info,waves}));await L.ctx.close();await b.close();process.exit(3);}
const cdpL=await L.page.context().newCDPSession(L.page);const pngs=[],ts=[],t0=Date.now();
while(Date.now()-t0<95000){const{data}=await cdpL.send("Page.captureScreenshot",{format:"png",clip:{...clipL,scale:1},optimizeForSpeed:true});pngs.push(Buffer.from(data,"base64"));ts.push((Date.now()-t0)/1000);}
await L.ctx.close();await b.close();
// decode AFTER capture so the loop runs at screenshot-only cadence (inline decode pushed cadence over Nyquist for 0.35Hz)
const rows=[];for(const png of pngs){const s=await sharp(png).raw().toBuffer({resolveWithObject:true});const ch=s.info.channels,d=s.data;const row=new Float32Array(U);for(let k=0;k<U;k++){const q=union[k]*ch;row[k]=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];}rows.push(row);}
// A-F20 on the frequency axis: sampling must resolve the top frequency, else INCONCLUSIVE
const dts=ts.slice(1).map((t,i)=>t-ts[i]).sort((a,b)=>a-b);const medDt=dts[dts.length>>1];const nyq=1/(2*medDt);const maxF=Math.max(...FREQ);const samplingAdequate=maxF<0.9*nyq;
const F=rows.length,P=1+2*FREQ.length;
const A=ts.map(t=>{const r=[1];for(const f of FREQ){const w=2*Math.PI*f*t;r.push(Math.cos(w),Math.sin(w));}return r;});
const AtA=Array.from({length:P},(_,i)=>Array.from({length:P},(_,j)=>{let s=0;for(let r=0;r<F;r++)s+=A[r][i]*A[r][j];return s;}));
const inv=invert(AtA);const Pmat=Array.from({length:P},(_,i)=>Array.from({length:F},(_,r)=>{let s=0;for(let j=0;j<P;j++)s+=inv[i][j]*A[r][j];return s;}));
const ampOf=(beta,f)=>{const k=ai(f);return Math.hypot(beta[1+2*k],beta[2+2*k]);};
function fit(y){const beta=new Float64Array(P);for(let i=0;i<P;i++){let s=0;for(let r=0;r<F;r++)s+=Pmat[i][r]*y[r];beta[i]=s;}const sig=Math.hypot(...HARM.map(f=>ampOf(beta,f)));const ncs=brackets.map(([lo,hi])=>Math.sqrt((ampOf(beta,lo)**2+ampOf(beta,hi)**2)/2));return{sig,nul:Math.hypot(...ncs)};}
const THR=[0.001,0.002,0.004,0.008];const PCT=(c,f)=>c[Math.min(c.length-1,Math.floor(f*(c.length-1)))];
function tiers(ix){const m=ix.length;if(m===0)return{px:0};const y=new Float64Array(F);const pooled=new Float64Array(F);const coh=new Float32Array(m),cohN=new Float32Array(m);
  for(let kk=0;kk<m;kk++){const u=posOf.get(ix[kk]);let mean=0;for(let r=0;r<F;r++){y[r]=rows[r][u];mean+=y[r];}mean/=F;for(let r=0;r<F;r++){y[r]-=mean;pooled[r]+=rows[r][u];}const f=fit(y);coh[kk]=f.sig;cohN[kk]=f.nul;}
  for(let r=0;r<F;r++)pooled[r]/=m;let pm=0;for(let r=0;r<F;r++)pm+=pooled[r];pm/=F;const pf=fit(pooled.map(v=>v-pm));
  const cs=Float64Array.from(coh).sort(),cns=Float64Array.from(cohN).sort();const p99=PCT(cs,.99),p99n=PCT(cns,.99),floorPix=PCT(cns,.5);
  const cS=THR.map(t=>{let n=0;for(let k=0;k<m;k++)if(coh[k]>t)n++;return n;}),cN=THR.map(t=>{let n=0;for(let k=0;k<m;k++)if(cohN[k]>t)n++;return n;});
  const rungs=THR.map((t,i)=>{const ev=(m>=1000)&&(t>=2*floorPix);return`${t}:${ev?(cN[i]===0?(cS[i]?'inf':1):+(cS[i]/cN[i]).toFixed(2)):'n/e'}`;});
  const cRed=THR.some((t,i)=>(m>=1000)&&(t>=2*floorPix)&&cN[i]>0&&cS[i]/cN[i]>1.5)||THR.some((t,i)=>(m>=1000)&&(t>=2*floorPix)&&cN[i]===0&&cS[i]>0);
  return{px:m,ppFloor:+floorPix.toExponential(2),tierA:{sig:+pf.sig.toExponential(2),floor:+pf.nul.toExponential(2),red:pf.sig>0.0005},tierB:{p99:+p99.toExponential(2),nullFloor:+p99n.toExponential(2),resolved:p99n<=0.0004,red:(p99n<=0.0004)&&(p99>0.002),incon:p99n>0.0004},tierC:{rungs,red:cRed}};}
const out={commit:"3ec8457d",shelfAlpha:0.02,shelfAlphaByte:5,instrument:"pink-pf8-rings-retake-g.mjs (phase-F pf8-tip, 3 changes)",level:LEVEL,levelInfo:info,waveAnims:waves,clipMatch,frames:F,spanS:+ts[F-1].toFixed(1),medCadenceMs:+(medDt*1000).toFixed(0),nyquistHz:+nyq.toFixed(3),maxFreqHz:maxF,samplingAdequate,perClass:{}};
for(const[cls,{ix,els}]of Object.entries(masks))out.perClass[cls]={els,...tiers(ix)};
writeFileSync(`outputs/PF8-RINGS-RETAKE-${LEVEL}.json`,JSON.stringify(out,null,1));
for(const[c,t]of Object.entries(out.perClass))console.log(`${LEVEL} ${c.padEnd(9)} els=${t.els} px=${String(t.px).padStart(6)} A=${t.tierA?.sig}/${t.tierA?.floor}${t.tierA?.red?'R':'-'} B.p99=${t.tierB?.p99}${t.tierB?.incon?'INCON':(t.tierB?.red?'FAIL':'pass')} C[${t.tierC?.rungs?.join(' ')}]${t.tierC?.red?'RED':'ok'}`);
console.log(`level=${info.level} breath=${info.breath} waves=${waves} frames=${F} span=${out.spanS} cadence=${out.medCadenceMs}ms nyquist=${out.nyquistHz}Hz samplingAdequate=${samplingAdequate}${samplingAdequate?"":"  >>> INCONCLUSIVE: 0.35Hz aliases <<<"}`);
