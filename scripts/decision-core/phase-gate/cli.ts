import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parsePhaseManifest } from "./manifest";
import { sealPhase } from "./seal";
import { verifyPhase } from "./verify";

function usage(): never { console.error("usage: phase:verify <manifest.json> [--evidence <path>] | phase:seal <manifest.json> --execute [--evidence <path>]"); process.exit(2); }
const [operation, manifestPath, ...rest] = process.argv.slice(2);
if ((operation !== "verify" && operation !== "seal") || !manifestPath) usage();
const evidenceIndex = rest.indexOf("--evidence"); const evidencePath = evidenceIndex >= 0 ? resolve(rest[evidenceIndex + 1] ?? "") : undefined;
if (evidenceIndex >= 0 && !rest[evidenceIndex + 1]) usage();
try {
  const manifest = parsePhaseManifest(JSON.parse(readFileSync(resolve(manifestPath), "utf8")));
  const result = operation === "verify" ? verifyPhase(manifest, { repositoryRoot: process.cwd(), evidencePath }) : sealPhase(manifest, { repositoryRoot: process.cwd(), evidencePath, execute: rest.includes("--execute") });
  console.log(`evidence: ${result.evidencePath}`); console.log(result.evidence.split("\n").slice(0, 5).join("\n")); process.exit(result.exitCode);
} catch (error) { console.error(`phase gate misuse: ${error instanceof Error ? error.message : String(error)}`); process.exit(2); }
