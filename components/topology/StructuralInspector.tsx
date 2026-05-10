'use client';
import { motion } from 'framer-motion';
import type { Signal } from '@/types/topology';

interface StructuralInspectorProps {
  nodeId: string;
  nodeType: 'signal' | 'event' | 'kpi' | 'artifact';
  signals: Signal[];
}

/**
 * Structural Inspector
 * Shows structural relations and signal propagation for selected node
 */
export default function StructuralInspector({
  nodeId,
  nodeType,
  signals,
}: StructuralInspectorProps) {
  
  // Find signals related to this node
  const relatedSignals = signals.filter(signal => 
    signal.linked_artifacts?.includes(nodeId) ||
    signal.signal_id === nodeId
  );

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        width: '320px',
        borderLeft: '1px solid rgba(107, 155, 209, 0.1)',
        padding: '24px',
        background: 'rgba(10, 14, 39, 0.6)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Node Header */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ 
          fontSize: '11px', 
          color: 'rgba(232, 234, 246, 0.5)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          STRUCTURAL INSPECTION
        </div>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: '600', 
          color: '#6B9BD1',
        }}>
          {nodeId}
        </div>
        <div style={{ 
          fontSize: '11px', 
          color: 'rgba(232, 234, 246, 0.6)',
          marginTop: '4px',
          textTransform: 'uppercase',
        }}>
          {nodeType}
        </div>
      </div>

      {/* Related Signals */}
      {relatedSignals.length > 0 && (
        <div>
          <div style={{
            fontSize: '11px',
            color: 'rgba(232, 234, 246, 0.5)',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            DETECTED SIGNALS ({relatedSignals.length})
          </div>
          
          {relatedSignals.map((signal) => (
            <div 
              key={signal.signal_id}
              style={{
                padding: '12px',
                background: 'rgba(255, 107, 107, 0.1)',
                border: '1px solid rgba(255, 107, 107, 0.2)',
                borderRadius: '6px',
                marginBottom: '8px',
              }}
            >
              <div style={{ 
                fontSize: '11px', 
                color: '#FF6B6B', 
                marginBottom: '6px',
              }}>
                {signal.signal_type.replace(/_/g, ' ').toUpperCase()}
              </div>
              <div style={{ 
                fontSize: '13px', 
                fontWeight: '600', 
                color: '#E8EAF6',
                marginBottom: '4px',
              }}>
                Confidence: {(signal.confidence * 100).toFixed(0)}%
              </div>
              {signal.description && (
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(232, 234, 246, 0.6)',
                  marginTop: '6px',
                }}>
                  {signal.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No Signals State */}
      {relatedSignals.length === 0 && (
        <div style={{
          padding: '16px',
          background: 'rgba(107, 155, 209, 0.05)',
          borderRadius: '6px',
          fontSize: '12px',
          color: 'rgba(232, 234, 246, 0.5)',
          textAlign: 'center',
        }}>
          No signals detected for this node
        </div>
      )}
    </motion.div>
  );
}
