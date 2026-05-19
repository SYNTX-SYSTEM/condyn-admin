/**
 * Flow Particles v7 - dense stream of tiny particles
 *
 * Smaller (r=1.2) but many more, with strong color-matched glow.
 * Creates a continuous luminous flow rather than discrete dots.
 */

import React from 'react';

interface FlowParticlesProps {
  path: string;
  velocity: number;
  pattern: 'smooth' | 'pulsing' | 'dragging' | 'oscillating' | 'bundling';
  turbulence: number;
  phaseShift: number;
  decayRate: number;
  particleCount: number;
  sourceColor?: string;
  targetColor?: string;
}

function blend(c1: string, c2: string, t: number): string {
  const p1 = hexToRgb(c1);
  const p2 = hexToRgb(c2);
  const r = Math.round(p1.r + (p2.r - p1.r) * t);
  const g = Math.round(p1.g + (p2.g - p1.g) * t);
  const b = Math.round(p1.b + (p2.b - p1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  };
}

export const FlowParticles: React.FC<FlowParticlesProps> = ({
  path, velocity, pattern, turbulence, phaseShift, decayRate, particleCount,
  sourceColor = '#ffffff', targetColor = '#ffffff'
}) => {

  // Boost particle count for density (caller already capped, but we boost)
  const actualCount = Math.min(20, Math.max(particleCount, Math.floor(particleCount * 1.5)));

  const baseDuration = 3 / velocity;
  const baseOpacity = 0.85 * (1 - decayRate);

  return (
    <>
      {Array.from({ length: actualCount }).map((_, i) => {
        const particleDelay = (i / actualCount) * baseDuration + (phaseShift / (2 * Math.PI)) * baseDuration;
        const t = i / Math.max(1, actualCount - 1);
        const color = blend(sourceColor, targetColor, t);

        // tiny radius — density makes the flow
        const r = pattern === 'bundling' ? 1.6 : pattern === 'dragging' ? 1.4 : 1.2;

        return (
          <circle
            key={i}
            r={r}
            fill={color}
            opacity={baseOpacity}
            style={{ filter: `drop-shadow(0 0 2px ${color}) drop-shadow(0 0 4px ${color})` }}
          >
            <animateMotion
              dur={`${baseDuration}s`}
              begin={`${particleDelay}s`}
              repeatCount="indefinite"
              path={path}
            />
            {pattern === 'pulsing' && (
              <animate attributeName="opacity" values={`${baseOpacity * 0.5};${baseOpacity};${baseOpacity * 0.5}`} dur="1.4s" repeatCount="indefinite" />
            )}
            {pattern === 'oscillating' && turbulence > 0 && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values={`0,0; ${turbulence * 4},0; 0,0; -${turbulence * 4},0; 0,0`}
                dur={`${0.4 / velocity}s`}
                repeatCount="indefinite"
              />
            )}
          </circle>
        );
      })}
    </>
  );
};

export default FlowParticles;
