"use client"

import { PlatformIcon, getChannelLabel } from "@/components/PlatformIcon"
import type { ChannelEntry } from "./types"

interface ChannelTabsProps {
  channels: ChannelEntry[]
  activeChannel: string
  onSelect: (channel: string) => void
}

export default function ChannelTabs({ channels, activeChannel, onSelect }: ChannelTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 border-b border-zinc-800/80 pb-2 mb-4">
      {channels.map((entry) => {
        const isActive = entry.channel === activeChannel
        return (
          <button
            key={entry.channel}
            type="button"
            onClick={() => onSelect(entry.channel)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              isActive
                ? "bg-primary/15 text-white border border-primary/30"
                : "text-zinc-500 hover:text-zinc-300 border border-transparent hover:border-zinc-800"
            }`}
          >
            <PlatformIcon channel={entry.channel} className="h-3.5 w-3.5" />
            {getChannelLabel(entry.channel)}
          </button>
        )
      })}
    </div>
  )
}
