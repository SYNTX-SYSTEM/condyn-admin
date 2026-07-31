"use client";

import React, { useState, useRef } from "react";
import { SIL_TOKENS } from "./SILTokens";

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
}

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v3.0 Phase 3c)
 * SourceDock: Functional left-side ingestion dock focused on feeding the core with PDF, URL, and Text sources.
 */
export function SourceDock({ onAnalyze, isAnalyzing = false, initialStagedDocs = [] }: SourceDockProps) {
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
      title: inputTitle.trim() || "Manuelle Text-Eingabe",
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
        width: "250px",
        backgroundColor: "rgba(10, 14, 20, 0.88)",
        border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
        borderRadius: "12px",
        padding: "16px",
        fontFamily: SIL_TOKENS.typography.mono,
        color: SIL_TOKENS.colors.textPrimary,
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(12px)"
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: "12px",
            color: SIL_TOKENS.colors.cyanActive,
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}
        >
          1. WISSEN EINSPEISEN
        </h3>
        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: SIL_TOKENS.colors.textMuted, lineHeight: 1.3 }}>
          Fügen Sie Dokumente, Repositories oder URLs zur Analyse hinzu.
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
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer"
          }}
          data-testid="add-pdf-source-btn"
        >
          + PDF DOKUMENT HOCHLADEN
        </button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          <button
            onClick={() => setActiveInputMode(activeInputMode === "github" ? "none" : "github")}
            style={{
              padding: "7px 8px",
              backgroundColor: activeInputMode === "github" ? "rgba(56, 229, 255, 0.15)" : "rgba(3, 5, 8, 0.6)",
              border: `1px solid ${activeInputMode === "github" ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.fieldBorder}`,
              borderRadius: "6px",
              color: SIL_TOKENS.colors.textPrimary,
              fontSize: "10px",
              cursor: "pointer"
            }}
            data-testid="add-github-source-btn"
          >
            + GITHUB URL
          </button>
          <button
            onClick={() => setActiveInputMode(activeInputMode === "website" ? "none" : "website")}
            style={{
              padding: "7px 8px",
              backgroundColor: activeInputMode === "website" ? "rgba(56, 229, 255, 0.15)" : "rgba(3, 5, 8, 0.6)",
              border: `1px solid ${activeInputMode === "website" ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.fieldBorder}`,
              borderRadius: "6px",
              color: SIL_TOKENS.colors.textPrimary,
              fontSize: "10px",
              cursor: "pointer"
            }}
            data-testid="add-website-source-btn"
          >
            + WEBSITE URL
          </button>
        </div>

        <button
          onClick={() => setActiveInputMode(activeInputMode === "text" ? "none" : "text")}
          style={{
            padding: "7px 8px",
            backgroundColor: activeInputMode === "text" ? "rgba(56, 229, 255, 0.15)" : "rgba(3, 5, 8, 0.6)",
            border: `1px solid ${activeInputMode === "text" ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.fieldBorder}`,
            borderRadius: "6px",
            color: SIL_TOKENS.colors.textPrimary,
            fontSize: "10px",
            textAlign: "center",
            cursor: "pointer"
          }}
          data-testid="add-text-source-btn"
        >
          + TEXT / MARKDOWN EINGEBEN
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
              ? "GITHUB REPOSITORY URL"
              : activeInputMode === "website"
              ? "WEBSITE / PORTFOLIO URL"
              : "TEXT / MARKDOWN EINGABE"}
          </div>

          <input
            type="text"
            placeholder="Bezeichnung (optional)"
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
              placeholder="Fügen Sie hier Ihren Text oder Markdown ein..."
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
              ABBRECHEN
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
              HINZUFÜGEN
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
          BEREITGESTELLTE QUELLEN ({stagedDocs.length})
        </div>
        {stagedDocs.length === 0 ? (
          <div style={{ fontSize: "11px", color: SIL_TOKENS.colors.textMuted, fontStyle: "italic" }}>
            Keine Quellen ausgewählt.
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
                  title="Quelle entfernen"
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
            padding: "10px",
            backgroundColor: isAnalyzing ? "rgba(56, 229, 255, 0.3)" : SIL_TOKENS.colors.cyanActive,
            border: "none",
            borderRadius: "8px",
            color: "#0a0e14",
            fontWeight: 700,
            fontSize: "11px",
            cursor: isAnalyzing ? "wait" : "pointer",
            boxShadow: isAnalyzing ? "none" : "0 0 16px rgba(56, 229, 255, 0.4)",
            transition: "all 0.2s ease"
          }}
          data-testid="start-intake-analysis-btn"
        >
          {isAnalyzing ? "ANALYSE LÄUFT..." : "ANALYSE STARTEN (POST)"}
        </button>
      )}
    </div>
  );
}
