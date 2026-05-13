/**
 * RRFA Raw Events (E2_real)
 * 
 * Raw organizational events before transformation.
 * These are the input layer - minimal structure, maximum flexibility.
 */

export interface RawEvent {
  event_id: string;
  timestamp: number;
  from_node: string;
  to_node: string;
  
  // Temporal characteristics
  responseLatency?: number;      // ms delay
  retryCount?: number;            // retry attempts
  
  // Structural characteristics
  routingChange?: boolean;        // path changed?
  participationDelta?: number;    // participant count change (-1.0 to 1.0)
  authorityShift?: boolean;       // escalation happened?
  
  // Pressure indicators
  urgencyLevel?: number;          // 0.0 to 1.0
  deadlinePressure?: number;      // 0.0 to 1.0
}

export interface RawEventCollection {
  company_id: string;
  events: RawEvent[];
  metadata: {
    generated_at: number;
    event_count: number;
    time_span: {
      start: number;
      end: number;
    };
  };
}
