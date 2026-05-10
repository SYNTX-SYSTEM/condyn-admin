import * as fs from 'fs';
import * as path from 'path';
import type { 
  TopologyData, 
  Company, 
  Network, 
  Signal, 
  Link, 
  Event 
} from '@/types/topology';

/**
 * Loads complete topology data for a company from filesystem
 * Server-side only - reads directly from data/ directory
 * 
 * @param companyId - Company directory name (e.g., 'novascale_ai')
 * @returns Complete topology data or null on error
 */
export function loadTopologyData(companyId: string): TopologyData | null {
  try {
    const basePath = path.join(process.cwd(), 'data', 'companies', companyId);
    
    // Validate path exists
    if (!fs.existsSync(basePath)) {
      console.error(`Company path does not exist: ${basePath}`);
      return null;
    }
    
    // Read company.json
    const companyPath = path.join(basePath, 'company.json');
    const company: Company = JSON.parse(fs.readFileSync(companyPath, 'utf-8'));
    
    // Read network.json
    const networkPath = path.join(basePath, 'analysis', 'network.json');
    const network: Network = JSON.parse(fs.readFileSync(networkPath, 'utf-8'));
    
    // Read all signals
    const signalsPath = path.join(basePath, 'analysis', 'signals');
    const signals: Signal[] = fs.existsSync(signalsPath)
      ? fs.readdirSync(signalsPath)
          .filter(f => f.endsWith('.json'))
          .map(f => JSON.parse(fs.readFileSync(path.join(signalsPath, f), 'utf-8')))
      : [];
    
    // Read all links
    const linksPath = path.join(basePath, 'analysis', 'links');
    const links: Link[] = fs.existsSync(linksPath)
      ? fs.readdirSync(linksPath)
          .filter(f => f.endsWith('.json'))
          .map(f => JSON.parse(fs.readFileSync(path.join(linksPath, f), 'utf-8')))
      : [];
    
    // Read all events
    const eventsPath = path.join(basePath, 'events');
    const events: Event[] = fs.existsSync(eventsPath)
      ? fs.readdirSync(eventsPath)
          .filter(f => f.endsWith('.json'))
          .map(f => JSON.parse(fs.readFileSync(path.join(eventsPath, f), 'utf-8')))
      : [];
    
    console.log(`✓ Loaded topology for ${companyId}:`, {
      nodes: network.nodes.length,
      signals: signals.length,
      links: links.length,
      events: events.length
    });
    
    return {
      company,
      network,
      signals,
      links,
      events
    };
    
  } catch (error) {
    console.error(`Failed to load topology for ${companyId}:`, error);
    return null;
  }
}
