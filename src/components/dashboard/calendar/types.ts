export type CalendarViewMode = "month" | "week" | "day"

export interface CalendarFilters {
  channels: string[]
  statuses: string[]
  campaignId: string | null
  search: string
}

export interface CalendarContentItem {
  id: string
  title: string
  channel: string
  status: "draft" | "scheduled" | "published"
  campaignId: string | null
  campaignColor: string | null
  scheduledDate: string
  summary: string
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  items: CalendarContentItem[]
}
