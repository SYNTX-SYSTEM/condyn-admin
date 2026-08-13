import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { buildCareerAnalysisPrompt, DocumentInput, MockInferenceProvider, processLlmOutput } from "../lib/career/adapter";

describe("CONDYN Career Analysis Protocol v1.0 - Step 4.1: LLM Prompt Builder (`buildCareerAnalysisPrompt`)", () => {
  const sampleDocs: DocumentInput[] = [
    {
      docId: "DOC_001",
      title: "Lebenslauf Max Mustermann",
      content: "Erfahrener Systemarchitekt mit Fokus auf Node.js und TypeScript."
    },
    {
      docId: "DOC_002",
      title: "Projektzeugnis",
      content: "Erfolgreiche Leitung des Cloud-Migrationsprojekts im Finanzsektor."
    }
  ];

  it("should generate systemPrompt containing the 8 canonical Invariance Rules", () => {
    const result = buildCareerAnalysisPrompt(sampleDocs);
    expect(result.systemPrompt).toBeDefined();
    // Rule 1: No external assumptions / hallucination
    expect(result.systemPrompt).toContain("Invariance Rule 1");
    // Rule 8: Strict JSON syntax & Universal Entity Grammar
    expect(result.systemPrompt).toContain("Invariance Rule 8");
    expect(result.systemPrompt).toContain("Universal Entity Grammar");
  });

  it("should generate userPrompt containing prompt contract version and document metadata", () => {
    const result = buildCareerAnalysisPrompt(sampleDocs);
    expect(result.userPrompt).toBeDefined();
    expect(result.userPrompt).toContain("PC-CONDYN-CAP-v1.0");
    expect(result.userPrompt).toContain("Protocol Version: v1.0");
    expect(result.userPrompt).toContain("Schema Version: v1.0");
    expect(result.userPrompt).toContain("Document Count: 2");
  });

  it("should embed all document IDs, titles (metadata), and verbatim raw text in userPrompt", () => {
    const result = buildCareerAnalysisPrompt(sampleDocs);
    expect(result.userPrompt).toContain("DOC_001");
    expect(result.userPrompt).toContain("Lebenslauf Max Mustermann");
    expect(result.userPrompt).toContain("Erfahrener Systemarchitekt mit Fokus auf Node.js und TypeScript.");
    expect(result.userPrompt).toContain("DOC_002");
    expect(result.userPrompt).toContain("Projektzeugnis");
    expect(result.userPrompt).toContain("Erfolgreiche Leitung des Cloud-Migrationsprojekts im Finanzsektor.");
  });

  it("should strictly instruct the LLM to output ONLY valid JSON without Markdown code wrappers (no ```json)", () => {
    const result = buildCareerAnalysisPrompt(sampleDocs);
    expect(result.userPrompt).toContain("ausschließlich valides JSON");
    expect(result.userPrompt.toLowerCase()).toContain("kein markdown");
    expect(result.userPrompt).toContain("DO NOT wrap the output in ```json");
  });
});

describe("CONDYN Career Analysis Protocol v1.0 - Step 4.2: Inference Provider Contract (`InferenceProvider` & `MockInferenceProvider`)", () => {
  it("should execute a prompt bundle and return the configured raw string response", async () => {
    const mockJsonString = '{"report_markdown": "# Test Report", "structured_data": {}}';
    const provider = new MockInferenceProvider(mockJsonString);
    const result = await provider.execute({
      systemPrompt: "System Instructions",
      userPrompt: "User Instructions"
    });
    expect(result).toBe(mockJsonString);
  });

  it("should throw ERR_INVALID_PROMPT_BUNDLE when systemPrompt or userPrompt is empty", async () => {
    const provider = new MockInferenceProvider("test");
    await expect(provider.execute({ systemPrompt: "", userPrompt: "valid" }))
      .rejects.toThrow("ERR_INVALID_PROMPT_BUNDLE");
    await expect(provider.execute({ systemPrompt: "valid", userPrompt: "" }))
      .rejects.toThrow("ERR_INVALID_PROMPT_BUNDLE");
  });
});

describe("CONDYN Career Analysis Protocol v1.0 - Step 4.3: LLM Output Processor (`processLlmOutput`)", () => {
  const goldJsonPath = path.join(__dirname, "gold/case_001_minimal_valid/expected/gemini-inference.json");
  const goldJsonRaw = fs.readFileSync(goldJsonPath, "utf-8");

  it("should strip ```json code wrappers, parse JSON, and return success: true for valid gold model output", () => {
    const wrappedOutput = `Here is the analysis:\n\`\`\`json\n${goldJsonRaw}\n\`\`\`\nDone.`;
    const result = processLlmOutput(wrappedOutput);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data!.structured_data.analysis.metadata.validation_state).toBe("VERIFIED");
  });

  it("should strip generic ``` code wrappers without language specifier and validate successfully", () => {
    const wrappedOutput = `\`\`\`\n${goldJsonRaw}\n\`\`\``;
    const result = processLlmOutput(wrappedOutput);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("should handle raw un-wrapped JSON string cleanly and validate successfully", () => {
    const result = processLlmOutput(goldJsonRaw);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it("should return ERR_JSON_SYNTAX_INVALID when string is malformed or not parseable JSON", () => {
    const malformedOutput = `\`\`\`json\n{ invalid: json ...\n\`\`\``;
    const result = processLlmOutput(malformedOutput);
    expect(result.success).toBe(false);
    expect(result.issues.some(i => i.code === "ERR_JSON_SYNTAX_INVALID")).toBe(true);
  });

  it("should successfully recover from truncated JSON strings using repairTruncatedJson", () => {
    const truncatedInput = `{"report_markdown": "# Section 1\\nExecutive Summary\\n\\n## Section 2\\nCapabilities Overview`;
    const repaired = import("../lib/career/adapter").then(m => m.repairTruncatedJson(truncatedInput));
    return repaired.then(str => {
      expect(str.endsWith('"}')).toBe(true);
      expect(JSON.parse(str)).toEqual({
        report_markdown: "# Section 1\nExecutive Summary\n\n## Section 2\nCapabilities Overview"
      });
    });
  });
});


