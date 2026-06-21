import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { listBrandKits, createBrandKit } from "@/lib/db/brands";

export async function GET() {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const brandKits = await listBrandKits(workspaceId);
    return Response.json(brandKits);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const body = await request.json();

    const brandKit = await createBrandKit(workspaceId, body);
    return Response.json(brandKit, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
