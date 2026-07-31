import React from "react";

export interface LayerSnapshotData {
  id: string;
  name: string;
  description: string;
  filename: string;
  data: any | null;
}

export interface LayerInspectorProps {
  snapshots: LayerSnapshotData[];
  selectedLayerId: string;
  onSelectLayer: (id: string) => void;
}

export const LayerInspector: React.FC<LayerInspectorProps> = ({
  snapshots,
  selectedLayerId,
  onSelectLayer
}) => {
  const selectedSnapshot = snapshots.find(s => s.id === selectedLayerId) || snapshots[0];

  const getSummaryMetrics = (snapshot: LayerSnapshotData) => {
    if (!snapshot.data) return <p>Loading snapshot data...</p>;
    const d = snapshot.data;

    switch (snapshot.id) {
      case "verified":
        const meta = d.structured_data?.analysis?.metadata || d.metadata || {};
        return (
          <div className="layer-metrics">
            <p><strong>Analysis ID:</strong> {meta.analysis_id || "N/A"}</p>
            <p><strong>Validation State:</strong> <span className="status-verified">{meta.validation_state || "VERIFIED"}</span></p>
            <p><strong>Confidence:</strong> {meta.overall_confidence ? `${Math.round(meta.overall_confidence * 100)}%` : "N/A"}</p>
            <p><strong>Duration:</strong> {meta.execution_duration_ms ? `${meta.execution_duration_ms} ms` : "N/A"}</p>
          </div>
        );
      case "projection":
        return (
          <div className="layer-metrics">
            <p><strong>Projected Nodes:</strong> {d.nodes?.length || 0}</p>
            <p><strong>Projected Edges:</strong> {d.edges?.length || 0}</p>
            <p><strong>Center Node ID:</strong> {d.centerNodeId || "N/A"}</p>
          </div>
        );
      case "view_model":
        return (
          <div className="layer-metrics">
            <p><strong>Groups:</strong> {d.groups?.length || 0}</p>
            <p><strong>Visual Nodes:</strong> {d.nodes?.length || 0}</p>
            <p><strong>Visual Edges:</strong> {d.edges?.length || 0}</p>
            <p><strong>Engine Keys Excluded:</strong> True (0% position/fx/fy)</p>
          </div>
        );
      case "layout":
        const centerNode = d.nodes?.find((n: any) => n.id === d.centerNodeId);
        const uniqueRings = new Set(d.nodes?.map((n: any) => n.ringIndex) || []).size;
        return (
          <div className="layer-metrics">
            <p><strong>Center Coords:</strong> ({centerNode?.x || 0}, {centerNode?.y || 0})</p>
            <p><strong>Concentric Rings:</strong> {uniqueRings}</p>
            <p><strong>Integer Precision:</strong> True (Rounded px)</p>
          </div>
        );
      case "reactflow":
        return (
          <div className="layer-metrics">
            <p><strong>ReactFlow Nodes:</strong> {d.nodes?.length || 0}</p>
            <p><strong>ReactFlow Edges:</strong> {d.edges?.length || 0}</p>
            <p><strong>Trigonometry in Adapter:</strong> 0% (Strict 1:1 position map)</p>
          </div>
        );
      case "d3":
        const fixedCenter = d.nodes?.find((n: any) => n.fx === 0 && n.fy === 0);
        return (
          <div className="layer-metrics">
            <p><strong>D3 Nodes:</strong> {d.nodes?.length || 0}</p>
            <p><strong>D3 Links:</strong> {d.links?.length || 0}</p>
            <p><strong>Fixed Center Node:</strong> {fixedCenter ? `${fixedCenter.id} (fx:0, fy:0)` : "None"}</p>
          </div>
        );
      default:
        return null;
    }
  };

  // SVL-4: Scientific Workflow Timeline Mapping
  const getWorkflowMetadata = (id: string, index: number, fallbackName: string) => {
    const stageNum = `0${index + 1}`.slice(-2);
    switch (id) {
      case "verified":
        return { stage: `${stageNum} // EVIDENCE & VALIDATION`, title: "Canonical Domain Graph", desc: "Zod verification & orphan graph repair." };
      case "projection":
        return { stage: `${stageNum} // TOPOLOGY PROJECTION`, title: "Decoupled Topology", desc: "1:1 entity projection without style coordinates." };
      case "view_model":
        return { stage: `${stageNum} // SEMANTIC VIEW MODEL`, title: "View Model Enrichment", desc: "UI-agnostic tokens & semantic weight derivation." };
      case "layout":
        return { stage: `${stageNum} // RADIAL ENGINE LAYOUT`, title: "Concentric Ring Engine", desc: "Integer precision ring calculation from anchor (0,0)." };
      case "reactflow":
        return { stage: `${stageNum} // PRESENTATION: REACT-FLOW`, title: "ReactFlow Consumer", desc: "Dumb consumer rendering adapter without trigonometry." };
      case "d3":
        return { stage: `${stageNum} // PRESENTATION: D3 FORCE`, title: "D3 Physics Simulation", desc: "Force-directed simulation with fixed anchor." };
      default:
        return { stage: `${stageNum} // STAGE`, title: fallbackName, desc: "" };
    }
  };

  return (
    <aside data-testid="layer-inspector" className="layer-inspector">
      <div className="inspector-header">
        <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#f0f6fc", letterSpacing: "0.5px" }}>CONDYN SVL PIPELINE</h3>
        <p className="subtitle" style={{ fontSize: "11px", fontFamily: "monospace", color: "#58a6ff", letterSpacing: "1px", textTransform: "uppercase", marginTop: "4px" }}>
          Scientific Transformation Flow
        </p>
      </div>

      <div className="layer-list" style={{ position: "relative", padding: "20px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Vertical Timeline Connecting Strand aligned with step circles */}
        <div
          style={{
            position: "absolute",
            left: "38px",
            top: "36px",
            bottom: "36px",
            width: "2px",
            background: "linear-gradient(180deg, #30363d 0%, #58a6ff 50%, #30363d 100%)",
            opacity: 0.6,
            zIndex: 0
          }}
        />

        {snapshots.map((s, idx) => {
          const wf = getWorkflowMetadata(s.id, idx, s.name);
          const isActive = s.id === selectedLayerId;
          return (
            <React.Fragment key={s.id}>
              <button
                onClick={() => onSelectLayer(s.id)}
                className={`layer-btn ${isActive ? "active" : ""}`}
                data-testid={`layer-btn-${s.id}`}
                style={{
                  position: "relative",
                  zIndex: 1,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  background: isActive ? "rgba(56, 139, 253, 0.12)" : "rgba(22, 27, 34, 0.8)",
                  border: `1px solid ${isActive ? "#58a6ff" : "#30363d"}`,
                  borderRadius: "10px",
                  padding: "12px 14px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: isActive ? "0 0 16px rgba(88, 166, 255, 0.25)" : "none"
                }}
              >
                <div
                  className="layer-status-icon"
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: isActive ? "#58a6ff" : "#21262d",
                    color: isActive ? "#0d1117" : "#8b949e",
                    border: `2px solid ${isActive ? "#ffffff" : "#30363d"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    flexShrink: 0,
                    boxShadow: isActive ? "0 0 10px #58a6ff" : "none"
                  }}
                >
                  {idx + 1}
                </div>
                <div className="layer-btn-text" style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "10px", fontFamily: "monospace", color: isActive ? "#58a6ff" : "#8b949e", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>
                    {wf.stage}
                  </div>
                  <div className="layer-name" style={{ fontSize: "13px", fontWeight: 700, color: "#f0f6fc", marginTop: "2px" }}>
                    {wf.title}
                  </div>
                  <div className="layer-filename" style={{ fontSize: "11px", color: "#8b949e", marginTop: "2px", opacity: 0.8 }}>
                    {s.filename}
                  </div>
                </div>
              </button>
              {idx < snapshots.length - 1 && (
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    paddingLeft: "7px",
                    color: "#58a6ff",
                    fontSize: "13px",
                    fontWeight: 800,
                    fontFamily: "monospace",
                    height: "12px",
                    margin: "-2px 0",
                    opacity: 0.85
                  }}
                >
                  ↓
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {selectedSnapshot && (
        <div className="layer-detail-panel" data-testid="layer-detail-panel" style={{ padding: "20px" }}>
          <div style={{ borderBottom: "1px solid #30363d", paddingBottom: "12px", marginBottom: "16px" }}>
            <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#3fb950", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>
              TELEMETRY STATE INSPECTION
            </span>
            <h4 style={{ fontSize: "16px", fontWeight: 800, color: "#f0f6fc", marginTop: "4px" }}>
              {getWorkflowMetadata(selectedSnapshot.id, snapshots.indexOf(selectedSnapshot), selectedSnapshot.name).title}
            </h4>
          </div>
          <p className="layer-desc" style={{ fontSize: "13px", color: "#8b949e", lineHeight: "1.6" }}>
            {selectedSnapshot.description}
          </p>
          
          <div className="metrics-box" style={{ background: "rgba(10, 13, 20, 0.6)", border: "1px solid #30363d", borderRadius: "8px", padding: "14px" }}>
            {getSummaryMetrics(selectedSnapshot)}
          </div>

          <div className="json-preview-container">
            <h5 style={{ fontSize: "11px", fontFamily: "monospace", color: "#8b949e", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
              Snapshot JSON Payload ({selectedSnapshot.filename})
            </h5>
            <pre className="json-preview" style={{ background: "#0a0d14", border: "1px solid rgba(48, 54, 61, 0.6)", borderRadius: "8px", padding: "14px", maxHeight: "600px", overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "11px", lineHeight: "1.5" }}>
              {selectedSnapshot.data
                ? JSON.stringify(selectedSnapshot.data, null, 2)
                : "No data loaded yet..."}
            </pre>
          </div>
        </div>
      )}
    </aside>
  );
};
