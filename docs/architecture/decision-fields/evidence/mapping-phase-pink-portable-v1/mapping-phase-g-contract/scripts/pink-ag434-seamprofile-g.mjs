/** PINK · PHASE G · §42 — the seam's SPATIAL PROFILE, with the DISTRIBUTION over angles reported
 *  instead of a median. GELB (§101) re-read §35's profile and found the flatness I claimed is not there:
 *      offset   1      2      3      5      8
 *      quanta   2.509  3.022  3.233  2.524  2.524
 *  A step predicts flat, a ramp predicts monotone growth, and neither predicts a hump. It is right, and
 *  the shape is in the ORIGINAL 0.02 figures too (3.501 / 4.014 / 4.225 / 3.516 / 3.516), so it is my
 *  reading and not the build conversion.
 *
 *  AND I SUSPECT THE CAUSE IS WORSE THAN A HUMP: §35 took a MEDIAN OVER ANGLES, and the region inside
 *  shelfNear is covered by the sector wedges at `:878`, emitted for `i % 2 === 1` — every OTHER sector.
 *  So the inside population is plausibly BIMODAL, wedge against no-wedge, in roughly equal parts — and a
 *  median over a ~50/50 bimodal population is not a location statistic at all: it flips between the two
 *  modes on tiny changes in the proportion. That would produce exactly the non-monotone jumping observed,
 *  and the identical values at offsets 5 and 8 (0.00107582 to every digit) are the signature of a lattice,
 *  not of a profile. A-F11 again, in the angular direction this time.
 *
 *  So this instrument reports, per offset: every distinct triple present with its share, the modal triple,
 *  and the full quantile spread — never a bare median. Static capture under `reduce` (the spatial question
 *  does not need the breath, and freezing it removes one varying term), with the shelf side read at the
 *  same offsets on the far side of the boundary.
 */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d" });
const chromium = await playwright();
const sharp = await sharpModule();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const ANGLES = 720, OFFS = [1,2,3,4,5,6,8,10,12];
const W = [0.2126,0.7152,0.0722];
const dec = v => { const c=v/255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055,2.4); };
const L = t => W[0]*dec(t[0])+W[1]*dec(t[1])+W[2]*dec(t[2]);
const q1 = t => { let q=0; for(let k=0;k<3;k++){ const v=t[k]; q += W[k]*Math.abs(dec(Math.min(255,v+1))-dec(v)); } return 0.5*q; };
const pct = (a,p) => { const s=Float64Array.from(a).sort(); return s[Math.min(s.length-1,Math.max(0,Math.round(p*(s.length-1))))]; };

