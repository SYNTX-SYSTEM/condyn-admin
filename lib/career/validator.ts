/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * RUNTIME INTEGRITY VALIDATOR (`lib/career/validator.ts`)
 * 
 * Status: ARCHITECTURE FREEZE v1.0 / KANONISCHER VERTRAG
 * Scope: Runtime verification, structural integrity, semantic rules, and partial graph repair.
 * Architecture: Phase 2.3 Referential Integrity Check (ID indexing, duplicate check, orphan edge detection).
 */

import { z } from "zod";
import { CanonicalCareerAnalysis, CanonicalCareerAnalysisSchema, UniversalEntity } from "./schema";

// ============================================================================
// 1. ERROR & WARNING CODES (CANONICAL TAXONOMY)
// ============================================================================

export type ValidationErrorCode =
  | "ERR_VERSION_MISMATCH"
  | "ERR_SCHEMA_BIFURCATION_MISSING"
  | "ERR_MANDATORY_SECTION_MISSING"
  | "ERR_JSON_SYNTAX_INVALID"
  | "ERR_INVALID_ID_PREFIX"
  | "ERR_DUPLICATE_ENTITY_ID"
  | "ERR_ORPHAN_REFERENCE"
  | "ERR_ID_RECYCLED_VIOLATION"
  | "ERR_GRAMMAR_VIOLATION"
  | "ERR_EVIDENCE_MISSING"
  | "ERR_SCORE_OUT_OF_BOUNDS"
  | "ERR_EVIDENCE_SCORE_INVALID"
  | "ERR_CONSISTENCY_SCHEMA_INVALID"
  | "ERR_OUTLIER_NOT_ISOLATED"
  | "ERR_SEMANTIC_POLLUTION_UI"
  | "ERR_PRESENTATION_POLLUTION_DOMAIN"
  | "ERR_READ_ONLY_VIOLATION"
  | "ERR_NON_CANONICAL_ISO_COUNTRY"
  | "ERR_NON_CANONICAL_INDUSTRY_ENUM"
  | "ERR_CIRCULAR_REFERENCE_DETECTED"
  | "ERR_ROLE_HIERARCHY_DISCONNECTED"
  | "ERR_VALIDATOR_CONFIDENCE_MUTATION"
  | "ERR_GRAPH_NODE_MISMATCH"
  | "ERR_RING_TOPOLOGY_INVALID"
  | "ERR_FRONTEND_INFERENCE_DETECTED"
  | "ERR_MARKDOWN_STRUCTURE_INVALID"
  | "ERR_HALLUCINATED_REPORT_QUOTE"
  | "ERR_CROSS_PARITY_MISMATCH"
  | "ERR_GRACEFUL_DEGRADATION_FAILED"
  | "ERR_UNKNOWN_VALIDATION_FAILURE";

export type ValidationWarningCode =
  | "WARN_ORPHAN_EDGE_REMOVED"
  | "WARN_LOW_WORD_COUNT"
  | "WARN_LOW_CONFIDENCE"
  | "WARN_GRACEFUL_DEGRADATION_APPLIED";

export type ValidationSeverity = "ERROR" | "WARNING" | "INFO";

// ============================================================================
// 2. VALIDATION ISSUES & RESULT STRUCTURE
// ============================================================================

export interface ValidationIssue {
  code: ValidationErrorCode | ValidationWarningCode | string;
  severity: ValidationSeverity;
  message: string;
  path?: (string | number)[];
  entityId?: string;
}

export interface PromptMetadata {
  slug: string;
  templateId: string;
  versionId: string;
  checksum: string;
}

export interface ValidationResult<T = CanonicalCareerAnalysis> {
  success: boolean;
  data?: T;
  issues: ValidationIssue[];
  metrics: {
    durationMs: number;
    errorCount: number;
    warningCount: number;
    promptMetadata?: PromptMetadata;
  };
}

// ============================================================================
// 3. INTERNAL HELPER: MAP ZOD ISSUE TO CANONICAL ERROR CODE
// ============================================================================

