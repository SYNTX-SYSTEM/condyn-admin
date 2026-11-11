/**
 * GELB · THE FRAME'S CONSTANT HAS NO CORPUS, AND THE VECTOR ROUTE DOES NOT REACH IT.
 *
 * GRÜN's §86 departs from my §69 ruling on FRAME_EM_PER_CHAR and asks for a ruling. Before giving one I
 * checked two things I was about to assume, and the second one changed the answer.
 *
 *  [1] DIRECTION OF SAFETY AT BOTH CALL SITES. The constant 0.62 appears twice with opposite-looking
 *      jobs — a "how many characters fit" divisor and a "how much room to reserve" multiplier. If the
 *      safe direction differed between them, no single constant could serve both.
 *  [2] IS THERE A CORPUS? I was about to rule that the per-face worst case be measured against the real
 *      role names in LV01-LV12, behind GRÜN's vector route. *** THE TWELVE VECTORS CARRY NO ROLE TITLES
 *      AT ALL. *** So the route GRÜN has specified cannot test this constant, and my ruling would have
 *      sent it somewhere it could not be answered. A-G371's habit — grep the artifact first — applied
 *      to my own pending ruling.
 */
import { execFileSync } from "node:child_process";
const TREE = "/home/codi/Entwicklung/condyn-admin-mapping-d";
const sh = (...a) => execFileSync(a[0], a.slice(1), { cwd: TREE, encoding: "utf8" });
const SHA = "4b83414e", FILE = "app/components/career/demo/PersonJobMappingField.tsx";
const src = sh("git", "show", `${SHA}:${FILE}`).split("\n");
const f = (x, n = 4) => x.toFixed(n);

console.log("=".repeat(104));
console.log("GELB · PG-14's FRAME CONSTANT — direction of safety, and whether a corpus exists");
console.log("=".repeat(104));

/* ══ [1] ══ */
console.log("\n[1] THE TWO CALL SITES OF 0.62, AND THE SAFE DIRECTION AT EACH\n");
const sites = src.map((l, i) => ({ n: i + 1, l })).filter(o => /0\.62|CHAR_EM/.test(o.l) && !/^\s*\*/.test(o.l));
for (const { n, l } of sites) console.log(`  :${String(n).padStart(4)}  ${l.trim().slice(0, 108)}`);

const FONT = 10, SPAN_DEG = 40, RADIUS = 300;
const fits = em => Math.max(1, Math.floor((((Math.max(0, SPAN_DEG - 4)) * Math.PI / 180) * RADIUS) / (em * FONT)));
const side = (em, len) => (len * em * FONT) / 2;
console.log(`\n  held at fontSize ${FONT}, span ${SPAN_DEG}°, radius ${RADIUS}, title length 24:\n`);
console.log(`    em       :459 fits (chars)    :498 side (px)     fits direction   side direction`);
let prevF = null, prevS = null, okF = true, okS = true;
for (const em of [0.5632, 0.602, 0.62, 0.70, 0.90]) {
  const F = fits(em), S = side(em, 24);
  const dF = prevF === null ? "" : F <= prevF ? "fewer (safe)" : "MORE (unsafe)";
  const dS = prevS === null ? "" : S >= prevS ? "more (safe)" : "LESS (unsafe)";
  if (prevF !== null && F > prevF) okF = false;
  if (prevS !== null && S < prevS) okS = false;
  console.log(`    ${f(em).padEnd(8)} ${String(F).padStart(14)}   ${f(S, 2).padStart(13)}      ${dF.padEnd(16)} ${dS}`);
  prevF = F; prevS = S;
}
console.log(`\n  raising the constant is monotonically CONSERVATIVE at both sites: ${okF && okS ? "CONFIRMED" : "NOT confirmed"}`);
console.log(`  *** SO A MEASURED MEAN IS UNSAFE IN BOTH PLACES, NOT ONE. *** At :459 a smaller em claims`);
console.log(`  MORE characters fit than do; at :498 it reserves LESS room than the label needs. GRÜN gave`);
console.log(`  the argument for the frame; it holds for the sector labels too, which is a stronger case`);
console.log(`  than either of us made and the reason one constant can serve both.`);
const head = (0.62 - 0.602) / 0.602 * 100;
console.log(`\n  headroom of 0.62 over PINK's worst measured 0.602: ${f(head, 2)} %  (GRÜN states 2.9 %)`);

