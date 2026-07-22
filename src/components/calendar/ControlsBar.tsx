"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Filter, Plus, LayoutGrid, Rows3, CalendarDays, Inbox } from "lucide-react";
import { type ViewMode, type CampaignOption, PLATFORM_OPTIONS } from "./types";

interface ControlsBarProps {
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  currentDate: Date;
  setCurrentDate: (d: Date) => void;
  filterPlatform: string;
  setFilterPlatform: (v: string) => void;
  filterCampaign: string;
  setFilterCampaign: (v: string) => void;
  campaigns: CampaignOption[];
  draftCount: number;
}

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const VIEW_BUTTONS: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
  { mode: "month", icon: <LayoutGrid size={16} />, label: "Mois" },
  { mode: "week", icon: <CalendarDays size={16} />, label: "Semaine" },
  { mode: "list", icon: <Rows3 size={16} />, label: "Liste" },
  { mode: "unplanned", icon: <Inbox size={16} />, label: "Non planifiés" },
];

export default function ControlsBar({
  viewMode,
  setViewMode,
  currentDate,
  setCurrentDate,
  filterPlatform,
  setFilterPlatform,
  filterCampaign,
  setFilterCampaign,
  campaigns,
  draftCount,
}: ControlsBarProps) {
  const [showFilter, setShowFilter] = React.useState(false);
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

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));
  const today = () => setCurrentDate(new Date());

  const hasFilters = filterPlatform || filterCampaign;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendrier</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Planifiez et gérez vos publications.</p>
        </div>

        {/* View toggles */}
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
          {VIEW_BUTTONS.map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === mode
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
              {mode === "unplanned" && draftCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
                  {draftCount > 9 ? "9+" : draftCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Filter */}
        <div ref={filterRef} className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`p-2.5 rounded-xl transition-colors ${
              hasFilters
                ? "bg-primary/10 text-primary"
                : "bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-muted-foreground"
            }`}
          >
            <Filter size={16} />
            {hasFilters && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />}
          </button>
          {showFilter && (
            <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-30 w-64 glass-card rounded-2xl p-4 space-y-3 border border-white/[0.06] shadow-2xl">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Plateforme</label>
                <select
                  value={filterPlatform}
                  onChange={(e) => setFilterPlatform(e.target.value)}
                  className="w-full p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                  className="w-full p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="">Toutes les campagnes</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              {hasFilters && (
                <button
                  onClick={() => { setFilterPlatform(""); setFilterCampaign(""); }}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>

        {/* Month navigator */}
        <div className="flex items-center bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
          <button onClick={prevMonth} className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft size={16} />
          </button>
          <span className="px-3 font-medium text-sm whitespace-nowrap">{MONTHS[month]} {year}</span>
          <button onClick={nextMonth} className="p-1.5 hover:bg-white/[0.06] rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight size={16} />
          </button>
        </div>

        <button
          onClick={today}
          className="px-4 py-2 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm font-medium hover:bg-white/[0.06] transition-colors text-muted-foreground hover:text-foreground"
        >
          Aujourd&apos;hui
        </button>

        <Link
          href="/copilot"
          className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl shadow-lg shadow-primary/20 font-medium text-sm flex items-center gap-1.5 transition-all"
        >
          <Plus size={14} /> <span className="hidden sm:inline">Créer</span>
        </Link>
      </div>
    </div>
  );
}
