import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ProviderCallBlocked, guardedGenerateContent, runWithProviderCallRecorder, setDefaultProviderCallRecorder } from "../../../lib/career/provider-calls/guard";

/** BUDGET BOUNDARY: no model call without a persistent register row, whatever the database. DETERMINISTIC_FIXTURE, no network. */
const testRecorder = { begin: async () => "PCALL_TEST", markSent: async () => undefined, complete: async () => undefined, failAfterSend: async () => undefined, failBeforeSend: async () => undefined };
afterEach(() => setDefaultProviderCallRecorder(testRecorder));

describe("no recorder, no call", () => {
  it("without any recorder the request is never sent and the refusal is a ProviderCallBlocked", async () => {
    setDefaultProviderCallRecorder(undefined);
    let sent = 0;
    for (const stage of ["EXTRACTION_LEGACY", "EXTRACTION_DISCOVERY", "EXTRACTION_CONVERGENCE", "SEMANTIC", "EMBEDDING", "DIAGNOSTIC"] as const) {
      const error = await guardedGenerateContent(stage, async () => { sent += 1; return "ok"; }).catch(e => e);
      expect(error).toBeInstanceOf(ProviderCallBlocked); expect(error.code).toBe("ERR_PROVIDER_CALL_REGISTER_FAILED");
    }
    expect(sent).toBe(0);
  });

  it("a bound recorder that cannot write the row still blocks, and a bound recorder wins over the default", async () => {
    setDefaultProviderCallRecorder(undefined);
    const log: string[] = []; let sent = 0;
    const bound = { ...testRecorder, begin: async () => { log.push("begin"); return "PCALL_X"; }, markSent: async () => { log.push("sent"); } };
    await runWithProviderCallRecorder(bound, () => guardedGenerateContent("SEMANTIC", async () => { sent += 1; return 1; }));
    expect(log).toEqual(["begin", "sent"]); expect(sent).toBe(1);
  });
});

const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => { const p = join(dir, name); return statSync(p).isDirectory() ? (name === "node_modules" || name === ".next" ? [] : walk(p)) : /\.(ts|tsx|mjs|js)$/.test(name) ? [p] : []; });

describe("architecture: every Gemini API call passes the seam, nothing installs a default recorder", () => {
  const root = readdirSync(".").filter(f => /\.(ts|tsx|mjs|js|cjs)$/.test(f) && statSync(f).isFile());
  const sources = [...["lib", "scripts", "app"].flatMap(d => { try { return walk(d); } catch { return []; } }), ...root].filter(f => !f.startsWith(join("lib", "career", "provider-calls")) && f !== "vitest.config.ts");
  const SDK_CALL = /\b[\w.]+\.(?:models\.(generateContent|generateContentStream|embedContent|countTokens|computeTokens|get|list)|nextPage)\s*\(/g;

  it("the scan covers the repository root scripts too", () => { expect(sources).toContain("test-schema.ts"); expect(sources).toContain(join("scripts", "list-models.ts")); });

  it("each SDK models.* call (and every pager page) sits inside guardedGenerateContent(", () => {
    const bare: string[] = [];
    for (const file of sources) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(SDK_CALL)) if (!/guardedGenerateContent\([^;]*$/.test(text.slice(Math.max(0, m.index! - 160), m.index!))) bare.push(`${file}: ${m[0]}`);
    }
    expect(bare).toEqual([]);
  });

  it("only the guard defines and the test setup uses setDefaultProviderCallRecorder", () => {
    const users = sources.filter(f => readFileSync(f, "utf8").includes("setDefaultProviderCallRecorder"));
    expect(users).toEqual([]);
  });
});
