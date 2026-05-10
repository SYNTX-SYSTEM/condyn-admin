import { loadTopologyData } from '@/lib/topology/loader';
import TopologyView from '@/components/topology/TopologyView';
import LoadingState from '@/components/topology/LoadingState';

/**
 * Topology Page - Server Component
 * 
 * Loads topology data directly from filesystem
 * No API route needed - reads data/companies/ directly
 */
export default function TopologyPage() {
  // Load topology data server-side
  const data = loadTopologyData('novascale_ai');
  
  // Handle loading failure
  if (!data) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1d3a 100%)',
        color: '#FF6B6B',
        fontSize: '14px',
      }}>
        Failed to load topology data
      </div>
    );
  }
  
  // Render topology view
  return <TopologyView data={data} />;
}
