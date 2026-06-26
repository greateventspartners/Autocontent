"use client";

import React, { useState } from "react";
import { Settings, Globe, ChevronRight, Check, Unlink, Link2 } from "lucide-react";
import { motion } from "framer-motion";

interface Platform {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  color: string;
}

const platforms: Platform[] = [
  { id: "facebook", name: "Facebook", icon: "f", connected: false, color: "#1877F2" },
  { id: "instagram", name: "Instagram", icon: "ig", connected: false, color: "#E4405F" },
  { id: "linkedin", name: "LinkedIn", icon: "in", connected: false, color: "#0A66C2" },
  { id: "twitter", name: "X (Twitter)", icon: "X", connected: false, color: "#000000" },
  { id: "tiktok", name: "TikTok", icon: "tt", connected: false, color: "#000000" },
  { id: "youtube", name: "YouTube", icon: "YT", connected: false, color: "#FF0000" },
  { id: "pinterest", name: "Pinterest", icon: "P", connected: false, color: "#BD081C" },
  { id: "wordpress", name: "WordPress", icon: "W", connected: false, color: "#21759B" },
  { id: "medium", name: "Medium", icon: "M", connected: false, color: "#000000" },
  { id: "threads", name: "Threads", icon: "th", connected: false, color: "#000000" },
];

export default function SettingsPage() {
  const [platformsState, setPlatformsState] = useState(platforms);
  const [saved, setSaved] = useState(false);

  const togglePlatform = (id: string) => {
    setPlatformsState((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: !p.connected } : p))
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="text-primary" size={28} />
            Paramètres
          </h2>
          <p className="text-muted-foreground mt-1">
            Gérez vos plateformes de publication et les préférences de votre compte.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 font-medium text-sm flex items-center gap-2 transition-transform active:scale-95"
        >
          <Check size={16} />
          {saved ? "Enregistré !" : "Enregistrer"}
        </button>
      </div>

      {/* Plateformes de publication */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
            <Globe className="text-primary" size={18} />
            Plateformes de publication
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Activez les plateformes sur lesquelles vous souhaitez publier du contenu.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {platformsState.map((platform, i) => (
              <motion.button
                key={platform.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => togglePlatform(platform.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  platform.connected
                    ? "border-primary/40 bg-primary/5"
                    : "border-white/10 dark:border-white/10 bg-white/[0.02] dark:bg-white/[0.02] hover:bg-white/5 dark:hover:bg-white/5"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: platform.color }}
                >
                  {platform.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{platform.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {platform.connected ? "Connecté" : "Non connecté"}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    platform.connected
                      ? "bg-primary border-primary"
                      : "border-white/20"
                  }`}
                >
                  {platform.connected && <Check size={14} className="text-primary-foreground" />}
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Link2 className="text-primary" size={20} />
          </div>
          <div>
            <h4 className="font-bold text-sm mb-1">Connexion aux réseaux</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pour commencer à publier, connectez chacun de vos comptes en cliquant
              sur la plateforme souhaitée. Vous serez redirigé vers le service
              concerné pour autoriser la connexion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
