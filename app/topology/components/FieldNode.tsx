'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { PrimitiveVisuals, VisualTier } from '@/lib/rrfa/visualization/primitiveVisuals';
import { getTierMultipliers } from '@/lib/rrfa/visualization/perceptualHierarchy';

/**
 * Field Node v7 - symbiotic glow
 *
 * Node = glass-orb with radial-gradient inner glow + 3-layer halo aura
 *   1. Inner radial-gradient (white core → carrier color edge): translucent feel
 *   2. Three stacked box-shadows: tight + medium + diffuse halo
 *   3. Subtle white border catches the rim light
 */

interface FieldNodeData {
  label: string;
  primitives: { propagation: number; density: number; drift: number; coupling?: number; decoupling?: number; delay?: number; };
  signal_count: number;
  centrality: number;
  carrier_type: string;
  tier?: VisualTier;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const FieldNode: React.FC<NodeProps<FieldNodeData>> = ({ data }) => {
  const { primitives, label, signal_count, carrier_type } = data;
  const tier: VisualTier = data.tier ?? 'midground';
  const mult = getTierMultipliers(tier);

  const nodeColor = PrimitiveVisuals.carrierTypeToColor(carrier_type);
  const baseSize = PrimitiveVisuals.signalCountToSize(signal_count);
  const size = baseSize * mult.size;
  const baseBrightness = PrimitiveVisuals.propagationToBrightness(primitives.propagation);
  const opacity = baseBrightness * mult.opacity;

  // Three stacked halos: tight bright, medium, diffuse outer
  const effectiveGlow = primitives.propagation * Math.max(0.55, mult.glow);
  const halo = [
    `0 0 ${effectiveGlow * 15}px ${hexToRgba(nodeColor, 0.9)}`,
    `0 0 ${effectiveGlow * 35}px ${hexToRgba(nodeColor, 0.5)}`,
    `0 0 ${effectiveGlow * 70}px ${hexToRgba(nodeColor, 0.25)}`
  ].join(', ');

  // Radial gradient background: brighter center → carrier color edge
  const innerBg = `radial-gradient(circle at 35% 30%, ${hexToRgba(nodeColor, 1)} 0%, ${nodeColor} 50%, ${hexToRgba(nodeColor, 0.85)} 100%)`;

  const breathSpeed = PrimitiveVisuals.breathingSpeed();
  const displayCent = (signal_count / 100).toFixed(2);
  const numberFontSize = Math.max(14, size * 0.36);

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      {/* Label above */}
      <div style={{
        position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
        whiteSpace: 'nowrap', fontSize: '11px', fontWeight: 600,
        color: 'rgba(255, 255, 255, 0.95)',
        textShadow: `0 0 8px ${hexToRgba(nodeColor, 0.6)}, 0 1px 3px rgba(0,0,0,0.9)`,
        letterSpacing: '0.3px', pointerEvents: 'none', zIndex: 5
      }}>
        {label}
      </div>

      {/* Glass orb */}
      <div
        className="field-node"
        style={{
          width: `${size}px`, height: `${size}px`,
          background: innerBg,
          boxShadow: halo,
          opacity,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          border: `1px solid ${hexToRgba(nodeColor, 0.4)}`,
          animation: `breathe ${breathSpeed}ms ease-in-out infinite`,
          cursor: 'pointer',
          transition: 'all 250ms ease-out'
        }}
      >
        {/* Subtle inner highlight (rim light) */}
        <div style={{
          position: 'absolute', inset: '2px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 25%, rgba(255,255,255,0.25) 0%, transparent 40%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          fontSize: `${numberFontSize}px`, fontWeight: 700, color: 'white',
          textShadow: `0 0 10px ${nodeColor}, 0 0 20px ${hexToRgba(nodeColor, 0.6)}, 0 1px 3px rgba(0,0,0,0.6)`,
          lineHeight: 1,
          position: 'relative', zIndex: 1
        }}>
          {signal_count}
        </div>

        {primitives.drift > 0.7 && (
          <div style={{
            position: 'absolute', top: '-4px', right: '-4px',
            width: '10px', height: '10px', borderRadius: '50%',
            backgroundColor: 'rgba(255, 100, 100, 0.9)',
            boxShadow: '0 0 5px rgba(255, 100, 100, 0.5)'
          }} title="High drift" />
        )}
      </div>

      {/* Centrality below */}
      <div style={{
        position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
        whiteSpace: 'nowrap', fontSize: '8.5px',
        color: 'rgba(255, 255, 255, 0.55)',
        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
        pointerEvents: 'none', zIndex: 5
      }}>
        centrality: {displayCent}
      </div>

      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(${1 + PrimitiveVisuals.breathingScale()}); }
        }
        .field-node:hover {
          transform: scale(1.05) !important;
          z-index: 10;
        }
      `}</style>
    </>
  );
};

export default FieldNode;
