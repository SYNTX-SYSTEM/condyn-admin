import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT, git, phaseCBase } from "./phase-base";

/**
 * MAP-C-ARCH · phase C boundary (GELB "SFE::PHASE_C", owner limit "NUR PHASE C"): the visible field is added, nothing existing
 * changes meaning. The guarantees are bound to phase C's own commits and to the fixed base PHASE_C_BASE (./phase-base.ts), not to
 * origin/main and not to the running tree. They read the same on the branch, on the merge commit, and after any later commit on main
 * that does not touch phase C (PINK §3.98 F-PC-1, §3.99 F-RC-1):
 *  - the released engine (lib/career/mapping) and its specification files are byte-identical to the base — consumed, not changed;
 *  - the six PERSON orbits, the JOB planetarium, the Job Field, the field selector (two fields), B2 and the backend are as in the base;
 *  - every phase-C commit (a commit after the base that touches a phase-C file), and the working tree once it touches one, changes
 *    only phase C's new files and its three named entry points; in the two product entry points phase C removes exactly one line
 *    each (the line it extends) and adds only the field;
 *  - the new modules read only: no fetch, no POST, no URL or history write, no storage, no job scope, no model call, no clock or
 *    randomness in the model.
 * A later commit that touches a phase-C file or entry point for other reasons is held to this boundary too. That is the point at which
 * the boundary has to be re-stated (a later phase).
 */
const diffLines = (file: string, sign: "+" | "-") => execFileSync("git", ["diff", "-U0", phaseCBase(), "--", file], { cwd: ROOT, encoding: "utf8" }).split("\n")
  .filter(line => line.startsWith(sign) && !line.startsWith(`${sign}${sign}${sign} `)).map(line => line.slice(1));
