"use client";

import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock } from "lucide-react";
import PostCard from "./PostCard";
import { PLATFORM_COLORS, PLATFORM_ICONS, type CalendarPost, type DayData } from "./types";

interface MonthViewProps {
  days: DayData[];
  onPostClick: (post: CalendarPost) => void;
}

function DayCell({
  day,
  onPostClick,
  onDayClick,
  selectedDate,
}: {
  day: DayData;
  onPostClick: (post: CalendarPost) => void;
  onDayClick: (dateStr: string) => void;
  selectedDate: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day.dateStr}` });

  const now = new Date();
  const isToday =
    day.isCurrentMonth &&
    now.getFullYear() === now.getFullYear() &&
    now.getMonth() === now.getMonth() &&
    now.getDate() === day.date;

  const isSelected = selectedDate === day.dateStr;
  const posts = day.posts;
  const postCount = posts.length;

  const uniquePlatforms = [...new Set(posts.map((p) => p.platform.toLowerCase()))];

  return (
    <div
      ref={setNodeRef}
      onClick={() => onDayClick(day.dateStr)}
      className={`p-1.5 md:p-2 border-r border-b border-white/[0.03] transition-all cursor-pointer min-h-[80px] md:min-h-[100px] ${
        isOver
          ? "bg-primary/[0.08] ring-2 ring-inset ring-primary/20"
          : isSelected
            ? "bg-primary/[0.06] ring-1 ring-inset ring-primary/15"
            : isToday
              ? "bg-primary/[0.04]"
              : "hover:bg-white/[0.02]"
      } ${!day.isCurrentMonth ? "opacity-30" : ""}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
            isToday
              ? "bg-primary text-white shadow-md shadow-primary/30"
              : "text-foreground"
          }`}
        >
          {day.date}
        </span>
        {postCount > 0 && (
          <span className="text-[9px] font-bold text-muted-foreground bg-white/[0.06] px-1.5 py-0.5 rounded-full">
            {postCount}
          </span>
        )}
      </div>

      {/* Platform badges */}
      {uniquePlatforms.length > 0 && (
        <div className="flex gap-0.5 mb-1 flex-wrap">
          {uniquePlatforms.slice(0, 4).map((platform) => (
            <span
              key={platform}
              className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[7px] font-bold ${PLATFORM_COLORS[platform] || "bg-gray-500 text-white"}`}
            >
              {PLATFORM_ICONS[platform] || "?"}
            </span>
          ))}
          {uniquePlatforms.length > 4 && (
            <span className="text-[8px] text-muted-foreground self-center ml-0.5">
              +{uniquePlatforms.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="space-y-0.5">
        {posts.slice(0, 2).map((post) => (
          <PostCard key={post.id} post={post} compact onClick={() => onPostClick(post)} />
        ))}
        {posts.length > 2 && (
          <span className="text-[9px] text-muted-foreground pl-1">+{posts.length - 2}</span>
        )}
      </div>
    </div>
  );
}

function DayPanel({
  dateStr,
  posts,
  onPostClick,
  onClose,
}: {
  dateStr: string;
  posts: CalendarPost[];
  onPostClick: (post: CalendarPost) => void;
  onClose: () => void;
}) {
  const formattedDate = new Date(dateStr + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="w-full md:w-72 lg:w-80 flex-shrink-0 glass-card rounded-2xl border border-white/10 p-4 flex flex-col max-h-[calc(100vh-180px)]"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-bold capitalize">{formattedDate}</p>
          <p className="text-xs text-muted-foreground">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-muted-foreground"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40">
            <Clock size={32} className="mb-2" />
            <p className="text-sm">Aucun post planifié</p>
          </div>
        ) : (
          posts
            .sort((a, b) => {
              if (!a.scheduledAt) return 1;
              if (!b.scheduledAt) return -1;
              return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
            })
            .map((post) => {
              const time = post.scheduledAt
                ? new Date(post.scheduledAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";
              return (
                <div key={post.id}>
                  {time && (
                    <p className="text-[10px] text-muted-foreground mb-0.5 pl-1">{time}</p>
                  )}
                  <PostCard post={post} onClick={() => onPostClick(post)} />
                </div>
              );
            })
        )}
      </div>
    </motion.div>
  );
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function MonthView({ days, onPostClick }: MonthViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const selectedPosts =
    selectedDate !== null ? days.find((d) => d.dateStr === selectedDate)?.posts || [] : [];

  const handleDayClick = (dateStr: string) => {
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  };

  return (
    <div className="flex gap-4 flex-1 min-h-0">
      <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border border-white/10">
        {/* Week headers */}
        <div className="grid grid-cols-7 border-b border-white/[0.04] bg-white/[0.015]">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-medium text-muted-foreground border-r border-white/[0.04] last:border-0"
            >
              <span className="hidden md:inline">{day}</span>
              <span className="md:hidden">{day.slice(0, 2)}</span>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {days.slice(0, 42).map((day, idx) => (
            <DayCell
              key={idx}
              day={day}
              onPostClick={onPostClick}
              onDayClick={handleDayClick}
              selectedDate={selectedDate}
            />
          ))}
        </div>
      </div>

      {/* Side panel */}
      <AnimatePresence>
        {selectedDate && (
          <DayPanel
            dateStr={selectedDate}
            posts={selectedPosts}
            onPostClick={onPostClick}
            onClose={() => setSelectedDate(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
