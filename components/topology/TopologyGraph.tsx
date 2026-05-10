'use client';
import { ReactFlow, Background, Controls, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ReactFlowNode, ReactFlowEdge } from '@/types/topology';

interface TopologyGraphProps {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  onNodeClick?: (nodeId: string) => void;
}

/**
 * DUMB Visual Field Renderer
 * 
 * Responsibilities:
 * - Render nodes and edges
 * - Handle zoom/pan interactions
 * - Pass click events up
 * 
 * NO business logic, interpretation, or signal calculation!
 */
export default function TopologyGraph({
  nodes,
  edges,
  onNodeClick,
}: TopologyGraphProps) {
  
  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    if (onNodeClick) {
      onNodeClick(node.id);
    }
  };

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={handleNodeClick}
        fitView
        style={{ background: 'transparent' }}
      >
        <Background 
          color="rgba(107, 155, 209, 0.1)" 
          gap={20}
        />
        <Controls 
          style={{ 
            background: 'rgba(10, 14, 39, 0.8)', 
            border: '1px solid rgba(107, 155, 209, 0.2)',
          }} 
        />
      </ReactFlow>
    </div>
  );
}
