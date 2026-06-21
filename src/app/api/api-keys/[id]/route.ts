import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;

    const supabase = await createServerSupabaseClient();

    const existing = await supabase
      .from("api_keys")
      .select("id")
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!existing.data) {
      return Response.json({ error: "API key not found" }, { status: 404 });
    }

    await supabase.from("api_keys").delete().eq("id", id);

    return new Response(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
