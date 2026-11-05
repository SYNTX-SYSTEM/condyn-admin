import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { phaseDBase } from "../mapping-field/phase-base";

/**
 * MAPPING_ARCHITECTURE · phase B is pure modules only (owner limit "NUR PHASE B"): lib/career/mapping imports no React, no Next, no
 * fetch, no clock and no randomness; its constants come from the specification files; nothing outside lib/career/mapping imports it;
 * and the branch touches no existing file.
 * Phase C (GELB "SFE::PHASE_C") consumes the engine: its visible field (lib/career/view-model/mapping-field.ts and its component) is
 * the only importer outside the mapping, and the engine itself stays byte-identical to the released engine: the fixed phase-B base
 * 5ca0f3f5 (PINK §3.97), not the merge base with origin/main, so committed changes on main stay guarded too (PINK §3.99 O-RC-1).
 * Phase D (PERSON_X_JOB_MAPPING_PHASE_D.md §7) re-binds it to PHASE_D_BASE e360caf9, where the engine is the same released engine.
 */
const ROOT = join(__dirname, "../../..");
const DIR = join(ROOT, "lib/career/mapping");
const MODULES = readdirSync(DIR).filter(f => f.endsWith(".ts")).sort();
const source = (f: string) => readFileSync(join(DIR, f), "utf8");
/** The code without comments, so a comment may name what the code must not do. */
const code = (f: string) => source(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'])\/\/.*$/gm, "$1");
const git = (...args: string[]) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
/** git grep exits 1 when nothing matches: that is the empty answer, not a failure. */
const gitGrep = (...args: string[]) => { try { return git("grep", ...args); } catch (error) { if ((error as { status?: number }).status === 1) return []; throw error; } };

describe("MAP-ARCH · pure modules", () => {
  it("the five modules exist and nothing else", () => {
    expect(MODULES).toEqual(["delta.ts", "focus.ts", "layout.ts", "signs.ts", "view.ts"]);
  });

  it("no React, no Next, no fetch, no clock, no randomness, no timer, no storage, no node module", () => {
    for (const f of MODULES) {
      const c = code(f);
      expect(c, f).not.toMatch(/from\s+["'](react|react-dom|next)(\/[^"']*)?["']/);
      expect(c, f).not.toMatch(/\bfetch\s*\(|\bDate\b|Math\.random|performance\.|setTimeout|setInterval|requestAnimationFrame|localStorage|sessionStorage|\bwindow\b|\bdocument\b/);
      expect(c, f).not.toMatch(/from\s+["']node:/);
      expect(c, f).not.toMatch(/^\s*["']use client["']/m);
    }
  });

  it("imports from outside the mapping are type-only, except the specification JSON", () => {
    for (const f of MODULES) for (const line of code(f).split("\n").filter(l => /^\s*import\b/.test(l))) {
      const from = /from\s+["']([^"']+)["']/.exec(line)?.[1] ?? "";
      if (from.startsWith("./")) continue;
      if (/\/docs\/architecture\/decision-fields\/mapping-spec\/[a-z-]+\.json$/.test(from)) continue;
      expect(line, f).toMatch(/^\s*import\s+type\s/);
    }
  });

  it("the layout and sign constants are read from layout-spec.json / sign-table.json, not written a second time", () => {
    const layout = code("layout.ts"), signs = code("signs.ts");
    for (const literal of ["0.618", "160", "220", "380", "400", "430", "480", "500", "520", "2.2", "0.05", "0.9", "0.06", "-90", "30", "52", "74"]) expect(layout, literal).not.toMatch(new RegExp(`(^|[^\\w.])${literal.replace(".", "\\.")}(?![\\w.])`));
    expect(layout).toMatch(/layout-spec\.json/);
    for (const word of ["solid", "dotted", "counterTick", "faint-dotted", "formation"]) expect(signs, word).not.toContain(`"${word}"`);
    expect(signs).toMatch(/sign-table\.json/);
  });

  it("B-3 naming: no module names an action that selects a role or a requirement (they are marked)", () => {
    for (const f of MODULES) expect(code(f), f).not.toMatch(/SELECT_(ROLE|REQUIREMENT|POOL|JOB)/);
  });
});

describe("MAP-ARCH · nothing existing is touched", () => {
  it("outside lib/career/mapping only the phase C field imports the mapping modules (its model, its component, its copy, its tests)", () => {
    // Every import spelling: through the path (…/career/mapping/x), relative from a sibling directory of lib/career (../mapping/x) and
    // relative from a module in lib/career itself (./mapping/x; PINK §3.98 O-PC-1).
    const users = gitGrep("--untracked", "-l", "-E", "(career/|\\.\\.?/)mapping/(view|layout|signs|delta|focus)[\"']", "--", ".", ":!lib/career/mapping", ":!test/career/mapping", ":!test/career/mapping-field", ":!docs");
    expect(users).toEqual(["app/components/career/demo/PersonJobMappingField.tsx", "app/components/career/demo/mapping-field-copy.ts", "lib/career/view-model/mapping-field.ts"]);
  });

  it("against the released engine (phase-D base e360caf9), the engine modules are unchanged (committed, staged, unstaged and new) — phase D's boundary is its own test", () => {
    const changed = [...git("diff", "--name-only", "--no-renames", "--cached", phaseDBase(), "--", "lib/career/mapping"), ...git("diff", "--name-only", "--no-renames", phaseDBase(), "--", "lib/career/mapping"),
      ...git("ls-files", "--others", "--exclude-standard", "--", "lib/career/mapping")];
    expect(changed).toEqual([]);
  });
});
