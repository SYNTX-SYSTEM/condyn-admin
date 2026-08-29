import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { CommandCheck, CommandResult, OutputRules, VitestDiscoveryCheck } from "./types";

function discover(root: string, directory: string, matcher: RegExp): string[] {
  const found: string[] = [];
  for (const name of readdirSync(directory).sort()) {
    const full = join(directory, name);
    if (statSync(full).isDirectory()) found.push(...discover(root, full, matcher));
    else {
      const candidate = relative(root, full).split("\\").join("/");
      matcher.lastIndex = 0;
      if (matcher.test(candidate)) found.push(candidate);
    }
  }
  return found;
}

function applyOutputRules(output: string, rules: OutputRules | undefined): string[] {
  if (!rules) return [];
  const failures: string[] = [];
  for (const regex of rules.requiredRegex ?? []) if (!new RegExp(regex, "m").test(output)) failures.push(`required output regex did not match: ${regex}`);
  for (const regex of rules.forbiddenRegex ?? []) if (new RegExp(regex, "m").test(output)) failures.push(`forbidden output regex matched: ${regex}`);
  if (rules.diagnosticRegex && rules.expectedDiagnosticCount !== undefined) {
    const matches = output.match(new RegExp(rules.diagnosticRegex, "gm")) ?? [];
    if (matches.length !== rules.expectedDiagnosticCount) failures.push(`diagnostic count ${matches.length} did not equal ${rules.expectedDiagnosticCount}`);
  }
  for (const fragment of rules.forbiddenPathFragments ?? []) if (output.includes(fragment)) failures.push(`forbidden path fragment matched: ${fragment}`);
  return failures;
}

export function runCommandCheck(check: CommandCheck | VitestDiscoveryCheck, repositoryRoot: string, options: { execute?: boolean } = {}): CommandResult {
  let argv: string[];
  let discoveredFiles: string[] | undefined;
  const failures: string[] = [];
  if (check.kind === "vitest-discovery") {
    const matcher = new RegExp(check.fileRegex, "i");
    const root = join(repositoryRoot, check.root);
    discoveredFiles = discover(repositoryRoot, root, matcher).sort();
    if (discoveredFiles.length < check.minimumFiles) failures.push(`discovered ${discoveredFiles.length} files; expected at least ${check.minimumFiles}`);
    argv = ["npx", "vitest", "run", ...discoveredFiles];
  } else argv = check.argv;
  let stdout = ""; let stderr = ""; let exitCode: number | null = 0;
  if (options.execute !== false && failures.length === 0) {
    const result = spawnSync(argv[0], argv.slice(1), { cwd: repositoryRoot, encoding: "utf8", shell: false, maxBuffer: 64 * 1024 * 1024 });
    stdout = result.stdout ?? ""; stderr = result.stderr ?? ""; exitCode = result.status;
    if (result.error || exitCode === null) failures.push(`command execution failure: ${result.error?.message ?? "process returned no numeric exit status"}`);
    if (result.error) stderr += `${result.error.message}\n`;
    if (exitCode !== check.expectedExitCode && !(check.kind === "command" && check.allowNonZero)) failures.push(`exit code ${exitCode} did not equal ${check.expectedExitCode}`);
  }
  failures.push(...applyOutputRules(`${stdout}${stderr}`, check.outputRules));
  return { name: check.name, argv, exitCode, stdout, stderr, discoveredFiles, failures, passed: failures.length === 0 };
}
