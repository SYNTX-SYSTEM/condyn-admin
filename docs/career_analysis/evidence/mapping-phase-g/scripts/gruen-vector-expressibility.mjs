/**
 * GRÜN · PHASE-G · §85 — CAN THE TWELVE LAYOUT VECTORS BE SERVED THROUGH THE RANKING CONTRACT AT ALL?
 * **NO VERDICT** (A-G36 point 2). Arithmetic over committed test data and committed contract tables.
 * No browser, no build, no server, no raster.
 *
 * §84's A-G206 span declaration said what would widen the fixture beyond one population: "a façade route
 * that serves `layoutInputs()[name]` as the job-ranking for a requested vector name… a transformation of
 * existing test data rather than new data, so B-7 permits it". **THAT WAS MINE AND IT WAS WRONG AS STATED**,
 * and it was wrong in a way no amount of care in writing the route would have fixed — I found out by writing
 * the route and being refused by the product's own decoder.
 *
 * WHY. A `LayoutRole` states `fit` as a FREE REAL and `weightSum` as a free number. A ranking payload does
 * not: `decodeRoleRanking` → `decodeRequirement` enforces
 *     weight === NECESSITY_WEIGHT[necessity]        with NECESSITY_WEIGHT = {REQUIRED:3, PREFERRED:2, OPTIONAL:1, UNKNOWN:1}
 *     value  === SEMANTIC_VALUE[state] | LEXICAL_VALUE[state]
 *                with SEMANTIC_VALUE ∈ {0, 0.5, 1} and LEXICAL_VALUE ∈ {0, 0.5}
 * and the view model then derives `weightSum = Σ weight` and `fit = Σ(weight·value) / Σ weight`. So neither
 * is settable: a role's fit is reachable only if `fit × weightSum` is a NON-NEGATIVE MULTIPLE OF 0.5 no
 * greater than weightSum, and a LEXICAL_ONLY role additionally cannot exceed fit 0.5, because no lexical
 * basis carries value 1.
 *
 * The twelve vectors are inputs to the LAYOUT MODULE. They were never meant to round-trip through the API
 * contract, and nothing in the record said they could not — both lanes assumed the transformation was
 * clerical. This file is the count.
 *
 * TWO REFUSALS BY THE DECODER, each of which taught a constraint, recorded because being refused is the
 * cheapest way this was ever going to be learned:
 *   1. `counts.pools` must equal `pools.length`, so patching `pools` alone desynchronises the payload.
 *   2. `rankingOf` validates with `decodeRoleRanking(body, ANALYSIS)`, so patching `analysisId` breaks its
 *      own check; the id has to be retargeted afterwards.
 * Neither of those was the real blocker. The real blocker is the two tables above.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { PROVENANCE } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "../../../../..");

/* the contract tables, READ from the product rather than retyped */
const rr = readFileSync(resolve(ROOT, "lib/career/job-pool/role-ranking.ts"), "utf8");
const tableOf = name => {
  const m = new RegExp(`const ${name}[^=]*= (\\{[^}]*\\})`).exec(rr);
  if (m === null) throw new Error(`${name} not found in role-ranking.ts — the derivation's subject moved`);
  return Object.fromEntries([...m[1].matchAll(/(\w+)\s*:\s*([\d.]+)/g)].map(x => [x[1], Number(x[2])]));
};
const NECESSITY_WEIGHT = tableOf("NECESSITY_WEIGHT");
const SEMANTIC_VALUE = tableOf("SEMANTIC_VALUE");
const LEXICAL_VALUE = tableOf("LEXICAL_VALUE");
const WEIGHTS = [...new Set(Object.values(NECESSITY_WEIGHT))].sort((a, b) => a - b);
const SEM_V = [...new Set(Object.values(SEMANTIC_VALUE))].sort((a, b) => a - b);
const LEX_V = [...new Set(Object.values(LEXICAL_VALUE))].sort((a, b) => a - b);

/* the vectors, via tsx because they are TypeScript test data */
const vectors = JSON.parse(execFileSync(resolve(ROOT, "node_modules/.bin/tsx"), ["-e", `
  import { layoutInputs } from ${JSON.stringify(resolve(ROOT, "test/support/mapping/vectors.ts"))};
  process.stdout.write(JSON.stringify(layoutInputs()));`], { encoding: "utf8", maxBuffer: 1 << 28 }));

const half = x => Math.abs(x * 2 - Math.round(x * 2)) < 1e-9;
const maxValueFor = tier => (tier === "SEMANTIC" ? Math.max(...SEM_V) : Math.max(...LEX_V));
const rows = Object.entries(vectors).map(([name, v]) => {
  const pools = [...new Set(v.roles.map(r => r.poolId))];
  const bad = [];
  for (const r of v.roles) {
    if (r.fit === null) { if (r.weightSum !== 0) bad.push({ roleId: r.roleId, why: `fit null with weightSum ${r.weightSum}: fit is null only for a role with NO requirements, which forces weightSum 0` }); continue; }
    const s = r.fit * r.weightSum, cap = maxValueFor(r.tier) * r.weightSum;
    if (!Number.isInteger(r.weightSum) || r.weightSum < 1) bad.push({ roleId: r.roleId, why: `weightSum ${r.weightSum} is not a positive integer, and every weight is one of ${WEIGHTS.join("/")}` });
    else if (!half(s)) bad.push({ roleId: r.roleId, why: `fit ${r.fit} x weightSum ${r.weightSum} = ${+s.toFixed(6)}, not a multiple of 0.5 — every value is one of ${(r.tier === "SEMANTIC" ? SEM_V : LEX_V).join("/")}` });
    else if (s > cap + 1e-9) bad.push({ roleId: r.roleId, why: `fit ${r.fit} exceeds the ${r.tier} ceiling ${maxValueFor(r.tier)} (no lexical basis carries value 1)` });
  }
  const unmappablePools = pools.length > 2 ? pools.slice(2) : [];
  return { name, roles: v.roles.length, pools: pools.length, poolIds: pools,
    inexpressibleRoles: bad.length, firstReasons: bad.slice(0, 2),
    poolBlocked: unmappablePools.length > 0,
    poolBlockReason: unmappablePools.length > 0 ? `uses ${pools.length} pools; the shared POOL_NAMES defines 2, and decodeRoleRanking refuses a rank whose role.poolName does not match its pool's entry` : null,
    servable: bad.length === 0 && unmappablePools.length === 0 };
});
const servable = rows.filter(r => r.servable), blocked = rows.filter(r => !r.servable);

