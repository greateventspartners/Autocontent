"use client";

import React, { useState } from "react";
import {
  Hash, Share2, Camera, MessageCircle, Music,
  Copy, Check, Sparkles, X, Loader2, Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type HashtagItem = {
  tag: string;
  popularity: "high" | "medium" | "low";
  relevance: "high" | "medium" | "low";
  category: "trending" | "niche" | "branded";
};

type Category = "all" | "trending" | "niche" | "branded";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Share2, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "instagram", label: "Instagram", icon: Camera, color: "text-pink-400", bg: "bg-pink-500/10" },
  { id: "twitter", label: "X (Twitter)", icon: MessageCircle, color: "text-sky-400", bg: "bg-sky-500/10" },
  { id: "tiktok", label: "TikTok", icon: Music, color: "text-white", bg: "bg-white/5" },
];

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "trending", label: "Tendance" },
  { id: "niche", label: "Niche" },
  { id: "branded", label: "Branded" },
];

const POPULARITY_STYLES: Record<string, { label: string; color: string }> = {
  high: { label: "Haute", color: "text-emerald-400 bg-emerald-500/10" },
  medium: { label: "Moyenne", color: "text-amber-400 bg-amber-500/10" },
  low: { label: "Basse", color: "text-muted-foreground bg-background/50" },
};

export default function HashtagGenerator() {
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [niche, setNiche] = useState("");
  const [hashtags, setHashtags] = useState<HashtagItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>("all");

  const filtered =
    activeCategory === "all"
      ? hashtags
      : hashtags.filter((h) => h.category === activeCategory);

  const toggleSelect = (tag: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setSelected(new Set());
    setHashtags([]);
    try {
      const res = await fetch("/api/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, platform, niche: niche || undefined }),
      });
      const data = (await res.json()) as { hashtags?: HashtagItem[] };
      if (data.hashtags) setHashtags(data.hashtags);
    } catch (err) {
      console.error("Hashtag generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyTag = async (tag: string) => {
    try {
      await navigator.clipboard.writeText(`#${tag}`);
      setCopiedTag(tag);
      setTimeout(() => setCopiedTag(null), 2000);
    } catch { /* noop */ }
  };

  const copySelected = async () => {
    const tags = hashtags
      .filter((h) => selected.has(h.tag))
      .map((h) => `#${h.tag}`)
      .join(" ");
    try {
      await navigator.clipboard.writeText(tags);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch { /* noop */ }
  };

  const platformInfo = PLATFORMS.find((p) => p.id === platform) ?? PLATFORMS[0];

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-primary/10">
          <Hash className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Hashtag Generator</h2>
          <p className="text-xs text-muted-foreground">
            Générez des hashtags pertinents pour chaque plateforme
          </p>
        </div>
      </div>

      {/* Topic input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Sujet / Mot-clé
        </label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Ex: marketing digital, IA, fitness..."
          className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
        />
      </div>

      {/* Platform selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          Plateforme
        </label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const active = platform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPlatform(p.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? `${p.bg} ${p.color} ring-2 ring-current/20`
                    : "bg-background/50 text-muted-foreground hover:bg-accent"
                }`}
              >
                <p.icon className="w-4 h-4" />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Niche input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          Niche <span className="text-muted-foreground">(optionnel)</span>
        </label>
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="Ex: SaaS B2B, yoga débutant, e-commerce mode..."
          className="w-full px-4 py-2.5 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Generate */}
      <button
        onClick={handleGenerate}
        disabled={loading || !topic.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Génération en cours...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Générer les hashtags
          </>
        )}
      </button>

      {/* Results */}
      {hashtags.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          {/* Category filter */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-muted-foreground" />
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    activeCategory === c.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {selected.size > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={copySelected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                {copiedAll ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                Copier ({selected.size})
              </motion.button>
            )}
          </div>

          {/* Hashtag grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((h) => {
                const isSelected = selected.has(h.tag);
                const pop = POPULARITY_STYLES[h.popularity];
                return (
                  <motion.button
                    key={h.tag}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => toggleSelect(h.tag)}
                    className={`group flex items-center justify-between gap-1 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-primary/15 ring-2 ring-primary/30"
                        : "bg-background/50 border border-border hover:border-border/80"
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">
                        #{h.tag}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${pop.color}`}>
                          {pop.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {h.category}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyTag(h.tag);
                      }}
                      className="shrink-0 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                      title="Copier"
                    >
                      {copiedTag === h.tag ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Copy all selected */}
          {selected.size === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-3">
              Cliquez sur des hashtags pour les sélectionner, puis copiez-les en bloc
            </p>
          )}
        </motion.div>
      )}

      {/* Empty state when loading done */}
      {!loading && hashtags.length === 0 && topic.trim() === "" && (
        <div className="mt-8 text-center">
          <Hash className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Entrez un sujet et choisissez une plateforme pour commencer
          </p>
        </div>
      )}
    </div>
  );
}
