// Old (9fb1df6) vs new step choice for every pool and organization name in the job-pool fixtures and the probe variants.
import { readFileSync, readdirSync } from "node:fs";
const [DIR] = process.argv.slice(2);
const oldF = (l, st, fb) => st.find(([m]) => l.toUpperCase().length <= m)?.[1] ?? fb;
const newF = (l, st, fb) => { const s = l.toUpperCase(); const w = Math.max(...s.split(/\s+/).map(p => p.length)); return st.find(([m, mw]) => s.length <= m && w <= mw)?.[2] ?? fb; };
const P_OLD = [[36, "14px"], [54, "12px"]], C_OLD = [[34, "13px"], [38, "12px"]];
const P_NEW = [[36, 19, "14px"], [54, 22, "12px"]], C_NEW = [[34, 16, "13px"], [38, 18, "12px"]];
let n = 0, changed = 0, longest = 0;
for (const f of readdirSync(DIR).filter(f => f.endsWith(".json"))) {
  let j; try { j = JSON.parse(readFileSync(`${DIR}/${f}`, "utf8")); } catch { continue; }
  if (!j.pool) continue;
  const names = [["pool", j.pool.name], ...(j.organizations ?? []).map((o, i) => ["centre", `${String(i + 1).padStart(2, "0")} ${o.name}`])];
  for (const [kind, l] of names) { n++; longest = Math.max(longest, ...l.toUpperCase().split(/\s+/).map(p => p.length));
    const a = kind === "pool" ? oldF(l, P_OLD, "10.5px") : oldF(l, C_OLD, "11px"), b = kind === "pool" ? newF(l, P_NEW, "10.5px") : newF(l, C_NEW, "11px");
    if (a !== b) { changed++; console.log("CHANGED", f, kind, l, a, "→", b); } }
}
console.log(`${n} names, ${changed} changed, longest word ${longest}`);
