"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import PostCard from "./PostCard";
import type { CalendarPost, DayData } from "./types";

interface WeekViewProps {
  days: DayData[];
  currentDate: Date;
  onPostClick: (post: CalendarPost) => void;
}

function WeekDayColumn({ day, onPostClick }: { day: DayData; onPostClick: (post: CalendarPost) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day.dateStr}` });

  const now = new Date();
  const isToday =
    day.isCurrentMonth &&
    now.getFullYear() === now.getFullYear() &&
    now.getMonth() === now.getMonth() &&
    now.getDate() === day.date;

  const sortedPosts = [...day.posts].sort((a, b) => {
    if (!a.scheduledAt) return 1;
    if (!b.scheduledAt) return -1;
    return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-0 border-r border-white/[0.03] last:border-0 transition-colors ${
        isOver ? "bg-primary/[0.08] ring-2 ring-inset ring-primary/20" : ""
      }`}
    >
      {/* Day header */}
      <div className={`p-3 text-center border-b border-white/[0.04] ${isToday ? "bg-primary/[0.06]" : "bg-white/[0.015]"}`}>
        <p className="text-xs text-muted-foreground">
          {new Date(day.dateStr).toLocaleDateString("fr-FR", { weekday: "short" })}
        </p>
        <p className={`text-lg font-bold mt-0.5 ${isToday ? "text-primary" : ""}`}>
          {day.date}
        </p>
      </div>

      {/* Posts */}
      <div className="p-2 space-y-1.5 min-h-[200px]">
        {sortedPosts.map((post) => {
          const time = post.scheduledAt
            ? new Date(post.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
            : "";
          return (
            <div key={post.id}>
              {time && <p className="text-[10px] text-muted-foreground mb-0.5 pl-1">{time}</p>}
              <PostCard post={post} onClick={() => onPostClick(post)} />
            </div>
          );
        })}
        {sortedPosts.length === 0 && (
          <div className="h-full min-h-[120px] flex items-center justify-center text-muted-foreground/40 text-xs">
            —
          </div>
        )}
      </div>
    </div>
  );
}

export default function WeekView({ days, currentDate, onPostClick }: WeekViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const weekStart = new Date(year, month, 1 - startDay);
  const weekDays: DayData[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dayPosts = days.find((dd) => dd.dateStr === dateStr)?.posts || [];
    weekDays.push({
      date: d.getDate(),
      isCurrentMonth: d.getMonth() === month,
      posts: dayPosts,
      dateStr,
    });
  }

  return (
    <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border border-white/10">
      <div className="flex-1 flex">
        {weekDays.map((day, i) => (
          <WeekDayColumn key={i} day={day} onPostClick={onPostClick} />
        ))}
      </div>
    </div>
  );
}
