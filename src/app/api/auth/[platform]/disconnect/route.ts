import { isValidPlatform, requireAuth, deletePlatformConnection } from "@/lib/oauth";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  const { platform } = await params;

  if (!isValidPlatform(platform)) {
    return Response.json({ error: "Plateforme inconnue" }, { status: 400 });
  }

  const { error, workspaceId } = await requireAuth(_request);
  if (error) {
    return Response.json({ error }, { status: 401 });
  }

  if (!workspaceId) {
    return Response.json({ error: "Aucun workspace" }, { status: 404 });
  }

  await deletePlatformConnection(workspaceId, platform);

  return Response.json({ success: true });
}
