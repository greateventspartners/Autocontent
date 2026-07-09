"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useUser } from "@/lib/useUser";

export default function Header() {
  const { user } = useUser();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/copilot?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="h-20 px-8 flex items-center justify-between glass border-b border-white/5 dark:border-white/5 relative z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
          <Menu size={20} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">
          Bonjour{user ? `, ${user.name?.split(" ")[0] || user.email}` : ""} 👋
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <form onSubmit={onSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher (ex: post LinkedIn)..."
            className="w-64 pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/70"
          />
        </form>

        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 text-muted-foreground hover:bg-white/5 rounded-full transition-colors group"
            aria-label="Notifications"
          >
            <Bell size={20} className="group-hover:text-foreground transition-colors" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background"></span>
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 glass-card rounded-xl border border-white/10 p-4 shadow-xl z-20">
              <p className="text-sm font-medium mb-2">Notifications</p>
              <p className="text-xs text-muted-foreground">
                Aucune notification pour le moment. Les approbations et publications apparaîtront ici.
              </p>
              <button
                onClick={() => {
                  setNotifOpen(false);
                  router.push("/approvals");
                }}
                className="mt-3 text-xs text-primary hover:underline"
              >
                Voir les approbations →
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
