"use client";

import React, { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { SIL_TOKENS } from "./SILTokens";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";
import { NAVIGATION_COPY } from "./navigation-copy";

export interface StagedDocumentItem {
  id: string;
  type: "pdf" | "github" | "website" | "text";
  title: string;
  content?: string;
  url?: string;
}

/** The DLL-full path review point 3: a dropped file reaches this exact intake — same validation as the file button, no new
 *  rules — through this imperative handle, since SourceDock owns `stagedDocs` itself. */
export interface SourceDockHandle {
  stageFile(file: File): void;
}

export interface SourceDockProps {
  onAddSource?: (type: string) => void;
  onAnalyze?: (documents: StagedDocumentItem[]) => void;
  isAnalyzing?: boolean;
  initialStagedDocs?: StagedDocumentItem[];
  locale?: SilLocale;
  /** SFE job-scope invariant: while set, ANALYZE cannot start and this text is shown at the trigger, verbatim. */
  analyzeBlockedMessage?: string | null;
  /** The chosen investigation boundary, named at the trigger (three modes, owner GO 2026-10-15). */
  investigation?: { mode: string; label: string; hint: string } | null;
}

/**
 * F-G1-MD (owner "RECURSIVE UX/UI & SYSTEM CLOSURE" §03; PINK V-08): a file's kind by its extension, else its MIME type. Markdown
 * and plain text are read as text and staged as `text` (the existing text path, as ENTER TEXT); a PDF stays `pdf`; anything else is
 * refused, never staged (on 421e382 every file was read as a data URL and staged as `pdf`, so a .md failed in the PDF parser).
 */
export function sourceFileKind(name: string, mime: string): "text" | "pdf" | null {
  const extension = /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase() ?? null;
  if (extension === "md" || extension === "markdown" || extension === "txt") return "text";
  if (extension === "pdf") return "pdf";
  if (extension !== null) return null;
  if (mime === "text/markdown" || mime === "text/x-markdown" || mime === "text/plain") return "text";
  if (mime === "application/pdf") return "pdf";
  return null;
}

/**
 * AUTO_CAPABILITY (owner 2026-10-30): whether a GitHub URL names an account (`https://github.com/<account>`, one path segment) rather
 * than a repository. Only the staged item's default title follows it; whether the URL is accepted is the server loader's decision.
 */
export function githubAccountUrl(value: string): boolean {
  let url: URL;
  try { url = new URL(value.trim()); } catch { return false; }
  return (url.hostname === "github.com" || url.hostname === "www.github.com") && url.pathname.split("/").filter(Boolean).length === 1;
}

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v3.0 Phase 3c)
 * SourceDock: Functional left-side ingestion dock focused on feeding the core with PDF, URL, and Text sources.
 */