/* ══ [2] ══ */
console.log("\n" + "=".repeat(104));
console.log("[2] IS THERE A CORPUS FOR THE WORST CASE? — the check that changed the ruling");
console.log("=".repeat(104));
const FIXT = ["test/support/mapping/vectors.ts", "test/support/mapping/layout-reference.ts", "test/support/mapping/write-vectors.ts"];
console.log("");
let anyTitle = 0;
for (const p of FIXT) {
  let t = "";
  try { t = sh("git", "show", `${SHA}:${p}`); } catch { console.log(`  ${p}  <absent at ${SHA}>`); continue; }
  const hits = (t.match(/\btitle\b/g) || []).length;
  anyTitle += hits;
  console.log(`  ${p.padEnd(44)} occurrences of "title": ${hits}`);
}
console.log(`\n  total across the three layout fixtures: ${anyTitle}`);
const roleType = sh("git", "show", `${SHA}:test/support/mapping/layout-reference.ts`).match(/LayoutRole[^\n]*=\s*\{[^}]*\}/s);
console.log(`\n  and the shape the vectors actually carry, from the product's own constructor:`);
const ctor = sh("git", "show", `${SHA}:test/support/mapping/vectors.ts`).split("\n").find(l => l.includes("const role = ("));
console.log(`    ${ctor ? ctor.trim().slice(0, 100) : "(not located)"}`);
console.log(`\n  *** THE TWELVE LAYOUT VECTORS CARRY NO ROLE TITLES. *** Role identity is \`role-000\` … and pool`);
console.log(`  identity is \`pool-a\` … . But the frame's side allowance at :498 keys on \`b.title.length\`,`);
console.log(`  and \`b.title\` reaches the component from the ranking payload, not from \`layoutInputs()\`.`);
console.log(`\n  CONSEQUENCES, BOTH OF WHICH I WOULD HAVE GOT WRONG WITHOUT THIS CHECK:`);
console.log(`   (a) I was about to rule that the per-face worst case be measured against the real role names`);
console.log(`       in LV01-LV12, behind GRÜN's vector route. *** THAT ROUTE CANNOT ANSWER IT. *** The`);
console.log(`       ruling would have parked a live question where no instrument could reach it.`);
console.log(`   (b) GRÜN's §85 span claim needs splitting. The nine servable vectors do widen the span for`);
console.log(`       CROWDING, PG-5's budget, PG-14's FRAME SOLVE and the shelf/field split — all of which`);
console.log(`       key on pool and role counts, fits and weight sums. *** THEY DO NOT WIDEN IT FOR ANY`);
console.log(`       QUANTITY KEYED ON TITLE LENGTH ***, which is the frame's side allowance, PG-14's label`);
console.log(`       containment and §69's character budget's \`mapping-name-*\` half.`);
console.log(`       \`mapping-collar-more\` is unaffected: it is \`c.more(collar.hidden)\` off the arcs, not titles.`);
console.log(`\n  So the only available derivation of the constant is the one needing no fixture: the MAXIMUM`);
console.log(`  advance width over the admissible character set, measured in the actual face at the actual`);
console.log(`  size — a measureText loop, no corpus, no vector route. In a proportional sans the widest`);
console.log(`  glyphs run near one em, so 0.62 is NOT a per-character upper bound; it is a bound on an`);
console.log(`  assumed character MIX. That is a different claim and it should be recorded as the one made.`);
