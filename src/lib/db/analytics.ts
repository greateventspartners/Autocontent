import { createServerSupabaseClient } from "../supabase-server";
import type { Database } from "../database.types";

export async function getAnalytics(workspaceId: string, days: number, channel?: string) {
  const supabase = await createServerSupabaseClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  let query = supabase
    .from("analytics_data")
    .select("*")
    .eq("workspace_id", workspaceId)
    .gte("date", since.toISOString())
    .order("date", { ascending: true });

  if (channel) query = query.eq("channel", channel as any);

  const { data } = await query;

  const items = data ?? [];
  const totals = items.reduce(
    (acc, curr) => ({
      impressions: acc.impressions + curr.impressions,
      clicks: acc.clicks + curr.clicks,
      engagement: acc.engagement + curr.engagement,
    }),
    { impressions: 0, clicks: 0, engagement: 0 }
  );

  return {
    timeseries: items,
    totals: {
      ...totals,
      ctr: totals.impressions > 0
        ? parseFloat(((totals.clicks / totals.impressions) * 100).toFixed(2))
        : 0,
    },
  };
}

export async function captureAnalyticsEvent(body: {
  contentId?: string;
  channel: string;
  event: string;
  value: number;
}) {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("analytics_data")
    .select("*")
    .eq("channel", body.channel as any)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    const updates: Partial<Database["public"]["Tables"]["analytics_data"]["Update"]> = {};
    if (body.event === "impressions") updates.impressions = existing.impressions + body.value;
    if (body.event === "clicks") updates.clicks = existing.clicks + body.value;
    if (body.event === "engagement") updates.engagement = existing.engagement + body.value;

    await supabase
      .from("analytics_data")
      .update(updates)
      .eq("id", existing.id);
  }
}
