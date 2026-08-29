import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { tmpdir } from "node:os";
import { runCommandCheck } from "./command";
import { runGit, type GitResult } from "./git";
import type { ExactErrorSurface, PhaseManifest, TextCheck, VerifyOptions, VerifyResult } from "./types";

function filesUnder(root: string, path: string): string[] {
  const full = join(root, path);
  if (!existsSync(full)) return [];
  if (!statSync(full).isDirectory()) return [path];
  const result: string[] = [];
  for (const entry of readdirSync(full).sort()) result.push(...filesUnder(root, join(path, entry)));
  return result;
}

function textMatches(root: string, check: TextCheck): Array<{ path: string; line: number; content: string }> {
  const matcher = check.kind.endsWith("regex") ? new RegExp(check.pattern, "g") : undefined;
  const matches: Array<{ path: string; line: number; content: string }> = [];
  for (const path of check.paths.flatMap((entry) => filesUnder(root, entry))) {
    const lines = readFileSync(join(root, path), "utf8").split(/\r?\n/);
    lines.forEach((content, index) => {
      const found = matcher ? (matcher.lastIndex = 0, matcher.test(content)) : content.includes(check.pattern);
      if (found) matches.push({ path, line: index + 1, content });
    });
  }
  return matches;
}

function errorMatches(root: string, check: ExactErrorSurface): string[] {
  const matcher = new RegExp(check.regex, "g"); const matches = new Set<string>();
  for (const path of check.paths.flatMap((entry) => filesUnder(root, entry))) {
    for (const found of readFileSync(join(root, path), "utf8").matchAll(matcher)) matches.add(found[0]);
  }
  return [...matches].sort();
}

function remoteRef(root: string, remote: string, ref: string): { id?: string; result: GitResult } {
  const result = runGit(root, ref.startsWith("refs/tags/") ? ["ls-remote", "--tags", remote, ref] : ["ls-remote", remote, ref]);
  return { id: result.ok && result.output ? result.output.split(/\s+/)[0] : undefined, result };
}

function evidenceSection(name: string, body: string): string { return `===== ${name} =====\n${body || "(none)"}\n`; }

