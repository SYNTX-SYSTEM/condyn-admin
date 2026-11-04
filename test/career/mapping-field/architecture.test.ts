import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * MAP-C-ARCH · phase C boundary (GELB "SFE::PHASE_C", owner limit "NUR PHASE C"): the visible field is added, nothing existing
 * changes meaning. Against the fixed phase-B base PHASE_C_BASE (not against origin/main, so the guarantees read the same before and
 * after the merge — PINK §3.98 F-PC-1):
 *  - the released engine (lib/career/mapping) and its specification files are byte-identical — consumed, not changed;
 *  - the six PERSON orbits, the JOB planetarium, the Job Field, the field selector (two fields), B2 and the backend are untouched;
 *  - the branch changes only its own new files and three named entry points, and in the two product entry points it removes
 *    exactly one line each (the line it extends) and adds only the field;
 *  - the new modules read only: no fetch, no POST, no URL or history write, no storage, no job scope, no model call, no clock or
 *    randomness in the model.
 */
const ROOT = join(__dirname, "../../..");
const git = (...args: string[]) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean);
/**
 * The commit phase C was built on: origin/main 5ca0f3f5 (phase B closed, PINK §3.95). A fixed tree, not the merge base with origin/main:
 * once phase C is merged the merge base is phase C itself and a diff against it is empty, so the tests would either pass vacuously or
 * (for the exact-diff tests) fail. Against this tree they check the same delta on the branch and on main after the merge.
 */
const PHASE_C_BASE = "5ca0f3f5dd4f5e0323396c519eb31df89454449d";
const BASE = git("rev-parse", "--verify", `${PHASE_C_BASE}^{commit}`)[0];
/** Committed, staged and unstaged changes against the base, and new files not yet added. */
const changed = () => [...new Set([...git("diff", "--name-only", BASE), ...git("ls-files", "--others", "--exclude-standard")])].sort();
const diffLines = (file: string, sign: "+" | "-") => execFileSync("git", ["diff", "-U0", BASE, "--", file], { cwd: ROOT, encoding: "utf8" }).split("\n")
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

describe("MAP-C-ARCH · nothing existing changes meaning", () => {
  it("the engine and its specification are byte-identical to the phase-B base", () => {
    expect(git("diff", "--name-only", BASE, "--", "lib/career/mapping", "docs/architecture/decision-fields/mapping-spec", "docs/architecture/decision-fields/PERSON_X_JOB_MAPPING_SPEC.md")).toEqual([]);
    expect(git("ls-files", "--others", "--exclude-standard", "--", "lib/career/mapping")).toEqual([]);
  });

  it("orbits, planetarium, Job Field, field selector, B2, first screen, the automatic reads and the backend are untouched", () => {
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
    expect(git("diff", "--name-only", BASE, "--", ...protectedPaths)).toEqual([]);
  });

  it("against the phase-B base, phase C changes only its new files and the three named entry points (committed, staged, unstaged and new)", () => {
    const own = (p: string) => NEW_FILES.includes(p) || NEW_DIRS.some(d => p.startsWith(d));
    const files = changed();
    expect(files.filter(p => !own(p) && !ENTRY_POINTS.includes(p))).toEqual([]);
    const existing = new Set(git("ls-tree", "-r", "--name-only", BASE));
    expect(files.filter(p => existing.has(p)).sort()).toEqual(ENTRY_POINTS);
    expect(NEW_FILES.filter(p => existing.has(p)), "the new files are new").toEqual([]);
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
