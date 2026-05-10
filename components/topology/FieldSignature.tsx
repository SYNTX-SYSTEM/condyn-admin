'use client';
import { motion } from 'framer-motion';
import type { Company, Network } from '@/types/topology';
import { getCharacteristicColor } from '@/lib/topology/fieldStates';

interface FieldSignatureProps {
  company: Company;
  network: Network;
  nodeCount: number;
  signalCount: number;
  linkCount: number;
  eventCount: number;
}

export default function FieldSignature({
  company,
  network,
  nodeCount,
  signalCount,
  linkCount,
  eventCount,
}: FieldSignatureProps) {
  const characteristics = network.topology_characteristics;

  return (
    <div style={{
      width: '340px',
      borderRight: '1px solid #E5E7EB',
      padding: '32px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      background: '#FFFFFF',
      overflowY: 'auto',
    }}>
      {/* Logo + ConDyn Header */}
      <div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginBottom: '28px'
        }}>
          <img 
            src="/logo.jpeg" 
            alt="ConDyn" 
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              boxShadow: '0 2px 12px rgba(0,0,0,0.12)'
            }} 
          />
          <div>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '2px'
            }}>
              ConDyn
            </div>
            <div style={{ 
              fontSize: '10px', 
              color: '#9CA3AF', 
              textTransform: 'uppercase', 
              letterSpacing: '0.8px',
              fontWeight: '600' 
            }}>
              Topology Analysis
            </div>
          </div>
        </div>

        {/* Company Info */}
        <div style={{
          padding: '20px',
          background: 'linear-gradient(135deg, #F9FAFB 0%, #FFFFFF 100%)',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
        }}>
          <div style={{ 
            fontSize: '10px', 
            color: '#9CA3AF',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontWeight: '600'
          }}>
            Organization
          </div>
          <div style={{ 
            fontSize: '22px', 
            fontWeight: '700', 
            color: '#1F2937',
            marginBottom: '6px',
            lineHeight: '1.2'
          }}>
            {company.name}
          </div>
          <div style={{ 
            fontSize: '13px', 
            color: '#6B7280',
            marginBottom: '12px'
          }}>
            {company.industry}
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            fontSize: '11px',
            color: '#9CA3AF',
            paddingTop: '12px',
            borderTop: '1px solid #E5E7EB'
          }}>
            <div>
              <span style={{ fontWeight: '600', color: '#6B7280' }}>
                {company.size}
              </span> employees
            </div>
            <div>•</div>
            <div>{company.region}</div>
          </div>
        </div>
      </div>

      {/* What We're Seeing */}
      <div>
        <div style={{
          fontSize: '11px',
          color: '#6B7280',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: '600'
        }}>
          Current Topology View
        </div>
        <div style={{
          padding: '16px',
          background: '#F9FAFB',
          borderRadius: '10px',
          border: '1px solid #E5E7EB',
          fontSize: '12px',
          color: '#6B7280',
          lineHeight: '1.6'
        }}>
          Visualizing <strong style={{ color: '#1F2937' }}>{nodeCount} organizational nodes</strong>:{' '}
          communication artifacts, structural events, performance metrics, and detected signals.{' '}
          Connected through <strong style={{ color: '#1F2937' }}>{linkCount} relations</strong>.
        </div>
      </div>

      {/* Topology Characteristics */}
      <div>
        <div style={{
          fontSize: '11px',
          color: '#6B7280',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: '600'
        }}>
          Structural Characteristics
        </div>
        
        <div style={{
          padding: '20px',
          background: '#F9FAFB',
          borderRadius: '12px',
          border: '1px solid #E5E7EB',
        }}>
          {Object.entries(characteristics).map(([key, value]) => {
            const labels: { [key: string]: string } = {
              authority_centralization: 'Authority Centralization',
              workflow_instability: 'Workflow Instability',
              turnover_pressure: 'Turnover Pressure',
              signal_density: 'Signal Density',
              bottleneck_probability: 'Bottleneck Risk'
            };
            
            return (
              <div key={key} style={{ marginBottom: '18px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#374151',
                    fontWeight: '500'
                  }}>
                    {labels[key] || key}
                  </div>
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '700',
                    color: getCharacteristicColor(value),
                  }}>
                    {(value * 100).toFixed(0)}%
                  </span>
                </div>
                <div style={{
                  height: '8px',
                  background: '#E5E7EB',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${value * 100}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: getCharacteristicColor(value),
                      borderRadius: '4px'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Summary */}
      <div>
        <div style={{
          fontSize: '11px',
          color: '#6B7280',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontWeight: '600'
        }}>
          Data Composition
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
        }}>
          {[
            { label: 'Nodes', value: nodeCount, color: '#3B82F6' },
            { label: 'Relations', value: linkCount, color: '#8B5CF6' },
            { label: 'Signals', value: signalCount, color: '#EF4444' },
            { label: 'Events', value: eventCount, color: '#10B981' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                padding: '16px',
                background: '#F9FAFB',
                borderRadius: '10px',
                border: '1px solid #E5E7EB',
                textAlign: 'center'
              }}
            >
              <div style={{ 
                fontWeight: '700', 
                color, 
                fontSize: '24px',
                marginBottom: '4px'
              }}>
                {value}
              </div>
              <div style={{ 
                fontSize: '11px', 
                color: '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
