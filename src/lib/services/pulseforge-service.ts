// ---- Types ----

export interface BrandKit {
  id?: string;
  name: string;
  website: string;
  slogan: string;
  description: string;
  tone: string[];
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
  personas: {
    name: string;
    role: string;
    bio: string;
  }[];
  voiceRules: string[];
}

export interface ContentItem {
  id: string;
  title: string;
  type: "social" | "blog" | "email" | "ad";
  status: "draft" | "scheduled" | "published";
  scheduledDate: string;
  channel: string;
  content: string;
  variants: { a: string; b: string; scoreA: number; scoreB: number };
  summary: string;
  score: number;
  createdAt: string;
}

export interface AnalyticsMetric {
  date: string;
  impressions: number;
  clicks: number;
  engagement: number;
  ctr: number;
}

export interface PublicationLog {
  id: string;
  contentId: string;
  title: string;
  channel: string;
  status: "success" | "failed" | "retrying";
  timestamp: string;
  error?: string;
}

export interface AIRecommendation {
  id: string;
  type: "content" | "schedule" | "brand";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  actionLabel: string;
}

// ---- Transformation helpers ----

interface ApiBrandKit {
  id?: string;
  name: string;
  website: string | null;
  slogan: string | null;
  description: string | null;
  colors: any;
  tone: { label: string }[];
  voiceRules: { rule: string }[];
  personas: { name: string; role: string; bio: string }[];
}

export function flattenBrandKit(api: ApiBrandKit): BrandKit {
  return {
    id: api.id,
    name: api.name,
    website: api.website ?? "",
    slogan: api.slogan ?? "",
    description: api.description ?? "",
    colors: api.colors ?? { primary: "#8b5cf6", secondary: "#ec4899", background: "#0f172a" },
    tone: (api.tone ?? []).map((t) => t.label),
    voiceRules: (api.voiceRules ?? []).map((v) => v.rule),
    personas: api.personas ?? [],
  };
}

export function expandBrandKit(bk: BrandKit) {
  return {
    name: bk.name,
    website: bk.website ?? null,
    slogan: bk.slogan ?? null,
    description: bk.description ?? null,
    colors: bk.colors,
    tone: bk.tone,
    voiceRules: bk.voiceRules,
    personas: bk.personas,
  };
}

// ---- Content API types (Prisma enums are UPPERCASE) ----

interface ApiContentItem {
  id: string;
  title: string;
  type: string;
  status: string;
  channel: string;
  content: string;
  variantA: string;
  variantB: string;
  scoreA: number;
  scoreB: number;
  brandScore: number;
  summary: string | null;
  scheduledDate: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  brandKit?: { name: string } | null;
}

export function flattenContentItem(api: ApiContentItem): ContentItem {
  return {
    id: api.id,
    title: api.title,
    type: api.type.toLowerCase() as ContentItem["type"],
    status: api.status.toLowerCase() as ContentItem["status"],
    channel: api.channel.toLowerCase(),
    scheduledDate: api.scheduledDate ?? new Date().toISOString(),
    content: api.content,
    variants: {
      a: api.variantA,
      b: api.variantB,
      scoreA: api.scoreA,
      scoreB: api.scoreB,
    },
    summary: api.summary ?? "",
    score: api.brandScore,
    createdAt: api.createdAt,
  };
}

export function expandContentItem(item: Partial<ContentItem>) {
  return {
    title: item.title,
    type: item.type?.toUpperCase(),
    status: item.status?.toUpperCase(),
    channel: item.channel?.toUpperCase(),
    content: item.content,
    variantA: item.variants?.a ?? item.content,
    variantB: item.variants?.b ?? "",
    scoreA: item.variants?.scoreA ?? 0,
    scoreB: item.variants?.scoreB ?? 0,
    brandScore: item.score,
    summary: item.summary,
    scheduledDate: item.scheduledDate ? new Date(item.scheduledDate).toISOString() : null,
  };
}

// ---- API calls ----

