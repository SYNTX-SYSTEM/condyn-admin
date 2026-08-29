import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { parsePhaseManifest } from "../../../scripts/decision-core/phase-gate/manifest";
import { runCommandCheck } from "../../../scripts/decision-core/phase-gate/command";
import { runGit } from "../../../scripts/decision-core/phase-gate/git";
import { sealPhase } from "../../../scripts/decision-core/phase-gate/seal";
import { verifyPhase } from "../../../scripts/decision-core/phase-gate/verify";
import type { PhaseManifest } from "../../../scripts/decision-core/phase-gate/types";

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function temporaryDirectory(name: string): string {
  const directory = mkdtempSync(join(tmpdir(), `condyn-phase-gate-${name}-`));
  temporaryDirectories.push(directory);
  return directory;
}

function git(directory: string, ...argv: string[]): string {
  return execFileSync("git", argv, { cwd: directory, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }, timeout: 10_000 }).trim();
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function createRepository(): { repository: string; remote: string; baseHead: string } {
  const repository = temporaryDirectory("repository");
  const remote = temporaryDirectory("remote");
  git(remote, "init", "--bare");
  git(repository, "init", "-b", "main");
  git(repository, "config", "user.email", "phase-gate@example.test");
  git(repository, "config", "user.name", "Phase Gate Test");
  git(repository, "config", "commit.gpgSign", "false");
  git(repository, "config", "tag.gpgSign", "false");
  git(repository, "config", "tag.forceSignAnnotated", "false");
  writeFileSync(join(repository, "allowed.txt"), "base\n");
  writeFileSync(join(repository, "frozen.txt"), "sealed\n");
  mkdirSync(join(repository, "test", "capability"), { recursive: true });
  writeFileSync(join(repository, "test", "capability", "adapter.test.ts"), "");
  git(repository, "add", ".");
  git(repository, "commit", "-m", "base");
  git(repository, "remote", "add", "origin", remote);
  git(repository, "push", "-u", "origin", "main");
  return { repository, remote, baseHead: git(repository, "rev-parse", "HEAD") };
}

function manifest(baseHead: string, overrides: Partial<PhaseManifest> = {}): PhaseManifest {
  return {
    schemaVersion: 1, id: "fixture", phase: "TEST", mode: "tooling", branch: "main", baseHead, remote: "origin", remoteBranch: "main",
    allowedChangedFiles: ["allowed.txt"], frozenHashes: [{ path: "frozen.txt", sha256: sha256("sealed\n") }], noDiffPaths: ["frozen.txt"], requiredAbsentPaths: ["repomix-output.xml"], requiredTags: [], absentTags: ["fixture-docs"], textChecks: [], commands: [], exactErrorSurfaces: [],
    seal: { enabled: true, commitMessage: "fixture seal", tag: "fixture-docs", tagMessage: "fixture tag" }, ...overrides,
  };
}

