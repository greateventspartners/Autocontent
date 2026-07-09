"use client";

import React, { useState } from "react";
import { PenLine, Copy, ExternalLink, Sparkles, AlertCircle, Check } from "lucide-react";
import { motion } from "framer-motion";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "twitter", label: "X (Twitter)" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "pinterest", label: "Pinterest" },
  { id: "wordpress", label: "WordPress" },
  { id: "medium", label: "Medium" },
];

const PROFILE_URLS: Record<string, string> = {
  linkedin: "https://www.linkedin.com/in/",
  twitter: "https://twitter.com/settings/profile",
  instagram: "https://www.instagram.com/",
  facebook: "https://www.facebook.com/",
  tiktok: "https://www.tiktok.com/",
  pinterest: "https://www.pinterest.com/",
  wordpress: "https://wordpress.com/me",
  medium: "https://medium.com/settings",
};

export default function BioPage() {
  const [bios, setBios] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bio/generate", { method: "POST" });
      const data = await res.json() as { error?: string; bios?: Record<string, string[]> };
      if (!res.ok) throw new Error(data.error || "Génération impossible");
      setBios(data.bios ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <PenLine className="text-primary" size={28} />
            Bio &amp; Profils
          </h2>
          <p className="text-muted-foreground mt-1">
            Des bios cohérents avec votre Brand Voice, déclinés pour chaque réseau.
          </p>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 font-medium text-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <Sparkles size={18} />
          )}
          Générer mes bios
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!bios && !loading && (
        <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
          <Sparkles className="mx-auto mb-3 text-primary" size={28} />
          Cliquez sur « Générer mes bios » pour créer des profils optimisés à partir de votre Brand Kit.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLATFORMS.map((platform) => {
          const variants = bios?.[platform.id] ?? [];
          if (!bios) return null;
          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold">{platform.label}</h3>
                <a
                  href={PROFILE_URLS[platform.id]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  Profil <ExternalLink size={12} />
                </a>
              </div>

              {variants.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aucune bio générée.</p>
              ) : (
                variants.map((text, i) => {
                  const key = `${platform.id}-${i}`;
                  return (
                    <div key={key} className="rounded-xl bg-black/20 p-3 text-sm relative pr-10">
                      <p className="whitespace-pre-wrap">{text}</p>
                      <button
                        onClick={() => copy(key, text)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Copier"
                      >
                        {copied === key ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  );
                })
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
