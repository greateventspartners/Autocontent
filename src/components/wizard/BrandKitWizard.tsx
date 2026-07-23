"use client";

import React, { useState } from "react";
import { Wizard, type WizardStep } from "@/components/wizard/Wizard";
import {
  Globe, Palette, PenLine, Rocket, Plus, X, Search,
} from "lucide-react";
import { motion } from "framer-motion";

const STEPS: WizardStep[] = [
  { id: "website", label: "Site web", icon: Globe, optional: true },
  { id: "identity", label: "Identité", icon: Palette },
  { id: "voice", label: "Voix", icon: PenLine },
  { id: "confirm", label: "Confirmer", icon: Rocket },
];

const TONES = [
  { id: "corporate", label: "Corporate", desc: "Professionnel et structuré", emoji: "🏢" },
  { id: "friendly", label: "Friendly", desc: "Chaleureux et accessible", emoji: "👋" },
  { id: "humorous", label: "Humoristique", desc: "Léger et drôle", emoji: "😄" },
  { id: "technical", label: "Technique", desc: "Précis et expert", emoji: "⚙️" },
];

const DEFAULT_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];

interface BrandKitWizardProps {
  onComplete: (data: {
    brandName: string;
    websiteUrl?: string;
    colors: { name: string; hex: string }[];
    tone: string;
    doAndDonts: string;
    keywords: string;
  }) => void;
  onSkip: () => void;
}

export default function BrandKitWizard({ onComplete, onSkip }: BrandKitWizardProps) {
  const [brandName, setBrandName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [colors, setColors] = useState(
    DEFAULT_COLORS.map((hex, i) => ({ name: `Couleur ${i + 1}`, hex }))
  );
  const [tone, setTone] = useState("friendly");
  const [doAndDonts, setDoAndDonts] = useState("");
  const [keywords, setKeywords] = useState("");

  const addColor = () => {
    if (colors.length >= 8) return;
    setColors([...colors, { name: `Couleur ${colors.length + 1}`, hex: "#6366f1" }]);
  };

  const removeColor = (i: number) => {
    setColors(colors.filter((_, idx) => idx !== i));
  };

  const updateColor = (i: number, field: "name" | "hex", value: string) => {
    setColors(colors.map((c, idx) => (idx === i ? { ...c, [field]: value } : c)));
  };

  const canProceed = (step: number) => {
    if (step === 1) return brandName.trim().length > 0;
    return true;
  };

  const handleAnalyze = async () => {
    if (!websiteUrl.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/brand-kit/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl }),
      });
      const data: {
        colors?: string[];
        toneOfVoice?: string;
        keywords?: string | string[];
        doAndDonts?: string;
      } = await res.json();
      if (data.colors && Array.isArray(data.colors)) {
        setColors(data.colors.slice(0, 8).map((c: string, i: number) => ({
          name: `Couleur ${i + 1}`,
          hex: c,
        })));
      }
      if (data.toneOfVoice) setTone(data.toneOfVoice.toLowerCase().split(" ")[0]);
      if (data.keywords) setKeywords(Array.isArray(data.keywords) ? data.keywords.join(", ") : data.keywords);
      if (data.doAndDonts) setDoAndDonts(typeof data.doAndDonts === "string" ? data.doAndDonts : "");
    } catch { /* noop */ }
    setAnalyzing(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Wizard
        steps={STEPS}
        onFinish={() => onComplete({ brandName, websiteUrl, colors, tone, doAndDonts, keywords })}
        finishLabel="Enregistrer"
        canProceed={canProceed}
      >
        {/* Step 1: Website (optional) */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold">Analysez votre site web</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Entrez votre URL pour extraire automatiquement les couleurs, le ton et les mots-clés.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://votre-site.com"
              className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !websiteUrl.trim()}
              className="px-5 py-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {analyzing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full" />
              ) : (
                <><Search size={16} /> Analyser</>
              )}
            </button>
          </div>

          <p className="text-[11px] text-muted-foreground text-center">
            Optionnel — vous pouvez personnaliser manuellement à l&apos;étape suivante.
          </p>
        </div>

        {/* Step 2: Identity */}
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold">Identité visuelle</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Définissez le nom et les couleurs de votre marque.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nom de la marque</label>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Mon Entreprise"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-muted-foreground">Palette de couleurs</label>
              <button
                onClick={addColor}
                disabled={colors.length >= 8}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <Plus size={14} /> Ajouter
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {colors.map((c, i) => (
                <div key={i} className="relative group">
                  <div className="flex items-center gap-2 p-2 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    <input
                      type="color"
                      value={c.hex}
                      onChange={(e) => updateColor(i, "hex", e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                    <input
                      value={c.name}
                      onChange={(e) => updateColor(i, "name", e.target.value)}
                      className="flex-1 bg-transparent text-xs focus:outline-none min-w-0"
                    />
                  </div>
                  {colors.length > 1 && (
                    <button
                      onClick={() => removeColor(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step 3: Voice */}
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold">Voix et ton</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Comment votre marque communique-t-elle ?
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-3 block">Ton de voix</label>
            <div className="grid grid-cols-2 gap-3">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTone(t.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    tone === t.id
                      ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20"
                      : "border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="text-2xl mb-2 block">{t.emoji}</span>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mots-clés</label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="marketing, IA, automatisation..."
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Séparés par des virgules — intégrés naturellement dans le contenu généré.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Do&apos;s & Don&apos;ts</label>
            <textarea
              value={doAndDonts}
              onChange={(e) => setDoAndDonts(e.target.value)}
              placeholder="DO: Utiliser un ton professionnel, citer des chiffres&#10;DON'T: Utiliser du jargon technique, faire des promesses exagérées"
              className="w-full h-24 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        {/* Step 4: Confirm */}
        <div className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold">Récapitulatif</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Vérifiez les informations avant d&apos;enregistrer.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Marque</span>
              <span className="text-sm font-medium">{brandName || "Non défini"}</span>
            </div>
            {websiteUrl && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Site web</span>
                <span className="text-sm font-medium text-primary truncate max-w-[200px]">{websiteUrl}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Couleurs</span>
              <div className="flex gap-1">
                {colors.map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border border-white/10" style={{ backgroundColor: c.hex }} />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Ton</span>
              <span className="text-sm font-medium">{TONES.find((t) => t.id === tone)?.label || tone}</span>
            </div>
            {keywords && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mots-clés</span>
                <span className="text-sm font-medium text-right max-w-[200px] truncate">{keywords}</span>
              </div>
            )}
          </div>
        </div>
      </Wizard>

      <div className="text-center mt-6">
        <button
          onClick={onSkip}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Passer et configurer plus tard
        </button>
      </div>
    </div>
  );
}
