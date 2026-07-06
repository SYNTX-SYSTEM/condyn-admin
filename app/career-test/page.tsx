'use client';

import React, { useState, useEffect } from "react";
import { LayerInspector, LayerSnapshotData } from "../components/career/LayerInspector";
import { CareerGraph } from "../components/career/CareerGraph";
import { ReactFlowNode, ReactFlowEdge } from "../../lib/career/adapters/react-flow";
import "./career-demo.css";

export default function CareerArchitectureDemoPage() {
  const [snapshots, setSnapshots] = useState<LayerSnapshotData[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string>("verified");
  const [selectedNode, setSelectedNode] = useState<ReactFlowNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<ReactFlowEdge | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSnapshots() {
      try {
        const files = [
          {
            id: "verified",
            name: "1. Verified Analysis",
            filename: "01_verified.json",
            description: "Canonical domain record after runtime Zod schema verification, orphan graph repair, and stamp guard validation."
          },
          {
            id: "projection",
            name: "2. Topology Projection",
            filename: "02_projection.json",
            description: "Immutable 1:1 projection mapping domain entities into decoupled nodes and edges with deterministic angles."
          },
          {
            id: "view_model",
            name: "3. View Model Builder",
            filename: "03_view_model.json",
            description: "UI-agnostic presentation model enriched with style tokens, tooltips, and collapse flags without layout coordinates."
          },
          {
            id: "layout",
            name: "4. Radial Layout Layer",
            filename: "04_layout.json",
            description: "Engine-neutral coordinate calculator mapping rings with integer precision and center anchor at (0,0)."
          },
          {
            id: "reactflow",
            name: "5. ReactFlow Adapter",
            filename: "05_reactflow.json",
            description: "Strict 1:1 mapping into ReactFlow node and edge structures without trigonometry or re-inference."
          },
          {
            id: "d3",
            name: "6. D3 Force Adapter",
            filename: "06_d3.json",
            description: "Physics simulation graph structure assigning fx: 0 and fy: 0 strictly to the center anchor node."
          }
        ];

        const loaded: LayerSnapshotData[] = [];
        for (const f of files) {
          const res = await fetch(`/demo/${f.filename}`);
          if (!res.ok) {
            throw new Error(`Failed to fetch /demo/${f.filename} (HTTP ${res.status}). Run 'npx tsx scripts/demo-career-analysis.ts' first!`);
          }
          const data = await res.json();
          loaded.push({ ...f, data });
        }

        setSnapshots(loaded);
        setLoading(false);
      } catch (err: any) {
        console.error("Error loading demo snapshots:", err);
        setError(err.message || "Failed to load static snapshots.");
        setLoading(false);
      }
    }

    loadSnapshots();
  }, []);

  const reactFlowSnapshot = snapshots.find(s => s.id === "reactflow")?.data;

  return (
    <div className="demo-page-container">
      <header className="demo-header">
        <div className="demo-title">
          <h1>CONDYN Career Analysis Protocol v1.0 — Architecture Replay Demo</h1>
          <p>Strict "Dumb Consumer" Principle &bull; Zero Client-Side Pipeline Execution &bull; 100% Deterministic Replay</p>
        </div>
        <div className="demo-badge">
          Step 5.5 Replay Engine
        </div>
      </header>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h2>Loading static architecture snapshots from public/demo/...</h2>
        </div>
      ) : error ? (
        <div style={{ padding: "40px", color: "#ff7b72", textAlign: "center" }}>
          <h2>Replay Initialization Error</h2>
          <p>{error}</p>
          <p style={{ marginTop: "16px", color: "#8b949e" }}>
            Make sure you generated the snapshots by running:<br />
            <code>npx tsx scripts/demo-career-analysis.ts</code>
          </p>
        </div>
      ) : (
        <div className="demo-grid">
          <LayerInspector
            snapshots={snapshots}
            selectedLayerId={selectedLayerId}
            onSelectLayer={setSelectedLayerId}
          />
          {reactFlowSnapshot ? (
            <CareerGraph
              graph={reactFlowSnapshot}
              selectedNode={selectedNode}
              selectedEdge={selectedEdge}
              onSelectNode={(node) => {
                setSelectedNode(node);
                setSelectedEdge(null);
              }}
              onSelectEdge={(edge) => {
                setSelectedEdge(edge);
                setSelectedNode(null);
              }}
            />
          ) : (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <h3>No ReactFlow snapshot available.</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
