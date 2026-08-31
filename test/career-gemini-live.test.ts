import { describe, it, expect } from "vitest";
import { GeminiProvider } from "../lib/career/providers/gemini";
import { executeCareerAnalysisPipeline } from "../lib/career/pipeline";

const canRunLive =
  process.env.RUN_LIVE_LLM_TESTS === "true" &&
  !!process.env.GEMINI_API_KEY;

describe.skipIf(!canRunLive)(
  "CONDYN Career Analysis Protocol v1.0 - Step 9.3: Gemini Live Pipeline Smoke Test (GATED)",
  () => {
    it(
      "should execute the real Career pipeline through Gemini, preserve runtime-owned DOCUMENT identity, and validate as VERIFIED",
      async () => {
        const sampleDocs = [
          {
            docId: "DOC_001",
            title: "Live Test Architect CV",
            content: `
            Senior Cloud Systems Architect with 10 years of experience in distributed systems and Kubernetes.
            Led engineering teams at Siemens AG and BMW Group.
            Specialized in high-throughput event-driven microservices.
            `
          }
        ];

        const provider = new GeminiProvider();

        const validationResult = await executeCareerAnalysisPipeline(
          sampleDocs,
          provider,
          {
            onRuntimeOperation(operation) {
              console.log("RUNTIME_OPERATION=" + operation);
            }
          }
        );

        console.log(
          "GEMINI_TELEMETRY=" +
          JSON.stringify(provider.lastTelemetry ?? null)
        );

        if (!validationResult.success) {
          console.error(
            "Live Gemini pipeline validation failures:",
            validationResult.issues
          );
        }

        expect(validationResult.success).toBe(true);
        expect(validationResult.data).toBeDefined();

        const analysis = validationResult.data!;

        expect(
          analysis.structured_data.analysis.metadata.validation_state
        ).toBe("VERIFIED");

        const documents = analysis.structured_data.analysis.documents;

        expect(documents.some((doc) => doc.entity_id === "DOC_001")).toBe(true);

        const semanticEntities = [
          ...analysis.structured_data.analysis.capabilities,
          ...analysis.structured_data.analysis.domains,
          ...analysis.structured_data.analysis.organization_classes,
          ...analysis.structured_data.analysis.organizations,
          ...analysis.structured_data.analysis.roles,
          ...analysis.structured_data.analysis.opportunities,
          ...analysis.structured_data.analysis.strategies,
          ...analysis.structured_data.analysis.search_queries
        ];

        for (const entity of semanticEntities) {
          for (const evidence of entity.evidence) {
            expect(
              documents.some((doc) => doc.entity_id === evidence.doc_id)
            ).toBe(true);
          }
        }
      },
      120000
    );
  }
);
