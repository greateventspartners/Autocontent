"use client";

import React, { useEffect, useState } from "react";
import {
  Clock, ChevronDown, ChevronUp, Copy, Check, RotateCcw,
  Share2, X, Loader2, Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type JobResult = {
  platform: string;
  title?: string;
  content: string;
  hashtags?: string[];
};

type RepurposeJob = {
  id: string;
  sourceTitle: string | null;
  sourceText: string;
  targetPlatforms: string;
  results: JobResult[] | null;
  status: string;
  tone: string | null;
  templateId: string | null;
  createdAt: string;
};

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  twitter: "X/Twitter",
  instagram: "Instagram",
  tiktok_script: "TikTok",
  blog: "Blog",
  newsletter: "Newsletter",
  youtube_short: "YouTube Short",
};

interface RepurposeHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onRerun?: (job: RepurposeJob) => void;
}

export default function RepurposeHistory({ isOpen, onClose, onRerun }: RepurposeHistoryProps) {
  const [jobs, setJobs] = useState<RepurposeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);
  const [copiedAllId, setCopiedAllId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/repurpose")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setJobs(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(key);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch { /* noop */ }
  };

  const handleCopyAll = async (job: RepurposeJob) => {
    if (!job.results) return;
    const all = job.results
      .map((r) => {
        const label = PLATFORM_LABELS[r.platform] ?? r.platform;
        return `--- ${label}${r.title ? ` — ${r.title}` : ""} ---\n${r.content}${r.hashtags?.length ? "\n" + r.hashtags.map((t) => `#${t}`).join(" ") : ""}`;
      })
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(all);
      setCopiedAllId(job.id);
      setTimeout(() => setCopiedAllId(null), 2000);
    } catch { /* noop */ }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Historique des repurposings</h2>
                <p className="text-xs text-muted-foreground">{jobs.length} job{jobs.length !== 1 ? "s" : ""} au total</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <Share2 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Aucun repurposing pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => {
                const isExpanded = expandedId === job.id;
                const platforms = job.targetPlatforms.split(",").map((p) => p.trim());
                const date = new Date(job.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                });
                return (
                  <div key={job.id} className="rounded-xl bg-background/50 border border-border overflow-hidden">
                    {/* Header row */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : job.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-block w-2 h-2 rounded-full ${
                            job.status === "completed" ? "bg-emerald-400" :
                            job.status === "failed" ? "bg-red-400" :
                            job.status === "processing" ? "bg-amber-400 animate-pulse" :
                            "bg-muted-foreground/50"
                          }`} />
                          <span className="text-sm font-medium text-foreground truncate">
                            {job.sourceTitle || job.sourceText.slice(0, 60) + (job.sourceText.length > 60 ? "..." : "")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">{date}</span>
                          <span className="text-muted-foreground">·</span>
                          {platforms.map((p) => (
                            <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {PLATFORM_LABELS[p] ?? p}
                            </span>
                          ))}
                          {job.tone && (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                {job.tone}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                      )}
                    </button>

                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                            {job.results && Array.isArray(job.results) && job.results.length > 0 ? (
                              <>
                                <div className="flex justify-end mb-2">
                                  <button
                                    onClick={() => handleCopyAll(job)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                  >
                                    {copiedAllId === job.id ? (
                                      <Check className="w-3.5 h-3.5" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                    Tout copier
                                  </button>
                                </div>
                                {job.results.map((r, idx) => {
                                  const copyKey = `${job.id}-${idx}`;
                                  return (
                                    <div key={idx} className="p-3 rounded-lg bg-background/80 border border-border">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-foreground">
                                          {PLATFORM_LABELS[r.platform] ?? r.platform}
                                          {r.title && <span className="text-muted-foreground"> — {r.title}</span>}
                                        </span>
                                        <button
                                          onClick={() => handleCopy(r.content, copyKey)}
                                          className="p-1 rounded hover:bg-accent transition-colors"
                                          title="Copier"
                                        >
                                          {copiedIdx === copyKey ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                          ) : (
                                            <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                          )}
                                        </button>
                                      </div>
                                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{r.content}</p>
                                      {r.hashtags && r.hashtags.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                          {r.hashtags.map((t, i) => (
                                            <span key={i} className="text-xs text-primary">#{t}</span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                {job.status === "processing" ? "En cours de traitement..." :
                                 job.status === "failed" ? "Échec de la transformation" :
                                 "Aucun résultat"}
                              </p>
                            )}

                            <div className="flex justify-end pt-2">
                              <button
                                onClick={() => onRerun?.(job)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Re-générer
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
