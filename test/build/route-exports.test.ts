import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * B-3 (owner "OWNER_GO — RECURSIVE UX/UI & SYSTEM CLOSURE" §07): `next build` type-checks every App Router route file against the
 * route contract; a route file may export only HTTP handlers and route segment config. An extra export (the proxy route exported
 * `handleProxy`) fails the production build ("does not match the required types of a Next.js Route").
 */
const ROOT = join(__dirname, "..", "..");
const ALLOWED = new Set([
  "GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS",
  "runtime", "dynamic", "dynamicParams", "revalidate", "fetchCache", "preferredRegion", "maxDuration", "generateStaticParams"
]);

const routeFiles = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? routeFiles(path) : /^route\.(ts|tsx|js)$/.test(name) ? [path] : [];
});

/** Names a module exports at top level: `export (async) function N`, `export const|let N`, `export class N`, `export { a, b as c }`. */
const exportedNames = (source: string): string[] => {
  const names: string[] = [];
  for (const m of source.matchAll(/^export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) names.push(m[1]);
  for (const m of source.matchAll(/^export\s*\{([^}]*)\}/gm)) for (const part of m[1].split(",")) { const name = part.trim().split(/\s+as\s+/).pop(); if (name) names.push(name); }
  return names;
};

describe("B-3 · App Router route files export only the route contract", () => {
  const files = routeFiles(join(ROOT, "app"));

  it("finds the route files, the proxy route among them", () => {
    expect(files.length).toBeGreaterThan(10);
    expect(files.map(f => relative(ROOT, f))).toContain(join("app", "api", "admin", "proxy", "[...path]", "route.ts"));
  });

  it("REPRODUCE: no route file exports a name outside the route contract", () => {
    const offending = files.flatMap(file => exportedNames(readFileSync(file, "utf8")).filter(name => !ALLOWED.has(name)).map(name => `${relative(ROOT, file)}: ${name}`));
    expect(offending).toEqual([]);
  });

  it("inverse: the proxy route still serves GET, POST, PUT and DELETE with one handler", () => {
    const source = readFileSync(join(ROOT, "app", "api", "admin", "proxy", "[...path]", "route.ts"), "utf8");
    expect(exportedNames(source).sort()).toEqual(["DELETE", "GET", "POST", "PUT"]);
    for (const method of ["GET", "POST", "PUT", "DELETE"]) expect(source).toMatch(new RegExp(`^export const ${method} = handleProxy;$`, "m"));
  });
});
