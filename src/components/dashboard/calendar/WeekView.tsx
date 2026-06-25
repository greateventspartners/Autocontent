"use client"

import { useMemo } from "react"
import DayCell from "./DayCell"
import type { CalendarDay, CalendarContentItem } from "./types"

interface WeekViewProps {
  currentDate: Date
  items: CalendarContentItem[]
  onDrop: (itemId: string, date: Date) => void
  onItemClick: (item: CalendarContentItem) => void
}

const DAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

function buildWeekDays(currentDate: Date, items: CalendarContentItem[]): CalendarDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayOfWeek = currentDate.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(currentDate)
  monday.setDate(currentDate.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)

  const days: CalendarDay[] = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    date.setHours(0, 0, 0, 0)

    const dayItems = items.filter((item) => {
      const d = new Date(item.scheduledDate)
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      )
    })

    days.push({
      date,
      isCurrentMonth: date.getMonth() === currentDate.getMonth(),
      isToday: date.getTime() === today.getTime(),
      items: dayItems,
    })
  }
  return days
}

export default function WeekView({ currentDate, items, onDrop, onItemClick }: WeekViewProps) {
  const days = useMemo(() => buildWeekDays(currentDate, items), [currentDate, items])

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day, i) => (
          <DayCell
            key={i}
            day={day}
            onDrop={onDrop}
            onItemClick={onItemClick}
          />
        ))}
      </div>
    </div>
  )
}
