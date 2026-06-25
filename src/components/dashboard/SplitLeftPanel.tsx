"use client"

import { Sparkles, FileText, Layers } from "lucide-react"
import ChannelCard from "./editor/ChannelCard"
import type { ChannelEntry } from "./editor/types"

interface SplitLeftPanelProps {
  prompt: string
  sourceText: string
  generationType: "multi" | "repurpose" | "single"
  channels: ChannelEntry[]
  activeChannel: string
  isGenerating: boolean
  generationStep: number
  pipelineSteps: string[]
  onChangePrompt: (val: string) => void
  onChangeSource: (val: string) => void
  onChangeChannel: (entry: ChannelEntry) => void
  onActivateChannel: (channel: string) => void
  onGenerate: () => void
}

export default function SplitLeftPanel({
  prompt,
  sourceText,
  generationType,
  channels,
  activeChannel,
  isGenerating,
  generationStep,
  pipelineSteps,
  onChangePrompt,
  onChangeSource,
  onChangeChannel,
  onActivateChannel,
  onGenerate,
}: SplitLeftPanelProps) {
  return (
    <div className="space-y-4">
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Assistant IA
        </h3>

        {generationType === "multi" && (
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
              Sujet / Idée
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => onChangePrompt(e.target.value)}
              placeholder="Ex: Les tendances IA dans le marketing en 2026..."
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary placeholder:text-zinc-600"
            />
          </div>
        )}

        {generationType === "repurpose" && (
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
              Texte source (article, webinaire, événement...)
            </label>
            <textarea
              rows={6}
              value={sourceText}
              onChange={(e) => onChangeSource(e.target.value)}
              placeholder="Collez votre contenu long à recycler en micro-contenus..."
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary resize-none placeholder:text-zinc-600"
            />
          </div>
        )}

        <button
          type="button"
          disabled={isGenerating || (!prompt.trim() && !sourceText.trim())}
          onClick={onGenerate}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-opacity-90 disabled:opacity-40 text-white py-2.5 text-xs font-semibold transition cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {generationType === "repurpose" ? "Recycler le contenu" : "Générer les posts"}
        </button>
      </div>

      {isGenerating && (
        <div className="glass-panel p-5 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Pipeline IA en cours...
          </div>
          <div className="space-y-2 pl-4 border-l border-zinc-800">
            {pipelineSteps.map((step, idx) => (
              <div
                key={idx}
                className={`text-[10px] flex items-center gap-2 transition ${
                  idx === generationStep
                    ? "text-white font-medium"
                    : idx < generationStep
                    ? "text-zinc-500"
                    : "text-zinc-700"
                }`}
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full ${
                    idx === generationStep
                      ? "bg-primary"
                      : idx < generationStep
                      ? "bg-green-500"
                      : "bg-zinc-800"
                  }`}
                />
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {channels.length > 0 && !isGenerating && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            <Layers className="h-3.5 w-3.5 text-primary" />
            Contenu généré ({channels.length} canaux)
          </div>
          <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1 scrollbar-none">
            {channels.map((entry) => (
              <ChannelCard
                key={entry.channel}
                entry={entry}
                isActive={entry.channel === activeChannel}
                onChange={onChangeChannel}
                onActivate={() => onActivateChannel(entry.channel)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
