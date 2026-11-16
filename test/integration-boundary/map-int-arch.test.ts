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
 * F-R1 (2026-11-16): the post-merge walk was blind to merge commits and this branch already contained one.
 * Repaired with `--diff-merges=first-parent` plus a limb that pins git's behaviour in both directions and
 * checks the per-commit walk for COMPLETENESS against the two-point diff. See that limb's own docstring.
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
/** Added lines (no context) for a range, or for the working tree when `range` is undefined. */
const gitAdded = (range: string | undefined, path: string) =>
  git("diff", "-U0", ...(range ? [range] : ["HEAD"]), "--", path)
    .filter(l => l.startsWith("+") && !l.startsWith("+++ ")).map(l => l.slice(1));

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
      // F-R1: `--diff-merges=first-parent` is NOT optional. Without it `git show` prints NO diff for a merge
      // commit, so the `length === 0` short-circuit below silently skips every merge, product paths included.
      const touched = git("show", "--name-only", "--format=", "--no-renames", "--diff-merges=first-parent", commit, "--", ...PRODUCT);
      if (touched.length === 0) continue;
      const full = [...authorised.keys()].find(k => commit.startsWith(k) || k.startsWith(commit));
      if (full === undefined) unauthorised.push(`${commit.slice(0, 8)} -> ${touched.join(", ")}`);
      else used.add(full);
    }
    expect(unauthorised, "product changes after the integration merge with no named authority").toEqual([]);
    // The list is consumed in full: a stale entry is a failure, not a standing exemption.
    expect([...authorised.keys()].filter(k => !used.has(k)), "AUTHORISED_CROSSINGS entries that matched no commit").toEqual([]);
  });

  /**
   * F-R1 (2026-11-16) — THE LIMB ABOVE WAS BLIND TO MERGE COMMITS, AND THIS BRANCH ALREADY CONTAINS ONE.
   *
   * `git show --name-only <merge>` prints NOTHING by default. The walk above short-circuits on an empty
   * result, so `6bdf2628` — the second merge on this branch — was SKIPPED WITHOUT BEING MEASURED. Its
   * verdict stayed correct only because that merge happens to carry 0 product paths: *** CORRECT BY LUCK OF
   * CONTENT, NOT BY THE CHECK. *** It is A-G492/F-C3's class again — a check that asks "what is listed?"
   * instead of "what can this listing never reach?"
   *
   * This limb pins the mechanism in BOTH directions, so neither can rot unnoticed:
   *   · the bare form MUST print nothing for a merge  — if git ever changes that default, we are told;
   *   · the repaired form MUST print something        — if the flag ever stops working, we are told;
   *   · and the per-commit union MUST cover the two-point diff — the completeness check that would have
   *     caught F-R1 on the day it was written.
   *
   * The completeness assertion is EMPTY BY DESIGN today, because no post-merge commit touches the product
   * surface. That is stated rather than hidden: its value is the moment a merge introduces one.
   */
  it("F-R1: the per-commit walk is not blind to merges, proven on the merge this branch actually contains", () => {
    const head = git("rev-parse", "HEAD")[0];
    const base = resolve(INTEGRATION_MERGE);
    const merges = git("log", "--merges", "--format=%H", `${base}..${head}`);
    expect(merges.length,
      "no merge commit after the integration merge — F-R1's premise has changed; re-read this limb before trusting it").toBeGreaterThan(0);
    for (const m of merges) {
      const bare = git("show", "--name-only", "--format=", "--no-renames", m, "--");
      const seeing = git("show", "--name-only", "--format=", "--no-renames", "--diff-merges=first-parent", m, "--");
      expect(bare.length,
        `git's bare form must print nothing for merge ${m.slice(0, 8)} — that is F-R1 and the whole reason the flag is required`).toBe(0);
      expect(seeing.length,
        `--diff-merges=first-parent must show what merge ${m.slice(0, 8)} changed against its first parent`).toBeGreaterThan(0);
    }
    const twoPoint = git("diff", "--name-only", "--no-renames", base, head, "--", ...PRODUCT).sort();
    const perCommit = new Set<string>();
    for (const c of git("log", "--format=%H", `${base}..${head}`))
      for (const path of git("show", "--name-only", "--format=", "--no-renames", "--diff-merges=first-parent", c, "--", ...PRODUCT))
        perCommit.add(path);
    expect(twoPoint.filter(path => !perCommit.has(path)),
      "product paths the two-point diff sees but the per-commit walk misses — the walk is incomplete").toEqual([]);
  });
});

