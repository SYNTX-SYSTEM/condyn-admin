import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ROOT, git, phaseDBase, phaseEBase } from "./phase-base";

/**
 * MAP-D-ARCH · the phase-D boundary (PERSON_X_JOB_MAPPING_PHASE_D.md §5.2, D-1 … D-7, held by PINK). The guarantees are bound to
 * phase D's own commits and to the fixed base PHASE_D_BASE (./phase-base.ts) — not to origin/main and not to the running tree — so
 * they read the same on the branch, on the merge commit, and after any later commit on main that does not touch phase D.
 *  D-1 the engine and its specification are byte-identical to the base;
 *  D-2 the protected paths are as in the base (the phase-C list less three carve-outs: SyntxFieldSelector.tsx, career-demo-url.ts,
 *      career-demo-layout.ts), now with AutoJobRankingPanel.tsx among them (D-4);
 *  D-3 every phase-D change set (a commit after the base that touches a phase-D file, and the working tree once it does) changes
 *      only phase-D files;
 *  D-5 the entry points pinned to exactly what phase D delivered;
 *  D-6 the model is pure; D-7 the model, the component and the copy read only — no write, no URL, no storage, no job scope.
 * "Staged" includes a change that is only in the index (PINK F-FIN-1): the index is compared against the base as well.
 */
const diffLines = (file: string, sign: "+" | "-") => execFileSync("git", ["diff", "-U0", phaseDBase(), "--", file], { cwd: ROOT, encoding: "utf8" }).split("\n")
  .filter(line => line.startsWith(sign) && !line.startsWith(`${sign}${sign}${sign} `)).map(line => line.slice(1).trim());
