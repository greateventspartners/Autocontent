"use client";

import React, { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Image as ImageIcon, Link as LinkIcon, Send, Share2, MessageCircle, Camera, ThumbsUp, Music, Grid3x3, Globe, BookOpen, AlertCircle, Copy, ExternalLink, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Linkify from "@/components/Linkify";
import { getComposerUrl } from "@/lib/publishers/composers";

type Platform = {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  ring: string;
};

const platforms: Platform[] = [
  { id: "linkedin", label: "LinkedIn", icon: Share2, color: "text-blue-400", bg: "bg-blue-500/10", ring: "ring-blue-500/30" },
  { id: "twitter", label: "X (Twitter)", icon: MessageCircle, color: "text-sky-400", bg: "bg-sky-500/10", ring: "ring-sky-500/30" },
  { id: "instagram", label: "Instagram", icon: Camera, color: "text-pink-400", bg: "bg-pink-500/10", ring: "ring-pink-500/30" },
  { id: "facebook", label: "Facebook", icon: ThumbsUp, color: "text-blue-300", bg: "bg-blue-700/10", ring: "ring-blue-700/30" },
  { id: "tiktok", label: "TikTok", icon: Music, color: "text-white", bg: "bg-white/5", ring: "ring-white/20" },
  { id: "pinterest", label: "Pinterest", icon: Grid3x3, color: "text-red-400", bg: "bg-red-500/10", ring: "ring-red-500/30" },
  { id: "wordpress", label: "WordPress", icon: Globe, color: "text-slate-300", bg: "bg-slate-600/10", ring: "ring-slate-600/30" },
  { id: "medium", label: "Medium", icon: BookOpen, color: "text-stone-300", bg: "bg-stone-600/10", ring: "ring-stone-600/30" },
];

type GeneratedData = {
  content: string;
  platform: string;
  contentId?: string;
  postId?: string;
};

const SUGGESTIONS = [
  { label: "Post LinkedIn engagement", prompt: "Rédige un post LinkedIn engageant sur l'importance de l'automatisation dans le marketing digital" },
  { label: "Thread Twitter", prompt: "Crée un thread Twitter (5 tweets) sur les erreurs courantes en social media marketing" },
  { label: "Post Instagram carrousel", prompt: "Propose un post Instagram en carrousel (5 slides) pour promouvoir notre nouvelle fonctionnalité IA" },
];

export default function CopilotPage() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full" />
      </div>
    }>
      <CopilotContent />
    </Suspense>
  );
}

