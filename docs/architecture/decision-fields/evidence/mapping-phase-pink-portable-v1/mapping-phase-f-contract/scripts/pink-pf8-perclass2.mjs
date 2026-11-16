/** PINK · PF-8 per-class, BRACKETED NULL (§27/A-F17 dof-matched). harmonics {0.1,0.2,0.3}; raw null freqs
 *  {0.05,0.15,0.25,0.35}; each harmonic f_k's null = RMS of its two brackets f_k±0.05 → 3 dof-matched components
 *  (not a flat 4-RSS), so null is spectrally CENTRED on the signal and carries the SAME dof. Guards: Tier C not
 *  evaluated below 1000 px/class; no rung below 2× the per-pixel floor. Masks under reduced-motion; live ≥58s. */
import { writeFileSync } from "node:fs";
import { playwright, sharpModule, OUT_DIR, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
import { resolve } from "node:path";
const chromium = await playwright();
const sharp = await sharpModule();
const PINK_PROV_9cc06f84 = await provenance({ declaredCommit: "9cc06f84" });
const BASE="http://127.0.0.1:3120",AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const LUT=new Float64Array(256);for(let i=0;i<256;i++){const c=i/255;LUT[i]=c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const HARM=[0.1,0.2,0.3], NULLF=[0.05,0.15,0.25,0.35], FREQ=[...HARM,...NULLF];      // fit 7 freqs -> 15 params
const brackets=[[0.05,0.15],[0.15,0.25],[0.25,0.35]];                                  // for f1,f2,f3
const ai=f=>FREQ.indexOf(f);
const CLASSES={rings:'[data-testid^="mapping-ring"]',arcs:'[data-mapping-arc]',beams:'[data-beam]',nodes:'[data-mapping-node]',text:'text',outlines:'[data-mapping-body-shape]'};
function invert(Araw){const n=Araw.length;const A=Araw.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>i===j?1:0)]);
  for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];const d=A[c][c];for(let j=0;j<2*n;j++)A[c][j]/=d;for(let r=0;r<n;r++){if(r===c)continue;const f=A[r][c];for(let j=0;j<2*n;j++)A[r][j]-=f*A[c][j];}}return A.map(r=>r.slice(n));}
async function openPage(b,reduce){const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:reduce?"reduce":"no-preference"});const page=await ctx.newPage();
  await page.goto(URL,{waitUntil:"networkidle",timeout:60000});await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});await page.waitForTimeout(1500);
  while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}return{ctx,page};}
const b=await chromium.launch();
const R=await openPage(b,true);
const clipR=await R.page.evaluate(()=>{const r=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
const N=clipR.width*clipR.height;const cdpR=await R.page.context().newCDPSession(R.page);
const shotR=async()=>{const{data}=await cdpR.send("Page.captureScreenshot",{format:"png",clip:{...clipR,scale:1}});const s=await sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});const ch=s.info.channels,d=s.data,L=new Float32Array(N);for(let p=0,q=0;p<N;p++,q+=ch)L[p]=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];return L;};
const Lbase=await shotR();const masks={};
for(const[cls,sel]of Object.entries(CLASSES)){await R.page.addStyleTag({content:`${sel}{visibility:hidden !important}`});await R.page.waitForTimeout(300);
  const Lh=await shotR();const ix=[];for(let i=0;i<N;i++)if(Lbase[i]-Lh[i]>0.001)ix.push(i);masks[cls]=ix;
  await R.page.evaluate((s)=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes(s)&&st.textContent.includes('visibility:hidden'))st.remove();},sel);await R.page.waitForTimeout(250);}
