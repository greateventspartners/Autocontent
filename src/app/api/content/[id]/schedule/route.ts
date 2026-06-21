import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { createAuditLog } from "@/lib/db/audit";
import { updateContentItem } from "@/lib/db/content";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;
    const body = await request.json();

    const supabase = await createServerSupabaseClient();
    const { data: item } = await supabase
      .from("content_items")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!item) return Response.json({ error: "Not found" }, { status: 404 });

    const scheduledDate = body.scheduledDate
      ? new Date(body.scheduledDate).toISOString()
      : new Date(Date.now() + 86400000).toISOString();

    const updated = await updateContentItem(id, { status: "SCHEDULED", scheduledDate });

    await createAuditLog({
      workspaceId,
      userId,
      action: "content.schedule",
      entityType: "ContentItem",
      entityId: id,
      metadata: { scheduledDate },
    });

    return Response.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
