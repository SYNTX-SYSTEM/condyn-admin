import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createAutoMatchHook } from "../../../lib/career/job-pool/auto-match-hook";

describe("the worker's automatic-match hook", () => {
  it("runs the match for the result analysis and logs the outcome by code only", async () => {
    const calls: string[] = []; const lines: string[] = [];
    await createAutoMatchHook("w1", async id => { calls.push(id); return { outcome: "DISABLED", reason: "DAY_LIMIT_ZERO" }; }, line => lines.push(line))({}, "ANL_1");
    expect(calls).toEqual(["ANL_1"]);
    expect(lines).toEqual(["[Worker w1] AUTO_MATCH ANL_1 DISABLED DAY_LIMIT_ZERO"]);
  });
  it("lets a failure of the run reach the worker (which logs it and goes on)", async () => {
    await expect(createAutoMatchHook("w1", async () => { throw new Error("ERR_X"); }, () => undefined)({}, "ANL_1")).rejects.toThrow("ERR_X");
  });
  it("the career worker script hands the hook to the worker", () => {
    const script = readFileSync("scripts/run-career-worker.ts", "utf8");
    expect(script).toMatch(/import \{ createAutoMatchHook \} from "\.\.\/lib\/career\/job-pool\/auto-match-hook"/);
    expect(script).toMatch(/new CareerJobWorker\([\s\S]*?createAutoMatchHook\(workerId\)\s*\);/);
  });
});
