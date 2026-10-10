import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const sharedDefault = /localhost:5432\/condyn(?![_a-z0-9])/;

function files(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next" || entry.startsWith(".")) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...files(path));
    else if (/\.(ts|tsx|js|mjs|cjs)$/.test(entry)) out.push(path);
  }
  return out;
}

/** Sealed G2 tests and frozen G3 tests keep their literal fallback; under the guard it is unreachable. */
const FROZEN_TEST_FALLBACKS = [
  "test/career/capability-core/relation-operand/operand-postgres.test.ts",
  "test/career/relation/action-intent/t12a-historical-fixture.ts",
  "test/career/relation-adapters/outcome-valence-feedback-context-revision-persistence/career-outcome-valence-feedback-context-revision-postgres.test.ts",
  "test/career/relation/capability-requirement/relation-postgres.test.ts",
  "test/career/relation/decision-authority/persistence-postgres.test.ts",
  "test/career/relation/decision-context/persistence-postgres.test.ts",
  "test/career/relation/decision-record/persistence-postgres.test.ts",
  "test/career/relation/recommendation-proposal/atomic-persistence-postgres.test.ts",
  "test/career/relation/requirement-inventory/concrete-composition-postgres.test.ts",
  "test/career/relation/requirement-inventory/postgres.test.ts",
  "test/career/target-adapters/organization-revision-persistence/postgres.test.ts",
  "test/career/target-adapters/role-organization-binding-revision-persistence/postgres.test.ts",
  "test/career/target-adapters/role-profile-revision-persistence/postgres.test.ts",
  "test/career/target-adapters/role-requirement-artifact-persistence/postgres.test.ts",
  "test/career/target-adapters/role-requirement-revision-persistence/postgres.test.ts",
  "test/career/target-adapters/role-source-binding-revision-persistence/postgres.test.ts",
  "test/career/target-adapters/source-revision-persistence/postgres.test.ts",
  "test/career/target/role/requirement-durable-producer-postgres.test.ts",
  "test/decision-adapters/revision-persistence/postgres.test.ts",
  "test/decision-runtime/composition/postgres-capability-core.test.ts",
  "test/decision-runtime/e2e/local-decision-context-http.e2e.test.ts",
  "test/decision-runtime/use-cases/root-decision-context.test.ts",
].sort();

describe("database access paths (static regression proof)", () => {
  it("no application, script or root module names the shared database as a default", () => {
    const offenders = [...files(resolve(root, "lib")), ...files(resolve(root, "app")), ...files(resolve(root, "scripts")),
      ...readdirSync(root).filter(entry => /\.(ts|js|mjs|cjs)$/.test(entry)).map(entry => resolve(root, entry))]
      .filter(path => sharedDefault.test(readFileSync(path, "utf8")))
      .map(path => relative(root, path));
    expect(offenders).toEqual([]);
  });

  it("only the frozen list of sealed or frozen tests still carries the literal fallback, and no new one appears", () => {
    // test/database-isolation uses the shared URL only as an input that must be refused.
    const withFallback = files(resolve(root, "test")).map(path => relative(root, path)).filter(path => !path.startsWith("test/database-isolation/"))
      .filter(path => sharedDefault.test(readFileSync(resolve(root, path), "utf8"))).sort();
    expect(withFallback).toEqual(FROZEN_TEST_FALLBACKS);
  });

  it("vitest always runs the isolation gate and never takes DATABASE_URL from .env files", async () => {
    const config = readFileSync(resolve(root, "vitest.config.ts"), "utf8");
    expect(config).toContain("./test/support/database-isolation/global-setup.ts");
    expect(config).toContain("./test/support/database-isolation/setup.ts");
    expect(config).toContain("delete env.DATABASE_URL");
    const previous = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/condyn";
    try {
      const factory = (await import("../../vitest.config")).default as unknown as (env: { mode: string; command: string }) => { test: { env: Record<string, string> } };
      expect(factory({ mode: "test", command: "serve" }).test.env).not.toHaveProperty("DATABASE_URL");
    } finally {
      process.env.DATABASE_URL = previous;
    }
  });

  it("npm test and the build script run through the disposable-database runner", () => {
    const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts.test).toBe("tsx scripts/test-db/run.ts");
    expect(pkg.scripts["test:isolated"]).toBe("tsx scripts/test-db/run.ts");
    expect(readFileSync(resolve(root, "test-and-build.sh"), "utf8")).not.toMatch(/npx vitest run/);
  });
});
