"use client";

import React from "react";
import {
  FileText, Video, Rocket, CalendarDays, Lightbulb,
  Share2, ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

export type TemplateId =
  | "blog_to_social"
  | "video_to_multi"
  | "product_launch"
  | "event_promo"
  | "thought_leadership"
  | "custom";

export type RepurposeTemplate = {
  id: TemplateId;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  platforms: string[];
  color: string;
  bg: string;
  formatHint: string;
};

export const TEMPLATES: RepurposeTemplate[] = [
  {
    id: "blog_to_social",
    title: "Blog → Social Pack",
    description: "Un article de blog transformé en LinkedIn, Twitter thread, Instagram et Newsletter",
    icon: FileText,
    platforms: ["linkedin", "twitter", "instagram", "newsletter"],
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    formatHint: "Article de blog",
  },
  {
    id: "video_to_multi",
    title: "Video Script → Multi-Platform",
    description: "Un script vidéo reformaté en TikTok, Reels, YouTube Shorts et Blog recap",
    icon: Video,
    platforms: ["tiktok_script", "instagram", "youtube_short", "blog"],
    color: "text-red-400",
    bg: "bg-red-500/10",
    formatHint: "Script vidéo",
  },
  {
    id: "product_launch",
    title: "Product Launch",
    description: "Description produit vers toutes les plateformes + email + communiqué de presse",
    icon: Rocket,
    platforms: ["linkedin", "twitter", "instagram", "tiktok_script", "newsletter", "blog"],
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    formatHint: "Description produit",
  },
  {
    id: "event_promo",
    title: "Event Promotion",
    description: "Informations événement vers LinkedIn, Twitter countdown, Instagram Stories et Facebook",
    icon: CalendarDays,
    platforms: ["linkedin", "twitter", "instagram"],
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    formatHint: "Informations événement",
  },
  {
    id: "thought_leadership",
    title: "Thought Leadership",
    description: "Un article expert en LinkedIn article, Twitter thread, Medium et Newsletter",
    icon: Lightbulb,
    platforms: ["linkedin", "twitter", "blog", "newsletter"],
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    formatHint: "Article d'expertise",
  },
];

interface RepurposeTemplatesProps {
  selected: TemplateId | null;
  onSelect: (template: RepurposeTemplate | null) => void;
}

export default function RepurposeTemplates({ selected, onSelect }: RepurposeTemplatesProps) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-foreground mb-3">Modèle de repurposing</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TEMPLATES.map((template) => {
          const isActive = selected === template.id;
          return (
            <motion.button
              key={template.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelect(isActive ? null : template)}
              className={`relative text-left p-4 rounded-xl border transition-all ${
                isActive
                  ? `${template.bg} border-current/30 ${template.color} ring-2 ring-current/20`
                  : "bg-background/50 border-border text-foreground hover:bg-accent"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isActive ? "bg-white/10" : "bg-muted"}`}>
                  <template.icon className={`w-5 h-5 ${isActive ? template.color : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{template.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {template.platforms.map((p) => (
                      <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground">
                        {p.split("_")[0]}
                      </span>
                    ))}
                  </div>
                </div>
                {isActive && (
                  <ArrowRight className="w-4 h-4 mt-1 shrink-0" />
                )}
              </div>
            </motion.button>
          );
        })}
        {/* Custom option */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onSelect(selected === "custom" ? null : { id: "custom" } as RepurposeTemplate)}
          className={`text-left p-4 rounded-xl border transition-all ${
            selected === "custom"
              ? "bg-primary/10 border-primary/30 text-primary ring-2 ring-primary/20"
              : "bg-background/50 border-border text-foreground hover:bg-accent"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${selected === "custom" ? "bg-primary/10" : "bg-muted"}`}>
              <Share2 className={`w-5 h-5 ${selected === "custom" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-sm font-semibold">Personnalisé</p>
              <p className="text-xs text-muted-foreground">Choisissez vos propres plateformes</p>
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}
