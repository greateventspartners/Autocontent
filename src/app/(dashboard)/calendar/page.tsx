"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Plus, AlertCircle, List, Grid3x3 } from "lucide-react";
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
  content: { campaign: { id: string; title: string } };
}

type CampaignOption = { id: string; title: string };

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

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  twitter: "X",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  wordpress: "WordPress",
  medium: "Medium",
};

export default function CalendarPage() {
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showFilter, setShowFilter] = useState(false);
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterCampaign, setFilterCampaign] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const PLATFORM_OPTIONS = [
    { value: "", label: "Toutes les plateformes" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "twitter", label: "X / Twitter" },
    { value: "instagram", label: "Instagram" },
    { value: "facebook", label: "Facebook" },
    { value: "tiktok", label: "TikTok" },
    { value: "pinterest", label: "Pinterest" },
    { value: "wordpress", label: "WordPress" },
    { value: "medium", label: "Medium" },
  ];

  useEffect(() => {
    const params = new URLSearchParams({ calendar: "true" });
    if (filterPlatform) params.set("platform", filterPlatform);
    if (filterCampaign) params.set("campaignId", filterCampaign);

    setLoading(true);
    fetch(`/api/posts?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement calendrier");
        return res.json() as Promise<{ posts: CalendarPost[] }>;
      })
      .then((data) => setPosts(data.posts))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filterPlatform, filterCampaign]);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => res.json() as Promise<{ campaigns?: CampaignOption[] }>)
      .then((data) => setCampaigns(data.campaigns ?? []))
      .catch(() => {});
  }, []);

  const filterRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilter(false);
      }
    };
    if (showFilter) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilter]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
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
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startPadding - 1; i >= 0; i--) {
      days.push({ date: prevLastDay - i, isCurrentMonth: false, posts: [] });
    }
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
      days.push({ date: d, isCurrentMonth: true, isToday: isToday(d), posts: dayPosts });
    }
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: d, isCurrentMonth: false, posts: [] });
    }
    return days;
  };

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
  const calendarDays = buildCalendar();

  const listPosts = posts
    .filter((p) => {
      if (!p.scheduledAt) return false;
      const d = new Date(p.scheduledAt);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

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
    <div className="h-full flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 md:p-3 bg-primary/10 text-primary rounded-xl">
              <CalendarIcon size={22} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Calendrier Éditorial</h2>
              <p className="text-muted-foreground text-xs md:text-sm">Gérez et planifiez vos publications.</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary/20 text-primary" : "bg-white/5 border border-white/10"}`}
            >
              <Grid3x3 size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary/20 text-primary" : "bg-white/5 border border-white/10"}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div ref={filterRef} className="relative">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`p-2 rounded-lg transition-colors ${filterPlatform || filterCampaign ? "bg-primary/20 text-primary" : "bg-white/5 border border-white/10 hover:bg-white/10"}`}
            >
              <Filter size={18} />
              {(filterPlatform || filterCampaign) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full" />
              )}
            </button>
            {showFilter && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-30 w-64 glass-card rounded-xl p-4 space-y-3 border border-white/10 shadow-xl"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Plateforme</label>
                  <select
                    value={filterPlatform}
                    onChange={(e) => setFilterPlatform(e.target.value)}
                    className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {PLATFORM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Campagne</label>
                  <select
                    value={filterCampaign}
                    onChange={(e) => setFilterCampaign(e.target.value)}
                    className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Toutes les campagnes</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                {(filterPlatform || filterCampaign) && (
                  <button
                    onClick={() => { setFilterPlatform(""); setFilterCampaign(""); }}
                    className="text-xs text-primary hover:underline"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </motion.div>
            )}
          </div>

          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
            <button onClick={prevMonth} className="p-1.5 hover:bg-white/10 rounded-md transition-colors"><ChevronLeft size={18} /></button>
            <span className="px-2 md:px-4 font-medium text-xs md:text-sm whitespace-nowrap">{monthNames[month]} {year}</span>
            <button onClick={nextMonth} className="p-1.5 hover:bg-white/10 rounded-md transition-colors"><ChevronRight size={18} /></button>
          </div>

          <button onClick={today} className="px-3 py-1.5 md:px-4 md:py-2 bg-white/5 border border-white/10 rounded-lg text-xs md:text-sm font-medium hover:bg-white/10 transition-colors">
            Aujourd&apos;hui
          </button>

          <Link
            href="/copilot"
            className="px-3 py-1.5 md:px-4 md:py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-lg shadow-primary/25 font-medium text-xs md:text-sm flex items-center gap-1.5"
          >
            <Plus size={14} /> <span className="hidden sm:inline">Créer</span>
          </Link>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border border-white/10">
          <div className="flex-1 overflow-y-auto">
            {listPosts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Aucune publication planifiée ce mois.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {listPosts.map((post) => {
                  const color = PLATFORM_COLORS[post.platform.toLowerCase()] || "bg-gray-500 text-white";
                  const icon = PLATFORM_ICONS[post.platform.toLowerCase()] || "?";
                  const d = new Date(post.scheduledAt);
                  const dayNum = d.getDate();
                  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={post.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-muted-foreground leading-none">{weekDays[(d.getDay() + 6) % 7]}</span>
                        <span className="text-sm font-bold leading-tight">{dayNum}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{post.sourceIdea}</p>
                        <p className="text-xs text-muted-foreground">{time}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase flex-shrink-0 ${color}`}>
                        {icon}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 glass-card rounded-2xl flex flex-col overflow-hidden border border-white/10 relative">
          <div className="hidden md:grid grid-cols-7 border-b border-white/10 bg-white/[0.02]">
            {weekDays.map(day => (
              <div key={day} className="py-3 text-center text-sm font-medium text-muted-foreground border-r border-white/10 last:border-0">
                {day}
              </div>
            ))}
          </div>

          <div className="md:hidden grid grid-cols-7 border-b border-white/10 bg-white/[0.02]">
            {weekDays.map(day => (
              <div key={day} className="py-2 text-center text-[10px] font-medium text-muted-foreground border-r border-white/10 last:border-0">
                {day.slice(0, 2)}
              </div>
            ))}
          </div>

          <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-black/20">
            {calendarDays.slice(0, 42).map((day, idx) => (
              <div
                key={idx}
                className={`p-1 md:p-2 border-r border-b border-white/5 relative group transition-colors hover:bg-white/[0.02] ${!day.isCurrentMonth ? 'opacity-40 bg-black/20' : ''} ${day.isToday ? 'bg-primary/5' : ''}`}
              >
                <div className="flex justify-between items-start mb-1 md:mb-2">
                  <span className={`text-xs md:text-sm font-medium w-5 h-5 md:w-7 md:h-7 flex items-center justify-center rounded-full ${day.isToday ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-foreground'}`}>
                    {day.date}
                  </span>
                </div>

                <div className="space-y-0.5 md:space-y-1.5">
                  {day.posts.slice(0, 2).map(post => {
                    const color = PLATFORM_COLORS[post.platform] || "bg-gray-500 text-white";
                    const icon = PLATFORM_ICONS[post.platform] || "?";
                    return (
                      <motion.div
                        key={post.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`px-1 md:px-2 py-0.5 md:py-1.5 rounded-md text-[9px] md:text-xs font-medium flex items-center gap-1 shadow-sm ${color}`}
                      >
                        <span className="font-bold opacity-80 uppercase hidden md:inline">{icon}</span>
                        <span className="truncate">{post.title}</span>
                      </motion.div>
                    );
                  })}
                  {day.posts.length > 2 && (
                    <span className="text-[8px] md:text-[10px] text-muted-foreground pl-0.5 md:pl-1">
                      +{day.posts.length - 2}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
