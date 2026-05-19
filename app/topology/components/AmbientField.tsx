'use client';

/**
 * AmbientField v5 — field source model
 *
 * Rendering philosophy:
 * - Nodes emit massive atmospheric fields
 * - Corridors emerge from field overlap between connected nodes
 * - Dead zones are not rendered — they are the absence of field
 * - Edges are NOT drawn here — FieldEdge.tsx handles tension traces
 * - Hub gravity = additive accumulation at convergence points
 *
 * The field is primary. Nodes are concentration points. Edges dissolve into it.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useNodes, useEdges, useViewport } from 'reactflow';
import { PrimitiveVisuals } from '@/lib/rrfa/visualization/primitiveVisuals';
import { getTierMultipliers } from '@/lib/rrfa/visualization/perceptualHierarchy';

type NodeData = {
  carrier_type: string;
  tier?: 'primary' | 'midground' | 'background';
  signal_count?: number;
};

type EdgeData = {
  edge_tier?: string;
  source_color?: string;
  target_color?: string;
  primitives?: {
    propagation?: number;
    coupling?: number;
    drift?: number;
    delay?: number;
    decoupling?: number;
  };
};

function rgba(hex: string, a: number): string {
  if (!hex || hex.length < 7) return `rgba(100,200,255,${a})`;
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

export const AmbientField: React.FC = () => {
  const nodes    = useNodes<NodeData>();
  const edges    = useEdges<EdgeData>();
  const { x: vpX, y: vpY, zoom } = useViewport();
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const render = useCallback(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const W = container.offsetWidth;
    const H = container.offsetHeight;
    if (!W || !H) return;

    canvas.width  = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, W, H);

    // ── Screen-space node map ────────────────────────────────────────
    const nmap = new Map<string, {
      x:number; y:number; size:number; color:string; tier:string;
    }>();

    for (const node of nodes) {
      const tier  = (node.data.tier ?? 'midground') as 'primary'|'midground'|'background';
      const sc    = node.data.signal_count ?? 20;
      const mult  = getTierMultipliers(tier);
      const size  = PrimitiveVisuals.signalCountToSize(sc) * mult.size;
      const color = PrimitiveVisuals.carrierTypeToColor(node.data.carrier_type);
      const sx    = (node.position.x + size / 2) * zoom + vpX;
      const sy    = (node.position.y + size / 2) * zoom + vpY;
      nmap.set(node.id, { x:sx, y:sy, size: size*zoom, color, tier });
    }

    ctx.globalCompositeOperation = 'lighter';

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  PASS 1 — Atmospheric field mass                            ║
    // ║  Nodes emit vast radial fields.                             ║
    // ║  Where fields overlap → corridor. No edges drawn.          ║
    // ║  This IS the topology. Not a decoration on top of it.      ║
    // ╚══════════════════════════════════════════════════════════════╝
    ctx.filter = 'blur(48px)';

    for (const [, n] of nmap) {
      if (n.tier === 'background') continue;

      // Primary nodes emit massive fields — corridors emerge from overlap
      const fieldR  = n.tier === 'primary'
        ? n.size * 5.8   // very large — overlaps with neighbors
        : n.size * 2.8;

      const alpha   = n.tier === 'primary' ? 0.095 : 0.028;

      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, fieldR);
      g.addColorStop(0,    rgba(n.color, alpha));
      g.addColorStop(0.25, rgba(n.color, alpha * 0.80));
      g.addColorStop(0.55, rgba(n.color, alpha * 0.40));
      g.addColorStop(0.80, rgba(n.color, alpha * 0.10));
      g.addColorStop(1,    rgba(n.color, 0));

      ctx.beginPath();
      ctx.arc(n.x, n.y, fieldR, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  PASS 2 — Structural corridor tension                       ║
    // ║  Wide tubes between connected node CENTERS.                 ║
    // ║  Not an edge. A directed field concentration.               ║
    // ║  Topology creates directionality. Not Gaussian spread.      ║
    // ╚══════════════════════════════════════════════════════════════╝
    ctx.filter = 'blur(20px)';

    for (const edge of edges) {
      const tier = edge.data?.edge_tier ?? 'background';
      if (tier === 'background') continue;

      const src = nmap.get(edge.source);
      const tgt = nmap.get(edge.target);
      if (!src || !tgt) continue;

      const p         = edge.data?.primitives ?? {};
      const prop      = p.propagation  ?? 0.5;
      const decouple  = p.decoupling   ?? 0;
      if (decouple > 0.70) continue;

      // Exponential intensity — creates massive asymmetry
      // prop=0.84 → 0.59, prop=0.70 → 0.34, prop<0.62 → invisible
      const intensity = Math.pow(prop, 3);
      if (intensity < 0.22) continue;

      const sc = edge.data?.source_color ?? '#64c8ff';
      const tc = edge.data?.target_color ?? '#64c8ff';

      const isPrimary = tier === 'primary';
      const tubeW     = isPrimary ? 85 + intensity * 65 : 30;
      const tubeA     = isPrimary ? intensity * 0.075 : intensity * 0.018;

      const g = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
      g.addColorStop(0, rgba(sc, tubeA));
      g.addColorStop(1, rgba(tc, tubeA));

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = g;
      ctx.lineWidth   = tubeW;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  PASS 3 — Dominant resonance corridors                      ║
    // ║  Only top-intensity paths. Narrower, more defined.          ║
    // ║  Creates the few bright axes the eye locks onto first.      ║
    // ╚══════════════════════════════════════════════════════════════╝
    ctx.filter = 'blur(7px)';

    for (const edge of edges) {
      if (edge.data?.edge_tier !== 'primary') continue;

      const src = nmap.get(edge.source);
      const tgt = nmap.get(edge.target);
      if (!src || !tgt) continue;

      const p        = edge.data?.primitives ?? {};
      const prop     = p.propagation ?? 0.5;
      const drift    = p.drift       ?? 0;
      const decouple = p.decoupling  ?? 0;
      if (decouple > 0.55) continue;

      const intensity = Math.pow(prop, 3);
      if (intensity < 0.28) continue; // only dominant

      // Drift paths are unstable — they don't form clean corridors
      const tubeW = drift > 0.5 ? 18 : 32 + intensity * 22;
      const tubeA = (drift > 0.5 ? 0.06 : 0.14) * intensity;

      const sc = edge.data?.source_color ?? '#64c8ff';
      const tc = edge.data?.target_color ?? '#64c8ff';
      const g  = ctx.createLinearGradient(src.x, src.y, tgt.x, tgt.y);
      g.addColorStop(0, rgba(sc, tubeA));
      g.addColorStop(1, rgba(tc, tubeA));

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = g;
      ctx.lineWidth   = tubeW;
      ctx.lineCap     = 'round';
      ctx.stroke();
    }

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  PASS 4 — Hub compression                                   ║
    // ║  Tight, high-contrast core at each node.                    ║
    // ║  Additive accumulation from all converging corridors        ║
    // ║  creates natural brightness peak. Darker surround           ║
    // ║  emerges from contrast — not from darkening code.           ║
    // ╚══════════════════════════════════════════════════════════════╝
    ctx.filter = 'blur(6px)';

    for (const [, n] of nmap) {
      if (n.tier === 'background') continue;

      const coreR = n.tier === 'primary' ? n.size * 0.58 : n.size * 0.32;
      const alpha  = n.tier === 'primary' ? 0.52 : 0.13;

      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, coreR);
      g.addColorStop(0,    rgba(n.color, alpha));
      g.addColorStop(0.40, rgba(n.color, alpha * 0.38));
      g.addColorStop(0.75, rgba(n.color, alpha * 0.07));
      g.addColorStop(1,    rgba(n.color, 0));

      ctx.beginPath();
      ctx.arc(n.x, n.y, coreR, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    // ╔══════════════════════════════════════════════════════════════╗
    // ║  PASS 5 — Gravitational center point                        ║
    // ║  Singular brightest point. Additive peak.                   ║
    // ║  The eye reads this as "mass". Not "glow".                  ║
    // ╚══════════════════════════════════════════════════════════════╝
    ctx.filter = 'blur(3px)';

    for (const [, n] of nmap) {
      if (n.tier !== 'primary') continue;

      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.size * 0.30);
      g.addColorStop(0, rgba(n.color, 0.75));
      g.addColorStop(1, rgba(n.color, 0));

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.size * 0.30, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }

    ctx.filter = 'none';
    ctx.globalCompositeOperation = 'source-over';

  }, [nodes, edges, vpX, vpY, zoom]);

  useEffect(() => { render(); }, [render]);

  useEffect(() => {
    const obs = new ResizeObserver(() => render());
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [render]);

  return (
    <div ref={containerRef} style={{
      position: 'absolute', inset: 0,
      pointerEvents: 'none', zIndex: 0,
    }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};

export default AmbientField;
