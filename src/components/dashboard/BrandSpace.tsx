"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Sparkles,
  Plus,
  Trash2,
  RefreshCw,
  User,
  Save,
  AlertCircle,
  CheckCircle,
  Image,
  Upload,
} from "lucide-react";
import {
  BrandKit,
  flattenBrandKit,
  expandBrandKit,
  brandKitApi,
  mediaApi,
  MediaItem,
} from "@/lib/services/pulseforge-service";

interface BrandSpaceProps {
  brand: BrandKit;
  onUpdateBrand: (updatedBrand: BrandKit) => void;
}

export default function BrandSpace({ brand, onUpdateBrand }: BrandSpaceProps) {
  const [savedId, setSavedId] = useState<string | null>(brand.id ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Crawl state
  const [crawlUrl, setCrawlUrl] = useState("");
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlStep, setCrawlStep] = useState(0);
  const [crawlLogs, setCrawlLogs] = useState<string[]>([]);

  // Field editors
  const [newRule, setNewRule] = useState("");
  const [newTone, setNewTone] = useState("");
  const [newPersonaName, setNewPersonaName] = useState("");
  const [newPersonaRole, setNewPersonaRole] = useState("");
  const [newPersonaBio, setNewPersonaBio] = useState("");
  const [showAddPersona, setShowAddPersona] = useState(false);

  // Asset bank state
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const crawlSteps = [
    "Connexion au serveur distant et analyse du DOM...",
    "Extraction sémantique du slogan et des métadonnées...",
    "Identification des codes couleurs dominants (couleurs de marque)...",
    "Cartographie de la voix et des règles éditoriales...",
    "Modélisation des personas cibles...",
  ];

  // Load brand kits on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const kits = await brandKitApi.list();
        if (!cancelled && kits.length > 0) {
          const flat = flattenBrandKit(kits[0]);
          setSavedId(flat.id ?? null);
          onUpdateBrand(flat);
        }
      } catch (err: unknown) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = useCallback(async () => {
    try {
      setIsSaving(true);
      setSaveStatus("idle");
      const data = expandBrandKit(brand);
      if (savedId) {
        await brandKitApi.update(savedId, data);
        onUpdateBrand({ ...brand, id: savedId });
      } else {
        const created = await brandKitApi.create(data);
        setSavedId(created.id!);
        onUpdateBrand({ ...brand, id: created.id });
      }
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  }, [brand, savedId, onUpdateBrand]);

  const handleCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlUrl) return;

    setIsCrawling(true);
    setCrawlStep(0);
    setCrawlLogs([]);

    for (let i = 0; i < crawlSteps.length; i++) {
      setCrawlStep(i);
      setCrawlLogs((prev) => [...prev, crawlSteps[i]]);
      await new Promise((r) => setTimeout(r, 600));
    }

    try {
      const result = await brandKitApi.analyze(crawlUrl);
      onUpdateBrand(flattenBrandKit(result));
      setCrawlUrl("");
    } catch (err: unknown) {
      alert("Erreur lors de l'analyse : " + (err instanceof Error ? err.message : "inconnue"));
    } finally {
      setIsCrawling(false);
    }
  };

  const handleAddField = (field: "tone" | "voiceRules") => {
    if (field === "tone" && newTone.trim()) {
      if (!brand.tone.includes(newTone.trim())) {
        onUpdateBrand({ ...brand, tone: [...brand.tone, newTone.trim()] });
      }
      setNewTone("");
      setSaveStatus("idle");
    } else if (field === "voiceRules" && newRule.trim()) {
      onUpdateBrand({
        ...brand,
        voiceRules: [...brand.voiceRules, newRule.trim()],
      });
      setNewRule("");
      setSaveStatus("idle");
    }
  };

  const handleRemoveField = (field: "tone" | "voiceRules", index: number) => {
    if (field === "tone") {
      onUpdateBrand({
        ...brand,
        tone: brand.tone.filter((_, i) => i !== index),
      });
    } else {
      onUpdateBrand({
        ...brand,
        voiceRules: brand.voiceRules.filter((_, i) => i !== index),
      });
    }
    setSaveStatus("idle");
  };

  const handleAddPersona = () => {
    if (newPersonaName && newPersonaRole && newPersonaBio) {
      onUpdateBrand({
        ...brand,
        personas: [
          ...brand.personas,
          { name: newPersonaName, role: newPersonaRole, bio: newPersonaBio },
        ],
      });
      setNewPersonaName("");
      setNewPersonaRole("");
      setNewPersonaBio("");
      setShowAddPersona(false);
      setSaveStatus("idle");
    }
  };

  const handleRemovePersona = (index: number) => {
    onUpdateBrand({
      ...brand,
      personas: brand.personas.filter((_, i) => i !== index),
    });
    setSaveStatus("idle");
  };

  useEffect(() => {
    if (!brand.id) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await mediaApi.list(brand.id);
        if (!cancelled) setMediaList(list);
      } catch {
        // ignore
      }
    })();
    return () => { cancelled = true; };
  }, [brand.id]);

  const handleUpload = async (file: File) => {
    if (!file || !brand.id) return;
    setIsUploading(true);
    try {
      await mediaApi.upload(file, brand.id);
      const list = await mediaApi.list(brand.id);
      setMediaList(list);
    } catch (err: unknown) {
      alert("Erreur upload : " + (err instanceof Error ? err.message : "inconnue"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleUpload(file);
  };

  const handleDeleteMedia = async (id: string) => {
    try {
      await mediaApi.delete(id);
      setMediaList((prev) => prev.filter((m) => m.id !== id));
    } catch (err: unknown) {
      alert("Erreur suppression : " + (err instanceof Error ? err.message : "inconnue"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <span className="ml-3 text-sm text-zinc-400">Chargement du Brand Kit...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400 text-sm">
        <AlertCircle className="h-5 w-5 mr-2" />
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Espace Brand Kit & Voix
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Définissez l&apos;identité de votre marque, extrayez-la depuis votre site ou
            configurez manuellement vos personas et règles d'écriture.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-primary hover:bg-opacity-90 disabled:opacity-50 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saveStatus === "saved" ? "Enregistré ✓" : "Enregistrer"}
        </button>
      </div>

      {saveStatus === "saved" && (
        <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2">
          <CheckCircle className="h-4 w-4" />
          Brand Kit enregistré avec succès
        </div>
      )}
      {saveStatus === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
          <AlertCircle className="h-4 w-4" />
           Erreur lors de l&apos;enregistrement
        </div>
      )}

      {/* Website Ingestion */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Globe className="h-48 w-48 text-primary" />
        </div>

        <div className="relative z-10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" /> Import Automatique de Site Web
          </h3>
          <p className="mt-1 text-sm text-zinc-400 max-w-2xl">
            Entrez l&apos;URL de votre site pour extraire automatiquement votre identité de
            marque.
          </p>

          {!isCrawling ? (
            <form onSubmit={handleCrawl} className="mt-4 flex flex-col sm:flex-row gap-3 max-w-xl">
              <input
                type="text"
                placeholder="Ex: pulseforge.ai, eco-green.fr, fitlife.com"
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
                className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-primary placeholder:text-zinc-600 transition"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-opacity-90 text-white px-5 py-3 text-sm font-semibold transition cursor-pointer"
              >
                <Sparkles className="h-4 w-4" /> Analyser
              </button>
            </form>
          ) : (
            <div className="mt-6 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white flex items-center gap-3">
                  <RefreshCw className="h-4 w-4 text-primary animate-spin" /> Analyse en
                  cours...
                </span>
                <span className="text-xs text-zinc-500">
                  {crawlStep + 1} / {crawlSteps.length}
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-pink-500 transition-all duration-500"
                  style={{
                    width: `${((crawlStep + 1) / crawlSteps.length) * 100}%`,
                  }}
                />
              </div>
              <div className="space-y-1.5 font-mono text-[11px] text-zinc-400">
                {crawlLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
            <span>Sites de démo :</span>
            <button
              type="button"
              onClick={() => setCrawlUrl("eco-green.fr")}
              className="underline hover:text-white transition"
            >
              eco-green.fr
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setCrawlUrl("fitlife.com")}
              className="underline hover:text-white transition"
            >
              fitlife.com
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setCrawlUrl("pulseforge.ai")}
              className="underline hover:text-white transition"
            >
              pulseforge.ai
            </button>
          </div>
        </div>
      </div>

      {/* Brand Identity Form */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 space-y-6">
          <h3 className="text-lg font-semibold text-white">Identité Fondamentale</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Nom de la marque
              </label>
              <input
                type="text"
                value={brand.name}
                onChange={(e) => {
                  onUpdateBrand({ ...brand, name: e.target.value });
                  setSaveStatus("idle");
                }}
                className="mt-1.5 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Site Internet
              </label>
              <input
                type="text"
                value={brand.website}
                onChange={(e) => {
                  onUpdateBrand({ ...brand, website: e.target.value });
                  setSaveStatus("idle");
                }}
                className="mt-1.5 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Slogan
            </label>
            <input
              type="text"
              value={brand.slogan}
              onChange={(e) => {
                onUpdateBrand({ ...brand, slogan: e.target.value });
                setSaveStatus("idle");
              }}
              className="mt-1.5 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Description
            </label>
            <textarea
              rows={3}
              value={brand.description}
              onChange={(e) => {
                onUpdateBrand({ ...brand, description: e.target.value });
                setSaveStatus("idle");
              }}
              className="mt-1.5 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Palette Graphique
            </label>
            <div className="flex flex-wrap gap-2 sm:gap-4">
              {["primary", "secondary", "background"].map((key) => (
                <div
                  key={key}
                  className="flex items-center gap-1.5 sm:gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2"
                >
                  <span
                    className="h-5 w-5 sm:h-6 sm:w-6 rounded-full border border-zinc-700 shrink-0"
                    style={{
                      backgroundColor: brand.colors[key as keyof typeof brand.colors],
                    }}
                  />
                  <input
                    type="text"
                    value={brand.colors[key as keyof typeof brand.colors]}
                    onChange={(e) => {
                      onUpdateBrand({
                        ...brand,
                        colors: { ...brand.colors, [key]: e.target.value },
                      });
                      setSaveStatus("idle");
                    }}
                    className="text-[11px] sm:text-xs text-zinc-400 font-mono bg-transparent w-16 sm:w-20 focus:outline-none"
                  />
                  <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase">
                    ({key})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tone & Voice Rules */}
        <div className="glass-panel p-6 rounded-2xl space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">Ton de Marque</h3>

            <div className="flex flex-wrap gap-2">
              {brand.tone.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 bg-primary/20 text-primary border border-primary/30 rounded-lg px-2.5 py-1 text-xs font-medium"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveField("tone", idx)}
                    className="hover:text-red-400 transition"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Pédagogique, Cynique..."
                value={newTone}
                onChange={(e) => setNewTone(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddField("tone"))
                }
                className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => handleAddField("tone")}
                className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 text-xs text-white cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800/80 space-y-4">
            <h4 className="text-sm font-semibold text-white">
              Consignes d&apos;écriture (Voice Rules)
            </h4>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {brand.voiceRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 items-start bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/40"
                >
                  <span className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-zinc-300 flex-1 leading-relaxed">
                    {rule}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveField("voiceRules", idx)}
                    className="text-zinc-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Consigne: Éviter le jargon technique..."
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), handleAddField("voiceRules"))
                }
                className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => handleAddField("voiceRules")}
                className="rounded-lg bg-primary hover:bg-opacity-90 px-3 text-xs text-white font-medium cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Personas */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Personas Cibles
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Ces personnages représentent les cibles de vos générations IA.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddPersona(!showAddPersona)}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-opacity-80 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />{" "}
            {showAddPersona ? "Annuler" : "Ajouter un persona"}
          </button>
        </div>

        {showAddPersona && (
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl mb-6 space-y-4">
            <h4 className="text-sm font-semibold text-white">
              Créer un nouveau persona
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400">
                  Prénom / Nom
                </label>
                <input
                  type="text"
                  placeholder="Ex: Thomas"
                  value={newPersonaName}
                  onChange={(e) => setNewPersonaName(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400">
                  Rôle / Métier
                </label>
                <input
                  type="text"
                  placeholder="Ex: Responsable Marketing"
                  value={newPersonaRole}
                  onChange={(e) => setNewPersonaRole(e.target.value)}
                  className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400">
                Biographie & Comportement
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Préfère les formats courts et chiffrés..."
                value={newPersonaBio}
                onChange={(e) => setNewPersonaBio(e.target.value)}
                className="mt-1 w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAddPersona}
                className="bg-primary hover:bg-opacity-90 px-4 py-2 rounded-lg text-xs font-semibold text-white cursor-pointer"
              >
                Enregistrer le Persona
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {brand.personas.map((pers, idx) => (
            <div
              key={idx}
              className="bg-zinc-950/40 border border-zinc-800/80 p-4 rounded-xl flex items-start gap-4 relative group"
            >
              <div className="bg-primary/10 rounded-lg p-2 text-primary">
                <User className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white">{pers.name}</h4>
                <div className="text-[11px] font-medium text-primary uppercase tracking-wide">
                  {pers.role}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pt-1">
                  {pers.bio}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemovePersona(idx)}
                className="absolute top-4 right-4 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition duration-200"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Bank */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" /> Banque d&apos;Assets
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Gérez les visuels, logos et templates de votre marque.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !brand.id}
            className="flex items-center gap-2 bg-primary hover:bg-opacity-90 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-semibold text-white transition cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Upload..." : "Upload Asset"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-zinc-800 bg-zinc-950/30"
          }`}
        >
          {mediaList.length === 0 ? (
            <div className="py-8">
              <Upload className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-500">
                Glissez-déposez vos images ici ou{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:underline cursor-pointer"
                >
                  parcourez
                </button>
              </p>
              <p className="text-xs text-zinc-600 mt-2">
                PNG, JPG, WebP — 10 Mo max
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {mediaList.map((media) => (
                <div
                  key={media.id}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={media.url}
                    alt={media.fileName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDeleteMedia(media.id)}
                      className="bg-red-500/80 hover:bg-red-500 p-2 rounded-full text-white transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-[10px] text-white truncate">
                      {media.fileName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
