import type { DemoCareerIntelligenceData } from "../../../app/career/demo/demo-data";
import type { SilOrbitStageId } from "./sil-language";
import {
  buildSourceSatellitePresentation,
  type SourceSatellitePresentation
} from "./source-satellite-presentation";

export interface OrbitFocusItem {
  id: string;
  title: string;
  /** Existing stage-owned metadata. It is never synthesized as evidence. */
  secondary: string[];
  /** Optional display-only grammar for source satellites. */
  sourceSatellite?: SourceSatellitePresentation;
}

function present(values: Array<string | undefined>) {
  return values.filter((value): value is string => Boolean(value && value.trim()));
}

/** The legacy adapter's placeholders (lib/career/ui-adapter.ts): a missing title and a missing content hash. */
const TITLE_PLACEHOLDER = "Unknown Document";
const HASH_PLACEHOLDER = /^HASH-/;

/**
 * §07 of owner G1 (F-SRC-HASH): a placeholder is named as one, never shown as a title or a hash. Display only, in every mode; the
 * adapter's values stay as they are, and the source's identity (sourceDocumentId) is not touched.
 */
export function presentSourcePlaceholders<T extends { sourceTitle?: string; contentHash: string }>(sources: T[], labels: { title: string; hash: string }): T[] {
  return sources.map((source) => {
    const title = source.sourceTitle === TITLE_PLACEHOLDER ? labels.title : source.sourceTitle;
    const contentHash = HASH_PLACEHOLDER.test(source.contentHash) ? labels.hash : source.contentHash;
    return title === source.sourceTitle && contentHash === source.contentHash ? source : { ...source, sourceTitle: title, contentHash };
  });
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
      return data.sources.map((source) => {
        const sourceSatellite = buildSourceSatellitePresentation(source);

        return {
          id: source.sourceDocumentId || source.contentHash,
          title: sourceSatellite.displayTitle,
          secondary: present([source.sourceKind, source.sourceUri, source.contentHash]),
          sourceSatellite
        };
      });
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
