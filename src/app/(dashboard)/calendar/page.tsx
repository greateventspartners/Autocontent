"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, MoreHorizontal, Plus, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

type Platform = "linkedin" | "twitter" | "instagram" | "facebook" | "tiktok" | "pinterest" | "wordpress" | "medium";

interface Post {
  id: string;
  title: string;
  platform: Platform;
  time: string;
  status: string;
}

interface DayData {
  date: number;
  isCurrentMonth: boolean;
  isToday?: boolean;
  posts: Post[];
}

interface CalendarPost {
  id: string;
  sourceIdea: string;
  platform: string;
  scheduledAt: string;
  status: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "bg-blue-600 text-white shadow-blue-500/20",
  twitter: "bg-sky-500 text-white shadow-sky-500/20",
  instagram: "bg-gradient-to-tr from-pink-500 to-orange-400 text-white shadow-pink-500/20",
  facebook: "bg-blue-800 text-white shadow-blue-900/20",
  tiktok: "bg-black text-white shadow-black/20",
  pinterest: "bg-red-600 text-white shadow-red-700/20",
  wordpress: "bg-slate-700 text-white shadow-slate-900/20",
  medium: "bg-stone-800 text-white shadow-stone-900/20",
};

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: "in",
  twitter: "X",
  instagram: "ig",
  facebook: "fb",
  tiktok: "tt",
  pinterest: "P",
  wordpress: "W",
  medium: "M",
};

export default function CalendarPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetch("/api/posts?calendar=true")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement calendrier");
        return res.json() as Promise<{ posts: CalendarPost[] }>;
      })
      .then((data) => setPosts(data.posts))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday first
  const daysInMonth = lastDay.getDate();
  const totalCells = Math.ceil((startPadding + daysInMonth) / 7) * 7;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));
  const today = () => setCurrentDate(new Date());

  const now = new Date();
  const isToday = (d: number) =>
    now.getFullYear() === year && now.getMonth() === month && now.getDate() === d;

  const buildCalendar = (): DayData[] => {
    const days: DayData[] = [];

    // Previous month padding
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({ date: prevLastDay - i, isCurrentMonth: false, posts: [] });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayPosts: Post[] = posts
        .filter((p) => p.scheduledAt?.startsWith(dateStr))
        .map((p) => ({
          id: p.id,
          title: p.sourceIdea,
          platform: p.platform.toLowerCase() as Platform,
          time: p.scheduledAt ? p.scheduledAt.split("T")[1]?.slice(0, 5) || "" : "",
          status: p.status,
        }));

      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: isToday(d),
        posts: dayPosts,
      });
    }

    // Next month padding
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: d, isCurrentMonth: false, posts: [] });
    }

    return days;
  };

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const calendarDays = buildCalendar();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle size={40} className="text-destructive mx-auto" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Calendrier Éditorial</h2>
            <p className="text-muted-foreground text-sm">Gérez et planifiez vos publications cross-canal.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
            <Filter size={18} />
          </button>
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-md transition-colors"><ChevronLeft size={18} /></button>
            <span className="px-4 font-medium text-sm">{monthNames[month]} {year}</span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-md transition-colors"><ChevronRight size={18} /></button>
          </div>
          <button onClick={today} className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
            Aujourd&apos;hui
          </button>
          <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-lg shadow-primary/25 font-medium text-sm flex items-center gap-2">
            <Plus size={16} /> Créer
          </button>
        </div>
      </div>

      <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border border-white/10 relative">
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.02]">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground border-r border-white/10 last:border-0">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-black/20">
          {calendarDays.slice(0, 42).map((day, idx) => (
            <div
              key={idx}
              className={`p-2 border-r border-b border-white/5 relative group transition-colors hover:bg-white/[0.02] ${!day.isCurrentMonth ? 'opacity-40 bg-black/20' : ''} ${day.isToday ? 'bg-primary/5' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${day.isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-foreground'}`}>
                  {day.date}
                </span>
                <button className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-foreground transition-opacity">
                  <MoreHorizontal size={14} />
                </button>
              </div>

              <div className="space-y-1.5">
                {day.posts.slice(0, 3).map(post => {
                  const color = PLATFORM_COLORS[post.platform] || "bg-gray-500 text-white";
                  const icon = PLATFORM_ICONS[post.platform] || "?";
                  return (
                    <motion.div
                      key={post.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm ${color}`}
                    >
                      <span className="font-bold opacity-80 text-[10px] uppercase">{icon}</span>
                      <span className="truncate">{post.time} {post.title}</span>
                    </motion.div>
                  );
                })}
                {day.posts.length > 3 && (
                  <span className="text-[10px] text-muted-foreground pl-1">+{day.posts.length - 3} autres</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
