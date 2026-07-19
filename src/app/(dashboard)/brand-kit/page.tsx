"use client";

import React, { useState, useEffect, useRef } from "react";
import { Palette, Search, Upload, Plus, Check, Wand2, AlertCircle } from "lucide-react";
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
  "Corporate & Expert",
  "Friendly & Accessible",
  "Humoristique",
  "Technique & Précis",
];

export default function BrandKitPage() {
  const [brandKit, setBrandKit] = useState<BrandKitData | null>(null);
  const [colors, setColors] = useState<Color[]>(DEFAULT_COLORS);
  const [selectedTone, setSelectedTone] = useState("");
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
          if (bk.toneOfVoice) setSelectedTone(bk.toneOfVoice as string);
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
          setSelectedTone(TONE_OPTIONS[1]);
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

    const payload = {
      name: "Brand Kit",
      logoUrl: logoUrl ?? undefined,
      colors,
      toneOfVoice: selectedTone,
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
      setTimeout(() => setSaved(false), 2000);
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
        analysis?: {
          colors?: { hex: string; name: string }[];
          toneOfVoice?: string;
          doAndDonts?: string;
          keywords?: string;
        };
      };
      if (!res.ok) throw new Error(data.error || "Analyse impossible");

      const a = data.analysis;
      if (a?.colors?.length) setColors(a.colors);
      if (a?.toneOfVoice) setSelectedTone(a.toneOfVoice);
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
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const updateColor = (index: number, field: "hex" | "name", value: string) => {
    setColors((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Palette className="text-primary" size={28} />
            Brand Kit & Identité
          </h2>
          <p className="text-muted-foreground mt-1">Gérez l&apos;identité visuelle et le ton de voix de votre marque pour l&apos;IA.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 font-medium text-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-70"
        >
          {saving ? (
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
            />
          ) : (
            <Check size={16} />
          )}
          {saved ? "Enregistré !" : saving ? "Sauvegarde..." : "Enregistrer"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6 relative overflow-hidden group">
        <div className="absolute -right-12 -top-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-500"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
            <Wand2 className="text-primary" size={18} />
            Import Magique depuis un site web
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Entrez l&apos;URL de votre site web pour que notre IA extraie automatiquement vos couleurs, polices et votre style éditorial.</p>
          <div className="flex flex-col sm:flex-row gap-3">
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
                onClick={analyzeSite}
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
          {analyzeError && (
            <p className="text-sm text-red-400 mt-2">{analyzeError}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Logo & Icônes</h3>
            <div className="flex gap-4 items-start">
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer bg-white/[0.02] overflow-hidden relative"
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <>
                    <Upload size={24} className="mb-2" />
                    <span className="text-xs font-medium">Logo principal</span>
                  </>
                )}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  onClick={() => setLogoUrl(null)}
                  className="text-xs text-destructive hover:underline"
                >
                  Retirer
                </button>
              )}
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 flex justify-between items-center">
              Couleurs (HEX)
              <button
                onClick={() => setColors((prev) => [...prev, { hex: "#000000", name: `Couleur ${prev.length + 1}` }])}
                className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors"
              >
                <Plus size={16} />
              </button>
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {colors.map((color, i) => (
                <div key={i} className="flex flex-col items-center gap-2 group cursor-pointer">
                  <label className="relative cursor-pointer">
                    <div className="w-12 h-12 rounded-full shadow-lg shadow-black/20 ring-2 ring-white/10 group-hover:scale-110 transition-transform" style={{ backgroundColor: color.hex }}></div>
                    <input
                      type="color"
                      value={color.hex}
                      onChange={(e) => updateColor(i, "hex", e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                  </label>
                  <input
                    value={color.name}
                    onChange={(e) => updateColor(i, "name", e.target.value)}
                    className="text-xs font-medium text-center bg-transparent border-none outline-none w-full"
                  />
                  <p className="text-[10px] text-muted-foreground uppercase">{color.hex}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4">Ton Éditorial (Tone of Voice)</h3>
            <p className="text-sm text-muted-foreground mb-4">Définissez la personnalité de l&apos;IA lorsqu&apos;elle génère du contenu pour cette marque.</p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone}
                  onClick={() => setSelectedTone(tone)}
                  className={`p-3 text-sm font-medium rounded-xl border transition-all text-left ${
                    selectedTone === tone
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Instructions spécifiques (Do & Don&apos;ts)</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full h-32 p-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Mots-clés de la Marque</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="SaaS, Innovation, Gain de temps..."
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Exemples de voix de marque</label>
                <p className="text-xs text-muted-foreground mb-2">
                  Collez des exemples de textes qui représentent bien le ton de votre marque.
                  L&apos;IA s&apos;en servira comme référence pour générer du contenu similaire.
                </p>
                <div className="space-y-2 mb-3">
                  {voiceSamples.map((sample, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-white/5 rounded-lg text-xs text-muted-foreground">
                      <span className="flex-1 whitespace-pre-wrap">{sample}</span>
                      <button
                        type="button"
                        onClick={() => setVoiceSamples((prev) => prev.filter((_, j) => j !== i))}
                        className="text-destructive hover:text-destructive/80 shrink-0 mt-0.5"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <textarea
                    value={voiceInput}
                    onChange={(e) => setVoiceInput(e.target.value)}
                    placeholder="Collez un exemple de post, tweet, ou texte de votre marque..."
                    className="flex-1 h-20 p-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!voiceInput.trim()) return;
                    setVoiceSamples((prev) => [...prev, voiceInput.trim()]);
                    setVoiceInput("");
                  }}
                  disabled={!voiceInput.trim()}
                  className="mt-2 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  + Ajouter cet exemple
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
