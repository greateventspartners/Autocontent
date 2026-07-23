"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, AlertCircle, Check, Loader2 } from "lucide-react";
import { PLATFORM_COLORS, PLATFORM_ICONS, PLATFORM_OPTIONS } from "./types";

interface BulkSchedulerProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

interface BulkLine {
  platform: string;
  body: string;
  scheduledAt: string;
  error?: string;
}

function parseLines(text: string): BulkLine[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      if (parts.length < 3) {
        return { platform: "", body: "", scheduledAt: "", error: "Format: plateforme | contenu | date heure" };
      }

      const platformLower = parts[0].toLowerCase();
      const validPlatforms = PLATFORM_OPTIONS.filter((o) => o.value).map((o) => o.value);
      if (!validPlatforms.includes(platformLower)) {
        return { platform: platformLower, body: parts[1], scheduledAt: parts[2], error: `Plateforme inconnue: ${parts[0]}` };
      }

      const body = parts.slice(1, -1).join(" | ").trim();
      const dateStr = parts[parts.length - 1].trim();

      const parsed = Date.parse(dateStr.replace(/\//g, "-"));
      if (isNaN(parsed)) {
        return { platform: platformLower, body, scheduledAt: dateStr, error: `Date invalide: ${dateStr}` };
      }

      const scheduledAt = new Date(parsed).toISOString();

      return { platform: platformLower, body, scheduledAt };
    });
}

export default function BulkScheduler({ open, onClose, onCreated }: BulkSchedulerProps) {
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<BulkLine[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);

  const handleParse = () => {
    const lines = parseLines(input);
    setParsed(lines);
    setShowPreview(true);
  };

  const handleConfirm = async () => {
    const valid = parsed.filter((l) => !l.error);
    if (valid.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: valid.map((l) => ({
            platform: l.platform,
            body: l.body,
            scheduledAt: l.scheduledAt,
          })),
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { count: number };
        setResult(data);
        onCreated();
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setInput("");
    setParsed([]);
    setShowPreview(false);
    setResult(null);
    onClose();
  };

  const validCount = parsed.filter((l) => !l.error).length;
  const errorCount = parsed.filter((l) => l.error).length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-2xl glass-card rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div>
                <h2 className="text-lg font-bold">Planification en masse</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Un post par ligne: <code className="text-[10px] bg-white/[0.06] px-1 py-0.5 rounded">plateforme | contenu | date heure</code>
                </p>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {result ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center py-8"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Check size={24} className="text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium">{result.count} post{result.count > 1 ? "s" : ""} créé{result.count > 1 ? "s" : ""}</p>
                </motion.div>
              ) : !showPreview ? (
                <div className="space-y-4">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`linkedin | Nouveau post sur l'innovation | 2026-07-25 09:00\ntwitter | Thread sur le design | 2026-07-26 14:30\ninstagram | Carrousel tips | 2026-07-27 10:00`}
                    className="w-full h-48 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/40"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleParse}
                      disabled={!input.trim()}
                      className="px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40"
                    >
                      Analyser
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Summary */}
                  <div className="flex items-center gap-3 text-xs">
                    {validCount > 0 && (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <Check size={12} /> {validCount} valide{validCount > 1 ? "s" : ""}
                      </span>
                    )}
                    {errorCount > 0 && (
                      <span className="flex items-center gap-1 text-destructive">
                        <AlertCircle size={12} /> {errorCount} erreur{errorCount > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Preview list */}
                  <div className="max-h-[320px] overflow-y-auto space-y-2">
                    {parsed.map((line, i) => {
                      const icon = PLATFORM_ICONS[line.platform] || "?";
                      const color = PLATFORM_COLORS[line.platform] || "bg-gray-500 text-white";
                      return (
                        <div
                          key={i}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                            line.error
                              ? "bg-destructive/5 border-destructive/20"
                              : "bg-white/[0.02] border-white/[0.06]"
                          }`}
                        >
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex-shrink-0 mt-0.5 ${color}`}>
                            {icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{line.body || "—"}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {line.scheduledAt || "—"}
                            </p>
                          </div>
                          {line.error && (
                            <p className="text-[10px] text-destructive flex-shrink-0">{line.error}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setShowPreview(false)}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm font-medium hover:bg-white/[0.08] transition-colors"
                    >
                      Modifier
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={handleConfirm}
                      disabled={validCount === 0 || submitting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-medium hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-40 flex items-center gap-2"
                    >
                      {submitting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Plus size={14} />
                      )}
                      Créer {validCount > 1 ? `${validCount} posts` : "le post"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
