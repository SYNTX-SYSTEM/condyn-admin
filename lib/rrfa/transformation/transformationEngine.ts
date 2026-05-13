/**
 * RRFA Transformation Engine (T)
 * 
 * E2_real → T → E3_signal
 * 
 * ULTRA-DUMB transformation layer.
 * Only normalizes - NO interpretation, NO field logic, NO domain knowledge.
 */

import { RawEvent } from '../raw/rawEvent';
import { AtomicSignal } from '../signals/atomicSignal';
import { CarrierRegistry } from '../carriers/carrierRegistry';

export class TransformationEngine {
  
  /**
   * Transform raw events to signal vectors
   * BLIND transformation - no context, no interpretation
   */
  static transform(events: RawEvent[]): AtomicSignal[] {
    return events.map(event => this.normalize(event));
  }
  
  /**
   * Normalize single event to signal vector
   */
  private static normalize(event: RawEvent): AtomicSignal {
    return {
      signal_id: `SIG_${event.event_id}`,
      timestamp: event.timestamp,
      source_event: event.event_id,
      
      // Delegate carrier parsing to registry
      from_carrier: CarrierRegistry.parse(event.from_node),
      to_carrier: CarrierRegistry.parse(event.to_node),
      
      // RAW vector - just normalize, don't think!
      vector: {
        intensity: event.urgencyLevel || 0.5,
        latency: this.normalizeLatency(event.responseLatency),
        retry: this.normalizeRetry(event.retryCount),
        routing_shift: event.routingChange ? 1.0 : 0.0,
        participation_delta: event.participationDelta || 0.0,
        urgency: event.urgencyLevel || 0.0,
        deadline_pressure: event.deadlinePressure || 0.0
      }
    };
  }
  
  /**
   * Normalize latency to 0-1 range
   * 0ms = 1.0 (instant), 10000ms = 0.0 (very slow)
   */
  private static normalizeLatency(latency?: number): number {
    if (!latency) return 0.0;
    return Math.max(0.0, 1.0 - (latency / 10000));
  }
  
  /**
   * Normalize retry count to 0-1 range
   * 0 retries = 0.0, 5+ retries = 1.0
   */
  private static normalizeRetry(retryCount?: number): number {
    if (!retryCount) return 0.0;
    return Math.min(1.0, retryCount / 5);
  }
}
