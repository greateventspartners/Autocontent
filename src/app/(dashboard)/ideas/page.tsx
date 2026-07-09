"use client";

import React, { useState } from "react";
import { Lightbulb, Sparkles, CalendarPlus, AlertCircle, Check } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  twitter: "X",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  wordpress: "WordPress",
  medium: "Medium",
};

type Idea = {
  title: string;
  platform: string;
  angle: string;
  hook: string;
};

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState<Record<number, boolean>>({});

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ideas/generate", { method: "POST" });
      const data = await res.json() as { error?: string; ideas?: Idea[] };
      if (!res.ok) throw new Error(data.error || "Génération impossible");
      setIdeas(data.ideas ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const addToCalendar = async (index: number, idea: Idea) => {
    try {
      const res = await fetch("/api/ideas/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: idea.title, platform: idea.platform, hook: idea.hook }),
      });
      if (!res.ok) throw new Error();
      setAdded((prev) => ({ ...prev, [index]: true }));
    } catch {
      setError("Ajout au calendrier impossible.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Lightbulb className="text-primary" size={28} />
            Idées de contenu
          </h2>
          <p className="text-muted-foreground mt-1">
            Des sujets générés par l&apos;IA, cohérents avec votre Brand Voice, prêts à planifier.
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
          Générer des idées
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!ideas && !loading && (
        <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
          <Lightbulb className="mx-auto mb-3 text-primary" size={28} />
          Lancez la génération pour obtenir des idées de contenus adaptées à votre marque.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ideas?.map((idea, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-bold leading-snug">{idea.title}</h3>
              <span className="shrink-0 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                {PLATFORM_LABELS[idea.platform] || idea.platform}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{idea.angle}</p>
            <p className="text-sm italic border-l-2 border-primary/40 pl-3">{idea.hook}</p>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => addToCalendar(i, idea)}
                disabled={added[i]}
                className="flex-1 py-2 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {added[i] ? <Check size={16} /> : <CalendarPlus size={16} />}
                {added[i] ? "Ajouté" : "Au calendrier"}
              </button>
              {added[i] && (
                <Link
                  href="/calendar"
                  className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm flex items-center justify-center"
                >
                  Voir
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