const code = (file: string) => readFileSync(join(ROOT, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'])\/\/.*$/gm, "$1");

const PANEL = "app/components/career/demo/AutoJobRankingPanel.tsx";
const FIELD_HOST = "app/components/career/demo/SemanticCareerIntelligenceField.tsx";
const MODEL = "lib/career/view-model/mapping-field.ts";
const COMPONENT = "app/components/career/demo/PersonJobMappingField.tsx";
const COPY = "app/components/career/demo/mapping-field-copy.ts";
/** The existing files phase C enters — each named in the hand-over. */
const ENTRY_POINTS = [PANEL, FIELD_HOST, "test/career/mapping/architecture.test.ts"].sort();
const NEW_FILES = [MODEL, COMPONENT, COPY, "docs/architecture/decision-fields/PERSON_X_JOB_MAPPING_PHASE_C.md"];
const NEW_DIRS = ["test/career/mapping-field/"];
const own = (p: string) => NEW_FILES.includes(p) || NEW_DIRS.some(d => p.startsWith(d));
const phaseC = (p: string) => own(p) || ENTRY_POINTS.includes(p);

/**
 * The phase-C change sets: every non-merge commit after the base whose files include a phase-C file (renames listed on both sides),
 * and the working tree (staged, unstaged, untracked) as one more, pending, set when it includes one. A commit that touches no
 * phase-C file (a README, an evidence commit, any later unrelated change on main) is not a phase-C change set.
 */
function phaseCChangeSets(): Array<{ commit: string; files: string[] }> {
  const sets: Array<{ commit: string; files: string[] }> = [];
  let current: { commit: string; files: string[] } | null = null;
  for (const line of git("log", "--no-merges", "--no-renames", "--format=@%H", "--name-only", `${phaseCBase()}..HEAD`)) {
    if (line.startsWith("@")) { current = { commit: line.slice(1), files: [] }; sets.push(current); } else current!.files.push(line);
  }
  sets.push({ commit: "WORKING_TREE", files: [...new Set([...git("diff", "--name-only", "--no-renames", "HEAD"), ...git("ls-files", "--others", "--exclude-standard")])] });
  return sets.filter(set => set.files.some(phaseC));
}
/** Changed against the base, in the tree, the index and the working tree, and untracked: for the paths that must stay as they were. */
const changedSinceBase = (...paths: string[]) => [...new Set([...git("diff", "--name-only", "--no-renames", phaseCBase(), "--", ...paths), ...git("ls-files", "--others", "--exclude-standard", "--", ...paths)])].sort();

describe("MAP-C-ARCH · nothing existing changes meaning", () => {
  it("the engine and its specification are byte-identical to the phase-B base (committed, staged, unstaged and new)", () => {
    expect(changedSinceBase("lib/career/mapping", "docs/architecture/decision-fields/mapping-spec", "docs/architecture/decision-fields/PERSON_X_JOB_MAPPING_SPEC.md")).toEqual([]);
  });

  it("orbits, planetarium, Job Field, field selector, B2, first screen, the automatic reads and the backend are as in the phase-B base", () => {
    const protectedPaths = [
      // The six PERSON orbits and the capability planetarium.
      "app/components/career/demo/ResonanceOrbits.tsx", "app/components/career/demo/OrbitalCosmosView.tsx", "app/components/career/demo/OrbitalDeepFocusView.tsx",
      "app/components/career/demo/OrbitalSubspaceView.tsx", "app/components/career/demo/OrbitalSatelliteMotion.tsx", "app/components/career/demo/OrbitalResonanceBubble.tsx",
      "app/components/career/demo/CapabilityField.tsx", "app/components/career/demo/CapabilityCosmosView.tsx", "app/components/career/demo/CapabilityDeepFocusView.tsx",
      "app/components/career/demo/RoleManifestation.tsx", "app/components/career/demo/TensionLayer.tsx", "app/components/career/demo/EvolutionLayer.tsx",
      "app/components/career/demo/IdentityCoreNode.tsx", "app/components/career/demo/SilOrbitEmptyState.tsx", "app/components/career/demo/career-demo-layout.ts",
      "lib/career/view-model/orbital-cosmos-layout.ts", "lib/career/view-model/orbit-focus-projection.ts", "lib/career/view-model/cluster-presentation.ts", "lib/career/view-model/sil-language.ts",
      // The JOB planetarium and the Job Field.
      "app/components/career/demo/manifestation", "app/components/career/demo/SyntxField.tsx", "lib/career/job-pool",
      // The field selector (two fields) and the investigation boundary.
      "app/components/career/demo/SyntxFieldSelector.tsx", "app/components/career/demo/SyntxInvestigationSelector.tsx", "lib/career/job-scope",
      // B2 and the PERSON × JOB first screen.
      "app/components/career/demo/PxjFirstScreen.tsx", "lib/career/view-model/pxj-first-screen.ts", "lib/career/ui/useRoleInvestigation.ts", "lib/career/result-inspector",
      // The automatic reads, the URL, the capability core, the backend.
      "lib/career/ui", "lib/career/capability-core", "app/api"
    ];
    expect(changedSinceBase(...protectedPaths)).toEqual([]);
  });

  it("every phase-C change set (its commits after the base, and the working tree once it touches phase C) changes only its new files and the three named entry points", () => {
    const sets = phaseCChangeSets();
    expect(sets.length, "phase C is in the history").toBeGreaterThan(0);
    for (const set of sets) expect(set.files.filter(p => !phaseC(p)), set.commit).toEqual([]);
    const existing = new Set(git("ls-tree", "-r", "--name-only", phaseCBase()));
    const touched = [...new Set(sets.flatMap(set => set.files))];
    expect(touched.filter(p => existing.has(p)).sort(), "the existing files phase C enters").toEqual(ENTRY_POINTS);
    expect(NEW_FILES.filter(p => existing.has(p)), "the new files are new").toEqual([]);
    expect(NEW_FILES.filter(p => !touched.includes(p)), "and all of them are phase C's").toEqual([]);
  });

  it("the two product entry points: one line removed each (the line extended), and only the field added", () => {
    expect(diffLines(PANEL, "-")).toEqual(["export function AutoJobRankingPanel({ locale, watch, ranking, onGoToJobField, children }: AutoJobRankingPanelProps) {"]);
    expect(diffLines(PANEL, "+").map(l => l.trim())).toEqual([
      "/** PERSON × JOB mapping phase C: the ranking drawn as a field (PersonJobMappingField), shown above the ranked list while a ranking is shown. */",
      "field?: React.ReactNode;",
      "export function AutoJobRankingPanel({ locale, watch, ranking, onGoToJobField, children, field }: AutoJobRankingPanelProps) {",
      "{field}"
    ]);
    expect(diffLines(FIELD_HOST, "-").map(l => l.trim())).toEqual(['<AutoJobRankingPanel locale={locale} watch={autoMatch} ranking={jobRanking} onGoToJobField={() => switchFieldFocus("FIELD")}>']);
    expect(diffLines(FIELD_HOST, "+").map(l => l.trim())).toEqual([
      'import { PersonJobMappingField } from "./PersonJobMappingField";',
      '<AutoJobRankingPanel locale={locale} watch={autoMatch} ranking={jobRanking} onGoToJobField={() => switchFieldFocus("FIELD")}',
      'field={<PersonJobMappingField locale={locale} projection={firstScreen.state === "PERSON_RESULT" ? firstScreen.result.projection : null} ranking={jobRanking} watch={autoMatch} />}>'
    ]);
  });
});

describe("MAP-C-ARCH · the new modules read only", () => {
  it("the model is pure: no React, no fetch, no clock, no randomness, no timer, no storage, no window; engine and spec only", () => {
    const c = code(MODEL);
    expect(c).not.toMatch(/from\s+["'](react|react-dom|next)(\/[^"']*)?["']/);
    expect(c).not.toMatch(/\bfetch\s*\(|\bDate\b|Math\.random|performance\.|setTimeout|setInterval|requestAnimationFrame|localStorage|sessionStorage|\bwindow\b|\bdocument\b/);
    expect(c).not.toMatch(/^\s*["']use client["']/m);
    for (const line of c.split("\n").filter(l => /^\s*import\b/.test(l))) {
      const from = /from\s+["']([^"']+)["']/.exec(line)?.[1] ?? "";
      const allowed = from.startsWith("../mapping/") || /\/docs\/architecture\/decision-fields\/mapping-spec\/[a-z-]+\.json$/.test(from) || /^\s*import\s+type\s/.test(line);
      expect(allowed, line).toBe(true);
    }
  });

  it("the component and its copy: no fetch, no POST, no URL or history write, no storage, no job scope, no model call", () => {
    for (const file of [COMPONENT, COPY]) {
      const c = code(file);
      expect(c, file).not.toMatch(/\bfetch\s*\(|method:\s*["']POST|writeCareerDemoUrl|pushState|replaceState|history\.|location\.|localStorage|sessionStorage|XMLHttpRequest|sendBeacon/);
      expect(c, file).not.toMatch(/jobScope|JobScope|onSelectJobScope|selectJobScope|investigationMode/);
      expect(c, file).not.toMatch(/gemini|Gemini|\/api\//);
      expect(c, file).not.toMatch(/\bDate\b|Math\.random/);
    }
    // The component reaches the engine only through the model, the focus machine's initial state and type-only imports.
    const imports = code(COMPONENT).split("\n").filter(l => /^\s*import\b/.test(l) && /career\/mapping\//.test(l));
    for (const line of imports) expect(/^\s*import\s+type\s/.test(line) || /import \{ FOCUS_INITIAL, type FocusState \} from/.test(line), line).toBe(true);
  });

  it("phase C names no action that opens a role or a requirement, or selects anything (B-3; L2/L3 are later)", () => {
    for (const file of [MODEL, COMPONENT]) {
      const c = code(file).replace(/OPEN_POOL/g, "");
      expect(c.match(/type:\s*["'](OPEN_ROLE|OPEN_REQUIREMENT|SELECT_CAPABILITY|MARK_REQUIREMENT)["']/g), file).toBeNull();
      expect(c, file).not.toMatch(/SELECT_(ROLE|REQUIREMENT|POOL|JOB)/);
    }
  });
});
