/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * RUNTIME INTEGRITY VALIDATOR (`lib/career/validator.ts`)
 * 
 * Status: ARCHITECTURE FREEZE v1.0 / KANONISCHER VERTRAG
 * Scope: Runtime verification, structural integrity, semantic rules, and partial graph repair.
 * Architecture: Phase 2.2 Schema Validation (JSON Parse & safeParse issue transformation).
 */

import { z } from "zod";
import { CanonicalCareerAnalysis, CanonicalCareerAnalysisSchema } from "./schema";

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

export interface ValidationResult<T = CanonicalCareerAnalysis> {
  success: boolean;
  data?: T;
  issues: ValidationIssue[];
  metrics: {
    durationMs: number;
    errorCount: number;
    warningCount: number;
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

  // TODO [Phase 2.3]: Referential Integrity Check (Index all IDs, detect orphan edges without repair)
  // TODO [Phase 2.4]: Semantic Rules (Grammar, 12 Sections, Role -> Org hierarchy, Score Bounds, Evidence, DAG check)
  // TODO [Phase 2.5]: Partial Graph Repair (Apply WARN_ORPHAN_EDGE_REMOVED edge removal without mutating other fields)
  // TODO [Phase 2.6]: Validator Stamping (Set validation.status = PASSED, metadata.validation_state = VERIFIED, preserve overall_confidence)

  const durationMs = Date.now() - startTime;
  const errorCount = issues.filter(i => i.severity === "ERROR").length;
  const warningCount = issues.filter(i => i.severity === "WARNING").length;

  return {
    success: true,
    data: parseResult.data,
    issues,
    metrics: {
      durationMs,
      errorCount,
      warningCount
    }
  };
}
