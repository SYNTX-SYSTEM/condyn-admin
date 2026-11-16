/** PINK · A-F21 floor-settling test. Capture the POOLED-MEAN-over-sign-pixels series for ~62s, then offline fit
 *  (joint LSQ, DC+6 freqs) over NESTED sub-windows to trace Tier-A floor vs window length, and test the 70%
 *  self-check — specifically whether the self-check ratio is confounded by the SUB-window's own resolution
 *  (A-F21 says window>=2/df=40s; the claim to test: the 70% sub-window must ALSO clear 2/df, i.e. full>=~57s). */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const sharp = await sharpModule();
const PINK_PROV_9cc06f84 = await provenance({ declaredCommit: "9cc06f84" });
const BASE="http://127.0.0.1:3120",AN="CAN_00000000000000000000000000000002";
const URL=`${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const LUT=new Float64Array(256);for(let i=0;i<256;i++){const c=i/255;LUT[i]=c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4);}
const SIG=[0.1,0.2,0.3],DEC=[0.15,0.25,0.35],FREQ=[...SIG,...DEC],DF=0.05;
function invert(Araw){const n=Araw.length;const A=Araw.map((r,i)=>[...r,...Array.from({length:n},(_,j)=>i===j?1:0)]);
  for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;[A[c],A[p]]=[A[p],A[c]];
    const d=A[c][c];for(let j=0;j<2*n;j++)A[c][j]/=d;for(let r=0;r<n;r++){if(r===c)continue;const f=A[r][c];for(let j=0;j<2*n;j++)A[r][j]-=f*A[c][j];}}return A.map(r=>r.slice(n));}
function fitFloorSig(tsub,ysub){const F=tsub.length,P=13;const A=tsub.map(t=>{const r=[1];for(const f of FREQ){const w=2*Math.PI*f*t;r.push(Math.cos(w),Math.sin(w));}return r;});
  const AtA=Array.from({length:P},(_,i)=>Array.from({length:P},(_,j)=>{let s=0;for(let r=0;r<F;r++)s+=A[r][i]*A[r][j];return s;}));
  const inv=invert(AtA);const beta=new Float64Array(P);for(let i=0;i<P;i++){let s=0;for(let r=0;r<F;r++){let ai=0;for(let j=0;j<P;j++)ai+=inv[i][j]*A[r][j];s+=ai*ysub[r];}beta[i]=s;}
  const amp=k=>Math.hypot(beta[1+2*k],beta[2+2*k]);return{sig:Math.hypot(amp(0),amp(1),amp(2)),floor:Math.hypot(amp(3),amp(4),amp(5))};}
const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:1920,height:1080},deviceScaleFactor:1,reducedMotion:"no-preference"});
const page=await ctx.newPage();
await page.goto(URL,{waitUntil:"networkidle",timeout:60000});await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});await page.waitForTimeout(1500);
while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});await page.keyboard.press("Escape").catch(()=>{});await page.waitForTimeout(400);}
const clip=await page.evaluate(()=>{const r=document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)};});
const N=clip.width*clip.height;const cdp=await page.context().newCDPSession(page);
const shot=async()=>{const{data}=await cdp.send("Page.captureScreenshot",{format:"png",clip:{x:clip.x,y:clip.y,width:clip.width,height:clip.height,scale:1}});return sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});};
const lumFull=s=>{const ch=s.info.channels,d=s.data,L=new Float32Array(N);for(let p=0,q=0;p<N;p++,q+=ch)L[p]=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];return L;};
const Lstage=lumFull(await shot());await page.addStyleTag({content:`[data-testid="mapping-field-svg"]{visibility:hidden !important}`});await page.waitForTimeout(350);
const Lhidden=lumFull(await shot());const idx=[];for(let i=0;i<N;i++)if(Lstage[i]-Lhidden[i]>0.001)idx.push(i);const M=idx.length;
await page.evaluate(()=>{for(const st of document.querySelectorAll('style'))if(st.textContent.includes('mapping-field-svg')&&st.textContent.includes('visibility:hidden'))st.remove();});await page.waitForTimeout(400);
const pooled=[],ts=[],t0=Date.now();
while(Date.now()-t0<62000){const s=await shot();const ch=s.info.channels,d=s.data;let sum=0;for(let k=0;k<M;k++){const q=idx[k]*ch;sum+=0.2126*LUT[d[q]]+0.7152*LUT[d[q+1]]+0.0722*LUT[d[q+2]];}pooled.push(sum/M);ts.push((Date.now()-t0)/1000);}
await ctx.close();await b.close();
const Tfull=ts[ts.length-1];
const windows=[20,26,33,40,47,54,Tfull];
const curve=windows.map(T=>{const ti=[],yi=[];for(let r=0;r<ts.length;r++)if(ts[r]<=T){ti.push(ts[r]);yi.push(pooled[r]);}const m=yi.reduce((a,b)=>a+b,0)/yi.length;const yd=yi.map(v=>v-m);const{sig,floor}=fitFloorSig(ti,yd);return{T:+T.toFixed(1),frames:ti.length,cells:+(DF*T).toFixed(2),sig:+sig.toExponential(3),floor:+floor.toExponential(3)};});
// 70% self-check at full window
const T70=0.7*Tfull;const t7=[],y7=[];for(let r=0;r<ts.length;r++)if(ts[r]<=T70){t7.push(ts[r]);y7.push(pooled[r]);}
const m7=y7.reduce((a,b)=>a+b,0)/y7.length;const f7=fitFloorSig(t7,y7.map(v=>v-m7));
const full=curve[curve.length-1];
console.log(JSON.stringify({commit: PINK_PROV_9cc06f84.observedCommit,signMaskPixels:M,frames:pooled.length,Tfull:+Tfull.toFixed(1),df:DF,minWindow_2overDf:40,
  floorVsWindow:curve,
  selfCheck70pct:{subWindowS:+T70.toFixed(1),subCells:+(DF*T70).toFixed(2),subFloor:+f7.floor.toExponential(3),fullFloor:full.floor,ratio:+(f7.floor/full.floor).toFixed(2),
    note:"A-F21 bound ~1.6. If sub-window cells<2 the ratio is inflated by the sub-window's OWN resolution, not a falling floor."}},null,1));
