"use client"

import ContentChip from "./ContentChip"
import type { CalendarDay, CalendarContentItem } from "./types"

interface DayCellProps {
  day: CalendarDay
  onDrop: (itemId: string, date: Date) => void
  onItemClick: (item: CalendarContentItem) => void
}

export default function DayCell({ day, onDrop, onItemClick }: DayCellProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const itemId = e.dataTransfer.getData("text/plain")
    if (itemId) onDrop(itemId, day.date)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        relative min-h-[90px] sm:min-h-[110px] rounded-xl border p-1.5 sm:p-2
        flex flex-col gap-1 transition-all duration-200
        ${day.isToday ? "border-primary/50 bg-primary/[0.03]" : day.isCurrentMonth ? "border-zinc-800/80 bg-zinc-950/20" : "border-zinc-900/60 bg-zinc-950/10"}
        ${day.isCurrentMonth ? "hover:border-zinc-700/80" : ""}
      `}
    >
      <div className="flex items-center justify-between">
        <span
          className={`
            text-[10px] sm:text-xs font-mono font-semibold leading-none
            ${day.isToday ? "text-primary" : day.isCurrentMonth ? "text-zinc-400" : "text-zinc-700"}
          `}
        >
          {day.date.getDate()}
        </span>
        {day.items.length > 0 && (
          <span className="text-[9px] text-zinc-600 font-mono px-1">
            {day.items.length}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-0.5 overflow-y-auto scrollbar-none">
        {day.items.slice(0, 4).map((item) => (
          <ContentChip key={item.id} item={item} onClick={onItemClick} />
        ))}
        {day.items.length > 4 && (
          <div className="text-[9px] text-zinc-500 text-center font-mono pt-0.5">
            +{day.items.length - 4}
          </div>
        )}
      </div>
    </div>
  )
}
