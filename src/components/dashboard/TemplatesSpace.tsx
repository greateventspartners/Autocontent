"use client";

import React, { useState, useEffect } from "react";
import { FileText, Trash2, RefreshCw, Save, X } from "lucide-react";
import { templatesApi, ContentTemplateEntry } from "@/lib/services/pulseforge-service";
import { PlatformIcon, getChannelLabel } from "@/components/PlatformIcon";

const CHANNELS = ["FACEBOOK", "INSTAGRAM", "LINKEDIN", "PINTEREST", "X", "WORDPRESS", "SLACK", "WEBHOOK"];
const TYPES = ["SOCIAL", "BLOG", "EMAIL", "AD"];

interface TemplateForm {
  name: string;
  type: string;
  channel: string;
  prompt: string;
}

const EMPTY_FORM: TemplateForm = { name: "", type: "SOCIAL", channel: "LINKEDIN", prompt: "" };

export default function TemplatesSpace() {
  const [templates, setTemplates] = useState<ContentTemplateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await templatesApi.list();
        if (!cancelled) setTemplates(data);
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.prompt.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await templatesApi.update(editingId, form);
        setTemplates(prev => prev.map(t => t.id === editingId ? updated : t));
      } else {
        const created = await templatesApi.create(form);
        setTemplates(prev => [created, ...prev]);
      }
      setForm(EMPTY_FORM);
      setEditingId(null);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (t: ContentTemplateEntry) => {
    setEditingId(t.id);
    setForm({ name: t.name, type: t.type, channel: t.channel, prompt: t.prompt });
  };

  const handleDelete = async (id: string) => {
    try {
      await templatesApi.delete(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      if (editingId === id) { setEditingId(null); setForm(EMPTY_FORM); }
    } catch {
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Modèles de contenu</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Créez et gérez des modèles de prompt réutilisables pour la génération de contenu.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={loading}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            {editingId ? "Modifier le modèle" : "Nouveau modèle"}
          </h3>
          {editingId && (
            <button type="button" onClick={handleCancel} className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer">
              <X className="h-3 w-3" /> Annuler
            </button>
          )}
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Nom</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Post LinkedIn produit"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Canal</label>
              <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition">
                {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Prompt</label>
            <textarea value={form.prompt} onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
              placeholder="Décrivez le modèle de contenu..."
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition resize-none" />
          </div>
          <button type="button" onClick={handleSave} disabled={saving || !form.name.trim() || !form.prompt.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition cursor-pointer">
            <Save className="h-4 w-4" /> {saving ? "Enregistrement..." : editingId ? "Mettre à jour" : "Créer le modèle"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass-panel p-12 rounded-2xl flex items-center justify-center">
          <div className="flex items-center gap-3 text-zinc-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Aucun modèle. Créez-en un pour commencer.</p>
            </div>
          ) : (
            templates.map(t => (
              <div key={t.id} className="glass-panel p-5 rounded-2xl border border-zinc-800/80 hover:border-zinc-700/80 transition group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{t.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{t.type}</span>
                      <span className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                        <PlatformIcon channel={t.channel} className="h-3 w-3" />
                        {getChannelLabel(t.channel)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button type="button" onClick={() => handleEdit(t)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                      title="Modifier">
                      <FileText className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                      title="Supprimer">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-zinc-400 line-clamp-2">{t.prompt}</p>
                <p className="mt-2 text-[10px] text-zinc-600">
                  Mis à jour le {new Date(t.updatedAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
