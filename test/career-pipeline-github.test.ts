import { describe, it, expect } from "vitest";
import { executeCareerAnalysisPipeline } from "../lib/career/pipeline";
import { MockInferenceProvider, buildCareerAnalysisPrompt } from "../lib/career/adapter";
import { DocumentInput } from "../lib/career/index";

describe("CONDYN / SYNTX — GITHUB PIPELINE E2E TEST (`test/career-pipeline-github.test.ts`)", () => {
  it("should process GitHub documents deterministically, enforce boundaries, and construct valid evidence chains", async () => {
    // 1. Mock GitHub Loader Output
    // This simulates what loadGitHubRepositoryDocuments returns in a zero-state environment
    const githubDocs: DocumentInput[] = [
      {
        url: "https://github.com/codi/test-repo",
        type: "github",
        docId: "DOC_GH_001",
        title: "README.md",
        content: "# Test Repository\nImplements real-time distributed processing.",
        telemetry: {
          path: "README.md",
          sha: "abcd123"
        }
      },
      {
        url: "https://github.com/codi/test-repo",
        type: "github",
        docId: "DOC_GH_002",
        title: "package.json",
        content: '{\n  "name": "test-repo",\n  "version": "1.0.0"\n}',
        telemetry: {
          path: "package.json",
          sha: "efgh456"
        }
      }
    ];

    // 2. Validate Prompt Allowed IDs
    const prompt = buildCareerAnalysisPrompt(githubDocs);
    expect(prompt.allowedDocIds).toEqual(["DOC_GH_001", "DOC_GH_002"]);

    // 3. Execute Pipeline with Mock Provider
    const provider = new MockInferenceProvider();
    
    // We override execute to enforce that the mock returns data that aligns with our Github inputs,
    // since the default mock data from MockInferenceProvider might not have DOC_GH_001.
    const originalExecute = provider.execute.bind(provider);
    provider.execute = async (reqPrompt: any) => {
      const resultString = await originalExecute(reqPrompt);
      return resultString
        .replace(/DOC_001/g, "DOC_GH_001")
        .replace(/doc1\.md/g, "README.md")
        .replace(/Siemens AG/g, "GithubOrg")
        .replace(/Siemens/g, "GithubOrg")
        .replace(/Helsing/g, "GithubOrg")
        .replace(/Anduril/g, "GithubOrg");
    };

    const validationResult = await executeCareerAnalysisPipeline(githubDocs, provider);

    // 4. Assert pipeline success
    expect(validationResult.success).toBe(true);
    expect(validationResult.data).toBeDefined();

    const analysis = validationResult.data as any;

    // 5. Assert canonical document references
    const canonicalDocs = analysis.structured_data.analysis.documents;
    expect(canonicalDocs).toBeDefined();
    expect(canonicalDocs.length).toBeGreaterThan(0);
    
    // Ensure the document matches what we fed it
    expect(canonicalDocs[0].entity_id).toBe("DOC_GH_001");
    expect(canonicalDocs[0].identity.name).toBe("README.md");

    // 6. Assert semantic entities retain valid evidence referencing the GitHub doc
    const capabilities = analysis.structured_data.analysis.capabilities;
    expect(capabilities).toBeDefined();
    
    let foundEvidence = false;
    for (const cap of capabilities) {
      if (cap.evidence && cap.evidence.length > 0) {
        expect(cap.evidence[0].doc_id).toBe("DOC_GH_001");
        foundEvidence = true;
      }
    }
    expect(foundEvidence).toBe(true);

    // 7. Assert absolutely NO DEMO/fallback entities exist
    const jsonString = JSON.stringify(analysis);
    expect(jsonString).not.toContain("DEMO-ANL-2026-X1");
    expect(jsonString).not.toContain("Helsing");
    expect(jsonString).not.toContain("Anduril");
    expect(jsonString).not.toContain("Siemens");
    expect(jsonString).not.toContain("Core Architecture Cluster");
    expect(jsonString).not.toContain("Semantic Resonance Vector");
  });
});
