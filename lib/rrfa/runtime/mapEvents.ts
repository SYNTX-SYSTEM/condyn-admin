import fs from 'fs';
import path from 'path';
import { RawEventCollection } from '../raw/rawEvent';
import { SignalCollection } from '../signals/atomicSignal';
import { TransformationEngine } from '../transformation/transformationEngine';

export class EventMapper {
  
  static async processCompany(companyId: string): Promise<void> {
    console.log(`\n🔄 Processing: ${companyId}`);
    
    const rawPath = path.join(process.cwd(), 'data/companies', companyId, 'raw_events', 'events.json');
    const rawData: RawEventCollection = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
    
    console.log(`   📥 Loaded ${rawData.events.length} raw events`);
    console.log(`   ⚙️  Transforming E2_real → T → E3_signal...`);
    
    const signals = TransformationEngine.transform(rawData.events);
    
    console.log(`   ✨ Generated ${signals.length} signal vectors`);
    
    const signalCollection: SignalCollection = {
      company_id: companyId,
      signals,
      metadata: {
        generated_at: Date.now(),
        signal_count: signals.length,
        source_events: rawData.events.length
      }
    };
    
    const signalDir = path.join(process.cwd(), 'data/companies', companyId, 'signals');
    fs.mkdirSync(signalDir, { recursive: true });
    
    const vectorPath = path.join(signalDir, 'signals_vectors.json');
    fs.writeFileSync(vectorPath, JSON.stringify(signalCollection, null, 2));
    
    console.log(`   💾 ${vectorPath}`);
    
    const snapshotPath = path.join(signalDir, `snapshot_${Date.now()}.json`);
    fs.writeFileSync(snapshotPath, JSON.stringify(signalCollection, null, 2));
    
    console.log(`   📸 ${snapshotPath}`);
  }
  
  static async processAll(): Promise<void> {
    const companies = ['novascale_ai', 'helixbank_europe', 'medcore_health'];
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('        ⚙️  E2_real → T → E3_signal');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const company of companies) {
      await this.processCompany(company);
    }
    
    console.log('\n✅ All companies transformed!\n');
  }
}
