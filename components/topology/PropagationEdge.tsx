'use client';

import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

export default function PropagationEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    data,
  } = props;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const weight = typeof data?.weight === 'number' ? data.weight : 0.5;
  
  // Ultra-subtle weight-sensitive behavior
  // < 0.4: completely static (no animation)
  // 0.4-0.7: barely perceptible (very slow, very low opacity)
  // > 0.8: subtle visible flow (still calm, institutional)
  
  const baseOpacity = weight < 0.4 ? 0.15 : weight < 0.7 ? 0.2 : 0.25;
  const strokeWidth = 1 + weight * 2;
  
  // Much slower - barely perceptible
  const animationDuration = weight > 0.8 ? '8s' : weight > 0.4 ? '12s' : '16s';
  
  // Gradient opacity - very subtle
  const gradientOpacity = weight > 0.8 ? 0.3 : weight > 0.4 ? 0.15 : 0;
  
  return (
    <>
      {/* Base edge - very subtle static presence */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth,
          opacity: baseOpacity,
        }}
      />
      
      {/* Ultra-subtle flow overlay - only for weight > 0.4 */}
      {weight > 0.4 && (
        <>
          <defs>
            <linearGradient id={`gradient-${id}`}>
              <stop offset="0%" stopColor="transparent" />
              <stop offset="40%" stopColor="#3B82F6" stopOpacity={gradientOpacity * 0.3} />
              <stop offset="60%" stopColor="#3B82F6" stopOpacity={gradientOpacity * 0.5} />
              <stop offset="100%" stopColor="transparent" />
              {/* Very slow gradient movement */}
              <animate
                attributeName="x1"
                values="-50%;150%"
                dur={animationDuration}
                repeatCount="indefinite"
              />
              <animate
                attributeName="x2"
                values="50%;250%"
                dur={animationDuration}
                repeatCount="indefinite"
              />
            </linearGradient>
          </defs>
          
          <path
            d={edgePath}
            style={{
              fill: 'none',
              stroke: `url(#gradient-${id})`,
              strokeWidth: strokeWidth * 0.6,
            }}
          />
          
          {/* Barely perceptible breathing pulse */}
          <style>{`
            @keyframes breathe-${id} {
              0%, 100% { opacity: ${baseOpacity * 0.6}; }
              50% { opacity: ${baseOpacity * 1.0}; }
            }
          `}</style>
        </>
      )}
    </>
  );
}
