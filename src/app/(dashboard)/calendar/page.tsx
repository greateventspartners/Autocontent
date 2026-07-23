"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { ClipboardList, Eye } from "lucide-react";
import Link from "next/link";
import ControlsBar from "@/components/calendar/ControlsBar";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import ListView from "@/components/calendar/ListView";
import UnplannedPane from "@/components/calendar/UnplannedPane";
import PostCard from "@/components/calendar/PostCard";
import PostPreviewModal from "@/components/calendar/PostPreviewModal";
import BulkScheduler from "@/components/calendar/BulkScheduler";
import type { CalendarPost, DayData, ViewMode, CampaignOption } from "@/components/calendar/types";

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<CalendarPost[]>([]);
  const [draftPosts, setDraftPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterCampaign, setFilterCampaign] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [previewPost, setPreviewPost] = useState<CalendarPost | null>(null);
  const [activeDragPost, setActiveDragPost] = useState<CalendarPost | null>(null);
  const [showBulkScheduler, setShowBulkScheduler] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchScheduled = useCallback(() => {
    const params = new URLSearchParams({ calendar: "true" });
    if (filterPlatform) params.set("platform", filterPlatform);
    if (filterCampaign) params.set("campaignId", filterCampaign);
    return fetch(`/api/posts?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement calendrier");
        return res.json() as Promise<{ posts: CalendarPost[] }>;
      })
      .then((data) => setScheduledPosts(data.posts));
  }, [filterPlatform, filterCampaign]);

  const fetchDrafts = useCallback(() => {
    const params = new URLSearchParams({ status: "DRAFT" });
    if (filterPlatform) params.set("platform", filterPlatform);
    return fetch(`/api/posts?${params}`)
      .then((res) => res.json() as Promise<{ posts: CalendarPost[] }>)
      .then((data) => setDraftPosts(data.posts));
  }, [filterPlatform]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchScheduled(), fetchDrafts()])
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [fetchScheduled, fetchDrafts]);

  useEffect(() => {
    fetch("/api/campaigns")
      .then((res) => res.json() as Promise<{ campaigns?: CampaignOption[] }>)
      .then((data) => setCampaigns(data.campaigns ?? []))
      .catch(() => {});
  }, []);

  const buildDays = (): DayData[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = lastDay.getDate();
    const totalCells = Math.ceil((startPadding + daysInMonth) / 7) * 7;

    const days: DayData[] = [];
    const prevLastDay = new Date(year, month, 0).getDate();

    for (let i = startPadding - 1; i >= 0; i--) {
      const d = prevLastDay - i;
      const dt = new Date(year, month - 1, d);
      const dateStr = formatDate(dt);
      days.push({ date: d, isCurrentMonth: false, posts: getPostsForDate(dateStr), dateStr });
    }

    const now = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const dt = new Date(year, month, d);
      const dateStr = formatDate(dt);
      const isToday =
        now.getFullYear() === year && now.getMonth() === month && now.getDate() === d;
      days.push({ date: d, isCurrentMonth: true, isToday, posts: getPostsForDate(dateStr), dateStr });
    }

    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const dt = new Date(year, month + 1, d);
      const dateStr = formatDate(dt);
      days.push({ date: d, isCurrentMonth: false, posts: getPostsForDate(dateStr), dateStr });
    }

    return days;
  };

  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const getPostsForDate = (dateStr: string) =>
    scheduledPosts.filter((p) => p.scheduledAt?.startsWith(dateStr));

  const days = buildDays();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragPost(null);

    if (!over) return;

    const postId = String(active.id);
    const overId = String(over.id);

    const dateMatch = overId.match(/^day-(\d{4}-\d{2}-\d{2})$/);
    if (!dateMatch) return;

    const targetDate = dateMatch[1];
    const post = scheduledPosts.find((p) => p.id === postId) || draftPosts.find((p) => p.id === postId);
    if (!post) return;

    let time = "09:00";
    if (post.scheduledAt) {
      const t = post.scheduledAt.split("T")[1];
      if (t) time = t.slice(0, 5);
    }

    const newScheduledAt = `${targetDate}T${time}:00.000Z`;
    const isFromUnplanned = !post.scheduledAt;

    try {
      const body: Record<string, unknown> = { scheduledAt: newScheduledAt };
      if (isFromUnplanned) body.status = "SCHEDULED";

      const res = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await Promise.all([fetchScheduled(), fetchDrafts()]);
      }
    } catch (err) {
      console.error("Drag error:", err);
    }
  };

  const handlePostDeleted = (postId: string) => {
    setScheduledPosts((prev) => prev.filter((p) => p.id !== postId));
    setDraftPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleBulkCreated = () => {
    Promise.all([fetchScheduled(), fetchDrafts()]);
  };

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
          <p className="text-destructive text-4xl">!</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(event) => {
        const post = scheduledPosts.find((p) => p.id === event.active.id) || draftPosts.find((p) => p.id === event.active.id);
        setActiveDragPost(post || null);
      }}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full flex flex-col gap-5">
        <ControlsBar
          viewMode={viewMode}
          setViewMode={setViewMode}
          currentDate={currentDate}
          setCurrentDate={setCurrentDate}
          filterPlatform={filterPlatform}
          setFilterPlatform={setFilterPlatform}
          filterCampaign={filterCampaign}
          setFilterCampaign={setFilterCampaign}
          campaigns={campaigns}
          draftCount={draftPosts.length}
        />

        {/* Bulk scheduler button */}
        <div className="flex justify-end gap-2">
          <Link
            href="/preview"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm font-medium hover:bg-white/[0.06] transition-colors text-muted-foreground hover:text-foreground"
          >
            <Eye size={16} />
            Aperçu multi-plateforme
          </Link>
          <button
            onClick={() => setShowBulkScheduler(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm font-medium hover:bg-white/[0.06] transition-colors text-muted-foreground hover:text-foreground"
          >
            <ClipboardList size={16} />
            Planification en masse
          </button>
        </div>

        {viewMode === "month" && (
          <MonthView days={days} onPostClick={setPreviewPost} />
        )}

        {viewMode === "week" && (
          <WeekView days={days} currentDate={currentDate} onPostClick={setPreviewPost} />
        )}

        {viewMode === "list" && (
          <ListView posts={scheduledPosts} onPostClick={setPreviewPost} />
        )}

        {viewMode === "unplanned" && (
          <UnplannedPane posts={draftPosts} onPostClick={setPreviewPost} />
        )}

        {previewPost && (
          <PostPreviewModal
            post={previewPost}
            onClose={() => setPreviewPost(null)}
            onDeleted={handlePostDeleted}
          />
        )}

        <BulkScheduler
          open={showBulkScheduler}
          onClose={() => setShowBulkScheduler(false)}
          onCreated={handleBulkCreated}
        />
      </div>

      <DragOverlay>
        {activeDragPost ? (
          <div className="opacity-90 pointer-events-none">
            <PostCard post={activeDragPost} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
