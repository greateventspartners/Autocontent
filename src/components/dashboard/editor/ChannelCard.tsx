"use client"

import { PlatformIcon, getChannelLabel } from "@/components/PlatformIcon"
import type { ChannelEntry } from "./types"

interface ChannelCardProps {
  entry: ChannelEntry
  isActive: boolean
  onChange: (entry: ChannelEntry) => void
  onActivate: () => void
}

export default function ChannelCard({ entry, isActive, onChange, onActivate }: ChannelCardProps) {
  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        isActive
          ? "border-primary/50 bg-primary/[0.04] shadow-sm shadow-primary/5"
          : "border-zinc-800/70 bg-zinc-950/30 hover:border-zinc-700/70"
      }`}
    >
      <button
        type="button"
        onClick={onActivate}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 cursor-pointer"
      >
        <div className={`p-1.5 rounded-lg ${isActive ? "bg-primary/15" : "bg-zinc-900"}`}>
          <PlatformIcon channel={entry.channel} className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
        </div>
        <span className={`text-xs font-semibold ${isActive ? "text-white" : "text-zinc-400"}`}>
          {getChannelLabel(entry.channel)}
        </span>
        {isActive && <span className="ml-auto text-primary text-[9px] font-semibold uppercase">Actif</span>}
      </button>

      {isActive && (
        <div className="px-3 pb-3 space-y-2 animate-fade-in">
          <input
            type="text"
            value={entry.title}
            onChange={(e) => onChange({ ...entry, title: e.target.value })}
            placeholder="Titre du post"
            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-primary placeholder:text-zinc-600"
          />
          <textarea
            rows={5}
            value={entry.content}
            onChange={(e) => onChange({ ...entry, content: e.target.value })}
            placeholder="Contenu du post..."
            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 font-mono leading-relaxed focus:outline-none focus:border-primary resize-none placeholder:text-zinc-600"
          />
        </div>
      )}
    </div>
  )
}
