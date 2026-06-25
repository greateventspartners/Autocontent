"use client"

import { useState, useRef } from "react"
import {
  Sparkles,
  Palette,
  Zap,
  CheckCircle,
  ArrowRight,
  ChevronLeft,
  Globe,
  Smartphone,
  Briefcase,
  Camera,
  Hash,
  ThumbsUp,
  SkipForward,
  PartyPopper,
  Image,
  ArrowUpRight,
  Wand2,
  RefreshCw,
} from "lucide-react"

export const ONBOARDING_KEY = "autocontent_onboarding_done"

export function isOnboardingDone(): boolean {
  if (typeof window === "undefined") return true
  return localStorage.getItem(ONBOARDING_KEY) === "true"
}

export function completeOnboarding() {
  localStorage.setItem(ONBOARDING_KEY, "true")
}

export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY)
}

interface StepProps {
  onNext: () => void
  onSkip: () => void
  onBack?: () => void
  isFirst: boolean
  isLast: boolean
}

interface BrandStepData {
  name: string
  slogan: string
  color: string
}

const STEPS = [
  "Bienvenue",
  "Marque",
  "Contenu",
  "Connexions",
  "Prêt",
] as const

type StepId = (typeof STEPS)[number]

const COLORS = [
  { label: "Violet", value: "#8b5cf6" },
  { label: "Rose", value: "#ec4899" },
  { label: "Bleu", value: "#3b82f6" },
  { label: "Vert", value: "#10b981" },
  { label: "Orange", value: "#f59e0b" },
  { label: "Rouge", value: "#ef4444" },
]

