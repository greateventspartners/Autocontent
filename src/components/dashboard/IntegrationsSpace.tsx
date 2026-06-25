"use client"

import { useState, useEffect, useCallback } from "react"
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  MessageCircle,
} from "lucide-react"
import { PlatformIcon, getChannelLabel } from "@/components/PlatformIcon"

interface Integration {
  id: string
  channel: string
  config: Record<string, unknown>
  enabled: boolean
}

const CHANNEL_DETAILS: Record<string, { label: string; docsUrl: string; fields: { key: string; label: string; placeholder: string; secret: boolean }[] }> = {
  LINKEDIN: {
    label: "LinkedIn",
    docsUrl: "https://developer.linkedin.com/docs",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "Entrez votre token LinkedIn", secret: true },
      { key: "authorId", label: "Author ID (URN)", placeholder: "Ex: 123456", secret: false },
    ],
  },
  INSTAGRAM: {
    label: "Instagram",
    docsUrl: "https://developers.facebook.com/docs/instagram-api",
    fields: [
      { key: "accessToken", label: "Access Token (long-lived)", placeholder: "Entrez votre token Instagram", secret: true },
      { key: "instagramAccountId", label: "Instagram Account ID", placeholder: "Ex: 178414000000000", secret: false },
    ],
  },
  FACEBOOK: {
    label: "Facebook",
    docsUrl: "https://developers.facebook.com/docs/pages-api",
    fields: [
      { key: "accessToken", label: "Page Access Token", placeholder: "Entrez votre token Facebook Page", secret: true },
      { key: "pageId", label: "Page ID", placeholder: "Ex: 123456789", secret: false },
    ],
  },
  X: {
    label: "X (Twitter)",
    docsUrl: "https://developer.twitter.com/en/docs",
    fields: [
      { key: "apiKey", label: "API Key", placeholder: "Consumer Key", secret: true },
      { key: "apiSecret", label: "API Secret", placeholder: "Consumer Secret", secret: true },
      { key: "accessToken", label: "Access Token", placeholder: "Token d'accès", secret: true },
      { key: "accessSecret", label: "Access Secret", placeholder: "Secret d'accès", secret: true },
    ],
  },
  TIKTOK: {
    label: "TikTok",
    docsUrl: "https://developers.tiktok.com/",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "Entrez votre token TikTok", secret: true },
      { key: "openId", label: "Open ID", placeholder: "Ex: a1b2c3...", secret: false },
    ],
  },
  PINTEREST: {
    label: "Pinterest",
    docsUrl: "https://developers.pinterest.com/",
    fields: [
      { key: "accessToken", label: "Access Token", placeholder: "Entrez votre token Pinterest", secret: true },
      { key: "boardId", label: "Board ID (optionnel)", placeholder: "ID du tableau par défaut", secret: false },
    ],
  },
  WORDPRESS: {
    label: "WordPress",
    docsUrl: "https://developer.wordpress.com/docs/",
    fields: [
      { key: "username", label: "Nom d'utilisateur", placeholder: "admin", secret: false },
      { key: "password", label: "Application Password", placeholder: "Mot de passe application", secret: true },
      { key: "siteUrl", label: "URL du site", placeholder: "https://monsite.com", secret: false },
    ],
  },
  MEDIUM: {
    label: "Medium",
    docsUrl: "https://medium.com/developers",
    fields: [
      { key: "integrationToken", label: "Integration Token", placeholder: "Entrez votre token Medium", secret: true },
      { key: "authorId", label: "Author ID", placeholder: "Ex: 123abc", secret: false },
    ],
  },
}

const ALL_INTEGRATIONS = Object.keys(CHANNEL_DETAILS)

const API_BASE = ""

async function fetchIntegrations(): Promise<Integration[]> {
  const res = await fetch(`${API_BASE}/api/integrations`)
  if (!res.ok) return []
  return res.json()
}

async function upsertIntegration(channel: string, config: Record<string, unknown>, enabled: boolean): Promise<Integration | null> {
  const res = await fetch(`${API_BASE}/api/integrations`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel, config, enabled }),
  })
  if (!res.ok) return null
  return res.json()
}

