"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, MoreHorizontal, Plus } from "lucide-react";
import { motion } from "framer-motion";

// Types
type Platform = "linkedin" | "twitter" | "instagram" | "wordpress";

interface Post {
  id: string;
  title: string;
  platform: Platform;
  time: string;
}

interface DayData {
  date: number;
  isCurrentMonth: boolean;
  isToday?: boolean;
  posts: Post[];
}

// Mock Data
const PLATFORM_COLORS: Record<Platform, string> = {
  linkedin: "bg-blue-600 text-white shadow-blue-500/20",
  twitter: "bg-sky-500 text-white shadow-sky-500/20",
  instagram: "bg-gradient-to-tr from-pink-500 to-orange-400 text-white shadow-pink-500/20",
  wordpress: "bg-slate-700 text-white shadow-slate-900/20",
};

const PLATFORM_ICONS: Record<Platform, string> = {
  linkedin: "in",
  twitter: "𝕏",
  instagram: "ig",
  wordpress: "W",
};

const generateMockCalendar = (): DayData[] => {
  const days: DayData[] = [];
  // Dummy previous month days
  for (let i = 28; i <= 31; i++) {
    days.push({ date: i, isCurrentMonth: false, posts: [] });
  }
  // Current month days
  for (let i = 1; i <= 30; i++) {
    const posts: Post[] = [];
    if (i === 4) posts.push({ id: `p1-${i}`, title: "Lancement Feature", platform: "linkedin", time: "09:00" });
    if (i === 4) posts.push({ id: `p2-${i}`, title: "Lancement Feature", platform: "twitter", time: "09:30" });
    if (i === 8) posts.push({ id: `p3-${i}`, title: "Cas Client SaaS", platform: "instagram", time: "17:00" });
    if (i === 12) posts.push({ id: `p4-${i}`, title: "Article SEO", platform: "wordpress", time: "11:00" });
    if (i === 15) posts.push({ id: `p5-${i}`, title: "Thread Conseils", platform: "twitter", time: "14:00" });
    if (i === 15) posts.push({ id: `p6-${i}`, title: "Résumé Thread", platform: "linkedin", time: "15:00" });
    if (i === 22) posts.push({ id: `p7-${i}`, title: "Webinar Teasing", platform: "linkedin", time: "10:00" });
    
    days.push({ 
      date: i, 
      isCurrentMonth: true, 
      isToday: i === 15,
      posts 
    });
  }
  // Dummy next month days
  for (let i = 1; i <= 8; i++) {
    days.push({ date: i, isCurrentMonth: false, posts: [] });
  }
  return days;
};

export default function CalendarPage() {
  const [days] = useState<DayData[]>(generateMockCalendar());
  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
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
            <button className="p-1.5 hover:bg-white/10 rounded-md transition-colors"><ChevronLeft size={18} /></button>
            <span className="px-4 font-medium text-sm">Avril 2024</span>
            <button className="p-1.5 hover:bg-white/10 rounded-md transition-colors"><ChevronRight size={18} /></button>
          </div>
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
            Aujourd'hui
          </button>
          <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-lg shadow-primary/25 font-medium text-sm flex items-center gap-2">
            <Plus size={16} /> Créer
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border border-white/10 relative">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.02]">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground border-r border-white/10 last:border-0">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-black/20">
          {days.slice(0, 35).map((day, idx) => (
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
                {day.posts.map(post => (
                  <motion.div 
                    key={post.id}
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={1}
                    whileDrag={{ scale: 1.05, zIndex: 50, rotate: 2 }}
                    className={`px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-grab active:cursor-grabbing shadow-sm ${PLATFORM_COLORS[post.platform]}`}
                  >
                    <span className="font-bold opacity-80 text-[10px] uppercase">{PLATFORM_ICONS[post.platform]}</span>
                    <span className="truncate">{post.time} {post.title}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
