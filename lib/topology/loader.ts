import * as fs from 'fs';
import * as path from 'path';
import type { TopologyData, Company, Network, Signal, Link, Event } from '@/types/topology';

export function loadTopologyData(companyId: string): TopologyData | null {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 LOADING TOPOLOGY FOR:', companyId);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  try {
    const basePath = path.join(process.cwd(), 'data', 'companies', companyId);
    
    console.log('📁 Base path:', basePath);
    
    if (!fs.existsSync(basePath)) {
      console.error('❌ Path does not exist:', basePath);
      return null;
    }
    
    const company: Company = JSON.parse(
      fs.readFileSync(path.join(basePath, 'company.json'), 'utf-8')
    );
    
    console.log('✓ Company loaded:', company.name);
    
    const network: Network = JSON.parse(
      fs.readFileSync(path.join(basePath, 'analysis', 'network.json'), 'utf-8')
    );
    
    console.log('✓ Network loaded:', network.nodes.length, 'nodes');
    
    const signalsDir = path.join(basePath, 'analysis', 'signals');
    const signals: Signal[] = fs.existsSync(signalsDir)
      ? fs.readdirSync(signalsDir)
          .filter(f => f.endsWith('.json'))
          .map(f => JSON.parse(fs.readFileSync(path.join(signalsDir, f), 'utf-8')))
      : [];
    
    console.log('✓ Signals loaded:', signals.length);
    
    const linksDir = path.join(basePath, 'analysis', 'links');
    const links: Link[] = fs.existsSync(linksDir)
      ? fs.readdirSync(linksDir)
          .filter(f => f.endsWith('.json'))
          .map(f => JSON.parse(fs.readFileSync(path.join(linksDir, f), 'utf-8')))
      : [];
    
    console.log('✓ Links loaded:', links.length);
    
    const eventsDir = path.join(basePath, 'events');
    const events: Event[] = fs.existsSync(eventsDir)
      ? fs.readdirSync(eventsDir)
          .filter(f => f.endsWith('.json'))
          .map(f => JSON.parse(fs.readFileSync(path.join(eventsDir, f), 'utf-8')))
      : [];
    
    console.log('✓ Events loaded:', events.length);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return { company, network, signals, links, events };
    
  } catch (error) {
    console.error('❌ Failed to load topology for', companyId, ':', error);
    return null;
  }
}
