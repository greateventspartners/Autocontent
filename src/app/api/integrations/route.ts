import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { listIntegrations, upsertIntegration } from "@/lib/db/integrations";

export async function GET() {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const integrations = await listIntegrations(workspaceId);
    return Response.json(integrations);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const body = await request.json();

    const integration = await upsertIntegration(workspaceId, body);
    return Response.json(integration);
  } catch (err) {
    return handleApiError(err);
  }
}
