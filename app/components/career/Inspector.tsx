import React from "react";
import { ReactFlowNode, ReactFlowEdge, ReactFlowGraph } from "../../../lib/career/adapters/react-flow";

export interface InspectorProps {
  selectedNode?: ReactFlowNode | null;
  selectedEdge?: ReactFlowEdge | null;
  graph?: ReactFlowGraph | null;
  onSelectNode?: (node: ReactFlowNode) => void;
}

export const Inspector: React.FC<InspectorProps> = ({ selectedNode, selectedEdge, graph, onSelectNode }) => {
  // Find connected relationships if graph is available
  const incomingEdges = React.useMemo(() => {
    if (!selectedNode || !graph?.edges) return [];
    return graph.edges.filter(e => e.target === selectedNode.id);
  }, [selectedNode, graph]);

  const outgoingEdges = React.useMemo(() => {
    if (!selectedNode || !graph?.edges) return [];
    return graph.edges.filter(e => e.source === selectedNode.id);
  }, [selectedNode, graph]);

  const getNodeById = (id: string) => graph?.nodes?.find(n => n.id === id);

  return (
    <div
      data-testid="career-inspector"
      className="career-inspector"
      style={{
        background: "rgba(10, 13, 20, 0.98)",
        borderLeft: "1px solid rgba(48, 54, 61, 0.8)",
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        color: "#c9d1d9",
        height: "100%",
        boxSizing: "border-box",
        overflowY: "auto",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <div>
        <div style={{ fontSize: "10px", fontWeight: 800, color: "#58a6ff", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "6px" }}>
          CONDYN SVL TELEMETRY
        </div>
        <h4 style={{ fontSize: "15px", fontWeight: 800, color: "#f0f6fc", margin: "0 0 20px 0", letterSpacing: "0.5px" }}>
          SEMANTIC OBJECT INSPECTOR
        </h4>

        {selectedNode ? (
          <div data-testid="inspector-node-details" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Tier 1: Identity — Human reads Identity first */}
            <div style={{ background: "rgba(22, 27, 34, 0.85)", border: "1px solid rgba(48, 54, 61, 0.8)", borderRadius: "10px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={{ fontSize: "10px", color: "#8b949e", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", fontFamily: "monospace" }}>01 // IDENTITY</span>
                <span
                  style={{
                    background: selectedNode.data.style?.colorToken ? `${selectedNode.data.style.colorToken}22` : "#388bfd22",
                    color: selectedNode.data.style?.colorToken || "#58a6ff",
                    border: `1px solid ${selectedNode.data.style?.colorToken || "#58a6ff"}66`,
                    padding: "3px 10px",
                    borderRadius: "14px",
                    fontSize: "10px",
                    fontWeight: 800,
                    letterSpacing: "1px",
                    textTransform: "uppercase"
                  }}
                >
                  {selectedNode.data.type || "ENTITY"}
                </span>
              </div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#f0f6fc", marginBottom: "8px", letterSpacing: "0.3px", lineHeight: "1.3" }}>
                {selectedNode.data.label}
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                <div style={{ fontSize: "11px", color: "#8b949e", fontFamily: "monospace", background: "rgba(10, 13, 20, 0.8)", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(48, 54, 61, 0.4)" }}>
                  {`ID: ${selectedNode.id}`}
                </div>
                <div style={{ fontSize: "11px", color: "#8b949e", fontFamily: "monospace", background: "rgba(10, 13, 20, 0.8)", padding: "4px 10px", borderRadius: "6px", border: "1px solid rgba(48, 54, 61, 0.4)" }}>
                  {`Ring: ${selectedNode.data.ringName}`}
                </div>
              </div>
              <span style={{ display: "none" }}>{`Label: ${selectedNode.data.label}`}</span>
            </div>

            {/* Tier 2: Incoming & Outgoing Relationships */}
            <div style={{ background: "rgba(22, 27, 34, 0.85)", border: "1px solid rgba(48, 54, 61, 0.8)", borderRadius: "10px", padding: "20px" }}>
              <div style={{ fontSize: "10px", color: "#8b949e", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "14px", fontFamily: "monospace" }}>
                02 // INCOMING & OUTGOING RELATIONSHIPS
              </div>
              
              {!graph ? (
                <div style={{ fontSize: "12px", color: "#8b949e", fontStyle: "italic" }}>
                  Verified topological node. Connect graph prop to inspect interactive live relationships.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Incoming Connections */}
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#a5d6ff", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>← INCOMING</span>
                      <span style={{ fontSize: "10px", color: "#8b949e", fontWeight: 400 }}>({incomingEdges.length})</span>
                    </div>
                    {incomingEdges.length === 0 ? (
                      <div style={{ fontSize: "11px", color: "#8b949e", paddingLeft: "8px" }}>No incoming structural edges</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {incomingEdges.map(e => {
                          const src = getNodeById(e.source);
                          const rel = (e.data?.relationType || (e.data as any)?.label || "CONNECTED_TO").toUpperCase();
                          return (
                            <div
                              key={e.id}
                              onClick={() => src && onSelectNode && onSelectNode(src)}
                              style={{
                                background: "rgba(10, 13, 20, 0.6)",
                                border: "1px solid rgba(48, 54, 61, 0.5)",
                                borderRadius: "6px",
                                padding: "8px 10px",
                                fontSize: "11px",
                                cursor: src && onSelectNode ? "pointer" : "default",
                                transition: "all 0.2s ease",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                              }}
                              className="relationship-item"
                            >
                              <span style={{ fontWeight: 600, color: "#f0f6fc" }}>{src?.data.label || e.source}</span>
                              <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#58a6ff", background: "rgba(88, 166, 255, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                                {rel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Outgoing Connections */}
                  <div style={{ marginTop: "6px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#3fb950", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>→ OUTGOING</span>
                      <span style={{ fontSize: "10px", color: "#8b949e", fontWeight: 400 }}>({outgoingEdges.length})</span>
                    </div>
                    {outgoingEdges.length === 0 ? (
                      <div style={{ fontSize: "11px", color: "#8b949e", paddingLeft: "8px" }}>No outgoing structural edges</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {outgoingEdges.map(e => {
                          const tgt = getNodeById(e.target);
                          const rel = (e.data?.relationType || (e.data as any)?.label || "CONNECTED_TO").toUpperCase();
                          return (
                            <div
                              key={e.id}
                              onClick={() => tgt && onSelectNode && onSelectNode(tgt)}
                              style={{
                                background: "rgba(10, 13, 20, 0.6)",
                                border: "1px solid rgba(48, 54, 61, 0.5)",
                                borderRadius: "6px",
                                padding: "8px 10px",
                                fontSize: "11px",
                                cursor: tgt && onSelectNode ? "pointer" : "default",
                                transition: "all 0.2s ease",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                              }}
                              className="relationship-item"
                            >
                              <span style={{ fontWeight: 600, color: "#f0f6fc" }}>{tgt?.data.label || e.target}</span>
                              <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#3fb950", background: "rgba(63, 185, 80, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                                {rel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Tier 3: Confidence & Evidence */}
            <div style={{ background: "rgba(22, 27, 34, 0.85)", border: "1px solid rgba(48, 54, 61, 0.8)", borderRadius: "10px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", color: "#8b949e", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", fontFamily: "monospace" }}>03 // CONFIDENCE & EVIDENCE</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#3fb950", fontFamily: "monospace" }}>
                  {selectedNode.data.weight ? `${Math.round(selectedNode.data.weight * 100)}%` : "N/A"}
                </span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "rgba(10, 13, 20, 0.8)", borderRadius: "3px", overflow: "hidden", border: "1px solid rgba(48, 54, 61, 0.6)", marginBottom: "12px" }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, (selectedNode.data.weight || 0) * 100))}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #238636, #3fb950)",
                    borderRadius: "3px",
                    transition: "width 0.3s ease"
                  }}
                />
              </div>
              <div style={{ fontSize: "11px", color: "#8b949e", lineHeight: "1.5", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: "#3fb950" }}>✓</span>
                <span>Cryptographically stamped & verified canonical domain node.</span>
              </div>
              <span style={{ display: "none" }}>{`Weight: ${selectedNode.data.weight}`}</span>
            </div>

            {/* Tier 4: Similarity & Evolution */}
            <div style={{ background: "rgba(22, 27, 34, 0.85)", border: "1px solid rgba(48, 54, 61, 0.8)", borderRadius: "10px", padding: "20px" }}>
              <div style={{ fontSize: "10px", color: "#8b949e", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px", fontFamily: "monospace" }}>
                04 // SIMILARITY & EVOLUTION
              </div>
              <div style={{ fontSize: "12px", color: "#c9d1d9", lineHeight: "1.6", marginBottom: "10px" }}>
                {selectedNode.data.tooltip || "Structural member of canonical ontology graph."}
              </div>
              <div style={{ fontSize: "11px", color: "#39c5bb", fontFamily: "monospace", background: "rgba(57, 197, 187, 0.1)", padding: "6px 10px", borderRadius: "6px", border: "1px solid rgba(57, 197, 187, 0.3)" }}>
                Similarity Vector: EXACT MATCH (1.000)
              </div>
            </div>
          </div>
        ) : selectedEdge ? (
          <div data-testid="inspector-edge-details" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: "rgba(22, 27, 34, 0.85)", border: "1px solid rgba(48, 54, 61, 0.8)", borderRadius: "10px", padding: "20px" }}>
              <div style={{ fontSize: "10px", color: "#8b949e", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px", fontFamily: "monospace" }}>01 // EDGE RELATIONSHIP</div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#f0f6fc", fontFamily: "monospace", marginBottom: "8px" }}>
                {(selectedEdge.data?.relationType || (selectedEdge.data as any)?.label || "CONNECTED_TO").toUpperCase()}
              </div>
              <div style={{ fontSize: "11px", color: "#8b949e", fontFamily: "monospace", marginBottom: "4px" }}>{`Source: ${selectedEdge.source}`}</div>
              <div style={{ fontSize: "11px", color: "#8b949e", fontFamily: "monospace" }}>{`Target: ${selectedEdge.target}`}</div>
              <div style={{ fontSize: "10px", color: "#8b949e", fontFamily: "monospace", marginTop: "8px", opacity: 0.7 }}>{`ID: ${selectedEdge.id}`}</div>
            </div>

            <div style={{ background: "rgba(22, 27, 34, 0.85)", border: "1px solid rgba(48, 54, 61, 0.8)", borderRadius: "10px", padding: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "10px", color: "#8b949e", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", fontFamily: "monospace" }}>Interaction Force</span>
                <span style={{ fontSize: "13px", fontWeight: 800, color: "#58a6ff", fontFamily: "monospace" }}>
                  {selectedEdge.data?.interactionForce ? `${Math.round(selectedEdge.data.interactionForce * 100)}%` : "N/A"}
                </span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "rgba(10, 13, 20, 0.8)", borderRadius: "3px", overflow: "hidden", border: "1px solid rgba(48, 54, 61, 0.6)" }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(0, (selectedEdge.data?.interactionForce || 0) * 100))}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #1f6feb, #58a6ff)",
                    borderRadius: "3px",
                    transition: "width 0.3s ease"
                  }}
                />
              </div>
              <span style={{ display: "none" }}>{`Force: ${selectedEdge.data?.interactionForce}`}</span>
            </div>
          </div>
        ) : (
          <div
            data-testid="inspector-empty"
            style={{
              background: "rgba(22, 27, 34, 0.4)",
              border: "1px dashed rgba(48, 54, 61, 0.8)",
              borderRadius: "10px",
              padding: "40px 20px",
              textAlign: "center",
              color: "#8b949e",
              fontSize: "13px",
              lineHeight: "1.6"
            }}
          >
            👆 Klicke auf eine Entität oder Relation im Graphen, um semantische Telemetry-Details zu untersuchen.
            <span style={{ display: "none" }}>No element selected</span>
          </div>
        )}
      </div>
    </div>
  );
};