export function verifyPhase(manifest: PhaseManifest, options: VerifyOptions): VerifyResult {
  const root = options.repositoryRoot;
  const evidencePath = options.evidencePath ?? join(tmpdir(), `condyn-${manifest.id}-verify.out`);
  const failures: string[] = []; const sections: string[] = [];
  const branch = runGit(root, ["branch", "--show-current"]); const head = runGit(root, ["rev-parse", "HEAD"]);
  sections.push(evidenceSection("MANIFEST", JSON.stringify(manifest, null, 2)));
  sections.push(evidenceSection("REPOSITORY STATE", `branch: ${branch.output}\nHEAD: ${head.output}\nbaseHead: ${manifest.baseHead}`));
  if (!branch.ok || branch.output !== manifest.branch) failures.push(`branch ${branch.output || "<unknown>"} did not equal ${manifest.branch}`);
  if (!head.ok || head.output !== manifest.baseHead) failures.push(`HEAD ${head.output || "<unknown>"} did not equal baseHead ${manifest.baseHead}`);
  if (manifest.remote && manifest.remoteBranch) {
    const remote = remoteRef(root, manifest.remote, `refs/heads/${manifest.remoteBranch}`);
    sections.push(evidenceSection("REMOTE BRANCH", `remote: ${manifest.remote}\nremoteBranch: ${manifest.remoteBranch}\nremote branch HEAD: ${remote.id ?? "ABSENT"}\nexpected baseHead: ${manifest.baseHead}\n${remote.id === manifest.baseHead ? "PASS" : "FAIL"}\nargv: ${JSON.stringify(remote.result.argv)}\nexit code: ${remote.result.exitCode}\nstdout:\n${remote.result.stdout}\nstderr:\n${remote.result.stderr}`));
    if (remote.id !== manifest.baseHead) failures.push(`remote branch ${manifest.remote}/${manifest.remoteBranch} did not equal baseHead ${manifest.baseHead}`);
  }

  const staged = runGit(root, ["diff", "--cached", "--name-only"]).output.split(/\r?\n/).filter(Boolean);
  const unstaged = runGit(root, ["diff", "--name-only"]).output.split(/\r?\n/).filter(Boolean);
  const untracked = runGit(root, ["ls-files", "--others", "--exclude-standard"]).output.split(/\r?\n/).filter(Boolean);
  const changedFiles = [...new Set([...staged, ...unstaged, ...untracked])].sort();
  const allowed = [...manifest.allowedChangedFiles].sort();
  sections.push(evidenceSection("CHANGED SCOPE", `staged:\n${staged.join("\n")}\nunstaged:\n${unstaged.join("\n")}\nuntracked:\n${untracked.join("\n")}\nnormalized:\n${changedFiles.join("\n")}\nallowed:\n${allowed.join("\n")}`));
  if (JSON.stringify(changedFiles) !== JSON.stringify(allowed)) failures.push(`changed scope did not equal allowedChangedFiles: actual=${JSON.stringify(changedFiles)} expected=${JSON.stringify(allowed)}`);

  const hashRows: string[] = [];
  for (const item of manifest.frozenHashes) {
    const full = join(root, item.path);
    if (!existsSync(full)) { failures.push(`frozen hash file missing: ${item.path}`); hashRows.push(`FAIL missing ${item.path}`); continue; }
    const actual = createHash("sha256").update(readFileSync(full)).digest("hex");
    hashRows.push(`${actual}  ${item.path}`);
    if (actual !== item.sha256) failures.push(`frozen hash mismatch: ${item.path} expected ${item.sha256} actual ${actual}`);
  }
  sections.push(evidenceSection("FROZEN HASHES", hashRows.join("\n")));

  const noDiffRows: string[] = [];
  for (const path of manifest.noDiffPaths) {
    const contains = (candidate: string) => candidate === path || candidate.startsWith(`${path}/`);
    const changed = { staged: staged.filter(contains), unstaged: unstaged.filter(contains), untracked: untracked.filter(contains) };
    const rows = Object.entries(changed).flatMap(([state, paths]) => paths.map((changedPath) => `${state}: ${changedPath}`));
    noDiffRows.push(`${path}: ${rows.join(", ") || "PASS"}`);
    if (rows.length > 0) failures.push(`noDiffPath changed: ${path}`);
  }
  sections.push(evidenceSection("NO-DIFF PATHS", noDiffRows.join("\n")));
  const absentRows: string[] = [];
  for (const path of manifest.requiredAbsentPaths) { const present = existsSync(join(root, path)); absentRows.push(`${path}: ${present ? "PRESENT" : "ABSENT"}`); if (present) failures.push(`required absent path exists: ${path}`); }
  sections.push(evidenceSection("REQUIRED ABSENT PATHS", absentRows.join("\n")));

  const tagRows: string[] = [];
  for (const tag of manifest.requiredTags) {
    const local = runGit(root, ["rev-parse", "-q", "--verify", `refs/tags/${tag.name}^{}`]); const base = manifest.remote ? remoteRef(root, manifest.remote, `refs/tags/${tag.name}`) : undefined; const peeled = manifest.remote ? remoteRef(root, manifest.remote, `refs/tags/${tag.name}^{}`) : undefined;
    tagRows.push(`${tag.name}: local=${local.output || "ABSENT"}; remote base=${base?.id ?? "NOT CONFIGURED/ABSENT"}; remote peeled=${peeled?.id ?? "NOT CONFIGURED/ABSENT"}; expected=${tag.peeledCommit}`);
    if (!local.ok || local.output !== tag.peeledCommit) failures.push(`required local tag mismatch: ${tag.name}`);
    if (manifest.remote && (!base?.id || !peeled?.id || peeled.id !== tag.peeledCommit)) failures.push(`required remote annotated tag mismatch: ${tag.name}`);
  }
  for (const tag of manifest.absentTags) {
    const local = runGit(root, ["show-ref", "--verify", "--quiet", `refs/tags/${tag}`]); const remote = manifest.remote ? remoteRef(root, manifest.remote, `refs/tags/${tag}`) : undefined;
    tagRows.push(`${tag}: local=${local.ok ? "PRESENT" : "ABSENT"}; remote=${remote?.id ?? "NOT CONFIGURED/ABSENT"}; expected=ABSENT`);
    if (local.ok || remote?.id) failures.push(`tag must be absent: ${tag}`);
  }
  sections.push(evidenceSection("TAG STATE", tagRows.join("\n")));

  const textRows: string[] = [];
  for (const check of manifest.textChecks) {
    const matches = textMatches(root, check); const required = check.kind.startsWith("required"); const pass = required ? matches.length > 0 : matches.length === 0;
    textRows.push(`${pass ? "PASS" : "FAIL"} ${check.kind} ${JSON.stringify(check.pattern)}\n${matches.map((match) => `${match.path}:${match.line}: ${match.content}`).join("\n") || "(no matches)"}`);
    if (!pass) failures.push(`text check failed: ${check.kind} ${check.pattern}`);
  }
  sections.push(evidenceSection("TEXT CHECKS", textRows.join("\n")));

  const errorRows: string[] = [];
  for (const check of manifest.exactErrorSurfaces) {
    const actual = errorMatches(root, check); const expected = [...check.expected].sort(); const pass = JSON.stringify(actual) === JSON.stringify(expected);
    errorRows.push(`${pass ? "PASS" : "FAIL"} regex=${check.regex}\nactual=${JSON.stringify(actual)}\nexpected=${JSON.stringify(expected)}`);
    if (!pass) failures.push(`exact error surface mismatch for ${check.regex}`);
  }
  sections.push(evidenceSection("ERROR SURFACES", errorRows.join("\n")));

  for (const check of manifest.commands) {
    const result = runCommandCheck(check, root); sections.push(evidenceSection(`COMMAND: ${check.name}`, `argv: ${JSON.stringify(result.argv)}\nexit code: ${result.exitCode}\ndiscovered files:\n${result.discoveredFiles?.join("\n") ?? "(n/a)"}\nfailures:\n${result.failures.join("\n") || "(none)"}\n----- STDOUT -----\n${result.stdout}\n----- STDERR -----\n${result.stderr}`));
    failures.push(...result.failures.map((failure) => `command ${check.name}: ${failure}`));
  }
  const final = runGit(root, ["status", "--short", "--untracked-files=all"]); sections.push(evidenceSection("FINAL WORKTREE", final.output));
  const passed = failures.length === 0; const summary = `MECHANICAL VERIFICATION: ${passed ? "PASS" : "FAIL"}\nmanifest: ${manifest.id}\nfailures:\n${failures.join("\n") || "(none)"}`;
  const evidence = `${summary}\n\n${sections.join("\n")}\n${evidenceSection("SUMMARY", summary)}`;
  writeFileSync(evidencePath, evidence);
  return { exitCode: passed ? 0 : 1, passed, failures, changedFiles, evidencePath, evidence };
}
