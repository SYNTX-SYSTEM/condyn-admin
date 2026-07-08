/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * STEP 13: GRAPH DIFF & EVOLUTION ENGINE (`lib/career/diff.ts`)
 * 
 * Status: Phase 13 TDD Green Implementation
 * Scope: Server-side ontological comparison of two VerifiedCareerAnalysis records.
 * Calculates structural entity shifts, relationship evolutions, confidence deltas, and evidence accumulation
 * across all 9 domain arrays without mutating inputs or leaking into UI/Trigonometrical layout layers.
 */

import { VerifiedCareerAnalysis } from "./types";

export type EntityDeltaType = "ADDED_ENTITY" | "REMOVED_ENTITY" | "MODIFIED_ENTITY";
export type RelationshipDeltaType = "ADDED_RELATIONSHIP" | "REMOVED_RELATIONSHIP" | "MODIFIED_RELATIONSHIP";
export type ScoreDeltaType = "CONFIDENCE_DELTA";
export type EvidenceDeltaType = "EVIDENCE_DELTA";

export interface EntityDelta {
  type: EntityDeltaType;
  entityId: string;
  entityType: string;
  name: string;
  domainArray: string;
  baseValue?: unknown;
  targetValue?: unknown;
}

export interface RelationshipDelta {
  type: RelationshipDeltaType;
  sourceId: string;
  targetId: string;
  relationType: string;
  baseWeight?: number;
  targetWeight?: number;
}

export interface ScoreDelta {
  type: ScoreDeltaType;
  entityId?: string;
  domainArray?: string;
  baseConfidence: number;
  targetConfidence: number;
  delta: number;
}

export interface EvidenceDelta {
  type: EvidenceDeltaType;
  entityId: string;
  docId: string;
  location?: string;
  contextQuote: string;
  evidenceScore: number;
}

export interface GraphDiffResult {
  baseAnalysisId: string;
  targetAnalysisId: string;
  summary: string;
  entityDeltas: EntityDelta[];
  relationshipDeltas: RelationshipDelta[];
  scoreDeltas: ScoreDelta[];
  evidenceDeltas: EvidenceDelta[];
}

const DOMAIN_ARRAYS = [
  "documents",
  "capabilities",
  "domains",
  "organization_classes",
  "organizations",
  "roles",
  "opportunities",
  "strategies",
  "search_queries"
] as const;

type DomainArrayName = typeof DOMAIN_ARRAYS[number];

/**
 * Computes the canonical ontological diff between two VERIFIED career analyses.
 * Strictly enforces that both analyses are in the "VERIFIED" validation state.
 */
