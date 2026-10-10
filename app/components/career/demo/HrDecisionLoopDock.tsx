"use client";

import React, { useState } from "react";
import { SIL_TOKENS } from "./SILTokens";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";
import {
  boundDecisionContextRevisionIds,
  decisionRevisionBindingIdsFor,
  decisionRevisionBindingRegionState,
  describeDecisionContextLineage
} from "../../../../lib/career/hr-decision-loop/frontend-presentation";
import { useHrDecisionLoop, type DecisionContextEntry } from "../../../../lib/career/ui/useHrDecisionLoop";
import type {
  DecisionContextRevisionLineageDescriptor,
  DecisionContextRevisionPresentation,
  HrDecisionLoopContextLink,
  HrDecisionLoopPresentation,
  HrDecisionLoopPresentationRegion
} from "../../../../lib/career/hr-decision-loop/frontend-presentation";

type DecisionLoopCopy = (typeof SIL_COPY)[SilLocale]["decisionLoop"];

export interface HrDecisionLoopDockProps {
  /** Exact DCTXREV selected by the product workflow (URL), never inferred. */
  careerDecisionContextRevisionId: string;
  /** Optional exact G2 DREV to read as the reconstructed next context. */
  decisionContextRevisionId?: string | null;
  locale?: SilLocale;
  initialOpen?: boolean;
}

const regionColor = (state: HrDecisionLoopPresentationRegion["state"]): string => {
  switch (state) {
    case "AVAILABLE": return SIL_TOKENS.colors.evolutionGreen;
    case "EMPTY": return SIL_TOKENS.colors.textMuted;
    case "NOT_PROVISIONED": return SIL_TOKENS.colors.tensionAmber;
    case "FAILED": return "rgba(255, 91, 101, 0.96)";
  }
};

const valenceColor = (value: string): string => {
  switch (value) {
    case "DESIRABLE": return SIL_TOKENS.colors.evolutionGreen;
    case "UNDESIRABLE": return SIL_TOKENS.colors.tensionAmber;
    case "NEUTRAL": return SIL_TOKENS.colors.textPrimary;
    default: return SIL_TOKENS.colors.textMuted;
  }
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "1px",
  color: SIL_TOKENS.colors.cyanActive
};

const mono: React.CSSProperties = {
  fontFamily: SIL_TOKENS.typography.mono,
  fontSize: "10px",
  color: SIL_TOKENS.colors.textPrimary,
  wordBreak: "break-all"
};

const muted: React.CSSProperties = { ...mono, color: SIL_TOKENS.colors.textMuted };

const panelSurface: React.CSSProperties = {
  backgroundColor: "rgba(6, 11, 18, 0.94)",
  border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
  borderRadius: "8px",
  padding: "10px 12px",
  display: "flex",
  flexDirection: "column",
  gap: "6px"
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  backgroundColor: SIL_TOKENS.colors.field,
  border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
  borderRadius: "4px",
  color: SIL_TOKENS.colors.textPrimary,
  fontFamily: SIL_TOKENS.typography.mono,
  fontSize: "10px",
  padding: "5px 7px"
};

const buttonStyle = (active: boolean): React.CSSProperties => ({
  backgroundColor: active ? "rgba(56, 229, 255, 0.15)" : "transparent",
  border: `1px solid ${active ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.35)"}`,
  color: active ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.5)",
  fontFamily: SIL_TOKENS.typography.mono,
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.5px",
  padding: "5px 8px",
  borderRadius: "4px",
  cursor: active ? "pointer" : "not-allowed"
});

/** Exact navigation to another persisted DCTXREV through the same URL contract; it opens that context, it selects nothing. */
function contextHref(careerDecisionContextRevisionId: string): string {
  return `?careerDecisionContextRevisionId=${encodeURIComponent(careerDecisionContextRevisionId)}`;
}

