"use client";

import React from "react";
import { ArrowUpRight, TrendingUp, Users, FileText, CheckCircle2, Clock } from "lucide-react";
import { motion, Variants } from "framer-motion";

const stats = [
  { title: "Posts Publiés (Mois)", value: "124", change: "+12%", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "Engagement Global", value: "8.4k", change: "+24%", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { title: "Audience Touchée", value: "45.2k", change: "+18%", icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
];

const recentActivities = [
  { id: 1, title: "Post LinkedIn: Annonce Produit", status: "Publié", time: "Il y a 2h", network: "LinkedIn", type: "success" },
  { id: 2, title: "Thread Twitter: Astuces SaaS", status: "Planifié", time: "Demain, 14:00", network: "X", type: "pending" },
  { id: 3, title: "Carrousel Insta: Cas client", status: "En attente validation", time: "Il y a 5h", network: "Instagram", type: "warning" },
  { id: 4, title: "Article Blog: L'IA en 2024", status: "Brouillon", time: "Il y a 1j", network: "WordPress", type: "muted" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Dashboard() {
  return (
    <motion.div 
      className="max-w-6xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vue d'ensemble</h2>
          <p className="text-muted-foreground mt-1">Voici ce qui se passe avec vos contenus aujourd'hui.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all font-medium text-sm">
            Voir le calendrier
          </button>
          <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all shadow-lg shadow-primary/25 font-medium text-sm flex items-center gap-2">
            Nouveau Post
            <ArrowUpRight size={16} />
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <span className="flex items-center text-emerald-400 text-sm font-medium bg-emerald-400/10 px-2 py-1 rounded-lg">
                {stat.change}
                <ArrowUpRight size={14} className="ml-1" />
              </span>
            </div>
            <div className="relative z-10">
              <h3 className="text-4xl font-bold mb-1">{stat.value}</h3>
              <p className="text-muted-foreground text-sm font-medium">{stat.title}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area (Mock) */}
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
              Graphique d'engagement (Espace réservé)
            </p>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Activité Récente</h3>
            <button className="text-sm text-primary hover:underline">Tout voir</button>
          </div>
          <div className="space-y-4 flex-1">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4 items-start group">
                <div className="mt-1 relative">
                  {activity.type === 'success' && <CheckCircle2 size={18} className="text-emerald-500 relative z-10 bg-background" />}
                  {activity.type === 'pending' && <Clock size={18} className="text-blue-500 relative z-10 bg-background" />}
                  {activity.type === 'warning' && <Clock size={18} className="text-yellow-500 relative z-10 bg-background" />}
                  {activity.type === 'muted' && <FileText size={18} className="text-muted-foreground relative z-10 bg-background" />}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-[2px] h-full bg-white/10 -z-0 group-last:hidden"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="font-medium text-sm">{activity.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{activity.network}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20"></span>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
