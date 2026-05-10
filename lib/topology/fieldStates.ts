/**
 * Semantic field states for topology visualization
 * Adapted for white background
 */

export const fieldStates = {
  signal: {
    background: '#FEE2E2',
    border: '#EF4444',
    text: '#991B1B',
  },
  
  event: {
    background: '#DBEAFE',
    border: '#3B82F6',
    text: '#1E3A8A',
  },
  
  kpi: {
    background: '#FED7AA',
    border: '#F97316',
    text: '#9A3412',
  },
  
  artifact: {
    background: '#F3F4F6',
    border: '#9CA3AF',
    text: '#374151',
  },
  
  characteristics: {
    high: '#EF4444',
    medium: '#F97316',
    low: '#3B82F6',
  },
  
  link: {
    weak: 'rgba(156, 163, 175, 0.3)',
    medium: 'rgba(59, 130, 246, 0.5)',
    strong: 'rgba(59, 130, 246, 0.8)',
  },
} as const;

export function getNodeFieldState(nodeId: string) {
  if (nodeId.startsWith('SIG')) return fieldStates.signal;
  if (nodeId.startsWith('EVT')) return fieldStates.event;
  if (nodeId.startsWith('KPI')) return fieldStates.kpi;
  return fieldStates.artifact;
}

export function getCharacteristicColor(value: number): string {
  if (value > 0.7) return fieldStates.characteristics.high;
  if (value > 0.5) return fieldStates.characteristics.medium;
  return fieldStates.characteristics.low;
}

export function getLinkFieldState(weight: number) {
  if (weight > 0.8) return fieldStates.link.strong;
  if (weight > 0.5) return fieldStates.link.medium;
  return fieldStates.link.weak;
}
