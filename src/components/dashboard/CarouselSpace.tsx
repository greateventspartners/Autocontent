"use client"

import { useState } from "react"
import {
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Image,
  Download,
  CalendarPlus,
  AlertCircle,
  CheckCircle,
  PenLine,
  ArrowRight,
  Shuffle,
} from "lucide-react"

interface Slide {
  id: string
  title: string
  content: string
  imagePrompt: string
  imageUrl: string | null
}

let slideIdCounter = 0
function nextSlideId() {
  slideIdCounter += 1
  return `slide_${slideIdCounter}_${Date.now()}`
}

function buildInitialSlides(topic: string, channel: string, count: number): Slide[] {
  const slides: Slide[] = []
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      slides.push({
        id: nextSlideId(),
        title: `${topic}`,
        content: `Découvrez comment ${topic.toLowerCase()} peut transformer votre approche.`,
        imagePrompt: `Titre accrocheur pour: ${topic}`,
        imageUrl: null,
      })
    } else if (i === count - 1) {
      slides.push({
        id: nextSlideId(),
        title: "Prêt à passer à l'action ?",
        content: `Contactez-nous dès aujourd'hui pour en savoir plus sur ${topic.toLowerCase()}.`,
        imagePrompt: `CTA pour: ${topic}`,
        imageUrl: null,
      })
    } else {
      slides.push({
        id: nextSlideId(),
        title: `Point clé ${i}`,
        content: `Détail important sur ${topic.toLowerCase()} à partager avec votre audience ${channel === "LINKEDIN" ? "professionnelle" : "engagée"}.`,
        imagePrompt: `Illustration pour slide ${i + 1}: ${topic}`,
        imageUrl: null,
      })
    }
  }
  return slides
}

const CHANNEL_STYLES: Record<string, { ratio: string; label: string; desc: string }> = {
  LINKEDIN: { ratio: "aspect-[4/3]", label: "LinkedIn (4:3)", desc: "Carrousel professionnel" },
  INSTAGRAM: { ratio: "aspect-[9/16]", label: "Instagram (9:16)", desc: "Carrousel vertical stories" },
}

