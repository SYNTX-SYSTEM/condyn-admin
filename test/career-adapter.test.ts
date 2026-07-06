import { describe, it, expect } from "vitest";
import { buildCareerAnalysisPrompt, DocumentInput } from "../lib/career/adapter";

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