await R.ctx.close();
const unionSet=new Set();for(const ix of Object.values(masks))for(const i of ix)unionSet.add(i);const union=[...unionSet];const U=union.length;const posOf=new Map(union.map((v,k)=>[v,k]));
const L=await openPage(b,false);
const clipL=await L.page.evaluate(()=>{const r=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
const clipMatch=clipL.x===clipR.x&&clipL.y===clipR.y&&clipL.width===clipR.width&&clipL.height===clipR.height;
const cdpL=await L.page.context().newCDPSession(L.page);const rows=[],ts=[],t0=Date.now();
while(Date.now()-t0<58000){const{data}=await cdpL.send("Page.captureScreenshot",{format:"png",clip:{...clipL,scale:1}});const s=await sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});const ch=s.info.channels,d=s.data;const row=new Float32Array(U);for(let k=0;k<U;k++){const q=union[k]*ch;row[k]=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];}rows.push(row);ts.push((Date.now()-t0)/1000);}
await L.ctx.close();await b.close();
const F=rows.length,P=1+2*FREQ.length;
const A=ts.map(t=>{const r=[1];for(const f of FREQ){const w=2*Math.PI*f*t;r.push(Math.cos(w),Math.sin(w));}return r;});
const AtA=Array.from({length:P},(_,i)=>Array.from({length:P},(_,j)=>{let s=0;for(let r=0;r<F;r++)s+=A[r][i]*A[r][j];return s;}));
const inv=invert(AtA);const Pmat=Array.from({length:P},(_,i)=>Array.from({length:F},(_,r)=>{let s=0;for(let j=0;j<P;j++)s+=inv[i][j]*A[r][j];return s;}));
const ampOf=(beta,f)=>{const k=ai(f);return Math.hypot(beta[1+2*k],beta[2+2*k]);};
function fit(y){const beta=new Float64Array(P);for(let i=0;i<P;i++){let s=0;for(let r=0;r<F;r++)s+=Pmat[i][r]*y[r];beta[i]=s;}
  const sig=Math.hypot(...HARM.map(f=>ampOf(beta,f)));
  const ncs=brackets.map(([lo,hi])=>Math.sqrt((ampOf(beta,lo)**2+ampOf(beta,hi)**2)/2));   // dof-matched: 3 components
  return{sig,nul:Math.hypot(...ncs)};}
const THR=[0.001,0.002,0.004,0.008];const PCT=(c,f)=>c[Math.min(c.length-1,Math.floor(f*(c.length-1)))];const MED=c=>PCT(c,.5);
function tiersFor(ix){const m=ix.length;const y=new Float64Array(F);const pooled=new Float64Array(F);const coh=new Float32Array(m),cohN=new Float32Array(m);
  for(let kk=0;kk<m;kk++){const u=posOf.get(ix[kk]);let mean=0;for(let r=0;r<F;r++){y[r]=rows[r][u];mean+=y[r];}mean/=F;for(let r=0;r<F;r++){y[r]-=mean;pooled[r]+=rows[r][u];}const f=fit(y);coh[kk]=f.sig;cohN[kk]=f.nul;}
  for(let r=0;r<F;r++)pooled[r]/=m;let pm=0;for(let r=0;r<F;r++)pm+=pooled[r];pm/=F;const pf=fit(pooled.map(v=>v-pm));
  const cs=Float64Array.from(coh).sort(),cns=Float64Array.from(cohN).sort();const p99=PCT(cs,.99),p99n=PCT(cns,.99);
  const floorPix=MED(cns);                                    // per-pixel null floor
  const cS=THR.map(t=>{let n=0;for(let k=0;k<m;k++)if(coh[k]>t)n++;return n;}),cN=THR.map(t=>{let n=0;for(let k=0;k<m;k++)if(cohN[k]>t)n++;return n;});
  const rungs=THR.map((t,i)=>{const evaluated=(m>=1000)&&(t>=2*floorPix);const ratio=cN[i]===0?(cS[i]?Infinity:1):+(cS[i]/cN[i]).toFixed(2);return{t,evaluated,ratio};});
  const cRed=rungs.some(r=>r.evaluated&&r.ratio>1.5);
  return{px:m,perPixelFloor:+floorPix.toExponential(2),tierA:{sig:+pf.sig.toExponential(2),floor:+pf.nul.toExponential(2),red:pf.sig>0.0005},
    tierB:{p99:+p99.toExponential(2),floor:+p99n.toExponential(2),ratio:+(p99/p99n).toFixed(2),red:p99>2*p99n},
    tierC:{rungs:rungs.map(r=>`${r.t}:${r.evaluated?r.ratio:'n/e'}`),red:cRed}};}
const out={commit: PINK_PROV_9cc06f84.observedCommit,level:"L0",nullForm:"bracketed dof-matched (0.05/0.15/0.25/0.35)",frames:F,spanS:+ts[F-1].toFixed(1),clipMatch,perClass:{}};
for(const cls of Object.keys(masks))out.perClass[cls]=tiersFor(masks[cls]);
writeFileSync(resolve(OUT_DIR, "PF8-PERCLASS2.json"),JSON.stringify(out,null,1));
for(const[c,t]of Object.entries(out.perClass))console.log(`${c.padEnd(9)} px=${String(t.px).padStart(6)} A.sig=${t.tierA.sig}/${t.tierA.floor}${t.tierA.red?' Ared':''}  B=${t.tierB.ratio}${t.tierB.red?'R':'-'}  C[${t.tierC.rungs.join(' ')}]${t.tierC.red?'RED':'green'}`);
console.log("frames",F,"span",out.spanS,"clipMatch",clipMatch);
