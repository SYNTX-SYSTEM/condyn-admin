'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import "../../career-test/career-demo.css";

interface AnalysisIndexEntry {
  analysisId: string;
  createdAt: string;
  validationState: "VERIFIED" | "REJECTED";
  overallConfidence: number;
}

/**
 * Historical Analyses Dashboard (/career/analyses).
 * Displays lightweight index entries loaded from PostgreSQL via /api/career/analyses.
 * Strictly adheres to "Dumb Consumer" boundary (no DB or Drizzle imports).
 */
export default function CareerAnalysesListPage() {
  const [analyses, setAnalyses] = useState<AnalysisIndexEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalyses() {
      try {
        setLoading(true);
        const res = await fetch("/api/career/analyses");
        const data = await res.json();
        if (data.success) {
          setAnalyses(data.analyses || []);
        } else {
          setError(data.issues?.[0]?.message || "Failed to load analyses.");
        }
      } catch (err: any) {
        setError(err.message || "Network error loading analyses.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalyses();
  }, []);

  return (
    <div className="demo-page-container">
      <header className="demo-header">
        <div className="demo-title">
          <h1>🏛️ CONDYN Career Analysis — Historische Analysen (Tresor)</h1>
          <p>PostgreSQL & Drizzle Persistence Layer — Verifizierte Analyse-DAGs</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Link
            href="/career/analyze"
            style={{
              background: "#238636",
              color: "#ffffff",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "13px"
            }}
          >
            ➕ Neue Analyse erstellen
          </Link>
          <div className="demo-badge">🔒 Postgres DB</div>
        </div>
      </header>

      <main style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto", width: "100%", flex: 1 }}>
        <h2 style={{ fontSize: "18px", color: "#ffffff", marginBottom: "20px" }}>Gespeicherte Analysen</h2>

        {loading && (
          <div style={{ padding: "40px", textAlign: "center", color: "#8b949e" }}>
            ⏳ Lade historische Analysen aus PostgreSQL...
          </div>
        )}

        {error && (
          <div
            style={{
              background: "rgba(248, 81, 73, 0.15)",
              border: "1px solid rgba(248, 81, 73, 0.4)",
              color: "#f85149",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "20px"
            }}
          >
            ⚠️ <strong>Fehler:</strong> {error}
          </div>
        )}

        {!loading && !error && analyses.length === 0 && (
          <div
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              borderRadius: "8px",
              padding: "40px",
              textAlign: "center",
              color: "#8b949e"
            }}
          >
            📭 Keine historischen Analysen im Tresor gefunden.
            <br />
            <Link
              href="/career/analyze"
              style={{ color: "#58a6ff", display: "inline-block", marginTop: "12px", textDecoration: "underline" }}
            >
              Starte deine erste Analyse &rarr;
            </Link>
          </div>
        )}

        {!loading && !error && analyses.length > 0 && (
          <div style={{ background: "#161b22", border: "1px solid #30363d", borderRadius: "8px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "#21262d", borderBottom: "1px solid #30363d", color: "#8b949e" }}>
                  <th style={{ padding: "12px 16px" }}>Analyse ID</th>
                  <th style={{ padding: "12px 16px" }}>Erstellt am</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Konfidenz</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((item) => (
                  <tr
                    key={item.analysisId}
                    style={{ borderBottom: "1px solid #30363d", transition: "background 0.2s" }}
                  >
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "#58a6ff" }}>
                      {item.analysisId}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#c9d1d9" }}>
                      {new Date(item.createdAt).toLocaleString("de-DE")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span
                        style={{
                          background: item.validationState === "VERIFIED" ? "rgba(35, 134, 54, 0.2)" : "rgba(248, 81, 73, 0.2)",
                          color: item.validationState === "VERIFIED" ? "#3fb950" : "#f85149",
                          padding: "4px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600
                        }}
                      >
                        {item.validationState}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#c9d1d9" }}>
                      {(item.overallConfidence * 100).toFixed(0)}%
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <Link
                        href={`/career/analyses/${item.analysisId}`}
                        style={{
                          background: "#21262d",
                          border: "1px solid #30363d",
                          color: "#58a6ff",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          textDecoration: "none",
                          fontSize: "13px",
                          fontWeight: 500
                        }}
                      >
                        Graphen anzeigen &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
