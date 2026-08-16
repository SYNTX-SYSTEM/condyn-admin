const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'test/gold/case_001_minimal_valid/expected/expected.json');
const data = JSON.parse(fs.readFileSync(p, 'utf-8'));

const analysis = data.structured_data.analysis;
const entities = [
  ...analysis.documents.map(e => ({ ...e, entity_kind: 'DOCUMENT' })),
  ...analysis.capabilities.map(e => ({ ...e, entity_kind: 'CAPABILITY' })),
  ...analysis.domains.map(e => ({ ...e, entity_kind: 'DOMAIN' })),
  ...analysis.organization_classes.map(e => ({ ...e, entity_kind: 'ORGANIZATION_CLASS' })),
  ...analysis.organizations.map(e => ({ ...e, entity_kind: 'ORGANIZATION' })),
  ...analysis.roles.map(e => ({ ...e, entity_kind: 'ROLE' })),
  ...analysis.opportunities.map(e => ({ ...e, entity_kind: 'OPPORTUNITY' })),
  ...analysis.strategies.map(e => ({ ...e, entity_kind: 'STRATEGY' })),
  ...analysis.search_queries.map(e => ({ ...e, entity_kind: 'SEARCH_QUERY' }))
];

const newOutput = {
  report_markdown: data.report_markdown,
  consistency: analysis.consistency,
  entities: entities.map(e => {
    const { identity, validation, ...rest } = e;
    rest.name = identity.name;
    if (identity.code) rest.code = identity.code;
    return rest;
  })
};

fs.writeFileSync(p, JSON.stringify(newOutput, null, 2));
