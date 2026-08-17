import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { InMemoryCareerAnalysisRepository } from "../lib/career/repository";
import { VerifiedCareerAnalysis } from "../lib/career/types";
import { validateCareerAnalysis } from "../lib/career/validator";

describe("CONDYN Career Analysis Protocol v1.0 - Step 4.5: Persistence & Repository Layer (`CareerAnalysisRepository`)", () => {
  const goldJsonPath = path.join(__dirname, "gold/case_001_minimal_valid/expected/canonical-expected.json");
  const goldJsonRaw = fs.readFileSync(goldJsonPath, "utf-8");
  const unverifiedPayload = JSON.parse(goldJsonRaw);

  it("should save a VERIFIED analysis and retrieve it by analysisId via load()", async () => {
    const repository = new InMemoryCareerAnalysisRepository();
    
    // Validate payload to stamp it as VERIFIED
    const validationResult = validateCareerAnalysis(unverifiedPayload);
    expect(validationResult.success).toBe(true);
    
    const verifiedAnalysis = validationResult.data as VerifiedCareerAnalysis;
    await repository.save(verifiedAnalysis);

    const loaded = await repository.load("ANL_TEST_DETERMINISTIC_ID");
    expect(loaded).toBeDefined();
    expect(loaded!.structured_data.analysis.metadata.analysis_id).toBe("ANL_TEST_DETERMINISTIC_ID");
    expect(loaded!.structured_data.analysis.metadata.validation_state).toBe("VERIFIED");
  });

  it("should throw ERR_UNVERIFIED_ANALYSIS_PERSISTENCE when trying to save an unverified analysis", async () => {
    const repository = new InMemoryCareerAnalysisRepository();
    
    // Try to pass unverified payload directly
    const dirtyAnalysis = {
      ...unverifiedPayload,
      structured_data: {
        ...unverifiedPayload.structured_data,
        analysis: {
          ...unverifiedPayload.structured_data.analysis,
          metadata: {
            ...unverifiedPayload.structured_data.analysis.metadata,
            validation_state: "UNVERIFIED"
          }
        }
      }
    } as VerifiedCareerAnalysis;

    await expect(repository.save(dirtyAnalysis)).rejects.toThrow("ERR_UNVERIFIED_ANALYSIS_PERSISTENCE");
  });

  it("should return a lightweight AnalysisIndexEntry via list() without title or UI structure coupling", async () => {
    const repository = new InMemoryCareerAnalysisRepository();
    const validationResult = validateCareerAnalysis(unverifiedPayload);
    await repository.save(validationResult.data as VerifiedCareerAnalysis);

    const list = await repository.list();
    expect(list).toHaveLength(1);
    expect(list[0]).toEqual(expect.objectContaining({
      analysisId: "ANL_TEST_DETERMINISTIC_ID",
      validationState: "VERIFIED",
      overallConfidence: undefined
    }));
    // Ensure no UI or title properties leaked into the index entry
    expect((list[0] as any).title).toBeUndefined();
    expect((list[0] as any).ui_layout).toBeUndefined();
  });

  it("should guarantee immutability of stored domain records when loaded objects are mutated", async () => {
    const repository = new InMemoryCareerAnalysisRepository();
    const validationResult = validateCareerAnalysis(unverifiedPayload);
    await repository.save(validationResult.data as VerifiedCareerAnalysis);

    const firstLoad = await repository.load("ANL_TEST_DETERMINISTIC_ID");
    expect(firstLoad).toBeDefined();
    
    // Try to mutate overall_confidence on the loaded object
    firstLoad!.structured_data.analysis.metadata.overall_confidence = 0.11;

    // Reload from repository and verify the original value was preserved
    const secondLoad = await repository.load("ANL_TEST_DETERMINISTIC_ID");
    expect(secondLoad!.structured_data.analysis.metadata.overall_confidence).not.toBe(0.11);
  });
});
