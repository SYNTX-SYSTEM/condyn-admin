'use client';

import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    loadFieldTopology();
  }, []);

  const loadFieldTopology = async () => {
    try {
      setLoading(true);
      setError(null);

      const companyId = 'novascale_ai';
      const data = await TopologyDataLoader.loadFieldTopology(companyId);

      const positioned = applySoftForceLayout(
        data.nodes,
        data.edges,
        1200,
        800
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🌐</div>
          <div style={{ fontSize: '1.2rem' }}>Loading field topology...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw' }}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
          <div style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Failed to load field topology</div>
          <div style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</div>
          <button
            onClick={loadFieldTopology}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {globals && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          zIndex: 10,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Global Field State</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>Propagation:</div>
            <div style={{ fontFamily: 'monospace' }}>{(globals.avg_propagation * 100).toFixed(0)}%</div>
            <div>Stability:</div>
            <div style={{ fontFamily: 'monospace' }}>{(globals.stability_score * 100).toFixed(0)}%</div>
            <div>Coupling:</div>
            <div style={{ fontFamily: 'monospace' }}>{(globals.coupling_ratio * 100).toFixed(0)}%</div>
            <div>Drift Hotspots:</div>
            <div style={{ fontFamily: 'monospace' }}>{globals.drift_hotspots}</div>
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '1rem',
        borderRadius: '0.5rem',
        fontSize: '0.875rem'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Topology</div>
        <div>{nodes.length} nodes</div>
        <div>{edges.length} edges</div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        style={{ width: '100%', height: '100%' }}
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