function ContextLinks({ links, currentContextId, t }: { links: readonly HrDecisionLoopContextLink[]; currentContextId: string; t: DecisionLoopCopy }) {
  const foreign = links.filter(link => link.careerDecisionContextRevisionId !== currentContextId);
  if (foreign.length === 0) return null;
  return (
    <span style={muted}>
      {foreign.map(link => (
        <a
          key={`${link.label}:${link.careerDecisionContextRevisionId}`}
          data-testid={`hr-decision-loop-context-link-${link.careerDecisionContextRevisionId}`}
          data-navigates-to-context={link.careerDecisionContextRevisionId}
          href={contextHref(link.careerDecisionContextRevisionId)}
          style={{ ...mono, color: SIL_TOKENS.colors.cyanActive, marginRight: "10px" }}
        >
          {t.openContext} · {link.label}
        </a>
      ))}
    </span>
  );
}

function RegionRail({ presentation, t }: { presentation: HrDecisionLoopPresentation; t: DecisionLoopCopy }) {
  return (
    <div data-testid="hr-decision-loop-chain" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {presentation.regions.map(region => (
        <div
          key={region.name}
          data-testid={`hr-decision-loop-region-${region.name}`}
          data-region-state={region.state}
          style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "4px 0", borderBottom: `1px dashed ${SIL_TOKENS.colors.fieldBorder}` }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span aria-hidden="true" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: regionColor(region.state), boxShadow: region.state === "AVAILABLE" ? `0 0 8px ${SIL_TOKENS.colors.evolutionGlow}` : undefined, flexShrink: 0 }} />
            <span style={{ ...mono, fontWeight: 700, flex: 1 }}>{t.regions[region.name]}</span>
            <span style={{ ...muted, color: regionColor(region.state) }}>
              {t.regionStates[region.state]}{region.state === "AVAILABLE" ? ` · ${region.count}` : ""}
            </span>
          </div>
          {region.state === "FAILED" && <span style={{ ...muted, color: regionColor("FAILED") }}>{region.failureCode}</span>}
          {region.rows.map(row => (
            <div key={row.id} data-testid={`hr-decision-loop-artifact-${row.id}`} style={{ paddingLeft: "16px", display: "flex", flexDirection: "column" }}>
              <span style={mono}>{row.id}</span>
              <span style={muted}>
                {row.facts.map(fact => (
                  <span key={fact.label} style={{ marginRight: "10px", color: fact.label === "valence" || fact.label === "addedFeedbackValence" ? valenceColor(fact.value) : undefined }}>
                    {fact.label}: {fact.value}
                  </span>
                ))}
              </span>
              <ContextLinks links={row.contextLinks} currentContextId={presentation.careerDecisionContextRevisionId} t={t} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

type BindingLabel = { kind: "BOUND"; bindingIds: string[] } | { kind: "UNBOUND" } | { kind: "UNKNOWN" };

function RevisionCard({ revision, descriptor, binding, t }: { revision: DecisionContextRevisionPresentation; descriptor: DecisionContextRevisionLineageDescriptor; binding: BindingLabel; t: DecisionLoopCopy }) {
  const characterCopy = descriptor.returnCharacter === "ROOT" ? null
    : descriptor.returnCharacter === "INVENTORY_UNCHANGED" ? t.inventoryUnchanged
    : descriptor.returnCharacter === "INVENTORY_EXTENDED" ? t.inventoryExtended
    : t.predecessorNotRead;
  return (
    <div
      data-testid={`decision-context-revision-${revision.revisionId}`}
      data-revision-position={descriptor.position}
      data-return-character={descriptor.returnCharacter}
      data-binding-state={binding.kind}
      style={{ ...panelSurface, borderColor: "rgba(56, 229, 255, 0.35)" }}
    >
      <span style={{ ...mono, fontWeight: 700 }}>{revision.revisionId}</span>
      <span style={{ ...muted, color: SIL_TOKENS.colors.cyanActive }}>
        {descriptor.position === "ROOT" ? t.revisionRoot : t.revisionChild}
        {" · "}
        {binding.kind === "BOUND" ? `${t.boundToThisContext} · ${binding.bindingIds.join(", ")}` : binding.kind === "UNBOUND" ? t.notBoundToThisContext : t.bindingStateUnknown}
      </span>
      {characterCopy && (
        <span data-testid={`decision-context-revision-character-${revision.revisionId}`} style={{ ...muted, color: descriptor.returnCharacter === "INVENTORY_EXTENDED" ? SIL_TOKENS.colors.tensionAmber : SIL_TOKENS.colors.textMuted }}>
          {characterCopy}
        </span>
      )}
      {descriptor.addedSourceStateReferences.length > 0 && (
        <span style={muted}>{t.addedReferences}: {descriptor.addedSourceStateReferences.map(reference => `${reference.authorityContractId} · ${reference.artifactId}`).join("; ")}</span>
      )}
      {descriptor.addedItemIds.length > 0 && <span style={muted}>{t.addedItems}: {descriptor.addedItemIds.join(", ")}</span>}
      <span style={muted}>previousRevisionId: {revision.previousRevisionId ?? "null"}</span>
      <span style={muted}>contextId: {revision.contextId}</span>
      <span style={muted}>validationStatus: {revision.validationStatus}</span>
      <span style={{ ...muted, marginTop: "4px" }}>{t.sourceReferences}</span>
      {revision.sourceStateReferences.map(reference => (
        <span key={`${reference.producerId}:${reference.artifactId}`} style={mono}>{reference.producerId} · {reference.authorityContractId} · {reference.artifactId}</span>
      ))}
      <span style={{ ...muted, marginTop: "4px" }}>{t.items}</span>
      {revision.items.map(item => (
        <div key={item.itemId} data-testid={`decision-context-item-${item.itemId}`} style={{ display: "flex", flexDirection: "column", paddingLeft: "8px", borderLeft: `1px solid ${SIL_TOKENS.colors.fieldBorder}` }}>
          <span style={{ ...mono, color: SIL_TOKENS.colors.cyanActive }}>{item.role}</span>
          <span style={mono}>{item.statement}</span>
          <span style={muted}>{item.provenanceOrigin} · {item.provenanceDetail}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * CONDYN / SYNTX — SIL HR Decision Loop Dock.
 * A right-side instrument that represents one exact Career Decision Context
 * revision, admits one human declaration through the G3 DCR gate, shows the
 * persisted post-decision states, and reads the reconstructed next G2
 * Decision Context revision by exact id. It owns no planetarium geometry and
 * creates no semantic authority: every label is a persisted field.
 */
export function HrDecisionLoopDock({ careerDecisionContextRevisionId, decisionContextRevisionId = null, locale = SIL_COPY.defaultLocale, initialOpen = true }: HrDecisionLoopDockProps) {
  const t = SIL_COPY[locale].decisionLoop;
  const [isOpen, setIsOpen] = useState(initialOpen);
  const { loop, declaration, nextContext, declare, loadNextContext } = useHrDecisionLoop(careerDecisionContextRevisionId, decisionContextRevisionId);
  const [declarantActorId, setDeclarantActorId] = useState("");
  const [declarationClass, setDeclarationClass] = useState("");
  const [evidenceText, setEvidenceText] = useState("");
  const [nextRevisionInput, setNextRevisionInput] = useState(decisionContextRevisionId ?? "");

  const presentation = loop.state === "AVAILABLE" ? loop.presentation : null;
  const boundIds = presentation ? boundDecisionContextRevisionIds(presentation) : [];
  const bindingRegion = presentation ? decisionRevisionBindingRegionState(presentation) : null;
  /** Bound here means a persisted DCDRB of this exact context names the DREV; unknown when the binding family itself is not readable. */
  const bindingLabelFor = (revisionId: string): BindingLabel => {
    if (!presentation || bindingRegion === null || (bindingRegion.state !== "AVAILABLE" && bindingRegion.state !== "EMPTY")) return { kind: "UNKNOWN" };
    const bindingIds = decisionRevisionBindingIdsFor(presentation, revisionId);
    return bindingIds.length > 0 ? { kind: "BOUND", bindingIds } : { kind: "UNBOUND" };
  };
  /** Keeps the URL an honest record of the explicit id the dock is reading; it never rewrites the DCTXREV. */
  const openRevision = (revisionId: string, entry: DecisionContextEntry) => {
    setNextRevisionInput(revisionId);
    if (typeof window !== "undefined" && typeof window.history?.replaceState === "function") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("decisionContextRevisionId", revisionId);
        window.history.replaceState(window.history.state, "", url.toString());
      } catch { /* navigation state is a convenience, never a requirement */ }
    }
    void loadNextContext(revisionId, entry);
  };
  const evidenceRefs = evidenceText.split("\n").map(line => line.trim()).filter(line => line.length > 0);
  const canDeclare = presentation !== null && declaration.state !== "SUBMITTING" && declarantActorId.trim().length > 0 && declarationClass.length > 0 && evidenceRefs.length > 0;

  if (!isOpen) {
    return (
      <button
        data-testid="hr-decision-loop-dock-toggle"
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          right: "24px",
          top: "132px",
          zIndex: 50,
          backgroundColor: "rgba(10, 14, 20, 0.85)",
          border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
          borderRadius: "8px",
          padding: "8px 14px",
          color: SIL_TOKENS.colors.cyanActive,
          fontFamily: SIL_TOKENS.typography.mono,
          fontSize: "11px",
          cursor: "pointer",
          boxShadow: `0 0 12px ${SIL_TOKENS.colors.cyanGlow}`
        }}
      >
        {t.toggleOpen}
      </button>
    );
  }

  return (
    <aside
      data-testid="hr-decision-loop-dock"
      data-loop-read-state={loop.state}
      data-declaration-state={declaration.state}
      data-next-context-state={nextContext.state}
      style={{
        position: "fixed",
        right: "24px",
        top: "132px",
        width: "420px",
        maxHeight: "calc(100vh - 332px)",
        overflowY: "auto",
        zIndex: 50,
        backgroundColor: "rgba(10, 14, 20, 0.94)",
        border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
        borderRadius: "12px",
        padding: "14px",
        fontFamily: SIL_TOKENS.typography.mono,
        color: SIL_TOKENS.colors.textPrimary,
        boxShadow: `0 0 24px ${SIL_TOKENS.colors.cyanGlow}`,
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "12px", color: SIL_TOKENS.colors.cyanActive, letterSpacing: "1px" }}>{t.title}</h3>
        <button data-testid="hr-decision-loop-dock-collapse" onClick={() => setIsOpen(false)} style={buttonStyle(true)}>{t.collapse}</button>
      </div>

      <section data-testid="hr-decision-loop-context" style={panelSurface}>
        <h4 style={sectionTitle}>{t.context}</h4>
        <span style={mono}>{careerDecisionContextRevisionId}</span>
        {(loop.state === "IDLE" || loop.state === "LOADING") && <span data-testid="hr-decision-loop-loading" style={muted}>{t.loading}</span>}
        {loop.state === "NOT_FOUND" && <span data-testid="hr-decision-loop-not-found" style={{ ...muted, color: regionColor("FAILED") }}>{t.notFound}</span>}
        {loop.state === "FAILED" && <span data-testid="hr-decision-loop-failed" style={{ ...muted, color: regionColor("FAILED") }}>{t.readFailed}{loop.code ? ` · ${loop.code}` : ""}{loop.reason ? ` · ${loop.reason}` : ""}</span>}
        {presentation && (
          <>
            <span style={muted}>{t.authority}</span>
            <span style={mono}>{presentation.decisionAuthorityGrantRevisionId}</span>
            <span style={muted}>{t.authorizedActor}: <span style={mono}>{presentation.authorizedActorId}</span> · {t.grantor}: <span style={mono}>{presentation.grantorActorId}</span></span>
            <span style={muted}>{t.window}: {presentation.effectiveFrom} → {presentation.effectiveUntil ?? t.openEnded}</span>
            <span style={muted}>{t.proposal}</span>
            <span style={mono}>{presentation.recommendationProposalId}</span>
            <span style={muted}>{t.subjects}</span>
            {presentation.subjects.map(subject => (
              <span key={subject.sourceEvolutionInputItemOrdinal} data-testid={`hr-decision-loop-subject-${subject.sourceEvolutionInputItemOrdinal}`} style={mono}>
                {t.subjectOrdinal} {subject.sourceEvolutionInputItemOrdinal} · {subject.recommendationDisposition} · {subject.recommendationKind ?? "null"} · {subject.tensionClassificationCode}
              </span>
            ))}
            <span style={muted}>{t.permittedClasses}: {presentation.permittedDecisionClasses.join(", ")}</span>
          </>
        )}
      </section>

      {presentation && (
        <section data-testid="hr-decision-loop-declaration" style={panelSurface}>
          <h4 style={sectionTitle}>{t.declare}</h4>
          <label style={muted}>{t.declarant}
            <input data-testid="hr-decision-declarant-input" value={declarantActorId} onChange={event => setDeclarantActorId(event.target.value)} style={inputStyle} />
          </label>
          <span style={muted}>{t.declarationClass}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {presentation.permittedDecisionClasses.map(value => (
              <button
                key={value}
                type="button"
                data-testid={`hr-decision-class-${value}`}
                aria-pressed={declarationClass === value}
                onClick={() => setDeclarationClass(value)}
                style={buttonStyle(declarationClass === value)}
              >
                {value}
              </button>
            ))}
          </div>
          <label style={muted}>{t.evidenceRefs}
            <textarea data-testid="hr-decision-evidence-input" value={evidenceText} onChange={event => setEvidenceText(event.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </label>
          <button
            type="button"
            data-testid="hr-decision-declare-btn"
            disabled={!canDeclare}
            onClick={() => void declare({ declarantActorId: declarantActorId.trim(), declarationClass, declaredAt: new Date().toISOString(), declarationEvidenceRefs: evidenceRefs })}
            style={buttonStyle(canDeclare)}
          >
            {declaration.state === "SUBMITTING" ? t.submitting : t.submit}
          </button>
          {declaration.state === "DECLARED" && (
            <span data-testid="hr-decision-declared" style={{ ...mono, color: SIL_TOKENS.colors.evolutionGreen }}>{t.declared} · {declaration.record.humanDecisionRecordId}</span>
          )}
          {declaration.state === "REJECTED" && (
            <span data-testid="hr-decision-rejected" style={{ ...mono, color: SIL_TOKENS.colors.tensionAmber }}>
              {declaration.code === "ERR_HR_DECISION_LOOP_API_CONFLICT" ? t.conflict : declaration.code === "ERR_HR_DECISION_LOOP_API_UNAUTHENTICATED" ? t.unauthenticated : declaration.code === "ERR_HR_DECISION_LOOP_API_PRINCIPAL_MISMATCH" ? t.principalMismatch : t.rejected}
              {" · "}{declaration.reason ?? declaration.code}
            </span>
          )}
          {declaration.state === "FAILED" && (
            <span data-testid="hr-decision-failed" style={{ ...mono, color: regionColor("FAILED") }}>{t.readFailed}{declaration.code ? ` · ${declaration.code}` : ""}</span>
          )}
        </section>
      )}

      {presentation && (
        <section style={panelSurface}>
          <h4 style={sectionTitle}>{t.chain}</h4>
          <RegionRail presentation={presentation} t={t} />
        </section>
      )}

      <section data-testid="hr-decision-loop-next-context" style={panelSurface}>
        <h4 style={sectionTitle}>{t.nextContext}</h4>
        <span style={muted}>{t.nextContextHint}</span>
        {presentation && (
          <div data-testid="hr-decision-loop-bound-revisions" data-bound-count={boundIds.length} data-binding-region-state={bindingRegion?.state ?? "ABSENT"} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={muted}>{t.boundRevisions}</span>
            {bindingRegion?.state === "NOT_PROVISIONED" && <span data-testid="hr-decision-loop-bound-revisions-not-provisioned" style={{ ...muted, color: SIL_TOKENS.colors.tensionAmber }}>{t.boundRevisionsNotProvisioned}</span>}
            {bindingRegion?.state === "FAILED" && <span data-testid="hr-decision-loop-bound-revisions-failed" style={{ ...muted, color: regionColor("FAILED") }}>{t.boundRevisionsFailed}{bindingRegion.failureCode ? ` · ${bindingRegion.failureCode}` : ""}</span>}
            {bindingRegion?.state === "EMPTY" && <span data-testid="hr-decision-loop-bound-revisions-none" style={muted}>{t.boundRevisionsNone}</span>}
            {boundIds.map(revisionId => {
              const bindingIds = decisionRevisionBindingIdsFor(presentation, revisionId);
              return (
                <button
                  key={revisionId}
                  type="button"
                  data-testid={`bound-decision-context-revision-${revisionId}`}
                  disabled={nextContext.state === "LOADING"}
                  onClick={() => openRevision(revisionId, { kind: "BINDING", careerDecisionContextDecisionRevisionBindingId: bindingIds[0] ?? "" })}
                  style={{ ...buttonStyle(true), ...mono, textAlign: "left" }}
                >
                  {revisionId} · {bindingIds.join(", ")}
                </button>
              );
            })}
          </div>
        )}
        <div style={{ display: "flex", gap: "6px" }}>
          <input data-testid="next-context-revision-input" placeholder={t.nextContextInput} value={nextRevisionInput} onChange={event => setNextRevisionInput(event.target.value)} style={inputStyle} />
          <button
            type="button"
            data-testid="next-context-load-btn"
            disabled={nextRevisionInput.trim().length === 0 || nextContext.state === "LOADING"}
            onClick={() => openRevision(nextRevisionInput.trim(), { kind: "INPUT" })}
            style={{ ...buttonStyle(nextRevisionInput.trim().length > 0), whiteSpace: "nowrap" }}
          >
            {nextContext.state === "LOADING" ? t.nextContextLoading : t.nextContextLoad}
          </button>
        </div>
        {nextContext.state !== "IDLE" && (
          <span data-testid="next-context-entry" data-entry-kind={nextContext.entry.kind} style={muted}>
            {t.entryLabel}: {nextContext.entry.kind === "URL" ? t.entryUrl : nextContext.entry.kind === "INPUT" ? t.entryInput : `${t.entryBinding} · ${nextContext.entry.careerDecisionContextDecisionRevisionBindingId}`} · {nextContext.revisionId}
          </span>
        )}
        {nextContext.state === "NOT_FOUND" && <span data-testid="next-context-not-found" style={{ ...muted, color: regionColor("FAILED") }}>{t.nextContextNotFound}</span>}
        {nextContext.state === "FAILED" && <span data-testid="next-context-failed" style={{ ...muted, color: regionColor("FAILED") }}>{t.nextContextFailed}{nextContext.code ? ` · ${nextContext.code}` : ""}</span>}
        {nextContext.state === "AVAILABLE" && (
          <div data-testid="next-context-lineage" data-lineage-terminal={nextContext.lineage.terminal} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={muted}>{t.lineage} · {nextContext.lineage.revisions.length}</span>
            {describeDecisionContextLineage(nextContext.lineage.revisions).map((descriptor, index) => (
              <RevisionCard
                key={descriptor.revisionId}
                revision={nextContext.lineage.revisions[index]}
                descriptor={descriptor}
                binding={bindingLabelFor(descriptor.revisionId)}
                t={t}
              />
            ))}
            <span data-testid="next-context-terminal" style={{ ...muted, color: nextContext.lineage.terminal === "ROOT_REACHED" ? SIL_TOKENS.colors.textMuted : SIL_TOKENS.colors.tensionAmber }}>
              {nextContext.lineage.terminal === "ROOT_REACHED" ? t.rootReached
                : nextContext.lineage.terminal === "PREDECESSOR_NOT_FOUND" ? t.predecessorNotFound
                : nextContext.lineage.terminal === "PREDECESSOR_READ_FAILED" ? `${t.predecessorReadFailed}${nextContext.lineage.failureCode ? ` · ${nextContext.lineage.failureCode}` : ""}`
                : nextContext.lineage.terminal === "PREDECESSOR_UNDECODABLE" ? t.predecessorUndecodable
                : t.depthBound}
            </span>
          </div>
        )}
        <span style={{ ...muted, color: SIL_TOKENS.colors.tensionAmber }}>{t.bindingBoundary}</span>
      </section>

      <span data-testid="hr-decision-loop-non-claims" style={{ ...muted, textAlign: "center", letterSpacing: "0.5px" }}>{t.nonClaims}</span>
    </aside>
  );
}
