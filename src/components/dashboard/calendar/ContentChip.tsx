"use client"

import { PlatformIcon, getChannelLabel } from "@/components/PlatformIcon"
import type { CalendarContentItem } from "./types"

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-zinc-700/60 text-zinc-300 border-zinc-600/40",
  scheduled: "bg-primary/20 text-primary border-primary/30",
  published: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
}

interface ContentChipProps {
  item: CalendarContentItem
  onClick: (item: CalendarContentItem) => void
}

export default function ContentChip({ item, onClick }: ContentChipProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", item.id)
    e.dataTransfer.effectAllowed = "move"
  }

  return (
    <button
      type="button"
      draggable
      onDragStart={handleDragStart}
      onClick={() => onClick(item)}
      className="w-full text-left group flex items-center gap-1.5 px-1.5 py-1 rounded-md border text-[10px] leading-tight transition-all duration-150 hover:shadow-md cursor-pointer"
      style={{
        borderColor: item.campaignColor ? `${item.campaignColor}40` : undefined,
        background: item.campaignColor ? `${item.campaignColor}10` : undefined,
      }}
      title={`${item.title} (${getChannelLabel(item.channel)})`}
    >
      <span className="shrink-0">
        <PlatformIcon channel={item.channel} className="h-3 w-3" />
      </span>
      <span className="truncate flex-1 font-medium text-[10px] text-zinc-200 group-hover:text-white transition-colors">
        {item.title}
      </span>
      <span className={`shrink-0 text-[8px] uppercase font-bold px-1 py-0.5 rounded border ${STATUS_STYLES[item.status] ?? STATUS_STYLES.draft}`}>
        {item.status === "draft" ? "Br" : item.status === "scheduled" ? "Pr" : "Pu"}
      </span>
    </button>
  )
}
