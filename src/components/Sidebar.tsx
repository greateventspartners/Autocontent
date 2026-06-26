"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bot, CalendarDays, Palette, CheckCircle, Settings, Plus } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Copilot IA", href: "/copilot", icon: Bot },
  { name: "Calendrier", href: "/calendar", icon: CalendarDays },
  { name: "Brand Kit", href: "/brand-kit", icon: Palette },
  { name: "Approbations", href: "/approvals", icon: CheckCircle },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen flex flex-col glass border-r border-white/10 dark:border-white/10 relative z-10 hidden md:flex flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">Autopilot</span>
        </div>
        
        <button className="w-full mb-8 flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 transition-all font-medium py-2.5 px-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
          <Plus size={18} />
          Créer avec l'IA
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
              )}
            >
              <item.icon size={20} className={cn("transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span>{item.name}</span>
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground rounded-xl transition-all duration-200 group"
        >
          <Settings size={20} className="group-hover:rotate-45 transition-transform duration-300" />
          <span>Paramètres</span>
        </Link>
        <div className="mt-4 p-4 rounded-xl glass-card border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
              JD
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">John Doe</p>
              <p className="text-xs text-muted-foreground">Admin Workspace</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
