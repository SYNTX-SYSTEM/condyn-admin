'use client';

import { useState, useCallback } from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { TopologyData } from '@/types/topology';
import { transformToReactFlow } from '@/lib/topology/transformer';
import FieldSignature from './FieldSignature';
import StructuralInspector from './StructuralInspector';
import PropagationEdge from './PropagationEdge';

const edgeTypes = {
  propagation: PropagationEdge,
};

interface TopologyViewProps {
  data: TopologyData;
}

export default function TopologyView({ data }: TopologyViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const { nodes, edges } = transformToReactFlow(data);
  
  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNodeId(node.id);
  }, []);
  
  const selectedNode = selectedNodeId 
    ? nodes.find(n => n.id === selectedNodeId)
    : null;
  
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex',
      background: '#FFFFFF',
    }}>
      {/* Left Sidebar - Field Signature */}
      <FieldSignature
        company={data.company}
        network={data.network}
        nodeCount={data.network.nodes.length}
        signalCount={data.signals.length}
        linkCount={data.links.length}
        eventCount={data.events.length}
      />
      
      {/* Center - Topology Graph */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodeClick={onNodeClick}
            edgeTypes={edgeTypes}
            fitView
            minZoom={0.5}
            maxZoom={2}
          >
            <Background color="#E5E7EB" gap={16} />
            <Controls />
          </ReactFlow>
        </div>
      </div>
      
      {/* Right Panel - Structural Inspector */}
      {selectedNode && (
        <div style={{
          width: '280px',
          height: '100vh',
          flexShrink: 0,
          background: '#FFFFFF',
          borderLeft: '1px solid #E5E7EB',
        }}>
          <StructuralInspector
            nodeId={selectedNode.id}
            nodeType={selectedNode.data.nodeType}
            signals={data.signals}
          />
        </div>
      )}
    </div>
  );
}
