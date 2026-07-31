import fs from "fs";
import path from "path";
import { validateCareerAnalysis } from "../lib/career/validator";
import { InMemoryCareerAnalysisRepository } from "../lib/career/repository";
import { projectTopology } from "../lib/career/perception";
import { buildViewModel } from "../lib/career/view-model";
import { buildRadialLayout } from "../lib/career/layout";
import { toReactFlow } from "../lib/career/adapters/react-flow";
import { toD3Force } from "../lib/career/adapters/d3-force";

async function runSystemVerification() {
  console.log("=================================================");
  console.log("CONDYN Career Analysis Protocol v1.0 - E2E Demo");
  console.log("=================================================\n");

  // 1. Load Gold Case
  const goldPath = path.resolve(__dirname, "../test/gold/case_001_minimal_valid/expected/expected.json");
  const rawJsonString = fs.readFileSync(goldPath, "utf-8");
  const rawJson = JSON.parse(rawJsonString);
  console.log("✓ Gold Case geladen\n");

  // 2. Validator
  const validationResult = validateCareerAnalysis(rawJson);
  if (!validationResult.success || !validationResult.data) {
    console.error("❌ Validation failed:", validationResult.issues);
    process.exit(1);
  }
  const verifiedAnalysis = validationResult.data as any;
  const meta = verifiedAnalysis.structured_data.analysis.metadata;
  console.log("✓ Validation");
  console.log(`  analysis_id: ${meta.analysis_id}`);
  console.log(`  validation_state: ${meta.validation_state}\n`);

  // 3. Repository
  const repo = new InMemoryCareerAnalysisRepository();
  await repo.save(verifiedAnalysis);
  const loadedAnalysis = await repo.load(meta.analysis_id);
  if (!loadedAnalysis) {
    console.error("❌ Repository load failed");
    process.exit(1);
  }
  console.log("✓ Repository");
  console.log("  saved");
  console.log("  loaded\n");

  // 4. Projection
  const projection = projectTopology(loadedAnalysis);
  console.log("✓ Projection");
  console.log(`  nodes: ${projection.nodes.length}`);
  console.log(`  edges: ${projection.edges.length}\n`);

  // 5. View Model
  const viewModel = buildViewModel(projection);
  console.log("✓ View Model");
  console.log(`  groups: ${viewModel.groups.length}\n`);

  // 6. Layout
  const layout = buildRadialLayout(viewModel);
  const centerNode = layout.nodes.find(n => n.id === layout.centerNodeId);
  console.log("✓ Layout");
  console.log(`  center: (${centerNode?.x || 0},${centerNode?.y || 0})\n`);

  // 7. ReactFlow Adapter
  const reactFlowGraph = toReactFlow(layout);
  console.log("✓ ReactFlow");
  console.log(`  nodes: ${reactFlowGraph.nodes.length}`);
  console.log(`  edges: ${reactFlowGraph.edges.length}\n`);

  // 8. D3 Adapter
  const d3Graph = toD3Force(layout);
  console.log("✓ D3");
  console.log(`  nodes: ${d3Graph.nodes.length}`);
  console.log(`  links: ${d3Graph.links.length}\n`);

  // 9. Snapshot Export
  const demoDir = path.resolve(__dirname, "../public/demo");
  if (!fs.existsSync(demoDir)) {
    fs.mkdirSync(demoDir, { recursive: true });
  }

  fs.writeFileSync(path.join(demoDir, "01_verified.json"), JSON.stringify(verifiedAnalysis, null, 2), "utf-8");
  fs.writeFileSync(path.join(demoDir, "02_projection.json"), JSON.stringify(projection, null, 2), "utf-8");
  fs.writeFileSync(path.join(demoDir, "03_view_model.json"), JSON.stringify(viewModel, null, 2), "utf-8");
  fs.writeFileSync(path.join(demoDir, "04_layout.json"), JSON.stringify(layout, null, 2), "utf-8");
  fs.writeFileSync(path.join(demoDir, "05_reactflow.json"), JSON.stringify(reactFlowGraph, null, 2), "utf-8");
  fs.writeFileSync(path.join(demoDir, "06_d3.json"), JSON.stringify(d3Graph, null, 2), "utf-8");
  console.log("✓ Snapshots exportiert nach public/demo/\n");

  console.log("SUCCESS");
}

runSystemVerification().catch(err => {
  console.error("Fatal error during system verification:", err);
  process.exit(1);
});
