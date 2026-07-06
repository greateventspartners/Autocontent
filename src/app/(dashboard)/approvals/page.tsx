"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, XCircle, MessageSquare, Link as LinkIcon, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ApprovalPost = {
  id: string;
  sourceIdea: string;
  platform: string;
  body: string;
  status: string;
  scheduledAt: string | null;
  campaignTitle: string;
};

type Tab = "pending" | "approved" | "rejected";

export default function ApprovalsPage() {
  const [posts, setPosts] = useState<ApprovalPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
          campaignTitle: (p as any).content?.campaign?.title || "",
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
      rejected: "DRAFT",
    };
    fetchPosts(statusMap[activeTab]);
  }, [activeTab]);

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
        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm flex items-center gap-2 transition-colors">
          <LinkIcon size={16} /> Générer Lien Client
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-4 border-b border-white/10 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`font-medium pb-4 -mb-4 px-2 transition-colors ${
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
                        <p className="font-bold text-sm">Autopilot App</p>
                        <p className="text-xs text-gray-500">{post.campaignTitle || "Campagne"}</p>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm mb-3">{post.body || "Aucun contenu généré."}</p>
                  </div>
                </div>

                <div className="w-full md:w-1/3 p-6 flex flex-col bg-white/[0.02]">
                  <h4 className="font-bold text-lg mb-1">{post.sourceIdea}</h4>
                  <p className="text-sm text-muted-foreground mb-6">Créé par IA Copilot</p>

                  <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-black/20 p-4 rounded-xl text-sm text-muted-foreground italic flex items-center gap-2 border border-white/5">
                      <MessageSquare size={16} />
                      Aucun commentaire pour le moment.
                    </div>
                    <button className="text-sm text-primary font-medium text-left hover:underline">
                      + Ajouter un commentaire
                    </button>
                  </div>

                  {activeTab === "pending" && (
                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={() => handleAction(post.id, "DRAFT")}
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
