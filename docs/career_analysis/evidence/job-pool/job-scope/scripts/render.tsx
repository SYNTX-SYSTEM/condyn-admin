// @ts-nocheck — evidence script: renders HEAD (git archive) and the working tree by absolute path; run with tsx and NODE_PATH.
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const root = process.argv[2];
const { SemanticCareerIntelligenceField } = require(`${root}/app/components/career/demo/SemanticCareerIntelligenceField`);
const { SourceDock } = require(`${root}/app/components/career/demo/SourceDock`);
const { EMPTY_CAREER_INTELLIGENCE_DATA } = require(`${root}/app/career/demo/demo-data`);
const out: Record<string, string> = {};
const d = EMPTY_CAREER_INTELLIGENCE_DATA;
const cases: Array<[string, any]> = [];
for (const locale of ["en", "de"]) {
  cases.push([`cap-L0-${locale}`, { data: d, initialLocale: locale }]);
  for (const stage of ["01", "02", "03", "04", "05", "06"]) for (const zoom of [1, 2]) cases.push([`cap-${stage}-z${zoom}-${locale}`, { data: d, initialLocale: locale, initialFocus: { stageId: stage, zoomLevel: zoom } }]);
  cases.push([`field-nopool-${locale}`, { data: d, initialLocale: locale, fieldFocus: "FIELD" }]);
}
for (const [name, props] of cases) out[name] = renderToStaticMarkup(React.createElement(SemanticCareerIntelligenceField, props));
out["dock-empty"] = renderToStaticMarkup(React.createElement(SourceDock, {}));
out["dock-staged"] = renderToStaticMarkup(React.createElement(SourceDock, { initialStagedDocs: [{ id: "d", title: "a.pdf", type: "pdf", content: "x" }], onAnalyze: () => {} }));
console.log(JSON.stringify(out));
