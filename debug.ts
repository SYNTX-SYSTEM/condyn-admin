import fs from 'fs';
import { executeCareerAnalysisPipeline } from './lib/career/pipeline';
import { MockInferenceProvider } from './lib/career/adapter';
import { exitOnJobScopeRefusal, resolveScriptJobScope } from "./lib/career/job-scope/script-scope";
import type { ResolvedJobScope } from "./lib/career/job-scope/scope";

async function test(jobScope: ResolvedJobScope) {
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
  
  const provider = new MockInferenceProvider(JSON.stringify(payload));
  const result = await executeCareerAnalysisPipeline([{ docId: "DOC_001", title: "Real PDF", content: "Test Capability" }], provider, { jobScope });
  
  fs.writeFileSync('output3.txt', JSON.stringify({ success: result.success, issues: result.issues }, null, 2));
}
// SFE JOB POOL FIRST: no Career-Analysis and no Gemini call without a valid pool + selected job (CONDYN_JOB_POOL_UPLOAD_ID, CONDYN_POOL_ROLE_ID).
resolveScriptJobScope().catch(exitOnJobScopeRefusal).then(test).catch(err => fs.writeFileSync('output3.txt', String(err)));
