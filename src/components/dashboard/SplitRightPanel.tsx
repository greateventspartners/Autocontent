"use client"

import { Save, Eye, EyeOff } from "lucide-react"
import ChannelTabs from "./editor/ChannelTabs"
import PostPreview from "@/components/PostPreview"
import type { ChannelEntry } from "./editor/types"

interface SplitRightPanelProps {
  channels: ChannelEntry[]
  activeChannel: string
  onSelectChannel: (channel: string) => void
  showPreview: boolean
  onTogglePreview: () => void
  saving: boolean
  saved: boolean
  onSave: () => void
}

export default function SplitRightPanel({
  channels,
  activeChannel,
  onSelectChannel,
  showPreview,
  onTogglePreview,
  saving,
  saved,
  onSave,
}: SplitRightPanelProps) {
  const activeEntry = channels.find((c) => c.channel === activeChannel)

  if (channels.length === 0) {
    return (
      <div className="glass-panel p-10 rounded-2xl flex flex-col items-center justify-center h-full min-h-[400px]">
        <EyeOff className="h-12 w-12 text-zinc-700 mb-4" />
        <p className="text-sm text-zinc-500 text-center">
          Générez du contenu multi-canal pour voir l&apos;aperçu ici.
        </p>
        <p className="text-xs text-zinc-600 mt-1 text-center">
          Utilisez le panneau de gauche pour lancer une génération.
        </p>
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full min-h-[500px]">
      <div className="flex items-center justify-between px-5 pt-4 pb-0">
        <ChannelTabs
          channels={channels}
          activeChannel={activeChannel}
          onSelect={onSelectChannel}
        />
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onTogglePreview}
            className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-white px-2 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
          >
            {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showPreview ? "Masquer" : "Aperçu"}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-[10px] bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
          >
            <Save className="h-3 w-3" />
            {saved ? "✓" : saving ? "..." : "Sauver tout"}
          </button>
        </div>
      </div>

      <div className="flex-1 p-5 overflow-y-auto">
        {channels.map((entry) => (
          <div key={entry.channel} className={entry.channel !== activeChannel ? "hidden" : ""}>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-white">{entry.title}</h2>
            </div>

            {showPreview && (
              <div className="mb-6">
                <PostPreview
                  channel={entry.channel}
                  title={entry.title}
                  content={entry.content}
                />
              </div>
            )}

            <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl p-4">
              <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mb-2">
                Contenu brut
              </div>
              <pre className="text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap break-words">
                {entry.content}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
