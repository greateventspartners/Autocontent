import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { createAuditLog } from "@/lib/db/audit";
import { getAdapter } from "@/lib/publishing";
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const rateLimitResponse = rateLimitMiddleware(`publish:${userId}`, 10, 60_000);
    if (rateLimitResponse) return rateLimitResponse;

    const { id } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: item } = await supabase
      .from("content_items")
      .select("*, brand_kits(*)")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .single();

    if (!item) return Response.json({ error: "Not found" }, { status: 404 });

    const { data: integration } = await supabase
      .from("integrations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("channel", item.channel)
      .maybeSingle();

    if (!integration?.enabled) {
      return Response.json({ error: `Channel ${item.channel} not configured` }, { status: 400 });
    }

    const adapter = getAdapter(item.channel);
    if (!adapter) {
      return Response.json({ error: `No adapter for channel: ${item.channel}` }, { status: 400 });
    }

    const configError = adapter.validate(integration.config as Record<string, unknown>);
    if (configError) {
      return Response.json({ error: `Invalid config: ${configError}` }, { status: 400 });
    }

    const result = await adapter.publish({
      config: integration.config as Record<string, unknown>,
      title: item.title,
      content: item.variant_a,
    });

    await supabase.from("publication_logs").insert({
      content_id: id,
      channel: item.channel,
      status: result.success ? "SUCCESS" : "FAILED",
      external_url: result.externalUrl ?? null,
      error: result.error ?? null,
    });

    if (result.success) {
      await supabase
        .from("content_items")
        .update({ status: "PUBLISHED", published_at: new Date().toISOString() })
        .eq("id", id);
    }

    await createAuditLog({
      workspaceId,
      userId,
      action: result.success ? "content.publish" : "content.publish.failed",
      entityType: "ContentItem",
      entityId: id,
      metadata: { channel: item.channel, error: result.error },
    });

    return Response.json(result, { status: result.success ? 200 : 502 });
  } catch (err) {
    return handleApiError(err);
  }
}
