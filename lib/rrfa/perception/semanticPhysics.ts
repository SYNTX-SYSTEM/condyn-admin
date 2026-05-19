/**
 * Semantic Physics v4 - dense particle flow for target-image look
 */

export type FlowPattern =
  | 'smooth' | 'pulsing' | 'dragging' | 'oscillating' | 'bundling';

export interface EdgeMotion {
  flowVelocity: number;
  flowPattern: FlowPattern;
  turbulence: number;
  phaseShift: number;
  decayRate: number;
  particleCount: number;
}

export class SemanticPhysics {

  private static computePropagationMotion(propagation: number): Partial<EdgeMotion> {
    if (propagation > 0.7) {
      return {
        flowVelocity: 1.2,
        flowPattern: 'smooth',
        turbulence: 0.0,
        particleCount: Math.floor(propagation * 15),   // up to 15
        decayRate: 0.05
      };
    } else if (propagation > 0.3) {
      return {
        flowVelocity: 0.9,
        flowPattern: 'pulsing',
        turbulence: 0.06,
        particleCount: Math.floor(propagation * 10),   // up to 7
        decayRate: 0.2
      };
    } else {
      return {
        flowVelocity: 0.6,
        flowPattern: 'pulsing',
        turbulence: 0.1,
        particleCount: Math.floor(propagation * 5),    // up to 1.5
        decayRate: 0.4
      };
    }
  }

  private static computeDelayMotion(delay: number): Partial<EdgeMotion> {
    if (delay > 0.5) {
      return { flowVelocity: 0.5, flowPattern: 'dragging', phaseShift: delay * Math.PI };
    }
    return { flowVelocity: 1.2, phaseShift: 0 };
  }

  private static computeDriftMotion(drift: number): Partial<EdgeMotion> {
    if (drift > 0.5) {
      return { flowPattern: 'oscillating', turbulence: drift * 0.35, phaseShift: drift * Math.PI * 2 };
    }
    return { turbulence: drift * 0.06 };
  }

  private static computeCouplingMotion(coupling: number): Partial<EdgeMotion> {
    if (coupling > 0.5) {
      return { flowPattern: 'bundling', decayRate: 0.05, particleCount: 12 };
    }
    return { particleCount: 4 };
  }

  private static computeDecouplingMotion(decoupling: number): Partial<EdgeMotion> {
    return { decayRate: decoupling * 0.6, turbulence: decoupling * 0.08 };
  }

  static computeEdgeMotion(primitives: {
    propagation: number;
    delay: number;
    drift: number;
    coupling: number;
    decoupling: number;
  }): EdgeMotion {

    const motion: EdgeMotion = {
      flowVelocity: 1.0,
      flowPattern: 'smooth',
      turbulence: 0.0,
      phaseShift: 0,
      decayRate: 0.12,
      particleCount: 6,
      ...this.computePropagationMotion(primitives.propagation)
    };

    const delayMotion = this.computeDelayMotion(primitives.delay);
    motion.flowVelocity *= (delayMotion.flowVelocity || 1.0) / 1.0;
    if (delayMotion.flowPattern) motion.flowPattern = delayMotion.flowPattern;
    motion.phaseShift += delayMotion.phaseShift || 0;

    const driftMotion = this.computeDriftMotion(primitives.drift);
    motion.turbulence += driftMotion.turbulence || 0;
    motion.phaseShift += driftMotion.phaseShift || 0;
    if (primitives.drift > 0.5 && driftMotion.flowPattern) motion.flowPattern = driftMotion.flowPattern;

    const couplingMotion = this.computeCouplingMotion(primitives.coupling);
    if (primitives.coupling > 0.5 && couplingMotion.flowPattern) {
      motion.flowPattern = couplingMotion.flowPattern;
      motion.turbulence *= 0.4;
    }
    if (couplingMotion.decayRate !== undefined) motion.decayRate = couplingMotion.decayRate;
    if (couplingMotion.particleCount !== undefined) motion.particleCount = couplingMotion.particleCount;

    const decouplingMotion = this.computeDecouplingMotion(primitives.decoupling);
    motion.decayRate += decouplingMotion.decayRate || 0;
    motion.turbulence += decouplingMotion.turbulence || 0;

    motion.flowVelocity = Math.max(0.3, Math.min(1.6, motion.flowVelocity));
    motion.turbulence = Math.max(0.0, Math.min(1.0, motion.turbulence));
    motion.decayRate = Math.max(0.0, Math.min(0.9, motion.decayRate));
    motion.particleCount = Math.max(1, Math.min(15, motion.particleCount));

    return motion;
  }
}
