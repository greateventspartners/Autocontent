"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, XCircle, MessageSquare, Send, Clock, AlertCircle, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Post = {
  id: string;
  platform: string;
  body: string;
  status: string;
  sourceIdea: string;
  scheduledAt: string | null;
  comments: { text: string; author: string; createdAt: string }[];
};

type PortalData = {
  workspaceName: string;
  clientName: string;
  posts: Post[];
};

const PLATFORM_BADGES: Record<string, { label: string; color: string }> = {
  linkedin: { label: "LinkedIn", color: "bg-blue-500/10 text-blue-600" },
  twitter: { label: "X", color: "bg-sky-500/10 text-sky-600" },
  instagram: { label: "Instagram", color: "bg-pink-500/10 text-pink-600" },
  facebook: { label: "Facebook", color: "bg-blue-600/10 text-blue-700" },
  tiktok: { label: "TikTok", color: "bg-gray-800/10 text-gray-800" },
  pinterest: { label: "Pinterest", color: "bg-red-500/10 text-red-600" },
  wordpress: { label: "WordPress", color: "bg-blue-400/10 text-blue-500" },
  medium: { label: "Medium", color: "bg-gray-700/10 text-gray-700" },
};

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  PENDING_APPROVAL: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", label: "En attente" },
  APPROVED: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", label: "Approuvé" },
  REJECTED: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", label: "Rejeté" },
};

export default function ClientPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/client/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Lien invalide ou expiré");
        return r.json() as Promise<PortalData>;
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAction = async (postId: string, action: "approve" | "reject") => {
    setActionLoading(postId);
    try {
      const res = await fetch(`/api/client/${token}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          action,
          comment: commentText[postId] || undefined,
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'action");
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          posts: prev.posts.map((p) =>
            p.id === postId
              ? { ...p, status: action === "approve" ? "APPROVED" : "REJECTED" }
              : p
          ),
        };
      });
      setSuccessMsg(action === "approve" ? "Post approuvé !" : "Post rejeté.");
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError("Erreur lors de l'action");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-500 text-sm">{error || "Ce lien de validation n'existe pas ou a expiré."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{data.workspaceName}</h1>
              <p className="text-xs text-gray-500">Espace client — {data.clientName}</p>
            </div>
          </div>
          <span className="text-xs text-gray-400">{data.posts.length} post{data.posts.length > 1 ? "s" : ""}</span>
        </div>
      </header>

      {/* Success Toast */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-lg text-sm font-medium"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {data.posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-gray-500">Aucun contenu à valider pour le moment.</p>
          </div>
        ) : (
          data.posts.map((post) => {
            const badge = PLATFORM_BADGES[post.platform] || { label: post.platform, color: "bg-gray-100 text-gray-600" };
            const statusCfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.PENDING_APPROVAL;
            const StatusIcon = statusCfg.icon;
            const isPending = post.status === "PENDING_APPROVAL";

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${badge.color}`}>{badge.label}</span>
                      <span className="text-xs text-gray-400">{post.sourceIdea}</span>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                      <StatusIcon size={12} />
                      {statusCfg.label}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100">
                    {post.body}
                  </div>
                </div>

                {/* Comments */}
                {post.comments.length > 0 && (
                  <div className="px-5 pb-3 space-y-2">
                    {post.comments.map((c, i) => (
                      <div key={i} className="text-xs bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                        <span className="font-medium text-gray-700">{c.author}</span>
                        <span className="text-gray-400 ml-2">{new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span>
                        <p className="text-gray-600 mt-1">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {isPending && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentText[post.id] || ""}
                        onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Ajouter un commentaire..."
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(post.id, "reject")}
                        disabled={actionLoading === post.id}
                        className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={16} /> Rejeter
                      </button>
                      <button
                        onClick={() => handleAction(post.id, "approve")}
                        disabled={actionLoading === post.id}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle size={16} /> Approuver
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </main>

      <footer className="text-center py-6 text-xs text-gray-400">
        Propulsé par Autocontent
      </footer>
    </div>
  );
}
