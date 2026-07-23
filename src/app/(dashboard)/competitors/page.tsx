"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Users, Plus, Trash2, Search, Sparkles, ExternalLink,
  TrendingUp, Clock, Target, AlertTriangle, ChevronLeft,
  X, BarChart3, MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Competitor = {
  id: string;
  name: string;
  platform: string;
  profileUrl: string | null;
  bio: string | null;
  followers: number | null;
  postFrequency: string | null;
  avgEngagement: string | null;
  topContent: string[] | null;
  notes: string | null;
  lastAnalyzed: string | null;
  createdAt: string;
  updatedAt: string;
};

type Analysis = {
  bioAnalysis?: string;
  postFrequency?: string;
  contentThemes?: string[];
  engagementPatterns?: string;
  strengths?: string[];
  weaknesses?: string[];
  topContent?: string[];
  avgEngagement?: string;
};

const PLATFORMS = ["All", "LinkedIn", "Instagram", "Twitter", "TikTok", "Facebook", "YouTube"];

const PLATFORM_COLORS: Record<string, string> = {
  LinkedIn: "bg-blue-500/10 text-blue-400",
  Instagram: "bg-pink-500/10 text-pink-400",
  Twitter: "bg-sky-500/10 text-sky-400",
  TikTok: "bg-red-500/10 text-red-400",
  Facebook: "bg-blue-600/10 text-blue-400",
  YouTube: "bg-red-600/10 text-red-400",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Competitor | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [newName, setNewName] = useState("");
  const [newPlatform, setNewPlatform] = useState("LinkedIn");
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");

  const fetchCompetitors = useCallback(async () => {
    try {
      const res = await fetch("/api/competitors");
      const data = (await res.json()) as { competitors?: Competitor[] };
      setCompetitors(data.competitors ?? []);
    } catch { /* noop */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCompetitors(); }, [fetchCompetitors]);

  const addCompetitor = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/competitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          platform: newPlatform,
          profileUrl: newUrl.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { competitor?: Competitor };
      if (data.competitor) {
        setCompetitors((prev) => [data.competitor!, ...prev]);
        setShowModal(false);
        setNewName("");
        setNewPlatform("LinkedIn");
        setNewUrl("");
      }
    } catch { /* noop */ }
    setSaving(false);
  };

  const deleteCompetitor = async (id: string) => {
    try {
      await fetch(`/api/competitors/${id}`, { method: "DELETE" });
      setCompetitors((prev) => prev.filter((c) => c.id !== id));
      if (selected?.id === id) {
        setSelected(null);
        setAnalysis(null);
      }
    } catch { /* noop */ }
  };

  const analyzeCompetitor = async (id: string) => {
    setAnalyzing(id);
    setAnalysis(null);
    try {
      const res = await fetch("/api/competitors/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitorId: id }),
      });
      const data = (await res.json()) as { analysis?: Analysis; error?: string };
      if (data.analysis) {
        setAnalysis(data.analysis);
        setCompetitors((prev) =>
          prev.map((c) =>
            c.id === id ? { ...c, lastAnalyzed: new Date().toISOString() } : c
          )
        );
        if (selected?.id === id) {
          setSelected((prev) =>
            prev ? { ...prev, lastAnalyzed: new Date().toISOString() } : prev
          );
        }
      }
    } catch { /* noop */ }
    setAnalyzing(null);
  };

  const saveNotes = async () => {
    if (!selected) return;
    try {
      await fetch(`/api/competitors/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notesValue }),
      });
      setCompetitors((prev) =>
        prev.map((c) =>
          c.id === selected.id ? { ...c, notes: notesValue } : c
        )
      );
      setSelected((prev) => (prev ? { ...prev, notes: notesValue } : prev));
      setEditingNotes(false);
    } catch { /* noop */ }
  };

  const filtered = competitors.filter((c) => {
    const matchPlatform = filter === "All" || c.platform === filter;
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.platform.toLowerCase().includes(search.toLowerCase());
    return matchPlatform && matchSearch;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Concurrents</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Analysez et suivez vos concurrents sur les réseaux sociaux.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl shadow-lg shadow-primary/20 font-medium text-sm flex items-center gap-2 transition-all active:scale-[0.98]"
        >
          <Plus size={16} /> Ajouter un concurrent
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => setFilter(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === p
                  ? "bg-primary/15 text-primary"
                  : "bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Back button */}
            <button
              onClick={() => { setSelected(null); setAnalysis(null); setEditingNotes(false); }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
            >
              <ChevronLeft size={16} /> Retour aux concurrents
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main detail */}
              <div className="lg:col-span-2 space-y-6">
                {/* Profile Card */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center text-xl font-bold text-primary">
                        {selected.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{selected.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${PLATFORM_COLORS[selected.platform] || "bg-white/5 text-muted-foreground"}`}>
                            {selected.platform}
                          </span>
                          {selected.followers && (
                            <span className="text-xs text-muted-foreground">
                              {selected.followers.toLocaleString()} abonnés
                            </span>
                          )}
                          {selected.profileUrl && (
                            <a
                              href={selected.profileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => analyzeCompetitor(selected.id)}
                        disabled={analyzing === selected.id}
                        className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        {analyzing === selected.id ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full"
                          />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        {analyzing === selected.id ? "Analyse..." : "Analyser"}
                      </button>
                      <button
                        onClick={() => deleteCompetitor(selected.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {selected.lastAnalyzed && (
                    <p className="text-xs text-muted-foreground">
                      Dernière analyse : {formatDate(selected.lastAnalyzed)}
                    </p>
                  )}
                </div>

                {/* Analysis Results */}
                {(analysis || selected.bio) && (
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 size={18} className="text-primary" />
                      <h3 className="font-bold">Analyse IA</h3>
                    </div>

                    {analyzing === selected.id && (
                      <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full"
                        />
                        <span className="text-sm text-primary">Analyse en cours...</span>
                      </div>
                    )}

                    {analysis && (
                      <div className="space-y-5">
                        {analysis.bioAnalysis && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare size={14} className="text-muted-foreground" />
                              <h4 className="text-sm font-semibold">Positionnement</h4>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.bioAnalysis}</p>
                          </div>
                        )}

                        {analysis.postFrequency && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock size={14} className="text-muted-foreground" />
                              <h4 className="text-sm font-semibold">Fréquence de publication</h4>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.postFrequency}</p>
                          </div>
                        )}

                        {analysis.contentThemes && analysis.contentThemes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Thèmes de contenu</h4>
                            <div className="flex flex-wrap gap-2">
                              {analysis.contentThemes.map((t, i) => (
                                <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysis.engagementPatterns && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp size={14} className="text-muted-foreground" />
                              <h4 className="text-sm font-semibold">Patterns d&apos;engagement</h4>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{analysis.engagementPatterns}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {analysis.strengths && analysis.strengths.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2 text-green-400">Points forts</h4>
                              <ul className="space-y-1.5">
                                {analysis.strengths.map((s, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <span className="text-green-400 mt-0.5">+</span> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2 text-orange-400">Points faibles</h4>
                              <ul className="space-y-1.5">
                                {analysis.weaknesses.map((w, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <span className="text-orange-400 mt-0.5">!</span> {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {analysis.topContent && analysis.topContent.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Contenus performants</h4>
                            <div className="flex flex-wrap gap-2">
                              {analysis.topContent.map((t, i) => (
                                <span key={i} className="px-3 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs text-muted-foreground">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="glass-card rounded-2xl p-6">
                  <h3 className="text-sm font-bold mb-4">Statistiques</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Abonnés</span>
                      <span className="text-sm font-medium">{selected.followers?.toLocaleString() || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Fréquence</span>
                      <span className="text-sm font-medium">{selected.postFrequency || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Engagement</span>
                      <span className="text-sm font-medium">{selected.avgEngagement || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Plateforme</span>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${PLATFORM_COLORS[selected.platform] || "bg-white/5 text-muted-foreground"}`}>
                        {selected.platform}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Top Content */}
                {selected.topContent && Array.isArray(selected.topContent) && (selected.topContent as string[]).length > 0 && (
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Target size={14} className="text-primary" />
                      <h3 className="text-sm font-bold">Types de contenu</h3>
                    </div>
                    <div className="space-y-2">
                      {(selected.topContent as string[]).map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold">Notes</h3>
                    {!editingNotes && (
                      <button
                        onClick={() => { setEditingNotes(true); setNotesValue(selected.notes || ""); }}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        Modifier
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        placeholder="Ajoutez vos observations..."
                        className="w-full h-28 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none placeholder:text-muted-foreground/40 transition-all"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveNotes}
                          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium"
                        >
                          Sauvegarder
                        </button>
                        <button
                          onClick={() => setEditingNotes(false)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-muted-foreground"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selected.notes || "Aucune note. Cliquez sur Modifier pour ajouter des observations."}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {filtered.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Users size={36} className="text-primary/40" />
                </div>
                <h3 className="text-lg font-bold mb-1">Aucun concurrent</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                  {competitors.length === 0
                    ? "Ajoutez vos concurrents pour les analyser et suivre leur stratégie."
                    : "Aucun concurrent ne correspond à votre recherche."}
                </p>
                {competitors.length === 0 && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl text-sm font-medium inline-flex items-center gap-2"
                  >
                    <Plus size={16} /> Ajouter un concurrent
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((c) => (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-card rounded-2xl p-5 cursor-pointer hover:bg-white/[0.04] transition-all group relative"
                    onClick={() => {
                      setSelected(c);
                      setNotesValue(c.notes || "");
                    }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteCompetitor(c.id); }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm truncate">{c.name}</h3>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-medium mt-0.5 ${PLATFORM_COLORS[c.platform] || "bg-white/5 text-muted-foreground"}`}>
                          {c.platform}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-muted-foreground">
                      {c.followers && (
                        <div className="flex items-center gap-1.5">
                          <Users size={11} /> {c.followers.toLocaleString()} abonnés
                        </div>
                      )}
                      {c.postFrequency && (
                        <div className="flex items-center gap-1.5">
                          <Clock size={11} /> {c.postFrequency}
                        </div>
                      )}
                      {c.lastAnalyzed && (
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={11} /> Analysé {formatDate(c.lastAnalyzed)}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); analyzeCompetitor(c.id); }}
                      disabled={analyzing === c.id}
                      className="mt-4 w-full py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {analyzing === c.id ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full"
                          />
                          Analyse...
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} /> Analyser
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md glass-card rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Ajouter un concurrent</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Nom *
                  </label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Competitor Inc."
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    Plateforme *
                  </label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  >
                    {PLATFORMS.filter((p) => p !== "All").map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    URL du profil
                  </label>
                  <input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                    className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-sm font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={addCompetitor}
                    disabled={!newName.trim() || saving}
                    className="flex-1 py-2.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <Plus size={14} />
                    )}
                    Ajouter
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
