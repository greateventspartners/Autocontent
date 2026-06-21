import { NextRequest } from "next/server";
import { requireAuth, requireWorkspace } from "@/lib/supabase-server";
import { handleApiError } from "@/lib/errors";
import { createAuditLog } from "@/lib/db/audit";
import { uploadFile } from "@/lib/r2";
import { listMedia, createMedia } from "@/lib/db/media";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { workspaceId } = await requireWorkspace();
    const { searchParams } = new URL(request.url);
    const brandKitId = searchParams.get("brandKitId") ?? undefined;

    const media = await listMedia(workspaceId, brandKitId);
    return Response.json(media);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { workspaceId } = await requireWorkspace();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const brandKitId = (formData.get("brandKitId") as string | null) || undefined;

    if (!file) {
      return Response.json({ error: "File is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "application/octet-stream";
    const fileName = file.name;

    const stored = await uploadFile(buffer, fileName, mimeType, workspaceId);

    const media = await createMedia(workspaceId, {
      brandKitId,
      fileName,
      key: stored.key,
      url: stored.url,
      mimeType,
      size: stored.size,
    });

    await createAuditLog({
      workspaceId,
      userId,
      action: "media.upload",
      entityType: "Media",
      entityId: media.id,
      metadata: { fileName, size: stored.size, mimeType },
    });

    return Response.json(media, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
