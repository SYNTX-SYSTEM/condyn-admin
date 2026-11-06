/** PINK · PF-8 three-tier lock-in v2 — proper LEAST-SQUARES multi-sinusoid fit (DC + 6 freqs) over a longer,
 *  naturally-jittered window, so the decoys (to 0.59Hz) are estimated correctly despite ~650ms mean spacing
 *  (uneven sampling + LSQ breaks the alias the simple DFT projection suffered). CDP capture for speed. Unblurred.
 *  Signal RSS over {T,T/2,T/3}; null RSS over {T/2.7,T/4.3,T/5.9}. Run at base 9cc06f84 to check GELB's §19. */
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
import sharp from "/home/codi/Entwicklung/condyn-admin-pink-visual-e/node_modules/sharp/lib/index.js";
const BASE="http://127.0.0.1:3120",AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const LUT=new Float64Array(256);for(let i=0;i<256;i++){const c=i/255;LUT[i]=c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const SIG=[0.1,0.2,0.3],DEC=[0.15,0.25,0.35],FREQ=[...SIG,...DEC];
// --- tiny matrix helpers ---
function invert(Araw){const n=Araw.length;const A=Araw.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>i===j?1:0)]);
  for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];
    const d=A[c][c];for(let j=0;j<2*n;j++)A[c][j]/=d;
    for(let r=0;r<n;r++){if(r===c)continue;const f=A[r][c];for(let j=0;j<2*n;j++)A[r][j]-=f*A[c][j];}}
  return A.map(r=>r.slice(n));}
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:"no-preference"});
const page=await ctx.newPage();
await page.goto(URL,{waitUntil:"networkidle",timeout:60000});
await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});await page.waitForTimeout(1500);
while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}
if(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){console.log(JSON.stringify({ABORT:"overlay"}));process.exit(2);}
const clip=await page.evaluate(()=>{const r=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
const N=clip.width*clip.height;
const cdp=await page.context().newCDPSession(page);
const shot=async()=>{const{data}=await cdp.send("Page.captureScreenshot",{format:"png",clip:{x:clip.x,y:clip.y,width:clip.width,height:clip.height,scale:1}});const s=await sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});return s;};
const lumFull=(s)=>{const ch=s.info.channels,d=s.data,L=new Float32Array(N);for(let p=0,q=0;p<N;p++,q+=ch)L[p]=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];return L;};
// sign mask: stage vs svg hidden
const Lstage=lumFull(await shot());
await page.addStyleTag({content:`[data-testid="mapping-field-svg"]{visibility:hidden !important}`});await page.waitForTimeout(350);
const Lhidden=lumFull(await shot());
const idx=[];for(let i=0;i<N;i++)if(Lstage[i]-Lhidden[i]>0.001)idx.push(i);const M=idx.length;
await page.evaluate(()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('mapping-field-svg')&&st.textContent.includes('visibility:hidden'))st.remove();});
await page.waitForTimeout(400);
// capture ~26s, store sign-pixel rows + timestamps
const rows=[],ts=[],t0=Date.now();
while(Date.now()-t0<26000){const s=await shot();const ch=s.info.channels,d=s.data;const row=new Float32Array(M);
  for(let k=0;k<M;k++){const q=idx[k]*ch;row[k]=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];}
  rows.push(row);ts.push((Date.now()-t0)/1000);}
await ctx.close();await b.close();
const F=rows.length;
// design matrix A (F x 13): [1, cos w1 t, sin w1 t, ... x6]
const P=13;const A=ts.map(t=>{const r=[1];for(const f of FREQ){const w=2*Math.PI*f*t;r.push(Math.cos(w),Math.sin(w));}return r;});
// AtA, invert, build Pmat = inv(AtA) * At  (13 x F)
const AtA=Array.from({length:P},(_,i)=>Array.from({length:P},(_,j)=>{let s=0;for(let r=0;r<F;r++)s+=A[r][i]*A[r][j];return s;}));
const inv=invert(AtA);
const Pmat=Array.from({length:P},(_,i)=>Array.from({length:F},(_,r)=>{let s=0;for(let j=0;j<P;j++)s+=inv[i][j]*A[r][j];return s;}));
const fitAmps=(y)=>{const beta=new Float64Array(P);for(let i=0;i<P;i++){let s=0;for(let r=0;r<F;r++)s+=Pmat[i][r]*y[r];beta[i]=s;}
  const amps=[];for(let k=0;k<6;k++)amps.push(Math.hypot(beta[1+2*k],beta[2+2*k]));return amps;};
const coh=new Float32Array(M),cohN=new Float32Array(M);const pooled=new Float64Array(F);const y=new Float64Array(F);
for(let k=0;k<M;k++){for(let r=0;r<F;r++){y[r]=rows[r][k];pooled[r]+=rows[r][k];}const a=fitAmps(y);
  coh[k]=Math.hypot(a[0],a[1],a[2]);cohN[k]=Math.hypot(a[3],a[4],a[5]);}
for(let r=0;r<F;r++)pooled[r]/=M;const pa=fitAmps(pooled);const tierA=Math.hypot(pa[0],pa[1],pa[2]),tierAfloor=Math.hypot(pa[3],pa[4],pa[5]);
const sortC=a=>{const c=Float64Array.from(a);c.sort();return c;},PCT=(c,f)=>c[Math.min(c.length-1,Math.floor(f*(c.length-1)))];
const cs=sortC(coh),cns=sortC(cohN),p99=PCT(cs,.99),p99n=PCT(cns,.99);
const THR=[0.001,0.002,0.004,0.008];
const cntS=THR.map(t=>{let n=0;for(let k=0;k<M;k++)if(coh[k]>t)n++;return n;});
const cntN=THR.map(t=>{let n=0;for(let k=0;k<M;k++)if(cohN[k]>t)n++;return n;});
const ratios=THR.map((_,i)=>cntN[i]===0?(cntS[i]?Infinity:1):+(cntS[i]/cntN[i]).toFixed(2));
console.log(JSON.stringify({commit:"9cc06f84",method:"LSQ 13-param fit, uneven sampling",signMaskPixels:M,frames:F,spanS:+ts[F-1].toFixed(1),meanCadenceMs:+(ts[F-1]/(F-1)*1000).toFixed(0),
  tierA:{sigAmp:+tierA.toExponential(3),bound:0.0005,floor:+tierAfloor.toExponential(3),verdict:tierA>0.0005?"RED":(tierAfloor<0.00025?"GREEN":"INCON")},
  tierB:{p99sig:+p99.toExponential(3),p99null:+p99n.toExponential(3),ratioToFloor:+(p99/p99n).toFixed(2),verdict:p99>2*p99n?"RED":"green/incon"},
  tierC:{thresholds:THR,signal:cntS,null:cntN,ratios,verdict:ratios.some(r=>r>1.5)?"RED":"green"}},null,1));
