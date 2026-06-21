"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Check,
  RefreshCw,
  Clock,
  Calendar as CalendarIcon,
} from "lucide-react";
import { topicApi, TopicSuggestionEntry } from "@/lib/services/pulseforge-service";

interface TopicsSpaceProps {
  brandKitId: string;
}

export default function TopicsSpace({ brandKitId }: TopicsSpaceProps) {
  const [topics, setTopics] = useState<TopicSuggestionEntry[]>([]);
  const [counts, setCounts] = useState({ pending: 0, validated: 0, used: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<"all" | "PENDING" | "VALIDATED" | "USED">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await topicApi.list(brandKitId);
        if (!cancelled) {
          setTopics(res.topics);
          setCounts(res.counts);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [brandKitId]);

  const refresh = async () => {
    try {
      const res = await topicApi.list(brandKitId);
      setTopics(res.topics);
      setCounts(res.counts);
    } catch {}
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await topicApi.generate(brandKitId);
      await refresh();
    } catch {
      alert("Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  };

  const handleValidate = async (id: string) => {
    await topicApi.updateStatus(id, "VALIDATED");
    await refresh();
  };

  const handleBatchValidate = async () => {
    for (const id of selectedIds) {
      await topicApi.updateStatus(id, "VALIDATED");
    }
    setSelectedIds(new Set());
    await refresh();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered =
    filter === "all" ? topics : topics.filter((t) => t.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Calendrier Éditorial
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Suggestions de titres générées par IA selon votre marque
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          {generating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Générer 30 sujets
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl text-center">
          <p className="text-2xl font-bold text-white">{counts.pending}</p>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mt-1">
            En attente
          </p>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center">
          <p className="text-2xl font-bold text-emerald-400">{counts.validated}</p>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mt-1">
            Validés
          </p>
        </div>
        <div className="glass-panel p-4 rounded-2xl text-center">
          <p className="text-2xl font-bold text-primary">{counts.used}</p>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mt-1">
            Utilisés
          </p>
        </div>
      </div>

      {/* Filters + Batch */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          {(["all", "PENDING", "VALIDATED", "USED"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                filter === f
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              {f === "all"
                ? "Tous"
                : f === "PENDING"
                ? "En attente"
                : f === "VALIDATED"
                ? "Validés"
                : "Utilisés"}
            </button>
          ))}
        </div>

        {selectedIds.size > 0 && (
          <button
            type="button"
            onClick={handleBatchValidate}
            className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            Valider ({selectedIds.size})
          </button>
        )}
      </div>

      {/* Topics List */}
      {loading ? (
        <div className="text-center py-12 text-zinc-500 text-xs">
          Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 text-xs">
          {topics.length === 0
            ? "Aucun sujet. Cliquez sur « Générer 30 sujets » pour commencer."
            : "Aucun sujet dans cette catégorie."}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((topic) => (
            <div
              key={topic.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition ${
                topic.status === "VALIDATED"
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : topic.status === "USED"
                  ? "bg-zinc-950/20 border-zinc-800/40 opacity-60"
                  : "bg-zinc-950/20 border-zinc-900 hover:border-zinc-800"
              }`}
            >
              {/* Checkbox for batch */}
              {topic.status === "PENDING" && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(topic.id)}
                  onChange={() => toggleSelect(topic.id)}
                  className="h-4 w-4 rounded border-zinc-700 text-primary focus:ring-primary cursor-pointer"
                />
              )}

              {/* Status indicator */}
              <div className="flex-shrink-0">
                {topic.status === "PENDING" && (
                  <Clock className="h-4 w-4 text-zinc-500" />
                )}
                {topic.status === "VALIDATED" && (
                  <Check className="h-4 w-4 text-emerald-400" />
                )}
                {topic.status === "USED" && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>

              {/* Title */}
              <p className="flex-1 text-sm text-white min-w-0 truncate">
                {topic.title}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {topic.status === "PENDING" && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleValidate(topic.id)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      Valider
                    </button>
                  </>
                )}
                {topic.status === "VALIDATED" && (
                  <span className="text-[10px] text-zinc-600 font-mono">
                    {topic.validatedAt
                      ? new Date(topic.validatedAt).toLocaleDateString("fr-FR")
                      : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info banner */}
      {counts.validated === 0 && topics.length > 0 && (
        <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4 text-xs text-zinc-500 text-center">
          <p>
            Validez les sujets qui vous intéressent. Une fois le dernier sujet validé
            utilisé, l&apos;IA générera automatiquement 30 nouveaux sujets.
          </p>
        </div>
      )}
    </div>
  );
}
