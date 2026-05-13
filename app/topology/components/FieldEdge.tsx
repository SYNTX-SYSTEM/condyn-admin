'use client';

import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import { PrimitiveVisuals } from '@/lib/rrfa/visualization/primitiveVisuals';

/**
 * Field Edge Component
 * 
 * Renders edges between nodes with flow visualization.
 * Applies visual ontology for coupling, propagation, delay.
 * 
 * Visual elements:
 * - Thickness: coupling-based
 * - Opacity: propagation-based
 * - Flow speed: delay-based
 * - Dashed: decoupling-based
 */

interface FieldEdgeData {
  primitives: {
    coupling?: number;
    decoupling?: number;
    propagation?: number;
    delay?: number;
  };
  signal_count?: number;
}

export const FieldEdge: React.FC<EdgeProps<FieldEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd
}) => {
  // Default values if primitives missing
  const primitives = data?.primitives || {};
  const coupling = primitives.coupling || 0.5;
  const decoupling = primitives.decoupling || 0;
  const propagation = primitives.propagation || 0.5;
  const delay = primitives.delay || 0;
  
  // Apply visual ontology
  const thickness = PrimitiveVisuals.couplingToThickness(coupling);
  const opacity = PrimitiveVisuals.couplingToOpacity(coupling);
  const flowDuration = PrimitiveVisuals.delayToFlowDuration(delay);
  
  // High decoupling = dashed edge
  const strokeDasharray = decoupling > 0.5 ? '5,5' : 'none';
  
  // Get bezier path
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  
  return (
    <>
      {/* Base edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        strokeWidth={thickness}
        stroke={`rgba(100, 150, 255, ${opacity})`}
        strokeDasharray={strokeDasharray}
        fill="none"
        markerEnd={markerEnd}
      />
      
      {/* Flow particle (if propagation > 0.3) */}
      {propagation > 0.3 && (
        <circle
          r="3"
          fill="rgba(255, 255, 255, 0.9)"
          opacity={propagation}
        >
          <animateMotion
            dur={`${flowDuration}s`}
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}
      
      {/* Edge label (signal count) */}
      {data?.signal_count && data.signal_count > 5 && (
        <text>
          <textPath
            href={`#${id}`}
            startOffset="50%"
            textAnchor="middle"
            style={{
              fontSize: '10px',
              fill: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 600
            }}
          >
            {data.signal_count}
          </textPath>
        </text>
      )}
    </>
  );
};

export default FieldEdge;
