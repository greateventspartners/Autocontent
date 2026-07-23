"use client";

import React, { useEffect, useState } from "react";
import {
  FileText, Plus, Download, Loader2, Clock, Calendar, BarChart3,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import ExportModal from "@/components/export/ExportModal";

type ReportRecord = {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  format: string;
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
};

const QUICK_EXPORTS = [
  { label: "Weekly PDF", reportType: "weekly" as const, format: "pdf" as const, icon: FileText },
  { label: "Monthly CSV", reportType: "monthly" as const, format: "csv" as const, icon: Download },
];

export default function ReportsPage() {
  const [showModal, setShowModal] = useState(false);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickExporting, setQuickExporting] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("autocontent-reports");
    if (stored) {
      try {
        setReports(JSON.parse(stored));
      } catch {}
    }
    setLoading(false);
  }, []);

  const saveReport = (type: string, format: string) => {
    const record: ReportRecord = {
      id: crypto.randomUUID(),
      title: `Rapport ${type} — ${new Date().toLocaleDateString("fr-FR")}`,
      type,
      format: format.toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    const updated = [record, ...reports];
    setReports(updated);
    localStorage.setItem("autocontent-reports", JSON.stringify(updated));
  };

  const handleQuickExport = async (reportType: "weekly" | "monthly", format: "pdf" | "csv") => {
    setQuickExporting(`${reportType}-${format}`);
    try {
      if (format === "pdf") {
        const res = await fetch("/api/export/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportType }),
        });
        if (!res.ok) throw new Error();
        const html = await res.text();
        const w = window.open("", "_blank");
        if (w) {
          w.document.write(html);
          w.document.close();
          setTimeout(() => w.print(), 500);
        }
      } else {
        const res = await fetch("/api/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "csv", scope: "analytics" }),
        });
        if (!res.ok) throw new Error();
        const text = await res.text();
        const blob = new Blob([text], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
      saveReport(reportType, format);
    } catch {}
    setQuickExporting(null);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rapports</h1>
          <p className="text-sm text-muted-foreground mt-1">Générez et exportez vos rapports de performance</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white text-sm font-medium shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <Plus size={16} />
          Générer un rapport
        </button>
      </motion.div>

      {/* Quick Exports */}
      <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Export rapide</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {QUICK_EXPORTS.map((qe) => {
            const Icon = qe.icon;
            const key = `${qe.reportType}-${qe.format}`;
            const isExporting = quickExporting === key;
            return (
              <button
                key={key}
                onClick={() => handleQuickExport(qe.reportType, qe.format)}
                disabled={isExporting}
                className="flex items-center gap-3 p-4 rounded-xl bg-background/30 border border-white/[0.04] hover:bg-background/50 hover:border-white/[0.08] transition-all text-left group"
              >
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  {isExporting ? (
                    <Loader2 size={18} className="text-primary animate-spin" />
                  ) : (
                    <Icon size={18} className="text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{qe.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {qe.format === "pdf" ? "Ouvre la fenêtre d'impression" : "Télécharge un fichier CSV"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Report History */}
      <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Historique</h3>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8">
            <FileText size={32} className="mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Aucun rapport généré pour l&apos;instant</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Cliquez sur &quot;Générer un rapport&quot; pour commencer</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 rounded-xl bg-background/30 border border-white/[0.04] hover:bg-background/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10">
                    <BarChart3 size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{report.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {report.format} • {new Date(report.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/[0.06] text-muted-foreground uppercase">
                  {report.format}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal */}
      {showModal && (
        <ExportModal
          onClose={() => setShowModal(false)}
          onExported={() => {
            const type = "custom";
            saveReport(type, "pdf");
          }}
        />
      )}
    </motion.div>
  );
}
