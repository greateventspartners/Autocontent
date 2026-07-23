"use client";

import React, { useState, useRef } from "react";
import { Wizard, type WizardStep } from "@/components/wizard/Wizard";
import {
  Share2, MessageCircle, Camera, ThumbsUp, Music, Grid3x3, Globe, BookOpen,
  Sparkles, Link as LinkIcon, ImageIcon, Send, Copy, ExternalLink, Check,
  AlertCircle, Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import Linkify from "@/components/Linkify";
import { getComposerUrl } from "@/lib/publishers/composers";

const STEPS: WizardStep[] = [
  { id: "platform", label: "Plateforme", icon: Share2 },
  { id: "content", label: "Contenu", icon: Sparkles },
  { id: "media", label: "Média", icon: ImageIcon, optional: true },
  { id: "publish", label: "Publier", icon: Send },
];

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", icon: Share2, color: "text-blue-400", bg: "bg-blue-500/10" },
  { id: "twitter", label: "X (Twitter)", icon: MessageCircle, color: "text-sky-400", bg: "bg-sky-500/10" },
  { id: "instagram", label: "Instagram", icon: Camera, color: "text-pink-400", bg: "bg-pink-500/10" },
  { id: "facebook", label: "Facebook", icon: ThumbsUp, color: "text-blue-300", bg: "bg-blue-700/10" },
  { id: "tiktok", label: "TikTok", icon: Music, color: "text-white", bg: "bg-white/5" },
  { id: "pinterest", label: "Pinterest", icon: Grid3x3, color: "text-red-400", bg: "bg-red-500/10" },
  { id: "wordpress", label: "WordPress", icon: Globe, color: "text-slate-300", bg: "bg-slate-600/10" },
  { id: "medium", label: "Medium", icon: BookOpen, color: "text-stone-300", bg: "bg-stone-600/10" },
];

const SUGGESTIONS = [
  "Post LinkedIn engageant sur notre nouvelle fonctionnalité",
  "Thread Twitter (5 tweets) sur les erreurs courantes en marketing",
  "Post Instagram carrousel (5 slides) pour promouvoir un produit",
  "Article de blog WordPress sur les tendances du secteur",
];

interface CopilotWizardProps {
  onComplete: (data: { platform: string; prompt: string; postId?: string }) => void;
  onSkip: () => void;
}

export default function CopilotWizard({ onComplete, onSkip }: CopilotWizardProps) {
  const [platform, setPlatform] = useState("linkedin");
  const [prompt, setPrompt] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<{ content: string; postId?: string } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedPlatform = PLATFORMS.find((p) => p.id === platform);

  const canProceed = (step: number) => {
    if (step === 0) return true;
    if (step === 1) return prompt.trim().length > 0;
    return true;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError("");
    try {
      let imagePayload: { data: string; mimeType: string } | undefined;
      if (imagePreview) {
        const base64 = imagePreview.split(",")[1];
        const mimeType = imagePreview.split(";")[0].split(":")[1];
        imagePayload = { data: base64, mimeType };
      }

      const fullPrompt = urlInput.trim()
        ? `${prompt}\nSource : ${urlInput.trim()}`
        : prompt;

      const res = await fetch("/api/copilot/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: fullPrompt, platform, image: imagePayload }),
      });

      const data: { error?: string; content?: string; postId?: string } = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur de génération");
        return;
      }

      setGenerated({ content: data.content || "", postId: data.postId });
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyContent = async () => {
    if (!generated?.content) return;
    try {
      await navigator.clipboard.writeText(generated.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Wizard
        steps={STEPS}
        onFinish={() => onComplete({ platform, prompt, postId: generated?.postId })}
        finishLabel="Utiliser ce contenu"
        canProceed={canProceed}
      >
        {/* Step 1: Platform */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold">Choisissez votre plateforme</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Le contenu sera adapté au format et au ton de la plateforme.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PLATFORMS.map((p) => {
              const Icon = p.icon;
              const active = platform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${
                    active
                      ? `${p.bg} border-primary/30 ring-1 ring-primary/20`
                      : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                  }`}
                >
                  <Icon size={20} className={active ? p.color : "text-muted-foreground"} />
                  <span className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Content */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold">Décrivez votre contenu</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Plus votre brief est précis, meilleur sera le résultat.
            </p>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Un post sur notre nouvelle fonctionnalité IA qui automatise la création de contenu..."
            className="w-full h-40 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 resize-none placeholder:text-muted-foreground/50 transition-all"
          />
          <div>
            <p className="text-xs text-muted-foreground mb-2">Suggestions :</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(s)}
                  className="px-3 py-1.5 text-xs text-muted-foreground bg-white/[0.04] border border-white/[0.06] rounded-full hover:bg-white/[0.08] hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: Media (optional) */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold">Ajoutez un média</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Optionnel — ajoutez une image ou une source URL pour enrichir le contenu.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="p-6 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/[0.02] transition-all flex flex-col items-center gap-3"
            >
              <div className="p-3 rounded-xl bg-primary/10">
                <ImageIcon size={20} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Image</p>
                <p className="text-[11px] text-muted-foreground">Upload une image</p>
              </div>
            </button>

            <div className="p-6 rounded-xl border border-white/5">
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <LinkIcon size={20} className="text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Source URL</p>
                  <p className="text-[11px] text-muted-foreground mb-2">Lien vers un article</p>
                </div>
                <input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => setImagePreview(reader.result as string);
              reader.readAsDataURL(file);
            }
          }} />

          {imagePreview && (
            <div className="relative w-fit mx-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Aperçu" className="h-24 rounded-lg border border-white/10 object-cover" />
              <button
                onClick={() => setImagePreview(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                &times;
              </button>
            </div>
          )}
        </div>

        {/* Step 4: Generate & Preview */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold">Générez et prévisualisez</h3>
            <p className="text-sm text-muted-foreground mt-1">
              L&apos;IA crée votre contenu optimisé pour {selectedPlatform?.label}.
            </p>
          </div>

          {!generated && !isGenerating && (
            <button
              onClick={handleGenerate}
              className="w-full py-4 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl shadow-lg shadow-primary/20 font-medium text-sm flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
            >
              <Zap size={18} /> Générer le contenu
            </button>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center gap-4 py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full"
              />
              <p className="text-sm text-muted-foreground">Génération en cours...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {generated && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl text-black shadow-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    A
                  </div>
                  <div>
                    <p className="font-bold text-sm">Autocontent</p>
                    <p className="text-xs text-gray-400">@autocontent_app</p>
                  </div>
                </div>
                <div className="p-4 whitespace-pre-wrap text-sm leading-relaxed">
                  <Linkify>{generated.content}</Linkify>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={copyContent}
                  className="flex-1 py-2.5 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Copy size={13} /> {copied ? "Copié !" : "Copier"}
                </button>
                <button
                  onClick={() => window.open(getComposerUrl(platform, generated.content), "_blank")}
                  className="flex-1 py-2.5 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={13} /> Composer
                </button>
                <button
                  onClick={() => onComplete({ platform, prompt, postId: generated.postId })}
                  className="flex-1 py-2.5 px-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Check size={13} /> Utiliser
                </button>
              </div>
            </div>
          )}
        </div>
      </Wizard>

      <div className="text-center mt-6">
        <button
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Passer le wizard et utiliser le copilot directement
        </button>
      </div>
    </div>
  );
}
