"use client";

import React, { useState } from "react";
import {
  Share2, MessageCircle, Camera, Music, Globe, BookOpen,
  Copy, Check, Sparkles, X, Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Share2, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "twitter", label: "X (Twitter)", icon: MessageCircle, color: "text-sky-400", bg: "bg-sky-500/10" },
  { id: "instagram", label: "Instagram", icon: Camera, color: "text-pink-400", bg: "bg-pink-500/10" },
  { id: "tiktok_script", label: "TikTok", icon: Music, color: "text-white", bg: "bg-white/5" },
  { id: "blog", label: "Blog", icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { id: "newsletter", label: "Newsletter", icon: BookOpen, color: "text-violet-400", bg: "bg-violet-500/10" },
];

type Variant = {
  platform: string;
  title?: string;
  content: string;
  hashtags?: string[];
};

interface RepurposeWizardProps {
  sourceText: string;
  sourceTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onCreatePost?: (platform: string, content: string) => void;
}

export default function RepurposeWizard({
  sourceText,
  sourceTitle,
  isOpen,
  onClose,
  onCreatePost,
}: RepurposeWizardProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [customText, setCustomText] = useState(sourceText);
  const [customTitle, setCustomTitle] = useState(sourceTitle ?? "");

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!selectedPlatforms.length || !customText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: customText,
          sourceTitle: customTitle || undefined,
          platforms: selectedPlatforms,
        }),
      });
      const data = await res.json() as { results?: Variant[] };
      if (data.results) {
        setVariants(data.results);
      }
    } catch (err) {
      console.error("Repurpose error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch { /* noop */ }
  };

  const getPlatformInfo = (platformId: string) =>
    PLATFORMS.find((p) => p.id === platformId) ?? { label: platformId, icon: Share2, color: "text-gray-400", bg: "bg-gray-500/10" };

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
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Share2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Repurpose</h2>
                <p className="text-xs text-muted-foreground">Transformez votre contenu pour chaque plateforme</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Source text */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">Contenu source</label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Titre (optionnel)"
              className="w-full mb-2 px-4 py-2 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              placeholder="Collez ou écrivez votre contenu source..."
            />
          </div>

          {/* Platform selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">Plateformes cibles</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const selected = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selected
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

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={loading || !selectedPlatforms.length || !customText.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Transformation en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Repurpose ({selectedPlatforms.length} plateforme{selectedPlatforms.length > 1 ? "s" : ""})
              </>
            )}
          </button>

          {/* Results */}
          {variants.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Résultats</h3>
              {variants.map((v, idx) => {
                const info = getPlatformInfo(v.platform);
                return (
                  <div key={idx} className="p-4 rounded-xl bg-background/50 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <info.icon className={`w-4 h-4 ${info.color}`} />
                        <span className="text-sm font-medium text-foreground">{info.label}</span>
                        {v.title && (
                          <span className="text-xs text-muted-foreground">— {v.title}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(v.content, idx)}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                          title="Copier"
                        >
                          {copiedIdx === idx ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        {onCreatePost && (
                          <button
                            onClick={() => onCreatePost(v.platform, v.content)}
                            className="px-3 py-1 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            Créer un post
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{v.content}</p>
                    {v.hashtags && v.hashtags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {v.hashtags.map((tag, i) => (
                          <span key={i} className="text-xs text-primary">#{tag}</span>
                        ))}
                      </div>
                    )}
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
