import fs from 'fs';
import path from 'path';
import { RawEvent, RawEventCollection } from '../lib/rrfa/raw/rawEvent';

function generateEvents(companyId: string, count: number): RawEvent[] {
  const events: RawEvent[] = [];
  const startTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const nodes = getNodesForCompany(companyId);
  
  for (let i = 0; i < count; i++) {
    const from = nodes[Math.floor(Math.random() * nodes.length)];
    let to = nodes[Math.floor(Math.random() * nodes.length)];
    while (to === from) to = nodes[Math.floor(Math.random() * nodes.length)];
    
    events.push({
      event_id: `EVT_${companyId.toUpperCase()}_${String(i + 1).padStart(3, '0')}`,
      timestamp: startTime + (i * 60 * 60 * 1000),
      from_node: from,
      to_node: to,
      responseLatency: Math.random() > 0.7 ? Math.floor(Math.random() * 8000) : undefined,
      retryCount: Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : undefined,
      routingChange: Math.random() > 0.85,
      participationDelta: Math.random() > 0.7 ? (Math.random() * 2 - 1) : undefined,
      authorityShift: Math.random() > 0.9,
      urgencyLevel: Math.random(),
      deadlinePressure: Math.random() > 0.6 ? Math.random() : undefined
    });
  }
  return events;
}

function getNodesForCompany(companyId: string): string[] {
  const nodeMap: Record<string, string[]> = {
    novascale_ai: ['MAIL_NOVA_001', 'MAIL_NOVA_002', 'MAIL_NOVA_003', 'KPI_NOVA_2026_05', 'EVT_NOVA_001', 'SIG_NOVA_001'],
    helixbank_europe: ['MAIL_HELIX_001', 'MAIL_HELIX_002', 'KPI_HELIX_2026_05', 'EVT_HELIX_001'],
    medcore_health: ['SHIFT_MED_001', 'SHIFT_MED_002', 'SHIFT_MED_003', 'KPI_MED_2026_05', 'EVT_MED_001']
  };
  return nodeMap[companyId] || [];
}

async function main() {
  const companies = ['novascale_ai', 'helixbank_europe', 'medcore_health'];
  console.log('\n🎲 GENERATING RAW EVENTS (E2_real)\n');
  
  for (const company of companies) {
    console.log(`🏭 ${company}`);
    const events = generateEvents(company, 100);
    const collection: RawEventCollection = {
      company_id: company,
      events,
      metadata: {
        generated_at: Date.now(),
        event_count: events.length,
        time_span: { start: events[0].timestamp, end: events[events.length - 1].timestamp }
      }
    };
    
    const dirPath = path.join(process.cwd(), 'data/companies', company, 'raw_events');
    fs.mkdirSync(dirPath, { recursive: true });
    const filePath = path.join(dirPath, 'events.json');
    fs.writeFileSync(filePath, JSON.stringify(collection, null, 2));
    console.log(`   ✅ Generated ${events.length} events`);
    console.log(`   💾 ${filePath}\n`);
  }
  console.log('✅ Done!\n');
}

main().catch(console.error);
