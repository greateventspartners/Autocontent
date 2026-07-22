"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import PostCard from "./PostCard";
import type { CalendarPost, DayData } from "./types";

interface MonthViewProps {
  days: DayData[];
  onPostClick: (post: CalendarPost) => void;
}

function DayCell({ day, onPostClick }: { day: DayData; onPostClick: (post: CalendarPost) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day.dateStr}` });

  const now = new Date();
  const isToday =
    now.getFullYear() === now.getFullYear() &&
    now.getMonth() === now.getMonth() &&
    now.getDate() === day.date &&
    day.isCurrentMonth;

  return (
    <div
      ref={setNodeRef}
      className={`p-1.5 md:p-2 border-r border-b border-white/[0.03] transition-colors min-h-[80px] md:min-h-[100px] ${
        isOver ? "bg-primary/[0.08] ring-2 ring-inset ring-primary/20" : "hover:bg-white/[0.02]"
      } ${!day.isCurrentMonth ? "opacity-30" : ""} ${isToday ? "bg-primary/[0.04]" : ""}`}
    >
      <span
        className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
          isToday ? "bg-primary text-white shadow-md shadow-primary/30" : "text-foreground"
        }`}
      >
        {day.date}
      </span>
      <div className="space-y-0.5">
        {day.posts.slice(0, 3).map((post) => (
          <PostCard key={post.id} post={post} compact onClick={() => onPostClick(post)} />
        ))}
        {day.posts.length > 3 && (
          <span className="text-[9px] text-muted-foreground pl-1">+{day.posts.length - 3}</span>
        )}
      </div>
    </div>
  );
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function MonthView({ days, onPostClick }: MonthViewProps) {
  return (
    <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border border-white/10">
      {/* Week headers */}
      <div className="grid grid-cols-7 border-b border-white/[0.04] bg-white/[0.015]">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-3 text-center text-xs font-medium text-muted-foreground border-r border-white/[0.04] last:border-0">
            <span className="hidden md:inline">{day}</span>
            <span className="md:hidden">{day.slice(0, 2)}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {days.slice(0, 42).map((day, idx) => (
          <DayCell key={idx} day={day} onPostClick={onPostClick} />
        ))}
      </div>
    </div>
  );
}
