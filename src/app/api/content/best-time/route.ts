import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";

type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_NAMES: Record<number, string> = {
  0: "Dimanche",
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
};

function computeBest(
  samples: { dayOfWeek: DayOfWeek; hour: number }[]
): { dayOfWeek: string; hour: number; score: number }[] {
  if (samples.length === 0) {
    return Array.from({ length: 7 }, (_, d) => ({
      dayOfWeek: DAY_NAMES[d],
      hour: 9,
      score: 0,
    }));
  }

  const grid: Record<number, Record<number, number>> = {};

  for (const s of samples) {
    if (!grid[s.dayOfWeek]) grid[s.dayOfWeek] = {};
    grid[s.dayOfWeek][s.hour] = (grid[s.dayOfWeek][s.hour] ?? 0) + 1;
  }

  const result: { dayOfWeek: string; hour: number; score: number }[] = [];
  for (let d = 0; d < 7; d++) {
    let bestHour = 9;
    let bestScore = -Infinity;
    const hours = grid[d] ?? {};
    for (let h = 0; h < 24; h++) {
      const count = hours[h] ?? 0;
      if (count > bestScore) {
        bestScore = count;
        bestHour = h;
      }
    }
    result.push({ dayOfWeek: DAY_NAMES[d], hour: bestHour, score: bestScore });
  }
  return result;
}

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const supabase = await createServerSupabaseClient();
    const { data: contentItems } = await supabase
      .from("content_items")
      .select("channel, scheduled_date, status")
      .eq("workspace_id", workspaceId)
      .order("scheduled_date", { ascending: false })
      .limit(200);

    const published = (contentItems ?? []).filter(
      (c) => c.status === "PUBLISHED" || c.status === "SCHEDULED"
    );

    const withDate = published.filter(
      (item): item is typeof item & { scheduled_date: string } => item.scheduled_date !== null
    );

    const byChannel: Record<string, { dayOfWeek: DayOfWeek; hour: number }[]> = {};

    for (const item of withDate) {
      const ch = item.channel?.toLowerCase() ?? "unknown";
      if (!byChannel[ch]) byChannel[ch] = [];
      const d = new Date(item.scheduled_date);
      byChannel[ch].push({
        dayOfWeek: d.getDay() as DayOfWeek,
        hour: d.getHours(),
      });
    }

    const suggestions: Record<string, { dayOfWeek: string; hour: number; score: number }[]> = {};

    for (const [channel, samples] of Object.entries(byChannel)) {
      suggestions[channel] = computeBest(samples);
    }

    const overallSamples = withDate.map((item) => {
      const d = new Date(item.scheduled_date);
      return {
        dayOfWeek: d.getDay() as DayOfWeek,
        hour: d.getHours(),
      };
    });

    suggestions["all"] = computeBest(overallSamples);

    return NextResponse.json({ suggestions, total: published.length });
  } catch (error) {
    return handleApiError(error);
  }
}
