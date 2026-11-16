/** PINK · decisive disentangle: is the Tier B/C red on arc/beam/ring/outline pixels a REAL seat-coverage leak
 *  (the breathing ground shows through at the mark footprint) or my fringe-inclusive mask? Build per-class masks
 *  under reduced-motion (signs shown). Then LIVE-capture with ALL firewalled signs HIDDEN and measure the breath
 *  at those SAME pixels = what breathes UNDER the mark. If underA ~ shownA -> ground breathes there, seat not
 *  covering -> real leak. If underA ~ 0 -> seat static, the shown breath is the ink (different). */
import { playwright, sharpModule } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const sharp = await sharpModule();
const BASE=process.env.PINK_BASE ?? "http://127.0.0.1:3120",AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const LUT=new Float64Array(256);for(let i=0;i<256;i++){const c=i/255;LUT[i]=c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const HARM=[0.1,0.2,0.3],NULLF=[0.05,0.15,0.25,0.35],FREQ=[...HARM,...NULLF];const brackets=[[0.05,0.15],[0.15,0.25],[0.25,0.35]];const ai=f=>FREQ.indexOf(f);
const CLASSES={rings:'[data-testid^="mapping-ring"]',arcs:'[data-mapping-arc]',beams:'[data-beam]',nodes:'[data-mapping-node]',text:'[data-mapping-sector]',outlines:'[data-mapping-body-shape]'};
const ALLSEL=Object.values(CLASSES).join(',');
function invert(Araw){const n=Araw.length;const A=Araw.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>i===j?1:0)]);for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];const d=A[c][c];for(let j=0;j<2*n;j++)A[c][j]/=d;for(let r=0;r<n;r++){if(r===c)continue;const f=A[r][c];for(let j=0;j<2*n;j++)A[r][j]-=f*A[c][j];}}return A.map(r=>r.slice(n));}
async function open(b,reduce){const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:reduce?"reduce":"no-preference"});const page=await ctx.newPage();await page.goto(URL,{waitUntil:"networkidle",timeout:60000});await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});await page.waitForTimeout(1500);while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}return{ctx,page};}
const b=await chromium.launch();
const R=await open(b,true);
const clip=await R.page.evaluate(()=>{const r=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
const N=clip.width*clip.height;const cdpR=await R.page.context().newCDPSession(R.page);
const shotR=async()=>{const{data}=await cdpR.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1}});const s=await sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});const ch=s.info.channels,d=s.data,L=new Float32Array(N);for(let p=0,q=0;p<N;p++,q+=ch)L[p]=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];return L;};
const Lbase=await shotR();const masks={};
for(const[cls,sel]of Object.entries(CLASSES)){await R.page.addStyleTag({content:`${sel}{visibility:hidden !important}`});await R.page.waitForTimeout(300);const Lh=await shotR();const ix=[];for(let i=0;i<N;i++)if(Lbase[i]-Lh[i]>0.001)ix.push(i);masks[cls]=ix;await R.page.evaluate((s)=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes(s)&&st.textContent.includes('visibility:hidden'))st.remove();},sel);await R.page.waitForTimeout(250);}
await R.ctx.close();
const unionSet=new Set();for(const ix of Object.values(masks))for(const i of ix)unionSet.add(i);const union=[...unionSet];const U=union.length;const posOf=new Map(union.map((v,k)=>[v,k]));
// LIVE with all firewalled signs HIDDEN -> measure ground/seat breath UNDER the mark footprints
const L=await open(b,false);await L.page.addStyleTag({content:`${ALLSEL}{visibility:hidden !important}`});await L.page.waitForTimeout(500);
const cdpL=await L.page.context().newCDPSession(L.page);const pngs=[],ts=[],t0=Date.now();
while(Date.now()-t0<95000){const{data}=await cdpL.send("Page.captureScreenshot",{format:"png",clip:{...clip,scale:1}});pngs.push(Buffer.from(data,"base64"));ts.push((Date.now()-t0)/1000);}
await L.ctx.close();await b.close();
const rows=[];for(const png of pngs){const s=await sharp(png).raw().toBuffer({resolveWithObject:true});const ch=s.info.channels,d=s.data;const row=new Float32Array(U);for(let k=0;k<U;k++){const q=union[k]*ch;row[k]=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];}rows.push(row);}
const F=rows.length,P=1+2*FREQ.length;const dts=ts.slice(1).map((t,i)=>t-ts[i]).sort((a,b)=>a-b);const nyq=1/(2*dts[dts.length>>1]);
const A=ts.map(t=>{const r=[1];for(const f of FREQ){const w=2*Math.PI*f*t;r.push(Math.cos(w),Math.sin(w));}return r;});
const AtA=Array.from({length:P},(_,i)=>Array.from({length:P},(_,j)=>{let s=0;for(let r=0;r<F;r++)s+=A[r][i]*A[r][j];return s;}));
const inv=invert(AtA);const Pmat=Array.from({length:P},(_,i)=>Array.from({length:F},(_,r)=>{let s=0;for(let j=0;j<P;j++)s+=inv[i][j]*A[r][j];return s;}));
const ampOf=(beta,f)=>{const k=ai(f);return Math.hypot(beta[1+2*k],beta[2+2*k]);};
function fit(y){const beta=new Float64Array(P);for(let i=0;i<P;i++){let s=0;for(let r=0;r<F;r++)s+=Pmat[i][r]*y[r];beta[i]=s;}return{sig:Math.hypot(...HARM.map(f=>ampOf(beta,f))),nul:Math.hypot(...brackets.map(([lo,hi])=>Math.sqrt((ampOf(beta,lo)**2+ampOf(beta,hi)**2)/2)))};}
const PCT=(c,f)=>c[Math.min(c.length-1,Math.floor(f*(c.length-1)))];
console.log(`UNDER-MARK breath (signs hidden) frames=${F} nyquist=${nyq.toFixed(3)}Hz`);
for(const[cls,ix]of Object.entries(masks)){const m=ix.length;const pooled=new Float64Array(F);const coh=new Float32Array(m);const y=new Float64Array(F);
  for(let kk=0;kk<m;kk++){const u=posOf.get(ix[kk]);let mean=0;for(let r=0;r<F;r++){y[r]=rows[r][u];mean+=y[r];}mean/=F;for(let r=0;r<F;r++){y[r]-=mean;pooled[r]+=rows[r][u];}coh[kk]=fit(y).sig;}
  for(let r=0;r<F;r++)pooled[r]/=m;let pm=0;for(let r=0;r<F;r++)pm+=pooled[r];pm/=F;const pA=fit(pooled.map(v=>v-pm)).sig;
  const cs=Float64Array.from(coh).sort();
  console.log(`${cls.padEnd(9)} px=${String(m).padStart(6)} underA=${pA.toExponential(2)} underP99=${PCT(cs,.99).toExponential(2)} underP50=${PCT(cs,.5).toExponential(2)}`);}