const code = (file: string) => readFileSync(join(ROOT, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'])\/\/.*$/gm, "$1");

const DEMO = "app/components/career/demo";
const MODEL = "lib/career/view-model/mapping-field.ts";
const COMPONENT = `${DEMO}/PersonJobMappingField.tsx`;
const COPY = `${DEMO}/mapping-field-copy.ts`;
const HOST = `${DEMO}/SemanticCareerIntelligenceField.tsx`;
const DASHBOARD = `${DEMO}/CareerIntelligenceDashboard.tsx`;
const LAYOUT = `${DEMO}/career-demo-layout.ts`;
const SELECTOR = `${DEMO}/SyntxFieldSelector.tsx`;
const URL_MODULE = "lib/career/ui/career-demo-url.ts";
/** §7: the existing files phase D enters, each named there (D-3: the phase-C artifacts are baseline, hence entry points). */
const ENTRY_POINTS = [MODEL, COMPONENT, COPY, SELECTOR, HOST, URL_MODULE, DASHBOARD, LAYOUT,
  "test/career/mapping/architecture.test.ts", "test/career/job-pool/job-scope-ssr.test.tsx", "test/job-pool-validation/syntx-walk.e2e.test.ts",
  "test/job-pool-validation/support/syntx-readonly-walk.mjs", "test/job-pool-validation/job-scope-gate.e2e.test.ts",
  // T-07, the PERSON seal narrowed by the two shell subtrees phase D changes (D-3 re-stated by PINK fb7010aa).
  "test/career/pxj-first-screen/person-markup.test.tsx", "test/career/pxj-first-screen/fixtures/person-markup-49e2bc6.sha256.json"].sort();
/** §7: the proofs of §8 are added here. */
const PHASE_DIRS = ["test/career/mapping-field/", "test/career/mapping-spec/"];
const phaseD = (p: string) => ENTRY_POINTS.includes(p) || PHASE_DIRS.some(d => p.startsWith(d));

/**
 * The phase-D change sets: every non-merge commit after the base whose files include a phase-D file (renames listed on both sides),
 * and the working tree (index against HEAD, working tree against HEAD, untracked) as one more, pending, set when it includes one. A
 * commit that touches no phase-D file (a README, an evidence commit, any later unrelated change on main) is not a phase-D change set.
 */
function phaseDChangeSets(): Array<{ commit: string; files: string[] }> {
  const sets: Array<{ commit: string; files: string[] }> = [];
  let current: { commit: string; files: string[] } | null = null;
  for (const line of git("log", "--no-merges", "--no-renames", "--format=@%H", "--name-only", `${phaseDBase()}..HEAD`)) {
    if (line.startsWith("@")) { current = { commit: line.slice(1), files: [] }; sets.push(current); } else current!.files.push(line);
  }
  sets.push({ commit: "WORKING_TREE", files: [...new Set([...git("diff", "--name-only", "--no-renames", "--cached", "HEAD"), ...git("diff", "--name-only", "--no-renames", "HEAD"), ...git("ls-files", "--others", "--exclude-standard")])] });
  return sets.filter(set => set.files.some(phaseD));
}
/** Changed against the base — committed, in the index, in the working tree — and untracked: for the paths that must stay as they were. */
const changedSinceBase = (...paths: string[]) => [...new Set([
  ...git("diff", "--name-only", "--no-renames", "--cached", phaseDBase(), "--", ...paths), ...git("diff", "--name-only", "--no-renames", phaseDBase(), "--", ...paths),
  ...git("ls-files", "--others", "--exclude-standard", "--", ...paths)
])].sort();

/** D-2: the phase-C protected list (MAP-C-ARCH at e360caf9) less the three carve-outs, plus AutoJobRankingPanel.tsx (D-4). */
export const PROTECTED_PATHS = [
  // The six PERSON orbits and the capability planetarium.
  `${DEMO}/ResonanceOrbits.tsx`, `${DEMO}/OrbitalCosmosView.tsx`, `${DEMO}/OrbitalDeepFocusView.tsx`, `${DEMO}/OrbitalSubspaceView.tsx`, `${DEMO}/OrbitalSatelliteMotion.tsx`,
  `${DEMO}/OrbitalResonanceBubble.tsx`, `${DEMO}/CapabilityField.tsx`, `${DEMO}/CapabilityCosmosView.tsx`, `${DEMO}/CapabilityDeepFocusView.tsx`, `${DEMO}/RoleManifestation.tsx`,
  `${DEMO}/TensionLayer.tsx`, `${DEMO}/EvolutionLayer.tsx`, `${DEMO}/IdentityCoreNode.tsx`, `${DEMO}/SilOrbitEmptyState.tsx`,
  "lib/career/view-model/orbital-cosmos-layout.ts", "lib/career/view-model/orbit-focus-projection.ts", "lib/career/view-model/cluster-presentation.ts", "lib/career/view-model/sil-language.ts",
  // The JOB planetarium and the Job Field.
  `${DEMO}/manifestation`, `${DEMO}/SyntxField.tsx`, "lib/career/job-pool",
  // The investigation boundary.
  `${DEMO}/SyntxInvestigationSelector.tsx`, "lib/career/job-scope",
  // B2 and the PERSON × JOB first screen.
  `${DEMO}/PxjFirstScreen.tsx`, "lib/career/view-model/pxj-first-screen.ts", "lib/career/ui/useRoleInvestigation.ts", "lib/career/result-inspector",
  // The automatic reads (all of lib/career/ui but the URL module, C-9), the capability core, the backend.
  "lib/career/ui", `:!${URL_MODULE}`, "lib/career/capability-core", "app/api",
  // D-4: the ranking panel keeps its optional `field` prop and its list.
  `${DEMO}/AutoJobRankingPanel.tsx`
];

describe("MAP-D-ARCH · D-1, D-2, D-4 — nothing protected changes", () => {
  it("D-1: the engine and its specification are byte-identical to the base (committed, staged, unstaged and new)", () => {
    expect(changedSinceBase("lib/career/mapping", "docs/architecture/decision-fields/mapping-spec", "docs/architecture/decision-fields/PERSON_X_JOB_MAPPING_SPEC.md")).toEqual([]);
  });

  it("D-2 / D-4: orbits, planetarium, Job Field, investigation boundary, B2, the automatic reads, the ranking panel and the backend are as in the base", () => {
    expect(changedSinceBase(...PROTECTED_PATHS)).toEqual([]);
    // The carve-outs are exactly three, and the URL module is the one file of lib/career/ui phase D may change.
    for (const carved of [SELECTOR, URL_MODULE, LAYOUT]) expect(PROTECTED_PATHS.filter(p => p === carved), carved).toEqual([]);
  });
});

describe("MAP-D-ARCH · D-3, D-5 — phase D changes only its own files, and exactly as delivered", () => {
  it("D-3: every phase-D change set (its commits after the base, and the working tree once it touches phase D) changes only phase-D files", () => {
    const sets = phaseDChangeSets();
    for (const set of sets) expect(set.files.filter(p => !phaseD(p)), set.commit).toEqual([]);
    const existing = new Set(git("ls-tree", "-r", "--name-only", phaseDBase()));
    const touched = [...new Set(sets.flatMap(set => set.files))];
    expect(touched.filter(p => existing.has(p) && !PHASE_DIRS.some(d => p.startsWith(d))).filter(p => !ENTRY_POINTS.includes(p)), "no existing file outside §7").toEqual([]);
  });

  it("D-5: the dashboard — exactly the two type widenings, the shell mark untouched", () => {
    expect(diffLines(DASHBOARD, "-")).toEqual(['fieldFocus?: "CAPABILITY" | "FIELD";', 'const [activeField, setActiveField] = useState<"CAPABILITY" | "FIELD">("FIELD");']);
    expect(diffLines(DASHBOARD, "+")).toEqual(['fieldFocus?: "CAPABILITY" | "MAPPING" | "FIELD";', 'const [activeField, setActiveField] = useState<"CAPABILITY" | "MAPPING" | "FIELD">("FIELD");']);
  });

  it("D-5: the layout — the clearance over both lines, one intake rule with two conditions on one variable, the stack-tier order", () => {
    expect(diffLines(LAYOUT, "-")).toEqual([
      'if (line === null || job === null) { root.style.removeProperty("--sx-entry-clear"); return; }',
      'root.style.setProperty("--sx-entry-clear", `${Math.ceil(line.getBoundingClientRect().bottom - (job.getBoundingClientRect().top + window.scrollY) + 12)}px`);',
      'const INTAKE_BELOW_ENTRY = `${FIELD}:has(> [data-sx-shell="gate-reason"]) ${JOB} > [data-sx-panel="intake"] { top: max(150px, var(--sx-entry-clear, 150px)) !important; }`;'
    ]);
    expect(diffLines(LAYOUT, "+")).toEqual([
      "// Phase D (PERSON_X_JOB_MAPPING_PHASE_D.md D-2, M1): the MAPPING gate's own line stands under it; the panel starts below the lower one.",
      `const mappingLine = root.querySelector<HTMLElement>('[data-sx-shell="mapping-gate"]');`,
      'if ((line === null && mappingLine === null) || job === null) { root.style.removeProperty("--sx-entry-clear"); return; }',
      "const bottom = Math.max(...[line, mappingLine].filter((element): element is HTMLElement => element !== null).map(element => element.getBoundingClientRect().bottom));",
      'root.style.setProperty("--sx-entry-clear", `${Math.ceil(bottom - (job.getBoundingClientRect().top + window.scrollY) + 12)}px`);',
      "// Phase D (D-Q13 (b)): the MAPPING gate's own line stands in the same column — also alone (PERSON × JOB with a valid job has no",
      "// capability line). One rule, two conditions, one variable: --sx-entry-clear is the lower edge of whichever lines stand there.",
      'const INTAKE_BELOW_ENTRY = `${FIELD}:has(> [data-sx-shell="mapping-gate"]) ${JOB} > [data-sx-panel="intake"], ${FIELD}:has(> [data-sx-shell="gate-reason"]) ${JOB} > [data-sx-panel="intake"] { top: max(150px, var(--sx-entry-clear, 150px)) !important; }`;',
      '${FIELD} > [data-sx-shell="mapping-gate"] { position: relative !important; left: auto !important; right: auto !important; top: auto !important; transform: none !important; order: 4; max-width: 100% !important; width: auto !important; justify-self: stretch; }'
    ]);
  });

  it("D-Q13 (b): every rule that places the intake panel below a gate line reads the one variable; the stylesheet holds one such rule per fixed tier", async () => {
    const { CAREER_DEMO_LAYOUT_CSS } = await import("../../../app/components/career/demo/career-demo-layout");
    const rules = [...CAREER_DEMO_LAYOUT_CSS.matchAll(/([^{}]*\[data-sx-panel="intake"\][^{}]*)\{([^}]*)\}/g)].filter(m => /data-sx-shell="(gate-reason|mapping-gate)"/.test(m[1]));
    expect(rules.length, "the full and the fit tier").toBe(2);
    for (const [, selector, body] of rules) {
      expect(body.trim()).toBe("top: max(150px, var(--sx-entry-clear, 150px)) !important;");
      expect(selector).toContain(':has(> [data-sx-shell="mapping-gate"])');
      expect(selector).toContain(':has(> [data-sx-shell="gate-reason"])');
    }
  });

  it("D-5 (c), scoped to FIELD's direct children: mapping-gate is the only added `${FIELD} > [data-sx-shell=…]` rule, at order 4; no existing such order changed", () => {
    const shellOrders = (css: string) => [...css.matchAll(/\$\{FIELD\} > \[data-sx-shell="([a-z-]+)"\]\s*\{([^}]*)\}/g)].map(m => [m[1], /order:\s*(\d+)/.exec(m[2])?.[1] ?? null] as const);
    const before = shellOrders(git("show", `${phaseDBase()}:${LAYOUT}`).join("\n")), after = shellOrders(readFileSync(join(ROOT, LAYOUT), "utf8"));
    expect(after.filter(([marker]) => !before.some(([m]) => m === marker))).toEqual([["mapping-gate", "4"]]);
    expect(after.filter(([marker]) => marker !== "mapping-gate")).toEqual(before);
    expect(after.filter(([, order]) => order === "4").map(([marker]) => marker)).toEqual(["gate-reason", "mapping-gate"]);
  });

  it("D-5: the host — the panel's field prop removed, the MAPPING stage mounted, the third focus and its gate wired; nothing else", () => {
    expect(diffLines(HOST, "-")).toEqual([
      "/** Planetarium focus: CAPABILITY (default) or FIELD (the SYNTX Job Field, URL focus=FIELD; JOB and POOL are accepted as legacy aliases). Without an explicit focus, an exact jobPoolUploadId opens the field. */",
      'fieldFocus?: "CAPABILITY" | "FIELD";',
      'onFieldFocusChange?: (focus: "CAPABILITY" | "FIELD") => void;',
      'const [fieldFocus, setFieldFocus] = useState<"CAPABILITY" | "FIELD">(initialFieldFocus ?? "FIELD");',
      'const activeFieldFocus: "CAPABILITY" | "FIELD" = fieldFocus === "CAPABILITY" && capabilityGateOpen ? "CAPABILITY" : "FIELD";',
      'const jobPoolWorkflow = useJobPoolWorkflow({ analysisId: comparisonCandidate && activeFieldFocus === "FIELD" && viewedAnalysisSource.kind !== "NONE" ? viewedAnalysisSource.analysisId : null, analysisJobPoolUploadId: analysisPool, initialJobPoolUploadId: jobPoolUploadId ?? null });',
      'const switchFieldFocus = (next: "CAPABILITY" | "FIELD") => {',
      "// selector, keys, exit, return).",
      'mode: investigationMode, gateOpen: capabilityGateOpen, focus: activeFieldFocus, scope: jobScopeValidation.state,',
      "/** The shell's brand follows the active field: directly on a switch (above), and here when the gate itself moves the field (a job",
      "*  becoming VALID after a reload with focus=CAPABILITY, or the selected job turning invalid). */",
      "useEffect(() => { onFieldFocusChange?.(activeFieldFocus); }, [activeFieldFocus]);",
      'const coverageRequest = activeFieldFocus === "CAPABILITY" ? firstScreenCoverageRequest(firstScreenInput) : null;',
      '<AutoJobRankingPanel locale={locale} watch={autoMatch} ranking={jobRanking} onGoToJobField={() => switchFieldFocus("FIELD")}',
      'field={<PersonJobMappingField locale={locale} projection={firstScreen.state === "PERSON_RESULT" ? firstScreen.result.projection : null} ranking={jobRanking} watch={autoMatch} />}>',
      "{/* SYNTX field selector (application shell): the two fields of one system, exactly one active, centred in the upper area. */}"
    ]);
    const added = diffLines(HOST, "+");
    expect(added).toContain('<AutoJobRankingPanel locale={locale} watch={autoMatch} ranking={jobRanking} onGoToJobField={() => switchFieldFocus("FIELD")}>');
    expect(added).toContain('<PersonJobMappingField locale={locale} projection={firstScreen.state === "PERSON_RESULT" ? firstScreen.result.projection : null} ranking={jobRanking} watch={autoMatch} />');
    expect(added.filter(l => /field=\{/.test(l)), "the panel's field prop is gone").toEqual([]);
    // The one added line that names the job scope is the field-entry line that already read it; it changes only its `focus:` operand.
    const entryLine = 'mode: investigationMode, gateOpen: capabilityGateOpen, focus: capabilityActive ? "CAPABILITY" : "FIELD", scope: jobScopeValidation.state,';
    expect(added.filter(l => /jobScope|JobScope|writeCareerDemoUrl|pushUrl/.test(l)), "the new lines write nothing and touch no job scope").toEqual([entryLine]);
    expect(added).toHaveLength(32);
  });
});

describe("MAP-D-ARCH · D-6, D-7 — the model is pure, the field reads only", () => {
  it("D-6: the model is pure: no React, no fetch, no clock, no randomness, no timer, no storage, no window; engine and spec only", () => {
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

  it("D-7: the model, the component and the copy — no fetch, no POST, no URL or history write, no storage, no job scope, no model call", () => {
    for (const file of [MODEL, COMPONENT, COPY]) {
      const c = code(file);
      expect(c, file).not.toMatch(/\bfetch\s*\(|method:\s*["']POST|writeCareerDemoUrl|pushState|replaceState|history\.|location\.|localStorage|sessionStorage|XMLHttpRequest|sendBeacon/);
      expect(c, file).not.toMatch(/jobScope|JobScope|onSelectJobScope|selectJobScope|investigationMode/);
      expect(c, file).not.toMatch(/gemini|Gemini|\/api\//);
      expect(c, file).not.toMatch(/\bDate\b|Math\.random/);
      expect(c, `${file}: the forbidden names stay forbidden (§5.2)`).not.toMatch(/SELECT_(ROLE|POOL|JOB)/);
    }
    // The component reaches the engine only through the model, the focus machine's initial state and type-only imports.
    const imports = code(COMPONENT).split("\n").filter(l => /^\s*import\b/.test(l) && /career\/mapping\//.test(l));
    for (const line of imports) expect(/^\s*import\s+type\s/.test(line) || /import \{ FOCUS_INITIAL, type FocusState \} from/.test(line), line).toBe(true);
  });

  it("D-7: phase D admits the focus machine's full action set — the boundary is the absence of a scope, not a whitelist", async () => {
    const { FIELD_ACTIONS } = await import("../../../lib/career/view-model/mapping-field");
    const { FOCUS_ACTIONS, FOCUS_INITIAL } = await import("../../../lib/career/mapping/focus");
    expect(FIELD_ACTIONS).toBe(FOCUS_ACTIONS);
    expect(Object.keys(FOCUS_INITIAL).sort(), "the focus state has no field for a scope").toEqual(["level", "pool", "requirement", "role", "selection"]);
  });
});

/**
 * MAP-E-ARCH · the phase-E boundary (PERSON_X_JOB_MAPPING_PHASE_E.md §4 B-1 … B-8, §6), bound to PHASE_E_BASE = 86e36924 (GRÜN's
 * phase-D delivery). Phase E changes how the same semantics reach the eye: the stage, its copy, an additive model, and the proofs.
 * The four phase-D test files below are in the set because E-4/A-2, E-6/A-5 and E-7 change forms that phase D asserted; each of their
 * changed assertions is marked "Phase E" where it stands.
 */
const E_ENTRY = [COMPONENT, COPY, MODEL,
  "test/career/mapping-field/field-e.test.tsx", "test/career/mapping-field/neurovisual-e.test.ts", "test/career/mapping-field/architecture.test.ts",
  "test/career/mapping-field/phase-base.ts",
  // phase-D assertions superseded by phase E (form only; the model's three-valued movement and the sign table are unchanged)
  "test/career/mapping-field/field-d.test.tsx", "test/career/mapping-field/field-interaction.test.tsx", "test/career/mapping-field/field-render.test.tsx"].sort();
const changedSinceE = (...paths: string[]) => [...new Set([
  ...git("diff", "--name-only", "--no-renames", "--cached", phaseEBase(), "--", ...paths), ...git("diff", "--name-only", "--no-renames", phaseEBase(), "--", ...paths),
  ...git("ls-files", "--others", "--exclude-standard", "--", ...paths)
])].sort();
/** Every phase-E change set: each non-merge commit after the base, and the working tree (index, unstaged, untracked) as one more. */
function phaseEChangeSets(): Array<{ commit: string; files: string[] }> {
  const sets: Array<{ commit: string; files: string[] }> = [];
  let current: { commit: string; files: string[] } | null = null;
  for (const line of git("log", "--no-merges", "--no-renames", "--format=@%H", "--name-only", `${phaseEBase()}..HEAD`)) {
    if (line.startsWith("@")) { current = { commit: line.slice(1), files: [] }; sets.push(current); } else current!.files.push(line);
  }
  sets.push({ commit: "WORKING_TREE", files: [...new Set([...git("diff", "--name-only", "--no-renames", "--cached", "HEAD"), ...git("diff", "--name-only", "--no-renames", "HEAD"), ...git("ls-files", "--others", "--exclude-standard")])] });
  return sets;
}
/** The lines phase E added to a file, against the base (committed, staged and unstaged together). */
const addedSinceE = (file: string) => execFileSync("git", ["diff", "-U0", phaseEBase(), "--", file], { cwd: ROOT, encoding: "utf8" }).split("\n")
  .filter(line => line.startsWith("+") && !line.startsWith("+++ ")).map(line => line.slice(1));

describe("MAP-E-ARCH · B-1, B-2, B-3 — nothing protected changes", () => {
  it("B-1 / P-9: the engine and its specification are byte-identical to the phase-E base; the twelve golden vectors with them", () => {
    expect(changedSinceE("lib/career/mapping", "docs/architecture/decision-fields/mapping-spec", "docs/architecture/decision-fields/PERSON_X_JOB_MAPPING_SPEC.md")).toEqual([]);
    const vectors = "docs/architecture/decision-fields/mapping-spec/layout-golden-vectors.json";
    expect(git("hash-object", vectors)[0], "golden vectors, blob for blob").toBe(git("rev-parse", `${phaseEBase()}:${vectors}`)[0]);
    expect(Object.keys((JSON.parse(readFileSync(join(ROOT, vectors), "utf8")) as { layouts: Record<string, unknown> }).layouts).length, "the twelve layout vectors").toBe(12);
  });

  it("B-2 / B-3: orbits, planetarium, Job Field, job scope, Capability Field, the selector (C-1 … C-11), host, dashboard, layout, URL, every API route and job-pool module are as at the base", () => {
    expect(changedSinceE(...PROTECTED_PATHS.filter(p => !p.startsWith(":!")), SELECTOR, HOST, DASHBOARD, LAYOUT, URL_MODULE, "app/api", "lib/career/job-pool", "lib/career/job-scope")).toEqual([]);
    expect(changedSinceE("test/career/mapping-field/selector-d.test.tsx", "test/career/mapping-field/selector-keys-d.test.tsx"), "the selector contract's own proofs unchanged").toEqual([]);
  });
});

describe("MAP-E-ARCH · B-4 … B-8 — the change set", () => {
  it("B-8 / §6: every phase-E change set touches only the phase-E entry set; no merge commit after the base", () => {
    for (const set of phaseEChangeSets()) expect(set.files.filter(p => !E_ENTRY.includes(p)), set.commit).toEqual([]);
    expect(git("log", "--merges", "--format=%H", `${phaseEBase()}..HEAD`)).toEqual([]);
  });

  it("B-7: existing test data only — no fixture or support module added or changed", () => {
    expect(changedSinceE("test/career/mapping/fixtures.ts", "test/career/mapping-field/support.ts", "test/career/mapping-field/support-d.ts", ":(glob)test/**/fixtures/**")).toEqual([]);
  });

  it("B-6: no provider and no API in anything phase E added", () => {
    // This file is left out only because it spells the forbidden names in order to forbid them.
    for (const file of E_ENTRY.filter(f => f !== "test/career/mapping-field/architecture.test.ts")) for (const line of addedSinceE(file)) expect(line, file).not.toMatch(/gemini|generativelanguage|openai|anthropic\.com|\/api\/|GEMINI_JOB_CALL_LIMIT\s*=\s*[1-9]/i);
  });

  it("B-4: the stage's new runtime reach is its own box (and the focus strip's edge, E-8c) — measure, observe, resize, the motion preference, a frame clock; nothing that reads or writes outside", () => {
    const added = addedSinceE(COMPONENT).join("\n");
    expect(added).not.toMatch(/\bfetch\s*\(|localStorage|sessionStorage|indexedDB|document\.cookie|navigator\.|location\.|history\.|window\.open|postMessage|sendBeacon|WebSocket|EventSource/);
    const globals = [...added.matchAll(/\bwindow\.(\w+)/g)].map(m => m[1]);
    expect([...new Set(globals)].sort(), "the window members phase E reads").toEqual(["addEventListener", "innerHeight", "matchMedia", "removeEventListener", "scrollY"]);
    // E-8c: the one element outside its own box the stage reads is the focus strip — its bottom edge, to stand below it.
    expect([...new Set([...added.matchAll(/\bdocument\.(\w+)/g)].map(m => m[1]))], "the document members phase E reads").toEqual(["querySelector"]);
    expect([...new Set([...added.matchAll(/querySelector<\w+>\('([^']+)'\)/g)].map(m => m[1]))]).toEqual(['[data-testid="field-focus-strip"]']);
    expect(code(MODEL), "the model stays pure (D-6 holds for the additions)").not.toMatch(/\bwindow\b|\bdocument\b|performance\.|requestAnimationFrame/);
  });

  it("B-5: no invented semantics — the model's additions name only the table's classes, the delta's two movement kinds and their forms", () => {
    const literals = addedSinceE(MODEL).flatMap(line => [...line.matchAll(/"([A-Z][A-Z_]+)"/g)].map(m => m[1]));
    const allowed = new Set(["SEMANTIC", "LEXICAL", "NONE", "CHECKED", "NAME_ONLY"]);
    expect([...new Set(literals)].filter(l => !allowed.has(l)), "a new state or class would be a new literal").toEqual([]);
    const data = addedSinceE(COMPONENT).flatMap(line => [...line.matchAll(/data-(?:change|motion|beam-rank|breath|stage|evidence-step)=\{?"?([^"}\s]*)/g)].map(m => m[1]));
    expect(data.length).toBeGreaterThan(0);
  });
});
