"use client";

import React from "react";
import { Search, Bell, Menu } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useUser } from "@/lib/useUser";

export default function Header() {
  const { user } = useUser();
  return (
    <header className="h-20 px-8 flex items-center justify-between glass border-b border-white/5 dark:border-white/5 relative z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
          <Menu size={20} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Bonjour{user ? `, ${user.name?.split(" ")[0] || user.email}` : ""} 👋</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher (ex: post LinkedIn)..." 
            className="w-64 pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/70"
          />
        </div>
        
        <ThemeToggle />
        <button className="relative p-2 text-muted-foreground hover:bg-white/5 rounded-full transition-colors group">
          <Bell size={20} className="group-hover:text-foreground transition-colors" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-background"></span>
        </button>
      </div>
    </header>
  );
}
