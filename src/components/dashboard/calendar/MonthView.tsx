"use client"

import { useMemo } from "react"
import DayCell from "./DayCell"
import type { CalendarDay, CalendarContentItem } from "./types"

interface MonthViewProps {
  currentDate: Date
  items: CalendarContentItem[]
  onDrop: (itemId: string, date: Date) => void
  onItemClick: (item: CalendarContentItem) => void
}

const DAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

function buildMonthDays(currentDate: Date, items: CalendarContentItem[]): CalendarDay[][] {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay()
  const startOffset = startDay === 0 ? -6 : 1 - startDay

  const startDate = new Date(year, month, 1 + startOffset)
  startDate.setHours(0, 0, 0, 0)

  const weeks: CalendarDay[][] = []
  let currentWeek: CalendarDay[] = []

  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    date.setHours(0, 0, 0, 0)

    const dayItems = items.filter((item) => {
      const d = new Date(item.scheduledDate)
      return (
        d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear()
      )
    })

    const day: CalendarDay = {
      date,
      isCurrentMonth: date.getMonth() === month,
      isToday: date.getTime() === today.getTime(),
      items: dayItems,
    }

    currentWeek.push(day)

    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  return weeks
}

export default function MonthView({ currentDate, items, onDrop, onItemClick }: MonthViewProps) {
  const weeks = useMemo(() => buildMonthDays(currentDate, items), [currentDate, items])

  return (
    <div className="space-y-1 sm:space-y-2">
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 sm:mb-2">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="text-center text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1 sm:gap-2">
          {week.map((day, di) => (
            <DayCell
              key={`${wi}-${di}`}
              day={day}
              onDrop={onDrop}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