function mapZodIssueToCode(issue: z.ZodIssue): ValidationErrorCode {
  const pathStr = issue.path.join(".");
  const msg = issue.message;

  if (pathStr.includes("protocol_version") || pathStr.includes("schema_version") || pathStr.includes("prompt_contract_version")) {
    return "ERR_VERSION_MISMATCH";
  }
  if (issue.path[0] === "report_markdown" || issue.path[0] === "structured_data" || pathStr === "structured_data.analysis" || pathStr === "structured_data.presentation") {
    return "ERR_SCHEMA_BIFURCATION_MISSING";
  }
  if (msg.includes("prefix") || pathStr.endsWith("entity_id") || pathStr.endsWith("target_id") || pathStr.endsWith("doc_id") || pathStr.endsWith("node_id")) {
    if (issue.code === "invalid_string" && issue.validation === "regex") {
      return "ERR_INVALID_ID_PREFIX";
    }
  }
  if (msg.includes("<= 1.0") || msg.includes(">= 0.0") || pathStr.includes("score") || pathStr.includes("confidence") || pathStr.includes("weight")) {
    return "ERR_SCORE_OUT_OF_BOUNDS";
  }
  if (pathStr.includes("country_iso")) {
    return "ERR_NON_CANONICAL_ISO_COUNTRY";
  }
  if (issue.code === "invalid_type" && issue.received === "undefined") {
    if (issue.path.length === 2 && issue.path[0] === "structured_data") {
      return "ERR_SCHEMA_BIFURCATION_MISSING";
    }
    if (issue.path.length === 3 && issue.path[0] === "structured_data" && issue.path[1] === "analysis") {
      return "ERR_MANDATORY_SECTION_MISSING";
    }
    return "ERR_GRAMMAR_VIOLATION";
  }
  return "ERR_GRAMMAR_VIOLATION";
}

// ============================================================================
// 4. VALIDATOR ENGINE IMPLEMENTATION
// ============================================================================

/**
 * Validates a raw input payload against the CONDYN Career Analysis Protocol v1.0.
 * Follows strict phased execution: Parsing -> Structure -> Semantics -> Repair -> Stamping.
 * 
 * @param payload The raw unknown input (JSON string or parsed object)
 * @returns ValidationResult containing either the stamped CanonicalCareerAnalysis or validation issues
 */