export default function OnboardingSpace() {
  const [stepIndex, setStepIndex] = useState(0)
  const [animDir, setAnimDir] = useState<"next" | "prev">("next")
  const [brandData, setBrandData] = useState<BrandStepData>({
    name: "",
    slogan: "",
    color: "#8b5cf6",
  })
  const [topic, setTopic] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const currentStep = STEPS[stepIndex]

  const goTo = (index: number, dir: "next" | "prev") => {
    setAnimDir(dir)
    setStepIndex(index)
  }

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) goTo(stepIndex + 1, "next")
  }

  const handleBack = () => {
    if (stepIndex > 0) goTo(stepIndex - 1, "prev")
  }

  const handleSkip = () => {
    completeOnboarding()
    window.location.reload()
  }

  const handleFinish = () => {
    completeOnboarding()
    window.location.reload()
  }

  const handleGenerateFirstContent = async () => {
    if (!topic.trim()) return
    setGenerating(true)
    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          contentType: "SOCIAL",
          brandKitId: "default",
          count: 1,
        }),
      })
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      const content = data?.[0]?.variantA || data?.[0]?.content || `Contenu généré pour "${topic}"`
      setGeneratedContent(content)
    } catch {
      setGeneratedContent(`[Contenu généré pour "${topic}"]\n\nDécouvrez comment ${topic.toLowerCase()} peut transformer votre stratégie marketing. L'automatisation intelligente est la clé pour un contenu cohérent et performant.`)
    } finally {
      setGenerating(false)
    }
  }

  const PROGRESS = ((stepIndex + 1) / STEPS.length) * 100

  const platformIcons: Record<string, React.ReactNode> = {
    LinkedIn: <Briefcase className="h-4 w-4" />,
    Instagram: <Camera className="h-4 w-4" />,
    "X (Twitter)": <Hash className="h-4 w-4" />,
    Facebook: <ThumbsUp className="h-4 w-4" />,
    TikTok: <Smartphone className="h-4 w-4" />,
    WordPress: <Globe className="h-4 w-4" />,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl">
      <div className="w-full max-w-2xl mx-auto px-6">
        {/* Progress bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((step, i) => (
              <button
                key={step}
                type="button"
                onClick={() => i < stepIndex && goTo(i, "prev")}
                disabled={i > stepIndex}
                className={`flex items-center gap-2 text-xs font-medium transition cursor-pointer ${
                  i === stepIndex
                    ? "text-primary"
                    : i < stepIndex
                    ? "text-emerald-400"
                    : "text-zinc-600"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition ${
                    i === stepIndex
                      ? "bg-primary/20 text-primary"
                      : i < stepIndex
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-zinc-900 text-zinc-600"
                  }`}
                >
                  {i < stepIndex ? <CheckCircle className="h-3 w-3" /> : i + 1}
                </div>
                <span className="hidden sm:inline">{step}</span>
              </button>
            ))}
          </div>
          <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${PROGRESS}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="relative overflow-hidden min-h-[400px]">
          <div
            className={`transition-all duration-300 ease-in-out ${
              animDir === "next" ? "animate-fade-in" : "animate-fade-in"
            }`}
            key={currentStep}
          >
            {/* Step 1: Welcome */}
            {currentStep === "Bienvenue" && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/15 flex items-center justify-center">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    Bienvenue sur <span className="text-primary">Autocontent</span>
                  </h1>
                  <p className="mt-3 text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
                    L&apos;IA qui crée, décline et planifie vos contenus marketing
                    sur tous vos canaux en un clic.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                  {[
                    { icon: Wand2, label: "Génération IA", desc: "Contenu optimisé par marque" },
                    { icon: Palette, label: "Identité", desc: "Tons, voix et personas" },
                    { icon: Zap, label: "Multi-canal", desc: "Publiez partout" },
                  ].map((feat) => (
                    <div
                      key={feat.label}
                      className="glass-panel rounded-xl p-3 text-center"
                    >
                      <feat.icon className="h-5 w-5 text-primary mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-white">{feat.label}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{feat.desc}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2 bg-primary hover:bg-opacity-90 text-white px-8 py-3 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Commencer
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-xs text-zinc-500 hover:text-zinc-400 transition cursor-pointer"
                  >
                    Passer
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Brand */}
            {currentStep === "Marque" && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
                    <Palette className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Configurez votre marque</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Donnez à Autocontent les clés de votre identité pour des contenus personnalisés.
                  </p>
                </div>

                <div className="glass-panel rounded-2xl p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                      Nom de votre marque / entreprise
                    </label>
                    <input
                      type="text"
                      value={brandData.name}
                      onChange={(e) => setBrandData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Autocontent, EcoGreen, etc."
                      className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-primary placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                      Slogan (optionnel)
                    </label>
                    <input
                      type="text"
                      value={brandData.slogan}
                      onChange={(e) => setBrandData((prev) => ({ ...prev, slogan: e.target.value }))}
                      placeholder="Ex: Your brand. Autopiloted."
                      className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-primary placeholder:text-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                      Couleur principale
                    </label>
                    <div className="flex gap-2">
                      {COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setBrandData((prev) => ({ ...prev, color: c.value }))}
                          className={`w-8 h-8 rounded-full transition cursor-pointer ${
                            brandData.color === c.value
                              ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110"
                              : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-400 transition cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Retour
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="text-xs text-zinc-500 hover:text-zinc-400 transition cursor-pointer"
                    >
                      Plus tard
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!brandData.name.trim()}
                      className="flex items-center gap-2 bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
                    >
                      Suivant
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Content */}
            {currentStep === "Contenu" && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
                    <Wand2 className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Créez votre premier contenu</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Testez la puissance de l&apos;IA générative de Autocontent.
                  </p>
                </div>

                <div className="glass-panel rounded-2xl p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                      Sujet de votre premier post
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Ex: Les tendances marketing en 2026"
                      className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm text-white focus:outline-none focus:border-primary placeholder:text-zinc-600"
                      onKeyDown={(e) => e.key === "Enter" && handleGenerateFirstContent()}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateFirstContent}
                    disabled={generating || !topic.trim()}
                    className="flex items-center gap-2 bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    {generating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {generating ? "Génération..." : "Générer un post"}
                  </button>

                  {generatedContent && (
                    <div
                      ref={contentRef}
                      className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 animate-fade-in"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                          Contenu généré
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {generatedContent}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-400 transition cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Retour
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="text-xs text-zinc-500 hover:text-zinc-400 transition cursor-pointer"
                    >
                      Passer
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 bg-primary hover:bg-opacity-90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
                    >
                      Suivant
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Connect */}
            {currentStep === "Connexions" && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/15 flex items-center justify-center mb-4">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Connectez vos plateformes</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    Publiez automatiquement sur tous vos canaux depuis Autocontent.
                  </p>
                </div>

                <div className="glass-panel rounded-2xl p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {["LinkedIn", "Instagram", "Facebook", "X (Twitter)", "TikTok", "WordPress"].map(
                      (platform) => (
                        <div
                          key={platform}
                          className="flex items-center gap-2.5 bg-zinc-900 rounded-xl px-3 py-2.5 border border-zinc-800"
                        >
                          <div className="text-zinc-500">
                            {platformIcons[platform] || <Globe className="h-4 w-4" />}
                          </div>
                          <span className="text-xs text-zinc-400 font-medium">{platform}</span>
                          <span className="ml-auto text-[10px] text-zinc-600">Bientôt</span>
                        </div>
                      )
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-600 mt-3 text-center">
                    Vous pourrez connecter vos comptes depuis l&apos;espace &quot;Connexions&quot; du dashboard.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-400 transition cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Retour
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSkip}
                      className="text-xs text-zinc-500 hover:text-zinc-400 transition cursor-pointer"
                    >
                      Passer
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 bg-primary hover:bg-opacity-90 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
                    >
                      Suivant
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Ready */}
            {currentStep === "Prêt" && (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center animate-bounce">
                  <PartyPopper className="h-12 w-12 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                    Vous êtes prêt !
                  </h1>
                  <p className="mt-3 text-base text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Autocontent est configuré pour vous aider à créer, planifier et publier
                    vos meilleurs contenus marketing.
                  </p>
                </div>
                <div className="glass-panel rounded-2xl p-5 max-w-sm mx-auto">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
                    Prochaines étapes suggérées
                  </p>
                  <div className="space-y-2 text-left">
                    {[
                      "Complétez votre identité de marque (tons, personas)",
                      "Connectez vos comptes réseaux sociaux",
                      "Créez votre premier carrousel LinkedIn",
                      "Planifiez un calendrier éditorial mensuel",
                    ].map((tip, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-zinc-300">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="flex items-center gap-2 bg-primary hover:bg-opacity-90 text-white px-8 py-3 rounded-xl text-sm font-semibold transition cursor-pointer"
                  >
                    Explorer le dashboard
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-400 transition cursor-pointer"
                  >
                    <SkipForward className="h-3 w-3" />
                    Revoir plus tard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
