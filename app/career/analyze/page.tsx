'use client';

import React, { useState } from "react";
import { Sidebar } from "../../components/career/Sidebar";
import { Inspector } from "../../components/career/Inspector";
import { ReactFlowCareerGraph } from "../../components/career/ReactFlowCareerGraph";
import { ReactFlowNode, ReactFlowEdge, ReactFlowGraph } from "../../../lib/career/adapters/react-flow";
import "../../career-test/career-demo.css";

interface StagedDocument {
  title: string;
  content: string;
}

interface AnalysisResponse {
  success: boolean;
  status: string;
  analysisId?: string;
  metadata?: any;
  reactFlowGraph?: ReactFlowGraph;
  issues?: { code: string; message: string }[];
}

/**
 * Client Live Analysis Dashboard ("Dumb Consumer").
 * Strictly communicates with Server Boundary API Route (/api/career/analyze).
 * Performs ZERO Zod schema validation, ZERO repository calls, ZERO LLM SDK imports, and ZERO layout calculation.
 */
export default function LiveCareerAnalysisPage() {
  const [stagedDocs, setStagedDocs] = useState<StagedDocument[]>([]);
  const [docTitle, setDocTitle] = useState<string>("Cloud Architect CV");
  const [docContent, setDocContent] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<{ code: string; message: string }[]>([]);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ReactFlowEdge | null>(null);

  const handleAddDocument = () => {
    if (!docContent.trim()) return;
    setStagedDocs([...stagedDocs, { title: docTitle || `Document ${stagedDocs.length + 1}`, content: docContent }]);
    setDocTitle("");
    setDocContent("");
  };

  const handleRemoveDocument = (index: number) => {
    setStagedDocs(stagedDocs.filter((_, i) => i !== index));
  };

  const handleStartAnalysis = async () => {
    const docsToSubmit = [...stagedDocs];
    if (docContent.trim()) {
      docsToSubmit.push({ title: docTitle || `Document ${docsToSubmit.length + 1}`, content: docContent });
    }

    if (docsToSubmit.length === 0) return;

    setLoading(true);
    setError(null);
    setIssues([]);
    setResult(null);

    try {
      const res = await fetch("/api/career/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: docsToSubmit })
      });

      const data: AnalysisResponse = await res.json();

      if (!res.ok || !data.success) {
        setError("Pipeline Execution or Validation Error");
        setIssues(data.issues || [{ code: "ERR_UNKNOWN", message: "Unknown analysis rejection." }]);
        setLoading(false);
        return;
      }

      setResult(data);
      setLoading(false);
    } catch (err: any) {
      console.error("Client fetch error:", err);
      setError("Network or Server Route Connection Failure");
      setIssues([{ code: "ERR_NETWORK", message: err.message || "Failed to connect to /api/career/analyze" }]);
      setLoading(false);
    }
  };

  const hasInput = docContent.trim().length > 0 || stagedDocs.length > 0;

  return (
    <div className="demo-page-container">
      <header className="demo-header">
        <div className="demo-title">
          <h1>CONDYN Live Career Analysis — Step 7 Server Boundary Flow</h1>
          <p>Strict Server-Side Pipeline Execution &bull; Zero Client-Side Keys/Zod/Repo &bull; 100% Dumb UI Consumer</p>
        </div>
        <div className="demo-badge" style={{ background: "#238636", color: "#ffffff", borderColor: "#2ea043" }}>
          Step 7 Live Engine
        </div>
      </header>

      {loading ? (
        <div style={{ padding: "80px 40px", textAlign: "center" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 24px auto",
              borderRadius: "50%",
              border: "4px solid #58a6ff",
              borderTopColor: "transparent",
              animation: "spin 1s linear infinite"
            }}
          />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h2 style={{ color: "#f0f6fc", marginBottom: "8px" }}>Orchestrating Live Inference & Verification...</h2>
          <p style={{ color: "#8b949e", maxWidth: "600px", margin: "0 auto" }}>
            1. Ingesting Documents &bull; 2. Executing Inference Provider &bull; 3. Verifying Zod Integrity &bull; 4. Calculating Radial Topology
          </p>
        </div>
      ) : result && result.reactFlowGraph ? (
        <div>
          <div style={{ padding: "12px 24px", background: "#161b22", borderBottom: "1px solid #30363d", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ color: "#58a6ff", fontWeight: 700, marginRight: "12px" }}>✓ ANALYSIS VERIFIED</span>
              <span style={{ color: "#8b949e", fontSize: "13px" }}>ID: <code style={{ color: "#f0f6fc" }}>{result.analysisId}</code> &bull; Source Documents: {result.metadata?.document_count || result.metadata?.source_document_count || stagedDocs.length || 1}</span>
            </div>
            <button
              onClick={() => {
                setResult(null);
                setSelectedNode(null);
                setSelectedEdge(null);
              }}
              style={{
                background: "#21262d",
                color: "#c9d1d9",
                border: "1px solid #30363d",
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              ← Neue Analyse starten
            </button>
          </div>
          <div className="demo-grid" style={{ height: "calc(100vh - 120px)" }}>
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
      ) : (
        <div style={{ maxWidth: "800px", margin: "40px auto", padding: "0 24px" }}>
          <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "12px", padding: "32px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            <h2 style={{ fontSize: "20px", color: "#f0f6fc", marginBottom: "8px" }}>Lebenslauf oder Profil-Text eingeben</h2>
            <p style={{ fontSize: "14px", color: "#8b949e", marginBottom: "24px" }}>
              Füge Text oder Markdown aus Lebensläufen, Projektbeurteilungen oder Zielvereinbarungen ein. Die Serverseite übernimmt Validierung, Reparatur, Stempelung und radiales Graph-Mapping.
            </p>

            {error && (
              <div style={{ background: "rgba(248, 81, 73, 0.15)", border: "1px solid #f85149", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
                <h4 style={{ color: "#ff7b72", margin: "0 0 8px 0", fontSize: "14px" }}>{error}</h4>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "#f0f6fc", fontSize: "13px" }}>
                  {issues.map((iss, idx) => (
                    <li key={idx}><strong>{iss.code}:</strong> {iss.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "#c9d1d9", fontWeight: 600, marginBottom: "6px" }}>
                Dokumententitel (Optional)
              </label>
              <input
                type="text"
                data-testid="doc-title-input"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="z.B. Senior DevOps CV 2026"
                style={{
                  width: "100%",
                  background: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: "6px",
                  padding: "10px 14px",
                  color: "#f0f6fc",
                  fontSize: "14px"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", color: "#c9d1d9", fontWeight: 600, marginBottom: "6px" }}>
                Text / Markdown Inhalt
              </label>
              <textarea
                data-testid="doc-content-textarea"
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder="Füge hier den Lebenslauf- oder Profiltext ein..."
                rows={8}
                style={{
                  width: "100%",
                  background: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: "6px",
                  padding: "12px 14px",
                  color: "#f0f6fc",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  lineHeight: "1.5",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: stagedDocs.length > 0 ? "24px" : "32px" }}>
              <button
                type="button"
                data-testid="add-doc-button"
                onClick={handleAddDocument}
                disabled={!docContent.trim()}
                style={{
                  background: "#21262d",
                  color: docContent.trim() ? "#58a6ff" : "#484f58",
                  border: "1px solid #30363d",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: docContent.trim() ? "pointer" : "not-allowed"
                }}
              >
                + Dokument zur Liste hinzufügen
              </button>
            </div>

            {stagedDocs.length > 0 && (
              <div style={{ marginBottom: "32px", background: "#0d1117", border: "1px solid #30363d", borderRadius: "8px", padding: "16px" }}>
                <h4 style={{ fontSize: "13px", color: "#8b949e", margin: "0 0 12px 0", textTransform: "uppercase" }}>
                  Vorbereitete Dokumente ({stagedDocs.length})
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {stagedDocs.map((doc, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#161b22", padding: "10px 14px", borderRadius: "6px", border: "1px solid #21262d" }}>
                      <div>
                        <strong style={{ color: "#f0f6fc", fontSize: "13px" }}>{doc.title}</strong>
                        <span style={{ color: "#8b949e", fontSize: "12px", marginLeft: "12px" }}>({doc.content.length} Zeichen)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument(idx)}
                        style={{ background: "transparent", border: "none", color: "#ff7b72", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                      >
                        Entfernen
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              data-testid="start-analysis-button"
              onClick={handleStartAnalysis}
              disabled={!hasInput || loading}
              style={{
                width: "100%",
                background: hasInput && !loading ? "#238636" : "#21262d",
                color: hasInput && !loading ? "#ffffff" : "#484f58",
                border: "1px solid",
                borderColor: hasInput && !loading ? "#2ea043" : "#30363d",
                padding: "14px",
                borderRadius: "8px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: hasInput && !loading ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                boxShadow: hasInput && !loading ? "0 4px 12px rgba(35, 134, 54, 0.3)" : "none"
              }}
            >
              Analyse starten &bull; E2E Pipeline Ausführen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