export function validateCareerAnalysis(payload: unknown): ValidationResult<CanonicalCareerAnalysis> {
  const startTime = Date.now();
  const issues: ValidationIssue[] = [];

  // --------------------------------------------------------------------------
  // Phase 2.2a: JSON Parsing
  // --------------------------------------------------------------------------
  let parsedObject: unknown = payload;
  if (typeof payload === "string") {
    try {
      parsedObject = JSON.parse(payload);
    } catch (error) {
      issues.push({
        code: "ERR_JSON_SYNTAX_INVALID",
        severity: "ERROR",
        message: `Malformed JSON string: ${error instanceof Error ? error.message : String(error)}`,
        path: []
      });
      const durationMs = Date.now() - startTime;
      return {
        success: false,
        issues,
        metrics: { durationMs, errorCount: 1, warningCount: 0 }
      };
    }
  }

  // --------------------------------------------------------------------------
  // Phase 2.2b: Zod Schema Validation & Issue Transformation
  // --------------------------------------------------------------------------
  const parseResult = CanonicalCareerAnalysisSchema.safeParse(parsedObject);
  if (!parseResult.success) {
    for (const zodIssue of parseResult.error.issues) {
      const code = mapZodIssueToCode(zodIssue);
      issues.push({
        code,
        severity: "ERROR",
        message: zodIssue.message,
        path: zodIssue.path
      });
    }

    const durationMs = Date.now() - startTime;
    return {
      success: false,
      issues,
      metrics: {
        durationMs,
        errorCount: issues.length,
        warningCount: 0
      }
    };
  }

  const validData = parseResult.data;
  const analysis = validData.structured_data.analysis;

  // --------------------------------------------------------------------------
  // Phase 2.3: Referential Integrity Check (ID Indexing & Orphan Edge Detection)
  // --------------------------------------------------------------------------
  const idRegistry = new Set<string>();

  // Helper to index an entity or cluster ID
  const registerId = (id: string, path: (string | number)[]) => {
    if (idRegistry.has(id)) {
      issues.push({
        code: "ERR_DUPLICATE_ENTITY_ID",
        severity: "ERROR",
        message: `Duplicate entity_id detected: '${id}' is already assigned.`,
        entityId: id,
        path
      });
    } else {
      idRegistry.add(id);
    }
  };

  // Index Consistency Clusters
  analysis.consistency.clusters.forEach((clu, idx) => {
    registerId(clu.cluster_id, ["structured_data", "analysis", "consistency", "clusters", idx, "cluster_id"]);
  });

  // Collect all 9 domain entity arrays
  const domainArrays: [string, UniversalEntity[]][] = [
    ["documents", analysis.documents],
    ["capabilities", analysis.capabilities],
    ["domains", analysis.domains],
    ["organization_classes", analysis.organization_classes],
    ["organizations", analysis.organizations],
    ["roles", analysis.roles],
    ["opportunities", analysis.opportunities],
    ["strategies", analysis.strategies],
    ["search_queries", analysis.search_queries]
  ];

  // Index all Domain Entities
  for (const [sectionName, entities] of domainArrays) {
    entities.forEach((entity, idx) => {
      registerId(entity.entity_id, ["structured_data", "analysis", sectionName, idx, "entity_id"]);
    });
  }

  // Check evidence doc_ids for Orphan References
  for (const [sectionName, entities] of domainArrays) {
    entities.forEach((entity, entityIdx) => {
      // Check evidence doc_ids
      entity.evidence.forEach((ev, evIdx) => {
        if (!idRegistry.has(ev.doc_id)) {
          issues.push({
            code: "ERR_ORPHAN_REFERENCE",
            severity: "ERROR",
            message: `Orphan reference detected: Evidence in '${entity.entity_id}' references non-existent doc_id '${ev.doc_id}'.`,
            entityId: entity.entity_id,
            path: ["structured_data", "analysis", sectionName, entityIdx, "evidence", evIdx, "doc_id"]
          });
        }
      });
    });
  }

  // Check consistency cluster doc_ids
  analysis.consistency.clusters.forEach((clu, cluIdx) => {
    clu.doc_ids.forEach((docId, docIdx) => {
      if (!idRegistry.has(docId)) {
        issues.push({
          code: "ERR_ORPHAN_REFERENCE",
          severity: "ERROR",
          message: `Orphan reference detected: Cluster '${clu.cluster_id}' references non-existent doc_id '${docId}'.`,
          entityId: clu.cluster_id,
          path: ["structured_data", "analysis", "consistency", "clusters", cluIdx, "doc_ids", docIdx]
        });
      }
    });
  });

  const errorCount = issues.filter(i => i.severity === "ERROR").length;
  if (errorCount > 0) {
    const durationMs = Date.now() - startTime;
    return {
      success: false,
      issues,
      metrics: {
        durationMs,
        errorCount,
        warningCount: issues.filter(i => i.severity === "WARNING").length
      }
    };
  }

  // --------------------------------------------------------------------------
  // Phase 2.4: Partial Graph Repair (Orphan Edge Removal)
  // --------------------------------------------------------------------------
  for (const [sectionName, entities] of domainArrays) {
    entities.forEach((entity, entityIdx) => {
      const originalRels = entity.relationships;
      const validRels = originalRels.filter((rel, relIdx) => {
        if (!idRegistry.has(rel.target_id)) {
          issues.push({
            code: "WARN_ORPHAN_EDGE_REMOVED",
            severity: "WARNING",
            message: `Partial Graph Repair: Removed orphan relationship from entity '${entity.entity_id}' referencing non-existent target_id '${rel.target_id}'.`,
            entityId: entity.entity_id,
            path: ["structured_data", "analysis", sectionName, entityIdx, "relationships", relIdx, "target_id"]
          });
          return false;
        }
        return true;
      });
      entity.relationships = validRels;
    });
  }

  // --------------------------------------------------------------------------
  // Phase 2.5: Semantic Rules (Role Hierarchy, Mandatory Evidence, DAG Check)
  // --------------------------------------------------------------------------

  // 1. Role -> Organization Hierarchy Check
  const organizationIds = new Set(analysis.organizations.map(org => org.entity_id));
  analysis.roles.forEach((role, roleIdx) => {
    const hasOrgRef = role.relationships.some(rel => 
      rel.relation_type === "ROLE_IN_ORGANIZATION" && 
      organizationIds.has(rel.target_id)
    );
    if (!hasOrgRef) {
      issues.push({
        code: "ERR_ROLE_HIERARCHY_DISCONNECTED",
        severity: "ERROR",
        message: `Role entity '${role.entity_id}' is disconnected: missing mandatory 'ROLE_IN_ORGANIZATION' relationship.`,
        entityId: role.entity_id,
        path: ["structured_data", "analysis", "roles", roleIdx, "relationships"]
      });
    }
  });

  // 2. Mandatory Evidence Check across 8 domain arrays
  const evidenceRequiredArrays: [string, UniversalEntity[]][] = [
    ["capabilities", analysis.capabilities],
    ["domains", analysis.domains],
    ["organization_classes", analysis.organization_classes],
    ["organizations", analysis.organizations],
    ["roles", analysis.roles],
    ["opportunities", analysis.opportunities],
    ["strategies", analysis.strategies],
    ["search_queries", analysis.search_queries]
  ];

  for (const [sectionName, entities] of evidenceRequiredArrays) {
    entities.forEach((entity, idx) => {
      if (!entity.evidence || entity.evidence.length === 0) {
        issues.push({
          code: "ERR_EVIDENCE_MISSING",
          severity: "ERROR",
          message: `Mandatory evidence missing: Entity '${entity.entity_id}' in section '${sectionName}' has an empty evidence array.`,
          entityId: entity.entity_id,
          path: ["structured_data", "analysis", sectionName, idx, "evidence"]
        });
      }
    });
  }

  // 3. DAG (Directed Acyclic Graph) Check
  const adjList = new Map<string, string[]>();
  for (const [_, entities] of domainArrays) {
    entities.forEach(ent => {
      const targets = ent.relationships.map(r => r.target_id);
      adjList.set(ent.entity_id, targets);
    });
  }

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const detectCycle = (nodeId: string, path: string[]): boolean => {
    if (recursionStack.has(nodeId)) {
      issues.push({
        code: "ERR_CIRCULAR_REFERENCE_DETECTED",
        severity: "ERROR",
        message: `Circular reference detected in entity graph: ${[...path, nodeId].join(" -> ")}`,
        entityId: nodeId
      });
      return true;
    }
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (detectCycle(neighbor, [...path, nodeId])) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  };

  for (const [nodeId] of adjList) {
    if (!visited.has(nodeId)) {
      detectCycle(nodeId, []);
    }
  }

  const totalErrors = issues.filter(i => i.severity === "ERROR").length;
  if (totalErrors > 0) {
    const durationMs = Date.now() - startTime;
    return {
      success: false,
      issues,
      metrics: {
        durationMs,
        errorCount: totalErrors,
        warningCount: issues.filter(i => i.severity === "WARNING").length
      }
    };
  }


  // --------------------------------------------------------------------------
  // Phase 2.6: Validator Stamping
  // --------------------------------------------------------------------------
  for (const [_, entities] of domainArrays) {
    entities.forEach(ent => {
      if (ent.validation) {
        ent.validation.status = "PASSED";
      }
    });
  }
  if (analysis.metadata) {
    analysis.metadata.validation_state = "VERIFIED";
  }

  const durationMs = Date.now() - startTime;
  const warningCount = issues.filter(i => i.severity === "WARNING").length;

  return {
    success: true,
    data: validData,
    issues,
    metrics: {
      durationMs,
      errorCount: 0,
      warningCount
    }
  };
}
