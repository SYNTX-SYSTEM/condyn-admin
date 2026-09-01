import type { DemoCareerIntelligenceData } from "../../../app/career/demo/demo-data";
import type { SilOrbitStageId } from "./sil-language";

export interface OrbitFocusItem {
  id: string;
  title: string;
  /** Existing stage-owned metadata. It is never synthesized as evidence. */
  secondary: string[];
}

function present(values: Array<string | undefined>) {
  return values.filter((value): value is string => Boolean(value && value.trim()));
}

/**
 * Adapts each existing SIL collection to the shared spatial shell while
 * retaining its own identity and legitimate secondary content.
 */
export function buildOrbitFocusProjection(
  stageId: SilOrbitStageId | string | null,
  data: DemoCareerIntelligenceData
): OrbitFocusItem[] {
  switch (stageId) {
    case "01":
      return data.sources.map((source) => ({
        id: source.sourceDocumentId || source.contentHash,
        title: source.sourceTitle,
        secondary: present([source.sourceKind, source.sourceUri, source.contentHash])
      }));
    case "02":
      return data.capabilities.map((capability) => ({
        id: capability.id,
        title: capability.name,
        secondary: present([capability.domain, capability.structuralDefinition])
      }));
    case "03":
      return data.companyMatches.map((organization) => ({
        id: organization.organizationId,
        title: organization.organizationName,
        secondary: present([organization.rationale])
      }));
    case "04":
      return data.roleMatches.map((role) => ({
        id: role.roleId,
        title: role.roleTitle,
        secondary: present([role.organizationName, role.rationale])
      }));
    case "05":
      return data.capabilityGaps.map((gap) => ({
        // The existing gap shape has no identifier; this is a deterministic
        // presentation key composed only from its own identity fields.
        id: `gap:${gap.capabilityName}:${gap.requiredByRoleTitle}:${gap.organizationName}`,
        title: gap.capabilityName,
        secondary: present([
          gap.domain,
          gap.requiredByRoleTitle,
          gap.organizationName,
          gap.severity,
          gap.reason
        ])
      }));
    case "06":
      return data.nextActions.map((action) => ({
        id: action.actionId,
        title: action.title,
        secondary: present([action.description, action.expectedImpact])
      }));
    default:
      return [];
  }
}
