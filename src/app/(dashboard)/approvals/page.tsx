"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, MessageSquare, Link as LinkIcon, AlertCircle, Share2, Send, Clock, Sparkles, Eye } from "lucide-react";
import ScheduleSuggestion from "@/components/calendar/ScheduleSuggestion";
import { motion, AnimatePresence } from "framer-motion";
import ClientPortalModal from "@/components/ClientPortalModal";
import Linkify from "@/components/Linkify";

type ApprovalPost = {
  id: string;
  sourceIdea: string;
  platform: string;
  body: string;
  status: string;
  scheduledAt: string | null;
  campaignTitle: string;
  content?: { sourceIdea: string; campaign?: { title: string } };
};

type Comment = {
  id: string;
  text: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

type Tab = "pending" | "approved" | "rejected";

export default function ApprovalsPage() {
  const [posts, setPosts] = useState<ApprovalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [publishLoading, setPublishLoading] = useState<string | null>(null);
  const [clientCopied, setClientCopied] = useState(false);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [scheduleLoading, setScheduleLoading] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Record<string, string>>({});
  const [portalOpen, setPortalOpen] = useState(false);

  const fetchPosts = (status: string) => {
    setLoading(true);
    setError("");

    const endpoint = status === "all" ? "/api/posts" : `/api/posts?status=${status}`;

    fetch(endpoint)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement");
        return res.json() as Promise<{ posts: ApprovalPost[] }>;
      })
      .then((data) => {
        const mapped = data.posts.map((p) => ({
          id: p.id,
          sourceIdea: p.sourceIdea,
          platform: p.platform,
          body: p.body,
          status: p.status,
          scheduledAt: p.scheduledAt,
          campaignTitle: p.content?.campaign?.title || "",
        }));
        setPosts(mapped);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const statusMap: Record<Tab, string> = {
      pending: "PENDING_APPROVAL",
      approved: "APPROVED",
      rejected: "REJECTED",
    };
    fetchPosts(statusMap[activeTab]);
  }, [activeTab]);

  const fetchComments = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = (await res.json()) as { comments?: Comment[] };
      if (data.comments) setComments((prev) => ({ ...prev, [postId]: data.comments! }));
    } catch { /* ignore */ }
  };

  const addComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    setCommentLoading(postId);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { comment?: Comment; error?: string };
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.comment) {
        setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), data.comment!] }));
        setCommentText((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur commentaire");
    } finally {
      setCommentLoading(null);
    }
  };

  const handleAction = async (id: string, newStatus: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || "Erreur");
      }

      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'action");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (id: string) => {
    setPublishLoading(id);
    try {
      const res = await fetch(`/api/posts/${id}/publish`, { method: "POST" });
      const data = await res.json() as {
        result?: { ok: boolean; url?: string; error?: string };
        composerUrl?: string | null;
      };

      if (data.result?.ok) {
        if (data.result.url) window.open(data.result.url, "_blank", "noopener,noreferrer");
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else if (data.composerUrl) {
        window.open(data.composerUrl, "_blank", "noopener,noreferrer");
      } else {
        setError(data.result?.error || "Publication impossible.");
      }
    } catch {
      setError("Erreur réseau lors de la publication.");
    } finally {
      setPublishLoading(null);
    }
  };

  const handleSchedule = async (id: string) => {
    const dateStr = scheduleDate[id];
    if (!dateStr) return;
    setScheduleLoading(id);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledAt: dateStr, status: "SCHEDULED" }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || "Erreur");
      }
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la planification");
    } finally {
      setScheduleLoading(null);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "pending", label: "En Attente" },
    { key: "approved", label: "Approuvés" },
    { key: "rejected", label: "Rejetés" },
  ];

  const platformLabel: Record<string, string> = {
    linkedin: "LinkedIn",
    twitter: "X",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    pinterest: "Pinterest",
    wordpress: "WordPress",
    medium: "Medium",
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CheckCircle className="text-primary" size={28} />
            Approbations & Client
          </h2>
          <p className="text-muted-foreground mt-1">Validez les contenus avant publication ou générez un lien magique pour vos clients.</p>
        </div>
          <button
            onClick={() => setPortalOpen(true)}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm flex items-center gap-2 transition-colors"
          >
            <LinkIcon size={16} />
            Portail Client
          </button>
          <Link
            href="/preview"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm flex items-center gap-2 transition-colors"
          >
            <Eye size={16} />
            Aperçu
          </Link>
      </div>

      <ClientPortalModal isOpen={portalOpen} onClose={() => setPortalOpen(false)} />

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2 md:gap-4 border-b border-white/10 pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`font-medium pb-4 -mb-4 px-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full"
            />
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center text-center"
          >
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Tout est à jour !</h3>
            <p className="text-muted-foreground">
              {activeTab === "pending"
                ? "Aucun contenu en attente d'approbation."
                : activeTab === "approved"
                  ? "Aucun contenu approuvé."
                  : "Aucun contenu rejeté."}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            {posts.map((post) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="glass-card rounded-2xl overflow-hidden flex flex-col md:flex-row"
              >
                <div className="w-full md:w-2/3 p-6 border-b md:border-b-0 md:border-r border-white/10 bg-black/20">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
                      {platformLabel[post.platform] || post.platform}
                    </span>
                    {post.scheduledAt && (
                      <span className="text-xs text-muted-foreground">
                        Planifié pour {new Date(post.scheduledAt).toLocaleDateString("fr-FR")}
                      </span>
                    )}
                  </div>

                  <div className="bg-white text-black p-5 rounded-xl shadow-xl max-w-lg mx-auto">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                      <div>
                        <p className="font-bold text-sm">Autocontent</p>
                        <p className="text-xs text-gray-500">{post.campaignTitle || "Campagne"}</p>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm mb-3"><Linkify>{post.body || "Aucun contenu généré."}</Linkify></p>
                  </div>
                </div>

                <div className="w-full md:w-1/3 p-6 flex flex-col bg-white/[0.02]">
                  <h4 className="font-bold text-lg mb-1">{post.sourceIdea}</h4>
                  <p className="text-sm text-muted-foreground mb-6">Créé par IA Copilot</p>

                  <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                      <button
                        onClick={() => {
                          if (!expandedComments[post.id]) fetchComments(post.id);
                          setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
                        }}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
                      >
                        <MessageSquare size={16} />
                        <span>
                          {comments[post.id]?.length
                            ? `${comments[post.id].length} commentaire${comments[post.id].length > 1 ? "s" : ""}`
                            : "Aucun commentaire"}
                        </span>
                      </button>

                      {expandedComments[post.id] && (
                        <div className="mt-3 space-y-2">
                          {(comments[post.id] || []).map((c) => (
                            <div key={c.id} className="text-xs bg-white/5 rounded-lg p-2.5">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground">{c.user.name || c.user.email.split("@")[0]}</span>
                                <span className="text-muted-foreground/60">{new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                              <p className="text-muted-foreground">{c.text}</p>
                            </div>
                          ))}

                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              value={commentText[post.id] || ""}
                              onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === "Enter") addComment(post.id); }}
                              placeholder="Ajouter un commentaire..."
                              className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                            />
                            <button
                              onClick={() => addComment(post.id)}
                              disabled={commentLoading === post.id || !commentText[post.id]?.trim()}
                              className="p-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50"
                            >
                              <Send size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                {activeTab === "pending" && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => handlePublish(post.id)}
                      disabled={publishLoading === post.id}
                      className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {publishLoading === post.id ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <Share2 size={18} />
                      )}
                      Publier maintenant
                    </button>

                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <div className="flex items-center gap-2 flex-1">
                        <Clock size={14} className="text-muted-foreground shrink-0" />
                        <input
                          type="datetime-local"
                          value={scheduleDate[post.id] || ""}
                          onChange={(e) => setScheduleDate((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
                      <button
                        onClick={() => handleSchedule(post.id)}
                        disabled={scheduleLoading === post.id || !scheduleDate[post.id]}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {scheduleLoading === post.id ? "…" : "Planifier"}
                      </button>
                    </div>

                    <ScheduleSuggestion
                      platform={post.platform.toLowerCase()}
                      excludeId={post.id}
                      onSchedule={async (date, time) => {
                        setScheduleLoading(post.id);
                        try {
                          await fetch(`/api/posts/${post.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ scheduledAt: `${date}T${time}:00.000Z`, status: "SCHEDULED" }),
                          });
                          setPosts((prev) => prev.filter((p) => p.id !== post.id));
                        } catch {
                          setError("Erreur lors de la planification");
                        } finally {
                          setScheduleLoading(null);
                        }
                      }}
                    />

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(post.id, "REJECTED")}
                        disabled={actionLoading === post.id}
                        className="flex-1 py-2.5 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {actionLoading === post.id ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-4 h-4 border-2 border-destructive/30 border-t-destructive rounded-full"
                          />
                        ) : (
                          <XCircle size={18} />
                        )}
                        Rejeter
                      </button>
                      <button
                        onClick={() => handleAction(post.id, "APPROVED")}
                        disabled={actionLoading === post.id}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-xl font-medium text-sm transition-transform transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {actionLoading === post.id ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          />
                        ) : (
                          <CheckCircle size={18} />
                        )}
                        Approuver
                      </button>
                    </div>
                  </div>
                )}

                {activeTab !== "pending" && (
                  <div className="mt-6 space-y-3">
                    <button
                      onClick={() => handlePublish(post.id)}
                      disabled={publishLoading === post.id}
                      className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {publishLoading === post.id ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                      ) : (
                        <Share2 size={18} />
                      )}
                      Publier maintenant
                    </button>
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <div className="flex items-center gap-2 flex-1">
                        <Clock size={14} className="text-muted-foreground shrink-0" />
                        <input
                          type="datetime-local"
                          value={scheduleDate[post.id] || ""}
                          onChange={(e) => setScheduleDate((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          className="flex-1 p-2 bg-white/5 border border-white/10 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      </div>
                      <button
                        onClick={() => handleSchedule(post.id)}
                        disabled={scheduleLoading === post.id || !scheduleDate[post.id]}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        {scheduleLoading === post.id ? "…" : "Planifier"}
                      </button>
                    </div>

                    <ScheduleSuggestion
                      platform={post.platform.toLowerCase()}
                      excludeId={post.id}
                      onSchedule={async (date, time) => {
                        setScheduleLoading(post.id);
                        try {
                          await fetch(`/api/posts/${post.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ scheduledAt: `${date}T${time}:00.000Z`, status: "SCHEDULED" }),
                          });
                          setPosts((prev) => prev.filter((p) => p.id !== post.id));
                        } catch {
                          setError("Erreur lors de la planification");
                        } finally {
                          setScheduleLoading(null);
                        }
                      }}
                    />
                  </div>
                )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