function CopilotContent() {
  const [activeTab, setActiveTab] = useState("linkedin");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [generated, setGenerated] = useState<Record<string, GeneratedData>>({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMsg, setPublishMsg] = useState<string | null>(null);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setPrompt(q);
  }, [searchParams]);

  const applyUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    setPrompt((p) => `${p}\nSource : ${u}`.trim());
    setUrlOpen(false);
    setUrlInput("");
  };

  const onImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError("");
    setSavedId(null);
    setPublishMsg(null);

    try {
      let imagePayload: { data: string; mimeType: string } | undefined;
      if (imagePreview) {
        const base64 = imagePreview.split(",")[1];
        const mimeType = imagePreview.split(";")[0].split(":")[1];
        imagePayload = { data: base64, mimeType };
      }

      const res = await fetch("/api/copilot/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, platform: activeTab, image: imagePayload }),
      });

      const data: { error?: string; platform?: string; content?: string; contentId?: string; postId?: string } = await res.json();
      if (!res.ok) { setError(data.error || "Erreur de génération"); return; }

      setGenerated((prev) => ({
        ...prev,
        [data.platform!]: { content: data.content!, platform: data.platform!, contentId: data.contentId, postId: data.postId },
      }));
      setSavedId(data.postId || null);
    } catch { setError("Erreur réseau. Veuillez réessayer."); }
    finally { setIsLoading(false); }
  }, [prompt, activeTab, imagePreview]);

  const copyContent = async () => {
    if (!currentContent) return;
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2000);
    } catch { /* noop */ }
  };

  const openComposer = () => {
    if (!currentContent) return;
    window.open(getComposerUrl(activeTab, currentContent), "_blank", "noopener,noreferrer");
  };

  const publishToNetwork = async () => {
    if (!savedId || !currentContent) return;
    setPublishing(true);
    setPublishMsg(null);
    try {
      const res = await fetch(`/api/posts/${savedId}/publish`, { method: "POST" });
      const data = await res.json() as { result?: { ok: boolean; url?: string; error?: string }; composerUrl?: string | null };
      if (data.result?.ok) {
        setPublishMsg(data.result.url ? `Publié ! ${data.result.url}` : "Publié avec succès.");
        if (data.result.url) window.open(data.result.url, "_blank", "noopener,noreferrer");
      } else if (data.composerUrl) {
        try { await navigator.clipboard.writeText(currentContent); } catch { /* noop */ }
        window.open(data.composerUrl, "_blank", "noopener,noreferrer");
        setPublishMsg("Contenu copié — collez-le dans le composeur ouvert.");
      } else { setPublishMsg(data.result?.error || "Publication impossible."); }
    } catch { setPublishMsg("Erreur réseau lors de la publication."); }
    finally { setPublishing(false); }
  };

  const currentPlatform = platforms.find((p) => p.id === activeTab);
  const currentData = generated[activeTab];
  const currentContent = currentData?.content;

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col gap-4">

      {/* Platform Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white/[0.02] rounded-2xl border border-white/[0.04] overflow-x-auto scrollbar-hide">
        {platforms.map((p) => {
          const active = activeTab === p.id;
          return (
            <button key={p.id} onClick={() => setActiveTab(p.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                active
                  ? `${p.bg} ${p.color} ring-1 ${p.ring}`
                  : "text-muted-foreground hover:bg-white/[0.03] hover:text-foreground"
              }`}>
              <p.icon size={15} />
              <span className="hidden sm:inline">{p.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">

        {/* LEFT: Input Area */}
        <div className="w-full md:w-[380px] shrink-0 flex flex-col gap-4">
          <div className="glass-card rounded-2xl p-5 flex-1 flex flex-col relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center gap-2.5 mb-5 relative z-10">
              <div className="p-2 rounded-xl bg-primary/10">
                <Sparkles className="text-primary" size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold">Copilot IA</h2>
                <p className="text-[11px] text-muted-foreground">Propulsé par Gemini</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-3 relative z-10">
              {/* Prompt textarea */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Sujet ou brief</label>
                <textarea ref={textareaRef} value={prompt} onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Un post sur notre nouvelle fonctionnalité IA..."
                  className="w-full h-32 p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 resize-none placeholder:text-muted-foreground/50 transition-all" />
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <button onClick={() => setUrlOpen((v) => !v)}
                  className="flex-1 py-2 px-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors text-muted-foreground hover:text-foreground">
                  <LinkIcon size={14} /> URL
                </button>
                <button onClick={() => fileRef.current?.click()}
                  className="flex-1 py-2 px-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors text-muted-foreground hover:text-foreground">
                  <ImageIcon size={14} /> Image
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImage} />
              </div>

              {urlOpen && (
                <div className="flex gap-2">
                  <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyUrl()}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <button onClick={applyUrl} className="px-3 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-medium transition-colors">Ajouter</button>
                </div>
              )}

              {imagePreview && (
                <div className="relative w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Aperçu" className="h-16 rounded-lg border border-white/10 object-cover" />
                  <button onClick={() => setImagePreview(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors">&times;</button>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle size={14} className="shrink-0" /><span>{error}</span>
                </div>
              )}

              {/* Generate button */}
              <div className="mt-auto pt-2">
                <button onClick={handleGenerate} disabled={!prompt.trim() || isLoading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl shadow-lg shadow-primary/20 font-medium text-sm flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
                  {isLoading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  ) : <><Zap size={16} /> Générer</>}
                </button>
              </div>

              {/* Action buttons (after generation) */}
              {currentContent && (
                <div className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    <button onClick={copyContent}
                      className="flex-1 py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors">
                      <Copy size={13} /> {copiedMsg ? "Copié !" : "Copier"}
                    </button>
                    <button onClick={openComposer}
                      className="flex-1 py-2 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors">
                      <ExternalLink size={13} /> Composer
                    </button>
                    <button onClick={publishToNetwork} disabled={publishing}
                      className="flex-1 py-2 px-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50">
                      {publishing ? "..." : <><Send size={13} /> Publier</>}
                    </button>
                  </div>
                  {publishMsg && <p className="text-[11px] text-emerald-400 text-center">{publishMsg}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Preview Area */}
        <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden min-h-0">
          {/* Preview header */}
          <div className="px-5 py-3.5 border-b border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${currentPlatform?.bg}`} />
              <span className="text-sm font-medium">{currentPlatform?.label}</span>
            </div>
            <span className="text-[11px] text-muted-foreground">Aperçu</span>
          </div>

          {/* Content area */}
          <div className="flex-1 p-6 overflow-y-auto flex justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + (currentContent ? "-content" : "-empty")}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-lg"
              >
                {currentContent ? (
                  <div className="bg-white rounded-2xl text-black shadow-2xl overflow-hidden">
                    {/* Post header */}
                    <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white text-xs font-bold">A</div>
                      <div>
                        <p className="font-bold text-sm">Autocontent</p>
                        <p className="text-xs text-gray-400">{activeTab === "linkedin" ? "24,534 abonnés" : "@autocontent_app"}</p>
                      </div>
                    </div>
                    {/* Post body */}
                    <div className="p-4 whitespace-pre-wrap text-sm leading-relaxed">
                      <Linkify>{currentContent}</Linkify>
                    </div>
                    {/* Media placeholder */}
                    <div className="w-full h-40 bg-gray-50 flex items-center justify-center text-gray-300 text-sm border-t border-gray-100">
                      Espace Média
                    </div>
                  </div>
                ) : isLoading ? (
                  <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 bg-gray-200 rounded w-1/3 animate-pulse" />
                        <div className="h-2 bg-gray-100 rounded w-1/4 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-full animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="text-primary" size={28} />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">Prêt à créer</p>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                      Décrivez le contenu souhaité et sélectionnez une plateforme pour générer votre post.
                    </p>
                    {/* Suggestion chips */}
                    <div className="flex flex-wrap justify-center gap-2 mt-6">
                      {SUGGESTIONS.map((s, i) => (
                        <button key={i} onClick={() => setPrompt(s.prompt)}
                          className="px-3 py-1.5 text-xs text-muted-foreground bg-white/[0.04] border border-white/[0.06] rounded-full hover:bg-white/[0.08] hover:text-foreground transition-colors">
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
