"use client";

import React, { useState } from "react";
import { Palette, Search, Upload, Plus, Check, Wand2 } from "lucide-react";
import { motion } from "framer-motion";

export default function BrandKitPage() {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const simulateAnalysis = () => {
    if (!url) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Palette className="text-primary" size={28} />
            Brand Kit & Identité
          </h2>
          <p className="text-muted-foreground mt-1">Gérez l'identité visuelle et le ton de voix de votre marque pour l'IA.</p>
        </div>
        <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 font-medium text-sm flex items-center gap-2 transition-transform active:scale-95">
          <Check size={16} /> Enregistrer
        </button>
      </div>

      {/* Auto Ingestion Tool */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Wand2 className="text-primary" size={18} />
            Import Magique depuis un site web
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Entrez l'URL de votre site web pour que notre IA extraie automatiquement vos couleurs, polices et votre style éditorial.</p>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                type="url" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://votre-site.com" 
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/70"
              />
            </div>
            <button 
              onClick={simulateAnalysis}
              disabled={!url || isAnalyzing}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center min-w-[140px]"
            >
              {isAnalyzing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Search size={18} />
                </motion.div>
              ) : (
                "Analyser"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Visual Identity */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Logo & Icônes</h3>
            <div className="flex gap-4">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer bg-white/[0.02]">
                <Upload size={24} className="mb-2" />
                <span className="text-xs font-medium">Logo principal</span>
              </div>
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer bg-white/[0.02]">
                <Upload size={24} className="mb-2" />
                <span className="text-xs font-medium">Favicon</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex justify-between items-center">
              Couleurs (HEX)
              <button className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors"><Plus size={16}/></button>
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { hex: "#4f46e5", name: "Primaire" },
                { hex: "#0f172a", name: "Sombre" },
                { hex: "#f8fafc", name: "Clair" },
                { hex: "#ef4444", name: "Accent" }
              ].map((color, i) => (
                <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                  <div className="w-12 h-12 rounded-full shadow-lg shadow-black/20 ring-2 ring-white/10 group-hover:scale-110 transition-transform" style={{ backgroundColor: color.hex }}></div>
                  <div className="text-center">
                    <p className="text-xs font-medium">{color.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{color.hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tone of Voice */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Ton Éditorial (Tone of Voice)</h3>
            <p className="text-sm text-muted-foreground mb-4">Définissez la personnalité de l'IA lorsqu'elle génère du contenu pour cette marque.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {["Corporate & Expert", "Friendly & Accessible", "Humoristique", "Technique & Précis"].map((tone, i) => (
                <button key={i} className={`p-3 text-sm font-medium rounded-xl border transition-all text-left ${i === 1 ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'}`}>
                  {tone}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Instructions Spécifiques</label>
                <textarea 
                  defaultValue="Nous tutoyons toujours notre audience. Nous utilisons des emojis de manière modérée (max 2 par post). Nous ne parlons jamais de politique ou de nos concurrents directs."
                  className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-muted-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Mots-clés de la Marque</label>
                <input 
                  type="text" 
                  defaultValue="SaaS, Innovation, Gain de temps, Autopilot"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-muted-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
