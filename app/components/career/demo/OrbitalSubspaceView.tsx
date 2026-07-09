"use client";

import React, { useState } from "react";
import { SIL_TOKENS } from "./tokens";

export type SemanticZoomLevel = 0 | 1 | 2 | 3 | 4;

export interface OrbitalSubspaceViewProps {
  stageId: string;
  stageName: string;
  subtitle?: string;
  zoomLevel: SemanticZoomLevel;
  onZoomChange?: (level: SemanticZoomLevel) => void;
}

interface SubCluster {
  id: string;
  title: string;
  confidence: string;
  evidenceCount: number;
  evidences: Array<{
    id: string;
    title: string;
    sourceType: "PDF" | "GitHub" | "Website";
    snippet: string;
  }>;
}

const DEMO_CLUSTERS: Record<string, SubCluster[]> = {
  "01": [
    {
      id: "cl-01-1",
      title: "Core Identity & Archetype",
      confidence: "98%",
      evidenceCount: 14,
      evidences: [
        { id: "ev-1", title: "Principal Systems Architect Profile", sourceType: "PDF", snippet: "Demonstrates 10+ years architecting distributed systems." }
      ]
    },
    {
      id: "cl-01-2",
      title: "Executive Technical Leadership",
      confidence: "94%",
      evidenceCount: 8,
      evidences: [
        { id: "ev-2", title: "Engineering Organization Scalability", sourceType: "PDF", snippet: "Managed cross-functional teams across 3 timezones." }
      ]
    }
  ],
  "02": [
    {
      id: "cl-02-1",
      title: "Distributed Architecture & Cloud",
      confidence: "97%",
      evidenceCount: 22,
      evidences: [
        { id: "ev-201", title: "Cloud-Native Microservices Spec", sourceType: "PDF", snippet: "Event-driven CQRS architecture design document." },
        { id: "ev-202", title: "Kubernetes Cluster Operator Engine", sourceType: "GitHub", snippet: "pkg/operator/reconciler.go lines 42-128" }
      ]
    },
    {
      id: "cl-02-2",
      title: "React & Semantic Frontend Systems",
      confidence: "99%",
      evidenceCount: 18,
      evidences: [
        { id: "ev-203", title: "SIL v2.5 / v3.0 Design System", sourceType: "GitHub", snippet: "app/components/career/demo/SemanticCareerIntelligenceField.tsx" }
      ]
    },
    {
      id: "cl-02-3",
      title: "AI Agentic Coding & Pipelines",
      confidence: "95%",
      evidenceCount: 15,
      evidences: [
        { id: "ev-204", title: "Career Analysis Multi-Source Engine", sourceType: "GitHub", snippet: "lib/career/adapter.ts & matching/demo-pool.ts" }
      ]
    }
  ]
};

function getClustersForStage(stageId: string): SubCluster[] {
  return DEMO_CLUSTERS[stageId] || [
    {
      id: `cl-${stageId}-1`,
      title: "Primary Field Competency Cluster",
      confidence: "96%",
      evidenceCount: 12,
      evidences: [
        {
          id: `ev-${stageId}-1`,
          title: "Verified Semantic Grounding Object",
          sourceType: "PDF",
          snippet: "Extracted verified evidence segment matching stage ontology."
        }
      ]
    },
    {
      id: `cl-${stageId}-2`,
      title: "Secondary Resonance Vector",
      confidence: "92%",
      evidenceCount: 9,
      evidences: [
        {
          id: `ev-${stageId}-2`,
          title: "Production System Reference",
          sourceType: "GitHub",
          snippet: "Repository commit log verification passed."
        }
      ]
    }
  ];
}

