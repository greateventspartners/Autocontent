"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FolderOpen, Plus, Pencil, Trash2, X, AlertCircle, FileText, Loader2, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Campaign = {
  id: string;
  title: string;
  description: string | null;
  colorCode: string | null;
  createdAt: string;
  _count: { contents: number };
};

type CampaignDetail = Campaign & {
  contents: {
    id: string;
    sourceIdea: string;
    status: string;
    createdAt: string;
    _count: { posts: number };
  }[];
};

const PRESET_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4"];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formColor, setFormColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      const data = (await res.json()) as { error?: string; campaigns?: Campaign[] };
      if (!res.ok) throw new Error(data.error || "Erreur de chargement");
      setCampaigns(data.campaigns ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const openCreate = () => {
    setEditing(null);
    setFormTitle("");
    setFormDesc("");
    setFormColor(PRESET_COLORS[0]);
    setShowCreate(true);
  };

  const openEdit = (c: Campaign) => {
    setEditing(c);
    setFormTitle(c.title);
    setFormDesc(c.description || "");
    setFormColor(c.colorCode || PRESET_COLORS[0]);
    setShowCreate(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editing ? `/api/campaigns/${editing.id}` : "/api/campaigns";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: formTitle, description: formDesc, colorCode: formColor }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Erreur");
      setShowCreate(false);
      fetchCampaigns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur de suppression");
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      if (detail?.id === id) setDetail(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setDeleting(null);
    }
  };

  const openDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      const data = (await res.json()) as { campaign?: CampaignDetail };
      if (data.campaign) setDetail(data.campaign);
    } catch { /* ignore */ }
  };

  const statusLabels: Record<string, string> = {
    DRAFT: "Brouillon",
    PENDING_APPROVAL: "En attente",
    APPROVED: "Approuvé",
    REJECTED: "Rejeté",
    SCHEDULED: "Planifié",
    PUBLISHED: "Publié",
    FAILED: "Échec",
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderOpen className="text-primary" size={28} />
            Campagnes
          </h2>
          <p className="text-muted-foreground mt-1">Organisez vos contenus par campagne et suivez leur progression.</p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 font-medium text-sm flex items-center gap-2 transition-transform active:scale-95"
        >
          <Plus size={16} />
          Nouvelle campagne
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Aucune campagne</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Créez votre première campagne pour organiser vos contenus.</p>
          <button onClick={openCreate} className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors">
            + Créer une campagne
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-5 flex items-center gap-4 group hover:border-primary/20 transition-colors cursor-pointer"
              onClick={() => openDetail(c.id)}
            >
              <div
                className="w-4 h-10 rounded-full shrink-0"
                style={{ backgroundColor: c.colorCode || "#6366f1" }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">{c.title}</h3>
                {c.description && (
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{c.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground/70">
                  <span className="flex items-center gap-1"><FileText size={12} /> {c._count.contents} contenu{c._count.contents !== 1 ? "s" : ""}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(c.createdAt).toLocaleDateString("fr-FR")}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openEdit(c)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  disabled={deleting === c.id}
                  className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {detail && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-8 rounded-full" style={{ backgroundColor: detail.colorCode || "#6366f1" }} />
              <div>
                <h3 className="text-lg font-bold">{detail.title}</h3>
                {detail.description && <p className="text-sm text-muted-foreground">{detail.description}</p>}
              </div>
            </div>
            <button onClick={() => setDetail(null)} className="text-muted-foreground hover:text-foreground p-1">
              <X size={18} />
            </button>
          </div>

          {detail.contents.length === 0 ? (
            <p className="text-sm text-muted-foreground/70 py-4 text-center">Aucun contenu dans cette campagne.</p>
          ) : (
            <div className="space-y-2">
              {detail.contents.map((content) => (
                <div key={content.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <FileText size={16} className="text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{content.sourceIdea}</p>
                    <p className="text-xs text-muted-foreground/70">{content._count.posts} post{content._count.posts !== 1 ? "s" : ""}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${content.status === "PUBLISHED" ? "bg-emerald-500/20 text-emerald-400" : content.status === "SCHEDULED" ? "bg-blue-500/20 text-blue-400" : content.status === "PENDING_APPROVAL" ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 text-muted-foreground"}`}>
                    {statusLabels[content.status] || content.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl p-6 w-full max-w-md space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{editing ? "Modifier la campagne" : "Nouvelle campagne"}</h3>
                <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Titre</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Lancement produit Q3"
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Optionnel..."
                    className="w-full h-20 p-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Couleur</label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormColor(color)}
                        className={`w-8 h-8 rounded-full transition-transform ${formColor === color ? "ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110" : "hover:scale-110"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !formTitle.trim()}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    {editing ? "Enregistrer" : "Créer"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
