"use client"

import { Clock, RefreshCw } from "lucide-react"
import { getChannelLabel } from "@/components/PlatformIcon"
import type { BestTimeSuggestion } from "@/lib/services/pulseforge-service"

interface BestTimePanelProps {
  suggestions: Record<string, BestTimeSuggestion[]> | null
  loading: boolean
  onLoad: () => void
}

export default function BestTimePanel({ suggestions, loading, onLoad }: BestTimePanelProps) {
  if (!suggestions && !loading) {
    return (
      <button
        type="button"
        onClick={onLoad}
        className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-white transition px-2.5 py-1.5 rounded-lg border border-zinc-800/60 hover:border-zinc-700 cursor-pointer"
      >
        <Clock className="h-3 w-3" />
        Meilleur moment
      </button>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
        <RefreshCw className="h-3 w-3 animate-spin" />
        Analyse...
      </div>
    )
  }

  if (!suggestions) return null

  const channelKeys = Object.keys(suggestions).filter((k) => k !== "all")
  if (channelKeys.length === 0) return null

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-1.5 text-[11px] text-primary hover:text-opacity-80 px-2.5 py-1.5 rounded-lg border border-primary/30 cursor-pointer"
      >
        <Clock className="h-3 w-3" />
        {channelKeys.length} canaux optimisés
      </button>
      <div className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition pointer-events-auto z-30">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">
          Meilleurs moments de publication
        </p>
        <div className="space-y-3">
          {channelKeys.map((ch) => {
            const days = suggestions[ch]
            return (
              <div key={ch}>
                <p className="text-[11px] font-semibold text-white uppercase mb-1">
                  {getChannelLabel(ch)}
                </p>
                <div className="space-y-0.5">
                  {days.slice(0, 3).map((d) => (
                    <div key={d.dayOfWeek} className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400">{d.dayOfWeek}</span>
                      <span className="text-zinc-300 font-mono font-medium">
                        {d.hour.toString().padStart(2, "0")}:00
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
