export interface ExistingPost {
  scheduledAt: string | Date;
  platform: string;
}

interface TimeSlot {
  date: Date;
  hour: number;
  minute: number;
}

const OPTIMAL_HOURS: Record<string, number[]> = {
  linkedin: [8, 9, 10, 12, 17],
  twitter: [8, 9, 12, 13, 17, 18],
  instagram: [11, 12, 13, 19, 20, 21],
  facebook: [9, 10, 13, 15, 16],
  tiktok: [7, 8, 12, 19, 20, 21, 22],
  pinterest: [14, 15, 20, 21, 22],
  wordpress: [9, 10, 11],
  medium: [8, 10, 12],
};

const OPTIMAL_DAYS: Record<string, number[]> = {
  linkedin: [1, 2, 3, 4],
  twitter: [1, 2, 3, 4, 5],
  instagram: [1, 2, 3, 4, 5, 6],
  facebook: [1, 2, 3, 4],
  tiktok: [0, 1, 2, 3, 4, 5, 6],
  pinterest: [1, 5, 6],
  wordpress: [1, 2, 3],
  medium: [1, 2, 3],
};

const BUFFER_MINUTES = 120;

function toKey(d: Date, hour: number, minute: number): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${hour}-${minute}`;
}

function hasConflict(slot: TimeSlot, existingPosts: ExistingPost[], excludeId?: string): boolean {
  const slotTime = new Date(slot.date);
  slotTime.setHours(slot.hour, slot.minute, 0, 0);
  const slotMs = slotTime.getTime();

  for (const post of existingPosts) {
    if (excludeId && post.scheduledAt.toString() === excludeId) continue;
    const postTime = new Date(post.scheduledAt).getTime();
    if (Math.abs(slotMs - postTime) < BUFFER_MINUTES * 60 * 1000) {
      return true;
    }
  }
  return false;
}

function formatDateLabel(d: Date): string {
  const days = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
  const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
}

function formatTimeLabel(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}h${String(minute).padStart(2, "0")}`;
}

function getDayReason(platform: string, date: Date): string {
  const dayOfWeek = date.getDay();
  const optimal = OPTIMAL_DAYS[platform] || OPTIMAL_DAYS.linkedin;
  if (optimal.includes(dayOfWeek)) return "";
  return " (jour hors des jours optimaux)";
}

export interface SuggestResult {
  suggested: { date: string; time: string; label: string; reason: string };
  alternatives: { date: string; time: string; label: string }[];
}

export function suggestTime(
  platform: string,
  existingPosts: ExistingPost[],
  preferredDate?: string,
  excludeId?: string,
): SuggestResult {
  const hours = OPTIMAL_HOURS[platform] || OPTIMAL_HOURS.linkedin;
  const days = OPTIMAL_DAYS[platform] || OPTIMAL_DAYS.linkedin;

  const startDate = preferredDate ? new Date(preferredDate) : new Date();
  if (!preferredDate) {
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(hours[0], 0, 0, 0);
  }

  const candidates: TimeSlot[] = [];

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(0, 0, 0, 0);

    const dayOfWeek = d.getDay();

    for (const hour of hours) {
      for (const minute of [0, 30]) {
        const slot: TimeSlot = { date: new Date(d), hour, minute };
        if (!hasConflict(slot, existingPosts, excludeId)) {
          candidates.push(slot);
        }
      }
    }
  }

  if (candidates.length === 0) {
    const fallback = new Date(startDate);
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(9, 0, 0, 0);
    return {
      suggested: {
        date: fallback.toISOString().split("T")[0],
        time: "09:00",
        label: `${formatDateLabel(fallback)} à ${formatTimeLabel(9, 0)}`,
        reason: "Aucun créneau libre trouvé — créneau par défaut",
      },
      alternatives: [],
    };
  }

  const best = candidates[0];
  const bestDate = best.date;
  const dayReason = getDayReason(platform, bestDate);

  const suggested = {
    date: bestDate.toISOString().split("T")[0],
    time: formatTimeLabel(best.hour, best.minute),
    label: `${formatDateLabel(bestDate)} à ${formatTimeLabel(best.hour, best.minute)}`,
    reason: `Meilleur créneau — ${formatDateLabel(bestDate)} sur ${platform}${dayReason}`,
  };

  const alternatives = candidates.slice(1, 3).map((slot) => ({
    date: slot.date.toISOString().split("T")[0],
    time: formatTimeLabel(slot.hour, slot.minute),
    label: `${formatDateLabel(slot.date)} à ${formatTimeLabel(slot.hour, slot.minute)}`,
  }));

  return { suggested, alternatives };
}
