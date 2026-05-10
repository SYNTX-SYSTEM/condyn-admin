'use client';
import { useState } from 'react';
import type { TopologyData } from '@/types/topology';
import { transformToReactFlow } from '@/lib/topology/transformer';
import FieldSignature from './FieldSignature';
import TopologyGraph from './TopologyGraph';
import StructuralInspector from './StructuralInspector';

interface TopologyViewProps {
  data: TopologyData;
}

export default function TopologyView({ data }: TopologyViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  
  const { nodes, edges } = transformToReactFlow(data);
  
  const selectedNode = selectedNodeId 
    ? nodes.find(n => n.id === selectedNodeId)
    : null;

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh',
      background: '#FFFFFF',  // Weiß statt gradient
      color: '#1a1a1a',       // Dunkler Text
    }}>
      <FieldSignature
        company={data.company}
        network={data.network}
        nodeCount={data.network.nodes.length}
        signalCount={data.signals.length}
        linkCount={data.links.length}
        eventCount={data.events.length}
      />
      
      <TopologyGraph
        nodes={nodes}
        edges={edges}
        onNodeClick={setSelectedNodeId}
      />
      
      {selectedNode && (
        <StructuralInspector
          nodeId={selectedNode.id}
          nodeType={selectedNode.data.nodeType}
          signals={data.signals}
        />
      )}
    </div>
  );
}
