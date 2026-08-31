import { describe, expect, it, vi } from "vitest";
import { CareerJobWorker } from "../lib/career/orchestration/worker";

type RuntimeOperation =
  | "RECOVERY_CHECK"
  | "SOURCE_PREPARATION"
  | "INFERENCE"
  | "ANALYSIS_VALIDATION"
  | "PERSISTENCE";

type ReportRuntimeOperation = (operation: RuntimeOperation) => Promise<void>;

describe("Career worker runtime-operation boundary contract", () => {
  it("publishes recovery, source preparation, and persistence in executable collaborator order", async () => {
    const execution: string[] = [];
    const operationWrites: RuntimeOperation[] = [];
    let processFinished!: () => void;
    const finished = new Promise<void>((resolve) => {
      processFinished = resolve;
    });

    const job = {
      jobId: "JOB_RUNTIME_OPERATION_CONTRACT",
      leaseVersion: 1
    };

    const jobRepo = {
      claimNextJob: vi.fn().mockResolvedValue(job),
      heartbeatJob: vi.fn().mockResolvedValue(undefined),
      updateJobState: vi.fn(async (...args: any[]) => {
        const operation = args[5]?.currentOperation as RuntimeOperation | undefined;
        if (operation) operationWrites.push(operation);
      }),
      failJob: vi.fn().mockResolvedValue(undefined)
    };

    const canonicalRecoveryLookup = vi.fn(async () => {
      execution.push("canonical recovery lookup");
      return null;
    });
    const prepareDocumentsAtBoundary = vi.fn(async () => {
      execution.push("prepareDocuments");
    });
    const persistCanonicalAnalysis = vi.fn(async () => {
      execution.push("canonical save");
    });

    const processJob = async (_job: unknown, reportOperation: ReportRuntimeOperation) => {
      try {
        await reportOperation("RECOVERY_CHECK");
        await canonicalRecoveryLookup();
        await reportOperation("SOURCE_PREPARATION");
        await prepareDocumentsAtBoundary();
        await reportOperation("PERSISTENCE");
        await persistCanonicalAnalysis();
        return { resultAnalysisId: "ANL_RUNTIME_OPERATION_CONTRACT" };
      } finally {
        processFinished();
      }
    };

    const worker = new (CareerJobWorker as any)(
      "worker-runtime-operation-contract",
      jobRepo,
      processJob,
      60000,
      60000
    );

    worker.start();
    await finished;
    worker.stop();

    expect(execution).toEqual([
      "canonical recovery lookup",
      "prepareDocuments",
      "canonical save"
    ]);
    expect(operationWrites).toEqual([
      "RECOVERY_CHECK",
      "SOURCE_PREPARATION",
      "PERSISTENCE"
    ]);
    expect(canonicalRecoveryLookup).toHaveBeenCalledBefore(prepareDocumentsAtBoundary);
    expect(prepareDocumentsAtBoundary).toHaveBeenCalledBefore(persistCanonicalAnalysis);
    expect(jobRepo.failJob).not.toHaveBeenCalled();
  });
});
