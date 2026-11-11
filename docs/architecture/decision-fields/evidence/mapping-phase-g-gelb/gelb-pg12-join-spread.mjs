/**
 * GELB · THE QUANTISATION-ORDER SPREAD ON PG-12's FLOOR — and A-G139 decides it.
 *
 * GRÜN withdrew its 0.329 q_proj floor on the strength of A-G81 and named ONE open measurable: whether
 * the gradient stop alpha and the group opacity re-quantise at their join. §62's A-G258 ruled the floor
 * at 0.737 on the same rule. BOTH rest on A-G81 reaching a carrier it was never tested on, and the
 * build's stack is not two alphas but THREE multipliers and TWO kinds of quantiser:
 *
 *   gradient stop  fixed(VOLUME.haloAlpha * GAP_ALPHA_GAIN * share)   — fixed() is 1/1000, not 1/255
 *                                                                       and the gradient INTERPOLATES
 *                                                                       between stops, per pixel
 *   group opacity  fixed(opacity * depthGain(rank, lastRank))  :710   — opacity ∈ {1, 0.18}
 *   CSS opacity    var(--mf-wave-mean) = 1 - haloDepth/2      :313/:315 — 0.8825, animated ± 0.1175,
 *                                                                       and ± 0.1175 × 0.35 when a
 *                                                                       capability is selected
 *
 * A-G81 was MEASURED on a declared CONSTANT alpha (the shelf sweep, 0.0215/0.0216/0.022 — five
 * significant figures and the sweep threshold reproduced). Its only application to a GRADIENT is
 * A-G137, whose own words are "computed over black with A-G81's alpha quantisation" — a computation,
 * not a measurement. So the model is unvalidated on the carrier both lanes applied it to.
 *
 * This instrument reports BOTH branches at the build's own multipliers and leaves the choice open,
 * because A-G139 — "a bound must sit outside the quantisation-order spread of the quantity it bounds" —
 * already rules that a spread this wide forbids using either figure.
 */
const GAP=[245,166,35], MED=[6,12,17];
const fixed=v=>Math.round(v*1000)/1000;            // the product's own fixed(), 1/1000 — a THIRD quantiser
const qa=a=>Math.round(a*255)/255;
const over=(a)=>GAP.map((c,i)=>Math.round(c*a+MED[i]*(1-a)));
const lin=c=>{const s=c/255;return s<=0.04045?s/12.92:Math.pow((s+0.055)/1.055,2.4);};
const Wn=[0.95047,1,1.08883], fL=t=>t>216/24389?Math.cbrt(t):(24389/27*t+16)/116;
const XYZ=([r,g,b])=>{const R=lin(r),G=lin(g),B=lin(b);return[0.4124564*R+0.3575761*G+0.1804375*B,0.2126729*R+0.7151522*G+0.0721750*B,0.0193339*R+0.1191920*G+0.9503041*B];};
const LAB=t=>{const[X,Y,Z]=XYZ(t),fx=fL(X/Wn[0]),fy=fL(Y/Wn[1]),fz=fL(Z/Wn[2]);return[116*fy-16,500*(fx-fy),200*(fy-fz)];};
const TH=Math.atan2(LAB(GAP)[2],LAB(GAP)[1]);
const proj=t=>{const[,a,b]=LAB(t);return a*Math.cos(TH)+b*Math.sin(TH);};
const base=proj(MED);
const QP=0.4797;

// the build's actual multipliers on a gap halo pixel
const DEPTH=[1,0.911293,0.830455,0.756788,0.689655];
const POOL=[1,0.18];
const CSS=[0.8825,0.8825-0.1175,1.0,0.8825-0.1175*0.35,0.8825+0.1175*0.35]; // rest, trough, peak, selected-gain ends
const groups=[];
for(const p of POOL) for(const d of DEPTH) groups.push({label:`pool ${p} x depth ${d}`,g:fixed(p*d)});

console.log("GROUP OPACITIES the build can emit (product's fixed() = 1/1000):");
console.log("  "+[...new Set(groups.map(x=>x.g))].sort((a,b)=>b-a).join("  "));
console.log("CSS wave opacities:", CSS.map(c=>c.toFixed(6)).join("  "));

// BRANCH A: every stage quantised to 8 bits (A-G81 applied at each join)
// BRANCH B: exact product in float, ONE 8-bit composite at the end (A-G139's other branch)
let hitA=false,hitB=false,firstA=null,firstB=null;
const rows=[];
for(const {g} of groups) for(const css of CSS){
  // sweep the gradient's own alpha finely: between stops it is interpolated, so treat as continuous
  for(let s=0;s<=1;s+=0.00002){
    const stop=0.54*s;
    const aA=qa(qa(fixed(stop))*qa(g))*1; const cA=over(qa(qa(fixed(stop))*qa(g)*qa(css)));
    const aB=fixed(stop)*g*css;           const cB=over(aB);
    if(cA.join()==="7,12,17") hitA=true;
    if(cB.join()==="7,12,17"){ if(!hitB) rows.push({g,css,aB,c:cB}); hitB=true; }
    if(!firstA&&cA.some((v,i)=>v!==MED[i])) firstA={c:cA,step:(proj(cA)-base)/QP};
    if(!firstB&&cB.some((v,i)=>v!==MED[i])) firstB={c:cB,step:(proj(cB)-base)/QP};
  }
}
console.log("\nBRANCH A — 8-bit at every join (the model A-G258 ruled on):");
console.log(`  reaches rgb(7,12,17): ${hitA?"YES":"no"}   first visible: rgb(${firstA.c})  step ${firstA.step.toFixed(3)} q_proj`);
console.log("BRANCH B — exact product in float, one 8-bit composite (A-G139's other branch):");
console.log(`  reaches rgb(7,12,17): ${hitB?"YES":"no"}   first visible: rgb(${firstB.c})  step ${firstB.step.toFixed(3)} q_proj`);
if(rows.length) console.log(`  e.g. group ${rows[0].g} x css ${rows[0].css.toFixed(4)} -> effective alpha ${rows[0].aB.toFixed(7)} -> rgb(${rows[0].c})`);
console.log(`\nSPREAD between the two branches' floors: ${(100*(firstA.step-firstB.step)/firstB.step).toFixed(0)} %`);
console.log("A-G139: \"A bound must sit outside the quantisation-order spread of the quantity it bounds.\"");

// GRUEN's specific pair, checked at the build's constants
const k1=1/255,k2=137/255;
console.log(`\nGRUEN's cited pair k1=1,k2=137: effective ${(k1*k2).toFixed(7)} -> rgb(${over(k1*k2)})  step ${((proj(over(k1*k2))-base)/QP).toFixed(3)} q_proj`);
console.log(`  but 137/255 = ${(137/255).toFixed(6)}, and the build's group x css values are`);
console.log("  " + [...new Set(groups.flatMap(({g})=>CSS.map(c=>+(g*c).toFixed(6))))].sort((a,b)=>a-b).join(" "));
console.log("  -> 0.537255 is NOT among them; the nearest reachable products bracket it or lie outside.");
