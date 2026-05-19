/**
 * Primitive Visual Language v5 - target-image saturation
 *
 * Glow blur scaled up to 45px max (was 26).
 * Glow alpha up to 0.9 (was 0.78).
 * Size spread steeper for visible node-size variation.
 */

export type VisualTier = 'primary' | 'midground' | 'background';

const CARRIER_PALETTE: { [k: string]: string } = {
  'EVT':  '#ff8c42',
  'MAIL': '#ffd93d',
  'KPI':  '#5dd5c4',
  'DOC':  '#a55eea',
  'SIG':  '#1abc9c',
  'USR':  '#5dade2',
  'ACT':  '#27ae60',
  'SYS':  '#7f8c8d',
};

const DEFAULT_NODE_COLOR = '#64c8ff';
const EDGE_BASE_RGB = '160, 200, 255';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const PrimitiveVisuals = {

  carrierTypeToColor(carrierType: string): string {
    const prefix = (carrierType ?? '').split('_')[0]?.toUpperCase() ?? '';
    return CARRIER_PALETTE[prefix] ?? DEFAULT_NODE_COLOR;
  },

  // STEEPER size spread: 35 + sqrt(count) * 6 (was *4)
  // signal_count 13 → 56px,  29 → 67px,  41 → 73px
  signalCountToSize(signalCount: number, baseSize: number = 32): number {
    return baseSize + Math.sqrt(Math.max(0, signalCount)) * 6;
  },

  // MASSIVE glow: blur up to 45px, alpha up to 0.9
  propagationToGlow(propagation: number, nodeColor: string = DEFAULT_NODE_COLOR): string {
    const blur = propagation * 45;
    const alpha = propagation * 0.9;
    return `0 0 ${blur}px ${hexToRgba(nodeColor, alpha)}`;
  },

  propagationToBrightness(propagation: number): number {
    return 0.65 + (propagation * 0.35);
  },

  densityToSize(density: number, baseSize: number = 40): number {
    return baseSize * (1 + density * 0.5);
  },

  densityToColor(density: number): string {
    const hue = 200 - (density * 170);
    return `hsl(${hue}, ${45 + density * 15}%, 55%)`;
  },

  driftToTremble(globalDrift: number): { amount: number; speed: number; active: boolean } {
    return {
      amount: globalDrift * 1.5,
      speed: 80 + (globalDrift * 40),
      active: globalDrift > 0.7
    };
  },

  couplingToEdgeWidth(coupling: number, tier: VisualTier): number {
    if (tier === 'primary') return 1 + (coupling * 4);
    if (tier === 'midground') return 0.7 + (coupling * 2);
    return 0.5;
  },

  couplingToEdgeOpacity(coupling: number, tier: VisualTier): number {
    if (tier === 'background') return 0.18;
    if (tier === 'midground') return 0.45 + (coupling * 0.35);
    return 0.65 + (coupling * 0.3);
  },

  edgeColor(opacity: number): string {
    return `rgba(${EDGE_BASE_RGB}, ${opacity})`;
  },

  couplingToEdgeStyle(coupling: number): 'solid' | 'dashed' {
    return coupling > 0.3 ? 'solid' : 'dashed';
  },

  delayToFlowDuration(delay: number): number {
    return 6 + (delay * 4);
  },

  shouldAnimateFlow(tier: VisualTier): boolean {
    return tier !== 'background';
  },

  shouldShowLabel(_tier: VisualTier, _isHovered: boolean): boolean {
    return true;  // all labels always shown to match target
  },

  labelFontSize(tier: VisualTier): number {
    return tier === 'primary' ? 13 : 11;
  },

  breathingSpeed(): number { return 4000; },
  breathingScale(): number { return 0.03; },

  globalToBackgroundLuminosity(avgPropagation: number): number {
    return 0.03 + (avgPropagation * 0.05);
  },

  defaultTransition: 'all 250ms ease-out',
  maxFrameDeltaPercent: 0.15,
};

export const VisualConstants = {
  NODE_BASE_SIZE: 32,
  EDGE_BASE_WIDTH: 1,
  BREATHING_DURATION: 4000,
  TREMBLE_GLOBAL_THRESHOLD: 0.7,
  BACKGROUND_BASE_LUMINOSITY: 0.03,
  EDGE_MIN_WEIGHT: 0.20,
  EDGE_TOP_K_PER_NODE: 3,
};
