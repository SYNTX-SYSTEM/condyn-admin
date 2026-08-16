const { executeCareerAnalysisPipeline } = require('./lib/career/pipeline.ts');
const { MockInferenceProvider } = require('./lib/career/adapter.ts');

async function test() {
  const { register } = require('esbuild-register/dist/node');
  const { unregister } = register();
  
  const pipeline = require('./lib/career/pipeline');
  const adapter = require('./lib/career/adapter');
  
  const payload = {
    report_markdown: "# Analysis",
    consistency: { overall_cohesion_score: 1.0, clusters: [], outlier_doc_ids: [], contradictions: [] },
    entities: [
      {
        entity_kind: "CAPABILITY",
        entity_id: "CAP_001",
        name: "Test Capability",
        properties: {},
        confidence: 0.9,
        evidence: [
          { doc_id: "DOC_001", location: "loc", context_quote: "quote", evidence_score: 0.9 }
        ]
      }
    ]
  };
  
  const provider = new adapter.MockInferenceProvider(JSON.stringify(payload));
  const result = await pipeline.executeCareerAnalysisPipeline([{ docId: "DOC_001", title: "Real PDF", content: "Test Capability" }], provider);
  
  console.log("SUCCESS:", result.success);
  if (!result.success) {
    console.log("ISSUES:", JSON.stringify(result.issues, null, 2));
  }
}
test();
