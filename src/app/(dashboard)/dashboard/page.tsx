"use client";

import { useState, useMemo, useEffect } from "react";
import { useUser } from "@/components/providers";
import { useRouter } from "next/navigation";
import {
  Palette, Sparkles, BarChart3, Key, FileText, Calendar, Plug, Layers,
} from "lucide-react";
import BrandSpace from "@/components/dashboard/BrandSpace";
import ContentSpace from "@/components/dashboard/ContentSpace";
import PerformanceSpace from "@/components/dashboard/PerformanceSpace";
import ApiKeysSpace from "@/components/dashboard/ApiKeysSpace";
import TemplatesSpace from "@/components/dashboard/TemplatesSpace";
import TopicsSpace from "@/components/dashboard/TopicsSpace";
import IntegrationsSpace from "@/components/dashboard/IntegrationsSpace";
import CarouselSpace from "@/components/dashboard/CarouselSpace";
import OnboardingSpace, { isOnboardingDone } from "@/components/dashboard/OnboardingSpace";
import { BrandKit, ContentItem, PublicationLog } from "@/lib/services/pulseforge-service";

const EMPTY_BRAND: BrandKit = {
  name: "",
  website: "",
  slogan: "",
  description: "",
  colors: { primary: "#8b5cf6", secondary: "#ec4899", background: "#0f172a" },
  tone: [],
  voiceRules: [],
  personas: [],
};

type ActiveSpace = "brand" | "content" | "performance" | "integrations" | "carousel" | "apiKeys" | "templates" | "topics";

const NAV_ITEMS = [
  { id: "brand" as const, label: "Brand", icon: Palette, description: "Identité, tons et personas" },
  { id: "content" as const, label: "Content", icon: Sparkles, description: "Génération, édition et calendrier" },
  { id: "performance" as const, label: "Stats", icon: BarChart3, description: "Performances et recommandations IA" },
  { id: "integrations" as const, label: "Connexions", icon: Plug, description: "Comptes réseaux et API" },
  { id: "carousel" as const, label: "Carrousels", icon: Layers, description: "Génération de carrousels multi-slides" },
  { id: "apiKeys" as const, label: "API", icon: Key, description: "Accès programmatique" },
  { id: "templates" as const, label: "Modèles", icon: FileText, description: "Prompts réutilisables" },
  { id: "topics" as const, label: "Sujets", icon: Calendar, description: "Sujets proposés par l'IA" },
];

export default function DashboardPage() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/sign-in");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const [activeSpace, setActiveSpace] = useState<ActiveSpace>("brand");
  const [brand, setBrand] = useState<BrandKit>(EMPTY_BRAND);
  const [contentList, setContentList] = useState<ContentItem[]>([]);
  const [publicationLogs, setPublicationLogs] = useState<PublicationLog[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isOnboardingDone() && user) setShowOnboarding(true);
  }, [user]);

  const handleAddPublishingLog = (log: { title: string; channel: string; status: "success" | "failed" }) => {
    const newLog: PublicationLog = {
      id: `log-${Date.now()}`,
      contentId: "",
      title: log.title,
      channel: log.channel,
      status: log.status,
      timestamp: new Date().toISOString(),
    };
    setPublicationLogs((prev) => [newLog, ...prev]);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <nav className="hidden lg:flex lg:w-72 flex-col border-r border-border bg-card/50 backdrop-blur-sm">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-white tracking-tight">
            <span className="text-primary">✦</span> Autocontent
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {user?.email ?? "Chargement..."}
          </p>
        </div>

        <div className="flex-1 p-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSpace(item.id)}
              className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                activeSpace === item.id
                  ? "bg-primary/10 border border-primary/30 text-white"
                  : "text-muted-foreground hover:text-white hover:bg-muted/30 border border-transparent"
              }`}
            >
              <div className="font-semibold text-sm">{item.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {user?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="text-white font-medium">{user?.user_metadata?.name ?? "Utilisateur"}</span>
              <span className="block text-[10px]">Connecté</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 p-4 sm:p-6 lg:p-10">
        {activeSpace === "brand" && <BrandSpace brand={brand} onUpdateBrand={setBrand} />}
        {activeSpace === "content" && (
          <ContentSpace
            brand={brand}
            contentList={contentList}
            onSetContentList={setContentList}
            onAddPublishingLog={handleAddPublishingLog}
          />
        )}
        {activeSpace === "performance" && <PerformanceSpace />}
        {activeSpace === "integrations" && <IntegrationsSpace />}
        {activeSpace === "carousel" && <CarouselSpace />}
        {activeSpace === "apiKeys" && <ApiKeysSpace />}
        {activeSpace === "templates" && <TemplatesSpace />}
        {activeSpace === "topics" && <TopicsSpace brandKitId={brand.id ?? ""} />}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center overflow-x-auto scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSpace === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSpace(item.id)}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 min-w-0 shrink-0 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-white"
                }`}
                style={{ flex: "1 0 auto", minWidth: "56px" }}
              >
                <Icon className={`h-5 w-5 ${isActive ? "fill-primary/20" : ""}`} />
                <span className="text-[10px] font-semibold leading-tight truncate w-full text-center">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {showOnboarding && <OnboardingSpace />}
    </div>
  );
}
