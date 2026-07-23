"use client";

import React from "react";

export type ReportData = {
  title: string;
  dateRange: string;
  logoUrl?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  kpis: { label: string; value: string; color?: string }[];
  topPosts: {
    title: string;
    platform: string;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
  }[];
  insights: { title: string; description: string }[];
  footerText?: string;
};

export default function PrintableReport({ data }: { data: ReportData }) {
  const primary = data.primaryColor ?? "#6366f1";
  const secondary = data.secondaryColor ?? "#8b5cf6";

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: "#1e293b", lineHeight: 1.6, padding: 40, maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, paddingBottom: 16, borderBottom: `3px solid ${primary}` }}>
        {data.logoUrl ? (
          <img src={data.logoUrl} alt="Logo" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "contain" }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 12, background: primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: 18 }}>AC</div>
        )}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: primary, margin: 0 }}>{data.title}</h1>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{data.dateRange}</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, margin: "24px 0" }}>
        {data.kpis.slice(0, 4).map((kpi, i) => (
          <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color ?? primary }}>{kpi.value}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {data.kpis.length > 4 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, margin: "0 0 24px" }}>
          {data.kpis.slice(4, 8).map((kpi, i) => (
            <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: kpi.color ?? secondary }}>{kpi.value}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{kpi.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Top Posts */}
      {data.topPosts.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "24px 0 12px", color: "#0f172a", borderLeft: `4px solid ${secondary}`, paddingLeft: 12 }}>Top Posts</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ background: "#f1f5f9", textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#334155", borderBottom: `2px solid ${primary}` }}>#</th>
                <th style={{ background: "#f1f5f9", textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#334155", borderBottom: `2px solid ${primary}` }}>Titre</th>
                <th style={{ background: "#f1f5f9", textAlign: "left", padding: "10px 12px", fontWeight: 600, color: "#334155", borderBottom: `2px solid ${primary}` }}>Plateforme</th>
                <th style={{ background: "#f1f5f9", textAlign: "right", padding: "10px 12px", fontWeight: 600, color: "#334155", borderBottom: `2px solid ${primary}` }}>Portée</th>
                <th style={{ background: "#f1f5f9", textAlign: "right", padding: "10px 12px", fontWeight: 600, color: "#334155", borderBottom: `2px solid ${primary}` }}>Likes</th>
                <th style={{ background: "#f1f5f9", textAlign: "right", padding: "10px 12px", fontWeight: 600, color: "#334155", borderBottom: `2px solid ${primary}` }}>Comment.</th>
                <th style={{ background: "#f1f5f9", textAlign: "right", padding: "10px 12px", fontWeight: 600, color: "#334155", borderBottom: `2px solid ${primary}` }}>Partages</th>
              </tr>
            </thead>
            <tbody>
              {data.topPosts.map((post, i) => (
                <tr key={i}>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>{i + 1}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0" }}>{post.platform}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0", textAlign: "right", fontWeight: 500 }}>{post.reach.toLocaleString("fr-FR")}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0", textAlign: "right", color: "#ec4899" }}>{post.likes.toLocaleString("fr-FR")}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0", textAlign: "right", color: "#f59e0b" }}>{post.comments.toLocaleString("fr-FR")}</td>
                  <td style={{ padding: "8px 12px", borderBottom: "1px solid #e2e8f0", textAlign: "right", color: "#06b6d4" }}>{post.shares.toLocaleString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Insights */}
      {data.insights.length > 0 && (
        <>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: "24px 0 12px", color: "#0f172a", borderLeft: `4px solid ${secondary}`, paddingLeft: 12 }}>Insights</h2>
          <ul style={{ paddingLeft: 20 }}>
            {data.insights.map((ins, i) => (
              <li key={i} style={{ marginBottom: 8, fontSize: 14, color: "#334155" }}>
                <strong>{ins.title}</strong> — {ins.description}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: 40, paddingTop: 16, borderTop: "2px solid #e2e8f0", textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
        <strong style={{ color: primary }}>{data.footerText ?? "Autocontent"}</strong> — Rapport généré le {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </div>
    </div>
  );
}
