"use client";

import React, { useState, useEffect } from "react";
import {
  X, FileText, FileSpreadsheet, FileJson, Download, Loader2,
  Calendar, ChevronDown, Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type BrandKit = {
  id: string;
  name: string;
  logoUrl?: string | null;
  colors?: Record<string, string> | null;
};

type ExportModalProps = {
  onClose: () => void;
  onExported?: () => void;
};

type ReportType = "weekly" | "monthly" | "campaign";
type ExportFormat = "pdf" | "csv" | "json";

const REPORT_LABELS: Record<ReportType, string> = {
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
  campaign: "Campagne",
};

const FORMAT_META: Record<ExportFormat, { label: string; icon: typeof FileText; mime: string }> = {
  pdf: { label: "PDF", icon: FileText, mime: "application/pdf" },
  csv: { label: "CSV", icon: FileSpreadsheet, mime: "text/csv" },
  json: { label: "JSON", icon: FileJson, mime: "application/json" },
};

export default function ExportModal({ onClose, onExported }: ExportModalProps) {
  const [reportType, setReportType] = useState<ReportType>("weekly");
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [brandKitId, setBrandKitId] = useState<string>("");
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "generating" | "done">("idle");

  useEffect(() => {
    fetch("/api/brand-kit")
      .then((r) => r.json() as Promise<{ brandKits?: BrandKit[] }>)
      .then((d) => setBrandKits(d.brandKits || []))
      .catch(() => {});
  }, []);

  const handleExport = async () => {
    setLoading(true);
    setStatus("generating");

    try {
      if (format === "pdf") {
        const res = await fetch("/api/export/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportType, brandKitId: brandKitId || undefined }),
        });
        if (!res.ok) throw new Error("Erreur export");
        const html = await res.text();
        const w = window.open("", "_blank");
        if (w) {
          w.document.write(html);
          w.document.close();
          setTimeout(() => w.print(), 500);
        }
      } else {
        const scope = reportType === "campaign" ? "campaigns" : "analytics";
        const res = await fetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: format,
            scope,
            dateRange: { from: dateFrom, to: dateTo },
            brandKitId: brandKitId || undefined,
          }),
        });
        if (!res.ok) throw new Error("Erreur export");
        if (format === "csv") {
          const text = await res.text();
          const blob = new Blob([text], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `export-${scope}-${new Date().toISOString().slice(0, 10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          const json = await res.json();
          const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `export-${scope}-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
      setStatus("done");
      onExported?.();
      setTimeout(() => onClose(), 1200);
    } catch {
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg glass-card rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Download size={18} className="text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Exporter un rapport</h2>
                <p className="text-xs text-muted-foreground">Configurez et téléchargez</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-muted-foreground">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Report Type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Type de rapport</label>
              <div className="grid grid-cols-3 gap-2">
                {(["weekly", "monthly", "campaign"] as ReportType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setReportType(t)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      reportType === t
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-background/50 border-border text-muted-foreground hover:text-foreground hover:border-white/10"
                    }`}
                  >
                    {REPORT_LABELS[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(["pdf", "csv", "json"] as ExportFormat[]).map((f) => {
                  const meta = FORMAT_META[f];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        format === f
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-background/50 border-border text-muted-foreground hover:text-foreground hover:border-white/10"
                      }`}
                    >
                      <Icon size={14} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Période</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <span className="text-muted-foreground text-xs">→</span>
                <div className="flex-1 relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>

            {/* Brand Kit */}
            {brandKits.length > 0 && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Kit de marque (optionnel)</label>
                <div className="relative">
                  <select
                    value={brandKitId}
                    onChange={(e) => setBrandKitId(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 pr-9 rounded-xl bg-background/50 border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Sans brand kit</option>
                    {brandKits.map((bk) => (
                      <option key={bk.id} value={bk.id}>{bk.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="p-4 rounded-xl bg-background/30 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-2">
                <Eye size={14} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Aperçu</span>
              </div>
              <p className="text-sm text-foreground">
                Rapport <strong>{REPORT_LABELS[reportType].toLowerCase()}</strong> en{" "}
                <strong>{FORMAT_META[format].label}</strong>
                {brandKitId && (
                  <span>
                    {" "}avec <strong>{brandKits.find((b) => b.id === brandKitId)?.name}</strong>
                  </span>
                )}
                {" "}pour la période <strong>{dateFrom}</strong> → <strong>{dateTo}</strong>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 p-5 border-t border-white/[0.06]">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm font-medium hover:bg-white/[0.08] transition-colors text-muted-foreground"
            >
              Annuler
            </button>
            <button
              onClick={handleExport}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-medium hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-60"
            >
              {status === "generating" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : status === "done" ? (
                <span>Terminé !</span>
              ) : (
                <>
                  <Download size={16} />
                  Exporter
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
