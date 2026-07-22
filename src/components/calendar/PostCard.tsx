"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { PLATFORM_COLORS, PLATFORM_ICONS, type CalendarPost } from "./types";

interface PostCardProps {
  post: CalendarPost;
  onClick?: () => void;
  compact?: boolean;
}

export default function PostCard({ post, onClick, compact }: PostCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.id,
    data: { post },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), zIndex: 50 }
    : undefined;

  const color = PLATFORM_COLORS[post.platform.toLowerCase()] || "bg-gray-500 text-white";
  const icon = PLATFORM_ICONS[post.platform.toLowerCase()] || "?";
  const time = post.scheduledAt
    ? new Date(post.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "";

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={onClick}
        className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 cursor-grab active:cursor-grabbing select-none transition-opacity ${color} ${isDragging ? "opacity-50" : ""}`}
      >
        <span className="font-bold opacity-80 uppercase hidden lg:inline">{icon}</span>
        <span className="truncate">{post.sourceIdea}</span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] cursor-grab active:cursor-grabbing select-none transition-all group ${isDragging ? "opacity-50 shadow-lg" : ""}`}
    >
      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex-shrink-0 ${color}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{post.sourceIdea}</p>
        {time && <p className="text-xs text-muted-foreground">{time}</p>}
      </div>
    </div>
  );
}
