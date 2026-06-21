import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { getBrandKit, updateBrandKit, deleteBrandKit } from "@/lib/db/brands";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;

    const brandKit = await getBrandKit(id);
    if (!brandKit || brandKit.workspace_id !== workspaceId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(brandKit);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { id } = await params;
    const body = await request.json();

    const existing = await getBrandKit(id);
    if (!existing || existing.workspace_id !== workspaceId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await updateBrandKit(id, body);
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

    const existing = await getBrandKit(id);
    if (!existing || existing.workspace_id !== workspaceId) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await deleteBrandKit(id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return handleApiError(err);
  }
}
