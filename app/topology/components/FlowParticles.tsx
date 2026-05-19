import React from 'react';

interface FlowParticlesProps {
  path: string; velocity: number;
  pattern: 'smooth'|'pulsing'|'dragging'|'oscillating'|'bundling';
  turbulence: number; phaseShift: number; decayRate: number;
  particleCount: number; sourceColor?: string; targetColor?: string;
}

function blend(c1: string, c2: string, t: number): string {
  const p1 = { r:parseInt(c1.slice(1,3),16), g:parseInt(c1.slice(3,5),16), b:parseInt(c1.slice(5,7),16) };
  const p2 = { r:parseInt(c2.slice(1,3),16), g:parseInt(c2.slice(3,5),16), b:parseInt(c2.slice(5,7),16) };
  return `rgb(${Math.round(p1.r+(p2.r-p1.r)*t)},${Math.round(p1.g+(p2.g-p1.g)*t)},${Math.round(p1.b+(p2.b-p1.b)*t)})`;
}

export const FlowParticles: React.FC<FlowParticlesProps> = ({
  path, velocity, pattern, turbulence, phaseShift, decayRate, particleCount,
  sourceColor='#ffffff', targetColor='#ffffff'
}) => {
  const count = Math.min(20, Math.max(particleCount, Math.floor(particleCount * 1.5)));
  const dur = 3 / velocity;
  const opacity = 0.90 * (1 - decayRate * 0.4);

  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const delay = (i / count) * dur + (phaseShift / (2 * Math.PI)) * dur;
        const t = i / Math.max(1, count - 1);
        const color = blend(sourceColor, targetColor, t);
        const r = pattern === 'bundling' ? 2.5 : pattern === 'dragging' ? 2.0 : 2.2;
        return (
          <circle key={i} r={r} fill={color} opacity={opacity} style={{ filter:`drop-shadow(0 0 3px ${color}) drop-shadow(0 0 5px ${color})` }}>
            <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" path={path} />
            {pattern === 'pulsing' && <animate attributeName="opacity" values={`${opacity*0.5};${opacity};${opacity*0.5}`} dur="1.4s" repeatCount="indefinite" />}
            {pattern === 'oscillating' && turbulence > 0 && <animateTransform attributeName="transform" type="translate" values={`0,0;${turbulence*4},0;0,0;-${turbulence*4},0;0,0`} dur={`${0.4/velocity}s`} repeatCount="indefinite" />}
          </circle>
        );
      })}
    </>
  );
};

export default FlowParticles;
