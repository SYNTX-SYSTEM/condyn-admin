/** PINK · PF-8 three-tier firewall lock-in (§17+§19), independent build, run at base 9cc06f84 to confirm/break
 *  GELB's §19 numbers. Sign mask = pixels the field's drawn structure owns (stage minus svg-hidden > 0.001) —
 *  at base there is no lit ground, so this is marks+arcs+ticks+beams+nodes+text+4 rings (shelf band dominates).
 *  Lock-in: demean each pixel's series, project at signal harmonics {T,T/2,T/3}=0.1/0.2/0.3Hz and decoys
 *  {T/2.7,T/4.3,T/5.9}=0.270/0.233/0.169Hz; coherent amplitude = RSS over the three. UNBLURRED (PF-8 is an edge
 *  statistic). Tier A pooled-mean amp<=0.0005; Tier B p99 coherent <=2x p99 decoy; Tier C population ladder <=1.5x. */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const sharp = await sharpModule();
const PINK_PROV_9cc06f84 = await provenance({ declaredCommit: "9cc06f84" });
const BASE=process.env.PINK_BASE ?? "http://127.0.0.1:3120", AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const LUT=new Float64Array(256); for(let i=0;i<256;i++){const c=i/255;LUT[i]=c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const SIG=[0.1,0.2,0.3], DEC=[1/3.7,1/4.3,1/5.9];
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:"no-preference"});
const page=await ctx.newPage();
await page.goto(URL,{waitUntil:"networkidle",timeout:60000});
await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});
await page.waitForTimeout(1500);
while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}
if(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){console.log(JSON.stringify({ABORT:"overlay present"}));process.exit(2);}
const clip=await page.evaluate(()=>{const r=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
const N=clip.width*clip.height;
const lumFull=(raw,ch)=>{const L=new Float32Array(N);for(let p=0,q=0;p<N;p++,q+=ch)L[p]=0.2126*LUT[raw[q]]+0.7152*LUT[raw[q+1]]+0.0722*LUT[raw[q+2]];return L;};
// --- sign mask: stage vs svg-hidden ---
const s1=await sharp(await page.screenshot({clip})).raw().toBuffer({resolveWithObject:true}); const Lstage=lumFull(s1.data,s1.info.channels);
await page.addStyleTag({content:`[data-testid="mapping-field-svg"]{visibility:hidden !important}`});
await page.waitForTimeout(350);
const s0=await sharp(await page.screenshot({clip})).raw().toBuffer({resolveWithObject:true}); const Lhidden=lumFull(s0.data,s0.info.channels);
const idx=[]; for(let i=0;i<N;i++) if(Lstage[i]-Lhidden[i]>0.001) idx.push(i);
const M=idx.length;
// restore (remove the style tag by navigating is heavy; instead toggle visibility back)
await page.evaluate(()=>{for(const st of document.querySelectorAll('style')){if(st.textContent.includes('mapping-field-svg')&&st.textContent.includes('visibility:hidden')) st.remove();}});
await page.waitForTimeout(400);
// --- temporal capture over ~10.5s (signs visible), store ONLY sign-pixel luminances + timestamps ---
const frames=[]; const ts=[]; const t0=Date.now();
while(Date.now()-t0<10500){ const tS=Date.now();
  const s=await sharp(await page.screenshot({clip})).raw().toBuffer({resolveWithObject:true}); const ch=s.info.channels,d=s.data;
  const row=new Float32Array(M); for(let k=0;k<M;k++){const q=idx[k]*ch;row[k]=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];}
  frames.push(row); ts.push((Date.now()-t0)/1000);
  const sp=Date.now()-tS; if(sp<120) await page.waitForTimeout(120-sp); }
await ctx.close(); await b.close();
const F=frames.length;
// --- lock-in ---
// precompute cos/sin tables per freq per frame
const mk=freqs=>freqs.map(f=>({c:ts.map(t=>Math.cos(2*Math.PI*f*t)),s:ts.map(t=>Math.sin(2*Math.PI*f*t))}));
const CS=mk(SIG), CD=mk(DEC);
// per-pixel mean (demean)
const amp=(series,tab)=>{let re=0,im=0;for(let j=0;j<F;j++){re+=series[j]*tab.c[j];im+=series[j]*tab.s[j];}return 2/F*Math.hypot(re,im);};
const coh=new Float32Array(M), cohNull=new Float32Array(M);
const pooled=new Float64Array(F); // mean over sign px per frame
const ser=new Float64Array(F);
for(let k=0;k<M;k++){ let mean=0; for(let j=0;j<F;j++) mean+=frames[j][k]; mean/=F;
  for(let j=0;j<F;j++){ser[j]=frames[j][k]-mean; pooled[j]+=frames[j][k];}
  let a2=0; for(const tab of CS){const a=amp(ser,tab);a2+=a*a;} coh[k]=Math.sqrt(a2);
  let n2=0; for(const tab of CD){const a=amp(ser,tab);n2+=a*a;} cohNull[k]=Math.sqrt(n2); }
for(let j=0;j<F;j++) pooled[j]/=M;
let pm=0; for(let j=0;j<F;j++) pm+=pooled[j]; pm/=F; const pser=pooled.map(v=>v-pm);
let A2=0; for(const tab of CS){const a=amp(pser,tab);A2+=a*a;} const tierA=Math.sqrt(A2);
let AN2=0; for(const tab of CD){const a=amp(pser,tab);AN2+=a*a;} const tierAfloor=Math.sqrt(AN2);
// Tier B p99
const sortCopy=a=>{const c=Float64Array.from(a);c.sort();return c;}; const P=(c,f)=>c[Math.min(c.length-1,Math.floor(f*(c.length-1)))];
const cs=sortCopy(coh), cns=sortCopy(cohNull); const p99=P(cs,.99), p99n=P(cns,.99);
// Tier C populations
const THR=[0.001,0.002,0.004,0.008];
const cntS=THR.map(t=>{let n=0;for(let k=0;k<M;k++)if(coh[k]>t)n++;return n;});
const cntN=THR.map(t=>{let n=0;for(let k=0;k<M;k++)if(cohNull[k]>t)n++;return n;});
const ratios=THR.map((_,i)=>cntN[i]===0?(cntS[i]===0?1:Infinity):+(cntS[i]/cntN[i]).toFixed(2));
console.log(JSON.stringify({commit: PINK_PROV_9cc06f84.observedCommit,signMaskPixels:M,frames:F,spanS:+ts[F-1].toFixed(2),cadenceMs:+(ts[F-1]/(F-1)*1000).toFixed(0),
  tierA:{sigAmp:+tierA.toExponential(3),bound:0.0005,floor:+tierAfloor.toExponential(3),verdict:tierA<=0.0005&&tierAfloor<0.0005/2?"GREEN":(tierA>0.0005?"RED":"check")},
  tierB:{p99sig:+p99.toExponential(3),p99null:+p99n.toExponential(3),ratio:+(p99/p99n).toFixed(2),bound:"<=2x floor",verdict:p99>2*p99n?"RED":"green/incon"},
  tierC:{thresholds:THR,signal:cntS,null:cntN,ratios,verdict:ratios.some(r=>r>1.5)?"RED":"green"}},null,1));