const BASE = "";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (options?.headers) Object.assign(headers, options.headers as Record<string, string>);
  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const brandKitApi = {
  list: () => fetchApi<ApiBrandKit[]>("/api/brand-kits"),
  get: (id: string) => fetchApi<ApiBrandKit>(`/api/brand-kits/${id}`),
  create: (data: any) =>
    fetchApi<ApiBrandKit>("/api/brand-kits", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<ApiBrandKit>(`/api/brand-kits/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<void>(`/api/brand-kits/${id}`, { method: "DELETE" }),
  analyze: (url: string) =>
    fetchApi<ApiBrandKit>("/api/brand-kits/analyze", {
      method: "POST",
      body: JSON.stringify({ url }),
    }),
};

export const contentApi = {
  list: (params?: Record<string, string>): Promise<{ items: any[]; total: number; page: number; limit: number }> => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetchApi(`/api/content${qs}`);
  },
  get: (id: string) => fetchApi<any>(`/api/content/${id}`),
  create: (data: any) =>
    fetchApi<any>("/api/content", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetchApi<any>(`/api/content/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<void>(`/api/content/${id}`, { method: "DELETE" }),
  generate: (data: any) =>
    fetchApi<any[]>("/api/content/generate", { method: "POST", body: JSON.stringify(data) }),
  generateMulti: (data: { brandKitId: string; topic: string; channels?: string[] }) =>
    fetchApi<any[]>("/api/content/generate/multi", { method: "POST", body: JSON.stringify(data) }),
  repurpose: (data: { brandKitId: string; longText: string; channels?: string[] }) =>
    fetchApi<any[]>("/api/content/repurpose", { method: "POST", body: JSON.stringify(data) }),
  schedule: (id: string, date: string) =>
    fetchApi<any>(`/api/content/${id}/schedule`, { method: "POST", body: JSON.stringify({ scheduledDate: date }) }),
  publish: (id: string) =>
    fetchApi<any>(`/api/content/${id}/publish`, { method: "POST" }),
  reschedule: (id: string, data: { scheduledDate?: string | null; campaignId?: string | null }) =>
    fetchApi<any>(`/api/content/${id}/reschedule`, { method: "PATCH", body: JSON.stringify(data) }),
};

export interface MediaItem {
  id: string;
  workspaceId: string;
  brandKitId: string | null;
  fileName: string;
  key: string;
  url: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  color: string;
  description: string | null;
  _count?: { contentItems: number };
}

export const campaignApi = {
  list: () => fetchApi<Campaign[]>("/api/campaigns"),
  create: (data: { name: string; color?: string; description?: string }) =>
    fetchApi<Campaign>("/api/campaigns", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Campaign>) =>
    fetchApi<Campaign>(`/api/campaigns/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<void>(`/api/campaigns/${id}`, { method: "DELETE" }),
};

export interface ReviewEntry {
  id: string;
  contentItemId: string;
  token: string;
  reviewerEmail: string | null;
  reviewerName: string | null;
  status: "PENDING" | "APPROVED" | "CHANGES_REQUESTED";
  comments: string | null;
  createdAt: string;
  respondedAt: string | null;
}

export interface CreateReviewResponse {
  review: ReviewEntry;
  reviewUrl: string;
}

export const reviewApi = {
  create: (contentItemId: string, reviewerEmail?: string, reviewerName?: string) =>
    fetchApi<CreateReviewResponse>(`/api/content/${contentItemId}/review`, {
      method: "POST",
      body: JSON.stringify({ reviewerEmail, reviewerName }),
    }),
};

export interface TopicSuggestionEntry {
  id: string;
  workspaceId: string;
  brandKitId: string | null;
  title: string;
  status: "PENDING" | "VALIDATED" | "USED";
  generatedAt: string;
  validatedAt: string | null;
  usedAt: string | null;
}

export interface TopicSuggestionsResponse {
  topics: TopicSuggestionEntry[];
  counts: { pending: number; validated: number; used: number };
}

export const topicApi = {
  list: (brandKitId?: string) => {
    const qs = brandKitId ? `?brandKitId=${brandKitId}` : "";
    return fetchApi<TopicSuggestionsResponse>(`/api/content/topics${qs}`);
  },
  generate: (brandKitId: string, count = 30) =>
    fetchApi<{ count: number; titles: string[] }>("/api/content/topics", {
      method: "POST",
      body: JSON.stringify({ brandKitId, count }),
    }),
  updateStatus: (id: string, status: "PENDING" | "VALIDATED" | "USED") =>
    fetchApi<any>(`/api/content/topics/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

export const mediaApi = {
  list: (brandKitId?: string) => {
    const qs = brandKitId ? `?brandKitId=${brandKitId}` : "";
    return fetchApi<MediaItem[]>(`/api/uploads${qs}`);
  },
  upload: (file: File, brandKitId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (brandKitId) formData.append("brandKitId", brandKitId);
    return fetchApi<MediaItem>("/api/uploads", {
      method: "POST",
      body: formData,
      headers: {},
    });
  },
  delete: (id: string) =>
    fetchApi<void>(`/api/uploads/${id}`, { method: "DELETE" }),
};

export interface BestTimeSuggestion {
  dayOfWeek: string;
  hour: number;
  score: number;
}

export interface BestTimeResponse {
  suggestions: Record<string, BestTimeSuggestion[]>;
  total: number;
}

export const analyticsApi = {
  get: (days = 7, channel?: string) => {
    const params = new URLSearchParams({ days: String(days) });
    if (channel) params.set("channel", channel);
    return fetchApi<ApiAnalyticsResponse>(`/api/analytics?${params}`);
  },
  capture: (data: any) =>
    fetchApi<any>("/api/analytics/events", { method: "POST", body: JSON.stringify(data) }),
  bestTime: () => fetchApi<BestTimeResponse>("/api/content/best-time"),
};

export interface ApiKeyEntry {
  id: string;
  label: string;
  key: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface ContentTemplateEntry {
  id: string;
  name: string;
  type: string;
  channel: string;
  prompt: string;
  structure: any;
  createdAt: string;
  updatedAt: string;
}

export const templatesApi = {
  list: () => fetchApi<ContentTemplateEntry[]>("/api/templates"),
  get: (id: string) => fetchApi<ContentTemplateEntry>(`/api/templates/${id}`),
  create: (data: { name: string; type: string; channel: string; prompt: string; structure?: any }) =>
    fetchApi<ContentTemplateEntry>("/api/templates", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ name: string; type: string; channel: string; prompt: string; structure: any }>) =>
    fetchApi<ContentTemplateEntry>(`/api/templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string) =>
    fetchApi<void>(`/api/templates/${id}`, { method: "DELETE" }),
};

export const apiKeysApi = {
  list: () => fetchApi<ApiKeyEntry[]>("/api/api-keys"),
  create: (label: string) =>
    fetchApi<ApiKeyEntry>("/api/api-keys", { method: "POST", body: JSON.stringify({ label }) }),
  delete: (id: string) =>
    fetchApi<void>(`/api/api-keys/${id}`, { method: "DELETE" }),
};

export interface ApiAnalyticsResponse {
  timeseries: ApiAnalyticsDatum[];
  totals: { impressions: number; clicks: number; engagement: number; ctr: number };
}

export interface ApiAnalyticsDatum {
  id: string;
  channel: string;
  date: string;
  impressions: number;
  clicks: number;
  engagement: number;
  ctr: number;
}

export interface ApiRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: string;
  actionLabel: string;
  applied: boolean;
  createdAt: string;
}

export function flattenAnalyticsMetric(api: ApiAnalyticsDatum): AnalyticsMetric {
  return {
    date: new Date(api.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
    impressions: api.impressions,
    clicks: api.clicks,
    engagement: api.engagement,
    ctr: api.ctr,
  };
}

export function flattenRecommendation(api: ApiRecommendation): AIRecommendation {
  return {
    id: api.id,
    type: api.type as AIRecommendation["type"],
    title: api.title,
    description: api.description,
    impact: api.impact as AIRecommendation["impact"],
    actionLabel: api.actionLabel,
  };
}

export const recommendationsApi = {
  list: () => fetchApi<ApiRecommendation[]>("/api/recommendations"),
  apply: (id: string) =>
    fetchApi<void>("/api/recommendations", { method: "POST", body: JSON.stringify({ id }) }),
};