const out = {
  reading: "GRÜN · §85 — whether layoutInputs() can be served as a ranking payload, counted against the contract's own tables",
  verdict: PROVENANCE.verdict,
  scope: "arithmetic over test/support/mapping/vectors.ts and the tables read from lib/career/job-pool/role-ranking.ts. No browser, no build, no server.",
  correctionToMyOwnSpanDeclaration: "§84's A-G206 declaration said a façade route serving layoutInputs() 'would widen' the fixture and that B-7 permits it. B-7 does permit it; the CONTRACT does not, for three of the twelve. The declaration was mine and is corrected here with a count rather than withdrawn wholesale — nine of twelve ARE servable, which is the useful half.",
  contractTables: { NECESSITY_WEIGHT, SEMANTIC_VALUE, LEXICAL_VALUE,
    consequence: `weight ∈ {${WEIGHTS.join(", ")}} and value ∈ {${SEM_V.join(", ")}} semantic / {${LEX_V.join(", ")}} lexical, so weightSum is a positive integer and fit × weightSum must be a non-negative multiple of 0.5 at most weightSum. A LEXICAL_ONLY role cannot exceed fit ${Math.max(...LEX_V)}.` },
  summary: { vectors: rows.length, servable: servable.length, blocked: blocked.length,
    totalRoles: rows.reduce((a, r) => a + r.roles, 0),
    inexpressibleRoles: rows.reduce((a, r) => a + r.inexpressibleRoles, 0) },
  servable: servable.map(r => r.name), blocked: blocked.map(r => ({ name: r.name, inexpressibleRoles: r.inexpressibleRoles, poolBlocked: r.poolBlocked, why: [r.poolBlockReason, ...r.firstReasons.map(x => `${x.roleId}: ${x.why}`)].filter(Boolean) })),
  perVector: rows,
  whatThisMeansForTheFixtureQueue: [
    `NINE of twelve vectors are servable exactly: ${servable.map(r => r.name.slice(0, 4)).join(", ")}. They include every crowded and shelf-pressed case, so the populations that bear on CROWDING, PG-5's budget, PG-14's frame and the shelf/field split are all reachable.`,
    "THREE are not, each for a stated reason: LV04 because 56 of its 60 fits are arbitrary reals from its own generator; LV02 and LV07 because they need a third pool AND carry inexpressible roles.",
    "What the route still needs, and it is NOT clerical: each servable role's (fit, weightSum) has to be COMPOSED from a multiset of (necessity, state) pairs — weightSum requirements of weight 1, of which floor(fit × weightSum) carry value 1 and one carries 0.5 when the product is a half-integer. Plus decodeRequirement's text rules: a SEMANTIC requirement needs capabilityName, explanation and evidenceLimitation as text and quotes unless its state is DIFFERENT or UNCLEAR; a LEXICAL one needs explanation and evidenceLimitation null and capabilityName null exactly when its state is NONE.",
    "So the route is a day's careful work rather than a transformation, and it must be verified by comparing rendered body geometry against layout-golden-vectors-v1.1.json's expected x / y / drawnRadius per rank — which is possible exactly, and is the only thing that would make a served vector worth calling by its name."
  ],
  finding: null
};
out.finding = `${servable.length} of ${rows.length} vectors are servable through the ranking contract; ${blocked.length} are not, and ${out.summary.inexpressibleRoles} of ${out.summary.totalRoles} roles across all twelve cannot be expressed at all. The blocker is not B-7 and not the façade: it is that the twelve are LAYOUT-MODULE inputs stating fit as a free real, while the ranking contract derives fit from weights {${WEIGHTS.join(",")}} and values {${SEM_V.join(",")}}. Both lanes had assumed the transformation was clerical; it is not, and I found out by writing it and being refused by the product's own decoder — which is the decoder doing its job.`;

writeFileSync(resolve(here, "../outputs/vector-expressibility.json"), JSON.stringify(out, null, 1));
console.log(`weights ${WEIGHTS.join("/")} · semantic values ${SEM_V.join("/")} · lexical values ${LEX_V.join("/")}\n`);
console.log("vector                                               roles pools  inexpressible  servable");
for (const r of out.perVector) console.log(`${r.name.padEnd(52)}${String(r.roles).padStart(5)}${String(r.pools).padStart(6)}${String(r.inexpressibleRoles).padStart(14)}   ${r.servable ? "YES" : "no"}`);
console.log(`\n${out.finding}`);
