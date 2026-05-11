import { Suspense } from 'react';
import { loadTopologyData } from '@/lib/topology/loader';
import TopologyView from '@/components/topology/TopologyView';
import CompanySwitcher from '@/components/topology/CompanySwitcher';

// MODULE LEVEL LOG - Should appear at server start
console.log('🚀🚀🚀 TOPOLOGY PAGE MODULE LOADED 🚀🚀🚀');

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const dynamicParams = true;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

interface PageProps {
  searchParams: Promise<{ company?: string }>;
}

function CompanySwitcherWrapper() {
  return (
    <Suspense fallback={
      <div style={{ 
        padding: '12px 20px', 
        background: '#FAFAFA',
        borderBottom: '1px solid #E5E7EB',
      }}>
        Loading...
      </div>
    }>
      <CompanySwitcher />
    </Suspense>
  );
}

export default async function TopologyPage({ searchParams }: PageProps) {
  console.log('🔥🔥🔥 PAGE FUNCTION CALLED 🔥🔥🔥');
  
  const params = await searchParams;
  const companyId = params.company || 'novascale_ai';
  
  const timestamp = new Date().toISOString();
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📄 PAGE RENDER @ ', timestamp);
  console.log('📄 Company ID:', companyId);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const data = loadTopologyData(companyId);
  
  if (!data) {
    console.error('❌ Failed to load data for:', companyId);
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
        Failed to load topology data for {companyId}
      </div>
    );
  }
  
  console.log('✓ Page render complete for:', data.company.name);
  console.log('✓ Nodes in network:', data.network.nodes.length);
  console.log('✓ First 3 nodes:', data.network.nodes.slice(0, 3));
  
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <CompanySwitcherWrapper />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <TopologyView data={data} key={`${companyId}-${timestamp}`} />
      </div>
    </div>
  );
}
