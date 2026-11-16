import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SIL_COPY } from "../../lib/career/view-model/sil-language";

/**
 * UI-COPY CURRENCY · F-R8's class guard (GELB, 2026-11-16).
 *
 * WHY THIS EXISTS, and it is the sharpest thing this phase found. Five browser suites gate themselves on
 * `describe.skipIf(playwrightModule === null)`, where the resolution is
 * `createRequire(package.json).resolve("playwright")`. *** playwright WAS NEVER DECLARED IN package.json AT
 * ANY REF, so those suites skipped — and a skip that depends on a module resolving is not a policy, it is an
 * untracked dependency wearing a policy's clothes. *** Of the certified run's 20 skipped tests, 8 skip by
 * mandate (Gemini off) and 12 skipped for that reason; SEVEN OF THOSE TWELVE SAT INSIDE TWO FILES THE SUMMARY
 * LINE REPORTED AS PASSED, so counting skipped FILES found 11 and never revealed two half-skipped passes.
 *
 * THE COST, MEASURED RATHER THAN FEARED. With the dependency declared the suites run, and one assertion had
 * been wrong for 23 DAYS: it expected the literal "UPLOADED != SELECTED" while the product says
 * "UPLOADED ≠ OPENED · open it in the list below", changed deliberately in 44f9eede ("one word, one meaning",
 * UX-07) on 2026-10-23. *** A TEST THAT CANNOT RUN CANNOT GO RED, SO IT AGES SILENTLY WHILE THE PRODUCT MOVES
 * PAST IT. ***
 *
 * SO THIS FILE GUARDS THE CLASS, NOT THAT ONE LINE, AND IT NEEDS NO BROWSER. Every UI-copy-shaped literal the
 * browser suites assert against must still exist in SIL_COPY. Copy drift now fails in milliseconds inside the
 * ordinary suite, instead of waiting for a browser suite that may not be running at all.
 *
 * ITS LIMIT, ASSERTED RATHER THAN ONLY WRITTEN (A-G415): the extraction is a HEURISTIC over literals passed to
 * toContain/toBe that look like UI copy. It cannot recognise a stale literal as *intended* copy — that is
 * precisely what makes a stale one visible here, since it will match no SIL value. Literals that are genuinely
 * not copy must be declared below, and the declaration is consumed in full.
 */

const ROOT = join(__dirname, "../..");

/** The suites that assert against rendered UI copy. */
const BROWSER_SUITES = [
  "test/career/job-pool/e2e/job-pool-workflow.e2e.test.ts",
  "test/career/hr-decision-loop/e2e/hr-decision-loop-frontend.e2e.test.ts",
];

/**
 * Literals that LOOK like a whole SIL value but are a DELIBERATE FRAGMENT of one, each naming its parent.
 * Consumed in full, so a declaration that stops matching is a failure rather than a standing exemption.
 *
 * *** WHY THE MATCH IS EXACT AND NOT A SUBSTRING, WHICH IS THE WHOLE DESIGN. *** A substring rule would have
 * let F-R8 through. The stale literal "UPLOADED != SELECTED" STILL EXISTS in SIL_COPY today — as a fragment of
 * `en.jobPool.nonClaims` and `en.syntx.nonClaims`, two sentences that have nothing to do with the upload
 * status line the test was reading. So the literal remained findable in the codebase while being wrong exactly
 * where it was asserted. *** A STRING THAT STILL EXISTS SOMEWHERE IS NOT EVIDENCE THAT IT STILL EXISTS WHERE
 * IT IS ASSERTED *** — the same confusion between a kind and an identity as A-G494's `.git` check, and the
 * reason this limb spends a declaration rather than relaxing its comparison.
 */
const NOT_COPY: Record<string, string> = {
  "COVERED != SCORED": "a fragment of en.jobPool.nonClaims / en.jobField.nonClaims; the test reads one clause of that sentence",
  "PERSISTED != TRUE": "a fragment of en.decisionLoop.nonClaims; the test reads one clause of that sentence",
};

const silValues = (): Set<string> => {
  const out = new Set<string>();
  const walk = (node: unknown): void => {
    if (typeof node === "string") { out.add(node); return; }
    if (node !== null && typeof node === "object") for (const v of Object.values(node)) walk(v);
  };
  walk(SIL_COPY);
  return out;
};

/** Literals handed to toContain(...) / toBe(...) that look like rendered UI copy. */
const assertedLiterals = (source: string): string[] => {
  const found = new Set<string>();
  for (const m of source.matchAll(/\.(?:toContain|toBe)\(\s*"((?:[^"\\]|\\.){8,})"\s*\)/g)) {
    const literal = m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    // UI copy here is upper-case-led and carries at least three capitals; ids, selectors and urls are not.
    if (!/[A-Z]{3}/.test(literal)) continue;
    if (/^[a-z-]+$|^https?:|^\/|^\[|data-|^JPOOL_|^ANL_|^[A-Z0-9_]+$/.test(literal)) continue;
    found.add(literal);
  }
  return [...found].sort();
};

describe("UI copy currency · asserted copy still exists in SIL_COPY (F-R8)", () => {
  const values = silValues();

  it("SIL_COPY yields a non-trivial set of strings, so the comparison is not vacuous", () => {
    expect(values.size).toBeGreaterThan(200);
  });

  for (const suite of BROWSER_SUITES) {
    it(`${suite} asserts no copy that SIL_COPY no longer contains`, () => {
      const source = readFileSync(join(ROOT, suite), "utf8");
      const literals = assertedLiterals(source);
      expect(literals.length, `no copy-shaped literal found in ${suite} — the extraction heuristic has stopped matching and this limb would pass over nothing`).toBeGreaterThan(0);
      const missing = literals.filter(l => !values.has(l) && NOT_COPY[l] === undefined);
      expect(missing, `literal(s) asserted by ${suite} that exist in no SIL_COPY entry — either the product copy moved and the test is stale (F-R8), or declare them in NOT_COPY with a reason`).toEqual([]);
    });
  }

  it("the NOT_COPY declaration is consumed in full — a stale entry is a failure, not an exemption", () => {
    const all = new Set(BROWSER_SUITES.flatMap(s => assertedLiterals(readFileSync(join(ROOT, s), "utf8"))));
    expect(Object.keys(NOT_COPY).filter(l => !all.has(l))).toEqual([]);
  });
});
