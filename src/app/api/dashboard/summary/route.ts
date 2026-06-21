import { requireAuth } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { getServiceRoleClient } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const supabase = getServiceRoleClient();

    const { data: member } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .limit(1)
      .single();

    const workspaceId = member?.workspace_id ?? userId;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
    const nowStr = new Date().toISOString();

    const [{ count: brandKits }] = await Promise.all([
      supabase
        .from("brand_kits")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
    ]);

    const { data: contentItems } = await supabase
      .from("content_items")
      .select("status")
      .eq("workspace_id", workspaceId);

    const statusBreakdown: Record<string, number> = {};
    let totalContent = 0;
    for (const item of contentItems ?? []) {
      statusBreakdown[item.status] = (statusBreakdown[item.status] ?? 0) + 1;
      totalContent++;
    }

    const { count: scheduledCount } = await supabase
      .from("content_items")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .eq("status", "SCHEDULED")
      .gte("scheduled_date", nowStr);

    const { data: analyticsData } = await supabase
      .from("analytics_data")
      .select("impressions, clicks, engagement")
      .eq("workspace_id", workspaceId)
      .gte("date", thirtyDaysAgoStr);

    const totals = (analyticsData ?? []).reduce(
      (acc, curr) => ({
        impressions: acc.impressions + (curr.impressions ?? 0),
        clicks: acc.clicks + (curr.clicks ?? 0),
        engagement: acc.engagement + (curr.engagement ?? 0),
      }),
      { impressions: 0, clicks: 0, engagement: 0 }
    );

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, content_used, content_limit")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    const { data: recentContent } = await supabase
      .from("content_items")
      .select("id, title, status, type, updated_at")
      .eq("workspace_id", workspaceId)
      .order("updated_at", { ascending: false })
      .limit(5);

    const { data: publishLogs } = await supabase
      .from("publication_logs")
      .select("id, status, channel, attempted_at, external_url, content_id")
      .order("attempted_at", { ascending: false })
      .limit(5);

    return Response.json({
      brandKits: brandKits ?? 0,
      content: {
        total: totalContent,
        drafts: statusBreakdown["DRAFT"] ?? 0,
        scheduled: statusBreakdown["SCHEDULED"] ?? 0,
        published: statusBreakdown["PUBLISHED"] ?? 0,
        upcomingScheduled: scheduledCount ?? 0,
      },
      analytics: {
        impressions: totals.impressions,
        clicks: totals.clicks,
        engagement: totals.engagement,
      },
      subscription: sub,
      recentContent,
      recentPublications: publishLogs,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
