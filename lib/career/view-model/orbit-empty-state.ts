import type { DemoCareerIntelligenceData } from "../../../app/career/demo/demo-data";
import {
  SIL_COPY,
  type SilLocale,
  type SilOrbitStageId
} from "./sil-language";

export interface SilOrbitEmptyStatePresentation {
  stageId: SilOrbitStageId;
  label: string;
  title: string;
  reason: string;
}

function hasProjectedItems(
  stageId: SilOrbitStageId,
  data: DemoCareerIntelligenceData
): boolean {
  switch (stageId) {
    case "01":
      return data.sources.length > 0;
    case "02":
      return data.capabilities.length > 0;
    case "03":
      return data.companyMatches.length > 0;
    case "04":
      return data.roleMatches.length > 0;
    case "05":
      return data.capabilityGaps.length > 0;
    case "06":
      return data.nextActions.length > 0;
  }
}

export function buildSilOrbitEmptyState(
  stageId: string,
  data: DemoCareerIntelligenceData,
  locale: SilLocale = SIL_COPY.defaultLocale
): SilOrbitEmptyStatePresentation | null {
  if (!["01", "02", "03", "04", "05", "06"].includes(stageId)) {
    return null;
  }

  const orbitId = stageId as SilOrbitStageId;

  if (hasProjectedItems(orbitId, data)) {
    return null;
  }

  const copy = SIL_COPY[locale];

  return {
    stageId: orbitId,
    label: copy.emptyFieldLabel,
    title: copy.emptyStates[orbitId].title,
    reason: copy.emptyStates[orbitId].reason
  };
}
