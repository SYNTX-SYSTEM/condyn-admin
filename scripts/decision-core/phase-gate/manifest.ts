import { z } from "zod";
import type { PhaseManifest } from "./types";

const relativePath = z.string().min(1).refine(
  (value) => !value.startsWith("/") && !value.split("/").includes("..") && value !== ".",
  "path must be repository-relative and must not escape through ..",
);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/i);
const outputRules = z.object({
  forbiddenRegex: z.array(z.string()).optional(), requiredRegex: z.array(z.string()).optional(), diagnosticRegex: z.string().optional(),
  expectedDiagnosticCount: z.number().int().nonnegative().optional(), forbiddenPathFragments: z.array(z.string()).optional(),
}).strict();
const command = z.object({ name: z.string().min(1), kind: z.literal("command"), argv: z.array(z.string()).min(1), expectedExitCode: z.number().int(), allowNonZero: z.boolean().optional(), outputRules: outputRules.optional() }).strict();
const discovery = z.object({ name: z.string().min(1), kind: z.literal("vitest-discovery"), root: relativePath, fileRegex: z.string(), expectedExitCode: z.number().int(), minimumFiles: z.number().int().nonnegative(), outputRules: outputRules.optional() }).strict();
const schema = z.object({
  schemaVersion: z.literal(1), id: z.string().min(1), phase: z.string().min(1), mode: z.enum(["implementation", "documentation", "tooling"]), branch: z.string().min(1), baseHead: z.string().regex(/^[0-9a-f]{40}$/i),
  remote: z.string().min(1).optional(), remoteBranch: z.string().min(1).optional(), allowedChangedFiles: z.array(relativePath), frozenHashes: z.array(z.object({ path: relativePath, sha256 }).strict()), noDiffPaths: z.array(relativePath), requiredAbsentPaths: z.array(relativePath),
  requiredTags: z.array(z.object({ name: z.string().min(1), peeledCommit: z.string().regex(/^[0-9a-f]{40}$/i) }).strict()), absentTags: z.array(z.string().min(1)), textChecks: z.array(z.object({ kind: z.enum(["required-literal", "forbidden-literal", "required-regex", "forbidden-regex"]), paths: z.array(relativePath).min(1), pattern: z.string() }).strict()),
  commands: z.array(z.discriminatedUnion("kind", [command, discovery])), exactErrorSurfaces: z.array(z.object({ paths: z.array(relativePath).min(1), regex: z.string(), expected: z.array(z.string()) }).strict()),
  seal: z.object({ enabled: z.boolean(), commitMessage: z.string().min(1), tag: z.string().min(1), tagMessage: z.string().min(1) }).strict(),
}).strict();

export function parsePhaseManifest(value: unknown): PhaseManifest {
  return schema.parse(value) as PhaseManifest;
}
