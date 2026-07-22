"use client";

import React, { useState } from "react";
import { Sparkles, Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Suggestion {
  date: string;
  time: string;
  label: string;
  reason?: string;
}

interface ScheduleSuggestionProps {
  platform: string;
  excludeId?: string;
  onSchedule: (date: string, time: string) => void;
}

export default function ScheduleSuggestion({ platform, excludeId, onSchedule }: ScheduleSuggestionProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ suggested: Suggestion; alternatives: Suggestion[] } | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [error, setError] = useState("");

  const fetchSuggestion = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ platform });
      if (excludeId) params.set("excludeId", excludeId);
      const res = await fetch(`/api/posts/suggest-time?${params}`);
      if (!res.ok) throw new Error("Erreur lors de la suggestion");
      const data = (await res.json()) as { suggested: Suggestion; alternatives: Suggestion[] };
      setResult(data);
      setSelected(`${data.suggested.date}T${data.suggested.time}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!selected) return;
    const [date, time] = selected.split("T");
    onSchedule(date, time);
  };

  const allSlots = result
    ? [result.suggested, ...result.alternatives]
    : [];

  return (
    <div className="space-y-2">
      {!result && (
        <button
          onClick={fetchSuggestion}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 text-primary text-xs font-medium hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          <Sparkles size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Recherche du meilleur créneau..." : "Suggérer un créneau"}
        </button>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-primary/[0.04] border border-primary/10 space-y-2.5">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-primary" />
                <p className="text-xs font-bold text-primary">Suggestion IA</p>
              </div>

              {result.suggested.reason && (
                <p className="text-[11px] text-muted-foreground">{result.suggested.reason}</p>
              )}

              <div className="space-y-1.5">
                {allSlots.map((slot, i) => {
                  const key = `${slot.date}T${slot.time}`;
                  const isSelected = selected === key;
                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="schedule-suggestion"
                        value={key}
                        checked={isSelected}
                        onChange={() => setSelected(key)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                      }`}>
                        {isSelected && <Check size={10} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium">{slot.label}</span>
                      {i === 0 && (
                        <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary">
                          TOP
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <button
                onClick={handleApply}
                disabled={!selected}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white text-xs font-medium hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
              >
                Planifier ce créneau
                <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