/**
 * ── THE HANDED-OVER INVARIANTS (A-G492 · PINK-STRUCT's F-C1 / F-C2 / F-C3) ─────────────────────
 *
 * A-G485 closed phase G's range, and PINK-STRUCT measured what that cost: three limbs stopped guarding.
 *   F-C1  the working-tree change set was no longer checked against the entry set;
 *   F-C2  PF-14/PG-7's no-script-motion limb went blind past the base, the working tree included;
 *   F-C3  the `lib/career` engine-scope limb went blind — *** AND THAT IS WHAT LET GELB'S OWN
 *         lib/career/db/client.ts REPAIR PASS MAP-G-ARCH UNEXAMINED. *** Verified with git: over the
 *         open-ended range `lib/career` yields [db/client.ts, mapping/layout.ts, view-model/mapping-field.ts]
 *         while the closed form asserts exactly [layout.ts, MODEL] — so the open form FAILS.
 *
 * PINK-STRUCT's structural judgement, accepted in full: for D/E/F the closure point was the NEXT PHASE'S
 * BASE, and the next phase's gate assumed the open-ended duty. PHASE_INT_BASE is not a phase and has no
 * architecture test, so for G the duty was *** ENDED, NOT HANDED OVER *** — the symmetry with D/E/F was
 * formal, not functional. These three limbs make it functional.
 *
 * THE DIVISION IS DELIBERATE, and it is the invariant/measurement line this record keeps relearning:
 *   · a phase MEASUREMENT ("in lib/career only layout.ts and the model changed IN PHASE G") stays CLOSED in
 *     GRÜN's range — it states a finished interval, and reopening it would measure later phases too;
 *   · its INVARIANT SHADOW ("nothing else in lib/ moves without a named authority") continues here.
 * Phase ranges cover the past; this file covers the merge and everything after it. No duty is asserted twice.
 */

/** Every `lib/` path differing from the merge base, with the authority that owns it. Consumed in full. */
const DECLARED_LIB_CHANGES: Record<string, string> = {
  "lib/career/db/client.ts":
    "GELB · the bootstrap-to-ORM schema-drift repair over 9 tables (the 42703 on career_policy_versions.version). " +
    "DECLARED HERE BECAUSE IT WAS NEVER EXAMINED — F-C3: A-G485's closure is what let it past MAP-G-ARCH's lib/career limb.",
  "lib/career/mapping/layout.ts": "GRÜN · phase G, MAPPING_LAYOUT_V1.1 beside V1",
  "lib/career/view-model/mapping-field.ts": "GRÜN · phase G, the layout call and the drawn radius",
  "lib/career/ui/career-demo-url.ts": "GRÜN · phase D's declared URL_MODULE carve-out",
  "lib/database-isolation/policy.ts": "GELB · B-ENTRY, the disposable-database policy",
  "lib/database-isolation/verification.ts": "GELB · B-ENTRY, assertDisposableServer at the single creation choke point",
};

const COMPONENT = "app/components/career/demo/PersonJobMappingField.tsx";
/** PF-14/PG-7's own token list, carried verbatim so the two cannot drift apart. */
const SCRIPT_MOTION = /requestAnimationFrame|setInterval|setTimeout|\.animate\(|<animate|<set\b|performance\.now|\bwindow\.|\bdocument\./;

describe("MAP-INT-ARCH · the invariants A-G485 ended rather than handed over", () => {
  it("F-C3: every lib/ path differing from the merge base is DECLARED with its authority, and the list is consumed in full", () => {
    const mergeBase = git("merge-base", resolve(PARENT_GELB), resolve(PARENT_GRUEN))[0];
    const changed = git("diff", "--name-only", "--no-renames", mergeBase, resolve(INTEGRATION_MERGE), "--", "lib").sort();
    expect(changed.length, "no lib/ path differs from the merge base, so this assertion would pass over nothing").toBeGreaterThan(0);
    expect(changed.filter(p => DECLARED_LIB_CHANGES[p] === undefined), "lib/ changes with no declared authority").toEqual([]);
    expect(Object.keys(DECLARED_LIB_CHANGES).filter(p => !changed.includes(p)).sort(),
      "DECLARED_LIB_CHANGES entries matching no actual change (a stale declaration is a failure, not an exemption)").toEqual([]);
  });

  it("F-C2: no commit after the integration merge and no working-tree edit adds script motion to the component", () => {
    const head = git("rev-parse", "HEAD")[0];
    const committed = gitAdded(`${resolve(INTEGRATION_MERGE)}..${head}`, COMPONENT);
    const pending = gitAdded(undefined, COMPONENT);
    expect([...committed, ...pending].filter(l => SCRIPT_MOTION.test(l)),
      `script motion added to ${COMPONENT} after the integration merge`).toEqual([]);
  });

  it("F-C1: the working tree holds no product change, unless a WORKING_TREE authority is declared and consumed", () => {
    const pending = [...new Set([
      ...git("diff", "--name-only", "--no-renames", "--cached", "HEAD", "--", ...PRODUCT),
      ...git("diff", "--name-only", "--no-renames", "HEAD", "--", ...PRODUCT),
      ...git("ls-files", "--others", "--exclude-standard", "--", ...PRODUCT),
    ])].sort();
    const declared = AUTHORISED_CROSSINGS.some(c => c.commit === "WORKING_TREE");
    if (!declared) expect(pending, "uncommitted product changes; declare {commit:'WORKING_TREE', reason} to stage work deliberately").toEqual([]);
    else expect(pending.length, "a WORKING_TREE authority is declared but the tree is clean — a stale declaration is a failure").toBeGreaterThan(0);
  });
});
