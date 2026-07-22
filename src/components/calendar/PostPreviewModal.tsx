"use client";

import React, { useState } from "react";
import { X, ExternalLink, Trash2, Clock, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PLATFORM_COLORS, PLATFORM_ICONS, PLATFORM_LABELS, STATUS_COLORS, STATUS_LABELS, type CalendarPost } from "./types";
import ScheduleSuggestion from "./ScheduleSuggestion";

interface PostPreviewModalProps {
  post: CalendarPost;
  onClose: () => void;
  onDeleted: (postId: string) => void;
}

export default function PostPreviewModal({ post, onClose, onDeleted }: PostPreviewModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [scheduling, setScheduling] = useState(false);

  const platform = post.platform.toLowerCase();
  const color = PLATFORM_COLORS[platform] || "bg-gray-500 text-white";
  const icon = PLATFORM_ICONS[platform] || "?";
  const label = PLATFORM_LABELS[platform] || platform;
  const statusColor = STATUS_COLORS[post.status] || "bg-muted text-muted-foreground";
  const statusLabel = STATUS_LABELS[post.status] || post.status;

  const scheduledDate = post.scheduledAt
    ? new Date(post.scheduledAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const handleDelete = async () => {
    if (!confirm("Supprimer ce post ?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted(post.id);
        onClose();
      }
    } finally {
      setDeleting(false);
    }
  };

  const handlePublish = async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/publish`, { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data.url) window.open(data.url, "_blank");
      onClose();
    } catch {
      // silencieux
    }
  };

  const handleSchedule = async (date: string, time: string) => {
    setScheduling(true);
    try {
      await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: `${date}T${time}:00.000Z`, status: "SCHEDULED" }),
      });
      onClose();
    } finally {
      setScheduling(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg glass-card rounded-2xl border border-white/[0.06] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${color}`}>
                {icon}
              </span>
              <div>
                <p className="text-sm font-bold">{label}</p>
                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold mt-0.5 ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-muted-foreground">
              <X size={18} />
            </button>
          </div>

          {/* Preview card */}
          <div className="p-5">
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">AC</span>
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">Autocontent</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                {post.body || post.sourceIdea}
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="px-5 pb-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">Source :</span>
              <span className="truncate">{post.sourceIdea}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">Campagne :</span>
              <span>{post.content.campaign.title}</span>
            </div>
            {scheduledDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock size={14} />
                <span>Planifié le {scheduledDate}</span>
              </div>
            )}
            {!scheduledDate && post.status !== "PUBLISHED" && (
              <div className="pt-2">
                <ScheduleSuggestion
                  platform={platform}
                  excludeId={post.id}
                  onSchedule={handleSchedule}
                />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 p-5 border-t border-white/[0.06]">
            <a
              href={`/copilot?edit=${post.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm font-medium hover:bg-white/[0.08] transition-colors"
            >
              <ExternalLink size={14} />
              Éditer
            </a>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deleting ? "..." : "Supprimer"}
            </button>
            {post.status !== "PUBLISHED" && (
              <button
                onClick={handlePublish}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-medium hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 transition-all"
              >
                <Send size={14} />
                Publier
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
