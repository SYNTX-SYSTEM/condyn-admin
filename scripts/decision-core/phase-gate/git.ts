import { spawnSync } from "node:child_process";

export interface GitResult {
  ok: boolean;
  argv: string[];
  exitCode: number | null;
  stdout: string;
  stderr: string;
  output: string;
  timedOut: boolean;
  error?: string;
}

export function runGit(repositoryRoot: string, args: string[], options: { timeoutMs?: number } = {}): GitResult {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const result = spawnSync("git", args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    timeout: timeoutMs,
    maxBuffer: 64 * 1024 * 1024,
  });
  const error = result.error?.message;
  const timedOut = (result.error as NodeJS.ErrnoException | undefined)?.code === "ETIMEDOUT";
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  return {
    ok: !result.error && result.status === 0,
    argv: ["git", ...args],
    exitCode: result.status,
    stdout,
    stderr,
    output: stdout.trim(),
    timedOut,
    error,
  };
}
