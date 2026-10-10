/**
 * PINK preservation proof (JOB_POOL_CONNECTION.md §2): the three layers are separated and no
 * edge leads from the Job Pool connection into the governed decision layer, nor from the HR
 * Decision Looper into the Job Pool module. Static import analysis over the source tree.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function sources(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sources(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

function importsOf(file: string): string[] {
  const text = readFileSync(file, "utf8");
  return [...text.matchAll(/from\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)|require\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1] ?? m[2] ?? m[3]);
}

const jobPoolModule = join(root, "lib/career/job-pool");
const jobPoolRoutes = join(root, "app/api/career/job-pools");
const hrLoopModule = join(root, "lib/career/hr-decision-loop");
const matchingModule = join(root, "lib/career/matching");

/** Governed decision layer (D) and canonical decision carriers that layer P/C must never reach. */
const decisionLayerPattern = /hr-decision-loop|decision-core|decision-runtime|hr-decision-context|human-decision-admission|decision-context-decision-revision-binding|career\/decisions|decision-adapters/;

describe("Job Pool connection: layer separation (preservation)", () => {
  const jobPoolFiles = [...sources(jobPoolModule), ...sources(jobPoolRoutes)];

  it.skipIf(jobPoolFiles.length === 0)("layer C/P sources import nothing from the governed decision layer D", () => {
    const violations = jobPoolFiles.flatMap((file) => importsOf(file).filter((spec) => decisionLayerPattern.test(spec)).map((spec) => `${relative(root, file)} -> ${spec}`));
    expect(violations).toEqual([]);
  });

  it.skipIf(jobPoolFiles.length === 0)("layer C/P sources name no DCR, DAR or DCTXREV producer", () => {
    const hits = jobPoolFiles.flatMap((file) => {
      const text = readFileSync(file, "utf8");
      return /createHumanDecisionRecord|produceAndPersistHumanDecision|declareHumanDecision|CareerDecisionContextRevision|buildHrDecisionContextDraftInput/.test(text) ? [relative(root, file)] : [];
    });
    expect(hits).toEqual([]);
  });

  it("the HR Decision Looper and the legacy matchers import nothing from the Job Pool module", () => {
    const files = [...sources(hrLoopModule), ...sources(matchingModule)];
    expect(files.length).toBeGreaterThan(0);
    const violations = files.flatMap((file) => importsOf(file).filter((spec) => /job-pool/.test(spec)).map((spec) => `${relative(root, file)} -> ${spec}`));
    expect(violations).toEqual([]);
  });

  it("the HR Decision Loop routes are byte-identical to their recorded carrier-only form (no Job Pool edge)", () => {
    const routes = sources(join(root, "app/api/career/hr-decision-loop"));
    expect(routes.length).toBe(3);
    for (const route of routes) {
      expect(readFileSync(route, "utf8")).not.toMatch(/job-pool|matching|JobPool/);
    }
  });
});
