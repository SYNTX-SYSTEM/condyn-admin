'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Sidebar } from "../../../components/career/Sidebar";
import { Inspector } from "../../../components/career/Inspector";
import { ReactFlowCareerGraph } from "../../../components/career/ReactFlowCareerGraph";
import { ReactFlowNode, ReactFlowEdge, ReactFlowGraph } from "../../../../lib/career/adapters/react-flow";
import "../../../career-test/career-demo.css";

interface AnalysisDetailResponse {
  success: boolean;
  status: string;
  analysisId?: string;
  metadata?: any;
  analysis?: any;
  reactFlowGraph?: ReactFlowGraph;
  issues?: { code: string; message: string }[];
}

/**
 * Historical Analysis Detail Page (/career/analyses/[analysisId]).
 * Loads full canonical VerifiedCareerAnalysis and precomputed ReactFlow graph from server route.
 * Strictly adheres to "Dumb Consumer" boundary (no layout calculation, no DB or Drizzle imports).
 */
export default function CareerAnalysisDetailPage() {
  const params = useParams();
  const analysisId = params?.analysisId as string;

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisDetailResponse | null>(null);

  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ReactFlowEdge | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      if (!analysisId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/career/analyses/${analysisId}`);
        const data = await res.json();
        if (data.success && data.reactFlowGraph) {
          setResult(data);
        } else {
          setError(data.issues?.[0]?.message || `Analysis "${analysisId}" could not be loaded.`);
        }
      } catch (err: any) {
        setError(err.message || "Network error loading analysis detail.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [analysisId]);

  if (loading) {
    return (
      <div className="demo-page-container">
        <header className="demo-header">
          <div className="demo-title">
            <h1>🏛️ CONDYN Career Analysis — Analyse Detailansicht</h1>
            <p>Lade Graphendaten aus PostgreSQL...</p>
          </div>
        </header>
        <div style={{ padding: "60px", textAlign: "center", color: "#8b949e", fontSize: "16px" }}>
          ⏳ Lade gespeicherte Analyse <code>{analysisId}</code> und berechne radiales Layout...
        </div>
      </div>
    );
  }

  if (error || !result || !result.reactFlowGraph) {
    return (
      <div className="demo-page-container">
        <header className="demo-header">
          <div className="demo-title">
            <h1>🏛️ CONDYN Career Analysis — Analyse Detailansicht</h1>
            <p>Fehler beim Laden der Daten</p>
          </div>
          <Link
            href="/career/analyses"
            style={{
              background: "#21262d",
              border: "1px solid #30363d",
              color: "#58a6ff",
              padding: "6px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            ← Zurück zur Übersicht
          </Link>
        </header>
        <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", width: "100%" }}>
          <div
            style={{
              background: "rgba(248, 81, 73, 0.15)",
              border: "1px solid rgba(248, 81, 73, 0.4)",
              color: "#f85149",
              padding: "24px",
              borderRadius: "8px",
              textAlign: "center"
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>⚠️ Analyse nicht abrufbar</h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#c9d1d9" }}>{error}</p>
            <Link
              href="/career/analyses"
              style={{ color: "#58a6ff", textDecoration: "underline", fontSize: "14px", fontWeight: 600 }}
            >
              Historische Analysen anzeigen &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-page-container">
      <header className="demo-header">
        <div className="demo-title">
          <h1>🏛️ CONDYN Career Analysis — Analyse Detailansicht</h1>
          <p>
            Analyse ID: <strong>{result.analysisId}</strong> &bull; Status:{" "}
            <span style={{ color: "#3fb950", fontWeight: 700 }}>{result.status}</span> &bull; Konfidenz:{" "}
            {((result.metadata?.overall_confidence || 0) * 100).toFixed(0)}%
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link
            href="/career/analyses"
            style={{
              background: "#21262d",
              border: "1px solid #30363d",
              color: "#c9d1d9",
              padding: "6px 14px",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            ← Zurück zur Historie
          </Link>
          <Link
            href="/career/analyze"
            style={{
              background: "#238636",
              color: "#ffffff",
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            ➕ Neue Analyse
          </Link>
        </div>
      </header>

      <div className="demo-grid" style={{ height: "calc(100vh - 73px)" }}>
        <Sidebar graph={result.reactFlowGraph} />
        <div className="career-graph-main">
          <ReactFlowCareerGraph
            graph={result.reactFlowGraph}
            onSelectNode={(node) => {
              setSelectedNode(node);
              setSelectedEdge(null);
            }}
            onSelectEdge={(edge) => {
              setSelectedEdge(edge);
              setSelectedNode(null);
            }}
          />
        </div>
        <Inspector selectedNode={selectedNode} selectedEdge={selectedEdge} />
      </div>
    </div>
  );
}
