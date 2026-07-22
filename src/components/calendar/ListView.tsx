"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, Clock } from "lucide-react";
import { PLATFORM_COLORS, PLATFORM_ICONS, STATUS_COLORS, STATUS_LABELS, type CalendarPost } from "./types";

interface ListViewProps {
  posts: CalendarPost[];
  onPostClick: (post: CalendarPost) => void;
}

function ListRow({ post, onPostClick }: { post: CalendarPost; onPostClick: (post: CalendarPost) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    data: { post },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  const platform = post.platform.toLowerCase();
  const color = PLATFORM_COLORS[platform] || "bg-gray-500 text-white";
  const icon = PLATFORM_ICONS[platform] || "?";
  const statusColor = STATUS_COLORS[post.status] || "bg-muted text-muted-foreground";
  const statusLabel = STATUS_LABELS[post.status] || post.status;

  const d = post.scheduledAt ? new Date(post.scheduledAt) : null;
  const dateStr = d
    ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    : "—";
  const timeStr = d
    ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "—";
  const weekday = d ? ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"][d.getDay()] : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onPostClick(post)}
      className={`flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-grab active:cursor-grabbing select-none border-b border-white/[0.03] last:border-0 ${isDragging ? "opacity-50" : ""}`}
    >
      {/* Date */}
      <div className="w-20 flex-shrink-0 text-center">
        <p className="text-[10px] text-muted-foreground">{weekday}</p>
        <p className="text-sm font-bold">{dateStr}</p>
      </div>

      {/* Time */}
      <div className="w-14 flex-shrink-0 text-center">
        <p className="text-sm text-muted-foreground flex items-center gap-1 justify-center">
          <Clock size={12} />
          {timeStr}
        </p>
      </div>

      {/* Platform */}
      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex-shrink-0 w-10 text-center ${color}`}>
        {icon}
      </span>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{post.sourceIdea}</p>
        <p className="text-xs text-muted-foreground truncate">{post.content.campaign.title}</p>
      </div>

      {/* Status */}
      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex-shrink-0 ${statusColor}`}>
        {statusLabel}
      </span>
    </div>
  );
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function ListView({ posts, onPostClick }: ListViewProps) {
  const sorted = [...posts].sort((a, b) => {
    if (!a.scheduledAt) return 1;
    if (!b.scheduledAt) return -1;
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });

  if (sorted.length === 0) {
    return (
      <div className="flex-1 glass-card rounded-2xl flex flex-col items-center justify-center border border-white/10">
        <CalendarDays size={40} className="text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">Aucune publication planifiée.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border border-white/10">
      {/* Table header */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.015] text-xs font-medium text-muted-foreground">
        <div className="w-20 text-center">Date</div>
        <div className="w-14 text-center">Heure</div>
        <div className="w-10 text-center">Réseau</div>
        <div className="flex-1">Titre</div>
        <div>Statut</div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {sorted.map((post) => (
          <ListRow key={post.id} post={post} onPostClick={onPostClick} />
        ))}
      </div>
    </div>
  );
}
