import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { createAuditLog } from "@/lib/db/audit";
import { deleteMedia } from "@/lib/db/media";
import { deleteFile } from "@/lib/r2";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;

    const supabase = await createServerSupabaseClient();
    const { data: media } = await supabase
      .from("media")
      .select("*")
      .eq("id", id)
      .single();

    if (!media) {
      return Response.json({ error: "Media not found" }, { status: 404 });
    }

    if (media.workspace_id !== workspaceId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteFile(media.key);
    await deleteMedia(id);

    await createAuditLog({
      workspaceId,
      userId,
      action: "media.delete",
      entityType: "Media",
      entityId: id,
      metadata: { fileName: media.file_name, key: media.key },
    });

    return Response.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
