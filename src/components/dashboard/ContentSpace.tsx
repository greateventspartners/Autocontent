"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar as CalendarIcon,
  Sparkles,
  FileText,
  Globe,
  Mail,
  Megaphone,
  Clock,
  Check,
  Play,
  Share2,
  Trash2,
  AlertCircle,
  RefreshCw,
  Save,
} from "lucide-react";
import { PlatformIcon, getChannelLabel } from "@/components/PlatformIcon";
import PostPreview from "@/components/PostPreview";
import {
  BrandKit,
  ContentItem,
  Campaign,
  contentApi,
  campaignApi,
  analyticsApi,
  BestTimeSuggestion,
  reviewApi,
  flattenContentItem,
  expandContentItem,
} from "@/lib/services/pulseforge-service";

interface ContentSpaceProps {
  brand: BrandKit;
  contentList: ContentItem[];
  onSetContentList: (list: ContentItem[]) => void;
  onAddPublishingLog: (log: {
    title: string;
    channel: string;
    status: "success" | "failed";
  }) => void;
}

export default function ContentSpace({
  brand,
  contentList,
  onSetContentList,
  onAddPublishingLog,
}: ContentSpaceProps) {
  const [topic, setTopic] = useState("");
  const [contentType, setContentType] = useState<
    "social" | "blog" | "email" | "ad"
  >("social");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generationType, setGenerationType] = useState<"single" | "calendar" | "multi" | "repurpose">(
    "single"
  );
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "LINKEDIN", "INSTAGRAM", "FACEBOOK", "X",
  ]);
  const [longText, setLongText] = useState("");

  const ALL_CHANNELS = ["LINKEDIN", "INSTAGRAM", "FACEBOOK", "X", "PINTEREST", "WORDPRESS"];
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 20;

  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [activeVariant, setActiveVariant] = useState<"a" | "b">("a");
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [calendarView, setCalendarView] = useState<"grid" | "list">("grid");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null
  );
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [campaignColor, setCampaignColor] = useState("#8b5cf6");
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [bestTimeSuggestions, setBestTimeSuggestions] = useState<Record<string, BestTimeSuggestion[]> | null>(null);
  const [bestTimeLoading, setBestTimeLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewUrl, setReviewUrl] = useState<string | null>(null);
  const [reviewCopied, setReviewCopied] = useState(false);
  const [reviewEmail, setReviewEmail] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);

  const pipelineSteps = [
    "Lecture du contexte de marque et voix...",
    "Recherche d'embeddings associés à la marque...",
    "Création des prompts et génération des variantes A/B...",
    "Évaluation de la cohérence et scoring...",
    "Réécriture et formatage selon les canaux cibles...",
    "Assemblage final du plan de contenu...",
  ];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const res = await contentApi.list({ page: "1", limit: String(PAGE_SIZE) });
        if (cancelled) return;
        const items = (res.items ?? []).map(flattenContentItem);
        onSetContentList(items);
        setHasMore(res.total > PAGE_SIZE);
        setPage(1);
      } catch (err: unknown) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Erreur");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await campaignApi.list();
        if (!cancelled) setCampaigns(list);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const handleCreateReview = async () => {
    if (!selectedItem) return;
    try {
      setReviewLoading(true);
      setReviewUrl(null);
      const res = await reviewApi.create(
        selectedItem.id,
        reviewEmail || undefined
      );
      setReviewUrl(res.reviewUrl);
    } catch {
      alert("Erreur lors de la création du lien");
    } finally {
      setReviewLoading(false);
    }
  };

  const handleCopyReviewLink = async () => {
    if (!reviewUrl) return;
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setReviewCopied(true);
      setTimeout(() => setReviewCopied(false), 2000);
    } catch {
      alert("Impossible de copier");
    }
  };

  const loadBestTime = async () => {
    try {
      setBestTimeLoading(true);
      const res = await analyticsApi.bestTime();
      setBestTimeSuggestions(res.suggestions);
    } catch {
      setBestTimeSuggestions(null);
    } finally {
      setBestTimeLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) return;
    try {
      const c = await campaignApi.create({
        name: newCampaignName.trim(),
        color: campaignColor,
      });
      setCampaigns((prev) => [...prev, c]);
      setNewCampaignName("");
      setShowCampaignForm(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await campaignApi.delete(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      if (selectedCampaignId === id) setSelectedCampaignId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleDropOnDay = async (
    itemId: string,
    date: Date,
    campaignId?: string | null
  ) => {
    try {
      await contentApi.reschedule(itemId, {
        scheduledDate: date.toISOString(),
        campaignId: campaignId ?? undefined,
      });
      const res = await contentApi.list();
      const items = (res.items ?? []).map(flattenContentItem);
      onSetContentList(items);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erreur");
    }
    setDragItemId(null);
  };

  const filteredContent = selectedCampaignId
    ? contentList.filter((item) => (item as any).campaignId === selectedCampaignId)
    : contentList;

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await contentApi.list({ page: String(nextPage), limit: String(PAGE_SIZE) });
      const items = (res.items ?? []).map(flattenContentItem);
      onSetContentList([...contentList, ...items]);
      setPage(nextPage);
      setHasMore(nextPage * PAGE_SIZE < res.total);
    } catch {
    } finally {
      setLoadingMore(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.id) {
      alert("Veuillez d'abord enregistrer un Brand Kit.");
      return;
    }
    if (!topic.trim()) return;

    setIsGenerating(true);
    setGenerationStep(0);

    for (let i = 0; i < pipelineSteps.length; i++) {
      setGenerationStep(i);
      await new Promise((r) => setTimeout(r, 400));
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let rawItems: any[];

      if (generationType === "multi") {
        rawItems = await contentApi.generateMulti({
          brandKitId: brand.id,
          topic: topic.trim(),
          channels: selectedChannels,
        });
      } else if (generationType === "repurpose") {
        rawItems = await contentApi.repurpose({
          brandKitId: brand.id,
          longText: longText.trim(),
          channels: selectedChannels,
        });
      } else {
        const count = generationType === "calendar" ? 8 : 1;
        rawItems = await contentApi.generate({
          brandKitId: brand.id,
          topic: topic.trim(),
          contentType: contentType.toUpperCase(),
          count,
        });
      }

      const items = (rawItems ?? []).map(flattenContentItem);
      onSetContentList([...items, ...contentList]);
      if (items.length > 0) setSelectedItem(items[0]);
      setTopic("");
      setLongText("");
    } catch (err: unknown) {
      alert("Erreur génération : " + (err instanceof Error ? err.message : "inconnue"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (!selectedItem) return;
    const title = titleRef.current?.value ?? selectedItem.title;
    const content = contentRef.current?.value ?? (activeVariant === "a" ? selectedItem.variants.a : selectedItem.variants.b);
    setIsSaving(true);
    setSaveStatus("saving");
    try {
      const data = expandContentItem({
        ...selectedItem,
        title,
        content,
        variants: {
          ...selectedItem.variants,
          ...(activeVariant === "a" ? { a: content } : { b: content }),
        },
      });
      await contentApi.update(selectedItem.id, data);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  }, [selectedItem, activeVariant]);

  const handleStatusChange = async (
    id: string,
    newStatus: "draft" | "scheduled" | "published"
  ) => {
    try {
      if (newStatus === "scheduled") {
        await contentApi.schedule(id, new Date().toISOString());
      }
      // Refresh list
      const res = await contentApi.list();
      const items = (res.items ?? []).map(flattenContentItem);
      onSetContentList(items);
      const updated = items.find((i) => i.id === id);
      if (updated) setSelectedItem(updated);
    } catch (err: unknown) {
      alert("Erreur : " + (err instanceof Error ? err.message : "inconnue"));
    }
  };

  const handlePublishNow = async (item: ContentItem) => {
    setIsPublishing(true);
    try {
      await contentApi.publish(item.id);
      const res = await contentApi.list();
      const items = (res.items ?? []).map(flattenContentItem);
      onSetContentList(items);
      onAddPublishingLog({
        title: item.title,
        channel: item.channel,
        status: "success",
      });
    } catch {
      onAddPublishingLog({
        title: item.title,
        channel: item.channel,
        status: "failed",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await contentApi.delete(id);
      onSetContentList(contentList.filter((item) => item.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err: unknown) {
      alert("Erreur suppression : " + (err instanceof Error ? err.message : "inconnue"));
    }
  };

  // UI helpers
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "scheduled":
        return "bg-primary/20 text-primary-foreground border-primary/30";
      default:
        return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getChannelIcon = (channel: string) => (
    <PlatformIcon channel={channel} />
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <span className="ml-3 text-sm text-zinc-400">
          Chargement du contenu...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Espace Content
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Générez des contenus multicanaux calibrés, éditez-les et planifiez
            votre calendrier de publication.
          </p>
        </div>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
          <AlertCircle className="h-4 w-4" />
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left: Generator & List */}
        <div className="xl:col-span-1 space-y-8">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" /> Assistant IA
              Marketing
            </h3>

            {!isGenerating ? (
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setGenerationType("single")}
                    className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition ${
                      generationType === "single"
                        ? "bg-primary text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Unique
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerationType("multi")}
                    className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition ${
                      generationType === "multi" || generationType === "repurpose"
                        ? "bg-primary text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Multi-Post
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenerationType("calendar")}
                    className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition ${
                      generationType === "calendar"
                        ? "bg-primary text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Calendrier
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                    Sujet
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Le futur des architectures Cloud..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-1.5 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                {generationType === "single" && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                      Format
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          id: "social" as const,
                          label: "Post Réseaux",
                          icon: <Share2 className="h-3.5 w-3.5" />,
                        },
                        {
                          id: "blog" as const,
                          label: "Article Blog",
                          icon: <Globe className="h-3.5 w-3.5" />,
                        },
                        {
                          id: "email" as const,
                          label: "Newsletter",
                          icon: <Mail className="h-3.5 w-3.5" />,
                        },
                        {
                          id: "ad" as const,
                          label: "Ad Copy (A/B)",
                          icon: <Megaphone className="h-3.5 w-3.5" />,
                        },
                      ].map((format) => (
                        <button
                          key={format.id}
                          type="button"
                          onClick={() => setContentType(format.id)}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition ${
                            contentType === format.id
                              ? "border-primary bg-primary/10 text-white font-semibold"
                              : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {format.icon}
                          {format.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {(generationType === "multi" || generationType === "repurpose") && (
                  <div className="space-y-4">
                    <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setGenerationType("multi")}
                        className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition ${
                          generationType === "multi"
                            ? "bg-primary text-white"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Générer
                      </button>
                      <button
                        type="button"
                        onClick={() => setGenerationType("repurpose")}
                        className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition ${
                          generationType === "repurpose"
                            ? "bg-primary text-white"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        Recycler
                      </button>
                    </div>

                    {generationType === "repurpose" && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                          Texte source (blog, article, événement...)
                        </label>
                        <textarea
                          rows={6}
                          required
                          placeholder="Collez votre article de blog, compte-rendu d'événement ou contenu long à recycler..."
                          value={longText}
                          onChange={(e) => setLongText(e.target.value)}
                          className="mt-1.5 w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-primary resize-none"
                        />
                      </div>
                    )}
                    {generationType === "multi" && (
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1.5">
                          Canaux cibles
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {ALL_CHANNELS.map((ch) => (
                            <button
                              key={ch}
                              type="button"
                              onClick={() =>
                                setSelectedChannels((prev) =>
                                  prev.includes(ch)
                                    ? prev.filter((c) => c !== ch)
                                    : [...prev, ch]
                                )
                              }
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition ${
                                selectedChannels.includes(ch)
                                  ? "border-primary bg-primary/10 text-white font-semibold"
                                  : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white"
                              }`}
                            >
                              <PlatformIcon channel={ch} />
                              {getChannelLabel(ch)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-opacity-90 text-white py-3 text-xs font-semibold transition cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  {generationType === "single" && "Lancer la génération"}
                  {generationType === "calendar" && "Générer le plan mensuel"}
                  {generationType === "multi" && "Générer les posts multicanaux"}
                  {generationType === "repurpose" && "Recycler le contenu"}
                </button>
              </form>
            ) : (
              <div className="space-y-5 p-2 animate-pulse-subtle">
                <div className="flex items-center gap-3">
                  <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                  <span className="text-sm font-semibold text-white">
                    Pipeline d&apos;orchestration IA...
                  </span>
                </div>
                <div className="space-y-3 pl-8 border-l border-zinc-800">
                  {pipelineSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`text-xs flex items-center gap-2.5 transition ${
                        idx === generationStep
                          ? "text-white font-medium"
                          : idx < generationStep
                          ? "text-zinc-500"
                          : "text-zinc-700"
                      }`}
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${
                          idx === generationStep
                            ? "bg-primary"
                            : idx < generationStep
                            ? "bg-green-500"
                            : "bg-zinc-800"
                        }`}
                      />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Contenus Récents
              </h3>
              <span className="text-xs bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full text-zinc-500 font-mono">
                {contentList.length}
              </span>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {contentList.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  Aucun contenu. Lancez l&apos;assistant IA ci-dessus.
                </div>
              ) : (
                contentList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      selectedItem?.id === item.id
                        ? "border-primary/50 bg-primary/5"
                        : "border-zinc-800/80 bg-zinc-950/20 hover:bg-zinc-900/20"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-semibold text-white truncate flex-1">
                        {item.title}
                      </h4>
                      <span
                        className={`text-[9px] uppercase font-semibold px-2 py-0.5 rounded border ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1.5">
                        {getChannelIcon(item.channel)}
                        <span>{getChannelLabel(item.channel)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.scheduledDate).toLocaleDateString(
                          "fr-FR",
                          { day: "2-digit", month: "2-digit" }
                        )}
                      </span>
                    </div>
                  </button>
                ))
              )}
              {hasMore && (
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="w-full py-2.5 mt-2 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loadingMore ? (
                    <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Chargement...</>
                  ) : (
                    "Charger plus"
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Campaign Manager */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Campagnes
              </h3>
              <button
                type="button"
                onClick={() => setShowCampaignForm(!showCampaignForm)}
                className="text-primary hover:text-opacity-80 text-xs cursor-pointer"
              >
                {showCampaignForm ? "Annuler" : "+ Nouvelle"}
              </button>
            </div>

            {showCampaignForm && (
              <div className="space-y-3 bg-zinc-950/60 border border-zinc-800 p-4 rounded-xl">
                <input
                  type="text"
                  placeholder="Nom de la campagne"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleCreateCampaign()
                  }
                  className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={campaignColor}
                    onChange={(e) => setCampaignColor(e.target.value)}
                    className="h-7 w-7 rounded cursor-pointer border-0"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCampaign}
                    className="flex-1 bg-primary hover:bg-opacity-90 text-white py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Créer
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelectedCampaignId(null)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center gap-2 ${
                  selectedCampaignId === null
                    ? "bg-primary/10 text-white font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Tous les contenus
              </button>
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 group"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCampaignId(
                        selectedCampaignId === c.id ? null : c.id
                      )
                    }
                    className={`flex-1 text-left px-3 py-2 rounded-lg text-xs transition flex items-center gap-2 ${
                      selectedCampaignId === c.id
                        ? "bg-primary/10 text-white font-semibold"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.name}
                    {c._count && (
                      <span className="text-[10px] text-zinc-600 ml-auto">
                        {c._count.contentItems}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCampaign(c.id)}
                    className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition text-xs cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {campaigns.length === 0 && !showCampaignForm && (
                <p className="text-xs text-zinc-600 text-center py-3">
                  Aucune campagne
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right: Editor & Calendar */}
        <div className="xl:col-span-2 space-y-8">
          {selectedItem ? (
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="text-xs text-zinc-400 hover:text-white transition flex items-center gap-1"
                >
                  ← Retour au calendrier
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500">
                    Score de marque :
                  </span>
                  <div className="bg-primary/20 text-primary border border-primary/30 rounded-lg px-2 py-0.5 text-xs font-mono font-bold">
                    {selectedItem.score}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  ref={titleRef}
                  type="text"
                  defaultValue={selectedItem.title}
                  key={`title-${selectedItem.id}-${activeVariant}`}
                  className="flex-1 text-lg font-bold text-white bg-transparent border-b border-zinc-800 py-1 focus:outline-none focus:border-primary transition"
                />
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 bg-primary hover:bg-opacity-90 disabled:opacity-50 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition cursor-pointer"
                >
                  {isSaving ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {saveStatus === "saved" ? "✓" : "Sauver"}
                </button>
              </div>

              <div className="space-y-3" key={`editor-${selectedItem.id}-${activeVariant}`}>
                <div className="flex justify-between items-center bg-zinc-950 p-1.5 rounded-xl border border-zinc-800/60">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveVariant("a")}
                      className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${
                        activeVariant === "a"
                          ? "bg-zinc-900 text-white border border-zinc-800"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Variante A ({selectedItem.variants.scoreA}%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveVariant("b")}
                      className={`text-xs font-semibold px-4 py-2 rounded-lg transition ${
                        activeVariant === "b"
                          ? "bg-zinc-900 text-white border border-zinc-800"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      Variante B ({selectedItem.variants.scoreB}%)
                    </button>
                  </div>
                </div>
                <textarea
                  ref={contentRef}
                  rows={12}
                  defaultValue={activeVariant === "a" ? selectedItem.variants.a : selectedItem.variants.b}
                  key={`content-${selectedItem.id}-${activeVariant}`}
                  className="w-full rounded-xl bg-zinc-950 border border-zinc-800 p-4 text-sm text-zinc-300 font-mono leading-relaxed focus:outline-none focus:border-primary"
                />
              </div>

              {/* Preview */}
              <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-zinc-400 hover:text-white transition"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Aperçu {getChannelLabel(selectedItem.channel)}
                  </span>
                  <span className="text-zinc-600">{showPreview ? "▲" : "▼"}</span>
                </button>
                {showPreview && (
                  <div className="px-4 pb-4">
                    <PostPreview
                      channel={selectedItem.channel}
                      title={selectedItem.title}
                      content={activeVariant === "a" ? selectedItem.variants.a : selectedItem.variants.b}
                    />
                  </div>
                )}
              </div>

              {/* Review */}
              <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-zinc-400 hover:text-white transition"
                >
                  <span className="flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-primary" />
                    Partager pour révision
                  </span>
                  <span className="text-zinc-600">{showReviewForm ? "▲" : "▼"}</span>
                </button>
                {showReviewForm && (
                  <div className="px-4 pb-4 space-y-3">
                    <input
                      type="email"
                      value={reviewEmail}
                      onChange={(e) => setReviewEmail(e.target.value)}
                      placeholder="Email du relecteur (optionnel)"
                      className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreateReview}
                        disabled={reviewLoading}
                        className="flex-1 bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        {reviewLoading ? "Génération..." : "Générer le lien"}
                      </button>
                    </div>
                    {reviewUrl && (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-2">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                          Lien de révision
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={reviewUrl}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-[11px] text-zinc-300 font-mono truncate"
                          />
                          <button
                            type="button"
                            onClick={handleCopyReviewLink}
                            className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded text-xs font-semibold transition cursor-pointer"
                          >
                            {reviewCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              "Copier"
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-800/80">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="datetime-local"
                      value={selectedItem.scheduledDate.substring(0, 16)}
                      onChange={async (e) => {
                        const date = new Date(e.target.value).toISOString();
                        try {
                          await contentApi.schedule(selectedItem.id, date);
                          const res = await contentApi.list();
                          const items = (res.items ?? []).map(
                            flattenContentItem
                          );
                          onSetContentList(items);
                        } catch (err: unknown) {
                          alert(err instanceof Error ? err.message : "Erreur");
                        }
                      }}
                      className="rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    {(
                      [
                        "draft",
                        "scheduled",
                        "published",
                      ] as ContentItem["status"][]
                    ).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleStatusChange(selectedItem.id, s)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition ${
                          selectedItem.status === s
                            ? s === "published"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : s === "scheduled"
                              ? "bg-primary/20 text-primary-foreground border-primary/30"
                              : "bg-zinc-800 text-white border-zinc-700"
                            : "bg-transparent text-zinc-500 border-zinc-800/60 hover:text-white"
                        }`}
                      >
                        {s === "draft"
                          ? "Brouillon"
                          : s === "scheduled"
                          ? "Programmé"
                          : "Publié"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col justify-end items-end gap-3">
                  {selectedItem.status !== "published" && (
                    <button
                      type="button"
                      disabled={isPublishing}
                      onClick={() => handlePublishNow(selectedItem)}
                      className="flex items-center gap-1.5 bg-primary hover:bg-opacity-90 px-4 py-2.5 rounded-xl text-xs font-semibold text-white transition disabled:opacity-50 cursor-pointer"
                    >
                      {isPublishing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />{" "}
                          Publication...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" /> Publier Immédiatement
                        </>
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(selectedItem.id)}
                    className="text-xs text-red-500 hover:text-red-400 transition flex items-center gap-1.5 mt-2"
                  >
                    <Trash2 className="h-4 w-4" /> Supprimer
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" /> Calendrier
                  Éditorial
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadBestTime}
                    disabled={bestTimeLoading}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition px-2 py-1 rounded-lg border border-zinc-800/60 hover:border-zinc-700 disabled:opacity-50 cursor-pointer"
                  >
                    {bestTimeLoading ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    Meilleur moment
                  </button>
                  {bestTimeSuggestions && (
                    <div className="relative group">
                      <button
                        type="button"
                        className="text-xs text-primary hover:text-opacity-80 px-2 py-1 rounded-lg border border-primary/30 cursor-pointer"
                      >
                        {Object.keys(bestTimeSuggestions).length - 1} canaux
                      </button>
                      <div className="absolute right-0 top-full mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition pointer-events-auto z-20">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-3">
                          Meilleurs moments
                        </p>
                        <div className="space-y-3">
                          {Object.entries(bestTimeSuggestions).map(
                            ([ch, days]) =>
                              ch !== "all" && (
                                <div key={ch}>
                                  <p className="text-xs font-semibold text-white uppercase mb-1">
                                    {getChannelLabel(ch)}
                                  </p>
                                  <div className="space-y-0.5">
                                    {days.slice(0, 3).map((d) => (
                                      <p
                                        key={d.dayOfWeek}
                                        className="text-[11px] text-zinc-400"
                                      >
                                        {d.dayOfWeek} —{" "}
                                        {d.hour.toString().padStart(2, "0")}:
                                        00
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setCalendarView("grid")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                      calendarView === "grid"
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    Grille
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarView("list")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                      calendarView === "list"
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    Liste
                  </button>
                </div>
              </div>
            </div>

            {calendarView === "grid" ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <div className="min-w-[700px] space-y-4 px-2 sm:px-0">
                  <div className="flex items-center justify-between">
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs font-semibold text-zinc-400 flex-1">
                      {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(
                        (d) => (
                          <div key={d}>{d}</div>
                        )
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-[70px] sm:auto-rows-[110px]">
                    {Array.from({ length: 14 }).map((_, idx) => {
                      const date = new Date();
                      date.setDate(date.getDate() - 2 + idx + 1);
                      const dayItems = filteredContent.filter((item) => {
                        const d = new Date(item.scheduledDate);
                        return (
                          d.getDate() === date.getDate() &&
                          d.getMonth() === date.getMonth()
                        );
                      });
                      return (
                        <div
                          key={idx}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => {
                            if (dragItemId)
                              handleDropOnDay(dragItemId, date);
                          }}
                          className="bg-zinc-950/20 border border-zinc-900 rounded-lg p-2 flex flex-col justify-between hover:border-zinc-800 transition"
                        >
                          <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                            <span>{date.getDate()}</span>
                            {dayItems.length > 0 && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </div>
                          <div className="space-y-1 overflow-y-auto max-h-[70px]">
                            {dayItems.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                draggable
                                onDragStart={() => setDragItemId(item.id)}
                                onClick={() => setSelectedItem(item)}
                                className={`w-full text-left text-[9px] truncate p-1 rounded border leading-tight ${getStatusColor(
                                  item.status
                                )}`}
                              >
                                {item.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredContent.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 text-xs">
                      Aucun contenu. Utilisez l&apos;assistant pour générer vos
                      publications.
                    </div>
                  ) : (
                    [...filteredContent]
                      .sort(
                        (a, b) =>
                          new Date(a.scheduledDate).getTime() -
                          new Date(b.scheduledDate).getTime()
                      )
                      .map((item) => (
                        <div
                          key={item.id}
                          className="bg-zinc-950/30 border border-zinc-900/80 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:border-zinc-800 transition"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-zinc-400 shrink-0">
                              {getChannelIcon(item.channel)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-semibold text-white truncate">
                                {item.title}
                              </h4>
                              <p className="text-xs text-zinc-400 truncate mt-0.5">
                                {item.summary}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                            <div className="text-left sm:text-right min-w-0">
                              <div className="text-[11px] sm:text-xs text-white font-semibold whitespace-nowrap">
                                {new Date(item.scheduledDate).toLocaleDateString(
                                  "fr-FR",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                  }
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono whitespace-nowrap">
                                {new Date(item.scheduledDate).toLocaleTimeString(
                                  "fr-FR",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>
                            </div>
                            <span
                              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border shrink-0 ${getStatusColor(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedItem(item)}
                              className="text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg text-white font-medium cursor-pointer shrink-0"
                            >
                              Éditer
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