export default function CarouselSpace() {
  const [topic, setTopic] = useState("")
  const [channel, setChannel] = useState<"LINKEDIN" | "INSTAGRAM">("LINKEDIN")
  const [slideCount, setSlideCount] = useState(6)
  const [generating, setGenerating] = useState(false)
  const [carouselTitle, setCarouselTitle] = useState("")
  const [slides, setSlides] = useState<Slide[]>([])
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [editingImagePrompt, setEditingImagePrompt] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentSlide = slides[currentSlideIndex] || null
  const channelStyle = CHANNEL_STYLES[channel]
  const hasGenerated = slides.length > 0

  const handleGenerate = async () => {
    if (!topic.trim()) return
    setGenerating(true)
    setError(null)

    try {
      const res = await fetch("/api/content/generate-carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), channel, slideCount }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erreur de génération")
      }

      const data = await res.json()
      setCarouselTitle(data.title || `Carrousel: ${topic}`)
      const newSlides = (data.slides || []).map((s: { title: string; content: string; imagePrompt: string }, i: number) => ({
        id: nextSlideId(),
        title: s.title || `Slide ${i + 1}`,
        content: s.content || "",
        imagePrompt: s.imagePrompt || `Illustration pour: ${s.title || topic}`,
        imageUrl: null,
      }))
      setSlides(newSlides)
      setCurrentSlideIndex(0)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur de génération")
      setSlides(buildInitialSlides(topic, channel, slideCount))
      setCarouselTitle(`Carrousel: ${topic}`)
      setCurrentSlideIndex(0)
    } finally {
      setGenerating(false)
    }
  }

  const handleRegenerateSlide = async () => {
    if (!currentSlide) return
    setGenerating(true)
    try {
      const res = await fetch("/api/content/generate-carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: `${topic} - slide ${currentSlideIndex + 1}`, channel, slideCount: 1 }),
      })
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      const s = data.slides?.[0]
      if (s) {
        setSlides((prev) =>
          prev.map((slide, i) =>
            i === currentSlideIndex
              ? { ...slide, title: s.title || slide.title, content: s.content || slide.content, imagePrompt: s.imagePrompt || slide.imagePrompt }
              : slide
          )
        )
      }
    } catch {
      // fallback: do nothing
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateImage = async () => {
    if (!currentSlide || !currentSlide.imagePrompt.trim()) return
    setGeneratingImage(true)
    try {
      const res = await fetch("/api/content/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentSlide.imagePrompt }),
      })
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      if (data.url) {
        setSlides((prev) =>
          prev.map((slide, i) =>
            i === currentSlideIndex ? { ...slide, imageUrl: data.url } : slide
          )
        )
      }
    } catch {
      // fallback
    } finally {
      setGeneratingImage(false)
    }
  }

  const updateSlide = (field: "title" | "content" | "imagePrompt", value: string) => {
    setSlides((prev) =>
      prev.map((slide, i) =>
        i === currentSlideIndex ? { ...slide, [field]: value } : slide
      )
    )
  }

  const handleExport = () => {
    const canvas = document.getElementById("carousel-slide-preview")?.querySelector("canvas")
    if (canvas) {
      const link = document.createElement("a")
      link.download = `carousel-${currentSlideIndex + 1}.png`
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  const handleSaveToCalendar = async () => {
    if (!hasGenerated) return
    try {
      const contentText = slides
        .map((s, i) => `--- Slide ${i + 1} ---\n${s.title}\n${s.content}`)
        .join("\n\n")

      await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: carouselTitle || topic,
          contentType: "SOCIAL",
          count: 1,
          brandKitId: "default",
        }),
      })
    } catch {
      // fallback
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Générateur de Carrousels
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Créez des carrousels LinkedIn et Instagram percutants avec l&apos;IA.
        </p>
      </div>

      <div className="glass-panel rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
              Sujet du carrousel
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: 5 tendances marketing en 2026"
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary placeholder:text-zinc-600"
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
              Canal
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as "LINKEDIN" | "INSTAGRAM")}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary appearance-none cursor-pointer"
            >
              <option value="LINKEDIN">LinkedIn</option>
              <option value="INSTAGRAM">Instagram</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
              Slides : {slideCount}
            </label>
            <input
              type="range"
              min={3}
              max={15}
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-600 mt-0.5">
              <span>3</span>
              <span>15</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="flex items-center gap-2 bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            {generating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {generating ? "Génération..." : "Générer le carrousel"}
          </button>
          {hasGenerated && (
            <>
              <button
                type="button"
                onClick={handleSaveToCalendar}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                <CalendarPlus className="h-3.5 w-3.5" />
                Agenda
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Exporter
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-amber-400 bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {hasGenerated && currentSlide && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-3">
                Éditeur &mdash; Slide {currentSlideIndex + 1}/{slides.length}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                    Titre
                  </label>
                  <div className="relative">
                    <PenLine className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                    <input
                      type="text"
                      value={currentSlide.title}
                      onChange={(e) => updateSlide("title", e.target.value)}
                      className="w-full rounded-lg bg-zinc-900 border border-zinc-800 pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-primary placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                    Contenu
                  </label>
                  <textarea
                    value={currentSlide.content}
                    onChange={(e) => updateSlide("content", e.target.value)}
                    rows={4}
                    className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-primary placeholder:text-zinc-600 resize-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">
                      Prompt image
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditingImagePrompt(!editingImagePrompt)}
                      className="text-[10px] text-primary hover:text-primary/80 transition cursor-pointer"
                    >
                      {editingImagePrompt ? "Masquer" : "Modifier"}
                    </button>
                  </div>
                  {editingImagePrompt && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentSlide.imagePrompt}
                        onChange={(e) => updateSlide("imagePrompt", e.target.value)}
                        className="flex-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary placeholder:text-zinc-600"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateImage}
                        disabled={generatingImage}
                        className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs transition cursor-pointer"
                      >
                        {generatingImage ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Image className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {currentSlide.imageUrl && (
                  <div className="rounded-lg overflow-hidden border border-zinc-800">
                    <img
                      src={currentSlide.imageUrl}
                      alt={currentSlide.title}
                      className="w-full object-cover"
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRegenerateSlide}
                    disabled={generating}
                    className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-xs transition cursor-pointer"
                  >
                    <Shuffle className="h-3 w-3" />
                    Régénérer
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between glass-panel rounded-2xl p-3">
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentSlideIndex === 0}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </button>
              <span className="text-[10px] text-zinc-500 font-medium">
                {currentSlideIndex + 1} / {slides.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                disabled={currentSlideIndex === slides.length - 1}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white disabled:opacity-30 transition cursor-pointer"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="lg:col-span-3" id="carousel-slide-preview">
            <div className="glass-panel rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                  Aperçu &mdash; Slide {currentSlideIndex + 1}
                </h3>
                <span className="text-[10px] text-zinc-500 bg-zinc-900 px-2 py-1 rounded-md">
                  {channelStyle.label}
                </span>
              </div>

              <div className={`relative w-full ${channelStyle.ratio} bg-gradient-to-br from-zinc-900 to-black rounded-xl overflow-hidden border border-zinc-800`}>
                {currentSlide.imageUrl ? (
                  <img
                    src={currentSlide.imageUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center">
                      <Image className="h-6 w-6 text-zinc-700" />
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 flex flex-col justify-center px-8 py-10">
                  <div className="max-w-lg mx-auto w-full text-center">
                    <p className="text-[10px] font-medium text-primary/60 uppercase tracking-widest mb-3">
                      Slide {currentSlideIndex + 1}/{slides.length}
                    </p>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight mb-4">
                      {currentSlide.title}
                    </h3>
                    <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                      {currentSlide.content}
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-1">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentSlideIndex(i)}
                      className={`w-2 h-2 rounded-full transition cursor-pointer ${
                        i === currentSlideIndex ? "bg-primary" : "bg-zinc-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasGenerated && (
        <div className="glass-panel rounded-2xl p-4">
          <h4 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-3">
            Toutes les slides
          </h4>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentSlideIndex(i)}
                className={`flex-shrink-0 w-28 rounded-xl overflow-hidden border transition cursor-pointer ${
                  i === currentSlideIndex
                    ? "border-primary ring-1 ring-primary/30"
                    : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                <div className={`relative ${channelStyle.ratio} bg-gradient-to-br from-zinc-900 to-black`}>
                  {slide.imageUrl ? (
                    <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    <p className="text-[9px] text-zinc-400 font-medium text-center leading-tight line-clamp-3">
                      {slide.title || `Slide ${i + 1}`}
                    </p>
                  </div>
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-zinc-900/80 text-[8px] text-zinc-500 px-1.5 py-0.5 rounded">
                    {i + 1}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!hasGenerated && !error && (
        <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4">
            <ArrowRight className="h-6 w-6 text-zinc-600" />
          </div>
          <p className="text-sm text-zinc-500 max-w-md">
            Entrez un sujet et cliquez sur <span className="text-primary font-medium">Générer</span> pour créer votre carrousel.
            L&apos;IA génère le contenu de chaque slide, que vous pouvez ensuite personnaliser.
          </p>
        </div>
      )}
    </div>
  )
}
