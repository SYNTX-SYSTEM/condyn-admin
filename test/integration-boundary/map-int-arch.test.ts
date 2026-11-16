import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * MAP-INT-ARCH · the INTEGRATION boundary (GELB, A-G487, 2026-11-16).
 *
 * WHY THIS EXISTS. A-G485 closed phase G at PHASE_INT_BASE so that an integration merge could sit outside
 * phase G's range instead of being forbidden by it. *** CLOSING A PHASE ENDS ITS GUARD. *** D, E and F each
 * got a successor phase with its own boundary; phase G's successor is the integration itself, and until this
 * file there was no boundary over it at all — every commit after PHASE_INT_BASE was measured by nothing.
 *
 * WHAT IT GUARDS, and it is deliberately narrow: a merge must be a UNION and nothing else. The risk an
 * integration carries is not a conflict — a conflict fails loudly — it is PRODUCT CONTENT INVENTED IN THE
 * MERGE, which no parent ever reviewed and which reads as "just the merge". That content would belong to no
 * lane, appear in no lane's range, and be reviewed by nobody.
 *
 * WHERE IT LIVES, and this is not arbitrary. It is NOT under test/career/mapping-field/ or
 * test/career/mapping-spec/, because PF-13's population is DERIVED from those two directories
 * (architecture.test.ts -> PHASE_DIRS). A file added there silently moves PF-13's population and test count,
 * which is exactly the coupling this record keeps finding. A boundary that corrupts another pin's denominator
 * to install itself is not worth having.
 *
 * THE VACUITY CLAUSE IS NOT OPTIONAL. If the two parents differed in no product file, the union assertion
 * would pass over nothing and read green. So the count of differing product paths is asserted positive first.
 */

const ROOT = join(__dirname, "../..");
const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] })
    .split("\n").filter(Boolean);

/** The declared integration merge and its two declared parents. Pinned: a boundary names what it guards. */
const INTEGRATION_MERGE = "4f4534c51609d64259add15ba334c8fe1edf9584";
const PARENT_GELB = "eb75fd0207de704c37a419171c37d98a7f3e9a1e";
const PARENT_GRUEN = "a0475f13958128a71e7615a825f65a4dd33e8749";

/** Product surface. Docs, evidence and records are deliberately NOT guarded here: lanes write those by design. */
const PRODUCT = ["lib", "app", "scripts"];

/**
 * Commits after the integration merge that MAY touch the product surface, each with its authority.
 * The MAP-C-ARCH pattern (AUTHORISED_CROSSINGS): every crossing is attributable AND the list is consumed in
 * full, so a stale entry is a failure rather than a permanent exemption.
 */
const AUTHORISED_CROSSINGS: Array<{ commit: string; reason: string }> = [];

const resolve = (rev: string) => {
  const out = git("rev-parse", "--verify", "--quiet", `${rev}^{commit}`);
  if (out.length === 0) throw new Error(`ERR_MAP_INT_ARCH_MISSING: this clone does not hold ${rev}`);
  return out[0];
};
const blob = (rev: string, path: string) => {
  try { return git("rev-parse", `${rev}:${path}`)[0]; } catch { return undefined; }
};
const productPathsDifferingBetweenParents = () =>
  git("diff", "--name-only", "--no-renames", PARENT_GELB, PARENT_GRUEN, "--", ...PRODUCT).sort();

describe("MAP-INT-ARCH · the integration merge is a union and invents nothing", () => {
  it("the declared merge exists, has exactly two parents, and they are the two declared lane tips", () => {
    const merge = resolve(INTEGRATION_MERGE);
    const parents = git("rev-list", "--parents", "-n", "1", merge)[0].split(" ").slice(1);
    expect(parents, "an integration merge has exactly two parents").toHaveLength(2);
    expect(parents.sort()).toEqual([resolve(PARENT_GELB), resolve(PARENT_GRUEN)].sort());
  });

  it("every product file in the merge is byte-identical to one of its two parents — no content is invented in the merge", () => {
    const differing = productPathsDifferingBetweenParents();
    // A-F18 / A-G485's vacuity clause: if the parents differed nowhere, the loop below would assert nothing.
    expect(differing.length, "the two parents differ in NO product file, so this assertion would pass over nothing").toBeGreaterThan(0);

    const invented: string[] = [];
    for (const path of differing) {
      const inMerge = blob(INTEGRATION_MERGE, path);
      if (inMerge === undefined) continue; // deleted in the merge: covered by the next assertion
      if (inMerge !== blob(PARENT_GELB, path) && inMerge !== blob(PARENT_GRUEN, path)) invented.push(path);
    }
    expect(invented, "product content in the merge that matches NEITHER parent").toEqual([]);
  });

  it("the merge adds no product file that exists in neither parent, and deletes none that both parents kept", () => {
    const inMerge = git("ls-tree", "-r", "--name-only", INTEGRATION_MERGE, "--", ...PRODUCT);
    const inGelb = new Set(git("ls-tree", "-r", "--name-only", PARENT_GELB, "--", ...PRODUCT));
    const inGruen = new Set(git("ls-tree", "-r", "--name-only", PARENT_GRUEN, "--", ...PRODUCT));
    expect(inMerge.length, "the merge holds no product files at all, so this assertion is vacuous").toBeGreaterThan(0);
    expect(inMerge.filter(p => !inGelb.has(p) && !inGruen.has(p)), "product files the merge invented").toEqual([]);

    const mergeSet = new Set(inMerge);
    const keptByBoth = [...inGelb].filter(p => inGruen.has(p));
    expect(keptByBoth.filter(p => !mergeSet.has(p)), "product files both parents kept and the merge dropped").toEqual([]);
  });

  it("no commit after the integration merge touches the product surface except by a consumed authority", () => {
    const head = git("rev-parse", "HEAD")[0];
    const after = git("log", "--format=%H", `${resolve(INTEGRATION_MERGE)}..${head}`);
    const authorised = new Map(AUTHORISED_CROSSINGS.map(c => [c.commit, c.reason]));
    const unauthorised: string[] = [];
    const used = new Set<string>();
    for (const commit of after) {
      const touched = git("show", "--name-only", "--format=", "--no-renames", commit, "--", ...PRODUCT);
      if (touched.length === 0) continue;
      const full = [...authorised.keys()].find(k => commit.startsWith(k) || k.startsWith(commit));
      if (full === undefined) unauthorised.push(`${commit.slice(0, 8)} -> ${touched.join(", ")}`);
      else used.add(full);
    }
    expect(unauthorised, "product changes after the integration merge with no named authority").toEqual([]);
    // The list is consumed in full: a stale entry is a failure, not a standing exemption.
    expect([...authorised.keys()].filter(k => !used.has(k)), "AUTHORISED_CROSSINGS entries that matched no commit").toEqual([]);
  });
});
