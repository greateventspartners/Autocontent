"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Inbox, FileText } from "lucide-react";
import { PLATFORM_COLORS, PLATFORM_ICONS, PLATFORM_LABELS, type CalendarPost } from "./types";

interface UnplannedPaneProps {
  posts: CalendarPost[];
  onPostClick: (post: CalendarPost) => void;
}

function UnplannedCard({ post, onPostClick }: { post: CalendarPost; onPostClick: (post: CalendarPost) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    data: { post, fromUnplanned: true },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  const platform = post.platform.toLowerCase();
  const color = PLATFORM_COLORS[platform] || "bg-gray-500 text-white";
  const icon = PLATFORM_ICONS[platform] || "?";
  const label = PLATFORM_LABELS[platform] || platform;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onPostClick(post)}
      className={`flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] cursor-grab active:cursor-grabbing select-none transition-all ${isDragging ? "opacity-50 shadow-lg" : ""}`}
    >
      <span className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase flex-shrink-0 ${color}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{post.sourceIdea}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <div className="flex-shrink-0">
        <FileText size={14} className="text-muted-foreground/40" />
      </div>
    </div>
  );
}

export default function UnplannedPane({ posts, onPostClick }: UnplannedPaneProps) {
  if (posts.length === 0) {
    return (
      <div className="flex-1 glass-card rounded-2xl flex flex-col items-center justify-center border border-white/10">
        <Inbox size={48} className="text-muted-foreground/20 mb-4" />
        <p className="text-muted-foreground font-medium mb-1">Aucun brouillon</p>
        <p className="text-muted-foreground/60 text-sm text-center max-w-xs">
          Créez du contenu avec le Copilot ou glissez-déposez des posts ici pour les déplanifier.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border border-white/10">
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
        <Inbox size={18} className="text-muted-foreground" />
        <div>
          <p className="text-sm font-bold">Non planifiés</p>
          <p className="text-xs text-muted-foreground">
            {posts.length} brouillon{posts.length > 1 ? "s" : ""} — glissez vers le calendrier pour planifier
          </p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {posts.map((post) => (
          <UnplannedCard key={post.id} post={post} onPostClick={onPostClick} />
        ))}
      </div>
    </div>
  );
}
