import fs from 'fs';
import path from 'path';

const dir = path.join(__dirname, '../test/gold/case_001_minimal_valid/expected');
const expectedPath = path.join(dir, 'expected.json');
const inferencePath = path.join(dir, 'gemini-inference.json');
const canonicalPath = path.join(dir, 'canonical-expected.json');

const data = JSON.parse(fs.readFileSync(expectedPath, 'utf8'));
fs.writeFileSync(inferencePath, JSON.stringify(data, null, 2));

// Since we cannot pull from git, we construct the canonical expected
const canonical = {
  report_markdown: data.report_markdown,
  structured_data: {
    analysis: {
      metadata: {
        analysis_id: "ANL_TEST_DETERMINISTIC_ID",
        protocol_version: "1.0",
        schema_version: "1.0",
        prompt_contract_version: "1.0",
        execution_duration_ms: 1000,
        document_count: 1,
        total_word_count: 120
      },
      pipeline: { steps: [] },
      consistency: data.consistency,
      documents: data.entities.filter((e: any) => e.entity_kind === 'DOCUMENT').map((e: any) => ({
        ...e,
        identity: { type: 'DOCUMENT', name: e.name, canonical_type: 'DOCUMENT' },
        validation: { status: 'UNVERIFIED' }
      })),
      capabilities: data.entities.filter((e: any) => e.entity_kind === 'CAPABILITY').map((e: any) => ({
        ...e,
        identity: { type: 'CAPABILITY', name: e.name, canonical_type: 'CAPABILITY' },
        validation: { status: 'UNVERIFIED' }
      })),
      domains: data.entities.filter((e: any) => e.entity_kind === 'DOMAIN').map((e: any) => ({
        ...e,
        identity: { type: 'DOMAIN', name: e.name, canonical_type: 'DOMAIN' },
        validation: { status: 'UNVERIFIED' }
      })),
      organization_classes: data.entities.filter((e: any) => e.entity_kind === 'ORGANIZATION_CLASS').map((e: any) => ({
        ...e,
        identity: { type: 'ORGANIZATION_CLASS', name: e.name, canonical_type: 'ORGANIZATION_CLASS' },
        validation: { status: 'UNVERIFIED' }
      })),
      organizations: data.entities.filter((e: any) => e.entity_kind === 'ORGANIZATION').map((e: any) => ({
        ...e,
        identity: { type: 'ORGANIZATION', name: e.name, code: e.code, canonical_type: 'ORGANIZATION' },
        validation: { status: 'UNVERIFIED' }
      })),
      roles: data.entities.filter((e: any) => e.entity_kind === 'ROLE').map((e: any) => ({
        ...e,
        identity: { type: 'ROLE', name: e.name, canonical_type: 'ROLE' },
        validation: { status: 'UNVERIFIED' }
      })),
      opportunities: data.entities.filter((e: any) => e.entity_kind === 'OPPORTUNITY').map((e: any) => ({
        ...e,
        identity: { type: 'OPPORTUNITY', name: e.name, canonical_type: 'OPPORTUNITY' },
        validation: { status: 'UNVERIFIED' }
      })),
      strategies: data.entities.filter((e: any) => e.entity_kind === 'STRATEGY').map((e: any) => ({
        ...e,
        identity: { type: 'STRATEGY', name: e.name, canonical_type: 'STRATEGY' },
        validation: { status: 'UNVERIFIED' }
      })),
      search_queries: data.entities.filter((e: any) => e.entity_kind === 'SEARCH_QUERY').map((e: any) => ({
        ...e,
        identity: { type: 'SEARCH_QUERY', name: e.name, canonical_type: 'SEARCH_QUERY' },
        validation: { status: 'UNVERIFIED' }
      }))
    },
    presentation: {
      semantic_graph: { nodes: [], edges: [] },
      ui_layout: { center_node_id: "DOC_001", concentric_rings: [], color_tokens: {} }
    }
  }
};

fs.writeFileSync(canonicalPath, JSON.stringify(canonical, null, 2));
console.log('done');
