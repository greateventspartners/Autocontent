"use client"

import { useState, useCallback, useRef } from "react"
import SplitLeftPanel from "./SplitLeftPanel"
import SplitRightPanel from "./SplitRightPanel"
import type { ChannelEntry, SplitScreenState } from "./editor/types"
import { contentApi, flattenContentItem } from "@/lib/services/pulseforge-service"
import type { BrandKit, ContentItem, PublicationLog } from "@/lib/services/pulseforge-service"

interface SplitScreenEditorProps {
  brand: BrandKit
  contentList: ContentItem[]
  onSetContentList: (list: ContentItem[]) => void
  onAddPublishingLog: (log: { title: string; channel: string; status: "success" | "failed" }) => void
  onClose: () => void
}

const PIPELINE_STEPS = [
  "Lecture du contexte de marque et voix...",
  "Recherche d'embeddings associés à la marque...",
  "Création des prompts et génération des variantes A/B...",
  "Évaluation de la cohérence et scoring...",
  "Réécriture et formatage selon les canaux cibles...",
  "Assemblage final du plan de contenu...",
]

export default function SplitScreenEditor({
  brand,
  contentList,
  onSetContentList,
  onAddPublishingLog,
  onClose,
}: SplitScreenEditorProps) {
  const [state, setState] = useState<SplitScreenState>({
    prompt: "",
    sourceText: "",
    generationType: "multi",
    channels: [],
    activeChannel: "",
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)
  const [showPreview, setShowPreview] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleGenerate = useCallback(async () => {
    if (!brand.id) {
      alert("Veuillez d'abord enregistrer un Brand Kit.")
      return
    }
    if (!state.prompt.trim() && !state.sourceText.trim()) return

    setIsGenerating(true)
    setGenerationStep(0)

    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      setGenerationStep(i)
      await new Promise((r) => setTimeout(r, 300))
    }

    try {
      let rawItems: any[]

      if (state.generationType === "repurpose") {
        rawItems = await contentApi.repurpose({
          brandKitId: brand.id,
          longText: state.sourceText.trim(),
          channels: ["LINKEDIN", "INSTAGRAM", "FACEBOOK", "X"],
        })
      } else {
        rawItems = await contentApi.generateMulti({
          brandKitId: brand.id,
          topic: state.prompt.trim(),
          channels: ["LINKEDIN", "INSTAGRAM", "FACEBOOK", "X", "PINTEREST", "WORDPRESS"],
        })
      }

      const items = (rawItems ?? []).map(flattenContentItem)
      onSetContentList([...items, ...contentList])

      const channels: ChannelEntry[] = items.map((item: ContentItem) => ({
        channel: item.channel.toUpperCase(),
        title: item.title,
        content: item.variants.a || item.content,
      }))

      setState((prev) => ({
        ...prev,
        channels,
        activeChannel: channels[0]?.channel ?? "",
      }))
    } catch (err: unknown) {
      alert("Erreur génération : " + (err instanceof Error ? err.message : "inconnue"))
    } finally {
      setIsGenerating(false)
    }
  }, [brand.id, state.prompt, state.sourceText, state.generationType, contentList, onSetContentList])

  const handleSaveAll = useCallback(async () => {
    if (state.channels.length === 0) return
    setSaving(true)
    try {
      for (const entry of state.channels) {
        const existing = contentList.find(
          (c) => c.channel.toUpperCase() === entry.channel && c.title === entry.title
        )
        if (existing) {
          await contentApi.update(existing.id, {
            title: entry.title,
            content: entry.content,
          })
        }
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }, [state.channels, contentList])

  const handleChangeChannel = useCallback((entry: ChannelEntry) => {
    setState((prev) => ({
      ...prev,
      channels: prev.channels.map((c) => (c.channel === entry.channel ? entry : c)),
    }))
  }, [])

  const handleActivateChannel = useCallback((channel: string) => {
    setState((prev) => ({ ...prev, activeChannel: channel }))
  }, [])

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 min-h-[600px]">
      <div className="xl:col-span-2">
        <SplitLeftPanel
          prompt={state.prompt}
          sourceText={state.sourceText}
          generationType={state.generationType}
          channels={state.channels}
          activeChannel={state.activeChannel}
          isGenerating={isGenerating}
          generationStep={generationStep}
          pipelineSteps={PIPELINE_STEPS}
          onChangePrompt={(val) => setState((prev) => ({ ...prev, prompt: val }))}
          onChangeSource={(val) => setState((prev) => ({ ...prev, sourceText: val }))}
          onChangeChannel={handleChangeChannel}
          onActivateChannel={handleActivateChannel}
          onGenerate={handleGenerate}
        />
      </div>
      <div className="xl:col-span-3">
        <SplitRightPanel
          channels={state.channels}
          activeChannel={state.activeChannel}
          onSelectChannel={handleActivateChannel}
          showPreview={showPreview}
          onTogglePreview={() => setShowPreview(!showPreview)}
          saving={saving}
          saved={saved}
          onSave={handleSaveAll}
        />
      </div>
    </div>
  )
}
