"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, FileText, CheckCircle2, Clock, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion, Variants } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

type Activity = {
  id: string;
  title: string;
  platform: string;
  status: string;
  time: string;
};

type ChartPlatform = { platform: string; count: number };
type ChartStatus = { status: string; count: number };
type ChartDaily = { day: string; count: number };

type DashboardData = {
  stats: {
    publishedThisMonth: number;
    pendingApproval: number;
    totalContents: number;
    totalPosts: number;
  };
  recentActivity: Activity[];
  charts: {
    platformData: ChartPlatform[];
    statusData: ChartStatus[];
    dailyData: ChartDaily[];
  };
};

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  PUBLISHED: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  SCHEDULED: { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
  PENDING_APPROVAL: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
  DRAFT: { icon: FileText, color: "text-slate-400", bg: "bg-slate-500/10" },
  APPROVED: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  FAILED: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
};

const statusLabels: Record<string, string> = {
  PUBLISHED: "Publié",
  SCHEDULED: "Planifié",
  PENDING_APPROVAL: "En attente",
  DRAFT: "Brouillon",
  APPROVED: "Approuvé",
  FAILED: "Échoué",
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

const PLATFORM_BADGE: Record<string, string> = {
  linkedin: "bg-blue-600/20 text-blue-400 border-blue-500/20",
  twitter: "bg-sky-500/20 text-sky-400 border-sky-500/20",
  instagram: "bg-pink-500/20 text-pink-400 border-pink-500/20",
  facebook: "bg-blue-800/20 text-blue-300 border-blue-700/20",
  tiktok: "bg-white/10 text-white border-white/10",
  pinterest: "bg-red-600/20 text-red-400 border-red-500/20",
  wordpress: "bg-slate-600/20 text-slate-300 border-slate-500/20",
  medium: "bg-stone-700/20 text-stone-300 border-stone-600/20",
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
};

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#ec4899", "#06b6d4", "#8b5cf6"];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState<"7" | "30">("7");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/stats?range=${range}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement dashboard");
        return res.json() as Promise<DashboardData>;
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [range]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Publications ce mois",
      value: data!.stats.publishedThisMonth,
      icon: TrendingUp,
      color: "text-primary",
      bg: "bg-primary/10",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "En attente",
      value: data!.stats.pendingApproval,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      trend: "-3",
      trendUp: false,
    },
    {
      title: "Total contenus",
      value: data!.stats.totalContents,
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      trend: "+28",
      trendUp: true,
    },
    {
      title: "Total publications",
      value: data!.stats.totalPosts,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      trend: "+156",
      trendUp: true,
    },
  ];

  const recentActivities = data!.recentActivity.slice(0, 6).map((a) => {
    const cfg = statusConfig[a.status] || statusConfig.DRAFT;
    return {
      id: a.id,
      title: a.title,
      status: statusLabels[a.status] || a.status,
      time: formatRelativeTime(a.time),
      platform: a.platform,
      platformLabel: platformNames[a.platform] || a.platform,
      icon: cfg.icon,
      color: cfg.color,
      bg: cfg.bg,
    };
  });

  return (
    <motion.div
      className="max-w-7xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Vue d&apos;ensemble de votre activité.</p>
      </motion.div>

      {/* Stat Cards — 4-column grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
            <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: i === 0 ? "rgba(99,102,241,0.15)" : i === 1 ? "rgba(245,158,11,0.15)" : i === 2 ? "rgba(59,130,246,0.15)" : "rgba(16,185,129,0.15)" }} />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={stat.color} size={20} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? "text-emerald-400" : "text-slate-400"}`}>
                {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {stat.trend}
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-bold tracking-tight">{stat.value.toLocaleString()}</p>
              <p className="text-muted-foreground text-sm mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart — 2/3 width */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Publications par jour</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Volume de contenu publié</p>
            </div>
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10">
              {(["7", "30"] as const).map((r) => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${range === r ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {r}j
                </button>
              ))}
            </div>
          </div>
          <div className="h-[280px]">
            {data!.charts.dailyData.length === 0 ? (
              <div className="h-full border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center bg-white/[0.02]">
                <p className="text-muted-foreground text-sm flex items-center gap-2">
                  <TrendingUp size={18} />
                  Aucune donnée pour cette période
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data!.charts.dailyData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(d: string) => {
                      const date = new Date(d);
                      return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
                    }}
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 13,
                    }}
                    labelFormatter={(label) =>
                      new Date(String(label)).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" })
                    }
                  />
                  <Bar dataKey="count" name="Publications" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Pie Chart — Platform distribution */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold">Par plateforme</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Répartition du contenu</p>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            {data!.charts.platformData.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">Aucune donnée.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data!.charts.platformData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="platform"
                    strokeWidth={0}
                  >
                    {data!.charts.platformData.map((entry, index) => (
                      <Cell key={entry.platform} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 13,
                    }}
                    formatter={(value, name) => [
                      `${value} posts`,
                      platformNames[String(name)] || String(name),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {data!.charts.platformData.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {data!.charts.platformData.map((item, i) => (
                <div key={item.platform} className="flex items-center gap-2 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground truncate">{platformNames[item.platform] || item.platform}</span>
                  <span className="font-medium ml-auto">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row — Activity Feed + Status Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Activité récente</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Dernières actions sur vos contenus</p>
            </div>
          </div>
          <div className="space-y-1">
            {recentActivities.length === 0 ? (
              <p className="text-muted-foreground text-sm italic py-8 text-center">Aucune activité récente.</p>
            ) : (
              recentActivities.map((activity, idx) => {
                const Icon = activity.icon;
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className={`p-2 rounded-lg ${activity.bg} shrink-0`}>
                      <Icon size={16} className={activity.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${PLATFORM_BADGE[activity.id] || "bg-white/5 text-muted-foreground border-white/10"}`}>
                          {platformNames[activity.id] || activity.id}
                        </span>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground shrink-0">{activity.status}</span>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Status Pie Chart */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-bold">Par statut</h3>
            <p className="text-sm text-muted-foreground mt-0.5">État de vos contenus</p>
          </div>
          <div className="flex-1 flex items-center justify-center min-h-[180px]">
            {data!.charts.statusData.length === 0 ? (
              <p className="text-muted-foreground text-sm italic">Aucune donnée.</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={data!.charts.statusData.map((s) => ({
                      ...s,
                      label: statusLabels[s.status] || s.status,
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="label"
                    strokeWidth={0}
                  >
                    {data!.charts.statusData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={
                          entry.status === "PUBLISHED" ? "#10b981"
                            : entry.status === "SCHEDULED" ? "#3b82f6"
                            : entry.status === "PENDING_APPROVAL" ? "#f59e0b"
                            : entry.status === "FAILED" ? "#ef4444"
                            : "#6366f1"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.95)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 13,
                    }}
                    formatter={(value, name) => [`${value} posts`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {data!.charts.statusData.length > 0 && (
            <div className="mt-4 space-y-2">
              {data!.charts.statusData.map((item) => (
                <div key={item.status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.status === "PUBLISHED" ? "bg-emerald-500" : item.status === "SCHEDULED" ? "bg-blue-500" : item.status === "PENDING_APPROVAL" ? "bg-amber-500" : item.status === "FAILED" ? "bg-red-500" : "bg-primary"}`} />
                    <span className="text-muted-foreground">{statusLabels[item.status] || item.status}</span>
                  </div>
                  <span className="font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
