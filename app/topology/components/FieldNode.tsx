'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PrimitiveVisuals, VisualConstants } from '@/lib/rrfa/visualization/primitiveVisuals';

/**
 * Field Node Component
 * 
 * Renders a single node in the field topology.
 * Applies visual ontology from primitiveVisuals.ts
 * 
 * Visual elements:
 * - Size: density-based
 * - Color: density-based warmth
 * - Glow: propagation-based
 * - Breathing: constant slow pulse
 * - Trembling: drift-based (only if drift > 0.5)
 */

interface FieldNodeData {
  label: string;
  primitives: {
    propagation: number;
    density: number;
    drift: number;
    coupling?: number;
    decoupling?: number;
    delay?: number;
  };
  signal_count: number;
  centrality: number;
  carrier_type: string;
}

export const FieldNode: React.FC<NodeProps<FieldNodeData>> = ({ data }) => {
  const { primitives, label, signal_count } = data;
  
  // Apply visual ontology
  const size = PrimitiveVisuals.densityToSize(primitives.density);
  const color = PrimitiveVisuals.densityToColor(primitives.density);
  const glow = PrimitiveVisuals.propagationToGlow(primitives.propagation);
  const brightness = PrimitiveVisuals.propagationToBrightness(primitives.propagation);
  const tremble = PrimitiveVisuals.driftToTremble(primitives.drift);
  const breathSpeed = PrimitiveVisuals.breathingSpeed();
  
  // Only tremble if drift > threshold
  const shouldTremble = primitives.drift > VisualConstants.TREMBLE_THRESHOLD;
  
  return (
    <>
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      
      {/* Node visualization */}
      <div
        className="field-node"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          boxShadow: glow,
          opacity: brightness,
          borderRadius: '50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          animation: `
            breathe ${breathSpeed}ms ease-in-out infinite
            ${shouldTremble ? `, tremble ${tremble.speed}ms infinite` : ''}
          `,
          cursor: 'pointer',
          transition: 'transform 0.2s ease'
        }}
      >
        {/* Node label */}
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'white',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            maxWidth: '90%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {label.split('_').pop()}
        </div>
        
        {/* Signal count badge */}
        <div
          style={{
            fontSize: '8px',
            color: 'rgba(255, 255, 255, 0.8)',
            marginTop: '2px'
          }}
        >
          {signal_count}
        </div>
        
        {/* Primitive indicators (minimal) */}
        {primitives.drift > 0.7 && (
          <div
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 100, 100, 0.9)',
              boxShadow: '0 0 5px rgba(255, 100, 100, 0.5)'
            }}
            title="High drift"
          />
        )}
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(${1 + PrimitiveVisuals.breathingScale()}); }
        }
        
        @keyframes tremble {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-${tremble.amount}px, ${tremble.amount}px); }
          50% { transform: translate(${tremble.amount}px, ${tremble.amount}px); }
          75% { transform: translate(${tremble.amount}px, -${tremble.amount}px); }
        }
        
        .field-node:hover {
          transform: scale(1.1) !important;
          z-index: 10;
        }
      `}</style>
    </>
  );
};

export default FieldNode;
