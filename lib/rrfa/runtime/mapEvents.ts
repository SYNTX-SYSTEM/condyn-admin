import fs from 'fs';
import path from 'path';
import { TransformationEngine } from '../transformation/transformationEngine';
import { PrimitiveProjector } from '../primitives/primitiveProjection';

/**
 * Event Mapper - Runtime orchestration
 * 
 * Processes raw events through the RRFA pipeline:
 * E2_real → T → E3_signal [→ Projection → E3_projected]
 */

export class EventMapper {
  
  /**
   * Process all companies
   */
  static async processAll(withProjection: boolean = false): Promise<void> {
    const companies = ['novascale_ai', 'helixbank_europe', 'medcore_health'];
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('        ⚙️  E2_real → T → E3_signal');
    if (withProjection) {
      console.log('        🎯 + Primitive Projection');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (const company of companies) {
      await this.processCompany(company, withProjection);
    }
    
    console.log('✅ All companies transformed!\n');
  }
  
  /**
   * Process single company
   */
  static async processCompany(
    companyId: string,
    withProjection: boolean = false
  ): Promise<void> {
    console.log(`🔄 Processing: ${companyId}`);
    
    // 1. Load raw events
    const rawPath = `data/companies/${companyId}/raw_events/events.json`;
    const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
    console.log(`   📥 Loaded ${rawData.events.length} raw events`);
    
    // 2. Transform E2 → E3
    console.log('   ⚙️  Transforming E2_real → T → E3_signal...');
    const signals = TransformationEngine.transform(rawData.events);
    console.log(`   ✨ Generated ${signals.length} signal vectors`);
    
    // 3. Optional: Project to primitives
    let finalSignals = signals;
    if (withProjection) {
      console.log('   🎯 Projecting to primitive space...');
      finalSignals = PrimitiveProjector.project(signals);
      console.log(`   ✨ Generated ${finalSignals.length} projected signals`);
    }
    
    // 4. Save signals
    const signalsDir = `data/companies/${companyId}/signals`;
    if (!fs.existsSync(signalsDir)) {
      fs.mkdirSync(signalsDir, { recursive: true });
    }
    
    const filename = withProjection ? 'signals_projected.json' : 'signals_vectors.json';
    const signalsPath = path.join(signalsDir, filename);
    
    const output = {
      company_id: companyId,
      signals: finalSignals,
      metadata: {
        signal_count: finalSignals.length,
        generated_at: new Date().toISOString(),
        with_projection: withProjection
      }
    };
    
    fs.writeFileSync(signalsPath, JSON.stringify(output, null, 2));
    console.log(`   💾 ${signalsPath}`);
    
    // 5. Create timestamped snapshot
    const snapshotPath = path.join(
      signalsDir,
      `snapshot_${Date.now()}.json`
    );
    fs.writeFileSync(snapshotPath, JSON.stringify(output, null, 2));
    console.log(`   📸 ${snapshotPath}\n`);
  }
}
