/**
 * Primitive Visual Language
 * 
 * This file defines how field structure becomes perceptible.
 * This is the visual ontology of ConDyn.
 * 
 * NOT: Arbitrary color choices or animation tricks
 * BUT: Systematic semantic mapping from primitives to perception
 * 
 * CRITICAL: This is interface language design.
 * Every mapping must feel CORRECT, not just visible.
 * Refine through perception testing.
 * 
 * This file defines how structure FEELS.
 */

export const PrimitiveVisuals = {
  
  /**
   * P09 PROPAGATION → Glow + Brightness
   * 
   * Semantic meaning:
   *   High propagation = Signal flows cleanly through network
   *   Low propagation  = Signal blocked, absorbed, or weak
   * 
   * Visual translation:
   *   HIGH: Bright, glowing, radiating energy
   *   LOW:  Dim, muted, contained
   * 
   * Perception goal:
   *   You should FEEL the difference between clean flow and blockage
   */
  propagationToGlow(propagation: number): string {
    const blur = propagation * 20;  // 0-20px blur radius (gentle, not explosive)
    const alpha = propagation * 0.8; // 0-80% opacity
    return `0 0 ${blur}px rgba(100, 200, 255, ${alpha})`;
  },
  
  propagationToBrightness(propagation: number): number {
    return 0.3 + (propagation * 0.7);  // 30% (dim) to 100% (bright)
  },
  
  /**
   * P03 DENSITY → Size + Color Warmth
   * 
   * Semantic meaning:
   *   High density = Activity concentrated at this node
   *   Low density  = Activity dispersed, distributed
   * 
   * Visual translation:
   *   HIGH: Larger nodes, warm colors (orange/red)
   *   LOW:  Smaller nodes, cool colors (blue/cyan)
   * 
   * Perception goal:
   *   You should SEE where activity concentrates
   */
  densityToSize(density: number, baseSize: number = 40): number {
    return baseSize * (1 + density * 0.8);  // Base to +80% growth
  },
  
  densityToColor(density: number): string {
    // Color temperature mapping:
    // Low density (0.0)  → Cool blue   (HSL 200°)
    // Mid density (0.5)  → Neutral     (HSL 115°)
    // High density (1.0) → Warm orange (HSL 30°)
    const hue = 200 - (density * 170);
    const saturation = 60 + (density * 20);  // More saturated when dense
    const lightness = 60;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  },
  
  /**
   * P12 DRIFT → Trembling + Instability
   * 
   * Semantic meaning:
   *   High drift = Structural instability, unreliable state
   *   Low drift  = Stable, consistent structure
   * 
   * Visual translation:
   *   HIGH: Shaking, jittering node (subtle!)
   *   LOW:  Still, calm, stable
   * 
   * Perception goal:
   *   You should SENSE instability without distraction
   */
  driftToTremble(drift: number): {
    amount: number;
    speed: number;
  } {
    return {
      amount: drift * 3,        // Max 3px shake (subtle, not chaotic!)
      speed: 50 + (drift * 50)  // 50-100ms (faster when unstable)
    };
  },
  
  /**
   * P01 COUPLING → Edge Thickness + Solidity
   * 
   * Semantic meaning:
   *   High coupling = Strong stable connection
   *   Low coupling  = Weak, ephemeral link
   * 
   * Visual translation:
   *   HIGH: Thick, solid, opaque edge
   *   LOW:  Thin, faint, transparent
   * 
   * Perception goal:
   *   You should RECOGNIZE connection strength
   */
  couplingToThickness(coupling: number): number {
    return 1 + (coupling * 3);  // 1-4px stroke width
  },
  
  couplingToOpacity(coupling: number): number {
    return 0.3 + (coupling * 0.6);  // 30-90% opacity
  },
  
  /**
   * P08 DELAY → Flow Animation Duration
   * 
   * Semantic meaning:
   *   High delay = Slow transmission, temporal lag
   *   Low delay  = Fast, immediate transmission
   * 
   * Visual translation:
   *   HIGH: Slow particle flow along edge
   *   LOW:  Fast particle flow
   * 
   * Perception goal:
   *   You should PERCEIVE temporal characteristics
   * 
   * CORRECTED (was inverted!):
   *   Low delay  → Short duration (1s) = FAST flow
   *   High delay → Long duration (3s)  = SLOW flow
   */
  delayToFlowDuration(delay: number): number {
    return 1 + (delay * 2);  // 1s (fast) to 3s (slow)
  },
  
  /**
   * BREATHING RATE
   * 
   * Nodes breathe slowly (pulsing size change)
   * NOT: Frantic bouncing
   * BUT: Calm, organic field breathing
   * 
   * This is the heartbeat of the field.
   */
  breathingSpeed(): number {
    return 2000;  // 2 seconds per breath cycle (calm, organic)
  },
  
  breathingScale(): number {
    return 0.05;  // 5% size change (subtle pulsing)
  },
  
  /**
   * GLOBAL FIELD STATE
   * 
   * Background reflects overall field health
   */
  globalToBackgroundLuminosity(avgPropagation: number): number {
    return 0.05 + (avgPropagation * 0.1);  // Subtle background brightness
  },
  
  globalToBackgroundStability(stabilityScore: number): boolean {
    return stabilityScore > 0.9;  // Only shake background if unstable
  }
};

/**
 * Visual Constants
 * 
 * Shared visual parameters across the field
 */
export const VisualConstants = {
  NODE_BASE_SIZE: 40,
  EDGE_BASE_WIDTH: 1,
  GLOW_COLOR: 'rgba(100, 200, 255, 0.8)',
  BREATHING_DURATION: 2000,
  TREMBLE_THRESHOLD: 0.5  // Only tremble if drift > 0.5
};

/**
 * Semantic Notes
 * 
 * This file is critical because it defines the PERCEPTION INTERFACE.
 * 
 * Guidelines for refinement:
 * 
 * 1. Test with real users watching real field states
 * 2. Ask: "Can you FEEL the difference?"
 * 3. Adjust mappings until perception is immediate
 * 4. Document WHY each mapping feels correct
 * 5. Avoid visual gimmicks that don't add semantic clarity
 * 
 * Remember:
 *   This is NOT data visualization.
 *   This is field perception.
 *   The goal is semiotic clarity, not visual spectacle.
 */
