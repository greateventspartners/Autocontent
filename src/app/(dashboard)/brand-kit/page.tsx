"use client";

import React, { useState, useEffect, useRef } from "react";
import { Palette, Search, Upload, Plus, Check, Wand2, AlertCircle, Save, Trash2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

type Color = { hex: string; name: string };

type BrandKitData = {
  id: string;
  name: string;
  logoUrl: string | null;
  colors: Color[];
  fonts: { keywords?: string } | null;
  toneOfVoice: string | null;
  doAndDonts: string | null;
  voiceSamples: string[] | null;
};

type BrandKitResponse = {
  brandKits?: BrandKitData[];
  brandKit?: BrandKitData;
  error?: string;
};

const DEFAULT_COLORS: Color[] = [
  { hex: "#4f46e5", name: "Primaire" },
  { hex: "#0f172a", name: "Sombre" },
  { hex: "#f8fafc", name: "Clair" },
  { hex: "#ef4444", name: "Accent" },
];

const TONE_OPTIONS = [
  { id: "corporate", label: "Corporate & Expert", desc: "Ton professionnel, inspire confiance", icon: "🏢" },
  { id: "friendly", label: "Friendly & Accessible", desc: "Chaleureux, décontracté, proche", icon: "👋" },
  { id: "humoristique", label: "Humoristique", desc: "Léger, espiègle, mémorable", icon: "😄" },
  { id: "technique", label: "Technique & Précis", desc: "Expert, factuel, détaillé", icon: "⚙️" },
];

export default function BrandKitPage() {
  const [brandKit, setBrandKit] = useState<BrandKitData | null>(null);
  const [colors, setColors] = useState<Color[]>(DEFAULT_COLORS);
  const [selectedTone, setSelectedTone] = useState("friendly");
  const [instructions, setInstructions] = useState("");
  const [keywords, setKeywords] = useState("");
  const [voiceSamples, setVoiceSamples] = useState<string[]>([]);
  const [voiceInput, setVoiceInput] = useState("");
  const [url, setUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/brand-kit")
      .then((res) => res.json() as Promise<BrandKitResponse>)
      .then((data) => {
        if (data.brandKits && data.brandKits.length > 0) {
          const bk = data.brandKits[0];
          setBrandKit(bk);
          if (bk.colors) setColors(bk.colors as Color[]);
          if (bk.toneOfVoice) {
            const match = TONE_OPTIONS.find((t) => t.label === bk.toneOfVoice);
            setSelectedTone(match?.id || "friendly");
          }
          if (bk.doAndDonts) setInstructions(bk.doAndDonts as string);
          if (bk.fonts) {
            const parsed = bk.fonts as { keywords?: string };
            if (parsed.keywords) setKeywords(parsed.keywords);
          }
          if (bk.logoUrl) setLogoUrl(bk.logoUrl);
          if (bk.voiceSamples && Array.isArray(bk.voiceSamples)) {
            setVoiceSamples(bk.voiceSamples as string[]);
          }
        } else {
          setSelectedTone("friendly");
          setInstructions("Nous tutoyons toujours notre audience. Nous utilisons des emojis de manière modérée (max 2 par post). Nous ne parlons jamais de politique ou de nos concurrents directs.");
          setKeywords("SaaS, Innovation, Gain de temps, Autocontent");
        }
      })
      .catch(() => setError("Impossible de charger le Brand Kit"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSaved(false);

    const toneLabel = TONE_OPTIONS.find((t) => t.id === selectedTone)?.label || "Friendly & Accessible";

    const payload = {
      name: "Brand Kit",
      logoUrl: logoUrl ?? undefined,
      colors,
      toneOfVoice: toneLabel,
      doAndDonts: instructions,
      voiceSamples: voiceSamples.length > 0 ? voiceSamples : undefined,
      fonts: { keywords },
    };

    try {
      const url_ = brandKit ? `/api/brand-kit/${brandKit.id}` : "/api/brand-kit";
      const method = brandKit ? "PUT" : "POST";

      const res = await fetch(url_, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json() as BrandKitResponse;
      if (!res.ok) throw new Error(data.error || "Erreur de sauvegarde");

      if (!brandKit && data.brandKit) setBrandKit(data.brandKit);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const analyzeSite = async () => {
    if (!url) return;
    setIsAnalyzing(true);
    setAnalyzeError("");
    try {
      const res = await fetch("/api/brand-kit/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json() as {
        error?: string;
        analysis?: { colors?: { hex: string; name: string }[]; toneOfVoice?: string; doAndDonts?: string; keywords?: string };
      };
      if (!res.ok) throw new Error(data.error || "Analyse impossible");
      const a = data.analysis;
      if (a?.colors?.length) setColors(a.colors);
      if (a?.toneOfVoice) {
        const match = TONE_OPTIONS.find((t) => t.label === a.toneOfVoice);
        if (match) setSelectedTone(match.id);
      }
      if (a?.doAndDonts) setInstructions(a.doAndDonts);
      if (a?.keywords) setKeywords(a.keywords);
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : "Erreur d'analyse");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogoUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const updateColor = (index: number, field: "hex" | "name", value: string) => {
    setColors((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const removeColor = (index: number) => {
    setColors((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brand Kit</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Identité visuelle et ton de voix de votre marque.</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white rounded-xl shadow-lg shadow-primary/20 font-medium text-sm flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60">
          {saving ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : saved ? <Check size={16} /> : <Save size={16} />}
          {saved ? "Enregistré !" : saving ? "Sauvegarde..." : "Enregistrer"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <AlertCircle size={16} className="shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* Website Analysis — Full Width */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-primary/8 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/12 transition-colors duration-500" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Wand2 className="text-primary" size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold">Analyse automatique</h3>
              <p className="text-xs text-muted-foreground">Extrait couleurs, ton et style depuis votre site web</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://votre-site.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/50" />
            </div>
            <button onClick={analyzeSite} disabled={!url || isAnalyzing}
              className="px-6 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-xl font-medium text-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2">
              {isAnalyzing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full" />
              ) : <><Sparkles size={14} /> Analyser</>}
            </button>
          </div>
          {analyzeError && <p className="text-xs text-red-400 mt-2">{analyzeError}</p>}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-bold mb-4">Logo</h3>
            <div className="flex gap-4 items-start">
              <button type="button" onClick={() => logoRef.current?.click()}
                className="w-28 h-28 rounded-2xl border-2 border-dashed border-white/[0.08] flex flex-col items-center justify-center text-muted-foreground hover:border-primary/40 hover:text-primary transition-all cursor-pointer bg-white/[0.02] overflow-hidden">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <><Upload size={22} className="mb-2" /><span className="text-[11px] font-medium">Uploader</span></>
                )}
              </button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
              {logoUrl && (
                <button type="button" onClick={() => setLogoUrl(null)}
                  className="text-xs text-red-400 hover:text-red-300 font-medium flex items-center gap-1 transition-colors">
                  <Trash2 size={12} /> Retirer
                </button>
              )}
            </div>
          </div>

          {/* Colors */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Couleurs</h3>
              <button onClick={() => setColors((prev) => [...prev, { hex: "#6366f1", name: `Couleur ${prev.length + 1}` }])}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <Plus size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {colors.map((color, i) => (
                <div key={i} className="flex flex-col items-center gap-2 group relative">
                  <label className="relative cursor-pointer">
                    <div className="w-14 h-14 rounded-2xl shadow-lg ring-2 ring-white/[0.06] group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.hex }} />
                    <input type="color" value={color.hex} onChange={(e) => updateColor(i, "hex", e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                  </label>
                  <input value={color.name} onChange={(e) => updateColor(i, "name", e.target.value)}
                    className="text-[11px] font-medium text-center bg-transparent border-none outline-none w-full text-foreground" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{color.hex}</p>
                  {colors.length > 1 && (
                    <button onClick={() => removeColor(i)}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500/80 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500">&times;</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Tone of Voice */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-bold mb-1">Ton éditorial</h3>
            <p className="text-xs text-muted-foreground mb-4">Personnalité de vos contenus.</p>
            <div className="grid grid-cols-2 gap-3">
              {TONE_OPTIONS.map((tone) => (
                <button key={tone.id} onClick={() => setSelectedTone(tone.id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${selectedTone === tone.id
                    ? "border-primary/40 bg-primary/[0.06] ring-1 ring-primary/20"
                    : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08]"}`}>
                  <div className="text-lg mb-1.5">{tone.icon}</div>
                  <p className={`text-sm font-medium ${selectedTone === tone.id ? "text-primary" : "text-foreground"}`}>{tone.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{tone.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-bold mb-1">Do&apos;s &amp; Don&apos;ts</h3>
            <p className="text-xs text-muted-foreground mb-3">Règles éditoriales pour l&apos;IA.</p>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)}
              className="w-full h-28 p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none placeholder:text-muted-foreground/40 transition-all" />
          </div>

          {/* Keywords */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-bold mb-1">Mots-clés</h3>
            <p className="text-xs text-muted-foreground mb-3">Termes associés à votre marque.</p>
            <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)}
              placeholder="SaaS, Innovation, Gain de temps..."
              className="w-full p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/40 transition-all" />
          </div>

          {/* Voice Samples */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-bold mb-1">Exemples de voix</h3>
            <p className="text-xs text-muted-foreground mb-3">Textes de référence pour calibrer le ton de l&apos;IA.</p>
            <div className="space-y-2 mb-3">
              {voiceSamples.map((sample, i) => (
                <div key={i} className="flex items-start gap-2 p-3 bg-white/[0.03] rounded-xl text-xs text-muted-foreground group">
                  <span className="flex-1 whitespace-pre-wrap leading-relaxed">{sample}</span>
                  <button type="button" onClick={() => setVoiceSamples((prev) => prev.filter((_, j) => j !== i))}
                    className="text-red-400/60 hover:text-red-400 shrink-0 mt-0.5 transition-colors">&times;</button>
                </div>
              ))}
            </div>
            <textarea value={voiceInput} onChange={(e) => setVoiceInput(e.target.value)}
              placeholder="Collez un exemple de post..."
              className="w-full h-20 p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none placeholder:text-muted-foreground/40 transition-all" />
            <button type="button"
              onClick={() => { if (!voiceInput.trim()) return; setVoiceSamples((prev) => [...prev, voiceInput.trim()]); setVoiceInput(""); }}
              disabled={!voiceInput.trim()}
              className="mt-2 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-40">
              + Ajouter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
