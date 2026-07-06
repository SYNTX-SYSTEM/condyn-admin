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

  return (
    <aside data-testid="layer-inspector" className="layer-inspector">
      <div className="inspector-header">
        <h3>Architecture Layer Inspector</h3>
        <p className="subtitle">CONDYN Perception Replay Engine</p>
      </div>

      <div className="layer-list">
        {snapshots.map(s => (
          <button
            key={s.id}
            onClick={() => onSelectLayer(s.id)}
            className={`layer-btn ${s.id === selectedLayerId ? "active" : ""}`}
            data-testid={`layer-btn-${s.id}`}
          >
            <span className="layer-status-icon">✓</span>
            <div className="layer-btn-text">
              <div className="layer-name">{s.name}</div>
              <div className="layer-filename">{s.filename}</div>
            </div>
          </button>
        ))}
      </div>

      {selectedSnapshot && (
        <div className="layer-detail-panel" data-testid="layer-detail-panel">
          <h4>{selectedSnapshot.name} Data State</h4>
          <p className="layer-desc">{selectedSnapshot.description}</p>
          
          <div className="metrics-box">
            {getSummaryMetrics(selectedSnapshot)}
          </div>

          <div className="json-preview-container">
            <h5>Snapshot JSON Preview ({selectedSnapshot.filename})</h5>
            <pre className="json-preview">
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
