"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Key, Plus, Trash2, Copy, Eye, EyeOff, RefreshCw, CheckCircle } from "lucide-react";
import { apiKeysApi, ApiKeyEntry } from "@/lib/services/pulseforge-service";

export default function ApiKeysSpace() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newKeyRevealed, setNewKeyRevealed] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiKeysApi.list();
      setKeys(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  const handleCreate = async () => {
    if (!newLabel.trim()) return;
    setCreating(true);
    try {
      const created = await apiKeysApi.create(newLabel.trim());
      setNewKeyRevealed(created.key);
      setKeys(prev => [created, ...prev]);
      setNewLabel("");
    } catch {
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiKeysApi.delete(id);
      setKeys(prev => prev.filter(k => k.id !== id));
    } catch {
    }
  };

  const handleCopy = async (key: string, id: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.slice(0, 4) + "••••••••" + key.slice(-4);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Clés API</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Gérez vos clés d'API pour l'accès programmatique à Autocontent.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchKeys}
          disabled={loading}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
          title="Rafraîchir"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {newKeyRevealed && (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-400">Clé API créée avec succès</p>
              <p className="text-xs text-zinc-400">
                Copiez cette clé maintenant. Elle ne sera plus jamais affichée.
              </p>
              <div className="flex items-center gap-2 bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                <code className="text-xs text-white font-mono break-all flex-1">{newKeyRevealed}</code>
                <button
                  type="button"
                  onClick={() => handleCopy(newKeyRevealed, "new")}
                  className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  {copiedId === "new" ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass-panel p-12 rounded-2xl flex items-center justify-center">
          <div className="flex items-center gap-3 text-zinc-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span className="text-sm">Chargement...</span>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            <div className="flex-1">
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                placeholder="Nom de la clé (ex: CI/CD, API script)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition"
              />
            </div>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating || !newLabel.trim()}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {creating ? "Création..." : "Créer une clé"}
            </button>
          </div>

          {keys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">Aucune clé API. Créez-en une pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map(entry => (
                <div key={entry.id} className="flex items-center gap-4 bg-zinc-950/40 border border-zinc-800/80 rounded-xl p-4">
                  <Key className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{entry.label}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-zinc-400 font-mono">
                        {visibleKeys.has(entry.id) ? entry.key : maskKey(entry.key)}
                      </code>
                      <button
                        type="button"
                        onClick={() => toggleVisibility(entry.id)}
                        className="p-0.5 rounded hover:text-white text-zinc-500 transition cursor-pointer"
                      >
                        {visibleKeys.has(entry.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      Créée le {new Date(entry.createdAt).toLocaleDateString("fr-FR")}
                      {entry.lastUsedAt && ` · Dernière utilisation: ${new Date(entry.lastUsedAt).toLocaleDateString("fr-FR")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(entry.key, entry.id)}
                      className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                      title="Copier la clé"
                    >
                      {copiedId === entry.id ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                      title="Supprimer la clé"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
