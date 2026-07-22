"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Bot, CalendarDays, Palette, CheckCircle, Settings, Plus, PenLine, Lightbulb, FolderOpen, Zap } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useUser } from "@/lib/useUser";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Copilot IA", href: "/copilot", icon: Bot },
  { name: "Calendrier", href: "/calendar", icon: CalendarDays },
  { name: "Brand Kit", href: "/brand-kit", icon: Palette },
  { name: "Bio & Profils", href: "/bio", icon: PenLine },
  { name: "Idées", href: "/ideas", icon: Lightbulb },
  { name: "Approbations", href: "/approvals", icon: CheckCircle },
  { name: "Campagnes", href: "/campaigns", icon: FolderOpen },
];

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user } = useUser();

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <div className="w-64 h-full flex flex-col bg-[#0a0f1e]/80 backdrop-blur-xl border-r border-white/[0.06]">
      {/* Logo */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">Autocontent</span>
        </div>
      </div>

      {/* CTA Button */}
      <div className="px-4 mb-5">
        <Link
          href="/copilot"
          onClick={onNavigate}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white transition-all font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transform hover:-translate-y-0.5 active:scale-[0.98]"
        >
          <Plus size={18} />
          <span className="text-sm">Créer avec l&apos;IA</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative text-sm",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
              )}
              <item.icon size={18} className={cn("shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-3 mt-auto border-t border-white/[0.04]">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 px-3 py-2.5 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground rounded-xl transition-all duration-200 group text-sm"
        >
          <Settings size={18} className="group-hover:rotate-90 transition-transform duration-300" />
          <span>Paramètres</span>
        </Link>

        {/* User Card */}
        <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-md">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name || user?.email || "Utilisateur"}</p>
              <p className="text-[11px] text-muted-foreground">Admin Workspace</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
