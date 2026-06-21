import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { listRecommendations, applyRecommendation } from "@/lib/db/recommendations";

export async function GET() {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const recommendations = await listRecommendations(workspaceId);
    return Response.json(recommendations.filter((r) => !r.applied));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const body = await request.json();

    await applyRecommendation(body.id);
    return Response.json({ success: true });
  } catch (err) {
    return handleApiError(err);
  }
}
