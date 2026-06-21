import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { createAuditLog } from "@/lib/db/audit";
import { updateContentItem, deleteContentItem, createContentVersion } from "@/lib/db/content";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: item } = await supabase
      .from("content_items")
      .select("*, brand_kits!inner(name), publication_logs(*)")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!item) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(item);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;
    const body = await request.json();

    const supabase = await createServerSupabaseClient();
    const { data: existing } = await supabase
      .from("content_items")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

    await createContentVersion(id, userId, {
      title: existing.title,
      content: existing.content,
      variantA: existing.variant_a,
      variantB: existing.variant_b,
      summary: existing.summary,
    });

    const updated = await updateContentItem(id, body);

    await createAuditLog({
      workspaceId,
      userId,
      action: "content.update",
      entityType: "ContentItem",
      entityId: id,
      metadata: { version: 1 },
    });

    return Response.json(updated);
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
      .from("content_items")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!existing) return Response.json({ error: "Not found" }, { status: 404 });

    await deleteContentItem(id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
