import { join } from "node:path";
import { tmpdir } from "node:os";
import { writeFileSync } from "node:fs";
import { verifyPhase } from "./verify";
import { runGit, type GitResult } from "./git";
import type { PhaseManifest, SealOptions, SealResult } from "./types";

function section(name: string, body: string): string { return `===== ${name} =====\n${body || "(none)"}\n`; }
function tagCommit(root: string, tag: string): string | undefined { const result = runGit(root, ["rev-parse", "-q", "--verify", `refs/tags/${tag}^{}`]); return result.ok ? result.output : undefined; }
function remoteHead(root: string, remote: string, branch: string): string | undefined { const result = runGit(root, ["ls-remote", remote, `refs/heads/${branch}`]); return result.ok && result.output ? result.output.split(/\s+/)[0] : undefined; }
function remoteTag(root: string, remote: string, tag: string): string | undefined { const result = runGit(root, ["ls-remote", "--tags", remote, `refs/tags/${tag}^{}`]); return result.ok && result.output ? result.output.split(/\s+/)[0] : undefined; }
function remoteTagBase(root: string, remote: string, tag: string): string | undefined { const result = runGit(root, ["ls-remote", "--tags", remote, `refs/tags/${tag}`]); return result.ok && result.output ? result.output.split(/\s+/)[0] : undefined; }
function gitLog(result: GitResult): string { return `argv: ${JSON.stringify(result.argv)}\nexit code: ${result.exitCode}\ntimed out: ${result.timedOut}\nerror: ${result.error ?? "(none)"}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`; }

