import { AtomicSignal } from './atomicSignal';

/**
 * Projected Signal - E3_signal with primitive weights
 * 
 * Phase 1B output: Atomic signals enhanced with field interpretation
 */

export interface PrimitiveWeights {
  // P01-P12: Relational primitives
  coupling?: number;      // P01: Nodes connecting
  decoupling?: number;    // P02: Nodes separating
  density?: number;       // P03: Activity concentration
  diffusion?: number;     // P04: Activity spreading
  attraction?: number;    // P05: Pulling force
  repulsion?: number;     // P06: Pushing away
  recursion?: number;     // P07: Self-referential loops
  delay?: number;         // P08: Temporal lag
  propagation?: number;   // P09: Signal flow
  masking?: number;       // P10: Information suppression
  resonance?: number;     // P11: Signal amplification
  drift?: number;         // P12: Structural instability
}

export interface ProjectedSignal extends AtomicSignal {
  // Add primitive weights to atomic signal
  primitive_weights: PrimitiveWeights;
}
