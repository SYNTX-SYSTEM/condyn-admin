import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { SEMANTIC_RELATION_STATES } from "../../../lib/career/job-pool/relation-cache";
import { RANKING_SEMANTIC_STATES } from "../../../lib/career/ui/auto-match";

/**
 * AUTO_CAPABILITY: the career demo's client bundle stays free of server modules. On GELB's backend 19b472c semantic-config.ts
 * imported node:crypto and the Gemini provider while the client's role-discovery.ts imported a value from it: /career/demo answered
 * 500 (ModuleBuildError "node:crypto", the two SSR e2e tests). GELB fixed it at the source (e5f0908, semantic-limits.ts); this walk
 * keeps it fixed: every value import (not `import type`) reachable from the dashboard, failing on any node:* module. The relation
 * states the client keeps as its own (auto-match.ts) are held equal to the server's.
 */
const ROOT = resolve(__dirname, "../../..");
const ENTRY = "app/components/career/demo/CareerIntelligenceDashboard.tsx";
const resolveImport = (from: string, spec: string): string | null => {
  if (!spec.startsWith(".")) return null;
  const base = resolve(dirname(join(ROOT, from)), spec);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]) if (existsSync(candidate) && !candidate.endsWith("/")) { try { readFileSync(candidate); return relative(ROOT, candidate); } catch { /* a directory */ } }
  return null;
};
/** Value imports of a module: `import … from "x"` and `export … from "x"` without `type`, and dynamic import("x"). */
const valueImports = (source: string): string[] => {
  const out: string[] = [];
  for (const m of source.matchAll(/^\s*(?:import|export)\s+(?!type\b)([\s\S]*?)\s+from\s+["']([^"']+)["']/gm)) out.push(m[2]);
  for (const m of source.matchAll(/^\s*import\s+["']([^"']+)["']/gm)) out.push(m[1]);
  for (const m of source.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) out.push(m[1]);
  return out;
};
function reach(entry: string) {
  const seen = new Set<string>(), offenders: string[] = [];
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.shift()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const spec of valueImports(readFileSync(join(ROOT, file), "utf8"))) {
      if (spec.startsWith("node:")) offenders.push(`${file} → ${spec}`);
      const next = resolveImport(file, spec);
      if (next !== null) queue.push(next);
    }
  }
  return { seen, offenders };
}

describe("AC-BUNDLE · the client bundle", () => {
  it("REPRODUCE: no module reachable from the dashboard by a value import imports node:*", () => {
    const { seen, offenders } = reach(ENTRY);
    expect(seen.has("lib/career/ui/auto-match.ts")).toBe(true);
    expect(seen.has("lib/career/ui/role-discovery.ts")).toBe(true);
    expect(offenders).toEqual([]);
  });

  it("inverse: the walk sees a server module when one is reached (semantic-config imports node:crypto)", () => {
    expect(reach("lib/career/job-pool/semantic-config.ts").offenders).toContain("lib/career/job-pool/semantic-config.ts → node:crypto");
  });

  it("REPRODUCE: the client's own relation states equal the server's", () => {
    expect(RANKING_SEMANTIC_STATES).toEqual([...SEMANTIC_RELATION_STATES]);
  });
});
