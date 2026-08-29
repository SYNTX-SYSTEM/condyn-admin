export type PhaseMode = "implementation" | "documentation" | "tooling";

export type TextCheckKind = "required-literal" | "forbidden-literal" | "required-regex" | "forbidden-regex";

export interface FrozenHashCheck { path: string; sha256: string; }
export interface RequiredTagCheck { name: string; peeledCommit: string; }
export interface TextCheck { kind: TextCheckKind; paths: string[]; pattern: string; }
export interface ExactErrorSurface { paths: string[]; regex: string; expected: string[]; }
export interface OutputRules {
  forbiddenRegex?: string[];
  requiredRegex?: string[];
  diagnosticRegex?: string;
  expectedDiagnosticCount?: number;
  forbiddenPathFragments?: string[];
}
export interface CommandCheck {
  name: string;
  kind: "command";
  argv: string[];
  expectedExitCode: number;
  allowNonZero?: boolean;
  outputRules?: OutputRules;
}
export interface VitestDiscoveryCheck {
  name: string;
  kind: "vitest-discovery";
  root: string;
  fileRegex: string;
  expectedExitCode: number;
  minimumFiles: number;
  outputRules?: OutputRules;
}
export interface SealConfiguration { enabled: boolean; commitMessage: string; tag: string; tagMessage: string; }
export interface PhaseManifest {
  schemaVersion: 1;
  id: string;
  phase: string;
  mode: PhaseMode;
  branch: string;
  baseHead: string;
  remote?: string;
  remoteBranch?: string;
  allowedChangedFiles: string[];
  frozenHashes: FrozenHashCheck[];
  noDiffPaths: string[];
  requiredAbsentPaths: string[];
  requiredTags: RequiredTagCheck[];
  absentTags: string[];
  textChecks: TextCheck[];
  commands: Array<CommandCheck | VitestDiscoveryCheck>;
  exactErrorSurfaces: ExactErrorSurface[];
  seal: SealConfiguration;
}

export interface CommandResult {
  name: string;
  argv: string[];
  exitCode: number | null;
  stdout: string;
  stderr: string;
  discoveredFiles?: string[];
  failures: string[];
  passed: boolean;
}

export interface VerifyOptions { repositoryRoot: string; evidencePath?: string; }
export interface VerifyResult { exitCode: 0 | 1; passed: boolean; failures: string[]; changedFiles: string[]; evidencePath: string; evidence: string; }
export interface SealOptions extends VerifyOptions { execute: boolean; }
export interface SealResult { exitCode: 0 | 1 | 2; passed: boolean; failures: string[]; evidencePath: string; evidence: string; }
