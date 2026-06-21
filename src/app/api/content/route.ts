import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace, createServerSupabaseClient } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { listContentItems, createContentItem } from "@/lib/db/content";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") ?? undefined;
    const channel = searchParams.get("channel") ?? undefined;
    const brandKitId = searchParams.get("brandKitId") ?? undefined;
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const result = await listContentItems(workspaceId, { status, channel, brandKitId, page, limit });
    return Response.json(result);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const body = await request.json();

    const content = await createContentItem(workspaceId, body);
    return Response.json(content, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
