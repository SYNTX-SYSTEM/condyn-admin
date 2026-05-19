import React from 'react';
import { EdgeProps, getBezierPath } from 'reactflow';
import { SemanticPhysics } from '@/lib/rrfa/perception/semanticPhysics';
import { VisualTier } from '@/lib/rrfa/visualization/primitiveVisuals';
import { getEdgeOpacityMultiplier, shouldRenderParticles } from '@/lib/rrfa/visualization/perceptualHierarchy';
import FlowParticles from './FlowParticles';

export interface FieldEdgeData {
  primitives: { propagation: number; delay: number; drift: number; coupling: number; decoupling: number; };
  signal_count: number;
  edge_tier?: VisualTier;
  source_color?: string;
  target_color?: string;
}

export const FieldEdge: React.FC<EdgeProps<FieldEdgeData>> = ({
  id, sourceX, sourceY, targetX, targetY, data, markerEnd
}) => {
  const primitives  = data?.primitives || { propagation:0.5, delay:0.2, drift:0.1, coupling:0.3, decoupling:0.2 };
  const edgeTier: VisualTier = data?.edge_tier ?? 'background';
  const opacityMult = getEdgeOpacityMultiplier(edgeTier);
  const renderParticles = shouldRenderParticles(edgeTier);

  const sourceColor = data?.source_color ?? '#64c8ff';
  const targetColor = data?.target_color ?? '#64c8ff';

  const motion      = SemanticPhysics.computeEdgeMotion(primitives);
  const [edgePath]  = getBezierPath({ sourceX, sourceY, targetX, targetY });

  const baseOpacity = (1 - motion.decayRate) * opacityMult;
  const strokeDash  = primitives.decoupling > 0.5 ? '5,5' : 'none';

  const base   = `eg-${id.replace(/[^a-zA-Z0-9]/g, '-')}`;
  const gradId = `${base}-g`;
  const glow1Id = `${base}-gw1`;
  const glow2Id = `${base}-gw2`;
  const f1Id   = `${base}-f1`;
  const f2Id   = `${base}-f2`;

  // Background: single near-invisible hairline, no glow
  if (edgeTier === 'background') {
    return (
      <>
        <defs>
          <linearGradient id={gradId} x1={sourceX} y1={sourceY} x2={targetX} y2={targetY} gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor={sourceColor} stopOpacity={baseOpacity * 0.6} />
            <stop offset="100%" stopColor={targetColor}  stopOpacity={baseOpacity * 0.6} />
          </linearGradient>
        </defs>
        <path d={edgePath} strokeWidth={0.25} stroke={`url(#${gradId})`}
          strokeDasharray={strokeDash} fill="none" strokeLinecap="round" />
      </>
    );
  }

  // Midground: 2 layers — subtle near-field + core line
  if (edgeTier === 'midground') {
    return (
      <>
        <defs>
          <filter id={f1Id} x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <linearGradient id={gradId} x1={sourceX} y1={sourceY} x2={targetX} y2={targetY} gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor={sourceColor} stopOpacity={baseOpacity * 0.85} />
            <stop offset="100%" stopColor={targetColor}  stopOpacity={baseOpacity * 0.85} />
          </linearGradient>
          <linearGradient id={glow1Id} x1={sourceX} y1={sourceY} x2={targetX} y2={targetY} gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor={sourceColor} stopOpacity={baseOpacity * 0.30} />
            <stop offset="100%" stopColor={targetColor}  stopOpacity={baseOpacity * 0.30} />
          </linearGradient>
        </defs>
        {/* Near-field glow */}
        <path d={edgePath} strokeWidth={10} stroke={`url(#${glow1Id})`}
          fill="none" strokeLinecap="round" filter={`url(#${f1Id})`} />
        {/* Core line */}
        <path id={id} d={edgePath} strokeWidth={0.5} stroke={`url(#${gradId})`}
          strokeDasharray={strokeDash} fill="none" strokeLinecap="round" markerEnd={markerEnd} />
      </>
    );
  }

  // Primary: 3 layers — atmospheric + near-field + sharp core
  return (
    <>
      <defs>
        {/* Atmospheric — very wide, very soft */}
        <filter id={f1Id} x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="20" />
        </filter>
        {/* Near-field — medium */}
        <filter id={f2Id} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="7" />
        </filter>

        {/* Core gradient */}
        <linearGradient id={gradId} x1={sourceX} y1={sourceY} x2={targetX} y2={targetY} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={sourceColor} stopOpacity={Math.min(0.95, baseOpacity)} />
          <stop offset="100%" stopColor={targetColor}  stopOpacity={Math.min(0.95, baseOpacity)} />
        </linearGradient>
        {/* Atmospheric gradient */}
        <linearGradient id={glow1Id} x1={sourceX} y1={sourceY} x2={targetX} y2={targetY} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={sourceColor} stopOpacity={baseOpacity * 0.09} />
          <stop offset="100%" stopColor={targetColor}  stopOpacity={baseOpacity * 0.09} />
        </linearGradient>
        {/* Near-field gradient */}
        <linearGradient id={glow2Id} x1={sourceX} y1={sourceY} x2={targetX} y2={targetY} gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor={sourceColor} stopOpacity={baseOpacity * 0.45} />
          <stop offset="100%" stopColor={targetColor}  stopOpacity={baseOpacity * 0.45} />
        </linearGradient>
      </defs>

      {/* Layer 1: atmospheric far-field */}
      <path d={edgePath} strokeWidth={55} stroke={`url(#${glow1Id})`}
        fill="none" strokeLinecap="round" filter={`url(#${f1Id})`} />

      {/* Layer 2: near-field glow */}
      <path d={edgePath} strokeWidth={20} stroke={`url(#${glow2Id})`}
        fill="none" strokeLinecap="round" filter={`url(#${f2Id})`} />

      {/* Layer 3: sharp core line */}
      <path id={id} d={edgePath} strokeWidth={0.9} stroke={`url(#${gradId})`}
        strokeDasharray={strokeDash} fill="none" strokeLinecap="round" markerEnd={markerEnd} />

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
