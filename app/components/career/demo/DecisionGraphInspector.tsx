import React from "react";
import { DirectedEvidenceGraph } from "../../../../lib/career/evidence/graph";
import { GraphFocus, getEvidenceHeatmapToken } from "../../../../lib/career/evidence/highlight";

export interface DecisionGraphInspectorProps {
  graph: DirectedEvidenceGraph;
  focus: GraphFocus | null;
  onSelectNode?: (nodeId: string) => void;
}

/**
 * SIL v3.0 Decision Graph Inspector HUD.
 * Strictly Dumb Consumer: Never traverses the graph itself; only renders the pre-computed GraphFocus.
 */
export const DecisionGraphInspector: React.FC<DecisionGraphInspectorProps> = ({
  graph,
  focus,
  onSelectNode
}) => {
  if (!focus) {
    return (
      <div
        data-testid="decision-graph-inspector-idle"
        className="fixed bottom-6 left-6 z-40 w-96 rounded-2xl border border-white/10 bg-black/80 p-5 text-slate-300 shadow-2xl backdrop-blur-xl font-mono text-xs"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="font-bold text-cyan-400 tracking-widest">
            DECISION GRAPH INSPECTOR
          </span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
            SIL v3.0
          </span>
        </div>
        <p className="mt-3 text-slate-500">
          Hover or select any node in the Planetarium to inspect its bidirectional Decision Graph focus.
        </p>
      </div>
    );
  }

  // Resolve focus node across node arrays
  const focusId = focus.focusNodeId;
  const capabilityNode = graph.capabilityNodes.find((n) => n.id === focusId);
  const requirementNode = graph.requirementNodes.find((n) => n.id === focusId);
  const evidenceNode = graph.evidenceNodes.find((n) => n.id === focusId);
  const jobNode = graph.jobNodes.find((n) => n.id === focusId);
  const orgNode = graph.organisationNodes.find((n) => n.id === focusId);
  const sourceNode = graph.sourceNodes.find((n) => n.id === focusId);

  const nodeTitle =
    capabilityNode?.name ||
    requirementNode?.requirementName ||
    jobNode?.title ||
    orgNode?.name ||
    sourceNode?.title ||
    evidenceNode?.id ||
    focusId;

  const nodeTypeLabel = capabilityNode
    ? "CAPABILITY"
    : requirementNode
      ? "REQUIREMENT"
      : jobNode
        ? "JOB ROLE"
        : orgNode
          ? "ORGANISATION"
          : evidenceNode
            ? "EVIDENCE"
            : sourceNode
              ? "SOURCE DOCUMENT"
              : "NODE";

  // Resolve upstream & downstream items from focus arrays
  const upstreamEvidences = graph.evidenceNodes.filter((ev) =>
    focus.upstreamNodes.includes(ev.id)
  );
  const upstreamSources = graph.sourceNodes.filter((src) =>
    focus.upstreamNodes.includes(src.id)
  );

  const downstreamRequirements = graph.requirementNodes.filter((req) =>
    focus.downstreamNodes.includes(req.id)
  );
  const downstreamJobs = graph.jobNodes.filter((job) =>
    focus.downstreamNodes.includes(job.id)
  );
  const downstreamOrgs = graph.organisationNodes.filter((org) =>
    focus.downstreamNodes.includes(org.id)
  );

  // Compute decision state & evidence quality token
  const avgConfidence =
    evidenceNode?.confidence ??
    (upstreamEvidences.length > 0
      ? upstreamEvidences.reduce((s, e) => s + e.confidence, 0) / upstreamEvidences.length
      : undefined);

  const hasMissingOrWeakEvidence =
    (avgConfidence !== undefined && avgConfidence < 0.70) || (capabilityNode && upstreamEvidences.length === 0);

  const heatmapToken = getEvidenceHeatmapToken(
    avgConfidence ?? 0,
    hasMissingOrWeakEvidence && (avgConfidence === undefined || avgConfidence <= 0)
  );

  const isBlocked = hasMissingOrWeakEvidence;

  return (
    <div
      data-testid="decision-graph-inspector"
      className="fixed bottom-6 left-6 z-40 w-[420px] rounded-2xl border border-cyan-500/30 bg-black/85 p-5 text-slate-200 shadow-2xl backdrop-blur-xl font-mono text-xs transition-all duration-300"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-bold text-cyan-400 tracking-wider">
            DECISION GRAPH INSPECTOR
          </span>
        </div>
        <span className="rounded bg-cyan-950/80 border border-cyan-500/40 px-2 py-0.5 text-[10px] text-cyan-300">
          SIL v3.0
        </span>
      </div>

      {/* 1. FOCUS NODE */}
      <div className="mt-3 rounded-lg border border-white/10 bg-slate-900/60 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">
            1. FOCUS NODE
          </span>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] text-cyan-300">
            {nodeTypeLabel}
          </span>
        </div>
        <div className="mt-1 font-bold text-sm text-white truncate">
          {nodeTitle}
        </div>
      </div>

      {/* 2. DECISION STATE & EVIDENCE QUALITY */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div
          data-testid="decision-state-container"
          className="rounded-lg border border-white/10 bg-slate-900/60 p-2.5"
        >
          <div className="text-[10px] uppercase text-slate-400 font-semibold">
            DECISION STATE
          </div>
          {isBlocked ? (
            <div
              data-testid="decision-state-blocked"
              className="mt-1 flex items-center gap-1.5 text-red-400 font-bold"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span>BLOCKED</span>
            </div>
          ) : (
            <div
              data-testid="decision-state-supported"
              className="mt-1 flex items-center gap-1.5 text-cyan-400 font-bold"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>SUPPORTED</span>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-900/60 p-2.5">
          <div className="text-[10px] uppercase text-slate-400 font-semibold">
            EVIDENCE QUALITY
          </div>
          <div
            data-testid="evidence-quality-badge"
            className="mt-1 font-bold truncate flex items-center gap-1.5"
            style={{ color: heatmapToken.colorHex }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: heatmapToken.colorHex }}
            />
            <span>{heatmapToken.label}</span>
          </div>
        </div>
      </div>

      {/* 3. TRACEABILITY (Living Traversal Photon Flow) */}
      <div className="mt-2 rounded-lg border border-white/10 bg-slate-900/60 p-3">
        <div className="text-[10px] uppercase text-slate-400 font-semibold">
          TRACEABILITY FLOW
        </div>
        <div
          data-testid="traversal-animation"
          className="mt-2 flex items-center justify-between text-[10px] text-cyan-300"
        >
          <span className="rounded bg-cyan-950 px-1.5 py-0.5 border border-cyan-500/30">
            Source
          </span>
          <span className="text-cyan-500 animate-pulse font-bold">━━━━▶</span>
          <span className="rounded bg-cyan-950 px-1.5 py-0.5 border border-cyan-500/30">
            Evidence
          </span>
          <span className="text-cyan-500 animate-pulse font-bold">━━━━▶</span>
          <span className="rounded bg-cyan-950 px-1.5 py-0.5 border border-cyan-500/30">
            Capability
          </span>
          <span className="text-cyan-500 animate-pulse font-bold">━━━━▶</span>
          <span className="rounded bg-cyan-950 px-1.5 py-0.5 border border-cyan-500/30">
            Requirement
          </span>
        </div>
      </div>

      {/* 4. UPSTREAM */}
      <div className="mt-2 rounded-lg border border-white/10 bg-slate-900/60 p-2.5 max-h-24 overflow-y-auto">
        <div className="text-[10px] uppercase text-slate-400 font-semibold">
          UPSTREAM ({upstreamEvidences.length + upstreamSources.length})
        </div>
        <div className="mt-1 space-y-1">
          {upstreamSources.map((src) => (
            <div
              key={src.id}
              className="text-[11px] text-slate-300 truncate cursor-pointer hover:text-cyan-400"
              onClick={() => onSelectNode?.(src.id)}
            >
              [SRC] {src.title}
            </div>
          ))}
          {upstreamEvidences.map((ev) => (
            <div
              key={ev.id}
              className="text-[11px] text-slate-300 truncate cursor-pointer hover:text-cyan-400"
              onClick={() => onSelectNode?.(ev.id)}
            >
              [EVD] &ldquo;{ev.excerpt}&rdquo;
            </div>
          ))}
          {upstreamSources.length === 0 && upstreamEvidences.length === 0 && (
            <div className="text-[11px] text-slate-500">No upstream proof items</div>
          )}
        </div>
      </div>

      {/* 5. DOWNSTREAM */}
      <div className="mt-2 rounded-lg border border-white/10 bg-slate-900/60 p-2.5 max-h-24 overflow-y-auto">
        <div className="text-[10px] uppercase text-slate-400 font-semibold">
          DOWNSTREAM ({downstreamRequirements.length + downstreamJobs.length + downstreamOrgs.length})
        </div>
        <div className="mt-1 space-y-1">
          {downstreamRequirements.map((req) => (
            <div
              key={req.id}
              className="text-[11px] text-slate-300 truncate cursor-pointer hover:text-cyan-400"
              onClick={() => onSelectNode?.(req.id)}
            >
              [REQ] {req.requirementName} ({req.requiredLevel})
            </div>
          ))}
          {downstreamJobs.map((job) => (
            <div
              key={job.id}
              className="text-[11px] text-slate-300 truncate cursor-pointer hover:text-cyan-400"
              onClick={() => onSelectNode?.(job.id)}
            >
              [JOB] {job.title}
            </div>
          ))}
          {downstreamOrgs.map((org) => (
            <div
              key={org.id}
              className="text-[11px] text-slate-300 truncate cursor-pointer hover:text-cyan-400"
              onClick={() => onSelectNode?.(org.id)}
            >
              [ORG] {org.name}
            </div>
          ))}
          {downstreamRequirements.length === 0 &&
            downstreamJobs.length === 0 &&
            downstreamOrgs.length === 0 && (
              <div className="text-[11px] text-slate-500">No downstream decision items</div>
            )}
        </div>
      </div>
    </div>
  );
};
