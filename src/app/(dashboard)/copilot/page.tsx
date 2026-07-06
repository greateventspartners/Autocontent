"use client";

import React, { useState, useCallback } from "react";
import { Sparkles, Image as ImageIcon, Link as LinkIcon, Send, Share2, MessageCircle, Camera, ThumbsUp, Music, Grid3x3, Globe, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Linkify from "@/components/Linkify";

type Platform = {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
};

const platforms: Platform[] = [
  { id: "linkedin", label: "LinkedIn", icon: Share2, color: "bg-blue-600" },
  { id: "twitter", label: "Twitter (X)", icon: MessageCircle, color: "bg-sky-500" },
  { id: "instagram", label: "Instagram", icon: Camera, color: "bg-gradient-to-tr from-pink-500 to-orange-400" },
  { id: "facebook", label: "Facebook", icon: ThumbsUp, color: "bg-blue-800" },
  { id: "tiktok", label: "TikTok", icon: Music, color: "bg-black" },
  { id: "pinterest", label: "Pinterest", icon: Grid3x3, color: "bg-red-600" },
  { id: "wordpress", label: "WordPress", icon: Globe, color: "bg-slate-700" },
  { id: "medium", label: "Medium", icon: BookOpen, color: "bg-stone-800" },
];

type GeneratedData = {
  content: string;
  platform: string;
  contentId?: string;
  postId?: string;
};

export default function CopilotPage() {
  const [activeTab, setActiveTab] = useState("linkedin");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<Record<string, GeneratedData>>({});
  const [savedId, setSavedId] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError("");
    setSavedId(null);

    try {
      const res = await fetch("/api/copilot/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, platform: activeTab }),
      });

      const data: { error?: string; platform?: string; content?: string; contentId?: string; postId?: string } = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur de génération");
        return;
      }

      setGenerated((prev) => ({
        ...prev,
        [data.platform!]: {
          content: data.content!,
          platform: data.platform!,
          contentId: data.contentId,
          postId: data.postId,
        },
      }));
      setSavedId(data.postId || null);
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, activeTab]);

  const currentPlatform = platforms.find((p) => p.id === activeTab);
  const currentData = generated[activeTab];
  const currentContent = currentData?.content;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">

      {/* LEFT: Input Area */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="glass-card rounded-2xl p-6 flex-1 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl"></div>

          <h2 className="text-xl font-bold flex items-center gap-2 mb-6 relative z-10">
            <Sparkles className="text-primary" size={20} />
            Copilot IA
          </h2>

          <div className="flex-1 flex flex-col gap-4 relative z-10">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Source ou Sujet</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Rédige un post sur notre nouvelle fonctionnalité IA, en insistant sur le gain de temps."
                className="w-full h-40 p-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                <LinkIcon size={16} /> URL
              </button>
              <button className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                <ImageIcon size={16} /> Image
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-auto space-y-2">
              {savedId && (
                <div className="flex items-center gap-2 p-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <CheckCircle2 size={14} />
                  Contenu sauvegardé dans le workspace
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isLoading}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 font-bold flex items-center justify-center gap-2 transition-transform transform active:scale-95 disabled:opacity-50"
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <Send size={18} />
                    Générer avec Gemini
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Previews */}
      <div className="w-full md:w-2/3 glass-card rounded-2xl flex flex-col overflow-hidden relative">
        <div className="flex items-center gap-1 p-3 border-b border-white/10 bg-white/[0.02] overflow-x-auto">
          {platforms.map((p) => (
            <button
              key={p.id}
              onClick={() => setActiveTab(p.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === p.id
                  ? `${p.color} text-white`
                  : 'text-muted-foreground hover:bg-white/5'
              }`}
            >
              <p.icon size={14} /> {p.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-8 bg-black/20 overflow-y-auto flex justify-center items-start">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + (currentContent ? "-content" : "-empty")}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-white rounded-xl text-black shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                  {currentPlatform?.label[0] || "A"}
                </div>
                <div>
                  <p className="font-bold text-sm">Autopilot App</p>
                  <p className="text-xs text-gray-500">{activeTab === 'linkedin' ? '24,534 abonnés' : `@autopilot_app`}</p>
                </div>
              </div>
              <div className="p-4 whitespace-pre-wrap text-sm">
                {currentContent ? (
                  <Linkify>{currentContent}</Linkify>
                ) : isLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">Entrez un prompt à gauche puis cliquez sur Générer avec Gemini...</span>
                )}
              </div>
              {currentContent && (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                  [Espace Média]
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
