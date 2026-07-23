"use client";

import React, { useState, useMemo } from "react";
import {
  Share2, MessageCircle, Camera, Music, Globe, BookOpen,
  Copy, Check, Sparkles, X, Loader2, Languages, Palette,
  Save, ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RepurposeTemplates, { type TemplateId, type RepurposeTemplate, TEMPLATES } from "./RepurposeTemplates";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Share2, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "twitter", label: "X (Twitter)", icon: MessageCircle, color: "text-sky-400", bg: "bg-sky-500/10" },
  { id: "instagram", label: "Instagram", icon: Camera, color: "text-pink-400", bg: "bg-pink-500/10" },
  { id: "tiktok_script", label: "TikTok", icon: Music, color: "text-white", bg: "bg-white/5" },
  { id: "youtube_short", label: "YouTube Short", icon: Music, color: "text-red-400", bg: "bg-red-500/10" },
  { id: "blog", label: "Blog", icon: Globe, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { id: "newsletter", label: "Newsletter", icon: BookOpen, color: "text-violet-400", bg: "bg-violet-500/10" },
];

const TONES = [
  { id: "professionnel", label: "Professionnel", emoji: "💼" },
  { id: "décontracté", label: "Décontracté", emoji: "😊" },
  { id: "inspirant", label: "Inspirant", emoji: "✨" },
  { id: "humoristique", label: "Humoristique", emoji: "😄" },
  { id: "éducatif", label: "Éducatif", emoji: "📚" },
];

const LANGUAGES = [
  { id: "français", label: "Français", flag: "🇫🇷" },
  { id: "anglais", label: "Anglais", flag: "🇬🇧" },
  { id: "espagnol", label: "Espagnol", flag: "🇪🇸" },
];

const WORD_COUNT_ESTIMATES: Record<string, { min: number; max: number }> = {
  linkedin: { min: 100, max: 300 },
  twitter: { min: 30, max: 280 },
  instagram: { min: 50, max: 200 },
  tiktok_script: { min: 80, max: 250 },
  youtube_short: { min: 80, max: 250 },
  blog: { min: 400, max: 800 },
  newsletter: { min: 200, max: 500 },
};

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

type Step = "template" | "configure" | "results";

export default function RepurposeWizard({
  sourceText,
  sourceTitle,
  isOpen,
  onClose,
  onCreatePost,
}: RepurposeWizardProps) {
  const [step, setStep] = useState<Step>("template");
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [tone, setTone] = useState<string>("professionnel");
  const [language, setLanguage] = useState<string>("français");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [customText, setCustomText] = useState(sourceText);
  const [customTitle, setCustomTitle] = useState(sourceTitle ?? "");
  const [showSaved, setShowSaved] = useState(false);

  const activeTemplate = TEMPLATES.find((t) => t.id === selectedTemplate);

  const wordEstimates = useMemo(() => {
    return selectedPlatforms.reduce(
      (acc, p) => {
        const est = WORD_COUNT_ESTIMATES[p];
        if (est) {
          acc.min += est.min;
          acc.max += est.max;
        }
        return acc;
      },
      { min: 0, max: 0 },
    );
  }, [selectedPlatforms]);

  const handleTemplateSelect = (template: RepurposeTemplate | null) => {
    if (!template || template.id === "custom") {
      setSelectedTemplate("custom");
      setSelectedPlatforms([]);
    } else {
      setSelectedTemplate(template.id);
      setSelectedPlatforms(template.platforms);
    }
    setStep("configure");
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
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
          tone,
          language,
          templateId: selectedTemplate,
        }),
      });
      const data = await res.json() as { results?: Variant[] };
      if (data.results) {
        setVariants(data.results);
        setStep("results");
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

  const handleCopyAll = async () => {
    const all = variants
      .map((v) => `--- ${getPlatformInfo(v.platform).label} ---\n${v.content}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(all);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch { /* noop */ }
  };

  const handleBack = () => {
    if (step === "configure") setStep("template");
    else if (step === "results") setStep("configure");
  };

  const handleReset = () => {
    setStep("template");
    setSelectedTemplate(null);
    setSelectedPlatforms([]);
    setVariants([]);
  };

  const getPlatformInfo = (platformId: string) =>
    PLATFORMS.find((p) => p.id === platformId) ?? {
      label: platformId,
      icon: Share2,
      color: "text-gray-400",
      bg: "bg-gray-500/10",
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
          className="w-full max-w-4xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {step !== "template" && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <div className="p-2 rounded-xl bg-primary/10">
                <Share2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Repurpose v2</h2>
                <p className="text-xs text-muted-foreground">
                  {step === "template" && "Choisissez un modèle ou créez le vôtre"}
                  {step === "configure" && "Configurez vos paramètres de transformation"}
                  {step === "results" && `${variants.length} variante${variants.length > 1 ? "s" : ""} générée${variants.length > 1 ? "s" : ""}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {step !== "template" && (
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
                >
                  Recommencer
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Step: Template selection */}
          {step === "template" && (
            <>
              <RepurposeTemplates selected={selectedTemplate} onSelect={handleTemplateSelect} />
            </>
          )}

          {/* Step: Configure */}
          {step === "configure" && (
            <>
              {selectedTemplate === "custom" && (
                <>
                  {/* Source text (custom only) */}
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
                </>
              )}

              {activeTemplate && activeTemplate.id !== "custom" && (
                <div className="mb-6 p-4 rounded-xl bg-background/50 border border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <activeTemplate.icon className={`w-4 h-4 ${activeTemplate.color}`} />
                    <span className="text-sm font-semibold text-foreground">{activeTemplate.title}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{activeTemplate.description}</p>
                  <div className="mt-2">
                    <span className="text-xs text-muted-foreground">Format source : </span>
                    <span className="text-xs text-foreground">{activeTemplate.formatHint}</span>
                  </div>
                </div>
              )}

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
                {selectedPlatforms.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <span>Estimation : ~{wordEstimates.min}–{wordEstimates.max} mots au total</span>
                  </div>
                )}
              </div>

              {/* Tone selector */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-foreground">Ton</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all ${
                        tone === t.id
                          ? "bg-primary/10 text-primary ring-2 ring-primary/20"
                          : "bg-background/50 text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      <span>{t.emoji}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language selector */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Languages className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium text-foreground">Langue</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLanguage(l.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all ${
                        language === l.id
                          ? "bg-primary/10 text-primary ring-2 ring-primary/20"
                          : "bg-background/50 text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      <span>{l.flag}</span>
                      {l.label}
                    </button>
                  ))}
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
            </>
          )}

          {/* Step: Results */}
          {step === "results" && variants.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Résultats</h3>
                <button
                  onClick={handleCopyAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Tout copier
                </button>
              </div>
              {variants.map((v, idx) => {
                const info = getPlatformInfo(v.platform);
                const est = WORD_COUNT_ESTIMATES[v.platform];
                const wordCount = v.content.split(/\s+/).length;
                return (
                  <div key={idx} className="p-4 rounded-xl bg-background/50 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <info.icon className={`w-4 h-4 ${info.color}`} />
                        <span className="text-sm font-medium text-foreground">{info.label}</span>
                        {v.title && <span className="text-xs text-muted-foreground">— {v.title}</span>}
                        <span className="text-[10px] text-muted-foreground ml-1">
                          ~{wordCount} mots
                        </span>
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