export function OrbitalSubspaceView({
  stageId,
  stageName,
  subtitle,
  zoomLevel,
  onZoomChange
}: OrbitalSubspaceViewProps) {
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);

  const clusters = getClustersForStage(stageId);
  const activeCluster = clusters.find((c) => c.id === selectedClusterId) || clusters[0];
  const activeEvidence =
    activeCluster?.evidences.find((e) => e.id === selectedEvidenceId) || activeCluster?.evidences[0];

  return (
    <div
      data-testid="orbital-subspace-view"
      style={{
        position: "relative",
        width: "740px",
        height: "680px",
        borderRadius: "16px",
        backgroundColor: "rgba(5, 10, 18, 0.94)",
        border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
        boxShadow: `0 0 55px rgba(56, 229, 255, 0.22), inset 0 0 40px rgba(56, 229, 255, 0.08)`,
        backdropFilter: "blur(16px)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        color: SIL_TOKENS.colors.textPrimary
      }}
    >
      {/* Subspace Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: `1px solid rgba(56, 229, 255, 0.25)`,
          paddingBottom: "14px",
          marginBottom: "20px"
        }}
      >
        <div>
          <div style={{ fontSize: "10px", color: SIL_TOKENS.colors.cyanActive, letterSpacing: "1.5px", fontWeight: 700 }}>
            ORBITAL SUBSPACE // ZOOM LEVEL {zoomLevel}
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "4px 0 0 0" }}>{stageName}</h2>
          {subtitle && <div style={{ fontSize: "12px", color: SIL_TOKENS.colors.textMuted }}>{subtitle}</div>}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {zoomLevel > 1 && (
            <button
              onClick={() => onZoomChange && onZoomChange((zoomLevel - 1) as SemanticZoomLevel)}
              style={{
                backgroundColor: "rgba(56, 229, 255, 0.14)",
                border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
                color: SIL_TOKENS.colors.cyanActive,
                fontSize: "10px",
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              ZOOM OUT
            </button>
          )}
        </div>
      </div>

      {/* LEVEL 1: Sub-Clusters */}
      {zoomLevel === 1 && (
        <div
          data-testid="zoom-level-1-clusters"
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "16px",
            alignContent: "start"
          }}
        >
          {clusters.map((cluster) => (
            <div
              key={cluster.id}
              data-testid="subspace-cluster"
              onClick={() => {
                setSelectedClusterId(cluster.id);
                if (onZoomChange) onZoomChange(2);
              }}
              style={{
                backgroundColor: "rgba(10, 18, 30, 0.85)",
                border: `1px solid rgba(56, 229, 255, 0.35)`,
                borderRadius: "10px",
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.25s ease"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "10px", color: SIL_TOKENS.colors.cyanActive, fontWeight: 700 }}>
                  CLUSTER NODE
                </span>
                <span style={{ fontSize: "10px", color: SIL_TOKENS.colors.textMuted }}>
                  CONF: <strong style={{ color: SIL_TOKENS.colors.textPrimary }}>{cluster.confidence}</strong>
                </span>
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>{cluster.title}</div>
              <div style={{ fontSize: "11px", color: SIL_TOKENS.colors.textMuted }}>
                {cluster.evidenceCount} Verified Evidence Objects
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LEVEL 2: Evidence Nodes */}
      {zoomLevel === 2 && activeCluster && (
        <div
          data-testid="zoom-level-2-evidence"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "14px"
          }}
        >
          <div style={{ fontSize: "11px", color: SIL_TOKENS.colors.cyanActive, fontWeight: 600 }}>
            CLUSTER: {activeCluster.title} ({activeCluster.evidences.length} PRIMARY EVIDENCES)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {activeCluster.evidences.map((ev) => (
              <div
                key={ev.id}
                data-testid="evidence-node"
                onClick={() => {
                  setSelectedEvidenceId(ev.id);
                  if (onZoomChange) onZoomChange(3);
                }}
                style={{
                  backgroundColor: "rgba(10, 18, 30, 0.85)",
                  border: `1px solid rgba(56, 229, 255, 0.45)`,
                  borderRadius: "8px",
                  padding: "14px",
                  cursor: "pointer"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "10px", color: SIL_TOKENS.colors.cyanActive, fontWeight: 700 }}>
                    [{ev.sourceType}] VERIFIED EVIDENCE NODE
                  </span>
                  <span style={{ fontSize: "10px", color: SIL_TOKENS.colors.textMuted }}>ID: {ev.id}</span>
                </div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{ev.title}</div>
                <div style={{ fontSize: "11px", color: SIL_TOKENS.colors.textMuted, marginTop: "4px" }}>
                  {ev.snippet}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LEVEL 3 / LEVEL 4: Source Inspection & Original Line Snippet */}
      {zoomLevel >= 3 && activeEvidence && (
        <div
          data-testid="zoom-l3-source"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            backgroundColor: "rgba(4, 8, 14, 0.95)",
            border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
            borderRadius: "10px",
            padding: "18px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "11px", color: SIL_TOKENS.colors.cyanActive, fontWeight: 700, letterSpacing: "1px" }}>
              L{zoomLevel} SOURCE INSPECTION // {activeEvidence.sourceType}
            </div>
            {zoomLevel === 3 && (
              <button
                onClick={() => onZoomChange && onZoomChange(4)}
                style={{
                  backgroundColor: "rgba(56, 229, 255, 0.18)",
                  border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
                  color: SIL_TOKENS.colors.cyanActive,
                  fontSize: "9px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "3px",
                  cursor: "pointer"
                }}
              >
                ZOOM TO ORIGINAL ATOM (L4)
              </button>
            )}
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700 }}>{activeEvidence.title}</div>
          <pre
            style={{
              backgroundColor: "rgba(0, 4, 10, 0.85)",
              border: `1px solid rgba(56, 229, 255, 0.25)`,
              borderRadius: "6px",
              padding: "14px",
              color: SIL_TOKENS.colors.cyanActive,
              fontSize: "12px",
              fontFamily: "monospace",
              overflowX: "auto"
            }}
          >
            {activeEvidence.snippet}
            {"\n\n// METADATA:\n// SYNTX Semantic Grounding ID: CONDYN-EVIDENCE-VERIFIED-492\n// Latency: 0.2ms | Signature Matching: PASSED"}
          </pre>
        </div>
      )}
    </div>
  );
}
