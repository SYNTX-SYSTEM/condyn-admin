'use client';
import { ReactFlow, Background, Controls, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ReactFlowNode, ReactFlowEdge } from '@/types/topology';
import PropagationEdge from './PropagationEdge';

// Register custom edge types
const edgeTypes = {
  propagation: PropagationEdge,
};

interface TopologyGraphProps {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  onNodeClick?: (nodeId: string) => void;
}

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
        edgeTypes={edgeTypes}
        onNodeClick={handleNodeClick}
        fitView
        style={{ background: 'transparent' }}
      >
        <Background 
          color="#E5E7EB" 
          gap={20}
          size={1}
        />
        <Controls 
          style={{ 
            background: 'rgba(255, 255, 255, 0.9)', 
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
          }} 
        />
      </ReactFlow>
    </div>
  );
}
