import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { listContentVersions } from "@/lib/db/content";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const contentId = request.nextUrl.searchParams.get("contentId");
    if (!contentId) return Response.json({ error: "contentId required" }, { status: 400 });

    const supabase = await createServerSupabaseClient();
    const { data: item } = await supabase
      .from("content_items")
      .select("id")
      .eq("id", contentId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!item) return Response.json({ error: "Not found" }, { status: 404 });

    const versions = await listContentVersions(contentId);
    return Response.json(versions);
  } catch (err) {
    return handleApiError(err);
  }
}
