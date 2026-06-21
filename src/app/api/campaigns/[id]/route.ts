import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { updateCampaign, deleteCampaign } from "@/lib/db/campaigns";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: existing } = await supabase
      .from("campaigns")
      .select("id, workspace_id")
      .eq("id", id)
      .single();

    if (!existing) return Response.json({ error: "Campaign not found" }, { status: 404 });
    if (existing.workspace_id !== workspaceId)
      return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const campaign = await updateCampaign(id, body);
    return Response.json(campaign);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: existing } = await supabase
      .from("campaigns")
      .select("id, workspace_id")
      .eq("id", id)
      .single();

    if (!existing) return Response.json({ error: "Campaign not found" }, { status: 404 });
    if (existing.workspace_id !== workspaceId)
      return Response.json({ error: "Forbidden" }, { status: 403 });

    await deleteCampaign(id);
    return Response.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