describe("Decision Core Phase Gate", () => {
  it("strictly validates manifests and repository-relative paths", () => {
    const valid = manifest("a".repeat(40));
    expect(parsePhaseManifest(valid)).toEqual(valid);
    expect(() => parsePhaseManifest({ ...valid, unknown: true })).toThrow(/unknown/i);
    expect(() => parsePhaseManifest({ ...valid, allowedChangedFiles: ["/absolute"] })).toThrow(/repository-relative/i);
    expect(() => parsePhaseManifest({ ...valid, allowedChangedFiles: ["../escape"] })).toThrow(/repository-relative/i);
  });

  it("collects exact changed scope, hashes, absent paths, text evidence, error surfaces, and failure evidence", () => {
    const { repository, baseHead } = createRepository();
    writeFileSync(join(repository, "allowed.txt"), "changed\n");
    writeFileSync(join(repository, "untracked.txt"), "surprise\n");
    writeFileSync(join(repository, "text.txt"), "REQUIRED\nERR_B\nERR_A\n");
    const evidencePath = join(temporaryDirectory("evidence"), "evidence.out");
    const result = verifyPhase(manifest(baseHead, { textChecks: [{ kind: "required-literal", paths: ["text.txt"], pattern: "REQUIRED" }, { kind: "forbidden-literal", paths: ["text.txt"], pattern: "FORBIDDEN" }], exactErrorSurfaces: [{ paths: ["text.txt"], regex: "ERR_[A-Z]+", expected: ["ERR_B", "ERR_A"] }] }), { repositoryRoot: repository, evidencePath });
    expect(result.exitCode).toBe(1);
    expect(result.changedFiles).toEqual(["allowed.txt", "text.txt", "untracked.txt"]);
    expect(result.failures.join("\n")).toMatch(/changed scope/i);
    expect(readFileSync(evidencePath, "utf8")).toContain("===== SUMMARY =====");
    expect(readFileSync(evidencePath, "utf8")).toContain("untracked.txt");
    const hashMismatch = verifyPhase(manifest(baseHead, { frozenHashes: [{ path: "frozen.txt", sha256: "0".repeat(64) }] }), { repositoryRoot: repository, evidencePath: join(temporaryDirectory("evidence"), "hash.out") });
    expect(hashMismatch.failures.join("\n")).toMatch(/frozen hash mismatch/i);
  });

  it("captures complete command output and scopes allowed nonzero diagnostics", () => {
    const directory = temporaryDirectory("command");
    const pass = runCommandCheck({ name: "diagnostics", kind: "command", argv: [process.execPath, "-e", "console.log('stdout'); console.error('TS2352 predecessor'); process.exit(1)"], expectedExitCode: 0, allowNonZero: true, outputRules: { diagnosticRegex: "TS\\d+", expectedDiagnosticCount: 1, forbiddenPathFragments: ["phase-gate"] } }, directory);
    expect(pass.passed).toBe(true);
    expect(pass.stdout).toContain("stdout"); expect(pass.stderr).toContain("TS2352"); expect(pass.argv).toEqual(expect.arrayContaining([process.execPath, "-e"]));
    const fail = runCommandCheck({ name: "forbidden diagnostic path", kind: "command", argv: [process.execPath, "-e", "console.error('phase-gate TS2352'); process.exit(1)"], expectedExitCode: 0, allowNonZero: true, outputRules: { diagnosticRegex: "TS\\d+", expectedDiagnosticCount: 1, forbiddenPathFragments: ["phase-gate"] } }, directory);
    expect(fail.passed).toBe(false); expect(fail.failures.join("\n")).toMatch(/forbidden path fragment/i);
    const missing = runCommandCheck({ name: "missing executable", kind: "command", argv: ["condyn-definitely-missing-executable"], expectedExitCode: 0, allowNonZero: true }, directory);
    expect(missing.passed).toBe(false); expect(missing.failures.join("\n")).toMatch(/execution failure/i);
  });

  it("uses one argv-based Git runner that preserves stdout, stderr, exit status, and execution errors", () => {
    const directory = temporaryDirectory("git-runner");
    const success = runGit(directory, ["--version"]);
    expect(success).toMatchObject({ ok: true, argv: ["git", "--version"], exitCode: 0 });
    expect(success.stdout).toMatch(/^git version /);
    const failure = runGit(directory, ["rev-parse", "--verify", "definitely-not-a-ref"]);
    expect(failure).toMatchObject({ ok: false, argv: ["git", "rev-parse", "--verify", "definitely-not-a-ref"], exitCode: 128 });
    expect(failure.stderr).toMatch(/not a git repository|needed a single revision|unknown revision|not a valid object name/i);
  });

  it("discovers vitest files deterministically", () => {
    const directory = temporaryDirectory("discovery");
    mkdirSync(join(directory, "test", "Capability", "nested"), { recursive: true });
    writeFileSync(join(directory, "test", "Capability", "nested", "z.test.ts"), ""); writeFileSync(join(directory, "test", "authority-adapter.test.ts"), ""); writeFileSync(join(directory, "test", "other.test.ts"), "");
    const result = runCommandCheck({ name: "discovery", kind: "vitest-discovery", root: "test", fileRegex: "(?:capability|authority-adapter).*\\.test\\.ts$", expectedExitCode: 0, minimumFiles: 2 }, directory, { execute: false });
    expect(result.discoveredFiles).toEqual(["test/Capability/nested/z.test.ts", "test/authority-adapter.test.ts"]);
  });

  it("is read-only during verify and rejects present required-absent paths", () => {
    const { repository, baseHead } = createRepository();
    writeFileSync(join(repository, "allowed.txt"), "changed\n"); writeFileSync(join(repository, "repomix-output.xml"), "present\n");
    const before = git(repository, "status", "--porcelain");
    const result = verifyPhase(manifest(baseHead), { repositoryRoot: repository, evidencePath: join(temporaryDirectory("evidence"), "verify.out") });
    expect(result.exitCode).toBe(1); expect(result.failures.join("\n")).toMatch(/required absent path exists/i); expect(git(repository, "status", "--porcelain")).toBe(before);
  });

  it("includes staged, unstaged, and untracked changes in changed-scope and no-diff checks", () => {
    const { repository, baseHead } = createRepository();
    writeFileSync(join(repository, "allowed.txt"), "staged\n");
    git(repository, "add", "allowed.txt");
    writeFileSync(join(repository, "frozen.txt"), "staged forbidden\n");
    git(repository, "add", "frozen.txt");
    writeFileSync(join(repository, "untracked.txt"), "untracked\n");
    const result = verifyPhase(manifest(baseHead), { repositoryRoot: repository, evidencePath: join(temporaryDirectory("evidence"), "staged-scope.out") });
    expect(result.changedFiles).toEqual(["allowed.txt", "frozen.txt", "untracked.txt"]);
    expect(result.failures.join("\n")).toMatch(/changed scope.*actual=.*frozen\.txt/i);
    expect(result.failures.join("\n")).toMatch(/noDiffPath.*frozen\.txt/i);
  });

  it("verify fails when only the remote branch drifts", () => {
    const { repository, remote, baseHead } = createRepository();
    const writer = temporaryDirectory("verify-remote-writer"); execFileSync("git", ["clone", "--branch", "main", remote, writer]); git(writer, "config", "user.email", "phase-gate@example.test"); git(writer, "config", "user.name", "Phase Gate Test"); git(writer, "config", "commit.gpgSign", "false"); writeFileSync(join(writer, "drift.txt"), "drift\n"); git(writer, "add", "drift.txt"); git(writer, "commit", "-m", "drift"); git(writer, "push", "origin", "main");
    const result = verifyPhase(manifest(baseHead, { allowedChangedFiles: [] }), { repositoryRoot: repository, evidencePath: join(temporaryDirectory("evidence"), "remote-drift.out") });
    expect(result.exitCode).toBe(1); expect(result.failures.join("\n")).toMatch(/remote branch/i); expect(git(repository, "rev-parse", "HEAD")).toBe(baseHead);
  });

  it("verify detects remote lightweight absent tags and accepts genuinely absent remote tags", () => {
    const tagged = createRepository(); git(tagged.repository, "-c", "tag.forceSignAnnotated=false", "-c", "tag.gpgSign=false", "tag", "fixture-docs", tagged.baseHead); git(tagged.repository, "push", "origin", "refs/tags/fixture-docs");
    const failure = verifyPhase(manifest(tagged.baseHead, { allowedChangedFiles: [] }), { repositoryRoot: tagged.repository, evidencePath: join(temporaryDirectory("evidence"), "lightweight.out") });
    expect(failure.exitCode).toBe(1); expect(failure.failures.join("\n")).toMatch(/tag must be absent/i);
    const absent = createRepository();
    expect(verifyPhase(manifest(absent.baseHead, { allowedChangedFiles: [] }), { repositoryRoot: absent.repository, evidencePath: join(temporaryDirectory("evidence"), "absent.out") }).exitCode).toBe(0);
  });

  it("seal without --execute performs no mutation and returns misuse status", () => {
    const { repository, baseHead } = createRepository(); writeFileSync(join(repository, "allowed.txt"), "changed\n");
    const result = sealPhase(manifest(baseHead), { repositoryRoot: repository, evidencePath: join(temporaryDirectory("evidence"), "dry.out"), execute: false });
    expect(result.exitCode).toBe(2); expect(git(repository, "rev-parse", "HEAD")).toBe(baseHead); expect(git(repository, "diff", "--cached", "--name-only")).toBe("");
  });

  it("seal stops before staging when verification fails", () => {
    const { repository, baseHead } = createRepository(); writeFileSync(join(repository, "allowed.txt"), "changed\n"); writeFileSync(join(repository, "surprise.txt"), "unexpected\n");
    const result = sealPhase(manifest(baseHead), { repositoryRoot: repository, evidencePath: join(temporaryDirectory("evidence"), "verification-failure.out"), execute: true });
    expect(result.exitCode).toBe(1); expect(git(repository, "rev-parse", "HEAD")).toBe(baseHead); expect(git(repository, "diff", "--cached", "--name-only")).toBe("");
  });

  it("seal rejects unexpected pre-staged files", () => {
    const { repository, baseHead } = createRepository(); writeFileSync(join(repository, "surprise.txt"), "unexpected\n"); git(repository, "add", "surprise.txt");
    const result = sealPhase(manifest(baseHead, { allowedChangedFiles: [] }), { repositoryRoot: repository, evidencePath: join(temporaryDirectory("evidence"), "prestaged.out"), execute: true });
    expect(result.exitCode).toBe(1); expect(result.failures.join("\n")).toMatch(/pre-staged/i); expect(git(repository, "rev-parse", "HEAD")).toBe(baseHead);
  });

  it("seal rejects remote branch drift", () => {
    const drift = createRepository(); writeFileSync(join(drift.repository, "allowed.txt"), "changed\n");
    const writer = temporaryDirectory("remote-writer"); execFileSync("git", ["clone", "--branch", "main", drift.remote, writer]); git(writer, "config", "user.email", "phase-gate@example.test"); git(writer, "config", "user.name", "Phase Gate Test"); git(writer, "config", "commit.gpgSign", "false"); writeFileSync(join(writer, "remote.txt"), "drift\n"); git(writer, "add", "remote.txt"); git(writer, "commit", "-m", "remote drift"); git(writer, "push", "origin", "main");
    const result = sealPhase(manifest(drift.baseHead), { repositoryRoot: drift.repository, evidencePath: join(temporaryDirectory("evidence"), "drift.out"), execute: true });
    expect(result.exitCode).toBe(1); expect(result.failures.join("\n")).toMatch(/remote branch.*baseHead/i); expect(git(drift.repository, "rev-parse", "HEAD")).toBe(drift.baseHead);
  });

  it("successful end-to-end seal stages exact files, commits, pushes, tags, and finishes clean", () => {
    const { repository, remote, baseHead } = createRepository(); writeFileSync(join(repository, "allowed.txt"), "changed\n");
    const sealed = sealPhase(manifest(baseHead), { repositoryRoot: repository, evidencePath: join(temporaryDirectory("evidence"), "seal.out"), execute: true });
    expect(sealed.exitCode).toBe(0); const commit = git(repository, "rev-parse", "HEAD");
    expect(git(repository, "rev-parse", "HEAD^")).toBe(baseHead); expect(git(repository, "show", "--format=", "--name-only", "HEAD")).toBe("allowed.txt"); expect(git(repository, "rev-parse", "fixture-docs^{}")).toBe(commit); expect(execFileSync("git", ["--git-dir", remote, "rev-parse", "refs/tags/fixture-docs^{}"], { encoding: "utf8" }).trim()).toBe(commit); expect(git(repository, "status", "--porcelain")).toBe("");
  });

  it("accepts a repeated successful seal only when its entire immutable state remains correct", () => {
    const { repository, baseHead } = createRepository(); writeFileSync(join(repository, "allowed.txt"), "changed\n");
    expect(sealPhase(manifest(baseHead), { repositoryRoot: repository, evidencePath: join(temporaryDirectory("evidence"), "seal.out"), execute: true }).exitCode).toBe(0);
    expect(sealPhase(manifest(baseHead), { repositoryRoot: repository, evidencePath: join(temporaryDirectory("evidence"), "repeat.out"), execute: true }).exitCode).toBe(0);
  });

  it("rejects an otherwise matching repeated seal when its remote tag is missing", () => {
    const sealed = createRepository(); writeFileSync(join(sealed.repository, "allowed.txt"), "changed\n");
    expect(sealPhase(manifest(sealed.baseHead), { repositoryRoot: sealed.repository, evidencePath: join(temporaryDirectory("evidence"), "seal.out"), execute: true }).exitCode).toBe(0);
    execFileSync("git", ["--git-dir", sealed.remote, "update-ref", "-d", "refs/tags/fixture-docs"]);
    const result = sealPhase(manifest(sealed.baseHead), { repositoryRoot: sealed.repository, evidencePath: join(temporaryDirectory("evidence"), "missing-remote-tag.out"), execute: true });
    expect(result.exitCode).toBe(1); expect(result.failures.join("\n")).toMatch(/idempotent seal state/i); expect(result.evidence).toMatch(/remote tag base: ABSENT/);
  });

  it("rejects an idempotent-looking seal with the wrong commit parent", () => {
    const fixture = createRepository();
    writeFileSync(join(fixture.repository, "intervening.txt"), "changed\n"); git(fixture.repository, "add", "intervening.txt"); git(fixture.repository, "commit", "-m", "intervening");
    writeFileSync(join(fixture.repository, "wrong-parent.txt"), "changed\n"); git(fixture.repository, "add", "wrong-parent.txt"); git(fixture.repository, "commit", "-m", "wrong parent");
    const head = git(fixture.repository, "rev-parse", "HEAD"); git(fixture.repository, "tag", "-a", "fixture-docs", "-m", "fixture tag", head); git(fixture.repository, "push", "origin", "HEAD:refs/heads/main", "refs/tags/fixture-docs");
    const result = sealPhase(manifest(fixture.baseHead, { allowedChangedFiles: ["wrong-parent.txt"] }), { repositoryRoot: fixture.repository, evidencePath: join(temporaryDirectory("evidence"), "wrong-parent.out"), execute: true });
    expect(result.exitCode).toBe(1); expect(result.failures.join("\n")).toMatch(/idempotent seal state/i); expect(result.evidence).toMatch(/parent:/);
  });

  it("rejects an idempotent-looking seal with a wrong committed scope", () => {
    const fixture = createRepository();
    writeFileSync(join(fixture.repository, "wrong-scope.txt"), "changed\n"); git(fixture.repository, "add", "wrong-scope.txt"); git(fixture.repository, "commit", "-m", "wrong scope");
    const head = git(fixture.repository, "rev-parse", "HEAD"); git(fixture.repository, "tag", "-a", "fixture-docs", "-m", "fixture tag", head); git(fixture.repository, "push", "origin", "HEAD:refs/heads/main", "refs/tags/fixture-docs");
    const result = sealPhase(manifest(fixture.baseHead), { repositoryRoot: fixture.repository, evidencePath: join(temporaryDirectory("evidence"), "wrong-scope.out"), execute: true });
    expect(result.exitCode).toBe(1); expect(result.failures.join("\n")).toMatch(/idempotent seal state/i); expect(result.evidence).toMatch(/commit scope: wrong-scope\.txt/);
  });

  it("rejects a lightweight existing seal tag even when it points to the expected commit", () => {
    const fixture = createRepository();
    writeFileSync(join(fixture.repository, "allowed.txt"), "changed\n"); git(fixture.repository, "add", "allowed.txt"); git(fixture.repository, "commit", "-m", "fixture seal");
    const head = git(fixture.repository, "rev-parse", "HEAD"); git(fixture.repository, "-c", "tag.gpgSign=false", "-c", "tag.forceSignAnnotated=false", "tag", "fixture-docs", head); git(fixture.repository, "push", "origin", "HEAD:refs/heads/main", "refs/tags/fixture-docs");
    const result = sealPhase(manifest(fixture.baseHead), { repositoryRoot: fixture.repository, evidencePath: join(temporaryDirectory("evidence"), "lightweight-idempotent.out"), execute: true });
    expect(result.exitCode).toBe(1); expect(result.failures.join("\n")).toMatch(/idempotent seal state/i); expect(result.evidence).toMatch(/local tag type: commit/);
  });

  it("creates an annotated tag with Git signing explicitly disabled", () => {
    const { repository, baseHead } = createRepository(); writeFileSync(join(repository, "allowed.txt"), "changed\n"); git(repository, "config", "tag.gpgSign", "true");
    const result = sealPhase(manifest(baseHead), { repositoryRoot: repository, evidencePath: join(temporaryDirectory("evidence"), "unsigned-annotated.out"), execute: true });
    expect(result.exitCode).toBe(0); expect(git(repository, "cat-file", "-t", "refs/tags/fixture-docs")).toBe("tag");
  });

  it("records complete resulting repository state after a post-commit tag push failure", () => {
    const { repository, remote, baseHead } = createRepository(); writeFileSync(join(repository, "allowed.txt"), "changed\n");
    const hook = join(remote, "hooks", "pre-receive"); writeFileSync(hook, "#!/bin/sh\nwhile read old new ref; do case $ref in refs/tags/*) exit 1;; esac; done\nexit 0\n"); chmodSync(hook, 0o755);
    const result = sealPhase(manifest(baseHead), { repositoryRoot: repository, evidencePath: join(temporaryDirectory("evidence"), "tag-push-failure.out"), execute: true });
    expect(result.exitCode).toBe(1); expect(result.failures.join("\n")).toMatch(/tag push failed/i); expect(result.evidence).toContain("===== POST-COMMIT REPOSITORY STATE ====="); expect(result.evidence).toMatch(/HEAD: [0-9a-f]{40}/); expect(result.evidence).toContain("worktree:");
  });

  it("already-existing wrong tag is rejected without force-update or deletion", () => {
    const wrong = createRepository(); writeFileSync(join(wrong.repository, "allowed.txt"), "changed\n"); git(wrong.repository, "tag", "-a", "fixture-docs", "-m", "wrong", wrong.baseHead);
    const rejected = sealPhase(manifest(wrong.baseHead), { repositoryRoot: wrong.repository, evidencePath: join(temporaryDirectory("evidence"), "wrong.out"), execute: true }); expect(rejected.exitCode).toBe(1); expect(git(wrong.repository, "rev-parse", "HEAD")).toBe(wrong.baseHead);
  });

  it("sealer contains no force push, force tag, reset --hard, git clean, or automatic rollback path", () => {
    const source = readFileSync(join(process.cwd(), "scripts/decision-core/phase-gate/seal.ts"), "utf8");
    expect(source).not.toContain("--force");
    expect(source).not.toMatch(/tag", "-f|reset", "--hard|git", \["clean/);
    expect(source).not.toMatch(/rollback/i);
  });
});
