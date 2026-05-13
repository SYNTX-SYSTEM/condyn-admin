/**
 * RRFA Atomic Signals (E3_signal)
 * 
 * Pure signal vectors - normalized, no interpretation.
 * This is the output of blind transformation.
 */

import { CarrierReference } from '../carriers/carrierRegistry';

export interface AtomicSignal {
  signal_id: string;
  timestamp: number;
  source_event: string;
  
  // CARRIER (relational, universal!)
  from_carrier: CarrierReference;
  to_carrier: CarrierReference;
  
  // RAW SIGNAL VECTOR (normalized, blind!)
  vector: {
    intensity: number;           // 0.0 - 1.0
    latency: number;             // 0.0 - 1.0
    retry: number;               // 0.0 - 1.0
    routing_shift: number;       // 0.0 - 1.0
    participation_delta: number; // -1.0 - 1.0
    urgency: number;             // 0.0 - 1.0
    deadline_pressure: number;   // 0.0 - 1.0
  };
}

export interface SignalCollection {
  company_id: string;
  signals: AtomicSignal[];
  metadata: {
    generated_at: number;
    signal_count: number;
    source_events: number;
  };
}
