/**
 * GRÜN · PHASE-G · A-G156 point 4 — PG-5's L1 cap of 12 recomputed at PG-16 = 0.5.  **NO VERDICT** (A-G36 p2).
 *
 * A-G156 point 4 recorded the L1 cap as untested at 0.5 because this lane's A-G147 computation was L0 only,
 * and said it is "not to be read as surviving". This is the same arithmetic on the same committed vectors, one
 * function call away, applied PER POOL as the component applies it at L1 (spaced(byRank.filter(inPool), 12)).
 *
 * Taken under this lane's A-G142 positive limb — it bears on a product constant, BODY_BUDGET.L1 — and the
 * decision on that constant is GELB's, not this lane's. A recorded gap that one call closes is worse than
 * closed.
 */
import { readFileSync, writeFileSync } from "node:fs";
/**
 * §130 — THIS INSTRUMENT'S TWO ABSOLUTE PATHS, AND WHY THE WRITE SIDE WAS THE SERIOUS HALF.
 *
 * Both the input and the output were hardcoded to one named worktree with no env override. On the machine
 * that wrote them the paths RESOLVE, so the instrument exits 0 from any checkout while reading one tree and
 * *** WRITING pg16-crowding-L1.json INTO THAT NAMED WORKTREE REGARDLESS OF WHERE IT WAS LAUNCHED *** — which
 * it did at 2026-11-16 04:20. A second checkout would have reported success and deposited the reading where
 * its own launcher cannot see it. Roots are now derived, and `outPath` refuses a write that leaves this tree.
 *
 * The input is an OWN-LANE read, checked rather than assumed: layout-golden-vectors-v1.1.json is present at
 * this lane's own ref and is named in MAP-G-ARCH's G_ENTRY, so a derived root is the correct resolution and
 * no peer-lane ref is involved (gruen-paths.mjs rule 2).
 */
import { GOLDEN_VECTORS_V11, outPath, launchProvenance } from "./gruen-paths.mjs";
const V = JSON.parse(readFileSync(GOLDEN_VECTORS_V11, "utf8"));
const spaced=(byRank,budget,c)=>{const out=[];for(const b of byRank){if(out.length>=budget)break;
  const clear=out.every(o=>Math.hypot(o.x-b.x,o.y-b.y)-o.drawnRadius-b.drawnRadius>=c*Math.max(Math.hypot(o.x,o.y),Math.hypot(b.x,b.y)));
  if(clear)out.push(b);}return out;};
const B1=12, rows=[];
for (const [name,v] of Object.entries(V.layouts)) {
  const bodies=v.expected.bodies.filter(b=>!b.overflow);
  const pools=[...new Set(bodies.map(b=>b.poolId))];
  for (const pool of pools) {
    const byRank=bodies.filter(b=>b.poolId===pool).sort((a,b)=>a.rank-b.rank);
    if (byRank.length<B1) continue;                       // only pools that can exercise the cap
    const a3=spaced(byRank,B1,0.3).length, a5=spaced(byRank,B1,0.5).length;
    const u3=spaced(byRank,Infinity,0.3).length, u5=spaced(byRank,Infinity,0.5).length;
    rows.push({layout:name,pool:pool.slice(-8),poolBodies:byRank.length,L1_at_0_3:a3,L1_at_0_5:a5,
      bind03:u3>=B1?"BUDGET":"SPACING",bind05:u5>=B1?"BUDGET":"SPACING",cap03:u3,cap05:u5});
  }
}
const ex=rows.length, shrink=rows.filter(r=>r.L1_at_0_5<B1).length, bind05=rows.filter(r=>r.bind05==="BUDGET").length;
console.log("layout / pool                                      bodies  L1@0.3  L1@0.5  bind@0.3  bind@0.5  cap 0.3/0.5");
for (const r of rows) console.log(`${(r.layout+" / "+r.pool).padEnd(50)}${String(r.poolBodies).padStart(5)}${String(r.L1_at_0_3).padStart(8)}${String(r.L1_at_0_5).padStart(8)}${r.bind03.padStart(10)}${r.bind05.padStart(10)}${String(r.cap03).padStart(11)} / ${r.cap05}`);
console.log(`\npools with >= ${B1} bodies: ${ex} | drawing fewer than ${B1} at 0.5: ${shrink} | budget still binds at 0.5: ${bind05}`);
writeFileSync(outPath("pg16-crowding-L1.json"),
  JSON.stringify({reading:"GRÜN · A-G156 point 4 — PG-5's L1 cap of 12 recomputed at PG-16 = 0.5",verdict:"NONE — development reading only (A-G36 point 2)",
   scope:"arithmetic on committed golden vectors and the spaced() rule, per pool as the component applies it at L1. No render, no gate.",
   budget_L1:B1,perPool:rows,summary:{poolsExercisingTheCap:ex,drawingFewerAt0_5:shrink,budgetStillBindsAt0_5:bind05},
   note:"A-G156 point 4 recorded the L1 cap as untested at 0.5. This is that computation; the decision on BODY_BUDGET.L1 is GELB's.",
   provenance:{...launchProvenance(),input:GOLDEN_VECTORS_V11,inputResolution:"DERIVED from this module's own location (§130); own-lane read, in MAP-G-ARCH G_ENTRY"}},null,1));
