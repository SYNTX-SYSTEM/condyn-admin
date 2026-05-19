/**
 * Field Edge v7 - thin neural-pathway look
 *
 * Edges are very thin (0.5-1px stroke) with a wide soft glow underneath (8-12px blur).
 * Creates "fiber-optic" feel — the line is barely visible but the glow is strong.
 */

import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import { SemanticPhysics } from '@/lib/rrfa/perception/semanticPhysics';
import { VisualTier } from '@/lib/rrfa/visualization/primitiveVisuals';
import { getEdgeOpacityMultiplier, shouldRenderParticles } from '@/lib/rrfa/visualization/perceptualHierarchy';
import FlowParticles from './FlowParticles';

export interface FieldEdgeData {
  primitives: { propagation: number; delay: number; drift: number; coupling: number; decoupling: number; diffusion?: number; density?: number; };
  signal_count: number;
  source_tier?: VisualTier;
  target_tier?: VisualTier;
  edge_tier?: VisualTier;
  source_color?: string;
  target_color?: string;
}

export const FieldEdge: React.FC<EdgeProps<FieldEdgeData>> = ({
  id, sourceX, sourceY, targetX, targetY, data, markerEnd
}) => {

  const primitives = data?.primitives || { propagation: 0.5, delay: 0.2, drift: 0.1, coupling: 0.3, decoupling: 0.2 };
  const edgeTier: VisualTier = data?.edge_tier ?? 'midground';
  const opacityMult = getEdgeOpacityMultiplier(edgeTier);
  const renderParticles = shouldRenderParticles(edgeTier);

  const sourceColor = data?.source_color ?? '#64c8ff';
  const targetColor = data?.target_color ?? '#64c8ff';

  const motion = SemanticPhysics.computeEdgeMotion(primitives);
  const [edgePath] = getBezierPath({ sourceX, sourceY, targetX, targetY });

  // VERY thin strokes
  const edgeWidth = edgeTier === 'background' ? 0.3
                  : edgeTier === 'midground' ? 0.6
                  : 0.9;

  const baseOpacity = 1 - motion.decayRate;
  const finalOpacity = Math.min(0.95, baseOpacity * opacityMult);
  const strokeDasharray = primitives.decoupling > 0.5 ? '5,5' : 'none';

  const gradId = `eg-${id.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const glowGradId = `egg-${id.replace(/[^a-zA-Z0-9]/g, '-')}`;

  // Strong glow underneath
  const glowWidth = edgeWidth * 12;
  const glowOpacity = edgeTier === 'background' ? finalOpacity * 0.15 : finalOpacity * 0.55;

  return (
    <>
      <defs>
        <linearGradient id={gradId} x1={sourceX} y1={sourceY} x2={targetX} y2={targetY} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={sourceColor} stopOpacity={finalOpacity} />
          <stop offset="100%" stopColor={targetColor} stopOpacity={finalOpacity} />
        </linearGradient>
        <linearGradient id={glowGradId} x1={sourceX} y1={sourceY} x2={targetX} y2={targetY} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={sourceColor} stopOpacity={glowOpacity} />
          <stop offset="100%" stopColor={targetColor} stopOpacity={glowOpacity} />
        </linearGradient>
      </defs>

      {/* Wide soft glow */}
      <path
        d={edgePath}
        strokeWidth={glowWidth}
        stroke={`url(#${glowGradId})`}
        fill="none"
        strokeLinecap="round"
        style={{ filter: 'blur(6px)' }}
      />

      {/* Thin sharp line */}
      <path
        id={id}
        d={edgePath}
        strokeWidth={edgeWidth}
        stroke={`url(#${gradId})`}
        strokeDasharray={strokeDasharray}
        fill="none"
        strokeLinecap="round"
        markerEnd={markerEnd}
      />

      {renderParticles && motion.flowVelocity > 0.1 && (
        <FlowParticles
          path={edgePath}
          velocity={motion.flowVelocity}
          pattern={motion.flowPattern}
          turbulence={motion.turbulence}
          phaseShift={motion.phaseShift}
          decayRate={motion.decayRate}
          particleCount={motion.particleCount}
          sourceColor={sourceColor}
          targetColor={targetColor}
        />
      )}
    </>
  );
};

export default FieldEdge;
