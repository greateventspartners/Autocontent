export type Platform = "linkedin" | "twitter" | "instagram" | "facebook" | "tiktok" | "pinterest" | "wordpress" | "medium";

export type ViewMode = "month" | "week" | "list" | "unplanned";

export interface CalendarPost {
  id: string;
  sourceIdea: string;
  platform: string;
  scheduledAt: string | null;
  status: string;
  body?: string;
  content: { campaign: { id: string; title: string } };
}

export interface DayData {
  date: number;
  isCurrentMonth: boolean;
  isToday?: boolean;
  posts: CalendarPost[];
  dateStr: string;
}

export interface CampaignOption {
  id: string;
  title: string;
}

export const PLATFORM_COLORS: Record<string, string> = {
  linkedin: "bg-blue-600 text-white shadow-blue-500/20",
  twitter: "bg-sky-500 text-white shadow-sky-500/20",
  instagram: "bg-gradient-to-tr from-pink-500 to-orange-400 text-white shadow-pink-500/20",
  facebook: "bg-blue-800 text-white shadow-blue-900/20",
  tiktok: "bg-black text-white shadow-black/20",
  pinterest: "bg-red-600 text-white shadow-red-700/20",
  wordpress: "bg-slate-700 text-white shadow-slate-900/20",
  medium: "bg-stone-800 text-white shadow-stone-900/20",
};

export const PLATFORM_ICONS: Record<string, string> = {
  linkedin: "in",
  twitter: "X",
  instagram: "ig",
  facebook: "fb",
  tiktok: "tt",
  pinterest: "P",
  wordpress: "W",
  medium: "M",
};

export const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  twitter: "X / Twitter",
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  wordpress: "WordPress",
  medium: "Medium",
};

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PENDING_APPROVAL: "bg-amber-500/10 text-amber-500",
  APPROVED: "bg-blue-500/10 text-blue-500",
  REJECTED: "bg-destructive/10 text-destructive",
  SCHEDULED: "bg-primary/10 text-primary",
  PUBLISHED: "bg-emerald-500/10 text-emerald-500",
  FAILED: "bg-destructive/10 text-destructive",
};

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  PENDING_APPROVAL: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
  SCHEDULED: "Planifié",
  PUBLISHED: "Publié",
  FAILED: "Échoué",
};

export const PLATFORM_OPTIONS = [
  { value: "", label: "Toutes les plateformes" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "X / Twitter" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "pinterest", label: "Pinterest" },
  { value: "wordpress", label: "WordPress" },
  { value: "medium", label: "Medium" },
];
