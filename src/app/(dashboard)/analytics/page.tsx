"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3, TrendingUp, Eye, Heart, MessageCircle, Share2, MousePointer,
  Lightbulb, RefreshCw, ArrowUpRight, ArrowDownRight, Calendar, Users,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";

type Stats = {
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

type ChartPlatform = { platform: string; count: number };
type ChartDaily = { day: string; count: number; reach?: number; engagement?: number };
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
  stats: Stats;
  charts: {
    platformData: ChartPlatform[];
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

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#ec4899", "#06b6d4", "#8b5cf6"];

const platformNames: Record<string, string> = {
  linkedin: "LinkedIn", twitter: "X", instagram: "Instagram",
  facebook: "Facebook", tiktok: "TikTok", pinterest: "Pinterest",
  wordpress: "WordPress", medium: "Medium",
};

const platformColors: Record<string, string> = {
  linkedin: "#3b82f6", twitter: "#0ea5e9", instagram: "#ec4899",
  facebook: "#60a5fa", tiktok: "#ffffff", pinterest: "#ef4444",
  wordpress: "#94a3b8", medium: "#78716c",
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString("fr-FR");
}

const KPI_CARDS = [
  { key: "totalReach", label: "Portée totale", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
  { key: "totalImpressions", label: "Impressions", icon: Eye, color: "text-violet-400", bg: "bg-violet-500/10" },
  { key: "engagement", label: "Taux d'engagement", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10", suffix: "%" },
  { key: "totalLikes", label: "Likes", icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10" },
  { key: "totalComments", label: "Commentaires", icon: MessageCircle, color: "text-amber-400", bg: "bg-amber-500/10" },
  { key: "totalShares", label: "Partages", icon: Share2, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { key: "totalClicks", label: "Clics", icon: MousePointer, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { key: "totalPosts", label: "Posts totaux", icon: BarChart3, color: "text-rose-400", bg: "bg-rose-500/10" },
];

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"7" | "30">("30");
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/stats?range=${range}`)
      .then((r) => r.json() as Promise<DashboardData>)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/analytics/insights")
      .then((r) => r.json() as Promise<{ insights?: Insight[] }>)
      .then((d) => setInsights(d.insights || []))
      .catch(() => {});
  }, [range]);

  const refreshInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/analytics/insights", { method: "POST" });
      const d = await res.json() as { insights?: Insight[] };
      if (d.insights) setInsights(d.insights);
    } catch {}
    setInsightsLoading(false);
  };

  if (loading || !data) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full" />
      </div>
    );
  }

  const { stats, charts, topPosts } = data;

  const platformChartData = charts.platformData.map((p) => ({
    ...p,
    platform: platformNames[p.platform] || p.platform,
    fill: platformColors[p.platform] || "#6366f1",
  }));

  const dailyChartData = charts.dailyData.map((d) => ({
    ...d,
    label: d.day.slice(5),
  }));

  const engagementData = platformChartData.map((p) => ({
    platform: p.platform,
    posts: p.count,
  }));

  const radarData = platformChartData.map((p) => ({
    platform: p.platform,
    value: p.count,
  }));

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Performance de votre contenu sur toutes les plateformes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-background/50 rounded-xl p-1 border border-border">
            {(["7", "30"] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {r} jours
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {KPI_CARDS.map(({ key, label, icon: Icon, color, bg, suffix }) => {
          const value = stats[key as keyof Stats] as number;
          return (
            <div key={key} className="glass-card rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-1.5 rounded-lg ${bg}`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {suffix ? `${value}${suffix}` : formatNumber(value)}
              </p>
            </div>
          );
        })}
      </motion.div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reach Over Time */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Portée quotidienne</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData}>
                <defs>
                  <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="reach" stroke="#6366f1" fill="url(#reachGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Posts by Platform */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Posts par plateforme</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="platform" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {platformChartData.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Platform Distribution Pie */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformChartData} dataKey="count" nameKey="platform" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                  {platformChartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {platformChartData.map((p, i) => (
              <span key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {p.platform} ({p.count})
              </span>
            ))}
          </div>
        </motion.div>

        {/* Radar Chart */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Radar plateformes</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="platform" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Engagement Summary */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Engagement total</h3>
          <div className="space-y-4">
            {[
              { label: "Likes", value: stats.totalLikes, color: "bg-pink-500", pct: stats.totalLikes > 0 ? 100 : 0 },
              { label: "Commentaires", value: stats.totalComments, color: "bg-amber-500", pct: stats.totalLikes > 0 ? (stats.totalComments / stats.totalLikes) * 100 : 0 },
              { label: "Partages", value: stats.totalShares, color: "bg-cyan-500", pct: stats.totalLikes > 0 ? (stats.totalShares / stats.totalLikes) * 100 : 0 },
              { label: "Clics", value: stats.totalClicks, color: "bg-indigo-500", pct: stats.totalLikes > 0 ? (stats.totalClicks / stats.totalLikes) * 100 : 0 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground font-medium">{formatNumber(item.value)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(item.pct, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Posts */}
      {topPosts.length > 0 && (
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Top posts par portée</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground">Post</th>
                  <th className="text-left py-2 text-xs font-medium text-muted-foreground">Plateforme</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground">Portée</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground">Likes</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground">Comment.</th>
                  <th className="text-right py-2 text-xs font-medium text-muted-foreground">Partages</th>
                </tr>
              </thead>
              <tbody>
                {topPosts.map((post) => (
                  <tr key={post.id} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                    <td className="py-2.5 max-w-[250px] truncate text-foreground">{post.title}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-muted-foreground">
                        {platformNames[post.platform] || post.platform}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-medium text-foreground">{formatNumber(post.reach)}</td>
                    <td className="py-2.5 text-right text-pink-400">{formatNumber(post.likes)}</td>
                    <td className="py-2.5 text-right text-amber-400">{formatNumber(post.comments)}</td>
                    <td className="py-2.5 text-right text-cyan-400">{formatNumber(post.shares)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Insights IA */}
      <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-foreground">Insights IA</h3>
          </div>
          <button onClick={refreshInsights} disabled={insightsLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 ${insightsLoading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Pas encore assez de données pour générer des insights. Continuez à publier du contenu !
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.map((insight) => (
              <div key={insight.id} className="p-3 rounded-xl bg-background/30 border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                    {insight.type}
                  </span>
                  {insight.platform && (
                    <span className="text-[10px] text-muted-foreground">{insight.platform}</span>
                  )}
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{insight.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
