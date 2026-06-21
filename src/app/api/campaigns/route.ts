import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { listCampaigns, createCampaign } from "@/lib/db/campaigns";

export async function GET() {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const campaigns = await listCampaigns(workspaceId);
    return Response.json(campaigns);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const body = await request.json();

    if (!body.name?.trim()) {
      return Response.json({ error: "name is required" }, { status: 400 });
    }

    const campaign = await createCampaign(workspaceId, body);
    return Response.json(campaign, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