async function run(VW,VH){
  const b = await chromium.launch();
  const ctx = await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:1,reducedMotion:"reduce"});
  const page = await ctx.newPage();
  await page.goto(URL,{waitUntil:"networkidle",timeout:60000});
  await page.waitForSelector('[data-testid="mapping-field"]',{timeout:30000});
  await page.waitForTimeout(1600);
  while(await page.locator('[data-testid="guided-onboarding-overlay"]').count()>0){
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});
    await page.keyboard.press("Escape").catch(()=>{}); await page.waitForTimeout(400);}
  const g = await page.evaluate(()=>{
    const svg=document.querySelector('[data-testid="mapping-field-svg"]'); const sr=svg.getBoundingClientRect();
    const fe=document.querySelector('[data-testid="mapping-ring-field"]'); const fr=fe.getBoundingClientRect();
    const se=document.querySelector('[data-testid="mapping-ring-shelf"]');
    return {clip:{x:Math.round(sr.x),y:Math.round(sr.y),width:Math.round(sr.width),height:Math.round(sr.height)},
      cx:fr.x+fr.width/2, cy:fr.y+fr.height/2, clientFieldR:fr.width/2,
      rUserField:parseFloat(fe.getAttribute("r")), rUserShelf:parseFloat(se.getAttribute("r")),
      swUserShelf:parseFloat(se.getAttribute("stroke-width")),
      wedges:document.querySelectorAll('[data-testid="mapping-field-svg"] path').length};});
  const cdp = await page.context().newCDPSession(page);
  const {data} = await cdp.send("Page.captureScreenshot",{format:"png",clip:{...g.clip,scale:1},optimizeForSpeed:true});
  const s = await sharp(Buffer.from(data,"base64")).raw().toBuffer({resolveWithObject:true});
  const ch=s.info.channels,d=s.data,Wd=g.clip.width,Hd=g.clip.height;
  await ctx.close(); await b.close();
  const scale=g.clientFieldR/g.rUserField, Rb=(g.rUserShelf-g.swUserShelf/2)*scale;
  const cx=g.cx-g.clip.x, cy=g.cy-g.clip.y;
  const at=(x,y)=>{const p=(y*Wd+x)*ch;return [d[p],d[p+1],d[p+2]];};
  const side = (sign) => OFFS.map(o=>{
    const hist=new Map(); const Ls=[];
    for(let a=0;a<ANGLES;a++){
      const th=2*Math.PI*a/ANGLES;
      const x=Math.round(cx+(Rb+sign*o)*Math.cos(th)), y=Math.round(cy+(Rb+sign*o)*Math.sin(th));
      if(x<0||y<0||x>=Wd||y>=Hd) continue;
      const t=at(x,y); const k=t.join(",");
      hist.set(k,(hist.get(k)||0)+1); Ls.push(L(t));
    }
    const top=[...hist.entries()].sort((a,b)=>b[1]-a[1]);
    const n=Ls.length;
    return { offsetPx:o, samples:n, distinctTriples:top.length,
      modal:top[0][0], modalShare:+(top[0][1]/n).toFixed(4),
      second: top[1]?top[1][0]:null, secondShare: top[1]?+(top[1][1]/n).toFixed(4):null,
      third: top[2]?top[2][0]:null, thirdShare: top[2]?+(top[2][1]/n).toFixed(4):null,
      L_modal:+L(top[0][0].split(",").map(Number)).toExponential(6),
      L_p05:+pct(Ls,0.05).toExponential(6), L_p25:+pct(Ls,0.25).toExponential(6),
      L_med:+pct(Ls,0.50).toExponential(6), L_p75:+pct(Ls,0.75).toExponential(6),
      L_p95:+pct(Ls,0.95).toExponential(6) };
  });
  const inside=side(-1), outside=side(+1);
  const qq=q1([4,5,5])+q1([5,6,6]);
  const profile=OFFS.map((o,i)=>{
    const si=inside[i], so=outside[i];
    const stepModal=si.L_modal-so.L_modal, stepMed=si.L_med-so.L_med;
    return { offsetPx:o,
      inside_modal:si.modal, inside_modalShare:si.modalShare, inside_distinct:si.distinctTriples,
      outside_modal:so.modal, outside_modalShare:so.modalShare, outside_distinct:so.distinctTriples,
      step_MODAL:+stepModal.toExponential(6), step_modal_quanta:+(stepModal/qq).toFixed(3),
      step_MEDIAN:+stepMed.toExponential(6), step_median_quanta:+(stepMed/qq).toFixed(3),
      inside_spread_p05_p95:[si.L_p05,si.L_p95], insideBimodal: si.modalShare<0.75 };
  });
  return { viewport:`${VW}x${VH}`, motion:"reduce (static)", anglesSampled:ANGLES,
    boundaryClientR:+Rb.toFixed(3), pairQuantum:+qq.toExponential(4),
    wedgePathsInSvg:g.wedges, inside, outside, profile };
}
const out={commit: PINK_PROV_3ec8457d.observedCommit,stand:BASE,pin:"A-G434 / seam spatial profile (PINK §42)",
  note:"distribution over angles reported per offset; a bare median over a bimodal population is not a location statistic",
  runs:[]};
for(const [w,h] of [[1920,1080],[1280,800]]) out.runs.push(await run(w,h));
console.log(JSON.stringify(out,null,1));
