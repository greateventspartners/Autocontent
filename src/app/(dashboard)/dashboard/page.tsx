"use client";

import React, { useEffect, useState } from "react";
import { ArrowUpRight, TrendingUp, FileText, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";
import { motion, Variants } from "framer-motion";

type Activity = {
  id: string;
  title: string;
  platform: string;
  status: string;
  time: string;
};

type DashboardData = {
  stats: {
    publishedThisMonth: number;
    pendingApproval: number;
    totalContents: number;
    totalPosts: number;
  };
  recentActivity: Activity[];
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  PUBLISHED: { icon: CheckCircle2, color: "text-emerald-500" },
  SCHEDULED: { icon: Clock, color: "text-blue-500" },
  PENDING_APPROVAL: { icon: Clock, color: "text-yellow-500" },
  DRAFT: { icon: FileText, color: "text-muted-foreground" },
  APPROVED: { icon: CheckCircle2, color: "text-emerald-500" },
  FAILED: { icon: AlertCircle, color: "text-red-500" },
};

const statusLabels: Record<string, string> = {
  PUBLISHED: "Publié",
  SCHEDULED: "Planifié",
  PENDING_APPROVAL: "En attente validation",
  DRAFT: "Brouillon",
  APPROVED: "Approuvé",
  FAILED: "Échec",
};

const platformNames: Record<string, string> = {
  linkedin: "LinkedIn",
  twitter: "X",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  wordpress: "WordPress",
  medium: "Medium",
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement dashboard");
        return res.json() as Promise<DashboardData>;
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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

  const stats = [
    { title: "Posts Publiés (Mois)", value: String(data!.stats.publishedThisMonth), icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Contenus Créés", value: String(data!.stats.totalContents), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "En Attente", value: String(data!.stats.pendingApproval), icon: Clock, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  const recentActivities = data!.recentActivity.map((a) => {
    const cfg = statusConfig[a.status] || statusConfig.DRAFT;
    return {
      id: a.id,
      title: a.title,
      status: statusLabels[a.status] || a.status,
      time: formatRelativeTime(a.time),
      network: platformNames[a.platform] || a.platform,
      type: a.status === "PUBLISHED" ? "success" : a.status === "SCHEDULED" ? "pending" : a.status === "PENDING_APPROVAL" ? "warning" : "muted",
      icon: cfg.icon,
      color: cfg.color,
    };
  });

  return (
    <motion.div
      className="max-w-6xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vue d&apos;ensemble</h2>
          <p className="text-muted-foreground mt-1">Voici ce qui se passe avec vos contenus aujourd&apos;hui.</p>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
            </div>
            <div className="relative z-10">
              <h3 className="text-4xl font-bold mb-1">{stat.value}</h3>
              <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card rounded-2xl p-6 min-h-[400px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Performance des Canaux</h3>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/50">
              <option>7 derniers jours</option>
              <option>30 derniers jours</option>
            </select>
          </div>
          <div className="flex-1 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center bg-white/[0.02]">
            <p className="text-muted-foreground flex items-center gap-2">
              <TrendingUp size={20} />
              Graphique d&apos;engagement (Espace réservé)
            </p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Activité Récente</h3>
          </div>
          <div className="space-y-4 flex-1">
            {recentActivities.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">Aucune activité récente.</p>
            ) : (
              recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex gap-4 items-start group">
                    <div className="mt-1 relative">
                      <Icon size={18} className={`${activity.color} relative z-10 bg-background`} />
                      <div className="absolute top-5 left-1/2 -translate-x-1/2 w-[2px] h-full bg-white/10 -z-0 group-last:hidden"></div>
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{activity.network}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20"></span>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                      <span className="text-xs mt-1 inline-block px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground">{activity.status}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  return `Il y a ${days} jours`;
}