export default function IntegrationsSpace() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingChannel, setEditingChannel] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set())
  const [firstComment, setFirstComment] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchIntegrations()
      setIntegrations(data)
    } catch {
      setError("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const getIntegration = (channel: string): Integration | undefined =>
    integrations.find((i) => i.channel === channel)

  const isConnected = (channel: string) => {
    const int = getIntegration(channel)
    return int?.enabled && int?.config && Object.keys(int.config).length > 0
  }

  const handleEdit = (channel: string) => {
    const int = getIntegration(channel)
    const details = CHANNEL_DETAILS[channel]
    const values: Record<string, string> = {}
    if (int?.config) {
      for (const field of details.fields) {
        values[field.key] = (int.config[field.key] as string) ?? ""
      }
    } else {
      for (const field of details.fields) {
        values[field.key] = ""
      }
    }
    setFormValues(values)
    setFirstComment(int?.config?.firstComment === true)
    setEditingChannel(channel)
  }

  const handleSave = async () => {
    const channel = editingChannel
    if (!channel) return
    setSaving(true)
    try {
      const config: Record<string, unknown> = { ...formValues, firstComment }
      const result = await upsertIntegration(channel, config, true)
      if (result) {
        setIntegrations((prev) => {
          const filtered = prev.filter((i) => i.channel !== channel)
          return [...filtered, result]
        })
      }
      setEditingChannel(null)
    } catch {
      alert("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnect = async (channel: string) => {
    try {
      await upsertIntegration(channel, {}, false)
      setIntegrations((prev) => prev.filter((i) => i.channel !== channel))
    } catch {
      alert("Erreur lors de la déconnexion")
    }
  }

  const toggleFieldVisibility = (key: string) => {
    setVisibleFields((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
        <span className="ml-3 text-sm text-zinc-400">Chargement des intégrations...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400 text-sm">
        <AlertCircle className="h-5 w-5 mr-2" />
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Intégrations & Connexions
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Connectez vos comptes réseaux sociaux et plateformes de blog pour publier automatiquement.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ALL_INTEGRATIONS.map((channel) => {
          const details = CHANNEL_DETAILS[channel]
          const connected = isConnected(channel)
          const editing = editingChannel === channel

          return (
            <div
              key={channel}
              className={`glass-panel rounded-2xl overflow-hidden transition-all duration-200 ${
                editing ? "ring-1 ring-primary/40" : ""
              }`}
            >
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${connected ? "bg-emerald-500/15" : "bg-zinc-900"}`}>
                      <PlatformIcon channel={channel} className={`h-5 w-5 ${connected ? "" : "opacity-40"}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{details.label}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {connected ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400 font-medium">Connecté</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 text-zinc-600" />
                            <span className="text-[10px] text-zinc-600 font-medium">Non connecté</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!editing && (
                      <>
                        {connected && (
                          <button
                            type="button"
                            onClick={() => handleDisconnect(channel)}
                            className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                            title="Déconnecter"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEdit(channel)}
                          className="flex items-center gap-1.5 text-[11px] bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg font-medium transition cursor-pointer"
                        >
                          {connected ? "Configurer" : "Connecter"}
                          <Plus className="h-3 w-3" />
                        </button>
                      </>
                    )}
                    <a
                      href={details.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-600 hover:text-zinc-400 p-1.5 rounded-lg transition cursor-pointer"
                      title="Documentation API"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>

                {editing && (
                  <div className="mt-5 space-y-4 border-t border-zinc-800/80 pt-4">
                    {details.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                          {field.label}
                        </label>
                        <div className="relative">
                          <input
                            type={field.secret && !visibleFields.has(field.key) ? "password" : "text"}
                            value={formValues[field.key] ?? ""}
                            onChange={(e) =>
                              setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                            }
                            placeholder={field.placeholder}
                            className="w-full rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-primary pr-8 placeholder:text-zinc-600"
                          />
                          {field.secret && (
                            <button
                              type="button"
                              onClick={() => toggleFieldVisibility(field.key)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                            >
                              {visibleFields.has(field.key) ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center gap-3 pt-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={firstComment}
                          onChange={(e) => setFirstComment(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                      </label>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <MessageCircle className="h-3.5 w-3.5 text-primary" />
                        Premier commentaire automatique (hashtags/liens)
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 bg-primary hover:bg-opacity-90 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
                      >
                        {saving ? "Enregistrement..." : "Enregistrer"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingChannel(null)}
                        className="px-4 py-2 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
