"use client"

import { useState, useMemo, useCallback } from "react"
import { Calendar } from "lucide-react"
import MonthView from "./MonthView"
import WeekView from "./WeekView"
import CalendarToolbar from "./CalendarToolbar"
import BestTimePanel from "./BestTimePanel"
import type { CalendarViewMode, CalendarFilters, CalendarContentItem } from "./types"
import { Campaign, contentApi, analyticsApi, flattenContentItem, BestTimeSuggestion } from "@/lib/services/pulseforge-service"

interface CalendarViewProps {
  items: CalendarContentItem[]
  campaigns: Campaign[]
  onReschedule: (itemId: string, date: Date) => Promise<void>
  onItemClick: (item: CalendarContentItem) => void
}

export default function CalendarView({
  items,
  campaigns,
  onReschedule,
  onItemClick,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month")
  const [filters, setFilters] = useState<CalendarFilters>({
    channels: [],
    statuses: [],
    campaignId: null,
    search: "",
  })
  const [dragItemId, setDragItemId] = useState<string | null>(null)
  const [bestTimeSuggestions, setBestTimeSuggestions] = useState<Record<string, BestTimeSuggestion[]> | null>(null)
  const [bestTimeLoading, setBestTimeLoading] = useState(false)

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filters.channels.length > 0 && !filters.channels.includes(item.channel.toUpperCase())) return false
      if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) return false
      if (filters.campaignId && item.campaignId !== filters.campaignId) return false
      if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) return false
      return true
    })
  }, [items, filters])

  const handleDrop = useCallback(async (itemId: string, date: Date) => {
    setDragItemId(null)
    await onReschedule(itemId, date)
  }, [onReschedule])

  const handleLoadBestTime = async () => {
    try {
      setBestTimeLoading(true)
      const res = await analyticsApi.bestTime()
      setBestTimeSuggestions(res.suggestions)
    } catch {
      setBestTimeSuggestions(null)
    } finally {
      setBestTimeLoading(false)
    }
  }

  return (
    <div className="glass-panel p-4 sm:p-6 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Calendrier Éditorial
        </h3>
        <BestTimePanel
          suggestions={bestTimeSuggestions}
          loading={bestTimeLoading}
          onLoad={handleLoadBestTime}
        />
      </div>

      <CalendarToolbar
        currentDate={currentDate}
        viewMode={viewMode}
        filters={filters}
        campaigns={campaigns}
        onChangeDate={setCurrentDate}
        onChangeView={setViewMode}
        onChangeFilters={setFilters}
      />

      {filteredItems.length === 0 ? (
        <div className="text-center py-16 text-zinc-600 text-sm">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucun contenu à afficher</p>
          <p className="text-xs mt-1">Utilisez l&apos;assistant IA pour générer des publications ou ajustez vos filtres.</p>
        </div>
      ) : viewMode === "month" ? (
        <MonthView
          currentDate={currentDate}
          items={filteredItems}
          onDrop={handleDrop}
          onItemClick={onItemClick}
        />
      ) : (
        <WeekView
          currentDate={currentDate}
          items={filteredItems}
          onDrop={handleDrop}
          onItemClick={onItemClick}
        />
      )}
    </div>
  )
}
