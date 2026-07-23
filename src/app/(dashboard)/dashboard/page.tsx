"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, FileText, CheckCircle2, Clock, AlertCircle, ArrowUpRight, ArrowDownRight, Eye, Heart, MessageCircle, Share2, Lightbulb, RefreshCw } from "lucide-react";
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

type TopPost = {
  id: string;
  title: string;
  body: string;
  platform: string;
  publishedAt: string | null;
  reach: number;
  impressions: number;
  likes: number;
  comments: number;
  shares: number;
};

type DashboardData = {
  stats: {
    publishedThisMonth: number;
    pendingApproval: number;
    totalContents: number;
    totalPosts: number;
    totalReach: number;
    totalImpressions: number;
    engagement: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalClicks: number;
  };
  recentActivity: Activity[];
  charts: {
    platformData: ChartPlatform[];
    statusData: ChartStatus[];
    dailyData: ChartDaily[];
  };
  topPosts: TopPost[];
};

type Insight = {
  id: string;
  type: string;
  platform: string | null;
  title: string;
  description: string;
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

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState<"7" | "30">("7");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

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

    fetch("/api/analytics/insights")
      .then((res) => res.json() as Promise<{ insights?: Insight[] }>)
      .then((d) => setInsights(d.insights || []))
      .catch(() => {});
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
      title: "Portée totale",
      value: data!.stats.totalReach,
      icon: Eye,
      color: "text-primary",
      bg: "bg-primary/10",
      format: "number" as const,
    },
    {
      title: "Taux d'engagement",
      value: data!.stats.engagement,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      format: "percent" as const,
    },
    {
      title: "Likes",
      value: data!.stats.totalLikes,
      icon: Heart,
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      format: "number" as const,
    },
    {
      title: "Publications",
      value: data!.stats.totalPosts,
      icon: CheckCircle2,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      format: "number" as const,
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
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Vue d&apos;ensemble de votre activité.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
            <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: i === 0 ? "rgba(99,102,241,0.15)" : i === 1 ? "rgba(16,185,129,0.15)" : i === 2 ? "rgba(236,72,153,0.15)" : "rgba(59,130,246,0.15)" }} />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                <stat.icon className={stat.color} size={20} />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-3xl font-bold tracking-tight">
                {stat.format === "percent"
                  ? `${stat.value}%`
                  : formatNumber(stat.value)}
              </p>
              <p className="text-muted-foreground text-sm mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${PLATFORM_BADGE[activity.platform] || "bg-white/5 text-muted-foreground border-white/10"}`}>
                          {activity.platformLabel}
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

      {data!.topPosts && data!.topPosts.length > 0 && (
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-bold">Top posts</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Vos publications les plus performantes</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Post</th>
                  <th className="text-left py-3 px-4 text-muted-foreground font-medium">Plateforme</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Portée</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">Impressions</th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                    <span className="flex items-center justify-end gap-1"><Heart size={14} /></span>
                  </th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                    <span className="flex items-center justify-end gap-1"><MessageCircle size={14} /></span>
                  </th>
                  <th className="text-right py-3 px-4 text-muted-foreground font-medium">
                    <span className="flex items-center justify-end gap-1"><Share2 size={14} /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data!.topPosts.map((post) => (
                  <tr key={post.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium truncate max-w-[240px]">{post.title}</p>
                      <p className="text-muted-foreground text-xs truncate max-w-[240px] mt-0.5">{post.body}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${PLATFORM_BADGE[post.platform] || "bg-white/5 text-muted-foreground border-white/10"}`}>
                        {platformNames[post.platform] || post.platform}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{formatNumber(post.reach)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatNumber(post.impressions)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatNumber(post.likes)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatNumber(post.comments)}</td>
                    <td className="py-3 px-4 text-right font-medium">{formatNumber(post.shares)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {insights.length > 0 && (
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Lightbulb size={20} className="text-amber-400" />
                Insights
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">Patterns détectés dans vos performances</p>
            </div>
            <button
              onClick={async () => {
                setInsightsLoading(true);
                try {
                  const res = await fetch("/api/analytics/insights", { method: "POST" });
                  const d = await res.json() as { insights?: Insight[] };
                  setInsights(d.insights || []);
                } catch {}
                setInsightsLoading(false);
              }}
              disabled={insightsLoading}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
              title="Régénérer les insights"
            >
              <RefreshCw size={16} className={`text-muted-foreground ${insightsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  {insight.platform && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${PLATFORM_BADGE[insight.platform] || "bg-white/5 text-muted-foreground border-white/10"}`}>
                      {platformNames[insight.platform] || insight.platform}
                    </span>
                  )}
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{insight.type.replace(/_/g, " ")}</span>
                </div>
                <p className="font-medium text-sm mb-1">{insight.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
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
  return `Il y a ${days}j`;
}
