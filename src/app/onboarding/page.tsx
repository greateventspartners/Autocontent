"use client";

import React, { useState, useRef } from "react";
import {
  Palette,
  PenLine,
  Check,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  Sparkles,
  AlertCircle,
  Wand2,
  Search,
  Rocket,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";

type Color = { hex: string; name: string };

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

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "twitter", label: "X (Twitter)" },
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
  { id: "pinterest", label: "Pinterest" },
  { id: "wordpress", label: "WordPress" },
  { id: "medium", label: "Medium" },
];

const STEPS = [
  { id: 0, label: "Brand Kit", icon: Palette },
  { id: 1, label: "Bios", icon: PenLine },
  { id: 2, label: "Terminer", icon: Rocket },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);

  const [brandName, setBrandName] = useState("");
  const [colors, setColors] = useState<Color[]>(DEFAULT_COLORS);
  const [selectedTone, setSelectedTone] = useState("Friendly & Accessible");
  const [keywords, setKeywords] = useState("");
  const [instructions, setInstructions] = useState(
    "Nous tutoyons toujours notre audience. Nous utilisons des emojis de manière modérée (max 2 par post)."
  );
  const [voiceSamples, setVoiceSamples] = useState<string[]>([]);
  const [voiceInput, setVoiceInput] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["linkedin", "instagram", "facebook"]);

  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  const [bios, setBios] = useState<Record<string, string[]> | null>(null);
  const [generatingBios, setGeneratingBios] = useState(false);
  const [bioError, setBioError] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      const text = await res.text();
      if (!text) throw new Error("Réponse serveur vide");
      const data = JSON.parse(text) as {
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

  const generateBios = async () => {
    setGeneratingBios(true);
    setBioError("");
    try {
      const res = await fetch("/api/bio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const text = await res.text();
        if (!text) throw new Error("Réponse serveur vide");
        const data = JSON.parse(text) as { error?: string; bios?: Record<string, string[]> };
        if (data.bios) { setBios(data.bios); return; }
        throw new Error(data.error || "Génération impossible");
      }
      const text = await res.text();
      if (!text) { setBios({}); return; }
      const data = JSON.parse(text) as { error?: string; bios?: Record<string, string[]> };
      if (data.bios) setBios(data.bios);
      else setBios({});
    } catch (e) {
      setBioError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setGeneratingBios(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brandName || "Brand Kit",
          logoUrl,
          colors,
          toneOfVoice: selectedTone,
          doAndDonts: instructions,
          keywords,
          voiceSamples: voiceSamples.length > 0 ? voiceSamples : undefined,
          platforms: selectedPlatforms,
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        let msg = "Erreur lors de la sauvegarde";
        if (text) {
          try { const d = JSON.parse(text); msg = d.error || msg; } catch { /* keep default */ }
        }
        throw new Error(msg);
      }
      window.location.href = "/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setSaving(false);
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

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-xl">A</span>
        </div>
        <h1 className="text-lg font-bold tracking-tight">Configuration de votre espace</h1>
      </div>

      {/* Step indicators */}
      <div className="shrink-0 px-6 py-4 flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <React.Fragment key={s.id}>
              {i > 0 && <div className={`h-0.5 w-12 rounded ${done ? "bg-primary" : "bg-white/10"}`} />}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                active ? "bg-primary/20 text-primary" : done ? "bg-primary/10 text-primary" : "bg-white/5 text-muted-foreground"
              }`}>
                <Icon size={14} />
                {s.label}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Content */}
      <div className="onboarding-scroll px-6 pb-8 relative">
        <div className="max-w-3xl mx-auto mt-4">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
          {step === 0 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Identité de marque</h2>
                <p className="text-muted-foreground mt-1">Définissez le style visuel et éditorial de votre marque.</p>
              </div>

              {/* Analyze website */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
                  <Wand2 className="text-primary" size={18} />
                  Import depuis un site web
                </h3>
                <p className="text-sm text-muted-foreground mb-4">Entrez l&apos;URL de votre site pour extraire automatiquement vos couleurs et ton.</p>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://votre-site.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/70"
                    />
                  </div>
                  <button onClick={analyzeSite} disabled={!url || isAnalyzing}
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px]">
                    {isAnalyzing ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Search size={18} />
                      </motion.div>
                    ) : "Analyser"}
                  </button>
                </div>
                {analyzeError && <p className="text-sm text-red-400 mt-2">{analyzeError}</p>}
              </div>

              {/* Brand name */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Nom de la marque</h3>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Mon Entreprise"
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/70"
                />
              </div>

              {/* Logo */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4">Logo</h3>
                <div className="flex gap-4 items-start">
                  <button type="button" onClick={() => logoRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer bg-white/[0.02] overflow-hidden">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <><Upload size={24} className="mb-2" /><span className="text-xs font-medium">Logo</span></>
                    )}
                  </button>
                  {logoUrl && (
                    <button type="button" onClick={() => setLogoUrl(null)} className="text-xs text-destructive hover:underline">
                      Retirer
                    </button>
                  )}
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
                </div>
              </div>

              {/* Colors */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex justify-between items-center">
                  Couleurs
                  <button onClick={() => setColors((prev) => [...prev, { hex: "#000000", name: `Couleur ${prev.length + 1}` }])}
                    className="text-primary hover:bg-primary/10 p-1.5 rounded-lg transition-colors">
                    <Plus size={16} />
                  </button>
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {colors.map((color, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 group">
                      <label className="relative cursor-pointer">
                        <div className="w-12 h-12 rounded-full shadow-lg shadow-black/20 ring-2 ring-white/10 group-hover:scale-110 transition-transform"
                          style={{ backgroundColor: color.hex }} />
                        <input type="color" value={color.hex}
                          onChange={(e) => updateColor(i, "hex", e.target.value)}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                      </label>
                      <input value={color.name}
                        onChange={(e) => updateColor(i, "name", e.target.value)}
                        className="text-xs font-medium text-center bg-transparent border-none outline-none w-full" />
                      <p className="text-[10px] text-muted-foreground uppercase">{color.hex}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                  <Globe className="text-primary" size={18} />
                  Plateformes de publication
                </h3>
                <p className="text-sm text-muted-foreground mb-4">Sélectionnez les réseaux sur lesquels vous souhaitez publier.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PLATFORMS.map((platform) => {
                    const selected = selectedPlatforms.includes(platform.id);
                    return (
                      <button key={platform.id} onClick={() => togglePlatform(platform.id)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center gap-2 ${
                          selected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                        }`}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          selected ? "border-primary bg-primary" : "border-white/20"
                        }`}>
                          {selected && <Check size={10} className="text-white" />}
                        </div>
                        {platform.label}
                      </button>
                    );
                  })}
                </div>
                {selectedPlatforms.length === 0 && (
                  <p className="text-xs text-amber-400 mt-3">Sélectionnez au moins une plateforme pour continuer.</p>
                )}
              </div>

              {/* Tone */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-2">Ton Éditorial</h3>
                <p className="text-sm text-muted-foreground mb-4">Choisissez la personnalité de vos contenus.</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {TONE_OPTIONS.map((tone) => (
                    <button key={tone} onClick={() => setSelectedTone(tone)}
                      className={`p-3 text-sm font-medium rounded-xl border transition-all text-left ${
                        selectedTone === tone
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                      }`}>
                      {tone}
                    </button>
                  ))}
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Do&apos;s &amp; Don&apos;ts</label>
                    <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)}
                      className="w-full h-24 p-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Mots-clés</label>
                    <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)}
                      placeholder="SaaS, Innovation, Gain de temps..."
                      className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Exemples de voix de marque</label>
                    <div className="space-y-2 mb-3">
                      {voiceSamples.map((sample, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 bg-white/5 rounded-lg text-xs text-muted-foreground">
                          <span className="flex-1 whitespace-pre-wrap">{sample}</span>
                          <button type="button" onClick={() => setVoiceSamples((prev) => prev.filter((_, j) => j !== i))}
                            className="text-destructive hover:text-destructive/80 shrink-0 mt-0.5">✕</button>
                        </div>
                      ))}
                    </div>
                    <textarea value={voiceInput} onChange={(e) => setVoiceInput(e.target.value)}
                      placeholder="Collez un exemple de post..."
                      className="w-full h-20 p-3 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                    <button type="button"
                      onClick={() => { if (!voiceInput.trim()) return; setVoiceSamples((prev) => [...prev, voiceInput.trim()]); setVoiceInput(""); }}
                      disabled={!voiceInput.trim()}
                      className="mt-2 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50">
                      + Ajouter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Bios &amp; Profils</h2>
                  <p className="text-muted-foreground mt-1">Générez des bios optimisés pour chaque plateforme.</p>
                </div>
                <button onClick={generateBios} disabled={generatingBios}
                  className="px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 font-medium text-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50">
                  {generatingBios ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  ) : (
                    <Sparkles size={18} />
                  )}
                  {bios ? "Régénérer" : "Générer mes bios"}
                </button>
              </div>

              {bioError && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle size={16} className="shrink-0" /><span>{bioError}</span>
                </div>
              )}

              {!bios && !generatingBios && (
                <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
                  <Sparkles className="mx-auto mb-3 text-primary" size={28} />
                  Cliquez sur « Générer mes bios » pour créer des profils optimisés à partir de votre Brand Kit.
                </div>
              )}

              {generatingBios && (
                <div className="glass-card rounded-2xl p-12 text-center text-muted-foreground">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full mx-auto mb-4" />
                  <p>Génération des bios en cours...</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {PLATFORMS.filter((p) => selectedPlatforms.includes(p.id)).map((platform) => {
                  const variants = bios?.[platform.id] ?? [];
                  if (!bios) return null;
                  return (
                    <motion.div key={platform.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      className="glass-card rounded-2xl p-5 space-y-3">
                      <h3 className="font-bold">{platform.label}</h3>
                      {variants.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Aucune bio générée.</p>
                      ) : (
                        variants.map((text, i) => (
                          <div key={i} className="rounded-xl bg-black/20 p-3 text-sm">
                            <p className="whitespace-pre-wrap">{text}</p>
                          </div>
                        ))
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 text-center">
              <div>
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <Rocket className="text-primary" size={36} />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Tout est prêt !</h2>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Votre Brand Kit et vos bios ont été configurés. Vous pouvez commencer à créer du contenu avec le Copilot IA.
                </p>
              </div>

              {error && (
                <div className="flex items-center justify-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl max-w-md mx-auto">
                  <AlertCircle size={16} className="shrink-0" /><span>{error}</span>
                </div>
              )}

              <div className="glass-card rounded-2xl p-6 max-w-md mx-auto text-left space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Palette size={14} className="text-primary" />
                  </div>
                  <span><strong>{brandName || "Brand Kit"}</strong> — {colors.length} couleurs, {selectedTone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Globe size={14} className="text-primary" />
                  </div>
                  <span>{selectedPlatforms.length} plateforme{selectedPlatforms.length > 1 ? "s" : ""} : {selectedPlatforms.map((p) => PLATFORMS.find((pl) => pl.id === p)?.label).filter(Boolean).join(", ")}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <PenLine size={14} className="text-primary" />
                  </div>
                  <span>{bios ? Object.keys(bios).length : 0} plateformes avec bios générées</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => setStep((s) => s - 1)} disabled={step === 0}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 flex items-center gap-2">
          <ArrowLeft size={16} /> Retour
        </button>
        {step < 2 ? (
          <button onClick={() => {
              if (step === 0 && selectedPlatforms.length === 0) return;
              setStep((s) => s + 1);
            }}
            disabled={step === 0 && selectedPlatforms.length === 0}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 font-medium text-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed">
            Suivant <ArrowRight size={16} />
          </button>
        ) : (
          <button onClick={handleComplete} disabled={saving}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 font-bold text-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-70">
            {saving ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              <><Check size={18} /> Commencer</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