export function sealPhase(manifest: PhaseManifest, options: SealOptions): SealResult {
  const evidencePath = options.evidencePath ?? join(tmpdir(), `condyn-${manifest.id}-seal.out`);
  const logs: string[] = []; const failures: string[] = []; let committed = false; let postCommitStateRecorded = false;
  const recordPostCommitState = (): void => {
    if (postCommitStateRecorded) return;
    postCommitStateRecorded = true;
    const root = options.repositoryRoot; const tag = manifest.seal.tag;
    const branch = runGit(root, ["branch", "--show-current"]); const head = runGit(root, ["rev-parse", "HEAD"]); const parent = runGit(root, ["rev-parse", "HEAD^"]);
    const worktree = runGit(root, ["status", "--porcelain=v1", "--branch", "--untracked-files=all"]); const staged = runGit(root, ["diff", "--cached", "--name-status"]); const unstaged = runGit(root, ["diff", "--name-status"]); const untracked = runGit(root, ["ls-files", "--others", "--exclude-standard"]);
    const scope = runGit(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"]); const tagType = runGit(root, ["cat-file", "-t", `refs/tags/${tag}`]);
    const remoteBranch = manifest.remote ? remoteHead(root, manifest.remote, manifest.remoteBranch ?? manifest.branch) : undefined; const remoteBase = manifest.remote ? remoteTagBase(root, manifest.remote, tag) : undefined; const remotePeeled = manifest.remote ? remoteTag(root, manifest.remote, tag) : undefined;
    logs.push(section("POST-COMMIT REPOSITORY STATE", `branch: ${branch.output || "UNKNOWN"}\nHEAD: ${head.output || "UNKNOWN"}\nparent: ${parent.output || "UNKNOWN"}\ncommit scope:\n${scope.output || "(none)"}\nworktree:\n${worktree.output || "clean"}\nstaged:\n${staged.output || "(none)"}\nunstaged:\n${unstaged.output || "(none)"}\nuntracked:\n${untracked.output || "(none)"}\nlocal tag type: ${tagType.output || "ABSENT"}\nlocal tag peeled: ${tagCommit(root, tag) ?? "ABSENT"}\nremote branch: ${remoteBranch ?? "ABSENT"}\nremote tag base: ${remoteBase ?? "ABSENT"}\nremote tag peeled: ${remotePeeled ?? "ABSENT"}`));
  };
  const finish = (exitCode: 0 | 1 | 2, passed: boolean): SealResult => {
    if (committed && !passed) recordPostCommitState();
    const summary = `MECHANICAL SEALING: ${passed ? "PASS" : "FAIL"}\nmanifest: ${manifest.id}\nfailures:\n${failures.join("\n") || "(none)"}`;
    const evidence = `${summary}\n\n${logs.join("\n")}\n${section("SUMMARY", summary)}`; writeFileSync(evidencePath, evidence); return { exitCode, passed, failures, evidencePath, evidence };
  };
  if (!options.execute) { failures.push("execution approval is required; pass --execute"); logs.push(section("SEAL", "No Git mutation attempted.")); return finish(2, false); }
  if (!manifest.seal.enabled) { failures.push("sealing is disabled by manifest"); return finish(2, false); }

  const root = options.repositoryRoot; const head = runGit(root, ["rev-parse", "HEAD"]).output; const existingTag = tagCommit(root, manifest.seal.tag);
  const clean = runGit(root, ["status", "--porcelain", "--untracked-files=all"]).output;
  if (head !== manifest.baseHead && manifest.remote && existingTag === head && !clean) {
    const localType = runGit(root, ["cat-file", "-t", `refs/tags/${manifest.seal.tag}`]).output;
    const parent = runGit(root, ["rev-parse", "HEAD^"]).output;
    const scope = runGit(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"]).output.split(/\r?\n/).filter(Boolean).sort();
    const noDiffChanged = manifest.noDiffPaths.filter((path) => runGit(root, ["diff", "--name-only", `${manifest.baseHead}..${head}`, "--", path]).output);
    const remoteBranch = remoteHead(root, manifest.remote, manifest.remoteBranch ?? manifest.branch); const remoteBase = remoteTagBase(root, manifest.remote, manifest.seal.tag); const remotePeeled = remoteTag(root, manifest.remote, manifest.seal.tag);
    logs.push(section("IDEMPOTENT STATE", `HEAD: ${head}\nparent: ${parent}\nlocal tag: ${existingTag ?? "ABSENT"}\nlocal tag type: ${localType || "ABSENT"}\nremote branch: ${remoteBranch ?? "ABSENT"}\nremote tag base: ${remoteBase ?? "ABSENT"}\nremote tag peeled: ${remotePeeled ?? "ABSENT"}\ncommit scope: ${scope.join("\n")}\nnoDiff changed: ${noDiffChanged.join(",") || "(none)"}\nworktree: ${clean || "clean"}`));
    if (parent === manifest.baseHead && JSON.stringify(scope) === JSON.stringify([...manifest.allowedChangedFiles].sort()) && noDiffChanged.length === 0 && localType === "tag" && remoteBranch === head && remoteBase && remotePeeled === head) return finish(0, true);
    failures.push("idempotent seal state failed complete validation"); return finish(1, false);
  }

  const preStaged = runGit(root, ["diff", "--cached", "--name-only"]).output;
  logs.push(section("PRE-STAGED SCOPE", preStaged));
  if (preStaged) { failures.push("unexpected pre-staged files exist"); return finish(1, false); }

  const verify = verifyPhase(manifest, { repositoryRoot: root, evidencePath: join(tmpdir(), `condyn-${manifest.id}-seal-verify.out`) });
  logs.push(section("VERIFY BEFORE SEAL", verify.evidence));
  if (!verify.passed) { failures.push(...verify.failures.map((failure) => `verification failed: ${failure}`)); return finish(1, false); }
  if (head !== manifest.baseHead) { failures.push(`HEAD ${head} did not equal baseHead ${manifest.baseHead}`); return finish(1, false); }
  if (!manifest.remote || !manifest.remoteBranch) { failures.push("seal requires configured remote and remoteBranch"); return finish(1, false); }
  const fetch = runGit(root, ["fetch", manifest.remote]); logs.push(section("FETCH", gitLog(fetch))); if (!fetch.ok) { failures.push("remote fetch failed"); return finish(1, false); }
  if (remoteHead(root, manifest.remote, manifest.remoteBranch) !== manifest.baseHead) { failures.push("remote branch drifted from baseHead"); return finish(1, false); }
  const add = runGit(root, ["add", "--", ...manifest.allowedChangedFiles]); logs.push(section("STAGE", gitLog(add))); if (!add.ok) { failures.push("staging allowed files failed"); return finish(1, false); }
  const staged = runGit(root, ["diff", "--cached", "--name-only"]).output.split(/\r?\n/).filter(Boolean).sort(); const allowed = [...manifest.allowedChangedFiles].sort(); logs.push(section("CACHED SCOPE", staged.join("\n")));
  if (JSON.stringify(staged) !== JSON.stringify(allowed)) { failures.push("cached staged scope did not equal allowedChangedFiles"); return finish(1, false); }
  const cachedCheck = runGit(root, ["diff", "--cached", "--check"]); logs.push(section("CACHED DIFF CHECK", gitLog(cachedCheck))); if (!cachedCheck.ok) { failures.push("cached diff check failed"); return finish(1, false); }
  const commit = runGit(root, ["commit", "-m", manifest.seal.commitMessage]); logs.push(section("COMMIT", gitLog(commit))); if (!commit.ok) { failures.push("commit failed"); return finish(1, false); } committed = true;
  const newHead = runGit(root, ["rev-parse", "HEAD"]).output; const parent = runGit(root, ["rev-parse", "HEAD^"]).output;
  if (parent !== manifest.baseHead) { failures.push(`new commit parent ${parent} did not equal baseHead ${manifest.baseHead}`); return finish(1, false); }
  const commitScope = runGit(root, ["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"]).output.split(/\r?\n/).filter(Boolean).sort(); logs.push(section("COMMIT SCOPE", commitScope.join("\n")));
  if (JSON.stringify(commitScope) !== JSON.stringify(allowed)) { failures.push("commit scope did not equal allowedChangedFiles"); return finish(1, false); }
  for (const path of manifest.noDiffPaths) if (runGit(root, ["diff", "--name-only", `${manifest.baseHead}..${newHead}`, "--", path]).output) { failures.push(`noDiffPath changed in commit: ${path}`); return finish(1, false); }
  const push = runGit(root, ["push", manifest.remote, `HEAD:refs/heads/${manifest.remoteBranch}`]); logs.push(section("PUSH BRANCH", gitLog(push))); if (!push.ok) { failures.push("branch push failed after commit"); return finish(1, false); }
  const postFetch = runGit(root, ["fetch", manifest.remote]); logs.push(section("FETCH AFTER PUSH", gitLog(postFetch))); if (!postFetch.ok || remoteHead(root, manifest.remote, manifest.remoteBranch) !== newHead) { failures.push("remote branch does not equal local HEAD after push"); return finish(1, false); }
  const tagged = tagCommit(root, manifest.seal.tag);
  if (tagged && tagged !== newHead) { failures.push(`existing tag ${manifest.seal.tag} points to wrong commit ${tagged}`); return finish(1, false); }
  if (!tagged) { const create = runGit(root, ["-c", "tag.gpgSign=false", "-c", "tag.forceSignAnnotated=false", "tag", "-a", manifest.seal.tag, "-m", manifest.seal.tagMessage, newHead]); logs.push(section("CREATE TAG", gitLog(create))); if (!create.ok) { failures.push("annotated tag creation failed"); return finish(1, false); } }
  const pushTag = runGit(root, ["push", manifest.remote, `refs/tags/${manifest.seal.tag}`]); logs.push(section("PUSH TAG", gitLog(pushTag))); if (!pushTag.ok) { failures.push("tag push failed after commit"); return finish(1, false); }
  if (remoteTag(root, manifest.remote, manifest.seal.tag) !== newHead) { failures.push("remote annotated tag peeled commit did not equal new commit"); return finish(1, false); }
  const final = runGit(root, ["status", "--porcelain", "--untracked-files=all"]); logs.push(section("FINAL WORKTREE", final.output)); if (final.output) { failures.push("final worktree is not clean"); return finish(1, false); }
  return finish(0, true);
}
