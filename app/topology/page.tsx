import { loadTopologyData } from '@/lib/topology/loader';
import TopologyView from '@/components/topology/TopologyView';

export default function TopologyPage() {
  const data = loadTopologyData('novascale_ai');
  
  if (!data) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#FFFFFF',
        color: '#EF4444',
        fontSize: '14px',
      }}>
        Failed to load topology data
      </div>
    );
  }
  
  return <TopologyView data={data} />;
}
