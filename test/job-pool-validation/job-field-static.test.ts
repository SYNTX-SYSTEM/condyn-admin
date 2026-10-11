/**
 * PINK static proofs for the owner's SYNTX Job Field (GRÜN, frontend/job-field, 434ef49) under the semantic governance
 * rules (JOB_POOL_CONNECTION.md §12): SG-1 no identity inference across sources, SG-4 no canonical relation or decision.
 * File set is path-pattern based (SyntxField | syntx-field | job-field | analysis-sources | useJobPoolSources), so it
 * binds as soon as the files exist and skips before.
 *
 * B-SYNTX-JOIN (GRÜN §13.5): `lib/career/job-pool/analysis-sources.ts` is the one permitted second read of the analysis
 * body (binding §1, §2.3, R12). It may read `documents[].identity.name` (source carriers) and the evidence of
 * `capabilities[]` and of `capabilityProposalProjection`; it must never decode the inferred organizations, roles, the
 * legacy `matching` or the `recommendations`. SG-1 is therefore split: the generic token rule for every field file and
 * an allow-list rule for the sources module.
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
const SOURCES_MODULE = "lib/career/job-pool/analysis-sources.ts";
const allFieldFiles = [...sources(join(root, "app")), ...sources(join(root, "lib"))].filter((file) => /SyntxField|syntx-field|JobField|job-field|analysis-sources|useJobPoolSources/.test(relative(root, file)));
const jobFieldFiles = allFieldFiles.filter((file) => relative(root, file) !== SOURCES_MODULE);
const sourcesModule = allFieldFiles.find((file) => relative(root, file) === SOURCES_MODULE) ?? null;
const importsOf = (text: string) => [...text.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);

describe("Job Field semantic governance (static)", () => {
  it.skipIf(jobFieldFiles.length === 0)("SG-1: Job Field files never read LLM-inferred organizations, roles or entity names of the analysis", () => {
    const offenders = jobFieldFiles.flatMap((file) => {
      const text = readFileSync(file, "utf8");
      // `presentation.roleMatches` is the pool body (SG-5); the LLM-inferred demo state is reached only through
      // the demo-data / ui-adapter shapes, `structured_data` or the entity grammar (`identity.name`).
      const hits = ["structured_data", "identity.name", "analysis.organizations", "analysis.roles", "activeData.roleMatches", "activeData.companyMatches", "demo-data", "ui-adapter", "organizationName.toLowerCase", "ROLE_IN_ORGANIZATION"].filter((token) => text.includes(token));
      return hits.length ? [`${relative(root, file)}: ${hits.join(", ")}`] : [];
    });
    expect(offenders).toEqual([]);
  });

  it.skipIf(sourcesModule === null)("SG-1 / B-SYNTX-JOIN: the analysis-sources module reads documents, capability evidence and the proposal projection only, never the inferred organizations, roles, matching or recommendations", () => {
    const text = readFileSync(sourcesModule as string, "utf8");
    const forbidden = ["organizations", "roles", "matching", "recommendations", "role_matches", "company_matches", "organizationName", "domains", "opportunities", "strategies", "organization_classes"];
    // Tokens are checked as property reads of the decoded body (`.x` / `["x"]` / `x:`), not inside comments.
    const code = text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    const offenders = forbidden.filter((token) => new RegExp(`(\\.${token}\\b|\\[\\s*["']${token}["']\\s*\\]|\\b${token}\\s*:)`).test(code));
    expect(offenders).toEqual([]);
    for (const required of ["inner.documents", "identity", "entity.evidence", "capabilityProposalProjection", "evidenceId", "exactQuote", "sourceDocumentId"]) expect(code).toContain(required);
    expect(code).not.toMatch(/toLowerCase|includes\(|indexOf\(|similarity|fuzzy|levenshtein/);
  });

  it.skipIf(allFieldFiles.length === 0)("SG-4: Job Field files import no relation producer, persistence, decision field or HR loop", () => {
    const forbidden = /relation|target\/|target-adapters|decision-core|decision-runtime|decision-adapters|hr-decision|human-decision|capability-core\/(repository|verification|convergence|discovery)|db\/client|persistence/;
    const offenders = allFieldFiles.flatMap((file) => importsOf(readFileSync(file, "utf8")).filter((spec) => forbidden.test(spec)).map((spec) => `${relative(root, file)} -> ${spec}`));
    expect(offenders).toEqual([]);
  });

  it.skipIf(allFieldFiles.length === 0)("SG-5/SG-6 vocabulary: the Job Field names its resonance as presentation and never a canonical relation id prefix", () => {
    // Copy lives in the SIL language block; the Job Field sources must carry no canonical relation id prefix.
    const copy = readFileSync(join(root, "lib/career/view-model/sil-language.ts"), "utf8");
    expect(copy).toMatch(/POOL RESONANCE \(PRESENTATION\)/);
    const text = allFieldFiles.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(text).not.toMatch(/\b(RRL|TSN|EIS|RCP)_[A-Z0-9]/);
  });

  it.skipIf(allFieldFiles.length === 0)("R1 / B-SYNTX-CLOSURE and binding §3: the field sources name no closure manifestation and no unsupported sign", () => {
    const text = allFieldFiles.map((file) => readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")).join("\n");
    expect(text).not.toMatch(/"(closed|closure|sealed|verified_seal|verified_capability|recommendation|fit)"/);
    expect(text).not.toMatch(/capabilityGaps|nextActions|aggregateScore\s*[}%]/);
  });
});
