"use client"

import { ChevronLeft, ChevronRight, CalendarDays, RotateCcw } from "lucide-react"
import { PlatformIcon, getChannelLabel } from "@/components/PlatformIcon"
import type { CalendarViewMode, CalendarFilters } from "./types"

const ALL_CHANNELS = ["LINKEDIN", "INSTAGRAM", "FACEBOOK", "X", "PINTEREST", "WORDPRESS", "TIKTOK", "MEDIUM"]
const ALL_STATUSES = ["draft", "scheduled", "published"]

interface CalendarToolbarProps {
  currentDate: Date
  viewMode: CalendarViewMode
  filters: CalendarFilters
  campaigns: { id: string; name: string; color: string }[]
  onChangeDate: (date: Date) => void
  onChangeView: (mode: CalendarViewMode) => void
  onChangeFilters: (filters: CalendarFilters) => void
}

function formatTitle(date: Date, viewMode: CalendarViewMode): string {
  const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
  if (viewMode === "month") {
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  }
  const dayOfWeek = date.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(date)
  monday.setDate(date.getDate() + mondayOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return `${monday.getDate()} ${months[monday.getMonth()]} — ${sunday.getDate()} ${months[sunday.getMonth()]} ${sunday.getFullYear()}`
}

function addMonths(date: Date, n: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + n)
  return d
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n * 7)
  return d
}

export default function CalendarToolbar({
  currentDate,
  viewMode,
  filters,
  campaigns,
  onChangeDate,
  onChangeView,
  onChangeFilters,
}: CalendarToolbarProps) {
  const handlePrev = () => {
    onChangeDate(viewMode === "month" ? addMonths(currentDate, -1) : addWeeks(currentDate, -1))
  }
  const handleNext = () => {
    onChangeDate(viewMode === "month" ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))
  }
  const handleToday = () => onChangeDate(new Date())

  const toggleChannel = (ch: string) => {
    const next = filters.channels.includes(ch)
      ? filters.channels.filter((c) => c !== ch)
      : [...filters.channels, ch]
    onChangeFilters({ ...filters, channels: next })
  }

  const toggleStatus = (s: string) => {
    const next = filters.statuses.includes(s)
      ? filters.statuses.filter((st) => st !== s)
      : [...filters.statuses, s]
    onChangeFilters({ ...filters, statuses: next })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm sm:text-base font-bold text-white min-w-[180px] text-center select-none">
            {formatTitle(currentDate, viewMode)}
          </h3>
          <button
            type="button"
            onClick={handleNext}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="ml-2 flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            Aujourd&apos;hui
          </button>
        </div>

        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          {(["month", "week", "day"] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChangeView(mode)}
              className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition cursor-pointer ${
                viewMode === mode
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              {mode === "month" ? "Mois" : mode === "week" ? "Semaine" : "Jour"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider mr-1">
          Canaux :
        </span>
        {ALL_CHANNELS.map((ch) => (
          <button
            key={ch}
            type="button"
            onClick={() => toggleChannel(ch)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-medium transition cursor-pointer ${
              filters.channels.includes(ch)
                ? "border-primary/40 bg-primary/10 text-white"
                : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <PlatformIcon channel={ch} className="h-3 w-3" />
            {getChannelLabel(ch)}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider mr-1">
          Statut :
        </span>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggleStatus(s)}
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium transition cursor-pointer ${
              filters.statuses.includes(s)
                ? s === "published"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : s === "scheduled"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-zinc-600/40 bg-zinc-800/60 text-zinc-300"
                : "border-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {s === "draft" ? "Brouillon" : s === "scheduled" ? "Programmé" : "Publié"}
          </button>
        ))}
        {campaigns.length > 0 && (
          <>
            <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-wider ml-2 mr-1">
              Campagne :
            </span>
            <select
              value={filters.campaignId ?? ""}
              onChange={(e) => onChangeFilters({ ...filters, campaignId: e.target.value || null })}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-[10px] text-zinc-300 focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">Toutes</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </>
        )}
      </div>
    </div>
  )
}
