"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useUser } from "@/lib/useUser";

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
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
    <header className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-white/[0.04] bg-background/50 backdrop-blur-md relative z-10 sticky top-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 text-muted-foreground hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold tracking-tight">
            Bonjour{user ? `, ${user.name?.split(" ")[0] || user.email}` : ""}
          </h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Voici ce qui se passe avec vos contenus</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <form onSubmit={onSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-56 lg:w-64 pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all placeholder:text-muted-foreground/60"
          />
        </form>

        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2 text-muted-foreground hover:bg-white/5 rounded-xl transition-colors group"
            aria-label="Notifications"
          >
            <Bell size={18} className="group-hover:text-foreground transition-colors" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 glass-card rounded-2xl border border-white/[0.06] p-5 shadow-2xl z-20">
                <p className="text-sm font-bold mb-3">Notifications</p>
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Aucune notification pour le moment.
                </p>
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    router.push("/approvals");
                  }}
                  className="w-full text-center text-xs text-primary hover:text-primary/80 font-medium py-2 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  Voir les approbations
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
