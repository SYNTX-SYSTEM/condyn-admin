"use client";

import React, { useState, useRef } from "react";
import { SIL_TOKENS } from "./SILTokens";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";

export interface StagedDocumentItem {
  id: string;
  type: "pdf" | "github" | "website" | "text";
  title: string;
  content?: string;
  url?: string;
}

export interface SourceDockProps {
  onAddSource?: (type: string) => void;
  onAnalyze?: (documents: StagedDocumentItem[]) => void;
  isAnalyzing?: boolean;
  initialStagedDocs?: StagedDocumentItem[];
  locale?: SilLocale;
}

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v3.0 Phase 3c)
 * SourceDock: Functional left-side ingestion dock focused on feeding the core with PDF, URL, and Text sources.
 */
export function SourceDock({
  onAnalyze,
  isAnalyzing = false,
  initialStagedDocs = [],
  locale = SIL_COPY.defaultLocale
}: SourceDockProps) {
  const t = SIL_COPY[locale].sourceDock;
  const [stagedDocs, setStagedDocs] = useState<StagedDocumentItem[]>(initialStagedDocs);
  const [activeInputMode, setActiveInputMode] = useState<"none" | "github" | "website" | "text">("none");
  const [inputUrl, setInputUrl] = useState("");
  const [inputTitle, setInputTitle] = useState("");
  const [inputText, setInputText] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
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

    // reset input
    e.target.value = "";
  };

  const handleAddUrlSource = (type: "github" | "website") => {
    if (!inputUrl.trim()) return;

    const newDoc: StagedDocumentItem = {
      id: `doc_${type}_${Date.now()}`,
      type,
      title: inputTitle.trim() || (type === "github" ? "GitHub Repository" : "Website Source"),
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
        gap: "18px",
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
        <p style={{ margin: "6px 0 0 0", fontSize: "12px", color: SIL_TOKENS.colors.textMuted, lineHeight: 1.4 }}>
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
            padding: "12px",
            border: `1px dashed ${SIL_TOKENS.colors.cyanActive}`,
            borderRadius: "8px",
            backgroundColor: "rgba(56, 229, 255, 0.05)",
            color: SIL_TOKENS.colors.cyanActive,
            fontSize: "12px",
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <button
            onClick={() => setActiveInputMode(activeInputMode === "github" ? "none" : "github")}
            style={{
              padding: "10px",
              backgroundColor: activeInputMode === "github" ? "rgba(56, 229, 255, 0.15)" : "rgba(3, 5, 8, 0.6)",
              border: `1px solid ${activeInputMode === "github" ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.fieldBorder}`,
              borderRadius: "6px",
              color: SIL_TOKENS.colors.textPrimary,
              fontSize: "11px",
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
              padding: "10px",
              backgroundColor: activeInputMode === "website" ? "rgba(56, 229, 255, 0.15)" : "rgba(3, 5, 8, 0.6)",
              border: `1px solid ${activeInputMode === "website" ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.fieldBorder}`,
              borderRadius: "6px",
              color: SIL_TOKENS.colors.textPrimary,
              fontSize: "11px",
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
            padding: "10px",
            backgroundColor: activeInputMode === "text" ? "rgba(56, 229, 255, 0.15)" : "rgba(3, 5, 8, 0.6)",
            border: `1px solid ${activeInputMode === "text" ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.fieldBorder}`,
            borderRadius: "6px",
            color: SIL_TOKENS.colors.textPrimary,
            fontSize: "11px",
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
          <div style={{ fontSize: "10px", color: SIL_TOKENS.colors.cyanActive, fontWeight: 700 }}>
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
              fontSize: "11px",
              fontFamily: "inherit"
            }}
          />

          {(activeInputMode === "github" || activeInputMode === "website") ? (
            <input
              type="url"
              placeholder={activeInputMode === "github" ? "https://github.com/org/repo" : "https://example.com"}
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              style={{
                backgroundColor: "rgba(10, 14, 20, 0.9)",
                border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
                borderRadius: "4px",
                padding: "6px 8px",
                color: "#fff",
                fontSize: "11px",
                fontFamily: "inherit"
              }}
              data-testid="source-url-input"
            />
          ) : (
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
                fontSize: "11px",
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
                fontSize: "10px",
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
                fontSize: "10px",
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
            fontSize: "10px",
            color: SIL_TOKENS.colors.textMuted,
            textTransform: "uppercase",
            marginBottom: "6px",
            letterSpacing: "0.5px"
          }}
        >
          {t.stagedSources} ({stagedDocs.length})
        </div>
        {stagedDocs.length === 0 ? (
          <div style={{ fontSize: "11px", color: SIL_TOKENS.colors.textMuted, fontStyle: "italic" }}>
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
                  fontSize: "11px"
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
                    fontSize: "12px",
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
      </div>

      {/* Trigger Analysis Button */}
      {stagedDocs.length > 0 && (
        <button
          disabled={isAnalyzing}
          onClick={() => onAnalyze && onAnalyze(stagedDocs)}
          style={{
            padding: "14px",
            backgroundColor: isAnalyzing ? "rgba(56, 229, 255, 0.3)" : SIL_TOKENS.colors.cyanActive,
            border: "none",
            borderRadius: "8px",
            color: "#0a0e14",
            fontWeight: 800,
            fontSize: "13px",
            letterSpacing: "1px",
            cursor: isAnalyzing ? "wait" : "pointer",
            boxShadow: isAnalyzing ? "none" : "0 0 20px rgba(56, 229, 255, 0.5)",
            transition: "all 0.2s ease"
          }}
          data-testid="start-intake-analysis-btn"
        >
          {isAnalyzing ? t.analysisRunning : `${t.startAnalysis} (POST)`}
        </button>
      )}
    </div>
  );
}