export const SourceDock = forwardRef<SourceDockHandle, SourceDockProps>(function SourceDock({
  onAnalyze,
  isAnalyzing = false,
  initialStagedDocs = [],
  locale = SIL_COPY.defaultLocale,
  analyzeBlockedMessage = null,
  investigation = null
}: SourceDockProps, forwardedRef) {
  const t = SIL_COPY[locale].sourceDock;
  const [stagedDocs, setStagedDocs] = useState<StagedDocumentItem[]>(initialStagedDocs);
  const [activeInputMode, setActiveInputMode] = useState<"none" | "github" | "website" | "text">("none");
  const [inputUrl, setInputUrl] = useState("");
  const [inputTitle, setInputTitle] = useState("");
  const [inputText, setInputText] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  /** F-G1-MD: the last file refused (its name and why), shown until the next file is chosen. */
  const [refusedFile, setRefusedFile] = useState<{ name: string; reason: "TYPE" | "EMPTY" } | null>(null);

  /** The one file intake, whatever triggered it (the file button's change event, or a drop on the identity core). */
  const stageFile = (file: File) => {
    const kind = sourceFileKind(file.name, file.type);
    setRefusedFile(kind === null ? { name: file.name, reason: "TYPE" } : null);
    if (kind === null) return;

    const reader = new FileReader();
    if (kind === "text") {
      reader.onload = (event) => {
        const text = String(event.target?.result ?? "");
        if (text.trim().length === 0) { setRefusedFile({ name: file.name, reason: "EMPTY" }); return; }
        setStagedDocs((prev) => [...prev, { id: `doc_text_${Date.now()}`, type: "text", title: file.name, content: text }]);
      };
      reader.readAsText(file);
      return;
    }
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const base64Content = result.includes(",") ? result.split(",")[1] : result;

      const newDoc: StagedDocumentItem = {
        id: `doc_pdf_${Date.now()}`,
        type: "pdf",
        title: file.name,
        content: base64Content
      };
      setStagedDocs((prev) => [...prev, newDoc]);
    };
    reader.readAsDataURL(file);
  };
  useImperativeHandle(forwardedRef, () => ({ stageFile }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stageFile(file);
    e.target.value = "";
  };

  const handleAddUrlSource = (type: "github" | "website") => {
    if (!inputUrl.trim()) return;

    const newDoc: StagedDocumentItem = {
      id: `doc_${type}_${Date.now()}`,
      type,
      title: inputTitle.trim() || (type === "github" ? (githubAccountUrl(inputUrl) ? t.githubAccountTitle : "GitHub Repository") : "Website Source"),
      url: inputUrl.trim()
    };

    setStagedDocs((prev) => [...prev, newDoc]);
    setInputUrl("");
    setInputTitle("");
    setActiveInputMode("none");
  };

  const handleAddTextSource = () => {
    if (!inputText.trim()) return;

    const newDoc: StagedDocumentItem = {
      id: `doc_text_${Date.now()}`,
      type: "text",
      title: inputTitle.trim() || t.manualTextTitle,
      content: inputText.trim()
    };

    setStagedDocs((prev) => [...prev, newDoc]);
    setInputText("");
    setInputTitle("");
    setActiveInputMode("none");
  };

  const handleRemoveDoc = (id: string) => {
    setStagedDocs((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div
      data-testid="source-dock"
      style={{
        position: "relative",
        width: "340px",
        backgroundColor: "rgba(6, 10, 15, 0.92)",
        border: `1px solid rgba(56, 229, 255, 0.2)`,
        borderLeft: `4px solid ${SIL_TOKENS.colors.cyanActive}`,
        borderRadius: "12px",
        padding: "24px",
        fontFamily: SIL_TOKENS.typography.mono,
        color: SIL_TOKENS.colors.textPrimary,
        display: "flex",
        flexDirection: "column",
        gap: "17px",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(56, 229, 255, 0.1)",
        backdropFilter: "blur(16px)"
      }}
    >
      {/* Decorative semiotic corner bracket */}
      <div style={{ position: "absolute", top: -1, right: -1, width: "15px", height: "15px", borderTop: `2px solid ${SIL_TOKENS.colors.cyanActive}`, borderRight: `2px solid ${SIL_TOKENS.colors.cyanActive}` }} />
      <div style={{ position: "absolute", bottom: -1, right: -1, width: "15px", height: "15px", borderBottom: `2px solid ${SIL_TOKENS.colors.cyanActive}`, borderRight: `2px solid ${SIL_TOKENS.colors.cyanActive}` }} />

      <div>
        <h3
          style={{
            margin: 0,
            fontSize: "14px",
            color: SIL_TOKENS.colors.cyanActive,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <span style={{ fontSize: "16px" }}>◰</span> {t.title}
        </h3>
        <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: SIL_TOKENS.colors.textMuted, lineHeight: 1.4 }}>
          {t.description}
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".pdf,.txt,.md"
        style={{ display: "none" }}
        data-testid="source-dock-file-input"
      />

      {/* Upload Zone / Action Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px",
            border: `1px dashed ${SIL_TOKENS.colors.cyanActive}`,
            borderRadius: "8px",
            backgroundColor: "rgba(56, 229, 255, 0.05)",
            color: SIL_TOKENS.colors.cyanActive,
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "0.5px",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(56, 229, 255, 0.15)"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(56, 229, 255, 0.05)"}
          data-testid="add-pdf-source-btn"
        >
          + {t.uploadPdf}
        </button>
        {refusedFile !== null && <p data-testid="source-dock-file-refused" data-reason={refusedFile.reason} role="alert" style={{ margin: 0, fontSize: "11.5px", lineHeight: 1.45, color: "#ffc46b" }}>{t.fileRefused[refusedFile.reason](refusedFile.name)}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <button
            onClick={() => setActiveInputMode(activeInputMode === "github" ? "none" : "github")}
            style={{
              padding: "9px 10px",
              backgroundColor: activeInputMode === "github" ? "rgba(56, 229, 255, 0.15)" : "rgba(3, 5, 8, 0.6)",
              border: `1px solid ${activeInputMode === "github" ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.fieldBorder}`,
              borderRadius: "6px",
              color: SIL_TOKENS.colors.textPrimary,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            data-testid="add-github-source-btn"
          >
            + {t.githubUrl}
          </button>
          <button
            onClick={() => setActiveInputMode(activeInputMode === "website" ? "none" : "website")}
            style={{
              padding: "9px 10px",
              backgroundColor: activeInputMode === "website" ? "rgba(56, 229, 255, 0.15)" : "rgba(3, 5, 8, 0.6)",
              border: `1px solid ${activeInputMode === "website" ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.fieldBorder}`,
              borderRadius: "6px",
              color: SIL_TOKENS.colors.textPrimary,
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            data-testid="add-website-source-btn"
          >
            + {t.websiteUrl}
          </button>
        </div>

        <button
          onClick={() => setActiveInputMode(activeInputMode === "text" ? "none" : "text")}
          style={{
            padding: "9px 10px",
            backgroundColor: activeInputMode === "text" ? "rgba(56, 229, 255, 0.15)" : "rgba(3, 5, 8, 0.6)",
            border: `1px solid ${activeInputMode === "text" ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.fieldBorder}`,
            borderRadius: "6px",
            color: SIL_TOKENS.colors.textPrimary,
            fontSize: "12px",
            fontWeight: 600,
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          data-testid="add-text-source-btn"
        >
          + {t.enterText}
        </button>
      </div>

      {/* Input Modal Box for URL or Text */}
      {activeInputMode !== "none" && (
        <div
          style={{
            backgroundColor: "rgba(3, 8, 16, 0.95)",
            border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
            borderRadius: "8px",
            padding: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}
        >
          <div style={{ fontSize: "11.5px", color: SIL_TOKENS.colors.cyanActive, fontWeight: 700 }}>
            {activeInputMode === "github"
              ? t.repositoryUrl
              : activeInputMode === "website"
              ? t.websitePortfolioUrl
              : t.textMarkdownInput}
          </div>

          <input
            type="text"
            placeholder={t.optionalTitle}
            value={inputTitle}
            onChange={(e) => setInputTitle(e.target.value)}
            style={{
              backgroundColor: "rgba(10, 14, 20, 0.9)",
              border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
              borderRadius: "4px",
              padding: "6px 8px",
              color: "#fff",
              fontSize: "12px",
              fontFamily: "inherit"
            }}
          />

          {(activeInputMode === "github" || activeInputMode === "website") ? (
            <input
              type="url"
              placeholder={activeInputMode === "github" ? t.githubPlaceholder : "https://example.com"}
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={{
                backgroundColor: "rgba(10, 14, 20, 0.9)",
                border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
                borderRadius: "4px",
                padding: "6px 8px",
                color: "#fff",
                fontSize: "12px",
                fontFamily: "inherit"
              }}
              data-testid="source-url-input"
            />
          ) : null}
          {activeInputMode === "github" && <span data-testid="source-github-hint" style={{ fontSize: "10.5px", lineHeight: 1.45, color: "rgba(176, 200, 216, 0.82)" }}>{t.githubHint}</span>}
          {activeInputMode === "text" && (
            <textarea
              rows={4}
              placeholder={t.textPlaceholder}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                backgroundColor: "rgba(10, 14, 20, 0.9)",
                border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
                borderRadius: "4px",
                padding: "6px 8px",
                color: "#fff",
                fontSize: "12px",
                fontFamily: "inherit",
                resize: "vertical"
              }}
              data-testid="source-text-input"
            />
          )}

          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", marginTop: "2px" }}>
            <button
              onClick={() => setActiveInputMode("none")}
              style={{
                padding: "4px 8px",
                backgroundColor: "transparent",
                border: "1px solid #555",
                borderRadius: "4px",
                color: "#aaa",
                fontSize: "11.5px",
                cursor: "pointer"
              }}
            >
              {t.cancel}
            </button>
            <button
              onClick={() =>
                activeInputMode === "text"
                  ? handleAddTextSource()
                  : handleAddUrlSource(activeInputMode)
              }
              style={{
                padding: "4px 10px",
                backgroundColor: SIL_TOKENS.colors.cyanActive,
                border: "none",
                borderRadius: "4px",
                color: "#0a0e14",
                fontWeight: 700,
                fontSize: "11.5px",
                cursor: "pointer"
              }}
              data-testid="submit-source-btn"
            >
              {t.add}
            </button>
          </div>
        </div>
      )}

      {/* Staged Documents List */}
      <div>
        <div
          style={{
            fontSize: "11.5px",
            color: SIL_TOKENS.colors.textMuted,
            textTransform: "uppercase",
            marginBottom: "6px",
            letterSpacing: "0.5px"
          }}
        >
          {t.stagedSources} ({stagedDocs.length})
        </div>
        {stagedDocs.length === 0 ? (
          <div style={{ fontSize: "12px", color: SIL_TOKENS.colors.textMuted, fontStyle: "italic" }}>
            {t.noSources}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto" }}>
            {stagedDocs.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  backgroundColor: "rgba(3, 5, 8, 0.8)",
                  border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
                  borderRadius: "6px",
                  fontSize: "12px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                  <span style={{ color: SIL_TOKENS.colors.cyanActive, fontWeight: 700 }}>
                    {doc.type === "pdf" ? "PDF" : doc.type === "github" ? "GIT" : doc.type === "website" ? "WEB" : "TXT"}
                  </span>
                  <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {doc.title}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveDoc(doc.id)}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#ff5555",
                    cursor: "pointer",
                    fontSize: "13px",
                    padding: "0 4px"
                  }}
                  title={t.removeSource}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {/* N-5 B-SRC: staged sources are not persisted (no file is stored, also not in the browser); the dock says so, fixed. */}
        {stagedDocs.length > 0 && (
          <p data-testid="staged-sources-not-kept" role="note" style={{ margin: "8px 0 0", fontSize: "11.5px", lineHeight: 1.45, color: "rgba(196, 236, 248, 0.78)" }}>
            {NAVIGATION_COPY[locale].stagedNotKept}
          </p>
        )}
      </div>

      {/* The investigation boundary this ANALYZE would be declared with. */}
      {stagedDocs.length > 0 && investigation !== null && (
        <p data-testid="analyze-investigation" data-investigation-mode={investigation.mode} title={investigation.hint} style={{ margin: "0 0 -6px", fontSize: "11px", fontWeight: 700, letterSpacing: "1.3px", lineHeight: 1.45, color: "rgba(196, 236, 248, 0.86)" }}>
          {investigation.label}
        </p>
      )}
      {/* Trigger Analysis Button (blocked without a valid job scope: the owner's sentence stands at the trigger) */}
      {stagedDocs.length > 0 && analyzeBlockedMessage !== null && !isAnalyzing && (
        <p data-testid="analyze-job-scope-required" role="status" style={{ margin: "0 0 -6px", fontSize: "12px", fontWeight: 700, letterSpacing: "0.4px", lineHeight: 1.45, color: "#ffc46b", textShadow: "0 0 10px rgba(255, 176, 64, 0.35)" }}>
          {analyzeBlockedMessage}
        </p>
      )}
      {stagedDocs.length > 0 && (
        <button
          disabled={isAnalyzing || analyzeBlockedMessage !== null}
          aria-disabled={isAnalyzing || analyzeBlockedMessage !== null}
          data-job-scope-blocked={analyzeBlockedMessage !== null ? "true" : "false"}
          onClick={() => analyzeBlockedMessage === null && onAnalyze && onAnalyze(stagedDocs)}
          style={{
            padding: "12px 14px",
            backgroundColor: isAnalyzing ? "rgba(56, 229, 255, 0.3)" : analyzeBlockedMessage !== null ? "rgba(56, 229, 255, 0.14)" : SIL_TOKENS.colors.cyanActive,
            border: "none",
            borderRadius: "8px",
            color: analyzeBlockedMessage !== null && !isAnalyzing ? "rgba(190, 236, 248, 0.62)" : "#0a0e14",
            fontWeight: 800,
            fontSize: "14px",
            letterSpacing: "1px",
            cursor: isAnalyzing ? "wait" : analyzeBlockedMessage !== null ? "not-allowed" : "pointer",
            boxShadow: isAnalyzing || analyzeBlockedMessage !== null ? "none" : "0 0 20px rgba(56, 229, 255, 0.5)",
            transition: "all 0.2s ease"
          }}
          data-testid="start-intake-analysis-btn"
        >
          {isAnalyzing ? t.analysisRunning : `${t.startAnalysis} (POST)`}
        </button>
       )}
    </div>
  );
});