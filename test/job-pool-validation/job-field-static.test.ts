/**
 * PINK static proofs for the owner's Job Field (GRÜN, frontend/job-field) under the semantic governance rules
 * (JOB_POOL_CONNECTION.md §12): SG-1 no identity inference across sources, SG-4 no canonical relation or decision.
 * File set is path-pattern based (JobField | job-field), so it binds as soon as the files exist and skips before.
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
    if (entry === "node_modules" || entry === ".next") continue;
    if (statSync(full).isDirectory()) out.push(...sources(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}
const jobFieldFiles = [...sources(join(root, "app")), ...sources(join(root, "lib"))].filter((file) => /JobField|job-field/.test(relative(root, file)));
const importsOf = (text: string) => [...text.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);

describe("Job Field semantic governance (static)", () => {
  it.skipIf(jobFieldFiles.length === 0)("SG-1: Job Field files never read LLM-inferred organizations, roles or entity names of the analysis", () => {
    const offenders = jobFieldFiles.flatMap((file) => {
      const text = readFileSync(file, "utf8");
      const hits = ["structured_data", "identity.name", "analysis.organizations", "analysis.roles", "companyMatches", "roleMatches", "organizationName.toLowerCase", "ROLE_IN_ORGANIZATION"].filter((token) => text.includes(token));
      return hits.length ? [`${relative(root, file)}: ${hits.join(", ")}`] : [];
    });
    expect(offenders).toEqual([]);
  });

  it.skipIf(jobFieldFiles.length === 0)("SG-4: Job Field files import no relation producer, persistence, decision field or HR loop", () => {
    const forbidden = /relation|target\/|target-adapters|decision-core|decision-runtime|decision-adapters|hr-decision|human-decision|capability-core\/(repository|verification|convergence|discovery)|db\/client|persistence/;
    const offenders = jobFieldFiles.flatMap((file) => importsOf(readFileSync(file, "utf8")).filter((spec) => forbidden.test(spec)).map((spec) => `${relative(root, file)} -> ${spec}`));
    expect(offenders).toEqual([]);
  });

  it.skipIf(jobFieldFiles.length === 0)("SG-5/SG-6 vocabulary: the Job Field names its resonance as presentation and never a canonical relation id prefix", () => {
    const text = jobFieldFiles.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(text).toMatch(/POOL RESONANCE \(PRESENTATION\)/);
    expect(text).not.toMatch(/\b(RRL|TSN|EIS|RCP)_[A-Z0-9]/);
  });
});
