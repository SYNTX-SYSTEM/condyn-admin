'use client';

import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';

import { TopologyDataLoader } from '@/lib/rrfa/visualization/topologyDataLoader';
import { applySoftForceLayout } from '@/lib/rrfa/visualization/softForceLayout';
import FieldNode from './components/FieldNode';
import FieldEdge from './components/FieldEdge';

/**
 * Field Topology View
 * 
 * Main visualization component for RRFA field topology.
 * 
 * Data flow:
 * 1. Load field_topology.json + signals_projected.json
 * 2. Build REAL edges from signal flow
 * 3. Apply soft force layout
 * 4. Render with React Flow
 * 
 * NOT: Dashboard, charts, tables
 * BUT: Field perception, breathing topology
 */

const nodeTypes = {
  field: FieldNode,
};

const edgeTypes = {
  field: FieldEdge,
};

export default function FieldTopologyView() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [globals, setGlobals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load and render field topology
  useEffect(() => {
    loadFieldTopology();
  }, []);

  const loadFieldTopology = async () => {
    try {
      setLoading(true);
      setError(null);

      // For now, hardcoded to novascale_ai
      // Later: make company selectable
      const companyId = 'novascale_ai';

      // Load field topology and signals
      const data = TopologyDataLoader.loadFieldTopology(companyId);

      // Apply soft force layout
      const positioned = applySoftForceLayout(
        data.nodes,
        data.edges,
        800,
        600
      );

      setNodes(positioned);
      setEdges(data.edges);
      setGlobals(data.globals);
      setLoading(false);

    } catch (err: any) {
      console.error('Failed to load field topology:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-2xl mb-4">🌐</div>
          <div className="text-lg">Loading field topology...</div>
          <div className="text-sm text-gray-500 mt-2">
            Reading field_topology.json + signals_projected.json
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-500">
          <div className="text-2xl mb-4">❌</div>
          <div className="text-lg">Failed to load field topology</div>
          <div className="text-sm mt-2">{error}</div>
          <button
            onClick={loadFieldTopology}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      {/* Global field state indicator */}
      {globals && (
        <div className="absolute top-4 left-4 z-10 bg-black/80 text-white p-4 rounded-lg text-sm">
          <div className="font-bold mb-2">Global Field State</div>
          <div className="grid grid-cols-2 gap-2">
            <div>Propagation:</div>
            <div className="font-mono">{(globals.avg_propagation * 100).toFixed(0)}%</div>
            
            <div>Stability:</div>
            <div className="font-mono">{(globals.stability_score * 100).toFixed(0)}%</div>
            
            <div>Coupling:</div>
            <div className="font-mono">{(globals.coupling_ratio * 100).toFixed(0)}%</div>
            
            <div>Drift Hotspots:</div>
            <div className="font-mono">{globals.drift_hotspots}</div>
          </div>
        </div>
      )}

      {/* Node/edge count */}
      <div className="absolute top-4 right-4 z-10 bg-black/80 text-white p-4 rounded-lg text-sm">
        <div className="font-bold mb-2">Topology</div>
        <div>{nodes.length} nodes</div>
        <div>{edges.length} edges</div>
      </div>

      {/* React Flow visualization */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-right"
      >
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(100, 100, 100, 0.2)"
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}
