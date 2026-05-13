import { AtomicSignal } from '../signals/atomicSignal';
import { ProjectedSignal, PrimitiveWeights } from '../signals/projectedSignal';

/**
 * Primitive Projection Engine
 * 
 * Transforms normalized signal vectors into primitive weights.
 * This is field-aware interpretation (NOT blind like transformation!).
 * 
 * Phase 1B: Signal → Primitive activation
 */

export class PrimitiveProjector {
  
  /**
   * Project atomic signals into primitive space
   */
  static project(signals: AtomicSignal[]): ProjectedSignal[] {
    return signals.map(signal => this.projectSingle(signal));
  }
  
  /**
   * Project single signal into primitive weights
   */
  private static projectSingle(signal: AtomicSignal): ProjectedSignal {
    const weights = this.calculateWeights(signal);
    
    return {
      ...signal,
      primitive_weights: weights
    };
  }
  
  /**
   * Calculate primitive weights from signal vector
   * 
   * This is where INTERPRETATION happens!
   * Based on corrected latency normalization (0.0 = instant, 1.0 = delay)
   */
  private static calculateWeights(signal: AtomicSignal): PrimitiveWeights {
    const v = signal.vector;
    
    // Helper: positive/negative participation
    const posParticipation = Math.max(0, v.participation_delta);
    const negParticipation = Math.abs(Math.min(0, v.participation_delta));
    const absParticipation = Math.abs(v.participation_delta);
    
    return {
      // P01 Coupling: Stable connection
      // positive participation + low retry + stable routing
      coupling: posParticipation * (1 - v.retry) * (1 - v.routing_shift),
      
      // P02 Decoupling: Nodes separating
      // negative participation OR high retry
      decoupling: Math.max(negParticipation, v.retry),
      
      // P03 Density: Activity concentration
      // high participation + high urgency
      density: absParticipation * v.urgency,
      
      // P04 Diffusion: Activity spreading
      // low participation + low urgency
      diffusion: (1 - absParticipation) * (1 - v.urgency),
      
      // P08 Delay: Temporal lag (INTUITIVE after fix!)
      // HIGH latency = high delay
      delay: v.latency * (1 + v.retry),
      
      // P09 Propagation: Clean signal flow
      // LOW latency + low retry + stable routing
      propagation: (1 - v.latency) * (1 - v.retry) * (1 - v.routing_shift),
      
      // P12 Drift: Structural instability
      // routing changes + deadline pressure
      drift: v.routing_shift * v.deadline_pressure,
      
      // P05, P06, P07, P10, P11: Not implemented yet
      // Will be added in later phases
    };
  }
}
