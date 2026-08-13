import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { validateCareerAnalysis } from "../lib/career/validator";

// Load the known valid gold fixture to prevent Zod validation failures before our semantic rules
const goldCasePath = path.join(__dirname, "gold/case_001_minimal_valid/expected/canonical-expected.json");
const goldJsonRaw = fs.readFileSync(goldCasePath, "utf-8");

const getValidBasePayload = () => JSON.parse(goldJsonRaw);

describe("CONDYN Career Analysis - Role Extraction Regression Tests", () => {

  it("CASE 1: GROUNDED ROLE - Should pass when Role is connected to an existing Organization", () => {
    // The gold fixture already contains a valid Organization (ORG_001) and a valid Role (ROL_001) connected to it.
    const payload = getValidBasePayload();
    
    const result = validateCareerAnalysis(payload);
    expect(result.success).toBe(true);
    expect(result.issues.filter((i: any) => i.severity === "ERROR").length).toBe(0);
  });

  it("CASE 2: ROLE-LIKE TEXT WITHOUT ORGANIZATION - Should pass with capabilities extracted, but no generic organization and no role", () => {
    const payload = getValidBasePayload();
    
    // Clear out roles and organizations to simulate a capability-only extraction
    payload.structured_data.analysis.roles = [];
    payload.structured_data.analysis.organizations = [];
    
    // We must also remove edges in the graph that point to these removed entities
    payload.structured_data.presentation.semantic_graph.edges = payload.structured_data.presentation.semantic_graph.edges.filter((e: any) => 
      !e.source_id.startsWith("ORG_") && !e.target_id.startsWith("ORG_") &&
      !e.source_id.startsWith("ROL_") && !e.target_id.startsWith("ROL_")
    );
    payload.structured_data.presentation.semantic_graph.nodes = payload.structured_data.presentation.semantic_graph.nodes.filter((n: any) => 
      !n.node_id.startsWith("ORG_") && !n.node_id.startsWith("ROL_")
    );

    const result = validateCareerAnalysis(payload);
    expect(result.success).toBe(true);
  });

  it("CASE 3: MALFORMED MODEL OUTPUT - Should emit ERR_ROLE_HIERARCHY_DISCONNECTED for a disconnected Role", () => {
    const payload = getValidBasePayload();
    
    // Break the relationship by emptying it
    payload.structured_data.analysis.roles[0].relationships = [];

    const result = validateCareerAnalysis(payload);
    expect(result.success).toBe(false);
    expect(result.issues.some((i: any) => i.code === "ERR_ROLE_HIERARCHY_DISCONNECTED")).toBe(true);
  });

  it("CASE 4: DANGLING RELATIONSHIP - Should fail validation if ROLE_IN_ORGANIZATION points to non-existent ORG_999", () => {
    const payload = getValidBasePayload();
    
    // Change the target_id of the valid relationship to a non-existent organization
    const rels = payload.structured_data.analysis.roles[0].relationships;
    const orgRel = rels.find((r: any) => r.relation_type === "ROLE_IN_ORGANIZATION");
    if (orgRel) {
      orgRel.target_id = "ORG_999_ORPHAN";
    }

    // After the validator architecture fix, Phase 2.5 (Orphan removal) executes BEFORE Phase 2.4 (Semantic Rules).
    // Thus, the dangling edge to ORG_999_ORPHAN is removed, leaving the Role completely disconnected.
    // When Phase 2.4 subsequently runs, it detects the missing ROLE_IN_ORGANIZATION edge and throws an error.
    
    // We execute the validator.
    const result = validateCareerAnalysis(payload);
    
    expect(result.success).toBe(false);
    expect(result.issues.some((i: any) => i.code === "WARN_ORPHAN_EDGE_REMOVED")).toBe(true);
    expect(result.issues.some((i: any) => i.code === "ERR_ROLE_HIERARCHY_DISCONNECTED")).toBe(true);
  });

});
