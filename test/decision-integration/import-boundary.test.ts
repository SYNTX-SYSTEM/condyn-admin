import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * R8: the import boundary holds in both directions.
 * lib/decision-core imports no career code (already sealed by test/decision-core/authority/contract.test.ts);
 * lib/career imports nothing from decision-core, decision-adapters or decision-runtime;
 * the HR context layer stays outside the HTTP transport and the Next app.
 */

const sourceFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
  entry.isDirectory() ? sourceFiles(join(directory, entry.name)) : /\.(ts|tsx)$/.test(entry.name) ? [join(directory, entry.name)] : []
);

const specifierPattern = /(?:from\s*|import\s*\(\s*|require\s*\(\s*|import\s+)(["'`])([^"'`]+)\1/g;

function importSpecifiers(file: string): string[] {
  const source = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  return [...source.matchAll(specifierPattern)].map((match) => match[2]);
}

function offenders(root: string, forbidden: RegExp): string[] {
  return sourceFiles(resolve(process.cwd(), root)).flatMap((file) =>
    importSpecifiers(file).filter((specifier) => forbidden.test(specifier)).map((specifier) => `${file.slice(process.cwd().length + 1)} -> ${specifier}`)
  );
}

describe("R8 import boundary between G2 and G3", () => {
  it("lib/career never imports the generic decision kernel, its adapters, or its runtime", () => {
    expect(offenders("lib/career", /decision-core|decision-adapters|decision-runtime|hr-decision-context/)).toEqual([]);
  });

  it("lib/decision-core never imports career, capability-core, matching, or recommendation code", () => {
    expect(offenders("lib/decision-core", /career|capability-core|matching|recommendations|decision-adapters|decision-runtime|hr-decision-context/)).toEqual([]);
  });

  it("the career canonical producer adapter is the only G2-side module importing G3 relation code", () => {
    const adapterImports = offenders("lib/decision-adapters/career-canonical", /career\//);
    expect(adapterImports.length).toBeGreaterThan(0);
    expect(offenders("lib/decision-adapters/revision-persistence", /career/)).toEqual([]);
    expect(offenders("lib/decision-runtime/composition", /career/)).toEqual([]);
    expect(offenders("lib/decision-runtime/use-cases", /career/)).toEqual([]);
    expect(offenders("lib/decision-runtime/http", /career/)).toEqual([]);
  });

  it("the HR context layer stays outside both kernels' transports and the Next app", () => {
    expect(offenders("lib/hr-decision-context", /decision-runtime|app\/|next|career\/db|career\/decisions|career\/orchestration|postgres|drizzle/)).toEqual([]);
  });

  it("G3 mirrors the four-field reference shape without importing it", () => {
    const g3 = readFileSync(resolve(process.cwd(), "lib/career/relation/state-change-declaration/types.ts"), "utf8");
    const g2 = readFileSync(resolve(process.cwd(), "lib/decision-core/authority/types.ts"), "utf8");
    const fields = (source: string) => [...source.match(/export interface AuthoritativeStateReference \{([\s\S]*?)\n\}/)![1].matchAll(/^\s+([a-zA-Z]+): string;/gm)].map((entry) => entry[1]).sort();
    expect(fields(g3)).toEqual(fields(g2));
    expect(fields(g2)).toEqual(["artifactId", "authorityContractId", "locator", "producerId"]);
  });
});
