import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { captureAnalyticsEvent } from "@/lib/db/analytics";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const rateLimitResponse = rateLimitMiddleware(`analytics:${userId}`, 100, 60_000);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    const { contentId, channel, event, value } = body;

    if (!channel || !event || value === undefined) {
      return Response.json({ error: "channel, event, and value are required" }, { status: 400 });
    }

    const allowed = ["impressions", "clicks", "engagement"];
    if (!allowed.includes(event)) {
      return Response.json({ error: `Invalid event. Must be: ${allowed.join(", ")}` }, { status: 400 });
    }

    const today = new Date().toISOString().split("T")[0];

    const supabase = await createServerSupabaseClient();

    const { data: existing } = await supabase
      .from("analytics_data")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("channel", channel)
      .eq("date", today)
      .maybeSingle();

    if (existing) {
      const updates: any = {};
      if (event === "impressions") updates.impressions = existing.impressions + value;
      if (event === "clicks") updates.clicks = existing.clicks + value;
      if (event === "engagement") updates.engagement = existing.engagement + value;

      await supabase
        .from("analytics_data")
        .update(updates)
        .eq("id", existing.id);

      const { data: record } = await supabase
        .from("analytics_data")
        .select("*")
        .eq("id", existing.id)
        .single();

      if (record && record.impressions > 0) {
        await supabase
          .from("analytics_data")
          .update({ ctr: (record.clicks / record.impressions) * 100 })
          .eq("id", record.id);
      }
    } else {
      const insertData: any = {
        workspace_id: workspaceId,
        content_id: contentId ?? null,
        channel,
        date: today,
      };
      insertData[event] = value;
      await supabase.from("analytics_data").insert(insertData);
    }

    return Response.json({ received: true }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
