import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { updateContentItem } from "@/lib/db/content";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: item } = await supabase
      .from("content_items")
      .select("id, workspace_id")
      .eq("id", id)
      .single();

    if (!item) return Response.json({ error: "Content not found" }, { status: 404 });
    if (item.workspace_id !== workspaceId)
      return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const updateData: Record<string, any> = {};
    if (body.scheduledDate !== undefined) {
      updateData.scheduledDate = body.scheduledDate;
    }
    if (body.campaignId !== undefined) {
      updateData.campaignId = body.campaignId || null;
    }

    const updated = await updateContentItem(id, updateData);
    return Response.json(updated);
  } catch (err) {
    return handleApiError(err);
  }
}
