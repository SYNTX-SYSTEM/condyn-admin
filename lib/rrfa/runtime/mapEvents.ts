import fs from 'fs';
import path from 'path';
import { TransformationEngine } from '../transformation/transformationEngine';
import { PrimitiveProjector } from '../primitives/primitiveProjection';
import { FieldAggregator } from '../field/fieldAggregator';
import { AtomicSignal } from '../signals/atomicSignal';
import { ProjectedSignal } from '../signals/projectedSignal';

/**
 * Event Mapper - Runtime orchestration
 * 
 * Processes raw events through the complete RRFA pipeline:
 * E2_real → T → E3_signal [→ Projection → E3_projected] [→ Aggregation → FieldTopology]
 */

export class EventMapper {
  
  /**
   * Process all companies
   */
  static async processAll(
    withProjection: boolean = false,
    withAggregation: boolean = false
  ): Promise<void> {
    const companies = ['novascale_ai', 'helixbank_europe', 'medcore_health'];
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('        ⚙️  E2_real → T → E3_signal');
    if (withProjection || withAggregation) {
      console.log('        🎯 + Primitive Projection');
    }
    if (withAggregation) {
      console.log('        🌐 + Field Aggregation');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (const company of companies) {
      await this.processCompany(company, withProjection, withAggregation);
    }
    
    console.log('✅ All companies transformed!\n');
  }
  
  /**
   * Process single company
   */
  static async processCompany(
    companyId: string,
    withProjection: boolean = false,
    withAggregation: boolean = false
  ): Promise<void> {
    console.log(`🔄 Processing: ${companyId}`);
    
    // 1. Load raw events
    const rawPath = `data/companies/${companyId}/raw_events/events.json`;
    const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
    console.log(`   📥 Loaded ${rawData.events.length} raw events`);
    
    // 2. Transform E2 → E3
    console.log('   ⚙️  Transforming E2_real → T → E3_signal...');
    const atomicSignals: AtomicSignal[] = TransformationEngine.transform(rawData.events);
    console.log(`   ✨ Generated ${atomicSignals.length} signal vectors`);
    
    // 3. Optional: Project to primitives
    let projectedSignals: ProjectedSignal[] | null = null;
    if (withProjection || withAggregation) {
      console.log('   🎯 Projecting to primitive space...');
      projectedSignals = PrimitiveProjector.project(atomicSignals);
      console.log(`   ✨ Generated ${projectedSignals.length} projected signals`);
    }
    
    // 4. Optional: Aggregate to field topology
    if (withAggregation && projectedSignals) {
      console.log('   🌐 Aggregating field topology...');
      const topology = FieldAggregator.aggregate(projectedSignals, companyId);
      console.log(`   ✨ Generated field with ${topology.nodes.length} nodes`);
      
      // Save field topology
      const signalsDir = `data/companies/${companyId}/signals`;
      if (!fs.existsSync(signalsDir)) {
        fs.mkdirSync(signalsDir, { recursive: true });
      }
      
      const topologyPath = path.join(signalsDir, 'field_topology.json');
      fs.writeFileSync(topologyPath, JSON.stringify(topology, null, 2));
      console.log(`   💾 ${topologyPath}`);
    }
    
    // 5. Save signals
    const signalsDir = `data/companies/${companyId}/signals`;
    if (!fs.existsSync(signalsDir)) {
      fs.mkdirSync(signalsDir, { recursive: true });
    }
    
    if (projectedSignals) {
      // Save projected signals
      const signalsPath = path.join(signalsDir, 'signals_projected.json');
      const output = {
        company_id: companyId,
        signals: projectedSignals,
        metadata: {
          signal_count: projectedSignals.length,
          generated_at: new Date().toISOString(),
          with_projection: true
        }
      };
      fs.writeFileSync(signalsPath, JSON.stringify(output, null, 2));
      console.log(`   💾 ${signalsPath}`);
    } else {
      // Save atomic signals only
      const signalsPath = path.join(signalsDir, 'signals_vectors.json');
      const output = {
        company_id: companyId,
        signals: atomicSignals,
        metadata: {
          signal_count: atomicSignals.length,
          generated_at: new Date().toISOString(),
          with_projection: false
        }
      };
      fs.writeFileSync(signalsPath, JSON.stringify(output, null, 2));
      console.log(`   💾 ${signalsPath}`);
    }
    
    // 6. Create timestamped snapshot
    const snapshotPath = path.join(signalsDir, `snapshot_${Date.now()}.json`);
    const snapshotData = projectedSignals 
      ? { company_id: companyId, signals: projectedSignals }
      : { company_id: companyId, signals: atomicSignals };
    
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshotData, null, 2));
    console.log(`   📸 ${snapshotPath}\n`);
  }
}
