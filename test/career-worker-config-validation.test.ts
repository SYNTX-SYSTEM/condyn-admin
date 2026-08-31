import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { execSync } from "child_process";
import { db } from "../lib/career/db/client";
import { careerAnalysisJobs } from "../lib/career/db/schema";
import { JobRepository } from "../lib/career/orchestration/job-repository";
import { createJob } from "../lib/career/orchestration/job";
import { eq } from "drizzle-orm";

describe("Worker Configuration Validation", () => {
  const repo = new JobRepository(db);

  beforeEach(async () => {
    await db.delete(careerAnalysisJobs);
  });
  
  afterAll(async () => {
    await db.delete(careerAnalysisJobs);
  });

  it("fails fast on missing provider configuration without claiming a job", async () => {
    // Enqueue a job
    const job = createJob("CAREER_ANALYSIS", { sourceType: "TEST", sourceData: {} });
    await repo.enqueueJob(job);

    // Verify job is PENDING
    let currentJob = await repo.getJob(job.jobId);
    expect(currentJob?.status).toBe("PENDING");
    expect(currentJob?.attemptCount).toBe(0);
    expect(currentJob?.leaseVersion).toBe(0);

    // Attempt to start the worker process with no GEMINI_API_KEY
    let errorOutput = "";
    try {
      execSync("npx tsx scripts/run-career-worker.ts", {
        env: { ...process.env, GEMINI_API_KEY: "" },
        stdio: "pipe"
      });
      expect.fail("Worker should have exited non-zero");
    } catch (e: any) {
      errorOutput = e.stderr ? e.stderr.toString() : e.stdout ? e.stdout.toString() : e.message;
    }

    // Verify it failed fast with the expected error message
    expect(errorOutput).toContain("ERR_PROVIDER_CONFIG");
    
    // Verify the job was NEVER claimed (no attempt consumed, no lease increment)
    currentJob = await repo.getJob(job.jobId);
    expect(currentJob?.status).toBe("PENDING");
    expect(currentJob?.attemptCount).toBe(0);
    expect(currentJob?.leaseVersion).toBe(0);
    expect(currentJob?.leaseOwner).toBeNull();
  });

  it("exits non-zero for missing prompt encryption before claiming a job", async () => {
    const job = createJob("CAREER_ANALYSIS", {
      sourceType: "TEXT",
      sourceData: { documents: [] }
    });
    await repo.enqueueJob(job);

    const beforeStartup = await repo.getJob(job.jobId);
    expect(beforeStartup?.status).toBe("PENDING");
    expect(beforeStartup?.attemptCount).toBe(0);
    expect(beforeStartup?.leaseVersion).toBe(0);
    expect(beforeStartup?.leaseOwner).toBeNull();

    let exitStatus: number | null = null;
    let output = "";
    try {
      execSync("npx tsx scripts/run-career-worker.ts", {
        env: {
          ...process.env,
          GEMINI_API_KEY: "f10b-startup-validation-only",
          PROMPT_ENCRYPTION_KEY: ""
        },
        stdio: "pipe"
      });
    } catch (error) {
      const commandError = error as {
        status?: number | null;
        stderr?: Buffer;
        stdout?: Buffer;
      };
      exitStatus = commandError.status ?? null;
      output = `${commandError.stderr?.toString() ?? ""}${commandError.stdout?.toString() ?? ""}`;
    }

    expect(exitStatus).not.toBeNull();
    expect(exitStatus).not.toBe(0);
    expect(output).toContain("ERR_MISSING_ENCRYPTION_KEY");

    const afterStartup = await repo.getJob(job.jobId);
    expect(afterStartup?.status).toBe("PENDING");
    expect(afterStartup?.attemptCount).toBe(0);
    expect(afterStartup?.leaseVersion).toBe(0);
    expect(afterStartup?.leaseOwner).toBeNull();
  }, 15000);
});
