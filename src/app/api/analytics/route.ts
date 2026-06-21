import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") ?? "7");
    const channel = searchParams.get("channel");

    const since = new Date();
    since.setDate(since.getDate() - days);

    const supabase = await createServerSupabaseClient();
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
      (acc: { impressions: number; clicks: number; engagement: number }, curr) => ({
        impressions: acc.impressions + (curr.impressions ?? 0),
        clicks: acc.clicks + (curr.clicks ?? 0),
        engagement: acc.engagement + (curr.engagement ?? 0),
      }),
      { impressions: 0, clicks: 0, engagement: 0 }
    );

    return Response.json({
      timeseries: items,
      totals: {
        ...totals,
        ctr: totals.impressions > 0 ? parseFloat(((totals.clicks / totals.impressions) * 100).toFixed(2)) : 0,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