export function computeGraphDiff(
  baseAnalysis: VerifiedCareerAnalysis,
  targetAnalysis: VerifiedCareerAnalysis
): GraphDiffResult {
  const baseState = baseAnalysis?.structured_data?.analysis?.metadata?.validation_state;
  const targetState = targetAnalysis?.structured_data?.analysis?.metadata?.validation_state;

  if (baseState !== "VERIFIED" || targetState !== "VERIFIED") {
    throw new Error(`ERR_UNVERIFIED_ANALYSIS_DIFF: Cannot compute diff on unverified analyses (Base: ${baseState || "MISSING"}, Target: ${targetState || "MISSING"}).`);
  }

  const baseAnalysisId = baseAnalysis.structured_data.analysis.metadata.analysis_id || "ANL_BASE_UNKNOWN";
  const targetAnalysisId = targetAnalysis.structured_data.analysis.metadata.analysis_id || "ANL_TARGET_UNKNOWN";

  const entityDeltas: EntityDelta[] = [];
  const relationshipDeltas: RelationshipDelta[] = [];
  const scoreDeltas: ScoreDelta[] = [];
  const evidenceDeltas: EvidenceDelta[] = [];

  // 1. Overall Confidence Delta
  const baseOverall = baseAnalysis.structured_data.analysis.metadata.overall_confidence ?? 1.0;
  const targetOverall = targetAnalysis.structured_data.analysis.metadata.overall_confidence ?? 1.0;
  if (baseOverall !== targetOverall) {
    scoreDeltas.push({
      type: "CONFIDENCE_DELTA",
      baseConfidence: baseOverall,
      targetConfidence: targetOverall,
      delta: Number((targetOverall - baseOverall).toFixed(4))
    });
  }

  // 2. Iterate across all 9 domain arrays
  for (const arrayName of DOMAIN_ARRAYS) {
    const baseList: any[] = (baseAnalysis.structured_data.analysis as any)[arrayName] || [];
    const targetList: any[] = (targetAnalysis.structured_data.analysis as any)[arrayName] || [];

    const baseMap = new Map<string, any>();
    for (const item of baseList) {
      if (item?.entity_id) baseMap.set(item.entity_id, item);
    }

    const targetMap = new Map<string, any>();
    for (const item of targetList) {
      if (item?.entity_id) targetMap.set(item.entity_id, item);
    }

    // Check for ADDED_ENTITY
    for (const [id, targetItem] of targetMap.entries()) {
      if (!baseMap.has(id)) {
        entityDeltas.push({
          type: "ADDED_ENTITY",
          entityId: id,
          entityType: targetItem?.identity?.type || "UNKNOWN",
          name: targetItem?.identity?.name || id,
          domainArray: arrayName,
          targetValue: targetItem
        });
      }
    }

    // Check for REMOVED_ENTITY
    for (const [id, baseItem] of baseMap.entries()) {
      if (!targetMap.has(id)) {
        entityDeltas.push({
          type: "REMOVED_ENTITY",
          entityId: id,
          entityType: baseItem?.identity?.type || "UNKNOWN",
          name: baseItem?.identity?.name || id,
          domainArray: arrayName,
          baseValue: baseItem
        });
      }
    }

    // Check for MODIFIED_ENTITY, relationships, score, and evidence on matching entities
    for (const [id, targetItem] of targetMap.entries()) {
      const baseItem = baseMap.get(id);
      if (!baseItem) continue;

      // A) Orthogonal MODIFIED_ENTITY: Only trigger if identity or properties change
      const identityChanged = JSON.stringify(baseItem.identity || {}) !== JSON.stringify(targetItem.identity || {});
      const propertiesChanged = JSON.stringify(baseItem.properties || {}) !== JSON.stringify(targetItem.properties || {});

      if (identityChanged || propertiesChanged) {
        entityDeltas.push({
          type: "MODIFIED_ENTITY",
          entityId: id,
          entityType: targetItem?.identity?.type || "UNKNOWN",
          name: targetItem?.identity?.name || id,
          domainArray: arrayName,
          baseValue: baseItem,
          targetValue: targetItem
        });
      }

      // B) Confidence Delta
      const baseConf = baseItem.confidence ?? 1.0;
      const targetConf = targetItem.confidence ?? 1.0;
      if (baseConf !== targetConf) {
        scoreDeltas.push({
          type: "CONFIDENCE_DELTA",
          entityId: id,
          domainArray: arrayName,
          baseConfidence: baseConf,
          targetConfidence: targetConf,
          delta: Number((targetConf - baseConf).toFixed(4))
        });
      }

      // C) Relationship Deltas
      const baseRels: any[] = baseItem.relationships || [];
      const targetRels: any[] = targetItem.relationships || [];

      const baseRelMap = new Map<string, any>();
      for (const r of baseRels) {
        if (r?.target_id && r?.relation_type) {
          baseRelMap.set(`${r.target_id}:${r.relation_type}`, r);
        }
      }

      const targetRelMap = new Map<string, any>();
      for (const r of targetRels) {
        if (r?.target_id && r?.relation_type) {
          targetRelMap.set(`${r.target_id}:${r.relation_type}`, r);
        }
      }

      for (const [relKey, targetRel] of targetRelMap.entries()) {
        const baseRel = baseRelMap.get(relKey);
        if (!baseRel) {
          relationshipDeltas.push({
            type: "ADDED_RELATIONSHIP",
            sourceId: id,
            targetId: targetRel.target_id,
            relationType: targetRel.relation_type,
            targetWeight: targetRel.weight
          });
        } else if (baseRel.weight !== targetRel.weight) {
          relationshipDeltas.push({
            type: "MODIFIED_RELATIONSHIP",
            sourceId: id,
            targetId: targetRel.target_id,
            relationType: targetRel.relation_type,
            baseWeight: baseRel.weight,
            targetWeight: targetRel.weight
          });
        }
      }

      for (const [relKey, baseRel] of baseRelMap.entries()) {
        if (!targetRelMap.has(relKey)) {
          relationshipDeltas.push({
            type: "REMOVED_RELATIONSHIP",
            sourceId: id,
            targetId: baseRel.target_id,
            relationType: baseRel.relation_type,
            baseWeight: baseRel.weight
          });
        }
      }

      // D) Evidence Deltas
      const baseEvs: any[] = baseItem.evidence || [];
      const targetEvs: any[] = targetItem.evidence || [];

      const baseEvSet = new Set<string>();
      for (const ev of baseEvs) {
        if (ev?.doc_id && ev?.context_quote) {
          baseEvSet.add(`${ev.doc_id}:${ev.context_quote}`);
        }
      }

      for (const ev of targetEvs) {
        if (ev?.doc_id && ev?.context_quote) {
          const key = `${ev.doc_id}:${ev.context_quote}`;
          if (!baseEvSet.has(key)) {
            evidenceDeltas.push({
              type: "EVIDENCE_DELTA",
              entityId: id,
              docId: ev.doc_id,
              location: ev.location,
              contextQuote: ev.context_quote,
              evidenceScore: ev.evidence_score ?? 1.0
            });
          }
        }
      }
    }
  }

  const totalDeltas = entityDeltas.length + relationshipDeltas.length + scoreDeltas.length + evidenceDeltas.length;
  let summary = "";
  if (totalDeltas === 0) {
    summary = `No structural or scoring differences between base ${baseAnalysisId} and target ${targetAnalysisId}.`;
  } else {
    summary = `Graph Diff ${baseAnalysisId} -> ${targetAnalysisId}: ${entityDeltas.length} entity shifts, ${relationshipDeltas.length} relationship shifts, ${scoreDeltas.length} confidence shifts, ${evidenceDeltas.length} evidence additions.`;
  }

  return {
    baseAnalysisId,
    targetAnalysisId,
    summary,
    entityDeltas,
    relationshipDeltas,
    scoreDeltas,
    evidenceDeltas
  };
}
